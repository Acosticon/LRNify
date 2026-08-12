# Delingsbilder (og:image)

Bilder i denne mappa brukes **kun** som forhåndsvisningsbilde når en side
deles i Teams, Slack, e-post eller lignende — de vises aldri i spillrutenettet
på forsiden. Det gjør et spill kan få et og:image her uten at noen redigerer
den kuraterte kortkunsten i `media/cards/`, `media/tools/` eller
`media/aktiviteter/`.

**Rekkefølge et spill henter bildet sitt fra, i praksis:** hvis spillet
allerede har kortkunst i `media/cards/{mappe}.png` (eller `media/tools/`,
`media/aktiviteter/` for verktøy/aktiviteter), bruk den samme fila til
og:image — den er allerede laget for å representere spillet. Bare spill uten
kortkunst enda får et bilde her, som et skjermdump av startskjermen i stedet.

## Standarden: OG-tagger på enhver ny side

Alle sider som er ment å deles — alt som ligger i `GAMES`, `TEACHER_RESOURCES`,
`ACTIVITIES` og `LEK` i `index.html` — skal ha denne blokken i `<head>`, rett
etter `<title>`:

```html
<meta name="description" content="{étt–to setninger, konkret om hva siden faktisk gjør}">
<link rel="canonical" href="https://lrnify.no/{sti}/index.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="LRNify">
<meta property="og:title" content="{Tittel fra spillkortet på forsiden} – LRNify">
<meta property="og:description" content="{samme tekst som description}">
<meta property="og:image" content="https://lrnify.no/{sti til kortkunst eller media/og/-bilde}">
<meta property="og:url" content="https://lrnify.no/{sti}/index.html">
<meta property="og:locale" content="nb_NO">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{samme som og:title}">
<meta name="twitter:description" content="{samme som description}">
<meta name="twitter:image" content="{samme som og:image}">
```

Noen faste valg, så nye sider ikke må finne opp mønsteret på nytt:

* **og:title bruker kort-tittelen, ikke spillets interne navn.** Et spill kan
  hete «Brøkeborgen — Royal Chaos Edition» i sin egen `<title>`, men heter
  «Brøkstigen» på forsiden der læreren fant det. og:title følger forsiden,
  så delingen kjennes igjen.
* **Beskrivelsen skal være konkret**, ikke markedsføringsspråk. «Klikk på
  riktig europeisk land på kartet, inkludert de minste ministatene» —
  ikke «et morsomt og lærerikt geografispill!». Beskriv mekanikken, ikke
  følelsen — den som deler vet allerede om den vil like det.
* **twitter:card er `summary`, ikke `summary_large_image`.** Kortkunsten i
  `media/cards/` er kvadratisk (1:1), og `summary_large_image` forventer et
  bredformat (1.91:1) — med `summary` beskjæres ikke bildet stygt. Lages det
  et bredformatbilde spesifikt til deling for et spill senere, kan den
  siden bytte til `summary_large_image`.
* **Absolutte URL-er overalt**, aldri relative — Teams, Slack og de fleste
  andre lesere som bygger forhåndsvisninger følger ikke relative stier.

## Nye skjermdumpsbilder

Bildene som ligger her nå (`beinjakten.png`, `klimakoden.png`, osv.) er
genererte skjermdump av spillets startskjerm, tatt med Chromium/Playwright —
ikke illustrert kortkunst. De duger som delingsbilde, men er ikke i samme
visuelle stil som `media/cards/`. Får et spill ordentlig kortkunst senere
(samme prosess som resten av `media/cards/`), bytt og:image til å peke dit i
stedet, og denne fila kan fjernes.
