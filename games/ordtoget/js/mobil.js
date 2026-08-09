/* =========================================================
   MOBILVERSJONEN
   Legger til det som er særegent for mobil:
   - måler visualViewport så layouten krymper når tastaturet
     kommer opp (i stedet for at innholdet skyves ut av syne)
   - haptisk respons
   - togstallen som bunnark
   - demotog på startskjermen
   ========================================================= */

import { createApp } from './app.js';
import { buildCarriage, buildCoupling } from './carriages.js';
import { saveChoice } from './device.js';

/* ---------- demotog på startskjermen ---------- */
function buildDemoTrain(){
  const el = document.getElementById('demoTrain');
  if(!el) return;
  const demo = [['katt', 'loco'], ['tog', 'freight'], ['gul', 'frost']];
  demo.forEach(([word, type], i) => {
    if(i > 0) el.appendChild(buildCoupling());
    el.appendChild(buildCarriage(word, type, { current: i === demo.length - 1 }));
  });
}

/* ---------- skjermtastatur ---------- */
function trackViewport(){
  const vv = window.visualViewport;
  const root = document.body;

  const apply = () => {
    const h = vv ? vv.height : window.innerHeight;
    root.style.setProperty('--vh', h + 'px');
    // Er mer enn 18 % av skjermen borte, regner vi tastaturet som oppe.
    const full = window.innerHeight;
    root.classList.toggle('kb-open', full - h > full * 0.18);
  };

  apply();
  if(vv){
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
  }
  window.addEventListener('orientationchange', () => setTimeout(apply, 250));
  window.addEventListener('resize', apply);
}

/* ---------- vognskjulet ---------- */
let openDepotSheet = () => {};

function wireDepot(renderDepot){
  const btn = document.getElementById('depotBtn');
  const sheet = document.getElementById('depotSheet');
  const scrim = document.getElementById('depotScrim');
  const close = document.getElementById('depotClose');
  if(!btn || !sheet) return;

  const open = () => {
    renderDepot();
    sheet.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    // Er det en pakke å åpne, skal den ha fokus – det er derfor
    // spilleren kom hit.
    const crate = sheet.querySelector('.crate');
    (crate || close || sheet).focus();
  };
  const shut = () => {
    sheet.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  };
  openDepotSheet = open;

  btn.addEventListener('click', open);
  scrim && scrim.addEventListener('click', shut);
  close && close.addEventListener('click', shut);
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && !sheet.hidden) shut();
  });
}

/* ---------- oppstart ---------- */
buildDemoTrain();
trackViewport();

document.querySelectorAll('[data-switch]').forEach(a => {
  a.addEventListener('click', () => saveChoice(a.dataset.switch));
});

createApp({
  haptics: true,
  shortPlaceholder: true,
  openDepot(){ openDepotSheet(); },
  init({ renderDepot }){
    wireDepot(renderDepot);
  }
});
