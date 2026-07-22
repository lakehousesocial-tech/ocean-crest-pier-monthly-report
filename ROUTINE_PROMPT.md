# Routine Prompt Template

Use this as the `prompt` when creating the monthly Routine for a new client
(see README.md's "Onboard a new client" steps). Replace `{{CLIENT_NAME}}`
with the client's display name (same value as the `CLIENT_NAME` secret you
set on the Routine's Environment) and paste the rest verbatim.

Suggested Routine settings:
- **Cron:** `0 0 1 * *` (00:00 UTC on the 1st of each month — reports on the
  month that just ended)
- **Session context / sources:** point at this client's own repo (the one
  you created by duplicating this template), branch `main`
- **Allowed tools:** `Bash, Read, Write, Edit, Glob, Grep, WebFetch, WebSearch`
- **Environment secrets:** `BUFFER_API_KEY`, `META_ACCESS_TOKEN`,
  `FB_PAGE_ID`, `IG_BUSINESS_ID`, `CLIENT_NAME` (see README.md)

---

```
You are running the fully automated monthly {{CLIENT_NAME}} social media report pipeline. This runs unattended on a schedule -- do not ask for confirmation or approval at any step.

1. Run: bash run_monthly_report.sh from the repo root. This single script pulls fresh Buffer metrics, pulls a fresh follower snapshot from the Meta Graph API, generates the branded .pptx (which also auto-generates this month's goals and checks off last month's against real data, updating client-context.md), and sanity-checks the result. It expects BUFFER_API_KEY, META_ACCESS_TOKEN, FB_PAGE_ID, IG_BUSINESS_ID, and CLIENT_NAME as environment variables -- these are configured as secrets on this Routine's Environment; do not try to source them elsewhere.

2. Read the script's final output line:
- If it is exactly OK_TO_UPLOAD:<filename>, commit that exact file (in the repo root) to the repository instead of uploading it anywhere: run `git add -f "<filename>"`, then `git commit -m "Add generated report: <filename>"`, then `git push origin HEAD:main`. Do this as a plain git/Bash file operation -- do not read the file's contents into your own context or try to transcribe/encode it yourself; `git add` operates on the file directly.
- If it is VALIDATION_FAILED_DO_NOT_UPLOAD or ABORTED_BEFORE_UPLOAD, do NOT commit the .pptx -- the script already logged the specific failure to run-log.txt and pushed it to the repo. Just stop; do not try to fix or retry it yourself.

3. After committing the .pptx, verify success by running `git log -1 --stat` and confirming the .pptx file appears in that commit with a file size roughly matching the local file (use `ls -la` on the file beforehand to know the expected size). If the commit or push fails, append a note to run-log.txt describing the failure, commit that note, and push -- do not retry more than once.

Do not modify generate_report.py, buffer-metrics.js, fetch_followers.js, validate_report.py, or run_monthly_report.sh. Do not ask clarifying questions -- this is a fully unattended run.
```
