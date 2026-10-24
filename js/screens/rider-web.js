// Rider · 5 No app: QR code or counter at the exit (web + WhatsApp): W1–W4.
// The no-app lane renders inside the phone frame with a mock browser bar
// (W2, W3) and a mock WhatsApp chat (W4).

import {
  h, ic, screen, button, textField, radioGroup, stepper, choiceChips,
} from '../components.js';
import * as ill from '../illustrations.js';
import { appIconSvg, lockup } from '../brand.js';
import { toast } from '../overlays.js';
import { go, back } from '../router.js';
import { store } from '../store.js';
import { t, contentLang } from '../i18n.js';
import { after, timerBag } from '../clock.js';
import * as fmt from '../format.js';
import { RIDES, DRIVERS, TRIP, BAY, LANGUAGES } from '../data.js';
import { R, needOnline, vibrate } from './rider-onboarding.js';

const AUTO = RIDES[0];
const amount = () => fmt.rupees(AUTO.fare);

/** What the rider typed on the web page (kept for the session, like a form). */
const web = { going: 'Chakala, Andheri East', phone: '9876543210', big: 2, small: 1, pay: 'upi' };

/** DS "Browser bar": the web page from the QR poster. */
function browserBar(url) {
  return h('div', { class: 'browser-bar', role: 'presentation' }, h('span', { class: 'browser-bar__url' }, ic('lock', { size: 14, stroke: 2.5 }), url));
}

// ---------------------------------------------------------------- W1 · QR poster at the exit (physical)

export function W1() {
  const timers = timerBag();
  const scanLine = h('span', { class: 'poster__scan', 'aria-hidden': 'true' });
  const open = () => {
    // "Scanning": the camera frames the code, then the web page opens
    poster.classList.add('is-scanning');
    toast(t('w1.scanning'), { tone: 'info' });
    vibrate(15);
    timers.add(after(900, () => go(R('W2'))));
  };
  const poster = h(
    'button',
    { type: 'button', class: 'poster', 'aria-label': `${t('w1.title')}. ${t('w1.scan')}`, onClick: open },
    lockup({ tone: 'reversed', size: 's' }),
    h('span', { class: 'poster__title' }, t('w1.title')),
    h('span', { class: 'poster__qr' }, h('span', { html: ill.qrCode(t('w1.qr')) }), scanLine),
    h('span', { class: 'poster__scan-label' }, ic('camera', { size: 18 }), t('w1.scan')),
    h('span', { class: 'poster__sub' }, t('w1.sub')),
    h('span', { class: 'poster__langs' }, t('w1.langs')),
  );
  const counter = h(
    'button',
    { type: 'button', class: 'counter-card', onClick: () => go(R('W2')) },
    ic('counter', { size: 24 }),
    h('span', { class: 'list-row__body' }, h('span', { class: 't-headline' }, t('w1.counter')), h('span', { class: 't-subhead t-mute' }, t('w1.counterSub'))),
  );
  const el = h(
    'main',
    { class: 'screen wall', 'aria-label': t('w1.label'), dataset: { code: 'W1' } },
    h('div', { class: 'screen__body wall__body' }, poster, counter),
  );
  return { el, chrome: 'wall', onUnmount: () => timers.clear() };
}

// ---------------------------------------------------------------- W2 · Web: where to

export function W2() {
  const lang = contentLang();
  const langs = choiceChips({
    label: 'Language',
    value: lang,
    options: LANGUAGES.map((l) => ({ value: l.id, label: l.native })),
    onChange: (id) => store.set('settings', { lang: id }), // the page re-renders in that language
  });

  const going = textField({
    label: t('w2.going'),
    value: web.going,
    placeholder: t('w2.goingPh'),
    lead: 'pin',
    autocomplete: 'off',
    onInput: (e) => {
      web.going = e.target.value;
    },
  });

  const note = h('p', { class: 'bag-note', 'aria-live': 'polite' });
  const atMax = (v) => {
    note.replaceChildren(...(v >= AUTO.fits.big ? [ic('alert', { size: 16 }), h('span', {}, t('w2.max'))] : []));
  };

  let digits = web.phone;
  const phone = textField({
    label: t('w2.phone'),
    value: fmt.phone(digits),
    prefix: '+91',
    type: 'tel',
    inputmode: 'numeric',
    autocomplete: 'tel-national',
    onInput: (e) => {
      digits = fmt.digitsOnly(e.target.value).slice(0, 10);
      e.target.value = fmt.phone(digits);
      web.phone = digits;
    },
    onBlur: (_, f) => {
      if (digits.length && digits.length < 10) f.setError(t('w2.phoneErr'));
    },
  });

  const pay = button({
    label: t('w2.cta', { amount: amount() }),
    onClick: () => {
      if (!web.going.trim()) {
        going.setError(t('w2.goingErr'));
        going.input.focus({ preventScroll: true });
        return;
      }
      if (digits.length < 10) {
        phone.setError(t('w2.phoneErr'));
        phone.input.focus({ preventScroll: true });
        return;
      }
      go(R('W3'));
    },
  });
  pay.classList.add('price-bar__cta');

  const { el } = screen({
    code: 'W2',
    label: t('w2.title'),
    className: 'web w2',
    topbar: browserBar(t('w2.url')),
    body: [
      h('h1', { class: 't-title1 screen__heading web__title', tabindex: '-1' }, t('w2.title')),
      langs,
      going.el,
      h('div', { class: 'steppers' },
        stepper({ label: t('b3.big'), value: web.big, min: 0, max: AUTO.fits.big, onChange: (v) => { web.big = v; atMax(v); } }),
        stepper({ label: t('b3.small'), value: web.small, min: 0, max: 2, onChange: (v) => { web.small = v; } })),
      note,
      phone.el,
    ],
    footer: [h('div', { class: 'price-bar' }, h('div', { class: 'price-bar__text' }, h('span', { class: 'price-bar__amount' }, amount()), h('span', { class: 't-footnote t-mute' }, t('w2.priceSub'))), pay)],
  });
  el.classList.add('b3');
  return { el };
}

// ---------------------------------------------------------------- W3 · Web: pay

export function W3() {
  const timers = timerBag();
  const methods = [
    { id: 'upi', icon: 'upi', title: t('w3.upi'), sub: t('w3.upiSub') },
    { id: 'card', icon: 'wallet', title: t('w3.card'), sub: t('w3.cardSub') },
    { id: 'cash', icon: 'counter', title: t('w3.cash'), sub: t('w3.cashSub') },
  ];
  const cards = methods.map((m) => h(
    'button',
    { type: 'button', class: 'option-card pay-option', 'aria-checked': String(m.id === web.pay), dataset: { value: m.id } },
    ic(m.icon, { size: 24 }),
    h('span', { class: 'option-card__body' }, h('span', { class: 't-headline' }, m.title), h('span', { class: 't-footnote option-card__sub' }, m.sub)),
    h('span', { class: 'pay-option__tick', 'aria-hidden': 'true' }, ic('check', { size: 16, stroke: 3 })),
  ));
  const group = h('div', { class: 'option-list' }, cards);
  radioGroup(group, cards, (id) => {
    web.pay = id;
  });

  const pay = button({
    label: t('w3.cta', { amount: amount() }),
    onClick: () => {
      if (!needOnline()) return;
      pay.setLoading(t('w3.paying'));
      timers.add(after(1400, () => {
        // Paid: a ride from the queue is matched and the details go to WhatsApp
        store.set('booking', {
          state: 'matched', ride: 'auto', dest: 'home', big: web.big, small: web.small, people: 1,
          driver: 'santosh', skipsLeft: 1, flight: null, paidAt: Date.now(), sharedWith: [], waitStartedAt: 0,
        });
        if (web.pay === 'cash') toast(t('w3.cashDone'));
        vibrate(25);
        go(R('W4'), { replace: true, fade: true });
      }));
    },
  });

  const { el } = screen({
    code: 'W3',
    label: t('w3.title', { amount: amount() }),
    className: 'web w3',
    topbar: browserBar(t('w3.url')),
    body: [
      h('h1', { class: 't-title1 screen__heading web__title', tabindex: '-1' }, t('w3.title', { amount: amount() })),
      h('p', { class: 't-callout t-mute w3-sub' }, t('w3.sub')),
      group,
    ],
    footer: [pay],
  });
  return { el, onUnmount: () => timers.clear() };
}

// ---------------------------------------------------------------- W4 · WhatsApp: your auto

export function W4() {
  const timers = timerBag();
  const d = DRIVERS.santosh;
  const vals = { vehicle: 'auto', driver: d.name, plate: d.plate, rating: d.rating, time: d.registerSince, bay: BAY.id, level: BAY.level, code: TRIP.code, amount: amount() };

  const typing = h('div', { class: 'wa-typing', 'aria-label': t('w4.typing') }, h('span'), h('span'), h('span'));
  const bubble = h(
    'article',
    { class: 'wa-bubble', 'aria-live': 'polite' },
    h('p', { class: 'wa-bubble__title' }, t('w4.ready', vals)),
    h('p', {}, t('w4.driver', vals), h('br'), t('w4.register', vals)),
    h('p', {}, t('w4.go', vals), h('br'), t('w4.route')),
    h('p', { class: 'wa-bubble__code' }, t('w4.code', vals)),
    h('p', {}, t('w4.paid', vals)),
    h('span', { class: 'wa-bubble__time' }, t('w4.time')),
  );
  bubble.hidden = true;

  const live = (patch) => store.set('booking', { state: 'onTrip', ...patch });
  const replies = h(
    'div',
    { class: 'wa-replies' },
    h('button', { type: 'button', class: 'wa-reply', onClick: () => { live(); go(R('C7')); } }, ic('nav', { size: 18 }), t('w4.track')),
    h('button', { type: 'button', class: 'wa-reply', onClick: () => { live(); go(R('X11')); } }, ic('alert', { size: 18 }), t('w4.extra')),
    h('button', { type: 'button', class: 'wa-reply wa-reply--sos', onClick: () => { live(); go(R('X12')); } }, ic('sos', { size: 18 }), t('w4.sos')),
  );
  replies.hidden = true;

  const header = h(
    'div',
    { class: 'wa-header' },
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': t('w4.back'), onClick: () => back(R('W1')) }, ic('back')),
    h('span', { class: 'wa-header__avatar', html: appIconSvg() }),
    h('span', { class: 'list-row__body' },
      h('span', { class: 't-headline' }, t('w4.name'), ic('check', { size: 14, stroke: 3 })),
      h('span', { class: 't-footnote t-mute' }, t('w4.account'))),
  );

  const el = h(
    'main',
    { class: 'screen wa', 'aria-label': `${t('w4.name')} · WhatsApp`, dataset: { code: 'W4' } },
    header,
    h('div', { class: 'offline-slot', 'aria-live': 'polite' }),
    h('div', { class: 'screen__body wa__body' }, typing, bubble, replies),
  );

  return {
    el,
    onMount() {
      // The business account "types", then the message and its buttons arrive
      timers.add(after(1100, () => {
        typing.remove();
        bubble.hidden = false;
        vibrate([20, 40, 20]);
      }));
      timers.add(after(1500, () => {
        replies.hidden = false;
      }));
    },
    onUnmount: () => timers.clear(),
  };
}
