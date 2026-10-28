# Portfolio v2 plan

## Primary goal
A hiring manager opens the site on a laptop or phone. Within a minute they have watched one record move through a real data platform and seen it break and recover. They have read four or five real incidents and a page on how Sricharan works on a team. They leave thinking "this person would make our data platform more reliable." All of it is live now, with unconfirmed figures published as they are and confirmed later.

## Decisions already made (by Sricharan, 2026-10-28)
- **Go live first.** Figures marked VERIFY in `content/resume.notes.md` are published as they are and confirmed later. That means `/resume` gets published and stories may use those figures. The leak check still blocks the literal word "VERIFY" and any HTML comment from reaching `dist/`.
- **Keep the engineering-blueprint look, but make it fancier**, with motion that is meaningful, not decorative.
- **Agents:** research is done (portfolio survey, LinkedIn, GitHub). A single builder agent executes the phases below in order, one fresh context per phase.

## Rules every phase inherits
- `CLAUDE.md` confidentiality: no employer-internal hostnames, instance names, queue-manager names, customer names or internal tool names. Sample data is invented.
- Figures come only from `content/resume.md` and `content/stories/*.md`. Where a quantity isn't in those, show a shape (a bar or a fill) with no number.
- Every interactive piece works without JS (all content readable), is operable with the keyboard alone, announces changes through `aria-live`, respects `prefers-reduced-motion`, has no horizontal page scroll at 390px, and meets WCAG AA contrast in both themes.
- No new npm dependencies unless a phase names one. No React.

---

## Phase 0: Documentation discovery (done 2026-10-28)
> **How this serves the primary goal:** the builder uses only APIs that exist in Astro 7.4.2, so nothing breaks on the live site.

**Allowed APIs**, all verified in `node_modules/astro`:
- **Page transitions:**
  - `import { ClientRouter } from 'astro:transitions'` goes in `<head>`. Its only prop is `fallback?: 'none'|'animate'|'swap'` (`components/ClientRouter.astro:2-8`).
  - Directives: `transition:name`, `transition:animate` (`'initial'|'slide'|'fade'|'none'`) and `transition:persist` (`dist/types/public/elements.d.ts:18-20`).
  - Events: `astro:page-load`, `astro:after-swap` and `astro:before-swap` (`dist/transitions/events.js`).
  - Reduced motion turns transition animations off automatically (`components/viewtransitions.css:56-64`).
- **Content:**
  - `getCollection`, `getEntry` and `render(entry)` from `astro:content`. Use `entry.id`, not `slug`.
  - `glob` and `file` from `astro/loaders`. `file('content/x.yaml')` parses YAML out of the box (`dist/content/loaders/file.js:21`), and each item needs an `id`.
  - `z` from `astro/zod` is zod v4, so use `z.url()` and `z.email()`.
  - The config lives at `src/content.config.ts`.
- **Images:** `Image` and `Picture` from `astro:assets`. Local images are imported from `src/assets`, and `alt` is required.
- **Fonts:** the existing top-level `fonts` config and `<Font>` in `Base.astro`. Reuse them as they are.
- **Markdown:** Sätteri is the default processor. remark plugins are not available, and `<!--` in content fails the build. That failure is intended.

**Project patterns to copy:**
- `src/lib/url.ts`: every internal link and `public/` asset goes through `url()`.
- `src/lib/stages.ts` and `src/lib/incident.ts`: data lives in `src/lib`, and markup reads it.
- `src/components/Pipeline.astro`: the progressive-enhancement pattern. It renders everything as HTML, keeps controls `hidden`, and the script un-hides them. It also has the `aria-live` region and the reduced-motion `matchMedia`.
- `src/styles/global.css` holds the tokens. `scripts/check-dist.mjs` is the leak check.
- Existing Playwright suites: `m5.mjs` (16 checks) and `m5c.mjs` (26 checks), in the job tmp dir. They must keep passing. If that dir is gone, copy them into `tests/e2e/`. (See Phase 6.)

**Anti-patterns:**
- No `ViewTransitions` import; it's `ClientRouter` now.
- No `entry.render()` and no `entry.slug`.
- No `z.string().url()`.
- No `src/content/config.ts`.
- No `markdown.remarkPlugins`.
- Don't describe the Dynamo coursework with "quorum", "vector clocks" or "versioning". The code has none of them.

---

## Phase 1: Publish what already exists
> **How this serves the primary goal:** the resume, the build log and the projects are real content sitting unpublished. Shipping them makes the site complete enough to share today.

1. **Resume:**
   - Rename `src/pages/_resume.astro` to `resume.astro`.
   - Add nav entries in `src/layouts/Base.astro` for Resume, Projects, Build log and "Working with me". The last one waits until Phase 3 ships.
   - Remove the "hidden until VERIFY" comment.
2. **Build log page** at `src/pages/build-log.astro`: list the `buildLog` collection newest first. Each entry renders inline with `render()`, under a date heading in mono. Copy the `.prose` styles.
3. **Projects** in `content/projects/*.md`:
   - Fields: title, summary, link, order.
   - Write `simple-dynamo.md`, `twitter-search-ir.md` and `this-site.md` (my-site, linking to the repo and the build log).
   - Use the GitHub report's copy-ready summaries word for word. They are reproduced in the appendix at the bottom of this plan.
   - Label coursework "University at Buffalo coursework, 2018–19".
   - Add one ML line inside the IR project, or as a short `ml-coursework.md`.
   - Add `src/pages/projects.astro` to list them.
4. Add a build-log entry for this phase.

**Verify:**
- `npm run build` passes and check-dist is clean.
- `/resume/`, `/build-log/` and `/projects/` return 200 in preview.
- The nav shows `aria-current` on each page.

**Anti-patterns:**
- Never link `Information-Retrieval/Project 1/` (it contains committed API keys; see the user action list).
- Don't link the personal repos.

---

## Phase 2: Fill the pipeline with real stories
> **How this serves the primary goal:** four stages are empty. A full pipeline of incidents is the evidence a resume can't give.

Add one story per empty stage, each written only from its resume bullet. Use short sections: problem → what I did → result. Keep each to 150–250 words, and leave out anything the bullet doesn't say.

| Stage | File | Source bullet in `content/resume.md` | Metrics boxes |
|---|---|---|---|
| Queue | `store-and-forward.md` | store-and-forward IBM MQ architecture | "over 90% less planned-downtime exposure" |
| Process | `splitter-30-seconds.md` | message-splitter tuning | "~3–4 min → ~30 s for a 10K batch", "10,000+ lines removed" |
| Store | `backfill-16900.md` | guarded backfill and purge tooling | "~16,900 records recovered", "23 company codes" |
| Consume | `pubsub-broker.md` | real-time Java broker to Pub/Sub | none (the bullet has no number), or "JSON to Pub/Sub" as a label |

Add an optional fifth story, the cross-cutting one: the Datadog observability bullet, with "over one billion events per day" shut down. It is filed under `process` with `order: 2`, or left as a draft.

**Verify:**
- All five stage boxes show "Read the story".
- Every metric string appears verbatim, or near-verbatim, in `content/resume.md`. The builder pastes a side-by-side table to prove it.

**Anti-patterns:**
- No invented timelines, causes or numbers.
- No internal names.

---

## Phase 3: "Working with me" page and the impact strip
> **How this serves the primary goal:** this answers "how would they contribute to my team?", which was the user's explicit ask.

1. `src/pages/working-with-me.astro` has sections built only from resume facts, written in first person:
   - **How I keep systems up:** the DR playbook, patching runbooks, the self-healing repair, observability.
   - **How I change things safely:** the non-prod → prod upgrade sequence, the controlled rollback, guarded backfills with zero-difference reconciliation.
   - **How I raise the bar:** the PR standard, the platform roadmap, mentoring, the hiring panel, introducing source control.
   - **What I'd do in my first 90 days on your team:** a short, honest list derived from the above, framed as intent, not as claims.
   - **Testimonials:** this section renders only if `content/testimonials.yaml` exists (via the `file()` loader, schema `{id, quote, role}`). For now it doesn't, so nothing renders.
2. **Impact strip** on the home page, below the hero lede: four tiles with real figures from the resume summary and bullets: "300+ tables", "30+ downstream teams", "~10M rows/day" and "3 Oracle instances".
   - The figures count up once when scrolled into view, using `IntersectionObserver`.
   - Under reduced motion, or without JS, they show the final number immediately.

**Verify:**
- The page builds and every claim maps to a resume bullet. The builder lists the mapping.
- The tiles have the final values in the HTML source, so they work without JS.

---

## Phase 4: The fancy layer (motion that means something)
> **How this serves the primary goal:** the first 10 seconds decide whether a visitor explores. Each effect below shows how data moves; none is pure decoration.

1. **Diagram draws itself on load.** The connectors and box borders animate in like a drafting pen, once per visit, using CSS `stroke-dashoffset` or `clip-path`. Reduced motion skips it.
2. **Ambient flow.** Small square "packets" travel along the fig. 1 connectors in a slow loop, so the pipeline looks alive. They pause when the replay is running and when the tab is hidden. They are off under reduced motion and `aria-hidden`.
3. **Page transitions:**
   - Add `<ClientRouter />` to `Base.astro`.
   - Give each stage box and its story page's header a matching `transition:name={`stage-${key}`}`, so clicking a stage morphs into the story header.
   - **Required refactor:** move `Pipeline.astro`'s script body into `document.addEventListener('astro:page-load', …)`. Register the window `resize` listener with an `AbortController` that aborts on `astro:before-swap`, so listeners don't stack up across navigations.
   - Re-run `m5`/`m5c` after navigating home → story → back.
4. **Mobile replay fix.** On narrow screens, while the replay is active, a compact sticky strip of the five stage numbers stays pinned at the top of fig. 3 and shows the lit and error states. The visitor sees the pipeline react without scrolling.
5. **Hover and focus polish.** A stage box lifts slightly on hover and focus, and blueprint "dimension lines" appear on the selected box. Pure CSS, AA contrast.

**Verify:**
- The existing suites pass.
- New checks pass:
  - the transition between pages keeps the stepper working;
  - no duplicate resize listeners after 3 navigations (count them by wrapping `addEventListener` in the test);
  - packets are not present under reduced motion;
  - the sticky strip is visible at 390px during the replay.

**Anti-patterns:**
- No JS animation libraries.
- No auto-playing sound.
- No animation that conveys information which is missing from the static content.

---

## Phase 5: Two explainers that prove depth
> **How this serves the primary goal:** correctness and distributed systems are the two things a senior data platform hire must show, and almost no portfolio lets you *operate* them.

1. **Reconciliation explainer** (fig. 4 on the home page, or `/reconciliation/`). It is based on the resume's proof-of-concept bullet: fingerprint each table per company code (row count plus key hash, full and last-30-days), compare across three instances, and classify drift both ways.
   - Invented sample data: three small tables.
   - The visitor clicks "inject drift" (delete a row in one instance), "fingerprint", and then "repair (replay keys)".
   - The fingerprints change, the drift is classified as missing-in-target or stale-in-target, and the replay brings it back to zero difference.
   - Same stepper pattern as fig. 3; reuse the controls and `aria-live` code.
2. **Dynamo ring explainer** on `/projects/simple-dynamo/`, or embedded in the projects page.
   - An SVG ring of 5 nodes, faithful to the code (see the appendix for the facts with line references).
   - Scenario A: hash a key, find its coordinator, replicate to 2 successors, collect the acks.
   - Scenario B: a node dies during a write, the sender buffers the write, the node rejoins with "alive", and pulls the buffered writes back.
   - Scenario C: a read fails over to the last replica.
   - Caption the honest limits: no quorum, and the buffer is not per-destination.

**Verify:**
- Keyboard-only walkthrough of both explainers.
- Without JS, both render as numbered static steps.
- No numbers beyond the invented sample data and the resume.

---

## Phase 6: Verification and go-live
> **How this serves the primary goal:** "live" only counts if it works on a phone, with a keyboard, and leaks nothing.

1. Move the Playwright suites into the repo at `tests/e2e/`, with `playwright` as a devDependency. This is the one dependency allowed. Add `npm run test:e2e`, which uses system Chrome via `executablePath`, with a fallback to `npx playwright install chromium`.
2. Run the full suite at 390, 820 and 1280, light and dark, with and without JS, and with reduced motion.
3. Run `npx lighthouse` on the preview URL (no install; one-off `npx`) for home, a story, and `/working-with-me/`. Target 95+ on Performance, Accessibility, Best Practices and SEO, and record the scores in the build log.
4. Grep `dist/` and the commit diff for internal-name patterns, using `.denylist`. Confirm check-dist is clean.
5. Commit each phase separately. Push to `main`, watch the Actions run, and curl every page on the live URL.
6. Update `docs/PLAN.md`, `docs/ARCHITECTURE.md` and `CLAUDE.md` (Commands: add `test:e2e`), and add a build-log entry.

---

## Not in this plan
- A custom domain.
- A resume PDF (needs the user's file).
- RSS or sitemap (needs `@astrojs/sitemap`/`@astrojs/rss`; later).
- Testimonials content (waiting on the LinkedIn export).
- The Job Scout project (doesn't exist yet).
- Confirming the VERIFY figures (Sricharan, later).
- A manual theme toggle.

## User actions (not code)
1. **LinkedIn export:** use Settings → Data privacy → "Get a copy of your data" (Recommendations, Positions, Education), or "Save to PDF". Drop it outside the repo and point the builder at it. LinkedIn blocks automated reading, so this is the only way to get your recommendations.
2. **Pick the job title used across the site:** "Senior Data Platform Engineer" (resume) or "Senior Database Engineer (Data Platform)" (LinkedIn headline). Note that the LinkedIn headline lists Airflow as a core skill, while the resume says it's a proof of concept.
3. **Security, independent of this site:** the GitHub research found what look like real API credentials committed in an old public coursework repo. Revoke them.

## Appendix: verified GitHub facts (for Phases 1 and 5)
**Simple Dynamo** (`Charan2396/Amazon-Dynamo-DB-`, `SimpleDynamoProvider.java`):
- SHA-1 hex hashing (L973-981), across 5 emulator nodes (L58-62).
- The coordinator is the first node hash ≥ the key hash, wrapping around (L938-950, L281, L760). There are 3 copies: the coordinator plus 2 successors (L731, L953-969).
- Writes go to each replica in sequence, with acks (L733-787). Storage is SQLite, last write wins (`DatabaseHelper` L13-17).
- Reads go to the coordinator and fall back to coordinator + 2 (L493-511).
- Failed writes are buffered in `failedavd` (L746-751, L780). On rejoin the node sends "AVD alive", and peers return the buffered writes (L388, L660-682, L884-903).
- There is no quorum, versioning or vector clocks; those stubs are uncalled (L120-249).

Copy-ready summary:
> A Dynamo-style distributed key-value store running on five Android emulator nodes, written in Java. Keys and node IDs are hashed with SHA-1 onto a consistent-hashing ring. Each key belongs to the first node clockwise and is replicated to that node's next two successors, so every key has three copies. Nodes talk over raw TCP sockets, with a background server thread and serialized client tasks. Each replica stores data in SQLite, and a newer write replaces an older one. Reads go to the key's coordinator and fall back to the last replica in the chain if the coordinator is down. Writes that a dead replica misses are buffered by the sender, and a restarting node pulls them back from its peers when it rejoins.

**Twitter search and IR** (CSE 535, Fall 2018):
> Collected tweets with the Twitter API and indexed them in Apache Solr. Compared VSM, BM25 and DFR ranking with trec_eval MAP on 15 training queries in English, German and Russian; tuning BM25 raised MAP from 0.6675 to 0.6774. Built a Java servlet search app with faceted filters for topic, city and language, Solr facet breakdowns, and Stanford CoreNLP sentiment scoring of results. Also built Boolean TAAT/DAAT query processing over a hand-built inverted index.

**ML** (one line): probabilistic graphical models, explainable AI, SVMs, Bayesian-network and junction-tree inference, neural networks, RBMs and VAEs (CSE 674; Pattern Recognition, Spring 2019).
