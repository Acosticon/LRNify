/* =========================================================
   ILLUSTRASJONER — PLASSHOLDER
   ---------------------------------------------------------
   DETTE ER ETT AV TO STEDER DESIGNPROSESSEN SKAL ERSTATTE.
   (Det andre er css/placeholder.css.)

   Kontrakten resten av spillet forholder seg til er én funksjon:

       illustrasjon(art, variantId, { silhuett })  →  SVG-streng

   Alt annet i denne fila er midlertidig fyll: enkle geometriske
   former per kategori, ikke per art. Alle 30 artene i samme
   kategori ser derfor like ut nå, med vilje — det gjør det umulig å
   forveksle plassholderen med et ferdig uttrykk.

   Fargene settes IKKE her. SVG-en arver dem fra CSS-variabler som
   variantklassen på foreldre-elementet definerer, slik at en variant
   kan endres uten å røre denne fila:

       --ill-flate    flatefarge
       --ill-strek    konturfarge
       --ill-glans    aksent/lyseffekt

   Når ekte illustrasjoner kommer, er det to lovlige veier:
   1) behold funksjonen og returner <img>/<svg> per art og variant, eller
   2) behold én grunnform per art og la varianten være et CSS-lag oppå.
   Se DESIGNINSTRUKS.md — valget har konsekvenser for hvor mange
   filer som må produseres (30 mot 180).
   ========================================================= */

const FORMER = {
  pattedyr: '<path d="M18 62c0-14 10-24 22-24s22 10 22 24c0 10-9 16-22 16S18 72 18 62Z"/>'
          + '<path d="M26 40l-4-14 14 8M54 40l4-14-14 8"/>',
  fugl:     '<path d="M22 66c8-22 20-32 38-34-4 12-2 20 4 26-12 10-28 12-42 8Z"/>'
          + '<path d="M60 32l10-4-8 10"/>',
  annet:    '<circle cx="40" cy="56" r="22"/><path d="M40 34v-12M28 40l-8-8M52 40l8-8"/>',
  plante:   '<path d="M40 16 24 46h32L40 16Z"/><path d="M40 40 26 66h28L40 40Z"/><path d="M40 66v12"/>',
  sopp:     '<path d="M16 50c0-14 11-24 24-24s24 10 24 24H16Z"/><path d="M32 50v18a8 8 0 0 0 16 0V50"/>'
};

const escape = (s) => String(s).replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

/**
 * @param {object} art        art-objektet fra data/species.js
 * @param {string} variantId  f.eks. 'gyllen'
 * @param {object} [valg]
 * @param {boolean} [valg.silhuett]  låst plass i samlingen (GDD pkt. 12)
 * @returns {string} SVG som kan settes inn med innerHTML
 */
export function illustrasjon(art, variantId, { silhuett = false } = {}) {
  const form = FORMER[art?.kategori] || FORMER.annet;
  const merke = escape((art?.navn || '?').slice(0, 2).toUpperCase());

  if (silhuett) {
    return `<svg class="ill ill--silhuett" viewBox="0 0 80 90" role="img"
      aria-label="Ikke funnet ennå" focusable="false">
      <g class="ill-form" fill="currentColor" stroke="none" opacity=".28">${form}</g>
      <text class="ill-merke" x="40" y="86" text-anchor="middle">?</text>
    </svg>`;
  }

  return `<svg class="ill ill--${escape(variantId)}" viewBox="0 0 80 90" role="img"
    aria-label="${escape(art?.navn || '')}" focusable="false"
    data-art="${escape(art?.id || '')}" data-variant="${escape(variantId)}">
    <g class="ill-form">${form}</g>
    <text class="ill-merke" x="40" y="86" text-anchor="middle">${merke}</text>
  </svg>`;
}
