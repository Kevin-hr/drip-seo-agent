---
name: find-influencers
description: Discover and rank influencer candidates on TikTok, Instagram Reels, and YouTube Shorts. Use for daily creator scouting, low-follower viral creator discovery, competitor-collaboration tracking, hashtag/account monitoring, or preparing a candidate pool for later brand-safety evaluation.
---

# Find Influencers

Discover candidates; do not make the final cooperation decision in this skill.

## Workflow

1. Read [references/platform-sources.md](references/platform-sources.md) when collecting or importing platform data.
2. Define `run_date`, competitors, own-brand terms, target market, and freshness window in `influencer-intelligence/config/default.json`. Use another file with `--config <path>` when the campaign needs a different registry. An input envelope may also include a `competitors` array; the CLI merges it with the configured registry.
3. Collect current profile data and the latest 10 public posts per creator when available. Preserve URLs, timestamps, captions, visible metrics, hashtags, mentions, and sponsorship labels.
4. Normalize all sources to `influencer-intelligence/schemas/creator.schema.json`.
5. Run both routes:
   - `emerging`: low follower count plus exceptional recent view/follower ratios, repeated viral posts, or fast follower growth.
   - `competitor`: direct competitor mention, branded hashtag, paid-partnership label, affiliate cue, discount code, or repeated competitor product content.
6. Deduplicate by `platform:handle`, retain all source queries and evidence, and compare with prior snapshots.
7. Run `cd influencer-intelligence && npm run discover -- --input <json-or-directory> --config config/default.json`.
8. Hand every shortlisted creator to `$evaluate-influencers`. Never interpret discovery score as approval.

## Output contract

Return separate `emerging` and `competitor` queues. For each candidate include route, metrics, discovery reason, source URL, observed date, and evidence strength. Mark missing data explicitly; do not fabricate demographics or sponsorship status.

## Guardrails

- Use public data, authorized APIs, or approved providers. Respect platform terms, rate limits, privacy, and advertising rules.
- Treat an inferred competitor relationship as a lead until a post, label, link, code, or repeated pattern verifies it.
- Reject stale snapshots from the daily queue; retain them only as history.
- Keep raw collection evidence separate from derived scores.
