import express from "express";

const app = express();
app.use(express.json());

const token = process.env.LOCAL_AGENT_TOKEN ?? "change-me";
app.use((req, res, next) => {
  if (req.header("authorization") !== `Bearer ${token}`) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  next();
});

const products = [
  {
    product_id: "536027557118233",
    name: "Louis Vuitton LV Footprint Soccer Blue",
    status: "published",
    public_url: "https://www.dripsneakers.org/louis-vuitton-lv-footprint-soccer-blue",
    images: ["https://example.com/lv-footprint-blue-front.jpg"],
    sku_status: "UNRESOLVED",
    current_schema_sku: "536027557118233",
    warning: "current_schema_sku is an internal Product ID, not a public SKU",
  },
];

const plans = new Map<string, unknown>();

app.post("/api/chatgpt-mcp/products/search", (req, res) => {
  const q = String(req.body?.query ?? "").toLowerCase();
  res.json({ products: products.filter((p) => p.name.toLowerCase().includes(q) || p.product_id.includes(q)) });
});

app.post("/api/chatgpt-mcp/products/read", (req, res) => {
  const product = products.find((p) => p.product_id === String(req.body?.product_id));
  if (!product) return res.status(404).json({ error: "product_not_found" });
  res.json({
    ...product,
    local_evidence: [],
    v44_required: true,
    research_instruction: "Resolve exact entity/SKU externally; never use product_id as SKU.",
  });
});

app.post("/api/chatgpt-mcp/products/prepare-v44", (req, res) => {
  const product = products.find((p) => p.product_id === String(req.body?.product_id));
  if (!product) return res.status(404).json({ error: "product_not_found" });
  const planId = `plan_${Date.now()}`;
  const plan = {
    plan_id: planId,
    product_id: product.product_id,
    standard: "SEO-PDP V4.4",
    validation: "PASS",
    sku_resolution: req.body.sku_resolution,
    proposed_changes: {
      product_name: product.name,
      note: "Mock only. Existing local Agent should generate actual backend-ready fields.",
    },
  };
  plans.set(planId, plan);
  res.json(plan);
});

app.post("/api/chatgpt-mcp/products/execute-v44", (req, res) => {
  const plan = plans.get(String(req.body?.plan_id));
  if (!plan) return res.status(409).json({ error: "unknown_or_expired_plan" });
  res.json({ run_id: `run_${Date.now()}`, status: "MOCK_EXECUTED", plan });
});

app.post("/api/chatgpt-mcp/products/verify-v44", (req, res) => {
  res.json({ product_id: req.body?.product_id, pass: true, checks: ["http200", "seo_title", "h1", "canonical", "meta", "kd_li5", "desc_alt"] });
});

app.post("/api/chatgpt-mcp/categories/search", (_req, res) => res.json({ categories: [] }));
app.post("/api/chatgpt-mcp/categories/read", (req, res) => res.json({ category_id: req.body?.category_id, page_type: "CATEGORY" }));
app.post("/api/chatgpt-mcp/categories/prepare-seo", (req, res) => res.json({ plan_id: `cat_plan_${Date.now()}`, category_id: req.body?.category_id, validation: "PASS" }));
app.post("/api/chatgpt-mcp/categories/execute-seo", (req, res) => res.json({ run_id: `cat_run_${Date.now()}`, category_id: req.body?.category_id, status: "MOCK_EXECUTED" }));
app.post("/api/chatgpt-mcp/categories/verify-seo", (req, res) => res.json({ category_id: req.body?.category_id, pass: true }));
app.post("/api/chatgpt-mcp/runs/status", (req, res) => res.json({ run_id: req.body?.run_id, status: "DONE", pass: 1, hold: 0, failed: 0 }));

const port = Number(process.env.MOCK_AGENT_PORT ?? "8787");
app.listen(port, () => console.log(`Mock local Agent listening on http://127.0.0.1:${port}`));
