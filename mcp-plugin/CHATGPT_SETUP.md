# ChatGPT connection setup

## Target topology

```text
ChatGPT
  ↓ remote MCP connection
Secure MCP Tunnel / stable HTTPS MCP host
  ↓
Drip SEO MCP :8000/mcp
  ↓ private localhost/LAN
Existing local Agent :8787
  ↓
Existing MrShopPlus API workflow
```

Do **not** expose the existing local Agent or MrShopPlus credentials directly to ChatGPT. Only the narrow MCP server should be connected.

## Private development / workspace deployment

1. Start the existing local Agent.
2. In this project: `npm install`, copy `.env.example` to `.env`, then set the local Agent URL/token/route mapping.
3. Run `npm start` and verify `/health`.
4. Test `http://127.0.0.1:8000/mcp` with MCP Inspector first.
5. Because ChatGPT does not connect directly to localhost, expose the MCP endpoint through OpenAI Secure MCP Tunnel for private development, or deploy it to a controlled HTTPS host.
6. In an eligible ChatGPT workspace, enable Developer Mode and create a custom MCP app using the remote `/mcp` endpoint; scan the tool list before publishing/using it.
7. Verify that write tools are classified as write/modify actions and that the workspace approval/confirmation behavior is acceptable.

## Current ChatGPT plan boundary (2026-09-18)

OpenAI currently documents **full custom MCP, including write/modify**, for ChatGPT Business and Enterprise/Edu. Pro can build Apps SDK apps but its custom MCP developer-mode connection is limited to read/fetch; full MCP is not currently available there. Private full-write custom MCP is therefore not a Plus/Pro personal-account deployment path today.

The code is still the correct target architecture: it can be tested locally now, connected to an eligible workspace, or prepared for a reviewed/public ChatGPT app/plugin submission with a stable remote HTTPS MCP server and the required authentication/privacy materials.

## Tool scan expected

The app should expose exactly these business tools:

```text
search_products
get_product_context
get_product_images
prepare_product_v44
execute_product_v44
verify_product_v44
search_categories
get_category_context
prepare_category_seo
execute_category_seo
verify_category_seo
get_run_status
```

No generic browser-click, arbitrary HTTP passthrough, raw `saveModify`, or delete tool should be visible to ChatGPT.
