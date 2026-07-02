// ============================================================
// LRNify Utstillingsløype — kjernebibliotek
// Sesjon (localStorage), fremdrift, poeng, toppliste (Firestore
// med lokal demo-fallback). Krever config.js lastet først.
// ============================================================

const Loype = (() => {
  const C = LOYPE_CONFIG;

  // ---------- Sesjon ----------
  function hentState() {
    try { return JSON.parse(localStorage.getItem(C.storageKey)) || null; }
    catch { return null; }
  }
  function lagreState(s) { localStorage.setItem(C.storageKey, JSON.stringify(s)); }

  function registrer(lagnavn) {
    lagreState({ lag: lagnavn.trim(), start: Date.now(), poster: {}, levert: false });
  }

  function nullstill() { localStorage.removeItem(C.storageKey); }

  function totalPoeng(s) {
    s = s || hentState();
    if (!s) return 0;
    return Object.values(s.poster).reduce((sum, p) => sum + p.poeng, 0);
  }

  function antallFullfort(s) {
    s = s || hentState();
    return s ? Object.keys(s.poster).length : 0;
  }

  // ---------- Ukesnummer (ISO 8601) ----------
  function ukeNaa() {
    const d = new Date();
    const dato = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dag = dato.getUTCDay() || 7;
    dato.setUTCDate(dato.getUTCDate() + 4 - dag);
    const nyttaar = new Date(Date.UTC(dato.getUTCFullYear(), 0, 1));
    const uke = Math.ceil(((dato - nyttaar) / 86400000 + 1) / 7);
    return `${dato.getUTCFullYear()}-W${String(uke).padStart(2, "0")}`;
  }

  // ---------- Sidevakt: krever registrering ----------
  // Kalles øverst på hver post-side. Uregistrerte sendes til start,
  // og kommer tilbake hit etterpå (QR kan scannes i vilkårlig rekkefølge).
  function krevLag(postId) {
    const s = hentState();
    if (!s || !s.lag) {
      const hit = location.pathname.split("/").pop();
      location.replace(`index.html?neste=${encodeURIComponent(hit)}`);
      return null;
    }
    return s;
  }

  // ---------- Felles topplinje (lagnavn + fremdriftsfisker) ----------
  function tegnTopp(aktivPostId) {
    const s = hentState();
    const topp = document.getElementById("loype-topp");
    if (!topp) return;
    const fisker = C.poster.map(p => {
      const tatt = s && s.poster[p.id] ? "tatt" : "";
      const her = p.id === aktivPostId ? "her" : "";
      return `<div class="fisk ${tatt} ${her}" title="${p.tittel}" aria-label="${p.tittel}${tatt ? " – fullført" : ""}">${p.emoji}</div>`;
    }).join("");
    topp.innerHTML = `
      <div class="bolge" aria-hidden="true"></div>
      ${s ? `<div class="lagnavn-vis">⚓ ${escapeHtml(s.lag)} · ${totalPoeng(s)} poeng</div>` : ""}
      <div class="fremdrift" role="img" aria-label="${antallFullfort(s)} av ${C.poster.length} poster fullført">${fisker}</div>`;
  }

  // ---------- Fullfør en post ----------
  function fullforPost(postId, poeng, maks) {
    const s = hentState();
    if (!s) return;
    s.poster[postId] = { poeng, maks };
    lagreState(s);
    visResultat(postId, poeng, maks);
  }

  function gjenstaende() {
    const s = hentState();
    return C.poster.filter(p => !s || !s.poster[p.id]);
  }

  function postListeHtml() {
    return `<ul style="list-style:none; text-align:left; font-weight:800;">` +
      gjenstaende().map(p =>
        `<li style="margin:6px 0;">${p.emoji} ${escapeHtml(p.tittel)} — <em>${escapeHtml(p.plassering)}</em></li>`
      ).join("") + `</ul>`;
  }

  function visResultat(postId, poeng, maks) {
    const alleTatt = antallFullfort() >= C.poster.length;
    const jubel = poeng >= maks ? "Perfekt! 🌟" : poeng >= maks / 2 ? "Bra jobba! 💪" : "Godt forsøk! 🐙";
    const div = document.createElement("div");
    div.className = "overlegg";
    // Med vilje INGEN lenke til neste oppgave: dere må fysisk finne
    // og scanne neste QR-kode. Det er hele poenget med løypa!
    div.innerHTML = `
      <div class="kort senter" role="alertdialog" aria-label="Resultat">
        <h2>${jubel}</h2>
        <div class="poeng-stor">${poeng} / ${maks}</div>
        <p>poeng på denne posten</p>
        <div class="mellomrom"></div>
        ${alleTatt
          ? `<a class="knapp" href="ferdig.html">Se resultatet ditt! 🏆</a>`
          : `<p><strong>📱 Finn og scan neste QR-kode:</strong></p>
             ${postListeHtml()}`}
      </div>`;
    document.body.appendChild(div);
    const fokus = div.querySelector("a") || div.querySelector(".kort");
    if (fokus.focus) fokus.focus();
  }

  // Vis "allerede fullført" hvis posten er tatt fra før
  function sjekkAlleredeTatt(postId) {
    const s = hentState();
    if (s && s.poster[postId]) {
      const p = s.poster[postId];
      const alleTatt = antallFullfort(s) >= C.poster.length;
      document.querySelector(".ramme").innerHTML = `
        <div class="kort senter">
          <h2>Denne posten har dere alt tatt! ✅</h2>
          <div class="poeng-stor">${p.poeng} / ${p.maks}</div>
          <div class="mellomrom"></div>
          ${alleTatt
            ? `<a class="knapp" href="ferdig.html">Til resultatet 🏆</a>`
            : `<p><strong>📱 Finn og scan neste QR-kode:</strong></p>
               ${postListeHtml()}`}
        </div>`;
      tegnTopp(postId);
      return true;
    }
    return false;
  }

  // ---------- Toppliste: Firestore eller lokal demo ----------
  let db = null;
  function initFirebase() {
    if (!C.firebase || !window.firebase) return false;
    if (!db) {
      firebase.initializeApp(C.firebase);
      db = firebase.firestore();
    }
    return true;
  }

  // Leverer score. Returnerer Promise — feiler den, viser ferdig-siden
  // en "prøv igjen"-knapp (dårlig dekning inne i akvariet er forventet).
  async function leverScore() {
    const s = hentState();
    if (!s || s.levert) return { ok: true, alleredeLevert: !!(s && s.levert) };
    const rad = {
      lag: s.lag.slice(0, 40),
      poeng: totalPoeng(s),
      poster: antallFullfort(s),
      uke: ukeNaa(),
      tid: Date.now(),
    };
    if (initFirebase()) {
      await db.collection(C.firestoreCollection).add(rad); // kaster ved feil
    } else {
      // Demo-modus: lokal liste
      const key = C.storageKey + "_demo_liste";
      const liste = JSON.parse(localStorage.getItem(key) || "[]");
      liste.push(rad);
      localStorage.setItem(key, JSON.stringify(liste));
    }
    s.levert = true;
    lagreState(s);
    return { ok: true };
  }

  async function hentToppliste(maksAntall = 10) {
    const uke = ukeNaa();
    if (initFirebase()) {
      const snap = await db.collection(C.firestoreCollection)
        .where("uke", "==", uke)
        .orderBy("poeng", "desc")
        .limit(maksAntall)
        .get();
      return snap.docs.map(d => d.data());
    }
    const key = C.storageKey + "_demo_liste";
    const liste = JSON.parse(localStorage.getItem(key) || "[]");
    return liste.filter(r => r.uke === uke)
                .sort((a, b) => b.poeng - a.poeng)
                .slice(0, maksAntall);
  }

  // ---------- Hjelpere ----------
  function escapeHtml(t) {
    return String(t).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function stokk(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return {
    hentState, registrer, nullstill, totalPoeng, antallFullfort,
    krevLag, tegnTopp, fullforPost, sjekkAlleredeTatt,
    leverScore, hentToppliste, ukeNaa, escapeHtml, stokk,
    gjenstaende, postListeHtml,
  };
})();
