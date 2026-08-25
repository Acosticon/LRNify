# Firebase-regler for LRNify (prosjekt `poll-c6bd2`)

Test Mode-reglene i Firebase utløper 30 dager etter oppsett, og da blir alle
forespørsler avvist. Disse filene erstatter dem med regler som holder appene i
gang uten å la hvem som helst skrive hva som helst.

## Hva som faktisk bruker Firebase

| App | Produkt | Sti / samling | Skriver |
| --- | --- | --- | --- |
| `aktiviteter/poll/` | Realtime Database | `rooms/{ROMKODE}` | Lærer lager/sletter rom, elev teller opp én stemme |
| `aktiviteter/terningspill/` | Realtime Database | `krle/{ROMKODE}` | Lærer lager/sletter rom og setter `state`, elev legger til lag og svar |
| `aktiviteter/genetikhjul/` | Realtime Database | `genetikhjul/{KLASSEKODE}` | Elev sender inn én profil, lærerens tavle nullstiller klassen |
| `aktiviteter/temaspinner/` | Realtime Database | `temaspinner/{ROMKODE}` | Lærer lager rom, deler ut temaer og styrer klokka; elev melder seg på og ber om bytte |
| `aktiviteter/tankesky/` | Realtime Database | `tankesky/{ROMKODE}` | Lærer lager rom og styrer runde/fri flyt/tavle; elev sender inn ord som teller opp eller oppretter bobler |
| `aktiviteter/dagsformen/` | Realtime Database | `dagsformen/{ROMKODE}` | Lærer lager rom og velger tema; elev velger (og bytter) én av 30 følelsesfigurer anonymt |
| `games/verdikompasset/` | Realtime Database | `verdikompasset/{ROMKODE}` | Lærer lager rom; elev rangerer verdier og svarer på dilemmaer, og skriver sitt eget resultat (poeng/handling per verdi, samsvar) under sin egen anonyme id |
| `loype/drobak-akvarium/` | Firestore | `fjordvoktere` | Legger til ett lag på veggen (`{ lag, tid }`) |
| `index.html` (forsidens CTA-skjema) | Firestore | `feedback` | Besøkende sender inn forslag/tilbakemelding/bestilling |
| `bruk/lrnify-bruk.js` (alle sider) | Realtime Database | `bruk/{dato}/{side}/{hendelse}` | Teller opp én sidevisning — anonymt, se `bruk/README.md` |

**`auth/lrnify-auth.js`** (se `auth/README.md`) er en delt innloggingsmodul
for lærere (Google/e-post) som ikke er koblet til noe spill ennå — den er
levert isolert, klar til integrasjon. Reglene under er likevel allerede
oppdatert for den: `users/{uid}` og `resultater/{uid}` er nye topp-nivå-stier,
og `rooms/{ROMKODE}` har fått tre nye, valgfrie felt (`eierUid`,
`delteUider`, `klasseId`) i tillegg til de eksisterende poll-feltene.

Ingen av spillene over ber brukeren logge inn, så reglene for dem kan i
hovedsak ikke kreve
`auth != null`. Sikkerheten ligger i at romkoden må være kjent, og i at reglene
låser *formen* på det som kan skrives.

**Unntaket er Temaspinner, Tankesky, Dagsformen og Verdikompasset**, som er
bygget etter at anonym pålogging kom på plass og derfor krever den overalt
der de bruker rom. I Verdikompasset er det den anonyme id-en som gjør at en
elev kan skrive (og oppdatere) sitt eget resultat i `elever/` uten å kunne
røre andre elevers rader — akkurat som i Dagsformen. Uten anonym pålogging
virker ikke rom-modus (lærer/elev) i Verdikompasset, men «Gjør øvelsen
alene» krever ikke noe rom og er upåvirket. I Dagsformen *er*
elevens anonyme id nøkkelen under `elever/`, akkurat som i Tankesky — det er
den som gjør at eleven kan skrive (og bytte) sin egen følelse uten å kunne
røre andres. Uten anonym pålogging virker ikke rom-modus i Dagsformen — men
den enkleste bruken (læreren viser figurhjulet i fullskjerm uten rom) krever
ikke noe rom i det hele tatt, og er upåvirket.

I Temaspinner *er*
elevens anonyme id nøkkelen under `elever/`, og det er den som skiller «mitt
tema» fra «en annens tema». Uten anonym pålogging virker ikke rom-modus i
Temaspinner — men tavlemodus i samme app går helt uten nett og er upåvirket.
I Tankesky brukes den anonyme id-en til å vite hvilket ord en elev sist sendte
inn (`innsendinger/{uid}`), slik at eleven kan redigere sitt eget bidrag når
«fri flyt» er av, uten å kunne røre andres ord.

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

Rekkefølgen spiller ingen rolle. Steg 1 kan hoppes over for de eldre appene:
de prøver å logge på anonymt, og går videre som før hvis det ikke lar seg
gjøre — da mister du bare eier-beskyttelsen under, ikke funksjonaliteten.
Temaspinner er unntaket, se avsnittet over: der er steg 1 påkrevd for
rom-modus.

## Alternativ: Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only database,firestore:rules
```

`firebase.json` og `.firebaserc` i rota peker allerede på riktig prosjekt og
riktige filer.

## Teste reglene

`rules.test.js` simulerer de faktiske klientkallene fra appene (149 tilfeller:
både det som skal virke og det som skal blokkeres, med og uten anonym
pålogging):

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

## Fase 2: gjør `owner` obligatorisk

Så lenge rom *kan* lages uten `owner`, kan de også slettes og styres av hvem
som helst med romkoden. Det er med vilje — det er fallback-en som gjør at
appene overlever uten anonym pålogging — men den bør stenges når alt annet er
på plass.

Rekkefølge (viktig — stenges den for tidlig, kan ingen lage rom i det hele
tatt):

1. Anonym pålogging er skrudd på i konsollen.
2. Denne grenen er merget, så `lrnify.no` faktisk kjører koden som setter
   `owner`.
3. Kjør én ekte poll på to enheter og sjekk at stemmen kommer fram og at
   samme enhet ikke får stemme to ganger.
4. Ingen aktive rom fra gammel kode ligger igjen i databasen.

Da kan `owner` legges til i `.validate` for begge rom-typene:

```diff
-".validate": "$room.matches(/^[A-Z0-9]{4,8}$/) && newData.hasChildren(['question', 'options', 'votes', 'open', 'createdAt'])",
+".validate": "$room.matches(/^[A-Z0-9]{4,8}$/) && newData.hasChildren(['question', 'options', 'votes', 'open', 'createdAt', 'owner'])",
```

```diff
-".validate": "$room.matches(/^[A-Z0-9]{4,8}$/) && newData.hasChild('createdAt')",
+".validate": "$room.matches(/^[A-Z0-9]{4,8}$/) && newData.hasChildren(['createdAt', 'owner'])",
```

Fra da av er et rom uten eier umulig å lage, og hvert rom kan bare styres av
nettleseren som lagde det. Prisen er at appene slutter å virke hvis anonym
pålogging blir slått av igjen.

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
* Genetisk hjul: klassekoden læreren velger må være 3–24 tegn `A–Z`/`0–9`/`-`
  (begge sidene gjør om til store bokstaver, så `8b-host26` og `8B-HOST26` er
  samme klasse). En elevprofil må være nøyaktig
  `{ navn, kjonn, svar: {T,E,H,D,W,B}, ts }`, hvert svar `dom` eller `rec` og
  `kjonn` `M` eller `F`. Profiler kan legges til, men ikke endres eller
  slettes enkeltvis. Tavla merker klassekoden med sin anonyme id første gang
  visningen startes, og bare den kan tømme klassen med «Nullstill klasse».
  Klassekoden er fire siffer og trekkes tilfeldig, så den treffer før eller
  siden en kode som har vært brukt. En klasse som er over 12 timer gammel kan
  derfor overtas og tømmes av neste lærer — men bare i én operasjon som
  samtidig setter `owner` til den nye læreren, så ingen kan tømme en klasse
  uten å ta over den. Ferske klasser er urørlige for andre enn eieren.
* Temaspinner: romkoden er 4 tegn `A–Z`/`0–9`. Læreren som lager rommet er
  eneste kortgiver — bare eieren kan sette `fase`, `klokke`, `stokk` og
  elevenes `tema`. Eleven kan bare skrive sitt eget navn (én gang, under sin
  egen anonyme id) og sin egen `onskerBytte`, og bare når bytte-billetten er
  påslått og ikke allerede brukt. Det gjør at ingen kan velge sitt eget tema,
  gi seg selv en ny bytte-billett eller stoppe klokka for klassen. En romkode
  kan gjenbrukes av en annen lærer først når rommet er over 12 timer gammelt,
  så et rom som er i bruk ikke kan overskrives midt i en økt.
* Lengdegrenser på all tekst (spørsmål 300, alternativ 200, svar 500, lagnavn
  24 tegn, tema 120 tegn), og ukjente felt avvises.
* `rooms/{ROMKODE}/eierUid`: kan bare settes til egen `uid`, og bare idet
  rommet opprettes — aldri leggs til eller overtas i etterkant, heller ikke
  av eieren selv på et annet rom. `klasseId`, `delteUider` og `spill` kan
  bare skrives av den `eierUid`en peker på. Se `auth/README.md`.
* `users/{uid}` og `resultater/{uid}`: bare den innloggede læreren selv kan
  lese eller skrive sin egen gren. `resultater/{uid}/{spillnavn}/{oktId}`
  tillater kun tallverdier/tekst/boolean ut over `dato`/`romkode` — aldri et
  nøstet objekt, så et navngitt elevresultat kan ikke lagres der.

**Firestore**

* `fjordvoktere` kan leses av alle og legges til av alle, men eksisterende rader
  kan ikke endres eller slettes. Dokumentet må være nøyaktig `{ lag, tid }`.
* `feedback` kan bare skrives til, ikke leses (se eget avsnitt under). `to` er
  låst til nøyaktig `["kontakt@lrnify.no"]`, så feltet ikke kan misbrukes til
  å sende e-post til andre adresser.
* Alle andre samlinger er stengt.

## Forslagsskjemaet på forsiden (`feedback`) — foreløpig satt på pause

**Status:** knappen "Send inn forslag →" på `index.html` er nå en enkel
`mailto:kontakt@lrnify.no`-lenke, ikke skjemaet beskrevet under. Firestore-
skjemaet under ble bygget, men koblet fra fordi oppsettet av e-postutsending
(Trigger Email-utvidelsen) krever et Google-prosjekt du er komfortabel med at
er offentlig knyttet til deg — se avsnittet om det til slutt her. Koden for
skjemaet ligger fortsatt i git-historikken og kan kobles inn igjen når det er
avklart.

Knappen "Send inn forslag →" skrev ett dokument til
Firestore-samlingen `feedback` per innsending: `{ type, melding, kontakt?,
side, opprettet, to, message: { subject, text } }`. Ingen pålogging kreves —
sikkerheten ligger i at reglene låser formen på dokumentet og alltid tvinger
`to` til `kontakt@lrnify.no` (se `firebase/firestore.rules`).

**Lese innsendinger:** siden `allow read` er `false`, kan ingen på nettsiden
liste opp innsendte forslag. Du leser dem selv i
[Firebase Console → Firestore Database → `feedback`](https://console.firebase.google.com/project/poll-c6bd2/firestore/data/feedback).

**Videresend som e-post til kontakt@lrnify.no (valgfritt, gjøres i konsollen):**
dokumentene er allerede formet slik at de kan konsumeres direkte av Firebases
offisielle utvidelse [«Trigger Email from Firestore»](https://extensions.dev/extensions/firebase/firestore-send-email)
— ingen egen kode eller Cloud Function-deploy trengs fra dette repoet.

1. Prosjektet må stå på **Blaze**-planen (pay-as-you-go) for at utvidelser skal
   kunne installeres — se [console.firebase.google.com/project/poll-c6bd2/usage/details](https://console.firebase.google.com/project/poll-c6bd2/usage/details).
2. Skaff en SMTP-tilgang til å sende e-post fra (f.eks. et app-passord på et
   Gmail-abonnement, eller en gratis konto hos en transaksjonell e-posttjeneste
   som Brevo/SendGrid/Mailgun).
3. Gå til [Extensions](https://console.firebase.google.com/project/poll-c6bd2/extensions)
   → **Install extension** → søk opp «Trigger Email from Firestore» → installer.
4. Under konfigurasjonen:
   - **SMTP connection URI**: fra steg 2.
   - **Email documents collection**: sett til `feedback` (ikke standardverdien
     `mail`) — det er samlingen skjemaet faktisk skriver til.
   - **Default FROM address**: en avsenderadresse du har tilgang til å sende
     fra, f.eks. `noreply@lrnify.no` eller den samme som SMTP-kontoen.
5. Publiser. Fra da av sender utvidelsen automatisk en e-post til
   `kontakt@lrnify.no` for hver ny rad i `feedback`, og skriver
   leveringsstatus tilbake i samme dokument (`delivery`-feltet) — de blir
   liggende i Firestore som en logg i tillegg til e-posten.

Uten dette steget fungerer skjemaet likevel: innsendinger lagres trygt i
Firestore, du finner dem bare da kun i konsollen, ikke i innboksen.

### Prosjektet `poll-c6bd2` eies av en privat Google-konto

Det er verdt å rydde opp i før dette (eller noe annet i prosjektet) vokser:
prosjektet ble opprettet på en personlig konto, og eierskap/fakturering i
Firebase/Google Cloud Console er ikke noe besøkende på nettsiden ser — men
alle med tilgang til konsollen (fremtidige medhjelpere, support) ser det.
To måter å rydde i det på, uten å måtte gjenskape prosjektet eller endre
noe i koden (API-nøkler/prosjekt-ID forblir de samme):

1. **Overfør eierskap av det eksisterende prosjektet** til en ny, dedikert
   Google-konto (f.eks. `lrnify.dev@gmail.com` eller lignende, ikke koblet
   til privatpersonen). Gjøres via Firebase Console → Project settings →
   Users and permissions → legg til den nye kontoen som Owner → fjern den
   private kontoen (eller behold den som Editor om ønskelig). Ren og varig
   løsning, lav innsats siden ingenting annet i prosjektet trenger å flyttes.
2. **Løs bare selve e-post-avsenderen separat**, uten å røre prosjekteier­
   skapet: bruk en transaksjonell e-posttjeneste (Brevo/Resend/Mailgun har
   gratisnivåer) med en avsenderadresse verifisert mot `lrnify.no`-domenet,
   i stedet for å legge inn et personlig Gmail-passord som SMTP-legitimasjon
   i utvidelsen. Løser kun bekymringen om at et privat Gmail-navn skal dukke
   opp som avsender i e-postene — ikke det bredere eierskaps-spørsmålet.

Anbefaling: gjør begge — punkt 1 når det er tid til det (det haster ikke),
og pass uansett på å ikke bruke personlig Gmail-SMTP i punkt 4 i steget over.

## Det reglene ikke løser

* **Rom blir liggende.** Realtime Database har ingen automatisk sletting. Rom
  som læreren ikke lukker, blir liggende for alltid. Rydd av og til i
  konsollen, eller slett `rooms`/`krle`/`genetikhjul`/`temaspinner` helt
  mellom skoleårene — appene lager nye rom ved behov. Temaspinner rydder litt
  selv: en romkode som er over 12 timer gammel kan overskrives av neste lærer
  som tilfeldigvis trekker den.
* **Spam.** Anonyme id-er er gratis å lage: den som virkelig vil, kan tømme
  nettleserdata og få en ny id, eller lage mange tomme rom. Det hever terskelen
  fra «hold inne F5» til «skriv et skript», men fjerner den ikke. Vil du
  stramme til, er [App Check](https://firebase.google.com/docs/app-check) med
  reCAPTCHA neste steg — det krever en linje kode i hver app og at
  `firebase-app-check.js` lastes inn.
* **Fjordvokter-veggen** har ingen pålogging og er fortsatt åpen for påfyll av
  hvem som helst. Rader kan ikke slettes eller endres, så det verste som kan
  skje er tullenavn på lista.
* **Forslagsskjemaet** har et enkelt honeypot-felt i skjemaet (skjult for
  mennesker, ofte fylt ut av bots) som stopper de enkleste botene lokalt uten
  å skrive noe til Firestore. Det stopper ikke noen som skriver et skript mot
  Firestore direkte — reglene begrenser da bare *formen* på det som kan
  skrives (tekstlengder, fast mottaker), ikke frekvensen. Blir det et problem,
  er App Check (se punktet over) samme løsning her som ellers.
