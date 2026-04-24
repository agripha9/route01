# Design System: Route01

> **Scope**: This document defines the visual language for Route01 — the AI-powered startup advisory product at route01.kr. Its primary artifact is the **advisory report** (멘토 답변). Read this before any UI change so decisions stay consistent across sessions.
>
> **Inspirations**: Apple HIG (typography discipline, minimal chrome), Anthropic Claude (literary/editorial tone, warm neutrals), Notion (structured content hierarchy).
>
> **Last updated**: 2026-04-24

---

## 1. Visual Theme & Atmosphere

Route01 is a **consulting report reimagined as a chat interface**. The user asks a question, a named mentor (Paul Graham, Peter Thiel, Brian Chesky, Jensen Huang, or Naval Ravikant) responds with a fully-formed advisory report — structured, opinionated, citation-worthy. The entire visual language exists to dignify that report.

The design philosophy is **editorial, not decorative**. Section hierarchy emerges from typography and whitespace alone — no colored bars, no boxes, no chrome. When the eye lands on the answer, it should feel like opening a thoughtfully typeset document, not a SaaS dashboard.

The palette is **warm-neutral** — every gray has a subtle warmth to it. Crimson (`#8B1A1A`) is the brand signature, but it is used surgically: brand moments (logo, table headers, primary CTAs, active states) only. It is never decorative. Navy (`#1a3a6e`) is a secondary brand accent for specific accents (FREE tier, onboarding numerals) — also used sparingly.

**Key Characteristics:**
- Warm-neutral canvas — all grays tinted warm, no cool blue-grays anywhere
- Crimson (`#8B1A1A`) reserved for brand/interactive use only, never section decoration
- Typography-first hierarchy — H2/H3/H4 differentiated by size + weight + color, never by bars or boxes
- Generous line-height on body (1.65) for editorial reading rhythm
- Extreme weight restraint — 400, 600, 700 only; no 800 or 300 decoratives
- Minimal visible borders — depth via background color steps and whitespace
- Single answer bubble takes the full content width — the report IS the scene

## 2. Color Palette & Roles

### Primary Text (Ink Scale)
- **Ink** (`#1d1d1f`): Primary body text, H2 section headings. Slightly warmer than pure black.
- **Ink 2** (`#3d3d3a`): H3 subheadings, emphasized secondary text. Claude's "Dark Warm" — softer than Ink, used to create sub-hierarchy in headings.
- **Ink 3** (`#5e5d59`): Secondary text, metadata, captions. Warm olive gray (Claude "Olive Gray").
- **Ink 4** (`#87867f`): Tertiary text, muted labels, list markers for `ul`. Warm stone gray.

### Brand
- **Crimson** (`#8B1A1A`): Brand signature. Used for table headers, primary CTA, PRO tier selected state, focus rings, link underlines. Never for section decoration.
- **Crimson Press** (`#721616`): Pressed/active state of crimson elements.
- **Navy** (`#1a3a6e`): Secondary brand accent. FREE tier selected state, brand lockup, navigation accents. Used sparingly.
- **Navy Press** (`#152d58`): Pressed state of navy elements.
- **Gold** (`#B8862C` border, `#9C6A1A` text): Recommendation badge (추천 멘토) — the third brand signal that sets "recommended" visually apart from FREE (navy) and PRO (crimson).

### Surface (Warm-Neutral Background Ladder)
Five-level lightness scale, all warm-tinted. Depth comes from these steps, not from shadows.

| Level | Token | Value | Use |
|-------|-------|-------|-----|
| L1 | `--filter-bg`, `--white` | `#ffffff` | Answer bubble (the report canvas), tables odd rows, modal interiors |
| L2 | `--bg2` | `#f2f0ea` | Secondary surfaces: input fields, uploaded-file chips, subtle cards |
| L3 | `--bg` | `#e8e6dc` | Main chat body, modal overlays. **Warm Sand** — the primary canvas |
| L4 | `--bg3` | `#ddd9cd` | Sidebar, section dividers (one step darker for visual separation) |
| L5 | `--nav-glass` | `rgba(20,20,19,0.8)` | Top navigation bar — warm near-black with backdrop blur |

### Borders & Rings
- **Border Hairline** (`--border: #e5e2d7`): Standard border, barely visible warm cream. Default for quiet containment.
- **Border Emphasis** (`--border2: #d1cdbf`): Prominent borders, table outlines, input field edges.
- **Ring Focus** (`0 0 0 3px rgba(139,26,26,0.22)`): Keyboard focus, field focus — warm crimson halo.

### Semantic
- **Success** (`#3e7c47`): Rarely used — only for "API 연결됨" indicator. Muted warm green.
- **Warning / Error** (`#b53333`): Destructive actions, error states. Claude's "Error Crimson" tone.

### Text Quotations / Blockquote
- Background `#f7f6ef` (warm parchment), left border `#d1cdbf 3px` — italic body retains for editorial tone.

## 3. Typography Rules

### Font Family
- **Display**: `Inter`, with fallbacks: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif`
- **Body**: Same as display (Inter is a single optical family). Pretendard kept as Korean fallback in some contexts.
- **Mono**: `ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono"`

*Note: Inter is used as the web-safe substitute for SF Pro. Both fonts share the same design DNA (humanist sans with tight tracking), so typographic rules below apply identically.*

### Hierarchy — Answer Bubble (the primary report canvas)

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| H1 — Mentor Opening | 24px | 700 | 1.28 | -0.024em | Italic. Paul Graham's conclusion / Naval's aphorism only. Never for section titles. |
| H2 — Section Heading | 24px | 600 | 1.22 | -0.028em | **No decoration** — size + weight + whitespace only. No left bar, no underline. |
| H3 — Subsection | 17px | 600 | 1.4 | -0.018em | Color `#3d3d3a` (Ink 2). Differs from body by size, weight, and subtle color shift. |
| H4 — Inline Label | 15px | 700 | 1.4 | -0.015em | Color `#1d1d1f`. Same size as body — distinguished by weight alone. |
| Body | 15.5px | 400 | 1.65 | -0.011em | Editorial reading rhythm. Prose-first. |
| Body Lead | 16px | 400 | 1.6 | -0.012em | First paragraph after H1/H2 — slightly larger for intro emphasis. |
| List Item | 15.5px | 400 | 1.6 | -0.011em | Same as body. Item spacing 1.05rem for independence. |
| Block Quote | 15.5px | 400 (italic) | 1.6 | normal | Italic, parchment bg, warm border-left. |
| Caption | 13px | 500 | 1.43 | -0.01em | Below-the-fold metadata. |

### Hierarchy — Application UI (header, sidebar, buttons)

| Role | Size | Weight | Use |
|------|------|--------|-----|
| Nav Mentor Pill | 14px | 600 | Top nav mentor identifier |
| Nav Button | 13px | 500 | Top nav action buttons |
| Sidebar Title | 12px | 700 | "질문 기록" header — uppercase, letter-spacing 0.06em |
| Sidebar Group Label | 10.5px | 700 | "오늘", "어제" — uppercase, letter-spacing 0.08em |
| Sidebar Item | 13px | 400 | History question text |
| Input | 15px | 400 | Main chat input |
| Button | 14px | 600 | Default button label |

### Principles
- **Typography-only hierarchy**: Headings (H2/H3/H4) are distinguished by **size + weight + optional color shift** — never by left bars, underlines, or background fills. This is the Apple/Claude discipline: let the type do the work.
- **Weight restraint**: Use 400 (body), 500 (UI), 600 (headings/emphasis), 700 (strong emphasis, H1). **Never 800 or 900.** Keep the scale narrow.
- **Negative tracking universal**: All text gets slight negative letter-spacing (-0.011em at body, -0.028em at H2). Apple/Claude/Linear all do this — it creates universally tight, efficient text.
- **Editorial line-height**: Body at 1.65 (relaxed) — closer to a book than a dashboard. Headings at 1.22-1.4 (tight but not compressed).
- **No decorative italics**: Italics are reserved for emphasis and quotations only. Exception: H1 mentor opening (italic as signature "aphorism" gesture — Naval/PG style).
- **Numerals**: `font-variant-numeric: tabular-nums` on ordered list markers and tables, so numbers align vertically.

## 4. Component Stylings

### Answer Bubble (`.report-bubble`)

The primary artifact. All other UI serves to deliver this.

- Background: `#ffffff` (L1) — pure white paper
- Padding: 48px 48px 40px (desktop), 32px 24px 28px (mobile)
- Border: none
- Shadow: none — contrast with surrounding L3 Warm Sand provides implicit elevation
- Radius: 0 — edge-to-edge within its container (no card chrome)
- Max-width: inherits parent (chat column ~820px)

**Interior spacing rhythm** (paragraph/section margins):
- Paragraph bottom margin: 1.15rem (standard body rhythm)
- H2 → body: top margin 3.5rem, bottom 1rem
- H3 → body: top 2.25rem, bottom 0.7rem
- H4 → body: top 1.5rem, bottom 0.5rem
- List block top/bottom: 1rem / 1.4rem
- List item bottom margin: 1.05rem (items read as independent statements)
- Blockquote vertical: 1.6rem top and bottom

### Ordered Lists (the crucial pattern)

Numbered lists appear constantly in advisory content ("1. 이번 주 할 일 / 2. 한 달 내 / 3. 분기 말"). The marker is the visual anchor that makes the list scannable.

- Marker: `color: #8B1A1A` (crimson), `font-weight: 600`, `font-size: 0.92em`, `tabular-nums`
- List left-padding: 1.6rem (moderate indent)
- Item: bottom margin 1.05rem, line-height 1.6
- First-child `<strong>` inside item: `font-weight: 700` — the "lead word" for quick scanning

### Unordered Lists
- Marker: `#87867f` (Ink 4 / stone gray), weight 400 — subtle
- Otherwise identical structure to ordered lists

### Tables

- Outer border: `1px solid #d1cdbf` (Border Emphasis)
- Inner cells: `1px solid #e5e2d7` (Border Hairline)
- Radius: 8px
- Header: `background #8B1A1A`, `color #fff`, center-aligned, weight 700
- First column (body): weight 600 (row label emphasis)
- Odd rows: `#ffffff`, even rows: `#fbf9f3` (warm alternation — never `#fdfafa` pinkish)
- Cell padding: 10px 14px
- Font-size: 14.5px on screen, 11pt in exports

### Blockquote

- Background: `#f7f6ef` (warm parchment)
- Border-left: `3px solid #d1cdbf`
- Padding: 1rem 1.4rem
- Radius: 0 8px 8px 0 (right side only — open feel)
- Body: italic, same color as regular text (#1d1d1f)

### Buttons

**Primary (Brand CTA)**
- Background: `#8B1A1A` (Crimson)
- Text: `#ffffff`
- Padding: 10px 20px
- Radius: 8px
- Font: 14px, weight 600
- Hover: `#721616`
- Focus: `0 0 0 3px rgba(139,26,26,0.22)` halo

**Secondary (Surface Button)**
- Background: `#f2f0ea` (L2)
- Text: `#1d1d1f`
- Border: `1px solid #e5e2d7`
- Hover: background `#e8e6dc`, border `#d1cdbf`

**Pill (Navigation)**
- Used in header for mentor/action chips
- Background: `rgba(255,255,255,0.1)` on dark glass nav
- Height: 30px, radius 980px (full pill)

### Input Fields
- Background: `#ffffff`
- Border: `1px solid #e5e2d7`
- Padding: 10px 14px
- Radius: 10px
- Focus: border `#8B1A1A`, halo `0 0 0 3px rgba(139,26,26,0.15)`

### Sidebar
- Background: `#ddd9cd` (L4 — warm taupe)
- Width: 240px (collapsible to 0)
- Header "질문 기록": 12px weight 700, uppercase, letter-spacing 0.06em
- Group labels ("오늘"/"어제"): 10.5px weight 700, uppercase, letter-spacing 0.08em, color `#87867f`
- Items: 13px, line-height 1.42, padding 7px 12px, radius 7px, hover `rgba(0,0,0,0.05)`

### Navigation (Top Header)
- Background: `rgba(20,20,19,0.8)` (warm near-black glass) with `backdrop-filter: blur(20px) saturate(180%)`
- Height: 56px
- Text: `#fff`, 13px-14px

## 5. Layout Principles

### Spacing System
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96
- Default section gap in answer: 56px (H2 top-margin ~3.5rem)
- Default paragraph gap: 18px (~1.15rem)

### Grid & Container
- Chat content max-width: 820px (centered)
- Answer bubble: fills chat width, no additional card chrome
- Modal max-width: 460px (Apple-compact)
- Onboarding card: 690px (dense but centered)

### Whitespace Philosophy
- **Compression within, expansion between** (Apple): Text blocks are tightly typeset (negative tracking, tight headings at 1.22) while spacing between sections is generous (3.5rem+ between H2 blocks).
- **Rhythm through color layers, not borders**: Sidebar separates via L4 bg step. Input bar separates via L2 bg. Answer bubble separates via L1 + surrounding L3 contrast. No dividing lines needed.
- **Answer is sacred**: Don't stuff UI chrome around the answer bubble. The report should breathe.

### Border Radius Scale
- Micro (4px): Badges, tags
- Small (8px): Buttons, inputs, tables
- Medium (10-12px): Cards, modals, input fields with more prominence
- Large (18px): Main chat container, primary panels
- Full Pill (980px): Navigation pills, tier badges with decorative shapes

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow | Answer bubble, most content — depth comes from L1-vs-L3 bg contrast |
| Nav Glass | `backdrop-filter: blur(20px) saturate(180%)` on `rgba(20,20,19,0.8)` | Top navigation only |
| Subtle (1) | `0 1px 2px rgba(0,0,0,0.06)` | Small interactive elements (hover state of secondary buttons) |
| Card (2) | `0 4px 24px rgba(0,0,0,0.06)` | Modals, popovers |
| Focus Ring | `0 0 0 3px rgba(139,26,26,0.22)` | Keyboard focus on any interactive |

**Shadow Philosophy**: Route01 uses shadow sparingly, Claude-style. Most answer content has no shadow — layering comes from L1-L5 background color steps. Shadows appear only on overlay elements (modals, popovers) and focus rings.

## 7. Do's and Don'ts

### Do
- Use **typography + whitespace only** for answer section hierarchy — H2/H3/H4 differentiated by size, weight, and subtle color shift
- Keep **crimson (`#8B1A1A`) for brand/interactive only** — table headers, CTAs, focus rings, PRO tier. Never for decorating sections
- Apply **negative letter-spacing universally** — -0.028em at H2, -0.011em at body. Inter/SF Pro both want tight tracking
- Use the **warm-neutral background ladder** (L1-L5) for layering — surfaces step through `#ffffff → #f2f0ea → #e8e6dc → #ddd9cd`
- Respect **weight restraint** — 400/500/600/700 only. No 300 or 800
- Give **ordered list markers crimson weight 600** — they are the scannable anchor of advisory content
- Keep **line-height 1.65 on body** — editorial rhythm, not dashboard density
- Use **tabular-nums on numbered markers and tables** — numerical alignment matters
- Use **Ink 2 (`#3d3d3a`) for H3** — creates a clear third-level step without extra chrome

### Don't
- **Don't put colored bars or borders on H2 headings.** Crimson left-bar on H2 is Notion/Confluence territory, not Apple/Claude. Size + whitespace alone
- **Don't use multiple accent colors.** Crimson is the brand accent — navy and gold are for specific secondary/tertiary signals only (tier, recommendation)
- **Don't apply hairline `border-bottom` to paragraphs** to mark "section-like" moments. Use whitespace and weight instead. (Previous attempt created double-line artifacts.)
- **Don't mix cool grays with warm grays.** Every neutral in Route01 has warm undertone. Cool `#d2d2d7` → warm `#e5e2d7`
- **Don't use weight 800** on headings — the scale maxes at 700
- **Don't italicize body paragraphs.** Italic is reserved for H1 mentor openings, blockquotes, and inline emphasis
- **Don't center-align body text.** Body is left-aligned. Only H1 mentor openings may center (optional, per mentor format)
- **Don't add heavy shadows.** Depth comes from the bg ladder. Shadow only on modals and focus rings
- **Don't break mentor-specific answer formats.** Each mentor has a fixed set of H2 sections — the design system assumes those are respected (see `MENTOR_STYLES` in `nachim_v3.js`)

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | Single column; answer bubble padding 32/24/28px |
| Tablet | 640-900px | Full chat column; sidebar toggleable |
| Desktop | >900px | Sidebar open by default; answer padding 48/48/40px |

### Collapsing Strategy
- Sidebar → fully hidden on mobile with a float-open button
- Answer bubble padding shrinks ~1/3 on mobile
- Typography scales: H2 24→22px, H1 24→22px on mobile (<480px)
- Table: maintains structure; horizontal scroll if needed (avoid squishing)

## 9. Export Format Rules (DOCX / PDF)

Route01 generates DOCX (altChunk HTML) and PDF exports of answers. These share the same visual language as screen, adapted for print units.

### Parallel Tokens (screen → export)
- Body: 15.5px / 1.65 → 11pt / 1.65
- H1: 24px / 700 → 17pt / 800 italic (slightly heavier because print loses dynamic range)
- H2: 24px / 600 → 16pt / 700, **no left bar** (match screen simplicity)
- H3: 17px / 600 color #3d3d3a → 12pt / 600 color #3d3d3a
- Table header: crimson bg with white text, pt-exact line-height for DOCX (`mso-line-height-rule:exactly`)
- Ordered list marker: crimson weight 600 at 0.92em in both contexts

### DOCX-specific
- Use `-webkit-print-color-adjust: exact` on table headers (preserves crimson bg in Word)
- Avoid `line-height: 1.62` on `th` cells (use padding instead — prevents altChunk "white band" artifact)
- Font stack includes Malgun Gothic for Windows Korean rendering

### PDF-specific
- `thead` header repeats on page break (built into browser print styling)
- Page margins: 1.8cm top/bottom, 2cm left/right

---

## 10. Session-to-Session Consistency Rules

When Claude works on Route01 UI, it must:

1. **Read this file first** before touching any style
2. **Maintain the warm-neutral palette** — new colors should lean warm, never cool
3. **Respect the crimson-as-brand-only rule** — resist the temptation to use crimson for section decoration
4. **Use typographic hierarchy over chrome** — if tempted to add a border/box to distinguish something, try weight/size/spacing first
5. **Keep export styles in sync** — changes to `.report-bubble` must propagate to `EXPORT_DOC_STYLES` and `htmlStyle` arrays in `nachim_v3.js`
6. **Do not introduce new accent colors** without explicit user approval — navy and gold already occupy specific roles; a fourth accent dilutes the system
7. **Update this DESIGN.md** when palette, typography scale, or component patterns change materially — this is the source of truth, not the CSS

**Rollback anchors**:
- Tag `pre-design-refactor-v2` — state immediately before the 2026-04-24 warm-neutral design system refactor
- Tag `pre-apple-style-refresh` — state before the prior 2026-04-23 Apple-tone answer refactor

---

*This document is versioned alongside the code. Keep it honest — if the code diverges from this doc, fix one or the other, not both silently.*
