import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function collectUrls(value: unknown, out: string[], depth = 0): void {
  if (depth > 5 || out.length >= 24) return;
  if (isHttpUrl(value)) {
    if (/\.(?:jpe?g|png|webp|gif|avif)(?:\?|$)/i.test(value) || /image/i.test(value)) out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, out, depth + 1);
    return;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["images", "image_urls", "imageUrls", "main_image", "mainImage", "src", "url"]) {
      if (key in obj) collectUrls(obj[key], out, depth + 1);
    }
  }
}

export function extractProductImageUrls(payload: unknown, limit: number): string[] {
  const urls: string[] = [];
  collectUrls(payload, urls);
  return [...new Set(urls)].slice(0, limit);
}

function normalizeMime(contentType: string | null, url: string): string {
  const type = contentType?.split(";")[0]?.trim().toLowerCase();
  if (type?.startsWith("image/")) return type;
  if (/\.png(?:\?|$)/i.test(url)) return "image/png";
  if (/\.webp(?:\?|$)/i.test(url)) return "image/webp";
  if (/\.gif(?:\?|$)/i.test(url)) return "image/gif";
  if (/\.avif(?:\?|$)/i.test(url)) return "image/avif";
  return "image/jpeg";
}

function isPrivateIpv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n))) return false;
  return (
    p[0] === 10 ||
    p[0] === 127 ||
    (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) ||
    p[0] === 0
  );
}

function isPrivateIpv6(ip: string): boolean {
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80:");
}

async function assertSafeExternalUrl(raw: string): Promise<void> {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported URL protocol');
  if (url.username || url.password) throw new Error('credentials in image URL are not allowed');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) throw new Error('localhost image URL blocked');

  const literalKind = isIP(host);
  const addresses = literalKind ? [{ address: host, family: literalKind }] : await lookup(host, { all: true });
  for (const entry of addresses) {
    if ((entry.family === 4 && isPrivateIpv4(entry.address)) || (entry.family === 6 && isPrivateIpv6(entry.address))) {
      throw new Error(`private-network image target blocked: ${entry.address}`);
    }
  }
}

export async function fetchImagesForMcp(urls: string[]): Promise<{
  content: Array<{ type: "image"; data: string; mimeType: string }>;
  failures: Array<{ url: string; error: string }>;
}> {
  const content: Array<{ type: "image"; data: string; mimeType: string }> = [];
  const failures: Array<{ url: string; error: string }> = [];

  for (const url of urls) {
    try {
      await assertSafeExternalUrl(url);
      const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const mimeType = normalizeMime(response.headers.get("content-type"), url);
      if (!mimeType.startsWith("image/")) throw new Error(`unexpected content type: ${mimeType}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("image exceeds 8 MB");
      content.push({ type: "image", data: bytes.toString("base64"), mimeType });
    } catch (error) {
      failures.push({ url, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return { content, failures };
}
