import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { normalizeInput, parseCount } from '../src/normalize.mjs';
import { mergeHistory } from '../src/history.mjs';
import { applyOutcomeFeedback, summarizeOutcomes } from '../src/feedback.mjs';
import { runDaily } from '../src/pipeline.mjs';

test('normalizer accepts platform aliases and merges duplicate creator posts', () => {
  const creators = normalizeInput([
    { platform: 'TikTok', username: '@Demo', follower_count: '12.5K', observed_at: '2026-10-10T01:00:00Z', posts: [{ id: '1', views: '20K' }] },
    { platform: 'tiktok', handle: 'demo', followerCount: 13000, observedAt: '2026-10-10T02:00:00Z', videos: [{ id: '2', playCount: 30000 }] }
  ]);
  assert.equal(parseCount('1.2M'), 1_200_000);
  assert.equal(creators.length, 1);
  assert.equal(creators[0].followers, 13000);
  assert.deepEqual(creators[0].posts.map((post) => post.id).sort(), ['1', '2']);
});

test('history exposes new posts and day-over-day growth', () => {
  const first = [{ platform: 'tiktok', handle: 'demo', followers: 1000, posts: [{ id: 'a', views: 100 }] }];
  const dayOne = mergeHistory({}, first, '2026-10-09');
  const second = [{ platform: 'tiktok', handle: 'demo', followers: 1100, posts: [{ id: 'b', views: 200 }, { id: 'a', views: 100 }] }];
  const dayTwo = mergeHistory(dayOne.state, second, '2026-10-10');
  assert.equal(dayTwo.snapshots[0].follower_delta, 100);
  assert.equal(dayTwo.snapshots[0].follower_growth_rate, 0.1);
  assert.deepEqual(dayTwo.snapshots[0].new_post_ids, ['b']);
});

test('campaign outcomes reorder only eligible recommendations', () => {
  const outcomes = summarizeOutcomes([
    { platform: 'tiktok', handle: 'proven', spend: 100, revenue: 400, orders: 9, clicks: 100 }
  ]);
  const ranked = applyOutcomeFeedback([
    { platform: 'tiktok', handle: 'new', priority_score: 80 },
    { platform: 'tiktok', handle: 'proven', priority_score: 75 }
  ], outcomes);
  assert.equal(ranked[0].handle, 'proven');
  assert.equal(ranked[0].prior_performance.roas, 4);
});

test('daily pipeline discovers both routes, hard-rejects evidence, and writes reports', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'influencer-intelligence-'));
  const input = path.join(temp, 'input.json');
  const config = path.join(temp, 'config.json');
  const evaluation = path.join(temp, 'evaluation.json');
  const output = path.join(temp, 'output');
  const state = path.join(temp, 'state.json');
  const outcomes = path.join(temp, 'outcomes.json');
  const posts = (prefix, caption = 'daily fit') => [9000, 8000, 7000].map((views, index) => ({
    id: `${prefix}-${index}`,
    url: `https://example.com/${prefix}/${index}`,
    published_at: `2026-10-${10 - index}T01:00:00Z`,
    caption,
    views,
    likes: 500,
    comments: 20,
    shares: 10
  }));
  await writeFile(input, JSON.stringify({ creators: [
    { platform: 'tiktok', handle: 'rising', followers: 2000, fetched_at: '2026-10-10T08:00:00Z', followerGrowth30d: 0.2, posts: posts('rising') },
    {
      platform: 'instagram', handle: 'unsafe_partner', followers: 5000, fetched_at: '2026-10-10T08:00:00Z',
      posts: posts('unsafe', 'Paid partnership with @rival #rival #ad'),
      signals: { major_brand_safety: { detected: true, verified: true, confidence: 0.95, evidence_ids: ['risk-1'] } },
      evidence: [{ id: 'risk-1', rule_id: 'R2', summary: 'Repeated verified brand-safety violation', url: 'https://example.com/evidence', verified: true, confidence: 0.95, hard_veto: true }]
    }
  ] }), 'utf8');
  await writeFile(config, JSON.stringify({
    freshness_days: 7, minimum_recent_posts: 3, sample_size: 10,
    competitors: ['rival'], offer_context: { product_authenticity: 'unverified' },
    discovery: {
      emerging: { max_followers: 10000, min_median_view_follower_ratio: 1, min_average_view_follower_ratio: 1, viral_view_follower_ratio: 2, min_viral_posts: 2, min_follower_growth_rate: 0.1, minimum_signals: 2 },
      competitor: { minimum_signals: 2 }
    }
  }), 'utf8');
  await writeFile(evaluation, JSON.stringify({}), 'utf8');
  await writeFile(outcomes, JSON.stringify({ outcomes: [] }), 'utf8');

  const report = await runDaily({ inputPath: input, outputDir: output, statePath: state, outcomesPath: outcomes, configPath: config, evaluationConfigPath: evaluation, runDate: '2026-10-10' });
  assert.equal(report.discovery.emerging.some((item) => item.handle === 'rising'), true);
  assert.equal(report.discovery.competitor.some((item) => item.handle === 'unsafe_partner'), true);
  assert.equal(report.rejected.some((item) => item.handle === 'unsafe_partner'), true);
  assert.equal(report.recommendations.some((item) => item.handle === 'rising'), true);
  assert.equal(JSON.parse(await readFile(path.join(output, 'latest.json'), 'utf8')).run_date, '2026-10-10');
});

test('daily pipeline fails loudly when every record is stale', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'influencer-stale-'));
  const input = path.join(temp, 'input.json');
  const config = path.join(temp, 'config.json');
  const evaluation = path.join(temp, 'evaluation.json');
  await writeFile(input, JSON.stringify([{ platform: 'youtube', handle: 'stale', followers: 100, fetched_at: '2026-01-01T00:00:00Z', posts: [] }]), 'utf8');
  await writeFile(config, JSON.stringify({ freshness_days: 3, discovery: {}, competitors: [] }), 'utf8');
  await writeFile(evaluation, '{}', 'utf8');
  await assert.rejects(runDaily({
    inputPath: input, outputDir: path.join(temp, 'out'), statePath: path.join(temp, 'state.json'), outcomesPath: path.join(temp, 'missing.json'),
    configPath: config, evaluationConfigPath: evaluation, runDate: '2026-10-10'
  }), /No fresh creator records/);
});
