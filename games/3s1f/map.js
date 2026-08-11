// map.js – Øyakart med klikkbare regioner og akkumulerte ikoner

import { REGIONS } from './events.js';
import { neglectLevel, escapeHtml as esc } from './game.js';

const REGION_DEFS = [
  { id: 'nordkysten',   path: 'M 60 30 L 200 20 L 220 55 L 170 60 L 100 65 Z',       lx: 128, ly: 44 },
  { id: 'skoglandet',   path: 'M 100 65 L 170 60 L 175 110 L 120 120 L 85 105 Z',     lx: 130, ly: 92 },
  { id: 'fjordbygdene', path: 'M 85 105 L 120 120 L 115 165 L 70 160 L 65 130 Z',     lx: 92,  ly: 136 },
  { id: 'vesthavet',    path: 'M 20 80 L 85 105 L 65 130 L 30 145 L 15 110 Z',        lx: 46,  ly: 113 },
  { id: 'havnebyen',    path: 'M 170 60 L 220 55 L 235 100 L 200 115 L 175 110 Z',    lx: 198, ly: 88 },
  { id: 'sentrum',      path: 'M 120 120 L 175 110 L 200 115 L 190 165 L 115 165 Z',  lx: 153, ly: 142 },
];

export function createMapSVG(state) {
  const { activeRegions, regionDecisions, openRegion, mapIcons, mapWarnings } = state;

  const svgParts = REGION_DEFS.map(r => {
    const region    = REGIONS[r.id];
    const ev        = activeRegions[r.id];
    const isActive  = !!ev;
    const isOpen    = openRegion === r.id;
    const decision  = regionDecisions[r.id];
    const isDone     = decision !== undefined && decision !== 'deferred';
    const isDeferred = decision === 'deferred';
    const level      = ev ? neglectLevel(state, ev.id) : 0;

    let fillOpacity, strokeW, strokeColor;
    if (!isActive)      { fillOpacity = 0.16; strokeW = 0.5; strokeColor = '#0D1B2A'; }
    else if (isOpen)    { fillOpacity = 1.0;  strokeW = 3;   strokeColor = '#F0EDE4'; }
    else if (isDone)    { fillOpacity = 0.5;  strokeW = 1;   strokeColor = '#0D1B2A'; }
    else                { fillOpacity = 0.85; strokeW = 1.5; strokeColor = '#0D1B2A'; }

    // Etikettene ligger på lyse flater – mørk tekst er det eneste som er lesbart.
    const labelFill = isActive ? '#0D1B2A' : 'rgba(240,237,228,0.45)';
    const labelWeight = isActive ? '600' : '400';

    // Markør: uløst sak, utsatt, eller ferdigbehandlet
    let marker = '';
    if (isActive && !isDone) {
      const urgent = level > 0;
      marker = `
        <g class="region-alert ${urgent ? 'is-urgent' : ''} ${isDeferred ? 'is-deferred' : ''}">
          <circle cx="${r.lx + 24}" cy="${r.ly - 17}" r="8"
                  fill="${urgent ? '#E87D5B' : region.color}"
                  stroke="#0D1B2A" stroke-width="1.5"/>
          <text x="${r.lx + 24}" y="${r.ly - 16.5}" text-anchor="middle" dominant-baseline="middle"
                font-size="10" font-weight="700" fill="#0D1B2A"
                font-family="Inter,sans-serif">${isDeferred ? '‖' : level > 0 ? level + 1 : '!'}</text>
        </g>`;
    } else if (isDone) {
      marker = `
        <circle cx="${r.lx + 24}" cy="${r.ly - 17}" r="7.5" fill="#5BBFAD" opacity="0.9"/>
        <text x="${r.lx + 24}" y="${r.ly - 16.5}" text-anchor="middle" dominant-baseline="middle"
              font-size="9" font-weight="700" fill="#0D1B2A" font-family="Inter,sans-serif">✓</text>`;
    }

    return `
      <g class="map-region ${isActive ? 'active' : 'inactive'} ${isOpen ? 'selected' : ''}"
         data-region="${r.id}"
         role="${isActive ? 'button' : 'presentation'}"
         tabindex="${isActive ? '0' : '-1'}"
         aria-label="${esc(region.name)}${isActive ? ` – ${esc(ev.title)}, klikk for å åpne saken` : ' – ingen sak i år'}">
        <path d="${r.path}" fill="${region.color}" fill-opacity="${fillOpacity}"
              stroke="${strokeColor}" stroke-width="${strokeW}" stroke-linejoin="round"/>
        <text x="${r.lx}" y="${r.ly}" class="region-label"
              text-anchor="middle" dominant-baseline="middle"
              fill="${labelFill}" font-weight="${labelWeight}">${region.icon} ${esc(region.name)}</text>
        ${marker}
      </g>`;
  });

  // Akkumulerte spor etter valg, gruppert per region
  const iconsByRegion = {};
  [...(mapIcons || []), ...(mapWarnings || [])].forEach(ico => {
    (iconsByRegion[ico.region] ??= []).push(ico.emoji);
  });

  const iconElements = REGION_DEFS.map(r => {
    const icons = iconsByRegion[r.id];
    if (!icons?.length) return '';
    return icons.slice(-4).map((emoji, i) => `
      <text x="${r.lx - 13 + i * 14}" y="${r.ly + 15}" text-anchor="middle"
            dominant-baseline="middle" font-size="10"
            font-family="Inter,sans-serif">${emoji}</text>`).join('');
  }).join('');

  return `
<svg id="island-map" viewBox="0 0 260 190" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="Kart over øya med årets saker">
  <rect width="260" height="190" fill="#0D1B2A" rx="8"/>
  <path d="M 15 75 Q 40 15 120 15 Q 210 10 235 60 Q 250 110 200 165 Q 150 195 80 185 Q 20 175 10 130 Z"
        fill="#1A3A4A" stroke="#243B4A" stroke-width="1"/>
  ${svgParts.join('')}
  ${iconElements}
  <text x="130" y="182" text-anchor="middle" fill="#4A6B80"
        font-size="7.5" font-family="Inter,sans-serif" letter-spacing="1">HAVET</text>
</svg>`;
}

export function setupMapListeners(container, onRegionClick) {
  container.querySelectorAll('.map-region.active').forEach(el => {
    const handler = () => onRegionClick(el.dataset.region);
    el.addEventListener('click', handler);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });
}
