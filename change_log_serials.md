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
