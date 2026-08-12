/* ══════════════════════════════════════════════════════════════════════════
   LRNify Deling — delefunksjon for lærere
   ────────────────────────────────────────────────────────────────────────
   Én flytende "Del"-knapp nederst til høyre på siden, med fire valg:

     - Del i Teams              (teams.microsoft.com/share-lenke)
     - Del i Google Classroom   (classroom.google.com/share-lenke)
     - Vis QR-kode              (for projektor — elever skanner)
     - Kopier lenke             (for itslearning, Canvas, e-post, alt annet)

   BRUK — én linje i sida, ingen konfigurasjon:

     <script src="/deling/deling.js" defer></script>

   ROMKODE — for spill/aktiviteter med rom (Poll, Temaspinner, Genetisk
   hjul, KRLE-terningen): kall denne når rommet er opprettet, så deler
   knappen bli-med-lenken (?kode=...) i stedet for den bare spillenken:

     LRNifyDeling.setRomkode('AB12CD');

   Ingen tredjepartsskript lastes ved sidevisning. QR-biblioteket
   (deling/qrcode-lib.js, vendored — se den fila for lisens) hentes først
   når noen faktisk trykker "Vis QR-kode", og alltid fra lrnify.no selv.
   Samme telle-mønster som bruk/lrnify-bruk.js: én PUT mot Firebase sitt
   REST-API per knappetrykk, ingen Firebase-SDK, ingen cookies. Se
   README.md i denne mappa.
   ══════════════════════════════════════════════════════════════════════════ */
(function (global, document) {
  'use strict';

  var DB = 'https://poll-c6bd2-default-rtdb.europe-west1.firebasedatabase.app';
  var TELLENDE_VERTER = ['lrnify.no', 'www.lrnify.no'];

  /* Samme normalisering som bruk/lrnify-bruk.js, holdt bevisst duplisert —
     modulene skal kunne stå helt for seg selv, uten avhengighet på
     lasterekkefølge. */
  function reinId(tekst, maksLengde) {
    return String(tekst || '')
      .toLowerCase()
      .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, maksLengde)
      .replace(/-+$/, '');
  }

  function dato() {
    try {
      return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo' }).format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function sideFraSti(sti) {
    var s = String(sti || '/').replace(/index\.html$/i, '').replace(/\.html$/i, '');
    return reinId(s, 60) || 'forsiden';
  }

  var SIDE = sideFraSti(location.pathname);

  function skalTelle() {
    return typeof fetch === 'function' && TELLENDE_VERTER.indexOf(location.hostname) !== -1;
  }

  /** Teller ett trykk på en delingsknapp. Feiler i stillhet, som bruk/. */
  function tell(knapp) {
    var k = reinId(knapp, 24);
    if (!k || !skalTelle()) return;
    var url = DB + '/deling/' + dato() + '/' + SIDE + '/' + k + '.json?print=silent';
    fetch(url, {
      method: 'PUT',
      body: '{".sv":{"increment":1}}',
      keepalive: true,
      cache: 'no-store'
    }).catch(function () {});
  }

  /* ── Delelenken ──────────────────────────────────────────────────────── */

  var romkode = null;

  /** Kalles fra spill med rom når koden er kjent. Se toppkommentaren. */
  function setRomkode(kode) {
    romkode = kode ? String(kode).trim().toUpperCase() : null;
    oppdaterKoblenTekst();
  }

  function delUrl() {
    var base = location.origin + location.pathname;
    return romkode ? base + '?kode=' + encodeURIComponent(romkode) : base;
  }

  function delTittel() {
    return document.title || 'LRNify';
  }

  function delTekst() {
    return romkode
      ? 'Bli med i "' + delTittel() + '" på LRNify — romkode ' + romkode
      : delTittel() + ' — gratis på LRNify';
  }

  /* ── Lite panel, satt sammen som DOM uten innerHTML av bruker-URL-er
     (title/URL settes med textContent, aldri html-streng), så en spill-
     tittel aldri kan injisere markup i panelet. ─────────────────────── */

  var CSS = '\
    .lrnify-del-knapp{position:fixed;right:16px;bottom:16px;z-index:2147483000;\
      display:flex;align-items:center;gap:6px;padding:10px 14px;border:none;\
      border-radius:999px;background:#1d4ed8;color:#fff;font:600 14px/1 \
      system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 2px 10px \
      rgba(0,0,0,.25);cursor:pointer}\
    .lrnify-del-knapp:hover{background:#1e40af}\
    .lrnify-del-knapp svg{width:16px;height:16px;flex:none}\
    .lrnify-del-panel{position:fixed;right:16px;bottom:70px;z-index:2147483000;\
      width:240px;max-width:calc(100vw - 32px);background:#fff;color:#1a1a1a;\
      border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.3);padding:10px;\
      font:14px/1.3 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:none}\
    .lrnify-del-panel.apen{display:block}\
    .lrnify-del-panel h2{font-size:12px;text-transform:uppercase;letter-spacing:.03em;\
      color:#666;margin:2px 8px 8px;font-weight:700}\
    .lrnify-del-rad{display:flex;align-items:center;gap:10px;width:100%;\
      padding:9px 8px;border:none;background:none;border-radius:8px;cursor:pointer;\
      font:inherit;color:inherit;text-align:left}\
    .lrnify-del-rad:hover{background:#f1f5f9}\
    .lrnify-del-rad svg{width:18px;height:18px;flex:none;color:#1d4ed8}\
    .lrnify-del-qr{padding:10px 6px 4px;text-align:center}\
    .lrnify-del-qr canvas{max-width:100%;height:auto;border:1px solid #e5e7eb;border-radius:8px}\
    .lrnify-del-qr p{margin:8px 0 0;font-size:12px;color:#666;word-break:break-all}\
    .lrnify-del-tilbake{background:none;border:none;color:#1d4ed8;font:600 12px/1 \
      inherit;cursor:pointer;padding:6px 8px}\
    .lrnify-del-status{font-size:12px;color:#16a34a;font-weight:700;margin-left:auto}\
  ';

  var IKON = {
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
    teams: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="13" height="12" rx="2"/><path d="M16 10h3a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-4"/><circle cx="9" cy="4" r="2"/><circle cx="18" cy="5.5" r="1.5"/></svg>',
    classroom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>',
    qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M20 14v.01M14 20h.01M20 20h.01M17 17h.01"/></svg>',
    kopier: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
  };

  function svg(navn) {
    var span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = IKON[navn];
    return span.firstChild;
  }

  var knapp, panel, listeVisning, qrVisning, koblingTekstEl;

  function byggUI() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    knapp = document.createElement('button');
    knapp.type = 'button';
    knapp.className = 'lrnify-del-knapp';
    knapp.setAttribute('aria-haspopup', 'true');
    knapp.setAttribute('aria-expanded', 'false');
    knapp.appendChild(svg('del'));
    var knappTekst = document.createElement('span');
    knappTekst.textContent = 'Del';
    knapp.appendChild(knappTekst);
    knapp.addEventListener('click', function () { setApen(!panel.classList.contains('apen')); });

    panel = document.createElement('div');
    panel.className = 'lrnify-del-panel';
    panel.setAttribute('role', 'menu');

    listeVisning = document.createElement('div');
    listeVisning.appendChild(lagOverskrift());
    listeVisning.appendChild(lagRad('teams', 'Del i Teams', apneTeams));
    listeVisning.appendChild(lagRad('classroom', 'Del i Google Classroom', apneClassroom));
    listeVisning.appendChild(lagRad('qr', 'Vis QR-kode', visQr));
    var kopierRad = lagRad('kopier', 'Kopier lenke', kopierLenke);
    koblingTekstEl = kopierRad.querySelector('.lrnify-del-status');
    listeVisning.appendChild(kopierRad);

    qrVisning = document.createElement('div');
    qrVisning.style.display = 'none';

    panel.appendChild(listeVisning);
    panel.appendChild(qrVisning);

    document.body.appendChild(knapp);
    document.body.appendChild(panel);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setApen(false);
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('apen') &&
          !panel.contains(e.target) && e.target !== knapp && !knapp.contains(e.target)) {
        setApen(false);
      }
    });
  }

  function lagOverskrift() {
    var h = document.createElement('h2');
    h.textContent = 'Del';
    return h;
  }

  function lagRad(ikon, tekst, handler) {
    var rad = document.createElement('button');
    rad.type = 'button';
    rad.className = 'lrnify-del-rad';
    rad.setAttribute('role', 'menuitem');
    rad.appendChild(svg(ikon));
    var span = document.createElement('span');
    span.textContent = tekst;
    rad.appendChild(span);
    var status = document.createElement('span');
    status.className = 'lrnify-del-status';
    rad.appendChild(status);
    rad.addEventListener('click', handler);
    return rad;
  }

  function oppdaterKoblenTekst() {
    /* Ren kosmetikk — selve lenken hentes friskt via delUrl() ved bruk,
       så dette trenger ikke oppdateres for at delefunksjonen skal virke
       riktig, bare for at kopier-raden skal vise "Kopiert!" på nytt sted
       om noen bytter rom midt i en økt. */
    if (koblingTekstEl) koblingTekstEl.textContent = '';
  }

  function setApen(apen) {
    panel.classList.toggle('apen', apen);
    knapp.setAttribute('aria-expanded', String(apen));
    if (!apen) visListe();
  }

  function visListe() {
    listeVisning.style.display = '';
    qrVisning.style.display = 'none';
  }

  function apneTeams() {
    var href = 'https://teams.microsoft.com/share?href=' +
      encodeURIComponent(delUrl()) + '&msgText=' + encodeURIComponent(delTekst());
    window.open(href, '_blank', 'noopener,noreferrer');
    tell('teams');
  }

  function apneClassroom() {
    var href = 'https://classroom.google.com/share?url=' + encodeURIComponent(delUrl());
    window.open(href, '_blank', 'noopener,noreferrer');
    tell('classroom');
  }

  function kopierLenke(e) {
    var status = e.currentTarget.querySelector('.lrnify-del-status');
    var url = delUrl();
    function visOk() { if (status) { status.textContent = 'Kopiert!'; setTimeout(function () { status.textContent = ''; }, 2000); } }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(visOk, function () { fallbackKopier(url, visOk); });
    } else {
      fallbackKopier(url, visOk);
    }
    tell('kopier');
  }

  function fallbackKopier(tekst, ferdig) {
    var input = document.createElement('input');
    input.value = tekst;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    try { document.execCommand('copy'); ferdig(); } catch (e) {}
    document.body.removeChild(input);
  }

  var qrLibLastet = null;
  function lastQrLib() {
    if (qrLibLastet) return qrLibLastet;
    qrLibLastet = new Promise(function (resolve, reject) {
      if (global.qrcode) return resolve();
      var s = document.createElement('script');
      s.src = '/deling/qrcode-lib.js';
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Fikk ikke lastet QR-biblioteket.')); };
      document.head.appendChild(s);
    });
    return qrLibLastet;
  }

  function visQr() {
    listeVisning.style.display = 'none';
    qrVisning.style.display = 'block';
    qrVisning.innerHTML = '';

    var tilbake = document.createElement('button');
    tilbake.type = 'button';
    tilbake.className = 'lrnify-del-tilbake';
    tilbake.textContent = '‹ Tilbake';
    tilbake.addEventListener('click', visListe);
    qrVisning.appendChild(tilbake);

    var boks = document.createElement('div');
    boks.className = 'lrnify-del-qr';
    boks.textContent = 'Laster …';
    qrVisning.appendChild(boks);

    var url = delUrl();
    lastQrLib().then(function () {
      var qr = global.qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      var count = qr.getModuleCount();
      var scale = 6, quiet = 3;
      var size = (count + quiet * 2) * scale;
      var canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#000';
      for (var r = 0; r < count; r++) {
        for (var c = 0; c < count; c++) {
          if (qr.isDark(r, c)) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      }
      boks.textContent = '';
      boks.appendChild(canvas);
      var p = document.createElement('p');
      p.textContent = url;
      boks.appendChild(p);
      tell('qr');
    }, function () {
      boks.textContent = 'Fikk ikke vist QR-koden. Prøv "Kopier lenke" i stedet.';
    });
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', byggUI);
    } else {
      byggUI();
    }
  }

  init();

  global.LRNifyDeling = { setRomkode: setRomkode, url: delUrl, side: SIDE };

})(window, document);
