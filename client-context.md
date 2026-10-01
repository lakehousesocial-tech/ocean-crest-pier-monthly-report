# Ocean Crest Pier — Client Context

<!--
  ONBOARDING: fill in the sections below with this client's real details
  before the first scheduled run. This file is read by generate_report.py
  on every run (--client-context, defaults to client-context.md next to the
  script) both for these brand facts and for the auto-generated Goal Log.
-->

## Brand

- Client/business name: Ocean Crest Pier
  (this must match the CLIENT_NAME secret set on this client's Routine
  exactly, since it's used as the cover-slide title)
- Brand/handle notes: [primary brand name, any alternate names used across
  channels]
- Current focus: [current campaign, collection, product line, or seasonal
  push worth tying goals/content to]
- Recurring content themes: [what this client typically posts about]
- Social channels (scheduled/tracked via Buffer):
  - Instagram: [@handle]
  - TikTok: [@handle]
  - Facebook: [Page name]

## Active Initiatives

- (Add active initiatives here -- site launches, product drops, campaigns,
  partnerships -- so automatic goal generation can tie content
  recommendations to them. See context_tie_in_goal() in generate_report.py
  for how a static initiative-linked goal gets woven into the auto-generated
  goal list.)

## Goal Log

<!--
  Auto-generated and auto-checked by generate_report.py -- do not hand-edit
  the structure below without care. Each month's run appends one entry here:
    - What changed that period (a short data summary)
    - The goals set for the FOLLOWING period
  The following month's run re-evaluates each goal's <!-- check: ... -->
  condition against that period's real data and flips "- [ ]" to "- [x]"
  automatically if met.
  Format: "- [ ] <goal text> <!-- check: <platform>.<metric> <op> <baseline> -->"
  A goal with no check comment isn't data-checkable and stays unchecked
  until marked by hand.

  Leave this section EMPTY (no "### <Month>" entries) for a brand-new
  client -- generate_report.py falls back to manual placeholder bullets on
  the "Last Month" slide for the very first run, since there's no prior
  automated goal to check off yet. The first run's own goals become the
  first real entry here.
-->

### September

**What changed:** Instagram: 17 vs. 27 posts, engagement up (4.37% → 6.85%). TikTok: 4 vs. 6 posts, engagement up (5.76% → 7.40%). Facebook: 25 vs. 32 posts, engagement down (1.28% → 0.74%).

**Goals set:**
- [ ] Restore Instagram posting cadence — down 37% this period (17 vs. 27 posts). Aim for 27+ posts next period. <!-- check: instagram.postCount > 27 -->
- [ ] Restore TikTok posting cadence — down 33% this period (4 vs. 6 posts). Aim for 6+ posts next period. <!-- check: tiktok.postCount > 6 -->
- [ ] Restore Facebook posting cadence — down 22% this period (25 vs. 32 posts). Aim for 32+ posts next period. <!-- check: facebook.postCount > 32 -->
- [ ] Close the engagement gap on Facebook — trailing TikTok by 6.7 points (0.74% vs. 7.40%). Borrow whatever content approach is working on TikTok. <!-- check: facebook.engagementRate > 0.74 -->
