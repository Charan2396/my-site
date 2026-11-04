---
title: 'Co-designing store-and-forward on IBM MQ'
stage: queue
order: 2
summary: 'We co-designed a store-and-forward IBM MQ architecture for a warehouse integration that cut its planned downtime exposure, while reusing infrastructure that already existed.'
proof: 'over 90% less planned-downtime exposure'
problem: 'Planned downtime is part of running any system: patches, upgrades and maintenance windows all take something offline for a while. For an integration, the hard question is what happens to the messages it is sending while the system on the other end is down. A warehouse integration on our platform carried that planned downtime exposure, and a warehouse depends on its messages arriving.'
constraints:
  - 'Reuse existing infrastructure.'
why:
  - 'Reuse before build: a messaging layer is built to hold messages until someone is ready for them, so the IBM MQ infrastructure the platform already ran could carry a planned outage. The toggle below shows the difference.'
decision: 'A store-and-forward architecture for the integration on IBM MQ, co-designed. Messages are stored safely along the way, then forwarded when the destination is ready to take them, so a planned outage on one side does not have to stop the other.'
status: 'In place'
revisit: 'Revisit if planned outages on the destination grow longer than the queue can hold.'
outcome: 'Planned downtime exposure for the warehouse integration dropped by over 90 percent, and the design reused existing infrastructure.'
wentWrong:
  - text: 'On the same IBM MQ layer, an upgrade hit a client-compatibility defect; I ran a controlled rollback and cold restore, and upgrades now go non-production first.'
    href: '/decisions/#adr-04'
    link: 'Decision: non-production before production'
  - text: 'In the queue splitter, a message-ordering defect: I rolled back a change to isolate it, then redesigned the queue-split logic to preserve ordering.'
---
