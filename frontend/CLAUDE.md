@AGENTS.md

# Mindshift frontend

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4. Pure view layer — calls the
NestJS backend API (see `../backend/CLAUDE.md`), never talks to the DB directly.

## Architecture convention — decided, follow for every new screen

Feature-folder structure: one directory per screen under `screens/`, each with its own
`components/` subfolder for screen-specific pieces.

**Shared/repeated-across-pages components go in `components/` at the frontend root** (sibling to
`screens/`), not duplicated per-screen — added 2026-08-27 once a second screen (Mission Report)
needed the same sidebar/top bar as Dashboard. Same `Name.tsx`/`Name.layout.tsx`/`index.ts` split
as screen-local components. Import via `@/components/<Name>`. Currently holds `SidebarNav`
(collapsible — see below) and `TopBar`. Only promote a component here once it's actually reused
by a second screen; don't pre-emptively generalize screen-local components.

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

Components: `WelcomeCard`, `MetricsGrid`/`MetricCard` (6 metric tiles), `ProfileGauge` (SVG
semicircle gauge), `ContinuePanel`/`MissionProgressCard` (2-up carousel of in-progress missions
with prev/next). `SidebarNav`/`TopBar` moved to the shared `components/` root 2026-08-27 — see
"Architecture convention" above and the "Shared components" section below.

Sidebar logo: real asset `public/edushift-logo.png` (provided by user). Nav item icons: real PNG
assets (`/dashboard.png`, `/instructions.png`, `/simulations.png`, `/performance.png`), `38x35`
Figma pixel dimensions — check `components/SidebarNav/SidebarNav.layout.tsx` for current values
rather than assuming approximate Tailwind spacing scale classes.

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

## Mission Report (`screens/Mission_report/`) — second screen, built 2026-08-27/28

Static/mock only, no API integration, no real navigation from Dashboard's mission cards into
this screen yet. Preview route: `app/mission-report/page.tsx` (hardcoded example data, not a
dynamic per-mission route). Built on local branch `mission-report` (created off `screen1`,
deliberately **not** tracking `origin/mission-report` per explicit user instruction — don't pull
that remote branch into this one, it's unrelated/possibly-stale content).

Components, all under `screens/Mission_report/components/`:
- **PrimaryBackButton** — `83×48` (grew wider than its Figma export once the user enlarged the
  chevron), `#FBFBFB` bg, chevron icon extracted from the real SVG (`public/back-chevron.png`,
  flipped via `-scale-x-100`), currently `25×35` (user tuned this by hand after several
  bigger/smaller iterations — don't "fix" it back to a rounder number).
- **TitleCard** — turned out to be a full mission-summary card (category badge + title +
  description + pushpin bullet list), not a bare title, despite the original "Title" ask. Card is
  `flex h-full flex-col` with the pin bullet list pushed to the bottom via `mt-auto` — needed
  because this card sits in a CSS grid next to `MissionScoreGauge` with default
  `align-items: stretch`, so it's taller than its own content and the list would otherwise float
  in the middle with dead space below it. **Icon sizing gotcha**: `public/pin-icon.png` is
  `144×98` but the actual visible pin glyph is a much smaller region inside it with real
  transparent padding baked into the file — sizing the display box to the wrong aspect ratio
  (e.g. `44×54` against the image's real `144:98` ≈ `1.47:1` ratio) creates *internal* letterbox
  whitespace inside the icon itself, which reads as "gap between rows" even after tightening the
  list's own `gap`. Fix was to size the box to the image's actual aspect ratio (`44×30`), not to
  crop the source file — cropping was tried first and reverted, user didn't want the icon's
  visible size changed, only the dead space around it removed.
- **MissionScoreGauge** — reuses Dashboard's `ProfileGauge` ring math exactly (same outer radius
  148, same 3-stop gradient), just recolored `#5570F1` bg, no kebab menu. Stroke width tuned down
  to `22` (from the inherited `29.6`). Min/max labels are `<text>` elements inside the SVG at the
  arc's exact endpoints (`CENTER_X ± RADIUS`), not a separate flex row below it — the flex-row
  version was visibly misaligned with the semicircle because the row spanned the full container
  width while the arc's actual endpoints sit inset from it by the stroke/radius math.
- **ImprovedCard** / **AttentionCard** / **LandedCard** — three `500×420` analysis cards (all
  three intentionally kept the same height as `LandedCard` after it was enlarged; width was
  bumped to `540` at one point for all three then reverted back to `500` per explicit user
  instruction — only the height match stuck). Row layout: plain `flex flex-wrap justify-between`
  with all three as direct children — **do not** reach for `mx-auto`/`ml-auto` wrapper divs to
  left/center/right-align 3 items in a row, even though it looks correct; auto-margins each
  consume a different, viewport-dependent amount of leftover space, so the two visual gaps end up
  unequal even though they look plausible at one window size. `justify-between` is the correct
  primitive for "first flush left, last flush right, middle centered, gaps equal" with exactly 3
  items.
  - Real icon assets, not lucide guesses, for all metric icons — user supplied files with spaces
    in filenames (e.g. `public/customer trust.svg`) referenced directly, no renaming needed.
  - `ImprovedCard`/`AttentionCard` delta trend icons: `public/Trend Icon.svg` (green, all
    `ImprovedCard` rows), `public/red Trend Icon.svg` / `public/down icon.svg` in `AttentionCard`
    — picked by the **sign of the delta value** (`delta >= 0` → red trend-up, negative →
    down-icon), not by row label. Keep it sign-based if more rows are added later.
  - `LandedCard`'s progress-bar track is the bar's own color at `10%` opacity
    (`${hex}1A` — hex alpha suffix), not a separate gray — confirmed from the source SVG's
    `fill-opacity="0.1"` on the same-color track path.
- **DecisionMetrics** — D1–D5 breakdown list, verdict badges (`excellent`/`good`/`risky` →
  `#1B8354`/`#5871EC`/`#F04438`). Chip icons reuse the `ImprovedCard`/`AttentionCard` icon assets
  but forced to solid black via CSS `brightness-0` filter, since those source SVGs have a
  hardcoded `#5871EC` fill (not `currentColor`) and the Figma export for this component wants
  black icons specifically — cheaper than requesting/maintaining a third icon-color asset set.
- **LowerButtons** — Replay (outline) / Next mission (filled, arrow icon extracted from the
  source SVG) — no real navigation wired, just optional `onReplay`/`onNext` callback props.

**Page-background color note**: tried `#F4F5FA` once (replacing `bg-gray-50`) and it rendered as
solid black. Root-caused to the compiled Tailwind CSS chunk never containing a rule for that
specific arbitrary class (`grep`-verified against the dev server's actual CSS output — other
arbitrary hex classes like `bg-[#5570F1]` compiled fine in the same build), so the div was
effectively transparent and the page's dark-mode `body` background (`globals.css` sets `#0a0a0a`
under `prefers-color-scheme: dark`) showed through. Reverted to `bg-gray-50` before the actual
cause was pinned down — if `#F4F5FA` (or any specific arbitrary bg color) is wanted again, expect
to have to actually debug the Tailwind compile, not just retry the edit.

## Shared components (`components/`) — SidebarNav, TopBar

Promoted here 2026-08-27 when Mission Report needed the same sidebar/top bar as Dashboard.
Dashboard's `Dashboard.layout.tsx` and `app/mission-report/page.tsx` both import from
`@/components/SidebarNav` / `@/components/TopBar` now — no more per-screen copies.

**SidebarNav** is the *collapsible* version built for Mission Report (`88px` icon-only ↔ `248px`
expanded), not Dashboard's original static `248px` sidebar — that static version was deleted in
the merge. Nav items use real `next/link` `href`s (`/`, `/instructions`, `/simulations`,
`/performance`) with active state computed from `usePathname()` (`'use client'` component)
instead of a hardcoded `active: true` flag on one item — this was a real bug fix, not just a
refactor: previously each screen had to guess/hardcode which nav item should look active
(Mission Report had no correct answer since it isn't one of the 4 nav items, and was hardcoding
"Performance" as a placeholder). Route-based active state means Mission Report correctly shows no
nav item active, no page-specific configuration needed.

**Expand/collapse is click-only, not hover** (changed 2026-08-28 — the original hover-based
`group-hover:` version "wasn't working" for the user and was replaced entirely, not layered on
top of). State is a plain `isPinned` boolean (`useState`); every width/opacity/padding/max-w
class that used to be `group-hover:*` is now a ternary driven by `isPinned` directly — no CSS
`:hover` pseudo-class involved anywhere in expansion logic anymore. The toggle button (icon:
`public/sidebar.svg`) sits in its own row directly above the "Dashboard" nav item, always visible
in both collapsed and expanded states (not tucked next to the logo — tried that first, hidden
until hover, user wanted it click-first and always reachable). Clicking it flips `isPinned`.

Nav icons are **responsive to `isPinned`**: `32×29` while collapsed (fits the collapsed row's
`38px` available width budget — `88px` sidebar − `40px` aside padding − `10px` link `px-[5px]`
padding), `46×42` once pinned open. This was a real bug found post-hoc: icons were bumped to a
single fixed `46×42` size on request, which overflowed/clipped in the collapsed `38px` budget
before being made responsive. The toggle icon itself stays a **fixed** `26×24` in both states
(doesn't grow with pin) — only its containing slot resizes (`32×29` → `46×42`) to stay
column-aligned with the nav icons above/below it. If adding more icons/rows to this sidebar,
recompute the collapsed-width budget before assuming a size fits.

Collapsed logo mark uses `public/Logo.svg` (a Figma pattern-fill export, rendered via plain
`<img>` since local SVGs need extra Next.js config for `next/image`) that cross-fades to the full
`edushift-logo.png` wordmark when pinned open (was hover-triggered, now `isPinned`-triggered same
as everything else).

**TopBar** (notification bell + AR/EN language toggle) has **no built-in padding** — unlike
Dashboard's old screen-local version which baked in `px-8 pt-6`. Each page positions it itself:
Dashboard wraps it in `<div className="flex justify-end px-8 pt-6">`, Mission Report puts it in
the same flex row as `PrimaryBackButton` (`justify-between`). Any new screen using `TopBar` needs
its own wrapper for spacing/alignment.

**Gotcha**: any page that renders `SidebarNav` needs `min-w-0` on the adjacent flex-1 content
div, or wide row content (e.g. multiple fixed-width cards) will push the whole page wider than
the viewport instead of wrapping — flex items don't shrink below their content's intrinsic width
by default. Bit both Dashboard and Mission Report during this work; fixed in both.

## Getting Figma designs into a session

No Figma MCP/API integration set up. Workflow that worked: user exports the frame as PNG or SVG
(Figma Export panel or Dev Mode inspect for exact CSS values) to a local path, then shares the
path directly — read directly with the Read tool (works for images; for SVGs with embedded
base64 images, `Read` can blow the context budget — use `grep`/`awk` on the raw file first to
pull out dimensions, colors, and structural paths before reading full content).
