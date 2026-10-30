# Motion Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn fourteen supplied clips into a responsive, scroll and touch interactive motion chapter.

**Architecture:** Optimized local MP4s and WebP posters feed a React Three Fiber world. Scroll position drives the 3D camera and surfaces; buttons and gestures navigate to each scene's scroll position. The existing page remains the main portfolio.

**Tech Stack:** React, TypeScript, CSS, Vite, ffmpeg.

**Spec:** `docs/superpowers/specs/2026-10-21-motion-archive-design.md`

## Global Constraints

- Preserve existing project copy and hero interaction; keep the old VRM study source recoverable.
- Every supplied clip remains available in the archive.
- Only the selected video may load and play; reduced motion uses a static fallback.

## Review Focus

- Scroll selection must keep index and stage in sync.
- Touch swipe must not block vertical page scrolling.
- Keyboard controls must work from visible buttons.
- Out of view playback must stop.
- Mobile layout must keep title and controls legible.

### Task 1: Asset pipeline

- [x] Create optimized browser compatible MP4 and poster for all fourteen inputs.
- [x] Verify count, codecs, and output sizes.

### Task 2: Interactive chapter

- [x] Add a focused React component with scroll, click, keyboard, and swipe selection.
- [x] Add styling for desktop, mobile, and reduced motion.
- [x] Wire navigation and section labels.

### Task 3: Verify

- [x] Run the production build.
- [x] Check desktop and mobile browser behavior, including scrolling, selecting, and playback.
