// Fixride brand marks, copied from the Figma page "Logo · Fixride"
// (Option 1 · The fixed pickup pin). Teal pin = brand teal, wordmark = Inter
// Bold −2%, ink. The keyhole is a true cut-out so the mark works on any colour.

import { h } from './components.js';

export const BRAND = 'Fixride';

// 100 × 130 pin and its keyhole, split so the keyhole can animate on its own
export const PIN_OUTER = 'M50 0C77.6 0 100 22.4 100 50C100 85 50 130 50 130C50 130 0 85 0 50C0 22.4 22.4 0 50 0Z';
export const PIN_KEY = 'M50 32C42.268 32 36 38.268 36 46C36 51.1604 38.7925 55.6677 42.9482 58.0957L40 80H60L57.0508 58.0957C61.2069 55.6678 64 51.1607 64 46C64 38.268 57.732 32 50 32Z';

/** The pin with its keyhole cut out, in currentColor. */
export function pinSvg(className = 'fx-pin') {
  return `<svg class="${className}" viewBox="0 0 100 130" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="${PIN_OUTER} ${PIN_KEY}"/></svg>`;
}

/** App icon: teal squircle, white pin (from the "Fixride app icon" frame). */
export function appIconSvg(className = 'fx-appicon') {
  return `<svg class="${className}" viewBox="0 0 240 240" aria-hidden="true" focusable="false"><rect width="240" height="240" rx="54" fill="#0D5C63"/><path fill="#FFFFFF" fill-rule="evenodd" d="M120 50.4C149.553 50.4 173.538 74.385 173.539 103.938C173.539 141.415 120 189.6 120 189.6C119.912 189.522 66.4615 141.384 66.4615 103.938C66.4617 74.3851 90.4467 50.4002 120 50.4ZM120 84.6646C111.721 84.6648 105.009 91.3768 105.009 99.6559C105.01 105.181 107.999 110.007 112.449 112.607L109.293 136.061H130.708L127.549 112.607C132 110.007 134.991 105.182 134.991 99.6559C134.991 91.3767 128.279 84.6646 120 84.6646Z"/></svg>`;
}

/**
 * Horizontal lockup: pin + "Fixride", with an optional product tag ("Driver"),
 * like "Uber Driver". tone: 'brand' (teal pin, ink word) | 'reversed' (all white).
 */
export function lockup({ tag, tone = 'brand', size = 'm' } = {}) {
  return h(
    'span',
    { class: `fx-lockup fx-lockup--${tone} fx-lockup--${size}`, role: 'img', 'aria-label': tag ? `${BRAND} ${tag}` : BRAND },
    h('span', { class: 'fx-lockup__pin', html: pinSvg() }),
    h('span', { class: 'fx-lockup__word', 'aria-hidden': 'true' }, BRAND),
    tag ? h('span', { class: 'fx-lockup__tag', 'aria-hidden': 'true' }, tag) : null,
  );
}
