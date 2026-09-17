/* =========================================================
   BEGREPER — Naturfag / Celler
   27 begreper med en faglig vurdert egenskapsmatrise.

   VIKTIG om null: null betyr "spørsmålet gir ikke mening for
   akkurat dette begrepet" — IKKE "nei". Bruk null sparsomt og kun
   der et ja/nei-svar faktisk ville vært misvisende (f.eks. om
   cellekjernen "ligger inne i cellekjernen", eller om ORGANELL som
   samlebegrep "krever membran" når noen organeller gjør det og
   andre ikke). Der det finnes et faglig riktig ja/nei, skal det stå
   eksplisitt — en tom verdi må ALDRI brukes som snarvei for "nei".

   concept() krever at ALLE properties i PROPERTY_IDS er satt
   eksplisitt (true/false/null), slik at ingen egenskap glemmes
   ved en feiltakelse.
   ========================================================= */

import { PROPERTY_IDS } from './properties.js';

function concept(id, name, definition, values) {
  const missing = PROPERTY_IDS.filter((key) => !(key in values));
  if (missing.length) {
    throw new Error(`${id}: mangler properties: ${missing.join(', ')}`);
  }
  const extra = Object.keys(values).filter((key) => !PROPERTY_IDS.includes(key));
  if (extra.length) {
    throw new Error(`${id}: ukjente properties: ${extra.join(', ')}`);
  }
  return { id, name, definition, topicIds: ['cells'], properties: { ...values } };
}

const T = true;
const F = false;
const N = null;

export const CONCEPTS = [
  concept('cellemembran', 'CELLEMEMBRAN',
    'Den tynne «huden» rundt cellen som bestemmer hva som slipper inn og ut.', {
      is_process: F, is_organelle: F, is_cell_structure: T, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: T, requires_membrane: N,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: T, related_to_water: T, related_to_proteins: N,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('cellekjerne', 'CELLEKJERNE',
    'Styringssenteret i cellen som inneholder arvestoffet.', {
      is_process: F, is_organelle: T, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: N, surrounds_cell: F, requires_membrane: T,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: T, related_to_cell_division: T,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('cytoplasma', 'CYTOPLASMA',
    'Den geléaktige væsken inne i cellen der organellene ligger.', {
      is_process: F, is_organelle: F, is_cell_structure: T, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: F,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: N, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('mitokondrie', 'MITOKONDRIE',
    'Organellen som lager energi til cellen — ofte kalt «kraftverket».', {
      is_process: F, is_organelle: T, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: T,
      related_to_energy: T, related_to_photosynthesis: F, related_to_cell_respiration: T,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: T,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('kloroplast', 'KLOROPLAST',
    'Organellen i planteceller der fotosyntesen skjer.', {
      is_process: F, is_organelle: T, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: F,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: T,
      related_to_energy: T, related_to_photosynthesis: T, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('cellevegg', 'CELLEVEGG',
    'Den stive, ekstra beskyttelsen utenfor cellemembranen hos planter.', {
      is_process: F, is_organelle: F, is_cell_structure: T, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: F,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: T, requires_membrane: F,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: T, used_to_observe_cells: F,
    }),

  concept('vakuole', 'VAKUOLE',
    'Rom i cellen som lagrer vann, næringsstoffer eller avfall.', {
      is_process: F, is_organelle: T, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: T,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: T, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: T, provides_structural_support: T, used_to_observe_cells: F,
    }),

  concept('ribosom', 'RIBOSOM',
    'Liten struktur i cellen som produserer proteiner.', {
      is_process: F, is_organelle: T, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: F,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: T,
      produces_proteins: T, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('kromosom', 'KROMOSOM',
    'Tettpakket streng av arvestoff (DNA) i cellekjernen.', {
      is_process: F, is_organelle: F, is_cell_structure: T, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: T, surrounds_cell: F, requires_membrane: F,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: T, related_to_cell_division: T,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('arvestoff', 'ARVESTOFF',
    'Informasjonen (DNA) som bestemmer egenskapene til en organisme.', {
      is_process: F, is_organelle: F, is_cell_structure: F, is_molecule: T,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: T, surrounds_cell: F, requires_membrane: F,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: T, related_to_cell_division: T,
      related_to_transport: F, related_to_water: F, related_to_proteins: T,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('celledeling', 'CELLEDELING',
    'Prosessen der én celle blir til to nye celler.', {
      is_process: T, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: N,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: T, related_to_cell_division: T,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('stamcelle', 'STAMCELLE',
    'En udifferensiert celle som kan utvikle seg til mange ulike celletyper.', {
      is_process: F, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: T, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: N, found_in_animal_cell: T,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: N,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: T,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('eukaryot', 'EUKARYOT',
    'Celletype som har en cellekjerne omsluttet av membran.', {
      is_process: F, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: T, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: N, surrounds_cell: F, requires_membrane: N,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('prokaryot', 'PROKARYOT',
    'Enkel celletype uten cellekjerne, for eksempel bakterier.', {
      is_process: F, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: T, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: F, found_in_animal_cell: F,
      found_in_prokaryotes: T, found_in_eukaryotes: F,
      inside_nucleus: N, surrounds_cell: F, requires_membrane: N,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('flercellet', 'FLERCELLET',
    'En organisme bygd opp av mange celler, for eksempel mennesker.', {
      is_process: F, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: T, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: N, surrounds_cell: F, requires_membrane: N,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('encellet', 'ENCELLET',
    'En organisme som bare består av én eneste celle.', {
      is_process: F, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: T, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: F, found_in_animal_cell: F,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: N, surrounds_cell: F, requires_membrane: N,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('fotosyntese', 'FOTOSYNTESE',
    'Prosessen der planter lager sukker og oksygen av sollys, vann og CO2.', {
      is_process: T, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: F,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: N,
      related_to_energy: T, related_to_photosynthesis: T, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: T, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('celleaanding', 'CELLEÅNDING',
    'Prosessen der celler frigjør energi fra sukker ved hjelp av oksygen.', {
      is_process: T, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: N,
      related_to_energy: T, related_to_photosynthesis: F, related_to_cell_respiration: T,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: T,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('diffusjon', 'DIFFUSJON',
    'Bevegelse av stoffer fra høy til lav konsentrasjon.', {
      is_process: T, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: N,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: T, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('osmose', 'OSMOSE',
    'Bevegelse av vann gjennom en membran, fra lav til høy konsentrasjon av oppløst stoff.', {
      is_process: T, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: N,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: T, related_to_water: T, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('enzym', 'ENZYM',
    'Et protein som gjør at kjemiske reaksjoner i cellen går raskere.', {
      is_process: F, is_organelle: F, is_cell_structure: F, is_molecule: T,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: T, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: F,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: T,
      produces_proteins: F, processes_proteins: F, breaks_down_material: N,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('bakterie', 'BAKTERIE',
    'En encellet, prokaryot mikroorganisme.', {
      is_process: F, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: T, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: F, found_in_animal_cell: F,
      found_in_prokaryotes: T, found_in_eukaryotes: F,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: N,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('mikroskop', 'MIKROSKOP',
    'Verktøyet vi bruker for å se celler som er for små for det blotte øyet.', {
      is_process: F, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: T, is_group_of_cells: F,
      found_in_plant_cell: F, found_in_animal_cell: F,
      found_in_prokaryotes: F, found_in_eukaryotes: F,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: F,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: T,
    }),

  concept('vev', 'VEV',
    'En gruppe like celler som jobber sammen om en oppgave.', {
      is_process: F, is_organelle: F, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: T,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: F,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('organell', 'ORGANELL',
    'En liten «ministruktur» inne i cellen med en bestemt oppgave.', {
      is_process: F, is_organelle: T, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: N,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('lysosom', 'LYSOSOM',
    'Organellen som bryter ned avfall og gamle deler i cellen.', {
      is_process: F, is_organelle: T, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: F, found_in_animal_cell: T,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: T,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: F, related_to_water: F, related_to_proteins: F,
      produces_proteins: F, processes_proteins: F, breaks_down_material: T,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),

  concept('golgiapparat', 'GOLGIAPPARAT',
    'Organellen som pakker og sender proteiner videre i cellen.', {
      is_process: F, is_organelle: T, is_cell_structure: F, is_molecule: F,
      is_cell_type: F, is_organism_type: F, is_tool: F, is_group_of_cells: F,
      found_in_plant_cell: T, found_in_animal_cell: T,
      found_in_prokaryotes: F, found_in_eukaryotes: T,
      inside_nucleus: F, surrounds_cell: F, requires_membrane: T,
      related_to_energy: F, related_to_photosynthesis: F, related_to_cell_respiration: F,
      related_to_genetic_material: F, related_to_cell_division: F,
      related_to_transport: T, related_to_water: F, related_to_proteins: T,
      produces_proteins: F, processes_proteins: T, breaks_down_material: F,
      stores_material: F, provides_structural_support: F, used_to_observe_cells: F,
    }),
];
