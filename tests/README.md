# Cross-component tests

These suites verify the seams between components. Unit tests for the plugin's own
logic live in `mcp-plugin/tests/`.

| Suite | Verifies | Needs |
|---|---|---|
| `bridge-acceptance.mjs` | 54 assertions over the local bridge: auth, standard pinning, all 6 PDP routes, the three SKU verdicts, plan tamper guards, stale-snapshot guard, prepare write-freedom | bridge on `127.0.0.1:8799`, `--mode simulate`, a copied run directory |
| `e2e-mcp.mjs` | 30 assertions over the real MCP server talking to the real bridge: tool discovery, image delivery for vision, SKU gate, plan lifecycle, standard hash passthrough | bridge on `127.0.0.1:8799`, MCP server on `127.0.0.1:8001` |
| `verify-mcp-tools.mjs` | Tool surface and SKU gate against the mock agent | mock agent on `127.0.0.1:8787`, MCP server on `127.0.0.1:8000` |
| `verify-ssrf.mjs` | 14 SSRF cases against the image loader | none |

## Running the bridge suites safely

Never point these at production state. Copy a run directory first, then start the
bridge with a sandbox config that targets the copy.

```powershell
# 1. sandbox
$sb = "$env:TEMP\drip-bridge-sandbox"
New-Item -ItemType Directory -Force "$sb\state\runs", "$sb\bridge", "$sb\standards" | Out-Null
robocopy "<dripops>\dist\data\runs\<run-id>" "$sb\state\runs\<run-id>" /E | Out-Null
Copy-Item "<repo>\standards\V4.4\*.md" "$sb\standards\"
Copy-Item "<dripops>\standards\SEO-PDP-V4.4.json" "$sb\standards\"

# 2. sandbox config (absolute paths, simulate mode) — see bridge-acceptance.mjs header
# 3. bridge
$env:LOCAL_AGENT_TOKEN = "test-token-local-bridge"
dotnet "<dripops>\src\DripOps\bin\Release\net8.0\DripOps.dll" serve --config "$sb\dripops.json" --mode simulate
```

`bridge-acceptance.mjs` asserts that the `state/runs` tree is **byte-identical**
before and after `prepare`, and after a simulated `execute`. If that assertion
fails, a write-freedom guarantee has regressed.

## Reading the output

Each assertion prints `PASS` or `FAIL` with the observed value, and the run exits
non-zero if anything failed. The observed values are the evidence — do not
report a suite as passing without pasting them.
