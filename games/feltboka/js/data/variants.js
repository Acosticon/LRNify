/* =========================================================
   VARIANTER (GDD pkt. 7 og 8)

   TONET NED FOR MVP: tre varianter, ikke seks. Vanlig er
   grunnfunnet; Nordlys og Krystall er de to GDD selv kaller
   «karakteristiske» (pkt. 7.5–7.6), og ingen av dem bærer en
   biologisk påstand — begge gjelder derfor likt for dyr og
   planter, uten unntak. Det er det som gjorde kuttet enkelt:
   Gyllen, Albino og Melanistisk er de tre som enten er mindre
   særpregede eller (Albino/Melanistisk) krever art-for-art-unntak
   for å ikke bli biologisk feil på planter. Se DESIGN.md.

   Andelene er hentet direkte fra GDD-ens egne tall for Nordlys og
   Krystall (3 % og 1 %); Vanlig tar resten. Vektene er relative,
   ikke prosent — de normaliseres ved trekning.
   ========================================================= */

export const VARIANTER = [
  { id: 'vanlig',   navn: 'Vanlig',   andel: 96 },
  { id: 'nordlys',  navn: 'Nordlys',  andel: 3 },
  { id: 'krystall', navn: 'Krystall', andel: 1 }
];

export const VARIANT_IDER = VARIANTER.map(v => v.id);

const ETTER_ID = new Map(VARIANTER.map(v => [v.id, v]));

export function variant(id) {
  return ETTER_ID.get(id) || null;
}

export function variantNavn(variantId, _art) {
  return ETTER_ID.get(variantId)?.navn || '';
}

/** Variantene denne arten faktisk kan opptre i. Ingen av de tre har
    unntak i dag, men arten kan sette `utenVarianter` for å utelukke
    en variant den ikke passer visuelt til. */
export function varianterFor(art) {
  const utelatt = new Set(art?.utenVarianter || []);
  return VARIANTER.filter(v => !utelatt.has(v.id));
}
