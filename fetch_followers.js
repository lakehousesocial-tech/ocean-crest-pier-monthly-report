#!/usr/bin/env node
/**
 * Pulls current Facebook Page and Instagram Business Account follower
 * counts from the Meta Graph API and appends today's snapshot to a local
 * JSON log (follower-history.json), so generate_report.py can show real
 * month-over-month follower growth once two or more snapshots exist.
 *
 * Requires Node 18+ (built-in fetch). No external dependencies.
 *
 * Env vars (all required):
 *   META_ACCESS_TOKEN  A LONG-LIVED Page Access Token (pages_read_engagement /
 *                       instagram_basic permission) for THIS client's Page --
 *                       NOT a token copied straight from the Graph API
 *                       Explorer, which expires in ~1 hour and will break
 *                       this script well before its next monthly run. See
 *                       docs/meta-long-lived-token.md for how to generate
 *                       one that doesn't expire.
 *   FB_PAGE_ID          The Facebook Page ID that owns the connected
 *                       Instagram Business Account.
 *   IG_BUSINESS_ID      The Instagram Business Account ID -- not queried
 *                       directly (follower count is fetched via the Page's
 *                       instagram_business_account edge, per Meta's
 *                       documented field expansion), but used here to
 *                       sanity-check that the returned IG account actually
 *                       matches the one you expect, in case the Page's
 *                       linked IG account ever changes.
 *
 * Optional:
 *   GRAPH_API_VERSION  Defaults to v21.0
 *   FOLLOWER_LOG_PATH  Defaults to follower-history.json next to this script
 *
 * This script is intentionally separate from buffer-metrics.js: it talks to
 * a different API (Meta Graph API, not Buffer) for a different purpose
 * (account-level follower counts, which Buffer's API does not expose at
 * all -- see generate_report.py's docstring).
 *
 * Onboarding a new client: confirm the first real run's output looks sane
 * (plausible follower counts, no silent nulls) before relying on the logged
 * snapshot for goal generation.
 */

const path = require('path');
const fs = require('fs');

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const IG_BUSINESS_ID = process.env.IG_BUSINESS_ID;

for (const [name, value] of Object.entries({
  META_ACCESS_TOKEN: ACCESS_TOKEN,
  FB_PAGE_ID: FB_PAGE_ID,
  IG_BUSINESS_ID: IG_BUSINESS_ID,
})) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v21.0';
const LOG_PATH = process.env.FOLLOWER_LOG_PATH || path.join(__dirname, 'follower-history.json');

async function fetchFollowerCounts() {
  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${FB_PAGE_ID}`);
  url.searchParams.set('fields', 'followers_count,instagram_business_account{followers_count}');
  url.searchParams.set('access_token', ACCESS_TOKEN);

  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok || json.error) {
    const message = json.error ? json.error.message : `${res.status} ${res.statusText}`;
    throw new Error(`Graph API request failed: ${message}`);
  }

  if (json.instagram_business_account && json.instagram_business_account.id !== IG_BUSINESS_ID) {
    console.error(
      `Warning: Page's linked Instagram account (${json.instagram_business_account.id}) ` +
      `does not match IG_BUSINESS_ID (${IG_BUSINESS_ID}). Using the Page's actual linked account.`
    );
  }

  return {
    facebookFollowers: json.followers_count ?? null,
    instagramFollowers: json.instagram_business_account
      ? json.instagram_business_account.followers_count ?? null
      : null,
  };
}

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
  } catch (err) {
    throw new Error(`Could not parse existing log at ${LOG_PATH}: ${err.message}`);
  }
}

function upsertSnapshot(log, snapshot) {
  const idx = log.findIndex((entry) => entry.date === snapshot.date);
  if (idx >= 0) {
    log[idx] = snapshot; // re-running today overwrites today's entry, not a duplicate
  } else {
    log.push(snapshot);
  }
  log.sort((a, b) => a.date.localeCompare(b.date));
  return log;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { facebookFollowers, instagramFollowers } = await fetchFollowerCounts();

  const snapshot = { date: today, facebookFollowers, instagramFollowers };

  const log = upsertSnapshot(loadLog(), snapshot);
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2) + '\n');

  console.log(JSON.stringify({ snapshot, logPath: LOG_PATH, totalSnapshots: log.length }, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
