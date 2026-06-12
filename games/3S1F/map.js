// map.js – Øyakart med klikkbare regioner

import { REGIONS } from './events.js';

export function createMapSVG(activeRegions, selectedRegion) {
  // activeRegions: { regionId: event } – de 3 som blinker
  // selectedRegion: hvilken er klikket (åpen)

  const regionDefs = [
    { id: 'nordkysten',   path: 'M 60 30 L 200 20 L 220 55 L 170 60 L 100 65 Z',        lx: 128, ly: 46 },
    { id: 'skoglandet',   path: 'M 100 65 L 170 60 L 175 110 L 120 120 L 85 105 Z',      lx: 130, ly: 92 },
    { id: 'fjordbygdene', path: 'M 85 105 L 120 120 L 115 165 L 70 160 L 65 130 Z',      lx: 92,  ly: 136 },
    { id: 'vesthavet',    path: 'M 20 80 L 85 105 L 65 130 L 30 145 L 15 110 Z',         lx: 46,  ly: 113 },
    { id: 'havnebyen',    path: 'M 170 60 L 220 55 L 235 100 L 200 115 L 175 110 Z',     lx: 198, ly: 88 },
    { id: 'sentrum',      path: 'M 120 120 L 175 110 L 200 115 L 190 165 L 115 165 Z',   lx: 153, ly: 142 },
  ];

  const svgParts = regionDefs.map(r => {
    const region      = REGIONS[r.id];
    const isActive    = !!activeRegions[r.id];
    const isSelected  = selectedRegion === r.id;
    const isInactive  = !isActive;

    const fillOpacity = isInactive ? 0.18 : isSelected ? 1 : 0.7;
    const strokeW     = isSelected ? 2.5 : isActive ? 1.5 : 1;
    const strokeColor = isSelected ? '#F0EDE4' : '#0D1B2A';

    // Blinkende utropstegn for aktive regioner
    const exclamation = isActive && !isSelected ? `
      <g class="region-alert" aria-hidden="true">
        <circle cx="${r.lx + 20}" cy="${r.ly - 14}" r="7" fill="${region.color}" opacity="0.95"/>
        <text x="${r.lx + 20}" y="${r.ly - 10}" text-anchor="middle" dominant-baseline="middle"
              font-size="9" font-weight="bold" fill="#0D1B2A" font-family="Inter,sans-serif">!</text>
      </g>` : '';

    const cursor = isActive ? 'pointer' : 'default';
    const tabIndex = isActive ? '0' : '-1';
    const ariaLabel = isActive
      ? `${region.name} – klikk for å se saken`
      : `${region.name} – ingen sak dette året`;

    return `
      <g class="map-region ${isActive ? 'active' : 'inactive'} ${isSelected ? 'selected' : ''}"
         data-region="${r.id}"
         style="cursor:${cursor}"
         role="${isActive ? 'button' : 'presentation'}"
         tabindex="${tabIndex}"
         aria-label="${ariaLabel}">
        <path
          d="${r.path}"
          fill="${region.color}"
          fill-opacity="${fillOpacity}"
          stroke="${strokeColor}"
          stroke-width="${strokeW}"
          stroke-linejoin="round"
        />
        <text x="${r.lx}" y="${r.ly}"
              class="region-label"
              text-anchor="middle"
              dominant-baseline="middle"
              opacity="${isInactive ? 0.35 : 1}">
          ${region.icon} ${region.name}
        </text>
        ${exclamation}
      </g>`;
  });

  return `
<svg id="island-map" viewBox="0 0 260 190" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="Kart over øya. Tre regioner har aktive saker.">
  <rect width="260" height="190" fill="#0D1B2A" rx="6"/>
  <path d="M 15 75 Q 40 15 120 15 Q 210 10 235 60 Q 250 110 200 165 Q 150 195 80 185 Q 20 175 10 130 Z"
        fill="#1A3A4A" stroke="#243B4A" stroke-width="1"/>
  ${svgParts.join('\n')}
  <text x="130" y="181" text-anchor="middle" fill="#243B4A"
        font-size="7" font-family="Inter,sans-serif">Vesthavet</text>
</svg>`;
}

export function setupMapListeners(container, onRegionClick) {
  container.querySelectorAll('.map-region.active').forEach(el => {
    const handler = () => onRegionClick(el.dataset.region);
    el.addEventListener('click', handler);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });
}
