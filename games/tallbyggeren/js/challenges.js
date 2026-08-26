/* =========================================================
   KAMPANJEN — 60 håndlagde oppgaver
   Oppgavene ligger her, adskilt fra spillkoden, slik at
   progresjonen kan balanseres uten å røre motoren.

   Nivå 1  ett statistisk mål
   Nivå 2  ett mål + en betingelse eller et låst tall
   Nivå 3  to statistiske mål
   Nivå 4  to mål + betingelser
   Nivå 5  tre eller flere krav
   Nivå 6  ekspert: flere løsninger, mulig/umulig, stramme krav

   Felter
     values          tallbrikkene: antall og tillatt område
     requirements    mean / median / mode / range (alle kan kombineres)
     constraints     mustInclude, mustNotInclude, minValue, maxValue,
                     allUnique, exactDistinctValues, occurrences
     lockedValues    tall spilleren ikke kan endre
     requiredSolutions  hvor mange ulike datasett som må finnes
     impossible      oppgaven har ingen løsning — spilleren skal se det
     start           datasettet spilleren møter. Dette er en del av
                     oppgavedesignet: det bestemmer hvilken erkjennelse
                     spilleren starter fra, og er aldri en løsning
     reference       fasit. Brukes av QA og i oppsummeringen
     teachingGoal    hva oppgaven skal lære bort
     insight         setningen spilleren møter når oppgaven er løst
     hints           håndskrevet, ett om gangen. {felt} fylles ut med
                     tall fra spillerens eget datasett (se hints.js)
     note            hvorfor oppgaven kommer akkurat her
   ========================================================= */

export const CAMPAIGN = [

  /* ══════════════════ NIVÅ 1 ══════════════════
     Ett mål om gangen. Hvert av de fire målene får sin egen
     førstegangsopplevelse, og så gjentas det med flere tall slik at
     spilleren ser at regelen ikke endrer seg når datasettet vokser. */

  {
    id: '1-01', level: 1,
    values: { count: 3, min: 0, max: 12, integersOnly: true },
    requirements: { median: 5 },
    start: [2, 2, 2],
    reference: [2, 5, 9],
    teachingGoal: 'Medianen er det midterste tallet når tallene sorteres.',
    insight: 'Bare det midterste tallet bestemmer medianen. De to andre kan være nesten hva som helst — så lenge ett er mindre og ett er større.',
    hints: [
      'Sorter tallene i hodet. Hvilket tall står i midten?',
      'Med tre tall er medianen tallet i midten. Ett tall må altså være mindre enn 5, og ett må være større.',
      'Tallene dine er {tallene}. Medianen er {median} — hvilket tall må du flytte?',
    ],
    note: 'Første oppgave i spillet. Tre tall er det minste settet der «midten» finnes, og medianen er det målet som er lettest å se med øynene.',
  },
  {
    id: '1-02', level: 1,
    values: { count: 3, min: 0, max: 12, integersOnly: true },
    requirements: { range: 6 },
    start: [4, 4, 4],
    reference: [2, 4, 8],
    teachingGoal: 'Variasjonsbredden er største tall minus minste tall.',
    insight: 'Variasjonsbredden bryr seg bare om ytterpunktene. Tallet i midten kan du flytte fritt uten at bredden endrer seg.',
    hints: [
      'Variasjonsbredde = største tall − minste tall.',
      'Du trenger to tall som ligger 6 fra hverandre. Det tredje kan ligge hvor som helst mellom dem.',
      'Nå er største tall {storste} og minste {minste}. Det gir bredde {bredde}.',
    ],
    note: 'Starter på et sett der alle tallene er like, så bredden er 0. Spilleren må selv skape avstanden, og oppdager at bare ytterpunktene teller.',
  },
  {
    id: '1-03', level: 1,
    values: { count: 3, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 5 },
    start: [2, 2, 2],
    reference: [3, 5, 7],
    teachingGoal: 'Gjennomsnittet bestemmes av summen av tallene.',
    insight: 'Tre tall med gjennomsnitt 5 må ha sum 15 — uansett hvordan de fordeler seg. Gir du noe til ett tall, må du ta det fra et annet.',
    hints: [
      'Tenk på summen av alle tallene.',
      'Tre tall med gjennomsnitt 5 må til sammen bli 15.',
      'Tallene dine har sum {sum}. Det er {mangler} {retning}.',
    ],
    note: 'Gjennomsnittet kommer etter median og bredde, fordi det er det eneste målet som krever regning på alle tallene samtidig. Samme startsett som 1-01 gjør forskjellen mellom de to målene tydelig.',
  },
  {
    id: '1-04', level: 1,
    values: { count: 4, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6 },
    start: [3, 3, 3, 3],
    reference: [4, 5, 7, 8],
    teachingGoal: 'Sumregelen holder når datasettet vokser: fire tall med gjennomsnitt 6 må ha sum 24.',
    insight: 'Antall tall ganger gjennomsnittet gir summen. Det er hele regelen, og den gjelder uansett hvor mange tall du har.',
    hints: [
      'Hvor stor må summen være når fire tall skal ha gjennomsnitt 6?',
      'Fire tall med gjennomsnitt 6 må til sammen bli 24.',
      'Summen din er {sum}. Målet er {malsum}.',
    ],
    note: 'Gjentar 1-03 med ett tall mer. Poenget er ikke ny kunnskap, men å se at regelen ikke er knyttet til «tre tall».',
  },
  {
    id: '1-05', level: 1,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { median: 7 },
    start: [3, 3, 3, 3, 3],
    reference: [1, 3, 7, 9, 10],
    teachingGoal: 'Med fem tall er medianen det tredje tallet i sortert rekkefølge.',
    insight: 'To tall må ligge under medianen og to over. Hvor langt unna de ligger, spiller ingen rolle.',
    hints: [
      'Sorter tallene. Hvilken plass har midten når du har fem tall?',
      'Med fem tall er medianen det tredje. To tall skal være mindre, to større.',
      'Sortert er tallene dine {tallene}. Det tredje er {median}.',
    ],
    note: 'Første møte med median i et større sett. Bruk sorteringsknappen her — den gjør «det tredje tallet» synlig.',
  },
  {
    id: '1-06', level: 1,
    values: { count: 4, min: 0, max: 10, integersOnly: true },
    requirements: { mode: 3 },
    start: [5, 5, 5, 5],
    reference: [1, 3, 3, 8],
    teachingGoal: 'Typetallet er verdien som forekommer oftest.',
    insight: 'Typetallet handler om hvor mange ganger en verdi går igjen — ikke om hvor stor den er.',
    hints: [
      'Typetallet er den verdien som går igjen flest ganger.',
      'La 3 forekomme oftere enn alle andre tall. To treere holder, så lenge ingen annen verdi også kommer to ganger.',
      'Nå er typetallet ditt {typetall}.',
    ],
    note: 'Typetallet kommer sist av de fire målene, fordi regelen er den mest særegne. Startsettet har typetall 5, så spilleren må både bygge opp treerne og bryte opp femmerne.',
  },
  {
    id: '1-07', level: 1,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { range: 8 },
    start: [6, 6, 6, 6, 6],
    reference: [2, 5, 6, 9, 10],
    teachingGoal: 'Variasjonsbredden avhenger bare av ytterpunktene, uansett hvor mange tall som ligger imellom.',
    insight: 'Tre av tallene dine kan flyttes fritt uten at bredden rikker seg. Bare det største og det minste teller.',
    hints: [
      'Bare to av tallene bestemmer variasjonsbredden. Hvilke?',
      'Sett det minste og det største tallet 8 fra hverandre. De tre andre kan ligge hvor som helst imellom.',
      'Største tall er {storste}, minste er {minste}, altså bredde {bredde}.',
    ],
    note: 'Samme mål som 1-02, men med fem tall. Nå blir det tydelig at «de andre tallene» ikke betyr noe for bredden.',
  },
  {
    id: '1-08', level: 1,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6 },
    start: [4, 4, 4, 4, 4],
    reference: [2, 4, 6, 8, 10],
    teachingGoal: 'Fem tall med gjennomsnitt 6 må ha sum 30 — og det finnes mange måter å fordele 30 på.',
    insight: 'Du kan bytte om på hvor mye hvert tall bidrar med, så lenge summen holder seg. Det er derfor gjennomsnittet skjuler forskjeller.',
    hints: [
      'Hvor stor må summen bli?',
      'Fem tall med gjennomsnitt 6 må ha sum 30.',
      'Summen din er {sum}, og du mangler {mangler}.',
    ],
    note: 'Tredje gjennomsnittsoppgave, nå med fem tall. Her begynner spilleren å bruke sumregelen som verktøy i stedet for å prøve seg fram.',
  },
  {
    id: '1-09', level: 1,
    values: { count: 6, min: 0, max: 10, integersOnly: true },
    requirements: { mode: 4 },
    start: [7, 7, 7, 7, 7, 7],
    reference: [1, 2, 4, 4, 6, 9],
    teachingGoal: 'Typetallet må være alene om å være vanligst — én verdi må forekomme oftere enn alle andre.',
    insight: 'Hadde to verdier gått igjen like mange ganger, ville datasettet ikke hatt noe typetall i det hele tatt.',
    hints: [
      'La 4 gå igjen flere ganger enn noe annet tall.',
      'Pass på at ingen annen verdi forekommer like mange ganger som 4 — da forsvinner typetallet.',
      'Tallene dine er {tallene}, og typetallet er {typetall}.',
    ],
    note: 'Andre typetallsoppgave, med seks tall. Med flere brikker er det lett å lage uavgjort mellom to verdier, og spilleren møter regelen om at typetallet må være entydig.',
  },
  {
    id: '1-10', level: 1,
    values: { count: 6, min: 0, max: 20, integersOnly: true },
    requirements: { mean: 9 },
    start: [5, 5, 5, 5, 5, 5],
    reference: [4, 7, 9, 10, 12, 12],
    teachingGoal: 'Sumregelen skalerer: seks tall med gjennomsnitt 9 må ha sum 54.',
    insight: 'Større tall og flere brikker forandrer ingenting. Antall ganger gjennomsnitt er fortsatt summen du må treffe.',
    hints: [
      'Regn ut hvilken sum seks tall må ha for å få gjennomsnitt 9.',
      'Seks tall med gjennomsnitt 9 må til sammen bli 54.',
      'Summen din er {sum}. Du mangler {mangler}.',
    ],
    note: 'Nivåets siste oppgave: samme regel som spilleren nå kan, men med større tallområde. Den skal føles overkommelig — dette er nivået der verktøyet skal sitte.',
  },

  /* ══════════════════ NIVÅ 2 ══════════════════
     Ett statistisk mål, men nå med en betingelse eller et låst tall i
     veien. Poenget er at spilleren må jobbe rundt noe hen ikke kan
     endre, og det tvinger fram forståelse i stedet for prøving. */

  {
    id: '2-01', level: 2,
    values: { count: 3, min: 0, max: 12, integersOnly: true },
    requirements: { median: 6 },
    constraints: { mustInclude: [9] },
    start: [3, 3, 3],
    reference: [3, 6, 9],
    teachingGoal: 'Et tall som må være med, får en bestemt plass i den sorterte rekkefølgen.',
    insight: '9 er større enn 6, så 9 kan ikke være det midterste tallet. Den plassen må et annet tall ta.',
    hints: [
      '9 må være med. Kan 9 stå i midten når medianen skal være 6?',
      'Siden 9 er større enn medianen, må 9 være det største tallet. Da er det midterste tallet ditt som må bli 6.',
      'Tallene dine sortert: {tallene}. Medianen er {median}.',
    ],
    note: 'Første betingelse i spillet, i det minste mulige settet. Spilleren må resonnere om plassering, ikke bare om verdier.',
  },
  {
    id: '2-02', level: 2,
    values: { count: 4, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 5 },
    lockedValues: [{ position: 0, value: 2 }],
    start: [2, 4, 4, 4],
    reference: [2, 4, 6, 8],
    teachingGoal: 'Et låst tall spiser en del av summen. Resten av tallene må dekke det som er igjen.',
    insight: 'Summen skulle bli 20. Den låste toeren tar 2 av dem, så de tre andre tallene må bli 18 til sammen.',
    hints: [
      'Hvilken sum må de fire tallene ha til sammen?',
      'Summen skal bli 20, og 2 er allerede låst. Hvor mye må de tre andre bli?',
      'Summen din er {sum} av {malsum}.',
    ],
    note: 'Første låste tall. Kombinasjonen med gjennomsnitt er den klareste, fordi det låste tallet får en helt konkret konsekvens: det spiser en bit av summen.',
  },
  {
    id: '2-03', level: 2,
    values: { count: 4, min: 0, max: 12, integersOnly: true },
    requirements: { range: 7 },
    constraints: { mustInclude: [4] },
    start: [5, 5, 5, 5],
    reference: [4, 5, 6, 11],
    teachingGoal: 'Et påkrevd tall kan være ytterpunkt, men trenger ikke være det.',
    insight: 'Firen kan være det minste tallet, eller den kan ligge midt inne i settet. Bredden avgjøres uansett av ytterpunktene.',
    hints: [
      'Firen må være med, men den bestemmer ikke bredden alene.',
      'Enten lar du 4 være det minste tallet, eller så legger du både et mindre og et større tall rundt den.',
      'Nå er bredden din {bredde}, fra {minste} til {storste}.',
    ],
    note: 'Åpner for to ulike strategier med samme betingelse. Det er første gang spilleren kan velge vei, og begge veier er riktige.',
  },
  {
    id: '2-04', level: 2,
    values: { count: 4, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6 },
    constraints: { mustInclude: [9] },
    start: [3, 3, 3, 3],
    reference: [4, 5, 6, 9],
    teachingGoal: 'Et høyt påkrevd tall må balanseres av lavere tall for at gjennomsnittet skal treffe.',
    insight: 'Nieren ligger 3 over gjennomsnittet. Da må de andre tallene til sammen ligge 3 under.',
    hints: [
      'Fire tall med gjennomsnitt 6 må bli 24 til sammen.',
      'Nieren er 3 mer enn gjennomsnittet. De tre andre tallene må dekke opp for det.',
      'Summen din er {sum} av {malsum}.',
    ],
    note: 'Her introduseres balansetankegangen: hvert tall bidrar med sitt avvik fra gjennomsnittet, og avvikene må gå opp i null.',
  },
  {
    id: '2-05', level: 2,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { median: 8 },
    lockedValues: [{ position: 4, value: 12 }],
    start: [4, 4, 4, 4, 12],
    reference: [2, 4, 8, 10, 12],
    teachingGoal: 'Et låst tall over medianen bruker opp én av plassene på oversiden.',
    insight: 'Tolveren tar den ene plassen over medianen. Da må du selv skaffe det andre tallet som er større enn 8.',
    hints: [
      'Med fem tall må to være mindre enn medianen og to større.',
      'Tolveren er allerede en av de to som er større. Hvilke tall mangler du da?',
      'Sortert er tallene {tallene}, og medianen er {median}.',
    ],
    note: 'Låst tall møter median. Spilleren må telle plasser over og under midten — grunnlaget for alt arbeid med median videre.',
  },
  {
    id: '2-06', level: 2,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 7 },
    constraints: { mustNotInclude: [7] },
    start: [5, 5, 5, 5, 5],
    reference: [3, 5, 8, 9, 10],
    teachingGoal: 'Gjennomsnittet trenger ikke være et av tallene i datasettet.',
    insight: 'Ingen av tallene dine er 7, men gjennomsnittet er det likevel. Gjennomsnittet er et regnestykke, ikke en av verdiene.',
    hints: [
      'Summen må bli 35 — men ingen av tallene får være 7.',
      'Legg tallene rundt 7 i stedet: like mye over som under.',
      'Summen din er {sum} av {malsum}.',
    ],
    note: 'Retter opp en vanlig misforståelse tidlig. Forbudet mot tallet 7 gjør poenget umulig å overse.',
  },
  {
    id: '2-07', level: 2,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { median: 6 },
    constraints: { minValue: 4 },
    start: [2, 2, 2, 2, 2],
    reference: [4, 5, 6, 7, 9],
    teachingGoal: 'En nedre grense for alle tallene begrenser hvor tallene under medianen kan ligge.',
    insight: 'De to tallene under medianen måtte klemmes inn mellom 4 og 6. Medianen står fritt, men naboene under har lite plass.',
    hints: [
      'Alle tallene må være minst 4. Hvilke tall kan da ligge under medianen?',
      'To tall må være mindre enn eller lik 6, men ingen kan være under 4.',
      'Minste tall er {minste}, og medianen er {median}.',
    ],
    note: 'Første betingelse som gjelder alle tallene samtidig. Startsettet bryter både betingelsen og målet, så spilleren må rydde i to ting.',
  },
  {
    id: '2-08', level: 2,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { range: 9 },
    lockedValues: [{ position: 0, value: 6 }],
    start: [6, 6, 6, 6, 6],
    reference: [6, 3, 5, 9, 12],
    teachingGoal: 'Et låst tall inne i settet legger føringer på hvor ytterpunktene kan ligge.',
    insight: 'Sekseren må ligge mellom det minste og det største tallet. Da kan ikke ytterpunktene plasseres hvor som helst — de må ha 6 mellom seg.',
    hints: [
      'Sekseren kan ikke flyttes. Både det minste og det største tallet må forholde seg til den.',
      'Enten er 6 det minste tallet, eller så må du legge et tall under 6 — og da må det største bli tilsvarende lavere.',
      'Bredden din er {bredde}: fra {minste} til {storste}.',
    ],
    note: 'Låst tall møter variasjonsbredde. Oppgaven har flere gyldige strategier, og hintene peker på begge uten å velge for spilleren.',
  },
  {
    id: '2-09', level: 2,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 8 },
    constraints: { mustInclude: [2] },
    start: [6, 6, 6, 6, 6],
    reference: [2, 9, 9, 10, 10],
    teachingGoal: 'Ett lavt tall må veies opp av flere høye når gjennomsnittet skal treffe.',
    insight: 'Toeren ligger 6 under gjennomsnittet. De fire andre tallene måtte til sammen ligge 6 over for å veie det opp.',
    hints: [
      'Fem tall med gjennomsnitt 8 må ha sum 40.',
      'Toeren ligger langt under 8. Hvor mye må de fire andre tallene dra opp?',
      'Summen din er {sum}, og du mangler {mangler}.',
    ],
    note: 'Speilbildet av 2-04: nå trekker det påkrevde tallet gjennomsnittet ned. Sammen viser de to at det er avstanden til gjennomsnittet som teller, ikke om tallet er stort eller lite.',
  },
  {
    id: '2-10', level: 2,
    values: { count: 6, min: 0, max: 20, integersOnly: true },
    requirements: { median: 10 },
    lockedValues: [{ position: 0, value: 4 }, { position: 5, value: 16 }],
    start: [4, 6, 6, 6, 6, 16],
    reference: [4, 8, 9, 11, 14, 16],
    teachingGoal: 'Med et partall antall tall er medianen gjennomsnittet av de to midterste.',
    insight: 'Det finnes ikke noe midterste tall når du har seks. Medianen ligger midt mellom de to i midten — og kan godt være et tall som ikke finnes i datasettet.',
    hints: [
      'Du har seks tall. Hvilket av dem står i midten?',
      'Med et partall antall er medianen gjennomsnittet av de to midterste. De to må altså bli 20 til sammen.',
      'Sortert er tallene {tallene}, og medianen er {median}.',
    ],
    note: 'Nivåets sisteoppgave og første møte med partall antall tall. To låste ytterpunkter rammer inn oppgaven, slik at spilleren kan konsentrere seg om de fire i midten.',
  },

  /* ══════════════════ NIVÅ 3 ══════════════════
     To statistiske mål samtidig. Nå må spilleren holde det ene målet
     i hevd mens hen jobber med det andre, og det er her sammenhengen
     mellom målene begynner å bli synlig. Flere av oppgavene starter
     med det ene målet allerede oppfylt — for å bryte vanen med å
     endre alt på én gang. */

  {
    id: '3-01', level: 3,
    values: { count: 3, min: 0, max: 12, integersOnly: true },
    requirements: { median: 5, range: 6 },
    start: [5, 5, 5],
    reference: [2, 5, 8],
    teachingGoal: 'Median og variasjonsbredde styres av forskjellige tall og kan settes uavhengig av hverandre.',
    insight: 'Du flyttet ytterpunktene uten å røre midten. Median og variasjonsbredde kom aldri i veien for hverandre.',
    hints: [
      'Medianen er allerede riktig. Kan du endre bredden uten å ødelegge den?',
      'Behold midttallet på 5, og flytt bare det minste og det største.',
      'Medianen din er {median}, bredden er {bredde}.',
    ],
    note: 'Første oppgave med to mål, og det enkleste mulige tilfellet: målene deler ingen tall. Startsettet har medianen på plass, så spilleren lærer med én gang å bevare det som allerede stemmer.',
  },
  {
    id: '3-02', level: 3,
    values: { count: 4, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, median: 6 },
    start: [3, 3, 3, 3],
    reference: [2, 5, 7, 10],
    teachingGoal: 'Gjennomsnitt og median kan være like — det skjer når tallene ligger symmetrisk.',
    insight: 'Når gjennomsnitt og median er like, ligger tallene jevnt fordelt rundt midten.',
    hints: [
      'Summen må bli 24, og de to midterste tallene må bli 12 til sammen.',
      'Legg tallene i par rundt 6: like langt over som under.',
      'Gjennomsnittet ditt er {gjennomsnitt} og medianen {median}.',
    ],
    note: 'Symmetri-tilfellet kommer først, fordi det er det spilleren intuitivt tegner. Neste oppgave bryter det bevisst.',
  },
  {
    id: '3-03', level: 3,
    values: { count: 4, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, median: 5 },
    start: [4, 4, 4, 4],
    reference: [2, 4, 6, 12],
    teachingGoal: 'Når gjennomsnittet er større enn medianen, er det ett eller flere høye tall som drar det opp.',
    insight: 'Gjennomsnittet ligger over medianen. Det skjer når noen få store tall drar summen opp, mens flertallet av tallene ligger lavere.',
    hints: [
      'Gjennomsnittet skal være større enn medianen. Hva må til for det?',
      'Hold de to midterste tallene lave og la ett stort tall dra summen opp.',
      'Gjennomsnittet ditt er {gjennomsnitt}, medianen {median}.',
    ],
    note: 'Kjernen i hele spillet: forskjellen mellom gjennomsnitt og median er ikke tilfeldig, den forteller om fordelingen. Kommer rett etter symmetri-oppgaven, så kontrasten blir tydelig.',
  },
  {
    id: '3-04', level: 3,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { median: 7, range: 8 },
    start: [7, 7, 7, 7, 7],
    reference: [3, 5, 7, 9, 11],
    teachingGoal: 'Ytterpunktene kan flyttes langt uten at medianen rikker seg.',
    insight: 'Medianen sto helt stille mens du dro ytterpunktene fra hverandre. Den bryr seg om rekkefølge, ikke om avstand.',
    hints: [
      'Behold det tredje tallet på 7 og jobb med ytterpunktene.',
      'Det minste og det største tallet må ligge 8 fra hverandre, med 7 imellom.',
      'Medianen din er {median} og bredden {bredde}.',
    ],
    note: 'Samme grep som 3-01, men med fem tall og større spillerom. Her ser spilleren at medianen er robust mot uteliggere — forberedelse til nivå 5.',
  },
  {
    id: '3-05', level: 3,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 7, range: 10 },
    start: [7, 7, 7, 7, 7],
    reference: [2, 5, 7, 9, 12],
    teachingGoal: 'Gjennomsnittet kan holdes fast mens spredningen endres helt.',
    insight: 'Gjennomsnittet sier ingenting om hvor spredt tallene er. Du kan gjøre settet mye mer spredt uten at gjennomsnittet flytter seg en tøddel.',
    hints: [
      'Gjennomsnittet er allerede riktig. Kan du spre tallene uten å endre summen?',
      'Tar du 3 fra ett tall og gir 3 til et annet, står summen stille.',
      'Summen din er {sum} av {malsum}, og bredden er {bredde}.',
    ],
    note: 'Den viktigste oppgaven på nivået. «Ta fra ett, gi til et annet» er teknikken spilleren trenger i alle senere gjennomsnittsoppgaver, og her får den stå alene.',
  },
  {
    id: '3-06', level: 3,
    values: { count: 4, min: 0, max: 10, integersOnly: true },
    requirements: { mean: 5, mode: 4 },
    start: [5, 5, 5, 5],
    reference: [2, 4, 4, 10],
    teachingGoal: 'Typetallet legger beslag på to av tallene, og de resterende må ordne summen alene.',
    insight: 'To av plassene gikk med til å skape typetallet. Da hadde du bare to tall igjen å styre summen med.',
    hints: [
      'To like tall må til for at 4 skal bli typetall. Da har du to tall igjen.',
      'Summen skal bli 20. To firere tar 8 av dem.',
      'Typetallet ditt er {typetall}, og summen er {sum}.',
    ],
    note: 'Første kombinasjon av typetall og gjennomsnitt. Poenget er at typetallet binder opp brikker — en helt annen type begrensning enn de andre målene gir.',
  },
  {
    id: '3-07', level: 3,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { median: 6, mode: 6 },
    start: [3, 3, 3, 3, 3],
    reference: [2, 4, 6, 6, 9],
    teachingGoal: 'Median og typetall kan være samme verdi, men av helt ulike grunner.',
    insight: 'Sekseren er median fordi den står i midten, og typetall fordi den går igjen. To ulike regler som tilfeldigvis peker på samme tall.',
    hints: [
      'Du trenger flere seksere enn noe annet tall — og 6 må stå i midten.',
      'To seksere holder, så lenge de havner rundt midtplassen når tallene sorteres.',
      'Medianen er {median} og typetallet {typetall}.',
    ],
    note: 'Utfordrer forestillingen om at sentralmålene «måler det samme». At de gir samme svar her, er en konsekvens av hvordan spilleren bygde settet — ikke en regel.',
  },
  {
    id: '3-08', level: 3,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, median: 8 },
    start: [6, 6, 6, 6, 6],
    reference: [0, 0, 8, 10, 12],
    teachingGoal: 'Når gjennomsnittet er mindre enn medianen, er det lave tall som drar det ned.',
    insight: 'Nå ligger gjennomsnittet under medianen. Et par svært lave tall trakk summen ned, mens flertallet av tallene lå høyt.',
    hints: [
      'Medianen skal være høyere enn gjennomsnittet. Hvilke tall må da være ekstreme?',
      'Tre av tallene må være minst 8. Da må de to laveste være svært små for at summen skal bli 30.',
      'Gjennomsnittet ditt er {gjennomsnitt}, medianen {median}, summen {sum}.',
    ],
    note: 'Speilbildet av 3-03. Sammen dekker de begge retningene av skjevfordeling, og de er lagt med avstand slik at spilleren rekker å glemme grepet og må resonnere på nytt.',
  },
  {
    id: '3-09', level: 3,
    values: { count: 6, min: 0, max: 12, integersOnly: true },
    requirements: { median: 8, range: 10 },
    start: [4, 4, 4, 4, 4, 4],
    reference: [2, 6, 7, 9, 10, 12],
    teachingGoal: 'Med partall antall må de to midterste tallene til sammen bli det dobbelte av medianen.',
    insight: 'De to midterste måtte bli 16 til sammen. Det fins mange par som gjør det — 7 og 9, 8 og 8, 6 og 10.',
    hints: [
      'Med seks tall er medianen gjennomsnittet av de to midterste.',
      'De to midterste må bli 16 til sammen. Ytterpunktene må ligge 10 fra hverandre.',
      'Medianen din er {median}, bredden {bredde}.',
    ],
    note: 'Gjentar partallsmedianen fra 2-10, nå uten låste tall som hjelp. Spilleren må selv holde orden på hvilke to tall som havner i midten.',
  },
  {
    id: '3-10', level: 3,
    values: { count: 6, min: 0, max: 20, integersOnly: true },
    requirements: { mean: 10, median: 9 },
    start: [5, 5, 5, 5, 5, 5],
    reference: [3, 7, 8, 10, 14, 18],
    teachingGoal: 'Gjennomsnitt og median kan ligge nær hverandre uten å være like, og avstanden forteller om fordelingen.',
    insight: 'Ett høyt tall var nok til å løfte gjennomsnittet over medianen, selv om de fleste tallene lå lavt.',
    hints: [
      'Summen må bli 60, og de to midterste tallene 18 til sammen.',
      'Gjennomsnittet skal ligge litt over medianen. Ett stort tall gjør jobben.',
      'Gjennomsnittet er {gjennomsnitt}, medianen {median}, summen {sum}.',
    ],
    note: 'Nivåets sluttoppgave: samme ideer som 3-03, men med seks tall, partallsmedian og større tallområde. Alt spilleren har lært på nivået må brukes samtidig.',
  },

  /* ══════════════════ NIVÅ 4 ══════════════════
     To mål og betingelser i tillegg. Betingelsene er ikke pynt: hver
     av dem stenger en enkel vei spilleren ville tatt uten dem, og
     tvinger fram et resonnement i stedet. Her introduseres også de
     mer spesielle betingelsene — alle ulike, nøyaktig antall
     forekomster og fast antall ulike verdier. */

  {
    id: '4-01', level: 4,
    values: { count: 4, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, range: 8 },
    constraints: { mustInclude: [3] },
    start: [5, 5, 5, 5],
    reference: [3, 4, 6, 11],
    teachingGoal: 'Et påkrevd tall må plasseres i forhold til både summen og ytterpunktene.',
    insight: 'Treeren måtte ta stilling til to ting samtidig: hvor den ligger i spennet, og hvor mye den bidrar til summen.',
    hints: [
      'Summen skal bli 24, og bredden 8. Firen er lav — hvor passer den?',
      'Lar du 3 være det minste tallet, må det største bli 11.',
      'Summen din er {sum}, bredden {bredde}.',
    ],
    note: 'Mildeste starten på nivået: to mål spilleren kjenner, og en betingelse av den typen hen møtte på nivå 2.',
  },
  {
    id: '4-02', level: 4,
    values: { count: 4, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 7, median: 7 },
    constraints: { mustNotInclude: [7] },
    start: [5, 5, 5, 5],
    reference: [4, 6, 8, 10],
    teachingGoal: 'Medianen kan være en verdi som ikke finnes i datasettet.',
    insight: 'Ingen av tallene dine er 7, men både gjennomsnittet og medianen er det. Begge er utregnede verdier — ikke verdier som må stå på en brikke.',
    hints: [
      'Verken gjennomsnittet eller medianen trenger å finnes blant tallene.',
      'De to midterste må bli 14 til sammen — for eksempel 6 og 8.',
      'Medianen din er {median}, gjennomsnittet {gjennomsnitt}.',
    ],
    note: 'Bygger videre på 2-06 (gjennomsnitt trenger ikke finnes) og utvider poenget til medianen. Krever partall antall tall — derfor fire, ikke fem.',
  },
  {
    id: '4-03', level: 4,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mode: 3, range: 9 },
    lockedValues: [{ position: 0, value: 3 }],
    start: [3, 5, 5, 5, 5],
    reference: [3, 3, 5, 8, 12],
    teachingGoal: 'Et låst tall kan gi et forsprang på ett mål, men ikke på et annet.',
    insight: 'Den låste treeren ga deg halve typetallet gratis. Bredden måtte du bygge helt selv.',
    hints: [
      'Treeren er allerede på plass. Hvor mange treere trenger du for å få typetall 3?',
      'To treere holder til typetallet. Så må ytterpunktene ligge 9 fra hverandre.',
      'Typetallet ditt er {typetall}, bredden {bredde}.',
    ],
    note: 'Låst tall og typetall spiller sammen for første gang. Startsettet gir spilleren et typetall som er feil, så hen må rive før hen bygger.',
  },
  {
    id: '4-04', level: 4,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 8, median: 6 },
    constraints: { minValue: 2 },
    start: [4, 4, 4, 4, 4],
    reference: [5, 6, 6, 11, 12],
    teachingGoal: 'En nedre grense kan gjøre et ellers lett krav stramt, fordi tallene under medianen ikke kan bli små nok.',
    insight: 'Gjennomsnittet skulle ligge godt over medianen. Uten muligheten til å legge tallene helt i bunnen måtte de to øverste bli svært høye.',
    hints: [
      'Summen skal bli 40, men medianen bare 6. Hvor må de store tallene ligge?',
      'De to laveste tallene kan ikke gå under 2, og de to midterste kan ikke gå over 6. Da er det de to øverste som må dra opp summen.',
      'Gjennomsnittet er {gjennomsnitt}, medianen {median}, summen {sum}.',
    ],
    note: 'Første oppgave der en betingelse gjør løsningsrommet virkelig trangt. Spilleren må regne, ikke prøve seg fram — overgangen til nivå 5-tenkning.',
  },
  {
    id: '4-05', level: 4,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { median: 9, range: 10 },
    constraints: { allUnique: true },
    start: [6, 6, 6, 6, 6],
    reference: [1, 5, 9, 10, 11],
    teachingGoal: 'Kravet om at alle tall skal være ulike stenger den enkleste løsningen: å gjenta samme tall.',
    insight: 'Uten gjentakelser måtte alle fem tallene finne hver sin plass. Det er ofte lettere å oppdage hva et krav egentlig betyr når snarveien er stengt.',
    hints: [
      'Ingen tall kan gå igjen. Medianen må likevel være det tredje tallet.',
      'To ulike tall under 9, to ulike over — og ytterpunktene 10 fra hverandre.',
      'Tallene dine er {tallene}, medianen {median}.',
    ],
    note: 'Introduserer allUnique. Startsettet bryter betingelsen med vilje, slik at regelen blir tydelig med én gang.',
  },
  {
    id: '4-06', level: 4,
    values: { count: 6, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 7, mode: 5 },
    constraints: { mustInclude: [12] },
    start: [4, 4, 4, 4, 4, 4],
    reference: [2, 5, 5, 8, 10, 12],
    teachingGoal: 'Typetallet og gjennomsnittet trekker ofte i hver sin retning.',
    insight: 'Typetallet ditt er 5, men gjennomsnittet er 7. Den vanligste verdien er ikke nødvendigvis den som beskriver settet best.',
    hints: [
      'Summen må bli 42, og 12 må være med.',
      'To femmere gir typetallet. De er lave, så de andre tallene må dra summen opp.',
      'Typetallet er {typetall}, gjennomsnittet {gjennomsnitt}.',
    ],
    note: 'Her møter spilleren for første gang at to sentralmål peker på ulike tall i samme datasett. Det er forberedelsen til hele nivå 5.',
  },
  {
    id: '4-07', level: 4,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, range: 8 },
    constraints: { occurrences: { 4: 2 } },
    start: [6, 6, 6, 6, 6],
    reference: [2, 4, 4, 10, 10],
    teachingGoal: 'Nøyaktig antall forekomster er et sterkere krav enn «må inneholde»: to firere, verken flere eller færre.',
    insight: 'To av fem plasser var bestemt på forhånd. Da måtte de tre siste tallene ordne både summen og bredden alene.',
    hints: [
      'Nøyaktig to av tallene skal være 4. Ikke én, ikke tre.',
      'De to firerne gir 8 av summen på 30. De tre andre må bli 22, og ytterpunktene må ligge 8 fra hverandre.',
      'Summen din er {sum}, bredden {bredde}.',
    ],
    note: 'Introduserer occurrences. Kravet om nøyaktig antall er lett å bryte ved uhell, og det gjør at spilleren må holde øye med hele settet mens hen justerer.',
  },
  {
    id: '4-08', level: 4,
    values: { count: 6, min: 0, max: 20, integersOnly: true },
    requirements: { mean: 8, median: 6 },
    constraints: { maxValue: 15 },
    start: [8, 8, 8, 8, 8, 8],
    reference: [2, 4, 5, 7, 15, 15],
    teachingGoal: 'Et tak på verdiene begrenser hvor mye et enkelt tall kan dra gjennomsnittet opp.',
    insight: 'Med tak på 15 kunne ingen enkelt uteligger gjøre jobben alene. Du trengte to høye tall for å løfte gjennomsnittet over medianen.',
    hints: [
      'Summen skal bli 48, men medianen bare 6. Ingen tall får være over 15.',
      'De to midterste må bli 12 til sammen. Resten av summen må komme fra de to øverste.',
      'Gjennomsnittet er {gjennomsnitt}, medianen {median}, største tall {storste}.',
    ],
    note: 'Speilbildet av 4-04: nå er det taket, ikke gulvet, som strammer inn. Sammen viser de to hvordan grenser på verdiene former hva som er mulig.',
  },
  {
    id: '4-09', level: 4,
    values: { count: 6, min: 0, max: 12, integersOnly: true },
    requirements: { median: 7, mode: 7 },
    constraints: { exactDistinctValues: 3 },
    start: [5, 5, 5, 5, 5, 5],
    reference: [3, 7, 7, 7, 9, 9],
    teachingGoal: 'Med bare tre ulike verdier må hver verdi brukes bevisst.',
    insight: 'Tre verdier fordelt på seks plasser: du måtte bestemme både hvilke tall som skulle være med, og hvor mange ganger hvert av dem skulle gå igjen.',
    hints: [
      'Nøyaktig tre ulike verdier. Sjuere må gå igjen oftere enn de andre.',
      'Tre sjuere gir både typetallet og midten. Da har du tre plasser igjen på to andre verdier.',
      'Du har brukt {tallene}. Typetallet er {typetall}, medianen {median}.',
    ],
    note: 'Introduserer exactDistinctValues, den betingelsen som ligner mest på et puslespill. Den passer sammen med typetall, fordi begge handler om hvor mange ganger verdier går igjen.',
  },
  {
    id: '4-10', level: 4,
    values: { count: 6, min: 0, max: 20, integersOnly: true },
    requirements: { mean: 9, range: 14 },
    constraints: { mustInclude: [19] },
    lockedValues: [{ position: 0, value: 5 }],
    start: [5, 5, 5, 5, 5, 5],
    reference: [5, 5, 7, 8, 10, 19],
    teachingGoal: 'Når både et låst tall og et påkrevd tall er ytterpunkter, er hele spennet bestemt før du begynner.',
    insight: 'Femmeren og nitten låste både bunnen og toppen. Da var bredden gitt, og alt arbeidet lå i å få summen til å stemme innenfor spennet.',
    hints: [
      'Nitten må være med, og femmeren er låst. Hva blir bredden da?',
      'Er 19 største tall og 5 minste, er bredden allerede 14. Da må ingen tall gå under 5 eller over 19 — og summen må bli 54.',
      'Bredden din er {bredde}, summen {sum} av {malsum}.',
    ],
    note: 'Nivåets sluttoppgave. Alle betingelsestypene spilleren har møtt er i spill samtidig, og det store tallet 19 tvinger fram regning med avvik fra gjennomsnittet.',
  },

  /* ══════════════════ NIVÅ 5 ══════════════════
     Tre eller flere krav samtidig. Nå holder det ikke å vite hva
     hvert mål betyr — spilleren må vite hvilke mål som lar seg
     flytte uten å ødelegge de andre, og i hvilken rekkefølge det
     lønner seg å jobbe. Oppgavene er lagt slik at rekkefølgen
     «median først, så bredde, så sum» vokser fram av seg selv. */

  {
    id: '5-01', level: 5,
    values: { count: 4, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, median: 6, range: 8 },
    start: [6, 6, 6, 6],
    reference: [2, 4, 8, 10],
    teachingGoal: 'Tre mål kan oppfylles samtidig når de styres av ulike deler av datasettet.',
    insight: 'De to midterste tallene ga medianen, ytterpunktene ga bredden, og summen fulgte med fordi settet var symmetrisk.',
    hints: [
      'To av målene er allerede riktige. Hvilket er det ikke?',
      'Behold symmetrien rundt 6, og flytt tallene like langt ut på hver side.',
      'Gjennomsnitt {gjennomsnitt}, median {median}, bredde {bredde}.',
    ],
    note: 'Mykt førstemøte med tre krav: startsettet oppfyller to av dem, og den symmetriske løsningen holder alle tre på plass samtidig. Spilleren får se at målene kan samarbeide.',
  },
  {
    id: '5-02', level: 5,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, median: 6, range: 8 },
    start: [6, 6, 6, 6, 6],
    reference: [2, 4, 6, 8, 10],
    teachingGoal: 'Med oddetall antall tall må medianen faktisk være et av tallene, samtidig som summen og bredden stemmer.',
    insight: 'Med fem tall måtte 6 stå der selv. Rundt den kunne du legge tallene parvis, like langt over som under.',
    hints: [
      'Sett det midterste tallet til 6 først, og bygg rundt det.',
      'Legg tallene i par: like mye over 6 som under. Da holder summen seg mens du sprer settet.',
      'Median {median}, bredde {bredde}, sum {sum} av {malsum}.',
    ],
    note: 'Samme tre krav som 5-01, men med oddetall antall. Forskjellen fra forrige oppgave er hele poenget: nå er medianen en brikke, ikke et regnestykke.',
  },
  {
    id: '5-03', level: 5,
    values: { count: 5, min: 0, max: 14, integersOnly: true },
    requirements: { mean: 7, median: 6, mode: 4 },
    start: [6, 6, 6, 6, 6],
    reference: [4, 4, 6, 9, 12],
    teachingGoal: 'De tre sentralmålene kan peke på tre helt forskjellige tall i samme datasett.',
    insight: 'Typetall 4, median 6, gjennomsnitt 7. Tre mål som alle skal beskrive «det typiske tallet» — og de gir tre forskjellige svar.',
    hints: [
      'Typetallet skal være 4, men medianen 6 og gjennomsnittet 7. Hvor må firerne ligge?',
      'To firere under midten gir typetallet. Da må de to tallene over midten dra summen opp til 35.',
      'Typetall {typetall}, median {median}, gjennomsnitt {gjennomsnitt}.',
    ],
    note: 'Den faglig viktigste oppgaven på nivået, og grunnen til at typetall er med i spillet. At de tre sentralmålene kan sprike, er innsikten hele statistikkforståelsen hviler på.',
  },
  {
    id: '5-04', level: 5,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 7, median: 6, range: 10 },
    start: [7, 7, 7, 7, 7],
    reference: [2, 3, 6, 12, 12],
    teachingGoal: 'Når gjennomsnittet skal ligge over medianen og spredningen er stor, må de høye tallene ligge helt i toppen.',
    insight: 'Medianen holdt seg lav mens de to største tallene dro gjennomsnittet opp. Det er den klassiske høyreskjeve fordelingen.',
    hints: [
      'Medianen skal være lavere enn gjennomsnittet, og bredden er stor.',
      'Tre av tallene må være 6 eller lavere. Da må de to øverste alene stå for det meste av summen på 35.',
      'Median {median}, gjennomsnitt {gjennomsnitt}, bredde {bredde}.',
    ],
    note: 'Kombinerer skjevfordelingen fra 3-03 med et bredde-krav. Løsningsrommet er trangt nok til at spilleren må regne ut hva de to øverste tallene må bli.',
  },
  {
    id: '5-05', level: 5,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { median: 8, mode: 8, range: 9 },
    constraints: { mustInclude: [3] },
    start: [8, 8, 8, 8, 8],
    reference: [3, 8, 8, 9, 12],
    teachingGoal: 'Et lavt påkrevd tall kan bestemme hele spennet når bredden også er gitt.',
    insight: 'Treeren måtte bli det minste tallet. Da var det største bestemt av bredden, og du hadde bare tallene i midten igjen å styre med.',
    hints: [
      'Treeren må være med, og bredden skal være 9.',
      'Er 3 det minste tallet, må det største bli 12. Mellom dem trenger du åtterne.',
      'Minste {minste}, største {storste}, typetall {typetall}.',
    ],
    note: 'Startsettet oppfyller to av tre mål og bryter betingelsen. Det tvinger fram spørsmålet «hva kan jeg endre uten å miste det jeg har?» — kjernen i nivået.',
  },
  {
    id: '5-06', level: 5,
    values: { count: 6, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 7, median: 7, range: 10 },
    start: [7, 7, 7, 7, 7, 7],
    reference: [1, 5, 7, 7, 11, 11],
    teachingGoal: 'Med seks tall må de to midterste summere til det dobbelte av medianen, samtidig som summen og bredden stemmer.',
    insight: 'Du hadde tre ting å passe på samtidig: paret i midten, ytterpunktene og totalsummen. De fire tallene som ikke er ytterpunkter, gjorde mesteparten av jobben.',
    hints: [
      'De to midterste må bli 14 til sammen, og summen skal bli 42.',
      'Sett midtparet først, så ytterpunktene 10 fra hverandre, og juster til slutt summen med tallene imellom.',
      'Median {median}, bredde {bredde}, sum {sum} av {malsum}.',
    ],
    note: 'Her introduseres arbeidsrekkefølgen eksplisitt i hintet: median, så bredde, så sum. Det er strategien spilleren trenger for resten av kampanjen.',
  },
  {
    id: '5-07', level: 5,
    values: { count: 6, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 7, median: 6, mode: 5 },
    constraints: { minValue: 2 },
    start: [6, 6, 6, 6, 6, 6],
    reference: [5, 5, 5, 7, 9, 11],
    teachingGoal: 'Typetall, median og gjennomsnitt kan ligge tett — og likevel være tre ulike tall.',
    insight: 'Typetall 5, median 6, gjennomsnitt 7. Sentralmålene ligger side om side, men peker på hver sin verdi. Hvilket av dem er «det typiske tallet»?',
    hints: [
      'Femmerne må gå igjen oftest, men medianen skal likevel bli 6.',
      'Tre femmere under midten flytter medianen ned til 6 hvis det fjerde tallet er 7. Da må de to største dra summen opp til 42.',
      'Typetall {typetall}, median {median}, gjennomsnitt {gjennomsnitt}.',
    ],
    note: 'Fortsetter poenget fra 5-03, men nå ligger de tre målene tett i tett. Det gjør spørsmålet skarpere: nærhet betyr ikke at målene måler det samme.',
  },
  {
    id: '5-08', level: 5,
    values: { count: 5, min: 0, max: 14, integersOnly: true },
    requirements: { mean: 9, median: 9, range: 8 },
    constraints: { allUnique: true },
    start: [9, 9, 9, 9, 9],
    reference: [5, 8, 9, 10, 13],
    teachingGoal: 'Symmetrisk fordeling gir like verdier for gjennomsnitt og median — også når alle tallene er forskjellige.',
    insight: 'Alle tallene var ulike, men de lå symmetrisk rundt 9. Derfor havnet gjennomsnittet og medianen på samme sted.',
    hints: [
      'Ingen tall kan gå igjen, men midten skal likevel bli 9.',
      'Legg tallene i par rundt 9 med ulik avstand: 9−1 og 9+1, 9−4 og 9+4.',
      'Median {median}, gjennomsnitt {gjennomsnitt}, bredde {bredde}.',
    ],
    note: 'Symmetri uten gjentakelser. Startsettet oppfyller to mål på den enkleste tenkelige måten — fem like tall — og betingelsen river den løsningen bort.',
  },
  {
    id: '5-09', level: 5,
    values: { count: 6, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, median: 5, mode: 4 },
    constraints: { mustInclude: [12] },
    start: [6, 6, 6, 6, 6, 6],
    reference: [4, 4, 4, 6, 6, 12],
    teachingGoal: 'En uteligger kan holde gjennomsnittet oppe mens både median og typetall blir liggende lavt.',
    insight: 'Fem av seks tall ligger på 6 eller lavere, men gjennomsnittet er 6. Tolveren alene løfter det — og verken medianen eller typetallet merker det.',
    hints: [
      'Tolveren må være med, og den er mye større enn de andre målene.',
      'Firerne må gå igjen oftest, medianen skal bli 5, og tolveren drar summen opp til 36.',
      'Typetall {typetall}, median {median}, gjennomsnitt {gjennomsnitt}.',
    ],
    note: 'Uteliggeren settes på spissen: den er påkrevd, og den er den eneste grunnen til at gjennomsnittet når målet. Dette er argumentet for hvorfor medianen ofte brukes i stedet.',
  },
  {
    id: '5-10', level: 5,
    values: { count: 6, min: 0, max: 20, integersOnly: true },
    requirements: { mean: 10, median: 9, range: 16 },
    lockedValues: [{ position: 0, value: 4 }],
    start: [4, 10, 10, 10, 10, 10],
    reference: [4, 8, 8, 10, 10, 20],
    teachingGoal: 'Et låst ytterpunkt bestemmer hele spennet når bredden er gitt.',
    insight: 'Den låste firen ble det minste tallet, og bredden på 16 satte det største til 20. Alt det andre arbeidet skjedde mellom de to.',
    hints: [
      'Firen er låst. Hvis den er det minste tallet, hvor må det største ligge?',
      'Med minste tall 4 og bredde 16 må største tall være 20. De to midterste må bli 18 til sammen, og summen 60.',
      'Bredde {bredde}, median {median}, sum {sum} av {malsum}.',
    ],
    note: 'Nivåets sluttoppgave, og en full gjennomkjøring av arbeidsrekkefølgen fra 5-06 med låst tall og stort tallområde. Etter denne skal spilleren kunne planlegge et datasett før hen begynner å trykke.',
  },

  /* ══════════════════ NIVÅ 6 ══════════════════
     Ekspertoppgaver. Tre nye ting skjer her: noen oppgaver krever
     flere ulike løsninger, noen har bare én eneste løsning, og noen
     kan ikke løses i det hele tatt. Det siste er den viktigste
     nyheten — å avgjøre om et krav lar seg oppfylle er en annen og
     vanskeligere ferdighet enn å oppfylle det. På dette nivået kan
     spilleren svare «umulig». */

  {
    id: '6-01', level: 6,
    values: { count: 4, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, median: 6 },
    requiredSolutions: 2,
    start: [4, 4, 4, 4],
    reference: [2, 5, 7, 10],
    teachingGoal: 'Samme krav kan oppfylles av mange forskjellige datasett.',
    insight: 'To ulike datasett, samme gjennomsnitt og samme median. Sentralmålene forteller altså ikke hvilke tall som lå bak.',
    hints: [
      'Finn én løsning først. Så skal du finne en til som er forskjellig.',
      'Bytt ut ytterpunktene: flytt like mye ned på det ene som opp på det andre, så holder summen seg.',
      'Du har funnet {antall} tall i settet ditt — sum {sum} av {malsum}.',
    ],
    note: 'Første oppgave med krav om flere løsninger, og med vilje et løst krav. Poenget er ikke å streve, men å oppdage at løsningen ikke er entydig — det gjør neste oppgave overraskende.',
  },
  {
    id: '6-02', level: 6,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { median: 7, range: 8 },
    constraints: { mustInclude: [4] },
    requiredSolutions: 2,
    start: [7, 7, 7, 7, 7],
    reference: [4, 6, 7, 8, 12],
    teachingGoal: 'Et påkrevd tall kan ha flere mulige plasser i datasettet, og hver plass gir sin egen familie av løsninger.',
    insight: 'Firen kan være det minste tallet — eller ligge et stykke opp fra bunnen. To ulike valg, to ulike løsninger.',
    hints: [
      'Firen må være med, men den behøver ikke være det minste tallet.',
      'Prøv først med 4 som minste tall. Prøv så en løsning der et tall er mindre enn 4.',
      'Minste tall {minste}, største {storste}, median {median}.',
    ],
    note: 'Oppgaven som ble brukt som eksempel da spillet ble spesifisert. Her fungerer den som den andre flerløsningsoppgaven, der de to løsningene må være strukturelt ulike — ikke bare små justeringer av samme idé.',
  },
  {
    id: '6-03', level: 6,
    values: { count: 4, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, median: 4 },
    start: [6, 6, 6, 6],
    reference: [4, 4, 4, 12],
    teachingGoal: 'Noen kombinasjoner av krav har bare én eneste løsning.',
    insight: 'Det finnes nøyaktig ett datasett som klarer dette. Jo lenger gjennomsnittet ligger fra medianen, jo mindre rom er det igjen å bevege seg i.',
    hints: [
      'Gjennomsnittet skal ligge 2 over medianen. Hvor mye må det største tallet dra?',
      'De to midterste må bli 8 til sammen. Med tak på 12 er det bare én måte å få summen opp i 24 på.',
      'Median {median}, gjennomsnitt {gjennomsnitt}, største tall {storste}.',
    ],
    note: 'Rett etter to oppgaver med flere løsninger kommer den motsatte ytterligheten. Kontrasten er poenget: løsningsrommet kan være stort eller bestå av ett eneste sett, og kravene ser like uskyldige ut.',
  },
  {
    id: '6-04', level: 6,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 3, median: 8 },
    impossible: true,
    start: [6, 6, 6, 6, 6],
    teachingGoal: 'Median og gjennomsnitt kan stille krav som utelukker hverandre.',
    insight: 'Median 8 betyr at tre av tallene er minst 8. Bare de tre blir 24, mens hele summen skulle vært 15. Det finnes ikke noe datasett som klarer begge deler.',
    hints: [
      'Regn ut hva medianen krever av tallene over midten, og hva gjennomsnittet krever av summen.',
      'Median 8 tvinger tre av tallene opp på minst 8 — det er 24 alene. Gjennomsnitt 3 gir sum 15.',
      'Summen din er {sum}, og målet er {malsum}. Medianen er {median}.',
    ],
    note: 'Første umulige oppgave. Den er valgt fordi motsetningen kan regnes ut eksakt på to linjer — spilleren skal kunne bevise umuligheten, ikke bare gi opp og gjette.',
  },
  {
    id: '6-05', level: 6,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mode: 5 },
    constraints: { allUnique: true },
    impossible: true,
    start: [5, 5, 5, 5, 5],
    teachingGoal: 'Et typetall forutsetter at en verdi gjentas — det er uforenlig med at alle tall skal være ulike.',
    insight: 'Typetallet er den verdien som går igjen oftest. Skal alle tallene være ulike, går ingen verdi igjen, og da finnes det ikke noe typetall å kreve.',
    hints: [
      'Hva må til for at en verdi skal bli typetall?',
      'Typetallet må forekomme oftere enn alle andre. Kan det skje når ingen verdi får gjentas?',
      'Tallene dine er {tallene}, og typetallet er {typetall}.',
    ],
    note: 'Den andre umulige oppgaven er umulig av en helt annen grunn enn den første: her er det definisjonen av typetall som kolliderer med betingelsen, ikke et regnestykke. Spilleren skal ikke kunne kjenne igjen umulighet på formen.',
  },
  {
    id: '6-06', level: 6,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, median: 6, mode: 'ingen' },
    start: [6, 6, 6, 6, 6],
    reference: [2, 2, 6, 10, 10],
    teachingGoal: 'Et datasett har bare typetall dersom én verdi forekommer oftere enn alle andre.',
    insight: 'To toere og to tiere: ingen verdi er alene om å være vanligst, og da har datasettet ikke noe typetall i det hele tatt.',
    hints: [
      'Denne gangen skal datasettet ikke ha noe typetall.',
      'Enten lar du alle tallene være ulike, eller så lar du to verdier gå igjen like mange ganger.',
      'Typetallet ditt er nå {typetall}.',
    ],
    note: 'Gjør regelen fra 1-09 til et mål i seg selv. Løsningen der to verdier står likt er den mest lærerike, og hintene peker på begge veier fram.',
  },
  {
    id: '6-07', level: 6,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, mode: 4 },
    requiredSolutions: 3,
    start: [6, 6, 6, 6, 6],
    reference: [4, 4, 4, 6, 12],
    teachingGoal: 'Antallet gjentakelser av typetallet kan varieres fritt, så lenge det er flest.',
    insight: 'To firere, tre firere, fire firere — alle gir typetall 4. Antallet plasser du bruker på typetallet, bestemmer hvor mye du har igjen å styre summen med.',
    hints: [
      'Tre ulike løsninger. Prøv å variere hvor mange firere du bruker.',
      'Med to firere har du tre tall igjen til å nå sum 30. Med tre firere har du bare to.',
      'Du har {typetall} som typetall, og summen er {sum} av {malsum}.',
    ],
    note: 'Tre løsninger, og hintet styrer spilleren mot å variere strukturen i stedet for å flikke på tall. Det er forskjellen mellom å finne tre løsninger og å forstå løsningsrommet.',
  },
  {
    id: '6-08', level: 6,
    values: { count: 6, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 6, median: 6, range: 12 },
    constraints: { exactDistinctValues: 3 },
    start: [6, 6, 6, 6, 6, 6],
    reference: [0, 0, 6, 6, 12, 12],
    teachingGoal: 'Maksimal spredning og et fast antall verdier låser datasettet nesten helt.',
    insight: 'Bredde 12 tvang fram både 0 og 12. Med bare tre ulike verdier og krav om at midten skal bli 6, var det nesten ingenting igjen å velge.',
    hints: [
      'Bredden er så stor som tallområdet tillater. Hvilke to tall må da være med?',
      'Både 0 og 12 må være med, og du har bare én verdi igjen å bruke på de fire andre plassene.',
      'Bredde {bredde}, median {median}, sum {sum} av {malsum}.',
    ],
    note: 'Den strammeste oppgaven som fortsatt kan resonneres fram uten prøving. Den viser hvordan flere krav til sammen kan gjøre løsningsrommet nesten tomt, uten at noe enkeltkrav ser strengt ut.',
  },
  {
    id: '6-09', level: 6,
    values: { count: 5, min: 0, max: 12, integersOnly: true },
    requirements: { mean: 12 },
    constraints: { mustInclude: [4] },
    impossible: true,
    start: [6, 6, 6, 6, 6],
    teachingGoal: 'Når gjennomsnittet er lik den høyeste tillatte verdien, må alle tallene ligge på maksimum.',
    insight: 'Gjennomsnitt 12 krever sum 60, og fem tall som maksimalt er 12 blir akkurat 60 — men bare hvis alle er 12. Da er det ingen plass til en firer.',
    hints: [
      'Hva er den største summen fem tall kan ha her?',
      'Gjennomsnitt 12 krever sum 60. Det er nøyaktig den største summen som er mulig — og den finnes bare på én måte.',
      'Summen din er {sum} av {malsum}, og største tall er {storste}.',
    ],
    note: 'Den tredje umulige oppgaven, og den mest lumske: kravet er i seg selv oppnåelig, det er kombinasjonen med det påkrevde tallet som velter det. Plassert sent, når spilleren har lært å regne på grenser.',
  },
  {
    id: '6-10', level: 6,
    values: { count: 6, min: 0, max: 20, integersOnly: true },
    requirements: { mean: 10, median: 9, mode: 8, range: 15 },
    start: [10, 10, 10, 10, 10, 10],
    reference: [3, 8, 8, 10, 13, 18],
    teachingGoal: 'Alle fire målene kan settes samtidig — og de peker fortsatt på fire forskjellige tall.',
    insight: 'Typetall 8, median 9, gjennomsnitt 10, bredde 15. Fire tall som alle beskriver det samme datasettet, og ingen av dem forteller hele historien alene.',
    hints: [
      'Ta ett mål om gangen: typetallet først, så medianen, så bredden, og juster summen til slutt.',
      'To åttere gir typetallet. Ligger den ene av dem i midten sammen med en tier, blir medianen 9.',
      'Typetall {typetall}, median {median}, gjennomsnitt {gjennomsnitt}, bredde {bredde}.',
    ],
    note: 'Kampanjens siste oppgave. Alle fire målene samtidig, i det største tallområdet. Kravene til sammen har bare tre løsninger, så oppgaven må planlegges — den kan ikke prøves fram. Den skal kunne løses av en spiller som har arbeidsrekkefølgen fra nivå 5 i fingrene — og oppsummerer hele spillets poeng: sentralmålene beskriver ulike sider av samme datasett.',
  },
];

/* --- oppslag ------------------------------------------------- */

export const LEVELS = [1, 2, 3, 4, 5, 6];

export const LEVEL_TITLES = {
  1: 'Ett mål',
  2: 'Mål og betingelse',
  3: 'To mål',
  4: 'To mål og betingelser',
  5: 'Tre eller flere krav',
  6: 'Ekspert',
};

export const LEVEL_BLURBS = {
  1: 'Ett statistisk mål om gangen: gjennomsnitt, median, typetall og variasjonsbredde.',
  2: 'Samme mål, men nå med et tall som må være med, eller et som ikke kan endres.',
  3: 'To mål samtidig. Nå må du holde det ene i hevd mens du jobber med det andre.',
  4: 'To mål og betingelser i tillegg. De enkleste veiene er stengt.',
  5: 'Tre eller flere krav. Her lønner det seg å planlegge før du trykker.',
  6: 'Flere løsninger, stramme krav — og oppgaver som ikke kan løses i det hele tatt.',
};

export function challengesForLevel(level) {
  return CAMPAIGN.filter((challenge) => challenge.level === level);
}

export function findChallenge(id) {
  return CAMPAIGN.find((challenge) => challenge.id === id) || null;
}
