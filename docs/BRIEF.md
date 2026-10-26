# Personal Website — Project Brief

> Save as `docs/BRIEF.md` in the repo.

## Goal
A personal site that shows my career and what I've uniquely done — not a generic resume page.
Secondary goal: building it should teach me how I build with Claude Code, and the site should show that process.

## Concept: "The pipeline is the portfolio"
Most engineer sites are a bio + project cards. Mine should feel like the systems I build.
- **Hero:** an interactive diagram of a data pipeline (mainframe → message queue → processing layer → database → downstream consumers). A visitor can follow one "record" through it; each stage opens a story about real work I did there.
- **Stories, not bullets:** 4–6 short case studies written as incident/outcome narratives (problem → what I did → measurable result). Use only verified metrics from my resume.
- **Build log:** a "How this site was built with Claude" page — prompts, plans, what went wrong, what I learned. Updated as I build.
- **Side projects:** Job Scout (my local AI job-search tool) as a case study once it exists.
- Standard bits: resume download, contact, LinkedIn (linkedin.com/in/charansri), GitHub.

## Confidentiality rule (important)
No internal hostnames, server names, database instance names, customer names, or internal tooling names from my employer. Describe systems generically ("three Oracle instances", "a mainframe CDC feed").

## Constraints
- Static site, fast, free hosting (e.g., GitHub Pages / Cloudflare Pages / Vercel).
- Content in Markdown so I can edit stories without touching code.
- Looks good on mobile; accessible; dark mode.

## Open questions for you (Claude) to ask me before architecture
- Framework (Astro / Next static export / plain HTML)?
- Visual direction — show me 2–3 distinct options before building.
- Domain name?
