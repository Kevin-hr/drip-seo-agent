import path from 'node:path';
import { readJson, writeJson, jsonFiles } from './io.mjs';
import { normalizeInput } from './normalize.mjs';
import { mergeHistory } from './history.mjs';
import { discoverInfluencers } from './discovery.mjs';
import { evaluateInfluencers } from './evaluator.mjs';
import { recommend } from './recommend.mjs';
import { applyOutcomeFeedback, summarizeOutcomes } from './feedback.mjs';

const keyOf = (creator) => `${creator.platform}:${creator.handle}`;

export function trafficMetrics(creator, sampleSize = 10) {
  const posts = creator.posts.slice(0, sampleSize);
  const views = posts.map((post) => post.views).sort((a, b) => a - b);
  const totalViews = views.reduce((sum, value) => sum + value, 0);
  const middle = Math.floor(views.length / 2);
  const medianViews = views.length === 0 ? 0 : views.length % 2
    ? views[middle]
    : (views[middle - 1] + views[middle]) / 2;
  const visibleInteractions = posts.reduce((sum, post) => sum + post.likes + post.comments + post.shares, 0);
  return {
    sample_size: posts.length,
    total_views: totalViews,
    average_views: posts.length ? Math.round(totalViews / posts.length) : 0,
    median_views: medianViews,
    visible_engagement_rate: totalViews ? Math.round((visibleInteractions / totalViews) * 10000) / 10000 : 0
  };
}

function discoveryConfig(config) {
  const emerging = config.discovery?.emerging ?? {};
  const competitor = config.discovery?.competitor ?? {};
  return {
    competitors: config.competitors ?? [],
    emerging: {
      maxFollowers: emerging.max_followers,
      minRecentPosts: config.minimum_recent_posts,
      medianViewFollowerRatio: emerging.min_median_view_follower_ratio,
      averageViewFollowerRatio: emerging.min_average_view_follower_ratio ?? emerging.min_median_view_follower_ratio,
      viralPostViewFollowerRatio: emerging.viral_view_follower_ratio,
      minViralPosts: emerging.min_viral_posts,
      minFollowerGrowth30d: emerging.min_follower_growth_rate,
      minSignals: emerging.minimum_signals ?? 2
    },
    competitor: {
      minSignals: competitor.minimum_signals ?? competitor.minimum_signal_score ?? 2
    }
  };
}

function prepareEvaluation(creator, metrics) {
  const evidence = [...creator.evidence];
  if (metrics.sample_size > 0 && creator.posts.some((post) => post.url)) {
    evidence.push({
      id: 'recent-public-posts',
      type: 'public_metrics',
      summary: `${metrics.sample_size} recent public posts captured with source URLs`,
      url: creator.posts.find((post) => post.url)?.url ?? null,
      verified: creator.provenance?.verified === true,
      confidence: creator.provenance?.verified === true ? (metrics.sample_size >= 10 ? 0.9 : 0.7) : 0
    });
  }
  return {
    ...creator,
    evidence,
    recent_posts: creator.posts,
    metrics: { ...metrics, recent_post_count: metrics.sample_size }
  };
}

function isFresh(creator, runDate, freshnessDays) {
  const observed = new Date(creator.fetched_at);
  const run = new Date(`${runDate}T23:59:59.999Z`);
  return !Number.isNaN(observed.getTime()) && (run - observed) / 86400000 <= freshnessDays;
}

export async function loadCreatorFiles(inputPath) {
  const files = await jsonFiles(inputPath);
  const creators = [];
  const errors = [];
  const competitors = [];
  for (const file of files) {
    try {
      const payload = await readJson(file);
      if (!Array.isArray(payload) && Array.isArray(payload.competitors)) competitors.push(...payload.competitors);
      creators.push(...normalizeInput(payload));
    } catch (error) {
      errors.push({ file, error: error.message });
    }
  }
  return { files, creators: normalizeInput(creators), errors, metadata: { competitors } };
}

export async function runDaily({ inputPath, outputDir, statePath, outcomesPath, configPath, evaluationConfigPath, runDate }) {
  const config = await readJson(configPath);
  const evaluationConfig = await readJson(evaluationConfigPath);
  const loaded = await loadCreatorFiles(inputPath);
  const stale = loaded.creators.filter((creator) => !isFresh(creator, runDate, config.freshness_days));
  const creators = loaded.creators.filter((creator) => isFresh(creator, runDate, config.freshness_days));
  if (creators.length === 0) {
    throw new Error(`No fresh creator records for ${runDate}; invalid_files=${loaded.errors.length}; stale_records=${stale.length}`);
  }

  let previousState = {};
  try { previousState = await readJson(statePath); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const history = mergeHistory(previousState, creators, runDate);
  for (const creator of creators) {
    if (!creator.followerGrowth30d && creator.historical?.follower_growth_rate) {
      creator.followerGrowth30d = creator.historical.follower_growth_rate;
    }
  }
  const effectiveConfig = {
    ...config,
    competitors: [...(config.competitors ?? []), ...(loaded.metadata.competitors ?? [])]
  };
  const discovery = discoverInfluencers(creators, discoveryConfig(effectiveConfig));
  const discoveryByKey = new Map(discovery.all.map((candidate) => [candidate.creatorKey, candidate]));
  for (const snapshot of history.snapshots) {
    const currentScore = discoveryByKey.get(snapshot.key)?.score ?? null;
    const priorScore = history.state[snapshot.key]?.snapshots?.at(-2)?.discovery_score ?? null;
    snapshot.discovery_score = currentScore;
    snapshot.discovery_score_delta = currentScore != null && priorScore != null ? currentScore - priorScore : null;
    history.state[snapshot.key].latest.discovery_score = currentScore;
    history.state[snapshot.key].snapshots.at(-1).discovery_score = currentScore;
  }
  const creatorByKey = new Map(creators.map((creator) => [keyOf(creator), creator]));
  const shortlisted = discovery.all.map((candidate) => creatorByKey.get(candidate.creatorKey)).filter(Boolean);
  const productLegitimacy = config.offer_context?.product_legitimacy
    ?? ({ unverified: 'unknown', authentic: 'authentic', private_label: 'private_label' }[config.offer_context?.product_authenticity])
    ?? 'unknown';
  const evaluations = evaluateInfluencers(
    shortlisted.map((creator) => prepareEvaluation(creator, trafficMetrics(creator, config.sample_size))),
    {
      evaluationConfig,
      evaluatedAt: `${runDate}T23:59:59.000Z`,
      offerContext: {
        product_legitimacy: productLegitimacy,
        trademark_authorized: config.offer_context?.trademark_authorized ?? null,
        requires_false_authenticity_claim: false
      }
    }
  );
  const evaluationRows = evaluations.map((evaluation) => ({
    ...evaluation,
    platform: evaluation.creator.platform,
    handle: evaluation.creator.handle,
    profile_url: creatorByKey.get(`${evaluation.creator.platform}:${evaluation.creator.handle}`)?.profile_url ?? '',
    score: evaluation.scoring.total,
    evidence: evaluation.evidence
  }));
  let outcomeRows = [];
  if (outcomesPath) {
    try {
      const payload = await readJson(outcomesPath);
      outcomeRows = Array.isArray(payload) ? payload : payload.outcomes ?? [];
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const outcomeSummary = summarizeOutcomes(outcomeRows);
  const recommendations = applyOutcomeFeedback(recommend(evaluationRows, discovery.all), outcomeSummary);
  const report = {
    schema_version: '1.0.0',
    run_date: runDate,
    generated_at: new Date().toISOString(),
    status: loaded.errors.length ? 'completed_with_input_errors' : 'completed',
    source: {
      files: loaded.files,
      valid_creators: creators.length,
      stale_creators: stale.map(keyOf),
      errors: loaded.errors
    },
    discovery,
    evaluations: evaluationRows,
    recommendations,
    learning: {
      recorded_campaigns: outcomeRows.length,
      creators_with_outcomes: outcomeSummary.size,
      principle: 'Outcome history may reorder non-red candidates; it never overrides a hard veto.'
    },
    rejected: evaluationRows.filter((item) => item.decision === 'red'),
    history: history.snapshots
  };
  await Promise.all([
    writeJson(statePath, history.state),
    writeJson(path.join(outputDir, `${runDate}.json`), report),
    writeJson(path.join(outputDir, 'latest.json'), report)
  ]);
  return report;
}

export { discoveryConfig };
