const FAG = [
  {
    id:'norsk', navn:'Norsk', emoji:'✏️', tone:'language',
    beskrivelse:'Ord, uttrykk og språkforståelse',
    nivaaer:[
      { navn:'Ordklasser', beskrivelse:'Substantiv, verb, adjektiv og preposisjoner', puslespill:{ utvalg:'tilfeldig', ordPerKategori:4, forsok:4,
        grupper:[
          { etikett:'Substantiv', hint:'Se etter ord du kan sette en, ei eller et foran.', forklaring:'Substantiv er navn på ting, personer, steder eller fenomener.', bank:['hus','skole','vindu','jente','gutt','tavle','sekk','blyant','klokke','kjøkken'] },
          { etikett:'Verb', hint:'Se etter ord som forteller hva noen gjør.', forklaring:'Verb forteller om handlinger eller om noe som skjer.', bank:['løpe','hoppe','spise','sove','lese','synge','danse','svømme','klatre','tegne'] },
          { etikett:'Adjektiv', hint:'Se etter ord som kan beskrive et substantiv.', forklaring:'Adjektiv beskriver hvordan noe eller noen er.', bank:['stor','liten','varm','kald','glad','trist','rask','sterk','høy','snill'] },
          { etikett:'Preposisjon', hint:'Se etter små ord som viser plassering eller retning.', forklaring:'Preposisjoner viser forhold mellom ord, ofte plassering eller retning.', bank:['i','på','under','over','bak','foran','ved','mellom','gjennom','mot'] },
        ]
      }},
      { navn:'Synonymer', beskrivelse:'Fire ord som betyr omtrent det samme', puslespill:{ utvalg:'tilfeldig', ordPerKategori:4, forsok:4,
        grupper:[
          { etikett:'Glad', hint:'Alle ordene beskriver en positiv følelse.', forklaring:'Synonymer er ord med lik eller nesten lik betydning.', bank:['glad','lykkelig','fornøyd','blid','munter'] },
          { etikett:'Rask', hint:'Ordene handler om høy fart.', forklaring:'Disse ordene kan brukes om noe eller noen som beveger seg fort.', bank:['rask','hurtig','kjapp','snar','lynrask'] },
          { etikett:'Sint', hint:'Ordene beskriver en sterk negativ følelse.', forklaring:'Disse ordene ligger nær hverandre i betydning, men kan ha litt ulik styrke.', bank:['sint','rasende','irritert','arg','forbannet'] },
          { etikett:'Vanskelig', hint:'Ordene handler om noe som krever mye arbeid.', forklaring:'Synonymer kan variere i stil og styrke, men peker mot samme betydning.', bank:['vanskelig','krevende','vrien','komplisert','utfordrende'] },
        ]
      }},
      { navn:'Sjangerkjennetegn', beskrivelse:'Koble begreper til teksttyper', puslespill:{ utvalg:'fast', ordPerKategori:4, forsok:4,
        grupper:[
          { etikett:'Eventyr', hint:'Se etter klassiske fortellingstrekk.', forklaring:'Eventyr har ofte faste åpninger, magi, prøver og tydelige motsetninger.', bank:['Det var en gang','magi','tre prøver','snipp snapp snute'] },
          { etikett:'Argumenterende tekst', hint:'Ordene handler om å overbevise.', forklaring:'Argumenterende tekster bruker påstand, argumenter og begrunnelser.', bank:['påstand','argument','motargument','konklusjon'] },
          { etikett:'Nyhetsartikkel', hint:'Ordene handler om journalistisk informasjon.', forklaring:'Nyhetsartikler svarer ofte på hvem, hva, hvor, når og hvorfor.', bank:['overskrift','ingress','kilde','brødtekst'] },
          { etikett:'Dikt', hint:'Se etter virkemidler i lyrikk.', forklaring:'Dikt bruker ofte rytme, bilder og konsentrert språk.', bank:['vers','rim','rytme','metafor'] },
        ]
      }}
    ]
  },
  {
    id:'matte', navn:'Matte', emoji:'➕', tone:'math',
    beskrivelse:'Regn, sammenlign og finn like svar',
    nivaaer:[
      { navn:'Pluss og minus', beskrivelse:'Finn uttrykk med samme verdi', puslespill:{ utvalg:'tilfeldig', ordPerKategori:4, forsok:4,
        grupper:[
          { etikett:'= 7', hint:'Regn ut hvert uttrykk og let etter svar 7.', forklaring:'Alle uttrykkene har verdien 7.', bank:['3+4','5+2','9−2','14−7','1+6'] },
          { etikett:'= 10', hint:'Tiervenner kan hjelpe deg her.', forklaring:'Alle uttrykkene har verdien 10.', bank:['6+4','7+3','15−5','12−2','8+2'] },
          { etikett:'= 12', hint:'Let etter uttrykk som lander på 12.', forklaring:'Alle uttrykkene har verdien 12.', bank:['8+4','9+3','20−8','15−3','6+6'] },
          { etikett:'= 15', hint:'Regn ut og sammenlign svarene.', forklaring:'Alle uttrykkene har verdien 15.', bank:['9+6','7+8','20−5','18−3','11+4'] },
        ]
      }},
      { navn:'Gange og dele', beskrivelse:'Multiplikasjon og divisjon', puslespill:{ utvalg:'tilfeldig', ordPerKategori:4, forsok:4,
        grupper:[
          { etikett:'= 6', hint:'Se etter små gangestykker og delestykker.', forklaring:'Alle uttrykkene har verdien 6.', bank:['2×3','12÷2','18÷3','1×6','24÷4'] },
          { etikett:'= 12', hint:'Tenk på 3×4, 2×6 og deling med 2 eller 4.', forklaring:'Alle uttrykkene har verdien 12.', bank:['3×4','2×6','24÷2','48÷4','6×2'] },
          { etikett:'= 18', hint:'Tenk på 2×9 og 3×6.', forklaring:'Alle uttrykkene har verdien 18.', bank:['3×6','2×9','36÷2','9×2','54÷3'] },
          { etikett:'= 24', hint:'Tenk på 4×6 og 3×8.', forklaring:'Alle uttrykkene har verdien 24.', bank:['4×6','3×8','48÷2','6×4','72÷3'] },
        ]
      }},
      { navn:'Likeverdige brøker', beskrivelse:'Ulike brøker, samme verdi', puslespill:{ utvalg:'tilfeldig', ordPerKategori:4, forsok:4,
        grupper:[
          { etikett:'= 1/2', hint:'Teller er halvparten av nevner.', forklaring:'Alle brøkene har samme verdi som en halv.', bank:['1/2','2/4','3/6','4/8','5/10'] },
          { etikett:'= 1/3', hint:'Nevneren er tre ganger så stor som telleren.', forklaring:'Alle brøkene har samme verdi som en tredel.', bank:['1/3','2/6','3/9','4/12'] },
          { etikett:'= 2/3', hint:'Teller er to tredeler av nevner.', forklaring:'Alle brøkene har samme verdi som to tredeler.', bank:['2/3','4/6','6/9','8/12'] },
          { etikett:'= 3/4', hint:'Teller er tre firedeler av nevner.', forklaring:'Alle brøkene har samme verdi som tre firedeler.', bank:['3/4','6/8','9/12','12/16'] },
        ]
      }}
    ]
  },
  {
    id:'naturfag', navn:'Naturfag', emoji:'🌿', tone:'science',
    beskrivelse:'Natur, organismer og systemer',
    nivaaer:[
      { navn:'Næringskjede', beskrivelse:'Roller i et økosystem', puslespill:{ utvalg:'fast', ordPerKategori:4, forsok:4,
        grupper:[
          { etikett:'Produsenter', hint:'Disse lager sin egen næring.', forklaring:'Planter og alger lager sin egen næring gjennom fotosyntese.', bank:['gress','løvetann','tre','alger'] },
          { etikett:'Førsteforbrukere', hint:'Disse spiser ofte planter.', forklaring:'Førsteforbrukere får energi ved å spise produsenter.', bank:['hare','ku','rådyr','elg'] },
          { etikett:'Rovdyr', hint:'Disse jakter på eller spiser andre dyr.', forklaring:'Rovdyr får energi ved å spise andre dyr.', bank:['ulv','gaupe','ørn','oter'] },
          { etikett:'Nedbrytere', hint:'Disse bryter ned dødt materiale.', forklaring:'Nedbrytere gjør næringsstoffer tilgjengelige igjen i naturen.', bank:['sopp','bakterier','meitemark','mugg'] },
        ]
      }},
      { navn:'Kroppen', beskrivelse:'Organer og oppgaver', puslespill:{ utvalg:'fast', ordPerKategori:4, forsok:4,
        grupper:[
          { etikett:'Fordøyelse', hint:'Disse hjelper kroppen å bryte ned mat.', forklaring:'Fordøyelsessystemet bryter ned mat og tar opp næring.', bank:['munn','magesekk','tynntarm','tykktarm'] },
          { etikett:'Sirkulasjon', hint:'Disse handler om blod og transport.', forklaring:'Sirkulasjonssystemet frakter oksygen og næringsstoffer rundt i kroppen.', bank:['hjerte','blod','blodårer','puls'] },
          { etikett:'Sansene', hint:'Disse hjelper oss å oppfatte verden.', forklaring:'Sansene samler informasjon fra omgivelsene.', bank:['øye','øre','nese','hud'] },
          { etikett:'Skjelett', hint:'Disse handler om støtte og bevegelse.', forklaring:'Skjelettet støtter kroppen og beskytter viktige organer.', bank:['knokkel','ledd','ribbein','hodeskalle'] },
        ]
      }}
    ]
  },
  {
    id:'krle', navn:'KRLE', emoji:'🕊️', tone:'culture',
    beskrivelse:'Religioner, symboler og begreper',
    nivaaer:[
      { navn:'Religioner', beskrivelse:'Begreper og symboler', puslespill:{ utvalg:'fast', ordPerKategori:4, forsok:4,
        grupper:[
          { etikett:'Kristendom', hint:'Se etter kirke, Bibelen og kristne ritualer.', forklaring:'Begreper og symboler knyttet til kristendom.', bank:['Bibelen','korset','kirke','dåp'] },
          { etikett:'Islam', hint:'Se etter Koranen, Mekka og muslimske praksiser.', forklaring:'Begreper og steder knyttet til islam.', bank:['Koranen','Mekka','moské','ramadan'] },
          { etikett:'Jødedom', hint:'Se etter Toraen, synagoge og jødiske tradisjoner.', forklaring:'Begreper og symboler knyttet til jødedom.', bank:['Toraen','synagoge','sabbat','kippa'] },
          { etikett:'Buddhisme', hint:'Se etter Buddha og buddhistiske symboler.', forklaring:'Begreper og symboler knyttet til buddhisme.', bank:['Buddha','nirvana','dharmahjul','lotus'] },
        ]
      }},
      { navn:'Etikk', beskrivelse:'Verdier, valg og ansvar', puslespill:{ utvalg:'fast', ordPerKategori:4, forsok:4,
        grupper:[
          { etikett:'Rettferdighet', hint:'Ordene handler om lik behandling og rimelige valg.', forklaring:'Rettferdighet handler om hva som er rimelig og riktig for flere parter.', bank:['likhet','rettighet','regel','ansvar'] },
          { etikett:'Omsorg', hint:'Ordene handler om å ta vare på andre.', forklaring:'Omsorg viser seg i handlinger som hjelper eller støtter andre.', bank:['hjelpe','trøste','lytte','dele'] },
          { etikett:'Dilemma', hint:'Ordene handler om vanskelige valg.', forklaring:'Et dilemma er en situasjon der flere hensyn trekker i ulike retninger.', bank:['valg','konflikt','konsekvens','avveining'] },
          { etikett:'Respekt', hint:'Ordene handler om hvordan vi møter andre mennesker.', forklaring:'Respekt handler om å anerkjenne andres verdi, grenser og perspektiver.', bank:['toleranse','verdighet','hensyn','dialog'] },
        ]
      }}
    ]
  }
];

const GRAD_FARGER = ['var(--level-1)','var(--level-2)','var(--level-3)','var(--level-4)'];
