# Ordkjedeverkstedet – Arkade

Spillifisert variant av `games/ordkjedeverkstedet/`. Samme grunnmekanikk
(bygg en ordkjede der hvert ord starter med siste bokstav i det forrige),
men med kombo, nivåer, kraftbonuser, effekter og flere spillmoduser.

De to versjonene ligger side om side for A/B-testing.

## Filstruktur

```
ordkjedeverkstedet-arkade/
├── index.html          ← markup
├── css/style.css       ← all styling
└── js/
    ├── main.js         ← kobler sammen spill, lyd, effekter og DOM
    ├── game.js         ← regler, poeng, kombo, nivåer, kraftbonuser
    ├── dictionary.js   ← ordlister og validering
    ├── fx.js           ← canvas-partikkelmotor + skjermrist
    └── audio.js        ← syntetisert lyd (WebAudio, ingen lydfiler)
```

## Viktig: krever webserver

Spillet bruker ES-moduler og `fetch()`. Det må derfor serveres over
http/https – det fungerer **ikke** ved å dobbeltklikke `index.html`
(`file://`). Lokalt kan du kjøre:

```
python3 -m http.server 8000     # fra games/-mappa
```

og åpne `http://localhost:8000/ordkjedeverkstedet-arkade/`.

## Ordlisten deles med originalversjonen

`dictionary.js` laster `../ordkjedeverkstedet/ordliste.txt` – ca. 581 000
bøyningsformer fra Norsk Ordbank (bokmål), Nasjonalbiblioteket/Språkbanken.
Vi holder én kopi av den 7,6 MB store fila i repoet.

**Flytter eller sletter du `games/ordkjedeverkstedet/`, må stien
`BIG_WORDLIST_URL` i `js/dictionary.js` oppdateres.**

Ordgodkjenning skjer i tre lag:

1. `SEED_WORDS` i `dictionary.js` – ~490 vanlige, korte ord. Brukes til
   rundens startord og til hint, så spillet aldri åpner på et fagord.
2. Norsk Ordbank – hovedkilden, sjekkes lokalt uten ventetid.
3. Bokmålsordboka (`api.ordbokene.no`) – siste utvei for ord ingen av
   listene kjenner.

## Spillmoduser

| Modus    | Tid        | Liv | Kommentar                          |
|----------|------------|-----|------------------------------------|
| Klassisk | 20 sek     | –   | Hvert ord gir tid tilbake          |
| Blitz    | 12 sek     | –   | Raskere tidsforbruk, stiger med nivå |
| Maraton  | ingen      | 3   | Feil svar koster et liv            |

## Poeng

```
grunnpoeng = 10 + (ordlengde − 3) × 4
           + 15 hvis ordet slutter på æ ø å y i u o
totalt     = grunnpoeng × kombo × (3 ved gyllen bokstav) × (2 ved Dobbel)
```

Kombo øker ved 3, 6, 10 og 15 riktige på rad (opptil ×5) og nullstilles
ved feil. Nivå stiger hvert 5. ord; i tidsmodusene brenner klokka
raskere for hvert nivå.

## Kraftbonuser

Deles ut ved nivåopprykk og nye kombonivåer, maks 3 av hver. Kan brukes
med museklikk, berøring eller tastene 1–3.

* ❄️ **Frys** – fyller klokka og fryser den i 5 sekunder (ikke i Maraton)
* ⚡ **Dobbel** – neste ord teller dobbelt
* 🔄 **Bytt** – bytter til en lettere bokstav

## Lagring

Rekorder per modus lagres i `localStorage` under nøkkelen
`okv-arkade-best-v1`. Kun tall – ingen persondata. Feiler lagringen
(privat nettlesermodus), fortsetter spillet uten rekorder.

## Tilgjengelighet

* Respekterer `prefers-reduced-motion` – da droppes partikler,
  skjermrist og scanlines.
* Alle kontroller er minst 44 px høye og kan nås med tastatur.
* Tilbakemeldinger gis som tekst, ikke bare farge.
* Fungerer ned til 320 px skjermbredde uten horisontal scrolling.
* Lyd kan slås av både på startskjermen og under spill.
