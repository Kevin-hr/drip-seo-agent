# Louis Vuitton Damier Shorts — Identity and SKU Verdict

**Checked:** 2026-09-23  
**Storefront:** https://www.dripsneakers.org/Louis-Vuitton-Damier-Shorts  
**MrShopPlus product ID:** `536027549789467`  
**Fresh snapshot hash:** `f902736670d54e0a90d30165e62ef208b9b6393673d31ca59565cd4e878b4a7f`  
**Supplier image set:** 14 images from the fresh live snapshot

## Verdict

- Exact entity: **PASS**
- Official product name: **Louis Vuitton Damier Quilted Cotton Shorts**
- Color: **Navy**
- Product family: `nvprod5530143v`
- Previous candidate `1AK75V Damier Silk Shorts`: **REJECTED — different product**
- Product-level singular SKU: **SKU_OMIT**
- Size-level official SKU map: **VERIFIED**

The product has a different official code for each selected size. The current
V4.4 bridge accepts one product-level SKU and cannot safely collapse four
official size SKUs into one value.

## Six-dimension visual comparison

| Dimension | Supplier image evidence | Official Tier-1 evidence | Result |
|---|---|---|---|
| Material | Substantial knitted/jacquard construction; reverse knit is visible in the detail images | Cotton-blend jersey, 60% cotton / 40% polyamide | MATCH |
| Damier pattern | Large alternating navy/white jacquard blocks made from elongated loop motifs | Large Damier jacquard knit | MATCH |
| Color | Navy ground with white pattern and trim | Navy | MATCH |
| Waist | Ribbed elastic waist, white drawstring, metal-tipped ends | Drawstring waist | MATCH |
| Pockets and hems | Two side pockets with contrasting white piping; white hem trim | Two side pockets; contrasting trim on pockets and hems | MATCH |
| Branding | `MARQUE L. VUITTON DEPOSEE` on the left leg; internal `LOUIS VUITTON PARIS` label | `L.Vuitton Marque déposée` incorporated in jacquard on left leg | MATCH |

The front silhouette, rear panel layout, pattern placement, waistband, pocket
trim, hem trim, left-leg signature and inside knit construction collectively
exclude the silk candidate and identify the quilted cotton model.

## Official size-level SKU map

| Store size | Official selected size | Official SKU | Evidence |
|---|---|---|---|
| S | S | `1AFWUI` | https://id.louisvuitton.com/eng-id/products/damier-quilted-cotton-shorts-nvprod5530143v/1AFWUI |
| M | M | `1AFWUJ` | https://id.louisvuitton.com/eng-id/products/damier-quilted-cotton-shorts-nvprod5530143v/1AFWUJ |
| L | L | `1AFWUK` | https://id.louisvuitton.com/ind-id/products/damier-quilted-cotton-shorts-nvprod5530143v/1AFWUK |
| XL | XL | `1AFWUL` | https://id.louisvuitton.com/eng-id/products/damier-quilted-cotton-shorts-nvprod5530143v/1AFWUL |

## Rejected identifiers

| Identifier | Decision | Reason |
|---|---|---|
| `1AK75V` | REJECT | Azure silk Damier Polka Dots shorts; material, print and color do not match |
| `536027549789467` | REJECT | MrShopPlus internal product ID |
| `536027549788436` | REJECT | MrShopPlus default variant ID |
| `RM182M FMB HFY07W` | REJECT | Visible supplier care-label code resolves to an unrelated Louis Vuitton T-shirt, not these shorts |
| `HRY71WNGG925` | DO NOT PUBLISH AS SKU | Official image asset/style token is not presented by the product page as the selected-size SKU |
| `nvprod5530143v` | DO NOT PUBLISH AS SKU | Official product-family page identifier, not a selected-size SKU |

## Execution consequence

Use `Louis Vuitton Damier Quilted Cotton Shorts Navy` as the exact consumer
entity. Keep the singular PDP/Schema SKU omitted until the bridge supports a
verified variant-SKU map. Do not select one size code as the SKU for the whole
product.

The production plan remains blocked independently by the incomplete fresh
snapshot (`seo_fields` and `variants` missing), so this identity result does not
authorize execution.
