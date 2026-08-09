/* =========================================================
   TOGVOGNER
   Hvert ord i kjeden blir en vogn på toget. Vognas lengde
   følger ordets lengde, og vogntypen bestemmes av ordet selv
   (stabil hash) blant de typene spilleren har låst opp.

   Ordet står på en egen skiltplate inne i vogna. Vognene har
   svært ulike farger, og uten plata ble teksten uleselig på
   noen av dem.
   ========================================================= */

/* Alltid med – opptar ingen plass i vognskjulet. */
export const LOCO = {
  id: 'loco',
  name: 'Damplokomotiv',
  desc: 'Trekker hele toget. Alltid først i rekka.'
};
export const GOLD = {
  id: 'gold',
  name: 'Gullvogn',
  desc: 'Kommer av seg selv på gylne ord.'
};

/** Vogna alle starter med – den eneste som er åpen fra start. */
export const START_CARRIAGE = {
  id: 'freight',
  name: 'Godsvogn',
  desc: 'Solid treverk. Vogna du starter med.',
  tier: 1
};

/* =========================================================
   VOGNER SOM KAN VINNES
   `tier` styrer hvor sjelden vogna er i trekningen:
     1 = vanlig, 2 = uvanlig, 3 = sjelden.
   Hvilken vogn du får er tilfeldig – oppdragene styrer bare
   NÅR du får en, ikke HVILKEN.
   ========================================================= */
export const CARRIAGES = [
  { id: 'passenger', name: 'Passasjervogn', tier: 1,
    desc: 'Vinduer og lys. For folk som skal et sted.' },
  { id: 'timber', name: 'Tømmervogn', tier: 1,
    desc: 'Laster stokker rett fra skogen.' },
  { id: 'container', name: 'Konteinervogn', tier: 1,
    desc: 'Stablet full av kasser fra hele verden.' },
  { id: 'tank', name: 'Tankvogn', tier: 2,
    desc: 'Blank sylinder. Frakter noe hemmelig.' },
  { id: 'cool', name: 'Kjølevogn', tier: 2,
    desc: 'Iskald. Til det som må holdes friskt.' },
  { id: 'post', name: 'Postvogn', tier: 2,
    desc: 'Frakter brev til hele landet.' },
  { id: 'circus', name: 'Sirkusvogn', tier: 3,
    desc: 'Stripete og full av bråk.' },
  { id: 'rocket', name: 'Rakettvogn', tier: 3,
    desc: 'Skal egentlig ikke gå på skinner.' },
  { id: 'royal', name: 'Kongevogn', tier: 3,
    desc: 'Gullkanter og fløyel. Den fineste i skjulet.' }
];

/* =========================================================
   OPPDRAG
   Ett aktivt om gangen, i stigende vanskelighet. Alle tellere
   måles fra forrige opplåsing, så man kan aldri løse to på én
   gang. Oppdragene er frikoblet fra vognene: de bestemmer når
   du får en pakke, trekningen bestemmer hva som er i den.
   ========================================================= */
export const MISSIONS = [
  { type: 'rounds', n: 1, text: 'Kjør én runde' },
  { type: 'rounds', n: 3, text: 'Kjør tre runder til' },
  { type: 'words', n: 10, text: 'Lag et tog med 10 vogner' },
  { type: 'longWord', n: 10, text: 'Bruk et ord på 10 bokstaver' },
  { type: 'roundScore', n: 800, text: 'Få 800 poeng i én runde' },
  { type: 'rounds', n: 10, text: 'Kjør ti runder til' },
  { type: 'totalScore', n: 5000, text: 'Samle 5000 poeng' },
  { type: 'totalScore', n: 10000, text: 'Samle 10 000 poeng' },
  { type: 'totalScore', n: 25000, text: 'Samle 25 000 poeng' }
];

/* Vekt per tier, avhengig av hvor langt spilleren er kommet.
   Vanlige vogner dominerer i starten, sjeldne mot slutten –
   men alt kan dukke opp når som helst. */
const TIER_WEIGHTS = {
  1: [10, 5, 2],
  2: [4, 8, 5],
  3: [1, 4, 10]
};

function stageFor(unlockedCount){
  if(unlockedCount < 4) return 0;
  if(unlockedCount < 7) return 1;
  return 2;
}

/**
 * Trekker en vogn blant dem som ennå ikke er låst opp.
 * @param {Set<string>} unlocked
 * @param {function} [rand] injiserbar tilfeldighet (for testing)
 */
export function drawCarriage(unlocked, rand = Math.random){
  const pool = CARRIAGES.filter(c => !unlocked.has(c.id));
  if(pool.length === 0) return null;

  const stage = stageFor(unlocked.size);
  const weights = pool.map(c => TIER_WEIGHTS[c.tier][stage]);
  const total = weights.reduce((a, b) => a + b, 0);

  let r = rand() * total;
  for(let i = 0; i < pool.length; i++){
    r -= weights[i];
    if(r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export const CARRIAGE_BY_ID = Object.fromEntries(
  [LOCO, GOLD, START_CARRIAGE, ...CARRIAGES].map(c => [c.id, c])
);

/** Alle plassene i vognskjulet (startvogna + de som kan vinnes). */
export const ALL_SLOTS = [START_CARRIAGE, ...CARRIAGES];

/* Stabil hash så et ord alltid gir samme vogntype. */
function hash(str){
  let h = 2166136261;
  for(let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Velger vogntype for et ord.
 * @param {object} opts { index, golden, unlocked:Set }
 */
export function pickCarriage(word, opts = {}){
  if(opts.index === 0) return 'loco';
  if(opts.golden) return 'gold';        // alltid gullvogn på gylne ord

  const unlocked = opts.unlocked || new Set([START_CARRIAGE.id]);
  const pool = ALL_SLOTS.filter(c => unlocked.has(c.id)).map(c => c.id);
  if(pool.length === 0) return START_CARRIAGE.id;
  return pool[hash(word) % pool.length];
}

/** Antall hjulpar – lengre ord får flere hjul. */
export function wheelCount(word){
  return Math.max(2, Math.min(6, Math.round(word.length / 2.5)));
}

/**
 * Bygger DOM for én vogn.
 * @param {object} opts { current, animate }
 */
export function buildCarriage(word, type, opts = {}){
  const wrap = document.createElement('div');
  wrap.className = 'carriage type-' + type
    + (opts.current ? ' current' : '')
    + (opts.animate ? ' arriving' : '');
  wrap.setAttribute('role', 'listitem');
  wrap.setAttribute('aria-label', `${word} – ${CARRIAGE_BY_ID[type]?.name || 'Vogn'}`);

  if(type === 'loco'){
    const chimney = document.createElement('span');
    chimney.className = 'chimney';
    chimney.setAttribute('aria-hidden', 'true');
    wrap.appendChild(chimney);
  }

  const roof = document.createElement('span');
  roof.className = 'roof';
  roof.setAttribute('aria-hidden', 'true');
  wrap.appendChild(roof);

  const body = document.createElement('span');
  body.className = 'body';

  // Skiltplata gir lik lesbarhet uansett hvilken farge vogna har.
  const plate = document.createElement('span');
  plate.className = 'plate';
  plate.appendChild(document.createTextNode(word.slice(0, -1)));
  const tail = document.createElement('em');
  tail.className = 'hl';
  tail.textContent = word.slice(-1);
  plate.appendChild(tail);
  body.appendChild(plate);
  wrap.appendChild(body);

  const wheels = document.createElement('span');
  wheels.className = 'wheels';
  wheels.setAttribute('aria-hidden', 'true');
  const n = wheelCount(word);
  for(let i = 0; i < n; i++) wheels.appendChild(document.createElement('i'));
  wrap.appendChild(wheels);

  return wrap;
}

/** Koblingen mellom to vogner. */
export function buildCoupling(){
  const c = document.createElement('span');
  c.className = 'coupling';
  c.setAttribute('aria-hidden', 'true');
  return c;
}
