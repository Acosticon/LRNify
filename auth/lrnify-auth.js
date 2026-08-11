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
        createUserWithEmailAndPassword: authMod.createUserWithEmailAndPassword,
        sendPasswordResetEmail: authMod.sendPasswordResetEmail,
        updateProfile: authMod.updateProfile,
        onAuthStateChanged: authMod.onAuthStateChanged,
        signOut: authMod.signOut,
        reauthenticateWithPopup: authMod.reauthenticateWithPopup,
        reauthenticateWithCredential: authMod.reauthenticateWithCredential,
        EmailAuthProvider: authMod.EmailAuthProvider,
        deleteUser: authMod.deleteUser,
        // database
        ref: dbMod.ref,
        set: dbMod.set,
        update: dbMod.update,
        get: dbMod.get
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
    const google = (firebaseUser.providerData || []).some(p => p.providerId === 'google.com');
    return {
      uid: firebaseUser.uid,
      navn: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Lærer'),
      epost: firebaseUser.email || '',
      innloggingsmetode: google ? 'google' : 'epost'
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

  /**
   * Oppretter en ny lærerkonto med e-post og selvvalgt passord. Læreren blir
   * logget inn med det samme. Enhver e-postadresse går — vi stiller ingen
   * krav om skoledomene.
   *
   * @param {string} epost
   * @param {string} passord  Firebase krever minst 6 tegn.
   * @param {string} [navn]   Vises i innloggingsmerket. Uten dette brukes
   *                          delen foran @ i e-posten.
   */
  async function registrerEpost(epost, passord, navn) {
    kreverInit();
    if (!epost || !passord) throw new Error('Fyll ut både e-post og passord.');
    if (passord.length < 6) throw new Error('Passordet må ha minst 6 tegn.');

    const resultat = await FB.createUserWithEmailAndPassword(FB.auth, epost, passord);
    if (navn) {
      // Settes før profilen skrives, så /users/{uid}/profile får riktig navn
      // med én gang og ikke «epost-delen før krøllalfa».
      try { await FB.updateProfile(resultat.user, { displayName: navn }); } catch (e) { /* ikke kritisk */ }
    }
    return tilBruker(resultat.user);
  }

  /**
   * Sender en tilbakestillingslenke til e-posten. Firebase håndterer selve
   * skjemaet der læreren velger nytt passord — vi trenger ingen egen side.
   *
   * Merk at vi med vilje IKKE forteller om adressen finnes fra før: da kunne
   * hvem som helst brukt knappen til å finne ut hvem som har konto.
   * @param {string} epost
   */
  async function tilbakestillPassord(epost) {
    kreverInit();
    if (!epost) throw new Error('Skriv inn e-postadressen din først.');
    try {
      await FB.sendPasswordResetEmail(FB.auth, epost);
    } catch (e) {
      if (e && e.code === 'auth/user-not-found') return; // se kommentaren over
      throw e;
    }
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
   * lærer automatisk. Krever at en lærer er innlogget (bruk spillets
   * eksisterende, anonyme romflyt for rom uten lærerkonto).
   *
   * Skriver to steder i ÉN atomisk operasjon: selve rommet, og en peker
   * under lærerens egen konto. Pekeren er det hentMineRom() leser — /rooms
   * kan ikke listes opp av noen (det er med vilje, ellers ville hvem som
   * helst kunne ramse opp alle aktive rom), så en spørring mot eierUid der
   * ville alltid blitt avvist. Går den ene skrivingen gjennom uten den
   * andre, ville rommet blitt usynlig for læreren — derfor multi-path.
   *
   * @param {string} spillnavn   F.eks. "klassepoll". Må matche [a-z0-9-]{1,40}.
   * @param {object} romConfig   Feltene DET spillet krever (spørsmål,
   *                             alternativer, faser, osv.).
   * @param {{romkode?: string}} [valg]  Egen romkode. Spillene har ulike
   *                             kodekonvensjoner (KlassePoll bruker seks
   *                             tegn, Temaspinner fire), og et spill som
   *                             allerede har en generator bør beholde den —
   *                             kortere koder kolliderer oftere.
   * @returns {Promise<{kode: string}>}
   */
  async function opprettRom(spillnavn, romConfig, valg) {
    kreverInit();
    const uid = getCurrentUid();
    if (!uid) throw new Error('Du må være innlogget for å opprette et rom med lærerkonto.');
    if (!spillnavn) throw new Error('opprettRom: mangler spillnavn.');

    const kode = (valg && valg.romkode) ? valg.romkode : lagRomkode();
    if (!/^[A-Z0-9]{4,8}$/.test(kode)) {
      throw new Error('opprettRom: romkoden må være 4–8 tegn A–Z/0–9, fikk "' + kode + '".');
    }
    const rom = Object.assign({}, romConfig, { eierUid: uid, spill: spillnavn });

    const endring = {};
    endring['rooms/' + kode] = rom;
    endring['users/' + uid + '/rom/' + spillnavn + '/' + kode] = { opprettet: Date.now() };
    if (romConfig && romConfig.klasseId) {
      endring['users/' + uid + '/rom/' + spillnavn + '/' + kode].klasseId = romConfig.klasseId;
    }

    await FB.update(FB.ref(FB.db), endring);
    return { kode };
  }

  /**
   * Henter innlogget lærers egne rom for et gitt spill, nyeste først.
   * Leser lærerens egen indeks (se opprettRom) og slår deretter opp hvert
   * rom for seg. Rom som er avsluttet og slettet faller ut av lista, men
   * pekeren blir liggende — se ryddeNotat i README.
   *
   * @param {string} spillnavn
   * @returns {Promise<Array<object & {kode: string}>>}
   */
  async function hentMineRom(spillnavn) {
    kreverInit();
    const uid = getCurrentUid();
    if (!uid) return [];
    if (!spillnavn) throw new Error('hentMineRom: mangler spillnavn.');

    const snap = await FB.get(FB.ref(FB.db, 'users/' + uid + '/rom/' + spillnavn));
    if (!snap.exists()) return [];

    const pekere = [];
    snap.forEach(barn => { pekere.push({ kode: barn.key, opprettet: (barn.val() || {}).opprettet || 0 }); });
    pekere.sort((a, b) => b.opprettet - a.opprettet);

    const rom = await Promise.all(pekere.map(async p => {
      const romSnap = await FB.get(FB.ref(FB.db, 'rooms/' + p.kode));
      if (!romSnap.exists()) return null; // rommet er avsluttet/slettet
      return Object.assign({ kode: p.kode }, romSnap.val());
    }));
    return rom.filter(Boolean);
  }

  /**
   * Som hentMineRom(), men på tvers av ALLE spill — til bruk på en
   * profilside, ikke inne i ett enkelt spill (der er man alltid ute etter
   * «mine rom i DETTE spillet», derfor er hentMineRom() over fortsatt den
   * som skal brukes der).
   * @returns {Promise<Array<object & {kode: string, spill: string}>>}
   */
  async function hentAlleMineRom() {
    kreverInit();
    const uid = getCurrentUid();
    if (!uid) return [];

    const snap = await FB.get(FB.ref(FB.db, 'users/' + uid + '/rom'));
    if (!snap.exists()) return [];

    const pekere = [];
    snap.forEach(perSpill => {
      perSpill.forEach(barn => { pekere.push({ kode: barn.key }); });
    });

    const rom = await Promise.all(pekere.map(async p => {
      const romSnap = await FB.get(FB.ref(FB.db, 'rooms/' + p.kode));
      if (!romSnap.exists()) return null;
      return Object.assign({ kode: p.kode }, romSnap.val());
    }));
    return rom.filter(Boolean).sort((a, b) => (b.opprettet || b.createdAt || 0) - (a.opprettet || a.createdAt || 0));
  }

  /**
   * Avslutter et rom læreren eier: sletter både rommet og pekeren i
   * lærerens indeks, atomisk. Uten dette blir pekeren liggende igjen som
   * en «død» oppføring — hentMineRom() filtrerer den riktignok bort, men
   * de hoper seg opp for hver økt.
   *
   * Er ingen lærer innlogget, slettes bare selve rommet, slik at spillets
   * eksisterende anonyme flyt oppfører seg nøyaktig som før.
   *
   * @param {string} spillnavn
   * @param {string} kode
   */
  async function avsluttRom(spillnavn, kode) {
    kreverInit();
    if (!spillnavn || !kode) throw new Error('avsluttRom: mangler spillnavn eller kode.');
    const uid = getCurrentUid();

    if (!uid) {
      await FB.set(FB.ref(FB.db, 'rooms/' + kode), null);
      return;
    }
    const endring = {};
    endring['rooms/' + kode] = null;
    endring['users/' + uid + '/rom/' + spillnavn + '/' + kode] = null;
    await FB.update(FB.ref(FB.db), endring);
  }

  /* ══════════════════════════════════════════════════════════════════════
     KLASSELISTER
     Lar læreren slippe å taste inn de samme 28 navnene på nytt for hvert
     verktøy og hver økt — velg «9B» i stedet.

     Her lagres elevfornavn. Det er den ENESTE elevdataen noe sted i denne
     strukturen, og den ligger strengt privat under lærerens egen konto.
     Legg aldri til noe mer om enkeltelever her: ikke etternavn, ikke
     fødselsdato, ikke vurderinger, og ikke relasjoner mellom elever
     («må ikke sitte sammen» o.l.) — slikt hører hjemme lokalt på lærerens
     maskin, ikke i skya. Reglene håndhever formen: hver elev kan bare ha
     navn og kjønn, ingenting annet.
     ══════════════════════════════════════════════════════════════════════ */

  // Elever normaliseres til { navn, kjonn } der kjonn er j/g/a (annet).
  function reinElev(e) {
    const navn = String((e && (e.navn != null ? e.navn : e.name)) || '').trim();
    let kjonn = String((e && (e.kjonn != null ? e.kjonn : e.gender)) || 'a').trim().toLowerCase();
    if (kjonn !== 'j' && kjonn !== 'g') kjonn = 'a';
    return navn ? { navn: navn.slice(0, 40), kjonn } : null;
  }

  /**
   * Lagrer (eller oppdaterer) en klasseliste under lærerens konto.
   *
   * @param {{klasseId?: string, navn: string, trinn?: string,
   *          elever: Array<{navn: string, kjonn?: string}>}} klasse
   *        Uten klasseId opprettes en ny; med klasseId overskrives den.
   * @returns {Promise<{klasseId: string}>}
   */
  async function lagreKlasse(klasse) {
    kreverInit();
    const uid = getCurrentUid();
    if (!uid) throw new Error('Du må være innlogget for å lagre en klasse.');
    if (!klasse || !klasse.navn || !String(klasse.navn).trim()) {
      throw new Error('Klassen må ha et navn, f.eks. «9B».');
    }

    const elever = (klasse.elever || []).map(reinElev).filter(Boolean);
    if (!elever.length) throw new Error('Klassen må ha minst én elev.');
    if (elever.length > 999) throw new Error('Klassen kan ha maks 999 elever.');

    const klasseId = klasse.klasseId || ('k' + Date.now().toString(36));
    await FB.set(FB.ref(FB.db, 'users/' + uid + '/klasser/' + klasseId), {
      navn: String(klasse.navn).trim().slice(0, 60),
      trinn: String(klasse.trinn || '').trim().slice(0, 20),
      opprettet: Date.now(),
      elever
    });
    return { klasseId };
  }

  /**
   * Henter lærerens lagrede klasser, nyeste først.
   * @returns {Promise<Array<{klasseId, navn, trinn, opprettet, elever}>>}
   */
  async function hentKlasser() {
    kreverInit();
    const uid = getCurrentUid();
    if (!uid) return [];

    const snap = await FB.get(FB.ref(FB.db, 'users/' + uid + '/klasser'));
    if (!snap.exists()) return [];

    const ut = [];
    snap.forEach(barn => {
      const v = barn.val() || {};
      ut.push({
        klasseId: barn.key,
        navn: v.navn || '',
        trinn: v.trinn || '',
        opprettet: v.opprettet || 0,
        // RTDB gir arrays tilbake som array, men et hull i indeksene gjør
        // det til et objekt — normaliser så kalleren alltid får en liste.
        elever: v.elever ? Object.keys(v.elever).map(k => v.elever[k]).filter(Boolean) : []
      });
    });
    ut.sort((a, b) => b.opprettet - a.opprettet);
    return ut;
  }

  /** Sletter en lagret klasse. */
  async function slettKlasse(klasseId) {
    kreverInit();
    const uid = getCurrentUid();
    if (!uid) throw new Error('Du må være innlogget.');
    if (!klasseId) throw new Error('slettKlasse: mangler klasseId.');
    await FB.set(FB.ref(FB.db, 'users/' + uid + '/klasser/' + klasseId), null);
  }

  /* ══════════════════════════════════════════════════════════════════════
     PROFIL OG KONTO
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * Endrer visningsnavnet. Krever IKKE fersk innlogging — Firebase reserverer
   * det kravet for sensitive endringer (passord, e-post, sletting), og
   * displayName er ikke en av dem.
   * @param {string} navn
   */
  async function oppdaterNavn(navn) {
    kreverInit();
    if (!FB.auth.currentUser) throw new Error('Du må være innlogget.');
    navn = String(navn || '').trim();
    if (!navn) throw new Error('Navnet kan ikke være tomt.');
    if (navn.length > 60) throw new Error('Navnet er for langt (maks 60 tegn).');

    await FB.updateProfile(FB.auth.currentUser, { displayName: navn });
    await FB.set(FB.ref(FB.db, 'users/' + FB.auth.currentUser.uid + '/profile/navn'), navn);

    // updateProfile endrer auth.currentUser i det stille — ingen
    // onAuthStateChanged-hendelse fyres av dette. Oppdater derfor selv, så
    // widgeten og resten av siden viser det nye navnet med én gang.
    gjeldendeBruker = tilBruker(FB.auth.currentUser);
    lyttere.forEach(cb => { try { cb(gjeldendeBruker); } catch (e) { /* ikke vårt problem */ } });
  }

  /**
   * Bekrefter identiteten til innlogget bruker på nytt — Firebase krever
   * dette rett før en sensitiv operasjon (i denne modulen: sletting av
   * kontoen) hvis økta ikke er «fersk». Uten dette ville en lærer som logget
   * inn for lenge siden få «requires-recent-login» og ikke forstå hvorfor.
   *
   * @param {string} [passord]  Påkrevd for e-post/passord-kontoer. Ignoreres
   *                            (og trengs ikke) for Google-kontoer, som i
   *                            stedet ber om en ny Google-popup.
   */
  async function reautentiser(passord) {
    kreverInit();
    const bruker = FB.auth.currentUser;
    if (!bruker) throw new Error('Du må være innlogget.');

    if (gjeldendeBruker && gjeldendeBruker.innloggingsmetode === 'google') {
      await FB.reauthenticateWithPopup(bruker, new FB.GoogleAuthProvider());
    } else {
      if (!passord) throw new Error('Skriv inn passordet ditt for å bekrefte.');
      const cred = FB.EmailAuthProvider.credential(bruker.email, passord);
      await FB.reauthenticateWithCredential(bruker, cred);
    }
  }

  /**
   * Sletter ALT — lagrede klasser, rom, innstillinger, profil, og selve
   * innloggingen. Kan ikke angres. Krever fersk innlogging (se
   * reautentiser()); kaster videre Firebase sin 'auth/requires-recent-login'
   * uendret hvis økta likevel ikke var fersk nok, slik at kalleren kan be om
   * bekreftelse på nytt og prøve igjen.
   *
   * Rekkefølgen er ikke tilfeldig: databasedataene slettes MENS vi fortsatt
   * er innlogget (alt annet ville reglene avvist), og selve
   * innloggingskontoen slettes sist — fjernes den før, mister vi tilgangen
   * til å slette resten.
   */
  async function slettHeleKontoen() {
    kreverInit();
    const uid = getCurrentUid();
    if (!uid) throw new Error('Du må være innlogget.');

    const rom = await hentAlleMineRom();
    await Promise.all(rom.map(r =>
      FB.set(FB.ref(FB.db, 'rooms/' + r.kode), null).catch(() => { /* allerede borte — fint */ })
    ));

    await FB.set(FB.ref(FB.db, 'users/' + uid), null);
    await FB.set(FB.ref(FB.db, 'resultater/' + uid), null);
    await FB.deleteUser(FB.auth.currentUser);
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
    /* Fargene og skyggene er CSS-variabler med innebygd reserveverdi, aldri
       definert av oss. Da kan en side overstyre dem i sitt eget stilark
       (f.eks. :root{--lrnauth-ink:#2b2118}) uten at rekkefølgen på stilarkene
       avgjør hvem som vinner — dette arket legges inn sist og ville ellers
       overkjørt sida. Sett ingenting, og standarden gjelder.

       Nyttige å overstyre: --lrnauth-ink, --lrnauth-gul, --lrnauth-cream,
       --lrnauth-muted, --lrnauth-skygge (f.eks. "0 5px 0" for rett
       nedover-skygge), --lrnauth-skygge-stor og --lrnauth-trykk. */
    const stil = document.createElement('style');
    stil.id = STIL_ID;
    stil.textContent = `
      .lrnauth{ font-family:'Nunito',sans-serif; }
      .lrnauth-knapp{
        display:inline-flex; align-items:center; gap:8px;
        border:3px solid var(--lrnauth-ink,#1a1a1a);
        border-radius:14px; background:var(--lrnauth-gul,#facc15);
        font-family:'Nunito',sans-serif;
        font-weight:900; font-size:.95rem; padding:9px 16px; cursor:pointer;
        box-shadow:var(--lrnauth-skygge,3px 3px 0) var(--lrnauth-ink,#1a1a1a);
        transition:transform .08s, box-shadow .08s;
        color:var(--lrnauth-ink,#1a1a1a);
      }
      .lrnauth-knapp:active{
        transform:var(--lrnauth-trykk,translate(2px,2px));
        box-shadow:0 0 0 var(--lrnauth-ink,#1a1a1a);
      }
      .lrnauth-knapp.lrnauth-hvit{ background:var(--lrnauth-cream,#fff9f0); }
      .lrnauth-brukerlinje{
        display:inline-flex; align-items:center; gap:10px;
        background:var(--lrnauth-cream,#fff9f0);
        border:3px solid var(--lrnauth-ink,#1a1a1a); border-radius:14px;
        padding:6px 8px 6px 14px;
        box-shadow:var(--lrnauth-skygge,3px 3px 0) var(--lrnauth-ink,#1a1a1a);
        font-weight:800; font-size:.9rem; color:var(--lrnauth-ink,#1a1a1a);
      }
      .lrnauth-brukerlinje .lrnauth-navn{
        max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        color:var(--lrnauth-ink,#1a1a1a); text-decoration:none;
      }
      .lrnauth-brukerlinje .lrnauth-navn:hover{ text-decoration:underline; }
      .lrnauth-brukerlinje button{
        border:2px solid var(--lrnauth-ink,#1a1a1a); border-radius:10px; background:#fff;
        font-family:'Nunito',sans-serif;
        font-weight:800; font-size:.8rem; padding:6px 10px; cursor:pointer;
        color:var(--lrnauth-ink,#1a1a1a);
      }
      .lrnauth-bakteppe{
        position:fixed; inset:0; background:rgba(26,26,26,.55); z-index:200;
        display:flex; align-items:center; justify-content:center; padding:16px;
      }
      .lrnauth-modal{
        font-family:'Nunito',sans-serif; background:var(--lrnauth-cream,#fff9f0);
        border:4px solid var(--lrnauth-ink,#1a1a1a);
        border-radius:22px; padding:24px 22px; width:100%; max-width:340px;
        box-shadow:var(--lrnauth-skygge-stor,6px 6px 0) var(--lrnauth-ink,#1a1a1a);
        position:relative;
      }
      .lrnauth-modal h2{
        font-family:'Chewy',cursive; font-weight:400; font-size:1.6rem; margin:0 0 4px;
        color:var(--lrnauth-ink,#1a1a1a); transform:rotate(-1deg);
      }
      .lrnauth-modal .lrnauth-under{ color:var(--lrnauth-muted,#7a6f63); font-size:.85rem; font-weight:700; margin-bottom:16px; }
      .lrnauth-lukk{
        position:absolute; top:14px; right:14px; border:none; background:none; cursor:pointer;
        font-size:1.2rem; line-height:1; color:var(--lrnauth-muted,#7a6f63); font-weight:900;
      }
      .lrnauth-modal input{
        width:100%; box-sizing:border-box; padding:11px 13px;
        border:3px solid var(--lrnauth-ink,#1a1a1a);
        border-radius:12px; font-family:'Nunito',sans-serif; font-weight:800; font-size:1rem;
        background:#fff; color:var(--lrnauth-ink,#1a1a1a); margin-bottom:10px;
      }
      .lrnauth-modal input:focus{ outline:3px solid var(--lrnauth-gul,#facc15); outline-offset:1px; }
      .lrnauth-modal .lrnauth-knapp{ width:100%; justify-content:center; margin-bottom:10px; box-sizing:border-box; }
      .lrnauth-modal textarea{
        width:100%; box-sizing:border-box; padding:10px 12px; min-height:90px; resize:vertical;
        border:3px solid var(--lrnauth-ink,#1a1a1a); border-radius:12px;
        font-family:'Nunito',sans-serif; font-weight:700; font-size:.95rem; line-height:1.5;
        background:#fff; color:var(--lrnauth-ink,#1a1a1a); margin-bottom:10px;
      }
      .lrnauth-modal textarea:focus{ outline:3px solid var(--lrnauth-gul,#facc15); outline-offset:1px; }
      .lrnauth-modal label{
        display:block; font-weight:800; font-size:.78rem; text-transform:uppercase;
        letter-spacing:.04em; color:var(--lrnauth-muted,#7a6f63); margin:6px 0 5px;
      }
      .lrnauth-elevgrupper{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .lrnauth-skille{
        display:flex; align-items:center; gap:10px; color:var(--lrnauth-muted,#7a6f63); font-weight:800;
        font-size:.75rem; text-transform:uppercase; letter-spacing:.04em; margin:14px 0;
      }
      .lrnauth-skille::before, .lrnauth-skille::after{ content:''; flex:1; height:2px; background:#e4dccb; }
      .lrnauth-feil{
        color:#dc2626; font-weight:800; font-size:.85rem; background:#fee2e2;
        border:3px solid #dc2626; border-radius:12px; padding:8px 10px; margin-top:4px;
      }
      .lrnauth-ok{
        color:#166534; font-weight:800; font-size:.85rem; background:#dcfce7;
        border:3px solid #16a34a; border-radius:12px; padding:8px 10px; margin-top:4px;
      }
      .lrnauth-lenker{
        display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-top:2px;
      }
      .lrnauth-lenker button{
        background:none; border:none; padding:4px 0; cursor:pointer;
        font-family:'Nunito',sans-serif; font-weight:800; font-size:.82rem;
        color:var(--lrnauth-muted,#7a6f63); text-decoration:underline;
      }
      .lrnauth-lenker button:hover{ color:var(--lrnauth-ink,#1a1a1a); }
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
   * Forutsetter at init() allerede er kalt.
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
        const navn = document.createElement('a');
        navn.className = 'lrnauth-navn';
        navn.href = '/konto/';
        navn.title = 'Min konto';
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
          <h2 data-tittel>Lærerinnlogging</h2>
          <div class="lrnauth-under" data-undertekst>Én konto på tvers av alle LRNify-spill. Elevene trenger ikke logge inn.</div>
          <button type="button" class="lrnauth-knapp" data-google>Fortsett med Google</button>
          <div class="lrnauth-skille">eller</div>
          <input type="text" data-navn placeholder="Navnet ditt" autocomplete="name" class="lrnauth-skjult">
          <input type="email" data-epost placeholder="E-post" autocomplete="username">
          <input type="password" data-passord placeholder="Passord" autocomplete="current-password">
          <button type="button" class="lrnauth-knapp lrnauth-hvit" data-send>Logg inn med e-post</button>
          <div class="lrnauth-lenker">
            <button type="button" data-bytt>Ny bruker? Lag konto</button>
            <button type="button" data-glemt>Glemt passord?</button>
          </div>
          <div class="lrnauth-feil lrnauth-skjult" data-feil></div>
          <div class="lrnauth-ok lrnauth-skjult" data-ok></div>
        </div>
      `;
      document.body.appendChild(bakteppe);

      const felt = v => bakteppe.querySelector('[data-' + v + ']');
      const feilEl = felt('feil'), okEl = felt('ok');
      const visFeil = m => { okEl.classList.add('lrnauth-skjult'); feilEl.textContent = m; feilEl.classList.remove('lrnauth-skjult'); };
      const visOk = m => { feilEl.classList.add('lrnauth-skjult'); okEl.textContent = m; okEl.classList.remove('lrnauth-skjult'); };
      const nullstillMelding = () => { feilEl.classList.add('lrnauth-skjult'); okEl.classList.add('lrnauth-skjult'); };
      const lukk = () => bakteppe.remove();

      /* Tre moduser i samme panel: 'inn' (logg inn), 'ny' (lag konto) og
         'glemt' (tilbakestill). Å bytte mellom dem skjuler/viser felter
         i stedet for å bygge tre ulike modaler. */
      let modus = 'inn';
      function tegnModus() {
        nullstillMelding();
        const nyKonto = modus === 'ny', glemt = modus === 'glemt';
        felt('tittel').textContent = nyKonto ? 'Lag lærerkonto' : glemt ? 'Glemt passord' : 'Lærerinnlogging';
        felt('undertekst').textContent = nyKonto
          ? 'Bruk den e-posten du vil, og velg et passord på minst 6 tegn.'
          : glemt
            ? 'Vi sender en lenke der du kan velge nytt passord.'
            : 'Én konto på tvers av alle LRNify-spill. Elevene trenger ikke logge inn.';
        felt('navn').classList.toggle('lrnauth-skjult', !nyKonto);
        felt('passord').classList.toggle('lrnauth-skjult', glemt);
        felt('passord').setAttribute('autocomplete', nyKonto ? 'new-password' : 'current-password');
        felt('send').textContent = nyKonto ? 'Lag konto' : glemt ? 'Send lenke' : 'Logg inn med e-post';
        felt('bytt').textContent = nyKonto ? '← Tilbake til innlogging' : 'Ny bruker? Lag konto';
        felt('glemt').classList.toggle('lrnauth-skjult', glemt);
      }

      bakteppe.addEventListener('click', e => { if (e.target === bakteppe) lukk(); });
      bakteppe.querySelector('.lrnauth-lukk').addEventListener('click', lukk);
      felt('bytt').addEventListener('click', () => { modus = (modus === 'ny') ? 'inn' : 'ny'; tegnModus(); });
      felt('glemt').addEventListener('click', () => { modus = 'glemt'; tegnModus(); });

      felt('google').addEventListener('click', async () => {
        try { await loginGoogle(); lukk(); }
        catch (e) { visFeil('Fikk ikke logget inn med Google: ' + forklar(e)); }
      });

      felt('send').addEventListener('click', async () => {
        const epost = felt('epost').value.trim();
        const passord = felt('passord').value;
        const navn = felt('navn').value.trim();
        felt('send').disabled = true;
        try {
          if (modus === 'glemt') {
            await tilbakestillPassord(epost);
            visOk('Sjekk innboksen din — vi har sendt en lenke hvis adressen har en konto.');
          } else if (modus === 'ny') {
            await registrerEpost(epost, passord, navn);
            lukk();
          } else {
            await loginEmail(epost, passord);
            lukk();
          }
        } catch (e) {
          visFeil(forklar(e));
        } finally {
          felt('send').disabled = false;
        }
      });

      // Enter i et felt gjør det samme som å trykke hovedknappen
      bakteppe.querySelectorAll('input').forEach(i => {
        i.addEventListener('keydown', e => { if (e.key === 'Enter') felt('send').click(); });
      });

      tegnModus();
    }

    /* Firebase sine feilkoder er engelske og lite hjelpsomme for en lærer
       midt i en time. De vanligste oversettes; resten faller tilbake på
       den opprinnelige teksten så ingenting blir borte. */
    function forklar(e) {
      const kode = (e && e.code) || '';
      switch (kode) {
        case 'auth/invalid-email':          return 'E-postadressen ser ikke riktig ut.';
        case 'auth/missing-password':       return 'Skriv inn passordet ditt.';
        case 'auth/weak-password':          return 'Passordet må ha minst 6 tegn.';
        case 'auth/email-already-in-use':   return 'Det finnes allerede en konto med denne e-posten. Prøv å logge inn i stedet.';
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':         return 'Feil e-post eller passord.';
        case 'auth/too-many-requests':      return 'For mange forsøk. Vent litt og prøv igjen.';
        case 'auth/popup-blocked':          return 'Nettleseren blokkerte innloggingsvinduet. Tillat popup for denne sida, eller bruk e-post.';
        case 'auth/popup-closed-by-user':   return 'Innloggingsvinduet ble lukket.';
        case 'auth/network-request-failed': return 'Fikk ikke kontakt med nettet. Sjekk tilkoblingen og prøv igjen.';
        case 'auth/operation-not-allowed':  return 'Denne innloggingsmåten er ikke skrudd på i Firebase ennå.';
        default: return (e && e.message) || 'Ukjent feil.';
      }
    }

    tegn(gjeldendeBruker);
    onAuthChange(tegn);
  }

  /**
   * Tegner en «+ Lag klasseliste»-knapp — en egen, opt-in komponent, IKKE
   * en del av mountLoginWidget(). Grunnen er at ikke alle sider som har
   * login-knappen faktisk jobber med klasselister (forsiden, KlassePoll) —
   * bare de som gjør det (Klassekart, Elevvelger, /konto/) skal montere
   * denne i tillegg, ved siden av login-knappen.
   *
   * Utlogget: knappen viser en beskjed om at innlogging trengs, i stedet for
   * å åpne noe. Innlogget: åpner en modal for å lage en ny klasseliste
   * (navn, valgfritt trinn, elever gruppert jenter/gutter/annet — samme
   * inndeling som Klassekart bruker til kjønnsbalanserte grupper), som
   * lagres med lagreKlasse().
   *
   * @param {HTMLElement} container
   * @param {{ onOpprettet?: (klasse: {klasseId: string}) => void }} [valg]
   *        onOpprettet kalles etter vellykket lagring, slik at siden kan
   *        oppdatere sin egen liste over klasselister.
   */
  function mountKlasselisteKnapp(container, valg) {
    if (!container) throw new Error('mountKlasselisteKnapp: mangler container-element.');
    settInnStil();
    valg = valg || {};
    container.classList.add('lrnauth');

    const knapp = document.createElement('button');
    knapp.type = 'button';
    knapp.className = 'lrnauth-knapp lrnauth-hvit';
    knapp.textContent = '+ Lag klasseliste';
    container.appendChild(knapp);

    const beskjedEl = document.createElement('div');
    beskjedEl.className = 'lrnauth-feil lrnauth-skjult';
    container.appendChild(beskjedEl);

    knapp.addEventListener('click', () => {
      beskjedEl.classList.add('lrnauth-skjult');
      if (!getCurrentUid()) {
        beskjedEl.textContent = 'Du må være logget inn for å opprette klasser.';
        beskjedEl.classList.remove('lrnauth-skjult');
        return;
      }
      apneKlasselisteModal(valg);
    });
  }

  function apneKlasselisteModal(valg) {
    const bakteppe = document.createElement('div');
    bakteppe.className = 'lrnauth-bakteppe';
    bakteppe.innerHTML = `
      <div class="lrnauth-modal" role="dialog" aria-modal="true" aria-label="Lag klasseliste" style="max-width:420px;">
        <button type="button" class="lrnauth-lukk" aria-label="Lukk">✕</button>
        <h2>Lag klasseliste</h2>
        <div class="lrnauth-under">Navnene lagres på kontoen din, og kan brukes i Klassekart, Elevvelger og andre verktøy — uten å tastes inn på nytt.</div>
        <input type="text" data-navn placeholder="Navn, f.eks. 9B" maxlength="60">
        <input type="text" data-trinn placeholder="Trinn (valgfritt)" maxlength="20" style="margin-top:-4px;">
        <div class="lrnauth-elevgrupper">
          <div><label>Jenter</label><textarea data-jenter placeholder="Ett navn per linje"></textarea></div>
          <div><label>Gutter</label><textarea data-gutter placeholder="Ett navn per linje"></textarea></div>
        </div>
        <label>Ikke oppgitt / annet</label>
        <textarea data-annet placeholder="Ett navn per linje" style="min-height:50px;"></textarea>
        <button type="button" class="lrnauth-knapp" data-lagre style="margin-top:12px;">Lagre klasseliste</button>
        <div class="lrnauth-feil lrnauth-skjult" data-feil></div>
      </div>
    `;
    document.body.appendChild(bakteppe);

    const felt = v => bakteppe.querySelector('[data-' + v + ']');
    const feilEl = felt('feil');
    const visFeil = m => { feilEl.textContent = m; feilEl.classList.remove('lrnauth-skjult'); };
    const lukk = () => bakteppe.remove();

    bakteppe.addEventListener('click', e => { if (e.target === bakteppe) lukk(); });
    bakteppe.querySelector('.lrnauth-lukk').addEventListener('click', lukk);

    function navnliste(tekst, kjonn) {
      return String(tekst || '').split('\n').map(s => s.trim()).filter(Boolean).map(navn => ({ navn, kjonn }));
    }

    felt('lagre').addEventListener('click', async () => {
      feilEl.classList.add('lrnauth-skjult');
      const elever = [].concat(
        navnliste(felt('jenter').value, 'j'),
        navnliste(felt('gutter').value, 'g'),
        navnliste(felt('annet').value, 'a')
      );
      felt('lagre').disabled = true;
      try {
        const resultat = await lagreKlasse({ navn: felt('navn').value, trinn: felt('trinn').value, elever });
        lukk();
        if (valg && valg.onOpprettet) valg.onOpprettet(resultat);
      } catch (e) {
        visFeil(e.message);
      } finally {
        felt('lagre').disabled = false;
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     OFFENTLIG API
     ══════════════════════════════════════════════════════════════════════ */
  global.LRNifyAuth = {
    init,
    onAuthChange,
    loginGoogle,
    loginEmail,
    registrerEpost,
    tilbakestillPassord,
    logout,
    getCurrentUid,
    opprettRom,
    hentMineRom,
    hentAlleMineRom,
    avsluttRom,
    lagreKlasse,
    hentKlasser,
    slettKlasse,
    oppdaterNavn,
    reautentiser,
    slettHeleKontoen,
    mountLoginWidget,
    mountKlasselisteKnapp
  };
})(window);
