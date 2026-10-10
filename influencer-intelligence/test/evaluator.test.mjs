import assert from "node:assert/strict";
import test from "node:test";

import { evaluateInfluencer, evaluateInfluencers } from "../src/evaluator.mjs";

const excellentScores = {
  offer_relevance: 96,
  audience_fit: 91,
  content_quality: 90,
  engagement_authenticity: 94,
  brand_safety: 92,
  commercial_reliability: 88,
};

function tenPosts() {
  return Array.from({ length: 10 }, (_, index) => ({ id: `post-${index + 1}` }));
}

test("verified hard veto remains red even when traffic and weighted score are exceptional", () => {
  const result = evaluateInfluencer(
    {
      platform: "tiktok",
      handle: "viral-but-unsafe",
      metrics: { followers: 2_000_000, average_views: 5_000_000, engagement_rate: 0.22 },
      recent_posts: tenPosts(),
      scores: excellentScores,
      signals: {
        hate_or_harassment: {
          detected: true,
          verified: true,
          confidence: 0.98,
          evidence_ids: ["e1"],
        },
      },
      evidence: [
        {
          id: "e1",
          rule_id: "R2",
          verified: true,
          confidence: 0.98,
          summary: "Repeated verified hate speech in recent public content",
          url: "https://example.test/video/1",
        },
      ],
    },
    {
      offerContext: { product_legitimacy: "authentic", trademark_authorized: true },
      evaluatedAt: "2026-10-10T00:00:00.000Z",
    },
  );

  assert.equal(result.decision, "red");
  assert.equal(result.hard_veto, true);
  assert.equal(result.scoring.total > 90, true);
  assert.equal(result.traffic_cannot_override_red, true);
  assert.equal(result.recommendation.action, "reject");
  assert.deepEqual(result.triggered_rules.map((rule) => rule.id), ["R2"]);
});

test("anti-fake stance is compatible with verified authentic goods", () => {
  const result = evaluateInfluencer(
    {
      platform: "tiktok",
      handle: "authentic-only",
      recent_posts: tenPosts(),
      scores: excellentScores,
      signals: {
        anti_fake_stance: {
          detected: true,
          verified: true,
          confidence: 0.96,
          evidence_ids: ["stance-1"],
        },
      },
      evidence: [
        {
          id: "stance-1",
          rule_id: "R1",
          verified: true,
          confidence: 0.96,
          summary: "Creator repeatedly endorses authentic-only purchasing",
        },
      ],
    },
    { offerContext: { product_legitimacy: "authentic", trademark_authorized: true } },
  );

  assert.equal(result.decision, "green");
  assert.equal(result.triggered_rules.length, 0);
  assert.match(result.notes.join(" "), /does not conflict/);
});

test("anti-fake stance conflicts with replica offers and unlicensed replica is also a compliance veto", () => {
  const result = evaluateInfluencer(
    {
      platform: "tiktok",
      handle: "authentic-only",
      recent_posts: tenPosts(),
      scores: excellentScores,
      signals: {
        anti_fake_stance: {
          detected: true,
          verified: true,
          confidence: 0.96,
          evidence_ids: ["stance-1"],
        },
      },
      evidence: [
        {
          id: "stance-1",
          rule_id: "R1",
          verified: true,
          confidence: 0.96,
          summary: "Creator repeatedly rejects replicas",
        },
      ],
    },
    { offerContext: { product_legitimacy: "replica", trademark_authorized: false } },
  );

  assert.equal(result.decision, "red");
  assert.deepEqual(new Set(result.triggered_rules.map((rule) => rule.id)), new Set(["R1", "R3"]));
});

test("counterfeit offer is rejected without relying on creator traffic or behavior", () => {
  const result = evaluateInfluencer(
    {
      platform: "youtube",
      handle: "clean-creator",
      recent_posts: tenPosts(),
      scores: excellentScores,
    },
    { offerContext: { product_legitimacy: "counterfeit" } },
  );

  assert.equal(result.decision, "red");
  assert.equal(result.triggered_rules[0].id, "R3");
  assert.equal(result.triggered_rules[0].source, "offer_context");
});

test("unsupported boolean risk signal yields yellow manual review, not an evidence-free red", () => {
  const result = evaluateInfluencer(
    {
      platform: "instagram",
      handle: "needs-proof",
      recent_posts: tenPosts(),
      scores: excellentScores,
      signals: { fabricated_metrics: true },
    },
    { offerContext: { product_legitimacy: "private_label" } },
  );

  assert.equal(result.decision, "yellow");
  assert.equal(result.hard_veto, false);
  assert.match(result.warnings.join(" "), /manual verification/);
  assert.equal(result.recommendation.cooperation_tier, "limited_test");
});

test("missing product context and sparse samples remain yellow", () => {
  const result = evaluateInfluencer({
    platform: "tiktok",
    handle: "sparse",
    recent_posts: [{ id: "one" }],
    scores: excellentScores,
  });

  assert.equal(result.decision, "yellow");
  assert.equal(result.confidence.level, "low");
  assert.match(result.warnings.join(" "), /Product legality/);
});

test("batch API preserves order and returns a decision for every creator", () => {
  const results = evaluateInfluencers(
    [
      { platform: "tiktok", handle: "one", recent_posts: tenPosts(), scores: excellentScores },
      { platform: "youtube", handle: "two", recent_posts: tenPosts(), scores: excellentScores },
    ],
    { offerContext: { product_legitimacy: "private_label" } },
  );

  assert.deepEqual(results.map((item) => item.creator.handle), ["one", "two"]);
  assert.deepEqual(results.map((item) => item.handle), ["one", "two"]);
  assert.deepEqual(results.map((item) => item.decision), ["green", "green"]);
});

test("accepts normalized posts and exposes recommendation-compatible top-level aliases", () => {
  const result = evaluateInfluencer(
    {
      platform: "tiktok",
      handle: "normalized",
      profile_url: "https://example.test/@normalized",
      posts: tenPosts(),
      scores: excellentScores,
    },
    { offerContext: { product_legitimacy: "private_label" } },
  );

  assert.equal(result.decision, "green");
  assert.equal(result.platform, "tiktok");
  assert.equal(result.handle, "normalized");
  assert.equal(result.profile_url, "https://example.test/@normalized");
  assert.equal(result.score, result.scoring.total);
});
