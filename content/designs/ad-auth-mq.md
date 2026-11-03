---
title: 'Active Directory authentication for IBM MQ'
order: 5
summary: 'I designed and validated an Active Directory (SSSD/PAM) authentication model for IBM MQ with group-governed access and least-privilege authority, removing per-host local accounts.'
proof: 'no per-host local accounts'
problem: 'Access to IBM MQ depended on per-host local accounts.'
constraints:
  - 'No per-host local accounts.'
  - 'Least-privilege authority.'
decision: 'Authenticate IBM MQ users against Active Directory through SSSD and PAM, with access governed by group and least-privilege authority.'
outcome: 'I designed and validated the model, which removes per-host local accounts.'
---
