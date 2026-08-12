# Løpeilden – designnotat

Hvordan spillet ble til: tre konsepter, en vurdering, tre iterasjoner og
begrunnelsen for hvert valg som sitter igjen i den ferdige versjonen.

---

## Oppgaven

Et norsk undervisningsspill om desinformasjon for ungdomsskole og videregående.
20–30 minutters spilletid. Inspirert av at man lærer gjennom simulering, men et
selvstendig opplegg — ikke en oversettelse av noe som finnes.

To krav som trakk i hver sin retning og styrte hele designet:

1. **Elevene skal forstå teknikkene innenfra.** Det er dét som gjør simulering
   bedre enn en forelesning: du kjenner selv hvor fristende det er.
2. **Spillet skal aldri belønne manipulasjon.** Et spill der høy score betyr
   «du løy godt» lærer bort feil ferdighet, uansett hvor god sluttrefleksjonen er.

Hele designarbeidet handler om å få begge deler samtidig.

---

## Tre konsepter

### A – «Redaksjonen»
Eleven er faktasjekker i en skoleavis. Påstander kommer inn, tiden er knapp, og
man må avgjøre hva som publiseres, hva som avkreftes og hva man må undersøke mer.

| | |
|---|---|
| **Styrke** | Null etisk risiko. Trener nøyaktig den ferdigheten vi vil ha. Enkel å differensiere: bare skru på vanskeligheten på påstandene. |
| **Svakhet** | Det er en quiz i kostyme. Eleven får aldri kjenne hvorfor manipulasjon *virker* — bare at den finnes. Uten den følelsen sitter ikke lærdommen. Lavt engasjement: man tar aldri et valg man kjenner på. |

### B – «Kontoen»
Eleven bygger en anonym konto og får den til å vokse. Nye teknikker låses opp
etter hvert som følgertallet stiger.

| | |
|---|---|
| **Styrke** | Umiddelbart engasjerende. Formen er velprøvd, og progresjonen driver spillingen av seg selv. |
| **Svakhet** | For nær forelegget til å være et selvstendig opplegg. Verre: poengsummen *er* manipulasjonen, så eleven bruker 25 minutter på å optimalisere løgn. Konsekvensene blir abstrakte tall. All refleksjon skyves til slutten, der den blir en preken læreren må holde. |

### C – «Ryktet»
Klasseromsspill i sanntid. Halve klassen sprer, halve sjekker, alt skjer live.

| | |
|---|---|
| **Styrke** | Sosialt, minneverdig, høyt engasjement. Gruppearbeid og samarbeid kommer gratis. |
| **Svakhet** | Krever full klasse, god tid og en trygg lærer. Kan ikke spilles alene eller hjemme. Ingen individuell tilbakemelding: en elev som misforsto teknikken, får aldri vite det. Enormt utfallsrom — økta blir like god som den mest frampå eleven i rommet. |

### Vurdering

| | Forstår innenfra | Belønner riktig ferdighet | Engasjement | Kan spilles alene | Robust i klasserom |
|---|---|---|---|---|---|
| A Redaksjonen | ✗ | ✓ | Lavt | ✓ | ✓ |
| B Kontoen | ✓ | ✗ | Høyt | ✓ | ✓ |
| C Ryktet | ✓ | delvis | Høyt | ✗ | ✗ |

Ingen av dem duger alene. **B har den riktige motoren og feil drivstoff.** Valget
ble derfor å bygge videre på B, men bytte ut det som gjør formen problematisk —
og hente inn rollebyttet fra C som en mekanikk i stedet for et klasseromsoppsett.

---

## Iterasjon 1 — rollebyttet flyttes inn i runden

**Første utkast:** to faser. Seks runder der du sprer, deretter seks der du
avslører. Ryddig, og refleksjonen er innebygd.

**Problemet:** all forståelse kommer for sent. Eleven har allerede brukt tjue
minutter på å bli god til å manipulere, og fase to leses som straffen. Det er
nøyaktig den dynamikken vi ville unngå — bare flyttet inn i spillet.

**Endringen:** rollebyttet skjer *inni hver runde*. Runden har tre slag:

1. **Trekket** — du velger hvordan ryktet skyves videre
2. **Ekkoet** — nettverket svarer, og et hendelseskort trekkes
3. **Motgiften** — du bytter stol og skal avsløre samme teknikk i en *annen* sak

Grepet gjør at eleven aldri rekker å bli komfortabel i angriperrollen. Og
motgiften handler bevisst om en annen sak enn den eleven nettopp lagde: da kan
den ikke løses ved å huske hva man selv gjorde, bare ved å kjenne igjen mønsteret.
Det er forskjellen på å huske og å forstå.

---

## Iterasjon 2 — poengsummen skilles fra fortellingen

**Problemet som sto igjen:** spredningsmåleren var fortsatt scoren. Så lenge det
tallet er det største på skjermen, spiller elevene for å øke det.

**Endringen:** fire tall, med et skarpt skille mellom dem.

- **Innsiktspoeng** — den eneste ekte poengsummen. Gis *utelukkende* for å avsløre.
- **Spredning, troverdighet, skade** — fortelling. De beveger seg, de fargelegger
  historien, og de gir ingen poeng.

Skade er den viktigste av de tre, og den er med vilje umulig å «vinne». Den
teller bare oppover, den vises i rødt, og i sluttoppgjøret er den det første
eleven møter etter poengsummen.

Dette står også eksplisitt i spillet og i lærerveiledningen, fordi mekanikken
virker best når elevene vet om den fra starten. Da slutter de å lete etter den
beste måten å lyge på og begynner å lete etter mønsteret.

**Samtidig:** hver eneste runde fikk et ærlig valg. Uten det tvinger spillet
eleven til å manipulere, og et spill som tvinger deg lærer bort at det var
uunngåelig. Det ærlige valget gir alltid dårligere spredning og bedre
troverdighet — og i runde 5 er det det eneste som faktisk reparerer noe.

---

## Iterasjon 3 — konsekvensene får navn, og spillet snus til slutt

Tre funn fra gjennomspilling (en skriptet gjennomkjøring av begge ytterpunktene
— maksimalt manipulerende og maksimalt ærlig spiller):

**1. Skademåleren bunnet ut i runde 5.** Med de opprinnelige tallene traff skade
100 før siste runde, slik at runde 6 — den med størst konsekvens — ikke ga noe
utslag i det hele tatt. Alle skadeverdier ble skalert ned rundt 35 %. Nå lander
den verste gjennomkjøringen på 87, og siste runde teller.

**2. «Skade: 87» skaper ingen ettertanke.** Et tall gjør ikke inntrykk. Derfor
fikk tre oppdiktede personer navn — vaktmester Rune, journalisten Jørgen Lie og
elevrådskandidaten Nora — og hver av dem har tre ulike ettermæler avhengig av hvor
hardt eleven gikk til verks. «Nora byttet klasse. Klippet ligger fortsatt der»
gjør jobben som tallet aldri gjorde.

**3. Spillet endte på feil note.** Siste runde var en manipulasjonsrunde, og da
er det den siste smaken eleven sitter igjen med. Derfor kom **«Nå snur vi
spillet»**: tre poster helt uten valg, der eneste oppgave er å navngi teknikken.
Spillet slutter på den defensive ferdigheten, ikke på fortellingen om ryktet.

I tillegg ble alle merker lagt om. De belønner utelukkende avsløring, aldri
spredning — inkludert *Den som snudde*, som gis for å ha rettet en feil offentlig.

---

## Designvalg som ble stående, og hvorfor

**Alt er oppdiktet.** Kommunen Fagerli, lokalavisa, appene, personene. Elevene
skal lære å kjenne igjen *formen*, ikke pugge en påstand om noe som finnes. Det
fjerner samtidig risikoen for at spillet blir en kilde til desinformasjon om noe
ekte.

**Ingen ekte politikk.** Skolevalget i runde 6 står mellom «Matpauselista» og
«Busslista». Polarisering er lettere å se når saken er lav nok til at ingen i
rommet har et lag fra før.

**Saken er kjedelig og sann.** Ryktet starter i en helt reell hendelse — det
skal settes inn nye låser fordi de gamle er ødelagte. Det er poenget: den
farligste desinformasjonen begynner sjelden med en oppdiktet påstand. Den
begynner med en sann og uinteressant en.

**Hendelseskort.** Ett trekkes hver runde, uten tilbakelegging. De gjør spillet
uforutsigbart, men viktigere: de viser at spredning ikke er noe man styrer.
Eleven setter noe i gang og mister kontrollen over det — inkludert kortet som
gjør at posten lever videre selv om den slettes.

**Delvis riktige svar.** I flere motgifter finnes «nesten»-svar som gir egen
tilbakemelding og lavere trekk enn et bomskudd. Kildekritikk er ikke et
flervalgsspørsmål med ett riktig svar, og spillet burde ikke late som.

**«Bare stille spørsmål» er med som en egen teknikk** (runde 2 og 5). Det er
antagelig det mest brukte grepet elevene møter i praksis, og det som er
vanskeligst å sette ord på — nettopp fordi det formelt sett ikke påstår noe.

**Innholdet ligger i én fil.** `content.js` inneholder alle runder, kort og
tekster. En lærer som vil lage en versjon med saker fra sin egen skole, trenger
ikke røre spillogikken.

---

## Det opplegget ikke løser

- **Poengsummen egner seg ikke til vurdering.** Den måler hvor raskt eleven fant
  riktig svar i seks flervalgsoppgaver. Lærerveiledningen foreslår tre
  vurderingsoppgaver i stedet.
- **Én gjennomspilling er ikke en vaksine.** Forskningen på prebunking peker mot
  at effekten svekkes over tid. Derfor finnes kortspillversjonen — den er ment
  som repetisjon noen uker senere, ikke som et alternativ.
- **Seks teknikker er et utvalg.** Drukning i støy, falsk balanse og
  konspirasjonskobling er utelatt for å holde spilletiden. De er foreslått som
  utvidelsesoppgave for videregående.

---

## Filer

| Fil | Innhold |
|---|---|
| `index.html` | Spillskall og alle skjermer |
| `content.js` | Alt innhold: teknikker, runder, hendelser, merker, refleksjon |
| `game.js` | Tilstand, poeng, regler, lagring |
| `ui.js` | Rendering |
| `main.js` | Kontroller |
| `style.css` | Design |
| `laerer.html` | Lærerveiledning: økter, differensiering, LK20, vurdering |
| `kortspill.html` | Utskriftsvennlig bordversjon med regler og kort |
