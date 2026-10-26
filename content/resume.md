# Sricharan Anand

**Senior Data Platform Engineer** — real-time data replication, enterprise messaging and data reconciliation

San Jose, CA · [sricharan23@gmail.com](mailto:sricharan23@gmail.com) · [LinkedIn](https://linkedin.com/in/charansri) · [GitHub](https://github.com/Charan2396)

## Summary

Data platform engineer who owns the real-time replication backbone behind a global distributor's order, inventory and invoice data: mainframe change events (IMS, Db2, VSAM) flowing through IBM MQ and Java services into Oracle, and on to Google Cloud Pub/Sub for cloud consumers. I focus on reliability, data correctness and automation: reconciliation tooling, self-healing pipelines, observability, security and migrations. Earlier, I built high-traffic Java backend services for Amazon Retail Mobile.

## Experience

### Ingram Micro — Irvine, CA

#### Senior Data Platform Engineer · *HR title: Senior Database Design & Admin* · 2025 – Present

- Own and operate the mainframe-to-Oracle CDC replication platform: 300+ tables (IMS, Db2, VSAM) moving through IBM MQ and a multithreaded Java layer into Oracle operational data stores across three production instances, serving 30+ downstream teams at roughly 10M rows per day.
- Co-built, from scratch, a real-time Java data broker that converts raw mainframe CDC messages into JSON and publishes them to Google Cloud Pub/Sub, where downstream teams consume them into AlloyDB and BigQuery.
- Co-designed a store-and-forward IBM MQ architecture that reduced planned downtime exposure for a warehouse integration by over 90 percent while reusing existing infrastructure.
- Profiled a multi-million message per day TIBCO EMS estate (5,000+ queues) and authored the EMS-to-MQ migration architecture, sandbox and onboarding program; presented it to a 65-invitee audience.
- Led the IBM MQ upgrade lifecycle for a multi-environment platform, including a controlled rollback and cold restore after a client-compatibility defect, and established a non-production-to-production upgrade sequence.
- Cut Java message-splitter processing time for a 10K-message batch from roughly 3–4 minutes to about 30 seconds, and refactored the splitter layer to remove 10,000+ lines of redundant code.
- Rebuilt the self-healing repair process as idempotent shell automation that detects records failing to land in Oracle, captures the failed keys and resends them to the mainframe, replacing a manual, Perl-based recovery.
- Designed and validated an Active Directory (SSSD/PAM) authentication model for IBM MQ with group-governed access and least-privilege authority, removing per-host local accounts.
- Root-caused an Oracle trigger foreign-key race behind missing child records using systematic evidence queries, and root-caused a change-detection gap in a MERGE-based replication job; proposed non-invasive fixes for both.
- Built guarded backfill and purge tooling (idempotent inserts, cascade guards, zero-difference reconciliation): recovered ~16,900 missing order-line records across 23 company codes and sized a purge of hundreds of thousands of parent rows.
- Established Datadog observability for MQ and Java replication services: custom DogStatsD health metrics across queue managers, mainframe channels and Java processes; redesigned a noisy queue-depth alert; shut down a log-ingestion runaway of over one billion events per day.
- Drove a middleware vulnerability backlog (Log4j, IBM MQ, IBM Java, Oracle client) toward zero; set the 2025 platform roadmap and pull-request standard; mentored engineers and sat on an Oracle DBA hiring panel.

#### Data Platform Engineer · *HR title: Professional, Database Design & Admin* · 2023 – 2024

- Created the platform's first disaster-recovery playbook (v1.0, 2023) and recurring patching runbooks; signed it off for the 2024 and 2025 exercises.
- Delivered production MQ queues and a remote splitter for six European countries, coordinating a weekend cutover across mainframe, Linux and consumer teams.
- Investigated a message-ordering defect in the queue splitter, rolled back a change to isolate it and redesigned the queue-split logic to preserve ordering.
- Planned the Log4j upgrade across the Java replication and splitter code, and added retry logic to the MQ event publisher.

#### Replication Engineer · *HR title: Associate Database Administrator* · 2022 – 2023

- Introduced source control to a previously unversioned Java replication codebase, upgraded splitter logging from Log4j 1.x to 2.x and fixed VSAM and Db2 replication defects in the first year.
- Isolated a corrupt message that caused a splitter to reject tens of thousands of messages, and traced a high-CPU incident to a BigDecimal column-index error.
- Became the team's go-to for MQ replication within months, with no prior MQ experience.

### Bizanalytica — Remote

#### Software Engineer · Aug 2021 – Mar 2022

- Built foundational data lake infrastructure on Snowflake for scalable warehousing and analytics across multiple client cloud environments.
- Developed automated Python ingestion pipelines for complex JSON and XML feeds, replacing manual preparation and enabling self-service analysis.

### Amazon — Seattle, WA

#### Software Development Engineer · Mar 2020 – Jun 2021

- Designed and scaled API-driven backend microservices in Java for Amazon Retail Mobile, supporting highly concurrent traffic for over 10 million daily active users.
- Built and integrated a Java client and automated coupon-clipping widget for Amazon Cart, migrating the feature from legacy systems to a modern platform.
- Migrated legacy backend services to AWS-native infrastructure using a DNS-flip approach, routing 100% of production traffic with zero downtime.
- Architected platform infrastructure for the No Contact Delivery feature during COVID-19, partnering with cross-functional product teams to launch under strict timelines.

## Proofs of Concept and Internal Tools

*Built on top of the production platform. Labeled as proofs of concept, not production services.*

- **Cross-instance reconciliation platform** (working proof of concept, in use for validation). Read-only engine in ksh and SQL that fingerprints each table and company code (row count plus key hash, full and last-30-days) and classifies drift in both directions across three Oracle instances, with a drill-down HTML dashboard. Caught a flawed key heuristic before it produced false drift, and surfaced stale rows left by deletes that never propagated.
- **Platform status dashboard and engineering hub** (proof of concept). Self-hosted single-page site (nginx, HTML/JavaScript) showing live Datadog metrics, an environment switcher, architecture, runbooks and backlog, backed by custom DogStatsD health scripts for queue managers, mainframe channels and Java processes.
- **On-premises LLM health briefing** (proof of concept). Ollama with a 3.8B open-source model turns live observability metrics into plain-English platform health summaries, with no cloud dependency; accompanied by a 16-item AI opportunity roadmap.
- **Cron-to-Airflow migration** (in progress). Designing the move of a ~75-job cron estate (shell reporting and Oracle table-maintenance jobs) to Apache Airflow, with a secrets-first Git migration as phase one. A working proof of concept covers a small set of jobs; the full migration is not complete.

## Skills

- **Messaging & CDC:** IBM MQ, TIBCO EMS, Google Cloud Pub/Sub, change data capture (IMS, Db2, VSAM), store-and-forward design, dead-letter handling
- **Data:** Oracle 19c, PL/SQL, triggers, MERGE, data reconciliation, backfill and purge design, AlloyDB and BigQuery (as downstream consumers), Snowflake
- **Programming:** Java, Python, ksh/Bash, SQL, JavaScript
- **Reliability & Security:** Datadog, DogStatsD, runbooks, disaster recovery, Active Directory/SSSD/LDAPS, TLS, vulnerability remediation
- **Proof of concept / in progress:** Apache Airflow, Ollama (on-premises LLM)

## Education

- **M.S., Computer Science and Engineering** — University at Buffalo, NY · Dec 2019
- **B.Tech, Computer Science and Engineering** — Jain University, India · Jul 2018
