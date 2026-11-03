---
title: 'Co-building a CDC → Pub/Sub broker'
stage: consume
order: 1
summary: 'I co-built, from scratch, a real-time Java data broker that converts raw mainframe CDC messages into JSON and publishes them to Google Cloud Pub/Sub, where downstream teams consume them into AlloyDB and BigQuery.'
proof: 'CDC → Pub/Sub broker, co-built from scratch'
problem: 'Mainframe change data capture produces a stream of raw change messages: every insert, update and delete on the source becomes one. That stream is the source of truth, but raw mainframe messages are not a format cloud consumers can pick up directly. Downstream teams use the data in Google Cloud, in AlloyDB and BigQuery, so they need it as a feed they can consume in real time.'
constraints:
  - 'Real time: the broker carries changes as they happen.'
  - 'The input is raw mainframe CDC messages.'
  - 'The consumers are in Google Cloud: AlloyDB and BigQuery.'
decision: 'Co-build, from scratch, a real-time Java data broker that sits between the two worlds. It converts raw mainframe CDC messages into JSON and publishes them to Google Cloud Pub/Sub.'
outcome: 'Downstream teams consume the messages from Pub/Sub into AlloyDB and BigQuery. Mainframe changes now have a path to the cloud in a format those teams can use.'
related: ['/']
---

## What I took from it

A broker like this is mostly translation: it takes data in the shape the source produces and hands it on in the shape consumers need. Getting that translation right in one place means each downstream team does not have to solve it again. It was a shared build, and the credit for it is shared too.
