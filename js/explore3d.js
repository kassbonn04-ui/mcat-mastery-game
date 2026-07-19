/**
 * First-person 3D Arcanum — Skyrim-like web exploration (Three.js).
 * Not AAA photoreal, but a real 3D walkable world (not a 2D board).
 */
(function () {
  function ensureExplore(state) {
    if (!state.explore) {
      state.explore = {
        mapId: "courtyard",
        x: 0,
        y: 1.65,
        z: 14,
        facing: "down",
        yaw: 0,
        pitch: 0,
        xp: 0,
        level: 1,
        bonds: { elowen: 0, cassian: 0, bramble: 0, lyra: 0 },
        foundLore: [],
        openedChests: [],
        talkedNpc: {},
      };
    }
    if (!state.explore.embers) {
      /* noop — runtime only */
    }
    // migrate 2D tile coords → 3D if still on old save
    if (state.explore.mapId && state.explore.z == null) {
      state.explore.mapId = "courtyard";
      state.explore.x = 0;
      state.explore.y = 1.65;
      state.explore.z = 14;
      state.explore.yaw = 0;
      state.explore.pitch = 0;
    }
    return state.explore;
  }

  function xpToLevel(xp) {
    return 1 + Math.floor(xp / 40);
  }

  class Explore3DSession {
    constructor(host, state, hooks) {
      this.host = host;
      this.state = state;
      this.hooks = hooks || {};
      this.ex = ensureExplore(state);
      this.THREE = window.THREE;
      if (!this.THREE) throw new Error("Three.js failed to load");

      this.keys = {};
      this.stick = { x: 0, y: 0, active: false };
      this.look = { active: false, lx: 0, ly: 0, id: null };
      this.colliders = [];
      this.interactables = [];
      this.dynamic = [];
      this.embers = [];
      this.billboards = [];
      this._emberWorld = new this.THREE.Vector3();
      this.nearby = null;
      this.dialog = null;
      this.toastT = 0;
      this.running = false;
      this.raf = 0;
      this.clock = new this.THREE.Clock();
      this.worldId = this.ex.mapId || "courtyard";
      if (!window.EXPLORE3D_WORLDS[this.worldId]) this.worldId = "courtyard";
    }

    start() {
      this.buildDom();
      this.initRenderer();
      this.loadWorld(this.worldId, false);
      this.bindInput();
      this.running = true;
      this.clock.start();
      this.loop();
      if (window.GameMusic?.playCue) {
        const cue = window.EXPLORE3D_WORLDS[this.worldId]?.musicCue;
        if (cue) window.GameMusic.playCue(cue);
      }
    }

    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      window.removeEventListener("keydown", this._kd);
      window.removeEventListener("keyup", this._ku);
      window.removeEventListener("resize", this._onResize);
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.domElement.remove();
      }
    }

    buildDom() {
      this.host.innerHTML = "";
      this.host.className = "explore-root explore-3d";
      this.host.innerHTML = `
        <div class="explore3d-viewport" data-viewport></div>
        <div class="crosshair" aria-hidden="true"></div>
        <div class="explore-hud">
          <div class="explore-stats">
            <span data-ex-level></span>
            <span data-ex-map></span>
            <span data-ex-hint></span>
            <div class="quest-pips" data-quest-pips hidden></div>
          </div>
          <button type="button" class="pill explore-pause" data-pause>Pause</button>
        </div>
        <div class="explore-toast" data-toast hidden></div>
        <div class="explore-dialog glass" data-dialog hidden>
          <div class="explore-dialog-name" data-dname></div>
          <p class="explore-dialog-text" data-dtext></p>
          <button type="button" class="btn primary" data-dclose>Continue</button>
        </div>
        <div class="joystick" data-joystick><div class="joystick-knob" data-knob></div></div>
        <div class="look-pad" data-lookpad></div>
        <button type="button" class="explore-interact btn cast" data-interact hidden>Interact</button>
      `;
      this.viewport = this.host.querySelector("[data-viewport]");
      this.elToast = this.host.querySelector("[data-toast]");
      this.elDialog = this.host.querySelector("[data-dialog]");
      this.elInteract = this.host.querySelector("[data-interact]");
      this.elLevel = this.host.querySelector("[data-ex-level]");
      this.elMap = this.host.querySelector("[data-ex-map]");
      this.elHint = this.host.querySelector("[data-ex-hint]");
      this.joystick = this.host.querySelector("[data-joystick]");
      this.knob = this.host.querySelector("[data-knob]");
      this.lookPad = this.host.querySelector("[data-lookpad]");

      this.host.querySelector("[data-pause]").onclick = () => {
        this.persist();
        this.hooks.onPause?.(this.state);
      };
      this.host.querySelector("[data-dclose]").onclick = () => {
        this.dialog = null;
        this.elDialog.hidden = true;
      };
      this.elInteract.onclick = () => this.tryInteract();
      this.bindJoystick();
      this.bindLook();
    }

    initRenderer() {
      const THREE = this.THREE;
      const w = this.host.clientWidth || window.innerWidth;
      const h = this.host.clientHeight || window.innerHeight;
      this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h);
      this.renderer.shadowMap.enabled = w > 700;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.75;
      this.embers = [];
      this.billboards = [];
      this.questMeshes = [];
      this.viewport.appendChild(this.renderer.domElement);

      this.camera = new THREE.PerspectiveCamera(70, w / h, 0.08, 120);
      this.scene = new THREE.Scene();

      this._onResize = () => {
        const ww = this.host.clientWidth || window.innerWidth;
        const hh = this.host.clientHeight || window.innerHeight;
        this.camera.aspect = ww / hh;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(ww, hh);
      };
      window.addEventListener("resize", this._onResize);
    }

    clearWorld() {
      while (this.scene.children.length) {
        const o = this.scene.children[0];
        this.scene.remove(o);
      }
      this.colliders = [];
      this.interactables = [];
      this.dynamic = [];
      this.billboards = [];
      this.embers = [];
      this.questMeshes = [];
    }

    loadWorld(worldId, useSpawn = true) {
      const def = window.EXPLORE3D_WORLDS[worldId];
      if (!def) return;
      this.worldId = worldId;
      this.ex.mapId = worldId;
      this.clearWorld();
      this.scene.background = new this.THREE.Color(def.fog.color);
      this.scene.fog = new this.THREE.Fog(def.fog.color, def.fog.near, def.fog.far);

      this.buildLighting(def);
      if (worldId === "courtyard") this.buildCourtyard();
      else if (worldId === "asphodel") this.buildAsphodelHall();
      else if (worldId === "asphodel-deep") this.buildReliquary();
      else if (worldId === "mercury") this.buildMercury();
      else this.buildCourtyard();

      this.spawnInteractables(def.interactables || []);
      this.spawnQuestTrail();
      this.scatterMysticalProps(worldId);

      if (useSpawn || this.ex.z == null) {
        const sp = def.spawn;
        this.ex.x = sp.x;
        this.ex.y = sp.y;
        this.ex.z = sp.z;
        this.ex.yaw = def.yaw != null ? def.yaw : 0;
        this.ex.pitch = 0;
      }
      // Pull player near active quest seal
      const aq = this.state.activeQuest;
      if (aq && aq.mapId === worldId) {
        const path = window.Quest.sealPath(worldId, aq.questionIds.length);
        const p = path[aq.index] || path[0];
        if (p) {
          this.ex.x = p[0];
          this.ex.z = p[2] + 2.5;
          this.ex.yaw = 0;
        }
        this.showToast(
          `${aq.title} — Ward ${aq.index + 1}/${aq.questionIds.length} · follow the fire`
        );
      } else {
        this.showToast(def.name);
      }
      this.syncCamera();
      this.persist();
      if (window.GameMusic?.playCue && def.musicCue) {
        window.GameMusic.playCue(def.musicCue);
      }
    }

    buildLighting(def) {
      const THREE = this.THREE;
      const amb = new THREE.AmbientLight(def.ambient, 1.45);
      this.scene.add(amb);
      const hemi = new THREE.HemisphereLight(
        def.hemi.sky,
        def.hemi.ground,
        (def.hemi.intensity || 1) * 1.25
      );
      this.scene.add(hemi);
      const sun = new THREE.DirectionalLight(def.sun.color, def.sun.intensity * 1.15);
      sun.position.set(...def.sun.pos);
      sun.castShadow = this.renderer.shadowMap.enabled;
      if (sun.castShadow) {
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 60;
        sun.shadow.camera.left = -25;
        sun.shadow.camera.right = 25;
        sun.shadow.camera.top = 25;
        sun.shadow.camera.bottom = -25;
      }
      this.scene.add(sun);
      // Warm + cool fills — torchlit fantasy, not cave Minecraft
      const fill = new THREE.DirectionalLight(0xffc07a, 0.75);
      fill.position.set(-12, 10, 8);
      this.scene.add(fill);
      const rim = new THREE.DirectionalLight(0xaaccff, 0.35);
      rim.position.set(8, 6, -10);
      this.scene.add(rim);
    }

    matStone(hex = 0x3a433c) {
      return new this.THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.88,
        metalness: 0.08,
      });
    }

    matWood(hex = 0x5a3a22) {
      return new this.THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.75,
        metalness: 0.05,
      });
    }

    addBox(w, h, d, x, y, z, mat, collides = true) {
      const THREE = this.THREE;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      if (collides) {
        this.colliders.push({
          min: { x: x - w / 2, y: y - h / 2, z: z - d / 2 },
          max: { x: x + w / 2, y: y + h / 2, z: z + d / 2 },
        });
      }
      return mesh;
    }

    addTorch(x, y, z) {
      const THREE = this.THREE;
      const bracket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 0.9, 8),
        this.matWood(0x6a4020)
      );
      bracket.position.set(x, y + 1.1, z);
      this.scene.add(bracket);
      const flame = new THREE.PointLight(0xffb060, 2.8, 14, 1.6);
      flame.position.set(x, y + 1.65, z);
      this.scene.add(flame);
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        new THREE.MeshStandardMaterial({
          color: 0xffee88,
          emissive: 0xff6600,
          emissiveIntensity: 3.5,
        })
      );
      core.position.copy(flame.position);
      this.scene.add(core);
      const outer = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.45, 8),
        new THREE.MeshStandardMaterial({
          color: 0xff4400,
          emissive: 0xff2200,
          emissiveIntensity: 2.2,
          transparent: true,
          opacity: 0.85,
        })
      );
      outer.position.set(x, y + 1.85, z);
      this.scene.add(outer);
      this.dynamic.push({
        kind: "torch",
        light: flame,
        core,
        outer,
        t: Math.random() * 10,
      });
      return bracket;
    }

    addFireBasin(x, z) {
      const THREE = this.THREE;
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.7, 0.45, 16),
        this.matStone(0x4a4038)
      );
      bowl.position.set(x, 0.25, z);
      bowl.castShadow = true;
      this.scene.add(bowl);
      const fire = new THREE.PointLight(0xff9030, 3.5, 16, 1.4);
      fire.position.set(x, 1.1, z);
      this.scene.add(fire);
      const blaze = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0xffcc66,
          emissive: 0xff5500,
          emissiveIntensity: 4,
        })
      );
      blaze.position.set(x, 0.95, z);
      this.scene.add(blaze);
      this.dynamic.push({ kind: "basin", light: fire, blaze, x, z, t: Math.random() * 8 });
      // collider
      this.colliders.push({
        min: { x: x - 0.6, y: 0, z: z - 0.6 },
        max: { x: x + 0.6, y: 1.2, z: z + 0.6 },
      });
    }

    addCrystal(x, z, color = 0x88ffcc) {
      const THREE = this.THREE;
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.85,
        roughness: 0.15,
        metalness: 0.4,
        transparent: true,
        opacity: 0.92,
      });
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), mat);
      crystal.position.y = 0.9;
      g.add(crystal);
      const glow = new THREE.PointLight(color, 1.2, 7);
      glow.position.y = 1;
      g.add(glow);
      g.position.set(x, 0, z);
      this.scene.add(g);
      this.dynamic.push({ kind: "crystal", mesh: g, crystal, t: Math.random() * 5 });
    }

    scatterMysticalProps(worldId) {
      if (worldId === "courtyard") {
        this.addFireBasin(-5, 5);
        this.addFireBasin(5, 5);
        this.addFireBasin(0, -7);
        this.addFireBasin(-8, -4);
        this.addFireBasin(8, -4);
        this.addCrystal(-7, 0, 0xffdd88);
        this.addCrystal(7, 0, 0x88ddff);
        this.addCrystal(0, -9, 0xaaffcc);
        this.spawnFireflies(36, 16);
      } else if (worldId === "asphodel") {
        this.addFireBasin(-2.5, 5);
        this.addFireBasin(2.5, 5);
        this.addFireBasin(0, -4);
        this.addFireBasin(-4, 2);
        this.addFireBasin(4, 2);
        this.addCrystal(-4, -3, 0xffcc66);
        this.addCrystal(4, -3, 0x66ffaa);
        this.spawnFireflies(28, 10);
      } else {
        this.addFireBasin(0, 2);
        this.addFireBasin(-2, -2);
        this.addFireBasin(2, -2);
        this.addCrystal(-2, -1, 0xaaddff);
        this.addCrystal(2, -1, 0xffaa66);
        this.spawnFireflies(22, 8);
      }
    }

    spawnFireflies(count, radius) {
      const THREE = this.THREE;
      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 6, 6),
          new THREE.MeshBasicMaterial({
            color: i % 3 === 0 ? 0xffcc66 : i % 3 === 1 ? 0xaaffcc : 0xff8866,
            transparent: true,
            opacity: 0.85,
          })
        );
        const ang = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        mesh.position.set(Math.cos(ang) * r, 0.8 + Math.random() * 2.5, Math.sin(ang) * r);
        this.scene.add(mesh);
        this.dynamic.push({
          kind: "firefly",
          mesh,
          ox: mesh.position.x,
          oy: mesh.position.y,
          oz: mesh.position.z,
          t: Math.random() * 20,
          speed: 0.6 + Math.random() * 1.2,
        });
      }
    }

    spawnQuestTrail() {
      const aq = this.state.activeQuest;
      if (!aq || !window.Quest) return;
      if (aq.mapId !== this.worldId) return;
      const path = window.Quest.sealPath(this.worldId, aq.questionIds.length);
      for (let i = 0; i < aq.questionIds.length; i++) {
        const p = path[i];
        const active = i === aq.index;
        const done = i < aq.index;
        const def = {
          id: `quest-ward-${i}`,
          type: "quest-seal",
          questIndex: i,
          label: active
            ? `Ward ${i + 1} — cast now`
            : done
              ? `Ward ${i + 1} cleared`
              : `Ward ${i + 1} sealed`,
          position: p,
          glow: active ? 0xff9020 : done ? 0x66ff99 : 0x556655,
          active,
          done,
        };
        const mesh = this.makeQuestSealMesh(def);
        this.interactables.push({ def, mesh });
        // Ember breadcrumbs between this ward and the next
        if (i < aq.questionIds.length - 1 && i >= aq.index - 1) {
          const next = path[i + 1];
          if (next) this.addQuestBreadcrumb(p, next, active || i === aq.index - 1);
        }
      }
      this.updateQuestPips();
    }

    addQuestBreadcrumb(a, b, lit) {
      const THREE = this.THREE;
      const steps = 5;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const x = a[0] + (b[0] - a[0]) * t;
        const z = a[2] + (b[2] - a[2]) * t;
        const mote = new THREE.Mesh(
          new THREE.SphereGeometry(lit ? 0.08 : 0.04, 8, 8),
          new THREE.MeshStandardMaterial({
            color: lit ? 0xffaa44 : 0x665544,
            emissive: lit ? 0xff6600 : 0x221100,
            emissiveIntensity: lit ? 2.5 : 0.4,
          })
        );
        mote.position.set(x, 0.35 + Math.sin(s) * 0.1, z);
        this.scene.add(mote);
        if (lit) {
          const pl = new THREE.PointLight(0xff8020, 0.6, 3);
          pl.position.copy(mote.position);
          this.scene.add(pl);
          this.dynamic.push({ kind: "breadcrumb", mesh: mote, light: pl, t: s });
        } else {
          this.dynamic.push({ kind: "breadcrumb", mesh: mote, t: s });
        }
      }
    }

    updateQuestPips() {
      const rail = this.host.querySelector("[data-quest-pips]");
      if (!rail) return;
      const aq = this.state.activeQuest;
      if (!aq || aq.mapId !== this.worldId) {
        rail.hidden = true;
        return;
      }
      rail.hidden = false;
      rail.innerHTML = aq.questionIds
        .map((_, i) => {
          const cls =
            i < aq.index ? "done" : i === aq.index ? "active" : "locked";
          return `<span class="quest-pip ${cls}" title="Ward ${i + 1}"></span>`;
        })
        .join("");
    }

    makeQuestSealMesh(def) {
      const THREE = this.THREE;
      const g = new THREE.Group();
      const glow = def.glow;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(def.active ? 1.1 : 0.7, def.active ? 0.1 : 0.05, 12, 48),
        new THREE.MeshStandardMaterial({
          color: glow,
          emissive: glow,
          emissiveIntensity: def.active ? 2.8 : def.done ? 1.2 : 0.3,
          roughness: 0.25,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1;
      g.add(ring);
      if (def.active) {
        const fire = new THREE.PointLight(0xff8020, 4.5, 12);
        fire.position.y = 1.2;
        g.add(fire);
        const blaze = new THREE.Mesh(
          new THREE.SphereGeometry(0.4, 14, 14),
          new THREE.MeshStandardMaterial({
            color: 0xffee88,
            emissive: 0xff4400,
            emissiveIntensity: 5,
          })
        );
        blaze.position.y = 0.85;
        g.add(blaze);
        this.dynamic.push({ kind: "questFire", light: fire, blaze, g, t: 0 });
      }
      g.position.set(def.position[0], def.position[1], def.position[2]);
      this.scene.add(g);
      this.dynamic.push({ kind: "seal", mesh: g, t: Math.random() * 5 });
      return g;
    }

    buildCourtyard() {
      const THREE = this.THREE;
      // ground
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(22, 48),
        new THREE.MeshStandardMaterial({ color: 0x2a3328, roughness: 0.95 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);

      // grass ring
      const grass = new THREE.Mesh(
        new THREE.RingGeometry(8, 20, 48),
        new THREE.MeshStandardMaterial({ color: 0x1e3d28, roughness: 1 })
      );
      grass.rotation.x = -Math.PI / 2;
      grass.position.y = 0.01;
      grass.receiveShadow = true;
      this.scene.add(grass);

      // fountain
      this.addBox(2.4, 0.5, 2.4, 0, 0.25, 3.2, this.matStone(0x4a554c), true);
      const water = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 0.15, 24),
        new THREE.MeshStandardMaterial({
          color: 0x3a6a7a,
          roughness: 0.2,
          metalness: 0.3,
          transparent: true,
          opacity: 0.85,
        })
      );
      water.position.set(0, 0.55, 3.2);
      this.scene.add(water);

      // outer walls
      const wallH = 5;
      const wallMat = this.matStone(0x2c352f);
      this.addBox(40, wallH, 1.2, 0, wallH / 2, -12, wallMat);
      this.addBox(40, wallH, 1.2, 0, wallH / 2, 16, wallMat);
      this.addBox(1.2, wallH, 30, -18, wallH / 2, 2, wallMat);
      this.addBox(1.2, wallH, 30, 18, wallH / 2, 2, wallMat);

      // towers
      const towerMat = this.matStone(0x343e38);
      for (const [tx, tz] of [
        [-14, -10],
        [14, -10],
        [-14, 12],
        [14, 12],
      ]) {
        this.addBox(3.2, 9, 3.2, tx, 4.5, tz, towerMat);
        this.addBox(3.8, 1.2, 3.8, tx, 9.2, tz, this.matStone(0x252c28));
      }

      // west / east arch gatehouses
      this.addBox(4, 4.5, 3, -10.5, 2.25, -6, wallMat);
      this.addBox(4, 4.5, 3, 10.5, 2.25, -6, wallMat);
      // openings (no collider in doorway — already solid sides)
      this.addBox(1.2, 3.2, 0.4, -10.5, 1.6, -4.4, this.matWood(), false);
      this.addBox(1.2, 3.2, 0.4, 10.5, 1.6, -4.4, this.matWood(), false);

      // round columns (less blocky / Minecraft)
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue;
        const col = new this.THREE.Mesh(
          new this.THREE.CylinderGeometry(0.28, 0.34, 3.2, 16),
          this.matStone(0x455048)
        );
        col.position.set(i * 2.2, 1.6, -8.5);
        col.castShadow = true;
        col.receiveShadow = true;
        this.scene.add(col);
        this.colliders.push({
          min: { x: i * 2.2 - 0.35, y: 0, z: -8.5 - 0.35 },
          max: { x: i * 2.2 + 0.35, y: 3.2, z: -8.5 + 0.35 },
        });
        const cap = new this.THREE.Mesh(
          new this.THREE.CylinderGeometry(0.4, 0.4, 0.18, 16),
          this.matStone(0x5a6558)
        );
        cap.position.set(i * 2.2, 3.25, -8.5);
        this.scene.add(cap);
      }

      // torches
      for (const [x, z] of [
        [-6, -5],
        [6, -5],
        [-10, 6],
        [10, 6],
        [-4, 10],
        [4, 10],
      ]) {
        this.addTorch(x, 0, z);
      }

      // sky stars (points)
      const starGeo = new THREE.BufferGeometry();
      const starPos = [];
      for (let i = 0; i < 400; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.random() * Math.PI * 0.45;
        const r = 60;
        starPos.push(
          Math.sin(ph) * Math.cos(th) * r,
          Math.cos(ph) * r * 0.6 + 15,
          Math.sin(ph) * Math.sin(th) * r
        );
      }
      starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
      this.scene.add(
        new THREE.Points(
          starGeo,
          new THREE.PointsMaterial({ color: 0xfff2c8, size: 0.25 })
        )
      );
    }

    buildAsphodelHall() {
      const floor = this.matStone(0x2a322c);
      const wall = this.matStone(0x243028);
      // floor
      this.addBox(14, 0.3, 20, 0, -0.15, 0, floor, false);
      const g = new this.THREE.Mesh(
        new this.THREE.BoxGeometry(14, 0.05, 20),
        new this.THREE.MeshStandardMaterial({ color: 0x313b34, roughness: 0.9 })
      );
      g.position.set(0, 0.01, 0);
      g.receiveShadow = true;
      this.scene.add(g);

      // walls
      this.addBox(14, 5, 0.6, 0, 2.5, -9.5, wall);
      this.addBox(14, 5, 0.6, 0, 2.5, 9.5, wall);
      this.addBox(0.6, 5, 20, -6.8, 2.5, 0, wall);
      this.addBox(0.6, 5, 20, 6.8, 2.5, 0, wall);
      // ceiling
      this.addBox(14, 0.4, 20, 0, 5.1, 0, this.matStone(0x1c241e), false);

      // pillars
      for (const z of [-5, -1, 3]) {
        this.addBox(0.7, 4.5, 0.7, -3.5, 2.25, z, this.matStone(0x3a463c));
        this.addBox(0.7, 4.5, 0.7, 3.5, 2.25, z, this.matStone(0x3a463c));
      }

      // side alcove door frame
      this.addBox(2.5, 3.5, 0.5, -5.5, 1.75, -1, this.matWood());

      this.addTorch(-4, 0, -6);
      this.addTorch(4, 0, -6);
      this.addTorch(-4, 0, 4);
      this.addTorch(4, 0, 4);
      this.addTorch(0, 0, 7);
    }

    buildReliquary() {
      const wall = this.matStone(0x1e2a20);
      this.addBox(10, 0.05, 12, 0, 0.01, 0, this.matStone(0x243028), false);
      this.addBox(10, 4.5, 0.5, 0, 2.25, -5.5, wall);
      this.addBox(10, 4.5, 0.5, 0, 2.25, 5.5, wall);
      this.addBox(0.5, 4.5, 12, -4.8, 2.25, 0, wall);
      this.addBox(0.5, 4.5, 12, 4.8, 2.25, 0, wall);
      this.addBox(10, 0.35, 12, 0, 4.6, 0, this.matStone(0x152018), false);
      this.addTorch(-2.5, 0, -2);
      this.addTorch(2.5, 0, -2);
      // greenish glow pool
      const glow = new this.THREE.PointLight(0x66ff88, 0.9, 12);
      glow.position.set(0, 2, -2);
      this.scene.add(glow);
    }

    buildMercury() {
      const wall = this.matStone(0x2a3038);
      const metal = new this.THREE.MeshStandardMaterial({
        color: 0x8a9aaa,
        roughness: 0.35,
        metalness: 0.75,
      });
      this.addBox(12, 0.05, 16, 0, 0.01, 0, this.matStone(0x333840), false);
      this.addBox(12, 5, 0.5, 0, 2.5, -7.5, wall);
      this.addBox(12, 5, 0.5, 0, 2.5, 7.5, wall);
      this.addBox(0.5, 5, 16, -5.8, 2.5, 0, wall);
      this.addBox(0.5, 5, 16, 5.8, 2.5, 0, wall);
      this.addBox(12, 0.35, 16, 0, 5.1, 0, this.matStone(0x1a2028), false);
      // pipes
      for (const z of [-4, -1, 2]) {
        const pipe = new this.THREE.Mesh(new this.THREE.CylinderGeometry(0.12, 0.12, 10, 12), metal);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(0, 3.6, z);
        this.scene.add(pipe);
      }
      this.addTorch(-3, 0, 3);
      this.addTorch(3, 0, 3);
      this.addTorch(0, 0, -5);
    }

    makeNpcMesh(def) {
      const THREE = this.THREE;
      const g = new THREE.Group();
      const color = def.color || 0x445544;
      const bodyMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.48,
        metalness: 0.18,
        transparent: !!def.ghost,
        opacity: def.ghost ? 0.72 : 1,
        emissive: def.ghost ? 0x336688 : color,
        emissiveIntensity: def.ghost ? 0.55 : 0.22,
      });
      // Layered robes + staff — readable silhouettes, not block people
      const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.4, 20), bodyMat);
      skirt.position.y = 0.72;
      g.add(skirt);
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.58, 8, 18), bodyMat);
      torso.position.y = 1.28;
      torso.castShadow = true;
      g.add(torso);
      const cloak = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        bodyMat
      );
      cloak.position.y = 1.58;
      g.add(cloak);
      // Arms
      const armMat = bodyMat;
      const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.45, 6, 10), armMat);
      armL.position.set(-0.42, 1.35, 0.05);
      armL.rotation.z = 0.35;
      g.add(armL);
      const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.45, 6, 10), armMat);
      armR.position.set(0.42, 1.35, 0.05);
      armR.rotation.z = -0.35;
      g.add(armR);
      // Glowing staff / wand
      const staff = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.05, 1.6, 8),
        this.matWood(0x6a4028)
      );
      staff.position.set(0.55, 1.1, 0.15);
      staff.rotation.z = -0.15;
      g.add(staff);
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.12, 0),
        new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 2.2,
        })
      );
      gem.position.set(0.62, 1.95, 0.18);
      g.add(gem);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 20, 20),
        new THREE.MeshStandardMaterial({
          color: def.ghost ? 0xc8e0f0 : 0xf2c8a4,
          roughness: 0.4,
          emissive: def.ghost ? 0x88aacc : 0x442211,
          emissiveIntensity: def.ghost ? 0.4 : 0.08,
        })
      );
      head.position.y = 1.92;
      head.castShadow = true;
      g.add(head);
      // Mystical halo ring
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.035, 8, 28),
        new THREE.MeshStandardMaterial({
          color: 0xffe0a0,
          emissive: 0xffaa44,
          emissiveIntensity: 2.4,
        })
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 2.28;
      g.add(halo);
      // Ground rune circle
      const rune = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.75, 32),
        new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 1.4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
        })
      );
      rune.rotation.x = -Math.PI / 2;
      rune.position.y = 0.03;
      g.add(rune);
      const aura = new THREE.PointLight(color, 1.8, 7);
      aura.position.y = 1.5;
      g.add(aura);
      const portrait = this.makePortraitSprite(def.charId, def.ghost);
      if (portrait) {
        portrait.position.set(0, 2.7, 0.2);
        g.add(portrait);
        this.billboards.push(portrait);
      }
      g.position.set(def.position[0], def.position[1], def.position[2]);
      this.scene.add(g);
      this.dynamic.push({
        kind: "npc",
        mesh: g,
        halo,
        gem,
        rune,
        t: Math.random() * 4,
      });
      return g;
    }

    makePortraitSprite(charId, ghost) {
      const THREE = this.THREE;
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      const palettes = {
        elowen: { skin: "#e8b896", hair: "#2a1810", robe: "#2f5d3a", eye: "#3a8a4a", accent: "#c8e8a0" },
        cassian: { skin: "#d4a078", hair: "#1a1008", robe: "#8a3420", eye: "#c45c2a", accent: "#ffcc88" },
        bramble: { skin: "#f0c8a0", hair: "#c4a35a", robe: "#6a5028", eye: "#5a4020", accent: "#ffe0a0" },
        lyra: { skin: "#d0e0f0", hair: "#a0c0e0", robe: "#3a6080", eye: "#88ddff", accent: "#c0f0ff" },
        _companion: { skin: "#f0d0b0", hair: "#d4a84b", robe: "#8a6a30", eye: "#d4a84b", accent: "#fff0c0" },
      };
      const p = palettes[charId] || palettes.elowen;
      // Glowing frame
      const frame = ctx.createRadialGradient(128, 128, 40, 128, 128, 120);
      frame.addColorStop(0, p.accent);
      frame.addColorStop(0.55, p.robe);
      frame.addColorStop(1, "#0a100c");
      ctx.fillStyle = frame;
      ctx.beginPath();
      ctx.arc(128, 128, 118, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f0d48a";
      ctx.lineWidth = 6;
      ctx.stroke();
      // Hair mass
      ctx.fillStyle = p.hair;
      ctx.beginPath();
      ctx.ellipse(128, 95, 70, 55, 0, 0, Math.PI * 2);
      ctx.fill();
      // Face
      ctx.fillStyle = ghost ? "#c8e0f0" : p.skin;
      ctx.beginPath();
      ctx.ellipse(128, 130, 52, 62, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = "#1a120c";
      ctx.beginPath();
      ctx.ellipse(108, 125, 8, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(148, 125, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.eye;
      ctx.shadowColor = p.accent;
      ctx.shadowBlur = ghost ? 18 : 8;
      ctx.beginPath();
      ctx.arc(108, 126, 4, 0, Math.PI * 2);
      ctx.arc(148, 126, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Soft smile / solemn mouth
      ctx.strokeStyle = "#5a3020";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(128, 148, 14, 0.15, Math.PI - 0.15);
      ctx.stroke();
      // Mystical rune mark on forehead
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(128, 88);
      ctx.lineTo(118, 102);
      ctx.lineTo(138, 102);
      ctx.closePath();
      ctx.stroke();
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthTest: true,
      });
      const spr = new THREE.Sprite(mat);
      spr.scale.set(0.95, 0.95, 1);
      return spr;
    }

    makeSealMesh(def) {
      const THREE = this.THREE;
      const g = new THREE.Group();
      const glow = def.glow || 0xd4a84b;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.85, 0.06, 10, 40),
        new THREE.MeshStandardMaterial({
          color: glow,
          emissive: glow,
          emissiveIntensity: 1.6,
          roughness: 0.3,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.08;
      g.add(ring);
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(0.7, 32),
        new THREE.MeshStandardMaterial({
          color: 0x111811,
          emissive: glow,
          emissiveIntensity: 0.35,
          roughness: 0.5,
        })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.04;
      g.add(disc);
      const light = new THREE.PointLight(glow, 1.2, 6);
      light.position.y = 0.6;
      g.add(light);
      g.position.set(def.position[0], def.position[1], def.position[2]);
      this.scene.add(g);
      this.dynamic.push({ kind: "seal", mesh: g, t: Math.random() * 5 });
      return g;
    }

    makeChestMesh(def) {
      const THREE = this.THREE;
      const g = new THREE.Group();
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.45, 0.5),
        this.matWood(0xb08a3a)
      );
      box.position.y = 0.25;
      box.castShadow = true;
      g.add(box);
      g.position.set(def.position[0], def.position[1], def.position[2]);
      this.scene.add(g);
      return g;
    }

    makeLoreMesh(def) {
      const THREE = this.THREE;
      const page = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 0.45),
        new THREE.MeshStandardMaterial({
          color: 0xe8d5a3,
          emissive: 0x665533,
          emissiveIntensity: 0.25,
          side: THREE.DoubleSide,
        })
      );
      page.position.set(def.position[0], def.position[1] + 0.5, def.position[2]);
      this.scene.add(page);
      this.dynamic.push({ kind: "lore", mesh: page, t: 0 });
      return page;
    }

    makeDoorMarker(def) {
      const THREE = this.THREE;
      const arch = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.6, 0.25),
        this.matWood(0x6a4228)
      );
      arch.position.set(def.position[0], def.position[1], def.position[2]);
      this.scene.add(arch);
      const light = new THREE.PointLight(0xd4a84b, 0.6, 4);
      light.position.copy(arch.position);
      light.position.y += 1.2;
      this.scene.add(light);
      return arch;
    }

    spawnInteractables(list) {
      for (const def of list) {
        let mesh = null;
        if (def.type === "npc") mesh = this.makeNpcMesh(def);
        else if (def.type === "seal") mesh = this.makeSealMesh(def);
        else if (def.type === "chest") mesh = this.makeChestMesh(def);
        else if (def.type === "lore") mesh = this.makeLoreMesh(def);
        else if (def.type === "door") mesh = this.makeDoorMarker(def);
        this.interactables.push({ def, mesh });
      }
    }

    persist() {
      this.ex.level = xpToLevel(this.ex.xp);
      this.ex.mapId = this.worldId;
      if (this.hooks.onState) this.hooks.onState(this.state);
    }

    syncCamera() {
      this.camera.position.set(this.ex.x, this.ex.y, this.ex.z);
      this.camera.rotation.order = "YXZ";
      this.camera.rotation.y = this.ex.yaw;
      this.camera.rotation.x = this.ex.pitch;
    }

    overlaps(nx, nz) {
      const r = 0.35;
      for (const c of this.colliders) {
        if (
          nx + r > c.min.x &&
          nx - r < c.max.x &&
          nz + r > c.min.z &&
          nz - r < c.max.z &&
          this.ex.y > c.min.y &&
          this.ex.y - 1.2 < c.max.y
        ) {
          return true;
        }
      }
      return false;
    }

    bindInput() {
      this._kd = (e) => {
        this.keys[e.key.toLowerCase()] = true;
        if (e.key === "e" || e.key === "E" || e.key === " ") {
          e.preventDefault();
          this.tryInteract();
        }
        if (e.key === "Escape") {
          this.persist();
          this.hooks.onPause?.(this.state);
        }
      };
      this._ku = (e) => {
        this.keys[e.key.toLowerCase()] = false;
      };
      window.addEventListener("keydown", this._kd);
      window.addEventListener("keyup", this._ku);

      // mouse look on desktop
      this.renderer.domElement.addEventListener("click", () => {
        if (this.renderer.domElement.requestPointerLock) {
          this.renderer.domElement.requestPointerLock();
        }
      });
      document.addEventListener("mousemove", (e) => {
        if (document.pointerLockElement !== this.renderer.domElement) return;
        this.ex.yaw -= e.movementX * 0.0022;
        this.ex.pitch -= e.movementY * 0.002;
        this.ex.pitch = Math.max(-1.2, Math.min(1.2, this.ex.pitch));
      });
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
        if (!this.stick.active) return;
        e.preventDefault();
        const t = e.touches ? e.touches[0] : e;
        if (t) setStick(t.clientX, t.clientY);
      };
      joy.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", clear);
      joy.addEventListener("touchstart", onDown, { passive: false });
      joy.addEventListener("touchmove", onMove, { passive: false });
      joy.addEventListener("touchend", clear);
    }

    bindLook() {
      const pad = this.lookPad;
      const onDown = (e) => {
        const t = e.changedTouches ? e.changedTouches[0] : e;
        this.look.active = true;
        this.look.lx = t.clientX;
        this.look.ly = t.clientY;
        this.look.id = t.identifier != null ? t.identifier : "mouse";
      };
      const onMove = (e) => {
        if (!this.look.active) return;
        const touches = e.changedTouches || [e];
        for (const t of touches) {
          const id = t.identifier != null ? t.identifier : "mouse";
          if (id !== this.look.id && e.changedTouches) continue;
          const dx = t.clientX - this.look.lx;
          const dy = t.clientY - this.look.ly;
          this.look.lx = t.clientX;
          this.look.ly = t.clientY;
          this.ex.yaw -= dx * 0.005;
          this.ex.pitch -= dy * 0.004;
          this.ex.pitch = Math.max(-1.2, Math.min(1.2, this.ex.pitch));
        }
      };
      const onUp = () => {
        this.look.active = false;
        this.look.id = null;
      };
      pad.addEventListener("pointerdown", onDown);
      pad.addEventListener("pointermove", onMove);
      pad.addEventListener("pointerup", onUp);
      pad.addEventListener("pointercancel", onUp);
      pad.addEventListener("touchstart", onDown, { passive: true });
      pad.addEventListener("touchmove", onMove, { passive: true });
      pad.addEventListener("touchend", onUp);
    }

    inputMove() {
      let ix = this.stick.x;
      let iz = this.stick.y;
      if (this.keys.w || this.keys.arrowup) iz -= 1;
      if (this.keys.s || this.keys.arrowdown) iz += 1;
      if (this.keys.a || this.keys.arrowleft) ix -= 1;
      if (this.keys.d || this.keys.arrowright) ix += 1;
      const len = Math.hypot(ix, iz);
      if (len > 1) {
        ix /= len;
        iz /= len;
      }
      return { ix, iz };
    }

    update(dt) {
      for (const d of this.dynamic) {
        d.t += dt;
        if (d.kind === "torch") {
          d.light.intensity = 2.4 + Math.sin(d.t * 11) * 0.5;
          d.core.scale.setScalar(1 + Math.sin(d.t * 13) * 0.2);
          if (d.outer) {
            d.outer.scale.y = 1 + Math.sin(d.t * 15) * 0.25;
            d.outer.rotation.y += dt * 2;
          }
          // embers
          if (Math.random() < 0.35) {
            this.spawnEmber(d.core.position);
          }
        }
        if (d.kind === "basin" || d.kind === "questFire") {
          const light = d.light;
          const blaze = d.blaze;
          if (light) light.intensity = 3.2 + Math.sin(d.t * 10) * 0.8;
          if (blaze) {
            blaze.scale.setScalar(1 + Math.sin(d.t * 12) * 0.2);
            blaze.rotation.y += dt;
          }
          if (Math.random() < 0.5 && blaze) {
            blaze.getWorldPosition(this._emberWorld);
            this.spawnEmber(this._emberWorld);
          }
        }
        if (d.kind === "crystal") {
          d.crystal.rotation.y += dt * 0.8;
          d.crystal.position.y = 0.9 + Math.sin(d.t * 2) * 0.12;
        }
        if (d.kind === "npc" && d.halo) {
          d.halo.rotation.z += dt;
          d.mesh.position.y = Math.sin(d.t * 2) * 0.04;
          if (d.gem) d.gem.rotation.y += dt * 2.5;
          if (d.rune) d.rune.rotation.z = d.t * 0.4;
        }
        if (d.kind === "seal") {
          d.mesh.rotation.y += dt * 0.6;
        }
        if (d.kind === "lore") {
          d.mesh.position.y = 0.5 + Math.sin(d.t * 2) * 0.08;
          d.mesh.rotation.y += dt;
        }
        if (d.kind === "firefly") {
          d.mesh.position.x = d.ox + Math.sin(d.t * d.speed) * 0.6;
          d.mesh.position.y = d.oy + Math.sin(d.t * d.speed * 1.3) * 0.35;
          d.mesh.position.z = d.oz + Math.cos(d.t * d.speed * 0.9) * 0.6;
          d.mesh.material.opacity = 0.45 + Math.sin(d.t * 4) * 0.35;
          d.mesh.material.transparent = true;
        }
        if (d.kind === "breadcrumb") {
          d.mesh.position.y = 0.35 + Math.sin(d.t * 3) * 0.12;
          if (d.light) d.light.intensity = 0.45 + Math.sin(d.t * 5) * 0.25;
        }
      }

      // update embers
      for (let i = this.embers.length - 1; i >= 0; i--) {
        const e = this.embers[i];
        e.life -= dt;
        e.mesh.position.y += dt * 1.4;
        e.mesh.position.x += e.vx * dt;
        e.mesh.position.z += e.vz * dt;
        e.mesh.material.opacity = Math.max(0, e.life);
        if (e.life <= 0) {
          this.scene.remove(e.mesh);
          this.embers.splice(i, 1);
        }
      }

      if (this.dialog) {
        this.syncCamera();
        return;
      }

      const { ix, iz } = this.inputMove();
      const speed = 4.2;
      if (ix || iz) {
        const sin = Math.sin(this.ex.yaw);
        const cos = Math.cos(this.ex.yaw);
        // forward is -Z in Three yaw
        const mx = (ix * cos + iz * sin) * speed * dt;
        const mz = (-ix * sin + iz * cos) * speed * dt;
        const nx = this.ex.x + mx;
        const nz = this.ex.z + mz;
        if (!this.overlaps(nx, this.ex.z)) this.ex.x = nx;
        if (!this.overlaps(this.ex.x, nz)) this.ex.z = nz;
      }

      this.nearby = this.findNearby();
      this.elInteract.hidden = !this.nearby;
      if (this.nearby) {
        this.elInteract.textContent = this.interactLabel(this.nearby.def);
      }

      if (this.toastT > 0) {
        this.toastT -= dt;
        if (this.toastT <= 0) this.elToast.hidden = true;
      }

      const aq = this.state.activeQuest;
      this.elLevel.textContent = `Lv ${this.ex.level} · ${this.ex.xp} XP`;
      this.elMap.textContent = aq
        ? `⚔ ${aq.title} · ${aq.index + 1}/${aq.questionIds.length}`
        : window.EXPLORE3D_WORLDS[this.worldId]?.name || "";
      this.elHint.textContent = this.nearby
        ? "Interact / E"
        : aq
          ? "Follow the burning ward — cast each question as a quest step"
          : "Move · look · find seals to begin quests";

      this.syncCamera();
    }

    spawnEmber(origin) {
      if (this.embers.length > 80) return;
      const THREE = this.THREE;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 6),
        new THREE.MeshBasicMaterial({
          color: 0xffaa44,
          transparent: true,
          opacity: 1,
        })
      );
      mesh.position.copy(origin);
      mesh.position.x += (Math.random() - 0.5) * 0.2;
      mesh.position.z += (Math.random() - 0.5) * 0.2;
      this.scene.add(mesh);
      this.embers.push({
        mesh,
        life: 0.6 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
      });
    }

    findNearby() {
      let best = null;
      let bestD = 2.4;
      for (const item of this.interactables) {
        const p = item.def.position;
        const d = Math.hypot(p[0] - this.ex.x, p[2] - this.ex.z);
        if (d < bestD) {
          bestD = d;
          best = item;
        }
      }
      return best;
    }

    interactLabel(def) {
      if (def.type === "npc") return "Talk";
      if (def.type === "door") return def.label || "Enter";
      if (def.type === "seal") return "Begin quest";
      if (def.type === "quest-seal") {
        if (def.done) return "Cleared";
        if (!def.active) return "Sealed — clear prior ward";
        return "Cast this ward";
      }
      if (def.type === "chest") return "Open chest";
      if (def.type === "lore") return "Read";
      return "Interact";
    }

    showToast(msg) {
      this.toastT = 2.8;
      this.elToast.hidden = false;
      this.elToast.textContent = msg;
    }

    gainXp(n) {
      this.ex.xp += n;
      const before = this.ex.level;
      this.ex.level = xpToLevel(this.ex.xp);
      this.persist();
      if (this.ex.level > before) this.showToast(`Scholar level up — Lv ${this.ex.level}`);
    }

    openDialog(name, text) {
      this.dialog = { name, text };
      this.elDialog.hidden = false;
      this.host.querySelector("[data-dname]").textContent = name;
      this.host.querySelector("[data-dtext]").textContent = text;
    }

    tryInteract() {
      const item = this.nearby;
      if (!item || this.dialog) return;
      const e = item.def;

      if (e.type === "npc") {
        window.GameMusic?.playUi?.("select");
        let lines = e.lines || ["…"];
        if (e.charId === "_companion") {
          const c = window.CAMPAIGN?.companions?.[this.state.companionId];
          if (c) {
            lines = [
              `${c.name}: Keep walking these halls. Seals are only the battles.`,
              `I'm with you in the world — not only in trial chambers.`,
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
        this.openDialog(name, text);
        return;
      }

      if (e.type === "door") {
        if (e.requiresWorld && !this.state.unlockedWorlds?.includes(e.requiresWorld)) {
          this.showToast(e.lockedText || "Sealed.");
          return;
        }
        if (e.requiresCleared && !this.state.clearedLevels?.includes(e.requiresCleared)) {
          this.showToast(e.lockedText || "Not yet.");
          return;
        }
        window.GameMusic?.playUi?.("door");
        if (e.targetSpawn) {
          this.ex.x = e.targetSpawn.x;
          this.ex.y = e.targetSpawn.y;
          this.ex.z = e.targetSpawn.z;
        }
        if (e.targetYaw != null) this.ex.yaw = e.targetYaw;
        this.loadWorld(e.targetWorld, false);
        return;
      }

      if (e.type === "chest") {
        if (this.ex.openedChests.includes(e.id)) {
          this.showToast("Already looted.");
          return;
        }
        window.GameMusic?.playUi?.("select");
        this.ex.openedChests.push(e.id);
        if (e.loot && !this.state.inventory.includes(e.loot)) {
          this.state.inventory.push(e.loot);
        }
        if (e.loot === "rival_charm") {
          this.ex.bonds.cassian = Math.min(100, (this.ex.bonds.cassian || 0) + 12);
        }
        if (e.xp) this.gainXp(e.xp);
        this.persist();
        this.openDialog("Chest", e.text || "You found something.");
        return;
      }

      if (e.type === "lore") {
        window.GameMusic?.playUi?.("click");
        if (!this.ex.foundLore.includes(e.loreId)) {
          this.ex.foundLore.push(e.loreId);
          if (e.xp) this.gainXp(e.xp);
          this.persist();
        }
        this.openDialog(e.title || "Lore", e.text);
        return;
      }

      if (e.type === "quest-seal") {
        if (e.done) {
          this.showToast("Already cleared.");
          return;
        }
        if (!e.active) {
          this.showToast("Follow the burning seal — clear wards in order.");
          return;
        }
        window.GameMusic?.playUi?.("whoosh");
        this.persist();
        this.hooks.onQuestWard?.(this.state.activeQuest, this.state);
        return;
      }

      if (e.type === "seal") {
        if (this.state.activeQuest) {
          this.showToast("Finish the burning wards of your current quest first.");
          return;
        }
        if (e.requiresCleared && !this.state.clearedLevels?.includes(e.requiresCleared)) {
          this.showToast("This seal still sleeps.");
          return;
        }
        window.GameMusic?.playUi?.("whoosh");
        this.persist();
        this.hooks.onSeal?.(e, this.state);
      }
    }

    loop() {
      if (!this.running) return;
      const dt = Math.min(0.05, this.clock.getDelta());
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
      this.raf = requestAnimationFrame(() => this.loop());
    }
  }

  window.Explore3D = {
    ensureExplore,
    xpToLevel,
    start(host, state, hooks) {
      const session = new Explore3DSession(host, state, hooks);
      session.start();
      return session;
    },
  };

  // Keep ExploreGame API pointing at 3D
  window.ExploreGame = window.Explore3D;
})();
