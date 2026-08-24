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

// Figurene er bygget i tre tonenivåer: hodet i blekk, plagget en tone
// lysere, og et kantlys på siden. Ett flatt svart omriss forsvant på 78 px –
// det er skillet mellom tonene som gjør at formen leser.
const PORTRAITS = {
  // Næringslivet: dress, skyline og kran bak
  business: () => medallion('biz',
    ['#F4DE8C', '#E8C547', '#A8811D'],
    `<circle cx="100" cy="80" r="66" fill="#FFF3C4" opacity=".5"/>
     <g fill="${PALETTE.deep}" opacity=".45">
       <rect x="2" y="92" width="27" height="70"/><rect x="34" y="64" width="31" height="98"/>
       <rect x="139" y="76" width="29" height="86"/><rect x="173" y="100" width="27" height="62"/>
     </g>
     <g stroke="${PALETTE.deep}" stroke-width="4" opacity=".5" stroke-linecap="round" fill="none">
       <path d="M46 66V24M46 24h46M46 33l18-9M84 24v15"/>
     </g>
     <rect y="158" width="200" height="42" fill="${PALETTE.ink}" opacity=".22"/>`,
    `<path d="M86 110h28v30H86z" fill="${PALETTE.ink}"/>
     <path d="M16 200c3-40 34-64 84-64s81 24 84 64z" fill="#16324A"/>
     <path d="M100 136 82 143l18 47 18-47z" fill="${PALETTE.bone}"/>
     <path d="M100 149 92 156l8 34 8-34z" fill="${PALETTE.gold}"/>
     <path d="M100 34c17 0 29 12 29 31v15c0 17-13 29-29 29s-29-12-29-29V65c0-19 12-31 29-31z"
           fill="${PALETTE.ink}"/>
     <path d="M70 63c0-20 12-33 30-33s30 13 30 33c-6-13-16-17-30-17s-24 4-30 17z" fill="${PALETTE.ink}"/>
     <path d="M75 60c-8 13-8 36 2 49" stroke="${PALETTE.goldLite}" stroke-width="5"
           stroke-linecap="round" fill="none" opacity=".72"/>
     <path d="M40 200c5-27 21-44 44-52" stroke="${PALETTE.goldLite}" stroke-width="5"
           stroke-linecap="round" fill="none" opacity=".4"/>`,
    PALETTE.ink),

  // Innbyggerne: draperi over hodet, folk og hus bak
  people: () => medallion('ppl',
    ['#F6AE93', '#E87D5B', '#A64B2E'],
    `<circle cx="100" cy="80" r="64" fill="#FFDFCB" opacity=".46"/>
     <g fill="${PALETTE.deep}" opacity=".42">
       <path d="M0 162v-54h31v54zM37 162V96l20-17 20 17v66zM123 162v-58h31v58zM160 162v-46h40v46z"/>
     </g>
     <g fill="${PALETTE.ink}" opacity=".45">
       <circle cx="34" cy="124" r="14"/><path d="M10 200c0-17 11-30 24-30s24 13 24 30z"/>
       <circle cx="168" cy="128" r="13"/><path d="M146 200c0-16 10-28 22-28s22 12 22 28z"/>
     </g>
     <rect y="162" width="200" height="38" fill="${PALETTE.ink}" opacity=".2"/>`,
    `<path d="M100 26c-25 0-42 19-42 46 0 15-3 25-8 33-12 19-20 50-24 95h148c-4-45-12-76-24-95
              -5-8-8-18-8-33 0-27-17-46-42-46z" fill="#7A2A18"/>
     <path d="M100 44c-16 0-27 13-27 30 0 10 2 18 6 24 5 8 12 13 21 13s16-5 21-13c4-6 6-14 6-24
              0-17-11-30-27-30z" fill="${PALETTE.ink}"/>
     <path d="M100 128c-15 6-24 24-26 72h52c-2-48-11-66-26-72z" fill="#5C1E10"/>
     <path d="M72 64c-6 15-4 36 4 51" stroke="${PALETTE.coralLite}" stroke-width="5"
           stroke-linecap="round" fill="none" opacity=".78"/>
     <path d="M128 122c8 15 14 46 16 78" stroke="${PALETTE.coralLite}" stroke-width="5"
           stroke-linecap="round" fill="none" opacity=".42"/>`,
    PALETTE.ink),

  // Naturen: bustete hår, skjegg, frøplante i hendene
  nature: () => medallion('nat',
    ['#9BDCCF', '#5BBFAD', '#2E7C6E'],
    `<circle cx="100" cy="78" r="62" fill="#E2F7F0" opacity=".42"/>
     <path d="M0 200v-70l36-32 32 28 28-24 36 32 34-30 34 34v62z" fill="${PALETTE.deep}" opacity=".45"/>
     <g fill="${PALETTE.ink}" opacity=".35">
       <path d="M12 160 26 112l14 48zM44 164 60 106l16 58zM134 162 150 108l16 54zM168 166 182 120l14 46z"/>
     </g>`,
    `<path d="M86 112h28v30H86z" fill="${PALETTE.ink}"/>
     <path d="M16 200c3-38 33-62 84-62s81 24 84 62z" fill="#1F4038"/>
     <path d="M100 138 84 145l16 33 16-33z" fill="#2E6455"/>
     <path d="M100 34c19 0 30 13 30 32v14c0 13-3 22-9 29-6 8-13 12-21 12s-15-4-21-12c-6-7-9-16-9-29V66
              c0-19 11-32 30-32z" fill="${PALETTE.ink}"/>
     <path d="M68 68c-2-25 13-38 32-38s34 13 32 38c-4-11-9-13-15-18-6 7-15 4-22 9-5-6-13-3-17 2
              -4 2-7 4-10 7z" fill="${PALETTE.ink}"/>
     <path d="M60 170c0 19 18 28 40 28s40-9 40-28c0-6-4-9-9-5-8 6-19 10-31 10s-23-4-31-10c-5-4-9-1-9 5z"
           fill="${PALETTE.ink}"/>
     <path d="M100 174v-26" stroke="${PALETTE.tealLite}" stroke-width="4" stroke-linecap="round"/>
     <path d="M99 160c-10 1-16-5-17-15 10-1 16 5 17 15z" fill="${PALETTE.tealLite}"/>
     <path d="M101 153c9-3 13-11 11-19-9 3-13 11-11 19z" fill="${PALETTE.tealLite}"/>
     <path d="M73 66c-7 14-6 36 3 48" stroke="${PALETTE.tealLite}" stroke-width="5"
           stroke-linecap="round" fill="none" opacity=".72"/>`,
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

// ─── 6. Hendelsespiktogrammer ─────────────────────────
// Hendelsesdatabasen merker hvert valg med en emoji. Emoji tegnes ulikt på
// hvert operativsystem og bryter med resten av strekføringen, så hver av dem
// har fått et piktogram her. Alle er tegnet i samme rutenett på 32×32 med lik
// strektykkelse, slik at de leser som ett sett.
//
// Nøklene står uten variantvelger (U+FE0F); oppslaget stripper den bort,
// så både '☀' og '☀️' treffer.

const PICTO = {
  // Vær, vann og landskap
  '☀':  `<circle cx="16" cy="16" r="6"/><path d="M16 3.5v3.5M16 25v3.5M3.5 16H7M25 16h3.5
          M7 7l2.4 2.4M22.6 22.6L25 25M25 7l-2.4 2.4M9.4 22.6L7 25"/>`,
  '🔆': `<circle cx="16" cy="16" r="5.4" fill="currentColor"/><path d="M16 3.5v4M16 24.5v4
          M3.5 16h4M24.5 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M25.2 6.8l-2.8 2.8M9.6 22.4l-2.8 2.8"/>`,
  '🌊': `<path d="M3.5 13c3 0 3-3.2 6-3.2S12.5 13 15.5 13s3-3.2 6-3.2S24.5 13 28.5 13"/>
         <path d="M3.5 20c3 0 3-3.2 6-3.2S12.5 20 15.5 20s3-3.2 6-3.2S24.5 20 28.5 20"/>
         <path d="M3.5 27c3 0 3-3.2 6-3.2S12.5 27 15.5 27s3-3.2 6-3.2S24.5 27 28.5 27"/>`,
  '🌫': `<path d="M5 9h22M9 15h14M5 21h22M11 27h10"/>`,
  '💧': `<path d="M16 3.5c5.2 6.4 8 10.6 8 14.4a8 8 0 0 1-16 0c0-3.8 2.8-8 8-14.4z"/>`,
  '💨': `<path d="M3.5 11h14a4 4 0 1 0-4-4.2M3.5 18h20a4 4 0 1 1-4 4.2M3.5 25h11"/>`,
  '🏔': `<path d="M2.5 26l9.5-16.5 6 10.5 4-5.5L29.5 26z"/><path d="M9 20l3-2.4 2.2 3"/>`,

  // Vekster
  '🌱': `<path d="M16 28.5V17"/><path d="M16 20.5c-5.2 0-8.2-3.2-8.2-8.4 5.2 0 8.2 3.2 8.2 8.4z"/>
         <path d="M16 17c4.2-1.2 6-4.4 4.8-8.6-4.2 1.2-6 4.4-4.8 8.6z"/>`,
  '🌳': `<path d="M16 28.5v-8.6"/><path d="M11.8 28.5h8.4"/>
         <path d="M16 3.5c3 0 5.4 1.8 6.4 4.4 2.8.6 4.6 3 4.6 5.8 0 3.5-2.8 6.2-6.6 6.2H11.6
                  C7.8 19.9 5 17.2 5 13.7c0-2.8 1.8-5.2 4.6-5.8C10.6 5.3 13 3.5 16 3.5z"/>`,
  '🌿': `<path d="M8.5 28.5C8.5 17 14.5 8.5 25.5 6"/>
         <path d="M25.5 6c-8.4 0-12.6 4-12.6 11.4 8.4 0 12.6-4 12.6-11.4z"/>`,
  '🌾': `<path d="M16 28.5V12"/><path d="M16 12c-4.2 0-6.2-2.2-6.2-6.4C14 5.6 16 7.8 16 12z
          M16 12c4.2 0 6.2-2.2 6.2-6.4C18 5.6 16 7.8 16 12zM16 20.5c-4.2 0-6.2-2.2-6.2-6.4
          4.2 0 6.2 2.2 6.2 6.4zM16 20.5c4.2 0 6.2-2.2 6.2-6.4-4.2 0-6.2 2.2-6.2 6.4z"/>`,
  // Riflene på tvers er det som gjør at roten leser som gulrot og ikke blad
  '🥕': `<path d="M4.5 28.5c9.2-2.4 16.2-9.6 18.6-18.6C13.9 12.3 6.9 19.3 4.5 28.5z"/>
         <path d="M9.6 22.6l3.6 1.6M13.4 17.8l3.6 1.6M17.2 13.2l3.4 1.4"/>
         <path d="M23.1 9.9l3.9-4.2M24.8 12.2l4.7-2.4M20.6 7.9l1.2-5.4"/>`,

  // Dyr
  '🐋': `<path d="M3.5 19c0-5.2 5.4-9.4 11.6-9.4S28.5 13.8 28.5 19c0 3.2-4.4 5.4-12.6 5.4S3.5 22.2 3.5 19z"/>
         <path d="M28.5 19l3.2-5v10z"/><path d="M9.5 17h.01"/>`,
  '🐝': `<ellipse cx="16" cy="19.5" rx="6" ry="7.2"/><path d="M10.2 17.2h11.6M10.2 21.6h11.6"/>
         <path d="M12 12.5c-3.2-4-7.4-4-8.4-1 3.2 3 6.4 3 8.4 1zM20 12.5c3.2-4 7.4-4 8.4-1-3.2 3-6.4 3-8.4 1z"/>`,
  '🐟': `<path d="M27.5 16c-4.2-6-10.4-8-16.4-6-4.2 1.4-7.2 3.6-8.2 6 1 2.4 4 4.6 8.2 6 6 2 12.2 0 16.4-6z"/>
         <path d="M27.5 16l3.2-4.6M27.5 16l3.2 4.6"/><path d="M9.5 14h.01"/>`,
  '🐠': `<path d="M26.5 16c-4-5.2-9.2-7.2-14.4-5.2C8 12 5 13.8 4 16c1 2.2 4 4 8.1 5.2 5.2 2 10.4 0 14.4-5.2z"/>
         <path d="M26.5 16l4.4-4.4v8.8z"/><path d="M13.5 11.6v8.8"/><path d="M8.5 14.6h.01"/>`,
  '🐦': `<circle cx="19" cy="10" r="4.6"/><path d="M23.6 10l4.6 1.7-4.6 2.1z"/>
         <path d="M20 8.6h.01"/>
         <path d="M15.6 13.6C10 15.2 6 18.6 4.6 23.8c5.8 1.5 10.9.3 14.3-3.2 2.2-2.3 3-4.9 2.5-7.2z"/>
         <path d="M4.6 23.8l-2.4 4.6 5.2-1.2"/>`,
  // Labbeavtrykk. Et ulvehode i vektor endte uansett med å lese som en katt;
  // avtrykket sier «vilt dyr» uten å måtte tegne arten.
  '🐺': `<ellipse cx="16" cy="21.4" rx="7" ry="6"/>
         <ellipse cx="7.4" cy="13.2" rx="3.2" ry="4"/><ellipse cx="12.8" cy="8.4" rx="3.2" ry="4.3"/>
         <ellipse cx="19.2" cy="8.4" rx="3.2" ry="4.3"/><ellipse cx="24.6" cy="13.2" rx="3.2" ry="4"/>`,
  '🦉': `<path d="M16 4.5c6.2 0 10.4 5 10.4 11.4S22.2 27.5 16 27.5 5.6 22.3 5.6 15.9 9.8 4.5 16 4.5z"/>
         <circle cx="11.8" cy="14" r="3"/><circle cx="20.2" cy="14" r="3"/>
         <path d="M16 18.5l-2 2.2h4z"/><path d="M8 7.5l3 3M24 7.5l-3 3"/>`,

  // Energi og industri
  '⚡': `<path d="M18.5 2.5L8 18h6.2l-1.8 11.5L24 14h-6.2z"/>`,
  '🏭': `<path d="M3.5 28.5V15.5l6.4 4.2v-4.2l6.4 4.2v-4.2l6.4 4.2V7.5h5.8v21z"/>
         <path d="M9 24.5v-2.6M16 24.5v-2.6M23 24.5v-2.6"/>`,
  '⚙': `<circle cx="16" cy="16" r="4.6"/><path d="M16 2.5v5M16 24.5v5M2.5 16h5M24.5 16h5
          M6.4 6.4l3.5 3.5M22.1 22.1l3.5 3.5M25.6 6.4l-3.5 3.5M9.9 22.1l-3.5 3.5" stroke-width="3.2"/>`,
  '🔋': `<rect x="2.5" y="10" width="22" height="12" rx="3.5"/><path d="M28 14.2v3.6"/>
         <path d="M8 14.2v3.6M13 14.2v3.6M18 14.2v3.6"/>`,
  '🕯': `<path d="M16 1.8c2.7 3 3.8 4.9 3.8 6.5a3.8 3.8 0 0 1-7.6 0c0-1.6 1.1-3.5 3.8-6.5z"/>
         <path d="M16 12.4v3.8"/>
         <path d="M11.2 28.5V20.9a4.8 4.8 0 0 1 9.6 0v7.6z"/>`,
  '🧪': `<path d="M11.5 3.5v16.4a4.7 4.7 0 0 0 9.4 0V3.5"/><path d="M9.5 3.5h13.4"/>
         <path d="M11.5 15.5h9.4"/>`,
  '⛏': `<path d="M6.5 27L21 11.5"/><path d="M12.5 5.5c6.4 0 11.6 5.4 13.6 12.6"/>
         <path d="M12.5 5.5l4.4 4.4M26.1 18.1l-4.4-4.4"/>`,
  '🪨': `<path d="M4.5 24.5l4.2-11.4 8.4-5.2 10.4 6.2 2 10.4z"/>
         <path d="M8.7 13.1l8.4 6.2 10.4-3.2M17.1 19.3l-1.6 5.2"/>`,
  '🪵': `<rect x="3.5" y="9.5" width="25" height="13" rx="6.5"/>
         <ellipse cx="10" cy="16" rx="4" ry="6.5"/><ellipse cx="10" cy="16" rx="1.7" ry="2.9"/>
         <path d="M18 10.6v10.8M23 11.4v9.2"/>`,
  '♻': `<path d="M26 12.4A11 11 0 1 0 27 20.6"/><path d="M27 20.6l.6-5.4M27 20.6l-5.4-.6"/>
         <path d="M16 20.5c-3.6 0-5.6-2.2-5.6-6 3.6 0 5.6 2.2 5.6 6z"/>`,
  '💻': `<rect x="5.5" y="6.5" width="21" height="13.4" rx="2.2"/>
         <path d="M2.5 23.5h27l-2.2 4H4.7z"/>`,

  // Bygg
  '🏗': `<path d="M7.5 28.5V5.5"/><path d="M7.5 5.5h18.4"/><path d="M7.5 11L16 5.5"/>
         <path d="M22 5.5v7.4"/><rect x="18.8" y="12.9" width="6.4" height="5.2"/>
         <path d="M3.5 28.5h10"/>`,
  '🏘': `<path d="M3.5 28.5V16.4l6.2-5.2 6.2 5.2v12.1z"/><path d="M16 28.5V13.2l6-5 6.2 5v15.3z"/>
         <path d="M8.4 28.5v-6h3.2v6M20.6 28.5v-6h3.2v6"/>`,
  '🏡': `<path d="M3.5 28.5V15l9-7.2 9 7.2v13.5z"/><path d="M10 28.5v-7.2h5v7.2"/>
         <path d="M27 28.5v-5.4"/><circle cx="27" cy="19.4" r="3.6"/>`,
  '🏥': `<path d="M4.5 28.5V10L16 3.5 27.5 10v18.5z"/><path d="M16 11.5v9.4M11.3 16.2h9.4"/>`,
  '🏫': `<path d="M3.5 28.5V14.4L16 7l12.5 7.4v14.1z"/><path d="M11.6 28.5v-7.6h8.8v7.6"/>
         <path d="M16 7V2.2"/><path d="M16 2.6h6.6l-1.7 2.1 1.7 2.1H16z"/>
         <path d="M7.6 18.4h3.2M21.2 18.4h3.2"/>`,

  // Hav og havn
  '⚓': `<circle cx="16" cy="5.6" r="3.1"/><path d="M16 8.7v18.8"/><path d="M9.4 13.6h13.2"/>
         <path d="M4.5 17.4c0 6.2 5.2 10.1 11.5 10.1s11.5-3.9 11.5-10.1"/>
         <path d="M4.5 17.4l-2.4 4.2M4.5 17.4l4.2 2.2M27.5 17.4l2.4 4.2M27.5 17.4l-4.2 2.2"/>`,
  '🚢': `<path d="M3.5 20h25l-4.2 6.4H7.7z"/><path d="M9.6 20v-8h10.6v8"/><path d="M13 12V7.6h4.4V12"/>
         <path d="M2.5 28.5c3.2 0 3.2-1.8 6.4-1.8s3.2 1.8 6.4 1.8 3.2-1.8 6.4-1.8 3.2 1.8 6.4 1.8"/>`,
  '🎣': `<path d="M3.5 28.5C9.5 21.6 16.5 13 24.5 3.5"/><circle cx="11" cy="19" r="2.4"/>
         <path d="M24.5 3.5v14.2"/>
         <path d="M24.5 17.7c-3.3 0-4.9 2.1-4.9 4s1.7 3.5 3.5 3.5"/>`,
  '🗺': `<path d="M3.5 8.4l8.4-3.2 8.2 3.2 8.4-3.2v19l-8.4 3.2-8.2-3.2-8.4 3.2z"/>
         <path d="M11.9 5.2v19M20.1 8.4v19"/>`,

  // Folk og styre
  '🤝': `<circle cx="9" cy="8.8" r="4.2"/><circle cx="23" cy="8.8" r="4.2"/>
         <path d="M1.8 26.5c0-4 3.2-7.2 7.2-7.2s7.2 3.2 7.2 7.2M15.8 26.5c0-4 3.2-7.2 7.2-7.2s7.2 3.2 7.2 7.2"/>`,
  '🤲': `<path d="M3.5 14.5c0 8 5.6 13.4 12.5 13.4S28.5 22.5 28.5 14.5"/>
         <path d="M3.5 14.5c0-3.2 2-4.4 3.2-2.2M28.5 14.5c0-3.2-2-4.4-3.2-2.2"/>
         <path d="M16 4v6.4M12 7.2l1.2 4M20 7.2l-1.2 4"/>`,
  '🗣': `<circle cx="11.5" cy="9" r="4.6"/><path d="M3.5 27.5c0-4.8 3.6-8.4 8-8.4s8 3.6 8 8.4"/>
         <path d="M23 9c1.6 2.2 1.6 5.4 0 7.6M27 5.8c3.2 4.4 3.2 9.8 0 14"/>`,
  '✊': `<path d="M6.8 28.5v-9.2a5.6 5.6 0 0 1 5.6-5.6h8.4a4.2 4.2 0 0 1 4.2 4.2v10.6z"/>
         <path d="M11.6 13.7v-3.5a2.3 2.3 0 1 1 4.6 0v3.5M16.2 13.7V8.6a2.3 2.3 0 1 1 4.6 0v5.1
                  M20.8 13.7v-2.8a2.3 2.3 0 1 1 4.6 0v3.4"/>
         <path d="M6.8 21.8c0-2.6 1.8-4.4 4.4-4.4"/>`,
  '🗳': `<rect x="3.5" y="15" width="25" height="13.5" rx="2.2"/><path d="M9 15V9.4h14V15"/>
         <path d="M11.5 12.2h9"/>
         <rect x="12.6" y="1.5" width="6.8" height="4.6" rx="1.2"/><path d="M16 6.1v2.4"/>`,
  '⚖': `<path d="M16 4.5v23M9 27.5h14"/><path d="M16 6.2l-10 3.6M16 6.2l10 3.6M6 9.8h20"/>
         <path d="M1.8 19.6a4.2 4.2 0 0 0 8.4 0L6 9.8zM21.8 19.6a4.2 4.2 0 0 0 8.4 0L26 9.8z"/>`,
  '📢': `<path d="M3.5 12.6v6.8a2.2 2.2 0 0 0 2.2 2.2h4.4l10.4 6.4V4L10.1 10.4H5.7a2.2 2.2 0 0 0-2.2 2.2z"/>
         <path d="M24.5 11.2c2.2 3 2.2 6.6 0 9.6"/>`,
  '😤': `<circle cx="16" cy="13" r="9.4"/><path d="M10.8 10.8l4.2 2.2M21.2 10.8L17 13"/>
         <path d="M12.4 18h7.2"/><path d="M8.4 24c-1.2 2-1.2 3.2 0 4.4M23.6 24c1.2 2 1.2 3.2 0 4.4"/>`,

  // Helse, skole, forvaltning
  '💊': `<g transform="rotate(-35 16 16)"><rect x="2.5" y="11" width="27" height="10" rx="5"/>
         <path d="M16 11v10"/></g>`,
  '💙': `<path d="M16 27.5S3.5 20.2 3.5 12.6A6.6 6.6 0 0 1 16 8.8a6.6 6.6 0 0 1 12.5 3.8c0 7.6-12.5 14.9-12.5 14.9z"/>`,
  '📚': `<rect x="3.5" y="20" width="25" height="6.4" rx="1.4"/><rect x="5.6" y="13.6" width="20.8" height="6.4" rx="1.4"/>
         <rect x="7.8" y="7.2" width="16.4" height="6.4" rx="1.4"/>`,
  '✏': `<path d="M5.5 26.5l2.2-6.4L21.8 6l4.2 4.2L12.2 24.3z"/><path d="M18.8 9l4.2 4.2"/>
         <path d="M5.5 26.5l6.4-2.2"/>`,
  '📐': `<path d="M4.5 27.5V5.5l22 22z"/><path d="M4.5 18.5h4.2M4.5 12.5h4.2"/>`,
  '🔬': `<path d="M5.5 28.5h21"/><path d="M10.5 28.5v-2.8h11v2.8"/>
         <path d="M10.5 22h11"/><path d="M16 25.7V22"/>
         <g transform="rotate(18 17.5 12)"><rect x="14.4" y="3.5" width="6.2" height="14.6" rx="3.1"/>
           <path d="M14.4 8h6.2"/></g>
         <path d="M21.5 22c3.8 0 6.4-2.8 6.4-6.8"/>`,
  '🔭': `<g transform="rotate(-30 16 16)"><rect x="4.2" y="11.6" width="16.4" height="8.4" rx="2.6"/>
           <path d="M20.6 9.6h5.2v12.4h-5.2z"/></g>
         <path d="M13.6 21.8v6.7M9.4 28.5h8.4"/>`,
  '📋': `<rect x="6" y="6" width="20" height="22.5" rx="2.2"/><rect x="11" y="3" width="10" height="5.2" rx="1.6"/>
         <path d="M11 15.4h10M11 20.4h7"/>`,
  '📉': `<path d="M3.5 4.5v24h25"/><path d="M8 11l6 6.4 4.2-4.2 9 9"/><path d="M27.2 22.2v-5.4M27.2 22.2h-5.4"/>`,
  '🎯': `<circle cx="16" cy="16" r="11.4"/><circle cx="16" cy="16" r="6.6"/>
         <circle cx="16" cy="16" r="2.1" fill="currentColor"/>`,
  '🧭': `<circle cx="16" cy="16" r="12"/><path d="M21.4 10.6l-3.2 8.2-8.2 3.2 3.2-8.2z"/>`,

  // Fare
  '⚠': `<path d="M16 3.5L2 28.5h28z"/><path d="M16 13v6.6M16 24h.01"/>`,
  '💀': `<path d="M16 3c6.9 0 11 5 11 11 0 4-2 6-2 8v2.4a2.2 2.2 0 0 1-2.2 2.2H9.2A2.2 2.2 0 0 1 7 24.4V22c0-2-2-4-2-8C5 8 9.1 3 16 3z"/>
         <circle cx="11.6" cy="14" r="2.7"/><circle cx="20.4" cy="14" r="2.7"/><path d="M16 18.4v3"/>`,
  '☠': `<path d="M16 2c6.4 0 10.4 4.6 10.4 10.4 0 3.8-1.8 5.6-1.8 7.6h-17c0-2-1.8-3.8-1.8-7.6C5.8 6.6 9.6 2 16 2z"/>
         <circle cx="11.8" cy="12.6" r="2.6"/><circle cx="20.2" cy="12.6" r="2.6"/>
         <path d="M6 28.5l20-5M26 28.5l-20-5"/>`,
  // Trekløveret er tre 60°-vinger mellom r=4 og r=11,5, ikke tre overlappende
  // kiler – slik de var, klumpet de seg til én flate.
  '☢': `<circle cx="16" cy="16" r="13"/><circle cx="16" cy="16" r="3" fill="currentColor"/>
         <path d="M10.25 6.04A11.5 11.5 0 0 1 21.75 6.04L18 12.54A4 4 0 0 0 14 12.54Z"/>
         <path d="M27.5 16A11.5 11.5 0 0 1 21.75 25.96L18 19.46A4 4 0 0 0 20 16Z"/>
         <path d="M10.25 25.96A11.5 11.5 0 0 1 4.5 16L12 16A4 4 0 0 0 14 19.46Z"/>`,
  '🚨': `<path d="M6.5 27.5h19"/><path d="M9 27.5v-7.4a7 7 0 0 1 14 0v7.4"/>
         <path d="M16 6.4V2.5M26.4 11.6l3.2-2.2M5.6 11.6L2.4 9.4"/>`,
  '🚫': `<circle cx="16" cy="16" r="12"/><path d="M7.5 24.5l17-17"/>`,
};

// Oppslag som tåler både '☀' og '☀️'
const pictoKey = e => String(e ?? '').replace(/️/g, '');

export function hasPictogram(emoji) {
  return Boolean(PICTO[pictoKey(emoji)]);
}

const PICTO_ATTRS =
  'fill="none" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"';

export function pictogram(emoji, color = '#92B0C2', cls = 'ico') {
  const art = PICTO[pictoKey(emoji)];
  if (!art) return null;
  return svg('0 0 32 32',
    `<g color="${color}" stroke="${color}" ${PICTO_ATTRS}>${art}</g>`, `art-ico ${cls}`);
}

// Samme tegning, men som en gruppe klar til å limes inn i et større SVG –
// kartet trenger piktogrammene inne i sitt eget koordinatsystem.
export function pictogramNode(emoji, color, cx, cy, size = 14) {
  const art = PICTO[pictoKey(emoji)];
  if (!art) return '';
  const s = size / 32;
  // Streken skaleres ned sammen med resten. På 14 enheter blir den designede
  // tykkelsen for tynn til å bære, så den settes en tredel kraftigere.
  return `<g transform="translate(${(cx - size / 2).toFixed(2)} ${(cy - size / 2).toFixed(2)}) scale(${s.toFixed(4)})"
             color="${color}" stroke="${color}" ${PICTO_ATTRS}
             stroke-width="2.8">${art}</g>`;
}

// ─── Medaljong ────────────────────────────────────────
// Rammen rundt et hendelsesikon. Bruker piktogrammet når det finnes, og
// faller tilbake til emojien for et motiv som ennå ikke er tegnet.
export function iconChip(emoji, color = '#92B0C2', cls = '') {
  const picto = pictogram(emoji, color, 'in-chip');
  return `<span class="art-chip ${picto ? 'has-picto' : ''} ${cls}"
                style="--chip:${color}" aria-hidden="true">${picto || emoji}</span>`;
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
