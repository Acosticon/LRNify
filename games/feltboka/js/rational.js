/* =========================================================
   EKSAKTE TALL OG SVARTOLKNING
   Alt av fasit og elevsvar går gjennom brøker med heltall, aldri
   flyttall. Da slipper vi at 0,1 + 0,2 ikke er 0,3, og da kan
   3/4, 0,75 og 6/8 sammenliknes som det samme tallet uten
   toleransegrenser.

   Én bevisst avgjørelse: et svar godtas hvis det har RIKTIG VERDI.
   3/8 og 0,375 er begge riktig på en brøkoppgave. Skal spillet
   kreve brøkform eller forkortet brøk, er det den ene funksjonen
   `sammenlign` som må strammes inn — se DESIGN.md.
   ========================================================= */

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

/** Lager en forkortet brøk. Nevneren er alltid positiv. */
export function br(teller, nevner = 1) {
  if (nevner === 0) throw new Error('Nevner kan ikke være 0');
  // Et flyttall her betyr at en generator har regnet 28,8 et sted den
  // trodde svaret gikk opp. Da skal det smelle, ikke bli til en brøk
  // med 15 sifre i nevneren.
  if (!Number.isInteger(teller) || !Number.isInteger(nevner)) {
    throw new Error(`Brøk krever heltall, fikk ${teller}/${nevner}`);
  }
  const tegn = nevner < 0 ? -1 : 1;
  const t = teller * tegn, n = nevner * tegn;
  const d = gcd(t, n);
  return { t: t / d, n: n / d };
}

export const pluss  = (a, b) => br(a.t * b.n + b.t * a.n, a.n * b.n);
export const minus  = (a, b) => br(a.t * b.n - b.t * a.n, a.n * b.n);
export const gange  = (a, b) => br(a.t * b.t, a.n * b.n);
export const erLik  = (a, b) => a.t === b.t && a.n === b.n;
export const erHeltall = (a) => a.n === 1;
export const tilTall = (a) => a.t / a.n;

/** Brøk som tekst: heltall uten nevner, ellers «t/n». */
export function tekst(a) {
  return a.n === 1 ? String(a.t) : `${a.t}/${a.n}`;
}

/**
 * Tolker det eleven skrev.
 * Godtar: 12 · -12 · −12 (unicode minus) · 3/4 · -3/4 · 0,75 · 0.75
 *         · «x = 5» · mellomrom hvor som helst.
 * Returnerer null når teksten ikke er et tall i det hele tatt.
 */
export function tolkSvar(tekstInn) {
  if (typeof tekstInn !== 'string') return null;

  let s = tekstInn
    .replace(/[−‒–—]/g, '-')  // unicode minus/streker → bindestrek
    .replace(/\s+/g, '')
    .replace(/^svar[:=]?/i, '')
    .replace(/^[a-zæøå][:=]/i, '')                // «x=», «y=»
    .replace(',', '.');

  if (!s) return null;

  const brok = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (brok) {
    const n = Number(brok[2]);
    if (n === 0) return null;
    return br(Number(brok[1]), n);
  }

  const desimal = s.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (desimal) {
    const tegn = desimal[1] === '-' ? -1 : 1;
    const hel = Number(desimal[2]);
    const des = desimal[3] || '';
    const nevner = 10 ** des.length;
    return br(tegn * (hel * nevner + Number(des || 0)), nevner);
  }

  return null;
}

/** Er elevens svar riktig? */
export function sammenlign(fasit, svarTekst) {
  const tolket = tolkSvar(svarTekst);
  if (!tolket) return { riktig: false, tolket: null, tomt: !svarTekst.trim() };
  return { riktig: erLik(fasit, tolket), tolket, tomt: false };
}
