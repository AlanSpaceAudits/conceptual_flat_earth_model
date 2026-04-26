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

## S408 — Fix `<kbd>` rendering in the Legend popup

- **Date:** 2026-04-25
- **Files changed:** `js/main.js`,
  `change_log_serials.md`.
- **Change:** the Legend's tiny markdown renderer escaped
  `<` / `>` first and then ran the `<kbd>…</kbd>` rewrite,
  which never matched. Pattern updated to match the
  escaped form `&lt;kbd&gt;…&lt;/kbd&gt;` so `<kbd>Esc</kbd>`
  renders as a real `<kbd>` element.
- **Revert:** `git checkout v-s000407 -- js/main.js`.

## S407 — Cycle-row language button restored as a shortcut; Legend fetches `about_<lang>.md`

- **Date:** 2026-04-25
- **Files changed:** `js/ui/controlPanel.js`,
  `js/main.js`,
  `css/styles.css`,
  `change_log_serials.md`.
- **Change:**
  - Cycle-row `btnLang` reinstated. Click no longer
    cycles; it calls `featureOpen.fn('Info', 'Language
    Select')`, which opens the Info tab and expands the
    Language Select group. Button face still shows the
    current 2-letter id (`EN` / `CZ` / `ES` / …).
  - `js/main.js`: Legend popup now tries
    `fetch('about_<lang>.md')` first and falls back to
    `about.md` if that 404s. Cached per-language; an
    `onLangChange` callback invalidates the cache and
    reloads if the popup is open. To translate the
    legend into a language, drop an `about_<lang>.md`
    file at the project root.
  - `css/styles.css`: `.lang-btn` style restored
    (bold + letter-spacing).
- **Revert:** `git checkout v-s000406 -- js/ui/controlPanel.js
  js/main.js css/styles.css`.

## S406 — Move language picker to Info → Language Select; browser-locale auto-detect; about.md tweaks

- **Date:** 2026-04-25
- **Files changed:** `js/ui/controlPanel.js`,
  `js/ui/i18n.js`,
  `js/main.js`,
  `css/styles.css`,
  `about.md`,
  `change_log_serials.md`.
- **Change:**
  - `controlPanel.js`: cycle-row `btnLang` removed.
    `LANG_NATIVE_NAMES` map added. Info tab gains a new
    `Language Select` group rendered as a 2-column grid of
    buttons (`label — native name`); click sets
    `state.Language`; only one button is `aria-pressed`.
    `GROUP_KEY` extended with `'Language Select' →
    'grp_language_select'`.
  - `i18n.js`: `grp_language_select` translations added for
    `en` / `cs` / `es` (others fall back to en).
  - `js/main.js`: on first load with no `Language` in the
    URL hash, walk `navigator.languages`; the first match
    against the supported set wins and is pushed via
    `setState`.
  - `css/styles.css`: `.lang-select-grid` (2-col grid) and
    `.lang-select-btn` styles, accent border + tinted
    background on `[aria-pressed="true"]`. Old
    `.lang-btn` rule removed.
  - `about.md`: tagline changed from "from a flat-earth
    disc" to "on a plane with a limit of vision"; the live
    URL is now an embedded markdown link.
- **Revert:** `git checkout v-s000405 -- js/ui/controlPanel.js
  js/ui/i18n.js js/main.js css/styles.css about.md`.

## S405 — Larger fonts for About + Legend popups (round 2)

- **Date:** 2026-04-25
- **Files changed:** `css/styles.css`,
  `change_log_serials.md`.
- **Change:**
  - `info-popup` font 16 → 19, width 520 → 620, padding
    14/18 → 18/22.
  - `legend-popup` body 16 → 19, width 880 → 1040, max-h
    82vh → 86vh; h1 24 → 30, h2 20 → 24, h3 17 → 20;
    tables 15 → 17; code 14 → 16; cell padding bumped.
- **Revert:** `git checkout v-s000404 -- css/styles.css`.

## S404 — Bigger font sizes for About + Legend popups

- **Date:** 2026-04-25
- **Files changed:** `css/styles.css`,
  `change_log_serials.md`.
- **Change:**
  - `header .info-popup` base font 13 → 16, line-height 1.4
    → 1.5; width 420 → 520; padding 10/12 → 14/18.
  - `.legend-popup` body font 12 → 16, line-height 1.45 →
    1.55; width 720 → 880; max-height 80vh → 82vh;
    h1 16 → 24, h2 14 → 20, h3 13 → 17; tables 11 → 15;
    code 11 → 14; padding bumped throughout.
- **Revert:** `git checkout v-s000403 -- css/styles.css`.

## S403 — Updated `about.md`; new Legend popup; About paragraphs + button labels translated

- **Date:** 2026-04-25
- **Files changed:** `about.md`,
  `index.html`,
  `js/main.js`,
  `js/ui/i18n.js`,
  `css/styles.css`,
  `change_log_serials.md`.
- **Change:**
  - `about.md` rewritten as a comprehensive feature
    reference + bottom-bar icon legend. Covers transport,
    compass, cycle row, cardinals, search boxes, every tab,
    every Tracker sub-menu, BSC architecture, demos,
    HUD panels, keyboard, languages, URL persistence, and
    credits. Single source of truth in English.
  - `index.html`: existing About button gains an `id`; a
    sibling **Legend** button (`📖`) added; the existing
    paragraphs gain `data-i18n` keys; an empty
    `legend-popup` div is the target for fetched markdown.
  - `js/main.js`: tiny markdown renderer (headings, lists,
    GFM tables, code spans, bold / italic, links).
    Legend button lazily fetches `about.md`, renders it,
    and shows the popup. Click-outside closes both popups
    via shared open helper. `refreshI18nNodes` walks
    `[data-i18n]` and pushes `t(key)` into each, registered
    on `onLangChange` so the About paragraphs swap when the
    picker changes.
  - `js/ui/i18n.js`: 5 new keys added per language —
    `about_btn`, `legend_btn`, `about_p1`, `about_p2`,
    `about_p3`. Translations in all 18 supported
    languages.
  - `css/styles.css`: `.legend-popup` rule for wider
    popup, scroll, table styling, code spans, accent
    headings.
- **Revert:** `git checkout v-s000402 -- about.md
  index.html js/main.js js/ui/i18n.js css/styles.css`.

## S402 — Move language picker into compass cycle-row as a cycler button

- **Date:** 2026-04-25
- **Files changed:** `js/ui/controlPanel.js`,
  `css/styles.css`,
  `change_log_serials.md`.
- **Change:**
  - Info-bar `<select class="lang-sel">` removed.
  - New `btnLang` (`.time-btn .lang-btn`) appended to
    `cycleRow` after `btnAzRing`, filling the empty
    bottom-right slot under the starfield button. Click
    cycles `state.Language` through `LANGUAGES`. Button
    face shows the current short id (EN / CZ / ES / …).
  - `bindTip(btnLang, 'lang_label')` so the tooltip
    reads "Language" / "Jazyk" / etc.
  - `.lang-sel` CSS deleted; new `.lang-btn` rule sets
    bold + 0.5px letter-spacing so the 2-char codes read
    cleanly.
- **Revert:** `git checkout v-s000401 -- js/ui/controlPanel.js
  css/styles.css`.

## S401 — Add 15 more languages (FR / DE / IT / PT / PL / NL / SK / RU / AR / HE / ZH / JA / KO / TH / HI)

- **Date:** 2026-04-25
- **Files changed:** `js/ui/i18n.js`,
  `js/main.js`,
  `change_log_serials.md`.
- **Change:**
  - 15 language blocks appended to `STRINGS`, each
    covering all 96 i18n keys.
  - `LANGUAGES` list expanded to 18 entries (existing
    EN / CZ / ES + 15 new).
  - `js/ui/i18n.js` exports `isRtl(id)` and an
    `RTL_LANGS` set covering `ar`, `he`.
  - `js/main.js` `refreshTitle` now also sets
    `document.documentElement.dir` to `'rtl'` for RTL
    languages and `'ltr'` otherwise, so the layout
    mirrors when Arabic or Hebrew is active.
- **Revert:** `git checkout v-s000400 -- js/ui/i18n.js
  js/main.js`.

## S400 — Translate Sun/Moon-vault status text + next eclipse readouts

- **Date:** 2026-04-25
- **Files changed:** `js/ui/i18n.js`,
  `js/ui/controlPanel.js`,
  `js/main.js`,
  `change_log_serials.md`.
- **Change:**
  - i18n keys added: `beyond_vault`, `within_vault`,
    `twilight_civil`, `twilight_nautical`,
    `twilight_astronomical`, `daylight`, `night`,
    `sun_never_leaves`, `sun_never_enters`,
    `next_solar_eclipse`, `next_lunar_eclipse`. `cs` and
    `es` translations supplied.
  - `js/main.js` `defaultStatus` builds the description
    string from the new keys.
  - `controlPanel.js` HUD lines for Sun and Moon use
    `t('beyond_vault')` when below horizon; eclipse readout
    lines use `t('next_solar_eclipse')` / `t('next_lunar_eclipse')`.
- **Revert:** `git checkout v-s000399 -- js/ui/i18n.js
  js/ui/controlPanel.js js/main.js`.

## S399 — Translate header text, Camera/Vault/Date sliders, autoplay UI, Live panels

- **Date:** 2026-04-25
- **Files changed:** `js/ui/i18n.js`,
  `js/ui/controlPanel.js`,
  `js/ui/autoplay.js`,
  `js/main.js`,
  `index.html`,
  `change_log_serials.md`.
- **Change:**
  - i18n STRINGS gains keys for the app header
    (`app_title`, `app_subtitle`), the Live Moon Phases
    panel header, the Live Ephemeris Data tab button,
    Camera / Vault / Date numeric-row labels
    (`lbl_camera_dir`, `lbl_camera_height`,
    `lbl_camera_dist`, `lbl_zoom`, `lbl_elevation`,
    `lbl_vault_size`, `lbl_vault_height`,
    `lbl_day_of_year`, `lbl_time`, `lbl_datetime`,
    `lbl_timezone`, `lbl_date_time_field`), and autoplay
    chrome (`btn_pause`, `btn_play`, `status_running`,
    `status_paused`, `btn_day`, `btn_week`, `btn_month`,
    `btn_year`, `lbl_speed`). `cs` and `es` translations
    supplied.
  - `LABEL_KEY` extended with the new English label
    strings.
  - `dateTimeRow` and `timezoneRow` (built outside the
    `buildRow` dispatcher) now bind their `<label>` via
    `bindTranslatable`.
  - Live Moon Phases header text node and the Live
    Ephemeris Data tab button text now read through
    `t()` and re-render via `onLangChange`.
  - `js/ui/autoplay.js` imports `t` and `onLangChange`,
    binds the Day / Week / Month / Year preset buttons,
    the Speed label, and the Pause / Play / running /
    paused refresh strings.
  - `index.html` h1 + `.sub` get ids `app-title` and
    `app-subtitle`; `js/main.js` translates them on
    boot and on every language change.
- **Revert:** `git checkout v-s000398 -- js/ui/i18n.js
  js/ui/controlPanel.js js/ui/autoplay.js js/main.js
  index.html`.

## S398 — Translate bottom-bar tooltips

- **Date:** 2026-04-25
- **Files changed:** `js/ui/i18n.js`,
  `js/ui/controlPanel.js`,
  `change_log_serials.md`.
- **Change:**
  - 18 `tip_*` keys added to `STRINGS` for the bottom-bar
    button tooltips (vault swap, rew/play/ff, slow/speed,
    end-demo, clear-follow, night, true-positions, STM,
    tracker-opts jump, observer jump, freecam, map,
    starfield, az-ring, grids). `cs` and `es` translations
    supplied.
  - New `bindTip(el, key)` helper sets `el.title = t(key)`
    and registers an `onLangChange` callback.
  - Every `btn.title = '...'` assignment in
    `buildBottomBar` swapped for `bindTip(btn, '<key>')`.
- **Revert:** `git checkout v-s000397 -- js/ui/i18n.js
  js/ui/controlPanel.js`.

## S397 — Translate row labels and clickRow button labels

- **Date:** 2026-04-25
- **Files changed:** `js/ui/i18n.js`,
  `js/ui/controlPanel.js`,
  `change_log_serials.md`.
- **Change:**
  - `i18n.js` STRINGS dict gains `lbl_*` keys for the
    Show / Tracker tab row labels (Heavenly Vault,
    Optical Vault Grid, Azimuth ring, FE Grid, Sun Track,
    Source, Observer lat/long, etc.) plus an extra set of
    `grp_*` keys for the Show tab's `Heavenly Vault`,
    `Ground / Disc`, and `Date / Time` group titles.
    `cs` and `es` translations supplied.
  - `controlPanel.js` adds `LABEL_KEY` and
    `BUTTON_LABEL_KEY` reverse-maps and a
    `bindTranslatable(node, text, keyMap)` helper that
    sets `textContent` and registers an `onLangChange`
    callback when the original text has a translation key.
  - `buildRow` dispatcher captures the built `el`, binds
    the first `<label>` via `LABEL_KEY`, and binds
    `clickRow`'s button text via `BUTTON_LABEL_KEY`.
- **Revert:** `git checkout v-s000396 -- js/ui/i18n.js
  js/ui/controlPanel.js`.

## S396 — Rename group-header title span class to avoid display:none collision

- **Date:** 2026-04-25
- **Files changed:** `js/ui/controlPanel.js`,
  `change_log_serials.md`.
- **Change:** the title span class `.group-title` collided with an
  existing rule `.group-title { display: none; }` in
  `css/styles.css`, hiding every group header title. Renamed to
  `.group-header-title`.
- **Revert:** `git checkout v-s000395 -- js/ui/controlPanel.js`.

## S395 — Build group header via createElement instead of innerHTML

- **Date:** 2026-04-25
- **Files changed:** `js/ui/controlPanel.js`,
  `change_log_serials.md`.
- **Change:** group header construction switched from a single
  `header.innerHTML = '<span>...</span><span>...</span>'` template
  literal to explicit `createElement` calls for the arrow and
  title spans. Avoids edge cases where the template-literal
  output rendered an empty title; the `onLangChange` handler
  binds directly to the created `titleSpan` reference.
- **Revert:** `git checkout v-s000394 -- js/ui/controlPanel.js`.

## S394 — Translate group titles (Observer, Camera, Vault of the Heavens, …)

- **Date:** 2026-04-25
- **Files changed:** `js/ui/i18n.js`,
  `js/ui/controlPanel.js`,
  `change_log_serials.md`.
- **Change:**
  - `i18n.js` STRINGS dict gains `grp_*` keys for all
    FIELD_GROUPS group titles plus the Time-tab specials
    (`Calendar`, `Autoplay`). Translations supplied for
    `cs` and `es`.
  - `buildGroup` looks up `GROUP_KEY[title]` to find the
    translation key, renders the initial title via `t()`,
    and registers an `onLangChange` callback that
    rewrites the title `<span>` when the language flips.
- **Revert:** `git checkout v-s000393 -- js/ui/i18n.js
  js/ui/controlPanel.js`.

## S393 — Language select clickable through info-bar's pointer-events shield

- **Date:** 2026-04-25
- **Files changed:** `css/styles.css`,
  `change_log_serials.md`.
- **Change:** `.lang-sel` rule gains
  `pointer-events: auto; cursor: pointer;` so the dropdown
  receives clicks past the `#info-bar { pointer-events: none }`
  rule that lets canvas drags pass through.
- **Revert:** `git checkout v-s000392 -- css/styles.css`.

## S392 — Language picker (EN / CZ / ES) + i18n scaffolding

- **Date:** 2026-04-25
- **Files changed:** `js/ui/i18n.js` (new),
  `js/core/app.js`,
  `js/ui/controlPanel.js`,
  `js/ui/urlState.js`,
  `css/styles.css`,
  `change_log_serials.md`.
- **Change:**
  - New `js/ui/i18n.js` exports `t(key)`, `setLang(id)`,
    `onLangChange(fn)`, and `LANGUAGES`. Translations
    bundled for `en`, `cs`, `es` covering tab labels,
    BSC sub-menu button labels, and key bottom-bar
    tooltips.
  - New state field `Language` (default `'en'`) in
    `defaultState()`. Persisted in URL hash via
    `PERSISTED_KEYS` + `STRING_KEYS`.
  - Tab-button registration translates each label via
    `t(TAB_KEY[label])` and registers an `onLangChange`
    handler so each button retranslates in place when
    the language flips.
  - Info-bar gains an `EN / CZ / ES` `<select>`. Change
    flows into `state.Language`; a model-update listener
    pushes the value into `setLang` so subscribed labels
    re-translate.
  - `.lang-sel` styled to match the row inputs.
- **Revert:** `git checkout v-s000391 -- js/core/app.js
  js/ui/controlPanel.js js/ui/urlState.js css/styles.css`;
  `rm js/ui/i18n.js`.

## S391 — Default ObserverFigure switched from 'bear' to 'nikki'

- **Date:** 2026-04-25
- **Files changed:** `js/core/app.js`,
  `change_log_serials.md`.
- **Change:** `defaultState().ObserverFigure` flipped from
  `'bear'` to `'nikki'`. Returning visitors keep whatever
  value their URL hash carries; first-time loads get
  Not-Nikki-Minaj as the observer figure.
- **Revert:** `git checkout v-s000390 -- js/core/app.js`.

## S390 — BSC isolated to its own BscTargets list, ShowBsc is the single render gate

- **Date:** 2026-04-25
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`,
  `js/render/index.js`,
  `js/ui/controlPanel.js`,
  `js/ui/urlState.js`,
  `change_log_serials.md`.
- **Change:**
  - New state field `BscTargets` (array, default `[]`).
    Persisted in URL hash via `PERSISTED_KEYS` and the
    comma-joined `ARRAY_KEYS` set.
  - `CatalogPointStars` constructor accepts a `trackerKey`
    option (defaults `'TrackerTargets'`). The BSC layer
    instantiates with `trackerKey: 'BscTargets'` so its
    membership check reads `state.BscTargets`. Other
    catalog layers stay on `TrackerTargets`.
  - `app.js` builds `c.BscStars` from BSC entries that have
    a usable `raH` / `decD` and are not `kind: 'planet'`.
    `ShowBsc` is the single render gate.
  - BSC sub-menu's Enable All / Disable All / Disable
    Satellites and the button grid now read and write
    `BscTargets`. Planet entries (`kind: 'planet'`) are
    omitted from the grid since the BSC layer cannot render
    their dynamic positions; they remain available via the
    Celestial Bodies sub-menu.
- **Revert:** `git checkout v-s000389 -- js/core/app.js
  js/render/worldObjects.js js/render/index.js
  js/ui/controlPanel.js js/ui/urlState.js`.

## S389 — Tag native-rendered BSC entries; new "Disable Satellites" button

- **Date:** 2026-04-25
- **Files changed:** `js/core/brightStarCatalog.js`,
  `js/core/app.js`,
  `js/ui/controlPanel.js`,
  `change_log_serials.md`.
- **Change:**
  - `brightStarCatalog.js` `tag()` helper gains an optional
    `nativeRendered` flag. CEL_NAV_STARS, CATALOGUED_STARS,
    BLACK_HOLES, original GALAXIES / QUASARS / SATELLITES, and
    every entry whose `kind === 'planet'` are tagged
    `nativeRendered: true` because their native renderer
    already paints them.
  - `app.js` builds `c.BscStars` from
    `BRIGHT_STAR_CATALOG.filter((e) => !e.nativeRendered)`.
    Toggling `ShowBsc` only spins up dots for the genuinely-
    new extras (HYG-named, GALAXIES_EXTRA / EXTRA2,
    QUASARS_EXTRA / EXTRA2, SATELLITES_EXTRA, Pluto). The
    button-grid still iterates the full union so highlights
    cover every entry.
  - New "Disable Satellites" button in the BSC sub-menu.
    Clears every `'star:sat_*'` id (both the original 12 and
    the ~500 extras) from `TrackerTargets` while leaving
    other categories untouched.
- **Revert:** `git checkout v-s000388 -- js/core/brightStarCatalog.js
  js/core/app.js js/ui/controlPanel.js`.

## S388 — Bulk catalog expansion: +500 stars, +500 galaxies, +500 quasars, +500 satellites, sun/moon/planets/Pluto

- **Date:** 2026-04-25
- **Files changed:** `js/core/_namedStarsHygExtra.js` (new),
  `js/core/galaxiesExtra2.js` (new),
  `js/core/quasarsExtra2.js` (new),
  `js/core/satellitesExtra.js` (new),
  `js/core/solarSystem.js` (new),
  `js/core/brightStarCatalog.js`,
  `js/core/app.js`,
  `js/render/index.js`,
  `js/ui/controlPanel.js`,
  `css/styles.css`,
  `change_log_serials.md`.
- **Change:**
  - **+500 named-designation stars** built from HYG v41
    entries lacking a proper name. Bayer / Flamsteed
    designation preferred, falling back to HD / HIP catalogue
    number. Brightest 500 by `mag`.
    `js/core/_namedStarsHygExtra.js` exports
    `NAMED_STARS_HYG_EXTRA`.
  - **+500 galaxies** drawn from OpenNGC entries 200..700
    (next-brightest after the existing extras).
    `js/core/galaxiesExtra2.js` exports `GALAXIES_EXTRA2`.
  - **+500 quasars** drawn from VizieR VII/258 entries 200..700
    by `Vmag`. `js/core/quasarsExtra2.js` exports
    `QUASARS_EXTRA2`.
  - **+~500 satellites** parsed from CelesTrak TLE feeds
    (`stations`, `visual`, `science`, `weather`, `iridium-NEXT`,
    `gps-ops`, `glo-ops`, `geo`, sample of `starlink`).
    Per-group caps prevent any single feed from dominating.
    Two-line elements converted to the existing simplified
    Kepler schema (`epoch JD`, `incl`, `raan`, `argPerigee`,
    `meanAnom`, `meanMotion`, `ecc`).
    `js/core/satellitesExtra.js` exports `SATELLITES_EXTRA`.
  - **Solar-system roster** in `js/core/solarSystem.js`:
    nine `kind: 'planet'` entries (Sun, Moon, Mercury–Neptune)
    that map onto the existing planet tracker ids, plus a
    static placeholder Pluto entry at J2000.0 RA/Dec
    (16.78639 h, -11.37361°) that flows through the BSC star
    pipeline.
  - `brightStarCatalog.js` consumes every new source. Eight
    contributing source modules now feed the union, deduped by
    id, total ~2967 entries.
  - `app.js` projects the combined `[...SATELLITES,
    ...SATELLITES_EXTRA]` into `c.Satellites` so the existing
    satellite renderer paints all of them; the GP-path loop
    iterates the same union. Satellite info-resolver falls
    back to the projected entry when `satelliteById` returns
    null for an extras id.
  - `render/index.js` satellite layer `maxCount` raised to
    1024 to fit the union.
  - `controlPanel.js`: `BODY_SEARCH_INDEX` extended with the
    four new sources plus a Pluto entry. BSC button-grid +
    Enable All / Disable All routes planets through the plain
    tracker id (`'sun'`, `'moon'`, `'mercury'`, …) and stars
    through `'star:<id>'`, so toggling a planet entry adds the
    same id the existing Celestial-Bodies sub-menu uses.
  - `css/styles.css`: `#bottom-bar .compass-controls`
    `margin-top` adjusted to `-18px` so the cluster sits
    further above the bar baseline.
- **Revert:** `git checkout v-s000387 -- js/core/app.js
  js/core/brightStarCatalog.js js/render/index.js
  js/ui/controlPanel.js css/styles.css`; `rm
  js/core/_namedStarsHygExtra.js js/core/galaxiesExtra2.js
  js/core/quasarsExtra2.js js/core/satellitesExtra.js
  js/core/solarSystem.js`.

## S387 — Revert S386; raise compass cluster vertically; ▦ also toggles azimuth ring + longitude ring

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`,
  `js/ui/controlPanel.js`,
  `change_log_serials.md`.
- **Change:**
  - `mode-grid` and `cycle-row` `grid-template` reverted to
    the prior 3×2 / 2×2 layouts.
  - `#bottom-bar .compass-controls` now uses
    `align-items: flex-start` and `margin-top: -6px` so the
    cluster sits higher on the bar.
  - `▦ grids-btn` toggle expanded to also flip
    `ShowAzimuthRing` and `ShowLongitudeRing` together with
    `ShowFeGrid` and `ShowOpticalVaultGrid`. Pressed-state
    highlight follows the OR of all four flags.
- **Revert:** `git checkout v-s000386 -- css/styles.css
  js/ui/controlPanel.js`.

## S386 — Compass mode-grid and cycle-row collapsed to single rows

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`,
  `change_log_serials.md`.
- **Change:** `#bottom-bar .mode-grid` switched from
  `repeat(3, auto) × repeat(2, 1fr)` to
  `repeat(6, auto) × 1fr`. `#bottom-bar .cycle-row`
  switched from `repeat(2, auto) × repeat(2, 1fr)` to
  `repeat(3, auto) × 1fr`. The previous bottom-row icons
  (▦, 📍, 🎥 in mode-grid; 🧭 in cycle-row) now sit on the
  single top row alongside the rest. `cardinal-grid` keeps
  its 2×2 compass-rose layout.
- **Revert:** `git checkout v-s000385 -- css/styles.css`.

## S385 — Add Milky Way (Galactic Centre) to GALAXIES

- **Date:** 2026-04-24
- **Files changed:** `js/core/galaxies.js`,
  `change_log_serials.md`.
- **Change:** new entry `gal_milky_way` "Milky Way (Galactic
  Centre)" appended to `GALAXIES`. RA / Dec point at Sgr A*
  at J2000.0 (`raH: 17.76112`, `decD: -29.00781`); apparent
  magnitude `4.5` placeholder for the central bulge region.
  The entry flows through the existing galaxy plumbing
  (`projectStar`, GP path, tracker info, BSC union, body
  search) without further wiring.
- **Revert:** `git checkout v-s000384 -- js/core/galaxies.js`.

## S384 — BSC render cap raised 1024 → 4096

- **Date:** 2026-04-24
- **Files changed:** `js/render/index.js`,
  `change_log_serials.md`.
- **Change:** `bscStars` `CatalogPointStars` constructor arg
  `maxCount` raised from 1024 to 4096 so the full Bright Star
  Catalog union (947 entries today, headroom for additions)
  fits without being silently truncated by
  `Math.min(entries.length, this._maxStars)` in
  `update()`.
- **Revert:** `git checkout v-s000383 -- js/render/index.js`.

## S383 — Decouple canonicalLatLongToDisc from MapProjection (rollback ground↔sky linking)

- **Date:** 2026-04-24
- **Files changed:** `js/core/canonical.js`,
  `change_log_serials.md`.
- **Change:** `canonicalLatLongToDisc` rewritten to return the
  fixed north-pole AE-polar formula
  (`r = (90 - lat) / 180`, `xy = r·(cos lon, sin lon)`)
  regardless of the loaded `MapProjection`. `setActiveProjection`
  reduced to a no-op stub so existing callers in `main.js` still
  resolve. FE grid lines, observer placement, and every
  above-disc anchor (`pointOnFE`, `vaultCoordAt`,
  `celestLatLongToVaultCoord`) reach this function and therefore
  all share one fixed AE-polar coordinate framework. The
  `MapProjection` selector continues to drive the art layer
  (HQ raster textures via `buildImageMap`, math projections via
  `buildGeoJsonLand`) without touching the coordinate framework.
- **Revert:** `git checkout v-s000382 -- js/core/canonical.js`.

## S382 — Bottom-bar reshuffle: search next to View, bigger compass icons, speed in info-bar, combined FE+Vault grid toggle

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`, `css/styles.css`,
  `change_log_serials.md`.
- **Change:**
  - Search hosts (`searchHost`, `featureHost`) moved out of
    `bar` and inserted at the head of `tabsBar`. With
    `tabsBar`'s `justify-content: flex-end`, the search inputs
    now sit immediately to the left of the View tab on the
    right side of the bar.
  - Compass-cluster buttons (mode-grid, cycle-row,
    cardinal-grid `.time-btn`s) bumped to `min-width 36px`,
    `font-size 14px`, `line-height 18px`, `padding 2px 8px`.
  - New `.info-slot[data-k="speed"]` appended after the date
    slot in the info-bar. `refreshTimeControls` now writes the
    same `+x.xxx d/s` (or `demo X×` during a demo) string to
    both `speedReadout` and the new info-bar slot.
  - New `▦ grids-btn` appended to `compassControls` after the
    cardinal grid. Click toggles `ShowFeGrid` and
    `ShowOpticalVaultGrid` together. `aria-pressed` follows
    `ShowFeGrid || ShowOpticalVaultGrid`. Accent border on
    pressed state styled in `css/styles.css`.
- **Revert:** `git checkout v-s000381 -- js/ui/controlPanel.js
  css/styles.css`.

## S381 — Centre bear sprite over observer GP; hide cross marker when figure is drawn

- **Date:** 2026-04-24
- **Files changed:** `js/render/worldObjects.js`,
  `change_log_serials.md`.
- **Change:**
  - Bear sprite position derived from the image's content bbox
    (centre x = 968 / 1920, feet y = 839 / 1080) so its feet sit
    on the disc at z = 0 and its horizontal centre lands directly
    over the observer ground point.
  - Observer's red `cross` LineSegments now hidden whenever
    `ObserverFigure !== 'none'`, matching the existing
    `marker` visibility rule.
- **Revert:** `git checkout v-s000380 -- js/render/worldObjects.js`.

## S380 — Replace bear primitive figure with sprite-based bear

- **Date:** 2026-04-24
- **Files changed:** `js/render/worldObjects.js`,
  `assets/observer_bear.png` (new, copied from
  `~/Downloads/bear.png`),
  `change_log_serials.md`.
- **Change:** the bear branch of `_buildFigure` switched from the
  primitive-mesh build (sphere torso + head + snout + four legs)
  to a `THREE.Sprite` driven by the new
  `assets/observer_bear.png` (1920×1080, transparent
  background). Mirrors the Nikki sprite path: height
  0.10 disc-units, aspect 1920/1080, centred at `z = h/2`,
  `renderOrder = 110`.
- **Revert:** `git checkout v-s000379 -- js/render/worldObjects.js`;
  `rm assets/observer_bear.png`.

## S379 — Route observer + above-disc body anchors through canonicalLatLongToDisc

- **Date:** 2026-04-24
- **Files changed:** `js/core/feGeometry.js`,
  `change_log_serials.md`.
- **Change:** `pointOnFE`, `feLatLongToGlobalFeCoord`,
  `vaultCoordAt`, and `celestLatLongToVaultCoord` switched from
  the hard-coded AE-polar formula to `canonicalLatLongToDisc`.
  Observer disc position, sun / moon / planet / star / satellite
  vault anchors, and the vault-cap geometry all now follow the
  active map projection in lockstep with the FE grid lines, GP
  polylines, and GeoJSON land outlines.
  - Comments in `feGeometry.js` reduced to a single neutral line
    pointing to the canonical router.
  - `compTransMatLocalFeToGlobalFe` and
    `compTransMatCelestToGlobe` are intentionally untouched in
    this serial; the celestial-frame rotation tied to projection
    geometry is the next step in the chain and is left for a
    follow-up serial so demos and tracker behavior verifiable
    against AE polar remain numerically identical at this commit.
- **Revert:** `git checkout v-s000378 -- js/core/feGeometry.js`.

## S378 — Move ShowConstellationLines into the Constellations sub-menu

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`,
  `change_log_serials.md`.
- **Change:** `ShowConstellationLines` (`Outlines`) row removed
  from `Tracker Options` and reinstated inside the
  `Constellations` Tracker sub-menu, between `Show` and
  `GP Override`.
- **Revert:** `git checkout v-s000377 -- js/ui/controlPanel.js`.

## S377 — Three AE Aries starfield charts; move Starfield group to Tracker tab

- **Date:** 2026-04-24
- **Files changed:** `js/render/starfieldChart.js`,
  `js/ui/controlPanel.js`,
  `assets/starfield_ae_aries.png` (new),
  `assets/starfield_ae_aries_2.png` (new),
  `assets/starfield_ae_aries_3.png` (new),
  `change_log_serials.md`.
- **Change:**
  - 3 new starfield textures copied from `~/Pictures/maps/`
    (`AE_Aries.png`, `AE_Aries_5.png`, `AE_Aries_3.png`) to
    `assets/starfield_ae_aries{,_2,_3}.png`.
  - `StarfieldChart` constructor refactored to a chart map
    keyed by StarfieldType id; each entry carries its own
    width/height so the inscribed-circle crop is computed
    per-chart rather than hard-coded for 1920×1080.
    `update()` reads from the map and writes
    `uTexRepeat` / `uTexOffset` per frame so charts with
    different aspect ratios all sample correctly.
  - `controlPanel.js`: Starfield group moved out of the Show
    tab and into the Tracker tab, between "Ephemeris" and
    "Tracker Options". `StarfieldType` select gains
    `ae_aries`, `ae_aries_2`, `ae_aries_3`. `STARFIELD_CYCLE`
    walks the same seven ids.
- **Revert:** `git checkout v-s000376 -- js/render/starfieldChart.js
  js/ui/controlPanel.js`; `rm assets/starfield_ae_aries*.png`.

## S376 — Restore black-disc option to HQ Map Art

- **Date:** 2026-04-24
- **Files changed:** `js/core/projections.js`,
  `change_log_serials.md`.
- **Change:** new `hq_blank` projection entry tagged
  `category: 'hq'` with `renderStyle: 'blank'`, using the same
  AE polar math as the default `ae` entry. Appears as
  "Blank (black disc)" at the top of the HQ Map Art dropdown.
  The original `blank` entry under Generated is unchanged.
- **Revert:** `git checkout v-s000375 -- js/core/projections.js`.

## S375 — Add .nojekyll to fix Pages 404 on _namedStarsHyg.js

- **Date:** 2026-04-24
- **Files changed:** `.nojekyll` (new),
  `change_log_serials.md`.
- **Change:** GitHub Pages' default Jekyll build silently
  drops files whose names start with `_` (treats them as
  partials), causing `js/core/_namedStarsHyg.js` to 404 on
  the deployed site even though it lives in the repo. Adding
  an empty `.nojekyll` at the project root disables the Jekyll
  pass and makes Pages serve the file tree verbatim.
- **Revert:** `rm .nojekyll`.

## S374 — HQ AE polar (day / night) added

- **Date:** 2026-04-24
- **Files changed:** `js/core/projections.js`,
  `assets/map_hq_ae_polar_day.png` (new),
  `assets/map_hq_ae_polar_night.png` (new),
  `change_log_serials.md`.
- **Change:**
  - 2 HQ AE-polar rasters copied from `~/Pictures/maps/`
    (`azi_EA0_E90_N0_Daytime.png`, `..._Nighttime.png`) to
    `assets/map_hq_ae_polar_day.png` / `..._night.png`
    (2476×1246 each).
  - Two new HQ entries in `PROJECTIONS`: `hq_ae_polar_day`
    and `hq_ae_polar_night`. Both use the same
    `RADIAL_AE` polar math as the default `ae` entry, so
    the FE grid lines up.
- **Revert:** `git checkout v-s000373 -- js/core/projections.js`;
  `rm assets/map_hq_ae_polar_*.png`.

## S373 — Map Projection dropdowns side-by-side, equal width

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`, `css/styles.css`,
  `change_log_serials.md`.
- **Change:**
  - New `pairSelectRow` row builder in `controlPanel.js` renders
    two `<select>`s side-by-side bound to one state key. Each
    side prefixes a `— <label> —` placeholder option so the
    inactive side reads as empty without dropping out of the
    DOM. Selecting either side writes its value to the model.
  - Map Projection group switched from two stacked rows to one
    `pairSelect` row.
  - `css/styles.css`: new `.row.pair-select` rule —
    `grid-template-columns: 1fr 1fr` so the two selects share
    the row width equally and share a top edge.
- **Revert:** `git checkout v-s000372 -- js/ui/controlPanel.js
  css/styles.css`.

## S372 — Map Projection menu split: HQ raster maps vs Generated math

- **Date:** 2026-04-24
- **Files changed:** `js/core/projections.js`,
  `js/ui/controlPanel.js`,
  `assets/map_hq_equirect_day.jpg` (new),
  `assets/map_hq_equirect_night.jpg` (new),
  `assets/map_hq_ae_dual.png` (new),
  `assets/map_hq_gleasons.png` (new),
  `assets/map_hq_world_shaded.jpg` (new),
  `assets/map_hq_ortho.png` (new),
  `change_log_serials.md`.
- **Change:**
  - 6 HQ raster maps copied from `~/Pictures/maps/` into
    `assets/` with `map_hq_*` prefixes.
  - `projections.js`: every entry gains a `category` field
    (`'generated'` or `'hq'`). New `projectOrthographic`
    function plus a `'orthographic'` generated entry. Six new
    HQ entries (`hq_equirect_day`, `hq_equirect_night`,
    `hq_ae_dual`, `hq_gleasons`, `hq_world_shaded`,
    `hq_ortho`) each carrying `imageAsset` + the matching
    grid-math `project()` so FE coordinates align. New
    exports `listGeneratedProjections()` and `listHqMaps()`.
  - `controlPanel.js`: the "Map Projection" group now renders
    two dropdowns — "HQ Map Art" (HQ entries) and
    "Generated" (math entries). Both bind to
    `state.MapProjection`; selecting either one writes the
    chosen id.
- **Revert:** `git checkout v-s000371 -- js/core/projections.js
  js/ui/controlPanel.js`; `rm assets/map_hq_*`.

## S371 — Revert S370 optical-vault projection-coupling

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/render/worldObjects.js`,
  `change_log_serials.md`.
- **Change:**
  - `opticalVaultProject` reverted to the pre-S370 form
    (`[localGlobe[0]*H, localGlobe[1]*R, localGlobe[2]*R]`).
  - `ObserversOpticalVault` rebuilds removed; wire grid uses
    `buildLatLongHemisphereGeom` again. `_lastProj` cache removed.
  - `buildProjectedHemisphereGeom` deleted.
- **Revert:** `git checkout v-s000370 -- js/core/app.js
  js/render/worldObjects.js`.

## S370 — Optical vault follows the active MapProjection

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/render/worldObjects.js`,
  `change_log_serials.md`.
- **Change:**
  - `opticalVaultProject(localGlobe, R, H)` in `app.js` rewritten:
    converts the local (zenith / east / north) direction to
    (elevation, azimuth), routes through
    `canonicalLatLongToDisc(elevation, azimuth, R*2)`, and packs
    the projected `(x, y)` back into the local frame.
    Vertical scale `H * sin(elev)` preserved. AE polar still
    produces the original concentric-ring dome (horizon at
    radius R); other projections warp the dome accordingly.
  - `worldObjects.js` adds `buildProjectedHemisphereGeom(...)`:
    same alt/az grid as `buildLatLongHemisphereGeom` but each
    `(elev, az)` routed through `canonicalLatLongToDisc`.
  - `ObserversOpticalVault` builds its wire grid via the new
    function, caches `_lastProj`, and rebuilds the geometry in
    `update()` whenever `state.MapProjection` changes — the
    dome's gridlines warp with the disc's gridlines.
- **Revert:** `git checkout v-s000369 -- js/core/app.js
  js/render/worldObjects.js`.

## S369 — BSC becomes a union catalog; 🗺 button opens existing dropdown; FE grid order fix

- **Date:** 2026-04-24
- **Files changed:** `js/core/galaxies.js`, `js/core/quasars.js`,
  `js/core/_namedStarsHyg.js` (renamed from
  `brightStarCatalog.js`), `js/core/brightStarCatalog.js`
  (rewritten as union), `js/render/worldObjects.js`,
  `js/render/index.js`, `js/ui/controlPanel.js`, `js/main.js`,
  `change_log_serials.md`.
- **Change:**
  - `galaxies.js` and `quasars.js` reverted to pure-base lists;
    `GALAXIES_EXTRA` / `QUASARS_EXTRA` no longer concatenated.
  - HYG-named star list moved out of `brightStarCatalog.js` into
    `_namedStarsHyg.js` and exported as `NAMED_STARS_HYG`.
  - `brightStarCatalog.js` rewritten as a union: `CEL_NAV_STARS`
    + `CATALOGUED_STARS` + `BLACK_HOLES` + `GALAXIES` + `QUASARS`
    + `NAMED_STARS_HYG` + `GALAXIES_EXTRA` + `QUASARS_EXTRA`,
    each entry tagged with its source `cat` and `color`. Dedup
    by id.
  - `CatalogPointStars` (`worldObjects.js`) gains a
    `perVertexColors` constructor option. When true, allocates
    Float32 color buffers, sets `vertexColors: true` on
    materials, and writes each entry's `.color` as RGB.
  - `render/index.js`: BSC layer instantiated with
    `perVertexColors: true`, `maxCount: 1024`.
  - `controlPanel.js`: BSC button-grid colours now come from
    `entry.color` (per-entry hex) instead of a hard-coded
    catalog colour. `BODY_SEARCH_INDEX` adds entries from
    `NAMED_STARS_HYG`, `GALAXIES_EXTRA`, `QUASARS_EXTRA`
    (the genuinely new sources, not duplicates).
  - 🗺 button in the bottom bar now calls
    `featureOpen.fn('Show', 'Map Projection')` to open the
    existing Show-tab dropdown. The custom
    `.map-picker-popup` and `MAP_CYCLE` array are removed.
    Escape handler simplified accordingly.
  - `main.js`: `refreshActiveProjection` listener moved before
    `new Renderer(...)` so it fires first on each `update`,
    keeping `setActiveProjection` ahead of the renderer's
    `DiscGrid` / `LatitudeLines` rebuild check.
- **Revert:** `git checkout v-s000368 -- js/core/galaxies.js
  js/core/quasars.js js/core/brightStarCatalog.js
  js/render/worldObjects.js js/render/index.js
  js/ui/controlPanel.js js/main.js`; `rm
  js/core/_namedStarsHyg.js`.

## S368 — Bright Star Catalog + 200 extra galaxies / quasars + Disable All

- **Date:** 2026-04-24
- **Files changed:** `js/core/brightStarCatalog.js` (new),
  `js/core/galaxiesExtra.js` (new),
  `js/core/quasarsExtra.js` (new),
  `js/core/galaxies.js`, `js/core/quasars.js`,
  `js/core/app.js`, `js/render/index.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - `js/core/brightStarCatalog.js`: 393 IAU/HYG-named stars with
    apparent magnitude ≤ 8, J2000.0. Schema matches
    `CEL_NAV_STARS` (id, name, raH, decD, mag). Built from the
    HYG v41 dataset via a one-shot fetch.
  - `js/core/galaxiesExtra.js`: 200 brightest galaxies from
    OpenNGC (V-Mag, fallback B-Mag).
  - `js/core/quasarsExtra.js`: 200 brightest quasars from
    Véron-Cetty / Véron 2010 (VizieR VII/258).
  - `galaxies.js` and `quasars.js` now concat their extras into
    the existing exported `GALAXIES` / `QUASARS` arrays.
  - `app.js`: imports `BRIGHT_STAR_CATALOG`, defaults
    `ShowBsc: false`, `GPOverrideBsc: false`. Adds
    `c.BscStars = ShowBsc ? BRIGHT_STAR_CATALOG.map(projectStar) : []`,
    a `bsc` entry in `starCategories` for GP-path generation,
    and a BSC branch + `bsc` color in the tracker-info lookup.
  - `js/render/index.js`: new `bscStars` `CatalogPointStars`
    layer with `maxCount: 512`, paired with `ShowBsc`. Existing
    galaxy / quasar layers bumped to `maxCount: 256`.
  - `js/ui/controlPanel.js`: new "Bright Star Catalog" Tracker
    sub-menu with Show / GP-Override / Enable All / Disable All
    and a sorted button grid. `BODY_SEARCH_INDEX` and
    `resolveTargetAngles` extended to include BSC entries.
    `Disable All` button added to every existing Tracker
    sub-menu (Celestial Bodies, Cel Nav, Constellations, Black
    Holes, Quasars, Galaxies, Satellites).
  - `js/ui/urlState.js`: `ShowBsc` and `GPOverrideBsc` added to
    `PERSISTED_KEYS`.
- **Revert:** `git checkout v-s000367 -- js/core/galaxies.js
  js/core/quasars.js js/core/app.js js/render/index.js
  js/ui/controlPanel.js js/ui/urlState.js`; `rm
  js/core/brightStarCatalog.js js/core/galaxiesExtra.js
  js/core/quasarsExtra.js`.

## S367 — Sun / Moon analemma demos with stair-stepped DateTime

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/render/worldObjects.js`,
  `js/render/index.js`, `js/ui/urlState.js`,
  `js/demos/animation.js`, `js/demos/definitions.js`,
  `change_log_serials.md`.
- **Change:**
  - State: `ShowSunAnalemma`, `ShowMoonAnalemma` booleans (default
    false), persisted in URL hash.
  - `app.update()`: per-frame accumulator that pushes
    `c.SunOpticalVaultCoord` / `c.MoonOpticalVaultCoord` into a
    private points array each time `s.DayOfYear` changes. Cache key
    `(ObserverLat | ObserverLong | ObserverHeading | Time | year |
    bodySource)` clears the array when any input shifts. Result
    exposed as `c.SunAnalemmaPoints` / `c.MoonAnalemmaPoints`.
  - `js/render/worldObjects.js`: new `AnalemmaLine` class — a
    `THREE.Line` rebuilt from the accumulator each frame. Sun gold
    `0xffd060`, moon silver `0xc0c0d8`. `renderOrder = 35`,
    `depthTest = false`.
  - `js/render/index.js` instantiates two `AnalemmaLine`s and
    updates them in `_updateTracks()`.
  - `js/demos/animation.js`: new `days365` easing (stair-step
    `floor(u·365)/365`) and new `'hold'` task type plus `Thold()`
    helper. The task returns `false` from `_stepTask`, keeping the
    queue alive so `End Demo` stays available.
  - `js/demos/definitions.js`: 15 new demos in three groups
    (`sun-analemma`, `moon-analemma`, `combo-analemma`), one per
    latitude in `[90, 45, 0, -45, -90]`. Intro fixes observer,
    sets DateTime = 2922.5 (2025-01-01 12:00 UTC), enables the
    relevant analemma flag(s), no FollowTarget. Tween advances
    DateTime by +365 over 30 s with `days365` easing; final
    `Thold()` keeps the demo active for inspection.
  - `DEMO_GROUPS` gains the three group ids.
- **Revert:** `git checkout v-s000366 -- js/core/app.js
  js/render/worldObjects.js js/render/index.js js/ui/urlState.js
  js/demos/animation.js js/demos/definitions.js`.

## S366 — Add "Not Nikki Minaj" ObserverFigure (sprite-based)

- **Date:** 2026-04-24
- **Files changed:** `assets/observer_nikki.png` (new, copied
  from `~/Pictures/maps/Nicki_Minaj_maps.png`),
  `js/render/worldObjects.js`, `js/ui/controlPanel.js`.
- **Change:**
  - New `nikki` branch in `_buildFigure`: `THREE.TextureLoader`
    + `THREE.Sprite` with `assets/observer_nikki.png`. Sprite
    height 0.10 disc-units, aspect 1920/1080, centred at
    `z = h/2`, `renderOrder = 110`.
  - `ObserverFigure` dropdown gains
    `{ value: 'nikki', label: 'Not Nikki Minaj' }` between
    Kangaroo and None.
- **Revert:** `git checkout v-s000365 -- js/render/worldObjects.js
  js/ui/controlPanel.js`; `rm assets/observer_nikki.png`.

## S365 — Strip prompt-paraphrase + contradictory-framing language from S359 / S364

- **Date:** 2026-04-24
- **Files changed:** `change_log_serials.md`,
  `js/ui/controlPanel.js`.
- **Change:**
  - S359 entry: dropped the "earlier confusion … going below
    horizon" framing; replaced with a neutral description of
    the prior 24 h tween being replaced.
  - S364 title and Escape comment block in
    `js/ui/controlPanel.js`: dropped "master-stop" phrasing.
- **Revert:** `git checkout v-s000364 -- change_log_serials.md
  js/ui/controlPanel.js`.

## S364 — DiscGrid + LatitudeLines reproject on MapProjection change; Escape handler extended

- **Date:** 2026-04-24
- **Files changed:** `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`, `js/core/canonical.js`,
  `js/core/projections.js`, `change_log_serials.md`.
- **Change:**
  - `DiscGrid` and `LatitudeLines` in `js/render/worldObjects.js`
    rewritten to track `_lastProj` and rebuild their geometry
    via `canonicalLatLongToDisc` when `state.MapProjection`
    changes. Lat circles (15° steps), lon rays (15° steps), and
    the tropic / polar / equator rings re-warp under each
    projection.
  - Escape handler in `buildControlPanel` extended. Priority
    order: close map-picker popup → close active tab popup →
    pause running demo animator → clear FollowTarget /
    FreeCamActive.
  - Header comment in `js/core/canonical.js` reduced to one
    factual line.
  - Header comment in `js/core/projections.js` and the
    `ae_dual` notes string trimmed.
- **Revert:** `git checkout v-s000363 --
  js/render/worldObjects.js js/ui/controlPanel.js
  js/core/canonical.js js/core/projections.js`.

## S363 — 🗺 opens a projection picker popup; equirectangular source copied to assets

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`,
  `assets/map_equirectangular_earth.jpg` (new).
- **Change:**
  - `🗺` bar button replaced with a `.map-picker-popup` floating
    menu. Click opens it; second click, outside-click, or row
    click closes it. Row click sets
    `MapProjection: id`. Current selection gets an
    accent-highlighted `.active` class.
  - `assets/map_equirectangular_earth.jpg` (2048 × 1024) added,
    copied from `~/Pictures/maps/2k_earth_daymap.jpg`.
- **Revert:** `git checkout v-s000362 -- css/styles.css
  js/ui/controlPanel.js`; `rm
  assets/map_equirectangular_earth.jpg`.

## S362 — Projection registry expansion: 15 entries, delegated canonical math

- **Date:** 2026-04-24
- **Files changed:** `js/core/canonical.js`,
  `js/core/projections.js`, `js/main.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - `canonicalLatLongToDisc` in `canonical.js` rewritten to
    delegate to `getProjection(activeId).project(...)`.
    `setActiveProjection(id)` setter added. `main.js` adds a
    model `update` listener that calls
    `setActiveProjection(state.MapProjection)`.
  - `projections.js` registry now has 15 entries:
    `ae`, `ae_dual`, `hellerick`, `proportional`, `blank`,
    `equirect`, `mercator`, `mollweide`, `robinson`,
    `winkel_tripel`, `hammer`, `aitoff`, `sinusoidal`,
    `equal_earth`, `eckert4`. Each has
    `project(lat, lon, r)` normalised so the widest axis lands at
    `r`. Non-azimuthal entries use inline Newton iteration or
    lookup tables.
  - 🗺 compass-bar cycle button walks all 15 ids.
  - `URL_SCHEMA_VERSION` bumped `335 → 362`.
- **Revert:** `git checkout v-s000361 -- js/core/canonical.js
  js/core/projections.js js/main.js js/ui/controlPanel.js
  js/ui/urlState.js`.

## S361 — "Enable All" button per Tracker sub-menu

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** Each Tracker sub-menu (Celestial Bodies, Cel Nav,
  Constellations, Black Holes, Quasars, Galaxies, Satellites)
  gains an `Enable All` button between the Show / GP-Override
  rows and the grid. Click merges every id from that category
  into `TrackerTargets` (union with whatever's already there);
  the grid buttons immediately pick up the accent-highlight
  because their state refresh runs on the same model update.
- **Revert:** `git checkout v-s000360 -- js/ui/controlPanel.js`.

## S360 — Move Constellation outlines to Tracker Options

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** `ShowConstellationLines` row removed from the
  Show tab (the Stars group is now empty and disappears),
  added to Tracker Options after the GP Path row. Tracker is
  the single place for every celestial-visibility knob now.
- **Revert:** `git checkout v-s000359 -- js/ui/controlPanel.js`.

## S359 — Extend Alert + Antarctica 24h-sun demos from 1 day to 14 days

- **Date:** 2026-04-24
- **Files changed:** `js/demos/definitions.js`.
- **Change:** Alert (`3093 → 3107`) and West Antarctica
  (`2911 → 2925`) 24h-sun demos now tween 14 days of
  continuous midnight sun instead of a single 24-hour sidereal
  day. Tween duration 40 s (~0.35 days/sec) so each sun loop
  takes ~3 s of real time — smooth enough to watch the sun
  sweep around the sky multiple times. Replaces the prior
  24 h tween, which ended with a snap back to the DE405
  default position.
- **Revert:** `git checkout v-s000358 -- js/demos/definitions.js`.

## S358 — 24h-sun demos start Optical tracking the sun; only sun visible

- **Date:** 2026-04-24
- **Files changed:** `js/demos/definitions.js`.
- **Change:** All four 24h-sun demos (Alert 82°30′N, West
  Antarctica 79°46′S, Midnight sun 75°N, Midnight sun 75°S)
  intro rewritten:
  - `InsideVault: true` — start in Optical (first-person)
    instead of Heavenly orbit.
  - `FollowTarget: 'sun'` — Optical camera auto-aims at the
    sun every frame; elevation re-clamps once per tick so the
    sun stays locked in the view centre as it loops overhead.
  - `TrackerTargets: ['sun']` — only the sun renders; every
    other body / catalogue is hidden by the membership rule,
    so the scene is unambiguously about the sun.
  - `OpticalZoom: 1.0` — full-FOV entry.
- **Revert:** `git checkout v-s000357 -- js/demos/definitions.js`.

## S357 — Discworld cosmology (A'Tuin + 4 elephants); Antarctic demo moves to solstice

- **Date:** 2026-04-24
- **Files changed:** `js/core/app.js`, `js/demos/definitions.js`,
  `js/render/index.js`, `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - New `Discworld` class in `worldObjects.js`: a flattened
    green turtle (Great A'Tuin) with shell, belly, four splayed
    legs, a neck-and-head out the front, and a stub tail — sits
    below the disc. Four slate-grey elephants (body / head /
    trunk / tusks / ears / four legs / tail) stand on its back
    in a cross, each rotated to face outward (radial) so their
    heads point N / E / S / W. Materials render without clip
    planes so the whole stack is visible when the orbit camera
    drops below the disc horizon.
  - Wired into `render/index.js` (instantiate, add to scene,
    call update each frame) and the Cosmology dropdown in the
    Show tab (`discworld` added as a sixth option).
  - `24h sun at 79°46'S 83°15'W` demo intro DateTime bumped
    `2904 → 2911` (2024-12-21 solstice). Sun declination at
    solstice gives the peak elevation range for that latitude
    (≈ 13° min, 34° max) — it still dips to 13° at the
    "midnight" pass but never sets. Narration updated.
- **Revert:** `git checkout v-s000356 -- js/core/app.js
  js/demos/definitions.js js/render/index.js
  js/render/worldObjects.js js/ui/controlPanel.js`.

## S356 — GP-trace demo: observer parked at polar summer so sun stays above horizon

- **Date:** 2026-04-24
- **Files changed:** `js/demos/definitions.js`.
- **Change:** The North-pole GP trace demo intro now sets
  `ObserverLat: 82.505`, `ObserverLong: -62.335` (Alert,
  Nunavut) and `DateTime: 3093` (2025-06-21 solstice). Sun's
  declination stays above the 7.5° threshold for the full
  53-day ramp, so it never drops below the horizon from the
  observer and the optical-vault dot keeps rendering through
  the whole demo. Narration updated.
- **Revert:** `git checkout v-s000355 -- js/demos/definitions.js`.

## S355 — GP-trace demo intro: render everything in the sky, allow mid-demo toggle

- **Date:** 2026-04-24
- **Files changed:** `js/demos/definitions.js`.
- **Change:** `North-pole GP trace` demo intro expanded with
  `ShowTruePositions`, `ShowOpticalVault`, and `ShowStars`
  explicitly set so the full sky renders alongside the GP
  paths. The animator only advances `DateTime` — intro state
  runs once — so the ◉ bar button still flips
  `ShowTruePositions` mid-demo without disrupting playback.
  Narration updated.
- **Revert:** `git checkout v-s000354 -- js/demos/definitions.js`.

## S354 — North-pole GP trace demo ramps from near-still to 5.33 days/sec

- **Date:** 2026-04-24
- **Files changed:** `js/demos/animation.js`, `js/demos/definitions.js`.
- **Change:**
  - `animation.js` EASING map gains `accel` (cubic ease-in):
    `t → t³`. Value changes slowly at the start and
    accelerates to the final rate.
  - The existing North-pole GP trace demo renamed to
    `North-pole GP trace — slow → 5.33× ramp`. Single Tval on
    `DateTime` advances 53.3 days over 30 s using the new
    `accel` easing — the instantaneous rate at the end of the
    tween is `3 × 53.3 / 30 ≈ 5.33 days/sec`, so the GP
    polylines start nearly still and visibly accelerate. User
    can still ½× / 2× from the transport bar to scale further.
- **Revert:** `git checkout v-s000353 -- js/demos/animation.js
  js/demos/definitions.js`.

## S353 — 24h-sun demo intros no longer auto-enable GP Path

- **Date:** 2026-04-24
- **Files changed:** `js/demos/definitions.js`.
- **Change:** Both 24h-sun demos (Alert 82°30′N and West
  Antarctica 79°46′S) had `ShowGPPath: true` baked into their
  intros, which silently flipped the Tracker Options GP-Path
  toggle on every time they played. Removed. Sun track still
  shows (that's the whole point of the 24h-sun demo). Users
  can enable GP Path separately from Tracker Options if they
  want it.
- **Revert:** `git checkout v-s000352 -- js/demos/definitions.js`.

## S352 — Shrink compass-grid buttons so both rows stay inside the transport band

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`.
- **Change:** Compass / cycle / cardinal grid buttons trimmed
  to `padding: 0 6px; font-size: 11px; line-height: 14px;
  min-width: 30px`. Each button ≈ 16 px tall, so a 2-row
  cluster totals ≈ 34 px and sits inside the 44 px transport
  band — the bottom row no longer dips below the single-row
  time-controls on the left. `align-items: center` lands both
  clusters' mid-lines on the same y.
- **Revert:** `git checkout v-s000351 -- css/styles.css`.

## S351 — 🧭 button also toggles the Optical-vault grid

- **Date:** 2026-04-24
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:** `.az-ring-btn` click now flips three keys in unison:
  `ShowAzimuthRing`, `ShowLongitudeRing`, and
  `ShowOpticalVaultGrid` (the first-person cap's grid lines —
  not the Heavenly vault grid, which has its own show key).
  Tooltip updated.
- **Revert:** `git checkout v-s000350 -- js/ui/controlPanel.js`.

## S350 — Compact compass-cluster buttons so both rows center on the time-controls line

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`.
- **Change:** All compass / cycle / cardinal grid buttons share a
  tighter style (`padding: 0 6px`, `font-size: 12px`,
  `line-height: 18px`, `min-width: 32px`). Each button is now
  ~20 px tall, so a 2-row grid totals ~42 px including the gap
  — short enough to sit inside the same 44 px band
  `.time-controls` uses, letting `align-items: center` land
  both clusters on the same vertical line. The `cardinal-grid`
  keeps `font-weight: 600` for the N / S / E / W glyphs.
- **Revert:** `git checkout v-s000349 -- css/styles.css`.

## S349 — Align compass sub-grids to same vertical span

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`.
- **Change:** `.compass-controls` switched to
  `align-items: stretch`. All three sub-grids (mode-grid,
  cycle-row, cardinal-grid) now explicitly carry
  `grid-template-rows: repeat(2, 1fr)` with `grid-auto-rows:
  1fr`, so each occupies the same 2-row vertical span and
  their buttons line up on the same bands. The cycle-row
  became 2×2 (🗺 ✨ / 🧭 blank) so it no longer towers above
  the other grids. Cardinal button `min-width` bumped 28 → 32
  to match the rest.
- **Revert:** `git checkout v-s000348 -- css/styles.css`.

## S348 — 🧭 compass button toggles azimuth degree rings

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:** New `.az-ring-btn` (🧭) appended to `.cycle-row`
  after 🗺 and ✨. One click flips both `ShowAzimuthRing` (the
  Optical-cap degree labels) and `ShowLongitudeRing` (the
  ground-compass ring) together, so the full azimuth-readout
  set turns on / off as one unit. Active state picks up the
  accent-border highlight.
- **Revert:** `git checkout v-s000347 -- css/styles.css
  js/ui/controlPanel.js`.

## S347 — 2×3 mode-button grid, cycle column, compass-rose cardinals

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:** `.compass-controls` now holds three sub-layouts:
  - **`.mode-grid`** — 2×3 CSS grid of the main mode / jump
    buttons.
    Row 1 (`🌙 ◉ 🎯`): visibility-state toggles (dark / true-
    positions / STM focus).
    Row 2 (`🎛 📍 🎥`): direct-jump + camera-mode buttons
    (Tracker Options / Observer / Free-camera keys).
  - **`.cycle-row`** — 1×2 column of scene-backdrop cyclers
    (`🗺` map projection, `✨` starfield type). These swap
    whole backdrops rather than toggling visibility, so they
    get their own spot.
  - **`.cardinal-grid`** — 2×2 compass rose for `N / E / W / S`
    instead of the old inline row, so the button pairing reads
    like a real compass.
- **Revert:** `git checkout v-s000346 -- css/styles.css
  js/ui/controlPanel.js`.

## S346 — Rays bend around the dome when the body is below the horizon

- **Date:** 2026-04-24
- **Files changed:** `js/render/index.js`.
- **Change:** `addRay()` now branches on the target's elevation.
  Above the horizon, the existing quadratic Bezier with a
  single lift control is used. Below the horizon, it switches
  to a cubic Bezier with two tall control points — one
  directly above the observer, one directly above the target —
  so the ray rises steeply from the ground, arcs across the
  dome, and drops down onto the body's far-side vault position
  instead of tunnelling straight through the disc. Arc height
  scales with how deep the elevation is (cap at 90° below).
  Sun and moon vault / optical-vault rays now pass their
  `elevation` so the curve chooses the right branch.
- **Revert:** `git checkout v-s000345 -- js/render/index.js`.

## S345 — 🎛 quick-button jumps straight to Tracker Options

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:** New `.tracker-opts-btn` (🎛) appended to
  `.compass-controls` after the 📍 Observer button. Click calls
  `featureOpen.fn('Tracker', 'Tracker Options')`: opens the
  Tracker tab popup and expands the Tracker Options group so
  Clear All / Track All / STM / GP Override / True Positions /
  GP Path are immediately visible.
- **Revert:** `git checkout v-s000344 -- css/styles.css
  js/ui/controlPanel.js`.

## S344 — Rays respect the Tracker-membership rule

- **Date:** 2026-04-24
- **Files changed:** `js/render/index.js`.
- **Change:** `_updateRays()` used the old STM-only filter
  (`!stm || trackerSet.has(id)`), which meant vault / optical /
  projection rays painted for every body whenever STM was off —
  even bodies the renderers had hidden via empty tracker
  selection. Filter updated to match the post-S330 rule:
  membership always required, STM narrows to `[FollowTarget]`,
  and `ShowCelestialBodies` also gates the whole ray set so a
  hidden category never leaks rays.
- **Revert:** `git checkout v-s000343 -- js/render/index.js`.

## S343 — End Tracking button + Esc-ends-tracking; Free-camera mode toggle

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/core/app.js`,
  `js/ui/controlPanel.js`, `js/ui/keyboardHandler.js`,
  `js/ui/mouseHandler.js`.
- **Change:**
  - Mouse-drag no longer clears `FollowTarget`,
    `FreeCamActive`, or `SpecifiedTrackerMode`. Users can drag
    and wheel-zoom freely while a body is locked.
  - The follow listener skips re-aiming while a drag is in
    progress, so the pan actually sticks visually; it resumes
    re-centring after the drag ends.
  - New `End Tracking` button stacked in `.speed-stack` next to
    `End Demo`. Visible only while `FollowTarget` or
    `FreeCamActive` is set; click clears both plus STM.
  - Escape key extended: if no tab popup is open, Esc clears
    tracking (same as the button).
  - New state `FreeCameraMode` (default `false`) + 🎥 toggle
    button in `.compass-controls`. When on, arrow keys drive
    `CameraHeight` (↑/↓ pitch) and `CameraDirection` (←/→ yaw)
    instead of moving the observer. Mouse drag + wheel still
    work normally.
- **Revert:** `git checkout v-s000342 -- css/styles.css
  js/core/app.js js/ui/controlPanel.js js/ui/keyboardHandler.js
  js/ui/mouseHandler.js`.

## S342 — Quick-cycle buttons for Map projection + Starfield

- **Date:** 2026-04-24
- **Files changed:** `css/styles.css`, `js/ui/controlPanel.js`.
- **Change:** Two new buttons appended to `.compass-controls`
  after 📍:
  - **🗺** cycles `MapProjection` through
    `ae → hellerick → proportional → blank → ae …`.
  - **✨** cycles `StarfieldType` through
    `random → chart-dark → chart-light → celnav → random …`.
- **Revert:** `git checkout v-s000341 -- css/styles.css
  js/ui/controlPanel.js`.

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

## S410 — Alpabeta Field starfield

- **Date:** 2026-04-25
- **Files changed:** `js/render/starfieldChart.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - `starfieldChart.js` adds `makeAlphabetaCanvas()`: a
    1080×1080 polar-AE canvas with three concentric rings of
    glyphs at celestial latitudes -60°, 0°, +60°. Outer ring
    `A`–`M`, mid ring `N`–`Z`, inner ring `1234567890`.
    Underlines drawn under `6` and `9` to disambiguate them
    under perspective rotation. Faint reference rings drawn
    at the three latitudes.
  - `CHART_DEFS` now also accepts `{ generator, width, height }`
    in addition to URL-loaded textures, so a runtime canvas
    can stand in for a PNG.
  - New entry `'alphabeta'` added to the `StarfieldType` select
    options.
  - Cycle-row sparkle button now opens
    `Tracker → Starfield` instead of cycling the type. The
    in-row `STARFIELD_CYCLE` constant is removed.
- **Revert:** `git checkout v-s000409 -- js/render/starfieldChart.js
  js/ui/controlPanel.js`.

## S411 — Sun / Moon "9" overlay toggle

- **Date:** 2026-04-25
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`, `js/ui/controlPanel.js`,
  `js/core/app.js`.
- **Change:**
  - New `SunMoonGlyph` class in `worldObjects.js`: a flat
    `PlaneGeometry` textured with an underlined digit (rendered
    via canvas), drawn both at the body's vault coord and its
    optical-vault coord. Plane is double-sided and parented to
    the world frame (no billboarding) so observer perspective
    rotates the glyph.
  - `render/index.js` instantiates `sunNine` and `moonNine`
    (digit `'9'`) and updates them next to the existing
    sun/moon markers.
  - `Tracker Options` group gains a `Sun / Moon "9" Glyph`
    boolean. State key `ShowSunMoonNine` defaults to `false`.
- **Revert:** `git checkout v-s000410 -- js/render/worldObjects.js
  js/render/index.js js/ui/controlPanel.js js/core/app.js`.

## S412 — GP Tracer

- **Date:** 2026-04-25
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`, `js/ui/controlPanel.js`,
  `js/core/app.js`.
- **Change:**
  - New `GPTracer` class in `worldObjects.js`: per-body
    accumulating polylines. Each frame, for every body in
    `GPTracerTargets` the current GP `(lat, lon)` is mapped
    through `canonicalLatLongToDisc` and appended to that
    body's polyline. Buffer cap 8192 with a slide-down on
    overflow. Lines reset on `ShowGPTracer` off→on transition,
    and per-body when a target leaves `GPTracerTargets`.
  - `render/index.js` adds `gpTracer` and updates it inside
    the per-frame pipeline.
  - `Tracker Options` group gains a `GP Tracer` boolean,
    a `Clear Tracer` button, and a 9-button multi-select
    grid (Sun / Moon / Mercury / Venus / Mars / Jupiter /
    Saturn / Uranus / Neptune) bound to `GPTracerTargets`.
    Per-body button colour matches the tracker palette.
  - State keys `ShowGPTracer` (default `false`) and
    `GPTracerTargets` (default `[]`) added to `defaultState()`.
- **Revert:** `git checkout v-s000411 -- js/render/worldObjects.js
  js/render/index.js js/ui/controlPanel.js js/core/app.js`.

## S413 — GP Tracer: optical-vault sky trace

- **Date:** 2026-04-25
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`.
- **Change:**
  - `GPTracer` now keeps two polylines per body. Disc-line
    behaviour (per S412) is unchanged. A second `sky` line is
    appended each frame from the body's
    `*OpticalVaultCoord`, stored in observer-local offsets so
    a sub-group anchored to the observer can re-render the
    historical samples at the current observer position.
  - Both lines are reset together by the existing on→off / per-
    body controls; the sky line additionally hides when
    `ShowOpticalVault` is off, while the disc line continues to
    hide when `InsideVault` is set.
  - Constructor now takes `clippingPlanes` so the sky line
    respects the disc clip plane shared with the rest of the
    optical-vault layer.
  - `render/index.js` passes `clipPlanes` to `new GPTracer(...)`.
- **Revert:** `git checkout v-s000412 -- js/render/worldObjects.js
  js/render/index.js`.

## S414 — Free Camera Mode detaches from observer + tracked body

- **Date:** 2026-04-25
- **Files changed:** `js/render/scene.js`.
- **Change:**
  - When `FreeCameraMode` is set, the orbital-camera path now
    skips both auto-follow behaviours: the
    `FreeCamActive`/`FollowTarget` GP-orbit branch is bypassed,
    and the observer-pull `lookAt` blend is replaced with a
    fixed `lookAt(0, 0, 0)`. Result: the camera detaches from
    both the observer and the active track, so the user can
    pan / zoom independently while body tracking and HUD
    readouts continue.
- **Revert:** `git checkout v-s000413 -- js/render/scene.js`.

## S415 — Free Camera Mode works inside Optical Vault

- **Date:** 2026-04-25
- **Files changed:** `js/render/scene.js`.
- **Change:**
  - The first-person `InsideVault` branch is now skipped when
    `FreeCameraMode` is set, falling through to the orbital
    camera path so the user can orbit / zoom freely inside
    Optical mode.
  - The `FreeCameraMode` orbital `lookAt` is now mode-aware:
    in `InsideVault` the camera is offset relative to the
    observer and looks at `ObserverFeCoord` so the optical-
    vault dome stays in frame; outside `InsideVault` it
    keeps the previous `lookAt(0, 0, 0)` behaviour.
- **Revert:** `git checkout v-s000414 -- js/render/scene.js`.

## S416 — Free Camera Mode toggle: clean exit + tracking resume in Optical Vault

- **Date:** 2026-04-25
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:**
  - Drag handler: the `InsideVault` first-person branch now
    additionally requires `!FreeCameraMode`; otherwise it
    falls through to the orbital drag (CameraDirection /
    CameraHeight), so mouse drag in Free Cam + Optical works
    consistently with Free Cam + Heavenly.
  - Wheel handler: same gate. `InsideVault && !FreeCameraMode`
    drives `OpticalZoom`; Free Cam in Optical now drives the
    orbital `Zoom` like Heavenly.
  - Auto-aim handler: returns early when `FreeCameraMode` is
    set, so it doesn't fight the user's free orbit. When the
    user toggles Free Cam off, the next state update lets the
    auto-aim resume — pointing first-person view back at the
    `FollowTarget` if one exists.
- **Revert:** `git checkout v-s000415 -- js/ui/mouseHandler.js`.

## S417 — 45° sun analemma rebuilt as 12 monthly daily-arc snapshots

- **Date:** 2026-04-25
- **Files changed:** `js/demos/animation.js`,
  `js/demos/definitions.js`, `js/render/worldObjects.js`,
  `js/render/index.js`, `js/core/app.js`.
- **Change:**
  - New `Tcall(fn)` task primitive in `demos/animation.js`:
    invokes `fn(model)` when the queue head reaches it, allowing
    side-effects beyond `Tval`'s tweened state-key updates.
  - New `MonthMarkers` renderer (`worldObjects.js`): reads the
    `SunMonthMarkers` array (observer-local offsets), draws each
    entry as a circle sprite under a sub-group anchored to the
    current observer position. Sprite-style billboarding so the
    notches stay legible at any orbit angle.
  - `render/index.js` instantiates `sunMonthMarkers` and updates
    it per frame.
  - New state key `SunMonthMarkers` (default `[]`) in
    `defaultState()`.
  - Sun analemma · 45°N and 45°S rebuilt via
    `makeSunAnalemma45Months`: starts at 2025-03-20 (vernal
    equinox, DateTime 3000) on Astropixels, then 12 cycles of
    "set DateTime to month-day midnight → sweep half-day to
    noon → snap a notch (circle on the line) → sweep second
    half to next-midnight → jump +30 days". GP Tracer's sky
    polyline draws the 12 daily arcs; `MonthMarkers` draws the
    12 noon notches. Both reset on demo start.
- **Revert:** `git checkout v-s000416 -- js/demos/animation.js
  js/demos/definitions.js js/render/worldObjects.js
  js/render/index.js js/core/app.js`.

## S418 — 45° sun analemma: symmetric monthly snapshot dates

- **Date:** 2026-04-25
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - The 12 daily-arc snapshots now sample the 21st of each
    month (Mar 21 2025 → Feb 21 2026) instead of striding
    +30 days from a single anchor. Mar 21, Jun 21, Sep 21,
    Dec 21 line up with the four equinoxes / solstices and
    pin the figure-8 symmetrically; the other eight points
    land halfway between, giving the classic evenly-spaced
    analemma layout.
  - The fixed `MONTH_STEP_DAYS = 30` constant is replaced by
    an explicit `ANALEMMA_MONTH_DAYS` array of DateTime
    values; intro `DateTime` and the per-month loop both
    read from it.
- **Revert:** `git checkout v-s000417 -- js/demos/definitions.js`.

## S419 — Month markers: smaller dots, closed-loop polyline

- **Date:** 2026-04-25
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`.
- **Change:**
  - `MonthMarkers` default sprite size shrunk from `0.018`
    to `0.011`. Caller in `render/index.js` updated to match.
  - `MonthMarkers` now also owns a `THREE.LineLoop` that walks
    every entry in `SunMonthMarkers` in append order and
    closes back to the first point, so as each notch lands the
    chain extends and the final 12-point loop draws the
    figure-8 directly. Buffer cap 64. Loop hidden until ≥ 2
    points so a single dot doesn't render a degenerate edge.
- **Revert:** `git checkout v-s000418 -- js/render/worldObjects.js
  js/render/index.js`.

## S420 — Monthly daily-arc sun analemma extended to ±90°

- **Date:** 2026-04-25
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - `makeSunAnalemma45Months` renamed to
    `makeSunAnalemmaMonthly` and the hard-coded
    `CameraHeight: 45` replaced with the same per-latitude
    pick the original `makeAnalemma` uses
    (`lat === 0 ? 75 : abs(lat) === 90 ? 12 : 45`).
  - Sun analemma sun-mode predicate widened from
    `abs(lat) === 45` to `abs(lat) === 45 || abs(lat) === 90`,
    so 90°N, 45°N, 45°S, and 90°S all run the 12 daily-arc +
    monthly-notch + closed-loop variant. 0° (equator) keeps
    the original 365-day stair-step analemma.
- **Revert:** `git checkout v-s000419 -- js/demos/definitions.js`.

## S421 — Sun analemma: route every latitude through the monthly variant; tweak polar camera tilt

- **Date:** 2026-04-25
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - Sun-mode predicate dropped: every `ANALEMMA_LATS` entry
    (90°N, 45°N, 0°, 45°S, 90°S) now goes through
    `makeSunAnalemmaMonthly`. The 0° equator demo therefore
    shifts off the legacy 365-day stair-step variant onto the
    same 12 daily-arc + monthly-notch + closed-loop pipeline as
    the rest.
  - Camera tilt rebalanced inside `makeSunAnalemmaMonthly`:
    `camH = 60` at the equator, `30` at the poles, `45`
    elsewhere. Previous polar tilt of `12` left the daily
    arc skirting the horizon clip; `30` keeps the horizon and
    the sun's azimuthal day-circle both in frame.
- **Revert:** `git checkout v-s000420 -- js/demos/definitions.js`.

## S422 — Sun analemma: zenith-pointing camera at 0° / ±90°, observer pinned per task

- **Date:** 2026-04-25
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - `makeSunAnalemmaMonthly` now uses `camH = 85` at the
    equator and at both poles, so the analemma figure-8 (which
    straddles the zenith at 0° and circles azimuthally near
    the zenith at ±90°) lands inside the field of view instead
    of half-behind the camera. ±45° still uses 45°.
  - First demo task now re-asserts `ObserverLat`,
    `ObserverLong`, `ObserverHeading`, `CameraHeight`,
    `CameraDirection`, and `InsideVault` via `Tcall` after the
    intro patch is applied, so any leftover state from a prior
    demo can't pin the observer at the wrong latitude.
- **Revert:** `git checkout v-s000421 -- js/demos/definitions.js`.

## S423 — Sun analemma rendered on the heavenly vault (disc-anchored)

- **Date:** 2026-04-25
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`, `js/render/index.js`,
  `js/demos/definitions.js`.
- **Change:**
  - New state `SunVaultArcOn` (default `false`) and computed
    output `SunVaultArcPoints`. While the flag is on, app.js
    appends `c.SunVaultCoord` (heavenly vault, disc-anchored)
    every frame, deduping consecutive samples. Resets on
    flag off→on or when observer-lat / year / body-source key
    changes.
  - New state `SunMonthMarkersWorldSpace` (default `false`).
    `MonthMarkers.update` keeps `skyGroup` at the origin when
    the flag is set instead of pinning it to `ObserverFeCoord`,
    so notch sprites live in disc-anchored world coords. The
    visibility gate also drops `ShowOpticalVault` for that
    case since the markers no longer ride on the optical vault.
  - `render/index.js` adds a third `AnalemmaLine` instance
    (`sunVaultArc`) bound to `SunVaultArcPoints` /
    `SunVaultArcOn`.
  - Sun analemma demo (every latitude) now turns on
    `SunVaultArcOn` instead of `ShowGPTracer`, sets
    `SunMonthMarkersWorldSpace: true`, and the noon snap
    captures `c.SunVaultCoord` (absolute) instead of an
    observer-local optical-vault offset. The figure-8 +
    daily arcs are now anchored to the FE disc grid (the
    tropics / equator rings the user pointed at), not to the
    observer's optical vault.
- **Revert:** `git checkout v-s000422 -- js/core/app.js
  js/render/worldObjects.js js/render/index.js
  js/demos/definitions.js`.

## S424 — Moon and Sun + Moon analemma rebuilt to match the sun variant

- **Date:** 2026-04-25
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`, `js/render/index.js`,
  `js/demos/definitions.js`.
- **Change:**
  - New state `MoonVaultArcOn`, `MoonMonthMarkers`,
    `MoonMonthMarkersWorldSpace`, plus computed
    `MoonVaultArcPoints`. The vault-arc accumulator was
    refactored into a generic `stepVaultArc` helper that
    handles both sun and moon slots.
  - `MonthMarkers` constructor switched to an options object
    accepting `markersKey` / `worldSpaceKey` / `name`. Two
    instances live in `render/index.js`:
    sun (`#ffe680`) bound to `SunMonthMarkers`,
    moon (`#c0c0d8`) bound to `MoonMonthMarkers`. A second
    `AnalemmaLine` (`moonVaultArc`) is bound to
    `MoonVaultArcPoints` / `MoonVaultArcOn`.
  - `makeSunAnalemma45Months` → `makeAnalemmaMonthly(label,
    lat, mode)`. `mode = 'sun' | 'moon' | 'both'` selects
    which arcs/markers run. `snapNoonVault(model, mode)`
    dispatches to either or both lists. Group id, label, and
    tracker targets follow the mode. Every `ANALEMMA_LATS`
    entry across all three sub-menus (Sun, Moon, Sun + Moon)
    now uses this helper, so the moon and combo demos pick up
    the same 12 daily-arc + monthly-notch + closed-loop
    behaviour the sun variant got in S419/S423.
- **Revert:** `git checkout v-s000423 -- js/core/app.js
  js/render/worldObjects.js js/render/index.js
  js/demos/definitions.js`.

## S425 — Brighter moon notches + arc

- **Date:** 2026-04-25
- **Files changed:** `js/render/index.js`.
- **Change:**
  - Moon `MonthMarkers` colour switched from `#c0c0d8` to
    `#ffffff` and sprite size from `0.011` to `0.013` so the
    moon notches stand out against the dark sky instead of
    blending into it.
  - `moonVaultArc` (the `AnalemmaLine` instance bound to
    `MoonVaultArcPoints` / `MoonVaultArcOn`) bumped from
    `0xc0c0d8` / `0.85` to `0xffffff` / `0.9` for the same
    reason. Sun side unchanged.
- **Revert:** `git checkout v-s000424 -- js/render/index.js`.

## S426 — Moon Path (Synodic) demos: 28 daily samples over one synodic month

- **Date:** 2026-04-25
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - New helper `makeMoonSynodic(label, lat)` builds a demo
    that samples the moon at 12:00 UTC every day for 28 days
    starting 2025-03-21 (one synodic month). Each day sweeps
    midnight → noon → next midnight; the noon snap captures
    `c.MoonVaultCoord` and the moon vault arc accumulates the
    full daily path on the heavenly vault.
  - 5-entry `MOON_SYNODIC_DEMOS` array generated from the same
    `ANALEMMA_LATS` set (90°N, 45°N, 0°, 45°S, 90°S),
    appended into `DEMOS`.
  - New section `moon-synodic` with label
    `"Moon Path (Synodic)"` added to `DEMO_GROUPS`.
- **Revert:** `git checkout v-s000425 -- js/demos/definitions.js`.

## S427 — Sun Analemma Paired (lon 0 + lon 180)

- **Date:** 2026-04-25
- **Files changed:** `js/core/app.js`, `js/render/index.js`,
  `js/demos/definitions.js`.
- **Change:**
  - New state `SunMonthMarkersOpp` (default `[]`) and
    `SunMonthMarkersOppWorldSpace` (default `false`).
  - New `MonthMarkers` instance `sunMonthMarkersOpp` in
    `render/index.js` bound to those keys, drawn in magenta
    (`#ff80c0`) so it reads distinct from the gold lon 0
    notches. Each `MonthMarkers` instance owns its own
    `LineLoop`, so the two analemmas only close to their own
    dots.
  - New `makeSunAnalemmaPaired(label, lat)` helper. Each month
    the demo snaps twice on the same calendar day: once at
    `dayStart` (UT 00:00, sun over lon 180 → magenta) and
    once at `dayStart + 0.5` (UT 12:00, sun over lon 0 →
    gold). Heavenly-vault arc accumulates the full daily
    circle. Two figure-8s end up on opposite sides of the
    disc.
  - 5-entry `SUN_PAIRED_DEMOS` (90°N, 45°N, 0°, 45°S, 90°S)
    appended to `DEMOS`, with a new `sun-paired` section in
    `DEMO_GROUPS` labelled `"Sun Analemma Paired (lon 0 + lon
    180)"`.
- **Revert:** `git checkout v-s000426 -- js/core/app.js
  js/render/index.js js/demos/definitions.js`.

## S428 — Eclipse Position Map demo (2021-2040)

- **Date:** 2026-04-25
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`, `js/render/index.js`,
  `js/demos/definitions.js`.
- **Change:**
  - New state `EclipseMapSolar` and `EclipseMapLunar`
    (default `[]`).
  - `MonthMarkers` constructor extended with `worldSpace`
    (force disc-anchor regardless of state) and `noLoop`
    (skip the closed-loop polyline) options. The renderer
    update path checks `this._loop` before touching the
    loop buffer.
  - Two new disc-anchored, no-loop `MonthMarkers` instances
    in `render/index.js`: `eclipseMapSolar` (`#ffd040`,
    bound to `EclipseMapSolar`) and `eclipseMapLunar`
    (`#a0c8ff`, bound to `EclipseMapLunar`).
  - New `ECLIPSE_MAP_DEMO`: a single Tcall iterates the
    full AstroPixels / DE405 eclipse registry (44 solar +
    67 lunar, 2021-2040), suppresses emit while stepping
    `DateTime` through every event's UT, captures
    `c.SunVaultCoord` (solar) or `c.MoonVaultCoord` (lunar)
    into the map arrays, then re-emits once at the end.
  - Demo placed in a new `eclipse-map` section labelled
    `"Eclipse Position Map"`.
  - 100-year coverage requires extending the registry — the
    demo description states the actual span (20 years).
- **Revert:** `git checkout v-s000427 -- js/core/app.js
  js/render/worldObjects.js js/render/index.js
  js/demos/definitions.js`.

## S429 — Globe-Earth (GE) world model + heavenly-vault shell

- **Date:** 2026-04-25
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`, `js/render/index.js`,
  `js/ui/controlPanel.js`, `css/styles.css`.
- **Change:**
  - New state `WorldModel` (`'fe'` default, `'ge'` alt) and
    per-frame compute outputs `GlobeObserverCoord`,
    `GlobeObserverFrame` (north / east / up axes at the
    observer's lat/lon on a unit sphere of radius
    `FE_RADIUS`), and `GlobeVaultRadius`
    (`FE_RADIUS * 1.6`).
  - Per-body globe heavenly-vault coords computed each
    frame: `c.SunGlobeVaultCoord`, `c.MoonGlobeVaultCoord`,
    and per-planet `p.globeVaultCoord`. Each is
    `(declination, RA − GMST)` placed on the shell, so the
    vault co-rotates with Earth (matching the FE dome
    convention).
  - New `WorldGlobe` class (`js/render/worldObjects.js`):
    translucent terrestrial sphere + 15° lat/lon graticule,
    pinned to origin, `SphereGeometry` rotated +π/2 about X
    so its poles align with `±z` (the celestial axis the
    rest of the scene already uses).
  - New `GlobeHeavenlyVault` class: translucent BackSide
    shell + 15°/30° wireframe graticule at
    `c.GlobeVaultRadius`, same z-up rotation, also pinned to
    origin.
  - `ObserversOpticalVault.update` and `Observer.update` now
    branch on `WorldModel`. In GE they read
    `GlobeObserverCoord` for placement and apply a
    quaternion built from `GlobeObserverFrame` so the
    optical-vault hemisphere and the observer figure both
    stand tangent to the sphere with local +z = radial
    outward.
  - Sun / Moon / planet `CelestialMarker.update` calls in
    `render/index.js` are routed to the corresponding
    `*GlobeVaultCoord` when `WorldModel === 'ge'`.
  - FE-only overlays (disc base, disc grid, lat lines,
    longitude ring, shadow, eclipse shadow,
    vault-of-heavens, starfield chart, sun/moon GP markers,
    GP path overlay, FE cosmology centerpieces, land mesh)
    hide while in GE mode; `worldGlobe` and
    `globeHeavenlyVault` show only in GE.
  - Optical-vault axis colours rotated so red maps to local
    +z (zenith / perpendicular to the ground), green to +x
    (north tangent), blue to +y (east tangent). Red is the
    "perpendicular to the ground" axis on both FE and GE.
  - New `WorldModel` toggle button (face shows `FE` or `GE`)
    stacked in a `.grids-stack` flex column directly under
    the existing grids (▦) toggle at the right edge of the
    compass cluster. Cycle-row CSS reverts to 2 rows.

## S430 — Dome caustic feature + Antarctic sun samples + UI tweaks

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`, `js/render/index.js`,
  `js/render/domeCaustic.js` (new),
  `js/ui/controlPanel.js`, `js/demos/index.js`,
  `css/styles.css`, `js/data/antarcticSunSamples.js` (new),
  `scripts/build_antarctic_sun_samples.mjs` (new),
  `scripts/run_dome_caustic_search.mjs` (new),
  `change_log_serials.md`.
- **Change:**
  - **Dome caustic ray tracer** (`js/render/domeCaustic.js`):
    pure-function `traceDomeCaustic` that fans rays from the
    sun's heavenly-vault position into the upper hemisphere,
    intersects each with the ellipsoidal-cap dome interior,
    reflects specularly, intersects the reflected ray with
    the disc plane, bins hits into a 96² density grid, and
    returns local-maxima peaks plus the antipodal candidate.
  - State `ShowDomeCaustic` (default `false`).
    Per-frame compute caches the ray-trace by `(sun, dome,
    observer)` so view-mode toggles don't re-run the trace.
    Disc-side peaks rendered by new `DomeCausticOverlay`
    (yellow rings + ring highlight on antipodal peak).
    Optical-vault orange ghost sun computed as the apparent
    sun's reflection through the observer's vertical axis
    (same elevation, antipodal azimuth); rendered as an
    orange sphere.
  - `MonthMarkers` extended with `worldSpace` and `noLoop`
    constructor options so `eclipseMapSolar` /
    `eclipseMapLunar` work without the closed-loop polyline.
  - Tracker tab UI: `Tracker Options` ends at the bool
    toggles; `Sun / Moon / Mercury / … / Neptune` button
    grid moved to a new collapsible **Solar System** group;
    `Dome Caustic` toggle moved up between
    `Sun / Moon "9" Glyph` and `GP Tracer`.
  - Demo list: every demo entry now has a small `↪` button
    next to its play button that snaps lat / lon / time to
    the demo's intro state without playing the animation.
    `DemoController.jumpTo(index)` added.
  - Moon colour: track / analemma / vault ray / optical
    vault ray switched from blue (`0x88aacc`, `0x6688aa`,
    `0xc0c0d8`, `0xaaaaff`) to white. Neptune retains its
    blue.
  - Optical-vault axis colours rotated so red = +z (zenith /
    perpendicular to ground), green = +x (north tangent),
    blue = +y (east tangent).
  - `VaultOfHeavens.update` now caches its graticule and
    only rebuilds when `VaultSize` or `VaultHeight`
    actually change; previously rebuilt every frame.
  - Antarctic sun samples: `scripts/build_antarctic_sun_samples.mjs`
    computes 864 sun azimuth/elevation samples (6 stations ×
    6 dates × 24 hours) using the project's existing
    Astropixels (DE405) ephemeris and standard alt/az from
    RA/Dec/LST. Output: `js/data/antarcticSunSamples.js`.
  - `scripts/run_dome_caustic_search.mjs`: offline runner
    that exercises the caustic tracer across a parameter
    grid for diagnostic use.
- **Revert:** `git checkout v-s000429 -- .` then delete the
  three new script / data files.

## S431 — Tracker UI restructure + presets + satellite gating

- **Date:** 2026-04-26
- **Files changed:** `css/styles.css`, `js/core/app.js`,
  `js/main.js`, `js/render/constellations.js`,
  `js/render/index.js`, `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - Tracker Options panel: 2-column column-major layout.
    Order: `ShowStars` (master), `ShowCelestialBodies`
    (master), `ShowOpticalVault`, `ShowTruePositions`,
    `ShowShadow`, `ShowGPTracer`, then remaining toggles.
  - Removed per-category Show toggles from sub-menus (Cel
    Nav, Constellations, Black Holes, Quasars, Galaxies,
    Satellites, BSC). `Show<Cat>` state retained.
  - Each sub-panel "Enable All" now also sets its
    `Show<Cat>` flag true. Master "Track All" sets all of
    them (`ShowCelNav`, `ShowBlackHoles`, `ShowQuasars`,
    `ShowGalaxies`, `ShowSatellites`).
  - Latitude lines split: separate `ShowTropics` and
    `ShowPolarCircles` state keys. `ShowLatitudeLines`
    retired from URL persistence; `ShowTropics` /
    `ShowPolarCircles` added to `PERSISTED_KEYS` and
    `VERSION_GATED_KEYS`.
  - Renamed "Longitude ring" UI label to "Heavenly Vault
    Azi".
  - Constellations: gates decoupled — `ShowStars` and
    `ShowConstellationLines` now independent; early return
    flips to `(!showStars && !showLines) || !canShow`.
    `js/main.js` auto-disable on starfield-type change
    removed.
  - Compass button (🧭) toggles `ShowFeGrid +
    ShowAzimuthRing + ShowLongitudeRing +
    ShowOpticalVaultGrid` together. Grids button (▦)
    toggles `ShowGPTracer`.
  - WorldModel (FE/GE) and FreeCameraMode (🎥) toggle
    buttons added in bar-left grids stack.
  - Presets: P1 (Minimal — everything off, ephemeris only)
    and P2 (Demo — 45°N / -100°, full catalog) buttons in
    `bar-left .presets`. P1 sets camera + observer state to
    app defaults; P2 enables `ShowGPTracer`,
    `ShowConstellationLines`, full `TrackerTargets`. Fixed
    incorrect keys in both presets: `ShowDeclinationCircles`
    → `ShowDecCircles`, `ShowOutlines` →
    `ShowConstellationLines`.
  - Per-demo ↪ jump button beside each play button +
    `DemoController.jumpTo(index)`.
  - Satellites: `c.Satellites` populates when any
    `star:sat_*` id is in `TrackerTargets` / `BscTargets` /
    `FollowTarget`, or when `ShowSatellites` master is on.
    Removed redundant `showKey: 'ShowSatellites'` from
    `satelliteStars` (`requireMembership: true` already
    filters per-entry).
  - VaultOfHeavens: `update` caches graticule, rebuilds
    only when `VaultSize` or `VaultHeight` change.
  - Observer figure: `nikki` z-offset adjusted to 0.028 to
    match bear; `'none'` figure marker dot + crosshair
    always hidden.
- **Revert:** `git checkout v-s000430 -- .`

## S432 — GP Tracer split + sky-line below-horizon + clear button

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`, `js/ui/controlPanel.js`.
- **Change:**
  - GP Tracer split into two independent toggles in
    Tracker Options: `ShowGPTracer` ("Trace GP", disc/ground
    line) and `ShowOpticalVaultTrace` ("Trace Optical
    Vault", optical-vault sky line). `discGroup.visible`
    gates on `ShowGPTracer`; `skyGroup.visible` gates on
    `ShowOpticalVaultTrace`.
  - GP Tracer extended to handle all `star:` ids
    (Cel-Nav / Constellation / Black Holes / Quasars /
    Galaxies / Satellites / BSC) in addition to
    sun / moon / planets. Targets iterate
    `TrackerTargets ∪ BscTargets`; per-catalog colour
    matches the renderer.
  - New `ShowTraceUnder` toggle (placed under "Trace
    Optical Vault"): when on, sky-line materials drop the
    `clipBelowDisc` plane so the optical-vault trace
    continues below the observer's horizon.
  - New "Clear Trace" action button in Tracker Options
    bumps `ClearTraceCount`; `GPTracer.update` resets all
    accumulated buffers when the count changes.
  - P1 / P2 presets updated for the new flags
    (`ShowOpticalVaultTrace: false` in both, `ShowGPTracer:
    true` in P2 unchanged).
- **Revert:** `git checkout v-s000431 -- .`

## S433 — Tracker action buttons in 1x3 row

- **Date:** 2026-04-26
- **Files changed:** `css/styles.css`,
  `js/ui/controlPanel.js`.
- **Change:**
  - New row type `actions: [{ buttonLabel, onClick }, ...]`
    rendered by `clickGroupRow` as a flex row of compact
    buttons (`.row.action-group-row` / `.action-btn`).
    Each button takes `flex: 1` so the row evenly
    distributes space.
  - `Clear All`, `Track All`, `Clear Trace` consolidated
    into a single 1x3 row at the top of Tracker Options.
    Standalone `Clear Trace` row removed from below the
    trace toggles.
  - 2-column Tracker Options column-span rule extended to
    include `.action-group-row` so the new row spans both
    columns.
- **Revert:** `git checkout v-s000432 -- .`

## S434 — Clear-trace button next to FE/GE toggle

- **Date:** 2026-04-26
- **Files changed:** `css/styles.css`,
  `js/ui/controlPanel.js`.
- **Change:**
  - New `⌫` clear-trace button placed to the right of the
    `FE`/`GE` world-model toggle in the bar-left grids
    stack. Clicking bumps `ClearTraceCount` (same handler
    as the Tracker Options "Clear Trace" entry).
  - `grids-stack` second row wrapped in a flex `world-row`
    so `FE` + `⌫` sit side-by-side; `▦` stays alone on top.
- **Revert:** `git checkout v-s000433 -- .`

## S435 — GE mode: observer axes, optical-vault orientation, FE-vault gate, camera coord

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/scene.js`, `js/render/index.js`.
- **Change:**
  - `Observer` constructor adds a small XYZ axis triad on
    `observer.group` (green +x = north, blue +y = east,
    red +z = up). In GE the triad picks up
    `GlobeObserverFrame` via the existing observer
    rotation; in FE it stays world-aligned at the disc.
  - `ObserversOpticalVault.update`: removed the
    unconditional `this.group.rotation.set(0, 0, lon)`
    that was clobbering the GE rotation matrix set
    earlier in the same call. Longitude rotation is now
    applied only when `WorldModel !== 'ge'`. Optical-vault
    cap now actually follows `GlobeObserverFrame` as the
    observer moves across the sphere.
  - `scene.updateCamera`: `obs` resolves to
    `GlobeObserverCoord` in GE so InsideVault and
    FreeCameraMode position on the sphere instead of the
    FE disc. InsideVault local north/east now read from
    `GlobeObserverFrame` in GE; FE branch unchanged.
  - `index.js` post-`InsideVault` else-branch:
    `vaultOfHeavens.group.visible` no longer force-true in
    GE — gated on `!(WorldModel === 'ge')` so the FE
    flat-disc heavenly vault stops leaking into GE mode.
- **Revert:** `git checkout v-s000434 -- .`

## S436 — GE mode: starfield on celestial sphere + GPs on globe surface

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`,
  `js/render/constellations.js`, `js/render/index.js`.
- **Change:**
  - `projectStar` and `projectSatellite` now also emit
    `globeVaultCoord` — the entry's position on the GE
    celestial sphere at radius `GlobeVaultRadius`,
    longitude folded by `SkyRotAngle` so the sphere
    co-rotates with Earth (matches sun/moon/planet
    convention already used by `_globeVaultAt`).
  - `Stars.update`: GE branch projects each random star
    onto the celestial sphere; FE branch unchanged
    (AE-disc projection).
  - `CelNavStars.update` and `CatalogPointStars.update`:
    dome buffer reads `star.globeVaultCoord` in GE,
    `star.vaultCoord` in FE.
  - `Constellations.update`: GE branch positions stars on
    the celestial sphere; line builder reuses the same
    per-star `domePos` array, so constellation outlines
    follow.
  - `GroundPoint.updateAt` accepts a `ge` flag. GE
    projects the dot onto the globe surface at
    `(lat, lon)` with a tiny outward lift; the disc face
    is rotated to point radially outward.
  - `index.js`: removed `!ge` gate on `sunGP`, `moonGP`,
    `trackedGPs.group`. Sun/moon `updateAt` calls now
    pass the `ge` flag. `gpPathOverlay` stays gated FE-only
    (still uses disc-AE coords).
  - `TrackedGroundPoints.update` passes `ge` through and
    suppresses the vault→GP drop-line in GE (the FE
    vertical-line geometry doesn't apply on a sphere).
- **Revert:** `git checkout v-s000435 -- .`

## S437 — GE mode: hide FE-only optical-vault overlays

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - Added a post-update GE-hide block at the end of
    `RenderSet.update`: forces `.visible = false` for the
    optical-vault overlays whose math is FE-only
    (`celestialPoles`, `decCircles`, `sunMonthMarkers` /
    `sunMonthMarkersOpp` / `moonMonthMarkers`,
    `eclipseMapSolar` / `eclipseMapLunar`, `sunNine` /
    `moonNine`, `gpTracer.skyGroup`).
  - Star/constellation "spherePoints" / `sphereStars` /
    `sphereLines` (optical-vault-projected stars) hidden
    in GE — their world positions go through the FE
    Local→Global transform and don't track the GE
    observer.
- **Revert:** `git checkout v-s000436 -- .`

## S438 — GE mode: hide CelestialMarker optical dots; InsideVault camera up-vector

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`,
  `js/render/scene.js`.
- **Change:**
  - GE post-update block now also hides
    `sphereDot` / `sphereHalo` on `sunMarker`,
    `moonMarker`, and every entry in `planetMarkers`.
    Their world positions come from
    `localGlobeCoordToGlobalFeCoord(opticalVaultProject(...))`,
    which doesn't follow the GE observer.
  - InsideVault camera (`scene.updateCamera`) now uses
    full 3D `(north, east, up)` from `GlobeObserverFrame`
    in GE: camera position lifts along local up; pitched
    look target combines `forward` and `up`; `camera.up`
    set to the local radial-outward direction. FE branch
    keeps its 2D math.
  - Orbit camera resets `camera.up` to world `(0, 0, 1)`
    so re-entry from InsideVault GE (which set up to a
    radial-outward direction) doesn't tilt the
    Heavenly-mode view.
- **Revert:** `git checkout v-s000437 -- .`

## S439 — GE: terrestrial-sphere centre marker + zenith-through-centre line

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - `WorldGlobe` adds a small bright dot at the world
    origin so the centre of the terrestrial sphere is a
    visible reference. The dot is rendered with
    `depthTest: false` so it stays visible through the
    sphere.
  - `Observer` adds a zenith-through-centre reference
    line in observer-local frame: from `(0, 0, 0)` along
    local `-z` by one `FE_RADIUS`. With the GE rotation
    matrix applied, the line passes from the observer's
    feet straight through the centre of the terrestrial
    sphere. Line is gated on GE in `Observer.update`.
- **Revert:** `git checkout v-s000438 -- .`

## S440 — Centre line in world space + screenshot button + preserveDrawingBuffer

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`, `js/render/scene.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - `Observer.zenithToCenter` line moved out of
    `observer.group` and added directly to `sm.world`.
    Endpoints rewritten each frame in `Observer.update`
    (GE only): from observer's world position to
    `(0, 0, 0)`. Removes any dependence on the
    quaternion that builds the observer-local frame —
    the line is guaranteed to terminate at the centre
    dot.
  - Bar-left adds a `📷` Screenshot button below the
    grids stack. Clicking copies the WebGL canvas to
    the clipboard as PNG (via `navigator.clipboard.write`
    + `ClipboardItem`); falls back to a download when
    the Clipboard API isn't available. Briefly shows
    `✓` / `⬇` for feedback.
  - `WebGLRenderer` constructed with
    `preserveDrawingBuffer: true` so `canvas.toBlob`
    returns the rendered frame instead of an empty
    buffer. Minor performance hit; required for
    canvas-side screenshotting.
- **Revert:** `git checkout v-s000439 -- .`

## S441 — Observer XYZ axes in world space + screenshot button moved

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`, `js/ui/controlPanel.js`,
  `css/styles.css`.
- **Change:**
  - Observer XYZ axis triad moved out of `observer.group`
    and added directly to `sm.world`. Endpoints
    rewritten each frame in `Observer.update`: in GE,
    each axis is one segment from the observer's world
    position along `GlobeObserverFrame`'s
    `north / east / up`; in FE, north = radial-out from
    disc origin, east = +90° clockwise about z, up = +z.
    Bypasses the rotation-matrix path so the red zenith
    axis is guaranteed collinear with the
    zenith-to-centre line.
  - Screenshot button (`📷`) moved from the bar-left
    grids stack into the mode-grid, immediately after
    the night `🌙` button. Mode grid widened to 4
    columns; bottom row holds `🎛 📍 🎥`.
- **Revert:** `git checkout v-s000440 -- .`

## S442 — GE: right-handed observer/optical-vault rotation matrix

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`.
- **Change:**
  - Removed the diagnostic XYZ axis triad added in S441
    on `observer.group`. The observer's zenith axis is
    represented by the existing optical-vault red axis;
    an extra triad on the observer figure is redundant.
  - Both `Observer` and `ObserversOpticalVault` rotation
    matrices switched from columns `[north, east, up]`
    (left-handed, det = -1) to `[-north, east, up]`
    (right-handed, det = +1).
    `Quaternion.setFromRotationMatrix` only handles
    proper rotations; the left-handed basis was
    silently producing a wrong quaternion, which is why
    the optical-vault axes never aligned with the
    radial direction. Local `+x = -north` (outward
    along surface tangent) matches the FE convention
    where the figure faces "outward from disc centre"
    via `figureGroup.rotation = atan2(p[1], p[0])`.
  - Zenith-through-centre line restored on `Observer`
    (added back in this revision after the cleanup
    above).
- **Revert:** `git checkout v-s000441 -- .`

## S443 — Avatar follows ObserverHeading; GE optical-vault sized to surface

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`.
- **Change:**
  - `Observer.update`: `figureGroup.rotation` now derives
    from `ObserverHeading`. GE uses `(π − H)`; FE uses
    `(atan2(p[1], p[0]) + π − H)`. Heading 0 → figure
    faces north, 90 → east, 180 → south, 270 → west, in
    both world models.
  - `c.OpticalVaultRadius` capped at `0.10 · FE_RADIUS`
    in GE so the cap visually sits on the terrestrial
    sphere (was the FE default `0.5 · FE_RADIUS`, which
    occupies a quarter of the sphere). `OpticalVaultHeight`
    matches the radius in GE so the cap is a strict
    hemisphere.
- **Revert:** `git checkout v-s000442 -- .`

## S444 — GE optical vault wraps the visible hemisphere of the terrestrial sphere

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`.
- **Change:**
  - `c.OpticalVaultRadius` and `c.OpticalVaultHeight` set
    to `FE_RADIUS` in GE (was `0.10 · FE_RADIUS` from
    S443).
  - `ObserversOpticalVault.update`: in GE the group is
    anchored at the world origin (was the observer
    position). With the unit-hemisphere mesh scaled by
    `FE_RADIUS` and rotated by `GlobeObserverFrame`, the
    cap apex sits at the observer and the rim follows
    the great circle 90° from the observer's zenith
    (the equator when the observer is at a pole). FE
    branch unchanged — the cap remains tangent at the
    observer's disc position.
- **Revert:** `git checkout v-s000443 -- .`

## S445 — GE optical vault: keep FE_RADIUS size, anchor tangent at observer

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - `ObserversOpticalVault.update`: anchor the group at
    the observer's world position in both modes (was the
    world origin in GE per S444). Combined with
    `c.OpticalVaultRadius = c.OpticalVaultHeight =
    FE_RADIUS` in GE, the cap is a hemisphere of radius
    `FE_RADIUS` whose flat rim is the observer's tangent
    plane and whose apex extends `FE_RADIUS` outward
    along the local zenith. `OpticalVaultSize` and
    `OpticalVaultHeight` sliders remain ignored in GE —
    the size is fixed.
- **Revert:** `git checkout v-s000444 -- .`

## S446 — GE celestial sphere expanded to 2·FE_RADIUS

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`.
- **Change:**
  - `c.GlobeVaultRadius` set to `2 · GLOBE_RADIUS` (was
    `1.6`). With the GE optical vault tangent at the
    observer with radius `FE_RADIUS`, its apex sits at
    `2 · FE_RADIUS` from the world origin; the celestial
    sphere now grazes that apex. Stars/planets/sun/moon
    on `globeVaultCoord` follow automatically since
    they're computed via `_globeVaultAt(...)` against
    the same `c.GlobeVaultRadius`.
- **Revert:** `git checkout v-s000445 -- .`

## S447 — GE optical-vault projection: starfield + bodies on the GE cap

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`,
  `js/render/constellations.js`, `js/render/index.js`.
- **Change:**
  - New `_globeOpticalProject(localGlobe)` helper in
    `app.update()`: returns the body's world position on
    the GE optical cap (hemisphere of `FE_RADIUS` tangent
    at the observer). Sub-horizon bodies returned at the
    far-below sentinel `[0, 0, -1000]` so the disc clip
    plane / rim hide them.
  - `globeOpticalVaultCoord` field added to sun, moon,
    each planet, every cataloged star (cel-nav,
    constellation, black holes, quasars, galaxies, BSC),
    and every satellite via `projectStar` and
    `projectSatellite`.
  - `index.js` sun/moon/planet markers + sun/moon "9"
    glyphs now consume the GE optical coord in GE.
  - `Stars.update`, `CelNavStars.update`,
    `CatalogPointStars.update`,
    `Constellations.update`: optical-vault buffer reads
    `globeOpticalVaultCoord` in GE, falls back to the FE
    `opticalVaultCoord` when not in GE.
  - GE post-update hide-block trimmed: removed the gates
    on `sphereDot` / `sphereHalo` for sun/moon/planets,
    `spherePoints` for the eight star catalogs, and
    `sphereStars` / `sphereLines` for constellations.
    The GP-tracer sky line stays gated until that path
    is re-projected.
- **Revert:** `git checkout v-s000446 -- .`

## S448 — GE optical-vault: drop horizon clip + below-horizon fade

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`,
  `js/render/constellations.js`, `js/render/index.js`.
- **Change:**
  - `_globeOpticalProject` no longer parks sub-horizon
    bodies (`localGlobe[0] ≤ 0` no longer returns
    `[0, 0, -1000]`). Below-horizon bodies project
    geometrically below the cap rim.
  - `Stars.update`, `CelNavStars.update`,
    `CatalogPointStars.update`,
    `Constellations.update`: GE branches drop the
    horizon-park; FE keeps it (FE disc-clip plane still
    needs the sentinel). Below-horizon GE entries land
    on the lower half of the cap.
  - `index.js` sun / moon / planet markers pass
    `elevation = 90` to `CelestialMarker.update` in GE
    so its `(elevation + 3) / 5` fade stays at full
    opacity for sub-horizon bodies.
- **Revert:** `git checkout v-s000447 -- .`

## S449 — Heavenly Vault toggle moved to Tracker Options; gates GE shell

- **Date:** 2026-04-26
- **Files changed:** `js/ui/controlPanel.js`,
  `js/render/worldObjects.js`.
- **Change:**
  - `ShowVault` row moved out of the Show / Heavenly
    Vault group into Tracker Options (between
    `ShowCelestialBodies` and `ShowOpticalVault`).
  - `GlobeHeavenlyVault.update` gates `group.visible` on
    `ShowVault` in addition to `WorldModel === 'ge'` —
    unchecking the toggle hides the GE celestial sphere
    + graticule, mirroring how it hides the FE flat
    dome.
- **Revert:** `git checkout v-s000448 -- .`

## S450 — GE: disable disc clip plane so sub-horizon bodies render

- **Date:** 2026-04-26
- **Files changed:** `js/render/scene.js`.
- **Change:**
  - `scene.updateCamera` toggles
    `renderer.localClippingEnabled = !ge`. The
    `clipBelowDisc` plane is fixed at world `z = 0` and
    is FE-specific (hides anything beneath the disc).
    In GE there's no flat ground plane, so the lower
    half of the optical cap, sub-horizon body markers,
    and the back side of the celestial sphere all need
    to render — disabling the clip for the GE frame
    accomplishes that without touching the FE pipeline.
- **Revert:** `git checkout v-s000449 -- .`

## S451 — FE/GE button stays in pressed state

- **Date:** 2026-04-26
- **Files changed:** `js/ui/controlPanel.js`,
  `css/styles.css`.
- **Change:**
  - `btnWorld` (`FE` / `GE` toggle) gets a permanent
    `aria-pressed="true"` since one world model is
    always active. The button face alone tells the user
    which mode they're in.
  - New `#bottom-bar .world-btn[aria-pressed="true"]`
    rule mirrors the freecam / grids pressed style
    (accent border + colour, faint accent background).
- **Revert:** `git checkout v-s000450 -- .`

## S452 — GE: terrestrial sphere occludes optical-vault projections

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - New `_applyDepthState(ge)` runs each frame at the
    end of `update`. In GE: the `WorldGlobe.sphere`
    material flips to opaque (`transparent: false`,
    `opacity: 1`, `depthWrite: true`) so it occludes
    anything behind it; the sphere-projected layers
    (star spherePoints for all catalogs, constellation
    sphereStars/sphereLines, sun/moon/planet sphereDot
    + sphereHalo) all switch `depthTest` to `true`. In
    FE the same materials revert to `depthTest = false`
    and the WorldGlobe stays at its earlier translucent
    presentation (it isn't visible in FE anyway). The
    earlier S450 clip-plane disable still applies
    globally — depth-buffer culling is what actually
    hides obstructed bodies.
- **Revert:** `git checkout v-s000451 -- .`

## S453 — GE occlusion: heavenly-vault layer only, leave optical vault free

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - `_applyDepthState(ge)` trimmed: only the
    `WorldGlobe.sphere` material flips
    (`transparent: false`, `opacity: 1`,
    `depthWrite: true`) in GE. The depth-test toggles
    on every optical-vault layer (`spherePoints`,
    `sphereStars` / `sphereLines`, sun/moon/planet
    `sphereDot` / `sphereHalo`) added in S452 are
    removed — they kept their original FE settings
    (`depthTest: false`).
  - Result: the GE terrestrial sphere occludes only
    true-position bodies (the heavenly-vault `domeDot`
    / `domePoints` layers, which already default to
    `depthTest: true`). The observer's optical-vault
    projections continue to render unconditionally,
    matching the rule that sub-horizon optical
    projections remain visible.
- **Revert:** `git checkout v-s000452 -- .`

## S454 — GE occlusion: extend to optical-vault layers too

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - Reinstated the depth-test toggle on every sphere-
    projected optical-vault layer (`spherePoints` for
    each star catalog, constellation `sphereStars` /
    `sphereLines`, sun / moon / planet `sphereDot` /
    `sphereHalo`). Combined with the existing
    `WorldGlobe.sphere` opaque + `depthWrite: true`
    flip, the terrestrial sphere now occludes any
    optical-vault projection geometrically behind it.
- **Revert:** `git checkout v-s000453 -- .`

## S455 — Optical-vault cap dips past horizon to meet the terrestrial sphere

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - `ObserversOpticalVault` mesh `SphereGeometry` polar
    range extended from `π/2` to `π/2 + π/30` (~6° of
    overshoot) so the cap mesh dips below the tangent
    plane.
  - `buildLatLongHemisphereGeom` gains an `overshootRad`
    parameter applied to the meridian polar max; the
    optical-vault wireframe is built with the same
    overshoot so its meridian arcs match the mesh.
  - In GE, depth-testing against the opaque terrestrial
    sphere (S452/S454) clips the interior portion of
    the overshoot, leaving a clean rim where the cap
    meets the visible sphere surface — no black gap.
    In FE the disc clip plane discards the same
    negative-z geometry, so existing FE rendering is
    unchanged.
- **Revert:** `git checkout v-s000454 -- .`

## S456 — GE: revert cap overshoot; lower InsideVault camera to surface

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/scene.js`.
- **Change:**
  - Reverted S455's polar-overshoot extension on the
    `ObserversOpticalVault` mesh + wireframe. The cap
    rim is back to a strict π/2 (the tangent plane).
    `buildLatLongHemisphereGeom`'s `overshootRad`
    parameter is retained as an optional argument
    (default 0) but is no longer used by the optical
    vault.
  - `scene.updateCamera` lowers `eyeH` from `0.012` to
    `1e-4` when `WorldModel === 'ge'` so the InsideVault
    camera sits effectively on the sphere surface. The
    visible curvature edge of the terrestrial sphere
    then coincides with the cap rim (90° from zenith) —
    Polaris hitting the rim is exactly where curvature
    starts to occlude it for sub-equatorial observers.
- **Revert:** `git checkout v-s000455 -- .`

## S457 — GE InsideVault: drop camera near-plane so sphere renders at point-blank

- **Date:** 2026-04-26
- **Files changed:** `js/render/scene.js`.
- **Change:**
  - Camera `near` plane lowered from `0.01` to `1e-5`
    when `WorldModel === 'ge' && InsideVault`. With
    S456's `eyeH = 1e-4`, the camera was sitting inside
    the FE-tuned `near = 0.01` clip distance, so the
    terrestrial sphere was being clipped against the
    near-plane and disappeared from the GE InsideVault
    view (looked transparent + sub-horizon bodies
    rendered behind it because depth-write never wrote
    a fragment for the sphere). Restoring near-plane
    to `0.01` in every other case (FE, GE Heavenly).
- **Revert:** `git checkout v-s000456 -- .`

## S458 — GE InsideVault: shrink eyeH + near to close residual horizon-dip

- **Date:** 2026-04-26
- **Files changed:** `js/render/scene.js`.
- **Change:**
  - `eyeH` lowered from `1e-4` to `1e-6` in GE
    InsideVault. Horizon-dip angle from altitude `h`
    above radius `R = 1` is `√(2h/R)`; the previous
    `1e-4` left a `~0.81°` gap, the new `1e-6` reduces
    it to `~0.08°` — below the visual threshold.
  - Camera `near` plane lowered from `1e-5` to `1e-7`
    in GE InsideVault to stay below the smaller `eyeH`,
    so the terrestrial sphere keeps rendering at
    point-blank range and depth-buffer occlusion
    continues to work.
- **Revert:** `git checkout v-s000457 -- .`

## S459 — Map Projection split: FE vs GE preserved separately

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`, `js/ui/urlState.js`,
  `js/ui/controlPanel.js`, `js/render/index.js`.
- **Change:**
  - New state field `MapProjectionGe` (default
    `'hq_ortho'`). Persisted in URL state.
  - `pairSelectRow` now honours optional `leftKey` /
    `rightKey` row config so each side of the dropdown
    pair drives its own state field. When both omitted
    the row falls back to `row.key` (legacy behaviour).
  - Show / Map Projection row reconfigured: left
    dropdown drives `MapProjection` (FE), right drives
    `MapProjectionGe` (GE). Each side lists every
    projection (Generated + HQ) so any can be assigned
    to either world model.
  - `frame()` and `loadLand()` resolve the active
    projection by world model — `MapProjectionGe` in
    GE, `MapProjection` in FE — so the dropdowns
    preserve their selections across mode toggles.
    LatitudeLines + DiscGrid still read `MapProjection`
    directly (they're FE-only and hidden in GE).
  - P1 / P2 presets set both keys.
- **Revert:** `git checkout v-s000458 -- .`

## S460 — Tooltip toggle, GE camera lift fix, mode-aware GP tracer, equirect map on globe

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/ui/controlPanel.js`,
  `js/render/worldObjects.js`,
  `js/render/index.js`, `js/render/scene.js`.
- **Change:**
  - New `ShowTooltips` state (default true) plus a
    "Mouseover Tooltips" row in Show / Misc.
    `bindTip` now keeps a registry of bound elements
    and clears every `title` attribute when the toggle
    flips off (and restores them when on).
  - GE InsideVault camera no longer adds
    `ObserverElevation` (FE-disc concept) to the lift —
    the camera stays on the sphere surface
    (`lift = eyeH ≈ 1e-6`) so sky and ground meet.
  - GP Tracer becomes mode-aware. In GE the disc trace
    projects onto the terrestrial sphere surface at
    each body's GP `(lat, lon)` with a small outward
    lift; the sky-line consumes the body's
    `globeOpticalVaultCoord`; observer position pulls
    from `GlobeObserverCoord`. FE branch unchanged.
  - `WorldGlobe` gains an `applyMapTexture(projId,
    getProjection)` helper. For HQ equirectangular
    projections (`hq_equirect_day` / `hq_equirect_night`)
    the asset is loaded and applied as the sphere's
    map; other projections fall back to plain shading
    (their flat-disc layouts don't wrap a sphere
    cleanly). UV origin shifted by `0.5` so the map's
    prime meridian aligns with world +x. Texture cache
    keyed by asset URL avoids refetching on toggle.
    `index.js` calls the helper each frame from the
    state's `MapProjectionGe`.
- **Revert:** `git checkout v-s000459 -- .`

## S461 — Fix S460 module-load crash; move applyMapTexture inside class

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - S460 placed `WorldGlobe.prototype.applyMapTexture =
    ...` BEFORE the `export class WorldGlobe`
    declaration. ES2015 classes are not hoisted (TDZ),
    so the prototype assignment threw a
    `ReferenceError` at module load — every script
    downstream stopped executing and the page rendered
    as a black canvas with only the header bar.
    Moved `applyMapTexture` to be a method on the class
    itself.
- **Revert:** `git checkout v-s000460 -- .`

## S462 — GE: stars occlude when crossing below horizon

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`,
  `js/render/constellations.js`, `js/render/index.js`.
- **Change:**
  - `_globeOpticalProject` parks `localGlobe[0] ≤ 0`
    bodies at `[0, 0, -1000]` again (S448's no-clip
    behaviour reversed). Sub-horizon stars / sun /
    moon / planets vanish as their elevation crosses
    `0°` instead of projecting onto the lower half of
    the cap.
  - Same horizon-park added to `Stars.update` and
    `Constellations.update` GE branches.
  - Sun / moon / planet `CelestialMarker.update` calls
    pass actual elevation again (S448 was overriding
    to `90` in GE to keep them visible sub-horizon);
    the fade now hides markers as they drop below
    `0°` in both modes.
- **Revert:** `git checkout v-s000461 -- .`

## S463 — UI scales with viewport via CSS zoom

- **Date:** 2026-04-26
- **Files changed:** `css/styles.css`.
- **Change:**
  - New CSS custom property
    `--ui-zoom: clamp(0.65, calc(100vw / 1920), 1.5)`
    on `:root`. Linear scale anchored to 1.0 at a
    1920-px viewport, capped at 0.65× / 1.5× for
    extreme widths.
  - `zoom: var(--ui-zoom)` applied to `#bottom-bar`,
    `.tab-popup`, `#hud`, and `#tracker-hud`. The
    bottom bar, the popup tab panels, the corner HUD,
    and the tracker HUD all now scale proportionally
    with viewport width. Browser-zoom multiplies on
    top automatically (`100vw` already accounts for
    user-zoom).
- **Revert:** `git checkout v-s000462 -- .`

## S464 — GP Path span scales; star band drift via apparent corrections

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/ui/controlPanel.js`, `js/ui/urlState.js`.
- **Change:**
  - New `GPPathDays` state (default 1, range 1–1095).
    `sampleFrom` / `sampleFromSubPointFn` use `_gpDays
    × 86_400_000 ms` for the trace span; sample count
    scales as `48 × √(_gpDays)` clamped to `[48, 2048]`
    so resolution stays smooth across 1-day to 3-year
    horizons.
  - `sampleFixedStar` now drives `apparentStarPosition`
    with `precession + nutation + aberration` enabled
    every sample so the star's GP picks up the slow
    declination drift instead of collapsing to a
    single constant-latitude circle. Planets / sun /
    moon already vary because they go through the
    ephemeris pipeline.
  - "GP Path (24 h)" row in Tracker Options renamed to
    "GP Path"; new "GP Path Span (days)" numeric row
    drives `GPPathDays`. Both keys persisted in URL
    state.
- **Revert:** `git checkout v-s000463 -- .`

## S465 — Annual Cycle demo (single-tracker precondition)

- **Date:** 2026-04-26
- **Files changed:** `js/demos/definitions.js`,
  `js/demos/index.js`.
- **Change:**
  - New `ANNUAL_CYCLE_DEMO` and "Annual Cycle" group.
    Demo intro is a function that counts the bodies in
    `TrackerTargets ∪ FollowTarget` and refuses to
    load (`return null`) when the count isn't exactly
    1. The refusal message surfaces via `Description`
    in the footer.
  - When 1 body is tracked the demo keeps the observer
    at their current lat/long, enables `ShowGPPath`,
    sets `GPPathDays = 365`, and animates `DateTime`
    forward by one year over 30 s so the user watches
    the body's GP band drift.
  - `_playSingle` in the demo controller now bails
    cleanly on a falsy intro return value (rather than
    crashing on `setState(null)`), so demos can refuse
    a precondition without breaking playback state.
- **Revert:** `git checkout v-s000464 -- .`

## S466 — Planet vault height: drop sun-DecRange clamp

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`.
- **Change:**
  - Removed the `±1` clamp on each planet's `decNorm`
    in `app.update`. Previously
    `0.5 + 0.5 · clamp(planetDec / 23.44°, -1, 1)`
    flattened response above ±23.44° (sun's max
    declination); planets that occasionally exceeded
    that range (Mercury at ~28°) had their vault Z
    saturated, reading as "locked at the equator".
    `decNorm` now follows actual ephemeris declination
    proportionally; the existing `heavenlyVaultCeiling`
    clamp on `planetZ` still prevents the height from
    breaking the dome envelope.
  - Horizontal AE projection (`vaultCoordAt(ll.lat,
    ll.lng, …)`) was already unclamped — planets'
    sub-points have always traced their full
    ephemeris-driven AE positions on the disc.
- **Revert:** `git checkout v-s000465 -- .`

## S467 — Annual Cycle: per-body period; live tracer instead of GP path

- **Date:** 2026-04-26
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - `PERIOD_DAYS` table added (sun 365.25, moon 27.32,
    Mercury 87.97, Venus 224.70, Mars 686.97, Jupiter
    4332.59, Saturn 10759.22, Uranus 30688.5, Neptune
    60182). Demo's `Tval` now advances `DateTime` by
    the tracked body's full period in 4 s instead of
    fixed 365 days/30 s.
  - Intro switched from pre-plotting via
    `ShowGPPath` + `GPPathDays` to live tracing via
    `ShowGPTracer` + `ShowOpticalVaultTrace`. The orbit
    pattern emerges as `DateTime` advances, so each
    body's unique AE-projected signature (Mercury's
    nested retrograde loops, Mars's broad swing, etc.)
    is visible being drawn out rather than appearing
    all at once. `ClearTraceCount` bumped on intro to
    wipe previous trace segments.
- **Revert:** `git checkout v-s000466 -- .`

## S468 — Annual Cycle: per-body demos, observer at AE pole

- **Date:** 2026-04-26
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - Replaced the single tracker-gated `ANNUAL_CYCLE_DEMO`
    with `ANNUAL_CYCLE_DEMOS`: one per body
    (sun, moon, mercury, venus, mars, jupiter, saturn,
    uranus, neptune). Each demo's intro:
    - Parks the observer at the AE-projection pole
      (`ObserverLat: 90`, `ObserverLong: 0`,
      `ObserverElevation: 0`, `WorldModel: 'fe'`,
      `InsideVault: false`).
    - Sets the orbital camera to look straight down on
      the disc (`CameraHeight: 89.9`, `CameraDistance: 10`,
      `Zoom: 1.5`).
    - Replaces `TrackerTargets` with `[body]` and
      clears `FollowTarget` so the renderer paints
      only the demo's body trace.
    - Enables `ShowGPTracer` + `ShowOpticalVaultTrace`,
      bumps `ClearTraceCount` so prior segments wipe
      out, leaves `ShowGPPath` off — the AE signature
      is drawn live as `DateTime` advances.
  - Tasks: 4 s linear ramp through the body's full
    sidereal period (`PERIOD_DAYS` table from S467).
  - Demo group `annual-cycle` now contains nine demos
    instead of one; the previous "1 tracker required"
    precondition is removed.
- **Revert:** `git checkout v-s000467 -- .`

## S469 — Annual Cycle: 1-calendar-year demos per body

- **Date:** 2026-04-26
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - New `YEAR_CYCLE_DEMOS`: nine demos parallel to the
    per-period set, but each spans exactly 365.25 days
    in 8 s. Same observer + camera setup (AE pole,
    looking straight down). The trace shows the
    year-bounded interaction between Earth's daily
    rotation and the body's orbital drift — Mercury
    completes ~4 orbits, Venus ~1.6, Mars ~0.53,
    Jupiter ~0.08, etc.
  - Demo descriptive text reports the orbit count for
    the year so users know how many full circuits
    they're seeing.
- **Revert:** `git checkout v-s000468 -- .`

## S470 — Tracker Clear All also turns off constellation lines

- **Date:** 2026-04-26
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:**
  - Tracker Options "Clear All" now sets
    `ShowConstellationLines: false` alongside emptying
    `TrackerTargets`. The constellation outline layer
    is independent of any tracker membership, so it
    stayed visible after clearing the per-body
    selections; this row makes "Clear All" actually
    blank the sky overlay too.
- **Revert:** `git checkout v-s000469 -- .`

## S471 — Celestial-frame trace mode for Annual Cycle demos

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`,
  `js/demos/definitions.js`, `js/demos/index.js`.
- **Change:**
  - New `TraceCelestialFrame` state (default `false`).
  - `GPTracer.update`: when `TraceCelestialFrame` is
    on, the per-target longitude no longer subtracts
    `SkyRotAngle` (GMST) — the trace plots the body's
    apparent celestial position over time rather than
    its rotating Earth-fixed ground point.
  - `ANNUAL_CYCLE_DEMOS` (per-period) and
    `YEAR_CYCLE_DEMOS` (1-calendar-year) intros now
    set `TraceCelestialFrame: true`. Each planet's
    rosette / spirograph signature emerges in
    sidereal coordinates: Mercury's nested retrograde
    loops, Venus's 1.6-orbit petal, Mars's broad
    swing, Jupiter / Saturn / Uranus / Neptune
    progressively smaller arcs.
  - Demo end-reset clears `TraceCelestialFrame` so the
    next demo / post-demo exploration runs in the
    Earth-fixed default.
- **Revert:** `git checkout v-s000470 -- .`

## S472 — Stellarium-trace overlay scaffolding

- **Date:** 2026-04-26
- **Files changed:** `js/data/stellariumTraces.js`
  (new), `js/render/worldObjects.js`,
  `js/render/index.js`, `js/core/app.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - New `js/data/stellariumTraces.js` exporting
    `STELLARIUM_TRACES = { sun, moon, mercury, venus,
    mars, jupiter, saturn, uranus, neptune }` —
    each body's array takes
    `{ ra, dec [, jd] }` rows (degrees). Header
    explains the Stellarium AstroCalc / Ephemeris
    paste workflow.
  - New `StellariumTraceOverlay` class. At construction
    each body's row array is projected through
    `canonicalLatLongToDisc` (the same AE math the GP
    tracer uses) and laid down as a single coloured
    polyline at `z = 0.004` on the disc. Pen-up across
    the 0/360 RA wrap so the line doesn't stitch a
    chord across the disc. `update` gates visibility
    on `state.ShowStellariumOverlay && !InsideVault`.
  - State key `ShowStellariumOverlay` (default false)
    + new "Stellarium Overlay" row in Tracker Options.
- **Revert:** `git checkout v-s000471 -- .`

## S473 — Tracking-info pop-up: pixel-art portrait + readout per body type

- **Date:** 2026-04-26
- **Files changed:** `index.html`, `js/main.js`,
  `js/ui/trackingInfoPopup.js` (new),
  `css/styles.css`.
- **Change:**
  - New `#tracking-info-popup` panel rendered by
    `buildTrackingInfoPopup`. Visible whenever the user
    has a single body actively selected — priority
    is `state.FollowTarget`, falling back to a
    one-element `state.TrackerTargets`. Otherwise
    hidden.
  - Pixel-art canvas (96×96 grid, 4× zoom) painted per
    body class:
    - `sun` — corona disc + 8-direction rays
    - `moon` — phase-aware grey disc with maria
    - planets — palette per body, banded jupiter /
      saturn, saturn ring, mars polar caps
    - `celnav` — bright 4-point star with halo
    - `catalogued` — pinpoint star + connecting line
      stub to suggest constellation membership
    - `blackhole` — accretion ring + photon ring +
      event horizon
    - `quasar` — bright dot with bipolar jets
    - `galaxy` — spiral arms + bulge
    - `satellite` — body, solar panels, antenna
    - `bsc` — small ivory star
  - Readout below the art shows the body's azimuth,
    elevation, RA, declination, GP lat / lon, and
    magnitude — pulled from `c.TrackerInfos`.
  - CSS pinning: panel sits in upper-right of the
    viewport (top + right `8px`), `zoom: var(--ui-zoom)`
    so it scales with viewport like the rest of the
    chrome.
- **Revert:** `git checkout v-s000472 -- .`

## S474 — Tracking-info pop-up: bigger panel, right side

- **Date:** 2026-04-26
- **Files changed:** `css/styles.css`.
- **Change:**
  - `#tracking-info-popup` resized: `min-width
    240 → 380` px, `max-width 460` px, padding +
    border-radius bumped, drop shadow added.
  - Pixel-art canvas sized to `160 × 160` (was 96 × 96)
    and given a subtle border-radius — the underlying
    canvas resolution stays `384 × 384` so the
    pixel-art still reads chunky-but-clean.
  - Title font 13 → 18 px, category 11 → 13 px,
    readout rows 12 → 14 px with tabular-nums for
    alignment.
  - Position remains upper-right (`top: 12 / right:
    12`); breathing room around the panel edge.
- **Revert:** `git checkout v-s000473 -- .`

## S475 — Stars dropped from ephem comparison; HUD limited to followed star

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/ui/controlPanel.js`,
  `js/ui/trackingInfoPopup.js`.
- **Change:**
  - `app.update`: tracker info for stars no longer
    populates the five `helioReading` /
    `geoReading` / `ptolemyReading` /
    `astropixelsReading` / `vsop87Reading` copies —
    they were all identical (catalog RA / Dec). Stars
    now carry plain `info.ra` and `info.dec`.
  - `buildTrackerHud`: the HUD's per-target block
    list filters star entries down to just the
    `state.FollowTarget` (when it points at a star).
    No follow-target means the star block list is
    empty. Sun / moon / planet / satellite entries
    pass through untouched. Prevents a 50-row HUD
    when the user has a full constellation catalog
    in the tracker.
  - Tracking-info popup falls back to `info.ra` /
    `info.dec` when none of the `*Reading` fields
    exist (the path stars now take).
- **Revert:** `git checkout v-s000474 -- .`

## S476 — Tracking-info pop-up moved to left

- **Date:** 2026-04-26
- **Files changed:** `css/styles.css`.
- **Change:**
  - `#tracking-info-popup` repositioned from
    `top: 12px / right: 12px` to
    `top: 12px / left: 12px`. `z-index: 12` already
    lifts it above `#hud` and `#tracker-hud`, so it
    overlays the existing left-edge HUDs when a body
    is selected.
- **Revert:** `git checkout v-s000475 -- .`

## S477 — Tracking-info pop-up: drag handle + minimize, state persisted

- **Date:** 2026-04-26
- **Files changed:** `js/ui/trackingInfoPopup.js`,
  `css/styles.css`.
- **Change:**
  - New `.ti-header` bar with grip handle, body
    name, and minimize button. Pointer-events on the
    header drag the panel; viewport-edge clamping
    keeps it on-screen with an 8 px margin. Clicking
    the `—` / `+` button toggles the
    `minimized` class — `.ti-content` collapses,
    leaving just the header bar.
  - UI state (`{ left, top, minimized }`) is
    persisted in `localStorage` under
    `tracking-info-popup:ui` so position + collapse
    state survive a refresh.
  - When dragging the panel sets
    `right: auto` so the explicit `left/top` take
    over from the default upper-left anchor.
- **Revert:** `git checkout v-s000476 -- .`

## S478 — Tracking-info pop-up: fix drag (window listeners + drop zoom)

- **Date:** 2026-04-26
- **Files changed:** `js/ui/trackingInfoPopup.js`,
  `css/styles.css`.
- **Change:**
  - Drag rewritten: listeners moved from `elHeader`
    to `window` for `pointermove` /
    `pointerup` / `pointercancel`. Pointer capture
    dropped — the previous setup captured to
    `panelEl` while listeners lived on `elHeader`,
    so move events never fired. Drag also snapshots
    `panelEl.offsetLeft` / `offsetTop` at mousedown
    rather than using `getBoundingClientRect`, so
    intermediate state can't desync.
  - Removed `zoom: var(--ui-zoom)` from
    `#tracking-info-popup`. The `zoom` property
    scaled the visible panel but `offsetLeft` /
    `clientX` measure in different unit systems,
    making the drag math jittery. Panel sizes are
    already explicit so the viewport-zoom scaling
    isn't needed here.
- **Revert:** `git checkout v-s000477 -- .`

## S479 — Tracking-info default position; moon-phase comment audit

- **Date:** 2026-04-26
- **Files changed:** `css/styles.css`,
  `js/core/app.js`.
- **Change:**
  - `#tracking-info-popup` default position moved from
    `top: 12 / left: 12` to `top: 220 / left: 12` so
    it lands underneath the existing
    `Live Moon Phases` / `Live Ephemeris Data` HUD on
    first paint instead of overlapping it. User-set
    drag position from `localStorage` still wins on
    subsequent loads.
  - Moon-phase audit: calc is geocentric apparent
    direction-only — `SunCelestCoord` and
    `MoonCelestCoord` are unit vectors from
    `equatorialToCelestCoord(geocentric_apparent_RA_Dec)`,
    no AU / heliocentric distance involved. Even
    when `BodySource = 'heliocentric'` the moon is
    routed through `helio.bodyGeocentric` which
    returns geocentric. Sun-at-infinity approximation
    introduces ~0.5° error max (parallax sin(0.0026)).
    Comment at `app.js:706` had the
    "0=new, π=full" labels inverted — the math
    actually gives `0=full, π=new`. Comment
    rewritten to match.
- **Revert:** `git checkout v-s000478 -- .`

## S480 — Remove HelioC BodySource option

- **Date:** 2026-04-26
- **Files changed:** `js/ui/controlPanel.js`,
  `js/core/app.js`.
- **Change:**
  - `BodySource` dropdown: `heliocentric` row removed.
    `EPHEM_NAMES` table drops the entry. The
    `'HelioC'` label was misleading anyway —
    `bodyRADec` already routed
    `helio.bodyGeocentric` and returned geocentric
    apparent positions.
  - `app.update`:
    - Stops computing `helioReading` for sun, moon,
      and planets in `c.TrackerInfos`. Saves five
      `bodyGeocentric` calls per frame across the
      Helio (Schlyter Kepler) pipeline.
    - `activeEph` dispatch trims the
      `bodySource === 'heliocentric'` branch.
    - `bodySource` resolution adds a legacy migration
      so any persisted `'heliocentric'` value silently
      maps to `'geocentric'` on load.
    - `ephHelio` import dropped.
  - `buildTrackerHud`: removed the `Helio :` line
    from each block (template + render path).
- **Revert:** `git checkout v-s000479 -- .`
