(function () {
  'use strict';

  const SETT = FLASHCARD_SETS[0];
  const ANTALL = SETT.kort.length;

  const el = (id) => document.getElementById(id);
  const skjermer = ['skjerm-modus', 'skjerm-kort', 'skjerm-par', 'skjerm-test'];
  let aktivSkjerm = 'skjerm-modus';

  function visSkjerm(id) {
    aktivSkjerm = id;
    skjermer.forEach((s) => el(s).classList.toggle('is-hidden', s !== id));
    el('global-back').classList.toggle('is-hidden', id === 'skjerm-modus');
    el('overlegg').classList.add('is-hidden');
    const kontekst = {
      'skjerm-modus': 'Velg øvingsmåte',
      'skjerm-kort': modusState.retning === 'begrep' ? 'Se begrep' : 'Se definisjon',
      'skjerm-par': 'Koble par',
      'skjerm-test': 'Test deg selv'
    };
    el('header-context').textContent = kontekst[id];
  }

  function shuffle(liste) {
    const kopi = liste.slice();
    for (let i = kopi.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [kopi[i], kopi[j]] = [kopi[j], kopi[i]];
    }
    return kopi;
  }

  /* ---------- Modusvalg ---------- */
  const MODUSER = [
    { id: 'definisjon', emoji: '📖', tittel: 'Se definisjon', tekst: 'Du ser definisjonen. Trykk for å avsløre begrepet.', chip: 'Ett kort om gangen' },
    { id: 'begrep', emoji: '🏷️', tittel: 'Se begrep', tekst: 'Du ser begrepet. Trykk for å avsløre definisjonen.', chip: 'Ett kort om gangen' },
    { id: 'par', emoji: '🔗', tittel: 'Koble par', tekst: 'Alle begreper og definisjoner ligger som kort. Match dem sammen.', chip: '10 par' },
    { id: 'test', emoji: '✅', tittel: 'Test deg selv', tekst: 'Enkel quiz med fire svaralternativer per spørsmål.', chip: '10 spørsmål' }
  ];

  function renderModusvalg() {
    el('tema-fag').textContent = SETT.fag;
    el('tema-tittel').textContent = SETT.tittel;
    el('tema-beskrivelse').textContent = SETT.beskrivelse;

    const rutenett = el('modusrutenett');
    rutenett.innerHTML = '';
    MODUSER.forEach((m) => {
      const knapp = document.createElement('button');
      knapp.className = 'subject-card';
      knapp.type = 'button';
      knapp.innerHTML =
        '<div class="emoji" aria-hidden="true">' + m.emoji + '</div>' +
        '<div><h3>' + m.tittel + '</h3><p>' + m.tekst + '</p></div>' +
        '<span class="chip">' + m.chip + '</span>';
      knapp.addEventListener('click', () => startModus(m.id));
      rutenett.appendChild(knapp);
    });
  }

  function startModus(id) {
    if (id === 'definisjon' || id === 'begrep') startKortmodus(id);
    else if (id === 'par') startParmodus();
    else if (id === 'test') startTestmodus();
  }

  /* ---------- Modus a/b: snu-kort ---------- */
  const modusState = { retning: 'definisjon', rekkefolge: [], indeks: 0, flippet: false };

  function startKortmodus(retning) {
    modusState.retning = retning;
    modusState.rekkefolge = shuffle(SETT.kort.map((_, i) => i));
    modusState.indeks = 0;
    modusState.flippet = false;
    el('kort-eyebrow').textContent = retning === 'begrep' ? 'Se begrep' : 'Se definisjon';
    el('kort-tittel').textContent = SETT.tittel;
    visSkjerm('skjerm-kort');
    renderKort();
  }

  function renderKort() {
    const kort = SETT.kort[modusState.rekkefolge[modusState.indeks]];
    const forsideErBegrep = modusState.retning === 'begrep';
    el('frontLabel').textContent = forsideErBegrep ? 'Begrep' : 'Definisjon';
    el('frontText').textContent = forsideErBegrep ? kort.begrep : kort.definisjon;
    el('backLabel').textContent = forsideErBegrep ? 'Definisjon' : 'Begrep';
    el('backText').textContent = forsideErBegrep ? kort.definisjon : kort.begrep;

    modusState.flippet = false;
    const kortEl = el('flipCard');
    kortEl.classList.remove('is-flipped');
    kortEl.setAttribute('aria-pressed', 'false');

    el('kort-fremdrift').textContent = (modusState.indeks + 1) + ' / ' + ANTALL;
    el('kort-forrige').disabled = modusState.indeks === 0;
  }

  function snuKort() {
    modusState.flippet = !modusState.flippet;
    el('flipCard').classList.toggle('is-flipped', modusState.flippet);
    el('flipCard').setAttribute('aria-pressed', String(modusState.flippet));
  }

  function nesteKort() {
    if (modusState.indeks >= ANTALL - 1) {
      visResultat({
        tittel: 'Du har sett gjennom alle kortene!',
        tekst: 'Bra jobba – du gikk gjennom alle ' + ANTALL + ' kortene i ' + SETT.tittel + '.',
        emoji: '🎉',
        score1Label: 'Kort sett',
        score1: ANTALL + ' / ' + ANTALL,
        score2Label: 'Retning',
        score2: modusState.retning === 'begrep' ? 'Begrep → def.' : 'Def. → begrep',
        nesteAction: () => startKortmodus(modusState.retning)
      });
      return;
    }
    modusState.indeks++;
    renderKort();
  }

  function forrigeKort() {
    if (modusState.indeks === 0) return;
    modusState.indeks--;
    renderKort();
  }

  /* ---------- Modus c: koble par ---------- */
  const parState = { fliser: [], valgte: [], funnet: 0, bom: 0, laast: false };

  function startParmodus() {
    const fliser = [];
    SETT.kort.forEach((kort) => {
      fliser.push({ matchId: kort.id, type: 'begrep', tekst: kort.begrep });
      fliser.push({ matchId: kort.id, type: 'definisjon', tekst: kort.definisjon });
    });
    parState.fliser = shuffle(fliser);
    parState.valgte = [];
    parState.funnet = 0;
    parState.bom = 0;
    parState.laast = false;
    el('par-bom').textContent = '0';
    settParFeedback('Velg to kort', 'Match hvert begrep med riktig definisjon.', '');
    visSkjerm('skjerm-par');
    renderPar();
  }

  function oppdaterParFremdrift() {
    el('par-fremdrift').textContent = parState.funnet + ' av ' + ANTALL + ' par funnet';
  }

  function settParFeedback(tittel, tekst, klasse) {
    const boks = el('par-feedback');
    boks.className = 'feedback' + (klasse ? ' ' + klasse : '');
    el('par-feedback-tittel').textContent = tittel;
    el('par-feedback-tekst').textContent = tekst;
  }

  function renderPar() {
    oppdaterParFremdrift();
    const rutenett = el('par-rutenett');
    rutenett.innerHTML = '';
    parState.fliser.forEach((flis, indeks) => {
      const knapp = document.createElement('button');
      knapp.type = 'button';
      knapp.className = 'tile type-' + flis.type;
      knapp.textContent = flis.tekst;
      knapp.dataset.indeks = String(indeks);
      if (flis.matchet) {
        knapp.classList.add('matched');
        knapp.disabled = true;
      }
      knapp.addEventListener('click', () => velgFlis(indeks));
      rutenett.appendChild(knapp);
    });
  }

  function velgFlis(indeks) {
    if (parState.laast) return;
    const flis = parState.fliser[indeks];
    if (flis.matchet || parState.valgte.includes(indeks)) return;

    parState.valgte.push(indeks);
    renderPar();
    document.querySelectorAll('.par-grid .tile')[indeks].classList.add('selected');

    if (parState.valgte.length < 2) return;

    parState.laast = true;
    const [iA, iB] = parState.valgte;
    const flisA = parState.fliser[iA];
    const flisB = parState.fliser[iB];
    const riktig = flisA.matchId === flisB.matchId && flisA.type !== flisB.type;

    const fliser = document.querySelectorAll('.par-grid .tile');
    if (riktig) {
      flisA.matchet = true;
      flisB.matchet = true;
      parState.funnet++;
      fliser[iA].classList.add('pop');
      fliser[iB].classList.add('pop');
      settParFeedback('Riktig par!', flisA.type === 'begrep' ? flisA.tekst + ' — ' + flisB.tekst : flisB.tekst + ' — ' + flisA.tekst, 'good');
      setTimeout(() => {
        parState.valgte = [];
        parState.laast = false;
        renderPar();
        if (parState.funnet === ANTALL) {
          const stjerner = parState.bom === 0 ? '★★★' : parState.bom <= 3 ? '★★☆' : '★☆☆';
          visResultat({
            tittel: 'Alle par funnet!',
            tekst: 'Du koblet sammen alle ' + ANTALL + ' parene.',
            emoji: '🎉',
            score1Label: 'Resultat',
            score1: stjerner,
            score2Label: 'Bom',
            score2: String(parState.bom),
            nesteAction: startParmodus
          });
        }
      }, 420);
    } else {
      parState.bom++;
      el('par-bom').textContent = String(parState.bom);
      fliser[iA].classList.add('shake');
      fliser[iB].classList.add('shake');
      settParFeedback('Ikke helt', 'Det paret hørte ikke sammen – prøv igjen.', 'bad');
      setTimeout(() => {
        parState.valgte = [];
        parState.laast = false;
        renderPar();
      }, 550);
    }
  }

  /* ---------- Modus d: test (multiple choice) ---------- */
  const testState = { rekkefolge: [], indeks: 0, poeng: 0, besvart: false };

  function startTestmodus() {
    testState.rekkefolge = shuffle(SETT.kort.map((_, i) => i));
    testState.indeks = 0;
    testState.poeng = 0;
    testState.besvart = false;
    el('test-poeng').textContent = '0';
    visSkjerm('skjerm-test');
    renderTestSporsmal();
  }

  function renderTestSporsmal() {
    testState.besvart = false;
    el('test-neste').classList.add('is-hidden');
    el('test-feedback').classList.add('is-hidden');

    const kort = SETT.kort[testState.rekkefolge[testState.indeks]];
    el('test-fremdrift').textContent = 'Spørsmål ' + (testState.indeks + 1) + ' / ' + ANTALL;
    el('test-sporsmal').textContent = 'Hva er definisjonen av «' + kort.begrep + '»?';

    const feilalternativer = shuffle(
      SETT.kort.filter((k) => k.id !== kort.id).map((k) => k.definisjon)
    ).slice(0, 3);
    const alternativer = shuffle([kort.definisjon, ...feilalternativer]);

    const container = el('test-alternativer');
    container.innerHTML = '';
    alternativer.forEach((svar) => {
      const knapp = document.createElement('button');
      knapp.type = 'button';
      knapp.className = 'test-option';
      knapp.textContent = svar;
      knapp.addEventListener('click', () => svarTest(knapp, svar, kort.definisjon));
      container.appendChild(knapp);
    });
  }

  function svarTest(knapp, svar, riktigSvar) {
    if (testState.besvart) return;
    testState.besvart = true;

    const alleKnapper = el('test-alternativer').querySelectorAll('.test-option');
    alleKnapper.forEach((k) => (k.disabled = true));

    const riktig = svar === riktigSvar;
    if (riktig) {
      testState.poeng++;
      el('test-poeng').textContent = String(testState.poeng);
      knapp.classList.add('correct');
    } else {
      knapp.classList.add('wrong');
      alleKnapper.forEach((k) => {
        if (k.textContent === riktigSvar) k.classList.add('correct');
      });
    }

    const feedback = el('test-feedback');
    feedback.classList.remove('is-hidden');
    feedback.className = 'feedback ' + (riktig ? 'good' : 'bad');
    el('test-feedback-tittel').textContent = riktig ? 'Riktig!' : 'Ikke riktig';
    el('test-feedback-tekst').textContent = riktig ? 'Bra jobba.' : 'Riktig svar er markert over.';

    el('test-neste').classList.remove('is-hidden');
    el('test-neste').textContent = testState.indeks >= ANTALL - 1 ? 'Se resultat' : 'Neste spørsmål →';
  }

  function nesteTestSporsmal() {
    if (testState.indeks >= ANTALL - 1) {
      const andel = testState.poeng / ANTALL;
      const stjerner = andel === 1 ? '★★★' : andel >= 0.6 ? '★★☆' : '★☆☆';
      visResultat({
        tittel: 'Testen er ferdig!',
        tekst: 'Du svarte riktig på ' + testState.poeng + ' av ' + ANTALL + ' spørsmål.',
        emoji: andel === 1 ? '🏆' : '🎉',
        score1Label: 'Resultat',
        score1: stjerner,
        score2Label: 'Riktige',
        score2: testState.poeng + ' / ' + ANTALL,
        nesteAction: startTestmodus
      });
      return;
    }
    testState.indeks++;
    renderTestSporsmal();
  }

  /* ---------- Resultatoverlegg (delt av alle moduser) ---------- */
  let gjeldendeNesteAction = null;

  function visResultat({ tittel, tekst, emoji, score1Label, score1, score2Label, score2, nesteAction }) {
    el('panel-emoji').textContent = emoji;
    el('panel-tittel').textContent = tittel;
    el('panel-tekst').textContent = tekst;
    el('panel-score1-label').textContent = score1Label;
    el('panel-score1').textContent = score1;
    el('panel-score2-label').textContent = score2Label;
    el('panel-score2').textContent = score2;
    gjeldendeNesteAction = nesteAction;
    el('overlegg').classList.remove('is-hidden');
  }

  /* ---------- Bevegelse (reduser animasjon) ---------- */
  function prefersReduced() { return document.body.classList.contains('reduced-motion'); }
  function setMotion(reduced) {
    document.body.classList.toggle('reduced-motion', reduced);
    const knapp = el('bevknapp');
    knapp.setAttribute('aria-pressed', reduced ? 'false' : 'true');
    knapp.textContent = reduced ? '⏸️' : '🎬';
  }

  function goBack() {
    el('overlegg').classList.add('is-hidden');
    visSkjerm('skjerm-modus');
  }

  function init() {
    renderModusvalg();
    visSkjerm('skjerm-modus');
    setMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    el('bevknapp').addEventListener('click', () => setMotion(!prefersReduced()));
    el('global-back').addEventListener('click', goBack);

    el('flipCard').addEventListener('click', snuKort);
    el('flipCard').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); snuKort(); }
    });
    el('kort-neste').addEventListener('click', nesteKort);
    el('kort-forrige').addEventListener('click', forrigeKort);
    el('kort-stokk').addEventListener('click', () => startKortmodus(modusState.retning));

    el('par-stokk').addEventListener('click', startParmodus);

    el('test-neste').addEventListener('click', nesteTestSporsmal);

    el('igjen-knapp').addEventListener('click', () => { if (gjeldendeNesteAction) gjeldendeNesteAction(); });
    el('bytt-knapp').addEventListener('click', goBack);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
