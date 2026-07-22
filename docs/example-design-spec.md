# Example Design Spec

> This document describes the deck this template was originally extracted
> from (built for a real client's brand). It's kept here as a **worked
> example** of how to translate a reference deck's look into the
> `COLORS` / `TITLE_FONT` / `BODY_FONT` block and cover-slide layout at the
> top of `generate_report.py` -- not as something to keep verbatim for a new
> client. When onboarding a new client, either replace this file with a spec
> for *their* reference deck (if they have one), or delete it once you've
> made the swap and don't need the worked example anymore.

Source: a Google Slides deck ("simple-light-2" theme), 8 slides, 10in × 5.62in
(16:9-ish widescreen, actually ~1.778:1). Built in Google Slides and
exported/synced to .pptx — layout names like `CUSTOM_1_1_2_2` are
Slides-generated, not native PowerPoint layout names.

## Theme

**Color palette** ("Simple Light" scheme):
| Role | Hex | Usage |
|---|---|---|
| dk1 (background) | `#E9E4DB` | Cream/off-white — slide background on every slide |
| lt1 (text) | `#131313` | Near-black — title and body text |
| dk2 | `#E96A64` | Coral/red accent |
| lt2 | `#299F9C` | Teal accent |
| accent1 | `#C0534D` | Muted red |
| accent2 | `#207D7B` | Dark teal |
| accent3 | `#6E9960` | Sage green (used for the month chip text on the title slide) |
| accent4 | `#444746` | Dark gray |
| accent5 | `#CDC7B9` | Warm gray/tan |
| accent6 | `#F5F5F5` | Near-white |

**Fonts:**
- **Titles:** Anton, bold, 30pt (master default) — a tall condensed display face, always black text on the cream background.
- **Body text:** Manrope, 12pt, regular weight.
- **Title-slide-only accents:** Manrope ExtraBold (used for the month chip, 13pt, colored `accent3`/sage-green) and Manrope Light for the subtitle line.
- Bullet character throughout: solid round bullet `●`, default font, no color override (inherits near-black text color).

**Background:** Solid `dk1` fill (`#E9E4DB`) inherited from the slide master on every slide — no background image, no gradient.

(Note: the shipped `generate_report.py` in this template no longer uses
this exact palette/fonts -- it was later updated to a different example
scheme, described in that file's own module docstring. Both are kept here
only to illustrate the *process* of documenting a reference deck.)

## Slide-by-Slide Structure

### 1. Title / Cover slide
Layout: `BLANK_1_1_1_1_1_1` (title layout)
- **Title placeholder** (center, ~7.64×1.85in): "Monthly Marketing Report" — large centered title.
- **Month chip** (small title placeholder, idx=2, centered under title): e.g. "June" — 18pt, centered.
- **Subtitle placeholder**: client/brand name, centered above title block.
- **Text box** ("Content Link:") — bold label, centered.
- **Text box** (URL) — regular weight, left-aligned: a raw link to the working content board for the month.

Pattern: cover = report title + month + client name + a link out to the working content board.

### 2. Instagram Insights
Layout: `CUSTOM_1_1_2_2` (standard content layout used by every slide after the cover)
- **Title placeholder** top-left (~0.56, 0.58, 5.23×0.66in)
- **Two full-bleed screenshot images** side by side, no captions, no native charts:
  - Left image: platform "Performance" panel — stat cards with sparkline trends and comparison bars.
  - Right image: platform "Content overview" panel — KPI row, a filled line chart of daily views, and a scroll strip of top-performing post thumbnails.

### 3. Facebook Insights
Layout: `CUSTOM_1_1_2_2`
- **Large screenshot**: platform Posts tab, or an **empty state** illustration if there's no data that period.
- **Small decorative sticker image** (optional, top right): a playful annotation flagging a "nothing to show" result rather than a real chart.

Pattern: when a channel has no data for the period, the template keeps the layout consistent (title + screenshot) and uses a small sticker/emoji image as an editorial aside instead of fabricating a chart.

### 4. TikTok Insights
Layout: `CUSTOM_1_1_2_2`
- **Three stacked mobile-app screenshots** (portrait phone-shaped crops), arranged left-to-right: Followers tab, Overview tab, Video list tab.

Pattern: for TikTok, native in-app analytics screens (mobile aspect ratio) are screenshotted directly rather than cropped to widescreen.

### 5. Miscellaneous Marketing Items
Layout: `CUSTOM_1_1_2_2`
- **Body placeholder**, bulleted list (● bullets, 14pt, no bold), plain narrative recap of non-social work done that month.

### 6. Marketing WINS
Layout: `CUSTOM_1_1_2_2`
- **Body placeholder**, bulleted list, **all items bold** (14pt bold) — visually distinguished from the Misc slide purely by bold weight, no color change.

### 7. Last Month – Goals (retro)
Layout: `CUSTOM_1_1_2_2`
- **Body placeholder**, bulleted list reviewing prior month's goals, with an **inline checkmark** appended directly in the bullet text for completed items.
- **Subtitle placeholder** (bottom right, small): a standing discussion prompt, e.g. "What else? Goals for Month? Questions?"

### 8. Next Month – Goals (forward-looking)
Layout: `CUSTOM_1_1_2_2` — identical structure to slide 7, forward-looking goal list instead of a retro.

## Section Order (template skeleton to replicate)

1. **Cover** — Report title, month, client name, link to working board
2. **Instagram Insights** — screenshots or generated charts of the platform's stat panels
3. **Facebook Insights** — screenshot(s), sticker if no data
4. **TikTok Insights** — in-app analytics screenshots
5. **Miscellaneous Marketing Items** — plain bullet recap, non-bold
6. **Marketing WINS** — bullet recap, all bold
7. **Last Month – Goals for [prior month]** — bullets with checkmarks for done items + standing "What else?" subtitle prompt
8. **Next Month – Goals for [next month]** — forward bullets, bold for blockers/asks + same standing subtitle prompt

## Key replication notes

- No native PowerPoint/Google Slides charts anywhere in the *original reference deck* — every "chart" was a raw platform-analytics screenshot. The shipped `generate_report.py`, by contrast, builds real charts/tables from Buffer data rather than screenshots -- a deliberate evolution, not an oversight; keep it that way for new clients unless you have a specific reason to go back to screenshots.
- Layout is reused verbatim across content slides: title anchored at top-left (0.56in, 0.58in), body/content area starting at (0.56in, 1.24in). Only the cover slide uses a distinct centered layout.
- Visual differentiation between "wins" vs "misc" vs "goals" slides is done entirely through **bold weight and inline emoji/checkmarks** — no color-coding, no icon library, no chart-styling changes.
- Fonts are constrained to two families throughout (a display face for titles, a plain sans for everything else).
