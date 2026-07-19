/**
 * Adaptive soundtrack — layered beds, long crossfades, soft UI/vocal SFX.
 * Royalty-free inspired loops in audio/; missing files surface on the HUD.
 * Official HP / Williams / Legacy / Skyrim scores are NOT redistributed — see docs/soundtrack.md.
 */
(function () {
  const PREF_KEY = "mcat-mastery-music-v1";
  const FADE_MS = 3200; // Skyrim-like bed crossfade
  const FADE_STOP_MS = 2400;
  const AMBIENT_FADE_MS = 4000;
  const STING_VOL = 0.34; // quieter vs bed
  const UI_VOL = 0.28;
  const VOCAL_VOL = 0.26;
  const DUCK_SCALE = 0.62; // gentle duck, not mute
  const DUCK_MS_DEFAULT = 1800;
  const STING_GAP_MS = 1100; // space stacked stingers
  const PROBE_MS = 8000;
  const DEFAULT_MUSIC = 0.48;
  const DEFAULT_SFX = 0.55;
  const AMBIENT_SCALE = 0.26; // soft under-bed

  /**
   * Live cue table. `pool` rotates among files. `playlistHint` is the companion
   * Spotify/Apple *feel* recipe until Kass pastes real playlist URLs.
   */
  const CUES = {
    title: {
      id: "title",
      label: "Platform invitation",
      pool: ["audio/title-01.mp3", "audio/title-02.mp3", "audio/map-04.mp3"],
      playlistHint:
        "Companion feel: John Williams — Hedwig's Theme / Harry's Wondrous World (soft open). In-game uses royalty-free inspired beds.",
      playlistUrl: null,
    },
    map: {
      id: "map",
      label: "Castle roam",
      pool: [
        "audio/map-01.mp3",
        "audio/map-02.mp3",
        "audio/map-03.mp3",
        "audio/map-04.mp3",
        "audio/map-05.mp3",
      ],
      playlistHint:
        "Companion feel: Hogwarts Forever / Moving Stairs — gentle wandering. In-game: pastoral / frost waltz roam beds.",
      playlistUrl: null,
    },
    ambient: {
      id: "ambient",
      label: "Soft under-bed",
      pool: [
        "audio/ambient-01.mp3",
        "audio/ambient-02.mp3",
        "audio/ambient-03.mp3",
      ],
      playlistHint: "Stable exploration pad under menus.",
      playlistUrl: null,
    },
    "wing-asphodel": {
      id: "wing-asphodel",
      label: "Wing of Asphodel",
      pool: [
        "audio/wing-asphodel-01.mp3",
        "audio/wing-asphodel-02.mp3",
        "audio/wing-asphodel-03.mp3",
        "audio/wing-asphodel-04.mp3",
      ],
      playlistHint:
        "Companion feel: candlelit greenhouse warmth. In-game: pastoral / dreamy flashback beds.",
      playlistUrl: null,
    },
    "wing-mercury": {
      id: "wing-mercury",
      label: "Wing of Mercury",
      pool: ["audio/wing-mercury-01.mp3", "audio/wing-mercury-02.mp3"],
      playlistHint:
        "Companion feel: Diagon Alley kinetic bustle. In-game: wizardtorium / celtic impulse beds.",
      playlistUrl: null,
    },
    "wing-lodestone": {
      id: "wing-lodestone",
      label: "Wing of the Lodestone",
      pool: ["audio/wing-lodestone-01.mp3", "audio/wing-lodestone-02.mp3"],
      playlistHint:
        "Companion feel: Chess Game tension without panic. In-game: unholy knight / mystic force beds.",
      playlistUrl: null,
    },
    "wing-owls": {
      id: "wing-owls",
      label: "Hall of OWLs",
      pool: [
        "audio/wing-owls-01.mp3",
        "audio/wing-owls-02.mp3",
        "audio/wing-owls-03.mp3",
        "audio/wing-owls-04.mp3",
      ],
      playlistHint:
        "Companion feel: empty great hall judgment. In-game: oppressive gloom / lost time beds.",
      playlistUrl: null,
    },
    trial: {
      id: "trial",
      label: "Trial pressure",
      pool: ["audio/trial-01.mp3", "audio/trial-02.mp3"],
      playlistHint:
        "Companion feel: Devil's Snare / anticipation. In-game: darkest child / volatile reaction beds.",
      playlistUrl: null,
    },
    "trial-finale": {
      id: "trial-finale",
      label: "Final OWL trial",
      pool: ["audio/trial-finale-01.mp3", "audio/trial-finale-02.mp3"],
      playlistHint:
        "Companion feel: peak OWL pressure. In-game: pyre / knight finale beds.",
      playlistUrl: null,
    },
    ending: {
      id: "ending",
      label: "Hall yields",
      pool: [
        "audio/ending-01.mp3",
        "audio/ending-02.mp3",
        "audio/ending-03.mp3",
        "audio/map-05.mp3",
      ],
      playlistHint:
        "Companion feel: Leaving Hogwarts triumph. In-game: fantasy orchestral / ascending vale beds.",
      playlistUrl: null,
    },
  };

  /** One-shot SFX / short musical cues (do not loop). */
  const STINGERS = {
    success: {
      pool: [
        "audio/success-chime-01.wav",
        "audio/success-chime-02.wav",
        "audio/success-01.mp3",
        "audio/success-02.mp3",
        "audio/success-flourish-01.mp3",
      ],
      volumeScale: 0.85,
      duckMs: 1400,
    },
    curse: {
      pool: [
        "audio/curse-thud-01.wav",
        "audio/curse-thud-02.wav",
        "audio/curse-01.mp3",
        "audio/curse-04.mp3",
        "audio/curse-flourish-03.mp3",
      ],
      volumeScale: 0.8,
      duckMs: 1500,
    },
    congratulate: {
      pool: [
        "audio/vocal-warm-01.wav",
        "audio/vocal-warm-02.wav",
        "audio/congratulate-01.mp3",
        "audio/congratulate-03.mp3",
      ],
      volumeScale: VOCAL_VOL / STING_VOL,
      duckMs: 900,
    },
    berate: {
      pool: [
        "audio/vocal-soft-01.wav",
        "audio/vocal-soft-02.wav",
        "audio/berate-03.mp3",
        "audio/berate-04.mp3",
      ],
      volumeScale: VOCAL_VOL / STING_VOL,
      duckMs: 900,
    },
    cast: {
      pool: ["audio/cast-whoosh-01.wav", "audio/ui-whoosh-01.wav"],
      volumeScale: 0.7,
      duckMs: 700,
    },
    advance: {
      pool: [
        "audio/advance-01.mp3",
        "audio/advance-02.mp3",
        "audio/success-flourish-02.mp3",
        "audio/vocal-warm-01.wav",
      ],
      volumeScale: 0.75,
      duckMs: 2400,
    },
    dark: {
      pool: [
        "audio/dark-03.mp3",
        "audio/curse-flourish-03.mp3",
        "audio/vocal-soft-02.wav",
        "audio/dark-01.mp3",
      ],
      volumeScale: 0.7,
      duckMs: 2200,
    },
    click: {
      pool: ["audio/ui-click-01.wav", "audio/ui-click-02.wav", "audio/ui-click-01.mp3"],
      volumeScale: UI_VOL / STING_VOL,
      duckMs: 0,
    },
    hover: {
      pool: ["audio/ui-hover-01.wav", "audio/ui-hover-01.mp3"],
      volumeScale: (UI_VOL * 0.55) / STING_VOL,
      duckMs: 0,
    },
    select: {
      pool: ["audio/ui-select-01.wav", "audio/ui-select-02.wav", "audio/ui-select-01.mp3"],
      volumeScale: UI_VOL / STING_VOL,
      duckMs: 0,
    },
    door: {
      pool: ["audio/ui-door-01.wav", "audio/ui-door-01.mp3", "audio/ui-select-01.wav"],
      volumeScale: UI_VOL / STING_VOL,
      duckMs: 400,
    },
    whoosh: {
      pool: ["audio/ui-whoosh-01.wav", "audio/cast-whoosh-01.wav"],
      volumeScale: 0.65,
      duckMs: 500,
    },
  };

  /** Views that keep a stable ambient under-bed (menu switches shouldn't yank it). */
  const AMBIENT_VIEWS = new Set([
    "title",
    "companion",
    "map",
    "explore",
    "world",
    "dialogue",
    "decision",
    "mastery",
    "account",
  ]);

  let prefs = loadPrefs();
  let unlocked = false;
  let currentCue = null;
  let currentAudio = null;
  let ambientAudio = null;
  let ambientDesired = false;
  let duckTimer = null;
  let duckTargetScale = 1;
  let lastMissingAlert = 0;
  const fadeTimers = new WeakMap(); // Audio -> interval id
  const poolReady = {}; // key -> string[] of working urls
  const poolFailed = {}; // key -> true when probe found nothing
  const lastPick = {}; // key -> last url
  let activeStingers = [];
  let lastStingerAt = 0;
  let lastHoverAt = 0;
  let playGeneration = 0;
  let bedStarting = false; // true while a bed play() is in-flight
  let activeBedCue = null; // cue id for the bed that is playing / starting
  let lastPlayError = null;
  let lastViewName = null;

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (!raw) {
        return { enabled: true, musicVolume: DEFAULT_MUSIC, sfxVolume: DEFAULT_SFX };
      }
      const p = JSON.parse(raw);
      // Migrate legacy single `volume` → musicVolume
      let musicVolume = Number(p.musicVolume ?? p.volume ?? DEFAULT_MUSIC);
      let sfxVolume = Number(p.sfxVolume ?? p.volume ?? DEFAULT_SFX);
      if (!Number.isFinite(musicVolume) || musicVolume <= 0) musicVolume = DEFAULT_MUSIC;
      if (!Number.isFinite(sfxVolume) || sfxVolume < 0) sfxVolume = DEFAULT_SFX;
      return {
        enabled: p.enabled !== false,
        musicVolume: clamp(musicVolume, 0.05, 1),
        sfxVolume: clamp(sfxVolume, 0, 1),
      };
    } catch {
      return { enabled: true, musicVolume: DEFAULT_MUSIC, sfxVolume: DEFAULT_SFX };
    }
  }

  function savePrefs() {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  }

  function clamp(n, a, b) {
    return Math.min(b, Math.max(a, n));
  }

  function musicVol() {
    return prefs.musicVolume;
  }

  function sfxVol() {
    return prefs.sfxVolume;
  }

  /** Resolve pool paths against the page URL (GitHub Pages subpath safe). */
  function assetUrl(path) {
    try {
      return new URL(path, document.baseURI || window.location.href).href;
    } catch {
      return path;
    }
  }

  function notifyListeners() {
    try {
      window.dispatchEvent(new CustomEvent("gamemusic-status"));
    } catch {
      /* ignore */
    }
  }

  function markMissing(cueId) {
    poolFailed[cueId] = true;
    const now = Date.now();
    if (now - lastMissingAlert > 4000) {
      lastMissingAlert = now;
      console.warn("[GameMusic] No playable tracks for cue:", cueId);
    }
    notifyListeners();
  }

  /**
   * Unlock on first gesture. Must call play() in the same turn as the gesture
   * (no await before play) — required by iOS Safari / installed PWAs.
   */
  function unlock() {
    const already = unlocked;
    unlocked = true;

    // Warm autoplay with a near-silent WebAudio tick (data: MP3 kicks are flaky).
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        if (ctx.resume) ctx.resume().catch(() => {});
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
        setTimeout(() => {
          try {
            ctx.close();
          } catch {
            /* ignore */
          }
        }, 200);
      }
    } catch {
      /* ignore */
    }

    if (prefs.enabled && currentCue) {
      playCue(currentCue, { force: true, fromGesture: true });
      if (ambientDesired) ensureAmbient({ fromGesture: true });
    } else if (!already) {
      notifyListeners();
    }
  }

  function bindUnlockOnce() {
    const kick = (ev) => {
      if (ev && ev.type === "keydown" && ev.metaKey) return;
      unlock();
    };
    ["pointerdown", "touchstart", "keydown", "click"].forEach((ev) => {
      window.addEventListener(ev, kick, { once: true, capture: true, passive: true });
    });
  }

  function probeOne(url) {
    const abs = assetUrl(url);
    return new Promise((resolve) => {
      const a = new Audio();
      a.preload = "metadata";
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        a.removeAttribute("src");
        try {
          a.load();
        } catch {
          /* ignore */
        }
        resolve(ok ? abs : null);
      };
      const timer = setTimeout(() => done(false), PROBE_MS);
      a.addEventListener("loadeddata", () => done(true), { once: true });
      a.addEventListener("canplay", () => done(true), { once: true });
      a.addEventListener("error", () => done(false), { once: true });
      a.src = abs;
    });
  }

  async function resolvePool(key, urls) {
    if (poolReady[key] && poolReady[key].length) return poolReady[key];
    const found = [];
    for (const url of urls) {
      const ok = await probeOne(url);
      if (ok) found.push(ok);
    }
    if (found.length) {
      poolReady[key] = found;
      delete poolFailed[key];
    } else {
      markMissing(key);
    }
    return found;
  }

  function pickFrom(key, urls) {
    if (!urls.length) return null;
    if (urls.length === 1) {
      lastPick[key] = urls[0];
      return urls[0];
    }
    const avoid = lastPick[key];
    const choices = avoid ? urls.filter((u) => u !== avoid) : urls;
    const pick = choices[Math.floor(Math.random() * choices.length)];
    lastPick[key] = pick;
    return pick;
  }

  function clearFade(audio) {
    if (!audio) return;
    const id = fadeTimers.get(audio);
    if (id) {
      clearInterval(id);
      fadeTimers.delete(audio);
    }
  }

  function fadeTo(audio, target, ms, onDone) {
    clearFade(audio);
    const start = audio.volume;
    const steps = Math.max(1, Math.floor(ms / 40));
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      const t = step / steps;
      // Ease-in-out for less abrupt volume edges
      const eased = t * t * (3 - 2 * t);
      audio.volume = clamp(start + (target - start) * eased, 0, 1);
      if (step >= steps) {
        clearFade(audio);
        audio.volume = target;
        if (onDone) onDone();
      }
    }, 40);
    fadeTimers.set(audio, id);
  }

  function bedGain() {
    return musicVol() * duckTargetScale;
  }

  function ambientGain() {
    return musicVol() * AMBIENT_SCALE * Math.max(0.55, duckTargetScale);
  }

  function duckBed(scale, ms) {
    if (!prefs.enabled) return;
    if (duckTimer) clearTimeout(duckTimer);
    const targetScale = clamp(scale, 0.35, 1);
    duckTargetScale = targetScale;
    if (currentAudio) {
      fadeTo(currentAudio, bedGain(), 280);
    }
    if (ambientAudio) {
      fadeTo(ambientAudio, ambientGain(), 280);
    }
    duckTimer = setTimeout(() => {
      duckTargetScale = 1;
      if (currentAudio && prefs.enabled) {
        fadeTo(currentAudio, bedGain(), 700);
      }
      if (ambientAudio && prefs.enabled) {
        fadeTo(ambientAudio, ambientGain(), 700);
      }
      duckTimer = null;
    }, ms);
  }

  /**
   * Start a bed immediately (gesture-safe). Optional probe later upgrades the pool.
   */
  function startBed(src, cueId, gen, opts = {}) {
    const next = new Audio();
    next.preload = "auto";
    next.loop = true;
    next.setAttribute("data-cue", cueId);
    next.setAttribute("playsinline", "");
    next.playsInline = true;
    const fromGesture = !!opts.fromGesture;
    // Audible immediately on gesture unlock; soft crossfade otherwise.
    next.volume = fromGesture || !currentAudio ? bedGain() : 0;
    next.src = src;

    let settled = false;
    const commit = () => {
      if (settled) return;
      settled = true;
      bedStarting = false;
      if (gen !== playGeneration || currentCue !== cueId) {
        next.pause();
        next.src = "";
        return;
      }
      const prev = currentAudio;
      currentAudio = next;
      activeBedCue = cueId;
      lastPlayError = null;
      delete poolFailed[cueId];
      if (next.volume < bedGain() - 0.01) {
        fadeTo(next, bedGain(), FADE_MS);
      } else {
        next.volume = bedGain();
      }
      if (prev && prev !== next) {
        fadeTo(prev, 0, FADE_MS, () => {
          prev.pause();
          prev.src = "";
        });
      }
      notifyListeners();
    };

    const fail = (err, rebind) => {
      if (settled) return;
      const msg = (err && (err.message || String(err))) || "play() failed";
      // Ignore abort from our own canplay retry / element teardown.
      if (/interrupted by a new load|The play\(\) request was interrupted/i.test(msg)) {
        return;
      }
      settled = true;
      bedStarting = false;
      lastPlayError = msg;
      console.warn("[GameMusic] play() failed:", lastPlayError, src);
      if (rebind && gen === playGeneration) {
        unlocked = false;
        bindUnlockOnce();
      }
      notifyListeners();
    };

    const tryPlay = () => {
      if (gen !== playGeneration || settled) return;
      const playPromise = next.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.then(commit).catch((err) => fail(err, true));
      } else {
        commit();
      }
    };

    // Call play() immediately (gesture). Retry once on canplay if still paused.
    // Do NOT mutate src while play() is in-flight — that aborts playback.
    tryPlay();
    next.addEventListener(
      "canplay",
      () => {
        if (!settled && next.paused) tryPlay();
        else if (!settled && !next.paused) commit();
      },
      { once: true }
    );
    next.addEventListener(
      "playing",
      () => commit(),
      { once: true }
    );
    next.addEventListener(
      "error",
      () => fail(new Error("media element error"), false),
      { once: true }
    );

    // Soft watchdog: if still stuck with no data, rebuild via blob on a *new*
    // element (never assign a new src onto the in-flight Audio).
    setTimeout(() => {
      if (settled || gen !== playGeneration) return;
      if (!next.paused && next.readyState >= 2) {
        commit();
        return;
      }
      if (next.readyState > 0 && !next.paused) {
        commit();
        return;
      }
      const retries = opts.retryCount || 0;
      if (retries >= 1) {
        fail(new Error("audio stall after blob retry"), true);
        return;
      }
      fetch(src)
        .then((r) => {
          if (!r.ok) throw new Error("audio fetch " + r.status);
          return r.arrayBuffer();
        })
        .then((buf) => {
          if (settled || gen !== playGeneration) return;
          try {
            next.pause();
          } catch {
            /* ignore */
          }
          settled = true; // abandon this element; child startBed owns the gen
          bedStarting = true;
          const blobUrl = URL.createObjectURL(
            new Blob([buf], { type: "audio/mpeg" })
          );
          // Fresh element — avoids "play() interrupted by a new load request".
          startBed(blobUrl, cueId, gen, Object.assign({}, opts, { retryCount: retries + 1 }));
        })
        .catch((err) => fail(err, true));
    }, 4000);
  }

  function ensureAmbient(opts = {}) {
    if (!prefs.enabled || !unlocked || !ambientDesired) return;
    if (ambientAudio && !ambientAudio.paused) {
      fadeTo(ambientAudio, ambientGain(), 600);
      return;
    }
    const cue = CUES.ambient;
    const cached = poolReady.ambient;
    const first =
      cached && cached.length ? pickFrom("ambient", cached) : assetUrl(cue.pool[0]);
    const next = new Audio(first);
    next.loop = true;
    next.setAttribute("data-cue", "ambient");
    next.setAttribute("playsinline", "");
    next.playsInline = true;
    next.volume = opts.fromGesture ? ambientGain() : 0;
    const p = next.play();
    const commit = () => {
      if (!ambientDesired || !prefs.enabled) {
        next.pause();
        next.src = "";
        return;
      }
      const prev = ambientAudio;
      ambientAudio = next;
      if (next.volume < ambientGain() - 0.01) {
        fadeTo(next, ambientGain(), AMBIENT_FADE_MS);
      } else {
        next.volume = ambientGain();
      }
      if (prev && prev !== next) {
        fadeTo(prev, 0, AMBIENT_FADE_MS, () => {
          prev.pause();
          prev.src = "";
        });
      }
    };
    if (p && typeof p.then === "function") {
      p.then(commit).catch(() => {});
    } else {
      commit();
    }
    resolvePool("ambient", cue.pool);
  }

  function stopAmbient(soft = true) {
    ambientDesired = false;
    if (!ambientAudio) return;
    const a = ambientAudio;
    ambientAudio = null;
    if (!soft) {
      clearFade(a);
      a.pause();
      a.src = "";
      return;
    }
    fadeTo(a, 0, AMBIENT_FADE_MS, () => {
      a.pause();
      a.src = "";
    });
  }

  async function playCue(cueId, opts = {}) {
    const cue = CUES[cueId];
    if (!cue || cueId === "ambient") return;

    // Remember desired cue even before unlock so the first gesture can start it.
    currentCue = cueId;

    if (!prefs.enabled || !unlocked) {
      notifyListeners();
      return;
    }

    // Same bed already audible or mid-start: do not bump generation / tear down.
    // Critical: first click often unlock()+play, then render()→sync() on the same
    // gesture. A second playCue must not cancel the in-gesture Audio.play().
    if (
      !opts.force &&
      cueId === activeBedCue &&
      (bedStarting || (currentAudio && !currentAudio.paused))
    ) {
      return;
    }

    const gen = ++playGeneration;
    bedStarting = true;
    activeBedCue = cueId;
    lastPlayError = null;

    // Always start NOW (no await before play). Awaiting probes used to cancel the
    // in-gesture unlock when render()→sync() ran on the same click.
    const cached = poolReady[cueId];
    const first =
      cached && cached.length
        ? pickFrom(cueId, cached)
        : assetUrl(cue.pool[0]);
    startBed(first, cueId, gen, { fromGesture: !!opts.fromGesture });
    resolvePool(cueId, cue.pool).then((ready) => {
      if (!ready.length && gen === playGeneration) markMissing(cueId);
    });
  }

  /**
   * Play a one-shot from a stinger pool. Does not change the bed cue.
   */
  async function playStinger(stingerId, opts = {}) {
    const sting = STINGERS[stingerId];
    if (!sting) return;
    if (!prefs.enabled || !unlocked) return;
    if (sfxVol() <= 0.001) return;

    const now = Date.now();
    const gap = opts.gapMs != null ? opts.gapMs : STING_GAP_MS;
    // Hover is allowed more often; musical stingers are spaced.
    if (!opts.force && stingerId !== "hover" && now - lastStingerAt < gap) {
      return;
    }
    if (stingerId !== "hover") lastStingerAt = now;

    const key = `sting:${stingerId}`;
    const ready = await resolvePool(key, sting.pool);
    if (!ready.length) return;
    const src = pickFrom(key, ready);
    if (!src) return;

    const scale = opts.volumeScale ?? sting.volumeScale ?? STING_VOL;
    const vol = clamp(sfxVol() * scale * 1.05, 0, 1);
    const a = new Audio(src);
    a.loop = false;
    a.volume = vol;
    activeStingers.push(a);
    a.addEventListener(
      "ended",
      () => {
        activeStingers = activeStingers.filter((x) => x !== a);
        a.src = "";
      },
      { once: true }
    );
    const duckMs = opts.duckMs != null ? opts.duckMs : sting.duckMs ?? DUCK_MS_DEFAULT;
    if (duckMs > 0) duckBed(opts.duckScale ?? DUCK_SCALE, duckMs);
    try {
      await a.play();
    } catch {
      activeStingers = activeStingers.filter((x) => x !== a);
    }
  }

  /** Soft UI click / hover / select / door / scene whoosh. */
  function playUi(kind) {
    const map = {
      click: "click",
      hover: "hover",
      select: "select",
      door: "door",
      whoosh: "whoosh",
      cast: "cast",
    };
    const id = map[kind] || "click";
    if (id === "hover") {
      const now = Date.now();
      if (now - lastHoverAt < 140) return;
      lastHoverAt = now;
      playStinger("hover", { force: true, gapMs: 0, duckMs: 0 });
      return;
    }
    playStinger(id, { force: true, gapMs: id === "click" ? 80 : 200 });
  }

  /** Correct / incorrect ward outcome — soft chime/thud + companion vocal pad. */
  function playOutcome(correct) {
    if (correct) {
      playStinger("success", { duckScale: 0.68, duckMs: 1400 });
      setTimeout(
        () => playStinger("congratulate", { duckMs: 700, duckScale: 0.75, force: true, gapMs: 0 }),
        220
      );
    } else {
      playStinger("curse", { duckScale: 0.65, duckMs: 1500 });
      setTimeout(
        () => playStinger("berate", { duckMs: 700, duckScale: 0.72, force: true, gapMs: 0 }),
        220
      );
    }
  }

  function playAdvance() {
    playStinger("advance", { duckMs: 2400, duckScale: 0.58, volumeScale: 0.72 });
  }

  function playDark() {
    playStinger("dark", { duckMs: 2200, duckScale: 0.55, volumeScale: 0.68 });
  }

  function stop(opts = {}) {
    const soft = opts.soft !== false;
    playGeneration += 1;
    bedStarting = false;
    activeBedCue = null;
    activeStingers.forEach((a) => {
      a.pause();
      a.src = "";
    });
    activeStingers = [];
    stopAmbient(soft);
    if (!currentAudio) {
      currentCue = null;
      notifyListeners();
      return;
    }
    const a = currentAudio;
    if (!soft) {
      clearFade(a);
      a.pause();
      a.src = "";
      currentAudio = null;
      currentCue = null;
      notifyListeners();
      return;
    }
    fadeTo(a, 0, FADE_STOP_MS, () => {
      a.pause();
      a.src = "";
      if (currentAudio === a) currentAudio = null;
      notifyListeners();
    });
  }

  function setEnabled(on) {
    prefs.enabled = !!on;
    savePrefs();
    if (!prefs.enabled) {
      stop({ soft: true });
    } else {
      unlocked = true;
      if (currentCue) {
        playCue(currentCue, { force: true, fromGesture: true });
      }
      if (ambientDesired) ensureAmbient({ fromGesture: true });
    }
    notifyListeners();
  }

  function setVolume(v) {
    setMusicVolume(v);
  }

  function setMusicVolume(v) {
    prefs.musicVolume = clamp(Number(v), 0.05, 1);
    savePrefs();
    if (currentAudio && prefs.enabled) {
      currentAudio.volume = bedGain();
    }
    if (ambientAudio && prefs.enabled) {
      ambientAudio.volume = ambientGain();
    }
    notifyListeners();
  }

  function setSfxVolume(v) {
    prefs.sfxVolume = clamp(Number(v), 0, 1);
    savePrefs();
    notifyListeners();
  }

  function toggle() {
    setEnabled(!prefs.enabled);
    return prefs.enabled;
  }

  function resolveCue(ctx) {
    const { view, mission, state } = ctx || {};
    const name = view?.name || "title";

    if (name === "title" || name === "companion") return "title";
    if (name === "ending") return "ending";

    if (name === "map" || name === "explore") {
      return state?.campaignClear ? "ending" : "map";
    }

    if (name === "trial") {
      if (mission?.level?.isFinale) return "trial-finale";
      return "trial";
    }

    // Outcome keeps trial bed so pressure doesn't drop under the stinger.
    if (name === "outcome") {
      if (mission?.level?.isFinale) return "trial-finale";
      return "trial";
    }

    if (name === "dialogue" || name === "world" || name === "decision") {
      const world =
        mission?.world ||
        window.CAMPAIGN?.worlds?.find((w) => w.id === view?.worldId);
      const cue = world?.musicCue || world?.id;
      if (cue && CUES[cue]) return cue;
      return "map";
    }

    if (name === "mastery" || name === "account") {
      return state?.campaignClear ? "ending" : "map";
    }

    return "map";
  }

  function sync(ctx) {
    const viewName = ctx?.view?.name || "title";
    const cueId = resolveCue(ctx);
    const wantAmbient = AMBIENT_VIEWS.has(viewName);
    const prevView = lastViewName;
    lastViewName = viewName;

    // Scene change whoosh (gentle) — not on first paint / same view re-render.
    if (prevView && prevView !== viewName && prefs.enabled && unlocked) {
      playUi("whoosh");
    }

    playCue(cueId);

    if (wantAmbient) {
      ambientDesired = true;
      ensureAmbient();
    } else if (ambientDesired) {
      // Trials: fade ambient out so pressure bed can lead.
      stopAmbient(true);
    }
  }

  function status() {
    const cue = currentCue ? CUES[currentCue] : null;
    const ready = cue ? poolReady[currentCue] : undefined;
    const missing = !!(currentCue && poolFailed[currentCue]);
    const playing = !!(currentAudio && !currentAudio.paused);
    return {
      enabled: prefs.enabled,
      volume: prefs.musicVolume,
      musicVolume: prefs.musicVolume,
      sfxVolume: prefs.sfxVolume,
      unlocked,
      playing,
      bedStarting,
      lastPlayError,
      src: currentAudio?.currentSrc || currentAudio?.src || null,
      muted: currentAudio ? !!currentAudio.muted : null,
      paused: currentAudio ? !!currentAudio.paused : null,
      audioVolume: currentAudio ? currentAudio.volume : null,
      ambientPlaying: !!(ambientAudio && !ambientAudio.paused),
      cueId: currentCue,
      cueLabel: cue?.label || null,
      trackReady: missing ? false : ready === undefined ? null : ready.length > 0,
      poolSize: ready ? ready.length : null,
      missing,
      playlistHint: cue?.playlistHint || null,
      playlistUrl: cue?.playlistUrl || null,
      cues: CUES,
      stingers: STINGERS,
    };
  }

  /** Explicit user gesture: turn sound on and start the current cue immediately. */
  function enableFromGesture() {
    prefs.enabled = true;
    savePrefs();
    unlocked = true;
    lastPlayError = null;
    if (currentCue) {
      playCue(currentCue, { force: true, fromGesture: true });
    }
    if (ambientDesired) ensureAmbient({ fromGesture: true });
    else notifyListeners();
  }

  function setPlaylistUrl(cueId, url) {
    if (!CUES[cueId]) return;
    CUES[cueId].playlistUrl = url || null;
  }

  /** Wire soft UI sounds onto interactive controls inside a root (idempotent). */
  function bindUiRoot(root) {
    if (!root || root.__gameMusicUiBound) return;
    root.__gameMusicUiBound = true;
    root.addEventListener(
      "pointerdown",
      (ev) => {
        const t = ev.target?.closest?.(
          "button, .btn, .pill, .incant, .door, .companion-card, .decision-card, .hotspot, [data-choice], [data-world], [data-level], [data-go], [data-interact], a[href]"
        );
        if (!t || t.disabled || t.getAttribute("aria-disabled") === "true") return;
        if (t.matches("[data-music-toggle], [data-enable-sound], input, .audio-sliders *")) {
          return;
        }
        if (t.matches(".door, [data-level], [data-world], .hotspot")) {
          playUi("door");
        } else if (t.matches(".incant, [data-choice], .decision-card, .companion-card")) {
          playUi("select");
        } else {
          playUi("click");
        }
      },
      true
    );
    root.addEventListener(
      "pointerenter",
      (ev) => {
        if (ev.pointerType === "touch") return;
        const t = ev.target?.closest?.(
          "button, .btn, .pill, .incant, .door, .companion-card, .decision-card, .hotspot"
        );
        if (!t || t.disabled) return;
        playUi("hover");
      },
      true
    );
  }

  bindUnlockOnce();

  window.GameMusic = {
    CUES,
    STINGERS,
    sync,
    resolveCue,
    playCue,
    playStinger,
    playUi,
    playOutcome,
    playAdvance,
    playDark,
    stop,
    toggle,
    setEnabled,
    setVolume,
    setMusicVolume,
    setSfxVolume,
    unlock,
    enableFromGesture,
    status,
    setPlaylistUrl,
    bindUiRoot,
  };
})();
