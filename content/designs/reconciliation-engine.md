---
title: 'A read-only reconciliation engine'
stage: store
order: 4
summary: 'A proof of concept: a read-only engine in ksh and SQL that fingerprints each table and company code and classifies drift in both directions across three Oracle instances, with a drill-down HTML dashboard.'
proof: 'Proof of concept · 3 Oracle instances'
problem: 'The same data lives in three Oracle instances. When a row goes missing, or a delete never propagates, the instances drift apart, and the difference has to be found before anyone can fix it.'
constraints:
  - 'Read-only.'
  - 'Three Oracle instances.'
  - 'Built on top of the production platform as a proof of concept, not a production service.'
decision: 'A read-only engine in ksh and SQL that fingerprints each table and company code (row count plus key hash, over all rows and over the last 30 days) and classifies drift in both directions across the three instances, with a drill-down HTML dashboard.'
outcome: 'It caught a flawed key heuristic before it produced false drift, and surfaced stale rows left by deletes that never propagated.'
heldUp: 'It is a working proof of concept, in use for validation.'
related: ['/reconciliation/', '/stories/backfill-16900/']
---
