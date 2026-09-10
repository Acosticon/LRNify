# Innholdsinstruks — de 60 artsfaktaene

60 plassholdere (2 per art × 30 arter) i `js/data/species.js`, merket
`[FAKTA n – skrives i innholdsrunden]`. Denne fila er spesifikasjonen for
å fylle dem — skriv du selv, be ChatGPT, eller gi den til en fagperson.
Leveres tilbake som tabell (se format under), ikke som kodeendring —
jeg merger dem inn i `species.js` selv, det unngår at en manuell
JS-redigering knekker syntaksen QA-en sjekker.

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
  (trær). Ett faktum bør tåle et kjapt kildesøk hvis noen sjekker det.
- **Ingen `melanistisk`-/`albino`-fakta.** Faktaene handler om ARTEN,
  ikke om spillvariantene. Ikke skriv noe om at «denne kan finnes i en
  mørk utgave» — det er spillmekanikk, ikke biologi.

## De fire som trenger ekstra kontroll

GDD-en oppga disse på gruppenivå; koden har valgt én konkret art. Sjekk
at valget er det naturlige før du skriver fakta til dem — eller foreslå
et bedre artsvalg, så bytter jeg det i `species.js` (bare id/navn/
vitenskapelig endres, resten av spillet påvirkes ikke):

| GDD sa | Kode har valgt | Vitenskapelig |
|---|---|---|
| ugle | Kattugle | *Strix aluco* |
| frosk | Buttsnutefrosk | *Rana temporaria* |
| humle | Mørk jordhumle | *Bombus terrestris* |
| øyenstikker | (uspesifisert art) | *Aeshna juncea* |

Disse fire er trolig de tryggeste standardvalgene (vanligst i Norge),
men er ikke faglig kvalitetssikret utover det.

## Leveranseformat

Én rad per art, i denne rekkefølgen (samme som i `species.js`):

```
ulv          | Fakta 1 | Fakta 2
gaupe        | Fakta 1 | Fakta 2
rodrev       | Fakta 1 | Fakta 2
...
```

Bruk id-en i venstre kolonne (ikke det norske navnet) — den er
entydig og matcher direkte mot koden, uten fare for at «Kongeørn»
og «Havørn» blandes sammen i overføringen.

## De 30 artene

| id | Norsk navn | Vitenskapelig | Kategori |
|---|---|---|---|
| ulv | Ulv | *Canis lupus* | Pattedyr |
| gaupe | Gaupe | *Lynx lynx* | Pattedyr |
| rodrev | Rødrev | *Vulpes vulpes* | Pattedyr |
| elg | Elg | *Alces alces* | Pattedyr |
| radyr | Rådyr | *Capreolus capreolus* | Pattedyr |
| rein | Rein | *Rangifer tarandus* | Pattedyr |
| jerv | Jerv | *Gulo gulo* | Pattedyr |
| grevling | Grevling | *Meles meles* | Pattedyr |
| ekorn | Ekorn | *Sciurus vulgaris* | Pattedyr |
| hare | Hare | *Lepus timidus* | Pattedyr |
| kongeorn | Kongeørn | *Aquila chrysaetos* | Fugl |
| havorn | Havørn | *Haliaeetus albicilla* | Fugl |
| ravn | Ravn | *Corvus corax* | Fugl |
| kattugle | Kattugle | *Strix aluco* | Fugl — presisert fra «ugle» |
| flaggspett | Flaggspett | *Dendrocopos major* | Fugl |
| dompap | Dompap | *Pyrrhula pyrrhula* | Fugl |
| hoggorm | Hoggorm | *Vipera berus* | Andre dyr |
| frosk | Buttsnutefrosk | *Rana temporaria* | Andre dyr — presisert fra «frosk» |
| humle | Mørk jordhumle | *Bombus terrestris* | Andre dyr — presisert fra «humle» |
| oyenstikker | Øyenstikker | *Aeshna juncea* | Andre dyr — presisert fra «øyenstikker» |
| eik | Eik | *Quercus robur* | Plante |
| bjork | Bjørk | *Betula pubescens* | Plante |
| gran | Gran | *Picea abies* | Plante |
| furu | Furu | *Pinus sylvestris* | Plante |
| rogn | Rogn | *Sorbus aucuparia* | Plante |
| blabar | Blåbær | *Vaccinium myrtillus* | Plante |
| tyttebar | Tyttebær | *Vaccinium vitis-idaea* | Plante |
| rosslyng | Røsslyng | *Calluna vulgaris* | Plante |
| kantarell | Kantarell | *Cantharellus cibarius* | Sopp |
| fluesopp | Rød fluesopp | *Amanita muscaria* | Sopp |

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
**0 plassholder-fakta** i stedet for 60.
