---
title: 'Say it once, show the reasoning'
date: 2026-11-04
---

I had Claude Code look at how strong data engineers present their work (Gunnar Morling, Robin Moffatt, Chris Riccomini, Martin Kleppmann, Eugene Yan, Jay Kreps, Airbnb's Minerva write-ups), then ran one presentation pass over the site with it. No new facts: every sentence that changed restates the resume, a story, a design doc or copy that was already here.

**What changed**

- Each headline number now lives on its own design or story page. Elsewhere the site links to it in a few words, and an end-to-end test counts the repeats.
- The hero lost its three proof chips; the "Selected designs" section right below lists the same work. The Stack line names only what the designs and stories show.
- Decisions that shaped a design moved into that design doc, as its Decision box with a status and a "revisit if" line. The decision log keeps the five standalone ones, renumbered, each with the same two lines.
- Design docs can now carry "Who it serves", "Why this approach", "What it guards against", "Known limits" and "What went wrong along the way". Each shows only when filled in. The reconciliation engine has all but the last: the reasoning that used to sit on the team page moved there.
- The generic "What I took from it" paragraphs became one sentence each.
- The team page is about a third shorter: cards that restated a design or story are now one line and a link. The 90-day plan and the "If your stack looks different" table stay.

**What I still need to write**

- Baselines: what the store-and-forward reduction is measured against, and how; the broker's volume and latency; what the log runaway cost; how the missing order lines were detected.
- The alternatives I actually weighed for the broker, store-and-forward, the EMS-to-MQ move and the Active Directory model.
- Which teams consume the broker's feed, and what changed for them.
- What I personally owned in the co-built and co-designed work.
- When each decision was made, and the status of the EMS-to-MQ migration and the Active Directory model.
