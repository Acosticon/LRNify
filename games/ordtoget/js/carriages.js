/* =========================================================
   TOGVOGNER
   Hvert ord i kjeden blir en vogn på toget. Vognas lengde
   følger ordets lengde, og vogntypen bestemmes av ordet selv
   (stabil hash) blant de typene spilleren har låst opp.
   Første ordet er alltid lokomotivet.
   ========================================================= */

export const LOCO = {
  id: 'loco',
  name: 'Damplokomotiv',
  desc: 'Trekker hele toget. Alltid først i rekka.'
};

/* Gullvogna hører til den gylne bokstaven, ikke til opplåsingen.
   Den dukker alltid opp på et gyllent ord – ellers ville løftet
   «GULLVOGN! ×3» vist en helt vanlig vogn. */
export const GOLD = {
  id: 'gold',
  name: 'Gullvogn',
  desc: 'Kommer av seg selv på gylne ord.'
};

/* Rekkefølgen her styrer visningen i Togstallen.
   De to første er åpne fra start, så toget har farge med én gang. */
export const CARRIAGES = [
  {
    id: 'freight', name: 'Godsvogn',
    desc: 'Solid treverk. Vogna du alltid har.',
    unlock: null
  },
  {
    id: 'passenger', name: 'Passasjervogn',
    desc: 'Vinduer og lys. For folk som skal et sted.',
    unlock: null
  },
  {
    id: 'tank', name: 'Tankvogn',
    desc: 'Blank sylinder. Frakter noe hemmelig.',
    unlock: { stat: 'bestWords', n: 10, text: 'Lag et tog med 10 vogner' }
  },
  {
    id: 'cool', name: 'Kjølevogn',
    desc: 'Iskald. Til det som må holdes friskt.',
    unlock: { stat: 'longestWordLen', n: 10, text: 'Bruk et ord på 10 bokstaver' }
  },
  {
    id: 'circus', name: 'Sirkusvogn',
    desc: 'Stripete og full av bråk.',
    unlock: { stat: 'bestCombo', n: 4, text: 'Nå kombo ×4' }
  },
  {
    id: 'post', name: 'Postvogn',
    desc: 'Frakter brev til hele landet.',
    unlock: { stat: 'goldenHits', n: 5, text: 'Treff 5 gylne bokstaver' }
  },
  {
    id: 'rocket', name: 'Rakettvogn',
    desc: 'Skal egentlig ikke gå på skinner.',
    unlock: { stat: 'bestScore', n: 1500, text: 'Få 1500 poeng i én runde' }
  }
];

/** Alt som vises i Togstallen, inkludert de som alltid er med. */
export const DEPOT_ITEMS = [
  { ...LOCO, unlock: null, always: true },
  ...CARRIAGES,
  { ...GOLD, unlock: null, always: true }
];

export const CARRIAGE_BY_ID = Object.fromEntries(
  [...CARRIAGES, LOCO, GOLD].map(c => [c.id, c])
);

/* Stabil hash så et ord alltid gir samme vogntype i samme runde. */
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
 * @param {string} word
 * @param {object} opts  { index, golden, unlocked:Set }
 */
export function pickCarriage(word, opts = {}){
  if(opts.index === 0) return 'loco';
  if(opts.golden) return 'gold';        // alltid gullvogn på gylne ord

  const unlocked = opts.unlocked || new Set(['freight']);
  const pool = CARRIAGES.filter(c => unlocked.has(c.id)).map(c => c.id);
  if(pool.length === 0) return 'freight';
  return pool[hash(word) % pool.length];
}

/** Antall hjulpar – lengre ord får flere hjul. */
export function wheelCount(word){
  return Math.max(2, Math.min(6, Math.round(word.length / 2.5)));
}

/**
 * Bygger DOM for én vogn.
 * @param {string} word
 * @param {string} type   vogntype-id ('loco', 'freight', ...)
 * @param {object} opts   { current, animate }
 */
export function buildCarriage(word, type, opts = {}){
  const wrap = document.createElement('div');
  wrap.className = 'carriage type-' + type
    + (opts.current ? ' current' : '')
    + (opts.animate ? ' arriving' : '');
  wrap.setAttribute('role', 'listitem');

  const label = CARRIAGE_BY_ID[type]?.name || 'Vogn';
  wrap.setAttribute('aria-label', `${word} – ${label}`);

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
  const head = document.createTextNode(word.slice(0, -1));
  const tail = document.createElement('em');
  tail.className = 'hl';
  tail.textContent = word.slice(-1);
  body.appendChild(head);
  body.appendChild(tail);
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
