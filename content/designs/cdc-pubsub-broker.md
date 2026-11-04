---
title: 'Co-building a CDC → Pub/Sub broker'
stage: consume
order: 1
summary: 'I co-built, from scratch, a real-time Java data broker that takes raw mainframe change data to Google Cloud Pub/Sub as JSON, for downstream teams in the cloud.'
proof: 'CDC → Pub/Sub broker, co-built from scratch'
problem: 'Mainframe change data capture produces a stream of raw change messages: every insert, update and delete on the source becomes one. That stream is the source of truth, but raw mainframe messages are not a format cloud consumers can pick up directly. Downstream teams use the data in Google Cloud, in AlloyDB and BigQuery, so they need it as a feed they can consume in real time.'
whoItServes: 'Downstream teams in Google Cloud. Mainframe changes reach them on Pub/Sub as JSON, and they load them into AlloyDB and BigQuery, so no consuming team has to decode mainframe formats itself.'
constraints:
  - 'Real time: the broker carries changes as they happen.'
  - 'The input is raw mainframe CDC messages.'
  - 'The consumers are in Google Cloud: AlloyDB and BigQuery.'
why:
  - 'Translating in one place, between the two worlds, means each downstream team does not have to solve the translation again.'
decision: 'Co-build, from scratch, a real-time Java data broker that sits between the two worlds. It converts raw mainframe CDC messages into JSON and publishes them to Google Cloud Pub/Sub.'
status: 'In place'
revisit: 'Revisit if a consuming team needs the change data in a shape other than JSON on Pub/Sub.'
guardsAgainst:
  - 'Every consumer writing its own mainframe decoder. The sample record on the home page shows the idea on an invented order line: the price arrives as a decimal string, and a source sequence number travels with each change for ordering. The sample is illustrative, not the production schema.'
outcome: 'Downstream teams consume the messages from Pub/Sub into AlloyDB and BigQuery. Mainframe changes now have a path to the cloud in a format those teams can use.'
related: ['/']
---

Translation done once, in one place, is translation every downstream team can trust. It was a shared build, and the credit is shared too.
