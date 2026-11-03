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
| `content/stories/*.md` | `title, stage, order, summary, short?, metrics[]` | `stage` is one of `source, queue, process, store, consume`. Each body runs problem → what I did → result. |
| `content/build-log/*.md` | `date, title` | Prompts, plans, what broke, what I learned. |
| `content/projects/*.md` | `title, summary, link?` | Job Scout (once it exists) and the UB Dynamo coursework. |
| `content/designs/*.md` | `title, stage?, order, summary, proof, problem, constraints[], decision, outcome, options?, tradeoffs?, nonGoals?, heldUp?, related?` | Design docs (Google design-doc / ADR shape), resume facts only. Optional sections render only when filled in. |
| `content/decisions.yaml` | `id, title, context, decision, consequence?, related?` | Decision log (Nygard ADRs), `file()` loader, rendered on `/decisions/`. |
| `content/resume.md` | none | Rendered on `/resume`. |

## Pages
- `/`: hero (positioning line + 3 proof chips to designs), impact and career strips, the pipeline (fig. 1 + fig. 2), "Selected designs" (5 cards) and "From running it: incidents and fixes" (the 4 stories).
- `/designs/` and `/designs/[slug]`: design docs. `/decisions/`: the decision log (linked from `/designs/` and the footer).
- `/stories/[slug]`: one page per story; `one-bad-message` also hosts the incident replay (fig. 3).
- Nav: Designs · Working with me · Projects · Resume. Designs stays current (`aria-current="true"`) on design doc pages. Footer: Email, LinkedIn, GitHub, Decisions, Build log.
- `/build-log`, `/projects`, `/resume`.
- Contact, LinkedIn and GitHub live in the footer.
- The resume PDF is a file supplied in `public/`.

## Pipeline diagram (hero)
`src/components/Pipeline.astro` renders the five stages from `src/lib/stages.ts` as an ordered list of elevated cards joined by a thin line and chevron (CSS pseudo-elements):
Source (mainframe) → Queue (MQ) → Process (Java) → Store (Oracle) → Consume (Pub/Sub and downstream consumers).
It is HTML, not SVG: a list reflows from horizontal to vertical on narrow screens with one media query, and screen readers read it as an ordered list.
- **Without JS:** each stage card links to the design for its stage ("Read the design"), else its first story ("Read the story"), plus a smaller link to a second story (`short` frontmatter, e.g. "and the log runaway"). No design or story, no link. Links are built in `index.astro`. Below it (the record view), all five versions of one invented order line render as an ordered list: mainframe fixed-width record (before + after image), MQ message (MQMD + payload), the JSON the broker publishes, Oracle MERGE (staleness guard + insert branch) + row, Pub/Sub message whose base64 is computed in `stages.ts` (the build throws if it does not decode to the JSON shown). Samples and a per-stage `format` label live in `stages.ts` (`sample`, `corruptSource`); `[[ ]]` in a sample marks the changed field (qty), rendered as `<mark>`.
- **With JS, the record view:** the script unhides a transparent `<button aria-pressed>` over each stage card (the story link sits above it and stays clickable) plus Prev/Next (they wrap from 5 to 1). Click, Prev/Next, Left/Right arrows (while focus is inside the component, not inside a scrolling `<pre>`) or a drag/swipe change the stage. The logical state changes at once (`hidden` + `inert` on the other versions, `aria-pressed`, counter, `aria-live="polite"` announcement); the spring only moves pixels, so input is never locked out.
- **Record token:** an `aria-hidden` "4471/2" chip rides the top edge of the selected card. The script measures the card (`offsetLeft/Top`) and drives `transform` with two independent springs (x and y), so changing stage mid-flight retargets from where the chip is. Under reduced motion it jumps. Hidden without JS.
- **Incident replay (fig. 3):** `src/components/IncidentReplay.astro`, rendered only on `/stories/one-bad-message/` after the story body; step data in `src/lib/incident.ts`. Without JS the seven steps render as a static timeline. With JS a "Watch one bad message…" button shows one step at a time: Prev/Next (disabled at the ends), Left/Right arrows, Escape or "Exit replay", optional Play (2s per step, hidden under reduced motion), and a polite live region ("Incident step N of 7: ..."). A row of the five stages lights up per step (Process in the error state on steps 3-5); below 56rem it pins under the sticky header. The backlog is a pill bar labelled "tens of thousands". Steps enter with `enter()` from `spring.ts`.
- **Reduced motion:** the record view cross-fades in place (opacity only, no transform), the token jumps, steps fade without sliding; a global rule zeroes CSS transitions/animations.
- **Mobile:** below 56rem the cards stack vertically and the chevrons point down; below 40rem each card is one compact row.

## Design system
- All tokens live on `:root` in `src/styles/global.css`, redefined under `prefers-color-scheme: dark`. Components use `var(--…)` only (no hex). The measured WCAG ratios for every text token on every surface, both themes, are in the comment at the top of that file (lowest: muted on the accent tint, 4.53).
- Palette: neutral background (`--bg`), white/near-black elevated surfaces (`--surface`), one accent blue (`--accent` for text and links, `--accent-fill` for filled buttons and chips), `--error`/`--error-bg` for the incident state.
- Type scale: every `font-size` is a token on `:root` (`--text-xs` 13, `-sm` 15, `-md` 17, `-lg` 20, `-xl` 20-26, `-2xl` 26-34, `-3xl` 34-48, `-display` 44-72; fluid steps bottom out at the step below on phones). The tracking/leading per step is in the comment beside them. Home renders 8 sizes at 1280 and 7 at 390 (`tests/e2e/designed.mjs`). Exception: SVG text in `DynamoRing.astro`, which is in viewBox units. Spacing: `--space-1`…`--space-20` (4px steps).
- Jargon: `src/components/Gloss.astro` + `src/lib/gloss.ts` wrap terms (EBCDIC, MQMD, PIC 9(7)V99, CCSID 37, CDC, IMS/Db2/VSAM, DogStatsD, MERGE, idempotent) in `<abbr title>` on first use. Markdown bodies use inline `<abbr>`.
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
- The hero materializes once per visit (opacity + scale, CSS, flagged in `sessionStorage`). No looping or ambient motion anywhere. Below 56rem the replay's stage row (solid, under the translucent header) stays pinned while the steps scroll.

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
