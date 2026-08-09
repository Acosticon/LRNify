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

/** Vogna alle starter med. */
export const START_CARRIAGE = {
  id: 'freight',
  name: 'Godsvogn',
  desc: 'Solid treverk. Vogna du starter med.'
};

/* =========================================================
   OPPDRAG
   Rekkefølgen er opplåsingsrekkefølgen: kun ett oppdrag er
   aktivt om gangen, og alle tellere måles fra forrige
   opplåsing. Da kan man aldri låse opp to på én gang.
   ========================================================= */
export const MISSIONS = [
  {
    id: 'passenger', name: 'Passasjervogn',
    desc: 'Vinduer og lys. For folk som skal et sted.',
    mission: { type: 'rounds', n: 1, text: 'Kjør én runde' }
  },
  {
    id: 'timber', name: 'Tømmervogn',
    desc: 'Laster stokker rett fra skogen.',
    mission: { type: 'rounds', n: 3, text: 'Kjør tre runder til' }
  },
  {
    id: 'tank', name: 'Tankvogn',
    desc: 'Blank sylinder. Frakter noe hemmelig.',
    mission: { type: 'words', n: 10, text: 'Lag et tog med 10 vogner' }
  },
  {
    id: 'cool', name: 'Kjølevogn',
    desc: 'Iskald. Til det som må holdes friskt.',
    mission: { type: 'longWord', n: 10, text: 'Bruk et ord på 10 bokstaver' }
  },
  {
    id: 'circus', name: 'Sirkusvogn',
    desc: 'Stripete og full av bråk.',
    mission: { type: 'roundScore', n: 800, text: 'Få 800 poeng i én runde' }
  },
  {
    id: 'container', name: 'Konteinervogn',
    desc: 'Stablet full av kasser fra hele verden.',
    mission: { type: 'rounds', n: 10, text: 'Kjør ti runder til' }
  },
  {
    id: 'post', name: 'Postvogn',
    desc: 'Frakter brev til hele landet.',
    mission: { type: 'totalScore', n: 5000, text: 'Samle 5000 poeng' }
  },
  {
    id: 'rocket', name: 'Rakettvogn',
    desc: 'Skal egentlig ikke gå på skinner.',
    mission: { type: 'totalScore', n: 10000, text: 'Samle 10 000 poeng' }
  },
  {
    id: 'royal', name: 'Kongevogn',
    desc: 'Gullkanter og fløyel. Den fineste i skjulet.',
    mission: { type: 'totalScore', n: 25000, text: 'Samle 25 000 poeng' }
  }
];

export const CARRIAGE_BY_ID = Object.fromEntries(
  [LOCO, GOLD, START_CARRIAGE, ...MISSIONS].map(c => [c.id, c])
);

/** Alt som skal vises som plass i vognskjulet. */
export const DEPOT_SLOTS = [START_CARRIAGE, ...MISSIONS];

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
  const pool = DEPOT_SLOTS.filter(c => unlocked.has(c.id)).map(c => c.id);
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
