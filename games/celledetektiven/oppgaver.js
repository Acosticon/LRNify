/* Celledetektiven — oppgavene. Bare innhold her; reglene ligger i motor.js.
   Regeltyper: rad, kolonne (a, n) · over, under, venstre, hoyre,
   radRettOver, radRettUnder, kolRettVenstre, kolRettHoyre (a, b).
   hint1 = faghjelp (bare for ledetråder som krever fagkunnskap),
   hint2 = hva ledetråden betyr på brettet. */
(function (root) {
  'use strict';

  const BRIKKER = {
    cellekjerne:  { navn: 'Cellekjerne',  bestemt: 'cellekjernen',  farge: '#8b5cf6' },
    mitokondrium: { navn: 'Mitokondrium', bestemt: 'mitokondriet',  farge: '#f97316' },
    kloroplast:   { navn: 'Kloroplast',   bestemt: 'kloroplasten',  farge: '#16a34a' },
    cellemembran: { navn: 'Cellemembran', bestemt: 'cellemembranen', farge: '#eab308' },
    vakuole:      { navn: 'Vakuole',      bestemt: 'vakuolen',      farge: '#0ea5e9' },
    ribosom:      { navn: 'Ribosom',      bestemt: 'ribosomet',     farge: '#e11d48' },
  };

  const OPPGAVER = [
    {
      id: 'celler-opplaering',
      tittel: 'Lær å spille',
      vanskelighet: 'opplaering',
      kravUnikLosning: false,
      storrelse: 3,
      oppdrag: 'Finn en plassering som passer med alle ledetrådene.',
      brikker: ['cellekjerne', 'kloroplast', 'mitokondrium'],
      ledetrader: [
        {
          tekst: 'Cellekjernen står i rad 1.',
          hint2: 'Sett cellekjernen i en av rutene i den øverste raden.',
          regler: [{ type: 'rad', a: 'cellekjerne', n: 1 }],
        },
        {
          tekst: 'Organellen der fotosyntesen foregår står i kolonne 3.',
          hint1: 'Fotosyntesen foregår i kloroplasten.',
          hint2: 'Sett kloroplasten i en av rutene i kolonne 3, helt til høyre.',
          regler: [{ type: 'kolonne', a: 'kloroplast', n: 3 }],
        },
        {
          tekst: 'Mitokondriet står lenger ned enn kloroplasten.',
          hint2: 'Mitokondriet skal stå i en rad lenger ned enn kloroplasten.',
          regler: [{ type: 'under', a: 'mitokondrium', b: 'kloroplast' }],
        },
      ],
      fakta: [
        'Fotosyntesen foregår i kloroplasten.',
      ],
    },
    {
      id: 'celler-01',
      tittel: 'Mysteriet i cellen',
      vanskelighet: 'lett',
      kravUnikLosning: true,
      storrelse: 6,
      oppdrag: 'Bruk ledetrådene til å finne ut hvor hver del av cellen står. Det finnes bare én riktig løsning.',
      brikker: ['cellekjerne', 'mitokondrium', 'kloroplast', 'cellemembran', 'vakuole', 'ribosom'],
      ledetrader: [
        {
          tekst: 'Cellekjernen står i rad 2 og kolonne 4.',
          hint2: 'Finn ruten der rad 2 og kolonne 4 møtes, og sett cellekjernen der.',
          regler: [{ type: 'rad', a: 'cellekjerne', n: 2 }, { type: 'kolonne', a: 'cellekjerne', n: 4 }],
        },
        {
          tekst: 'Strukturen som kontrollerer hva som slipper inn og ut av cellen, står i kolonne 5.',
          hint1: 'Det er cellemembranen som kontrollerer hva som slipper inn og ut av cellen.',
          hint2: 'Cellemembranen skal stå et sted i kolonne 5.',
          regler: [{ type: 'kolonne', a: 'cellemembran', n: 5 }],
        },
        {
          tekst: 'Cellemembranen står lenger opp enn cellekjernen.',
          hint2: 'Cellekjernen står i rad 2. Hvilke rader ligger lenger opp enn rad 2?',
          regler: [{ type: 'over', a: 'cellemembran', b: 'cellekjerne' }],
        },
        {
          tekst: 'Organellen der fotosyntesen foregår, står i rad 3 og kolonne 6.',
          hint1: 'Fotosyntesen foregår i kloroplasten.',
          hint2: 'Sett kloroplasten der rad 3 og kolonne 6 møtes.',
          regler: [{ type: 'rad', a: 'kloroplast', n: 3 }, { type: 'kolonne', a: 'kloroplast', n: 6 }],
        },
        {
          tekst: 'Ribosomet står i kolonne 1.',
          hint2: 'Ribosomet skal stå et sted i kolonne 1. Se hvilke rader som fortsatt er ledige.',
          regler: [{ type: 'kolonne', a: 'ribosom', n: 1 }],
        },
        {
          tekst: 'Vakuolen står i den nederste raden.',
          hint2: 'Vakuolen skal stå i rad 6. Se etter kolonnene som ikke er brukt ennå.',
          regler: [{ type: 'rad', a: 'vakuole', n: 6 }],
        },
        {
          tekst: 'Mitokondriet står lenger til venstre enn vakuolen.',
          hint2: 'Se hvilke kolonner som fortsatt er ledige. Mitokondriet må ha en kolonne lenger til venstre enn vakuolen.',
          regler: [{ type: 'venstre', a: 'mitokondrium', b: 'vakuole' }],
        },
        {
          tekst: 'Organellen der celleåndingen skjer, står lenger ned enn ribosomet.',
          hint1: 'Celleåndingen skjer i mitokondriene.',
          hint2: 'Mitokondriet skal stå i en rad lenger ned enn ribosomet.',
          regler: [{ type: 'under', a: 'mitokondrium', b: 'ribosom' }],
        },
      ],
      fakta: [
        'Cellemembranen kontrollerer hva som slipper inn og ut av cellen.',
        'Fotosyntesen foregår i kloroplasten.',
        'Celleåndingen skjer i mitokondriene. Der får cellen energi.',
      ],
    },
  ];

  const data = { BRIKKER, OPPGAVER };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.Oppgaver = data;
})(this);
