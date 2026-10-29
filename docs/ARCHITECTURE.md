# Architecture

Decisions so far: Astro, GitHub Pages (project repo), custom domain later, visual direction "Engineering blueprint".

## Stack
- Astro, static output. Plain CSS with custom properties. Small vanilla-JS scripts for the diagram and explainers.
- No React or UI framework, and no CSS framework.
- Fonts: self-hosted IBM Plex Sans and IBM Plex Mono, two weights each.

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
`src/components/Pipeline.astro` renders the five stages from `src/lib/stages.ts` as an ordered list of boxes with CSS connector arrows:
Source (mainframe) → Queue (MQ) → Process (Java) → Store (Oracle) → Consume (Pub/Sub and downstream consumers).
It is HTML, not SVG: a list reflows from horizontal to vertical on narrow screens with one media query, and screen readers read it as an ordered list.
- **Without JS:** each stage box shows a "Read the story" `<a>` when the stage has a published story, otherwise no call to action at all (no placeholder, never a dead link). Below it (fig. 2), all five versions of one invented order line render as an ordered list: mainframe fixed-width record (before + after image), MQ message (MQMD + payload), the JSON the broker publishes, Oracle MERGE (staleness guard + insert branch) + row, Pub/Sub message whose base64 is computed in `stages.ts` (the build throws if it does not decode to the JSON shown). Samples and a per-stage `format` label live in `stages.ts` (`sample`, `corruptSource`); `[[ ]]` in a sample marks the changed field (qty), rendered as `<mark>`.
- **With JS, the record view:** an inline script unhides a transparent `<button aria-pressed>` over each stage box (the story link sits above it and stays clickable) plus Prev/Next. Click, Prev/Next or Left/Right arrows (while focus is inside the component, not inside a scrolling `<pre>`) show one version at a time via `hidden`; an `aria-live="polite"` region announces the stage.
- **Record token:** an `aria-hidden` "4471/2" marker sits on the top border of the selected box in fig. 1. The script measures the box (`offsetLeft/Top`) and sets a CSS `transform`, so it slides horizontally on desktop and vertically when stacked. Hidden without JS.
- **Incident replay (fig. 3):** step data lives in `src/lib/incident.ts` (title, caption, token stage, lit boxes, Process error state, backlog bar state, extra panel). Without JS the seven steps render as a static ordered timeline. With JS a "Replay the incident" button shows one step at a time: Prev/Next, Left/Right arrows, Escape or "Exit replay" to leave, optional Play (2s per step, hidden under reduced motion). The live region announces "Incident step N of 7: ...". The Process box gets an error state (`--error`/`--error-bg` tokens, plus a "rejecting" text flag) on steps 3-5. The backlog is a bar with no axis, labelled "tens of thousands" (the story's own phrase). Clicking a stage or fig. 2's Prev/Next exits the replay.
- **Reduced motion:** with `prefers-reduced-motion`, the record and the token jump between stages instead of animating (global rule zeroes transitions/animations).
- **Mobile:** below 56rem the stages stack vertically and the arrows point down.

## Page transitions and motion
- `<ClientRouter />` in `Base.astro` navigates without full reloads. Stage boxes and story headers share `transition:name="stage-<key>"`, so a box morphs into its story header.
- Every interactive script registers through `onPage(init)` from `src/lib/stepper.ts`: `init(signal)` runs on each `astro:page-load`, and the `AbortSignal` aborts on `astro:before-swap`, so listeners (window `resize` included) never stack up.
- Motion layer on fig. 1: a one-time CSS draw-in of boxes and connectors, `aria-hidden` packets on the connectors (paused during the replay and when the tab is hidden), a sticky stage strip during the replay below 56rem, and a CSS lift plus corner marks on hover/focus. Reduced motion turns all of it off. No JS animation library.

## Tests
- `tests/e2e/*.mjs`: Playwright suites (record view, incident replay, pages, stories, working-with-me, motion, explainers, review2) at 390/820/1280, light/dark, no-JS and reduced motion.
- `npm run test:e2e` (`tests/run.mjs`) serves the existing `dist/` with `astro preview --port 4329` and runs every suite; build first. `BASE_URL` points it at another host (e.g. the live site), `CHROME_PATH` picks the browser (default: system Chrome on macOS, else Playwright's chromium). Screenshots go to `tests/e2e/.out/` (gitignored).

## Theme
- Light-first blueprint palette: background `#f7f8fa`, ink `#1b2a41`, line `#2864d2` (darkened from `#2f6fde` to pass AA on the background), a faint grid.
- Dark variant via `prefers-color-scheme`.
- All colors are tokens on `:root`. Contrast must meet WCAG AA.

## Confidentiality and metrics guard (build time)
Private VERIFY notes live in `content/resume.notes.md`, which is gitignored. Astro's Markdown passes HTML comments into the page source, so as a backstop:
- `scripts/check-dist.mjs` runs after every build (locally and in CI) and fails the build if `dist/` contains `<!--`, `VERIFY`, or any term from `.denylist`.
- `.denylist` is a local list of internal names. It is gitignored and never committed, because committing it would publish the names.
- Story `metrics[]` must be quoted from `content/resume.md`. This is enforced by review, not code.

## Out of scope for now
Manual dark-mode toggle (follows the OS for now), analytics, CMS, search, blog/RSS, contact form.
