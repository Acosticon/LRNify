/* =========================================================
   EGENSKAPER — Naturfag / Celler
   Rent dokumentasjons-/debug-formål: engine.js bryr seg bare om
   property-id-ene som nøkler i concept.properties. Labels her
   brukes i debug-panelet og i eventuell fremtidig lærervisning.
   ========================================================= */

export const PROPERTIES = [
  // Kategori — hva slags "type ting" er dette?
  { id: 'is_process', label: 'Er en prosess' },
  { id: 'is_organelle', label: 'Er en organell' },
  { id: 'is_cell_structure', label: 'Er en fysisk celledel (ikke organell)' },
  { id: 'is_molecule', label: 'Er et molekyl/stoff' },
  { id: 'is_cell_type', label: 'Beskriver en type celle' },
  { id: 'is_organism_type', label: 'Beskriver en type organisme' },
  { id: 'is_tool', label: 'Er et verktøy' },
  { id: 'is_group_of_cells', label: 'Er en gruppe celler' },

  // Forekomst / plassering
  { id: 'found_in_plant_cell', label: 'Finnes i planteceller' },
  { id: 'found_in_animal_cell', label: 'Finnes i dyreceller' },
  { id: 'found_in_prokaryotes', label: 'Finnes hos prokaryoter' },
  { id: 'found_in_eukaryotes', label: 'Finnes hos eukaryoter' },
  { id: 'inside_nucleus', label: 'Ligger inne i cellekjernen' },
  { id: 'surrounds_cell', label: 'Omslutter hele cellen' },
  { id: 'requires_membrane', label: 'Er omgitt av egen membran' },

  // Funksjon / faglig sammenheng
  { id: 'related_to_energy', label: 'Har med energi å gjøre' },
  { id: 'related_to_photosynthesis', label: 'Har med fotosyntese å gjøre' },
  { id: 'related_to_cell_respiration', label: 'Har med celleånding å gjøre' },
  { id: 'related_to_genetic_material', label: 'Har med arvestoff å gjøre' },
  { id: 'related_to_cell_division', label: 'Har med celledeling å gjøre' },
  { id: 'related_to_transport', label: 'Har med transport av stoffer å gjøre' },
  { id: 'related_to_water', label: 'Har spesielt med vann å gjøre' },
  { id: 'related_to_proteins', label: 'Har med proteiner å gjøre' },
  { id: 'produces_proteins', label: 'Lager proteiner' },
  { id: 'processes_proteins', label: 'Bearbeider/pakker proteiner' },
  { id: 'breaks_down_material', label: 'Bryter ned stoffer' },
  { id: 'stores_material', label: 'Lagrer stoffer' },
  { id: 'provides_structural_support', label: 'Gir støtte/beskyttelse' },
  { id: 'used_to_observe_cells', label: 'Brukes til å observere celler' },
];

export const PROPERTY_IDS = PROPERTIES.map((p) => p.id);
