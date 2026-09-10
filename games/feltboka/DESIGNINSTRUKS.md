# Designinstruks — Feltboka

Spillet er bygget ferdig som mekanikk. Ingenting av det visuelle er
avgjort. Denne fila sier hva som skal designes, hvor det kobles inn, og
hva som allerede er låst av logikken.

Kort om spillet: eleven velger et matematikktema, løser oppgaver
fortløpende, og får etter ti riktige svar et tilfeldig funn — en art i
en av seks varianter — som legges i en samling. Se `DESIGN.md` for
motoren og GDD v0.1 for produktbeslutningene.

---

## 1. Målgruppe og tone

**8.–10. trinn, altså 13–16 år.** Dette er avgjort, og det er det
strengeste kravet i hele instruksen:

- Ikke barnslig. Ikke tegneseriefigurer med ansikter og store øyne.
- **Bryt med LRNifys vanlige uttrykk.** Resten av plattformen bruker
  `Chewy` (rund «boble»-font) og et lekent, barnevennlig formspråk.
  Dette spillet skal ikke gjøre det. Det er en bevisst avgjørelse, ikke
  en forglemmelse — tas den om igjen, må målgruppekravet tas om igjen
  samtidig.
- Grensesnittet skal være rolig. Samleobjektene er den eneste visuelt
  rike delen. Blikket skal ligge på **oppgaven** og på **funnet**, og
  ingen andre steder.
- Lite tekst mellom oppgavene. Alt som står mellom to oppgaver stjeler
  fra mengdetreningen.

## 2. De to stedene design kobles inn

Alt visuelt ligger i nøyaktig to filer. Resten av koden skal ikke røres.

### `css/placeholder.css` — bytt ut hele fila

Klassenavnene er kontrakten mot `js/main.js`. Behold dem, eller endre
dem samlet begge steder. Disse finnes:

| Skjerm | Klasser |
|---|---|
| Topplinje | `.topplinje` `.merke` `.faner` `.fane` (`.er-valgt`) |
| Velg tema | `.valg` `.valgkort` (`.er-valgt`) `.valgkort-navn` `.valgkort-eksempel` `.valgkort--niva` |
| Oppgave | `.oppgavetopp` `.merkelapp` `.framgang` `.framgang-fyll` `.framgang-tekst` `.sporsmal` `.svarrad` `.svarfelt` `.hjelp` `.tilbakemelding` (`.er-riktig` / `.er-feil`) |
| Funn | `.skjerm--funn` `.funn-stikk` `.funn-kort` `.funn-bilde` `.funn-variant` `.funn-navn` `.funn-vitenskapelig` `.funn-status` `.funn-samling` |
| Samling | `.rutenett` `.rute` (`.rute--last`) `.rute-bilde` `.rute-navn` `.rute-tall` |
| Artsside | `.art-bilde` `.art-navn` `.art-vitenskapelig` `.art-status` `.art-fakta` `.variantrad` `.variantbrikke` (`.variantbrikke--last`, `.er-valgt`) |
| Statistikk | `.tall` (en `<dl>`) |
| Felles | `.knapp` `.knapp--stor` `.knapp--flat` `.knapp--fare` `.skjerm` `.ingress` |

Hver art og variant får klassen `variant--<id>` på et element rundt
illustrasjonen: `variant--vanlig`, `--gyllen`, `--albino`,
`--melanistisk`, `--nordlys`, `--krystall`.

### `js/art.js` — én funksjon

```js
illustrasjon(art, variantId, { silhuett })  →  SVG-streng
```

`art` er objektet fra `js/data/species.js` (`id`, `navn`,
`vitenskapelig`, `kategori`, `vekt`, `fakta`). `silhuett: true` betyr
låst plass i samlingen — arten er ikke funnet ennå, og navnet skal ikke
røpes.

Plassholderen tegner én geometrisk form per **kategori**, ikke per art,
så alle pattedyr ser like ut nå. Det er med vilje: en plassholder skal
ikke kunne forveksles med ferdig grafikk. Den har også stiplet ramme av
samme grunn.

## 3. Illustrasjonene — det største valget

**30 arter × 6 varianter = 180 mulige samleobjekter.** Hvordan de
produseres er den avgjørelsen som koster mest, og den er ikke tatt.

**Vei A — én grunnform per art, varianten som lag (anbefalt).**
30 illustrasjoner. Varianten legges på i CSS: farge, tekstur, glød.
Plassholderen er bygget slik allerede — SVG-en henter fargene fra tre
variabler som variantklassen setter:

```css
--ill-flate    /* flatefarge */
--ill-strek    /* kontur */
--ill-glans    /* aksent, lyseffekt */
```

Dette er samme økonomi som Ordtoget valgte (vognene er tegnet i CSS
nettopp for å slippe et bildebibliotek). Prisen er at «krystall» og
«nordlys» må kunne uttrykkes som et lag som virker på alle 30 formene.

**Vei B — egen illustrasjon per art og variant.** Opptil 180 filer.
Gir full kontroll per kombinasjon, men er en produksjonsjobb i en helt
annen størrelsesorden, og hver ny art koster seks nye filer i stedet for
én.

Uansett vei:

- Én konsekvent stil. Alle 30 skal oppleves som del av samme samling.
- Sjeldenheten bør kunne leses på et halvt sekund. En krystallulv skal
  se sjelden ut før eleven rekker å lese ordet «krystall».
- Filstørrelse teller. Dette kjøres på skolenett og Chromebooks. SVG
  eller optimaliserte PNG-er; ingen eksterne CDN-er (LRNify laster ikke
  ressurser fra tredjepart).

**Variantene, og hva hver må formidle** (GDD pkt. 7):

| Variant | Andel | Uttrykk |
|---|---|---|
| Vanlig | 70 % | Naturtro eller stilisert grunnform. |
| Gyllen | 15 % | Gullpreg. Tydelig sjeldnere enn vanlig. |
| Albino | 6 % | Lys variant. **Brukes ikke på planter og sopp** — der heter den «Hvit» og er slått av i dataene. |
| Melanistisk | 5 % | Mørk variant. Heter «Mørk» på planter og sopp, som ikke har melanisme. |
| Nordlys | 3 % | Nordlysfarger og lysfenomen. En av spillets kjennetegn. |
| Krystall | 1 % | Arten ser ut som den består av krystall. Den sjeldneste. |

Hvilke arter som *ikke* skal ha albino er foreløpig satt i
`js/data/species.js` (alle planter og sopp). Den lista hører hjemme hos
den som ser illustrasjonene — endre den fritt, QA-en fanger opp
skrivefeil.

## 4. Skjermene som finnes

1. **Velg tema** — seks temakort (navn + eksempeloppgave), tre nivåkort,
   én startknapp. Startknappen er låst til et tema er valgt.
2. **Oppgave** — «bytt tema»-knapp, tema/nivå-merkelapp, streak-merkelapp
   (vises fra 2 på rad), framdriftslinje mot neste funn («7 / 10»),
   spørsmålet, svarfelt + knapp, hjelpetekst, tilbakemelding.
3. **Funn** — stikkord («Funn!»), kort med illustrasjon, variantnavn,
   artsnavn, vitenskapelig navn, «Nytt funn» / «Duplikat ×4», og
   «Ulv 3/6». Én knapp tilbake til oppgavene.
4. **Samling** — rutenett med alle 30 artene. Funne arter viser den
   sjeldneste varianten eleven har. Ikke-funne viser silhuett og «???».
   Hver rute har «3/6».
5. **Artsside** — stor illustrasjon, navn, vitenskapelig navn, 1–3
   fakta, og variantbrikkene. Brikker eleven ikke har er låst; klikk på
   en eid brikke bytter den store illustrasjonen.
6. **Statistikk** — sju tall og en «nullstill alt»-knapp.

Tre faner binder det sammen: Spill, Samling, Statistikk.

## 5. Bevegelse

Funnet skal være tilfredsstillende, men raskt: **hele hendelsen 3–5
sekunder** (GDD pkt. 19). Tidene ligger i `js/config.js`
(`funn.autolukkMs`, `funn.minVisningMs`) — endre der, ikke i CSS-en.

Nå finnes ingen animasjon i det hele tatt. Det som mangler er
overgangen inn til funnkortet, og gjerne noe som skiller et sjeldent
funn fra et vanlig. Det som ikke skal komme, er noe eleven må vente på
mer enn én gang.

Respekter `prefers-reduced-motion` — spillet vises for hele klasser.

## 6. Krav som ikke er til forhandling

- **390 px bredde skal virke.** Ingen vannrett rulling. Testes.
- **Trykkflater minst 44 px høye.**
- **Kontrast på AA-nivå.** Særlig `.tilbakemelding.er-feil` og
  `.rute--last`, som er de to stedene fristelsen til lysegrått er størst.
- **Tallene i oppgaveteksten må stå stille.** `.sporsmal` bruker
  `font-variant-numeric: tabular-nums` i dag. En font som gjør
  minustegn, brøkstrek eller hevet skrift utydelig, kan ikke brukes —
  hele spillet er tall.
- **Synlig fokusmarkering.** Eleven svarer med Enter og ser aldri på
  musa. Svarfeltet får fokus automatisk ved hver nye oppgave.
- **Toppteksten** må enten inneholde `<a class="logo" href="/index.html">`
  (da skjuler `/nav/lrnify-tilbake.js` sin flytende knapp seg selv), eller
  la det være 52 px luft øverst til den knappen. Plassholderen gjør det
  siste.

## 7. Innhold som ikke er design, men som mangler

- **Navnet.** «Feltboka» er en arbeidstittel. Står i `js/config.js`,
  `index.html` (`<title>` + meta) og i `GAMES`-lista på forsiden.
  Unngå «PokéMath»/Pokémon i alt brukervendt.
- **Artsfaktaene.** 60 plassholdere merket `[FAKTA n – …]` i
  `js/data/species.js`. 1–3 korte fakta per art, faktasjekket.
- **Fire arter er presisert fra gruppenavn** («ugle» → kattugle, «humle»
  → mørk jordhumle, «frosk» → buttsnutefrosk, «øyenstikker» → *Aeshna
  juncea*). Bekreft eller bytt.
- **Kortbilde til forsiden**: `media/cards/<navn>.png`, og `og:image` i
  `index.html` når bildet finnes.

## 8. Sjekkliste før det er ferdig

- [ ] `css/placeholder.css` erstattet (og fila døpt om)
- [ ] `js/art.js` returnerer ekte illustrasjoner
- [ ] Alle seks variantene er visuelt skilt, og sjeldenheten leses raskt
- [ ] Silhuett-tilstanden røper ikke arten
- [ ] 390 px uten vannrett rulling, trykkflater ≥ 44 px, AA-kontrast
- [ ] Funnet tar 3–5 sekunder, og `prefers-reduced-motion` er håndtert
- [ ] `node games/feltboka/qa/check.mjs` er fortsatt grønn
