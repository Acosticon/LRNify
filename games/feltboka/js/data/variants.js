/* =========================================================
   VARIANTER (GDD pkt. 7 og 8)
   Seks varianter med hver sin andel. Andelene er relative vekter,
   ikke prosent — de normaliseres ved trekning. Det betyr at en art
   som ikke tillater en variant (se `species.js` → `utenVarianter`)
   automatisk fordeler den variantens andel på resten, uten at noen
   tall må regnes om for hånd.

   `navnPlante` finnes fordi GDD pkt. 7.4 er tydelig: melanisme er
   ikke et biologisk fenomen hos planter og sopp, så varianten skal
   presenteres som «mørk variant» der — ikke feilaktig som melanisme.
   ========================================================= */

export const VARIANTER = [
  { id: 'vanlig',      navn: 'Vanlig',      andel: 70 },
  { id: 'gyllen',      navn: 'Gyllen',      andel: 15 },
  { id: 'albino',      navn: 'Albino',      andel: 6, navnPlante: 'Hvit' },
  { id: 'melanistisk', navn: 'Melanistisk', andel: 5, navnPlante: 'Mørk' },
  { id: 'nordlys',     navn: 'Nordlys',     andel: 3 },
  { id: 'krystall',    navn: 'Krystall',    andel: 1 }
];

export const VARIANT_IDER = VARIANTER.map(v => v.id);

const ETTER_ID = new Map(VARIANTER.map(v => [v.id, v]));

export function variant(id) {
  return ETTER_ID.get(id) || null;
}

/** Visningsnavnet varianten skal ha for akkurat denne arten. */
export function variantNavn(variantId, art) {
  const v = ETTER_ID.get(variantId);
  if (!v) return '';
  const erVekst = art && (art.kategori === 'plante' || art.kategori === 'sopp');
  return erVekst && v.navnPlante ? v.navnPlante : v.navn;
}

/** Variantene denne arten faktisk kan opptre i (GDD pkt. 7.3). */
export function varianterFor(art) {
  const utelatt = new Set(art?.utenVarianter || []);
  return VARIANTER.filter(v => !utelatt.has(v.id));
}
