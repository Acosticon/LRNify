// Simulerer reglene i database.rules.json mot ekte klientoperasjoner fra
// aktiviteter/poll/ og aktiviteter/terningspill/.
//
//   npm install targaryen
//   node firebase/rules.test.js
//
const targaryen = require('targaryen');
const rules = require('./database.rules.json');

let pass = 0, fail = 0;
function check(name, expected, result) {
  const ok = result.allowed === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      -> ${result.info.split('\n').slice(-6).join('\n      ')}`}`);
}
const now = Date.now();
const db = (data) => targaryen.database(rules, data, now).as(null);

const room = { question: 'Hva er hovedstaden?', options: ['Oslo', 'Bergen', 'Troms', 'Ålesund'], votes: { 0: 0, 1: 2, 2: 0, 3: 0 }, open: true, createdAt: now };
const krleRoom = { createdAt: now, teams: { '-Nx1': { name: 'Lag A', joinedAt: now } }, answers: { '-Ny1': { text: 'svar', team: 'Lag A', sentAt: now } }, state: { type: 'concept', content: 'tro', roll: 4 } };
const withRoom = { rooms: { ABC123: room } };
const withKrle = { krle: { ABC123: krleRoom } };

console.log('--- poll: legitimate flows');
check('teacher creates room', true, db({}).write('/rooms/ABC123', room));
check('teacher deletes room', true, db(withRoom).write('/rooms/ABC123', null));
check('student increments vote 1 -> 3', true, db(withRoom).write('/rooms/ABC123/votes/1', 3));
check('student increments vote 0 -> 1', true, db(withRoom).write('/rooms/ABC123/votes/0', 1));
check('student reads room', true, db(withRoom).read('/rooms/ABC123'));

console.log('--- poll: attacks');
check('read /rooms (enumerate)', false, db(withRoom).read('/rooms'));
check('read root', false, db(withRoom).read('/'));
check('stuff vote to 9999', false, db(withRoom).write('/rooms/ABC123/votes/1', 9999));
check('decrement vote', false, db(withRoom).write('/rooms/ABC123/votes/1', 1));
check('vote on non-existent index 7', false, db(withRoom).write('/rooms/ABC123/votes/7', 1));
check('rewrite question in live room', false, db(withRoom).write('/rooms/ABC123/question', 'hacked'));
check('overwrite whole live room', false, db(withRoom).write('/rooms/ABC123', room));
check('create room with junk field', false, db({}).write('/rooms/ABC123', Object.assign({ evil: 'x' }, room)));
check('create room missing votes', false, db({}).write('/rooms/ABC123', { question: 'q', options: ['a', 'b'], open: true, createdAt: now }));
check('create room with 5KB question', false, db({}).write('/rooms/ABC123', Object.assign({}, room, { question: 'x'.repeat(5000) })));
check('create room with bad code', false, db({}).write('/rooms/hax!!', room));
check('write junk at /rooms', false, db({}).write('/rooms', { evil: true }));
check('write junk at root', false, db({}).write('/evil', { a: 1 }));

console.log('--- krle: legitimate flows');
check('host creates room', true, db({}).write('/krle/ABC123', { createdAt: now }));
check('host sets concept state', true, db(withKrle).write('/krle/ABC123/state', { type: 'concept', content: 'tro', roll: 3 }));
check('host sets activity state', true, db(withKrle).write('/krle/ABC123/state', { type: 'activity', content: 'hopp', roll: 6 }));
check('host clears answers', true, db(withKrle).write('/krle/ABC123/answers', null));
check('host deletes room', true, db(withKrle).write('/krle/ABC123', null));
check('student joins (push team)', true, db(withKrle).write('/krle/ABC123/teams/-Nz9', { name: 'Lag B', joinedAt: now }));
check('student sends answer', true, db(withKrle).write('/krle/ABC123/answers/-Nz9', { text: 'mitt svar', team: 'Lag B', sentAt: now }));
check('student reads state', true, db(withKrle).read('/krle/ABC123/state'));
check('host reads answers', true, db(withKrle).read('/krle/ABC123/answers'));

console.log('--- krle: attacks');
check('read /krle (enumerate)', false, db(withKrle).read('/krle'));
check('edit someone elses answer', false, db(withKrle).write('/krle/ABC123/answers/-Ny1', { text: 'endret', team: 'Lag A', sentAt: now }));
// Deleting one of several answers is denied. Deleting the only answer equals
// clearing the whole list, which the host is allowed to do by design.
const twoAnswers = { krle: { ABC123: Object.assign({}, krleRoom, { answers: { '-Ny1': { text: 'a', team: 'L', sentAt: now }, '-Ny2': { text: 'b', team: 'M', sentAt: now } } }) } };
check('delete one of several answers', false, db(twoAnswers).write('/krle/ABC123/answers/-Ny1', null));
check('clear last answer == clearing list', true, db(withKrle).write('/krle/ABC123/answers/-Ny1', null));
check('delete a team', false, db(withKrle).write('/krle/ABC123/teams/-Nx1', null));
check('bogus state type', false, db(withKrle).write('/krle/ABC123/state', { type: 'evil', content: 'x', roll: 3 }));
check('roll out of range', false, db(withKrle).write('/krle/ABC123/state', { type: 'concept', content: 'x', roll: 99 }));
check('state on non-existent room', false, db({}).write('/krle/ZZZZZZ/state', { type: 'concept', content: 'x', roll: 3 }));
check('answer in non-existent room', false, db({}).write('/krle/ZZZZZZ/answers/-a', { text: 't', team: 'l', sentAt: now }));
check('huge answer text', false, db(withKrle).write('/krle/ABC123/answers/-Nz9', { text: 'x'.repeat(2000), team: 'L', sentAt: now }));
check('team name too long', false, db(withKrle).write('/krle/ABC123/teams/-Nz9', { name: 'x'.repeat(100), joinedAt: now }));
check('extra field on answer', false, db(withKrle).write('/krle/ABC123/answers/-Nz9', { text: 't', team: 'l', sentAt: now, evil: 1 }));
check('overwrite live krle room', false, db(withKrle).write('/krle/ABC123', { createdAt: now }));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
