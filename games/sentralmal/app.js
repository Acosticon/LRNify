
const CAMPAIGN = [{"id": "1-01", "level": 1, "title": "Finn midten", "count": 3, "min": 0, "max": 10, "requirements": {"median": 5}, "constraints": {}, "lockedValues": [], "start": [2, 4, 8], "prompt": "Lag 3 tall med median 5.", "hints": ["Sorter tallene. Hvilket tall må stå i midten?", "Med tre tall er medianen tallet i midten."]}, {"id": "1-02", "level": 1, "title": "Fra minste til største", "count": 3, "min": 0, "max": 12, "requirements": {"range": 6}, "constraints": {}, "lockedValues": [], "start": [2, 5, 7], "prompt": "Lag 3 tall med variasjonsbredde 6.", "hints": ["Variasjonsbredden bruker bare største og minste tall.", "Største tall minus minste tall skal bli 6."]}, {"id": "1-03", "level": 1, "title": "Bygg en sum", "count": 3, "min": 0, "max": 10, "requirements": {"mean": 5}, "constraints": {}, "lockedValues": [], "start": [2, 5, 6], "prompt": "Lag 3 tall med gjennomsnitt 5.", "hints": ["Tre tall med gjennomsnitt 5 må ha sum 15.", "Se på summen av tallene dine."]}, {"id": "1-04", "level": 1, "title": "Fire tall", "count": 4, "min": 0, "max": 12, "requirements": {"mean": 6}, "constraints": {}, "lockedValues": [], "start": [2, 4, 8, 9], "prompt": "Lag 4 tall med gjennomsnitt 6.", "hints": ["Fire tall med gjennomsnitt 6 må ha sum 24.", "Hvor langt er summen din fra 24?"]}, {"id": "1-05", "level": 1, "title": "Median med fem", "count": 5, "min": 0, "max": 14, "requirements": {"median": 7}, "constraints": {}, "lockedValues": [], "start": [2, 5, 6, 9, 11], "prompt": "Lag 5 tall med median 7.", "hints": ["Når fem tall er sortert, er medianen det tredje tallet.", "Prøv å få 7 inn som det midterste tallet."]}, {"id": "1-06", "level": 1, "title": "Et tall som går igjen", "count": 4, "min": 0, "max": 10, "requirements": {"mode": 3}, "constraints": {}, "lockedValues": [], "start": [1, 3, 5, 7], "prompt": "Lag 4 tall med typetall 3.", "hints": ["Typetallet må forekomme oftere enn alle andre tall.", "La 3 dukke opp mer enn én gang."]}, {"id": "1-07", "level": 1, "title": "Strekk datasettet", "count": 5, "min": 0, "max": 14, "requirements": {"range": 8}, "constraints": {}, "lockedValues": [], "start": [2, 4, 6, 7, 9], "prompt": "Lag 5 tall med variasjonsbredde 8.", "hints": ["Se bare på ytterpunktene.", "Forskjellen mellom største og minste tall skal være 8."]}, {"id": "1-08", "level": 1, "title": "Fem tall, ett mål", "count": 5, "min": 0, "max": 12, "requirements": {"mean": 6}, "constraints": {}, "lockedValues": [], "start": [2, 4, 6, 8, 9], "prompt": "Lag 5 tall med gjennomsnitt 6.", "hints": ["Fem tall med gjennomsnitt 6 må ha sum 30.", "Finn summen du har nå, og juster derfra."]}, {"id": "1-09", "level": 1, "title": "Typetall med seks", "count": 6, "min": 0, "max": 10, "requirements": {"mode": 4}, "constraints": {}, "lockedValues": [], "start": [1, 2, 4, 5, 7, 8], "prompt": "Lag 6 tall med typetall 4.", "hints": ["4 må forekomme oftere enn hvert annet tall.", "Pass på at du ikke lager et annet tall som forekommer like ofte."]}, {"id": "1-10", "level": 1, "title": "Nivåboss", "count": 6, "min": 0, "max": 15, "requirements": {"mean": 8}, "constraints": {}, "lockedValues": [], "start": [3, 5, 7, 9, 10, 12], "prompt": "Lag 6 tall med gjennomsnitt 8.", "hints": ["Seks tall med gjennomsnitt 8 må ha sum 48.", "Bruk flere tall samtidig hvis du må flytte summen mye."]}, {"id": "2-01", "level": 2, "title": "Et tall er låst", "count": 4, "min": 0, "max": 12, "requirements": {"mean": 6}, "constraints": {}, "lockedValues": [{"position": 0, "value": 3}], "start": [3, 4, 7, 8], "prompt": "Lag 4 tall med gjennomsnitt 6. Tallet 3 er låst.", "hints": ["Summen må bli 24.", "Når 3 allerede er brukt, må de tre andre tallene til sammen bli 21."]}, {"id": "2-02", "level": 2, "title": "Må inneholde 9", "count": 5, "min": 0, "max": 12, "requirements": {"median": 6}, "constraints": {"mustInclude": [9]}, "lockedValues": [], "start": [2, 4, 5, 7, 9], "prompt": "Lag 5 tall med median 6. Datasettet må inneholde 9.", "hints": ["Med fem tall er medianen det tredje tallet.", "9 kan ligge over medianen uten å endre den."]}, {"id": "2-03", "level": 2, "title": "Uten 5", "count": 4, "min": 0, "max": 10, "requirements": {"mode": 3}, "constraints": {"mustNotInclude": [5]}, "lockedValues": [], "start": [1, 3, 5, 7], "prompt": "Lag 4 tall med typetall 3. Du kan ikke bruke 5.", "hints": ["3 må gå igjen.", "Bytt først ut tallet som er forbudt."]}, {"id": "2-04", "level": 2, "title": "Innenfor rammen", "count": 4, "min": 3, "max": 10, "requirements": {"range": 7}, "constraints": {}, "lockedValues": [], "start": [4, 5, 7, 9], "prompt": "Lag 4 tall med variasjonsbredde 7. Alle tall må være mellom 3 og 10.", "hints": ["For å få variasjonsbredde 7 innenfor dette området må ytterpunktene være svært bestemte.", "Hva er 10 − 3?"]}, {"id": "2-05", "level": 2, "title": "To låste tall", "count": 5, "min": 0, "max": 12, "requirements": {"median": 6}, "constraints": {}, "lockedValues": [{"position": 0, "value": 2}, {"position": 4, "value": 10}], "start": [2, 4, 5, 8, 10], "prompt": "Lag 5 tall med median 6. Tallene 2 og 10 er låst.", "hints": ["Medianen er det tredje tallet etter sortering.", "De låste ytterpunktene bestemmer ikke medianen."]}, {"id": "2-06", "level": 2, "title": "Må inneholde 10", "count": 4, "min": 0, "max": 12, "requirements": {"mean": 7}, "constraints": {"mustInclude": [10]}, "lockedValues": [], "start": [2, 5, 8, 10], "prompt": "Lag 4 tall med gjennomsnitt 7. Datasettet må inneholde 10.", "hints": ["Summen må være 28.", "Når ett av tallene er 10, må de tre andre til sammen bli 18."]}, {"id": "2-07", "level": 2, "title": "Alle ulike", "count": 5, "min": 0, "max": 12, "requirements": {"median": 6}, "constraints": {"allUnique": true}, "lockedValues": [], "start": [2, 4, 6, 6, 10], "prompt": "Lag 5 ulike tall med median 6.", "hints": ["Du kan bare bruke hvert tall én gang.", "6 må fortsatt være det tredje tallet etter sortering."]}, {"id": "2-08", "level": 2, "title": "Nøyaktig to firere", "count": 5, "min": 0, "max": 10, "requirements": {"mode": 4}, "constraints": {"occurrences": {"4": 2}}, "lockedValues": [], "start": [1, 4, 4, 6, 8], "prompt": "Lag 5 tall med typetall 4. Tallet 4 skal brukes nøyaktig to ganger.", "hints": ["Ingen annen verdi kan forekomme to ganger.", "De tre andre tallene bør derfor være forskjellige."]}, {"id": "2-09", "level": 2, "title": "Forbudt ytterpunkt", "count": 5, "min": 0, "max": 12, "requirements": {"range": 8}, "constraints": {"mustNotInclude": [8]}, "lockedValues": [], "start": [1, 4, 6, 8, 9], "prompt": "Lag 5 tall med variasjonsbredde 8. Du kan ikke bruke tallet 8.", "hints": ["Fjern først det forbudte tallet.", "Variasjonsbredden bestemmes fortsatt bare av minste og største verdi."]}, {"id": "2-10", "level": 2, "title": "Nivåboss", "count": 5, "min": 0, "max": 12, "requirements": {"mean": 6}, "constraints": {"mustInclude": [10], "mustNotInclude": [6]}, "lockedValues": [], "start": [2, 4, 6, 8, 10], "prompt": "Lag 5 tall med gjennomsnitt 6. Du må bruke 10, men du kan ikke bruke 6.", "hints": ["Summen må bli 30.", "10 er allerede bestemt. De fire andre må til sammen bli 20."]}, {"id": "3-01", "level": 3, "title": "Midt og spenn", "count": 3, "min": 0, "max": 12, "requirements": {"median": 5, "range": 6}, "constraints": {}, "lockedValues": [], "start": [2, 5, 7], "prompt": "Lag 3 tall med median 5 og variasjonsbredde 6.", "hints": ["Medianen bestemmer midttallet.", "Deretter må ytterpunktene ha forskjell 6."]}, {"id": "3-02", "level": 3, "title": "Fem tall, to mål", "count": 5, "min": 0, "max": 14, "requirements": {"median": 6, "range": 8}, "constraints": {}, "lockedValues": [], "start": [2, 4, 6, 8, 9], "prompt": "Lag 5 tall med median 6 og variasjonsbredde 8.", "hints": ["Få først 6 til å ligge i midten.", "Juster så minste eller største tall til forskjellen blir 8."]}, {"id": "3-03", "level": 3, "title": "Sum og spenn", "count": 4, "min": 0, "max": 12, "requirements": {"mean": 6, "range": 8}, "constraints": {}, "lockedValues": [], "start": [2, 4, 7, 9], "prompt": "Lag 4 tall med gjennomsnitt 6 og variasjonsbredde 8.", "hints": ["Summen må bli 24.", "Samtidig skal største minus minste være 8."]}, {"id": "3-04", "level": 3, "title": "Lik midt og snitt", "count": 5, "min": 0, "max": 12, "requirements": {"mean": 6, "median": 6}, "constraints": {}, "lockedValues": [], "start": [2, 4, 6, 7, 10], "prompt": "Lag 5 tall med både gjennomsnitt og median 6.", "hints": ["Medianen bestemmer det tredje tallet.", "Gjennomsnittet krever at summen er 30."]}, {"id": "3-05", "level": 3, "title": "Ulik midt og snitt", "count": 5, "min": 0, "max": 16, "requirements": {"mean": 7, "median": 5}, "constraints": {}, "lockedValues": [], "start": [2, 4, 5, 8, 12], "prompt": "Lag 5 tall med gjennomsnitt 7 og median 5.", "hints": ["Summen må bli 35.", "Medianen kan være 5 selv om et stort tall trekker gjennomsnittet opp."]}, {"id": "3-06", "level": 3, "title": "Snitt og typetall", "count": 5, "min": 0, "max": 12, "requirements": {"mean": 6, "mode": 4}, "constraints": {}, "lockedValues": [], "start": [2, 4, 4, 8, 10], "prompt": "Lag 5 tall med gjennomsnitt 6 og typetall 4.", "hints": ["Summen må bli 30.", "4 må samtidig forekomme oftere enn alle andre verdier."]}, {"id": "3-07", "level": 3, "title": "Median og typetall", "count": 5, "min": 0, "max": 10, "requirements": {"median": 5, "mode": 3}, "constraints": {}, "lockedValues": [], "start": [2, 3, 5, 7, 8], "prompt": "Lag 5 tall med median 5 og typetall 3.", "hints": ["5 må være i midten etter sortering.", "3 må gjentas, men medianen må fortsatt bli 5."]}, {"id": "3-08", "level": 3, "title": "Spenn og typetall", "count": 6, "min": 0, "max": 12, "requirements": {"range": 9, "mode": 4}, "constraints": {}, "lockedValues": [], "start": [1, 4, 4, 6, 7, 9], "prompt": "Lag 6 tall med variasjonsbredde 9 og typetall 4.", "hints": ["4 må være vanligst.", "Samtidig må største og minste verdi ha forskjell 9."]}, {"id": "3-09", "level": 3, "title": "Trangere rom", "count": 5, "min": 2, "max": 10, "requirements": {"mean": 6, "median": 6}, "constraints": {"allUnique": true}, "lockedValues": [], "start": [2, 4, 6, 8, 10], "prompt": "Lag 5 ulike tall mellom 2 og 10 med gjennomsnitt 6 og median 6.", "hints": ["Summen må være 30.", "Tallene må være ulike, og 6 må være midtverdien."]}, {"id": "3-10", "level": 3, "title": "Nivåboss", "count": 6, "min": 0, "max": 14, "requirements": {"mean": 7, "range": 10}, "constraints": {}, "lockedValues": [], "start": [2, 4, 6, 8, 10, 12], "prompt": "Lag 6 tall med gjennomsnitt 7 og variasjonsbredde 10.", "hints": ["Summen må bli 42.", "Finn først to ytterpunkter med forskjell 10, og balanser deretter summen."]}, {"id": "4-01", "level": 4, "title": "To mål + låst tall", "count": 5, "min": 0, "max": 14, "requirements": {"median": 6, "range": 8}, "constraints": {}, "lockedValues": [{"position": 0, "value": 2}], "start": [2, 4, 5, 8, 10], "prompt": "Lag 5 tall med median 6 og variasjonsbredde 8. Tallet 2 er låst.", "hints": ["Med minste verdi 2 må største verdi være 10 for å få spenn 8.", "Medianen skal fortsatt bli 6."]}, {"id": "4-02", "level": 4, "title": "Snitt uten snitt-tallet", "count": 5, "min": 0, "max": 14, "requirements": {"mean": 6, "median": 5}, "constraints": {"mustNotInclude": [6]}, "lockedValues": [], "start": [2, 4, 5, 8, 11], "prompt": "Lag 5 tall med gjennomsnitt 6 og median 5. Du kan ikke bruke 6.", "hints": ["Summen må bli 30.", "Medianen trenger ikke være lik gjennomsnittet."]}, {"id": "4-03", "level": 4, "title": "Typetall med krav", "count": 6, "min": 0, "max": 12, "requirements": {"mode": 4, "range": 9}, "constraints": {"mustInclude": [10]}, "lockedValues": [], "start": [1, 4, 4, 6, 8, 10], "prompt": "Lag 6 tall med typetall 4 og variasjonsbredde 9. Datasettet må inneholde 10.", "hints": ["Hvis 10 er største verdi, hva må minste være?", "Pass samtidig på at 4 er den eneste vanligste verdien."]}, {"id": "4-04", "level": 4, "title": "Alle ulike", "count": 5, "min": 0, "max": 12, "requirements": {"mean": 6, "range": 8}, "constraints": {"allUnique": true}, "lockedValues": [], "start": [2, 4, 6, 8, 10], "prompt": "Lag 5 ulike tall med gjennomsnitt 6 og variasjonsbredde 8.", "hints": ["Summen skal være 30.", "Ytterpunktene skal ha forskjell 8, og ingen tall kan gjentas."]}, {"id": "4-05", "level": 4, "title": "Må inneholde 11", "count": 5, "min": 0, "max": 14, "requirements": {"mean": 7, "median": 6}, "constraints": {"mustInclude": [11]}, "lockedValues": [], "start": [2, 5, 6, 9, 11], "prompt": "Lag 5 tall med gjennomsnitt 7 og median 6. Du må bruke 11.", "hints": ["Summen skal bli 35.", "11 kan trekke snittet opp uten å endre medianen."]}, {"id": "4-06", "level": 4, "title": "Nøyaktig to femmere", "count": 6, "min": 0, "max": 12, "requirements": {"mode": 5, "mean": 6}, "constraints": {"occurrences": {"5": 2}}, "lockedValues": [], "start": [2, 5, 5, 7, 8, 9], "prompt": "Lag 6 tall med typetall 5 og gjennomsnitt 6. Tallet 5 skal brukes nøyaktig to ganger.", "hints": ["Summen må bli 36.", "Ingen annen verdi kan brukes to ganger, ellers mister 5 rollen som eneste typetall."]}, {"id": "4-07", "level": 4, "title": "Låste ytterpunkter", "count": 5, "min": 0, "max": 12, "requirements": {"median": 6, "mean": 6}, "constraints": {}, "lockedValues": [{"position": 0, "value": 2}, {"position": 4, "value": 10}], "start": [2, 4, 6, 8, 10], "prompt": "Lag 5 tall med median 6 og gjennomsnitt 6. Tallene 2 og 10 er låst.", "hints": ["Summen må bli 30.", "De tre midterste tallene må derfor summere til 18."]}, {"id": "4-08", "level": 4, "title": "Forbudt typetall-nabo", "count": 5, "min": 0, "max": 10, "requirements": {"median": 5, "mode": 4}, "constraints": {"mustNotInclude": [6]}, "lockedValues": [], "start": [2, 4, 4, 5, 7], "prompt": "Lag 5 tall med median 5 og typetall 4. Du kan ikke bruke 6.", "hints": ["4 må gjentas.", "Etter sortering må det tredje tallet fortsatt være 5."]}, {"id": "4-09", "level": 4, "title": "Tre låste posisjoner", "count": 6, "min": 0, "max": 14, "requirements": {"mean": 7, "range": 10}, "constraints": {}, "lockedValues": [{"position": 0, "value": 2}, {"position": 2, "value": 6}, {"position": 5, "value": 12}], "start": [2, 4, 6, 8, 10, 12], "prompt": "Lag 6 tall med gjennomsnitt 7 og variasjonsbredde 10. Tre tall er låst.", "hints": ["Ytterpunktene 2 og 12 gir allerede riktig variasjonsbredde.", "Nå handler resten om å få summen til 42."]}, {"id": "4-10", "level": 4, "title": "Nivåboss", "count": 6, "min": 0, "max": 14, "requirements": {"mean": 7, "median": 6}, "constraints": {"mustInclude": [12], "mustNotInclude": [7]}, "lockedValues": [], "start": [2, 4, 6, 8, 10, 12], "prompt": "Lag 6 tall med gjennomsnitt 7 og median 6. Du må bruke 12, men ikke 7.", "hints": ["Summen skal bli 42.", "Med seks tall er medianen gjennomsnittet av de to midterste tallene."]}, {"id": "5-01", "level": 5, "title": "Tre mål", "count": 5, "min": 0, "max": 14, "requirements": {"mean": 6, "median": 6, "range": 8}, "constraints": {}, "lockedValues": [], "start": [2, 4, 6, 8, 10], "prompt": "Lag 5 tall med gjennomsnitt 6, median 6 og variasjonsbredde 8.", "hints": ["Summen skal være 30.", "Få først median og ytterpunkter på plass, og balanser summen til slutt."]}, {"id": "5-02", "level": 5, "title": "Typetall inn i miksen", "count": 5, "min": 0, "max": 12, "requirements": {"mean": 5, "median": 4, "mode": 4}, "constraints": {}, "lockedValues": [], "start": [2, 4, 4, 6, 9], "prompt": "Lag 5 tall med gjennomsnitt 5, median 4 og typetall 4.", "hints": ["Summen skal være 25.", "Hvis 4 gjentas, kan det både bli typetall og bidra til medianen."]}, {"id": "5-03", "level": 5, "title": "Tre mål + låst", "count": 5, "min": 0, "max": 14, "requirements": {"mean": 7, "median": 6, "range": 10}, "constraints": {}, "lockedValues": [{"position": 4, "value": 12}], "start": [2, 5, 6, 10, 12], "prompt": "Lag 5 tall med gjennomsnitt 7, median 6 og variasjonsbredde 10. Tallet 12 er låst.", "hints": ["Hvis 12 er største verdi, må minste være 2.", "Summen skal bli 35."]}, {"id": "5-04", "level": 5, "title": "Typetall og spenn", "count": 6, "min": 0, "max": 12, "requirements": {"mean": 6, "mode": 4, "range": 9}, "constraints": {}, "lockedValues": [], "start": [1, 4, 4, 7, 9, 11], "prompt": "Lag 6 tall med gjennomsnitt 6, typetall 4 og variasjonsbredde 9.", "hints": ["Summen skal være 36.", "4 må være vanligst, og ytterpunktene skal ha forskjell 9."]}, {"id": "5-05", "level": 5, "title": "Fire krav", "count": 5, "min": 0, "max": 12, "requirements": {"mean": 5, "median": 5, "mode": 5, "range": 8}, "constraints": {}, "lockedValues": [], "start": [1, 5, 5, 6, 9], "prompt": "Lag 5 tall med gjennomsnitt 5, median 5, typetall 5 og variasjonsbredde 8.", "hints": ["Summen skal være 25.", "5 bør gjentas og ligge i midten. Ytterpunktene må ha forskjell 8."]}, {"id": "5-06", "level": 5, "title": "Tre mål uten 6", "count": 6, "min": 0, "max": 14, "requirements": {"mean": 7, "median": 7, "range": 10}, "constraints": {"mustNotInclude": [6]}, "lockedValues": [], "start": [2, 4, 7, 7, 10, 12], "prompt": "Lag 6 tall med gjennomsnitt 7, median 7 og variasjonsbredde 10. Du kan ikke bruke 6.", "hints": ["Summen skal bli 42.", "Med seks tall må de to midterste ha gjennomsnitt 7."]}, {"id": "5-07", "level": 5, "title": "Må inneholde 13", "count": 6, "min": 0, "max": 14, "requirements": {"mean": 7, "median": 6, "range": 11}, "constraints": {"mustInclude": [13]}, "lockedValues": [], "start": [2, 4, 6, 6, 11, 13], "prompt": "Lag 6 tall med gjennomsnitt 7, median 6 og variasjonsbredde 11. Du må bruke 13.", "hints": ["Hvis 13 er største verdi, må minste være 2.", "Summen skal bli 42."]}, {"id": "5-08", "level": 5, "title": "Typetall nøyaktig to ganger", "count": 6, "min": 0, "max": 12, "requirements": {"mean": 6, "median": 5, "mode": 4}, "constraints": {"occurrences": {"4": 2}}, "lockedValues": [], "start": [2, 4, 4, 6, 9, 11], "prompt": "Lag 6 tall med gjennomsnitt 6, median 5 og typetall 4. Tallet 4 skal brukes nøyaktig to ganger.", "hints": ["Summen skal bli 36.", "For median 5 må de to midterste tallene ha gjennomsnitt 5."]}, {"id": "5-09", "level": 5, "title": "Alle ulike, tre mål", "count": 5, "min": 0, "max": 12, "requirements": {"mean": 6, "median": 6, "range": 10}, "constraints": {"allUnique": true}, "lockedValues": [], "start": [1, 4, 6, 8, 11], "prompt": "Lag 5 ulike tall med gjennomsnitt 6, median 6 og variasjonsbredde 10.", "hints": ["Summen skal være 30.", "Ytterpunktene må ha forskjell 10, og det tredje tallet må være 6."]}, {"id": "5-10", "level": 5, "title": "Nivåboss", "count": 7, "min": 0, "max": 15, "requirements": {"mean": 7, "median": 6, "mode": 5, "range": 12}, "constraints": {}, "lockedValues": [], "start": [1, 4, 5, 5, 7, 10, 13], "prompt": "Lag 7 tall med gjennomsnitt 7, median 6, typetall 5 og variasjonsbredde 12.", "hints": ["Summen skal være 49.", "5 må være vanligst, 6 må være fjerde tall etter sortering, og ytterpunktene må ha forskjell 12."]}, {"id": "6-01", "level": 6, "title": "Finn to løsninger", "count": 5, "min": 0, "max": 12, "requirements": {"mean": 6, "median": 6}, "constraints": {}, "lockedValues": [], "requiredSolutions": 2, "start": [2, 4, 6, 8, 10], "prompt": "Lag 5 tall med gjennomsnitt 6 og median 6. Finn to ulike løsninger.", "hints": ["Summen skal bli 30.", "Når du har én løsning, må den neste ha en annen sortert tallkombinasjon."]}, {"id": "6-02", "level": 6, "title": "To løsninger med spenn", "count": 5, "min": 0, "max": 14, "requirements": {"median": 6, "range": 8}, "constraints": {"mustInclude": [2]}, "lockedValues": [], "requiredSolutions": 2, "start": [2, 4, 6, 8, 10], "prompt": "Lag 5 tall med median 6 og variasjonsbredde 8. Du må bruke 2. Finn to løsninger.", "hints": ["Hvis 2 er minste verdi, må største være 10.", "Det finnes flere måter å velge de to andre tallene på."]}, {"id": "6-03", "level": 6, "title": "Tre krav, to svar", "count": 5, "min": 0, "max": 14, "requirements": {"mean": 6, "median": 6, "range": 8}, "constraints": {}, "lockedValues": [], "requiredSolutions": 2, "start": [2, 4, 6, 8, 10], "prompt": "Lag 5 tall med gjennomsnitt 6, median 6 og variasjonsbredde 8. Finn to løsninger.", "hints": ["Summen må være 30.", "Ytterpunktene må ha forskjell 8, men de indre tallene kan variere."]}, {"id": "6-04", "level": 6, "title": "Typetall, to svar", "count": 6, "min": 0, "max": 12, "requirements": {"mean": 6, "mode": 4}, "constraints": {"occurrences": {"4": 2}}, "lockedValues": [], "requiredSolutions": 2, "start": [2, 4, 4, 7, 9, 10], "prompt": "Lag 6 tall med gjennomsnitt 6 og typetall 4. Bruk 4 nøyaktig to ganger. Finn to løsninger.", "hints": ["Summen må være 36.", "De fire andre tallene må være forskjellige og kan fordeles på flere måter."]}, {"id": "6-05", "level": 6, "title": "Fire krav", "count": 5, "min": 0, "max": 12, "requirements": {"mean": 5, "median": 5, "mode": 5, "range": 8}, "constraints": {}, "requiredSolutions": 2, "start": [1, 5, 5, 6, 9], "prompt": "Lag 5 tall med gjennomsnitt 5, median 5, typetall 5 og variasjonsbredde 8. Finn to løsninger.", "hints": ["Summen er 25.", "Ytterpunktene må ha forskjell 8. Prøv ulike plasseringer rundt de to femmerne."]}, {"id": "6-06", "level": 6, "title": "Forbud og to løsninger", "count": 6, "min": 0, "max": 14, "requirements": {"mean": 7, "median": 7}, "constraints": {"mustNotInclude": [7]}, "requiredSolutions": 2, "start": [2, 5, 6, 8, 9, 12], "prompt": "Lag 6 tall med gjennomsnitt 7 og median 7 uten å bruke tallet 7. Finn to løsninger.", "hints": ["Summen skal bli 42.", "De to midterste tallene kan for eksempel ligge like langt på hver side av 7."]}, {"id": "6-07", "level": 6, "title": "Trang konstruksjon", "count": 6, "min": 1, "max": 12, "requirements": {"mean": 6, "median": 5, "mode": 4, "range": 10}, "constraints": {"occurrences": {"4": 2}}, "requiredSolutions": 1, "start": [1, 4, 4, 6, 9, 11], "prompt": "Lag 6 tall med gjennomsnitt 6, median 5, typetall 4 og variasjonsbredde 10. Bruk 4 nøyaktig to ganger.", "hints": ["Summen skal være 36.", "Variasjonsbredde 10 innenfor 1–12 gir få mulige ytterpunkter."]}, {"id": "6-08", "level": 6, "title": "Låst ekspertoppgave", "count": 7, "min": 0, "max": 15, "requirements": {"mean": 7, "median": 6, "range": 12}, "constraints": {"mustNotInclude": [7]}, "lockedValues": [{"position": 0, "value": 1}, {"position": 6, "value": 13}], "requiredSolutions": 1, "start": [1, 4, 5, 6, 8, 12, 13], "prompt": "Lag 7 tall med gjennomsnitt 7, median 6 og variasjonsbredde 12. 1 og 13 er låst, og 7 er forbudt.", "hints": ["Ytterpunktene gir allerede riktig variasjonsbredde.", "Summen må bli 49, og fjerde tall etter sortering må være 6."]}, {"id": "6-09", "level": 6, "title": "Fire krav + regel", "count": 7, "min": 0, "max": 15, "requirements": {"mean": 7, "median": 6, "mode": 5, "range": 12}, "constraints": {"occurrences": {"5": 2}}, "requiredSolutions": 1, "start": [1, 4, 5, 5, 7, 12, 13], "prompt": "Lag 7 tall med gjennomsnitt 7, median 6, typetall 5 og variasjonsbredde 12. Bruk 5 nøyaktig to ganger.", "hints": ["Summen skal være 49.", "5 må være eneste typetall, og fjerde tall må være 6."]}, {"id": "6-10", "level": 6, "title": "Sluttboss", "count": 7, "min": 0, "max": 15, "requirements": {"mean": 8, "median": 7, "mode": 5, "range": 12}, "constraints": {"mustInclude": [14], "mustNotInclude": [8], "occurrences": {"5": 2}}, "requiredSolutions": 1, "start": [2, 5, 5, 7, 10, 13, 14], "prompt": "Lag 7 tall med gjennomsnitt 8, median 7, typetall 5 og variasjonsbredde 12. Du må bruke 14, kan ikke bruke 8, og 5 skal brukes nøyaktig to ganger.", "hints": ["Summen skal være 56.", "Hvis 14 er største verdi og variasjonsbredden er 12, hva må minste verdi være?", "Når 5 brukes to ganger, må ingen annen verdi brukes like ofte."]}];

const LEVEL_META = {
  1: ["Ett mål", "Bli kjent med gjennomsnitt, median, typetall og variasjonsbredde."],
  2: ["Ett mål + krav", "Låste tall, forbudte tall og andre begrensninger."],
  3: ["To mål", "Få to statistiske egenskaper til å stemme samtidig."],
  4: ["To mål + krav", "Kombiner to mål med ekstra regler."],
  5: ["Tre eller flere mål", "Bygg datasett med flere samtidige krav."],
  6: ["Ekspert", "Finn flere løsninger og løs stramme statistikkpuslespill."]
};

let state = {
  level: null,
  index: 0,
  values: [],
  hintIndex: 0,
  solutions: [],
  solvedCurrent: false,
  progress: JSON.parse(localStorage.getItem("statBuilderProgress") || "{}")
};

const $ = s => document.querySelector(s);
const levelSelect = $("#levelSelect");
const gameScreen = $("#gameScreen");
const completeScreen = $("#completeScreen");
const homeBtn = $("#homeBtn");

function roundSmart(n) {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100).replace(".", ",");
}

function calcStats(values) {
  const sorted = [...values].sort((a,b)=>a-b);
  const sum = sorted.reduce((a,b)=>a+b,0);
  const mean = sum / sorted.length;
  const median = sorted.length % 2
    ? sorted[(sorted.length-1)/2]
    : (sorted[sorted.length/2-1] + sorted[sorted.length/2]) / 2;

  const counts = new Map();
  sorted.forEach(v => counts.set(v, (counts.get(v)||0)+1));
  const maxFreq = Math.max(...counts.values());
  const modes = [...counts.entries()].filter(([_,c])=>c===maxFreq).map(([v])=>v);
  const mode = maxFreq > 1 && modes.length === 1 ? modes[0] : null;

  const range = sorted[sorted.length-1] - sorted[0];
  return {mean, median, mode, range, sum, sorted};
}

function statName(key) {
  return {mean:"Gjennomsnitt", median:"Median", mode:"Typetall", range:"Variasjonsbredde"}[key];
}

function equalish(a,b) {
  return Math.abs(a-b) < 1e-9;
}

function canonical(values) {
  return [...values].sort((a,b)=>a-b).join(",");
}

function validate(challenge, values) {
  const stats = calcStats(values);
  const req = {};
  for (const [key,target] of Object.entries(challenge.requirements || {})) {
    const actual = stats[key];
    const passed = key === "mode" ? actual === target : equalish(actual,target);
    req[key] = {target, actual, passed};
  }

  const c = challenge.constraints || {};
  const constraintResults = [];

  (c.mustInclude || []).forEach(v => constraintResults.push({
    label:`Må inneholde ${v}`,
    passed: values.includes(v)
  }));
  (c.mustNotInclude || []).forEach(v => constraintResults.push({
    label:`Kan ikke inneholde ${v}`,
    passed: !values.includes(v)
  }));
  if (c.allUnique) {
    constraintResults.push({label:"Alle tall må være ulike", passed:new Set(values).size===values.length});
  }
  if (c.occurrences) {
    for (const [rawV, count] of Object.entries(c.occurrences)) {
      const v = Number(rawV);
      const actual = values.filter(x=>x===v).length;
      constraintResults.push({label:`Tallet ${v} skal brukes nøyaktig ${count} ganger`, passed:actual===count});
    }
  }

  const boundsPassed = values.every(v=>Number.isInteger(v) && v>=challenge.min && v<=challenge.max);
  const allReq = Object.values(req).every(x=>x.passed);
  const allConstraints = constraintResults.every(x=>x.passed);
  return {solved:allReq && allConstraints && boundsPassed, stats, req, constraintResults, boundsPassed};
}

function renderLevelSelect() {
  levelSelect.hidden = false; gameScreen.hidden = true; completeScreen.hidden = true; homeBtn.hidden = true;
  const grid = $("#levelGrid");
  grid.innerHTML = "";
  for (let level=1; level<=6; level++) {
    const done = state.progress[level] || 0;
    const [focus, desc] = LEVEL_META[level];
    const btn = document.createElement("button");
    btn.className = "level-card" + (done>=10 ? " done" : "");
    btn.innerHTML = `
      <div>
        <div class="num">${level}</div>
        <div class="focus">${focus}</div>
        <div class="small">${desc}</div>
      </div>
      <div class="small">${Math.min(done,10)} / 10 fullført</div>`;
    btn.onclick = ()=>startLevel(level);
    grid.appendChild(btn);
  }
  const total = Object.values(state.progress).reduce((a,b)=>a+Math.min(Number(b)||0,10),0);
  $("#progressSummary").textContent = `${total} / 60 oppgaver`;
}

function startLevel(level) {
  state.level = level;
  state.index = Math.min(state.progress[level] || 0, 9);
  loadChallenge();
}

function currentChallenges() {
  return CAMPAIGN.filter(c=>c.level===state.level);
}

function loadChallenge() {
  const list = currentChallenges();
  if (state.index >= list.length) return showComplete();

  const ch = list[state.index];
  state.values = [...ch.start];
  for (const locked of ch.lockedValues || []) {
    state.values[locked.position] = locked.value;
  }
  state.hintIndex = 0;
  state.solutions = [];
  state.solvedCurrent = false;

  levelSelect.hidden = true; gameScreen.hidden = false; completeScreen.hidden = true; homeBtn.hidden = false;
  $("#levelLabel").textContent = `NIVÅ ${state.level} · ${LEVEL_META[state.level][0].toUpperCase()}`;
  $("#challengeTitle").textContent = ch.title;
  $("#questionCounter").textContent = `${state.index+1} / ${list.length}`;
  $("#challengePrompt").textContent = ch.prompt;
  $("#hintBox").hidden = true;
  $("#hintBox").textContent = "";
  $("#nextBtn").disabled = true;
  $("#nextBtn").textContent = "Neste oppgave →";
  render();
}

function render() {
  const ch = currentChallenges()[state.index];
  const result = validate(ch,state.values);
  renderRequirements(ch,result);
  renderNumbers(ch);
  renderStats(ch,result);
  renderFeedback(ch,result);
}

function renderRequirements(ch,result) {
  const el = $("#requirementsList");
  el.innerHTML = "";
  for (const [key,r] of Object.entries(result.req)) {
    const d = document.createElement("div");
    d.className = "req-chip" + (r.passed ? " pass" : "");
    d.textContent = `${statName(key)} = ${roundSmart(r.target)}${r.passed ? " ✓" : ""}`;
    el.appendChild(d);
  }
  result.constraintResults.forEach(c => {
    const d = document.createElement("div");
    d.className = "req-chip" + (c.passed ? " pass" : "");
    d.textContent = c.label + (c.passed ? " ✓" : "");
    el.appendChild(d);
  });
}

function renderNumbers(ch) {
  const row = $("#numberRow");
  row.innerHTML = "";
  const lockedMap = new Map((ch.lockedValues||[]).map(x=>[x.position,x.value]));
  state.values.forEach((v,i)=>{
    const wrap = document.createElement("div");
    wrap.className = "number-control";
    if (lockedMap.has(i)) {
      wrap.innerHTML = `<div></div><div class="locked-value">${lockedMap.get(i)}</div><div></div>`;
    } else {
      const plus = document.createElement("button");
      plus.textContent = "+";
      plus.onclick = ()=>changeValue(i,1,ch);
      const input = document.createElement("input");
      input.type = "number";
      input.min = ch.min; input.max = ch.max; input.step = "1"; input.value = v;
      input.onchange = () => setValue(i, Number(input.value), ch);
      const minus = document.createElement("button");
      minus.textContent = "−";
      minus.onclick = ()=>changeValue(i,-1,ch);
      wrap.append(plus,input,minus);
    }
    row.appendChild(wrap);
  });
}

function changeValue(i,delta,ch) {
  setValue(i,state.values[i]+delta,ch);
}
function setValue(i,value,ch) {
  if (!Number.isFinite(value)) return;
  value = Math.max(ch.min,Math.min(ch.max,Math.round(value)));
  state.values[i] = value;
  render();
}

function renderStats(ch,result) {
  const el = $("#statsGrid");
  el.innerHTML = "";
  for (const key of ["mean","median","mode","range"]) {
    const target = ch.requirements?.[key];
    const isTarget = target !== undefined;
    const passed = isTarget ? result.req[key].passed : false;
    const val = result.stats[key];
    const card = document.createElement("div");
    card.className = "stat-card" + (isTarget ? ` target ${passed?"pass":"fail"}` : "");
    const shown = key==="mode" && val===null ? "–" : roundSmart(val);
    card.innerHTML = `<div class="label">${statName(key)}</div><div class="value">${shown}${isTarget && passed ? " ✓" : ""}</div>`;
    el.appendChild(card);
  }
}

function renderFeedback(ch,result) {
  const panel = $("#feedbackPanel");
  const text = $("#feedbackText");
  const needed = ch.requiredSolutions || 1;
  panel.classList.remove("success");

  if (result.solved) {
    const key = canonical(state.values);
    const already = state.solutions.includes(key);
    if (!already) state.solutions.push(key);

    if (state.solutions.length >= needed) {
      panel.classList.add("success");
      text.textContent = needed > 1
        ? `Du fant ${needed} ulike løsninger. Sterkt jobbet!`
        : "Der satt den! Alle krav er oppfylt.";
      $("#nextBtn").disabled = false;
      state.solvedCurrent = true;
    } else {
      panel.classList.add("success");
      text.textContent = `Løsning ${state.solutions.length} av ${needed} funnet. Finn en annen løsning.`;
      $("#nextBtn").disabled = true;
    }
  } else {
    const passed = Object.values(result.req).filter(x=>x.passed).length + result.constraintResults.filter(x=>x.passed).length;
    const total = Object.values(result.req).length + result.constraintResults.length;
    text.textContent = total
      ? `${passed} av ${total} krav er oppfylt. Juster tallene og se hva som endrer seg.`
      : "Prøv deg fram.";
    $("#nextBtn").disabled = true;
  }
}

$("#resetBtn").onclick = loadChallenge;

$("#hintBtn").onclick = () => {
  const ch = currentChallenges()[state.index];
  const hints = ch.hints || [];
  if (!hints.length) return;
  const box = $("#hintBox");
  box.hidden = false;
  const staticHint = hints[Math.min(state.hintIndex,hints.length-1)];
  let dynamic = "";
  const result = validate(ch,state.values);
  if (ch.requirements?.mean !== undefined) {
    const targetSum = ch.requirements.mean * ch.count;
    dynamic = ` Nå er summen ${roundSmart(result.stats.sum)}. Målsummen er ${roundSmart(targetSum)}.`;
  }
  box.textContent = staticHint + dynamic;
  state.hintIndex++;
};

$("#nextBtn").onclick = () => {
  if (!state.solvedCurrent) return;
  state.index++;
  const prev = state.progress[state.level] || 0;
  state.progress[state.level] = Math.max(prev,state.index);
  localStorage.setItem("statBuilderProgress", JSON.stringify(state.progress));
  if (state.index >= currentChallenges().length) showComplete();
  else loadChallenge();
};

function showComplete() {
  gameScreen.hidden = true;
  completeScreen.hidden = false;
  levelSelect.hidden = true;
  homeBtn.hidden = false;
  $("#completeTitle").textContent = `Nivå ${state.level} er fullført`;
  $("#completeText").textContent = LEVEL_META[state.level][1];
  $("#nextLevelBtn").hidden = state.level >= 6;
}

$("#backToLevelsBtn").onclick = renderLevelSelect;
$("#nextLevelBtn").onclick = () => {
  if (state.level < 6) startLevel(state.level+1);
};
homeBtn.onclick = renderLevelSelect;

renderLevelSelect();
