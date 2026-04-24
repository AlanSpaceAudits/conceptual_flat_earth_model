# Serial change log

Every change is assigned a serial `SNNN`. Entries are executed actions only —
date, files touched, what changed, revert path. No narrative.

Format:
- **Serial — title**
  - **Date** (UTC if known)
  - **Files changed**
  - **Change**
  - **Revert path**

---

## S000 — Baseline

- **Date:** 2026-04-22
- **Files changed:** n/a (reference snapshot)
- **Change:** Reference point. No code changes.
- **Revert path:** n/a.

## S001 — Refined DMS azimuth scale (Optical)

- Refined azimuth tick/label layer at sub-degree cadence in Optical mode.
- Files: `js/render/worldObjects.js`.

## S002 — OpticalZoom split from orbit Zoom

- Separated Optical FOV control into `OpticalZoom`; orbit Zoom unchanged.
- Files: `js/core/app.js`, `js/render/scene.js`, `js/ui/mouseHandler.js`.

## S003 — Refined label text-sprite sizing

- Sub-degree label sprite sizing algorithm.
- Files: `js/render/worldObjects.js`.

## S004 — Refined meridian-arc grid

- Refined meridian arcs on optical hemisphere at finer cadence when zoomed.
- Files: `js/render/worldObjects.js`.

## S005 — reserved (no edit)

## S006 — Optical ground→sky directional guide; cadence ladder

- Three-tier wheel cadence (15°/5°/1°) and connected heading→arc guide.
- Files: `js/render/worldObjects.js`, `js/ui/mouseHandler.js`, `js/main.js`.

## S007 — Observer elevation + right-side elevation scale

- Lift observer above disc (camera only); right-edge elevation scale.
- Files: `js/core/app.js`, `js/render/worldObjects.js`, `js/render/scene.js`,
  `js/ui/controlPanel.js`.

## S008 — Refined altitude rings

- Extra altitude rings at refined cadence.
- Files: `js/render/worldObjects.js`.

## S009 — Cel Nav starfield + multi-target Tracker; PermanentNight

- 58-star Nautical Almanac catalogue with its own render and Tracker HUD.
- Files: `js/core/celnavStars.js`, `js/core/app.js`, `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.

## S010 — GeoC pipeline (Earth-focus Kepler)

- Single-ellipse geocentric pipeline.
- Files: `js/core/ephemerisGeo.js`, `js/core/ephemeris.js`.

## S011 — Helio / Geo / Ptolemy router

- Split `ephemeris.js` into per-pipeline modules; router selects source.
- Files: `js/core/ephemeris.js`, `js/core/ephemerisHelio.js`,
  `js/core/ephemerisGeo.js`, `js/core/ephemerisPtolemy.js`.

## S012 / S013 / S014 — Star apparent-of-date corrections

- Precession, nutation, aberration options applied to J2000 catalogue.
- Files: `js/core/ephemerisCommon.js`, `js/core/app.js`, `js/ui/controlPanel.js`.

## S015 — AstroPixels (DE405) pipeline

- Scrape + bundle + runtime lookup for Espenak DE405 tables, 7 bodies, 2019–2030.
- Files: `scripts/scrape_astropixels.mjs`, `js/data/astropixels.js`,
  `js/core/ephemerisAstropixels.js`, `js/core/ephemeris.js`.

## S016 — VSOP87 pipeline

- Ported VSOP87 coefficient tables + evaluator for 5 planets + earth.
- Files: `js/data/vsop87/*`, `js/core/ephemerisVsop87.js`, `js/core/ephemeris.js`.

## S017 — Four independent star-correction checkboxes + Trepidation master

- Replaced enum dropdown with four bools + master toggle.
- Files: `js/core/app.js`, `js/ui/controlPanel.js`, `js/ui/urlState.js`.

## S200 — Eclipse demo overhaul

- Scraper + registry + autoplay queue + Meeus-moon warning banner.
- Files: `scripts/scrape_eclipses.mjs`, `js/data/astropixelsEclipses.js`,
  `js/demos/eclipseRegistry.js`, `js/demos/definitions.js`, `js/main.js`.

## S201 — Eclipse: default + pause + shadow render

- Pause/resume in demo panel; initial circular ground-shadow decal.
- Files: `js/render/worldObjects.js`, `js/demos/index.js`, `js/core/app.js`.

## S202 — Derived umbra/penumbra ground shadow

- Replaced S201 decal with cone-plane intersection from sun+moon radii.
- Files: `js/render/worldObjects.js`, `js/core/app.js`.

## S204 — (REVERTED)

- Besselian path-sweep overlay attempt. Reverted.
- Files: n/a (removed).

## S205 — Disable eclipse ground-shadow

- Hidden behind `ShowEclipseShadow` flag (default false); S202 math intact.
- Files: `js/render/worldObjects.js`, `js/render/index.js`, `js/core/app.js`.

## S206 — Optical Vault label-strip rework

- Right-edge elevation column tracks closest approaching meridian; bottom
  azimuth strip anchors to lowest visible elevation ring; grid fills horizontal
  FOV + margin.
- Sub-revisions S206a, S206c folded in. S206a-ff3 attempt reverted.
- Follow-ups: cap-rim snap for cardinals/azi labels in Heavenly;
  LongitudeRing rotation so 0° aligns with observer compass-north.
- Files: `js/render/worldObjects.js`.

## S207 — Testing-rebaseline defaults

- Reset defaults: llama figure, lat 45 / long 15, 2019-03-24 21:04 UTC (CST),
  OpticalZoom 1.0, CameraHeight 10, VaultHeight 0.4, OpticalVaultHeight 0.14,
  celnav starfield, blank map projection, PermanentNight on, tracker [sun,moon],
  various Show toggles repositioned. Autoplay starts running (Day preset).
  Demo auto-restart from `demo=` URL param disabled. URL schema bumped.
- Files: `js/core/app.js`, `js/ui/autoplay.js`, `js/ui/urlState.js`.

## S208 — Observer.Elevation binds to CameraHeight

- Row in Observer group now drives gaze pitch (0–90°).
- Files: `js/ui/controlPanel.js`.

## S209 — Mode-dependent Optical Vault (hemisphere in Optical)

- `c.OpticalVaultHeightEffective` = R in Optical, user H in Heavenly.
- Object projection + cap mesh + stars + dec circles + pole markers all use
  effective height. `OpticalVaultHeight` default 0.5. Elevation-scale labels
  drop ePrime (identity when H=R). URL schema bumped.
- Files: `js/core/app.js`, `js/render/worldObjects.js`, `about.md`,
  `js/ui/urlState.js`.

## S210 — Constellation J2000 position refresh

- All positions to 4-decimal Hipparcos/SIMBAD values. UMi ε RA corrected
  (244.35→251.49), UMi η RA corrected (239.84→244.38), Gem index 6
  retargeted to Propus. Cel-nav crossovers match celnavStars.js bit-for-bit.
- Files: `js/core/constellations.js`, `js/render/constellations.js`.

## S211 — Mouse elevation readout + load-in at max zoom-out

- `MouseElevation` state + readout row in Observer group.
- Default `OpticalZoom = 1.0`, `OPTICAL_ENTRY_PITCH = 7.5` (top viewport = 45°).
- New `readoutRow` row type. URL schema bumped + `OpticalZoom` gated.
- Files: `js/core/app.js`, `js/ui/mouseHandler.js`, `js/ui/controlPanel.js`,
  `js/main.js`, `js/ui/urlState.js`.

## S212 — Mouse azimuth readout + exact pinhole math

- `MouseAzimuth` state + row; both readouts use exact pinhole formula
  `az = H + atan2(kx, cos P − ky·sin P)`.
- Files: `js/core/app.js`, `js/ui/mouseHandler.js`, `js/ui/controlPanel.js`.

## S213 — Optical Vault Grid toggle

- `ShowOpticalVaultGrid` hides wire / axes / refined meridians; overrides
  ShowAzimuthRing so az + elev labels also hide.
- Files: `js/core/app.js`, `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.

## S214 — Suppress constellation-point duplicates of cel-nav stars

- Per-star `celnav` tag in CONSTELLATIONS; renderer parks duplicate points
  off-screen while keeping line endpoints.
- Files: `js/core/constellations.js`, `js/render/constellations.js`.

## S215 — σ Octantis + celestial-pole toggle

- Octans entry with σ Oct. `ShowCelestialPoles` gates NCP/SCP dots.
- Files: `js/core/constellations.js`, `js/core/app.js`,
  `js/render/worldObjects.js`, `js/ui/controlPanel.js`, `js/ui/urlState.js`.

## S216 — Ephemeris-comparison toggle in Tracker

- `ShowEphemerisReadings` (default off) shows 5-pipeline RA/Dec block for
  sun/moon/planets. Stars always compact (az+el only).
- Files: `js/core/app.js`, `js/ui/controlPanel.js`, `js/ui/urlState.js`.

## S217 — All catalogued stars trackable

- Added `id / name / mag` to every non-cel-nav star; exported
  `CATALOGUED_STARS` + `cataloguedStarById`. Shared `projectStar` helper.
  Tracker `star:<id>` searches both catalogues.
- Files: `js/core/constellations.js`, `js/core/app.js`, `js/ui/controlPanel.js`.

## S218 — Specified Tracker Mode + white star GPs

- `SpecifiedTrackerMode` hides non-tracked sun/moon/planets/stars + random
  starfield + constellation lines. `TRACKED_GP_COLORS.star` → white.
- Files: `js/core/app.js`, `js/render/index.js`, `js/render/worldObjects.js`,
  `js/render/constellations.js`, `js/ui/controlPanel.js`, `js/ui/urlState.js`.

## S219 — Tracker button label colours

- Per-button inline `color` matches in-scene marker pigment.
- Files: `js/ui/controlPanel.js`.

## S220 — Swap cel-nav ↔ constellation star pigment

- Cel-nav warm-yellow, constellations white (in the field, GPs, Tracker buttons).
  Per-star `info.gpColor` for precise GP pigment.
- Files: `js/render/worldObjects.js`, `js/render/constellations.js`,
  `js/core/app.js`, `js/ui/controlPanel.js`.

## S221 — Uranus + Neptune via AstroPixels

- Scraper extended; 24 fresh tables 2019–2030. `PLANET_NAMES` +
  `BODY_NAMES` extended. Other pipelines return `{ra: NaN, dec: NaN}` for
  unsupported bodies; Tracker HUD renders NaN as `—`. Pluto absent (not on
  AstroPixels).
- Files: `scripts/scrape_astropixels.mjs`, `js/data/astropixels.js`,
  `js/core/ephemeris.js`, `js/core/ephemerisHelio.js`,
  `js/core/ephemerisGeo.js`, `js/core/ephemerisPtolemy.js`,
  `js/core/ephemerisVsop87.js`, `js/core/app.js`, `js/render/index.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.

## S222 — Jupiter light-orange + per-planet GP pigments

- Jupiter `#e8d09a → #ffa060`. `PLANET_GP_COLORS` table; planet tracker
  branch stamps `info.gpColor`.
- Files: `js/render/index.js`, `js/ui/controlPanel.js`, `js/core/app.js`.

## S223 — Projection rays (true → optical projection)

- `ShowProjectionRays`: straight segment per body from heavenly coord to
  optical coord, hidden when elevation ≤ 0°. Stars excluded.
- Files: `js/core/app.js`, `js/render/index.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.

## S224 — Sun-anchored planet/moon altitudes; Facing→Azi

- Moon range = `SUN_RANGE · (28.50/23.44)`. Planet `PLANET_BASELINE` zeroed;
  planet dec-norm on 23.44° basis. Observer row label `Facing → Azi`,
  moved under Elevation.
- Files: `js/core/app.js`, `js/ui/controlPanel.js`.

## S225 — STM filter applied to rays + sun/moon GP lines

- `ShowVaultRays` / `ShowOpticalVaultRays` / `ShowProjectionRays` /
  sun-moon GP dashed lines all honour Specified Tracker Mode.
- Files: `js/render/index.js`.

## S226 — Dark Background toggle; LongitudeRing adaptive palette

- `DarkBackground` forces scene to night colour. `LongitudeRing._palettes`
  flips numerals + ticks between grey (light) and white (dark).
- Files: `js/core/app.js`, `js/render/scene.js`, `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.

## S227 — Hide heavenly-vault stars in Optical

- `CelNavStars.domePoints`, random `Stars.domePoints`,
  `Constellations.showTrueVault` all gated on `!InsideVault`.
- Files: `js/render/worldObjects.js`, `js/render/constellations.js`.

## S228 — Clear All Tracked button

- New `clickRow` row type. Button in Tracker/Object sets `TrackerTargets: []`.
- Files: `js/ui/controlPanel.js`.

## S229 — Code-comment and changelog sanitation

- Removed narrative commentary, preamble blocks, and user-intent / authorial
  references from source files and this changelog. Kept only factual technical
  notes where non-obvious. S### markers stripped from inline comments; the
  changelog remains the single source of change history.
- Files: every file in `js/` except backups + test data, plus
  `change_log_serials.md`.
- Revert path: `git checkout v-s000228 -- .` restores the pre-sanitation state.

## S230 — New default state

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/ui/urlState.js`.
- **Change:**
  - Figure: llama → bear.
  - ObserverLat / ObserverLong: 45 / 15 → 32 / −100.8387.
  - ObserverHeading: 0 → 357.3098.
  - CameraDirection: 14 → −95.4. CameraHeight: 10 → 7.5.
  - Zoom: 4.67 → 3.19. RayParameter: 1 → 2.
  - Show toggles: FeGrid, LatitudeLines, GroundPoints, FacingVector,
    DecCircles, LongitudeRing, OpticalVaultGrid, CelestialPoles → false.
    Vault, DarkBackground → true.
  - MapProjection: blank → ae. PermanentNight: true → false.
  - TrackerTargets default = sun + moon + 7 planets.
- URL schema bumped 211 → 230; gated keys expanded to cover every
  changed default.
- Revert: `git checkout v-s000229 -- js/core/app.js js/ui/urlState.js`.

## S231 — Heavenly Vault default off

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`.
- **Change:** `ShowVault: true → false`.
- **Revert:** `git checkout v-s000230 -- js/core/app.js`.

## S232 — URL schema bump for S231

- **Date:** 2026-04-24
- **Files changed:** `js/ui/urlState.js`.
- **Change:** `URL_SCHEMA_VERSION: '230' → '231'` so existing URL hashes
  stamped at v=230 with `ShowVault=1` drop that key on restore and pick
  up the S231 default (false).
- **Revert:** `git checkout v-s000231 -- js/ui/urlState.js`.

## S233 — Bottom-bar layout + time transport controls

- **Date:** 2026-04-24
- **Files changed:** `index.html`, `js/main.js`, `js/ui/controlPanel.js`,
  `css/styles.css`.
- **Change:**
  - Removed side `<aside id="panel">`; grid is now single-column
    `header / view / desc`.
  - Added `#bottom-bar` (built by `buildControlPanel`) pinned to the
    bottom of `#view`: rewind / play-pause / fast-forward buttons +
    live speed readout on the left, tab buttons on the right.
  - Each tab button toggles a `.tab-popup` that slides up above the
    bar and overlays the canvas. Clicking the same tab closes the
    popup; clicking another switches. Clicking the canvas outside
    popup/bar also closes.
  - Inside each popup, every group (Observer, Camera, Vault of the
    Heavens, Optical Vault, Body Vaults, Rays, etc.) is now a
    collapsible `.group`: header click toggles body visibility,
    arrow rotates. Groups start collapsed.
  - Time tab grew a collapsible `Autoplay` group hosting the
    existing `Autoplay` panel.
  - Rewind button: negates speed if positive; grows magnitude if
    already negative. FF: mirror. Both auto-start playback.
  - Meeus warning bottom offset bumped `0 → 44px` to clear the bar.
- **Revert:** `git checkout v-s000232 -- index.html js/main.js
  js/ui/controlPanel.js css/styles.css`.

## S234 — Clip body / #app / #view so sim fills 100vh exactly

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`.
- **Change:** added `overflow: hidden` to `html`, `body`, `#app`,
  `#view`, plus `min-height: 0` on `#app` and `#view`. Prevents the
  canvas or popup from pushing content past the viewport.
- **Revert:** `git checkout v-s000233 -- css/styles.css`.

## S235 — Raise Aether Cosmology logo above the bottom bar

- **Date:** 2026-04-24
- **Files changed:** `index.html`.
- **Change:** `#logo` inline `bottom: 16px → 60px` (44 px bar + 16 px
  padding) so the logo clears the transport bar.
- **Revert:** `git checkout v-s000234 -- index.html`.

## S236 — Transparent info bar above the menu bar

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`, `css/styles.css`.
- **Change:** added `#info-bar` inside `#view`, pinned at
  `bottom: 44 px` with `height: 26 px`, transparent background,
  monospace. Slots: Lat, Lon, El (= CameraHeight), Az (=
  ObserverHeading), separator, Mouse El, Mouse Az. Live-refreshed
  on every model update. `pointer-events: none` so it doesn't
  intercept canvas drags. Meeus warning bottom bumped `44 → 70 px`
  to clear the new strip.
- **Revert:** `git checkout v-s000235 -- js/ui/controlPanel.js
  css/styles.css`.

## S237 — Center transport controls + vault-swap button

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`, `css/styles.css`.
- **Change:**
  - Added a `.bar-left` spacer (flex: 1) before the `.time-controls`
    so the rewind / play-pause / fast-forward cluster sits centered
    between it and the `.tabs` block (flex: 1) on the right.
  - Added a vault-swap button at the head of the cluster. Icon
    `👁` when in Heavenly, `🌐` when in Optical; click toggles
    `InsideVault`. `aria-pressed` mirrors state.
- **Revert:** `git checkout v-s000236 -- js/ui/controlPanel.js
  css/styles.css`.

## S238 — Drop clip plane from optical-vault constellation lines/points

- **Date:** 2026-04-24
- **Files changed:** `js/render/constellations.js`.
- **Change:** removed `clippingPlanes` from `sphereStars` and
  `sphereLines` materials. Below-horizon endpoints are already parked
  at z = −1000 in the update loop; the `clipBelowDisc` plane added
  per-fragment clipping that broke constellation outlines at certain
  camera pitches.
- **Revert:** `git checkout v-s000237 -- js/render/constellations.js`.

## S239 — Play/pause button resets speed to default

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** `btnPlay` now calls `autoplay.setSpeed(1/24)` before
  `toggle()`, so clicking the play/pause in the transport bar always
  resets the speed to the Day preset regardless of prior rewind/FF
  state.
- **Revert:** `git checkout v-s000238 -- js/ui/controlPanel.js`.

## S240 — Disable frustum culling on dynamic star / constellation meshes

- **Date:** 2026-04-24
- **Files changed:** `js/render/constellations.js`,
  `js/render/worldObjects.js`.
- **Change:** set `frustumCulled = false` on `Constellations.domeStars`,
  `sphereStars`, `domeLines`, `sphereLines`, plus `Stars.domePoints` /
  `spherePoints` and `CelNavStars.domePoints` / `spherePoints`. Their
  `BufferGeometry.boundingSphere` is computed once from initial zero
  positions; the per-frame buffer updates never refresh it, so the
  culler was dropping whole meshes when the camera pitched away from
  the stale origin — manifesting as constellation outlines breaking
  and not returning when pitch changed.
- **Revert:** `git checkout v-s000239 -- js/render/constellations.js
  js/render/worldObjects.js`.

## S241 — Anchor tab popup to its originating tab button

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`, `css/styles.css`.
- **Change:**
  - `.tab-popup` is now `position: absolute; bottom: 0;` with
    rounded top corners and a soft shadow. Width is fixed per
    open, not `left:0 / right:0` full-bleed.
  - `positionPopup(i)` on open: measures the tab's bounding rect,
    pins the popup's right edge to the tab's right edge, sets
    width to 380 px (Tracker / Demos get 560 px for the large
    button grid / demo list). Re-anchors on window resize while
    a popup is open.
- **Revert:** `git checkout v-s000240 -- js/ui/controlPanel.js
  css/styles.css`.

## S242 — Mutually exclusive collapsible groups within a popup

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** `buildGroup` now accepts a shared `popupGroups` set.
  Expanding a group closes every sibling still open, so only one
  group (Observer / Camera / Vault of the Heavens / …) is open at
  a time per popup. Clicking the currently-open group still
  collapses it. Time tab's Calendar and Autoplay groups are
  registered in the same set.
- **Revert:** `git checkout v-s000241 -- js/ui/controlPanel.js`.

## S243 — Keep tab popup open during canvas interaction

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** removed the `host.pointerdown` outside-click handler
  that auto-closed the active popup. The popup now stays open while
  the pointer drags / wheels on the canvas. Close paths are the tab
  button (re-click same tab) or clicking a different tab.
- **Revert:** `git checkout v-s000242 -- js/ui/controlPanel.js`.

## S244 — Escape key closes the open popup

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** global `keydown` listener; pressing `Escape` while any
  popup is open hides it and deselects its tab. No-op if no popup
  is active.
- **Revert:** `git checkout v-s000243 -- js/ui/controlPanel.js`.

## S257 — Heavenly-vault stars gated to the dark side [REVERTED in S258]

- **Date:** 2026-04-24
- **Files changed:** `js/render/worldObjects.js` (Stars + CelNavStars),
  `js/render/constellations.js`.
- **Change:** in Heavenly-vault view, a star only paints on the dome
  if the sun is below horizon at the star's ground point
  (`sin(starLat)sin(sunLat) + cos(…)cos(…)cos(Δlon) < 0`, i.e. the
  star sits more than 90° of great-circle distance from the sub-
  solar point). Day-side stars are parked at z=-1000. Same gate
  applied to all three layers: random starfield, cel-nav
  starfield, constellation stars + outlines. Constellation lines
  hide if either endpoint is on the day side. Optical-vault
  rendering is unchanged.
- **Revert:** `git checkout v-s000256 -- js/render/worldObjects.js
  js/render/constellations.js`.

## S291 — Move permanent night button next to vault swap

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** `.night-btn` moved from `.compass-controls` to
  `.time-controls`, placed immediately after `btnVault` so the
  two mode toggles sit together.
- **Revert:** `git checkout v-s000290 -- js/ui/controlPanel.js`.

## S290 — Clicked target is the hovered target

- **Date:** 2026-04-24
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:** `pointermove` caches the current `hoveredHit` (the
  body whose tooltip is being drawn). On `pointerup`, the click
  handler uses that cached hit first and only falls back to
  `findNearestCelestial` if the cursor was off every body. Two
  overlapping click-boxes no longer "steal" each other: the
  info-box you see is exactly what gets locked.
- **Revert:** `git checkout v-s000289 -- js/ui/mouseHandler.js`.

## S289 — Permanent night toggle button on the bottom bar

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:** New `🌙 .night-btn` appended to
  `.compass-controls`, clicking toggles `PermanentNight`. Takes
  the same accent highlight as the compass buttons and vault
  swap when active. Matching CSS in `styles.css`.
- **Revert:** `git checkout v-s000288 -- css/styles.css
  js/ui/controlPanel.js`.

## S288 — Heavenly-vault preset snap when leaving Optical with a tracked body

- **Date:** 2026-04-24
- **Files changed:** `js/main.js`.
- **Change:** The existing `InsideVault` transition listener
  now also handles `true → false` with an active `FollowTarget`.
  On that transition it applies a bird's-eye preset:
  `CameraHeight: 80.3°`, `CameraDistance: 10`, `Zoom: 4.67` —
  matching the orbit settings the user screenshotted. No attempt
  to re-centre on the body yet; that's deferred to a future
  `cel_cam` free-camera mode.
- **Revert:** `git checkout v-s000287 -- js/main.js`.

## S287 — Hover tooltip + larger click hitbox for celestial bodies

- **Date:** 2026-04-24
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:**
  - Click-hit angular threshold widened from `clamp(fovV/15,
    0.4°, 5°)` to `clamp(fovV/10, 1°, 8°)`. Users no longer have
    to click a body exactly; a nearby click still snaps.
  - New `#celestial-hover` tooltip element (auto-created in
    `#view`). On pointer move over Optical mode, if the cursor
    direction is within the same threshold of a visible body,
    the tooltip floats next to the cursor showing
    `Name · az X.XX° el ±Y.YY°`. Hidden while dragging, on
    pointer-leave, or when no body is within range.
  - `displayNameFor()` helper maps the tracker id back to the
    catalogue name (sun / moon / planet / cel-nav / catalogued /
    black hole / quasar / galaxy).
- **Revert:** `git checkout v-s000286 -- js/ui/mouseHandler.js`.

## S286 — Info bar gets a second row with "Tracking: <name>"

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:**
  - `#info-bar` switched to `flex-direction: column` with two
    `.info-row` children. Top row holds the original slots
    (Lat, Lon, El, Az, Mouse El/Az, ephem, time). New bottom
    row holds a `Tracking: —` slot that reads from
    `state.FollowTarget` and resolves the id to a display name
    via a new `resolveTrackName()` helper (maps sun / moon /
    planets / all five star catalogues).
  - `#info-bar` height 26 → 44 px; `#bottom-bar` height 70 → 88
    px with `padding-top: 44px`; `#tab-popups` bottom 70 → 88;
    `#logo` bottom 86 → 104.
- **Revert:** `git checkout v-s000285 -- css/styles.css
  js/ui/controlPanel.js`.

## S285 — N / E / S / W quick-turn buttons on the bottom bar

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:**
  - New `.compass-controls` group between `.time-controls` and
    `.tabs` with four buttons (N 0°, E 90°, S 180°, W 270°).
    Each click sets `ObserverHeading` to the cardinal value and
    clears any active `FollowTarget` so the snap takes.
  - Active cardinal (heading within 0.5° of its value) takes
    `aria-pressed="true"` and the shared accent-border
    highlight used by the vault-swap button.
  - CSS: compass buttons reuse `.time-btn` styling with
    tighter padding / min-width and bold labels.
- **Revert:** `git checkout v-s000284 -- css/styles.css
  js/ui/controlPanel.js`.

## S284 — Click-to-snap and continuous follow in Optical mode

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/ui/mouseHandler.js`.
- **Change:**
  - New session-only state `FollowTarget` (default `null`).
  - `pointerdown` / `pointerup` track drag distance; a pointer
    event with total movement under 4 px counts as a click.
  - On click in Optical mode (`InsideVault === true`) the
    handler computes the click direction via the existing
    pinhole math, then searches Sun / Moon / planets / all five
    star catalogues for the nearest above-horizon body inside a
    FOV-scaled angular threshold (`clamp(fovV/15, 0.4°, 5°)`).
    If a match is found it sets `FollowTarget` to the body's
    tracker id and snaps `ObserverHeading` to the body's
    azimuth and `CameraHeight` to its elevation (clamped
    `[0, 89.9]`). Clicks on empty sky don't move the camera.
  - A continuous `update` listener re-aims the camera at
    `FollowTarget` every frame. Below-horizon targets pin pitch
    to 0 so the camera swings with the body's azimuth along the
    horizon instead of looking underground. The listener calls
    `setState(..., emit=false)` to avoid re-entrant updates and
    skips when heading/pitch already match.
  - Any real drag (≥ 4 px movement) clears `FollowTarget`, so
    manual steering breaks the lock.
- **Revert:** `git checkout v-s000283 -- js/core/app.js
  js/ui/mouseHandler.js`.

## S283 — Lift #info-bar above #bottom-bar in z-stack

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`.
- **Change:** `#info-bar` `z-index: 28` → `31`. After S281 the
  bar moved inside the dark bottom-bar area, but the bar's
  `z-index: 30` was painting over the text. Lifted the info
  strip one layer above so the lat/lon/az/ephem/time slots are
  visible again.
- **Revert:** `git checkout v-s000282 -- css/styles.css`.

## S282 — AC logo shrinks further on phone-sized viewports

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`.
- **Change:** `#logo` clamp widened: min 80 px → 40 px, slope
  14vmin → 12vmin, max unchanged at 180 px. Small phone
  viewports (~360 px wide) now render the logo around 43 px.
- **Revert:** `git checkout v-s000281 -- css/styles.css`.

## S281 — Info bar moves into the dark bottom-bar area

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`.
- **Change:**
  - `#bottom-bar` height 44 px → 70 px with `box-sizing:
    border-box` and `padding-top: 26px` so tab buttons sit in
    the bottom 44 px band (same visual spot) while the top
    26 px band is reserved for the info strip.
  - `#info-bar` unchanged position (`bottom: 44px; height: 26px`)
    now visually sits inside the dark bottom-bar area; added a
    top border so the info strip is separated from the rest of
    the canvas view.
  - `#tab-popups` bottom offset bumped 44 px → 70 px so popups
    anchor above the taller bar.
  - `#logo` bottom offset bumped 60 px → 86 px to clear the new
    bar height.
- **Revert:** `git checkout v-s000280 -- css/styles.css`.

## S280 — AC logo scales to window size

- **Date:** 2026-04-24
- **Files changed:** `index.html`, `css/styles.css`.
- **Change:** Inline `style="width:180px;height:180px;..."` on
  `<img id="logo">` replaced with a rule in `styles.css`. Size
  is now `clamp(80px, 14vmin, 180px)` so the logo tops out at
  180×180 on large monitors and shrinks linearly on narrower
  viewports, with an 80 px floor. All other inline style bits
  (position, opacity, pointer-events, z-index) preserved in the
  rule.
- **Revert:** `git checkout v-s000279 -- index.html css/styles.css`.

## S279 — Show current date/time in the bottom info bar

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** `#info-bar` gets a new `[data-k="time"]` slot at
  the end, after a separator. Content is
  `dateTimeToString(state.DateTime)` refreshed on every model
  update, same source the HUD's time line uses.
- **Revert:** `git checkout v-s000278 -- js/ui/controlPanel.js`.

## S278 — Match Live Ephemeris button style to Live Moon Phases header

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`.
- **Change:** `#live-ephem-tab` restyled to mirror
  `.moon-phase-header`: full width, 11px/1.2 font, 2×6 padding,
  transparent background, 4px radius, left-aligned text, hover
  highlight. Visually the two rows are now the same size.
- **Revert:** `git checkout v-s000277 -- css/styles.css`.

## S277 — Fold time / sun / moon lines into Live Moon Phases collapsible

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** Time, Sun, and Moon az/el lines moved from direct
  `#hud` children to the start of the moon collapsible's body.
  When the collapsible is closed only the header and the Live
  Ephemeris Data button are visible.
- **Revert:** `git checkout v-s000276 -- js/ui/controlPanel.js`.

## S276 — Move Live Moon Phases to top of HUD; include eclipse lines

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:**
  - `#hud` order reshuffled: "Live Moon Phases" collapsible is
    now the first child; time / sun / moon lines follow, Live
    Ephemeris Data button still last.
  - Collapsible body now contains three children: the moon
    canvas + label row (`.moon-phase-row`), the solar-eclipse
    line, and the lunar-eclipse line. Collapsing the widget
    hides all three together.
  - CSS: `.moon-phase-row` takes over the old flex layout;
    `.moon-phase-body` is a plain stacking container; wrapper
    uses `margin-bottom` (was `margin-top`) now that it's the
    first child.
- **Revert:** `git checkout v-s000275 -- css/styles.css
  js/ui/controlPanel.js`.

## S275 — Default moon-phase widget to collapsed

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/ui/urlState.js`.
- **Change:** `MoonPhaseExpanded` default flipped `true` → `false`
  so the moon canvas + label are hidden on first load; only the
  "Live Moon Phases" header is visible until the user clicks it.
  `URL_SCHEMA_VERSION` bumped `274` → `275` to drop stale hashes.
- **Revert:** `git checkout v-s000274 -- js/core/app.js
  js/ui/urlState.js`.

## S274 — Collapsible moon-phase widget; Live Ephem button flows inside #hud

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/core/app.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - Moon-phase canvas + label wrapped in a collapsible. Clickable
    "Live Moon Phases" header with triangle indicator toggles new
    persisted state `MoonPhaseExpanded` (default `true`).
  - `#live-ephem-tab` moved from absolute position inside `#view`
    to inline button inside `#hud` as the last child. Collapsing
    the moon widget pulls the tab up naturally.
  - `ShowLiveEphemeris` default flipped `true` → `false`; the HUD
    is hidden until the user clicks the tab.
  - `buildTrackerHud` recomputes `#tracker-hud`'s `top` from
    `#hud.getBoundingClientRect().bottom` on every model update,
    and also via `ResizeObserver` on `#hud`, so the tracker HUD
    follows the moon-phase collapse.
  - `URL_SCHEMA_VERSION` bumped `263` → `274`; both new keys
    added to `VERSION_GATED_KEYS` so old URLs drop stale defaults.
- **Revert:** `git checkout v-s000273 -- css/styles.css
  js/core/app.js js/ui/controlPanel.js js/ui/urlState.js`.

## S273 — Fix inverted moon-phase illumination fraction

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`.
- **Change:** `MoonPhaseFraction` formula changed from
  `0.5 * (1 - cos(MoonPhase))` to `0.5 * (1 + cos(MoonPhase))`.
  The phase-angle `MoonPhase` is 0 at full and π at new, so the
  prior `(1 - cos)` returned the *dark* fraction; every consumer
  (HUD widget, phase name, illumination bar, percentage text)
  treats the value as the illuminated fraction, which made new
  moon show as fully lit and full moon as fully dark.
- **Revert:** `git checkout v-s000272 -- js/core/app.js`.

## S272 — Galaxies catalogue, render layer, tracker integration

- **Date:** 2026-04-24
- **Files changed:** `js/core/galaxies.js` (new), `js/core/app.js`,
  `js/render/index.js`, `js/ui/controlPanel.js`.
- **Change:**
  - New catalogue `GALAXIES` (20 entries: M31, M32, M33, M51,
    M63, M64, M77, M81, M82, M87, M101, M104, M110, NGC 253,
    NGC 4565, NGC 4631, NGC 5128, LMC, SMC, Cartwheel). Same
    shape as CEL_NAV_STARS so existing `projectStar()` works.
  - `app.update()` builds `c.Galaxies` every frame; `star:<id>`
    resolver extended with galaxies branch, new `galaxy`
    GP colour `0xff80c0` (pink).
  - `render/index.js` adds a third `CatalogPointStars` instance
    `galaxyStars` (sourceKey `Galaxies`, pink), wired alongside
    black-hole and quasar layers.
  - Tracker tab gets a new "Galaxies" sub-menu after Quasars.
  - Tracker HUD category label maps `subCategory === 'galaxy'`
    → "galaxy".
- **Revert:** `git checkout v-s000271 -- js/core/app.js
  js/render/index.js js/ui/controlPanel.js`; delete
  `js/core/galaxies.js`.

## S271 — Move Live Ephemeris tab to left, horizontal, under moon-phase HUD

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:**
  - `#live-ephem-tab` switched from fixed right-edge vertical bar
    to absolute top-left horizontal button. New position
    `top: 212px; left: 8px`, no `writing-mode`. Appended to
    `#view` so it's positioned inside the canvas area.
  - `#tracker-hud` `top` bumped 240px → 248px to make room for
    the tab and keep spacing consistent when the HUD opens.
- **Revert:** `git checkout v-s000270 -- css/styles.css
  js/ui/controlPanel.js`.

## S270 — Drop redundant sub-menu labels inside Tracker star grids

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:**
  - Cel Nav / Constellations / Black Holes / Quasars buttonGrid
    rows now pass `label: ''` — each grid already sits inside a
    collapsible whose title names the category, the second label
    was noise.
  - `buttonGridRow()` renders the 96px label column only when
    `row.label` is non-empty; otherwise it adds a `.no-label`
    modifier and CSS switches `grid-template-columns` to `1fr`
    so the grid consumes the row's full width.
- **Revert:** `git checkout v-s000269 -- css/styles.css
  js/ui/controlPanel.js`.

## S269 — Tracker HUD titles: distinguish black holes and quasars from stars

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/ui/controlPanel.js`.
- **Change:**
  - `app.update()` attaches `subCategory` (`celnav` / `catalogued`
    / `blackhole` / `quasar`) to each star-category
    `TrackerInfo`.
  - Tracker HUD's parenthesised category label now maps
    `subCategory === 'blackhole'` → "black hole" and
    `subCategory === 'quasar'` → "quasar"; everything else in
    category `star` still shows "star". Non-star categories
    unchanged ("planet" / "luminary").
- **Revert:** `git checkout v-s000268 -- js/core/app.js
  js/ui/controlPanel.js`.

## S268 — Remove cel-nav duplicates from Constellations tracker menu

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** Constellations buttonGrid now filters out any star
  whose id is in `CEL_NAV_STARS`. Grid draws from
  `CATALOGUED_STARS` minus cel-nav crossovers, all in white. Cel
  Nav sub-menu remains the sole listing for navigational stars.
- **Revert:** `git checkout v-s000267 -- js/ui/controlPanel.js`.

## S267 — Multi-column Tracker HUD + Live Ephemeris Data side tab

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/core/app.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - Tracker HUD (`#tracker-hud`) switched from a single bordered
    panel to a flex `column + wrap` container with `max-height:
    calc(100vh - 260px)`. Each `.tracker-block` becomes its own
    card (background / border / rounded corners). When the stack
    exceeds viewport height blocks flow into a new column to the
    right. Base card width 360 px; bumps to 460 px via
    `#tracker-hud.expanded` when `ShowEphemerisReadings` is on.
  - New vertical right-edge button `#live-ephem-tab` ("Live
    Ephemeris Data") using `writing-mode: vertical-rl`. Always
    rendered; click toggles new state `ShowLiveEphemeris`
    (default `true`, persisted). HUD hidden whenever state is
    false, regardless of TrackerTargets contents.
- **Revert:** `git checkout v-s000266 -- css/styles.css
  js/core/app.js js/ui/controlPanel.js js/ui/urlState.js`.

## S266 — Render black holes + quasars on heavenly dome and optical vault

- **Date:** 2026-04-24
- **Files changed:** `js/render/worldObjects.js`, `js/render/index.js`.
- **Change:**
  - New `CatalogPointStars` class in `worldObjects.js` — generic
    two-layer (dome + sphere) point renderer parameterised by
    `sourceKey` (which `computed.*` array to read), `color`,
    `domeSize`, `sphereSize`, `idPrefix`. Same visibility gates
    as `CelNavStars`: ShowStars / DynamicStars / NightFactor for
    both layers, ShowTruePositions + !InsideVault for the dome,
    ShowOpticalVault for the sphere. Below-horizon entries parked
    at z = -1000 so the disc clip plane hides them. Not gated on
    StarfieldType. STM filters to TrackerTargets by `${idPrefix}:${id}`.
  - `render/index.js` instantiates two `CatalogPointStars` layers —
    `blackHoleStars` (sourceKey `BlackHoles`, color `0x9966ff`
    purple) and `quasarStars` (sourceKey `Quasars`, color
    `0x40e0d0` cyan). Both added to the scene and updated each
    frame alongside `celNavStars`.
- **Revert:** `git checkout v-s000265 -- js/render/worldObjects.js
  js/render/index.js`.

## S265 — Promote Cel Nav / Constellations / Black Holes / Quasars to their own sub-menus

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** Tracker tab now has six top-level collapsible groups
  instead of two:
  - Ephemeris
  - Celestial Bodies (Clear All Tracked + Specified Tracker Mode +
    GP Override + Planets button grid)
  - Cel Nav
  - Constellations (still contains cel-nav crossovers — toggles
    stay in sync with the Cel Nav buttons that share a `star:<id>`)
  - Black Holes
  - Quasars
  Mutually exclusive — opening one collapses the others.
- **Revert:** `git checkout v-s000264 -- js/ui/controlPanel.js`.

## S264 — Black-hole + quasar catalogues; Tracker split into sub-lists

- **Date:** 2026-04-24
- **Files changed:** `js/core/blackHoles.js` (new),
  `js/core/quasars.js` (new), `js/core/app.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - New catalogues `BLACK_HOLES` (11 entries: Sgr A*, M87*, M31*,
    Cygnus X-1, V404 Cygni, NGC 4258, A0620-00, NGC 1275, NGC 5128
    / Centaurus A, M81*, 3C 273 BH) and `QUASARS` (19 entries:
    3C 273, 3C 48, 3C 279, 3C 351, S5 0014+81, TON 618, OJ 287,
    APM 08279+5255, 3C 454.3, PKS 2000-330, 3C 345, 3C 147,
    PG 1634+706, Twin Quasar, Mrk 421, Mrk 501, 3C 66A,
    PKS 1510-089, BL Lacertae). Each shaped like `CEL_NAV_STARS`
    so the existing `projectStar()` works unchanged.
  - `app.update()` builds `c.BlackHoles` and `c.Quasars` every
    frame with the shared projection.
  - Tracker `star:<id>` resolver searches cel-nav → catalogued →
    black holes → quasars in order. New per-category GP colours:
    `celnav #ffe8a0`, `catalogued #ffffff`, `blackhole #9966ff`,
    `quasar #40e0d0`.
  - Celestial Bodies group's single mega-grid split into five
    labelled grids: Planets, Cel Nav, Constellations (still
    includes cel-nav crossovers — clicking either copy toggles
    the same `star:<id>` entry so both stay in sync),
    Black Holes, Quasars.
  - Ids prefixed (`bh_*`, `q_*`) so they don't collide with
    star ids.
- **Revert:** `git checkout v-s000263 -- js/core/app.js
  js/ui/controlPanel.js`; delete `js/core/blackHoles.js` and
  `js/core/quasars.js`.

## S263 — New default camera angles

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/ui/urlState.js`.
- **Change:**
  - `CameraDirection`: −98.9 → **−106.6**
  - `CameraHeight`:    12.6 → **15.2**
  - URL schema 248 → 263.
- **Revert:** `git checkout v-s000262 -- js/core/app.js js/ui/urlState.js`.

## S262 — Swap Tracker group order: Ephemeris above Celestial Bodies

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** the Tracker tab now lists `Ephemeris` as the first
  collapsible group and `Celestial Bodies` second.
- **Revert:** `git checkout v-s000261 -- js/ui/controlPanel.js`.

## S261 — Tracker "GP Override" checkbox

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - New state field `TrackerGPOverride: false`.
  - New checkbox in Tracker → Celestial Bodies labelled
    "GP Override", sitting between `Specified Tracker Mode` and the
    track button grid.
  - `TrackedGroundPoints.update` now paints tracker GPs when
    `ShowGroundPoints || TrackerGPOverride` (plus `!InsideVault`).
    With the default master toggle off, GP Override lets the user
    see every tracked target's GP without re-enabling the global
    ground-points layer.
  - `TrackerGPOverride` added to `PERSISTED_KEYS`.
- **Revert:** `git checkout v-s000260 -- js/core/app.js
  js/render/worldObjects.js js/ui/controlPanel.js js/ui/urlState.js`.

## S260 — TrackedGroundPoints follows ShowGroundPoints toggle

- **Date:** 2026-04-24
- **Files changed:** `js/render/worldObjects.js`.
- **Change:** `TrackedGroundPoints.update` gates the per-target GP
  dots + vertical lines on `s.ShowGroundPoints` in addition to the
  existing `!InsideVault`. With `ShowGroundPoints` off (S230
  default) the planet / star / sun / moon tracker dots all hide,
  matching the built-in sun/moon GP behaviour.
- **Revert:** `git checkout v-s000259 -- js/render/worldObjects.js`.

## S259 — Rename Tracker "Object" → "Celestial Bodies"; move Specified Tracker Mode

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:**
  - Tracker tab's first group renamed `Object → Celestial Bodies`.
  - `SpecifiedTrackerMode` toggle moved out of the Ephemeris group
    and into Celestial Bodies, placed between the `Clear All Tracked`
    button and the button grid.
- **Revert:** `git checkout v-s000258 -- js/ui/controlPanel.js`.

## S258 — Revert S257 dark-side gate

- **Date:** 2026-04-24
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/constellations.js`.
- **Change:** restored both files to the `v-s000256` state, removing
  the dark-side filter added in S257.
- **Revert:** `git checkout v-s000257 -- js/render/worldObjects.js
  js/render/constellations.js`.

## S256 — Keyboard control: arrow-key observer move + space pause

- **Date:** 2026-04-24
- **Files changed:** `js/ui/keyboardHandler.js` (new),
  `js/main.js`.
- **Change:**
  - New `keyboardHandler.js` attaches a global keydown/keyup pair:
    - `ArrowUp` / `ArrowDown` → ObserverLat ± 1° step.
    - `ArrowLeft` / `ArrowRight` → ObserverLong ± 1° step.
    - Tap = single 1° step + starts a 150 ms repeating tick at 1°/tick.
    - After 2 s of holding, the tick grows to 10°/tick until release.
    - Keyup clears the interval; window blur clears everything.
    - Ignored while an `INPUT` / `TEXTAREA` / `SELECT` / contenteditable
      element is focused.
  - Spacebar (not in a form field) toggles `model._autoplay.play/pause`.
  - `main.js` wires `attachKeyboardHandler(model)` after the mouse
    handler inside the WebGL try-block.
- **Revert:** `git checkout v-s000255 -- js/main.js`, then delete
  `js/ui/keyboardHandler.js`.

## S255 — Info tab: Twitter Community section + wrappable link labels

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`, `css/styles.css`.
- **Change:**
  - New section "Twitter Community" at the end of the Info tab, one
    link: "FE Community Friday X Spaces hosted by Ken and Brian" →
    `https://x.com/ken_caudle`.
  - `.info-link` CSS: `white-space: normal; overflow-wrap: anywhere;
    line-height: 1.35;` so long labels wrap inside the link button
    instead of stretching the popup.
- **Revert:** `git checkout v-s000254 -- js/ui/controlPanel.js
  css/styles.css`.

## S254 — Info tab: Clubhouse section

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** new collapsible section "Clubhouse" at the end of the
  Info tab with one link: `#FlatEarthGang →
  https://www.clubhouse.com/club/flatearthgang`. Swap in the exact
  URL if the club slug isn't the hashtag itself.
- **Revert:** `git checkout v-s000253 -- js/ui/controlPanel.js`.

## S253 — Info tab: second Discord link (Earth Awakenings)

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** added "Earth Awakenings → `https://discord.gg/earthawakenings`"
  to the Discord section, below Aether Cosmology.
- **Revert:** `git checkout v-s000252 -- js/ui/controlPanel.js`.

## S252 — Info tab: Aether Cosmology CZ-SK section

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** new collapsible section "Aether Cosmology CZ-SK"
  inserted between Globebusters and Discord. Links: Kick, YouTube,
  Instagram, Facebook, Telegram.
- **Revert:** `git checkout v-s000251 -- js/ui/controlPanel.js`.

## S251 — Info tab: Globebusters section

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** new collapsible section "Globebusters" in the Info tab,
  inserted before "Discord". Links: YouTube channel + S13 / S14 / S15
  playlists. `pp` tracking param stripped from S13 to keep links
  clean.
- **Revert:** `git checkout v-s000250 -- js/ui/controlPanel.js`.

## S250 — Info tab: Discord section

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** added a fourth collapsible section "Discord" under the
  three-person list with one link: Aether Cosmology →
  `https://discord.gg/aethercosmology`.
- **Revert:** `git checkout v-s000249 -- js/ui/controlPanel.js`.

## S249 — Info tab: per-person link sub-menus

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** Info tab restructured into three collapsible sections,
  each holding a list of external links. Sections are mutually
  exclusive (same `popupGroups` set as the other tabs' groups).
  - **Space Audits** — YouTube, Obsidian, X, Telegram, Website.
  - **Shane St. Pierre** — X, YouTube, ADL.
  - **Man of Stone** — X, Rumble, Telegram.
  Previous Discord placeholder dropped. Links open in new tabs with
  `rel=noopener noreferrer`.
- **Revert:** `git checkout v-s000248 -- js/ui/controlPanel.js`.

## S248 — New default camera angles

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/ui/urlState.js`.
- **Change:**
  - `CameraDirection`: −95.4 → **−98.9**
  - `CameraHeight`:     7.5 → **12.6**
  - `Zoom`:             3.19 → **4.67**
  - URL schema bumped 231 → 248 so the new defaults apply over
    stale URL hashes.
- **Revert:** `git checkout v-s000247 -- js/core/app.js js/ui/urlState.js`.

## S247 — Info tab with external links

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`, `css/styles.css`.
- **Change:** new "Info" tab on the bottom bar, registered after
  Demos. Popup lists three link buttons: Space Audits, Shane St.
  Pierre, Discord. Links use `target="_blank" rel="noopener
  noreferrer"`. Space Audits defaults to
  `https://www.youtube.com/@AlanSpaceAudits`; the other two href
  entries are `#` placeholders pending real URLs.
- **Revert:** `git checkout v-s000246 -- js/ui/controlPanel.js
  css/styles.css`.

## S246 — Info bar shows active ephemeris

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** added `ephem: NAME` slot to the end of `#info-bar`.
  Maps BodySource id to display name: heliocentric → HelioC,
  geocentric → GeoC, ptolemy → Ptolemy, astropixels → DE405,
  vsop87 → VSOP87. Live-refreshes on model update.
- **Revert:** `git checkout v-s000245 -- js/ui/controlPanel.js`.

## S245 — Show tab regrouped into top-down subcategories

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** Show tab's flat `Visibility` group split into collapsible
  subgroups, top-down:
  - **Heavenly Vault** — vault, grid, true positions, sun/moon tracks.
  - **Optical Vault** — vault, grid, azimuth ring, facing vector,
    celestial poles, declination circles.
  - **Ground / Disc** — FE grid, tropics/polar, sun/moon GP,
    longitude ring, shadow.
  - **Stars** — stars, constellations, outlines.
  - **Rays** — vault rays, optical vault rays, projection rays,
    many rays.
  - **Cosmology** — axis mundi (unchanged).
  - **Map Projection** — projection (unchanged).
  - **Starfield** — starfield type, starfield mode, permanent night
    (DynamicStars + PermanentNight moved into this group from the
    flat list).
  - **Misc** — planets, dark background, logo.
- All rows still bind to the same state keys; only the grouping
  changes.
- **Revert:** `git checkout v-s000244 -- js/ui/controlPanel.js`.
