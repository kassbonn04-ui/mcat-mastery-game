/**
 * Zelda-like top-down exploration for Arcanum.
 * Walk the castle, talk to NPCs, loot chests, step on seals to start MCAT trials.
 */
(function () {
  const TILE_CHARS = {
    "#": "wall",
    ".": "floor",
    "~": "grass",
    "=": "path",
    "^": "torch",
    D: "floor",
    S: "floor",
    C: "floor",
    N: "floor",
    L: "floor",
    "@": "floor",
  };

  function ensureExplore(state) {
    if (!state.explore) {
      state.explore = {
        mapId: "courtyard",
        x: 12,
        y: 16,
        facing: "down",
        xp: 0,
        level: 1,
        bonds: { elowen: 0, cassian: 0, bramble: 0, lyra: 0 },
        foundLore: [],
        openedChests: [],
        talkedNpc: {},
      };
    }
    return state.explore;
  }

  function xpToLevel(xp) {
    return 1 + Math.floor(xp / 40);
  }

  class ExploreSession {
    constructor(host, state, hooks) {
      this.host = host;
      this.state = state;
      this.hooks = hooks || {};
      this.ex = ensureExplore(state);
      this.keys = {};
      this.stick = { x: 0, y: 0, active: false };
      this.nearby = null;
      this.toast = "";
      this.toastT = 0;
      this.dialog = null;
      this.particles = [];
      this.time = 0;
      this.raf = 0;
      this.running = false;
      this.loadMap(this.ex.mapId || "courtyard", false);
    }

    loadMap(mapId, useSpawn = true) {
      const map = window.EXPLORE_MAPS[mapId];
      if (!map) return;
      this.map = map;
      this.grid = map.rows.map((r) => r.split(""));
      this.h = this.grid.length;
      this.w = this.grid[0].length;
      this.tile = map.tile || 40;
      this.entities = (map.entities || []).map((e) => ({
        ...e,
        ox: e.x,
        oy: e.y,
        phase: Math.random() * Math.PI * 2,
      }));
      if (useSpawn) {
        const sp = map.spawn || { x: 2, y: 2 };
        this.ex.x = sp.x;
        this.ex.y = sp.y;
      }
      this.ex.mapId = mapId;
      this.persist();
    }

    persist() {
      this.ex.level = xpToLevel(this.ex.xp);
      if (this.hooks.onState) this.hooks.onState(this.state);
    }

    start() {
      this.buildDom();
      this.bindInput();
      this.running = true;
      this.loop(performance.now());
      if (window.GameMusic?.playCue && this.map.musicCue) {
        window.GameMusic.playCue(this.map.musicCue);
      }
    }

    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      window.removeEventListener("keydown", this._kd);
      window.removeEventListener("keyup", this._ku);
    }

    buildDom() {
      this.host.innerHTML = "";
      this.host.className = "explore-root";
      this.host.innerHTML = `
        <canvas class="explore-canvas"></canvas>
        <div class="explore-hud">
          <div class="explore-stats">
            <span data-ex-level></span>
            <span data-ex-map></span>
            <span data-ex-hint></span>
          </div>
          <button type="button" class="pill explore-pause" data-pause>Pause</button>
        </div>
        <div class="explore-toast" data-toast hidden></div>
        <div class="explore-dialog glass" data-dialog hidden>
          <div class="explore-dialog-name" data-dname></div>
          <p class="explore-dialog-text" data-dtext></p>
          <button type="button" class="btn primary" data-dclose>Continue walking</button>
        </div>
        <div class="joystick" data-joystick>
          <div class="joystick-knob" data-knob></div>
        </div>
        <button type="button" class="explore-interact btn cast" data-interact hidden>Interact</button>
      `;
      this.canvas = this.host.querySelector("canvas");
      this.ctx = this.canvas.getContext("2d");
      this.elToast = this.host.querySelector("[data-toast]");
      this.elDialog = this.host.querySelector("[data-dialog]");
      this.elInteract = this.host.querySelector("[data-interact]");
      this.elLevel = this.host.querySelector("[data-ex-level]");
      this.elMap = this.host.querySelector("[data-ex-map]");
      this.elHint = this.host.querySelector("[data-ex-hint]");
      this.joystick = this.host.querySelector("[data-joystick]");
      this.knob = this.host.querySelector("[data-knob]");

      this.host.querySelector("[data-pause]").onclick = () => {
        this.hooks.onPause?.(this.state);
      };
      this.host.querySelector("[data-dclose]").onclick = () => {
        this.dialog = null;
        this.elDialog.hidden = true;
      };
      this.elInteract.onclick = () => this.tryInteract();

      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.bindJoystick();
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = this.host.clientWidth || window.innerWidth;
      const h = this.host.clientHeight || window.innerHeight;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.viewW = w;
      this.viewH = h;
    }

    bindInput() {
      this._kd = (e) => {
        this.keys[e.key.toLowerCase()] = true;
        if (e.key === "e" || e.key === "E" || e.key === " ") {
          e.preventDefault();
          this.tryInteract();
        }
        if (e.key === "Escape") this.hooks.onPause?.(this.state);
      };
      this._ku = (e) => {
        this.keys[e.key.toLowerCase()] = false;
      };
      window.addEventListener("keydown", this._kd);
      window.addEventListener("keyup", this._ku);
    }

    bindJoystick() {
      const joy = this.joystick;
      const knob = this.knob;
      const setStick = (clientX, clientY) => {
        const rect = joy.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = clientX - cx;
        let dy = clientY - cy;
        const max = rect.width * 0.35;
        const len = Math.hypot(dx, dy) || 1;
        if (len > max) {
          dx = (dx / len) * max;
          dy = (dy / len) * max;
        }
        this.stick.x = dx / max;
        this.stick.y = dy / max;
        this.stick.active = true;
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
      };
      const clear = () => {
        this.stick.x = 0;
        this.stick.y = 0;
        this.stick.active = false;
        knob.style.transform = "translate(0,0)";
      };
      const onDown = (e) => {
        e.preventDefault();
        const t = e.touches ? e.touches[0] : e;
        setStick(t.clientX, t.clientY);
      };
      const onMove = (e) => {
        if (!this.stick.active && !(e.buttons || e.touches)) return;
        e.preventDefault();
        const t = e.touches ? e.touches[0] : e;
        if (!t) return;
        setStick(t.clientX, t.clientY);
      };
      joy.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", clear);
      joy.addEventListener("touchstart", onDown, { passive: false });
      joy.addEventListener("touchmove", onMove, { passive: false });
      joy.addEventListener("touchend", clear);
    }

    solid(tx, ty) {
      if (ty < 0 || tx < 0 || ty >= this.h || tx >= this.w) return true;
      return this.grid[ty][tx] === "#";
    }

    tryMove(nx, ny) {
      const r = 0.28;
      const samples = [
        [nx - r, ny - r],
        [nx + r, ny - r],
        [nx - r, ny + r],
        [nx + r, ny + r],
      ];
      for (const [sx, sy] of samples) {
        if (this.solid(Math.floor(sx), Math.floor(sy))) return false;
      }
      this.ex.x = nx;
      this.ex.y = ny;
      return true;
    }

    inputVector() {
      let ix = this.stick.x;
      let iy = this.stick.y;
      if (this.keys.w || this.keys.arrowup) iy -= 1;
      if (this.keys.s || this.keys.arrowdown) iy += 1;
      if (this.keys.a || this.keys.arrowleft) ix -= 1;
      if (this.keys.d || this.keys.arrowright) ix += 1;
      const len = Math.hypot(ix, iy);
      if (len > 1) {
        ix /= len;
        iy /= len;
      }
      return { ix, iy };
    }

    update(dt) {
      this.time += dt;
      if (this.dialog) return;

      const { ix, iy } = this.inputVector();
      const speed = 3.4;
      if (ix || iy) {
        if (Math.abs(ix) > Math.abs(iy)) this.ex.facing = ix > 0 ? "right" : "left";
        else this.ex.facing = iy > 0 ? "down" : "up";
        const nx = this.ex.x + ix * speed * dt;
        const ny = this.ex.y + iy * speed * dt;
        if (!this.tryMove(nx, this.ex.y)) this.tryMove(this.ex.x, ny);
        else this.tryMove(this.ex.x, ny);
        // footstep particles
        if (Math.random() < 0.15) {
          this.particles.push({
            x: this.ex.x,
            y: this.ex.y + 0.3,
            life: 0.4,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 0.2,
          });
        }
      }

      // NPC wander
      for (const e of this.entities) {
        if (e.type === "npc" && e.wander) {
          e.phase += dt;
          e.x = e.ox + Math.sin(e.phase * 0.7) * 0.55;
          e.y = e.oy + Math.cos(e.phase * 0.5) * 0.35;
        }
      }

      this.particles = this.particles.filter((p) => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        return p.life > 0;
      });

      // ambient sparkles near seals
      if (Math.random() < 0.08) {
        const seals = this.entities.filter((e) => e.type === "seal");
        const s = seals[Math.floor(Math.random() * seals.length)];
        if (s) {
          this.particles.push({
            x: s.x + (Math.random() - 0.5),
            y: s.y + (Math.random() - 0.5),
            life: 1.2,
            vx: 0,
            vy: -0.4,
            glow: s.glow || "#d4a84b",
          });
        }
      }

      this.nearby = this.findNearby();
      this.elInteract.hidden = !this.nearby;
      if (this.nearby) {
        this.elInteract.textContent = this.interactLabel(this.nearby);
      }

      if (this.toastT > 0) {
        this.toastT -= dt;
        if (this.toastT <= 0) {
          this.elToast.hidden = true;
        }
      }

      this.elLevel.textContent = `Lv ${this.ex.level} · ${this.ex.xp} XP`;
      this.elMap.textContent = this.map.name;
      this.elHint.textContent = this.nearby
        ? "Tap Interact / press E"
        : "WASD · joystick · explore freely";
    }

    findNearby() {
      let best = null;
      let bestD = 1.15;
      for (const e of this.entities) {
        if (e.type === "npc" || e.type === "door" || e.type === "seal" || e.type === "chest" || e.type === "lore") {
          const d = Math.hypot(e.x - this.ex.x, e.y - this.ex.y);
          if (d < bestD) {
            bestD = d;
            best = e;
          }
        }
      }
      return best;
    }

    interactLabel(e) {
      if (e.type === "npc") return "Talk";
      if (e.type === "door") return e.label || "Enter";
      if (e.type === "seal") return "Challenge seal";
      if (e.type === "chest") return "Open chest";
      if (e.type === "lore") return "Read";
      return "Interact";
    }

    showToast(msg) {
      this.toast = msg;
      this.toastT = 3.2;
      this.elToast.hidden = false;
      this.elToast.textContent = msg;
    }

    gainXp(n) {
      this.ex.xp += n;
      const before = this.ex.level;
      this.ex.level = xpToLevel(this.ex.xp);
      this.persist();
      if (this.ex.level > before) {
        this.showToast(`Scholar level up — Lv ${this.ex.level}!`);
      }
    }

    tryInteract() {
      const e = this.nearby;
      if (!e || this.dialog) return;

      if (e.type === "npc") {
        window.GameMusic?.playUi?.("select");
        this.talkNpc(e);
        return;
      }
      if (e.type === "door") {
        window.GameMusic?.playUi?.("door");
        this.useDoor(e);
        return;
      }
      if (e.type === "chest") {
        window.GameMusic?.playUi?.("select");
        this.openChest(e);
        return;
      }
      if (e.type === "lore") {
        window.GameMusic?.playUi?.("click");
        this.readLore(e);
        return;
      }
      if (e.type === "seal") {
        window.GameMusic?.playUi?.("whoosh");
        this.useSeal(e);
      }
    }

    talkNpc(e) {
      let lines = e.lines || ["…"];
      if (e.charId === "_companion") {
        const c = window.CAMPAIGN?.companions?.[this.state.companionId];
        if (c?.lines?.explore) lines = c.lines.explore;
        else if (c) {
          lines = [
            `${c.name}: Keep walking. Seals are only part of the year.`,
            `I'm with you in the halls — not just in the trial chambers.`,
          ];
        }
      }
      const idx = this.ex.talkedNpc[e.id] || 0;
      const text = lines[idx % lines.length];
      this.ex.talkedNpc[e.id] = idx + 1;
      if (e.bond && this.ex.bonds[e.bond] != null) {
        this.ex.bonds[e.bond] = Math.min(100, (this.ex.bonds[e.bond] || 0) + 4);
      }
      if (idx === 0 && e.xp) this.gainXp(e.xp);
      this.persist();

      const name =
        e.charId === "_companion"
          ? window.CAMPAIGN?.companions?.[this.state.companionId]?.name || "Companion"
          : window.CAMPAIGN?.characters?.[e.charId]?.name || "Someone";

      this.dialog = { name, text };
      this.elDialog.hidden = false;
      this.host.querySelector("[data-dname]").textContent = name;
      this.host.querySelector("[data-dtext]").textContent = text;
    }

    useDoor(e) {
      if (e.requiresWorld && !this.state.unlockedWorlds?.includes(e.requiresWorld)) {
        this.showToast(e.lockedText || "Sealed.");
        return;
      }
      if (e.requiresCleared && !this.state.clearedLevels?.includes(e.requiresCleared)) {
        this.showToast(e.lockedText || "Not yet.");
        return;
      }
      this.loadMap(e.targetMap, false);
      if (e.targetSpawn) {
        this.ex.x = e.targetSpawn.x;
        this.ex.y = e.targetSpawn.y;
      }
      this.persist();
      this.showToast(e.label || "Entered");
    }

    openChest(e) {
      if (this.ex.openedChests.includes(e.id)) {
        this.showToast("Already looted.");
        return;
      }
      this.ex.openedChests.push(e.id);
      if (e.loot && !this.state.inventory.includes(e.loot)) {
        this.state.inventory.push(e.loot);
      }
      if (e.loot === "rival_charm") {
        this.ex.bonds.cassian = Math.min(100, (this.ex.bonds.cassian || 0) + 12);
      }
      if (e.xp) this.gainXp(e.xp);
      this.persist();
      this.dialog = { name: "Chest", text: e.text || "You found something." };
      this.elDialog.hidden = false;
      this.host.querySelector("[data-dname]").textContent = "Chest";
      this.host.querySelector("[data-dtext]").textContent = e.text || "Loot!";
    }

    readLore(e) {
      if (!this.ex.foundLore.includes(e.loreId)) {
        this.ex.foundLore.push(e.loreId);
        if (e.xp) this.gainXp(e.xp);
        this.persist();
      }
      this.dialog = { name: e.title || "Lore", text: e.text };
      this.elDialog.hidden = false;
      this.host.querySelector("[data-dname]").textContent = e.title || "Lore";
      this.host.querySelector("[data-dtext]").textContent = e.text;
    }

    useSeal(e) {
      if (e.requiresCleared && !this.state.clearedLevels?.includes(e.requiresCleared)) {
        this.showToast("This seal still sleeps. Clear the prior trial first.");
        return;
      }
      this.persist();
      this.hooks.onSeal?.(e, this.state);
    }

    draw() {
      const ctx = this.ctx;
      const t = this.tile;
      const camX = this.ex.x * t - this.viewW / 2;
      const camY = this.ex.y * t - this.viewH / 2;

      ctx.clearRect(0, 0, this.viewW, this.viewH);
      // vignette base
      ctx.fillStyle = "#0b120e";
      ctx.fillRect(0, 0, this.viewW, this.viewH);

      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < this.w; x++) {
          const ch = this.grid[y][x];
          const kind = TILE_CHARS[ch] || "floor";
          const px = x * t - camX;
          const py = y * t - camY;
          if (px < -t || py < -t || px > this.viewW + t || py > this.viewH + t) continue;
          this.drawTile(ctx, px, py, t, kind, x, y);
        }
      }

      // entities
      const sorted = this.entities.slice().sort((a, b) => a.y - b.y);
      for (const e of sorted) {
        const px = e.x * t - camX;
        const py = e.y * t - camY;
        this.drawEntity(ctx, e, px, py, t);
      }

      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.glow || "rgba(212,168,75,0.7)";
        ctx.beginPath();
        ctx.arc(p.x * t - camX, p.y * t - camY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      this.drawPlayer(ctx, this.ex.x * t - camX, this.ex.y * t - camY, t);

      // edge vignette
      const g = ctx.createRadialGradient(
        this.viewW / 2,
        this.viewH / 2,
        this.viewH * 0.2,
        this.viewW / 2,
        this.viewH / 2,
        this.viewH * 0.75
      );
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }

    drawTile(ctx, px, py, t, kind, x, y) {
      if (kind === "wall") {
        ctx.fillStyle = "#1a261c";
        ctx.fillRect(px, py, t, t);
        ctx.fillStyle = "#2a3a2e";
        ctx.fillRect(px + 2, py + 2, t - 4, t - 10);
        ctx.fillStyle = "#0e1610";
        ctx.fillRect(px, py + t - 8, t, 8);
        return;
      }
      if (kind === "grass") {
        ctx.fillStyle = (x + y) % 2 ? "#1e3d28" : "#234830";
        ctx.fillRect(px, py, t, t);
        ctx.fillStyle = "rgba(120,180,90,0.25)";
        ctx.fillRect(px + 8, py + 10, 4, 4);
        return;
      }
      if (kind === "path") {
        ctx.fillStyle = "#3a3428";
        ctx.fillRect(px, py, t, t);
        ctx.strokeStyle = "rgba(212,168,75,0.15)";
        ctx.strokeRect(px + 0.5, py + 0.5, t - 1, t - 1);
        return;
      }
      if (kind === "torch") {
        ctx.fillStyle = "#243028";
        ctx.fillRect(px, py, t, t);
        const flicker = 0.5 + Math.sin(this.time * 8 + x) * 0.2;
        ctx.fillStyle = `rgba(255,180,60,${flicker})`;
        ctx.beginPath();
        ctx.arc(px + t / 2, py + t / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      // floor
      ctx.fillStyle = (x + y) % 2 ? "#2a332c" : "#313b34";
      ctx.fillRect(px, py, t, t);
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.strokeRect(px, py, t, t);
    }

    drawEntity(ctx, e, px, py, t) {
      if (e.type === "seal") {
        const pulse = 0.55 + Math.sin(this.time * 3) * 0.25;
        ctx.strokeStyle = e.glow || "#d4a84b";
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, t * 0.42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, py, t * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = e.glow || "#d4a84b";
        ctx.font = "bold 10px Cinzel, serif";
        ctx.textAlign = "center";
        ctx.fillText("SEAL", px, py - t * 0.55);
        return;
      }
      if (e.type === "chest") {
        const open = this.ex.openedChests.includes(e.id);
        ctx.fillStyle = open ? "#4a4030" : "#c4a35a";
        ctx.fillRect(px - 12, py - 10, 24, 18);
        ctx.fillStyle = "#2a2218";
        ctx.fillRect(px - 12, py - 2, 24, 4);
        if (!open) {
          ctx.fillStyle = "#d4a84b";
          ctx.fillRect(px - 3, py - 6, 6, 6);
        }
        return;
      }
      if (e.type === "lore") {
        ctx.fillStyle = "#e8d5a3";
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.sin(this.time * 2) * 0.1);
        ctx.fillRect(-8, -10, 16, 14);
        ctx.restore();
        return;
      }
      if (e.type === "door") {
        ctx.fillStyle = "#5a3a22";
        ctx.fillRect(px - 14, py - 18, 28, 30);
        ctx.fillStyle = "#d4a84b";
        ctx.beginPath();
        ctx.arc(px + 6, py, 3, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      if (e.type === "npc") {
        this.drawActor(ctx, px, py, t, e.color || "#888", e.charId === "_companion");
        // nameplate
        const nm =
          e.charId === "_companion"
            ? "Companion"
            : (window.CAMPAIGN?.characters?.[e.charId]?.name || "").split(" ")[0];
        if (nm) {
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(px - 28, py - 34, 56, 14);
          ctx.fillStyle = "#f0d48a";
          ctx.font = "11px Cinzel, serif";
          ctx.textAlign = "center";
          ctx.fillText(nm, px, py - 24);
        }
      }
    }

    drawActor(ctx, px, py, t, color, isPlayerLike) {
      const bob = Math.sin(this.time * 6) * (isPlayerLike ? 0 : 1.5);
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(px, py + 10, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // body
      ctx.fillStyle = color;
      ctx.fillRect(px - 10, py - 22 + bob, 20, 26);
      // head
      ctx.fillStyle = "#e8c4a0";
      ctx.beginPath();
      ctx.arc(px, py - 26 + bob, 8, 0, Math.PI * 2);
      ctx.fill();
      // cloak flourish
      ctx.strokeStyle = "rgba(240,212,138,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 8, py - 8 + bob);
      ctx.quadraticCurveTo(px - 16, py + 4 + bob, px - 6, py + 8 + bob);
      ctx.stroke();
    }

    drawPlayer(ctx, px, py, t) {
      const moving = this.stick.active || this.keys.w || this.keys.a || this.keys.s || this.keys.d;
      const bob = moving ? Math.sin(this.time * 12) * 2 : 0;
      // wand glow
      ctx.strokeStyle = "rgba(212,168,75,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 8, py - 10 + bob);
      ctx.lineTo(px + 18, py - 22 + bob);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,220,120,0.9)";
      ctx.beginPath();
      ctx.arc(px + 18, py - 22 + bob, 3 + Math.sin(this.time * 5), 0, Math.PI * 2);
      ctx.fill();

      this.drawActor(ctx, px, py + bob, t, "#2f5d3a", true);

      // facing indicator
      ctx.fillStyle = "#f0d48a";
      const f = this.ex.facing;
      const fx = f === "left" ? -14 : f === "right" ? 14 : 0;
      const fy = f === "up" ? -30 : f === "down" ? 12 : -8;
      ctx.beginPath();
      ctx.arc(px + fx * 0.3, py + fy * 0.15, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    loop(now) {
      if (!this.running) return;
      const t = now / 1000;
      const dt = Math.min(0.05, t - (this._last || t));
      this._last = t;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }
  }

  window.ExploreGame = {
    ensureExplore,
    xpToLevel,
    start(host, state, hooks) {
      const session = new ExploreSession(host, state, hooks);
      session.start();
      return session;
    },
  };
})();
