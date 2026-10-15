---
name: find-reddit-blue-ocean-posts
description: Discover source-backed Reddit thread candidates for SEO/GEO growth through business SERPs, Reddit Top Pages, AI citation sources, competitor footprints, and ranking momentum. Use when asked to research, mine, or build a candidate pool of low-competition Reddit posts for a business. Do not use to write promotional replies or make final blue-ocean claims; hand candidates to $evaluate-reddit-blue-ocean-posts.
---

# Find Reddit Blue-Ocean Posts

Build an auditable candidate pool. Discovery is not qualification.

## R — Source signal

> “新机会通常来自还在增长中的帖子”
>
> — 子木，《Reddit 蓝海帖挖掘》，第二节

Source: [公众号原文](https://mp.weixin.qq.com/s/PqWKl2SWMGc6MnzFR-5lPg)

## I — Method

Search from several directions because every single index has blind spots. Start from Reddit pages, business queries, AI citations, competitor activity, and growth changes. Preserve where and when each URL was found. Do not label a candidate “blue ocean” during discovery; a high-ranking URL may still be crowded, irrelevant, stale, locked, or commercially weak.

## A1 — Source application

The article starts from Reddit SEO Top Pages and then checks whether each topic maps naturally to a product scenario. It separately recommends reversing from business SERPs, GEO citations, competitor footprints, and recent ranking growth. These routes create leads, not final approvals.

## A2 — Trigger

Use this skill when the user asks to:

- find Reddit posts that could create SEO, GEO, or brand-discovery opportunities;
- mine low-competition Reddit discussions for a product or market;
- trace Reddit URLs ranking for commercial queries or cited by AI systems;
- build a fresh candidate list for later verification.

Do not activate for writing a reply to an already selected thread, summarizing a thread, or checking whether one known URL is truly qualified.

## E — Execution

1. Define `business`, `product_categories`, `target_market`, `commercial_queries`, `competitors`, and `observed_at`.
   - Complete when every field is explicit; infer only low-risk items and label the inference.
2. Read [references/discovery-surfaces.md](references/discovery-surfaces.md) and run at least two available discovery routes.
   - Prefer one demand-led route (SERP or Top Pages) and one corroborating route (GEO, competitor, or momentum).
   - If a paid source is unavailable, continue with public routes and record the missing source.
3. Canonicalize and deduplicate Reddit URLs.
   - Strip tracking parameters; keep the post ID, subreddit, title, and discovery query.
4. Record evidence for every candidate:
   - `url`, `title`, `subreddit`, `post_date`;
   - `discovery_routes`, queries, source URLs, and observation timestamps;
   - why the topic appears relevant to the business;
   - which live metrics remain unverified.
5. Remove only obvious non-candidates: deleted/unavailable pages, clear category mismatch, or duplicates.
6. Send the remaining pool to `$evaluate-reddit-blue-ocean-posts`.

## Output contract

Return a table or JSON array. Never report estimated traffic, keyword counts, votes, comments, or rankings without a named source and observation date. Use `unknown` rather than zero when data is unavailable.

## B — Boundaries

- Candidate discovery does not prove low competition or traffic.
- A Google result count or visible rank is not URL-level monthly traffic.
- AI citation frequency does not prove that a new brand reply will be cited.
- Respect subreddit rules, platform terms, rate limits, privacy, and authorized data access.
- Do not recommend stealth promotion or fabricate account history.

## Related skills

- `evaluate-reddit-blue-ocean-posts` — depends-on this skill's candidate pool and makes the final qualification decision.

## Audit

- Distilled from the cited article using V1/V2/V3 verification on 2026-10-14.
- Method unit: multi-route Reddit candidate discovery.
