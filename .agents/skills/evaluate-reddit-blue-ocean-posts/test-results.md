# Pressure-test results

- **Date**: 2026-10-14
- **Skill**: `evaluate-reddit-blue-ocean-posts`
- **Declared test set**: 8/8 passed
- **Blind forward-test subset**: 5/5 routing and boundary decisions passed
- **Validator branches**: confirmed / provisional / rejected / stale evidence all passed
- **Overall**: 100%

## Verified boundaries

| Scenario | Observed decision | Result |
|---|---|---|
| Verify current comments, US URL traffic, and intent | Invoke evaluation | Pass |
| URL-level traffic unavailable | Invoke, force `provisional` | Pass |
| Seller participation forbidden by subreddit rules | Invoke, force `rejected` | Pass |
| Write a promotional reply | Do not invoke | Pass |
| Summarize a thread | Do not invoke | Pass |

The forward tester read only `SKILL.md`, not `test-prompts.json` or the expected answers. The report validator also rejected a deliberately false `confirmed` fixture because live evidence was pending.
