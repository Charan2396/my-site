---
title: 'Shutting down a billion-event-a-day log runaway'
stage: process
order: 2
summary: 'I established Datadog observability for the MQ and Java replication services, redesigned a noisy queue-depth alert, and shut down a log-ingestion runaway of over one billion events per day.'
metrics: ['over one billion events per day', 'noisy queue-depth alert redesigned']
---

## The problem

A replication platform has many moving parts: queue managers, mainframe channels and the Java processes in between. When something goes wrong, you want to know which part, and you want to know before a downstream team asks.

Observability has its own failure modes, though. An alert that fires too often teaches people to ignore it. And log ingestion can run away: one runaway reached over one billion events per day.

## What I did

I established Datadog observability for the MQ and Java replication services, in three parts:

- **Custom DogStatsD health metrics** across queue managers, mainframe channels and Java processes.
- **A redesigned queue-depth alert**, replacing one that was noisy.
- **Shutting down the log-ingestion runaway** of over one billion events per day.

## The result

The MQ and Java replication services report health metrics into Datadog, the noisy queue-depth alert has been redesigned, and the log-ingestion runaway of over one billion events per day is shut down.

## What I took from it

Monitoring is part of the system, not a layer on top of it. An alert people have learned to ignore is worse than no alert, and logs cost something to collect. Measuring the parts that matter, and turning down the noise, is what makes the signal worth trusting.
