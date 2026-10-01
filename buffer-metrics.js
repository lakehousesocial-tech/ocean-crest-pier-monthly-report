#!/usr/bin/env node
/**
 * Pulls current-vs-prior-period post metrics for all connected
 * Instagram/TikTok/Facebook channels and prints clean JSON grouped by
 * channel, ready for generate_report.py's month-over-month comparison
 * slides.
 *
 * Requires Node 18+ (built-in fetch). No external dependencies.
 *
 * Env vars:
 *   BUFFER_API_KEY         (required) Buffer API access token for this client
 *   BUFFER_GRAPHQL_URL     (optional) defaults to https://api.buffer.com/graphql
 *   BUFFER_ORGANIZATION_ID (optional) only needed if the account belongs
 *                          to more than one organization -- otherwise the
 *                          account's first organization is used.
 *
 * Period design (carried over from the template's original build/diagnosis):
 *   - Current period is the calendar month that just ended (UTC midnight
 *     on the 1st to the next 1st); prior period is the calendar month
 *     before it, for every channel. Windows are anchored to month
 *     boundaries, not "now", so the time of day a run fires doesn't change
 *     the numbers. Totals are compared raw, so both periods must be
 *     comparable in width (28-31 days) -- never widen one side.
 *   Both periods are derived identically (summed from per-post `metrics`),
 *   never from `aggregatedPostMetrics` -- see the retention note below for
 *   why.
 *
 * Schema notes (verified against a real Buffer token during the template's
 * original build):
 *   - `aggregatedPostMetrics` (a channel-level KPI summary field) is capped
 *     by Buffer's Free plan to the last ~30 days -- querying further back
 *     errors with "Free-plan Insights are limited to the last 31 days of
 *     history." Since every prior-period window here starts more than 30
 *     days back, this field can never be used for the prior period, so it
 *     isn't used for the current period either (keeps both periods on one
 *     consistent code path). Re-verify this cap against the new client's
 *     actual Buffer plan -- a paid plan may not have it.
 *   - The `posts` query (per-post breakdown, each with its own `metrics`
 *     list) is NOT subject to that cap.
 *   - Metric field names are NOT uniform across platforms: Facebook reports
 *     "impressions", Instagram/TikTok report "views". Instagram posts also
 *     carry "saves"/"follows"; Facebook and TikTok posts do not.
 *   - There is no follower-count or follower-history field anywhere in this
 *     API -- a true follower count/growth series cannot be built from this
 *     data on any platform. See fetch_followers.js for that.
 */

const API_KEY = process.env.BUFFER_API_KEY;
if (!API_KEY) {
  console.error('Missing required env var: BUFFER_API_KEY');
  process.exit(1);
}

const GRAPHQL_URL = process.env.BUFFER_GRAPHQL_URL || 'https://api.buffer.com/graphql';
const TARGET_SERVICES = ['instagram', 'tiktok', 'facebook'];
const POSTS_PAGE_SIZE = 50;
const POSTS_MAX_PAGES = 20; // safety cap against a runaway pagination loop

async function graphqlRequest(query, variables) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }

  return json.data;
}

function isoDateTime(date) {
  return date.toISOString();
}

function metricsListToDict(metrics) {
  const dict = {};
  for (const m of metrics || []) dict[m.type] = m.value;
  return dict;
}

async function fetchOrganizationId() {
  if (process.env.BUFFER_ORGANIZATION_ID) return process.env.BUFFER_ORGANIZATION_ID;
  const data = await graphqlRequest('{ account { organizations { id } } }', {});
  const org = data.account.organizations[0];
  if (!org) throw new Error('Buffer account has no organizations');
  return org.id;
}

async function fetchConnectedChannels(organizationId) {
  const data = await graphqlRequest(
    `query Channels($input: ChannelsInput!) {
      channels(input: $input) { id name displayName service }
    }`,
    { input: { organizationId } }
  );
  return data.channels.filter((c) => TARGET_SERVICES.includes(c.service));
}

async function fetchPosts(organizationId, channelId, startDateTime, endDateTime) {
  const posts = [];
  let after = null;
  for (let page = 0; page < POSTS_MAX_PAGES; page++) {
    const data = await graphqlRequest(
      `query Posts($input: PostsInput!, $first: Int, $after: String) {
        posts(input: $input, first: $first, after: $after) {
          pageInfo { hasNextPage endCursor }
          edges { node { id text sentAt externalLink assets { type } metrics { type name value unit } } }
        }
      }`,
      {
        input: {
          organizationId,
          filter: {
            channelIds: [channelId],
            status: ['sent'],
            dueAt: { start: startDateTime, end: endDateTime },
          },
          sort: [{ field: 'dueAt', direction: 'desc' }],
        },
        first: POSTS_PAGE_SIZE,
        after,
      }
    );

    for (const { node } of data.posts.edges) {
      // dueAt (the schedule filter) can drift slightly from sentAt (actual
      // publish time); re-check sentAt so the window stays accurate.
      if (node.sentAt && node.sentAt >= startDateTime && node.sentAt <= endDateTime) {
        posts.push({
          postId: node.id,
          text: node.text,
          sentAt: node.sentAt,
          externalLink: node.externalLink || null,
          assetType: (node.assets && node.assets[0] && node.assets[0].type) || null,
          metrics: metricsListToDict(node.metrics),
        });
      }
    }

    if (!data.posts.pageInfo.hasNextPage) break;
    after = data.posts.pageInfo.endCursor;
  }
  return posts;
}

async function main() {
  // Exact calendar months in UTC: "current" is the month that just ended,
  // "prior" is the month before it. Boundaries are midnight UTC on the 1st,
  // so a run at any time of day on/after the 1st yields identical windows.
  const now = new Date();
  const currentEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const priorStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
  const DAY_MS = 24 * 60 * 60 * 1000;
  const currentDays = Math.round((currentEnd - currentStart) / DAY_MS);
  const priorDays = Math.round((currentStart - priorStart) / DAY_MS);
  const organizationId = await fetchOrganizationId();
  const channels = await fetchConnectedChannels(organizationId);

  const grouped = {};
  for (const service of TARGET_SERVICES) grouped[service] = [];

  await Promise.all(
    channels.map(async (channel) => {
      const entry = { channelId: channel.id, name: channel.displayName || channel.name };

      try {
        // One paginated fetch spanning both periods, then split client-side
        // -- avoids double-fetching the boundary and keeps both periods on
        // an identical code path.
        const allPosts = await fetchPosts(
          organizationId, channel.id, isoDateTime(priorStart), isoDateTime(currentEnd)
        );
        entry.current = {
          range: { startDate: isoDateTime(currentStart), endDate: isoDateTime(currentEnd), days: currentDays },
          posts: allPosts.filter(
            (p) => p.sentAt >= isoDateTime(currentStart) && p.sentAt < isoDateTime(currentEnd)
          ),
        };
        entry.prior = {
          range: { startDate: isoDateTime(priorStart), endDate: isoDateTime(currentStart), days: priorDays },
          posts: allPosts.filter(
            (p) => p.sentAt >= isoDateTime(priorStart) && p.sentAt < isoDateTime(currentStart)
          ),
        };
      } catch (err) {
        entry.error = err.message;
      }

      grouped[channel.service].push(entry);
    })
  );

  console.log(JSON.stringify({ channels: grouped }, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
