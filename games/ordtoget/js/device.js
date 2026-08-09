/* =========================================================
   ENHETSVALG
   Avgjør om spilleren skal til mobil- eller PC-versjonen.
   Et lagret valg vinner alltid over automatikken.
   ========================================================= */

const KEY = 'ordtoget-versjon';

export function savedChoice(){
  try {
    const v = localStorage.getItem(KEY);
    return (v === 'mobil' || v === 'pc') ? v : null;
  } catch(e){ return null; }
}

export function saveChoice(v){
  try { localStorage.setItem(KEY, v); } catch(e){ /* ignorer */ }
}

export function clearChoice(){
  try { localStorage.removeItem(KEY); } catch(e){ /* ignorer */ }
}

/**
 * Berøringsskjerm uten musepeker, eller en smal skjerm, regnes
 * som mobil. Nettbrett havner bevisst på mobilversjonen – der er
 * det berøring og skjermtastatur som styrer designet, ikke bredden.
 */
export function detect(){
  const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
  const coarse = mq('(pointer: coarse)');
  const noHover = mq('(hover: none)');
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  if(coarse && noHover) return 'mobil';
  if(shortSide < 700) return 'mobil';
  return 'pc';
}

export function resolve(){
  return savedChoice() || detect();
}
