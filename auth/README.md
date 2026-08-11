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

Temaspinner sitt lærer-oppsett (`skjerm-larer-oppsett` i
`aktiviteter/temaspinner/index.html`) oppretter i dag et rom direkte mot
`temaspinner/{kode}` med anonym pålogging. Slik ville en fremtidig
integrasjon sett ut for et spill som i stedet bruker den delte
`rooms/{kode}`-samlingen:

```js
document.getElementById('opprett-rom').addEventListener('click', async () => {
  const uid = LRNifyAuth.getCurrentUid();
  if (!uid) { visFeil('feil-opprett', 'Logg inn som lærer først.'); return; }

  const { kode } = await LRNifyAuth.opprettRom('temaspinner', {
    opprettet: Date.now(),
    fase: 'lobby',
    temaListe: romTema.hent(),
    byttBillettPa: romBytte.hent() === 'ja',
    varighetMs: NIVAAER[romNiva.hent()]
  });
  startLarerLobby(kode);
});

// Lærerens «mine rom»-liste, f.eks. på en fremtidig dashboard-side:
const mineRom = await LRNifyAuth.hentMineRom('temaspinner');
```

**Viktig ved faktisk integrasjon:** `opprettRom` skriver til den delte
`rooms/{kode}`-samlingen (samme sti KlassePoll bruker i dag), og legger bare
på `eierUid`/`spill` i tillegg til det du sender inn i `romConfig`. Andre
spill (Temaspinner, Genetisk hjul, KRLE-terningen) bruker i dag *egne*
topp-nivå-stier (`temaspinner/`, `genetikhjul/`, `krle/`) med sine egne
regler og feltkrav i `firebase/database.rules.json`. Å faktisk flytte et
sånt spill over til `rooms/{kode}` — eller å gi det sin egen `eierUid`-støtte
på sin egen sti i stedet — er en egen jobb som hører til selve
integrasjonen, og er ikke gjort her.

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
| `opprettRom(spillnavn, romConfig)` | Oppretter rom under `rooms/{kode}`, setter `eierUid` automatisk. Krever innlogging. Returnerer `{ kode }`. |
| `hentMineRom(spillnavn)` | Henter innlogget lærers egne rom for et spill (filtrert på `eierUid`). |
| `mountLoginWidget(container, valg?)` | Tegner en kompakt login-knapp/brukerlinje inn i `container`. Ikke i den opprinnelige kravlista, men nødvendig for UI-kravet — se under. |

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
    — aldri navngitte elevresultater. Reglene håndhever dette: hvert felt ut
      over dato/romkode må være tall, tekst eller boolean — aldri et objekt
      (som et navngitt elevsvar ville vært).
```

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
metadata. Elevnavn lagres aldri noe sted i denne strukturen; `resultater`
tillater kun aggregerte tall/tekst, ikke navngitte elevsvar.

## Sikkerhetsregler

Se `firebase/database.rules.json` (seksjonene `users`, `resultater`, og de
nye feltene under `rooms/$room`). Kort oppsummert:

- En lærer kan lese/skrive kun sin egen `/users/{eget uid}/...`.
- En lærer kan sette `eierUid` til sin egen `uid` når et rom opprettes, og
  deretter styre `klasseId`/`delteUider` på akkurat det rommet.
- Elever (uinnlogget) leser fortsatt romdata via romkode som før, uten noen
  tilgang til `/users/` eller `/resultater/`.
- En lærer kan ikke lese en annen lærers `/resultater/{uid}/...`.

Kjør `node firebase/rules.test.js` (krever `npm install targaryen`) for å
verifisere reglene — inkludert alle de nye testene for `users/`,
`resultater/` og de nye `rooms`-feltene.
