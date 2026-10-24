# Fixride · Rider app prototype

Hi-fi, clickable prototype of the **Fixride rider app** (Ananya), built from the
Figma file *BCS-06 · Driver app (Santosh) · Mid-fi wireframes*:

- **Flow:** page "Rider app · end-to-end flow", section **1 · Sign up and lock a ride (before landing)**, 20 frames.
- **Look:** page "Design system" (tokens, components, states) and page "Logo · Fixride" (Option 1 · the fixed pickup pin).
- **Sister app:** the driver prototype at <https://jeelsolanki1503-hash.github.io/Public-Hubs/>. Both apps share
  the same tokens, component CSS, overlays, router and brand marks, so they read as one product.

Plain HTML, CSS and ES modules. No framework, no build step, no runtime
dependencies except Google Fonts (Inter, Noto Sans Devanagari). The phone is
**402 × 874** (iPhone 17 Pro).

## Run locally

Any static server works, run from this folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. Opening `index.html` straight from disk will not work, because ES modules need http.

## Deploy to GitHub Pages

1. Push the contents of this `app/` folder to the root of a repo (or to `/docs`).
2. In **Settings → Pages**, choose branch `main` and folder `/ (root)` (or `/docs`).
3. Open `https://<user>.github.io/<repo>/`.

Every path is relative. Routing uses the hash (`#/rider/B3`). `.nojekyll` is present and `404.html` is an exact copy of
`index.html`, so deep links and refreshes work.

## What's built (flow 1, 20 frames + splash)

| Code | Screen | Live behaviour |
| --- | --- | --- |
| splash | Fixride splash (2 s) | Pin drops, keyhole locks, ripples, wordmark slides out, load bar. Goes to A1, or to Home if already signed up |
| A1 | Welcome | Flat T2-exit illustration (rider with bags, auto, teal Bay 12 pin) replaces the grey placeholder; Fixride lockup at top |
| A2 | Choose language | EN / हिंदी / मराठी radio tiles; picking one re-renders the app in that language at once |
| A3 | Mobile number | Mock keypad and hardware keys, 5 + 5 grouping, "Enter all 10 digits" check, "Sending…" |
| A4 | Enter the code | 6 boxes, auto-advance, paste, SMS auto-read after 1.5 s (`381402`), live 0:24 resend countdown, wrong code shows "That code is wrong. N tries left." |
| A5 | Your name | First name required (inline error), last name optional |
| A6 | Location permission | The phone's own pop-up over A5 (system blue only here). Allow → A7, Don't Allow → A7 with location off |
| A7 | Save your Home | Live search, result rows as radio choices, "Use my current location" (spinner), map pin drops on the choice, Skip |
| B1 | Home (first time) | "Hi {name}", dark card → B2, How it works, 4-tab bar |
| B2 | Your flight | Type a flight number (`ai864` → `AI 864`), skeleton, result card → B3, "no flight" empty state |
| B3 | Ride home | Bag / people steppers with min and max states; the ride card, fare and sticky price bar update live. 3+ big bags moves the ride from auto to cab, with the reason shown |
| B3a | Where to? | Saved and recent places, live search; Home → back to B3 |
| B3b | Other ways home (sheet) | Auto / Cab / Cab XL as radio cards; rides that don't fit the bags are disabled with the reason |
| B4 | Lock your ride (sheet) | Fare hero, promise rows, "Pay ₹420 and lock" → "Paying…" |
| B4a | What's included (sheet) | Fare breakdown that matches the chosen ride; stacks over B4 |
| B4b | Ride promise (sheet) | Fees worked out as 10 % of fare, up to ₹100 |
| B5 | Paying | 3 s auto-advance → B6. "Payment didn't go through?" pauses and opens the payment-failed dialog: Try again / Change UPI app |
| B6 | Ride locked | Success mark with rings, summary card |
| B7 | Your ride (scheduled) | Steps, bay and bags. Back → B8. Cancel ride → free-cancel dialog → B1 |
| B7a | Share your ride (sheet) | Contact checkboxes, WhatsApp / SMS / Copy link (copies a real link), live button label, sets "Mom can follow this ride" |
| B8 | Home (ride booked) | Dark ride card → B7, follow card when shared |

## What's built (flow 2 · Landing to her door, 10 frames)

B7 "Prototype: skip to landing →" opens C1, so flows 1 and 2 run as one journey.

| Code | Screen | Live behaviour |
| --- | --- | --- |
| C1 | Landed: notification | Dark lock screen (Sunday 18 October, 22:42). The Fixride push notification slides in with a buzz; tap it → C2 |
| C2 | Welcome to Mumbai | Animated baggage-belt illustration with the rider's flight number, pickup card, three amenity tiles. "I have my bags" → C3 |
| C3 | Finding your auto | Spinner ring, ⏱3 s → C4 |
| C4 | Your driver | Santosh's card, yellow number plate, T2-register record (teal), "Riders say" chips. The "Mom is following" card appears only if the ride was shared in B7a |
| C5 | Walk to Bay 12 | Live free-wait clock from 5:00 (turns amber under 1:00 with a buzz; after 0:00 the bar turns amber and shows ₹1 a minute). Steps, Santosh's photo of his auto, call button |
| C5a | Send a photo (sheet) | Camera viewfinder mock, shutter flash, "Sending…", toast "Photo sent to Santosh" |
| C6 | At Bay 12 | Big yellow plate, trip code 4721, bag checks, locked "Waiting for Santosh to start" button. ⏱5 s → C7 |
| C7 | On the trip | Map with the auto moving along the route to Home, ETA counting down, fare-locked card, SOS and "Driver asked for extra money", "Mom is following" line. ⏱6 s → C8 |
| C8 | All bags out? (sheet, no scrim close) | One row per bag from what was booked on B3; unticking a bag locks the main button |
| C9 | Rate your ride | Stars and tags you can change; Done or ✕ files the trip, starts a fresh booking and returns to B1 |

All names, bays, bags, fares and the auto/cab wording come from what the rider booked in flow 1.

## What's built (flow 3 · Edge cases, X0–X18 + X4b)

Each case opens where it really happens in flows 1 and 2, and also from the **X0 index** ("What can go wrong").

| Code | Case | Where it lives / how you reach it |
| --- | --- | --- |
| X0 | What can go wrong | Index of every case; each row opens it live with the ride state it needs |
| X1 | Flight is late | B7 with the dark "moved to 23:20" banner and a "Moved" chip. Back → B8 |
| X2 | Bags taking long (sheet) | C2 "Bags delayed?" |
| X3 | Skip this auto? (dialog) | C4 "Skip this auto · 1 skip left" → X4b. After one skip: "No skips left" |
| X4 | Driver cancelled (sheet, no scrim close) | ₹42 back, same fare, on his record → X4b |
| X4b | Your new driver | Rakesh, MH 02 CD 5678. He carries through C5–C9 |
| X5 | No auto free right now | C3 "Prototype: no auto free →". Keep waiting → C4 · Cancel and get ₹420 back → B1 |
| X6 | Late to the bay | C5 after the 5:00 free wait: amber bar, ₹1 a minute, the 22:58 warning |
| X7 | Ride ended (you didn't come) | C5 moves here by itself once 10 minutes have passed. Get the next auto → X17 |
| X8 | Cancel, no driver yet (dialog) | B7 "Cancel ride" → B1 |
| X9 | Cancel, driver assigned (sheet) | C5 "Cancel": ₹42 fee, ₹378 back → B1 |
| X10 | This isn't my auto (dialog) | C6. Pauses the 5 s auto-advance. Get help → X12 |
| X11 | Driver asked for extra money (sheet) | C7. Pauses the trip. I feel unsafe → X12 |
| X12 | SOS (sheet) | C7 SOS, X10, X11. "Call 112 · Police" is a real `tel:112` link |
| X13 | Payment failed (dialog) | B5 "Payment didn't go through?" |
| X14 | Wrong code | A4 "Code not working?": A4 in its error state; Resend code → auto-read → A5 |
| X15 | Location is off | A6 "Don't Allow". Open Settings (turns location on) / Continue without → A7 |
| X16 | Short trip (minimum fare) | B3a → Sahar Village (2 km): ₹60 with the "Hub minimum fare" chip, all the way through to payment |
| X17 | At the exit now | B1 / B8 "At the exit now?" and X7. Pay and get auto → C3 → the landing flow |
| X18 | No internet | B8 with the offline banner; also shown for real when the phone goes offline |

## What's built (flow 4 · Trips, Help and Profile tabs, M1–M6)

The bottom tabs now work everywhere: Home (B1, or B8 when a ride is booked), Trips (M1), Help (M3) and Profile (M6).
Switching tabs cross-fades with no slide.

| Code | Screen | Live behaviour |
| --- | --- | --- |
| M1 | Trips | Every finished ride (rated on C9, or ended by a report) with time, driver and fare. Before the first ride: the design system's "No trips yet" empty state with "Book a ride" |
| M2 | Receipt | The ride's pickup bay, drop and times, driver and plate, your star rating, and the fare breakdown (including the hub minimum fare for short trips). **Download receipt** saves a text receipt. "Get help with this trip" → M3 |
| M3 | Help | Today's trip card (the ride under way, else the last one). "I felt unsafe" opens SOS (X12); every other row opens a report (M4) |
| M4 | Left a bag | Bag type chips, a description field and Send report ("Sending…"). The other Help rows open the same report form with their own title and a "What happened?" field |
| M5 | We're on it | Case #4821 with the steps; the current step pulses. Done → Home · ✕ → Help |
| M6 | Profile | Name and number, saved places, followers (opens B7a and updates the row live), language (A2, then Next brings you back here), usual bags, women-only pool switch (saved), safety, Log out (confirm → A1) |

Flows 2 and 3 now lead here too: "My bag is lost" (X2), "This wasn't my fault" (X7) and "Report a problem" (C9) open
Help (M3). "A bag is still inside" (C8) opens the bag report (M4); when that report is done, the ride is filed in Trips.

## What's built (flow 5 · No app: QR code or counter at the exit, W1–W4)

For riders without the app. It renders inside the phone frame: the poster on the wall, then a web page with a mock
browser bar, then a mock WhatsApp chat. Start it from the prototype panel ("No app (W1)").

| Code | Screen | Live behaviour |
| --- | --- | --- |
| W1 | QR poster at the exit | Black + teal poster (design system "QR poster") with the Fixride logo and a drawn QR code. Tap it: the scan line sweeps and the page opens. The staffed-counter card opens the same page |
| W2 | Web: where to (`fixride.in/t2`) | English / हिंदी / मराठी chips switch the page language. "Going to" field, bag steppers (an auto fits 2 big bags; the reason is shown), phone field with its 10-digit check, sticky ₹420 bar |
| W3 | Web: pay (`fixride.in/t2/pay`) | UPI / Card / Cash at the counter as radio cards, "Paying…", then the ride is matched |
| W4 | WhatsApp: your auto | "typing…" then the message (driver, plate, rating, register, directions, code 4721, ₹420 paid). The three buttons are live: **Track my ride** → C7, **Driver asked for extra money** → X11, **SOS** → X12 |

## What's built (flow 6 · Ways home, pooling and saved places)

These screens replace the "later flow" messages left in flows 1–3.

| Code | Screen | Live behaviour |
| --- | --- | --- |
| A7b | Confirm your Home | Tapping a search result or "Use my current location" on A7 opens it. Map pin, full address, optional flat/building, Save as Home / Work / Other (title and button follow the choice). Profile → Saved places opens it too and comes back to Profile |
| B3w | Other ways out of T2 | From "Other ways home" → "Other ways out of T2 (info only)". Four information cards from the airport map |
| B3p | Pool with your flight | Same flight · To a point · Invite tabs. Co-riders with drop order, fare facts, "Solo is your fallback". Join → B4p |
| B3pn | Non-stop to a point | ₹200 to Andheri station (East), last 1.5 km by auto. Join → B4p |
| B3pi | Invite someone you know | ₹540 cab split ₹270 each. **Share invite link** uses the phone's share sheet, or copies the link |
| B3pw | Women-only pool | Only listed in "Other ways home" when the Women-only pool switch is on in Profile. Join → B4p |
| B4p | Lock your pool (sheet) | ₹380 (or ₹200), "All-in fare · cab pool", "Pool doesn't fill?" row, Pay → B5 → B6 (Bay 14) |
| B3mi | Why a minimum hub fare? (sheet) | X16 "Why a minimum fare?" |
| X19 | Ways home (sheet) | Opens by itself on B3 when a third big bag is added: Cab and Cab XL first, Auto disabled with the reason. Picking a ride closes it |
| X20 | Pool didn't fill (sheet, no scrim close) | On "Finding your auto" for a pool booking. Switches to a solo auto; the fare she paid (₹380) stays the fare for the whole trip |

Also built: light and dark themes (DS values), real `online` / `offline` events plus a simulated offline banner,
`prefers-reduced-motion`, focus trap and Escape in sheets, `aria-live` errors and toasts, 44 px targets, and a
`localStorage` store with an in-memory fallback. State survives reloads: language, phone, name, Home, bags, ride,
payment and who it's shared with.

**Prototype panel** (beside the phone on desktop; long-press the status bar on a phone): flow starts, a jump to any
screen code (A1–C9), a "Landing (C1)" flow start, language, theme, demo speed 1× / 10× (free-wait clock),
simulate offline, and reset all data.

## Decisions to review

- **Brand name:** the mid-fi frames say "Hub Ride" (A6, C1, W4) and `hubride.in` (W2, W3). The prototype says
  **"Fixride"** and `fixride.in`, to match the finalised logo and the driver app.
- **Main buttons are teal**, as the design system's Buttons board says ("One main (teal) button per screen"). The master
  prompt's older note said ink black.
- **B3a** has no mock numeric keypad. The frame shows one, but a place search needs letters, so the phone's own
  keyboard is used.
- **A4** verifies by itself once the six digits are in (after the SMS auto-read or typing). **Verify** still works.
- **A7:** tapping a result or "Use my current location" drops the pin, then opens A7b (Confirm your Home). "Save as
  Home" on A7 still saves the highlighted place straight away.
- **Pools never fill in this prototype.** After paying for a pool, landing always shows X20 and switches to a solo
  auto at the pool fare, because the frames have no pooled-trip screens (shared pickup, co-rider drop-offs).

## Not built yet (no frames for these)

All six rider flows are built. These few tap targets have no frame in the Figma file, so each shows an
"… isn't in this prototype yet." toast (no button is dead):

- B2 Different date · B3a Add Work and other non-short places (Bandra West, Marol, Powai) · B4 Change UPI
- B7a Pick from contacts · Profile: Payment, My usual bags, Safety · X0 rows for anything outside the rider flows
- Calling Santosh / Rakesh or the safety team shows a toast instead of dialling (112 dials for real)
- Hindi and Marathi cover sign-up (A1–A7), the tab bar and common lines. Booking screens fall back to English.

## Assets handoff

The prototype ships asset-free. Drop real files in using these paths:

| Where in the UI | Suggested path | Format | Target size |
| --- | --- | --- | --- |
| App logo | `assets/logo-ride.svg` | SVG | 128 × 128 |
| Welcome illustration (A1) | `assets/illustrations/welcome-rider.svg` | SVG | 362 × 340 |
| Home map (A7) | `assets/maps/a7.png` | PNG / WebP | 724 × 300 |
| Favicon | `favicon.svg` | SVG | 512 × 512 |
| iOS touch icon | `apple-touch-icon.png` | PNG | 180 × 180 |

## File layout

```
index.html · 404.html · .nojekyll · favicon.svg
css/  reset · variables (DS tokens) · base (phone frame, panel) · components · screens-rider · animations
js/   app (routes) · router · overlays · components · icons (65 DS icons) · brand · illustrations
      data · store · i18n · format · clock · devpanel
      screens/rider-onboarding.js  splash, A1–A7
      screens/rider-booking.js     B1–B8, sheets, X8 / X13 dialogs
      screens/rider-trip.js        C1–C9, sheets C5a / C8, and the X2–X4 / X6 / X9–X12 overlays and states
      screens/rider-edge.js        X0 index, X5, X7, X15, X17
      screens/rider-tabs.js        M1–M6 (Trips, Receipt, Help, report, case, Profile)
      screens/rider-web.js         W1–W4 (QR poster, web booking, WhatsApp)
      screens/rider-pool.js        A7b, B3w, B3p / B3pn / B3pi / B3pw, X20 (B4p, B3mi, X19 live in rider-booking.js)
```

Each screen factory and route is named after its Figma frame code (`#/rider/B3`).
