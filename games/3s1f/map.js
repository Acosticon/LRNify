// map.js – Øyakart med klikkbare regioner og akkumulerte ikoner

import { REGIONS } from './events.js';

const REGION_DEFS = [
  { id: 'nordkysten',   path: 'M 60 30 L 200 20 L 220 55 L 170 60 L 100 65 Z',       lx: 128, ly: 44 },
  { id: 'skoglandet',   path: 'M 100 65 L 170 60 L 175 110 L 120 120 L 85 105 Z',     lx: 130, ly: 92 },
  { id: 'fjordbygdene', path: 'M 85 105 L 120 120 L 115 165 L 70 160 L 65 130 Z',     lx: 92,  ly: 136 },
  { id: 'vesthavet',    path: 'M 20 80 L 85 105 L 65 130 L 30 145 L 15 110 Z',        lx: 46,  ly: 113 },
  { id: 'havnebyen',    path: 'M 170 60 L 220 55 L 235 100 L 200 115 L 175 110 Z',    lx: 198, ly: 88 },
  { id: 'sentrum',      path: 'M 120 120 L 175 110 L 200 115 L 190 165 L 115 165 Z',  lx: 153, ly: 142 },
];

export function createMapSVG(activeRegions, regionDecisions, openRegion, mapIcons, mapWarnings) {
  const svgParts = REGION_DEFS.map(r => {
    const region     = REGIONS[r.id];
    const isActive   = !!activeRegions[r.id];
    const isOpen     = openRegion === r.id;
    const decision   = regionDecisions[r.id];
    const isHandled  = decision !== undefined;
    const isIgnored  = decision === 'ignored';
    const isInactive = !isActive;

    // Farge-tilstand
    let fillOpacity, strokeW, strokeColor;
    if (isInactive) {
      fillOpacity = 0.18; strokeW = 0.5; strokeColor = '#0D1B2A';
    } else if (isOpen) {
      fillOpacity = 1.0;  strokeW = 2.5; strokeColor = '#F0EDE4';
    } else if (isHandled) {
      fillOpacity = 0.55; strokeW = 1;   strokeColor = '#0D1B2A';
    } else {
      fillOpacity = 0.72; strokeW = 1.5; strokeColor = '#0D1B2A';
    }

    // Blinkende utropstegn (aktiv, ikke håndtert ennå)
    const showAlert = isActive && !isHandled;
    const alertEl = showAlert ? `
      <g class="region-alert">
        <circle cx="${r.lx + 22}" cy="${r.ly - 16}" r="7" fill="${region.color}" opacity="0.95"/>
        <text x="${r.lx + 22}" y="${r.ly - 12}" text-anchor="middle" dominant-baseline="middle"
              font-size="9" font-weight="bold" fill="#0D1B2A" font-family="Inter,sans-serif">!</text>
      </g>` : '';

    // Hak-ikon for håndtert (ikke ignorert)
    const doneEl = isHandled && !isIgnored ? `
      <text x="${r.lx + 22}" y="${r.ly - 14}" text-anchor="middle" dominant-baseline="middle"
            font-size="11" font-family="Inter,sans-serif" opacity="0.9">✓</text>` : '';

    // Ignorert-ikon
    const ignoredEl = isIgnored ? `
      <text x="${r.lx + 22}" y="${r.ly - 14}" text-anchor="middle" dominant-baseline="middle"
            font-size="11" font-family="Inter,sans-serif" opacity="0.6">–</text>` : '';

    const cursor = isActive ? 'pointer' : 'default';

    return `
      <g class="map-region ${isActive ? 'active' : 'inactive'} ${isOpen ? 'selected' : ''} ${isHandled ? 'handled' : ''}"
         data-region="${r.id}"
         style="cursor:${cursor}"
         role="${isActive ? 'button' : 'presentation'}"
         tabindex="${isActive ? '0' : '-1'}"
         aria-label="${region.name}${isActive ? ' – klikk for å se saken' : ''}">
        <path d="${r.path}"
              fill="${region.color}"
              fill-opacity="${fillOpacity}"
              stroke="${strokeColor}"
              stroke-width="${strokeW}"
              stroke-linejoin="round"/>
        <text x="${r.lx}" y="${r.ly}"
              class="region-label"
              text-anchor="middle"
              dominant-baseline="middle"
              opacity="${isInactive ? 0.3 : 0.9}">
          ${region.icon} ${region.name}
        </text>
        ${alertEl}${doneEl}${ignoredEl}
      </g>`;
  });

  // Kart-ikoner (akkumulerte valg) – gruppert per region
  const iconsByRegion = {};
  [...(mapIcons || []), ...(mapWarnings || [])].forEach(ico => {
    if (!iconsByRegion[ico.region]) iconsByRegion[ico.region] = [];
    iconsByRegion[ico.region].push(ico.emoji);
  });

  const iconElements = REGION_DEFS.map(r => {
    const icons = iconsByRegion[r.id];
    if (!icons || icons.length === 0) return '';
    // Vis opptil 4 ikoner under region-label
    const visible = icons.slice(-4);
    return visible.map((emoji, i) => `
      <text x="${r.lx - 12 + i * 13}" y="${r.ly + 14}"
            text-anchor="middle" dominant-baseline="middle"
            font-size="9" font-family="Inter,sans-serif" opacity="0.95">${emoji}</text>
    `).join('');
  }).join('');

  return `
<svg id="island-map" viewBox="0 0 260 190" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="Kart over øya">
  <rect width="260" height="190" fill="#0D1B2A" rx="6"/>
  <path d="M 15 75 Q 40 15 120 15 Q 210 10 235 60 Q 250 110 200 165 Q 150 195 80 185 Q 20 175 10 130 Z"
        fill="#1A3A4A" stroke="#243B4A" stroke-width="1"/>
  ${svgParts.join('')}
  ${iconElements}
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
