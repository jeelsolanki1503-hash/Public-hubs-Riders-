// Rider · 2 Landing to her door (first ride): C1–C9, sheets C5a and C8.
// Each factory is named after its Figma frame code.

import {
  h, ic, screen, topBar, button, iconTile, listRow, checkbox, chip, stateIcon,
  illustration, progressRing, banner,
} from '../components.js';
import * as ill from '../illustrations.js';
import { appIconSvg } from '../brand.js';
import { toast, sheet, dialog } from '../overlays.js';
import { go } from '../router.js';
import { store } from '../store.js';
import { t } from '../i18n.js';
import { countdown, after, timerBag } from '../clock.js';
import * as fmt from '../format.js';
import { BAY, DRIVERS, TRIP, NO_SHOW } from '../data.js';
import { R, soon, vibrate } from './rider-onboarding.js';
import { poolDidntFill } from './rider-pool.js';
import { ride, vehicle, names, firstName, fareOf, fee, destLabel, isHomeDest, dest } from './rider-booking.js';

const booking = () => store.booking();
/** The driver for this ride: Santosh, or Rakesh after a skip / cancel (X4b). */
const D = () => DRIVERS[booking().driver] || DRIVERS.santosh;
const drv = () => ({ driver: D().name });
const setState = (state) => store.set('booking', { state });

/** Values every C-screen string can use. */
function v(extra = {}) {
  const r = ride();
  return { ...drv(), vehicle: vehicle(r), bay: r.bay, level: r.level, plate: D().plate, min: BAY.walkMin, ...extra };
}

/**
 * File the ride that just ended in Trips (M1 / M2) and start a fresh booking.
 * Called from C9 (rated) and from M5 when a report ends the ride first.
 */
export function finishCurrentTrip(rating = null, tags = []) {
  const b = booking();
  const r = ride();
  store.finishTrip({
    flight: b.flight,
    ride: r.id,
    fare: fareOf(r),
    rating,
    tags,
    driver: D().id,
    dest: b.dest,
    big: b.big,
    small: b.small,
    bay: r.bay,
    level: r.level,
    start: TRIP.pickupAt,
    end: TRIP.reachBy,
    at: Date.now(),
  });
}

// ---------------------------------------------------------------- C1 · Landed: notification

export function C1() {
  const timers = timerBag();
  const note = h(
    'button',
    { type: 'button', class: 'push', 'aria-label': `${t('c1.open')}: ${t('c1.title', { name: firstName() })}`, onClick: () => go(R('C2')) },
    h('span', { class: 'push__head' },
      h('span', { class: 'push__icon', html: appIconSvg() }),
      h('span', { class: 'push__app' }, t('c1.app')),
      h('span', { class: 'push__time' }, t('c1.now'))),
    h('span', { class: 'push__title' }, t('c1.title', { name: firstName() })),
    h('span', { class: 'push__body' }, t('c1.body', v())),
  );
  const el = h(
    'main',
    { class: 'screen lock', 'aria-label': t('c1.title', { name: firstName() }), dataset: { code: 'C1' } },
    h('div', { class: 'lock__clock' },
      h('p', { class: 'lock__date' }, TRIP.landedDate),
      h('p', { class: 'lock__time' }, TRIP.landedTime)),
    h('div', { class: 'lock__stack' }, note),
  );
  return {
    el,
    chrome: 'dark',
    onMount() {
      // A fresh landing: Santosh is the matched driver and the one skip is unused
      store.set('booking', { state: 'landed', waitStartedAt: 0, driver: 'santosh', skipsLeft: 1 });
      // The notification arrives a beat after the screen lights up
      timers.add(after(500, () => {
        note.classList.add('is-in');
        vibrate([20, 60, 20]);
      }));
    },
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- C2 · Welcome to Mumbai

export function C2({ code } = {}) {
  const r = ride();
  const amenities = TRIP.amenities.map((a) =>
    h('div', { class: 'amenity' }, ic(a.icon, { size: 24 }), h('span', { class: 't-headline' }, a.label), h('span', { class: 't-footnote t-mute' }, a.where)),
  );
  const { el } = screen({
    code: 'C2',
    label: t('c2.title'),
    className: 'c2',
    topbar: topBar({ title: t('c2.title') }),
    body: [
      illustration(ill.belt(t('c2.illus'), booking().flight || 'AI 864'), { className: 'c2-belt' }),
      h('h2', { class: 't-large c2-head' }, t('c2.head')),
      h('p', { class: 't-callout t-mute' }, t('c2.body', v())),
      h('div', { class: 'pickup-card' },
        iconTile('pin', { tone: 'brand' }),
        h('span', { class: 'list-row__body' },
          h('span', { class: 't-headline' }, t('c2.pickup', v())),
          h('span', { class: 't-subhead t-mute' }, t('c2.pickupSub', v())))),
      h('h3', { class: 'section-label' }, t('c2.onTheWay')),
      h('div', { class: 'amenities' }, amenities),
    ],
    footer: [
      button({ label: t('c2.cta'), icon: 'bag', onClick: () => go(R('C3')) }),
      h('button', { type: 'button', class: 'quiet-link quiet-link--center', onClick: openBagsDelayed }, t('c2.delayed')),
    ],
  });
  return {
    el,
    onMount() {
      setState('landed');
      if (code === 'X2') openBagsDelayed();
    },
  };
}

// ---------------------------------------------------------------- X2 · Bags taking long (sheet)

function openBagsDelayed() {
  sheet({
    title: t('x2.title'),
    lead: stateIcon({ iconName: 'bag', tone: 'soft' }),
    content: [h('p', { class: 't-callout t-mute sheet__sub' }, t('x2.body', v()))],
    actions: [
      { label: t('x2.ok') },
      h('button', { type: 'button', class: 'quiet-link', onClick: () => go(R('M3')) }, t('x2.lost')),
    ],
  });
}

// ---------------------------------------------------------------- C3 · Finding your auto (⏱3 s → C4)

export function C3() {
  const timers = timerBag();
  const { el } = screen({
    code: 'C3',
    label: t('c3.title', v()),
    className: 'b5',
    body: [
      h(
        'div',
        { class: 'center-stack' },
        h('div', { class: 'pay-ring-wrap' }, progressRing(120), h('span', { class: 'pay-ring__icon' }, ic(ride().icon, { size: 32 }))),
        h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('c3.title', v())),
        h('p', { class: 't-callout t-mute' }, t('c3.body', v())),
      ),
    ],
    footer: [h('button', { type: 'button', class: 'quiet-link quiet-link--center quiet-link--faint', onClick: () => go(R('X5'), { replace: true }) }, t('c3.noAuto', v()))],
  });
  const find = () => timers.add(after(TRIP.timing.findingMs, () => {
    setState('matched');
    vibrate(30);
    go(R('C4'), { replace: true, fade: true });
  }));
  let alive = true;

  return {
    el,
    onMount() {
      // X20 · a pool that didn't fill switches to a solo auto, then the search goes on
      if (booking().pool) {
        timers.add(after(1200, () => poolDidntFill(() => alive && find())));
      } else find();
    },
    onUnmount() {
      alive = false;
      timers.clear();
    },
  };
}

// ---------------------------------------------------------------- C4 · Your driver

function followCard(className = '') {
  const ids = booking().sharedWith;
  if (!ids.length) return null;
  return h(
    'div',
    { class: `follow-row ${className}` },
    ic('share', { size: 24 }),
    h('span', { class: 'list-row__body' },
      h('span', { class: 'list-row__title' }, t('c4.follow', { names: names(ids) })),
      h('span', { class: 'list-row__sub' }, t(ids.length > 1 ? 'c4.followSubMany' : 'c4.followSub', drv()))),
    h('span', { class: 'follow-row__tick', 'aria-hidden': 'true' }, ic('check', { size: 16, stroke: 3 })),
  );
}

export function C4({ code } = {}) {
  // X4b · the new driver after a skip (X3) or a driver cancel (X4)
  if (code === 'X4b' && booking().driver !== 'rakesh') store.set('booking', { driver: 'rakesh', skipsLeft: 0 });
  const r = ride();
  const canSkip = booking().skipsLeft > 0;
  const { el } = screen({
    code: 'C4',
    label: t('c4.title'),
    topbar: topBar({ title: t('c4.title') }),
    className: 'c4',
    body: [
      h(
        'section',
        { class: 'driver-card' },
        h('div', { class: 'driver-card__who' },
          h('span', { class: 'avatar', 'aria-hidden': 'true' }, ic('user', { size: 28 })),
          h('div', { class: 'list-row__body' },
            h('span', { class: 't-title2 driver-card__name' }, D().name),
            h('span', { class: 'driver-card__stats' }, ic('star', { size: 16 }), t('c4.stats', { rating: D().rating, trips: fmt.count(D().trips) })))),
        h('div', { class: 'plate plate--wide', role: 'img', 'aria-label': `${D().plate}, ${D().vehicle}` },
          ic(r.icon, { size: 24 }),
          h('span', { class: 'plate__text' }, h('span', { class: 'plate__num' }, D().plate), h('span', { class: 'plate__sub' }, D().vehicle))),
      ),
      h('div', { class: 'record-card' },
        iconTile('doc', { tone: 'brand' }),
        h('span', { class: 'list-row__body' },
          h('span', { class: 't-headline' }, t('c4.register', { time: D().registerSince })),
          h('span', { class: 't-subhead record-card__sub' }, t('c4.registerSub', { cancels: D().cancels, refusals: D().refusals })))),
      h('h2', { class: 'section-label' }, t('c4.ridersSay')),
      h('div', { class: 'tag-row' }, D().ridersSay.map((s) => chip(s, 'neutral'))),
      followCard('c4-follow'),
    ],
    footer: [
      button({ label: t('c4.cta', drv()), onClick: () => {
        store.set('booking', { waitStartedAt: 0 }); // his free wait starts when she heads to the bay
        go(R('C5'));
      } }),
      canSkip
        ? h('button', { type: 'button', class: 'quiet-link quiet-link--center', onClick: askSkip }, t('c4.skip', v()))
        : h('button', { type: 'button', class: 'quiet-link quiet-link--center quiet-link--faint', 'aria-disabled': 'true', onClick: () => toast(t('x3.noSkipsToast'), { tone: 'info' }) }, t('x3.noSkips')),
    ],
  });
  return {
    el,
    onMount() {
      setState('matched');
      if (code === 'X3' && canSkip) askSkip();
      if (code === 'X4') driverCancelled();
    },
  };
}

/** Swap to the next auto in the queue (Rakesh) and show him (X4b). */
function nextDriver(patch = {}) {
  store.set('booking', { driver: 'rakesh', skipsLeft: 0, ...patch });
  go(R('X4b'), { replace: true, fade: true });
}

// ---------------------------------------------------------------- X3 · Skip this auto? (dialog)

function askSkip() {
  dialog({
    title: t('x3.title', drv()),
    body: t('x3.body', v({ amount: fmt.rupees(fareOf()) })),
    actions: [
      { label: t('x3.skip', v()), onClick: () => nextDriver() },
      { label: t('x3.keep', drv()), variant: 'secondary' },
    ],
  });
}

// ---------------------------------------------------------------- X4 · Driver cancelled (sheet, no scrim close)

function driverCancelled() {
  const r = ride();
  vibrate([30, 60, 30]);
  sheet({
    title: t('x4.title', drv()),
    lead: stateIcon({ iconName: 'refresh', tone: 'home' }),
    scrimClose: false,
    content: [
      h('p', { class: 't-callout t-mute sheet__sub' }, t('x4.body', v())),
      h('div', { class: 'divided' },
        listRow({ iconName: 'wallet', iconTone: 'success', title: t('x4.r1', { fee: fee(fareOf(r)) }), sub: t('x4.r1s') }),
        listRow({ iconName: 'lock', iconTone: 'brand', title: t('x4.r2', { amount: fmt.rupees(fareOf(r)) }), sub: t('x4.r2s') }),
        listRow({ iconName: 'doc', iconTone: 'brand', title: t('x4.r3'), sub: t('x4.r3s') })),
    ],
    actions: [{ label: t('x4.cta'), onClick: () => nextDriver() }],
  });
}

// ---------------------------------------------------------------- C5 · Walk to Bay 12

export function C5({ code } = {}) {
  const timers = timerBag();
  const r = ride();
  let warned = false;

  const clock = h('span', { class: 'bay-bar__time', role: 'timer', 'aria-live': 'off' }, fmt.mmss(TRIP.freeWaitSec));
  const sub = h('span', { class: 'bay-bar__sub' }, t('c5.free'));
  const title = h('span', { class: 'bay-bar__title' }, t('c5.atBay', v()));
  const announce = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  const bar = h(
    'div',
    { class: 'bay-bar' },
    h('span', { class: 'bay-bar__text' }, title, sub),
    clock,
  );

  const steps = TRIP.steps.map((s) => listRow({
    iconName: s.icon,
    title: s.title.replace('{bay}', r.bay),
    sub: s.sub.replace('{vehicle}', vehicle(r)).replace('{plate}', D().plate),
  }));

  const photoCard = h(
    'div',
    { class: 'photo-card' },
    h('figure', { class: 'photo-card__img', html: ill.autoAtBay(t('c5.photoSub', v()), D().plate, r.bay) }),
    h('span', { class: 'list-row__body' }, h('span', { class: 'list-row__title' }, t('c5.photo', drv())), h('span', { class: 'list-row__sub' }, t('c5.photoSub', v()))),
    h('button', { type: 'button', class: 'call-btn', 'aria-label': t('c5.call', drv()), onClick: () => toast(t('c5.calling', drv()), { tone: 'info' }) }, ic('phone', { size: 20 })),
  );

  // X6 · opened straight from the edge-case list: 3 paid minutes already gone
  if (code === 'X6') {
    const speed = store.settings().demoSpeed || 1;
    store.set('booking', { waitStartedAt: Date.now() - ((TRIP.freeWaitSec + 150) * 1000) / speed });
  }
  const warnLine = banner({ tone: 'neutral', iconName: 'alert', text: t('x6.warn', v({ time: NO_SHOW.deadline, fee: fee(fareOf(r)) })) });
  warnLine.hidden = true;

  function startWait() {
    if (!booking().waitStartedAt) store.set('booking', { waitStartedAt: Date.now() });
    const speed = store.settings().demoSpeed || 1;
    const gone = ((Date.now() - booking().waitStartedAt) / 1000) * speed;
    const left = Math.max(0, TRIP.freeWaitSec - gone);
    if (left <= 0) return paidWait(gone - TRIP.freeWaitSec);
    timers.add(countdown(left, (s) => {
      clock.textContent = fmt.mmss(s);
      if (s <= 60 && !warned) {
        warned = true;
        bar.classList.add('is-ending');
        announce.textContent = t('c5.oneMin');
        vibrate(40);
      }
    }, () => paidWait(0)));
  }

  /** X6 · Free wait is over: ₹1 a minute, and the ride ends at 10 minutes (X7). */
  function paidWait(overSec) {
    bar.classList.add('is-ending', 'is-paid');
    title.textContent = t('x6.over');
    sub.textContent = t('x6.overSub');
    warnLine.hidden = false;
    announce.textContent = t('c5.paid');
    vibrate([40, 60, 40]);
    const speed = store.settings().demoSpeed || 1;
    const limit = NO_SHOW.endAfterSec - TRIP.freeWaitSec;
    let over = overSec;
    const tick = () => {
      clock.textContent = fmt.rupees(Math.max(1, Math.ceil(over / 60)));
      if (over >= limit) {
        clearInterval(id);
        setState('noShow');
        go(R('X7'), { replace: true, fade: true });
      }
    };
    const id = setInterval(() => {
      over += 1 * speed;
      tick();
    }, 1000);
    timers.add(() => clearInterval(id));
    tick();
  }

  const { el } = screen({
    code: 'C5',
    label: t('c5.title', v()),
    className: 'c5',
    topbar: topBar({ title: t('c5.title', v()), action: { label: t('c5.cancel'), onClick: cancelAssigned } }),
    body: [bar, announce, warnLine, h('div', { class: 'divided' }, steps), photoCard],
    footer: [
      button({ label: t('c5.cta', v()), onClick: () => go(R('C6')) }),
      button({ label: t('c5.sendPhoto'), variant: 'tonal', icon: 'camera', onClick: () => openPhoto() }),
    ],
  });

  return {
    el,
    onMount() {
      setState('walking');
      startWait();
      if (code === 'C5a') openPhoto();
      if (code === 'X9') cancelAssigned();
    },
    onUnmount: () => timers.clear(),
  };
}

// ---------------------------------------------------------------- X9 · Cancel (driver assigned) (sheet)

function cancelAssigned() {
  const r = ride();
  const fare = fareOf(r);
  const feeAmt = Math.min(100, Math.round(fare * 0.1));
  const yes = button({
    label: t('x9.yes'),
    variant: 'secondary',
    onClick: () => {
      yes.setLoading(t('x9.cancelling'));
      after(700, () => {
        entry.close();
        store.newBooking();
        toast(t('x9.done'));
        go(R('B1'), { replace: true, fade: true });
      });
    },
  });
  const entry = sheet({
    title: t('x9.title'),
    content: [
      h('p', { class: 't-callout t-mute sheet__sub' }, t('x9.body', v())),
      h('div', { class: 'fare-box' },
        h('div', { class: 'fare-row' }, h('span', {}, t('x9.fee')), h('span', { class: 'fare-row__v' }, fmt.rupees(feeAmt))),
        h('div', { class: 'fare-row fare-row--strong' }, h('span', {}, t('x9.back')), h('span', { class: 'fare-row__v' }, fmt.rupees(fare - feeAmt)))),
      h('p', { class: 't-footnote t-mute' }, t('x9.rule')),
    ],
    actions: [{ label: t('x9.keep') }, yes],
  });
}

// ---------------------------------------------------------------- C5a · Send a photo (sheet)

function openPhoto() {
  const flash = h('span', { class: 'camera-mock__flash', 'aria-hidden': 'true' });
  const view = h(
    'div',
    { class: 'camera-mock', role: 'img', 'aria-label': t('c5a.camera') },
    h('span', { class: 'camera-mock__guide', 'aria-hidden': 'true' }),
    h('span', { class: 'camera-mock__label' }, ic('camera', { size: 28 }), h('span', {}, t('c5a.camera'))),
    flash,
  );
  const take = button({
    label: t('c5a.take'),
    icon: 'camera',
    onClick: () => {
      flash.classList.remove('is-firing');
      void flash.offsetWidth;
      flash.classList.add('is-firing');
      vibrate(15);
      take.setLoading(t('c5a.sending'));
      after(650, () => {
        entry.close();
        toast(t('c5a.sent', drv()));
      });
    },
  });
  const entry = sheet({
    title: t('c5a.title'),
    content: [view, h('p', { class: 't-subhead t-mute' }, t('c5a.note', drv()))],
    actions: [take],
  });
}

// ---------------------------------------------------------------- C6 · Meet at Bay 12 (⏱5 s → C7)

export function C6({ code } = {}) {
  const timers = timerBag();
  const b = booking();
  const loads = [];
  if (b.big) loads.push(b.big === 1 ? t('c6.bigBag') : t('c6.bigBags', { n: b.big }));
  if (b.small) loads.push(b.small === 1 ? t('c6.smallBag') : t('c6.smallBags', { n: b.small }));
  const bagChecks = loads.map((label) => {
    const row = h('button', { type: 'button', class: 'bag-check', role: 'checkbox', 'aria-checked': 'true' }, checkbox(true), h('span', {}, label));
    row.addEventListener('click', () => {
      const on = row.getAttribute('aria-checked') !== 'true';
      row.setAttribute('aria-checked', String(on));
      row.querySelector('.checkbox').classList.toggle('is-on', on);
    });
    return row;
  });

  const waiting = button({ label: t('c6.waiting', drv()), disabled: true });
  waiting.prepend(h('span', { class: 'spinner', 'aria-hidden': 'true' }));

  const { el } = screen({
    code: 'C6',
    label: t('c6.title', v()),
    className: 'c6',
    topbar: topBar({ title: t('c6.title', v()) }),
    body: [
      h('h2', { class: 'section-label' }, t('c6.findPlate')),
      h('div', { class: 'plate plate--big', role: 'img', 'aria-label': D().plate },
        h('span', { class: 'plate__num' }, D().plate),
        h('span', { class: 'plate__sub' }, t('c6.plateSub', { vehicleDesc: D().vehicle, ...drv() }))),
      h('h2', { class: 'section-label' }, t('c6.tellCode', drv())),
      h('div', { class: 'trip-code', role: 'img', 'aria-label': TRIP.code.split('').join(' ') }, TRIP.code.split('').map((d) => h('span', { class: 'trip-code__digit' }, d))),
      h('p', { class: 't-footnote t-mute c6-note' }, t('c6.codeNote')),
      h('h2', { class: 'section-label' }, t('c6.loadBags')),
      h('div', { class: 'bag-checks' }, bagChecks),
    ],
    footer: [
      waiting,
      h('button', { type: 'button', class: 'quiet-link quiet-link--center', onClick: () => notMine() }, t('c6.notMine', v())),
    ],
  });

  // ⏱5 s → C7, paused while "This isn't my auto" is open
  function startTimer() {
    timers.clear();
    timers.add(after(TRIP.timing.meetMs, () => {
      setState('onTrip');
      vibrate(30);
      toast(t('c6.started', drv()));
      go(R('C7'), { replace: true, fade: true });
    }));
  }

  let alive = true; // overlays closed by leaving the screen must not restart its clock
  function notMine() {
    timers.clear();
    wrongAuto(() => alive && startTimer());
  }

  return {
    el,
    onMount() {
      setState('atBay');
      if (code === 'X10') notMine();
      else startTimer();
    },
    onUnmount() {
      alive = false;
      timers.clear();
    },
  };
}

// ---------------------------------------------------------------- X10 · This isn't my auto (dialog)

function wrongAuto(onClose) {
  let toSos = false;
  const call = button({
    label: t('x10.call', drv()),
    icon: 'phone',
    size: 'm',
    onClick: () => {
      entry.close();
      toast(t('c5.calling', drv()), { tone: 'info' });
    },
  });
  const entry = dialog({
    title: t('x10.title'),
    body: t('x10.body', v({ colour: t('x10.colour') })),
    iconName: 'alert',
    iconTone: 'hero',
    actions: [
      call,
      { label: t('x10.help'), variant: 'secondary', onClick: () => {
        toSos = true;
        openSos(onClose);
      } },
    ],
    onClose: () => {
      // The dialog closes before "Get help" runs; only resume if SOS isn't next
      setTimeout(() => {
        if (!toSos && onClose) onClose();
      }, 0);
    },
  });
}

// ---------------------------------------------------------------- C7 · On the trip (⏱6 s → C8)

export function C7({ code } = {}) {
  const timers = timerBag();
  const r = ride();
  const etaV = h('span', { class: 'eta-badge__v' }, String(TRIP.etaMin));
  const ids = booking().sharedWith;

  const { el } = screen({
    code: 'C7',
    label: destLabel(),
    className: 'c7',
    hero: h('figure', { class: 'c7-map', html: ill.tripMap(t('c7.map', v()), t('c7.home')) }),
    body: [
      h('div', { class: 'sheet__grabber c7-grab', 'aria-hidden': 'true' }),
      h('div', { class: 'c7-row' },
        h('div', { class: 'list-row__body' },
          h('h1', { class: 't-title2 screen__heading c7-dest', tabindex: '-1' }, destLabel()),
          h('p', { class: 't-subhead t-mute' }, t('c7.reach', { time: TRIP.reachBy }))),
        h('div', { class: 'eta-badge', role: 'timer', 'aria-label': `${TRIP.etaMin} ${t('c7.min')}` }, etaV, h('span', { class: 'eta-badge__u' }, t('c7.min')))),
      h('div', { class: 'fare-card' },
        ic('lock', { size: 24 }),
        h('span', { class: 'list-row__body' },
          h('span', { class: 't-headline' }, t('c7.paid', { amount: fmt.rupees(fareOf(r)) })),
          h('span', { class: 't-subhead t-mute' }, t('c7.paidSub')))),
      h('div', { class: 'c7-pills' },
        h('button', { type: 'button', class: 'pill pill--sos', onClick: () => pauseFor(openSos) }, ic('sos', { size: 20 }), t('c7.sos')),
        h('button', { type: 'button', class: 'pill', onClick: () => pauseFor(extraMoney) }, ic('alert', { size: 20 }), t('c7.extra'))),
      ids.length ? h('p', { class: 'follow-line' }, ic('check', { size: 16, stroke: 2.5 }), t('c7.follow', { names: names(ids) })) : null,
    ],
  });

  // ⏱6 s → C8. SOS (X12) and extra money (X11) pause the trip clock while open.
  let eta = TRIP.etaMin;
  const stepMs = Math.round(TRIP.timing.tripMs / (TRIP.etaMin - 1));
  function run() {
    timers.clear();
    const id = setInterval(() => {
      if (eta <= 1) {
        clearInterval(id);
        etaV.textContent = '0';
        openBagsOut();
        return;
      }
      eta -= 1;
      etaV.textContent = String(eta);
    }, stepMs);
    timers.add(() => clearInterval(id));
  }
  let alive = true; // overlays closed by leaving the screen must not restart its clock
  function pauseFor(open) {
    timers.clear();
    el.querySelector('.trip-map').pauseAnimations?.();
    open(() => {
      if (!alive) return;
      el.querySelector('.trip-map').unpauseAnimations?.();
      run();
    });
  }

  return {
    el,
    onMount() {
      setState('onTrip');
      if (code === 'C8') {
        etaV.textContent = '0';
        openBagsOut();
      } else if (code === 'X11') pauseFor(extraMoney);
      else if (code === 'X12') pauseFor(openSos);
      else run();
    },
    onUnmount() {
      alive = false;
      timers.clear();
    },
  };
}

// ---------------------------------------------------------------- X11 · Driver asked for extra money (sheet)

function extraMoney(onClose) {
  let toSos = false;
  const amount = fmt.rupees(fareOf());
  sheet({
    title: t('x11.title'),
    lead: stateIcon({ iconName: 'check', tone: 'home' }),
    content: [
      h('p', { class: 't-callout t-mute sheet__sub' }, t('x11.body', { amount })),
      h('div', { class: 'divided' },
        listRow({ iconName: 'doc', iconTone: 'brand', title: t('x11.r1', drv()), sub: t('x11.r1s') }),
        listRow({ iconName: 'phone', iconTone: 'brand', title: t('x11.r2'), sub: t('x11.r2s', { amount }) })),
    ],
    actions: [
      { label: t('x11.ok') },
      { label: t('x11.unsafe'), variant: 'text', onClick: () => {
        toSos = true;
        openSos(onClose);
      } },
    ],
    onClose: () => {
      // The sheet closes before SOS opens; only resume the trip if SOS isn't next
      setTimeout(() => {
        if (!toSos && onClose) onClose();
      }, 0);
    },
  });
}

// ---------------------------------------------------------------- X12 · SOS (sheet)

export function openSos(onClose) {
  const ids = booking().sharedWith;
  const call = h('a', { class: 'btn btn--danger', href: 'tel:112' }, ic('phone', { size: 20 }), h('span', {}, t('x12.call')));
  const rows = [
    ids.length
      ? listRow({ iconName: 'share', iconTone: 'brand', title: t('x12.follow', { names: names(ids) }), sub: t('x12.followSub', v()), right: h('span', { class: 'follow-row__tick' }, ic('check', { size: 16, stroke: 3 })) })
      : listRow({ iconName: 'share', iconTone: 'brand', title: t('x12.share'), sub: t('x12.shareSub', v()), chevron: true, onClick: () => toast(t('c5a.sending'), { tone: 'info' }) }),
    listRow({ iconName: 'shield', iconTone: 'brand', title: t('x12.team'), sub: t('x12.teamSub'), chevron: true, onClick: () => toast(t('x12.teamCalling'), { tone: 'info' }) }),
  ];
  vibrate(30);
  sheet({
    title: t('x12.title'),
    className: 'sheet--sos',
    content: [call, h('div', { class: 'divided' }, rows)],
    actions: [{ label: t('x12.close'), variant: 'text' }],
    onClose,
  });
}

// ---------------------------------------------------------------- C8 · All bags out? (sheet, no scrim close)

function openBagsOut() {
  setState('arrived');
  vibrate([30, 50, 30]);
  const b = booking();
  const items = [
    ...Array.from({ length: b.big }, (_, i) => t('c8.big', { n: i + 1 })),
    ...Array.from({ length: b.small }, (_, i) => (b.small > 1 ? t('c8.smallN', { n: i + 1 }) : t('c8.small'))),
  ];
  const total = items.length;
  const cta = button({
    label: total === 1 ? t('c8.ctaOne') : t('c8.cta', { n: total }),
    onClick: (_, { disabled }) => {
      if (disabled) return;
      entry.close();
      go(R('C9'));
    },
  });
  const rows = items.map((label) => {
    const row = h('button', { type: 'button', class: 'bag-row', role: 'checkbox', 'aria-checked': 'true' }, checkbox(true), ic('bag', { size: 20 }), h('span', {}, label));
    row.addEventListener('click', () => {
      const on = row.getAttribute('aria-checked') !== 'true';
      row.setAttribute('aria-checked', String(on));
      row.querySelector('.checkbox').classList.toggle('is-on', on);
      cta.setDisabled(rows.some((x) => x.getAttribute('aria-checked') !== 'true'));
    });
    return row;
  });
  const entry = sheet({
    title: t('c8.title'),
    lead: stateIcon({ iconName: 'home', tone: 'home' }),
    scrimClose: false,
    content: [h('p', { class: 't-callout t-mute sheet__sub' }, t('c8.sub', drv())), h('div', { class: 'bag-rows' }, rows)],
    actions: [
      cta,
      h('button', { type: 'button', class: 'quiet-link', onClick: () => {
        entry.close();
        go(R('M4/bag'));
      } }, t('c8.inside')),
    ],
  });
}

// ---------------------------------------------------------------- C9 · Rate your ride

export function C9() {
  const r = ride();
  let stars = 4;
  const picked = new Set(['On time', 'Helped with bags']);

  const starBtns = [1, 2, 3, 4, 5].map((n) =>
    h('button', { type: 'button', class: 'star', 'aria-label': t('c9.star', { n }), dataset: { n } }, ic('star', { size: 36 })),
  );
  const starRow = h('div', { class: 'stars', role: 'radiogroup', 'aria-label': t('c9.stars', { n: stars }) }, starBtns);
  const paintStars = () => {
    starBtns.forEach((s, i) => {
      s.classList.toggle('is-on', i < stars);
      s.setAttribute('role', 'radio');
      s.setAttribute('aria-checked', String(i + 1 === stars));
    });
    starRow.setAttribute('aria-label', t('c9.stars', { n: stars }));
  };
  starBtns.forEach((s, i) =>
    s.addEventListener('click', () => {
      stars = i + 1;
      paintStars();
      s.classList.remove('is-pop');
      void s.offsetWidth;
      s.classList.add('is-pop');
    }),
  );
  paintStars();

  const tags = TRIP.rateTags.map((label) => {
    const tag = h('button', { type: 'button', class: 'tag-chip', 'aria-pressed': String(picked.has(label)) }, label);
    tag.addEventListener('click', () => {
      if (picked.has(label)) picked.delete(label);
      else picked.add(label);
      tag.setAttribute('aria-pressed', String(picked.has(label)));
    });
    return tag;
  });

  function done() {
    finishCurrentTrip(stars, [...picked]);
    toast(t('c9.thanks', drv()));
    go(R('B1'), { replace: true, fade: true });
  }

  const { el } = screen({
    code: 'C9',
    label: t('c9.title', drv()),
    className: 'c9',
    topbar: h('div', { class: 'topbar' }, h('button', { type: 'button', class: 'icon-btn', 'aria-label': t('c9.close'), onClick: done }, ic('x'))),
    body: [
      h('div', { class: 'c9-stack' },
        h('span', { class: 'avatar avatar--l', 'aria-hidden': 'true' }, ic('user', { size: 36 })),
        h('h1', { class: 't-title1 screen__heading', tabindex: '-1' }, t('c9.title', drv())),
        starRow,
        h('div', { class: 'tag-cloud' }, tags),
        h('p', { class: 't-subhead t-mute' }, t('c9.paid', { amount: fmt.rupees(fareOf(r)) }))),
    ],
    footer: [
      button({ label: t('c9.done'), onClick: done }),
      h('button', { type: 'button', class: 'quiet-link quiet-link--center', onClick: () => go(R('M3')) }, t('c9.report')),
    ],
  });
  return { el };
}
