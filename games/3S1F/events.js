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
};

// Konsekvens-ikoner som vises på kartet (uavhengig av valg – bare ved at hendelsen er aktiv)
export const CONSEQUENCE_MAP_ICONS = {
  owl_disappears:      { emoji: '⚠️', region: 'skoglandet',   label: 'Hubroen forsvinner' },
  salmon_lice:         { emoji: '☠️', region: 'vesthavet',    label: 'Lakselus' },
  health_crisis:       { emoji: '🚨', region: 'sentrum',      label: 'Helsekrise' },
  big_protests:        { emoji: '✊', region: 'sentrum',      label: 'Protester' },
  economic_stagnation: { emoji: '📉', region: 'havnebyen',    label: 'Stagnasjon' },
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
        flags: ['suburbanExpansion'],
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
        flags: ['heavyIndustry'],
      },
      {
        text: 'Ja, men krev utslippskutt',
        shortLabel: 'Betinget',
        effects: { jobs: 12, treasury: 6, emissions: 5 },
        meterEffects: { business: 8, nature: -4 },
        flags: ['conditionalIndustry'],
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
        flags: ['farmSubsidy'],
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
        flags: ['marketFarming'],
      },
    ],
  },

  // ─── TYPE B: KONSEKVENSHENDELSER ─────────────────────
  // causedBy: forklarer koblingen med spillerens navn flettet inn

  {
    id: 'owl_disappears',
    type: 'B',
    region: 'skoglandet',
    requires: { flags: ['windFarm', 'industrialLogging'], any: true },
    causedBy: {
      windFarm:        'Etter at {navn} lot vindparken reise seg på høyfjellet, har trekkrutene til rovfuglene blitt brutt.',
      industrialLogging: 'Etter at {navn} åpnet Skoglandet for industriell hogst, har habitatene blitt for forstyrrede.',
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
    region: 'vesthavet',
    requires: { flags: ['bigAquaculture'], any: false },
    causedBy: {
      bigAquaculture: 'Etter at {navn} godkjente full utbygging av oppdrettsanlegg i Vesthavet, har lakselusbestanden eksplodert.',
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
    region: 'sentrum',
    requires: { flags: ['healthPrivate'], any: false },
    causedBy: {
      healthPrivate: 'Etter at {navn} privatiserte deler av helsetilbudet, har køene på det offentlige sykehuset blitt kritisk lange.',
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
];

// ─── Trekk 3 aktive regioner for et år ────────────────
export function drawYearRegions(variables, flags, usedEventIds) {
  const regionIds = Object.keys(REGIONS);

  const regionEventMap = {};
  for (const regionId of regionIds) {
    const candidates = EVENTS.filter(ev => {
      if (ev.region !== regionId) return false;
      if (usedEventIds.has(ev.id)) return false;
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
    if (candidates.length > 0) {
      regionEventMap[regionId] = candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  const available = Object.keys(regionEventMap);
  const shuffled = available.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 3);

  const result = {};
  for (const r of picked) result[r] = regionEventMap[r];
  return result;
}
