// Dummy, static seeds for every screen. Live state lives in store.js.
// Numbers are the Figma read-me placeholders and match the driver app.

export const LANGUAGES = [
  { id: 'en', native: 'English', en: 'English', speech: 'en-IN' },
  { id: 'hi', native: 'हिंदी', en: 'Hindi', speech: 'hi-IN' },
  { id: 'mr', native: 'मराठी', en: 'Marathi', speech: 'mr-IN' },
];

export const RIDER = {
  firstName: 'Ananya',
  lastName: 'Desai',
  phone: '9876543210',
  upi: 'ananya@okbank',
};

export const SMS_CODE = '381402';

export const TIMING = {
  smsAutofillMs: 1500,
  resendSec: 24,
  payingMs: 3000, // B5 ⏱3 s → B6
};

export const FLIGHTS = [
  { no: 'AI 864', from: 'Delhi', terminal: 'T2', lands: '22:40', status: 'on time' },
];

/** Places for A7 / B3a search. Home is the first one. */
export const PLACES = [
  { id: 'chakala', label: 'Chakala, Andheri East', line: 'Mumbai 400099', km: 9 },
  { id: 'chakala-metro', label: 'Chakala Metro Station', line: 'Andheri East, Mumbai', km: 8 },
  { id: 'chakala-midc', label: 'Chakala Industrial Area', line: 'MIDC, Andheri East', km: 9 },
  { id: 'sahar', label: 'Sahar Village', line: 'Andheri East', km: 2 },
  { id: 'bandra', label: 'Bandra West', line: 'Mumbai', km: 11 },
  { id: 'marol', label: 'Marol', line: 'Andheri East', km: 4 },
  { id: 'powai', label: 'Powai', line: 'Mumbai', km: 10 },
];

export const BAY = { id: 'Bay 12', level: 'P6 East', walkMin: 4 };

export const FARE = { ride: 370, parking: 50, tolls: 0, total: 420, km: 9 };

/**
 * Ride types. `fits` = what the vehicle carries (big bags, total bags, people).
 * Pool options open their own screens in flow 6, not built here.
 */
export const RIDES = [
  { id: 'auto', icon: 'auto', name: 'Auto', fare: 420, bay: 'Bay 12', level: 'P6 East', fits: { big: 2, bags: 4, people: 3 } },
  { id: 'cab', icon: 'car', name: 'Cab', fare: 540, bay: 'Bay 14', level: 'P6 East', fits: { big: 3, bags: 5, people: 4 } },
  { id: 'cabxl', icon: 'car', name: 'Cab XL', fare: 690, bay: 'Bay 14', level: 'P6 East', fits: { big: 4, bags: 6, people: 6 } },
];

export const POOLS = [
  { id: 'pool', icon: 'user', name: 'Pool with your flight', sub: 'Save ₹160 · up to 10 min extra · see co-riders first', fare: 380 },
  { id: 'women', icon: 'user', name: 'Women-only pool', sub: '2 women from your flight, going your way', fare: 380 },
];

export const CONTACTS = [
  { id: 'mom', name: 'Mom', phone: '+91 98200 ••••• 12' },
  { id: 'rohan', name: 'Rohan', phone: '+91 99300 ••••• 45' },
];

export const LIMITS = { big: 4, small: 4, people: 4 };

// ---- Rider · 2 Landing to her door (same seeds as the driver app) ----

export const DRIVERS = {
  santosh: {
    id: 'santosh',
    name: 'Santosh',
    rating: 4.8,
    trips: 1240,
    plate: 'MH 02 AB 1234',
    vehicle: 'Black and yellow auto',
    registerSince: '21:52',
    cancels: 0,
    refusals: 0,
    ridersSay: ['Helps with bags', 'On time', 'Polite'],
  },
  // X4b · the next auto in the queue after a skip or a driver cancel
  rakesh: {
    id: 'rakesh',
    name: 'Rakesh',
    rating: 4.7,
    trips: 860,
    plate: 'MH 02 CD 5678',
    vehicle: 'Black and yellow auto',
    registerSince: '22:05',
    cancels: 0,
    refusals: 0,
    ridersSay: ['Helps with bags', 'On time', 'Polite'],
  },
};
export const DRIVER = DRIVERS.santosh;

// ---- Rider · 3 Edge cases ----

/** X16 · short trips have a hub minimum fare (Figma read-me placeholder). */
export const SHORT_TRIP = { maxKm: 3, minFare: 60, distanceFare: 38 };

export const LATE = { newLands: '23:20' }; // X1 · flight is late

// ---- Rider · 6 Ways home, pooling and saved places ----

/** Pool options (B3p / B3pn / B3pw). A pool is a shared cab; the fare is per rider. */
export const POOL = {
  flight: { name: 'Pool with your flight', short: 'Pool with your flight', fare: 380, saveVs: 'cab', save: 160, extraMin: 10 },
  point: { name: 'Non-stop to a point', short: 'Non-stop to a point', fare: 200, saveVs: 'auto', save: 220, point: 'Andheri station (East)', riders: 3, lastMileKm: 1.5 },
  women: { name: 'Women-only pool', short: 'Women-only pool', fare: 380, saveVs: 'cab', save: 160, extraMin: 10 },
  invite: { cab: 540, each: 270 },
};

export const CO_RIDERS = [
  { name: 'Meera', rating: 4.9, area: 'Marol' },
  { name: 'Sana', rating: 4.8, area: 'Saki Naka' },
];

/** B3w · other ways out of T2 (information only, from the airport map). */
export const OTHER_WAYS = [
  { icon: 'counter', name: 'Premium taxi counter', where: 'Outside arrivals exit', walk: 'About 1 min walk', fare: 'Around ₹1,000' },
  { icon: 'counter', name: 'Prepaid taxi booth', where: 'Arrivals hall, near Gate 3', walk: 'About 2 min walk', fare: 'Fixed at the booth' },
  { icon: 'car', name: 'Other ride apps', where: 'P4 West or P6 parking', walk: '10 to 15 min walk', fare: 'App fare' },
  { icon: 'nav', name: 'Metro Line 1', where: 'Marol Naka station', walk: 'Not walkable with bags', fare: '₹20 to 40' },
];

/** A7b · the saved Home's full address. */
export const HOME_ADDRESS = { chakala: 'Chakala, Andheri East, Mumbai 400099', flat: 'Flat 302, Sai Kripa CHS' };
export const NO_SHOW = { paidMin: 5, deadline: '22:58', endAfterSec: 600 }; // X6 / X7

export const TRIP = {
  code: '4721',
  landedDate: 'Sunday 18 October',
  landedTime: '22:42',
  etaMin: 28,
  reachBy: '23:24',
  pickupAt: '22:52', // M2 receipt: left Bay 12
  supportCase: { id: '#4821', handler: 'Priya', reportedAt: '23:30', takenAt: '23:31' }, // M5
  freeWaitSec: 300,
  steps: [
    { icon: 'door', title: '1 · Exit at Gate 3', sub: 'Arrivals, ground floor' },
    { icon: 'lift', title: '2 · Take Lift B to Level P6', sub: 'Up 3 floors' },
    { icon: 'pin', title: '3 · Turn right to {bay}', sub: 'East side · {vehicle} {plate}' },
  ],
  amenities: [
    { icon: 'wc', label: 'Washroom', where: 'By Gate 3' },
    { icon: 'drop', label: 'Water', where: 'By Gate 3' },
    { icon: 'tea', label: 'Food', where: 'Arrivals hall' },
  ],
  rateTags: ['On time', 'Helped with bags', 'Polite', 'Asked for extra money', 'Rude', 'Unsafe driving'],
  timing: { findingMs: 3000, meetMs: 5000, tripMs: 6000 }, // C3 ⏱3 s · C6 ⏱5 s · C7 ⏱6 s
};
