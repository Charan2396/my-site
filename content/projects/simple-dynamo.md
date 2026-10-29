---
title: Simple Dynamo
summary: A Dynamo-style replicated key-value store with consistent hashing, three copies per key and failed-node recovery.
label: University at Buffalo coursework, 2018–19
link: https://github.com/Charan2396/Amazon-Dynamo-DB-
order: 2
---

A Dynamo-style distributed key-value store running on five Android emulator nodes, written in Java. Keys and node IDs are hashed with SHA-1 onto a consistent-hashing ring. Each key belongs to the first node clockwise and is replicated to that node's next two successors, so every key has three copies. Nodes talk over raw TCP sockets, with a background server thread and serialized client tasks. Each replica stores data in SQLite, and a newer write replaces an older one. Reads go to the key's coordinator and fall back to the last replica in the chain if the coordinator is down. Writes that a dead replica misses are buffered by the sender, and a restarting node pulls them back from its peers when it rejoins.
