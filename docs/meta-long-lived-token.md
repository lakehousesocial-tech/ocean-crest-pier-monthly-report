# Getting a Long-Lived Meta Access Token

`fetch_followers.js`'s `META_ACCESS_TOKEN` needs to be a **long-lived Page
Access Token**, not a token copied straight out of the Graph API Explorer --
those expire in about an hour, and this script only runs once a month, so
the Routine will start failing with `FOLLOWER FETCH FAILED` almost
immediately (often before the very first scheduled run even happens).

## Prerequisites

- A Meta developer app (App ID + App Secret) with access to the client's
  Facebook Page and its linked Instagram Business/Creator account. Create
  one at https://developers.facebook.com/apps if you don't already have
  one for this purpose.
- The client's Facebook Page must have a linked Instagram professional
  account -- `fetch_followers.js` already assumes this via the
  `instagram_business_account` field expansion.

## Steps

1. **Get a short-lived User Access Token.**
   Graph API Explorer (https://developers.facebook.com/tools/explorer/) →
   select your app → "Get User Access Token" → request these permissions:
   `pages_show_list`, `pages_read_engagement`, `instagram_basic` (add
   `business_management` too if the Page lives inside a Business Manager).
   Copy the generated token.

2. **Exchange it for a long-lived User Access Token (~60 days).**
   ```
   curl -s "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=<APP_ID>&client_secret=<APP_SECRET>&fb_exchange_token=<SHORT_LIVED_TOKEN>"
   ```
   Copy the `access_token` from the response.

3. **Convert that into a long-lived Page Access Token** -- this is the
   value that actually goes into the `META_ACCESS_TOKEN` secret:
   ```
   curl -s "https://graph.facebook.com/v21.0/<FB_PAGE_ID>?fields=access_token&access_token=<LONG_LIVED_USER_TOKEN>"
   ```
   A Page token generated this way from a long-lived user token does not
   expire on its own -- it stays valid until the admin who generated it
   removes the app's access, changes their Facebook password, or the app's
   permissions are revoked by Meta.

4. **Verify it.** Paste the token into the Access Token Debugger
   (https://developers.facebook.com/tools/debug/accesstoken/) and confirm
   "Expires" shows "Never" and "Type" shows "Page".

5. **Set it** as the `META_ACCESS_TOKEN` secret on this client's
   Environment.

## More robust alternative: System User token

For an agency running this pipeline across many clients, consider
generating a **System User** access token from Meta Business Manager
instead of a personal long-lived Page token -- it isn't tied to any one
employee's personal Facebook account, so it survives that person leaving
or changing their password. Business Settings → Users → System Users →
Add → generate a token with the same permissions listed above, scoped to
each client's Page/Instagram asset.

## If a run ever fails with an invalid/expired token

Even a "non-expiring" Page token can be invalidated (password change, app
review changes, page ownership transfer, a Meta platform policy change).
If `FOLLOWER FETCH FAILED` shows up in `run-log.txt` with a token error,
redo this process to get a fresh one.
