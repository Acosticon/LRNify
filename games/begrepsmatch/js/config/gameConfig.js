/* =========================================================
   BEGREPSMATCH — sentral konfigurasjon
   Alle tall som styrer balanse (trekk, bonusverdier, sjanser,
   poeng) samles her, slik at spillet er enkelt å justere uten
   å røre spill-logikken. Grafikk pekes til via TILE_TYPES —
   bytt en image-sti for å bytte utseende, uten kode-endring.
   ========================================================= */

export const BOARD_SIZE = 8;
export const STARTING_MOVES = 20;

/* Vanlige brikketyper. `id` brukes internt i spill-logikken,
   `image` peker til asset-filen som skal tegnes. Legg til/fjern
   typer her — resten av spillet bryr seg bare om antallet. */
export const TILE_TYPES = {
  blue:   { id: 'blue',   image: 'assets/tiles/blue.svg',   label: 'Blå' },
  green:  { id: 'green',  image: 'assets/tiles/green.svg',  label: 'Grønn' },
  purple: { id: 'purple', image: 'assets/tiles/purple.svg', label: 'Lilla' },
  yellow: { id: 'yellow', image: 'assets/tiles/yellow.svg', label: 'Gul' },
  orange: { id: 'orange', image: 'assets/tiles/orange.svg', label: 'Oransje' },
  cyan:   { id: 'cyan',   image: 'assets/tiles/cyan.svg',   label: 'Cyan' }
};

export const TILE_TYPE_IDS = Object.keys(TILE_TYPES);

/* Bonusverdier en nummerert brikke kan ha, med relativ vekt.
   Høyere vekt = mer vanlig. 3 er vanlig, 5 mindre vanlig, 8 sjelden. */
export const BONUS_VALUES = [
  { value: 3, weight: 70 },
  { value: 5, weight: 25 },
  { value: 8, weight: 5 }
];

/* Sjansen for at en ny brikke som faller inn er en bonusbrikke. */
export const BONUS_TILE_CHANCE = 0.07;

/* Poengsystem. Alt ligger her slik at balansering er én endring. */
export const SCORING = {
  match3: 100,
  match4: 200,
  match5Plus: 300,
  correctAnswer: 250,
  /* Hver cascade-runde etter den første ganger poengsummen med
     (1 + cascadeIndex * cascadeMultiplierStep). */
  cascadeMultiplierStep: 0.5
};

/* Hvor mange nylig stilte spørsmål QuestionManager unngår å gjenta. */
export const RECENT_QUESTION_HISTORY = 5;
