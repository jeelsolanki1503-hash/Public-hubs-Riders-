// Rider · 6 Ways home, pooling and saved places: A7b, B3w, B3p, B3pn, B3pi,
// B3pw, and the X20 sheet (B4p, B3mi and X19 live with B3 / B4 in
// rider-booking.js). Each factory is named after its Figma frame code.

import {
  h, ic, screen, topBar, button, textField, radioGroup, segmented, chip, stateIcon, banner,
} from '../components.js';
import * as ill from '../illustrations.js';
import { toast, sheet } from '../overlays.js';
import { go, back } from '../router.js';
import { store } from '../store.js';
import { t } from '../i18n.js';
import * as fmt from '../format.js';
import { PLACES, POOL, CO_RIDERS, OTHER_WAYS, HOME_ADDRESS, RIDES } from '../data.js';
import { R } from './rider-onboarding.js';
import { flight, home, openLock } from './rider-booking.js';

const booking = () => store.booking();
const rider = () => store.rider();

// ---------------------------------------------------------------- A7b · Confirm your Home

export function A7b({ arg } = {}) {
  const place = PLACES.find((p) => p.id === arg) || PLACES.find((p) => p.id === rider().home) || PLACES[0];
  const fromProfile = rider().signedUp; // Profile → Saved places edits it and comes back
  const address = HOME_ADDRESS[place.id] || `${place.label}, ${place.line}`;
  let as = 'home';

  const flat = textField({
    label: t('a7b.flat'),
    value: place.id === rider().home ? rider().homeFlat : '',
    placeholder: t('a7b.flatPh'),
    autocapitalize: 'words',
  });

  const cta = button({ label: t('a7b.cta'), icon: 'home', onClick: save });
  const KINDS = [
    { value: 'home', icon: 'home', label: t('a7b.asHome'), cta: 'a7b.cta', title: 'a7b.title', done: 'a7b.saved' },
    { value: 'work', icon: 'work', label: t('a7b.asWork'), cta: 'a7b.ctaWork', title: 'a7b.titleWork', done: 'a7b.savedWork' },
    { value: 'other', icon: 'pin', label: t('a7b.asOther'), cta: 'a7b.ctaOther', title: 'a7b.titleOther', done: 'a7b.savedOther' },
  ];
  const chips = KINDS.map((k) =>
    h('button', { type: 'button', class: 'choice-chip choice-chip--icon', 'aria-checked': String(k.value === as), dataset: { value: k.value } }, ic(k.icon, { size: 18 }), k.label),
  );
  const chipRow = h('div', { class: 'chip-row', 'aria-label': t('a7b.saveAs') }, chips);
  const title = h('h1', { class: 't-title1 topbar__title screen__heading', tabindex: '-1' }, t('a7b.title'));
  radioGroup(chipRow, chips, (v) => {
    as = v;
    const k = KINDS.find((x) => x.value === v);
    cta.setLabel(t(k.cta));
    cta.querySelector('svg').outerHTML = ic(k.icon, { size: 20 }).outerHTML;
    title.textContent = t(k.title);
  });

  function leave() {
    if (fromProfile) back(R('M6'));
    else {
      store.set('rider', { signedUp: true });
      go(R('B1'));
    }
  }

  function save() {
    const k = KINDS.find((x) => x.value === as);
    if (as === 'home') store.set('rider', { home: place.id, homeFlat: flat.input.value.trim() });
    if (as === 'work') store.set('rider', { work: place.id });
    toast(t(k.done));
    leave();
  }

  const map = h('div', { class: 'a7b-map is-dropping', html: ill.areaMap(t('a7b.map', { place: place.label }), place.label) });

  const { el } = screen({
    code: 'A7b',
    label: t('a7b.title'),
    className: 'a7b',
    topbar: h('div', { class: 'topbar topbar--titled' },
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': t('common.back'), onClick: () => back(R('A7')) }, ic('back')),
      title,
      h('button', { type: 'button', class: 'topbar__action', onClick: leave }, t('a7b.skip'))),
    body: [
      map,
      h('div', { class: 'address-card' }, h('span', { class: 't-footnote t-mute' }, t('a7b.home')), h('span', { class: 't-headline' }, address)),
      flat.el,
      h('h2', { class: 'section-label' }, t('a7b.saveAs')),
      chipRow,
    ],
    footer: [cta],
  });
  return { el };
}

// ---------------------------------------------------------------- B3w · Other ways out of T2

export function B3w() {
  const cards = OTHER_WAYS.map((w) =>
    h('section', { class: 'way-card' },
      h('h2', { class: 'way-card__name' }, ic(w.icon, { size: 22 }), w.name),
      h('p', { class: 'way-card__line' }, ic('pin', { size: 16 }), w.where),
      h('p', { class: 'way-card__line' }, ic('clock', { size: 16 }), w.walk),
      h('p', { class: 'way-card__line' }, ic('wallet', { size: 16 }), w.fare)),
  );
  const { el } = screen({
    code: 'B3w',
    label: t('b3w.title'),
    className: 'b3w',
    topbar: topBar({ onBack: () => back(R('B3')), title: t('b3w.title') }),
    body: [h('p', { class: 't-subhead t-mute' }, t('b3w.sub')), ...cards],
  });
  return { el };
}

// ---------------------------------------------------------------- B3p / B3pn / B3pi · Pool with your flight

const TAB_CODES = { flight: 'B3p', point: 'B3pn', invite: 'B3pi' };

function riderRow({ name, sub, drop, you }) {
  return h('div', { class: 'co-rider' },
    h('span', { class: `avatar avatar--s${you ? ' avatar--you' : ''}`, 'aria-hidden': 'true' }, ic('user', { size: 22 })),
    h('span', { class: 'list-row__body' }, h('span', { class: 'list-row__title' }, name), h('span', { class: 'list-row__sub' }, sub)),
    chip(drop, 'neutral'));
}

function factsCard(rows) {
  return h('div', { class: 'facts' }, rows.map(([label, value], i) =>
    h('div', { class: `facts__row${i === 0 ? ' facts__row--lead' : ''}` }, h('span', {}, label), h('span', { class: 'facts__v' }, value))));
}

/** Join: mark the booking as this pool and lock it (B4p). */
function join(kind) {
  store.set('booking', { pool: kind, lockedFare: 0 });
  openLock();
}

function backToSolo() {
  store.set('booking', { pool: null, lockedFare: 0 });
  back(R('B3'));
}

function poolScreen(kind) {
  const f = flight();
  const homeArea = home().label;
  const tabs = segmented({
    label: t('b3p.tabs'),
    value: kind,
    options: [
      { value: 'flight', label: t('b3p.same') },
      { value: 'point', label: t('b3p.point') },
      { value: 'invite', label: t('b3p.invite') },
    ],
    onChange: (v) => {
      if (v !== kind) go(R(TAB_CODES[v]), { replace: true, fade: true });
    },
  });
  const fallback = h('div', { class: 'pickup-card' },
    ic('refresh', { size: 22 }),
    h('span', { class: 'list-row__body' }, h('span', { class: 't-headline' }, t('b3p.fallback')), h('span', { class: 't-subhead t-mute' }, t('b3p.fallbackSub'))));

  let body;
  let footer;
  if (kind === 'flight') {
    const p = POOL.flight;
    body = [
      h('h2', { class: 'section-label' }, t('b3p.coRiders', { no: f.no })),
      h('div', { class: 'co-riders' },
        riderRow({ name: CO_RIDERS[0].name, sub: `${CO_RIDERS[0].rating} · ${CO_RIDERS[0].area}`, drop: t('b3p.drop1') }),
        riderRow({ name: t('b3p.you'), sub: homeArea, drop: t('b3p.drop2'), you: true })),
      factsCard([
        [t('b3p.pay'), fmt.rupees(p.fare)],
        [t('b3p.save', { vs: p.saveVs }), fmt.rupees(p.save)],
        [t('b3p.extra'), t('b3p.min', { n: p.extraMin })],
        [t('b3p.order'), t('b3p.orderVal')],
      ]),
      fallback,
    ];
    footer = [button({ label: t('b3p.join', { amount: fmt.rupees(p.fare) }), onClick: () => join('flight') })];
  } else if (kind === 'point') {
    const p = POOL.point;
    body = [
      h('div', { class: 'pickup-card' },
        ic('flag', { size: 22 }),
        h('span', { class: 'list-row__body' },
          h('span', { class: 't-headline' }, t('b3pn.head', { point: p.point })),
          h('span', { class: 't-subhead t-mute' }, t('b3pn.headSub', { n: p.riders, no: f.no })))),
      factsCard([
        [t('b3p.pay'), fmt.rupees(p.fare)],
        [t('b3p.save', { vs: p.saveVs }), fmt.rupees(p.save)],
        [t('b3pn.lastMile'), t('b3pn.km', { n: p.lastMileKm })],
        [t('b3pn.leaves'), t('b3pn.leavesVal', { n: p.riders })],
      ]),
      banner({ tone: 'neutral', iconName: 'auto', text: t('b3pn.stand') }),
      fallback,
    ];
    footer = [button({ label: t('b3p.join', { amount: fmt.rupees(p.fare) }), onClick: () => join('point') })];
  } else {
    const p = POOL.invite;
    const shareInvite = async () => {
      const url = `${location.href.split('#')[0]}#/rider/B3pi`;
      try {
        if (navigator.share) {
          await navigator.share({ title: 'Fixride', text: t('b3pi.shareText'), url });
          toast(t('b3pi.shared'));
        } else {
          await navigator.clipboard.writeText(`${t('b3pi.shareText')} ${url}`);
          toast(t('b3pi.copied'));
        }
      } catch {
        toast(t('b3pi.copied'));
      }
      back(R('B3'));
    };
    body = [
      h('h2', { class: 't-title2 b3pi-head' }, t('b3pi.head')),
      h('p', { class: 't-callout t-mute' }, t('b3pi.sub')),
      factsCard([
        [t('b3pi.cab'), fmt.rupees(p.cab)],
        [t('b3pi.each'), fmt.rupees(p.each)],
        [t('b3pi.order'), t('b3pi.orderVal')],
      ]),
      banner({ tone: 'neutral', iconName: 'share', text: t('b3pi.how') }),
    ];
    footer = [button({ label: t('b3pi.cta'), icon: 'share', onClick: shareInvite })];
  }

  const { el } = screen({
    code: TAB_CODES[kind],
    label: t('b3p.title'),
    className: 'pool',
    topbar: topBar({ onBack: () => back(R('B3')), title: t('b3p.title') }),
    body: [tabs, ...body],
    footer: [...footer, h('button', { type: 'button', class: 'quiet-link quiet-link--center', onClick: backToSolo }, t('b3p.solo'))],
  });
  return { el };
}

export const B3p = () => poolScreen('flight');
export const B3pn = () => poolScreen('point');
export const B3pi = () => poolScreen('invite');

// ---------------------------------------------------------------- B3pw · Women-only pool

export function B3pw() {
  const f = flight();
  const p = POOL.women;
  const { el } = screen({
    code: 'B3pw',
    label: t('b3pw.title'),
    className: 'pool',
    topbar: topBar({ onBack: () => back(R('B3')), title: t('b3pw.title') }),
    body: [
      h('div', { class: 'pickup-card' }, ic('user', { size: 22 }), h('span', { class: 't-headline' }, t('b3pw.head'))),
      h('h2', { class: 'section-label' }, t('b3p.coRiders', { no: f.no })),
      h('div', { class: 'co-riders' },
        riderRow({ name: CO_RIDERS[0].name, sub: `${CO_RIDERS[0].rating} · ${CO_RIDERS[0].area}`, drop: t('b3p.drop1') }),
        riderRow({ name: CO_RIDERS[1].name, sub: `${CO_RIDERS[1].rating} · ${CO_RIDERS[1].area}`, drop: t('b3p.drop2') }),
        riderRow({ name: t('b3p.you'), sub: home().label, drop: t('b3p.drop3'), you: true })),
      factsCard([
        [t('b3p.pay'), fmt.rupees(p.fare)],
        [t('b3p.save', { vs: p.saveVs }), fmt.rupees(p.save)],
        [t('b3p.extra'), t('b3p.min', { n: p.extraMin })],
        [t('b3pw.driver'), t('b3pw.driverVal')],
      ]),
      h('p', { class: 't-footnote t-mute' }, t('b3pw.note')),
    ],
    footer: [
      button({ label: t('b3p.join', { amount: fmt.rupees(p.fare) }), onClick: () => join('women') }),
      h('button', { type: 'button', class: 'quiet-link quiet-link--center', onClick: backToSolo }, t('b3p.solo')),
    ],
  });
  return { el };
}

// ---------------------------------------------------------------- X20 · Pool didn't fill (sheet, no scrim close)

/** Shown on C3 for a pool booking: switch to a solo auto, same fare paid. */
export function poolDidntFill(onOk) {
  const b = booking();
  const paid = (POOL[b.pool] || POOL.flight).fare;
  const solo = RIDES[0].fare;
  const line = (label, value, strong) =>
    h('div', { class: `fare-row${strong ? ' fare-row--total' : ''}` }, h('span', {}, label), h('span', { class: 'fare-row__v' }, value));
  sheet({
    title: t('x20.title'),
    lead: stateIcon({ iconName: 'refresh', tone: 'home' }),
    scrimClose: false,
    content: [
      h('p', { class: 't-callout t-mute sheet__sub' }, t('x20.body', { no: b.flight || flight().no })),
      h('div', { class: 'fare-box' },
        line(t('x20.paid'), fmt.rupees(paid)),
        line(t('x20.solo'), fmt.rupees(solo)),
        line(t('x20.more'), fmt.rupees(0), true)),
    ],
    actions: [{ label: t('x20.ok'), onClick: () => {
      store.set('booking', { pool: null, ride: 'auto', lockedFare: paid });
      onOk && onOk();
    } }],
  });
}
