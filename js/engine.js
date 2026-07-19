/**
 * Mastery + spaced repetition + fault pattern tracking.
 * Persists to localStorage.
 */
(function () {
  const STORAGE_KEY = "mcat-mastery-save-v1";
  const INTERVALS_MS = [
    0,
    10 * 60 * 1000, // 10 min (same-session resurfacing)
    4 * 60 * 60 * 1000, // 4 h
    24 * 60 * 60 * 1000, // 1 d
    3 * 24 * 60 * 60 * 1000, // 3 d
  ];

  function emptyState() {
    return {
      playerName: "Scholar",
      companionId: null, // journey companion chosen at start
      createdAt: Date.now(),
      unlockedWorlds: [], // opened after entrance exam (questions-first)
      clearedLevels: [],
      flags: {},
      visitedSpots: [], // atlas flavor visits (train, market, inn)
      inventory: [],
      journey: {
        decisions: [], // recent micro-choice ids
        suggestedSideWorldId: null,
        mood: "steady", // steady | buoyant | steeled
      },
      explore: {
        mapId: "courtyard",
        x: 0,
        y: 1.65,
        z: 14,
        yaw: 0,
        pitch: 0,
        facing: "down",
        xp: 0,
        level: 1,
        bonds: { elowen: 0, cassian: 0, bramble: 0, lyra: 0 },
        foundLore: [],
        openedChests: [],
        talkedNpc: {},
      },
      currentWorldId: "wing-asphodel",
      items: {}, // questionId -> itemState
      topics: {}, // topic -> { seen, correct, incorrect, mastery }
      skills: {}, // skill -> { seen, correct, incorrect }
      faultLog: [], // recent fault skill/topic events
      stats: { answered: 0, correct: 0, streak: 0, bestStreak: 0 },
      campaignClear: false,
      /** Mid-trial checkpoint so Home / refresh can resume the same set */
      activeMission: null,
      /** Per-companion journey progress (disjoint Q banks) */
      paths: {},
      savedAt: Date.now(),
    };
  }

  function emptyPathProgress() {
    return {
      entranceCleared: false,
      unlockedWorlds: [],
      clearedLevels: [],
      campaignClear: false,
      visitedSpots: [],
    };
  }

  /** Ensure path bag exists for a companion id. */
  function ensurePath(state, companionId) {
    state.paths = state.paths || {};
    const id = companionId || state.companionId;
    if (!id) return emptyPathProgress();
    if (!state.paths[id]) state.paths[id] = emptyPathProgress();
    return state.paths[id];
  }

  /** Active companion's path progress (mutates nested object). */
  function pathOf(state) {
    return ensurePath(state, state.companionId);
  }

  /**
   * Build entrance + per-level question map for a companion from their bank.
   * Spreads remaining items across main trials so the year uses Q1–59 uniquely.
   */
  function planCompanionPath(companionId) {
    const camp = window.CAMPAIGN || {};
    const spec = camp.companionPaths?.[companionId];
    const bank = (spec?.bank || []).slice();
    const entranceCount = Math.min(spec?.entranceCount || 6, bank.length);
    const entrance = bank.slice(0, entranceCount);
    const rest = bank.slice(entranceCount);
    const mains = (camp.worlds || []).flatMap((w) =>
      (w.levels || []).filter((l) => l.type === "main")
    );
    const levelMap = {};
    if (mains.length && rest.length) {
      const base = Math.floor(rest.length / mains.length);
      let spare = rest.length - base * mains.length;
      let cursor = 0;
      mains.forEach((lv) => {
        const n = base + (spare > 0 ? 1 : 0);
        if (spare > 0) spare -= 1;
        levelMap[lv.id] = rest.slice(cursor, cursor + n);
        cursor += n;
      });
    }
    // Sides: weak review stays dynamic; optional static sides use leftover / preferWeak
    (camp.worlds || []).forEach((w) => {
      (w.levels || [])
        .filter((l) => l.type === "side" && !l.dynamicReview)
        .forEach((lv) => {
          if (!levelMap[lv.id]) levelMap[lv.id] = [];
        });
    });
    return {
      companionId,
      bank,
      entrance,
      passCorrect: spec?.passCorrect || Math.max(3, Math.ceil(entranceCount * 0.6)),
      levelMap,
    };
  }

  function questionIdsForLevel(state, level) {
    if (!level) return [];
    if (level.dynamicReview) return null; // signal caller to use dueQuestions
    const plan = planCompanionPath(state.companionId);
    if (plan?.levelMap && Object.prototype.hasOwnProperty.call(plan.levelMap, level.id)) {
      return plan.levelMap[level.id] || [];
    }
    // Fallback: legacy shared ids, but only those in this companion's bank when available
    const bank = new Set(plan?.bank || []);
    const raw = level.questionIds || [];
    if (bank.size) return raw.filter((n) => bank.has(n));
    return raw.slice();
  }

  function entrancePlan(state) {
    const plan = planCompanionPath(state.companionId);
    const ent = window.CAMPAIGN?.entrance || {};
    return {
      questionIds: plan.entrance.length ? plan.entrance : ent.questionIds || [],
      passCorrect: plan.passCorrect || ent.passCorrect || 4,
      name: ent.name || "Platform Entrance Set",
      id: ent.id || "entrance-exam",
      character: ent.character || "elowen",
      intro: ent.intro || [],
      bank: plan.bank,
    };
  }

  /** Fisher–Yates — in-memory only; never persisted as fixed mission order. */
  function shuffleArray(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function setCompanion(state, companionId) {
    state.companionId = companionId;
    state.flags.companionChosen = true;
    state.journey = state.journey || emptyState().journey;
    state.journey.mood = "steady";
    ensurePath(state, companionId);
    // Mirror active path onto legacy top-level fields so existing UI keeps working
    syncLegacyFromPath(state);
    // Changing companions clears an in-flight mission from the previous deck
    state.activeMission = null;
    save(state);
    return state;
  }

  /** Copy current path progress into legacy state fields used by atlas/UI. */
  function syncLegacyFromPath(state) {
    const p = pathOf(state);
    state.flags = state.flags || {};
    state.flags.entranceCleared = !!p.entranceCleared;
    state.unlockedWorlds = (p.unlockedWorlds || []).slice();
    state.clearedLevels = (p.clearedLevels || []).slice();
    state.campaignClear = !!p.campaignClear;
    if (Array.isArray(p.visitedSpots)) {
      state.visitedSpots = p.visitedSpots.slice();
    }
    return state;
  }

  function applyJourneyDecision(state, decisionId, effects) {
    state.journey = state.journey || emptyState().journey;
    state.journey.decisions = [decisionId, ...(state.journey.decisions || [])].slice(
      0,
      24
    );
    if (effects?.flag) state.flags[effects.flag] = true;
    if (effects?.mood) state.journey.mood = effects.mood;
    if (effects?.suggestSideWorldId != null) {
      state.journey.suggestedSideWorldId = effects.suggestSideWorldId;
    }
    if (effects?.inventory && !state.inventory.includes(effects.inventory)) {
      state.inventory.push(effects.inventory);
      state.flags[effects.inventory] = true;
    }
    save(state);
    return state;
  }

  function normalizeState(state) {
    const base = emptyState();
    state.journey = { ...base.journey, ...(state.journey || {}) };
    if (state.companionId === undefined) state.companionId = null;
    if (!Array.isArray(state.visitedSpots)) state.visitedSpots = [];
    state.flags = state.flags || {};
    if (state.activeMission === undefined) state.activeMission = null;
    if (!state.paths) state.paths = {};
    if (!state.savedAt) state.savedAt = Date.now();
    // Migrate older saves that already studied into the atlas (onto active companion path)
    if (
      !state.flags.entranceCleared &&
      ((state.clearedLevels && state.clearedLevels.length) ||
        (state.stats && state.stats.answered >= 4))
    ) {
      state.flags.entranceCleared = true;
      if (!state.unlockedWorlds.includes("wing-asphodel")) {
        state.unlockedWorlds.push("wing-asphodel");
      }
    }
    // Seed path bag from legacy fields once
    if (state.companionId) {
      const p = ensurePath(state, state.companionId);
      if (
        !p.entranceCleared &&
        (state.flags.entranceCleared || (state.clearedLevels || []).length)
      ) {
        p.entranceCleared = !!state.flags.entranceCleared;
        p.unlockedWorlds = Array.from(
          new Set([...(p.unlockedWorlds || []), ...(state.unlockedWorlds || [])])
        );
        p.clearedLevels = Array.from(
          new Set([...(p.clearedLevels || []), ...(state.clearedLevels || [])])
        );
        p.campaignClear = !!state.campaignClear;
        p.visitedSpots = Array.from(
          new Set([...(p.visitedSpots || []), ...(state.visitedSpots || [])])
        );
      }
      syncLegacyFromPath(state);
    }
    return state;
  }

  /** Serialize in-progress trial so leaving Home / refresh keeps your place. */
  function persistMission(state, mission) {
    if (!mission?.queue?.length || !mission.level) {
      state.activeMission = null;
    } else {
      state.activeMission = {
        worldId: mission.world?.id || null,
        levelId: mission.level.id,
        questionIds: mission.queue.map((q) => q.id),
        index: mission.index || 0,
        correctInMission: mission.correctInMission || 0,
        answeredInMission: mission.answeredInMission || 0,
        entranceMode: !!mission.entranceMode,
        passCorrect: mission.passCorrect || null,
        questMode: !!mission.questMode,
        guided: !!mission.guided,
        viewHint: "trial",
      };
    }
    save(state);
    return state;
  }

  function clearActiveMission(state) {
    state.activeMission = null;
    save(state);
    return state;
  }

  function markEntranceCleared(state) {
    const p = pathOf(state);
    p.entranceCleared = true;
    if (!p.unlockedWorlds.includes("wing-asphodel")) {
      p.unlockedWorlds.push("wing-asphodel");
    }
    if (!p.visitedSpots.includes("express")) {
      p.visitedSpots.push("express");
    }
    flushEmptyMains(state);
    syncLegacyFromPath(state);
    save(state);
    return state;
  }

  function visitSpot(state, spotId) {
    const p = pathOf(state);
    if (!p.visitedSpots.includes(spotId)) p.visitedSpots.push(spotId);
    if (!state.visitedSpots.includes(spotId)) state.visitedSpots.push(spotId);
    syncLegacyFromPath(state);
    save(state);
    return state;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedFromDiagnostic(emptyState());
      return seedFromDiagnostic(
        normalizeState({ ...emptyState(), ...JSON.parse(raw) })
      );
    } catch {
      return seedFromDiagnostic(emptyState());
    }
  }

  function save(state) {
    state.savedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (window.GameCloud?.queueSave) {
      window.GameCloud.queueSave(state);
    }
  }

  function replaceState(next) {
    const merged = seedFromDiagnostic(
      normalizeState({ ...emptyState(), ...next })
    );
    save(merged);
    return merged;
  }

  function ensureItem(state, q) {
    if (!state.items[q.id]) {
      const diagWrong = q.diagnostic && q.diagnostic.result === "Incorrect";
      state.items[q.id] = {
        ease: diagWrong ? 1 : 2,
        intervalIndex: diagWrong ? 0 : 1,
        dueAt: diagWrong ? Date.now() : Date.now() + INTERVALS_MS[1],
        timesSeen: 0,
        timesCorrect: 0,
        timesIncorrect: diagWrong ? 1 : 0,
        lastResult: diagWrong ? "Incorrect" : null,
        mastery: diagWrong ? 15 : 40,
      };
    }
    if (!state.topics[q.topic]) {
      state.topics[q.topic] = {
        seen: 0,
        correct: 0,
        incorrect: q.diagnostic?.result === "Incorrect" ? 1 : 0,
        mastery: q.diagnostic?.result === "Incorrect" ? 20 : 45,
      };
    }
    if (!state.skills[q.skill]) {
      state.skills[q.skill] = {
        seen: 0,
        correct: 0,
        incorrect: q.diagnostic?.result === "Incorrect" ? 1 : 0,
      };
    }
  }

  function seedFromDiagnostic(state) {
    const pack = window.QUESTION_PACK;
    if (!pack?.questions) return state;
    for (const q of pack.questions) ensureItem(state, q);
    return state;
  }

  function recordAnswer(state, question, choice, correct) {
    ensureItem(state, question);
    const item = state.items[question.id];
    const topic = state.topics[question.topic];
    const skill = state.skills[question.skill];
    const now = Date.now();

    item.timesSeen += 1;
    topic.seen += 1;
    skill.seen += 1;
    state.stats.answered += 1;

    if (correct) {
      item.timesCorrect += 1;
      topic.correct += 1;
      skill.correct += 1;
      item.lastResult = "Correct";
      item.ease = Math.min(5, item.ease + 1);
      item.intervalIndex = Math.min(
        INTERVALS_MS.length - 1,
        item.intervalIndex + 1
      );
      item.mastery = Math.min(100, item.mastery + 18);
      topic.mastery = Math.min(100, topic.mastery + 12);
      state.stats.correct += 1;
      state.stats.streak += 1;
      state.stats.bestStreak = Math.max(
        state.stats.bestStreak,
        state.stats.streak
      );
    } else {
      item.timesIncorrect += 1;
      topic.incorrect += 1;
      skill.incorrect += 1;
      item.lastResult = "Incorrect";
      item.ease = Math.max(0, item.ease - 1);
      item.intervalIndex = 0;
      item.mastery = Math.max(0, item.mastery - 14);
      topic.mastery = Math.max(0, topic.mastery - 10);
      state.stats.streak = 0;
      state.faultLog.unshift({
        at: now,
        questionId: question.id,
        topic: question.topic,
        skill: question.skill,
        choice,
      });
      state.faultLog = state.faultLog.slice(0, 40);
    }

    item.dueAt = now + INTERVALS_MS[item.intervalIndex];
    save(state);
    return state;
  }

  function dueQuestions(state, limit = 8) {
    const pack = window.QUESTION_PACK.questions;
    const now = Date.now();
    return pack
      .map((q) => {
        ensureItem(state, q);
        return { q, item: state.items[q.id] };
      })
      .filter(({ item }) => item.dueAt <= now || item.mastery < 55)
      .sort((a, b) => a.item.dueAt - b.item.dueAt || a.item.mastery - b.item.mastery)
      .slice(0, limit)
      .map(({ q }) => q);
  }

  function weakestTopics(state, n = 5) {
    return Object.entries(state.topics)
      .map(([topic, t]) => ({ topic, ...t }))
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, n);
  }

  function topFaultSkills(state, n = 5) {
    return Object.entries(state.skills)
      .map(([skill, s]) => ({
        skill,
        incorrect: s.incorrect,
        rate: s.seen ? s.incorrect / s.seen : 0,
      }))
      .filter((x) => x.incorrect > 0)
      .sort((a, b) => b.rate - a.rate || b.incorrect - a.incorrect)
      .slice(0, n);
  }

  function applyUnlock(state, worldUnlockId) {
    const p = pathOf(state);
    if (!worldUnlockId) return;
    if (worldUnlockId.startsWith("world-")) {
      const wid = worldUnlockId.replace("world-", "");
      if (!p.unlockedWorlds.includes(wid)) p.unlockedWorlds.push(wid);
    }
    if (worldUnlockId === "ending-clear") {
      p.campaignClear = true;
      state.flags.ending = true;
    }
  }

  function clearLevel(state, levelId, worldUnlockId) {
    const p = pathOf(state);
    if (!p.clearedLevels.includes(levelId)) p.clearedLevels.push(levelId);
    applyUnlock(state, worldUnlockId);
    flushEmptyMains(state);
    syncLegacyFromPath(state);
    save(state);
    return state;
  }

  /**
   * Companion banks are shorter than the full shared template — auto-clear
   * main doors that have zero wards on this path so year gates still open.
   */
  function flushEmptyMains(state) {
    const p = pathOf(state);
    let changed = true;
    let guard = 0;
    while (changed && guard < 24) {
      changed = false;
      guard += 1;
      for (const world of window.CAMPAIGN?.worlds || []) {
        const mains = (world.levels || []).filter((l) => l.type === "main");
        mains.forEach((lv, idx) => {
          if (p.clearedLevels.includes(lv.id)) return;
          const ids = questionIdsForLevel(state, lv) || [];
          if (ids.length > 0) return;
          const prev = idx > 0 ? mains[idx - 1] : null;
          const prevOk = !prev || p.clearedLevels.includes(prev.id);
          const worldOpen =
            world.unlockRule?.type === "start" ||
            p.entranceCleared ||
            (world.unlockRule?.type === "world" &&
              p.unlockedWorlds.includes(world.unlockRule.worldId));
          if (!prevOk || !worldOpen) return;
          p.clearedLevels.push(lv.id);
          applyUnlock(state, lv.successUnlock || null);
          changed = true;
        });
      }
    }
    return state;
  }

  function addReward(state, reward) {
    if (!reward) return state;
    state.flags[reward] = true;
    if (!state.inventory.includes(reward)) state.inventory.push(reward);
    save(state);
    return state;
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return load();
  }

  function getQuestionByNumber(n) {
    return window.QUESTION_PACK.questions.find((q) => q.number === n);
  }

  function questionsForLevel(state, level) {
    let queue;
    const plan = planCompanionPath(state.companionId);
    const bankSet = new Set(plan.bank || []);
    const inBank = (q) => !bankSet.size || bankSet.has(q.number);

    if (level.dynamicReview) {
      const due = dueQuestions(state, level.reviewCount || 4).filter(inBank);
      if (due.length) {
        queue = due;
      } else {
        queue = window.QUESTION_PACK.questions
          .filter(inBank)
          .map((q) => {
            ensureItem(state, q);
            return q;
          })
          .sort((a, b) => state.items[a.id].mastery - state.items[b.id].mastery)
          .slice(0, level.reviewCount || 4);
      }
    } else {
      let ids = questionIdsForLevel(state, level) || [];
      if (level.preferWeak) {
        const weakNums = dueQuestions(state, 6)
          .filter(inBank)
          .map((q) => q.number);
        const merged = [...new Set([...weakNums.slice(0, 2), ...ids])].slice(
          0,
          Math.max(ids.length, 4)
        );
        ids = merged.length ? merged : ids;
      }
      queue = ids.map(getQuestionByNumber).filter(Boolean);
    }
    // Randomize within-mission order each entry (session-local; not saved).
    return shuffleArray(queue);
  }

  window.GameEngine = {
    load,
    save,
    replaceState,
    reset,
    recordAnswer,
    dueQuestions,
    weakestTopics,
    topFaultSkills,
    clearLevel,
    addReward,
    getQuestionByNumber,
    questionsForLevel,
    questionIdsForLevel,
    planCompanionPath,
    entrancePlan,
    pathOf,
    ensurePath,
    syncLegacyFromPath,
    flushEmptyMains,
    ensureItem,
    shuffleArray,
    setCompanion,
    applyJourneyDecision,
    markEntranceCleared,
    visitSpot,
    persistMission,
    clearActiveMission,
  };
})();
