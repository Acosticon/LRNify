/* ══════════════════════════════════════════════════════════════════
   tasks.js — de åtte verbene.

   Rent datalag: lagOppgave() bygger en oppgave, sjekk() dømmer et
   svar. Ingen DOM her — ui.js tegner det som kommer ut.

     compute       regn ut sentralmålene
     choose        hvilket sentralmål svarer på klientens spørsmål
     interpret     vurder en påstand om tallene
     predict       gjett hvor sentralmålet lander, før fasit
     shock         forutsi hva et nytt datapunkt gjør
     bygg          lag et datasett som treffer gitte sentralmål
     sabotor       flytt ett tall og styr gjennomsnittet dit du vil
     overskrifter  sann / sann men misvisende / feil
     finnfeil      hva gjorde denne eleven galt
   ══════════════════════════════════════════════════════════════════ */

import {
  mean, median, modes, sum, sortNum, fmtNum, fmtModes, parseNum, near, span, counts
} from './stats.js';
import { generateData, SHAPES, shuffled } from './generator.js';
import { CONTEXTS, CLIENTS, MEASURE } from './content.js';

const pick = (rng, a) => a[Math.floor(rng() * a.length)];
const ri = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

/* Kontekstvalg med minne, så samme sak ikke kommer to ganger på rad. */
const nylig = [];
function velgKontekst(shape, rng) {
  const kandidater = CONTEXTS.filter(c => c.shapes.includes(shape));
  const friske = kandidater.filter(c => !nylig.includes(c.id));
  const valgt = pick(rng, friske.length ? friske : kandidater);
  nylig.push(valgt.id);
  if (nylig.length > 8) nylig.shift();
  return valgt;
}

function enhetSuffiks(ctx) { return ctx.unit ? ' ' + ctx.unit : ''; }

function velgKontekstUtenTak(shape, rng) {
  const åpne = CONTEXTS.filter(c => c.shapes.includes(shape) && c.max == null && c.taalerUteligger !== false);
  if (!åpne.length) return velgKontekst(shape, rng);
  const friske = åpne.filter(c => !nylig.includes(c.id));
  const valgt = pick(rng, friske.length ? friske : åpne);
  nylig.push(valgt.id);
  if (nylig.length > 8) nylig.shift();
  return valgt;
}

/* ══════════════════════════════════════════════════════════════════
   Hvilket sentralmål svarer på «hva er typisk her?» — avhenger av
   formen på dataene, ikke av konteksten.
   ══════════════════════════════════════════════════════════════════ */
const TYPISK_FASIT = {
  stram: ['mean', 'median', 'mode'],
  spredt: ['mean', 'median'],
  uteligger: ['median'],
  todelt: ['ingen'],
  kategorisk: ['mode', 'median'],
  uniform: ['median', 'mean']
};

function forklarTypisk(shape, data, ctx) {
  const m = fmtNum(mean(data)), med = fmtNum(median(data)), mo = modes(data);
  const e = enhetSuffiks(ctx);
  switch (shape) {
    case 'stram':
      return `Tallene ligger tett. Snitt ${m}, median ${med} og typetall ${fmtModes(mo)} forteller samme historie — her er valget fritt.`;
    case 'spredt':
      return `Snitt ${m} og median ${med} er enige om midten, men tallene spriker fra ${fmtNum(Math.min(...data))} til ${fmtNum(Math.max(...data))}${e}. Enighet om midten er ikke det samme som at gruppa er lik.`;
    case 'uteligger': {
      const s = sortNum(data), topp = s[s.length - 1];
      return `${fmtNum(topp)}${e} drar gjennomsnittet opp til ${m}, godt over det de fleste faktisk har. Medianen ${med} rikker seg knapt, og beskriver gruppa langt bedre.`;
    }
    case 'todelt':
      return `Tallene samler seg i to grupper. Både snittet ${m} og medianen ${med} lander i tomrommet mellom dem — der finnes det ikke ett eneste datapunkt. Her er det ærligste svaret at «typisk» ikke finnes.`;
    case 'kategorisk':
      return `Gjennomsnittet blir ${m} — et tall ingen faktisk har. Typetallet ${fmtModes(mo)} og medianen ${med} er verdier som finnes i virkeligheten.`;
    case 'uniform':
      return `Ingen verdi går igjen, så det finnes ikke noe typetall. Snitt ${m} og median ${med} er begge brukbare her.`;
    default: return '';
  }
}

/* ══════════════════════════════════════════════════════════════════
   1 · COMPUTE
   ══════════════════════════════════════════════════════════════════ */
function lagCompute(spec, rng) {
  const ctx = velgKontekst(spec.shape, rng);
  const data = generateData(spec.shape, ctx, rng);
  if (!data) return null;
  let maal = spec.measures || ['mean', 'median'];
  /* Be aldri om typetall der det ikke finnes noe. */
  if (maal.includes('mode') && !modes(data).length) maal = maal.filter(k => k !== 'mode');
  if (!maal.length) maal = ['median'];
  return {
    verb: 'compute', ctx, data, shape: spec.shape, maal,
    klient: pick(rng, CLIENTS.median),
    ledetekst: maal.length === 1
      ? `Regn ut ${MEASURE[maal[0]].bestemtLav} for tallene over.`
      : `Regn ut ${maal.map(k => MEASURE[k].bestemtLav).join(' og ')} for tallene over.`,
    verktoy: true, poeng: 10
  };
}

function sjekkCompute(o, svar) {
  const feil = [];
  const status = {};
  o.maal.forEach(k => {
    const inn = parseNum(svar[k]);
    let ok;
    if (k === 'mode') {
      const mo = modes(o.data);
      ok = mo.length === 1 ? near(inn, mo[0]) : false;
    } else {
      ok = near(inn, k === 'mean' ? mean(o.data) : median(o.data));
    }
    status[k] = ok;
    if (!ok) feil.push(k);
  });
  const riktig = feil.length === 0;
  return {
    riktig, status,
    tilbakemelding: riktig
      ? 'Alt riktig regnet.'
      : `Ikke helt ennå: ${feil.map(k => MEASURE[k].navn.toLowerCase()).join(' og ')}. Prøv «sorter» og «vis sum» — de koster ingenting.`
  };
}

/* ══════════════════════════════════════════════════════════════════
   2 · CHOOSE
   ══════════════════════════════════════════════════════════════════ */
function lagChoose(spec, rng) {
  const ctx = velgKontekst(spec.shape, rng);
  const data = generateData(spec.shape, ctx, rng);
  if (!data) return null;
  const harType = modes(data).length > 0;

  /* Tre grunner til å spørre. «Fordel likt» krever at det gir mening
     i konteksten — man deler ikke skostørrelser. */
  const behovListe = ['typisk'];
  if (ctx.sp.mean) behovListe.push('deleLikt');
  if (harType) behovListe.push('flestAv');
  const behov = pick(rng, behovListe);

  let fasit, sporsmal, klientgruppe;
  if (behov === 'deleLikt') {
    fasit = ['mean']; sporsmal = ctx.sp.mean; klientgruppe = CLIENTS.mean;
  } else if (behov === 'flestAv') {
    fasit = ['mode']; sporsmal = ctx.sp.mode; klientgruppe = CLIENTS.mode;
  } else {
    fasit = TYPISK_FASIT[spec.shape]; sporsmal = ctx.sp.median;
    klientgruppe = fasit[0] === 'ingen' ? CLIENTS.ingen : CLIENTS.median;
  }

  const valg = [
    { key: 'mean', label: 'Gjennomsnittet' },
    { key: 'median', label: 'Medianen' },
    { key: 'mode', label: 'Typetallet' },
    { key: 'ingen', label: 'Ingen av dem beskriver gruppa' }
  ];

  return {
    verb: 'choose', ctx, data, shape: spec.shape, behov, fasit,
    klient: pick(rng, klientgruppe),
    sporsmal, valg, visVerdier: true, poeng: 10,
    forklaring: behov === 'deleLikt'
      ? `Her er gjennomsnittet riktig svar, uansett hvordan tallene ser ut: «fordel likt» er nettopp det gjennomsnittet regner ut. ${fmtNum(sum(data))} delt på ${data.length} blir ${fmtNum(mean(data))}${enhetSuffiks(ctx)}.`
      : behov === 'flestAv'
        ? `Typetallet ${fmtModes(modes(data))} er verdien som går igjen flest ganger — akkurat det som trengs når man skal ha flest av én ting.`
        : forklarTypisk(spec.shape, data, ctx)
  };
}

function sjekkChoose(o, svar) {
  const riktig = o.fasit.includes(svar);
  let ekstra = '';
  if (!riktig && svar === 'mode' && !modes(o.data).length) {
    ekstra = ' Merk at dette datasettet ikke har noe typetall i det hele tatt — ingen verdi går igjen.';
  }
  return { riktig, tilbakemelding: (riktig ? 'Riktig. ' : 'Ikke helt. ') + o.forklaring + ekstra };
}

/* ══════════════════════════════════════════════════════════════════
   3 · INTERPRET
   ══════════════════════════════════════════════════════════════════ */
function lagInterpret(spec, rng) {
  const ctx = velgKontekst(spec.shape, rng);
  const data = generateData(spec.shape, ctx, rng);
  if (!data) return null;
  const m = mean(data), med = median(data), e = enhetSuffiks(ctx);
  const s = sortNum(data);
  const underSnitt = data.filter(v => v < m).length;

  let påstand, valg, fasit, forklaring;

  if (spec.shape === 'uteligger') {
    påstand = `«${ctx.hvem[0].toUpperCase() + ctx.hvem.slice(1)} ligger på ${fmtNum(m)}${e} i snitt.»`;
    valg = [
      { key: 'a', label: 'Tallet er riktig regnet, men gir et skjevt bilde av gruppa' },
      { key: 'b', label: 'Tallet er feil regnet' },
      { key: 'c', label: 'Tallet stemmer, og beskriver gruppa godt' }
    ];
    fasit = 'a';
    forklaring = `Gjennomsnittet er korrekt regnet. Problemet er at ${underSnitt} av ${data.length} ligger UNDER det — ${fmtNum(s[s.length - 1])}${e} drar hele snittet opp. Medianen ${fmtNum(med)}${e} beskriver gruppa ærligere.`;
  } else if (spec.shape === 'todelt') {
    påstand = `«En typisk verdi her er ${fmtNum(m)}${e}.»`;
    valg = [
      { key: 'a', label: `Nei — ingen ligger i nærheten av ${fmtNum(m)}${e}` },
      { key: 'b', label: 'Ja, det er jo midt i datasettet' },
      { key: 'c', label: 'Nei, fordi gjennomsnittet er feil regnet' }
    ];
    fasit = 'a';
    forklaring = `Tallene deler seg i to grupper, og ${fmtNum(m)}${e} lander i gapet mellom dem. Et sentralmål kan peke på et sted der det ikke finnes noen.`;
  } else if (spec.shape === 'kategorisk') {
    påstand = `«Gjennomsnittet er ${fmtNum(m)}${e}.»`;
    valg = [
      { key: 'a', label: 'Riktig regnet, men ingen har faktisk denne verdien' },
      { key: 'b', label: 'Umulig — man kan ikke regne gjennomsnitt av slike tall' },
      { key: 'c', label: 'Feil, gjennomsnittet må være et helt tall' }
    ];
    fasit = 'a';
    forklaring = `Regnestykket er riktig, og gjennomsnitt av hele tall blir ofte et desimaltall. Men skal svaret brukes til noe praktisk, er typetallet ${fmtModes(modes(data))} det som finnes i virkeligheten.`;
  } else {
    påstand = `«Gjennomsnittet er ${fmtNum(m)}${e}, så alle ligger omtrent der.»`;
    valg = [
      { key: 'a', label: `Nei — spennet går fra ${fmtNum(s[0])} til ${fmtNum(s[s.length - 1])}${e}` },
      { key: 'b', label: 'Ja, gjennomsnittet gjelder for alle' },
      { key: 'c', label: 'Nei, fordi medianen er noe annet' }
    ];
    fasit = 'a';
    forklaring = `Gjennomsnittet sier hvor midten ligger, ikke hvor samlet gruppa er. Her spenner tallene ${fmtNum(span(data))}${e} fra laveste til høyeste.`;
  }

  return {
    verb: 'interpret', ctx, data, shape: spec.shape, påstand, valg: shuffled(rng, valg), fasit,
    klient: pick(rng, CLIENTS.median), visVerdier: true, forklaring, poeng: 10
  };
}

const sjekkEnkeltvalg = (o, svar) => ({
  riktig: svar === o.fasit,
  tilbakemelding: (svar === o.fasit ? 'Riktig. ' : 'Ikke helt. ') + o.forklaring
});

/* ══════════════════════════════════════════════════════════════════
   4 · PREDICT — dra markøren dit du tror sentralmålet lander
   ══════════════════════════════════════════════════════════════════ */
function lagPredict(spec, rng) {
  const ctx = velgKontekst(spec.shape, rng);
  const data = generateData(spec.shape, ctx, rng);
  if (!data) return null;
  const maal = spec.measure || 'mean';
  const fasit = maal === 'mean' ? mean(data) : median(data);
  const steg = ctx.step || 1;
  return {
    verb: 'predict', ctx, data, shape: spec.shape, maal, fasit,
    toleranse: { full: steg * 0.75, halv: steg * 2 },
    klient: pick(rng, CLIENTS.median),
    ledetekst: `Dra markøren dit du tror ${MEASURE[maal].bestemtLav} havner. Ikke regn — kjenn etter.`,
    poeng: 10
  };
}

function sjekkPredict(o, svar) {
  const bom = Math.abs(svar - o.fasit);
  const e = enhetSuffiks(o.ctx);
  const riktig = bom <= o.toleranse.full;
  const nesten = !riktig && bom <= o.toleranse.halv;
  let t;
  if (riktig) t = `Blink. ${MEASURE[o.maal].bestemt} er ${fmtNum(o.fasit)}${e}.`;
  else if (nesten) t = `Nære på — ${MEASURE[o.maal].bestemtLav} er ${fmtNum(o.fasit)}${e}, du bommet med ${fmtNum(bom)}${e}.`;
  else t = `${MEASURE[o.maal].bestemt} er ${fmtNum(o.fasit)}${e}. Du bommet med ${fmtNum(bom)}${e}.`;
  if (o.shape === 'uteligger' && o.maal === 'mean' && svar < o.fasit) {
    t += ' Den store verdien til høyre drar snittet lenger ut enn magefølelsen sier.';
  }
  return { riktig, nesten, tilbakemelding: t, andel: riktig ? 1 : nesten ? 0.5 : 0 };
}

/* ══════════════════════════════════════════════════════════════════
   5 · SHOCK — det nye datapunktet
   ══════════════════════════════════════════════════════════════════ */
function lagShock(spec, rng) {
  /* Uteliggeren skal være overraskende, ikke umulig: kontekster med et
     naturlig tak (timer søvn, grader i mai) tåler ikke et tall som er
     ti ganger så stort. */
  const ctx = velgKontekstUtenTak('stram', rng);
  const data = generateData('stram', ctx, rng, ri(rng, 5, 7));
  if (!data) return null;
  const steg = ctx.step || 1;
  const nyVerdi = Math.max(...data) + ri(rng, 9, 16) * steg;
  const etter = [...data, nyVerdi];
  return {
    verb: 'shock', ctx, data, nyVerdi, etter, shape: 'stram',
    klient: pick(rng, CLIENTS.median),
    fasit: 'mean',
    valg: shuffled(rng, [
      { key: 'mean', label: 'Gjennomsnittet flytter seg mest' },
      { key: 'median', label: 'Medianen flytter seg mest' },
      { key: 'likt', label: 'De flytter seg omtrent like mye' }
    ]),
    for: { mean: mean(data), median: median(data) },
    etterTall: { mean: mean(etter), median: median(etter) },
    poeng: 10
  };
}

function sjekkShock(o, svar) {
  const e = enhetSuffiks(o.ctx);
  const dMean = Math.abs(o.etterTall.mean - o.for.mean);
  const dMed = Math.abs(o.etterTall.median - o.for.median);
  return {
    riktig: svar === 'mean',
    tilbakemelding: (svar === 'mean' ? 'Riktig gjettet. ' : 'Se hva som faktisk skjedde. ') +
      `Gjennomsnittet flyttet seg ${fmtNum(dMean)}${e} (fra ${fmtNum(o.for.mean)} til ${fmtNum(o.etterTall.mean)}). ` +
      `Medianen flyttet seg ${fmtNum(dMed)}${e} (fra ${fmtNum(o.for.median)} til ${fmtNum(o.etterTall.median)}). ` +
      `Gjennomsnittet regner med selve verdien; medianen bryr seg bare om rekkefølgen.`
  };
}

/* ══════════════════════════════════════════════════════════════════
   6 · BYGG — lag tallene selv
   ══════════════════════════════════════════════════════════════════ */
function lagBygg(spec, rng) {
  const mal = spec.mal || 'meanMedian';

  if (mal === 'meanMedian') {
    /* Bygg først en gyldig løsning, så vi vet at oppgaven går opp. */
    const n = 5, med = ri(rng, 4, 9), snitt = med + ri(rng, 3, 7);
    return {
      verb: 'bygg', mal, n,
      krav: [
        { type: 'mean', verdi: snitt, tekst: `Gjennomsnittet skal bli ${fmtNum(snitt)}` },
        { type: 'median', verdi: med, tekst: `Medianen skal bli ${fmtNum(med)}` }
      ],
      grense: { min: 0, max: 100 },
      tittel: 'Bygg et datasett',
      ledetekst: `Lag ${n} hele tall mellom 0 og 100 som treffer begge kravene samtidig.`,
      hint: 'Medianen bestemmes av det midterste tallet. Gjennomsnittet bestemmes av summen. De to kan styres hver for seg.',
      poeng: 10
    };
  }

  if (mal === 'modeFast') {
    const n = 7, t = ri(rng, 3, 8);
    return {
      verb: 'bygg', mal, n,
      krav: [
        { type: 'mode', verdi: t, tekst: `Typetallet skal bli ${fmtNum(t)}` },
        { type: 'medianIkke', verdi: t, tekst: `Medianen skal IKKE være ${fmtNum(t)}` }
      ],
      grense: { min: 0, max: 40 },
      tittel: 'Typetall mot median',
      ledetekst: `Lag ${n} hele tall mellom 0 og 40 der den vanligste verdien og den midterste verdien er to forskjellige tall.`,
      hint: `Legg flere ${fmtNum(t)}-ere i den ene enden, og la de øvrige tallene skyve midten et annet sted.`,
      poeng: 10
    };
  }

  const n = 6, snitt = ri(rng, 5, 12);
  return {
    verb: 'bygg', mal: 'ingenTrefferSnitt', n,
    krav: [
      { type: 'mean', verdi: snitt, tekst: `Gjennomsnittet skal bli ${fmtNum(snitt)}` },
      { type: 'ingenLik', verdi: snitt, tekst: `Ingen av tallene får være ${fmtNum(snitt)}` }
    ],
    grense: { min: 0, max: 60 },
    tittel: 'Et snitt ingen har',
    ledetekst: `Lag ${n} hele tall mellom 0 og 60 med gjennomsnitt ${fmtNum(snitt)} — uten at noen av dem ER ${fmtNum(snitt)}.`,
    hint: 'Gjennomsnittet er et balansepunkt, ikke en verdi som må finnes i datasettet.',
    poeng: 10
  };
}

function sjekkBygg(o, svar) {
  const tall = svar.map(parseNum);
  if (tall.some(v => !Number.isFinite(v))) {
    return { riktig: false, tilbakemelding: `Fyll inn alle ${o.n} tallene før du sjekker.`, kravStatus: [] };
  }
  if (tall.some(v => v < o.grense.min || v > o.grense.max)) {
    return { riktig: false, tilbakemelding: `Alle tallene må ligge mellom ${o.grense.min} og ${o.grense.max}.`, kravStatus: [] };
  }
  const kravStatus = o.krav.map(k => {
    switch (k.type) {
      case 'mean': return near(mean(tall), k.verdi);
      case 'median': return near(median(tall), k.verdi);
      case 'mode': { const mo = modes(tall); return mo.length === 1 && near(mo[0], k.verdi); }
      case 'medianIkke': return !near(median(tall), k.verdi);
      case 'ingenLik': return !tall.some(v => near(v, k.verdi));
      default: return false;
    }
  });
  const riktig = kravStatus.every(Boolean);
  return {
    riktig, kravStatus,
    fasitTekst: `Ditt datasett: snitt ${fmtNum(mean(tall))}, median ${fmtNum(median(tall))}, typetall ${fmtModes(modes(tall))}.`,
    tilbakemelding: riktig
      ? `Løst. Det finnes uendelig mange riktige svar her, og du fant ett av dem.`
      : `Ikke i mål ennå. ${o.hint}`
  };
}

/* ══════════════════════════════════════════════════════════════════
   7 · SABOTØR — flytt gjennomsnittet dit du vil
   ══════════════════════════════════════════════════════════════════ */
function lagSabotor(spec, rng) {
  const ctx = velgKontekstUtenTak(spec.shape, rng);
  const data = generateData(spec.shape, ctx, rng);
  if (!data) return null;
  const steg = ctx.step || 1;
  const opp = (spec.retning || 'opp') === 'opp';
  const m = mean(data);
  const terskel = opp
    ? Math.round((m + ri(rng, 3, 6) * steg) / steg) * steg
    : Math.round((m - ri(rng, 3, 6) * steg) / steg) * steg;
  if (!opp && terskel <= (ctx.min ?? 0)) return null;

  const n = data.length;
  const grense = terskel * (n + 1) - sum(data);   // nødvendig verdi på den nye
  if (opp && grense < 0) return null;
  if (!opp && grense < 0) return null;

  return {
    verb: 'sabotor', ctx, data, shape: spec.shape, retning: opp ? 'opp' : 'ned',
    terskel, grense, klient: pick(rng, CLIENTS.sabotor),
    /* Bånd rundt grensen: oppgaven er å finne DEN MINSTE verdien som
       holder, ikke å skrive et vilkårlig stort tall. */
    band: Math.max(2 * steg, Math.abs(grense) * 0.2),
    tittel: opp ? 'Få snittet over streken' : 'Få snittet under streken',
    ledetekst: opp
      ? `Én verdi til skal inn i datasettet. Hvor liten kan den være og likevel løfte gjennomsnittet til minst ${fmtNum(terskel)}${enhetSuffiks(ctx)}? Finn grensen — et altfor stort tall teller ikke.`
      : `Én verdi til skal inn i datasettet. Hvor stor kan den være og likevel dra gjennomsnittet ned til ${fmtNum(terskel)}${enhetSuffiks(ctx)} eller lavere? Finn grensen — et altfor lite tall teller ikke.`,
    poeng: 10
  };
}

function sjekkSabotor(o, svar) {
  const x = parseNum(svar);
  const e = enhetSuffiks(o.ctx);
  if (!Number.isFinite(x)) return { riktig: false, tilbakemelding: 'Skriv inn et tall.' };
  if (x < 0) return { riktig: false, tilbakemelding: 'Bruk et tall som ikke er negativt.' };
  const nyData = [...o.data, x];
  const nyttSnitt = mean(nyData), nyMedian = median(nyData);
  const gammelMedian = median(o.data);
  const traff = o.retning === 'opp' ? nyttSnitt >= o.terskel - 1e-9 : nyttSnitt <= o.terskel + 1e-9;
  const presis = o.retning === 'opp'
    ? x <= o.grense + o.band
    : x >= o.grense - o.band;
  const flyttetMedian = Math.abs(nyMedian - gammelMedian);

  let t = `Med ${fmtNum(x)}${e} inne blir gjennomsnittet ${fmtNum(nyttSnitt)}${e}. `;
  if (!traff) {
    t += `Det er ikke ${o.retning === 'opp' ? 'oppe i' : 'nede i'} ${fmtNum(o.terskel)}${e} ennå. ` +
         `Prøv igjen: summen er ${fmtNum(sum(o.data))}, og med den nye verdien blir det ${o.data.length + 1} tall å dele på.`;
  } else if (!presis) {
    t += `Det holder — men det er langt mer enn nødvendig. Oppgaven er å finne den ` +
         `${o.retning === 'opp' ? 'minste' : 'største'} verdien som klarer det. Prøv deg nærmere.`;
  } else {
    t += `Og grensen går nøyaktig ved ${fmtNum(o.grense)}${e}. Legg merke til medianen: den flyttet seg ` +
         `bare ${fmtNum(flyttetMedian)}${e} — du kan skyve gjennomsnittet nesten hvor du vil med ett eneste ` +
         `tall, uten at medianen følger etter.`;
  }
  return { riktig: traff && presis, tilbakemelding: t, nyData };
}

/* ══════════════════════════════════════════════════════════════════
   8 · OVERSKRIFTER — sann / sann men misvisende / feil
   ══════════════════════════════════════════════════════════════════ */
const DOMMER = [
  { key: 'sann', label: 'Sann', beskr: 'Riktig regnet og gir riktig inntrykk' },
  { key: 'misvisende', label: 'Sann, men misvisende', beskr: 'Tallet stemmer — inntrykket gjør ikke det' },
  { key: 'feil', label: 'Feil', beskr: 'Tallet er rett og slett galt' }
];

function lagOverskrifter(spec, rng) {
  const ctx = velgKontekst(spec.shape, rng);
  const data = generateData(spec.shape, ctx, rng);
  if (!data) return null;
  const m = mean(data), med = median(data), s = sortNum(data), e = enhetSuffiks(ctx);
  const n = data.length;
  const underSnitt = data.filter(v => v < m).length;
  const Hvem = ctx.hvem[0].toUpperCase() + ctx.hvem.slice(1);
  const feilTall = Math.round(m * 1.6);

  const bank = [
    { tekst: `«Medianen er ${fmtNum(med)}${e}.»`, dom: 'sann',
      hvorfor: `Regnet riktig, og medianen er nettopp det tallet som deler gruppa i to like store halvdeler.` },
    { tekst: `«${Hvem} ligger på ${fmtNum(m)}${e} i snitt.»`, dom: 'misvisende',
      hvorfor: `Regnestykket stemmer, men ${underSnitt} av ${n} ligger under dette tallet. Setningen gir inntrykk av noe typisk, og det er den ikke.` },
    { tekst: `«Gjennomsnittet er ${fmtNum(feilTall)}${e}.»`, dom: 'feil',
      hvorfor: `Gjennomsnittet er ${fmtNum(m)}${e}. Dette tallet er bare galt.` },
    { tekst: `«Over halvparten ligger over ${fmtNum(m)}${e}.»`, dom: 'feil',
      hvorfor: `Bare ${n - underSnitt} av ${n} ligger over gjennomsnittet. Påstanden er usann.` },
    { tekst: `«Høyeste verdi er ${fmtNum(s[s.length - 1])}${e}.»`, dom: 'sann',
      hvorfor: `Det stemmer, og det er en ærlig opplysning så lenge den ikke framstilles som typisk.` },
    { tekst: `«Toppnoteringen er ${fmtNum(s[s.length - 1])}${e} — det er nivået her.»`, dom: 'misvisende',
      hvorfor: `Tallet er riktig, men å kalle toppnoteringen «nivået» er å bruke det høyeste tallet som om det var det vanlige.` }
  ];

  const antall = spec.boss ? 5 : 3;
  let valgte = shuffled(rng, bank).slice(0, antall);
  /* Sørg for at minst én av hver dom er med, ellers blir oppgaven tam. */
  ['sann', 'misvisende', 'feil'].forEach(d => {
    if (!valgte.some(p => p.dom === d)) {
      valgte[valgte.length - 1] = bank.find(p => p.dom === d && !valgte.includes(p));
    }
  });
  valgte = shuffled(rng, valgte.filter(Boolean));

  return {
    verb: 'overskrifter', ctx, data, shape: spec.shape, påstander: valgte, dommer: DOMMER,
    klient: pick(rng, CLIENTS.median), visVerdier: true, boss: !!spec.boss,
    tittel: spec.boss ? 'Pressemeldingen' : 'Tre overskrifter',
    ledetekst: spec.boss
      ? 'En pressemelding om tallene over. Døm hver setning for seg.'
      : 'Samme tall, tre setninger. Hvilke tåler dagslys?',
    poeng: 10
  };
}

function sjekkOverskrifter(o, svar) {
  const status = o.påstander.map((p, i) => svar[i] === p.dom);
  const antRiktig = status.filter(Boolean).length;
  return {
    riktig: antRiktig === o.påstander.length,
    status, andel: antRiktig / o.påstander.length,
    tilbakemelding: antRiktig === o.påstander.length
      ? 'Alle tre riktig plassert.'
      : `${antRiktig} av ${o.påstander.length} riktig. Se begrunnelsene under.`
  };
}

/* ══════════════════════════════════════════════════════════════════
   9 · FINN FEILEN
   ══════════════════════════════════════════════════════════════════ */
const FEILTYPER = [
  {
    key: 'usortert', gjelder: 'median',
    label: 'Tok det midterste tallet uten å sortere først',
    regn: d => d[Math.floor(d.length / 2)],
    hvorfor: d => `Medianen er det midterste tallet i den SORTERTE rekka. Sortert blir den ${fmtNum(median(d))}.`
  },
  {
    key: 'midtpunkt', gjelder: 'median',
    label: 'Regnet ut midt mellom laveste og høyeste verdi',
    regn: d => (Math.min(...d) + Math.max(...d)) / 2,
    hvorfor: d => `Det er midtpunktet i spennet, ikke medianen. Medianen deler ANTALLET i to, og er ${fmtNum(median(d))}.`
  },
  {
    key: 'feilN', gjelder: 'mean',
    label: 'Delte på feil antall',
    regn: d => sum(d) / (d.length - 1),
    hvorfor: d => `Summen ${fmtNum(sum(d))} skal deles på ${d.length} — alle verdiene teller med. Riktig snitt er ${fmtNum(mean(d))}.`
  },
  {
    key: 'hoyeste', gjelder: 'mode',
    label: 'Oppga den største verdien i stedet for den vanligste',
    regn: d => Math.max(...d),
    hvorfor: d => `Typetallet er den verdien som forekommer OFTEST, ikke den som er størst. Her er det ${fmtModes(modes(d))}.`
  }
];

function lagFinnfeil(spec, rng) {
  const ctx = velgKontekst(spec.shape, rng);
  const data = generateData(spec.shape, ctx, rng);
  if (!data) return null;

  const mulige = FEILTYPER.filter(f => {
    if (f.gjelder === 'mode' && modes(data).length !== 1) return false;
    const galt = f.regn(data);
    const riktig = f.gjelder === 'mean' ? mean(data) : f.gjelder === 'median' ? median(data) : modes(data)[0];
    return Number.isFinite(galt) && Math.abs(galt - riktig) > 1e-6;
  });
  if (!mulige.length) return null;
  const feil = pick(rng, mulige);
  const galtSvar = feil.regn(data);

  const alternativer = shuffled(rng, [
    { key: feil.key, label: feil.label },
    ...shuffled(rng, FEILTYPER.filter(f => f.key !== feil.key)).slice(0, 2).map(f => ({ key: f.key, label: f.label })),
    { key: 'ingen', label: 'Ingenting — svaret er faktisk riktig' }
  ]);

  const navn = pick(rng, ['Iben', 'Noah', 'Selma', 'Kasper', 'Amina', 'Jonas', 'Live', 'Omar']);
  return {
    verb: 'finnfeil', ctx, data, shape: spec.shape, fasit: feil.key,
    klient: { emoji: '🧑‍🎓', navn, rolle: 'har levert et svar' },
    tittel: 'Finn feilen',
    påstand: `${navn} skulle finne ${feil.gjelder === 'mean' ? 'gjennomsnittet' : feil.gjelder === 'median' ? 'medianen' : 'typetallet'} og svarte ${fmtNum(galtSvar)}${enhetSuffiks(ctx)}.`,
    ledetekst: 'Hva gikk galt?',
    valg: alternativer, forklaring: feil.hvorfor(data), poeng: 10
  };
}

/* ══════════════════════════════════════════════════════════════════
   FELLES INNGANG
   ══════════════════════════════════════════════════════════════════ */
const BYGGERE = {
  compute: lagCompute, choose: lagChoose, interpret: lagInterpret,
  predict: lagPredict, shock: lagShock, bygg: lagBygg,
  sabotor: lagSabotor, overskrifter: lagOverskrifter, finnfeil: lagFinnfeil
};

export function lagOppgave(spec, rng) {
  const bygger = BYGGERE[spec.verb];
  if (!bygger) return null;
  for (let i = 0; i < 40; i++) {
    const o = bygger(spec, rng);
    if (o) { o.shapeInfo = o.shape ? SHAPES[o.shape] : null; return o; }
  }
  return null;
}

export function sjekk(o, svar) {
  switch (o.verb) {
    case 'compute': return sjekkCompute(o, svar);
    case 'choose': return sjekkChoose(o, svar);
    case 'interpret': return sjekkEnkeltvalg(o, svar);
    case 'finnfeil': return sjekkEnkeltvalg(o, svar);
    case 'predict': return sjekkPredict(o, svar);
    case 'shock': return sjekkShock(o, svar);
    case 'bygg': return sjekkBygg(o, svar);
    case 'sabotor': return sjekkSabotor(o, svar);
    case 'overskrifter': return sjekkOverskrifter(o, svar);
    default: return { riktig: false, tilbakemelding: '' };
  }
}

export { DOMMER };
