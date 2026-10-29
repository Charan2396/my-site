---
title: Simple Dynamo
summary: A Dynamo-style replicated key-value store with consistent hashing, three copies per key and failed-node recovery.
label: University at Buffalo coursework, 2018–19
link: https://github.com/Charan2396/Amazon-Dynamo-DB-
order: 1
---

A Dynamo-style key-value store on five Android emulator nodes, written in Java. Keys and node IDs are hashed with SHA-1 onto a consistent-hashing ring; each key lives on the first node clockwise and its next two successors, so every key has three copies. Reads fall back to the last replica if the coordinator is down, and a restarting node pulls back the writes it missed from its peers.
