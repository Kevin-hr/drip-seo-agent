# Drip Sneakers AI SEO Agent

> Single Source of Truth for the Drip Sneakers AI-driven SEO/PDP automation stack.

```text
ChatGPT + MCP + Local Agent + MrShopPlus + SEO-PDP V4.4
```

## What this repository is

This repository is the engineering baseline for a ChatGPT-driven product-page SEO
pipeline. ChatGPT performs Exact Entity and SKU research; a narrow MCP server
exposes a controlled tool surface; a local bridge validates and executes the
write against the live store; a verifier confirms the storefront result.

It is deliberately **not** a generic SEO tool. The write path is plan-based and
cannot accept arbitrary field edits from a model.

## Architecture at a glance

```text
ChatGPT
  │ web / vision / reasoning → Exact Entity + SKU verdict
  ▼
MCP Plugin  (mcp-plugin/, TypeScript, 12 tools)
  │  Streamable HTTP  /mcp
  ▼
Local Bridge  (dripops/src/DripOps/Bridge/, C#, HTTP 127.0.0.1:8787)
  │  prepare → immutable plan_id → execute(plan_id) → verify
  ▼
DripOps execution layer  (ChromeController → MrshopplusClient)
  ▼
MrShopPlus backend  →  dripsneakers.org  →  Frontend Verify
```

Full detail: [docs/architecture/SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md)

## Components

| Component | Path | Language | What it owns |
|---|---|---|---|
| MCP Plugin | `mcp-plugin/` | TypeScript (Node ≥20) | ChatGPT-facing tool surface, SKU gate, image delivery for vision, standard pinning |
| DripOps Bridge | `dripops/src/DripOps/Bridge/` | C# (.NET 8) | HTTP bridge, immutable plan store, write guards |
| V4.4 Rules | `dripops/src/DripOps/Rules/V44/` | C# (.NET 8) | Deterministic V4.4 composer, validator, SKU gate, frontend auditor |
| Execution layer | `dripops/src/DripOps/Browser/` | C# (.NET 8) | Chrome CDP control, MrShopPlus read/write, frontend verification |
| Standard | `standards/V4.4/` | Markdown | The only active SEO-PDP standard |
| Cross-component tests | `tests/` | Node | Bridge acceptance and MCP end-to-end suites |
| Evidence | `reports/` | HTML | Acceptance reports |

## The standard

The only active SEO-PDP standard is:

```text
standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
SHA-256  965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7
```

SEO/PDP 3.2 and the superseded V4.4 `CLEAN_CONSOLIDATED_2026-09-17` revision are historical records. They
are parked in `standards/_superseded/` and must never be loaded as a decision
layer. The reason is a hard rule conflict: 3.2 requires a verified SKU, while
V4.4 §5 permits publishing with the SKU omitted. See
[docs/architecture/DECISION_LOG.md](docs/architecture/DECISION_LOG.md) decision #001.

Both the plugin and the bridge compute the standard's SHA-256 at startup and
refuse to run against a different revision.

## Operational knowledge

- [T-Shirts V3 lessons carried into V4.4](docs/operations/T_SHIRTS_V3_LESSONS_TO_V4.4.md)
  records the 11 evidence-backed historical terminal successes, the incomplete
  30-product objective, and the fail-closed V4.4 migration playbook.

## SKU verdicts

Exactly three are permitted:

| Verdict | Meaning | Effect |
|---|---|---|
| `VERIFIED_SKU` | A Tier 1–4 source attaches the same SKU to the exact entity | SKU is written and appears once in the SEO Title |
| `SKU_OMIT` | Exact Entity PASS, but no SKU can be independently verified | Publishing continues with the SKU omitted entirely |
| `HOLD` | Identity-critical evidence conflicts | No plan is created; nothing is written |

Never valid as a SKU: MrShopPlus Product ID, supplier number, listing ID, URL
suffix, image filename, size, generated code, `N/A`, `Unknown`, `Pending`,
`Not verified`.

## Quick start

### 1. MCP plugin

```bash
cd mcp-plugin
npm install
npm run typecheck
npm test
npm run check-package
```

### 2. DripOps

```powershell
cd dripops
.\build.ps1          # produces dist\DripOps.exe
.\dist\DripOps.exe self-test
```

### 3. Run the local bridge

```powershell
$env:LOCAL_AGENT_TOKEN = "<long random string>"
.\dist\DripOps.exe serve --config .\config\dripops.json --mode live
```

Use `--mode simulate` to exercise every guard without contacting MrShopPlus. A
simulated execution is labelled `SIMULATED` in the result and never touches the
run state.

### 4. Cross-component verification

```bash
cd tests
node bridge-acceptance.mjs   # requires the bridge on 127.0.0.1:8799, simulate mode
node e2e-mcp.mjs             # requires the MCP server on 127.0.0.1:8001
```

See [tests/README.md](tests/README.md) for the exact prerequisites.

## Safety model

- No tool accepts arbitrary SEO fields. `execute_product_v44` accepts only
  `product_id` + `plan_id`.
- Plans are immutable. Only two additive transitions are permitted after
  creation: recorded execution and recorded verification.
- `execute` re-verifies product match, plan existence, not-yet-executed,
  validation PASS, unchanged `standard_hash` and unchanged `snapshot_hash`.
- `prepare` writes only to `data/bridge/`. It leaves the shop run state
  byte-identical.
- No delete tool exists anywhere in the stack.
- Secrets, cookies and browser profile state are gitignored and never committed.

## Documentation

| Document | Contents |
|---|---|
| [SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md) | Components, boundaries, data flow, trust boundaries |
| [MCP_FLOW.md](docs/architecture/MCP_FLOW.md) | The 12 MCP tools and their call order |
| [IDP_PROCESS.md](docs/architecture/IDP_PROCESS.md) | Idea → Design → Prototype → Production |
| [DECISION_LOG.md](docs/architecture/DECISION_LOG.md) | Binding engineering decisions |
| [PRADA_78_PREFLIGHT_CASE.md](docs/case-studies/PRADA_78_PREFLIGHT_CASE.md) | Evidence-backed 78-product preflight and reconciliation case; explicitly not a live-completion claim |
| [PRADA_BATCH_LEARNINGS.md](docs/case-studies/PRADA_BATCH_LEARNINGS.md) | Reusable batch controls distilled from the Prada case without changing V4.4 |

## Current status

Frozen at `v0.1.0`. Verification state and known blockers are recorded in
`reports/`. The first live single-product execution has not yet been performed.
