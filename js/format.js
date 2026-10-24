// Every money, time, phone, plate and date value on screen goes through here.

const rupeeFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹ with Indian grouping: 100000 → "₹1,00,000" */
export function rupees(n) {
  return `₹${rupeeFmt.format(n)}`;
}

/** Plain count with Indian grouping: 1240 → "1,240" */
export function count(n) {
  return rupeeFmt.format(n);
}

export function digitsOnly(s) {
  return String(s || '').replace(/\D/g, '');
}

/** "9876543210" → "98765 43210" (Miller: shown as 5 + 5) */
export function phone(d) {
  const x = digitsOnly(d).slice(0, 10);
  return x.length > 5 ? `${x.slice(0, 5)} ${x.slice(5)}` : x;
}

export function phoneWithCode(d) {
  return `+91 ${phone(d)}`;
}

/** Seconds → "0:24" / "9:52" */
export function mmss(totalSec) {
  const s = Math.max(0, Math.ceil(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Live mask for date of birth: digits → "12 / 03 / 1990" */
export function dobMask(raw) {
  const d = digitsOnly(raw).slice(0, 8);
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean);
  return parts.join(' / ');
}

/** "12 / 03 / 1990" → { day, month, year, date } or null if not a real date */
export function parseDob(masked) {
  const d = digitsOnly(masked);
  if (d.length !== 8) return null;
  const day = +d.slice(0, 2);
  const month = +d.slice(2, 4);
  const year = +d.slice(4, 8);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return { day, month, year, date };
}

export function ageOn(date, today = new Date()) {
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
}

/** ISO yyyy-mm-dd (native date input) ↔ masked dd / mm / yyyy */
export function isoToDob(iso) {
  const [y, m, d] = String(iso || '').split('-');
  return y && m && d ? `${d} / ${m} / ${y}` : '';
}

export function dobToIso(masked) {
  const p = parseDob(masked);
  if (!p) return '';
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/**
 * Indian number plate, formatted while typing: "mh02ab1234" → "MH 02 AB 1234".
 * State (2 letters) · RTO (1–2 digits) · series (0–3 letters) · number (1–4 digits).
 */
export function plate(raw) {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = s.match(/^([A-Z]{0,2})(\d{0,2})([A-Z]{0,3})(\d{0,4})/);
  if (!m) return '';
  return [m[1], m[2], m[3], m[4]].filter(Boolean).join(' ');
}

export function isValidPlate(p) {
  return /^[A-Z]{2} \d{1,2} [A-Z]{1,3} \d{4}$/.test(p) || /^[A-Z]{2} \d{1,2} \d{4}$/.test(p);
}

/** IFSC: 4-letter bank code, a zero, 6-character branch code — "HDFC0001234". */
export function isValidIfsc(v) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(v || ''));
}

export function isValidUpi(v) {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(String(v || '').trim());
}
