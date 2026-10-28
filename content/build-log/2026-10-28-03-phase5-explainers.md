---
title: 'Phase 5: two explainers you can step through'
date: 2026-10-28
---

I added two pages that work like the incident replay on the home page: Prev and Next (or the arrow keys) walk through the steps, and without JavaScript every step shows as a numbered list.

**Reconciliation:** [Finding data that didn't arrive](../reconciliation/) walks through my reconciliation proof of concept on invented data: three instances, one table, six rows. A row goes missing in one target, a delete never reaches another, and the fingerprints (row count plus key hash, over all rows and the last 30 days) show both kinds of drift. The fingerprints and drift classes are computed from the sample rows when the site builds, so the badges and the text can't disagree.

**Simple Dynamo:** the [ring explainer](../projects/simple-dynamo/) places the five nodes by the real SHA-1 of their port numbers, which gives the same ring order my 2018–19 coursework used. Three scenarios: a write that lands three copies, a write that a dead replica misses and later gets back, and a read that falls back when the coordinator is down. Each one says what the code does not do.
