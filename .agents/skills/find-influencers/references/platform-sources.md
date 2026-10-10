# Platform source routing

## Common normalized input

Use one creator object per account with `platform`, `handle`, `followers`, `fetched_at`, and `posts`. Each post should include `id`, `url`, `published_at`, `caption`, `views`, `likes`, `comments`, `shares`, `hashtags`, `mentions`, and `paid_partnership` when observable.

## TikTok

Prefer the existing local engine at `C:/Users/Administrator/Documents/GitHub/TikTok-Data-Engine`:

- Hashtag XHR interception is the fastest existing collector.
- `src/hashtag/scrape_influencer_daily.js` finds creators from daily hashtag activity.
- `scripts/scrape_competitor_hashtags.js` supplies competitor-route leads.
- Import its JSON output into this repository; never commit cookies or `.env` values.

Use browser inspection for the latest 10 posts when the collector returns only one discovery post.

## Instagram Reels

Prefer the Instagram Graph API for accounts and hashtags the business is authorized to access. An approved data provider export is acceptable when it retains post URLs and collection timestamps. Do not infer paid partnership from a caption alone; preserve the explicit partnership label when present.

## YouTube Shorts

Prefer YouTube Data API search for query discovery, then channels and videos endpoints for channel statistics and recent Shorts. Preserve video IDs and published timestamps. Treat subscriber count hidden by the channel as missing, not zero.

## Feed integration

Place normalized JSON files in `influencer-intelligence/data/inbox/`, or point the CLI to another file/directory with `--input`. The daily workflow accepts one or many files and deduplicates accounts and posts.
