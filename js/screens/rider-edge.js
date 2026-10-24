// Rider · 3 Edge cases (what can go wrong): the X0 index and the edge cases
// that are screens of their own — X5, X7, X15, X17. The others are states
// or overlays of flow 1 / flow 2 screens (see app.js routes).

import {
  h, ic, screen, topBar, button, iconTile, listRow, rowCard, stepper, stateIcon, progressRing,
} from '../components.js';
import { toast } from '../overlays.js';
import { go, back } from '../router.js';
import { store } from '../store.js';
import { t } from '../i18n.js';
import { after } from '../clock.js';
import * as fmt from '../format.js';
import { BAY, NO_SHOW, DRIVERS } from '../data.js';
import { R, soon, needOnline, vibrate } from './rider-onboarding.js';
import { ride, home, vehicle, fareOf } from './rider-booking.js';

const booking = () => store.booking();

// ---------------------------------------------------------------- X0 · Edge cases index

/** Where each case opens, and the ride state it needs (deep links stay live). */
const CASES = [
  { id: 'X1', to: 'X1', state: 'scheduled' },
  { id: 'X2', to: 'X2', state: 'landed' },
  { id: 'X3', to: 'X3', state: 'matched', fresh: true },
  { id: 'X4', to: 'X4', state: 'matched', fresh: true },
  { id: 'X5', to: 'X5', state: 'landed' },
  { id: 'X6', to: 'X6', state: 'walking' },
  { id: 'X7', to: 'X7', state: 'noShow' },
  { id: 'X8', to: 'X8', state: 'scheduled' },
  { id: 'X9', to: 'X9', state: 'walking' },
  { id: 'X10', to: 'X10', state: 'atBay' },
  { id: 'X11', to: 'X11', state: 'onTrip' },
  { id: 'X12', to: 'X12', state: 'onTrip' },
  { id: 'X13', to: 'X13', state: 'paying' },
  { id: 'X14', to: 'X14' },
  { id: 'X15', to: 'X15' },
  { id: 'X16', to: 'X16', state: 'draft', dest: 'sahar' },
  { id: 'X17', to: 'X17', state: 'draft' },
  { id: 'X18', to: 'X18', state: 'scheduled' },
  { id: 'X19', to: 'X19', state: 'draft' }, // flow 6 · bags don't fit an auto
  { id: 'X20', to: 'X20', state: 'landed', pool: 'flight' }, // flow 6 · pool didn't fill
];

export function X0() {
  const open = (c) => {
    if (c.later) return soon(t('x0.laterWhat'));
    const patch = { flight: booking().flight || 'AI 864', dest: c.dest || 'home', ride: 'auto', pool: c.pool || null, lockedFare: 0 };
    if (c.id === 'X19') patch.big = 2; // B3 then adds the third big bag
    if (c.id === 'X20') Object.assign(patch, { driver: 'santosh', skipsLeft: 1 });
    if (c.state) patch.state = c.state;
    if (c.fresh) Object.assign(patch, { driver: 'santosh', skipsLeft: 1 });
    if (c.id === 'X6' || c.id === 'X9') patch.waitStartedAt = c.id === 'X9' ? Date.now() : 0;
    store.set('booking', patch);
    store.set('rider', { signedUp: true });
    go(R(c.to));
  };
  const rows = CASES.map((c) =>
    h('button', { type: 'button', class: 'edge-row', onClick: () => open(c) },
      h('span', { class: 'edge-row__title' }, t(`x0.${c.id.toLowerCase()}`)),
      ic('chev', { size: 20 })),
  );
  const { el } = screen({
    code: 'X0',
    label: t('x0.title'),
    topbar: topBar({ title: t('x0.title') }),
    body: [h('div', { class: 'divided edge-list' }, rows)],
  });
  return { el };
}

// ---------------------------------------------------------------- X5 · No auto free right now

export function X5() {
  const r = ride();
  const amount = fmt.rupees(fareOf(r));
  const vals = { vehicle: vehicle(r), amount };
  const cancel = h('button', {
    type: 'button',
    class: 'quiet-link quiet-link--center',
    onClick: () => {
      store.newBooking();
      toast(t('x5.cancelled'));
      go(R('B1'), { replace: true, fade: true });
    },
  }, t('x5.cancel', vals));

  const { el } = screen({
    code: 'X5',
    label: t('x5.head', vals),
    className: 'x5',
    topbar: topBar({ title: t('x5.title', vals) }),
    body: [
      h('div', { class: 'center-stack center-stack--top' },
        h('div', { class: 'pay-ring-wrap' }, progressRing(96), h('span', { class: 'pay-ring__icon' }, ic(r.icon, { size: 28 }))),
        h('h2', { class: 't-title1' }, t('x5.head', vals)),
        h('p', { class: 't-callout t-mute' }, t('x5.body', vals))),
      h('div', { class: 'pickup-card' },
        iconTile('shield', { tone: 'brand' }),
        h('span', { class: 'list-row__body' },
          h('span', { class: 't-headline' }, t('x5.wait')),
          h('span', { class: 't-subhead t-mute' }, t('x5.waitSub')))),
    ],
    footer: [
      button({ label: t('x5.keep'), onClick: () => go(R('C4'), { replace: true, fade: true }) }),
      cancel,
    ],
  });
  return { el, onMount: () => store.set('booking', { state: 'landed' }) };
}

// ---------------------------------------------------------------- X7 · Ride ended (you didn't come)

export function X7() {
  const r = ride();
  const fare = fareOf(r);
  const driver = DRIVERS[booking().driver] || DRIVERS.santosh;
  const lateFee = Math.min(100, Math.round(fare * 0.1));
  const waitPay = NO_SHOW.paidMin; // ₹1 a minute after the 5 free minutes
  const line = (label, value, strong) =>
    h('div', { class: `fare-row${strong ? ' fare-row--total' : ''}` }, h('span', {}, label), h('span', { class: 'fare-row__v' }, value));

  const { el } = screen({
    code: 'X7',
    label: t('x7.title', { bay: r.bay }),
    className: 'x7',
    topbar: topBar({ title: t('x7.top') }),
    body: [
      stateIcon({ iconName: 'clock', tone: 'soft-l' }),
      h('h2', { class: 't-large x7-head' }, t('x7.title', { bay: r.bay })),
      h('p', { class: 't-callout t-mute' }, t('x7.body', { driver: driver.name })),
      h('div', { class: 'fare-table fare-table--card' },
        line(t('x7.paid'), fmt.rupees(fare)),
        line(t('x7.waiting', { n: NO_SHOW.paidMin }), `− ${fmt.rupees(waitPay)}`),
        line(t('x7.late'), `− ${fmt.rupees(lateFee)}`),
        line(t('x7.back'), fmt.rupees(fare - waitPay - lateFee), true)),
    ],
    footer: [
      button({ label: t('x7.next', { vehicle: vehicle(r) }), onClick: () => {
        store.newBooking();
        go(R('X17'), { replace: true });
      } }),
      h('button', { type: 'button', class: 'quiet-link quiet-link--center', onClick: () => go(R('M3')) }, t('x7.fault')),
    ],
  });
  return { el, onMount: () => vibrate([40, 60, 40]) };
}

// ---------------------------------------------------------------- X15 · Location is off

export function X15() {
  const { el } = screen({
    code: 'X15',
    label: t('x15.title'),
    className: 'x15',
    topbar: topBar({ onBack: () => back(R('A5')) }),
    body: [
      stateIcon({ iconName: 'pin', tone: 'soft-l' }),
      h('h1', { class: 't-large screen__heading x15-head', tabindex: '-1' }, t('x15.title')),
      h('p', { class: 't-callout t-mute' }, t('x15.body')),
    ],
    footer: [
      button({ label: t('x15.settings'), onClick: () => {
        // Prototype: "Settings" turns location on and brings her back
        store.set('rider', { location: 'while-using' });
        toast(t('x15.on'));
        go(R('A7'));
      } }),
      button({ label: t('x15.without'), variant: 'text', onClick: () => go(R('A7')) }),
    ],
  });
  return { el };
}

// ---------------------------------------------------------------- X17 · At the exit now (no booking)

export function X17() {
  // An auto from the queue, to the saved Home
  if (booking().ride !== 'auto' || booking().dest !== 'home') store.set('booking', { ride: 'auto', dest: 'home' });
  const r = ride();
  const place = home();
  const vals = { vehicle: vehicle(r), bay: r.bay, level: r.level, min: BAY.walkMin };
  const b0 = booking();

  const pay = button({
    label: t('x17.cta', vals),
    onClick: () => {
      if (!needOnline()) return;
      pay.setLoading(t('x17.paying'));
      after(900, () => {
        store.set('booking', { state: 'landed', paidAt: Date.now(), flight: null, driver: 'santosh', skipsLeft: 1, waitStartedAt: 0 });
        vibrate(25);
        go(R('C3'), { replace: true, fade: true });
      });
    },
  });
  pay.classList.add('price-bar__cta');

  const { el } = screen({
    code: 'X17',
    label: t('x17.title', vals),
    className: 'b3 x17',
    topbar: topBar({ onBack: () => back(R('B1')), title: t('x17.title', vals) }),
    body: [
      rowCard([
        listRow({ iconName: 'pin', iconTone: 'brand', title: t('x17.from'), sub: t('x17.here') }),
        listRow({ iconName: 'home', title: t('b3.homeRow', { place: place.label }), sub: t('b3.destSub', { km: place.km }), chevron: true, onClick: () => go(R('B3a')) }),
      ]),
      h('h2', { class: 'section-label' }, t('b3.carrying')),
      h('div', { class: 'steppers' },
        stepper({ label: t('b3.big'), sub: t('b3.bigSub'), value: b0.big, min: 0, max: 2, onChange: (v) => store.set('booking', { big: v }) }),
        stepper({ label: t('b3.small'), sub: t('b3.smallSub'), value: b0.small, min: 0, max: 2, onChange: (v) => store.set('booking', { small: v }) })),
      h('div', { class: 'ride-card' },
        h('div', { class: 'ride-card__head' },
          ic(r.icon, { size: 24 }),
          h('span', { class: 't-headline ride-card__name' }, t('x17.card', vals)),
          h('span', { class: 't-title2 ride-card__fare' }, fmt.rupees(fareOf(r)))),
        h('p', { class: 't-subhead' }, t('x17.pickup', vals)),
        h('p', { class: 't-subhead' }, t('x17.rule', vals))),
    ],
    footer: [h('div', { class: 'price-bar' }, h('div', { class: 'price-bar__text' }, h('span', { class: 'price-bar__amount' }, fmt.rupees(fareOf(r))), h('span', { class: 't-footnote t-mute' }, t('b3.allIn'))), pay)],
  });
  return { el };
}
