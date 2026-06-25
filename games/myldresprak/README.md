# Myldrespill

Myldrebilde-basert vokabularspill for fremmedspråk (spansk, tysk, fransk).

## Filstruktur

```
myldrespill/
├── index.html          ← spillmotor (HTML + aria-struktur)
├── game.js             ← spillogikk
├── style.css           ← design
└── themes/
    └── es-ciudad/
        ├── config.json ← innhold: ord, spørsmål, hotspots
        └── scene.svg   ← myldrebildet
```

## Legg til et nytt tema

1. Lag en ny mappe: `themes/de-schule/`
2. Kopier og rediger `config.json` med nye ord og spørsmål
3. Legg inn et bilde som `scene.svg` (eller `scene.png` – oppdater `"scene"` i config)
4. I `index.html`, endre:
   ```js
   window.MYLDRESPILL_THEME = 'themes/de-schule';
   ```
   (Eller lag en kopi av index.html per tema.)

## config.json – feltforklaring

```json
{
  "theme": "Visningsnavn",
  "language": "es",          ← ISO-kode (es, de, fr)
  "scene": "scene.svg",      ← bildefil i samme mappe
  "items": [
    {
      "id": "mercado",                ← unik ID (brukes til hotspot)
      "label_es": "el mercado",       ← ordets fullform på målspråket
      "hotspot": { "x": 178, "y": 310 },  ← koordinat i SVG-viewBox (720×460)
      "questions": {
        "easy": "Hva heter markedet på spansk?",
        "hard": "¿Cómo se dice 'markedet' en español?"
      },
      "correct": "el mercado",
      "distractors": ["la escuela", "el hospital", "la biblioteca"]
    }
  ]
}
```

> **Hotspot-koordinater:** Mål x/y i SVG-koordinatsystemet (viewBox 0 0 720 460).
> Til fremtidig klikkbar versjon: koordinatene er allerede lagret – ingen config-endring nødvendig.

## Tilgjengelighet

- Tastatursnarveier: tast **1–4** for å velge svar
- Alle knapper har synlig fokus-indikator
- `aria-live` på spørsmål, fremdrift og tilbakemelding
- `prefers-reduced-motion` respekteres
- Ingen tidsbegrensning
- Minimum touch-target 52px høyde

## Lokal kjøring

Åpne med en lokal server (f.eks. VS Code Live Server) – nødvendig pga. `fetch()`.
Fungerer ikke via `file://` direkte.

## Publisering

Legg hele mappen på lrnify.no eller GitHub Pages. Ingen build-steg nødvendig.
