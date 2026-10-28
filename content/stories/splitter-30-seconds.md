---
title: 'A 10K-message batch: ~3–4 minutes down to ~30 seconds'
stage: process
order: 1
summary: "I cut the Java message splitter's processing time for a 10K-message batch from roughly 3–4 minutes to about 30 seconds, and refactored the splitter layer to remove 10,000+ lines of redundant code."
metrics: ['~3–4 min → ~30 s per 10K-message batch', '10,000+ lines of redundant code removed']
---

## The problem

Every change on the mainframe becomes a message, and a splitter in the Java layer routes those messages on toward Oracle. Everything after it waits on it, so time spent in the splitter is time the data is not yet where people need it.

Processing a 10K-message batch took roughly 3–4 minutes. The splitter layer also carried a large amount of redundant code, which makes every change harder to read, test and trust.

## What I did

I worked on the splitter's processing time for that 10K-message batch and brought it down to about 30 seconds.

I also refactored the splitter layer and removed more than 10,000 lines of redundant code from it.

## The result

A 10K-message batch went from roughly 3–4 minutes to about 30 seconds. The splitter layer is 10,000+ lines smaller, which means less code to read, test and maintain the next time someone needs to change it.

## What I took from it

Redundant code is a cost you pay on every change, whether or not anyone notices it. Removing it is worth doing for its own sake. And a component that everything else waits on is a good place to look when you want the whole pipeline to feel faster.
