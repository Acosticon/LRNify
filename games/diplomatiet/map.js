// map.js – kampanjens fremdriftsstripe: seks nasjoner i rekkefølge, med
// status låst / aktiv / ferdig. Ikke-interaktiv (kampanjen er sekvensiell,
// så det er alltid nøyaktig én nasjon å forhandle med om gangen).
// Ren rendering: tar imot state, returnerer en SVG-streng.

import { CAMPAIGN_ORDER } from './nations.js';

const LOCKED_RING = '#3D4A5A';
const LOCKED_FILL = '#161B22';
const GOLD = '#C9A227';
const CRIMSON = '#C9524B';

const W = 920, H = 130;
const MARGIN_X = 70;
const CY = 52;
const NODE_R = 30;

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusGlyph(rel) {
  if (rel.warActive) return '⚔️';
  if (rel.allianceActive) return '🕊️';
  if (rel.score >= 25) return '🙂';
  if (rel.score <= -25) return '☹️';
  return '';
}

export function createProgressStrip(state) {
  const total = CAMPAIGN_ORDER.length;
  const step = total > 1 ? (W - MARGIN_X * 2) / (total - 1) : 0;

  const track = `<line x1="${MARGIN_X}" y1="${CY}" x2="${W - MARGIN_X}" y2="${CY}" stroke="${LOCKED_RING}" stroke-width="2"/>`;

  const nodes = CAMPAIGN_ORDER.map((n, i) => {
    const x = MARGIN_X + i * step;
    const isDone = i < state.campaignIndex;
    const isActive = i === state.campaignIndex;
    const isLocked = i > state.campaignIndex;
    const rel = state.relations[n.id];

    let ring = LOCKED_RING;
    let fill = LOCKED_FILL;
    let content = `<text x="${x}" y="${CY + 6}" text-anchor="middle" font-size="16" opacity="0.5">🔒</text>`;
    let labelOpacity = 0.4;
    let labelWeight = 400;

    if (isActive) {
      ring = n.color;
      fill = hexToRgba(n.color, 0.32);
      content = `<text x="${x}" y="${CY + 7}" text-anchor="middle" font-size="22" dominant-baseline="central">${n.emblem}</text>`;
      labelOpacity = 1;
      labelWeight = 700;
    } else if (isDone) {
      ring = rel.warActive ? CRIMSON : rel.allianceActive ? GOLD : n.color;
      fill = hexToRgba(n.color, 0.2);
      const glyph = statusGlyph(rel);
      content = `
        <text x="${x}" y="${CY + 6}" text-anchor="middle" font-size="18" dominant-baseline="central" opacity="0.85">${n.emblem}</text>
        ${glyph ? `<text x="${x + 20}" y="${CY - 18}" font-size="14">${glyph}</text>` : ''}`;
      labelOpacity = 0.85;
      labelWeight = 600;
    }

    return `
      <g class="progress-node${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}${isLocked ? ' is-locked' : ''}">
        ${isActive ? `<circle cx="${x}" cy="${CY}" r="${NODE_R + 8}" fill="none" stroke="${n.color}" stroke-width="1.5" stroke-dasharray="2 4" opacity="0.7" class="pulse-ring"/>` : ''}
        <circle cx="${x}" cy="${CY}" r="${NODE_R}" fill="${fill}" stroke="${ring}" stroke-width="${isActive ? 3 : 2}"/>
        ${content}
        <text x="${x}" y="${CY + NODE_R + 20}" text-anchor="middle" font-size="11" fill="#EDE7D9" opacity="${labelOpacity}" font-weight="${labelWeight}" font-family="var(--font-u)">${escapeXml(shortName(n.name))}</text>
      </g>`;
  }).join('');

  return `
    <svg id="progress-strip" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Fremdrift gjennom kampanjen">
      ${track}
      ${nodes}
    </svg>`;
}

function shortName(name) {
  const parts = name.split(' ');
  return parts[parts.length - 1];
}
