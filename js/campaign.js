/**
 * Campaign structure: 4-day Hogwarts-style arc over Chem/Phys Q1–59.
 * Each companion walks a disjoint slice of the sample bank.
 */
window.CAMPAIGN = {
  title: "Arcanum",
  subtitle: "MCAT Mastery Path · Campus Atlas",
  playerTitle: "First-Year Scholar",
  /**
   * Guided "Play" journey — numbered beats like a chapter path.
   * Each beat still gates on MCAT trial success (≥60% mains).
   */
  playJourney: {
    title: "Play the Year",
    lede: "A guided path through the campus. Tap Continue for the next open trial — every unlock is earned by Chem/Phys wards.",
  },
  /**
   * Disjoint AAMC Sample Q1–59 banks per companion.
   * Switching companions presents different wards — not the same deck again.
   * Engine auto-splits each bank across entrance + main trials.
   */
  companionPaths: {
    rowan: {
      bank: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      entranceCount: 6,
      passCorrect: 4,
    },
    sage: {
      bank: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
      entranceCount: 6,
      passCorrect: 4,
    },
    pip: {
      bank: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
      entranceCount: 6,
      passCorrect: 4,
    },
    vesper: {
      bank: [46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
      entranceCount: 6,
      passCorrect: 4,
    },
  },
  /**
   * Entrance set — questions first (resolved from active companion path).
   * Clear this companion's entrance to board the Express on their path.
   */
  entrance: {
    id: "entrance-exam",
    name: "Platform Entrance Set",
    character: "elowen",
    questionIds: [1, 2, 3, 4, 5, 6],
    passCorrect: 4,
    intro: [
      {
        speaker: "elowen",
        text: "Before the map, before the village, before the train — prove the science. Answer these Chem/Phys items. Mastery opens the realm.",
      },
      {
        speaker: "_companion",
        text: "This is studying with a journey wrapped around it. Get enough right, and we board. Each companion walks a different set of wards.",
      },
    ],
  },
  /**
   * Campus atlas — interactive location map (structure inspired by location-visit
   * school RPGs + guided play hubs). Photographic places with original Arcanum names.
   * mapPos pins places on the campus board (percent of board).
   */
  atlas: {
    title: "Campus Atlas",
    lede: "Explore by place — tap a pin to visit. Study halls open only when you clear their MCAT gates.",
    spots: [
      {
        id: "express",
        name: "Midnight Express",
        role: "The train",
        kind: "visit",
        pin: "Train",
        mapPos: { left: "6%", top: "62%", w: "22%" },
        art: "assets/scenes/steam-train.jpg",
        blurb:
          "Board once you clear the entrance set. A short ride marks that you’ve earned your seat at school.",
        arrive:
          "Steam curls along the platform. Your ticket was earned — not gifted — by the entrance set.",
        unlock: { type: "flag", flag: "entranceCleared" },
      },
      {
        id: "market-row",
        name: "Market Row",
        role: "Supplies & potions",
        kind: "visit",
        pin: "Market",
        mapPos: { left: "32%", top: "68%", w: "24%" },
        art: "assets/scenes/market-street.jpg",
        blurb:
          "Crowded shopfronts and brass scales — a market street for Arcanum. Unlocks after your first main trial.",
        arrive:
          "Lanterns sway over stalls. Optional short practice lives here — still real Chem/Phys, never fluff.",
        unlock: { type: "cleared", levelId: "d1-main-1" },
        optionalQuestions: [16, 17],
      },
      {
        id: "hearth-inn",
        name: "Three Embers Inn",
        role: "Village hearth",
        kind: "visit",
        pin: "Inn",
        mapPos: { left: "58%", top: "70%", w: "22%" },
        art: "assets/scenes/fireplace-warm.jpg",
        blurb:
          "Warm tables and quiet review — the village inn after a hard day of wards. Unlocks when Day 1’s gate clears.",
        arrive:
          "The hearth takes the chill off your sleeves. Rest is allowed; mastery is still the rent.",
        unlock: { type: "cleared", levelId: "d1-main-3" },
        optionalQuestions: [22, 23],
      },
      {
        id: "keepers-hut",
        name: "Keeper’s Hut",
        role: "Groundskeeper",
        kind: "visit",
        pin: "Hut",
        mapPos: { left: "78%", top: "58%", w: "18%" },
        art: "assets/chars/portrait-groundskeeper.png",
        blurb: "Edge of the woods with the groundskeeper. A place to breathe between practice sets.",
        arrive:
          "Muddy boots by the door. The groundskeeper nods — you can linger, then get back to wards.",
        unlock: { type: "flag", flag: "entranceCleared" },
      },
      {
        id: "wing-asphodel",
        name: "Great Hall",
        role: "Day 1 · study hall",
        kind: "world",
        worldId: "wing-asphodel",
        pin: "Hall",
        mapPos: { left: "10%", top: "14%", w: "34%" },
        art: "assets/scenes/cathedral-interior.jpg",
        blurb: "Living systems & calculation — your first Chem/Phys wing.",
        unlock: { type: "world", worldId: "wing-asphodel" },
      },
      {
        id: "wing-mercury",
        name: "Potion Vaults",
        role: "Day 2 · study hall",
        kind: "world",
        worldId: "wing-mercury",
        pin: "Vaults",
        mapPos: { left: "52%", top: "12%", w: "32%" },
        art: "assets/hero-castle.png",
        blurb: "Kinetics, separations, restless gases.",
        unlock: { type: "world", worldId: "wing-mercury" },
      },
      {
        id: "wing-lodestone",
        name: "Library Tower",
        role: "Day 3 · study hall",
        kind: "world",
        worldId: "wing-lodestone",
        pin: "Library",
        mapPos: { left: "8%", top: "38%", w: "30%" },
        art: "assets/scenes/grand-library.jpg",
        blurb: "Forces, heat, and careful reading of tables.",
        unlock: { type: "world", worldId: "wing-lodestone" },
      },
      {
        id: "wing-owls",
        name: "Owlery Spire",
        role: "Day 4 · finals",
        kind: "world",
        worldId: "wing-owls",
        pin: "Owlery",
        mapPos: { left: "56%", top: "36%", w: "34%" },
        art: "assets/scenes/moonlit-clouds.jpg",
        blurb: "End-of-year seals. Full mastery pressure.",
        unlock: { type: "world", worldId: "wing-owls" },
      },
    ],
  },
  /**
   * Journey companions — Harry Potter–inspired archetypes with original names
   * (no trademarked character names/likenesses). Portraits are individual
   * royalty-free archetypal faces under assets/chars/ (not celebrity likenesses).
   */
  companions: {
    rowan: {
      id: "rowan",
      name: "Rowan Brightmane",
      role: "Lionheart companion",
      archetype: "brave",
      houseCue: "Courage under exam fire",
      tagline: "Charges the sealed door first — then makes you prove the math.",
      voice: "Warm, blunt, rallies after every curse",
      portrait: "assets/chars/portrait-rowan.png",
      portraitFocus: "50% 16%",
      portraitFit: "cover",
      accent: "#c45c2a",
      lines: {
        greet:
          "Pick me and we walk the wings together. I'll shove when the seals stall.",
        map: "Four towers. One year. Stick close — bravery without method is just noise.",
        success: [
          "Ha! True cast. The corridor likes you today.",
          "That's the spirit — clean reasoning, clean light.",
          "Ward holds. Don't get cocky; the next door bites harder.",
        ],
        curse: [
          "Curse set. Shake it off — we hunt that topic again before nightfall.",
          "Ugly cast. Fine. Courage means walking back into the same fire.",
          "The stones remember. So do we. Up.",
        ],
      },
    },
    sage: {
      id: "sage",
      name: "Sage Nightquill",
      role: "Tower scholar companion",
      archetype: "clever",
      houseCue: "Pattern-first wit",
      tagline: "Reads the ward like a riddle — and makes you name the principle.",
      voice: "Dry, precise, allergic to fuzzy thinking",
      portrait: "assets/chars/portrait-sage.png",
      portraitFocus: "50% 18%",
      portraitFit: "cover",
      accent: "#6b8cae",
      lines: {
        greet:
          "Choose a mind that catalogs faults. I prefer clever exits to dramatic ones.",
        map: "Note which wing still hums wrong. Mastery is a map, not a mood.",
        success: [
          "Elegant. You named the principle before the distractors sang.",
          "Correct — and more importantly, for the right reason.",
          "The archive will file that under 'not hopeless.'",
        ],
        curse: [
          "Predictable fault. We will spaced-repeat it until the pattern breaks.",
          "You guessed. Guessing is how curses breed.",
          "Annotate the miss. Then we return surgical.",
        ],
      },
    },
    pip: {
      id: "pip",
      name: "Pip Hazelcroft",
      role: "Hearthkeeper companion",
      archetype: "loyal",
      houseCue: "Steady loyalty",
      tagline: "Keeps the kettle on and your spaced reviews honest.",
      voice: "Gentle, stubborn about rest and review",
      portrait: "assets/chars/portrait-pip.png",
      portraitFocus: "50% 20%",
      portraitFit: "cover",
      accent: "#d4a84b",
      lines: {
        greet:
          "I'll walk every wing with you — and drag you to rest when the curses pile up.",
        map: "Open doors when ready. Side chores count; so does a quiet Grimoire hour.",
        success: [
          "Lovely work. Pack a biscuit before the next chamber.",
          "See? Steady hands. The castle softens for that.",
          "True seal. I'm proud — quietly, but properly.",
        ],
        curse: [
          "Oh dear. Sit. We'll review that topic until it stops biting.",
          "A curse isn't a verdict. It's a chore list. I'm good at those.",
          "Breathe. Then we take the side path and clear the fog.",
        ],
      },
    },
    vesper: {
      id: "vesper",
      name: "Vesper Blackmere",
      role: "Green-coil companion",
      archetype: "ambitious",
      houseCue: "Ambition with teeth",
      tagline: "Wants the Hall of OWLs — and will not let you settle for almost.",
      voice: "Cool, competitive, oddly protective",
      portrait: "assets/chars/portrait-vesper.png",
      portraitFocus: "50% 14%",
      portraitFit: "cover",
      accent: "#3d7a4f",
      lines: {
        greet:
          "Pick me if you intend to finish. Sentiment is optional; mastery is not.",
        map: "Sealed wings are invitations. We take the efficient path — unless a side bet pays.",
        success: [
          "Adequate. Again — until the wing unlocks.",
          "Clean cast. Don't waste the momentum on dawdling.",
          "The rival will notice. Good. Let them.",
        ],
        curse: [
          "Sloppy. That topic is now a liability — fix it before the gate.",
          "I don't berate for sport. I berate so you stop losing.",
          "Curse logged. Ambition without correction is theater.",
        ],
      },
    },
  },
  characters: {
    elowen: {
      id: "elowen",
      name: "Professor Elowen",
      role: "Head of the Chem/Phys Wing",
      voice: "Measured, exacting, secretly proud",
      portrait: "assets/chars/portrait-elowen.png",
      portraitFocus: "50% 18%",
      portraitFit: "cover",
    },
    cassian: {
      id: "cassian",
      name: "Cassian Vale",
      role: "Rival third-year",
      voice: "Sharp, competitive, useful when cornered",
      portrait: "assets/chars/portrait-cassian.png",
      portraitFocus: "50% 16%",
      portraitFit: "cover",
    },
    bramble: {
      id: "bramble",
      name: "Bramble",
      role: "House-elf lab assistant",
      voice: "Fussy, loyal, speaks in practical metaphors",
      portrait: "assets/chars/portrait-bramble.png",
      portraitFocus: "50% 20%",
      portraitFit: "cover",
    },
    lyra: {
      id: "lyra",
      name: "Lyra Quill",
      role: "Archives ghost",
      voice: "Soft, cryptic, loves patterns in mistakes",
      portrait: "assets/chars/portrait-lyra.png",
      portraitFocus: "50% 18%",
      portraitFit: "cover",
    },
  },
  worlds: [
    {
      id: "wing-asphodel",
      day: 1,
      name: "Great Hall Wing",
      place: "Great Hall",
      parallel: "Hogwarts Great Hall / Entrance Hall",
      tagline: "Where living systems meet cold calculation",
      unlockRule: { type: "start" },
      musicCue: "wing-asphodel",
      sceneKey: "asphodel",
      mapArt: "assets/scenes/cathedral-interior.jpg",
      atmosphere:
        "Long tables, floating candlelight, and sealed side doors. The Hall only opens corridors when your reasoning holds.",
      levels: [
        {
          id: "d1-main-1",
          name: "The Protease Seal",
          type: "main",
          character: "elowen",
          questionIds: [1, 2, 3, 4, 14],
          intro: [
            {
              speaker: "elowen",
              text: "The Protease Seal has slept since the last failed class. Tonight you wake it — antagonism, chirality, stonefall, cleavage.",
            },
            {
              speaker: "elowen",
              text: "Raise your wand. Each true cast lights a corridor. False magic leaves a curse the stones will recite back to you.",
            },
          ],
          successUnlock: "d1-main-2",
        },
        {
          id: "d1-main-2",
          name: "Axon Observatory",
          type: "main",
          character: "cassian",
          questionIds: [5, 6, 7, 8, 9, 15],
          intro: [
            {
              speaker: "cassian",
              text: "Trying the Observatory already? Cute. Field lines, myelin, Channel X—don't embarrass yourself.",
            },
            {
              speaker: "cassian",
              text: "If you clear it, I'll admit you're not entirely hopeless. Maybe.",
            },
          ],
          successUnlock: "d1-main-3",
        },
        {
          id: "d1-main-3",
          name: "The Acid Reliquary",
          type: "main",
          character: "bramble",
          questionIds: [10, 11, 12, 13, 26, 27],
          intro: [
            {
              speaker: "bramble",
              text: "Bramble cleaned the Reliquary twice! pH, weak acids, oxyacids—please do not explode the glassware.",
            },
          ],
          successUnlock: "world-wing-mercury",
          isWorldGate: true,
        },
        {
          id: "d1-side-rival",
          name: "Side Mission: Cassian's Wager",
          type: "side",
          character: "cassian",
          questionIds: [14, 15, 16, 17],
          intro: [
            {
              speaker: "cassian",
              text: "Side bet. Squalene and stoichiometry. Win, and I'll tip you off about tomorrow's wing.",
            },
          ],
          reward: "rival_respect",
        },
      ],
    },
    {
      id: "wing-mercury",
      day: 2,
      name: "Potion Vaults",
      place: "Potion Vaults",
      parallel: "Potions dungeon / hospital wing labs",
      tagline: "Chromatography, kinetics, and restless gases",
      unlockRule: { type: "world", worldId: "wing-mercury" },
      musicCue: "wing-mercury",
      sceneKey: "mercury",
      mapArt: "assets/hero-castle.png",
      atmosphere:
        "Stone vaults smell of copper and crushed herbs. Columns drip like hourglasses. The air tastes metallic.",
      levels: [
        {
          id: "d2-main-1",
          name: "Discrete Alchemy Hall",
          type: "main",
          character: "elowen",
          questionIds: [16, 17, 51, 52],
          intro: [
            {
              speaker: "elowen",
              text: "Sugars that refuse the silver mirror. Peptides that refuse neutrality. Prove you can think without a passage holding your hand.",
            },
          ],
          successUnlock: "d2-main-2",
        },
        {
          id: "d2-main-2",
          name: "CYP2C9 Trial Chamber",
          type: "main",
          character: "lyra",
          questionIds: [18, 19, 20, 21, 53, 54],
          intro: [
            {
              speaker: "lyra",
              text: "I remember every student who misread a Lineweaver–Burk intercept. Do not join them.",
            },
          ],
          successUnlock: "d2-main-3",
        },
        {
          id: "d2-main-3",
          name: "Buret & Gasworks",
          type: "main",
          character: "bramble",
          questionIds: [22, 23, 24, 25, 55, 57],
          intro: [
            {
              speaker: "bramble",
              text: "Redox, pressure, R = PV/nT. Bramble will cry if you pick the wrong rearrangement again.",
            },
          ],
          successUnlock: "world-wing-lodestone",
          isWorldGate: true,
        },
        {
          id: "d2-side-ghost",
          name: "Side Mission: Lyra's Echoes",
          type: "side",
          character: "lyra",
          questionIds: [26, 27, 51],
          intro: [
            {
              speaker: "lyra",
              text: "Your diagnostic left footprints. Density. Doppler. Walk them with me until the curse loosens.",
            },
          ],
          reward: "archive_key",
          preferWeak: true,
        },
      ],
    },
    {
      id: "wing-lodestone",
      day: 3,
      name: "Library Tower",
      place: "Library Tower",
      parallel: "Hogwarts Library / Restricted Section",
      tagline: "Forces, heat, and stubborn wire",
      unlockRule: { type: "world", worldId: "wing-lodestone" },
      musicCue: "wing-lodestone",
      sceneKey: "lodestone",
      mapArt: "assets/scenes/grand-library.jpg",
      atmosphere:
        "Stacks rise into shadow. A suspended wire glows faintly between shelves. Quiet is enforced — except by curses.",
      levels: [
        {
          id: "d3-main-1",
          name: "Foundations Gallery",
          type: "main",
          character: "elowen",
          questionIds: [28, 29, 56, 58],
          intro: [
            {
              speaker: "elowen",
              text: "Hydrogen bonds that lift boiling points. Principal quantum numbers that sketch electron clouds. Foundations before fire.",
            },
          ],
          successUnlock: "d3-main-2",
        },
        {
          id: "d3-main-2",
          name: "BSA Binding Crypt",
          type: "main",
          character: "cassian",
          questionIds: [30, 31, 32, 33, 59],
          intro: [
            {
              speaker: "cassian",
              text: "Tables lie to the impatient. Binding sites reward those who actually read them.",
            },
          ],
          successUnlock: "d3-main-3",
        },
        {
          id: "d3-main-3",
          name: "The Heated Wire",
          type: "main",
          character: "bramble",
          questionIds: [34, 35, 36, 37],
          intro: [
            {
              speaker: "bramble",
              text: "Density, graphs, heat, current. Touch the wire wrong in your mind and the trial resets!",
            },
          ],
          successUnlock: "world-wing-owls",
          isWorldGate: true,
        },
        {
          id: "d3-side-bramble",
          name: "Side Mission: Bramble's Broken Scale",
          type: "side",
          character: "bramble",
          questionIds: [43, 44],
          intro: [
            {
              speaker: "bramble",
              text: "Myopia lenses and frozen water—Bramble's side chores. Help, and Bramble shares a shortcut past Cassian's taunts.",
            },
          ],
          reward: "lab_charm",
        },
      ],
    },
    {
      id: "wing-owls",
      day: 4,
      name: "Owlery Spire",
      place: "Owlery",
      parallel: "Owlery / O.W.L. examination hall",
      tagline: "Final seals. No mercy. Full mastery.",
      unlockRule: { type: "world", worldId: "wing-owls" },
      musicCue: "wing-owls",
      sceneKey: "owls",
      mapArt: "assets/scenes/moonlit-clouds.jpg",
      atmosphere:
        "The Owlery is empty except for floating quills and restless wings. Tonight the castle judges whether you leave as apprentice—or remain cursed by your faults.",
      levels: [
        {
          id: "d4-main-1",
          name: "Squalene Spiral",
          type: "main",
          character: "elowen",
          questionIds: [38, 39, 40, 41, 42],
          intro: [
            {
              speaker: "elowen",
              text: "Isoprene labeling, lactones, IR, chirality, steroid fate. The spiral does not forgive fuzzy organic thinking.",
            },
          ],
          successUnlock: "d4-main-2",
        },
        {
          id: "d4-main-2",
          name: "CoA Sanctum",
          type: "main",
          character: "lyra",
          questionIds: [45, 46, 47, 48, 49, 50],
          intro: [
            {
              speaker: "lyra",
              text: "Amygdalin. Buoyancy. Pantothenate. CoA. The sanctum opens only if your pattern of faults has thinned.",
            },
          ],
          successUnlock: "ending-clear",
          isWorldGate: true,
          isFinale: true,
        },
        {
          id: "d4-side-review",
          name: "Side Mission: Cursebreaker Review",
          type: "side",
          character: "lyra",
          questionIds: [],
          dynamicReview: true,
          reviewCount: 4,
          intro: [
            {
              speaker: "lyra",
              text: "Before the finale, we hunt your curses—the topics that keep returning. Spaced. Surgical. Necessary.",
            },
          ],
          reward: "cursebreak",
        },
      ],
    },
  ],
};
