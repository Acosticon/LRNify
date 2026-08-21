// nations.js – nasjonsdata og AI-strategier for Diplomatiet
// Ren innholdsmodul: ingen DOM, ingen mutasjon av spilltilstand.
// Hver nasjon spiller én klassisk spillteori-strategi fra Axelrods turneringer.

// ─── Strategifunksjoner ────────────────────────────────
// history: array av { player:'C'|'D', nation:'C'|'D' } i kronologisk rekkefølge,
// kun for forholdet til denne ene nasjonen. Returnerer 'C' eller 'D'.

function alwaysCooperate() {
  return 'C';
}

function alwaysDefect() {
  return 'D';
}

function titForTat(history) {
  if (!history.length) return 'C';
  return history[history.length - 1].player;
}

function grudger(history) {
  if (history.some(h => h.player === 'D')) return 'D';
  return 'C';
}

function random() {
  return Math.random() < 0.5 ? 'C' : 'D';
}

// Pavlov / win-stay-lose-shift: behold forrige trekk ved «gevinst» (CC eller DC
// sett fra nasjonens ståsted), bytt trekk ved «tap» (CD eller DD).
function pavlov(history) {
  if (!history.length) return 'C';
  const last = history[history.length - 1];
  const lost = (last.nation === 'C' && last.player === 'D') || (last.nation === 'D' && last.player === 'D');
  if (!lost) return last.nation;
  return last.nation === 'C' ? 'D' : 'C';
}

export const STRATEGIES = {
  alwaysCooperate,
  alwaysDefect,
  titForTat,
  grudger,
  random,
  pavlov,
};

export const STRATEGY_THEORY = {
  alwaysCooperate: {
    name: 'Alltid samarbeid',
    desc: 'Velger fred uansett hva motparten gjør – sjenerøs, men lett å utnytte.',
  },
  alwaysDefect: {
    name: 'Alltid svik',
    desc: 'Velger opprustning uansett – en dominant strategi i ett enkelt spill, men kostbar over tid.',
  },
  titForTat: {
    name: 'Tit for tat',
    desc: 'Starter med samarbeid, og speiler så ditt forrige trekk – strategien som vant Axelrods turnering i 1980.',
  },
  grudger: {
    name: 'Hevngjerrig (grudger)',
    desc: 'Samarbeider til den blir sveket én eneste gang – deretter samarbeider den aldri igjen.',
  },
  random: {
    name: 'Tilfeldig',
    desc: 'Trekket avgjøres av indre politikk – umulig å forutsi eller bygge et rasjonelt mottrekk mot.',
  },
  pavlov: {
    name: 'Pavlov (win-stay, lose-shift)',
    desc: 'Beholder forrige trekk hvis det lønte seg, bytter hvis det ikke gjorde det.',
  },
};

// ─── Nasjoner ───────────────────────────────────────────
export const NATIONS = [
  {
    id: 'lindau',
    name: 'Fredsriket Lindau',
    leader: 'Kansler Elin Vasi',
    emblem: '🕊️',
    color: '#4FA88C',
    strategy: 'alwaysCooperate',
    order: 1,
    tagline: 'Et handelsrike bygget på tillit og åpne grenser.',
    quotes: {
      cooperate: [
        'Lindau åpner grensene sine igjen – handelskonvoiene ruller mot dere.',
        'Kansler Vasi signerer nok en nedrustningsavtale uten å nøle.',
        'Lindau tilbyr teknologideling – et gammeldags tegn på god vilje.',
      ],
      defect: [
        'Lindau nøler i dag – interne rådgivere ber om forsiktighet.',
      ],
      allianceFormed: 'Vasi: «Måtte denne alliansen vare lenger enn oss begge.»',
      allianceBroken: 'Vasi: «Vi trodde på dere. Det var visst vår feil.»',
      warStart: 'Vasi: «Selv Lindau har en grense for hvor mye tillit som kan sveltes.»',
      peaceRestored: 'Vasi: «Kanskje det er mulig å begynne på nytt likevel.»',
      finalPositive: 'Historien vil huske dette som et av de sjeldne tiårene der to naboer valgte hverandre, gang på gang.',
      finalNeutral: 'Vi ga alt vi hadde. Om det ble gjengjeldt, får ettertiden dømme.',
      finalNegative: 'Vi trodde godhet var nok. Nå vet vi bedre – men til hvilken pris.',
    },
  },
  {
    id: 'draks',
    name: 'Keiserriket Draks',
    leader: 'Keiser Draks III',
    emblem: '🐉',
    color: '#B23A3A',
    strategy: 'alwaysDefect',
    order: 6,
    tagline: 'Et ekspansjonistisk keiserdømme som kun forstår styrke.',
    quotes: {
      cooperate: [
        'Keiser Draks III overrasker alle – ingen troppebevegelser observert i dag.',
      ],
      defect: [
        'Draks flytter tungt artilleri til grensen – igjen.',
        'Keiseren avviser fredsforslaget med et hånlig brev.',
        'Draks-spioner avsløres inne i deres eget regjeringskvartal.',
      ],
      allianceFormed: 'Draks III: «En allianse er bare en krig som ikke har startet ennå.»',
      allianceBroken: 'Draks III: «Endelig et språk jeg forstår.»',
      warStart: 'Draks III: «Vi har alltid vært i krig med dere. Dere visste det bare ikke.»',
      peaceRestored: 'Draks III: «Nyt freden. Den er midlertidig.»',
      finalPositive: 'Selv keiseren måtte til slutt innrømme at deres motstand kostet mer enn den smakte.',
      finalNeutral: 'Vi respekterer styrke. Dere viste noe – men aldri nok.',
      finalNegative: 'Svakhet inviterer erobring. Dere lærte det på den harde måten.',
    },
  },
  {
    id: 'ravenna',
    name: 'Naboriket Ravenna',
    leader: 'Regent Toma Ravel',
    emblem: '🦅',
    color: '#C68A3A',
    strategy: 'titForTat',
    order: 2,
    tagline: 'En stolt granne som speiler alt du gjør, trekk for trekk.',
    quotes: {
      cooperate: [
        'Ravenna svarer i samme mynt – nedrustning bekreftes.',
        'Regent Ravel sender en respektfull hilsen tilbake.',
      ],
      defect: [
        'Ravenna svarer i samme mynt – troppene mobiliseres.',
        'Regent Ravel: «Det dere gjør mot oss, gjør vi mot dere.»',
      ],
      allianceFormed: 'Ravel: «Gjensidighet er den eneste avtalen som holder.»',
      allianceBroken: 'Ravel: «Da vet vi begge hvor vi står. Speilet er ærlig.»',
      warStart: 'Ravel: «Dere startet dette. Vi avslutter det på samme vis.»',
      peaceRestored: 'Ravel: «Vis oss fred, så får dere fred tilbake.»',
      finalPositive: 'Vi ga aldri mer eller mindre enn det vi fikk. Det viste seg å være nok til å bygge noe varig.',
      finalNeutral: 'Forholdet vårt var alltid et ekko av deres eget. Lytt til det.',
      finalNegative: 'Dere så oss aldri som et speil. Kanskje det er derfor det gikk som det gikk.',
    },
  },
  {
    id: 'kaldur',
    name: 'Fjellstaten Kaldur',
    leader: 'Fyrst Bren Kaldur',
    emblem: '⛰️',
    color: '#5C7A99',
    strategy: 'grudger',
    order: 3,
    tagline: 'Et stolt fjellfolk som aldri glemmer et svik.',
    quotes: {
      cooperate: [
        'Kaldur åpner fjellpassene for handel, som avtalt.',
        'Fyrst Kaldur holder ord – slik han alltid har gjort.',
      ],
      defect: [
        'Kaldur stenger fjellpassene på ubestemt tid.',
        'Fyrst Kaldur: «Vi glemmer ikke. Vi glemmer aldri.»',
      ],
      allianceFormed: 'Kaldur: «Et løfte fra fjellet brytes aldri først.»',
      allianceBroken: 'Kaldur: «Nå vet hele fjellkjeden hvem dere er. For alltid.»',
      warStart: 'Kaldur: «Dette var deres valg, ikke vårt.»',
      peaceRestored: 'Kaldur: «Fjellet glemmer ingenting – men det kan velge å bygge videre likevel.»',
      finalPositive: 'Tilliten vi ga, ble aldri misbrukt. Det er sjeldnere enn dere aner.',
      finalNeutral: 'Vi holdt vår del av avtalen så lenge dere gjorde det samme.',
      finalNegative: 'Én gang var nok. Fjellet husker den dagen fortsatt.',
    },
  },
  {
    id: 'sirocco',
    name: 'Handelsbyen Sirocco',
    leader: 'Rådsleder Yuna Sirocco',
    emblem: '🎲',
    color: '#8B5FA3',
    strategy: 'random',
    order: 5,
    tagline: 'En kaotisk bystat styrt av rivaliserende handelshus.',
    quotes: {
      cooperate: [
        'Sirocco-rådet stemmer overraskende for åpne handelsruter i dag.',
        'Yuna Sirocco vinner internt – fredslinjen får overtaket denne runden.',
      ],
      defect: [
        'Sirocco-rådet stemmer for embargo – nok en gang uforutsigbart.',
        'Krigshandelshusene vinner internt i Sirocco denne runden.',
      ],
      allianceFormed: 'Sirocco: «En allianse med oss? Dristig. Vi liker det.»',
      allianceBroken: 'Sirocco: «Rådet er splittet, men de er enige om én ting nå: dere.»',
      warStart: 'Sirocco: «Kaos avler kaos. Dere fôret det.»',
      peaceRestored: 'Sirocco: «Rådet skifter mening igjen. Kanskje til det bedre denne gangen.»',
      finalPositive: 'Selv i vårt kaos klarte dere å finne et mønster verdt å stole på.',
      finalNeutral: 'Vi var alltid uforutsigbare. Dere taklet det – noenlunde.',
      finalNegative: 'Uforutsigbarhet krever tålmodighet. Den tok visst slutt før vi gjorde det.',
    },
  },
  {
    id: 'nordr',
    name: 'Alliansen Nordr',
    leader: 'Marskalk Iver Nordr',
    emblem: '⚖️',
    color: '#C9A227',
    strategy: 'pavlov',
    order: 4,
    tagline: 'En pragmatisk nordstat som kun bryr seg om hva som fungerte sist.',
    quotes: {
      cooperate: [
        'Nordr fortsetter kursen fra sist – samarbeidet holder.',
        'Marskalk Nordr: «Det som virket i går, virker i dag.»',
      ],
      defect: [
        'Nordr snur brått – marskalken justerer kursen etter forrige runde.',
        'Marskalk Nordr: «Vi lærte noe sist. Vi handler deretter.»',
      ],
      allianceFormed: 'Nordr: «Så lenge dette lønner seg for begge, holder vi kursen.»',
      allianceBroken: 'Nordr: «Notert. Vi justerer strategien umiddelbart.»',
      warStart: 'Nordr: «Dette virket ikke for oss. Forvent en endring.»',
      peaceRestored: 'Nordr: «Nye tall, ny kurs. Slik fungerer vi.»',
      finalPositive: 'Vi endrer aldri kurs uten grunn – og med dere hadde vi sjelden grunn til å bytte.',
      finalNeutral: 'Vi speilet det som fungerte. Noen ganger var det dere, noen ganger ikke.',
      finalNegative: 'Vi bytter kurs når noe ikke lønner seg. Med dere byttet vi ofte.',
    },
  },
];

export const NATION_BY_ID = Object.fromEntries(NATIONS.map(n => [n.id, n]));

// Kampanjerekkefølge: stigende vanskelighetsgrad, fra forutsigbar til kaotisk/fiendtlig.
export const CAMPAIGN_ORDER = [...NATIONS].sort((a, b) => a.order - b.order);
