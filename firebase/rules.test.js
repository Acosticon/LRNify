// Simulerer reglene i database.rules.json mot ekte klientoperasjoner fra
// aktiviteter/poll/, aktiviteter/terningspill/ og aktiviteter/genetikhjul/.
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

/* ── genetikhjul (aktiviteter/genetikhjul/) ────────────────────────────────
   Elevene sender inn uten pålogging (elev.html laster ikke auth-SDK-et), mens
   tavla merker klassekoden med sin anonyme id og er den eneste som kan
   nullstille klassen etterpå. */
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

console.log('--- genetikhjul: klasser uten owner (anonym pålogging av)');
check('uinnlogget tavle nullstiller klasse uten owner', true, db(loestHjul, null).write('/genetikhjul/' + KODE + '/elever', null));
check('klasse uten owner: ugyldig profil fortsatt blokkert', false, db(loestHjul, null).write('/genetikhjul/' + KODE + '/elever/-Nh2', { navn: 'Ada', kjonn: 'F', ts: now }));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
