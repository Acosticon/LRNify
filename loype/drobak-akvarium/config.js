<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Post 3: Sorter dyrene — Akvarieløypa</title>
<link rel="stylesheet" href="loype.css">
</head>
<body>
<div id="loype-topp" class="ramme"></div>
<main class="ramme">
  <div class="kort kort--sea senter">
    <h1>🦞 Sorter dyrene</h1>
    <p id="intro"></p>
  </div>
  <div class="kort">
    <p class="senter liten">Trykk på et dyr — og så på riktig boks!</p>
    <div class="rutenett" id="dyr"></div>
    <div class="bokser" id="bokser"></div>
  </div>
</main>

<script src="config.js"></script>
<script src="loype-core.js"></script>
<script>
  const POST_ID = 3;
  const CFG = LOYPE_CONFIG.post3;
  const MAKS = LOYPE_CONFIG.poster.find(p => p.id === POST_ID).maks;

  if (Loype.krevLag(POST_ID) && !Loype.sjekkAlleredeTatt(POST_ID)) {
    Loype.tegnTopp(POST_ID);
    document.getElementById("intro").textContent = CFG.intro;

    let valgt = null, poeng = 0, igjen = CFG.elementer.length;

    const dyrDiv = document.getElementById("dyr");
    Loype.stokk(CFG.elementer).forEach(el => {
      const b = document.createElement("button");
      b.className = "brikke";
      b.innerHTML = `<span class="emoji">${el.emoji}</span>${Loype.escapeHtml(el.navn)}`;
      b.dataset.kategori = el.kategori;
      b.dataset.emoji = el.emoji;
      b.addEventListener("click", () => velg(b));
      dyrDiv.appendChild(b);
    });

    const boksDiv = document.getElementById("bokser");
    CFG.kategorier.forEach((navn, i) => {
      const boks = document.createElement("button");
      boks.className = "boks";
      boks.innerHTML = `${Loype.escapeHtml(navn)}<div class="innhold" data-boks="${i}"></div>`;
      boks.addEventListener("click", () => slippI(i, boks));
      boksDiv.appendChild(boks);
    });

    function velg(brikke) {
      if (brikke.classList.contains("riktig")) return;
      document.querySelectorAll(".brikke.valgt").forEach(b => b.classList.remove("valgt"));
      valgt = brikke;
      brikke.classList.add("valgt");
    }

    function slippI(kategori, boks) {
      if (!valgt) return;
      if (Number(valgt.dataset.kategori) === kategori) {
        valgt.classList.remove("valgt");
        valgt.classList.add("riktig");
        boks.querySelector(".innhold").textContent += valgt.dataset.emoji;
        // Halv pott hvis dyret først ble satt i feil boks
        poeng += valgt.dataset.bommet ? CFG.poengPerRiktig / 2 : CFG.poengPerRiktig;
        valgt = null;
        igjen--;
        if (igjen === 0) {
          setTimeout(() => Loype.fullforPost(POST_ID, poeng, MAKS), 500);
        }
      } else {
        // Feil boks: rist brikken, la barnet prøve igjen (halv pott neste gang)
        valgt.dataset.bommet = "1";
        valgt.classList.add("feil");
        const v = valgt;
        setTimeout(() => v.classList.remove("feil"), 350);
      }
    }
  }
</script>
</body>
</html>
