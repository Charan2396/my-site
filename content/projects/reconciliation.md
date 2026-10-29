---
title: Cross-instance reconciliation
summary: Read-only drift detection across three Oracle instances. A working proof of concept, in use for validation.
label: Proof of concept, built on the production platform
order: 0
---

A read-only engine in ksh and SQL that fingerprints each table and company code (row count plus key hash, full and last-30-days) and classifies drift in both directions across three Oracle instances, with a drill-down HTML dashboard. It caught a flawed key heuristic before it produced false drift, and surfaced stale rows left by deletes that never propagated.

It is a proof of concept, not a production service. The explainer below walks through the method on invented sample data.
