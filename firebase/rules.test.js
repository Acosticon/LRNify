// Simulerer reglene i database.rules.json mot ekte klientoperasjoner fra
// aktiviteter/poll/, aktiviteter/terningspill/, aktiviteter/genetikhjul/,
// aktiviteter/temaspinner/ og aktiviteter/tankesky/.
//
//   npm install targaryen
//   node firebase/rules.test.js
//
// To regimer testes: rom laget MED anonym pålogging (har "owner"), og gamle
// rom UTEN — de siste må fortsatt virke, slik at ingenting knekker hvis
// anonym pålogging ikke er skrudd på i Firebase-konsollen.

const targaryen = require('targaryen');
const rules = require('./database.rules.json');

let pass = 0, fail = 0;
function check(name, expected, result) {
  const ok = result.allowed === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      -> ${result.info.split('\n').slice(-8).join('\n      ')}`}`);
}

const now = Date.now();
const LARER = { uid: 'larer-1', provider: 'anonymous' };
const ELEV  = { uid: 'elev-1',  provider: 'anonymous' };
const ELEV2 = { uid: 'elev-2',  provider: 'anonymous' };

// data = databasens innhold, bruker = innlogget (null = ingen pålogging)
const db = (data, bruker) => targaryen.database(rules, data, now).as(bruker || null);

const basePoll = { question: 'Hva er hovedstaden?', options: ['Oslo', 'Bergen', 'Troms', 'Ålesund'], votes: { 0: 0, 1: 2, 2: 0, 3: 0 }, open: true, createdAt: now };
const baseKrle = { createdAt: now, teams: { '-Nx1': { name: 'Lag A', joinedAt: now } }, answers: { '-Ny1': { text: 'svar', team: 'Lag A', sentAt: now } }, state: { type: 'concept', content: 'tro', roll: 4 } };

const eidPoll = Object.assign({}, basePoll, { owner: LARER.uid });
const eidKrle = Object.assign({}, baseKrle, { owner: LARER.uid });

const gammeltRom  = { rooms: { ABC123: basePoll } };   // uten owner
const nyttRom     = { rooms: { ABC123: eidPoll } };    // med owner
const gammeltKrle = { krle:  { ABC123: baseKrle } };
const nyttKrle    = { krle:  { ABC123: eidKrle } };

// Rom der elev-1 allerede har stemt
const stemtRom = { rooms: { ABC123: Object.assign({}, eidPoll, { voters: { [ELEV.uid]: true } }) } };

console.log('--- poll: lærerens flyt (med anonym pålogging)');
check('lærer lager rom med owner', true, db({}, LARER).write('/rooms/ABC123', eidPoll));
check('lærer sletter sitt eget rom', true, db(nyttRom, LARER).write('/rooms/ABC123', null));
check('lærer leser rommet', true, db(nyttRom, LARER).read('/rooms/ABC123'));

console.log('--- poll: elevens flyt (teller + merke i én operasjon)');
check('elev stemmer', true, db(nyttRom, ELEV).update('/rooms/ABC123', { 'votes/1': 3, ['voters/' + ELEV.uid]: true }));
check('annen elev stemmer på samme alternativ', true, db(nyttRom, ELEV2).update('/rooms/ABC123', { 'votes/1': 3, ['voters/' + ELEV2.uid]: true }));
check('elev leser rommet', true, db(nyttRom, ELEV).read('/rooms/ABC123'));

console.log('--- poll: ballot stuffing');
check('samme elev stemmer to ganger', false, db(stemtRom, ELEV).update('/rooms/ABC123', { 'votes/0': 1, ['voters/' + ELEV.uid]: true }));
check('teller opp uten å sette merket', false, db(nyttRom, ELEV).write('/rooms/ABC123/votes/1', 3));
check('setter merke for en annen elev', false, db(nyttRom, ELEV).update('/rooms/ABC123', { 'votes/1': 3, ['voters/' + ELEV2.uid]: true }));
check('stemmer uten pålogging i eid rom', false, db(nyttRom, null).update('/rooms/ABC123', { 'votes/1': 3, 'voters/anon': true }));
check('fjerner sitt eget merke for å stemme på nytt', false, db(stemtRom, ELEV).write('/rooms/ABC123/voters/' + ELEV.uid, null));
// Å sette bare sitt eget merke er lov — da har man gitt fra seg sin egen
// stemme uten å telle opp noe. Det skader ingen andre.
check('setter bare sitt eget merke (gir fra seg stemmen)', true, db(nyttRom, ELEV).write('/rooms/ABC123/voters/' + ELEV.uid, true));
check('setter merke på vegne av en annen', false, db(nyttRom, ELEV).write('/rooms/ABC123/voters/' + ELEV2.uid, true));
check('stuffer teller til 9999', false, db(nyttRom, ELEV).update('/rooms/ABC123', { 'votes/1': 9999, ['voters/' + ELEV.uid]: true }));
check('teller ned', false, db(nyttRom, ELEV).update('/rooms/ABC123', { 'votes/1': 1, ['voters/' + ELEV.uid]: true }));

console.log('--- poll: hærverk');
check('elev sletter lærerens rom', false, db(nyttRom, ELEV).write('/rooms/ABC123', null));
check('uinnlogget sletter eid rom', false, db(nyttRom, null).write('/rooms/ABC123', null));
check('elev lager rom med lærerens uid som owner', false, db({}, ELEV).write('/rooms/ABC123', eidPoll));
check('elev endrer spørsmålet', false, db(nyttRom, ELEV).write('/rooms/ABC123/question', 'hacket'));
check('elev overskriver hele rommet', false, db(nyttRom, ELEV).write('/rooms/ABC123', eidPoll));
check('lister opp /rooms', false, db(nyttRom, ELEV).read('/rooms'));
check('leser rota', false, db(nyttRom, ELEV).read('/'));
check('rom med ukjent felt', false, db({}, LARER).write('/rooms/ABC123', Object.assign({ evil: 'x' }, eidPoll)));
check('rom uten votes', false, db({}, LARER).write('/rooms/ABC123', { question: 'q', options: ['a', 'b'], open: true, createdAt: now, owner: LARER.uid }));
check('5 kB spørsmål', false, db({}, LARER).write('/rooms/ABC123', Object.assign({}, eidPoll, { question: 'x'.repeat(5000) })));
check('ugyldig romkode', false, db({}, LARER).write('/rooms/hax!!', eidPoll));
check('skriver rett på /rooms', false, db({}, LARER).write('/rooms', { evil: true }));
check('skriver på rota', false, db({}, LARER).write('/evil', { a: 1 }));

console.log('--- poll: gamle rom uten owner virker som før');
check('uinnlogget lager rom (anonym pålogging av)', true, db({}, null).write('/rooms/ABC123', basePoll));
check('uinnlogget stemmer i gammelt rom', true, db(gammeltRom, null).write('/rooms/ABC123/votes/1', 3));
check('uinnlogget avslutter gammelt rom', true, db(gammeltRom, null).write('/rooms/ABC123', null));
check('gammelt rom: stuffing fortsatt blokkert', false, db(gammeltRom, null).write('/rooms/ABC123/votes/1', 9999));

console.log('--- krle: lærerens flyt');
check('lærer lager rom', true, db({}, LARER).write('/krle/ABC123', { createdAt: now, owner: LARER.uid }));
check('lærer setter begrep', true, db(nyttKrle, LARER).write('/krle/ABC123/state', { type: 'concept', content: 'tro', roll: 5 }));
check('lærer setter aktivitet', true, db(nyttKrle, LARER).write('/krle/ABC123/state', { type: 'activity', content: 'hopp', roll: 3 }));
check('lærer tømmer svar (ny runde)', true, db(nyttKrle, LARER).write('/krle/ABC123/answers', null));
check('lærer avslutter rommet', true, db(nyttKrle, LARER).write('/krle/ABC123', null));

console.log('--- krle: elevens flyt');
check('elev blir med (nytt lag)', true, db(nyttKrle, ELEV).write('/krle/ABC123/teams/-Nz9', { name: 'Lag B', joinedAt: now }));
check('elev sender svar', true, db(nyttKrle, ELEV).write('/krle/ABC123/answers/-Nz9', { text: 'mitt svar', team: 'Lag B', sentAt: now }));
check('elev leser state', true, db(nyttKrle, ELEV).read('/krle/ABC123/state'));
check('lærer leser svar', true, db(nyttKrle, LARER).read('/krle/ABC123/answers'));

console.log('--- krle: hærverk');
check('elev kaster terningen (setter state)', false, db(nyttKrle, ELEV).write('/krle/ABC123/state', { type: 'activity', content: 'tull', roll: 1 }));
check('uinnlogget setter state i eid rom', false, db(nyttKrle, null).write('/krle/ABC123/state', { type: 'activity', content: 'tull', roll: 1 }));
check('elev tømmer alle svar', false, db(nyttKrle, ELEV).write('/krle/ABC123/answers', null));
check('elev sletter lærerens rom', false, db(nyttKrle, ELEV).write('/krle/ABC123', null));
check('elev endrer et annet lags svar', false, db(nyttKrle, ELEV).write('/krle/ABC123/answers/-Ny1', { text: 'endret', team: 'Lag A', sentAt: now }));
check('elev sletter et svar', false, db(nyttKrle, ELEV).write('/krle/ABC123/answers/-Ny1', null));
check('elev sletter et lag', false, db(nyttKrle, ELEV).write('/krle/ABC123/teams/-Nx1', null));
check('lister opp /krle', false, db(nyttKrle, ELEV).read('/krle'));
check('ugyldig state.type', false, db(nyttKrle, LARER).write('/krle/ABC123/state', { type: 'evil', content: 'x', roll: 3 }));
check('terningkast utenfor 1-6', false, db(nyttKrle, LARER).write('/krle/ABC123/state', { type: 'concept', content: 'x', roll: 99 }));
check('state i rom som ikke finnes', false, db({}, LARER).write('/krle/ZZZZZZ/state', { type: 'concept', content: 'x', roll: 3 }));
check('svar i rom som ikke finnes', false, db({}, ELEV).write('/krle/ZZZZZZ/answers/-a', { text: 't', team: 'l', sentAt: now }));
check('kjempelangt svar', false, db(nyttKrle, ELEV).write('/krle/ABC123/answers/-Nz9', { text: 'x'.repeat(2000), team: 'L', sentAt: now }));
check('for langt lagnavn', false, db(nyttKrle, ELEV).write('/krle/ABC123/teams/-Nz9', { name: 'x'.repeat(100), joinedAt: now }));
check('ukjent felt på svar', false, db(nyttKrle, ELEV).write('/krle/ABC123/answers/-Nz9', { text: 't', team: 'l', sentAt: now, evil: 1 }));
check('overskriver aktivt rom', false, db(nyttKrle, ELEV).write('/krle/ABC123', { createdAt: now }));
check('elev lager rom med lærerens uid', false, db({}, ELEV).write('/krle/ABC123', { createdAt: now, owner: LARER.uid }));

console.log('--- krle: gamle rom uten owner virker som før');
check('uinnlogget lager rom', true, db({}, null).write('/krle/ABC123', { createdAt: now }));
check('uinnlogget setter state i gammelt rom', true, db(gammeltKrle, null).write('/krle/ABC123/state', { type: 'concept', content: 'tro', roll: 5 }));
check('uinnlogget tømmer svar i gammelt rom', true, db(gammeltKrle, null).write('/krle/ABC123/answers', null));
check('uinnlogget avslutter gammelt rom', true, db(gammeltKrle, null).write('/krle/ABC123', null));
check('uinnlogget elev blir med i gammelt rom', true, db(gammeltKrle, null).write('/krle/ABC123/teams/-Nz9', { name: 'Lag B', joinedAt: now }));
check('gammelt rom: ugyldig state fortsatt blokkert', false, db(gammeltKrle, null).write('/krle/ABC123/state', { type: 'evil', content: 'x', roll: 3 }));

/* ── genetikhjul (aktiviteter/genetikhjul/index.html) ──────────────────────
   Elevene sender inn uten å logge på (reglene krever det ikke for /elever),
   mens læreren merker klassekoden med sin anonyme id og er den eneste som
   kan nullstille klassen etterpå. */
const profil    = { navn: 'Ada', kjonn: 'F', svar: { T:'dom', E:'rec', H:'dom', D:'rec', W:'dom', B:'rec' }, ts: now };
const KODE      = '8B-HOST26';
const eidHjul   = { genetikhjul: { [KODE]: { owner: LARER.uid, createdAt: now, elever: { '-Nh1': profil } } } };
const loestHjul = { genetikhjul: { [KODE]: { elever: { '-Nh1': profil } } } };  // uten owner

console.log('--- genetikhjul: lærerens flyt');
check('tavla tar eierskap på tom kode', true, db({}, LARER).update('/genetikhjul/' + KODE, { owner: LARER.uid, createdAt: now }));
check('tavla tar eierskap etter at elever har levert', true, db(loestHjul, LARER).update('/genetikhjul/' + KODE, { owner: LARER.uid, createdAt: now }));
check('tavla leser klassen', true, db(eidHjul, LARER).read('/genetikhjul/' + KODE + '/elever'));
check('eier nullstiller klassen', true, db(eidHjul, LARER).write('/genetikhjul/' + KODE + '/elever', null));

console.log('--- genetikhjul: elevens flyt');
check('elev sender inn uten pålogging', true, db(eidHjul, null).write('/genetikhjul/' + KODE + '/elever/-Nh2', profil));
check('elev sender inn i kode som ikke finnes ennå', true, db({}, null).write('/genetikhjul/' + KODE + '/elever/-Nh1', profil));
check('elev sender inn fra pålogget nettleser', true, db(eidHjul, ELEV).write('/genetikhjul/' + KODE + '/elever/-Nh2', profil));
check('elev leser klassen (tavla på egen skjerm)', true, db(eidHjul, ELEV).read('/genetikhjul/' + KODE));

console.log('--- genetikhjul: hærverk');
check('elev nullstiller klassen', false, db(eidHjul, ELEV).write('/genetikhjul/' + KODE + '/elever', null));
check('uinnlogget nullstiller eid klasse', false, db(eidHjul, null).write('/genetikhjul/' + KODE + '/elever', null));
check('elev endrer en annens profil', false, db(eidHjul, ELEV).write('/genetikhjul/' + KODE + '/elever/-Nh1', Object.assign({}, profil, { navn: 'Tull' })));
check('elev sletter en annens profil', false, db(eidHjul, ELEV).write('/genetikhjul/' + KODE + '/elever/-Nh1', null));
check('elev overtar eierskapet', false, db(eidHjul, ELEV).write('/genetikhjul/' + KODE + '/owner', ELEV.uid));
check('elev setter lærerens uid som owner', false, db({}, ELEV).write('/genetikhjul/' + KODE + '/owner', LARER.uid));
check('uinnlogget setter owner', false, db({}, null).write('/genetikhjul/' + KODE + '/owner', 'anon'));
check('lister opp /genetikhjul', false, db(eidHjul, LARER).read('/genetikhjul'));
check('ugyldig klassekode', false, db({}, null).write('/genetikhjul/8b host!/elever/-Nh1', profil));
check('for lang klassekode', false, db({}, null).write('/genetikhjul/' + 'A'.repeat(30) + '/elever/-Nh1', profil));
check('profil uten svar', false, db({}, null).write('/genetikhjul/' + KODE + '/elever/-Nh1', { navn: 'Ada', kjonn: 'F', ts: now }));
check('profil med bare 5 gener', false, db({}, null).write('/genetikhjul/' + KODE + '/elever/-Nh1', Object.assign({}, profil, { svar: { T:'dom', E:'rec', H:'dom', D:'rec', W:'dom' } })));
check('ugyldig svarverdi', false, db({}, null).write('/genetikhjul/' + KODE + '/elever/-Nh1', Object.assign({}, profil, { svar: Object.assign({}, profil.svar, { T: 'Bb' }) })));
check('ukjent gen i svar', false, db({}, null).write('/genetikhjul/' + KODE + '/elever/-Nh1', Object.assign({}, profil, { svar: Object.assign({}, profil.svar, { X: 'dom' }) })));
check('ugyldig kjønn', false, db({}, null).write('/genetikhjul/' + KODE + '/elever/-Nh1', Object.assign({}, profil, { kjonn: 'X' })));
check('kjempelangt navn', false, db({}, null).write('/genetikhjul/' + KODE + '/elever/-Nh1', Object.assign({}, profil, { navn: 'x'.repeat(100) })));
check('tomt navn', false, db({}, null).write('/genetikhjul/' + KODE + '/elever/-Nh1', Object.assign({}, profil, { navn: '' })));
check('ukjent felt på profil', false, db({}, null).write('/genetikhjul/' + KODE + '/elever/-Nh1', Object.assign({ evil: 1 }, profil)));
check('ts langt inn i framtida', false, db({}, null).write('/genetikhjul/' + KODE + '/elever/-Nh1', Object.assign({}, profil, { ts: now + 999999999 })));
check('overskriver hele klassen', false, db(eidHjul, ELEV).write('/genetikhjul/' + KODE, { elever: { '-Nh9': profil } }));
check('skriver rett på /genetikhjul', false, db({}, LARER).write('/genetikhjul', { evil: true }));

/* Klassekoden er fire siffer og trekkes tilfeldig, så den treffer før eller
   siden en kode som har vært brukt. En ny økt skal da kunne starte med blanke
   ark — men bare når den gamle klassen faktisk er gammel, ellers kunne hvem
   som helst tømme en klasse som er midt i en time. */
const gammeltHjul = { genetikhjul: { [KODE]: {
  owner: LARER.uid, createdAt: now - 20 * 3600 * 1000, elever: { '-Nh1': profil }
} } };

console.log('--- genetikhjul: gjenbruk av klassekode');
check('ny lærer tømmer klasse fra i går', true, db(gammeltHjul, ELEV2).update('/genetikhjul/' + KODE, { elever: null, owner: ELEV2.uid, createdAt: now }));
check('ny lærer overtar gammel klassekode', true, db(gammeltHjul, ELEV2).write('/genetikhjul/' + KODE + '/owner', ELEV2.uid));
check('gammel createdAt kan oppdateres', true, db(gammeltHjul, ELEV2).write('/genetikhjul/' + KODE + '/createdAt', now));
check('eier tømmer sin egen ferske klasse', true, db(eidHjul, LARER).update('/genetikhjul/' + KODE, { elever: null, owner: LARER.uid, createdAt: now }));
check('fremmed tømmer fersk klasse', false, db(eidHjul, ELEV2).update('/genetikhjul/' + KODE, { elever: null, owner: ELEV2.uid, createdAt: now }));
check('fremmed kaprer fersk klassekode', false, db(eidHjul, ELEV2).write('/genetikhjul/' + KODE + '/owner', ELEV2.uid));
check('fersk createdAt kan ikke stilles tilbake', false, db(eidHjul, ELEV2).write('/genetikhjul/' + KODE + '/createdAt', now - 99999));
check('uinnlogget tømmer gammel klasse', false, db(gammeltHjul, null).write('/genetikhjul/' + KODE + '/elever', null));
check('elev sletter enkeltprofil i gammel klasse', false, db(gammeltHjul, ELEV2).write('/genetikhjul/' + KODE + '/elever/-Nh1', null));

console.log('--- genetikhjul: klasser uten owner (anonym pålogging av)');
check('uinnlogget tavle nullstiller klasse uten owner', true, db(loestHjul, null).write('/genetikhjul/' + KODE + '/elever', null));
check('klasse uten owner: ugyldig profil fortsatt blokkert', false, db(loestHjul, null).write('/genetikhjul/' + KODE + '/elever/-Nh2', { navn: 'Ada', kjonn: 'F', ts: now }));

/* ══════════════════════════════════════════════════════════════
   TEMASPINNER
   Læreren eier rommet og er eneste kortgiver: bare eieren skriver fase,
   klokke, stokk og elevenes temaer. Eleven skriver bare sitt eget navn
   (én gang) og sin egen bytte-forespørsel.
   ══════════════════════════════════════════════════════════════ */
const TKODE = '8QY8';
const tRom = {
  opprettet: now,
  owner: LARER.uid,
  fase: 'lobby',
  temaListe: ['Trafikklys', 'Køer', 'Sokker'],
  stokk: { igjen: ['Køer', 'Sokker'] },
  byttBillettPa: true,
  varighetMs: 120000,
  klokke: { endsAt: now + 120000 },
  elever: {
    [ELEV.uid]: { navn: 'Ida', ts: now, tema: 'Trafikklys', harByttet: false },
  },
};
const tp = (rom) => ({ temaspinner: { [TKODE]: rom || tRom } });
const tPath = '/temaspinner/' + TKODE;
const nyttTRom = { opprettet: now, owner: LARER.uid, fase: 'lobby', temaListe: ['Trafikklys', 'Køer'] };

console.log('--- temaspinner: lærerens flyt');
check('lærer oppretter rom', true, db({}, LARER).write(tPath, nyttTRom));
check('lærer overskriver sitt eget rom', true, db(tp(), LARER).write(tPath, nyttTRom));
check('lærer setter fase til trekning', true, db(tp(), LARER).write(tPath + '/fase', 'trekning'));
check('lærer starter klokka', true, db(tp(), LARER).write(tPath + '/klokke/endsAt', now + 120000));
check('lærer pauser klokka', true, db(tp(), LARER).update(tPath + '/klokke', { endsAt: null, pausetMedIgjen: 45000 }));
check('lærer oppdaterer stokken', true, db(tp(), LARER).write(tPath + '/stokk/igjen', ['Sokker']));
check('lærer deler ut tema', true, db(tp(), LARER).write(tPath + '/elever/' + ELEV.uid + '/tema', 'Køer'));
check('lærer merker bytte brukt', true, db(tp(), LARER).update(tPath + '/elever/' + ELEV.uid, { tema: 'Sokker', harByttet: true, onskerBytte: false }));
check('lærer tømmer elevlista', true, db(tp(), LARER).write(tPath + '/elever', null));
check('lærer sletter rommet', true, db(tp(), LARER).write(tPath, null));

console.log('--- temaspinner: elevens flyt');
check('elev leser rommet (polling)', true, db(tp(), ELEV2).read(tPath));
check('elev melder seg på med navn', true, db(tp(), ELEV2).update(tPath + '/elever/' + ELEV2.uid, { navn: 'Jonas', ts: now }));
check('elev ber om bytte', true, db(tp(), ELEV).write(tPath + '/elever/' + ELEV.uid + '/onskerBytte', true));

console.log('--- temaspinner: gjenbruk av romkode');
const gammeltTRom = Object.assign({}, tRom, { opprettet: now - 20 * 3600 * 1000 });
check('annen lærer overtar gammel kode (>12t)', true, db(tp(gammeltTRom), ELEV2).write(tPath, Object.assign({}, nyttTRom, { owner: ELEV2.uid })));
check('annen lærer kaprer ferskt rom', false, db(tp(), ELEV2).write(tPath, Object.assign({}, nyttTRom, { owner: ELEV2.uid })));

console.log('--- temaspinner: hærverk');
check('elev velger sitt eget tema', false, db(tp(), ELEV).write(tPath + '/elever/' + ELEV.uid + '/tema', 'Sokker'));
check('elev skriver hele sin egen node med tema', false, db(tp(), ELEV).write(tPath + '/elever/' + ELEV.uid, { navn: 'Ida', ts: now, tema: 'Sokker' }));
check('elev endrer navnet sitt etterpå', false, db(tp(), ELEV).write(tPath + '/elever/' + ELEV.uid + '/navn', 'Tull'));
check('elev setter harByttet selv', false, db(tp(), ELEV).write(tPath + '/elever/' + ELEV.uid + '/harByttet', false));
check('elev ber om bytte to ganger', false, db(tp(Object.assign({}, tRom, { elever: { [ELEV.uid]: { navn: 'Ida', ts: now, tema: 'Køer', harByttet: true } } })), ELEV).write(tPath + '/elever/' + ELEV.uid + '/onskerBytte', true));
check('elev ber om bytte når det er avslått', false, db(tp(Object.assign({}, tRom, { byttBillettPa: false })), ELEV).write(tPath + '/elever/' + ELEV.uid + '/onskerBytte', true));
check('elev ber om bytte for en annen', false, db(tp(), ELEV2).write(tPath + '/elever/' + ELEV.uid + '/onskerBytte', true));
check('elev endrer fasen', false, db(tp(), ELEV).write(tPath + '/fase', 'ferdig'));
check('elev stopper klokka', false, db(tp(), ELEV).write(tPath + '/klokke/endsAt', now + 999999));
check('elev endrer temalista', false, db(tp(), ELEV).write(tPath + '/temaListe', ['Lett tema']));
check('elev stokker om', false, db(tp(), ELEV).write(tPath + '/stokk/igjen', ['Sokker']));
check('elev sletter en annens node', false, db(tp(), ELEV2).write(tPath + '/elever/' + ELEV.uid, null));
check('elev tømmer elevlista', false, db(tp(), ELEV).write(tPath + '/elever', null));
check('elev overtar eierskapet', false, db(tp(), ELEV).write(tPath + '/owner', ELEV.uid));
check('uinnlogget oppretter rom', false, db({}, null).write(tPath, nyttTRom));
check('uinnlogget melder seg på', false, db(tp(), null).update(tPath + '/elever/anon', { navn: 'Anon', ts: now }));
check('lister opp /temaspinner', false, db(tp(), LARER).read('/temaspinner'));

console.log('--- temaspinner: ugyldige data');
check('ugyldig fase', false, db(tp(), LARER).write(tPath + '/fase', 'presentasjon'));
check('ugyldig romkode', false, db({}, LARER).write('/temaspinner/8qy 8', nyttTRom));
check('for lang romkode', false, db({}, LARER).write('/temaspinner/' + 'A'.repeat(12), nyttTRom));
check('rom uten temaListe', false, db({}, LARER).write(tPath, { opprettet: now, owner: LARER.uid, fase: 'lobby' }));
check('rom med annens uid som owner', false, db({}, ELEV).write(tPath, Object.assign({}, nyttTRom, { owner: LARER.uid })));
check('tomt elevnavn', false, db(tp(), ELEV2).update(tPath + '/elever/' + ELEV2.uid, { navn: '', ts: now }));
check('kjempelangt elevnavn', false, db(tp(), ELEV2).update(tPath + '/elever/' + ELEV2.uid, { navn: 'x'.repeat(60), ts: now }));
check('elev uten ts', false, db(tp(), ELEV2).write(tPath + '/elever/' + ELEV2.uid, { navn: 'Jonas' }));
check('ukjent felt på elev', false, db(tp(), LARER).write(tPath + '/elever/' + ELEV2.uid, { navn: 'Jonas', ts: now, poeng: 10 }));
check('ukjent felt på klokka', false, db(tp(), LARER).write(tPath + '/klokke/hastighet', 2));
check('kjempelangt tema', false, db(tp(), LARER).write(tPath + '/elever/' + ELEV.uid + '/tema', 'x'.repeat(200)));
check('urimelig lang varighet', false, db(tp(), LARER).write(tPath + '/varighetMs', 99999999));
check('skriver rett på /temaspinner', false, db({}, LARER).write('/temaspinner', { evil: true }));

/* ══════════════════════════════════════════════════════════════
   TANKESKY
   Læreren eier rommet og styrer tema/friFlyt/runde. En elev kan opprette
   et nytt ord (count 1), øke et eksisterende ord med nøyaktig én uten å
   røre teksten, eller trekke nøyaktig én fra sitt eget forrige ord — kun
   når elevens egen innsendinger-post fortsatt peker på akkurat det ordet.
   ══════════════════════════════════════════════════════════════ */
const SKODE = 'SKY1';
const sRom = {
  opprettet: now,
  owner: LARER.uid,
  tema: 'Bærekraft',
  friFlyt: false,
  runde: 1,
  ord: {
    ord1: { tekst: 'Sirkulær økonomi', tekstNorm: 'sirkulær økonomi', count: 2, sistOppdatert: now },
    ord2: { tekst: 'Resirkulering', tekstNorm: 'resirkulering', count: 1, sistOppdatert: now },
  },
  innsendinger: {
    [ELEV.uid]: { ordId: 'ord1', runde: 1, tekst: 'Sirkulær økonomi' },
  },
};
const sp = (rom) => ({ tankesky: { [SKODE]: rom || sRom } });
const sPath = '/tankesky/' + SKODE;
const nyttSRom = { opprettet: now, owner: LARER.uid, tema: 'Bærekraft', friFlyt: false, runde: 1 };

console.log('--- tankesky: lærerens flyt');
check('lærer oppretter rom', true, db({}, LARER).write(sPath, nyttSRom));
check('lærer overskriver sitt eget rom', true, db(sp(), LARER).write(sPath, nyttSRom));
check('lærer endrer tema', true, db(sp(), LARER).write(sPath + '/tema', 'Klimaendringer'));
check('lærer skrur på fri flyt', true, db(sp(), LARER).write(sPath + '/friFlyt', true));
check('lærer starter ny runde (tømmer ord og innsendinger)', true, db(sp(), LARER).update(sPath, { runde: 2, ord: null, innsendinger: null }));
check('lærer fjerner et ord', true, db(sp(), LARER).write(sPath + '/ord/ord2', null));
check('lærer angrer fjerningen (samme id og data tilbake)', true, db(sp(), LARER).write(sPath + '/ord/ord2', sRom.ord.ord2));
check('lærer slår sammen to bobler', true, db(sp(), LARER).update(sPath, {
  'ord/ord1': { tekst: 'Sirkulær økonomi', tekstNorm: 'sirkulær økonomi', count: 3, sistOppdatert: now },
  'ord/ord2': null,
}));
check('lærer sletter rommet', true, db(sp(), LARER).write(sPath, null));

console.log('--- tankesky: elevens flyt');
check('elev leser rommet (ingen ordsky vises, men rommet finnes)', true, db(sp(), ELEV2).read(sPath));
check('elev oppretter et nytt ord', true, db(sp(), ELEV2).write(sPath + '/ord/nyord1', { tekst: 'Klima', tekstNorm: 'klima', count: 1, sistOppdatert: now }));
check('elev øker et eksisterende ord med én', true, db(sp(), ELEV2).write(sPath + '/ord/ord2', { tekst: 'Resirkulering', tekstNorm: 'resirkulering', count: 2, sistOppdatert: now }));
check('elev trekker fra sitt eget forrige ord (redigerer, fri flyt av)', true, db(sp(), ELEV).write(sPath + '/ord/ord1', { tekst: 'Sirkulær økonomi', tekstNorm: 'sirkulær økonomi', count: 1, sistOppdatert: now }));
check('elev oppdaterer sin egen innsendinger-post', true, db(sp(), ELEV).update(sPath + '/innsendinger/' + ELEV.uid, { ordId: 'ord2', runde: 1, tekst: 'Resirkulering' }));

console.log('--- tankesky: hærverk');
check('elev dekrementerer en andens ord', false, db(sp(), ELEV2).write(sPath + '/ord/ord1', { tekst: 'Sirkulær økonomi', tekstNorm: 'sirkulær økonomi', count: 1, sistOppdatert: now }));
check('elev hopper flere tall på telleren', false, db(sp(), ELEV).write(sPath + '/ord/ord2', { tekst: 'Resirkulering', tekstNorm: 'resirkulering', count: 10, sistOppdatert: now }));
check('elev endrer teksten mens telleren økes', false, db(sp(), ELEV).write(sPath + '/ord/ord2', { tekst: 'Jukseord', tekstNorm: 'jukseord', count: 2, sistOppdatert: now }));
check('elev oppretter et ord med feil starttall', false, db(sp(), ELEV2).write(sPath + '/ord/nyord2', { tekst: 'Klima', tekstNorm: 'klima', count: 2, sistOppdatert: now }));
check('elev sletter et ord som ikke er hennes eget siste bidrag', false, db(sp(), ELEV2).write(sPath + '/ord/ord1', null));
check('elev skrur på fri flyt', false, db(sp(), ELEV).write(sPath + '/friFlyt', true));
check('elev starter ny runde', false, db(sp(), ELEV).write(sPath + '/runde', 2));
check('elev sletter rommet', false, db(sp(), ELEV).write(sPath, null));
check('elev overtar eierskapet', false, db(sp(), ELEV).write(sPath + '/owner', ELEV.uid));
check('elev skriver innsendinger for en annen elev', false, db(sp(), ELEV).write(sPath + '/innsendinger/' + ELEV2.uid, { ordId: 'ord1', runde: 1, tekst: 'juks' }));
check('elev sender inn med feil runde i innsendinger', false, db(sp(), ELEV2).write(sPath + '/innsendinger/' + ELEV2.uid, { ordId: 'ord2', runde: 99, tekst: 'noe' }));
check('uinnlogget oppretter rom', false, db({}, null).write(sPath, nyttSRom));
check('uinnlogget sender inn et ord', false, db(sp(), null).write(sPath + '/ord/nyord3', { tekst: 'Klima', tekstNorm: 'klima', count: 1, sistOppdatert: now }));
check('lister opp /tankesky', false, db(sp(), LARER).read('/tankesky'));

console.log('--- tankesky: gjenbruk av romkode');
const gammeltSRom = Object.assign({}, sRom, { opprettet: now - 20 * 3600 * 1000 });
check('annen lærer overtar gammel kode (>12t)', true, db(sp(gammeltSRom), ELEV2).write(sPath, Object.assign({}, nyttSRom, { owner: ELEV2.uid })));
check('annen lærer kaprer ferskt rom', false, db(sp(), ELEV2).write(sPath, Object.assign({}, nyttSRom, { owner: ELEV2.uid })));

console.log('--- tankesky: ugyldige data');
check('ugyldig romkode', false, db({}, LARER).write('/tankesky/sky 1', nyttSRom));
check('for lang romkode', false, db({}, LARER).write('/tankesky/' + 'A'.repeat(12), nyttSRom));
check('rom uten tema', false, db({}, LARER).write(sPath, { opprettet: now, owner: LARER.uid, friFlyt: false, runde: 1 }));
check('rom med annens uid som owner', false, db({}, ELEV).write(sPath, Object.assign({}, nyttSRom, { owner: LARER.uid })));
check('kjempelangt tema', false, db(sp(), LARER).write(sPath + '/tema', 'x'.repeat(200)));
check('runde satt til null', false, db(sp(), LARER).write(sPath + '/runde', 0));
check('ukjent felt på rommet', false, db(sp(), LARER).write(sPath + '/ekstrafelt', true));
check('ukjent felt på et ord', false, db(sp(), ELEV2).write(sPath + '/ord/nyord4', { tekst: 'Klima', tekstNorm: 'klima', count: 1, sistOppdatert: now, ekstra: true }));
check('ord uten tekstNorm', false, db(sp(), ELEV2).write(sPath + '/ord/nyord5', { tekst: 'Klima', count: 1, sistOppdatert: now }));
check('tom tekst', false, db(sp(), ELEV2).write(sPath + '/ord/nyord6', { tekst: '', tekstNorm: '', count: 1, sistOppdatert: now }));
check('kjempelang tekst', false, db(sp(), ELEV2).write(sPath + '/ord/nyord7', { tekst: 'x'.repeat(70), tekstNorm: 'x'.repeat(70), count: 1, sistOppdatert: now }));
check('skriver rett på /tankesky', false, db({}, LARER).write('/tankesky', { evil: true }));

/* ── dagsformen (aktiviteter/dagsformen/): lærer lager rom og velger tema,
   elev velger (og bytter) en av 30 følelser ved å skrive sin egen node —
   akkurat som tankesky sine innsendinger, bare uten runde-begrepet. */
const DKODE = 'DDDD11';
const dPath = '/dagsformen/' + DKODE;
const nyttDRom = { opprettet: now, owner: LARER.uid, tema: 'emoji' };
const dRomMedElev = Object.assign({}, nyttDRom, { elever: { [ELEV.uid]: { valgt: 3, ts: now } } });
const dp = (rom) => ({ dagsformen: { [DKODE]: rom || dRomMedElev } });
const dTomtRom = { dagsformen: { [DKODE]: nyttDRom } };

console.log('--- dagsformen: lærerens flyt');
check('lærer oppretter rom', true, db({}, LARER).write(dPath, nyttDRom));
check('lærer bytter tema', true, db(dp(), LARER).write(dPath + '/tema', 'dyr'));
check('lærer nullstiller alle svar', true, db(dp(), LARER).update(dPath, { elever: null }));
check('lærer avslutter rommet', true, db(dp(), LARER).write(dPath, null));

console.log('--- dagsformen: elevens flyt');
check('elev leser rommet', true, db(dTomtRom, ELEV).read(dPath));
check('elev velger en følelse', true, db(dTomtRom, ELEV).write(dPath + '/elever/' + ELEV.uid, { valgt: 12, ts: now }));
check('elev ombestemmer seg', true, db(dp(), ELEV).write(dPath + '/elever/' + ELEV.uid, { valgt: 29, ts: now }));

console.log('--- dagsformen: hærverk');
check('elev bytter tema', false, db(dTomtRom, ELEV).write(dPath + '/tema', 'dyr'));
check('elev sletter rommet', false, db(dTomtRom, ELEV).write(dPath, null));
check('elev nullstiller alle svar', false, db(dp(), ELEV).write(dPath + '/elever', null));
check('elev velger følelse for en annen', false, db(dTomtRom, ELEV).write(dPath + '/elever/' + ELEV2.uid, { valgt: 1, ts: now }));
check('elev overtar eierskapet', false, db(dTomtRom, ELEV).write(dPath + '/owner', ELEV.uid));
check('uinnlogget oppretter rom', false, db({}, null).write(dPath, nyttDRom));
check('uinnlogget velger følelse', false, db(dTomtRom, null).write(dPath + '/elever/anon', { valgt: 1, ts: now }));
check('lister opp /dagsformen', false, db(dp(), LARER).read('/dagsformen'));

console.log('--- dagsformen: gjenbruk av romkode');
const gammeltDRom = Object.assign({}, nyttDRom, { opprettet: now - 20 * 3600 * 1000 });
check('annen lærer overtar gammel kode (>12t)', true, db(dp(gammeltDRom), ELEV2).write(dPath, Object.assign({}, nyttDRom, { owner: ELEV2.uid })));
check('annen lærer kaprer ferskt rom', false, db(dp(), ELEV2).write(dPath, Object.assign({}, nyttDRom, { owner: ELEV2.uid })));

console.log('--- dagsformen: ugyldige data');
check('ugyldig romkode', false, db({}, LARER).write('/dagsformen/aa', nyttDRom));
check('rom uten tema', false, db({}, LARER).write(dPath, { opprettet: now, owner: LARER.uid }));
check('rom med annens uid som owner', false, db({}, ELEV).write(dPath, Object.assign({}, nyttDRom, { owner: LARER.uid })));
check('følelse utenfor gyldig område', false, db(dTomtRom, ELEV).write(dPath + '/elever/' + ELEV.uid, { valgt: 99, ts: now }));
check('negativ følelsesindeks', false, db(dTomtRom, ELEV).write(dPath + '/elever/' + ELEV.uid, { valgt: -1, ts: now }));
check('følelse som tekst', false, db(dTomtRom, ELEV).write(dPath + '/elever/' + ELEV.uid, { valgt: '3', ts: now }));
check('mangler ts', false, db(dTomtRom, ELEV).write(dPath + '/elever/' + ELEV.uid, { valgt: 3 }));
check('ukjent felt på rommet', false, db(dp(), LARER).write(dPath + '/ekstrafelt', true));
check('ukjent felt på en elev', false, db(dTomtRom, ELEV).write(dPath + '/elever/' + ELEV.uid, { valgt: 3, ts: now, navn: 'juks' }));
check('skriver rett på /dagsformen', false, db({}, LARER).write('/dagsformen', { evil: true }));

/* ── verdikompasset (aktiviteter/verdikompasset/): lærer lager rom, elev
   rangerer 12 verdier og velger i 8 dilemmaer, og skriver sitt eget
   resultat (poeng/handling per verdi-id) under sin egen uid — samme
   eier/elev-mønster som dagsformen, bare med et fastere skjema per elev. */
const VKODE = 'VVVV11';
const vPath = '/verdikompasset/' + VKODE;
const nulltVerdier = { aer:0, ret:0, ven:0, mot:0, oms:0, res:0, ans:0, fri:0, try:0, fel:0, tol:0, mes:0 };
const nyttVRom = { opprettet: now, owner: LARER.uid };
const vElev = { navn: 'Kari', status: 'ferdig', poeng: Object.assign({}, nulltVerdier, { aer: 6 }), handling: Object.assign({}, nulltVerdier, { aer: 3 }), samsvar: 67, tid: now };
const vRomMedElev = Object.assign({}, nyttVRom, { elever: { [ELEV.uid]: vElev } });
const vp = (rom) => ({ verdikompasset: { [VKODE]: rom || vRomMedElev } });
const vTomtRom = { verdikompasset: { [VKODE]: nyttVRom } };

console.log('--- verdikompasset: lærerens flyt');
check('lærer oppretter rom', true, db({}, LARER).write(vPath, nyttVRom));
check('lærer nullstiller alle svar', true, db(vp(), LARER).update(vPath, { elever: null }));
check('lærer avslutter rommet', true, db(vp(), LARER).write(vPath, null));

console.log('--- verdikompasset: elevens flyt');
check('elev leser rommet', true, db(vTomtRom, ELEV).read(vPath));
check('elev lagrer startstatus', true, db(vTomtRom, ELEV).write(vPath + '/elever/' + ELEV.uid, { navn: 'Kari', status: 'startet', poeng: nulltVerdier, handling: nulltVerdier, tid: now }));
check('elev lagrer ferdig resultat', true, db(vp(), ELEV).write(vPath + '/elever/' + ELEV.uid, vElev));

console.log('--- verdikompasset: hærverk');
check('elev sletter rommet', false, db(vTomtRom, ELEV).write(vPath, null));
check('elev nullstiller alle svar', false, db(vp(), ELEV).write(vPath + '/elever', null));
check('elev skriver resultat for en annen', false, db(vTomtRom, ELEV).write(vPath + '/elever/' + ELEV2.uid, vElev));
check('elev overtar eierskapet', false, db(vTomtRom, ELEV).write(vPath + '/owner', ELEV.uid));
check('uinnlogget oppretter rom', false, db({}, null).write(vPath, nyttVRom));
check('uinnlogget skriver resultat', false, db(vTomtRom, null).write(vPath + '/elever/anon', vElev));
check('lister opp /verdikompasset', false, db(vp(), LARER).read('/verdikompasset'));

console.log('--- verdikompasset: gjenbruk av romkode');
const gammeltVRom = Object.assign({}, nyttVRom, { opprettet: now - 20 * 3600 * 1000 });
check('annen lærer overtar gammel kode (>12t)', true, db(vp(gammeltVRom), ELEV2).write(vPath, Object.assign({}, nyttVRom, { owner: ELEV2.uid })));
check('annen lærer kaprer ferskt rom', false, db(vp(), ELEV2).write(vPath, Object.assign({}, nyttVRom, { owner: ELEV2.uid })));

console.log('--- verdikompasset: ugyldige data');
check('ugyldig romkode', false, db({}, LARER).write('/verdikompasset/aa', nyttVRom));
check('rom med annens uid som owner', false, db({}, ELEV).write(vPath, Object.assign({}, nyttVRom, { owner: LARER.uid })));
check('ukjent status', false, db(vTomtRom, ELEV).write(vPath + '/elever/' + ELEV.uid, Object.assign({}, vElev, { status: 'juks' })));
check('poeng utenfor gyldig område', false, db(vTomtRom, ELEV).write(vPath + '/elever/' + ELEV.uid, Object.assign({}, vElev, { poeng: Object.assign({}, nulltVerdier, { aer: 99 }) })));
check('poeng mangler en verdi', false, db(vTomtRom, ELEV).write(vPath + '/elever/' + ELEV.uid, Object.assign({}, vElev, { poeng: { aer: 3 } })));
check('mangler handling', false, db(vTomtRom, ELEV).write(vPath + '/elever/' + ELEV.uid, { navn: 'Kari', status: 'ferdig', poeng: nulltVerdier, tid: now }));
check('ukjent felt på en elev', false, db(vTomtRom, ELEV).write(vPath + '/elever/' + ELEV.uid, Object.assign({}, vElev, { epost: 'juks@example.com' })));
check('for langt navn', false, db(vTomtRom, ELEV).write(vPath + '/elever/' + ELEV.uid, Object.assign({}, vElev, { navn: 'x'.repeat(30) })));
check('skriver rett på /verdikompasset', false, db({}, LARER).write('/verdikompasset', { evil: true }));

/* ── lrnify-auth.js (auth/lrnify-auth.js): users/, resultater/, og de nye
   eierUid/delteUider/klasseId-feltene på rooms/. LARER2 er en annen innlogget
   lærer, brukt til å bekrefte at data er strengt privat per lærer. */
const LARER2 = { uid: 'larer-2', provider: 'google.com' };

console.log('--- users: lærerens flyt');
const profilData = { navn: 'Kari Lærer', epost: 'kari@skole.no', opprettet: now };
const brukerDb = { users: { [LARER.uid]: { profile: profilData } } };
check('lærer skriver sin egen profil', true, db({}, LARER).write('/users/' + LARER.uid + '/profile', profilData));
check('lærer leser sin egen profil', true, db(brukerDb, LARER).read('/users/' + LARER.uid + '/profile'));
check('lærer legger til en klasse', true, db(brukerDb, LARER).write('/users/' + LARER.uid + '/klasser/-Nk1', { navn: '9B', trinn: '9', opprettet: now }));
check('lærer lagrer spillinnstillinger (fritt innhold)', true, db(brukerDb, LARER).write('/users/' + LARER.uid + '/spillinnstillinger/temaspinner', { favorittTema: 'norsk', dybde: { nivaa: 2 } }));

console.log('--- users: personvern og isolasjon');
check('annen lærer leser profilen', false, db(brukerDb, LARER2).read('/users/' + LARER.uid + '/profile'));
check('annen lærer skriver i en annens konto', false, db(brukerDb, LARER2).write('/users/' + LARER.uid + '/profile', profilData));
check('uinnlogget leser en profil', false, db(brukerDb, null).read('/users/' + LARER.uid + '/profile'));
check('uinnlogget skriver en profil', false, db({}, null).write('/users/' + LARER.uid + '/profile', profilData));
check('lister opp /users', false, db(brukerDb, LARER).read('/users'));
check('profil uten epost', false, db({}, LARER).write('/users/' + LARER.uid + '/profile', { navn: 'Kari', opprettet: now }));
check('profil med ekstra metadata', false, db({}, LARER).write('/users/' + LARER.uid + '/profile', Object.assign({}, profilData, { skole: 'Eik skole' })));
check('lærer skriver i en annens klasseliste', false, db(brukerDb, LARER2).write('/users/' + LARER.uid + '/klasser/-Nk2', { navn: '9C', trinn: '9', opprettet: now }));

/* ── Klasselister (LRNifyAuth.lagreKlasse/hentKlasser) ─────────────────────
   Elevfornavn er den eneste elevdataen i hele strukturen, og ligger strengt
   privat under lærerens konto. Testene under låser formen: navn og kjønn,
   ingenting mer — særlig ikke relasjoner mellom elever («må ikke sitte
   sammen»), som skal bli liggende lokalt på lærerens maskin. */
console.log('--- klasser: lagrede klasselister');
const klasse9b = {
  navn: '9B', trinn: '9', opprettet: now,
  elever: [{ navn: 'Ida', kjonn: 'j' }, { navn: 'Jonas', kjonn: 'g' }, { navn: 'Alex', kjonn: 'a' }]
};
const klasseSti = '/users/' + LARER.uid + '/klasser/k1';
const medKlasse = { users: { [LARER.uid]: { klasser: { k1: klasse9b } } } };

check('lærer lagrer en klasse med elever', true, db({}, LARER).write(klasseSti, klasse9b));
check('lærer leser sine egne klasser', true, db(medKlasse, LARER).read('/users/' + LARER.uid + '/klasser'));
check('lærer oppdaterer klassen', true, db(medKlasse, LARER).write(klasseSti, Object.assign({}, klasse9b, { elever: [{ navn: 'Ida', kjonn: 'j' }] })));
check('lærer sletter klassen', true, db(medKlasse, LARER).write(klasseSti, null));
check('klasse uten kjønn oppgitt', true, db({}, LARER).write(klasseSti, Object.assign({}, klasse9b, { elever: [{ navn: 'Ida' }] })));

console.log('--- klasser: strengt privat');
check('annen lærer leser klasselista', false, db(medKlasse, LARER2).read('/users/' + LARER.uid + '/klasser'));
check('annen lærer leser én klasse', false, db(medKlasse, LARER2).read(klasseSti));
check('uinnlogget leser klasselista', false, db(medKlasse, null).read(klasseSti));
check('elev (anonym) leser klasselista', false, db(medKlasse, ELEV).read(klasseSti));
check('annen lærer skriver i klasselista', false, db(medKlasse, LARER2).write(klasseSti, klasse9b));

console.log('--- klasser: formen er låst (ingen sensitive tillegg)');
check('relasjonsregel «må ikke sitte sammen»', false, db({}, LARER).write(klasseSti, Object.assign({}, klasse9b, { ikkeSammen: [['Ida', 'Jonas']] })));
check('elev med notat om atferd', false, db({}, LARER).write(klasseSti, Object.assign({}, klasse9b, { elever: [{ navn: 'Ida', kjonn: 'j', notat: 'urolig' }] })));
check('elev med fødselsdato', false, db({}, LARER).write(klasseSti, Object.assign({}, klasse9b, { elever: [{ navn: 'Ida', kjonn: 'j', fodt: '2011-04-02' }] })));
check('elev uten navn', false, db({}, LARER).write(klasseSti, Object.assign({}, klasse9b, { elever: [{ kjonn: 'j' }] })));
check('tomt elevnavn', false, db({}, LARER).write(klasseSti, Object.assign({}, klasse9b, { elever: [{ navn: '', kjonn: 'j' }] })));
check('ugyldig kjønnsverdi', false, db({}, LARER).write(klasseSti, Object.assign({}, klasse9b, { elever: [{ navn: 'Ida', kjonn: 'jente' }] })));
check('kjempelangt elevnavn', false, db({}, LARER).write(klasseSti, Object.assign({}, klasse9b, { elever: [{ navn: 'x'.repeat(80), kjonn: 'j' }] })));
check('klasse uten navn', false, db({}, LARER).write(klasseSti, { trinn: '9', opprettet: now, elever: [{ navn: 'Ida' }] }));

console.log('--- resultater: aggregert, aldri navngitt');
const oktData = { dato: now, romkode: 'ABCD', riktige: 12, deltakere: 24 };
const resultatDb = { resultater: { [LARER.uid]: { temaspinner: { '-No1': oktData } } } };
check('lærer lagrer en aggregert økt', true, db({}, LARER).write('/resultater/' + LARER.uid + '/temaspinner/-No1', oktData));
check('lærer leser egne resultater', true, db(resultatDb, LARER).read('/resultater/' + LARER.uid));
check('annen lærer leser resultatene', false, db(resultatDb, LARER2).read('/resultater/' + LARER.uid));
check('uinnlogget leser resultater', false, db(resultatDb, null).read('/resultater/' + LARER.uid));
check('økt uten romkode', false, db({}, LARER).write('/resultater/' + LARER.uid + '/temaspinner/-No2', { dato: now }));
check('navngitt elevresultat forsøkt lagret', false, db({}, LARER).write('/resultater/' + LARER.uid + '/temaspinner/-No2', Object.assign({}, oktData, { elever: { '-e1': { navn: 'Ida', poeng: 4 } } })));

console.log('--- rooms: eierUid/delteUider/klasseId/spill (lrnify-auth)');
const eidPollMedEier = Object.assign({}, eidPoll, { eierUid: LARER.uid, spill: 'klassepoll' });
check('lærer oppretter rom med eierUid + spill (som LRNifyAuth.opprettRom)', true, db({}, LARER).write('/rooms/ABC123', eidPollMedEier));
check('lærer setter klasseId på eget rom etterpå', true, db({ rooms: { ABC123: eidPollMedEier } }, LARER).write('/rooms/ABC123/klasseId', '-Nk1'));
check('lærer leser eget klasseId', true, db({ rooms: { ABC123: Object.assign({}, eidPollMedEier, { klasseId: '-Nk1' }) } }, LARER).read('/rooms/ABC123/klasseId'));
check('elev leser eierUid (offentlig, som resten av rommet)', true, db({ rooms: { ABC123: eidPollMedEier } }, ELEV).read('/rooms/ABC123/eierUid'));
check('en lærer forsøker å adoptere et allerede eksisterende (anonymt) rom', false, db(nyttRom, LARER2).write('/rooms/ABC123/eierUid', LARER2.uid));
check('en lærer setter en annens uid som eierUid', false, db({}, LARER2).write('/rooms/ABC123/eierUid', LARER.uid));
check('en annen lærer setter klasseId på noen andres rom', false, db({ rooms: { ABC123: eidPollMedEier } }, LARER2).write('/rooms/ABC123/klasseId', '-Nk9'));
check('lærer 2 skriver seg selv inn i delteUider på et rom uten eierUid', false, db(nyttRom, LARER2).write('/rooms/ABC123/delteUider/' + LARER2.uid, true));
check('ugyldig spillnavn (stor bokstav)', false, db({}, LARER).write('/rooms/ABC123', Object.assign({}, eidPollMedEier, { spill: 'KlassePoll' })));

/* ── Rom-indeksen (LRNifyAuth.opprettRom / hentMineRom) ────────────────────
   /rooms kan ikke listes opp av noen, så hentMineRom leser lærerens egen
   peker-indeks i stedet. Testene under dekker LESE-stien eksplisitt — det
   var mangelen på nettopp den som gjorde at den første versjonen av
   hentMineRom (en spørring mot /rooms) alltid ble avvist. */
console.log('--- rom-indeks: opprettRom skriver atomisk til to steder');
const pekerSti = '/users/' + LARER.uid + '/rom/klassepoll/ABCD';
const atomisk = {};
atomisk['/rooms/ABCD'] = Object.assign({}, eidPollMedEier);
atomisk[pekerSti] = { opprettet: now };
check('lærer oppretter rom + peker i én operasjon', true, db({}, LARER).update('/', atomisk));

const medIndeks = {
  rooms: { ABCD: eidPollMedEier },
  users: { [LARER.uid]: { rom: { klassepoll: { ABCD: { opprettet: now } } } } }
};
check('lærer leser sin egen rom-indeks (det hentMineRom gjør)', true, db(medIndeks, LARER).read('/users/' + LARER.uid + '/rom/klassepoll'));
check('lærer slår opp rommet pekeren viser til', true, db(medIndeks, LARER).read('/rooms/ABCD'));
check('lærer fjerner pekeren når rommet avsluttes', true, db(medIndeks, LARER).write(pekerSti, null));

console.log('--- rom-indeks: avsluttRom rydder begge steder');
const rydd = {};
rydd['/rooms/ABCD'] = null;
rydd[pekerSti] = null;
check('lærer sletter rom + peker i én operasjon', true, db(medIndeks, LARER).update('/', rydd));
check('annen lærer sletter mitt rom + peker', false, db(medIndeks, LARER2).update('/', rydd));

console.log('--- rom-indeks: fortsatt umulig å ramse opp alle rom');
check('lister opp /rooms som innlogget lærer', false, db(medIndeks, LARER).read('/rooms'));
check('annen lærer leser min rom-indeks', false, db(medIndeks, LARER2).read('/users/' + LARER.uid + '/rom/klassepoll'));
check('uinnlogget leser rom-indeksen', false, db(medIndeks, null).read('/users/' + LARER.uid + '/rom/klassepoll'));
check('annen lærer skriver peker inn i min indeks', false, db(medIndeks, LARER2).write('/users/' + LARER.uid + '/rom/klassepoll/ZZZZ', { opprettet: now }));
check('peker uten opprettet', false, db(medIndeks, LARER).write('/users/' + LARER.uid + '/rom/klassepoll/EFGH', { klasseId: '-Nk1' }));
check('peker med ukjent felt', false, db(medIndeks, LARER).write('/users/' + LARER.uid + '/rom/klassepoll/EFGH', { opprettet: now, hemmelig: 1 }));
check('peker med ugyldig romkode', false, db(medIndeks, LARER).write('/users/' + LARER.uid + '/rom/klassepoll/ab!', { opprettet: now }));
check('peker under ugyldig spillnavn', false, db(medIndeks, LARER).write('/users/' + LARER.uid + '/rom/KlassePoll/ABCD', { opprettet: now }));
check('eier deler rommet med en kollega (forberedt, ikke i bruk i v1-UI)', true, db({ rooms: { ABC123: eidPollMedEier } }, LARER).write('/rooms/ABC123/delteUider/' + LARER2.uid, true));
check('gammelt rom uten eierUid fungerer fortsatt uendret', true, db({}, null).write('/rooms/ABC123', basePoll));

/* ── /konto/: oppdaterNavn og slettHeleKontoen (LRNifyAuth) ────────────────
   oppdaterNavn skriver KUN navn-feltet direkte, ikke hele profile-objektet
   — verifiserer at det målrettede skrivet fortsatt validerer selv om
   epost/opprettet ikke er med i den enkelte operasjonen (de ligger jo
   allerede i eksisterende data). slettHeleKontoen sletter tre separate
   stier i rekkefølge (rom, users/{uid}, resultater/{uid}) — hver må være
   lov for eieren og forbudt for alle andre. */
console.log('--- konto: oppdaterNavn (målrettet leaf-write) ---');
const profilKlasseRom = {
  users: { [LARER.uid]: {
    profile: { navn: 'Kari', epost: 'kari@skole.no', opprettet: now },
    rom: { klassepoll: { ABCD: { opprettet: now } } }
  } },
  resultater: { [LARER.uid]: { klassepoll: { o1: { dato: now, romkode: 'ABCD' } } } },
  rooms: { ABCD: { question: 'q', options: ['a', 'b'], votes: { 0: 0, 1: 0 }, open: true, createdAt: now, owner: LARER.uid, eierUid: LARER.uid, spill: 'klassepoll' } }
};
check('lærer endrer bare navn-feltet', true, db(profilKlasseRom, LARER).write('/users/' + LARER.uid + '/profile/navn', 'Kari Ny'));
check('for langt navn avvist', false, db(profilKlasseRom, LARER).write('/users/' + LARER.uid + '/profile/navn', 'x'.repeat(100)));
check('annen lærer kan ikke endre mitt navn', false, db(profilKlasseRom, LARER2).write('/users/' + LARER.uid + '/profile/navn', 'Hacket'));

console.log('--- konto: slettHeleKontoen (rom → users → resultater) ---');
check('lærer sletter sitt eget rom', true, db(profilKlasseRom, LARER).write('/rooms/ABCD', null));
check('lærer sletter hele users/{uid}', true, db(profilKlasseRom, LARER).write('/users/' + LARER.uid, null));
check('lærer sletter hele resultater/{uid}', true, db(profilKlasseRom, LARER).write('/resultater/' + LARER.uid, null));
check('annen lærer kan ikke slette mitt rom', false, db(profilKlasseRom, LARER2).write('/rooms/ABCD', null));
check('annen lærer kan ikke slette min konto-data', false, db(profilKlasseRom, LARER2).write('/users/' + LARER.uid, null));
check('annen lærer kan ikke slette mine resultater', false, db(profilKlasseRom, LARER2).write('/resultater/' + LARER.uid, null));

/* ── /bruk/: anonym besøksstatistikk (bruk/lrnify-bruk.js) ────────────────
   Telleren skriver ett tall uten pålogging, og skal ikke kunne brukes til
   noe annet enn å telle oppover. Ingen kan lese tallene uten admin-flagg,
   og ingen kan telle ned, sette et vilkårlig tall eller slette historikk
   — heller ikke den som selv la den inn. */
console.log('--- bruk: telling (uinnlogget besøkende) ---');
const IDAG = new Date(now).toISOString().slice(0, 10);
const P = '/bruk/' + IDAG + '/games-3s1f/visning';
const tomStat   = {};
const statMed40 = { bruk: { [IDAG]: { 'games-3s1f': { visning: 40 } } } };
const ADMIN = { uid: 'admin-1', provider: 'google.com' };
const medAdmin = Object.assign({ users: { [ADMIN.uid]: { admin: true } } }, statMed40);

check('første besøk oppretter telleren på 1', true, db(tomStat, null).write(P, 1));
check('neste besøk teller opp med 1', true, db(statMed40, null).write(P, 41));
check('en ny hendelsestype kan tas i bruk uten regelendring', true, db(statMed40, null).write('/bruk/' + IDAG + '/games-3s1f/runde-fullfort', 1));

console.log('--- bruk: telleren kan ikke misbrukes ---');
check('oppretter telleren på et vilkårlig tall', false, db(tomStat, null).write(P, 5000));
check('hopper over flere tall om gangen', false, db(statMed40, null).write(P, 60));
check('teller nedover', false, db(statMed40, null).write(P, 39));
check('sletter en dags statistikk', false, db(statMed40, null).write('/bruk/' + IDAG, null));
check('sletter en enkelt teller', false, db(statMed40, null).write(P, null));
check('overskriver hele bruk-treet', false, db(statMed40, null).write('/bruk', { x: 1 }));
check('skriver tekst i stedet for tall', false, db(tomStat, null).write(P, 'mange'));
check('ugyldig datonøkkel', false, db(tomStat, null).write('/bruk/i-fjor/games-3s1f/visning', 1));
check('ugyldig sidenøkkel (store bokstaver)', false, db(tomStat, null).write('/bruk/' + IDAG + '/Games-3S1F/visning', 1));
check('ugyldig hendelsesnøkkel', false, db(tomStat, null).write('/bruk/' + IDAG + '/games-3s1f/visning!', 1));
check('legger inn et objekt i stedet for en teller', false, db(tomStat, null).write('/bruk/' + IDAG + '/games-3s1f', { visning: 1 }));

console.log('--- bruk: lesing er forbeholdt admin ---');
check('uinnlogget leser statistikken', false, db(statMed40, null).read('/bruk'));
check('vanlig innlogget lærer leser statistikken', false, db(medAdmin, LARER).read('/bruk'));
check('vanlig lærer leser én enkelt teller', false, db(medAdmin, LARER).read(P));
check('admin leser statistikken', true, db(medAdmin, ADMIN).read('/bruk'));
check('lærer kan ikke gjøre seg selv til admin', false, db(medAdmin, LARER).write('/users/' + LARER.uid + '/admin', true));

// ---------------------------------------------------------------------------
// Ledertavle (games/geografi/kartografen/). Verdensåpen: hvem som helst kan
// lese, og hvem som helst kan legge til én tid. Reglene kan derfor ikke stole
// på hvem som skriver — de kan bare passe på at en oppføring har riktig form,
// at ingen rører andres tider, og at tida ikke er fysisk umulig.
// ---------------------------------------------------------------------------
const LT = '/ledertavle/kartografen/norge_fylker_tid';
const LTA = '/ledertavle/kartografen/europa_land_arkade';
const tid = { navn: 'OMJ', ms: 42000, n: 15, ts: now };
const arkade = { navn: 'OMJ', pts: 20000, n: 47, ts: now };
const tavle = { ledertavle: { kartografen: { norge_fylker_tid: { '-Nt1': tid } } } };
const tomTavle = {};

console.log('--- ledertavle: normal flyt (Spill på tid)');
check('elev leverer en tid', true, db(tomTavle, null).write(LT + '/-Nt2', tid));
check('elev leverer i en tavle som finnes fra før', true, db(tavle, null).write(LT + '/-Nt2', tid));
check('hvem som helst leser tavla', true, db(tavle, null).read(LT));
check('innlogget lærer leverer også', true, db(tavle, LARER).write(LT + '/-Nt2', tid));
check('rask, men mulig tid (15 fylker på 6 s)', true, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'RAP', ms: 6000, n: 15, ts: now }));

console.log('--- ledertavle: normal flyt (Arkade)');
check('elev leverer en poengsum', true, db(tomTavle, null).write(LTA + '/-Na1', arkade));
check('makspoengsum for 47 land (47*3000) går gjennom', true, db(tomTavle, null).write(LTA + '/-Na1', { navn: 'MAX', pts: 141000, n: 47, ts: now }));
check('null poeng er gyldig (bomma på alt)', true, db(tomTavle, null).write(LTA + '/-Na1', { navn: 'NUL', pts: 0, n: 47, ts: now }));

console.log('--- ledertavle: ms og pts utelukker hverandre');
check('begge felt samtidig', false, db(tomTavle, null).write(LTA + '/-Na1', { navn: 'OMJ', ms: 42000, pts: 20000, n: 47, ts: now }));
check('poengsum sendt inn på en tidsbasert tavle uten ms', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'OMJ', pts: 20000, n: 15, ts: now }));
check('ingen av delene', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'OMJ', n: 15, ts: now }));
check('for høy poengsum for antall land (over 3000/land)', false, db(tomTavle, null).write(LTA + '/-Na1', { navn: 'OMJ', pts: 141001, n: 47, ts: now }));
check('negativ poengsum', false, db(tomTavle, null).write(LTA + '/-Na1', { navn: 'OMJ', pts: -1, n: 47, ts: now }));
check('poengsum som tekst', false, db(tomTavle, null).write(LTA + '/-Na1', { navn: 'OMJ', pts: '20000', n: 47, ts: now }));
check('gyldig ms-oppføring i en _arkade-navngitt tavle', false, db(tomTavle, null).write(LTA + '/-Na1', { navn: 'OMJ', ms: 42000, n: 47, ts: now }));

console.log('--- ledertavle: hærverk');
check('endrer en annens tid', false, db(tavle, null).write(LT + '/-Nt1/ms', 1000));
check('overskriver en annens oppføring', false, db(tavle, null).write(LT + '/-Nt1', tid));
check('sletter en annens tid', false, db(tavle, null).write(LT + '/-Nt1', null));
check('tømmer hele tavla', false, db(tavle, null).write(LT, null));
check('overskriver hele tavla', false, db(tavle, null).write(LT, { '-Nx': tid }));
check('sletter hele ledertavletreet', false, db(tavle, null).write('/ledertavle', null));
check('lister opp alle tavler', false, db(tavle, null).read('/ledertavle'));
check('lister opp alle spill', false, db(tavle, null).read('/ledertavle/kartografen'));

console.log('--- ledertavle: juks og ugyldige data');
check('umulig tid (15 fylker på 1 s)', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'JUK', ms: 1000, n: 15, ts: now }));
check('null millisekunder', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'JUK', ms: 0, n: 15, ts: now }));
check('negativ tid', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'JUK', ms: -5000, n: 15, ts: now }));
// Grensa for hva reglene kan få til: de vet ikke at norge_fylker_tid har 15
// oppgaver, så n=1 med ms=1000 er internt konsistent og slipper gjennom.
// Klienten forkaster oppføringer der n ikke stemmer med rundens faktiske
// antall. En verdensåpen tavle som tar imot data fra nettleseren kan
// uansett aldri bli juksesikker; reglene stopper søppel og hærverk, ikke
// en bevisst jukser med konsoll.
check('feil n slipper gjennom reglene (klienten luker det bort)', true, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'JUK', ms: 1000, n: 1, ts: now }));
check('riktig n gir et gulv som holder', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'JUK', ms: 1000, n: 15, ts: now }));
check('urimelig mange oppgaver', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'JUK', ms: 90000, n: 500, ts: now }));
check('backdaterer for å komme inn på gårsdagens liste', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'JUK', ms: 42000, n: 15, ts: now - 86400000 }));
check('daterer fram i tid', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'JUK', ms: 42000, n: 15, ts: now + 86400000 }));
check('for lange initialer', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'JUKS', ms: 42000, n: 15, ts: now }));
check('initialer på nøyaktig 3 tegn går gjennom', true, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'ABC', ms: 42000, n: 15, ts: now }));
check('tomme initialer', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: '', ms: 42000, n: 15, ts: now }));
check('mellomrom i initialene', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'A B', ms: 42000, n: 15, ts: now }));
check('initialer med innledende mellomrom', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: ' AB', ms: 42000, n: 15, ts: now }));
check('tabulator i initialene', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'A\tB', ms: 42000, n: 15, ts: now }));
check('linjeskift i initialene', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'A\nB', ms: 42000, n: 15, ts: now }));
check('mangler felt', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'OMJ', ms: 42000 }));
check('smugler inn et ekstra felt', false, db(tomTavle, null).write(LT + '/-Nt2', Object.assign({}, tid, { lenke: 'http://spam' })));
check('tid som tekst', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: 'JUK', ms: '1', n: 15, ts: now }));
check('objekt i navnefeltet', false, db(tomTavle, null).write(LT + '/-Nt2', { navn: { a: 1 }, ms: 42000, n: 15, ts: now }));
check('ugyldig tavlenøkkel', false, db(tomTavle, null).write('/ledertavle/kartografen/Norge Fylker/-Nt2', tid));
check('ugyldig spillnøkkel', false, db(tomTavle, null).write('/ledertavle/Kartografen!/norge_fylker_tid/-Nt2', tid));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
