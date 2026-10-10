const number = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '').trim().replaceAll(',', '');
  const match = raw.match(/^(-?\d+(?:\.\d+)?)\s*([KMB])?$/i);
  if (!match) return 0;
  const multipliers = { K: 1e3, M: 1e6, B: 1e9 };
  return Math.max(0, Math.round(Number(match[1]) * (multipliers[match[2]?.toUpperCase()] ?? 1)));
};

const list = (value) => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value == null || value === '') return [];
  return String(value).split(/[\s,]+/).filter(Boolean);
};

const cleanHandle = (value) => String(value ?? '').trim().replace(/^@/, '').toLowerCase();
const iso = (value, fallback = new Date().toISOString()) => {
  if (value == null || value === '') return fallback;
  const date = /^\d{10}$/.test(String(value)) ? new Date(Number(value) * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

function normalizePost(post, creator, index) {
  const stats = post.stats ?? post.statistics ?? {};
  const id = String(post.id ?? post.video_id ?? post.shortcode ?? `${creator.handle}-${index}`);
  const caption = String(post.caption ?? post.desc ?? post.description ?? post.title ?? '');
  const extractedHashtags = [...caption.matchAll(/#([\p{L}\p{N}_.-]+)/gu)].map((m) => m[1]);
  const extractedMentions = [...caption.matchAll(/@([\p{L}\p{N}_.-]+)/gu)].map((m) => m[1]);
  return {
    id,
    url: String(post.url ?? post.videoUrl ?? post.webVideoUrl ?? ''),
    published_at: iso(post.published_at ?? post.createTime ?? post.timestamp ?? post.publishedAt),
    caption,
    hashtags: [...new Set([...list(post.hashtags), ...extractedHashtags].map(cleanHandle))],
    mentions: [...new Set([...list(post.mentions), ...extractedMentions].map(cleanHandle))],
    views: number(post.views ?? post.viewCount ?? post.playCount ?? stats.playCount ?? stats.viewCount),
    likes: number(post.likes ?? post.diggCount ?? stats.diggCount ?? stats.likeCount),
    comments: number(post.comments ?? post.commentCount ?? stats.commentCount),
    shares: number(post.shares ?? post.shareCount ?? stats.shareCount),
    paid_partnership: Boolean(post.paid_partnership ?? post.isPaidPartnership ?? post.sponsored),
    paid_partnership_with: list(post.paid_partnership_with ?? post.paidPartnershipWith),
    partners: list(post.partners ?? post.partner ?? post.sponsors ?? post.sponsor),
    brands: list(post.brands ?? post.brand),
    risk_signals: list(post.risk_signals ?? post.riskFlags)
  };
}

export function normalizeCreator(raw, platformHint = '') {
  const author = raw.author ?? raw.creator ?? raw.channel ?? {};
  const handle = cleanHandle(raw.handle ?? raw.username ?? raw.uniqueId ?? raw.influencerHandle ?? raw.nickname ?? author.uniqueId ?? author.handle ?? author.username);
  const platform = String(raw.platform ?? platformHint ?? 'tiktok').toLowerCase();
  if (!handle) throw new Error('Creator is missing a handle');
  const postsRaw = raw.posts ?? raw.videos ?? raw.items ?? (raw.videoUrl || raw.id ? [raw] : []);
  const creator = {
    platform,
    handle,
    display_name: String(raw.display_name ?? raw.influencerName ?? raw.nickname ?? author.nickname ?? author.name ?? handle),
    profile_url: String(raw.profile_url ?? raw.profileUrl ?? author.profileUrl ?? (platform === 'tiktok' ? `https://www.tiktok.com/@${handle}` : '')),
    followers: number(raw.followers ?? raw.followerCount ?? raw.follower_count ?? raw.authorStats?.followerCount ?? author.followers),
    total_likes: number(raw.total_likes ?? raw.heartCount ?? raw.authorStats?.heartCount),
    fetched_at: iso(raw.fetched_at ?? raw.observedAt ?? raw.observed_at ?? raw.collectedAt ?? raw.collected_at ?? raw.col_date),
    source_queries: list(raw.source_queries ?? raw.sources ?? raw.tag),
    audience: raw.audience ?? {},
    historical: raw.historical ?? {},
    risk_signals: list(raw.risk_signals ?? raw.riskFlags),
    business: raw.business ?? {},
    provenance: raw.provenance ?? {},
    signals: raw.signals ?? {},
    evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
    scores: raw.scores ?? {},
    offer_context: raw.offer_context ?? {},
    followerGrowth30d: number(raw.followerGrowth30d ?? raw.follower_growth_30d ?? raw.growth30d) / 100,
    posts: []
  };
  const growthRaw = raw.followerGrowth30d ?? raw.follower_growth_30d ?? raw.growth30d;
  if (growthRaw !== undefined) {
    const parsedGrowth = Number(growthRaw);
    creator.followerGrowth30d = Number.isFinite(parsedGrowth)
      ? (Math.abs(parsedGrowth) > 1 ? parsedGrowth / 100 : parsedGrowth)
      : 0;
  }
  creator.posts = postsRaw.map((post, index) => normalizePost(post, creator, index));
  creator.posts.sort((a, b) => b.published_at.localeCompare(a.published_at));
  return creator;
}

export function normalizeInput(payload, platformHint = '') {
  const rows = Array.isArray(payload) ? payload : payload.creators ?? payload.influencers ?? payload.data ?? payload.items ?? [payload];
  const envelope = Array.isArray(payload) ? {} : payload;
  const grouped = new Map();
  for (const raw of rows) {
    const enriched = { ...raw };
    if (!enriched.platform && envelope.platform) enriched.platform = envelope.platform;
    if (!(enriched.fetched_at ?? enriched.observedAt ?? enriched.observed_at ?? enriched.collectedAt ?? enriched.collected_at ?? enriched.col_date)) {
      enriched.fetched_at = envelope.collectedAt ?? envelope.collected_at ?? envelope.fetched_at;
    }
    if (!(enriched.source_queries ?? enriched.sources ?? enriched.tag) && (envelope.hashtag ?? envelope.source_query)) {
      enriched.source_queries = [envelope.hashtag ?? envelope.source_query];
    }
    const creator = normalizeCreator(enriched, platformHint);
    const key = `${creator.platform}:${creator.handle}`;
    if (!grouped.has(key)) {
      grouped.set(key, creator);
      continue;
    }
    const existing = grouped.get(key);
    existing.followers = Math.max(existing.followers, creator.followers);
    existing.fetched_at = existing.fetched_at > creator.fetched_at ? existing.fetched_at : creator.fetched_at;
    existing.source_queries = [...new Set([...existing.source_queries, ...creator.source_queries])];
    existing.risk_signals = [...new Set([...existing.risk_signals, ...creator.risk_signals])];
    const posts = new Map(existing.posts.map((post) => [post.id, post]));
    for (const post of creator.posts) posts.set(post.id, { ...posts.get(post.id), ...post });
    existing.posts = [...posts.values()].sort((a, b) => b.published_at.localeCompare(a.published_at));
  }
  return [...grouped.values()];
}

export { number as parseCount };
