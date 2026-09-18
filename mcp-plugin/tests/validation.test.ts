import test from "node:test";
import assert from "node:assert/strict";
import { skuRejectionReason, validateSkuResolution } from "../src/validation.js";

const entity = {
  brand: "Nike",
  model: "Air Jordan 4 Retro",
  product_type: "Sneaker",
  colorway: "Example",
  collaboration_or_collection: null,
};

const resolution = (over: Record<string, unknown> = {}) => ({
  verdict: "VERIFIED_SKU" as const,
  exact_entity: entity,
  sku: null as string | null,
  evidence: [
    { tier: 1, source_name: "Brand", url: "https://example.com/p", exact_entity_match: true },
  ],
  conflicts: [] as string[],
  decision_note: "test",
  ...over,
});

// ---------------------------------------------------------------- VERIFIED_SKU

test("rejects MrShopPlus internal Product ID as VERIFIED_SKU", () => {
  const errors = validateSkuResolution(
    resolution({
      sku: "536027557118233",
      evidence: [
        {
          tier: 1,
          source_name: "Brand",
          url: "https://example.com/p",
          sku: "536027557118233",
          exact_entity_match: true,
        },
      ],
    }),
  );
  assert.ok(errors.some((e) => e.includes("internal/placeholder")));
});

test("accepts verified SKU with Tier 1-4 exact-entity evidence", () => {
  const errors = validateSkuResolution(
    resolution({
      sku: "FJ3460-012",
      evidence: [
        {
          tier: 2,
          source_name: "StockX",
          url: "https://stockx.com/example",
          sku: "FJ3460-012",
          exact_entity_match: true,
        },
      ],
    }),
  );
  assert.deepEqual(errors, []);
});

test("VERIFIED_SKU requires evidence that carries the same SKU", () => {
  const errors = validateSkuResolution(
    resolution({
      sku: "FJ3460-012",
      evidence: [
        {
          tier: 1,
          source_name: "Brand",
          url: "https://example.com/p",
          sku: "CT8012-005",
          exact_entity_match: true,
        },
      ],
    }),
  );
  assert.ok(errors.some((e) => e.includes("Tier 1-4")));
});

test("evidence from tier 5 or lower does not qualify a SKU", () => {
  const errors = validateSkuResolution(
    resolution({
      sku: "FJ3460-012",
      evidence: [
        {
          tier: 6,
          source_name: "Marketplace",
          url: "https://example.com/p",
          sku: "FJ3460-012",
          exact_entity_match: true,
        },
      ],
    }),
  );
  assert.ok(errors.some((e) => e.includes("Tier 1-4")));
});

test("evidence without exact_entity_match does not qualify a SKU", () => {
  const errors = validateSkuResolution(
    resolution({
      sku: "FJ3460-012",
      evidence: [
        {
          tier: 1,
          source_name: "Brand",
          url: "https://example.com/p",
          sku: "FJ3460-012",
          exact_entity_match: false,
        },
      ],
    }),
  );
  assert.ok(errors.some((e) => e.includes("Tier 1-4")));
});

// --------------------------------------------------------- forbidden SKU forms

test("forbidden SKU forms are rejected structurally", () => {
  const cases: Array<[string, string]> = [
    ["536027557118233", "MrShopPlus internal Product ID"],
    ["536027038836496", "MrShopPlus internal Product ID"],
    ["418932770517528", "bare long numeric identifier (supplier / listing ID shape)"],
    ["N/A", "placeholder value"],
    ["Unknown", "placeholder value"],
    ["Pending", "placeholder value"],
    ["Not verified", "placeholder value"],
    ["https://www.dripsneakers.org/x", "URL"],
    ["/air-jordan-11-retro-blue", "URL suffix or path fragment"],
    ["chrome_hearts_t_shirt_1E3165B42D518.jpeg", "image filename"],
    ["GEN-88213", "generated code"],
  ];
  for (const [sku, expected] of cases) {
    assert.equal(skuRejectionReason(sku), expected, `${sku} should be rejected as ${expected}`);
  }
});

test("real style codes observed in the storefront are accepted", () => {
  // 528895-153 and 528895 are production-verified Nike codes; shape checks must
  // never reject a legitimate all-numeric style code.
  for (const sku of ["FJ3460-012", "1ABMHV", "IH0296-400", "528895-153", "528895", "677403 W3RB1 3031"]) {
    assert.equal(skuRejectionReason(sku), null, `${sku} should be accepted`);
  }
});

// ------------------------------------------------------------------ SKU_OMIT

test("SKU_OMIT must have null sku", () => {
  const errors = validateSkuResolution(resolution({ verdict: "SKU_OMIT", sku: "MAYBE" }));
  assert.ok(errors.some((e) => e.includes("sku=null")));
});

test("SKU_OMIT with null sku is allowed to continue", () => {
  const errors = validateSkuResolution(
    resolution({ verdict: "SKU_OMIT", sku: null, decision_note: "Exact entity PASS, no verifiable SKU" }),
  );
  assert.deepEqual(errors, []);
});

// ---------------------------------------------------------------------- HOLD

test("HOLD requires at least one identity-critical conflict", () => {
  const errors = validateSkuResolution(resolution({ verdict: "HOLD", sku: null, conflicts: [] }));
  assert.ok(errors.some((e) => e.includes("conflict")));
});

test("HOLD carrying a conflict is a valid resolution and blocks publishing", () => {
  const errors = validateSkuResolution(
    resolution({
      verdict: "HOLD",
      sku: null,
      conflicts: ["Backend name says Bleached Coral but the main image shows White/Black"],
    }),
  );
  assert.deepEqual(errors, []);
});

test("a non-HOLD resolution cannot carry unresolved conflicts", () => {
  const errors = validateSkuResolution(
    resolution({
      verdict: "SKU_OMIT",
      sku: null,
      conflicts: ["entity ambiguity unresolved"],
    }),
  );
  assert.ok(errors.some((e) => e.includes("conflict")));
});
