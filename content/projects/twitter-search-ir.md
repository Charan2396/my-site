---
title: Twitter search and information retrieval
summary: Tweet search in Apache Solr, comparing VSM, BM25 and DFR ranking, with a faceted Java search app.
label: University at Buffalo coursework, Fall 2018
link: https://github.com/Charan2396/Twitter-Search
order: 3
---

Collected tweets with the Twitter API and indexed them in Apache Solr. Compared VSM, BM25 and DFR ranking with trec_eval MAP on 15 training queries in English, German and Russian; tuning BM25 raised MAP from 0.6675 to 0.6774. Built a Java servlet search app with faceted filters for topic, city and language, Solr facet breakdowns, and Stanford CoreNLP sentiment scoring of results. Also built Boolean TAAT/DAAT query processing over a hand-built inverted index.
