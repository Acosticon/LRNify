# Oppdrag: Gjør lrnify.no lesbar for språkmodeller (LLM/GEO)

> **Til Claude Code:** Les hele filen før du starter. Jobb i rekkefølgen under, ett steg per commit. Stopp og spør Stig der det står **STIG AVGJØR**.
>
> Ingen visuelle endringer for brukere. Ingen nye avhengigheter i spillene. Deploy er fortsatt rene statiske filer på GitHub Pages.

*(Overført fra PDF. Noen kodelinjer var avkuttet i PDF-en og er markert med «…».)*

---

## 0. Bakgrunn (status 24.10.2026)

Revisjon av live-siden:

| Område | Status |
|---|---|
| robots.txt | Åpen for alle crawlere, peker til sitemap |
| Forside: tittel, meta, canonical, OG, nb_NO | OK |
| Forside: om/LK20/skoler/kontakt-tekst i rå HTML | OK |
| Forside: spillkatalogen | Kun JS. Rå HTML viser filterknapper, men ingen spill |
| Forside: «Fra bloggen» | Kun JS. Tom i rå HTML |
| /blog/ | Innleggene ligger i rå HTML |
| Spillsider (stikkprøve: Kartografen) | God meta, OG-bilde, canonical. Ingen tekst om fag, trinn, LK20 eller bruk i timen |
| /llms.txt | 404 |
| JSON-LD / schema.org | Ikke funnet (bekreft med grep i repoet) |

**Hovedproblemet:** De fleste LLM-crawlere (GPTBot, ClaudeBot, PerplexityBot) kjører ikke JavaScript. De vet derfor ikke hvilke spill LRNify har.

**Målet:** En lærer som spør en KI-assistent om for eksempel «gratis kartquiz for ungdomsskolen» eller «spill om brøk 6. trinn» skal kunne få LRNify-spillet som svar, med riktig lenke.

---

## 1. Kartlegg (ingen endringer)

1. Finn hvor forsidens spillkatalog defineres (JS-array i `index.html`, egen `.js`/`.json`, e.l.) og hvordan kortene rendres og filtreres (Læringsspill / Klasseromsressurser / Aktiviteter / Lek / beta).
2. Finn hvor «Fra bloggen» henter innleggene sine.
3. Sjekk om noen sider har `application/ld+json`.
4. List opp alle spill, verktøy og aktiviteter med URL, `<title>` og `meta description`. Kryssjekk mot `sitemap.xml`.
5. Skriv funnene kort i `STATUS.md` før du går videre.

---

## 2. Én kilde for katalogdata: `data/katalog.json`

Hvis katalogen allerede ligger som data, gjenbruk og utvid den. Ellers flytt den ut til `data/katalog.json`. Forsidens JS skal lese samme kilde, så det finnes bare én sannhet.

Felter per element:

```json
{
  "id": "kartografen",
  "navn": "Kartografen",
  "url": "https://lrnify.no/games/geografi/kartografen/",
  "kategori": "laeringsspill",
  "beta": false,
  "kort": "Klikk på riktig fylke eller land på kartet – Norge og alle verdensdeler, med hoved…",
  "fag": ["Samfunnsfag"],
  "trinn": ["5-7", "8-10"],
  "kompetansemaal": [],
  "brukITimen": "",
  "varighetMin": [5, 20],
  "bilde": "https://lrnify.no/media/cards/kartografen.png",
  "lagtTil": "2026-01-01",
  "verifisert": false
}
```

- Utled `kort` fra eksisterende meta description, men kort ned til én setning.
- `kategori` er én av: `laeringsspill`, `klasseromsressurs`, `aktivitet`, `lek`, `laerermateriell`.
- `fag`, `trinn`, `kompetansemaal`, `brukITimen`: Lag et forslag basert på spillets innhold. Sett `"verifisert": false`. **STIG AVGJØR** før publisering (se steg 8).
- **Kompetansemål:** Bruk kun ordrett formulering fra Udirs LK20 (udir.no/lk20), med kode der den finnes (f.eks. `SAF01-04`). Aldri dikt opp eller omformuler. Er du usikker, la feltet stå tomt. Innholdsvalidator eier dette feltet.

---

## 3. Byggeskript: `scripts/bygg-statisk.mjs`

Lag et Node-skript uten avhengigheter som kjøres manuelt (`node scripts/bygg-statisk.mjs`). Resultatet committes. GitHub Pages trenger dermed fortsatt ikke noe byggesteg.

Skriptet gjør dette:

1. **Forsidekatalog:** Skriv statisk HTML for alle kort mellom markørene `<!-- KATALOG:START -->` og `<!-- KATALOG:SLUTT -->` i `index.html`.
   - Hvert kort er en vanlig `<a href>` med navn og kort, og med `data-kategori`/`data-beta` for filteret.
   - Bruk samme markup og CSS-klasser som dagens JS-genererte kort, så forsiden ser identisk ut.
2. **Bloggutdrag:** Skriv de 3 nyeste innleggene, hentet fra `/blog/*/index.html` (tittel, dato, ingress), mellom `<!-- BLOGG:START -->` og `<!-- BLOGG:SLUTT -->`.
3. **`/llms.txt`:** Generer fra katalogen (format i steg 5).
4. **JSON-LD:** Oppdater blokken mellom `<!-- JSONLD:START -->` og `<!-- JSONLD:SLUTT -->` på forsiden og på hver spillside (steg 6).
5. **«Om spillet»-seksjon:** Oppdater blokken mellom `<!-- OM:START -->` og `<!-- OM:SLUTT -->` på hver spillside (steg 4).
6. **`sitemap.xml`:** Regenerer fra katalogen og bloggmappen. Ta med `lastmod`.
7. **`--sjekk`-modus:** Skriptet skal feile med exit-kode 1 hvis noe generert innhold avviker fra katalogen. Legg dette inn som GitHub Action-sjekk på PR. Det er en sjekk, ikke et byggesteg.

**Progressiv forbedring:** Forsidens JS skal ikke lenger tømme og bygge katalogen på nytt. Den skal bare filtrere de eksisterende kortene (vis/skjul basert på `data-kategori`/`data-beta`). Uten JS skal alle kort være synlige og klikkbare.

---

## 4. «Om spillet» på hver spillside

Legg inn en kort, alltid tilgjengelig tekstblokk i rå HTML på hver spill-, verktøy- og aktivitetsside. Den skal ikke forstyrre spillet. Bruk et lukket `<details>` nederst eller bak ⓘ-knappen hvis siden har det, men innholdet må ligge i DOM-en ved lasting, ikke injiseres med JS.

```html
<!-- OM:START -->
<details class="om-spillet">
  <summary>Om spillet</summary>
  <h2>Om Kartografen</h2>
  <p>Kartografen er et gratis læringsspill der elevene klikker på riktig fylke eller land på …</p>
  <ul>
    <li><strong>Fag:</strong> Samfunnsfag</li>
    <li><strong>Trinn:</strong> 5.–10. trinn</li>
    <li><strong>Tid:</strong> 5–20 minutter</li>
    <li><strong>Krever:</strong> Nettleser. Ingen pålogging eller installasjon.</li>
  </ul>
  <h3>Slik bruker du det i timen</h3>
  <p>…</p>
  <h3>Kompetansemål (LK20)</h3>
  <ul><li>…</li></ul>
  <p><a href="https://lrnify.no/">Flere gratis læringsspill fra LRNify</a></p>
</details>
<!-- OM:SLUTT -->
```

- Bruk LRNify-designsystemet (Nunito, krem `#fff9f0`, tykke svarte rammer). Designsjekker godkjenner.
- Språkvasker går gjennom alle tekstene. Bruk direkte og personlig lærertone på bokmål, og unngå markedsføringsfloskler.
- Seksjoner uten verifiserte data (f.eks. kompetansemål) utelates helt. Ikke vis tomme overskrifter.

---

## 5. `/llms.txt`

Følg formatet fra llmstxt.org. Filen genereres fra katalogen, og bare verifiserte elementer tas med.

```markdown
# LRNify

> Gratis, nettleserbaserte læringsspill og klasseromsverktøy for norsk skole (bokmål), laget …

LRNify passer for barneskole og ungdomsskole og dekker blant annet geografi, samfunnsfag, eng…

## Læringsspill
- [Kartografen](https://lrnify.no/games/geografi/kartografen/): Klikk på riktig fylke eller l…
- …

## Klasseromsressurser
- [Klassekart](https://lrnify.no/tools/klassekart/): …

## Aktiviteter
- …

## Bloggen
- [Bloggen](https://lrnify.no/blog/): Praktiske tips og ressurser for lærere.
- [Tittel](url): én setning.

## Om
- [Personvern](https://lrnify.no/personvern/)
- Kontakt: kontakt@lrnify.no
```

- Server filen som `text/plain`. På GitHub Pages holder det å legge `llms.txt` i rotmappen.
- Ta ikke med beta-versjoner eller sider som er sperret i robots.txt (f.eks. `/eliquiz/`).

---

## 6. Strukturerte data (JSON-LD)

**Forsiden:** `Organization`, `WebSite` og `ItemList` over katalogen.

```html
<!-- JSONLD:START -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://lrnify.no/#org",
      "name": "LRNify",
      "url": "https://lrnify.no/",
      "email": "kontakt@lrnify.no",
      "sameAs": ["https://www.instagram.com/lrnify.no/"]
    },
    {
      "@type": "WebSite",
      "@id": "https://lrnify.no/#site",
      "name": "LRNify",
      "url": "https://lrnify.no/",
      "inLanguage": "nb-NO",
      "publisher": { "@id": "https://lrnify.no/#org" }
    },
    {
      "@type": "ItemList",
      "name": "Læringsspill og klasseromsverktøy fra LRNify",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "url": "https://lrnify.no/games/geografi/kartog…" }
      ]
    }
  ]
}
</script>
<!-- JSONLD:SLUTT -->
```

**Spillsider:** `LearningResource`.

```json
{
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "Kartografen",
  "url": "https://lrnify.no/games/geografi/kartografen/",
  "description": "…",
  "image": "https://lrnify.no/media/cards/kartografen.png",
  "inLanguage": "nb-NO",
  "isAccessibleForFree": true,
  "learningResourceType": "Læringsspill",
  "educationalLevel": ["5.–7. trinn", "8.–10. trinn"],
  "about": ["Samfunnsfag", "Geografi"],
  "audience": { "@type": "EducationalAudience", "educationalRole": ["teacher", "student"] },
  "timeRequired": "PT5M/PT20M",
  "publisher": { "@id": "https://lrnify.no/#org" }
}
```

- Hvis et spill har verifiserte kompetansemål, legg dem til med `educationalAlignment` (`AlignmentObject`, `alignmentType: "teaches"`, `educationalFramework: "LK20"`, `targetName`, `targetUrl` mot udir.no).
- Klasseromsverktøy får `"@type": ["LearningResource", "WebApplication"]` med `applicationCategory: "EducationalApplication"`.
- Blogginnlegg: `BlogPosting` med `headline`, `datePublished`, `dateModified`, `author` og `publisher`. **STIG AVGJØR** hvilket forfatternavn som skal brukes.
- Valider alt med validator.schema.org og Googles Rich Results Test.

---

## 7. Mindre opprydding

- **Canonical:** Spillsidene har canonical med `…/index.html`. **STIG AVGJØR:** Skal canonical og sitemap bytte til mappe-URL (`…/kartografen/`)? Det er renere og mer stabilt. GitHub Pages serverer begge, så ingen lenker brekker. Anbefaling: ja, og gjør det samtidig overalt (canonical, og:url, sitemap, llms.txt, JSON-LD).
- **Beta-duplikater:** `typisk` og `typisk-beta` ligger begge i sitemap. Foreslå enten `<meta name="robots" content="noindex">` på beta, eller canonical fra beta til hovedversjonen. **STIG AVGJØR.**
- **`<html lang="nb">`:** Sjekk at alle sider har det.
- **Bilder:** Sjekk at alle kort har `og:image`, og at `<img>` har beskrivende `alt`.

---

## 8. Godkjenning fra Stig

Før publisering: Lag `data/katalog-til-godkjenning.md` med én tabell per kategori, med kolonnene navn, kort, fag, trinn, kompetansemål og bruk i timen.

Stig retter direkte i tabellen. Etterpå overføres rettelsene til `katalog.json`, og godkjente elementer får `"verifisert": true`. Elementer som ikke er verifisert, får likevel statisk kort på forsiden (navn, kort og lenke), men ingen fag-, trinn- eller kompetansemålpåstander noe sted.

---

## 9. Ansvarsfordeling i pipelinen

| Agent | Ansvar |
|---|---|
| spillutvikler | Steg 2–4 og 6–7: skript, markører, JS-filter |
| pedagog | Forslag til fag, trinn og bruk i timen |
| innholdsvalidator | Kompetansemål: kun ordrett fra Udir. Sjekker at ingen påstander er usanne |
| språkvasker | Alle «Om spillet»-tekster, llms.txt og ItemList-navn |
| designsjekker | «Om spillet»-blokken og at forsiden er visuelt uendret |
| regresjonsagent | Alle spill og verktøy fungerer som før. Forsidefilteret virker |
| firebase-vokter | Bekreft at ingenting rører Firebase/`poll-c6bd2` |
| publisist | PR-beskrivelse og eventuelt et blogginnlegg om «LRNify-katalogen» |

---

## 10. Akseptansekriterier

Kjør mot produksjon etter deploy:

```bash
# Spillkatalogen finnes i rå HTML (uten JS)
curl -s https://lrnify.no/ | grep -o 'href="[^"]*/\(games\|tools\|aktiviteter\)/[^"]*"' | sor…
# → minst like mange som publiserte elementer i katalog.json

# Bloggutdrag i rå HTML
curl -s https://lrnify.no/ | grep -c '/blog/[a-z]'                        # → ≥ 3

# llms.txt finnes og er tekst
curl -sI https://lrnify.no/llms.txt | grep -i 'content-type: text/plain'

# JSON-LD på forside og en spillside
curl -s https://lrnify.no/ | grep -c 'application/ld+json'                # → ≥ 1
curl -s https://lrnify.no/games/geografi/kartografen/ | grep -c 'application/ld+json'

# «Om spillet» i rå HTML
curl -s https://lrnify.no/games/geografi/kartografen/ | grep -c 'class="om-spillet"'

# Sjekkmodus grønn
node scripts/bygg-statisk.mjs --sjekk
```

- [ ] validator.schema.org: 0 feil på forside, én spillside, ett verktøy og ett blogginnlegg
- [ ] Forsiden er visuelt identisk med JS på. Uten JS (DevTools → Disable JavaScript) vises alle kort og er klikkbare
- [ ] Filteret og «Vis beta» fungerer som før
- [ ] Regresjonsagent: alle spill i sitemap laster uten konsollfeil
- [ ] Ingen påstand om fag, trinn eller kompetansemål for elementer med `verifisert: false`

---

## 11. Vedlikehold (legg inn i rutinene)

- **Nytt spill:** Legg det inn i `katalog.json`, kjør `node scripts/bygg-statisk.mjs` og commit. PR-sjekken fanger glemte kjøringer.
- **Nytt blogginnlegg:** Kjør skriptet, så oppdateres forsideutdrag, sitemap og llms.txt.
- Legg til en linje om dette i `/avslutt`-sjekklisten.
