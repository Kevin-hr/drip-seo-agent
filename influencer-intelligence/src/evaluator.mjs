/**
 * Evidence-first influencer evaluator.
 *
 * A verified R1-R6 hard veto always wins over traffic and the weighted score.
 * Boolean-only risk signals are intentionally routed to manual review: a red
 * decision needs an auditable evidence item, not an unsupported guess.
 */

export const DEFAULT_EVALUATION_CONFIG = Object.freeze({
  version: "1.0.0",
  evidence: {
    hard_veto_min_confidence: 0.7,
    green_min_confidence: 0.65,
  },
  thresholds: {
    green_score: 75,
    yellow_score: 50,
  },
  weights: {
    offer_relevance: 0.24,
    audience_fit: 0.2,
    content_quality: 0.16,
    engagement_authenticity: 0.16,
    brand_safety: 0.14,
    commercial_reliability: 0.1,
  },
  default_score: 50,
  hard_veto_rules: {
    R1: "Direct conflict with creator stance or product beliefs",
    R2: "Severe brand-safety risk",
    R3: "Unacceptable legal, platform, or advertising compliance risk",
    R4: "Material data-authenticity risk",
    R5: "Fundamental audience mismatch that cannot be corrected",
    R6: "Unacceptable commercial-delivery risk",
  },
  signal_rule_map: {
    core_stance_conflict: "R1",
    hate_or_harassment: "R2",
    threats_or_incitement: "R2",
    scam_or_extortion: "R2",
    hard_drug_content: "R2",
    major_brand_safety: "R2",
    illegal_claims: "R3",
    disclosure_refusal: "R3",
    ip_risk_unremediable: "R3",
    deceptive_linking: "R3",
    fabricated_metrics: "R4",
    fundamental_audience_mismatch: "R5",
    delivery_fraud: "R6",
  },
});

const SCORE_ALIASES = Object.freeze({
  relevance: "offer_relevance",
  product_fit: "offer_relevance",
  authenticity: "engagement_authenticity",
  data_authenticity: "engagement_authenticity",
  reliability: "commercial_reliability",
});

const LEVELS = Object.freeze({
  red: "NO-GO / RED",
  yellow: "CAUTION / YELLOW",
  green: "RECOMMEND / GREEN",
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function asConfidence(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, 0, 1) : fallback;
}

function asScore(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return clamp(number <= 1 ? number * 100 : number, 0, 100);
}

function mergeConfig(overrides = {}) {
  return {
    ...DEFAULT_EVALUATION_CONFIG,
    ...overrides,
    evidence: {
      ...DEFAULT_EVALUATION_CONFIG.evidence,
      ...(overrides.evidence ?? {}),
    },
    thresholds: {
      ...DEFAULT_EVALUATION_CONFIG.thresholds,
      ...(overrides.thresholds ?? {}),
    },
    weights: {
      ...DEFAULT_EVALUATION_CONFIG.weights,
      ...(overrides.weights ?? {}),
    },
    hard_veto_rules: {
      ...DEFAULT_EVALUATION_CONFIG.hard_veto_rules,
      ...(overrides.hard_veto_rules ?? {}),
    },
    signal_rule_map: {
      ...DEFAULT_EVALUATION_CONFIG.signal_rule_map,
      ...(overrides.signal_rule_map ?? {}),
    },
  };
}

function normalizeEvidence(items = []) {
  return items.map((item, index) => ({
    id: item.id ?? `evidence-${index + 1}`,
    rule_id: item.rule_id ?? item.ruleId ?? null,
    type: item.type ?? "content",
    summary: item.summary ?? item.reason ?? "No evidence summary provided",
    url: item.url ?? item.link ?? null,
    observed_at: item.observed_at ?? item.observedAt ?? null,
    verified: item.verified === true,
    confidence: asConfidence(item.confidence, item.verified === true ? 1 : 0),
    hard_veto: item.hard_veto === true,
  }));
}

function normalizeSignal(value) {
  if (value === true) {
    return { detected: true, verified: false, confidence: 0, evidence_ids: [] };
  }
  if (!value || typeof value !== "object") {
    return { detected: false, verified: false, confidence: 0, evidence_ids: [] };
  }
  return {
    detected: value.detected !== false,
    verified: value.verified === true,
    confidence: asConfidence(value.confidence, value.verified === true ? 1 : 0),
    evidence_ids: value.evidence_ids ?? value.evidenceIds ?? [],
    reason: value.reason ?? null,
  };
}

function evidenceForSignal(signal, evidence, ruleId, minConfidence) {
  const requested = new Set(signal.evidence_ids);
  return evidence.filter((item) => {
    const isLinked = requested.size > 0 ? requested.has(item.id) : item.rule_id === ruleId;
    return isLinked && item.verified && item.confidence >= minConfidence;
  });
}

function makeRule(ruleId, title, reason, evidence = [], source = "creator") {
  return {
    id: ruleId,
    title,
    reason,
    source,
    evidence,
  };
}

function inspectOfferContext(creator, offerContext, evidence, config) {
  const vetoes = [];
  const warnings = [];
  const notes = [];
  const legitimacy = offerContext.product_legitimacy ?? "unknown";
  const antiFake = normalizeSignal(
    creator.signals?.anti_fake_stance ?? creator.signals?.authentic_only_stance,
  );
  const antiFakeEvidence = evidenceForSignal(
    antiFake,
    evidence,
    "R1",
    config.evidence.hard_veto_min_confidence,
  );

  if (legitimacy === "counterfeit") {
    vetoes.push(
      makeRule(
        "R3",
        config.hard_veto_rules.R3,
        "The proposed offer is marked counterfeit; influencer marketing must not conceal or repackage the product's nature.",
        [],
        "offer_context",
      ),
    );
  } else if (legitimacy === "replica") {
    if (offerContext.trademark_authorized !== true) {
      vetoes.push(
        makeRule(
          "R3",
          config.hard_veto_rules.R3,
          "The replica offer has no verified trademark or IP authorization and creates an unacceptable compliance risk.",
          [],
          "offer_context",
        ),
      );
    }
  } else if (legitimacy === "unknown") {
    warnings.push("Product legality or authorization is unknown; do not approve a full collaboration before verification.");
  }

  if (offerContext.requires_false_authenticity_claim === true) {
    vetoes.push(
      makeRule(
        "R3",
        config.hard_veto_rules.R3,
        "The collaboration requires an unprovable or false authenticity claim.",
        [],
        "offer_context",
      ),
    );
  }

  if (antiFake.detected) {
    if (["replica", "counterfeit"].includes(legitimacy)) {
      if (antiFake.verified && antiFakeEvidence.length > 0) {
        vetoes.push(
          makeRule(
            "R1",
            config.hard_veto_rules.R1,
            "The creator's public authentic-only stance directly conflicts with the proposed offer.",
            antiFakeEvidence,
          ),
        );
      } else {
        warnings.push("An anti-counterfeit stance was detected, but evidence does not meet the hard-veto threshold; manual review is required.");
      }
    } else if (["authentic", "private_label"].includes(legitimacy)) {
      notes.push("An anti-counterfeit stance does not conflict with verified authentic goods or a lawful private label.");
    } else {
      warnings.push("An anti-counterfeit stance was detected while the product status is unknown; collaboration cannot be recommended yet.");
    }
  }

  return { vetoes, warnings, notes };
}

function inspectHardVetoes(creator, evidence, config) {
  const vetoes = [];
  const warnings = [];
  const minConfidence = config.evidence.hard_veto_min_confidence;

  for (const [signalName, ruleId] of Object.entries(config.signal_rule_map)) {
    const signal = normalizeSignal(creator.signals?.[signalName]);
    if (!signal.detected) continue;
    const linkedEvidence = evidenceForSignal(signal, evidence, ruleId, minConfidence);
    if (signal.verified && signal.confidence >= minConfidence && linkedEvidence.length > 0) {
      vetoes.push(
        makeRule(
          ruleId,
          config.hard_veto_rules[ruleId],
          signal.reason ?? `Verified risk signal: ${signalName}`,
          linkedEvidence,
        ),
      );
    } else {
      warnings.push(`Risk signal ${signalName} lacks auditable hard evidence and requires manual verification.`);
    }
  }

  // Evidence may be entered directly by a reviewer without duplicating a signal.
  for (const item of evidence) {
    if (
      item.hard_veto &&
      config.hard_veto_rules[item.rule_id] &&
      item.verified &&
      item.confidence >= minConfidence &&
      !vetoes.some((rule) => rule.id === item.rule_id && rule.evidence.some((x) => x.id === item.id))
    ) {
      vetoes.push(
        makeRule(
          item.rule_id,
          config.hard_veto_rules[item.rule_id],
          item.summary,
          [item],
        ),
      );
    }
  }

  return { vetoes, warnings };
}

function scoreCreator(creator, config) {
  const raw = creator.scores ?? {};
  const values = {};
  const missing = [];
  let weighted = 0;
  let totalWeight = 0;

  for (const [criterion, weight] of Object.entries(config.weights)) {
    const alias = Object.entries(SCORE_ALIASES).find(
      ([candidate, target]) => target === criterion && raw[candidate] !== undefined,
    )?.[0];
    const rawValue = raw[criterion] ?? (alias ? raw[alias] : undefined);
    if (rawValue === undefined || rawValue === null) missing.push(criterion);
    const value = asScore(rawValue, config.default_score);
    values[criterion] = value;
    weighted += value * weight;
    totalWeight += weight;
  }

  return {
    total: Math.round((weighted / (totalWeight || 1)) * 10) / 10,
    components: values,
    missing,
  };
}

function calculateConfidence(evidence, scoreMissing, postCount) {
  const verified = evidence.filter((item) => item.verified);
  const sampleCoverage = clamp(Number(postCount ?? 0) / 10, 0, 1);
  const evidenceConfidence = verified.length
    ? verified.reduce((sum, item) => sum + item.confidence, 0) / verified.length
    : sampleCoverage;
  const scoreCoverage = clamp(1 - scoreMissing / 6, 0, 1);
  const score = clamp(evidenceConfidence * 0.45 + sampleCoverage * 0.35 + scoreCoverage * 0.2, 0, 1);
  return {
    score: Math.round(score * 100) / 100,
    level: score >= 0.75 ? "high" : score >= 0.5 ? "medium" : "low",
    verified_evidence_count: verified.length,
    recent_post_sample_count: Number(postCount ?? 0),
  };
}

function trafficSummary(creator) {
  const posts = (creator.recent_posts ?? creator.posts ?? []).slice(0, 10);
  const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const views = posts.map((post) => number(post.views ?? post.viewCount ?? post.playCount));
  const totalViews = views.reduce((sum, item) => sum + item, 0);
  const sorted = [...views].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const medianViews = sorted.length === 0 ? 0 : sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
  const interactions = posts.reduce((sum, post) => sum
    + number(post.likes ?? post.likeCount)
    + number(post.comments ?? post.commentCount)
    + number(post.shares ?? post.shareCount), 0);
  return {
    sample_size: posts.length,
    total_views: totalViews,
    average_views: posts.length ? Math.round(totalViews / posts.length) : 0,
    median_views: medianViews,
    visible_engagement_rate: totalViews ? Math.round((interactions / totalViews) * 10000) / 10000 : 0,
  };
}

function dedupeRules(rules) {
  const byKey = new Map();
  for (const rule of rules) {
    const key = `${rule.id}:${rule.reason}`;
    if (!byKey.has(key)) byKey.set(key, rule);
  }
  return [...byKey.values()];
}

function recommendationFor(decision, triggeredRules) {
  if (decision === "red") {
    return {
      action: "reject",
      cooperation_tier: "none",
      rationale: `Hard veto ${[...new Set(triggeredRules.map((rule) => rule.id))].join(" / ")} applies; high traffic cannot offset a red decision.`,
      controls: ["Stop outreach, samples, and payments", "Retain evidence links and the review date", "Re-review only after a material change in the offer or risk facts"],
    };
  }
  if (decision === "yellow") {
    return {
      action: "manual_review_or_small_pilot",
      cooperation_tier: "limited_test",
      rationale: "No verified hard veto applies, but the data, evidence, or weighted score is insufficient for full approval.",
      controls: ["Complete missing evidence first", "Use only a low-cost, trackable, staged pilot", "Confirm disclosures, deliverables, and usage rights in writing"],
    };
  }
  return {
    action: "recommend_cooperation",
    cooperation_tier: "standard",
    rationale: "No hard veto applies, and both weighted score and evidence confidence meet the green threshold.",
    controls: ["Confirm ad disclosure in writing", "Use a trackable link or code", "Re-evaluate after the first campaign using actual conversion data"],
  };
}

/**
 * @param {object} creator normalized creator record
 * @param {object} options { offerContext, evaluationConfig, evaluatedAt }
 * @returns {object} stable evaluation result
 */
export function evaluateInfluencer(creator, options = {}) {
  if (!creator || typeof creator !== "object") {
    throw new TypeError("creator must be an object");
  }

  const config = mergeConfig(options.evaluationConfig);
  const offerContext = options.offerContext ?? creator.offer_context ?? {};
  const evidence = normalizeEvidence(creator.evidence ?? []);
  const offerInspection = inspectOfferContext(creator, offerContext, evidence, config);
  const riskInspection = inspectHardVetoes(creator, evidence, config);
  const triggeredRules = dedupeRules([...offerInspection.vetoes, ...riskInspection.vetoes]);
  const scoring = scoreCreator(creator, config);
  const postCount = creator.recent_posts?.length ?? creator.posts?.length ?? creator.metrics?.recent_post_count ?? 0;
  const confidence = calculateConfidence(evidence, scoring.missing.length, postCount);
  const traffic = trafficSummary(creator);
  const missingEvidence = [];
  if (traffic.sample_size < 10) missingEvidence.push(`Only ${traffic.sample_size}/10 recent posts were available.`);
  if (!evidence.some((item) => item.verified)) missingEvidence.push("No independently verified evidence item was supplied.");
  if (scoring.missing.length) missingEvidence.push(`Missing score inputs: ${scoring.missing.join(", ")}.`);
  const warnings = [...offerInspection.warnings, ...riskInspection.warnings];

  let decision;
  if (triggeredRules.length > 0) {
    decision = "red";
  } else if (
    scoring.total >= config.thresholds.green_score &&
    confidence.score >= config.evidence.green_min_confidence &&
    warnings.length === 0
  ) {
    decision = "green";
  } else {
    decision = "yellow";
  }

  return {
    schema_version: "1.0.0",
    platform: creator.platform ?? null,
    handle: creator.handle ?? creator.username ?? null,
    profile_url: creator.profile_url ?? null,
    score: scoring.total,
    total_score: scoring.total,
    creator: {
      platform: creator.platform ?? null,
      handle: creator.handle ?? creator.username ?? null,
    },
    evaluated_at: options.evaluatedAt ?? new Date().toISOString(),
    offer_context: {
      product_legitimacy: offerContext.product_legitimacy ?? "unknown",
      trademark_authorized: offerContext.trademark_authorized ?? null,
    },
    decision,
    decision_label_zh: LEVELS[decision],
    hard_veto: decision === "red",
    traffic_cannot_override_red: true,
    triggered_rules: triggeredRules,
    evidence,
    traffic,
    missing_evidence: missingEvidence,
    confidence,
    scoring,
    warnings,
    notes: offerInspection.notes,
    recommendation: recommendationFor(decision, triggeredRules),
  };
}

export function evaluateInfluencers(creators, options = {}) {
  if (!Array.isArray(creators)) throw new TypeError("creators must be an array");
  return creators.map((creator) => evaluateInfluencer(creator, options));
}
