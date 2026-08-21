// map.js – abstrakt SVG-kart over hjemnasjonen og de 6 nabonasjonene.
// Ren rendering: tar imot state, returnerer en SVG-streng. Ingen mutasjon.

import { NATIONS } from './nations.js';

const VOID = '#0B0E13';
const HOME_FILL = '#2E3846';
const HOME_STROKE = '#C9A227';
const GOLD = '#C9A227';
const CRIMSON = '#C9524B';

const W = 640, H = 640;
const CX = W / 2, CY = H / 2;
const HOME_R = 78;
const NATION_R = 62;
const ORBIT = 218;

function blobPath(cx, cy, baseR, seed) {
  const points = 9;
  const pts = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = baseR * (1 + 0.15 * Math.sin(seed + i * 2.399));
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = '';
  const start = mid(pts[points - 1], pts[0]);
  d += `M ${start[0].toFixed(1)} ${start[1].toFixed(1)} `;
  for (let i = 0; i < points; i++) {
    const next = pts[(i + 1) % points];
    const m = mid(pts[i], next);
    d += `Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)} `;
  }
  return d + 'Z';
}

function nationPosition(index) {
  const angle = -Math.PI / 2 + (index / NATIONS.length) * Math.PI * 2;
  return { x: CX + ORBIT * Math.cos(angle), y: CY + ORBIT * Math.sin(angle) };
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function stanceBadge(x, y, move) {
  if (!move) return '';
  const emoji = move === 'C' ? '🤝' : '⚔️';
  return `
    <g class="stance-badge" transform="translate(${x + 40},${y - 44})">
      <circle r="16" fill="#12161C" stroke="${move === 'C' ? '#3E8E7E' : CRIMSON}" stroke-width="2"/>
      <text text-anchor="middle" dominant-baseline="central" font-size="16">${emoji}</text>
    </g>`;
}

export function createMapSVG(state, opts = {}) {
  const { selectedNationId } = opts;

  const homeGlow = `
    <circle cx="${CX}" cy="${CY}" r="${HOME_R + 10}" fill="${HOME_STROKE}" opacity="0.08"/>`;

  const homeTerritory = `
    <g class="map-home">
      <circle cx="${CX}" cy="${CY}" r="${HOME_R}" fill="${HOME_FILL}" stroke="${HOME_STROKE}" stroke-width="3"/>
      <text x="${CX}" y="${CY - 6}" text-anchor="middle" font-size="26" dominant-baseline="central">🏛️</text>
      <text x="${CX}" y="${CY + 26}" text-anchor="middle" font-size="13" fill="#EDE7D9" font-family="var(--font-u)">${escapeXml(state.playerName)}</text>
    </g>`;

  const links = NATIONS.map((n, i) => {
    const p = nationPosition(i);
    const rel = state.relations[n.id];
    const tone = rel.warActive ? CRIMSON : rel.allianceActive ? GOLD : hexToRgba(n.color, 0.35);
    return `<line x1="${CX}" y1="${CY}" x2="${p.x}" y2="${p.y}" stroke="${tone}" stroke-width="${rel.allianceActive || rel.warActive ? 2.5 : 1.5}" stroke-dasharray="${rel.warActive ? '4 4' : 'none'}" opacity="0.6"/>`;
  }).join('');

  const territories = NATIONS.map((n, i) => {
    const p = nationPosition(i);
    const rel = state.relations[n.id];
    const selected = selectedNationId === n.id;
    const path = blobPath(p.x, p.y, NATION_R, i * 1.7);
    const fill = hexToRgba(n.color, rel.warActive ? 0.12 : 0.28);
    let ringColor = n.color;
    let ringWidth = 2.5;
    let ringDash = 'none';
    if (rel.warActive) { ringColor = CRIMSON; ringWidth = 3.5; ringDash = '5 3'; }
    else if (rel.allianceActive) { ringColor = GOLD; ringWidth = 3.5; }

    const statusEmoji = rel.warActive ? '⚔️' : rel.allianceActive ? '🕊️' : rel.score <= -25 ? '⚠️' : '';

    return `
      <g class="map-nation${selected ? ' is-selected' : ''}" data-id="${n.id}" tabindex="0" role="button"
         aria-label="${escapeXml(n.name)} – ${escapeXml(statusLabel(rel))}">
        ${selected ? `<circle cx="${p.x}" cy="${p.y}" r="${NATION_R + 14}" fill="none" stroke="#EDE7D9" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.6"/>` : ''}
        <path d="${path}" fill="${fill}" stroke="${ringColor}" stroke-width="${ringWidth}" stroke-dasharray="${ringDash}"/>
        <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="24" dominant-baseline="central">${n.emblem}</text>
        <text x="${p.x}" y="${p.y + 20}" text-anchor="middle" font-size="11" fill="#EDE7D9" font-family="var(--font-u)">${escapeXml(shortName(n.name))}</text>
        ${statusEmoji ? `<text x="${p.x - 38}" y="${p.y - 38}" font-size="16">${statusEmoji}</text>` : ''}
        ${stanceBadge(p.x, p.y, state.pendingStances[n.id])}
      </g>`;
  }).join('');

  return `
    <svg id="map-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Kart over nasjonene">
      <rect x="0" y="0" width="${W}" height="${H}" fill="${VOID}"/>
      ${links}
      ${homeGlow}
      ${territories}
      ${homeTerritory}
    </svg>`;
}

function shortName(name) {
  const parts = name.split(' ');
  return parts[parts.length - 1];
}

function statusLabel(rel) {
  if (rel.warActive) return 'krig';
  if (rel.allianceActive) return 'allianse';
  if (rel.score >= 25) return 'godt forhold';
  if (rel.score <= -25) return 'anspent forhold';
  return 'nøytralt forhold';
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function setupMapListeners(container, onNationClick) {
  container.querySelectorAll('.map-nation').forEach(el => {
    const id = el.dataset.id;
    el.addEventListener('click', () => onNationClick(id));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNationClick(id); }
    });
  });
}
