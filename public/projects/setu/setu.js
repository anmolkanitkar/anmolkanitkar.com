/* =========================================================
   Setu — startup-friendly public procurement
   Three roles, each with the four jobs it actually does.
   Actions in one role change what the other roles see.
   ========================================================= */

const money = n => n >= 100 ? "₹" + (n/100).toFixed(2) + " Cr" : "₹" + n + " L";
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };

/* ---------------- reference data ---------------- */

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

  openChallenges: [
    {id:"UA-2026-027", dept:"Urban Affairs", title:"Stop water pumps failing without warning",
     outcome:"Predict a pump failure at least 72 hours ahead across 38 pumping stations, and halve unplanned downtime.",
     ceiling:210, closes:"27 Sep 2026", match:79},
    {id:"TR-2026-018", dept:"Transport", title:"Find the potholes without sending out a survey team",
     outcome:"Produce a weekly ranked repair list for 1,100 km of arterial road, using cameras already fitted to city buses.",
     ceiling:120, closes:"16 Sep 2026", match:52},
    {id:"HL-2026-021", dept:"Health", title:"Screen for anaemia without drawing blood",
     outcome:"Screen 500 patients a day at a primary health centre, agreeing with the lab result at least 92% of the time.",
     ceiling:240, closes:"18 Sep 2026", match:34}
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

/* milestone states: 0 not started · 1 in progress · 2 startup says results ready · 3 officer verified and paid */
const MS = [
  {t:"Pilot agreement signed", amt:36, plan:"Week 0"},
  {t:"Sensors installed in all 12 wards", amt:54, plan:"Week 4"},
  {t:"Monsoon accuracy check", amt:54, plan:"Week 10",
   hint:"Target set by the evaluator: warn 45 minutes ahead on at least 80% of events."},
  {t:"Handover and control-room training", amt:36, plan:"Week 14"}
];

/* ---------------- roles: four jobs each ---------------- */

const ROLES = {
  officer: {
    who:"Department Officer", sub:"Urban Affairs · R. Iyer", ic:"▦", lab:"What the officer does",
    nav:[
      {id:"o1", n:"1", t:"Post a problem"},
      {id:"o2", n:"2", t:"Applications received"},
      {id:"o3", n:"3", t:"Review pilot progress"},
      {id:"o4", n:"4", t:"Decide to scale"}
    ]
  },
  startup: {
    who:"Startup User", sub:"Aarohi Systems · Pune", ic:"△", lab:"What the startup does",
    nav:[
      {id:"s1", n:"1", t:"Browse open challenges"},
      {id:"s2", n:"2", t:"Apply"},
      {id:"s3", n:"3", t:"Run the pilot"},
      {id:"s4", n:"4", t:"Update milestones"}
    ]
  },
  evaluator: {
    who:"Oversight (Evaluator)", sub:"National Procurement Cell", ic:"◎", lab:"What the evaluator does",
    nav:[
      {id:"e1", n:"1", t:"Review applications"},
      {id:"e2", n:"2", t:"Approve or reject"},
      {id:"e3", n:"3", t:"Set pilot terms"},
      {id:"e4", n:"4", t:"Fairness checks"}
    ]
  }
};

/* ---------------- shared state ---------------- */

const state = {
  role:"officer", view:"o1",
  posted:null,                       // the challenge the officer publishes
  applied:null,                      // the startup's application
  chosen:null,                       // applicant id approved by the evaluator
  reason:"",                         // the evaluator's written reason
  rejectNote:"",
  terms:null,                        // pilot terms set by the evaluator
  ms:[3,3,1,0],                      // milestone states
  scaled:false,
  bannerOff:false,
  tour:-1
};

const CHALLENGE = {
  id:"UA-2026-014",
  title:"Stop wards from flooding during the monsoon",
  outcome:"Warn the drainage control room 45 minutes before a ward floods, so standing water is cleared in under 75 minutes instead of the present 190.",
  ceiling:180, apps:24, dept:"Urban Affairs"
};

const chosenApplicant = () => DB.applicants.find(a => a.id === state.chosen) || DB.applicants[0];
const paidSoFar = () => MS.reduce((s,m,i) => s + (state.ms[i] === 3 ? m.amt : 0), 0);
const appCount = () => CHALLENGE.apps + (state.applied ? 1 : 0);

/* ---------------- shared pieces ---------------- */

function phead(title, sub, eyebrow){
  return '<div class="phead">' + (eyebrow ? '<div class="eyebrow">' + eyebrow + '</div>' : "") +
    '<h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : "") + '</div>';
}
function stat(lab, v, unit, sub){
  return '<div class="stat"><div class="lab">' + lab + '</div><div class="val">' + v +
    (unit ? '<small> ' + unit + '</small>' : "") + '</div>' + (sub ? '<div class="sub">' + sub + '</div>' : "") + '</div>';
}
/* Width is a data attribute, not an inline style: the site's CSP forbids style
   attributes in markup. applyBars() sets it through the CSSOM after each render,
   which CSP does not intercept. */
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

/* =========================================================
   DEPARTMENT OFFICER
   ========================================================= */

function o1(){
  if(state.posted){
    const p = state.posted;
    return phead("Problem published",
      "Live for every startup from today.",
      "Step 1 of 4 · Post a problem") +
      '<div class="note ok mb-md"><b>' + esc(p.title) + '</b> is live as ' + p.id + '.</div>' +
      '<div class="card"><h2>What you published</h2>' +
      '<ul class="plain">' +
        '<li><span class="lead">The result you need</span><span class="right wrap-right">' + esc(p.outcome) + '</span></li>' +
        '<li><span class="lead">Most you will pay</span><span class="right">' + money(p.budget) + '</span></li>' +
        '<li><span class="lead">Applications close</span><span class="right">' + esc(p.deadline) + '</span></li>' +
        '<li><span class="lead">Who will use it</span><span class="right">' + esc(p.users) + '</span></li>' +
      '</ul>' +
      '<div class="row mt-md"><button class="btn" type="button" id="repost">Post another problem</button>' +
      '<button class="btn pri" type="button" data-goto="startup:s1">See it as a startup sees it</button></div></div>' +
      handoff("Startups can now apply. An independent evaluator scores them, not you.");
  }

  return phead("Post a problem",
    "Say what result you need. Leave how to get there open.",
    "Step 1 of 4 · Post a problem") +
    '<div class="card"><h2>New challenge</h2><div class="sub">Six fields</div>' +
    field("What is the problem?", "",
      '<input id="f-title" type="text" value="Stop wards from flooding during the monsoon">') +
    field("What result would count as solved?", "Give a number. This becomes the pilot target.",
      '<textarea id="f-outcome">Warn the drainage control room 45 minutes before a ward floods, so standing water is cleared in under 75 minutes instead of the present 190.</textarea>') +
    '<div class="f2">' +
      field("Most you will pay (₹ lakh)", "Published up front.",
        '<input id="f-budget" type="number" value="180" min="1">') +
      field("Applications close on", "",
        '<input id="f-deadline" type="text" value="12 Aug 2026">') +
    '</div>' +
    '<div class="f2">' +
      field("Who will use it?", "", '<input id="f-users" type="text" value="Ward drainage control room, 12 wards">') +
      field("How long should the pilot run?", "", '<select id="f-weeks"><option>12 weeks</option><option selected>14 weeks</option><option>20 weeks</option></select>') +
    '</div>' +
    '<div class="note mb-md"><b>Not asked for:</b> minimum turnover · three years of past supply · earnest money deposit.</div>' +
    '<button class="btn pri big" type="button" id="publish">Publish this challenge</button></div>';
}

function o2(){
  const n = appCount();
  const decided = !!state.chosen;
  const top = DB.applicants.slice(0,4);

  return phead(decided ? "The evaluator has decided" : "Applications received",
    decided
      ? "An independent evaluator decided, with a written reason."
      : "You can see who applied. An independent evaluator picks.",
    "Step 2 of 4 · " + CHALLENGE.id) +
    '<div class="big3 mb-lg">' +
      stat("Applications", n, "", state.applied ? "one arrived today" : "closed 12 Aug 2026") +
      stat("Passed basic checks", n - 3, "", "3 outside the scope") +
      stat(decided ? "Decision" : "Evaluator's clock", decided ? "Made" : "41", decided ? "" : "of 60 days", decided ? "reason on record" : "no chasing needed") +
    '</div>' +
    (decided
      ? '<div class="note ok mb-md"><b>' + chosenApplicant().name + ' was approved for the pilot.</b><br>' +
        '<span class="quote">Reason filed by the evaluator: “' + esc(state.reason) + '”</span></div>'
      : '<div class="note warn mb-md"><b>With the evaluator.</b> Nothing needed from you until a startup is approved.</div>') +
    '<div class="card"><h2>Who applied</h2><div class="sub">Names and proposals only — scores are the evaluator’s</div>' +
    '<ul class="plain">' +
      (state.applied ? '<li><span class="lead"><b>' + esc(state.applied.name) + '</b><br><span class="note-sm">' + esc(state.applied.pitch.slice(0,90)) + '…</span></span><span class="badge b-acc">Applied today</span></li>' : "") +
      top.map(a => '<li><span class="lead"><b>' + a.name + '</b><br><span class="note-sm">' + a.city + ' · ' + a.team + ' people' + (a.first ? ' · first public contract' : '') + '</span></span>' +
        (state.chosen === a.id ? '<span class="badge b-ok"><i class="dot"></i>Approved</span>' : decided ? '<span class="badge b-mute">Not selected</span>' : '<span class="badge b-info">With evaluator</span>') + '</li>').join("") +
      '<li><span class="lead muted">and ' + (n - 4 - (state.applied ? 0 : 0)) + ' more</span></li>' +
    '</ul></div>' +
    (decided ? handoff("Track it under <b>Review pilot progress</b>.")
             : handoff("Switch to <b>Oversight (Evaluator)</b> on the left to see the scores."));
}

function o3(){
  const a = chosenApplicant();
  const reported = state.ms.indexOf(2);
  const items = MS.map((m,i) => {
    const s = state.ms[i];
    const cls = s === 3 ? "paid" : s === 2 ? "rep" : s === 1 ? "act" : "";
    const label = s === 3 ? "Verified and paid" : s === 2 ? "Startup says it is done — needs your check" : s === 1 ? "In progress · " + m.plan : "Not started · " + m.plan;
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

  if(state.scaled){
    return phead("Scaled to full deployment",
      "The pilot was the evidence. No new tender.",
      "Step 4 of 4 · contract C-2026-0412") +
      '<div class="note ok mb-md"><b>83 days from problem to signed contract.</b> The old route averaged 214.</div>' +
      '<div class="card"><h2>What happens now</h2><ul class="plain">' +
        '<li><span class="lead"><b>All 38 wards, 24 months, ' + money(a.price) + '</b><br><span class="note-sm">At the ceiling you published</span></span></li>' +
        '<li><span class="lead"><b>Listed as a proven solution</b><br><span class="note-sm">Other departments can buy it without a tender</span></span>' +
          '<span class="right"><button class="btn sm" type="button" data-goto="evaluator:e4">See the list</button></span></li>' +
        '<li><span class="lead"><b>Paid quarterly, against results</b><br><span class="note-sm">Under 75% for two quarters ends it on 90 days’ notice</span></span></li>' +
      '</ul></div>';
  }

  return phead("Decide to scale",
    "The pilot hit every target. Nothing left to prove or negotiate.",
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
        '<button class="btn" type="button">Extend the pilot instead</button></div></div>'
      : '<div class="note warn"><b>Not yet.</b> Verify all four steps first, under <b>Review pilot progress</b>.</div>');
}

/* =========================================================
   STARTUP USER
   ========================================================= */

function s1(){
  const posted = state.posted;
  const cards = [];
  if(posted){
    cards.push('<div class="chal new"><div class="hd"><span class="mono meta-sm">' + posted.id + ' · ' + CHALLENGE.dept + '</span>' +
      '<span class="badge b-acc"><i class="dot"></i>Posted today</span></div>' +
      '<h3>' + esc(posted.title) + '</h3>' +
      '<p class="out"><b>What they want:</b> ' + esc(posted.outcome) + '</p>' +
      '<div class="foot"><span>Most they will pay <b class="mono ink">' + money(posted.budget) + '</b> · closes ' + esc(posted.deadline) + '</span>' +
      '<button class="btn pri" type="button" data-goto="startup:s2">Apply</button></div></div>');
  }
  DB.openChallenges.forEach(c => {
    cards.push('<div class="chal"><div class="hd"><span class="mono meta-sm">' + c.id + ' · ' + c.dept + '</span>' +
      '<span class="badge ' + (c.match >= 70 ? "b-ok" : c.match >= 45 ? "b-acc" : "b-mute") + '">Fits you ' + c.match + '%</span></div>' +
      '<h3>' + esc(c.title) + '</h3>' +
      '<p class="out"><b>What they want:</b> ' + esc(c.outcome) + '</p>' +
      '<div class="foot"><span>Most they will pay <b class="mono ink">' + money(c.ceiling) + '</b> · closes ' + c.closes + '</span>' +
      '<button class="btn' + (c.match >= 70 ? " pri" : "") + '" type="button">' + (c.match >= 70 ? "Apply" : "Read it") + '</button></div></div>');
  });

  return phead("Open challenges",
    "The result wanted, the most they will pay, and how you are scored — all shown up front.",
    "Step 1 of 4 · " + cards.length + " open") +
    '<div class="stack sm">' + cards.join("") + '</div>' +
    '<div class="spacer"></div>' +
    '<div class="note"><b>Applying costs nothing.</b> No fee, no deposit, no turnover history. Your profile is filed once and reused.</div>';
}

function s2(){
  if(state.applied){
    const ap = state.applied;
    return phead("Application submitted",
      "It went to an independent evaluator, not to the department.",
      "Step 2 of 4 · " + (state.posted ? state.posted.id : CHALLENGE.id)) +
      '<div class="note ok mb-md"><b>Filed today.</b> A decision is due within 60 days, or it escalates on its own.</div>' +
      '<div class="card"><h2>What you sent</h2><ul class="plain">' +
        '<li><span class="lead">Your idea</span><span class="right wrap-right">' + esc(ap.pitch) + '</span></li>' +
        '<li><span class="lead">Your price</span><span class="right">' + money(ap.price) + '</span></li>' +
        '<li><span class="lead">You can start in</span><span class="right">' + esc(ap.start) + '</span></li>' +
        '<li><span class="lead">Team size</span><span class="right">' + esc(ap.team) + ' people</span></li>' +
      '</ul>' +
      '<div class="row mt-md"><button class="btn" type="button" id="reapply">Edit and resubmit</button>' +
      '<button class="btn pri" type="button" data-goto="evaluator:e1">See how it is reviewed</button></div></div>' +
      handoff("The evaluator scores it and files a written reason either way.");
  }

  return phead("Apply",
    "Your idea and four fields. No turnover history, no deposit.",
    "Step 2 of 4 · " + (state.posted ? state.posted.id + " · " + state.posted.title : CHALLENGE.id)) +
    '<div class="card"><h2>Your application</h2>' +
    '<div class="sub">Registration, tax and bank details come from your profile</div>' +
    field("How would you solve it?", "The approach, not a brochure.",
      '<textarea id="a-pitch">Cheap ultrasonic sensors in the drains, plus a rainfall model trained on the last six monsoons. Works over 2G, so it keeps running in the older wards where the network is weak.</textarea>') +
    '<div class="f2">' +
      field("Your price (₹ lakh)", "At or under the ceiling.", '<input id="a-price" type="number" value="172">') +
      field("You can start in", "", '<select id="a-start"><option>2 weeks</option><option selected>3 weeks</option><option>6 weeks</option></select>') +
    '</div>' +
    '<div class="f2">' +
      field("Team size", "", '<input id="a-team" type="number" value="11">') +
      field("Done anything like this before?", "Optional. Blank does not count against you.",
        '<input id="a-prior" type="text" value="Two municipal pilots, Pune and Nashik">') +
    '</div>' +
    '<div class="note mb-md"><b>Not asked for, not scored:</b> turnover · past supply · deposit · bank guarantee.</div>' +
    '<button class="btn pri big" type="button" id="submitapp">Submit application</button></div>';
}

function s3(){
  if(!state.terms){
    return phead("Run the pilot",
      "Appears once an evaluator approves you.",
      "Step 3 of 4") +
      '<div class="note warn"><b>Waiting on a decision.</b> You will get your score and the reason either way.</div>';
  }
  const t = state.terms;
  const a = chosenApplicant();
  return phead("Run the pilot",
    "Paid work with real users, not a free trial.",
    "Step 3 of 4 · " + CHALLENGE.id + " · " + money(180) + " pilot") +
    '<div class="big3 mb-lg">' +
      stat("Received so far", money(paidSoFar()), "", "of " + money(180)) +
      stat("Time to get paid", "4", "days", "they promised 7") +
      stat("Pilot length", t.weeks, "", "ends " + t.ends) +
    '</div>' +
    '<div class="split">' +
    '<div class="card"><h2>What counts as success</h2><div class="sub">Agreed before work started</div>' +
    '<ul class="plain">' +
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
    const label = s === 3 ? "Verified — " + money(m.amt) + " received" :
                  s === 2 ? "Reported. Waiting for the officer to verify." :
                  s === 1 ? "In progress · due " + m.plan : "Not started · " + m.plan;
    let action = "";
    if(s === 1) action = '<button class="btn pri sm" type="button" id="report" data-report="' + i + '">Mark results ready</button>';
    else if(s === 2) action = '<span class="badge b-warn"><i class="dot"></i>With the officer</span>';
    else if(s === 3) action = '<span class="badge b-ok"><i class="dot"></i>Paid</span>';
    else action = '<span class="badge b-mute">Locked</span>';
    return '<li><span class="n ' + cls + '">' + (s === 3 ? "✓" : (i+1)) + '</span>' +
      '<div><b>' + m.t + '</b><span class="when">' + label + '</span></div>' +
      '<div class="side"><span class="amt">' + money(m.amt) + '</span>' + action + '</div></li>';
  }).join("");

  const active = state.ms.indexOf(1);
  return phead("Update milestones",
    "Mark a step done. The officer verifies and pays, usually in four days.",
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
  const list = DB.applicants.map(a =>
    '<div class="applicant"><div><h3>' + a.name + '</h3>' +
    '<div class="meta">' + a.city + ' · ' + a.team + ' people · quoted ' + money(a.price) + (a.first ? ' · first public contract' : '') + '</div>' +
    '<p class="desc">' + esc(a.desc) + '</p>' +
    '<div class="facts">' + a.facts.map(f => '<span class="tag">' + f + '</span>').join("") + '</div></div>' +
    '<div class="sidecol"><div><div class="sc">' + a.score + '</div><div class="sclab">out of 100</div></div>' +
    '<div class="w-full">' + bar(a.score, a.score >= 80 ? "ok" : a.score >= 65 ? "acc" : "") + '</div></div></div>').join("");

  return phead("Review applications",
    "Only you see the scores. The buying department cannot.",
    "Step 1 of 4 · " + CHALLENGE.id + " · " + appCount() + " applications") +
    '<div class="note mb-md"><b>Scoring, published with the challenge:</b> solves the problem (40) · doable in 90 days (30) · price against ceiling (20) · size of improvement (10).</div>' +
    (state.applied ? '<div class="note acc mb-md"><b>New today:</b> ' + esc(state.applied.name) + '.</div>' : "") +
    '<div class="stack sm">' + list + '</div>' +
    handoff("Record the decision under <b>Approve or reject</b>.");
}

function e2(){
  if(state.chosen){
    const a = chosenApplicant();
    return phead("Decision recorded",
      "Every applicant got their score and the reason. Contestable for 15 days.",
      "Step 2 of 4 · " + CHALLENGE.id) +
      '<div class="note ok mb-md"><b>' + a.name + ' approved for the pilot.</b><br>' +
      '<span class="quote">“' + esc(state.reason) + '”</span></div>' +
      (state.rejectNote ? '<div class="note mb-md"><b>Sent to everyone not selected:</b> “' + esc(state.rejectNote) + '”</div>' : "") +
      '<div class="card"><h2>Who was told what</h2><ul class="plain">' +
      DB.applicants.map(a2 => '<li><span class="lead"><b>' + a2.name + '</b><br><span class="note-sm">Score ' + a2.score + ' of 100 · sent today</span></span>' +
        (a2.id === state.chosen ? '<span class="badge b-ok"><i class="dot"></i>Approved</span>' : '<span class="badge b-mute">Not selected</span>') + '</li>').join("") +
      '</ul>' +
      '<div class="row mt-md"><button class="btn" type="button" id="undo">Reopen the decision</button>' +
      '<button class="btn pri" type="button" data-goto="evaluator:e3">Set the pilot terms</button></div></div>';
  }

  const opts = DB.applicants.map(a => '<option value="' + a.id + '"' + (a.id === "SU-2417" ? " selected" : "") + '>' + a.name + ' — score ' + a.score + ', ' + money(a.price) + '</option>').join("");

  return phead("Approve or reject",
    "One startup gets the pilot. Your reason goes to everyone, on the record.",
    "Step 2 of 4 · " + CHALLENGE.id) +
    '<div class="card"><h2>Record the decision</h2><div class="sub">A reason is required</div>' +
    field("Which startup gets the pilot?", "", '<select id="d-pick">' + opts + '</select>') +
    field("Why this one?", "Sent to every applicant and put on the record.",
      '<textarea id="d-reason">Highest score on solving the stated problem, and the only proposal that keeps working on a 2G signal — which is the condition in the older wards where flooding is worst. Priced under the ceiling and can start in three weeks.</textarea>') +
    field("What to tell everyone else", "Their score breakdown is attached automatically.",
      '<textarea id="d-reject">Not selected this time. Two pilot slots were funded and the ranking was decided on field-readiness under weak network conditions. Your full score breakdown is attached, and you may contest this within 15 days.</textarea>') +
    '<div class="row"><button class="btn pri big" type="button" id="approve">Approve and notify everyone</button>' +
    '<button class="btn danger" type="button">Reject all and re-run</button></div></div>' +
    handoff("Next you set what success means for the pilot.");
}

function e3(){
  if(!state.chosen){
    return phead("Set pilot terms", "Set once a startup is approved.", "Step 3 of 4") +
      '<div class="note warn"><b>No decision yet.</b> Approve a startup first.</div>';
  }
  if(state.terms){
    const t = state.terms;
    return phead("Pilot terms set",
      "Both sides now know what has to be true at the end.",
      "Step 3 of 4 · " + chosenApplicant().name) +
      '<div class="note ok mb-md"><b>Sent to both sides.</b> Neither can change it alone.</div>' +
      '<div class="card"><h2>What success means</h2><ul class="plain">' +
        '<li><span class="lead">Pilot runs for</span><span class="right">' + esc(t.weeks) + '</span></li>' +
        '<li><span class="lead">Warn ahead by</span><span class="right">' + esc(t.lead) + '</span></li>' +
        '<li><span class="lead">Hit rate needed</span><span class="right">' + esc(t.accuracy) + '</span></li>' +
        '<li><span class="lead">Payment</span><span class="right">' + esc(t.split) + '</span></li>' +
        '<li><span class="lead">Paid within</span><span class="right">7 days of verification</span></li>' +
      '</ul>' +
      '<div class="row mt-md"><button class="btn" type="button" id="retterms">Change the terms</button>' +
      '<button class="btn pri" type="button" data-goto="startup:s4">See it as the startup does</button></div></div>' +
      handoff("The startup now works through the four steps.");
  }

  return phead("Set pilot terms",
    "Define success before work starts, so nobody moves the goalposts.",
    "Step 3 of 4 · " + chosenApplicant().name) +
    '<div class="card"><h2>Terms of the pilot</h2><div class="sub">Both sides sign this</div>' +
    '<div class="f2">' +
      field("How long does the pilot run?", "", '<select id="t-weeks"><option>12 weeks</option><option selected>14 weeks</option><option>20 weeks</option></select>') +
      field("How much warning must it give?", "", '<select id="t-lead"><option>30 minutes</option><option selected>45 minutes</option><option>60 minutes</option></select>') +
    '</div>' +
    '<div class="f2">' +
      field("Hit rate to pass", "", '<select id="t-acc"><option>70% of events</option><option selected>80% of events</option><option>90% of events</option></select>') +
      field("How the money is released", "", '<select id="t-split"><option selected>20 / 30 / 30 / 20 across four steps</option><option>25 / 25 / 25 / 25 across four steps</option><option>Half up front, half at the end</option></select>') +
    '</div>' +
    field("The four steps to report against", "", '<div class="readonly">' + MS.map((m,i) => (i+1) + ". " + m.t + " — " + money(m.amt)).join("<br>") + '</div>') +
    '<button class="btn pri big" type="button" id="setterms">Set these terms</button></div>';
}

function e4(){
  const reg = DB.registry.concat(state.scaled
    ? [{sol:"Ward flooding early warning", by:chosenApplicant().name, origin:"Urban Affairs",
        proof:"84% of events warned 45 minutes ahead, clearance down from 190 to 71 minutes", adopters:1, price:61}]
    : []);
  return phead("Fairness checks",
    "One question, answered in public: was this rigged?",
    "Step 4 of 4 · this financial year") +
    '<div class="card mb-md"><h2>Was this decision clean?</h2><div class="sub">Run automatically on ' + CHALLENGE.id + '</div>' +
    '<ul class="plain">' +
      '<li><span class="badge b-ok"><i class="dot"></i>Pass</span><span class="lead">Ceiling price published <b>before</b> applications opened.</span></li>' +
      '<li><span class="badge b-ok"><i class="dot"></i>Pass</span><span class="lead">Scoring rubric published up front and never changed.</span></li>' +
      '<li><span class="badge b-ok"><i class="dot"></i>Pass</span><span class="lead">Buying department saw no scores before the decision.</span></li>' +
      '<li><span class="badge b-ok"><i class="dot"></i>Pass</span><span class="lead">Conflict-of-interest declarations on file.</span></li>' +
      '<li><span class="badge ' + (state.chosen ? "b-ok" : "b-mute") + '">' + (state.chosen ? '<i class="dot"></i>Pass' : "Pending") + '</span><span class="lead">Written reason sent to every applicant.</span></li>' +
      '<li><span class="badge b-ok"><i class="dot"></i>Pass</span><span class="lead">No requirement only one supplier could meet.</span></li>' +
    '</ul></div>' +
    '<div class="split mb-md">' +
    '<div class="card"><h2>Is the money going to the same few?</h2><div class="sub">Checked every quarter</div>' +
    '<div class="stack sm">' +
      '<div><div class="row between"><span>Top 3 suppliers’ share</span><b class="mono">31%</b></div>' + bar(31,"ok") + '</div>' +
      '<div><div class="row between"><span>Winners on their first public contract</span><b class="mono">48%</b></div>' + bar(48,"ok") + '</div>' +
      '<div><div class="row between"><span>Winners from outside the big cities</span><b class="mono">37%</b></div>' + bar(37,"acc") + '</div>' +
    '</div></div>' +
    '<div class="card"><h2>Departments that are slow</h2><div class="sub">Published time to a decision</div>' +
    '<ul class="plain">' +
      '<li><span class="lead">Public Grievances</span><span class="right">58 days</span></li>' +
      '<li><span class="lead">Agriculture</span><span class="right">71 days</span></li>' +
      '<li><span class="lead">Urban Affairs</span><span class="right">83 days</span></li>' +
      '<li><span class="lead">Health <span class="badge b-crit ml-xs">Flagged</span></span><span class="right">118 days</span></li>' +
    '</ul></div></div>' +
    '<div class="card"><h2>Proven solutions any department can buy</h2>' +
    '<div class="sub">Listed only after a pilot met its targets. No re-tendering.</div>' +
    '<ul class="plain">' + reg.map(r => '<li><span class="lead"><b>' + esc(r.sol) + '</b> — ' + r.by +
      '<br><span class="note-sm">' + esc(r.proof) + ' · proven in ' + r.origin + '</span></span>' +
      '<span class="right">' + money(r.price) + ' · ' + r.adopters + ' using</span></li>').join("") + '</ul>' +
    (state.scaled ? '<div class="note ok mt-md"><b>Just added.</b> Any department can now buy it without tendering.</div>' : "") +
    '</div>';
}

/* =========================================================
   GUIDED TOUR
   ========================================================= */

const TOUR = [
  {role:"officer", view:"o1", who:"Department Officer", title:"Post the problem, not the product",
   text:"Write the result needed and the most payable. How to get there stays open.", focus:"#publish"},
  {role:"startup", view:"s1", who:"Startup User", title:"Every startup sees it the same day",
   text:"No tender notice to hunt for. It is at the top of the list."},
  {role:"startup", view:"s2", who:"Startup User", title:"Applying takes four fields",
   text:"No turnover history, no deposit. Press Submit.", focus:"#submitapp"},
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
  {role:"evaluator", view:"e4", who:"Oversight (Evaluator)", title:"And it only has to be proven once",
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
  state.tour = i; state.role = TOUR[i].role; state.view = TOUR[i].view; render();
}

/* =========================================================
   ROUTER
   ========================================================= */

const VIEWS = {o1:o1, o2:o2, o3:o3, o4:o4, s1:s1, s2:s2, s3:s3, s4:s4, e1:e1, e2:e2, e3:e3, e4:e4};

/* which nav items are finished, so the rail shows progress */
function doneSteps(role){
  if(role === "officer") return {o1:!!state.posted, o2:!!state.chosen, o3:state.ms.every(s=>s===3), o4:state.scaled};
  if(role === "startup") return {s1:!!state.posted, s2:!!state.applied, s3:!!state.terms, s4:state.ms.every(s=>s===3)};
  return {e1:!!state.chosen, e2:!!state.chosen, e3:!!state.terms, e4:state.scaled};
}
/* which nav items are waiting on this role */
function pending(role){
  const p = {};
  if(role === "officer" && state.ms.includes(2)) p.o3 = "1";
  if(role === "officer" && !state.chosen && state.applied) p.o2 = "new";
  if(role === "startup" && state.terms && state.ms.includes(1)) p.s4 = "1";
  if(role === "evaluator" && !state.chosen) p.e2 = "1";
  if(role === "evaluator" && state.chosen && !state.terms) p.e3 = "1";
  return p;
}

function render(){
  const r = ROLES[state.role];
  if(!r.nav.some(n => n.id === state.view)) state.view = r.nav[0].id;
  const done = doneSteps(state.role), pend = pending(state.role);

  document.getElementById("roles").innerHTML = Object.entries(ROLES).map(([k,v]) =>
    '<button class="roletab" type="button" data-role="' + k + '" aria-pressed="' + (state.role === k) + '">' +
    '<span class="ic">' + v.ic + '</span><span><em>' + v.who + '</em><small>' + v.sub + '</small></span></button>').join("");

  document.getElementById("navlab").textContent = r.lab;
  document.getElementById("nav").innerHTML = r.nav.map(n =>
    '<button type="button" data-view="' + n.id + '"' + (state.view === n.id ? ' aria-current="page"' : "") + '>' +
    '<span class="sn' + (done[n.id] && state.view !== n.id ? " done" : "") + '">' + (done[n.id] && state.view !== n.id ? "✓" : n.n) + '</span>' +
    '<span>' + n.t + '</span>' +
    (pend[n.id] ? '<span class="pill">' + pend[n.id] + '</span>' : '<span></span>') + '</button>').join("");

  const item = r.nav.find(n => n.id === state.view);
  document.getElementById("crumb").innerHTML = r.who + ' <span class="dim">/</span> <b>' + item.t + '</b>' +
    '<span class="spacer"></span><span>Prototype</span>';

  const banner = (state.tour < 0 && !state.bannerOff && state.view === r.nav[0].id)
    ? '<div class="banner"><div class="grow"><b>New here?</b>' +
      '<p>Ten steps across all three roles, one case end to end.</p></div>' +
      '<button class="btn pri" type="button" id="bannerstart">Start guided demo</button>' +
      '<button class="btn ghost" type="button" id="bannerhide">No thanks</button></div>'
    : "";

  document.getElementById("view").innerHTML = banner + VIEWS[state.view]();
  applyBars(document.body);
  renderTour();
  window.scrollTo({top:0, behavior:"instant"});
}

document.addEventListener("click", e => {
  const t = e.target;

  const role = t.closest("[data-role]");
  if(role){ state.role = role.dataset.role; state.view = ROLES[state.role].nav[0].id; return render(); }

  const v = t.closest("[data-view]");
  if(v){ state.view = v.dataset.view; return render(); }

  const g = t.closest("[data-goto]");
  if(g){ const [rr,vv] = g.dataset.goto.split(":"); state.role = rr; state.view = vv; return render(); }

  /* officer */
  if(t.id === "publish"){
    state.posted = {
      id:"UA-2026-014",
      title: val("f-title") || CHALLENGE.title,
      outcome: val("f-outcome") || CHALLENGE.outcome,
      budget: Number(val("f-budget")) || 180,
      deadline: val("f-deadline") || "12 Aug 2026",
      users: val("f-users") || "Ward drainage control room, 12 wards",
      weeks: val("f-weeks") || "14 weeks"
    };
    return render();
  }
  if(t.id === "repost"){ state.posted = null; return render(); }
  const ver = t.closest("[data-ms]");
  if(ver){ state.ms[Number(ver.dataset.ms)] = 3; const nx = state.ms.indexOf(0); if(nx >= 0) state.ms[nx] = 1; return render(); }
  if(t.id === "scale"){ state.scaled = true; return render(); }

  /* startup */
  if(t.id === "submitapp"){
    state.applied = {
      name:"Aarohi Systems",
      pitch: val("a-pitch") || "Ultrasonic sensors plus a rainfall model.",
      price: Number(val("a-price")) || 172,
      start: val("a-start") || "3 weeks",
      team: val("a-team") || "11",
      prior: val("a-prior")
    };
    return render();
  }
  if(t.id === "reapply"){ state.applied = null; return render(); }
  const rep = t.closest("[data-report]");
  if(rep){ state.ms[Number(rep.dataset.report)] = 2; return render(); }

  /* evaluator */
  if(t.id === "approve"){
    const reason = val("d-reason");
    if(!reason){ const el = document.getElementById("d-reason"); if(el){ el.focus(); } return; }
    state.chosen = val("d-pick") || "SU-2417";
    state.reason = reason;
    state.rejectNote = val("d-reject");
    return render();
  }
  if(t.id === "undo"){ state.chosen = null; state.reason = ""; state.terms = null; return render(); }
  if(t.id === "setterms" || t.id === "retterms"){
    if(t.id === "retterms"){ state.terms = null; return render(); }
    state.terms = {
      weeks: val("t-weeks") || "14 weeks",
      lead: val("t-lead") || "45 minutes",
      accuracy: val("t-acc") || "80% of events",
      split: val("t-split") || "20 / 30 / 30 / 20 across four steps",
      ends: "18 Oct 2026"
    };
    return render();
  }

  /* tour + chrome */
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
