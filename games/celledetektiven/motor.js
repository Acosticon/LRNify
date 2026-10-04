/* Celledetektiven — spillregler og løsningsteller.
   Ingen DOM her, så fila kan også kjøres i Node for å sjekke oppgavene:
     node games/celledetektiven/sjekk-oppgaver.js
   Rader og kolonner er 1-baserte. Rad 1 er øverst, kolonne 1 er lengst til venstre.
   Et brett kan ha et kart (én streng per rad): en bokstav per rute sier hvilket
   rom ruten hører til, og '#' er en stengt rute der ingenting kan stå. */
(function (root) {
  'use strict';

  const STENGT = '#';

  function romFor(oppgave, r, c) {
    return oppgave.kart ? oppgave.kart[r - 1][c - 1] : null;
  }

  function erStengt(oppgave, r, c) {
    return romFor(oppgave, r, c) === STENGT;
  }

  // Én regel = ett krav om plassering. En ledetråd kan ha flere regler.
  // pos[id] = { r, c }, o = oppgaven (trengs for rom)
  const SJEKK = {
    rom:            (p, x, o) => romFor(o, p[x.a].r, p[x.a].c) === x.rom,
    rad:            (p, x) => p[x.a].r === x.n,
    kolonne:        (p, x) => p[x.a].c === x.n,
    over:           (p, x) => p[x.a].r < p[x.b].r,
    under:          (p, x) => p[x.a].r > p[x.b].r,
    venstre:        (p, x) => p[x.a].c < p[x.b].c,
    hoyre:          (p, x) => p[x.a].c > p[x.b].c,
    radRettOver:    (p, x) => p[x.a].r === p[x.b].r - 1,
    radRettUnder:   (p, x) => p[x.a].r === p[x.b].r + 1,
    kolRettVenstre: (p, x) => p[x.a].c === p[x.b].c - 1,
    kolRettHoyre:   (p, x) => p[x.a].c === p[x.b].c + 1,
  };

  function regelOppfylt(pos, regel, oppgave) {
    const f = SJEKK[regel.type];
    if (!f) throw new Error('Ukjent regeltype: ' + regel.type);
    return f(pos, regel, oppgave);
  }

  function ledetradOppfylt(pos, ledetrad, oppgave) {
    return ledetrad.regler.every(r => regelOppfylt(pos, r, oppgave));
  }

  // Indekser til ledetrådene som ikke stemmer med en ferdig plassering.
  function brutteLedetrader(oppgave, pos) {
    const ut = [];
    oppgave.ledetrader.forEach((l, i) => { if (!ledetradOppfylt(pos, l, oppgave)) ut.push(i); });
    return ut;
  }

  function permutasjoner(n) {
    const ut = [];
    const a = Array.from({ length: n }, (_, i) => i + 1);
    (function rek(k) {
      if (k === n) { ut.push(a.slice()); return; }
      for (let i = k; i < n; i++) {
        [a[k], a[i]] = [a[i], a[k]];
        rek(k + 1);
        [a[k], a[i]] = [a[i], a[k]];
      }
    })(0);
    return ut;
  }

  // Teller alle plasseringer (én brikke per rad og kolonne) som passer med
  // alle ledetrådene. Stopper ved "grense" for å spare tid. Brute force er
  // greit: 6! × 6! = 518 400 kombinasjoner.
  function finnLosninger(oppgave, grense) {
    grense = grense || Infinity;
    const ids = oppgave.brikker;
    const n = oppgave.storrelse;
    const regler = oppgave.ledetrader.flatMap(l => l.regler);
    // Regler som bare angår rader kan sjekkes før kolonnene velges.
    const RAD = new Set(['rad', 'over', 'under', 'radRettOver', 'radRettUnder']);
    const radRegler = regler.filter(r => RAD.has(r.type));
    const kolRegler = regler.filter(r => !RAD.has(r.type));
    const perms = permutasjoner(n);
    const losninger = [];
    const pos = {};
    ids.forEach(id => { pos[id] = { r: 0, c: 0 }; });
    for (const rp of perms) {
      ids.forEach((id, i) => { pos[id].r = rp[i]; });
      if (!radRegler.every(r => regelOppfylt(pos, r, oppgave))) continue;
      for (const cp of perms) {
        ids.forEach((id, i) => { pos[id].c = cp[i]; });
        if (ids.some(id => erStengt(oppgave, pos[id].r, pos[id].c))) continue;
        if (!kolRegler.every(r => regelOppfylt(pos, r, oppgave))) continue;
        const kopi = {};
        ids.forEach(id => { kopi[id] = { r: pos[id].r, c: pos[id].c }; });
        losninger.push(kopi);
        if (losninger.length >= grense) return losninger;
      }
    }
    return losninger;
  }

  // 'ingen' | 'unik' | 'flere'
  function valider(oppgave) {
    const antall = finnLosninger(oppgave, 2).length;
    return antall === 0 ? 'ingen' : antall === 1 ? 'unik' : 'flere';
  }

  // Løser oppgaven slik en elev kan gjøre det, uten gjetting: stryk ruter
  // ledetrådene utelukker, plasser en brikke når den bare har én mulig rute,
  // og bruk at hver rad og kolonne må ha nøyaktig én brikke.
  // Returnerer { lost, runder } – runder er et grovt mål på hvor lang
  // resonnementskjeden er. lost = false betyr at oppgaven krever gjetting
  // eller lengre resonnementer enn dette.
  function losTrinnvis(oppgave) {
    const n = oppgave.storrelse, ids = oppgave.brikker;
    const kand = {};
    ids.forEach(id => {
      kand[id] = [];
      for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++)
        if (!erStengt(oppgave, r, c)) kand[id].push({ r, c });
    });
    const regler = oppgave.ledetrader.flatMap(l => l.regler);
    const enkel = regler.filter(x => !x.b);
    const par = regler.filter(x => x.b);
    const filtrer = (id, f) => {
      const for_ = kand[id].length;
      kand[id] = kand[id].filter(f);
      return kand[id].length !== for_;
    };
    enkel.forEach(x => filtrer(x.a, p => regelOppfylt({ [x.a]: p }, x, oppgave)));
    let runder = 0, endret = true;
    while (endret) {
      endret = false;
      runder++;
      for (const x of par) {
        const ok = (pa, pb) => pa.r !== pb.r && pa.c !== pb.c && regelOppfylt({ [x.a]: pa, [x.b]: pb }, x, oppgave);
        if (filtrer(x.a, pa => kand[x.b].some(pb => ok(pa, pb)))) endret = true;
        if (filtrer(x.b, pb => kand[x.a].some(pa => ok(pa, pb)))) endret = true;
      }
      for (const id of ids) {
        if (kand[id].length !== 1) continue;
        const { r, c } = kand[id][0];
        for (const andre of ids) if (andre !== id && filtrer(andre, p => p.r !== r && p.c !== c)) endret = true;
      }
      for (const akse of ['r', 'c']) for (let v = 1; v <= n; v++) {
        const hvem = ids.filter(id => kand[id].some(p => p[akse] === v));
        if (hvem.length === 1 && filtrer(hvem[0], p => p[akse] === v)) endret = true;
      }
      if (ids.some(id => kand[id].length === 0)) return { lost: false, runder };
    }
    return { lost: ids.every(id => kand[id].length === 1), runder };
  }

  const api = { losTrinnvis, romFor, erStengt, regelOppfylt, ledetradOppfylt, brutteLedetrader, finnLosninger, valider };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Motor = api;
})(this);
