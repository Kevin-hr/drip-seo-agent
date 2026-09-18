import { config } from "./config.js";
import { getStandardInfo } from "./standard.js";

export class LocalAgentError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
  }
}

/**
 * Narrow HTTP client for the local DripOps bridge.
 *
 * The bridge is a thin adapter over the already-working MrShopPlus execution
 * path. It owns the immutable plan and the write guards; this client never
 * sends arbitrary SEO fields.
 */
export class LocalAgentClient {
  async post(path: string, body: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    const standard = getStandardInfo();

    try {
      const response = await fetch(`${config.agentBaseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.agentToken}`,
          "x-drip-mcp-version": "0.1.0",
          // The bridge re-verifies these and refuses to plan against a different hash.
          "x-drip-standard-version": standard.standard_version,
          "x-drip-standard-hash": standard.standard_hash,
        },
        body: JSON.stringify({
          ...(body as Record<string, unknown>),
          standard_version: standard.standard_version,
          standard_hash: standard.standard_hash,
          standard_file: standard.standard_file,
        }),
        signal: controller.signal,
      });

      const text = await response.text();
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        // preserve raw text for diagnostics
      }

      if (!response.ok) {
        throw new LocalAgentError(
          `Local agent returned HTTP ${response.status}`,
          response.status,
          parsed,
        );
      }

      return parsed;
    } catch (error) {
      if (error instanceof LocalAgentError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new LocalAgentError(`Local agent timed out after ${config.timeoutMs} ms.`);
      }
      throw new LocalAgentError(
        `Unable to reach local agent at ${config.agentBaseUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
