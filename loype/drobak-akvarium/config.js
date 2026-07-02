// ============================================================
// LRNify Utstillingsløype — Drøbak Akvarium
// KONFIGURASJON: alt innhold og oppsett redigeres her.
// ============================================================

const LOYPE_CONFIG = {
  navn: "Drøbak Akvarium",
  storageKey: "lrnify_loype_drobak",

  // Firebase: lim inn din firebaseConfig her. Står den tom,
  // kjører løypa i demo-modus (toppliste lagres kun lokalt).
  firebase: null,
  // firebase: {
  //   apiKey: "...",
  //   authDomain: "....firebaseapp.com",
  //   projectId: "...",
  // },
  firestoreCollection: "loype_drobak_scores",

  poster: [
    { id: 1, tittel: "Hvem er hvem?",   emoji: "🐟", url: "post1.html", maks: 40, plassering: "ved torskeakvariet" },
    { id: 2, tittel: "Krabbe-quiz",     emoji: "🦀", url: "post2.html", maks: 40, plassering: "ved krabbene" },
    { id: 3, tittel: "Sorter dyrene",   emoji: "🦞", url: "post3.html", maks: 40, plassering: "ved hummerakvariet" },
    { id: 4, tittel: "Tell og finn",    emoji: "⭐", url: "post4.html", maks: 40, plassering: "ved berøringsbassenget" },
    { id: 5, tittel: "Fjordhelten",     emoji: "🌊", url: "post5.html", maks: 40, plassering: "ved den store tanken" },
  ],

  // ---------- POST 1: Hvem er hvem? (match navn ↔ beskrivelse) ----------
  post1: {
    intro: "Se på fiskene i akvariet! Klarer du å finne ut hvem som er hvem?",
    par: [
      { navn: "Torsk",     emoji: "🐟", hint: "Jeg har en skjeggtråd under haka og tre ryggfinner." },
      { navn: "Steinbit",  emoji: "🦈", hint: "Jeg har store tenner og knuser skjell til frokost!" },
      { navn: "Rødspette", emoji: "🥞", hint: "Jeg er flat som en pannekake og ligger på bunnen." },
      { navn: "Kutling",   emoji: "🐠", hint: "Jeg er bitteliten og gjemmer meg mellom steinene." },
    ],
    poengPerRiktig: 10,
  },

  // ---------- POST 2: Krabbe-quiz ----------
  post2: {
    intro: "Se godt på krabbene før du svarer!",
    sporsmal: [
      {
        q: "Hvor mange bein har en krabbe (med klørne)?",
        alternativer: ["6", "8", "10", "12"],
        riktig: 2,
      },
      {
        q: "Hva gjør krabben når skallet blir for trangt?",
        alternativer: ["Den bytter skall", "Den slutter å vokse", "Den blåser opp skallet", "Den spiser skallet"],
        riktig: 0,
      },
      {
        q: "Hvilken vei går krabber oftest?",
        alternativer: ["Rett fram", "Bakover", "Sidelengs", "I sirkel"],
        riktig: 2,
      },
      {
        q: "Hva bruker krabben klørne mest til?",
        alternativer: ["Å svømme", "Å spise og forsvare seg", "Å grave hull", "Å vinke til venner"],
        riktig: 1,
      },
    ],
    poengPerRiktig: 10,
  },

  // ---------- POST 3: Sorter dyrene ----------
  post3: {
    intro: "Noen dyr i havet har hardt skall utenpå kroppen — andre har det ikke. Sorter dyrene i riktig boks!",
    kategorier: ["Har hardt skall", "Har ikke skall"],
    elementer: [
      { navn: "Krabbe",    emoji: "🦀", kategori: 0 },
      { navn: "Hummer",    emoji: "🦞", kategori: 0 },
      { navn: "Blåskjell", emoji: "🐚", kategori: 0 },
      { navn: "Reke",      emoji: "🦐", kategori: 0 },
      { navn: "Torsk",     emoji: "🐟", kategori: 1 },
      { navn: "Sjøstjerne",emoji: "⭐", kategori: 1 },
      { navn: "Blekksprut",emoji: "🐙", kategori: 1 },
      { navn: "Manet",     emoji: "🪼", kategori: 1 },
    ],
    poengPerRiktig: 5,
  },

  // ---------- POST 4: Tell og finn (observasjon) ----------
  post4: {
    intro: "Nå må du bruke øynene! Gå bort til berøringsbassenget.",
    oppgave: "Hvor mange sjøstjerner finner du i berøringsbassenget?",
    // Akvariet oppdaterer dette tallet ved behov:
    riktigSvar: 7,
    fullPoeng: 40,   // helt riktig
    naerPoeng: 20,   // ±1 fra riktig
    hint: "Se nøye — noen gjemmer seg under steinene!",
  },

  // ---------- POST 5: Fjordhelten (miljøvalg) ----------
  post5: {
    intro: "Oslofjorden trenger hjelp! Hva ville du gjort?",
    dilemmaer: [
      {
        situasjon: "Du er på stranda og ser en plastpose flyte i vannet. Hva gjør du?",
        valg: [
          { tekst: "Fisker den opp og kaster den i søpla", poeng: 10, respons: "Supert! Plast i havet kan skade fisk og fugler." },
          { tekst: "Lar den ligge — det er ikke min pose", poeng: 0, respons: "Hmm... plasten kan bli spist av dyr som tror det er mat." },
          { tekst: "Dytter den lenger ut så jeg slipper å se den", poeng: 0, respons: "Uff! Da kan en skilpadde tro det er en manet og spise den." },
        ],
      },
      {
        situasjon: "Familien din skal grille på svaberget. Hva gjør dere med søpla etterpå?",
        valg: [
          { tekst: "Tar med alt hjem, også det som ligger der fra før", poeng: 10, respons: "Du er en ekte fjordhelt! 🏆" },
          { tekst: "Tar med vårt eget, men lar resten ligge", poeng: 5, respons: "Bra begynnelse — men fjorden blir enda gladere om du tar litt ekstra!" },
          { tekst: "Legger det under en stein", poeng: 0, respons: "Søpla forsvinner ikke — den ender ofte i vannet til slutt." },
        ],
      },
      {
        situasjon: "Du fisker fra brygga og får en bitteliten torsk. Hva gjør du?",
        valg: [
          { tekst: "Slipper den forsiktig ut igjen", poeng: 10, respons: "Riktig! Små torsker må få vokse seg store — det er få torsk igjen i fjorden." },
          { tekst: "Tar den med hjem til middag", poeng: 0, respons: "Torsken i Oslofjorden er fredet — de små må få vokse opp!" },
          { tekst: "Kaster den på land til måkene", poeng: 0, respons: "Fisken kan overleve hvis du slipper den ut — gi den sjansen!" },
        ],
      },
      {
        situasjon: "Vennene dine vil kaste steiner på ærfuglene som ligger på vannet. Hva sier du?",
        valg: [
          { tekst: "\"Stopp! Fuglene hviler — la dem være i fred\"", poeng: 10, respons: "Modig og riktig! Ærfuglene trenger ro for å spare krefter." },
          { tekst: "Sier ingenting, men kaster ikke selv", poeng: 5, respons: "Du gjorde ikke noe galt — men fuglene trengte stemmen din." },
          { tekst: "Blir med — det er jo bare gøy", poeng: 0, respons: "Fuglene blir redde og bruker opp kreftene de trenger til vinteren." },
        ],
      },
    ],
  },
};
