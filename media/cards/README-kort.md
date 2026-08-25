# Kortbilder

Bildene i denne mappa (og i `media/aktiviteter/`, `media/tools/`) er
kortkunsten som vises i spillrutenettet på forsiden — én PNG per
mappenavn, hentet automatisk av `renderCards()` i `index.html`. Se
kommentarene over `GAMES`/`TEACHER_RESOURCES`/`ACTIVITIES`/`LEK` der.

## To stiler om hverandre i dag

De fleste bildene er bestilte illustrasjoner: fargerike, malte scener
uten tekst, laget av noen med et bildeverktøy.

Sytten av dem er i stedet generert — et enkelt, systematisk «emblem»:
fagfargen fra katalogoppføringen på en rund plate med tykk kontur og
forskjøvet skygge (samme visuelle språk som knappene og kortene ellers
på siden), det tilhørende ikonet fra `ICONS`-objektet i `index.html`
forstørret i midten, og en liten fagmerkelapp under. Ingen scene, ingen
forsøk på å etterligne de malte illustrasjonene — det er bevisst en
annen, enklere stil, ikke en dårlig kopi av den første.

Disse sytten kom til fordi de rett og slett manglet bilde helt (falt
tilbake på et generisk SVG-ikon i grensesnittet) da de ble oppdaget i en
gjennomgang av alt innhold på siden, 21.–22. august 2026. Generatoren
som laget dem — mal, fargekontrastberegning, Chromium-rendring — ligger
ikke i dette repoet; den kjørte i en engangs bygge-økt. Skal et bilde i
denne stilen lages på nytt eller for et nytt spill, er oppskriften:

1. Fargen og ikon-nøkkelen kommer fra spillets oppføring i `index.html`
   (feltene `color` og `icon`).
2. Sirkelens kontrast (hvitt eller mørkt ikon) avgjøres av fargens
   relative luminans (WCAG-formelen) — lyse aksentfarger (som
   `#ffc24d`) får et ink-farget ikon, mørke får et krem-farget.
3. Eksporteres som 1000×1000 PNG.

## Bytt ut med ekte kortkunst

Alle sytten emblem-kortene kan trygt byttes ut med en bestilt
illustrasjon når/hvis en sånn lages — bare legg PNG-en i samme mappe med
samme filnavn (f.eks. `atombyggeren.png`), i omtrent samme
størrelsesorden (1000–1254 px, kvadratisk). Ingen kodeendring trengs;
`renderCards()` bryr seg ikke om hvilken stil bildet er i.

**Filene det gjelder:** beinjakten, ordkjedeverkstedet, ordtoget,
setningskirurgen, tidslinjen, vinkeljakten, vinkelforsvarer,
vinkelspillet, likningsbalansen, lopeilden, klimakoden, grafkjoreren,
jakten, atombyggeren, sannsynlighetslabben, formskift (i
`media/cards/`), og tankesky, villeduheller (i `media/aktiviteter/`).

## Målene i emblem-malen

`formskift.png` ble laget i august 2026 ved å måle opp de eksisterende
emblem-kortene piksel for piksel, siden generatoren ikke finnes her.
Målene under er de som gjelder, slik neste kort kan lages likt uten å
utlede dem på nytt (alt i et 1000 × 1000-lerret):

| Element | Mål |
| --- | --- |
| Bakgrunn | `#fff9f0`, med prikkegitter `#f0eae1`, r = 2,75, rutemål 45,8 |
| Bleik sirkel | sentrum (499, 469), r = 459, farge = kremfargen blandet 10 % mot aksentfargen |
| Aksentprikker | (108, 98) r 12 · (158, 880) r 8 · (862, 128) r 6 · (890, 900) r 12, blandet 50 % |
| Skive | sentrum (499, 437), r = 247 i aksentfargen, på en ink-sirkel `#2b2118` med r = 259 |
| Skiveskygge | samme ink-sirkel forskjøvet (+24, +24) |
| Ikon | ikonets omriss normalisert så største mål blir 233 px, sentrert i skiva |
| Etikett | plate h = 72 med topp i y = 747, sentrert i x; ink-ramme 6 px utenfor, skygge (+10, +10) |
| Etikettekst | Nunito 900, versaler, høyde 27 px; «MATEMATIKK» er 236 px bred, plata 311 px |

Kontrastregelen står over: relativ luminans over ca. 0,35 gir ink-farget
ikon og tekst, ellers kremfarget.
