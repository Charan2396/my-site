---
title: 'From mainframe CDC to Pub/Sub, built from scratch'
stage: consume
order: 1
summary: 'I co-built, from scratch, a real-time Java data broker that converts raw mainframe CDC messages into JSON and publishes them to Google Cloud Pub/Sub, where downstream teams consume them into AlloyDB and BigQuery.'
metrics: ['mainframe CDC → JSON → Pub/Sub']
---

## The problem

Mainframe change data capture produces a stream of raw change messages: every insert, update and delete on the source becomes one. That stream is the source of truth, but raw mainframe messages are not a format cloud consumers can pick up directly.

Downstream teams use that data in Google Cloud, in AlloyDB and BigQuery, so they need it as a feed they can consume, in real time.

## What I did

I co-built, from scratch, a real-time Java data broker that sits between the two worlds. It does two things:

- **Converts** raw mainframe CDC messages into JSON.
- **Publishes** them to Google Cloud Pub/Sub.

The broker was built new, from scratch, for this job.

## The result

Downstream teams consume the messages from Pub/Sub into AlloyDB and BigQuery. Mainframe changes now have a path to the cloud in a format those teams can use.

## What I took from it

A broker like this is mostly translation: it takes data in the shape the source produces and hands it on in the shape consumers need. Getting that translation right in one place means each downstream team does not have to solve it again. It was a shared build, and the credit for it is shared too.
