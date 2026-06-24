// events.js – Hendelsesdatabase

export const REGIONS = {
  nordkysten:   { id: 'nordkysten',   name: 'Nordkysten',   icon: '⚡', color: '#E8C547', description: 'Energi og vind' },
  skoglandet:   { id: 'skoglandet',   name: 'Skoglandet',   icon: '🌲', color: '#5BBFAD', description: 'Skog og villmark' },
  fjordbygdene: { id: 'fjordbygdene', name: 'Fjordbygdene', icon: '🚜', color: '#7FB97F', description: 'Jordbruk og bygdeliv' },
  vesthavet:    { id: 'vesthavet',    name: 'Vesthavet',    icon: '🐟', color: '#4A9CC2', description: 'Fiskeri og kyst' },
  havnebyen:    { id: 'havnebyen',    name: 'Havnebyen',    icon: '🏭', color: '#9A8EC0', description: 'Industri og havn' },
  sentrum:      { id: 'sentrum',      name: 'Sentrum',      icon: '🏘️', color: '#E87D5B', description: 'By, helse og utdanning' },
};

// Kart-ikoner som vises etter valg: { flagId: { emoji, region, label } }
export const FLAG_MAP_ICONS = {
  windFarm:           { emoji: '💨', region: 'nordkysten',   label: 'Vindpark' },
  hydroExpansion:     { emoji: '💧', region: 'nordkysten',   label: 'Vannkraft' },
  energySaving:       { emoji: '🔋', region: 'nordkysten',   label: 'Energisparing' },
  urbanDensity:       { emoji: '🏗️',  region: 'sentrum',     label: 'Fortetting' },
  suburbanExpansion:  { emoji: '🏘️', region: 'sentrum',      label: 'Boligfelt' },
  housingCoops:       { emoji: '🤝', region: 'sentrum',      label: 'Kooperativer' },
  bigAquaculture:     { emoji: '🐠', region: 'vesthavet',    label: 'Oppdrett' },
  regulatedAquaculture:{ emoji: '🎣', region: 'vesthavet',   label: 'Regulert oppdrett' },
  fjordProtection:    { emoji: '🌊', region: 'vesthavet',    label: 'Fjordvern' },
  nursePayRise:       { emoji: '💊', region: 'sentrum',      label: 'Lønnsløft' },
  nurseEducation:     { emoji: '📚', region: 'sentrum',      label: 'Sykepleierutdanning' },
  healthPrivate:      { emoji: '🏥', region: 'sentrum',      label: 'Privat helse' },
  industrialLogging:  { emoji: '🪵', region: 'skoglandet',   label: 'Industrihogst' },
  sustainableForestry:{ emoji: '♻️', region: 'skoglandet',   label: 'Bærekraftig skog' },
  forestProtection:   { emoji: '🌿', region: 'skoglandet',   label: 'Naturreservat' },
  heavyIndustry:      { emoji: '🏭', region: 'havnebyen',    label: 'Tungindustri' },
  conditionalIndustry:{ emoji: '⚙️', region: 'havnebyen',   label: 'Regulert industri' },
  greenPriority:      { emoji: '🌱', region: 'havnebyen',    label: 'Grønn industri' },
  farmSubsidy:        { emoji: '🌾', region: 'fjordbygdene', label: 'Gårdsstøtte' },
  localFood:          { emoji: '🥕', region: 'fjordbygdene', label: 'Kortreist mat' },
  marketFarming:      { emoji: '📉', region: 'fjordbygdene', label: 'Markedslandbruk' },
  owlProtection:      { emoji: '🦉', region: 'skoglandet',   label: 'Hubrovjern' },
  publicDialogue:     { emoji: '🗣️', region: 'sentrum',      label: 'Folkemøter' },
  techInvestment:     { emoji: '💻', region: 'havnebyen',    label: 'Teknologi' },
  tourism:            { emoji: '🧭', region: 'fjordbygdene', label: 'Reiseliv' },
  // Runde 2
  solarFarm:          { emoji: '☀️', region: 'nordkysten',   label: 'Solpark' },
  smallSolar:         { emoji: '🔆', region: 'nordkysten',   label: 'Liten solpark' },
  localEnergy:        { emoji: '⚡', region: 'nordkysten',   label: 'Lokal energi' },
  coalPlant:          { emoji: '🏭', region: 'nordkysten',   label: 'Kullkraftverk' },
  energyRationing:    { emoji: '🕯️', region: 'nordkysten',   label: 'Rasjonering' },
  offshoreWind:       { emoji: '🌊', region: 'nordkysten',   label: 'Havvind' },
  offshoreWindRestricted: { emoji: '⚓', region: 'nordkysten', label: 'Begrenset havvind' },
  fishingPriority:    { emoji: '🎣', region: 'vesthavet',    label: 'Fiskeri prioritert' },
  fishingQuota:       { emoji: '📋', region: 'vesthavet',    label: 'Fiskekvote' },
  gradualQuota:       { emoji: '📉', region: 'vesthavet',    label: 'Gradvis kvote' },
  overfishing:        { emoji: '⚠️', region: 'vesthavet',    label: 'Overbeskatning' },
  marineReserve:      { emoji: '🐋', region: 'vesthavet',    label: 'Marint reservat' },
  marineZones:        { emoji: '🗺️', region: 'vesthavet',    label: 'Marine soner' },
  pesticides:         { emoji: '🧪', region: 'fjordbygdene', label: 'Sprøytemidler' },
  organicFarming:     { emoji: '🌿', region: 'fjordbygdene', label: 'Økologisk' },
  irrigation:         { emoji: '💧', region: 'fjordbygdene', label: 'Irrigasjon' },
  droughtResponse:    { emoji: '☀️', region: 'fjordbygdene', label: 'Tørkerespons' },
  cropResearch:       { emoji: '🔬', region: 'fjordbygdene', label: 'Sortsutvikling' },
  schoolClosure:      { emoji: '🏫', region: 'fjordbygdene', label: 'Skolenedleggelse' },
  ruralSchool:        { emoji: '✏️', region: 'fjordbygdene', label: 'Bygdeskole' },
  communityHub:       { emoji: '🏡', region: 'fjordbygdene', label: 'Kulturhus' },
  rewilding:          { emoji: '🐺', region: 'skoglandet',   label: 'Rewilding' },
  partialRewilding:   { emoji: '🌱', region: 'skoglandet',   label: 'Delvis rewilding' },
  miningConcession:   { emoji: '⛏️', region: 'skoglandet',   label: 'Gruvekonsesjon' },
  limitedMining:      { emoji: '🪨', region: 'skoglandet',   label: 'Begrenset gruve' },
  miningRejected:     { emoji: '🚫', region: 'skoglandet',   label: 'Gruve avslått' },
  portExpansion:      { emoji: '⚓', region: 'havnebyen',    label: 'Havneutvidelse' },
  greenPort:          { emoji: '🚢', region: 'havnebyen',    label: 'Grønn havn' },
  cleanPort:          { emoji: '🌿', region: 'havnebyen',    label: 'Ren havn' },
  airQualityLaw:      { emoji: '💨', region: 'havnebyen',    label: 'Luftkvalitetskrav' },
  airQualityGradual:  { emoji: '🌫️', region: 'havnebyen',   label: 'Gradvise luftkrav' },
  youthCenter:        { emoji: '🎯', region: 'sentrum',      label: 'Ungdomssenter' },
  schoolHealth:       { emoji: '💙', region: 'sentrum',      label: 'Skolehelsetjeneste' },
  volunteerNetwork:   { emoji: '🤲', region: 'sentrum',      label: 'Frivillignettverk' },
  schoolReform:       { emoji: '📐', region: 'sentrum',      label: 'Skolereform' },
  schoolPilot:        { emoji: '🔭', region: 'sentrum',      label: 'Skolepiloter' },
  floodBarrier:       { emoji: '🌊', region: 'sentrum',      label: 'Flomvern' },
  nationalPark:       { emoji: '🏔️', region: 'skoglandet',  label: 'Nasjonalpark' },
  ecoRestoration:     { emoji: '🌳', region: 'skoglandet',   label: 'Naturrestaurering' },
  transparency:       { emoji: '📢', region: 'sentrum',      label: 'Åpenhet' },
  inquiry:            { emoji: '⚖️', region: 'sentrum',      label: 'Granskning' },
};

// Konsekvens-ikoner som vises på kartet (uavhengig av valg – bare ved at hendelsen er aktiv)
export const CONSEQUENCE_MAP_ICONS = {
  owl_disappears:        { emoji: '⚠️', region: 'skoglandet',   label: 'Hubroen forsvinner' },
  salmon_lice:           { emoji: '☠️', region: 'vesthavet',    label: 'Lakselus' },
  health_crisis:         { emoji: '🚨', region: 'sentrum',      label: 'Helsekrise' },
  big_protests:          { emoji: '✊', region: 'sentrum',      label: 'Protester' },
  economic_stagnation:   { emoji: '📉', region: 'havnebyen',    label: 'Stagnasjon' },
  solar_birds:           { emoji: '🐦', region: 'nordkysten',   label: 'Fugler forsvinner' },
  coal_smog:             { emoji: '🌫️', region: 'havnebyen',   label: 'Smog' },
  overfishing_collapse:  { emoji: '🐟', region: 'vesthavet',    label: 'Fiskerikollaps' },
  pesticide_bees:        { emoji: '🐝', region: 'fjordbygdene', label: 'Birøkterkrise' },
  mine_water:            { emoji: '☢️', region: 'skoglandet',   label: 'Forurenset vann' },
  port_neighborhood:     { emoji: '😤', region: 'havnebyen',    label: 'Havnenaboer' },
  rewilding_livestock:   { emoji: '🐺', region: 'fjordbygdene', label: 'Ulv i bygda' },
  climate_flood:         { emoji: '🌊', region: 'sentrum',      label: 'Ekstremflom' },
  nature_collapse:       { emoji: '💀', region: 'skoglandet',   label: 'Naturkrise' },
  trust_collapse:        { emoji: '🗳️', region: 'sentrum',      label: 'Tillitskrise' },
};

export const EVENTS = [

  // ─── TYPE A: GRUNNHENDELSER ───────────────────────────

  {
    id: 'energy_crisis',
    type: 'A',
    region: 'nordkysten',
    title: 'Strømkrise',
    description: 'Bedriftene varsler at de trenger mer energi. Uten tiltak vil industrien stagnere – men utbygging koster.',
    ignoreEffect: { effects: { energy: -5, jobs: -3 }, meterEffects: { business: -4 } },
    choices: [
      {
        text: 'Bygg vindpark på høyfjellet',
        shortLabel: 'Vindpark',
        effects: { jobs: 5, energy: 15, biodiversity: -10, emissions: -5 },
        meterEffects: { business: 8, nature: -5 },
        flags: ['windFarm'],
      },
      {
        text: 'Utvid eksisterende vannkraft',
        shortLabel: 'Vannkraft',
        effects: { jobs: 3, energy: 10, biodiversity: -6 },
        meterEffects: { business: 5, nature: -3 },
        flags: ['hydroExpansion'],
      },
      {
        text: 'Invester i energiøkonomisering',
        shortLabel: 'Sparing',
        effects: { energy: 6, emissions: -3, treasury: -8 },
        meterEffects: { business: -2, nature: 4, people: 2 },
        flags: ['energySaving'],
      },
    ],
  },

  {
    id: 'housing_shortage',
    type: 'A',
    region: 'sentrum',
    title: 'Boligmangel',
    description: 'Ventelistene på kommunale boliger er lange. Unge familier flytter fra øya. Noe må gjøres.',
    ignoreEffect: { effects: { housing: -5, trust: -4 }, meterEffects: { people: -5 } },
    choices: [
      {
        text: 'Fortett i eksisterende byområder',
        shortLabel: 'Fortetting',
        effects: { housing: 12, areaPress: 3, trust: 4 },
        meterEffects: { people: 8, business: 2, nature: 1 },
        flags: ['urbanDensity'],
      },
      {
        text: 'Bygg nye boligfelt i utkanten',
        shortLabel: 'Utbygging',
        effects: { housing: 18, areaPress: 12, biodiversity: -8, treasury: -10 },
        meterEffects: { people: 10, nature: -8 },
        flags: ['suburbanExpansion', 'densityConflict'],
      },
      {
        text: 'Tilrettelegg for boligkooperativer',
        shortLabel: 'Kooperativer',
        effects: { housing: 7, trust: 8, jobs: 2 },
        meterEffects: { people: 5, business: 1 },
        flags: ['housingCoops'],
      },
    ],
  },

  {
    id: 'fish_farm_expansion',
    type: 'A',
    region: 'vesthavet',
    title: 'Oppdrettsutvidelse',
    description: 'Et stort oppdrettsselskap vil etablere seg i Vesthavet. Mange arbeidsplasser – men naboene er urolige for havmiljøet.',
    ignoreEffect: { effects: { jobs: -4, trust: -2 }, meterEffects: { business: -3 } },
    choices: [
      {
        text: 'Godkjenn full utbygging',
        shortLabel: 'Godkjenn',
        effects: { jobs: 14, treasury: 10, oceanEnv: -12, trust: -3 },
        meterEffects: { business: 12, nature: -10 },
        flags: ['bigAquaculture'],
      },
      {
        text: 'Tillat begrenset drift med strenge krav',
        shortLabel: 'Regulert',
        effects: { jobs: 7, treasury: 4, oceanEnv: -5 },
        meterEffects: { business: 6, nature: -4 },
        flags: ['regulatedAquaculture'],
      },
      {
        text: 'Si nei – bevar fjordene',
        shortLabel: 'Nei',
        effects: { jobs: -3, oceanEnv: 5, trust: 5, biodiversity: 4 },
        meterEffects: { business: -6, nature: 8 },
        flags: ['fjordProtection'],
      },
    ],
  },

  {
    id: 'nurse_shortage',
    type: 'A',
    region: 'sentrum',
    title: 'Sykepleiermangel',
    description: 'Sykehuset melder om kritisk underbemanning. Pasienter venter lenge. Ansatte er utbrent.',
    ignoreEffect: { effects: { health: -8, trust: -5 }, meterEffects: { people: -7 } },
    choices: [
      {
        text: 'Øk lønningene betraktelig',
        shortLabel: 'Lønnsløft',
        effects: { health: 10, treasury: -15, trust: 6 },
        meterEffects: { people: 10, business: -5 },
        flags: ['nursePayRise'],
      },
      {
        text: 'Bygg opp utdanningskapasitet lokalt',
        shortLabel: 'Utdanning',
        effects: { education: 8, health: 5, treasury: -8, jobs: 4 },
        meterEffects: { people: 6, business: 3 },
        flags: ['nurseEducation'],
      },
      {
        text: 'Privatiser deler av helsetilbudet',
        shortLabel: 'Privat',
        effects: { health: 4, treasury: 5, trust: -8 },
        meterEffects: { people: -2, business: 8 },
        flags: ['healthPrivate'],
      },
    ],
  },

  {
    id: 'logging_demand',
    type: 'A',
    region: 'skoglandet',
    title: 'Hogstpress',
    description: 'Trelastindustrien vil inn i Skoglandet. Skogeier-organisasjonen støtter det. Miljøgrupper advarer.',
    ignoreEffect: { effects: { trust: -3 }, meterEffects: { business: -2 } },
    choices: [
      {
        text: 'Åpne for industriell hogst',
        shortLabel: 'Hogst',
        effects: { jobs: 8, treasury: 7, biodiversity: -14, areaPress: 8 },
        meterEffects: { business: 9, nature: -11 },
        flags: ['industrialLogging'],
      },
      {
        text: 'Begrens til bærekraftig uttak',
        shortLabel: 'Bærekraftig',
        effects: { jobs: 3, biodiversity: -4, treasury: 3 },
        meterEffects: { business: 3, nature: -3 },
        flags: ['sustainableForestry'],
      },
      {
        text: 'Vern skogen som naturreservat',
        shortLabel: 'Vern',
        effects: { biodiversity: 12, trust: 5, jobs: -4, treasury: -3 },
        meterEffects: { nature: 11, business: -5 },
        flags: ['forestProtection'],
      },
    ],
  },

  {
    id: 'industrial_relocation',
    type: 'A',
    region: 'havnebyen',
    title: 'Ny fabrikk vil etablere seg',
    description: 'En stor produksjonsbedrift vil flytte til Havnebyen. 200 arbeidsplasser – men fabrikken er kjent for høye utslipp.',
    ignoreEffect: { effects: { jobs: -5, trust: -3 }, meterEffects: { business: -4 } },
    choices: [
      {
        text: 'Ønsk dem velkommen',
        shortLabel: 'Ja',
        effects: { jobs: 18, treasury: 12, emissions: 15, trust: 2 },
        meterEffects: { business: 14, nature: -9 },
        flags: ['heavyIndustry', 'industrialPollution'],
      },
      {
        text: 'Ja, men krev utslippskutt',
        shortLabel: 'Betinget',
        effects: { jobs: 12, treasury: 6, emissions: 5 },
        meterEffects: { business: 8, nature: -4 },
        flags: ['conditionalIndustry', 'industrialPollution'],
      },
      {
        text: 'Avslå – prioriter grønn industri',
        shortLabel: 'Avslå',
        effects: { jobs: -5, emissions: -3, trust: 4, biodiversity: 3 },
        meterEffects: { business: -7, nature: 5 },
        flags: ['greenPriority'],
      },
    ],
  },

  {
    id: 'agriculture_subsidy',
    type: 'A',
    region: 'fjordbygdene',
    title: 'Bønder krever støtte',
    description: 'Fjordbygdenes bønder trenger subsidier for å holde driften lønnsom. Uten støtte kan matproduksjonen falle.',
    ignoreEffect: { effects: { jobs: -5, trust: -4 }, meterEffects: { people: -4, business: -2 } },
    choices: [
      {
        text: 'Øk landbruksstøtten',
        shortLabel: 'Subsidier',
        effects: { jobs: 4, treasury: -12, trust: 5 },
        meterEffects: { people: 5, business: -3 },
        flags: ['farmSubsidy', 'intensiveFarming'],
      },
      {
        text: 'Støtt omstilling til kortreist mat',
        shortLabel: 'Kortreist',
        effects: { trust: 7, biodiversity: 4, jobs: 2, treasury: -6 },
        meterEffects: { people: 4, nature: 4 },
        flags: ['localFood'],
      },
      {
        text: 'La markedet ordne det',
        shortLabel: 'Marked',
        effects: { jobs: -6, treasury: 4, trust: -5 },
        meterEffects: { business: 3, people: -6 },
        flags: ['marketFarming', 'intensiveFarming'],
      },
    ],
  },

  // ─── TYPE B: KONSEKVENSHENDELSER ─────────────────────
  // causedBy: forklarer koblingen med spillerens navn flettet inn

  {
    id: 'owl_disappears',
    type: 'B',
    minYear: 4,
    region: 'skoglandet',
    requires: { flags: ['windFarm', 'industrialLogging', 'hydroExpansion', 'miningConcession', 'limitedMining'], any: true },
    causedBy: {
      windFarm:        'Etter at {navn} lot vindparken reise seg på høyfjellet, har trekkrutene til rovfuglene blitt brutt.',
      industrialLogging: 'Etter at {navn} åpnet Skoglandet for industriell hogst, har habitatene blitt for forstyrrede.',
      hydroExpansion:  'Etter at {navn} utvidet vannkraften, ble elvedelta-habitatene som hubroen var avhengig av, ødelagt.',
      miningConcession: 'Etter at {navn} ga gruvetillatelse i Skoglandet, har støy og inngrep drevet hubroen på flukt.',
      limitedMining:   'Selv den begrensede gruvedriften {navn} tillot har forstyrret hekkeplassene til hubroen.',
    },
    title: 'Hubroen forsvinner',
    newsHeadline: 'Hubroen er nesten utryddet',
    newsIngress: 'Biologer registrerer at hubro ikke lenger hekker i Skoglandet. Bestanden har falt med over 80 prosent på få år.',
    choices: [
      {
        text: 'Iverksett akutt verneplan',
        shortLabel: 'Verneplan',
        effects: { biodiversity: 8, treasury: -5, trust: 3 },
        meterEffects: { nature: 6 },
        flags: ['owlProtection'],
      },
      {
        text: 'Registrer tapet – gå videre',
        shortLabel: 'Godta tapet',
        effects: { biodiversity: -4, trust: -2 },
        meterEffects: { nature: -4 },
        flags: [],
      },
    ],
  },

  {
    id: 'salmon_lice',
    type: 'B',
    minYear: 4,
    region: 'vesthavet',
    requires: { flags: ['bigAquaculture', 'regulatedAquaculture'], any: true },
    causedBy: {
      bigAquaculture: 'Etter at {navn} godkjente full utbygging av oppdrettsanlegg i Vesthavet, har lakselusbestanden eksplodert.',
      regulatedAquaculture: 'Til tross for kravene {navn} stilte, har lakselusen spredt seg fra oppdrettsanleggene og ut i fjordene.',
    },
    title: 'Lakselus sprer seg',
    newsHeadline: 'Katastrofe i fjordene',
    newsIngress: 'Villfisken sliter. Lakselus fra oppdrettsanleggene som {navn} godkjente, har nå bredt seg til nærliggende fjorder og truer hele bestanden.',
    choices: [
      {
        text: 'Steng ned anlegg midlertidig',
        shortLabel: 'Steng ned',
        effects: { oceanEnv: 10, jobs: -8, treasury: -5 },
        meterEffects: { nature: 9, business: -7 },
        flags: [],
      },
      {
        text: 'Sett inn kjemisk behandling',
        shortLabel: 'Behandling',
        effects: { oceanEnv: 3, biodiversity: -5 },
        meterEffects: { nature: -3, business: 2 },
        flags: [],
      },
    ],
  },

  {
    id: 'health_crisis',
    type: 'B',
    minYear: 4,
    region: 'sentrum',
    requires: { flags: ['healthPrivate', 'schoolClosure', 'youthNeglect', 'reformRejected'], any: true },
    causedBy: {
      healthPrivate: 'Etter at {navn} privatiserte deler av helsetilbudet, har køene på det offentlige sykehuset blitt kritisk lange.',
      schoolClosure: 'Etter at {navn} la ned bygdeskolen, har barnefamilier i utkanten mistet tilgang til grunnleggende tjenester – og helsestasjonen stengte like etter.',
      youthNeglect: 'Ungdommene på øya har ikke fått hjelpen de trengte. Nå er krisen et faktum – med lange køer og utslitte helsearbeidere.',
      reformRejected: 'Skolereformen ble avvist, og resultatet er synlig: elever faller fra, lærere slutter, og presset på helsetjenestene øker.',
    },
    title: 'Helsekrise i Sentrum',
    newsHeadline: 'Folk dør i kø',
    newsIngress: 'Den private klinikken betjener bare betalende pasienter. Sykehuset er overbelastet, og folk med dårlig råd faller utenfor – en direkte følge av privatiseringen {navn} innførte.',
    choices: [
      {
        text: 'Gjenkommunaliser helsetilbudet',
        shortLabel: 'Rekommunaliser',
        effects: { health: 12, trust: 10, treasury: -15 },
        meterEffects: { people: 12, business: -5 },
        flags: [],
      },
      {
        text: 'Inngå avtale med den private aktøren',
        shortLabel: 'Hybrid',
        effects: { health: 5, trust: 2, treasury: -5 },
        meterEffects: { people: 4 },
        flags: [],
      },
    ],
  },

  // ─── TYPE C: SYSTEMHENDELSER ──────────────────────────

  {
    id: 'big_protests',
    type: 'C',
    minYear: 6,
    region: 'sentrum',
    requires: { variable: 'trust', below: 30 },
    title: 'Store protester',
    description: 'Innbyggerne er lei av å ikke bli hørt. Tusenvis marsjerer gjennom Sentrum.',
    ignoreEffect: { effects: { trust: -12, treasury: -5 }, meterEffects: { people: -10 } },
    choices: [
      {
        text: 'Hold folkemøter og lytt',
        shortLabel: 'Dialog',
        effects: { trust: 12, treasury: -4 },
        meterEffects: { people: 8, business: -2 },
        flags: ['publicDialogue'],
      },
      {
        text: 'Gjennomfør planlagte tiltak uansett',
        shortLabel: 'Press gjennom',
        effects: { trust: -10, treasury: 3 },
        meterEffects: { people: -7, business: 4 },
        flags: [],
      },
    ],
  },

  {
    id: 'economic_stagnation',
    type: 'C',
    minYear: 6,
    region: 'havnebyen',
    requires: { variable: 'jobs', below: 35 },
    title: 'Øya stagnerer',
    description: 'Unge flytter ut i hopetall. Butikker stenger. Øya trenger et løft – men hva slags?',
    ignoreEffect: { effects: { jobs: -6, trust: -5 }, meterEffects: { business: -6, people: -3 } },
    choices: [
      {
        text: 'Tiltrekk ny teknologiindustri',
        shortLabel: 'Tech',
        effects: { jobs: 12, treasury: 5, education: 5, biodiversity: -3 },
        meterEffects: { business: 12, people: 3 },
        flags: ['techInvestment'],
      },
      {
        text: 'Satse på reiseliv og natur',
        shortLabel: 'Reiseliv',
        effects: { jobs: 8, treasury: 6, areaPress: 6 },
        meterEffects: { business: 7, nature: -2 },
        flags: ['tourism'],
      },
    ],
  },

  // ════════════════════════════════════════════════════
  // RUNDE 2 – 25 NYE HENDELSER
  // ════════════════════════════════════════════════════

  // ─── TYPE A: NORDKYSTEN (3 nye) ──────────────────────

  {
    id: 'solar_opportunity',
    type: 'A',
    region: 'nordkysten',
    title: 'Solenergi-investorer banker på',
    description: 'Et internasjonalt konsortium vil bygge et stort solcelleanlegg på Nordkysten. De lover arbeidsplasser og billig strøm – men anlegget krever store arealer.',
    ignoreEffect: { effects: { energy: -3, treasury: -5 }, meterEffects: { business: -3 } },
    choices: [
      {
        text: 'Godkjenn stort solcelleanlegg',
        shortLabel: 'Solpark',
        effects: { energy: 18, jobs: 6, treasury: 8, areaPress: 10, biodiversity: -6 },
        meterEffects: { business: 10, nature: -4 },
        flags: ['solarFarm'],
      },
      {
        text: 'Tillat mindre anlegg på eksisterende industritomt',
        shortLabel: 'Begrenset sol',
        effects: { energy: 8, jobs: 3, treasury: 3, areaPress: 2 },
        meterEffects: { business: 5, nature: 1 },
        flags: ['smallSolar'],
      },
      {
        text: 'Avslå – prioriter lokal energistyring',
        shortLabel: 'Avslå',
        effects: { trust: 4, energy: -2 },
        meterEffects: { nature: 3, business: -4 },
        flags: ['localEnergy'],
      },
    ],
  },

  {
    id: 'coal_temptation',
    type: 'A',
    region: 'nordkysten',
    title: 'Kull som krisesvar',
    description: 'Energiprisene skyter i været. Et kraftselskap foreslår å reaktivere et gammelt kullkraftverk som reserveløsning. Billig og raskt – men konsekvensene for klimaet er kjente.',
    ignoreEffect: { effects: { energy: -8, jobs: -4 }, meterEffects: { business: -6, people: -3 } },
    choices: [
      {
        text: 'Reaktiver kullkraftverket',
        shortLabel: 'Kull',
        effects: { energy: 20, jobs: 8, treasury: 5, emissions: 20, biodiversity: -5 },
        meterEffects: { business: 9, nature: -14 },
        flags: ['coalPlant'],
      },
      {
        text: 'Kjøp kraft fra fastlandet midlertidig',
        shortLabel: 'Import',
        effects: { energy: 10, treasury: -12 },
        meterEffects: { business: 2, people: 2 },
        flags: [],
      },
      {
        text: 'Innfør strømrasjonering og spar',
        shortLabel: 'Rasjonering',
        effects: { energy: 5, trust: -6, emissions: -4 },
        meterEffects: { people: -5, nature: 4 },
        flags: ['energyRationing'],
      },
    ],
  },

  {
    id: 'offshore_wind',
    type: 'A',
    region: 'nordkysten',
    title: 'Havvind-mulighet',
    description: 'Staten tilbyr støtte til havvindutbygging utenfor Nordkysten. Fiskerne er skeptiske. Energibransjen jubler. Miljøorganisasjonene er delt.',
    ignoreEffect: { effects: { energy: -4 }, meterEffects: { business: -2 } },
    choices: [
      {
        text: 'Si ja til havvind i fullt omfang',
        shortLabel: 'Havvind',
        effects: { energy: 22, jobs: 14, treasury: 10, oceanEnv: -8, biodiversity: -5 },
        meterEffects: { business: 13, nature: -7 },
        flags: ['offshoreWind', 'oceanDisruption'],
      },
      {
        text: 'Ja, men med fiskerifrie soner',
        shortLabel: 'Kompromiss',
        effects: { energy: 14, jobs: 8, treasury: 5, oceanEnv: -3 },
        meterEffects: { business: 8, nature: -3 },
        flags: ['offshoreWindRestricted', 'oceanDisruption'],
      },
      {
        text: 'Nei – bevar fiskerifarvannene',
        shortLabel: 'Bevar havet',
        effects: { oceanEnv: 5, trust: 3, biodiversity: 3, jobs: -3 },
        meterEffects: { nature: 6, business: -5 },
        flags: ['fishingPriority'],
      },
    ],
  },

  // ─── TYPE A: FJORDBYGDENE (3 nye) ─────────────────────

  {
    id: 'pesticide_debate',
    type: 'A',
    region: 'fjordbygdene',
    title: 'Pesticid-striden',
    description: 'Bøndene i Fjordbygdene vil bruke mer effektive – men omdiskuterte – sprøytemidler for å redde årets avling. Bijøene er allerede under press.',
    ignoreEffect: { effects: { trust: -3 }, meterEffects: { people: -2 } },
    choices: [
      {
        text: 'Tillat midlertidig bruk av de omdiskuterte midlene',
        shortLabel: 'Tillat',
        effects: { jobs: 5, treasury: 4, biodiversity: -12, health: -4 },
        meterEffects: { business: 6, nature: -9 },
        flags: ['pesticides'],
      },
      {
        text: 'Krev overgang til godkjente alternativer',
        shortLabel: 'Alternativer',
        effects: { jobs: -2, treasury: -5, biodiversity: -3 },
        meterEffects: { nature: -2, business: -2 },
        flags: [],
      },
      {
        text: 'Støtt omlegging til økologisk drift',
        shortLabel: 'Økologisk',
        effects: { jobs: 3, biodiversity: 8, treasury: -8, trust: 6 },
        meterEffects: { nature: 7, people: 3, business: -3 },
        flags: ['organicFarming'],
      },
    ],
  },

  {
    id: 'drought_response',
    type: 'A',
    region: 'fjordbygdene',
    title: 'Tørke truer avlingen',
    description: 'Det tredje tørre sommeren på rad. Bøndene ber om hjelp. Grunnvannet er lavt, og elveuttaket er allerede på grensen.',
    ignoreEffect: { effects: { jobs: -6, trust: -5, health: -3 }, meterEffects: { people: -5, business: -4 } },
    choices: [
      {
        text: 'Bygg irrigasjonsanlegg – tap elvevann',
        shortLabel: 'Irrigasjon',
        effects: { jobs: 4, treasury: -10, oceanEnv: -6, biodiversity: -5 },
        meterEffects: { business: 5, nature: -7 },
        flags: ['irrigation'],
      },
      {
        text: 'Gi bøndene erstatning og la marken hvile',
        shortLabel: 'Hvileår',
        effects: { treasury: -12, biodiversity: 6, trust: 4 },
        meterEffects: { nature: 5, people: 3, business: -4 },
        flags: ['droughtResponse'],
      },
      {
        text: 'Invester i tørkeresistente sorter',
        shortLabel: 'Nye sorter',
        effects: { treasury: -7, education: 4, jobs: 2 },
        meterEffects: { business: 3, nature: 1, people: 2 },
        flags: ['cropResearch'],
      },
    ],
  },

  {
    id: 'rural_school',
    type: 'A',
    region: 'fjordbygdene',
    title: 'Bygdeskolen legges ned',
    description: 'Kommunen vurderer å legge ned den lille skolen i Fjordbygdene. Barna må i så fall pendle langt. Foreldre protesterer. Økonomer nikker.',
    ignoreEffect: { effects: { trust: -7, education: -5 }, meterEffects: { people: -6 } },
    choices: [
      {
        text: 'Legg ned og styrk sentralskolen',
        shortLabel: 'Legg ned',
        effects: { treasury: 6, education: 4, trust: -10, housing: -4 },
        meterEffects: { business: 4, people: -8 },
        flags: ['schoolClosure'],
      },
      {
        text: 'Behold skolen med statlig støtte',
        shortLabel: 'Behold',
        effects: { treasury: -9, trust: 8, education: 2 },
        meterEffects: { people: 7, business: -3 },
        flags: ['ruralSchool'],
      },
      {
        text: 'Omgjør til fådelt skole og kulturhus',
        shortLabel: 'Kulturhus',
        effects: { treasury: -5, trust: 6, education: 3, jobs: 2 },
        meterEffects: { people: 6, business: 1 },
        flags: ['communityHub'],
      },
    ],
  },

  // ─── TYPE A: VESTHAVET (2 nye) ─────────────────────────

  {
    id: 'fishing_quota',
    type: 'A',
    region: 'vesthavet',
    title: 'Fiskekvote-konflikt',
    description: 'Havforskerne anbefaler kraftig reduksjon i fiskekvotene. Fiskerne truer med å gå konkurs. Uten tiltak kollapser bestanden om få år.',
    ignoreEffect: { effects: { oceanEnv: -8, biodiversity: -6 }, meterEffects: { nature: -7 } },
    choices: [
      {
        text: 'Følg forskernes anbefaling fullt ut',
        shortLabel: 'Kvotkutt',
        effects: { oceanEnv: 14, biodiversity: 8, jobs: -10, treasury: -6 },
        meterEffects: { nature: 12, business: -8 },
        flags: ['fishingQuota'],
      },
      {
        text: 'Gradvise kutt over fire år',
        shortLabel: 'Gradvis',
        effects: { oceanEnv: 6, biodiversity: 3, jobs: -4 },
        meterEffects: { nature: 5, business: -3 },
        flags: ['gradualQuota'],
      },
      {
        text: 'Oppretthold kvotene – støtt fiskerne',
        shortLabel: 'Status quo',
        effects: { jobs: 3, treasury: 3, oceanEnv: -10, biodiversity: -7 },
        meterEffects: { business: 5, nature: -9 },
        flags: ['overfishing'],
      },
    ],
  },

  {
    id: 'marine_reserve',
    type: 'A',
    region: 'vesthavet',
    title: 'Marint verneområde',
    description: 'EU-direktiver og miljøorganisasjoner presser på for et marint verneområde i Vesthavet. Turistnæringen er positiv. Trålfiskerne er rasende.',
    ignoreEffect: { effects: { oceanEnv: -4 }, meterEffects: { nature: -3 } },
    choices: [
      {
        text: 'Opprett fullt marint reservat',
        shortLabel: 'Reservat',
        effects: { oceanEnv: 16, biodiversity: 12, jobs: -6, treasury: 4, trust: 5 },
        meterEffects: { nature: 13, business: -5 },
        flags: ['marineReserve'],
      },
      {
        text: 'Soner med begrensninger, ikke totalforbud',
        shortLabel: 'Soner',
        effects: { oceanEnv: 7, biodiversity: 5, jobs: -2 },
        meterEffects: { nature: 6, business: -2 },
        flags: ['marineZones'],
      },
      {
        text: 'Avvis – fiskerne trenger ro',
        shortLabel: 'Avvis',
        effects: { jobs: 4, trust: -4, oceanEnv: -5, biodiversity: -4 },
        meterEffects: { business: 5, nature: -7 },
        flags: ['marineRejected', 'overfishingRisk'],
      },
    ],
  },

  // ─── TYPE A: SKOGLANDET (2 nye) ────────────────────────

  {
    id: 'rewilding',
    type: 'A',
    region: 'skoglandet',
    title: 'Villmark-prosjekt',
    description: 'En stiftelse vil finansiere et storstilt villmarks-restaureringsprosjekt i Skoglandet. Ulv og bjørn kan komme tilbake. Bøndene er livredde.',
    ignoreEffect: { effects: { trust: -2 }, meterEffects: { nature: -2 } },
    choices: [
      {
        text: 'Godkjenn fullt rewilding-prosjekt',
        shortLabel: 'Rewilding',
        effects: { biodiversity: 18, trust: -8, jobs: -4, treasury: 5 },
        meterEffects: { nature: 15, business: -6, people: -4 },
        flags: ['rewilding'],
      },
      {
        text: 'Begrenset restaurering uten rovdyr',
        shortLabel: 'Begrenset',
        effects: { biodiversity: 8, trust: 2, treasury: 3 },
        meterEffects: { nature: 7, business: -1 },
        flags: ['partialRewilding'],
      },
      {
        text: 'Avslå – ivareta bøndenes interesser',
        shortLabel: 'Avslå',
        effects: { trust: 5, jobs: 2, biodiversity: -3 },
        meterEffects: { people: 4, nature: -4 },
        flags: [],
      },
    ],
  },

  {
    id: 'mining_concession',
    type: 'A',
    region: 'skoglandet',
    title: 'Gruveselskap vil inn',
    description: 'Et gruveselskap har funnet mineralforekomster i Skoglandet. Verdiene er enorme. Inngrepet likeså. Samiske interesseorganisasjoner krever å bli hørt.',
    ignoreEffect: { effects: { treasury: -5, trust: -3 }, meterEffects: { business: -3 } },
    choices: [
      {
        text: 'Gi konsesjon – øya trenger inntektene',
        shortLabel: 'Gruve',
        effects: { jobs: 16, treasury: 18, biodiversity: -16, areaPress: 12, trust: -6 },
        meterEffects: { business: 14, nature: -13 },
        flags: ['miningConcession'],
      },
      {
        text: 'Gi begrenset konsesjon med strenge krav',
        shortLabel: 'Begrenset',
        effects: { jobs: 8, treasury: 8, biodiversity: -8, areaPress: 5, trust: -2 },
        meterEffects: { business: 7, nature: -7 },
        flags: ['limitedMining'],
      },
      {
        text: 'Avslå – beskytt urørte naturområder',
        shortLabel: 'Avslå',
        effects: { biodiversity: 5, trust: 8, jobs: -3 },
        meterEffects: { nature: 8, business: -5 },
        flags: ['miningRejected'],
      },
    ],
  },

  // ─── TYPE A: HAVNEBYEN (2 nye) ─────────────────────────

  {
    id: 'port_expansion',
    type: 'A',
    region: 'havnebyen',
    title: 'Havneutvidelse',
    description: 'Rederiene presser på for å utvide Havnebyens kai-kapasitet. Det vil trekke mer skipstrafikk – og mer støy, støv og utslipp til bydelene rundt.',
    ignoreEffect: { effects: { jobs: -5, treasury: -4 }, meterEffects: { business: -4 } },
    choices: [
      {
        text: 'Bygg ut havnen i fullt omfang',
        shortLabel: 'Full utbygging',
        effects: { jobs: 12, treasury: 14, emissions: 10, health: -6, trust: -4, oceanEnv: -5 },
        meterEffects: { business: 13, nature: -7, people: -4 },
        flags: ['portExpansion'],
      },
      {
        text: 'Moderat utbygging med miljøkrav',
        shortLabel: 'Moderat',
        effects: { jobs: 6, treasury: 7, emissions: 4, health: -2 },
        meterEffects: { business: 7, nature: -4 },
        flags: ['greenPort'],
      },
      {
        text: 'Konverter til containerterminal med lavutslipp',
        shortLabel: 'Grønn havn',
        effects: { jobs: 4, treasury: 4, emissions: -3, health: 3 },
        meterEffects: { business: 4, nature: 2, people: 3 },
        flags: ['cleanPort'],
      },
    ],
  },

  {
    id: 'air_quality',
    type: 'A',
    region: 'havnebyen',
    title: 'Luftkvaliteten er kritisk',
    description: 'Helseundersøkelser viser at luftkvaliteten i Havnebyen er blant de dårligste i regionen. Barn og eldre rammes hardest. Industrien mener kravene er urealistiske.',
    ignoreEffect: { effects: { health: -8, trust: -5 }, meterEffects: { people: -7 } },
    choices: [
      {
        text: 'Innfør strenge utslippsgrenser',
        shortLabel: 'Strenge krav',
        effects: { health: 12, trust: 7, jobs: -5, treasury: -6, emissions: -10 },
        meterEffects: { people: 10, nature: 5, business: -6 },
        flags: ['airQualityLaw'],
      },
      {
        text: 'Innfør gradvise forbedringskrav',
        shortLabel: 'Gradvis',
        effects: { health: 5, trust: 3, emissions: -5 },
        meterEffects: { people: 4, nature: 3, business: -2 },
        flags: ['airQualityGradual'],
      },
      {
        text: 'Avvent – industrien lover frivillige tiltak',
        shortLabel: 'Avvent',
        effects: { health: -4, trust: -4, emissions: 3 },
        meterEffects: { people: -5, business: 3 },
        flags: ['industrialPollution'],
      },
    ],
  },

  // ─── TYPE A: SENTRUM (2 nye) ────────────────────────────

  {
    id: 'youth_crisis',
    type: 'A',
    region: 'sentrum',
    title: 'Ungdomskrisen',
    description: 'Psykisk helse blant unge på øya er på et historisk lavpunkt. Helsesøstrene er overbelastet. Skolene vet ikke hva de skal gjøre.',
    ignoreEffect: { effects: { health: -7, trust: -6, education: -4 }, meterEffects: { people: -8 } },
    choices: [
      {
        text: 'Bygg nytt ungdomssenter og ansett miljøterapeuter',
        shortLabel: 'Ungdomssenter',
        effects: { health: 10, trust: 8, education: 5, treasury: -12, jobs: 4 },
        meterEffects: { people: 10, business: -4 },
        flags: ['youthCenter'],
      },
      {
        text: 'Styrk skolehelsetjenesten',
        shortLabel: 'Skolehelsetjeneste',
        effects: { health: 6, education: 4, treasury: -7, trust: 4 },
        meterEffects: { people: 7, business: -2 },
        flags: ['schoolHealth'],
      },
      {
        text: 'Samarbeid med frivillige organisasjoner',
        shortLabel: 'Frivillighet',
        effects: { health: 4, trust: 6, treasury: -3 },
        meterEffects: { people: 5 },
        flags: ['volunteerNetwork', 'youthNeglect'],
      },
    ],
  },

  {
    id: 'school_reform',
    type: 'A',
    region: 'sentrum',
    title: 'Skolestruktur til debatt',
    description: 'En ekspertgruppe foreslår å reformere skolesystemet: mer praktisk læring, færre karakterer, og lengre skoledager. Lærerne er skeptiske. Næringslivet er positive.',
    ignoreEffect: { effects: { education: -4, trust: -3 }, meterEffects: { people: -3 } },
    choices: [
      {
        text: 'Innfør full reform',
        shortLabel: 'Full reform',
        effects: { education: 10, trust: -5, jobs: 3, treasury: -10 },
        meterEffects: { people: 6, business: 4 },
        flags: ['schoolReform'],
      },
      {
        text: 'Pilotprosjekt i to skoler',
        shortLabel: 'Pilot',
        effects: { education: 4, trust: 2, treasury: -4 },
        meterEffects: { people: 3, business: 2 },
        flags: ['schoolPilot'],
      },
      {
        text: 'Avvis – lærerne må få bestemme',
        shortLabel: 'Avvis',
        effects: { trust: 5, education: -2 },
        meterEffects: { people: 3, business: -2 },
        flags: ['reformRejected'],
      },
    ],
  },

  // ─── TYPE B: NYE KONSEKVENSHENDELSER (7) ───────────────

  {
    id: 'solar_birds',
    type: 'B',
    minYear: 5,
    region: 'nordkysten',
    requires: { flags: ['solarFarm'], any: false },
    causedBy: {
      solarFarm: 'Etter at {navn} godkjente det store solcelleanlegget, har trekkfuglene mistet viktige beiteområder på Nordkysten.',
    },
    title: 'Trekkfuglene forsvinner',
    newsHeadline: 'Millioner av trekkfugler omkom',
    newsIngress: 'Ornitologer melder om dramatisk nedgang i trekkfuglbestander langs Nordkysten. Solcelleanlegget som {navn} godkjente, dekker nøkkelområder for mat og hvile.',
    choices: [
      {
        text: 'Lag fuglevennlige korridorer gjennom anlegget',
        shortLabel: 'Korridorer',
        effects: { biodiversity: 8, treasury: -6 },
        meterEffects: { nature: 6 },
        flags: ['birdCorridors'],
      },
      {
        text: 'Anlegget har prioritet – ta tapet til etterretning',
        shortLabel: 'Godta tapet',
        effects: { biodiversity: -6, trust: -3 },
        meterEffects: { nature: -5 },
        flags: [],
      },
    ],
  },

  {
    id: 'coal_smog',
    type: 'B',
    minYear: 5,
    region: 'havnebyen',
    requires: { flags: ['coalPlant', 'industrialPollution'], any: true },
    causedBy: {
      coalPlant: 'Etter at {navn} reaktiverte kullkraftverket, har luftforurensningen i Havnebyen nådd farenivå.',
      industrialPollution: 'Industrien i Havnebyen har lenge sluppet ut mer enn loven tillater. Nå har det gått for langt.',
    },
    title: 'Smog over Havnebyen',
    newsHeadline: 'Sykehusinnleggelser doblet etter kullstart',
    newsIngress: 'Luftkvaliteten i Havnebyen er nå blant de dårligste i landet. Legevakten melder om dramatisk økning – en direkte konsekvens av kullkraftverket {navn} valgte å reaktivere.',
    choices: [
      {
        text: 'Steng kullkraftverket umiddelbart',
        shortLabel: 'Steng',
        effects: { emissions: -15, health: 8, energy: -12, jobs: -6 },
        meterEffects: { nature: 10, people: 7, business: -8 },
        flags: [],
      },
      {
        text: 'Installer renseanlegg – behold driften',
        shortLabel: 'Renseanlegg',
        effects: { emissions: -8, health: 3, treasury: -10 },
        meterEffects: { nature: 4, people: 3, business: -3 },
        flags: ['coalFilter'],
      },
    ],
  },

  {
    id: 'overfishing_collapse',
    type: 'B',
    minYear: 5,
    region: 'vesthavet',
    requires: { flags: ['overfishing', 'overfishingRisk', 'oceanDisruption'], any: true },
    causedBy: {
      overfishing: 'Etter at {navn} opprettholdt fiskekvotene mot havforskernes råd, har bestanden kollapset.',
      overfishingRisk: 'Fiskeritrykket har vært for høyt for lenge. Bestanden har nå nådd kritisk lavt nivå.',
      oceanDisruption: 'Havvindutbyggingen {navn} godkjente forstyrret gyteområdene. Fiskebestanden har ikke hentet seg inn.',
    },
    title: 'Fiskebestanden kollapser',
    newsHeadline: 'Tomt hav – fiskeriene stanser',
    newsIngress: 'Det havforskerne advarte mot har skjedd: bestanden er under kritisk nivå. Fiskerne som {navn} ville beskytte, har nå ingen fisk å fange.',
    choices: [
      {
        text: 'Innfør totalfredning i fem år',
        shortLabel: 'Totalfredning',
        effects: { oceanEnv: 18, biodiversity: 12, jobs: -14, treasury: -10 },
        meterEffects: { nature: 15, business: -12, people: -5 },
        flags: ['fishingBan'],
      },
      {
        text: 'Minimumskvoter og statlig støtte til fiskerne',
        shortLabel: 'Minimumskvote',
        effects: { oceanEnv: 8, jobs: -6, treasury: -12 },
        meterEffects: { nature: 7, business: -6, people: -2 },
        flags: [],
      },
    ],
  },

  {
    id: 'pesticide_bees',
    type: 'B',
    minYear: 5,
    region: 'fjordbygdene',
    requires: { flags: ['pesticides', 'intensiveFarming'], any: true },
    causedBy: {
      pesticides: 'Etter at {navn} tillot bruk av de omdiskuterte sprøytemidlene, har birøkterne i Fjordbygdene mistet store deler av birøkteriene sine.',
      intensiveFarming: 'Det intensive landbruket {navn} prioriterte har tæret på pollinatorene. Bibestandene kollapser.',
    },
    title: 'Birøkterne mister biene',
    newsHeadline: 'Katastrofe for pollinatorene',
    newsIngress: 'Birøktere i Fjordbygdene rapporterer om massedød i kubene. Eksperter peker på sprøytemidlene {navn} tillot. Uten pollinering trues matproduksjonen.',
    choices: [
      {
        text: 'Forbud mot de aktuelle midlene',
        shortLabel: 'Forbud',
        effects: { biodiversity: 10, health: 5, trust: 6, treasury: -5 },
        meterEffects: { nature: 8, people: 4, business: -4 },
        flags: ['pesticideBan'],
      },
      {
        text: 'Kompenser birøkterne, tillat videre bruk',
        shortLabel: 'Kompenser',
        effects: { biodiversity: -4, trust: -3, treasury: -7 },
        meterEffects: { nature: -5, business: 2 },
        flags: [],
      },
    ],
  },

  {
    id: 'mine_water',
    type: 'B',
    minYear: 6,
    region: 'skoglandet',
    requires: { flags: ['miningConcession', 'limitedMining', 'irrigation'], any: true },
    causedBy: {
      miningConcession: 'Etter at {navn} ga gruveselskapet konsesjon, lekker tungmetaller fra driften ut i grunnvannet.',
      limitedMining: 'Til tross for kravene {navn} stilte, har gruveavfall funnet veien til grunnvannet i Skoglandet.',
      irrigation: 'Irrigasjonsanlegget {navn} bygde har senket grunnvannstanden kritisk. Nå er vannet forurenset av avrenning.',
    },
    title: 'Gruveavfall i grunnvannet',
    newsHeadline: 'Drikkevannet er forurenset',
    newsIngress: 'Laboratorieprøver viser tungmetaller i drikkevann fra Skoglandet. Konsesjonen {navn} ga har fått alvorlige konsekvenser for folk og fauna.',
    choices: [
      {
        text: 'Steng gruven og iverksett opprydding',
        shortLabel: 'Steng og rydd',
        effects: { biodiversity: 6, health: 8, jobs: -10, treasury: -15 },
        meterEffects: { nature: 8, people: 7, business: -10 },
        flags: [],
      },
      {
        text: 'Pålegg gruven å finansiere opprydding selv',
        shortLabel: 'Gruven rydder',
        effects: { biodiversity: 3, health: 4, trust: 4 },
        meterEffects: { nature: 4, people: 4, business: -3 },
        flags: [],
      },
    ],
  },

  {
    id: 'port_neighborhood',
    type: 'B',
    minYear: 5,
    region: 'havnebyen',
    requires: { flags: ['portExpansion', 'densityConflict'], any: true },
    causedBy: {
      portExpansion: 'Etter at {navn} godkjente havneutvidelsen, er boligområdene rundt havnen blitt ubeboelige av støy og støv.',
      densityConflict: 'Den tette utbyggingen {navn} valgte har skapt konflikter mellom naboer om lys, støy og parkering. Nå koker det over.',
    },
    title: 'Havnebyen raser',
    newsHeadline: 'Naboer flykter fra havneområdet',
    newsIngress: 'Beboere nær havnen sover ikke lenger. Barnefamilier pakker og drar. Eiendomsprisene stuper. Utvidelsen {navn} godkjente har forandret hverdagen for tusenvis.',
    choices: [
      {
        text: 'Kjøp ut beboerne og eksproprier',
        shortLabel: 'Eksproprier',
        effects: { treasury: -18, trust: -6, housing: -8 },
        meterEffects: { people: -7, business: 5 },
        flags: [],
      },
      {
        text: 'Bygg støyskjermer og kompenser naboene',
        shortLabel: 'Støyskjermer',
        effects: { treasury: -10, trust: 3, health: 4 },
        meterEffects: { people: 4, business: -2 },
        flags: ['noiseBarrier'],
      },
    ],
  },

  {
    id: 'rewilding_livestock',
    type: 'B',
    minYear: 5,
    region: 'fjordbygdene',
    requires: { flags: ['rewilding'], any: false },
    causedBy: {
      rewilding: 'Etter at {navn} åpnet for rewilding-prosjektet, har ulvene tatt seg inn i Fjordbygdene og angrepet buskap.',
    },
    title: 'Ulv tar buskap',
    newsHeadline: 'Bøndene krever {navn} tar ansvar',
    newsIngress: 'Tre gårdsbruk i Fjordbygdene har mistet dyr til ulv de siste månedene. Rewilding-prosjektet {navn} godkjente sender sjokkbølger gjennom landbrukssamfunnet.',
    choices: [
      {
        text: 'Tillat skadefelling av ulv',
        shortLabel: 'Felling',
        effects: { trust: 6, biodiversity: -8, jobs: 2 },
        meterEffects: { people: 5, nature: -8 },
        flags: ['wolfCull'],
      },
      {
        text: 'Kompenser bøndene og behold ulven',
        shortLabel: 'Kompenser',
        effects: { trust: 2, treasury: -8, biodiversity: 3 },
        meterEffects: { people: 2, nature: 2, business: -4 },
        flags: [],
      },
    ],
  },

  // ─── TYPE C: NYE SYSTEMHENDELSER (3) ───────────────────

  {
    id: 'climate_flood',
    type: 'C',
    minYear: 10,
    region: 'sentrum',
    requires: { variable: 'emissions', above: 70 },
    title: 'Ekstremflom i Sentrum',
    description: 'Klimaendringene har kommet til øya. En ekstremnedbør har oversvømt deler av Sentrum. Kjellerene er fulle, veiene er stengt, og eldre innbyggere er evakuert.',
    ignoreEffect: { effects: { health: -8, housing: -10, trust: -8 }, meterEffects: { people: -9, business: -5 } },
    choices: [
      {
        text: 'Bygg flomvern og klimatilpass Sentrum',
        shortLabel: 'Flomvern',
        effects: { housing: 8, health: 5, trust: 6, treasury: -14, emissions: -3 },
        meterEffects: { people: 8, nature: 3, business: -5 },
        flags: ['floodBarrier'],
      },
      {
        text: 'Akutt opprydding, ingen langsiktig plan',
        shortLabel: 'Akutt',
        effects: { housing: 3, trust: -3, treasury: -6 },
        meterEffects: { people: 2, business: -2 },
        flags: [],
      },
    ],
  },

  {
    id: 'nature_collapse',
    type: 'C',
    minYear: 9,
    region: 'skoglandet',
    requires: { variable: 'biodiversity', below: 25 },
    title: 'Naturkrisen er her',
    description: 'Biologer erklærer naturkrise på øya. Insektbestander er nede med 60 %. Fuglearter forsvinner. Pollinering svikter. Matproduksjonen rammes.',
    ignoreEffect: { effects: { biodiversity: -8, health: -6, jobs: -5 }, meterEffects: { nature: -10, people: -5 } },
    choices: [
      {
        text: 'Nasjonalpark og streng vernestatus',
        shortLabel: 'Nasjonalpark',
        effects: { biodiversity: 16, areaPress: -8, jobs: -6, treasury: -8, trust: 4 },
        meterEffects: { nature: 14, business: -7 },
        flags: ['nationalPark'],
      },
      {
        text: 'Restaureringstiltak på tvers av sektorer',
        shortLabel: 'Restaurering',
        effects: { biodiversity: 10, treasury: -10, trust: 5, jobs: 3 },
        meterEffects: { nature: 9, people: 3, business: -3 },
        flags: ['ecoRestoration'],
      },
    ],
  },

  {
    id: 'trust_collapse',
    type: 'C',
    minYear: 8,
    region: 'sentrum',
    requires: { variable: 'trust', below: 20 },
    title: 'Tillitskrisen',
    description: 'Øyas innbyggere har mistet troen på lederskapet. Valgdeltagelsen har stupt. Lokalavisen kjører sak etter sak. Noe dramatisk må skje.',
    ignoreEffect: { effects: { trust: -15, treasury: -6 }, meterEffects: { people: -12, business: -5 } },
    choices: [
      {
        text: 'Kunngjør full gjennomsiktighet – offentliggjør alle beslutninger',
        shortLabel: 'Åpenhet',
        effects: { trust: 16, treasury: -5, jobs: 2 },
        meterEffects: { people: 12, business: 2 },
        flags: ['transparency'],
      },
      {
        text: 'Utnevn uavhengig gransningskommisjon',
        shortLabel: 'Granskning',
        effects: { trust: 10, treasury: -8, trust2: 0 },
        meterEffects: { people: 8, business: -2 },
        flags: ['inquiry'],
      },
    ],
  },
];

// ─── Trekk aktive regioner for et år ─────────────────
// year: nåværende år (1–15)
export function drawYearRegions(variables, flags, usedEventIds, year = 1) {
  const regionIds = Object.keys(REGIONS);

  const regionEventMap = {};
  for (const regionId of regionIds) {
    const candidates = EVENTS.filter(ev => {
      if (ev.region !== regionId) return false;
      if (usedEventIds.has(ev.id)) return false;

      // minYear-filter
      if (ev.minYear && year < ev.minYear) return false;

      // Type B og C skal ikke konkurrere med A i starten
      // (dette er allerede håndtert av minYear, men dobbeltsjekk)
      if (ev.type === 'B' && year < 4) return false;
      if (ev.type === 'C' && year < 9) return false;

      if (ev.requires) {
        if (ev.requires.flags) {
          const { flags: reqFlags, any } = ev.requires;
          const hasFlag = reqFlags.some(f => flags.includes(f));
          if (any && !hasFlag) return false;
          if (!any && !reqFlags.every(f => flags.includes(f))) return false;
        }
        if (ev.requires.variable) {
          const val = variables[ev.requires.variable] ?? 50;
          if (ev.requires.below !== undefined && val >= ev.requires.below) return false;
          if (ev.requires.above !== undefined && val <= ev.requires.above) return false;
        }
      }
      return true;
    });

    // Vektlegging: år 11–15 prioriterer C sterkt, år 6–10 prioriterer B
    const weighted = [];
    for (const ev of candidates) {
      let w = 1;
      if (ev.type === 'C' && year >= 11) w = 4;
      else if (ev.type === 'C' && year >= 9) w = 2;
      else if (ev.type === 'B' && year >= 6) w = 2;
      for (let i = 0; i < w; i++) weighted.push(ev);
    }

    if (weighted.length > 0) {
      regionEventMap[regionId] = weighted[Math.floor(Math.random() * weighted.length)];
    }
  }

  const available = Object.keys(regionEventMap);
  const shuffled = available.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 3);

  const result = {};
  for (const r of picked) result[r] = regionEventMap[r];
  return result;
}

// ════════════════════════════════════════════════════════
// NYE HENDELSER – runde 2
// ════════════════════════════════════════════════════════

// Legg til i FLAG_MAP_ICONS og CONSEQUENCE_MAP_ICONS ovenfor ved neste revisjon.
// Nye flagg: solarFarm, coalPlant, fishingQuota, marineReserve, pesticides,
//            organicFarming, schoolReform, youthCenter, roadExpansion, portExpansion,
//            miningConcession, rewilder, floodBarrier, droughtResponse, airQualityLaw

