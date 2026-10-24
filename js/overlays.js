// Sheet, dialog, OS pop-up, toast. All live in the phone's overlay layer,
// trap focus while open, and make the screen underneath inert.

import { icon } from './icons.js';

let layer = null;
let toastRegion = null;
let phone = null;
let viewport = null;
const stack = [];

export function mountOverlays({ phoneEl, layerEl, toastEl, viewportEl }) {
  phone = phoneEl;
  layer = layerEl;
  toastRegion = toastEl;
  viewport = viewportEl;
  document.addEventListener('keydown', onKey);
}

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

function btn(cls, label, onClick) {
  const b = el('button', cls);
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function onKey(e) {
  const top = stack[stack.length - 1];
  if (!top) return;
  if (e.key === 'Escape' && top.escClose) {
    e.preventDefault();
    top.close();
  } else if (e.key === 'Tab') {
    const f = [...top.node.querySelectorAll(FOCUSABLE)];
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function open(node, { escClose, scrimClose, onClose, chrome, leaveTarget }) {
  const returnFocus = document.activeElement;
  layer.append(node);
  viewport.inert = true;
  const prevChrome = phone.dataset.chrome || '';
  if (chrome) phone.dataset.chrome = chrome;

  let closed = false;
  const entry = {
    node,
    escClose,
    close(result) {
      if (closed) return;
      closed = true;
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      node.classList.add('is-leaving');
      (leaveTarget ? leaveTarget(node) : node).classList.add('is-leaving');
      setTimeout(() => node.remove(), 200);
      if (!stack.length) {
        viewport.inert = false;
        phone.dataset.chrome = prevChrome;
      }
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
      onClose && onClose(result);
    },
  };
  stack.push(entry);
  if (scrimClose) {
    node.addEventListener('click', (e) => {
      if (e.target === node) entry.close();
    });
  }
  requestAnimationFrame(() => {
    const f = node.querySelector(FOCUSABLE);
    if (f) f.focus({ preventScroll: true });
  });
  return entry;
}

export function closeAllOverlays() {
  [...stack].reverse().forEach((o) => o.close());
}

/**
 * The phone's own permission alert. Never dismissed by the scrim.
 * buttons: [{ label, onClick }]
 */
export function osAlert({ title, message, buttons }) {
  const scrim = el('div', 'scrim scrim--center');
  const box = el('div', 'os-alert');
  box.setAttribute('role', 'alertdialog');
  box.setAttribute('aria-modal', 'true');
  const titleId = `os-${Date.now()}`;
  box.setAttribute('aria-labelledby', titleId);
  const text = el('div', 'os-alert__text');
  const h = el('h2', 'os-alert__title');
  h.id = titleId;
  h.textContent = title;
  const p = el('p', 'os-alert__msg');
  p.textContent = message;
  text.append(h, p);
  box.append(text);
  const entry = open(scrim, { escClose: false, scrimClose: false, chrome: 'scrim' });
  buttons.forEach((b) =>
    box.append(
      btn(`os-alert__btn${b.bold ? ' os-alert__btn--bold' : ''}`, b.label, () => {
        entry.close();
        b.onClick && b.onClick();
      }),
    ),
  );
  scrim.append(box);
  return entry;
}

/**
 * Dialog — decisions that cost money or can't be undone. Never closes on scrim.
 * actions: [{ label, variant: 'primary' | 'secondary' | 'danger', onClick }]
 */
export function dialog({ title, body, iconName, iconTone = 'hero', actions, onClose }) {
  const scrim = el('div', 'scrim scrim--center');
  const box = el('div', 'dialog');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  if (iconName) box.append(el('div', `state-icon state-icon--dialog state-icon--${iconTone}`, icon(iconName, { size: 28 })));
  const h = el('h2', 't-title1');
  h.textContent = title;
  h.id = `dlg-${Date.now()}`;
  box.setAttribute('aria-labelledby', h.id);
  box.append(h);
  if (body) {
    const p = el('p', 't-callout t-mute');
    p.textContent = body;
    box.append(p);
  }
  const row = el('div', 'dialog__actions');
  box.append(row);
  scrim.append(box);
  const entry = open(scrim, { escClose: false, scrimClose: false, onClose });
  actions.forEach((a) =>
    row.append(
      a instanceof Node ? a : btn(`btn btn--${a.variant || 'primary'} btn--m`, a.label, () => {
        entry.close();
        a.onClick && a.onClick();
      }),
    ),
  );
  return entry;
}

/**
 * Bottom sheet — choices and details. Scrim tap, Escape and drag-down close it
 * unless scrimClose is false ("no scrim close" sheets).
 * content: Node[]; actions: [{ label, variant, onClick }]
 */
export function sheet({ title, lead, content = [], actions = [], scrimClose = true, onClose, className = '' }) {
  const scrim = el('div', 'scrim');
  const panel = el('section', `sheet ${className}`);
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  const grab = el('div', 'sheet__grab-area', '<div class="sheet__grabber" aria-hidden="true"></div>');
  const body = el('div', 'sheet__body');
  const h = el('h2', 't-title1');
  h.textContent = title;
  h.id = `sheet-${Date.now()}`;
  panel.setAttribute('aria-labelledby', h.id);
  if (lead) body.append(lead); // e.g. a state icon above the title (C8)
  body.append(h, ...content);
  const foot = el('div', 'sheet__footer');
  panel.append(grab, body, foot);
  scrim.append(panel);
  const entry = open(scrim, { escClose: scrimClose, scrimClose, onClose, leaveTarget: () => panel });
  // An action is either { label, variant, onClick } (closes the sheet) or a
  // ready-made Node (a loading button, fine print) that manages itself.
  actions.forEach((a) =>
    foot.append(
      a instanceof Node
        ? a
        : btn(`btn btn--${a.variant || 'primary'}`, a.label, () => {
          entry.close();
          a.onClick && a.onClick();
        }),
    ),
  );
  if (!actions.length) foot.remove();

  if (scrimClose) {
    let startY = null;
    grab.addEventListener('pointerdown', (e) => {
      startY = e.clientY;
      grab.setPointerCapture(e.pointerId);
    });
    grab.addEventListener('pointermove', (e) => {
      if (startY === null) return;
      const dy = Math.max(0, e.clientY - startY);
      panel.style.setProperty('--drag-y', `${dy}px`);
      panel.style.transform = `translateY(${dy}px)`;
    });
    grab.addEventListener('pointerup', (e) => {
      const dy = e.clientY - startY;
      startY = null;
      if (dy > 80) entry.close();
      else panel.style.transform = '';
    });
  }
  return entry;
}

/**
 * Toast — slides up 16px above the main button, auto-dismisses in ~3 s.
 * Never carries money or safety info.
 */
export function toast(message, { tone = 'success', action } = {}) {
  if (!toastRegion) return;
  positionToasts();
  const n = el('div', `toast toast--${tone}`);
  n.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  n.innerHTML = icon({ error: 'alert', info: 'info' }[tone] || 'check', { size: 20 });
  const msg = el('span', 'toast__msg');
  msg.textContent = message;
  n.append(msg);
  if (action) {
    n.append(
      btn('toast__action', action.label, () => {
        action.onClick();
        dismiss();
      }),
    );
  }
  toastRegion.append(n);
  const timer = setTimeout(dismiss, 3000);
  function dismiss() {
    clearTimeout(timer);
    n.classList.add('is-leaving');
    setTimeout(() => n.remove(), 200);
  }
  return dismiss;
}

/** Keep toasts 16px above whatever sits at the bottom of the current screen. */
function positionToasts() {
  const current = viewport && viewport.querySelector('.screen:last-child');
  if (!current || !phone) return;
  const footer = current.querySelector('.screen__footer, .keypad, .camera__deck');
  const phoneRect = phone.getBoundingClientRect();
  // Rects are in screen px; the phone may be zoomed to fit the window
  const scale = phoneRect.height / (phone.offsetHeight || phoneRect.height) || 1;
  const bottom = footer ? (phoneRect.bottom - footer.getBoundingClientRect().top) / scale + 16 - 12 : 120;
  phone.style.setProperty('--toast-bottom', `${Math.max(bottom, 60)}px`);
}
