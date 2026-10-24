// Flat inline-SVG illustrations that replace the mid-fi grey placeholders.
// Colours come only from CSS classes (.ill-*) mapped to DS tokens, so they
// follow light / dark theme. Real artwork can replace these later (README).

import { PIN_OUTER, PIN_KEY } from './brand.js';

const svg = (vb, body, label, cls = '') =>
  `<svg class="ill ${cls}" viewBox="${vb}" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- shared parts (same drawings as the driver app) ----

/** Mumbai auto rickshaw, drawn facing right, origin at its rear wheel base. */
function auto(x, y, s = 1, plate = 'MH 02 AB 1234') {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse class="ill-shade" cx="58" cy="62" rx="70" ry="7"/>
    <path class="ill-teal" d="M8 18 Q12 -8 44 -10 H100 Q122 -8 128 18 Z"/>
    <path class="ill-ink" d="M0 58 V26 Q0 8 22 6 H106 Q130 8 140 32 L148 58 Z"/>
    <path class="ill-glass" d="M104 12 Q124 14 132 34 H104 Z" opacity=".9"/>
    <rect class="ill-glass" x="34" y="14" width="56" height="20" rx="4" opacity=".55"/>
    <rect class="ill-teal" x="0" y="38" width="148" height="5" opacity=".9"/>
    <circle class="ill-white" cx="142" cy="46" r="4"/>
    <rect class="ill-plate" x="50" y="43" width="70" height="14" rx="2.5"/>
    <text class="ill-plate-text" x="85" y="53" text-anchor="middle" textLength="62" lengthAdjust="spacingAndGlyphs">${esc(plate)}</text>
    <circle class="ill-ink" cx="22" cy="60" r="13"/><circle class="ill-kerb" cx="22" cy="60" r="5"/>
    <circle class="ill-ink" cx="128" cy="60" r="13"/><circle class="ill-kerb" cx="128" cy="60" r="5"/>
  </g>`;
}

/** Pickup-bay pin = the Fixride keyhole pin (brand mark on the map). */
function bayPin(x, y, label) {
  return `<g transform="translate(${x} ${y})"><g class="ill-bob">
    <ellipse class="ill-shade" cx="0" cy="40" rx="14" ry="4"/>
    <path class="ill-teal" fill-rule="evenodd" transform="translate(-16 -2) scale(.32)" d="${PIN_OUTER} ${PIN_KEY}"/>
    <rect class="ill-teal" x="-30" y="-36" width="60" height="22" rx="11"/>
    <text class="ill-label ill-label--on-teal" x="0" y="-21" text-anchor="middle">${esc(label)}</text>
  </g></g>`;
}

function plane(x, y, r = -12) {
  return `<g transform="translate(${x} ${y}) rotate(${r})">
    <path class="ill-white ill-stroke" d="M-30 0 Q-30 -6 -22 -6 H22 Q34 -6 36 0 Q34 6 22 6 H-22 Q-30 6 -30 0 Z"/>
    <path class="ill-white ill-stroke" d="M-2 -5 L-14 -26 H-6 L14 -5 Z"/>
    <path class="ill-white ill-stroke" d="M-2 5 L-14 26 H-6 L14 5 Z"/>
    <path class="ill-white ill-stroke" d="M-24 -5 L-31 -17 H-25 L-16 -5 Z"/>
    <circle class="ill-teal" cx="26" cy="-1" r="2"/><circle class="ill-teal" cx="18" cy="-1" r="2"/><circle class="ill-teal" cx="10" cy="-1" r="2"/>
  </g>`;
}

/** Rider walking right, pulling a big bag, a cabin bag on her shoulder. Origin at her feet. */
function rider(x, y) {
  return `<g transform="translate(${x} ${y})">
    <ellipse class="ill-shade" cx="-14" cy="2" rx="46" ry="5"/>
    <!-- big check-in bag, pulled behind -->
    <path class="ill-line-ink" d="M-23 -60 L-48 -38"/>
    <g transform="translate(-74 -40) rotate(-8)">
      <rect class="ill-teal-dark" width="34" height="40" rx="6"/>
      <rect class="ill-teal" x="4" y="4" width="26" height="32" rx="4"/>
      <rect class="ill-teal-dark" x="10" y="8" width="3" height="24" rx="1.5"/>
      <rect class="ill-teal-dark" x="21" y="8" width="3" height="24" rx="1.5"/>
      <circle class="ill-ink" cx="7" cy="42" r="3.5"/><circle class="ill-ink" cx="27" cy="42" r="3.5"/>
    </g>
    <!-- legs -->
    <path class="ill-ink" d="M-7 -44 L-15 -2 H-7 L1 -40 Z"/>
    <path class="ill-ink" d="M1 -44 L12 -3 H20 L9 -46 Z"/>
    <path class="ill-ink" d="M-17 -3 H-4 V1 H-19 Z"/>
    <path class="ill-ink" d="M11 -4 H24 V0 H10 Z"/>
    <!-- kurta -->
    <path class="ill-white ill-stroke" d="M-13 -42 Q-15 -76 -5 -86 H7 Q17 -76 15 -42 Z"/>
    <path class="ill-teal" d="M-6 -86 L13 -46 L7 -44 L-9 -80 Z" opacity=".85"/>
    <!-- arm to the bag handle -->
    <path class="ill-arm" d="M-6 -78 Q-18 -70 -23 -61"/>
    <!-- cabin bag on shoulder -->
    <path class="ill-strap" d="M4 -84 Q12 -70 14 -60"/>
    <rect class="ill-ink" x="10" y="-62" width="16" height="18" rx="4"/>
    <!-- head -->
    <rect class="ill-skin" x="-2.5" y="-93" width="5" height="8" rx="2"/>
    <circle class="ill-skin" cx="1" cy="-101" r="9.5"/>
    <path class="ill-ink" d="M-9 -100 Q-10 -113 2 -112 Q11 -112 11 -103 Q5 -107 -2 -105 Q-4 -100 -9 -96 Z"/>
    <circle class="ill-ink" cx="-10" cy="-103" r="5"/>
  </g>`;
}

// ---- A1 · Welcome: rider with bags at the T2 exit ----

export function welcome(label) {
  const windows = Array.from({ length: 4 }, (_, i) => `<rect class="ill-glass" x="${128 + i * 30}" y="150" width="20" height="34" rx="3" opacity=".75"/>`).join('');
  return svg(
    '0 0 362 340',
    `<rect class="ill-bg" width="362" height="340"/>
    <circle class="ill-sun" cx="300" cy="62" r="30"/>
    <path class="ill-dash" d="M20 112 C76 92 128 78 184 70"/>
    <g class="ill-fly">${plane(214, 66)}</g>
    <path class="ill-teal-dark" d="M10 132 Q90 100 170 108 T262 116 V140 H10 Z"/>
    <rect class="ill-teal" x="10" y="136" width="252" height="98"/>
    ${windows}
    <rect class="ill-white" x="160" y="112" width="70" height="28" rx="8"/>
    <text class="ill-sign" x="195" y="132" text-anchor="middle">T2</text>
    <!-- exit doors -->
    <rect class="ill-teal-dark" x="34" y="150" width="76" height="84" rx="4"/>
    <rect class="ill-glass" x="40" y="156" width="31" height="78" rx="2" opacity=".85"/>
    <rect class="ill-glass" x="73" y="156" width="31" height="78" rx="2" opacity=".85"/>
    <rect class="ill-white" x="48" y="138" width="48" height="10" rx="5"/>
    <path class="ill-arrow ill-arrow--teal" d="M64 143 H80 M75 139.5 L80 143 L75 146.5"/>
    <rect class="ill-kerb" x="0" y="232" width="362" height="8"/>
    <rect class="ill-road" x="0" y="240" width="362" height="100"/>
    <path class="ill-lane" d="M0 318 H362"/>
    <path class="ill-dash ill-dash--light" d="M90 284 C150 300 210 300 270 272"/>
    ${auto(214, 252, .9)}
    ${bayPin(306, 200, 'Bay 12')}
    <g class="ill-walk">${rider(132, 300)}</g>`,
    label,
  );
}

// ---- C2 · Baggage belt ----

function suitcase(x, y, w, hgt, tone) {
  return `<g transform="translate(${x} ${y})">
    <rect class="ill-shade" x="3" y="${hgt - 2}" width="${w - 2}" height="5" rx="2.5"/>
    <rect class="${tone}" width="${w}" height="${hgt}" rx="6"/>
    <rect class="ill-white" x="${w / 2 - 7}" y="-7" width="14" height="9" rx="3" opacity=".9"/>
    <rect class="ill-shade" x="${w * 0.3}" y="5" width="3" height="${hgt - 10}" rx="1.5"/>
    <rect class="ill-shade" x="${w * 0.66}" y="5" width="3" height="${hgt - 10}" rx="1.5"/>
  </g>`;
}

export function belt(label, flightNo) {
  const rollers = Array.from({ length: 13 }, (_, i) => `<circle class="ill-kerb" cx="${20 + i * 27}" cy="124" r="3"/>`).join('');
  return svg(
    '0 0 362 150',
    `<rect class="ill-bg" width="362" height="150"/>
    <rect class="ill-teal" x="0" y="0" width="362" height="40"/>
    <rect class="ill-white" x="22" y="9" width="96" height="22" rx="6"/>
    <path class="ill-teal" fill-rule="evenodd" transform="translate(30 12) scale(.12)" d="${PIN_OUTER} ${PIN_KEY}"/>
    <text class="ill-label" x="48" y="24">${esc(flightNo)}</text>
    <rect class="ill-teal-dark" x="250" y="6" width="90" height="28" rx="6"/>
    <rect class="ill-glass" x="258" y="12" width="74" height="16" rx="3" opacity=".5"/>
    <rect class="ill-kerb" x="0" y="104" width="362" height="12"/>
    <rect class="ill-road" x="0" y="116" width="362" height="18"/>
    ${rollers}
    <rect class="ill-ink" x="0" y="134" width="362" height="16"/>
    <g class="ill-belt">
      ${suitcase(30, 66, 46, 38, 'ill-teal')}
      ${suitcase(96, 78, 34, 26, 'ill-ink')}
      ${suitcase(150, 60, 52, 44, 'ill-teal-dark')}
      ${suitcase(222, 74, 40, 30, 'ill-glass')}
      ${suitcase(282, 64, 48, 40, 'ill-teal')}
      ${suitcase(400, 72, 40, 32, 'ill-ink')}
    </g>`,
    label,
  );
}

// ---- C5 · "Santosh sent a photo": his auto at the bay ----

export function autoAtBay(label, plate, bay) {
  return svg(
    '0 0 120 90',
    `<rect class="ill-road" width="120" height="90"/>
    <rect class="ill-kerb" x="0" y="66" width="120" height="4"/>
    <rect class="ill-teal" x="70" y="8" width="42" height="16" rx="4"/>
    <text class="ill-label ill-label--on-teal ill-label--xs" x="91" y="19" text-anchor="middle">${esc(bay)}</text>
    ${auto(8, 26, .62, plate)}`,
    label,
  );
}

// ---- C7 · Map: the auto on the way home ----

export const TRIP_ROUTE = 'M70 356 V272 H250 V118';

export function tripMap(label, homeText) {
  return svg(
    '0 0 402 410',
    `<rect class="map-ill__ground" width="402" height="410"/>
    <rect class="map-ill__block" x="-10" y="0" width="68" height="80"/>
    <rect class="map-ill__block" x="82" y="0" width="156" height="80"/>
    <rect class="map-ill__block" x="262" y="0" width="150" height="80"/>
    <rect class="map-ill__block" x="-10" y="96" width="68" height="166"/>
    <rect class="map-ill__block" x="82" y="96" width="156" height="166"/>
    <rect class="map-ill__block" x="262" y="96" width="150" height="166"/>
    <rect class="map-ill__park" x="280" y="180" width="110" height="64" rx="10"/>
    <rect class="map-ill__block" x="-10" y="286" width="68" height="130"/>
    <rect class="map-ill__block" x="82" y="286" width="156" height="130"/>
    <rect class="map-ill__block" x="262" y="286" width="150" height="130"/>
    <path class="trip-map__route-bg" d="${TRIP_ROUTE}"/>
    <path class="trip-map__route" d="${TRIP_ROUTE}"/>
    <g transform="translate(250 118)">
      <rect class="map-ill__tag-bg" x="-40" y="-36" width="80" height="34" rx="17"/>
      <path class="trip-map__home" transform="translate(-28 -27) scale(.66)" d="M3 11L12 4L21 11V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V11Z"/>
      <text class="map-ill__tag-text trip-map__home-text" x="-8" y="-14">${esc(homeText)}</text>
    </g>
    <g class="trip-map__me">
      <circle r="18" class="trip-map__me-ring"/>
      <circle r="14" class="trip-map__me-fill"/>
      <g transform="translate(-8 -8) scale(.66)">
        <path class="trip-map__me-icon" d="M4 16V9C4 8.2 4.3 7.4 4.9 6.9C5.4 6.3 6.2 6 7 6H14L19 11V16M3 16H21M14 6V11H19"/>
        <circle class="trip-map__me-icon" cx="7" cy="17.5" r="2"/>
        <circle class="trip-map__me-icon" cx="17" cy="17.5" r="2"/>
      </g>
      <animateMotion dur="6.2s" fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".3 0 .4 1" path="${TRIP_ROUTE}"/>
    </g>`,
    label,
    'trip-map',
  );
}

// ---- W1 · QR code on the exit poster (a drawn pattern, not a scannable code) ----

export function qrCode(label) {
  const n = 25;
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" class="qr-ink"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" class="qr-paper"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" class="qr-ink"/>`;
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  let seed = 864;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  let cells = '';
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (!inFinder(x, y) && rnd() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  return `<svg class="qr" viewBox="-2 -2 ${n + 4} ${n + 4}" role="img" aria-label="${esc(label)}" shape-rendering="crispEdges">
    <rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" class="qr-paper"/>
    <g class="qr-ink">${cells}</g>
    ${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}
    <rect x="9.5" y="9.5" width="6" height="6" rx="1.5" class="qr-paper"/>
    <path class="qr-pin" fill-rule="evenodd" transform="translate(10.6 10.3) scale(.038)" d="${PIN_OUTER} ${PIN_KEY}"/>
  </svg>`;
}

// ---- A7 · Map: pin on the chosen area ----

export function areaMap(label, pinText) {
  return svg(
    '0 0 362 150',
    `<rect class="map-ill__ground" width="362" height="150"/>
    <rect class="map-ill__block" x="-10" y="-10" width="120" height="66" rx="6"/>
    <rect class="map-ill__block" x="124" y="-10" width="96" height="66" rx="6"/>
    <rect class="map-ill__block" x="234" y="-10" width="140" height="66" rx="6"/>
    <rect class="map-ill__block" x="-10" y="70" width="80" height="90" rx="6"/>
    <rect class="map-ill__block" x="84" y="70" width="136" height="90" rx="6"/>
    <rect class="map-ill__block" x="234" y="70" width="140" height="90" rx="6"/>
    <rect class="map-ill__park" x="250" y="84" width="54" height="38" rx="8"/>
    <path class="map-ill__road" d="M-10 63 H372"/>
    <path class="map-ill__road" d="M227 -10 V160"/>
    <path class="map-ill__metro" d="M-10 140 C80 120 150 120 372 30"/>
    <g class="map-ill__pin">
      <ellipse class="ill-shade" cx="181" cy="78" rx="10" ry="3"/>
      <path class="map-ill__pin-body" d="M181 78 C181 78 168 64 168 55 A13 13 0 1 1 194 55 C194 64 181 78 181 78 Z"/>
      <circle class="map-ill__pin-dot" cx="181" cy="55" r="5"/>
      <g class="map-ill__tag">
        <rect class="map-ill__tag-bg" x="${181 - (pinText.length * 3.4 + 14)}" y="16" width="${pinText.length * 6.8 + 28}" height="22" rx="11"/>
        <text class="map-ill__tag-text" x="181" y="31" text-anchor="middle">${esc(pinText)}</text>
      </g>
    </g>`,
    label,
    'map-ill',
  );
}
