// DOM builders for every reusable UI piece. Each has a matching block in
// components.css. Screens only compose these.

import { icon, chrome } from './icons.js';
import { t } from './i18n.js';
import { lockup } from './brand.js';

// ---------- tiny hyperscript ----------

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === undefined || c === null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

/** An element whose only content is a design-system icon. */
export function ic(name, opts) {
  const span = document.createElement('span');
  span.innerHTML = icon(name, opts);
  return span.firstElementChild;
}

let uid = 0;
export const nextId = (p = 'id') => `${p}-${++uid}`;

// ---------- Screen scaffold ----------

/**
 * @param {object} o
 * @param {string} o.code  Figma frame code (A1…)
 */
export function screen({ code, label, topbar, hero, body = [], footer = [], keypad, tabbar, className = '' }) {
  const bodyEl = h('div', { class: 'screen__body' }, body);
  const footerEl = footer.filter(Boolean).length
    ? h('div', { class: `screen__footer${keypad || tabbar ? ' screen__footer--above-kbd' : ''}` }, footer)
    : null;
  const el = h(
    'main',
    { class: `screen ${className}`, 'aria-label': label, dataset: { code } },
    topbar,
    h('div', { class: 'offline-slot', 'aria-live': 'polite' }),
    hero,
    bodyEl,
    footerEl,
    keypad,
    tabbar,
  );
  return { el, body: bodyEl, footer: footerEl };
}

/** Large title + sub copy at the top of content. Title gets focus on arrival. */
export function pageHead(title, sub) {
  return h(
    'header',
    { class: 'page-head' },
    h('h1', { class: 't-large screen__heading', tabindex: '-1' }, title),
    sub ? h('p', { class: 't-callout page-head__sub' }, sub) : null,
  );
}

// ---------- Top bar ----------

/**
 * Top bar · Title | Back | Back + title | Back + action | Brand.
 * title renders as the screen heading (Title 1) next to the back arrow.
 */
export function topBar({ onBack, title, action, chip, brandMark } = {}) {
  const start = onBack
    ? iconButton({ icon: 'back', label: t('common.back'), onClick: onBack })
    : brandMark && !title ? brand() : null;
  const heading = title ? h('h1', { class: 't-title1 topbar__title screen__heading', tabindex: '-1' }, title) : null;
  const end = action
    ? h('button', { type: 'button', class: 'topbar__action', onClick: action.onClick }, action.label)
    : chip || (brandMark && title ? brand() : null);
  return h(
    'div',
    { class: `topbar${onBack ? '' : ' topbar--plain'}${title ? ' topbar--titled' : ''}` },
    start,
    heading || h('span', { class: 'topbar__spacer' }),
    end,
  );
}

export function iconButton({ icon: name, label, onClick, pressed, className = '' }) {
  return h(
    'button',
    { type: 'button', class: `icon-btn ${className}`, 'aria-label': label, 'aria-pressed': pressed, onClick },
    ic(name),
  );
}

// ---------- Buttons ----------

/**
 * Button · Type: primary | secondary | tonal | danger | text · Size: l | m | s
 * Returns the element with .setDisabled(bool) and .setLoading(labelOrFalse).
 */
export function button({ label, variant = 'primary', size = 'l', icon: iconName, onClick, disabled = false, describedBy }) {
  const labelEl = h('span', {}, label);
  const iconEl = iconName ? ic(iconName, { size: 20 }) : null;
  const el = h(
    'button',
    {
      type: 'button',
      class: `btn btn--${variant}${size !== 'l' ? ` btn--${size}` : ''}`,
      'aria-describedby': describedBy,
    },
    iconEl,
    labelEl,
  );
  let isDisabled = disabled;
  let isLoading = false;
  const sync = () => {
    if (isDisabled) el.setAttribute('aria-disabled', 'true');
    else el.removeAttribute('aria-disabled');
    el.setAttribute('aria-busy', String(isLoading));
  };
  el.addEventListener('click', (e) => {
    if (isLoading) return;
    if (onClick) onClick(e, { disabled: isDisabled });
  });
  el.setDisabled = (v) => {
    isDisabled = v;
    sync();
  };
  el.setLoading = (text) => {
    isLoading = Boolean(text);
    el.replaceChildren(...(isLoading ? [h('span', { class: 'spinner' }), h('span', {}, text)] : [iconEl, labelEl].filter(Boolean)));
    sync();
  };
  el.setLabel = (text) => {
    labelEl.textContent = text;
  };
  sync();
  return el;
}

export function textLink({ label, onClick, href, disabled }) {
  if (href) return h('a', { class: 'text-link', href }, label);
  return h('button', { type: 'button', class: 'text-link', 'aria-disabled': disabled ? 'true' : null, onClick }, label);
}

// ---------- Text field ----------

/**
 * Text field · State: Empty | Focused | Filled | Error | Disabled | Success
 * Returns { el, input, setError, setSuccess, clear }.
 */
export function textField({
  label, value = '', placeholder, help = '', inputmode, type = 'text', autocomplete,
  prefix, lead, trail, maxLength, onInput, onBlur, autocapitalize, spellcheck, readOnlyKeyboard, clearable, ariaLabel,
}) {
  const id = nextId('f');
  const helpId = `${id}-help`;
  const input = h('input', {
    id,
    class: 'field__input',
    type,
    value,
    placeholder,
    inputmode: readOnlyKeyboard ? 'none' : inputmode,
    autocomplete,
    autocapitalize,
    spellcheck: spellcheck === false ? 'false' : null,
    maxlength: maxLength,
    'aria-label': ariaLabel,
    'aria-describedby': helpId,
  });
  input.value = value;
  const helpEl = h('p', { class: 'field__help', id: helpId, 'aria-live': 'polite' }, help);
  const clearBtn = clearable
    ? h('button', { type: 'button', class: 'field__trail', 'aria-label': t('common.clear'), onClick: () => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus({ preventScroll: true });
    } }, ic('x', { size: 20 }))
    : null;
  const control = h(
    'div',
    { class: `field__control${lead ? ' field__control--lead' : ''}` },
    lead ? h('span', { class: 'field__lead', 'aria-hidden': 'true' }, ic(lead, { size: 20 })) : null,
    prefix ? h('span', { class: 'field__prefix', 'aria-hidden': 'true' }, prefix) : null,
    input,
    trail || clearBtn,
  );
  const el = h('div', { class: 'field' }, label ? h('label', { class: 'field__label', for: id }, label) : null, control, helpEl);
  const syncClear = () => {
    if (clearBtn) clearBtn.hidden = !input.value;
  };
  syncClear();

  const api = {
    el,
    input,
    control,
    setError(msg) {
      el.classList.remove('field--success');
      el.classList.remove('field--error');
      void el.offsetWidth; // restart the shake
      el.classList.add('field--error');
      input.setAttribute('aria-invalid', 'true');
      helpEl.replaceChildren(ic('alert', { size: 16 }), h('span', {}, msg));
    },
    setSuccess(msg) {
      el.classList.remove('field--error');
      el.classList.add('field--success');
      input.removeAttribute('aria-invalid');
      helpEl.replaceChildren(ic('check', { size: 16 }), h('span', {}, msg));
    },
    clear() {
      el.classList.remove('field--error', 'field--success');
      input.removeAttribute('aria-invalid');
      helpEl.replaceChildren(help);
    },
  };
  input.addEventListener('input', (e) => {
    if (el.classList.contains('field--error')) api.clear();
    syncClear();
    onInput && onInput(e, api);
  });
  if (onBlur) input.addEventListener('blur', (e) => onBlur(e, api));
  return api;
}

// ---------- Code boxes ----------

/**
 * Code boxes (4 or 6) · State: Empty | Typing | Error | Success | Locked
 * Auto-advance per digit, Backspace goes back, paste fills all.
 */
export function codeBoxes({ length = 6, label, onComplete, onChange }) {
  const inputs = Array.from({ length }, (_, i) =>
    h('input', {
      class: 'code-box',
      type: 'text',
      inputmode: 'none',
      autocomplete: i === 0 ? 'one-time-code' : 'off',
      maxlength: '1',
      'aria-label': t('code.digit', { n: i + 1 }),
    }),
  );
  const el = h('div', { class: 'code-boxes', role: 'group', 'aria-label': label }, inputs);
  let locked = false;

  const value = () => inputs.map((x) => x.value).join('');
  const firstEmpty = () => inputs.find((x) => !x.value) || inputs[length - 1];
  const changed = () => {
    inputs.forEach((x) => x.classList.toggle('is-filled', Boolean(x.value)));
    onChange && onChange(value());
    if (value().length === length) onComplete && onComplete(value());
  };

  const api = {
    el,
    inputs,
    value,
    focus() {
      if (!locked) firstEmpty().focus({ preventScroll: true });
    },
    setState(state) {
      el.classList.remove('code-boxes--error', 'code-boxes--success', 'code-boxes--locked');
      void el.offsetWidth;
      if (state) el.classList.add(`code-boxes--${state}`);
      locked = state === 'locked' || state === 'success';
      inputs.forEach((x) => (x.disabled = locked));
    },
    clear() {
      inputs.forEach((x) => (x.value = ''));
      changed();
    },
    /** Type one digit into the first empty box (keypad / SMS autofill). */
    type(d) {
      if (locked) return;
      if (el.classList.contains('code-boxes--error')) {
        api.setState(null);
        inputs.forEach((x) => (x.value = ''));
      }
      const box = inputs.find((x) => !x.value);
      if (!box) return;
      box.value = d;
      box.classList.remove('is-new');
      void box.offsetWidth;
      box.classList.add('is-new');
      const next = inputs[inputs.indexOf(box) + 1];
      (next || box).focus({ preventScroll: true });
      changed();
    },
    backspace() {
      if (locked) return;
      if (el.classList.contains('code-boxes--error')) api.setState(null);
      const filled = inputs.filter((x) => x.value);
      const last = filled[filled.length - 1];
      if (!last) return;
      last.value = '';
      last.focus({ preventScroll: true });
      changed();
    },
    fill(str) {
      const d = String(str).replace(/\D/g, '').slice(0, length);
      inputs.forEach((x, i) => (x.value = d[i] || ''));
      firstEmpty().focus({ preventScroll: true });
      changed();
    },
  };

  inputs.forEach((box, i) => {
    box.addEventListener('focus', () => {
      // Always type into the first empty box, like an OTP field
      const target = firstEmpty();
      if (target !== box && !box.value) target.focus({ preventScroll: true });
    });
    box.addEventListener('input', () => {
      const d = box.value.replace(/\D/g, '');
      box.value = d.slice(-1);
      if (d.length > 1) {
        api.fill(value().slice(0, i) + d);
        return;
      }
      if (box.value && inputs[i + 1]) inputs[i + 1].focus({ preventScroll: true });
      changed();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        api.backspace();
      } else if (/^\d$/.test(e.key)) {
        e.preventDefault();
        api.type(e.key);
      }
    });
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      api.fill(text);
    });
  });
  return api;
}

// ---------- Numeric keypad (mock) ----------

const KEYS = [
  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
];

export function keypad({ onDigit, onDelete }) {
  const key = (digit, letters) =>
    h(
      'button',
      { type: 'button', class: 'keypad__key', 'aria-label': digit, tabindex: '-1', onClick: () => onDigit(digit) },
      h('span', { class: 'keypad__digit' }, digit),
      letters ? h('span', { class: 'keypad__letters', 'aria-hidden': 'true' }, letters) : null,
    );
  const del = h('button', { type: 'button', class: 'keypad__key keypad__key--fn', 'aria-label': 'Delete', tabindex: '-1', onClick: onDelete });
  del.innerHTML = chrome.backspace;
  const pad = h(
    'div',
    { class: 'keypad', 'aria-hidden': 'true' },
    KEYS.map(([d, l]) => key(d, l)),
    h('span', { class: 'keypad__key keypad__key--blank' }),
    key('0', ''),
    del,
  );
  // Like the phone's own keyboard, tapping a key never takes focus from the field
  pad.addEventListener('mousedown', (e) => e.preventDefault());
  pad.addEventListener('pointerdown', (e) => e.preventDefault());
  return pad;
}

// ---------- Selection ----------

/**
 * Wires arrow-key navigation + roving tabindex for a role="radiogroup".
 * Each radio must have role="radio" and aria-checked.
 */
export function radioGroup(groupEl, radios, onSelect) {
  groupEl.setAttribute('role', 'radiogroup');
  const select = (r, focus) => {
    if (r.getAttribute('aria-disabled') === 'true') return;
    radios.forEach((x) => {
      x.setAttribute('aria-checked', String(x === r));
      x.tabIndex = x === r ? 0 : -1;
    });
    if (focus) r.focus();
    onSelect && onSelect(r.dataset.value);
  };
  radios.forEach((r, i) => {
    r.setAttribute('role', 'radio');
    r.tabIndex = r.getAttribute('aria-checked') === 'true' ? 0 : -1;
    r.addEventListener('click', () => select(r));
    r.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (dir) {
        e.preventDefault();
        select(radios[(i + dir + radios.length) % radios.length], true);
      }
    });
  });
  if (!radios.some((r) => r.tabIndex === 0) && radios[0]) radios[0].tabIndex = 0;
  return groupEl;
}

/** Language tile · full-width row: native name, English name, round tick. */
export function langTile({ lang, checked }) {
  return h(
    'button',
    { type: 'button', class: 'lang-tile', 'aria-checked': String(checked), dataset: { value: lang.id } },
    h('span', { class: 'lang-tile__native', lang: lang.id }, lang.native),
    lang.id !== 'en' ? h('span', { class: 'lang-tile__en' }, lang.en) : null,
    h('span', { class: 'lang-tile__mark', 'aria-hidden': 'true' }, ic('check', { size: 16, stroke: 3 })),
  );
}

/** Checkbox (role="checkbox"). The whole row is the tap area. */
export function checkbox(checked) {
  return h('span', { class: `checkbox${checked ? ' is-on' : ''}`, 'aria-hidden': 'true' }, ic('check', { size: 16, stroke: 3 }));
}

/** Segmented control (B3p tabs: Same flight · To a point · Invite). */
export function segmented({ label, options, value, onChange }) {
  const opts = options.map((o) =>
    h('button', { type: 'button', class: 'segmented__opt', 'aria-checked': String(o.value === value), dataset: { value: o.value } }, o.label),
  );
  const el = h('div', { class: 'segmented', 'aria-label': label }, opts);
  radioGroup(el, opts, onChange);
  return el;
}

/** Choice chip (radio-style pill): WhatsApp · SMS · Copy link. */
export function choiceChips({ label, options, value, onChange }) {
  const chips = options.map((o) =>
    h('button', { type: 'button', class: 'choice-chip', 'aria-checked': String(o.value === value), dataset: { value: o.value } }, o.label),
  );
  const el = h('div', { class: 'choice-chips', 'aria-label': label }, chips);
  radioGroup(el, chips, onChange);
  return el;
}

/** Switch (role="switch") · On | Off. The whole row is the tap area. */
export function switchRow({ iconName, title, sub, checked, onChange }) {
  const subEl = h('span', { class: 'list-row__sub' }, typeof sub === 'function' ? sub(checked) : sub);
  const knob = h('span', { class: `switch${checked ? ' is-on' : ''}`, 'aria-hidden': 'true' }, h('span', { class: 'switch__knob' }));
  const row = h(
    'button',
    { type: 'button', class: 'list-row', role: 'switch', 'aria-checked': String(checked) },
    iconName ? iconTile(iconName) : null,
    h('span', { class: 'list-row__body' }, h('span', { class: 'list-row__title' }, title), subEl),
    knob,
  );
  row.addEventListener('click', () => {
    const on = row.getAttribute('aria-checked') !== 'true';
    row.setAttribute('aria-checked', String(on));
    knob.classList.toggle('is-on', on);
    if (typeof sub === 'function') subEl.textContent = sub(on);
    onChange && onChange(on);
  });
  return row;
}

/** Stepper (bags, people) · Default | At minimum | At maximum. */
export function stepper({ label, sub, value, min = 0, max = 4, onChange }) {
  let v = value;
  const out = h('output', { class: 'stepper__value', 'aria-live': 'polite' }, String(v));
  const minus = h('button', { type: 'button', class: 'stepper__btn', 'aria-label': t('stepper.less', { what: label }) }, ic('minus', { size: 20 }));
  const plus = h('button', { type: 'button', class: 'stepper__btn', 'aria-label': t('stepper.more', { what: label }) }, ic('plus', { size: 20 }));
  const el = h(
    'div',
    { class: 'stepper', role: 'group', 'aria-label': label },
    h('div', { class: 'stepper__text' }, h('span', { class: 't-headline' }, label), sub ? h('span', { class: 't-footnote t-mute' }, sub) : null),
    h('div', { class: 'stepper__ctl' }, minus, out, plus),
  );
  const sync = () => {
    out.textContent = String(v);
    minus.setAttribute('aria-disabled', String(v <= min));
    plus.setAttribute('aria-disabled', String(v >= max));
    out.classList.remove('is-bump');
    void out.offsetWidth;
    out.classList.add('is-bump');
  };
  minus.addEventListener('click', () => {
    if (v <= min) return;
    v -= 1;
    sync();
    onChange && onChange(v);
  });
  plus.addEventListener('click', () => {
    if (v >= max) return;
    v += 1;
    sync();
    onChange && onChange(v);
  });
  sync();
  out.classList.remove('is-bump');
  el.setValue = (n) => {
    v = n;
    sync();
  };
  return el;
}

// ---------- Feedback ----------

export function banner({ tone = 'neutral', iconName = 'info', text }) {
  return h('div', { class: `banner banner--${tone}`, role: tone === 'error' ? 'alert' : 'status' }, ic(iconName, { size: 20 }), h('span', {}, text));
}

export function spinner(size = 20) {
  return h('span', { class: `spinner${size !== 20 ? ` spinner--${size}` : ''}`, role: 'progressbar', 'aria-label': 'Loading' });
}

export function badge(text) {
  return h('span', { class: 'badge' }, ic('clock', { size: 14 }), text);
}

/** Status chip · Neutral | Dark | Success | Warning | Error | Brand. */
export function chip(text, tone = 'neutral', iconName) {
  return h('span', { class: `chip chip--${tone}` }, iconName ? ic(iconName, { size: 14, stroke: 2.5 }) : null, text);
}

export function stateIcon({ iconName, tone }) {
  const big = tone === 'hero' || tone === 'success';
  return h('div', { class: `state-icon${tone ? ` state-icon--${tone}` : ''}`, 'aria-hidden': 'true' }, ic(iconName, { size: big ? 44 : 32, stroke: big ? 2.5 : 2 }));
}

/** Skeleton list sized like the rows that are coming. */
export function skeleton(rows = 1) {
  return h(
    'div',
    { class: 'skeleton', 'aria-hidden': 'true' },
    Array.from({ length: rows }, () => h('div', { class: 'skeleton__row' }, h('span', { class: 'skeleton__tile' }), h('span', { class: 'skeleton__lines' }, h('span'), h('span')))),
  );
}

// ---------- Cards and data ----------

/** Icon on a tile · neutral grey (default) | brand teal | success | dark. */
export function iconTile(name, { round = false, tone = 'neutral', size = 20 } = {}) {
  return h(
    'span',
    { class: `icon-tile${round ? ' icon-tile--round' : ''}${tone ? ` icon-tile--${tone}` : ''}`, 'aria-hidden': 'true' },
    ic(name, { size }),
  );
}

/** Fixride lockup (pin + wordmark) for the top bar. */
export function brand() {
  return lockup({ size: 's' });
}

/** Inline-SVG illustration in a rounded frame. */
export function illustration(svgMarkup, { className = '' } = {}) {
  return h('figure', { class: `illustration ${className}`, html: svgMarkup });
}

/**
 * List row · right side: Chevron | Value | Tick | Plain.
 * As a button when onClick is given.
 */
export function listRow({ iconName, iconTone, title, sub, right, chevron, onClick, className = '', attrs = {} }) {
  const tag = onClick ? 'button' : 'div';
  return h(
    tag,
    { type: onClick ? 'button' : null, class: `list-row ${className}`, onClick, ...attrs },
    iconName ? iconTile(iconName, { tone: iconTone }) : null,
    h('span', { class: 'list-row__body' },
      h('span', { class: 'list-row__title' }, title),
      sub ? h('span', { class: 'list-row__sub' }, sub) : null,
    ),
    right != null ? h('span', { class: 'list-row__right' }, right) : null,
    chevron ? h('span', { class: 'list-row__chev', 'aria-hidden': 'true' }, ic('chev', { size: 20 })) : null,
  );
}

/** Outlined card that groups list rows with dividers. */
export function rowCard(rows, className = '') {
  return h('div', { class: `row-card ${className}` }, rows);
}

/** Fixed bottom tab bar (Rider: Home, Trips, Help, Profile). */
export function tabBar(current, onTab) {
  const TABS = [
    { id: 'home', icon: 'home' },
    { id: 'trips', icon: 'receipt' },
    { id: 'help', icon: 'help' },
    { id: 'profile', icon: 'user' },
  ];
  const items = TABS.map((tab) =>
    h(
      'button',
      {
        type: 'button',
        class: 'tabbar__item',
        'aria-current': tab.id === current ? 'page' : null,
        onClick: () => onTab(tab.id),
      },
      ic(tab.icon, { size: 24 }),
      h('span', {}, t(`tab.${tab.id}`)),
    ),
  );
  return h('nav', { class: 'tabbar', 'aria-label': t('tab.label') }, items);
}

/** Spinning ring (B5 · paying). */
export function progressRing(size = 120) {
  return h('div', { class: 'pay-ring', style: `--ring-size:${size}px`, role: 'progressbar', 'aria-label': t('common.loading') });
}
