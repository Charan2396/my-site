---
title: 'Co-designing store-and-forward on IBM MQ'
stage: queue
order: 2
summary: 'We co-designed a store-and-forward IBM MQ architecture for a warehouse integration that cut its planned downtime exposure by over 90 percent, while reusing infrastructure that already existed.'
proof: 'over 90% less planned-downtime exposure'
problem: 'Planned downtime is part of running any system: patches, upgrades and maintenance windows all take something offline for a while. For an integration, the hard question is what happens to the messages it is sending while the system on the other end is down. A warehouse integration on our platform carried that planned downtime exposure, and a warehouse depends on its messages arriving.'
constraints:
  - 'Reuse existing infrastructure.'
decision: 'A store-and-forward architecture for the integration on IBM MQ, co-designed. Messages are stored safely along the way, then forwarded when the destination is ready to take them, so a planned outage on one side does not have to stop the other.'
outcome: 'Planned downtime exposure for the warehouse integration dropped by over 90 percent, and the design reused existing infrastructure.'
---

## What I took from it

Before reaching for something new, it is worth asking what the systems you already run can do. A messaging layer is built to hold messages until someone is ready for them. Designing with that in mind got more out of what we already had.
