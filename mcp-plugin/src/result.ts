import { standardEnvelope } from "./standard.js";

/**
 * Every tool result — success or failure — carries the identity of the standard
 * that produced it, so plan/execute/verify can be reconciled against one hash.
 */
export function success(message: string, data?: unknown) {
  return {
    content: [{ type: "text" as const, text: message }],
    structuredContent: { ok: true, message, ...standardEnvelope(), data },
  };
}

export function failure(message: string, data?: unknown) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
    structuredContent: { ok: false, message, ...standardEnvelope(), data },
  };
}
