# Architecture

Decisions so far: Astro, GitHub Pages (project repo), custom domain later, visual direction "Engineering blueprint".

## Stack
- Astro, static output. Plain CSS with custom properties. One small vanilla-JS script, for the diagram only.
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
- **Without JS:** a stage with a published story is a real `<a>` to it. A stage without one renders as plain text ("Story coming soon"), never a dead link.
- **With JS (M6), "Follow a record":** Next/Prev buttons and the arrow keys move one record through the stages. A detail panel shows the current stage's story summary.
- **Reduced motion:** with `prefers-reduced-motion`, the record jumps between stages instead of animating.
- **Mobile:** below 56rem the stages stack vertically and the arrows point down.

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
