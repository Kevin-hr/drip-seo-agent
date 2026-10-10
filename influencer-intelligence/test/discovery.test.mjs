import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { dedupeCreators, discoverInfluencers } from "../src/discovery.mjs";

const fixtureUrl = new URL("../fixtures/creators.json", import.meta.url);

async function fixture() {
  return JSON.parse(await readFile(fixtureUrl, "utf8"));
}

test("dedupeCreators merges observations by platform + canonical handle", async () => {
  const { creators } = await fixture();
  const deduped = dedupeCreators(creators);
  assert.equal(deduped.length, 4);
  const fresh = deduped.find((creator) => creator.creatorKey === "tiktok:freshfinds");
  assert.equal(fresh.followerCount, 22000);
  assert.equal(fresh.sourceObservationCount, 2);
  assert.deepEqual(new Set(fresh.posts.map((post) => post.id)), new Set(["ff-1", "ff-2", "ff-3", "ff-4", "ff-5"]));
});

test("emerging route requires low followers and multiple recent breakout signals", async () => {
  const { creators, competitors } = await fixture();
  const result = discoverInfluencers(creators, { competitors });
  const candidate = result.emerging.find(({ creatorKey }) => creatorKey === "tiktok:freshfinds");

  assert.ok(candidate);
  assert.equal(candidate.route, "emerging");
  assert.equal(candidate.evidence.sampleSize, 5);
  assert.ok(candidate.evidence.medianViewFollowerRatio > 1);
  assert.ok(candidate.evidence.viralPostCount >= 2);
  assert.ok(candidate.evidence.matchedSignals.includes("follower_growth_30d"));
  assert.ok(candidate.reasons.every((reason) => typeof reason === "string" && reason.length > 0));
});

test("competitor route records commercial disclosure and matched brand evidence", async () => {
  const { creators, competitors } = await fixture();
  const result = discoverInfluencers(creators, { competitors });
  const candidate = result.competitor.find(({ creatorKey }) => creatorKey === "instagram:collabcloset");

  assert.ok(candidate);
  assert.equal(candidate.evidence.paidPartnershipMatched, true);
  assert.deepEqual(candidate.evidence.competitors, ["RivalKicks"]);
  assert.ok(candidate.evidence.posts[0].signals.includes("paid_partnership_with_competitor"));
  assert.ok(candidate.evidence.posts[0].signals.includes("commercial_disclosure"));
});

test("a lone editorial competitor mention is insufficient collaboration evidence", async () => {
  const { creators, competitors } = await fixture();
  const result = discoverInfluencers(creators, { competitors });
  assert.equal(result.competitor.some(({ creatorKey }) => creatorKey === "youtube:sneakerobserver"), false);
});

test("union keeps one creator while retaining both route decisions and evidence", async () => {
  const { creators, competitors } = await fixture();
  const result = discoverInfluencers(creators, { competitors });
  const candidate = result.all.find(({ creatorKey }) => creatorKey === "tiktok:bothlanes");

  assert.ok(candidate);
  assert.deepEqual(new Set(candidate.routes), new Set(["emerging", "competitor"]));
  assert.ok(candidate.evidence.emerging);
  assert.ok(candidate.evidence.competitor);
  assert.equal(result.sourceCreatorCount, 5);
  assert.equal(result.uniqueCreatorCount, 4);
});

test("thresholds are configurable and malformed creator input fails loudly", async () => {
  const { creators, competitors } = await fixture();
  const strict = discoverInfluencers(creators, {
    competitors,
    emerging: { maxFollowers: 5000 },
  });
  assert.equal(strict.emerging.length, 0);
  assert.throws(() => discoverInfluencers([{ platform: "tiktok", posts: [] }]), /needs a handle/);
});
