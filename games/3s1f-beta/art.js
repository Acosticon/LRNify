// art.js – Visuelt bibliotek for 3S1F beta
//
// Alt her er håndtegnet SVG i én felles stil, definert av stilbibelen:
// redaksjonell plakatillustrasjon, silhuettbasert, varm kantbelysning,
// mørk marineblå grunn og de tre stemmenes faste farger.
//
// Formen er bevisst valgt: silhuetter og flate plan leser som *tilsiktet*
// grafikk i alle størrelser, i motsetning til emoji som varierer med
// operativsystem. Hvert element ligger bak en funksjon, slik at rasterkunst
// senere kan byttes inn ett sted uten å røre resten av spillet.

// ─── Palett ───────────────────────────────────────────
export const PALETTE = {
  ink:      '#0D1B2A',
  deep:     '#132233',
  slate:    '#1A3A4A',
  gold:     '#E8C547',
  goldLite: '#F4DE8C',
  goldDark: '#A8811D',
  coral:    '#E87D5B',
  coralLite:'#F6AE93',
  coralDark:'#A64B2E',
  teal:     '#5BBFAD',
  tealLite: '#9BDCCF',
  tealDark: '#2E7C6E',
  paper:    '#F5F0E8',
  paperInk: '#1A1008',
  bone:     '#F0EDE4',
};

export const REGION_COLORS = {
  nordkysten:   '#E8C547',
  skoglandet:   '#5BBFAD',
  fjordbygdene: '#7FB97F',
  vesthavet:    '#4A9CC2',
  havnebyen:    '#9A8EC0',
  sentrum:      '#E87D5B',
};

const svg = (viewBox, inner, cls = '', extra = '') =>
  `<svg viewBox="${viewBox}" class="${cls}" xmlns="http://www.w3.org/2000/svg" ` +
  `fill="none" aria-hidden="true" focusable="false" ${extra}>${inner}</svg>`;

// ─── Tekstur og filtre ────────────────────────────────
// Legges én gang i dokumentet. Kornet er det som skiller en flat
// nettside fra noe som ser trykt ut.
export function textureDefs() {
  return `
<svg class="art-defs" width="0" height="0" aria-hidden="true" focusable="false">
  <defs>
    <filter id="grain-fine" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
    </filter>
    <filter id="grain-paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="4" seed="19" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
    </filter>
    <filter id="art-soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
    <filter id="edge-rough" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04 0.06" numOctaves="3" seed="4" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="3" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
</svg>`;
}

// ─── 1. Stemmeikoner ──────────────────────────────────
// Funksjonelle merker som må lese på 20 px. Ett motiv per stemme,
// hentet rett fra hovedillustrasjonens rekvisitter.

const VOICE_ART = {
  business: c => `
    <path d="M4.5 27.5h23" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="10.5" cy="24" rx="6.2" ry="2.5" fill="${c}"/>
    <ellipse cx="10.5" cy="20.4" rx="6.2" ry="2.5" fill="${c}" opacity=".82"/>
    <ellipse cx="10.5" cy="16.8" rx="6.2" ry="2.5" fill="${c}" opacity=".64"/>
    <path d="M19.5 22.5v-5m4 5v-9m4 9v-13" stroke="${c}" stroke-width="2.6"
          stroke-linecap="round"/>
    <path d="M18 11.5 22 7l3 2.8L28.5 4" stroke="${c}" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round" opacity=".6"/>`,

  people: c => `
    <circle cx="7.5" cy="13.5" r="3.3" fill="${c}" opacity=".55"/>
    <path d="M1.5 26c0-3.6 2.7-6.4 6-6.4s6 2.8 6 6.4" fill="${c}" opacity=".55"/>
    <circle cx="24.5" cy="13.5" r="3.3" fill="${c}" opacity=".55"/>
    <path d="M18.5 26c0-3.6 2.7-6.4 6-6.4s6 2.8 6 6.4" fill="${c}" opacity=".55"/>
    <circle cx="16" cy="10.8" r="4.6" fill="${c}"/>
    <path d="M7.6 27.5c0-4.8 3.8-8.6 8.4-8.6s8.4 3.8 8.4 8.6z" fill="${c}"/>`,

  nature: c => `
    <path d="M15.9 27.5V13.6" stroke="${c}" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M15.6 17.4c-4.9.5-8-2.4-8.4-7.3 4.9-.5 8.1 2.4 8.4 7.3z" fill="${c}" opacity=".68"/>
    <path d="M16.4 14.2c4.4-1.5 6.5-5.2 5.2-9.6-4.4 1.5-6.5 5.2-5.2 9.6z" fill="${c}"/>
    <path d="M4.5 23.2c2.8 3.2 6.6 4.8 11.4 4.8s8.6-1.6 11.4-4.8"
          stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M4.5 23.2c0 3.1 1.4 4.6 4.2 4.6" stroke="${c}" stroke-width="2.4"
          stroke-linecap="round" opacity=".55"/>
    <path d="M27.3 23.2c0 3.1-1.4 4.6-4.2 4.6" stroke="${c}" stroke-width="2.4"
          stroke-linecap="round" opacity=".55"/>`,
};

const VOICE_COLOR = {
  business: PALETTE.gold,
  people:   PALETTE.coral,
  nature:   PALETTE.teal,
};

export function voiceIcon(key, cls = 'ico') {
  const color = VOICE_COLOR[key] || PALETTE.bone;
  return svg('0 0 32 32', VOICE_ART[key]?.(color) || '', `art-ico ${cls}`);
}

// ─── 2. Regionikoner ──────────────────────────────────

const REGION_ART = {
  // Vindturbin over en kystrygg
  nordkysten: c => `
    <path d="M2 27.5h28" stroke="${c}" stroke-width="1.8" stroke-linecap="round" opacity=".4"/>
    <path d="M2 27.5c5-5.5 9.5-5.5 13 0" stroke="${c}" stroke-width="1.6"
          stroke-linecap="round" opacity=".45"/>
    <path d="M18 27.5V12" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="18" cy="11" r="2" fill="${c}"/>
    <path d="M18 11 17 2.5l3 .6z" fill="${c}"/>
    <path d="M18 11 26 7.5l-.8 3z" fill="${c}"/>
    <path d="M18 11l-7.2 5 2.3 2z" fill="${c}"/>`,

  // Barskog i tre lag
  skoglandet: c => `
    <path d="M2 27.5h28" stroke="${c}" stroke-width="1.8" stroke-linecap="round" opacity=".4"/>
    <path d="M7.5 6.5 13 24H2z" fill="${c}" opacity=".5"/>
    <path d="M24.5 8 29 24H20z" fill="${c}" opacity=".5"/>
    <path d="M16 2.5 24 24H8z" fill="${c}"/>
    <path d="M16 24v3.5" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,

  // Låve over åkerfurer
  fjordbygdene: c => `
    <path d="M3 24.5c6.5-2 19.5-2 26 0" stroke="${c}" stroke-width="1.6"
          stroke-linecap="round" opacity=".45"/>
    <path d="M2 28c7-2.4 21-2.4 28 0" stroke="${c}" stroke-width="1.6"
          stroke-linecap="round" opacity=".45"/>
    <path d="M16 3 28 9.5V22H4V9.5z" fill="${c}" opacity=".9"/>
    <path d="M12.5 22v-7.5h7V22z" fill="${PALETTE.ink}" opacity=".55"/>
    <path d="M16 3 28 9.5" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`,

  // Fiskebåt på bølger
  vesthavet: c => `
    <path d="M5 17.5h9.5V4z" fill="${c}"/>
    <path d="M17 17.5V6l7 11.5z" fill="${c}" opacity=".65"/>
    <path d="M15.8 3.5v14.5" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M3 19h26l-3.5 5.5H6.5z" fill="${c}"/>
    <path d="M2 27.5c2.4 0 2.4-1.8 4.8-1.8s2.4 1.8 4.8 1.8 2.4-1.8 4.8-1.8 2.4 1.8 4.8 1.8
             2.4-1.8 4.8-1.8 2.4 1.8 4.8 1.8" stroke="${c}" stroke-width="1.8"
          stroke-linecap="round" opacity=".5"/>`,

  // Havnekran over industripiper
  havnebyen: c => `
    <path d="M2 27.5h28" stroke="${c}" stroke-width="1.8" stroke-linecap="round" opacity=".4"/>
    <path d="M14 24V13h9v11z" fill="${c}" opacity=".55"/>
    <path d="M17 13V8h2.2v5m3.4 0V9.5h2.2V13" fill="${c}" opacity=".55"/>
    <path d="M6 24V6" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M6 6h16" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M6 9.5 12.5 6" stroke="${c}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
    <path d="M19 6v5.5" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M17 11.5h4V15h-4z" fill="${c}"/>
    <path d="M2 24h11v4H2z" fill="${c}"/>`,

  // Bykjerne med tårn
  sentrum: c => `
    <path d="M2 27.5h28" stroke="${c}" stroke-width="1.8" stroke-linecap="round" opacity=".4"/>
    <path d="M2 24V14h7v10z" fill="${c}" opacity=".55"/>
    <path d="M23 24V11h7v13z" fill="${c}" opacity=".55"/>
    <path d="M16 2.5 22 9v15H10V9z" fill="${c}"/>
    <path d="M13.6 24v-6.5h4.8V24z" fill="${PALETTE.ink}" opacity=".5"/>
    <path d="M14.4 13.4h3.2M16 11.8v3.2" stroke="${PALETTE.ink}" stroke-width="1.4"
          stroke-linecap="round" opacity=".5"/>
    <path d="M4.2 20.5h2.6M25.2 18.5h2.6M25.2 21.5h2.6" stroke="${PALETTE.ink}"
          stroke-width="1.4" stroke-linecap="round" opacity=".4"/>`,
};

export function regionIcon(id, color, cls = 'ico') {
  const c = color || REGION_COLORS[id] || PALETTE.bone;
  return svg('0 0 32 32', REGION_ART[id]?.(c) || '', `art-ico ${cls}`);
}

// ─── 3. Portrettmedaljonger ───────────────────────────
// De tre stemmene som faste karakterer. Silhuett mot opplyst scene –
// samme grep som gamle opplysningsplakater, og det holder seg verdig
// i vektor der ansiktsdetaljer ville falt sammen.

function medallion(id, bg, scene, figure, ring) {
  return `
  <defs>
    <clipPath id="clip-${id}"><circle cx="100" cy="100" r="100"/></clipPath>
    <linearGradient id="bg-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg[0]}"/>
      <stop offset=".52" stop-color="${bg[1]}"/>
      <stop offset="1" stop-color="${bg[2]}"/>
    </linearGradient>
    <radialGradient id="glow-${id}" cx=".5" cy=".42" r=".55">
      <stop offset="0" stop-color="#FFF7DC" stop-opacity=".62"/>
      <stop offset="1" stop-color="#FFF7DC" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g clip-path="url(#clip-${id})">
    <rect width="200" height="200" fill="url(#bg-${id})"/>
    <rect width="200" height="200" fill="url(#glow-${id})"/>
    ${scene}
    ${figure}
    <rect width="200" height="200" filter="url(#grain-fine)" opacity=".13"
          style="mix-blend-mode:overlay"/>
  </g>
  <circle cx="100" cy="100" r="96" fill="none" stroke="${ring}" stroke-width="6" opacity=".85"/>
  <circle cx="100" cy="100" r="91" fill="none" stroke="${bg[0]}" stroke-width="1.5" opacity=".45"/>`;
}

const PORTRAITS = {
  // Næringslivet: dress, korslagte armer, skyline og kran bak
  business: () => medallion('biz',
    ['#F4DE8C', '#E8C547', '#A8811D'],
    `<g fill="${PALETTE.slate}" opacity=".34">
       <rect x="6" y="86" width="20" height="72"/>
       <rect x="30" y="64" width="24" height="94"/>
       <rect x="150" y="72" width="22" height="86"/>
       <rect x="176" y="94" width="20" height="64"/>
       <rect x="58" y="100" width="16" height="58"/>
       <rect x="128" y="106" width="16" height="52"/>
     </g>
     <g stroke="${PALETTE.slate}" stroke-width="3" opacity=".42" stroke-linecap="round">
       <path d="M44 60V22M44 22h44M44 30l16-8M78 22v14"/>
     </g>
     <rect y="156" width="200" height="44" fill="${PALETTE.ink}" opacity=".2"/>`,
    `<g fill="${PALETTE.ink}">
       <path d="M18 200c3-40 34-64 82-64s79 24 82 64z"/>
       <path d="M100 34c17 0 28 12 28 30v14c0 17-12 29-28 29s-28-12-28-29V64c0-18 11-30 28-30z"/>
       <path d="M70 62c0-20 12-32 30-32s30 12 30 32c-6-12-16-16-30-16s-24 4-30 16z"/>
     </g>
     <path d="M100 136 78 144l22 44 22-44z" fill="${PALETTE.bone}"/>
     <path d="M100 148 92 155l8 33 8-33z" fill="${PALETTE.gold}"/>
     <path d="M76 62c-8 12-8 34 2 47" stroke="${PALETTE.goldLite}" stroke-width="4"
           stroke-linecap="round" fill="none" opacity=".55"/>
     <path d="M42 200c4-28 20-46 44-54" stroke="${PALETTE.goldLite}" stroke-width="4"
           stroke-linecap="round" fill="none" opacity=".35"/>`,
    PALETTE.ink),

  // Innbyggerne: draperi over hodet, folkemengde bak
  people: () => medallion('ppl',
    ['#F6AE93', '#E87D5B', '#A64B2E'],
    `<g fill="${PALETTE.slate}" opacity=".3">
       <path d="M0 158V112h26v46zM30 158v-60h30v60zM140 158v-54h28v54zM172 158v-40h28v40z"/>
       <path d="M64 158V96l16-14 16 14v62z"/>
       <path d="M104 158v-52l14-12 14 12v52z"/>
     </g>
     <g fill="${PALETTE.tealDark}" opacity=".3">
       <circle cx="24" cy="120" r="16"/><circle cx="178" cy="128" r="14"/>
     </g>
     <g fill="${PALETTE.ink}" opacity=".42">
       <circle cx="40" cy="126" r="13"/><path d="M18 200c0-16 10-28 22-28s22 12 22 28z"/>
       <circle cx="162" cy="130" r="12"/><path d="M142 200c0-15 9-26 20-26s20 11 20 26z"/>
       <circle cx="66" cy="140" r="10"/><path d="M50 200c0-12 7-21 16-21s16 9 16 21z"/>
     </g>
     <rect y="160" width="200" height="40" fill="${PALETTE.ink}" opacity=".18"/>`,
    `<g fill="${PALETTE.ink}">
       <path d="M100 28c-24 0-40 18-40 44 0 14-3 24-8 32-12 18-20 48-24 96h144c-4-48-12-78-24-96
                -5-8-8-18-8-32 0-26-16-44-40-44z"/>
     </g>
     <path d="M100 46c-15 0-25 12-25 28 0 9 2 16 5 21 5 8 12 12 20 12s15-4 20-12c3-5 5-12 5-21
              0-16-10-28-25-28z" fill="${PALETTE.coralDark}" opacity=".38"/>
     <path d="M74 66c-6 14-4 34 4 48" stroke="${PALETTE.coralLite}" stroke-width="4"
           stroke-linecap="round" fill="none" opacity=".6"/>
     <path d="M126 118c8 14 14 44 16 82" stroke="${PALETTE.coralLite}" stroke-width="4"
           stroke-linecap="round" fill="none" opacity=".35"/>
     <path d="M100 130c-14 6-22 22-24 70h48c-2-48-10-64-24-70z" fill="${PALETTE.coralDark}"
           opacity=".32"/>`,
    PALETTE.ink),

  // Naturen: bustete hår, skjegg, frøplante i hendene
  nature: () => medallion('nat',
    ['#9BDCCF', '#5BBFAD', '#2E7C6E'],
    `<g fill="${PALETTE.slate}" opacity=".3">
       <path d="M0 200V128l34-30 30 26 26-22 34 30 32-28 44 38v58z"/>
     </g>
     <g fill="${PALETTE.ink}" opacity=".26">
       <path d="M14 158 26 118l12 40zM44 162 58 112l14 50zM136 160 150 114l14 46zM166 164 178 124l12 40z"/>
     </g>
     <path d="M0 176c30-10 46 6 70 0s34-14 60-8 40 14 70 6v26H0z" fill="${PALETTE.tealDark}"
           opacity=".35"/>`,
    `<g fill="${PALETTE.ink}">
       <path d="M18 200c3-38 32-62 82-62s79 24 82 62z"/>
       <path d="M100 36c18 0 29 12 29 31v13c0 12-3 21-8 27-6 7-13 11-21 11s-15-4-21-11c-5-6-8-15-8-27
                V67c0-19 11-31 29-31z"/>
       <path d="M69 70c-2-24 12-38 31-38s33 14 31 38c-4-11-9-13-14-18-6 7-15 4-21 9-5-6-13-3-17 2
                -4 2-7 4-10 7z"/>
     </g>
     <path d="M100 132c-16 0-26 8-26 8l6 8h40l6-8s-10-8-26-8z" fill="${PALETTE.tealDark}"
           opacity=".45"/>
     <path d="M74 68c-7 13-6 34 3 46" stroke="${PALETTE.tealLite}" stroke-width="4"
           stroke-linecap="round" fill="none" opacity=".6"/>
     <g>
       <path d="M62 168c0 18 17 26 38 26s38-8 38-26c0-6-4-8-8-5-8 6-18 9-30 9s-22-3-30-9c-4-3-8-1-8 5z"
             fill="${PALETTE.ink}" opacity=".9"/>
       <path d="M100 172v-24" stroke="${PALETTE.tealLite}" stroke-width="3.4" stroke-linecap="round"/>
       <path d="M99 158c-9 1-15-4-16-14 9-1 15 4 16 14z" fill="${PALETTE.tealLite}"/>
       <path d="M101 152c8-3 12-10 10-18-8 3-12 10-10 18z" fill="${PALETTE.tealLite}"/>
     </g>`,
    PALETTE.ink),
};

export function voicePortrait(key, cls = '') {
  return svg('0 0 200 200', PORTRAITS[key]?.() || '', `art-portrait ${cls}`);
}

// ─── 4. Avisvignetter ─────────────────────────────────
// Små blekktegninger til «Øyposten». Skravur i stedet for gråtoner,
// slik en avis faktisk trykket før rasteret kom.

const INK = PALETTE.paperInk;

function hatch(id, angle) {
  return `<pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse"
            patternTransform="rotate(${angle})">
            <line x1="0" y1="0" x2="0" y2="5" stroke="${INK}" stroke-width="1.1"/>
          </pattern>`;
}

const SPOTS = {
  business: `
    <defs>${hatch('h-biz', 34)}</defs>
    <rect width="320" height="170" fill="none"/>
    <g stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 150h284"/>
      <path d="M42 150V70h44v80z" fill="url(#h-biz)"/>
      <path d="M96 150V44h40v106z"/>
      <path d="M146 150V88h36v62z" fill="url(#h-biz)"/>
      <path d="M104 60h8m8 0h8M104 76h8m8 0h8M104 92h8m8 0h8M104 108h8m8 0h8"/>
      <path d="M196 150V116l24-20 22 26 26-46 24 18"/>
      <path d="M292 84h-24m24 0v24"/>
      <circle cx="230" cy="60" r="15"/>
      <path d="M224 54h12M224 60h12M224 66h12"/>
    </g>`,

  people: `
    <defs>${hatch('h-ppl', -28)}</defs>
    <g stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 150h292"/>
      <path d="M64 44h136v34H64z" fill="url(#h-ppl)"/>
      <path d="M78 58h34M126 58h60M78 68h108" stroke-width="1.8"/>
      <path d="M96 78v22M180 78v22"/>
      <g>
        <circle cx="52" cy="106" r="12"/><path d="M32 150c0-13 9-23 20-23s20 10 20 23"/>
        <circle cx="92" cy="98" r="13"/><path d="M70 150c0-14 10-25 22-25s22 11 22 25"/>
        <circle cx="134" cy="104" r="12"/><path d="M114 150c0-13 9-23 20-23s20 10 20 23"/>
        <circle cx="176" cy="98" r="13"/><path d="M154 150c0-14 10-25 22-25s22 11 22 25"/>
        <circle cx="220" cy="106" r="12"/><path d="M200 150c0-13 9-23 20-23s20 10 20 23"/>
        <circle cx="260" cy="100" r="13"/><path d="M238 150c0-14 10-25 22-25s22 11 22 25"/>
      </g>
    </g>`,

  nature: `
    <defs>${hatch('h-nat', 60)}</defs>
    <g stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 150h300"/>
      <path d="M46 24 82 122H10z" fill="url(#h-nat)"/><path d="M46 122v28"/>
      <path d="M104 48l28 74h-56z"/><path d="M104 122v28"/>
      <path d="M268 36l32 86h-64z" fill="url(#h-nat)"/><path d="M268 122v28"/>
      <path d="M150 150c14-18 32-26 54-26s40 8 54 26" stroke-width="2"/>
      <path d="M150 138c18-14 36-20 54-20s36 6 54 20" stroke-width="1.6"/>
      <path d="M196 40c-10 8-12 20-4 28 8-8 10-20 4-28z"/>
      <path d="M206 56c10-4 14-14 10-24-10 4-14 14-10 24z"/>
      <path d="M202 90V56" />
      <path d="M232 62c6-6 14-6 20 0-4 6-14 8-20 0z" stroke-width="1.8"/>
    </g>`,

  crisis: `
    <defs>${hatch('h-cri', 12)}</defs>
    <g stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M52 62c-14 0-24-10-24-22s10-22 24-22c4-14 16-22 32-22 18 0 32 12 34 30
               14 2 24 12 24 24 0 14-12 24-26 24z" transform="translate(30 6)" fill="url(#h-cri)"/>
      <path d="M150 82l-22 34h20l-16 30" stroke-width="3.4"/>
      <path d="M96 96l-8 22M120 104l-8 20M182 100l-8 22M206 94l-8 24" stroke-width="2"/>
      <path d="M10 150c16 0 16-14 32-14s16 14 32 14 16-14 32-14 16 14 32 14 16-14 32-14
               16 14 32 14 16-14 32-14 16 14 32 14" stroke-width="2.6"/>
      <path d="M242 132V88l26-18 26 18v44" stroke-width="2.4" transform="rotate(7 268 110)"/>
      <path d="M256 132v-24h24v24" stroke-width="1.8" transform="rotate(7 268 110)"/>
    </g>`,
};

export function newsSpot(kind) {
  return svg('0 0 320 170', SPOTS[kind] || SPOTS.business, 'art-spot');
}

// Velger vignett ut fra hendelsestype og regionens karakter.
const SPOT_BY_TYPE = { A: 'business', B: 'crisis', C: 'crisis', D: 'people' };
const SPOT_BY_REGION = {
  nordkysten: 'business', skoglandet: 'nature', fjordbygdene: 'nature',
  vesthavet: 'nature', havnebyen: 'business', sentrum: 'people',
};
export function spotFor(type, region) {
  if (type === 'B' || type === 'C') return 'crisis';
  return SPOT_BY_REGION[region] || SPOT_BY_TYPE[type] || 'people';
}

// ─── 5. Segl og merker ────────────────────────────────
// Voksperle med båndender – til utmerkelser. Revet, svidd papir – til arr.

export function seal(color = PALETTE.gold, cls = '') {
  return svg('0 0 64 64', `
    <defs>
      <radialGradient id="seal-g" cx=".38" cy=".32" r=".78">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity=".45"/>
        <stop offset=".55" stop-color="#FFFFFF" stop-opacity="0"/>
        <stop offset="1" stop-color="#000000" stop-opacity=".3"/>
      </radialGradient>
    </defs>
    <path d="M20 40 12 62l10-4 6 6 6-24zM44 40l8 22-10-4-6 6-6-24z" fill="${color}" opacity=".55"/>
    <circle cx="32" cy="28" r="21" fill="${color}"/>
    <circle cx="32" cy="28" r="21" fill="url(#seal-g)"/>
    <circle cx="32" cy="28" r="16" fill="none" stroke="${PALETTE.ink}"
            stroke-width="1.6" opacity=".45" stroke-dasharray="2.4 3"/>
    <path d="M32 18l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2-6.5-3.4-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1z"
          fill="${PALETTE.ink}" opacity=".55"/>`, `art-seal ${cls}`);
}

export function scarMark(cls = '') {
  return svg('0 0 64 64', `
    <path d="M8 14l9-4 8 5 9-6 8 4 9-3 5 8-3 9 4 8-6 7 1 9-9 2-6 7-9-4-9 3-6-8 2-9-5-8 5-7z"
          fill="${PALETTE.coralDark}" opacity=".35" filter="url(#edge-rough)"/>
    <path d="M24 10c-4 12 6 16 2 26s4 14 2 20" stroke="${PALETTE.coral}" stroke-width="3.4"
          stroke-linecap="round" fill="none"/>
    <path d="M40 14c-3 10 4 13 1 22s3 12 1 17" stroke="${PALETTE.coral}" stroke-width="2.6"
          stroke-linecap="round" fill="none" opacity=".65"/>
    <path d="M18 32h28" stroke="${PALETTE.coralLite}" stroke-width="2" stroke-linecap="round"
          opacity=".5" stroke-dasharray="3 5"/>`, `art-scar ${cls}`);
}

// ─── 6. Emoji-medaljong ───────────────────────────────
// Spillet har rundt femti hendelsesikoner som fortsatt er emoji.
// De rammes inn i en støpt skive med regionens farge, slik at de leser
// som del av systemet i stedet for som løs tekst.
export function iconChip(emoji, color = '#92B0C2', cls = '') {
  return `<span class="art-chip ${cls}" style="--chip:${color}" aria-hidden="true">${emoji}</span>`;
}

// ─── 7. Tittelbilde ───────────────────────────────────
// Øya sett fra havet ved daggry, med de tre stemmene som vitner i forgrunnen.

export function heroArt(cls = '') {
  return svg('0 0 1200 640', `
    <defs>
      <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0D1B2A"/>
        <stop offset=".42" stop-color="#17364A"/>
        <stop offset=".72" stop-color="#2E5468"/>
        <stop offset="1" stop-color="#5D7B84"/>
      </linearGradient>
      <radialGradient id="hero-sun" cx=".5" cy=".78" r=".42">
        <stop offset="0" stop-color="#F4DE8C" stop-opacity=".92"/>
        <stop offset=".4" stop-color="#E8C547" stop-opacity=".38"/>
        <stop offset="1" stop-color="#E8C547" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="hero-sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2A4D5E"/>
        <stop offset="1" stop-color="#0D1B2A"/>
      </linearGradient>
      <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0A1622" stop-opacity="0"/>
        <stop offset=".58" stop-color="#0A1622" stop-opacity=".26"/>
        <stop offset="1" stop-color="#0A1622" stop-opacity=".94"/>
      </linearGradient>
    </defs>

    <rect width="1200" height="640" fill="url(#hero-sky)"/>
    <g fill="#F0EDE4" opacity=".5">
      <circle cx="140" cy="72" r="1.7"/><circle cx="284" cy="130" r="1.2"/>
      <circle cx="420" cy="58" r="1.5"/><circle cx="596" cy="104" r="1.1"/>
      <circle cx="742" cy="66" r="1.6"/><circle cx="910" cy="124" r="1.3"/>
      <circle cx="1064" cy="80" r="1.5"/><circle cx="1148" cy="150" r="1.1"/>
      <circle cx="212" cy="182" r="1"/><circle cx="988" cy="196" r="1"/>
    </g>
    <ellipse cx="600" cy="392" rx="520" ry="300" fill="url(#hero-sun)"/>

    <!-- fjern fjellrekke -->
    <path d="M0 372l96-54 74 40 60-30 88 48 70-34 92 52 84-46 96 54 78-40 84 46 88-32 90 50v88H0z"
          fill="#1A3A4A" opacity=".55"/>

    <!-- øya -->
    <path d="M232 400c60-46 118-30 176-58 52-26 108-34 176-16 62 16 108 4 158 26 46 20 78 22 106 48z"
          fill="#132233"/>
    <path d="M232 400h616v18H232z" fill="#132233"/>
    <g opacity=".85">
      <path d="M330 376l16-42 16 42zM366 380l13-34 13 34zM300 382l12-30 12 30z" fill="#0D1B2A"/>
      <path d="M690 372l18-46 18 46zM726 378l14-36 14 36z" fill="#0D1B2A"/>
      <g fill="#0D1B2A">
        <rect x="470" y="336" width="26" height="64"/><rect x="504" y="316" width="30" height="84"/>
        <rect x="542" y="348" width="22" height="52"/><rect x="574" y="328" width="28" height="72"/>
      </g>
      <g fill="#E8C547" opacity=".72">
        <rect x="478" y="352" width="5" height="6"/><rect x="488" y="368" width="5" height="6"/>
        <rect x="512" y="336" width="5" height="6"/><rect x="522" y="360" width="5" height="6"/>
        <rect x="512" y="380" width="5" height="6"/><rect x="580" y="346" width="5" height="6"/>
        <rect x="590" y="368" width="5" height="6"/><rect x="548" y="366" width="5" height="6"/>
      </g>
      <g stroke="#0D1B2A" stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M634 400V300M634 300h44M634 310l16-10M666 300v18"/>
      </g>
      <g stroke="#0D1B2A" stroke-width="3.4" stroke-linecap="round" fill="none">
        <path d="M410 400v-56"/><circle cx="410" cy="342" r="4" fill="#0D1B2A" stroke="none"/>
        <path d="M410 342l-3-32 8 1zM410 342l28-13-3 10zM410 342l-25 18 8 7z" fill="#0D1B2A" stroke="none"/>
      </g>
    </g>

    <!-- hav -->
    <rect y="418" width="1200" height="222" fill="url(#hero-sea)"/>
    <g stroke="#5BBFAD" stroke-width="2" stroke-linecap="round" opacity=".22">
      <path d="M60 448h120M240 462h90M400 444h140M600 470h110M760 450h130M960 464h150M120 486h180M420 496h150M700 490h180"/>
    </g>
    <g stroke="#E8C547" stroke-width="2.4" stroke-linecap="round" opacity=".2">
      <path d="M556 442h88M566 462h68M548 482h104M572 502h56M540 522h120"/>
    </g>

    <!-- tre båter på vei hjem: øyas tre interesser, i samme farvann -->
    <g>
      <g transform="translate(392 496) scale(.9)">
        <path d="M-26 0h52l-9 13h-34z" fill="#0A1622"/>
        <path d="M-3-1v-26l17 26z" fill="#0A1622"/>
        <path d="M-6-1v-20l-13 20z" fill="#0A1622"/>
        <path d="M-8 8h30" stroke="#E8C547" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
      </g>
      <g transform="translate(608 536) scale(1.15)">
        <path d="M-30 0h60l-10 14h-40z" fill="#0A1622"/>
        <path d="M-3-1v-30l19 30z" fill="#0A1622"/>
        <path d="M-6-1v-23l-15 23z" fill="#0A1622"/>
        <path d="M-10 9h34" stroke="#E87D5B" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
      </g>
      <g transform="translate(828 508) scale(.82)">
        <path d="M-26 0h52l-9 13h-34z" fill="#0A1622"/>
        <path d="M-3-1v-26l17 26z" fill="#0A1622"/>
        <path d="M-6-1v-20l-13 20z" fill="#0A1622"/>
        <path d="M-8 8h30" stroke="#5BBFAD" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
      </g>
    </g>

    <rect y="380" width="1200" height="260" fill="url(#hero-fade)"/>
    <rect width="1200" height="640" filter="url(#grain-fine)" opacity=".1"
          style="mix-blend-mode:overlay"/>`,
    `art-hero ${cls}`, 'preserveAspectRatio="xMidYMax slice"');
}

// ─── 8. Bakgrunn til årsovergang ──────────────────────
// Bevisst avdempet: den skal ligge bak et enormt årstall.

export function transitionArt(cls = '') {
  return svg('0 0 1200 640', `
    <defs>
      <radialGradient id="tr-glow" cx=".5" cy=".62" r=".5">
        <stop offset="0" stop-color="#5BBFAD" stop-opacity=".16"/>
        <stop offset="1" stop-color="#5BBFAD" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="640" fill="${PALETTE.ink}"/>
    <rect width="1200" height="640" fill="url(#tr-glow)"/>
    <g stroke="${PALETTE.slate}" stroke-width="1.4" fill="none" opacity=".5">
      <path d="M-40 470c120-60 220-20 330-52s180-70 300-56 190 66 300 44 190-58 350-24"/>
      <path d="M-40 506c120-60 220-20 330-52s180-70 300-56 190 66 300 44 190-58 350-24"/>
      <path d="M-40 542c120-60 220-20 330-52s180-70 300-56 190 66 300 44 190-58 350-24"/>
      <path d="M-40 578c120-60 220-20 330-52s180-70 300-56 190 66 300 44 190-58 350-24"/>
      <path d="M-40 614c120-60 220-20 330-52s180-70 300-56 190 66 300 44 190-58 350-24"/>
    </g>
    <path d="M300 452c56-38 112-24 168-48 50-22 102-28 166-12 58 14 100 4 148 22 44 16 74 18 100 38z"
          fill="${PALETTE.deep}" opacity=".9"/>
    <rect width="1200" height="640" filter="url(#grain-fine)" opacity=".07"
          style="mix-blend-mode:overlay"/>`,
    `art-transition ${cls}`, 'preserveAspectRatio="xMidYMid slice"');
}

// ─── 9. Målerglyffer ──────────────────────────────────
// Liten markør som viser hvor en måler startet, tegnet inn i røret.
export function meterTicks() {
  return `<span class="meter-ticks" aria-hidden="true">
    <i style="--at:25%"></i><i style="--at:50%"></i><i style="--at:75%"></i>
  </span>`;
}
