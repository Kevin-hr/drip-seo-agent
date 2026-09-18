# Phase 0 — GitHub Engineering Freeze

**Version:** `v0.1.0` (the commit tagged `v0.1.0` is the authoritative revision)
**Date:** 2026-09-18
**Scope:** create the repository of record, freeze the working artefact, normalise
the engineering structure. **No production logic was changed.**

## 1. Project inventory

### 1.1 Locations before the freeze

| Artefact | Path |
|---|---|
| MCP Plugin | `drip-chatgpt-seo-plugin/` (sibling of this repository) |
| DripOps + Bridge + V4.4 rules | `dripops/` (sibling of this repository) |
| Canonical V4.4 standard | `Documents/dripsneakers/inputs/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md` |
| Plugin unit tests | `drip-chatgpt-seo-plugin/tests/` |
| Cross-component tests | ad-hoc scripts, not previously in a fixed location |
| Acceptance reports | loose HTML files at the project root |

### 1.2 Locations after the freeze

| Artefact | Path in this repository |
|---|---|
| MCP Plugin | `mcp-plugin/` |
| DripOps Bridge | `dripops/src/DripOps/Bridge/` |
| V4.4 rules | `dripops/src/DripOps/Rules/V44/` |
| Executor + verifier | `dripops/src/DripOps/Browser/` |
| Canonical standard | `standards/V4.4/` |
| Superseded standards | `standards/_superseded/` |
| Plugin unit tests | `mcp-plugin/tests/` |
| Cross-component tests | `tests/` |
| Acceptance evidence | `reports/` |
| Architecture docs | `docs/architecture/` |

The original directories were **copied, not moved**, and remain untouched.

### 1.3 Versions

| Component | Version |
|---|---|
| MCP Plugin | `v0.1.0` (`mcp-plugin/package.json`, `mcp-plugin/plugin.json`) |
| DripOps Bridge | `0.1.0` (`dripops/src/DripOps/DripOps.csproj`) |
| V4.4 Standard | `4.4` / `FINAL — CONSOLIDATED 2026-09-17`, SHA-256 `5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8` |
| Runtime | Node ≥ 20, .NET 8 |

## 2. Repository structure

```text
drip-seo-agent/
├── README.md
├── .gitignore
├── docs/
│   └── architecture/
│       ├── SYSTEM_ARCHITECTURE.md
│       ├── MCP_FLOW.md
│       ├── IDP_PROCESS.md
│       └── DECISION_LOG.md
├── standards/
│   ├── V4.4/
│   │   └── Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md
│   └── _superseded/
│       ├── README.md
│       ├── Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md
│       └── SEO-PDP-3.2.json
├── mcp-plugin/
├── dripops/
├── tests/
└── reports/
```

96 tracked files. No build output, no runtime state, no credentials.

## 3. Verification

Every command was executed inside this repository, after the copy and before the
tag.

| Test | Command | Result |
|---|---|---|
| npm typecheck | `cd mcp-plugin && npm run typecheck` | **PASS** (exit 0) |
| npm test | `cd mcp-plugin && npm test` | **PASS** 19 / 19 |
| package check | `cd mcp-plugin && npm run check-package` | **PASS** (12 tools, canonical hash verified) |
| dotnet build | `cd dripops && dotnet build .\src\DripOps\DripOps.csproj -c Release` | **PASS** 0 warnings, 0 errors |
| DripOps self-test | `dotnet .\src\DripOps\bin\Release\net8.0\DripOps.dll self-test` | **PASS** `{"ok": true, "failures": []}` |
| Bridge acceptance | `cd tests && node bridge-acceptance.mjs` | **PASS** 54 / 54 |
| MCP end-to-end | `cd tests && node e2e-mcp.mjs` | **PASS** 30 / 30 |

Standard hash recomputed from the frozen repository:

```text
5FB8457F049615B467E54B4A4D4FDB59DD39A4B6A73172020B12FA1FEDBF3BF8
```

### 3.1 How the two cross-component suites were run

Neither suite touches production state. The bridge ran in `--mode simulate`
against a copy of one real run directory under the gitignored `.sandbox/`.

```powershell
# 1. sandbox (copy of a real run + the frozen standards)
#    see tests/README.md for the full setup
# 2. bridge, simulate mode
$env:LOCAL_AGENT_TOKEN = "test-token-local-bridge"
dotnet dripops\src\DripOps\bin\Release\net8.0\DripOps.dll serve --config .sandbox\dripops.json --mode simulate
# 3. MCP server pointed at the bridge
cd mcp-plugin; $env:LOCAL_AGENT_BASE_URL="http://127.0.0.1:8799"; $env:PORT="8001"; npx tsx src/server.ts
# 4. suites
cd ..\tests; $env:BRIDGE_SANDBOX="..\.sandbox"; node bridge-acceptance.mjs; node e2e-mcp.mjs
```

`bridge-acceptance.mjs` additionally asserts that the sandbox `state/runs` tree is
**byte-identical** before and after `prepare`, and after a simulated `execute`.

## 4. Defects found and fixed during the freeze

| # | Defect | Fix |
|---|---|---|
| 1 | `tests/bridge-acceptance.mjs` carried a hard-coded machine-specific sandbox path, so the suite could not run on any other machine | all paths and identifiers now read from environment variables with safe defaults |
| 2 | `tests/e2e-mcp.mjs` hard-coded the MCP URL, product ID and run ID | parameterised the same way |
| 3 | The cross-component suites had no dependency manifest, so `@modelcontextprotocol/sdk` could not resolve | added `tests/package.json` and pinned the dependency |

Deny rules and the standard itself were not touched.

## 5. Safety

`.gitignore` blocks, and a pre-commit scan confirmed the absence of:

```text
.env / .env.*            node_modules/       bin/ / obj/
chrome-profile/          cookies/            data/runs/ / data/bridge/
*.secret / *.key         credentials/        data/private/        .sandbox/
```

Verified against the tracked file set:

```text
node_modules  → 0    /bin/  → 0    /obj/  → 0    ^dist/  → 0
chrome-profile → 0   Cookies → 0   data/runs → 0  .sandbox/ → 0
tracked .env files → 0   (mcp-plugin/.env.example only, placeholder token)
```

No API key, cookie, MrShopPlus credential or customer data is committed.

## 6. Deviations from the Phase 0 instruction

Two, both recorded rather than silently taken. See
`docs/architecture/DECISION_LOG.md` decisions #006 and #007.

1. **`dripops/standards/` still contains `SEO-PDP-3.2.json` and
   `SEO-PDP-3.1.1.*`.** Removing them changes the frozen codebase's build and
   runtime behaviour, which Phase 0 forbids. The top-level `standards/` directory
   contains only the canonical V4.4 document, with historical revisions confined to
   `standards/_superseded/`. **Requires the owner's ratification.**
2. **The canonical standard keeps its full filename including the date.** The Phase
   0 tree sketch showed a shortened name; introducing a second name for the same
   document would recreate the exact ambiguity decision #002 exists to eliminate.

## 7. Blockers

1. **First live product execution has not been performed.** Entry gate reached;
   pending owner approval. Two open decisions from Phase 1 still block it:
   how to treat the unverifiable name token `Grown`, and whether to migrate the
   live URL.
2. **`mcp.json` still contains a placeholder host.** ChatGPT cannot connect until a
   public HTTPS endpoint or a secure tunnel exists.
3. **The 5 category routes have no bridge implementation.** Calling them returns
   404. Deferred by design until the PDP path is proven in production.
4. **Stale-snapshot slug hazard.** The bridge's slug-stability rule keys off
   `snapshot.IsPublished`. If the local snapshot is stale and says `false` while
   the page is live, the composer proposes a new slug and reports
   `UrlChangeRequired = false`, so no redirect is generated. The first live run
   must therefore `prepare` from a fresh (`live=true`) snapshot, and the rule
   should be hardened to treat an existing slug as stable regardless of the
   published flag.
5. **`dripops/dist/DripOps.exe` is not built in this repository.** `dist/` is
   gitignored; run `dripops\build.ps1` to produce the executable.

## 8. Next phase

**Phase 1 — First Live Product Execute Acceptance.**

```text
Product:  Top Quality Thom Browne 4-Bar Stripe Jersey Stitch Tee Grown
Product ID: 536027551768089
URL:      https://www.dripsneakers.org/Top-Quality-Thom-Browne-4-Bar-Stripe-Jersey-Stitch-Tee-Grown
```

Blocked on: the `Grown` naming decision, the URL migration decision, and the
fresh-snapshot precondition (blocker 4).
