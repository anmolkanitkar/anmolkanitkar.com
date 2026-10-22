/* =========================================================
   Survibe — iPad onboarding prototype
   Welcome → six quick questions → a plan built from the
   answers → save it with an account, or keep going as a
   guest. Returning players go straight to log in.

   Everything a server would do is simulated in `api` and
   kept in localStorage, so an account made here can be
   logged back into. Nothing leaves the device.
   ========================================================= */
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Storage can be missing or throw (private windows, blocked site data). The
   prototype must still run end to end without it — it just forgets on reload. */
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* memory only */ } },
  del(k){ try { localStorage.removeItem(k); } catch { /* nothing to clear */ } }
};

/* ---------------- content ---------------- */

const I = {
  upright:`<svg viewBox="0 0 48 48"><rect x="8" y="5" width="32" height="31" rx="3"/><path d="M8 21h32M14 21v8M20 21v8M28 21v8M34 21v8M8 29h32M12 36v7M36 36v7"/></svg>`,
  digital:`<svg viewBox="0 0 48 48"><rect x="3" y="15" width="42" height="11" rx="2"/><path d="M8 21h32M12 21v5M17 21v5M22 21v5M27 21v5M32 21v5M37 21v5M10 26l-3 16M38 26l3 16M7 36h34"/></svg>`,
  keyboard:`<svg viewBox="0 0 48 48"><rect x="3" y="14" width="42" height="20" rx="3"/><path d="M7 22h34v8H7zM12 22v8M17 22v8M22 22v8M27 22v8M32 22v8M37 22v8"/><circle cx="9" cy="18" r="1"/><circle cx="14" cy="18" r="1"/><path d="M30 18h10"/></svg>`,
  ipad:`<svg viewBox="0 0 48 48"><rect x="6" y="9" width="36" height="30" rx="4"/><path d="M10 26h28v9H10zM15 26v9M20 26v9M24 26v9M28 26v9M33 26v9"/><path d="M13 15h12M13 19h8"/></svg>`,
  note:`<svg viewBox="0 0 48 48"><path d="M18 34V12l18-5v22"/><circle cx="13" cy="34" r="5"/><circle cx="31" cy="29" r="5"/></svg>`,
  staff:`<svg viewBox="0 0 48 48"><path d="M5 13h38M5 19h38M5 25h38M5 31h38M5 37h38"/><ellipse cx="22" cy="31" rx="5" ry="3.6"/><path d="M27 31V9"/></svg>`,
  chords:`<svg viewBox="0 0 48 48"><path d="M5 14h38M5 22h38M5 30h38M5 38h38"/><ellipse cx="24" cy="38" rx="5" ry="3.6"/><ellipse cx="24" cy="30" rx="5" ry="3.6"/><ellipse cx="24" cy="22" rx="5" ry="3.6"/></svg>`,
  metro:`<svg viewBox="0 0 48 48"><path d="M16 42h16l-5-34h-6z"/><path d="M14 34h20M24 30l11-17"/><circle cx="35" cy="12" r="2.5"/></svg>`,
  ear:`<svg viewBox="0 0 48 48"><path d="M15 20a10 10 0 1 1 17 7c-3 3-4 5-4 8a5 5 0 0 1-10 1"/><path d="M20 20a5 5 0 0 1 9 2c0 3-3 3-3 6"/><path d="M38 14c2 3 2 7 0 10M42 10c4 5 4 13 0 18"/></svg>`,
  moon:`<svg viewBox="0 0 48 48"><path d="M36 31A14 14 0 0 1 20 11a14 14 0 1 0 16 20z"/><path d="M34 8v6M31 11h6"/></svg>`,
  medal:`<svg viewBox="0 0 48 48"><circle cx="24" cy="18" r="11"/><path d="M24 12l2 4 4 .6-3 2.9.7 4.2-3.7-2-3.7 2 .7-4.2-3-2.9 4-.6z"/><path d="M17 27l-4 15 11-6 11 6-4-15"/></svg>`,
  mic:`<svg viewBox="0 0 48 48"><rect x="17" y="5" width="14" height="24" rx="7"/><path d="M10 23a14 14 0 0 0 28 0M24 37v7M17 44h14"/></svg>`,
  back:`<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>`,
  close:`<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  tick:`<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  play:`<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>`,
  stop:`<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>`,
  flame:`<svg viewBox="0 0 24 24"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.4 2-4.4.2 1.6 1 2.6 2 2.9C10.5 9 11 6 12 3z"/></svg>`,
  bell:`<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/></svg>`,
  mail:`<svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M4 7l8 6 8-6"/></svg>`,
  eye:`<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
  lock:`<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>`,
  dots:`<svg viewBox="0 0 24 24"><circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></svg>`,
  faceid:`<svg viewBox="0 0 48 48"><path d="M6 15V10a4 4 0 0 1 4-4h5M33 6h5a4 4 0 0 1 4 4v5M42 33v5a4 4 0 0 1-4 4h-5M15 42h-5a4 4 0 0 1-4-4v-5M16 17v4M32 17v4M24 17v9h-2M17 32c4 3 10 3 14 0"/></svg>`,
  apple:`<svg viewBox="0 0 24 24"><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.5-3.7zM14.1 5.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z"/></svg>`,
  google:`<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.4-.2-2.1H12v4h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2-1.9 3.3-4.6 3.3-7.9z"/><path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8C4 20.6 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.8 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H2.2C1.4 8.5 1 10.2 1 12s.4 3.5 1.2 5l3.6-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.4 2 14.9 1 12 1 7.7 1 4 3.4 2.2 7l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>`
};
const LOGO = `<span class="logo"><svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="7" width="5" height="18" rx="1.6"/><rect x="11.5" y="7" width="5" height="18" rx="1.6"/><rect x="19" y="7" width="5" height="18" rx="1.6" class="acc"/><rect x="26.5" y="7" width="2.5" height="18" rx="1.2" class="dim"/></svg><b>Survibe</b></span>`;

const INSTRUMENTS = [
  {id:"acoustic", t:"Acoustic piano", d:"An upright or a grand", ic:"upright"},
  {id:"digital",  t:"Digital piano",  d:"88 keys, usually weighted", ic:"digital"},
  {id:"keyboard", t:"Keyboard",       d:"61 keys or fewer", ic:"keyboard"},
  {id:"none",     t:"Nothing yet",    d:"Start on the iPad's screen", ic:"ipad"}
];
const LEVELS = [
  {id:"new",     t:"Brand new",              d:"I've never really played"},
  {id:"few",     t:"I know a few tunes",     d:"Picked up by ear or from videos"},
  {id:"rusty",   t:"I had lessons once",     d:"I can read a little, but I'm rusty"},
  {id:"regular", t:"I play regularly",       d:"I want to get properly good"}
];
const GOALS = [
  {id:"songs",     t:"Play songs I love",          ic:"note"},
  {id:"read",      t:"Read sheet music",           ic:"staff"},
  {id:"chords",    t:"Play chords while I sing",   ic:"chords"},
  {id:"technique", t:"Build real technique",       ic:"metro"},
  {id:"ear",       t:"Play by ear",                ic:"ear"},
  {id:"unwind",    t:"Unwind after the day",       ic:"moon"},
  {id:"exam",      t:"Prepare for a grade exam",   ic:"medal", d:"Trinity or ABRSM"}
];
const STYLES = [
  {id:"film",      t:"Bollywood & film",          d:"Romantic ballads, film themes"},
  {id:"classical", t:"Western classical",          d:"Beethoven to Debussy"},
  {id:"indian",    t:"Indian classical",           d:"Raags, bhajans, devotional"},
  {id:"pop",       t:"Pop",                        d:"Chart songs and ballads"},
  {id:"jazz",      t:"Jazz & blues",               d:"Swing, grooves, blue notes"},
  {id:"lofi",      t:"Lo-fi & chill",              d:"Soft chords, slow grooves"},
  {id:"scores",    t:"Movie & game scores",        d:"Big themes, cinematic"},
  {id:"folk",      t:"Folk & traditional",         d:"Songs everyone knows"}
];
const MINUTES = [
  {id:5,  t:"5 min",  d:"A quick daily touch"},
  {id:10, t:"10 min", d:"Steady progress"},
  {id:15, t:"15 min", d:"The sweet spot", tag:"Recommended"},
  {id:20, t:"20+ min", d:"Serious about it"}
];
const TIMES = [
  {id:"morning",   t:"Morning",   at:"7:30 am"},
  {id:"afternoon", t:"Afternoon", at:"1:00 pm"},
  {id:"evening",   t:"Evening",   at:"7:30 pm"},
  {id:"varies",    t:"It varies", at:"8:00 pm, if you haven't played"}
];

/* Every melody here is public domain or written for this prototype. Notes are
   [midi or [chord], beats]. */
const SONGS = {
  twinkle:{t:"Twinkle, Twinkle", by:"Traditional", lvl:0, bpm:104, style:"folk",
    notes:[[60,1],[60,1],[67,1],[67,1],[69,1],[69,1],[67,2],[65,1],[65,1],[64,1],[64,1],[62,1],[62,1],[60,2]]},
  ode:{t:"Ode to Joy", by:"Beethoven", lvl:0, bpm:112, style:"classical",
    notes:[[64,1],[64,1],[65,1],[67,1],[67,1],[65,1],[64,1],[62,1],[60,1],[60,1],[62,1],[64,1],[64,1.5],[62,.5],[62,2]]},
  bhupali:{t:"A first raag", by:"Survibe original · Raag Bhupali", lvl:0, bpm:84, style:"indian",
    notes:[[60,.5],[62,.5],[64,1],[67,.5],[69,.5],[67,1],[64,.5],[62,.5],[60,1],[64,.5],[67,.5],[69,1],[72,1.5],[69,.5],[67,.5],[64,.5],[62,.5],[64,.5],[60,2]]},
  monsoon:{t:"Monsoon Evening", by:"Survibe original · film style", lvl:1, bpm:92, style:"film",
    notes:[[[57,69],.5],[72,.5],[76,1],[74,.5],[72,.5],[71,1],[[53,69],2],[64,.5],[69,.5],[71,.5],[72,.5],[[55,74],1],[72,.5],[71,.5],[67,1],[[57,64,69],3]]},
  rainy:{t:"Rainy Window", by:"Survibe original · lo-fi", lvl:1, bpm:72, style:"lofi",
    notes:[[[53,57,60,64],1.5],[76,.5],[[52,55,59,62],1.5],[74,.5],[[50,53,57,60],1.5],[72,.5],[[48,52,55,59],1],[71,.5],[67,.5],[[48,52,55,64],2]]},
  fourchords:{t:"Four Chords, Every Song", by:"The pop progression · arranged", lvl:1, bpm:112, style:"pop",
    notes:[[60,.5],[64,.5],[67,.5],[72,.5],[55,.5],[59,.5],[62,.5],[67,.5],[57,.5],[60,.5],[64,.5],[69,.5],[53,.5],[57,.5],[60,.5],[65,.5],[[60,64,67,72],2]]},
  hero:{t:"First Light", by:"Survibe original · cinematic", lvl:1, bpm:96, style:"scores",
    notes:[[[48,60],.5],[67,.5],[67,1],[69,.5],[67,.5],[[53,72],1.5],[71,.5],[69,1],[[55,67],1],[64,.5],[65,.5],[[48,55,67],2]]},
  greensleeves:{t:"Greensleeves", by:"Traditional", lvl:1, bpm:132, style:"folk",
    notes:[[69,1],[72,2],[74,1],[76,1.5],[77,.5],[76,1],[74,2],[71,1],[67,1.5],[69,.5],[71,1],[72,2],[69,1],[69,1.5],[68,.5],[69,1],[71,2],[68,1],[64,2]]},
  blues:{t:"Twelve-Bar Walk", by:"Survibe original · blues", lvl:2, bpm:108, style:"jazz",
    notes:[[[48,60],.5],[63,.5],[64,.5],[67,1],[69,.5],[70,.5],[69,.5],[67,1.5],[[53,65],.5],[66,.5],[67,1],[63,.5],[64,.5],[[48,55,60],2]]},
  elise:{t:"Für Elise", by:"Beethoven", lvl:2, bpm:132, style:"classical",
    notes:[[76,.5],[75,.5],[76,.5],[75,.5],[76,.5],[71,.5],[74,.5],[72,.5],[[57,69],1.5],[60,.5],[64,.5],[69,.5],[[52,71],1.5],[64,.5],[68,.5],[71,.5],[[57,72],1.5]]}
};
const STYLE_SONGS = {film:["monsoon"], classical:["ode","elise"], indian:["bhupali"], pop:["fourchords"],
  jazz:["blues"], lofi:["rainy"], scores:["hero"], folk:["twinkle","greensleeves"]};

/* A few notes per style, played when a tile is chosen, so the choice is heard
   as well as seen. */
const MOTIFS = {
  film:[[69,.25],[72,.25],[76,.5]], classical:[[64,.25],[64,.25],[65,.25],[67,.5]],
  indian:[[60,.2],[62,.2],[64,.2],[67,.5]], pop:[[[60,64,67],.35],[[55,59,62],.5]],
  jazz:[[63,.18],[64,.3],[67,.5]], lofi:[[[53,57,60,64],.9]], scores:[[60,.3],[67,.6]],
  folk:[[69,.3],[72,.5]]
};
const BLIP = [60, 62, 64, 67, 69, 72, 74, 76];

const FLOW = ["instrument","level","check","goals","style","routine"];
const RANK = {welcome:0, login:1, instrument:1, level:2, check:3, goals:4, style:5, routine:6, building:7, plan:8, home:9};
const DBKEY = "survibe-proto-db-v1", SKEY = "survibe-proto-state-v1", PKEY = "survibe-proto-prefs-v1";

/* ---------------- state ---------------- */

const blankAnswers = () => ({instrument:null, level:null, check:null, goals:[], styles:[], minutes:15, time:null, remind:false});
let S = Object.assign({answers:blankAnswers(), user:null, plan:null}, store.get(SKEY) || {});
const prefs = Object.assign({sound:true}, store.get(PKEY) || {});
const save = () => store.set(SKEY, S);
const levelIdx = () => Math.max(0, LEVELS.findIndex(l => l.id === S.answers.level));
const label = (list, id) => (list.find(x => x.id === id) || {}).t || "";

/* Someone who jumps straight to the plan (prototype controls, a shared link)
   still needs answers for it to be built from. */
function fillDefaults(){
  const A = S.answers;
  A.instrument ||= "digital"; A.level ||= "few";
  if (!A.goals.length) A.goals = ["songs"];
  if (!A.styles.length) A.styles = ["film","pop"];
  A.minutes ||= 15;
  if (!S.plan) S.plan = makePlan(A);
  save();
}

/* ---------------- simulated backend ---------------- */

/* NOT a password hash. The prototype has no server, so "accounts" live in this
   browser's storage; this only keeps the demo password out of plain sight. */
function fnv(s){ let h = 0x811c9dc5; for (const c of s){ h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); }

const SEED = () => ({accounts:[
  {name:"Riya Kulkarni", email:"riya@survibe.in", pw:fnv("piano123"), providers:["email","google"], returning:true}
]});
const loadDB = () => store.get(DBKEY) || SEED();
const saveDB = db => store.set(DBKEY, db);
const fail = (code, extra) => Object.assign(new Error(code), {code}, extra);
const pub = (a, provider) => ({name:a.name, email:a.email, provider, returning:!!a.returning, plan:a.plan || null, answers:a.answers || null});

const api = {
  async signUp({name, email, password, provider = "email"}){
    await wait(900);
    const db = loadDB(), e = email.trim().toLowerCase();
    if (db.accounts.some(a => a.email === e)) throw fail("exists");
    const a = {name:name.trim(), email:e, pw:password ? fnv(password) : null, providers:[provider], plan:S.plan, answers:S.answers};
    db.accounts.push(a); saveDB(db);
    return pub(a, provider);
  },
  async logIn({email, password}){
    await wait(800);
    const a = loadDB().accounts.find(x => x.email === email.trim().toLowerCase());
    if (!a) throw fail("nouser");
    if (!a.pw) throw fail("social", {provider:a.providers[0]});
    if (a.pw !== fnv(password)) throw fail("badpw");
    return pub(a, "email");
  },
  /* Social sign-in finds or links an account by email, as Apple and Google
     sign-in do in practice. Unknown email → no account yet. */
  async social(provider, {email}){
    await wait(700);
    const db = loadDB(), a = db.accounts.find(x => x.email === email.toLowerCase());
    if (!a) return null;
    if (!a.providers.includes(provider)){ a.providers.push(provider); saveDB(db); }
    return pub(a, provider);
  },
  /* Always "sent", whether or not the account exists, so the form cannot be
     used to find out who has an account. */
  async resetPassword(){ await wait(900); return true; }
};

/* ---------------- the plan ---------------- */

function pickSongs(styles, L){
  const out = [];
  const near = id => Math.abs(SONGS[id].lvl - Math.min(L, 2));
  for (const s of styles){
    const best = (STYLE_SONGS[s] || []).slice().sort((a, b) => near(a) - near(b))[0];
    if (best && !out.includes(best)) out.push(best);
  }
  const rest = Object.keys(SONGS).filter(id => !out.includes(id)).sort((a, b) => near(a) - near(b));
  while (out.length < 3) out.push(rest.shift());
  return out.slice(0, 3);
}
const daysToSong = (L, m) => Math.max(4, Math.round([21, 14, 10, 7][L] * Math.sqrt(15 / (m || 15))));

function makePlan(A){
  const L = levelIdx(), m = A.minutes || 15, has = g => A.goals.includes(g);
  const styles = A.styles.length ? A.styles : ["classical"];
  let track;
  if (has("exam"))                track = {name:"Grade Ready",        line:"Exam pieces, scales and sight-reading, paced to a grade."};
  else if (L === 0)               track = {name:"First Notes",        line:"From your very first key to your first full song."};
  else if (has("chords"))         track = {name:"Chords & Voice",     line:"The chords under a melody, so you can sing over them."};
  else if (has("read") || L >= 2) track = {name:"Reading Fluency",    line:"Turn sheet music into sound without counting lines."};
  else                            track = {name:"Songs First",        line:"The songs you want, and the skills hiding inside them."};

  const songs = pickSongs(styles, L), first = SONGS[songs[0]];
  const W = [
    [["Find your way around","Middle C, finger numbers, and a hand shape that doesn't ache."],
     ["Right-hand melodies","Five-note tunes, played in time with Survibe."],
     ["Both hands, slowly","A steady left hand under tunes you already know."]],
    [["Tidy up the habits","Hand position and timing, checked bar by bar."],
     ["Reading the right hand","Treble-clef notes, a few at a time, in real songs."],
     ["Hands together, in time","Survibe waits when you hesitate, then nudges the tempo."]],
    [["Shake off the rust","A sight-reading check and the scales you've forgotten."],
     ["Both clefs at once","Reading left and right hand together, without stopping."],
     ["Pedal and dynamics","Making it sound like music, not just the right notes."]],
    [["A recorded play-through","Survibe maps where your timing and evenness slip."],
     ["Technique, aimed","Scales and arpeggios chosen for those exact slips."],
     ["Expression and voicing","Bringing the melody out over everything else."]]
  ][L].map(([t, d]) => ({t, d}));
  if (has("chords") && L >= 1) W[1] = {t:"Four chords: C, G, Am, F", d:"The progression under thousands of songs."};
  if (has("ear"))  W[1] = {t:"Play it back", d:"Hear a short phrase, then find it on the keys."};
  if (has("exam")) W[2] = {t:"Grade pieces and aural", d:"The set pieces, the scales, and the listening tests."};
  W.push({t:`Play ${first.t}`, d:"Start to finish, at a tempo you choose.", song:songs[0]});

  const reasons = [];
  reasons.push({
    acoustic:"You play an acoustic piano, so Survibe listens through the mic. Nothing to plug in.",
    digital:"Digital piano: the mic works out of the box, or plug in USB MIDI for even tighter timing.",
    keyboard:"Your keyboard may have fewer keys, so early songs stay inside 61 keys.",
    none:"No piano yet? Lessons start on the iPad's screen and carry over when you get one."
  }[A.instrument] || "");
  if (A.check && A.check.chord) reasons.push("You played a C major chord cleanly, so we skipped the very first lessons.");
  else if (A.check && A.check.done) reasons.push("You found middle C, so week one starts with where your hands go.");
  else reasons.push(["Starting from scratch, so nothing is assumed.","You play by ear, so reading is added gently.","You've had lessons, so we start with a quick refresher.","You already play, so lessons start from a play-through."][L]);
  reasons.push(`First songs come from ${styles.map(s => label(STYLES, s)).slice(0, 2).join(" and ")}.`);
  reasons.push(has("unwind") ? `${m} minutes a day, and no timers on the days you just want to play.` : `${m} minutes a day, so every lesson fits in one sitting.`);

  const lesson = [
    {t:"Meet middle C", d:"Right hand · Finding your way", min:6},
    {t:"Where your hands belong", d:"Both hands · Posture and timing", min:8},
    {t:"A sight-reading check", d:"Both hands · Reading", min:7},
    {t:"A 90-second play-through", d:"Both hands · Diagnosis", min:5}
  ][L];
  return {track, songs, weeks:W, days:daysToSong(L, m), minutes:m, reasons:reasons.filter(Boolean).slice(0, 4), lesson};
}

/* ---------------- audio ---------------- */

const Sound = (() => {
  let ctx = null, master = null;
  function ensure(){
    if (!ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = .55;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      /* iPadOS mutes Web Audio when the ring switch is on silent unless the
         session is declared as playback. Safari 16.4+ only; harmless elsewhere. */
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch { /* unsupported */ }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  /* A soft, piano-ish voice: triangle plus an octave sine, through a lowpass
     that closes as the note decays. */
  function note(midi, when = 0, dur = .9, vel = .8, out = null){
    if (!prefs.sound) return;
    const c = ensure(); if (!c) return;
    const t = c.currentTime + when, f = 440 * 2 ** ((midi - 69) / 12);
    const o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
    const filt = c.createBiquadFilter(), env = c.createGain();
    o1.type = "triangle"; o1.frequency.value = f;
    o2.type = "sine"; o2.frequency.value = f * 2; g2.gain.value = .22;
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(Math.min(9000, f * 9), t);
    filt.frequency.exponentialRampToValueAtTime(Math.max(500, f * 2.2), t + dur + .3);
    env.gain.setValueAtTime(.0001, t);
    env.gain.exponentialRampToValueAtTime(.32 * vel, t + .008);
    env.gain.exponentialRampToValueAtTime(.12 * vel, t + .3);
    env.gain.exponentialRampToValueAtTime(.0001, t + dur + .6);
    o1.connect(filt); o2.connect(g2); g2.connect(filt); filt.connect(env); env.connect(out || master);
    o1.start(t); o2.start(t); o1.stop(t + dur + .7); o2.stop(t + dur + .7);
  }
  function bus(){ const c = ensure(); if (!c) return null; const g = c.createGain(); g.connect(master); return g; }
  function release(g){
    if (!g || !ctx) return;
    g.gain.setTargetAtTime(0, ctx.currentTime, .06);
    setTimeout(() => g.disconnect(), 400);
  }
  return {ensure, note, bus, release};
})();

function phrase(notes, spb = .5, vel = .5){
  let t = 0;
  for (const [n, b] of notes){ (Array.isArray(n) ? n : [n]).forEach(m => Sound.note(m, t, b * spb + .2, vel)); t += b * spb; }
}

let playing = null;
function playSong(id, scope, onEnd){
  stopSong();
  const s = SONGS[id], spb = 60 / s.bpm, bus = Sound.bus(), timers = [];
  let t = .06;
  for (const [n, b] of s.notes){
    const ns = Array.isArray(n) ? n : [n];
    ns.forEach(m => Sound.note(m, t, b * spb * .95, .7, bus));
    const ms = b * spb * 900;
    timers.push(setTimeout(() => flash(scope, ns, ms), t * 1000));
    t += b * spb;
  }
  timers.push(setTimeout(() => stopSong(), t * 1000 + 250));
  playing = {timers, bus, onEnd};
}
function stopSong(){
  if (!playing) return;
  const p = playing; playing = null;
  p.timers.forEach(clearTimeout); Sound.release(p.bus); p.onEnd && p.onEnd();
}

/* ---------------- piano keys ---------------- */

const NAMES = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const isBlack = m => [1,3,6,8,10].includes(m % 12);
const noteName = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);
const hz = m => (440 * 2 ** ((m - 69) / 12)).toFixed(1);

/* A black key lives inside the white key to its left, so the layout is pure CSS
   and no position has to be computed or written into a style attribute. */
function keyboard(lo, hi, {cls = "", labelC = false} = {}){
  let h = `<div class="kb ${cls}" role="group" aria-label="Piano keys">`;
  for (let m = lo; m <= hi; m++){
    if (isBlack(m)) continue;
    const b = m + 1 <= hi && isBlack(m + 1);
    h += `<div class="kw"><button type="button" class="key w" data-midi="${m}" aria-label="${noteName(m)}">${labelC && m % 12 === 0 ? `<span>${noteName(m)}</span>` : ""}</button>`
      + (b ? `<button type="button" class="key b" data-midi="${m + 1}" aria-label="${noteName(m + 1)}"></button>` : "") + `</div>`;
  }
  return h + `</div>`;
}
function flash(scope, midis, ms = 300){
  if (!scope) return;
  for (const m of midis){
    $$(`.key[data-midi="${m}"]`, scope).forEach(k => {
      k.classList.add("lit");
      setTimeout(() => k.classList.remove("lit"), Math.max(120, ms));
    });
  }
}
function pressKey(k){
  const m = +k.dataset.midi;
  Sound.note(m, 0, .9, .8);
  k.classList.add("down");
  document.dispatchEvent(new CustomEvent("sv:note", {detail:{midi:m, key:k}}));
}
function releaseKey(k){ k && k.classList.remove("down"); }

/* A computer or iPad keyboard plays the visible keys too: A W S E D F T G Y H U J K. */
const QWERTY = "awsedftgyhujkolp;";
document.addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  if (e.target.closest && e.target.closest("input, textarea, select")) return;
  if ($(".scrim")) return;
  const i = QWERTY.indexOf(e.key.toLowerCase()); if (i < 0) return;
  const kb = $(".screen.on .kb"); if (!kb) return;
  const midis = $$(".key", kb).map(k => +k.dataset.midi);
  const base = midis.includes(60) ? 60 : Math.min(...midis.filter(m => m % 12 === 0));
  const k = $(`.key[data-midi="${base + i}"]`, kb); if (!k) return;
  pressKey(k); setTimeout(() => releaseKey(k), 160);
});

/* ---------------- dom shell ---------------- */

const app = $("#app"), screens = $("#screens"), layer = $("#layer");
let cur = null, cleanups = [];
const later = (fn, ms) => { const id = setTimeout(fn, ms); cleanups.push(() => clearTimeout(id)); return id; };
const announce = t => { const a = $("#announce"); a.textContent = ""; setTimeout(() => { a.textContent = t; }, 50); };

let toastTimer;
function toast(msg){
  const t = $("#toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("on"), 2600);
}

/* Values that can only be known at runtime are set through the CSSOM, which
   the page's CSP does not intercept; a style="" attribute in this markup would
   be blocked. */
function applyDyn(root){
  $$("[data-w]", root).forEach(el => { el.style.width = el.dataset.w + "%"; });
  $$("[data-h]", root).forEach(el => { el.style.height = el.dataset.h + "%"; });
}

function show(name, dir){
  cleanups.forEach(f => f()); cleanups = []; stopSong();
  const old = $(".screen.on", screens);
  const el = document.createElement("section");
  el.className = "screen " + (dir > 0 ? "in-r" : dir < 0 ? "in-l" : "in-f");
  el.dataset.screen = name;
  el.innerHTML = SCREENS[name].html();
  screens.append(el);
  applyDyn(el);
  SCREENS[name].mount && SCREENS[name].mount(el);
  updateFoot(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.classList.remove("in-r", "in-l", "in-f"); el.classList.add("on");
    if (old){
      old.classList.remove("on"); old.classList.add(dir < 0 ? "out-r" : "out-l");
      old.setAttribute("aria-hidden", "true"); old.inert = true;
      setTimeout(() => old.remove(), reduced() ? 0 : 520);
    }
  }));
  const h = $("h1", el); if (h) h.focus({preventScroll:true});
  announce(h ? h.textContent : name);
}

function route(){
  let name = (location.hash.match(/^#\/([\w-]+)/) || [])[1];
  if (!name) name = S.user ? "home" : "welcome";
  if (!SCREENS[name]) name = "welcome";
  if (name === "home" && !S.user) return go("welcome", true);
  if (name === "login" && S.user && !S.user.guest) return go("home", true);
  if (name === "plan" || name === "building") fillDefaults();
  if (name === cur) return;
  const dir = cur == null ? 0 : (Math.sign(RANK[name] - RANK[cur]) || 1);
  closeAll(); show(name, dir); cur = name;
}
function go(name, replace = false){
  const h = "#/" + name;
  if (location.hash === h) return route();
  if (replace) { location.replace(h); } else { location.hash = "/" + name; }
}
window.addEventListener("hashchange", route);

/* ---------------- onboarding steps ---------------- */

function qLayout({key, step, title, sub, body, skip = false, next = "Continue", foot = ""}){
  const segs = FLOW.map((_, i) => `<span class="${i < step ? "done" : i === step - 1 ? "now" : ""}"></span>`).join("");
  return `<div class="q q-${key}">
    <header class="qbar">
      <button class="iconbtn" type="button" data-back aria-label="Back">${I.back}</button>
      <div class="progress" role="progressbar" aria-label="Setup progress" aria-valuemin="0" aria-valuemax="${FLOW.length}" aria-valuenow="${step}">${segs}</div>
      ${skip ? `<button class="textbtn" type="button" data-skip>Skip</button>` : `<span class="qbar-sp"></span>`}
    </header>
    <div class="qbody">
      <div class="qhead">
        <p class="eyebrow">Step ${step} of ${FLOW.length}</p>
        <h1 tabindex="-1">${title}</h1>
        <p class="sub" id="qsub">${sub}</p>
      </div>
      <div class="qmain">${body}</div>
    </div>
    <footer class="qfoot"><p class="qnote" id="qnote">${foot}</p><button class="btn pri lg" type="button" data-next>${next}</button></footer>
  </div>`;
}

function tiles(list, key, {multi = false, max = 0, auto = false, cls = "", kind = "opt"} = {}){
  const sel = S.answers[key];
  const on = id => multi ? sel.includes(id) : sel === id;
  return `<div class="opts ${cls}" data-group data-multi="${multi ? 1 : 0}" data-max="${max}" data-auto="${auto ? 1 : 0}" role="group">`
    + list.map((o, i) => `<button type="button" class="${kind} ${kind}-${o.id}" data-key="${key}" data-val="${o.id}" data-i="${i}" aria-pressed="${on(o.id)}">`
      + (o.ic ? `<span class="opt-ic">${I[o.ic]}</span>` : "")
      + (kind === "lvl" ? `<span class="bars b${i + 1}"><i></i><i></i><i></i><i></i></span>` : "")
      + (kind === "genre" ? `<span class="eq"><i></i><i></i><i></i><i></i></span>` : "")
      + `<span class="opt-tx"><span class="opt-t">${o.t}</span>${o.d ? `<span class="opt-d">${o.d}</span>` : ""}</span>`
      + (o.tag ? `<span class="tag">${o.tag}</span>` : "")
      + `<span class="tick">${I.tick}</span></button>`).join("")
    + `</div>`;
}

function canContinue(name){
  const A = S.answers;
  return ({
    instrument: !!A.instrument, level: !!A.level, check: !!(A.check && A.check.done),
    goals: A.goals.length > 0, style: A.styles.length > 0, routine: !!A.minutes
  })[name] ?? true;
}
function updateFoot(el = $(".screen.on")){
  if (!el) return;
  const n = $("[data-next]", el); if (n) n.disabled = !canContinue(el.dataset.screen);
  const name = el.dataset.screen, note = $("#qnote", el);
  if (note && name === "goals") note.textContent = `${S.answers.goals.length} of 3 chosen`;
  if (note && name === "style") note.textContent = S.answers.styles.length ? `${S.answers.styles.length} chosen · tap again to remove` : "Choose as many as you like";
  if (name === "routine") routineSummary(el);
}
function nextStep(){
  const i = FLOW.indexOf(cur);
  if (i < 0 || !canContinue(cur)) return;
  go(i === FLOW.length - 1 ? "building" : FLOW[i + 1]);
}
function prevStep(){
  const i = FLOW.indexOf(cur);
  go(i <= 0 ? "welcome" : FLOW[i - 1]);
}
function skipStep(){
  if (cur === "check") S.answers.check = {done:false, skipped:true};
  save();
  const i = FLOW.indexOf(cur);
  go(i === FLOW.length - 1 ? "building" : FLOW[i + 1]);
}

function choose(btn){
  const key = btn.dataset.key, val = btn.dataset.val, A = S.answers;
  const group = btn.closest("[data-group]"), multi = group.dataset.multi === "1", max = +group.dataset.max || 99;
  let added = true;
  if (multi){
    const arr = A[key], i = arr.indexOf(val);
    if (i >= 0){ arr.splice(i, 1); added = false; }
    else if (arr.length >= max){
      group.classList.remove("nope"); void group.offsetWidth; group.classList.add("nope");
      toast(`Pick up to ${max}. Tap one to swap it out.`); return;
    } else arr.push(val);
  } else A[key] = key === "minutes" ? +val : val;
  if (key === "level" || key === "instrument") A.check = null;
  S.plan = null; save();
  $$(`[data-key="${key}"]`, group).forEach(b => {
    const v = b.dataset.val;
    b.setAttribute("aria-pressed", String(multi ? A[key].includes(v) : String(A[key]) === v));
  });
  if (added){
    if (key === "styles") phrase(MOTIFS[val], .5, .45);
    else Sound.note(BLIP[+btn.dataset.i % BLIP.length] + 12, 0, .35, .3);
  }
  updateFoot();
  if (!multi && group.dataset.auto === "1") later(nextStep, reduced() ? 120 : 420);
}

/* ---------------- step 3: hear your piano ---------------- */

let chk = null;
function mountCheck(el){
  const none = S.answers.instrument === "none";
  const tasks = levelIdx() >= 1 ? ["c4", "chord"] : ["c4"];
  const done = S.answers.check && S.answers.check.done;
  chk = {el, phase: done ? "done" : none ? "listen" : "primer", mode: none ? "screen" : (S.answers.check && S.answers.check.mode) || null,
    tasks, task:0, wrong:0, recent:[], energy:0, results: done ? S.answers.check.results || [] : [], denied:false};
  renderCheck();
  const onNote = e => checkNote(e.detail.midi);
  document.addEventListener("sv:note", onNote);
  cleanups.push(() => document.removeEventListener("sv:note", onNote));
  let raf = 0, t0 = performance.now();
  const loop = now => {
    const bars = $$(".wave i", el);
    if (bars.length){
      chk.energy *= .94;
      const live = chk.mode === "mic" ? .07 : .02;
      bars.forEach((b, i) => {
        const v = live + chk.energy * (.45 + .55 * Math.abs(Math.sin((now - t0) / 160 + i * .55))) + Math.random() * live;
        b.style.transform = `scaleY(${Math.min(1, v).toFixed(3)})`;
      });
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  cleanups.push(() => cancelAnimationFrame(raf));
}

function renderCheck(){
  const {el, phase, mode, tasks, task} = chk;
  const sub = $("#qsub", el), main = $(".qmain", el), h1 = $("h1", el);
  if (phase === "primer"){
    h1.innerHTML = `Let's <em>hear</em> your piano`;
    sub.textContent = "Survibe listens through the microphone to check your piano and hear where you're starting from.";
    main.innerHTML = `<div class="card mic">
      <div class="micviz" aria-hidden="true"><span class="ring r1"></span><span class="ring r2"></span><span class="ring r3"></span><span class="micic">${I.mic}</span></div>
      <ul class="ticks">
        <li>${I.tick}<span>Prop the iPad on the music stand, screen facing you.</span></li>
        <li>${I.tick}<span>Sound is analysed on this iPad. Nothing is recorded or uploaded.</span></li>
        <li>${I.tick}<span>${S.answers.instrument === "digital" || S.answers.instrument === "keyboard" ? "Prefer a cable? USB and Bluetooth MIDI work too, in Settings." : "A quiet room helps, but it isn't essential."}</span></li>
      </ul>
      <div class="row"><button class="btn pri lg" type="button" data-act="mic-allow">Turn on the microphone</button><button class="btn ghost lg" type="button" data-act="mic-screen">Use on-screen keys</button></div>
    </div>`;
  } else if (phase === "listen"){
    const t = tasks[task];
    h1.innerHTML = mode === "mic" ? `Let's <em>hear</em> your piano` : `Let's find <em>middle C</em>`;
    sub.textContent = mode === "mic"
      ? "Play each note on your piano when you're ready. Survibe waits for you."
      : chk.denied ? "No problem. The mic stays off, and you can turn it on later in Settings → Survibe."
      : "No piano nearby? These keys work the same way, and everything carries over when you get one.";
    main.innerHTML = `<div class="card listen">
      <div class="lhead"><span class="live mode-${mode}"><i></i>${mode === "mic" ? "Listening" : "On-screen keys"}</span><span class="taskno">${task + 1} of ${tasks.length}</span></div>
      <div class="ltask">
        <p class="ask">${t === "c4" ? `Play <b>middle C</b>` : `Now a <b>C major chord</b>: C, E and G together`}</p>
        <p class="hint" id="chkhint">${t === "c4" ? "It's the C nearest the middle of the keyboard." : "Thumb on C, middle finger on E, little finger on G."}</p>
      </div>
      <div class="lread">
        <div class="wave" aria-hidden="true">${"<i></i>".repeat(36)}</div>
        <div class="tuner" aria-live="polite"><b id="nname">—</b><span id="nhz">Waiting for a note</span><div class="meter"><span></span><i id="needle"></i></div></div>
      </div>
      ${keyboard(48, 72, {cls:"chk" + (t === "chord" ? " show-chord" : chk.wrong >= 2 ? " show-c" : ""), labelC:true})}
      <div class="lfoot">
        ${mode === "mic" ? `<span class="proto-tag">Prototype</span><span>Tap the keys here to stand in for your piano.</span>` : `<span>Tap a key, or use your keyboard: A&nbsp;S&nbsp;D&nbsp;F&nbsp;G&nbsp;H&nbsp;J&nbsp;K.</span>`}
        ${t === "c4" ? `<button class="textbtn" type="button" data-act="where-c">Where's middle C?</button>` : ""}
      </div>
    </div>`;
  } else {
    h1.innerHTML = `Sounds <em>great</em>`;
    sub.textContent = mode === "mic" ? "Your piano is in tune, and Survibe can hear it clearly from here." : "When you get a piano, Survibe will listen to it in just the same way.";
    main.innerHTML = `<div class="card done">
      <span class="bigtick">${I.tick}</span>
      <ul class="results">${(chk.results.length ? chk.results : ["Check complete"]).map(r => `<li>${I.tick}<span>${r}</span></li>`).join("")}</ul>
      <p>${chk.results.length > 1 ? "That's more than a first-timer plays, so your plan starts a step further on." : "That's the first thing every lesson builds on."}</p>
      <button class="textbtn" type="button" data-act="check-again">Try again</button>
    </div>`;
  }
  updateFoot(el);
}

function checkNote(m){
  if (!chk || chk.phase !== "listen") return;
  chk.energy = 1;
  const cents = chk.mode === "mic" ? Math.round((Math.random() - .5) * 8) : 0;
  const nn = $("#nname"), nh = $("#nhz"), nd = $("#needle"), hint = $("#chkhint");
  if (!hint) return;
  if (nn){ nn.textContent = noteName(m); nh.textContent = `${hz(m)} Hz · ${Math.abs(cents) <= 5 ? "in tune" : (cents > 0 ? "a touch sharp" : "a touch flat")}`; nd.style.transform = `rotate(${cents * 4}deg)`; }
  const t = chk.tasks[chk.task];
  if (t === "c4"){
    if (m === 60){ pass(`Middle C · C4 · ${hz(60)} Hz${chk.mode === "mic" ? " · in tune" : ""}`); return; }
    chk.wrong++;
    hint.textContent = `That's ${noteName(m)}. Middle C is ${m < 60 ? "further right" : "further left"}: the white key just left of the two black keys nearest the middle.`;
    if (chk.wrong >= 2) $(".kb", chk.el).classList.add("show-c");
  } else {
    const now = performance.now();
    chk.recent = chk.recent.filter(r => now - r.t < 1500).concat({m, t:now});
    const pcs = new Set(chk.recent.map(r => r.m % 12));
    if (pcs.has(0) && pcs.has(4) && pcs.has(7)){ pass("C major chord · all three notes together"); return; }
    hint.textContent = `Heard ${[...new Set(chk.recent.map(r => noteName(r.m)))].join(", ")}. Keep going: press them close together.`;
  }
}
function pass(result){
  chk.results.push(result);
  Sound.note(84, .25, .4, .25); Sound.note(91, .38, .6, .25);
  if (chk.task < chk.tasks.length - 1){
    chk.task++; chk.wrong = 0; chk.recent = [];
    later(renderCheck, 650);
  } else {
    S.answers.check = {done:true, chord:chk.results.length > 1, mode:chk.mode, results:chk.results.slice()};
    S.plan = null; save();
    later(() => { chk.phase = "done"; renderCheck(); }, 650);
  }
}

/* ---------------- step 6: routine ---------------- */

function routineSummary(el){
  const out = $("#routinesum", el); if (!out) return;
  const m = S.answers.minutes || 15, wk = m * 6;
  const time = TIMES.find(t => t.id === S.answers.time);
  out.innerHTML = `About <b>${wk >= 60 ? `${Math.floor(wk / 60)}h${wk % 60 ? ` ${wk % 60}m` : ""}` : `${wk} min`}</b> a week. At that pace your first full song is about <b>${daysToSong(levelIdx(), m)} days</b> away.`
    + (S.answers.remind && time ? ` We'll remind you at ${time.at}.` : "");
  const sw = $("[data-act=remind]", el); if (sw) sw.setAttribute("aria-checked", String(!!S.answers.remind));
}

/* ---------------- screens ---------------- */

const SCREENS = {
  welcome:{
    html:() => `<div class="welcome">
      <div class="glow" aria-hidden="true"></div>
      <header class="wtop">${LOGO}<button class="textbtn" type="button" data-go="login">Log in</button></header>
      <div class="wgrid">
        <div class="wcopy">
          <p class="pill"><i></i>Piano &amp; keyboard · made for iPad</p>
          <h1 tabindex="-1">Learn piano <em>without</em> losing the joy.</h1>
          <p class="lede">Answer a few quick questions and Survibe builds a plan around your piano, your music and the time you actually have.</p>
          <div class="cta">
            <button class="btn pri xl" type="button" data-go="instrument">Get started</button>
            <button class="btn ghost xl" type="button" data-go="login">I have an account</button>
          </div>
          <p class="fine">About a minute. You'll see your plan before you're asked to sign up.</p>
        </div>
        <div class="wstage">
          <div class="device-mock">
            <div class="mock-top"><b>Ode to Joy</b><span>bar 3</span><em id="wscore">—</em></div>
            <div class="roll" id="roll"><span class="hitline"></span></div>
            ${keyboard(60, 76, {cls:"wkb"})}
          </div>
          <p class="hint">Go on, tap the keys.</p>
        </div>
      </div>
      <ul class="values">
        <li><b>Hears your real piano</b><span>No cables, no adapters</span></li>
        <li><b>Real songs from day one</b><span>Not six months of scales</span></li>
        <li><b>Fifteen minutes counts</b><span>Built for the practice you'll do</span></li>
      </ul>
    </div>`,
    mount(el){
      const roll = $("#roll", el), kb = $(".kb", el), score = $("#wscore", el);
      const seq = SONGS.ode.notes; let i = 0, timer = 0;
      const lead = reduced() ? 0 : 1800;
      const xOf = m => {
        const k = $(`.key[data-midi="${m}"]`, kb); if (!k) return null;
        const left = k.classList.contains("b") ? k.parentElement.offsetLeft + k.offsetLeft : k.parentElement.offsetLeft;
        return {left, width:k.offsetWidth, black:k.classList.contains("b")};
      };
      const spawn = (m, up = false) => {
        const x = xOf(m); if (!x) return;
        const b = document.createElement("span");
        b.className = "fall" + (x.black ? " blk" : "") + (up ? " up" : "");
        b.style.left = (x.left + 3) + "px"; b.style.width = (x.width - 6) + "px";
        roll.append(b);
        const H = roll.clientHeight, bh = 26;
        if (reduced()){ b.remove(); return; }
        const anim = up
          ? b.animate([{transform:`translateY(${H - bh}px)`, opacity:1}, {transform:`translateY(${H * .2}px)`, opacity:0}], {duration:900, easing:"cubic-bezier(.2,.7,.3,1)"})
          : b.animate([{transform:`translateY(-${bh}px)`}, {transform:`translateY(${H - bh}px)`}], {duration:lead, easing:"linear"});
        anim.onfinish = () => { b.remove(); if (!up) flash(kb, [m], 260); };
      };
      const tick = () => {
        const [m, beats] = seq[i % seq.length]; i++;
        spawn(m);
        timer = setTimeout(tick, beats * 520);
      };
      timer = setTimeout(tick, 400);
      cleanups.push(() => clearTimeout(timer));
      const onNote = e => {
        if (!kb.contains(e.detail.key)) return;
        spawn(e.detail.midi, true);
        score.textContent = noteName(e.detail.midi);
      };
      document.addEventListener("sv:note", onNote);
      cleanups.push(() => document.removeEventListener("sv:note", onNote));
    }
  },

  instrument:{
    html:() => qLayout({key:"instrument", step:1,
      title:`What will you <em>play</em> on?`,
      sub:"Survibe listens through the iPad's microphone, so any real piano works. No cables.",
      body:tiles(INSTRUMENTS, "instrument", {auto:true, cls:"opts-4 big"})})
  },

  level:{
    html:() => qLayout({key:"level", step:2,
      title:`How much have you <em>played</em>?`,
      sub:"Be honest. Survibe adjusts the moment it hears you play, so you can't get this wrong.",
      body:tiles(LEVELS, "level", {auto:true, cls:"opts-list", kind:"lvl"})})
  },

  check:{
    html:() => qLayout({key:"check", step:3, skip:true, title:`Let's <em>hear</em> your piano`, sub:"", body:""}),
    mount:mountCheck
  },

  goals:{
    html:() => qLayout({key:"goals", step:4,
      title:`What do you want <em>piano</em> to give you?`,
      sub:"Pick up to three. Your plan leans towards the first one you choose.",
      body:tiles(GOALS, "goals", {multi:true, max:3, cls:"opts-grid"}), foot:""})
  },

  style:{
    html:() => qLayout({key:"style", step:5, skip:true,
      title:`What music <em>moves</em> you?`,
      sub:"Your first songs come from these. Tap one to hear a little of it.",
      body:tiles(STYLES, "styles", {multi:true, cls:"opts-genres", kind:"genre"})})
  },

  routine:{
    html:() => qLayout({key:"routine", step:6, next:"Build my plan",
      title:`How much time can you <em>give</em> it?`,
      sub:"Short and often beats long and rare. You can change this any time.",
      body:`<div class="routine">
        ${tiles(MINUTES, "minutes", {cls:"opts-mins", kind:"mins"})}
        <div class="rrow">
          <div class="rcol"><h2 class="lab">When do you usually practise?</h2>${tiles(TIMES, "time", {cls:"opts-chips", kind:"chip"})}</div>
          <div class="rcol remind"><h2 class="lab">Reminders</h2>
            <button class="switchrow" type="button" role="switch" aria-checked="${!!S.answers.remind}" data-act="remind">
              <span class="sw-ic">${I.bell}</span><span class="sw-tx"><b>Remind me to practise</b><span>One nudge a day, never more</span></span><span class="sw"><i></i></span>
            </button>
          </div>
        </div>
        <p class="rsum" id="routinesum" aria-live="polite"></p>
      </div>`})
  },

  building:{
    html:() => {
      const A = S.answers, styles = (A.styles.length ? A.styles : ["classical"]).map(s => label(STYLES, s)).slice(0, 2).join(" & ");
      const steps = ["Reading your answers", `Matching lessons to “${label(LEVELS, A.level).toLowerCase()}”`, `Choosing first songs from ${styles}`, `Fitting it all into ${A.minutes}-minute days`];
      return `<div class="building">
        <div class="eqbig" aria-hidden="true">${"<i></i>".repeat(9)}</div>
        <h1 tabindex="-1">Building your plan…</h1>
        <ol class="bsteps">${steps.map(s => `<li><span class="bdot">${I.tick}</span>${esc(s)}</li>`).join("")}</ol>
      </div>`;
    },
    mount(el){
      const items = $$(".bsteps li", el), step = reduced() ? 200 : 650;
      items.forEach((li, i) => later(() => {
        li.classList.add("on");
        Sound.note([60, 64, 67, 72][i], 0, .5, .25);
      }, 250 + i * step));
      later(() => {
        S.plan = makePlan(S.answers); save();
        go("plan", true);
      }, 250 + items.length * step + 350);
    }
  },

  plan:{
    html:() => {
      const P = S.plan, A = S.answers, first = SONGS[P.songs[0]];
      const notes = first.notes.flatMap(([n]) => Array.isArray(n) ? n : [n]);
      const lo = Math.floor(Math.min(...notes) / 12) * 12, hi = Math.ceil((Math.max(...notes) + 1) / 12) * 12;
      const u = S.user;
      const foot = u && !u.guest
        ? `<p class="pnote">Saved to ${esc(u.email)}</p><div class="pbtns"><button class="btn pri lg" type="button" data-go="home">Go to home</button></div>`
        : `<p class="pnote">${u && u.guest ? "Guest mode · saved on this iPad only" : "Free account · no card needed"}</p>
           <div class="pbtns"><button class="btn ghost lg" type="button" data-act="guest">${u && u.guest ? "Back to home" : "Continue as guest"}</button>
           <button class="btn pri lg" type="button" data-act="signup">Save my plan</button></div>`;
      return `<div class="plan">
        <header class="pbar"><button class="backlink" type="button" data-go="routine">${I.back}<span>Edit answers</span></button>${LOGO}${u ? `<span class="qbar-sp"></span>` : `<button class="textbtn" type="button" data-go="login">Log in</button>`}</header>
        <div class="pgrid">
          <div class="pleft">
            <p class="eyebrow">Your plan is ready</p>
            <h1 tabindex="-1"><em>${esc(P.track.name)}</em></h1>
            <p class="sub">${esc(P.track.line)}</p>
            <dl class="stats">
              <div><dt>Every day</dt><dd>${P.minutes}<small>min</small></dd></div>
              <div><dt>First full song</dt><dd>~${P.days}<small>days</small></dd></div>
              <div><dt>Songs lined up</dt><dd>${P.songs.length}</dd></div>
            </dl>
            <div class="why"><h2 class="lab">Built from your answers</h2><ul>${P.reasons.map(r => `<li>${I.tick}<span>${esc(r)}</span></li>`).join("")}</ul></div>
          </div>
          <div class="pright">
            <h2 class="lab">Your first month</h2>
            <ol class="journey">
              ${P.weeks.slice(0, 3).map((w, i) => `<li><span class="node">${i + 1}</span><div><p class="wk">Week ${i + 1}</p><p class="wt">${esc(w.t)}</p><p class="wd">${esc(w.d)}</p></div></li>`).join("")}
              <li class="goal"><span class="node">${I.note}</span><div class="songcard cover-${first.style}">
                <div class="sc-top"><div><p class="wk">Week 4 · your first song</p><p class="st">${esc(first.t)}</p><p class="sb">${esc(first.by)}</p></div>
                <button class="playbtn" type="button" data-act="preview" data-song="${P.songs[0]}" aria-label="Play a preview of ${esc(first.t)}">${I.play}</button></div>
                ${keyboard(lo, hi, {cls:"mini"})}
              </div></li>
            </ol>
            <div class="more"><span>Also lined up</span>${P.songs.slice(1).map(id => `<button class="chip song" type="button" data-act="preview-chip" data-song="${id}">${I.play}<span>${esc(SONGS[id].t)}</span></button>`).join("")}</div>
          </div>
        </div>
        <footer class="pfoot">${foot}</footer>
      </div>`;
    },
    mount(){
      if (!S.user) later(() => toast(`Plan built for ${label(INSTRUMENTS, S.answers.instrument).toLowerCase()} · ${S.answers.minutes} min a day`), 700);
    }
  },

  login:{
    html:() => `<div class="login">
      <aside class="lart" aria-hidden="true" inert>
        <div class="glow"></div>
        ${LOGO}
        <blockquote>Nobody quits piano because it's hard. They quit because six weeks in, they still can't play anything they'd want to hear.</blockquote>
        <div class="lkeys">${keyboard(60, 83, {cls:"deco"})}</div>
      </aside>
      <div class="lform">
        <header class="lbar"><button class="iconbtn" type="button" data-go="welcome" aria-label="Back">${I.back}</button></header>
        <div class="lbody" id="lbody">${loginForm()}</div>
      </div>
    </div>`,
    mount(el){ bindLogin(el); }
  },

  home:{
    html:() => homeHTML()
  }
};
for (const k of ["instrument", "level", "goals", "style", "routine"]) SCREENS[k].mount = el => updateFoot(el);

/* ---------------- login ---------------- */

function loginForm(prefill = ""){
  return `<h1 tabindex="-1">Welcome <em>back</em></h1>
    <p class="sub">Log in to pick up your plan, your songs and your streak.</p>
    <div class="social">
      <button class="btn apple lg" type="button" data-act="apple" data-ctx="login">${I.apple}<span>Continue with Apple</span></button>
      <button class="btn google lg" type="button" data-act="google" data-ctx="login">${I.google}<span>Continue with Google</span></button>
    </div>
    <div class="or"><span>or with email</span></div>
    <form class="form" id="loginform" novalidate>
      <label class="field"><span>Email</span><input id="lemail" type="email" autocomplete="username" inputmode="email" autocapitalize="off" spellcheck="false" value="${esc(prefill)}" required></label>
      <div class="field"><span class="pwlab"><label for="lpw">Password</label><button class="textbtn" type="button" data-act="forgot">Forgot password?</button></span><span class="pw"><input id="lpw" type="password" autocomplete="current-password" required><button class="iconbtn sm" type="button" data-act="showpw" aria-label="Show password">${I.eye}</button></span></div>
      <p class="err" id="lerr" role="alert"></p>
      <button class="btn pri lg full" type="submit" id="lsubmit">Log in</button>
    </form>
    <div class="demo"><span class="proto-tag">Prototype</span><span>Demo account <b>riya@survibe.in</b> · <b>piano123</b>, or any account you've made here.</span><button class="textbtn" type="button" data-act="fill-demo">Fill in</button></div>
    <p class="switch">New to Survibe? <button class="textbtn" type="button" data-go="instrument">Build your plan first</button></p>`;
}
function bindLogin(el){
  const f = $("#loginform", el); if (!f) return;
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("#lemail", el).value, pw = $("#lpw", el).value, err = $("#lerr", el), b = $("#lsubmit", el);
    err.textContent = "";
    if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Enter the email you signed up with."; $("#lemail", el).focus(); return; }
    if (!pw) { err.textContent = "Enter your password."; $("#lpw", el).focus(); return; }
    busy(b, true, "Logging in");
    try {
      const u = await api.logIn({email, password:pw});
      signedIn(u, `Welcome back, ${u.name.split(" ")[0]}.`);
    } catch (x){
      busy(b, false, "Log in");
      f.classList.remove("nope"); void f.offsetWidth; f.classList.add("nope");
      err.innerHTML = {
        nouser:`There's no account with that email. <button class="textbtn" type="button" data-go="instrument">Build a plan and sign up</button>`,
        badpw:"That password doesn't match. Try again, or use “Forgot password?”.",
        social:`This account uses ${x.provider === "apple" ? "Sign in with Apple" : "Google"}. Use that button above.`
      }[x.code] || "Something went wrong. Try again.";
    }
  });
}
function busy(b, on, text){
  b.disabled = on; b.classList.toggle("busy", on);
  b.innerHTML = on ? `<span class="spin"></span>${text}…` : text;
}

function signedIn(u, msg){
  S.user = u;
  if (u.plan) S.plan = u.plan;
  if (u.answers) S.answers = u.answers;
  save(); closeAll();
  if (location.hash === "#/home") rerender(); else go("home", true);
  if (msg) setTimeout(() => toast(msg), 500);
}

/* ---------------- home ---------------- */

function greet(){ const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }
function homeHTML(){
  const u = S.user || {guest:true}, first = u.guest ? "" : u.name.split(" ")[0];
  const initials = u.guest ? "G" : u.name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  if (u.returning){
    const week = [12, 15, 0, 18, 15, 20, 9], max = 20, days = ["M","T","W","T","F","S","S"];
    return `<div class="home">
      <header class="htop">${LOGO}<div class="htop-r"><span class="streak">${I.flame}<b>12</b> day streak</span><button class="avatar" type="button" data-act="account" aria-label="Account">${initials}</button></div></header>
      <div class="hgrid">
        <div class="hmain">
          <p class="eyebrow">${greet()}, ${esc(first)}</p>
          <h1 tabindex="-1">Pick up where you <em>left off</em></h1>
          <article class="today cover-classical">
            <div class="t-tx"><p class="kick">Continue · Reading Fluency</p><p class="tt">Für Elise</p><p class="td">Bar 9 of 24 · the left-hand jump you keep missing</p>
            <div class="bar"><i data-w="64"></i></div><p class="td small">64% learned · 3 sessions to go</p></div>
            <button class="btn pri lg" type="button" data-act="lesson">Continue</button>
          </article>
          <div class="upnext"><h2 class="lab">Up next</h2>
            <button class="row-item" type="button" data-act="lesson"><span class="ri-ic">${I.staff}</span><span><b>Sight-reading: bass clef</b><small>7 min · Reading</small></span></button>
            <button class="row-item" type="button" data-act="lesson"><span class="ri-ic">${I.metro}</span><span><b>Even sixteenths at 80 bpm</b><small>5 min · Technique</small></span></button>
          </div>
        </div>
        <aside class="hside">
          <div class="card week"><h2 class="lab">This week</h2><p class="big">89<small> min</small></p>
            <div class="chart" role="img" aria-label="Minutes practised each day this week: 12, 15, 0, 18, 15, 20, 9">${week.map((v, i) => `<div><i data-h="${Math.max(3, v / max * 100)}"${v ? "" : ` class="zero"`}></i><span>${days[i]}</span></div>`).join("")}</div>
            <p class="td small">Best week this month. Wednesday off didn't break your streak.</p>
          </div>
        </aside>
      </div>
    </div>`;
  }
  const P = S.plan || makePlan(S.answers), L = P.lesson, time = TIMES.find(t => t.id === S.answers.time);
  return `<div class="home">
    <header class="htop">${LOGO}<div class="htop-r"><span class="streak">${I.flame}<b>0</b> day streak</span><button class="avatar ${u.guest ? "guest" : ""}" type="button" data-act="account" aria-label="Account">${initials}</button></div></header>
    ${u.guest ? `<div class="banner"><span class="b-ic">${I.lock}</span><p><b>You're practising as a guest.</b> Your plan lives on this iPad only. Make a free account to keep it safe.</p><button class="btn pri" type="button" data-act="signup">Create account</button></div>` : ""}
    <div class="hgrid">
      <div class="hmain">
        <p class="eyebrow">${greet()}${first ? `, ${esc(first)}` : ""}</p>
        <h1 tabindex="-1">Day one. <em>Let's play.</em></h1>
        <article class="today cover-${SONGS[P.songs[0]].style}">
          <div class="t-tx"><p class="kick">Today · Lesson 1 · ${esc(P.track.name)}</p><p class="tt">${esc(L.t)}</p><p class="td">${Math.min(L.min, P.minutes)} min · ${esc(L.d)}</p></div>
          <button class="btn pri lg" type="button" data-act="lesson">Start lesson</button>
        </article>
        <div class="chips-row">
          ${S.answers.remind && time ? `<span class="chip static">${I.bell}Reminder at ${time.at}</span>` : `<button class="chip" type="button" data-act="remind-home">${I.bell}Set a daily reminder</button>`}
          <span class="chip static">${I.note}First song: ${esc(SONGS[P.songs[0]].t)}</span>
        </div>
        <div class="upnext"><h2 class="lab">Your songs</h2>
          ${P.songs.map((id, i) => `<button class="row-item" type="button" data-act="preview-chip" data-song="${id}"><span class="ri-ic cover-${SONGS[id].style}">${I.play}</span><span><b>${esc(SONGS[id].t)}</b><small>${esc(SONGS[id].by)} · ${i === 0 ? "week 4" : "after that"}</small></span></button>`).join("")}
        </div>
      </div>
      <aside class="hside">
        <div class="card month"><h2 class="lab">Your first month</h2>
          <ol class="journey compact">${P.weeks.map((w, i) => `<li class="${i === 0 ? "now" : ""}"><span class="node">${i === 3 ? I.note : i + 1}</span><div><p class="wk">Week ${i + 1}${i === 0 ? " · now" : ""}</p><p class="wt">${esc(w.t)}</p></div></li>`).join("")}</ol>
          <button class="textbtn" type="button" data-go="plan">See the full plan</button>
        </div>
      </aside>
    </div>
  </div>`;
}

/* ---------------- sheets and alerts ---------------- */

let lastFocus = null;
function openSheet(html, {cls = "", dismiss = true, mount} = {}){
  lastFocus = document.activeElement;
  const scrim = document.createElement("div");
  scrim.className = "scrim" + (cls.includes("alert") ? " clear" : "");
  scrim.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  layer.append(scrim);
  $$(".screen", screens).forEach(s => { s.inert = true; });
  const sheet = scrim.firstElementChild;
  if (dismiss) scrim.addEventListener("click", e => { if (e.target === scrim) closeSheet(scrim); });
  scrim.dataset.dismiss = dismiss ? "1" : "0";
  mount && mount(sheet);
  requestAnimationFrame(() => requestAnimationFrame(() => scrim.classList.add("on")));
  const f = $("h2, [autofocus], button, input", sheet);
  if (f){ if (f.tagName === "H2") f.setAttribute("tabindex", "-1"); f.focus({preventScroll:true}); }
  return sheet;
}
function closeSheet(scrim){
  scrim = scrim && scrim.closest ? scrim.closest(".scrim") : $$(".scrim", layer).pop();
  if (!scrim || scrim.classList.contains("closing")) return;
  scrim.classList.add("closing"); scrim.classList.remove("on");
  setTimeout(() => {
    scrim.remove();
    if (!$(".scrim", layer)){ const s = $(".screen.on", screens); if (s) s.inert = false; }
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({preventScroll:true});
  }, reduced() ? 0 : 280);
}
function closeAll(){ $$(".scrim", layer).forEach(s => s.remove()); $$(".screen.on", screens).forEach(s => { s.inert = false; }); }

/* An iPadOS-style system prompt. The real one is drawn by the OS; this stands in
   for it and says so. */
function sysAlert({title, msg, buttons}){
  return new Promise(res => {
    const sheet = openSheet(`<p class="proto-tag">Simulated system prompt</p><h2>${title}</h2><p>${msg}</p>
      <div class="abtns">${buttons.map((b, i) => `<button type="button" class="${b.bold ? "bold" : ""}" data-i="${i}">${b.label}</button>`).join("")}</div>`, {cls:"alert", dismiss:false});
    sheet.addEventListener("click", e => {
      const b = e.target.closest("[data-i]"); if (!b) return;
      closeSheet(sheet); res(buttons[+b.dataset.i].value);
    });
  });
}

function planMini(){
  const P = S.plan; if (!P) return "";
  return `<div class="planmini"><span class="pm-cover cover-${SONGS[P.songs[0]].style}">${I.note}</span><div><b>${esc(P.track.name)}</b><span>${P.minutes} min a day · ${esc(SONGS[P.songs[0]].t)} in ~${P.days} days</span></div></div>`;
}

function openSignup(view = "choose"){
  const sheet = openSheet(`<div class="su" id="su"></div>`, {cls:"signup"});
  renderSignup(sheet, view);
}
function renderSignup(sheet, view, data = {}){
  const box = $("#su", sheet);
  if (view === "choose"){
    box.innerHTML = `<header class="shead"><span></span><button class="iconbtn" type="button" data-act="close" aria-label="Close">${I.close}</button></header>
      <h2 tabindex="-1">Save your <em>plan</em></h2>
      <p class="sub">A free account keeps your plan, streak and progress safe, and in sync if you switch iPads.</p>
      ${planMini()}
      <div class="social">
        <button class="btn apple lg" type="button" data-act="apple" data-ctx="signup">${I.apple}<span>Continue with Apple</span></button>
        <button class="btn google lg" type="button" data-act="google" data-ctx="signup">${I.google}<span>Continue with Google</span></button>
        <button class="btn ghost lg" type="button" data-act="su-email">${I.mail}<span>Continue with email</span></button>
      </div>
      <p class="legal">By continuing you agree to Survibe's <button class="textbtn" type="button" data-act="legal">Terms</button> and <button class="textbtn" type="button" data-act="legal">Privacy Policy</button>.</p>
      <p class="switch">Already have an account? <button class="textbtn" type="button" data-act="to-login">Log in</button></p>`;
  } else if (view === "email"){
    box.innerHTML = `<header class="shead"><button class="iconbtn" type="button" data-act="su-back" aria-label="Back">${I.back}</button><button class="iconbtn" type="button" data-act="close" aria-label="Close">${I.close}</button></header>
      <h2 tabindex="-1">Create your <em>account</em></h2>
      <form class="form" id="suform" novalidate>
        <label class="field"><span>Your name</span><input id="sname" type="text" autocomplete="name" autocapitalize="words" value="${esc(data.name || "")}" required></label>
        <label class="field"><span>Email</span><input id="semail" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" value="${esc(data.email || "")}" required></label>
        <label class="field"><span>Password</span><span class="pw"><input id="spw" type="password" autocomplete="new-password" minlength="8" required><button class="iconbtn sm" type="button" data-act="showpw" aria-label="Show password">${I.eye}</button></span>
          <span class="strength"><i id="sbar" data-w="0"></i></span><small id="shint">At least 8 characters.</small></label>
        <p class="err" id="serr" role="alert"></p>
        <button class="btn pri lg full" type="submit" id="ssubmit">Create account</button>
      </form>`;
    const f = $("#suform", box), pw = $("#spw", box);
    pw.addEventListener("input", () => {
      const v = pw.value, score = Math.min(4, (v.length >= 8) + (v.length >= 12) + /[A-Z]/.test(v) + /[0-9\W]/.test(v));
      const bar = $("#sbar", box);
      bar.style.width = (v ? Math.max(12, score * 25) : 0) + "%";
      bar.className = "s" + score;
      $("#shint", box).textContent = !v ? "At least 8 characters." : v.length < 8 ? `${8 - v.length} more character${8 - v.length === 1 ? "" : "s"}.` : ["Weak", "Okay", "Good", "Strong", "Very strong"][score] + " password.";
    });
    f.addEventListener("submit", async e => {
      e.preventDefault();
      const name = $("#sname", box).value.trim(), email = $("#semail", box).value.trim(), err = $("#serr", box), b = $("#ssubmit", box);
      err.textContent = "";
      const bad = (msg, id) => { err.textContent = msg; $(id, box).focus(); f.classList.remove("nope"); void f.offsetWidth; f.classList.add("nope"); };
      if (!name) return bad("What should we call you?", "#sname");
      if (!/^\S+@\S+\.\S+$/.test(email)) return bad("That doesn't look like an email address.", "#semail");
      if (pw.value.length < 8) return bad("Your password needs at least 8 characters.", "#spw");
      busy(b, true, "Creating your account");
      try {
        const u = await api.signUp({name, email, password:pw.value});
        renderSignup(sheet, "success", u);
      } catch (x){
        busy(b, false, "Create account");
        if (x.code === "exists") err.innerHTML = `There's already an account for ${esc(email)}. <button class="textbtn" type="button" data-act="to-login" data-email="${esc(email)}">Log in instead</button>`;
        else err.textContent = "Something went wrong. Try again.";
      }
    });
    $("#sname", box).focus();
    return;
  } else if (view === "success"){
    box.innerHTML = `<div class="success"><span class="bigtick">${I.tick}</span><h2 tabindex="-1">You're in, ${esc(data.name.split(" ")[0])}.</h2><p class="sub">Your plan is saved to ${esc(data.email)}.</p></div>`;
    phrase([[60, .25], [64, .25], [67, .25], [[60, 64, 72], 1]], .5, .4);
    setTimeout(() => signedIn(data), reduced() ? 400 : 1300);
  }
  const h = $("h2", box); if (h) h.focus({preventScroll:true});
}

/* Apple and Google sign-in are OS and browser sheets in reality. These stand in
   for them, are labelled as simulated, and use made-up people. */
function openApple(ctx){
  const sheet = openSheet(`<header class="shead"><span class="proto-tag">Simulated</span><button class="iconbtn" type="button" data-act="close" aria-label="Cancel">${I.close}</button></header>
    <div class="idp"><span class="idp-logo apple-logo">${I.apple}</span>
      <h2 tabindex="-1">${ctx === "login" ? "Sign in to Survibe" : "Create a Survibe account"}</h2>
      <p class="sub">with your Apple Account</p>
      ${ctx === "login" ? "" : `<label class="field"><span>Name</span><input id="aname" type="text" value="Aarav Sharma"></label>
      <div class="radio" role="radiogroup" aria-label="Email to share">
        <button type="button" role="radio" aria-checked="true" data-act="apple-mail" data-v="share"><b>Share my email</b><span>aarav.sharma@icloud.com</span></button>
        <button type="button" role="radio" aria-checked="false" data-act="apple-mail" data-v="hide"><b>Hide my email</b><span>Forwards from a private relay address</span></button>
      </div>`}
      <button class="btn apple lg full" type="button" data-act="apple-go" data-ctx="${ctx}">Continue</button>
      <div class="faceid" aria-hidden="true">${I.faceid}</div>
    </div>`, {cls:"idp-sheet"});
  return sheet;
}
async function appleGo(btn){
  const sheet = btn.closest(".sheet"), ctx = btn.dataset.ctx;
  const hide = $("[data-v=hide][aria-checked=true]", sheet);
  const name = ($("#aname", sheet) || {}).value || "Aarav Sharma";
  const email = hide ? "k7x2pq9m@relay.example" : "aarav.sharma@icloud.com";
  sheet.classList.add("scanning");
  await wait(reduced() ? 200 : 1100);
  const found = await api.social("apple", {email});
  closeSheet(sheet);
  if (found) return signedIn(found, `Welcome back, ${found.name.split(" ")[0]}.`);
  if (ctx === "login") return noAccount("Apple");
  const u = await api.signUp({name, email, provider:"apple"});
  closeAll(); signedIn(u, `You're in, ${u.name.split(" ")[0]}. Your plan is saved.`);
}
function openGoogle(ctx){
  const people = [
    {name:"Riya Kulkarni", email:"riya@survibe.in", note:"Has a Survibe account"},
    {name:"Aarav Sharma", email:"aarav.sharma@gmail.com", note:"New to Survibe"}
  ];
  openSheet(`<header class="shead"><span class="proto-tag">Simulated</span><button class="iconbtn" type="button" data-act="close" aria-label="Cancel">${I.close}</button></header>
    <div class="idp"><span class="idp-logo">${I.google}</span><h2 tabindex="-1">Choose an account</h2><p class="sub">to continue to Survibe</p>
    <div class="accounts">${people.map(p => `<button type="button" class="acct" data-act="google-go" data-ctx="${ctx}" data-name="${esc(p.name)}" data-email="${esc(p.email)}"><span class="av">${p.name[0]}</span><span><b>${esc(p.name)}</b><small>${esc(p.email)}</small></span><em>${p.note}</em></button>`).join("")}
    <button type="button" class="acct other" data-act="legal"><span class="av">+</span><span><b>Use another account</b></span></button></div></div>`, {cls:"idp-sheet"});
}
async function googleGo(btn){
  const sheet = btn.closest(".sheet"), ctx = btn.dataset.ctx, email = btn.dataset.email, name = btn.dataset.name;
  sheet.classList.add("scanning"); btn.classList.add("busy");
  const found = await api.social("google", {email});
  closeSheet(sheet);
  if (found) return signedIn(found, ctx === "signup" ? `You already had an account, ${found.name.split(" ")[0]}, so we've logged you in.` : `Welcome back, ${found.name.split(" ")[0]}.`);
  if (ctx === "login") return noAccount("Google");
  const u = await api.signUp({name, email, provider:"google"});
  closeAll(); signedIn(u, `You're in, ${u.name.split(" ")[0]}. Your plan is saved.`);
}
function noAccount(provider){
  openSheet(`<header class="shead"><span></span><button class="iconbtn" type="button" data-act="close" aria-label="Close">${I.close}</button></header>
    <h2 tabindex="-1">No Survibe account <em>yet</em></h2>
    <p class="sub">That ${provider} account isn't linked to Survibe. Answer a few questions first, and you can save your plan with ${provider} at the end.</p>
    <div class="row"><button class="btn pri lg" type="button" data-act="start-setup">Build my plan</button><button class="btn ghost lg" type="button" data-act="close">Not now</button></div>`, {cls:"small"});
}

function openForgot(){
  const prefill = ($("#lemail") || {}).value || "";
  const sheet = openSheet(`<header class="shead"><span></span><button class="iconbtn" type="button" data-act="close" aria-label="Close">${I.close}</button></header>
    <div id="fg"><h2 tabindex="-1">Reset your <em>password</em></h2><p class="sub">We'll email you a link to choose a new one.</p>
    <form class="form" id="fgform" novalidate><label class="field"><span>Email</span><input id="fgemail" type="email" autocomplete="email" inputmode="email" autocapitalize="off" value="${esc(prefill)}"></label>
    <p class="err" id="fgerr" role="alert"></p><button class="btn pri lg full" type="submit" id="fgsubmit">Send reset link</button></form></div>`, {cls:"small"});
  $("#fgform", sheet).addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("#fgemail", sheet).value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)){ $("#fgerr", sheet).textContent = "Enter the email you signed up with."; return; }
    busy($("#fgsubmit", sheet), true, "Sending");
    await api.resetPassword(email);
    $("#fg", sheet).innerHTML = `<div class="success"><span class="bigtick">${I.mail}</span><h2 tabindex="-1">Check your inbox</h2><p class="sub">If there's an account for ${esc(email)}, a reset link is on its way. It works for 30 minutes.</p><button class="btn ghost lg" type="button" data-act="close">Back to log in</button></div>`;
    $("h2", sheet).focus();
  });
}

function openAccount(){
  const u = S.user;
  openSheet(`<header class="shead"><span></span><button class="iconbtn" type="button" data-act="close" aria-label="Close">${I.close}</button></header>
    <div class="acctcard"><span class="avatar big ${u.guest ? "guest" : ""}">${u.guest ? "G" : u.name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()}</span>
    <h2 tabindex="-1">${u.guest ? "Guest" : esc(u.name)}</h2><p class="sub">${u.guest ? "Your plan is saved on this iPad only." : esc(u.email) + (u.provider && u.provider !== "email" ? ` · ${u.provider === "apple" ? "Apple" : "Google"}` : "")}</p></div>
    <div class="list">
      ${u.guest ? `<button type="button" data-act="signup-from-menu">Create a free account</button>` : ""}
      <button type="button" data-go="plan" data-act="close">View my plan</button>
      <button type="button" class="danger" data-act="signout">${u.guest ? "Leave guest mode" : "Log out"}</button>
    </div>`, {cls:"small"});
}

/* ---------------- prototype controls ---------------- */

const JUMPS = [["welcome","Welcome"],["login","Log in"],["instrument","1 · Instrument"],["level","2 · Level"],["check","3 · Hear your piano"],
  ["goals","4 · Goals"],["style","5 · Music"],["routine","6 · Routine"],["building","Building"],["plan","Plan"],["home","Home"]];
function openProto(){
  openSheet(`<header class="shead"><h2 tabindex="-1">Prototype controls</h2><button class="iconbtn" type="button" data-act="close" aria-label="Close">${I.close}</button></header>
    <section class="pm"><h3 class="lab">Jump to a screen</h3><div class="jump">${JUMPS.map(([id, t]) => `<button class="chip" type="button" data-act="jump" data-to="${id}" aria-current="${cur === id}">${t}</button>`).join("")}</div></section>
    <section class="pm"><h3 class="lab">Demo account</h3><p class="sub"><b>riya@survibe.in</b> · <b>piano123</b>, a returning player with a 12-day streak. Accounts you create are kept on this device. Anything a server would do is simulated.</p></section>
    <section class="pm"><button class="switchrow" type="button" role="switch" aria-checked="${prefs.sound}" data-act="sound"><span class="sw-ic">${I.note}</span><span class="sw-tx"><b>Sound</b><span>Keys, previews and little cues. On iPad, turn the volume up.</span></span><span class="sw"><i></i></span></button></section>
    <div class="row wrap"><button class="btn pri" type="button" data-act="restart">Restart from the beginning</button><button class="btn ghost" type="button" data-act="reset-db">Forget accounts made here</button></div>`, {cls:"proto"});
}

/* ---------------- actions ---------------- */

const ACT = {
  close:t => closeSheet(t),
  "mic-allow": async () => {
    const ok = await sysAlert({title:"“Survibe” Would Like to Access the Microphone", msg:"Survibe listens to your piano so it can tell which notes you played, and when.",
      buttons:[{label:"Don’t Allow", value:false}, {label:"Allow", value:true, bold:true}]});
    chk.mode = ok ? "mic" : "screen"; chk.denied = !ok; chk.phase = "listen"; renderCheck();
  },
  "mic-screen":() => { chk.mode = "screen"; chk.phase = "listen"; renderCheck(); },
  "where-c":() => { const kb = $(".screen.on .kb.chk"); kb.classList.add("show-c"); flash(kb, [60], 900); Sound.note(60, 0, .8, .5); },
  "check-again":() => { S.answers.check = null; save(); chk.results = []; chk.task = 0; chk.wrong = 0; chk.phase = "listen"; renderCheck(); },
  remind: async t => {
    if (S.answers.remind){ S.answers.remind = false; save(); updateFoot(); return; }
    const ok = await sysAlert({title:"“Survibe” Would Like to Send You Notifications", msg:"Notifications may include alerts, sounds and icon badges. These can be configured in Settings.",
      buttons:[{label:"Don’t Allow", value:false}, {label:"Allow", value:true, bold:true}]});
    S.answers.remind = ok;
    if (ok && !S.answers.time) S.answers.time = "evening";
    save();
    if (cur === "routine"){
      const el = $(".screen.on");
      $$("[data-key=time]", el).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.val === S.answers.time)));
      updateFoot(el);
    } else if (cur === "home") rerender();
    if (!ok) toast("Reminders are off. You can turn them on in Settings.");
    void t;
  },
  "remind-home":() => ACT.remind(),
  preview:t => {
    if (t.classList.contains("on")) return stopSong();
    const scope = t.closest(".songcard");
    t.classList.add("on"); t.innerHTML = I.stop; t.setAttribute("aria-label", "Stop preview");
    playSong(t.dataset.song, scope, () => { t.classList.remove("on"); t.innerHTML = I.play; t.setAttribute("aria-label", "Play a preview"); });
  },
  "preview-chip":t => {
    if (t.classList.contains("on")) return stopSong();
    $$(".chip.song.on, .row-item.on").forEach(c => c.classList.remove("on"));
    t.classList.add("on");
    playSong(t.dataset.song, null, () => t.classList.remove("on"));
  },
  signup:() => { stopSong(); openSignup(); },
  "signup-from-menu":t => { closeSheet(t); setTimeout(() => openSignup(), 300); },
  guest:() => {
    stopSong();
    if (!S.user) S.user = {guest:true, name:"Guest"};
    save(); go("home", true);
    setTimeout(() => toast("You're in as a guest. Save your plan any time."), 500);
  },
  "su-email":t => renderSignup(t.closest(".sheet"), "email"),
  "su-back":t => renderSignup(t.closest(".sheet"), "choose"),
  "to-login":t => {
    const email = t.dataset.email || "";
    closeAll(); go("login");
    if (email) setTimeout(() => { const i = $("#lemail"); if (i){ i.value = email; $("#lpw").focus(); } }, 120);
  },
  legal:() => toast("Not part of this prototype."),
  apple:t => openApple(t.dataset.ctx),
  "apple-mail":t => $$("[data-act=apple-mail]", t.parentElement).forEach(b => b.setAttribute("aria-checked", String(b === t))),
  "apple-go":t => appleGo(t),
  google:t => openGoogle(t.dataset.ctx),
  "google-go":t => googleGo(t),
  "start-setup":() => { closeAll(); go("instrument"); },
  showpw:t => {
    const i = t.parentElement.querySelector("input"), show = i.type === "password";
    i.type = show ? "text" : "password"; t.setAttribute("aria-label", show ? "Hide password" : "Show password"); t.classList.toggle("on", show);
  },
  forgot:() => openForgot(),
  "fill-demo":() => { $("#lemail").value = "riya@survibe.in"; $("#lpw").value = "piano123"; $("#lsubmit").focus(); },
  account:() => openAccount(),
  signout: async t => {
    const guest = S.user && S.user.guest;
    closeSheet(t);
    if (guest){
      const ok = await sysAlert({title:"Leave guest mode?", msg:"Your plan is only on this iPad, so leaving will clear it. Create an account first to keep it.",
        buttons:[{label:"Cancel", value:false, bold:true}, {label:"Leave", value:true}]});
      if (!ok) return;
      S = {answers:blankAnswers(), user:null, plan:null};
    } else S.user = null;
    save(); go("welcome", true);
  },
  lesson:() => openSheet(`<header class="shead"><span></span><button class="iconbtn" type="button" data-act="close" aria-label="Close">${I.close}</button></header>
    <span class="bigtick gold">${I.note}</span><h2 tabindex="-1">This is where the <em>lesson</em> starts</h2>
    <p class="sub">Lessons are outside this onboarding prototype. Everything up to here, from the welcome screen to your home, is the journey it covers.</p>
    <div class="row"><button class="btn pri lg" type="button" data-act="restart">Restart the prototype</button><button class="btn ghost lg" type="button" data-act="close">Stay here</button></div>`, {cls:"small center"}),
  jump:t => {
    const to = t.dataset.to;
    closeAll();
    if (to === "home" && !S.user){ fillDefaults(); S.user = {guest:true, name:"Guest"}; save(); }
    if (to === "login" && S.user){ S.user = null; save(); }
    if (to === "building") S.plan = null;
    go(to);
  },
  sound:t => { prefs.sound = !prefs.sound; store.set(PKEY, prefs); t.setAttribute("aria-checked", String(prefs.sound)); if (prefs.sound) Sound.note(72, 0, .4, .4); },
  restart:() => { stopSong(); S = {answers:blankAnswers(), user:null, plan:null}; save(); closeAll(); cur = null; go("welcome", true); route(); },
  "reset-db":() => { store.del(DBKEY); toast("Accounts made here are forgotten. The demo account is back."); },
  proto:() => openProto()
};

function rerender(){ const c = cur; cur = null; show(c, 0); cur = c; }

/* ---------------- events ---------------- */

app.addEventListener("click", e => {
  const t = e.target.closest("button, [data-go]");
  if (!t || t.disabled || t.classList.contains("key")) return;
  if (t.dataset.act) ACT[t.dataset.act] && ACT[t.dataset.act](t, e);
  if (t.dataset.go) { closeAll(); go(t.dataset.go); return; }
  if (t.hasAttribute("data-back")) return prevStep();
  if (t.hasAttribute("data-skip")) return skipStep();
  if (t.hasAttribute("data-next")) return nextStep();
  if (t.dataset.key) return choose(t);
});

/* Keys respond on pointerdown, not click, so a chord can be pressed with
   several fingers and nothing waits for the tap to finish. */
const held = new Map();
app.addEventListener("pointerdown", e => {
  Sound.ensure();
  const k = e.target.closest(".key"); if (!k || k.closest(".deco")) return;
  e.preventDefault();
  held.set(e.pointerId, k); pressKey(k);
});
const up = e => { releaseKey(held.get(e.pointerId)); held.delete(e.pointerId); };
app.addEventListener("pointerup", up);
app.addEventListener("pointercancel", up);
app.addEventListener("pointerleave", up);
/* Keyboard users press a focused key with Enter or Space, which arrives as a click. */
app.addEventListener("click", e => {
  const k = e.target.closest(".key");
  if (k && e.detail === 0){ pressKey(k); setTimeout(() => releaseKey(k), 160); }
});

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const top = $$(".scrim", layer).pop();
  if (top && top.dataset.dismiss === "1") closeSheet(top);
});

$("#protobtn").addEventListener("click", () => ACT.proto());

/* ---------------- desktop preview frame ----------------
   On an iPad the app fills the screen. Anywhere else it sits in an iPad-sized
   frame, scaled to fit, so the layout is the one an iPad would actually get.
   ?frame=0 or ?frame=1 overrides the guess. */

const DEVICES = {mini:[744, 1133, "iPad mini"], air:[820, 1180, "iPad Air 11″"], pro:[1032, 1376, "iPad Pro 13″"]};
const frame = {device:"air", land:true};
function isIPad(){ return /iPad/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
function setupFrame(){
  const q = new URLSearchParams(location.search).get("frame");
  const framed = q === "1" || (q !== "0" && !isIPad() && !matchMedia("(pointer: coarse)").matches && innerWidth >= 900);
  document.documentElement.classList.toggle("framed", framed);
  $("#devbar").hidden = !framed;
  if (!framed) return;
  Object.assign(frame, store.get("survibe-proto-frame") || {});
  const sel = $("#devsel");
  sel.innerHTML = Object.entries(DEVICES).map(([k, v]) => `<option value="${k}">${v[2]}</option>`).join("");
  sel.value = frame.device;
  sel.addEventListener("change", () => { frame.device = sel.value; fit(); });
  $("#rotate").addEventListener("click", () => { frame.land = !frame.land; fit(); });
  $("#devproto").addEventListener("click", () => ACT.proto());
  addEventListener("resize", fit);
  fit();
}
function fit(){
  store.set("survibe-proto-frame", frame);
  const [w0, h0] = DEVICES[frame.device], W = frame.land ? h0 : w0, H = frame.land ? w0 : h0;
  const bezel = 18, availW = innerWidth - 48, availH = innerHeight - $("#devbar").offsetHeight - $("#devnote").offsetHeight - 52;
  const s = Math.min(1, availW / (W + bezel * 2), availH / (H + bezel * 2));
  const dev = $("#device"), holder = $("#holder");
  app.style.width = W + "px"; app.style.height = H + "px";
  dev.style.transform = `scale(${s})`;
  holder.style.width = (W + bezel * 2) * s + "px"; holder.style.height = (H + bezel * 2) * s + "px";
  $("#devsize").textContent = `${W} × ${H} pt · ${frame.land ? "landscape" : "portrait"} · ${Math.round(s * 100)}%`;
}

setupFrame();
if (!location.hash) location.replace(S.user ? "#/home" : "#/welcome");
route();
