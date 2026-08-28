/* ══════════════════════════════════════════════════════════════════════════
   LRNify Tilbake — veien hjem fra en delt lenke
   ────────────────────────────────────────────────────────────────────────
   Legger én liten flytende «← LRNify»-knapp øverst til venstre.

   Hvorfor: de fleste spillene og verktøyene ble laget som frittstående
   sider uten topptekst. Deles en direktelenke — som er hele poenget med
   deleknappen i /deling/ — er eleven i en blindgate når økta er ferdig,
   og sida bærer ingen avsender.

   De nyeste spillene har allerede en egen topptekst med logo og
   «← Tilbake». Modulen ser etter en slik lenke først og gjør ingenting
   hvis den finnes, så den kan trygt legges på enhver side.

   BRUK — én linje, ingen konfigurasjon:

     <script src="/nav/lrnify-tilbake.js" defer></script>

   Ingen nettverkskall, ingen sporing, ingen cookies. Samme mønster som
   /deling/deling.js: egen <style>, alle klasser med lrnify-prefiks, og
   en z-index høyt nok til å ligge over spillenes egne lag.
   ══════════════════════════════════════════════════════════════════════════ */
(function (document) {
  'use strict';

  var MAAL = '/index.html#grid';

  /* Finnes det allerede en synlig LRNify-logo øverst til venstre? Da
     lager vi ikke en til. Ser bare etter .logo-lenker — en vanlig lenke
     nederst på sida (f.eks. «Flere spill på LRNify» i en avsnittstekst)
     dekker ikke kravet om logo øverst til venstre, og skal ikke stoppe
     denne modulen fra å legge på den flytende knappen. */
  function harAlleredeTilbakelenke() {
    var lenker = document.querySelectorAll('a.logo[href]');
    for (var i = 0; i < lenker.length; i++) {
      var href = lenker[i].getAttribute('href') || '';
      if (/^(\.\.\/)+index\.html/.test(href)) return true;
      if (href === '/' || /^\/index\.html/.test(href)) return true;
    }
    return false;
  }

  function lagStil() {
    var style = document.createElement('style');
    style.textContent = '\
      .lrnify-tilbake{position:fixed;left:12px;top:12px;z-index:2147482000;\
        display:inline-flex;align-items:center;gap:6px;\
        padding:7px 12px;border-radius:999px;\
        background:rgba(255,255,255,.94);color:#2b2118;\
        border:2px solid rgba(43,33,24,.85);text-decoration:none;\
        font:800 13px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;\
        box-shadow:0 2px 10px rgba(0,0,0,.18);\
        opacity:.72;transition:opacity .15s,transform .15s}\
      .lrnify-tilbake:hover,.lrnify-tilbake:focus-visible{opacity:1;transform:translateY(-1px)}\
      .lrnify-tilbake:focus-visible{outline:3px solid #facc15;outline-offset:2px}\
      .lrnify-tilbake b{color:#b8901a;font-weight:800}\
      @media print{.lrnify-tilbake{display:none}}\
      @media (prefers-reduced-motion:reduce){.lrnify-tilbake{transition:none}}\
      @media (max-width:420px){.lrnify-tilbake{left:8px;top:8px;padding:6px 10px;font-size:12px}}';
    document.head.appendChild(style);
  }

  function monter() {
    if (harAlleredeTilbakelenke()) return;
    if (document.querySelector('.lrnify-tilbake')) return;

    lagStil();

    var a = document.createElement('a');
    a.className = 'lrnify-tilbake';
    a.href = MAAL;
    a.setAttribute('aria-label', 'Tilbake til LRNify');
    a.innerHTML = '← LRN<b>ify</b>';
    document.body.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monter);
  } else {
    monter();
  }
})(document);
