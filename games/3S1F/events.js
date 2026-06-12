// events.js – Hendelsesdatabase

export const REGIONS = {
  nordkysten:  { id: 'nordkysten',  name: 'Nordkysten',   icon: '⚡', color: '#E8C547', theme: 'Energi' },
  skoglandet:  { id: 'skoglandet',  name: 'Skoglandet',   icon: '🌲', color: '#5BBFAD', theme: 'Skog og natur' },
  fjordbygdene:{ id: 'fjordbygdene',name: 'Fjordbygdene', icon: '🚜', color: '#7FB97F', theme: 'Landbruk' },
  vesthavet:   { id: 'vesthavet',   name: 'Vesthavet',    icon: '🐟', color: '#4A9CC2', theme: 'Fiskeri og havbruk' },
  havnebyen:   { id: 'havnebyen',   name: 'Havnebyen',    icon: '🏭', color: '#9A8EC0', theme: 'Industri' },
  sentrum:     { id: 'sentrum',     name: 'Sentrum',      icon: '🏘️', color: '#E87D5B', theme: 'Bolig og helse' },
};

// Type A – Grunnhendelser (kan komme når som helst)
// Type B – Konsekvenser (krever flagg)
// Type C – Systemhendelser (trigges av verdier under terskel)

export const EVENTS = [

  // ─── TYPE A: GRUNNHENDELSER ───────────────────────────

  {
    id: 'energy_crisis',
    type: 'A',
    region: 'nordkysten',
    title: 'Strømkrise',
    description: 'Bedriftene varsler at de trenger mer energi. Uten tiltak vil industrien stagnere – men utbygging koster.',
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
        effects: { jobs: 3, energy: 10, biodiversity: -6, wildernessArea: -8 },
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
    weight: { nordkysten: 3, havnebyen: 2 },
  },

  {
    id: 'housing_shortage',
    type: 'A',
    region: 'sentrum',
    title: 'Boligmangel',
    description: 'Ventelistene på kommunale boliger er lange. Unge familier flytter fra øya. Noe må gjøres.',
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
    weight: { sentrum: 3, fjordbygdene: 1 },
  },

  {
    id: 'fish_farm_expansion',
    type: 'A',
    region: 'vesthavet',
    title: 'Oppdrettsutvidelse',
    description: 'Et stort oppdrettsselskap vil etablere seg i Vesthavet. Mange arbeidsplasser – men naboene er urolige for havmiljøet.',
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
    weight: { vesthavet: 3, sentrum: 1 },
  },

  {
    id: 'nurse_shortage',
    type: 'A',
    region: 'sentrum',
    title: 'Sykepleiermangel',
    description: 'Sykehuset melder om kritisk underbemanning. Pasienter venter lenge. Ansatte er utbrent.',
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
    weight: { sentrum: 3 },
  },

  {
    id: 'logging_demand',
    type: 'A',
    region: 'skoglandet',
    title: 'Hogstpress',
    description: 'Trelastindustrien vil inn i Skoglandet. Skogeier-organisasjonen støtter det. Miljøgrupper advarer.',
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
    weight: { skoglandet: 3, fjordbygdene: 1 },
  },

  {
    id: 'industrial_relocation',
    type: 'A',
    region: 'havnebyen',
    title: 'Ny fabrikk vil etablere seg',
    description: 'En stor produksjonsbedrift vil flytte til Havnebyen. 200 arbeidsplasser – men fabrikken er kjent for høye utslipp.',
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
    weight: { havnebyen: 3, nordkysten: 1 },
  },

  {
    id: 'agriculture_subsidy',
    type: 'A',
    region: 'fjordbygdene',
    title: 'Bønder krever støtte',
    description: 'Fjordbygdenes bønder trenger subsidier for å holde driften lønnsom. Uten støtte kan matproduksjonen falle.',
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
    weight: { fjordbygdene: 3, sentrum: 1 },
  },

  // ─── TYPE B: KONSEKVENSHENDELSER ─────────────────────

  {
    id: 'owl_disappears',
    type: 'B',
    region: 'skoglandet',
    requires: { flags: ['windFarm', 'industrialLogging'], any: true },
    title: 'Hubroen forsvinner',
    description: 'Biologer registrerer at hubro ikke lenger hekker i Skoglandet. Habitatene er for forstyrrede.',
    choices: [
      {
        text: 'Iverksett akutt verneplan',
        shortLabel: 'Verneplan',
        effects: { biodiversity: 8, treasury: -5, trust: 3 },
        meterEffects: { nature: 6 },
        flags: ['owlProtection'],
      },
      {
        text: 'Registrer tapet, gå videre',
        shortLabel: 'Godta tapet',
        effects: { biodiversity: -4, trust: -2 },
        meterEffects: { nature: -4 },
        flags: [],
      },
    ],
    weight: { skoglandet: 2 },
  },

  {
    id: 'salmon_lice',
    type: 'B',
    region: 'vesthavet',
    requires: { flags: ['bigAquaculture'], any: false },
    title: 'Lakselus sprer seg',
    description: 'Villfisken sliter. Lakselus fra oppdrettsanleggene har bredt seg til nærliggende fjorder.',
    choices: [
      {
        text: 'Stengt ned anlegg midlertidig',
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
    weight: { vesthavet: 2 },
  },

  {
    id: 'health_crisis',
    type: 'B',
    region: 'sentrum',
    requires: { flags: ['healthPrivate'], any: false },
    title: 'Helsekrise i Sentrum',
    description: 'Den private klinikken betjener bare betalende pasienter. Sykehuset er overbelastet. Folk med dårlig råd faller utenfor.',
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
    weight: { sentrum: 2 },
  },

  // ─── TYPE C: SYSTEMHENDELSER ──────────────────────────

  {
    id: 'big_protests',
    type: 'C',
    region: 'sentrum',
    requires: { variable: 'trust', below: 30 },
    title: 'Store protester',
    description: 'Innbyggerne er lei av å ikke bli hørt. Tusenvis marsjerer gjennom Sentrum. Noe må ofres.',
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
    weight: { sentrum: 3 },
  },

  {
    id: 'economic_stagnation',
    type: 'C',
    region: 'havnebyen',
    requires: { variable: 'jobs', below: 35 },
    title: 'Øya stagnerer',
    description: 'Unge flytter ut i hopetall. Butikker stenger. Øya trenger et løft – men hva slags?',
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
    weight: { havnebyen: 2, fjordbygdene: 1 },
  },
];

// Hjelpefunksjoner

export function getEventsForYear(year, variables, flags, activeRegion) {
  const available = EVENTS.filter(ev => {
    // Sjekk krav
    if (ev.requires) {
      if (ev.requires.flags) {
        const { flags: reqFlags, any } = ev.requires;
        const hasFlags = reqFlags.some(f => flags.includes(f));
        if (any && !hasFlags) return false;
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

  // Vekt basert på aktiv region
  const weighted = [];
  available.forEach(ev => {
    const w = activeRegion && ev.weight?.[activeRegion] ? ev.weight[activeRegion] : 1;
    for (let i = 0; i < w; i++) weighted.push(ev);
  });

  // Trekk ut 2–3 unike
  const shuffled = weighted.sort(() => Math.random() - 0.5);
  const seen = new Set();
  const picked = [];
  for (const ev of shuffled) {
    if (!seen.has(ev.id)) {
      seen.add(ev.id);
      picked.push(ev);
      if (picked.length >= 3) break;
    }
  }

  // Første er obligatorisk
  return picked.map((ev, i) => ({ ...ev, mandatory: i === 0 }));
}
