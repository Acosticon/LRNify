/* LRNify Utstillingsløype — delt stilark */
@import url('https://fonts.googleapis.com/css2?family=Chewy&family=Nunito:wght@400;700;800&display=swap');

:root {
  --cream: #fff9f0;
  --ink: #2b2118;
  --yellow: #facc15;
  --sea: #7dd3fc;
  --sea-deep: #0369a1;
  --green: #4ade80;
  --red: #f87171;
  --border: 3px solid var(--ink);
  --shadow: 4px 4px 0 var(--ink);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Nunito', sans-serif;
  background: var(--cream);
  color: var(--ink);
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  font-size: 18px;
  line-height: 1.45;
}

.ramme { width: 100%; max-width: 560px; }

h1, h2, .display { font-family: 'Chewy', cursive; font-weight: 400; letter-spacing: 0.5px; }
h1 { font-size: 2rem; }
h2 { font-size: 1.4rem; }

/* Bølgetopp — løypas signatur */
.bolge {
  width: 100%; max-width: 560px; height: 26px;
  background:
    radial-gradient(circle at 12px -6px, transparent 14px, var(--sea) 15px, var(--sea) 17px, transparent 18px);
  background-size: 34px 26px;
  margin-bottom: 4px;
}

.kort {
  background: #fff;
  border: var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  padding: 20px;
  margin-bottom: 16px;
}

.kort--sea { background: #e6f6ff; }

/* Fremdrift: en fisk per post */
.fremdrift {
  display: flex; gap: 8px; justify-content: center;
  margin: 10px 0 16px;
}
.fremdrift .fisk {
  width: 46px; height: 46px;
  border: var(--border); border-radius: 50%;
  background: #fff;
  display: grid; place-items: center;
  font-size: 22px;
  filter: grayscale(1) opacity(0.45);
}
.fremdrift .fisk.tatt {
  background: var(--yellow);
  filter: none;
  box-shadow: 2px 2px 0 var(--ink);
}
.fremdrift .fisk.her { outline: 3px dashed var(--sea-deep); outline-offset: 3px; filter: none; }

.lagnavn-vis {
  text-align: center; font-weight: 800;
  font-size: 0.95rem; opacity: 0.8; margin-bottom: 4px;
}

/* Knapper — store tap-flater for barnehender */
.knapp {
  display: block; width: 100%;
  font-family: 'Nunito', sans-serif;
  font-size: 1.15rem; font-weight: 800;
  padding: 16px 20px;
  min-height: 56px;
  background: var(--yellow);
  border: var(--border); border-radius: 14px;
  box-shadow: var(--shadow);
  cursor: pointer;
  color: var(--ink);
  text-align: center;
  text-decoration: none;
  transition: transform 0.08s ease, box-shadow 0.08s ease;
  -webkit-tap-highlight-color: transparent;
}
.knapp:active { transform: translate(3px, 3px); box-shadow: 1px 1px 0 var(--ink); }
.knapp--sek { background: #fff; }
.knapp--valg { background: #e6f6ff; margin-bottom: 12px; text-align: left; }
.knapp:disabled { opacity: 0.5; cursor: default; }
.knapp.riktig { background: var(--green); }
.knapp.feil { background: var(--red); }
.knapp.valgt { background: var(--sea); }

.knapp:focus-visible, input:focus-visible {
  outline: 4px solid var(--sea-deep);
  outline-offset: 2px;
}

input[type="text"], input[type="number"] {
  width: 100%;
  font-family: 'Nunito', sans-serif;
  font-size: 1.2rem; font-weight: 700;
  padding: 14px 16px;
  border: var(--border); border-radius: 14px;
  background: #fff;
  margin: 10px 0 16px;
}

/* Rutenett for kort-baserte oppgaver */
.rutenett { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.brikke {
  border: var(--border); border-radius: 14px;
  background: #fff; box-shadow: var(--shadow);
  padding: 14px 10px; min-height: 72px;
  font-weight: 800; font-size: 1.05rem;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; cursor: pointer; text-align: center;
  transition: transform 0.08s ease;
  -webkit-tap-highlight-color: transparent;
}
.brikke:active { transform: scale(0.96); }
.brikke.valgt { background: var(--sea); }
.brikke.riktig { background: var(--green); pointer-events: none; }
.brikke.feil { animation: rist 0.3s; }
.brikke .emoji { font-size: 2rem; }

@keyframes rist {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

/* Sorteringsbokser */
.bokser { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
.boks {
  border: var(--border); border-radius: 14px;
  background: #fdf3d7; box-shadow: var(--shadow);
  padding: 12px; min-height: 90px;
  font-weight: 800; text-align: center; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.boks .innhold { font-size: 1.5rem; margin-top: 6px; min-height: 1.8rem; }

/* Resultat-overlegg */
.overlegg {
  position: fixed; inset: 0;
  background: rgba(43, 33, 24, 0.55);
  display: grid; place-items: center;
  padding: 16px; z-index: 50;
}
.overlegg .kort { max-width: 420px; width: 100%; text-align: center; animation: sprett 0.35s ease; margin: 0; }
.poeng-stor { font-family: 'Chewy', cursive; font-size: 3rem; color: var(--sea-deep); }

@keyframes sprett {
  0% { transform: scale(0.7); opacity: 0; }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

/* Toppliste */
.toppliste { list-style: none; }
.toppliste li {
  display: flex; align-items: center; gap: 12px;
  border: var(--border); border-radius: 12px;
  background: #fff; padding: 10px 14px; margin-bottom: 10px;
  font-weight: 800;
}
.toppliste .plass { font-family: 'Chewy', cursive; font-size: 1.4rem; width: 34px; }
.toppliste .lag { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.toppliste li:nth-child(1) { background: var(--yellow); }
.toppliste li:nth-child(2) { background: #eee; }
.toppliste li:nth-child(3) { background: #fcd9b6; }
.toppliste .meg { outline: 3px dashed var(--sea-deep); outline-offset: 2px; }

.senter { text-align: center; }
.mellomrom { height: 12px; }
.liten { font-size: 0.9rem; opacity: 0.75; }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
