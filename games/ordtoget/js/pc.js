/* =========================================================
   PC-VERSJONEN
   Tastaturet er hovedinngangen, og togstallen ligger alltid
   framme ved siden av. Ingen skjermtastatur å ta hensyn til,
   så layouten kan bruke hele høyden.
   ========================================================= */

import { createApp } from './app.js';
import { buildCarriage, buildCoupling } from './carriages.js';
import { saveChoice } from './device.js';

/* ---------- demotog på startskjermen ---------- */
function buildDemoTrain(){
  const el = document.getElementById('demoTrain');
  if(!el) return;
  const demo = [['katt', 'loco'], ['tog', 'freight'], ['gul', 'freight']];
  demo.forEach(([word, type], i) => {
    if(i > 0) el.appendChild(buildCoupling());
    el.appendChild(buildCarriage(word, type, { current: i === demo.length - 1 }));
  });
}

buildDemoTrain();

document.querySelectorAll('[data-switch]').forEach(a => {
  a.addEventListener('click', () => saveChoice(a.dataset.switch));
});

createApp({
  haptics: false,
  shortPlaceholder: false,
  init({ focusInput }){
    // På PC er det ingenting i veien for å ha skrivefeltet klart
    // med én gang spilleren begynner å skrive.
    document.addEventListener('keydown', (e) => {
      const gameScreen = document.getElementById('screen-game');
      if(!gameScreen || !gameScreen.classList.contains('active')) return;
      if(e.metaKey || e.ctrlKey || e.altKey) return;
      if(/^[a-zæøåA-ZÆØÅ]$/.test(e.key)) focusInput();
    });
  }
});
