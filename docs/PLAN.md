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

## 2. Content plumbing and guard
- Content collections and schemas.
- `/resume` page, with HTML comments stripped.
- The post-build check plus a local `.denylist`.
- Done when a planted test term fails the build.

## 3. Static diagram
- The five-stage SVG, with each stage linking to its story.
- Vertical layout on mobile.
- The story page template.

## 4. First story, end to end
We pick the story together and write it from resume facts only. You confirm its metric before it ships.
Candidates by stage. Every metric comes from `content/resume.md`; ⚠ means it is marked VERIFY in `content/resume.notes.md`.
- **Process:** splitter batch cut from 3–4 min to ~30 s ⚠
- **Store:** ~16,900 missing order lines recovered across 23 company codes ⚠
- **Queue:** store-and-forward MQ, over 90% less planned-downtime exposure ⚠ (needs manager OK)
- **Source:** isolated a corrupt message that caused tens of thousands of rejections
- **Consume:** a real-time Pub/Sub data broker ⚠
- **Cross-cutting:** shut down a log-ingestion runaway of over one billion events per day ⚠

## 5. Remaining stories
- 3–5 more stories, each written once its VERIFY flags are cleared.

## 6. "Follow a record" interaction
- The JS enhancement on the diagram.
- Keyboard support and a reduced-motion mode.
- The detail panel.

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
