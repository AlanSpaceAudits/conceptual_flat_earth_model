# Serial change log

Every task is assigned a serial `SNNN` and appended below so changes can be
referenced, confirmed, or reverted individually later.

Format per entry:
- **Serial** — short title
- **Date** (UTC if known)
- **Files changed**
- **Purpose**
- **Notes** (reversibility, dependencies, caveats)

---

## S000 — Baseline / reset point

- **Date:** 2026-04-22
- **Files changed:** n/a (reference snapshot)
- **Purpose:** Fixed reference point in place before the serial system was
  introduced. Captures the working state at the time S001 began:
  - Canonical coordinate shell (`js/core/canonical.js`) as the single
    source of truth for overlay (lat, lon) → disc positions.
  - `LatitudeLines`, `DiscGrid`, `GroundPoint`, and renderer frame /
    track logic consume the canonical shell, not `projection.project`.
  - `projection.project` now called only by `js/render/earthMap.js`
    (the underlay builder).
  - `blank` projection available (black disc, no features).
  - `LongitudeRing` on the FE disc rim — 10° minor / 30° major ticks,
    labels every 30°, anchored at 180° and running clockwise. Hidden
    in Optical-vault mode, visible in Heavenly.
  - `ObserversOpticalVault` carries an observer-relative azimuth ring
    (15° major / 5° minor, numeric labels every 15°) + N/E/S/W
    cardinals on the same radius, plus a 15° × 15° alt/az hemisphere
    wireframe.
  - Heading arrow shrunk + yellow heading ray from observer to edge.
  - Nudge buttons (±1°, ±1', ±1") on `ObserverHeading`; Figure select
    at the top of the Observer group.
  - Heavenly ↔ Optical orientation persistence working as expected.
- **Notes:** State reference, not a code commit. Future serials that
  need to "revert to baseline" are reverting to this configuration of
  features.

## S001 — Optical Vault DMS zoom scale

- **Date:** 2026-04-22
- **Files changed:**
  - `change_log_serials.md` (created)
  - `js/core/app.js`
  - `js/ui/mouseHandler.js`
  - `js/render/scene.js`
  - `js/render/worldObjects.js`
- **Purpose:** Make mousewheel zoom in Optical Vault a true angular
  inspection tool. Wheel narrows the first-person `camera.fov`
  (`fov = 75° / Zoom`, clamped), and a new refined tick / label
  overlay on `ObserversOpticalVault` rebuilds at a cadence matched to
  the visible FOV:

  | FOV range   | Major | Minor | Label    | Format     |
  |-------------|-------|-------|----------|------------|
  | ≥ 30°       | coarse 15° ring only (this overlay empty)           |
  | ≥ 8°        | 5°    | 1°    | 5°       | DD°        |
  | ≥ 2°        | 1°    | 5'    | 1°       | DD°        |
  | ≥ 0.5°      | 10'   | 1'    | 10'      | DD° MM'    |
  | ≥ 0.1°      | 1'    | 6"    | 1'       | DD° MM'    |
  | ≥ 0.02°     | 10"   | 1"    | 10"      | DD° MM' SS" |
  | < 0.02°     | 1"    | 0.1"  | 1"       | DD° MM' SS" |

  Tick positions come from the canonical compass-azimuth axis
  (0° = local N, clockwise). What's under the camera centre is
  `ObserverHeading` at every zoom level — Optical ↔ Heavenly
  orientation persistence is preserved by construction.
- **Notes:**
  - `Zoom` clamp raised from 100 → 1e6 in `app.js` so arcminute /
    arcsecond cadences are reachable by wheel.
  - Optical mousewheel uses a larger factor (1.35 per notch) than
    orbit (1.1) so the DMS regime is a few dozen clicks away, not
    thousands. Orbit wheel behaviour unchanged.
  - Refined ticks / labels are emitted only within `heading ±
    0.7 · FOV` so arcsecond cadence never builds more than ~200 ticks
    per frame. Position buffer is pre-allocated (512 segments); label
    sprites live in a 24-slot pool whose canvas textures are repainted
    in place rather than reallocated.
  - When the refined overlay is active (FOV < 30°), the coarse
    observer azimuth ring is hidden in Optical to prevent overlap;
    Heavenly always shows the coarse ring.
  - Revert path: reverting S001 means undoing the four JS edits
    above; the log entry here stays as a record.

## S002 — Optical Vault zoom step persistence + mode-safe zoom

- **Date:** 2026-04-22
- **Files changed:**
  - `change_log_serials.md` (this entry)
  - `js/core/app.js`
  - `js/ui/mouseHandler.js`
  - `js/render/scene.js`
  - `js/render/worldObjects.js`
  - `js/main.js`
  - `js/ui/urlState.js`
- **Purpose:**
  - Split camera zoom state by mode: new `OpticalZoom` (default
    `5.09`, clamp `[0.2, 1e6]`) drives the first-person FOV; the
    original `Zoom` (clamp restored to `[0.1, 10]`) drives the
    Heavenly orbit camera only. Mode switches can no longer leak a
    tiny-FOV Optical zoom into Heavenly — the orbit view always reads
    its own field.
  - Optical mousewheel is now **unit-stepped**, not multiplicative.
    One wheel notch shifts FOV by the minor-tick width of the current
    cadence (1° in degree regime, 1' in arcminute regime, 1" in
    arcsecond regime). Cadence thresholds remain the S001 table.
    Table is duplicated between `mouseHandler.js`
    (`opticalCadenceStepDeg`) and `worldObjects.js`
    (`refinedAzCadenceForFov`) — a S003 cleanup could fold them into
    one module.
  - On entering Optical Vault (`InsideVault: false → true`), main.js
    snaps `OpticalZoom` to `5.09`. Exiting Optical doesn't touch
    `Zoom`, so Heavenly re-opens at whatever orbit zoom it was at.
  - Visible "Step: X°/'/\"" HUD chip in the top-right of the view
    in Optical mode, showing the active cadence and the current FOV.
  - `OpticalZoom` is persisted in the URL hash alongside `Zoom`.
- **Notes:**
  - Heading / cardinal / alt-az-grid / refined DMS overlay math
    unchanged — only the Zoom field they read is now mode-local.
  - Legacy URL hashes that set `Zoom` still work; the orbit camera
    picks them up, the Optical camera uses its own `OpticalZoom`
    defaulted to `5.09`.
  - Revert path: drop S002's edits per file. Removing the split
    reinstates the single-`Zoom` behavior; the mode-blowout will
    return.

## S003 — DMS label density / font scaling cleanup in Optical Vault

- **Date:** 2026-04-22
- **Files changed:**
  - `change_log_serials.md` (this entry)
  - `js/render/worldObjects.js`
- **Purpose:**
  Kill the fine-scale label overlap without removing the DMS
  zoom system. Two knobs were adjusted:

  1. **`labelEvery` decoupled from `major`** in
     `refinedAzCadenceForFov`. Ticks stay at their old cadence
     (precision unchanged); labels now sit on a visibly-sparser
     stride. New stride table:

     | FOV      | Tick minor | Tick major | Label every |
     |----------|-----------|-----------|-------------|
     | ≥ 8°     | 1°        | 5°        | 5°          |
     | ≥ 2°     | 5'        | 1°        | 1°          |
     | ≥ 0.5°   | 1'        | 10'       | 10'         |
     | ≥ 0.1°   | 6"        | 1'        | 5' *(was 1')* |
     | ≥ 0.02°  | 1"        | 10"       | 30" *(was 10")* |
     | < 0.02°  | 0.1"      | 1"        | 5" *(was 1")* |

  2. **Label font scales with the available arc-budget between
     adjacent labels**, not with a fixed format-based pick. Each
     sprite's world width is capped at 55 % of the arc between two
     successive labels on the 1.14-radius ring; height is derived
     from the sprite's own canvas aspect, so long strings like
     `123° 45' 06"` shrink more than short strings like `30°`.
     Clamped to `[0.028, 0.085]` world units so arcsecond labels
     stay readable and degree labels don't balloon.
- **Notes:**
  - Tick density is unchanged — only label *stride* and *size* adapt.
    Pointing still lands on the correct angle at every zoom level.
  - All S001 / S002 mechanisms (canonical frame, `OpticalZoom` vs
    `Zoom` split, unit-stepped wheel, cadence HUD chip, persistence)
    are untouched. This change only edits two blocks inside
    `ObserversOpticalVault`.
  - Label-pool count (24) was not raised; the sparser `labelEvery`
    keeps the visible label count well under that even at arcsecond
    cadence.
  - Revert path: restore the previous `labelEvery` values in
    `refinedAzCadenceForFov` and the fixed-height format-based
    sprite sizing in `_updateRefinedScale`.

## S004 — True DMS notation + refined longitudinal grid subdivision

- **Date:** 2026-04-22
- **Files changed:**
  - `change_log_serials.md` (this entry)
  - `js/render/worldObjects.js`
- **Purpose:**
  Make the Optical Vault a genuine angular inspection system by
  subdividing the **grid itself** at finer FOVs — not just the labels.
  Two changes:

  1. **Cadence table expanded.** `refinedAzCadenceForFov` now returns
     five fields per regime:

     | Field      | Meaning                                |
     |------------|----------------------------------------|
     | `majorArc` | primary meridian stride (deg)          |
     | `minorArc` | secondary meridian stride (deg)        |
     | `major`    | major horizon-rim tick stride (deg)    |
     | `minor`    | minor horizon-rim tick stride (deg)    |
     | `labelEvery` | numeric label stride (deg)           |
     | `fmt`      | label format: deg / degmin / degminsec |

     DMS format transition threshold moved from FOV=0.5° to FOV=2°
     so `DD° MM'` notation appears at the same FOV the grid first
     subdivides into arcminute structure. `DD° MM' SS"` appears at
     FOV ≤ 0.02° alongside arcsecond arcs.

  2. **New `refinedMeridiansGroup` in `ObserversOpticalVault`.**
     Two pre-allocated `LineSegments` buffers (majors and minors),
     each arc tessellated into 16 segments from horizon to zenith.
     Per frame, when the refined overlay is active:
     - Emit major meridians every `majorArc` degrees inside
       `heading ± (0.7·FOV + majorArc)`.
     - Emit minor meridians every `minorArc` degrees in the same
       window, skipping positions that coincide with a major.
     - Buffers sized for ~800 major + ~2400 minor arcs at worst
       case; `setDrawRange` clips to actual count.
     - Group scaled by `(r, r, h)` per frame to match the static
       hemisphere wire, so arcs sit exactly on the optical vault.
     - Visible only in Optical + when the coarse overlay is active
       (FOV < 30°); hidden otherwise so Heavenly stays clean.

     Material colours: majors `#a0b0c0` opacity 0.85, minors
     `#7a8499` opacity 0.45 — a visible hierarchy without drowning
     out the existing 15° wire or the refined horizon ticks.
- **Notes:**
  - Tick density (S001) and label density (S003) are untouched —
    only the grid-line layer is new. Horizon ticks and labels
    remain exactly where S003 placed them.
  - The static `this.wire` hemisphere (15° × 15°) stays visible at
    every FOV. Refined meridians stack on top at finer cadences;
    because wire meridians fall on multiples of 15°, they coincide
    with refined majors and the visual blends cleanly.
  - Arcsecond-regime rendering cost: up to ~2400 minor arcs × 16
    segments ≈ 38 400 segments worst case. Acceptable at 60 FPS
    because the refined overlay is cached by (fov, heading-bucket)
    — it only rebuilds on camera / heading change, not per frame.
  - S002 `OpticalZoom` vs `Zoom` split, S003 label sizing, cadence
    HUD chip, `ObserverHeading` persistence: all intact.
  - Revert path: drop the `majorArc` / `minorArc` fields from the
    cadence table, remove `refinedMeridiansGroup` plus its buffers,
    and drop the emission block in `_updateRefinedScale`.

## S005 — Aggressive fine-scale label size reduction in Optical Vault

- **Date:** 2026-04-22
- **Files changed:**
  - `change_log_serials.md` (this entry)
  - `js/render/worldObjects.js`
- **Purpose:**
  Fix the remaining issue from S003: at fine cadences (arcminute,
  arcsecond) labels were still visually huge. Root cause was the
  absolute `MIN_LABEL_HEIGHT = 0.028` world-unit floor in the S003
  sizer. The sizer computed a sensible natural height from the
  label-arc budget (≈ 2×10⁻⁵ world units at arcsecond cadence) but
  then floored it back up to 0.028 — ≈ 1400× too large at fine FOV,
  so labels filled a third of the screen.

  New sizer uses an **explicit screen-fraction target per cadence
  regime**:

  | Format      | Screen height target |
  |-------------|----------------------|
  | `deg`       | 8 %                  |
  | `degmin`    | 5 %                  |
  | `degminsec` | 3 %                  |

  Converted to world height via `targetFrac · ringR · FOV_rad`. Final
  height = `min(h_arc_budget, h_screen_target)` so the arc-budget
  still prevents overlap (its job since S003), while the screen-
  fraction target keeps labels visually consistent across zoom. A
  tiny 1e-6 hard-floor remains only to prevent genuinely zero-sized
  sprites.
- **Notes:**
  - Coarse regimes are essentially unchanged — the arc-budget cap
    still wins there, so `deg` labels look the same as they did
    after S003.
  - Fine regimes shrink aggressively: at FOV=0.5° a `degmin` label
    is ~5% of screen (was ~47% after S003's floor), at FOV=0.02° a
    `degminsec` label is ~3% of screen (was dominant before).
  - Everything the prior serials built — S001 refined tick scale,
    S002 mode-local `OpticalZoom`, S002 unit-stepped wheel + cadence
    chip, S003 arc-budget overlap prevention, S004 refined meridian
    grid — is untouched.
  - Revert path: restore the S003 sizer block (fixed MAX/MIN clamps,
    `widthBudget / aspect` with no screen-target).

## S006 — Degree-layer lock, compact cardinals, clean 1° labels, and connected ground-to-sky directional guide

- **Date:** 2026-04-23 (revised)
- **Files changed:**
  - `change_log_serials.md` (this entry)
  - `js/core/app.js`
  - `js/ui/mouseHandler.js`
  - `js/render/worldObjects.js`
  - `js/main.js`
- **Purpose:** Make the Optical Vault a clean, stable **individual-
  degree** inspection mode. The earlier S006 draft chased arcminute /
  arcsecond precision; this revised scope narrows to a single
  well-behaved degree layer and merges in the directional-cue cleanup:

  1. **Hard lock at the individual-degree layer.** `OpticalZoom` clamp
     `[0.2, 7500] → [0.2, 75]` in `app.js`; `FP_ZOOM_MAX = 75` in
     `mouseHandler.js`. `fov_min = 75° / 75 = 1°` — one whole degree
     across the screen, the finest the refined grid knows how to draw.
     The wheel can't push past that. Sub-degree cadence layers are
     removed from this serial; a later serial can add them back if
     needed with their own zoom cap.

  2. **Single degree-layer cadence.** `refinedAzCadenceForFov` now
     returns either `null` (FOV ≥ 30°, coarse 15° wire handles it) or a
     degree-layer record with `majorArc: 1°`, `minorArc: 1°`, `fmt:
     'deg'`, and adaptive `labelEvery` (5° at FOV ≥ 8°, 1° below).
     `minorArc` is kept equal to `majorArc` so the emit-minor loop
     skips every position (each coincides with a major); this preserves
     the existing loop shape while dropping sub-degree ticks entirely.
     The dead `minute` / `second` branches from the pre-revision S006
     are removed.

  3. **Clean degree-label rendering.** `formatAzimuthLabel` collapses
     to `(Math.round(a) % 360) + '°'`. The `% 360` avoids the
     `Math.round(359.7) = 360` edge case where a wrap-around label
     would produce `"360°"` on top of the `"0°"` label at the same
     screen position. The `degmin` / `degminsec` formatter branches
     are removed (unreachable in this scope).

  4. **Active highlighted meridian (kept).** `refinedActiveMeridian`
     `LineSegments` still draws one arc at
     `round(ObserverHeading / cad.majorArc) * cad.majorArc` in
     `#ffd24a` at `renderOrder 62`. With `cad.majorArc = 1°` the
     highlight snaps to the nearest whole-degree meridian as the user
     rotates — the behaviour that was already working is preserved.

  5. **Compact directional arrow, flat on the horizon plane.**
     `arrowShape` shrunk from tip `-0.12` to tip `-0.035` (~3.5×
     smaller); body proportionally narrowed. `this._arrowTipX` exposes
     the tip x-coordinate for the ground line. Arrow's local
     `position.z` lowered from `0.012` to `0` so the triangle lies
     flat on the horizon plane, coincident with the start of the
     ground-line segment and the active meridian arc's base. Both
     overlays run with `depthTest: false`, so there's no z-fight with
     the disc beneath.

  6. **Connected ground-to-sky directional guide.** `headingLine` now
     reads as a single geometric path:
     - **Ground segment** — runs from the arrow tip (`-arrowTipX · r`
       along the guide direction) to the horizon foot at radius `r`,
       both endpoints at z = 0. Previously the line's z was fixed at
       `0.018` absolute (floating above the arrow tip at `0.012 · r`
       and above the arc base at `0`), and its end radius was `1.08 r`
       (eight percent past the horizon foot). Both gaps are closed.
     - **Guide direction** — matches the heading arrow (`ObserverHeading`)
       when the refined overlay is inactive (coarse view, arrow
       visible, no arc to meet); snaps to the active-meridian azimuth
       (`this._refinedActiveAz`, i.e. `round(heading/majorArc) · majorArc`)
       when the refined overlay is active so the ground line's end
       meets the arc's base exactly in both xy and z. The up-to-0.5°
       azimuthal offset at the arrow tip (between the arrow's heading
       direction and the snapped ground line) is invisible at the
       arrow's tiny radius (`0.035 r`) and the arrow is fading out
       at that zoom anyway.
     - **Sky segment** — the existing `refinedActiveMeridian` arc,
       sharing colour `#ffd24a`, continues upward from the same
       horizon foot (radius `r`, z = 0) to zenith. Untouched.
     - **Heavenly mode** — preserved: line uses the closed-form
       disc-rim intersection `t(h) = r_obs·cos(h) + √(1 − r_obs²·sin²(h))`,
       z stays at `0.018`, and the tip offset collapses to `0`
       (arrow starts at observer origin there as before).

  7. **Arrow fades at the degree layer.** In Optical,
     `headingArrow.material.opacity = 0.85 · smoothstep(fov, 8, 30)`
     — full opacity at FOV ≥ 30° (coarse view, small but visible),
     linear ramp down to 0 at FOV ≤ 8° (inside the refined 1° regime).
     Once the user has zoomed to degree inspection, the arrow is gone
     and the connected ground+arc path is the sole directional
     indicator. Heavenly leaves the arrow at its default opacity.

  8. **Compact on-meridian cardinals.** N / E / S / W store
     `baseDir` unit vectors; `update()` re-homes them each frame between
     the coarse presentation (radius 1.14, scale 0.10 — the floating
     header style) and the refined presentation (radius 1.00, scale
     0.04 — a compact letter sitting right on the cardinal meridian
     ray). Switch triggered by `_refinedActive`.

  9. **HUD chip simplified.** `#cadence-chip` now reads
     `Step: 15°/1°  ·  FOV N.N°  ·  Facing NNN.N°`. The DMS `formatFacingDms`
     and `facingFmtForFov` helpers are removed.
- **Notes:**
  - Preserved: S002 mode-local `OpticalZoom` vs `Zoom` split, the
    unit-stepped Optical wheel, cadence HUD chip framework, S003/S005
    label screen-fraction sizer, S004 refined meridian grid (white
    majors 0.7 / white minors 0.3), the active-meridian highlight, the
    cardinal `#ff6868` / `#7fe39a` colour palette, URL persistence,
    and Heavenly ↔ Optical orientation persistence.
  - `opticalCadenceStepDeg` simplified to two regimes: 5° per notch
    at FOV ≥ 30° (so FOV 75° → 30° takes 9 clicks, not 45) and 1° per
    notch refined. Matches the simplified cadence function.
  - Revert path: restore `FP_ZOOM_MAX = 7500` and the `Clamp(..., 0.2,
    7500)` in `app.js`; re-expand `refinedAzCadenceForFov` to the
    three-layer table with minute/second branches; restore the DMS
    formatter branches in `formatAzimuthLabel`; restore the original
    `arrowShape` (`-0.12` tip) and `headingArrow.position.z = 0.012`;
    restore the pre-revision `headingLine` (origin-anchored, `1.08 r`
    end, `z = 0.018`, heading-only direction); drop the arrow-fade
    block and the per-frame cardinal re-home block in `update()`;
    restore the pre-revision S006 cadence chip + DMS Facing formatter
    in `main.js`.

### S006a — refinement (2026-04-23)

Further refinement of S006 (still the same serial, not S007):

  10. **Direct 15° → 1° cadence, no intermediate 5° layer.**
      `refinedAzCadenceForFov` no longer returns `labelEvery: 5` at
      mid-FOV. The function now has exactly two outcomes: `null` (FOV
      ≥ 30°, coarse wire handles) or `{labelEvery: 1, majorArc: 1}`.
      The user found the mid-FOV band visually unstable — extra stray
      `°` glyphs, duplicated `0°` labels at positions that should
      read `17° / 18°` — and asked for it to be skipped entirely.

  11. **Refined label pool bumped 24 → 64.** With `labelEvery = 1°` at
      FOV approaching 30°, the emission window (`heading ± (0.7·fov +
      majorArc)`) can produce up to ~43 labels. The old 24-slot pool
      would hit the `if (labelI >= pool.length) break;` cap and lose
      the outer labels. 64 covers FOV up to ~45° at 1° cadence.

  12. **Clean texture re-upload in `repaintTextSprite`.** The previous
      implementation resized `canvas.width` / `canvas.height` in place
      and flagged the existing `CanvasTexture` with `needsUpdate =
      true`. Some browsers / driver paths skip the GPU re-upload when
      a texture's backing canvas is resized, which was the root cause
      of the stale-glyph / ghost-`°` / duplicate-`0°` artefacts. Fix:
      after the redraw, dispose the old `sprite.material.map` and
      install a brand-new `CanvasTexture` wrapping the same canvas.
      three.js treats it as new and uploads fresh pixels.

  13. **Skip-if-same-text guard.** `repaintTextSprite` now short-circuits
      when `userData.lastText === text` (and same colour). The pool
      is re-emitted on every cache miss; most cache misses don't
      actually change any label text (heading crossed a degree but
      the visible window still contains the same integers). Avoids
      64 sprite-texture churn per rotation step.

  14. **Init + invalidate the refined cache on state transitions.**
      Constructor now sets `this._refinedActive = false` and
      `this._refinedActiveAz = null` so the first frame sees a clean
      transition edge. `_updateRefinedScale` clears `this._refineKey`
      in both directions (refined ↔ inactive). The first refined frame
      after entering Optical always misses the cache and fully rebuilds
      ticks, labels, and — critically — the active-meridian arc. This
      fixes the "line not going up into the sky on entry" report:
      the sky arc was technically emitted but a stale cache key could
      cause the rebuild to be skipped, leaving the arc's draw range
      at `(0, 0)`.

  15. **FOV-scaled cardinals.** The refined-mode cardinal height was a
      fixed world value (`0.04`). At a fixed world size, the
      subtended on-screen angle scales with `1 / FOV`: a 0.04-unit
      sprite at distance 1 reads as ~15 % of the view at FOV 14.7°
      but ~230 % of the view at FOV 1° (the user's image showed an `N`
      that filled almost the entire tight-zoom view). Refined cardinal
      height is now `min(0.10, 0.12 · fovRad)` — the same screen-
      fraction approach the S005 label sizer uses, with a target
      fraction 0.12 (slightly larger than the degree labels' 0.08 so
      N / E / S / W stay a touch more prominent). Upper clamp of
      `0.10` matches the coarse-mode height so the just-entered
      refined regime doesn't balloon larger than the coarse look.
      Coarse-mode cardinals (`cardR = 1.14`, `cardH = 0.10`) are
      unchanged.

  16. **Sky arc consistency on spawn.** Verified that the
      S006a cache-invalidation already covers the spawn path:
      `_refinedActive` is constructor-initialised to `false`, so the
      first `_updateRefinedScale` call after entering Optical always
      hits the activation-edge invalidation, nulls `_refineKey`, and
      forces a full rebuild of ticks + meridian arcs + labels — the
      active-meridian arc buffer is always re-emitted on frame 1.
      The remaining "arc feels smaller on entry than when zoomed in"
      effect is camera-perspective, not emission: the same 0°–90° arc
      is magnified by `1 / FOV`, so at wide FOV only the bottom few
      degrees of the arc occupy the visible vertical band. Pitching
      up reveals the rest of the arc at any zoom level; no code fix
      is applicable without refactoring line-thickness (WebGL
      `LineBasicMaterial.linewidth` is clamped to 1 in browsers).
      The cardinal FOV-scale fix (purpose 15) indirectly improves
      the perceived visibility of the spawn-frame arc because the
      N / E / S / W sprites no longer obstruct it.
- **Revert S006a only**: in `refinedAzCadenceForFov` restore the
  `labelEvery: fov ≥ 8 ? 5 : 1` expression; restore
  `REFINED_MAX_LABELS = 24`; restore `repaintTextSprite` to the
  in-place canvas resize + `needsUpdate = true` version (without the
  lastText guard and without dispose/rebuild); remove the
  `_refinedActive` / `_refinedActiveAz` initialisers and the two
  `this._refineKey = null` transition-invalidation lines; revert the
  refined-mode cardinal height to the fixed `cardH = 0.04` (drop the
  `cFov` / `cFovRad` block in the `update()` cardinal-position loop).

### S006b — refinement (2026-04-23)

Further refinement on top of S006a (same serial, no S007):

  17. **Restored the 5° middle cadence layer.** `refinedAzCadenceForFov`
      is now three-tiered: `null` (FOV ≥ 30°, coarse), 5° grid + 5°
      labels (8° ≤ FOV < 30°), 1° grid + 1° labels (FOV < 8°). The
      S006a texture-rebuild fix makes the 5° band visually clean, so
      the user can step through 15° → 5° → 1° inspection layers
      instead of jumping straight to 1° at any zoom-in. `majorArc =
      minorArc` in both refined layers, so the emit-minor loop still
      skips every position and draws nothing redundant.

  18. **Wheel step + HUD chip match the new ladder.**
      `opticalCadenceStepDeg` in `mouseHandler.js`: 5° per notch at
      FOV ≥ 8°, 1° per notch below. `activeCadenceLabel` in `main.js`
      prints `'15°' / '5°' / '1°'`.

  19. **Cardinals halved across the board in Optical.** Coarse
      `cardH = 0.10 → 0.05` (sprite height). Refined screen-fraction
      target `0.12 · fovRad → 0.06 · fovRad` with upper clamp `0.10 →
      0.05`. N / E / S / W now read as compact anchors at every
      zoom, and no longer obscure the degree labels or the sky arc
      at tight FOV.

  20. **Optical entry pitch — 10° above horizon.** `main.js` entry
      handler now snaps both `OpticalZoom = 5.09` and `CameraHeight =
      10` when the user transitions `InsideVault: false → true`.
      With `CameraHeight = 0` and FOV 14.74°, the 9°-wide vertical
      view only intersects the bottom ~5° of the 90° active-meridian
      arc, so the sky arc reads as a tiny stub and the yellow guide
      appears to stop at the horizon. At pitch 10° the visible band
      is [5.4°, 14.6°] — segments 13-15 of the 16-segment arc land
      in view, so the yellow ground line visibly continues rising
      from the horizon into the sky on frame 1 of Optical entry.
      User can still drag to pitch back down to the horizon if
      desired.
- **Revert S006b only**: in `refinedAzCadenceForFov` drop the
  `layer: 'degree-5'` branch (keep only null / `layer: 'degree-1'`);
  restore `opticalCadenceStepDeg` to the two-regime version (5° at
  FOV ≥ 30°, 1° elsewhere); restore `activeCadenceLabel` to the
  two-regime version (`>= 30 ? '15°' : '1°'`); restore cardinal
  sizing to `cardH = 0.10` coarse / `min(0.10, 0.12 · cFovRad)`
  refined; remove `CameraHeight: OPTICAL_ENTRY_PITCH` from the
  `main.js` entry `setState` and delete the `OPTICAL_ENTRY_PITCH`
  constant.

### S006c — refinement (2026-04-23)

Further refinement on top of S006b (same serial, no S007):

  21. **Active meridian highlight in the coarse regime too.** Previously
      `refinedActiveMeridian` was only emitted inside the refined
      (`cad !== null`) branch of `_updateRefinedScale`, so at the
      requested entry zoom (FOV ≥ 30°, 15° coarse) the highlighted
      meridian was not drawn — no yellow arc rose from the horizon
      and the user's reported "directional vector highlights the
      relevant meridian" expectation was unmet. Fix: factor the arc
      emission into a new `_emitActiveMeridian(activeAz)` method and
      call it in **both** coarse and refined branches. Snap cadence
      is `15°` at coarse (matches the static wire's 24 meridians) and
      `cad.majorArc` at refined (5° or 1°). The arc is a single
      16-segment LineSegments, emitted every frame (cheap), so the
      highlight tracks heading continuously.

  22. **Fine-grained visibility of refined-meridian children.**
      `refinedMajorMeridians.visible` and `refinedMinorMeridians.visible`
      are now toggled independently of `refinedActiveMeridian.visible`.
      In coarse the two grid layers are hidden (static 15° wire is
      sufficient) while the active-highlight stays visible.
      `refinedMeridiansGroup` itself is always visible in Optical so
      its `(r, r, h)` scale applies to whichever children are
      currently drawn.

  23. **Ground-line snaps whenever the highlight is drawn.** The
      heading-line `dirAz` gate was `_refinedActive && _refinedActiveAz`,
      which meant the line reverted to raw heading in the coarse
      regime — the line would meet the horizon a few degrees away
      from the 15°-snapped arc base, breaking the ground-to-sky
      connected guide at entry zoom. New gate is simply
      `_refinedActiveAz != null`, so the line snaps in both coarse
      (15° cadence) and refined (5° / 1° cadence). The small
      azimuthal offset between the arrow (still heading-aligned) and
      the line tip is invisible at the arrow's `0.035 · r` radius —
      orders of magnitude smaller than the arc's offset from the
      heading direction it used to introduce.
      `_refinedActiveAz` is reset to `null` in the inactive path so
      the line cleanly falls back to heading in Heavenly or when
      `ShowAzimuthRing` is toggled off.

  24. **Optical entry zoom lowered to FOV 37.5°.** `OPTICAL_ENTRY_ZOOM`
      changed `5.09 → 2.0`. The old value put the user directly in
      the 5° regime on entry, skipping the 15° inspection layer.
      2.0 gives `fov = 75 / 2.0 = 37.5°`, a couple of wheel clicks
      away from the 5° boundary (FOV 30°, wheel step 5° in coarse).
      The ladder is now the one the user requested: enter at 15°
      cadence, wheel-in lands in 5°, wheel-in again lands in 1°,
      hard-stopped at FOV 1°. Entry pitch stays at 10° (S006b).
- **Revert S006c only**: in `_updateRefinedScale` remove the
  unconditional `_emitActiveMeridian` call before the coarse/refined
  split and restore the inline active-meridian emission inside the
  refined branch (using the local `emitArc` helper); restore the old
  coarse-branch visibility (`refinedMeridiansGroup.visible = false`);
  drop the `refinedMajorMeridians.visible` / `refinedMinorMeridians.visible`
  toggles (they simply rode their parent's visibility before); remove
  the `_emitActiveMeridian` method; restore the line-direction gate
  to `this._refinedActive && this._refinedActiveAz != null`; restore
  `OPTICAL_ENTRY_ZOOM = 5.09` in `main.js`.

### S006d — refinement (2026-04-23)

Further refinement on top of S006c (same serial, no S007):

  25. **Horizon-anchored reading band.** Degree labels (coarse 15°
      pool and refined 5°/1° pool) and cardinals now share one pitch-
      driven elevation anchor rather than being pinned to the horizon
      plane. New helper `_labelBandElevRad(s, fovDeg)` returns

          margin     = 0.05 · fov
          bottomElev = max(0, pitch − fov/2)
          labelElev  = min(85°, bottomElev + margin)

      When `pitch ≤ fov/2` the horizon is on-screen and `bottomElev`
      clamps to 0, so `labelElev` reduces to `0.05 · fov` — a small
      fixed elevation "just above the horizon" at any FOV. When
      `pitch > fov/2` the horizon drops below the view and the band
      tracks the view's bottom edge, sitting 5 % of the vertical FOV
      above the edge so labels stay in the lowest useful reading area
      as the user tilts up. 85° cap prevents label convergence at the
      zenith. `s.CameraHeight` is the Optical-mode pitch (0–90°), and
      `fov = 75 / OpticalZoom` is the three.js camera's vertical FOV
      in degrees, so the formula matches the camera exactly.

  26. **Shared world position for all three label sets.** Every label
      is placed at

          x = ringR · cos(labelElev) · cos(phi_az)
          y = ringR · cos(labelElev) · sin(phi_az)
          z = ringR · sin(labelElev) + eyeH

      with `ringR = 1.14` (unit) and `eyeH = 0.012` compensating for
      the camera's z-offset over the observer (set in `scene.js`), so
      each label actually projects at `labelElev` from the camera's
      point of view instead of `labelElev − ε`. Angular correctness is
      preserved: `phi_az` is unchanged (same `atan2(sin, −cos)`
      compass math) so each label still attaches to the correct
      meridian. Only the vertical placement was refined; azimuth
      values, active-meridian snap, heading persistence, zoom ladder,
      and the connected ground-to-sky guide are untouched.

  27. **Coarse labels + cardinals: per-frame re-home with
      `(r, r, r)` compensation.** `cardinalsGroup` and `azimuthGroup`
      are both scaled by the vault radius `r`, so the per-frame local
      positions for those sprites divide by `r` — final world
      positions match the refined labels exactly. This puts the
      coarse ring, refined ring, and N/E/S/W on the same reading band
      at every zoom. `basePhi` stored on each coarse azimuth label and
      `baseDir` on each cardinal (already present since S006b) drive
      the lift. `_azimuthLabels` is a new `[]` field the constructor
      fills.

  28. **Refined labels: lift outside the cache.** `_updateRefinedScale`
      gates its heavier tick/grid/repaint work on the
      `(fov | heading)` cache key. Pitch changes don't invalidate
      that key, so without special handling the refined labels would
      stay pinned to their last emission and not track `CameraHeight`.
      Fix: compute `labelElev` + lift constants BEFORE the cache
      check, iterate `_refinedLabelPool` and re-home every visible
      sprite using the stored `basePhi` from the last emission. The
      emission loop inside the cache-miss branch also stashes
      `basePhi` on each assigned sprite so subsequent cache-hit
      frames have data to lift. Heavy emission stays cached; the lift
      is 64 vector assignments, negligible.
- **Revert S006d only**: remove `_labelBandElevRad`; drop `basePhi`
  storage on coarse / refined labels and the `_azimuthLabels` list;
  restore the coarse azimuth labels' fixed in-constructor position
  (`sp.position.set(1.14 * cos(phi), 1.14 * sin(phi), 0.01)`);
  restore the cardinals' horizon-anchored `sp.position.set(cardR *
  b[0], cardR * b[1], 0.02)` block in `update()`; remove the
  above-cache label lift block in `_updateRefinedScale` and revert
  the refined label emission to `sp.position.set(ringR * cos(phi),
  ringR * sin(phi), 0.015)`.

### S006e — refinement (2026-04-23)

Further refinement on top of S006d (same serial, no S007):

  29. **Refined cardinals halved.** At the 5° and 1° zoom regimes the
      cardinal sizing dropped from `min(0.05, 0.06 · cFovRad)` to
      `min(0.025, 0.03 · cFovRad)`. At the refined boundary FOV 29°
      cardinals now read at world-height `0.025` instead of `0.05`;
      at entry FOV 14.7° (pre-S006c entry), `≈0.0077` instead of
      `≈0.0154`; at max-zoom FOV 1°, `≈0.000524` instead of
      `≈0.00105`. Coarse (15°) cardinal size stays at `0.05` so the
      regime change from coarse to refined reads as a deliberate
      size step, not a silent regression.

  30. **Stronger bottom-band pitch tracking.** `_labelBandElevRad`
      reformulated from the S006d additive version
      (`labelElev = max(0, pitch − fov/2) + 0.05·fov`) to a
      "floor-or-track" max:

          floorElev = 0.03 · fov
          trackElev = pitch − 0.35 · fov
          labelElev = min(85°, max(floorElev, trackElev))

      Two consequences:

      * **Earlier handoff from floor to tracking.** `trackElev`
        crosses `floorElev` at `pitch ≈ 0.38 · fov` — about 14° at
        entry FOV 37.5° vs the S006d crossover at 18.75°. So as the
        user tilts up, the band starts following pitch much sooner
        rather than sitting at the horizon until pitch reaches
        fov/2 and then "snapping" to tracking mode.
      * **Comfortable reading-strip position.** In tracking mode the
        band sits at **15 % above the view's bottom edge** (from the
        algebra: `pitch − fov/2` is the view's bottom elevation, and
        `pitch − 0.35·fov = bottom + 0.15·fov`), up from S006d's
        5 %. Labels now read as a bottom-strip reading band rather
        than labels hugging the very edge of the view.

      The floor `0.03 · fov` keeps labels safely above the horizon
      when it's visible; the 85° cap still prevents zenith pile-up
      at extreme pitch. Azimuth / phi calculation, active meridian
      snap, guide-line direction, and zoom ladder are all untouched.
- **Revert S006e only**: in `update()` restore refined-branch
  `cardH = Math.min(0.05, 0.06 * cFovRad)`; in `_labelBandElevRad`
  restore the additive formula
  `const bottomDeg = Math.max(0, pitchDeg - fovDeg / 2);` /
  `const marginDeg = 0.05 * fovDeg;` /
  `const elevDeg = Math.min(85, bottomDeg + marginDeg);`.

## S007 — Right-side 0°–90° elevation scale + observer elevation prep

- **Date:** 2026-04-23
- **Files changed:**
  - `change_log_serials.md` (this entry)
  - `js/core/app.js`
  - `js/render/scene.js`
  - `js/render/worldObjects.js`
  - `js/ui/controlPanel.js`
  - `js/ui/urlState.js`
- **Purpose:** Two coordinated additions that build on the S006
  reading-band infrastructure:

  1. **Right-side 0°–90° elevation scale.** The algebraic dual of the
     bottom azimuth band. Where S006's azimuth labels sit at FIXED
     azimuths and VARIABLE elevation (pitch-driven), the new elevation
     labels sit at a VARIABLE azimuth (heading + `rightBandAz`,
     following the user around) and FIXED elevation values. The scale
     "slides" up as the user tilts pitch, mirroring how the azimuth
     band "slides" as the user rotates heading.

     Implementation bits in `worldObjects.js`:
     - New module helper `elevCadenceForFov(fov)` — ladder
       `null → 15° / 5° / 1°` at the same FOV thresholds as
       `refinedAzCadenceForFov` (30° and 8°).
     - `ObserversOpticalVault` grows an `elevLabelsGroup` with a
       20-slot pool of light-blue (`#8ed4ff`) sprites, colour-distinct
       from the orange-yellow azimuth band.
     - New method `_updateElevScale(s, c)` called from `update()`.
       Emits labels for each cadence-multiple elevation in the
       visible vertical band `[pitch − vFov/2, pitch + vFov/2]`
       clamped to `[0°, 90°]`. Positions are
       `(ringR · cos(e) · cos(phi), ringR · cos(e) · sin(phi),
        ringR · sin(e) + eyeH)` — same `ringR = 1.14` and `eyeH =
       0.012` as the S006d azimuth labels, so both scales share one
       reading framework.
     - Azimuth offset from heading uses `c.ViewAspect` (exposed by
       SceneManager each frame) to compute horizontal FOV exactly,
       and places labels at 80 % of the way from view-centre to the
       right edge regardless of canvas aspect ratio.
     - Screen-fraction sizer uses `0.06 · ringR · fovRad`, a touch
       smaller than the azimuth band's `0.08` so the right-side
       scale doesn't compete with the primary directional read.

  2. **Observer elevation prep (fully wired, low-risk).** New state
     field `ObserverElevation` (default 0, clamp [0, 0.5]) added to
     `app.js` defaults and recompute, a new `Elevation` row in the
     Observer control-panel group, URL persistence via
     `PERSISTED_KEYS`, and a camera z-offset in `scene.js` Optical
     camera setup:

         this.camera.position.set(obs[0], obs[1],
             obs[2] + eyeH + ObserverElevation);

     Only the camera is lifted. `ObserverFeCoord` stays at z = 0 so
     all downstream geometry (cardinals, active meridian arc, heading
     ray, azimuth band, elevation scale) keeps its ground-anchored
     math unchanged. The user simply looks at the existing scene from
     a higher vantage.
- **Notes:**
  - The elevation scale respects the existing `ShowAzimuthRing`
    toggle so a single visibility switch covers both axes of the
    reading framework.
  - `ViewAspect` is recomputed every frame in `updateCamera()` so
    window resizes flow through to the label offset without any
    extra listener wiring.
  - All S006 behaviour preserved: zoom ladder, active meridian
    highlight, connected ground-to-sky guide, compact arrow, halved
    refined cardinals, stronger pitch-tracking bottom band, URL
    persistence, Heavenly ↔ Optical orientation persistence.
  - Revert path: delete the S007 block in `worldObjects.js`
    (`elevLabelsGroup`, `_elevLabelPool` / `_elevLabels`,
    `elevCadenceForFov`, `_updateElevScale`, and the
    `this._updateElevScale(s, c)` call in `update()`); remove the
    `ViewAspect` assignment and the `+ ObserverElevation` term in
    `scene.js`; remove the `ObserverElevation` state default and
    clamp in `app.js`; remove the UI row in `controlPanel.js`;
    remove `ObserverElevation` from `PERSISTED_KEYS` in
    `urlState.js`.

## S008 — Full elevation-scale extent (15°→75°, 5°→85°, 1°→85°)

- **Date:** 2026-04-23
- **Files changed:**
  - `change_log_serials.md` (this entry)
  - `js/render/worldObjects.js`
- **Purpose:** Extend the S007 right-side elevation scale so its
  full extent is in the scene at all times, not just the slice
  inside the current vertical FOV. User report: at 5° interval
  zoom the labels stopped at 30°; at 1° interval zoom they didn't
  go higher than the 15° mark; at 15° interval zoom they didn't
  reach 75°. Root cause: S007 emitted only labels inside the
  visible elevation window `[pitch − vFov/2, pitch + vFov/2]`, and
  the dynamic 20-slot pool capped how many sprites could exist at
  any time. At 1° cadence with vFov ≤ 8° that meant ~5–8 labels in
  scene, never higher than `pitch + vFov/2`.

  Changes:

  1. **Pool replaced with a fixed array of 86 pre-painted sprites**
     in the `ObserversOpticalVault` constructor, one per integer
     elevation 0°–85°. Each sprite carries `userData.elev`. The
     S007 dynamic-repaint pool (`_elevLabelPool`, 20 slots) is
     removed — runtime repaint cost is gone, scale extent isn't
     capped by pool size, and three.js frustum culling decides
     what actually renders.

  2. **`_updateElevScale` no longer windows by pitch.** Iterates
     `_elevLabels` and toggles `sp.visible` based on
     `(e <= cap && e % cadDeg === 0)` where:

         cadence  cap   labels emitted
         15°      75°   0, 15, 30, 45, 60, 75
          5°      85°   0, 5, 10, ..., 85
          1°      85°   0, 1, 2, ..., 85

     Position formula and right-edge azimuth offset
     (`0.80 · hFov / 2`, aspect-aware via `c.ViewAspect`) are
     unchanged. As the user tilts up, the higher labels are
     already in the scene graph and become visible the moment they
     enter the camera frustum, instead of having to wait for the
     emission window to slide up to them.

  3. **Caps match the user spec.** 75° at 15° regime (no 90° at
     zenith), 85° at 5° and 1° regimes (one cadence step short of
     the pole — keeps labels readable rather than collapsing onto
     each other near the zenith singularity at `cos(90°) = 0`).
- **Notes:**
  - World correctness preserved: each label sits at its true
    elevation `e` on the right-side meridian; only the *which
    labels exist* policy changed.
  - All other S007 behaviour (camera elevation wire-in, ViewAspect
    plumbing, observer UI row, URL persistence, light-blue palette
    for distinguishability) is untouched.
  - The S006 reading-band system (azimuth labels, cardinals,
    active meridian arc, connected ground-to-sky guide, zoom
    ladder) is untouched.
  - Construction adds 86 sprite allocations one-time at page load
    (~100–200 ms on a typical browser); per-frame work is now
    just visibility toggles + `position.set` calls — no
    `repaintTextSprite` cost during normal use.
- **Revert S008 only**: in the constructor, restore the 20-slot
  `_elevLabelPool` allocation (sprites with text `' '`, no
  `userData.elev`); restore the windowed emission inside
  `_updateElevScale` (`startE = ceil(minEv / cadDeg) * cadDeg`,
  `loop e <= maxEv && i < pool.length`, `repaintTextSprite` call
  inside the loop).

### S008b — refinement (2026-04-23)

User report: the original S008 attempt only touched the right-side
*labels*. The actual missing thing is the **horizontal latitude /
elevation rings themselves** at the refined cadences — the longitude
side of the lat/long box already has refined meridians at 5°/1°, but
no refined horizontal counterpart was ever generated. Additionally
the labels were sitting too far above their corresponding rings (~8°
view-elevation gap at moderate altitudes) because labels were on a
unit-radius hemisphere while rings live on the flattened vault.

  1. **Refined altitude rings, the latitude side of the box grid.**
     `ObserversOpticalVault` constructor now allocates
     `_refinedAltRingBuf` (`86 rings × 32 segs × 6 floats`) and a
     `refinedAltRings` `THREE.LineSegments` material (white, opacity
     0.30) inside `refinedMeridiansGroup`. Because that group is
     scaled by `(r, r, h)` the ring vertices are emitted in unit-frame
     coords `(cos(e)·cos(t), cos(e)·sin(t), sin(e))` — the parent
     scale puts them on the same flattened vault hemisphere the
     static wire's rings sit on.

  2. **Per-cadence emission with cadence cache.** In
     `_updateRefinedScale`'s refined branch, after the meridian
     emission, we emit rings at every `e` from 0° to 85° at
     `cad.majorArc` cadence:

         5° regime  →  18 rings (0°, 5°, 10°, …, 85°)
         1° regime  →  86 rings (0°, 1°, 2°, …, 85°)

     Cache key is just the cadence integer; only a regime change
     (5° ↔ 1° ↔ coarse-hidden) triggers a buffer rewrite. Other
     frames just toggle `refinedAltRings.visible`. At coarse and
     inactive paths the rings hide; the static wire's 5 rings at
     15°/30°/45°/60°/75° already cover the 15° regime so no refined
     additions are needed there.

  3. **Labels reattached to their rings.** Position formula in
     `_updateElevScale` switched from unit-radius
     `(1.14·cos(e)·cosφ, …, 1.14·sin(e) + eyeH)` to flattened-vault
     `(r·cos(e)·cosφ, r·cos(e)·sinφ, h·sin(e) + 0.002)`. The label
     now projects at the ring's view elevation
     (`atan((h/r)·tan(e))`), not at true astronomical `e` — so the
     label and the ring share the same point in the view instead of
     being separated by `e − atan(0.7·tan(e))` (~8° at e = 30°).
     Tiny 0.002 z-lift avoids overlapping the ring stroke exactly.

  4. **Distance-aware label sizing.** Sizing changed from
     `0.06 · ringR_fixed · fovRad` (which used the old 1.14 unit
     radius) to `0.04 · dist · fovRad` where
     `dist = sqrt((r·cosE)² + (h·sinE)²)`. Each label sits at a
     consistent ~4 % of view height regardless of vault elevation
     (high-elev labels are closer to the camera so their absolute
     world height shrinks). Preserves the reduced-font behaviour
     from the original S008 attempt.
- **Revert S008b only**: in the constructor remove the
  `refinedAltRings` block (`_refinedAltRingBuf`, `_refinedAltRingSegs`,
  the LineSegments allocation, the `refinedMeridiansGroup.add(...)`
  for it, and `_refinedAltRingsCadence`); in `_updateRefinedScale`
  remove the ring emission block in the refined branch and the three
  `this.refinedAltRings.visible = false` lines in inactive / coarse;
  in `_updateElevScale` restore the unit-radius position formula
  `sp.position.set(ringR · cosE · cosPhi, ringR · cosE · sinPhi,
  ringR · sinE + eyeH)` with `ringR = 1.14, eyeH = 0.012` and the
  fixed sizer `hScreen = 0.06 · ringR · fovRad`.

## S009 — Cel Nav ephemeris upgrade, named-star field, dual helioc/geoc pipeline, permanent night, and object tracker UI

- **Date:** 2026-04-23
- **Files changed:**
  - `change_log_serials.md` (this entry)
  - `js/core/ephemeris.js`
  - `js/core/celnavStars.js` (new)
  - `js/core/app.js`
  - `js/render/worldObjects.js`
  - `js/render/index.js`
  - `js/ui/controlPanel.js`
  - `js/ui/urlState.js`
  - `js/main.js`
  - `index.html`
  - `css/styles.css`
- **Purpose:** Substantial expansion of the ephemeris / starfield layer to
  support celestial-navigation workflows. Six coordinated changes:

  1. **Higher-accuracy ephemeris.** `sunEquatorial` rewritten to Meeus
     Ch. 25 "higher accuracy" (formulas 25.2–25.9): `L₀`, `M`, `e` with
     T²/T³ terms; equation of centre `C` with T-dependent coefficients
     (1.914602 − 0.004817·T − 0.000014·T², etc.); apparent longitude
     `λ = λ_true − 0.00569 − 0.00478·sin Ω` (constant aberration +
     node-driven nutation-in-longitude); apparent obliquity
     `ε = ε₀ + 0.00256·cos Ω`. Accuracy improved from ~0.01°/century
     to ~1″.

     `moonEquatorial` expanded from the 9-term "low-accuracy" subset of
     Meeus Ch. 47 to 27 longitude periodic terms (Table 47.A) + 18
     latitude periodic terms (Table 47.B), with T²-extended fundamental
     angles (L₀, D, M, Mp, F). Accuracy improved from ~0.5° longitude /
     0.1° latitude to ~10″ / ~4″. Node-driven nutation & apparent
     obliquity now match the sun pipeline, so both luminaries sit in a
     single consistent "apparent of date" frame.

     Both meet the Nautical Almanac tolerance (~0.1′ = 6″) for
     tracker / cel-nav readouts.

  2. **Dual helioc/geoc ephemeris API.** New `bodyGeocentric(name,
     date) → {ra, dec}` and `bodyHeliocentric(name, date) → {x, y, z}`
     (heliocentric ecliptic, Schlyter units) cover sun, moon, earth,
     and the five planets. New `bodyFromHeliocentric(name, date)`
     converts heliocentric xyz into geocentric (ra, dec) via
     differencing against earth's heliocentric position and the
     ecliptic→equatorial rotation. Single router `bodyRADec(name, date,
     source)` picks `'geocentric'` or `'heliocentric'` per frame.
     Exported `BODY_NAMES = ['sun', 'moon', 'mercury', 'venus', 'mars',
     'jupiter', 'saturn']`. New state field `BodySource` (default
     `'geocentric'`); `FeModel.update()` routes sun/moon/planet lookups
     through the selected source. Both pipelines produce identical
     (ra, dec) at current accuracy — the architectural split exists
     so future serials can diverge the precision of either path
     independently.

  3. **Cel Nav star catalogue + starfield option.** New
     `js/core/celnavStars.js` with the 58 Nautical-Almanac
     navigational stars (57 almanac + Polaris). Each entry carries
     `id`, `name`, `raH` (hours), `decD` (degrees), `mag`. J2000.0
     positions; precession skipped (< 1′ per decade, well inside
     cel-nav tolerance). Constant-export `CEL_NAV_SELECT_OPTIONS`
     drops straight into the control panel's select schema.

     New `StarfieldType: 'celnav'` option. `FeModel.update()` projects
     every entry through the existing celestial → local-globe →
     vault pipeline (same path sun/moon/planets use), writing
     `c.CelNavStars[]` with `vaultCoord`, `opticalVaultCoord`,
     `anglesGlobe {azimuth, elevation}`, `celestCoord`, and the
     original (ra, dec, mag, name, id). New `CelNavStars` render
     class (end of `worldObjects.js`) draws two point layers —
     heavenly-vault + optical-vault — consuming that computed table.
     Sub-horizon stars are parked under the disc so the clip plane
     hides them (same convention `Stars` uses).

  4. **Permanent night toggle.** `PermanentNight` state field (bool,
     default false). In `FeModel.update()`, `c.NightFactor` is forced
     to `1.0` when on, bypassing the sun-elevation ramp. Toggle row
     added to the Show tab of the control panel.

  5. **Tracker UI — manual select + second HUD panel.** Per the user's
     explicit request ("make a tab and make the tracking manual"),
     click-selection was *not* implemented. Instead:
     - New `Tracker` tab in the control panel (`FIELD_GROUPS`) with
       two rows: `Track` (select of 'none' / 'sun' / 'moon' / 5
       planets / 58 Cel Nav stars, 66 options total) and `Source`
       (select of 'geocentric' / 'heliocentric' driving `BodySource`).
     - `state.TrackerTarget` (default `'none'`).
     - Recompute writes `c.TrackerInfo = { name, category, ra, dec,
       azimuth, elevation, source, utcMs, mag? }` or `null` based on
       the selected target.
     - New `#tracker-hud` DOM element in `index.html`, below `#hud`.
     - New `buildTrackerHud(trackerEl, model)` in
       `ui/controlPanel.js` attaches an event listener and renders
       a title line + three data lines (az/el, RA/Dec in hms/dms,
       source + timestamp + magnitude). Panel collapses itself
       (`display: none`) whenever `TrackerInfo` is null.
     - Called from `main.js` immediately after `buildHud`.
     - CSS matches the main HUD's monospace / dark-glass style with
       an accent-orange border to distinguish the sub-readout.

  6. **URL persistence.** `PERSISTED_KEYS` now includes
     `BodySource`, `PermanentNight`, `TrackerTarget`. `STRING_KEYS`
     includes `BodySource` and `TrackerTarget` so their values
     round-trip as strings.

- **Notes:**
  - All prior behaviour preserved: Optical measurement framework
    (S006/S007/S008), active meridian highlight, connected ground-
    to-sky guide, observer elevation plumbing, compact cardinals,
    reading-band tracking, zoom ladder, 15° → 5° → 1° inspection
    regime, Heavenly ↔ Optical orientation persistence, and the
    random / chart-dark / chart-light starfield options. The Cel
    Nav layer is additive: existing StarfieldType values continue
    to behave exactly as they did before.
  - The dual ephemeris pipelines intentionally converge on identical
    (ra, dec) at the current precision. The helio path exists so a
    future serial can swap in VSOP87 (full heliocentric-based)
    while geoc continues to use the Meeus series — at that point
    the two sources will diverge in readout only at sub-arcsecond
    scale.
  - Precession isn't applied to Cel Nav star coordinates. For
    epoch-current work within ±50 years of J2000 this keeps star
    positions within ~0.3° — fine for visual placement, below nav-
    almanac printed precision. If sub-arcminute tracker output is
    needed later, slot a precession rotation into the per-frame
    projection loop.
  - Revert path (per-piece, in the order they were added):
    * **Ephemeris precision** — restore the old short-form
      `sunEquatorial` (three-term series with ε = 23.439 −
      0.0000004·n) and `moonEquatorial` (9 longitude + 6 latitude
      periodic terms); delete `meanObliquityDeg` and
      `moonNodeOmegaDeg` helpers.
    * **Dual API** — delete `bodyGeocentric`, `bodyHeliocentric`,
      `bodyFromHeliocentric`, `bodyRADec`, `BODY_NAMES`, and the
      `equatorialToEcliptic` / `eclipticToEquatorialRadians`
      helpers; restore direct `sunEquatorial`/`moonEquatorial`/
      `planetEquatorial` calls in `app.js`; drop the `BodySource`
      state field and URL persistence.
    * **Cel Nav** — delete `js/core/celnavStars.js`, the Cel Nav
      block in `FeModel.update()`, the `CelNavStars` class in
      `worldObjects.js`, the `celNavStars` instance + call-site in
      `render/index.js`, and the `'celnav'` option in the
      `StarfieldType` select.
    * **Permanent night** — remove the `if (s.PermanentNight)`
      branch around `c.NightFactor`; drop state field + UI row +
      URL persistence.
    * **Tracker** — delete the `Tracker` tab in `FIELD_GROUPS`,
      `buildTrackerHud` in `controlPanel.js`, the tracker wiring in
      `main.js`, the `#tracker-hud` element in `index.html`, the
      `#tracker-hud` CSS block, and `TrackerTarget` + its recompute
      block + URL persistence.

### S009a — refinement (2026-04-23)

Focused refinement on top of S009 (same serial, no S010):

  1. **Multi-tracker.** `TrackerTarget` (string) → `TrackerTargets`
     (array of ids). Default `[]`. Tracker tab replaced the dropdown
     with a toggle button grid (new `buttonGridRow` renderer driven
     by `row.buttonGrid`); clicking adds/removes each id. Active
     buttons carry the `.on` class. Cel Nav stars are alphabetised
     in the grid.

  2. **Dual ephemerides shown simultaneously.** `c.TrackerInfos[]`
     now carries `geoReading: {ra, dec}` and `helioReading: {ra,
     dec}` per tracked object. The HUD renders one `.tracker-block`
     per entry with az/el + both source lines stacked (`Geo:` and
     `Helio:`). The row matching `BodySource` gets `.active`
     (orange accent); the other gets `.inactive` (grey).

     Block DOM is cached per target id (`blockCache: Map`) so each
     frame only rewrites `textContent` on existing rows instead of
     tearing the block down and rebuilding it. Both source rows
     therefore tick visibly in place — the audience can watch the
     numbers advance in lockstep and confirm the geo/helio
     pipelines really do produce equal RA/Dec at current precision.
     (Previous implementation called `replaceChildren()` on every
     `'update'` event; the rebuild churn hid the per-tick changes.)

  3. **Per-tracked-object GPs on the disc + dashed line to vault.**
     New `TrackedGroundPoints` class in `worldObjects.js` holds 16 GP
     slots **and** a parallel pool of vertical lines; per frame it
     reads `c.TrackerInfos[i].gpLat / gpLon` + `vaultCoord` and
     colours the slot / line by category (sun yellow, moon white,
     planets coral, stars Cel Nav blue). Always visible when
     tracking, independent of `ShowGroundPoints`. Hidden in first-
     person (Optical) mode, and the dashed line is gated on
     `ShowTruePositions` the same way sun/moon GP lines are. The
     `vaultCoord` comes directly from the precomputed body/star
     pipeline (sun/moon/planet already have one; Cel Nav stars
     store one on `c.CelNavStars[i].vaultCoord`), so the line lands
     exactly at the star/planet on the heavenly vault — matching
     the sun/moon convention.

  4. **HUD offset + scroll.** `#tracker-hud { top: 160px → 240px }`
     to clear the main HUD's moon-phase widget (56 px canvas + label)
     plus padding. `max-height: calc(100vh - 260px)` +
     `overflow-y: auto` so large tracked sets scroll cleanly.

  5. **URL persistence for arrays.** `urlState.js` gains an
     `ARRAY_KEYS` set; array-valued state fields serialise as
     comma-joined strings. Empty array → omitted from the hash.

- **Revert S009a only**: in `app.js` swap back to `TrackerTarget`
  (string) + the single-`TrackerInfo` recompute block; remove
  `bodyGeocentric` / `bodyFromHeliocentric` imports; restore the
  Track `select` row and the single-line `buildTrackerHud` in
  `controlPanel.js`; remove `buttonGridRow`; delete
  `TrackedGroundPoints` in `worldObjects.js` and its import +
  instantiation + `.update(m)` call in `render/index.js`; restore
  `#tracker-hud { top: 160px }` and drop the
  `.tracker-block / .source-line / .tracker-foot / .button-grid /
  .tracker-btn` CSS rules; drop `ARRAY_KEYS` in `urlState.js` and
  revert the key name back to `TrackerTarget`.

### S009b — refinement (2026-04-23)

Two independent fixes, both in `js/ui/controlPanel.js`:

  1. **Lat / long decimal precision** (`controlPanel.js:158–159`).
     `step: 0.1 → 0.0001` for `ObserverLat` and `ObserverLong`. The
     shared `numericRow` renderer uses `step` for three things — the
     HTML number input's step, the slider's step, and the displayed
     decimal count via `digits = ceil(-log10(step))` — so bumping
     the step gives the number field four decimal places (≈ 0.36″
     per tick, sub-arcsecond). No other layer clips precision: the
     state clamp is `Clamp(..., -90, 90)` (range only, not a
     quantiser) and URL persistence already writes `toFixed(4)`.
     Needed so users can enter the exact observatory / nav-fix
     coordinate Stellarium uses for a cross-comparison.

  2. **Timezone = shift UTC, hold local clock (Path B).** Previously
     the timezone dropdown only re-formatted the `dateTimeRow`
     display; `DateTime` stayed fixed and the ephemeris produced the
     same RA/Dec regardless of zone — which made cross-checking
     Stellarium confusing. New behaviour in `timezoneRow`'s change
     handler:

         newOff   = parseInt(sel.value, 10);
         oldOff   = model.state.TimezoneOffsetMinutes || 0;
         deltaMin = newOff − oldOff;
         DateTime_new = DateTime_old − deltaMin / (60·24);
         setState({ TimezoneOffsetMinutes: newOff,
                    DateTime: DateTime_new });

     Derivation: `local = UTC + offset`; holding `local` fixed while
     `offset` changes forces `UTC_new = UTC_old − (offset_new −
     offset_old)`. Converting the delta from minutes into the
     DateTime's day units gives the formula above. Result: switching
     the TZ dropdown makes the sky move by exactly the time-zone
     delta, so entering a local observation time and flipping zones
     reproduces "what the sky looks like at the same local-clock
     reading at a different longitude" — the workflow the user
     wants for Stellarium parity.

     The preamble comment above `dateTimeRow` was updated to
     document the new semantics. No changes to ephemeris math
     (`julianDay`, `sunEquatorial`, `moonEquatorial`, etc.) — those
     already consume `DateTime` as UTC-since-epoch and are
     timezone-agnostic. All S009 tracker readouts, Cel Nav star
     positions, and sun/moon GP lines follow automatically once
     `DateTime` is shifted.

- **Revert S009b only**: restore `step: 0.1` on ObserverLat /
  ObserverLong rows; in `timezoneRow`'s `sel.addEventListener` revert
  the handler to just `setState({ TimezoneOffsetMinutes: parseInt(sel.value, 10) })`
  and drop the `DateTime` shift; restore the earlier preamble comment
  describing display-only timezone.

### S009d — refinement (2026-04-23)

Tracker HUD polish:

  1. **Both ephem rows rendered equally.** Dropped the
     `.source-line.active` / `.source-line.inactive` class swap in
     `buildTrackerHud`; both Geo and Helio rows always render with
     the same orange-accent bordered style. `BodySource` still drives
     which pipeline the model uses internally, but the HUD no longer
     visually demotes one source — the dual display is the point.

  2. **Simpler, more robust refresh.** Block-cache logic collapsed:
     every refresh unconditionally rewrites `textContent` on all
     six internal rows (title / az-el / Geo / Helio / foot) for each
     tracked target. Safe-reattach check (`if (rec.block.parentNode
     !== trackerEl) trackerEl.appendChild(...)`) handles any case
     where a cache entry was orphaned. Fixes the "block disappears /
     won't stay activated when adding a new star or scrubbing time"
     report.

  3. CSS (`css/styles.css`) — removed `.source-line.active` and
     `.source-line.inactive` rules; `.source-line` alone now carries
     the orange-accent styling for both Geo and Helio rows.

- **Revert S009d only**: restore the `.source-line.active /
  .source-line.inactive` CSS pair; restore the `activeSource` block
  in `buildTrackerHud` that swaps `'active' | 'inactive'` classes
  on each source-row based on `model.state.BodySource`.

## S010 — True removal of heliocentric intermediates from ephemeris.js

- **Date:** 2026-04-23
- **Files changed:**
  - `change_log_serials.md` (this entry)
  - `js/core/ephemeris.js` (rewritten — Earth-focus Kepler per planet)
  - `js/core/ephemeris.reframe.backup.js` (new — byte-exact copy of the
    S010 Tychonic-reframe attempt, preserved before this rewrite)
  - `js/core/ephemeris.S009.backup.js` (unchanged — the original
    pre-S010 heliocentric version, preserved from the earlier attempt)
- **Purpose:** Remove the heliocentric chain from the **active**
  computation path of `ephemeris.js`, for real this time. The earlier
  S010 commit reframed the planetary pipeline as Tychonic — renaming
  `heliocentric` → `keplerPosition` and recomputing each planet as
  `sun_around_earth + planet_around_sun` — which still produced a
  Sun-relative intermediate for every planet on every tick. That
  attempt is rejected; this entry replaces it. The active file now
  models each planet as a **single Kepler ellipse with the Earth at
  the focus**, evaluated once per planet, with no Sun-centred
  intermediate anywhere in the math.
- **Rationale (noted by the user):** Planetary orbital distances in
  this conceptual sim are ratios, not physical lengths — AU only
  acquires meaning by assuming an Earth-radius scale. The conceptual
  price of removing the Sun-relative stage (inner planets no longer
  librate about the Sun; no planet exhibits retrograde motion; RA/Dec
  no longer match real ephemerides) is explicitly acceptable. The
  mission is structural: the chain must start and end geocentrically.
- **Numerical consequences (stated honestly — not preserved):**
  - Sun: unchanged (Meeus Ch. 25 — already geocentric).
  - Moon: unchanged (Meeus Ch. 47 — already geocentric).
  - Planets: RA/Dec values now differ from the S009 pipeline by tens
    of degrees. The Schlyter elements are retained as conceptual ratio
    parameters (eccentricity, inclination, node, argument, mean
    motion), but because they were originally calibrated for
    heliocentric use, reinterpreting them as Earth-focus ellipses
    produces positions that do not match a real ephemeris. Retrograde
    motion and Mercury/Venus elongation bounds are not reproducible
    without a Sun-relative stage; both are therefore absent by design.
- **Implementation notes (minimal and faithful):**
  1. **Exact backup.** `js/core/ephemeris.js` (the Tychonic-reframe
     version) was copied to `js/core/ephemeris.reframe.backup.js`
     before any edits. `md5sum` verified byte-identical hashes
     (`a74eb23a…`). The older pre-reframe backup
     `js/core/ephemeris.S009.backup.js` (`907c6ce0…`) is untouched.
  2. **`ORBIT_EL` table.** The `'sun'` row (Schlyter's Earth-around-Sun
     elements in disguise) has been **removed**. Only the five planet
     rows remain — `mercury`, `venus`, `mars`, `jupiter`, `saturn` —
     with their numeric elements unchanged. In this module those
     numbers now parameterise each planet's Earth-focus Kepler
     ellipse; they are not interpreted as Sun-relative orbits.
  3. **`keplerPosition(name, d)` → `keplerEarthFocus(name, d)`.**
     Internal helper renamed. Its math (orbit-plane solve plus three
     Euler rotations) is unchanged, but the returned (x, y, z) is now
     documented and used as the planet's **geocentric** ecliptic
     position — the focus of the ellipse is Earth. The prior helper's
     doc-comment claim of *"'sun' → geocentric; planet → Sun-relative"*
     is gone; there is no `'sun'` case and no Sun-relative case.
  4. **`planetEquatorial(name, date)` collapsed to one evaluation:**

         const d = schlyterDay(date);
         const p = keplerEarthFocus(name, d);
         → rotate ecliptic → equatorial at ε = 23.4393° − 3.563e-7·d
         → extract RA / Dec

     No `sunGeo` variable, no `planetRelSun` variable, no additive
     composition. Signature and return shape (`{ ra, dec }`) unchanged.
  5. **`bodyHeliocentric` removed from exports.** No external module
     imports this name (verified by grep across `js/`). Removing it
     eliminates the last function whose contract promised a
     Sun-centred vector. The internal `equatorialToEcliptic` and
     `eclipticToEquatorialRadians` helpers — which existed only to
     support `bodyHeliocentric` — are removed too.
  6. **`bodyFromHeliocentric` collapsed to an overt alias.**

         export const bodyFromHeliocentric = bodyGeocentric;

     The name is preserved only so `app.js`'s Tracker-HUD dual-readout
     continues to resolve its import; both the Geo and Helio rows of
     the HUD will now carry the same value. This is the opposite of a
     wrapper-that-hides-helio-math: it is an explicit collapse onto
     the geocentric chain, with no Sun term anywhere behind it.
  7. **`bodyRADec(name, date, source)` signature preserved, body
     collapsed.** The `source` parameter is accepted and ignored;
     both `'geocentric'` and `'heliocentric'` route to
     `bodyGeocentric`. Documented in a comment at the function site.
  8. **Untouched:** `sunEquatorial` (Meeus Ch. 25), `moonEquatorial`
     (Meeus Ch. 47), `greenwichSiderealDeg` (Meeus Ch. 12),
     `equatorialToCelestCoord`, `solveKepler`, `elementsAt`,
     `schlyterDay`, `julianDay`, `meanObliquityDeg`,
     `moonNodeOmegaDeg`, `findNextEclipses`, `sepAngle`,
     `ECLIPSE_ANG_THRESHOLD`, `PLANET_NAMES`, `BODY_NAMES`. The
     file-header comment block was rewritten to describe the
     Earth-focus model honestly and to call out the accuracy cost.
- **Downstream:** no import-site changes required. `app.js`,
  `controlPanel.js`, `demos/definitions.js`, and `render/worldObjects.js`
  all continue to import the same exported names. The Tracker HUD
  will now display two identical RA/Dec lines per target (Geo and
  Helio), because the "second pipeline" has been collapsed into the
  first. That visible duplication is deliberate — a future serial
  can choose to drop the redundant row from the HUD; it is left in
  place here to keep this change surgical.
- **Verification:**
  - Grep of the active file for `sun`/`helio`/`Sun`: remaining hits
    are (a) `sunEquatorial` (Meeus geocentric sun — the sun as a
    body, not as an orbit centre), (b) `sunVec` inside
    `findNextEclipses` (the sun's position on the sky), (c) the
    `BODY_NAMES` list entry `'sun'`, (d) the doc-comments and the
    `bodyFromHeliocentric = bodyGeocentric` alias line. No math
    function computes a planet relative to the Sun.
  - Runtime smoke-test (`node --input-type=module`): all seven bodies
    return finite RA/Dec; `bodyHeliocentric` is absent from exports;
    `bodyGeocentric`, `bodyFromHeliocentric`, and
    `bodyRADec(..., 'heliocentric')` all return identical values
    for every body (all three paths resolve to the geocentric chain).
- **Revert path (to the Tychonic-reframe attempt):**
  1. `cp js/core/ephemeris.reframe.backup.js js/core/ephemeris.js`
  2. Restore app.js imports (no change required — the alias
     `bodyFromHeliocentric = bodyGeocentric` preserved the API).
  3. Remove this S010 entry from `change_log_serials.md`.
- **Revert path (all the way to the pre-S010 heliocentric version):**
  1. `cp js/core/ephemeris.S009.backup.js js/core/ephemeris.js`
  2. Optionally delete the two backups:
     `rm js/core/ephemeris.reframe.backup.js js/core/ephemeris.S009.backup.js`
  3. Remove this S010 entry from `change_log_serials.md`.


## S011 — Three-pipeline ephemeris with Ptolemy as the third path

- **Date:** 2026-04-23
- **Files added:**
  - `js/core/ephemerisCommon.js` (shared Meeus sun / moon / GMST /
    eclipse-finder / coord utilities)
  - `js/core/ephemerisHelio.js` (Schlyter heliocentric Kepler +
    Sun-around-Earth composition; faithful extraction of the S009
    planet code)
  - `js/core/ephemerisGeo.js` (S010 single Earth-focus Kepler
    ellipse per planet; extracted from former monolithic ephemeris.js)
  - `js/core/ephemerisPtolemy.js` (**NEW pipeline** — deferent +
    epicycle per the *Almagest*; ported from R.H. van Gent's
    "Almagest Ephemeris Calculator"
    https://webspace.science.uu.nl/~gent0113/astro/almagestephemeris.htm
    — credit and URL embedded in the module header)
  - `js/core/ephemeris.S010.backup.js` (byte-exact backup of the
    monolithic S010 `ephemeris.js` prior to its conversion into a
    dispatcher)
- **Files changed:**
  - `js/core/ephemeris.js` — rewritten as a three-way dispatcher.
    New router `bodyRADec(name, date, source)` with
    `source ∈ {'heliocentric', 'geocentric', 'ptolemy'}`. Also
    exports per-source namespaces `helio`, `geo`, `ptol` so callers
    can compute all three readings simultaneously. Legacy exports
    (`bodyGeocentric`, `bodyFromHeliocentric`, `planetEquatorial`,
    `sunEquatorial`, `moonEquatorial`, `greenwichSiderealDeg`,
    `equatorialToCelestCoord`, `findNextEclipses`, `PLANET_NAMES`,
    `BODY_NAMES`) preserved; `bodyGeocentric` defaults to the
    `'geocentric'` (Earth-focus Kepler) pipeline and
    `bodyFromHeliocentric` remains an alias for it.
  - `js/core/app.js` — imports `helio`, `geo`, `ptol` namespaces;
    tracker compute block now produces three readings per target
    (`helioReading`, `geoReading`, `ptolemyReading`); stars populate
    all three with the same J2000 catalogue entry. `BodySource`
    state documented for three options.
  - `js/ui/controlPanel.js` — `BodySource` selector expanded to
    three options (HelioC / GeoC / Ptolemy). Tracker HUD `makeBlock`
    now creates three `source-line` rows per target; `refresh`
    writes RA/Dec labelled `Helio : …`, `GeoC  : …`, `Ptol  : …`.
- **Purpose:** Stand up three structurally distinct ephemeris
  pipelines in parallel so the sim can display them side-by-side in
  real time. All three are computed every tick (total cost ~900
  floating-point ops per frame — a microsecond — so lazy loading
  would be premature optimisation). The Tracker HUD shows three
  genuinely-different RA/Dec readings per target; the BodySource
  selector picks which one feeds the primary sky render.
- **Pipeline semantics:**
  - **HelioC** (`ephemerisHelio.js`) — Schlyter's simplified
    heliocentric Keplerian elements. Planet is placed on its own
    Sun-centred ellipse; geocentric position = Schlyter's
    Sun-around-Earth row + planet-around-Sun. Original pre-S010
    behaviour. Sun/Moon via Meeus from `ephemerisCommon.js`.
  - **GeoC** (`ephemerisGeo.js`) — S010 Earth-focus single Kepler
    per planet. No Sun-relative stage anywhere; apparent-motion
    accuracy is poor (no retrograde, no inner-planet elongation
    bounds) but the active chain is Earth-centred throughout.
    Sun/Moon via Meeus from `ephemerisCommon.js`.
  - **Ptolemy** (`ephemerisPtolemy.js`) — Ptolemy's deferent +
    epicycle per *Almagest* book IX–XI. Structurally geocentric at
    every stage; retains retrograde motion and Mercury/Venus
    elongation via the epicycle construction. Has its own Sun
    (Almagest III.4 eccentric) and Moon (Almagest V.5–V.8). Uses
    Ptolemy's obliquity (23°51′20″). Accuracy ~1° around antiquity,
    drifting to ~10° at modern dates because Ptolemy's mean
    motions and apogees were slightly off — an authentic feature
    of the Ptolemaic model, not a porting error.
- **Credit:** the Ptolemy pipeline is a port of
  R.H. van Gent, "Almagest Ephemeris Calculator" (Utrecht
  University), at the URL above. van Gent's transcription of the
  Almagest orbital constants, his implementations of the eccentric
  + epicycle evaluators (`eqplan`, `eqme`, `latout`), and his
  inner-planet latitude formulas are all retained verbatim (with
  sexagesimal literals preserved via a `sex(...)` helper). The
  port strips the DOM-coupling of the original page and adapts
  function signatures to match the sim's ephemeris API
  (`{ ra, dec }` in radians).
- **Cost at runtime:** Verified ~900 ops/frame across all three
  pipelines (Sun ~50, Moon ~200, Helio planets ~200, GeoC planets
  ~150, Ptolemy planets ~300). No observable UI impact. No lazy
  loading.
- **Parity check:** `ephemerisHelio.bodyGeocentric` for all seven
  bodies at 2026-04-23T12:00Z produces exactly `0.00e+0` delta
  against `ephemeris.S009.backup.js.bodyGeocentric` — confirming
  the S009 heliocentric path was ported bit-for-bit.
- **Revert paths:**
  1. *Revert everything to the S010 monolith:*
     `cp js/core/ephemeris.S010.backup.js js/core/ephemeris.js`
     then delete `ephemerisCommon.js`, `ephemerisHelio.js`,
     `ephemerisGeo.js`, `ephemerisPtolemy.js`, and the
     `ephemeris.S010.backup.js` file. Revert the import change in
     `app.js`, drop `ptolemy` from the `BodySource` selector, and
     drop the `ptolemy` source-row in `controlPanel.js`.
  2. *Remove only the Ptolemy pipeline:*
     In `ephemeris.js` drop the `ptol` import/namespace export and
     the `'ptolemy'` branch in `bodyRADec` / `planetEquatorial` /
     `sunEquatorial` / `moonEquatorial`. In `app.js` drop the
     `ptolemyReading` assignments. In `controlPanel.js` drop the
     third source-line in `makeBlock` and remove the `'ptolemy'`
     option from the `BodySource` selector.

## S012 — Precession + nutation for Cel Nav stars

- **Date:** 2026-04-23
- **Files changed:**
  - `js/core/ephemerisCommon.js` — added `apparentStarPosition(raJ2000, decJ2000, date) → { ra, dec }` (radians in/out).
  - `js/core/app.js` — imports `apparentStarPosition`; inside the
    `CEL_NAV_STARS` loop, catalogue J2000 values are run through it
    before the celestial → horizon projection. The Tracker HUD
    readings for stars therefore now carry apparent-of-date RA/Dec,
    and the per-frame az/el uses the precessed coordinates.
- **Purpose:** Close the ~20′ star-position gap visible in the S011
  Stellarium cross-checks. Until now the 58-star Nautical-Almanac
  catalogue was held at J2000 forever; each additional year of wall
  time widened the visible drift. The correction had been proposed
  and rolled back once earlier (S009c); this clean retry lives in a
  common utility rather than being inlined in the render loop.
- **Implementation:**
  1. **Precession — Lieske 1977 (IAU 1976), Meeus 21.4.**
     Compute the three angles ζ, z, θ from the usual polynomials in
     T (Julian centuries from J2000) and apply the rigorous rotation
     matrix formulation (cos/sin of ζ, θ; then atan2 + z offset
     + asin). Output is mean equator of date.
  2. **Nutation — low-accuracy Meeus 22.A.**
     Two leading terms driven by the longitude of the Moon's
     ascending node Ω:
         Δψ = −17.20″·sin(Ω)    (longitude)
         Δε =   +9.20″·cos(Ω)    (obliquity)
     Correction to RA/Dec via the equatorial-form equations after
     Meeus 22.A. Adds ≈9″ to the accuracy budget.
  3. **Annual aberration — NOT applied.** Would add up to ≈20″
     (0.006°). Below the ~15″ noise floor after precession +
     nutation; skipped to keep the per-frame hot path small.
  4. **Proper motion — NOT applied.** The sim's catalogue doesn't
     tabulate it; maximum accumulated PM from J2000 to 2026 is
     ≈30″ (Arcturus, fastest of the 58 Nautical-Almanac stars);
     below the noise floor.
- **Expected accuracy vs Stellarium:** sub-arcminute (typically
  under 15″) across the 58-star catalogue for any date within
  ±200 years of J2000. Verified computationally: precession
  deltas for Menkar (ΔRA ≈1247″ = 20.8′) match the observed S011
  Menkar sky-discrepancy (21.6′) within arcseconds.
- **Cost:** ~20 trig ops per star per frame × 58 stars ≈ 1100 ops
  per frame. Negligible — the ephemeris pipelines are already
  ~900 ops per frame and the render pipeline dwarfs both.
- **Revert path:**
  1. In `app.js`, restore the CEL_NAV_STARS loop to use
     `(star.raH / 24) * 2π` and `star.decD * π/180` directly (drop
     the `apparentStarPosition` call and its result destructure).
  2. Drop the `apparentStarPosition` import from `app.js`.
  3. Remove the `apparentStarPosition` export and implementation
     from `ephemerisCommon.js`.
  4. Remove this S012 entry from `change_log_serials.md`.

## S013 — Annual aberration for Cel Nav stars

- **Date:** 2026-04-23
- **Files changed:**
  - `js/core/ephemerisCommon.js` — extended `apparentStarPosition` with
    a third correction step (Meeus 23.2 annual aberration, first-order).
  - `change_log_serials.md` (this entry).
- **Purpose:** Close the remaining ~20″ residual between sim and
  Stellarium star positions after S012. With precession + nutation
  stars matched to ~10″ already; aberration adds the final ~20″
  correction for starlight bent by Earth's orbital velocity.
- **Implementation:**
  - κ = 20.49552″ (constant of aberration).
  - Uses λ_sun = Sun's apparent ecliptic longitude per Meeus Ch. 25.
    Recomputed inline in the function (same polynomial form as the
    sunEquatorial helper) so `apparentStarPosition` stays
    self-contained — no cross-module call overhead in the hot path.
  - Meeus 23.2 formulae:
        Δα = −κ · (cos α cos λ cos ε + sin α sin λ) / cos δ
        Δδ = −κ · [cos λ cos ε (tan ε cos δ − sin α sin δ)
                   + cos α sin δ sin λ]
  - The E-term (Meeus 23.3, eccentric-orbit correction using the
    longitude of Earth's perihelion) is dropped; it contributes
    ≤0.3″ and is below the nutation-model residual.
- **Expected accuracy vs Stellarium:** under 10″ for all 58 stars at
  any date within ±200 years of J2000. Residual sources (in
  decreasing magnitude): proper motion (≤30″ for Arcturus, typical
  ≤5″; not applied because the catalogue doesn't tabulate it), the
  nutation's dropped higher-order terms (~2″), and the aberration's
  dropped E-term (≤0.3″).
- **Cost:** ~10 extra trig ops per star per frame above S012; total
  ≈ 1700 ops/frame across all 58 stars. Still negligible.
- **Revert path:** in `ephemerisCommon.js`, delete the annual-
  aberration block (the `K_AB` constant, the inline Sun-longitude
  recomputation, and the two `dRaAb` / `dDecAb` corrections) at the
  tail of `apparentStarPosition`. Revert the function header
  comment to "S012 only, aberration NOT applied". Remove this S013
  entry from `change_log_serials.md`.

## S014 — Toggleable star-correction modes

- **Date:** 2026-04-23
- **Files changed:**
  - `js/core/ephemerisCommon.js` — `apparentStarPosition` now takes a
    fourth parameter `mode` ∈ `{'precession', 'nutation',
    'aberration', 'all'}` (default `'all'`). Each mode applies only
    the named correction; `'all'` sequences precession → nutation →
    aberration as before.
  - `js/core/app.js` — new state field `StarCorrection` (default
    `'all'`). The `CEL_NAV_STARS` loop passes
    `s.StarCorrection || 'all'` through to `apparentStarPosition`.
  - `js/ui/controlPanel.js` — new dropdown `Star corr.` under the
    Ephemeris group with four options
    (Precession ~20′, Nutation ±9″, Aberration ±20″, All).
  - `js/ui/urlState.js` — `StarCorrection` added to the persisted
    state keys (with `STRING_KEYS` entry).
- **Purpose:** Pedagogical demo of the three "mini motions" that
  combine to produce apparent stellar drift. With this toggle a
  viewer can:
  - Select *Precession only* to see the ~20′ secular shift of the
    vernal equinox since J2000.
  - Select *Nutation only* to see the ±9″ Ω-driven wobble.
  - Select *Aberration only* to see the annual ±20.5″ ellipse that
    Earth's orbital motion produces.
  - Select *All* to see the full apparent place (matches Stellarium
    within a few arcseconds).
  The motivation is the user's framing: "you can't say for sure if
  it's a series of mini motions or one oscillation with respect to a
  fixed Earth" — this lets viewers inspect each component and make
  up their own mind.
- **Isolation semantics:** when a single mode is selected, the
  correction is applied to the J2000 catalogue coordinates directly
  (not to a precessed intermediate). For the sub-arcminute nutation
  and aberration terms the difference is sub-arcsecond, so the
  visible magnitudes are honest. Only `'all'` produces the
  physically-correct sequenced chain.
- **Default:** `'all'` preserves the S013 behaviour; nothing changes
  visually unless the user picks a mode.
- **Revert path:** in `ephemerisCommon.js`, drop the `mode`
  parameter (back to fixed full-chain); in `app.js`, remove the
  `StarCorrection` state and the fourth argument to
  `apparentStarPosition`; in `controlPanel.js`, remove the
  `StarCorrection` row; in `urlState.js`, remove `StarCorrection`
  from the persisted-keys list.

## S015 — AstroPixels (DE405) ephemeris pipeline

- **Date:** 2026-04-23
- **Data source:**
  Fred Espenak, "AstroPixels — Ephemeris"
  https://www.astropixels.com/ephemeris/ephemeris.html
  The underlying ephemeris is JPL DE405 — the same reference
  Stellarium uses — so Astropixels agrees with Stellarium to
  sub-arcsecond at any tabulated date. **All credit for the raw
  data belongs to Fred Espenak.**
- **Files added:**
  - `scripts/scrape_astropixels.mjs` — one-time Node script that
    downloads 12 years × 7 bodies = 84 pages (throttled, cached),
    parses the fixed-width RA/Dec columns from each `<pre>` block,
    and emits a compact JS data module.
  - `js/data/astropixels.js` — auto-generated (~510 KB). Per body
    per year, `Float64` pairs `[raSec, decArcsec]` at 00:00 UTC for
    each day-of-year.
  - `js/core/ephemerisAstropixels.js` — runtime pipeline. Loads the
    data module, runs date → (year, doy, fractional-day) lookup,
    linearly interpolates between the two nearest daily samples,
    wraps RA at year boundaries. Credit + URL + DE405 provenance
    embedded in the module header.
- **Files changed:**
  - `js/core/ephemeris.js` — dispatcher imports `apix`, exports it
    in the namespace map, routes `'astropixels'` through
    `bodyRADec` / `planetEquatorial` / `sunEquatorial` /
    `moonEquatorial`, adds to `EPHEMERIS_SOURCES`.
  - `js/core/app.js` — new `ephApix` import; tracker compute block
    now produces `astropixelsReading` for every target.
  - `js/ui/controlPanel.js` — `BodySource` selector adds
    "DE405 (Espenak AstroPixels)"; Tracker HUD `makeBlock` adds a
    fourth source-line and `refresh` writes `DE405 : …`.
- **Coverage:** 2019–2030 (the full range Espenak publishes at
  scrape time). Outside that range the pipeline returns
  `{ ra: 0, dec: 0 }` and logs one console warning per body.
- **Accuracy:** sub-arcsecond at tabulated dates. Linear-interpolation
  residual is ≤0.5″ for slow bodies (Sun, planets) and up to ~1′
  for the Moon (which moves ~13°/day). For higher in-between
  accuracy a cubic-Hermite interpolant could replace linear; the
  ~1′ moon floor is acceptable for the sim's visual budget.
- **Licensing / courtesy:** robots.txt on astropixels.com allows
  all crawling; the scraper throttles at 750 ms between requests;
  every consuming module prominently cites Espenak. No permission
  was sought beyond honouring robots.txt and the polite-rate
  convention; future maintainers should reconsider this if the
  project goes public.
- **Revert path:** drop `ephemerisAstropixels.js`,
  `js/data/astropixels.js`, and `scripts/scrape_astropixels.mjs`;
  remove `apix` from `ephemeris.js` (import, namespace export,
  `'astropixels'` branches, `EPHEMERIS_SOURCES` entry); remove
  the astropixels reading from `app.js` tracker blocks; remove
  the selector option + HUD row from `controlPanel.js`.

## S016 — VSOP87 (Bretagnon & Francou) ephemeris pipeline

- **Date:** 2026-04-23
- **Theory source:**
  Bretagnon, P., and Francou, G. (1988). "Planetary theories in
  rectangular and spherical variables — VSOP87 solutions."
  *Astronomy and Astrophysics,* **202**, 309–315.
  VSOP87D variant — heliocentric spherical coordinates in the
  mean-ecliptic-and-equinox-of-date frame.
- **Coefficient source:**
  commenthol/astronomia (npm package), MIT-licensed JavaScript
  port of Sonia Keys's Go port of the original Bureau des
  Longitudes tables. Copied verbatim into
  `js/data/vsop87/{mercury,venus,earth,mars,jupiter,saturn}.js`
  with attribution in `js/data/vsop87/LICENSE_ATTRIBUTION.md`.
- **Files added:**
  - `js/data/vsop87/mercury.js` (339 KB) — full L/B/R series
  - `js/data/vsop87/venus.js`   (83 KB)
  - `js/data/vsop87/earth.js`   (120 KB)
  - `js/data/vsop87/mars.js`    (270 KB)
  - `js/data/vsop87/jupiter.js` (171 KB)
  - `js/data/vsop87/saturn.js`  (282 KB)
  - `js/data/vsop87/LICENSE_ATTRIBUTION.md` — MIT notice with
    full copyright chain.
  - `js/core/ephemerisVsop87.js` — runtime evaluator.
- **Implementation (`ephemerisVsop87.js`):**
  1. `evalSeries(series, T)` evaluates each L/B/R subseries via
     `Σᵢ Aᵢ · cos(Bᵢ + Cᵢ·T)`, summed across powers `T^p`
     (p=0..5) where T is Julian millennia from J2000.
  2. Planet and Earth are both evaluated heliocentrically; the
     vectors are rectangularised, subtracted, and re-spherical-
     ised to produce geocentric ecliptic (λ, β, Δ).
  3. Meeus 32.3 FK5 correction brings the dynamical VSOP87
     frame into the FK5 reference frame (sub-arcsecond bias).
  4. Ecliptic → equatorial at the mean obliquity of date.
  5. Sun geocentric = Earth heliocentric vector reflected through
     origin (same pipeline, negated λ).
  6. Moon delegates to Meeus (`ephemerisCommon.moonEquatorial`) —
     VSOP87 doesn't provide lunar theory. The known ~2.5° Meeus-
     moon discrepancy vs DE405 is tracked as a separate issue
     (Task #147).
- **Files changed:** `ephemeris.js` (import `vsop`, export
  namespace, route `'vsop87'` in all four dispatchers, add to
  `EPHEMERIS_SOURCES`); `app.js` (import `ephVsop`, new
  `vsop87Reading` on every tracker info); `controlPanel.js`
  (5th selector option, 5th source-line in Tracker HUD block).
- **Accuracy:** sub-arcsecond for inner planets, a few arcseconds
  for outer planets, across ±4000 years of J2000 — the full
  documented accuracy of VSOP87D. Verified vs AstroPixels at
  2026-04-23T12:00Z: Saturn agrees to ~1.2s RA / ~6″ Dec, Mars
  to ~1.7s / ~10″, Jupiter to ~0.4s / ~9″.
- **Cost:** 1.26 MB of coefficient data (uncompressed JS). Parse
  once at module load. Per-call cost is ≈6000 cos-ops for the
  planet + 6000 for Earth = 12000 trig ops. Negligible in
  practice; the data size is the main cost.
- **Revert path:** drop `ephemerisVsop87.js` and the six
  `js/data/vsop87/*.js` files; remove `vsop` from `ephemeris.js`
  (import, namespace export, `'vsop87'` branches,
  `EPHEMERIS_SOURCES` entry); remove the VSOP87 reading from
  `app.js` tracker blocks; remove the selector option + HUD row
  from `controlPanel.js`.

- **Pre-existing issue surfaced during S015/S016:**
  The Meeus Ch. 47 moon in `ephemerisCommon.js` (27 longitude +
  18 latitude terms) is **~2.5° RA / ~0.3° Dec off** the DE405
  reference at modern dates. This affects the HelioC, GeoC, and
  (by delegation) VSOP87 moon outputs. The AstroPixels moon uses
  DE405-tabulated values directly and is unaffected. Diagnosis
  pending — likely a coefficient transcription error in the
  Meeus table or a missing E-factor multiplier. Tracked under
  Task #147.

## S017 — Star-correction checkboxes + Unicorn Dust

- **Date:** 2026-04-23
- **Files changed:**
  - `js/core/ephemerisCommon.js` — `apparentStarPosition` now takes
    an options object `{ precession, nutation, aberration }` instead
    of the S014 `mode` string enum. Each flag gates its corresponding
    correction independently.
  - `js/core/app.js` — retires the `StarCorrection` string field;
    adds four independent booleans: `StarApplyPrecession`,
    `StarApplyNutation`, `StarApplyAberration`, `StarUnicornDust`
    (all default `true`). The tracker compute block composes the
    options object: when `StarUnicornDust` is checked, it forces all
    three corrections on regardless of the other flags; otherwise
    each flag passes through individually.
  - `js/ui/controlPanel.js` — the "Star corr." select row becomes
    four `row.bool` rows in the Ephemeris group.
  - `js/ui/urlState.js` — removes `'StarCorrection'` from the
    persisted keys + STRING_KEYS; adds the four new boolean keys.
- **Purpose:** Match how the user wanted the control to feel — four
  checkboxes they can flip independently, plus a "Unicorn Dust"
  master label that treats all three as one combined wobble. The
  pedagogy remains the same: viewers can see each correction in
  isolation, any combination, or all three together.
- **Behaviour of Unicorn Dust:** acts as an override. When checked,
  all three corrections are applied regardless of the individual
  checkboxes' states (useful for "show me the full sum quickly"
  without deselecting/reselecting). When unchecked, the three
  individual flags control the math separately. Defaults to ON so
  out-of-the-box positions match Stellarium to arcseconds.
- **Revert path:** in `ephemerisCommon.js`, restore the `mode`
  parameter form; in `app.js`, swap the four booleans back to a
  single `StarCorrection` enum and restore the ternary; in
  `controlPanel.js`, reinstate the `{ key, label, select }` row; in
  `urlState.js`, swap `StarApply*` + `StarUnicornDust` back to a
  single `'StarCorrection'` string key. Remove this S017 entry.

### S017a — Defaults flipped; retrospective on the S010–S017 arc

- **Date:** 2026-04-23
- **Change:** `StarApplyPrecession`, `StarApplyNutation`,
  `StarApplyAberration` defaults flipped from `true` to `false`.
  `StarUnicornDust` stays `true`. Net behaviour: out-of-the-box the
  user sees the combined apparent-of-date corrections (Unicorn Dust
  forces them on), but unchecking Unicorn Dust immediately lands
  on a raw-J2000 view with all three individual toggles off — the
  natural "blank canvas" for adding one effect at a time. Matches
  the pedagogical intent the user stated when S014 was first
  proposed.
- **File changed:** `js/core/app.js` — only the four default values
  in the initial state block.
- **README:** thanks to Fred Espenak added to the Special Thanks
  section alongside attribution for van Gent, Bretagnon & Francou,
  Sonia Keys, commenthol, and Meeus.

**Retrospective — what the ephemeris arc covered, what worked,
what didn't.** Eight serials (S010 through S017) of ephemeris work.
Below, an honest account for future you:

**S010 — Remove heliocentric intermediates from ephemeris.js.**
First attempt was a Tychonic reframe (rename, same math) — rejected
by the user as a lie. Second attempt cut the Sun-around-Earth row
entirely and modelled each planet as a single Earth-focus Kepler
ellipse. **Worked structurally** (no heliocentric math anywhere in
the active chain) but **wrecked planet accuracy** (no retrograde,
inner planets don't librate). User accepted the trade.

**S011 — Three-pipeline split.** Broke `ephemeris.js` into a
dispatcher + three independent modules (HelioC / GeoC / Ptolemy).
Ported R.H. van Gent's Almagest JavaScript for the Ptolemy pipeline.
**Worked.** Three pipelines run every frame, ~900 ops total,
negligible cost. Van Gent's code transcribed cleanly after the
sexagesimal literals were preserved via a `sex(...)` helper.

**S012 — Star precession.** Stars had been stuck at J2000 forever,
producing ~20' drift by 2026. Added Lieske 1977 precession in
`apparentStarPosition`. **Worked immediately** — stars went from
20' off Stellarium to a few arcminutes.

**S013 — Star aberration.** Added Meeus 23.2 annual aberration.
**Worked.** Star positions dropped to sub-10" vs Stellarium, right
at the nutation residual floor.

**S014 — Star-correction mode toggle.** Added a 4-option dropdown
(precession / nutation / aberration / all). **Worked but wrong
ergonomics** — user wanted checkboxes, not a radio. Superseded by
S017 two weeks later in the same conversation.

**S015 — AstroPixels/DE405 pipeline.** Scraped Fred Espenak's
daily ephemeris tables (2019–2030, 7 bodies, 84 pages, ~520 KB JS
data). Linear interpolation between daily samples. **Worked
beautifully** — matches Stellarium to sub-arcsecond for sun and
planets, ~1' for the Moon (linear-interp residual on a fast body).
Fred Espenak cited in module header, attribution file, README.

**S016 — VSOP87 pipeline.** Bundled the full Bretagnon & Francou
1988 coefficient tables (via commenthol's MIT-licensed port; 1.26 MB
of JS). Implemented the L/B/R series evaluator, FK5 correction,
and ecliptic→equatorial rotation. **Worked.** Agrees with
AstroPixels to within ~1s RA / ~10" Dec across the planet set —
both are DE-grade. Works for any date, unlike AstroPixels which is
bounded by what Espenak publishes.

**S017 — Checkboxes for star corrections.** Converted the S014
dropdown to independent checkboxes plus a master "Unicorn Dust"
override. **Worked.** URL state persists all four booleans.

**What *didn't* work along the way:**

1. **Mercury's perihelion precession formula (user's equation):**
   user showed the Einstein formula ε = 6π/(1-e²)·(v/c)². Clarified
   this is GR perihelion precession (43"/cy for Mercury), not
   Kepler's equation — wouldn't help the 5' Saturn error.
2. **Applying star precession to Schlyter planet output.**
   Initially thought this would close the 5' Saturn HelioC gap.
   It wouldn't — Schlyter's output is already referenced to the
   ecliptic/equinox-of-date per his own documentation, so
   layering precession on top would double-count. The 5' gap is
   intrinsic to Schlyter's simplified elements (missing periodic
   perturbations from Jupiter-on-Saturn etc.).
3. **Treating the "Sun shifts between HelioC and GeoC" report as
   a bug.** The user reported it, I dug, and confirmed HelioC
   Sun === GeoC Sun bit-exactly (both route to Meeus). The
   observation was probably Ptolemy flickering during a
   multi-click switch. No fix needed.
4. **Acrux 53° discrepancy.** Turned out to be mismatched observer
   latitude between Stellarium and the sim, not a code bug.
   Matched observer state → Acrux dropped to 0.2° off (the
   ordinary precession gap S012 then fixed).

**Known issue still open (Task #147):**
Our 27-term Meeus Ch. 47 moon in `ephemerisCommon.js` is about
**2.5° off DE405** at modern dates. Affects HelioC / GeoC / VSOP87
moon outputs (Astropixels has its own DE405 moon, unaffected).
Most likely cause: a transcription error in the table or a missing
E-factor multiplier. Pre-existing, not introduced by any of the
S010–S017 work. Tracked for a later serial.

**What the user can demonstrate with this stack now:**

- Four correct geocentric pipelines (HelioC / DE405 / VSOP87 /
  Ptolemy-with-ancient-calibration), each with honest provenance
  and documented accuracy envelopes.
- Three pipelines that disagree on planet positions for different
  reasons (simplified Kepler, ancient constants, re-framed as
  Earth-focus). Users can switch modes in real time and see the
  ground-truth pipeline (DE405 or VSOP87) sit right where
  Stellarium puts them, while the other pipelines land elsewhere
  — a visible, testable demonstration.
- For the stars: each of precession, nutation, and aberration
  toggleable independently, or as a combined "Unicorn Dust"
  correction — the pedagogical point that the dominant ~20' drift
  in star positions could just as well be described as three
  separate mini motions or one compound observer wobble.

### S017b — Rename Unicorn Dust → Trepidation; AstroPixels as default source

- **Date:** 2026-04-23
- **Files changed:**
  - `js/core/app.js` — (a) state key `StarUnicornDust` renamed to
    `StarTrepidation` (default still `true`); (b) `BodySource`
    default flipped from `'geocentric'` to `'astropixels'`, so the
    sim opens with the DE405 (Espenak) pipeline driving the sky.
    Star-loop ternary now reads `s.StarTrepidation`.
  - `js/ui/controlPanel.js` — fourth bool-row key and label updated
    (`StarTrepidation` / "Trepidation"). Doc comment reframed to
    reference medieval trepidation-of-the-equinoxes as the naming
    precedent.
  - `js/ui/urlState.js` — persisted-keys list updated
    (`StarUnicornDust` → `StarTrepidation`).
  - `js/core/ephemerisCommon.js` — single doc-comment reference
    updated ("Unicorn Dust" → "Trepidation"); no behaviour change.
- **Naming rationale:** "Trepidation of the equinoxes" was a
  medieval Arabic and early-European astronomical hypothesis: an
  additional oscillation of the equinox superposed on precession,
  proposed (wrongly, as it turned out) to reconcile Ptolemaic
  parameters with observation. The name fits the toggle's
  framing — "the combined apparent wobble presented as a single
  phenomenon" — and carries historical weight appropriate to the
  sim's pedagogical intent.
- **Why AstroPixels is the new default:** the user wants the sim's
  first impression to match the real sky. DE405 agrees with
  Stellarium to sub-arcsecond, so anyone loading the page sees
  planets exactly where they belong. Switching to HelioC / GeoC /
  Ptolemy / VSOP87 then becomes a deliberate comparison action
  rather than the default starting point.
- **Revert path:** replace all `StarTrepidation` with
  `StarUnicornDust` across app.js / controlPanel.js / urlState.js /
  ephemerisCommon.js; flip `BodySource` default back to
  `'geocentric'`; remove this entry.

## S200 — Eclipse demo overhaul; Espenak table loader; ephemeris-linked playback; Meeus warning; FE prediction track placeholder; shadow/darkening hooks; autoplay queue

- **Date:** 2026-04-23
- **Files added:**
  - `scripts/scrape_eclipses.mjs` — one-time scraper that pulls Fred
    Espenak's `eclipses/solar.html` and `eclipses/lunar.html` tables
    and emits a parsed JS data module. Cached HTML in
    `/tmp/astropixels_cache/`. Throttling + UA + robots.txt honoured.
  - `js/data/astropixelsEclipses.js` — auto-generated. 44 solar + 67
    lunar = **111 events 2021-2040**, each with date, TD/UT ISO,
    type, Saros, magnitude, central duration. Attribution + JPL
    DE405 provenance baked into the file header.
  - `js/demos/eclipseRegistry.js` — builds a demo entry for every
    real eclipse. Each entry's `intro(model)` reads the active
    `BodySource`, picks the matching pipeline's sun/moon functions,
    refines the eclipse moment via the new
    `refineEclipseByMinSeparation` helper, then plants the observer
    at that pipeline's subsolar (solar) or sub-lunar (lunar) point.
    Result: the same astropixels-tabulated eclipse plays out
    *differently* under each pipeline — the pedagogy.
  - `js/demos/feEclipseTrack.js` — **PLACEHOLDER** track for FE /
    Saros-harmonic eclipse prediction. Single advisory entry; awaits
    Shane St. Pierre's resource pack (under
    `/home/alan/Documents/eclipse/`). Explicit non-faking note in
    file header per user instruction.
- **Files changed:**
  - `js/core/ephemerisCommon.js` — `findNextEclipses` now takes
    optional `sunFn` / `moonFn` parameters (default Meeus for
    backward compat). New export
    `refineEclipseByMinSeparation(approxDate, sunFn, moonFn, opts)`
    that scans ±2 h in 1-minute steps and returns the moment of
    minimum sun–moon (or sun–antimoon for lunar) separation.
  - `js/core/app.js` — five new state fields:
    `EclipseActive`, `EclipseKind`, `EclipseEventUTMS`,
    `EclipsePipeline`, `EclipseMinSepDeg`. Set by the eclipse demo's
    `intro()`. Wired only at the state level; the umbra/penumbra
    render and observer darkening are STUBS (see below).
  - `js/demos/definitions.js` — old hand-coded eclipse demos
    removed. New layout: 6 general demos + 44 solar +
    67 lunar + FE-placeholder. Every entry carries a `group` field;
    `DEMO_GROUPS` exported as the section metadata.
  - `js/demos/index.js` — `Demos` class:
    1. **Grouped rendering.** Renders a section header per
       `DEMO_GROUPS` entry; eclipse sections collapsed by default
       (click header to expand). Per-section "Play all" button.
    2. **Autoplay queue.** `playGroup(groupId)` queues every demo in
       that group; an rAF-driven watcher advances to the next
       queued demo when the current one's tween queue empties.
       Manual `play()` cancels the queue.
    3. **Stop / Next / Prev** preserved; Next honours active queue
       cursor when present.
  - `index.html` — added `<div id="meeus-warning" hidden></div>`
    inside `#view`.
  - `js/main.js` — Meeus banner controller. Watches `BodySource`;
    when set to `'heliocentric'`, `'geocentric'`, or `'vsop87'`
    (all rely on Meeus moon), shows red warning text at the bottom
    of the view explaining the ~2.5° / ~4 h gap.
  - `css/styles.css` — `#meeus-warning` styling (red on translucent
    dark, pinned bottom of view); `.demo-group-header` and
    `.demo-play-all` for the new grouped demo list; demo-list
    `max-height` raised from 240px to 380px.
- **Behaviour delivered:**
  - **(B)** Eclipse date loader / selectable demo list — ✅
  - **(C)** Ephemeris-linked playback — ✅ each pipeline refines &
    renders in its own frame.
  - **(D)** Meeus warning — ✅ red bottom banner when active source
    relies on Meeus moon.
  - **(E)** FE prediction track — ✅ structural placeholder, clearly
    marked, ready for Shane's resource-pack drop-in.
  - **(H)** Autoplay queue — ✅ "Play all" per group; watcher
    advances on `Animator.isPlaying() === false`.
- **Behaviour stubbed (not full S200 delivery — flagged for sub-serial):**
  - **(F) Dynamic umbra/penumbra ground projection** — state hooks
    are wired (`EclipseActive` etc.), and the demo's intro plants
    observer + time correctly. The 3D projection of the moon's
    shadow cone onto the FE disc geometry is non-trivial and
    deferred to a follow-up serial. The renderer can read the
    `Eclipse*` state fields when ready and project geometry without
    touching anything else; no further demo-side work needed.
  - **(G) Observer darkening inside the path** — same status as (F).
    Hook reserved; once shadow geometry exists, computing whether
    `(ObserverLat, ObserverLong)` lies inside the umbra/penumbra
    is a single point-in-cone test that gates a `NightFactor`-like
    boost.
  - **FE prediction logic** — explicit non-faking placeholder.
    Shane's resource pack lives under `/home/alan/Documents/eclipse/`
    and includes the Dimbleby PDF + 2 transcript files + an Excel
    sheet. Parsing + Saros-harmony prediction logic is a separate
    serial.
- **OCR/parse note vs supplied lists:** The user-supplied lunar list
  has 45 dates; the astropixels HTML lists 67. The 22 extra events
  are **Penumbral** lunar eclipses, which the user's list appears
  to omit (a common convention since penumbrals are subtle). All
  67 are included in the data module with `type` correctly tagged;
  the UI can filter Penumbral if a smaller list is preferred. Source
  authority preserved per user instruction.
- **Cross-pipeline eclipse comparison verified:** for the 2026-02-17
  annular solar eclipse, refined min-separation per pipeline:
  - DE405:        0.832°  (observer: −11.9°, +0.8°  — West Africa, real)
  - Ptolemy:      0.897°  (observer: −14.9°, −37.4°)
  - HelioC:       1.587°  (observer: −11.8°, −29.5°)
  - GeoC:         1.587°  (Same as HelioC — both Meeus luminaries)
  - VSOP87:       1.586°  (Same — VSOP87 delegates moon to Meeus)
  Confirms the design: each pipeline lands on its own syzygy.
- **Revert path:** delete the four S200 files
  (`scrape_eclipses.mjs`, `astropixelsEclipses.js`,
  `eclipseRegistry.js`, `feEclipseTrack.js`); restore
  `definitions.js` to the pre-S200 8-demo list; revert
  `index.js` to the simpler version (no grouping, no autoplay
  queue); remove the `Eclipse*` state fields from `app.js`; remove
  `findNextEclipses` extra parameters and `refineEclipseByMinSeparation`
  from `ephemerisCommon.js`; remove the Meeus banner from
  `main.js` and the styles + element in `index.html` /
  `css/styles.css`; remove this S200 entry.

## S201 — Eclipse demo refinements: DE405 default on reset, pause/resume, real umbra/penumbra on the ground, observer darkening

- **Date:** 2026-04-23
- **Files changed:**
  - `js/ui/urlState.js` — URL schema-version stamp (`v=201`) +
    migration. On load, if the URL's `v` is missing or lower than
    `URL_SCHEMA_VERSION`, version-gated keys (`BodySource`) are
    dropped from the restored patch so the initial-state default
    (`'astropixels'`) takes effect. Fixes the "hard reset leaves
    geocentric in place" report.
  - `js/demos/animation.js` — `Animator` gains `pause()`, `resume()`,
    and `isPaused()`. `pause()` halts the rAF chain without clearing
    the task queue; `resume()` restarts rAF and resets `_now` so the
    paused interval isn't credited as elapsed tween time.
  - `js/demos/index.js` — new **Pause/Resume** button between Prev
    and Stop. Label toggles on click; resets to "Pause" when a new
    demo is played or Stop is hit. Also: `_playSingle` now resets
    the eclipse state (`EclipseActive: false`, etc.) before each
    demo's intro so the shadow doesn't linger when switching from
    an eclipse demo to a general demo.
  - `js/demos/eclipseRegistry.js` — demo `intro()` now also emits
    `EclipseMagnitude` and `EclipseEventType` so the renderer can
    size and conditionally draw the umbra / penumbra correctly
    (no umbra for partial eclipses mag < 0.99).
  - `js/render/worldObjects.js` — **new `EclipseShadow` class**.
    Two concentric circle meshes on the disc (umbra + penumbra);
    centered at the sub-lunar ground point; sized per
    `EclipseUmbraRadiusFE` / `EclipsePenumbraRadiusFE` state
    overrides or FE-scale defaults (0.012 / 0.15). Also provides
    `computeObserverDarkFactor(model)` which returns 0..1 based
    on observer distance to shadow centre.
  - `js/render/index.js` — renderer instantiates `EclipseShadow`,
    adds it to `sm.world`, calls `eclipseShadow.update(m)` each
    frame, and pipes
    `eclipseShadow.computeObserverDarkFactor(m)` into
    `SceneManager.setEclipseDarkFactor(...)`.
  - `js/render/scene.js` — new `setEclipseDarkFactor(f)` cache +
    `render()` dims ambient + sunLight intensities and lerps the
    background toward the night colour proportional to that
    factor. Observer standing inside the umbra sees the sky
    darken to totality-like levels; in penumbra the darkening
    scales linearly with distance-from-centre.
  - `js/core/app.js` — added `EclipseMagnitude`, `EclipseEventType`,
    and `EclipseUmbraRadiusFE` / `EclipsePenumbraRadiusFE`
    optional-override state fields.
- **Acceptance of the original S201 asks:**
  - **(B)** DE405 as hard-reset default — ✅ URL schema-gate drops
    stale `BodySource` on load; initial state `'astropixels'` wins.
  - **(C)** Pause / resume — ✅ button + animator methods; tween
    queue is frozen so observer lat/long/view-mode changes during
    pause don't reset the eclipse demo.
  - **(D)** Real umbra/penumbra on the ground — ✅ new mesh group,
    visible in Heavenly Vault (drawn on disc at z ≈ 5e-4 / 4e-4).
    Umbra hidden for partial eclipses (mag < 0.99), both rendered
    for Total / Annular / Hybrid. Position tracks the sub-lunar
    point frame-by-frame.
  - **(E)** Observer darkening — ✅ point-in-concentric-disc test
    each frame; factor modulates ambient, directional sun, and
    background. Full inside umbra, linear ramp across penumbra.
- **Known limits (not-a-bug flags):**
  - Shadow shape is a flat circle — not an ellipse — because the FE
    model has the sun and moon as point-like bodies at fixed vault
    heights, so the ground projection is symmetric around the
    sub-lunar point. The real-world DE405 path of totality is a
    thin ellipse stretched along the moon's ground-track; that
    level of path fidelity is not modelled in this sim. The
    circle-approximation is the honest simplification.
  - Inside the observer's Optical Vault (first-person mode), the
    ground shadow renders on the disc beneath the camera but is
    visually obscured by the vault shell. The scene darkening is
    the primary in-vault signal that the observer is inside the
    path.
- **URL schema version:** bumped to `v=201`. Earlier URLs (with no
  `v` or `v=200`) lose their `BodySource` on load and fall back to
  `'astropixels'`. Other keys survive the migration. Future default
  changes should add keys to `VERSION_GATED_KEYS` and bump the
  constant.
- **Revert path:** drop `EclipseShadow` from `worldObjects.js`;
  remove its instantiation + update + `computeObserverDarkFactor`
  call in `render/index.js`; delete
  `SceneManager.setEclipseDarkFactor` + the eclipse-darken folds
  in `render()`; remove S201 fields from app.js initial state; revert
  `urlState.js` schema-version block; drop `Animator.pause/resume`
  and the Pause/Resume button; remove this S201 entry.

## S202 — True derived umbra/penumbra ground projection (replaces S201's circular decal)

- **Date:** 2026-04-23
- **Files changed:**
  - `js/render/worldObjects.js` — `EclipseShadow` class **rewritten
    end-to-end**. Old behaviour (two `THREE.CircleGeometry` meshes
    snapped to the sub-lunar point, isotropic scale) is gone. New
    behaviour derives the umbra + penumbra ground footprints from
    the actual Sun → Moon → ground cone-plane intersection:
    1. **Sample** 48 points around the sun-disk edge (disk plane
       perpendicular to the sun-moon axis).
    2. For each sun-edge point, build a ray through the **same-side**
       moon-edge point (umbra tangent) and the **opposite-side**
       moon-edge point (penumbra tangent).
    3. Extend each ray to `z = 0` → one ground boundary point per
       sample. The umbra/penumbra boundary polygons are these
       48-sample loops.
    4. The umbra cone apex is at `A_u = S + dhat · D · r_s/(r_s − r_m)`;
       if `A_u.z > 0` (apex above the disc), the umbra never reaches
       the ground and its mesh is suppressed — correct annular-style
       behaviour driven by actual geometry, not by the tabulated
       magnitude.
    5. A `THREE.ShapeGeometry` is rebuilt each frame from the 48
       boundary samples; that's the mesh the user actually sees.
  - `js/core/app.js` — two new state fields for the body radii that
    drive the cone geometry: `EclipseSunRadiusFE`,
    `EclipseMoonRadiusFE`. S201's ground-radius overrides
    (`EclipseUmbraRadiusFE`, `EclipsePenumbraRadiusFE`) are now
    deprecated (kept in state for URL-back-compat, ignored by
    the S202 renderer).
- **Defaults and the umbra-reach condition:** umbra reaches the
  ground only when `Mz/Sz < r_m/r_s`. With default
  `SunVaultHeight = 0.5`, `MoonVaultHeight = 0.4`, `Mz/Sz = 0.8`,
  so `r_m/r_s` must exceed 0.8 for a ground umbra to appear. The
  S202 defaults are `r_s = 0.030`, `r_m = 0.025` (ratio 0.833),
  chosen to just clear that threshold so overhead-conjunction
  demos see a small but visible umbra. Sizes can be overridden
  per-event via the state fields above.
- **Elliptical footprint by construction:** when the sun-moon axis
  is tilted from the disc normal, the cone-plane intersection is an
  ellipse (aspect = 1 / cos(tilt) for the cone's projected radii).
  Verified numerically:
  - Overhead conjunction    → circle, aspect 1.000
  - 45° sun-moon tilt       → ellipse, aspect ≈ 1.44 (umbra),
                              ≈ 1.91 (penumbra)
  - Low-sun near horizon    → heavily elongated ellipse, offset
                              several tenths of an FE radius from
                              the sub-lunar point.
  The S201 circular decal could not produce any of this.
- **Observer occupancy:** replaced the point-in-circle test with
  **point-in-polygon** against the 48-sample umbra / penumbra
  boundaries. Full dark inside umbra; inside penumbra a smooth
  linear falloff — 1 at the polygon centroid → 0 at the boundary
  in the observer's direction, via a segment-ray intersection
  that walks the 48 edges. The darkening thus tracks the *shape*
  of the derived shadow, not a fake radial circle.
- **Preserved S201 behaviour:** eclipse demo selection, ephemeris-
  linked playback, pause/resume, Meeus warning banner, autoplay
  queue, Heavenly/Optical orientation — all untouched.
- **Known limitations (honest):**
  - Body radii are constants; real DE405 uses Sun/Moon physical
    radii and actual sun-moon distances per date. The sim's
    derived shadow *shape* evolves with eclipse geometry per the
    active pipeline's sun/moon positions, but the *scale* is
    governed by these two chosen FE-scale radii. A future serial
    can couple `r_s`/`r_m` to the astropixels event magnitude +
    ΔT to get true scale.
  - The FE vault is a flattened dome, not a point-light + point-
    moon configuration. The sun and moon are treated as flat disks
    perpendicular to the sun-moon axis (standard shadow-cone
    idealisation). Higher-fidelity geometry (e.g. treating the
    moon as a sphere) would not change the ground footprint shape
    noticeably; it's the cone-plane intersection that shapes the
    ellipse.
- **Revert path:** re-add a `THREE.CircleGeometry` based
  `EclipseShadow` (S201 form); remove `EclipseSunRadiusFE` +
  `EclipseMoonRadiusFE` state; restore the sub-lunar position
  snap; remove this entry.

## S204 — (REVERTED)

- **Date:** 2026-04-23
- **Status:** Implemented then reverted at user request ("didn't work").
- **What it had tried:** Besselian-equivalent shadow-path overlay —
  scrape the NASA Five Millennium Solar Eclipse Catalog
  (`5MCSEcatalog.txt`) to enrich each solar event with
  greatest-eclipse lat/long, gamma, sun altitude/azimuth, path
  width, central duration; new `EclipseShadowPath` class sweeping
  the S202 cone-plane math across ±2 h of 120 time samples to
  trace umbra/penumbra centerline polylines + a perpendicular-
  offset ribbon mesh on the disc. User-visible result did not
  match intent.
- **Revert performed:** deleted
  `scripts/enrich_eclipses_with_5mcse.mjs`; re-ran S200's
  `scrape_eclipses.mjs` to regenerate
  `js/data/astropixelsEclipses.js` without 5MCSE fields;
  removed `EclipseShadowPath` class + module-level
  `_coneFootprint`/`_polyCentroid` helpers from
  `js/render/worldObjects.js` (S202 `EclipseShadow` still has its
  own inline cone-plane math, unaffected); removed the class
  instantiation, per-frame update call, supporting imports
  (`bodyRADec`, `greenwichSiderealDeg`, `celestLatLongToVaultCoord`,
  `vaultCoordToGlobalFeCoord`), and `_bodyFeCoordAt` helper from
  `js/render/index.js`; removed `ShowEclipsePath` state field from
  `js/core/app.js`. Syntax-checked all three files + smoke-tested
  module loads; sim is back to S202 + S203 state.
- **S202 live instant-shadow unchanged.** Other unrelated serials
  (S200 demo system, S201 pause/resume + Meeus banner, S202 cone-
  plane live shadow, S203 FE Saros predictor if present) untouched.

## S205 — Disable eclipse ground-shadow feature (temporary)

- **Date:** 2026-04-23
- **Files changed:**
  - `js/core/app.js` — new state field `ShowEclipseShadow`, default
    `false`.
  - `js/render/index.js` — `Renderer.frame()` gates the S202
    `eclipseShadow.update(m)` call + the
    `computeObserverDarkFactor` → `SceneManager.setEclipseDarkFactor`
    pipe on `state.ShowEclipseShadow`. When false, the shadow
    group is hidden and the dark factor is forced to 0.
- **What still works:** the eclipse demo system itself is
  unaffected — date selection, ephemeris-linked refinement,
  ephemeris-driven sun/moon playback, Meeus warning banner,
  pause/resume, autoplay queue all continue to run. Eclipse state
  fields (`EclipseActive`, `EclipseKind`, `EclipseMagnitude`, etc.)
  are still set by the demo intro; just no ground render or scene
  dim.
- **Why:** temporary shelving. S201's first shadow attempt was a
  circular decal; S202 replaced it with a derived cone-plane
  ellipse; S204 added a full path sweep and was reverted. Disabling
  the rendered feature for now so it doesn't distract from other
  work on the sim. Will return to it with fresh direction on what
  the visual should look like.
- **Re-enable:** flip `ShowEclipseShadow` default to `true` in
  `app.js`, or add a `row.bool` toggle to the Ephemeris group in
  `controlPanel.js` so it can be switched live.
- **Revert path:** remove the `ShowEclipseShadow` state field;
  restore the direct `eclipseShadow.update(m)` + darken pipe in
  `render/index.js`; remove this entry.

## S206 — Dynamic right-edge vertical strip + lowest-visible-ring anchoring for the bottom azimuth band

- **Date:** 2026-04-23
- **Files changed:**
  - `js/render/worldObjects.js` — two function-body refactors in
    the optical-vault overlay; no structural additions, no new
    state.
- **Revision history:**
  - **v1** moved the fixed offsets (`0.80 → 0.95` of half-hFOV;
    `0.03 → 0.01` of FOV above horizon; `0.35 → 0.45` of FOV above
    view-bottom). Closer to target, but still used continuous
    offsets — not grid-anchored, so labels floated between
    intersections rather than sitting on them.
  - **v2** replaced both continuous offsets with grid-snap
    anchoring. Labels began sitting on actual ring × meridian
    intersections, computed each frame from viewport geometry.
    However the grid itself was windowed in VERTICAL FOV
    (`fov · 0.7 + cad.major`), which falls short of the viewport's
    right edge in the 5°–8° FOV band and the top of the 5° cadence
    band, so labels anchored to meridians that weren't actually
    emitted.
  - **S206a (current)** fixes the windowing with horizontal FOV,
    switches the right-edge label from `floor` to `round` to track
    approaching meridians, and drops the small bottom-label margin
    so labels sit exactly on the lowest visible ring.
- **S206a details (three linked edits, all in
  `js/render/worldObjects.js`):**
  1. **Meridian windowing uses hFov**
     (`_updateRefinedScale(s, c)` — new second arg for
     `c.ViewAspect`). Replaced
     `halfWindow = fov · 0.7 + cad.major` with
     `halfWindow = hFov / 2 + 2 · cad.major`, where `hFov` is the
     true horizontal field angle derived from `fov` and the
     viewport aspect. Guarantees the emitted meridian arcs extend
     at least two cadence multiples past the screen edges at every
     FOV × aspect combination, so the edge strips have real grid
     lines to anchor to.
  2. **Right-edge labels anchor to the approaching meridian via
     per-label azimuth solve** (`_updateElevScale`).
     - `approachingAz = round((heading + hFov/2) / cadenceAz) · cadenceAz`
       selects the meridian closest to the right edge (inside or
       just outside).
     - Per-label azimuth solve places each elevation's label so
       its projected screen-X matches the approaching meridian's
       screen-X: solve `sin A′ − T cos P cos A′ = T tan e′ sin P`
       for `A′ = atan2(T cos P, 1) + asin(T·tan e′·sin P / R)`,
       where `T = tan(approachingAz − heading)` (clamped to just
       inside the frustum), `R = √(1 + T² cos² P)`, and
       `e′ = atan((h/r)·tan E)` is the flattened-vault direction
       elevation for the ring at true elevation E.
     - `sinArg` clamped to `[−1, +1]` instead of hiding: labels
       whose rings can't reach the target screen-X at the current
       pitch land at the closest achievable azimuth rather than
       vanishing.
     - Fixed `cap = 75°` elevation ceiling across all cadences
       (was 75° coarse / 85° refined). Stops labels from riding
       off the top of the view at steep pitch and keeps the column
       clear of the zenith convergence zone.
     - **ff3 (reverted)**: a camera-frame positioning attempt with
       hard-fixed `x_cam` and clamped `y_cam` was tried and
       reverted at user request ("didn't work"). Current shipped
       form is the ff2 per-label azimuth solver above.
- **S206c (2026-04-24) — Optical → Heavenly transition fix +
  about.md feature breakdown.**
  - **Bug:** transitioning back from Optical Vault to Heavenly Vault
    spread the azimuth-degree ring out up the optical-vault cap. In
    `ObserversOpticalVault.update()` the band elevation for the
    cardinals + coarse-azimuth labels is sourced from
    `_labelBandElevRad(s, fovDeg)`, which uses
    `state.CameraHeight` as first-person pitch. In Heavenly mode
    the same key is the ORBIT elevation above the disc (typically
    25–45°), so the S206a "lowest visible ring" rule snapped
    `bandElev` to 20°, 45°, etc. — labels rode the cap instead of
    its rim.
  - **Fix:** single conditional in `_updateCardinals`:
        const bandElev = s.InsideVault
          ? this._labelBandElevRad(s, bandFovDeg)
          : 0.03;
    Optical still uses the full S206a pitch-tracking / lowest-ring
    rule; Heavenly falls back to a small fixed 0.03 rad (≈ 1.7°)
    horizon offset so the degree ring always sits on the cap's rim
    when viewed from the orbit camera. No mode-specific anchoring
    differences beyond that; degree values, spacing, and
    attachment to the shared azimuth framework are unchanged.
  - **Files changed:** `js/render/worldObjects.js` (one conditional
    added in `ObserversOpticalVault.update` around the
    `bandElev` assignment); `about.md` (rewritten — see below).
  - **Documentation:** `about.md` rewritten end-to-end to
    document the current feature set. Now includes a full tab-by-
    tab breakdown of View / Time / Show / Tracker / Demos,
    individual control descriptions, HUD-panel rundown, URL-state
    persistence note, and third-party credits (Espenak, van Gent,
    Bretagnon & Francou, Sonia Keys + commenthol, Meeus, Shane,
    Bislin). Going forward, `about.md` is the source-of-truth
    feature doc; new features get a corresponding entry there as
    part of the same serial.
  - **Revert path (S206c only):** remove the `s.InsideVault ? … : 0.03`
    ternary and restore
    `const bandElev = this._labelBandElevRad(s, bandFovDeg);`;
    replace `about.md` with the pre-S206c version from git; remove
    this sub-block.
  - **S206c (follow-up, 2026-04-24) — snap labels to the cap rim
    in Heavenly.** Initial S206c fix corrected the elevation offset
    but the cardinals + coarse azimuth labels still floated at
    world radius **1.14** while the optical-vault cap's horizontal
    rim is at world radius `r ≈ 0.5`. From the orbit camera that
    produced a giant outer ring of degree numerals around the
    small cap (image #173 in Alan's review). Replaced the
    radius-1.14 placement in Heavenly with a flattened-vault
    projection onto the cap surface:
        if (s.InsideVault) {
          posXY = cardR * cosE;
          posZ  = cardR * sinE + eyeH;
        } else {
          const ePrime = Math.atan((h / r) * Math.tan(bandElev));
          posXY = r * Math.cos(ePrime);
          posZ  = h * Math.sin(ePrime);
        }
    Same `e' = atan((h/r)·tan E)` projection the elevation-scale
    labels already use (`_updateElevScale`), so the degree ring
    now coincides with the cap rim at the chosen `bandElev`
    (≈ 1.7°). Optical view is unchanged: it still uses
    `cardR = 1.14` / `1.14` for the floating reading-band.
    **Files:** `js/render/worldObjects.js` (~30 lines around the
    cardinals + azi-label position loops in `update()`).
    **Revert path (follow-up only):** restore the original
    `(cardR / rSafe) * cosE * b[i]` and
    `(1.14 / rSafe) * cosE * Math.cos(phi)` position formulas;
    drop the `posXY / posZ / aziXY / aziZ` block.
  3. **Bottom label strip sits on the ring**
     (`_labelBandElevRad`). Removed the residual `0.5 % of FOV`
     margin so `labelElev = lowestRingE` exactly. When horizon is
     visible → labels on the horizon; when tilted up past horizon
     → labels sit on the next visible ring (no floating gap).
- **What changed visually (v2 + S206a combined):**
  - Right-edge 0° / 15° / 30° / 45° / 60° / 75° labels: on a real
    meridian at the right edge of the viewport. Labels track the
    **closest** cadence-grid meridian as the user pans; the strip
    rides the edge instead of lagging inward.
  - Bottom azimuth degree labels + N / E / S / W cardinals: sit
    exactly on the lowest visible elevation ring (no residual
    margin). With horizon in view → labels ON the horizon; when
    tilted up past horizon → labels on the next visible ring
    (15° / 30° / etc. at coarse cadence; 5° or 1° at refined).
  - **Grid extends to the screen edges** in every FOV regime —
    previously the 5°–8° vertical-FOV band (1° cadence) and the
    top of the 5° cadence band produced a narrow central grid
    strip; now meridians are emitted across the full horizontal
    FOV + 2 cadence units of margin.
- **What did NOT change:**
  - Ring / meridian geometry; cadence ladder; labelled angular
    values; orientation persistence; zoom ladder; active-meridian
    highlight; refined-az ticks; tracker HUD; eclipse demos.
- **Revert path (S206a):** restore `halfWindow = fov · 0.7 + cad.major`
  and the `_updateRefinedScale(s)` one-arg signature; restore
  `Math.floor` on the right-edge label snap; restore
  `labelElev = lowestRingE + 0.005 · fovDeg`.
- **Revert path (full S206):** also restore the continuous-offset
  calculations (`azOffsetDeg = 0.80 · hFov/2`; `floorDeg = 0.03 · fov`;
  `trackDeg = pitch − 0.35 · fov`); remove this entry.
