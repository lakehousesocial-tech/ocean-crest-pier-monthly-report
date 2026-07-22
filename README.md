# Client Monthly Report — Template

Reusable template for a fully automated monthly social media report
pipeline: pulls fresh metrics from Buffer and the Meta Graph API, generates
a branded .pptx deck, auto-generates and checks off month-over-month goals,
and commits the deck to the client's own repo. Originally built for one
client and generalized here so each new client gets their own repo,
credentials, and schedule, without re-deriving the pipeline from scratch.

**This repo has no real client data in it.** Each client gets their own
copy (see "Onboard a new client" below); nothing here should ever hold a
real API key, follower count, or generated deck.

## How the pipeline works

`run_monthly_report.sh` is the single entry point, meant to run unattended
once a month (via a scheduled Routine):

1. `buffer-metrics.js` — pulls current-vs-prior-period post metrics for
   Instagram/TikTok/Facebook from Buffer's GraphQL API.
2. `fetch_followers.js` — pulls current Facebook/Instagram follower counts
   from the Meta Graph API and appends a dated snapshot to
   `follower-history.json`.
3. `generate_report.py` — builds the branded .pptx from that data, and
   separately reads/updates `client-context.md`'s Goal Log: it checks off
   last period's goals against real data and generates 3-5 new goals for
   next period.
4. `validate_report.py` — sanity-checks the generated deck (no empty hero
   stat cards, no all-zero charts) before it's allowed to ship.
5. The run script commits the updated `client-context.md`,
   `follower-history.json`, and `run-log.txt` back to `main` either way; the
   Routine (see `ROUTINE_PROMPT.md`) commits the .pptx itself only if
   validation passed.

## Onboard a new client

1. **Duplicate this repo.** On GitHub, use "Use this template" (if this
   repo is marked as a template) or just create a new empty repo and copy
   these files in. Name it something like `<client>-monthly-report`.

2. **Fill in `client-context.md`.** Replace the `[Client Name]` heading and
   the Brand section with this client's real details. Leave the Goal Log
   section empty — the first run populates it.

3. **Customize the design system.** In `generate_report.py`, the `COLORS`,
   `TITLE_FONT`, and `BODY_FONT` block near the top (and the cover-slide
   layout in `build_cover_slide`) is an *example* brand, not this client's.
   Swap in the new client's actual palette and fonts. `docs/example-design-spec.md`
   shows the process used to translate a reference deck into that block —
   follow the same process for this client's brand if they have a reference
   deck, or a brand kit otherwise.

4. **Collect this client's credentials:**
   - A Buffer API access token with access to their connected
     Instagram/TikTok/Facebook channels (`BUFFER_API_KEY`)
   - A **long-lived** Meta Graph API access token with
     `pages_read_engagement` / `instagram_basic` permission on their Page
     (`META_ACCESS_TOKEN`) — **do not use a token copied straight from the
     Graph API Explorer; those expire in about an hour and will break the
     Routine before its first scheduled run.** See
     `docs/meta-long-lived-token.md` for the exact steps to generate one
     that doesn't expire.
   - Their Facebook Page ID (`FB_PAGE_ID`)
   - *(optional)* Their Instagram Business Account ID (`IG_BUSINESS_ID`) --
     only used as a sanity-check in `fetch_followers.js`; the follower
     fetch itself works without it, so it's fine to add later if you don't
     have Instagram access yet during onboarding.

5. **Create a new Environment** (Claude Code Remote) for this client and
   set secrets on it: `BUFFER_API_KEY`, `META_ACCESS_TOKEN`, `FB_PAGE_ID`,
   `CLIENT_NAME` (the display name shown on the report cover — should match
   what you put in `client-context.md`), and `IG_BUSINESS_ID` if you have
   it. Point the Environment's repo source at the new repo you created in
   step 1.

6. **Create a Routine** bound to that Environment, monthly cron
   `0 0 1 * *`, using the prompt in `ROUTINE_PROMPT.md` (fill in
   `{{CLIENT_NAME}}`).

7. **Test it.** Fire the Routine manually once before trusting the
   schedule. Check that the generated .pptx looks right, that
   `client-context.md`'s Goal Log got its first entry, and that
   `follower-history.json` has a real (not null) snapshot.

## File reference

| File | What it is |
|---|---|
| `run_monthly_report.sh` | Entry point; orchestrates the full pipeline and handles the branch/push gotcha below |
| `buffer-metrics.js` | Buffer GraphQL API client — post-level metrics, current vs. prior period |
| `fetch_followers.js` | Meta Graph API client — follower-count snapshots |
| `generate_report.py` | Builds the .pptx; also owns all goal-generation/checkoff logic |
| `validate_report.py` | Pre-upload sanity check on the generated deck |
| `client-context.md` | Per-client brand facts + the auto-maintained Goal Log (do not hand-edit the Goal Log's structure) |
| `follower-history.json` | Append-only follower-count log written by `fetch_followers.js` (starts empty/absent for a new client) |
| `run-log.txt` | Append-only failure log (starts empty/absent for a new client) |
| `ROUTINE_PROMPT.md` | The exact Routine prompt to use, with placeholders |
| `docs/example-design-spec.md` | Worked example of translating a reference deck into the design-system code block |
| `docs/meta-long-lived-token.md` | How to generate a `META_ACCESS_TOKEN` that doesn't expire before next month's run |

## Things worth knowing before you run this unattended

- **Cloud Routine sessions check out their own throwaway branch**, not
  `main`. Every push in `run_monthly_report.sh` explicitly targets
  `origin HEAD:main` for this reason — don't "simplify" that to a plain
  `git push`, or a run's state updates silently strand on a branch next
  month's fresh clone will never see.
- **Buffer's Free plan caps `aggregatedPostMetrics` history to ~30 days.**
  Because every prior-period window here starts more than 30 days back,
  this template sums metrics from individual posts instead, for both
  periods. If a client is on a paid Buffer plan this cap may not apply, but
  there's no benefit to switching back — keeping both periods on the same
  code path is what makes them comparable.
- **TikTok has no follower-count data source** — neither Buffer nor Meta's
  Graph API expose it. That hero card is always a manual placeholder
  (`[Count]`) meant to be overtyped by hand before presenting.
- **`META_ACCESS_TOKEN` must be long-lived.** A token pasted straight from
  the Graph API Explorer expires in about an hour; the Routine only runs
  once a month, so it will die almost immediately. See
  `docs/meta-long-lived-token.md` — this is step 4 of onboarding above, not
  optional.
- **The first month for any client has no prior Goal Log entry.** The
  "Last Month" slide falls back to manual placeholder bullets, and the
  content-tie-in goal is skipped entirely if `client-context.md`'s Active
  Initiatives section is still empty. Both resolve themselves naturally
  once the client has been running a month or two.
