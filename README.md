# Hives

A phone-friendly tracker for Keith Dudman’s Langstroth kit and hives. The point of the app is to know which equipment is **not** on a hive.

Working title: Hives (rename it under More).

## Run locally

```bash
npm install
npm run dev
```

Open the address Vite prints, usually `http://localhost:5173`. Use it in a phone browser, or narrow the desktop window.

Other commands:

```bash
npm test        # unused-kit accounting tests
npm run build   # production build
npm run preview # serve the production build
```

There is no login and no server. Everything is stored in this browser’s `localStorage`.

## Starting point

The first visit seeds only what was given:

- **Unused kit:** 20 deep boxes and 20 shallow boxes. **5 spare metal lids** (12 owned: 7 on the L-yard full-size hives, 5 unused). Frames by condition: 50 deep used, 50 waxed ready for spring, 50 unbuilt ready for spring — the last two are not assumed deep or shallow. Shallow frames have no count given (0). Spare bottom boards and inner covers have no count given (owned 0). Every other type starts at 0 owned.
- **Home yard:** L-shaped aerial with 7 full-size hives (Yard 1–7) and 6 four-frame nucs (Yard nuc 1–6). Hives and kit can be moved around — nothing is glued to a pad. Each full-size hive has a bottom board, an inner cover and a metal lid. Each nuc has a bottom board and an inner cover; lid type is not recorded, so you choose metal or wooden in the hive screen. Brood and supers are not set, so the 20+20 boxes stay unused.
- **Above the garage:** 8 empty full-size pads and 2 empty nuc pads on the left. Each of those pads has its own bottom board and wooden lid. They stay on that site, even while the pads are empty, they do not appear in Unused, and they cannot be used on the L-yard or the far-side hive. No extra bottoms or lids are counted beyond those pads. No occupied hives.
- **Far side of the house:** one 5-frame nuc named Far side nuc, with a bottom board, an inner cover, and two 5-frame nuc boxes (10 frames). No lid type is recorded.

Hive names are temporary and can be renamed. Marker positions on the aerials are a simple default you can drag; they are not surveyed positions.

## Unused kit

Unused = owned stock minus kit currently assigned to a hive stack. Garage pad bottoms and wooden lids are **not** unused stock: they belong to those pads only and cannot be put on the L-yard or the far-side hive.

Every hive needs a bottom board, an inner cover and a lid. Those in-use pieces are counted on the hive. Spare bottoms and inner covers stay at owned 0 until a count is given, so Unused may show a shortfall rather than inventing stock.

- Add or adjust owned stock by type.
- Assigning kit to a hive takes it out of unused.
- Taking kit off a hive, or removing the hive, returns it.
- If a hive already has kit that has not been added to stock (the far-side nuc boxes start this way; bottoms and inner covers do too), unused stays 0 for that type and the row notes a shortfall so you can add what you actually own.

You can add further types later. Built-in types: deep box, shallow box, 4-frame nuc box, 5-frame nuc box, deep used frames, waxed ready for spring, unbuilt ready for spring, shallow frames, bottom board, inner cover, metal lid, wooden lid, round feeder, feeding jar.

## Hives and stacks

Hives belong to a site. Every hive always has a bottom board, an inner cover and a lid — the stack screen will not let you turn those off. For the seven large L-yard hives the lid is metal. Nucs still need a lid type chosen. On a full-size hive you can set 1 or 2 deep brood chambers, add or remove shallow honey supers, and turn on summer feeding (empty box + round feeder or jar + extra body). Nucs count nuc boxes.

L-yard hives and kit can all be moved. Move a hive between sites, including onto an empty garage pad — that pad’s bottom board and wooden lid stay on the pad and cannot be used anywhere else.

## Aerials

Each site has an editable map: drag markers, tap to open a hive, add or remove markers, and tweak the ground outline (the home yard starts as an L).

## Reset

More → Reset to starting point replaces this browser’s saved data with the seed above.
