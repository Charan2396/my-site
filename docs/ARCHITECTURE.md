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
One Astro component holds an inline SVG with five stages:
Source (mainframe) → Queue (MQ) → Process (Java) → Store (Oracle) → Consume (Pub/Sub and downstream consumers).
- **Without JS:** each stage is a real `<a>` link to its story, so the diagram works with no script, stays accessible and gets indexed.
- **With JS, "Follow a record":** Next/Prev buttons and the arrow keys move one record through the stages. A detail panel shows the current stage's story summary.
- **Reduced motion:** with `prefers-reduced-motion`, the record jumps between stages instead of animating.
- **Mobile:** the diagram stacks vertically, using the same SVG with a different `viewBox`.

## Theme
- Light-first blueprint palette: background `#f7f8fa`, ink `#1b2a41`, line `#2f6fde`, a faint grid.
- Dark variant via `prefers-color-scheme`.
- All colors are tokens on `:root`. Contrast must meet WCAG AA.

## Confidentiality and metrics guard (build time)
Private VERIFY notes live in `content/resume.notes.md`, which is gitignored. HTML comments in Markdown would still reach the page source, so as a backstop:
- A small remark plugin strips HTML comments from rendered Markdown.
- A post-build check fails the build if `dist/` contains `<!--`, `VERIFY`, or any term from `.denylist`.
- `.denylist` is a local list of internal names. It is gitignored and never committed, because committing it would publish the names.
- Story `metrics[]` must be quoted from `content/resume.md`. This is enforced by review, not code.

## Out of scope for now
Manual dark-mode toggle (follows the OS for now), analytics, CMS, search, blog/RSS, contact form.
