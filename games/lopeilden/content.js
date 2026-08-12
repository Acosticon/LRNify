// content.js – Alt innhold i Løpeilden: teknikker, runder, hendelser og merker.
//
// ALT I DENNE FILA ER OPPDIKTET. Fagerli finnes ikke. Fagerli-Nytt finnes ikke.
// Personene finnes ikke. Det er et poeng: elevene skal øve på teknikkene,
// ikke lære utenat en påstand om noe ekte.
//
// Vil du lage din egen versjon? Bytt ut tekstene her. Resten av spillet
// tilpasser seg antall runder automatisk.

export const STED = {
  kommune: 'Fagerli',
  skole: 'Fagerli ungdomsskole',
  avis: 'Fagerli-Nytt',
  app: 'Snutt',            // spillets TikTok
  chat: 'Ringen',          // spillets Snapchat/Discord
  faktasjekk: 'Sjekket.no' // spillets faktasjekktjeneste
};

/* ─── TEKNIKKORT ────────────────────────────────────────
   Seks teknikker, én per runde. Kortet låses opp når runden er ferdig,
   og samlingen er halve poenget med spillet: elevene skal gå ut med
   navn på det de har sett.                                            */

export const TEKNIKKER = {
  etterligning: {
    navn: 'Etterligning',
    ikon: '🎭',
    kort: 'Du later som du er en avsender folk allerede stoler på.',
    hvorfor: 'Vi leser navnet, ikke adressen. Hjernen kjenner igjen en logo på under et halvt sekund, og da har den allerede bestemt seg for om noe er til å stole på.',
    oppdag: [
      'Les brukernavnet tegn for tegn. Bindestreker, understreker og ordet «offisiell» er ofte lagt til nettopp fordi kontoen ikke er det.',
      'Se når kontoen ble opprettet, og hva den la ut før denne saken.',
      'Søk opp den ekte kilden i et nytt vindu i stedet for å klikke på lenken i posten.'
    ]
  },
  folelseskrok: {
    navn: 'Følelseskroken',
    ikon: '🪝',
    kort: 'Du velger ordene som gir sterkest sinne, frykt eller forakt.',
    hvorfor: 'Sterke følelser slår ut ettertanken. Sinne er den følelsen som deles mest, fordi den føles som noe man må handle på med én gang.',
    oppdag: [
      'Kjenn etter i kroppen. Blir du rasende av en overskrift, er det ofte fordi noen har jobbet for at du skal bli det.',
      'Bytt ut de ladede ordene med nøytrale og les setningen på nytt. Står påstanden fortsatt?',
      'Vent ti sekunder før du deler. Ti sekunder er nok til at hjernen tar tilbake rattet.'
    ]
  },
  halvsannhet: {
    navn: 'Halvsannheten',
    ikon: '🖼️',
    kort: 'Du bruker noe helt ekte – et bilde, et tall, et sitat – i feil sammenheng.',
    hvorfor: 'Bevis føles ekte. Vi sjekker om bildet ser troverdig ut, men nesten aldri hvor og når det ble tatt.',
    oppdag: [
      'Spør «når og hvor?» før du spør «er dette redigert?».',
      'Bruk omvendt bildesøk. Høyreklikk på bildet, søk etter det, og se etter det eldste treffet.',
      'Tenk på hva som er utenfor bildekanten. Et bilde av femten sinte mennesker kan være tatt i et rom med to hundre rolige.'
    ]
  },
  falsktFlertall: {
    navn: 'Falskt flertall',
    ikon: '👥',
    kort: 'Du får det til å se ut som om alle er enige med deg.',
    hvorfor: 'Når vi er usikre, gjør vi det de andre gjør. Ti like kommentarer føles som et folkekrav, selv om de kom fra én person eller én gruppechat.',
    oppdag: [
      'Klikk på kontoene som kommenterer. Er de nye, uten historikk, uten bilde?',
      'Se etter formuleringer som gjentar seg nesten ordrett.',
      'Tell hvor mange forskjellige mennesker det egentlig er. Ofte er det færre enn det føles.'
    ]
  },
  mistenkeliggjoring: {
    navn: 'Mistenkeliggjøring',
    ikon: '🫵',
    kort: 'Du angriper den som sjekker, i stedet for det som ble sjekket.',
    hvorfor: 'Hvis kilden virker råtten, slipper vi å ta stilling til innholdet. Det er en snarvei hjernen gladelig tar.',
    oppdag: [
      'Spør: handler dette svaret om saken, eller om personen?',
      'Legg merke til «bare stiller spørsmål». Et spørsmål kan bære en påstand uten å måtte bevise den.',
      'Se etter om noen faktisk imøtegår funnet. Gjør ingen det, er funnet trolig riktig.'
    ]
  },
  polarisering: {
    navn: 'Polarisering',
    ikon: '⚡',
    kort: 'Du deler folk i to leirer som slutter å høre på hverandre.',
    hvorfor: 'Vi forsvarer laget vårt før vi vurderer fakta. Når saken blir til et lag, blir det å endre mening det samme som å svikte vennene sine.',
    oppdag: [
      'Let etter «vi mot dem»-ord: alle, ingen, folk som deg, sånne som dem.',
      'Finn ut hva de to sidene faktisk er enige om. Det er nesten alltid mer enn posten viser.',
      'Les hele sitatet, ikke bare klippet. Fire ord av en setning på tolv kan bety det motsatte.'
    ]
  }
};

/* ─── HENDELSESKORT ─────────────────────────────────────
   Trekkes tilfeldig etter hvert trekk. Gir spillet uforutsigbarhet og
   viser at spredning ikke er noe man styrer – bare setter i gang.       */

export const HENDELSER = [
  { id: 'laerer',   ikon: '🧑‍🏫', tekst: 'En lærer deler posten din i foreldregruppa. Uten å sjekke.', effekt: { spredning: 12, skade: 3 } },
  { id: 'skjerm',   ikon: '📸', tekst: 'Noen tar skjermbilde. Fra nå av lever posten videre selv om du sletter den.', effekt: { skade: 4 }, flagg: 'skjermbilde' },
  { id: 'sjekket',  ikon: '🔍', tekst: `${STED.faktasjekk} merker posten som «mangler dekning».`, effekt: { troverdighet: -12, spredning: -6 } },
  { id: 'avslort',  ikon: '🕵️', tekst: 'Noen på trinnet begynner å gjette hvem som står bak kontoen.', effekt: { troverdighet: -10, skade: 3 } },
  { id: 'algoritme',ikon: '📈', tekst: `Algoritmen i ${STED.app} tester posten på 200 nye personer. Den holder blikket deres i fire sekunder.`, effekt: { spredning: 16 } },
  { id: 'kilde',    ikon: '❓', tekst: 'Den mest populære kommentaren er på ett ord: «Kilde?»', effekt: { troverdighet: -6, spredning: 4 } },
  { id: 'friminutt',ikon: '🗣️', tekst: 'Saken diskuteres i friminuttet av folk som aldri så posten. Ryktet har løsnet fra kilden sin.', effekt: { spredning: 10, skade: 4 } },
  { id: 'regn',     ikon: '🌧️', tekst: 'Det høljer ned i Fagerli. Hele bygda ser på noe annet i tre timer.', effekt: { spredning: -8 } },
  { id: 'foreldre', ikon: '📱', tekst: 'Posten hopper til foreldrenes kanaler. Der stopper den aldri.', effekt: { spredning: 14, skade: 3 } },
  { id: 'sitat',    ikon: '✂️', tekst: 'En annen konto klipper posten din og fjerner det lille forbeholdet du hadde skrevet.', effekt: { spredning: 8, skade: 4 } }
];

/* ─── RUNDER ────────────────────────────────────────────
   Hver runde har tre slag:
     1  TREKKET   – du velger hvordan saken skal skyves videre
     2  EKKOET    – nettverket svarer, og et hendelseskort trekkes
     3  MOTGIFTEN – du bytter stol og skal avsløre en annen sak
   Motgiften er der poengene ligger. Det er et bevisst valg: den som
   spiller dette spillet skal ikke få høy score av å manipulere godt.   */

export const RUNDER = [
  /* ── RUNDE 1 ─────────────────────────────────────── */
  {
    nr: 1,
    id: 'kontoen',
    tittel: 'Kontoen',
    teknikk: 'etterligning',
    tid: 'Mandag 08.12',
    scene: `Det går et rykte på ${STED.skole}: garderobene skal låses i friminuttene, og elevene kommer ikke til tingene sine. Ingen vet hvor ryktet kommer fra.\n\nDu vet hvor det kommer fra. Det er deg. Du fant det på i går kveld fordi du kjedet deg.\n\nNå trenger ryktet en avsender folk stoler på.`,
    sporsmal: 'Hvilken konto poster du fra?',
    valg: [
      {
        tekst: `${STED.skole} – Info`,
        under: 'Samme logo, samme farger, ett ekstra mellomrom i navnet.',
        teknikk: true,
        effekt: { spredning: 26, troverdighet: 10, skade: 8 },
        respons: 'Fire lærere deler den før første time. Én av dem er rektor. Han trodde den kom fra kontoret.'
      },
      {
        tekst: `${STED.avis} · Nyhetsvarsel`,
        under: 'Lokalavisas navn, bare med .info bak i stedet for .no.',
        teknikk: true,
        effekt: { spredning: 32, troverdighet: 14, skade: 12 },
        respons: '«Nyhetsvarsel» er et kraftig ord. 600 mennesker i Fagerli får det opp på låseskjermen mens de spiser frokost.'
      },
      {
        tekst: 'Fagerli-innsiden',
        under: 'Anonym konto. Later ikke som den er noe den ikke er.',
        teknikk: false,
        effekt: { spredning: 13, troverdighet: 4, skade: 3 },
        respons: 'Anonymt går tregere. Til gjengjeld er det ingen som kan ta deg. Det er derfor så mange gjør det.'
      },
      {
        tekst: 'Ditt eget navn',
        under: 'Med bilde. Sånn som du poster ellers.',
        teknikk: false,
        effekt: { spredning: 4, troverdighet: 8, skade: 1 },
        respons: 'Elleve visninger. Ni av dem er deg som sjekker om noen har sett det. Ærlighet er treg.'
      }
    ],
    motgift: {
      intro: 'Bytt stol. Nå er du den som scroller.',
      sporsmal: `Fire kontoer sier de er lokalavisa ${STED.avis}. Én av dem er det. Hvilken?`,
      alternativer: [
        { tekst: '@fagerlinytt', under: '4 200 følgere · første post i 2013 · dekker alt fra bingo til budsjett', riktig: true,  svar: 'Riktig. Det kjedelige arkivet er beviset: en ekte lokalavis har skrevet om russetog og vannlekkasjer i årevis.' },
        { tekst: '@fagerli_nytt_offisiell', under: '7 200 følgere · første post for 11 dager siden · bare denne saken', riktig: false, svar: 'Nei. Flest følgere, men yngst konto. Ordet «offisiell» er lagt til nettopp fordi den ikke er det.' },
        { tekst: '@FagerliNytt.no', under: '4 100 følgere · ingen poster eldre enn august · profilbilde er avisas logo', riktig: false, svar: 'Nei. Logoen er kopiert på to sekunder. Historikken er det ingen som kan kopiere.' },
        { tekst: '@fagerlinytt_varsel', under: '2 900 følgere · poster bare saker om én navngitt person', riktig: false, svar: 'Nei. En konto som bare handler om ett menneske, driver ikke med nyheter.' }
      ],
      fasit: 'Alderen på kontoen og hva den la ut FØR denne saken, avslører mer enn navnet. Navn og logo tar to sekunder å kopiere. Fire års kjedelige poster tar fire år.'
    }
  },

  /* ── RUNDE 2 ─────────────────────────────────────── */
  {
    nr: 2,
    id: 'overskriften',
    tittel: 'Overskriften',
    teknikk: 'folelseskrok',
    tid: 'Mandag 11.40',
    scene: `Du sjekker hva som faktisk skjer, og det er nesten skuffende: vaktmester Rune har bestilt nye låser til garderobene fordi de gamle er ødelagte. Det står i et referat ingen har lest.\n\nDet er sant. Det er også helt uinteressant.\n\nNå skal det bli en overskrift.`,
    sporsmal: 'Hva skriver du?',
    valg: [
      {
        tekst: 'Skolen setter inn nye låser i garderobene',
        under: 'Sant. Presist. Kjedelig.',
        teknikk: false,
        effekt: { spredning: 3, troverdighet: 10, skade: 0 },
        respons: 'Fire likes. To av dem fra vaktmester Rune, som er glad noen endelig la merke til det.'
      },
      {
        tekst: 'Er det sant at skolen skal låse elevene ute fra tingene sine?',
        under: 'Du påstår ingenting. Du bare spør.',
        teknikk: true,
        effekt: { spredning: 22, troverdighet: 2, skade: 9 },
        respons: 'Spørsmålstegnet er en genistrek. Du har ikke sagt noe som helst, og likevel tror 300 mennesker nå at det er sant. Det kalles «bare stille spørsmål», og det er den mest brukte teknikken som finnes.'
      },
      {
        tekst: 'SKANDALE: Skolen stenger elevene ute fra egne eiendeler',
        under: 'Store bokstaver. Sterkt verb.',
        teknikk: true,
        effekt: { spredning: 30, troverdighet: -6, skade: 13 },
        respons: 'Sinne sprer seg fortere enn noe annet. Kommentarfeltet er i brann etter ni minutter. Ingen har spurt hva «stenger ute» betyr.'
      },
      {
        tekst: 'Advarsel til foreldre: Barna deres kommer ikke til klærne sine',
        under: 'Retter seg mot dem som blir reddest.',
        teknikk: true,
        effekt: { spredning: 26, troverdighet: -2, skade: 14 },
        respons: 'Frykt for egne barn er den sterkeste kroken som finnes. Ni foreldre ringer skolen før klokka to. Rektor får ikke spist lunsj.'
      }
    ],
    motgift: {
      intro: 'Bytt stol. Du ser denne setningen i feeden din:',
      sitat: 'Nå tvinger kommunen elevene til å stå ute i kulda mens de venter på bussen.',
      sporsmal: 'Hvilket ord gjør mest jobb med følelsene dine?',
      alternativer: [
        { tekst: 'Nå', riktig: false, svar: 'Nesten. «Nå» skaper hast og gjør at du føler du må reagere med én gang – men det er ikke det ordet som bærer sinnet.', delvis: true },
        { tekst: 'tvinger', riktig: true, svar: 'Riktig. «Tvinger» gjør en busstabell om til et overgrep. Bytt det med «gjør at», og hele setningen roer seg – uten at ett faktum er endret.' },
        { tekst: 'elevene', riktig: false, svar: 'Nei. Det er bare hvem det gjelder.' },
        { tekst: 'kulda', riktig: false, svar: 'Nesten. «Kulda» maler et bilde du kjenner på kroppen, og det hjelper godt på. Men verbet er det som gjør kommunen til en skurk.', delvis: true }
      ],
      fasit: 'Test: bytt ut de ladede ordene med nøytrale og les setningen på nytt. «Kommunen har flyttet holdeplassen.» Står påstanden fortsatt? Da var det en sak. Forsvant den? Da var det bare følelser.'
    }
  },

  /* ── RUNDE 3 ─────────────────────────────────────── */
  {
    nr: 3,
    id: 'beviset',
    tittel: 'Beviset',
    teknikk: 'halvsannhet',
    tid: 'Tirsdag 07.55',
    scene: `Kommentarfeltet vil ha bevis. «Har du bilde?» er den mest likte kommentaren.\n\nDu har fire bilder på telefonen. Ingen av dem viser det du påstår. Tre av dem er ekte fotografier av virkelige ting.\n\nDet er nettopp derfor de virker.`,
    sporsmal: 'Hvilket bilde legger du ved?',
    valg: [
      {
        tekst: 'Garderoben i dag',
        under: 'Du tok det selv i morges. Tom, ryddig, godt opplyst.',
        teknikk: false,
        effekt: { spredning: 2, troverdighet: 12, skade: 0 },
        respons: 'Det viser akkurat det det viser. Saken din tåler ikke sitt eget bevis, og du merker det med én gang.'
      },
      {
        tekst: 'Overfylt søppelcontainer utenfor en skole',
        under: 'Ekte bilde. Tatt i Trondheim. I 2019.',
        teknikk: true,
        effekt: { spredning: 24, troverdighet: 4, skade: 10 },
        respons: 'Ikke én piksel er manipulert. Alt ved bildet er sant bortsett fra hvor og når det ble tatt, og det er akkurat det ingen sjekker.'
      },
      {
        tekst: 'Lang kø av ungdommer i regnet',
        under: 'Ekte. Egentlig en konsertkø i fjor sommer.',
        teknikk: true,
        effekt: { spredning: 22, troverdighet: 2, skade: 9 },
        respons: 'Folk ser hva de forventer å se. Ingen legger merke til at halve køen har festivalarmbånd.'
      },
      {
        tekst: 'AI-bilde av en garderobe med hengelås og gitter',
        under: 'Laget på tolv sekunder. Dramatisk lys.',
        teknikk: true,
        effekt: { spredning: 30, troverdighet: -14, skade: 12 },
        respons: 'Det sprer seg fort. Så teller noen fingrene på personen i bakgrunnen og finner seks. Skjermbildet av den kommentaren sprer seg enda fortere.'
      }
    ],
    motgift: {
      intro: 'Bytt stol. Et bilde dukker opp med en dramatisk påstand under.',
      sporsmal: 'Hvilket spørsmål avslører raskest et ekte bilde brukt i feil sammenheng?',
      alternativer: [
        { tekst: 'Er bildet redigert?', riktig: false, svar: 'Nesten – men det viktigste trikset krever ingen redigering i det hele tatt. Bildet kan være helt ekte og likevel lyve.', delvis: true },
        { tekst: 'Når og hvor ble bildet tatt?', riktig: true, svar: 'Riktig. Dette er spørsmålet som knekker halvsannheten. Sted og tid er det eneste den ikke tåler.' },
        { tekst: 'Hvor mange har delt det?', riktig: false, svar: 'Nei. Antall delinger sier noe om hvor godt det traff, ikke om det er sant.' },
        { tekst: 'Ser personene på bildet ekte ut?', riktig: false, svar: 'Nei. Det er nyttig mot AI-bilder, men ubrukelig mot et ekte fotografi fra feil sted.' }
      ],
      fasit: 'Slik gjør du det i praksis: høyreklikk på bildet og søk etter det (omvendt bildesøk). Se etter det eldste treffet. Er bildet fra 2019, mens posten handler om i går, har du saken.'
    }
  },

  /* ── RUNDE 4 ─────────────────────────────────────── */
  {
    nr: 4,
    id: 'koret',
    tittel: 'Koret',
    teknikk: 'falsktFlertall',
    tid: 'Tirsdag 15.30',
    scene: `Noe uventet skjer: folk begynner å tvile. En jente i 9. klasse skriver at hun går her, og at garderobene står åpne akkurat som før.\n\nHun har rett, og hun har elleve likes.\n\nDu trenger at det ser ut som om alle er enige med deg.`,
    sporsmal: 'Hva gjør du med kommentarfeltet?',
    valg: [
      {
        tekst: 'La det stå',
        under: 'Folk får mene det de mener.',
        teknikk: false,
        effekt: { spredning: -4, troverdighet: 8, skade: 0 },
        respons: 'Diskusjonen går videre uten deg. To personer skifter mening. Det er ikke dramatisk, men det er sånn en samtale ser ut når den får være i fred.'
      },
      {
        tekst: 'Be de seks i gruppechatten kommentere',
        under: 'Samme budskap, men hver med sine egne ord.',
        teknikk: true,
        effekt: { spredning: 18, troverdighet: 6, skade: 8 },
        respons: 'Dette er den farligste varianten, for det ER seks ekte mennesker med ekte kontoer. Ingen kan avsløre dem. De vet bare ikke selv at de er blitt et kor.'
      },
      {
        tekst: 'Lag tolv kontoer med bilder fra nettet',
        under: 'Skriv omtrent det samme fra alle.',
        teknikk: true,
        effekt: { spredning: 22, troverdighet: -10, skade: 9 },
        respons: 'Det ser voldsomt ut i to timer. Så legger noen merke til at tre av «personene» har samme profilbilde i speilvendt versjon.'
      },
      {
        tekst: 'Kjøp rekkevidde for 200 kroner',
        under: `${STED.app} kaller det «boost». Du kaller det ingenting.`,
        teknikk: true,
        effekt: { spredning: 28, troverdighet: 0, skade: 8 },
        respons: 'Ingen bryter noen regler. Du betalte, og plattformen leverte. Jenta i 9. klasse har fortsatt elleve likes.'
      }
    ],
    motgift: {
      intro: 'Bytt stol. Du leser kommentarfeltet under en post du er usikker på.',
      sporsmal: 'Hvilke to kommentarer tyder på at flertallet er laget? Velg to.',
      flervalg: 2,
      alternativer: [
        { tekst: '«Endelig noen som tør å si det!»', under: 'Konto opprettet i går · ingen profilbilde · null andre poster', riktig: true, svar: 'Ja. Ny konto, ingen historikk, dukker opp bare i denne saken.' },
        { tekst: '«Dette stemmer ikke. Jeg går her, og garderobene er åpne.»', under: 'Konto fra 2021 · poster om håndball og katten sin', riktig: false, svar: 'Nei – dette er tvert imot en helt vanlig person. Den som motsier flertallet, er sjelden roboten.' },
        { tekst: '«Endelig noen som tør å si det.»', under: 'Annen konto · nesten identisk formulering · postet 40 sekunder senere', riktig: true, svar: 'Ja. Nesten samme setning, nesten samme sekund. Ekte mennesker formulerer seg ulikt.' },
        { tekst: '«Hvor har du dette fra?»', under: 'Konto fra 2019 · to følgere · ingen aktivitet på et halvt år', riktig: false, svar: 'Nei. Kjedelig konto, men et helt legitimt spørsmål. Få følgere er ikke det samme som falsk.' }
      ],
      fasit: 'Klikk deg inn på kontoene i stedet for å telle kommentarene. Alder, historikk og formuleringer avslører koret. Og husk: den som er uenig med flertallet, er ikke automatisk den mistenkelige.'
    }
  },

  /* ── RUNDE 5 ─────────────────────────────────────── */
  {
    nr: 5,
    id: 'motangrepet',
    tittel: 'Motangrepet',
    teknikk: 'mistenkeliggjoring',
    tid: 'Onsdag 09.15',
    scene: `Jørgen Lie i ${STED.avis} har gjort jobben sin. Han ringte vaktmester Rune, leste referatet, fant originalbildet fra Trondheim og publiserte klokka ni:\n\n«Nei, garderobene på ${STED.skole} skal ikke låses.»\n\nSaken din er død. Med mindre du gjør noe.`,
    dilemma: true,
    sporsmal: 'Hva gjør du nå?',
    valg: [
      {
        tekst: 'Skriv at du tok feil, og be folk dele rettelsen',
        under: 'Med ditt eget navn under.',
        teknikk: false,
        effekt: { spredning: -18, troverdighet: 16, skade: -12 },
        respons: 'Rettelsen får 40 delinger. Feilen fikk 3 000. Sånn er regnestykket alltid – og det er likevel den eneste knappen som faktisk reparerer noe.'
      },
      {
        tekst: 'Slett posten og si ingenting',
        under: 'Som om det aldri skjedde.',
        teknikk: false,
        effekt: { spredning: -10, troverdighet: -4, skade: 3 },
        respons: 'Posten er borte fra profilen din. Skjermbildene er ikke borte fra noe som helst. Folk husker påstanden og ikke at den ble trukket.'
      },
      {
        tekst: 'Skriv at Jørgen Lie har familie i elevrådet',
        under: 'Han har en niese der. Resten legger folk til selv.',
        teknikk: true,
        effekt: { spredning: 26, troverdighet: 8, skade: 18 },
        respons: 'Ingen diskuterer garderobene lenger. Nå diskuterer de Jørgen Lie. Han slutter å svare i kommentarfeltet på fredag, og han skriver ikke om skolen igjen på et halvt år.',
        offer: 'jorgen'
      },
      {
        tekst: 'Bare still et spørsmål',
        under: '«Hvorfor bruker avisa så mye tid på å avkrefte akkurat dette?»',
        teknikk: true,
        effekt: { spredning: 20, troverdighet: 4, skade: 12 },
        respons: 'Du har ikke påstått noe. Du har bare antydet at det finnes en grunn – og hjernen til leseren fyller inn resten helt gratis.',
        offer: 'jorgen'
      }
    ],
    motgift: {
      intro: 'Bytt stol. Noen har fått påvist at de tok feil, og svarer.',
      sporsmal: 'Hvilket svar handler faktisk om saken?',
      alternativer: [
        { tekst: '«Journalisten har alltid vært negativ til ungdom i denne kommunen.»', riktig: false, svar: 'Nei. Dette handler om personen. Selv om det var sant, ville bildet fortsatt vært fra Trondheim.' },
        { tekst: '«Hvorfor bruker avisa så mye tid på akkurat denne saken?»', riktig: false, svar: 'Nei. Et spørsmål som antyder et motiv, uten å ta stilling til om påstanden var riktig.' },
        { tekst: '«Bildet er fra Trondheim i 2019. Her er lenken til originalen.»', riktig: true, svar: 'Riktig. Dette er det eneste svaret som kan sjekkes av deg, akkurat nå, på tolv sekunder.' },
        { tekst: '«Typisk gammelmedia som skal bestemme hva vi får mene.»', riktig: false, svar: 'Nei. Dette handler om en hel yrkesgruppe, ikke om ett bilde.' }
      ],
      fasit: 'Still ett spørsmål til alle svar du leser: handler dette om saken, eller om personen? Et svar som ikke nevner selve funnet med ett ord, er som regel et svar fra noen som ikke har noe å si om funnet.'
    }
  },

  /* ── RUNDE 6 ─────────────────────────────────────── */
  {
    nr: 6,
    id: 'skolevalget',
    tittel: 'Skolevalget',
    teknikk: 'polarisering',
    tid: 'Torsdag 12.00',
    scene: `Om en uke er det skolevalg. To lister stiller:\n\n«Matpauselista» vil ha ti minutter lengre matpause.\n«Busslista» vil ha gratis buss for dem som bor lengst unna.\n\nDe er enige om alt annet. De har til og med skrevet programmet sammen. Nora fra Busslista er den mest populære jenta på trinnet, og hun har ikke gjort deg noe.\n\nDet blir kjedelig. Med mindre noen gjør det til en kamp.`,
    dilemma: true,
    sporsmal: 'Hvordan får du mest oppmerksomhet?',
    valg: [
      {
        tekst: 'Skriv om hva de to listene er enige om',
        under: 'Det er nesten alt.',
        teknikk: false,
        effekt: { spredning: 6, troverdighet: 14, skade: -8 },
        respons: 'Sytten likes og null krangel. Det er den dårligste posten din denne uka, målt i tall. Målt i noe annet er det den beste.'
      },
      {
        tekst: 'Framstill Matpauselista som folk som vil at de som bor langt unna skal gå',
        under: 'Ingen har sagt det. Men noen kommer til å tro det.',
        teknikk: true,
        effekt: { spredning: 26, troverdighet: -4, skade: 16 },
        respons: 'Nå har valget en skurk. Kantina deler seg i to bord som ikke sitter sammen igjen dette skoleåret.'
      },
      {
        tekst: 'Legg ut en test: «Hvilken side er DU på?»',
        under: 'Fem spørsmål. To mulige svar.',
        teknikk: true,
        effekt: { spredning: 24, troverdighet: 2, skade: 10 },
        respons: 'Tester tvinger folk til å velge lag før de har hørt argumentene. Etterpå forsvarer de laget, ikke standpunktet. 214 elever har tatt den innen kvelden.'
      },
      {
        tekst: 'Klipp en video der Nora sier fire ord av en setning på tolv',
        under: '«…de trenger ikke lengre matpause…»',
        teknikk: true,
        effekt: { spredning: 32, troverdighet: -6, skade: 20 },
        respons: 'Hele setningen var: «Noen sier at de som tar buss ikke trenger lengre matpause, men det mener ikke jeg.» Klippet er 1,8 sekunder langt. Det har 4 000 visninger før Nora har sett det selv.',
        offer: 'nora'
      }
    ],
    motgift: {
      intro: 'Bytt stol. Fire innlegg om skolevalget ligger i feeden din.',
      sporsmal: 'Hvilket innlegg er skrevet av en som prøver å forstå, ikke å vinne?',
      alternativer: [
        { tekst: '«Alle som stemmer Busslista bryr seg ikke om resten av oss.»', riktig: false, svar: 'Nei. «Alle som…» er et varselord. Det gjør tusen mennesker til én meining.' },
        { tekst: '«Jeg stemmer Matpauselista, men bussforslaget er faktisk godt for dem som bor på Nordsida.»', riktig: true, svar: 'Riktig. Dette innlegget passer ikke i noen leir – og det er akkurat derfor det er verdt å lese. Let alltid etter dem som ikke passer.' },
        { tekst: '«Del hvis du er enig! 🔥 Vi kan ikke la dem vinne!»', riktig: false, svar: 'Nei. «Dem» og «vi» uten ett eneste argument.' },
        { tekst: '«Nora avslørt: se hva hun EGENTLIG mener om oss.»', riktig: false, svar: 'Nei. Dette er klippet fra i sted, pakket inn som en avsløring.' }
      ],
      fasit: 'De som har nyanser, deles minst. Derfor ser feeden din mer splittet ut enn skolen din faktisk er. Å lete aktivt etter dem som ikke passer i noen leir, er den beste vaksinen mot polarisering.'
    }
  }
];

/* ─── SLUTTUTFORDRING ───────────────────────────────────
   Nå snur vi spillet helt. Ingen valg, bare gjenkjenning.
   Dette er den delen læreren kan bruke som en rask sjekk på
   om teknikkene faktisk sitter.                                        */

export const SLUTTUTFORDRING = [
  {
    post: `«Er det sant at ${STED.skole} vurderer å fjerne gymtimene?» – 3 400 delinger`,
    riktig: 'folelseskrok',
    svar: 'Spørsmålsformen. Ingen påstand å bevise, men alle husker påstanden etterpå.'
  },
  {
    post: '«Bilde: kaos utenfor skolen i går.» Bildet dukker opp i omvendt bildesøk – tatt i Bergen i 2017.',
    riktig: 'halvsannhet',
    svar: 'Ekte bilde, feil sted, feil år. Halvsannheten trenger ingen redigering.'
  },
  {
    post: '«Alle på trinnet mener det samme. Bare se kommentarfeltet.» 22 kommentarer, 19 fra kontoer opprettet samme uke.',
    riktig: 'falsktFlertall',
    svar: 'Kontoenes alder avslører koret. Det føltes som et folkekrav, det var en ettermiddags arbeid.'
  }
];

/* ─── MERKER ────────────────────────────────────────────
   Alle merker gis for å AVSLØRE, ikke for å manipulere godt.
   Det er det tydeligste designvalget i hele spillet.                    */

export const MERKER = [
  { id: 'adresse',   ikon: '🔎', navn: 'Adressesjekkeren', krav: 'Fant den ekte avsenderen i runde 1' },
  { id: 'kaldthode', ikon: '🧊', navn: 'Kaldt hode',       krav: 'Fant det ladede ordet i runde 2' },
  { id: 'bilde',     ikon: '🖼️', navn: 'Bildegranskeren',  krav: 'Stilte riktig spørsmål til bildet i runde 3' },
  { id: 'flokk',     ikon: '👥', navn: 'Flokktelleren',    krav: 'Avslørte det falske flertallet i runde 4' },
  { id: 'sak',       ikon: '🎯', navn: 'Saksfokus',        krav: 'Skilte sak fra person i runde 5' },
  { id: 'bru',       ikon: '🌉', navn: 'Brubyggeren',      krav: 'Fant nyansen i runde 6' },
  { id: 'samler',    ikon: '📚', navn: 'Teknikksamleren',  krav: 'Låste opp alle seks teknikkort' },
  { id: 'rein',      ikon: '🕊️', navn: 'Lav skade',        krav: 'Avsluttet med skade under 40' },
  { id: 'angrer',    ikon: '↩️', navn: 'Den som snudde',   krav: 'Rettet opp en feil offentlig' },
  { id: 'skarp',     ikon: '💎', navn: 'Skarpsynt',        krav: 'Full pott på alle seks motgifter' }
];

/* ─── REFLEKSJON ────────────────────────────────────────
   Spillet skal aldri slutte på en poengsum.                             */

export const REFLEKSJON = {
  alene: [
    'Hvilket valg var lettest å ta i spillet? Hvorfor tror du det var det?',
    'Var det noe du valgte fordi det ga flest poeng, selv om du visste bedre?',
    'Hvilken av de seks teknikkene tror du du selv er mest mottakelig for?',
    'Har du delt noe du senere fant ut ikke stemte? Hva gjorde du da?'
  ],
  gruppe: [
    'Rettelsen fikk 40 delinger. Feilen fikk 3 000. Er det da noe poeng i å rette?',
    'Hvem har ansvaret når et rykte sprer seg: den som fant det på, den som delte det videre, eller appen som viste det til flere?',
    'I runde 4 kunne du be seks ekte venner kommentere det samme. Er det juks? Hvor går grensa mellom å engasjere og å manipulere?',
    'Nora fikk klippet et sitat. Hva burde skolen gjort dagen etter?',
    'Finnes det tilfeller der «bare stille spørsmål» er helt greit? Hva er forskjellen?',
    'Hva ville skjedd hvis alle på trinnet ditt brukte de tre sjekkene fra dette spillet i én uke?'
  ]
};

/* ─── PERSONENE SOM BLE RAMMET ──────────────────────────
   Sluttrapporten viser hva som skjedde med dem. Teksten avhenger av
   hvor mye skade spilleren påførte.                                     */

export const PERSONER = {
  rune: {
    navn: 'Vaktmester Rune',
    rolle: 'bestilte låsene',
    lav:  'Rune fikk to sinte e-poster og ristet det av seg. Låsene ble montert i uke 12.',
    mid:  'Rune sluttet å svare på telefonen fra ukjente numre. Han har fortsatt ikke montert låsene.',
    hoy:  'Rune ba om å få bytte skole. Han jobbet i Fagerli i nitten år.'
  },
  jorgen: {
    navn: 'Jørgen Lie',
    rolle: `journalist i ${STED.avis}`,
    lav:  'Jørgen skrev saken, fikk noen sure kommentarer og gikk videre til neste sak.',
    mid:  'Jørgen slutter å lese kommentarfeltet på egne saker. Det er en vane han ikke klarer å legge fra seg igjen.',
    hoy:  'Jørgen skriver ikke om skolen igjen på et halvt år. Redaktøren kaller det «å velge sine kamper».'
  },
  nora: {
    navn: 'Nora',
    rolle: 'elevrådskandidat',
    lav:  'Nora fikk noen rare blikk i gangen, og så var det over.',
    mid:  'Nora trakk kandidaturet sitt to dager før valget. Hun sa det var fordi hun hadde mye å gjøre.',
    hoy:  'Nora byttet klasse. Klippet ligger fortsatt der, og er det første som kommer opp når noen søker på navnet hennes.'
  }
};
