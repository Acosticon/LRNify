# 3S1F beta – kunstbrief

Betaen er en fullstendig visuell omarbeiding av `games/3s1f/`. Spillogikken
(`game.js`, `events.js`) er kopiert uendret; det eneste unntaket er
lagringsnøkkelen, som er byttet til `3s1f.beta.save.v2` slik at beta og
hovedspill ikke overskriver hverandres lagrede spill på samme domene.

All ikonografi og illustrasjon ligger i **`art.js`**. Ingenting annet i
spillet tegner grafikk direkte. Det betyr at rasterkunst fra et bilde-AI kan
byttes inn ett sted om gangen, uten å røre render-laget.

---

## Hva som er bygget

| Funksjon i `art.js` | Brukes av | Format i dag |
|---|---|---|
| `voiceIcon(key)` | målere, stemmepiller, resultatkort, årsoppgjør, kurvelegende | SVG 32×32 |
| `voicePortrait(key)` | sluttrapportens tre fagpersoner | SVG 200×200, rund |
| `regionIcon(id, color)` | hendelseskort, sidefelt, resultatkort | SVG 32×32 |
| `newsSpot(kind)` | «Øyposten»-oppslaget | SVG 320×170, blekk på papir |
| `seal(color)` | ettermæle og merker | SVG 64×64 |
| `scarMark()` | tapte saker | SVG 64×64 |
| `heroArt()` | tittelskjermens bakgrunn | SVG 1200×640 |
| `transitionArt()` | bakgrunn bak årstallet mellom år | SVG 1200×640 |
| `pictogram(emoji)` | hendelsesikoner i sidefelt og medaljonger | SVG 32×32, 64 motiver |
| `pictogramNode(emoji, …)` | sporene som samler seg på kartet | SVG-gruppe, skalerbar |
| `iconChip(emoji, color)` | rammen rundt et hendelsesikon | medaljong + piktogram |
| `textureDefs()` | kornfiltre, satt inn én gang | SVG-filtre |

Hendelsesdatabasen merker hvert valg med en emoji. `PICTO` i `art.js` dekker
alle 64 som er i bruk, og `iconChip` faller tilbake til selve emojien hvis
noen legger til et motiv som ennå ikke er tegnet – da vises den i medaljongen
som før, uten at noe knekker.

`map.js` tegner øykartet selv. Det er den ene delen som ikke kan byttes ut
med et flatt bilde uten videre, siden hvert område må være klikkbart og
skifte tilstand.

---

## Slik byttes et element til rasterkunst

Alle funksjonene returnerer en HTML-streng. For å bytte til bilde:

```js
export function voicePortrait(key) {
  return `<img src="./assets/portrait-${key}.png" alt="" class="art-portrait">`;
}
```

Ingen andre filer må endres. CSS-klassene (`.art-ico`, `.art-portrait`,
`.art-seal`, `.art-spot`) styrer allerede størrelse og form.

---

## Prompt til bilde-AI

Lim inn hele stilbibelen under sammen med **ett** punkt fra asset-listen om
gangen. Uten bibelen som fast kontekst driver stilen fra bilde til bilde.

````
STYLE BIBLE — "Three Voices, One Future" game asset system

Painterly, semi-realistic editorial illustration — warm hand-painted digital
gouache texture, fine linework, dramatic rim lighting, slightly weathered
poster feel. Serious and dignified, never cartoonish or cute. Think: a modern
illustrated documentary poster crossed with a mid-century public-information
poster.

Core cast — reuse the SAME three people across every asset. Same faces, same
outfits; only pose and crop change:
- BUSINESS ("Næringslivet"): East Asian man, dark navy suit, arms crossed,
  city skyline and a construction crane behind him. Gold/blue palette, coin
  stacks and a rising bar chart nearby.
- PEOPLE ("Innbyggerne"): South Asian woman in a red/orange sari, arms
  crossed, a multigenerational group of townspeople behind her. Warm
  orange/terracotta palette, town buildings in the background.
- NATURE ("Naturen"): bearded man in an olive-green shirt, holding a seedling
  in cupped hands, forest/mountain/river landscape behind him. Green/teal
  palette.

Locked palette — respect in every asset:
  Background navy   #0A1622    Surface navy  #122334 / #1D3448
  Gold (business)   #E8C547    Coral (people) #E87D5B    Teal (nature) #5BBFAD
  Parchment #F4EFE5 with ink #171009  (newspaper assets only)

Hard rules:
- NO text, letters, numbers or UI chrome baked into any image. Every label is
  live HTML on top. Leave clean negative space where labels will sit.
- Consistent light direction (upper left) and linework weight across the set.
- Transparent PNG where noted; otherwise a flat background in the stated color.
- The three cast members must be recognisably the same people every time.

────────────────────────────────────────
ASSET LIST — generate one at a time
────────────────────────────────────────

1. VOICE ICONS — 3 files, 128×128, transparent
   Simplified semi-flat icons from each character's key prop: gold coin-stack
   with skyline; coral group-of-people; teal seedling in cupped hands. Must
   read clearly at 24 px.
   → replaces voiceIcon()

2. VOICE PORTRAITS — 3 files, 512×512, transparent outside a circular crop
   Shoulders-up portrait of each cast member, soft rim light, background scene
   readable but subordinate. Round crop.
   → replaces voicePortrait()

3. REGION ICONS — 6 files, 96×96, transparent, same treatment as #1
   Nordkysten wind turbine (#E8C547) · Skoglandet pines (#5BBFAD) ·
   Fjordbygdene barn and field (#7FB97F) · Vesthavet fishing boat (#4A9CC2) ·
   Havnebyen crane and factory (#9A8EC0) · Sentrum townscape (#E87D5B)
   → replaces regionIcon()

4. ISLAND MAP — 1 file, 1600×1160 (matches the 520×380 SVG viewBox)
   Top-down painterly island rendered as a NIGHT scene in the navy/teal
   palette so it sits on the dark background. Six clearly separated zones
   matching the regions above, each hinting at its theme through terrain and
   architecture. Warm light glowing from town windows. No text, no icons.
   NOTE: the map is interactive — regions must stay separable. Deliver the
   six zones as separate layers or separate PNGs with a shared canvas.

5. NEWSPAPER SPOTS — 4 files, 640×340, parchment #F4EFE5 with ink #171009
   1940s newspaper spot drawings, hatching instead of greyscale:
   economic scene · social scene · environmental scene · crisis scene
   (crisis: higher contrast, storm and flood).
   → replaces newsSpot()

6. SEALS AND SCAR — 200×200, transparent
   A wax-seal / ribbon-medal in gold, coral and teal variants for
   achievements, plus one charred torn-paper badge in burnt coral tones for
   lost cases.
   → replaces seal() and scarMark()

7. TITLE HERO — 1 file, 2400×1280
   The island seen from the sea at night, three small boats returning — one
   lit gold, one coral, one teal. Dramatic and calm. Keep the upper half
   low-contrast: the title typography sits there.
   → replaces heroArt()

8. YEAR-TRANSITION BACKGROUND — 1 file, 2400×1280
   Very low contrast, desaturated, dark navy. The island at a distance under
   changing light. A giant year number is drawn on top and must stay legible.
   → replaces transitionArt()

9. EVENT PICTOGRAMS — 64 files, 64×64, transparent, monochrome
   OPTIONAL. These already exist as vector line icons covering every event in
   the database (irrigation, mining, protests, flooding, smog …). Only worth
   redrawing if you want them painterly rather than linear; the line style is
   arguably the right call at 18 px.
   → replaces pictogram()
````

---

## Kjente begrensninger i dagens vektorversjon

- Portrettene er bygget i tre tonenivåer – blekk for hodet, en lysere tone
  for plagget, og et kantlys – men de er fortsatt silhuetter, ikke malte
  ansikter. Dette er den største gjenstående gevinsten ved rasterkunst.
- Kartet er ett bilde som tegnes på nytt for hver tilstandsendring. Skal det
  byttes mot malt kunst, må de seks områdene leveres som separate lag; ellers
  mister spilleren tilbakemeldingen på hvilket område som er åpent.
- `🐦`, `🐺` og `🐋` er tolket ganske fritt: fugl i profil, labbeavtrykk og
  en hval som mest leser som en fisk. Det er de tre motivene der et malt
  ikon ville sagt mest.
