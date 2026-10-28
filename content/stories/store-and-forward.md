---
title: 'Store-and-forward: over 90% less downtime exposure'
stage: queue
order: 1
summary: 'We co-designed a store-and-forward IBM MQ architecture for a warehouse integration that cut its planned downtime exposure by over 90 percent, while reusing infrastructure that already existed.'
metrics: ['over 90% less planned-downtime exposure', 'existing infrastructure reused']
---

## The problem

Planned downtime is part of running any system. Patches, upgrades and maintenance windows all take something offline for a while. For an integration, the hard question is what happens to the messages it is trying to send while the system on the other end is down.

A warehouse integration on our platform carried that planned downtime exposure, and a warehouse depends on its messages arriving.

## What I did

I co-designed a store-and-forward architecture for the integration on IBM MQ. The idea is in the name: messages are stored safely along the way, then forwarded when the destination is ready to take them, so a planned outage on one side does not have to stop the other.

The design reused existing infrastructure.

## The result

Planned downtime exposure for the warehouse integration dropped by over 90 percent, and the design reused existing infrastructure.

## What I took from it

Before reaching for something new, it is worth asking what the systems you already run can do. A messaging layer is built to hold messages until someone is ready for them. Designing with that in mind got more out of what we already had.
