// map.js – Illustrert øykart
//
// Kartet er spillets ansikt. Det er tegnet som en nattscene: havet med
// dybde og dønninger, øya som en opplyst landmasse, og seks områder med
// hvert sitt terreng.
//
// Områdene deler kanter punkt for punkt. Kystbitene og de indre grensene
// under er definert én gang hver og settes sammen både forlengs og
// baklengs, slik at flatene flisker øya uten sømmer eller overlapp.

import { REGIONS } from './events.js';
import { neglectLevel, escapeHtml as esc } from './game.js';
import { REGION_COLORS } from './art.js';

const VB = { w: 520, h: 380 };

// ─── Geometri ─────────────────────────────────────────
// Kystanker, med klokka fra nordvest.
const C1 = '152 128', C2 = '352 84', C3 = '438 178',
      C4 = '396 286', C5 = '258 328', C6 = '150 246';

// Kystbiter: [startpunkt, kontroller, sluttpunkt]
const S1 = 'C 178 96 232 72 282 70 C 312 69 336 74 352 84';       // NV → NØ
const S2 = 'C 388 100 424 132 438 178';                            // NØ → Ø
const S3 = 'C 442 218 428 258 396 286';                            // Ø → SØ
const S4 = 'C 360 316 310 332 258 328';                            // SØ → S
const S5 = 'C 208 324 166 300 150 246';                            // S → V
const S6 = 'C 140 208 138 158 152 128';                            // V → NV

// Indre grenser, og de samme baklengs (kontrollpunktene byttes om).
const A = '250 158', B = '340 176', Cc = '318 258', D = '232 262';

const E_C1A  = 'C 186 136 220 146 250 158';   const E_AC1  = 'C 220 146 186 136 152 128';
const E_AB   = 'C 282 160 312 166 340 176';   const E_BA   = 'C 312 166 282 160 250 158';
const E_C2B  = 'C 362 116 356 148 340 176';   const E_BC2  = 'C 356 148 362 116 352 84';
const E_BC   = 'C 348 208 336 232 318 258';   const E_CB   = 'C 336 232 348 208 340 176';
const E_CD   = 'C 292 268 262 268 232 262';   const E_DC   = 'C 262 268 292 268 318 258';
const E_DC6  = 'C 202 258 172 254 150 246';   const E_C6D  = 'C 172 254 202 258 232 262';
const E_DC5  = 'C 240 288 250 308 258 328';   const E_C5D  = 'C 250 308 240 288 232 262';
const E_CC4  = 'C 344 264 372 274 396 286';   const E_C4C  = 'C 372 274 344 264 318 258';

const COAST = `M ${C1} ${S1} ${S2} ${S3} ${S4} ${S5} ${S6} Z`;

const REGION_DEFS = {
  // Nordkysten: kystbåndet i nord, der vinden kommer inn
  nordkysten: {
    path: `M ${C1} ${S1} ${E_C2B} ${E_BA} ${E_AC1} Z`,
    mx: 258, my: 116,
  },
  // Havnebyen: østkysten, med dypvannskai
  havnebyen: {
    path: `M ${C2} ${S2} ${S3} ${E_C4C} ${E_CB} ${E_BC2} Z`,
    mx: 394, my: 178,
  },
  // Sentrum: bykjernen mot sørkysten
  sentrum: {
    path: `M ${Cc} ${E_CC4} ${S4} ${E_C5D} ${E_DC} Z`,
    mx: 322, my: 288,
  },
  // Fjordbygdene: jordbrukslandet i sørvest
  fjordbygdene: {
    path: `M ${C5} ${S5} ${E_C6D} ${E_DC5} Z`,
    mx: 204, my: 288,
  },
  // Skoglandet: vestkysten og hele det indre høylandet
  skoglandet: {
    path: `M ${C6} ${S6} ${E_C1A} ${E_AB} ${E_BC} ${E_CD} ${E_DC6} Z`,
    mx: 216, my: 204,
  },
  // Vesthavet: farvannet utenfor, ikke land – derfor stiplet grense
  vesthavet: {
    path: `M 26 156 C 58 132 96 140 116 168 C 128 208 116 252 90 278
           C 60 304 28 296 16 264 C 6 226 10 178 26 156 Z`,
    mx: 66, my: 200, sea: true,
  },
};

const ORDER = ['nordkysten', 'skoglandet', 'fjordbygdene', 'sentrum', 'havnebyen', 'vesthavet'];

// ─── Terrengmotiver ───────────────────────────────────

const DARK = '#08131E';

const pine = (x, y, s, o = 1) =>
  `<path d="M${x} ${y - 15 * s} L${x + 6 * s} ${y} L${x - 6 * s} ${y} Z" fill="${DARK}" opacity="${o}"/>
   <path d="M${x} ${y} v${3 * s}" stroke="${DARK}" stroke-width="${1.5 * s}" opacity="${o}"/>`;

const turbine = (x, y, s) => `
  <g opacity=".92">
    <path d="M${x} ${y}V${y - 21 * s}" stroke="${DARK}" stroke-width="${1.7 * s}" stroke-linecap="round"/>
    <circle cx="${x}" cy="${y - 21 * s}" r="${2 * s}" fill="${DARK}"/>
    <g fill="${DARK}">
      <path d="M${x} ${y - 21 * s} l${-1.5 * s} ${-14 * s} l${3.8 * s} ${.8 * s} Z"/>
      <path d="M${x} ${y - 21 * s} l${12.8 * s} ${5.6 * s} l${-1.3 * s} ${3.4 * s} Z"/>
      <path d="M${x} ${y - 21 * s} l${-10.4 * s} ${8.6 * s} l${3.2 * s} ${2.4 * s} Z"/>
    </g>
  </g>`;

const house = (x, y, w, h, lit) => `
  <path d="M${x} ${y} v${-h} h${w} v${h} Z" fill="${DARK}"/>
  ${lit ? `<rect x="${(x + w * .3).toFixed(1)}" y="${(y - h * .68).toFixed(1)}"
            width="${Math.max(1.5, w * .22).toFixed(1)}" height="${Math.max(1.5, h * .26).toFixed(1)}"
            fill="#E8C547" opacity=".85"/>` : ''}`;

const TERRAIN = {
  nordkysten: `
    ${turbine(188, 132, .9)}${turbine(216, 120, 1.05)}
    ${turbine(302, 122, 1.05)}${turbine(330, 140, .82)}
    <path d="M172 122c34-22 88-32 148-26" stroke="${DARK}" stroke-width="1.6"
          fill="none" opacity=".3" stroke-dasharray="4 6"/>`,

  skoglandet: `
    ${pine(172, 168, 1.05)}${pine(196, 186, 1.2)}${pine(168, 200, .95)}
    ${pine(224, 172, 1)}${pine(252, 184, 1.15)}${pine(280, 200, 1.05)}
    ${pine(304, 216, .95)}${pine(190, 224, 1.1)}${pine(216, 240, 1.2)}
    ${pine(246, 224, 1)}${pine(272, 240, 1.1)}${pine(160, 232, .85, .8)}
    ${pine(300, 244, .9, .85)}${pine(236, 250, .85, .8)}
    <path d="M158 222c30 16 62 20 96 12" stroke="#5BBFAD" stroke-width="1.5"
          fill="none" opacity=".24"/>`,

  fjordbygdene: `
    <g stroke="${DARK}" stroke-width="1.4" fill="none" opacity=".38">
      <path d="M176 296c24 10 50 14 74 12"/>
      <path d="M182 308c22 10 46 14 68 12"/>
      <path d="M192 318c20 8 40 11 58 10"/>
    </g>
    ${house(212, 296, 17, 12, true)}
    <path d="M212 284 L220.5 277 L229 284 Z" fill="${DARK}"/>
    ${house(238, 302, 10, 8, false)}
    ${house(190, 292, 9, 7, true)}
    <path d="M176 284c4-7 9-7 13 0" stroke="${DARK}" stroke-width="2.2"
          fill="none" stroke-linecap="round"/>`,

  // Byen er tegnet som én lav husrekke. Tettere bebyggelse ble en svart
  // flekk i stedet for et sentrum – silhuetter trenger luft rundt seg.
  sentrum: `
    ${house(276, 300, 11, 14, true)}${house(290, 300, 9, 21, true)}
    ${house(302, 300, 13, 12, true)}${house(318, 300, 9, 18, true)}
    ${house(330, 300, 12, 13, true)}
    <path d="M348 300 L354 288 L360 300 v8 h-12 Z" fill="${DARK}"/>
    <path d="M354 293v-7" stroke="${DARK}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M268 302h96" stroke="${DARK}" stroke-width="1.6" opacity=".4"/>
    <path d="M284 312h64" stroke="${DARK}" stroke-width="1.4" opacity=".25"/>`,

  havnebyen: `
    <g stroke="${DARK}" stroke-width="2.4" stroke-linecap="round" fill="none">
      <path d="M366 244V200M366 200h32M366 208l13-8M390 200v11"/>
    </g>
    <rect x="385" y="209" width="9" height="7" fill="${DARK}"/>
    <path d="M404 246v-28h6.5v28zM414 246v-35h6.5v35z" fill="${DARK}"/>
    <path d="M406 216c-3-7 1-12 5-15M416 209c-3-8 1-13 5-16" stroke="#9A8EC0"
          stroke-width="1.8" fill="none" opacity=".4" stroke-linecap="round"/>
    <path d="M348 246h80v6h-80z" fill="${DARK}" opacity=".85"/>
    <path d="M340 234h14v10h-14zM356 230h12v14h-12z" fill="${DARK}"/>
    <rect x="359" y="234" width="3.5" height="3.5" fill="#E8C547" opacity=".75"/>
    <g fill="${DARK}" opacity=".9">
      <rect x="374" y="152" width="15" height="8"/><rect x="391" y="152" width="15" height="8"/>
      <rect x="382" y="143" width="15" height="8"/>
    </g>
    <path d="M370 136h44" stroke="${DARK}" stroke-width="1.5" opacity=".35"/>`,

  vesthavet: `
    <g stroke="#4A9CC2" stroke-width="1.7" stroke-linecap="round" fill="none" opacity=".42">
      <path d="M30 182c7 0 7-5 14-5s7 5 14 5 7-5 14-5 7 5 14 5"/>
      <path d="M26 234c7 0 7-5 14-5s7 5 14 5 7-5 14-5 7 5 14 5"/>
      <path d="M36 262c7 0 7-5 14-5s7 5 14 5"/>
    </g>
    <g fill="${DARK}">
      <path d="M44 222h42l-7 10H51z"/>
      <path d="M60 220v-19l15 19z"/>
      <path d="M57 220v-15l-10 15z"/>
    </g>
    <path d="M60 201v21" stroke="${DARK}" stroke-width="1.7" stroke-linecap="round"/>
    <g fill="#4A9CC2" opacity=".5">
      <path d="M90 250c6-4 12-4 16 0-4 4-10 4-16 0z"/><path d="M106 250l6-4v8z"/>
    </g>`,
};

// ─── Markør og navnskilt ──────────────────────────────

function pin(x, y, kind, color, label) {
  if (kind === 'done') {
    return `<g class="pin pin-done">
      <circle cx="${x}" cy="${y}" r="10" fill="#5BBFAD" stroke="#08131E" stroke-width="2"/>
      <path d="M${x - 4.2} ${y} l3 3.2 l5.4-6.2" stroke="#08131E" stroke-width="2.3"
            fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  }
  if (kind === 'deferred') {
    return `<g class="pin pin-deferred">
      <circle cx="${x}" cy="${y}" r="10" fill="#E8C547" stroke="#08131E" stroke-width="2"/>
      <path d="M${x - 2.5} ${y - 3.8}v7.6M${x + 2.5} ${y - 3.8}v7.6" stroke="#08131E"
            stroke-width="2.3" stroke-linecap="round"/>
    </g>`;
  }
  const urgent = kind === 'urgent';
  const fill = urgent ? '#E87D5B' : color;
  return `<g class="pin ${urgent ? 'pin-urgent' : 'pin-open'}">
    <circle class="pin-ring" cx="${x}" cy="${y}" r="10.5" fill="none" stroke="${fill}" stroke-width="2"/>
    <circle cx="${x}" cy="${y}" r="10.5" fill="${fill}" stroke="#08131E" stroke-width="2"/>
    <text x="${x}" y="${y + .5}" class="pin-text" text-anchor="middle"
          dominant-baseline="middle">${label}</text>
  </g>`;
}

// Navnet står på et eget skilt under markøren. Da slipper etikettene å
// konkurrere med terrenget om lesbarhet.
function nameplate(x, y, name, active) {
  const w = name.length * 5.4 + 14;
  return `<g class="zone-label ${active ? '' : 'is-dim'}">
    <rect x="${(x - w / 2).toFixed(1)}" y="${y - 7}" width="${w.toFixed(1)}" height="14" rx="7"
          fill="#08131E" fill-opacity="${active ? .82 : .55}"
          stroke="${active ? 'rgba(240,237,228,.28)' : 'rgba(240,237,228,.1)'}" stroke-width=".8"/>
    <text x="${x}" y="${y + .5}" class="region-label" text-anchor="middle"
          dominant-baseline="middle">${esc(name)}</text>
  </g>`;
}

// ─── Kartet ───────────────────────────────────────────

export function createMapSVG(state) {
  const { activeRegions, regionDecisions, openRegion, mapIcons, mapWarnings } = state;

  const zones = ORDER.map(id => {
    const def      = REGION_DEFS[id];
    const region   = REGIONS[id];
    const color    = REGION_COLORS[id] || region.color;
    const ev       = activeRegions[id];
    const isActive = !!ev;
    const isOpen   = openRegion === id;
    const decision = regionDecisions[id];
    const isDone     = decision !== undefined && decision !== 'deferred';
    const isDeferred = decision === 'deferred';
    const level      = ev ? neglectLevel(state, ev.id) : 0;

    // Et område uten sak trekker seg tilbake; det åpne løftes fram.
    let fillOp, strokeW, strokeCol, terrainOp;
    if (isOpen)        { fillOp = .5;  strokeW = 2.4; strokeCol = '#F0EDE4'; terrainOp = 1; }
    else if (isDone)   { fillOp = .26; strokeW = .9;  strokeCol = '#08131E'; terrainOp = .78; }
    else if (isActive) { fillOp = .38; strokeW = 1.2; strokeCol = '#08131E'; terrainOp = .92; }
    else               { fillOp = .12; strokeW = .7;  strokeCol = '#08131E'; terrainOp = .5; }

    let marker = '';
    if (isActive && !isDone) {
      const kind  = isDeferred ? 'deferred' : level > 0 ? 'urgent' : 'open';
      marker = pin(def.mx, def.my, kind, color, level > 0 ? String(level + 1) : '!');
    } else if (isDone) {
      marker = pin(def.mx, def.my, 'done', color);
    }

    const stateLabel = isActive
      ? ` – ${esc(ev.title)}${isDone ? ', behandlet' : ', klikk for å åpne saken'}`
      : ' – ingen sak i år';

    return `
      <g class="map-region ${isActive ? 'active' : 'inactive'} ${isOpen ? 'selected' : ''}
                ${isDone ? 'resolved' : ''}"
         data-region="${id}"
         role="${isActive ? 'button' : 'presentation'}"
         tabindex="${isActive ? '0' : '-1'}"
         aria-label="${esc(region.name)}${stateLabel}">
        <path class="zone-fill" d="${def.path}" fill="${color}" fill-opacity="${fillOp}"
              stroke="${strokeCol}" stroke-width="${strokeW}" stroke-linejoin="round"
              ${def.sea ? 'stroke-dasharray="5 4"' : ''}/>
        <g class="zone-terrain" opacity="${terrainOp}" clip-path="url(#clip-${id})">
          ${TERRAIN[id] || ''}
        </g>
        ${marker}
        ${nameplate(def.mx, def.my + 20, region.name, isActive)}
      </g>`;
  }).join('');

  // Spor etter valg, samlet like under navnskiltet.
  const byRegion = {};
  [...(mapIcons || []), ...(mapWarnings || [])].forEach(i => {
    (byRegion[i.region] ??= []).push(i.emoji);
  });
  const traces = ORDER.map(id => {
    const list = byRegion[id];
    if (!list?.length) return '';
    const d = REGION_DEFS[id];
    const shown = list.slice(-4);
    const x0 = d.mx - ((shown.length - 1) * 15) / 2;
    return `<g class="zone-traces">${shown.map((e, i) => `
      <circle cx="${x0 + i * 15}" cy="${d.my + 40}" r="7.5" fill="#08131E" opacity=".78"
              stroke="rgba(240,237,228,.18)" stroke-width=".8"/>
      <text x="${x0 + i * 15}" y="${d.my + 40.5}" text-anchor="middle"
            dominant-baseline="middle" font-size="9">${e}</text>`).join('')}</g>`;
  }).join('');

  const clips = ORDER.map(id =>
    `<clipPath id="clip-${id}"><path d="${REGION_DEFS[id].path}"/></clipPath>`).join('');

  return `
<svg id="island-map" viewBox="0 0 ${VB.w} ${VB.h}" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="Kart over øya med årets saker">
  <defs>
    ${clips}
    <linearGradient id="sea-grad" x1="0" y1="0" x2=".35" y2="1">
      <stop offset="0" stop-color="#12293A"/>
      <stop offset=".55" stop-color="#0E2130"/>
      <stop offset="1" stop-color="#081420"/>
    </linearGradient>
    <radialGradient id="isle-halo" cx=".55" cy=".5" r=".52">
      <stop offset="0" stop-color="#5BBFAD" stop-opacity=".2"/>
      <stop offset="1" stop-color="#5BBFAD" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="land-grad" x1=".3" y1="0" x2=".7" y2="1">
      <stop offset="0" stop-color="#27505F"/>
      <stop offset="1" stop-color="#15303C"/>
    </linearGradient>
  </defs>

  <rect width="${VB.w}" height="${VB.h}" rx="14" fill="url(#sea-grad)"/>
  <ellipse cx="292" cy="200" rx="240" ry="180" fill="url(#isle-halo)"/>

  <g class="sea-lines" stroke="#37677C" stroke-width="1.2" stroke-linecap="round"
     fill="none" opacity=".28">
    <path d="M42 62h52M120 42h36M190 30h28M456 62h40M468 100h34M470 300h32M416 342h46M330 358h42"/>
    <path d="M22 108h32M14 328h38M96 342h34M240 360h46M486 238h24M492 158h18M60 322h26"/>
  </g>

  <!-- brenningen rundt øya -->
  <path d="${COAST}" fill="none" stroke="#5BBFAD" stroke-width="8" opacity=".09"/>
  <path d="${COAST}" fill="none" stroke="#5BBFAD" stroke-width="3.4" opacity=".15"/>
  <path d="${COAST}" fill="url(#land-grad)" stroke="#08131E" stroke-width="1.5"/>

  ${zones}
  ${traces}

  <g class="map-compass" opacity=".38">
    <circle cx="476" cy="44" r="14" fill="none" stroke="#456B80" stroke-width="1.1"/>
    <path d="M476 33l3.6 11-3.6 3.6-3.6-3.6z" fill="#5BBFAD"/>
    <path d="M476 55l-3.6-11 3.6-3.6 3.6 3.6z" fill="#456B80"/>
    <text x="476" y="24" text-anchor="middle" class="compass-n">N</text>
  </g>
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
