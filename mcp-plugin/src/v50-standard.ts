/**
 * V5.0 PREVIEW ONLY. Does NOT replace the production V4.4 standard loader.
 * Use this in gated migration checks and separate tests; never bypass the
 * plan/snapshot hash, identity or write guards in the V4.4 production bridge.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const V50_STANDARD_FILE = 'Drip_Sneakers_SEO-PDP_V5.0_STANDARD_FINAL.md';
export const V50_STANDARD_SHA256 = '72263e2cefb63e50de74be1bc0e40aa6a3ed06a3e7b55bc72eb9f4b662d6a172';
export const V50_STANDARD_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'rules', V50_STANDARD_FILE);

export type V50StandardInfo = {
  standard_version: '5.0';
  standard_status: 'FINAL';
  standard_file: string;
  standard_hash: string;
  execution_mode: 'preview_read_only';
};

export function loadV50PreviewStandard(): V50StandardInfo {
  const bytes = fs.readFileSync(V50_STANDARD_PATH);
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (hash !== V50_STANDARD_SHA256) throw new Error(`V5.0 standard SHA mismatch (${hash}); refusing to proceed`);
  const markdown = bytes.toString('utf8');
  if (!/^\*\*版本：\*\*\s*5\.0\s*$/m.test(markdown)) throw new Error('V5.0 document does not declare version 5.0');
  if (!/V4\.6.*完整兼容|V4\.6.*兼容/i.test(markdown)) throw new Error('V4.6 compatibility declaration absent');
  if (!markdown.includes('# 附录 A｜SEO-PDP V4.6 完整规范原文')) throw new Error('V4.6 full-text appendix absent');
  return {
    standard_version: '5.0', standard_status: 'FINAL',
    standard_file: V50_STANDARD_FILE, standard_hash: hash,
    execution_mode: 'preview_read_only',
  };
}
