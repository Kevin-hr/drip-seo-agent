# Drip clothing brand navigation

Verified on 2026-11-07 after CMS publication and an independent read-back. The [manifest](manifest.json) records the public routes and labels from that run.

| Marketing page | Brand cards on the first screen | Last content section before the site footer |
| --- | --- | --- |
| [Hoodies](https://www.dripsneakers.org/streetwear-hoodies) | 12, in 4 columns | Explore jeans and Explore jackets |
| [Jeans](https://www.dripsneakers.org/streetwear-jeans) | 5, in 3 columns | Explore hoodies and Explore jackets |
| [Jackets](https://www.dripsneakers.org/streetwear-jackets) | 7, in 4 columns | Explore hoodies and Explore jeans |

The brand cards use the native image/text list and existing product photos. The footer recommendations use a native rich text section. The jeans list links to Dsquared2 after inspection showed that the Louis Vuitton Jeans destination contained sneakers. The Canada Goose category contained other brands and footwear, so its jackets remain reachable in the original product section. The two original product sections each retained the same set of 48 public product links. The three marketing URLs and their TDK fields were preserved.

## Repeat the rollout

1. Match the CMS store domain, marketing record and public URL. Back up the relevant fields and the public product link set.
2. Inspect the merchandise inside each proposed category. Select a representative image from the matching brand and product type. Verify the public destination and the presence of products.
3. Place the native image/text list directly after the heading. Fit the whole list into the small phone viewport. Keep the Explore links in the final content component, immediately above the site footer.
4. Re-read the record for concurrent edits. Save one page, read back the saved record independently, then verify the public page before proceeding to the next one.
5. Compare unique public product links against the baseline. A save can recalculate the native product section's item count. For this run, six columns and eight rows in the native desktop settings restored the 48-link feed while retaining the prior mobile settings. Verify against the published response because the preview may retain cached product data.

## Browser checks

Use an owned same-origin browser test page with iframes named `phone-320`, `phone-390` and `phone-430`. Load the public marketing URL with `?device=phone` at viewport sizes 320×568, 390×844 and 430×932. Verify the actual phone theme and allow images to render after a refresh. The [phone probe](verify-phone.js) measures card bounds, image loading, horizontal overflow, canonical, and the position of the two Explore links. Compare its observed labels and destinations with the manifest.

Run the [navigation probe](verify-navigation.js) in the same owned test page after rendering. It clicks the brand cards and Explore links inside `phone-390`, records the actual destinations and displayed product counts, and returns to the marketing page between links. Compare expected and actual URLs and confirm each destination displays products.

On 2026-11-07 all cards fit on the first screen at all three sizes. All 24 brand clicks and six Explore clicks reached the expected destinations. The browser checks used the public phone template in CSS viewports. Physical devices, social app browsers and regional networks remain outside that evidence.

See the [prior SEO workflow](../clothing-seo-20261106.md) for research and indexing checks.
