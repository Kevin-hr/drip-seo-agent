# Evidence contract

Create one JSON object with `run_date`, `target_market`, `freshness_days`, and `candidates`.

Each candidate must contain:

- `id`, `url`, `title`, `classification`;
- `signals.reddit_activity` with `status`, `observed_at`, `source_url`, and current `votes`, `comments`, `locked`, `removed` values;
- `signals.external_demand` with source, market, observation date, method, and available URL-level traffic, keyword, ranking, or GEO values;
- `signals.competition` with status, rationale, and comparator URLs or an explicit reason comparators are unavailable;
- `signals.business_fit` with status, `level` (`strong`, `medium`, `weak`), and rationale;
- `signals.commercial_intent` with status, `level` (`high`, `medium`, `low`), and rationale;
- `signals.entry_feasibility` with status, `level` (`open`, `constrained`, `blocked`), subreddit-rule source, and rationale;
- `missing_data`, `confidence`, and `recheck_on`.

Signal `status` values are `verified`, `pending`, `conflicting`, or `failed`.

## Hard-gate semantics

- A candidate is `rejected` when any core signal is `failed`, business fit is `weak`, commercial intent is `low`, or entry feasibility is `blocked`.
- A candidate is `confirmed` only when all six signals are `verified`, business fit is `strong`, intent is `high` or `medium`, and entry feasibility is `open` or `constrained` with a workable compliant path.
- Every other candidate is `provisional`.

Never fill missing metrics with zero. Keep archived and current values in separate fields.
