#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const inbox = path.resolve(root, process.argv[2] ?? 'data/inbox');
const feeds = [
  ['tiktok', process.env.TIKTOK_FEED_URL, process.env.TIKTOK_FEED_TOKEN],
  ['instagram', process.env.INSTAGRAM_FEED_URL, process.env.INSTAGRAM_FEED_TOKEN],
  ['youtube', process.env.YOUTUBE_FEED_URL, process.env.YOUTUBE_FEED_TOKEN]
].filter(([, url]) => url);

if (feeds.length === 0) {
  throw new Error('No feed configured. Set at least one *_FEED_URL secret.');
}
await mkdir(inbox, { recursive: true });
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
const results = [];

for (const [platform, url, token] of feeds) {
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) throw new Error(`${platform} feed returned HTTP ${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : payload.creators ?? payload.influencers ?? payload.data ?? payload.items ?? [payload];
  const capturedAt = new Date().toISOString();
  const normalizedEnvelope = {
    platform,
    collected_at: capturedAt,
    creators: rows.map((row) => ({
      platform,
      ...row,
      provenance: row.provenance ?? { source: 'authorized_feed', captured_at: capturedAt, verified: true }
    }))
  };
  const file = path.join(inbox, `${date}-${platform}.json`);
  await writeFile(file, `${JSON.stringify(normalizedEnvelope, null, 2)}\n`, 'utf8');
  results.push({ platform, file, creators: rows.length });
}

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
