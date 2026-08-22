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
jakten, atombyggeren, sannsynlighetslabben (i `media/cards/`), og
tankesky, villeduheller (i `media/aktiviteter/`).
