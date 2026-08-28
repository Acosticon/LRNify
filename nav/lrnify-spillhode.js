/* ══════════════════════════════════════════════════════════════════════════
   LRNify Spillhode — tilbake til spillets egen forside
   ────────────────────────────────────────────────────────────────────────
   Toppteksten i spillene har to lenker: LRNify-logoen (ut av spillet, til
   forsiden) og en «← Tilbake»-knapp. Tilbake-knappen skal IKKE gå til
   LRNify-forsiden — den skal gå til spillets egen startskjerm, siden det
   allerede finnes en logo som dekker veien ut.

   Denne modulen leter etter lenker merket med data-home-screen og bytter
   dem fra ekstern navigasjon til intern skjermbytte, ved å gjenbruke det
   spillene allerede gjør selv (skru av «aktiv» på alle skjermer, skru på
   for målskjermen). Fungerer uansett hvilket funksjonsnavn spillet selv
   bruker internt (showScreen, visSkjerm, visSkjerm …), siden vi går
   direkte på klassene i stedet for å kalle spillets egen funksjon.

   BRUK — i toppteksten:

     <a class="back-btn" href="." data-home-screen="screen-start">← Tilbake</a>

   href="." er reserveveien hvis JS ikke kjører: siden laster på nytt, og
   startskjermen er alltid den aktive ved førstelasting.

   Valgfrie attributter hvis spillet ikke bruker screen/active-konvensjonen:

     data-screen-class="skjerm"   (standard: screen)
     data-active-class="aktiv"    (standard: active)

     <script src="/nav/lrnify-spillhode.js" defer></script>
   ══════════════════════════════════════════════════════════════════════════ */
(function (document) {
  'use strict';

  /* Noen spill har løpende tellere (setInterval) som bør stanses når man
     forlater runden via header-knappen. Vi later ikke som vi kjenner
     spillets interne funksjonsnavn — vi prøver bare de vanligste, og
     ignorerer stille hvis de ikke finnes. */
  var MULIGE_STOPP_FUNKSJONER = ['stopTimer', 'stopGame', 'pauseGame'];

  function stoppLopendeTellere() {
    MULIGE_STOPP_FUNKSJONER.forEach(function (navn) {
      try {
        if (typeof window[navn] === 'function') window[navn]();
      } catch (e) { /* spillet har ikke denne, gå videre */ }
    });
  }

  function bindLenke(lenke) {
    var malId = lenke.getAttribute('data-home-screen');
    var mal = document.getElementById(malId);
    if (!mal) return; /* finner ikke skjermen — la href="." gjøre jobben */

    lenke.addEventListener('click', function (e) {
      e.preventDefault();
      var skjermKlasse = lenke.getAttribute('data-screen-class') || 'screen';
      var aktivKlasse = lenke.getAttribute('data-active-class') || 'active';
      document.querySelectorAll('.' + skjermKlasse).forEach(function (s) {
        s.classList.toggle(aktivKlasse, s === mal);
      });
      window.scrollTo(0, 0);
      stoppLopendeTellere();
    });
  }

  function monter() {
    document.querySelectorAll('[data-home-screen]').forEach(bindLenke);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monter);
  } else {
    monter();
  }
})(document);
