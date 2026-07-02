<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Post 1: Hvem er hvem? — Akvarieløypa</title>
<link rel="stylesheet" href="loype.css">
</head>
<body>
<div id="loype-topp" class="ramme"></div>
<main class="ramme">
  <div class="kort kort--sea senter">
    <h1>🐟 Hvem er hvem?</h1>
    <p id="intro"></p>
  </div>
  <div class="kort">
    <p class="senter"><strong id="hint-tekst"></strong></p>
    <div class="mellomrom"></div>
    <div class="rutenett" id="valg"></div>
  </div>
</main>

<script src="config.js"></script>
<script src="loype-core.js"></script>
<script>
  const POST_ID = 1;
  const CFG = LOYPE_CONFIG.post1;
  const MAKS = LOYPE_CONFIG.poster.find(p => p.id === POST_ID).maks;

  if (Loype.krevLag(POST_ID) && !Loype.sjekkAlleredeTatt(POST_ID)) {
    Loype.tegnTopp(POST_ID);
    document.getElementById("intro").textContent = CFG.intro;

    const rekkefolge = Loype.stokk(CFG.par);
    const knapper = Loype.stokk(CFG.par);
    let indeks = 0, poeng = 0, laast = false, bommetHer = false;

    const valgDiv = document.getElementById("valg");
    knapper.forEach(par => {
      const b = document.createElement("button");
      b.className = "brikke";
      b.innerHTML = `<span class="emoji">${par.emoji}</span>${Loype.escapeHtml(par.navn)}`;
      b.dataset.navn = par.navn;
      b.addEventListener("click", () => svar(b));
      valgDiv.appendChild(b);
    });

    function visHint() {
      document.getElementById("hint-tekst").textContent =
        `${indeks + 1} av ${rekkefolge.length}: "${rekkefolge[indeks].hint}"`;
    }
    visHint();

    function svar(knapp) {
      if (laast || knapp.classList.contains("riktig")) return;
      const riktig = rekkefolge[indeks].navn;
      if (knapp.dataset.navn === riktig) {
        knapp.classList.add("riktig");
        // Full pott på første forsøk, halv pott etter bom
        poeng += bommetHer ? CFG.poengPerRiktig / 2 : CFG.poengPerRiktig;
        bommetHer = false;
        indeks++;
        if (indeks >= rekkefolge.length) {
          laast = true;
          setTimeout(() => Loype.fullforPost(POST_ID, poeng, MAKS), 500);
        } else {
          visHint();
        }
      } else {
        bommetHer = true;
        knapp.classList.add("feil");
        setTimeout(() => knapp.classList.remove("feil"), 350);
      }
    }
  }
</script>
</body>
</html>
