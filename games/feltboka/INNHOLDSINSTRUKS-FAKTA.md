# Innholdsinstruks — de 12 artsfaktaene

12 plassholdere (2 per art × 6 arter) i `js/data/species.js`, merket
`[FAKTA n – skrives i innholdsrunden]`. Denne fila er spesifikasjonen for
å fylle dem — skriv du selv, be ChatGPT, eller gi den til en fagperson.
Leveres tilbake som tabell (se format under), ikke som kodeendring —
jeg merger dem inn i `species.js` selv, det unngår at en manuell
JS-redigering knekker syntaksen QA-en sjekker.

(Var 60 fakta for 30 arter — tonet ned samtidig med artstallet, se
`DESIGN.md`. Flere arter er en ren datautvidelse senere, og da gjelder
akkurat denne instruksen igjen for de nye.)

## Hvor de vises

Artssiden (`js/main.js` → `tegnArtsside`), som en enkel liste rett under
navn og vitenskapelig navn. Ikke overskrifter, ikke lange avsnitt — én
setning per punkt, lesbar på et par sekunder på en mobilskjerm.

## Rammer

- **Nøyaktig 2 fakta per art.** Skjemaet er `fakta: [tekst1, tekst2]`.
  (GDD-en åpner for opptil 3; vi står ved 2 — det er nok til å holde
  farten oppe mellom oppgavene, og det er lettere å redigere likt.)
- **Én setning hver, maks ca. 110 tegn.** Kortet er smalt; en lang
  setning brekker stygt på mobil. Kort og skarpt slår utfyllende.
- **13–16 år, ikke barnslig.** Skriv til en ungdomsskoleelev, ikke til
  en 8-åring. Unngå «visste du at…»-åpninger og utropstegn — la
  faktumet bære seg selv.
- **De to faktaene skal ikke overlappe.** Ett om biologi/atferd, ett om
  noe annet (utbredelse, rekord, forveksling med noe annet, hvorfor
  navnet er som det er) — ikke to varianter av samme observasjon.
- **Ingen skremselsfakta uten balanse.** Hoggorm er giftig — grei det
  nøkternt, ikke dramatiserende. Spillet skal gjøre elever nysgjerrige
  på norsk natur, ikke redde.
- **Skriv med egne ord.** Ikke kopier setninger rett fra Wikipedia,
  Artsdatabanken eller Store norske leksikon — les kilden, skriv om.
  Foretrukne kilder: Artsdatabanken, Miljødirektoratet, Store norske
  leksikon, Norsk Ornitologisk Forening (fugler), Skogkurs/NIBIO
  (trær/planter). Ett faktum bør tåle et kjapt kildesøk hvis noen
  sjekker det.
- **Ingen `nordlys`-/`krystall`-fakta.** Faktaene handler om ARTEN, ikke
  om spillvariantene. Ikke skriv noe om at «denne kan finnes dekket av
  krystall» — det er spillmekanikk, ikke biologi.

## Leveranseformat

Én rad per art, i denne rekkefølgen (samme som i `species.js`):

```
ulv       | Fakta 1 | Fakta 2
rodrev    | Fakta 1 | Fakta 2
ekorn     | Fakta 1 | Fakta 2
kongeorn  | Fakta 1 | Fakta 2
hoggorm   | Fakta 1 | Fakta 2
blabar    | Fakta 1 | Fakta 2
```

Bruk id-en i venstre kolonne (ikke det norske navnet) — entydig, og
matcher direkte mot koden.

## De 6 artene

| id | Norsk navn | Vitenskapelig | Kategori |
|---|---|---|---|
| ulv | Ulv | *Canis lupus* | Pattedyr |
| rodrev | Rødrev | *Vulpes vulpes* | Pattedyr |
| ekorn | Ekorn | *Sciurus vulgaris* | Pattedyr |
| kongeorn | Kongeørn | *Aquila chrysaetos* | Fugl |
| hoggorm | Hoggorm | *Vipera berus* | Andre dyr |
| blabar | Blåbær | *Vaccinium myrtillus* | Plante |

Alle seks er entydige arter — ingen er presisert fra et gruppenavn i
GDD-en, så det er ingen artsvalg å bekrefte denne runden.

## To eksempler på riktig kalibrering

**Rødrev** (godkjent nivå):
1. «Rødreven jakter mest i skumringen og hører mus grave under snøen.»
2. «Den finnes over hele landet, fra fjæra til høyfjellet.»

**Ikke slik** (for barnslig / for teknisk):
- ~~«Visste du at reven har en SUPERKUL hale?!»~~ (barnslig)
- ~~«Vulpes vulpes tilhører familien Canidae og har diploid
  kromosomtall 2n=34.»~~ (leksikalt, ikke lesbart på et kort)

## Når faktaene er klare

Send tabellen tilbake. Jeg setter dem inn i `js/data/species.js`
(erstatter `fakta: [F(1), F(2)]` med de faktiske tekstene) og kjører
`node games/feltboka/qa/check.mjs`, som da skal rapportere
**0 plassholder-fakta** i stedet for 12.
