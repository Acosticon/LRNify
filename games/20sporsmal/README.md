# 20 spørsmål

En generell spørre-/klassifiseringsmotor for læring, bygget som klassisk
"20 spørsmål". Motoren vet ingenting om noe fag — all kunnskap ligger i
innholdspakker under `content/`. Første pakke: **Naturfag → Celler** (27
begreper).

## Spillmoduser

- **Spillet gjetter** (`js/modeA.js`) — eleven tenker på et begrep, svarer
  Ja/Nei/Vet ikke, og spillet gjetter når det er sikkert nok.
- **Jeg gjetter** (`js/modeB.js`) — spillet velger et hemmelig begrep,
  eleven velger spørsmål fra en dynamisk liste over de mest informative
  spørsmålene, og prøver å gjette begrepet.

## Arkitektur

```
games/20sporsmal/
  index.html               UI-skjelett (start, modus A, modus B)
  css/style.css             all styling
  js/
    engine.js                SPILLMOTOREN — ingen fagkunnskap, bare
                              kandidater/egenskaper/spørsmål/score/entropi
    modeA.js                 tilstandsmaskin for "spillet gjetter"
    modeB.js                 tilstandsmaskin for "jeg gjetter"
    ui.js                    DOM-rendering, kobler UI til modeA/modeB
    main.js                  oppstart: laster tema fra manifestet
  content-manifest.js        registrerer fag → tema → content-pakke
  content/
    science/
      cells/
        properties.js         egenskaper (dokumentasjon/debug)
        questions.js           spørsmålsbank (ett spørsmål → én property)
        concepts.js             de 27 begrepene med full egenskapsmatrise
        index.js                pakkens offentlige kontrakt
  qa/
    simulate.mjs              "perfekt elev"-simulator + robusthetstest
```

Motoren (`engine.js`) opererer bare på generiske data:

```js
{ id, name, definition, topicIds, properties: { <propertyId>: true|false|null } }
{ id, text, property }              // spørsmål
```

`null` betyr eksplisitt "gir ikke mening for dette begrepet" — helt
forskjellig fra `false`. Motoren bruker dette til å ikke straffe eller
belønne kandidater der spørsmålet rett og slett ikke passer (se f.eks.
`ORGANELL.requires_membrane` eller `STAMCELLE.found_in_plant_cell` i
`concepts.js`).

### Hvordan motoren velger spørsmål og gjetter

- **Score:** treff `+1`, bom `-1`, `null`/"vet ikke" `0` (ingen endring).
- **Konfidens** (0–1): andel treff blant de spørsmålene som faktisk var
  relevante for kandidaten (`Engine.getConfidence`).
- **Neste spørsmål:** entropi over hvor godt spørsmålet splitter de mest
  sannsynlige kandidatene, multiplisert med andelen kandidater som faktisk
  har et definitivt (ikke-null) svar på akkurat det spørsmålet
  (`Engine.scoreQuestion`/`selectNextQuestion`). Det straffer automatisk
  spørsmål der de fleste kandidatene har `null`.
- **Når skal spillet gjette:** når toppkandidaten har konfidens over en
  terskel OG et klart forsprang til nummer to, eller når maks antall
  spørsmål er nådd (`Engine.shouldGuess`, se `DEFAULT_OPTIONS`).

Modus B bruker i tillegg `Engine.getConsistentCandidates` — siden spillets
egne svar der alltid er fasit (aldri feil), kan vi telle "hvor mange
begreper er fortsatt 100 % konsistente" nøyaktig, i stedet for den
feiltolerante score-modellen i modus A.

## Legge til et nytt fag eller tema

1. Lag en ny mappe under `content/<fag>/<tema>/` med `properties.js`,
   `questions.js`, `concepts.js` og en `index.js` som re-eksporterer
   `subjectId, subjectName, topicId, topicName, properties, concepts,
   questions` — bruk `content/science/cells/index.js` som mal.
2. Registrer temaet i `content-manifest.js`, under riktig fag (eller som
   et helt nytt fag), med en `load()`-funksjon som gjør en dynamisk
   `import()` av `index.js`-fila.
3. Kjør `node games/20sporsmal/qa/simulate.mjs` — bytt import-stien
   øverst i fila til det nye temaets `index.js` (eller kopier fila til
   f.eks. `qa/simulate-<tema>.mjs`) og kontroller at alle begreper
   identifiseres og at ingen har identisk egenskapsprofil.
4. Ingen endringer trengs i `engine.js`, `modeA.js`, `modeB.js` eller
   `ui.js` — de er allerede generelle.

For MVP-en velger `main.js` automatisk det første faget/temaet i
manifestet. Så snart det finnes mer enn ett tema, er neste steg å bygge et
enkelt temavalg-skjermbilde i UI-et (list opp `MANIFEST`, la eleven velge)
— bevisst utelatt nå for å unngå å bygge en velger for én ting.

## Kjøre "perfekt elev"-simulatoren

```
node games/20sporsmal/qa/simulate.mjs
```

Simulerer at en elev tenker på hvert av de 27 begrepene og svarer 100 %
ærlig ut fra fasitdataene (egenskaper som er `null` for begrepet besvares
"vet ikke"). Kontrollerer at:

- alle 27 begreper til slutt blir riktig gjettet
- ingen to begreper har helt identisk egenskapsprofil (ville gjort dem
  umulig å skille)
- motoren tåler ett bevisst feilsvar tidlig i runden (kjøres for hvert
  begrep, med feilen plassert på spørsmål 0–7)

Siste kjøring: 27/27 riktig, snitt ≈ 9 spørsmål per runde, 85 % av
rundene endte likevel riktig med ett tidlig feilsvar.

## Debug-panel

Kryss av "🐛 Debug" øverst til høyre før du starter en runde. Viser
kandidatrangering med konfidens/score (modus A) eller konsistente
kandidater (modus B), pluss neste foreslåtte spørsmål og dets beregnede
information gain. Ikke ment for elever — helt greit at det ser teknisk ut.

## Kjente svakheter / bevisste forenklinger

- **Fagstoff er forenklet noen steder for ungdomsskolenivå**, f.eks.:
  fotosyntese hos cyanobakterier (prokaryoter) er utelatt —
  `found_in_prokaryotes` er satt til `false` for FOTOSYNTESE fordi det er
  slik det vanligvis undervises på dette nivået, ikke fordi det er 100 %
  biologisk presist. Samme forenkling gjelder lysosomer i planteceller
  (satt til sjeldne/fraværende).
- **Ett feilsvar helt i starten av runden** (spørsmål 1–2, før motoren har
  noe å veie det mot) er vanskeligere å hente seg inn fra enn en feil
  midt i runden — testen i `qa/simulate.mjs` viser dette eksplisitt
  (~85 % samlet robusthet, lavest for tidlige feil). Dette er en
  statistisk konsekvens av å ha lite annen informasjon å veie et avvik
  mot, ikke en åpenbar bug — men verdt å være klar over.
- **VAKUOLE og ORGANELL bruker flere spørsmål enn snittet** (opp mot
  motorens tak) fordi de mangler en sterk, unik funksjonell egenskap som
  skiller dem tydelig fra nærmeste "slektning" tidlig i runden. Løses
  best ved å legge til flere presise egenskaper/spørsmål for disse to,
  ikke ved å endre motoren.
- **Modus B avslører det hemmelige begrepet i debug-panelet** (merket
  med ★) — helt bevisst, siden debug-panelet uansett er skjult for
  elever, men verdt å huske hvis debug-modus noen gang skal vises fram.
- **Ingen temavelger i UI-et ennå.** `content-manifest.js` støtter flere
  fag/tema, men siden MVP-en bare har ett tema, laster `main.js` det
  automatisk. Se avsnittet over for hvorfor dette er bevisst utsatt.
- **Spørsmålsteksten er statisk** (ett spørsmål ↔ én property). Motoren
  har ikke noe i veien for mer sammensatte spørsmål senere, men det
  krever da også en mer fleksibel `compare()`-funksjon i `engine.js`.
