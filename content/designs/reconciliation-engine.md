---
title: 'A read-only reconciliation engine'
stage: store
order: 4
summary: 'A proof of concept: a read-only engine in ksh and SQL that fingerprints each table and company code and classifies drift in both directions across three Oracle instances, with a drill-down HTML dashboard.'
proof: 'Proof of concept · 3 Oracle instances'
problem: 'The same data lives in three Oracle instances. When a row goes missing, or a delete never propagates, the instances drift apart, and the difference has to be found before anyone can fix it. The first questions are which tables and fields have to match, and how fresh "matching" needs to be: today, or all of history.'
constraints:
  - 'Read-only.'
  - 'Three production Oracle instances, so the check has to be light enough to run against live systems.'
  - 'Built on top of the production platform as a proof of concept, not a production service.'
why:
  - 'Comparing row counts only is cheap, but it cannot say which rows differ.'
  - 'Comparing every row is exact, but heavy on production.'
  - 'A fingerprint per table and company code (row count plus key hash) is cheap, stays read-only, and points at the keys that differ.'
  - 'Fingerprinting both windows, all rows and the last 30 days, answers both freshness questions: does it match today, and does it match across all of history.'
decision: 'A read-only engine in ksh and SQL that fingerprints each table and company code (row count plus key hash, over all rows and over the last 30 days) and classifies drift in both directions across the three instances, with a drill-down HTML dashboard that goes from a table to the exact keys.'
status: 'PoC'
revisit: 'Revisit if value drift starts to matter: add a value hash.'
guardsAgainst:
  - 'False drift from a bad key rule: it caught a flawed key heuristic before it produced false drift.'
  - 'Stale rows: it surfaced rows left behind by deletes that never propagated.'
  - 'One-way blind spots: drift is classified in both directions, so a row missing on either side shows up.'
knownLimits:
  - 'A row whose key landed but whose values differ would still pass: the fingerprint hashes keys, not values. Catching that needs a value hash too.'
outcome: 'A working proof of concept, in use for validation. The target is zero difference.'
related: ['/reconciliation/', '/stories/backfill-16900/']
---

Reconciliation must never be the thing that corrupts data, so it is read-only.
