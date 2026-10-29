# Architecture

Decisions so far: Astro, GitHub Pages (project repo), custom domain later. Visual direction (2026-10-29): Apple-style system type, materials and springs, replacing the earlier "engineering blueprint" look.

## Stack
- Astro, static output. Plain CSS with custom properties. Small vanilla-JS scripts for the diagram and explainers.
- No React or UI framework, and no CSS framework.
- Fonts: none to load. The system font stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`) for UI and body text, and `ui-monospace, "SF Mono", Menlo, monospace` for records and code.

## Hosting
- GitHub Pages, deployed as a project repo from GitHub Actions with the official `withastro/action`.
- Astro config: `site: https://charan2396.github.io` and `base: /my-site`. Every internal link must respect `base`.
- This leaves the personal page at the `Charan2396.github.io` root untouched.
- Custom domain later: change `site`, remove `base`, add `public/CNAME`.

## Content
All content is Markdown in `content/` at the repo root, editable without touching code.
Astro content collections read it with the `glob` loader.
A schema validates the frontmatter, so a typo fails the build.

| Path | Frontmatter | Notes |
|------|-------------|-------|
| `content/stories/*.md` | `title, stage, order, summary, metrics[]` | `stage` is one of `source, queue, process, store, consume`. Each body runs problem → what I did → result. |
| `content/build-log/*.md` | `date, title` | Prompts, plans, what broke, what I learned. |
| `content/projects/*.md` | `title, summary, link?` | Job Scout (once it exists) and the UB Dynamo coursework. |
| `content/resume.md` | none | Rendered on `/resume`. |

## Pages
- `/`: the hero diagram plus a story index.
- `/stories/[slug]`: one page per story.
- `/build-log`, `/projects`, `/resume`.
- Contact, LinkedIn and GitHub live in the footer.
- The resume PDF is a file supplied in `public/`.

## Pipeline diagram (hero)
`src/components/Pipeline.astro` renders the five stages from `src/lib/stages.ts` as an ordered list of elevated cards joined by a thin line and chevron (CSS pseudo-elements):
Source (mainframe) → Queue (MQ) → Process (Java) → Store (Oracle) → Consume (Pub/Sub and downstream consumers).
It is HTML, not SVG: a list reflows from horizontal to vertical on narrow screens with one media query, and screen readers read it as an ordered list.
- **Without JS:** each stage card shows a "Read the story" `<a>` when the stage has a published story, otherwise no call to action at all (no placeholder, never a dead link). Below it (the record view), all five versions of one invented order line render as an ordered list: mainframe fixed-width record (before + after image), MQ message (MQMD + payload), the JSON the broker publishes, Oracle MERGE (staleness guard + insert branch) + row, Pub/Sub message whose base64 is computed in `stages.ts` (the build throws if it does not decode to the JSON shown). Samples and a per-stage `format` label live in `stages.ts` (`sample`, `corruptSource`); `[[ ]]` in a sample marks the changed field (qty), rendered as `<mark>`.
- **With JS, the record view:** the script unhides a transparent `<button aria-pressed>` over each stage card (the story link sits above it and stays clickable) plus Prev/Next (they wrap from 5 to 1). Click, Prev/Next, Left/Right arrows (while focus is inside the component, not inside a scrolling `<pre>`) or a drag/swipe change the stage. The logical state changes at once (`hidden` + `inert` on the other versions, `aria-pressed`, counter, `aria-live="polite"` announcement); the spring only moves pixels, so input is never locked out.
- **Record token:** an `aria-hidden` "4471/2" chip rides the top edge of the selected card. The script measures the card (`offsetLeft/Top`) and drives `transform` with two independent springs (x and y), so changing stage mid-flight retargets from where the chip is. Under reduced motion it jumps. Hidden without JS.
- **Incident replay (fig. 3):** step data lives in `src/lib/incident.ts` (title, caption, token stage, lit boxes, Process error state, backlog bar state, extra panel). Without JS the seven steps render as a static ordered timeline. With JS a "Replay the incident" button shows one step at a time: Prev/Next, Left/Right arrows, Escape or "Exit replay" to leave, optional Play (2s per step, hidden under reduced motion). The live region announces "Incident step N of 7: ...". The Process card gets an error state (`--error`/`--error-bg` tokens, plus a "rejecting" text flag) on steps 3-5. The backlog is a pill bar (animated with `scaleX`) with no axis, labelled "tens of thousands" (the story's own phrase). Clicking a stage or the record view's Prev/Next exits the replay. Each new step comes in with the spring (`enter()` in `spring.ts`).
- **Reduced motion:** the record view cross-fades in place (opacity only, no transform), the token jumps, steps fade without sliding; a global rule zeroes CSS transitions/animations.
- **Mobile:** below 56rem the cards stack vertically and the chevrons point down; below 40rem each card is one compact row.

## Design system
- All tokens live on `:root` in `src/styles/global.css`, redefined under `prefers-color-scheme: dark`. Components use `var(--…)` only (no hex). The measured WCAG ratios for every text token on every surface, both themes, are in the comment at the top of that file (lowest: muted on the accent tint, 4.53).
- Palette: neutral background (`--bg`), white/near-black elevated surfaces (`--surface`), one accent blue (`--accent` for text and links, `--accent-fill` for filled buttons and chips), `--error`/`--error-bg` for the incident state.
- Type: hierarchy from weight + size + leading together. Display sizes use negative tracking (-0.02 to -0.035em) and leading 1.05-1.12; body 17px, leading 1.5, tracking 0; small labels are semibold with slightly open tracking, sentence case. `font-optical-sizing: auto`, rem spacing.
- Surfaces: `.card` (radius 18px, soft layered shadow) and `.card-lg` (22px, deeper shadow) for bigger surfaces. Buttons: `.btn` (tinted pill) and `.btn-primary` (filled).
- Header: sticky, translucent (`backdrop-filter: blur(20px) saturate(180%)` over a 72% background), with a gradient scroll-edge fade instead of a divider. `prefers-reduced-transparency: reduce` makes it solid with no blur; `prefers-contrast: more` makes it solid with a border and gives every card a defined ink border.
- Press feedback: buttons and button-like cards scale to 0.97 on `:active` (100ms), `touch-action: manipulation`. The current page is a filled pill in the nav.

## Motion: one spring
- `src/lib/spring.ts` (no dependency): Apple's two parameters, damping ratio and response. Default critically damped (1.0, 0.35s); `MOMENTUM` (0.8) only after a flick. Closed-form solution, so `to()` restarts from the exact presentation value and velocity: interruptible, retargetable, no velocity discontinuity. rAF-driven, `transform`/`opacity` only. Also `project(v, 0.998)` (momentum projection), `rubberband()` and `enter()` (fade + 12px slide for steps; fade only under reduced motion).
- Self-check: `tests/e2e/spring.mjs` imports the TypeScript file with Node and asserts convergence, no overshoot at damping 1, overshoot then settle at 0.8, and position/velocity continuity across a mid-flight retarget.

## Gestures (record view)
- The five versions stack in one grid cell. `x` is the current panel's offset from rest; one neighbour ("peer") rides at `x ± width`. Only while a peer is showing is the track clipped (`overflow: clip`), so the shadow is whole at rest.
- Pointer Events on the track: 10px hysteresis, then horizontal wins (vertical intent is released to the page; the track has `touch-action: pan-y`). After that it tracks 1:1 with `setPointerCapture`, keeping a 100ms position history for velocity. On release the endpoint is projected with `project(v, 0.998)` and the nearer rest point (stay or the peer, one stage per gesture) wins; release velocity is handed to the spring. Past the first/last stage, and beyond one panel width, the drag rubber-bands.
- Grabbing a moving panel stops it where it is on screen. Records that overflow sideways keep native touch panning (`touch-action: pan-x pan-y`); the rest pass horizontal swipes to the carousel.

## Page transitions
- `<ClientRouter />` in `Base.astro` navigates without full reloads. Stage cards and story headers share `transition:name="stage-<key>"`, so a card morphs into its story header and back along the same path; one easing for all groups is set in `global.css`.
- Every interactive script registers through `onPage(init)` from `src/lib/stepper.ts`: `init(signal)` runs on each `astro:page-load`, and the `AbortSignal` aborts on `astro:before-swap`, so listeners (window `resize` included) never stack up and running springs stop.
- The hero materializes once per visit (opacity + scale, CSS, flagged in `sessionStorage`). No looping or ambient motion anywhere. Below 56rem a sticky stage strip (solid, under the translucent header) mirrors the diagram during the replay.

## Tests
- `tests/e2e/*.mjs`: Playwright suites (record view, incident replay, pages, stories, working-with-me, motion, explainers, review2, redesign: gestures, materials, preferences, press feedback) plus the Node-only spring self-check, at 390/820/1280, light/dark, no-JS and reduced motion.
- `npm run test:e2e` (`tests/run.mjs`) serves the existing `dist/` with `astro preview --port 4329` and runs every suite; build first. `BASE_URL` points it at another host (e.g. the live site), `CHROME_PATH` picks the browser (default: system Chrome on macOS, else Playwright's chromium). Screenshots go to `tests/e2e/.out/` (gitignored).

## Confidentiality and metrics guard (build time)
Private VERIFY notes live in `content/resume.notes.md`, which is gitignored. Astro's Markdown passes HTML comments into the page source, so as a backstop:
- `scripts/check-dist.mjs` runs after every build (locally and in CI) and fails the build if `dist/` contains `<!--`, `VERIFY`, or any term from `.denylist`.
- `.denylist` is a local list of internal names. It is gitignored and never committed, because committing it would publish the names.
- Story `metrics[]` must be quoted from `content/resume.md`. This is enforced by review, not code.

## Out of scope for now
Manual dark-mode toggle (follows the OS for now), analytics, CMS, search, blog/RSS, contact form.
