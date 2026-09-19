# STANDARD INTEGRITY REPORT

**Date:** 2026-09-18
**Scope:** Phase 1 — verify that only the V4.4 CLEAN_CONSOLIDATED standard can be
loaded, that its hash is pinned, and that historical standards are refused.
Read-only. No code changed.

---

## 1. Verdict

**PASS** — the canonical standard's hash matches the pinned value, the runtime
reports that identity on every response, and three independent negative tests
confirm that a different hash, a different version, or a historical document are
all refused.

---

## 2. Canonical standard identity

| Property | Value |
|---|---|
| File | `standards/V4.4/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md` |
| Declared version | `4.4` |
| Declared status | `FINAL — CONSOLIDATED 2026-09-17` |
| SHA-256 (computed in this repository) | `5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8` |
| Pinned value | `5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8` |
| Match | **YES** |

---

## 3. Runtime verification

The bridge was started against the frozen `DripOps.dll` and queried.

### 3.1 Bridge reports the pinned identity

```json
GET /health
{
  "standard_version": "4.4",
  "standard_status": "FINAL — CONSOLIDATED 2026-09-17",
  "standard_hash": "5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8",
  "standard_file": "Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md",
  "execution_mode": "simulate"
}
```

### 3.2 Plugin reports the same identity at startup

```text
$ npx tsx src/server.ts
Drip SEO MCP listening on http://127.0.0.1:8001/mcp
Standard: SEO-PDP V4.4 [FINAL — CONSOLIDATED 2026-09-17]
          sha256:5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8
          (Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md)
```

Both sides compute the hash independently. They agree.

---

## 4. Negative tests

Three ways of smuggling in a different standard were attempted. All three were
refused.

### 4.1 Declared hash does not match the loaded standard

```text
POST /api/chatgpt-mcp/products/search
{ "query": "x", "standard_version": "4.4", "standard_hash": "0000…0000" }

→ HTTP 409  error = standard_hash_mismatch
```

### 4.2 Declared version is the historical 3.2

```text
POST /api/chatgpt-mcp/products/search
{ "query": "x", "standard_version": "3.2", "standard_hash": "<correct V4.4 hash>" }

→ HTTP 409  error = standard_version_mismatch
```

### 4.3 A superseded document is offered as the active standard

```text
$env:STANDARD_PATH = ".../standards/_superseded/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md"
$ npx tsx src/server.ts

Error: STANDARD_PATH points at a forbidden historical standard
(.../standards/_superseded/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md).
Only Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md may be active.
```

The plugin **refuses to start**. This is a fail-closed behaviour, not a warning.

---

## 5. Hermeticity of historical standards

Seven assertions in `mcp-plugin/tests/standard.test.ts` cover this and pass:

| Assertion | Result |
|---|---|
| Canonical file present and correctly named | PASS |
| SHA-256 matches the pinned value | PASS |
| Loaded identity is reported correctly | PASS |
| Every tool result envelope carries version + hash | PASS |
| `SEO-PDP 3.2` and the superseded `V4.4 STANDARD_FINAL` are recognised as forbidden patterns | PASS |
| Both bundled copies of the canonical document are byte-identical | PASS |
| Superseded copies are parked outside the active reference directory | PASS |

`npm test` → **19 passed, 0 failed**.

---

## 6. Residual exposure — recorded, not hidden

**`dripops/standards/SEO-PDP-3.2.json` and `SEO-PDP-3.1.1.*` are still present in
the frozen codebase.**

They are build inputs (`DripOps.csproj`) and the configured `standardPath` for the
historical CLI commands (`compose`, `apply`, …). They are **not** reachable from
the bridge: `serve` is routed before `MachineStandard.Load` is reached, so the
bridge has no code path that can read 3.2 rules.

This is recorded as **Decision #006** in `docs/architecture/DECISION_LOG.md` and
is flagged there as requiring the owner's ratification, because removing the files
would change the behaviour of the already-passing frozen build.

Top-level `standards/` contains only the canonical V4.4 document; historical
revisions live in `standards/_superseded/` with an explanatory README.
