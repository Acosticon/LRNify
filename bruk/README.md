# Bruksdata for LRNify

Anonym besøkstelling for lrnify.no. Svarer på ett spørsmål — **hvilke spill
og verktøy blir faktisk brukt, og hvor mye** — uten informasjonskapsler, uten
tredjepart og uten å lagre noe som kan knyttes til en enkelt person.

| Fil | Hva |
| --- | --- |
| `lrnify-bruk.js` | Telleren. Én linje i hver side, ingen konfigurasjon. |
| `index.html` | Dashbord på `/bruk/` — krever pålogging med admin-flagg. |
| `../firebase/database.rules.json` | Reglene for `bruk/`-treet. |
| `../firebase/rules.test.js` | Tester som viser at telleren ikke kan misbrukes. |

## Hvorfor ikke Google Analytics

LRNify brukes av barn i klasserommet. GA4 ville betydd cookiebanner på hver
side, IP-adresser til en amerikansk leverandør, og en samtykkediskusjon med
skoleeiere — for tall vi kan få uten noe av det. Løsningen her lagrer
utelukkende opptellinger av typen «`games-3s1f` ble åpnet 34 ganger 4. mars»,
i LRNifys egen Firebase-database i `europe-west1`, altså samme databehandler
og samme region som resten av tjenesten allerede bruker.

Vi lagrer **ikke** IP-adresse, nettleser, enhet, referanse-URL, geografi,
eller noe som helst per besøkende — og skriver **ingenting** til brukerens
maskin, verken informasjonskapsler eller `localStorage`. Det finnes derfor
ingen personopplysninger i `bruk/`-treet, og heller ikke noen måte å skille
ett besøk fra et annet i ettertid.

## Datastruktur

```
bruk/<dato>/<side>/<hendelse> = antall
bruk/2026-03-04/games-3s1f/visning = 34
```

* **dato** — `ÅÅÅÅ-MM-DD` i norsk tid, så en økt ikke havner på gårsdagen.
* **side** — utledet av adressen: `/games/3s1f/` → `games-3s1f`, `/` →
  `forsiden`. Kan overstyres med `data-side` på script-taggen.
* **hendelse** — `visning` i dag. Se «Utvidelser» under.

## Slik teller den

```html
<script src="/bruk/lrnify-bruk.js" defer></script>
```

Ett `PUT`-kall mot Firebase sitt REST-API med kroppen
`{".sv":{"increment":1}}` — Firebase sin serverside-inkrementering. Fordelene
er verdt å merke seg:

* **Ingen Firebase-SDK.** Sidene slipper ~100 kB nedlasting for å bli talt.
* **Ingen leserettigheter.** Databasen legger til 1 på det tallet som ligger
  der; klienten trenger aldri å vite hva det var. En vanlig transaksjon ville
  krevd lesetilgang til statistikken for alle besøkende.
* **Ingen tapte tellinger.** To klasser som åpner samme spill i samme sekund
  gir 2, ikke 1.
* **Ingen annonseblokkering.** Kallet går til samme domene som spillene
  allerede snakker med, ikke til et kjent sporingsdomene.

Telling skjer kun på `lrnify.no`, så lokal utvikling ikke blander seg inn i
tallene, og feiler i stillhet — en side skal aldri knekke fordi statistikk
ikke kom fram.

## Oppsett (én gang)

**1. Legg ut reglene.** `firebase/database.rules.json` har fått et nytt
`bruk`-tre. Deploy som resten av reglene (se `firebase/README.md`) — enten
`firebase deploy --only database` eller lim inn i
[Rules-fanen i konsollet](https://console.firebase.google.com/project/poll-c6bd2/database/poll-c6bd2-default-rtdb/rules).
**Ingenting telles før dette er gjort.**

**2. Gi deg selv leserett.** Tallene er ikke offentlige. I
[Realtime Database → Data](https://console.firebase.google.com/project/poll-c6bd2/database/poll-c6bd2-default-rtdb/data):
finn `users/<din-uid>` og legg til feltet `admin` med verdien `true`
(boolsk). UID-en din står i feilmeldingen på `/bruk/` hvis du prøver å åpne
dashbordet uten tilgang.

Flagget kan bare settes fra konsollet: reglene for `users/$uid` avviser
ukjente felt fra klienter, så ingen kan gjøre seg selv til admin fra
nettleseren. Det er testet i `firebase/rules.test.js`.

**3. Sjekk at det virker.** Åpne en side på lrnify.no, og se etter tallet:

```
curl "https://poll-c6bd2-default-rtdb.europe-west1.firebasedatabase.app/bruk/$(date +%F)/forsiden/visning.json"
```

(Den kommandoen gir `null` hvis reglene ikke er lagt ut ennå, eller
`"Permission denied"` — lesing krever admin-flagget. Bruk dashbordet på
`/bruk/` når flagget er på plass.)

## Hva reglene tillater

Skriverett finnes **bare** på selve tallet, og bare som «det som lå der, pluss
1». Ingen kan telle nedover, sette et vilkårlig tall, slette historikk eller
lese tallene uten admin-flagget. Nøkkelformatet valideres i `.write` og ikke i
`.validate`, fordi `.validate` på foreldrenoder ikke kjøres når skrivingen
skjer på bladet — en felle det er verdt å huske hvis reglene skal endres.

Det som *er* mulig, er at noen med vilje sitter og teller opp den samme
telleren for å blåse opp et tall. Det ødelegger ingenting og lekker
ingenting, men gjør tallet ubrukelig. Skulle det bli et problem, er svaret
[App Check](https://firebase.google.com/docs/app-check) med reCAPTCHA
Enterprise, som knytter skriverett til at kallet faktisk kommer fra lrnify.no.

## Utvidelser

Strukturen har allerede plass til mer enn sidevisninger, og både reglene og
dashbordet håndterer nye hendelsesnavn uten endringer:

```js
LRNifyBruk.tell('runde-fullfort');
```

Nye navn dukker opp som egne kolonner i tabellen på `/bruk/` av seg selv.
To naturlige neste steg:

* **Fullføringsgrad** — `tell('runde-start')` og `tell('runde-fullfort')` i
  spillene viser hvor mange som spiller ferdig, ikke bare åpner sida.
* **Varighet** — krever en økt-id i minnet og et `sendBeacon`-kall ved
  `visibilitychange`. Merk at en økt-id i `sessionStorage` ville vært
  lagring på brukerens maskin, og dermed en annen personvernvurdering enn
  dagens oppsett. Hold den i en variabel.

## Grenser

* **Ikke unike besøkende.** 100 visninger kan være 100 lærere eller én lærer
  med 100 omlastinger. Trengs unike tall, referanse-URL eller varighet, er
  riktig verktøy en cookieless EU-tjeneste (Plausible, Simple Analytics,
  eller Umami selvhostet) ved siden av denne.
* **Krever JavaScript.** Roboter og søkemotorer telles stort sett ikke — som
  regel en fordel.
* **Vokser sakte.** ~60 sider × 365 dager ≈ 22 000 tall i året, noen få MB.
  Godt innenfor gratisnivået. Vil du rydde, slett gamle datoer under `bruk/`
  i konsollet; strukturen er én node per dag nettopp for at det skal være
  enkelt.

## Sider som ikke telles

Med vilje utenfor: dashbordet selv (`/bruk/`), `delete.html`, `blog/_mal.html`,
`media/`, `LRNify_thumbs/`, og de nummererte arbeidskopiene i
`spill/matyrint/`. Noen filer mangler `</body>` og er hoppet over fordi de er
tomme eller ikke er ekte sider (`games/games.html`, `inbox/`, `vm/index.html`,
`games/geografi/asia_land/`, `loype/*/media/`).

Skal en ny side telles, legg til linja før `</body>`.
