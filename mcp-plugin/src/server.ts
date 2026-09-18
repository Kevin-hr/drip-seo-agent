import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import express from "express";
import { z } from "zod";

import { config } from "./config.js";
import {
  CategoryExecuteInput,
  CategoryPrepareInput,
  CategoryReadInput,
  CategorySearchInput,
  CategoryVerifyInput,
  ProductExecuteInput,
  ProductImagesInput,
  ProductPrepareInput,
  ProductReadInput,
  ProductSearchInput,
  ProductVerifyInput,
  RunStatusInput,
} from "./contracts.js";
import { LocalAgentClient, LocalAgentError } from "./localAgent.js";
import { extractProductImageUrls, fetchImagesForMcp } from "./images.js";
import { failure, success } from "./result.js";
import { getStandardInfo, standardEnvelope } from "./standard.js";
import { validateSkuResolution } from "./validation.js";

const SERVER_VERSION = "0.1.0";
const outputSchema = {
  ok: z.boolean(),
  message: z.string(),
  standard_version: z.string(),
  standard_status: z.string(),
  standard_hash: z.string(),
  standard_file: z.string(),
  data: z.unknown().optional(),
};

/**
 * Fail fast: compute the canonical standard hash at startup. If the reference
 * document is missing, renamed, or unexpectedly modified, the server refuses to
 * start rather than planning against an unknown standard.
 */
const STARTUP_STANDARD = getStandardInfo();

function createServer(): McpServer {
  const server = new McpServer({
    name: "drip-seo-executor",
    version: SERVER_VERSION,
  });
  const agent = new LocalAgentClient();

  const callAgent = async (path: string, body: unknown, label: string) => {
    try {
      const data = await agent.post(path, body);
      return success(`${label} completed.`, data);
    } catch (error) {
      if (error instanceof LocalAgentError) {
        return failure(`${label} failed: ${error.message}`, {
          status: error.status,
          body: error.body,
        });
      }
      return failure(`${label} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  server.registerTool(
    "search_products",
    {
      title: "Search Drip products",
      description:
        "Read-only. Search the existing local MrShopPlus workflow for product candidates by product name, model, keyword, or Product ID. Use this before reading or modifying a PDP. Product IDs returned here are internal identifiers and MUST NOT be treated as public SKU/style codes.",
      inputSchema: ProductSearchInput.shape,
      outputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async (input) => callAgent(config.paths.productSearch, input, "Product search"),
  );

  server.registerTool(
    "get_product_context",
    {
      title: "Read product context",
      description:
        "Read-only. Load the complete product snapshot needed for SEO-PDP V4.4 research: current name, images, supplier data, URL, status, existing SEO fields, and local evidence. If exact entity or SKU is unresolved, use ChatGPT's own web/image research capabilities BEFORE calling prepare_product_v44. Never reuse the MrShopPlus Product ID, supplier ID, image filename, URL suffix, or platform Schema sku as a public SKU.",
      inputSchema: ProductReadInput.shape,
      outputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async (input) => callAgent(config.paths.productRead, input, "Product context read"),
  );

  server.registerTool(
    "get_product_images",
    {
      title: "Load product images for visual verification",
      description:
        "Read-only. Load the actual product images from the existing local product snapshot and return them as MCP image content so ChatGPT can visually verify colorway, graphics, collaboration details, and exact entity before deciding SKU. Product ID and platform Schema sku remain internal identifiers and are never valid SKU evidence by themselves.",
      inputSchema: ProductImagesInput.shape,
      outputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async (input) => {
      try {
        const snapshot = await agent.post(config.paths.productRead, { product_id: input.product_id });
        const urls = extractProductImageUrls(snapshot, input.max_images);
        if (urls.length === 0) {
          return failure("No product image URLs were found in the local product snapshot.", { product_id: input.product_id });
        }
        const loaded = await fetchImagesForMcp(urls);
        if (loaded.content.length === 0) {
          return failure("Product image URLs were found but none could be loaded for ChatGPT vision.", { urls, failures: loaded.failures });
        }
        return {
          content: [
            { type: "text" as const, text: `Loaded ${loaded.content.length}/${urls.length} product images for visual Exact Entity verification.` },
            ...loaded.content,
          ],
          structuredContent: {
            ok: true,
            message: "Product images loaded for visual Exact Entity verification.",
            ...standardEnvelope(),
            data: { product_id: input.product_id, urls, failures: loaded.failures },
          },
        };
      } catch (error) {
        if (error instanceof LocalAgentError) {
          return failure(`Product image load failed: ${error.message}`, { status: error.status, body: error.body });
        }
        return failure(`Product image load failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  );

  server.registerTool(
    "prepare_product_v44",
    {
      title: "Prepare SEO-PDP V4.4 update",
      description:
        "Read-only dry run. Use only after ChatGPT has resolved the exact entity and SKU verdict from evidence. Pass VERIFIED_SKU only when a Tier 1-4 source explicitly attaches the same SKU/style code to the exact entity; otherwise use SKU_OMIT. Use HOLD when identity-critical evidence conflicts. Supply `v44_facts` with the verified decision sentence, the real Drip Sneakers Brand internal URL, and (when no SKU is verified) the fifth Product Details field. This tool asks the existing local Agent to generate and validate the backend-ready V4.4 plan but DOES NOT write MrShopPlus. A successful response should include an immutable plan_id; only that plan can be executed later.",
      inputSchema: ProductPrepareInput.shape,
      outputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async (input) => {
      const errors = validateSkuResolution(input.sku_resolution);
      if (errors.length) {
        return failure("SKU/Entity evidence gate failed. No plan was created.", { errors });
      }
      if (input.sku_resolution.verdict === "HOLD") {
        return failure("Exact entity/SKU verdict is HOLD. V4.4 forbids preparing a publish-ready PDP.", {
          conflicts: input.sku_resolution.conflicts,
        });
      }
      return callAgent(config.paths.productPrepare, input, "V4.4 dry run");
    },
  );

  server.registerTool(
    "execute_product_v44",
    {
      title: "Execute approved SEO-PDP V4.4 plan",
      description:
        "WRITE ACTION. Apply one previously prepared immutable V4.4 plan through the existing local Agent/MrShopPlus API workflow. Do not use this tool without a plan_id returned by prepare_product_v44 for the same product_id. The local Agent must re-check product identity/version and V4.4 validation before saveModify/publish. This tool never accepts arbitrary SEO fields directly, which prevents bypassing the dry-run gate.",
      inputSchema: ProductExecuteInput.shape,
      outputSchema,
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    },
    async (input) => callAgent(config.paths.productExecute, input, "V4.4 execution"),
  );

  server.registerTool(
    "verify_product_v44",
    {
      title: "Verify published PDP",
      description:
        "Read-only. Re-run the existing backend read-back and storefront acceptance checks after a product write. Verify HTTP 200, SEO title, H1, canonical, meta, Key Description sentence + exactly five Product Details, verified brand link, image-only Description with ALT, schema entity consistency, forbidden terms, IsShow, and sitemap/URL expectations. Treat platform-generated internal Product ID in Schema sku as a platform artifact, not verified public SKU.",
      inputSchema: ProductVerifyInput.shape,
      outputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async (input) => callAgent(config.paths.productVerify, input, "PDP verification"),
  );

  server.registerTool(
    "search_categories",
    {
      title: "Search product categories",
      description:
        "Read-only. Search MrShopPlus/Drip product category or collection pages. Category pages are NOT PDPs: do not force SKU, five Product Details, or Product schema onto category pages.",
      inputSchema: CategorySearchInput.shape,
      outputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async (input) => callAgent(config.paths.categorySearch, input, "Category search"),
  );

  server.registerTool(
    "get_category_context",
    {
      title: "Read category context",
      description:
        "Read-only. Read the current category/collection page fields and local SEO context before proposing a category-page SEO change. Keep PDP-only V4.4 rules separate from category SEO rules.",
      inputSchema: CategoryReadInput.shape,
      outputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async (input) => callAgent(config.paths.categoryRead, input, "Category context read"),
  );

  server.registerTool(
    "prepare_category_seo",
    {
      title: "Prepare category SEO update",
      description:
        "Read-only dry run. Send a researched category-page SEO instruction to the existing local Agent. The local Agent should validate page type and produce an immutable plan_id without writing. Do not include or invent a product SKU for a category page.",
      inputSchema: CategoryPrepareInput.shape,
      outputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async (input) => callAgent(config.paths.categoryPrepare, input, "Category SEO dry run"),
  );

  server.registerTool(
    "execute_category_seo",
    {
      title: "Execute approved category SEO plan",
      description:
        "WRITE ACTION. Apply one immutable category SEO plan previously returned by prepare_category_seo. The local Agent must verify the category ID/version before writing through the existing MrShopPlus API workflow.",
      inputSchema: CategoryExecuteInput.shape,
      outputSchema,
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    },
    async (input) => callAgent(config.paths.categoryExecute, input, "Category SEO execution"),
  );

  server.registerTool(
    "verify_category_seo",
    {
      title: "Verify category SEO",
      description:
        "Read-only. Verify the category/collection page after execution using the existing local acceptance workflow.",
      inputSchema: CategoryVerifyInput.shape,
      outputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async (input) => callAgent(config.paths.categoryVerify, input, "Category SEO verification"),
  );

  server.registerTool(
    "get_run_status",
    {
      title: "Get execution run status",
      description:
        "Read-only. Read progress, PASS/HOLD/failed counts, and checkpoint information for a batch run created by the existing local Agent. Use this for resumable multi-product jobs rather than relying on chat memory.",
      inputSchema: RunStatusInput.shape,
      outputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async (input) => callAgent(config.paths.runStatus, input, "Run status read"),
  );

  return server;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "drip-seo-executor",
    version: SERVER_VERSION,
    ...standardEnvelope(),
  });
});

app.all("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.listen(config.port, config.host, () => {
  console.log(`Drip SEO MCP listening on http://${config.host}:${config.port}/mcp`);
  console.log(`Local Agent: ${config.agentBaseUrl}`);
  console.log(
    `Standard: SEO-PDP V${STARTUP_STANDARD.standard_version} ` +
      `[${STARTUP_STANDARD.standard_status}] ` +
      `sha256:${STARTUP_STANDARD.standard_hash} (${STARTUP_STANDARD.standard_file})`,
  );
});
