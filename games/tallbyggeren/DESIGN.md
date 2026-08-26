# Tallbyggeren — oppgavedesign og motor

Spilleren får statistiske krav og bygger datasettet som oppfyller dem.
Ikke «hva er medianen av disse tallene», men «lag et datasett som har
denne medianen». Det snur oppgaven, og det er den snuoperasjonen som
tvinger fram forståelse av hva målene faktisk beskriver.

## Filene

| Fil | Ansvar |
|---|---|
| `js/stats.js` | Statistikkmotoren. Regner gjennomsnitt, median, typetall og variasjonsbredde. Ingen spillregler. |
| `js/challenge.js` | Datamodellen for en oppgave, med normalisering og standardverdier. |
| `js/validator.js` | `validateDataset(dataset, challenge)` — den ene kilden til sannhet om hvorvidt en oppgave er løst. |
| `js/solver.js` | `solveChallenge(challenge, options)` — finner og teller løsninger. QA-verktøy og fasitkilde. |
| `js/challenges.js` | De 60 kampanjeoppgavene. Rene data. |
| `js/generator.js` | Sandkassen: nye oppgaver med samme vanskelighetsprofil som et valgt nivå. |
| `js/hints.js` | Fyller inn tall fra spillerens datasett i håndskrevne hint. |
| `js/feedback.js` | Den faglige observasjonen etter en løsning. |
| `js/game.js` | Spilltilstand: oppgave, datasett, funne løsninger, hint. Ingen DOM. |
| `js/main.js` | Spillflaten. Tegner tilstanden validatoren returnerer, og ingenting annet. |
| `qa/check-campaign.mjs` | Kjører solveren over alle 60 oppgavene. |

Avhengighetene peker én vei: `main.js → game.js → validator.js → stats.js`.
Ingen komponent regner statistikk selv, og ingen komponent tolker krav på
egen hånd. Skal en regel endres, endres den ett sted.

## To regler som er verdt å merke seg

**Typetall.** En verdi er typetall bare dersom den forekommer oftere enn
alle andre. `2, 2, 4, 4, 7` har altså *ikke* to typetall — det har ingen.
Det gjør spillreglene entydige, og det gjør det mulig å stille kravet
«datasettet skal ikke ha noe typetall» (nivå 6).

**Like løsninger.** Datasett sammenliknes sortert. `2, 4, 6, 8` og
`8, 6, 4, 2` er samme løsning, og teller én gang i oppgaver som krever
flere ulike løsninger.

## QA

```
node games/tallbyggeren/qa/check-campaign.mjs
```

Kontrollerer for hver av de 60 oppgavene at den er løsbar (eller
beviselig umulig), at det finnes minst like mange løsninger som oppgaven
krever, at fasiten faktisk løser oppgaven, at startdatasettet er lovlig
men ikke allerede løst, og at læringsmål og hint finnes. Skriver ut
løsningsantallet per oppgave, og varsler når en oppgave ligger utenfor
løsningsrommet nivået legger opp til. Kjør den etter hver endring i
`challenges.js`.

## Progresjonen

Kampanjen er bygget rundt tre påstander:

1. **Hvert mål må møtes alene før det møtes i kombinasjon.** Nivå 1
   gir hvert av de fire målene sin egen førstegangsopplevelse, og
   gjentar det med flere tall slik at spilleren ser at regelen ikke er
   knyttet til antallet brikker.
2. **Betingelser lærer mer enn større tall.** Et låst tall eller et tall
   som må være med, stenger den enkleste veien og tvinger fram et
   resonnement. Det er derfor nivå 2 kommer før nivå 3, selv om nivå 3
   har «flere» krav.
3. **Innsikten ligger i spriket.** At gjennomsnitt, median og typetall
   kan peke på tre forskjellige tall i samme datasett, er det spillet
   egentlig handler om. Det bygges opp fra 3-03 og settes på spissen i
   5-03, 5-07 og 5-09.

### Nivå for nivå

**Nivå 1 — ett mål.** Median først (lettest å se), så variasjonsbredde,
så gjennomsnitt (krever regning på alle tallene), så typetall (den mest
særegne regelen). Startsettene har alle brikkene på samme verdi, så
spilleren må selv skape enhver forskjell.

**Nivå 2 — ett mål og en betingelse.** Låste tall og påkrevde tall
introduseres mot ett mål om gangen. 2-04 og 2-09 er speilbilder: først
drar det påkrevde tallet gjennomsnittet opp, så ned. Poenget er at det
er *avstanden til gjennomsnittet* som teller. 2-10 innfører partall
antall tall, der medianen er gjennomsnittet av de to midterste.

**Nivå 3 — to mål.** Starter med to mål som ikke deler tall (median og
bredde), fortsetter til to mål som gjør det (gjennomsnitt og median).
3-03 og 3-08 er skjevfordelingsparet: gjennomsnitt over medianen, og
gjennomsnitt under. 3-05 lærer bort teknikken som brukes i resten av
kampanjen — ta fra ett tall, gi til et annet, så står summen stille.

**Nivå 4 — to mål og betingelser.** Her introduseres de betingelsene
som ikke handler om enkelttall: alle ulike, nøyaktig antall
forekomster, fast antall ulike verdier, øvre og nedre grense. 4-04 og
4-08 er et par: først strammer gulvet inn, så taket.

**Nivå 5 — tre eller flere krav.** Nå må spilleren planlegge. 5-06
formulerer arbeidsrekkefølgen eksplisitt i hintet — median, så bredde,
så sum — og 5-10 krever at den sitter. 5-09 er argumentet for hvorfor
medianen ofte foretrekkes: fem av seks tall ligger lavt, og én uteligger
alene holder gjennomsnittet oppe.

**Nivå 6 — ekspert.** Tre nye ting: oppgaver som krever flere ulike
løsninger, oppgaver med bare én løsning, og oppgaver som ikke kan løses
i det hele tatt. Det siste er den viktigste nyheten — å avgjøre om et
krav lar seg oppfylle er en annen ferdighet enn å oppfylle det. De tre
umulige oppgavene er umulige av tre forskjellige grunner (et regnestykke
som ikke går opp, en definisjon som kolliderer med en betingelse, og en
grense som er nådd), slik at umulighet ikke kan kjennes igjen på formen.
Knappen «dette er umulig» vises på hele nivå 6, ikke bare på de umulige
oppgavene.

## Alle 60 oppgavene

Løsningstallene er talt opp av solveren, ikke anslått. «Kreves» er
antall ulike datasett spilleren må finne.

### Nivå 1

| # | Tall | Krav | Fasit | Løsninger | Kreves |
|---|---|---|---|---|---|
| 1-01 | 3 (0–12) | median 5 | 2, 5, 9 | 48 | 1 |
| 1-02 | 3 (0–12) | bredde 6 | 2, 4, 8 | 49 | 1 |
| 1-03 | 3 (0–12) | gj.snitt 5 | 3, 5, 7 | 23 | 1 |
| 1-04 | 4 (0–12) | gj.snitt 6 | 4, 5, 7, 8 | 86 | 1 |
| 1-05 | 5 (0–12) | median 7 | 1, 3, 7, 9, 10 | 756 | 1 |
| 1-06 | 4 (0–10) | typetall 3 | 1, 3, 3, 8 | 56 | 1 |
| 1-07 | 5 (0–12) | bredde 8 | 2, 5, 6, 9, 10 | 825 | 1 |
| 1-08 | 5 (0–12) | gj.snitt 6 | 2, 4, 6, 8, 10 | 252 | 1 |
| 1-09 | 6 (0–10) | typetall 4 | 1, 2, 4, 4, 6, 9 | 486 | 1 |
| 1-10 | 6 (0–20) | gj.snitt 9 | 4, 7, 9, 10, 12, 12 | 5126 | 1 |

### Nivå 2

| # | Tall | Krav | Fasit | Løsninger | Kreves |
|---|---|---|---|---|---|
| 2-01 | 3 (0–12) | median 6, må ha 9 | 3, 6, 9 | 7 | 1 |
| 2-02 | 4 (0–12) | gj.snitt 5, låst 2 | 2, 4, 6, 8 | 25 | 1 |
| 2-03 | 4 (0–12) | bredde 7, må ha 4 | 4, 5, 6, 11 | 68 | 1 |
| 2-04 | 4 (0–12) | gj.snitt 6, må ha 9 | 4, 5, 6, 9 | 23 | 1 |
| 2-05 | 5 (0–12) | median 8, låst 12 | 2, 4, 8, 10, 12 | 225 | 1 |
| 2-06 | 5 (0–12) | gj.snitt 7, uten 7 | 3, 5, 8, 9, 10 | 145 | 1 |
| 2-07 | 5 (0–12) | median 6, alle ≥4 | 4, 5, 6, 7, 9 | 168 | 1 |
| 2-08 | 5 (0–12) | bredde 9, låst 6 | 3, 5, 6, 9, 12 | 220 | 1 |
| 2-09 | 5 (0–12) | gj.snitt 8, må ha 2 | 2, 9, 9, 10, 10 | 23 | 1 |
| 2-10 | 6 (0–20) | median 10, låst 4, låst 16 | 4, 8, 9, 11, 14, 16 | 676 | 1 |

### Nivå 3

| # | Tall | Krav | Fasit | Løsninger | Kreves |
|---|---|---|---|---|---|
| 3-01 | 3 (0–12) | median 5, bredde 6 | 2, 5, 8 | 6 | 1 |
| 3-02 | 4 (0–12) | gj.snitt 6, median 6 | 2, 5, 7, 10 | 28 | 1 |
| 3-03 | 4 (0–12) | gj.snitt 6, median 5 | 2, 4, 6, 12 | 10 | 1 |
| 3-04 | 5 (0–12) | median 7, bredde 8 | 3, 5, 7, 9, 11 | 110 | 1 |
| 3-05 | 5 (0–12) | gj.snitt 7, bredde 10 | 2, 5, 7, 9, 12 | 37 | 1 |
| 3-06 | 4 (0–10) | gj.snitt 5, typetall 4 | 2, 4, 4, 10 | 4 | 1 |
| 3-07 | 5 (0–12) | median 6, typetall 6 | 2, 4, 6, 6, 9 | 271 | 1 |
| 3-08 | 5 (0–12) | gj.snitt 6, median 8 | 0, 0, 8, 10, 12 | 27 | 1 |
| 3-09 | 6 (0–12) | median 8, bredde 10 | 2, 6, 7, 9, 10, 12 | 205 | 1 |
| 3-10 | 6 (0–20) | gj.snitt 10, median 9 | 3, 7, 8, 10, 14, 18 | 649 | 1 |

### Nivå 4

| # | Tall | Krav | Fasit | Løsninger | Kreves |
|---|---|---|---|---|---|
| 4-01 | 4 (0–12) | gj.snitt 6, bredde 8, må ha 3 | 3, 4, 6, 11 | 4 | 1 |
| 4-02 | 4 (0–12) | gj.snitt 7, median 7, uten 7 | 4, 6, 8, 10 | 15 | 1 |
| 4-03 | 5 (0–12) | typetall 3, bredde 9, låst 3 | 3, 3, 5, 8, 12 | 62 | 1 |
| 4-04 | 5 (0–12) | gj.snitt 8, median 6, alle ≥2 | 5, 6, 6, 11, 12 | 5 | 1 |
| 4-05 | 5 (0–12) | median 9, bredde 10, alle ulike | 1, 5, 9, 10, 11 | 19 | 1 |
| 4-06 | 6 (0–12) | gj.snitt 7, typetall 5, må ha 12 | 2, 5, 5, 8, 10, 12 | 15 | 1 |
| 4-07 | 5 (0–12) | gj.snitt 6, bredde 8, 4 nøyaktig 2× | 2, 4, 4, 10, 10 | 3 | 1 |
| 4-08 | 6 (0–20) | gj.snitt 8, median 6, alle ≤15 | 2, 4, 5, 7, 15, 15 | 50 | 1 |
| 4-09 | 6 (0–12) | median 7, typetall 7, 3 ulike verdier | 3, 7, 7, 7, 9, 9 | 136 | 1 |
| 4-10 | 6 (0–20) | gj.snitt 9, bredde 14, må ha 19, låst 5 | 5, 5, 7, 8, 10, 19 | 23 | 1 |

### Nivå 5

| # | Tall | Krav | Fasit | Løsninger | Kreves |
|---|---|---|---|---|---|
| 5-01 | 4 (0–12) | gj.snitt 6, median 6, bredde 8 | 2, 4, 8, 10 | 5 | 1 |
| 5-02 | 5 (0–12) | gj.snitt 6, median 6, bredde 8 | 2, 4, 6, 8, 10 | 9 | 1 |
| 5-03 | 5 (0–14) | gj.snitt 7, median 6, typetall 4 | 4, 4, 6, 9, 12 | 4 | 1 |
| 5-04 | 5 (0–12) | gj.snitt 7, median 6, bredde 10 | 2, 3, 6, 12, 12 | 5 | 1 |
| 5-05 | 5 (0–12) | median 8, typetall 8, bredde 9, må ha 3 | 3, 8, 8, 9, 12 | 11 | 1 |
| 5-06 | 6 (0–12) | gj.snitt 7, median 7, bredde 10 | 1, 5, 7, 7, 11, 11 | 27 | 1 |
| 5-07 | 6 (0–12) | gj.snitt 7, median 6, typetall 5, alle ≥2 | 5, 5, 5, 7, 9, 11 | 7 | 1 |
| 5-08 | 5 (0–14) | gj.snitt 9, median 9, bredde 8, alle ulike | 5, 8, 9, 10, 13 | 3 | 1 |
| 5-09 | 6 (0–12) | gj.snitt 6, median 5, typetall 4, må ha 12 | 4, 4, 4, 6, 6, 12 | 5 | 1 |
| 5-10 | 6 (0–20) | gj.snitt 10, median 9, bredde 16, låst 4 | 4, 8, 8, 10, 10, 20 | 34 | 1 |

### Nivå 6

| # | Tall | Krav | Fasit | Løsninger | Kreves |
|---|---|---|---|---|---|
| 6-01 | 4 (0–12) | gj.snitt 6, median 6 | 2, 5, 7, 10 | 28 | 2 |
| 6-02 | 5 (0–12) | median 7, bredde 8, må ha 4 | 4, 6, 7, 8, 12 | 38 | 2 |
| 6-03 | 4 (0–12) | gj.snitt 6, median 4 | 4, 4, 4, 12 | 1 | 1 |
| 6-04 | 5 (0–12) | gj.snitt 3, median 8 | *ingen* | **umulig** | 1 |
| 6-05 | 5 (0–12) | typetall 5, alle ulike | *ingen* | **umulig** | 1 |
| 6-06 | 5 (0–12) | gj.snitt 6, median 6, typetall ingen | 2, 2, 6, 10, 10 | 41 | 1 |
| 6-07 | 5 (0–12) | gj.snitt 6, typetall 4 | 4, 4, 4, 6, 12 | 16 | 3 |
| 6-08 | 6 (0–12) | gj.snitt 6, median 6, bredde 12, 3 ulike verdier | 0, 0, 6, 6, 12, 12 | 2 | 1 |
| 6-09 | 5 (0–12) | gj.snitt 12, må ha 4 | *ingen* | **umulig** | 1 |
| 6-10 | 6 (0–20) | gj.snitt 10, median 9, typetall 8, bredde 15 | 3, 8, 8, 10, 13, 18 | 3 | 1 |

## Ikke bygget ennå

Visuell polish, animasjon og lyd er bevisst utsatt. Selve
problemløsningen skal stå i sentrum, og suksessfeedbacken er holdt kort:
én bekreftelse, én observasjon om hva det siste trekket gjorde, og
oppgavens faglige poeng. Ingen poeng, ingen konfetti.

Sandkassens hint er maler per mål, ikke skrevet til den enkelte
oppgaven. Det er en av grunnene til at kampanjen fortsatt er hovedveien
gjennom spillet.
