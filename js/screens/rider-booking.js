// Rider · 1 Lock a ride before landing: B1–B8, sheets B3b / B4 / B4a / B4b /
// B7a, dialogs X8 (cancel, free) and X13 (payment failed).
// Each factory is named after its Figma frame code.

import {
  h, ic, screen, topBar, button, textField, radioGroup, iconTile, listRow, rowCard,
  tabBar, stepper, checkbox, choiceChips, chip, stateIcon, banner, skeleton, progressRing,
} from '../components.js';
import { toast, sheet, dialog } from '../overlays.js';
import { go, back, backTo } from '../router.js';
import { store, hasRide } from '../store.js';
import { t } from '../i18n.js';
import { after, timerBag } from '../clock.js';
import * as fmt from '../format.js';
import { FLIGHTS, PLACES, RIDES, POOLS, POOL, CONTACTS, FARE, BAY, LIMITS, RIDER, TIMING, SHORT_TRIP, LATE } from '../data.js';
import { R, soon, needOnline, vibrate } from './rider-onboarding.js';

// ---------------------------------------------------------------- helpers

const booking = () => store.booking();
const rider = () => store.rider();
const firstName = () => rider().firstName || RIDER.firstName;
const flight = () => FLIGHTS.find((f) => f.no === booking().flight) || FLIGHTS[0];
const home = () => PLACES.find((p) => p.id === (rider().home || 'chakala')) || PLACES[0];
/** The ride being booked. A pool (flow 6) is a shared cab at the pool's per-rider fare. */
const ride = () => {
  const p = booking().pool && POOL[booking().pool];
  if (p) return { ...RIDES[1], id: 'pool', icon: 'users', name: p.name, fare: p.fare };
  return RIDES.find((r) => r.id === booking().ride) || RIDES[0];
};
const vehicle = (r = ride()) => (r.id === 'auto' ? 'auto' : 'cab');
/** Where the ride goes: the saved Home, or a place picked on B3a. */
const dest = () => (booking().dest === 'home' ? home() : PLACES.find((p) => p.id === booking().dest) || home());
const isHomeDest = () => dest().id === home().id;
/** X16 · short trips: an auto charges the hub minimum fare. */
const isShort = () => dest().km <= SHORT_TRIP.maxKm;
const fareOf = (r = ride()) => {
  // X20 · a pool that switched to solo keeps the fare she already paid
  if (booking().lockedFare && r.id === ride().id) return booking().lockedFare;
  return isShort() && r.id === 'auto' ? SHORT_TRIP.minFare : r.fare;
};
/** "Home · Chakala, Andheri East" or "Sahar Village, Andheri East" */
const destLabel = () => (isHomeDest() ? t('b3.homeRow', { place: home().label }) : `${dest().label}, ${dest().line}`);
/** Cancellation / no-show fee: 10% of fare, up to ₹100 (Maharashtra 2026). */
const fee = (fare) => fmt.rupees(Math.min(100, Math.round(fare * 0.1)));
const fits = (r, b = booking()) => b.big <= r.fits.big && b.big + b.small <= r.fits.bags && b.people <= r.fits.people;
const people = (n) => (n === 1 ? t('b7.person') : t('b7.persons', { n }));

function names(ids) {
  const list = CONTACTS.filter((c) => ids.includes(c.id)).map((c) => c.name);
  if (list.length <= 1) return list[0] || '';
  return t('b7a.and', { a: list.slice(0, -1).join(', '), b: list[list.length - 1] });
}

/** Bottom tabs: Home (B1 / B8), Trips (M1), Help (M3), Profile (M6). Cross-fade, no slide. */
function onTab(id) {
  const to = { home: hasRide() ? 'B8' : 'B1', trips: 'M1', help: 'M3', profile: 'M6' }[id];
  if (location.hash === `#${R(to)}`) return;
  go(R(to), { replace: true, fade: true });
}

/** "At the exit now?" card — B1 and B8. */
function exitCard() {
  return h(
    'button',
    { type: 'button', class: 'action-card', onClick: () => go(R('X17')) },
    iconTile('door'),
    h('span', { class: 'list-row__body' }, h('span', { class: 'list-row__title' }, t('b1.exit')), h('span', { class: 'list-row__sub' }, t('b1.exitSub'))),
    ic('chev', { size: 20 }),
  );
}

// Shared with flows 2 and 3 (rider-trip.js, rider-edge.js)
export { ride, home, vehicle, names, firstName, fareOf, fee, dest, destLabel, isHomeDest, fits, people, onTab, exitCard, flight };

// ---------------------------------------------------------------- B1 · Home (first time)

export function B1() {
  const toFlight = () => go(R('B2'));
  const card = h(
    'section',
    { class: 'hero-card', onClick: toFlight },
    h('span', { class: 'hero-card__icon' }, ic('plane', { size: 28 })),
    h('h2', { class: 't-title2 hero-card__title' }, t('b1.cardTitle')),
    h('p', { class: 't-subhead hero-card__body' }, t('b1.cardBody')),
    h('button', { type: 'button', class: 'hero-card__search' }, ic('search', { size: 20 }), h('span', {}, t('b1.flightPh'))),
  );
  const how = [
    ['lock', 'b1.how1', 'b1.how1s'],
    ['bag', 'b1.how2', 'b1.how2s'],
    ['pin', 'b1.how3', 'b1.how3s'],
  ].map(([i, a, b]) => listRow({ iconName: i, title: t(a), sub: t(b) }));

  const { el } = screen({
    code: 'B1',
    label: t('b1.hi', { name: firstName() }),
    className: 'home',
    topbar: topBar({ title: t('b1.hi', { name: firstName() }), brandMark: true }),
    body: [
      card,
      exitCard(),
      h('h2', { class: 'section-label' }, t('b1.how')),
      h('div', { class: 'divided' }, how),
    ],
    tabbar: tabBar('home', onTab),
  });
  return { el };
}

// ---------------------------------------------------------------- B8 · Home (ride booked)

export function B8({ code } = {}) {
  const b = booking();
  const f = flight();
  const r = ride();
  // X18 · No internet: the same Home with the offline banner shown
  const offlineDemo = code === 'X18'
    ? h('div', { class: 'offline-demo' }, banner({ tone: 'offline', iconName: 'wifioff', text: t('common.offlineBooked') }))
    : null;
  const card = h(
    'button',
    { type: 'button', class: 'hero-card hero-card--ride', onClick: () => go(R('B7')) },
    h('span', { class: 'hero-card__top' }, h('span', { class: 'hero-card__label' }, t('b8.label')), chip(t('b8.onTime'), 'on-dark')),
    h('span', { class: 't-title1 hero-card__title' }, t('b8.title', { no: f.no, time: f.lands })),
    h('span', { class: 't-subhead hero-card__body' }, t('b8.sub', { bay: r.bay, level: r.level, amount: fmt.rupees(fareOf(r)) })),
    h('span', { class: 'hero-card__link' }, t('b8.view'), ic('chev', { size: 18, stroke: 2.5 })),
  );
  const shared = b.sharedWith.length
    ? h(
      'div',
      { class: 'follow-card' },
      ic('share', { size: 24 }),
      h('span', { class: 'list-row__body' }, h('span', { class: 'list-row__title' }, t('b8.follow', { names: names(b.sharedWith) })), h('span', { class: 'list-row__sub' }, t('b8.followSub'))),
    )
    : null;

  const { el } = screen({
    code: 'B8',
    label: t('b1.hi', { name: firstName() }),
    className: 'home',
    topbar: topBar({ title: t('b1.hi', { name: firstName() }), brandMark: true }),
    body: [offlineDemo, card, exitCard(), shared],
    tabbar: tabBar('home', onTab),
  });
  return { el };
}

// ---------------------------------------------------------------- B2 · Your flight

/** "ai864" → "AI 864" */
function flightNo(raw) {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = s.match(/^([A-Z0-9]{2})(\d{0,4})/);
  if (!m) return s;
  return m[2] ? `${m[1]} ${m[2]}` : m[1];
}

export function B2() {
  const timers = timerBag();
  const results = h('div', { class: 'b2-results', 'aria-live': 'polite' });
  let q = booking().flight || '';

  const field = textField({
    label: t('b2.label'),
    value: q,
    placeholder: t('b2.ph'),
    clearable: true,
    autocomplete: 'off',
    autocapitalize: 'characters',
    spellcheck: false,
    onInput: (e) => {
      const v = flightNo(e.target.value);
      if (v !== e.target.value) e.target.value = v;
      q = v;
      search();
    },
  });

  const pick = (f) => {
    store.set('booking', { flight: f.no });
    go(R('B3'));
  };

  function resultCard(f) {
    return h(
      'button',
      { type: 'button', class: 'flight-card', onClick: () => pick(f) },
      iconTile('plane', { round: true }),
      h('span', { class: 'list-row__body' },
        h('span', { class: 't-headline' }, t('b2.route', { no: f.no, from: f.from })),
        h('span', { class: 'list-row__sub' }, t('b2.lands', { terminal: f.terminal, time: f.lands }))),
      chip(t('b2.onTime'), 'neutral'),
    );
  }

  function search() {
    timers.clear();
    const key = q.replace(/\s/g, '');
    if (key.length < 2) {
      results.replaceChildren();
      return;
    }
    results.replaceChildren(h('p', { class: 'section-label' }, t('b2.searching', { q })), skeleton(1));
    timers.add(after(380, () => {
      const found = FLIGHTS.filter((f) => f.no.replace(/\s/g, '').startsWith(key));
      if (!found.length) {
        results.replaceChildren(
          h('div', { class: 'empty-line' }, h('p', { class: 't-headline' }, t('b2.none', { q })), h('p', { class: 't-subhead t-mute' }, t('b2.noneHint'))),
        );
        return;
      }
      results.replaceChildren(h('h2', { class: 'section-label' }, t('b2.found', { n: found.length })), ...found.map(resultCard));
    }));
  }

  field.input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const f = FLIGHTS.find((x) => x.no.replace(/\s/g, '') === q.replace(/\s/g, ''));
    if (f) pick(f);
  });

  const { el } = screen({
    code: 'B2',
    label: t('b2.title'),
    topbar: topBar({ onBack: () => back(R('B1')), title: t('b2.title') }),
    body: [
      field.el,
      results,
      h('button', { type: 'button', class: 'quiet-link', onClick: () => soon(t('b2.diffDateWhat')) }, t('b2.diffDate')),
      banner({ tone: 'neutral', iconName: 'clock', text: t('b2.note') }),
    ],
  });
  if (q) search();
  return {
    el,
    onMount: () => field.input.focus({ preventScroll: true }),
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- B3 · Ride home

export function B3({ code } = {}) {
  const f = flight();
  const place = dest();
  const short = isShort();
  let autoMoved = false;

  const tripCard = rowCard([
    listRow({
      iconName: 'plane',
      title: t('b3.flightRow', { no: f.no, terminal: f.terminal, time: f.lands }),
      sub: t('b3.flightSub'),
      chevron: true,
      onClick: () => backTo(R('B2')),
    }),
    listRow({
      iconName: 'home',
      title: destLabel(),
      sub: t('b3.destSub', { km: place.km }),
      chevron: true,
      onClick: () => go(R('B3a')),
    }),
  ]);
  // X16 · Short trip: the minimum-fare note sits under the trip card
  const shortNote = short
    ? [
      banner({ tone: 'neutral', iconName: 'auto', text: t('x16.note') }),
      h('button', { type: 'button', class: 'quiet-link quiet-link--ink', onClick: () => openMinFare() }, t('x16.why')),
    ]
    : [];

  const note = h('p', { class: 'bag-note', 'aria-live': 'polite' });
  const rideCard = h('div', { class: 'ride-card' });
  const priceEl = h('span', { class: 'price-bar__amount' });

  function setBags(patch) {
    store.set('booking', patch);
    const b = booking();
    let msg = '';
    if (!fits(ride(), b)) {
      const was = ride().id;
      const next = RIDES.find((r) => fits(r, b));
      if (next) {
        msg = next.id !== 'auto' ? t('b3.switched', { n: RIDES[0].fits.big, to: next.name }) : '';
        store.set('booking', { ride: next.id });
        autoMoved = next.id !== 'auto';
        // X19 · Bags don't fit an auto: show the ways home that do
        if (was === 'auto' && next.id !== 'auto') after(260, () => openOtherWays(renderRide, { tooBig: true }));
      }
    } else if (autoMoved && fits(RIDES[0], b)) {
      // Bags fit an auto again: go back to the cheapest ride
      store.set('booking', { ride: 'auto' });
      autoMoved = false;
    } else if (autoMoved) {
      msg = t('b3.switched', { n: RIDES[0].fits.big, to: ride().name });
    }
    if (b.big >= LIMITS.big) msg = t('b3.max', { n: LIMITS.big });
    note.replaceChildren(...(msg ? [ic('alert', { size: 16 }), h('span', {}, msg)] : []));
    renderRide();
  }

  function renderRide() {
    const r = ride();
    const b = booking();
    rideCard.replaceChildren(
      h('div', { class: 'ride-card__head' },
        ic(r.icon, { size: 24 }),
        h('span', { class: 't-title2 ride-card__name' }, r.name),
        h('span', { class: 't-title2 ride-card__fare' }, fmt.rupees(fareOf(r)))),
      short && r.id === 'auto' ? h('span', { class: 'ride-card__chip' }, chip(t('x16.chip'), 'dark')) : null,
      h('p', { class: 't-subhead' }, t('b3.fits', { big: b.big, small: b.small })),
      h('p', { class: 't-subhead' }, t('b3.pickup', { bay: r.bay, level: r.level, min: BAY.walkMin })),
    );
    rideCard.classList.remove('is-changed');
    void rideCard.offsetWidth;
    rideCard.classList.add('is-changed');
    priceEl.textContent = fmt.rupees(fareOf(r));
  }

  const b0 = booking();
  const steppers = [
    stepper({ label: t('b3.big'), sub: t('b3.bigSub'), value: b0.big, min: 0, max: LIMITS.big, onChange: (v) => setBags({ big: v }) }),
    stepper({ label: t('b3.small'), sub: t('b3.smallSub'), value: b0.small, min: 0, max: LIMITS.small, onChange: (v) => setBags({ small: v }) }),
    stepper({ label: t('b3.people'), sub: t('b3.peopleSub'), value: b0.people, min: 1, max: LIMITS.people, onChange: (v) => setBags({ people: v }) }),
  ];
  renderRide();

  const cta = button({ label: t('b3.cta'), onClick: () => openLock() });
  cta.classList.add('price-bar__cta');

  const { el } = screen({
    code: 'B3',
    label: t('b3.title'),
    topbar: topBar({ onBack: () => back(R('B2')), title: t('b3.title') }),
    body: [
      tripCard,
      ...shortNote,
      h('h2', { class: 'section-label' }, t('b3.carrying')),
      h('div', { class: 'steppers' }, steppers),
      note,
      rideCard,
      h('button', { type: 'button', class: 'quiet-link quiet-link--ink', onClick: () => openOtherWays(renderRide) }, t('b3.other')),
    ],
    footer: [h('div', { class: 'price-bar' }, h('div', { class: 'price-bar__text' }, priceEl, h('span', { class: 't-footnote t-mute' }, t('b3.allIn'))), cta)],
  });
  el.classList.add('b3');
  if (short) el.classList.add('b3--short');

  return {
    el,
    onMount() {
      if (code === 'B3b') openOtherWays(renderRide);
      if (code === 'B4') openLock();
      if (code === 'B4a') openIncluded();
      if (code === 'B4b') openPromise();
      if (code === 'B3mi') openMinFare();
      if (code === 'X19' && booking().big < 3) {
        steppers[0].setValue(3);
        setBags({ big: 3 });
      }
    },
  };
}

// ---------------------------------------------------------------- B3mi · Why a minimum fare? (sheet)

export function openMinFare() {
  const line = (label, value, strong) =>
    h('div', { class: `fare-row${strong ? ' fare-row--strong' : ''}` }, h('span', {}, label), h('span', { class: 'fare-row__v' }, value));
  sheet({
    title: t('b3mi.title'),
    content: [
      h('p', { class: 't-callout t-mute sheet__sub' }, t('b3mi.body')),
      h('div', { class: 'fare-table' },
        line(t('b3mi.distance', { km: dest().km }), fmt.rupees(SHORT_TRIP.distanceFare)),
        line(t('b3mi.min'), fmt.rupees(SHORT_TRIP.minFare), true)),
      h('div', { class: 'pickup-card' },
        iconTile('shield', { tone: 'brand' }),
        h('span', { class: 'list-row__body' }, h('span', { class: 't-headline' }, t('b3mi.refuse')), h('span', { class: 't-subhead t-mute' }, t('b3mi.refuseSub')))),
    ],
    actions: [{ label: t('common.gotIt') }],
  });
}

// ---------------------------------------------------------------- B3b · Other ways home (sheet)

function openOtherWays(onPick, { tooBig = false } = {}) {
  const b = booking();
  // X19 · "Ways home": the rides that fit come first, the auto last with its reason
  const list = tooBig ? [...RIDES.filter((r) => fits(r, b)), ...RIDES.filter((r) => !fits(r, b))] : RIDES;
  const options = list.map((r) => {
    const ok = fits(r, b);
    const sub = !ok
      ? t('b3b.notFit', { n: b.big })
      : r.id === 'auto'
        ? t('b3b.fitsAuto', { big: b.big, small: b.small, bay: r.bay })
        : t('b3b.fitsBig', { n: r.fits.big, bay: r.bay });
    return h(
      'button',
      { type: 'button', class: 'option-card', 'aria-checked': String(r.id === b.ride), 'aria-disabled': ok ? null : 'true', dataset: { value: r.id } },
      ic(r.icon, { size: 24 }),
      h('span', { class: 'option-card__body' }, h('span', { class: 't-headline' }, r.name), h('span', { class: 't-footnote option-card__sub' }, sub)),
      h('span', { class: 't-headline option-card__fare' }, fmt.rupees(fareOf(r))),
    );
  });
  const group = h('div', { class: 'option-list', 'aria-label': t('b3b.title') }, options);
  radioGroup(group, options, (id) => {
    store.set('booking', { ride: id, pool: null, lockedFare: 0 });
    onPick && onPick();
    if (tooBig) after(180, () => entry.close()); // X19: picking a ride closes the sheet
  });
  // Pools open their own screens (flow 6). Women-only shows only when it's on in Profile.
  const pools = POOLS.filter((p) => p.id !== 'women' || rider().womenPool).map((p) =>
    h(
      'button',
      { type: 'button', class: 'option-card', onClick: () => go(R(p.id === 'women' ? 'B3pw' : 'B3p')) },
      ic(p.icon, { size: 24 }),
      h('span', { class: 'option-card__body' }, h('span', { class: 't-headline' }, p.name), h('span', { class: 't-footnote option-card__sub' }, p.sub)),
      h('span', { class: 't-headline option-card__fare' }, fmt.rupees(p.fare)),
    ),
  );
  const entry = sheet({
    title: tooBig ? t('x19.title') : t('b3b.title'),
    content: [
      h('p', { class: 't-callout t-mute sheet__sub' }, tooBig ? t('x19.sub', { n: b.big }) : t('b3b.sub')),
      group,
      tooBig ? null : h('div', { class: 'option-list' }, pools),
      tooBig ? null : h('button', { type: 'button', class: 'quiet-link quiet-link--ink', onClick: () => go(R('B3w')) }, t('b3b.otherOut')),
    ].filter(Boolean),
    actions: [{ label: t('b3b.done') }],
  });
}

// ---------------------------------------------------------------- B4 · Lock your ride (sheet)

export function openLock() {
  const b = booking();
  const r = ride();
  const f = flight();
  const amount = fmt.rupees(fareOf(r));
  const pool = Boolean(b.pool); // B4p · Lock your pool

  const pay = button({
    label: t('b4.pay', { amount }),
    icon: 'lock',
    onClick: () => {
      if (!needOnline()) return;
      pay.setLoading(t('b4.paying'));
      store.set('booking', { state: 'paying' });
      after(700, () => {
        entry.close();
        go(R('B5'));
      });
    },
  });

  const rows = rowCard([
    listRow({ iconName: 'lock', iconTone: 'brand', title: t('b4.r1'), sub: t('b4.r1s') }),
    pool ? listRow({ iconName: 'refresh', title: t('b4p.fill'), sub: t('b4p.fillSub', { amount }) }) : null,
    listRow({ iconName: 'shield', iconTone: 'brand', title: t('b4.r2'), sub: pool ? t('b4p.promise') : t('b4.r2s', { vehicle: vehicle(r), fee: fee(fareOf(r)) }), chevron: true, onClick: openPromise }),
    pool ? null : listRow({ iconName: 'clock', title: t('b4.r3'), sub: t('b4.r3s') }),
    h(
      'div',
      { class: 'list-row' },
      iconTile('upi'),
      h('span', { class: 'list-row__body' }, h('span', { class: 'list-row__title' }, t('b4.upi', { upi: RIDER.upi })), h('span', { class: 'list-row__sub' }, t('b4.upiSub'))),
      h('button', { type: 'button', class: 'quiet-link quiet-link--ink', onClick: () => soon(t('b4.changeWhat')) }, t('b4.change')),
    ),
  ], 'row-card--flush');

  const entry = sheet({
    title: pool ? t('b4p.title') : t('b4.title'),
    className: 'sheet--lock',
    content: [
      h('p', { class: 't-subhead t-mute sheet__sub' }, pool
        ? t('b4p.summary', { no: f.no, dest: isHomeDest() ? t('b3a.home') : dest().label, ride: r.name, bags: t('b4.bags', { big: b.big, small: b.small }) })
        : t('b4.summary', {
          no: f.no,
          dest: isHomeDest() ? t('b3a.home') : dest().label,
          bags: t('b4.bags', { big: b.big, small: b.small }),
          ride: r.name,
        })),
      h(
        'div',
        { class: 'fare-line' },
        h('div', {}, h('p', { class: 'fare-line__amount' }, amount), h('p', { class: 't-subhead t-mute' }, pool ? t('b4p.allIn') : t('b4.allIn'))),
        h('button', { type: 'button', class: 'quiet-link quiet-link--ink fare-line__included', onClick: openIncluded }, t('b4.included')),
      ),
      rows,
    ],
    actions: [pay, pool ? null : h('p', { class: 't-footnote t-mute t-center' }, t('b4.free'))].filter(Boolean),
  });
}

// ---------------------------------------------------------------- B4a · What’s included (sheet)

function openIncluded() {
  const b = booking();
  const r = ride();
  const minimum = fareOf(r) !== r.fare; // X16 · hub minimum fare applies
  const rideFare = minimum ? SHORT_TRIP.distanceFare : r.fare - FARE.parking - FARE.tolls;
  const line = (label, value, strong) =>
    h('div', { class: `fare-row${strong ? ' fare-row--total' : ''}` }, h('span', {}, label), h('span', { class: 'fare-row__v' }, value));
  sheet({
    title: t('b4a.title'),
    content: [
      h(
        'div',
        { class: 'fare-table' },
        line(t('b4a.ride', { km: dest().km }), fmt.rupees(rideFare)),
        minimum
          ? line(t('x16.chip'), `+ ${fmt.rupees(SHORT_TRIP.minFare - SHORT_TRIP.distanceFare)}`)
          : line(t('b4a.parking'), fmt.rupees(FARE.parking)),
        line(t('b4a.tolls'), fmt.rupees(FARE.tolls)),
        line(t('b4a.bags', { big: b.big, small: b.small }), t('b4a.bagsVal')),
        line(t('b4a.pay'), fmt.rupees(fareOf(r)), true),
      ),
      banner({ tone: 'neutral', iconName: 'alert', text: t('b4a.note') }),
    ],
    actions: [{ label: t('common.gotIt') }],
  });
}

// ---------------------------------------------------------------- B4b · Ride promise (sheet)

function openPromise() {
  const r = ride();
  const v = { vehicle: vehicle(r), fee: fee(fareOf(r)) };
  sheet({
    title: t('b4b.title'),
    content: [
      h(
        'div',
        { class: 'divided' },
        listRow({ iconName: 'shield', iconTone: 'brand', title: t('b4b.p1'), sub: t('b4b.p1s', v) }),
        listRow({ iconName: 'x', title: t('b4b.p2'), sub: t('b4b.p2s', v) }),
        listRow({ iconName: 'clock', title: t('b4b.p3'), sub: t('b4b.p3s', v) }),
        listRow({ iconName: 'doc', iconTone: 'brand', title: t('b4b.p4'), sub: t('b4b.p4s') }),
      ),
      h('p', { class: 't-footnote t-mute' }, t('b4b.rules')),
    ],
    actions: [{ label: t('common.gotIt') }],
  });
}

// ---------------------------------------------------------------- B5 · Paying (⏱3 s → B6)

export function B5({ code } = {}) {
  const timers = timerBag();
  const amount = fmt.rupees(fareOf());

  function start() {
    timers.clear();
    timers.add(after(TIMING.payingMs, () => {
      store.set('booking', { state: 'scheduled', paidAt: Date.now() });
      vibrate(25);
      go(R('B6'), { replace: true, fade: true });
    }));
  }

  function failed() {
    timers.clear();
    dialog({
      title: t('x13.title'),
      body: t('x13.body'),
      iconName: 'x',
      iconTone: 'plain',
      actions: [
        { label: t('x13.retry'), onClick: start },
        { label: t('x13.change'), variant: 'secondary', onClick: () => {
          store.set('booking', { state: 'draft' });
          backTo(R('B3'));
        } },
      ],
    });
  }

  const { el } = screen({
    code: 'B5',
    label: t('b5.title', { amount }),
    className: 'b5',
    body: [
      h(
        'div',
        { class: 'center-stack' },
        h('div', { class: 'pay-ring-wrap' }, progressRing(120), h('span', { class: 'pay-ring__icon' }, ic('upi', { size: 32 }))),
        h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('b5.title', { amount })),
        h('p', { class: 't-callout t-mute' }, t('b5.sub')),
      ),
    ],
    footer: [h('button', { type: 'button', class: 'quiet-link quiet-link--center', onClick: failed }, t('b5.failed'))],
  });
  return {
    el,
    onMount() {
      if (code === 'X13') failed();
      else start();
    },
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- B6 · Ride locked

export function B6() {
  const r = ride();
  const f = flight();
  const { el } = screen({
    code: 'B6',
    label: t('b6.title'),
    className: 'b6',
    body: [
      h(
        'div',
        { class: 'center-stack center-stack--top' },
        stateIcon({ iconName: 'check', tone: 'success' }),
        h('h1', { class: 't-large screen__heading', tabindex: '-1' }, t('b6.title')),
        h('p', { class: 't-callout t-mute' }, t('b6.sub')),
      ),
      rowCard([
        listRow({ iconName: 'plane', title: t('b6.flight', { no: f.no, time: f.lands }), sub: t('b6.flightSub') }),
        listRow({ iconName: 'pin', iconTone: 'brand', title: t('b6.bay', { bay: r.bay, level: r.level }), sub: t('b6.baySub', { min: BAY.walkMin }) }),
        listRow({ iconName: 'lock', iconTone: 'success', title: t('b6.paid', { amount: fmt.rupees(fareOf(r)) }), sub: t('b6.paidSub'), right: ic('check', { size: 20, stroke: 2.5 }) }),
      ], 'b6-card'),
    ],
    footer: [
      button({ label: t('b6.view'), onClick: () => go(R('B7')) }),
      button({ label: t('b6.share'), variant: 'text', onClick: () => openShare() }),
    ],
  });
  return { el };
}

// ---------------------------------------------------------------- B7 · Your ride (scheduled)

export function B7({ code } = {}) {
  const b = booking();
  const r = ride();
  const f = flight();
  const v = vehicle(r);
  // X1 · Flight is late: same screen, ride moved with the flight
  const late = code === 'X1';
  const steps = [
    { done: true, title: t('b7.s1'), sub: t('b7.s1s', { amount: fmt.rupees(fareOf(r)) }) },
    { title: t('b7.s2'), sub: t('b7.s2s') },
    { title: t('b7.s3'), sub: t('b7.s3s', { vehicle: v }) },
    { title: t('b7.s4', { bay: r.bay }), sub: t('b7.s4s', { vehicle: v }) },
  ];
  const list = h(
    'ol',
    { class: 'steps-list' },
    steps.map((s, i) =>
      h(
        'li',
        { class: `steps-list__item${s.done ? ' is-done' : ''}`, 'aria-current': i === 1 ? 'step' : null },
        h('span', { class: 'steps-list__mark', 'aria-hidden': 'true' }, s.done ? ic('check', { size: 16, stroke: 3 }) : String(i + 1)),
        h('span', { class: 'list-row__body' }, h('span', { class: 'list-row__title' }, s.title), h('span', { class: 'list-row__sub' }, s.sub)),
      ),
    ),
  );

  const { el } = screen({
    code: 'B7',
    label: t('b7.title'),
    topbar: topBar({
      onBack: () => backTo(R('B8')),
      title: t('b7.title'),
      chip: late ? chip(t('x1.moved'), 'warning', 'clock') : chip(t('b7.scheduled'), 'neutral'),
    }),
    body: [
      late ? banner({ tone: 'dark', iconName: 'clock', text: t('x1.banner', { time: LATE.newLands, amount: fmt.rupees(fareOf(r)) }) }) : null,
      h(
        'div',
        { class: `flight-banner${late ? ' flight-banner--late' : ''}` },
        ic('plane', { size: 24 }),
        h('span', { class: 'list-row__body' },
          h('span', { class: 't-title2' }, late ? t('x1.flight', { no: f.no }) : t('b7.flight', { no: f.no })),
          h('span', { class: 't-subhead t-mute' }, late ? t('x1.lands', { time: LATE.newLands }) : t('b7.lands', { terminal: f.terminal, time: f.lands }))),
      ),
      list,
      rowCard([
        listRow({ iconName: 'pin', iconTone: 'brand', title: t('b6.bay', { bay: r.bay, level: r.level }), sub: t('b6.baySub', { min: BAY.walkMin }) }),
        listRow({ iconName: 'bag', title: t('b7.bags', { big: b.big, small: b.small, people: people(b.people) }), sub: t('b7.bagsSub', { vehicle: v }) }),
      ]),
    ],
    footer: [
      button({ label: t('b7.share'), variant: 'secondary', icon: 'share', onClick: () => openShare() }),
      h('button', { type: 'button', class: 'quiet-link quiet-link--center', onClick: cancelRide }, t('b7.cancel')),
      late ? null : h('button', { type: 'button', class: 'quiet-link quiet-link--center quiet-link--faint', onClick: () => go(R('C1')) }, t('b7.skip')),
    ],
  });
  el.classList.add('b7');
  return {
    el,
    onMount() {
      if (code === 'B7a') openShare();
      if (code === 'X8') cancelRide();
    },
  };
}

// ---------------------------------------------------------------- X8 · Cancel (no driver yet)

function cancelRide() {
  dialog({
    title: t('x8.title'),
    body: t('x8.body', { amount: fmt.rupees(fareOf()) }),
    actions: [
      { label: t('x8.keep') },
      { label: t('x8.yes'), variant: 'secondary', onClick: () => {
        store.newBooking();
        toast(t('x8.done'));
        go(R('B1'), { replace: true, fade: true });
      } },
    ],
  });
}

// ---------------------------------------------------------------- B7a · Share your ride (sheet)

/**
 * B7a · Share your ride. From Profile (M6 "People who follow my rides") it
 * sets who follows every ride; from a booking it shares that ride too.
 */
export function openShare({ forProfile = false, onDone } = {}) {
  const followers = rider().followers || ['mom'];
  let picked = forProfile
    ? [...followers]
    : booking().sharedWith.length ? [...booking().sharedWith] : [...followers];
  let via = 'whatsapp';

  const cta = button({ label: '', icon: 'share', onClick: share });
  const sync = () => {
    cta.setLabel(picked.length ? t('b7a.cta', { names: names(picked) }) : t('b7a.ctaNone'));
    cta.setDisabled(!picked.length);
  };

  const rows = CONTACTS.map((c) => {
    const row = h(
      'button',
      { type: 'button', class: 'contact-row', role: 'checkbox', 'aria-checked': String(picked.includes(c.id)) },
      iconTile('user'),
      h('span', { class: 'list-row__body' }, h('span', { class: 'list-row__title' }, c.name), h('span', { class: 'list-row__sub' }, c.phone)),
      checkbox(picked.includes(c.id)),
    );
    row.addEventListener('click', () => {
      const on = !picked.includes(c.id);
      picked = on ? [...picked, c.id] : picked.filter((x) => x !== c.id);
      row.setAttribute('aria-checked', String(on));
      row.querySelector('.checkbox').classList.toggle('is-on', on);
      sync();
    });
    return row;
  });

  const chips = choiceChips({
    label: t('b7a.via'),
    value: via,
    options: [
      { value: 'whatsapp', label: t('b7a.whatsapp') },
      { value: 'sms', label: t('b7a.sms') },
      { value: 'copy', label: t('b7a.copy') },
    ],
    onChange: (v) => {
      via = v;
    },
  });

  function share(_, { disabled }) {
    if (disabled || !needOnline()) return;
    cta.setLoading(t('b7a.sending'));
    const who = names(picked);
    const finish = () => {
      store.set('rider', { followers: picked });
      if (!forProfile || store.booking().state !== 'draft') store.set('booking', { sharedWith: picked });
      entry.close();
      toast(via === 'copy' ? t('b7a.copied', { names: who }) : t('b7a.done', { names: who }));
      onDone && onDone(picked);
    };
    if (via === 'copy' && navigator.clipboard) {
      navigator.clipboard.writeText(`${location.href.split('#')[0]}#/rider/B7`).catch(() => {}).finally(() => after(400, finish));
    } else {
      after(600, finish);
    }
  }

  sync();
  const entry = sheet({
    title: t('b7a.title'),
    content: [
      h('p', { class: 't-callout t-mute sheet__sub' }, t('b7a.sub')),
      h(
        'div',
        { class: 'divided' },
        rows,
        h('button', { type: 'button', class: 'list-row', onClick: () => soon(t('b7a.pickWhat')) }, iconTile('plus'), h('span', { class: 'list-row__body' }, h('span', { class: 'list-row__title' }, t('b7a.pick')))),
      ),
      chips,
    ],
    actions: [cta],
  });
}

// ---------------------------------------------------------------- B3a · Where to?

export function B3a() {
  const results = h('div', { class: 'b3a-list' });
  let q = '';

  const field = textField({
    ariaLabel: t('b3a.ph'),
    placeholder: t('b3a.ph'),
    lead: 'search',
    clearable: true,
    autocomplete: 'off',
    onInput: (e) => {
      q = e.target.value;
      render();
    },
  });
  field.el.classList.add('field--search');

  const chooseHome = () => {
    store.set('booking', { dest: 'home' });
    back(R('B3'));
  };

  const placeRow = (p, iconName = 'clock') => {
    const isHome = p.id === home().id;
    return listRow({
      iconName: isHome ? 'home' : iconName,
      title: isHome ? t('b3a.home') : p.label,
      sub: isHome ? p.label : t('b3a.km', { line: p.line, km: p.km }),
      onClick: isHome
        ? chooseHome
        : p.km <= SHORT_TRIP.maxKm
          ? () => {
            // X16 · a short trip from T2 gets the hub minimum fare
            store.set('booking', { dest: p.id, ride: 'auto' });
            go(R('X16'));
          }
          : () => soon(t('b3a.otherWhat')),
    });
  };

  function render() {
    const words = q.toLowerCase().split(/[\s,]+/).filter(Boolean);
    if (words.length) {
      const found = PLACES.filter((p) => {
        const hay = `${p.label} ${p.line}`.toLowerCase().split(/[\s,]+/);
        return words.every((w) => hay.some((x) => x.startsWith(w)));
      });
      results.replaceChildren(
        h('h2', { class: 'section-label' }, t('b3a.results')),
        found.length
          ? h('div', { class: 'divided' }, found.map((p) => placeRow(p, 'pin')))
          : h('div', { class: 'empty-line' }, h('p', { class: 't-headline' }, t('a7.none', { q: q.trim() })), h('p', { class: 't-subhead t-mute' }, t('a7.noneHint'))),
      );
      return;
    }
    results.replaceChildren(
      h('h2', { class: 'section-label' }, t('b3a.saved')),
      h(
        'div',
        { class: 'divided' },
        listRow({ iconName: 'home', title: t('b3a.home'), sub: home().label, onClick: chooseHome }),
        listRow({ iconName: 'work', title: t('b3a.addWork'), sub: t('b3a.addWorkSub'), right: ic('plus', { size: 20 }), onClick: () => soon(t('b3a.addWork')) }),
      ),
      h('h2', { class: 'section-label' }, t('b3a.recent')),
      h('div', { class: 'divided' }, ['sahar', 'bandra'].map((id) => placeRow(PLACES.find((p) => p.id === id)))),
    );
  }
  render();

  const { el } = screen({
    code: 'B3a',
    label: t('b3a.title'),
    topbar: topBar({ onBack: () => back(R('B3')), title: t('b3a.title') }),
    body: [field.el, results],
  });
  return { el, onMount: () => field.input.focus({ preventScroll: true }) };
}
