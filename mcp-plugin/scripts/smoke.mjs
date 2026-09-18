const base = process.env.MCP_HEALTH_URL ?? "http://127.0.0.1:8000/health";
const r = await fetch(base);
if (!r.ok) throw new Error(`Health check failed: ${r.status}`);
console.log(await r.json());
