# Clear Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]` / `- [x]`) syntax for tracking.

**Goal:** Replace the active 3D/video portfolio with a clear, responsive 2D portfolio focused on two real software case studies.

**Architecture:** Keep Vite and React, render one semantic single-page portfolio from a small typed project-data module, and use browser-native IntersectionObserver and dialog APIs for progressive enhancement. Styling and motion live in one token-driven CSS file, with no 3D runtime or animation library.

**Tech Stack:** React 19, TypeScript, Vite, CSS

**Spec:** `docs/superpowers/specs/2026-10-27-clear-portfolio-design.md`

## Global Constraints

- No Three.js, WebGL, 3D models, fantasy characters, or video atlas.
- Use only source-backed biography and project claims already present in the portfolio.
- Keep all content readable when JavaScript motion is unavailable or reduced.
- Preserve the previous version in `/Users/reikypratama/PortoFolio-backups/PortoFolio-3d-before-2d-rebuild-2026-10-27.tar.gz`.

## Review Focus

- Small phones: no horizontal overflow and project actions remain at least 44px tall.
- Reduced motion: content is visible and no reveal state can strand content at zero opacity.
- Dialog: Escape, backdrop click, close button, and focus behavior remain usable.
- External links: safe target attributes and clear accessible names.
- Images: reserved dimensions, useful alt text, lazy loading below the fold.

---

### Task 1: Active 2D portfolio

**Files:**
- Create: `src/projects.ts`
- Replace: `src/main.tsx`
- Replace: `src/style.css`
- Modify: `index.html`

- [x] Build semantic navigation, type-only hero, two project case studies, about/focus section, and contact footer.
- [x] Add a full-size screenshot dialog and progressive scroll reveals.
- [x] Implement the editorial token system and responsive compositions.
- [x] Verify with `npm run build`.

### Task 2: Remove inactive 3D application code

**Files:**
- Delete: `src/AstralScene.tsx`, `src/MotionArchive.tsx`, `src/ResonanceGallery.tsx`, `src/ResonanceScene.tsx`, `src/WorldDepth.tsx`, `src/WorldPage.tsx`, `src/atlas.css`, `src/world.css`, `src/motionScenes.ts`, `scripts/create-world-pages.mjs`
- Modify: `package.json`, `package-lock.json`, `README.md`

- [x] Remove Three.js, React Three Fiber, GSAP, Lenis, and their unused types from project dependencies.
- [x] Simplify the build command and document the new active experience.
- [x] Verify there are no active imports or references to 3D/video code.

### Task 3: Quality gates

**Files:**
- Inspect: compiled site and browser output

- [x] Run TypeScript/Vite production build.
- [x] Run taste lint and browser inspector; fix all meaningful failures.
- [x] QA desktop and phone widths, keyboard focus, dialog behavior, and reduced motion.
- [x] Confirm no console errors and no `<canvas>` or `<video>` elements in the active page.
