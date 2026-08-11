# LRNify Auth

Delt innloggingsmodul for LRNify. Gir lærere **én konto** — Google eller
e-post/passord — på tvers av alle spillene (Temaspinner, Genetisk hjul,
KlassePoll, KRLE-terning, osv.), uten at elevene merker noe: de blir med via
romkode akkurat som i dag.

Denne mappa er levert **isolert**. Ingen eksisterende spillfiler er endret —
modulen er klar til å limes inn i ett spill om gangen når dere vil.

## Filer

| Fil | Hva |
| --- | --- |
| `lrnify-auth.js` | Selve modulen. Definerer `window.LRNifyAuth`. |
| `../firebase/database.rules.json` | Oppdaterte RTDB-regler (`users/`, `resultater/`, og nye felt på `rooms/`). Samme fil som allerede styrer resten av LRNify sine Firebase-regler — se `firebase/README.md`. |

Det finnes ingen egen `firebase-rules.json` i denne mappa: reglene ligger
sammen med resten av LRNify sine regler i `firebase/database.rules.json`,
slik at det aldri finnes to versjoner av «de faktiske reglene» som kan gli
fra hverandre. `firebase.json` i rota peker allerede dit.

## Ett skritt før dette virker: skru på innloggingsmetodene

I [Firebase Console → Authentication → Sign-in method](https://console.firebase.google.com/project/poll-c6bd2/authentication/providers)
(prosjekt `poll-c6bd2`):

1. Skru på **Google**.
2. Skru på **E-post/passord**.

(Anonym pålogging, som Temaspinner allerede bruker for elevrommet sitt, kan
stå som den er — den er helt uavhengig av dette.)

Publiser også de oppdaterte reglene: lim inn `firebase/database.rules.json`
under Realtime Database → Rules, eller kjør `firebase deploy --only database`.

## Ta modulen i bruk i et spill

```html
<script src="/auth/lrnify-auth.js"></script>
<script>
  LRNifyAuth.init({
    apiKey: "AIzaSyBdbRSnz-02Cq2BITAcKY_mvWI5D91BYBM",
    authDomain: "poll-c6bd2.firebaseapp.com",
    databaseURL: "https://poll-c6bd2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "poll-c6bd2",
    storageBucket: "poll-c6bd2.firebasestorage.app",
    messagingSenderId: "541647069675",
    appId: "1:541647069675:web:d8ee426e242e7757dbf9ae"
  });

  // Vis login-knapp/brukerlinje øverst i en tavle-visning:
  LRNifyAuth.mountLoginWidget(document.getElementById('larer-innlogging'));

  // Reager på innlogging andre steder i spillet:
  LRNifyAuth.onAuthChange(bruker => {
    document.getElementById('opprett-rom').disabled = !bruker;
  });
</script>
```

Samme `firebaseConfig`-objekt som resten av LRNify allerede bruker mot
`poll-c6bd2` — se f.eks. `aktiviteter/temaspinner/index.html`.

### Eksempel: Temaspinner (referanse, ikke lagt inn i selve spillet ennå)

`opprettRom` skriver til den delte `rooms/{kode}`-samlingen, og den samlingen
har KlassePolls skjema: reglene krever `question`, `options`, `votes`, `open`
og `createdAt`. Et rom uten de feltene blir avvist. Derfor er KlassePoll det
eneste spillet `opprettRom` passer til i dag:

```js
document.getElementById('opprett-rom').addEventListener('click', async () => {
  if (!LRNifyAuth.getCurrentUid()) { visFeil('Logg inn som lærer først.'); return; }

  const { kode } = await LRNifyAuth.opprettRom('klassepoll', {
    question: sporsmal,
    options: alternativer,
    votes: { 0: 0, 1: 0, 2: 0, 3: 0 },
    open: true,
    createdAt: Date.now(),
    owner: anonymUid      // den eksisterende, anonyme rom-kontrollen — se under
  });
  visLobby(kode);
});

// Lærerens «mine rom»-liste:
const mineRom = await LRNifyAuth.hentMineRom('klassepoll');
```

KlassePoll er integrert på nøyaktig denne måten — se
`aktiviteter/poll/index.html` for den faktiske, fungerende koden, inkludert
«Mine rom»-lista og oppryddingen ved avslutting.

**Andre spill kan ikke bruke `opprettRom` som den står.** Temaspinner,
Genetisk hjul og KRLE-terningen ligger på egne topp-nivå-stier
(`temaspinner/`, `genetikhjul/`, `krle/`) med egne feltkrav i
`firebase/database.rules.json`. Å ta modulen i bruk der krever enten at
spillet flyttes til `rooms/{kode}`, eller at `eierUid` støttes på spillets
egen sti — begge er egne jobber, og ingen av dem er gjort her.

### To ting som er lette å tråkke i

**Ikke kall `signInAnonymously()` uten å sjekke først.** Firebase henter en
lagret sesjon fra IndexedDB asynkront, så `auth.currentUser` er alltid `null`
det øyeblikket sida laster. Et blindt `signInAnonymously()` der logger ut en
lærer som nettopp kom tilbake med Google-kontoen sin. Vent på første
`onAuthStateChanged` før du bestemmer deg — se `ensureAuth()` i KlassePoll.

**La spillet overleve at modulen ikke lastes.** `/auth/lrnify-auth.js` er en
bonus, ikke en forutsetning. KlassePoll faller tilbake på et objekt som
svarer «ingen er innlogget» på alt hvis `window.LRNifyAuth` mangler, slik at
en halv deploy eller en blokkering ikke tar ned elevflyten med seg.

## API

Alt henger på det globale objektet `LRNifyAuth`:

| Funksjon | Beskrivelse |
| --- | --- |
| `init(firebaseConfig)` | Laster Firebase og kobler til. Kall én gang per side, tidlig. Returnerer et Promise. |
| `onAuthChange(callback)` | `callback(bruker \| null)` — kalles med én gang og på hver endring. `bruker` er `{ uid, navn, epost }`. |
| `loginGoogle()` | Google-innlogging via popup. Returnerer et Promise med brukeren. |
| `loginEmail(epost, passord)` | E-post/passord-innlogging. Fallback for lærere uten Google-konto. |
| `logout()` | Logger ut. |
| `getCurrentUid()` | `uid` for innlogget lærer, eller `null`. |
| `opprettRom(spillnavn, romConfig)` | Oppretter rom under `rooms/{kode}` og en peker under `users/{uid}/rom/`, atomisk i én operasjon. Setter `eierUid` automatisk. Krever innlogging. Returnerer `{ kode }`. |
| `hentMineRom(spillnavn)` | Lærerens egne rom for et spill, nyeste først. `spillnavn` er påkrevd. Rom som er avsluttet og slettet faller ut av lista. |
| `avsluttRom(spillnavn, kode)` | Sletter rommet og pekeren i lærerens indeks, atomisk. Uten innlogging slettes bare rommet, som før. |
| `mountLoginWidget(container, valg?)` | Tegner en kompakt login-knapp/brukerlinje inn i `container`. Ikke i den opprinnelige kravlista, men nødvendig for UI-kravet — se under. |

`opprettRom` tar et valgfritt tredje argument, `{ romkode }`, så et spill kan
beholde sin egen kodegenerator — KlassePoll bruker seks tegn, modulens
standard er fire, og kortere koder kolliderer oftere.

`mountLoginWidget` tar `{ firebaseConfig }` i `valg`. Sendes den med, lastes
Firebase-SDK-en først når noen faktisk åpner innloggingsmodalen, i stedet for
ved sidelast. Nedlastingen starter idet modalen åpnes — ikke først når
Google-knappen trykkes, for da ville et nettverkskall ligget mellom klikket og
popup-en, og nettleseren ville blokkert den som uønsket popup.

### Tilpasse utseendet

Widgeten leser CSS-variabler med innebygd reserveverdi, og definerer dem
aldri selv. En side kan derfor overstyre dem i sitt eget stilark uten at
rekkefølgen på stilarkene avgjør hvem som vinner:

```css
:root {
  --lrnauth-ink: #2b2118;      /* KlassePoll og forsiden bruker denne, ikke #1a1a1a */
  --lrnauth-skygge: 0 5px 0;   /* skygge rett nedover i stedet for på skrå */
  --lrnauth-skygge-stor: 0 7px 0;
  --lrnauth-trykk: translateY(4px);
}
```

Øvrige: `--lrnauth-gul`, `--lrnauth-cream`, `--lrnauth-muted`.

`mountLoginWidget` er lagt til utover den oppgitte API-lista fordi kravet om
en «liten, innebygd login-knapp/modal» trenger et sted å henge seg på. Den
er bevisst holdt separat fra `init`/`onAuthChange` slik at et spill som vil
bygge sin egen knapp med `onAuthChange` fritt kan la være å bruke den.

## Datamodell

```
/users/{uid}/
    profile: { navn, epost, opprettet }
    klasser: { klasseId: { navn, trinn, opprettet } }
    spillinnstillinger: { spillnavn: { ...fritt innhold per spill } }
    rom: { spillnavn: { romkode: { opprettet, klasseId? } } }
        — invertert indeks. /rooms kan ikke listes opp av noen (ellers kunne
          hvem som helst ramse opp alle aktive rom), så en spørring på
          eierUid der vil alltid avvises. hentMineRom() leser denne i
          stedet, og slår så opp hvert rom for seg.

/rooms/{roomCode}/
    eierUid: "{uid}"       — ny. Kobler rommet til en innlogget lærer.
    delteUider: {}         — ny, tom i v1. Forberedt for fremtidig deling
                              (kollega/vikar-tilgang) — ingen UI eller logikk
                              i denne omgangen bruker den.
    klasseId: "{valgfri}"  — ny.
    spill: "{spillnavn}"   — ny. Satt av LRNifyAuth.opprettRom(), ikke i
                              den opprinnelige kravlista, men nødvendig for
                              at hentMineRom() skal kunne skille mellom
                              samme lærers rom i ulike spill i denne ene
                              delte samlingen.
    ... (alle eksisterende romfelter, f.eks. question/options/votes for
         KlassePoll, uendret)

/resultater/{uid}/{spillnavn}/{oktId}/
    dato, romkode, ...aggregerte tall
    — ment for aggregerte tall, aldri navngitte elevresultater.
```

**Om personvern-garantien i `resultater`:** reglene avviser nøstede objekter
under en økt, altså akkurat den formen en elevliste ville hatt. Men de kan
ikke hindre at et *flatt* felt inneholder et navn — `{ dato, romkode,
bestElev: "Ida Hansen" }` går gjennom. Reglene er altså et rekkverk mot den
åpenbare feilen, ikke en garanti. Ansvaret for å ikke skrive elevnavn dit
ligger fortsatt hos spillet som kaller.

**`eierUid` vs. det eldre `owner`-feltet på rom:** Flere spill (KlassePoll,
KRLE-terningen, Temaspinner) bruker fra før anonym pålogging og et
`owner`-felt for å styre hvem som kan avslutte rommet, telle stemmer osv. —
se `firebase/README.md`. Det er en helt egen mekanisme, med en helt annen
(anonym, per-nettleser) `uid`. `eierUid` er alltid en *innlogget lærers*
faste `uid`, og styrer kun `klasseId`/`delteUider` og hvilke rom som dukker
opp i `hentMineRom()` — den rører ikke den eksisterende
`owner`-baserte tilgangsstyringen i det hele tatt.

**Bakoverkompatibilitet:** Rom opprettet uten innlogget lærer mangler
rett og slett `eierUid`, og fungerer helt som før. Ingen migrering av
eksisterende data er nødvendig, og `eierUid` kan bare settes idet rommet
opprettes — det kan aldri legges til på et rom i etterkant av noen andre enn
den som lagde det (se reglene og testene for `rooms/$room/eierUid` i
`firebase/rules.test.js`).

**Personvern:** `profile` inneholder kun navn og e-post — ingen annen
metadata. Ingen del av modulen skriver elevnavn noe sted; se forbeholdet om
`resultater` over.

**Rydding:** avslutter læreren et rom, slettes `/rooms/{kode}`, men pekeren
under `users/{uid}/rom/` blir liggende. `hentMineRom()` filtrerer bort
pekere uten rom, så lista blir riktig — men pekerne hoper seg opp over tid.
Sletter spillet rommet, bør det slette pekeren i samme slengen (se
KlassePoll-integrasjonen i `aktiviteter/poll/index.html`).

## Sikkerhetsregler

Se `firebase/database.rules.json` (seksjonene `users`, `resultater`, og de
nye feltene under `rooms/$room`). Kort oppsummert:

- En lærer kan lese/skrive kun sin egen `/users/{eget uid}/...`, inkludert
  rom-indeksen.
- En lærer kan sette `eierUid` til sin egen `uid` når et rom opprettes, og
  deretter styre `klasseId`/`delteUider` på akkurat det rommet.
- Elever (uinnlogget) leser fortsatt romdata via romkode som før, uten noen
  tilgang til `/users/` eller `/resultater/`.
- En lærer kan ikke lese en annen lærers `/resultater/{uid}/...`.
- `/rooms` kan fortsatt ikke listes opp av noen — heller ikke av en innlogget
  lærer. Det er den begrensningen rom-indeksen finnes for å jobbe rundt.

Kjør `node firebase/rules.test.js` (krever `npm install targaryen`) for å
verifisere reglene — inkludert alle de nye testene for `users/`,
`resultater/` og de nye `rooms`-feltene.
