/* =========================================================
   ORDBOK
   Tre lag, i denne rekkefølgen:
     1. SEED   – ~490 vanlige, korte ord. Brukes til rundens
                 startord og til hint, så spillet aldri åpner
                 på et obskurt fagord.
     2. BIG    – hele Norsk Ordbank (bokmål, fullformer) fra
                 Nasjonalbiblioteket/Språkbanken, ~581 000
                 former. Deles med originalversjonen av spillet
                 for å slippe to kopier av samme 7,6 MB fil.
     3. ONLINE – Bokmålsordboka (api.ordbokene.no) som siste
                 utvei for ord ingen av listene kjenner.
   ========================================================= */

const SEED_WORDS_RAW = `
  hus bil katt hund fugl fisk bok stol bord dør
  vindu skole lærer elev venn familie mor far søster bror
  barn mann kvinne gutt jente by land verden konge dronning
  prins prinsesse nabo gjest
  hav sjø elv fjell skog tre blomst gress sol måne
  stjerne himmel sky regn snø vind vinter sommer høst vår
  dag natt morgen kveld time minutt uke måned år klokke
  øy holme fjord kyst brygge havn ørken jungel dal foss
  regnskog
  penn blyant papir bilde farge sekk viskelær linjal saks lim
  tape tavle kritt datamaskin skjerm tastatur mus hodetelefon telefon kamera
  ur radio
  sykkel tog buss fly båt bro vei gate park hage
  anker seil mast ror kompass kart rakett satellitt planet astronaut
  kjøkken bad seng sofa lampe speil teppe gulv tak vegg
  mur stein sand gull sølv veske jakke bukse skjorte genser
  kjole sko lue skjerf belte ring kjede
  mat brød melk ost smør egg kjøtt suppe salat frukt
  eple banan drue potet gulrot løk tomat agurk is kake
  sjokolade kaffe te saft vann sukker salt pepper olje eddik
  kniv gaffel skje tallerken kopp glass flaske boks pose ris
  pasta pizza grøt yoghurt rømme fløte majones ketchup sennep karamell
  vaffel pannekake jordbær bringebær appelsin
  øye øre nese munn hånd fot arm bein hode hjerte
  blod hud hår tann tunge skulder finger negl mage rygg
  albue kne hake panne kinn lår legg
  løve tiger bjørn ulv rev elg hjort rein sau geit
  gris hest ku okse kylling and gås svane ugle kråke
  måke spurv svale stær due papegøye slange padde frosk mus
  rotte ekorn pinnsvin flaggermus delfin hval sel oter mår grevling
  ilder hare kanin ørn
  lege sykepleier tannlege bonde fisker snekker maler elektriker rørlegger politi
  brannmann sjåfør pilot kaptein soldat dommer advokat forfatter journalist fotograf
  kunstner musiker skuespiller danser kokk baker slakter frisør
  løpe hoppe svømme synge danse spille lese skrive tegne male
  bygge lage koke steke bake vaske rydde rengjøre sove våkne
  spise drikke smile le gråte rope hviske snakke lytte høre
  se kikke titte gå kjøre sykle fly seile ro klatre
  falle reise sitte stå ligge tenke huske glemme lære undervise
  forklare spørre svare hjelpe dele gi ta kjøpe selge betale
  spare bruke finne miste lete søke vinne tape kjempe sy
  åpne
  stor liten lang kort bred smal høy lav tung lett
  rask sen varm kald tørr våt ren skitten pen stygg
  glad trist sint redd modig snill slem klok dum sterk
  svak frisk syk rik fattig gammel ung ny grønn blå
  rød gul hvit svart brun rosa lilla oransje ærlig
  gård torg plass bibliotek museum sykehus apotek bank post kirke
  slott tårn tunnel motorvei sti øks åker ål
  mandag tirsdag onsdag torsdag fredag lørdag søndag
  januar februar mars april mai juni juli august september oktober november desember
  fire fem seks sju åtte ni ti elleve tolv tjue hundre tusen
  navn null nord nøkkel nummer nydelig nyte nakke natur nisse
  idrett iskrem innsjø internett invitere ingefær istid
  yoga yr ytterdør
  esel eik enkel edderkopp energi erte
`;

const BIG_WORDLIST_URL = '../ordkjedeverkstedet/ordliste.txt';
const BIG_TIMEOUT_MS = 10000;
const API_URL = 'https://api.ordbokene.no/api/v1/concepts';
const API_TIMEOUT_MS = 4000;

export const norm = (raw) => raw.trim().toLocaleLowerCase('nb-NO');
export const lastLetter = (w) => w.charAt(w.length - 1);
export const upper = (c) => c.toLocaleUpperCase('nb-NO');

export class Dictionary {
  constructor(){
    this.seed = new Set(SEED_WORDS_RAW.trim().split(/\s+/));
    this.seedArr = Array.from(this.seed);
    this.big = new Set();
    this.hintIndex = new Map();
    this.status = 'loading';
    this.seedArr.forEach(w => this._indexHint(w));
  }

  _indexHint(word){
    if(word.length < 3 || word.length > 8) return;
    const key = word[0];
    let arr = this.hintIndex.get(key);
    if(!arr){ arr = []; this.hintIndex.set(key, arr); }
    if(arr.length < 400) arr.push(word);
  }

  /** Laster den store ordlisten. Løser alltid – aldri reject –
      slik at spillet kan starte selv om lista feiler. */
  load(){
    return new Promise((resolve) => {
      let settled = false;
      const finish = (status) => {
        if(settled) return;
        settled = true;
        this.status = status;
        resolve(status);
      };
      const timeoutId = setTimeout(() => finish('error'), BIG_TIMEOUT_MS);

      fetch(BIG_WORDLIST_URL)
        .then(res => { if(!res.ok) throw new Error('http ' + res.status); return res.text(); })
        .then(text => {
          clearTimeout(timeoutId);
          if(settled) return;
          const words = text.split(/\s+/);
          for(let i = 0; i < words.length; i++){
            const w = words[i];
            if(!w) continue;
            this.big.add(w);
            this._indexHint(w);
          }
          finish('ready');
        })
        .catch(() => { clearTimeout(timeoutId); finish('error'); });
    });
  }

  /** Kjent lokalt? (umiddelbart, ingen ventetid) */
  hasLocal(word){ return this.seed.has(word) || this.big.has(word); }

  randomStartWord(){
    return this.seedArr[Math.floor(Math.random() * this.seedArr.length)];
  }

  /** Et brukbart hintord som starter på gitt bokstav. */
  hintFor(letter, used){
    const pool = this.hintIndex.get(letter) || [];
    const candidates = pool.filter(w => !used.has(w));
    if(candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /** Hvor mange ord finnes med denne startbokstaven? Brukes til
      å velge en "snill" bokstav for Bytt-bonusen. */
  countFor(letter){
    const pool = this.hintIndex.get(letter);
    return pool ? pool.length : 0;
  }

  _foundInResponse(data, word){
    if(!data || typeof data !== 'object') return false;
    const w = word.toLocaleLowerCase('nb-NO');
    if(data.a && typeof data.a === 'object'){
      for(const key of Object.keys(data.a)){
        if(key.toLocaleLowerCase('nb-NO') === w){
          const hit = data.a[key];
          if(hit && (!Array.isArray(hit) || hit.length > 0)) return true;
        }
      }
    }
    if(data.articles && data.articles.bm && Object.keys(data.articles.bm).length > 0) return true;
    return false;
  }

  checkOnline(word){
    const url = `${API_URL}?w=${encodeURIComponent(word)}&dict=bm&scope=e`;
    const controller = ('AbortController' in window) ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), API_TIMEOUT_MS) : null;
    return fetch(url, controller ? { signal: controller.signal } : {})
      .then(res => {
        if(timeoutId) clearTimeout(timeoutId);
        if(!res.ok) throw new Error('http ' + res.status);
        return res.json();
      })
      .then(data => this._foundInResponse(data, word));
  }
}
