# mads/ – arbeidsområde for Mads

Denne mappen publiseres på **https://lrnify.no/mads/**.

## Viktigste regel

Alt arbeid skjer **inne i `mads/`-mappen**. Ikke opprett, endre eller slett filer
utenfor denne mappen – det gjelder blant annet `index.html` i rota, `games/`,
`spill/`, `aktiviteter/`, `tools/`, `vm/`, `jens/`, `sitemap.xml`, `CNAME` og
`.github/`. Hvis en oppgave ser ut til å kreve endringer utenfor `mads/`,
stopp og spør Mads først.

## Slik er siden bygget

- Ren statisk HTML. Ingen byggesteg, ingen npm, ingen rammeverk.
- Hvert spill/verktøy er én selvstendig HTML-fil med CSS og JS inline.
- Nettstedet deployes automatisk til GitHub Pages ved push til `main`
  (se `.github/workflows/pages.yml`). **Push til `main` = publisert med én gang.**

## Stil

Følg stilen i `mads/index.html` og rot-`index.html`:

- Språk: norsk (bokmål), `<html lang="nb">`
- Fonter: `Nunito` til brødtekst, `Chewy` til overskrifter/logo
- Farger: `--cream:#fff9f0`, `--ink:#2b2118`, `--yellow:#facc15`, `--muted:#7a6f63`
- Kort og knapper: tykk `3px` ramme i `--ink`, avrundede hjørner, hard skygge (`4px 4px 0`)
- Mobil først – dette brukes i klasserom på nettbrett og telefon

## Når du legger til et nytt spill

1. Lag `mads/navn-pa-spill.html`
2. Legg til et `<a class="card">`-kort i `mads/index.html`
3. Test lokalt: `python3 -m http.server 8000` fra rota, åpne
   `http://localhost:8000/mads/`
4. Commit og push til `main`

## Filnavn

Små bokstaver, bindestrek i stedet for mellomrom, ingen æ/ø/å i filnavn
(f.eks. `laer-gangetabellen.html`).
