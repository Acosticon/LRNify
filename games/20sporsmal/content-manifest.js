/* =========================================================
   INNHOLDSMANIFEST
   Eneste sted man registrerer et nytt fag/tema. Spillmotoren og
   UI-et vet ingenting om hva som finnes her — de leser bare denne
   listen og laster inn temaets pakke via `load()` når spilleren
   velger det. Se README.md for stegene ved å legge til et nytt tema.
   ========================================================= */

export const MANIFEST = [
  {
    id: 'science',
    name: 'Naturfag',
    topics: [
      {
        id: 'cells',
        name: 'Celler',
        load: () => import('./content/science/cells/index.js'),
      },
    ],
  },
];
