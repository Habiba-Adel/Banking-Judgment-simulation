@AGENTS.md

# Mindshift frontend

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4. Pure view layer — calls the
NestJS backend API (see `../backend/CLAUDE.md`), never talks to the DB directly.

## Architecture convention — decided, follow for every new screen

Feature-folder structure: one directory per screen under `screens/`, each with its own
`components/` subfolder for screen-specific pieces.

Each component is split into two files (user's explicit choice — logic separate from JSX/layout):

```
screens/<ScreenName>/
  <ScreenName>.tsx          <- logic: assembles data, passes props to layout
  <ScreenName>.layout.tsx   <- JSX/markup, Tailwind classes, composes child components
  types.ts                  <- shared prop/data shapes for this screen
  index.ts                  <- re-export
  components/
    <ComponentName>/
      <ComponentName>.tsx          <- props/types/logic
      <ComponentName>.layout.tsx   <- JSX markup (imported by the .tsx file)
      index.ts                     <- re-export
```

Icons: `lucide-react` (added as a dependency for the Dashboard screen — no icon set was
provided, so these are a placeholder choice, not pixel-matched to Figma icons).

## Screens built so far

**Dashboard** (`screens/Dashboard/`) — first screen implemented, 2026-08-25. Static/mock only,
no API integration yet. Built from two Figma exports (empty state + continue/in-progress state),
which turned out to be the same layout with different data — implemented as **one** component
driven by a `MOCK_HAS_PROGRESS` boolean in `Dashboard.tsx` (stand-in for what will later be a
real check against `GET /playthroughs/:id/progress`), not two separate screens.

Components: `SidebarNav`, `TopBar`, `WelcomeCard`, `MetricsGrid`/`MetricCard` (6 metric tiles),
`ProfileGauge` (SVG semicircle gauge), `ContinuePanel`/`MissionProgressCard` (2-up carousel of
in-progress missions with prev/next).

Sidebar logo: real asset `public/edushift-logo.png` (provided by user), swapped in for the
placeholder icon+text originally used. Nav item icons: user replaced placeholder lucide icons
with real PNG assets (`/dashboard.png`, `/instructions.png`, `/simulations.png`,
`/performance.png`) and dialed in exact Figma pixel dimensions (`h-[1024px] w-[248px]` sidebar,
`p-[20px]`, `38x35` icons) directly in `SidebarNav.layout.tsx` — check that file for current
values rather than assuming approximate Tailwind spacing scale classes.

**Still approximate / not yet Figma-exact:**
- Colors elsewhere on the dashboard (indigo-600 primary on WelcomeCard/MetricsGrid, gray-50
  background, emerald-600 deltas) — visual guesses, not pulled from Figma. `ProfileGauge` and
  `ContinuePanel`/`MissionProgressCard` now use real Figma values (`#5570F1` accent, `#FBFBFB`
  card bg, `#1C1C1C` text) — see below.

### ProfileGauge — matched to real Figma SVG export (2026-08-25)

Built from an actual exported gauge SVG (not a screenshot guess). viewBox `310x226`, ring outer
radius 148, stroke 29.6 (20% of radius), flat `strokeLinecap="butt"` ends (intentional — user
confirmed rounded caps look wrong for this gauge), 3-stop gradient
`#FBFBFB → #FFCC91 (28.8%) → #FFBA6B (86.5%)`, solid `#FBFBFB` track, circular-bordered kebab
button, bottom min/max labels at 40% opacity.

**Reusable lesson**: converting a Figma donut/ring (built from outer+inner radius via clipPath)
into an SVG `<path>` arc with `stroke` — the arc's centerline radius must be
`outerRadius - strokeWidth/2`, not the outer radius itself, or the ring overflows the canvas and
gets clipped by the viewBox (looks like "cut off" ends). Apply this to any future Figma
ring-via-clip component.

### ContinuePanel / MissionProgressCard — matched to real Figma SVG export (2026-08-25)

Rebuilt from an exported `ContinueWatching.svg` (note: its declared root `viewBox` didn't match
the actual content bounds — always derive true dimensions from the outer container path, not
the `<svg width/height>` attrs, when a Figma export looks suspiciously small). Real assets now
in `public/`: `mission-thumb-vip-friend-request.svg`, `mission-thumb-screenshot-shortcut.svg`
(real bank photos, keyed by mission id in `Dashboard.tsx` mock data via `thumbnailSrc`),
`mission-go-arrow.png` (per-card "go to mission" button icon), `carousel-arrow-left.svg` /
`carousel-arrow-right.png` (prev/next icons — recolored to `#5570F1` via CSS `mask-image` since
the source assets are their own translucent-blue color, not swappable via a simple tint).

Accent color `#5570F1` (not indigo-600) used for progress bar, card borders, nav-button borders.
Card bg `#FBFBFB`, title text `#1C1C1C`.

Layout deliberately diverged from the Figma export per user request after first pass:
- **Fixed card height** (`224×320`, thumbnail `150px`), not flex-to-content — first version
  flexed height to fit 2-line titles like the Figma mock, user didn't like it, reverted to
  fixed with `truncate` on the title and the step/button row pinned to the bottom (`mt-auto`).
- **Horizontal scroll carousel**, not a 2-up grid with page-based prev/next — `ContinuePanel.tsx`
  no longer does `visibleMissions` slicing; renders all missions in a `scrollRef`-tracked flex
  row (`overflow-x-auto`, `snap-x snap-mandatory`, scrollbar hidden), prev/next buttons call
  `scrollBy` one card-width instead of paging. Cards sized at `224px` specifically so the second
  card visibly peeks/cuts off at the panel's fixed `320px` column edge (`p-5` padding leaves
  ~280px inner width) — intentional per user ("second card cut a bit").
- Nav buttons: `32×32`, `4px` radius (not full/pill), `2px` border `#5570F1`, `10px` padding.

## Getting Figma designs into a session

No Figma MCP/API integration set up. Workflow that worked: user exports the frame as PNG or SVG
(Figma Export panel or Dev Mode inspect for exact CSS values) to a local path, then shares the
path directly — read directly with the Read tool (works for images; for SVGs with embedded
base64 images, `Read` can blow the context budget — use `grep`/`awk` on the raw file first to
pull out dimensions, colors, and structural paths before reading full content).
