/* =========================================================
   ILLUSTRASJONER
   ---------------------------------------------------------
   DETTE ER ETT AV TO STEDER DESIGNPROSESSEN ERSTATTER.
   (Det andre er css/placeholder.css.)

   Kontrakten resten av spillet forholder seg til er én funksjon:

       illustrasjon(art, variantId, { silhuett })  →  HTML-streng

   `EKTE_BILDER` er registeret over hvilke arter som har ferdig
   leverte bilder i media/arter/. En art som ikke står der (ennå)
   faller tilbake på den geometriske plassholderen — samme kategori-
   form som før, med stiplet ramme, så resten av samlingen ikke kan
   forveksles med ferdig grafikk mens den fylles på art for art.

   Silhuett-tilstanden (GDD pkt. 12: låst plass for arter eleven ikke
   har funnet) trenger ingen egen fil for ekte bilder — den er avledet
   fra bildets eget alfakanal ved å kjøre det gjennom
   `filter: brightness(0)`, som gjør alle synlige piksler solid sorte
   og lar gjennomsiktigheten stå urørt.
   ========================================================= */

const MEDIESTI = 'media/arter/';

/** Legg til en art her når filene for den er levert og lagt i media/arter/. */
const EKTE_BILDER = {
  ulv:    { vanlig: 'ulv-vanlig.png',    nordlys: 'ulv-nordlys.png',    krystall: 'ulv-krystall.png' },
  rodrev: { vanlig: 'rodrev-vanlig.png', nordlys: 'rodrev-nordlys.png', krystall: 'rodrev-krystall.png' },
  ekorn:  { vanlig: 'ekorn-vanlig.png',  nordlys: 'ekorn-nordlys.png',  krystall: 'ekorn-krystall.png' },
  kongeorn: { vanlig: 'kongeorn-vanlig.png', nordlys: 'kongeorn-nordlys.png', krystall: 'kongeorn-krystall.png' },
  hoggorm: { vanlig: 'hoggorm-vanlig.png', nordlys: 'hoggorm-nordlys.png', krystall: 'hoggorm-krystall.png' },
  blabar: { vanlig: 'blabar-vanlig.png', nordlys: 'blabar-nordlys.png', krystall: 'blabar-krystall.png' }
};

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

function ektBilde(art, variantId, silhuett) {
  const fil = EKTE_BILDER[art?.id]?.[variantId];
  if (!fil) return null;
  const src = MEDIESTI + fil;
  if (silhuett) {
    return `<img class="ill-ekte ill-ekte--silhuett" src="${src}" alt="Ikke funnet ennå">`;
  }
  return `<img class="ill-ekte" src="${src}" alt="${escape(art?.navn || '')}"
    data-art="${escape(art?.id || '')}" data-variant="${escape(variantId)}">`;
}

function plassholder(art, variantId, silhuett) {
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

/**
 * @param {object} art        art-objektet fra data/species.js
 * @param {string} variantId  f.eks. 'krystall'
 * @param {object} [valg]
 * @param {boolean} [valg.silhuett]  låst plass i samlingen (GDD pkt. 12)
 * @returns {string} HTML (img eller svg) som kan settes inn med innerHTML
 */
export function illustrasjon(art, variantId, { silhuett = false } = {}) {
  return ektBilde(art, variantId, silhuett) || plassholder(art, variantId, silhuett);
}
