/* ══════════════════════════════════════════════════════════════════════════
   LRNify Poeng — enkel, delt poengteller for spillene
   ────────────────────────────────────────────────────────────────────────
   Én lokal poengsum per besøkende (localStorage, ingen pålogging ennå),
   brutt ned per spill. Tenkt som starten på et felles belønningssystem —
   flere spill kan legge til poeng ved å kalle LRNifyPoeng.leggTil().

   BRUK — én linje i sida, ingen konfigurasjon:

     <script src="/poeng/lrnify-poeng.js" defer></script>

   API:
     LRNifyPoeng.leggTil('flashcards', 30)   // legger til poeng, returnerer ny totalsum
     LRNifyPoeng.hentTotal()                 // totalsum for alle spill
     LRNifyPoeng.hentForSpill('flashcards')  // sum for ett spill
   ══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var NOKKEL = 'lrnify-poeng-v1';

  function hentData() {
    try {
      var data = JSON.parse(localStorage.getItem(NOKKEL));
      if (!data || typeof data !== 'object') return { total: 0, spill: {} };
      data.total = Number(data.total) || 0;
      data.spill = data.spill && typeof data.spill === 'object' ? data.spill : {};
      return data;
    } catch (e) {
      return { total: 0, spill: {} };
    }
  }

  function lagreData(data) {
    try { localStorage.setItem(NOKKEL, JSON.stringify(data)); } catch (e) {}
  }

  function leggTil(spillId, poeng) {
    poeng = Math.round(Number(poeng)) || 0;
    if (poeng <= 0) return hentTotal();
    var data = hentData();
    data.total += poeng;
    data.spill[spillId] = (data.spill[spillId] || 0) + poeng;
    lagreData(data);
    return data.total;
  }

  function hentTotal() { return hentData().total; }
  function hentForSpill(spillId) { return hentData().spill[spillId] || 0; }

  global.LRNifyPoeng = { leggTil: leggTil, hentTotal: hentTotal, hentForSpill: hentForSpill };
})(window);
