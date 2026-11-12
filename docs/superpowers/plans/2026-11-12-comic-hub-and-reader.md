# Comic Hub & Dual-Mode Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bottom navbar "Topik" tab with a dedicated "Komik" Hub and a full-featured dual-mode Comic Reader (Webtoon vertical scroll & Horizontal page swap) powered by Google Drive comic archives.

**Architecture:** 
1. Build an indexing script to scan and consolidate Google Drive comic archives (`Komik List` & `Komik Part 2`), deduplicating cross-folder titles and exporting optimized metadata into `public/appVideo/comics.json`.
2. Replace bottom navbar "Topik" button with "Komik" (with `book-open` icon) while keeping top navbar Topic Drawer untouched.
3. Create `#view-comic` with search, creator filters, and responsive 2-column poster cards showing covers, titles, creators, and page counts.
4. Implement fullscreen `#comic-reader-modal` with instant toggle between Webtoon (continuous vertical scroll with intersection-observed page indicator) and Swap (horizontal snap-paging with tap-to-turn zones and controls overlay).
5. Add progress memory (`localStorage` reading history and last-read page/chapter per comic).

**Tech Stack:** HTML5, Tailwind CSS, Lucide SVG icons, Vanilla JavaScript (ES6+), Google Drive CDN thumbnail proxy (`=w480` / `=w1200`), Node.js scanning scripts.

**Spec:** User requested replacing bottom "Topik" tab with "Komik", keeping video topics in top navbar, listing comics similar to Drama Hub with search + cover cards + page counts, supporting both Webtoon vertical scroll and Horizontal swap reading modes, and organizing Drive folder `14g1mRS64P3MscBtNuNL92OPq9TIm2hNn`.

## Global Constraints
- Zero breaking changes to Shorts feed, Drama hub, 18+ hub, profile, or landscape player.
- Topic drawer in top navbar (`#open-topic-drawer-btn`) remains fully functional.
- Zero external heavy reader dependencies (no giant bundle bloat; clean native DOM + CSS snap for fast mobile load).
- All image requests must use responsive Google Drive endpoints (`=w480` for covers, `=w1200` for pages) with lazy loading and error fallbacks.
- Strictly adhere to accuracy rules: verify via tests and headless Chrome CDP before committing.

## Review Focus
1. **Navigation view switching:** Switching between Shorts, Komik, Drama, 18+, and Profil must cleanly pause offscreen media and update active nav icons/labels.
2. **Webtoon vs Swap mode toggle:** Switching modes in reader must preserve the current page position seamlessly without page jump or blank screen.
3. **Page count accuracy & lazy loading:** High page counts (e.g. 50+ images) in Webtoon mode must not freeze DOM or crash mobile memory.
4. **Single-chapter vs Multi-chapter comics:** Reader must gracefully support both direct image collections and multi-subfolder chapter series.
5. **Search & Creator filtering:** Searching by title or filtering by creator (e.g. Ackerman, Midoriko Kobayashi, Teysia) must filter instantly in real-time.

---

### Task 1: Google Drive Comic Scanner & Metadata Generation (`comics.json`)

**Files:**
- Create: `scripts/build_comics_data.mjs`
- Create: `public/appVideo/comics.json`
- Test: `scratch/test_comics_json.mjs`

- [ ] **Step 1:** Write `scripts/build_comics_data.mjs` to crawl folder `14g1mRS64P3MscBtNuNL92OPq9TIm2hNn` (`Komik List` & `Komik Part 2`). Deduplicate titles across both directories, resolve chapters/pages, pick first page as cover, count pages, and output `public/appVideo/comics.json`.
- [ ] **Step 2:** Run script and verify `public/appVideo/comics.json` is generated with valid JSON structure, non-empty covers, and accurate page counts.
- [ ] **Step 3:** Write `scratch/test_comics_json.mjs` unit test to validate schema (checks: all entries have `id`, `title`, `author`, `cover_file_id`, `page_count > 0`, `chapters` array with valid page IDs). Run test to ensure green.

---

### Task 2: Bottom Navigation & HTML Markup for Comic Hub & Reader

**Files:**
- Modify: `public/appVideo/index.html`

- [ ] **Step 1:** In `index.html`, replace `#nav-btn-topics` in bottom navbar with `#nav-btn-comic` (Icon: `book-open`, label: `Komik`).
- [ ] **Step 2:** Add `#view-comic` container matching the Drama Hub structure:
  - Top header with search bar (`#comic-search-input`, clear button).
  - Creator filter pill tabs / dropdown (`#comic-author-filter`).
  - Sort dropdown (`#comic-sort-btn` & sheet: Abjad, Halaman Terbanyak, dsb).
  - Counter badge (e.g. `230+ Komik`).
  - Grid container `#comic-list-grid` (2-column responsive layout).
- [ ] **Step 3:** Add `#comic-reader-modal` structure:
  - Fullscreen fixed container (`z-50 bg-black`).
  - Reader header with back button, title, chapter badge, and mode toggle (`#reader-mode-toggle` with Webtoon/Swap indicator).
  - Reader content container (`#reader-content`) containing Webtoon scroll viewport and Swap paging viewport.
  - Reader footer with page progress bar, page indicator (`#reader-page-indicator` e.g. `1 / 28`), and prev/next chapter navigation.
- [ ] **Step 4:** Run `git diff` or inspect DOM to confirm semantic tags and zero visual regressions on other views.

---

### Task 3: JavaScript Implementation for Comic Hub, Filtering, and Dual-Mode Reader

**Files:**
- Modify: `public/appVideo/app.js`

- [ ] **Step 1:** Add `book-open` to `SVG_ICONS` in `app.js`.
- [ ] **Step 2:** Initialize `allComics = []`, `activeView` support for `'comic'`, and fetch `comics.json` alongside `videos.json`.
- [ ] **Step 3:** Implement `renderComicHub()` and `filterAndRenderComics()` with instant search, creator filter, and sorting.
- [ ] **Step 4:** Implement `openComicReader(comic, chapterIdx = 0, pageIdx = 0)` and `closeComicReader()`:
  - Render pages with lazy loading (`loading="lazy"` + progressive load).
  - Implement **Mode Webtoon**: vertical scroll container with `IntersectionObserver` on each page image updating the bottom page counter in real-time.
  - Implement **Mode Swap**: horizontal carousel / snap-scroller or tap left/right to turn pages with smooth transition.
  - Implement mode toggle button switching between Webtoon and Swap without losing the current page position.
  - Wire page jump slider and chapter dropdown.
  - Store reading history in `localStorage` (`teleshorts_comic_history`).
- [ ] **Step 5:** Wire bottom navbar navigation to switch to `'comic'` view cleanly, pausing any playing videos and updating active tab styles.

---

### Task 4: Sync, Build, and Browser CDP Automation Verification

**Files:**
- Modify: `scratch/audit_cdp.mjs`
- Sync: `/Users/reikypratama/Random/index.html` & `app.js`
- Test: Local Chrome CDP test & Live GitHub Pages test

- [ ] **Step 1:** Run `node --check` on `app.js`.
- [ ] **Step 2:** Sync files to `/Users/reikypratama/Random/` and run `npm run build`.
- [ ] **Step 3:** Extend `scratch/audit_cdp.mjs` to test Comic Hub:
  - Verify bottom navbar has `Komik` button.
  - Click `Komik` tab -> verify `#view-comic` becomes visible and Shorts video is paused.
  - Verify comic cards render with covers, titles, and page counts.
  - Test search input filtering results.
  - Test opening Comic Reader -> verify modal opens with reader controls.
  - Test toggling between Webtoon and Swap mode.
  - Test page indicator updates and closing reader returns cleanly to Comic Hub.
- [ ] **Step 4:** Run local CDP audit and verify 0 console errors, 0 exceptions, 0 bad responses.

---

### Task 5: Commit, Deploy, Live Verification, and Drive Cleanup

- [ ] **Step 1:** Stage and commit changes (`feat(appVideo): add comic hub and dual-mode reader (v4.0.0)`).
- [ ] **Step 2:** Push to remotes (`pages main` and `origin main`).
- [ ] **Step 3:** Verify live deployment on `https://reiky03.github.io/appVideo/index.html` via `curl` and run `audit_cdp.mjs`.
- [ ] **Step 4:** Clean up any test artifacts from Google Drive and summarize changes for the user.
