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

## S312 — Satellites catalogue + ShowSatellites toggle + tracker sub-menu

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/core/satellites.js` (new),
  `js/render/index.js`, `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - New `satellites.js` carrying 12 entries (ISS, Hubble,
    Tiangong, 8 Starlink-shell representatives spread over
    RAAN / mean anomaly, James Webb) with simplified two-body
    orbital elements. `satelliteSubPoint(sat, utcDate)` returns
    the geographic (lat, lon) via a near-circular Kepler +
    GMST rotation. Accuracy drifts ~1°/day from the 2024-04-15
    epoch — fine for conceptual display, not precise tracking.
  - New session state `ShowSatellites` (default `false`,
    persisted in URL).
  - `app.update()` builds `c.Satellites` each frame only when
    `ShowSatellites` is on; fed through the same
    vault / local-globe / optical-vault machinery as the star
    catalogues.
  - `render/index.js` adds a `CatalogPointStars` layer for
    Satellites (`0x66ff88` lime-green).
  - Tracker `star:<id>` resolver extended with a satellites
    branch; new category key `satellite` with matching
    GP colour.
  - Tracker tab gets a "Satellites" sub-menu (with an inline
    "Show Satellites" boolean since the data is off by
    default) and the body-search index + name resolver
    include satellites.
- **Revert:** `git checkout v-s000311 -- js/core/app.js
  js/render/index.js js/ui/controlPanel.js js/ui/urlState.js`;
  delete `js/core/satellites.js`.

## S341 — Bump TrackedGroundPoints pool 16 → 256

- **Date:** 2026-04-24
- **Files changed:** `js/render/index.js`.
- **Change:** `TrackedGroundPoints` was constructed with max = 16
  back when `TrackerTargets` default was small. Since S330 the
  default has ~170 ids, so `TrackerInfos` overran the pool and
  every GP past slot 15 silently went unrendered — which is why
  clicking GP Override (or the per-category overrides) didn't
  visibly paint the full set. Pool bumped to 256 so every
  tracker entry gets a slot with headroom.
- **Revert:** `git checkout v-s000340 -- js/render/index.js`.

## S340 — Feature search also indexes the Tracker tab

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** `attachFeatureSearch()`'s `buildIndex()` now walks
  Show AND Tracker tabs (was Show-only since S319), so typing
  "path" / "override" / "cel nav" / etc. lands on the Tracker
  Options row or the relevant sub-menu, not just Show-tab
  visibility toggles. Placeholder rewritten to
  `Search Show / Tracker settings`.
- **Revert:** `git checkout v-s000339 -- js/ui/controlPanel.js`.

## S339 — New demo: North-pole GP trace of tracked bodies

- **Date:** 2026-04-24
- **Files changed:** `js/demos/definitions.js`.
- **Change:** New General-section demo
  `North-pole GP trace (tracked bodies)`. Intro forces Heavenly
  view + `CameraHeight: 89.9` (straight-down on the disc) +
  `Zoom: 1.5` / `CameraDistance: 20` so the whole FE disc is
  framed with the north pole (disc centre) at the viewport
  centre. `ShowGPPath` + `ShowTruePositions` + `ShowFeGrid` on;
  `BodySource` forced to `astropixels`. `TrackerTargets`
  deliberately left untouched so the demo traces whatever the
  user has selected. Tasks callback reads
  `m.state.DateTime` at play time and advances by 7 days over
  40 s (linear), so every tracked body's rolling 24 h GP
  polyline sweeps in real time as the demo runs.
- **Revert:** `git checkout v-s000338 -- js/demos/definitions.js`.

## S338 — about.md refresh: every bar icon + new Tracker layout

- **Date:** 2026-04-24
- **Files changed:** `about.md`.
- **Change:**
  - Transport cluster section rewritten to document each
    icon: 🌐/👁 vault swap, ⏪ / ▶⏸ / ⏩, ½× / 2× speed
    scalers, the `demo N.NN×` speed readout, the stacked
    **End Demo** button.
  - Compass cluster section documents 🌙 / 🎯 / ◉ / 📍 / N-
    S-E-W behaviour.
  - New Search-boxes section covering both the body search
    and the visibility search.
  - Tracker tab section: now "nine top-level groups" — Ephemeris,
    Tracker Options (Clear All / Track All / STM / GP Override /
    True Positions / GP Path), Celestial Bodies, Cel Nav,
    Constellations, Black Holes, Quasars, Galaxies, Satellites.
    Each sub-menu's Show + GP Override checkboxes noted.
  - Demos tab introduces the new **24 h Sun** section + bullet
    list of the four demos. Transport behaviour during a demo
    (pause / speed / End Demo / camera freedom) now documented.
  - Interactive-tracking section extended to cover Heavenly /
    free-cam hover, click-to-lock branching per mode, and
    free-cam behaviour.
- **Revert:** `git checkout v-s000337 -- about.md`.

## S337 — Info-bar Tracking slot also shows the target's az / el

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** `refreshInfoBar()` now looks up the follow target's
  current angles via the existing `resolveTargetAngles()` helper
  and appends them to the Tracking slot as
  `Tracking: Name  ·  az X.XX°  el ±Y.YY°`. Falls back to just
  the name if angles aren't available, or `Tracking: —` when
  nothing is followed.
- **Revert:** `git checkout v-s000336 -- js/ui/controlPanel.js`.

## S336 — 📍 quick-button jumps straight to Observer in the View tab

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:** New `.observer-btn` (📍) appended to
  `.compass-controls` after the 🌙 / 🎯 / ◉ group. Click calls
  the same `featureOpen.fn` the feature-search uses, passing
  `('View', 'Observer')`: opens the View tab popup and expands
  the Observer group so lat / long / elevation / heading are
  visible instantly.
- **Revert:** `git checkout v-s000335 -- css/styles.css
  js/ui/controlPanel.js`.

## S335 — Move True Positions + GP Path to Tracker Options; single master toggle

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/demos/index.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - `ShowTruePositions` row removed from Show tab's Heavenly
    Vault group; added to Tracker Options.
  - Per-category `GPPath<Category>` keys (7) collapsed back
    into a single `ShowGPPath` master toggle, placed in
    Tracker Options next to True Positions. Per-sub-menu GP
    Path rows removed.
  - `app.update()` now draws GP traces for every body that's
    in `TrackerTargets` (plus `FollowTarget`) when
    `ShowGPPath` is on — Show-tab-like scoped behaviour
    without per-category UI.
  - `_snapToDefaultEphemeris` post-demo cleanup simplified to
    clear the single flag.
  - URL schema bumped `334` → `335` so the old per-category
    keys get dropped.
- **Revert:** `git checkout v-s000334 -- js/core/app.js
  js/demos/index.js js/ui/controlPanel.js js/ui/urlState.js`.

## S334 — Default ShowSatellites true

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/ui/urlState.js`.
- **Change:** `ShowSatellites` default flipped `false` → `true`;
  default `TrackerTargets` already contains the satellite ids
  (S330) so the 12 entries render on first load. URL schema
  bumped `331` → `334` so the old default is dropped.
- **Revert:** `git checkout v-s000333 -- js/core/app.js
  js/ui/urlState.js`.

## S333 — Constellations renderer respects tracker filtering + STM focus

- **Date:** 2026-04-24
- **Files changed:** `js/render/constellations.js`.
- **Change:** Constellation-star point filter no longer gates on
  `stm` being true; membership is always required. When STM is on
  the effective set narrows to `[FollowTarget]` (same rule as
  every other renderer since S330 / S332). Fixes the bug where
  the 🎯 focus mode left constellation points visible.
- **Revert:** `git checkout v-s000332 -- js/render/constellations.js`.

## S332 — STM now focuses on FollowTarget; demo end clears tracks / GP paths

- **Date:** 2026-04-24
- **Files changed:** `js/demos/index.js`, `js/render/index.js`,
  `js/render/worldObjects.js`.
- **Change:**
  - `CatalogPointStars`, `CelNavStars`, and the sun / moon /
    planet marker block all narrow the effective tracker set to
    just `[FollowTarget]` when `SpecifiedTrackerMode` is on.
    With the S330 always-require-membership rule STM was a no-op;
    now 🎯 actually does something — focuses the scene on the
    currently-locked body and hides everything else.
  - `_snapToDefaultEphemeris` (fires when a demo ends)
    additionally resets `ShowSunTrack`, `ShowMoonTrack`, and all
    seven `GPPath<Category>` flags so demo-time visualisations
    don't leak into normal exploration.
- **Revert:** `git checkout v-s000331 -- js/demos/index.js
  js/render/index.js js/render/worldObjects.js`.

## S331 — GP Path moves out of Show into every Tracker sub-menu

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`, `js/ui/controlPanel.js`,
  `js/ui/urlState.js`.
- **Change:**
  - Single `ShowGPPath` state removed. Seven new keys replace
    it, each default `false`:
    `GPPathPlanets`, `GPPathCelNav`, `GPPathConstellations`,
    `GPPathBlackHoles`, `GPPathQuasars`, `GPPathGalaxies`,
    `GPPathSatellites`.
  - `Show tab → Ground / Disc` drops the `GP Paths (24 h)`
    row; every Tracker sub-menu (Celestial Bodies on down)
    gains its own `GP Path (24 h)` checkbox just below the
    existing GP Override row.
  - `app.update()` builds `c.GPPaths` as a flat `{ key →
    { pts, color } }` map. Planets draw from the active
    ephemeris pipeline, star catalogues sample directly from
    fixed RA/Dec + GMST (no per-frame ephemeris call),
    satellites use `satelliteSubPoint`. Only populated for the
    categories whose flag is set.
  - `GPPathOverlay` rewritten to lazily create a Line per key
    and hide (drawRange 0) keys that disappear from the map
    between frames.
  - `URL_SCHEMA_VERSION` bumped `330` → `331` so the old
    `ShowGPPath` key is dropped on load.
- **Revert:** `git checkout v-s000330 -- js/core/app.js
  js/render/worldObjects.js js/ui/controlPanel.js
  js/ui/urlState.js`.

## S330 — Tracker is sole source of visibility; default TrackerTargets pre-seeded full

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`,
  `js/render/index.js`, `js/render/worldObjects.js`,
  `js/ui/urlState.js`.
- **Change:**
  - `CatalogPointStars`, `CelNavStars`, and the sun / moon /
    planet marker block in `render/index.js` drop the opt-in
    `hasCatTarget` / `stm || hasBodyTarget` heuristics.
    Membership is now always required inside an active
    category: Show checkbox gates the category on/off,
    TrackerTargets decides which ids render inside it.
  - Default `TrackerTargets` pre-seeded with every id across
    sun / moon / 7 planets / cel nav / catalogued /
    black holes / quasars / galaxies / satellites, so a fresh
    load shows everything — but the defaults flow through the
    same Tracker state the user interacts with. Track All and
    Clear All toggle the whole set.
  - `URL_SCHEMA_VERSION` bumped `309` → `330` so any stored
    empty `TrackerTargets` from the previous default gets
    replaced with the new full list.
- **Revert:** `git checkout v-s000329 -- js/core/app.js
  js/render/index.js js/render/worldObjects.js
  js/ui/urlState.js`.

## S329 — Antarctic 24h-sun demo year bumped back to 2024

- **Date:** 2026-04-24
- **Files changed:** `js/demos/definitions.js`.
- **Change:** `24h sun at 79°46'S 83°15'W` intro DateTime
  `3269` → `2904` (2024-12-14), tween end `3270` → `2905`.
  Narration updated.
- **Revert:** `git checkout v-s000328 -- js/demos/definitions.js`.

## S328 — Opt-in tracker filtering per category; Antarctic demo starts 2025-12-14

- **Date:** 2026-04-24
- **Files changed:** `js/demos/definitions.js`,
  `js/render/index.js`, `js/render/worldObjects.js`.
- **Change:**
  - `CatalogPointStars`, `CelNavStars`, and the sun/moon/planet
    marker block in `render/index.js` now apply the same rule:
    if ANY id from the category is present in `TrackerTargets`
    (or matches `FollowTarget`), the layer filters to
    membership — empty selection still shows all. STM and the
    satellites' `requireMembership` continue to force
    membership regardless. Selecting a single body in a
    category cleanly hides the rest; clearing that category's
    selections restores everything.
  - `24h sun at 79°46'S 83°15'W` demo intro DateTime bumped
    `3276` → `3269` so it starts 2025-12-14 instead of the
    solstice; narration updated to match.
- **Revert:** `git checkout v-s000327 -- js/demos/definitions.js
  js/render/index.js js/render/worldObjects.js`.

## S327 — Move Stars/Constellations controls to Tracker; add Track-All button

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:**
  - Show tab's "Stars" group stripped down to just
    "Constellation outlines". The per-category Show / selection
    checkboxes in the Tracker sub-menus (Cel Nav,
    Constellations, Black Holes, Quasars, Galaxies, Satellites)
    now own category visibility.
  - Tracker Options gains a "Track All" button beside the
    existing "Clear All". Click seeds `TrackerTargets` with
    every trackable id across sun, moon, planets, cel nav,
    catalogued, black holes, quasars, galaxies, satellites.
    "Clear All Tracked" renamed to "Clear All" for symmetry.
- **Revert:** `git checkout v-s000326 -- js/ui/controlPanel.js`.

## S326 — Group all four sun-above-horizon demos under a new "24 h Sun" section

- **Date:** 2026-04-24
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - Extracted the two 24-hour-sun demos (Alert, West Antarctica)
    and the two midnight-sun demos (75°N, 75°S) out of
    `GENERAL_DEMOS` into a new `SUN_24H_DEMOS` array, all
    tagged `group: '24h-sun'`. Order inside the section is
    Alert → West Antarctica → Midnight 75°N → Midnight 75°S.
  - `DEMO_GROUPS` gains `{ id: '24h-sun', label: '24 h Sun' }`
    at the top of the list; `DEMOS` spreads `SUN_24H_DEMOS`
    before `GENERAL_DEMOS` so the new section renders above
    the General one.
- **Revert:** `git checkout v-s000325 -- js/demos/definitions.js`.

## S325 — 24h-sun demos at Alert (82°30′N) and West Antarctica (79°46′S 83°15′W)

- **Date:** 2026-04-24
- **Files changed:** `js/demos/definitions.js`.
- **Change:** Two new General-section demos, both `BodySource:
  'astropixels'`:
  - `24h sun at 82°30'N (Alert, Nunavut)` — observer at
    82.505°N / 62.335°W, DateTime 3093 (2025-06-21 solstice).
    Observer faces south; orbit camera at pitch 70° looks down
    on the polar region with `ShowSunTrack` + `ShowGPPath`
    showing the sun's daily circle above the horizon. Advances
    DateTime by 1 full day over 20 s.
  - `24h sun at 79°46'S 83°15'W (West Antarctica)` — mirror at
    the user-supplied Antarctic coordinate, DateTime 3276
    (2025-12-21 solstice). Observer faces north. Same 24 h
    animation.
- **Revert:** `git checkout v-s000324 -- js/demos/definitions.js`.

## S324 — Pause during a demo no longer triggers the DE405-default reset

- **Date:** 2026-04-24
- **Files changed:** `js/demos/index.js`.
- **Change:** The S301 snap-to-DE405 tick was firing on any
  `isPlaying() → !isPlaying()` transition, which includes the
  pause state. Now tracks `animator.running` separately: the
  reset only fires when `running` flips true → false (actual
  end of demo / explicit stop). Pause via the bar's ▶/⏸ no
  longer resets time; End Demo still stops and resets.
  Queue-advance also guards on `!isPaused()` so a paused demo
  doesn't fall through to the next queued entry.
- **Revert:** `git checkout v-s000323 -- js/demos/index.js`.

## S323 — Feature-search swaps the active popup to the target tab

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** `featureOpen.fn()` no longer defers to `openTab()`'s
  toggle logic — it explicitly closes any currently open popup
  that isn't the target tab, then unconditionally positions,
  un-hides, and marks the target tab active. Group expansion
  + scroll-into-view still runs afterwards. With a tab popup
  open, picking a search result always switches the window to
  the tab the result lives in instead of silently no-opping.
- **Revert:** `git checkout v-s000322 -- js/ui/controlPanel.js`.

## S322 — "End Demo" button stacked above the speed readout

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:** Speed readout wrapped in a new `.speed-stack`
  vertical flex group. A new `.end-demo-btn` sits on top of the
  readout with accent styling; `hidden` attribute flips to
  false only while `demos.animator.isPlaying() ||
  .isPaused()`. Click calls `demos.stop()`, which already runs
  the S301 DE405-reset flow.
- **Revert:** `git checkout v-s000321 -- css/styles.css
  js/ui/controlPanel.js`.

## S321 — GP-path overlay + demo speed routed through transport buttons

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/core/canonical.js`,
  `js/demos/animation.js`, `js/demos/definitions.js`,
  `js/render/index.js`, `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - New `ShowGPPath` state (default `false`, persisted). When on,
    `app.update()` samples each of sun / moon / 7 planets at 48
    half-hour intervals across the next 24 hours using the
    active `BodySource` ephemeris, builds per-body disc
    polylines in `computed.GPPaths`, and the new
    `GPPathOverlay` render class paints them on the disc (one
    Line per body, per-body colour). Master toggle added to the
    Show tab's Ground / Disc group as `GP Paths (24 h)`.
  - `Animator` gets a `speedScale` field (default `1`, clamped
    [0.01, 64]) and a `setSpeedScale()` method. `_frame()`
    multiplies wall-clock elapsed by the scale before stepping
    the task queue, so each demo's tween durations stretch /
    compress without editing the task definitions. `play()`
    resets `speedScale` to 1 so each demo starts at its
    natural pace.
  - Bottom-bar transport buttons now route to the demo animator
    when one is running: ▶ / ⏸ pauses-resumes the demo, ½× /
    2× halve / double `speedScale`. Readout chip shows
    `demo N.NN×`. No demo running → the buttons keep their
    original autoplay-control behaviour (including rewind-
    direction magnitude for ½× / 2×).
  - Midnight-sun demo Tval durations bumped from `T5` to
    `2 × T8` so the default play is watchable; use 2× for
    faster, ½× for slower.
- **Revert:** `git checkout v-s000320 -- js/core/app.js
  js/demos/animation.js js/demos/definitions.js
  js/render/index.js js/render/worldObjects.js
  js/ui/controlPanel.js js/ui/urlState.js`.

## S320 — Midnight-sun demos at 75°N and 75°S (DE405)

- **Date:** 2026-04-24
- **Files changed:** `js/demos/definitions.js`.
- **Change:** Two new General-section demos walk the midnight-sun
  transition:
  - `Midnight sun at 75°N: start to end` intros at 2025-04-10
    (DateTime 3021), observer at 75°N facing north, `BodySource:
    'astropixels'` (DE405). Tweens step through May 1 → solstice
    → Aug 7 (end of 24h-sun) → mid-September with a narration
    line between each.
  - `Midnight sun at 75°S: start to end` mirrors the flow for
    the southern hemisphere (observer at 75°S, DateTime
    3195 → solstice 3276 → Feb 7 2026 → March 10).
  Both set `ShowSunTrack`, `ShowShadow`, `ShowTruePositions`
  and the Heavenly orbit view so the sun's arc is visible as
  it grazes or clears the horizon.
- **Revert:** `git checkout v-s000319 -- js/demos/definitions.js`.

## S319 — Scope feature-search to the Show tab

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** `attachFeatureSearch()`'s `buildIndex()` now only
  scans the Show tab's groups / rows — the other tabs
  (View, Time, Tracker) don't hold visibility toggles so they
  were cluttering results. Placeholder rewritten to
  `Search visibility (ray, vault, star …)`.
- **Revert:** `git checkout v-s000318 -- js/ui/controlPanel.js`.

## S318 — Feature-search box next to body search

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:**
  - New `attachFeatureSearch()` helper builds a flat index from
    `FIELD_GROUPS` (every group title + every row's label /
    buttonLabel). Typing 2+ characters filters with prefix-first
    then substring, up to 14 suggestions, each showing the label
    and a `Tab › Group` breadcrumb.
  - Selecting a row calls `openFeature(tab, group)`: opens the
    matching tab popup, expands the target collapsible (uses the
    existing header-click flow so the mutually-exclusive group
    rule still applies), and scrolls it into view.
  - `buildGroup()` now tags each `.group` with
    `data-group-title` so feature-search can find the right DOM
    node.
  - New `.search-host` dropped in the bar between the body
    search and the tab row. `.body-search-row` gets a
    two-line variant (`.feature-row-label` plus a small muted
    breadcrumb `.feature-row-path`).
- **Revert:** `git checkout v-s000317 -- css/styles.css
  js/ui/controlPanel.js`.

## S317 — Per-category Show toggles for every tracker sub-menu

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`,
  `js/render/index.js`, `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - Five new session-persisted state keys, default `true`:
    `ShowCelestialBodies`, `ShowCelNav`, `ShowBlackHoles`,
    `ShowQuasars`, `ShowGalaxies`. (`ShowConstellations` and
    `ShowSatellites` already existed.)
  - Each Tracker sub-menu now leads with a `Show` checkbox
    bound to the matching key. When unticked the whole category
    is hidden in the scene.
  - `CatalogPointStars` accepts a new `showKey` option. Its
    visibility gate `AND`s the state boolean, so `ShowBlackHoles
    / ShowQuasars / ShowGalaxies / ShowSatellites` each
    master-gate their layer.
  - `CelNavStars` update gates on `s.ShowCelNav`.
  - Sun / moon / planet markers gate on `s.ShowCelestialBodies`
    in `render/index.js`; when off the whole category hides
    independent of `ShowPlanets`.
- **Revert:** `git checkout v-s000316 -- js/core/app.js
  js/render/index.js js/render/worldObjects.js
  js/ui/controlPanel.js js/ui/urlState.js`.

## S316 — Free-cam tracks satellites (ISS, Starlink, JWST)

- **Date:** 2026-04-24
- **Files changed:** `js/render/scene.js`.
- **Change:** `resolveTargetGp()`'s `star:<id>` lookup list
  was missing `c.Satellites`, so clicking ISS / Starlink
  fell through to the fallback orbit camera instead of
  anchoring on the satellite's sub-point. Added `c.Satellites`
  to the scan; free-cam now follows satellites' GPs the same
  way it follows stars and planets.
- **Revert:** `git checkout v-s000315 -- js/render/scene.js`.

## S315 — Per-category GP Override; Satellites require explicit selection

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`, `js/render/index.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - Seven new session-persisted state keys:
    `GPOverridePlanets / CelNav / Constellations / BlackHoles /
    Quasars / Galaxies / Satellites` (all default `false`).
  - Each Tracker sub-menu ("Celestial Bodies", Cel Nav,
    Constellations, Black Holes, Quasars, Galaxies, Satellites)
    gets a `GP Override` checkbox; selecting it forces GPs for
    any tracked body in that category to paint on the disc in
    Heavenly mode, regardless of the master
    `ShowGroundPoints` toggle.
  - `TrackedGroundPoints.update()` consults a category-id map
    (`luminary` / `planet` → Planets key, `star` subCategory →
    matching catalogue key) to decide whether to force-show.
  - `CatalogPointStars` constructor gains a
    `requireMembership: true` option. The Satellites layer
    uses it so that even without STM, satellites only paint
    when their id is in `TrackerTargets` (or equal to
    `FollowTarget`). "Show Satellites" now acts as a true
    master gate plus per-entry selection.
- **Revert:** `git checkout v-s000314 -- js/core/app.js
  js/render/worldObjects.js js/render/index.js
  js/ui/controlPanel.js js/ui/urlState.js`.

## S314 — Transport controls add ½× / 2× buttons

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:**
  - Two new `.time-btn` buttons added after ⏩: `½×` (slow)
    and `2×` (speed up). Each halves / doubles the current
    autoplay speed magnitude (direction preserved) and clamps
    between `DEFAULT_SPEED / 128` and `DEFAULT_SPEED × 128`.
  - Either button also resumes play if the user was paused —
    the spec is "click slow/speed after pause → resumes at the
    new slowed/sped speed". Play/Pause (▶) still resets the
    speed to the Day preset so a fresh ▶ press always starts
    at a known 1 sim-hour per real-second cadence.
- **Revert:** `git checkout v-s000313 -- js/ui/controlPanel.js`.

## S313 — Heavenly hover / click picks up optical-vault projections too

- **Date:** 2026-04-24
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:** `collectHeavenlyCandidates()` now emits up to two
  hit coords per body — `domeCoord` when `ShowTruePositions` is
  on and `opticalCoord` when `ShowOpticalVault` is on and the
  body sits above the observer's horizon.
  `findNearestInHeavenly()` projects whichever is available and
  picks the nearer screen-space hit, so users can click the
  cap-projected dot in Heavenly without having to turn on true
  positions first. `resolveTargetAngles` extended with
  `c.Satellites`.
- **Revert:** `git checkout v-s000312 -- js/ui/mouseHandler.js`.

## S311 — Quick-toggle button for true-position markers

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:** New `◉ .true-btn` appended to `.compass-controls`
  after the 🎯 STM button. Clicking toggles
  `ShowTruePositions`; accent-border highlight when active.
  Matching CSS follows the `.stm-btn` pattern.
- **Revert:** `git checkout v-s000310 -- css/styles.css
  js/ui/controlPanel.js`.

## S310 — More reliable Heavenly / free-cam hover

- **Date:** 2026-04-24
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:**
  - Screen-space hit radius bumped `24 px → 40 px` for the
    Heavenly / free-cam hover test — dome markers project
    smaller than their Optical-cap counterparts, so the tighter
    radius was frequently missing.
  - `projectToCanvasPixels()` now forces
    `camera.updateMatrixWorld()` and recomputes
    `matrixWorldInverse` before projecting, so hover stays
    accurate even if the RAF render hasn't run between the
    last camera move and the pointer event. Same function also
    rejects points projecting further than ±1.2 in NDC so
    off-edge hits don't leak in.
  - `collectHeavenlyCandidates()` early-returns when
    `ShowTruePositions === false`; with dome markers hidden
    there's nothing to hover.
- **Revert:** `git checkout v-s000309 -- js/ui/mouseHandler.js`.

## S309 — Default TrackerTargets empty so STM actually hides bodies

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/ui/urlState.js`.
- **Change:** `TrackerTargets` default flipped from
  `['sun','moon','mercury','venus','mars','jupiter','saturn',
  'uranus','neptune']` to `[]`. The old default pre-populated
  the STM allow-set with every luminary and planet, so toggling
  the 🎯 quick-button whitelisted them all and nothing ever
  hid. Now an un-curated session starts with an empty tracker
  list, so clicking 🎯 with nothing selected leaves only the
  `FollowTarget` (if any) visible, which is what the rest of
  the STM flow expects. `URL_SCHEMA_VERSION` bumped
  `275` → `309` to drop stale stored target lists.
- **Revert:** `git checkout v-s000308 -- js/core/app.js
  js/ui/urlState.js`.

## S308 — Mirror trimmed Walter Bislin credit into README.md

- **Date:** 2026-04-24
- **Files changed:** `README.md`.
- **Change:** Walter Bislin bullet reduced to "visualization
  inspiration" to match `about.md`.
- **Revert:** `git checkout v-s000307 -- README.md`.

## S307 — Trim Walter Bislin credit to "visualization inspiration"

- **Date:** 2026-04-24
- **Files changed:** `about.md`.
- **Change:** Credits entry for Walter Bislin reduced to
  "visualization inspiration" per user direction.
- **Revert:** `git checkout v-s000306 -- about.md`.

## S306 — Move body-search box next to the View tab

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:**
  - Search box extracted from `.bar-left` and dropped into a
    new `.search-host` container between `.compass-controls`
    and `.tabs`, so the input sits immediately to the left of
    the View tab.
  - Width tightened 260 → 220 px; `.bar-left` goes back to
    simple spacer duty, `.search-host` uses `flex: 0 0 auto`
    with 8 px right margin.
- **Revert:** `git checkout v-s000305 -- css/styles.css
  js/ui/controlPanel.js`.

## S305 — Hover + click work in Heavenly / free-cam mode too

- **Date:** 2026-04-24
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:**
  - New `collectHeavenlyCandidates()` gathers every visible body
    in Heavenly (sun, moon, planets, cel-nav, catalogued, black
    holes, quasars, galaxies), respecting `ShowStars` /
    `ShowPlanets` and Specified-Tracker-Mode filtering
    (`TrackerTargets ∪ FollowTarget`).
  - `projectToCanvasPixels()` runs each candidate's world-space
    `vaultCoord` through the active Three.js camera matrix and
    returns canvas pixel coords. `findNearestInHeavenly()` then
    picks the nearest within a 24 px screen-space threshold.
  - Pointer-move in Heavenly / free-cam now shows the same
    name / Azi / Alt tooltip; hover detection caches
    `hoveredHit` exactly as in Optical.
  - Pointer-up click engages tracking in Heavenly too: without
    touching `ObserverHeading` / pitch, it sets `FollowTarget`,
    flips `FreeCamActive`, and applies the bird's-eye preset
    (`CameraHeight 80.3 / CameraDistance 10 / Zoom 4.67`).
- **Revert:** `git checkout v-s000304 -- js/ui/mouseHandler.js`.

## S304 — Drop redundant "Planets" label from Celestial Bodies grid

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** The Celestial Bodies button-grid row passes
  `label: ''`, same treatment Cel Nav / Constellations / Black
  Holes / Quasars / Galaxies already got; the containing group
  is already called "Celestial Bodies" so the second label was
  noise.
- **Revert:** `git checkout v-s000303 -- js/ui/controlPanel.js`.

## S303 — Body-search box on the far-left of the bottom bar

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:**
  - New `.body-search` input lives inside `.bar-left` (the
    previously empty space on the far left of the bottom bar).
  - Typing 3+ characters filters a flat index of every
    track-able body (sun, moon, 7 planets, cel-nav stars,
    catalogued constellation stars, black holes, quasars,
    galaxies) by prefix; falls back to substring if no prefix
    hits. Up to 12 suggestions, coloured per catalogue category.
  - ↑ / ↓ keys move the highlight, <kbd>Enter</kbd> engages,
    <kbd>Esc</kbd> closes.
  - Selecting a suggestion runs the tracking protocol: in
    Optical it sets `FollowTarget` + snaps
    `ObserverHeading / CameraHeight` to the body; in Heavenly it
    sets `FollowTarget`, flips `FreeCamActive`, and applies the
    bird's-eye preset (`CameraHeight 80.3 / CameraDistance 10 /
    Zoom 4.67`).
  - New `resolveTargetAngles()` helper in `controlPanel.js`
    mirrors the one in `mouseHandler.js` (local to avoid a cross
    import).
  - CSS: `.body-search` + `.body-search-input` +
    `.body-search-panel` + `.body-search-row` all added.
    `.bar-left` becomes `display: flex` so the search input
    anchors to the left edge with 260 px width / 40% max.
- **Revert:** `git checkout v-s000302 -- css/styles.css
  js/ui/controlPanel.js`.

## S302 — Always show the followed body's GP in Heavenly mode

- **Date:** 2026-04-24
- **Files changed:** `js/render/worldObjects.js`.
- **Change:** `TrackedGroundPoints.update()` now treats any info
  whose `target` equals `state.FollowTarget` as always-visible
  in Heavenly mode, alongside the `_followOnly` case. Fixes the
  bug where tracking a body already in `TrackerTargets` (e.g.
  Jupiter) would still hide its GP when `ShowGroundPoints` /
  `TrackerGPOverride` were off.
- **Revert:** `git checkout v-s000301 -- js/render/worldObjects.js`.

## S301 — Reset to DE405 default time + source when demos end

- **Date:** 2026-04-24
- **Files changed:** `js/demos/index.js`.
- **Change:** Demo manager RAF tick tracks `wasPlaying` and, when
  the animator transitions from playing → stopped with no queue
  item pending, calls a new `_snapToDefaultEphemeris()` that
  sets `DateTime: 812.88` (2019-03-23, inside DE405's tabulated
  range) and `BodySource: 'astropixels'`. Covers manual Stop,
  natural task-queue end, and end-of-queue in a "Play all"
  sequence.
- **Revert:** `git checkout v-s000300 -- js/demos/index.js`.

## S300 — Hover tooltip stacks Name / Azi / Alt on three lines

- **Date:** 2026-04-24
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:** `#celestial-hover` body is now three stacked `<div>`
  rows: the name (accent orange, bold) on top, `Azi: X.XX°` and
  `Alt: ±Y.YY°` below. Injected a small style block so the name
  line carries the accent colour.
- **Revert:** `git checkout v-s000299 -- js/ui/mouseHandler.js`.

## S299 — FollowTarget survives STM; drag clears STM; Optical re-entry keeps target centred

- **Date:** 2026-04-24
- **Files changed:** `js/main.js`, `js/render/constellations.js`,
  `js/render/index.js`, `js/render/worldObjects.js`,
  `js/ui/mouseHandler.js`.
- **Change:**
  - Every Specified-Tracker-Mode filter site (`CelNavStars`,
    `CatalogPointStars`, `Constellations`, and the sun / moon /
    planet markers + sun/moon GP dashed line in
    `render/index.js`) now adds `state.FollowTarget` to the
    allow-set alongside `TrackerTargets`. Clicking 🎯 while
    locked on a body keeps that body visible even if it was
    never in `TrackerTargets`.
  - `mouseHandler` drag-handler now also clears
    `SpecifiedTrackerMode` when a real drag breaks the follow,
    so the rest of the sky returns rather than leaving the
    canvas empty.
  - `main.js` Optical-entry handler: when `FollowTarget` is set,
    skip the default pitch-7.5° snap and just set `OpticalZoom`
    + clear `FreeCamActive`. The continuous follow listener in
    `mouseHandler` then re-aims heading/pitch at the target the
    very next update, so the body stays in screen centre after
    hopping back from Heavenly free-cam.
- **Revert:** `git checkout v-s000298 -- js/main.js
  js/render/constellations.js js/render/index.js
  js/render/worldObjects.js js/ui/mouseHandler.js`.

## S298 — Comprehensive about.md refresh

- **Date:** 2026-04-24
- **Files changed:** `about.md`.
- **Change:** Full pass to match the current UI: bottom-bar +
  tab-popup architecture, collapsible Live Moon Phases HUD,
  multi-column Live Ephemeris tracker toggle, bottom info strip
  with Tracking row, compass / perm-night / STM quick buttons,
  click-to-track + hover tooltips + FollowTarget, free-cam
  mode, Tracker Options sub-menu, Cel Nav / Constellations /
  Black Holes / Quasars / Galaxies sub-menus, keyboard
  shortcuts, URL schema version `275`. Credits and philosophy
  sections unchanged.
- **Revert:** `git checkout v-s000297 -- about.md`.

## S297 — Quick-button for Specified Tracker Mode on the bottom bar

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:** New `🎯 .stm-btn` appended to `.compass-controls`
  after `.night-btn`. Clicking toggles `SpecifiedTrackerMode`
  which hides every celestial object not present in
  `TrackerTargets`. Active state takes the same accent highlight
  as the other mode toggles. The Tracker Options checkbox stays
  as the verbose control.
- **Revert:** `git checkout v-s000296 -- css/styles.css
  js/ui/controlPanel.js`.

## S296 — FollowTarget GP always visible in Heavenly mode

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`, `js/ui/controlPanel.js`.
- **Change:**
  - `app.update()` now appends `FollowTarget` to the target
    loop if it isn't already in `TrackerTargets`. The extra
    entry is tagged `_followOnly: true` so consumers can choose
    whether to treat it like a normal tracker row.
  - `TrackedGroundPoints.update()` still gates the regular
    tracker GPs on `ShowGroundPoints || TrackerGPOverride`, but
    now always renders the GP (and its dashed vertical line) of
    any `_followOnly` info while in Heavenly mode.
  - `buildTrackerHud` filters `_followOnly` entries out before
    rendering, so following a body doesn't add a phantom block
    to the HUD.
- **Revert:** `git checkout v-s000295 -- js/core/app.js
  js/render/worldObjects.js js/ui/controlPanel.js`.

## S295 — New Tracker Options sub-menu

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** Tracker tab gets a new "Tracker Options" group
  between "Ephemeris" and "Celestial Bodies". It holds the
  three rows that previously sat at the top of "Celestial
  Bodies": Clear All Tracked button, Specified Tracker Mode
  checkbox, GP Override checkbox. "Celestial Bodies" now
  contains only the Planets button grid.
- **Revert:** `git checkout v-s000294 -- js/ui/controlPanel.js`.

## S294 — Reorder compass buttons N E S W → N S E W

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** Order of the compass-button definitions flipped
  so the visible order is `🌙 N S E W` instead of
  `🌙 N E S W`. Headings unchanged.
- **Revert:** `git checkout v-s000293 -- js/ui/controlPanel.js`.

## S293 — Permanent night button back to compass-controls, before N

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** `.night-btn` removed from `.time-controls` and
  appended as the first child of `.compass-controls`, so the
  button order in the right-hand group is `🌙 N E S W`.
- **Revert:** `git checkout v-s000292 -- js/ui/controlPanel.js`.

## S292 — Free-cam mode when leaving Optical with a tracked body

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/main.js`,
  `js/render/scene.js`, `js/ui/mouseHandler.js`.
- **Change:**
  - New session-only state `FreeCamActive` (default `false`).
  - `main.js` transition handler now flips `FreeCamActive: true`
    on Optical→Heavenly when `FollowTarget` is set (previously
    it just snapped the preset). Entering Optical clears the
    flag.
  - `scene.js` Heavenly-mode camera math branches when
    `FreeCamActive` and `FollowTarget` are both set: the
    same spherical offset (`CameraDirection / CameraHeight /
    CameraDistance / Zoom`) is applied *around the tracked
    body's ground point* instead of the disc origin, and
    `lookAt` is pinned to the GP. The GP is computed by a new
    `resolveTargetGp()` helper that mirrors `app.update()`'s
    `gpLat / gpLon` formulas for sun / moon / planets /
    catalogued bodies. Falls back to the old orbit math when
    the target can't be resolved.
  - `mouseHandler.js` drag handler now clears both
    `FollowTarget` and `FreeCamActive` on any real drag, so
    manual camera input breaks the lock and snaps back to the
    normal observer-anchored orbit view.
- **Revert:** `git checkout v-s000291 -- js/core/app.js
  js/main.js js/render/scene.js js/ui/mouseHandler.js`.

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
