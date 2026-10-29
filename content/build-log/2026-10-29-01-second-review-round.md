---
title: 'Second review round: four simulated reviewers'
date: 2026-10-29
---

I had Claude Code read the live site as four reviewers: a recruiter, a hiring manager (who scored it 69/100), an engineer who has built change-data-capture pipelines, and a portfolio strategist. Then I shipped what they agreed on.

**What changed**

- The home page now says what I own in its first sentence: correctness for a real-time CDC backbone, and how I repair data by replaying from the source.
- A short "how I got here" strip shows Amazon, Bizanalytica and Ingram Micro, with links to the Simple Dynamo ring and the resume.
- The home story list is titles only. The summaries repeated what the stage boxes already said.
- Fig. 1 says it is simplified: the Pub/Sub broker reads the same mainframe change stream as the splitter, not Oracle. On phones the boxes are compact, so the stories come sooner.
- Fig. 2's invented record holds up to inspection now: a before and an after image, MQ times in UTC, the price as a decimal string, a MERGE with a staleness guard and an insert branch, and a Pub/Sub message whose base64 decodes to the JSON shown. The build fails if it doesn't.
- Story pages say "Stage 3" instead of "fig. 3", because two stories share a stage.
- The reconciliation explainer has an honest-limit note: key hashes miss a row whose values didn't land.
- Working with me no longer implies log-based CDC or direct warehouse loading, and three one-line cards became one.
- Projects run reconciliation, Simple Dynamo, then this site in one line. The Twitter search work is folded into the grad-school note.

**What still needs my input**

- Resume wording and how the HR titles are shown.
- More detail on the mechanisms inside the stories. Only I can supply those facts.
- Testimonials: still waiting on a LinkedIn export.
