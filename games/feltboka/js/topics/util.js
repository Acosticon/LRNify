/* Delte hjelpere for oppgavegeneratorene. Alle generatorer tar
   `rand` som argument (aldri Math.random direkte) slik at QA kan
   kjøre dem med en fast frøverdi. */

export const heltall = (rand, min, max) => min + Math.floor(rand() * (max - min + 1));

export const velg = (rand, liste) => liste[Math.floor(rand() * liste.length)];

const HEVET = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻' };

/** 3 → «³». Brukes i potensoppgaver. */
export const hev = (n) => String(n).split('').map(c => HEVET[c] ?? c).join('');

/** Negative tall får parentes: 5 → «5», -5 → «(-5)». */
export const paren = (n) => (n < 0 ? `(${n})` : String(n));

/** «+ 4» / «− 4» — for ledd som kan ha begge fortegn. */
export const ledd = (n) => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);
