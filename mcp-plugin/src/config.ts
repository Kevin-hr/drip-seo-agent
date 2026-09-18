import "dotenv/config";

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  port: Number(env("PORT", "8000")),
  host: env("HOST", "127.0.0.1"),
  agentBaseUrl: env("LOCAL_AGENT_BASE_URL", "http://127.0.0.1:8787").replace(/\/$/, ""),
  agentToken: env("LOCAL_AGENT_TOKEN"),
  timeoutMs: Number(env("LOCAL_AGENT_TIMEOUT_MS", "120000")),
  paths: {
    productSearch: env("AGENT_PRODUCT_SEARCH_PATH", "/api/chatgpt-mcp/products/search"),
    productRead: env("AGENT_PRODUCT_READ_PATH", "/api/chatgpt-mcp/products/read"),
    productPrepare: env("AGENT_PRODUCT_PREPARE_PATH", "/api/chatgpt-mcp/products/prepare-v44"),
    productExecute: env("AGENT_PRODUCT_EXECUTE_PATH", "/api/chatgpt-mcp/products/execute-v44"),
    productVerify: env("AGENT_PRODUCT_VERIFY_PATH", "/api/chatgpt-mcp/products/verify-v44"),
    categorySearch: env("AGENT_CATEGORY_SEARCH_PATH", "/api/chatgpt-mcp/categories/search"),
    categoryRead: env("AGENT_CATEGORY_READ_PATH", "/api/chatgpt-mcp/categories/read"),
    categoryPrepare: env("AGENT_CATEGORY_PREPARE_PATH", "/api/chatgpt-mcp/categories/prepare-seo"),
    categoryExecute: env("AGENT_CATEGORY_EXECUTE_PATH", "/api/chatgpt-mcp/categories/execute-seo"),
    categoryVerify: env("AGENT_CATEGORY_VERIFY_PATH", "/api/chatgpt-mcp/categories/verify-seo"),
    runStatus: env("AGENT_RUN_STATUS_PATH", "/api/chatgpt-mcp/runs/status"),
  },
};
