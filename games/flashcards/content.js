/* =========================================================
   FLASHCARDS — innhold
   Ett sett per tema. Legg til flere sett ved å pushe et nytt
   objekt inn i FLASHCARD_SETS — appen henter automatisk opp
   et valgskjerm for tema når det er mer enn ett sett.
   ========================================================= */
const FLASHCARD_SETS = [
  {
    id: 'celler',
    fag: 'Naturfag',
    tittel: 'Cellen',
    emoji: '🔬',
    farge: '#0d9488',
    beskrivelse: '10 sentrale begreper om cellen og byggesteinene i alt levende.',
    kort: [
      { id: 'celle', begrep: 'Celle', definisjon: 'Den minste levende byggesteinen i alle organismer.' },
      { id: 'cellemembran', begrep: 'Cellemembran', definisjon: 'Tynn hinne som omgir cella og bestemmer hva som slipper inn og ut.' },
      { id: 'cellekjerne', begrep: 'Cellekjerne', definisjon: 'Styrer det som skjer i cella og inneholder arvestoffet.' },
      { id: 'cytoplasma', begrep: 'Cytoplasma', definisjon: 'Væsken inne i cella som organellene flyter rundt i.' },
      { id: 'mitokondrie', begrep: 'Mitokondrie', definisjon: 'Organellen som frigjør energi fra næringsstoffer til cella.' },
      { id: 'cellevegg', begrep: 'Cellevegg', definisjon: 'Stiv vegg utenfor cellemembranen som gir planteceller form og støtte.' },
      { id: 'kloroplast', begrep: 'Kloroplast', definisjon: 'Organellen i planteceller der fotosyntesen skjer.' },
      { id: 'dna', begrep: 'DNA', definisjon: 'Arvestoffet som inneholder oppskriften på hvordan en organisme skal bygges opp.' },
      { id: 'encellet', begrep: 'Encellet organisme', definisjon: 'En organisme som består av bare én eneste celle.' },
      { id: 'flercellet', begrep: 'Flercellet organisme', definisjon: 'En organisme som er bygd opp av mange celler som samarbeider.' }
    ]
  }
];
