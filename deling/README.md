# Deling for LRNify

Delefunksjon for lærere: en flytende «Del»-knapp nederst til høyre på hver
side, med fire valg — **Del i Teams**, **Del i Google Classroom**,
**Vis QR-kode** og **Kopier lenke**. Ingen konto, ingen tredjepart, ingen
sporing på tvers av sider.

| Fil | Hva |
| --- | --- |
| `deling.js` | Selve modulen. Definerer `window.LRNifyDeling`. |
| `qrcode-lib.js` | Vendored QR-kode-generator ([qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) av Kazuhiko Arase, MIT-lisens). Lastes først når noen trykker «Vis QR-kode» — se «Hvorfor vendored» under. |
| `../firebase/database.rules.json` | Skriveregler for `deling/`-treet — samme mønster som `bruk/`, se `firebase/README.md`. |

## Ta modulen i bruk

Én linje, ingen konfigurasjon:

```html
<script src="/deling/deling.js" defer></script>
```

Det holder for alle vanlige sider — spillet/verktøyet deler sin egen URL.

### Romspill (Poll, Temaspinner, Genetisk hjul, KRLE-terningen)

Kall `setRomkode` idet rommet er opprettet, så deler knappen bli-med-lenken
(`?kode=...`) i stedet for den bare siden:

```js
LRNifyDeling.setRomkode('AB12CD');
```

Delelenken oppdateres umiddelbart — neste gang læreren trykker «Del», er det
bli-med-lenken som deles. Elever som klikker den kommer rett til rommet uten
å taste inn koden selv.

## Hvorfor egne delelenker, ikke tredjeparts delerklinger

Både Teams og Google Classroom har åpne, ikke-autentiserte delelenker —
ingen app-registrering, ingen SDK, ingen data forlater siden før læreren
faktisk trykker:

* **Teams:** `https://teams.microsoft.com/share?href=<url>&msgText=<tekst>`
* **Classroom:** `https://classroom.google.com/share?url=<url>`

Begge åpner sin egen dialog i en ny fane der læreren velger kanal/klasse.
LRNify sender aldri noe direkte til Microsoft eller Google i bakgrunnen —
lenkene er rene `<a>`-mål, akkurat som en manuelt skrevet URL.

## Hvorfor vendored QR-bibliotek, ikke en CDN

`qrcode-lib.js` er kopiert inn i repoet, ikke lastet fra en CDN. To grunner:

1. **Personvern.** LRNify sin linje (se `bruk/README.md` og personvernsiden)
   er at ingenting tredjeparts kjører på sidene mens elever bruker dem. Et
   CDN-skript ville brutt med det, selv om det bare tegner en QR-kode.
2. **Korrekthet.** QR-koding (Reed–Solomon-feilretting m.m.) er lett å gjøre
   subtilt feil hvis man skriver det fra bunnen. Biblioteket som er vendored
   er det mest brukte i sitt slags, MIT-lisensiert, og round-trip-testet
   mot en uavhengig JS-dekoder (`jsQR`) som en del av dette arbeidet — se
   commit-historikken for testskriptet.

Fila lastes likevel ikke på hver sidevisning: `deling.js` setter den kun inn
i DOM-en når noen trykker «Vis QR-kode», og alltid fra `/deling/` på
lrnify.no selv — aldri en ekstern vert.

## Telling

Samme mønster som `bruk/lrnify-bruk.js`: ett `PUT`-kall mot Firebase sitt
REST-API med `{".sv":{"increment":1}}` per knappetrykk, i
`deling/<dato>/<side>/<knapp>`. Ingen Firebase-SDK, ingen leserettigheter
for klienten, teller aldri feil selv om flere trykker samtidig. Telling skjer
kun på `lrnify.no` — knappen virker likevel lokalt, den bare teller ikke der.

Reglene er identiske i form til `bruk/`-treet (se
`firebase/database.rules.json`): skriverett bare på selve tallet, og bare som
«det som lå der, pluss 1». Leserett krever admin-flagget, samme sjekk som
`bruk/`.

Sjekk at det virker (etter at reglene er lagt ut, se
`firebase/README.md` for fremgangsmåten):

```
curl "https://poll-c6bd2-default-rtdb.europe-west1.firebasedatabase.app/deling/$(date +%F)/games-klimakoden/teams.json"
```

(`"Permission denied"` er forventet uten admin-flagget — det betyr at
reglene er lagt ut og fungerer.)

### Utvidelse: eget dashbord

`/bruk/` har et dashbord som leser `bruk/`-treet. `deling/`-treet har
bevisst samme form (`$dato/$side/$hendelse` → antall), slik at et tilsvarende
dashbord for delingstall kan bygges senere uten å røre reglene eller
`deling.js`.

## Hva knappen ikke gjør

* Den flytter seg ikke automatisk unna spillets eget grensesnitt — den er
  plassert nederst til høyre (`position: fixed`) fordi det er stedet færrest
  spill legger egne kontroller. Kolliderer den med noe i et bestemt spill,
  er det et CSS-problem i det enkelte spillet, ikke i modulen.
* Den husker ikke rom på tvers av sideoppdateringer — `setRomkode` må kalles
  på nytt hver gang siden lastes, akkurat som resten av romtilstanden i disse
  spillene allerede fungerer.
