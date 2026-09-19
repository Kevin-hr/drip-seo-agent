# System Architecture

## 1. Top-level flow

```text
ChatGPT
   ↓
MCP Plugin
   ↓
Local Bridge
   ↓
DripOps
   ↓
MrShopPlus
   ↓
Frontend Verify
```

## 2. Expanded view

```text
┌──────────────────────────────────────────────────────────────────┐
│ ChatGPT                                                          │
│   · web search      → candidate products, market naming          │
│   · image reasoning → colorway / graphic / collaboration match   │
│   · produces the Exact Entity + SKU verdict                      │
└───────────────────────────┬──────────────────────────────────────┘
                            │ MCP tool calls (Streamable HTTP)
┌───────────────────────────▼──────────────────────────────────────┐
│ MCP Plugin                                   mcp-plugin/         │
│   · 12 tools, no delete tool                                     │
│   · SKU gate (server-side, not prompt-level)                     │
│   · pins the V4.4 standard by SHA-256 at startup                 │
│   · converts product photos into MCP image content for vision    │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTP + Bearer token + standard headers
                            │ 127.0.0.1:8787 (never public)
┌───────────────────────────▼──────────────────────────────────────┐
│ Local Bridge                    dripops/src/DripOps/Bridge/       │
│   · 6 PDP routes                                                 │
│   · immutable plan store                                         │
│   · write guards: product / plan / validation / snapshot / std    │
└───────────────────────────┬──────────────────────────────────────┘
                            │ in-process
┌───────────────────────────▼──────────────────────────────────────┐
│ DripOps                        dripops/src/DripOps/               │
│   Rules/V44/   → V4.4 composer + validator (decision layer)      │
│   Browser/     → ChromeController, MrshopplusClient              │
│   State/       → RunStore (checkpoints + append-only events)      │
└───────────────────────────┬──────────────────────────────────────┘
                            │ Chrome DevTools Protocol
┌───────────────────────────▼──────────────────────────────────────┐
│ MrShopPlus admin (browser DOM automation, logged-in profile)      │
└───────────────────────────┬──────────────────────────────────────┘
                            │ publish
┌───────────────────────────▼──────────────────────────────────────┐
│ dripsneakers.org  →  Frontend Verify                              │
│   HTTP 200 / H1 / meta / canonical / noindex / JSON-LD            │
│   + V4.4 placement audit (Product Details ×5, Brand internal link,│
│     image-only Description, ALT, crawlability)                    │
└──────────────────────────────────────────────────────────────────┘
```

## 3. Component responsibilities

| Layer | Owns | Must never do |
|---|---|---|
| ChatGPT | Exact Entity + SKU research, visual verification, V4.4 decision input | Write to the store; invent a SKU |
| MCP Plugin | Tool surface, SKU gate, standard pinning, image delivery | Reimplement the MrShopPlus workflow |
| Local Bridge | Immutable plans, write guards, orchestration | Accept arbitrary SEO fields |
| V4.4 Rules | Deterministic compose + validate against the canonical standard | Borrow 3.2 rules |
| Execution layer | Chrome control, MrShopPlus read/write, read-back | Decide SEO content |
| Frontend Verify | Storefront acceptance | Decide SEO content |

## 4. Trust boundaries

**Boundary A — model ↔ MCP plugin.** Untrusted. The model may hallucinate a SKU,
an entity, or arbitrary fields. Mitigation: the SKU gate is enforced in server
code, and the write contract accepts only `product_id + plan_id`.

**Boundary B — MCP plugin ↔ local bridge.** Authenticated with a bearer token
and pinned to a standard hash. The bridge re-runs the SKU gate independently, so
a compromised or drifted model cannot bypass it by talking to the bridge
directly. Both the standard version and hash must match on every call or the
bridge returns `409 standard_hash_mismatch`.

**Boundary C — local bridge ↔ MrShopPlus.** The bridge is the only component
allowed to write, and only through a previously validated immutable plan. The
plan carries the snapshot hash it was built from; if the product changed in the
meantime, execution is refused with `409 stale_plan`.

**Boundary D — network exposure.** The bridge listens on `127.0.0.1` only. For
ChatGPT to reach the plugin, the plugin (not the bridge) is exposed over HTTPS or
a secure tunnel. The bridge is never publicly reachable.

## 5. Portable invariants

These hold across every component and are asserted by tests:

1. The active standard hashes to
   `965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7`.
2. Every tool result and every bridge response carries `standard_version` and
   `standard_hash`.
3. `prepare` produces no write, and leaves the shop run state byte-identical.
4. `execute` accepts only `product_id` and `plan_id`; injected SEO fields are
   ignored.
5. A plan executes at most once.
6. No delete capability exists in any layer.
7. A `HOLD` verdict can never produce a plan.

## 6. State and artifacts

| Path | Owner | Contains | Committed |
|---|---|---|---|
| `dripops/data/runs/` | RunStore | run state, per-product checkpoints, append-only events | no |
| `dripops/data/bridge/plans/` | PlanStore | immutable plan JSON | no |
| `dripops/data/bridge/events.jsonl` | Bridge | bridge audit trail | no |
| `dripops/data/chrome-profile/` | ChromeController | logged-in MrShopPlus session | no — credential material |

`prepare` writes to `data/bridge/` only. Only a real write may touch
`data/runs/`.

## 7. Versioning

| Artifact | Version source |
|---|---|
| MCP Plugin | `mcp-plugin/package.json` and `mcp-plugin/plugin.json` |
| DripOps | `dripops/src/DripOps/DripOps.csproj` |
| SEO-PDP standard | the document itself (`Version: 4.4`) plus its SHA-256 |

Git tag `v0.1.0` freezes all of the above together.
