---
title: 'One bad message, tens of thousands rejected'
stage: source
order: 1
summary: 'A single mainframe change message with uneven line breaks made the Java splitter reject tens of thousands of messages. I isolated it and had the mainframe regenerate it.'
metrics: ['1 corrupt message', 'tens of thousands of messages rejected']
---

## The problem

Every change on the mainframe becomes a message, and a splitter in the Java layer routes those messages on toward Oracle. One message arrived corrupt, with uneven line breaks inside it, and the Java splitter couldn't parse it. It started rejecting messages: not just the bad one, but tens of thousands of them.

The signal can arrive several ways: an alert that data is missing, a queue backlog that keeps growing, or a downstream team asking where their records went. We have good alerting for missing data, so this rarely goes unnoticed for long.

## What I did

I had seen this failure before, so I recognised the pattern quickly and went looking for the one message causing it, rather than treating tens of thousands of rejects as tens of thousands of problems.

The fix was the self-healing process: capture the keys of the affected records and feed them back to the mainframe, which regenerates the messages from the parent table down. Clean copies flow through the pipeline again and land in Oracle like any other change.

## The result

The rejected data was regenerated from the source of truth instead of being hand-edited, and the pipeline caught up.

Afterwards I added more alerts, and wrote a dedicated runbook that walks through the different scenarios this kind of failure can show up as, so the next person doesn't need to have seen it before.

## What I took from it

In a replication pipeline, the source of truth is the source. When a message goes bad, regenerate it from there instead of hand-editing the copy. Then write down how you knew, because "I've seen this before" doesn't scale.
