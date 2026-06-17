/* ============================================================================
   NICOLAS OS  ·  config.js
   ----------------------------------------------------------------------------
   This is the ONLY file you need to edit to make the dashboard yours.
   Change the text, numbers, and lists below — save — refresh the page.
   Nothing here touches the code. If you break something, the app keeps running
   with safe fallbacks.

   Your live data (which habits you ticked today, tasks you added, etc.) is NOT
   stored here — that lives in your browser (localStorage) so it survives
   refreshes. This file is the "starting state" + the things that rarely change.
   ============================================================================ */

window.CONFIG = {

  /* --- WHO YOU ARE ------------------------------------------------------- */
  operator: {
    name: "Nicolas Pazos",
    initials: "NP",            // shown in the top-right avatar chip
    role: "Founder",
    org: "Glint Sites",
    city: null,                // null = auto-detect from your browser timezone.
                               // Override with e.g. "Madrid" if you want.
    // Your "focus state" — pick the one that fits, or add your own.
    focusStates: ["DEEP WORK", "BUILDING", "SALES", "ADMIN", "GROWTH", "RECOVERY"],
    defaultFocus: "BUILDING",
  },

  /* --- BRANDING ---------------------------------------------------------- */
  system: {
    osName: "NICOLAS OS",      // shown top-left
    version: "V1.0",
    // Default theme: "jarvis" (cyan) or "batman" (amber/gold). Toggle live in the UI.
    defaultTheme: "matrix",
    // Boot sequence lines (JARVIS-style). Keep them short.
    bootLines: [
      "INITIALIZING NICOLAS OS",
      "MOUNTING MODULES ............ OK",
      "SYNCING HABIT MATRIX ........ OK",
      "LOADING GLINT SITES OPS ..... OK",
      "CALIBRATING MOMENTUM ENGINE . OK",
      "ALL SYSTEMS NOMINAL",
    ],
  },

  /* --- THE ONE LINE THAT DRIVES THE DAY ---------------------------------- */
  // Your "what should I feel" anchor. Shown subtly in the Session card.
  creed: "Momentum compounds. Win today, then do it again tomorrow.",

  /* --- HABITS (the momentum centerpiece) --------------------------------- */
  // type: "toggle" (done / not done) or "counter" (0 / target).
  // cat:  WORK · BODY · MIND  (color-coded chips)
  habits: [
    { id: "deepwork",  label: "Deep work block (90m)", cat: "WORK", type: "toggle" },
    { id: "ship",      label: "Ship something for a client", cat: "WORK", type: "toggle" },
    { id: "outreach",  label: "Client outreach",       cat: "WORK", type: "counter", target: 3 },
    { id: "train",     label: "Train / move",          cat: "BODY", type: "toggle" },
    { id: "water",     label: "Water",                 cat: "BODY", type: "counter", target: 8 },
    { id: "read",      label: "Read 20 minutes",       cat: "MIND", type: "toggle" },
    { id: "learn",     label: "Learn / practice a skill", cat: "MIND", type: "toggle" },
    { id: "lightsout", label: "Lights out by 00:00",   cat: "BODY", type: "toggle" },
  ],
  // A day "counts" toward your streak when you hit this fraction of habits.
  streakThreshold: 0.7,

  /* --- TODAY'S TASKS / PRIORITIES ---------------------------------------- */
  // urgency: today · week · month · someday   |   key: true = a "needle mover"
  // These are just the SEED list — you add/complete/remove tasks live and it
  // persists. Reset to this seed anytime from Settings → Reset.
  tasks: [
    { id: "t1", title: "Finish homepage build — [Client] site", urgency: "today", key: true,  est: 90, cat: "WORK", done: false },
    { id: "t2", title: "Reply to new website lead",             urgency: "today", key: true,  est: 15, cat: "WORK", done: false },
    { id: "t3", title: "Post a build-in-public update",         urgency: "today", key: false, est: 20, cat: "GROWTH", done: false },
    { id: "t4", title: "Send proposal to [Lead]",               urgency: "week",  key: true,  est: 45, cat: "WORK", done: false },
    { id: "t5", title: "Set up client onboarding template",     urgency: "week",  key: false, est: 60, cat: "WORK", done: false },
    { id: "t6", title: "Refresh Glint Sites portfolio page",    urgency: "month", key: false, est: 120, cat: "WORK", done: false },
    { id: "t7", title: "Outline a productized landing-page offer", urgency: "someday", key: false, est: 0, cat: "WORK", done: false },
  ],

  /* --- ACTIVE PROJECT (your current main build) -------------------------- */
  activeProject: {
    name: "Glint Sites — [Client] website",
    phase: "Build · v1",
    due: "Fri",                 // free text, e.g. "Jun 27" or "Fri"
    checklist: [
      { id: "p1", label: "Discovery + scope locked", done: true },
      { id: "p2", label: "Design approved", done: true },
      { id: "p3", label: "Homepage build", done: false },
      { id: "p4", label: "Inner pages", done: false },
      { id: "p5", label: "QA + responsive pass", done: false },
      { id: "p6", label: "Launch + handoff", done: false },
    ],
  },

  /* --- WORK · CLIENTS & LEADS (Glint Sites CRM-lite) --------------------- */
  // tier: overdue · today · week · later   |   heat: HOT · WARM · COOL
  clients: [
    { id: "c1", name: "[Lead] — [Org]",     note: "Proposal follow-up",        tag: "$ new build", tier: "overdue", heat: "HOT",  stuck: 1 },
    { id: "c2", name: "[Client] — [Org]",   note: "Homepage review call",      tag: "in build",    tier: "today",   heat: "WARM", stuck: 0 },
    { id: "c3", name: "[Lead] — [Org]",     note: "Discovery call",            tag: "qualifying",  tier: "week",    heat: "WARM", stuck: 0 },
    { id: "c4", name: "[Client] — [Org]",   note: "Invoice + handoff",         tag: "closing",     tier: "week",    heat: "COOL", stuck: 0 },
    { id: "c5", name: "[Prospect] — [Org]", note: "Reply to cold outreach",    tag: "top of funnel", tier: "later", heat: "COOL", stuck: 0 },
  ],

  /* --- KEY BLOCKERS (what's stuck) --------------------------------------- */
  blockers: [
    { id: "b1", what: "Waiting on copy from [Client]", owner: "[Client]", stuck: 2, heat: "WARM" },
    { id: "b2", what: "Domain / DNS access for launch", owner: "You",     stuck: 1, heat: "HOT"  },
  ],

  /* --- CALENDAR · today's time blocks ------------------------------------ */
  // Times are 24h "HH:MM". The NOW marker is computed automatically.
  // tag colors: BUILD · SALES · BODY · SHIP · ADMIN
  calendar: [
    { start: "09:00", end: "10:30", title: "Deep work — client build", sub: "Lock in, no notifications", tag: "BUILD" },
    { start: "11:00", end: "11:30", title: "Lead call — discovery",     sub: "[Lead], scope + budget",    tag: "SALES" },
    { start: "13:00", end: "14:00", title: "Train / gym",               sub: "Push day",                  tag: "BODY"  },
    { start: "15:00", end: "16:30", title: "Client work — inner pages", sub: "[Client] site",             tag: "BUILD" },
    { start: "17:00", end: "17:30", title: "Ship + post update",        sub: "Build-in-public",           tag: "SHIP"  },
  ],

  /* --- GROWTH · reading -------------------------------------------------- */
  reading: {
    current: { title: "The Almanack of Naval Ravikant", author: "Eric Jorgenson", progress: 45 },
    next:    { title: "$100M Offers", author: "Alex Hormozi" },
  },

  /* --- GROWTH · goals (week / month) ------------------------------------- */
  goals: {
    week: [
      { id: "gw1", label: "Ship [Client] homepage", done: false },
      { id: "gw2", label: "3 sales / discovery calls", done: false },
      { id: "gw3", label: "4 training sessions", done: false },
      { id: "gw4", label: "Finish current course module", done: false },
    ],
    month: [
      { id: "gm1", label: "Sign 2 new clients", done: false },
      { id: "gm2", label: "Publish 4 posts", done: false },
      { id: "gm3", label: "Read 2 books", done: false },
      { id: "gm4", label: "Launch portfolio refresh", done: false },
    ],
  },

  /* --- GROWTH · health quick stats (manual, daily) ----------------------- */
  health: {
    // targets only — your daily values are tracked live and reset each day.
    stepsGoal: 8000,
    sleepGoalH: 8,
    waterGoal: 8,   // glasses; mirrors the Water habit
  },

  /* --- REVIEW · weekly review prompts ------------------------------------ */
  // These are the section prompts; what you type is saved per ISO week.
  reviewSections: [
    { id: "wins",      label: "Wins this week" },
    { id: "slipped",   label: "What slipped" },
    { id: "loops",     label: "Open loops" },
    { id: "followups", label: "People to follow up with" },
    { id: "shipped",   label: "Shipped / published" },
    { id: "next3",     label: "Next week — top 3" },
  ],

};
