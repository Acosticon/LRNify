# STATUS – LLM-optimalisering

Oppdrag: [LLM-OPTIMALISERING.md](LLM-OPTIMALISERING.md) · Branch: `llm-optimalisering`

## Fremdrift

| Steg | Status |
|---|---|
| 1. Kartlegging | ✅ Ferdig (24.10.2026). Ingen kode endret. |
| 2. data/katalog.json | ⏳ Neste – venter på svar på åpne spørsmål under |
| 3–7 | Ikke startet |
| 8. Godkjenningstabell | Ikke startet (spør Stig først) |

**Neste steg:** Stig svarer på «Åpne spørsmål». Deretter steg 2.

---

## Steg 1: Funn

### 1.1 Spillkatalogen på forsiden
- Ligger som fire JS-arrayer i `index.html` (ca. linje 638–777): `GAMES` (50), `TEACHER_RESOURCES` (7), `ACTIVITIES` (12), `LEK` (1). Ingen egen .js/.json finnes.
- Felter i dag: `title`, `file`, `category` (fag, f.eks. «Geografi»), `icon`, `color`, `size` (S/M/L), `locked`, `beta`. Ikonene ligger i et eget `ICONS`-objekt (SVG-strenger).
- `renderCards()` tømmer `#grid` og bygger `<a class="card">` med `.art` (BETA-merke, størrelse, bilde fra `media/cards|tools|aktiviteter/{mappe}.png`, ikon som reserve ved `onerror`) og `.label` (tittel + fag).
- Filtrering har tre lag:
  1. **Fane** (Læringsspill / Klasseromsressurser / Aktiviteter / Lek) – bytter hvilken array som vises og endrer `<h1>`.
  2. **Fag-chips** – lages av JS fra `category` i aktiv fane.
  3. **«Vis beta»** – beta er skjult som standard.
- **Låste kort** (8 stk., «Kommer snart»): `href="#"` for vanlige besøkende, ekte lenke for admin (avgjøres asynkront via Firebase-innlogging). 7 av dem har ingen fil i repoet.
- ⚠️ **Fallgruver for «visuelt identisk»:**
  - Kortene vippes ±1° vekselvis etter posisjon *i den filtrerte lista*. Ved vis/skjul av statiske kort må JS fortsatt regne ut vippingen, ellers endrer mønsteret seg.
  - Uten JS vil alle fire faner + beta + låste kort vises på én gang (slik oppdraget ber om). Med JS kan det bli et kort glimt av alle kort før skriptet nederst i `<body>` skjuler dem. Må løses (f.eks. en `js`-klasse på `<html>` i `<head>` som skjuler ikke-aktive kort med CSS fra første tegning).
  - Kortbildene har `alt=""` (tittelen står i teksten under). Beskrivende `alt` endrer ikke utseendet.

### 1.2 «Fra bloggen»
- Henter **kun det nyeste innlegget** fra `/blog/feed.xml` med `fetch` + `DOMParser`. Tom i rå HTML.
- Oppdraget ber om **3** innlegg → det er en synlig endring på forsiden (se åpne spørsmål).
- Feeden er håndskrevet; innleggene har også tittel/dato/ingress i egen HTML + JSON-LD.

### 1.3 JSON-LD (`application/ld+json`)
Bakgrunnen i oppdraget sier «ikke funnet» – det stemmer ikke helt:
- **Forsiden** har én `WebSite`-blokk (med `publisher` som innebygd `Organization`). Ingen `@id`, ingen `ItemList`.
- **Bloggen**: `/blog/` har `Blog`; alle 5 innlegg + `_mal.html` har `BlogPosting` med `author: Organization "LRNify"`.
- **Ingen spill-, verktøy- eller aktivitetssider** har JSON-LD.

### 1.4 Oversikt over sider
71 elementer i katalogen: **29 publisert**, **34 beta**, **8 låst**.

Hovedfunn:
- **Canonical:** Alle 63 sider som har canonical bruker `…/index.html`-form.
- **Sitemap (55 URL-er):** Bruker også `…/index.html`. Mangler `lastmod` på alle unntatt blogginnleggene.
  - **Mangler i sitemap (20 sider som finnes):** Shakespeare-portalen, Tidsarkivet (begge publisert), Dagsformen, Følelsesbildet, Rist Løs (publiserte aktiviteter), 14 beta-spill og låste Feltboka.
  - **I sitemap, men ikke i katalogen:** `games/lopeilden/laerer.html`, `games/lopeilden/kortspill.html`, `games/typisk-beta/laerer.html`.
  - Beta-duplikat: både `typisk` og `typisk-beta` står i sitemap.
- **Shakespeare-portalen** (publisert): mangler description, canonical og og:image, og har `lang="no"`.
- **`lang="no"`** i stedet for `nb`: Shakespeare-portalen, Diplomatiet, `/eliquiz/`, `/quiz.html`.
- **Mangler og:image (16):** bl.a. Tidsarkivet, Følelsesbildet, begge Roblox-sidene og de fleste nye beta-spill (se tabell).
- **Mapper som ikke er i katalogen:** `games/3s1f-beta`, `games/ordkjedeverkstedet-arkade`, `games/sentralmal`, `games/tallsluker`, `games/geografi/europa_land`, samt `/spill/`, `/jens/`, `/loype/`, `/bb/`, `/quiz.html`. Disse røres ikke uten beskjed.
- `/eliquiz/` er sperret i robots.txt og har `noindex`. `/konto/` og `/bruk/` har `noindex`.

### 1.5 Annet som påvirker planen
- **Hele repoet publiseres** (`pages.yml` laster opp `.`). Dermed blir `data/katalog.json`, `scripts/`, `STATUS.md` og `LLM-OPTIMALISERING.md` offentlige på lrnify.no. Ufarlig, men verdt å vite.
- `pages.yml` deployer ved push til `main`. Det finnes ingen PR-sjekk ennå (steg 3.7 legger til en).
- **Agentene i steg 9 finnes ikke** i repoet (ingen `.claude/agents/`). Heller ingen `/avslutt`-kommando i repoet.
- **Firebase:** Forsiden laster `auth/lrnify-auth.js` med konfig for `poll-c6bd2` (lærerinnlogging + admin-sjekk for låste kort). Planen rører ikke dette; JS-filteret må fortsatt kunne låse opp kort for admin.
- 18 sider bruker felles `nav/lrnify-spillhode.js`; 43 sider har `overflow:hidden` (fullskjermspill). Et `<details>` nederst kan da bli usynlig/uklikkbart – må vurderes side for side i steg 4.

---

## Åpne spørsmål (STIG AVGJØR)

1. **Bloggutdrag:** Vise 3 innlegg (oppdraget) eller beholde 1 (forsiden uendret)? Forslag: 1 synlig som i dag, og de 3 nyeste som rene lenker kun i JSON-LD/llms.txt.
2. **Låste kort:** Skal «kommer snart»-kortene ligge i statisk HTML? Forslag: ja som kort (samme utseende), men uten lenke og utenfor llms.txt/JSON-LD/sitemap.
3. **Agentene:** Skal jeg opprette `.claude/agents/` med de åtte rollene fra steg 9, eller bruke generelle underagenter med rollebeskrivelsen i oppgaven?
4. **/avslutt:** Finnes den i ditt eget oppsett? Hvis ikke: skal jeg lage `.claude/commands/avslutt.md`?
5. (Senere, steg 6–7) Forfatternavn på blogginnlegg, mappe-URL for canonical, og beta-duplikater.

---

## Vedlegg: alle elementer i katalogen

#### Læringsspill (51)

| Navn | URL | Status | <title> | meta description | Sitemap | Mangler |
|---|---|---|---|---|---|---|
| Kartografen | /games/geografi/kartografen/ | publisert | Kartografen – hele verden i ett spill | Klikk på riktig fylke eller land på kartet – Norge, Europa, Afrika, Asia, Amerika og Oseania i ett spill. Fylker, land, hovedsteder og flagg, med ledertavle og passbok. | ja | – |
| Shakespeare- portalen | /games/shakespeare/ | publisert | Shakespeare-portalen · LRNify | – | **nei** | description, canonical, og:image, lang=no |
| Tidsarkivet | /games/tidsarkivet/ | publisert | Tidsarkivet – LRNify | Når er dette? Ekte historiske fotografier – din jobb er å datere dem. Spill solo, i duell, eller om Norge. | **nei** | og:image |
| Koblinger | /games/koblinger/ | publisert | Koblinger v0.3 | Velg fire brikker som hører sammen etter én felles regel, i ulike fag og nivåer – et koblingsspill for klasserommet. | ja | – |
| Fotballgloser | /games/fotballgloser/ | publisert | Fotball-gloser | Øv på engelske fotballgloser i en quiz der du velger eller skriver riktig svar, med spillervalg og poengtavle. | ja | – |
| 3 Stemmer, 1 Framtid | /games/3s1f/ | publisert | 3S1F – Tre stemmer, én framtid | Du er leder for en øy i 10 år. Valgene dine påvirker næringslivet, innbyggerne og naturen – og du rekker aldri alt. | ja | – |
| Einsteins gåte | /games/einstein/ | publisert | Mysteriet i Måkeveien | Løs et logikkmysterium i nabolaget Måkeveien ved å tolke vitneutsagn og fylle ut riktig rutenett – en klassisk Einstein-gåte. | ja | – |
| Brøkstigen | /games/brokstigen/ | publisert | Brøkeborgen — Royal Chaos Edition | To riddere avgjør om brøker er likeverdige og klatrer tårnet ved riktig svar – først til toppen redder prinsessen. | ja | – |
| Operasjon frihet | /games/operasjonfrihet/ | publisert | Operasjon Frihet: Motstandskampen | Led den norske motstandskampen 1940–45 som Kompani Linge – svar riktig for å beseire nazister og frigjøre fanger fram mot sluttoppgjøret. | ja | – |
| Wizard Launcher | /games/wizard-launcher/ | låst | – | – | **nei** | fil finnes ikke |
| Marmelade Lane | /games/marmelade-lane/ | låst | – | – | **nei** | fil finnes ikke |
| Hitleroppskytning | /games/hitleroppskytning/ | låst | – | – | **nei** | fil finnes ikke |
| WW2 – Klatringen | /games/ww2-klatringen/ | låst | – | – | **nei** | fil finnes ikke |
| The Stand | /games/the-stand/ | låst | – | – | **nei** | fil finnes ikke |
| Fotball VM | /games/fotball-vm/ | låst | – | – | **nei** | fil finnes ikke |
| Balloon Words | /games/balloon-words/ | låst | – | – | **nei** | fil finnes ikke |
| Glosebilder | /games/myldresprak/ | beta | Myldrespill | Svar på flervalgsspørsmål om et myldrebilde av en by, på norsk eller spansk, og se riktig sted markert i bildet. | ja | – |
| Beinjakten | /games/beinjakten/ | beta | Beinjakten — LRNify | Flytt hunden til riktig koordinat i et koordinatsystem for å grave opp fem bein den har gjemt i hagen. | ja | – |
| Ordkjedeverkstedet | /games/ordkjedeverkstedet/ | beta | Ordkjedeverkstedet | Bygg en ordkjede der hvert nye ord må starte med siste bokstav i forrige ord, mot klokka. | ja | – |
| Ordtoget | /games/ordtoget/ | beta | Ordtoget | Ordtoget – bygg et tog av ord der hver vogn starter med siste bokstav i den forrige. | ja | – |
| Setningskirurgen | /games/setningskirurgen/ | beta | Setningskirurgen | Finn og rett den ene språkfeilen i hver setning, som å skille riktig mellom for eksempel «og» og «å». | ja | – |
| Tidslinjen | /games/tidslinjen/ | beta | Tidslinjen — LRNify | Bygg en historisk tidslinje én hendelse om gangen. Plasser kort fra andre verdenskrig i riktig rekkefølge. | ja | – |
| Vinkeljakten | /games/vinkeljakten/ | beta | Vinkeljakten — LRNify | Dra en arm til riktig vinkel uten å se gradetallet – anslå målvinkelen så presist du kan i 10 oppgaver. | ja | – |
| Vinkelforsvarer | /games/vinkelforsvarer/ | beta | Vinkelforsvarer — LRNify | Sikt en laserkanon mot riktig vinkel for å skyte ned asteroider som truer basen, uten å se gradetallet mens du sikter. | ja | – |
| Vinkelspillet | /games/vinkelspillet/ | beta | Vinkelspillet — LRNify | Sikt en trollmanns stav mot riktig vinkel for å ramme drager som angriper borgen, uten å se gradetallet mens du sikter. | ja | – |
| Likningsbalansen | /games/likningsbalansen/ | beta | Likningsbalansen — LRNify | Løs likninger ved å gjøre samme regneoperasjon på begge sider av en vekt til du finner verdien av x. | ja | – |
| Løpeilden | /games/lopeilden/ | beta | Løpeilden – et spill om desinformasjon | Undervisningsspill for ungdomsskole og videregående. Du sprer et rykte i den oppdiktede kommunen Fagerli – og må avsløre desinformasjon underveis. 20–30 minutter. | ja | – |
| Klimakoden | /games/klimakoden/ | beta | Klimakoden — LRNify | Les et klimadiagram med nedbør og temperatur, og gjett hvilket av fire steder det viser – 8 oppgaver. | ja | – |
| Grafkjøreren | /games/grafkjoreren/ | beta | Grafkjøreren — LRNify | Styr farten på en bil med gass, brems og stopp slik at bevegelsen matcher en gitt strekning–tid-graf. | ja | – |
| Jakten | /games/jakten/ | beta | Relikviejakten – KRLE-detektivspill | Seks stjålne gjenstander fra seks religioner. Finn sporene, slutt deg til hva de brukes til, og send dem hjem – et KRLE-detektivspill. | ja | – |
| Atombyggeren | /games/atombyggeren/ | beta | Atombyggeren — LRNify | Bygg atomer og ioner av protoner, nøytroner og elektroner ut fra grunnstoff, massetall og ladning. | ja | – |
| Sannsynlighetslabben | /games/sannsynlighetslabben/ | beta | Sannsynlighetslabben — LRNify | Forutsi resultatet av tilfeldige forsøk som myntkast, terningkast og kuletrekning, kjør forsøket, og se hvor nær teoretisk sannsynlighet du kom. | ja | – |
| Diplomatiet | /games/diplomatiet/ | beta | Diplomatiet – LRNify | Led en nasjon gjennom seks møter med diplomati, ett naboland om gangen – hver med sin egen spillteori-strategi. Fangens dilemma i praksis. | **nei** | lang=no |
| Fangenes dilemma | /games/fangenes-dilemma/ | beta | Fangenes dilemma – LRNify | Møt fem personer, velg mellom samarbeid og svik, og bygg din egen strategi i dette korte spillet om tillit, svik og Prisoner's Dilemma. | **nei** | og:image |
| Arealarkitekten | /games/arealarkitekten/ | beta | Arealarkitekten — LRNify | Bygg figurer på et rutenett under areal- og omkretskrav, og oppdag at samme areal kan gi svært ulik omkrets. | **nei** | – |
| Typisk! | /games/typisk/ | beta | Typisk! — LRNify | Finn hvilket sentralmål — gjennomsnitt, median eller typetall — som best beskriver et datasett, og avslør når gjennomsnittet gir et misvisende bilde. | ja | – |
| Typisk! beta | /games/typisk-beta/ | beta | Typisk! – finn tallet som beskriver gruppen | Statistikkspill for ungdomstrinnet. Gjennomsnitt, median og typetall på en levende tallinje: se vektstanga velte når uteliggeren kommer, bygg datasett selv og avslør statistikk som er riktig regnet, men misvisende. Kampanje, arkade og dagens sak. | ja | – |
| Formskift | /games/formskift/ | beta | Formskift — LRNify | Flytt, roter og speil en figur på et rutenett til den passer nøyaktig i målfiguren, og oppdag at kongruensavbildninger endrer plassering og retning, men aldri form og størrelse. | ja | – |
| Katteform | /games/katteformer/ | beta | Katteform — LRNify | Flytt, roter og speil søte puslespillkatter til de passer nøyaktig i kattesporet, og oppdag at kongruensavbildninger endrer plassering og retning, men aldri form og størrelse. | **nei** | – |
| Tallbyggeren | /games/tallbyggeren/ | beta | Tallbyggeren — LRNify | Bygg et datasett som oppfyller kravene: gjennomsnitt, median, typetall og variasjonsbredde. 60 oppgaver i seks nivåer, pluss sandkasse. | ja | – |
| Begrepsjakt | /games/begrepsjakt/ | beta | Begrepsjakt — LRNify | Wordle med fagbegreper. Velg hvilken av tre versjoner du vil teste. | **nei** | og:image |
| Ordkryss | /games/ordkryss/ | beta | Ordkryss — LRNify | Ordkryss: sett sammen bokstavbrikker til et minikryssord med to fagord som deler en bokstav, og koble ordene til riktig definisjon. | **nei** | og:image |
| Kryssord | /games/kryssord/ | beta | Kryssord — LRNify | Kryssord: fyll inn fagord vannrett og loddrett ut fra definisjoner. Velg egne ord eller løs et ferdig generert kryssord for hele temaet. | **nei** | og:image |
| Flashcards | /games/flashcards/ | beta | Flashcards — LRNify | Øv på begreper med flashcards – se definisjon, se begrep, koble par eller ta en quiz. Start med cellelære i naturfag. | **nei** | – |
| Hengt mann | /games/hengt-mann/ | beta | Hengt mann — LRNify | Hengt mann: gjett fagbegrepet bokstav for bokstav før figuren er ferdig tegnet. | **nei** | og:image |
| 20 spørsmål | /games/20sporsmal/ | beta | 20 spørsmål — LRNify | 20 spørsmål som læringsspill. Naturfag → Celler: la spillet gjette begrepet du tenker på, eller gjett selv ved å stille spørsmål. | **nei** | og:image |
| Begrepsmatch | /games/begrepsmatch/ | beta | Begrepsmatch — LRNify | Match-3-spill med fagspørsmål. Match brikker, finn nummererte bonusbrikker og svar på spørsmål om celler for å få flere trekk. | **nei** | og:image |
| Begrepsblokk | /games/begrepsblokk/ | beta | Begrepsblokk — LRNify | Block Blast-aktig klossespill med fagspørsmål. Legg klosser i rutenettet og rydd rader og kolonner — svar på spørsmål om celler i stedet for å se reklame. | **nei** | og:image |
| Begrepsrally | /games/begrepsrally/ | beta | Begrepsrally — LRNify | Kappløp om fagbegreper. Velg hvilken av sju fagpakker du vil spille. | **nei** | og:image |
| Celledetektiven | /games/celledetektiven/ | beta | Celledetektiven — LRNify | Finn ut hvor delene av cellen står. Les ledetrådene, bruk det du kan om celler, og resonner deg fram til løsningen. | **nei** | og:image |
| Feltboka | /games/feltboka/ | låst | Feltboka | Mengdetrening i matematikk der riktige svar gir funn av arter fra norsk natur. | **nei** | og:image |

#### Klasseromsressurser (7)

| Navn | URL | Status | <title> | meta description | Sitemap | Mangler |
|---|---|---|---|---|---|---|
| Klassekart | /tools/klassekart/ | publisert | Klassekart – LRNify | Lag et sitteplasskart for klasserommet ut fra elevlisten og regler om hvem som må sitte sammen. | ja | – |
| Velg tilfeldig elev | /tools/elevvelger/ | publisert | Elevvelger – LRNify | Trekk tilfeldige elevnavn fra en liste, enten hvert navn kun én gang eller fritt fra hele klassen hver gang. | ja | – |
| Nedtelling | /tools/nedtelling/ | publisert | Nedtelling – LRNify | Still inn en nedtelling med ferdige tidsintervaller eller egendefinert tid, med lydalarm og fullskjermvisning når tiden er ute. | ja | – |
| Stoppeklokke | /tools/stoppeklokke/ | publisert | Stoppeklokke – LRNify | En enkel stoppeklokke for klasserommet, med start, nullstilling og fullskjermvisning. | ja | – |
| Lydmåler | /tools/lyd/ | publisert | Lydmåler – LRNify | Vis lydnivået i klasserommet i sanntid med en måler og justerbare terskler for advarsel og for høyt støynivå. | ja | – |
| Graftegner | /tools/graftegner/ | publisert | Funksjonsgraf – LRNify | Legg til flere funksjoner, tegn grafene og analyser valgt funksjon i et interaktivt graftegningsverktøy. | ja | – |
| Navnelapper | /tools/navnelapp/ | publisert | Navnelapper | Lag navnelapper til utskrift fra klasselisten, med valgfrie farger og design – klart til skolestart. | ja | – |

#### Aktiviteter (12)

| Navn | URL | Status | <title> | meta description | Sitemap | Mangler |
|---|---|---|---|---|---|---|
| Terningspill | /aktiviteter/terningspill/ | publisert | KRLE TerningSpill — LRNify | Kast terningen i KRLE-timen: lavt tall gir fysisk aktivitet, høyt tall et KRLE-begrep å forklare – spilles i rom med romkode. | ja | – |
| Think pair share | /aktiviteter/tps/ | publisert | Think–Pair–Share – LRNify | Kjør en Think-Pair-Share-økt med spørsmål og tidtaking gjennom fasene tenk selv, del med partner og del med klassen. | ja | – |
| Poll | /aktiviteter/poll/ | publisert | KlassePoll — LRNify | Lag en avstemning med inntil fire svaralternativer, del romkoden med elevene, og se resultatene oppdateres live. | ja | – |
| Genetisk hjul | /aktiviteter/genetikhjul/ | publisert | Genetisk Hjul — LRNify | Kartlegg genetisk variasjon i klassen: hver elev svarer på seks synlige trekk, og tavla viser hvordan klassen fordeler seg. | ja | – |
| Temaspinner | /aktiviteter/temaspinner/ | publisert | Temaspinner — LRNify | Trekk et tilfeldig tema hver elev skal utforske og presentere, via telefon i rom, på tavla, eller alene, med kjapt eller fordypende nivå. | ja | – |
| Tankesky | /aktiviteter/tankesky/ | publisert | Tankesky — LRNify | Felles idémyldring: læreren viser et senterord, elevene sender inn ord fra egne enheter, og tavla fylles live med en ordsky der de mest gjentatte ordene vokser. | ja | – |
| Dagsformen | /aktiviteter/dagsformen/ | publisert | Dagsformen — LRNify | En visuell følelses-innsjekk for klassen: vis figurhjulet i fullskjerm, eller la elevene trykke anonymt på sin egen skjerm og se klassens dagsform vokse frem live. | **nei** | – |
| Følelsesbildet | /aktiviteter/folelsesbildet/ | publisert | Følelsesbildet — LRNify | En lærerstyrt tavleaktivitet: vis klassen ett bilde og utforsk sammen hvilke følelser det kan uttrykke, med fem faste refleksjonsspørsmål. | **nei** | og:image |
| Ville du heller... | /aktiviteter/villeduheller/ | publisert | VILLE DU HELLER? — LRNify | 171 dilemmaer i elleve kategorier som får klassen til å velge og begrunne – en rask oppvarming eller pausefyller. | ja | – |
| Rist Løs | /aktiviteter/ristlos/ | publisert | Rist Løs — LRNify | En samling bevegelsespauser: NRK-videoen Maur i rumpa (velg tilfeldig eller en bestemt episode), bevegelseskort og en ristetimer — kjapt å sette i gang på tavla. | **nei** | – |
| Roblox – la oss se litt nærmere | /aktiviteter/roblox/ | publisert | Roblox – la oss se litt nærmere — LRNify | En aktivitet for en forelder og et barn (7–10 år): forstå bekymringene ved Roblox, utforsk tre oppdiktede situasjoner sammen og snakk om veien videre. | ja | og:image |
| Roblox – la oss se litt nærmere (mobil) | /aktiviteter/roblox-mobil/ | publisert | Roblox – la oss se litt nærmere (mobil) — LRNify | Mobilversjon: en aktivitet for en forelder og et barn (7–10 år). Forstå bekymringene ved Roblox, utforsk tre oppdiktede situasjoner sammen og snakk om veien videre. | ja | og:image |

#### Lek (1)

| Navn | URL | Status | <title> | meta description | Sitemap | Mangler |
|---|---|---|---|---|---|---|
| Straffekonk | /games/straffekonk/ | publisert | STRAFFEKONK 2026 – VM-sluttspillet | Velg landslag og skyt straffer gjennom et 48-lags VM-gruppespill og sluttspill – alt avgjøres fra ellevemeteren. | ja | – |
