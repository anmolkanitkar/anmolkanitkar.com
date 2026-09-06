/* =========================================================
   Setu — startup-friendly public procurement
   Three roles, each with the jobs it actually does. Actions in
   one role change what the others see.
   ========================================================= */

const money = n => n >= 100 ? "₹" + (n/100).toFixed(2) + " Cr" : "₹" + n + " L";
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };

/* The vocabulary both sides describe themselves in. A department tags what a
   problem needs; a startup tags what it can do. Matching is the overlap — which
   is why it can be explained instead of just asserted. */
const CAPS = [
  "Field sensors", "IoT hardware", "Prediction models", "Computer vision",
  "Speech & language", "Satellite data", "Offline / low-bandwidth",
  "Control-room software", "Mobile app", "Data dashboards",
  "Medical devices", "Municipal deployments"
];
const SECTORS = ["Urban services", "Water", "Transport", "Health", "Agriculture", "Citizen services"];

/* A department officer should not have to think in capability tags — that is a
   supplier's vocabulary, not a buyer's. So the officer writes the problem in
   plain words and Setu reads the requirement out of it. Inferred, then shown
   back read-only, so it is visible without being another decision to make. */
const CAP_HINTS = {
  "Field sensors":        ["sensor","gauge","depth","water","flood","level","reading","measure","monitor"],
  "IoT hardware":         ["pump","valve","device","hardware","install","fitted","equipment","station"],
  "Prediction models":    ["predict","forecast","ahead","early","warn","before it","risk of"],
  "Computer vision":      ["camera","cctv","image","video","visual","pothole","crowd","footage"],
  "Speech & language":    ["call","voice","language","speech","helpline","translate","transcri"],
  "Satellite data":       ["satellite","remote sensing","aerial","imagery"],
  "Offline / low-bandwidth":["offline","2g","low bandwidth","weak network","patchy","rural"],
  "Control-room software":["control room","dispatch","operator","crew","complaint","route a team"],
  "Mobile app":           ["mobile","phone","app","field staff","on the ground"],
  "Data dashboards":      ["dashboard","ranked list","weekly list","report","records","register"],
  "Medical devices":      ["patient","clinical","blood","health centre","phc","screening"],
  "Municipal deployments":["ward","municipal","city","street","civic","zone","corporation"]
};
function inferNeeds(text){
  const t = (text || "").toLowerCase();
  return CAPS.filter(c => (CAP_HINTS[c] || []).some(k => t.includes(k))).slice(0, 5);
}

/* ---------------- seed data ---------------- */

const DB = {
  applicants: [
    {id:"SU-2417", name:"Aarohi Systems", city:"Pune", team:11, score:88, price:172, first:false,
     desc:"Drain sensors plus a rainfall model. Keeps working on 2G, which matters in the older wards.",
     facts:["2 past municipal pilots","Under the ceiling","Can start in 3 weeks"]},
    {id:"SU-1902", name:"Drishti Analytics", city:"Bengaluru", team:24, score:81, price:178, first:false,
     desc:"Satellite rainfall plus the city's rain gauges. Good screen, but nothing installed in the field.",
     facts:["1 past state contract","Under the ceiling","Can start in 2 weeks"]},
    {id:"SU-3140", name:"Neerkarma Labs", city:"Kochi", team:7, score:74, price:141, first:true,
     desc:"Ultrasonic depth sensors. Cheapest workable bid, but will need integration help.",
     facts:["First public contract","Well under the ceiling","Can start in 6 weeks"]},
    {id:"SU-2088", name:"Setuka Infotech", city:"Nagpur", team:15, score:69, price:166, first:false,
     desc:"Proven control-room software. The prediction part is untested.",
     facts:["2 past municipal pilots","Under the ceiling","Can start in 4 weeks"]},
    {id:"SU-3766", name:"Varsha Mesh", city:"Ahmedabad", team:5, score:63, price:118, first:true,
     desc:"Lowest price. Five people is thin for 12 wards.",
     facts:["First public contract","Well under the ceiling","Can start in 8 weeks"]},
    {id:"SU-2955", name:"Antara Grid", city:"Hyderabad", team:19, score:58, price:214, first:false,
     desc:"Long track record, but quoted above the published ceiling.",
     facts:["3 past state contracts","Above the ceiling","Can start in 2 weeks"]}
  ],

  /* Challenges that were already open before this session started. */
  seeded: [
    {id:"UA-2026-027", dept:"Urban Affairs", sector:"Water",
     title:"Stop water pumps failing without warning",
     outcome:"Predict a pump failure at least 72 hours ahead across 38 pumping stations, and halve unplanned downtime.",
     users:"Water works division, 38 stations", ceiling:210, closes:"27 Sep 2026", pilotWeeks:"16 weeks",
     needs:["Field sensors","IoT hardware","Prediction models","Municipal deployments","Data dashboards"]},
    {id:"UA-2026-031", dept:"Urban Affairs", sector:"Urban services",
     title:"Warn the control room when a transit plaza gets dangerously crowded",
     outcome:"Flag crowding above 4 people per square metre within 60 seconds, using the CCTV already installed.",
     users:"City control room, 9 plazas", ceiling:140, closes:"30 Sep 2026", pilotWeeks:"12 weeks",
     needs:["Computer vision","Control-room software","Municipal deployments"]},
    {id:"TR-2026-018", dept:"Transport", sector:"Transport",
     title:"Find the potholes without sending out a survey team",
     outcome:"Produce a weekly ranked repair list for 1,100 km of arterial road, using cameras already fitted to city buses.",
     users:"Roads maintenance cell", ceiling:120, closes:"16 Sep 2026", pilotWeeks:"12 weeks",
     needs:["Computer vision","Mobile app","Municipal deployments"]},
    {id:"HL-2026-021", dept:"Health", sector:"Health",
     title:"Screen for anaemia without drawing blood",
     outcome:"Screen 500 patients a day at a primary health centre, agreeing with the lab result at least 92% of the time.",
     users:"Primary health centres, 3 districts", ceiling:240, closes:"18 Sep 2026", pilotWeeks:"20 weeks",
     needs:["Medical devices","Mobile app","Data dashboards"]}
  ],

  registry: [
    {sol:"Multilingual call triage", by:"Bhasha Works", origin:"Public Grievances",
     proof:"91% of calls routed correctly, 4,200 calls a day, over six months", adopters:5, price:61},
    {sol:"Crop residue fire detection", by:"Prithvi Sense", origin:"Agriculture",
     proof:"87% of fires found within six hours, 4% false alarms", adopters:2, price:74},
    {sol:"School attendance verification", by:"Kalpataru Metrics", origin:"Education",
     proof:"1.1 million records verified, 0.3% disputed", adopters:3, price:29}
  ]
};

/* The pilot the guided demo follows end to end. Its applications closed before
   this session; it is what the officer's pilot and award screens are bound to. */
const CHALLENGE = {
  id:"UA-2026-014", dept:"Urban Affairs", sector:"Water",
  title:"Stop wards from flooding during the monsoon",
  outcome:"Warn the drainage control room 45 minutes before a ward floods, so standing water is cleared in under 75 minutes instead of the present 190.",
  users:"Ward drainage control room, 12 wards", ceiling:180, closes:"Closed 12 Aug 2026",
  needs:["Field sensors","Prediction models","Offline / low-bandwidth","Municipal deployments"],
  apps:24, slots:2
};

const MS = [
  {t:"Pilot agreement signed", amt:36, plan:"Week 0"},
  {t:"Sensors installed in all 12 wards", amt:54, plan:"Week 4"},
  {t:"Monsoon accuracy check", amt:54, plan:"Week 10",
   hint:"Target set by the evaluator: warn 45 minutes ahead on at least 80% of events."},
  {t:"Handover and control-room training", amt:36, plan:"Week 14"}
];

/* ---------------- roles ---------------- */

const ROLES = {
  officer: {
    who:"Department Officer", sub:"Urban Affairs · R. Iyer", ic:"▦", lab:"What the officer does",
    nav:[{id:"o1", n:"1", t:"Post a problem"},
         {id:"o2", n:"2", t:"Applications received"},
         {id:"o3", n:"3", t:"Review pilot progress"},
         {id:"o4", n:"4", t:"Decide to scale"}]
  },
  startup: {
    who:"Startup User", sub:"Aarohi Systems · Pune", ic:"△", lab:"What the startup does",
    nav:[{id:"s0", n:"", t:"My capability profile"},
         {id:"s1", n:"1", t:"Browse open challenges"},
         {id:"s2", n:"2", t:"Apply"},
         {id:"s3", n:"3", t:"Run the pilot"},
         {id:"s4", n:"4", t:"Update milestones"}]
  },
  evaluator: {
    who:"Oversight (Evaluator)", sub:"National Procurement Cell", ic:"◎", lab:"What the evaluator does",
    nav:[{id:"e1", n:"1", t:"Review applications"},
         {id:"e2", n:"2", t:"Approve or reject"},
         {id:"e3", n:"3", t:"Set pilot terms"},
         {id:"e4", n:"4", t:"Fairness checks"}]
  }
};

/* ---------------- state ---------------- */

const state = {
  landing:true,                 // the intro screen a cold visitor lands on
  role:"officer", view:"o1",
  posted:[],                    // every problem the officer publishes, newest first
  applications:[],              // every application the startup files
  profile:{
    caps:["Field sensors","IoT hardware","Prediction models","Offline / low-bandwidth","Municipal deployments"],
    sectors:["Urban services","Water"],
    team:11, priceMin:120, priceMax:190, pastPilots:2
  },
  detail:null,                  // challenge id being read in full
  applyFor:null,                // challenge id being applied to
  openProblem:null,             // officer: whose applications are being viewed
  chosen:null, reason:"", rejectNote:"", terms:null,
  rejectedAll:false, extended:false,
  ms:[3,3,1,0], scaled:false,
  bannerOff:false, tour:-1
};

/* ---------------- helpers ---------------- */

const allOpen = () => state.posted.concat(DB.seeded);
const findCh = id => allOpen().find(c => c.id === id) || (CHALLENGE.id === id ? CHALLENGE : null);
const appFor = id => state.applications.find(a => a.chId === id);
const chosenApplicant = () => DB.applicants.find(a => a.id === state.chosen) || DB.applicants[0];
const paidSoFar = () => MS.reduce((s,m,i) => s + (state.ms[i] === 3 ? m.amt : 0), 0);
/* One pilot at a time: the flooding pilot is live once terms are set. */
const pilotLive = () => !!state.terms;

/* The whole point of the match: it is computed, and every point is attributable. */
function matchFor(ch){
  const p = state.profile;
  const need = ch.needs || [];
  const have = need.filter(n => p.caps.includes(n));
  const gaps = need.filter(n => !p.caps.includes(n));
  const capPts = need.length ? Math.round(60 * have.length / need.length) : 30;
  const secOk  = p.sectors.includes(ch.sector);
  const secPts = secOk ? 15 : 0;
  const pricePts = ch.ceiling >= p.priceMax ? 15 : ch.ceiling >= p.priceMin ? 8 : 0;
  const priceNote = ch.ceiling >= p.priceMax ? "Ceiling is above your usual range"
                  : ch.ceiling >= p.priceMin ? "Ceiling is inside your range, but tight"
                  : "Ceiling is below what you normally quote";
  const trackPts = p.pastPilots > 0 ? 10 : 5;
  const score = capPts + secPts + pricePts + trackPts;
  const verdict = score >= 75 ? "Worth applying to"
                : score >= 50 ? "Possible, with a gap to close"
                : "Probably not your problem";
  return {score, have, gaps, capPts, secOk, secPts, pricePts, priceNote, trackPts, verdict, need};
}
const matchClass = s => s >= 75 ? "b-ok" : s >= 50 ? "b-acc" : "b-mute";

function phead(title, sub, eyebrow){
  return '<div class="phead">' + (eyebrow ? '<div class="eyebrow">' + eyebrow + '</div>' : "") +
    '<h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : "") + '</div>';
}
function stat(lab, v, unit, sub){
  return '<div class="stat"><div class="lab">' + lab + '</div><div class="val">' + v +
    (unit ? '<small> ' + unit + '</small>' : "") + '</div>' + (sub ? '<div class="sub">' + sub + '</div>' : "") + '</div>';
}
function bar(pct, cls){
  return '<span class="bar ' + (cls||"") + '"><i data-w="' + Math.max(0,Math.min(100,pct)) + '"></i></span>';
}
function applyBars(root){
  root.querySelectorAll("[data-w]").forEach(el => { el.style.width = el.dataset.w + "%"; });
}
function field(label, help, control){
  return '<div class="field"><label>' + label + '</label>' + (help ? '<span class="help">' + help + '</span>' : "") + control + '</div>';
}
function handoff(text){
  return '<div class="note acc mt-lg"><b>What happens next.</b> ' + text + '</div>';
}
function capPicker(selected, attr){
  return '<div class="capgrid">' + CAPS.map(c =>
    '<button class="chk" type="button" ' + attr + '="' + esc(c) + '" aria-pressed="' + selected.includes(c) + '">' +
    '<span class="box">' + (selected.includes(c) ? "✓" : "") + '</span><span>' + c + '</span></button>').join("") + '</div>';
}
function matchPanel(ch, m){
  return '<div class="card"><div class="matchhead">' +
    '<div><div class="scorebig">' + m.score + '</div><div class="scorelab">out of 100</div></div>' +
    '<div class="grow"><div class="verdict">' + m.verdict + '</div>' +
    '<p class="note-sm">Worked out from your capability profile, not assigned by anyone.</p></div></div>' +
    '<div class="mrows">' +
      '<div class="mrow"><span class="mk ' + (m.have.length ? "yes" : "no") + '">' + (m.have.length ? "✓" : "–") + '</span>' +
        '<span>What they need that you do: <b>' + (m.have.join(", ") || "nothing on this list") + '</b></span>' +
        '<span class="pts">' + m.capPts + ' / 60</span></div>' +
      (m.gaps.length ? '<div class="mrow"><span class="mk no">!</span>' +
        '<span>What they need that you do not: <b>' + m.gaps.join(", ") + '</b></span><span class="pts">gap</span></div>' : "") +
      '<div class="mrow"><span class="mk ' + (m.secOk ? "yes" : "no") + '">' + (m.secOk ? "✓" : "–") + '</span>' +
        '<span>Sector: ' + ch.sector + (m.secOk ? " — you already work here" : " — new territory for you") + '</span>' +
        '<span class="pts">' + m.secPts + ' / 15</span></div>' +
      '<div class="mrow"><span class="mk ' + (m.pricePts >= 15 ? "yes" : m.pricePts ? "no" : "no") + '">' + (m.pricePts >= 15 ? "✓" : "~") + '</span>' +
        '<span>' + m.priceNote + ' (' + money(ch.ceiling) + ' vs ' + money(state.profile.priceMin) + '–' + money(state.profile.priceMax) + ')</span>' +
        '<span class="pts">' + m.pricePts + ' / 15</span></div>' +
      '<div class="mrow"><span class="mk yes">✓</span>' +
        '<span>Track record: ' + state.profile.pastPilots + ' past public pilots</span>' +
        '<span class="pts">' + m.trackPts + ' / 10</span></div>' +
    '</div></div>';
}

/* =========================================================
   LANDING — what a cold visitor sees first
   ========================================================= */

function landing(){
  return '<div class="land">' +
    '<div class="land-eyebrow">Smart India Hackathon · problem statement</div>' +
    '<h1 class="land-h1">Public procurement a startup can actually win</h1>' +
    '<p class="land-lede">“A startup-friendly public procurement mechanism that enables government departments to ' +
      'identify, pilot, procure and scale innovative solutions from eligible startups.”</p>' +
    '<p class="land-sub">Setu is a working prototype of that mechanism. Everything below is clickable — ' +
      'what you do in one role changes what the other two see.</p>' +

    '<div class="land-stages">' +
      [["1","Identify","A department posts a problem, not a specification"],
       ["2","Pilot","A funded pilot with real users, paid against milestones"],
       ["3","Procure","A pilot that hits its targets becomes a contract"],
       ["4","Scale","Proven once, bought by any department without tendering"]]
      .map(x => '<div class="land-stage"><span class="ls-n">' + x[0] + '</span>' +
        '<b>' + x[1] + '</b><span>' + x[2] + '</span></div>').join("") +
    '</div>' +

    '<h2 class="land-h2">Three people use it</h2>' +
    '<div class="land-roles">' +
      [["▦","Department Officer","Posts the problem, tracks the pilot, decides whether to scale. Never picks the winner."],
       ["△","Startup User","Finds problems that suit it, applies with no turnover history or deposit, runs the pilot."],
       ["◎","Oversight (Evaluator)","Scores applications, approves or rejects with a written reason, sets what success means, checks the process was fair."]]
      .map(x => '<div class="land-role"><span class="lr-ic">' + x[0] + '</span>' +
        '<div><b>' + x[1] + '</b><p>' + x[2] + '</p></div></div>').join("") +
    '</div>' +

    '<div class="land-cta">' +
      '<button class="btn pri big" type="button" id="landdemo">Take the guided demo · 11 steps</button>' +
      '<button class="btn big" type="button" id="landenter">Explore on my own</button>' +
    '</div>' +
    '<p class="land-foot">Prototype with representative data. No real department, startup or contract is depicted.</p>' +
  '</div>';
}

/* =========================================================
   DEPARTMENT OFFICER
   ========================================================= */

function o1(){
  const listed = state.posted.length
    ? '<div class="card mb-md"><h2>Problems you have posted</h2>' +
      '<div class="sub">' + state.posted.length + ' live · every startup can see all of them</div><ul class="plain">' +
      state.posted.map(p => '<li><span class="lead"><b>' + esc(p.title) + '</b><br>' +
        '<span class="note-sm">' + p.id + ' · ' + money(p.budget) + ' · closes ' + esc(p.deadline) + '</span>' +
        ((p.needs || []).length ? '<div class="caplist">' + p.needs.map(n =>
          '<span class="tag">' + n + '</span>').join("") + '</div>' : "") + '</span>' +
        '<span class="badge b-ok"><i class="dot"></i>Live</span></li>').join("") + '</ul></div>'
    : "";

  return phead("Post a problem",
    "Say what result you need. Leave how to get there open.",
    "Step 1 of 4 · Post a problem") + listed +
    '<div class="card"><h2>New challenge</h2><div class="sub">Five fields, all in plain words. Posting another does not remove the ones already up.</div>' +
    field("What is the problem?", "",
      '<input id="f-title" type="text" value="Cut waterlogging complaints in the eastern wards">') +
    field("What result would count as solved?", "Give a number. This becomes the pilot target.",
      '<textarea id="f-outcome">Clear standing water in the 9 eastern wards within 90 minutes of a complaint, down from the present four hours.</textarea>') +
    '<div class="f2">' +
      field("Most you will pay (₹ lakh)", "Published up front.", '<input id="f-budget" type="number" value="150" min="1">') +
      field("Applications close on", "", '<input id="f-deadline" type="text" value="10 Oct 2026">') +
    '</div>' +
    '<div class="f2">' +
      field("Who will use it?", "", '<input id="f-users" type="text" value="Ward complaint cell, 9 wards">') +
      field("Which sector?", "", '<select id="f-sector">' + SECTORS.map(x =>
        '<option' + (x === "Urban services" ? " selected" : "") + '>' + x + '</option>').join("") + '</select>') +
    '</div>' +
    '<div class="note mb-md"><b>You do not have to describe the technology.</b> Setu reads the requirement out of what you wrote above and matches startups against it — you will see what it read once the challenge is live.</div>' +
    '<div class="note mb-md"><b>Not asked for:</b> minimum turnover · three years of past supply · earnest money deposit.</div>' +
    '<button class="btn pri big" type="button" id="publish">Publish this challenge</button></div>';
}

function o2(){
  const open = state.openProblem;
  if(open && open !== CHALLENGE.id){
    const c = findCh(open); const a = appFor(open);
    return phead("Applications · " + esc(c.title), null, "Step 2 of 4 · " + c.id) +
      '<button class="backlink" type="button" data-open="">← All your problems</button>' +
      (a ? '<div class="card"><h2>1 application</h2><div class="sub">Sent to the evaluator, not to you</div><ul class="plain">' +
            '<li><span class="lead"><b>' + esc(a.name) + '</b><br><span class="note-sm">' + esc(a.pitch.slice(0,110)) + '…</span></span>' +
            '<span class="badge b-info"><i class="dot"></i>With evaluator</span></li></ul></div>'
         : '<div class="note warn"><b>No applications yet.</b> The window closes ' + esc(c.deadline) + '. Startups can see it on their browse screen now.</div>') +
      handoff("You never pick the winner. An independent evaluator scores every application and files a written reason.");
  }

  const rows = [CHALLENGE].concat(state.posted).map(c => {
    const isDemo = c.id === CHALLENGE.id;
    const n = isDemo ? CHALLENGE.apps + (appFor(c.id) ? 1 : 0) : (appFor(c.id) ? 1 : 0);
    return '<li><span class="lead"><b>' + esc(c.title) + '</b><br><span class="note-sm">' + c.id +
      ' · ' + n + ' application' + (n === 1 ? "" : "s") + '</span></span>' +
      '<span class="rightcol">' +
      (isDemo && state.chosen ? '<span class="badge b-ok"><i class="dot"></i>Decided</span>'
        : '<span class="badge b-info"><i class="dot"></i>With evaluator</span>') +
      '<button class="btn sm" type="button" data-open="' + c.id + '">Open</button></span></li>';
  }).join("");

  const decided = !!state.chosen;
  return phead("Applications received",
    "You can see who applied. An independent evaluator picks.",
    "Step 2 of 4 · " + (state.posted.length + 1) + " problems") +
    (decided
      ? '<div class="note ok mb-md"><b>' + chosenApplicant().name + ' was approved for the flooding pilot.</b>' +
        '<span class="quote">Reason filed by the evaluator: “' + esc(state.reason) + '”</span></div>'
      : '<div class="note warn mb-md"><b>With the evaluator.</b> Nothing needed from you until a startup is approved.</div>') +
    '<div class="card"><h2>Your problems</h2><div class="sub">Open one to see who applied to it</div>' +
    '<ul class="plain">' + rows + '</ul></div>' +
    (decided ? handoff("Track the pilot under <b>Review pilot progress</b>.")
             : handoff("Switch to <b>Oversight (Evaluator)</b> on the left to see the scores."));
}

function o3(){
  const a = chosenApplicant();
  const reported = state.ms.indexOf(2);
  const items = MS.map((m,i) => {
    const s = state.ms[i];
    const cls = s === 3 ? "paid" : s === 2 ? "rep" : s === 1 ? "act" : "";
    const label = s === 3 ? "Verified and paid" : s === 2 ? "Startup says it is done — needs your check"
                : s === 1 ? "In progress · " + m.plan : "Not started · " + m.plan;
    return '<li><span class="n ' + cls + '">' + (s === 3 ? "✓" : (i+1)) + '</span>' +
      '<div><b>' + m.t + '</b><span class="when">' + label + '</span>' +
      (s === 2 && m.hint ? '<span class="when">' + m.hint + ' Reading from the field: <b class="ink">84%</b></span>' : "") + '</div>' +
      '<div class="side"><span class="amt">' + money(m.amt) + '</span>' +
      (s === 2 ? '<button class="btn pri sm" type="button" id="verify" data-ms="' + i + '">Verify and release</button>' : "") + '</div></li>';
  }).join("");

  return phead("Review pilot progress",
    "The startup marks a step done. You check it and release the money.",
    "Step 3 of 4 · " + a.name + " · " + CHALLENGE.id) +
    '<div class="big3 mb-lg">' +
      stat("Released so far", money(paidSoFar()), "", "of " + money(180)) +
      stat("Accuracy in the field", "84%", "", "target 80% · <span class='up'>passing</span>") +
      stat("Water cleared in", "71", "min", "was 190 min before") +
    '</div>' +
    (reported >= 0
      ? '<div class="note warn mb-md"><b>Waiting on you.</b> ' + a.name + ' marked “' + MS[reported].t + '” done. Release ' + money(MS[reported].amt) + '.</div>'
      : state.ms.every(s => s === 3)
        ? '<div class="note ok mb-md"><b>All four steps verified.</b> You can now decide whether to scale.</div>'
        : '<div class="note mb-md"><b>Nothing needed right now.</b> The startup is on the next step.</div>') +
    '<div class="card"><h2>The four steps of this pilot</h2><div class="sub">Set by the evaluator before work began</div>' +
    '<ul class="ms">' + items + '</ul></div>' +
    (state.ms.every(s => s === 3) ? handoff("Go to <b>Decide to scale</b>.") : "");
}

function o4(){
  const a = chosenApplicant();
  const ready = state.ms.every(s => s === 3);
  if(state.extended && !state.scaled){
    return phead("Pilot extended by 90 days",
      "A pilot may be extended once. The clock is public, so an extension is a decision on the record rather than a way to let something drift.",
      "Step 4 of 4 · " + CHALLENGE.id) +
      '<div class="note acc mb-md"><b>New end date: 16 Jan 2027.</b> The startup keeps being paid against the same milestones; no new terms were negotiated.</div>' +
      '<div class="card"><h2>Why an extension is bounded</h2><ul class="plain">' +
        '<li><span class="badge b-ok"><i class="dot"></i>Once</span><span class="lead">One extension only. A second requires the oversight cell to sign it off.</span></li>' +
        '<li><span class="badge b-ok"><i class="dot"></i>Paid</span><span class="lead">The supplier is not asked to work unpaid through the extension.</span></li>' +
        '<li><span class="badge b-info"><i class="dot"></i>Then</span><span class="lead">At the end you must still record scale, extend-with-approval, or close with a reason.</span></li>' +
      '</ul><div class="row mt-md"><button class="btn pri" type="button" id="unextend">Decide now instead</button></div></div>';
  }
  if(state.scaled){
    return phead("Scaled to full deployment", "The pilot was the evidence. No new tender.",
      "Step 4 of 4 · contract C-2026-0412") +
      '<div class="note ok mb-md"><b>83 days from problem to signed contract.</b> The old route averaged 214.</div>' +
      '<div class="card"><h2>What happens now</h2><ul class="plain">' +
        '<li><span class="lead"><b>All 38 wards, 24 months, ' + money(a.price) + '</b><br><span class="note-sm">At the ceiling you published</span></span></li>' +
        '<li><span class="lead"><b>Listed as a proven solution</b><br><span class="note-sm">Other departments can buy it without a tender</span></span>' +
          '<span class="right"><button class="btn sm" type="button" data-goto="evaluator:e4">See the list</button></span></li>' +
        '<li><span class="lead"><b>Paid quarterly, against results</b><br><span class="note-sm">Under 75% for two quarters ends it on 90 days’ notice</span></span></li>' +
      '</ul></div>';
  }
  return phead("Decide to scale", "The pilot hit every target. Nothing left to prove or negotiate.",
    "Step 4 of 4 · " + CHALLENGE.id) +
    '<div class="card mb-md"><h2>' + a.name + ' — full deployment</h2><ul class="plain">' +
      '<li><span class="lead">Scope</span><span class="right">All 38 wards, 24 months</span></li>' +
      '<li><span class="lead">Price</span><span class="right">' + money(a.price) + '</span></li>' +
      '<li><span class="lead">Why this price</span><span class="right">The ceiling you published</span></li>' +
      '<li><span class="lead">Evidence it works</span><span class="right">84% against an 80% target</span></li>' +
      '<li><span class="lead">If it stops working</span><span class="right">90 days’ notice</span></li>' +
    '</ul></div>' +
    (ready
      ? '<div class="card"><div class="row"><div class="grow"><b>Finance has already agreed.</b>' +
        '<p class="hint-sm">Concurrence received 03 Sep 2026. Yours is the last signature.</p></div>' +
        '<button class="btn pri big" type="button" id="scale">Approve full deployment</button>' +
        '<button class="btn" type="button" id="extend">Extend the pilot instead</button></div></div>'
      : '<div class="note warn"><b>Not yet.</b> Verify all four steps first, under <b>Review pilot progress</b>.</div>');
}

/* =========================================================
   STARTUP
   ========================================================= */

function s0(){
  const p = state.profile;
  return phead("My capability profile",
    "This is what every match score is worked out from. Change it and the scores on the next screen change with it.",
    "Setup · filed once, reused for every challenge") +
    '<div class="card mb-md"><h2>What we can actually do</h2>' +
    '<div class="sub">Tick honestly — overstating it wins you a pilot you cannot deliver</div>' +
    capPicker(p.caps, "data-mycap") + '</div>' +
    '<div class="split">' +
    '<div class="card"><h2>Where we work</h2><div class="sub">Sectors we have delivered in</div>' +
    '<div class="capgrid">' + SECTORS.map(s =>
      '<button class="chk" type="button" data-mysector="' + esc(s) + '" aria-pressed="' + p.sectors.includes(s) + '">' +
      '<span class="box">' + (p.sectors.includes(s) ? "✓" : "") + '</span><span>' + s + '</span></button>').join("") + '</div></div>' +
    '<div class="card"><h2>Size and price</h2><div class="sub">Used to judge whether a ceiling is workable for you</div>' +
    '<ul class="plain">' +
      '<li><span class="lead">Team size</span><span class="right">' + p.team + ' people</span></li>' +
      '<li><span class="lead">We normally quote</span><span class="right">' + money(p.priceMin) + ' – ' + money(p.priceMax) + '</span></li>' +
      '<li><span class="lead">Past public pilots</span><span class="right">' + p.pastPilots + '</span></li>' +
    '</ul>' +
    '<div class="note mt-md">None of this is a barrier to applying. It only decides what gets recommended to you.</div></div></div>' +
    handoff("Open <b>Browse open challenges</b> — every card now shows a score with the reasons behind it.");
}

function s1(){
  if(state.detail) return sDetail();
  const list = allOpen();
  const cards = list.map(c => {
    const m = matchFor(c);
    const mine = appFor(c.id);
    const isNew = state.posted.some(p => p.id === c.id);
    return '<div class="chal' + (isNew ? " new" : "") + '"><div class="hd">' +
      '<span class="mono meta-sm">' + c.id + ' · ' + c.dept + (isNew ? ' · posted today' : '') + '</span>' +
      '<span class="badge ' + matchClass(m.score) + '">Fits you ' + m.score + '%</span></div>' +
      '<h3>' + esc(c.title) + '</h3>' +
      '<p class="out"><b>What they want:</b> ' + esc(c.outcome) + '</p>' +
      '<p class="note-sm">' + (m.have.length ? '<b>Because:</b> ' + m.have.slice(0,2).join(", ") : '<b>Little overlap</b> with what you do') +
        (m.gaps.length ? ' · <b>Gap:</b> ' + m.gaps.slice(0,2).join(", ") : '') + '</p>' +
      '<div class="foot"><span>Most they will pay <b class="mono ink">' + money(c.ceiling) + '</b> · closes ' + esc(c.closes) + '</span>' +
      (mine ? '<span class="badge b-info"><i class="dot"></i>Applied</span>' : '') +
      '<button class="btn' + (m.score >= 75 && !mine ? " pri" : "") + '" type="button" data-detail="' + c.id + '">' +
      (mine ? "View" : "Read it in full") + '</button></div></div>';
  }).join("");

  return phead("Open challenges",
    "Ranked against your profile. Every score opens up to show its reasons — and you can apply whatever it says.",
    "Step 1 of 4 · " + list.length + " open") +
    '<div class="stack sm">' + cards + '</div>' +
    '<div class="spacer"></div>' +
    '<div class="note"><b>Applying costs nothing.</b> No fee, no deposit, no turnover history. Your profile is filed once and reused.</div>';
}

function sDetail(){
  const c = findCh(state.detail);
  if(!c) { state.detail = null; return s1(); }
  const m = matchFor(c);
  const mine = appFor(c.id);
  return '<button class="backlink" type="button" data-detail="">← All open challenges</button>' +
    phead(esc(c.title), esc(c.outcome), c.id + " · " + c.dept) +
    '<div class="card mb-md"><h2>The facts</h2><dl class="deftable">' +
      '<dt>Most they will pay</dt><dd class="mono">' + money(c.ceiling) + '</dd>' +
      '<dt>Applications close</dt><dd>' + esc(c.closes) + '</dd>' +
      '<dt>Who will use it</dt><dd>' + esc(c.users || "—") + '</dd>' +
      '<dt>Sector</dt><dd>' + c.sector + '</dd>' +
      '<dt>Pilot length</dt><dd>' + esc(c.pilotWeeks || "Set by the evaluator on approval") + '</dd>' +
      '<dt>What it needs</dt><dd><div class="caplist">' + (c.needs||[]).map(n =>
        '<span class="tag">' + n + (state.profile.caps.includes(n) ? " ✓" : "") + '</span>').join("") + '</div></dd>' +
    '</dl></div>' +
    '<h2 class="mb-md">Will this suit us?</h2>' + matchPanel(c, m) +
    '<div class="card mt-md"><h2>How you would be scored</h2>' +
    '<div class="sub">Published with the challenge, the same for every applicant</div>' +
    '<ul class="plain">' +
      '<li><span class="lead">Does the idea solve the stated problem</span><span class="right">40</span></li>' +
      '<li><span class="lead">Can you do it in 90 days</span><span class="right">30</span></li>' +
      '<li><span class="lead">Price against the published ceiling</span><span class="right">20</span></li>' +
      '<li><span class="lead">Size of the improvement</span><span class="right">10</span></li>' +
    '</ul></div>' +
    '<div class="card mt-md"><div class="row">' +
    (mine ? '<div class="grow"><b>You have applied to this one.</b><p class="hint-sm">Filed ' + esc(mine.when) + ' · with the evaluator</p></div>' +
            '<button class="btn" type="button" data-goto="startup:s2">See my applications</button>'
          : '<div class="grow"><b>' + m.verdict + '.</b><p class="hint-sm">A low score never blocks you — it is advice, not a gate.</p></div>' +
            '<button class="btn pri big" type="button" data-apply="' + c.id + '">Apply to this challenge</button>') +
    '</div></div>';
}

function s2(){
  /* Applying to a specific challenge. */
  if(state.applyFor){
    const c = findCh(state.applyFor);
    const m = matchFor(c);
    return '<button class="backlink" type="button" data-apply="">← My applications</button>' +
      phead("Apply", "Your idea and four fields. No turnover history, no deposit.",
        "Step 2 of 4 · " + c.id + " · " + esc(c.title)) +
      (m.gaps.length ? '<div class="note warn mb-md"><b>Worth knowing before you write.</b> This problem also needs ' +
        m.gaps.join(" and ") + ', which is not on your profile. You can still apply — say how you would cover it.</div>' : "") +
      '<div class="card"><h2>Your application</h2>' +
      '<div class="sub">Registration, tax and bank details come from your profile</div>' +
      field("How would you solve it?", "The approach, not a brochure.",
        '<textarea id="a-pitch">Reuse the drain sensor network we already run, add a complaint-driven dispatch queue so a crew is routed the moment a reading crosses the threshold.</textarea>') +
      '<div class="f2">' +
        field("Your price (₹ lakh)", "At or under " + money(c.ceiling) + ".", '<input id="a-price" type="number" value="' + Math.min(c.ceiling, 145) + '">') +
        field("You can start in", "", '<select id="a-start"><option>2 weeks</option><option selected>3 weeks</option><option>6 weeks</option></select>') +
      '</div>' +
      '<div class="note mb-md"><b>Not asked for, not scored:</b> turnover · past supply · deposit · bank guarantee.</div>' +
      '<button class="btn pri big" type="button" id="submitapp">Submit application</button></div>';
  }

  /* Otherwise: everything filed so far. */
  const mine = state.applications;
  const live = pilotLive();
  const rows = mine.map(a => {
    const c = findCh(a.chId);
    const isPilot = live && a.chId === CHALLENGE.id;
    return '<div class="appitem' + (isPilot ? " live" : "") + '"><div>' +
      '<h3>' + esc(c ? c.title : a.chId) + '</h3>' +
      '<div class="when">' + a.chId + ' · quoted ' + money(a.price) + ' · filed ' + esc(a.when) + '</div></div>' +
      '<span class="rightcol">' +
      (isPilot ? '<span class="badge b-acc"><i class="dot"></i>Pilot running</span>'
       : live ? '<span class="badge b-mute"><i class="dot"></i>Queued</span>'
              : '<span class="badge b-info"><i class="dot"></i>Being scored</span>') +
      '<button class="btn sm" type="button" data-detail="' + a.chId + '">View challenge</button></span></div>';
  }).join("");

  const demoApp = live
    ? '<div class="appitem live"><div><h3>' + esc(CHALLENGE.title) + '</h3>' +
      '<div class="when">' + CHALLENGE.id + ' · quoted ' + money(172) + ' · approved</div></div>' +
      '<span class="rightcol"><span class="badge b-acc"><i class="dot"></i>Pilot running</span>' +
      '<button class="btn sm" type="button" data-view="s3">Open pilot</button></span></div>'
    : "";

  return phead("My applications",
    "Apply to as many challenges as you like. Only one can be an active pilot at a time.",
    "Step 2 of 4 · " + (mine.length + (live ? 1 : 0)) + " filed") +
    (live ? '<div class="note acc mb-md"><b>One pilot at a time.</b> The flooding pilot is running, so anything else you have applied to stays queued until it finishes. That is the rule, not a bug — a pilot needs your whole team.</div>' : "") +
    (mine.length || live
      ? '<div class="stack sm">' + demoApp + rows + '</div>'
      : '<div class="note"><b>Nothing filed yet.</b> Open <b>Browse open challenges</b>, read one in full, and apply from there.</div>') +
    '<div class="spacer"></div>' +
    '<div class="note"><b>If a department goes quiet, you do not chase it.</b> Past 60 days an application escalates on its own and the officer files a written reason you can read.</div>';
}

function s3(){
  if(!state.terms){
    return phead("Run the pilot", "Appears once an evaluator approves you.", "Step 3 of 4") +
      '<div class="note warn"><b>Waiting on a decision.</b> You will get your score and the reason either way.</div>';
  }
  const t = state.terms;
  return phead("Run the pilot", "Paid work with real users, not a free trial.",
    "Step 3 of 4 · " + CHALLENGE.id + " · " + money(180) + " pilot") +
    '<div class="big3 mb-lg">' +
      stat("Received so far", money(paidSoFar()), "", "of " + money(180)) +
      stat("Time to get paid", "4", "days", "they promised 7") +
      stat("Pilot length", t.weeks, "", "ends " + t.ends) +
    '</div>' +
    '<div class="split">' +
    '<div class="card"><h2>What counts as success</h2><div class="sub">Agreed before work started</div><ul class="plain">' +
      '<li><span class="lead">Warn ahead by</span><span class="right">' + esc(t.lead) + '</span></li>' +
      '<li><span class="lead">Hit rate needed</span><span class="right">' + esc(t.accuracy) + '</span></li>' +
      '<li><span class="lead">Wards covered</span><span class="right">12</span></li>' +
      '<li><span class="lead">Where you stand</span><span class="right ok-text">84% — passing</span></li>' +
    '</ul></div>' +
    '<div class="card"><h2>Terms that made this worth bidding for</h2><ul class="plain">' +
      '<li><span class="badge b-ok">✓</span><span class="lead">You keep your technology. They get a licence.</span></li>' +
      '<li><span class="badge b-ok">✓</span><span class="lead">Not exclusive. Sell it anywhere else.</span></li>' +
      '<li><span class="badge b-ok">✓</span><span class="lead">No bank guarantee at pilot stage.</span></li>' +
      '<li><span class="badge b-info">i</span><span class="lead">Hit the targets and it becomes a full contract.</span></li>' +
    '</ul></div></div>' +
    handoff("Mark each step done under <b>Update milestones</b> to get paid.");
}

function s4(){
  if(!state.terms){
    return phead("Update milestones", "Appears once a pilot is approved.", "Step 4 of 4") +
      '<div class="note warn"><b>No pilot yet.</b></div>';
  }
  const items = MS.map((m,i) => {
    const s = state.ms[i];
    const cls = s === 3 ? "paid" : s === 2 ? "rep" : s === 1 ? "act" : "";
    const label = s === 3 ? "Verified — " + money(m.amt) + " received"
                : s === 2 ? "Reported. Waiting for the officer to verify."
                : s === 1 ? "In progress · due " + m.plan : "Not started · " + m.plan;
    let action = s === 1 ? '<button class="btn pri sm" type="button" id="report" data-report="' + i + '">Mark results ready</button>'
      : s === 2 ? '<span class="badge b-warn"><i class="dot"></i>With the officer</span>'
      : s === 3 ? '<span class="badge b-ok"><i class="dot"></i>Paid</span>'
                : '<span class="badge b-mute">Locked</span>';
    return '<li><span class="n ' + cls + '">' + (s === 3 ? "✓" : (i+1)) + '</span>' +
      '<div><b>' + m.t + '</b><span class="when">' + label + '</span></div>' +
      '<div class="side"><span class="amt">' + money(m.amt) + '</span>' + action + '</div></li>';
  }).join("");
  const active = state.ms.indexOf(1);
  return phead("Update milestones", "Mark a step done. The officer verifies and pays, usually in four days.",
    "Step 4 of 4 · " + CHALLENGE.id) +
    (active >= 0
      ? '<div class="note acc mb-md"><b>Ready?</b> Mark “' + MS[active].t + '” done to release ' + money(MS[active].amt) + '.</div>'
      : state.ms.includes(2)
        ? '<div class="note warn mb-md"><b>With the officer.</b> Nothing needed from you.</div>'
        : '<div class="note ok mb-md"><b>All four steps done and paid.</b> The department is deciding on full rollout.</div>') +
    '<div class="card"><h2>Your milestones</h2><div class="sub">Each step releases a fixed part of the money</div>' +
    '<ul class="ms">' + items + '</ul></div>';
}

/* =========================================================
   OVERSIGHT (EVALUATOR)
   ========================================================= */

function e1(){
  const extra = state.applications.length
    ? '<div class="card mb-md"><h2>New applications to other problems</h2>' +
      '<div class="sub">Queued for scoring against their own published rubric</div><ul class="plain">' +
      state.applications.map(a => { const c = findCh(a.chId);
        return '<li><span class="lead"><b>' + esc(a.name) + '</b> → ' + esc(c ? c.title : a.chId) +
          '<br><span class="note-sm">' + a.chId + ' · quoted ' + money(a.price) + ' · filed ' + esc(a.when) + '</span></span>' +
          '<span class="badge b-info"><i class="dot"></i>Queued</span></li>'; }).join("") + '</ul></div>'
    : "";

  const list = DB.applicants.map(a =>
    '<div class="applicant"><div><h3>' + a.name + '</h3>' +
    '<div class="meta">' + a.city + ' · ' + a.team + ' people · quoted ' + money(a.price) + (a.first ? ' · first public contract' : '') + '</div>' +
    '<p class="desc">' + esc(a.desc) + '</p>' +
    '<div class="facts">' + a.facts.map(f => '<span class="tag">' + f + '</span>').join("") + '</div></div>' +
    '<div class="sidecol"><div><div class="sc">' + a.score + '</div><div class="sclab">out of 100</div></div>' +
    '<div class="w-full">' + bar(a.score, a.score >= 80 ? "ok" : a.score >= 65 ? "acc" : "") + '</div></div></div>').join("");

  return phead("Review applications",
    "Only you see the scores. The buying department cannot.",
    "Step 1 of 4 · " + CHALLENGE.id + " · " + CHALLENGE.apps + " applications") + extra +
    '<div class="note mb-md"><b>Scoring, published with the challenge:</b> solves the problem (40) · doable in 90 days (30) · price against ceiling (20) · size of improvement (10).</div>' +
    '<div class="stack sm">' + list + '</div>' +
    handoff("Record the decision under <b>Approve or reject</b>.");
}

function e2(){
  if(state.rejectedAll){
    return phead("All applications rejected — challenge reopened",
      "Nothing was quietly shelved. Every applicant was told, and the reason is on the public record.",
      "Step 2 of 4 · " + CHALLENGE.id) +
      '<div class="note warn mb-md"><b>Reopened for a fresh window.</b><span class="quote">“' + esc(state.rejectNote) + '”</span></div>' +
      '<div class="card"><h2>What this triggers</h2><ul class="plain">' +
        '<li><span class="badge b-ok"><i class="dot"></i>Done</span><span class="lead">All six applicants notified, each with their own score breakdown.</span></li>' +
        '<li><span class="badge b-ok"><i class="dot"></i>Done</span><span class="lead">The reason is published, and any applicant may contest it for 15 days.</span></li>' +
        '<li><span class="badge b-info"><i class="dot"></i>Next</span><span class="lead">The department must revise the problem or the ceiling before reopening — a re-run with identical terms is blocked.</span></li>' +
      '</ul><div class="row mt-md"><button class="btn" type="button" id="unreject">Undo — go back to the decision</button></div></div>';
  }
  if(state.chosen){
    const a = chosenApplicant();
    return phead("Decision recorded", "Every applicant got their score and the reason. Contestable for 15 days.",
      "Step 2 of 4 · " + CHALLENGE.id) +
      '<div class="note ok mb-md"><b>' + a.name + ' approved for the pilot.</b><span class="quote">“' + esc(state.reason) + '”</span></div>' +
      (state.rejectNote ? '<div class="note mb-md"><b>Sent to everyone not selected:</b> “' + esc(state.rejectNote) + '”</div>' : "") +
      '<div class="card"><h2>Who was told what</h2><ul class="plain">' +
      DB.applicants.map(a2 => '<li><span class="lead"><b>' + a2.name + '</b><br><span class="note-sm">Score ' + a2.score + ' of 100 · sent today</span></span>' +
        (a2.id === state.chosen ? '<span class="badge b-ok"><i class="dot"></i>Approved</span>' : '<span class="badge b-mute">Not selected</span>') + '</li>').join("") +
      '</ul><div class="row mt-md"><button class="btn" type="button" id="undo">Reopen the decision</button>' +
      '<button class="btn pri" type="button" data-goto="evaluator:e3">Set the pilot terms</button></div></div>';
  }
  const opts = DB.applicants.map(a => '<option value="' + a.id + '"' + (a.id === "SU-2417" ? " selected" : "") + '>' +
    a.name + ' — score ' + a.score + ', ' + money(a.price) + '</option>').join("");
  return phead("Approve or reject", "One startup gets the pilot. Your reason goes to everyone, on the record.",
    "Step 2 of 4 · " + CHALLENGE.id) +
    '<div class="card"><h2>Record the decision</h2><div class="sub">A reason is required</div>' +
    field("Which startup gets the pilot?", "", '<select id="d-pick">' + opts + '</select>') +
    field("Why this one?", "Sent to every applicant and put on the record.",
      '<textarea id="d-reason">Highest score on solving the stated problem, and the only proposal that keeps working on a 2G signal — which is the condition in the older wards where flooding is worst. Priced under the ceiling and can start in three weeks.</textarea>') +
    field("What to tell everyone else", "Their score breakdown is attached automatically.",
      '<textarea id="d-reject">Not selected this time. Two pilot slots were funded and the ranking was decided on field-readiness under weak network conditions. Your full score breakdown is attached, and you may contest this within 15 days.</textarea>') +
    '<div class="row"><button class="btn pri big" type="button" id="approve">Approve and notify everyone</button>' +
    '<button class="btn danger" type="button" id="rejectall">Reject all and re-run</button></div>' +
    '<p class="hint-sm">Rejecting all reopens the challenge. It needs the same written reason — no silent cancellations.</p></div>' +
    handoff("Next you set what success means for the pilot.");
}

function e3(){
  if(!state.chosen){
    return phead("Set pilot terms", "Set once a startup is approved.", "Step 3 of 4") +
      '<div class="note warn"><b>No decision yet.</b> Approve a startup first.</div>';
  }
  if(state.terms){
    const t = state.terms;
    return phead("Pilot terms set", "Both sides now know what has to be true at the end.",
      "Step 3 of 4 · " + chosenApplicant().name) +
      '<div class="note ok mb-md"><b>Sent to both sides.</b> Neither can change it alone.</div>' +
      '<div class="card"><h2>What success means</h2><ul class="plain">' +
        '<li><span class="lead">Pilot runs for</span><span class="right">' + esc(t.weeks) + '</span></li>' +
        '<li><span class="lead">Warn ahead by</span><span class="right">' + esc(t.lead) + '</span></li>' +
        '<li><span class="lead">Hit rate needed</span><span class="right">' + esc(t.accuracy) + '</span></li>' +
        '<li><span class="lead">Payment</span><span class="right">' + esc(t.split) + '</span></li>' +
        '<li><span class="lead">Paid within</span><span class="right">7 days of verification</span></li>' +
      '</ul><div class="row mt-md"><button class="btn" type="button" id="retterms">Change the terms</button>' +
      '<button class="btn pri" type="button" data-goto="startup:s4">See it as the startup does</button></div></div>' +
      handoff("The startup now works through the four steps.");
  }
  return phead("Set pilot terms", "Define success before work starts, so nobody moves the goalposts.",
    "Step 3 of 4 · " + chosenApplicant().name) +
    '<div class="card"><h2>Terms of the pilot</h2><div class="sub">Both sides sign this</div>' +
    '<div class="f2">' +
      field("How long does the pilot run?", "", '<select id="t-weeks"><option>12 weeks</option><option selected>14 weeks</option><option>20 weeks</option></select>') +
      field("How much warning must it give?", "", '<select id="t-lead"><option>30 minutes</option><option selected>45 minutes</option><option>60 minutes</option></select>') +
    '</div><div class="f2">' +
      field("Hit rate to pass", "", '<select id="t-acc"><option>70% of events</option><option selected>80% of events</option><option>90% of events</option></select>') +
      field("How the money is released", "", '<select id="t-split"><option selected>20 / 30 / 30 / 20 across four steps</option><option>25 / 25 / 25 / 25 across four steps</option><option>Half up front, half at the end</option></select>') +
    '</div>' +
    field("The four steps to report against", "", '<div class="readonly">' + MS.map((m,i) => (i+1) + ". " + m.t + " — " + money(m.amt)).join("<br>") + '</div>') +
    '<button class="btn pri big" type="button" id="setterms">Set these terms</button></div>';
}

function e4(){
  const reg = DB.registry.concat(state.scaled
    ? [{sol:"Ward flooding early warning", by:chosenApplicant().name, origin:"Urban Affairs",
        proof:"84% of events warned 45 minutes ahead, clearance down from 190 to 71 minutes", adopters:1, price:61}] : []);
  return phead("Fairness checks", "One question, answered in public: was this rigged?",
    "Step 4 of 4 · this financial year") +
    '<div class="card mb-md"><h2>Was this decision clean?</h2><div class="sub">Run automatically on ' + CHALLENGE.id + '</div><ul class="plain">' +
      '<li><span class="badge b-ok"><i class="dot"></i>Pass</span><span class="lead">Ceiling price published <b>before</b> applications opened.</span></li>' +
      '<li><span class="badge b-ok"><i class="dot"></i>Pass</span><span class="lead">Scoring rubric published up front and never changed.</span></li>' +
      '<li><span class="badge b-ok"><i class="dot"></i>Pass</span><span class="lead">Buying department saw no scores before the decision.</span></li>' +
      '<li><span class="badge b-ok"><i class="dot"></i>Pass</span><span class="lead">Conflict-of-interest declarations on file.</span></li>' +
      '<li><span class="badge ' + (state.chosen ? "b-ok" : "b-mute") + '">' + (state.chosen ? '<i class="dot"></i>Pass' : "Pending") + '</span><span class="lead">Written reason sent to every applicant.</span></li>' +
      '<li><span class="badge b-ok"><i class="dot"></i>Pass</span><span class="lead">No requirement only one supplier could meet.</span></li>' +
    '</ul></div>' +
    '<div class="split mb-md">' +
    '<div class="card"><h2>Is the money going to the same few?</h2><div class="sub">Checked every quarter</div><div class="stack sm">' +
      '<div><div class="row between"><span>Top 3 suppliers’ share</span><b class="mono">31%</b></div>' + bar(31,"ok") + '</div>' +
      '<div><div class="row between"><span>Winners on their first public contract</span><b class="mono">48%</b></div>' + bar(48,"ok") + '</div>' +
      '<div><div class="row between"><span>Winners from outside the big cities</span><b class="mono">37%</b></div>' + bar(37,"acc") + '</div>' +
    '</div></div>' +
    '<div class="card"><h2>Departments that are slow</h2><div class="sub">Published time to a decision</div><ul class="plain">' +
      '<li><span class="lead">Public Grievances</span><span class="right">58 days</span></li>' +
      '<li><span class="lead">Agriculture</span><span class="right">71 days</span></li>' +
      '<li><span class="lead">Urban Affairs</span><span class="right">83 days</span></li>' +
      '<li><span class="lead">Health <span class="badge b-crit ml-xs">Flagged</span></span><span class="right">118 days</span></li>' +
    '</ul></div></div>' +
    '<div class="card"><h2>Proven solutions any department can buy</h2>' +
    '<div class="sub">Listed only after a pilot met its targets. No re-tendering.</div><ul class="plain">' +
    reg.map(r => '<li><span class="lead"><b>' + esc(r.sol) + '</b> — ' + r.by + '<br><span class="note-sm">' +
      esc(r.proof) + ' · proven in ' + r.origin + '</span></span><span class="right">' + money(r.price) + ' · ' + r.adopters + ' using</span></li>').join("") + '</ul>' +
    (state.scaled ? '<div class="note ok mt-md"><b>Just added.</b> Any department can now buy it without tendering.</div>' : "") + '</div>';
}

/* =========================================================
   GUIDED TOUR
   ========================================================= */

const TOUR = [
  {role:"officer", view:"o1", who:"Department Officer", title:"Post the problem, not the product",
   text:"Plain words only — no technology, no specification. Setu reads the requirement out of it and matches startups against that.", focus:"#publish"},
  {role:"startup", view:"s0", who:"Startup User", title:"The startup describes what it can do",
   text:"One profile, filed once. Every match score on the next screen is worked out from these ticks."},
  {role:"startup", view:"s1", who:"Startup User", title:"Which problem suits me?",
   text:"Every challenge is scored against that profile, with the reason and the gap on the card. Open one to see the full working."},
  {role:"startup", view:"s2", who:"Startup User", title:"Apply to as many as you like",
   text:"A low score never blocks an application — it is advice, not a gate. Only one can become an active pilot at a time."},
  {role:"evaluator", view:"e1", who:"Oversight (Evaluator)", title:"An independent evaluator reads them",
   text:"Not the department that wrote the problem."},
  {role:"evaluator", view:"e2", who:"Oversight (Evaluator)", title:"Approve — with a reason on the record",
   text:"The reason goes to every applicant and stays public.", focus:"#approve"},
  {role:"evaluator", view:"e3", who:"Oversight (Evaluator)", title:"Say what success means, before work starts",
   text:"Duration, warning time, hit rate, payment. No moving the goalposts.", focus:"#setterms"},
  {role:"startup", view:"s4", who:"Startup User", title:"The startup reports its own progress",
   text:"Mark the step done and it goes to the officer, with its payment.", focus:"#report"},
  {role:"officer", view:"o3", who:"Department Officer", title:"The officer verifies and pays",
   text:"Money released against a checked result, within days.", focus:"#verify"},
  {role:"officer", view:"o4", who:"Department Officer", title:"A pilot that worked becomes the contract",
   text:"At the price published up front. No fresh tender.", focus:"#scale"},
  {role:"evaluator", view:"e4", who:"Oversight (Evaluator)", title:"One pilot, many orders",
   text:"It joins the proven list. Other departments buy it without tendering."}
];

function renderTour(){
  const barEl = document.getElementById("tourbar");
  if(state.tour < 0){ barEl.hidden = true; return; }
  const s = TOUR[state.tour];
  barEl.hidden = false;
  document.getElementById("tourno").textContent = "Guided demo · step " + (state.tour+1) + " of " + TOUR.length;
  document.getElementById("tourdots").innerHTML = TOUR.map((_,i) => '<i class="' + (i <= state.tour ? "on" : "") + '"></i>').join("");
  document.getElementById("tourwho").textContent = s.who;
  document.getElementById("tourtitle").textContent = s.title;
  document.getElementById("tourtext").textContent = s.text;
  document.getElementById("tourback").disabled = state.tour === 0;
  document.getElementById("tournext").textContent = state.tour === TOUR.length - 1 ? "Finish" : "Next";
  if(s.focus){ const el = document.querySelector(s.focus); if(el) el.classList.add("focus-ring"); }
}
function gotoTour(i){
  if(i < 0 || i >= TOUR.length){ state.tour = -1; render(); return; }
  state.tour = i; state.landing = false; state.role = TOUR[i].role; state.view = TOUR[i].view;
  state.detail = null; state.applyFor = null;
  render();
}

/* =========================================================
   ROUTER
   ========================================================= */

const VIEWS = {o1:o1, o2:o2, o3:o3, o4:o4, s0:s0, s1:s1, s2:s2, s3:s3, s4:s4, e1:e1, e2:e2, e3:e3, e4:e4};

function doneSteps(role){
  if(role === "officer") return {o1:state.posted.length>0, o2:!!state.chosen, o3:state.ms.every(s=>s===3), o4:state.scaled};
  if(role === "startup") return {s0:true, s1:state.applications.length>0, s2:state.applications.length>0, s3:!!state.terms, s4:state.ms.every(s=>s===3)};
  return {e1:!!state.chosen, e2:!!state.chosen, e3:!!state.terms, e4:state.scaled};
}
function pending(role){
  const p = {};
  if(role === "officer" && state.ms.includes(2)) p.o3 = "1";
  if(role === "officer" && !state.chosen && state.applications.length) p.o2 = "new";
  if(role === "startup" && state.terms && state.ms.includes(1)) p.s4 = "1";
  if(role === "evaluator" && !state.chosen) p.e2 = "1";
  if(role === "evaluator" && state.chosen && !state.terms) p.e3 = "1";
  return p;
}

function render(){
  document.body.classList.toggle("landing", state.landing);
  if(state.landing){
    document.getElementById("view").innerHTML = landing();
    document.getElementById("tourbar").hidden = true;
    window.scrollTo({top:0, behavior:"instant"});
    return;
  }
  const r = ROLES[state.role];
  if(!r.nav.some(n => n.id === state.view)) state.view = r.nav[0].id;
  const done = doneSteps(state.role), pend = pending(state.role);

  document.getElementById("roles").innerHTML = Object.entries(ROLES).map(([k,v]) =>
    '<button class="roletab" type="button" data-role="' + k + '" aria-pressed="' + (state.role === k) + '">' +
    '<span class="ic">' + v.ic + '</span><span><em>' + v.who + '</em><small>' + v.sub + '</small></span></button>').join("");

  document.getElementById("navlab").textContent = r.lab;
  document.getElementById("nav").innerHTML = r.nav.map(n =>
    '<button type="button" data-view="' + n.id + '"' + (state.view === n.id ? ' aria-current="page"' : "") + '>' +
    '<span class="sn' + (done[n.id] && state.view !== n.id ? " done" : "") + '">' +
      (done[n.id] && state.view !== n.id ? "✓" : (n.n || "·")) + '</span>' +
    '<span>' + n.t + '</span>' +
    (pend[n.id] ? '<span class="pill">' + pend[n.id] + '</span>' : '<span></span>') + '</button>').join("");

  const item = r.nav.find(n => n.id === state.view);
  document.getElementById("crumb").innerHTML = r.who + ' <span class="dim">/</span> <b>' + item.t + '</b>' +
    '<span class="spacer-fill"></span><span>Prototype</span>';

  const banner = (state.tour < 0 && !state.bannerOff && state.view === r.nav[0].id)
    ? '<div class="banner"><div class="grow"><b>New here?</b>' +
      '<p>Eleven steps across all three roles, one case end to end.</p></div>' +
      '<button class="btn pri" type="button" id="bannerstart">Start guided demo</button>' +
      '<button class="btn ghost" type="button" id="bannerhide">No thanks</button></div>'
    : "";

  /* The step strip scrolls sideways on a phone; keep the active step in view. */
  const cur = document.querySelector('#nav button[aria-current="page"]');
  if(cur && cur.scrollIntoView) cur.scrollIntoView({block:"nearest", inline:"nearest"});

  document.getElementById("view").innerHTML = banner + VIEWS[state.view]();
  applyBars(document.body);
  renderTour();
  window.scrollTo({top:0, behavior:"instant"});
}

document.addEventListener("click", e => {
  const t = e.target;

  const role = t.closest("[data-role]");
  if(role){ state.role = role.dataset.role; state.view = ROLES[state.role].nav[0].id;
            state.detail = null; state.applyFor = null; state.openProblem = null; return render(); }

  const v = t.closest("[data-view]");
  if(v){ state.view = v.dataset.view; state.detail = null; state.applyFor = null; return render(); }

  const g = t.closest("[data-goto]");
  if(g){ const [rr,vv] = g.dataset.goto.split(":"); state.role = rr; state.view = vv;
         state.detail = null; state.applyFor = null; return render(); }

  /* capability toggles (startup profile only) */
  const mycap = t.closest("[data-mycap]");
  if(mycap){
    const c = mycap.dataset.mycap;
    const p = state.profile;
    p.caps = p.caps.includes(c) ? p.caps.filter(x => x !== c) : p.caps.concat([c]);
    return render();
  }
  const mysec = t.closest("[data-mysector]");
  if(mysec){
    const c = mysec.dataset.mysector;
    const p = state.profile;
    p.sectors = p.sectors.includes(c) ? p.sectors.filter(x => x !== c) : p.sectors.concat([c]);
    return render();
  }

  /* officer */
  if(t.id === "publish"){
    const n = state.posted.length + 1;
    state.posted.unshift({
      id: "UA-2026-0" + (40 + n),
      dept: "Urban Affairs",
      sector: val("f-sector") || "Urban services",
      title: val("f-title") || "Untitled problem",
      outcome: val("f-outcome") || "",
      budget: Number(val("f-budget")) || 150,
      ceiling: Number(val("f-budget")) || 150,
      deadline: val("f-deadline") || "10 Oct 2026",
      closes: val("f-deadline") || "10 Oct 2026",
      users: val("f-users") || "",
      needs: inferNeeds([val("f-title"), val("f-outcome"), val("f-users")].join(" "))
    });
    return render();
  }
  const openP = t.closest("[data-open]");
  if(openP){ state.openProblem = openP.dataset.open || null; return render(); }
  const ver = t.closest("[data-ms]");
  if(ver){ state.ms[Number(ver.dataset.ms)] = 3; const nx = state.ms.indexOf(0); if(nx >= 0) state.ms[nx] = 1; return render(); }
  if(t.id === "scale"){ state.scaled = true; state.extended = false; return render(); }
  if(t.id === "extend"){ state.extended = true; return render(); }
  if(t.id === "unextend"){ state.extended = false; return render(); }

  /* startup */
  const det = t.closest("[data-detail]");
  if(det){ state.detail = det.dataset.detail || null; state.view = state.detail ? "s1" : state.view; return render(); }
  const ap = t.closest("[data-apply]");
  if(ap){ state.applyFor = ap.dataset.apply || null; state.view = "s2"; state.detail = null; return render(); }
  if(t.id === "submitapp"){
    const id = state.applyFor;
    if(id && !appFor(id)){
      state.applications.unshift({
        chId:id, name:"Aarohi Systems",
        pitch: val("a-pitch") || "Reuse our existing sensor network.",
        price: Number(val("a-price")) || 145,
        start: val("a-start") || "3 weeks",
        when: "today"
      });
    }
    state.applyFor = null;
    return render();
  }
  const rep = t.closest("[data-report]");
  if(rep){ state.ms[Number(rep.dataset.report)] = 2; return render(); }

  /* evaluator */
  if(t.id === "approve"){
    const reason = val("d-reason");
    if(!reason){ const el = document.getElementById("d-reason"); if(el) el.focus(); return; }
    state.chosen = val("d-pick") || "SU-2417";
    state.reason = reason;
    state.rejectNote = val("d-reject");
    return render();
  }
  if(t.id === "undo"){ state.chosen = null; state.reason = ""; state.terms = null; return render(); }
  if(t.id === "rejectall"){
    const why = val("d-reject");
    if(!why){ const el = document.getElementById("d-reject"); if(el) el.focus(); return; }
    state.rejectedAll = true; state.rejectNote = why; state.chosen = null; state.terms = null;
    return render();
  }
  if(t.id === "unreject"){ state.rejectedAll = false; return render(); }
  if(t.id === "retterms"){ state.terms = null; return render(); }
  if(t.id === "setterms"){
    state.terms = {
      weeks: val("t-weeks") || "14 weeks",
      lead: val("t-lead") || "45 minutes",
      accuracy: val("t-acc") || "80% of events",
      split: val("t-split") || "20 / 30 / 30 / 20 across four steps",
      ends: "18 Oct 2026"
    };
    return render();
  }

  /* landing */
  if(t.id === "landdemo"){ state.landing = false; state.bannerOff = true; return gotoTour(0); }
  if(t.id === "landenter"){ state.landing = false; state.bannerOff = true; return render(); }

  /* chrome */
  if(t.id === "tourstart" || t.id === "bannerstart") return gotoTour(0);
  if(t.id === "bannerhide"){ state.bannerOff = true; return render(); }
  if(t.id === "tournext") return gotoTour(state.tour + 1);
  if(t.id === "tourback") return gotoTour(state.tour - 1);
  if(t.id === "tourexit"){ state.tour = -1; return render(); }

  if(t.id === "themebtn"){
    const root = document.documentElement;
    const dark = root.getAttribute("data-theme") === "dark" ||
      (!root.hasAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.setAttribute("data-theme", dark ? "light" : "dark");
  }
});

render();
