# Markaz-ul-Uloom Website

Official website for Markaz-ul-Uloom School of Arabic & Islamic Studies, a mosque and Islamic school in Alagbado/Otubu, Lagos, Nigeria, serving the community since 1985. Live at **https://m-uloom.org**.

## Stack & hosting

- Static site: vanilla HTML/CSS/JS, no framework, no build tool beyond minification.
- Single-page app: everything lives in one `index.html`. Each "page" is a `<div id="X-page" class="page">`; `showPage('x')` (in `js/script.js`) hides all `.page` elements and shows the target one, updates the active nav button, sets `document.title` from `PAGE_TITLES`, and updates `window.location.hash`. `handleHashNavigation()` reads the hash on load so deep links (`/#contact`) work.
- Hosted on **Netlify**, auto-deploys on push to `main` on GitHub (`Markazuloom/Markazul-Uloom-Mosque-and-Arabic-Islamic-Studies`).
- No `npm install`/build step in CI — `netlify.toml`'s build command is a no-op echo. Minified assets (`css/styles.min.css`, `js/script.min.js`) are committed directly; **you must rebuild and commit them yourself** (see workflow below), Netlify does not do it.

## Repo layout

```
index.html              All pages/sections, single file
css/styles.css           Source stylesheet (~4000+ lines)
css/styles.min.css        Minified, committed, what index.html actually loads
js/script.js              Source JS
js/script.min.js          Minified, committed, what index.html actually loads
manifest.json             PWA manifest
sw.js                     Service worker (app-shell cache-first, see PWA section)
netlify.toml              Headers + redirects (old .html pages -> hash routes, HTTPS force)
images/                   Photos + optimized/ subfolder with WebP versions
readme.md                 STALE — wrong phone/email, mentions features that no longer
                          exist (manual prayer-time refresh button, donate.html as a
                          real page). Don't trust it; this file is the current source
                          of truth. Worth rewriting at some point but not yet done.
```

## The deploy workflow (follow this every time)

1. Edit `css/styles.css` and/or `js/script.js` (never hand-edit the `.min.` files).
2. Rebuild both minified files, even if you only changed one source:
   ```bash
   npx clean-css-cli -o css/styles.min.css css/styles.css
   npx terser js/script.js -c -m -o js/script.min.js
   ```
3. Bump the cache-busting version query string **everywhere it appears** — currently `?v=18` in three places in `index.html` (`<link rel=preload>`, the `<noscript>` fallback, and the `<script src>`), and also inside `sw.js` (`CACHE_VERSION` constant + the two versioned URLs in `APP_SHELL`) if you touched CSS/JS. Bump all of these together to the same next number, even if only one file actually changed — that's the established pattern in this repo's history.
4. Test locally before pushing: `python3 -m http.server <port>` from the `site/` directory, open in the Browser pane, check console for errors, exercise the actual feature you changed.
5. `git add` the specific changed files (not `-A`), commit, `git push origin main`.
6. Netlify deploys automatically. Poll for it rather than guessing timing:
   ```bash
   until curl -s https://m-uloom.org/index.html | grep -q 'v=<N>'; do sleep 5; done
   ```
7. **Verify on the live site, not just locally.** Navigate the Browser pane to some other origin first (e.g. `https://example.com`) and then to `https://m-uloom.org` — a same-origin reload can serve a stale cached response even after deploy; the cross-origin bounce forces a fresh fetch.
8. Check console errors on the live page after verifying.

## Known tooling quirks (this browser pane specifically, not the site)

- **Screenshots are unreliable when a `position:fixed; inset:0` full-screen overlay is open** (was relevant to the old full-screen mobile menu; less of an issue now that the mobile menu is a fixed-width drawer, but keep in mind for any future full-screen overlay work). When a screenshot looks wrong (clipped, wrong dimensions), verify with `document.elementFromPoint(x, y)` hit-testing instead of trusting the screenshot.
- **Reading computed style/DOM state immediately after a CSS-transitioned class toggle, all within one `javascript_exec` call, can report stale values** even after an `await sleep()` inside that same call. A second, separate `javascript_exec` call (real round-trip time apart) gives the reliable settled value. Don't conclude something is broken from a single combined toggle+read call — re-check with a fresh call first.
- **Service worker registration cannot be tested in this embedded browser pane at all** — confirmed by registering a trivial one-line dummy service worker, which failed with the same generic error as the real one. This is a sandboxing limitation of the pane, not a code bug. PWA/service-worker changes must be verified by the user in a real browser (installability, offline behavior) — you can only verify the files serve correctly (right content-type, valid JSON/JS syntax) from here.
- **`preview_start` reads `~/.claude/launch.json`, not a per-project one**, and that file only defines the SpendWise dev server (port 3000, a different project that may be running — don't kill it). So for this site, run `python3 -m http.server 8765 --bind 127.0.0.1` from `site/` in the background and `navigate` the pane to `http://127.0.0.1:8765`, then kill it when done.
- **CSS transitions don't advance until the pane renders a frame**: right after a reload or class toggle, `getComputedStyle` can keep reporting the pre-transition value (e.g. the closed mobile drawer showing `visibility: visible`). Take a screenshot to force a frame, then re-read in a separate call.
- **Browser cache survives reloads of `?v=N` assets in the pane**: after rebuilding the min files *without* bumping the version, `fetch(url, {cache: 'reload'})` the CSS/JS/HTML first, then reload. (Not an issue on the live site, where the version bump busts the cache.)
- **Tab-order testing**: a URL like `/#services` makes the browser start sequential focus from the home page's `<section id="services">`, so the first Tab lands somewhere unexpected. Test keyboard navigation from a URL with no hash.
- `scroll-behavior: smooth` is set globally (`css/styles.css`, on `html`). Rapid `window.scrollTo()` calls in a test loop without waiting corrupt measurements — use `{behavior: 'instant'}` and wait after each scroll/page-switch when testing clearance/positioning.

## Architecture notes worth knowing before touching things

- **Prayer times** (`PrayerTimesManager` class in `js/script.js`): fetches from the Aladhan API (`api.aladhan.com`, method=2/ISNA, Lagos lat/long) once on load and once daily at midnight. Populates every `.prayer-time-display[data-prayer=X]` element (currently only on the homepage). Also extracts the Hijri date from the same API response (`data.date.hijri`) and drives a live "next prayer" countdown that ticks every second, computed in **actual Lagos wall-clock time via `Intl.DateTimeFormat` with an explicit timezone** (not the visitor's own device timezone, and not real `Date` object math) — this matters, a naive implementation is wrong for any visitor outside WAT. See `getLagosNowSeconds()`/`computeNextPrayer()`. Falls back to hardcoded approximate times if the API fails; deliberately does *not* fall back for the Hijri date (no honest way to approximate a calendar date).
- **Mobile nav**: below 1199px (wider than the site's usual 768px breakpoint — 8 nav items + logo don't fit in one row between ~769-1150px, which used to cause a tall variable-height 2-row header), the nav becomes a fixed-width (300px / 82vw) slide-in drawer from the right, over a dimmed `.nav-backdrop`, rather than a full-screen takeover. Toggle button turns into an X via CSS on `[aria-expanded="true"]`. Auto-closes when a nav item is tapped. Header itself is *always* fixed in place — there used to be a hide-on-scroll behavior, removed because the scroll listener + transform transition caused visible lag/jank on both phone and desktop.
- **Top-of-page clearance**: `.page .hero, .page .section:first-child { padding-top: 160px }` (140px on mobile) exists specifically because the fixed header would otherwise overlap the first section's content. If you ever change the header's height, re-check this value. The Anniversary page's hero (`.anniversary-hero`) has its own separate, already-generous clearance mechanism — don't apply the general rule's assumptions to it.
- **PWA**: `manifest.json` + `sw.js`, registered from `js/script.js` on `window.load`. Service worker is cache-first for same-origin GET requests only — it explicitly does not intercept cross-origin requests, so the Aladhan prayer-times API always hits the network live and never serves a stale cached prayer time. Cache name is tied to the same `?v=` version scheme as the rest of the site; bump `CACHE_VERSION` in `sw.js` whenever you bump the site version, so `activate()` drops the old cache.
- **Accessibility conventions (added 2026-10-05)**: 
  - Pages live inside `<main id="main-content" tabindex="-1">`; a skip link (`.skip-link`, first element in `<body>`) targets it. Because the site is hash-routed, the skip link is handled in JS (`preventDefault` + `main.focus()`); a plain `#main-content` anchor would be treated as a page name and blank the site — don't "simplify" it back.
  - `showPage(pageId, moveFocus = true)` moves focus to the new page's first `h1`/`h2` (via `tabindex="-1"`, `preventScroll`) and sets `aria-current="page"` on the active nav item. The first render on load passes `moveFocus = false` so focus isn't stolen. `[tabindex="-1"]:focus` has no ring on purpose — those are script focus targets, not controls.
  - Focus ring is `:focus-visible` only, two-tone (blue outline + white gap) so it shows on both white sections and the blue header/footer. Don't reintroduce `*:focus` (it showed rings on mouse clicks and a blue-on-blue ring vanished on the header).
  - Every Arabic element carries `lang="ar"` (CSS already sets `direction: rtl`), so screen readers switch voice. New Arabic text needs it too: `<div lang="ar" class="arabic-text">`.
  - The mobile drawer's dropdown items use `visibility: inherit`, **not** `visible`. `visible` made them focusable while the drawer was closed and off-screen (keyboard users tabbed through invisible links).
  - `#FFD700` gold is for **dark** backgrounds only (hero, footer, drawer). On white/light cards use `#8a6500` (text) or `#9a7200` (large numerals) — these pass WCAG AA (4.5:1 / 3:1). Same idea for the Contact buttons (`#0f7b3f`, `#c5221f`) and secondary grey (`#666`).
  - Out-of-order headings (h1 page title straight to h3 cards) are fixed with `aria-level="2"` on the existing `<h3>`, to avoid changing styling.
  - To audit: in the Browser pane, inject axe-core (`https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js`) via `javascript_exec`, force `.section,.card` to `opacity:1` (scroll-reveal leaves them transparent and skews contrast), then run `axe.run()` per page after `showPage(p, false)`. As of 2026-10-05 all 13 pages report zero violations (wcag2a/2aa/21a/21aa + best-practice).
- **Design language (refreshed 2026-10-06, picked from Mobbin references — Skillshare hero, Deel cards, Zendesk/OpenPhone FAQ, Customer.io footer)**: calm and flat rather than showy.
  - Hero: deep blue gradient (`#003a78 → #0056b3 → #1a6fcf`, no near-white end — white text must stay readable), one solid white button + one white-outlined `.btn-secondary` (only used in the hero). **No photo background on purpose**: the available photos are an overcast phone shot of the school (1040px wide) and an architect's *rendering* of the future mosque — the first looks poor stretched full-width and the second would misrepresent what exists today. If a good daylight photo (≥1600px wide) of the school or mosque is supplied, the Skillshare pattern (photo + dark-blue overlay + same text and buttons) is the natural next step.
  - Cards (`.service-card`, `.service-detail-card`): white, 1px `#dde6f1` border, tiny shadow, 3px hover lift; the emoji sits in a soft circle (`.service-icon`, 64px / 56px on detail cards, smaller at ≤768 and ≤480). Don't go back to the old 8px lift + heavy blue shadow.
  - FAQ: plain rows separated by hairlines (no boxes), with a "Can't find your answer? Contact us" line.
  - Footer: three columns (brand / quick links / contact), then a bottom bar with the du'a, copyright (left) and social icons (right). Links are plain `href="#page"` (handled by the hash router); phone and email are real `tel:`/`mailto:` links. The bottom row has extra right padding ≥701px so the fixed floating contact buttons don't sit on top of the last social icon.
- **Dark "modern masjid" theme (branch `dark-home`, built 2026-10-06 — NOT on `main` until the user approves)**: direction taken from rahmaniyyah.com (deep navy + one warm accent + floating pill nav), which is an online academy, so only the *look* was borrowed (no pricing/app/login, no copied artwork). Tokens are CSS variables in `:root` at the end of `css/styles.css` (`--navy-*`, `--gold: #e9b949`, `--muted`, `--line`). The block at the end of the file overrides earlier rules on purpose; it is grouped under "DARK THEME".
  - Header: floating translucent pill at ≥1200px (logo + one-row nav, **Donate is the gold pill**); plain dark bar below 1200px. **Never put `backdrop-filter`/`transform` on `.header` or on `.header-content` at <1200px** — it turns the header into the containing block for the fixed slide-in menu and breaks it. The blur is only applied at ≥1200px, where the nav isn't fixed.
  - Home page (`#home-page`) order: hero ("Worship. Learn. Serve." — working copy, the user hasn't chosen final wording/name) → glass prayer-times panel overlapping the hero → at-a-glance stats (figures copied from the Students page) → three pillars (reuses the old Daily Prayers / Islamic Education / Community Programs cards and their Arabic) → Mission & Vision → Mudir → Campus → Donate band. `#home-page` is dark; **inner pages keep light bodies** (long text/tables read better), under the same pill header and footer.
  - Sizing: the "COMPACT SIZING" blocks at the end of `css/styles.css` tune the home page and footer to be short (phone home page went ~8,400px → ~5,300px). On phones the prayer times are one compact row per prayer, the three pillars are a swipeable scroll-snap row (next card peeks), hero buttons sit side by side, and quick links are two columns. The floating WhatsApp/email/phone buttons hide while the footer is on screen (IntersectionObserver in `js/script.js`, `.floating-actions.is-hidden`) so they never cover the footer.
  - The prayer panel keeps every id/class/data attribute `PrayerTimesManager` relies on (`#hijri-date`, `#next-prayer-name`, `#next-prayer-countdown`, `.prayer-time-display[data-prayer]`, `[data-prayer-card]`, `.is-next`). If you restyle it, don't rename those.
  - Not done / needs the user: Jumu'ah and iqamah (congregation) times — the API only gives start times and none are published on the site; real photos/video of the masjid, Jumu'ah, classes (the campus section still uses the school phone photo and the mosque *rendering*); final name/tagline (header subtitle "School of Arabic & Islamic Studies" is still shown on phones/footer); which button is primary (Donate was chosen as a placeholder).
- **FAQ accordion** (Admissions page, `#services`): native `<details class="faq-item" name="admissions-faq">` / `<summary>` — keyboard and screen-reader support with no JS, and the shared `name` makes it one-open-at-a-time in current browsers (older ones just allow several open). Every answer only restates facts already published elsewhere on the site (programmes, office hours, Contact page); fees, age limits, deadlines and required documents are **deliberately not stated** because the site has no verified source for them — add them only with real info from the user. Links inside answers use plain `href="#programmes"` / `href="#contact"`, which the hash router handles.
- **Bilingual content**: nearly every heading/label has an Arabic counterpart (`.arabic-text` divs), and this is a deliberate, consistent design choice across the whole site — preserve it when editing/condensing, don't drop the Arabic line just to save space.
- **Donation mechanics live in exactly one place**: the dedicated Donate page (`#donate`) has the actual bank account, mobile payment, and contact-for-help details. The Anniversary and Al-Uloom Central Mosque campaign pages each keep their own unique pitch/tiers/impact stats but link to the Donate page for the "how" instead of repeating the mechanics — this was a deliberate fix (2026-09-21, "Condense repeated and filler sections across the site") for what used to be the same bank details duplicated verbatim across three pages. Don't reintroduce that duplication when adding new donation-related content.
- **Real contact info** (for cross-checking against anything that looks off): phone/WhatsApp `+234 814 531 8366`, main email `markazululoomalagbado40@gmail.com`, addresses "1 Buyide Avenue, Alagbado, Lagos State, Nigeria" and "64B, Otubu bus stop, off Ogba road, Agege, Lagos", bank account "MARKAZUL ULOOM ALAGBADO LAGOS", 2005139960, FCMB.

## Open questions (need the user's real-world knowledge, not something to guess-fix)

- **Registrar name conflict**: Staff page names the Registrar as "Ustadh Mutohir Abdulazeez"; Administration page's contact section names the "Academic Registrar" as "Ustadh Yusuf Ibrahim" — different people, or one is stale? "Alhaji Musa Adebayo" (listed as CFO on the Administration page) also doesn't appear anywhere else on the site.
- **Stale "Upcoming Events"**: as of writing, the Events page lists events dated March/December 2025 as upcoming, but that's already in the past. Needs real current dates from the user, not invented ones.
- **`@markazululoom.org` email addresses**: Alumni page and Administration's department contacts (academic@, students@, finance@, alumni@) use domain `markazululoom.org`, which is a *different, real, separately-registered* domain from the site's actual domain `m-uloom.org` (confirmed it has DNS/MX records, so not obviously dead — but unconfirmed whether those specific mailboxes are actually monitored). Ask before assuming these work or fixing them.

## Discussed but not yet built (in rough priority order from earlier discussion)

- Dark mode (`prefers-color-scheme`, sitewide — larger effort, touches the whole stylesheet)
- On-site search across the now-13-page site
- Full EN/AR language toggle with mirrored RTL layout (large effort — the site already shows Arabic text throughout, but a real toggle is a bigger lift)

## How this user likes to work on this project

- Give real, direct recommendations and trade-offs rather than just listing every possible option neutrally; a ranked "here's what I'd do first and why" is welcomed.
- Explicit standing permission to use judgment on content/design decisions ("make any corrections you think will best fit," "reorder it the way you think best") — don't over-ask for confirmation on reasonable calls, but do flag anything that touches real facts you can't verify (names, dates, financial figures) rather than guessing.
- When asked to "condense" or clean up: be aggressive about removing genuine duplication and contentless filler (e.g. a whole section that just lists category names with no actual content), but never cut real, specific information (named people, concrete figures, unique campaign details) — the distinction that mattered in practice was "generic boilerplate nobody would miss" vs. "specific facts, even if verbose."
- Always test locally, then deploy, then re-verify on the live production URL before reporting something as done — this user's site is live and in active use, not a staging environment.
