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

   Fakta er levert og faktasjekket for alle 6 — se
   INNHOLDSINSTRUKS-FAKTA.md for rammene faktaene ble skrevet etter.
   Fakta for de 24 artene fra den opprinnelige (før-nedskalerte) listen
   er tatt vare på i BACKLOG-ARTER-FAKTA.md, klare til å limes inn her
   den dagen arts-utvalget utvides.
   ========================================================= */

export const ARTER = [
  { id: 'ulv',      navn: 'Ulv',      vitenskapelig: 'Canis lupus',      kategori: 'pattedyr', vekt: 3,
    fakta: ['Ulver lever ofte i familiegrupper der foreldre og unger samarbeider om jakt og valpepass.',
            'Unge ulver kan vandre over tusen kilometer før de finner et område og en partner.'] },
  { id: 'rodrev',   navn: 'Rødrev',   vitenskapelig: 'Vulpes vulpes',    kategori: 'pattedyr', vekt: 8,
    fakta: ['Rødreven jakter mest i skumringen og kan høre smågnagere bevege seg under snøen.',
            'Den finnes over hele landet, fra kysten til høyfjellet.'] },
  { id: 'ekorn',    navn: 'Ekorn',    vitenskapelig: 'Sciurus vulgaris', kategori: 'pattedyr', vekt: 10,
    fakta: ['Ekorn lagrer frø og nøtter i mange små gjemmesteder og finner igjen en del av dem senere.',
            'Den lange halen hjelper ekornet med balanse når det hopper mellom greiner.'] },
  { id: 'kongeorn', navn: 'Kongeørn', vitenskapelig: 'Aquila chrysaetos', kategori: 'fugl',     vekt: 2,
    fakta: ['Kongeørna kan se små byttedyr på lang avstand mens den kretser høyt over bakken.',
            'Et kongeørnpar kan bruke det samme territoriet og de samme reirplassene i mange år.'] },
  { id: 'hoggorm',  navn: 'Hoggorm',  vitenskapelig: 'Vipera berus',     kategori: 'annet',    vekt: 5,
    fakta: ['Hoggormen bruker gift til å fange bytte, men bitt på mennesker er sjelden livstruende.',
            'Den er verdens nordligst utbredte slange og finnes også nord for polarsirkelen.'] },
  { id: 'blabar',   navn: 'Blåbær',   vitenskapelig: 'Vaccinium myrtillus', kategori: 'plante', vekt: 10,
    fakta: ['Blåbærplanten sprer seg med underjordiske stengler og kan danne store sammenhengende tepper.',
            'Det blå fargestoffet sitter også i fruktkjøttet, i motsetning til hos hageblåbær.'] }
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
