/** V5.0 preview decision gate: deliberate fail-closed policy, no I/O or writes. */
export type V50SkuVerdict = 'VERIFIED_SKU' | 'SKU_OMIT' | 'HOLD';
export type V50Unit = 'single_hoodie' | 'single_pants' | 'set' | 'other';
export type V50GateInput = {
  image_reviewed: boolean;
  independent_reference_matched: boolean;
  exact_entity_match: boolean;
  sku_verdict: V50SkuVerdict;
  sku?: string | null;
  sku_source_exact_entity?: boolean;
  sold_unit: V50Unit;
  selected_unit: V50Unit;
  variant_selected_and_verified: boolean;
  size_selected_and_verified: boolean;
  checkout_verified: boolean;
  subtitle_matches_purchase_unit: boolean;
  variant_price_verified: boolean;
  schema_offer_matches_frontend: boolean;
  internal_brand_url: string;
  internal_link_live_verified: boolean;
  brand: string;
  slug: string;
  canonical_url: string;
  key_description_html: string;
  meta_description: string;
  gallery_checked: boolean;
  schema_checked: boolean;
  frontend_mobile_360_checked: boolean;
  frontend_tablet_768_checked: boolean;
};

export type V50GateResult = { status: 'PASS' | 'HOLD'; codes: string[] };
const origin = 'https://www.dripsneakers.org';
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const skuPlaceholder = /^(n\/a|unknown|pending|not verified|none)$/i;

export function validateV50(input: V50GateInput): V50GateResult {
  const codes: string[] = [];
  if (!input.image_reviewed) codes.push('P0_VISUAL_NOT_REVIEWED');
  if (!input.independent_reference_matched || !input.exact_entity_match) codes.push('P0_EXACT_ENTITY');
  if (input.sku_verdict === 'HOLD') codes.push('P0_SKU_HOLD');
  if (input.sku_verdict === 'VERIFIED_SKU' &&
      (!input.sku?.trim() || skuPlaceholder.test(input.sku.trim()) || !input.sku_source_exact_entity)) codes.push('P0_SKU_EVIDENCE');
  if (input.sku_verdict === 'SKU_OMIT' && input.sku?.trim()) codes.push('P0_SKU_MUST_OMIT');
  if (input.sold_unit !== input.selected_unit) codes.push('P0_PURCHASE_UNIT_MISMATCH');
  if (!input.variant_selected_and_verified || !input.size_selected_and_verified || !input.checkout_verified || !input.variant_price_verified) codes.push('P0_PURCHASE_NOT_VERIFIED');
  if (!input.subtitle_matches_purchase_unit) codes.push('P0_SUBTITLE_UNIT_MISMATCH');
  if (!input.schema_offer_matches_frontend) codes.push('P0_SCHEMA_OFFER_MISMATCH');
  if (!input.internal_link_live_verified) codes.push('P0_INTERNAL_LINK_NOT_VERIFIED');
  if (input.internal_brand_url.startsWith('http') || !/^\/[A-Za-z0-9-]+\/$/.test(input.internal_brand_url)) codes.push('P0_INTERNAL_LINK_RELATIVE_PATH');
  if (input.brand.toLowerCase() === 'chanel' && input.internal_brand_url !== '/Chanel/') codes.push('P0_CHANEL_LINK');
  if (!slugRe.test(input.slug)) codes.push('P0_SLUG_ONLY');
  if (input.canonical_url !== `${origin}/${input.slug}`) codes.push('P0_CANONICAL');
  const html = input.key_description_html;
  if (!/<p\b[^>]*>[^<]+<\/p>/i.test(html) || !/<h2>\s*Product Details\s*<\/h2>/i.test(html) || (html.match(/<li\b/gi) || []).length !== 5) codes.push('P0_KEY_DESCRIPTION_FORMAT');
  if (!/<strong>\s*Brand:\s*<\/strong>\s*<a\s+href="\/[^"]+"[^>]*>\s*<strong>/i.test(html)) codes.push('P0_BRAND_LINK_FORMAT');
  if (input.sku_verdict === 'SKU_OMIT' && /<strong>\s*SKU:\s*<\/strong>/i.test(html)) codes.push('P0_SKU_IN_DETAILS');
  for (const assurance of ['QC photos','30-day returns','7–20 day shipping']) {
    if (!input.meta_description.toLowerCase().includes(assurance.toLowerCase())) codes.push('P0_META_ASSURANCE');
  }
  if (!/\breps\b/i.test(input.meta_description)) codes.push('P0_META_REPS_INTENT');
  if (!input.gallery_checked || !input.schema_checked) codes.push('P0_MEDIA_SCHEMA_NOT_VERIFIED');
  if (!input.frontend_mobile_360_checked || !input.frontend_tablet_768_checked) codes.push('P0_MOBILE_NOT_VERIFIED');
  return { status: codes.length ? 'HOLD' : 'PASS', codes: [...new Set(codes)] };
}
