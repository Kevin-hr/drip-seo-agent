import test from 'node:test';
import assert from 'node:assert/strict';
import { loadV50PreviewStandard, V50_STANDARD_SHA256 } from '../src/v50-standard.js';
import { validateV50, type V50GateInput } from '../src/v50-gates.js';

function good(): V50GateInput {
  return {
    image_reviewed: true, independent_reference_matched: true, exact_entity_match: true,
    sku_verdict: 'SKU_OMIT', sold_unit: 'set', selected_unit: 'set',
    variant_selected_and_verified: true, size_selected_and_verified: true, checkout_verified: true,
    subtitle_matches_purchase_unit: true, variant_price_verified: true, schema_offer_matches_frontend: true,
    brand: 'Sp5der', internal_brand_url: '/Sp5der/', internal_link_live_verified: true,
    slug: 'sp5der-og-web-suit-black',
    canonical_url: 'https://www.dripsneakers.org/sp5der-og-web-suit-black',
    key_description_html: '<p>Verified matching black hoodie and pants.</p><h2>Product Details</h2><ul>' +
      '<li><strong>Brand:</strong> <a href="/Sp5der/"><strong>Sp5der</strong></a></li>' +
      '<li><strong>Product Type:</strong> Set</li><li><strong>Model:</strong> OG Web</li>' +
      '<li><strong>Colorway:</strong> Black</li><li><strong>Set Includes:</strong> Hoodie and Sweatpants</li></ul>',
    meta_description: 'Shop Sp5der OG Web Suit Black reps at Drip Sneakers with QC photos, 30-day returns and 7–20 day shipping.',
    gallery_checked: true, schema_checked: true,
    frontend_mobile_360_checked: true, frontend_tablet_768_checked: true,
  };
}

test('V5.0 preview standard is byte-pinned', () => {
  assert.equal(loadV50PreviewStandard().standard_hash, V50_STANDARD_SHA256);
});
test('a fully evidenced product is eligible only for PREVIEW pass', () => {
  assert.deepEqual(validateV50(good()), { status: 'PASS', codes: [] });
});
test('legacy URL and unreviewed images cannot establish identity', () => {
  const result=validateV50({...good(),image_reviewed:false});
  assert.ok(result.codes.includes('P0_VISUAL_NOT_REVIEWED'));
});
test('incorrect hoodie default blocks a set PDP', () => {
  const result=validateV50({...good(),selected_unit:'single_hoodie'});
  assert.ok(result.codes.includes('P0_PURCHASE_UNIT_MISMATCH'));
});
test('SKU_OMIT must not leak an unverified SKU', () => {
  assert.ok(validateV50({...good(),sku:'supplier-6790'}).codes.includes('P0_SKU_MUST_OMIT'));
});
test('verified SKU requires independent exact-entity source', () => {
  assert.ok(validateV50({...good(),sku_verdict:'VERIFIED_SKU',sku:'AWDNGH1023-812',sku_source_exact_entity:false}).codes.includes('P0_SKU_EVIDENCE'));
});
test('slug-only rule rejects leading slash', () => {
  assert.ok(validateV50({...good(),slug:'/sp5der-og-web-suit-black'}).codes.includes('P0_SLUG_ONLY'));
});
test('Chanel brand row must use /Chanel/', () => {
  assert.ok(validateV50({...good(),brand:'Chanel', internal_brand_url:'/chanel/'}).codes.includes('P0_CHANEL_LINK'));
});
test('unverified internal links block release', () => {
  assert.ok(validateV50({...good(),internal_link_live_verified:false}).codes.includes('P0_INTERNAL_LINK_NOT_VERIFIED'));
});
test('meta description preserves V4.6 assurances', () => {
  assert.ok(validateV50({...good(),meta_description:'Shop Sp5der jeans reps'}).codes.includes('P0_META_ASSURANCE'));
});
test('mobile and purchase checks cannot be skipped', () => {
  const r=validateV50({...good(),checkout_verified:false,frontend_mobile_360_checked:false});
  assert.ok(r.codes.includes('P0_PURCHASE_NOT_VERIFIED'));
  assert.ok(r.codes.includes('P0_MOBILE_NOT_VERIFIED'));
});

test('subtitle mismatched to default purchasable unit blocks release', () => {
  assert.ok(validateV50({...good(),subtitle_matches_purchase_unit:false}).codes.includes('P0_SUBTITLE_UNIT_MISMATCH'));
});
test('merchant offer and displayed variant price mismatch block release', () => {
  const r=validateV50({...good(),schema_offer_matches_frontend:false,variant_price_verified:false});
  assert.ok(r.codes.includes('P0_SCHEMA_OFFER_MISMATCH'));
  assert.ok(r.codes.includes('P0_PURCHASE_NOT_VERIFIED'));
});
