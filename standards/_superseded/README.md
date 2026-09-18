# Superseded standards — historical only

Nothing in this directory may be loaded by any component at runtime. These files
exist so that past production output can still be explained.

| File | Why it is here | Never used for |
|---|---|---|
| `Drip_Sneakers_SEO-PDP_V4.4_STANDARD_FINAL.md` | The revision used for the 106-product Air Jordan batch. SHA-256 `965314CD…B34D3E5B7`. | Current SEO decisions. It was replaced by the CONSOLIDATED revision. |
| `SEO-PDP-3.2.json` | The machine standard for the historical DripOps CLI. Requires a verified SKU. | Anything in the bridge. Its SKU rule contradicts V4.4 §5/§5A. |

Active standard: `../V4.4/Drip_Sneakers_SEO-PDP_V4.4_CLEAN_CONSOLIDATED_2026-09-17.md`
(SHA-256 `5fb8457f049615b467e54b4a4d4fdb59dd39a4b6a73172020b12fa1fedbf3bf8`).

See `docs/architecture/DECISION_LOG.md` decisions #001 and #002.

## Why 3.2 must not come back

3.2 mandates a verified SKU:

```text
SeoPdpComposer.cs:63   if (isNullOrWhiteSpace(facts.Sku)) missing.Add("sku");
SeoPdpValidator.cs:28  Error("FACT-02 UNVERIFIED_SKU", …)
```

V4.4 §5/§5A permits publishing with the SKU omitted when the exact entity is
verified but no SKU can be independently confirmed. The two rules are mutually
exclusive, so only one can be the decision layer. #001 chose V4.4.
