# Plan

Each milestone is small, leaves the site deployable, and adds a build-log entry.

## 0. Repo and deploy skeleton
- Git housekeeping: rename `master` to `main`, gitignore `.DS_Store`, move private resume notes to gitignored `content/resume.notes.md`. (done)
- Rename `docs/website-BRIEF.md` to `docs/BRIEF.md` and update `CLAUDE.md` to match. (done)
- Scaffold minimal Astro, add the Actions deploy. (done) Create the GitHub repo `my-site` and push. (done)
- Done when a hello page is live at `charan2396.github.io/my-site`. **M0 complete 2026-10-26.**

## 1. Blueprint shell (done 2026-10-26)
- Color tokens, fonts, layout, header and footer.
- Light and dark themes.
- Base-path-safe links.

## 2. Content plumbing and guard (done 2026-10-26)
- Content collections and schemas.
- `/resume` page. (The build check fails on any HTML comment, so none can ship.) Hidden as `src/pages/_resume.astro` until its VERIFY figures are cleared; publish by renaming it and adding the nav link.
- The post-build check plus a local `.denylist`.
- Done when a planted test term fails the build.

## 3. Static diagram (done 2026-10-26)
- The five-stage diagram (HTML list, not SVG), with each stage linking to its story once one exists.
- Vertical layout on mobile.
- The story page template.

## 4. First story, end to end (done 2026-10-26)
We picked the story together and wrote it from resume facts plus your answers. You approved it before it shipped.
Shipped: `content/stories/one-bad-message.md` (Source stage).
Remaining candidates by stage. Every metric comes from `content/resume.md`; ⚠ means it is marked VERIFY in `content/resume.notes.md`.
- **Process:** splitter batch cut from 3–4 min to ~30 s ⚠
- **Store:** ~16,900 missing order lines recovered across 23 company codes ⚠
- **Queue:** store-and-forward MQ, over 90% less planned-downtime exposure ⚠ (needs manager OK)
- **Consume:** a real-time Pub/Sub data broker ⚠
- **Cross-cutting:** shut down a log-ingestion runaway of over one billion events per day ⚠

## 5. The record view (hero) (base done 2026-10-26)
Moved up from "Follow a record": this is what makes the site more than the resume.
- One **invented** order line (fake keys, generic field names, no internal names), shown as it looks at each stage:
  fixed-width mainframe change record → MQ message (header + payload) → JSON from the broker → Oracle row → Pub/Sub event.
- Selecting a stage (click, Next/Prev buttons, arrow keys) shows that stage's version of the record beside the diagram, plus its story link if one exists.
- Without JS, all five versions render as a readable sequence. With reduced motion, switching is instant.
- Sample data lives next to the stage list in `src/lib/stages.ts`, so there is one source.
- Optional tie-in: the Source stage can show the *corrupt* record, uneven line breaks included, linking to the one-bad-message story.

## 6. Remaining stories
- 3–5 more stories, each written once its VERIFY flags are cleared.
- Shipped 2026-10-28 via `docs/plans/2026-10-28-portfolio-v2.md` phases 1–2: resume, build log and projects pages are live,
  and all five stages have a story (VERIFY figures published as they are, per the v2 "go live first" decision).
- Shipped 2026-10-28: v2 phases 3 and 5 (Working with me page, home impact strip, reconciliation and Simple Dynamo explainers).

## 7. Build log page
- Backfill entries from the setup session: brief → CLAUDE.md → GitHub dig → this plan.

## 8. Projects, resume PDF, contact
- UB Dynamo-style replicated key-value store, framed as a prequel to the replication career.
- A Job Scout placeholder, hidden until the tool exists.
- The resume PDF and contact links.

## 9. Quality pass
- Lighthouse 95+ on all four scores.
- An axe accessibility check.
- A test on a real phone.
- Keyboard-only navigation.

## 10. Custom domain (later)
- Buy the domain, add `public/CNAME`, update `site` and drop `base`.
