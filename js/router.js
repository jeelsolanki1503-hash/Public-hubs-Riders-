// Hash router (#/rider/A4) with a screen stack and slide transitions.
// Forward = slide in from the right, back = slide in from the left.

import { closeAllOverlays } from './overlays.js';

const routes = new Map();
let viewport = null;
let hooks = {};
let current = null; // { hash, view }
const trail = [];
let pendingReplace = false;
let pendingBackTo = null;
let pendingFade = false;

/** Register a screen factory: (params) => { el, onMount?, onUnmount?, chrome? } */
export function route(path, factory) {
  routes.set(path, factory);
}

export function startRouter({ viewportEl, onRender }) {
  viewport = viewportEl;
  hooks = { onRender };
  window.addEventListener('hashchange', () => render(direction()));
  trail.push(currentHash());
  render('none');
}

function currentHash() {
  const h = location.hash.replace(/^#/, '');
  return h && h !== '/' ? h : '/';
}

function direction() {
  const h = currentHash();
  if (pendingBackTo && h === pendingBackTo) {
    trail.length = trail.lastIndexOf(h) + 1;
    pendingBackTo = null;
    return 'back';
  }
  pendingBackTo = null;
  if (pendingReplace) {
    pendingReplace = false;
    trail[trail.length - 1] = h;
    const fade = pendingFade;
    pendingFade = false;
    return fade ? 'fade-forward' : 'forward';
  }
  if (trail.length > 1 && trail[trail.length - 2] === h) {
    trail.pop();
    return 'back';
  }
  trail.push(h);
  return 'forward';
}

export function go(path, { replace = false, fade = false } = {}) {
  const target = `#${path}`;
  if (location.hash === target) return;
  if (replace) {
    pendingReplace = true;
    pendingFade = fade;
    location.replace(target);
  } else {
    location.hash = target;
  }
}

/**
 * Go back several steps to an earlier screen in this session's trail
 * (e.g. O10 "Use this photo" → the O8 list), or push it if it isn't there.
 */
export function backTo(path) {
  const idx = trail.lastIndexOf(path);
  const steps = trail.length - 1 - idx;
  if (idx >= 0 && steps > 0) {
    pendingBackTo = path;
    history.go(-steps);
  } else {
    go(path);
  }
}

/** Is `path` an earlier screen in this session's trail? */
export function inTrail(path) {
  return trail.slice(0, -1).includes(path);
}

/**
 * Rename the current history entry without re-rendering (a screen whose state
 * has moved on, e.g. O7b becomes O8 once the first document is added).
 */
export function relabel(path) {
  history.replaceState(history.state, '', `#${path}`);
  trail[trail.length - 1] = path;
}

/** Back arrow: real history back when there is somewhere to go, else `fallback`. */
export function back(fallback = '/') {
  if (trail.length > 1) history.back();
  else go(fallback, { replace: true });
}

export function currentPath() {
  return currentHash();
}

/** Re-render the current screen in place (language switch, reset). */
export function refresh() {
  render('fade');
}

function resolve(hash) {
  const parts = hash.split('/').filter(Boolean); // ['driver','O9','permit']
  if (!parts.length) return { factory: routes.get('/'), params: {} };
  const key = `/${parts[0]}/${parts[1] || ''}`;
  const factory = routes.get(key) || routes.get('/');
  return { factory, params: { app: parts[0], code: parts[1], arg: parts[2] } };
}

function render(dir) {
  closeAllOverlays();
  const hash = currentHash();
  const { factory, params } = resolve(hash);
  const view = factory(params);

  const prev = current;
  current = { hash, view };
  if (prev && prev.view.onUnmount) prev.view.onUnmount();

  hooks.onRender && hooks.onRender(view, params);
  viewport.append(view.el);

  if (prev) {
    const old = prev.view.el;
    old.inert = true;
    const isFade = dir === 'fade' || dir === 'fade-forward';
    const enter = dir === 'back' ? 'route-enter-back' : isFade ? 'route-enter-fade' : 'route-enter-forward';
    const exit = dir === 'back' ? 'route-exit-back' : isFade ? 'route-exit-fade' : 'route-exit-forward';
    if (dir === 'none') {
      old.remove();
    } else {
      view.el.classList.add(enter);
      old.classList.add(exit);
      const done = () => {
        old.remove();
        view.el.classList.remove(enter);
      };
      view.el.addEventListener('animationend', done, { once: true });
      setTimeout(done, 400); // reduced motion / missed event
    }
  }

  // Move focus to the new screen's title first; onMount may then move it on
  // (e.g. into the code boxes on O4).
  const heading = view.el.querySelector('.screen__heading');
  if (heading && dir !== 'fade') heading.focus({ preventScroll: true });
  if (view.onMount) view.onMount();
}
