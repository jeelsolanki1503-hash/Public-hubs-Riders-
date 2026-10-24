// Rider · 4 Trips, Help and Profile tabs: M1–M6.
// Each factory is named after its Figma frame code.

import {
  h, ic, screen, topBar, button, textField, listRow, rowCard, tabBar,
  choiceChips, stateIcon, banner, switchRow,
} from '../components.js';
import { toast, dialog } from '../overlays.js';
import { go, back } from '../router.js';
import { store, hasRide } from '../store.js';
import { t, contentLang } from '../i18n.js';
import { after } from '../clock.js';
import * as fmt from '../format.js';
import { PLACES, RIDES, DRIVERS, FARE, SHORT_TRIP, RIDER, TRIP, LANGUAGES } from '../data.js';
import { R, soon, needOnline, vibrate } from './rider-onboarding.js';
import { home, names, onTab, openShare } from './rider-booking.js';
import { openSos, finishCurrentTrip } from './rider-trip.js';

const rider = () => store.rider();
const booking = () => store.booking();

/** A ride that is under way (landed … arrived) counts as "today's trip". */
const LIVE = ['landed', 'matched', 'walking', 'atBay', 'onTrip', 'arrived', 'noShow'];

/**
 * The trip Help talks about: the ride in progress, else the last finished one.
 * Returns { driver, dest, place } or null.
 */
function currentTrip() {
  const b = booking();
  if (LIVE.includes(b.state)) return { driver: DRIVERS[b.driver] || DRIVERS.santosh, place: placeOf(b.dest) };
  const last = store.get().trips[0];
  if (last) return { driver: DRIVERS[last.driver] || DRIVERS.santosh, place: placeOf(last.dest) };
  return null;
}

function placeOf(dest) {
  if (!dest || dest === 'home') return { ...home(), isHome: true };
  return PLACES.find((p) => p.id === dest) || { ...home(), isHome: true };
}

/** "Home" for the saved Home, else the place name. */
const destWord = (place) => (place.isHome ? t('b3a.home') : place.label);

// ---------------------------------------------------------------- M1 · Trips

export function M1() {
  const trips = store.get().trips;
  const body = trips.length
    ? [
      h('h2', { class: 'section-label' }, t('m1.past')),
      h('div', { class: 'divided' }, trips.map((tr, i) => {
        const r = RIDES.find((x) => x.id === tr.ride) || RIDES[0];
        const d = DRIVERS[tr.driver] || DRIVERS.santosh;
        return listRow({
          iconName: r.icon,
          title: t('m1.route', { dest: destWord(placeOf(tr.dest)) }),
          sub: t('m1.meta', { day: dayOf(tr.at), time: tr.start || TRIP.pickupAt, driver: d.name, amount: fmt.rupees(tr.fare) }),
          chevron: true,
          onClick: () => go(R(`M2/${i}`)),
        });
      })),
      banner({ tone: 'neutral', iconName: 'doc', text: t('m1.note') }),
    ]
    : [
      // Empty state (design system "No trips yet")
      h('div', { class: 'empty-state' },
        stateIcon({ iconName: 'receipt', tone: 'soft-l' }),
        h('h2', { class: 't-title1' }, t('m1.emptyTitle')),
        h('p', { class: 't-callout t-mute' }, t('m1.emptyBody')),
        button({ label: t('m1.emptyCta'), size: 'm', onClick: () => go(R(hasRide() ? 'B8' : 'B1'), { replace: true, fade: true }) })),
    ];
  const { el } = screen({
    code: 'M1',
    label: t('m1.title'),
    className: 'tab-screen m1',
    topbar: topBar({ title: t('m1.title') }),
    body,
    tabbar: tabBar('trips', onTab),
  });
  return { el };
}

function dayOf(at) {
  const d = new Date(at || Date.now());
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return t('m1.today');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------- M2 · Receipt

export function M2({ arg } = {}) {
  const trips = store.get().trips;
  const tr = trips[Number(arg) || 0] || {
    // Opened straight from a deep link before any ride: show the sample receipt
    ride: 'auto', fare: 420, rating: 4, driver: 'santosh', dest: 'home', big: 2, small: 1, start: TRIP.pickupAt, end: TRIP.reachBy, at: Date.now(),
  };
  const r = RIDES.find((x) => x.id === tr.ride) || RIDES[0];
  const d = DRIVERS[tr.driver] || DRIVERS.santosh;
  const place = placeOf(tr.dest);
  const minimum = place.km <= SHORT_TRIP.maxKm && r.id === 'auto';
  const line = (label, value, strong) =>
    h('div', { class: `fare-row${strong ? ' fare-row--total' : ''}` }, h('span', {}, label), h('span', { class: 'fare-row__v' }, value));
  const rated = tr.rating == null ? t('m2.notRated') : tr.rating === 1 ? t('m2.rated1') : t('m2.rated', { n: tr.rating });

  const download = button({
    label: t('m2.download'),
    variant: 'secondary',
    icon: 'doc',
    onClick: () => {
      download.setLoading(t('m2.downloading'));
      after(500, () => {
        const text = [
          'Fixride · Receipt',
          `${t('m2.pickup', { bay: tr.bay || r.bay, level: tr.level || r.level })}  ${tr.start || TRIP.pickupAt}`,
          `${place.label}, ${place.line}  ${tr.end || TRIP.reachBy}`,
          t('m2.driver', { driver: d.name, plate: d.plate }),
          `${t('m2.paid')}: ${fmt.rupees(tr.fare)}`,
        ].join('\n');
        const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })), download: 'fixride-receipt.txt' });
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        download.setLoading(false);
        toast(t('m2.downloaded'));
      });
    },
  });

  const { el } = screen({
    code: 'M2',
    label: t('m2.title'),
    className: 'm2',
    topbar: topBar({ onBack: () => back(R('M1')), title: t('m2.title') }),
    body: [
      rowCard([
        listRow({ iconName: 'pin', iconTone: 'brand', title: t('m2.pickup', { bay: tr.bay || r.bay, level: tr.level || r.level }), sub: tr.start || TRIP.pickupAt }),
        listRow({ iconName: 'home', title: place.isHome ? place.label : `${place.label}, ${place.line}`, sub: tr.end || TRIP.reachBy }),
      ]),
      h('div', { class: 'driver-strip' },
        ic(r.icon, { size: 24 }),
        h('span', { class: 'list-row__body' },
          h('span', { class: 't-headline' }, t('m2.driver', { driver: d.name, plate: d.plate })),
          h('span', { class: 't-subhead t-mute' }, rated))),
      h('div', { class: 'fare-table m2-fare' },
        line(t('m2.ride', { km: place.km }), fmt.rupees(minimum ? SHORT_TRIP.distanceFare : tr.fare - FARE.parking - FARE.tolls)),
        minimum
          ? line(t('x16.chip'), `+ ${fmt.rupees(SHORT_TRIP.minFare - SHORT_TRIP.distanceFare)}`)
          : line(t('m2.parking'), fmt.rupees(FARE.parking)),
        line(t('m2.tolls'), fmt.rupees(FARE.tolls)),
        line(t('m2.bags'), t('m2.bagsVal')),
        line(t('m2.paid'), fmt.rupees(tr.fare), true)),
    ],
    footer: [
      download,
      h('button', { type: 'button', class: 'quiet-link quiet-link--center', onClick: () => go(R('M3')) }, t('m2.help')),
    ],
  });
  return { el };
}

// ---------------------------------------------------------------- M3 · Help

const TOPICS = [
  { id: 'bag', icon: 'bag', key: 'm3.bag' },
  { id: 'money', icon: 'wallet', key: 'm3.money' },
  { id: 'noShow', icon: 'clock', key: 'm3.noShow' },
  { id: 'unsafe', icon: 'shield', key: 'm3.unsafe' },
  { id: 'fare', icon: 'receipt', key: 'm3.fare' },
  { id: 'other', icon: 'help', key: 'm3.other' },
];

export function M3() {
  const trip = currentTrip();
  const card = trip
    ? h('div', { class: 'driver-strip' },
      ic('auto', { size: 24 }),
      h('span', { class: 'list-row__body' },
        h('span', { class: 't-headline' }, t('m3.trip', { dest: destWord(trip.place) })),
        h('span', { class: 't-subhead t-mute' }, t('m3.tripSub', { driver: trip.driver.name, plate: trip.driver.plate }))))
    : null;
  const rows = TOPICS.map((tp) => listRow({
    iconName: tp.icon,
    title: t(tp.key),
    chevron: true,
    // "I felt unsafe" opens SOS (X12) right here; the rest file a report (M4)
    onClick: tp.id === 'unsafe' ? () => openSos() : () => go(R(`M4/${tp.id}`)),
  }));
  const { el } = screen({
    code: 'M3',
    label: t('m3.title'),
    className: 'tab-screen m3',
    topbar: topBar({ title: t('m3.title') }),
    body: [card, h('h2', { class: 'section-label' }, t('m3.what')), h('div', { class: 'divided' }, rows)],
    tabbar: tabBar('help', onTab),
  });
  return { el };
}

// ---------------------------------------------------------------- M4 · Left a bag (report)

export function M4({ arg } = {}) {
  const topic = TOPICS.find((x) => x.id === arg && x.id !== 'unsafe') || TOPICS[0];
  const isBag = topic.id === 'bag';
  const trip = currentTrip() || { driver: DRIVERS.santosh, place: { ...home(), isHome: true } };
  let which = 'big';

  const field = textField({
    label: isBag ? t('m4.look') : t('m4.happened'),
    placeholder: isBag ? t('m4.lookPh') : t('m4.happenedPh'),
    autocapitalize: 'sentences',
  });

  const send = button({
    label: t('m4.cta'),
    onClick: () => {
      if (!needOnline()) return;
      send.setLoading(t('m4.sending'));
      store.set('rider', {
        cases: [{ id: TRIP.supportCase.id, topic: topic.id, bag: isBag ? which : null, note: field.input.value.trim(), driver: trip.driver.id, at: Date.now() }, ...(rider().cases || [])],
      });
      after(800, () => {
        vibrate(20);
        go(R('M5'), { replace: true, fade: true });
      });
    },
  });

  const { el } = screen({
    code: 'M4',
    label: isBag ? t('m4.title') : t(topic.key),
    className: 'm4',
    topbar: topBar({ onBack: () => back(R('M3')), title: isBag ? t('m4.title') : t(topic.key) }),
    body: [
      h('div', { class: 'driver-strip' },
        ic('auto', { size: 24 }),
        h('span', { class: 'list-row__body' },
          h('span', { class: 't-headline' }, t('m4.trip', { dest: destWord(trip.place) })),
          h('span', { class: 't-subhead t-mute' }, t('m3.tripSub', { driver: trip.driver.name, plate: trip.driver.plate })))),
      isBag ? h('h2', { class: 'section-label' }, t('m4.which')) : null,
      isBag
        ? choiceChips({
          label: t('m4.which'),
          value: which,
          options: [
            { value: 'big', label: t('m4.big') },
            { value: 'small', label: t('m4.small') },
            { value: 'else', label: t('m4.else') },
          ],
          onChange: (v) => {
            which = v;
          },
        })
        : null,
      h('div', { class: 'm4-field' }, field.el),
      h('p', { class: 't-subhead t-mute' }, isBag ? t('m4.note', { driver: trip.driver.name }) : t('m4.noteOther')),
    ],
    footer: [send],
  });
  return { el };
}

// ---------------------------------------------------------------- M5 · We're on it

export function M5() {
  const c = (rider().cases || [])[0] || { topic: 'bag', driver: 'santosh' };
  const isBag = c.topic === 'bag';
  const d = DRIVERS[c.driver] || DRIVERS.santosh;
  const sc = TRIP.supportCase;
  const topicLabel = isBag ? t('m4.title') : t((TOPICS.find((x) => x.id === c.topic) || TOPICS[5]).key);
  const steps = [
    { state: 'done', title: t('m5.s1'), sub: sc.reportedAt },
    { state: 'done', title: t('m5.s2', { handler: sc.handler }), sub: sc.takenAt },
    { state: 'current', title: isBag ? t('m5.s3', { driver: d.name }) : t('m5.s3Other'), sub: t('m5.progress') },
    { state: 'next', title: isBag ? t('m5.s4') : t('m5.s4Other') },
  ];

  const leave = (to) => {
    // A report filed straight from "All bags out?" ends that ride: file it in Trips
    if (booking().state === 'arrived') finishCurrentTrip();
    go(R(to), { replace: true, fade: true });
  };

  const { el } = screen({
    code: 'M5',
    label: t('m5.title'),
    className: 'm5',
    topbar: h('div', { class: 'topbar' }, h('button', { type: 'button', class: 'icon-btn', 'aria-label': t('m5.close'), onClick: () => leave('M3') }, ic('x'))),
    body: [
      stateIcon({ iconName: 'check', tone: 'case' }),
      h('h1', { class: 't-large screen__heading m5-head', tabindex: '-1' }, t('m5.title')),
      h('p', { class: 't-callout t-mute' }, t('m5.body', { handler: sc.handler })),
      h('section', { class: 'case-card' },
        h('h2', { class: 'section-label case-card__label' }, t('m5.case', { id: sc.id, topic: topicLabel })),
        h('ol', { class: 'steps-list' }, steps.map((s) =>
          h('li', { class: `steps-list__item${s.state === 'done' ? ' is-done' : ''}${s.state === 'current' ? ' is-current' : ''}`, 'aria-current': s.state === 'current' ? 'step' : null },
            h('span', { class: 'steps-list__mark', 'aria-hidden': 'true' }, s.state === 'done' ? ic('check', { size: 16, stroke: 3 }) : null),
            h('span', { class: 'list-row__body' }, h('span', { class: 'list-row__title' }, s.title), s.sub ? h('span', { class: 'list-row__sub' }, s.sub) : null))))),
    ],
    footer: [button({ label: t('m5.done'), onClick: () => leave(hasRide() ? 'B8' : 'B1') })],
  });
  return { el };
}

// ---------------------------------------------------------------- M6 · Profile

export function M6() {
  const rd = rider();
  const b = booking();
  const lang = LANGUAGES.find((l) => l.id === contentLang()) || LANGUAGES[0];
  const name = [rd.firstName || RIDER.firstName, rd.lastName].filter(Boolean).join(' ');
  const followSub = h('span', {});
  const syncFollow = (ids) => {
    followSub.textContent = ids.length ? names(ids) : t('m6.followNone');
  };

  syncFollow(rd.followers || ['mom']);
  const followRow = listRow({
    iconName: 'share',
    title: t('m6.follow'),
    sub: followSub, // updates in place after sharing
    chevron: true,
    onClick: () => openShare({ forProfile: true, onDone: syncFollow }),
  });

  const logout = () => dialog({
    title: t('m6.logoutTitle'),
    body: t('m6.logoutBody'),
    actions: [
      { label: t('m6.logoutNo') },
      { label: t('m6.logoutYes'), variant: 'secondary', onClick: () => {
        store.set('rider', { signedUp: false });
        go(R('A1'), { replace: true, fade: true });
      } },
    ],
  });

  const { el } = screen({
    code: 'M6',
    label: t('m6.title'),
    className: 'tab-screen m6',
    topbar: topBar({ title: t('m6.title') }),
    body: [
      h('div', { class: 'driver-strip profile-card' },
        ic('user', { size: 24 }),
        h('span', { class: 'list-row__body' },
          h('span', { class: 't-title2' }, name),
          h('span', { class: 't-subhead t-mute' }, fmt.phoneWithCode(rd.phone || RIDER.phone)))),
      h('div', { class: 'divided' },
        listRow({ iconName: 'home', title: t('m6.places'), sub: rd.home ? t('m6.placesSub') : t('m6.placesNone'), chevron: true, onClick: () => go(R(`A7b/${rd.home || 'chakala'}`)) }),
        followRow,
        listRow({ iconName: 'upi', title: t('m6.payment'), sub: t('m6.paymentSub', { upi: RIDER.upi }), chevron: true, onClick: () => soon(t('m6.payment')) }),
        listRow({ iconName: 'globe', title: t('m6.language'), sub: lang.native, chevron: true, onClick: () => go(R('A2')) }),
        listRow({ iconName: 'bag', title: t('m6.bags'), sub: t('m6.bagsSub', { big: b.big, small: b.small }), chevron: true, onClick: () => soon(t('m6.bags')) }),
        switchRow({
          iconName: 'user',
          title: t('m6.women'),
          sub: (on) => t(on ? 'm6.womenOn' : 'm6.womenOff'),
          checked: Boolean(rd.womenPool),
          onChange: (on) => store.set('rider', { womenPool: on }),
        }),
        listRow({ iconName: 'shield', title: t('m6.safety'), sub: t('m6.safetySub'), chevron: true, onClick: () => soon(t('m6.safety')) })),
      h('button', { type: 'button', class: 'quiet-link m6-logout', onClick: logout }, t('m6.logout')),
    ],
    tabbar: tabBar('profile', onTab),
  });
  return { el };
}
