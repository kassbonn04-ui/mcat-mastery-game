(function () {
  const el = document.getElementById("app");
  let state = window.GameEngine.load();
  let view = { name: state.companionId ? "title" : "companion" };
  let mission = null;
  let pendingDecision = null;
  let cloudMsg = "";
  let exploreSession = null;

  function stopExplore() {
    if (exploreSession) {
      exploreSession.stop();
      exploreSession = null;
    }
  }

  if (window.GameCloud) {
    window.GameCloud.init();
    window.GameCloud.onChange(() => {
      const pill = document.querySelector("[data-cloud-pill]");
      if (pill) pill.textContent = cloudPillLabel();
    });
  }

  function cloudPillLabel() {
    const s = window.GameCloud?.status?.() || {};
    if (!s.configured) return "Local save";
    if (s.email) return "☁ " + s.email.split("@")[0];
    return "☁ Sign in";
  }

  function musicHudLabel(s) {
    if (s.enabled === false) return "♪ Off";
    if (s.missing) return "♪ Missing";
    if (s.lastPlayError) return "♪ Blocked";
    if (!s.unlocked || !s.playing) return "♪ Tap";
    return "♪ On";
  }

  function musicHudTitle(s) {
    if (s.missing) {
      return "Soundtrack files missing — check connection / hard-refresh";
    }
    if (s.lastPlayError) return "Sound blocked — tap Enable sound / ♪ again";
    if (!s.unlocked || !s.playing) return "Tap to start soundtrack";
    return "Toggle soundtrack";
  }

  function enableSoundFromClick() {
    if (window.GameMusic?.enableFromGesture) {
      window.GameMusic.enableFromGesture();
    } else {
      window.GameMusic?.setEnabled?.(true);
      window.GameMusic?.unlock?.();
    }
    paintMusicHud();
    paintEnableSoundButtons();
  }

  function paintEnableSoundButtons() {
    const s = window.GameMusic?.status?.() || {};
    document.querySelectorAll("[data-enable-sound]").forEach((btn) => {
      const needs = s.enabled === false || !s.unlocked || !s.playing || !!s.lastPlayError;
      btn.hidden = !needs;
      btn.textContent = s.lastPlayError
        ? "Sound blocked — tap to retry"
        : s.enabled === false
          ? "Enable sound"
          : "Enable sound";
    });
  }

  window.addEventListener("gamemusic-status", paintEnableSoundButtons);

  function paintMusicHud() {
    const btn = document.querySelector("[data-music-toggle]");
    if (!btn || !window.GameMusic?.status) return;
    const s = window.GameMusic.status();
    btn.textContent = musicHudLabel(s);
    btn.title = musicHudTitle(s);
    btn.classList.toggle("music-warn", !!s.missing);
  }

  window.addEventListener("gamemusic-status", paintMusicHud);

  // Soft UI clicks / hovers on buttons, doors, hotspots, choices.
  if (window.GameMusic?.bindUiRoot) {
    window.GameMusic.bindUiRoot(el);
  }

  /* Castle + sorcery theme: photographic halls/castles + AI archetype portraits
     (original Arcanum names — not trademarked HP art or actor likenesses). */
  const STICKERS = {
    owl: "assets/gfx/sticker-owl.svg",
    wand: "assets/gfx/sticker-wand.svg",
    potion: "assets/gfx/sticker-potion.svg",
    hat: "assets/gfx/sticker-hat.svg",
    stars: "assets/gfx/sticker-stars.svg",
    ticket: "assets/gfx/sticker-ticket.svg",
    seal: "assets/gfx/sticker-seal.svg",
    broom: "assets/gfx/sticker-broom.svg",
    cat: "assets/gfx/sticker-cat.svg",
    book: "assets/gfx/sticker-book.svg",
    cloak: "assets/gfx/sticker-cloak.svg",
    snitch: "assets/gfx/sticker-snitch.svg",
  };

  const ART = {
    hero: "assets/hero-castle.png",
    map: "assets/scenes/castle-lights-night.jpg",
    chamber: "assets/scenes/cathedral-interior.jpg",
    owl: "assets/scenes/moonlit-clouds.jpg",
    owlAlt: "assets/scenes/starry-night.jpg",
    cat: "assets/creatures/cat-ginger.jpg",
    groundskeeper: "assets/chars/portrait-groundskeeper.png",
    hut: "assets/scenes/cottage-woods.jpg",
    library: "assets/scenes/grand-library.jpg",
    potions: "assets/hero-castle.png",
    greatHall: "assets/scenes/cathedral-interior.jpg",
    victory: "assets/scenes/sunrise-victory.jpg",
    curse: "assets/scenes/night-sky-curse.jpg",
    parchment: "assets/scenes/parchment-texture.jpg",
    commonRoom: "assets/scenes/common-room.jpg",
    fireplace: "assets/scenes/fireplace-warm.jpg",
    alley: "assets/scenes/market-street.jpg",
    train: "assets/scenes/steam-train.jpg",
    village: "assets/scenes/village-street.jpg",
    stars: "assets/scenes/pixabay-stars.jpg",
    scenes: {
      // Journey decks share the successful night-castle plate (not stock photos).
      title: "assets/hero-castle.png",
      companion: "assets/hero-castle.png",
      map: "assets/hero-castle.png",
      chamber: "assets/hero-castle.png",
      asphodel: "assets/hero-castle.png",
      mercury: "assets/hero-castle.png",
      lodestone: "assets/hero-castle.png",
      owls: "assets/hero-castle.png",
      library: "assets/hero-castle.png",
      potions: "assets/hero-castle.png",
      hut: "assets/hero-castle.png",
      owlPost: "assets/hero-castle.png",
      grounds: "assets/hero-castle.png",
      greatHall: "assets/hero-castle.png",
      victory: "assets/hero-castle.png",
      curse: "assets/hero-castle.png",
      dark: "assets/hero-castle.png",
      decision: "assets/hero-castle.png",
      mastery: "assets/hero-castle.png",
      ending: "assets/hero-castle.png",
      market: "assets/hero-castle.png",
      village: "assets/hero-castle.png",
      train: "assets/hero-castle.png",
      trial: "assets/hero-castle.png",
    },
    doors: {
      main: "assets/scenes/stone-walls.jpg",
      side: "assets/scenes/pixabay-forest-sun.jpg",
      finale: "assets/scenes/milky-way.jpg",
      lab: "assets/scenes/lab-glassware.jpg",
      archive: "assets/scenes/library-dark.jpg",
      forge: "assets/scenes/gothic-cathedral.jpg",
      owl: "assets/scenes/tower-bridge-mood.jpg",
      hearth: "assets/scenes/fireplace-warm.jpg",
    },
    portraits: {
      rowan: "assets/chars/portrait-rowan.png",
      sage: "assets/chars/portrait-sage.png",
      pip: "assets/chars/portrait-pip.png",
      vesper: "assets/chars/portrait-vesper.png",
      elowen: "assets/chars/portrait-elowen.png",
      cassian: "assets/chars/portrait-cassian.png",
      bramble: "assets/chars/portrait-bramble.png",
      lyra: "assets/chars/portrait-lyra.png",
      groundskeeper: "assets/chars/portrait-groundskeeper.png",
    },
  };

  const CHAR_FOCUS = {
    elowen: "50% 18%",
    cassian: "50% 16%",
    bramble: "50% 20%",
    lyra: "50% 18%",
    rowan: "50% 16%",
    sage: "50% 18%",
    pip: "50% 20%",
    vesper: "50% 14%",
  };

  const WING_SCENE = {
    "wing-asphodel": "asphodel",
    "wing-mercury": "mercury",
    "wing-lodestone": "lodestone",
    "wing-owls": "owls",
  };

  const chars = () => window.CAMPAIGN.characters;
  const companions = () => window.CAMPAIGN.companions || {};

  function companion() {
    return companions()[state.companionId] || null;
  }

  function companionPathMeta(companionId) {
    const plan = window.GameEngine.planCompanionPath(companionId);
    const bank = plan.bank || [];
    if (!bank.length) return "";
    return `Q${bank[0]}–${bank[bank.length - 1]} · ${bank.length} wards`;
  }

  function levelWardCount(level) {
    if (!level) return 0;
    if (level.dynamicReview) return level.reviewCount || 4;
    const ids = window.GameEngine.questionIdsForLevel(state, level) || [];
    return ids.length;
  }

  function $(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function topicLabel(t) {
    return String(t || "general").replace(/_/g, " ");
  }

  function candles(n = 10) {
    let html = "";
    for (let i = 0; i < n; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 8;
      const dur = 7 + Math.random() * 8;
      html += `<span class="candle" style="left:${left}%;bottom:${Math.random() * 30}%;animation-duration:${dur}s;animation-delay:${delay}s"></span>`;
    }
    return `<div class="fx-layer" aria-hidden="true">${html}</div>`;
  }

  /** Floating ember/firefly motes for night-castle scenes */
  function fireflies(n = 22) {
    let html = "";
    for (let i = 0; i < n; i++) {
      const left = Math.random() * 100;
      const bottom = Math.random() * 55;
      const delay = Math.random() * 10;
      const dur = 9 + Math.random() * 10;
      const drift = (Math.random() * 40 - 20).toFixed(1);
      const size = (4 + Math.random() * 5).toFixed(1);
      html += `<span class="candle firefly" style="left:${left}%;bottom:${bottom}%;width:${size}px;height:${size}px;--drift:${drift}px;animation-duration:${dur}s;animation-delay:${delay}s"></span>`;
    }
    return `<div class="fx-layer fx-fireflies" aria-hidden="true">${html}</div>`;
  }

  /** Locked journey plate — always hero-castle + fireflies. Never stock landscapes. */
  function castleAtmosphere({ fireflyCount = 18, position = "35% 38%" } = {}) {
    return `
      <div class="scene-bg castle-plate" style="background-image:url('${ART.hero}');background-position:${position}"></div>
      <div class="castle-depth" aria-hidden="true"></div>
      ${fireflies(fireflyCount)}`;
  }

  function fireBeam() {
    const beam = document.createElement("div");
    beam.className = "wand-beam fire";
    document.body.appendChild(beam);
    setTimeout(() => beam.remove(), 600);
  }

  function burstSparks(ok) {
    const layer = document.createElement("div");
    layer.className = "fx-layer fx-burst";
    layer.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      const angle = (Math.PI * 2 * i) / 18;
      const dist = 40 + Math.random() * 80;
      s.style.left = "50%";
      s.style.top = "40%";
      s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      s.style.background = ok ? "var(--gold-soft)" : "#f0a0a8";
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1200);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function companionLine(kind) {
    const c = companion();
    if (!c?.lines) return null;
    const bag = c.lines[kind];
    if (Array.isArray(bag)) return pick(bag);
    return bag || null;
  }

  function artScene(key) {
    return ART.scenes[key] || ART.hero;
  }

  function portraitSrc(who) {
    if (!who) return ART.portraits.elowen;
    if (ART.portraits[who.id]) return ART.portraits[who.id];
    if (who.portrait) return who.portrait;
    return ART.portraits.elowen;
  }

  /** Gate copy: locked locations name the MCAT trial that opens them. */
  function worldGateHint(world) {
    if (!state.flags?.entranceCleared) {
      return "Locked — finish the Platform Entrance Set (questions) first";
    }
    if (state.unlockedWorlds.includes(world.id)) return null;
    const worlds = window.CAMPAIGN.worlds;
    for (const w of worlds) {
      for (const lv of w.levels) {
        const unlock = lv.successUnlock || "";
        if (unlock === `world-${world.id}` || unlock === world.id) {
          const n = (lv.questionIds || []).length;
          return `Opens after clearing “${lv.name}” (≥60% of ${n} practice items)`;
        }
      }
    }
    return "Opens after the prior hall’s final main set (≥60% correct)";
  }

  function spotIsOpen(spot) {
    const u = spot.unlock || {};
    if (u.type === "flag") return !!state.flags?.[u.flag];
    if (u.type === "cleared") return state.clearedLevels.includes(u.levelId);
    if (u.type === "world") return state.unlockedWorlds.includes(u.worldId);
    return true;
  }

  function spotLockHint(spot) {
    const u = spot.unlock || {};
    if (u.type === "flag" && u.flag === "entranceCleared") {
      return "Answer the entrance Chem/Phys set to board";
    }
    if (u.type === "cleared") {
      for (const w of window.CAMPAIGN.worlds) {
        const lv = w.levels.find((l) => l.id === u.levelId);
        if (lv) return `Unlocks after clearing “${lv.name}”`;
      }
      return "Unlocks after a main practice set";
    }
    if (u.type === "world") {
      const w = window.CAMPAIGN.worlds.find((x) => x.id === u.worldId);
      return worldGateHint(w || { id: u.worldId }) || "Still sealed";
    }
    return "Sealed";
  }

  function levelGateHint(world, level) {
    if (level.type === "side") return "Optional side path — does not gate the year";
    if (!isLevelLocked(world, level)) return null;
    const mains = world.levels.filter((l) => l.type === "main");
    const idx = mains.findIndex((l) => l.id === level.id);
    const prev = idx > 0 ? mains[idx - 1] : null;
    if (!prev) return "Sealed";
    const n = (prev.questionIds || []).length;
    return `Opens after clearing “${prev.name}” (≥60% of ${n} wards)`;
  }

  function portraitHtml(who, focusOverride) {
    const focus =
      focusOverride ||
      who?.portraitFocus ||
      CHAR_FOCUS[who?.id] ||
      "50% 16%";
    const fit = who?.portraitFit || "cover";
    const name = who?.name || "Guide";
    const role = who?.role || "";
    const src = portraitSrc(who);
    return `
      <div class="portrait-strip face-safe">
        <img class="portrait-img" src="${src}" alt="${escapeHtml(name)}" style="object-position:${focus};object-fit:${fit}" loading="lazy" />
        <div class="who">${escapeHtml(name)}<br><span style="opacity:.85;font-size:.8rem">${escapeHtml(role)}</span></div>
      </div>`;
  }

  function questGoalHint() {
    const worlds = window.CAMPAIGN.worlds;
    for (const w of worlds) {
      if (!state.unlockedWorlds.includes(w.id)) continue;
      for (const lv of w.levels) {
        if (lv.type !== "main") continue;
        if (levelWardCount(lv) < 1) continue;
        if (state.clearedLevels.includes(lv.id)) continue;
        if (isLevelLocked(w, lv)) continue;
        return { world: w, level: lv };
      }
    }
    return null;
  }

  /**
   * Numbered Play journey beats — mains that have wards on this companion path.
   * Status: done | current | locked | sealed (world not open).
   */
  function playJourneyBeats() {
    const beats = [];
    let n = 0;
    for (const w of window.CAMPAIGN.worlds) {
      for (const lv of w.levels) {
        if (lv.type !== "main") continue;
        if (levelWardCount(lv) < 1) continue;
        n += 1;
        const worldOpen = state.unlockedWorlds.includes(w.id);
        const cleared = state.clearedLevels.includes(lv.id);
        const locked = !worldOpen || isLevelLocked(w, lv);
        let status = "locked";
        if (cleared) status = "done";
        else if (!worldOpen) status = "sealed";
        else if (!locked) status = "current";
        beats.push({
          n,
          world: w,
          level: lv,
          status,
          label: lv.name.replace(/^The\s+/, ""),
        });
      }
    }
    return beats;
  }

  function yearPathHtml() {
    const days = [1, 2, 3, 4].map((d) => {
      const w = window.CAMPAIGN.worlds.find((x) => x.day === d);
      if (!w) return "";
      const open = state.unlockedWorlds.includes(w.id);
      const mains = w.levels.filter(
        (l) => l.type === "main" && levelWardCount(l) > 0
      );
      const done = mains.filter((l) => state.clearedLevels.includes(l.id)).length;
      const active =
        open && done < mains.length && (d === 1 || state.unlockedWorlds.includes(w.id));
      const cls = !open
        ? "sealed"
        : mains.length && done >= mains.length
          ? "done"
          : active
            ? "active"
            : "open";
      return `<button type="button" class="year-step ${cls}" data-year-world="${w.id}" ${
        open ? "" : "disabled"
      } title="${escapeHtml(w.place || w.name)}">
        <span class="ys-day">Day ${d}</span>
        <span class="ys-name">${escapeHtml(w.place || w.name)}</span>
        <span class="ys-meta">${open ? `${done}/${mains.length || 0}` : "sealed"}</span>
      </button>`;
    });
    return `<div class="year-path" role="navigation" aria-label="School year path">${days.join(
      '<span class="year-path-arrow" aria-hidden="true">→</span>'
    )}</div>`;
  }

  function playHubHtml(goal, beats) {
    const pj = window.CAMPAIGN.playJourney || {};
    const doneN = beats.filter((b) => b.status === "done").length;
    const total = beats.length;
    const current = beats.find((b) => b.status === "current");
    const beatPips = beats
      .map(
        (b) =>
          `<span class="play-beat-pip ${b.status}" title="Beat ${b.n}: ${escapeHtml(
            b.label
          )}"></span>`
      )
      .join("");
    const headline = current
      ? `Beat ${current.n} of ${total} · ${current.label}`
      : state.campaignClear
        ? "Year path clear — review curses in the Grimoire"
        : goal
          ? `Next open trial · ${goal.level.name}`
          : "Open a study hall on the campus map";
    return `
      <div class="play-hub">
        <div class="play-hub-head">
          <p class="eyebrow whimsy">${escapeHtml(pj.title || "Play the Year")}</p>
          <h3 class="play-hub-title">${escapeHtml(headline)}</h3>
          <p class="fine">${escapeHtml(
            pj.lede || ""
          )} Progress: ${doneN}/${total} main trials.</p>
        </div>
        <div class="play-beat-track" aria-hidden="true">${beatPips}</div>
        <div class="cta-row play-hub-cta">
          ${
            current || goal
              ? `<button type="button" class="btn primary" id="play-continue">Play next trial →</button>`
              : ""
          }
          <button type="button" class="btn ghost" id="play-grimoire">Grimoire review</button>
        </div>
      </div>`;
  }

  function wardPipsHtml(index, total) {
    let html = '<div class="quest-pips quest-pips-inline" aria-hidden="true">';
    for (let i = 0; i < total; i++) {
      const cls = i < index ? "done" : i === index ? "active" : "locked";
      html += `<span class="quest-pip ${cls}"></span>`;
    }
    html += "</div>";
    return html;
  }

  /** Scrapbook sticker scatter — whimsical board vibe (original art, not HP trademarks). */
  function stickerScatter(mood = "default") {
    const packs = {
      title: ["owl", "hat", "wand", "cat", "ticket", "cloak", "snitch"],
      map: ["ticket", "owl", "cat", "broom", "snitch", "hat", "book", "cloak"],
      trial: ["wand", "owl", "potion", "book", "stars", "seal"],
      train: ["ticket", "owl", "broom", "snitch", "stars"],
      library: ["owl", "book", "potion", "wand", "stars"],
      curse: ["wand", "cloak", "stars", "seal"],
      default: ["owl", "wand", "potion", "cat", "hat", "broom", "book", "cloak", "snitch"],
    };
    const keys = packs[mood] || packs.default;
    const poses = [
      "tl",
      "tr",
      "bl",
      "br",
      "ml",
      "mr",
    ];
    return `
      <div class="sticker-layer" aria-hidden="true">
        ${keys
          .map((k, i) => {
            const pose = poses[i % poses.length];
            const rot = [-18, 12, -8, 16, -14, 10][i % 6];
            return `<img class="sticker ${pose}" src="${STICKERS[k]}" alt="" style="--rot:${rot}deg" draggable="false" />`;
          })
          .join("")}
      </div>`;
  }

  function ambientCorners(kind) {
    const mood =
      kind === "title" || kind === "ending"
        ? "title"
        : kind === "map"
          ? "map"
          : kind === "trial" || kind === "potions"
            ? "trial"
            : kind === "library" || kind === "mastery"
              ? "library"
              : kind === "curse"
                ? "curse"
                : "default";
    const left =
      kind === "owl" || kind === "title" || kind === "map" || kind === "ending"
        ? ART.owl
        : kind === "hut" || kind === "grounds"
          ? ART.groundskeeper
          : kind === "library" || kind === "mastery"
            ? ART.library
            : kind === "curse"
              ? ART.curse
              : ART.owlAlt;
    const right =
      kind === "title" || kind === "ending"
        ? ART.greatHall
        : kind === "map"
          ? ART.hut
          : kind === "potions" || kind === "trial"
            ? ART.potions
            : kind === "curse"
              ? ART.scenes.dark
              : ART.fireplace;
    return `
      <div class="ambient-art" aria-hidden="true">
        <div class="ambient-corner left soft" style="background-image:url('${left}')"></div>
        <div class="ambient-corner right soft" style="background-image:url('${right}')"></div>
        <div class="ambient-filigree top"></div>
        <div class="ambient-filigree bottom"></div>
      </div>
      ${stickerScatter(mood)}`;
  }

  function doorThumb(level, world) {
    if (level.isFinale || level.id?.includes("d4-main-2")) return ART.doors.finale;
    if (level.type === "side") return ART.doors.side;
    const id = level.id || "";
    if (/observatory|axon/i.test(level.name || "")) return ART.doors.owl;
    if (/reliquary|acid|cyp|buret|gas|alchemy|lab/i.test(level.name || id))
      return ART.doors.lab;
    if (/crypt|archive|echo|spiral|sanctum/i.test(level.name || id))
      return ART.doors.archive;
    if (/wire|lodestone|foundation|heated/i.test(level.name || id))
      return ART.doors.forge;
    if (/owl|hall/i.test(world?.name || "")) return ART.doors.owl;
    if (/hearth|bramble|scale/i.test(level.name || id)) return ART.doors.hearth;
    return ART.doors.main;
  }

  /** True when stem/passage implies a figure we do not ship (no fake AAMC art). */
  function figureGap(q) {
    if (q.image || q.figureSrc) return null;
    const blob = `${q.stem || ""} ${q.passage || ""} ${q.passageLabel || ""}`;
    const asks =
      /\b(figure|diagram|graph|chart|table)\b/i.test(blob) ||
      /\bwhich image\b/i.test(blob) ||
      /\bimage best\b/i.test(blob);
    if (!asks) return null;
    return "This ward references a figure not in the pack — atmospheric seal only (no invented AAMC art).";
  }

  /**
   * Question HEADER strip only (1600×420 banners).
   * Full-page question background is ALWAYS the night castle + fireflies —
   * never replace that plate with stock landscapes.
   * Banner pool stays castle / campus: night keep, spell chamber, atlas, mist keep.
   */
  const TRIAL_ATMOS = [
    { id: "castle", src: "assets/trial-atmos/banners/night-castle.jpg", label: "Night keep", motion: "lamps" },
    { id: "spell", src: "assets/trial-atmos/banners/spell-chamber.jpg", label: "Spell chamber", motion: "magic" },
    { id: "map", src: "assets/trial-atmos/banners/world-map.jpg", label: "Campus atlas", motion: "lamps" },
    { id: "keep", src: "assets/trial-atmos/banners/mist-castle.jpg", label: "Mist keep", motion: "mist" },
  ];

  function hashSeed(str) {
    let h = 2166136261;
    const s = String(str || "");
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** Stable random banner per question id — full pool, not topic-mapped. */
  function trialAtmosArt(q) {
    const seed = hashSeed(`${q?.id || ""}|${q?.stem || ""}|${companion()?.id || "solo"}`);
    return TRIAL_ATMOS[seed % TRIAL_ATMOS.length] || TRIAL_ATMOS[0];
  }

  function trialVisualPanel(q, glyph) {
    const gap = figureGap(q);
    const hasImage = !!(q.image || q.figureSrc);
    if (hasImage) {
      const src = q.image || q.figureSrc;
      const note = q.figureNote
        ? `<p class="figure-note">${escapeHtml(q.figureNote)}</p>`
        : "";
      return `
      <div class="trial-visual figure-panel">
        <img class="figure-img" src="${src}" alt="Question figure" />
        ${note}
      </div>`;
    }
    if (gap) {
      return `
      <div class="trial-visual figure-panel missing">
        <p class="figure-note">${escapeHtml(gap)}</p>
      </div>`;
    }
    // No figure — randomized wide banner (homepage castle untouched)
    const atmos = trialAtmosArt(q);
    const watcher = companion()
      ? escapeHtml(companion().name.split(" ")[0]) + " watches"
      : "Wand at the ready";
    return `
      <div class="trial-visual cast-strip">
        <div class="atmos-panel cast-mood motion-${escapeHtml(atmos.motion)}" data-atmos="${escapeHtml(atmos.id)}">
          <img class="atmos-img" src="${atmos.src}" alt="${escapeHtml(atmos.label)}" width="1600" height="420" decoding="async" />
          <div class="atmos-fx" aria-hidden="true"></div>
          <div class="atmos-glyph">${window.glyphSvg(glyph.svg)}</div>
          <div class="companion-chip">${watcher}</div>
          <div class="atmos-place">${escapeHtml(atmos.label)}</div>
        </div>
        <p class="figure-note">Spell mark · ${escapeHtml(glyph.spell)}</p>
      </div>`;
  }

  function journeyRibbon() {
    const c = companion();
    if (!c) return "";
    const mood = state.journey?.mood || "steady";
    const src = portraitSrc(c);
    const focus = c.portraitFocus || CHAR_FOCUS[c.id] || "50% 16%";
    return `
      <div class="journey-ribbon">
        <span class="jr-portrait" style="background-image:url('${src}');background-position:${focus}"></span>
        <span class="jr-seal" style="border-color:${c.accent || "var(--gold)"}">✦</span>
        <span><strong>${escapeHtml(c.name)}</strong> walks with you · mood: ${escapeHtml(mood)}</span>
        <span class="jr-owl" style="background-image:url('${ART.owl}')" title="Owl post"></span>
      </div>`;
  }

  function render() {
    if (view.name !== "explore") stopExplore();
    el.innerHTML = "";
    if (view.name !== "explore") el.appendChild(hud());
    const stage = document.createElement("div");
    stage.className = view.name === "explore" ? "stage-root explore-stage" : "stage-root";
    el.appendChild(stage);

    const views = {
      title: viewTitle,
      companion: viewCompanion,
      explore: viewExplore,
      map: viewMap,
      world: viewWorld,
      visit: viewVisit,
      train: viewTrain,
      dialogue: viewDialogue,
      corridor: viewCorridor,
      trial: viewTrial,
      outcome: viewOutcome,
      decision: viewDecision,
      mastery: viewMastery,
      ending: viewEnding,
      account: viewAccount,
    };
    stage.appendChild((views[view.name] || viewTitle)());
    // Always restore document scroll — explore/fixed layers used to trap it
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    if (window.GameMusic?.sync) {
      window.GameMusic.sync({
        view: view.name === "explore" ? { name: "map", worldId: state.explore?.mapId } : view,
        mission,
        state,
      });
    }
  }

  function flashSaveToast(msg) {
    let toast = document.getElementById("save-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "save-toast";
      toast.className = "save-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = msg || "Progress saved";
    toast.classList.add("show");
    clearTimeout(flashSaveToast._t);
    flashSaveToast._t = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  function checkpointMission(showToast) {
    if (!mission?.queue?.length) return;
    state = window.GameEngine.persistMission(state, mission);
    if (showToast) flashSaveToast("Progress saved");
  }

  function goHome(opts = {}) {
    if (window.PeriodicTable?.isOpen?.()) window.PeriodicTable.close();
    if (mission?.queue?.length) {
      checkpointMission(opts.toast !== false);
      mission = null; // resume from state.activeMission
    } else {
      window.GameEngine.save(state);
    }
    stopExplore();
    view = { name: "title" };
    render();
  }

  function resumeActiveMission() {
    const am = state.activeMission;
    if (!am?.questionIds?.length) return false;
    const pack = window.QUESTION_PACK?.questions || [];
    const queue = am.questionIds
      .map((id) => pack.find((q) => q.id === id))
      .filter(Boolean);
    if (!queue.length) {
      state = window.GameEngine.clearActiveMission(state);
      return false;
    }
    let world = null;
    let level = null;
    if (am.entranceMode) {
      const ent = window.CAMPAIGN.entrance;
      world = { id: "entrance", name: "Platform", day: 0, levels: [] };
      level = {
        id: ent?.id || am.levelId,
        name: ent?.name || "Entrance Set",
        character: ent?.character || "elowen",
        type: "entrance",
        questionIds: ent?.questionIds || [],
      };
    } else {
      world = window.CAMPAIGN.worlds.find((w) => w.id === am.worldId);
      level = world?.levels?.find((l) => l.id === am.levelId);
      if (!world || !level) {
        // visit practice stubs
        world = world || { id: am.worldId || "visit", name: "Practice", levels: [] };
        level = level || {
          id: am.levelId,
          name: "Saved trial",
          character: "elowen",
          type: "side",
        };
      }
    }
    const answered = am.answeredInMission || 0;
    const idx = Math.min(Math.max(0, am.index || 0), queue.length - 1);
    mission = {
      world,
      level,
      queue,
      index: idx,
      dialogueIndex: 0,
      introLines: [],
      questMode: !!am.questMode,
      guided: !!am.guided,
      entranceMode: !!am.entranceMode,
      passCorrect: am.passCorrect || 4,
      correctInMission: am.correctInMission || 0,
      answeredInMission: answered,
      lastOutcome: null,
    };
    if (answered >= queue.length) {
      finishMission();
      return true;
    }
    view = { name: "trial" };
    render();
    return true;
  }

  function hud() {
    const acc =
      state.stats.answered > 0
        ? Math.round((100 * state.stats.correct) / state.stats.answered)
        : 0;
    const c = companion();
    const ms = window.GameMusic?.status?.() || {};
    const musicLabel = musicHudLabel(ms);
    const inTrial =
      view.name === "trial" ||
      view.name === "outcome" ||
      view.name === "dialogue" ||
      view.name === "corridor";
    const node = $(`
      <header class="hud">
        <button type="button" class="hud-brand" data-go-home title="Home">ARCANUM</button>
        <div class="hud-pills">
          <button type="button" class="pill home-pill" data-go-home title="Save &amp; return home">⌂ Home</button>
          ${c ? `<span class="pill stat" title="${escapeHtml(c.role)}">◎ ${escapeHtml(c.name.split(" ")[0])}</span>` : ""}
          <span class="pill stat">${acc}% true</span>
          <span class="pill stat">⚔ ${state.stats.streak}</span>
          <button type="button" class="pill${ms.missing ? " music-warn" : ""}" data-music-toggle title="${escapeHtml(musicHudTitle(ms))}">${musicLabel}</button>
          <button type="button" class="pill" data-go="account" data-cloud-pill>${cloudPillLabel()}</button>
          <button type="button" class="pill" data-go="mastery">Review</button>
          <button type="button" class="pill" data-go="map">Atlas</button>
          ${inTrial ? `<button type="button" class="pill" data-pt-open title="Open Chart of the Elements">⚗ Elements</button>` : ""}
        </div>
      </header>
    `);
    const musicBtn = node.querySelector("[data-music-toggle]");
    if (musicBtn) {
      musicBtn.onclick = () => {
        const s = window.GameMusic?.status?.() || {};
        // Capture-phase unlock may have already set unlocked=true on this same
        // click — only mute when audio is actually playing.
        if (s.enabled === false || !s.unlocked || !s.playing || s.lastPlayError) {
          enableSoundFromClick();
          return;
        }
        window.GameMusic?.toggle?.();
        paintMusicHud();
        paintEnableSoundButtons();
      };
    }
    node.querySelectorAll("[data-go-home]").forEach((btn) => {
      btn.onclick = () => goHome();
    });
    const ptBtn = node.querySelector("[data-pt-open]");
    if (ptBtn) {
      ptBtn.onclick = () => window.PeriodicTable?.open?.();
    }
    node.querySelectorAll("[data-go]").forEach((btn) => {
      btn.onclick = () => {
        if (
          mission?.queue?.length &&
          (btn.dataset.go === "map" ||
            btn.dataset.go === "mastery" ||
            btn.dataset.go === "account")
        ) {
          checkpointMission(true);
          mission = null;
        }
        view = { name: btn.dataset.go };
        render();
      };
    });
    return node;
  }

  function viewCompanion() {
    const cards = Object.values(companions())
      .map((c) => {
        const path = state.paths?.[c.id];
        const progress = path?.entranceCleared
          ? `${(path.clearedLevels || []).length} doors cleared on their path`
          : companionPathMeta(c.id);
        return `
        <button type="button" class="companion-card" data-id="${c.id}" style="--accent:${c.accent || "var(--gold)"}">
          <div class="companion-art face-safe">
            <img class="portrait-img" src="${portraitSrc(c)}" alt="" style="object-position:${c.portraitFocus || CHAR_FOCUS[c.id] || "50% 22%"};object-fit:${c.portraitFit || "cover"}" loading="lazy" />
          </div>
          <span class="kind">${escapeHtml(c.houseCue)}</span>
          <span class="name">${escapeHtml(c.name)}</span>
          <span class="meta">${escapeHtml(c.tagline)}</span>
          <span class="meta path-meta">${escapeHtml(progress)}</span>
        </button>`;
      })
      .join("");

    const node = $(`
      <section class="scene scene-castle">
        ${castleAtmosphere({ fireflyCount: 22, position: "center 40%" })}
        <div class="scene-content wide">
          <div class="glass filigree glass-castle">
            <p class="eyebrow">MCAT mastery quest · choose your companion</p>
            <h2>Who walks the path with you?</h2>
            <p class="lede">
              Each companion carries a <strong>different</strong> slice of the AAMC Sample Chem/Phys Q1–59 bank.
              Switch companions anytime from Home to study the other wards — not the same deck twice.
            </p>
            <div class="companion-grid">${cards}</div>
            <div class="cta-row" style="justify-content:center;margin-top:1rem">
              <button type="button" class="btn primary" data-enable-sound>Enable sound</button>
            </div>
            <p class="fine">Progress is saved per companion path. Mentors and rivals still fill the wings.</p>
          </div>
        </div>
      </section>
    `);
    const soundBtn = node.querySelector("[data-enable-sound]");
    if (soundBtn) {
      soundBtn.onclick = (ev) => {
        ev.preventDefault();
        enableSoundFromClick();
      };
    }
    paintEnableSoundButtons();
    node.querySelectorAll("[data-id]").forEach((btn) => {
      btn.onclick = () => {
        enableSoundFromClick();
        state = window.GameEngine.setCompanion(state, btn.dataset.id);
        window.GameEngine.flushEmptyMains?.(state);
        window.GameEngine.syncLegacyFromPath?.(state);
        if (!state.flags?.entranceCleared) {
          startEntranceExam();
          return;
        }
        view = { name: "map" };
        render();
      };
    });
    return node;
  }

  function viewTitle() {
    const c = companion();
    const entered = !!state.flags?.entranceCleared;
    const am = state.activeMission;
    const resumeLabel = am?.questionIds?.length
      ? `Resume trial · Q${(am.index || 0) + 1}/${am.questionIds.length}`
      : "";
    const node = $(`
      <section class="scene scene-castle title-scene scene-whimsy">
        ${castleAtmosphere({ fireflyCount: 20, position: "center 40%" })}
        <div class="scene-content">
          <div class="glass filigree glass-castle scrapbook">
            <div class="title-seal wax" style="background-image:url('${STICKERS.seal}')"></div>
            <img class="title-ticket" src="${STICKERS.ticket}" alt="" />
            <p class="eyebrow whimsy">MCAT mastery · campus journey</p>
            <h1>Arcanum</h1>
            <p class="lede">
              ${
                entered
                  ? `Explore a campus atlas, follow a guided Play path, and unlock halls by scoring on Chem/Phys trials —
              Great Hall, Potion Vaults, Library, Owlery, Market Row, the inn, and the train.`
                  : `Questions first. Clear the Platform Entrance Set, board the Midnight Express,
              then the campus map opens. Exploration is the reward — mastery is the gate.`
              }
            </p>
            ${c ? portraitHtml(c, c.portraitFocus) : ""}
            ${c ? `<p class="speech-soft">“${escapeHtml(c.lines.greet)}”</p>` : ""}
            ${
              resumeLabel
                ? `<p class="fine">Unfinished ward saved locally — pick up where you left off.</p>`
                : ""
            }
            <div class="cta-row" style="justify-content:center">
              <button type="button" class="btn primary" data-enable-sound>Enable sound</button>
              ${
                resumeLabel
                  ? `<button type="button" class="btn cast" id="resume">${escapeHtml(resumeLabel)}</button>`
                  : ""
              }
              <button type="button" class="btn primary" id="begin">${
                !c
                  ? "Choose a study companion"
                  : entered
                    ? "Play · open campus atlas"
                    : "Start with questions"
              }</button>
              ${c ? `<button type="button" class="btn ghost" id="repick">Change companion</button>` : ""}
              <button type="button" class="btn ghost" id="install-app">Install on phone</button>
              <button type="button" class="btn ghost" id="account">Cloud account</button>
              <button type="button" class="btn ghost" id="fresh">Reset progress</button>
            </div>
            <p class="fine">
              Progress autosaves after every cast · Home always returns here.
              ${
                c
                  ? `Active path: ${escapeHtml(companionPathMeta(c.id))} (switch companion for the other Q1–59 wards).`
                  : "Choose a companion to claim a unique Q1–59 path."
              }
              Phone app: open your Netlify HTTPS link → Install / Add to Home Screen.
            </p>
          </div>
        </div>
      </section>
    `);
    const enableBtn = node.querySelector("[data-enable-sound]");
    if (enableBtn) {
      enableBtn.onclick = (ev) => {
        ev.preventDefault();
        enableSoundFromClick();
      };
    }
    paintEnableSoundButtons();
    const resumeBtn = node.querySelector("#resume");
    if (resumeBtn) {
      resumeBtn.onclick = () => {
        enableSoundFromClick();
        if (!resumeActiveMission()) {
          flashSaveToast("No saved trial");
        }
      };
    }
    node.querySelector("#begin").onclick = () => {
      enableSoundFromClick();
      if (!state.companionId) {
        view = { name: "companion" };
        render();
        return;
      }
      if (!state.flags?.entranceCleared) {
        startEntranceExam();
        return;
      }
      view = { name: "map" };
      render();
    };
    const repick = node.querySelector("#repick");
    if (repick) {
      repick.onclick = () => {
        view = { name: "companion" };
        render();
      };
    }
    const installBtn = node.querySelector("#install-app");
    if (installBtn) {
      installBtn.onclick = () => {
        if (window.ArcanumPwa?.isStandalone?.()) {
          flashSaveToast("Already running as an app");
          return;
        }
        try {
          localStorage.removeItem("arcanum-pwa-install-dismissed");
        } catch {
          /* ignore */
        }
        window.ArcanumPwa?.showInstallHelp?.();
      };
    }
    node.querySelector("#account").onclick = () => {
      view = { name: "account" };
      render();
    };
    node.querySelector("#fresh").onclick = () => {
      if (confirm("Erase all progress and curses?")) {
        state = window.GameEngine.reset();
        mission = null;
        if (window.GameCloud?.getUser?.()) {
          window.GameCloud.pushSave(state).catch(() => {});
        }
        view = { name: "companion" };
        render();
      }
    };
    return node;
  }

  function viewExplore() {
    const wrap = document.createElement("div");
    wrap.className = "explore-host";
    // Start after DOM attach
    requestAnimationFrame(() => {
      stopExplore();
      exploreSession = window.ExploreGame.start(wrap, state, {
        onState: (s) => {
          state = s;
          window.GameEngine.save(state);
        },
        onPause: (s) => {
          state = s;
          window.GameEngine.save(state);
          stopExplore();
          view = { name: "map" };
          render();
        },
        onSeal: (seal, s) => {
          state = s;
          window.GameEngine.save(state);
          stopExplore();
          const world = window.CAMPAIGN.worlds.find((w) => w.id === seal.worldId);
          if (!world) {
            view = { name: "explore" };
            render();
            return;
          }
          beginQuestFromSeal(world, seal.levelId, s.explore?.mapId || "asphodel");
        },
        onQuestWard: (aq, s) => {
          state = s;
          window.GameEngine.save(state);
          stopExplore();
          openQuestWardCast();
        },
      });
    });
    return wrap;
  }

  function beginQuestFromSeal(world, levelId, mapId) {
    const level = world.levels.find((l) => l.id === levelId);
    const queue = window.GameEngine.questionsForLevel(state, level);
    if (!queue.length) {
      alert("This quest has no wards yet.");
      view = { name: "explore" };
      render();
      return;
    }
    const questMap = mapId || "asphodel";
    window.Quest.begin(state, {
      worldId: world.id,
      levelId,
      mapId: questMap,
      title: level.name,
      character: level.character,
      questions: queue,
    });
    // Drop the scholar into the wing at the first burning ward
    if (!state.explore) {
      state.explore = {
        mapId: questMap,
        x: 0,
        y: 1.65,
        z: 8,
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
    state.explore.mapId = questMap;
    const path = window.Quest.sealPath(questMap, queue.length);
    const first = path[0];
    if (first) {
      state.explore.x = first[0];
      state.explore.y = 1.65;
      state.explore.z = first[2] + 2.8;
      state.explore.yaw = 0;
      state.explore.pitch = 0;
    }
    // Cache full queue on mission stub for finishMission
    mission = {
      world,
      level,
      queue,
      index: 0,
      questMode: true,
      correctInMission: 0,
      answeredInMission: 0,
      lastOutcome: null,
    };
    window.GameEngine.save(state);
    view = { name: "explore" };
    render();
  }

  function openQuestWardCast() {
    const aq = state.activeQuest;
    if (!aq) {
      view = { name: "explore" };
      render();
      return;
    }
    const world = window.CAMPAIGN.worlds.find((w) => w.id === aq.worldId);
    const level = world?.levels?.find((l) => l.id === aq.levelId);
    const queue = aq.questionIds
      .map((id) => window.QUESTION_PACK.questions.find((q) => q.id === id))
      .filter(Boolean);
    mission = {
      world,
      level,
      queue,
      index: aq.index,
      questMode: true,
      correctInMission: aq.correct,
      answeredInMission: aq.answered,
      lastOutcome: null,
    };
    view = { name: "trial" };
    render();
  }

  function viewAccount() {
    const s = window.GameCloud?.status?.() || {};
    const configured = !!s.configured;
    const signedIn = !!s.email;
    const msAudio = window.GameMusic?.status?.() || {};

    const node = $(`
      <section class="scene scene-castle">
        ${castleAtmosphere({ fireflyCount: 14, position: "center 38%" })}
        <div class="scene-content">
          <div class="glass filigree glass-castle">
            <button type="button" class="back-link" id="back">← Back</button>
            <p class="eyebrow">Supabase cloud save</p>
            <h2>${signedIn ? "Your account" : "Link this campaign"}</h2>
            <p class="lede" id="cloud-status">
              ${
                !configured
                  ? "Cloud is not configured yet. Add Supabase keys on Netlify (see docs/SETUP-SUPABASE-NETLIFY.md)."
                  : signedIn
                    ? `Signed in as <strong>${escapeHtml(s.email)}</strong>. Progress syncs after each cast.`
                    : "Create an account or sign in to keep mastery across phone and laptop."
              }
            </p>
            ${
              configured && !signedIn
                ? `
              <form id="auth-form" class="auth-form">
                <label>Display name <input name="name" type="text" placeholder="Kass" autocomplete="nickname" /></label>
                <label>Email <input name="email" type="email" required placeholder="you@email.com" autocomplete="email" /></label>
                <label>Password <input name="password" type="password" required minlength="6" placeholder="••••••••" autocomplete="current-password" /></label>
                <div class="cta-row">
                  <button type="submit" class="btn primary" data-mode="signin">Sign in</button>
                  <button type="button" class="btn ghost" id="signup">Create account</button>
                </div>
              </form>`
                : ""
            }
            ${
              signedIn
                ? `
              <div class="cta-row">
                <button type="button" class="btn primary" id="pull">Restore from cloud</button>
                <button type="button" class="btn ghost" id="push">Save to cloud now</button>
                <button type="button" class="btn ghost" id="signout">Sign out</button>
              </div>`
                : ""
            }
            <p class="fine" id="cloud-msg">${escapeHtml(cloudMsg)}</p>
            <div class="audio-sliders" data-audio-settings>
              <p class="eyebrow" style="margin-top:1.25rem">Soundtrack</p>
              <label class="audio-slider">
                <span>Music</span>
                <input type="range" min="5" max="100" step="1" data-music-vol
                  value="${Math.round((msAudio.musicVolume ?? msAudio.volume ?? 0.48) * 100)}" />
              </label>
              <label class="audio-slider">
                <span>SFX</span>
                <input type="range" min="0" max="100" step="1" data-sfx-vol
                  value="${Math.round((msAudio.sfxVolume ?? 0.55) * 100)}" />
              </label>
              <p class="fine">Long ambient fades · soft UI clicks · gentle vocal pads. Prefs stay on this device.</p>
            </div>
          </div>
        </div>
      </section>
    `);

    const musicVol = node.querySelector("[data-music-vol]");
    const sfxVol = node.querySelector("[data-sfx-vol]");
    if (musicVol) {
      musicVol.oninput = () => {
        window.GameMusic?.setMusicVolume?.(Number(musicVol.value) / 100);
      };
    }
    if (sfxVol) {
      sfxVol.oninput = () => {
        window.GameMusic?.setSfxVolume?.(Number(sfxVol.value) / 100);
        window.GameMusic?.playUi?.("click");
      };
    }

    node.querySelector("#back").onclick = () => {
      view = { name: "title" };
      render();
    };

    const form = node.querySelector("#auth-form");
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        await handleAuth(form, "signin");
      };
      node.querySelector("#signup").onclick = async () => {
        await handleAuth(form, "signup");
      };
    }

    const pull = node.querySelector("#pull");
    if (pull) {
      pull.onclick = async () => {
        try {
          cloudMsg = "Pulling…";
          render();
          const remote = await window.GameCloud.pullSave();
          const merged = window.GameCloud.mergeSaves(state, remote);
          state = window.GameEngine.replaceState(merged);
          cloudMsg = remote
            ? "Cloud save restored (merged with local)."
            : "No cloud save yet — keeping local progress.";
          await window.GameCloud.pushSave(state);
        } catch (err) {
          cloudMsg = err.message || "Pull failed.";
        }
        render();
      };
    }

    const push = node.querySelector("#push");
    if (push) {
      push.onclick = async () => {
        try {
          const ok = await window.GameCloud.pushSave(state);
          cloudMsg = ok ? "Saved to cloud." : "Save failed.";
        } catch (err) {
          cloudMsg = err.message || "Save failed.";
        }
        render();
      };
    }

    const signout = node.querySelector("#signout");
    if (signout) {
      signout.onclick = async () => {
        await window.GameCloud.signOut();
        cloudMsg = "Signed out. Local progress remains on this device.";
        render();
      };
    }

    return node;
  }

  async function handleAuth(form, mode) {
    const fd = new FormData(form);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const name = String(fd.get("name") || "");
    cloudMsg = mode === "signup" ? "Creating account…" : "Signing in…";
    const msgEl = document.getElementById("cloud-msg");
    if (msgEl) msgEl.textContent = cloudMsg;
    try {
      if (mode === "signup") {
        await window.GameCloud.signUp(email, password, name);
        if (name) state.playerName = name;
      } else {
        await window.GameCloud.signIn(email, password);
      }
      const remote = await window.GameCloud.pullSave();
      const merged = window.GameCloud.mergeSaves(state, remote);
      if (name) merged.playerName = name || merged.playerName;
      state = window.GameEngine.replaceState(merged);
      await window.GameCloud.pushSave(state);
      cloudMsg =
        "Signed in. Your progress will sync to Supabase after each cast.";
    } catch (err) {
      cloudMsg = err.message || "Auth failed.";
    }
    view = { name: "account" };
    render();
  }

  function startEntranceExam() {
    const ent = window.CAMPAIGN.entrance;
    if (!ent || !state.companionId) {
      state = window.GameEngine.markEntranceCleared(state);
      view = { name: "map" };
      render();
      return;
    }
    const plan = window.GameEngine.entrancePlan(state);
    const queue = (plan.questionIds || [])
      .map((n) => window.GameEngine.getQuestionByNumber(n))
      .filter(Boolean);
    if (!queue.length) {
      state = window.GameEngine.markEntranceCleared(state);
      view = { name: "map" };
      render();
      return;
    }
    const c = companion();
    const introLines = [
      ...(ent.intro || []),
      {
        speaker: "_companion",
        text: c
          ? `${c.name.split(" ")[0]}'s path uses sample wards ${plan.questionIds[0]}–${plan.questionIds[plan.questionIds.length - 1]} here — other companions carry different questions from the Q1–59 bank.`
          : "Each companion carries a different slice of the Q1–59 sample bank.",
      },
    ];
    mission = {
      world: { id: "entrance", name: "Platform", day: 0, levels: [] },
      level: {
        id: plan.id,
        name: plan.name,
        character: plan.character,
        type: "entrance",
        questionIds: plan.questionIds,
      },
      queue: window.GameEngine.shuffleArray(queue),
      index: 0,
      dialogueIndex: 0,
      introLines,
      guided: true,
      entranceMode: true,
      passCorrect: plan.passCorrect || 4,
      correctInMission: 0,
      answeredInMission: 0,
      lastOutcome: null,
    };
    checkpointMission(false);
    view = { name: "dialogue" };
    render();
  }

  function goToSpot(spot) {
    if (!spot || !spotIsOpen(spot)) return;
    if (spot.kind === "world") {
      view = { name: "world", worldId: spot.worldId };
      render();
      return;
    }
    view = { name: "visit", spotId: spot.id };
    render();
  }

  function viewMap() {
    if (!state.companionId) {
      view = { name: "companion" };
      return viewCompanion();
    }
    window.GameEngine.flushEmptyMains?.(state);
    window.GameEngine.syncLegacyFromPath?.(state);
    if (!state.flags?.entranceCleared) {
      startEntranceExam();
      return document.createElement("div");
    }
    const due = window.GameEngine.dueQuestions(state, 99).length;
    const goal = questGoalHint();
    const beats = playJourneyBeats();
    const atlas = window.CAMPAIGN.atlas || { spots: [] };
    const spots = atlas.spots || [];
    const halls = spots.filter((s) => s.kind === "world");
    const visits = spots.filter((s) => s.kind === "visit");
    const nextWorldId = goal?.world?.id;

    const pins = spots
      .map((spot) => {
        const open = spotIsOpen(spot);
        const pos = spot.mapPos || { left: "40%", top: "40%", w: "20%" };
        const seen = state.visitedSpots?.includes(spot.id);
        const isNext =
          open &&
          ((spot.kind === "world" && spot.worldId === nextWorldId) ||
            (spot.kind === "visit" && !seen && open));
        const w = spot.worldId
          ? window.CAMPAIGN.worlds.find((x) => x.id === spot.worldId)
          : null;
        const clearedMains = w
          ? w.levels.filter(
              (l) => l.type === "main" && state.clearedLevels.includes(l.id)
            ).length
          : 0;
        const totalMains = w
          ? w.levels.filter((l) => l.type === "main").length
          : 0;
        const meta = open
          ? spot.kind === "world"
            ? `${clearedMains}/${totalMains} trials`
            : seen
              ? "Visited"
              : "Open · visit"
          : spotLockHint(spot);
        return `
          <button type="button"
            class="campus-pin ${open ? "open" : "locked"} ${
              isNext && spot.kind === "world" ? "next-dest" : ""
            } ${seen ? "seen" : ""} ${spot.kind}"
            data-spot="${spot.id}" data-kind="${spot.kind}"
            data-world="${spot.worldId || ""}"
            ${open ? "" : "disabled"}
            style="left:${pos.left};top:${pos.top};width:${pos.w || "22%"};--pin-art:url('${spot.art}')"
            title="${escapeHtml(open ? spot.name : spotLockHint(spot))}">
            <span class="campus-pin-thumb" aria-hidden="true"></span>
            <span class="campus-pin-label">
              <strong>${escapeHtml(spot.pin || spot.name)}</strong>
              <small>${escapeHtml(meta)}</small>
            </span>
          </button>`;
      })
      .join("");

    const roster = [...halls, ...visits]
      .map((spot) => {
        const open = spotIsOpen(spot);
        const w = spot.worldId
          ? window.CAMPAIGN.worlds.find((x) => x.id === spot.worldId)
          : null;
        const seen = state.visitedSpots?.includes(spot.id);
        const clearedMains = w
          ? w.levels.filter(
              (l) => l.type === "main" && state.clearedLevels.includes(l.id)
            ).length
          : 0;
        const totalMains = w
          ? w.levels.filter((l) => l.type === "main").length
          : 0;
        const lit = open && spot.worldId === nextWorldId;
        return `
          <button type="button" class="campus-loc ${open ? "open" : "locked"} ${
            lit ? "lit" : ""
          }"
            data-spot="${spot.id}" data-kind="${spot.kind}"
            data-world="${spot.worldId || ""}"
            ${open ? "" : "disabled"}
            style="--loc-art:url('${spot.art}')">
            <span class="campus-thumb" aria-hidden="true"></span>
            <span class="campus-body">
              <span class="kind">${escapeHtml(spot.role)}</span>
              <span class="name">${escapeHtml(spot.name)}</span>
              <span class="meta">${
                open
                  ? spot.kind === "world"
                    ? `${clearedMains}/${totalMains} main trials · tap to enter`
                    : seen
                      ? "Visited · tap to return"
                      : "Unlocked — tap to visit"
                  : escapeHtml(spotLockHint(spot))
              }</span>
            </span>
            <span class="campus-seal">${open ? (lit ? "▶" : "✦") : "🔒"}</span>
          </button>`;
      })
      .join("");

    const node = $(`
      <section class="scene scene-castle scene-whimsy campus-scene">
        ${castleAtmosphere({ fireflyCount: 14, position: "center 32%" })}
        <div class="scene-content wide">
          <div class="glass filigree glass-castle scrapbook campus-panel">
            <p class="eyebrow whimsy">Campus atlas · explore by place</p>
            <h2>${escapeHtml(atlas.title || "Campus Atlas")}</h2>
            ${journeyRibbon()}
            ${yearPathHtml()}
            ${playHubHtml(goal, beats)}
            <p class="fine atlas-due">${due} spaced-review items waiting in the Grimoire.</p>

            <p class="eyebrow map-section-label">Tap the map to travel</p>
            <div class="map-board campus-board" style="background-image:url('${ART.map}')" role="group" aria-label="Campus map">
              <div class="map-board-mist" aria-hidden="true"></div>
              <div class="map-vignette owl" style="background-image:url('${ART.owl}')"></div>
              <div class="map-vignette hut" style="background-image:url('${ART.hut}')"></div>
              ${pins}
            </div>

            <p class="eyebrow map-section-label">All locations</p>
            <div class="campus-grid">${roster}</div>
            <p class="fine" style="margin-top:0.85rem">
              Locations unlock by MCAT trial success — never by walking alone.
              Village visits are rewards for scoring; study halls hold the year path.
            </p>
          </div>
        </div>
      </section>
    `);

    const goPlay = () => {
      if (!goal) return;
      view = { name: "world", worldId: goal.world.id };
      render();
    };
    const playBtn = node.querySelector("#play-continue");
    if (playBtn) playBtn.onclick = goPlay;
    const grim = node.querySelector("#play-grimoire");
    if (grim) {
      grim.onclick = () => {
        view = { name: "mastery" };
        render();
      };
    }
    node.querySelectorAll("[data-year-world]").forEach((btn) => {
      btn.onclick = () => {
        if (btn.disabled) return;
        view = { name: "world", worldId: btn.dataset.yearWorld };
        render();
      };
    });
    node.querySelectorAll("[data-spot]").forEach((btn) => {
      btn.onclick = () => {
        if (btn.disabled) return;
        const spot = spots.find((s) => s.id === btn.dataset.spot);
        goToSpot(spot);
      };
    });
    return node;
  }

  function viewVisit() {
    const spot = (window.CAMPAIGN.atlas?.spots || []).find(
      (s) => s.id === view.spotId
    );
    if (!spot || !spotIsOpen(spot)) {
      view = { name: "map" };
      return viewMap();
    }
    const firstVisit = !(state.visitedSpots || []).includes(spot.id);
    state = window.GameEngine.visitSpot(state, spot.id);
    const c = companion();
    const canPractice = (spot.optionalQuestions || []).length > 0;
    const arrive =
      spot.arrive ||
      spot.blurb ||
      "You arrive. The place is quiet until you choose a trial.";
    const companionAside = c
      ? firstVisit
        ? `${c.name.split(" ")[0]}: “New ground. Look around — then we earn the next seal.”`
        : `${c.name.split(" ")[0]}: “Back again. Ready when you are.”`
      : "";
    const node = $(`
      <section class="scene scene-castle visit-scene arrive-scene">
        ${castleAtmosphere({ fireflyCount: 16, position: "center 40%" })}
        <div class="scene-content">
          <div class="glass filigree glass-castle">
            <button type="button" class="back-link" id="back">← Campus atlas</button>
            <p class="eyebrow">${escapeHtml(spot.role)} · location visit · unlocked by mastery</p>
            <h2>${escapeHtml(spot.name)}</h2>
            ${c ? journeyRibbon() : ""}
            <div class="visit-hero arrive-hero" style="background-image:url('${spot.art}')">
              <span class="arrive-tag">${firstVisit ? "Arriving" : "Returning"}</span>
            </div>
            <blockquote class="speech arrive-line">“${escapeHtml(arrive)}”</blockquote>
            ${
              companionAside
                ? `<p class="speech-soft">${escapeHtml(companionAside)}</p>`
                : ""
            }
            <p class="lede">${escapeHtml(spot.blurb)}</p>
            <div class="cta-row">
              ${
                canPractice
                  ? `<button type="button" class="btn primary" id="practice">Short practice here</button>`
                  : ""
              }
              <button type="button" class="btn ghost" id="back2">Explore the map</button>
            </div>
            <p class="fine">Visits are immersion rewards. Meaningful year progress still requires main-trial scores ≥60%.</p>
          </div>
        </div>
      </section>
    `);
    const goMap = () => {
      view = { name: "map" };
      render();
    };
    node.querySelector("#back").onclick = goMap;
    node.querySelector("#back2").onclick = goMap;
    const prac = node.querySelector("#practice");
    if (prac) {
      prac.onclick = () => {
        const queue = spot.optionalQuestions
          .map((n) => window.GameEngine.getQuestionByNumber(n))
          .filter(Boolean);
        mission = {
          world: {
            id: "visit-" + spot.id,
            name: spot.name,
            day: 0,
            levels: [],
          },
          level: {
            id: "visit-" + spot.id,
            name: spot.name + " practice",
            character: "elowen",
            type: "side",
          },
          queue: window.GameEngine.shuffleArray(queue),
          index: 0,
          dialogueIndex: 0,
          introLines: [
            {
              speaker: "_companion",
              text: c
                ? `${c.name.split(" ")[0]} settles in at ${spot.name}. Short set — still real wards.`
                : `A short Chem/Phys set at ${spot.name}.`,
            },
            {
              speaker: "elowen",
              text: `Optional practice at ${spot.name}. Treat every cast like exam day.`,
            },
          ],
          guided: true,
          correctInMission: 0,
          answeredInMission: 0,
          lastOutcome: null,
        };
        checkpointMission(false);
        view = { name: "dialogue" };
        render();
      };
    }
    return node;
  }

  function viewTrain() {
    const c = companion();
    const node = $(`
      <section class="scene scene-castle train-scene scene-whimsy">
        ${castleAtmosphere({ fireflyCount: 16, position: "center 42%" })}
        <div class="scene-content">
          <div class="glass filigree glass-castle scrapbook">
            <img class="inline-sticker" src="${STICKERS.ticket}" alt="" />
            <p class="eyebrow whimsy">You earned your ticket</p>
            <h2>Midnight Express</h2>
            <div class="visit-hero" style="background-image:url('${ART.train}')"></div>
            <p class="lede">
              You answered enough Chem/Phys items to earn your seat.
              ${
                c
                  ? `${escapeHtml(c.name.split(" ")[0])} rides with you.`
                  : ""
              }
              The atlas opens when you arrive — Great Hall first, then vaults, library, owlery,
              Market Row, and the inn as your scores climb.
            </p>
            <div class="cta-row">
              <button type="button" class="btn primary" id="arrive">Arrive · open atlas</button>
            </div>
          </div>
        </div>
      </section>
    `);
    node.querySelector("#arrive").onclick = () => {
      view = { name: "map" };
      render();
    };
    return node;
  }

  function viewWorld() {
    const world = window.CAMPAIGN.worlds.find((w) => w.id === view.worldId);
    if (!world) {
      view = { name: "map" };
      return viewMap();
    }
    const c = companion();
    const suggestSide = state.journey?.suggestedSideWorldId === world.id;
    const goal = questGoalHint();
    const beats = playJourneyBeats().filter((b) => b.world.id === world.id);
    const nextHere = beats.find((b) => b.status === "current");
    // Only show doors that have wards on this companion's path (or dynamic review)
    const doors = world.levels
      .filter((lv) => lv.dynamicReview || levelWardCount(lv) > 0)
      .map((lv) => {
        const cleared = state.clearedLevels.includes(lv.id);
        const locked = isLevelLocked(world, lv);
        const gate = locked ? levelGateHint(world, lv) : null;
        const nQ = levelWardCount(lv);
        const beat = beats.find((b) => b.level.id === lv.id);
        const kind =
          lv.type === "side"
            ? "Side quest"
            : lv.isFinale || lv.isWorldGate
              ? "Gate trial"
              : beat
                ? `Beat ${beat.n} · Main trial`
                : "Main trial";
        const highlight =
          (suggestSide && lv.type === "side" && !cleared) ||
          (nextHere && nextHere.level.id === lv.id)
            ? " suggested"
            : "";
        const thumb = doorThumb(lv, world);
        const status = cleared
          ? `Cleared · doors open`
          : locked
            ? escapeHtml(gate || "Sealed")
            : `${nQ} MCAT wards · need ≥60% to clear`;
        return `
          <button type="button" class="door ${lv.type} ${cleared ? "cleared open-door" : ""} ${locked ? "locked" : "ready"}${highlight}"
            data-level="${lv.id}" ${locked ? "disabled" : ""}>
            <span class="door-icon ${cleared ? "lit" : ""}" style="background-image:url('${thumb}');background-position:center 30%"></span>
            <span>
              <span class="kind">${kind}${
                highlight ? " · play next" : ""
              }</span>
              <span class="name">${escapeHtml(lv.name)}</span>
              <span class="meta">${escapeHtml(
                chars()[lv.character]?.name || ""
              )} · ${status}</span>
            </span>
            <span class="meta">${cleared ? "✦" : locked ? "🔒" : "→"}</span>
          </button>`;
      })
      .join("");

    const wingBg =
      world.mapArt || artScene(world.sceneKey || WING_SCENE[world.id] || "chamber");
    const node = $(`
      <section class="scene scene-castle location-hub">
        ${castleAtmosphere({ fireflyCount: 16, position: "center 40%" })}
        <div class="scene-content">
          <div class="glass filigree glass-castle">
            <button type="button" class="back-link" id="back">← Campus atlas</button>
            <p class="eyebrow">You are here · Day ${world.day}${
              c ? ` · with ${escapeHtml(c.name.split(" ")[0])}` : ""
            } · ${escapeHtml(world.place || world.name)}</p>
            <h2>${escapeHtml(world.name)}</h2>
            ${journeyRibbon()}
            <div class="location-arrive" style="background-image:url('${wingBg}')">
              <span class="arrive-tag">Study hall</span>
            </div>
            <p class="lede">${escapeHtml(world.atmosphere)}</p>
            ${
              nextHere
                ? `<div class="play-next-card">
                    <p class="eyebrow">Play next</p>
                    <p class="lede" style="margin:0"><strong>Beat ${nextHere.n}: ${escapeHtml(
                      nextHere.level.name
                    )}</strong></p>
                    <button type="button" class="btn primary" id="play-here">Begin this trial</button>
                  </div>`
                : goal && goal.world.id !== world.id
                  ? `<p class="fine">No open mains here — Continue from the campus Play hub for Day ${goal.world.day}.</p>`
                  : ""
            }
            <p class="fine">
              Main trials gate the year: clear ≥60% of their MCAT wards to open the next door / place.
              ${c ? `Showing ${escapeHtml(c.name.split(" ")[0])}'s unique wards (${escapeHtml(companionPathMeta(c.id))}).` : ""}
            </p>
            <div class="mission-rail">${doors || "<p class='fine'>No open wards left on this path in this hall — try another companion from Home, or Continue on the atlas.</p>"}</div>
          </div>
        </div>
      </section>
    `);
    node.querySelector("#back").onclick = () => {
      view = { name: "map" };
      render();
    };
    const playHere = node.querySelector("#play-here");
    if (playHere && nextHere) {
      playHere.onclick = () => startMission(world, nextHere.level.id);
    }
    node.querySelectorAll("[data-level]").forEach((btn) => {
      btn.onclick = () => startMission(world, btn.dataset.level);
    });
    return node;
  }

  function isLevelLocked(world, level) {
    if (level.type === "side") return false;
    const mains = world.levels.filter((l) => l.type === "main");
    const idx = mains.findIndex((l) => l.id === level.id);
    if (idx <= 0) return false;
    return !state.clearedLevels.includes(mains[idx - 1].id);
  }

  function startMission(world, levelId) {
    // Guided mastery quest: short intro → questions back-to-back
    const level = world.levels.find((l) => l.id === levelId);
    if (!level) return;
    const queue = window.GameEngine.questionsForLevel(state, level);
    if (!queue.length) {
      // Empty on this companion path — advance past it
      state = window.GameEngine.clearLevel(
        state,
        level.id,
        level.successUnlock || null
      );
      flashSaveToast("Path continues — no wards on this door");
      view = { name: "world", worldId: world.id };
      render();
      return;
    }
    if (state.activeQuest && window.Quest) window.Quest.clear(state);
    const introLines = [...(level.intro || [])];
    const c = companion();
    if (c?.lines?.map) {
      introLines.push({
        speaker: "_companion",
        text: `${c.name.split(" ")[0]}: ${c.lines.map}`,
      });
    }
    introLines.push({
      speaker: level.character,
      text: `This chamber holds ${queue.length} wards. Cast true — each question advances your MCAT mastery quest.`,
    });
    mission = {
      world,
      level,
      queue,
      index: 0,
      dialogueIndex: 0,
      introLines,
      questMode: false,
      guided: true,
      correctInMission: 0,
      answeredInMission: 0,
      lastOutcome: null,
    };
    checkpointMission(false);
    view = { name: "dialogue" };
    render();
  }

  function viewCorridor() {
    if (!mission) {
      view = { name: "map" };
      return viewMap();
    }
    const next = mission.index + 1;
    const total = mission.queue.length;
    const npc = chars()[mission.level.character];
    const node = $(`
      <section class="scene scene-castle corridor-beat">
        ${castleAtmosphere({ fireflyCount: 14, position: "center 38%" })}
        <div class="scene-content">
          <div class="glass filigree glass-castle">
            ${portraitHtml(npc || companion(), (npc || companion())?.portraitFocus)}
            <p class="eyebrow">Corridor beat · ${escapeHtml(mission.level.name)}</p>
            <h2>Ward ${next} of ${total} awaits</h2>
            ${wardPipsHtml(next - 1, total)}
            <p class="lede">
              You advance a short stretch of the wing. The next seal already hums —
              raise your wand when ready. (This is the 15% story; the casting is the quest.)
            </p>
            <div class="cta-row">
              <button type="button" class="btn cast" id="cast-next">Cast the next ward</button>
            </div>
          </div>
        </div>
      </section>
    `);
    node.querySelector("#cast-next").onclick = () => {
      mission.index += 1;
      view = { name: "trial" };
      render();
    };
    return node;
  }

  function viewDialogue() {
    const { level } = mission;
    const lines = mission.introLines || level.intro || [];
    const line = lines[mission.dialogueIndex] || {
      speaker: level.character,
      text: "The chamber waits.",
    };
    const isCompanion = line.speaker === "_companion";
    const c = isCompanion
      ? companion()
      : chars()[line.speaker] || chars()[level.character];
    const more = mission.dialogueIndex < lines.length - 1;
    const beatN = mission.dialogueIndex + 1;
    const beatTotal = Math.max(lines.length, 1);
    const focus = isCompanion
      ? companion()?.portraitFocus
      : c?.portraitFocus || CHAR_FOCUS[c?.id] || "50% 16%";
    const node = $(`
      <section class="scene scene-castle dialogue-scene">
        ${castleAtmosphere({ fireflyCount: 18, position: "center 38%" })}
        <div class="scene-content">
          <div class="glass filigree glass-castle dialogue-panel">
            <p class="eyebrow dialogue-beat">Scene ${beatN} of ${beatTotal} · ${escapeHtml(
              level.name
            )}</p>
            ${wardPipsHtml(mission.dialogueIndex, beatTotal)}
            ${portraitHtml(c, focus)}
            <blockquote class="speech dialogue-type">“${escapeHtml(line.text)}”</blockquote>
            <div class="cta-row">
              <button type="button" class="btn primary" id="next">${
                more ? "Continue →" : "Raise your wand · begin trial"
              }</button>
              ${
                more
                  ? `<button type="button" class="btn ghost" id="skip-intro">Skip to trial</button>`
                  : ""
              }
            </div>
            <p class="fine">Story frames the cast. The wards are MCAT questions — that is how you advance.</p>
          </div>
        </div>
      </section>
    `);
    const enterTrial = () => {
      view = { name: "trial" };
      render();
    };
    node.querySelector("#next").onclick = () => {
      if (more) {
        mission.dialogueIndex += 1;
        render();
      } else {
        enterTrial();
      }
    };
    const skip = node.querySelector("#skip-intro");
    if (skip) skip.onclick = enterTrial;
    return node;
  }

  function viewTrial() {
    const q = mission.queue[mission.index];
    const glyph = window.glyphFor(q.topic);
    const progress = `Question ${mission.index + 1} of ${mission.queue.length}`;
    const passage = q.passage
      ? `<div class="passage-tome open">
          <p class="passage-label">${escapeHtml(q.passageLabel || "Passage")}</p>
          <p class="passage-body">${escapeHtml(q.passage)}</p>
        </div>`
      : q.passageLabel
        ? `<p class="passage-tome">${escapeHtml(q.passageLabel)}</p>`
        : "";

    const incants = ["A", "B", "C", "D"]
      .map(
        (L) => `
        <button type="button" class="incant" data-choice="${L}">
          <span class="rune">${L}</span>
          <span>${escapeHtml(q.choices[L] || "")}</span>
        </button>`
      )
      .join("");

    // Locked format: full-bleed night castle + fireflies. Header banners only vary.
    const node = $(`
      <section class="scene scene-castle">
        ${castleAtmosphere({ fireflyCount: 16, position: "center 36%" })}
        <div class="arena">
          <div class="arena-top">
            <span>${escapeHtml(mission.level.name)}</span>
            <span>${progress}</span>
          </div>
          ${wardPipsHtml(mission.index, mission.queue.length)}
          <div class="challenge-scroll glass bright glass-castle" style="padding:0.95rem 1rem">
            ${passage}
            ${trialVisualPanel(q, glyph)}
            <p class="ward-label">Living ward · cast to advance</p>
            <p class="stem">${escapeHtml(q.stem)}</p>
          </div>
          <div class="arena-tools">
            <button type="button" class="btn ghost" id="open-pt" title="Open Chart of the Elements">⚗ Elements chart</button>
            <button type="button" class="btn ghost" id="trial-home" title="Save progress and return home">⌂ Save &amp; Home</button>
          </div>
          <div class="glyph-card compact">
            <div class="glyph-mark">${window.glyphSvg(glyph.svg)}</div>
            <div>
              <p class="spell-name">${escapeHtml(glyph.spell)}</p>
              <p class="spell-cue">${escapeHtml(glyph.cue)}</p>
            </div>
          </div>
          <div class="incantations">${incants}</div>
          <p class="fine">Choose A–D. Wrong answers stay in the Grimoire for review. Open the Elements chart anytime for Z / mass.</p>
        </div>
      </section>
    `);

    node.querySelector("#open-pt").onclick = () => window.PeriodicTable?.open?.();
    node.querySelector("#trial-home").onclick = () => goHome();

    node.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.onclick = () => {
        btn.classList.add("casting");
        fireBeam();
        window.GameMusic?.playUi?.("cast");
        const choice = btn.dataset.choice;
        const correct = choice === q.correct;
        setTimeout(() => {
          state = window.GameEngine.recordAnswer(state, q, choice, correct);
          mission.answeredInMission += 1;
          if (correct) mission.correctInMission += 1;
          // Advance checkpoint to next unanswered ward (or last if finishing)
          const nextIndex =
            mission.index < mission.queue.length - 1
              ? mission.index + 1
              : mission.index;
          const savedIndex = mission.index;
          mission.index = nextIndex;
          checkpointMission(false);
          mission.index = savedIndex;
          mission.lastOutcome = { q, choice, correct, solution: q.solution, glyph };
          burstSparks(correct);
          if (window.GameMusic?.playOutcome) {
            window.GameMusic.playOutcome(correct);
          }
          view = { name: "outcome" };
          render();
        }, 420);
      };
    });
    return node;
  }

  function viewOutcome() {
    const o = mission.lastOutcome;
    const npc = chars()[mission.level.character];
    const cLine = companionLine(o.correct ? "success" : "curse");
    const reaction = cLine
      ? cLine
      : o.correct
        ? pick([
            `The seal drinks your spell. ${npc.name} watches the light climb the stones.`,
            `True cast. The rune ring holds — the corridor breathes again.`,
            `Your wand-work lands clean. Somewhere, Cassian scowls.`,
          ])
        : pick([
            `The ward shatters. A curse brands ${topicLabel(o.q.topic)} into the walls.`,
            `${npc.name}: “The castle keeps that mistake. It will find you again.”`,
            `Your spell frays. Lyra’s whisper follows the fault into the dark.`,
          ]);

    const who = companion() || npc;

    const node = $(`
      <section class="scene scene-castle">
        ${castleAtmosphere({ fireflyCount: 16, position: "center 40%" })}
        <div class="outcome-burst ${o.correct ? "" : "bad"}"></div>
        <div class="scene-content">
          <div class="glass filigree glass-castle">
            ${portraitHtml(who, who.portraitFocus || CHAR_FOCUS[who.id])}
            <p class="outcome-banner ${o.correct ? "ok" : "bad"}">${
              o.correct ? "Ward holds" : "Curse set"
            }</p>
            <p class="lede">${escapeHtml(reaction)}</p>
            <div class="glyph-card" style="margin-top:0.9rem">
              <div class="glyph-mark">${window.glyphSvg(o.glyph.svg)}</div>
              <div>
                <p class="spell-name">${escapeHtml(o.glyph.spell)}</p>
                <p class="spell-cue">Memory mark: ${escapeHtml(o.glyph.cue)}</p>
              </div>
            </div>
            <p class="fine">You cast <strong>${o.choice}</strong> · True seal was <strong>${
              o.q.correct
            }</strong></p>
            <div class="solution-tome">
              <h3>Spell breakdown</h3>
              <p>${escapeHtml(o.solution || "No breakdown in this tome.")}</p>
            </div>
            <div class="cta-row">
              <button type="button" class="btn ghost" id="outcome-pt">⚗ Elements chart</button>
              <button type="button" class="btn ghost" id="outcome-home">⌂ Save &amp; Home</button>
              <button type="button" class="btn cast" id="next">${
                mission.index < mission.queue.length - 1
                  ? mission.entranceMode
                    ? "Next question"
                    : "Continue"
                  : mission.entranceMode
                    ? "Finish entrance set"
                    : "Finish this set"
              }</button>
            </div>
          </div>
        </div>
      </section>
    `);
    node.querySelector("#outcome-pt").onclick = () => window.PeriodicTable?.open?.();
    node.querySelector("#outcome-home").onclick = () => goHome();
    node.querySelector("#next").onclick = () => {
      // Legacy 3D seal quest (optional wander) — keep working if somehow active
      if (mission.questMode && state.activeQuest) {
        const wasCorrect = !!mission.lastOutcome?.correct;
        const result = window.Quest.advance(state, wasCorrect);
        if (mission.lastOutcome) {
          mission.answeredInMission = state.activeQuest
            ? state.activeQuest.answered
            : result.answered;
          mission.correctInMission = state.activeQuest
            ? state.activeQuest.correct
            : result.correct;
        }
        window.GameEngine.save(state);
        if (result.done) {
          if (state.activeQuest) {
            mission.correctInMission = result.correct;
            mission.answeredInMission = result.answered;
          }
          window.Quest.clear(state);
          window.GameEngine.save(state);
          finishMission();
        } else {
          view = { name: "corridor" };
          render();
        }
        return;
      }
      if (mission.index < mission.queue.length - 1) {
        // Questions stay back-to-back — no corridor detour interrupting study
        mission.index += 1;
        checkpointMission(false);
        view = { name: "trial" };
        render();
      } else {
        finishMission();
      }
    };
    return node;
  }

  function buildMissionDecision(cleared, world, level) {
    const c = companion();
    const name = c?.name?.split(" ")[0] || "Your companion";
    const side = world.levels.find(
      (l) => l.type === "side" && !state.clearedLevels.includes(l.id)
    );
    const nextGoal = (() => {
      const mains = world.levels.filter((l) => l.type === "main");
      const idx = mains.findIndex((l) => l.id === level.id);
      if (cleared && idx >= 0 && idx < mains.length - 1) return mains[idx + 1];
      return null;
    })();
    const choices = [
      {
        id: "press-on",
        label: nextGoal
          ? `Continue quest → ${nextGoal.name}`
          : "Return to the quest path",
        detail: nextGoal
          ? "Stay on the mastery path — next sealed door."
          : "Open the day map and pick your next wing.",
        effects: { flag: "chose_press", mood: "steeled" },
        go: nextGoal
          ? { name: "world", worldId: world.id }
          : { name: "map" },
      },
      {
        id: "rest-review",
        label: "Rest & open the Grimoire",
        detail: `${name} insists on reviewing curses.`,
        effects: { flag: "chose_rest", mood: "steady", inventory: "rested_once" },
        go: { name: "mastery" },
      },
    ];
    if (side) {
      choices.splice(1, 0, {
        id: "side-door",
        label: `Side quest: ${side.name.replace(/^Side Mission:\s*/, "")}`,
        detail: "Optional wards — still counts for mastery patterns.",
        effects: {
          flag: "chose_side_path",
          mood: "buoyant",
          suggestSideWorldId: world.id,
        },
        go: { name: "world", worldId: world.id },
      });
    }
    const prompt = cleared
      ? `${name}: “Chamber yields. Ready for the next seal on the mastery path?”`
      : `${name}: “Need 60% true casts on main doors. Review, then try again.”`;
    return {
      prompt,
      speaker: c,
      choices,
      worldId: world.id,
      levelId: level.id,
      cleared,
    };
  }

  function finishMission() {
    const { level, world, correctInMission, answeredInMission } = mission;
    state = window.GameEngine.clearActiveMission(state);

    // Entrance set: questions first → train reward → atlas
    if (mission.entranceMode) {
      const need = mission.passCorrect || 4;
      const passed = correctInMission >= need;
      if (passed) {
        state = window.GameEngine.markEntranceCleared(state);
        if (window.GameMusic?.playAdvance) window.GameMusic.playAdvance();
        mission = null;
        view = { name: "train" };
        render();
        return;
      }
      if (window.GameMusic?.playDark) window.GameMusic.playDark();
      const needMore = need - correctInMission;
      pendingDecision = {
        prompt: `Need ${need} correct on the entrance set (you had ${correctInMission}). Try again when ready.`,
        speaker: companion(),
        choices: [
          {
            id: "retry-entrance",
            label: "Retry entrance questions",
            detail: `Score ${need} correct to board the Midnight Express.`,
            go: { name: "entrance-retry" },
          },
          {
            id: "rest-review",
            label: "Open review book first",
            detail: "Skim weak topics, then retry.",
            go: { name: "mastery" },
          },
        ],
        summary: {
          cleared: false,
          correctInMission,
          answeredInMission,
          unlock: "",
          world,
          level,
          entranceFail: true,
          needMore,
        },
        worldId: "entrance",
        levelId: level.id,
        cleared: false,
      };
      mission = null;
      view = { name: "decision" };
      render();
      return;
    }

    const pass = correctInMission >= Math.ceil(answeredInMission * 0.6);
    const cleared = level.type === "side" ? true : pass;

    if (world?.id?.startsWith("visit-")) {
      // optional village practice — return to atlas
      window.GameEngine.save(state);
      mission = null;
      view = { name: "map" };
      render();
      return;
    }

    if (cleared) {
      state = window.GameEngine.clearLevel(
        state,
        level.id,
        level.successUnlock || null
      );
      state = window.GameEngine.addReward(state, level.reward);
      if (!state.explore && window.ExploreGame?.ensureExplore) {
        state.explore = window.ExploreGame.ensureExplore(state);
      }
      if (state.explore) {
        state.explore.xp += 25;
        if (window.ExploreGame?.xpToLevel) {
          state.explore.level = window.ExploreGame.xpToLevel(state.explore.xp);
        }
        if (level.character && state.explore.bonds?.[level.character] != null) {
          state.explore.bonds[level.character] = Math.min(
            100,
            (state.explore.bonds[level.character] || 0) + 8
          );
        }
      }
      window.GameEngine.save(state);
      if (window.GameMusic?.playAdvance) window.GameMusic.playAdvance();
      if (level.isFinale && state.campaignClear) {
        view = { name: "ending" };
        mission = null;
        render();
        return;
      }
    } else if (window.GameMusic?.playDark) {
      window.GameMusic.playDark();
    }

    const unlock =
      cleared && level.successUnlock?.startsWith("world-")
        ? " A new study hall opens on the atlas."
        : "";

    const summary = {
      cleared,
      correctInMission,
      answeredInMission,
      unlock,
      world,
      level,
    };
    mission = null;
    pendingDecision = buildMissionDecision(cleared, world, level);
    pendingDecision.summary = summary;
    view = { name: "decision" };
    render();
  }

  function viewDecision() {
    const d = pendingDecision;
    if (!d) {
      view = { name: "map" };
      return viewMap();
    }
    const s = d.summary || {};
    const choices = (d.choices || [])
      .map(
        (ch) => `
        <button type="button" class="decision-card" data-choice="${ch.id}">
          <strong>${escapeHtml(ch.label)}</strong>
          <span>${escapeHtml(ch.detail || "")}</span>
        </button>`
      )
      .join("");

    const node = $(`
      <section class="scene scene-castle">
        ${castleAtmosphere({ fireflyCount: 16, position: "center 38%" })}
        <div class="scene-content">
          <div class="glass filigree glass-castle">
            ${d.speaker ? portraitHtml(d.speaker, d.speaker.portraitFocus) : ""}
            <p class="eyebrow">${
              s.entranceFail
                ? "Entrance incomplete"
                : s.cleared
                  ? "Practice cleared"
                  : "Keep practicing"
            }</p>
            <h2>${
              s.entranceFail
                ? "Not enough correct yet"
                : s.cleared
                  ? "Mastery advanced"
                  : "Set not cleared"
            }</h2>
            <p class="lede">
              You scored ${s.correctInMission}/${s.answeredInMission} correct.
              ${
                s.entranceFail
                  ? "The train waits until the entrance Chem/Phys set is solid."
                  : s.cleared
                    ? `Progress unlocked on the atlas.${s.unlock || ""}`
                    : "Main sets need ≥60% correct to open the next place. Side practice still builds your review book."
              }
            </p>
            <blockquote class="speech">“${escapeHtml(d.prompt)}”</blockquote>
            <div class="decision-rail">${choices}</div>
            <p class="fine">RPG choices shape flavor, mood, and suggested side content — not the 60% clear rule.</p>
          </div>
        </div>
      </section>
    `);

    node.querySelectorAll("[data-choice]").forEach((btn) => {
      btn.onclick = () => {
        const ch = d.choices.find((x) => x.id === btn.dataset.choice);
        if (ch?.effects) {
          state = window.GameEngine.applyJourneyDecision(
            state,
            ch.id,
            ch.effects
          );
        }
        pendingDecision = null;
        if (ch?.go?.name === "entrance-retry") {
          startEntranceExam();
          return;
        }
        view = ch?.go || { name: "world", worldId: d.worldId };
        render();
      };
    });
    return node;
  }

  function viewMastery() {
    const weak = window.GameEngine.weakestTopics(state, 8);
    const tiles = weak
      .map((t) => {
        const g = window.glyphFor(t.topic);
        return `
          <div class="glyph-tile">
            <div class="mini">${window.glyphSvg(g.svg)}</div>
            <div class="t">${escapeHtml(g.spell)}</div>
            <div class="meter"><i style="width:${t.mastery}%"></i></div>
          </div>`;
      })
      .join("");
    const faults = window.GameEngine.topFaultSkills(state, 6)
      .map(
        (f) =>
          `<li>${topicLabel(f.skill)} — ${f.incorrect} curses (${Math.round(
            f.rate * 100
          )}%)</li>`
      )
      .join("");
    const due = window.GameEngine.dueQuestions(state, 6)
      .map((q) => {
        const g = window.glyphFor(q.topic);
        return `<li>${g.spell} · ${topicLabel(q.topic)}</li>`;
      })
      .join("");

    const node = $(`
      <section class="scene scene-castle">
        ${castleAtmosphere({ fireflyCount: 14, position: "center 32%" })}
        <div class="scene-content">
          <div class="glass filigree glass-castle">
            <button type="button" class="back-link" id="back">← Quest path</button>
            <p class="eyebrow">Living record · mastery quest</p>
            <h2>Your Grimoire</h2>
            ${journeyRibbon()}
            <p class="lede">Cast for mastery. Weak glyphs return as curses on the path.</p>
            <p class="fine">Bonds — Elowen ${state.explore?.bonds?.elowen || 0} · Cassian ${state.explore?.bonds?.cassian || 0} · Bramble ${state.explore?.bonds?.bramble || 0} · Lyra ${state.explore?.bonds?.lyra || 0}</p>
            <div class="grimoire-grid">${tiles || "<p class='fine'>Cast to fill the book.</p>"}</div>
            <h2 style="font-size:1.2rem">Recurring curses</h2>
            <ul class="fault-list">${faults || "<li>No curses yet.</li>"}</ul>
            <h2 style="font-size:1.2rem;margin-top:1rem">Due to resurface</h2>
            <ul class="fault-list">${due || "<li>The halls are quiet.</li>"}</ul>
          </div>
        </div>
      </section>
    `);
    node.querySelector("#back").onclick = () => {
      view = { name: "map" };
      render();
    };
    return node;
  }

  function viewEnding() {
    const c = companion();
    const node = $(`
      <section class="scene scene-castle title-scene">
        ${castleAtmosphere({ fireflyCount: 22, position: "center 40%" })}
        <div class="scene-content">
          <div class="glass filigree glass-castle">
            <div class="title-seal wax" style="background-image:url('${STICKERS.seal}')"></div>
            <p class="eyebrow">Campaign clear</p>
            <h1>The Hall of OWLs yields</h1>
            <p class="lede">
              ${
                c
                  ? `${escapeHtml(c.name)} stands with you as the four wings remember your name.`
                  : "The four wings remember your name."
              }
              Keep hunting curses — more tomes will open new worlds when you add them.
            </p>
            <div class="cta-row" style="justify-content:center">
              <button type="button" class="btn primary" id="map">Return to quest path</button>
              <button type="button" class="btn ghost" id="mastery">Study the Grimoire</button>
            </div>
          </div>
        </div>
      </section>
    `);
    node.querySelector("#map").onclick = () => {
      view = { name: "map" };
      render();
    };
    node.querySelector("#mastery").onclick = () => {
      view = { name: "mastery" };
      render();
    };
    return node;
  }

  // Flush mission + mastery if the tab is closed mid-trial
  window.addEventListener("pagehide", () => {
    if (mission?.queue?.length) {
      window.GameEngine.persistMission(state, mission);
    } else {
      window.GameEngine.save(state);
    }
  });

  render();
})();
