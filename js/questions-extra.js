// AAMC Sample Chem/Phys Q51–59 (merged into QUESTION_PACK).
// Stems/solutions aligned to Kass/MCAT/aamc-sample-test-q1-59.md.
(function () {
  const extra = [
    {
      id: "aamc-sample-q51",
      number: 51,
      section: "Chem/Phys",
      passageLabel: "Passage (NADH assay)",
      stem: "What is the fate of the NADH used in the assay described in the passage?",
      choices: {
        A: "It is oxidized to NAD+.",
        B: "It is reduced to NAD+.",
        C: "It is phosphorylated to NADPH.",
        D: "It is hydrolyzed to AMP.",
      },
      correct: "A",
      solution:
        "NADH reduces pyruvate to lactate, so NADH itself is oxidized to NAD+.",
      topic: "redox",
      skill: "passage_reasoning",
      diagnostic: { result: "Incorrect", yourAnswer: null },
    },
    {
      id: "aamc-sample-q52",
      number: 52,
      section: "Chem/Phys",
      stem: "What is the frequency of the emitted gamma photons? (h = 6.6×10⁻³⁴ J·s; E ≈ 2.24×10⁻¹⁴ J)",
      choices: {
        A: "3.38×10¹⁹ Hz",
        B: "3.38×10¹⁶ Hz",
        C: "1.4×10⁵ Hz",
        D: "6.6×10⁻³⁴ Hz",
      },
      correct: "A",
      solution:
        "Frequency = E/h ≈ (2.24×10⁻¹⁴)/(6.6×10⁻³⁴) ≈ 3.38×10¹⁹ Hz.",
      topic: "atomic_structure",
      skill: "calculation",
      diagnostic: { result: "Correct", yourAnswer: "A" },
    },
    {
      id: "aamc-sample-q53",
      number: 53,
      section: "Chem/Phys",
      stem: "Based on the information in Figure 2, what is the half-life of ⁹⁹ᵐTc?",
      choices: {
        A: "The time for activity to fall to 50% of its initial value",
        B: "The time for activity to fall to 25% of its initial value",
        C: "The mean lifetime divided by ln(2)",
        D: "Cannot be determined from a decay curve",
      },
      correct: "A",
      solution:
        "Half-life is the duration after which radioactivity is 50% of its initial value.",
      topic: "nuclear_decay",
      skill: "data_interpretation",
      figureNote: "Study from the decay curve in the official sample when available.",
      diagnostic: { result: "Correct", yourAnswer: "A" },
    },
    {
      id: "aamc-sample-q54",
      number: 54,
      section: "Chem/Phys",
      stem: "Which electrically charged particle is emitted during ⁹⁹Mo decay in the generator?",
      choices: {
        A: "A proton",
        B: "An electron (β⁻)",
        C: "An alpha particle",
        D: "A neutron",
      },
      correct: "B",
      solution:
        "The particle carries a negative electric charge — an electron (β⁻ emission).",
      topic: "nuclear_decay",
      skill: "concept",
      diagnostic: { result: "Correct", yourAnswer: "B" },
    },
    {
      id: "aamc-sample-q55",
      number: 55,
      section: "Chem/Phys",
      stem: "What is an advantage of Doppler ultrasound over standard ultrasound?",
      choices: {
        A: "It uses ionizing radiation",
        B: "It can distinguish stationary from moving reflectors (e.g. blood flow)",
        C: "It eliminates the need for a transducer",
        D: "It only images bone",
      },
      correct: "B",
      solution:
        "Doppler ultrasound distinguishes stationary vs moving objects reflecting waves — useful for blood flow.",
      topic: "waves_sound",
      skill: "concept",
      diagnostic: { result: "Incorrect", yourAnswer: null },
    },
    {
      id: "aamc-sample-q56",
      number: 56,
      section: "Chem/Phys",
      stem: "How do the relative rates of decay of ⁹⁹Mo and ⁹⁹ᵐTc compare?",
      choices: {
        A: "They decay at identical rates regardless of half-life",
        B: "The nuclide with the shorter half-life decays faster",
        C: "Only ⁹⁹Mo decays; ⁹⁹ᵐTc is stable",
        D: "Decay rate is independent of half-life",
      },
      correct: "B",
      solution:
        "Relative decay rates follow from the half-lives — shorter half-life means a faster decay rate.",
      topic: "nuclear_decay",
      skill: "concept",
      diagnostic: { result: "Incorrect", yourAnswer: null },
    },
    {
      id: "aamc-sample-q57",
      number: 57,
      section: "Chem/Phys",
      stem: "Which buffer is the best choice for an experiment at pH 5.3?",
      choices: {
        A: "A buffer with pKa ≈ 2.3",
        B: "A buffer with pKa ≈ 5.3 (within ~1 pH unit)",
        C: "A buffer with pKa ≈ 9.0",
        D: "Pure water (pH 7)",
      },
      correct: "B",
      solution:
        "A good buffer has a pKa within about 1 pH unit of the desired experimental pH.",
      topic: "acids_bases",
      skill: "experimental_design",
      diagnostic: { result: "Incorrect", yourAnswer: null },
    },
    {
      id: "aamc-sample-q58",
      number: 58,
      section: "Chem/Phys",
      stem: "What is the value of [OH⁻] in a test solution at pH 5?",
      choices: {
        A: "1×10⁻⁵ M",
        B: "1×10⁻⁷ M",
        C: "1×10⁻⁹ M",
        D: "1×10⁻¹⁴ M",
      },
      correct: "C",
      solution: "pH 5 means pOH 9, so [OH⁻] = 10⁻⁹ M.",
      topic: "acids_bases",
      skill: "calculation",
      diagnostic: { result: "Correct", yourAnswer: "C" },
    },
    {
      id: "aamc-sample-q59",
      number: 59,
      section: "Chem/Phys",
      stem: "What is the energy of a photon with frequency 2×10¹² Hz? (h = 6.6×10⁻³⁴ J·s)",
      choices: {
        A: "1.3×10⁻²¹ J",
        B: "3.3×10⁻²² J",
        C: "1.3×10⁻⁴⁶ J",
        D: "3.3×10¹² J",
      },
      correct: "A",
      solution:
        "E = hf = (6.6×10⁻³⁴ J·s)(2×10¹² Hz) = 1.3×10⁻²¹ J.",
      topic: "atomic_structure",
      skill: "calculation",
      diagnostic: { result: "Correct", yourAnswer: "A" },
    },
  ];

  if (!window.QUESTION_PACK?.questions) return;
  const have = new Set(window.QUESTION_PACK.questions.map((q) => q.number));
  for (const q of extra) {
    if (!have.has(q.number)) {
      window.QUESTION_PACK.questions.push(q);
      have.add(q.number);
    }
  }
  window.QUESTION_PACK.questions.sort((a, b) => a.number - b.number);
  window.QUESTION_PACK.title = "AAMC Sample Chem/Phys Q1–59";
  window.QUESTION_PACK.count = window.QUESTION_PACK.questions.length;
})();
