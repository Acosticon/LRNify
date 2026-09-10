/* =========================================================
   ARTER — STARTKOLLEKSJONEN «NORSK NATUR» (GDD pkt. 6 og 9)
   30 arter. Hver art har én numerisk vekt som styrer hvor ofte
   den trekkes. Høy vekt = vanlig funn.

   INNHOLD SOM IKKE ER FERDIG:
   - `fakta` er PLASSHOLDERE. De skal skrives (og faktasjekkes) i
     en egen innholdsrunde — se DESIGNINSTRUKS.md. De er med vilje
     merket [FAKTA …] slik at ingen plassholder kan gå i produksjon
     ubemerket; qa/check.mjs teller dem og rapporterer.
   - `vitenskapelig` er satt, men skal gjennom faglig kontroll i
     samme runde. Der arten i GDD-en er oppgitt på gruppenivå
     («ugle», «humle», «øyenstikker») er det valgt én konkret art,
     og valget er markert med `presisert: true`.

   `utenVarianter` er artens unntak fra variantlista (GDD pkt. 7.3:
   albino skal bare brukes der den gir visuell mening). Lista her er
   et førsteutkast fra logikkens side; den endelige avgjørelsen hører
   hjemme i designprosessen, som ser illustrasjonene.
   ========================================================= */

const F = (n) => `[FAKTA ${n} – skrives i innholdsrunden]`;

export const ARTER = [
  /* --- Pattedyr --- */
  { id: 'ulv',        navn: 'Ulv',        vitenskapelig: 'Canis lupus',            kategori: 'pattedyr', vekt: 3,  fakta: [F(1), F(2)] },
  { id: 'gaupe',      navn: 'Gaupe',      vitenskapelig: 'Lynx lynx',              kategori: 'pattedyr', vekt: 3,  fakta: [F(1), F(2)] },
  { id: 'rodrev',     navn: 'Rødrev',     vitenskapelig: 'Vulpes vulpes',          kategori: 'pattedyr', vekt: 8,  fakta: [F(1), F(2)] },
  { id: 'elg',        navn: 'Elg',        vitenskapelig: 'Alces alces',            kategori: 'pattedyr', vekt: 5,  fakta: [F(1), F(2)] },
  { id: 'radyr',      navn: 'Rådyr',      vitenskapelig: 'Capreolus capreolus',    kategori: 'pattedyr', vekt: 8,  fakta: [F(1), F(2)] },
  { id: 'rein',       navn: 'Rein',       vitenskapelig: 'Rangifer tarandus',      kategori: 'pattedyr', vekt: 4,  fakta: [F(1), F(2)] },
  { id: 'jerv',       navn: 'Jerv',       vitenskapelig: 'Gulo gulo',              kategori: 'pattedyr', vekt: 1,  fakta: [F(1), F(2)] },
  { id: 'grevling',   navn: 'Grevling',   vitenskapelig: 'Meles meles',            kategori: 'pattedyr', vekt: 6,  fakta: [F(1), F(2)] },
  { id: 'ekorn',      navn: 'Ekorn',      vitenskapelig: 'Sciurus vulgaris',       kategori: 'pattedyr', vekt: 10, fakta: [F(1), F(2)] },
  { id: 'hare',       navn: 'Hare',       vitenskapelig: 'Lepus timidus',          kategori: 'pattedyr', vekt: 9,  fakta: [F(1), F(2)] },

  /* --- Fugler --- */
  { id: 'kongeorn',   navn: 'Kongeørn',   vitenskapelig: 'Aquila chrysaetos',      kategori: 'fugl', vekt: 2,  fakta: [F(1), F(2)] },
  { id: 'havorn',     navn: 'Havørn',     vitenskapelig: 'Haliaeetus albicilla',   kategori: 'fugl', vekt: 3,  fakta: [F(1), F(2)] },
  { id: 'ravn',       navn: 'Ravn',       vitenskapelig: 'Corvus corax',           kategori: 'fugl', vekt: 7,  fakta: [F(1), F(2)] },
  { id: 'kattugle',   navn: 'Kattugle',   vitenskapelig: 'Strix aluco',            kategori: 'fugl', vekt: 5,  fakta: [F(1), F(2)], presisert: true },
  { id: 'flaggspett', navn: 'Flaggspett', vitenskapelig: 'Dendrocopos major',      kategori: 'fugl', vekt: 7,  fakta: [F(1), F(2)] },
  { id: 'dompap',     navn: 'Dompap',     vitenskapelig: 'Pyrrhula pyrrhula',      kategori: 'fugl', vekt: 8,  fakta: [F(1), F(2)] },

  /* --- Andre dyr --- */
  { id: 'hoggorm',    navn: 'Hoggorm',    vitenskapelig: 'Vipera berus',           kategori: 'annet', vekt: 5, fakta: [F(1), F(2)] },
  { id: 'frosk',      navn: 'Buttsnutefrosk', vitenskapelig: 'Rana temporaria',    kategori: 'annet', vekt: 9, fakta: [F(1), F(2)], presisert: true },
  { id: 'humle',      navn: 'Mørk jordhumle', vitenskapelig: 'Bombus terrestris',  kategori: 'annet', vekt: 10, fakta: [F(1), F(2)], presisert: true },
  { id: 'oyenstikker', navn: 'Øyenstikker', vitenskapelig: 'Aeshna juncea',        kategori: 'annet', vekt: 7, fakta: [F(1), F(2)], presisert: true },

  /* --- Planter --- */
  { id: 'eik',        navn: 'Eik',        vitenskapelig: 'Quercus robur',          kategori: 'plante', vekt: 6,  fakta: [F(1), F(2)], utenVarianter: ['albino'] },
  { id: 'bjork',      navn: 'Bjørk',      vitenskapelig: 'Betula pubescens',       kategori: 'plante', vekt: 10, fakta: [F(1), F(2)], utenVarianter: ['albino'] },
  { id: 'gran',       navn: 'Gran',       vitenskapelig: 'Picea abies',            kategori: 'plante', vekt: 10, fakta: [F(1), F(2)], utenVarianter: ['albino'] },
  { id: 'furu',       navn: 'Furu',       vitenskapelig: 'Pinus sylvestris',       kategori: 'plante', vekt: 9,  fakta: [F(1), F(2)], utenVarianter: ['albino'] },
  { id: 'rogn',       navn: 'Rogn',       vitenskapelig: 'Sorbus aucuparia',       kategori: 'plante', vekt: 8,  fakta: [F(1), F(2)], utenVarianter: ['albino'] },
  { id: 'blabar',     navn: 'Blåbær',     vitenskapelig: 'Vaccinium myrtillus',    kategori: 'plante', vekt: 10, fakta: [F(1), F(2)], utenVarianter: ['albino'] },
  { id: 'tyttebar',   navn: 'Tyttebær',   vitenskapelig: 'Vaccinium vitis-idaea',  kategori: 'plante', vekt: 9,  fakta: [F(1), F(2)], utenVarianter: ['albino'] },
  { id: 'rosslyng',   navn: 'Røsslyng',   vitenskapelig: 'Calluna vulgaris',       kategori: 'plante', vekt: 8,  fakta: [F(1), F(2)], utenVarianter: ['albino'] },

  /* --- Sopp --- */
  { id: 'kantarell',  navn: 'Kantarell',  vitenskapelig: 'Cantharellus cibarius',  kategori: 'sopp', vekt: 5, fakta: [F(1), F(2)], utenVarianter: ['albino'] },
  { id: 'fluesopp',   navn: 'Rød fluesopp', vitenskapelig: 'Amanita muscaria',     kategori: 'sopp', vekt: 6, fakta: [F(1), F(2)], utenVarianter: ['albino'] }
];

export const KATEGORIER = {
  pattedyr: 'Pattedyr',
  fugl: 'Fugler',
  annet: 'Andre dyr',
  plante: 'Planter',
  sopp: 'Sopp'
};

const ETTER_ID = new Map(ARTER.map(a => [a.id, a]));

export function art(id) {
  return ETTER_ID.get(id) || null;
}
