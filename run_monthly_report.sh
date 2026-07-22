#!/usr/bin/env bash
# Monthly client report pipeline -- run by a scheduled cloud Routine (see the
# Routine's own prompt, ROUTINE_PROMPT.md in this repo, for what happens with
# this script's output). Designed to run unattended: every failure path logs
# to run-log.txt and commits/pushes it so it's visible in the repo, then
# exits nonzero so the caller knows not to upload.
#
# Requires these environment variables (configured in the Routine's
# Environment secrets, not in this script or the repo):
#   BUFFER_API_KEY
#   META_ACCESS_TOKEN
#   FB_PAGE_ID
#   CLIENT_NAME       -- display name shown on the cover slide and used in
#                        the output filename, e.g. "Acme Gallery"
# Optional:
#   IG_BUSINESS_ID    -- sanity-checks the Page's linked Instagram account in
#                        fetch_followers.js; safe to leave unset (see that
#                        script's own docstring), add it later if desired.
#
# Reports on the month that just ended -- run this on/after the 1st of the
# following month (the Routine should be scheduled for 00:00 UTC on the 1st).
#
# IMPORTANT: cloud Routine sessions check out their own throwaway branch
# (claude/<random-name>) instead of committing directly to main. A plain
# `git push` would push THAT branch and leave main untouched -- silently
# stranding this run's client-context.md / follower-history.json / run-log.txt
# updates somewhere next month's fresh clone of main will never see, which
# breaks goal-checkoff and follower-growth tracking even on a fully
# successful run. Every push below explicitly targets main regardless of
# the local branch name.
set -uo pipefail
cd "$(dirname "$0")"

if [ -z "${CLIENT_NAME:-}" ]; then
  echo "Missing required env var: CLIENT_NAME" >&2
  exit 1
fi

MONTH=$(date -u -d "last month" +%B 2>/dev/null || date -u -v-1m +%B)
YEAR=$(date -u -d "last month" +%Y 2>/dev/null || date -u -v-1m +%Y)
OUTPUT="${CLIENT_NAME} Monthly Report — ${MONTH} ${YEAR}.pptx"
TIMESTAMP="$(date -u +%FT%TZ)"

log_failure_and_push() {
  echo "[$TIMESTAMP] $1" >> run-log.txt
  git add run-log.txt >/dev/null 2>&1
  git commit -m "Run failed (${MONTH} ${YEAR}): $2" >/dev/null 2>&1
  git push origin HEAD:main >/dev/null 2>&1
  echo "ABORTED_BEFORE_UPLOAD"
}

echo "=== Step 1: Pulling Buffer metrics (current vs. prior period) ==="
if ! node buffer-metrics.js > /tmp/buffer_data.json 2>/tmp/buffer_err.log; then
  log_failure_and_push "BUFFER FETCH FAILED: $(cat /tmp/buffer_err.log)" "buffer-metrics fetch"
  exit 1
fi

echo "=== Step 2: Pulling follower snapshot (Meta Graph API) ==="
if ! node fetch_followers.js > /tmp/followers_out.log 2>/tmp/followers_err.log; then
  log_failure_and_push "FOLLOWER FETCH FAILED: $(cat /tmp/followers_err.log)" "fetch_followers"
  exit 1
fi

echo "=== Step 3: Generating deck + auto goals ==="
if ! python3 generate_report.py --data /tmp/buffer_data.json --output "$OUTPUT" --month "$MONTH" \
     --client "$CLIENT_NAME" > /tmp/generate_out.log 2>&1; then
  log_failure_and_push "REPORT GENERATION FAILED: $(tail -30 /tmp/generate_out.log)" "generate_report"
  exit 1
fi
cat /tmp/generate_out.log   # surface the generated goals + checkoff results in the routine's own run log

echo "=== Step 4: Sanity-checking the deck before upload ==="
VALIDATION_OK=1
python3 validate_report.py "$OUTPUT" || VALIDATION_OK=0

echo "=== Step 5: Persisting updated state back to the repo ==="
git add client-context.md follower-history.json run-log.txt >/dev/null 2>&1
git commit -m "Automated monthly run: ${MONTH} ${YEAR}" >/dev/null 2>&1 || true
git push origin HEAD:main

if [ "$VALIDATION_OK" -eq 1 ]; then
  echo "OK_TO_UPLOAD:${OUTPUT}"
  exit 0
else
  echo "VALIDATION_FAILED_DO_NOT_UPLOAD"
  exit 1
fi
