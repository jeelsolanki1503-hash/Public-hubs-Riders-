// Entry: route table, initial route, theme, language, offline banner.

import { route, startRouter, refresh, go } from './router.js';
import { mountOverlays } from './overlays.js';
import { mountDevPanel } from './devpanel.js';
import { store, isOffline, hasRide } from './store.js';
import { t, contentLang } from './i18n.js';
import { banner } from './components.js';
import { chrome } from './icons.js';
import * as A from './screens/rider-onboarding.js';
import * as B from './screens/rider-booking.js';
import * as C from './screens/rider-trip.js';
import * as E from './screens/rider-edge.js';
import * as M from './screens/rider-tabs.js';
import * as W from './screens/rider-web.js';
import * as P from './screens/rider-pool.js';

const phone = document.querySelector('.phone');
const viewport = phone.querySelector('.viewport');

// Mock status bar glyphs
phone.querySelector('.statusbar__icons').innerHTML = chrome.signal + chrome.wifi + chrome.battery;

mountOverlays({
  phoneEl: phone,
  layerEl: phone.querySelector('.overlay-layer'),
  toastEl: phone.querySelector('.toast-region'),
  viewportEl: viewport,
});

// ---- Routes (frame code = route id). Overlay frames open over their screen. ----
route('/', A.Splash);
route('/rider/', A.Splash);
route('/rider/splash', A.Splash);
route('/rider/A1', A.A1);
route('/rider/A2', A.A2);
route('/rider/A3', A.A3);
route('/rider/A4', A.A4);
route('/rider/A5', A.A5);
route('/rider/A6', A.A5); // OS pop-up over A5
route('/rider/A7', A.A7);
route('/rider/B1', B.B1);
route('/rider/B2', B.B2);
route('/rider/B3', B.B3);
route('/rider/B3a', B.B3a);
route('/rider/B3b', B.B3); // sheet over B3
route('/rider/B4', B.B3); // sheet over B3
route('/rider/B4a', B.B3); // sheet over B3
route('/rider/B4b', B.B3); // sheet over B3
route('/rider/B5', B.B5);
route('/rider/B6', B.B6);
route('/rider/B7', B.B7);
route('/rider/B7a', B.B7); // sheet over B7
route('/rider/X8', B.B7); // dialog over B7
route('/rider/B8', B.B8);
route('/rider/C1', C.C1);
route('/rider/C2', C.C2);
route('/rider/C3', C.C3);
route('/rider/C4', C.C4);
route('/rider/C5', C.C5);
route('/rider/C5a', C.C5); // sheet over C5
route('/rider/C6', C.C6);
route('/rider/C7', C.C7);
route('/rider/C8', C.C7); // sheet over C7 (no scrim close)
route('/rider/C9', C.C9);
// Rider · 3 Edge cases — states and overlays of the screens they happen on
route('/rider/X0', E.X0);
route('/rider/X1', B.B7); // flight is late
route('/rider/X2', C.C2); // sheet over C2
route('/rider/X3', C.C4); // dialog over C4
route('/rider/X4', C.C4); // sheet over C4 (no scrim close)
route('/rider/X4b', C.C4); // C4 with the new driver
route('/rider/X5', E.X5);
route('/rider/X6', C.C5); // C5 after the free wait
route('/rider/X7', E.X7);
route('/rider/X9', C.C5); // sheet over C5
route('/rider/X10', C.C6); // dialog over C6
route('/rider/X11', C.C7); // sheet over C7
route('/rider/X12', C.C7); // sheet over C7
route('/rider/X13', B.B5); // dialog over B5
route('/rider/X14', A.A4); // A4 error state
route('/rider/X15', E.X15);
route('/rider/X16', B.B3); // B3 for a short trip
route('/rider/X17', E.X17);
route('/rider/X18', B.B8); // B8 offline
// Rider · 4 Trips, Help and Profile tabs
route('/rider/M1', M.M1);
route('/rider/M2', M.M2); // #/rider/M2/<trip index>
route('/rider/M3', M.M3);
route('/rider/M4', M.M4); // #/rider/M4/<topic>
route('/rider/M5', M.M5);
route('/rider/M6', M.M6);
// Rider · 5 No app: QR code or counter at the exit (web + WhatsApp)
route('/rider/W1', W.W1);
route('/rider/W2', W.W2);
route('/rider/W3', W.W3);
route('/rider/W4', W.W4);
// Rider · 6 Ways home, pooling and saved places
route('/rider/A7b', P.A7b); // #/rider/A7b/<place id>
route('/rider/B3w', P.B3w);
route('/rider/B3p', P.B3p);
route('/rider/B3pn', P.B3pn);
route('/rider/B3pi', P.B3pi);
route('/rider/B3pw', P.B3pw);
route('/rider/B3mi', B.B3); // sheet over B3 (X16)
route('/rider/X19', B.B3); // B3 with 3 big bags → "Ways home" sheet
route('/rider/X20', C.C3); // sheet over C3 for a pool booking

// ---- Theme, language, offline ----
function applySettings() {
  const s = store.settings();
  phone.dataset.theme = s.theme;
  const lang = contentLang();
  phone.setAttribute('lang', lang);
  document.documentElement.setAttribute('lang', lang);
}

function offlineBanner() {
  return banner({ tone: 'offline', iconName: 'wifioff', text: t(hasRide() ? 'common.offlineBooked' : 'common.offline') });
}

function renderOffline() {
  const slot = viewport.querySelector('.screen:last-child .offline-slot');
  if (!slot) return;
  slot.replaceChildren(...(isOffline() ? [offlineBanner()] : []));
}

let last = { ...store.settings() };
store.subscribe((state, branch) => {
  if (branch === 'reset') {
    applySettings();
    last = { ...state.settings };
    return;
  }
  if (branch !== 'settings') return;
  const s = state.settings;
  applySettings();
  if (s.lang !== last.lang) refresh();
  if (s.simulateOffline !== last.simulateOffline) renderOffline();
  last = { ...s };
});

window.addEventListener('online', renderOffline);
window.addEventListener('offline', renderOffline);

// ---- Device size: always 402 × 874 (iPhone 17 Pro); scale the whole frame to fit ----
const PHONE_W = 402;
const PHONE_H = 874;
function fitPhone() {
  if (window.innerWidth <= 520) {
    phone.style.zoom = '';
    phone.dataset.zoom = '1';
    return;
  }
  const panelBeside = window.innerWidth > 860;
  const availH = window.innerHeight - 48;
  const availW = window.innerWidth - 48 - (panelBeside ? 280 + 32 : 0);
  const s = Math.min(1, availH / (PHONE_H + 22), availW / (PHONE_W + 22));
  phone.style.zoom = s < 1 ? String(Math.round(s * 1000) / 1000) : '';
  phone.dataset.zoom = String(s < 1 ? s : 1);
}
window.addEventListener('resize', fitPhone);
fitPhone();

applySettings();
mountDevPanel(document.querySelector('.devpanel'), phone);

startRouter({
  viewportEl: viewport,
  onRender(view) {
    phone.dataset.chrome = view.chrome || '';
    const slot = view.el.querySelector('.offline-slot');
    if (slot && isOffline()) slot.append(offlineBanner());
  },
});

if (!location.hash) go('/', { replace: true });
