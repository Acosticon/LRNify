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

1. **Realtime Database:** [console.firebase.google.com](https://console.firebase.google.com/project/poll-c6bd2/database/poll-c6bd2-default-rtdb/rules)
   → Realtime Database → Rules. Lim inn hele innholdet i
   `firebase/database.rules.json` og trykk **Publish**.
2. **Firestore:** samme prosjekt → Firestore Database → Rules. Lim inn
   `firebase/firestore.rules` og trykk **Publish**.

Firestore har sin egen 30-dagers utløpsfrist, så ta den samtidig.

## Alternativ: Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only database,firestore:rules
```

`firebase.json` og `.firebaserc` i rota peker allerede på riktig prosjekt og
riktige filer.

## Teste reglene

`rules.test.js` simulerer de faktiske klientkallene fra begge appene (40
tilfeller: både det som skal virke og det som skal blokkeres):

```bash
npm install targaryen
node firebase/rules.test.js
```

## Hva reglene tillater

**Realtime Database**

* Rota er stengt. Ingen kan liste opp `rooms/` eller `krle/` — man må kjenne
  den eksakte romkoden.
* Et rom kan opprettes eller slettes, men ikke overskrives mens det finnes.
* Romkoden må være 4–8 tegn `A–Z`/`0–9`.
* Poll: en stemme kan bare øke `votes/0..3` med nøyaktig 1. Ingen kan sette
  telleren til 9999 eller endre spørsmål og svaralternativer i ettertid.
* Terningspill: `state.type` må være `activity` eller `concept`, `roll` må være
  1–6. Lag og svar kan legges til, men ikke redigeres eller slettes enkeltvis —
  bare læreren tømmer hele `answers`-lista eller sletter rommet.
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
* **Spam.** Uten innlogging kan noen fortsatt lage mange gyldige rom eller
  fjordvoktere. Vil du stramme til, er
  [App Check](https://firebase.google.com/docs/app-check) med reCAPTCHA
  neste steg — det krever en linje kode i hver app og at
  `firebase-app-check.js` lastes inn.
