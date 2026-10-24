// Timers and countdowns. Countdowns run at real time × demo speed;
// auto-advance screens use their fixed Figma timings (see §15).

import { store } from './store.js';

function speed() {
  return store.settings().demoSpeed || 1;
}

/**
 * Count down `seconds` of demo time. Calls onTick(secondsLeft) about 4×/s
 * and onDone() once. Returns a cancel function.
 */
export function countdown(seconds, onTick, onDone) {
  let last = performance.now();
  let left = seconds;
  let lastShown = null;
  const id = setInterval(() => {
    const now = performance.now();
    left -= ((now - last) / 1000) * speed();
    last = now;
    const shown = Math.max(0, Math.ceil(left));
    if (shown !== lastShown) {
      lastShown = shown;
      onTick && onTick(shown);
    }
    if (left <= 0) {
      clearInterval(id);
      onDone && onDone();
    }
  }, 250);
  onTick && onTick(Math.ceil(left));
  return () => clearInterval(id);
}

/** Fixed delay (Figma auto-advance timings). Returns a cancel function. */
export function after(ms, fn) {
  const id = setTimeout(fn, ms);
  return () => clearTimeout(id);
}

/** Collects cancel functions so a screen can clear everything on unmount. */
export function timerBag() {
  const cancels = new Set();
  return {
    add(cancel) {
      cancels.add(cancel);
      return cancel;
    },
    clear() {
      cancels.forEach((c) => c());
      cancels.clear();
    },
  };
}
