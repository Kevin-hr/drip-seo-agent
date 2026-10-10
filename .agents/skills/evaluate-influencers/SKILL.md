---
name: evaluate-influencers
description: Audit influencer profiles and their latest public content, apply hard red-light vetoes, score suitability, and recommend collaboration. Use for creator due diligence, recent-10-post reviews, brand-safety checks, authenticity or offer-position conflicts, audience-fit screening, and red/yellow/green cooperation decisions.
---

# Evaluate Influencers

Judge creators independently of how they were discovered.

## Workflow

1. Confirm the account identity and state the offer context, especially product authenticity, target market, disclosure requirements, and intended usage rights.
2. Review the latest 10 public posts in chronological order. Do not substitute pinned old content for recent posts.
3. Check caption, visuals, spoken words, on-screen text, partnership labels, bio links, and visible engagement. Preserve URLs and short evidence notes.
4. Calculate recent total, average and median views plus visible engagement rate. Treat missing shares separately.
5. Apply hard vetoes before positive scoring. Read `docs/influencer/INFLUENCER_RED_FLAG_NO_GO_STANDARD.md` for the controlling standard.
6. For a direct account audit, run `cd influencer-intelligence && npm run evaluate -- --input <json-or-directory> --offer-context <authentic|private_label|replica|counterfeit|unverified>`. This command intentionally evaluates every supplied account. The `daily` command is the end-to-end mode and evaluates only the discovery shortlist.
7. Output exactly one decision:
   - `red`: do not cooperate; a hard veto cannot be offset by traffic.
   - `yellow`: low-cost, trackable test only; list evidence still required.
   - `green`: recommend outreach with a staged test and measurement plan.

## Context rule

Anti-counterfeit positioning is a direct conflict for counterfeit or unverifiable offers, but not automatically for demonstrably authentic goods or a lawful private label. Evaluate the actual offer honestly; never hide or misstate product nature to obtain cooperation.

## Required output

Include account, platform, audit date, sample size, decision, triggered rule IDs, evidence URLs, confidence, traffic summary, missing evidence, and next action. If fewer than 10 posts are available, lower confidence and say so.

## Guardrails

- Separate facts, creator statements, and analyst inference.
- Do not make protected-class inferences about a creator or audience.
- Do not treat location, follower count, or one viral post as audience proof.
- Never let discovery rank or high engagement override legal, safety, integrity, or offer-compatibility vetoes.
