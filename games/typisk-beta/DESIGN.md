# Typisk! beta — designnotat

En fullstendig omarbeiding av `games/typisk/`. Det gamle spillet blir stående
urørt til betaen er vurdert; de deler ikke kode, og betaen har sin egen
lagringsnøkkel (`typisk.beta.v1`).

---

## Utgangspunktet

Det opprinnelige spillet var 1064 linjer i én fil, og fungerte godt som det det
var: et arbeidsark med tilbakemelding. Men:

| | Før |
|---|---|
| Innhold | 8 håndskrevne saker, fast rekkefølge, null variasjon ved gjenspill |
| Verb | 3 — regn ut, velg, tolk. Samme løkke 8 ganger |
| Spilletid | 5–8 min, og runde to er identisk med runde én |
| Poeng | 1 per riktig, maks 24. Ingen mestring, ingen progresjon |
| Lagring | Ingen |
| Visualisering | **Ingen.** Et statistikkspill der data vises som tallbrikker i en rad |

Den siste er den viktigste. Sentralmål er en romlig idé, og den var usynlig.

---

## Den bærende ideen: tallinja er spillbrettet

Alt annet henger på denne. Datasettet tegnes som et prikkplott på en tallinje,
og de tre sentralmålene får hver sin fysiske form:

- **Gjennomsnittet er en vektstang.** Prikkene er lodd på en planke, dreiepunktet
  ligger i gjennomsnittet. Det er ikke en illustrasjon — massesenteret til et sett
  punkter *er* gjennomsnittet, og dreiemomentet regnes ut fra dataene
  (`board.js`, `tegnVekt`). Legg inn en uteligger, og planken velter synlig.
- **Medianen er en loddrett strek** med antallet på hver side skrevet ut («3 ←» / «→ 3»).
  Når uteligeren kommer, tar den ett skritt. Kontrasten mot planken som velter
  er hele spillet, og nå er det noe eleven *ser*.
- **Typetallet er den høyeste stabelen**, markert med krone.

Fargene er låst og holdes overalt — brett, kort, ikoner, svarfelt:
gull = gjennomsnitt, teal = median, lilla = typetall.

---

## Tre grep for spilletid

### 1. Innholdsmotor i stedet for håndskrevne saker

En sak = **kontekst × form**. `content.js` har 26 kontekster (skostørrelser,
ventetid på legevakta, visninger, husleie, skritt …), `generator.js` har seks
fordelingsformer. Det gir hundrevis av saker, hver merket med hvilket poeng den
bærer.

Formene er ikke pynt. Hver har en **validator** som holder generatoren ærlig:
et `uteligger`-datasett slipper ikke ut før ekstremverdien faktisk ligger seks
steg over resten *og* gjennomsnittet er dratt målbart over medianen. Et
`todelt`-sett slipper ikke ut før både snitt og median lander i et område der
det ikke finnes ett eneste datapunkt.

**Pene tall er et hardt krav.** `polish()` justerer datasettet til gjennomsnittet
lander på maks én desimal — og for store enheter (kroner, visninger) på et helt
tall — uten å bryte formen. Uten dette drukner spillet i hoderegning. Alle 26 × 6
kombinasjoner er testet til å generere pålitelig; fire umulige kombinasjoner
(negativ nedbør, 26 timers søvn) ble luket ut underveis.

Kontekster med et naturlig tak er merket `taalerUteligger: false`. En uteligger
skal være overraskende, ikke fysisk umulig.

### 2. Ni verb i stedet for tre

Det er her spilletiden faktisk kommer fra — den gamle løkka gjentok seg selv.

| Verb | Hva det tilfører |
|---|---|
| `compute` | Regneferdigheten. Beholdt, men ikke lenger inngangsport til hver sak |
| `choose` | Skjerpet: samme data, ulikt spørsmål, ulikt riktig svar |
| `interpret` | Vurdering av en formulering |
| `predict` | Dra en markør før fasit. Rask, og avslører magefølelsen |
| `shock` | Det nye datapunktet, med vektstanga som svarer |
| `bygg` | Omvendt oppgave. Her vises forståelse |
| `sabotor` | Finn den minste verdien som flytter snittet over en grense |
| `overskrifter` | Sann / sann men misvisende / feil |
| `finnfeil` | Diagnostisk: usortert median, feil nevner, typetall = største verdi |

### 3. Tre moduser

- **Sesongen** — fem kapitler à fem oppgaver, ca. 25 min. Hvert kapittel
  introduserer én ny idé *og* ett nytt verb, så tempoet aldri står stille.
  Stjerner, merker og lagring.
- **Arkade** — genererte oppgaver på tid, tre liv, streak-multiplikator,
  vanskegrad som stiger med runden. Ubegrenset spilletid.
- **Dagens sak** — fem oppgaver seedet på datoen, lik for alle, delbart resultat.

---

## Avgjørelser verdt å begrunne

### Utregning ble degradert fra inngangsport til oppgavetype

Skrivefeltet er den tregeste delen av spillet. Firedobler man antall saker og
beholder «skriv inn gjennomsnittet» hver gang, firedobler man tastingen — og da
blir 25 minutter kjedelig, ikke rikt. Nå er `compute` ett verb av ni. I de fleste
sakene er verdiene oppgitt, og spillet handler om valg og vurdering.
Regneferdigheten får sine egne saker.

### Vurderingsverbene låses etter ett forsøk

Første versjon lot eleven gjette videre etter et feil svar på `choose`. Men
tilbakemeldingen på et vurderingsspørsmål *er* forklaringen — å la eleven prøve
igjen betyr å la henne lese svaret og så klikke det. `choose`, `interpret`,
`finnfeil`, `predict`, `shock` og `overskrifter` låses derfor etter første svar.
`compute`, `bygg` og `sabotor` tåler flere forsøk, fordi tilbakemeldingen der er
et hint, ikke en fasit.

### Sabotøren måtte handle om grensen, ikke om et stort tall

Første versjon godtok et hvilket som helst tall som fikk snittet over terskelen.
Da svarte man bare «99999» og gikk videre. Nå må svaret ligge innenfor et bånd
rundt den eksakte grensen, og oppgaven blir det den skulle være: løs
`T = (sum + x)/(n + 1)` for `x`.

### Sluttskjermen viser denne runden, ikke rekorden

Arkivet husker det beste resultatet per kapittel, men å vise tre stjerner etter
en runde med 0 poeng ville vært å ta æren for noe annet. Rekorden står som en
egen linje.

### «Todelt» er lagt til fordi det ærligste svaret noen ganger er «ingen»

Det gamle spillet hadde ingen sak der konklusjonen var at ingen av de tre
sentralmålene beskriver gruppa. Det er en reell og viktig situasjon, og den er
nå en egen form med sitt eget svaralternativ.

---

## Arkitektur

```
games/typisk-beta/
  index.html     skjelett: fire skjermer
  style.css      hus-stil + låst fargesystem for de tre sentralmålene
  stats.js       ren matematikk, ingen DOM. Alt spillet påstår, regnes her
  generator.js   fordelingsformer, validatorer, polish() for pene tall
  content.js     26 kontekster, klienter, fem kapitler
  art.js         all SVG: maskoter, ikoner, heltebilde. Ett bytte­punkt
  board.js       tallinje, vektstang, markører, animasjon
  tasks.js       de ni verbene: lagOppgave() og sjekk(), rent datalag
  game.js        tilstand, moduser, poeng, stjerner, merker, lagring
  ui.js          panelene. Ett per verb, snakker gjennom callbacks
  main.js        kontrolleren. Binder tilstand til brett og paneler
  laerer.html    lærerveiledning
```

`tasks.js` bygger og dømmer oppgaver uten å røre DOM, så hele oppgavemotoren kan
testes i Node — noe som fanget flere feil enn nettleseren gjorde.

`art.js` returnerer SVG-strenger og er det eneste stedet som tegner. Vil man
senere bytte maskotene mot rasterkunst, byttes én funksjon om gangen, slik
`3s1f-beta/ART-BRIEF.md` beskriver.

---

## Tilgjengelighet

Det gamle spillet var godt her, og det skulle ikke ofres for det visuelle.
Brettet har en parallell tekstversjon (`brettTekst()`) som oppdateres ved hver
endring, gjettemarkøren har en vanlig `<input type="range">` i tillegg til
dra-og-slipp, alle tilstandsendringer meldes via `aria-live`, og
`prefers-reduced-motion` slår av animasjonene.

---

## Videre

- Klasseromsmodus: projektorvisning og duell på én enhet.
- Spredningsmål (variasjonsbredde) som et valgfritt kapittel 6. Bevisst holdt
  utenfor nå — spillet skal gjøre sentralmål grundig, ikke statistikk bredt.
- Merker og stjerner ligger lokalt. Skal de følge en elev mellom enheter, må det
  kobles til `auth/`.
