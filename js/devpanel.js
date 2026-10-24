// Prototype panel: outside the phone on desktop; on mobile it opens with a
// long-press on the status bar / top edge. Not part of the app UI.

import { store } from './store.js';
import { go, currentPath, refresh } from './router.js';
import { LANGUAGES } from './data.js';

const SCREENS = ['splash', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7',
  'B1', 'B2', 'B3', 'B3a', 'B3b', 'B4', 'B4a', 'B4b', 'B5', 'B6', 'B7', 'B7a', 'X8', 'B8',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C5a', 'C6', 'C7', 'C8', 'C9', 'X0',
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'W1', 'W2', 'W3', 'W4',
  'A7b', 'B3w', 'B3p', 'B3pn', 'B3pi', 'B3pw', 'B3mi'];

/** Booked-ride screens need a locked ride; give deep links one. */
const NEEDS_RIDE = ['B6', 'B7', 'B7a', 'X8', 'B8', 'C1', 'C2', 'C3', 'C4', 'C5', 'C5a', 'C6', 'C7', 'C8', 'C9'];

export function mountDevPanel(panel, phone) {
  panel.innerHTML = `
    <button type="button" class="devpanel__btn devpanel__close" data-act="close">Close</button>
    <h2>Prototype panel</h2>
    <p class="devpanel__hint">Fixride · Rider flow 1: sign up and lock a ride before landing. Not part of the app.</p>

    <div class="devpanel__group">
      <span class="devpanel__label">Flow starts</span>
      <div class="devpanel__row">
        <a class="devpanel__btn" href="#/rider/splash">Splash</a>
        <a class="devpanel__btn" href="#/rider/A1">Sign up (A1)</a>
        <a class="devpanel__btn" href="#/rider/B1" data-ride="0">Home (B1)</a>
        <a class="devpanel__btn" href="#/rider/C1" data-code="C1">Landing (C1)</a>
        <a class="devpanel__btn" href="#/rider/X0" data-code="X0">Edge cases (X0)</a>
        <a class="devpanel__btn" href="#/rider/M1" data-code="M1">Tabs (M1)</a>
        <a class="devpanel__btn" href="#/rider/W1" data-code="W1">No app (W1)</a>
      </div>
    </div>

    <div class="devpanel__group">
      <span class="devpanel__label">Screens</span>
      <div class="devpanel__links">
        ${SCREENS.map((c) => `<a class="devpanel__btn" href="#/rider/${c}" data-code="${c}">${c}</a>`).join('')}
      </div>
    </div>

    <div class="devpanel__group">
      <label class="devpanel__label" for="dp-lang">Language</label>
      <select id="dp-lang">
        ${LANGUAGES.map((l) => `<option value="${l.id}">${l.en} · ${l.native}</option>`).join('')}
      </select>
    </div>

    <div class="devpanel__group">
      <span class="devpanel__label">Theme</span>
      <div class="devpanel__row">
        <button type="button" class="devpanel__btn" data-theme-set="light">Light</button>
        <button type="button" class="devpanel__btn" data-theme-set="dark">Dark</button>
      </div>
    </div>

    <div class="devpanel__group">
      <span class="devpanel__label">Demo speed (free-wait timer)</span>
      <div class="devpanel__row">
        <button type="button" class="devpanel__btn" data-speed="1">1×</button>
        <button type="button" class="devpanel__btn" data-speed="10">10×</button>
      </div>
    </div>

    <div class="devpanel__group">
      <span class="devpanel__label">Network</span>
      <button type="button" class="devpanel__btn devpanel__btn--wide" data-act="offline">Simulate offline</button>
    </div>

    <div class="devpanel__group">
      <button type="button" class="devpanel__btn devpanel__btn--wide" data-act="reset">Reset all data</button>
      <p class="devpanel__hint">Clears the account, saved Home, ride and language, then replays the splash.</p>
    </div>
  `;

  const lang = panel.querySelector('#dp-lang');
  lang.addEventListener('change', () => store.set('settings', { lang: lang.value }));

  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button, a');
    if (!b) return;
    const code = b.dataset.code;
    if (code && NEEDS_RIDE.includes(code) && store.booking().state !== 'scheduled') {
      store.set('booking', { state: 'scheduled', flight: store.booking().flight || 'AI 864', paidAt: Date.now() });
    }
    if (b.dataset.ride === '0' || code === 'B1') {
      if (store.booking().state === 'scheduled') store.newBooking();
    }
    if (code && /^[BXM]/.test(code)) store.set('rider', { signedUp: true });
    // A fresh landing starts the free-wait clock again
    if (code && /^C/.test(code)) store.set('booking', { state: 'scheduled', waitStartedAt: 0 });
    if (b.dataset.speed) store.set('settings', { demoSpeed: Number(b.dataset.speed) });
    if (b.dataset.themeSet) store.set('settings', { theme: b.dataset.themeSet });
    if (b.dataset.act === 'offline') store.set('settings', { simulateOffline: !store.settings().simulateOffline });
    if (b.dataset.act === 'reset') {
      store.reset();
      if (currentPath() === '/rider/splash') refresh();
      else go('/rider/splash', { replace: true });
    }
    if (b.dataset.act === 'close' || b.tagName === 'A') panel.classList.remove('is-open');
  });

  function sync() {
    const s = store.settings();
    lang.value = s.lang;
    panel.querySelectorAll('[data-theme-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeSet === s.theme)));
    panel.querySelectorAll('[data-speed]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.speed) === s.demoSpeed)));
    panel.querySelector('[data-act="offline"]').setAttribute('aria-pressed', String(s.simulateOffline));
    const path = currentPath();
    panel.querySelectorAll('[data-code]').forEach((a) => {
      if (path === `/rider/${a.dataset.code}`) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  store.subscribe(sync);
  window.addEventListener('hashchange', sync);
  sync();

  // Mobile: long-press the top edge of the phone to open the panel
  let timer = null;
  const start = (e) => {
    if (!e.target.closest('.statusbar, .topbar')) return;
    if (e.target.closest('button, a, input')) return;
    timer = setTimeout(() => panel.classList.add('is-open'), 600);
  };
  const cancel = () => clearTimeout(timer);
  phone.addEventListener('pointerdown', start);
  phone.addEventListener('pointerup', cancel);
  phone.addEventListener('pointerleave', cancel);
  phone.addEventListener('pointercancel', cancel);
}
