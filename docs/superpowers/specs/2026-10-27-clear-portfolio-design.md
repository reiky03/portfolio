# Clear Portfolio Design

## Intent

Replace the current fantasy/3D presentation with a direct, two-dimensional portfolio that makes Reiky's real software work easy to understand and inspect.

## Goals

- Lead with Reiky's name, role, location, and value as a backend/full-stack developer.
- Give OpsFlow and OrderForge most of the visual space, using their four real screenshots and source-backed descriptions.
- Make education, current experience, technical focus, GitHub, LinkedIn, and email easy to find.
- Work well with keyboard, touch, reduced motion, and small screens.

## Non-goals

- No Three.js, WebGL, 3D models, fantasy characters, or video atlas.
- No invented clients, metrics, testimonials, employers, or project outcomes.
- No generic card grid or decorative animation that competes with the work.

## Direction

Use an editorial 2D composition: a type-only opening, large full-width project imagery, alternating flat colour fields, and a typographic closing. Orange, ink, and paper form the palette. Bodoni Moda is the display face and Jost is the text face, with robust system fallbacks.

The portfolio's own material becomes the visual device: real product screens are treated like working documents on a review table. The live interaction is a screenshot viewer that lets visitors inspect each product screen at full size.

Motion is restrained: section parts reveal once on scroll, links and controls respond quickly, and screenshots gently scale on hover. All content remains visible without JavaScript animation and motion is disabled under `prefers-reduced-motion`.

## Content order

1. Identity and positioning.
2. Selected work: OpsFlow.
3. Selected work: OrderForge.
4. About, education, and current role.
5. Technical focus.
6. Direct contact and profile links.

## Constraints

- Keep the existing React + Vite foundation.
- Remove unused 3D and smooth-scroll dependencies.
- Preserve old source and assets in a recoverable external archive.
- Keep the original downloaded motion and 3D assets out of the active page; do not destroy them.
- Production build and browser QA are required before completion.
