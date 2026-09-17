/* =========================================================
   BEGREPSBLOKK — sentral konfigurasjon.
   Alle tall som styrer balanse (brettstørrelse, spørsmåls-
   sjanse, poeng) samles her. Fargene i BLOCK_TYPES er en
   midlertidig, klassisk "block blast"-palett — sett `image`
   på en type for å bytte den til egen grafikk (SVG/PNG) uten
   å røre resten av koden.
   ========================================================= */

export const BOARD_SIZE = 8;
export const TRAY_SIZE = 3;

/* Blokktyper. `id` brukes internt, `color` er flatfargen som
   vises når `image` er tom. Legg til/fjern typer her — resten
   av spillet bryr seg bare om antallet. */
export const BLOCK_TYPES = {
  blue:   { id: 'blue',   color: '#2f6fed', image: null, label: 'Blå' },
  green:  { id: 'green',  color: '#22b573', image: null, label: 'Grønn' },
  purple: { id: 'purple', color: '#9147e8', image: null, label: 'Lilla' },
  yellow: { id: 'yellow', color: '#eab308', image: null, label: 'Gul' },
  orange: { id: 'orange', color: '#f2734f', image: null, label: 'Oransje' },
  pink:   { id: 'pink',   color: '#ec4899', image: null, label: 'Rosa' }
};

export const BLOCK_TYPE_IDS = Object.keys(BLOCK_TYPES);

/* Sjansen for at et fagspørsmål trigges etter et trekk (istedenfor
   en reklame). ~0.2 gir i snitt ett spørsmål hvert 4.-6. trekk. */
export const QUESTION_CHANCE = 0.2;

/* Hvor mange nylig stilte spørsmål QuestionManager unngår å gjenta. */
export const RECENT_QUESTION_HISTORY = 5;

/* Poengsystem. */
export const SCORING = {
  perCellPlaced: 2,
  perLineClearBase: 80,
  /* Ekstra multiplikator per linje utover den første, når flere
     rader/kolonner ryddes i samme trekk. */
  multiLineBonusStep: 0.5
};
