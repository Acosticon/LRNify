/* =========================================================
   FAGDATA — Naturfag / Celler
   Denne fila kjenner ikke til spill-motoren i det hele tatt.
   Den beskriver bare et emne og spørsmålene som hører til.
   `distractors` er valgfritt — når det mangler, velger
   QuestionManager automatisk tre andre begreper fra settet.
   ========================================================= */

const cells = {
  subject: 'Naturfag',
  topic: 'Celler',
  questions: [
    { word: 'CELLEMEMBRAN', definition: 'Den tynne «huden» rundt cellen som bestemmer hva som slipper inn og ut.' },
    { word: 'CELLEKJERNE', definition: 'Styringssenteret i cellen som inneholder arvestoffet.' },
    { word: 'CYTOPLASMA', definition: 'Den geléaktige væsken inne i cellen der organellene ligger.' },
    { word: 'MITOKONDRIE', definition: 'Organellen som lager energi til cellen — ofte kalt «kraftverket».' },
    { word: 'KLOROPLAST', definition: 'Organellen i planteceller der fotosyntesen skjer.' },
    { word: 'CELLEVEGG', definition: 'Den stive, ekstra beskyttelsen utenfor cellemembranen hos planter.' },
    { word: 'VAKUOLE', definition: 'Rom i cellen som kan lagre vann, næring og avfall.' },
    { word: 'RIBOSOM', definition: 'Strukturen i cellen som produserer proteiner.' },
    { word: 'KROMOSOM', definition: 'Pakket DNA som inneholder arvestoff.' },
    { word: 'ARVESTOFF', definition: 'DNA-informasjonen som inneholder oppskriften på egenskaper.' },
    { word: 'CELLEDELING', definition: 'Prosessen der én celle blir til to celler.' },
    { word: 'STAMCELLE', definition: 'En udifferensiert celle som kan utvikle seg til ulike celletyper.' },
    { word: 'EUKARYOT', definition: 'En celle med membranomsluttet cellekjerne.' },
    { word: 'PROKARYOT', definition: 'En celle uten cellekjerne.' },
    { word: 'FLERCELLET', definition: 'En organisme som består av mange celler.' },
    { word: 'ENCELLET', definition: 'En organisme som består av én celle.' },
    { word: 'FOTOSYNTESE', definition: 'Prosessen der planter bruker lys, vann og karbondioksid til å lage sukker og oksygen.' },
    { word: 'CELLEÅNDING', definition: 'Prosessen der celler frigjør energi fra sukker ved hjelp av oksygen.' },
    { word: 'DIFFUSJON', definition: 'Bevegelse av partikler fra et område med høy konsentrasjon til et område med lav konsentrasjon.' },
    { word: 'OSMOSE', definition: 'Bevegelse av vann gjennom en membran.' },
    { word: 'ENZYM', definition: 'Et protein som gjør at kjemiske reaksjoner i cellen går raskere.' },
    { word: 'BAKTERIE', definition: 'En encellet, prokaryot mikroorganisme.' },
    { word: 'MIKROSKOP', definition: 'Verktøyet vi bruker for å se celler som er for små for det blotte øyet.' },
    { word: 'VEV', definition: 'En gruppe like celler som jobber sammen om en oppgave.' },
    { word: 'ORGANELL', definition: 'En liten «ministruktur» inne i cellen med en bestemt oppgave.' },
    { word: 'LYSOSOM', definition: 'Organellen som bryter ned avfall og gamle deler i cellen.' },
    { word: 'GOLGIAPPARAT', definition: 'Organellen som pakker og sender proteiner videre i cellen.' }
  ]
};

export default cells;
