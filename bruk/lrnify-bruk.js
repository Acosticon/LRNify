/* ══════════════════════════════════════════════════════════════════════════
   LRNify Bruk — anonym besøkstelling
   ────────────────────────────────────────────────────────────────────────
   Teller hvor mange ganger hver side åpnes. Ingenting mer.

   Ingen informasjonskapsler, ingen localStorage, ingen bruker-ID, ingen
   IP-lagring, ingen tredjepart: skriptet legger på nøyaktig ett tall i
   LRNify sin egen Firebase-database (europe-west1), i et oppsett der
   enkeltbesøk aldri kan skilles fra hverandre. Det som ligger i databasen
   er «forsiden ble åpnet 143 ganger 4. mars» — ikke hvem, ikke hvorfra.

   BRUK — én linje nederst i sida, ingen konfigurasjon:

     <script src="/bruk/lrnify-bruk.js" defer></script>

   Sidenavnet utledes fra adressen (/games/3s1f/ → «games-3s1f»). Vil du
   overstyre det, sett data-side på script-taggen:

     <script src="/bruk/lrnify-bruk.js" data-side="einstein" defer></script>

   SENERE — hendelser i spillet, eller varighet:

     LRNifyBruk.tell('runde-fullfort');

   Databasestrukturen (bruk/<dato>/<side>/<hendelse> = antall) har allerede
   plass til det; dashbordet på /bruk/ viser nye hendelsesnavn av seg selv,
   uten endringer verken i regler eller i dette skriptet.

   Firebase-SDK-en lastes med vilje IKKE her. Tellingen er én fetch() mot
   REST-API-et, slik at alle sidene på LRNify slipper å laste ~100 kB
   Firebase for å bli talt. Se README.md i denne mappa.
   ══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var DB = 'https://poll-c6bd2-default-rtdb.europe-west1.firebasedatabase.app';

  /* Bare den ekte sida telles. Lokal utvikling, forhåndsvisninger og
     file:// skal ikke blande seg inn i tallene. */
  var TELLENDE_VERTER = ['lrnify.no', 'www.lrnify.no'];

  /**
   * Gjør en tekst om til en nøkkel databasereglene godtar: små bokstaver,
   * tall og bindestrek. Samme normalisering brukes på både sidenavn og
   * hendelsesnavn, så regelen i database.rules.json er den samme for begge.
   */
  function reinId(tekst, maksLengde) {
    return String(tekst || '')
      .toLowerCase()
      .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, maksLengde)
      .replace(/-+$/, '');
  }

  /**
   * Datoen i norsk tid, som «2026-03-04». Uten fast tidssone ville en
   * lærer i Norge og en server i USA lagt samme økt på hver sin dato.
   * (Formatet «sv-SE» gir ISO-datoen direkte.)
   */
  function dato() {
    try {
      return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo' }).format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  /** /games/3s1f/ → «games-3s1f», / → «forsiden». */
  function sideFraSti(sti) {
    var s = String(sti || '/').replace(/index\.html$/i, '').replace(/\.html$/i, '');
    return reinId(s, 60) || 'forsiden';
  }

  var scriptTag = document.currentScript;
  var SIDE = (scriptTag && scriptTag.dataset && scriptTag.dataset.side)
    ? reinId(scriptTag.dataset.side, 60)
    : sideFraSti(location.pathname);

  function skalTelle() {
    return typeof fetch === 'function' && TELLENDE_VERTER.indexOf(location.hostname) !== -1;
  }

  /**
   * Øker én teller med 1. Feiler i stillhet — en side skal aldri knekke,
   * og en lærer skal aldri se en feilmelding, fordi statistikk ikke kom
   * fram.
   *
   * @param {string} [hendelse]  Standard 'visning'. Senere f.eks.
   *                             'runde-start' eller 'runde-fullfort'.
   * @returns {Promise<boolean>} Om tellingen gikk gjennom.
   */
  function tell(hendelse) {
    var h = reinId(hendelse || 'visning', 24);
    if (!h || !SIDE || !skalTelle()) return Promise.resolve(false);

    var url = DB + '/bruk/' + dato() + '/' + SIDE + '/' + h + '.json?print=silent';

    /* {".sv":{"increment":1}} er Firebase sin serverside-inkrementering:
       databasen legger til 1 på det tallet som ligger der, uansett hvor
       mange klasser som åpner samme spill i samme sekund. Klienten trenger
       verken å lese det gamle tallet eller kjøre en transaksjon — og
       trenger derfor heller ikke leserettigheter på statistikken.

       Content-Type settes bevisst ikke: da regnes kallet som en «simple
       request» og nettleseren slipper en ekstra OPTIONS-runde før hver
       telling. Firebase leser kroppen som JSON uansett. */
    return fetch(url, {
      method: 'PUT',
      body: '{".sv":{"increment":1}}',
      keepalive: true,
      cache: 'no-store'
    }).then(function (r) { return r.ok; }, function () { return false; });
  }

  global.LRNifyBruk = { tell: tell, side: SIDE, dato: dato };

  tell('visning');

})(window);
