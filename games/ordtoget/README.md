# Ordtoget

Bygg et tog av ord: hver vogn må starte med siste bokstav i vogna foran.
Ordet blir en togvogn – lengden på ordet gir lengden på vogna, og
vogntypen varierer etter hvilke vogner du har låst opp.

Spillifisert variant av `games/ordkjedeverkstedet/`, som ligger igjen
som den enkle kontrollversjonen for A/B-testing.

> Het tidligere «Ordkjedeverkstedet Arkade». Navnet ble byttet fordi
> logoen delte ordet over to linjer og leste som en orddelingsfeil.
> `games/ordkjedeverkstedet-arkade/` er nå bare en videresending.

## To versjoner

| Fil | For hvem |
|-----|----------|
| `index.html` | Ruter. Sender videre automatisk. `?velg` gir manuelt valg. |
| `mobil.html` | Berøring, skjermtastatur, én tommel |
| `pc.html` | Tastatur, mus, bred skjerm |

Ruteren velger ut fra pekertype og skjermstørrelse, og husker et
manuelt valg i `localStorage`. Begge versjonene har en lenke for å
bytte. Nettbrett havner bevisst på mobilversjonen – der er det
berøring og skjermtastatur som styrer designet, ikke bredden.

### Hva skiller dem

**Mobil** er bygget rundt to ting: tommelen og skjermtastaturet.
Alt som skal trykkes ligger nederst. Layouten måles mot
`visualViewport`, ikke vindushøyden, så når tastaturet kommer opp
krymper toget i stedet for at skrivefeltet forsvinner ut av skjermen.
Da skjules også kombomåler og hintknapp (`body.kb-open`). Neste
bokstav er det største elementet ved siden av toget, trykkflatene er
minst 44 px, skrivefeltet har 17 px skrift så iOS ikke zoomer, og det
er haptisk respons på treff og bom. Vognskjulet ligger i et bunnark.

**PC** bruker bredden: lang skinnegang med mange vogner synlig,
vognskjulet alltid framme ved siden av, og tastatursnarveiene vist i
stedet for gjemt. Å begynne å skrive setter fokus i feltet automatisk.

## Filstruktur

```
ordtoget/
├── index.html          ← ruter
├── mobil.html
├── pc.html
├── css/
│   ├── core.css        ← tokens, togvogner, delte komponenter
│   ├── mobil.css       ← mobillayout
│   └── pc.css          ← PC-layout
└── js/
    ├── app.js          ← felles spillapp (samme logikk begge steder)
    ├── game.js         ← regler, poeng, kombo, nivåer, kraftbonuser
    ├── carriages.js    ← vogntyper og bygging av vogn-DOM
    ├── progress.js     ← framgang og opplåsing (localStorage)
    ├── dictionary.js   ← ordlister og validering
    ├── device.js       ← mobil eller PC
    ├── fx.js           ← canvas: damp, gnister, skjermrist
    ├── audio.js        ← syntetisert lyd (WebAudio, ingen lydfiler)
    ├── mobil.js        ← mobilspesifikk oppkobling
    └── pc.js           ← PC-spesifikk oppkobling
```

`app.js` inneholder all spillogikk og brukes av begge versjonene.
Forskjellene ligger i markup, CSS og et lite `layout`-objekt.

## Viktig: krever webserver

ES-moduler og `fetch()` fungerer ikke over `file://`. Spillet må
serveres over http/https. Lokalt:

```
python3 -m http.server 8000     # fra games/-mappa
```

og åpne `http://localhost:8000/ordtoget/`.

## Togvogner

Vognene tegnes med **CSS, ikke bilder**. Det er et krav fra mekanikken:
vognlengden følger ordlengden, og et bitmap kan ikke strekkes fra «is»
til «menneskerettighetsorganisasjonene» uten å bli forvrengt. CSS gir i
tillegg skarpe kanter på alle skjermer og null lastetid.

Hver vogn har metallrammer med nagler i endene, tak, hjul som følger
ordlengden, og en typespesifikk pynt: stjerne, snø, slyngplanter,
tannhjul, dødningflagg, egg, spøkelsesvinduer, lavasprekker, planet.

Ordet står på en egen **skiltplate** midt på vogna. Vognene har svært
ulike farger, og uten plata ble teksten uleselig på flere av dem.
Vognene har derfor romslig sidemarg, så pynten får plass i endene.

Vogntypen bestemmes av ordet selv (stabil hash) blant de typene du har
vunnet, så samme ord gir samme vogn.

### Vognskjulet

Du starter med **én** vogn, den klassiske godsvogna. De ti andre står
som tomme plasser og må vinnes.

* Kun **ett oppdrag er aktivt** om gangen, med framdriftslinje.
* Alle tellere måles **fra forrige opplåsing** (`since` i
  `progress.js`), så man kan aldri løse to oppdrag på én gang.
* Oppdrag sjekkes underveis i runden, ikke bare på slutten.

Oppdragene bestemmer **når** du får en pakke, ikke **hvilken** vogn:

| # | Oppdrag | | # | Oppdrag |
|---|---------|-|---|---------|
| 1 | Kjør én runde | | 6 | Kjør ti runder til |
| 2 | Kjør tre runder til | | 7 | Lag et tog med 15 vogner |
| 3 | Lag et tog med 10 vogner | | 8 | Samle 5000 poeng |
| 4 | Bruk et ord på 10 bokstaver | | 9 | Samle 10 000 poeng |
| 5 | Få 800 poeng i én runde | | 10 | Samle 25 000 poeng |

### Pakker og vognhjulet

Et fullført oppdrag legger en **uåpnet pakke** i vognskjulet, og
inngangen får en rød merknad. Resultatskjermen har en snarvei rett inn.

Trykker du på pakka rister den, lokket flyr av – og så starter
**vognhjulet**: en slot machine som ruller gjennom vogntypene, bremser
med tikkende lyd og lander på gevinsten. Hva du får avgjøres først i
det øyeblikket.

### Sjeldenhet

| Nivå | Vogner | Tidlig | Midtveis | Sent |
|------|--------|--------|----------|------|
| 1 Vanlig | Kjøle, Jungel, Industri | 12 | 6 | 2 |
| 2 Sjelden | Tank, Godteri, Pirat | 5 | 9 | 5 |
| 3 Episk | Dinosaur, Spøkelses, Vulkan | 1,5 | 5 | 9 |
| 4 Legendarisk | Rom | 0,4 | 1,5 | 6 |

Vektene forskyves etter hvor langt du er kommet, men alt kan komme når
som helst – Romvogna kan dukke opp på første trekning, det er bare lite
sannsynlig. Vunne vogner faller ut av puljen, så duplikater er umulig.
Sjeldne gevinster får kraftigere feiring.

Damplokomotivet og gullvogna står utenfor: lokomotivet trekker alltid
toget, og gullvogna kommer av seg selv på gylne ord.

## Spillmoduser

| Modus | Tid | Liv | Kommentar |
|-------|-----|-----|-----------|
| Klassisk | 20 sek | – | Hvert ord gir tid tilbake |
| Blitz | 12 sek | – | Raskere tidsforbruk, stiger med nivå |
| Maraton | ingen | 3 | Feil svar koster et liv |

## Poeng

```
grunnpoeng = 10 + (ordlengde − 3) × 4
           + 15 hvis ordet slutter på æ ø å y i u o
totalt     = grunnpoeng × kombo × (3 ved gyllen bokstav) × (2 ved Dobbel)
```

Kombo øker ved 3, 6, 10 og 15 riktige på rad (opptil ×5) og nullstilles
ved feil. Nivå stiger hvert 5. ord.

## Kraftbonuser

Deles ut ved nivåopprykk og nye kombonivåer, maks 3 av hver. Brukes med
trykk eller tastene 1–3.

* ❄️ **Frys** – fyller klokka og fryser den i 5 sekunder (ikke i Maraton)
* ⚡ **Dobbel** – neste vogn teller dobbelt
* 🔄 **Bytt** – bytter til en lettere bokstav

## Ordlisten

Ligger i `games/_shared/ordliste.txt` og deles med originalversjonen –
ca. 581 000 bøyningsformer fra Norsk Ordbank (bokmål),
Nasjonalbiblioteket/Språkbanken.

**Flytter du `games/_shared/`, må `BIG_WORDLIST_URL` i
`js/dictionary.js` oppdateres, og tilsvarende i
`games/ordkjedeverkstedet/index.html`.**

Godkjenning skjer i tre lag: en liten liste med vanlige ord (til
startord og hint), så hele Norsk Ordbank lokalt, og til slutt
Bokmålsordboka (`api.ordbokene.no`) for ord ingen av listene kjenner.

## Lagring

Framgang lagres i `localStorage` under `ordtoget-progress-v3`
(rekorder per modus, vunne vogner, uåpnet pakke, oppdragsnummer og
tellerne siden forrige opplåsing), og versjonsvalget under
`ordtoget-versjon`. Nøkkelen bumpes hver gang vognutvalget eller
opplåsingsmodellen legges om, så gammel data ikke gir vogner som ikke
finnes lenger. Eldre nøkler blir liggende ubrukt.

**Nullstill all framgang** ligger nederst i vognskjulet. Den krever to
trykk, siden den ikke kan angres.
Kun tall og vogn-id-er – ingen persondata.
Feiler lagringen (privat nettlesermodus), kjører spillet videre uten
å lagre.

## Tilgjengelighet

* Respekterer `prefers-reduced-motion` – da droppes partikler og rist.
* Trykkflater minst 44 px, alt kan nås med tastatur.
* Tilbakemeldinger gis som tekst, ikke bare farge.
* Fungerer ned til 320 px uten horisontal scrolling.
* Lyd kan slås av begge steder.
