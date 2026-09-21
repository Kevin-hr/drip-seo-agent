# Reports

Acceptance evidence. Each report states what was verified, what failed, what was
not attempted, and the commands used.

| File | Scope | State |
|---|---|---|
| `evidence/hellstar-hoodies-v44/` | Hash-indexed Hellstar Hoodies case-study evidence: 8 facts JSON + 23 images | Preserved; one overview image is explicitly unpaired; fresh V4.4 verification still required before live use |
| `evidence/t-shirts-v3/verified-baseline.json` | Hash-backed derivation of the historical T-Shirts V3 terminal baseline | 11 distinct successes: 9 PDP 3.1.1 + 2 PDP 3.2; not 30/30 and not yet V4.4-accepted |
| `V4.4_STANDARD_FINAL_MIGRATION_2026-09-19.md` | Promotion of the user-approved V4.4 STANDARD_FINAL file to the sole active standard, including byte identity, hash locks, loaders and tests | PASS |
| `PHASE0-V0.1-ACCEPTANCE.html` | Local Bridge adapter acceptance (A–J): typecheck, tests, package check, 6 PDP routes, SKU verdicts, prepare write-freedom, plan tamper guards, simulated execute + verify | 54 + 30 assertions passing; live execution deliberately withheld |
| `V0.1-VERIFICATION-AND-GAP.html` | Verification of the originally delivered plugin ZIP and the integration gap against the real local agent | Complete |

## Rules for reports in this directory

1. A report must state the commands that produced it.
2. Anything not executed must be marked as not executed, with the reason.
3. Numbers in a report must come from a real run, never from expectation.
4. A report is never edited after the fact to look better. Supersede it with a
   new report and link the old one.
