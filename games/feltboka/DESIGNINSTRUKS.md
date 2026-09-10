# Designinstruks — Feltboka

Spillet er bygget ferdig som mekanikk. Ingenting av det visuelle er
avgjort. Denne fila sier hva som skal designes, hvor det kobles inn, og
hva som allerede er låst av logikken.

Kort om spillet: eleven velger et matematikktema, løser oppgaver
fortløpende, og får etter ti riktige svar et tilfeldig funn — en art i
en av tre varianter — som legges i en samling. Se `DESIGN.md` for
motoren og GDD v0.1 for produktbeslutningene.

**MVP-tonet ned:** 6 arter (ikke 30), 3 varianter (ikke 6) — altså 18
mulige samleobjekter, ikke 180. Kuttet er bevisst: nok innhold til å
teste selve spillhypotesen, lite nok til at illustrasjonsjobben under
er overkommelig i én runde. Flere arter senere er en ren datautvidelse
i `js/data/species.js`, og denne instruksen gjelder likt for dem.

Skal illustrasjonene ut til en ekstern tegner uten kjennskap til
prosjektet, bruk `DESIGNBRIEF-TEGNER.md` i stedet for denne fila — den
er selvstendig og fri for kodereferanser. Denne fila er for den som
kobler de ferdige illustrasjonene inn i spillet.

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
illustrasjonen: `variant--vanlig`, `--nordlys`, `--krystall`.

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

## 3. Illustrasjonene

**6 arter × 3 varianter = 18 mulige samleobjekter.** Med 180 var dette
en produksjonsrisiko; med 18 er begge veiene under faktisk realistiske.

**Vei A — 6 grunnformer + CSS-variantlag.** Varianten legges på i CSS:
farge, tekstur, glød. Plassholderen er bygget slik allerede — SVG-en
henter fargene fra tre variabler som variantklassen setter:

```css
--ill-flate    /* flatefarge */
--ill-strek    /* kontur */
--ill-glans    /* aksent, lyseffekt */
```

Billigst, og det som skalerer best om flere arter kommer senere (én ny
illustrasjon per art, ikke tre). Samme økonomi som Ordtoget (vognene er
tegnet i CSS nettopp for å slippe et bildebibliotek).

**Vei B — 18 unike illustrasjoner.** Én per art og variant. Realistisk
i denne størrelsen, og gir mest kontroll: en krystallulv kan se
grunnleggende annerledes ut enn en vanlig ulv, ikke bare omfarget. Koster
mer hver gang en ny art legges til (tre filer, ikke én).

**Anbefaling: Vei A.** Tre varianter som skal virke konsekvent på tvers
av arter (se fargespec under) egner seg godt som et lag, og listen over
arter kommer mest sannsynlig til å vokse igjen etter denne runden — da
er det A som holder produksjonskostnaden nede. Vei B er det riktige
valget bare hvis nordlys/krystall skal se kvalitativt forskjellig ut fra
art til art (f.eks. at krystall-hoggormen har helt andre fasetter enn
krystall-ulven), ikke bare omfarget.

Uansett vei:

- Én konsekvent stil på tvers av alle 6.
- Sjeldenheten bør kunne leses på et halvt sekund, før eleven rekker å
  lese variantnavnet.
- Filstørrelse teller. Dette kjøres på skolenett og Chromebooks. SVG
  eller optimaliserte PNG-er; ingen eksterne CDN-er (LRNify laster ikke
  ressurser fra tredjepart).

### Variantene — fargespec

| Variant | Andel | Uttrykk | Forslag til palett |
|---|---|---|---|
| Vanlig | 96 % | Naturtro eller stilisert grunnform. Dette ER arten, udekorert. | Artens egne, naturlige farger. |
| Nordlys | 3 % | Et kjølig, flerfarget lysskjær langs silhuetten — ikke full omfarging av kroppen, men en glødende kant/gradient som antyder nordlys. Grunnfargen skal fortsatt kunne kjennes igjen som arten. | Kant/gradient i grønn→turkis→fiolett, f.eks. `#3fae7f → #3f8fae → #8f6fcf`. Gjerne en svak, mørk bakgrunn bak selve figuren på funn- og artssiden (ikke i det lille samlingsrutenettet) som antyder nattehimmel. |
| Krystall | 1 % | Overflaten brytes opp i fasetter — arten ser ut som den består av eller er dekket av krystall. Skarpe høylys, ikke myke skygger. Den sjeldneste, og bør se dyrebar ut. | Iskald blå/hvit med skarpe glanspunkter, f.eks. `#cfe3f5` flate, `#5470a3` kontur, `#ffffff` skarpe høylys. Gjerne en svak facettert linjetekstur oppå grunnformen. |

Alle tre skal virke på samtlige 6 arter uten unntak — det var
nettopp derfor disse tre ble valgt (se `DESIGN.md`). Ingen art har
`utenVarianter` satt i dag.

### Per-art-brief

Konsis retning for hver av de 6 — pose og kjennetegn, ikke stil (stilen
er felles og bestemmes én gang, se over).

| Art | Pose / vinkel | Kjennetegn å ta med | Unngå |
|---|---|---|---|
| **Ulv** (*Canis lupus*) | Stående, 3/4-vinkel, rolig og årvåken — ikke snerrende, ikke fryktsom. | Spisse ører rett opp, tett bringepels, bushy hale i normal høyde (verken senket eller løftet aggressivt). | Ulvehyl-klisjeen (hodet bakoverbøyd mot en måne) — overbrukt, og sier ingenting om arten selv. |
| **Rødrev** (*Vulpes vulpes*) | Sittende eller midt i et skritt, sett fra siden. | Den karakteristiske store, buskete halen — skal være tydelig lesbar i silhuett alene. Spisse ører, smalt snuteparti. | Halen kuttet av eller skjult — den ER artens gjenkjennelsesmerke. |
| **Ekorn** (*Sciurus vulgaris*) | Klatrende på en grenstubb, eller sittende med halen krummet oppover bak ryggen. | Krum hale over ryggen (signaturform), buskete ørepensler. | Den klassiske «ekorn med nøtt i labbene»-posen — søtt, men slitent, og trekker mot barnslig. |
| **Kongeørn** (*Aquila chrysaetos*) | Enten i flukt med vingene ute (bred silhuett), eller sittende med sammenslåtte vinger og skarpt profilblikk. | Kraftig, kroket nebb. Hvis flukt: fingrete vingespisser (adskilte fjær). | En generisk «ørn»-logo-silhuett (som f.eks. et idrettsmerke) — skal lese som fugl, ikke som emblem. |
| **Hoggorm** (*Vipera berus*) | Kveilet i en S-form, hodet lett hevet. | Det karakteristiske sikksakk-mønsteret langs ryggen — dette ER hva som skiller den fra en hvilken som helst slange. | Åpen gapende munn/hoggtenner — dramatisk, men ikke det som faktisk kjennetegner arten i felt. |
| **Blåbær** (*Vaccinium myrtillus*) | En liten kvist med 2–4 bær og noen få blad, botanisk oppstilt. | Bærets dype blåfiolette farge med det lille «kron»-merket i bunnen (kjennetegnet ved nærbilde). | Et ansikt eller smilefjes på bæret — bryter rett med «ikke barnslig»-kravet i pkt. 1. |

## 4. Skjermene som finnes

1. **Velg tema** — seks temakort (navn + eksempeloppgave), tre nivåkort,
   én startknapp. Startknappen er låst til et tema er valgt.
2. **Oppgave** — «bytt tema»-knapp, tema/nivå-merkelapp, streak-merkelapp
   (vises fra 2 på rad), framdriftslinje mot neste funn («7 / 10»),
   spørsmålet, svarfelt + knapp, hjelpetekst, tilbakemelding.
3. **Funn** — stikkord («Funn!»), kort med illustrasjon, variantnavn,
   artsnavn, vitenskapelig navn, «Nytt funn» / «Duplikat ×4», og
   «Ulv 3/6». Én knapp tilbake til oppgavene.
4. **Samling** — rutenett med alle 6 artene. Funne arter viser den
   sjeldneste varianten eleven har. Ikke-funne viser silhuett og «???».
   Hver rute har «2/3». Med bare 6 arter kan rutenettet virke tomt/lite
   på en full skjerm — vurder om det trenger et tomromsdesign (f.eks.
   plass satt av til «flere arter kommer») i stedet for å strekke seks
   ruter over hele bredden.
5. **Artsside** — stor illustrasjon, navn, vitenskapelig navn, 1–2
   fakta, og variantbrikkene (tre stykker). Brikker eleven ikke har er
   låst; klikk på en eid brikke bytter den store illustrasjonen.
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
- **Artsfaktaene.** 12 plassholdere merket `[FAKTA n – …]` i
  `js/data/species.js` — se `INNHOLDSINSTRUKS-FAKTA.md` for spesifikasjonen.
- **Kortbilde til forsiden**: `media/cards/<navn>.png`, og `og:image` i
  `index.html` når bildet finnes.

## 8. Sjekkliste før det er ferdig

- [ ] `css/placeholder.css` erstattet (og fila døpt om)
- [ ] `js/art.js` returnerer ekte illustrasjoner
- [ ] Alle tre variantene er visuelt skilt, og sjeldenheten leses raskt
- [ ] Silhuett-tilstanden røper ikke arten
- [ ] 390 px uten vannrett rulling, trykkflater ≥ 44 px, AA-kontrast
- [ ] Funnet tar 3–5 sekunder, og `prefers-reduced-motion` er håndtert
- [ ] `node games/feltboka/qa/check.mjs` er fortsatt grønn
