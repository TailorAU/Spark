/*
 * Spark — data layer
 * The children, the Australian curriculum frameworks they sit under, the
 * life-context library, and the activity templates the engine weaves together.
 *
 * Everything here is static reference data. State (what's been done, which
 * contexts are active) lives in store.js / localStorage.
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // The children (single-family v1). Ages / year levels computed from DOB
  // against Queensland enrolment rules.
  // ---------------------------------------------------------------------------
  // Anonymised for the public repo — no real names, exact birthdays, or a
  // specific named school. Ages and year levels are preserved: they're derived
  // from these representative DOBs against Queensland enrolment rules, so the
  // curriculum logic is unchanged. Swap these three for your own family locally.
  // Child records are NOT shipped in source. They live encrypted in
  // children.enc.json and are injected here by SPARK_AUTH after the family
  // enters the password (see auth.js). Until then this is empty and the app
  // shows the lock screen.
  let CHILDREN = [];
  function setChildren(arr) {
    CHILDREN.length = 0;
    (arr || []).forEach((c) => CHILDREN.push(c));
    window.SPARK_DATA.CHILDREN = CHILDREN;
  }

  // ---------------------------------------------------------------------------
  // Curriculum frameworks. Each framework is a list of "areas" (the spine we
  // map weeks against). For school-age children the areas are learning areas;
  // for early years they are the framework's learning outcomes.
  // ---------------------------------------------------------------------------
  const FRAMEWORKS = {
    // Early Years Learning Framework V2.0 — birth to 5. (Youngest.)
    eylf: {
      label: "EYLF V2.0",
      long: "Early Years Learning Framework (V2.0)",
      kind: "outcomes",
      areas: [
        { id: "identity", label: "Sense of identity", strands: ["Feeling safe & secure", "Building independence", "Knowing who I am"] },
        { id: "community", label: "Connected to my world", strands: ["Belonging to family & group", "Caring for living things", "Fairness & turn-taking"] },
        { id: "wellbeing", label: "Sense of wellbeing", strands: ["Moving my body", "Self-help skills", "Big feelings"] },
        { id: "learning", label: "Confident learner", strands: ["Curiosity & exploring", "Cause & effect", "Persisting at a task"] },
        { id: "communication", label: "Effective communicator", strands: ["Words & talking", "Songs & rhymes", "Mark-making & early drawing"] },
      ],
    },
    // Queensland Kindergarten Learning Guideline — kindy year. (Middle.)
    qklg: {
      label: "QKLG",
      long: "Queensland Kindergarten Learning Guideline",
      kind: "outcomes",
      areas: [
        { id: "identity", label: "Identity", strands: ["Confidence & independence", "Persistence", "Sense of self"] },
        { id: "connectedness", label: "Connectedness", strands: ["Belonging & culture", "Caring for the natural world", "Group play"] },
        { id: "wellbeing", label: "Wellbeing", strands: ["Gross-motor & balance", "Fine-motor & tools", "Healthy routines & feelings"] },
        { id: "activelearning", label: "Active learning", strands: ["Investigating & problem-solving", "Early number & pattern", "Imagining & inventing"] },
        { id: "communicating", label: "Communicating", strands: ["Oral language & story", "Phonological awareness", "Early mark-making & writing"] },
      ],
    },
    // Australian Curriculum V9 — Year 1. (Eldest.)
    acv9: {
      label: "Australian Curriculum v9",
      long: "Australian Curriculum V9 — Year 1",
      kind: "learningAreas",
      areas: [
        { id: "english", label: "English", strands: ["Phonics & spelling", "Reading & viewing", "Writing & recount", "Speaking & listening"] },
        { id: "maths", label: "Mathematics", strands: ["Number to 100", "Addition & subtraction", "Measurement & time", "Shape & position", "Patterns"] },
        { id: "science", label: "Science", strands: ["Living things", "Everyday materials", "Earth's resources", "Sky & weather"] },
        { id: "hass", label: "HASS", strands: ["My family & past", "Places I belong (geography)", "Asking questions about the world"] },
        { id: "hpe", label: "Health & PE", strands: ["Fundamental movement skills", "Being active & fitness", "My body, safety & feelings"] },
        { id: "arts", label: "The Arts", strands: ["Visual art", "Music & rhythm", "Drama & dance"] },
        { id: "tech", label: "Technologies", strands: ["Design thinking", "Digital & sequencing"] },
      ],
    },
  };

  // ---------------------------------------------------------------------------
  // Life contexts. These are the "what we're actually doing" overlays that
  // tailor the week. Each carries tags the engine matches against curriculum
  // areas, plus a bank of ready weave-ins per area so the app works fully
  // offline. `oneOff` events fade after their week; `ongoing` persist.
  // ---------------------------------------------------------------------------
  const CONTEXT_LIBRARY = [
    {
      id: "fiji",
      label: "Just back from Fiji",
      emoji: "🏝️",
      kind: "recent",
      childScope: "all",
      blurb: "Recount the trip, explore the ocean, and learn about Fijian culture.",
      weave: {
        english: "Draw and tell the story of Fiji in order: first we flew, then… (a recount with beginning–middle–end).",
        writing: "Write 3 sentences about the best thing in Fiji. Try a full stop at the end of each.",
        maths: "Sort your Fiji shells by size, then count them into groups of ten.",
        measurement: "How many 'sleeps' were we away? Mark them on a calendar and count.",
        science: "Talk about why the sea is salty and why coral is alive. Draw one sea creature you saw.",
        hass: "Find Fiji and home on a globe or map. Which is closer to the equator? Why is it warm there?",
        connectedness: "Fiji has its own language — learn to say 'Bula!' (hello). What do we say at home?",
        community: "Say bula! People in Fiji greet warmly. Practise a friendly hello with a smile.",
        activelearning: "Build a boat from blocks that floats your toy across the bath 'ocean'.",
        learning: "Float and sink: guess which bath toys will float, then test them.",
        wellbeing: "Sun safety: why did we wear hats and rashies at the beach? Slip-slop-slap song.",
        arts: "Paint a Fiji sunset with warm colours — orange, pink, gold.",
        identity: "Show a Fiji photo and tell one thing you loved. 'I felt ____ when…'.",
        communicating: "Retell the plane trip using picture cards you draw.",
        communication: "Sing a made-up 'we went to Fiji' song with actions.",
      },
    },
    {
      id: "camping",
      label: "Camping this weekend with schoolmates",
      emoji: "⛺",
      kind: "upcoming",
      childScope: "all",
      blurb: "Nature, teamwork, stars and staying safe outdoors — with friends from school.",
      weave: {
        science: "Nature hunt at camp: find something living, something once-living, something never-alive. Sort them.",
        english: "Make a camp checklist together — read each item as you pack it.",
        writing: "Keep a tiny camp journal: one sentence + one drawing each night.",
        maths: "Count the tent pegs; share the marshmallows equally between friends. How many each?",
        measurement: "Pace out where the tent goes — how many big steps long is it?",
        hass: "Whose land are we camping on? Notice the trees, hills and water and where we belong.",
        hpe: "Set up a safe camp: what to do near the fire, near water, and if you get lost (stay put, hug a tree).",
        arts: "Make bark-and-leaf rubbings, or draw the campfire at night.",
        connectedness: "Playing with school friends — practise sharing the ball and taking turns.",
        community: "Help pack the car and set up — everyone has a job in the group.",
        wellbeing: "Star-gazing wind-down: lie back, breathe slow, name what you can hear.",
        activelearning: "Build the best stick cubby you can with your friends.",
        learning: "Why does the fire need sticks and air? Watch and talk about what it needs.",
        identity: "Being brave away from home — 'I can sleep in a tent, I am ____.'",
        communicating: "Tell a group story around the (pretend) campfire, each adds a line.",
        communication: "Sing camp songs with actions before bed.",
        tech: "Plan the pack: put the pack-up steps in order (design thinking).",
      },
    },
    {
      id: "crosscountry",
      label: "Cross country training",
      emoji: "🏅",
      kind: "ongoing",
      childScope: ["eldest"],
      blurb: "A build-up training plan plus running-linked maths, science and resilience.",
      weave: {
        hpe: "Today's run (see the training plan card). Warm up, run, then a big stretch and water.",
        maths: "Time your lap with a stopwatch. Was today faster or slower than last time? By how many seconds?",
        science: "Why does your heart beat fast after running? Feel it, then feel it slow down as you rest.",
        english: "Read a short 'how to run further' tip together, then say it back in your own words.",
        writing: "Log today's run: distance, how it felt, one word for it.",
        hass: "Map your training loop around the block — draw the route and mark the start/finish.",
        identity: "Grit talk: 'When it got hard I kept going because ____.'",
        arts: "Design your race-day number and a cheer chant.",
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // The eldest's cross-country build-up. A simple, safe progression for a 6yo —
  // short, play-based, alternating easy runs, intervals and rest. Indexed by
  // "weeks out" from race day (set race date in the app).
  // ---------------------------------------------------------------------------
  const CROSS_COUNTRY_PLAN = [
    { wk: 6, focus: "Base & fun", sessions: ["Easy jog 8 min + play", "Rest / scooter", "Run-walk 10 min", "Rest", "Backyard relays"] },
    { wk: 5, focus: "Build easy", sessions: ["Easy jog 10 min", "Rest", "6× 20-sec fast, walk back", "Rest", "Park run-walk 12 min"] },
    { wk: 4, focus: "Add distance", sessions: ["Easy jog 12 min", "Rest / swim", "5× 30-sec efforts", "Rest", "Explore run 14 min"] },
    { wk: 3, focus: "Race feel", sessions: ["Easy 12 min", "Rest", "8× 20-sec hills, walk down", "Rest", "Time-trial the course loop"] },
    { wk: 2, focus: "Sharpen", sessions: ["Easy 10 min", "Rest", "4× 40-sec at race pace", "Rest", "Short 8-min jog + strides"] },
    { wk: 1, focus: "Taper & rest", sessions: ["Easy 8 min", "Rest", "3× 20-sec strides", "Rest", "Race day — warm up & go!"] },
  ];

  const STAGE_LABEL = {
    year1: "Year 1",
    kindy: "Kindergarten",
    eylf: "Early years",
  };

  window.SPARK_DATA = {
    CHILDREN,
    setChildren,
    FRAMEWORKS,
    CONTEXT_LIBRARY,
    CROSS_COUNTRY_PLAN,
    STAGE_LABEL,
  };
})();
