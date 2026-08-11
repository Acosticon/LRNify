/* ══════════════════════════════════════════════════════════════════════════
   LRNify Auth — felles innloggingsmodul for alle LRNify-spill
   ────────────────────────────────────────────────────────────────────────
   Gir lærere ÉN konto på tvers av Temaspinner, Genetisk hjul, KlassePoll,
   KRLE-terning osv. Elever logger aldri inn — de blir med via romkode som
   før, helt uendret.

   BRUK (i et hvilket som helst spill):

     <script src="/auth/lrnify-auth.js"></script>
     <script>
       LRNifyAuth.init({
         apiKey: "...", authDomain: "poll-c6bd2.firebaseapp.com",
         databaseURL: "https://poll-c6bd2-default-rtdb.europe-west1.firebasedatabase.app",
         projectId: "poll-c6bd2", storageBucket: "poll-c6bd2.firebasestorage.app",
         messagingSenderId: "...", appId: "..."
       });
       LRNifyAuth.onAuthChange(user => { ... });
     </script>

   Se README.md i denne mappa for et fullstendig eksempel (Temaspinner).

   Firebase-SDK-en lastes først når init() kalles — ikke ved sidelast — slik
   at et spill som aldri viser innloggingsknappen heller ikke betaler for
   nedlastingen. Samme mønster som resten av LRNify (se aktiviteter/temaspinner).
   ══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  const KILDE = 'https://www.gstatic.com/firebasejs/10.12.2/';

  /* ── Intern tilstand ─────────────────────────────────────────────────── */
  let FB = null;              // { app, db, auth, ...Firebase-funksjoner }
  let lastPromise = null;     // laster SDK-en bare én gang, uansett hvor mange kaller init()
  let ferdigInit = null;      // løses når auth-tilstanden er kjent for første gang
  let gjeldendeBruker = null; // { uid, navn, epost } | null
  const lyttere = [];         // registrerte onAuthChange-callbacker

  /* ══════════════════════════════════════════════════════════════════════
     OPPSTART
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * Laster Firebase-modulene (app, auth, database) og kobler til prosjektet.
   * Trygt å kalle flere ganger — andre og senere kall gjenbruker samme instans.
   *
   * @param {object} firebaseConfig  Samme config-objekt som resten av LRNify
   *                                 bruker mot poll-c6bd2.
   * @returns {Promise<void>}
   */
  function init(firebaseConfig) {
    if (!firebaseConfig) {
      return Promise.reject(new Error('LRNifyAuth.init: mangler firebaseConfig.'));
    }
    if (lastPromise) return lastPromise;

    lastPromise = Promise.all([
      import(KILDE + 'firebase-app.js'),
      import(KILDE + 'firebase-auth.js'),
      import(KILDE + 'firebase-database.js')
    ]).then(([appMod, authMod, dbMod]) => {
      const app = appMod.initializeApp(firebaseConfig);
      const auth = authMod.getAuth(app);
      const db = dbMod.getDatabase(app);

      FB = {
        app, auth, db,
        // auth
        GoogleAuthProvider: authMod.GoogleAuthProvider,
        signInWithPopup: authMod.signInWithPopup,
        signInWithEmailAndPassword: authMod.signInWithEmailAndPassword,
        onAuthStateChanged: authMod.onAuthStateChanged,
        signOut: authMod.signOut,
        // database
        ref: dbMod.ref,
        set: dbMod.set,
        update: dbMod.update,
        get: dbMod.get,
        push: dbMod.push,
        query: dbMod.query,
        orderByChild: dbMod.orderByChild,
        equalTo: dbMod.equalTo,
        serverTimestamp: dbMod.serverTimestamp
      };

      if (!ferdigInit) {
        ferdigInit = new Promise(losFerdigInit => {
          FB.onAuthStateChanged(FB.auth, async firebaseUser => {
            gjeldendeBruker = firebaseUser ? tilBruker(firebaseUser) : null;
            if (firebaseUser) {
              await sikreProfil(firebaseUser).catch(() => { /* ikke nett, ikke kritisk */ });
            }
            lyttere.forEach(cb => { try { cb(gjeldendeBruker); } catch (e) { /* feil i kallerens callback skal ikke stoppe resten */ } });
            losFerdigInit();
          });
        });
      }
    }).catch(e => {
      lastPromise = null; // la et nytt forsøk laste på nytt hvis skolenettet blokkerte gstatic.com denne gangen
      throw e;
    });

    return lastPromise;
  }

  function tilBruker(firebaseUser) {
    return {
      uid: firebaseUser.uid,
      navn: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Lærer'),
      epost: firebaseUser.email || ''
    };
  }

  // Oppretter /users/{uid}/profile første gang en lærer logger inn. Rører
  // aldri feltet igjen etter det — lærerens eget navn/e-post i Firebase
  // Authentication er alltid fasit, profilen her er bare et lesbart kopi
  // reglene kan koble klasser og innstillinger til.
  async function sikreProfil(firebaseUser) {
    const profilRef = FB.ref(FB.db, 'users/' + firebaseUser.uid + '/profile');
    const snap = await FB.get(profilRef);
    if (snap.exists()) return;
    await FB.set(profilRef, {
      navn: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Lærer'),
      epost: firebaseUser.email || '',
      opprettet: Date.now()
    });
  }

  function kreverInit() {
    if (!FB) throw new Error('LRNifyAuth: kall init(firebaseConfig) før dette.');
  }

  /* ══════════════════════════════════════════════════════════════════════
     AUTH-TILSTAND
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * Registrerer en callback som kalles med gjeldende bruker med én gang
   * (så snart auth-tilstanden er avklart), og på nytt hver gang den endrer seg.
   * @param {(bruker: {uid:string, navn:string, epost:string} | null) => void} callback
   */
  function onAuthChange(callback) {
    if (typeof callback !== 'function') return;
    lyttere.push(callback);
    if (ferdigInit) {
      ferdigInit.then(() => callback(gjeldendeBruker));
    }
  }

  /** @returns {string | null} uid-en til innlogget lærer, eller null. */
  function getCurrentUid() {
    return gjeldendeBruker ? gjeldendeBruker.uid : null;
  }

  /* ══════════════════════════════════════════════════════════════════════
     INNLOGGING
     ══════════════════════════════════════════════════════════════════════ */

  /** Google-innlogging via popup. Primærmetoden — lavest friksjon for lærere. */
  async function loginGoogle() {
    kreverInit();
    const provider = new FB.GoogleAuthProvider();
    const resultat = await FB.signInWithPopup(FB.auth, provider);
    return tilBruker(resultat.user);
  }

  /** E-post/passord-innlogging. Fallback for lærere uten (eller som ikke vil bruke) Google-konto. */
  async function loginEmail(epost, passord) {
    kreverInit();
    if (!epost || !passord) throw new Error('Fyll ut både e-post og passord.');
    const resultat = await FB.signInWithEmailAndPassword(FB.auth, epost, passord);
    return tilBruker(resultat.user);
  }

  /** Logger ut gjeldende lærer. */
  function logout() {
    kreverInit();
    return FB.signOut(FB.auth);
  }

  /* ══════════════════════════════════════════════════════════════════════
     ROM
     Skriver mot den delte /rooms/{kode}-samlingen (samme sti som KlassePoll
     bruker i dag) og setter eierUid automatisk. romConfig må inneholde
     feltene reglene krever for akkurat det spillet (se firebase/README.md)
     — denne funksjonen legger bare på eierskaps-feltene i tillegg.
     ══════════════════════════════════════════════════════════════════════ */

  const ALFABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // uten forvekslingsbare O/0 og I/1
  function lagRomkode() {
    let kode = '';
    const tall = new Uint32Array(4);
    (global.crypto || global.msCrypto).getRandomValues(tall);
    for (let i = 0; i < 4; i++) kode += ALFABET[tall[i] % ALFABET.length];
    return kode;
  }

  /**
   * Oppretter et rom under /rooms/{kode} og setter eierUid til innlogget
   * lærer automatisk. Krever at en lærer er innlogget (bruk elevenes
   * eksisterende, anonyme romflyt for rom uten lærerkonto).
   *
   * @param {string} spillnavn   F.eks. "temaspinner" — lagres som eget felt
   *                             så samme lærer sine rom kan skilles per spill.
   * @param {object} romConfig   Feltene DET spillet krever i tillegg
   *                             (spørsmål/alternativer, faser, osv.).
   * @returns {Promise<{kode: string}>}
   */
  async function opprettRom(spillnavn, romConfig) {
    kreverInit();
    const uid = getCurrentUid();
    if (!uid) throw new Error('Du må være innlogget for å opprette et rom med lærerkonto.');
    if (!spillnavn) throw new Error('opprettRom: mangler spillnavn.');

    const kode = lagRomkode();
    const data = Object.assign({}, romConfig, {
      eierUid: uid,
      spill: spillnavn
    });
    await FB.set(FB.ref(FB.db, 'rooms/' + kode), data);
    return { kode };
  }

  /**
   * Henter innlogget lærers egne rom for et gitt spill, nyeste først om
   * romConfig inneholder createdAt/opprettet.
   * @param {string} spillnavn
   * @returns {Promise<Array<object & {kode: string}>>}
   */
  async function hentMineRom(spillnavn) {
    kreverInit();
    const uid = getCurrentUid();
    if (!uid) return [];

    const q = FB.query(FB.ref(FB.db, 'rooms'), FB.orderByChild('eierUid'), FB.equalTo(uid));
    const snap = await FB.get(q);
    if (!snap.exists()) return [];

    const rom = [];
    snap.forEach(barn => {
      const verdi = barn.val();
      if (!spillnavn || verdi.spill === spillnavn) {
        rom.push(Object.assign({ kode: barn.key }, verdi));
      }
    });
    return rom;
  }

  /* ══════════════════════════════════════════════════════════════════════
     UI-KOMPONENT
     Liten, selvstendig login-knapp + modal. Ingen eksterne CSS-rammeverk —
     stilene injiseres i <head> første gang mountLoginWidget() kalles, og
     matcher LRNify-designsystemet (Chewy/Nunito, cream, gul aksent, tykke
     kanter, harde skygger) slik at den kan settes rett øverst i en
     tavle.html-visning uten å skille seg ut.
     ══════════════════════════════════════════════════════════════════════ */

  const STIL_ID = 'lrnify-auth-stil';
  function settInnStil() {
    if (document.getElementById(STIL_ID)) return;
    if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Chewy"]')) {
      const forbind1 = document.createElement('link');
      forbind1.rel = 'preconnect'; forbind1.href = 'https://fonts.googleapis.com';
      const forbind2 = document.createElement('link');
      forbind2.rel = 'preconnect'; forbind2.href = 'https://fonts.gstatic.com'; forbind2.crossOrigin = '';
      const font = document.createElement('link');
      font.rel = 'stylesheet';
      font.href = 'https://fonts.googleapis.com/css2?family=Chewy&family=Nunito:wght@400;700;800;900&display=swap';
      document.head.appendChild(forbind1);
      document.head.appendChild(forbind2);
      document.head.appendChild(font);
    }
    const stil = document.createElement('style');
    stil.id = STIL_ID;
    stil.textContent = `
      .lrnauth{ font-family:'Nunito',sans-serif; }
      .lrnauth-knapp{
        display:inline-flex; align-items:center; gap:8px; border:3px solid #1a1a1a;
        border-radius:14px; background:#facc15; font-family:'Nunito',sans-serif;
        font-weight:900; font-size:.95rem; padding:9px 16px; cursor:pointer;
        box-shadow:3px 3px 0 #1a1a1a; transition:transform .08s, box-shadow .08s;
        color:#1a1a1a;
      }
      .lrnauth-knapp:active{ transform:translate(2px,2px); box-shadow:1px 1px 0 #1a1a1a; }
      .lrnauth-knapp.lrnauth-hvit{ background:#fff9f0; }
      .lrnauth-brukerlinje{
        display:inline-flex; align-items:center; gap:10px; background:#fff9f0;
        border:3px solid #1a1a1a; border-radius:14px; padding:6px 8px 6px 14px;
        box-shadow:3px 3px 0 #1a1a1a; font-weight:800; font-size:.9rem; color:#1a1a1a;
      }
      .lrnauth-brukerlinje .lrnauth-navn{ max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .lrnauth-brukerlinje button{
        border:2px solid #1a1a1a; border-radius:10px; background:#fff; font-family:'Nunito',sans-serif;
        font-weight:800; font-size:.8rem; padding:6px 10px; cursor:pointer; color:#1a1a1a;
      }
      .lrnauth-bakteppe{
        position:fixed; inset:0; background:rgba(26,26,26,.55); z-index:200;
        display:flex; align-items:center; justify-content:center; padding:16px;
      }
      .lrnauth-modal{
        font-family:'Nunito',sans-serif; background:#fff9f0; border:4px solid #1a1a1a;
        border-radius:22px; padding:24px 22px; width:100%; max-width:340px;
        box-shadow:6px 6px 0 #1a1a1a; position:relative;
      }
      .lrnauth-modal h2{
        font-family:'Chewy',cursive; font-weight:400; font-size:1.6rem; margin:0 0 4px;
        color:#1a1a1a; transform:rotate(-1deg);
      }
      .lrnauth-modal .lrnauth-under{ color:#7a6f63; font-size:.85rem; font-weight:700; margin-bottom:16px; }
      .lrnauth-lukk{
        position:absolute; top:14px; right:14px; border:none; background:none; cursor:pointer;
        font-size:1.2rem; line-height:1; color:#7a6f63; font-weight:900;
      }
      .lrnauth-modal input{
        width:100%; box-sizing:border-box; padding:11px 13px; border:3px solid #1a1a1a;
        border-radius:12px; font-family:'Nunito',sans-serif; font-weight:800; font-size:1rem;
        background:#fff; color:#1a1a1a; margin-bottom:10px;
      }
      .lrnauth-modal input:focus{ outline:3px solid #facc15; outline-offset:1px; }
      .lrnauth-modal .lrnauth-knapp{ width:100%; justify-content:center; margin-bottom:10px; box-sizing:border-box; }
      .lrnauth-skille{
        display:flex; align-items:center; gap:10px; color:#7a6f63; font-weight:800;
        font-size:.75rem; text-transform:uppercase; letter-spacing:.04em; margin:14px 0;
      }
      .lrnauth-skille::before, .lrnauth-skille::after{ content:''; flex:1; height:2px; background:#e4dccb; }
      .lrnauth-feil{
        color:#dc2626; font-weight:800; font-size:.85rem; background:#fee2e2;
        border:3px solid #dc2626; border-radius:12px; padding:8px 10px; margin-top:4px;
      }
      .lrnauth-skjult{ display:none !important; }
    `;
    document.head.appendChild(stil);
  }

  /**
   * Rendrer en kompakt login-knapp (eller brukerlinje med logg ut, hvis
   * allerede innlogget) inn i et gitt element. Bytter automatisk mellom
   * tilstandene når auth endrer seg. Ikke del av kjerne-API-et over, men
   * nødvendig for kravet om en innebygd UI-komponent — se README.md.
   *
   * @param {HTMLElement} container
   * @param {{ tekstInnlogget?: string, tekstUtlogget?: string }} [valg]
   */
  function mountLoginWidget(container, valg) {
    if (!container) throw new Error('mountLoginWidget: mangler container-element.');
    settInnStil();
    valg = valg || {};
    container.classList.add('lrnauth');

    function tegn(bruker) {
      container.innerHTML = '';
      if (bruker) {
        const linje = document.createElement('div');
        linje.className = 'lrnauth-brukerlinje';
        const navn = document.createElement('span');
        navn.className = 'lrnauth-navn';
        navn.textContent = '👋 ' + (valg.tekstInnlogget || bruker.navn);
        const utKnapp = document.createElement('button');
        utKnapp.type = 'button';
        utKnapp.textContent = 'Logg ut';
        utKnapp.addEventListener('click', () => logout().catch(() => {}));
        linje.appendChild(navn);
        linje.appendChild(utKnapp);
        container.appendChild(linje);
      } else {
        const knapp = document.createElement('button');
        knapp.type = 'button';
        knapp.className = 'lrnauth-knapp';
        knapp.textContent = valg.tekstUtlogget || '🎓 Lærer? Logg inn';
        knapp.addEventListener('click', apneModal);
        container.appendChild(knapp);
      }
    }

    function apneModal() {
      const bakteppe = document.createElement('div');
      bakteppe.className = 'lrnauth-bakteppe';
      bakteppe.innerHTML = `
        <div class="lrnauth-modal" role="dialog" aria-modal="true" aria-label="Logg inn">
          <button type="button" class="lrnauth-lukk" aria-label="Lukk">✕</button>
          <h2>Lærerinnlogging</h2>
          <div class="lrnauth-under">Én konto på tvers av alle LRNify-spill. Elevene trenger ikke logge inn.</div>
          <button type="button" class="lrnauth-knapp" data-google>🇬 Fortsett med Google</button>
          <div class="lrnauth-skille">eller</div>
          <input type="email" data-epost placeholder="E-post" autocomplete="username">
          <input type="password" data-passord placeholder="Passord" autocomplete="current-password">
          <button type="button" class="lrnauth-knapp lrnauth-hvit" data-epostknapp>Logg inn med e-post</button>
          <div class="lrnauth-feil lrnauth-skjult" data-feil></div>
        </div>
      `;
      document.body.appendChild(bakteppe);

      const feilEl = bakteppe.querySelector('[data-feil]');
      const visFeil = melding => { feilEl.textContent = melding; feilEl.classList.remove('lrnauth-skjult'); };
      const lukk = () => bakteppe.remove();

      bakteppe.addEventListener('click', e => { if (e.target === bakteppe) lukk(); });
      bakteppe.querySelector('.lrnauth-lukk').addEventListener('click', lukk);

      bakteppe.querySelector('[data-google]').addEventListener('click', async () => {
        try { await loginGoogle(); lukk(); }
        catch (e) { visFeil('Fikk ikke logget inn med Google: ' + e.message); }
      });
      bakteppe.querySelector('[data-epostknapp]').addEventListener('click', async () => {
        const epost = bakteppe.querySelector('[data-epost]').value.trim();
        const passord = bakteppe.querySelector('[data-passord]').value;
        try { await loginEmail(epost, passord); lukk(); }
        catch (e) { visFeil('Fikk ikke logget inn: ' + e.message); }
      });
    }

    tegn(gjeldendeBruker);
    onAuthChange(tegn);
  }

  /* ══════════════════════════════════════════════════════════════════════
     OFFENTLIG API
     ══════════════════════════════════════════════════════════════════════ */
  global.LRNifyAuth = {
    init,
    onAuthChange,
    loginGoogle,
    loginEmail,
    logout,
    getCurrentUid,
    opprettRom,
    hentMineRom,
    mountLoginWidget
  };
})(window);
