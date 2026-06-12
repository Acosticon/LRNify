// map.js – Øyakart med klikkbare regioner

import { REGIONS } from './events.js';

// SVG-kartet som string (schematisk øy)
export function createMapSVG(activeRegion, eventsThisYear) {
  // Hvilke regioner har aktive hendelser?
  const eventRegions = new Set(eventsThisYear.map(e => e.region));

  const regions = [
    // [id, path-data, cx, cy, label-x, label-y]
    {
      id: 'nordkysten',
      path: 'M 60 30 L 200 20 L 220 55 L 170 60 L 100 65 Z',
      lx: 128, ly: 46,
      color: '#E8C547',
    },
    {
      id: 'skoglandet',
      path: 'M 100 65 L 170 60 L 175 110 L 120 120 L 85 105 Z',
      lx: 128, ly: 92,
      color: '#5BBFAD',
    },
    {
      id: 'fjordbygdene',
      path: 'M 85 105 L 120 120 L 115 165 L 70 160 L 65 130 Z',
      lx: 92, ly: 136,
      color: '#7FB97F',
    },
    {
      id: 'vesthavet',
      path: 'M 20 80 L 85 105 L 65 130 L 30 145 L 15 110 Z',
      lx: 46, ly: 113,
      color: '#4A9CC2',
    },
    {
      id: 'havnebyen',
      path: 'M 170 60 L 220 55 L 235 100 L 200 115 L 175 110 Z',
      lx: 198, ly: 88,
      color: '#9A8EC0',
    },
    {
      id: 'sentrum',
      path: 'M 120 120 L 175 110 L 200 115 L 190 165 L 115 165 Z',
      lx: 153, ly: 142,
      color: '#E87D5B',
    },
  ];

  const svgParts = regions.map(r => {
    const isActive  = activeRegion === r.id;
    const hasEvent  = eventRegions.has(r.id);
    const baseOpacity = isActive ? 1 : 0.65;
    const strokeW   = isActive ? 2 : 1;

    let extraClass = 'map-region';
    if (isActive)  extraClass += ' active';
    if (hasEvent)  extraClass += ' has-event';

    // Event-indikator
    const indicator = hasEvent
      ? `<circle cx="${r.lx + 28}" cy="${r.ly - 10}" r="4" fill="${r.color}" opacity="0.9"/>`
      : '';

    return `
      <g class="${extraClass}" data-region="${r.id}" style="cursor:pointer">
        <path
          d="${r.path}"
          fill="${r.color}"
          fill-opacity="${baseOpacity}"
          stroke="#0D1B2A"
          stroke-width="${strokeW}"
          stroke-linejoin="round"
        />
        <text
          x="${r.lx}" y="${r.ly}"
          class="region-label"
          text-anchor="middle"
          dominant-baseline="middle"
        >${REGIONS[r.id].icon} ${REGIONS[r.id].name}</text>
        ${indicator}
      </g>`;
  });

  return `
<svg id="island-map" viewBox="0 0 260 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kart over øya">
  <!-- Hav-bakgrunn -->
  <rect width="260" height="190" fill="#0D1B2A" rx="6"/>

  <!-- Øy-form (sammensatt) -->
  <path d="M 15 75 Q 40 15 120 15 Q 210 10 235 60 Q 250 110 200 165 Q 150 195 80 185 Q 20 175 10 130 Z"
        fill="#1A3A4A" stroke="#243B4A" stroke-width="1"/>

  ${svgParts.join('\n')}

  <!-- Havet rundt -->
  <text x="130" y="181" text-anchor="middle" fill="#243B4A" font-size="7" font-family="Inter,sans-serif">Vesthavet</text>
</svg>`;
}

// Sett opp event-lyttere på kartet
export function setupMapListeners(container, onRegionClick) {
  container.querySelectorAll('.map-region').forEach(el => {
    el.addEventListener('click', () => {
      const regionId = el.dataset.region;
      onRegionClick(regionId);
    });
  });
}

// Hent region-info for sidebar
export function getRegionInfo(regionId) {
  if (!regionId) return null;
  return REGIONS[regionId] || null;
}
