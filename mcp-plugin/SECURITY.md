# Security model

## Trust boundary

ChatGPT is allowed to propose research conclusions and select business tools. It is **not** trusted to construct arbitrary MrShopPlus write payloads.

## Mandatory controls

1. Product IDs are internal IDs and are never accepted as verified public SKU.
2. `prepare_product_v44` is read-only and evidence-gated.
3. `execute_product_v44` accepts only an immutable `plan_id` and matching Product ID.
4. The local Agent must reject stale snapshot hashes/version mismatches before write.
5. No delete tool is exposed.
6. Local Agent credentials remain local; MCP tool outputs must not contain access tokens, cookies, or MrShopPlus secrets.
7. Every write must be followed by read-back/storefront verification.

## Image proxy SSRF protection

`get_product_images` blocks localhost/private-network destinations, URL credentials, redirects, and oversized image responses before returning image content to ChatGPT.
