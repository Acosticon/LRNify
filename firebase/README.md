# Firebase-regler for LRNify (prosjekt `poll-c6bd2`)

Test Mode-reglene i Firebase utløper 30 dager etter oppsett, og da blir alle
forespørsler avvist. Disse filene erstatter dem med regler som holder appene i
gang uten å la hvem som helst skrive hva som helst.

## Hva som faktisk bruker Firebase

| App | Produkt | Sti / samling | Skriver |
| --- | --- | --- | --- |
| `aktiviteter/poll/` | Realtime Database | `rooms/{ROMKODE}` | Lærer lager/sletter rom, elev teller opp én stemme |
| `aktiviteter/terningspill/` | Realtime Database | `krle/{ROMKODE}` | Lærer lager/sletter rom og setter `state`, elev legger til lag og svar |
| `loype/drobak-akvarium/` | Firestore | `fjordvoktere` | Legger til ett lag på veggen (`{ lag, tid }`) |

Ingen av appene logger inn brukere, så reglene kan ikke kreve `auth != null`.
Sikkerheten ligger i at romkoden må være kjent, og i at reglene låser *formen*
på det som kan skrives.

## Raskeste vei (Firebase Console, ~2 minutter)

1. **Skru på anonym pålogging:**
   [Authentication → Sign-in method](https://console.firebase.google.com/project/poll-c6bd2/authentication/providers)
   → **Anonymous** → Enable. Ingen elever ser noe til dette: nettleseren får en
   tilfeldig id i bakgrunnen, uten konto, e-post eller innloggingsskjerm.
2. **Realtime Database:** [console.firebase.google.com](https://console.firebase.google.com/project/poll-c6bd2/database/poll-c6bd2-default-rtdb/rules)
   → Realtime Database → Rules. Lim inn hele innholdet i
   `firebase/database.rules.json` og trykk **Publish**.
3. **Firestore:** samme prosjekt → Firestore Database → Rules. Lim inn
   `firebase/firestore.rules` og trykk **Publish**.

Firestore har sin egen 30-dagers utløpsfrist, så ta den samtidig.

Rekkefølgen spiller ingen rolle, og steg 1 kan hoppes over: appene prøver å
logge på anonymt, og går videre som før hvis det ikke lar seg gjøre. Da mister
du bare eier-beskyttelsen under, ikke funksjonaliteten.

## Alternativ: Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only database,firestore:rules
```

`firebase.json` og `.firebaserc` i rota peker allerede på riktig prosjekt og
riktige filer.

## Teste reglene

`rules.test.js` simulerer de faktiske klientkallene fra begge appene (64
tilfeller: både det som skal virke og det som skal blokkeres, med og uten
anonym pålogging):

```bash
npm install targaryen
node firebase/rules.test.js
```

## Anonym pålogging — hva den gir

Uten pålogging kan ikke reglene se forskjell på lærerens nettleser og elevens.
Da måtte alt læreren gjør — avslutte rommet, tømme svar, kaste terningen —
være åpent for alle som kjenner romkoden. Den som griffer i praksis er ikke et
tilfeldig bot på internett (romkoden er 1 av ~1 milliard, og ingen kan liste
dem opp), men eleven som allerede sitter i klasserommet med koden.

Anonym pålogging gir hver nettleser en tilfeldig id uten konto eller
innloggingsskjerm. Appene lagrer id-en til den som lagde rommet i `owner`, og
reglene bruker den til:

* bare eieren kan slette rommet,
* bare eieren kan sette `krle/$rom/state` (kaste terningen),
* bare eieren kan tømme `answers`,
* én stemme per nettleser i poll.

Stemmen skrives som **én operasjon** som både teller opp og setter
`voters/<id>` — reglene krever at de to følges ad, så telleren kan ikke økes
uten at merket settes samtidig, og merket kan ikke fjernes etterpå.

**Gamle rom uten `owner` oppfører seg som før.** Er ikke anonym pålogging
skrudd på, lages rom uten `owner`, og alt virker som i dag. Ingenting knekker
av å publisere reglene først.

## Hva reglene tillater

**Realtime Database**

* Rota er stengt. Ingen kan liste opp `rooms/` eller `krle/` — man må kjenne
  den eksakte romkoden.
* Et rom kan opprettes, men ikke overskrives mens det finnes. Slettes kan det
  bare av den som lagde det.
* Romkoden må være 4–8 tegn `A–Z`/`0–9`.
* Poll: en stemme kan bare øke `votes/0..3` med nøyaktig 1, og bare én gang per
  nettleser. Ingen kan sette telleren til 9999 eller endre spørsmål og
  svaralternativer i ettertid.
* Terningspill: `state.type` må være `activity` eller `concept`, `roll` må være
  1–6. Lag og svar kan legges til, men ikke redigeres eller slettes.
* Lengdegrenser på all tekst (spørsmål 300, alternativ 200, svar 500, lagnavn
  24 tegn), og ukjente felt avvises.

**Firestore**

* `fjordvoktere` kan leses av alle og legges til av alle, men eksisterende rader
  kan ikke endres eller slettes. Dokumentet må være nøyaktig `{ lag, tid }`.
* Alle andre samlinger er stengt.

## Det reglene ikke løser

* **Rom blir liggende.** Realtime Database har ingen automatisk sletting. Rom
  som læreren ikke lukker, blir liggende for alltid. Rydd av og til i
  konsollen, eller slett `rooms`/`krle` helt mellom skoleårene — appene lager
  nye rom ved behov.
* **Spam.** Anonyme id-er er gratis å lage: den som virkelig vil, kan tømme
  nettleserdata og få en ny id, eller lage mange tomme rom. Det hever terskelen
  fra «hold inne F5» til «skriv et skript», men fjerner den ikke. Vil du
  stramme til, er [App Check](https://firebase.google.com/docs/app-check) med
  reCAPTCHA neste steg — det krever en linje kode i hver app og at
  `firebase-app-check.js` lastes inn.
* **Fjordvokter-veggen** har ingen pålogging og er fortsatt åpen for påfyll av
  hvem som helst. Rader kan ikke slettes eller endres, så det verste som kan
  skje er tullenavn på lista.
