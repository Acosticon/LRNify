/* =========================================================
   SPØRSMÅL — Naturfag / Celler
   Hvert spørsmål peker på nøyaktig én property (MVP-krav).
   Språk: norsk, ungdomsskolenivå, korte og konkrete formuleringer.
   ========================================================= */

export const QUESTIONS = [
  { id: 'q_is_process', text: 'Er det en prosess – altså noe som skjer?', property: 'is_process' },
  { id: 'q_is_organelle', text: 'Er det en organell?', property: 'is_organelle' },
  { id: 'q_is_cell_structure', text: 'Er det en fysisk del av cellen (men ikke en organell)?', property: 'is_cell_structure' },
  { id: 'q_is_molecule', text: 'Er det et molekyl eller stoff?', property: 'is_molecule' },
  { id: 'q_is_cell_type', text: 'Beskriver det en type celle?', property: 'is_cell_type' },
  { id: 'q_is_organism_type', text: 'Beskriver det en type organisme?', property: 'is_organism_type' },
  { id: 'q_is_tool', text: 'Er det et verktøy?', property: 'is_tool' },
  { id: 'q_is_group_of_cells', text: 'Er det en gruppe celler som jobber sammen?', property: 'is_group_of_cells' },

  { id: 'q_found_in_plant_cell', text: 'Finnes det normalt i planteceller?', property: 'found_in_plant_cell' },
  { id: 'q_found_in_animal_cell', text: 'Finnes det normalt i dyreceller?', property: 'found_in_animal_cell' },
  { id: 'q_found_in_prokaryotes', text: 'Finnes det hos prokaryoter, som bakterier?', property: 'found_in_prokaryotes' },
  { id: 'q_found_in_eukaryotes', text: 'Finnes det hos eukaryoter?', property: 'found_in_eukaryotes' },
  { id: 'q_inside_nucleus', text: 'Finner du det inne i cellekjernen?', property: 'inside_nucleus' },
  { id: 'q_surrounds_cell', text: 'Omslutter det hele cellen?', property: 'surrounds_cell' },
  { id: 'q_requires_membrane', text: 'Er det omgitt av sin egen membran?', property: 'requires_membrane' },

  { id: 'q_related_to_energy', text: 'Har det med energi å gjøre?', property: 'related_to_energy' },
  { id: 'q_related_to_photosynthesis', text: 'Har det med fotosyntese å gjøre?', property: 'related_to_photosynthesis' },
  { id: 'q_related_to_cell_respiration', text: 'Har det med celleånding å gjøre?', property: 'related_to_cell_respiration' },
  { id: 'q_related_to_genetic_material', text: 'Har det med arvestoff (DNA) å gjøre?', property: 'related_to_genetic_material' },
  { id: 'q_related_to_cell_division', text: 'Har det med celledeling å gjøre?', property: 'related_to_cell_division' },
  { id: 'q_related_to_transport', text: 'Har det med transport av stoffer å gjøre?', property: 'related_to_transport' },
  { id: 'q_related_to_water', text: 'Har det spesielt med vann å gjøre?', property: 'related_to_water' },
  { id: 'q_related_to_proteins', text: 'Har det med proteiner å gjøre?', property: 'related_to_proteins' },
  { id: 'q_produces_proteins', text: 'Lager det proteiner?', property: 'produces_proteins' },
  { id: 'q_processes_proteins', text: 'Bearbeider eller pakker det proteiner?', property: 'processes_proteins' },
  { id: 'q_breaks_down_material', text: 'Bryter det ned stoffer?', property: 'breaks_down_material' },
  { id: 'q_stores_material', text: 'Lagrer det stoffer?', property: 'stores_material' },
  { id: 'q_provides_structural_support', text: 'Gir det cellen støtte eller beskyttelse?', property: 'provides_structural_support' },
  { id: 'q_used_to_observe_cells', text: 'Brukes det til å se på celler?', property: 'used_to_observe_cells' },
];
