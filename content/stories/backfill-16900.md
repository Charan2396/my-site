---
title: 'Recovering ~16,900 missing order lines, safely'
stage: store
order: 1
summary: 'I built guarded backfill and purge tooling, with idempotent inserts, cascade guards and zero-difference reconciliation, that recovered ~16,900 missing order-line records across 23 company codes.'
metrics: ['~16,900 order-line records recovered', '23 company codes', 'zero-difference reconciliation']
---

## The problem

Order-line records were missing: about 16,900 of them, across 23 company codes. Missing child rows mean incomplete orders. Separately, a purge of parent rows needed to be sized, and it ran to hundreds of thousands of rows.

Fixing data in a production store is risky in both directions. Insert the same row twice and you have created a new problem. Let a delete reach further than intended and you have lost data you meant to keep.

## What I did

I built guarded backfill and purge tooling with three safeguards:

- **Idempotent inserts**, so running the backfill again does not create duplicates.
- **Cascade guards**, so a delete cannot reach further than intended.
- **Zero-difference reconciliation**, so the work counts as done only when the comparison shows no difference.

Separately, I root-caused an Oracle trigger foreign-key race behind missing child records using systematic evidence queries, and proposed a non-invasive fix.

## The result

The tooling recovered ~16,900 missing order-line records across 23 company codes, and sized a purge of hundreds of thousands of parent rows.

## What I took from it

When you repair data, the guards are the job. Making each step safe to repeat, and checking the result until the difference is zero, is what lets you touch production data with confidence.

See how reconciliation finds drift: [interactive explainer](../../reconciliation/)
