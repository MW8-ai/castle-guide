# Homeowner vision — living product direction

> Captured from owner feedback (2026-07). This is the north star for UI/UX after walkable rooms work. Not every line is shipped; **NOW** vs **NEXT** vs **LATER** marks intent.

## Product thesis

The house is always present. Navigation is layered glass over the home, not a different app. Data is Bloomberg-truth; presentation is warm and walkable. No guilt streaks. Fun is optional chrome, not the core loop.

## View modes (eventual)

| Mode | Role |
|------|------|
| **Game walk (NOW)** | Angled walkable house — what we are building |
| **Room cutaway** | Focus one room fully (dims, finishes, inventory) |
| **2D blueprint** | Boring, useful plan view; feet/inches or metric |
| **Floor filter** | 1F / 2F / basement / yard only |
| **Realistic 3D** | Interactive current/future — BLUEPRINT |
| **Designer / Edit Home** | Grid-lock, snap-to-parts, drag rooms, live dim readout |

## Shell & chrome (persistent)

- **Custom house name**, **address**, **year built** always visible
- **Shutoffs** in a nav strip that does not change per page
- **Bottom nav** aligned on every property page (Home, Inventory, Maintain, Money, …)
- **House stays visible** under Settings / Inventory / etc. (transparent glass overlays)
- **Draggable modules** (docks start on the right; owner can reposition)
- Mobile-first polish is a first-class future target

## Home health

- Score 0–100 from real overdue / warranty / catalog pressure
- **Color language:** full green / glow near 100 → warm mid → **red under 60** → **toxic under 40**
- Funny flavor text later; signal first

## Money chips (homeowner, not game coins)

- **Equity** (value − principal when known)
- **Repairs** — sum of open maintenance (DIY or pro estimate)
- **Build list** (not “wishlist”) — add-ons / projects / someday improvements, not repairs

## Up Next

- Filters + repairs look deliberate
- **Countdown bar** per task (visualize time-to-due)
- Link to part size / consumable when known (“16×25×1”)

## Council

- Characters talk in a **scrollable chat** about current room/state
- Owner can ignore or attend; never blocks work
- Later: product-aware quips, room-specific threads

## Notes

- **Per-room homeowner notes** change as you enter rooms
- Persist in property record; **exportable as collective `.md`**
- Collective view: all rooms’ notes in one markdown pack

## Walk & art

- Walls, doorways, realistic adjacency (not a bag of room tiles forever)
- **Grass, driveway, yard** — walk outside
- Click a room/place → **auto-travel** there
- Better person + simple **walk cycle**
- Props beyond bland cubes; cars read as cars (CR-V scale)
- Item cards: real product photo when known; **your photo** override

## Safety / play

- **Milestone saves** of house truth — one-click revert if a kid (or builder mode) wrecks layout
- Optional **kid / builder playground** mode separate from “source of truth”
- Designer mode: grid lock, snap, feet & inches / metric, inventory stays attached to room squares

## Assets pipeline (LATER)

- LLM-assisted batch of same-style 3D/game models (palette, scale, scope)
- Fridge etc. show real product imagery in the guide; user photo preferred when present

## Shipped in the 1.3 tranche (this pass)

- Health color scale (glow / red / toxic)
- Equity · repairs · build-list chips when data exists
- Up Next countdown bars + part hint when filter specs link
- Persistent identity strip (name, address, year, shutoffs)
- Glass shell: house backdrop under non-home pages + unified bottom nav
- Draggable context dock
- Per-room note editor + download collective `.md`
- Council chat scroller
- Click room → auto-walk; yard walkable; better avatar bob; bigger car prop

## Explicitly NEXT / LATER

- True wall graph + doorways + room cutaway mode
- Floor tabs + 2D blueprint renderer
- Edit Home designer + milestone snapshots
- Council product-aware memory
- Realistic 3D / photo-skinned inventory
- Mobile app shell polish
