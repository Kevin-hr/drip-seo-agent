---
name: evaluate-reddit-blue-ocean-posts
description: Verify and qualify known Reddit thread candidates with current, URL-level evidence for Reddit activity, SEO/GEO demand, relative competition, business fit, commercial intent, and entry feasibility. Use when asked whether specific Reddit URLs are real blue-ocean opportunities or when validating a candidate list. Do not use for initial broad discovery or reply writing. Never confirm a candidate while a hard-gate signal is missing.
---

# Evaluate Reddit Blue-Ocean Posts

Classify each known URL as `confirmed`, `provisional`, or `rejected`. Evidence beats scores.

## R — Source signal

> “vote 少、comments 少、traffic 高”
>
> — 子木，《Reddit 蓝海帖挖掘》，第一节

Source: [公众号原文](https://mp.weixin.qq.com/s/PqWKl2SWMGc6MnzFR-5lPg)

## I — Method

Treat internal Reddit competition, external SEO/GEO value, and business relevance as separate dimensions. Verify current values because all are time-sensitive. Add commercial intent and entry feasibility so a high-traffic but irrelevant, locked, crowded, or promotion-hostile page cannot pass. A score may rank qualified candidates, but it may never override a failed or missing hard gate.

## A1 — Source application

The article rejects a high-visibility thread with roughly 255 comments as crowded, while retaining a different example with low vote count, 31 comments, and an Ahrefs estimate near 12,000 US monthly organic visits—conditional on business relevance. It later ranks buying-oriented queries above broad experience-sharing queries. The article reports selection examples, not campaign conversion results.

## A2 — Trigger

Use this skill when the user provides one or more Reddit URLs and asks whether they are low-competition, worth entering, commercially relevant, or supported by real traffic and current comment data. Also use it to audit a prior “blue ocean” claim.

Do not activate for broad candidate discovery, general Reddit summaries, or writing the eventual reply.

## E — Execution

1. Read [references/evidence-contract.md](references/evidence-contract.md).
2. Set `run_date`, `target_market`, business scope, and freshness window. Default dynamic-signal freshness to 30 days.
3. Verify the Reddit page now: canonical URL, title, subreddit, post date, current votes, current comments, removed/locked state, and source timestamp.
4. Verify external demand at URL level:
   - target-market monthly organic traffic and organic keyword count from an authorized SEO source;
   - relevant ranking queries and observed positions;
   - GEO citations when available.
   - If traffic or keywords cannot be accessed, mark them `pending`; do not infer them from rank alone.
5. Establish relative competition using comparable same-topic threads, post age, comment density, recent activity, and likely reply position. Avoid universal comment cutoffs.
6. Judge business fit, commercial intent, and entry feasibility with written rationales and subreddit-rule evidence.
7. Apply hard gates:
   - `confirmed`: every core signal is verified, fit is strong, intent is medium/high, relative competition is favorable, and entry is feasible;
   - `provisional`: promising but at least one core signal is missing, stale, unavailable, or conflicting;
   - `rejected`: a core gate fails, fit is weak, intent is low, the post is unavailable/locked, or competition is clearly unfavorable.
8. Write the JSON report described in the evidence contract and run:

   `python scripts/validate_report.py <report.json>`

9. Return the classification, evidence table, missing data, confidence, and next verification action. Include the recheck date.

## B — Boundaries

- Third-party traffic is an estimate; label provider, market, metric, and date.
- Google result position is not a substitute for monthly URL traffic.
- Low comments may mean low demand rather than low competition.
- Page-level traffic does not prove a late reply will be visible or clicked.
- GEO citation of a page does not prove citation of a future comment.
- Respect subreddit rules and disclose commercial affiliation when required.
- Never turn `unavailable` into zero or present archive data as current.

## Related skills

- `find-reddit-blue-ocean-posts` — provides the candidate pool; this skill performs qualification.

## Audit

- Distilled from the cited article using V1/V2/V3 verification on 2026-10-14.
- Method unit: Reddit blue-ocean opportunity gate.
