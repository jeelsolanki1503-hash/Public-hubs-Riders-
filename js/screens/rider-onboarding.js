// Rider · 1 Sign up: splash, A1–A7 (A6 is the phone's own pop-up over A5).
// Each factory is named after its Figma frame code.

import {
  h, ic, screen, pageHead, topBar, button, textField, codeBoxes, keypad,
  radioGroup, langTile, illustration, iconTile, spinner,
} from '../components.js';
import * as ill from '../illustrations.js';
import { BRAND, PIN_OUTER, PIN_KEY } from '../brand.js';
import { toast, osAlert } from '../overlays.js';
import { go, back } from '../router.js';
import { store, isOffline, hasRide } from '../store.js';
import { t } from '../i18n.js';
import { countdown, after, timerBag } from '../clock.js';
import * as fmt from '../format.js';
import { LANGUAGES, PLACES, SMS_CODE, TIMING, RIDER } from '../data.js';

export const R = (code) => `/rider/${code}`;
const rider = () => store.rider();

export function vibrate(ms) {
  // Browsers only allow vibration after the person has tapped the page
  const tapped = !navigator.userActivation || navigator.userActivation.hasBeenActive;
  if (navigator.vibrate && tapped) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* not allowed before a user gesture — ignore */
    }
  }
}

export function needOnline() {
  if (!isOffline()) return true;
  toast(t('common.offlineAction'), { tone: 'error' });
  return false;
}

/** Tap target that leads to a screen outside this flow: say so, never dead. */
export function soon(what) {
  toast(t('common.soon', { what }), { tone: 'info' });
}

// ---------------------------------------------------------------- Splash (2 s)

export function Splash() {
  const timers = timerBag();
  const pin = `<svg class="splash__pin" viewBox="0 0 100 130" aria-hidden="true" focusable="false">
    <path class="splash__pin-body" d="${PIN_OUTER}"/>
    <path class="splash__pin-key" d="${PIN_KEY}"/>
  </svg>`;
  const el = h(
    'main',
    { class: 'screen splash', 'aria-label': BRAND, dataset: { code: 'splash' } },
    h('span', { class: 'splash__glow', 'aria-hidden': 'true' }),
    h(
      'div',
      { class: 'splash__stage', role: 'img', 'aria-label': BRAND },
      h('span', { class: 'splash__ripple', 'aria-hidden': 'true' }),
      h('span', { class: 'splash__ripple splash__ripple--2', 'aria-hidden': 'true' }),
      h('span', { class: 'splash__mark', html: pin }, h('span', { class: 'splash__shadow', 'aria-hidden': 'true' })),
      h('span', { class: 'splash__word', 'aria-hidden': 'true' }, h('span', {}, BRAND)),
    ),
    h('span', { class: 'splash__bar', 'aria-hidden': 'true' }, h('span')),
  );
  // The splash always opens the welcome screen (A1)
  const next = () => R('A1');
  return {
    el,
    chrome: 'brand',
    onMount: () => timers.add(after(2000, () => go(next(), { replace: true, fade: true }))),
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- A1

export function A1() {
  const { el } = screen({
    code: 'A1',
    label: t('a1.title'),
    className: 'a1',
    topbar: topBar({ brandMark: true }),
    body: [
      illustration(ill.welcome(t('a1.illus')), { className: 'a1-hero' }),
      h('h1', { class: 't-large screen__heading a1-title', tabindex: '-1' }, t('a1.title')),
      h('p', { class: 't-callout t-mute' }, t('a1.body')),
    ],
    footer: [
      button({ label: t('a1.cta'), onClick: () => go(R('A2')) }),
      button({ label: t('a1.have'), variant: 'text', onClick: () => go(R('A3')) }),
    ],
  });
  return { el };
}

// ---------------------------------------------------------------- A2

let focusLangAfterRefresh = false;

export function A2() {
  const picked = store.settings().lang;
  const tiles = LANGUAGES.map((lang) => langTile({ lang, checked: lang.id === picked }));
  const list = h('div', { class: 'lang-list', 'aria-label': t('a2.title') }, tiles);
  radioGroup(list, tiles, (id) => {
    if (id === store.settings().lang) return;
    focusLangAfterRefresh = true;
    store.set('settings', { lang: id }); // app.js re-renders the screen in the new language
  });

  const { el } = screen({
    code: 'A2',
    label: t('a2.title'),
    topbar: topBar({ onBack: () => back(R('A1')), title: t('a2.title') }),
    body: [h('p', { class: 't-callout t-mute a2-sub' }, t('a2.sub')), list],
    footer: [button({ label: t('a2.cta'), onClick: () => go(R('A3')) })],
  });

  return {
    el,
    onMount() {
      if (focusLangAfterRefresh) {
        focusLangAfterRefresh = false;
        const on = tiles.find((x) => x.getAttribute('aria-checked') === 'true');
        if (on) on.focus({ preventScroll: true });
      }
    },
  };
}

// ---------------------------------------------------------------- A3

export function A3() {
  let digits = fmt.digitsOnly(rider().phone);

  const field = textField({
    label: t('a3.label'),
    value: fmt.phone(digits),
    placeholder: t('a3.placeholder'),
    help: t('a3.help'),
    prefix: '+91',
    type: 'tel',
    autocomplete: 'tel-national',
    readOnlyKeyboard: true, // the mock keypad below is the keyboard
    onInput: (e) => setDigits(fmt.digitsOnly(e.target.value)),
    onBlur: (_, f) => {
      // Check when they leave the field, not on every key press
      if (digits.length && digits.length < 10) f.setError(t('a3.errLen'));
    },
  });

  function setDigits(d) {
    digits = d.slice(0, 10);
    field.input.value = fmt.phone(digits);
    store.set('rider', { phone: digits });
  }

  const cta = button({ label: t('a3.cta'), onClick: submit });

  function submit() {
    if (digits.length < 10) return field.setError(t('a3.errLen'));
    if (!/^[6-9]/.test(digits)) return field.setError(t('a3.errStart'));
    if (!needOnline()) return;
    cta.setLoading(t('a3.sending'));
    after(600, () => {
      store.set('rider', { phone: digits, codeTries: 0 });
      go(R('A4'));
    });
  }

  const pad = keypad({
    onDigit: (d) => {
      if (field.el.classList.contains('field--error')) field.clear();
      setDigits(digits + d);
      field.input.focus({ preventScroll: true });
    },
    onDelete: () => {
      setDigits(digits.slice(0, -1));
      field.input.focus({ preventScroll: true });
    },
  });

  field.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });

  const { el } = screen({
    code: 'A3',
    label: t('a3.title'),
    topbar: topBar({ onBack: () => back(R('A2')) }),
    body: [
      pageHead(t('a3.title'), t('a3.sub')),
      field.el,
      h('p', { class: 't-footnote t-faint a3-terms' }, t('a3.terms')),
    ],
    footer: [cta],
    keypad: pad,
  });

  // A hardware keyboard types into the field wherever focus is on the screen
  el.addEventListener('keydown', (e) => {
    if (e.target === field.input || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      setDigits(digits + e.key);
      field.input.focus({ preventScroll: true });
    }
  });

  return {
    el,
    onMount: () => field.input.focus({ preventScroll: true }),
  };
}

// ---------------------------------------------------------------- A4

export function A4({ code } = {}) {
  const timers = timerBag();
  const wrongDemo = code === 'X14'; // X14 · Wrong code: the error state of A4
  const phoneShown = fmt.phoneWithCode(rider().phone || RIDER.phone);
  let userTyped = false;

  const status = h('p', { class: 'a4-line t-subhead t-mute', 'aria-live': 'polite' });
  const resendLine = h('p', { class: 'a4-resend t-footnote' });

  const boxes = codeBoxes({
    length: 6,
    label: t('a4.codeLabel'),
    onComplete: (code) => verify(code, true),
  });

  boxes.el.addEventListener('keydown', () => {
    userTyped = true;
  });

  function setStatus(iconName, text, tone = '') {
    status.className = `a4-line t-subhead ${tone ? `a4-line--${tone}` : 't-mute'}`;
    status.replaceChildren(...(iconName ? [ic(iconName, { size: 18 })] : []), h('span', {}, text));
  }

  function startAutofill(delay = TIMING.smsAutofillMs) {
    setStatus('msg', t('a4.reading'));
    timers.add(
      after(delay, () => {
        if (userTyped || boxes.value()) return;
        [...SMS_CODE].forEach((d, i) =>
          timers.add(after(i * 110, () => {
            if (!userTyped) boxes.type(d);
          })),
        );
      }),
    );
  }

  const cta = button({ label: t('a4.cta'), onClick: () => verify(boxes.value(), false) });

  function verify(code, auto) {
    if (code.length < 6) {
      if (!auto) {
        boxes.setState('error');
        setStatus('alert', t('a4.errLen'), 'error');
        boxes.focus();
      }
      return;
    }
    if (rider().codeTries >= 3) {
      setStatus('alert', t('a4.tooMany'), 'error');
      return;
    }
    if (code === SMS_CODE) {
      boxes.setState('success');
      setStatus('check', t('a4.verified'), 'success');
      store.set('rider', { codeTries: 0 });
      vibrate(20);
      cta.setLoading(t('a4.verifying'));
      timers.add(after(700, () => go(R('A5'))));
      return;
    }
    const tries = rider().codeTries + 1;
    store.set('rider', { codeTries: tries });
    const left = 3 - tries;
    boxes.setState('error');
    setStatus('alert', left <= 0 ? t('a4.tooMany') : left === 1 ? t('a4.wrong1') : t('a4.wrong', { n: left }), 'error');
    vibrate([30, 40, 30]);
    boxes.focus();
  }

  function startResend() {
    timers.add(
      countdown(
        TIMING.resendSec,
        (s) => {
          resendLine.className = 'a4-resend t-footnote t-faint';
          resendLine.textContent = t('a4.resendIn', { t: fmt.mmss(s) });
        },
        () => {
          resendLine.className = 'a4-resend t-footnote';
          resendLine.replaceChildren(h('button', { type: 'button', class: 'text-link', onClick: resend }, t('a4.resend')));
        },
      ),
    );
  }

  function resend() {
    if (!needOnline()) return;
    toast(t('a4.resent'));
    userTyped = false;
    store.set('rider', { codeTries: 0 });
    boxes.setState(null);
    boxes.clear();
    startResend();
    startAutofill();
  }

  const pad = keypad({
    onDigit: (d) => {
      userTyped = true;
      boxes.type(d);
    },
    onDelete: () => {
      userTyped = true;
      boxes.backspace();
    },
  });

  const { el } = screen({
    code: 'A4',
    label: t('a4.title'),
    topbar: topBar({ onBack: () => back(R('A3')) }),
    body: [
      pageHead(t('a4.title'), t('a4.sentTo', { phone: phoneShown })),
      boxes.el,
      resendLine,
      status,
      wrongDemo ? null : h('button', { type: 'button', class: 'quiet-link a4-help', onClick: () => go(R('X14'), { replace: true }) }, t('a4.notWorking')),
    ],
    footer: [cta],
    keypad: pad,
  });

  el.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('code-box') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^\d$/.test(e.key)) {
      userTyped = true;
      boxes.type(e.key);
    } else if (e.key === 'Backspace') {
      userTyped = true;
      boxes.backspace();
    }
  });

  return {
    el,
    onMount() {
      if (wrongDemo) {
        // A wrong code was typed: show the error, offer "Resend code" right away
        userTyped = true;
        boxes.fill('3814');
        boxes.setState('error');
        setStatus('alert', t('x14.wrong'), 'error');
        store.set('rider', { codeTries: 1 });
        resendLine.className = 'a4-resend t-footnote';
        resendLine.replaceChildren(h('button', { type: 'button', class: 'text-link', onClick: resend }, t('a4.resend')));
        return;
      }
      boxes.focus();
      startAutofill();
      startResend();
    },
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- A5 + A6

function askLocation() {
  osAlert({
    title: t('os.locTitle'),
    message: t('os.locMsg'),
    buttons: [
      { label: t('os.whileUsing'), bold: true, onClick: () => grant('while-using') },
      { label: t('os.once'), onClick: () => grant('once') },
      { label: t('os.deny'), onClick: () => grant('denied') },
    ],
  });
}

function grant(kind) {
  store.set('rider', { location: kind });
  // X15 · Location is off: explain, then carry on to A7 either way
  go(R(kind === 'denied' ? 'X15' : 'A7'));
}

export function A5({ code } = {}) {
  const first = textField({
    label: t('a5.first'),
    value: rider().firstName,
    autocomplete: 'given-name',
    autocapitalize: 'words',
    onInput: (e) => store.set('rider', { firstName: e.target.value }),
  });
  const last = textField({
    label: t('a5.last'),
    value: rider().lastName,
    autocomplete: 'family-name',
    autocapitalize: 'words',
    onInput: (e) => store.set('rider', { lastName: e.target.value }),
  });

  function submit() {
    const name = first.input.value.trim();
    if (!name) {
      first.setError(t('a5.errFirst'));
      first.input.focus({ preventScroll: true });
      return;
    }
    store.set('rider', { firstName: name, lastName: last.input.value.trim() });
    first.input.blur();
    last.input.blur();
    askLocation();
  }

  [first, last].forEach((f) =>
    f.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    }),
  );

  const { el } = screen({
    code: 'A5',
    label: t('a5.title'),
    topbar: topBar({ onBack: () => back(R('A4')) }),
    body: [pageHead(t('a5.title'), t('a5.sub')), first.el, last.el],
    footer: [button({ label: t('a5.cta'), onClick: submit })],
  });

  return {
    el,
    onMount() {
      if (code === 'A6') askLocation();
      else if (!first.input.value) first.input.focus({ preventScroll: true });
    },
  };
}

// ---------------------------------------------------------------- A7

function matchPlaces(q) {
  const words = q.toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (!words.length) return [];
  return PLACES.filter((p) => {
    const hay = `${p.label} ${p.line}`.toLowerCase().split(/[\s,]+/);
    return words.every((w) => hay.some((x) => x.startsWith(w)));
  });
}

export function A7() {
  const timers = timerBag();
  let query = 'Chakala, And';
  let picked = rider().home || 'chakala';

  const results = h('div', { class: 'a7-results', 'aria-live': 'polite' });
  const mapBox = h('div', { class: 'a7-map' });

  const search = textField({
    ariaLabel: t('a7.search'),
    value: query,
    placeholder: t('a7.search'),
    lead: 'search',
    clearable: true,
    autocomplete: 'off',
    onInput: (e) => {
      query = e.target.value;
      renderResults();
    },
  });
  search.el.classList.add('field--search');

  const locRow = h(
    'button',
    { type: 'button', class: 'a7-current', onClick: useCurrent },
    ic('nav', { size: 20 }),
    h('span', {}, t('a7.current')),
  );

  function useCurrent() {
    if (rider().location === 'denied') {
      toast(t('a7.locOff'), { tone: 'error' });
      return;
    }
    locRow.replaceChildren(spinner(), h('span', {}, t('a7.locating')));
    locRow.setAttribute('aria-busy', 'true');
    timers.add(after(900, () => {
      locRow.replaceChildren(ic('nav', { size: 20 }), h('span', {}, t('a7.current')));
      locRow.removeAttribute('aria-busy');
      const place = PLACES[0];
      picked = place.id;
      query = place.label;
      search.input.value = query;
      search.input.dispatchEvent(new Event('input'));
      renderMap(true);
      timers.add(after(420, () => go(R(`A7b/${place.id}`))));
    }));
  }

  function placeRow(p) {
    const on = p.id === picked;
    return h(
      'button',
      { type: 'button', class: 'place-row', 'aria-checked': String(on), dataset: { value: p.id } },
      iconTile('pin', { tone: on ? 'brand' : 'neutral' }),
      h('span', { class: 'list-row__body' }, h('span', { class: 'list-row__title' }, p.label), h('span', { class: 'list-row__sub' }, p.line)),
      h('span', { class: 'place-row__tick', 'aria-hidden': 'true' }, ic('check', { size: 20, stroke: 2.5 })),
    );
  }

  function renderResults() {
    const list = matchPlaces(query);
    if (!query.trim()) {
      results.replaceChildren();
      return;
    }
    if (!list.length) {
      results.replaceChildren(
        h('div', { class: 'empty-line' }, h('p', { class: 't-headline' }, t('a7.none', { q: query.trim() })), h('p', { class: 't-subhead t-mute' }, t('a7.noneHint'))),
      );
      return;
    }
    const rows = list.map(placeRow);
    const group = h('div', { class: 'place-list' }, rows);
    radioGroup(group, rows, (id) => {
      picked = id;
      rows.forEach((r) => r.querySelector('.icon-tile').className = `icon-tile icon-tile--${r.dataset.value === id ? 'brand' : 'neutral'}`);
      renderMap(true);
    });
    // A tapped result opens A7b (Confirm your Home) once its pin has dropped
    rows.forEach((r) => r.addEventListener('click', () => timers.add(after(320, () => go(R(`A7b/${r.dataset.value}`))))));
    results.replaceChildren(group);
  }

  function renderMap(animate) {
    const p = PLACES.find((x) => x.id === picked) || PLACES[0];
    mapBox.innerHTML = ill.areaMap(t('a7.map', { place: p.label }), p.label);
    if (animate) {
      mapBox.classList.remove('is-dropping');
      void mapBox.offsetWidth;
      mapBox.classList.add('is-dropping');
    }
  }

  const cta = button({
    label: t('a7.cta'),
    icon: 'home',
    onClick: () => {
      if (!picked) return toast(t('a7.pick'), { tone: 'error' });
      store.set('rider', { home: picked, signedUp: true });
      toast(t('a7.saved'));
      go(R('B1'));
    },
  });

  renderResults();
  renderMap(false);

  const { el } = screen({
    code: 'A7',
    label: t('a7.title'),
    topbar: topBar({
      onBack: () => back(R('A5')),
      title: t('a7.title'),
      action: { label: t('a7.skip'), onClick: () => {
        store.set('rider', { signedUp: true });
        go(R('B1'));
      } },
    }),
    body: [h('p', { class: 't-callout t-mute a7-sub' }, t('a7.sub')), search.el, locRow, results, mapBox],
    footer: [cta],
  });
  return { el, onUnmount: () => timers.clear() };
}
