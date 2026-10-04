/* Celledetektiven — spillregler og løsningsteller.
   Ingen DOM her, så fila kan også kjøres i Node for å sjekke oppgavene:
     node games/celledetektiven/sjekk-oppgaver.js
   Rader og kolonner er 1-baserte. Rad 1 er øverst, kolonne 1 er lengst til venstre. */
(function (root) {
  'use strict';

  // Én regel = ett krav om plassering. En ledetråd kan ha flere regler.
  // pos[id] = { r, c }
  const SJEKK = {
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

  function regelOppfylt(pos, regel) {
    const f = SJEKK[regel.type];
    if (!f) throw new Error('Ukjent regeltype: ' + regel.type);
    return f(pos, regel);
  }

  function ledetradOppfylt(pos, ledetrad) {
    return ledetrad.regler.every(r => regelOppfylt(pos, r));
  }

  // Indekser til ledetrådene som ikke stemmer med en ferdig plassering.
  function brutteLedetrader(oppgave, pos) {
    const ut = [];
    oppgave.ledetrader.forEach((l, i) => { if (!ledetradOppfylt(pos, l)) ut.push(i); });
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
      if (!radRegler.every(r => regelOppfylt(pos, r))) continue;
      for (const cp of perms) {
        ids.forEach((id, i) => { pos[id].c = cp[i]; });
        if (!kolRegler.every(r => regelOppfylt(pos, r))) continue;
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

  const api = { regelOppfylt, ledetradOppfylt, brutteLedetrader, finnLosninger, valider };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Motor = api;
})(this);
