const DEFAULTS = Object.freeze({
  emerging: {
    maxFollowers: 100_000,
    minRecentPosts: 3,
    medianViewFollowerRatio: 1,
    averageViewFollowerRatio: 1.5,
    viralPostViewFollowerRatio: 3,
    minViralPosts: 2,
    minFollowerGrowth30d: 0.1,
    minSignals: 2,
  },
  competitor: {
    minSignals: 2,
  },
});

const NUMBER_FIELDS = {
  followers: ["followerCount", "follower_count", "followers"],
  growth: ["followerGrowth30d", "follower_growth_30d", "growth30d"],
  views: ["viewCount", "view_count", "views", "playCount", "play_count"],
};

function finiteNumber(value) {
  const parsed = typeof value === "string" ? Number(value.replaceAll(",", "")) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstNumber(object, fields, fallback = null) {
  for (const field of fields) {
    const value = finiteNumber(object?.[field]);
    if (value !== null) return value;
  }
  return fallback;
}

function canonicalText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function canonicalHandle(value) {
  return canonicalText(value).replace(/^@/, "");
}

function canonicalTag(value) {
  return canonicalText(value).replace(/^[#@]/, "").replace(/[^\p{L}\p{N}._-]/gu, "");
}

function list(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

function creatorKey(creator) {
  const platform = canonicalText(creator.platform || creator.network || "unknown");
  const handle = canonicalHandle(creator.handle || creator.username || creator.uniqueId || creator.id);
  if (!handle) throw new TypeError("Every creator needs a handle, username, uniqueId, or id");
  return `${platform}:${handle}`;
}

function postKey(post, index) {
  return String(
    post.id || post.postId || post.videoId || post.url ||
      `${post.publishedAt || post.published_at || "undated"}:${post.caption || ""}:${firstNumber(post, NUMBER_FIELDS.views, 0)}:${index}`,
  );
}

function observationTime(record) {
  const value = Date.parse(record.observedAt || record.observed_at || record.collectedAt || record.collected_at || "");
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

/**
 * Collapse repeated observations of the same platform + handle. Scalar profile
 * values come from the newest observation; posts are unioned by stable post id.
 */
export function dedupeCreators(creators) {
  if (!Array.isArray(creators)) throw new TypeError("creators must be an array");
  const groups = new Map();

  creators.forEach((creator, inputIndex) => {
    const key = creatorKey(creator);
    const previous = groups.get(key);
    const observed = observationTime(creator);
    if (!previous) {
      groups.set(key, { records: [{ creator, inputIndex, observed }] });
    } else {
      previous.records.push({ creator, inputIndex, observed });
    }
  });

  return [...groups.entries()].map(([key, group]) => {
    const records = [...group.records].sort((a, b) =>
      a.observed === b.observed ? a.inputIndex - b.inputIndex : a.observed - b.observed,
    );
    const latest = records.at(-1).creator;
    const posts = new Map();
    records.forEach(({ creator }) => {
      list(creator.posts || creator.recentPosts || creator.recent_posts).forEach((post, index) => {
        posts.set(postKey(post, index), post);
      });
    });

    return {
      ...latest,
      platform: canonicalText(latest.platform || latest.network || "unknown"),
      handle: canonicalHandle(latest.handle || latest.username || latest.uniqueId || latest.id),
      creatorKey: key,
      posts: [...posts.values()],
      sourceObservationCount: records.length,
    };
  });
}

function latestTen(posts) {
  return [...posts]
    .sort((a, b) => {
      const aDate = Date.parse(a.publishedAt || a.published_at || "");
      const bDate = Date.parse(b.publishedAt || b.published_at || "");
      if (!Number.isFinite(aDate) || !Number.isFinite(bDate)) return 0;
      return bDate - aDate;
    })
    .slice(0, 10);
}

function round(value, places = 4) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function evidenceCompleteness(posts) {
  const missing = [];
  if (posts.length < 10) missing.push(`only ${posts.length}/10 recent posts available`);
  if (!posts.some((post) => post.url || post.videoUrl)) missing.push("source post URLs missing");
  return missing;
}

function assessEmerging(creator, options) {
  const followers = firstNumber(creator, NUMBER_FIELDS.followers, 0);
  const recentPosts = latestTen(creator.posts)
    .map((post) => ({ post, views: firstNumber(post, NUMBER_FIELDS.views) }))
    .filter(({ views }) => views !== null && views >= 0);
  const views = recentPosts.map(({ views: count }) => count);
  const usableFollowerBase = Math.max(followers, 1);
  const averageViews = views.length ? views.reduce((sum, value) => sum + value, 0) / views.length : 0;
  const medianViews = views.length ? median(views) : 0;
  const averageRatio = averageViews / usableFollowerBase;
  const medianRatio = medianViews / usableFollowerBase;
  const viralPosts = recentPosts.filter(({ views: count }) => count / usableFollowerBase >= options.viralPostViewFollowerRatio);
  const growth = firstNumber(creator, NUMBER_FIELDS.growth, 0);

  const checks = {
    median_ratio: medianRatio >= options.medianViewFollowerRatio,
    average_ratio: averageRatio >= options.averageViewFollowerRatio,
    viral_post_count: viralPosts.length >= options.minViralPosts,
    follower_growth_30d: growth >= options.minFollowerGrowth30d,
  };
  const signalCount = Object.values(checks).filter(Boolean).length;
  const qualifies = followers > 0 &&
    followers <= options.maxFollowers &&
    views.length >= options.minRecentPosts &&
    signalCount >= options.minSignals;

  if (!qualifies) return null;

  const reasons = [
    `followers ${followers} <= emerging ceiling ${options.maxFollowers}`,
    ...Object.entries(checks).filter(([, hit]) => hit).map(([name]) => `emerging signal: ${name}`),
  ];
  const score = Math.min(100, Math.round(
    20 + signalCount * 15 +
      Math.min(20, medianRatio / options.medianViewFollowerRatio * 5) +
      Math.min(15, growth / Math.max(options.minFollowerGrowth30d, 0.0001) * 5),
  ));

  return {
    creatorKey: creator.creatorKey,
    platform: creator.platform,
    handle: creator.handle,
    profile_url: creator.profile_url || creator.profileUrl || "",
    followerCount: followers,
    route: "emerging",
    score,
    observed_at: creator.fetched_at || creator.observedAt || creator.observed_at || null,
    evidence_strength: signalCount >= 3 && views.length >= 5 ? "high" : "medium",
    missing_evidence: evidenceCompleteness(recentPosts.map(({ post }) => post)),
    reasons,
    evidence: {
      sampleSize: views.length,
      recentPostIds: recentPosts.map(({ post }, index) => String(post.id || post.postId || post.videoId || `recent-${index + 1}`)),
      averageViews: round(averageViews, 2),
      medianViews: round(medianViews, 2),
      averageViewFollowerRatio: round(averageRatio),
      medianViewFollowerRatio: round(medianRatio),
      viralPostCount: viralPosts.length,
      viralPostIds: viralPosts.map(({ post }, index) => String(post.id || post.postId || post.videoId || `viral-${index + 1}`)),
      followerGrowth30d: round(growth),
      matchedSignals: Object.entries(checks).filter(([, hit]) => hit).map(([name]) => name),
    },
  };
}

function competitorCatalog(competitors) {
  return list(competitors).map((item) => {
    const source = typeof item === "string" ? { name: item } : item;
    const name = String(source.name || source.brand || source.handle || "").trim();
    const aliases = new Set([
      name,
      source.handle,
      ...list(source.aliases),
      ...list(source.hashtags),
    ].map(canonicalTag).filter(Boolean));
    if (!name || aliases.size === 0) throw new TypeError("Each competitor needs a name and at least one usable alias");
    return { name, aliases };
  });
}

function containsAlias(caption, alias) {
  if (!alias) return false;
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}_])(?:#|@)?${escaped}(?=$|[^\\p{L}\\p{N}_])`, "iu").test(caption);
}

function postCompetitorEvidence(post, catalog) {
  const caption = canonicalText(post.caption || post.description || post.text);
  const hashtags = new Set([
    ...list(post.hashtags),
    ...(caption.match(/#[\p{L}\p{N}._-]+/gu) || []),
  ].map(canonicalTag));
  const mentions = new Set([
    ...list(post.mentions),
    ...(caption.match(/@[\p{L}\p{N}._-]+/gu) || []),
  ].map(canonicalTag));
  const partners = new Set([
    ...list(post.paidPartnershipWith || post.paid_partnership_with),
    ...list(post.partner || post.partners),
    ...list(post.sponsor || post.sponsors),
    ...list(post.brand || post.brands),
  ].map(canonicalTag));
  const paidFlag = Boolean(post.paidPartnership || post.paid_partnership || post.isAd || post.is_ad);
  const adMarker = paidFlag || /(^|\s)#?(ad|advertisement|sponsored|paidpartner|paidpartnership)(?=$|\s|[.,!])/iu.test(caption);

  const matches = [];
  for (const competitor of catalog) {
    const signals = new Set();
    let matchedPartner = false;
    for (const alias of competitor.aliases) {
      if (hashtags.has(alias)) signals.add("competitor_hashtag");
      if (mentions.has(alias)) signals.add("competitor_mention");
      if (partners.has(alias)) {
        signals.add("paid_partnership_with_competitor");
        matchedPartner = true;
      }
      if (containsAlias(caption, alias)) signals.add("competitor_in_caption");
    }
    if (adMarker && signals.size > 0) signals.add("commercial_disclosure");
    if (signals.size > 0) {
      matches.push({ competitor: competitor.name, signals: [...signals], matchedPartner });
    }
  }
  return matches;
}

function assessCompetitor(creator, catalog, options) {
  if (catalog.length === 0) return null;
  const postEvidence = [];
  let strongestSignalCount = 0;
  let paidPartnershipMatched = false;

  latestTen(creator.posts).forEach((post, index) => {
    const matches = postCompetitorEvidence(post, catalog);
    matches.forEach((match) => {
      strongestSignalCount = Math.max(strongestSignalCount, match.signals.length);
      paidPartnershipMatched ||= match.matchedPartner;
      postEvidence.push({
        postId: String(post.id || post.postId || post.videoId || `recent-${index + 1}`),
        url: post.url || post.videoUrl || null,
        publishedAt: post.publishedAt || post.published_at || null,
        captionSnippet: String(post.caption || post.description || post.text || "").slice(0, 180),
        competitor: match.competitor,
        signals: match.signals,
      });
    });
  });

  const qualifies = paidPartnershipMatched || strongestSignalCount >= options.minSignals;
  if (!qualifies) return null;

  const competitors = [...new Set(postEvidence.map((item) => item.competitor))];
  const allSignals = [...new Set(postEvidence.flatMap((item) => item.signals))];
  const score = Math.min(100, 35 + strongestSignalCount * 15 + (paidPartnershipMatched ? 25 : 0));
  return {
    creatorKey: creator.creatorKey,
    platform: creator.platform,
    handle: creator.handle,
    profile_url: creator.profile_url || creator.profileUrl || "",
    followerCount: firstNumber(creator, NUMBER_FIELDS.followers, 0),
    route: "competitor",
    score,
    observed_at: creator.fetched_at || creator.observedAt || creator.observed_at || null,
    evidence_strength: paidPartnershipMatched || strongestSignalCount >= 3 ? "high" : "medium",
    missing_evidence: evidenceCompleteness(latestTen(creator.posts)),
    reasons: [
      `matched competitor(s): ${competitors.join(", ")}`,
      ...allSignals.map((signal) => `competitor signal: ${signal}`),
    ],
    evidence: {
      competitors,
      paidPartnershipMatched,
      strongestSignalCount,
      posts: postEvidence,
    },
  };
}

/**
 * Discover candidates in two independent lanes and return a deduplicated union.
 * A creator can carry both routes in `all` without losing either lane's evidence.
 */
export function discoverInfluencers(creators, config = {}) {
  const deduped = dedupeCreators(creators);
  const emergingOptions = { ...DEFAULTS.emerging, ...(config.emerging || {}) };
  const competitorOptions = { ...DEFAULTS.competitor, ...(config.competitor || {}) };
  const catalog = competitorCatalog(config.competitors || []);

  const emerging = deduped.map((creator) => assessEmerging(creator, emergingOptions)).filter(Boolean);
  const competitor = deduped.map((creator) => assessCompetitor(creator, catalog, competitorOptions)).filter(Boolean);
  const union = new Map();

  for (const candidate of [...emerging, ...competitor]) {
    const previous = union.get(candidate.creatorKey) || {
      creatorKey: candidate.creatorKey,
      platform: candidate.platform,
      handle: candidate.handle,
      profile_url: candidate.profile_url,
      followerCount: candidate.followerCount,
      routes: [],
      routeScores: {},
      observed_at: candidate.observed_at,
      evidence_strength: {},
      missing_evidence: [],
      reasons: [],
      evidence: {},
    };
    previous.routes.push(candidate.route);
    previous.routeScores[candidate.route] = candidate.score;
    previous.evidence_strength[candidate.route] = candidate.evidence_strength;
    previous.missing_evidence.push(...candidate.missing_evidence);
    previous.reasons.push(...candidate.reasons);
    previous.evidence[candidate.route] = candidate.evidence;
    union.set(candidate.creatorKey, previous);
  }

  const byScore = (a, b) => b.score - a.score || a.creatorKey.localeCompare(b.creatorKey);
  const all = [...union.values()].map((candidate) => ({
    ...candidate,
    routes: [...new Set(candidate.routes)],
    reasons: [...new Set(candidate.reasons)],
    missing_evidence: [...new Set(candidate.missing_evidence)],
    score: Math.max(...Object.values(candidate.routeScores)),
  })).sort((a, b) => b.score - a.score || a.creatorKey.localeCompare(b.creatorKey));

  return {
    generatedAt: new Date().toISOString(),
    sourceCreatorCount: creators.length,
    uniqueCreatorCount: deduped.length,
    emerging: emerging.sort(byScore),
    competitor: competitor.sort(byScore),
    all,
  };
}

export const discoveryDefaults = DEFAULTS;
