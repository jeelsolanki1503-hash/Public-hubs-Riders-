// Live state: localStorage-backed, with a silent in-memory fallback
// (private browsing / storage disabled). Tiny pub/sub on top.

const KEY = 'fixride.rider.v1';

const memory = new Map();
const storage = (() => {
  try {
    const probe = '__fixride_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return {
      getItem: (k) => (memory.has(k) ? memory.get(k) : null),
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k),
    };
  }
})();

function seed() {
  return {
    settings: {
      lang: 'en',
      theme: 'light',
      demoSpeed: 1,
      simulateOffline: false,
    },
    rider: {
      phone: '',
      codeTries: 0,
      firstName: '',
      lastName: '',
      location: 'ask', // ask | while-using | once | denied
      home: null, // place id
      homeFlat: '', // A7b · flat, floor, building
      work: null, // A7b · saved as Work
      signedUp: false,
      followers: ['mom'], // M6 · people who follow my rides
      womenPool: false, // M6 · women-only pool options
      cases: [], // M4 → M5 reports: { id, topic, bag, note, at }
    },
    // Ride being set up on B2 / B3, then locked on B4
    booking: {
      flight: null, // flight number
      dest: 'home', // place id or 'home'
      big: 2,
      small: 1,
      people: 1,
      ride: 'auto',
      state: 'draft', // draft | paying | scheduled | landed | matched | walking | atBay | onTrip | arrived
      paidAt: 0,
      sharedWith: [], // contact ids
      waitStartedAt: 0, // C5: when Santosh reached the bay (free wait counts from here)
      pool: null, // B3p / B3pn / B3pw: 'flight' | 'point' | 'women'
      lockedFare: 0, // X20: a pool that switched to solo keeps the fare she paid
      driver: 'santosh', // X4b: 'rakesh' after a skip or a driver cancel
      skipsLeft: 1, // X3: one skip per ride
    },
    trips: [], // finished rides: { flight, ride, fare, rating, tags, at }
  };
}

function load() {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return seed();
    const saved = JSON.parse(raw);
    const base = seed();
    return {
      settings: { ...base.settings, ...saved.settings },
      rider: { ...base.rider, ...saved.rider },
      booking: { ...base.booking, ...saved.booking },
      trips: Array.isArray(saved.trips) ? saved.trips : [],
    };
  } catch {
    return seed();
  }
}

let state = load();
const subs = new Set();

function persist() {
  try {
    storage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota or disabled — in-memory state still works */
  }
}

export const store = {
  get: () => state,
  settings: () => state.settings,
  rider: () => state.rider,
  booking: () => state.booking,

  /** Shallow-merge a patch into a branch and notify. */
  set(branch, patch) {
    state = { ...state, [branch]: { ...state[branch], ...patch } };
    persist();
    subs.forEach((fn) => fn(state, branch, patch));
  },

  /** Start a fresh booking, keeping the bags and people the rider last used. */
  newBooking() {
    const { big, small, people } = state.booking;
    this.set('booking', { ...seed().booking, big, small, people });
  },

  /** C9: file the finished ride and start a fresh booking. */
  finishTrip(entry) {
    state = { ...state, trips: [entry, ...state.trips] };
    this.newBooking();
  },

  subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  },

  reset() {
    const { theme, demoSpeed } = state.settings;
    state = seed();
    state.settings.theme = theme;
    state.settings.demoSpeed = demoSpeed;
    persist();
    subs.forEach((fn) => fn(state, 'reset', null));
  },
};

export function isOffline() {
  return state.settings.simulateOffline || (typeof navigator !== 'undefined' && navigator.onLine === false);
}

/** Is a ride locked and waiting for the flight? (B8 instead of B1.) */
export function hasRide() {
  return state.booking.state === 'scheduled';
}
