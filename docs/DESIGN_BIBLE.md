# 🏰 CASTLE GUIDE — Design Bible & UI Corrective Mandate

> **Version:** 1.0 · **Status:** Overrides all prior UI guidance
> **Companion references:** REF-1..REF-4 (attach the four concept images with this file)
> **One law above all:** THE HOUSE IS THE HOME SCREEN. Castle Guide is a game
> you happen to keep records in — not a records app with a game bolted on later.

---

# PART 1 — PASTE-READY CORRECTIVE PROMPT

```text
STOP. UI course correction. The Phase 1 build failed its design gate:
it shipped as a generic forms-and-fields CRUD app. That entire front end
is condemned. This message + the attached DESIGN_BIBLE.md + reference
images REF-1 through REF-4 are now the visual source of truth, superior
to every earlier one-line aesthetic note.

WHAT SURVIVES, WHAT BURNS:
1. Run the full Phase 1 gate test suite now. Report results.
2. If storage, domain models, ZIP round-trip, lineage, and Prompt Pack
   ingestion tests are green: those layers SURVIVE untouched. This is
   why the constitution said data before decoration.
3. Everything under src/app/pages and src/ui is CONDEMNED. Delete and
   rebuild per this bible. Do not "iterate" on the condemned UI — its
   patterns (field walls, table navigation, gray panels) must not leak
   into the new shell.
4. If any data-layer test is red, fix data first, then rebuild UI.

THE STRUCTURAL FIX (this is the big one):
The house view was deferred to Phase 4. That decision is REVERSED.
House-as-navigation cannot wait: promote the Phase 0 iso spike into a
real (minimal) renderer NOW — Phase 1.5. Rooms drawn from real stored
dims, items as simple markers/blocks, click → item card. Placeholder
art is fine; placeholder LAYOUT is not. The player must see their
castle on screen one.

NEW BUILD ORDER (Phase 1.5 — "The Great Reskin"):
  A. GAME SHELL: persistent HUD frame per bible §3 — top bar (castle
     name, level+XP, serenity meter), left rail nav, bottom quick bar.
     Every feature lives inside this frame. No bare pages, ever.
  B. UI KIT GALLERY: build the component kit (bible §5) as a /kit
     route showing every component in every state. I will screenshot-
     review the kit BEFORE you re-home features into it. This is a
     hard gate.
  C. HOUSE SCREEN: iso renderer from the spike + room labels + item
     markers + click-through to item cards (REF-3 interaction model).
  D. RE-HOME PHASE 1 FEATURES into game components: item cards not
     detail pages, Quick Add not form walls (bible §6), task rail,
     pool room gallery, docs vault chest.
  E. SELF-CRITIQUE LOOP: after each screen, capture/render it, compare
     against REF images, list three things that look worse than the
     reference, fix them, then move on. "It compiles" is not "it ships."

FORM LAW (non-negotiable):
Adding an item = photo + name + room + category. FOUR inputs maximum
on screen. Everything else is optional enrichment behind "Add details"
or via Prompt Pack paste. Any screen showing more than 6 input fields
at once is a design defect. Empty fields are quests, not blanks:
"Serial number missing — snap the label, +15 XP."

GAMIFICATION (only what's earned — bible §7):
Castle Level + XP (earned by cataloging/maintaining), Serenity meter
(computed home health), streak-free design (no guilt mechanics). NO
coins/gems/currencies in v1 — a currency that buys nothing is worse
than none. Log cosmetic-shop currency as a BLUEPRINT socket.

Acceptance gates for Phase 1.5 are in bible §9. Begin with step 1
(test triage report) and stop for my review after step B (UI kit).
```

---

# PART 2 — THE DESIGN BIBLE

## 1. Why the last UI failed (write this on the wall)

The docs specified function exhaustively and appearance in one sentence, so the model reverted to the statistical mean of its training data: gray admin-panel CRUD. Lesson, permanently adopted: **agents need reference images and component-level visual acceptance criteria, not adjectives.** "Fun and professional" produces the Zune. "Match REF-3's item card anatomy" produces the iPad.

## 2. Design thesis

**Stardew Valley's warmth managing Bloomberg-terminal truth.** The player owns a castle; the app renders their real house as a living, clickable, slightly-glowing world. Numbers are exact, dates are real, sources are cited — but they arrive on parchment cards, item tooltips, and level-up moments instead of table rows. The signature element (the one memorable thing): **the cutaway isometric house that IS the navigation**, with maintenance health literally glowing on the rooms.

Reference DNA, ranked by the owner:
- **REF-1 (primary):** painterly cutaway house center-stage; floating room/item cards anchored to the art; left rail = checklist / summary / activity; game HUD top (score bar, level); bottom tab nav + prominent Add Item. Daylight warmth.
- **REF-3:** dark-mode pixel variant; floor tabs (1F/2F/Basement/Yard); hover-highlighted room; right-docked item card with photo, warranty badge, docs thumbnails; advisor quote block; serenity meter; four-up stat footer (upcoming, projects, health grade, spend).
- **REF-2:** council portraits with speech-bubble tips; phone-scale item card; ROI project card; value-over-time chart; documents vault as treasure chest.
- **REF-4:** map-pin markers over rooms; "UP NEXT" task rail; rebate alert card; area intel card; council lineup with specialties; footer utility strip (Prompt Pack / Export / Defense Mode).

## 3. The Game Shell (persistent frame — nothing renders outside it)

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP HUD: [🏰 CastleName ▾]  [Lv 12 ▓▓▓░ XP]  [♥ Serenity 87%]    │
│          [📅] [🔔•3] [⚙]                                          │
├──────────┬───────────────────────────────────────┬───────────────┤
│ LEFT RAIL│                                       │ CONTEXT DOCK  │
│ Dashboard│         THE HOUSE (iso view)          │ (slides in)   │
│ House    │   rooms from real dims · item         │ item card /   │
│ Inventory│   markers · health glow · floor tabs  │ room card /   │
│ Maintain │   click room→zoom · click item→card   │ task detail   │
│ Money    │                                       │               │
│ Protect  ├───────────────────────────────────────┤               │
│ Council  │ STAT FOOTER: Up Next · Serenity/Health│               │
│ PromptPk │ grade · This Month · Recent Activity  │               │
├──────────┴───────────────────────────────────────┴───────────────┤
│ BOTTOM QUICK BAR:  [＋ Add Item]  [📷 Walkthrough]  [🏆 Pool Room]│
└──────────────────────────────────────────────────────────────────┘
```

Rules: the context dock replaces navigation-to-detail-pages — selecting anything slides its card in from the right (REF-3 fridge panel), the house never disappears. The left rail collapses to icons. Mobile: rail becomes bottom tabs, dock becomes a bottom sheet.

## 4. Tokens

Two first-class themes. Art direction is shared; surfaces flip.

**Palette — "Hearthlight" (light, REF-1/REF-2):**
| Token | Hex | Use |
|---|---|---|
| `parchment` | `#F6EBD2` | card surfaces |
| `timber` | `#8A5A33` | frames, borders, nav accents |
| `hearth` | `#E4A33C` | primary actions, XP, highlights |
| `meadow` | `#5C8A4E` | success, serenity, paid-off, "ok" health |
| `slateblue`| `#3E5C76` | info, links, water/plumbing accents |
| `emberred` | `#C0503C` | overdue, warnings (used sparingly, deadpan) |
| `inkbrown` | `#3B2E25` | text |

**Palette — "Nightwatch" (dark, REF-3/REF-4):**
| Token | Hex | Use |
|---|---|---|
| `deepink` | `#141B2D` | app background |
| `stonewall` | `#232F47` | panels/cards |
| `lantern` | `#F0B441` | primary actions, level/XP gold |
| `serenity` | `#5FBF77` | health, success |
| `arcane` | `#8E6FD8` | progress bars, magic accents (REF-3 meter) |
| `torchred` | `#E06A4F` | overdue/warnings |
| `moonmist` | `#D9E1F2` | text |

**Type:** Display — a chunky rounded slab or pixel-adjacent face for HUD numerals, level, castle name (candidates: "Bungee", "Titan One", or a licensed pixel face; NEVER default sans for HUD). Body — humanist sans with warmth ("Nunito Sans" / "Inter" at heavier weights). Data — tabular-numeral mono for costs, serials, dims ("JetBrains Mono"). Sentence case everywhere; HUD labels small-caps.

**Shape & depth:** 12–16px radius cards; 2px timber/stonewall borders; soft drop shadows (game-card feel, not Material elevation). Panels may use a subtle parchment or canvas texture at ≤5% opacity — texture whispers, never shouts. Icons: chunky filled duotone (REF-1 style), one consistent set — no mixed icon families, no emoji-as-icons in production chrome.

**Motion:** one orchestrated moment per event — card slides in with a single ease-out; XP bar fills with a tick sound-free pulse; health glow breathes at 3s on due items. Respect `prefers-reduced-motion`. No scattered hover confetti.

## 5. The UI Kit (build FIRST, review at /kit before any feature re-homing)

| Component | Anatomy (source ref) |
|---|---|
| `HudBar` | castle name dropdown · level ring + XP bar · serenity heart-meter · date/weather slot · bell w/ badge (REF-1 top, REF-3 top) |
| `NavRail` | icon+label, active state = hearth/lantern pill, badge counts (REF-3 left) |
| `ItemCard` | photo/sprite header · make-model · serial (mono) · installed date + age · warranty pill (Active=meadow / Expiring=hearth / Expired=ember) · purchase price · maintenance next-due bar · docs thumbnail strip · View / Edit (REF-3 fridge — clone this anatomy exactly) |
| `RoomCard` | name · dims (mono) · paint chips w/ brand+code · flooring · item count (REF-1 floating cards) |
| `TaskCard` | title · due-in-N-days ring · difficulty wrenches · DIY vs pro cost · danger stripe for not-DIY (REF-1 checklist rows, upgraded) |
| `TaskRail` | "Up Next" stack, check animation, count badge (REF-4 right) |
| `AdvisorBubble` | pixel portrait · speech bubble tip · dismiss/save nugget (REF-2 council, REF-3 Merlin) |
| `StatPanel` | footer quads: upcoming / health grade (A– shield) / month spend mini-chart / recent activity (REF-3 bottom) |
| `SerenityMeter` | heart + % + green bar, "How's the serenity?" label (REF-3/4) |
| `LevelUpToast` | +XP pip → bar fill → level ring pulse |
| `QuestChip` | missing-data prompt: "Snap the serial label · +15 XP" |
| `VaultChest` | documents entry point w/ count (REF-2 treasure chest) |
| `AlertCard` | rebate/warning card w/ single CTA (REF-4 rebate) |
| `FloorTabs` | 1F / 2F / Basement / Yard segmented control (REF-3) |
| `ContextDock` | right slide-in panel hosting any card, ESC/swipe dismiss |
| `EmptyState` | every empty screen is an invitation: art + one verb button ("It's the vibe of it. Add your first item.") |

Every component ships light+dark, hover/focus-visible/disabled states, and a list-view text equivalent where it fronts house interactions (a11y law from the constitution).

## 6. Form Law — killing the field walls

- **Quick Add:** photo → name → room → category. Four inputs. Save immediately; the item exists.
- **Enrichment is a game loop, not a form:** the item card shows QuestChips for missing high-value fields (serial, install date, warranty, manual). Each completed chip = small XP. The Prompt Pack paste can fill dozens of fields at once — that's the power-user path and the onboarding path.
- **Never >6 visible inputs.** Longer sets become steppers with progress ("Room 2 of 5") or collapse behind "Add details".
- **Edit-in-place** on cards (click the value, change it) instead of edit pages.
- **Copy rules:** buttons say what happens ("Save item", "Send to Pool Room"); errors say what to fix ("Install date is after today — check the year"); no raw validator output ever reaches a human.

## 7. Gamification — only what's earned

| Mechanic | v1 | Meaning |
|---|---|---|
| XP + Castle Level | ✅ | Earned by cataloging, attaching docs, completing maintenance, finishing quests. Level gates nothing critical — it's pride, titles ("Level 12: Keeper of the Filters"), and cosmetic unlock hooks later. |
| Serenity | ✅ | Computed (overdue ratio, warranty coverage, docs completeness). The emotional headline stat. |
| Castle Health grade | ✅ | A–F shield on dashboard (REF-3). Same inputs as serenity, letter-graded. |
| Quests | ✅ | Missing-data chips + seasonal checklists framed as quest lines. |
| Coins/gems economy | ❌ v1 | BLUEPRINT socket only. Currency exists when the cosmetic shop (themes, house skins, advisor outfits) exists. A number that buys nothing is noise. |
| Streaks/guilt | ❌ ever | A home app that shames you gets deleted. Missed tasks just re-queue, deadpan. |

## 8. Art strategy (honest about the gap)

Procedural SVG cannot reach REF-1..4 quality, and that's fine for Phase 1.5: **layout fidelity now, art fidelity iteratively.** Path: (a) minimal iso renderer uses clean flat-shaded room slabs + simple item glyph markers from the token palette — readable, intentional, obviously v1; (b) owner generates a curated sprite/tile pack with image models against a written asset spec the agent produces (tile grid, dimensions, palette lock to §4, naming convention, transparent PNG); (c) sprites drop into the renderer as a pure asset swap — no code redesign. Log the asset spec + generation prompts under `assets/SPEC.md` as a HUMAN_DIRECTIONS socket.

## 9. Phase 1.5 acceptance gates

1. **Kit gate:** `/kit` route renders every §5 component, both themes, all states. Screenshot review by owner before feature re-homing. HARD STOP.
2. **House gate:** app opens to the house. Rooms drawn from real stored dims, floor tabs work, clicking an item marker opens its ItemCard in the ContextDock with real data. The condemned list/table navigation no longer exists as the primary path (list view remains as a11y twin).
3. **Form gate:** adding a real appliance = 4 inputs + photo, under 60 seconds. Grep-level check: no screen composes more than 6 simultaneous text inputs.
4. **Game-feel gate:** completing a task moves XP and serenity visibly; a QuestChip on a sparse item leads somewhere; the empty Pool Room says something worth screenshotting.
5. **Nothing regressed:** full Phase 1 data test suite still green — round-trip, lineage, ingestion fixtures — proving the reskin never touched truth.
6. **Self-critique artifact:** for each major screen, the agent logs its three-worse-than-reference findings and fixes in `docs/design-critique.md`. This file existing with real entries is itself a gate.

## 10. Standing law for all future phases

Every new feature ships as a game-shell citizen from birth: it gets a kit component, a dock card, an XP hook where honest, and a reference-image comparison in the critique log. There is no "we'll skin it later." Later never comes; that's how Zunes happen.

---

*"A castle without charm is just a well-documented cave." — Deco Dee*
