# my-site

Personal site for Sricharan Anand, a Senior Data Platform Engineer. Concept: "the pipeline is the portfolio."
An interactive data-pipeline diagram is the hero, and each stage opens a short case study.
It also has a build log of how the site was made with Claude Code, plus resume, contact, LinkedIn and GitHub links.
Full brief: `docs/BRIEF.md`. Content source: `content/` (Markdown, editable without touching code).

Constraints: static site, free hosting, fast, mobile-friendly, accessible, dark mode.

## Confidentiality rule (never break)

Never write the employer's internal hostnames or server names, database or queue-manager instance names,
customer names, or internal tool names. This applies everywhere: code, content, commits, alt text, comments.
Describe systems generically ("three Oracle instances", "a mainframe CDC feed").
Public vendor products (IBM MQ, Oracle, Datadog, Pub/Sub) are fine. If unsure, leave it out and ask.

## Metrics rule

Use only metrics that appear in `content/`. Never invent, round up, or combine numbers.
Claims marked `VERIFY` in `content/resume.notes.md` (local, gitignored) are unconfirmed. Flag them, don't present them as final.

## Old public GitHub work (github.com/Charan2396), checked 2026-10-26

All of it is University at Buffalo coursework from 2018–19. Label it that way and describe only what the code shows.
- `Amazon-Dynamo-DB-`: a Dynamo-style replicated key-value store (Android, Java) with consistent hashing, 3-way replication and failed-node recovery. Fits the replication story well.
- `Information-Retrieval` + `Twitter-Search`: Solr search over tweets comparing BM25, DFR and VSM ranking, plus a Java servlet for search and sentiment.
- ML coursework (`CSE674-…`, `Pattern-Recognition`): probabilistic graphical models, explainable AI, VAE/GAN. Minor; one line at most.
- Skip: forks, tutorials, the take-home, the hackathon scaffold.
- Never link or mention: `Charan2396.github.io`, `4C4F5645`, `birthday`, `parents_new`. They are personal pages.
- `Charan2396.github.io` is live with a personal page. Deploying this site to the GitHub Pages user root would replace it, so use a project repo or another host.

## Commands

Astro and GitHub Pages; see `docs/ARCHITECTURE.md` and `docs/PLAN.md`. Node >= 22.23.4.
- Install: `npm install` · Dev: `npm run dev` · Build: `npm run build` · Preview: `npm run preview`
- Deploy: push to `main`, then GitHub Actions publishes to `charan2396.github.io/my-site`
