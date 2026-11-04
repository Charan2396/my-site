---
title: 'Designed, then proven'
date: 2026-11-03
---

I ran Dieter Rams' ten principles over the site with Claude Code and scored it 21 out of 30. Nothing scored zero, but two principles scored 1. Understandable: jargon went unexplained, and the stage cards said they opened stories when a click actually selected the record. As little design as possible: the home page had four routes to one story, and Resume, Email and LinkedIn each appeared three times. The bigger problem was positioning. The site read as an operations engineer's, and the design work was buried.

**What changed**

- The hero now says what I build: data systems that move change data off legacy platforms and into the cloud. Three proof chips under it link to design docs: the CDC to Pub/Sub broker, the EMS-to-MQ migration architecture and the reconciliation engine. (The chips were removed again on 2026-11-04: the designs section right below lists the same designs.)
- Each pipeline stage links to the design behind it where one exists ("Read the design"), and to a story otherwise ("Read the story"). The Process card also links the log runaway, which no card reached before.
- The incident replay moved off the home page and into the one-bad-message story, where it serves as evidence. Home now has "Selected designs", then a short list of incidents and fixes from running the platform.
- The nav is Designs, Working with me, Projects and Resume. Decisions sits in the footer next to the build log.
- The type now uses eight size tokens, and home uses at most eight sizes (it had 15). Spacing in the new code follows a 4px scale.
- Jargon gets a plain-English gloss the first time it appears: EBCDIC, MQMD, PIC 9(7)V99, CCSID 37, CDC, IMS/Db2/VSAM, DogStatsD, MERGE, idempotent.

**What still needs my input**

The design docs only say what the resume says: problem, constraints, decision and outcome. For the broker, store-and-forward, the EMS-to-MQ migration and the Active Directory model, I still have to write down the options I weighed, why I chose this one, what it cost and what I deliberately left out. Those sections stay hidden until I fill them in.
