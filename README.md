# Hives

A phone-friendly tracker for Keith Dudman’s Langstroth kit and hives. The point of the app is to know which equipment is **not** on a hive.

Working title: Hives (rename it under More).

## Use it in a browser

Open **https://lillydog2468.github.io/bee-hive-management-/** on a phone or laptop. There is no login. Data stays in that browser’s `localStorage`.

## Run locally

```bash
npm install
npm run dev
```

The app is built for GitHub Pages, so Vite serves it at `/bee-hive-management-/`. Open the address Vite prints, usually `http://localhost:5173/bee-hive-management-/`. Use it in a phone browser, or narrow the desktop window.

Other commands:

```bash
npm test        # unused-kit accounting tests
npm run build   # production build
npm run preview # serve the production build
```

There is no login and no server. Everything is stored in this browser’s `localStorage`.

## Starting point

The first visit seeds the facts we have. Exact inventory counts are not important yet — types Keith has not counted start at **0**, and he can type a real number later.

- **Unused kit:** 20 deep boxes (12 on L-yard brood, **8 unused**), 20 shallow boxes. **5 spare metal lids** (12 owned: 7 on the L-yard full-size hives). **2 spare bottom boards** and **2 spare inner covers** — not auto-assigned onto hives. Frames: **50 deep used**; **50 new waxed, ready for spring** (some deep and some shallow, one lot of 50, no invented split); **50 unbuilt, ready for spring** (still a mix, more detail pending, no invented split). Every other type starts at 0 owned.
- **Home yard:** Keith’s L-shaped drawing (top arm, downward arm on the right). Map glyphs: `|` / `||` / `|||` for nuc 1/2/3 boxes; empty square for large 1-box; nested squares for large 2-box. Along the L: three 3-box nucs, two 1-box larges, gap, three 2-box larges; down the right: 2-box nuc, two 2-box larges, two 3-box nucs. L-yard nucs are 4-frame. Metal lids on the seven full-size hives. Markers drag as the yard changes.
- **Above the garage:** 8 empty full-size pads and 2 empty nuc pads on the left. Each of those pads has its own bottom board and wooden lid. They stay on that site, even while the pads are empty, they do not appear in Unused, and they cannot be used on the L-yard or the far-side hive. No extra bottoms or lids are counted beyond those pads. No occupied hives.
- **Far side of the house:** one 5-frame nuc named Far side nuc, with two 5-frame nuc boxes (10 frames). No lid type is recorded.

Hive names are temporary and can be renamed. Marker positions on the aerials are a simple default you can drag; they are not surveyed positions.

## Unused kit

Unused = owned stock minus kit currently assigned to a hive stack. Garage pad bottoms and wooden lids are **not** unused stock: they belong to those pads only and cannot be put on the L-yard or the far-side hive.

Every hive needs a bottom board, an inner cover and a lid. The hive screen will not let you turn those off once assigned. Two spare bottoms and two spare inner covers sit in Unused; they are not auto-placed on the L-yard hives. Garage pad bottoms and wooden lids are **not** unused stock.

- Add or adjust owned stock by type (stepper or type a number). 0 means not counted yet.
- Add a type from each Unused section (hive boxes / frames / tops and bottoms / other): name, owned count, optional photo. Delete any type, including the starter set. Drag the handle beside a type to reorder it within that section (saved in this browser).
- Assigning kit to a hive takes it out of unused.
- Taking kit off a hive, or removing the hive, returns it.
- Kit already on hives with owned still 0 (the 4-frame and 5-frame nuc boxes start this way) is **not counted yet**, not a blocker. Tap the row and type a number when you have one.
- If a type is on hive stacks, delete asks to take those pieces off first. That does not invent extra unused stock.

Starter types (all deletable): deep box, shallow box, 4-frame nuc box, 5-frame nuc box, deep used frames, waxed ready for spring (mixed, no subtype counts), unbuilt ready for spring (mix pending more detail), shallow frames (not a split of the spring lots), bottom board, inner cover, metal lid, wooden lid. Unused and Stock only show types in your list.

## Hives and stacks

Hives belong to a site. Every hive needs a bottom board, an inner cover and a lid — assign those from Unused; the stack screen will not let you turn them off once on. For the seven large L-yard hives the lid is metal. Map glyphs show nuc box count as lines and large 1-box vs 2-box as Keith drew. Nucs still need a lid type chosen.

L-yard hives and kit can all be moved. Move a hive between sites, including onto an empty garage pad — that pad’s bottom board and wooden lid stay on the pad and cannot be used anywhere else.

## Aerials

Each site has an editable map: drag markers, tap to open a hive, add or remove markers, and tweak the ground outline (the home yard starts as an L).

## Reset

More → Reset to starting point replaces this browser’s saved data with the seed above.
