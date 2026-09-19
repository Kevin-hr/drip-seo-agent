# Superseded standards — historical only

Nothing in this directory may be loaded by any component at runtime. These files
exist so that past production output can still be explained.

| File | Why it is here | Never used for |
|---|---|---|
| `Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md` | Former consolidated revision. SHA-256 `5fb8457f…edbf3bf8` in the Git repository. | Current SEO decisions. It was superseded by the user-approved STANDARD_FINAL revision. |
| `SEO-PDP-3.2.json` | The machine standard for the historical DripOps CLI. Requires a verified SKU. | Anything in the bridge. Its SKU rule contradicts V4.4 §5. |

Active standard: `../V4.4/Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md`
(SHA-256 `965314cdb899bfddaafd25d6e083bff6861663c38a7860f553be7e4b34d3e5b7`).

See `docs/architecture/DECISION_LOG.md` decisions #001 and #002.

## Why 3.2 must not come back

3.2 mandates a verified SKU:

```text
SeoPdpComposer.cs:63   if (isNullOrWhiteSpace(facts.Sku)) missing.Add("sku");
SeoPdpValidator.cs:28  Error("FACT-02 UNVERIFIED_SKU", …)
```

V4.4 §5 permits publishing with the SKU omitted when the exact entity is
verified but no SKU can be independently confirmed. The two rules are mutually
exclusive, so only one can be the decision layer. #001 chose V4.4.
