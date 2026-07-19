/**
 * Active quest — walk seal → cast one ward → next seal (question-to-question).
 */
(function () {
  function begin(state, { worldId, levelId, mapId, title, questions, character }) {
    state.activeQuest = {
      worldId,
      levelId,
      mapId: mapId || "asphodel",
      title: title || "Quest",
      character: character || "elowen",
      questionIds: questions.map((q) => q.id),
      index: 0,
      correct: 0,
      answered: 0,
      startedAt: Date.now(),
    };
    return state.activeQuest;
  }

  function currentQuestion(state) {
    const aq = state.activeQuest;
    if (!aq) return null;
    const id = aq.questionIds[aq.index];
    return window.QUESTION_PACK.questions.find((q) => q.id === id) || null;
  }

  function advance(state, wasCorrect) {
    const aq = state.activeQuest;
    if (!aq) return { done: true };
    aq.answered += 1;
    if (wasCorrect) aq.correct += 1;
    aq.index += 1;
    if (aq.index >= aq.questionIds.length) {
      const summary = { ...aq, done: true };
      return summary;
    }
    return { done: false, quest: aq };
  }

  function clear(state) {
    state.activeQuest = null;
  }

  /** Path points for quest seals inside a map (local space). */
  function sealPath(mapId, count) {
    const paths = {
      courtyard: [
        [0, 0.05, 6],
        [-4, 0.05, 2],
        [4, 0.05, 2],
        [0, 0.05, -2],
        [-6, 0.05, -4],
        [6, 0.05, -4],
      ],
      asphodel: [
        [0, 0.05, 4],
        [-3, 0.05, 1],
        [3, 0.05, 1],
        [0, 0.05, -2],
        [3.5, 0.05, -5],
        [-3.5, 0.05, -5],
        [0, 0.05, -7],
        [-2, 0.05, 6],
        [2, 0.05, 6],
      ],
      "asphodel-deep": [
        [0, 0.05, 2],
        [-2, 0.05, 0],
        [2, 0.05, 0],
        [0, 0.05, -2.5],
        [-1.5, 0.05, -1.5],
        [1.5, 0.05, -1.5],
      ],
      mercury: [
        [0, 0.05, 3],
        [-2.5, 0.05, 0],
        [2.5, 0.05, 0],
        [0, 0.05, -3],
        [0, 0.05, -5],
        [-2, 0.05, 2],
        [2, 0.05, 2],
      ],
    };
    const base = paths[mapId] || paths.asphodel;
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push(base[i % base.length]);
    }
    return out;
  }

  window.Quest = { begin, currentQuestion, advance, clear, sealPath };
})();
