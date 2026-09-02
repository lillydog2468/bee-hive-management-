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

- **Unused kit:** 20 deep boxes (12 on L-yard brood, **8 unused**), 20 shallow boxes. **5 spare metal lids** (12 owned: 7 on the L-yard full-size hives). **2 spare bottom boards** and **2 spare inner covers** — not auto-assigned onto hives. Frames: **50 deep used**; **50 waxed, ready for spring** and **50 unbuilt, ready for spring** (each a mix of deep and shallow — the split has not been given). Every other type starts at 0 owned.
- **Home yard:** Keith’s L-shaped drawing (top arm, downward arm on the right). Map glyphs: `|` / `||` / `|||` for nuc 1/2/3 boxes; empty square for large 1-box; nested squares for large 2-box. Along the L: three 3-box nucs, two 1-box larges, gap, three 2-box larges; down the right: 2-box nuc, two 2-box larges, two 3-box nucs. L-yard nucs are 4-frame. Metal lids on the seven full-size hives. Markers drag as the yard changes.
- **Above the garage:** 8 empty full-size pads and 2 empty nuc pads on the left. Each of those pads has its own bottom board and wooden lid. They stay on that site, even while the pads are empty, they do not appear in Unused, and they cannot be used on the L-yard or the far-side hive. No extra bottoms or lids are counted beyond those pads. No occupied hives.
- **Far side of the house:** one 5-frame nuc named Far side nuc, with two 5-frame nuc boxes (10 frames). No lid type is recorded.

Hive names are temporary and can be renamed. Marker positions on the aerials are a simple default you can drag; they are not surveyed positions.

## Unused kit

Unused = owned stock minus kit currently assigned to a hive stack. Garage pad bottoms and wooden lids are **not** unused stock: they belong to those pads only and cannot be put on the L-yard or the far-side hive.

Every hive needs a bottom board, an inner cover and a lid. The hive screen will not let you turn those off once assigned. Two spare bottoms and two spare inner covers sit in Unused; they are not auto-placed on the L-yard hives. Garage pad bottoms and wooden lids are **not** unused stock.

- Add or adjust owned stock by type.
- Assigning kit to a hive takes it out of unused.
- Taking kit off a hive, or removing the hive, returns it.
- If a hive already has kit that has not been added to stock (the far-side nuc boxes start this way; bottoms and inner covers do too), unused stays 0 for that type and the row notes a shortfall so you can add what you actually own.

You can add further types later. Built-in types: deep box, shallow box, 4-frame nuc box, 5-frame nuc box, deep used frames, waxed ready for spring, unbuilt ready for spring, shallow frames (awaiting the spring-lot split), bottom board, inner cover, metal lid, wooden lid, round feeder, feeding jar.

## Hives and stacks

Hives belong to a site. Every hive needs a bottom board, an inner cover and a lid — assign those from Unused; the stack screen will not let you turn them off once on. For the seven large L-yard hives the lid is metal. Map glyphs show nuc box count as lines and large 1-box vs 2-box as Keith drew. Nucs still need a lid type chosen.

L-yard hives and kit can all be moved. Move a hive between sites, including onto an empty garage pad — that pad’s bottom board and wooden lid stay on the pad and cannot be used anywhere else.

## Aerials

Each site has an editable map: drag markers, tap to open a hive, add or remove markers, and tweak the ground outline (the home yard starts as an L).

## Reset

More → Reset to starting point replaces this browser’s saved data with the seed above.
