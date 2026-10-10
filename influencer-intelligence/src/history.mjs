export function mergeHistory(previous = {}, creators, runDate) {
  const state = structuredClone(previous);
  const snapshots = [];
  for (const creator of creators) {
    const key = `${creator.platform}:${creator.handle}`;
    const prior = state[key];
    const snapshot = {
      date: runDate,
      followers: creator.followers,
      post_count: creator.posts.length,
      total_recent_views: creator.posts.reduce((sum, post) => sum + post.views, 0),
      post_ids: creator.posts.map((post) => post.id)
    };
    const followerDelta = prior ? snapshot.followers - prior.latest.followers : 0;
    const followerGrowthRate = prior?.latest.followers > 0 ? followerDelta / prior.latest.followers : 0;
    creator.historical = {
      ...(creator.historical ?? {}),
      first_seen: prior?.first_seen ?? runDate,
      previous_followers: prior?.latest.followers ?? null,
      follower_delta: followerDelta,
      follower_growth_rate: followerGrowthRate
    };
    const previousPostIds = new Set(prior?.latest?.post_ids ?? []);
    creator.historical.new_post_ids = snapshot.post_ids.filter((id) => !previousPostIds.has(id));
    state[key] = {
      first_seen: prior?.first_seen ?? runDate,
      last_seen: runDate,
      latest: snapshot,
      snapshots: [...(prior?.snapshots ?? []), snapshot].slice(-90)
    };
    snapshots.push({
      key,
      ...snapshot,
      new_post_ids: creator.historical.new_post_ids,
      follower_delta: followerDelta,
      follower_growth_rate: followerGrowthRate
    });
  }
  return { state, snapshots };
}
