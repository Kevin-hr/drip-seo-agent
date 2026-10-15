# Pressure-test results

- **Date**: 2026-10-14
- **Skill**: `find-reddit-blue-ocean-posts`
- **Declared test set**: 6/6 passed
- **Blind forward-test subset**: 4/4 routing decisions passed
- **Overall**: 100%

## Verified boundaries

| Scenario | Observed decision | Result |
|---|---|---|
| Build a US Reddit seller-selection candidate pool | Invoke discovery | Pass |
| Find Jordan 4 Reddit URLs from zero | Invoke discovery | Pass |
| Write a reply to an already selected thread | Do not invoke | Pass |
| Summarize recommendations in a thread | Do not invoke | Pass |

The forward tester read only `SKILL.md`, not `test-prompts.json` or the expected answers.
