# Reports

Acceptance evidence. Each report states what was verified, what failed, what was
not attempted, and the commands used.

| File | Scope | State |
|---|---|---|
| `PHASE0-V0.1-ACCEPTANCE.html` | Local Bridge adapter acceptance (A–J): typecheck, tests, package check, 6 PDP routes, SKU verdicts, prepare write-freedom, plan tamper guards, simulated execute + verify | 54 + 30 assertions passing; live execution deliberately withheld |
| `V0.1-VERIFICATION-AND-GAP.html` | Verification of the originally delivered plugin ZIP and the integration gap against the real local agent | Complete |

## Rules for reports in this directory

1. A report must state the commands that produced it.
2. Anything not executed must be marked as not executed, with the reason.
3. Numbers in a report must come from a real run, never from expectation.
4. A report is never edited after the fact to look better. Supersede it with a
   new report and link the old one.
