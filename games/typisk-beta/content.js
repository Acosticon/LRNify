/* ══════════════════════════════════════════════════════════════════
   content.js — kontekstbibliotek, klienter, kapitler.

   En kontekst beskriver HVA tallene handler om og hvordan man snakker
   om dem. Generatoren bestemmer hvordan de fordeler seg. Spørsmålene
   settes sammen av de tre grunnene til å trenge et sentralmål:

     gjennomsnitt → «hvis vi fordeler helt likt»
     median       → «hva er vanlig for de fleste»
     typetall     → «hva går igjen oftest»

   Er ett av spørsmålene meningsløst i konteksten (man deler ikke
   skostørrelser likt), står feltet som null, og spillet lar være å
   spørre om det.
   ══════════════════════════════════════════════════════════════════ */

export const CONTEXTS = [
  {
    id: 'mal', emoji: '⚽', tittel: 'Målene til laget',
    step: 1, base: 3, jitter: 1, min: 0, nMin: 5, nMax: 8, unit: 'mål',
    ting: 'kampscore', hvem: 'kampene', enhetOrd: 'mål',
    intro: n => `Trenerne har notert hvor mange mål laget har scoret i de ${n} siste kampene:`,
    sp: { mean: 'Hvis målene ble fordelt jevnt utover kampene, hvor mange ble det per kamp?', median: 'Hva scorer laget i en vanlig kamp?', mode: 'Hvilket antall mål går igjen oftest?' },
    shapes: ['stram', 'uteligger', 'kategorisk', 'uniform', 'spredt']
  },
  {
    id: 'sko', emoji: '👟', tittel: 'Skostørrelsene i klassen',
    taalerUteligger: false,
    step: 1, base: 38, jitter: 1, min: 33, nMin: 7, nMax: 10, unit: '',
    ting: 'skostørrelse', hvem: 'elevene', enhetOrd: 'i skostørrelse',
    intro: n => `Klassen skal låne fotballsko til aktivitetsdagen. Dette er skostørrelsene til ${n} elever:`,
    sp: { mean: null, median: 'Hva er en vanlig skostørrelse i klassen?', mode: 'Hvilken størrelse bør utstyrsboden ha flest av?' },
    shapes: ['kategorisk', 'stram', 'uniform']
  },
  {
    id: 'skolevei', emoji: '🚌', tittel: 'Veien til skolen',
    step: 1, base: 9, jitter: 2, min: 2, nMin: 6, nMax: 9, unit: 'min',
    ting: 'reisetid', hvem: 'elevene', enhetOrd: 'minutter',
    intro: n => `${n} elever har svart på hvor mange minutter de bruker til skolen:`,
    sp: { mean: 'Hvis all reisetid ble fordelt likt på elevene, hvor lenge reiste hver?', median: 'Hvor lenge bruker en vanlig elev?', mode: 'Hvilken reisetid går igjen oftest?' },
    shapes: ['uteligger', 'stram', 'todelt', 'spredt']
  },
  {
    id: 'lommepenger', emoji: '💰', tittel: 'Lommepenger i uka',
    step: 10, base: 70, jitter: 2, min: 0, nMin: 5, nMax: 8, unit: 'kr',
    ting: 'ukelønn', hvem: 'vennene', enhetOrd: 'kroner',
    intro: n => `${n} venner sammenligner hvor mye lommepenger de får i uka:`,
    sp: { mean: 'Hvis vennene la alt i en felles pott og delte likt, hvor mye fikk hver?', median: 'Hvor mye får en vanlig venn i gjengen?', mode: 'Hvilket beløp går igjen oftest?' },
    shapes: ['uteligger', 'todelt', 'stram', 'spredt']
  },
  {
    id: 'visninger', emoji: '📹', tittel: 'Visninger på kanalen',
    step: 1000, base: 4000, jitter: 1, min: 0, nMin: 5, nMax: 7, unit: 'visninger',
    ting: 'video', hvem: 'videoene', enhetOrd: 'visninger',
    intro: n => `En kanal har lagt ut ${n} videoer denne måneden. Slik gikk det:`,
    sp: { mean: 'Hvis visningene ble fordelt likt på alle videoene, hvor mange fikk hver?', median: 'Hvor mange visninger får en vanlig video?', mode: 'Hvilket visningstall går igjen oftest?' },
    shapes: ['uteligger', 'spredt', 'uniform']
  },
  {
    id: 'lekser', emoji: '📚', tittel: 'Tid på lekser',
    step: 5, base: 30, jitter: 2, min: 0, nMin: 6, nMax: 9, unit: 'min',
    ting: 'leksetid', hvem: 'elevene', enhetOrd: 'minutter',
    intro: n => `${n} elever ble spurt hvor mange minutter de brukte på lekser i går:`,
    sp: { mean: 'Hvis all leksetiden ble delt likt på elevene, hvor lenge satt hver?', median: 'Hvor lenge sitter en vanlig elev?', mode: 'Hvilken leksetid går igjen oftest?' },
    shapes: ['uteligger', 'todelt', 'spredt', 'stram']
  },
  {
    id: 'sovn', emoji: '😴', tittel: 'Timer søvn',
    taalerUteligger: false,
    step: 1, base: 8, jitter: 1, min: 4, max: 13, nMin: 6, nMax: 8, unit: 'timer',
    ting: 'søvnlengde', hvem: 'ungdommene', enhetOrd: 'timer',
    intro: n => `${n} ungdommer har notert hvor mange timer de sov i natt:`,
    sp: { mean: 'Hvis søvnen ble fordelt helt likt, hvor mye fikk hver?', median: 'Hvor mye sover en vanlig ungdom?', mode: 'Hvilket antall timer går igjen oftest?' },
    shapes: ['stram', 'kategorisk', 'uniform']
  },
  {
    id: 'hoyde', emoji: '📏', tittel: 'Høyden i klassen',
    taalerUteligger: false,
    step: 2, base: 168, jitter: 2, min: 140, nMin: 7, nMax: 10, unit: 'cm',
    ting: 'høyde', hvem: 'elevene', enhetOrd: 'centimeter',
    intro: n => `${n} elever er målt i kroppsøvingstimen. Høydene i centimeter:`,
    sp: { mean: null, median: 'Hvor høy er en vanlig elev i klassen?', mode: 'Hvilken høyde går igjen oftest?' },
    shapes: ['spredt', 'stram', 'uniform', 'todelt']
  },
  {
    id: 'puls', emoji: '❤️', tittel: 'Puls i hvile',
    taalerUteligger: false,
    step: 4, base: 72, jitter: 2, min: 40, nMin: 6, nMax: 9, unit: 'slag/min',
    ting: 'hvilepuls', hvem: 'deltakerne', enhetOrd: 'slag i minuttet',
    intro: n => `${n} deltakere har målt hvilepulsen sin:`,
    sp: { mean: null, median: 'Hva er en vanlig hvilepuls i gruppa?', mode: 'Hvilken puls går igjen oftest?' },
    shapes: ['stram', 'spredt', 'uniform', 'todelt']
  },
  {
    id: 'ventetid', emoji: '🏥', tittel: 'Ventetid på legevakta',
    step: 5, base: 45, jitter: 2, min: 0, nMin: 6, nMax: 9, unit: 'min',
    ting: 'ventetid', hvem: 'pasientene', enhetOrd: 'minutter',
    intro: n => `Legevakta har målt hvor lenge ${n} pasienter måtte vente:`,
    sp: { mean: 'Hvis all ventetid ble fordelt likt på pasientene, hvor lenge ventet hver?', median: 'Hvor lenge venter en vanlig pasient?', mode: 'Hvilken ventetid går igjen oftest?' },
    shapes: ['uteligger', 'todelt', 'spredt']
  },
  {
    id: 'sosken', emoji: '👨‍👩‍👧', tittel: 'Antall søsken',
    step: 1, base: 2, jitter: 1, min: 0, nMin: 8, nMax: 11, unit: 'søsken',
    ting: 'søskenflokk', hvem: 'elevene', enhetOrd: 'søsken',
    intro: n => `${n} elever har svart på hvor mange søsken de har:`,
    sp: { mean: 'Hvis alle søsknene ble fordelt likt, hvor mange ville hver elev hatt?', median: 'Hvor mange søsken har en vanlig elev?', mode: 'Hvilket antall søsken går igjen oftest?' },
    shapes: ['kategorisk', 'stram', 'uniform']
  },
  {
    id: 'temperatur', emoji: '🌡️', tittel: 'Temperatur i mai',
    taalerUteligger: false,
    step: 2, base: 14, jitter: 2, min: 0, nMin: 7, nMax: 10, unit: '°C',
    ting: 'dagtemperatur', hvem: 'dagene', enhetOrd: 'grader',
    intro: n => `Værstasjonen har målt middeltemperaturen ${n} dager på rad:`,
    sp: { mean: null, median: 'Hvor varmt er det på en vanlig dag?', mode: 'Hvilken temperatur går igjen oftest?' },
    shapes: ['spredt', 'stram', 'uniform', 'todelt']
  },
  {
    id: 'nedbor', emoji: '🌧️', tittel: 'Nedbør per døgn',
    step: 2, base: 18, jitter: 2, min: 0, nMin: 6, nMax: 9, unit: 'mm',
    ting: 'døgnnedbør', hvem: 'døgnene', enhetOrd: 'millimeter',
    intro: n => `Nedbøren er målt ${n} døgn på rad, i millimeter:`,
    sp: { mean: 'Hvis all nedbøren ble fordelt likt utover døgnene, hvor mye falt per døgn?', median: 'Hvor mye regner det et vanlig døgn?', mode: 'Hvilken nedbørsmengde går igjen oftest?' },
    shapes: ['uteligger', 'spredt', 'todelt']
  },
  {
    id: 'pizza', emoji: '🍕', tittel: 'Stykker pizza',
    step: 1, base: 3, jitter: 1, min: 0, nMin: 8, nMax: 11, unit: 'stykker',
    ting: 'porsjon', hvem: 'gjestene', enhetOrd: 'stykker',
    intro: n => `På klassefesten talte de hvor mange pizzastykker hver av de ${n} gjestene spiste:`,
    sp: { mean: 'Hvis pizzaen ble delt helt likt, hvor mange stykker fikk hver gjest?', median: 'Hvor mye spiser en vanlig gjest?', mode: 'Hvilket antall stykker går igjen oftest?' },
    shapes: ['kategorisk', 'stram', 'uteligger']
  },
  {
    id: 'meldinger', emoji: '📱', tittel: 'Meldinger på en dag',
    step: 10, base: 60, jitter: 2, min: 0, nMin: 6, nMax: 9, unit: 'meldinger',
    ting: 'meldingsmengde', hvem: 'ungdommene', enhetOrd: 'meldinger',
    intro: n => `${n} ungdommer har talt hvor mange meldinger de sendte i går:`,
    sp: { mean: 'Hvis meldingene ble fordelt likt på alle, hvor mange sendte hver?', median: 'Hvor mange sender en vanlig ungdom?', mode: 'Hvilket antall går igjen oftest?' },
    shapes: ['uteligger', 'todelt', 'spredt']
  },
  {
    id: 'lonn', emoji: '💼', tittel: 'Lønn i en liten bedrift',
    step: 10000, base: 480000, jitter: 2, min: 200000, nMin: 5, nMax: 8, unit: 'kr',
    ting: 'årslønn', hvem: 'de ansatte', enhetOrd: 'kroner',
    intro: n => `En bedrift med ${n} ansatte oppgir årslønnene sine:`,
    sp: { mean: 'Hvis hele lønnsbudsjettet ble delt helt likt, hvor mye fikk hver ansatt?', median: 'Hva tjener en vanlig ansatt?', mode: 'Hvilken lønn går igjen oftest?' },
    shapes: ['uteligger', 'todelt', 'stram']
  },
  {
    id: 'husleie', emoji: '🏠', tittel: 'Husleie i gata',
    step: 500, base: 9000, jitter: 2, min: 3000, nMin: 6, nMax: 9, unit: 'kr',
    ting: 'månedsleie', hvem: 'leilighetene', enhetOrd: 'kroner',
    intro: n => `${n} leiligheter i samme gate er lagt ut til leie:`,
    sp: { mean: 'Hvis all leia ble fordelt likt på leilighetene, hva ble prisen per leilighet?', median: 'Hva koster en vanlig leilighet i gata?', mode: 'Hvilken pris går igjen oftest?' },
    shapes: ['uteligger', 'spredt', 'todelt']
  },
  {
    id: 'skjermtid', emoji: '📺', tittel: 'Skjermtid i går',
    step: 15, base: 120, jitter: 2, min: 0, nMin: 6, nMax: 9, unit: 'min',
    ting: 'skjermtid', hvem: 'elevene', enhetOrd: 'minutter',
    intro: n => `${n} elever har lest av skjermtiden sin fra i går:`,
    sp: { mean: 'Hvis all skjermtiden ble fordelt likt, hvor mye fikk hver?', median: 'Hvor mye skjermtid har en vanlig elev?', mode: 'Hvilken skjermtid går igjen oftest?' },
    shapes: ['uteligger', 'todelt', 'spredt', 'stram']
  },
  {
    id: 'quiz', emoji: '📝', tittel: 'Poeng på quizen',
    taalerUteligger: false,
    step: 1, base: 8, jitter: 1, min: 0, max: 20, nMin: 6, nMax: 9, unit: 'poeng',
    ting: 'poengsum', hvem: 'elevene', enhetOrd: 'poeng',
    intro: n => `${n} elever tok den samme quizen. Poengsummene deres:`,
    sp: { mean: 'Hvis poengene ble fordelt likt på alle, hvor mange fikk hver?', median: 'Hva får en vanlig elev?', mode: 'Hvilken poengsum går igjen oftest?' },
    shapes: ['stram', 'kategorisk', 'todelt', 'uniform']
  },
  {
    id: 'brettspill', emoji: '🎲', tittel: 'Poeng i brettspillet',
    step: 5, base: 45, jitter: 2, min: 0, nMin: 5, nMax: 8, unit: 'poeng',
    ting: 'sluttsum', hvem: 'spillerne', enhetOrd: 'poeng',
    intro: n => `${n} spillere er ferdige med runden. Sluttsummene:`,
    sp: { mean: 'Hvis alle poengene ble fordelt likt mellom spillerne, hvor mange fikk hver?', median: 'Hvor mange poeng får en vanlig spiller?', mode: 'Hvilken sluttsum går igjen oftest?' },
    shapes: ['uteligger', 'spredt', 'stram', 'uniform']
  },
  {
    id: 'lopetid', emoji: '🏃', tittel: '400 meter',
    taalerUteligger: false,
    step: 2, base: 68, jitter: 3, min: 45, nMin: 6, nMax: 9, unit: 'sek',
    ting: 'løpstid', hvem: 'løperne', enhetOrd: 'sekunder',
    intro: n => `${n} elever har løpt 400 meter. Tidene i sekunder:`,
    sp: { mean: null, median: 'Hva er en vanlig tid i gruppa?', mode: 'Hvilken tid går igjen oftest?' },
    shapes: ['spredt', 'stram', 'uniform', 'uteligger']
  },
  {
    id: 'boker', emoji: '📖', tittel: 'Bøker lest i år',
    step: 1, base: 4, jitter: 1, min: 0, nMin: 8, nMax: 11, unit: 'bøker',
    ting: 'lesemengde', hvem: 'elevene', enhetOrd: 'bøker',
    intro: n => `Biblioteket har spurt ${n} elever hvor mange bøker de har lest i år:`,
    sp: { mean: 'Hvis bøkene ble fordelt likt på elevene, hvor mange ble det på hver?', median: 'Hvor mange leser en vanlig elev?', mode: 'Hvilket antall går igjen oftest?' },
    shapes: ['kategorisk', 'uteligger', 'stram']
  },
  {
    id: 'besokende', emoji: '🎟️', tittel: 'Besøkende på museet',
    step: 50, base: 400, jitter: 2, min: 0, nMin: 6, nMax: 9, unit: 'besøkende',
    ting: 'dagsbesøk', hvem: 'dagene', enhetOrd: 'besøkende',
    intro: n => `Museet har talt besøkende ${n} dager på rad:`,
    sp: { mean: 'Hvis besøket ble fordelt jevnt utover dagene, hvor mange kom per dag?', median: 'Hvor mange kommer på en vanlig dag?', mode: 'Hvilket besøkstall går igjen oftest?' },
    shapes: ['uteligger', 'todelt', 'spredt']
  },
  {
    id: 'alder', emoji: '🎂', tittel: 'Alderen på laget',
    step: 1, base: 14, jitter: 1, min: 8, nMin: 8, nMax: 11, unit: 'år',
    ting: 'alder', hvem: 'spillerne', enhetOrd: 'år',
    intro: n => `${n} spillere på laget har oppgitt alderen sin:`,
    sp: { mean: null, median: 'Hvor gammel er en vanlig spiller?', mode: 'Hvilken alder går igjen oftest?' },
    shapes: ['kategorisk', 'stram', 'uteligger']
  },
  {
    id: 'sykkel', emoji: '🚲', tittel: 'Syklister over brua',
    step: 10, base: 90, jitter: 2, min: 0, nMin: 6, nMax: 9, unit: 'syklister',
    ting: 'dagstall', hvem: 'dagene', enhetOrd: 'syklister',
    intro: n => `En teller på brua har registrert syklister ${n} dager på rad:`,
    sp: { mean: 'Hvis syklistene ble fordelt jevnt på dagene, hvor mange ble det per dag?', median: 'Hvor mange sykler over på en vanlig dag?', mode: 'Hvilket antall går igjen oftest?' },
    shapes: ['todelt', 'spredt', 'uteligger']
  },
  {
    id: 'skritt', emoji: '👣', tittel: 'Skritt på en dag',
    step: 500, base: 8000, jitter: 2, min: 0, nMin: 6, nMax: 9, unit: 'skritt',
    ting: 'dagsskritt', hvem: 'deltakerne', enhetOrd: 'skritt',
    intro: n => `${n} deltakere i en skrittkonkurranse leste av telleren sin i går:`,
    sp: { mean: 'Hvis alle skrittene ble fordelt likt, hvor mange gikk hver?', median: 'Hvor mange skritt går en vanlig deltaker?', mode: 'Hvilket skritt-tall går igjen oftest?' },
    shapes: ['uteligger', 'spredt', 'todelt']
  }
];

export const CONTEXT_BY_ID = Object.fromEntries(CONTEXTS.map(c => [c.id, c]));

/* ══════════════════════════════════════════════════════════════════
   KLIENTENE — hver sak får et ansikt som spør. Klienten velges etter
   hvilket sentralmål oppdraget faktisk trenger.
   ══════════════════════════════════════════════════════════════════ */
export const CLIENTS = {
  mean: [
    { emoji: '🧾', navn: 'Regnskapsføreren', rolle: 'skal fordele totalen likt' },
    { emoji: '📐', navn: 'Analytikeren', rolle: 'regner på summen delt på antall' },
    { emoji: '🏛️', navn: 'Saksbehandleren', rolle: 'skal budsjettere for alle' }
  ],
  median: [
    { emoji: '📰', navn: 'Journalisten', rolle: 'skal skrive hva som er vanlig' },
    { emoji: '🔍', navn: 'Faktasjekkeren', rolle: 'sjekker om påstanden holder' },
    { emoji: '🧑‍🏫', navn: 'Læreren', rolle: 'vil beskrive gruppa ærlig' },
    { emoji: '📊', navn: 'Statistikeren', rolle: 'leter etter det typiske' }
  ],
  mode: [
    { emoji: '📦', navn: 'Innkjøperen', rolle: 'trenger å vite hva som går igjen oftest' },
    { emoji: '🗂️', navn: 'Registerføreren', rolle: 'teller opp hva som er vanligst' },
    { emoji: '🎽', navn: 'Utstyrsansvarlig', rolle: 'skal ha flest av én type' }
  ],
  ingen: [
    { emoji: '🤨', navn: 'Skeptikeren', rolle: 'tror ikke ett tall holder her' },
    { emoji: '🧑‍🔬', navn: 'Forskeren', rolle: 'ser etter mønsteret bak tallene' }
  ],
  /* Sabotøroppgavene har sin egen rollegalleri: de handler om å flytte
     et tall med vilje, og bør se ut som det. */
  sabotor: [
    { emoji: '🎩', navn: 'Spinndoktoren', rolle: 'vil ha tallet dit det passer' },
    { emoji: '📣', navn: 'Pressesjefen', rolle: 'trenger en bedre overskrift' },
    { emoji: '🧮', navn: 'Bokholderen', rolle: 'leter etter grensen' }
  ]
};

/* ══════════════════════════════════════════════════════════════════
   KAPITLENE — hvert introduserer én idé og ett nytt verb, så tempoet
   aldri står stille. Til sammen ca. 25 minutter.
   ══════════════════════════════════════════════════════════════════ */
export const CHAPTERS = [
  {
    id: 1, tittel: 'Tre målestokker', emoji: '📐',
    ingress: 'Gjennomsnitt, median og typetall. Tre svar på det samme spørsmålet — og i dette kapittelet er de stort sett enige.',
    laering: 'Når tallene ligger tett, forteller alle tre omtrent samme historie.',
    oppgaver: [
      { verb: 'compute', shape: 'stram', measures: ['mean'] },
      { verb: 'choose', shape: 'stram' },
      { verb: 'compute', shape: 'kategorisk', measures: ['median', 'mode'] },
      { verb: 'choose', shape: 'kategorisk' },
      { verb: 'interpret', shape: 'stram' }
    ]
  },
  {
    id: 2, tittel: 'Uteliggeren', emoji: '⚖️',
    ingress: 'Ett tall stikker seg ut. Nå begynner de tre målestokkene å være uenige — og vektstanga velter.',
    laering: 'Gjennomsnittet dras mot ekstremverdier. Medianen bryr seg bare om rekkefølgen, og står støtt.',
    oppgaver: [
      { verb: 'predict', shape: 'uteligger', measure: 'mean' },
      { verb: 'compute', shape: 'uteligger', measures: ['mean', 'median'] },
      { verb: 'shock', shape: 'stram' },
      { verb: 'choose', shape: 'uteligger' },
      { verb: 'interpret', shape: 'uteligger' }
    ]
  },
  {
    id: 3, tittel: 'Formen på tallene', emoji: '🏔️',
    ingress: 'Ikke alle datasett har en midte. Noen ganger er det ærligste svaret at «typisk» ikke finnes.',
    laering: 'Se på formen før du velger sentralmål. Er dataene todelt, beskriver ingen av dem gruppa.',
    oppgaver: [
      { verb: 'choose', shape: 'todelt' },
      { verb: 'interpret', shape: 'todelt' },
      { verb: 'finnfeil', shape: 'spredt' },
      { verb: 'choose', shape: 'uniform' },
      { verb: 'finnfeil', shape: 'uteligger' }
    ]
  },
  {
    id: 4, tittel: 'Bygg tallene', emoji: '🔧',
    ingress: 'Til nå har du lest tallene. Nå skal du lage dem — og få sentralmålene til å lande akkurat der du vil.',
    laering: 'Forstår du hvordan et sentralmål oppstår, kan du styre det. Da har du forstått det.',
    oppgaver: [
      { verb: 'bygg', mal: 'meanMedian' },
      { verb: 'sabotor', shape: 'stram', retning: 'opp' },
      { verb: 'bygg', mal: 'modeFast' },
      { verb: 'sabotor', shape: 'stram', retning: 'ned' },
      { verb: 'bygg', mal: 'meanFastMedianFri' }
    ]
  },
  {
    id: 5, tittel: 'Å lyve med statistikk', emoji: '🎭',
    ingress: 'Alt du har lært, brukt av noen som vil overbevise deg. Tre påstander om samme tall — hvilke tåler dagslys?',
    laering: 'Et tall kan være riktig regnet og likevel gi feil inntrykk. Det er den vanligste formen for statistisk løgn.',
    oppgaver: [
      { verb: 'overskrifter', shape: 'uteligger' },
      { verb: 'sabotor', shape: 'uteligger', retning: 'opp' },
      { verb: 'overskrifter', shape: 'todelt' },
      { verb: 'interpret', shape: 'uteligger' },
      { verb: 'overskrifter', shape: 'uteligger', boss: true }
    ]
  }
];

/* Verb som arkademodus trekker fra. Bygg- og sabotøroppgaver er for
   trege for tidspress, så de holdes utenfor. */
export const ARCADE_VERBS = ['choose', 'predict', 'interpret', 'finnfeil', 'overskrifter', 'compute'];

export const MEASURE = {
  mean: { key: 'mean', navn: 'Gjennomsnitt', bestemt: 'Gjennomsnittet', bestemtLav: 'gjennomsnittet', kort: 'Snitt', farge: 'gull' },
  median: { key: 'median', navn: 'Median', bestemt: 'Medianen', bestemtLav: 'medianen', kort: 'Median', farge: 'teal' },
  mode: { key: 'mode', navn: 'Typetall', bestemt: 'Typetallet', bestemtLav: 'typetallet', kort: 'Typetall', farge: 'lilla' }
};
