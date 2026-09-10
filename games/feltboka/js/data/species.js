/* =========================================================
   ARTER — STARTKOLLEKSJONEN «NORSK NATUR» (GDD pkt. 6 og 9)

   TONET NED FOR MVP: 6 arter, ikke 30. Avgjort etter at
   30 arter × 6 varianter (180 samleobjekter) ble vurdert som for
   mye å produsere illustrasjoner til før hypotesen er testet — se
   DESIGN.md, «Avvik fra GDD v0.1». Flere arter er en ren
   datautvidelse siden (legg til et objekt her), ikke en omskriving.

   Fire kategorier er representert (pattedyr, fugl, andre dyr,
   plante) med en spredning i vekt, så trekningen har noe å vise
   fram fra første økt: ekorn og blåbær er nesten alltid et funn,
   ulv er sjelden.

   INNHOLD SOM IKKE ER FERDIG:
   - `fakta` er PLASSHOLDERE. Se INNHOLDSINSTRUKS-FAKTA.md.
     Merket [FAKTA …] slik at ingen plassholder kan gå i produksjon
     ubemerket; qa/check.mjs teller dem og rapporterer.
   ========================================================= */

const F = (n) => `[FAKTA ${n} – skrives i innholdsrunden]`;

export const ARTER = [
  { id: 'ulv',      navn: 'Ulv',      vitenskapelig: 'Canis lupus',      kategori: 'pattedyr', vekt: 3,  fakta: [F(1), F(2)] },
  { id: 'rodrev',   navn: 'Rødrev',   vitenskapelig: 'Vulpes vulpes',    kategori: 'pattedyr', vekt: 8,  fakta: [F(1), F(2)] },
  { id: 'ekorn',    navn: 'Ekorn',    vitenskapelig: 'Sciurus vulgaris', kategori: 'pattedyr', vekt: 10, fakta: [F(1), F(2)] },
  { id: 'kongeorn', navn: 'Kongeørn', vitenskapelig: 'Aquila chrysaetos', kategori: 'fugl',     vekt: 2,  fakta: [F(1), F(2)] },
  { id: 'hoggorm',  navn: 'Hoggorm',  vitenskapelig: 'Vipera berus',     kategori: 'annet',    vekt: 5,  fakta: [F(1), F(2)] },
  { id: 'blabar',   navn: 'Blåbær',   vitenskapelig: 'Vaccinium myrtillus', kategori: 'plante', vekt: 10, fakta: [F(1), F(2)] }
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
