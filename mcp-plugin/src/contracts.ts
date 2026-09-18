import { z } from "zod";

export const EvidenceSchema = z.object({
  tier: z.number().int().min(1).max(8),
  source_name: z.string().min(1),
  url: z.string().url(),
  product_name: z.string().optional(),
  sku: z.string().nullable().optional(),
  exact_entity_match: z.boolean(),
  notes: z.string().optional(),
});

export const ExactEntitySchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  product_type: z.string().min(1),
  colorway: z.string().min(1),
  collaboration_or_collection: z.string().nullable().optional(),
});

export const SkuResolutionSchema = z.object({
  verdict: z.enum(["VERIFIED_SKU", "SKU_OMIT", "HOLD"]),
  exact_entity: ExactEntitySchema,
  sku: z.string().nullable(),
  evidence: z.array(EvidenceSchema).min(1),
  conflicts: z.array(z.string()).default([]),
  decision_note: z.string().min(1),
});

export type SkuResolution = z.infer<typeof SkuResolutionSchema>;

export const ToolEnvelopeSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  data: z.unknown().optional(),
});

export const ProductSearchInput = z.object({
  query: z.string().min(1).describe("Product name, model, Product ID, or keyword to search in the existing MrShopPlus workflow."),
  status: z.enum(["all", "published", "unpublished"]).default("all"),
  limit: z.number().int().min(1).max(100).default(30),
});

export const ProductReadInput = z.object({
  product_id: z.string().min(1).describe("MrShopPlus/Supplier Product ID. This is NEVER a public SKU."),
});

export const V44DetailFieldSchema = z.object({
  label: z.string().min(1).describe("Product Details row label, e.g. SKU, Graphic, Release Status."),
  value: z.string().min(1),
});

/**
 * Facts ChatGPT must supply before the local bridge can compose a V4.4 plan.
 * Nothing here is inferred locally: an omitted required field makes the dry run
 * fail explicitly instead of producing a guess.
 */
export const V44FactsSchema = z.object({
  consumer_product_name: z
    .string()
    .min(1)
    .optional()
    .describe("Consumer-facing exact product name. Omit to let the bridge compose it from exact_entity."),
  decision_sentence: z
    .string()
    .min(1)
    .optional()
    .describe("V4.4 §12: one concise verified sentence describing the colorway and the most distinctive graphic/feature."),
  brand_internal_url: z
    .string()
    .url()
    .optional()
    .describe("V4.4 §15: a real, crawlable Drip Sneakers internal URL for the Brand row. Never invent one."),
  product_details_fifth: V44DetailFieldSchema
    .optional()
    .describe("V4.4 §14: required when no SKU is verified; must be a verified product-specific fact."),
  url_slug: z.string().min(1).optional().describe("Optional explicit slug."),
  migrate_url: z
    .boolean()
    .default(false)
    .describe("V4.4 §10: set only when the existing live URL contains supplier noise, a wrong identifier, ambiguity or broken slug residue."),
  redirect_from: z.string().min(1).optional(),
});

export type V44Facts = z.infer<typeof V44FactsSchema>;

export const ProductPrepareInput = z.object({
  product_id: z.string().min(1),
  sku_resolution: SkuResolutionSchema,
  v44_facts: V44FactsSchema.optional(),
  operation: z.enum(["auto", "optimize_existing", "publish_new"]).default("auto"),
  user_instruction: z.string().optional(),
});

export const ProductExecuteInput = z.object({
  product_id: z.string().min(1),
  plan_id: z.string().min(1).describe("Immutable dry-run plan ID returned by prepare_product_v44."),
});

export const ProductVerifyInput = z.object({
  product_id: z.string().min(1),
  plan_id: z
    .string()
    .min(1)
    .optional()
    .describe("The immutable plan that produced the write. Required for V4.4 storefront acceptance because the draft must be compared against the live page."),
  run_id: z.string().min(1).optional(),
});

export const CategorySearchInput = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(30),
});

export const CategoryReadInput = z.object({
  category_id: z.string().min(1),
});

export const CategoryPrepareInput = z.object({
  category_id: z.string().min(1),
  instruction: z.string().min(1).describe("Category-page SEO instruction. Do not apply PDP-only V4.4 fields such as SKU or Product schema."),
  evidence_urls: z.array(z.string().url()).default([]),
});

export const CategoryExecuteInput = z.object({
  category_id: z.string().min(1),
  plan_id: z.string().min(1),
});

export const CategoryVerifyInput = z.object({
  category_id: z.string().min(1),
  run_id: z.string().min(1).optional(),
});

export const RunStatusInput = z.object({
  run_id: z.string().min(1),
});

export const ProductImagesInput = z.object({
  product_id: z.string().min(1).describe("MrShopPlus/Supplier Product ID. This is NEVER a public SKU."),
  max_images: z.number().int().min(1).max(8).default(6),
});
