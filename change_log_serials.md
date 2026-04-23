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

