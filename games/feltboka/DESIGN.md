# Feltboka — motor og datamodell

Mengdetrening i matematikk der riktige svar gir tilfeldige funn fra
norsk natur. Bygget etter Game Design Document v0.1, med de avvikene
som er notert nederst.

Kjerneloopen er hele spillet:

```
velg tema  →  løs oppgaver  →  progresjon  →  funn  →  tilbake til oppgavene
```

**Arbeidstittelen «Feltboka» er ikke avgjort.** Den står ett sted i koden
(`js/config.js`), og ellers bare i mappenavnet, `<title>`/meta i
`index.html` og i `GAMES`-lista på forsiden.

## Filene

| Fil | Ansvar |
|---|---|
| `js/config.js` | Alle tall som skal kunne justeres: terskel per funn, tidene på funnskjermen, lagringsnøkkel. |
| `js/rational.js` | Eksakte brøker og tolkning av elevsvar. Den ene kilden til sannhet om hva som er riktig. |
| `js/topics/*.js` | Én fil per oppgavetype. Hver eier sine tre vanskelighetsgrader. |
| `js/topics/index.js` | Registeret. Å legge til en syvende oppgavetype er én fil og én linje. |
| `js/engine.js` | Lager én oppgave, retter ett svar. Kjenner ingen temaer ved navn. |
| `js/data/species.js` | De 30 artene. Rene data. |
| `js/data/variants.js` | De seks variantene og andelene deres. |
| `js/draw.js` | Vektet trekning: først art, så variant. |
| `js/progress.js` | Framgang, samling og statistikk i localStorage. Ingen DOM. |
| `js/art.js` | **Plassholder-illustrasjoner.** Erstattes i designprosessen. |
| `css/placeholder.css` | **Plassholder-stil.** Erstattes i designprosessen. |
| `js/main.js` | Spillflaten. Tegner tilstanden, og ingenting annet. |
| `qa/check.mjs` | Kontrollerer generatorene, trekningen og artsdataene. |

Avhengighetene peker én vei: `main.js → progress.js → draw.js → data/`,
og `main.js → engine.js → topics/ → rational.js`. Ingen modul under
`js/` rører DOM-en utenom `main.js` og `art.js`.

## Fem avgjørelser som er verdt å kjenne

**Spillet evaluerer aldri uttrykk.** Hver generator skriver ut
spørsmålet og regner ut svaret hver for seg — det finnes ingen parser i
spillkoden, og ingen `eval`. Prisen er at teksten og fasiten i prinsippet
kan gli fra hverandre; derfor har QA-en sin egen, uavhengige parser som
leser spørsmålsteksten og krever at de to blir enige (se under).

**Løsningen trekkes før likningen bygges.** Likningsgeneratoren velger
`x` først og bygger likningen rundt den. Det garanterer heltallssvar uten
at generatoren må prøve seg fram til noe pent.

**Prosentsatsen velges etter grunntallet.** Motsatt rekkefølge gir
«12 % av 240 = 28,8». Grunntallet trekkes først, og bare satser som går
opp mot akkurat det tallet er med i trekningen. QA-en fanget nettopp
denne feilen første gang den kjørte.

**Et svar godtas på verdi, ikke på form.** `3/8`, `6/16` og `0,375` er
samme tall for `rational.js`. Skal brøkoppgaver kreve forkortet brøk, er
det funksjonen `sammenlign` i `js/rational.js` som må strammes inn — ett
sted, ikke seks generatorer.

**Variantandelene normaliseres per art.** Ti av artene (planter og sopp)
har ikke albino-variant. I stedet for å regne om tabellen for dem,
fordeler trekningen den utelatte andelen på resten. Konsekvensen er at
albino utgjør ca. 3,6 % av alle funn, ikke 6 % — QA-en skriver ut begge
tallene, så avviket ikke kan bli en overraskelse. Samlingen teller
dessuten mot artens egne varianter, så en plante viser `0/5`, ikke `0/6`.

## Lagring, og hvorfor det ikke er innlogging

Samlingen ligger i `localStorage` i elevens egen nettleser. Ingen
pålogging, ingenting sendt ut av maskinen. Det er samme modell som
Ordtoget bruker, og det er i tråd med at LRNify ellers ikke krever
pålogging.

Skjemaet er likevel formet for FEIDE, som er målet på sikt:

```js
{
  v: 1,
  bruker:  { kilde: 'lokal', id: null },   // FEIDE fyller id-en senere
  samling: { artId: { variantId: { antall, forste } } },
  progresjon: { riktigeSidenFunn, ventendeFunn },
  statistikk: { riktige, feilForsok, funn, streak, besteStreak },
  valg: { tema, niva }
}
```

`Framgang.eksporter()` gir samlingen som flate rader —
`{ user_id, species_id, variant, count, first_found }` — altså nøyaktig
formen GDD pkt. 22 beskriver. Når FEIDE kommer, er det et synk-lag oppå
denne metoden, ikke en omskriving av motoren.

Feiler lagringen (privat nettlesermodus), kjører spillet videre uten å
lagre. Ingenting i spillet krever at lagring virker.

**«Oppgaver løst» og «riktige svar» er samme tall.** Siden en oppgave
først regnes som løst når den er riktig (GDD pkt. 17), lagres tallet én
gang, og statistikksiden viser i stedet *oppgaver løst* og *svar sendt
inn* — to tall som faktisk kan skille seg fra hverandre.

## QA

```
node games/feltboka/qa/check.mjs
```

Tre kontroller:

1. **Oppgavene.** Hver generator kjøres 600 ganger per nivå med fast frø.
   For hver oppgave: fasiten må kunne skrives og leses tilbake som samme
   tall, motoren må godta sin egen fasit, og — det viktigste — en
   uavhengig parser i QA-en leser spørsmålsteksten og må komme fram til
   samme svar. Likninger kontrolleres ved å sette inn løsningen på begge
   sider. Prosentoppgavene er ordoppgaver og kan ikke parses; der
   kontrolleres det at svaret er et positivt heltall i samme
   størrelsesorden som tallene i teksten.
2. **Trekningen.** 120 000 trekninger. Artsfordelingen må ligge innenfor
   15 % av vektene, og hver variant må faktisk forekomme.
3. **Dataene.** 30 arter, unike id-er, gyldige vekter og varianter — og
   en opptelling av hvor mange plassholder-fakta som gjenstår.

Siste linje sier `Alt OK.` eller antall feil, og exit-koden følger.

## Avvik fra GDD v0.1

| GDD | Her | Hvorfor |
|---|---|---|
| Pkt. 24/25: brukerinnlogging og profilside | Ingen innlogging. Lokal lagring, og en «nullstill»-knapp på statistikksiden. | Avklart i gjennomgangen: FEIDE er målet på sikt, og fram til da er lokal lagring nok for suksesskriteriet i pkt. 32. |
| Pkt. 24: fire hovedflater | Tre faner (Spill, Samling, Statistikk). | «Profil» hadde ikke noe innhold uten innlogging. |
| Pkt. 7: seks varianter for alle arter | Planter og sopp har fem. | Pkt. 7.3 sier selv at albino bare skal brukes der den gir visuell mening. Hvilke arter det gjelder er en designavgjørelse — lista i `species.js` er logikkens førsteutkast. |
| Pkt. 7.4: «melanistisk» | Heter «Mørk» på planter og sopp. | GDD-ens eget krav om å ikke beskrive planter biologisk feil. |

## Ikke bygget ennå

Illustrasjoner, farger, typografi, animasjon og lyd. Funnskjermen har
ingen animasjon i det hele tatt nå — den viser kortet, venter, og går
tilbake. Se `DESIGNINSTRUKS.md`.

Artsfaktaene er plassholdere, og fire arter er presisert fra gruppenavn
(«ugle» → kattugle) og trenger faglig kontroll. QA-en teller begge deler.
