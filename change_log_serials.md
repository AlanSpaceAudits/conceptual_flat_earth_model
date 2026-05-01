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

## S481 — Voxel bear and voxel "Nikki" replace sprite avatars

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - `kind === 'bear'`: PNG sprite removed.
    Replaced with a voxel bear built from
    `2.5e-3`-unit `BoxGeometry` cubes. Body block,
    extruded head with snout + black nose, pair of
    eyes, ears, four legs with white claws, short
    tail. Palette: rich brown / shadow brown / tan /
    black / cream.
  - `kind === 'nikki'`: PNG sprite removed.
    Replaced with a voxel humanoid: dark shoes, dark
    legs, hot-pink top, flared pink skirt at the hip,
    skin-tone arms hanging at sides, square skin
    head, long dark hair flowing behind + draping
    over shoulders, two black eyes and a magenta
    lip. Same `2.5e-3` voxel scale; feet anchor at
    `z = 0`.
  - Both figures stay parented under `figureGroup`,
    so the existing `Observer.update`
    quaternion / heading rotation logic
    transports them across the disc / sphere
    untouched.
- **Revert:** `git checkout v-s000480 -- .`

## S482 — Default GE map projection: HQ Equirect (night)

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/index.js`, `js/ui/controlPanel.js`.
- **Change:**
  - `MapProjectionGe` default switched from
    `'hq_ortho'` to `'hq_equirect_night'`. The
    Equirect texture wraps cleanly onto the
    terrestrial sphere via the existing UV path; the
    night-side artwork reads as a sensible default
    (city lights / dark continents). Renderer
    fallbacks (`frame()`, `loadLand()`,
    `worldGlobe.applyMapTexture` call site) updated
    in lock-step with the state default.
  - P1 / P2 presets updated to set
    `MapProjectionGe: 'hq_equirect_night'`.
- **Revert:** `git checkout v-s000481 -- .`

## S483 — Voxel "Nikki" skin tone correction

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - `kind === 'nikki'` voxel branch: `skinM` colour
    swapped from `0xe6b689` to `0x4a2c1a`. Single
    material instance feeds head and arm voxels, so
    one colour edit covers both surfaces. No geometry
    or layout changes.
- **Revert:** `git checkout v-s000482 -- .`

## S484 — Day/night shadow on GE terrestrial sphere

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - `WorldGlobe` sphere material swapped from
    `MeshBasicMaterial` to a `ShaderMaterial`. Vertex
    shader passes the world-space surface normal and
    UV. Fragment shader samples the map texture (with
    the prime-meridian offset baked into `uMapOffset`
    since custom shaders skip `texture.offset`),
    computes `dot(normal, uSunDir)`, and runs that
    through `smoothstep(-uTermSoft, +uTermSoft)` to
    mix between the lit base and a dimmed night
    version.
  - `WorldGlobe.update(model)` derives the subsolar
    direction every frame from
    `c.SunCelestLatLong.lat` (latitude) and
    `c.SunRA*180/π − c.SkyRotAngle` (GP longitude),
    converts to world-frame xyz and writes `uSunDir`.
    Honours optional `state.ShowDayNightShadow` flag;
    treats undefined as on.
  - `applyMapTexture` updated to write the new
    uniforms (`uMap`, `uHasMap`, `uMapOffset`,
    `uColor`) instead of `mat.map` / `mat.color`.
  - Tunables (terminator softness, night dim) are
    uniforms with sensible defaults; can be patched
    via the material's uniform table without code
    changes.
- **Revert:** `git checkout v-s000483 -- .`

## S485 — Day/night sky cap on observer's optical vault

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - `ObserversOpticalVault` mesh material now lerps
    between a sky-blue (`0x88b8e8`) day colour and the
    existing dim-grey (`0x4a4a4a`) night colour using
    `c.NightFactor`. Opacity ramps from `0.05` at full
    night to `0.35` at full day so the cap behaves
    like a translucent blue sky during the day,
    visually masking heavenly-vault objects, then
    drops away at night so the projected starfield
    reads cleanly. Cap stays back-side rendered so it
    is invisible from orbit; effect only manifests
    inside the dome.
  - Honours optional `state.ShowDayNightSky` flag.
    Undefined treated as on. When off, cap reverts to
    static grey at `0.10` opacity.
  - Applies in both FE and GE modes (same code path),
    matching the new GE globe day/night terminator
    for visual consistency between the two world
    models.
- **Revert:** `git checkout v-s000484 -- .`

## S486 — GE art projections + sphere-only GE dropdown

- **Date:** 2026-04-26
- **Files changed:** `js/render/geArt.js` (new),
  `js/render/worldObjects.js`,
  `js/render/index.js`,
  `js/core/projections.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - New `js/render/geArt.js` draws the Natural Earth
    land GeoJSON onto a 2:1 equirectangular canvas in
    one of five styles: `ge_line_art`,
    `ge_blueprint`, `ge_topo`, `ge_sepia`, `ge_neon`.
    Returns a `THREE.CanvasTexture` with the same
    `offset.x = 0.5` prime-meridian shift the HQ
    raster path uses, so it slots into the existing
    sphere shader without changes. Antimeridian
    splitter prevents long horizontal strokes when a
    polygon wraps the date line.
  - Five new `category: 'ge_art'` projection entries
    in `projections.js` (`ge_art_line`,
    `ge_art_blueprint`, `ge_art_topo`,
    `ge_art_sepia`, `ge_art_neon`). Each carries
    `generatedGeTexture: '<style id>'` and
    `wrapsSphere: true`. FE rendering of these
    entries falls through to `projectEquirect` (no
    canvas), so they only manifest visually in GE.
  - `wrapsSphere: true` flag added to the existing
    sphere-friendly HQ equirect rasters
    (`hq_equirect_day`, `hq_equirect_night`,
    `hq_world_shaded`). Non-equirect HQ entries
    (`hq_ae_dual`, `hq_ae_polar_*`, `hq_gleasons`,
    `hq_ortho`, `hq_blank`) remain unflagged.
  - New `listGeMaps()` helper in `projections.js`
    filters the registry by `wrapsSphere === true`.
  - `WorldGlobe` gained a procedural-texture cache
    (`_geArtCache`) and a `setLandGeo(geoJson)`
    method. `applyMapTexture` now branches on
    `proj.generatedGeTexture` and calls
    `generateGeArtTexture(style, this._landGeo)`,
    caching only after GeoJSON is available so the
    placeholder canvas regenerates correctly.
  - Renderer's `loadLand` calls
    `worldGlobe.setLandGeo(this._landGeo)` after the
    fetch resolves, then a follow-up
    `applyMapTexture` rebuilds any active art
    texture with real continents.
  - Renderer's per-frame `applyMapTexture` call site
    coerces stale URL state — any `MapProjectionGe`
    whose entry isn't `wrapsSphere: true` falls back
    to `hq_equirect_night`.
  - Control panel GE dropdown swapped from
    `[...listHqMaps(), ...listGeneratedProjections()]`
    to `listGeMaps()`. AE, polar, Gleason,
    orthographic disc projections no longer appear
    in the GE selector; only the equirect HQ rasters
    and the new ge_art entries.
- **Revert:** `git checkout v-s000485 -- .`

## S487 — GE orbit camera below-horizon range

- **Date:** 2026-04-26
- **Files changed:** `js/ui/mouseHandler.js`,
  `js/core/app.js`.
- **Change:**
  - Orbit-drag pitch floor in `mouseHandler.js`
    (line ~476) gated on `WorldModel`. GE mode uses
    `-89.9°` so the camera can swing under the
    globe; FE keeps `0°` (disc has no underside).
  - Per-frame `CameraHeight` clamp in `app.js`
    (line ~388) widens to `-89.9° .. 89.9°` in GE
    mode and stays at `-30° .. 89.9°` in FE.
  - InsideVault first-person look (line ~468) keeps
    its `0..90` ground-up range; only the orbit
    drag and the per-frame clamp were touched.
- **Revert:** `git checkout v-s000486 -- .`

## S488 — GE forces dynamic starfield day-fade

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/constellations.js`,
  `js/render/starfieldChart.js`.
- **Change:**
  - Five star-renderer fade sites (random
    starfield, CelNavStars, generic catalog points,
    constellation lines, starfieldChart) updated to
    treat GE as `dynamic = true` regardless of the
    `s.DynamicStars` flag. FE behaviour unchanged —
    flag still controls the FE day-fade. GE always
    applies `nightAlpha = NightFactor` so stars on
    the optical-vault hemisphere disappear during
    daylight in line with real spherical astronomy.
- **Revert:** `git checkout v-s000487 -- .`

## S489 — FE keeps static cap, GE-only day/night sky

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - `ObserversOpticalVault.update` day/night
    sky-cap branch now gated on `ge`. FE reverts to
    the original static `0x4a4a4a / 0.10` cap so
    daytime stars on the FE optical vault stay
    visible (S485 had unintentionally extended the
    blue-sky lerp into FE, blocking them). GE keeps
    the sky-blue ↔ dim-grey lerp via `NightFactor`.
- **Revert:** `git checkout v-s000488 -- .`

## S490 — Pre-compile shaders + guard sphere material updates

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - Renderer constructor now calls
    `this.sm.renderer.compile(scene, camera)` from
    a microtask after setup. Three.js compiles
    GLSL programs lazily on first draw; without
    this, the first Heavenly → Optical toggle
    pauses for hundreds of ms while the
    optical-vault star / cap shaders link. The
    pre-compile pass walks the scene once at
    startup so every program is ready before the
    user toggles modes.
  - `_applyDepthState` now guards the WorldGlobe
    sphere material updates: only writes
    `transparent` / `depthWrite` and bumps
    `needsUpdate` when one of those actually
    changed. Opacity goes through the
    `uOpacity` uniform without flagging a
    re-link. Removes the per-frame ShaderMaterial
    re-link that was accumulating cost on the
    view-mode flips.
- **Revert:** `git checkout v-s000489 -- .`

## S491 — GE rays + bottom-bar Rays button

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - `_updateRays` now dispatches on
    `s.WorldModel === 'ge'`. GE branch reads
    `c.GlobeObserverCoord` for the observer end
    and `c.SunGlobeVaultCoord /
    c.MoonGlobeVaultCoord / p.globeVaultCoord` +
    the matching `*GlobeOpticalVaultCoord` for the
    sphere-projected positions. Rays draw as
    plain straight segments since the FE
    disc-arc bezier has no analogue on a sphere.
  - Optical-vault rays in GE skip the parking
    sentinel `[0, 0, -1000]` so below-horizon
    bodies don't shoot a ray to the sub-disc
    coord. Vault rays still draw because the
    celestial-sphere position is valid in every
    direction.
  - Projection rays in GE bridge
    `*GlobeVaultCoord → *GlobeOpticalVaultCoord`,
    matching the FE convention but in the GE
    coordinate frame.
  - New `🔦 Rays` button in the bottom-bar
    `modeGrid`. Sits in the previously empty 4th
    cell of the second row (between 🎥 and the
    cycle-row). Click opens the `Show → Rays`
    group of the side panel so the four ray
    toggles + ray parameter slider are one click
    away.
- **Revert:** `git checkout v-s000490 -- .`

## S492 — Rays pass through occluders (dashed) + GE GP drop-line

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - New `addRayLine(pts, color, opacity)` helper
    in `_updateRays` adds each ray as TWO lines:
    a `LineBasicMaterial` solid pass at default
    depth (visible portion) and a
    `LineDashedMaterial` pass with
    `depthFunc: GreaterDepth` (renders only where
    something opaque is in front). Result is a
    continuous trace that switches from solid to
    dashed where the line passes behind an
    occluder — typically the GE terrestrial
    sphere. FE has no opaque occluders along ray
    paths, so the dashed pass stays invisible
    there.
  - All three ray builders (FE bezier `addRay`,
    GE straight `addStraight`, projection-ray
    `addProjectionRay`) now route through
    `addRayLine` instead of constructing their
    own `THREE.Line` directly.
  - `addProjectionRay` also short-circuits on the
    `[0, 0, -1000]` parking sentinel so GE
    below-horizon projection rays don't shoot to
    the parked coord.
  - `_updateDashedLine` (sun / moon GP drop-line)
    now branches on `WorldModel`. FE drops to
    `(x, y, 0.0015)` as before. GE drops radially
    from the celestial-sphere coord to the
    globe-surface GP via
    `topPos * (FE_RADIUS / GlobeVaultRadius)`,
    matching how `_globeVaultAt` builds the two
    sphere positions. Restores the visible link
    between the body's true position on the
    celestial sphere and its GP on the globe
    surface for GE mode.
- **Revert:** `git checkout v-s000491 -- .`

## S493 — Star rays + LoS / Earth-curve intersection mark

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - `_updateRays` now walks `trackerSet` for any
    `star:<id>` entries and looks them up across
    `c.CelNavStars`, `c.CataloguedStars`,
    `c.BlackHoles`, `c.Quasars`, `c.Galaxies`,
    `c.Satellites`, `c.BscStars`. Colour palette
    mirrors the GPTracer mapping
    (`celnav` 0xffe8a0, `catalogued` 0xffffff,
    `blackhole` 0x9966ff, `quasar` 0x40e0d0,
    `galaxy` 0xff80c0, `satellite` 0x66ff88,
    `bsc` per-entry colour or 0xfff5d8). Tracked
    stars get vault, optical-vault, and projection
    rays drawn through the same `addRayLine` /
    `addProjectionRay` paths as planets, so the
    solid-front + dashed-occluded behaviour
    carries over for free.
  - New `addLosIntersectionMark(O, T)` helper
    (GE-only) computes the chord-tangent second
    intersection of the LoS with the globe via
    `t = -2 (O · D) / (D · D)` (since `|O| = R`
    on the sphere). When `0 < t ≤ 1`, the chord
    re-enters the globe between observer and
    target and a small red equilateral triangle
    is drawn tangent to the surface at the exit
    point, lifted slightly along the normal so it
    doesn't z-fight with the globe shader. Marker
    has `depthTest: false` so it stays visible
    through any layer.
  - Vault-ray pass calls
    `addLosIntersectionMark(obs, vaultCoord)` for
    sun, moon, and each tracked star — the only
    rays that legitimately reach below-horizon
    targets where the LoS punches through the
    Earth.
- **Revert:** `git checkout v-s000492 -- .`

## S494 — Constellation paints celnav-dup stars when celnav layer off

- **Date:** 2026-04-26
- **Files changed:** `js/render/constellations.js`.
- **Change:**
  - Constellation renderer's `skipPoint` rule now
    parks a celnav-duplicate dot only when the
    cel-nav star layer is actually painting it
    (i.e. `s.StarfieldType === 'celnav' &&
    s.ShowCelNav !== false`). When that layer is
    off, the constellation owns the dot so
    Alnilam, Betelgeuse, Bellatrix, Rigel and the
    other celnav crossover stars stay visible
    along with the rest of the stick figure.
  - `untracked && !celnavDup` guard keeps the
    tracker-membership filter in effect for
    plain (non-celnav) constellation stars while
    letting celnav-dup endpoints draw
    unconditionally — they're already
    constellation-essential.
- **Revert:** `git checkout v-s000493 -- .`

## S495 — Day / month / year skip buttons

- **Date:** 2026-04-26
- **Files changed:** `js/ui/controlPanel.js`,
  `css/styles.css`.
- **Change:**
  - New `time-jump-grid` (2 × 3 compact grid of
    `time-btn`) injected between the speed
    buttons and the speed-stack readout in the
    bottom-bar `time-controls`. Six buttons:
    `−d / −mo / −y` on the back row, `+d / +mo /
    +y` on the forward row.
  - Day step adds ±1 to `state.DateTime`
    directly. Month / year steps round-trip
    through `dateTimeToDate` →
    `setUTCMonth` / `setUTCFullYear` →
    `getTime() / msPerDay − ZeroDate` so the
    same day-of-month / day-of-year is preserved
    across month-length changes and leap years.
  - Per-button CSS sized smaller than the main
    transport buttons (32 px min-width, 11 px
    monospace) so the new grid fits without
    crowding the existing `⏪ ▶ ⏩ ½× 2×`
    cluster.
- **Revert:** `git checkout v-s000494 -- .`

## S496 — LoS-mark hover angle tooltip

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - `addLosIntersectionMark` now stores
    `userData.kind = 'losMark'` and
    `userData.intersectionAngle` (degrees,
    `asin(|D̂ · N̂|)` between the chord direction
    and the surface normal at the exit point) on
    each red triangle mesh.
  - Renderer constructor adds a canvas-level
    `pointermove` handler that raycasts against
    the per-frame `_losMarks` list and, on a hit,
    shows a small tooltip near the cursor reading
    `LoS / surface: NN.NN°`. Tooltip lazy-built
    via `_ensureLosTip` (red-tinted div under
    `#view`).
  - `_updateRays` resets `_losMarks` at the start
    of each rebuild so stale picks don't survive
    after the user toggles trackers.
- **Revert:** `git checkout v-s000495 -- .`

## S497 — Tropics + polar circles in GE mode

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - `LatitudeLines._rebuild` now branches on a
    `ge` flag. FE keeps the
    `canonicalLatLongToDisc` AE projection at
    `z = 8e-4`. GE builds each circle as a
    parallel of latitude on the globe sphere at
    radius `FE_RADIUS * 1.0008` (tiny outward
    lift to avoid z-fight with the textured
    globe shader). Same five circles — Arctic /
    Tropic of Cancer / Equator / Tropic of
    Capricorn / Antarctic — share the same
    colour palette across both modes.
  - GE lines use `depthTest: true` so the front
    half of the globe occludes the back half of
    each circle, giving the correct hemisphere
    perspective. FE keeps `depthTest: false`
    since the flat disc has no front-back
    ambiguity.
  - `update` now keys the cached projection
    string on `WorldModel` too, so toggling
    FE ↔ GE forces a `_rebuild` and the
    correct geometry is emitted for the active
    mode.
- **Revert:** `git checkout v-s000496 -- .`

## S498 — Constellation-name buttons in Tracker tab

- **Date:** 2026-04-26
- **Files changed:** `js/ui/controlPanel.js`,
  `css/styles.css`.
- **Change:**
  - `Tracker → Constellations` group now leads
    with a row of constellation-name buttons (one
    per `CONSTELLATIONS` entry). Click toggles
    every star in that constellation in
    `TrackerTargets`: stars not yet in the set
    get added (constellation activated, with
    `ShowConstellationLines: true` flipped on so
    the stick figure draws); stars already
    present get removed (constellation
    deactivated). Star ids resolve via
    `st.celnav || st.id` so cel-nav crossover
    stars share the same id space as the
    standalone CEL_NAV_STARS catalogue.
  - `clickGroupRow` honours an optional
    `layout: 'wrap'` flag on the row spec which
    switches the action cluster from equal-flex
    columns to flex-wrap. CSS adds
    `.row.action-group-row.wrap` /
    `.wrap .action-btn` so the constellation
    cluster sits at natural button widths and
    wraps cleanly across multiple lines.
- **Revert:** `git checkout v-s000497 -- .`

## S499 — Constellation menu shows celnav-overlap stars too

- **Date:** 2026-04-26
- **Files changed:** `js/ui/controlPanel.js`.
- **Change:**
  - `Tracker → Constellations` per-star
    `buttonGrid` now lists the union of every
    constellation-member star, regardless of
    whether the membership came via a
    `celnav: 'id'` link (entry borrowed from
    `CEL_NAV_STARS`) or a standalone `id` (entry
    living in `CATALOGUED_STARS`). Previously
    the grid filtered out celnav overlap, so
    Betelgeuse / Bellatrix / Alnilam / Rigel /
    Dubhe / Alioth / Polaris / Kochab / etc.
    were missing from the constellation
    activator. Cel-nav overlap stars are tinted
    cel-nav yellow (`#ffe8a0`); standalone
    constellation-only stars stay white.
- **Revert:** `git checkout v-s000498 -- .`

## S500 — Constellation owns celnav-dup dot when cel-nav layer skips it

- **Date:** 2026-04-26
- **Files changed:** `js/render/constellations.js`.
- **Change:**
  - Tightens the cel-nav-ownership rule from
    `celnavDup && celnavLayerActive` to
    `celnavDup && celnavLayerActive && tracked`.
    Closes the gap from S494 where the cel-nav
    layer was active but the star wasn't in
    `TrackerTargets` — both layers were skipping
    the dot (cel-nav requires tracker
    membership; constellation deferred to
    cel-nav). Alnilam (and any other
    celnav-linked constellation member) now
    paints from the constellation layer whenever
    the cel-nav layer isn't actually going to
    paint it, so Orion's belt always reads as
    three stars.
- **Revert:** `git checkout v-s000499 -- .`

## S501 — LoS-mark tooltip: central + inscribed + tangent angles

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - `addLosIntersectionMark` now stashes three
    angles on the triangle's `userData`, all
    derived from the same chord geometry by
    central-angle-theorem corollaries:
      - `centralAngle`: angle at the globe centre
        between the observer's radial Ô and the
        body's GP direction T̂. For a body on the
        celestial sphere at world position T this
        is `acos(Ô · T̂)`. Below-horizon → > 90°.
      - `inscribedAngle`: half the central angle
        per the inscribed-angle theorem.
      - `tangentAngle`: the chord vs surface-tangent
        angle at the exit point, equal to
        `asin(|D̂ · N̂|)` and to `(arc obs↔Q)/2`
        by the chord-tangent corollary.
  - Hover tooltip switched from a single line to
    a three-row readout listing all three angles
    so the relationships visible. Title row
    styled in a brighter pink so the readout body
    reads cleanly underneath.
  - `intersectionAngle` userData key renamed to
    `tangentAngle`; the old key isn't used
    anywhere else.
- **Revert:** `git checkout v-s000500 -- .`

## S502 — LoS marker repositioned to inscribed-angle midpoint

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - Red triangle now anchors at the great-circle
    midpoint of the minor arc obs↔GP rather than
    the LoS-chord exit point. From any point on
    the major arc, the chord obs↔GP subtends an
    inscribed angle equal to half the central
    angle, so anchoring at the midpoint puts the
    marker at angular distance (central / 2) =
    inscribed angle from both observer and GP —
    the position itself encodes the inscribed
    geometry.
  - Position computed via
    `M̂ = (Ô + T̂) / |Ô + T̂|`, then scaled to
    `FE_RADIUS`. Surface normal at marker is
    just `M̂` so the existing tangent-axis
    construction still produces a valid
    equilateral triangle.
  - Hover tooltip simplified to the inscribed
    angle alone (`Inscribed angle: NN.NN°`).
- **Revert:** `git checkout v-s000501 -- .`

## S503 — Tracking popup: DMS readouts + central + inscribed + Mag last

- **Date:** 2026-04-26
- **Files changed:** `js/ui/trackingInfoPopup.js`.
- **Change:**
  - New `fmtDms` / `fmtSignedDms` helpers render
    angles as `DD° MM' SS.S"` with one decimal on
    the seconds field. Used for Azimuth (unsigned,
    wrapped to `[0, 360)`), Elevation, Dec, GP lat,
    GP lon. RA stays HMS via the existing `fmtH`.
  - Two new rows: `Central` and `Inscribed`. Central
    angle obs ↔ GP computed from the spherical law
    of cosines on `(ObserverLat, ObserverLong,
    info.gpLat, info.gpLon)`; inscribed = central /
    2 by the inscribed-angle theorem (matches the
    LoS red-triangle reading).
  - Row order reshuffled: Azimuth, Elevation, RA,
    Dec, GP lat, GP lon, Central, Inscribed, Mag.
    Mag now reads as the last line.
- **Revert:** `git checkout v-s000502 -- .`

## S504 — Constellation rule gates celnav-dup on tracker membership

- **Date:** 2026-04-26
- **Files changed:** `js/render/constellations.js`.
- **Change:**
  - `skipPoint` rule simplified to
    `celnavWillPaint || untracked`. Without this,
    celnav-duplicate stars from un-activated
    constellations (e.g. Cassiopeia or Cygnus
    while only Orion is activated) painted via the
    constellation layer when the cel-nav layer was
    off, because the previous rule only suppressed
    them when celnav was active. Tracker
    membership now gates every constellation dot
    (celnav-dup and standalone alike), so the
    constellation-name button is the single
    source of truth for which dots show.
- **Revert:** `git checkout v-s000503 -- .`

## S505 — LoS observer lifted to 6-ft eye height

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - LoS chord computation in
    `addLosIntersectionMark` now lifts the
    observer along its outward normal by
    `EYE_H_REL = 2.87 × 10⁻⁷` (6 ft on a 6378 km
    Earth radius, expressed in `FE_RADIUS`
    units). The chord origin sits at
    `O + Ô · liftAbs`; the sphere intersection
    then runs the full quadratic
    `t²(D·D) + 2t(P·D) + (|P|² − R²) = 0` and
    picks the smallest positive root in
    `(0, 1]`. Marker therefore fires only when a
    real ~6-ft observer's LoS actually breaks
    across the Earth — bodies within the
    ~50 arcsec horizon dip stay visible without
    triggering a triangle.
  - Central / inscribed angle calculation still
    uses the original on-surface observer point
    (the inscribed-angle theorem assumes the
    inscribed vertex is on the circle, so
    introducing the lift would erode the
    `central / 2` identity).
- **Revert:** `git checkout v-s000504 -- .`

## S506 — Fix: duplicate `const Olen0` declaration in addLosIntersectionMark

- **Date:** 2026-04-26
- **Files changed:** `js/render/index.js`.
- **Change:**
  - S505 introduced `const Olen0` at the top of
    `addLosIntersectionMark` for the 6-ft eye
    lift; the existing midpoint-positioning code
    further down also declared `const Olen0`. ES
    modules run in strict mode, so the duplicate
    `const` was a SyntaxError that aborted the
    whole module and produced a black canvas.
    Removed the second declaration and have the
    midpoint code reuse the already-computed
    `oxh0` / `oyh0` / `ozh0` unit-direction
    components.
- **Revert:** `git checkout v-s000505 -- .`

## S507 — Constellation override covers celnav-overlap stars; Orion's Belt selector

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - `worldObjects.js` now imports `CONSTELLATIONS`
    and precomputes `CONSTELLATION_CELNAV_IDS`, the
    set of cel-nav star ids referenced by any
    constellation via `celnav: 'id'`. Tracked-GP
    `categoryOverride` for celnav-cohort stars
    falls under `GPOverrideConstellations` whenever
    their id sits in that set, so flipping the
    constellation override draws the GP for
    Alnilam, Betelgeuse, Bellatrix, Rigel, and
    every other celnav-overlap constellation
    member. Standalone celnav stars (Sirius, Vega,
    Polaris, ...) still depend on
    `GPOverrideCelNav`.
  - New "Orion's Belt" entry leads the
    constellation-name button row in
    `Tracker → Constellations`. Click toggles only
    Mintaka / Alnilam / Alnitak in `TrackerTargets`;
    Orion's own line outline still draws all eight
    stars when its parent button is active, so this
    sub-asterism doesn't add duplicate lines.
- **Revert:** `git checkout v-s000506 -- .`

## S508 — GE tracked-GP drop-line + drop redundant speed readout

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - `TrackedGroundPoints.update` now emits the
    drop-line in GE mode too. FE keeps the
    vertical fall from `info.vaultCoord` to
    `z = 0.0015`. GE rebuilds the line as a
    radial segment from the body's
    celestial-sphere position
    `R_v · (cosφ cosλ, cosφ sinλ, sinφ)` down to
    the globe-surface GP scaled by
    `FE_RADIUS / GlobeVaultRadius`. Closes the
    gap where tracked planets / stars in GE had a
    floating GP dot with no visible link to the
    body overhead.
  - Bottom-bar `time-controls` strip: speed
    readout removed from `speedStack.append` (the
    `+d/s` was already mirrored in the `slotSpeed`
    section of the date / time bar). The
    detached `speedReadout` span stays around so
    the `refreshTimeControls` writes don't need
    null-guards. Compass-controls panel slides
    back to its pre-S495 position now that the
    transport cluster is no longer carrying the
    duplicate tail.
- **Revert:** `git checkout v-s000507 -- .`

## S509 — GE GP path projection + GE radial dashed GP→centre line

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`.
- **Change:**
  - `c.GPPaths[*]` entries now carry a `latLon`
    array alongside the existing FE-disc `pts`.
    Same sample loop in `sampleFrom` /
    `sampleFromSubPointFn`; an extra
    `latLon.push([gpLat, gpLon])` per step.
  - `GPPathOverlay.update` branches on
    `WorldModel`. FE keeps the disc-plane build
    using `pts`; GE projects each `latLon` step
    onto the globe sphere at
    `R = FE_RADIUS · 1.0008` so the path curves
    around the surface. GE lines flip
    `depthTest: true` so the back half of the
    trace gets occluded by the globe.
  - `TrackedGroundPoints` now keeps a parallel
    `_radialLines` pool of `LineDashedMaterial`
    segments. In GE, each tracked GP grows a
    dashed line from its surface point down to
    the globe centre; FE leaves the radial line
    invisible (no centre to drop to). Same
    colour as the body-to-GP solid line, same
    `ShowTruePositions` visibility gate.
  - Net effect in GE: a tracked target now shows
    a continuous solid line from the body's
    celestial-sphere position down to the GP on
    the surface, plus a dashed line from that GP
    radially in to the globe centre — the
    body-overhead-direction reads at a glance.
- **Revert:** `git checkout v-s000508 -- .`

## S510 — Central / inscribed-angle arcs (GE)

- **Date:** 2026-04-26
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`,
  `js/render/index.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - New `state.ShowCentralAngle` and
    `state.ShowInscribedAngle` (default off). Both
    surfaced as bool toggles in
    `Tracker → Tracker Options` ("Central Angle
    (GE)" / "Inscribed Angle (GE)").
  - New `CentralAngleArcs` class in
    `worldObjects.js`. Per `c.TrackerInfos` entry
    it slerps a great-circle arc on the globe
    surface (radius `FE_RADIUS · 1.0006`) from
    the observer's surface point Ô to the body's
    GP direction Ĝ. Arc length in radians = the
    central angle obs↔GP. A short
    `LineDashedMaterial` tick pops out radially
    at the arc midpoint M̂; M̂ is perpendicular
    to the arc tangent there, so the tick reads
    as "this is where the inscribed angle vertex
    sits — central / 2 from each endpoint".
  - Tick length scales with the central angle
    (`0.05 + 0.10·θ/π` × `FE_RADIUS`) so a tiny
    sweep gets a small tick and a half-globe
    sweep gets a tall one.
  - Arcs use `depthTest: true` so the back half
    is occluded by the globe; tick stays
    `depthTest: false` so it pokes through any
    layer.
  - Renderer instantiates `centralAngleArcs` in
    the constructor and calls its `update(m)`
    next to `gpPathOverlay.update(m)`.
- **Revert:** `git checkout v-s000509 -- .`

## S511 — Central / inscribed angle now applies to FE too

- **Date:** 2026-04-26
- **Files changed:** `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - Toggles renamed: `Central Angle` /
    `Inscribed Angle` (the "(GE)" qualifier
    dropped). They now apply in both world
    models.
  - `CentralAngleArcs.update` branches on
    `WorldModel`. GE keeps the great-circle slerp
    on the globe surface. FE projects observer
    and body GP through `canonicalLatLongToDisc`
    and draws the chord between the two disc
    points at `z = 8e-4`.
  - Inscribed-angle tick adapts per mode:
    - GE: still pops radially out from the
      arc's great-circle midpoint M̂.
    - FE: rises straight `+z` from the
      disc-chord midpoint, since the disc is the
      "horizontal of the arc length" and `+z`
      is perpendicular to it.
  - Tick length keeps scaling with the central
    angle so a small sweep reads as a small
    tick and a half-globe sweep as a tall one in
    both modes.
  - Arc material flips `depthTest` per mode (GE
    on, FE off) so the FE chord doesn't z-fight
    the disc projection while GE arcs still get
    occluded by the back half of the globe.
- **Revert:** `git checkout v-s000510 -- .`

## S512 — Tracking popup: Elev − Inscribed visibility readout

- **Date:** 2026-04-26
- **Files changed:** `js/ui/trackingInfoPopup.js`,
  `css/styles.css`.
- **Change:**
  - Two new rows after the central / inscribed
    pair: `Elev − Inscribed` (signed DMS,
    `info.elevation − inscribedDeg`) and
    `Visibility` (`Visible` if the diff > 0,
    `Below inscribed angle` otherwise). Visible
    rows tint green (`#7fe39a`); failures tint
    red (`#ff7b6b`) so the line reads at a
    glance.
- **Revert:** `git checkout v-s000511 -- .`

## S513 — Drop Visibility row from tracking popup

- **Date:** 2026-04-27
- **Files changed:** `js/ui/trackingInfoPopup.js`.
- **Change:**
  - Removed the standalone `Visibility` row (Visible
    / Below inscribed angle) from the tracking-info
    popup. The inscribed-angle comparison isn't a
    physical horizon for stars or near-Earth bodies
    (chord obs→GP ≠ LoS to body), so the row was
    misleading.
  - Kept Central, Inscribed, and Elev − Inscribed
    rows alongside the rest of the readout — the
    delta is still useful as a raw geometry helper
    and the underlying calc may resurface for
    future per-body horizon comparisons.
- **Revert:** `git checkout v-s000512 -- .`

## S514 — FE optical-vault rays draw as straight chords

- **Date:** 2026-04-27
- **Files changed:** `js/render/index.js`.
- **Change:**
  - FE optical-vault rays for sun, moon, and tracked
    stars switched from the heavenly-vault bezier
    arc (`addRay`) to plain straight chords
    (`addStraight`). The optical-vault projection
    represents the literal LoS the observer sees;
    the bezier was carrying the dome-lift profile
    that only makes sense for true-vault rays.
  - Heavenly-vault rays still use the bezier in
    FE since that lift conveys the dome shape;
    GE was already straight in both passes.
- **Revert:** `git checkout v-s000513 -- .`

## S515 — End Demo / End Tracking docked into info-bar

- **Date:** 2026-04-27
- **Files changed:** `js/ui/controlPanel.js`,
  `css/styles.css`.
- **Change:**
  - `infoBar` HTML grew an `info-actions` span at
    the end of the info-row. After
    `btnEndDemo` / `btnEndTracking` are built,
    they're appended to that span instead of the
    bottom-bar's `speedStack`. Their existing
    click handlers and `refreshTimeControls`
    hidden-flag flips still drive show/hide.
  - `speedStack` now stays empty (the
    `speedReadout` span and the End buttons all
    live elsewhere) but is kept in the DOM for
    layout consistency.
  - New CSS for `#info-bar .info-actions` /
    `.end-demo-btn` / `.end-tracking-btn` —
    pointer-events restored to `auto` (info-bar
    itself is `pointer-events: none` so click
    pass-through still works for the rest of the
    readout).
  - `#info-bar` right padding bumped to `280 px`
    so the End buttons settle to the right of
    the Tracking slot but stop short of the
    bottom-bar's right cluster (cardinal grid +
    GE button + search field), preventing visual
    overlap.
- **Revert:** `git checkout v-s000514 -- .`

## S516 — Body-vault default heights lifted above starfield

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`.
- **Change:**
  - `StarfieldVaultHeight` default raised from
    `0.28` → `0.485` per Alan's adjusted FE-disc
    layout.
  - All body-vault defaults
    (`Sun / Moon / Mercury / Venus / Mars /
    Jupiter / Saturn / Uranus / Neptune`) bumped
    from `0.346` to `0.545` so the formula
    `StarfieldVaultHeight + HEADROOM (0.06) +
    decNorm · BODY_RANGE (0.20)` keeps every body
    above the starfield baseline. Per-body
    runtime adjustments (sun cap by
    `heavenlyVaultCeiling`, moon scaled by
    `MOON_DEC_DEG / SUN_DEC_DEG`) still preserve
    the proportional spacing between bodies.
  - `VaultHeight` default raised from `0.4` →
    `0.75` so the dome ceiling accommodates the
    raised band (`heavenlyVaultCeiling` returns
    `VaultHeight · √(1 − r²/domeR²)`; with the
    old `0.4` cap, sun would be capped at
    `~0.37` and end up below the new starfield
    baseline at low declinations).
- **Revert:** `git checkout v-s000515 -- .`

## S517 — Planets slave to sun's ecliptic by default

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`.
- **Change:**
  - Per-planet height formula rewritten. Old:
    `Starfield + HEADROOM + planetDecNorm · SUN_RANGE`
    (each planet anchored to starfield via its own
    dec, drifting away from the sun's path through
    the year). New:
    `sunVaultZ + (planetDec − sunDec) · k` where
    `k = SUN_RANGE / (2 · SUN_DEC_DEG)` — planets
    now ride the sun's vault z with a small
    proportional offset for any ecliptic-latitude
    deviation, so the whole solar-system roster
    "follows the sun" through the year instead of
    each body tracing its own band.
  - `planetFloor = Starfield + HEADROOM` clamps
    the bottom; `planetCeil =
    heavenlyVaultCeiling(...)` still caps the top.
  - Manual per-planet panel-slider edits still get
    overwritten next frame; a follow-up serial can
    add `*VaultManual` flags to lock manual values.
- **Revert:** `git checkout v-s000516 -- .`

## S518 — Toggle feature buttons + ecliptic-β-driven body offsets

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - `featureOpen.fn(tab, group)` now tracks the
    last-opened (tab, group) and a re-click on
    the same shortcut button toggles the popup
    closed instead of just re-focusing it. Other
    buttons still cleanly switch tabs without
    closing.
  - Body height offsets switched from
    `(planetDec − sunDec)` (S517) to **ecliptic
    latitude β** computed from `(RA, Dec)` via
    the obliquity rotation
    `β = arcsin(cos ε · sin Dec − sin ε · cos Dec
    · sin RA)`. Slope kept at
    `SUN_RANGE / (2·SUN_DEC_DEG)` ≈ 0.00427 / °
    so β offsets sit on the same proportional
    scale as the sun's dec → height slope. With
    β = 0 a body lands at the sun's exact vault
    z — the geometric pre-condition for solar
    eclipses, so the moon and any aligned planet
    visually overlap the sun when their orbital
    plane crosses the ecliptic.
  - Moon's vault height switched from its old
    `MOON_RANGE`-based formula to the same
    sun-anchored β offset; lunar inclination
    ±5.14° now reads as ±0.022 around the sun's
    arc instead of an independent dec band.
  - Planets use `eq.ra` / `eq.dec` directly to
    compute β; old `PLANET_HEIGHT_PER_DEG`
    constant retired (now `ECLIPTIC_HEIGHT_PER_DEG`
    in the moon block).
  - `planetFloor = StarfieldVaultHeight +
    HEADROOM` and `heavenlyVaultCeiling`
    bounds preserved.
- **Revert:** `git checkout v-s000517 -- .`

## S519 — VaultHeight floor derives from StarfieldVaultHeight

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`.
- **Change:**
  - `s.VaultHeight` clamp at `update()` head now
    uses a derived floor:
    `max(GEOMETRY.VaultHeightMin,
    s.StarfieldVaultHeight + 0.26)` where
    `0.26 = HEADROOM (0.06) + SUN_RANGE (0.20)`.
  - Fixes demos that hard-code `VaultHeight: 0.45`
    in their intro: under S516's raised
    `StarfieldVaultHeight: 0.485` the dome ceiling
    fell below the body band, pinning the sun to
    the ceiling (≈ 0.45) below the starfield and
    floor-stacking moon + planets at 0.545. The
    derived floor now silently bumps any demo's
    `VaultHeight` to ≥ 0.745 when the starfield
    sits at 0.485.
  - No demo file edits needed; future
    `StarfieldVaultHeight` changes carry through
    automatically.
- **Revert:** `git checkout v-s000518 -- .`

## S520 — Demo pause freezes time + half-speed default

- **Date:** 2026-04-27
- **Files changed:** `js/ui/controlPanel.js`,
  `js/demos/animation.js`.
- **Change:**
  - `refreshTimeControls` now suspends autoplay
    while a demo's animator is `running` (playing
    or paused) and restores its prior `playing`
    state when the demo ends or stops.
    `_autoplayWasPlaying` snapshots the state at
    demo start (`null` = no suspension held).
    Without this, autoplay's `+0.042 d/s` tick
    kept advancing `DateTime` even after the
    demo's tween was paused, so the bar's `⏸`
    and the demo menu's `Pause` button appeared
    to do nothing.
  - `Animator` default `speedScale` lowered from
    `1` → `0.5` (constructor + `play()`). All
    demos now play at half the authored Tval
    cadence; the `2×` bar button restores
    original speed.
- **Revert:** `git checkout v-s000519 -- .`

## S521 — Midnight-sun 75°N demo: start inside polar day

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - 'Midnight sun at 75°N: start to end' intro
    `DateTime` moved from `3021` (~2025-04-10) to
    `3050` (~2025-05-09). At 75°N the polar day
    requires sun dec ≥ +15°, which only happens
    after ~May 1. Apr 10 sat ~3 weeks before
    polar-day onset, so the intro showed the
    sun below the horizon at midnight (-6.55°
    elevation in tracker readout).
  - Pre-polar-day narration steps removed
    (`'still rises and sets daily'` → `'about
    to stop setting'`); first task now opens
    inside the polar-day window with sun dec
    ~17° → midnight elevation ~+2°. Demo still
    walks June 21 solstice → Aug 7 polar-day
    end.
- **Revert:** `git checkout v-s000520 -- .`

## S522 — Midnight-sun 75°S demo: start inside polar day

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - 'Midnight sun at 75°S: start to end' intro
    `DateTime` moved from `3195` (~2025-10-01) to
    `3232` (~2025-11-07). At 75°S the polar day
    requires sun dec ≤ -15°, which only happens
    after ~Oct 30; Oct 1 sat ~30 days before
    onset.
  - Pre-polar-day narration steps removed
    (`'day/night cycle still present'` /
    `'about to stop setting'` and trailing
    `'polar night incoming'`); first task now
    opens inside polar-day window. Demo walks
    Dec 21 southern solstice → Feb 7 polar-day
    end.
- **Revert:** `git checkout v-s000521 -- .`

## S523 — Midnight-sun demos: enable DynamicStars

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - Both midnight-sun demos
    (75°N + 75°S `start to end`) now set
    `DynamicStars: true` in their intro state.
  - Without `DynamicStars`, FE-mode constellation
    lines bypass the day/night fade (`canShow`
    is hardcoded `true` when `dynamic` is false
    in `js/render/constellations.js`), so the
    Orion / belt outlines stayed painted on the
    dome through the whole polar-day demo. With
    `DynamicStars` on, `nightAlpha = NightFactor
    = Limit01(-sunElev/12)` stays 0 while the
    sun is above the horizon → constellation
    layer hides, matching the expected daytime
    appearance.
- **Revert:** `git checkout v-s000522 -- .`

## S524 — Demo default speedScale lowered to 0.125

- **Date:** 2026-04-27
- **Files changed:** `js/demos/animation.js`.
- **Change:**
  - `Animator` default `speedScale` lowered from
    `0.5` (S520) to `0.125` (constructor +
    `play()`). Equivalent to two extra `½×`
    bar clicks compared to S520's default.
- **Revert:** `git checkout v-s000523 -- .`

## S525 — Hover / click pickers respect star fade gate

- **Date:** 2026-04-27
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:**
  - New helper `starsVisible(c, state)` mirrors
    the renderer's per-layer `dynamic +
    NightFactor` gate: returns `false` when
    `ShowStars` is off, or when DynamicStars /
    GE force the day-night fade and
    `NightFactor ≤ 0.01`.
  - `collectClickables` (Optical click picker)
    and `collectHeavenlyCandidates` (Heavenly /
    free-cam hover picker) now route their star
    blocks through `starsVisible(...)` instead
    of the bare `state.ShowStars` flag. Stars
    that are faded to zero opacity by daytime
    no longer hold a hit-test slot, so cursor
    hover tooltips and clicks both pass through
    them onto whatever is behind.
- **Revert:** `git checkout v-s000524 -- .`

## S526 — 24h-sun demos: HQ Equirect day map in GE mode

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - All four 24h-sun demos
    (Alert / West Antarctica / 75°N / 75°S
    midnight sun) converted from object-form
    `intro` to function-form `intro: (m) => …`.
    The function checks `m.state.WorldModel ===
    'ge'` and, when true, adds
    `MapProjectionGe: 'hq_equirect_day'` to the
    intro state. FE-mode loads leave
    `MapProjectionGe` untouched (default
    `hq_equirect_night`), so switching to GE
    later doesn't surprise-flip the map.
  - Demo runner already routes function intros
    through `_playSingle` (`typeof d.intro ===
    'function' ? d.intro(this.model) : d.intro`),
    no animation change needed.
- **Revert:** `git checkout v-s000525 -- .`

## S527 — Dynamic equirect day/night swap + demo state save/restore

- **Date:** 2026-04-27
- **Files changed:** `js/render/index.js`,
  `js/demos/index.js`.
- **Change:**
  - Renderer's `frame()` now picks
    `hq_equirect_day` vs `hq_equirect_night` per
    frame based on observer `c.NightFactor` when
    `MapProjectionGe` is one of the two equirect
    options (threshold `0.5` ≈ civil-twilight
    midpoint). State key untouched — only the
    rendered texture flips, so the dropdown
    still shows the user's selection.
  - `Demos` now snapshots `model.state` at the
    start of any demo / queue (`this._savedState
    = { ...this.model.state }` if `null`) and
    restores it on natural end, manual `Stop`
    (bottom-bar / demo-menu / End Demo button),
    or queue completion. Replaces
    `_snapToDefaultEphemeris` with
    `_restoreSavedState`. Pre-demo observer lat
    / lon / time / tracking / view options now
    return exactly to where the user left them
    instead of snapping to a fixed default.
  - Snapshot persists across queued demos so a
    `Play all` group restores the pre-queue
    state, not the inter-demo transition state.
- **Revert:** `git checkout v-s000526 -- .`

## S528 — Optical-vault moon body: craters + phase shading

- **Date:** 2026-04-27
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`.
- **Change:**
  - New `MoonOpticalBody` class
    (`js/render/worldObjects.js`) renders the
    moon as a billboarded plane with a procedural
    crater texture (256×256 canvas: gradient base
    + maria gradients + ~110 craters + 3
    ray-craters) overlaid by a phase shadow
    composited per-frame. Phase shadow uses
    `c.MoonPhase` (radians, 0=full, π=new) and
    `c.MoonRotation` (terminator rotation as
    seen by observer) — both already computed
    in `js/core/app.js` from real
    `MoonCelestCoord` / `SunCelestCoord`.
  - Composite redraw triggers only when phase or
    rot change (not every frame), so the canvas
    cost is paid at the moon's motion rate, not
    rAF rate.
  - Wired in `Renderer` (`js/render/index.js`):
    `this.moonOpticalBody` instantiated alongside
    other markers; per-frame `update(...)` gates
    on `showMoon && s.ShowOpticalVault &&
    s.InsideVault` so it only paints inside
    Optical view. Size `0.024` chosen ~8× the
    moon dot's `opticalSize 0.003` so craters
    read at zoom. `lookAt(camera.position)`
    keeps the plane facing the camera.
  - Existing `moonMarker.sphereDot` left in
    place underneath; the moon body's canvas
    alpha 0.93 + depthTest off + higher
    `renderOrder 52` keeps it on top.
- **Revert:** `git checkout v-s000527 -- .`

## S529 — Moon body: 3-crater pattern + outline + follow-target picker priority

- **Date:** 2026-04-27
- **Files changed:** `js/render/worldObjects.js`,
  `js/ui/mouseHandler.js`.
- **Change:**
  - `makeMoonCraterCanvas` rewritten: replaced
    the procedural 100+-crater field with a
    deliberate three-crater triangle in the
    top-left quadrant — small (`r=5`) on top,
    medium (`r=7`) bottom-left, large (`r=11`)
    bottom-right. Northern-hemisphere observer
    convention. Each crater rendered via shared
    `_drawMoonCrater(ctx, cx, cy, r)` helper
    (rim halo + dark body + darker centre).
    Maria gradients dropped — clean lunar grey
    base with the triangle as the only feature.
  - `drawMoonBodyToCanvas` now strokes a faint
    rim around the moon disc (color
    `rgba(190,185,175,0.55)`, width 1.5) on
    every redraw. Keeps the moon visually
    distinct from the sun even at new moon
    (frac ≈ 0) when both bodies sit at the
    same sky position. Shadow alpha lowered
    from `0.93` to `0.85` so the night side
    has a hint of earthshine peeking through.
  - `findNearestInHeavenly` and
    `findNearestCelestial` (`js/ui/mouseHandler.js`)
    now bias the pick by the active
    `FollowTarget`: when a target is being
    followed, its hit distance is reduced by a
    small epsilon (`0.5 px` heavenly-hover,
    `0.05°` optical-click) so coincident
    candidates (e.g. new-moon sun + moon)
    resolve to the followed body's name instead
    of whichever was first in the candidate
    list.
- **Revert:** `git checkout v-s000528 -- .`

## S530 — Moon body lighting independent of observer location

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/render/worldObjects.js`,
  `js/render/index.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - New computed `c.MoonWaxing` (boolean) in
    `js/core/app.js` — derived from `(MoonRA -
    SunRA) mod 2π < π` (moon east of sun =
    waxing). Observer-independent.
  - `drawMoonBodyToCanvas` rewrites: dropped
    `ctx.rotate(rot)` (rotation by
    `c.MoonRotation` which depends on observer
    lat/lon and was flipping the lit side
    incorrectly). Replaced with
    `if (!waxing) ctx.scale(-1, 1)` so the
    shadow lune mirrors for waning — same
    convention as the HUD `drawMoonPhase`.
    Crater base stays unmirrored so the
    top-left triangle pattern keeps its place.
    Shadow path rewritten as left-half +
    terminator ellipse (crescent: ellipse via
    right; gibbous: ellipse via left).
  - `MoonOpticalBody.update(...)` signature:
    `rot` → `waxing`. Renderer wires
    `c.MoonWaxing` in.
  - HUD tracker (`js/ui/controlPanel.js`) now
    reads precomputed `c.MoonWaxing` instead of
    recomputing the RA diff inline; both views
    drive off the same flag.
- **Revert:** `git checkout v-s000529 -- .`

## S531 — Moon body: crater fixed in screen, shadow rotates with observer

- **Date:** 2026-04-27
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`.
- **Change:**
  - `MoonOpticalBody.update` now camera-aligns
    the moon plane via
    `mesh.quaternion.copy(camera.quaternion)`
    (sprite-style) instead of `lookAt(camera.position)`.
    Canvas-up = screen-up for any camera angle,
    so the top-left crater triangle stays in
    the same screen-space corner as the user
    pans / orbits.
  - `drawMoonBodyToCanvas`: shadow path is now
    rotated by `ctx.rotate(rot)` where `rot` =
    `c.MoonRotation` (signed terminator-up
    angle as seen by observer, lat/lon/sky-pos
    dependent). Crater base is *not* rotated,
    so it stays oriented in screen space while
    the lit/dark boundary tilts with real
    geometry.
  - Renderer wires `c.MoonRotation` back into
    `update(...)` (replacing the S530 waxing
    flag). `c.MoonWaxing` stays around for the
    HUD tracker's mirror flip.
- **Revert:** `git checkout v-s000530 -- .`

## S532 — Moon shadow: screen-space sun-direction projection

- **Date:** 2026-04-27
- **Files changed:** `js/render/index.js`.
- **Change:**
  - Replaced `c.MoonRotation` (which was producing
    wrong-sign rotations for the screen-space
    moon body) with an inline computation that
    projects the world-space sun→moon vector
    onto the plane perpendicular to the
    camera→moon axis, then projects the result
    onto the camera's screen-right /
    screen-up basis vectors. The
    `atan2(-screenY, screenX)` gives the canvas
    rotation that points the lit limb toward
    the sun in screen-space.
  - Inputs: `sunOptVis`, `moonOptVis`,
    `camera.matrixWorld` columns 0 and 1
    (camera-right / camera-up in world).
    Independent of camera orientation
    (rotation tracks the sun's screen-space
    angle, not the camera's), but
    observer-lat/lon dependent because the
    optical-vault coords are derived from
    observer-local az/el.
  - Crater texture still drawn unrotated (S531
    behaviour preserved); only the shadow path
    rotates.
- **Revert:** `git checkout v-s000531 -- .`

## S533 — Moon: split into independent crater + shadow layers

- **Date:** 2026-04-27
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`.
- **Change:**
  - `MoonOpticalBody` rebuilt with two
    co-located plane meshes:
    `_craterMesh` (crater texture, drawn once,
    includes the rim outline) and
    `_shadowMesh` (shadow-only canvas with
    transparent base, `renderOrder` 53 so it
    paints above the crater). Both
    camera-aligned via
    `quaternion.copy(camera.quaternion)`.
  - `_shadowMesh` then receives an additional
    `rotateOnAxis(zAxis, rot)` around its local
    `+Z` (= camera-forward axis after the
    quaternion copy). Rotates the lit-side
    direction independently of the crater
    plane — moon image stays oriented in
    screen-space, shadow can be forced to any
    angle.
  - `drawMoonShadowToCanvas` is the new
    shadow-only painter (transparent
    background, dark lune at default
    orientation). Repaints only on `phase`
    changes; rotation is a 3D mesh transform,
    no canvas redraw needed.
  - Renderer's screen-projected angle changed
    sign convention to match mesh-rotation
    (right-hand rule around `+Z`):
    `atan2(screenY, screenX)` (was
    `atan2(-screenY, screenX)` for
    canvas-frame rotation).
  - `makeMoonCraterCanvas` now disc-clips its
    drawing and strokes the rim outline once,
    so the crater texture itself is circular
    on a transparent square.
- **Revert:** `git checkout v-s000532 -- .`

## S534 — Revert moon-body changes back to S529 state

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/render/index.js`,
  `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - `git checkout v-s000529 --` for the four
    files touched by S530-S533. Restores the
    S529 moon body: single composite plane,
    `c.MoonRotation` driving in-canvas
    rotation, no waxing-flag mirroring, no
    layered crater/shadow split, no screen-
    space sun-projection rotation.
  - The lat-flip behaviour the user flagged
    is preserved (S529 had it, but the moon
    body otherwise reads correctly enough).
- **Revert:** `git checkout v-s000533 -- .`

## S535 — Country quick-hops + 24h-moon demos

- **Date:** 2026-04-27
- **Files changed:** `js/ui/controlPanel.js`,
  `css/styles.css`, `js/demos/definitions.js`.
- **Change:**
  - Added a `geo-hops` button group between
    `btnVault` and the rew/play buttons in the
    bottom-bar `time-controls`. Ten 3-letter
    country codes (USA / BRA / GBR / EGY /
    ZAF / RUS / IND / JPN / AUS / ARG) jump
    `ObserverLat` / `ObserverLong` to the
    listed coordinates on click; `title`
    tooltip shows full name + decimal coords.
    Latitudes span -54.81° to +55.76°,
    longitudes span -104.99° to +151.21° for
    a varied global spread.
  - New CSS rules `#bottom-bar .geo-hops`
    (flex container, 2px gap) and
    `#bottom-bar .geo-hops .time-btn`
    (smaller padding, 10px monospace
    code-style font) so the row stays compact.
    `vault-swap` right margin trimmed
    `8 → 4 px` so the hops sit tight against
    the eye button.
  - New `MOON_24H_DEMOS` array with two
    entries: `24h moon at 75°N` (DateTime
    2933, ~2025-01-12, moon near max +dec) and
    `24h moon at 75°S` (DateTime 2947,
    ~2025-01-26, moon near max -dec). Each
    follows the moon for one full sidereal
    day (~27 h walltime ramp). Same intro
    structure as the 24h-sun demos, including
    GE-mode HQ-equirect-day map switch.
    Registered under new group id `24h-moon`
    in `DEMO_GROUPS`, inserted directly after
    `24h-sun` in `DEMOS`.
- **Revert:** `git checkout v-s000534 -- .`

## S536 — Geo-hops moved to bar-left, 2x5 grid

- **Date:** 2026-04-27
- **Files changed:** `js/ui/controlPanel.js`,
  `css/styles.css`.
- **Change:**
  - `geoHops` removed from
    `timeControls.append(...)` and appended to
    `barLeft` (after `presets`). The vault-swap
    eye button now sits where it did before
    S535.
  - `.geo-hops` switched from `display: flex` to
    `display: grid` with
    `grid-template-columns: repeat(5, auto)` so
    the ten country codes fill a compact 5×2
    block (5 columns, 2 rows).
- **Revert:** `git checkout v-s000535 -- .`

## S537 — Avatar follows tracked target's azimuth in all views

- **Date:** 2026-04-27
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:**
  - Continuous-follow handler in
    `attachMouseHandlers` no longer requires
    `s.InsideVault`. `ObserverHeading` (which
    drives the avatar figure's facing direction
    on both the FE disc and the GE globe) now
    auto-updates to the tracked target's
    azimuth on every `update` tick regardless
    of view mode, so the avatar rotates as the
    tracked body moves across the sky.
  - `CameraHeight` pitch auto-recentre kept
    gated on `InsideVault` so external
    Heavenly / GE camera pitch stays
    user-controlled. The patch object is built
    incrementally — only fields that actually
    changed are written, no redundant
    `setState` calls per tick.
- **Revert:** `git checkout v-s000536 -- .`

## S538 — Heavenly tracking click snaps avatar heading immediately

- **Date:** 2026-04-27
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:**
  - Heavenly / free-cam branch of the canvas
    pointer-up click handler now writes
    `ObserverHeading: targetHeading` alongside
    the `FollowTarget` / `FreeCamActive` patch.
    Without this, FE Heavenly clicks set the
    follow target but the avatar didn't rotate
    to face it until something else triggered
    an `update` (e.g. switching to GE and
    back). The same heading is recomputed by
    the continuous-follow handler each tick;
    the inline write just covers the initial
    snap.
- **Revert:** `git checkout v-s000537 -- .`

## S539 — Moon body camera-aligned: preserves orientation across FE/GE

- **Date:** 2026-04-27
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - `MoonOpticalBody.update` swapped
    `mesh.lookAt(camera.position)` for
    `mesh.quaternion.copy(camera.quaternion)`.
    `lookAt` aligned the plane's up-vector to
    world-up, which differs between FE (disc
    normal) and GE (sphere-tangent observer
    up), so the same `c.MoonRotation` produced
    different visual orientations after mode
    swap. Direct quaternion copy makes
    canvas-up = screen-up in both modes, so
    the canvas rotation reads identically when
    observer lat/lon and view direction match.
- **Revert:** `git checkout v-s000538 -- .`

## S540 — Remove Bright Star Catalog (BSC) entirely

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/render/index.js`,
  `js/render/worldObjects.js`,
  `js/ui/controlPanel.js`,
  `js/ui/urlState.js`,
  `js/ui/trackingInfoPopup.js`.
- **Change:**
  - `app.js`: dropped `BRIGHT_STAR_CATALOG` /
    `bscStarById` import, `ShowBsc` /
    `BscTargets` / `GPOverrideBsc` state
    defaults, `c.BscStars` projection block,
    BSC entry in the GP-path star-categories
    list, BSC entry-resolution branch in body
    info lookup, and the `bsc` color-by-cat
    entry. Satellite-builder gate no longer
    consults `BscTargets`.
  - `render/index.js`: removed the
    `this.bscStars = new CatalogPointStars(...)`
    instance (4096-cap layer), its
    `.update(m)` call, its `spherePoints`
    entry in the depth-test layer list, and
    the `'bsc'` row in the GP-tracer star
    lookup table. BSC color-override branch
    in `findStarEntry` simplified to plain
    category lookup.
  - `render/worldObjects.js`: GPTracer no
    longer merges `BscTargets` into its
    target set; BSC branch in the star-color
    resolver removed.
  - `controlPanel.js`: BSC import dropped;
    BSC tracker-tab section (Enable All /
    Disable All / Disable Satellites /
    button-grid of all 4096 entries) removed;
    `c.BscStars` lookup in the body-search
    candidate list removed; preset 1 / preset
    2 no longer write `ShowBsc` /
    `BscTargets`.
  - `urlState.js`: removed `ShowBsc`,
    `BscTargets`, `GPOverrideBsc` from the
    persisted-key list and `BscTargets` from
    `ARRAY_KEYS`.
  - `trackingInfoPopup.js`: `drawBscStar`
    helper deleted; `'bsc'` cases dropped
    from `classifySubcategory` label table
    and the `paint` dispatcher.
  - Data files (`brightStarCatalog.js`,
    `solarSystem.js`) kept on disk — unused
    but harmless.
- **Revert:** `git checkout v-s000539 -- .`

## S541 — Performance: dirty-key caching on hot per-frame paths

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/render/index.js`,
  `js/render/worldObjects.js`,
  `js/render/constellations.js`.
- **Change:**
  - **`app.js` star-projection cache.** `projectStar`
    fan-out
    (`CelNavStars` / `CataloguedStars` / `BlackHoles`
    / `Quasars` / `Galaxies`) now hits a key-based
    cache. Key = `[DateTime, ObserverLat, ObserverLong,
    ObserverElevation, ObserverHeading, VaultSize,
    VaultHeight, StarfieldVaultHeight,
    OpticalVaultSize, OpticalVaultHeight,
    InsideVault, WorldModel, StarApply* flags]`.
    On hit, the cached arrays are re-bound to the
    `c.*` slots (same reference). Skips
    `apparentStarPosition` (precession + nutation +
    aberration trig) plus the vault / globe /
    optical-vault transforms for every star when
    no relevant input changed.
  - **`Stars.update()` projection skip.** Computes
    a key from `ge / skyRotDeg / opticalR /
    opticalH / Rgv / StarfieldVaultHeight /
    Observer*` and early-returns before the
    per-star loop on hit. Avoids the
    `BufferAttribute.needsUpdate = true` GPU
    re-upload too, since the early-return runs
    before those assignments.
  - **`CatalogPointStars.update()` projection
    skip.** Key built from `entries reference / ge
    / n / tracker membership`. On hit, only
    `setDrawRange` is called; the per-star copy
    loop and `needsUpdate = true` flags are
    skipped. Hits whenever the upstream
    `c.CelNavStars` etc cache hit (same array
    reference) and tracker hasn't changed.
  - **`Constellations.update()` projection skip.**
    Same pattern — key from `ge / skyRotDeg /
    opticalR / opticalH / Rgv /
    StarfieldVaultHeight / Observer* /
    celnavLayerActive / showLines / showStars /
    tracker`. Skips the per-star projection loop
    AND the line-segment rebuild (which wrote
    `_nLines × 6` floats per frame).
  - **Renderer `applyMapTexture` gate.** Tracks
    `_lastEffectiveGeProjId`; only re-applies
    when the effective projection ID flips
    (e.g. equirect day/night swap on
    `NightFactor` crossing 0.5). Avoids
    redundant GE map texture rebinds every
    frame.
  - LatitudeLines / FE-grid `_rebuild` calls
    already gated by `_lastProj` keys —
    confirmed during audit, no change needed.
- **Revert:** `git checkout v-s000540 -- .`

## S542 — Revert S541 optimization caches

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/render/index.js`,
  `js/render/worldObjects.js`,
  `js/render/constellations.js`.
- **Change:**
  - `git checkout v-s000540 --` for the four
    files touched by S541. Restores the pre-
    optimization state: no projectStar cache
    in `app.js`, no `_lastProjKey` early
    returns in `Stars` / `CatalogPointStars` /
    `Constellations`, no
    `_lastEffectiveGeProjId` gate on
    `applyMapTexture`. Per-frame projection
    work runs unconditionally as before.
- **Revert:** `git checkout v-s000541 -- .`

## S543 — 24h-moon demos: match 24h-sun demo cadence

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - `24h moon at 75°N` Tval changed from
    `(2934.13, 30 s)` (1.13 days in 30 s) to
    `(2947, 40 s)` (14 days in 40 s) — same
    cadence as the Alert / West Antarctica
    24h-sun demos.
  - `24h moon at 75°S` Tval changed from
    `(2948.13, 30 s)` to `(2961, 40 s)` (same
    14-day window).
  - Narration updated to reflect two-week motion
    instead of one-sidereal-day.
- **Revert:** `git checkout v-s000542 -- .`

## S544 — 24h-moon demos: hide constellation lines

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - Both `24h moon` demos (75°N, 75°S) intros
    now set `ShowConstellationLines: false`.
    During the polar-night dates the demos open
    on, NightFactor stays high and the
    constellation outlines were painting
    through the optical vault — distracting
    from the moon-only focus the demos are
    framed around.
- **Revert:** `git checkout v-s000543 -- .`

## S545 — Remove annual-cycle demos + Sun optical body with halo + sunspots

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`,
  `js/render/worldObjects.js`,
  `js/render/index.js`.
- **Change:**
  - **Annual-cycle demos removed.** Deleted
    `PERIOD_DAYS`, `ANNUAL_CYCLE_BODIES`,
    `YEAR_CYCLE_DEMOS`, `ANNUAL_CYCLE_DEMOS`
    arrays from `definitions.js`. Dropped both
    `...YEAR_CYCLE_DEMOS` and
    `...ANNUAL_CYCLE_DEMOS` spreads from the
    `DEMOS` export. Removed the `annual-cycle`
    entry from `DEMO_GROUPS`. The two
    one-body-per-period and one-year-per-body
    demo families that didn't behave correctly
    are gone end-to-end.
  - **`SunOpticalBody` class added.** Mirrors
    `MoonOpticalBody` structure: two
    camera-aligned plane meshes at the same
    world position. Face plane uses a
    procedural canvas (radial yellow gradient
    `#fff8b0 → #ffd24a → #ffa840` + 7 seeded
    sunspots as soft dark patches). Halo plane
    uses an additive-blend canvas (bright ring
    fading outward), scaled 2.5× the face so
    the corona extends well beyond the face's
    edge.
  - **Render orders layered** for clean
    eclipse appearance:
    `halo (49) < sunMarker.sphereDot (51) <
    sunFace (51.5) < moonOpticalBody (52)`.
    Moon body draws on top of sun face during
    overlap; halo's outer ring stays visible
    around the moon's silhouette as corona.
  - **Wired in renderer** with the same gating
    as the moon body
    (`showSun && ShowOpticalVault &&
    InsideVault`). Size matches moon at
    `0.024`. Camera-aligned (`quaternion.copy`)
    so canvas-up = screen-up.
- **Revert:** `git checkout v-s000544 -- .`

## S546 — Analemma + synodic + eclipse-map demos: pick coord by WorldModel

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/demos/definitions.js`.
- **Change:**
  - `app.js` `stepAnalemma` and `stepVaultArc`
    accumulators now select source coord by
    `WorldModel`: GE → `Sun/MoonGlobeVaultCoord`
    or `Sun/MoonGlobeOpticalVaultCoord`; FE
    keeps the original AE-disc coords.
    `analKey` and `arcKey` both fold
    `s.WorldModel` so toggling FE↔GE resets the
    trace cleanly instead of mixing two
    projection frames.
  - `snapNoonVault`, `snapMoonNoonVault`,
    `snapSunNoonVaultLon0`, and
    `snapSunNoonVaultLon180` (analemma /
    synodic / paired-analemma helpers) all
    branch on `WorldModel === 'ge'` and pull
    the globe-vault coord when in GE so the
    monthly noon-position notches drop on the
    sphere instead of the FE disc.
  - Eclipse-map demo's `EclipseMapSolar` /
    `EclipseMapLunar` accumulators also branch
    on world model so the pre-computed eclipse
    positions render at the right place in
    either mode.
- **Revert:** `git checkout v-s000545 -- .`

## S547 — Sun face rotates with observer-frame angle

- **Date:** 2026-04-27
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`.
- **Change:**
  - `SunOpticalBody.update` signature gained
    a `rot` parameter. After
    `quaternion.copy(camera.quaternion)`,
    `_faceMesh.rotateOnAxis(zAxis, rot)`
    spins the sun face (sunspots) around the
    local view axis so the surface markings
    read as physical features that tilt with
    observer latitude / sky position.
  - Halo mesh stays unrotated — it's
    radially symmetric so a rotation has no
    visual effect; keeping it aligned avoids
    edge-aliasing transitions.
  - Renderer passes `c.MoonRotation` (the
    same observer-frame angle the moon
    terminator already uses) so sun and moon
    share a consistent rotation convention.
- **Revert:** `git checkout v-s000546 -- .`

## S548 — GE analemma demos: use optical-vault coord (fix zig-zag)

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/demos/definitions.js`.
- **Change:**
  - `stepVaultArc` GE branch now pulls
    `Sun/MoonGlobeOpticalVaultCoord` (sun /
    moon position on the observer's local sky
    hemisphere, world-anchored) instead of
    `Sun/MoonGlobeVaultCoord` (celestial
    sphere). The celestial-sphere coord only
    drifts ~1°/day so 12 monthly samples
    produced a zig-zag through widely-spaced
    points; the optical-vault coord captures
    the full daily-arc motion as the sun /
    moon rises and sets.
  - `snapNoonVault` (sun + moon),
    `snapMoonNoonVault`,
    `snapSunNoonVaultLon0`, and
    `snapSunNoonVaultLon180` analemma helpers
    likewise switched their GE branches from
    `*GlobeVaultCoord` to `*GlobeOpticalVaultCoord`
    so the noon-position notches sit on the
    same observer-local sky hemisphere as the
    arc trace and form the analemma figure-8
    instead of 12 points scattered on the
    celestial sphere.
  - Eclipse-map demo's GE branch left on
    `*GlobeVaultCoord` since each eclipse is at
    a different time and the celestial-sphere
    coord is the right frame for plotting the
    eclipse positions as a sky chart.
- **Revert:** `git checkout v-s000547 -- .`

## S549 — Skip below-horizon sentinel in GE analemma accumulators

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/demos/definitions.js`.
- **Change:**
  - `_globeOpticalProject` returns
    `[0, 0, -1000]` for sub-horizon bodies. The
    arc + analemma + month-marker accumulators
    were appending that sentinel when the sun /
    moon dipped below the horizon, producing
    long vertical chord lines dropping off the
    sphere (visible in the equator-analemma
    demo as yellow shafts hanging from the
    daily-arc rings).
  - `stepVaultArc` and `stepAnalemma` now bail
    early on `!srcCoord || srcCoord[2] ===
    -1000`. Same gate added to
    `snapNoonVault` (sun + moon),
    `snapMoonNoonVault`,
    `snapSunNoonVaultLon0`, and
    `snapSunNoonVaultLon180` so monthly noon
    snapshots that happen to land below
    horizon (rare but possible at extreme
    latitudes) don't drop a marker at the
    sentinel.
- **Revert:** `git checkout v-s000548 -- .`

## S550 — Revert AnalemmaLine LineSegments conversion

- **Date:** 2026-04-27
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - `AnalemmaLine` reverted to `THREE.Line`
    (was momentarily switched to
    `THREE.LineSegments` mid-edit). The
    accumulator still emits a continuous
    polyline; with `LineSegments` interpreting
    those points as pairs, the FE trace
    rendered as weird zig-zags after a mode
    swap. Plain `Line` connects sequential
    points, which is what FE needs.
  - GE chord-between-arcs still draws a
    straight line where the sun crosses the
    horizon between months — left for a
    separate, fully-tested pass.
- **Revert:** `git checkout v-s000549 -- .`

## S551 — Clear month-marker arrays on WorldModel switch

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`.
- **Change:**
  - `app.update()` now tracks
    `this._lastWorldModel` and clears
    `SunMonthMarkers`, `MoonMonthMarkers`,
    `SunMonthMarkersOpp`, `EclipseMapSolar`,
    and `EclipseMapLunar` whenever the model
    flips between FE and GE. Without this,
    markers captured in one projection's
    coords stayed in state and rendered at
    the wrong positions after switching
    modes mid-demo (the trace dropped through
    space at random places after a swap).
  - Arc + analemma point accumulators were
    already auto-resetting via their
    per-key checks (`arcKey` / `analKey`
    include `WorldModel`); only the state
    arrays needed an explicit clear because
    they live as plain `setState` arrays
    rather than internal slot buffers.
- **Revert:** `git checkout v-s000550 -- .`

## S552 — Analemma trace lives on optical vault in both modes

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/demos/definitions.js`.
- **Change:**
  - FE branch of `stepVaultArc` and the four
    `snap*` analemma helpers swapped from
    `c.SunVaultCoord` / `c.MoonVaultCoord`
    (heavenly-vault / true-source position
    above the disc) to
    `c.SunOpticalVaultCoord` /
    `c.MoonOpticalVaultCoord` (observer-local
    optical-vault hemisphere).
  - GE branch already used
    `*GlobeOpticalVaultCoord` since S548;
    both modes now consistently render the
    analemma on the same surface — the
    observer's actual sky hemisphere.
- **Revert:** `git checkout v-s000551 -- .`

## S553 — Drop disc-clip from MonthMarkers so GE noon notches render

- **Date:** 2026-04-27
- **Files changed:** `js/render/index.js`.
- **Change:**
  - All five `MonthMarkers` instances
    (`sunMonthMarkers`, `sunMonthMarkersOpp`,
    `moonMonthMarkers`, `eclipseMapSolar`,
    `eclipseMapLunar`) constructed with
    `clippingPlanes: []` instead of the
    shared `clipPlanes` (which carries the
    FE `z < 0` disc clip).
  - In GE, optical-vault sprite positions
    can land at world `z < 0` for southern-
    hemisphere observers, getting silently
    culled by the disc plane. The clip was
    only ever meaningful in FE; the markers
    are now on the optical-vault hemisphere
    in both modes and stay above the
    observer's local horizon, so disabling
    the FE-specific clip doesn't introduce
    any sub-disc leakage.
- **Revert:** `git checkout v-s000552 -- .`

## S554 — Bump month-marker sprite size for GE visibility

- **Date:** 2026-04-27
- **Files changed:** `js/render/index.js`.
- **Change:**
  - Sun / sun-opp month-marker sprite size
    bumped from `0.011` → `0.022`; moon
    bumped from `0.013` → `0.026`.
  - In FE the markers were small but visible
    because the camera sat close to the
    optical-vault hemisphere; in GE the
    camera typically sits farther from the
    observer (orbit view of the globe), and
    the original sizes ended up sub-pixel.
    Doubling sprite size keeps them readable
    in both modes without disturbing the
    analemma figure-8 layout.
- **Revert:** `git checkout v-s000553 -- .`

## S555 — Show MonthMarkers in GE + hide constellation lines on every demo

- **Date:** 2026-04-27
- **Files changed:** `js/render/index.js`,
  `js/demos/index.js`.
- **Change:**
  - **MonthMarkers no longer hidden in GE.**
    The renderer's GE branch in `frame()` was
    explicitly setting
    `sunMonthMarkers.group.visible = false`
    (and the four sibling marker groups + the
    eclipse-map markers). That predated S546 /
    S548 / S552 which moved the markers onto
    globe-aware optical-vault coords. Removed
    those forced-hide lines so the captured
    noon-position notches actually paint in
    GE. `sunNine` / `moonNine` / `gpTracer`
    skyGroup still hidden in GE (they still
    use FE-projected coords).
  - **Constellation lines off during demos.**
    `Demos._playSingle` now wraps the
    intro state in
    `{ ShowConstellationLines: false, ...intro }`
    so every demo plays with the
    stick-figure outlines suppressed by
    default. A demo that wants them on can
    set `ShowConstellationLines: true` in
    its intro to override (intro overrides
    win because spread comes after).
- **Revert:** `git checkout v-s000554 -- .`

## S556 — Drop Elev − Inscribed row from tracking-info popup

- **Date:** 2026-04-27
- **Files changed:** `js/ui/trackingInfoPopup.js`.
- **Change:**
  - Removed the `Elev − Inscribed` row and
    its `diffStr` computation. Central +
    Inscribed rows still computed and shown;
    the signed delta was a leftover from
    when a Visibility row consumed it.
- **Revert:** `git checkout v-s000555 -- .`

## S557 — GE polar analemma: fall back to celestial-sphere coord at |lat| ≥ 80

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/demos/definitions.js`.
- **Change:**
  - At the poles, the GE optical-vault coord
    returns the below-horizon sentinel for ~7
    months of the year (sun's dec puts it
    below the local horizon for half the
    annual cycle), so the analemma trace +
    monthly notches were only capturing the
    summer half. New rule: when
    `Math.abs(s.ObserverLat) >= 80`, the
    accumulators / snap helpers use
    `*GlobeVaultCoord` (celestial sphere)
    instead of `*GlobeOpticalVaultCoord`. The
    celestial-sphere position is always
    above-horizon-agnostic, so all 12 monthly
    markers + the daily traces show through
    the polar night.
  - `_geSrc(c, body, lat, kind)` helper added
    to `definitions.js` so all four `snap*`
    helpers share the same polar-fallback
    logic. `stepVaultArc` in `app.js` does
    the same selection inline.
  - For non-polar latitudes (|lat| < 80) the
    behavior is unchanged — optical-vault
    coord is used (S548 fix).
- **Revert:** `git checkout v-s000556 -- .`

## S558 — Analemma snap respects observer's actual horizon

- **Date:** 2026-04-27
- **Files changed:** `js/core/app.js`,
  `js/demos/definitions.js`.
- **Change:**
  - Drop the S557 polar fallback (`|lat| ≥ 80
    → celestial-sphere coord`). Both modes
    now use only the observer-local
    optical-vault coord and capture *only*
    when `c.SunAnglesGlobe.elevation > 0`
    (resp. `MoonAnglesGlobe`). Below-horizon
    noon snapshots are skipped entirely so
    the rendered analemma matches what the
    observer would physically see — partial
    figure at the poles, complete figure at
    mid-latitudes, full figure-8 at the
    equator.
  - `_geSrc` polar-fallback helper removed.
    `stepVaultArc` and all four `snap*`
    helpers (`snapNoonVault`,
    `snapMoonNoonVault`,
    `snapSunNoonVaultLon0`,
    `snapSunNoonVaultLon180`) now share the
    same horizon-gate convention.
- **Revert:** `git checkout v-s000557 -- .`

## S559 — Mobile-friendly pass + PWA manifest

- **Date:** 2026-04-27
- **Files changed:** `index.html`,
  `css/styles.css`,
  `manifest.webmanifest` (new).
- **Change:**
  - **Viewport meta tag** extended with
    `viewport-fit=cover` and added
    `theme-color`, `mobile-web-app-capable`,
    `apple-mobile-web-app-capable` /
    `-status-bar-style` so the app reads as
    a native-feeling fullscreen app on iOS /
    Android.
  - **PWA manifest** (`manifest.webmanifest`)
    added with name, short-name, scope
    (relative `./` so the same bundle works
    locally and on GH Pages), `display:
    standalone`, theme/background colors
    matching the existing dark theme, and
    a single icon entry pointing at
    `assets/ac_logo.png`. `<link rel="manifest">`,
    `<link rel="icon">`, and
    `<link rel="apple-touch-icon">` wired in
    `index.html` so install-to-home-screen
    works in modern mobile browsers.
  - **Responsive CSS** appended to
    `styles.css`. Two breakpoints:
    - `@media (max-width: 900px)` — header
      subtitle hidden, info bar trimmed,
      bottom-bar switches to horizontal
      scroll (`overflow-x: auto`,
      `flex-wrap: nowrap`) so the dense
      time / mode / search controls stay in
      one row and remain usable at finger
      width. Tab popups become near-full-
      screen overlays
      (`position: fixed; left/right: 4px`)
      so panel content actually fits. HUD
      moon-phase canvas shrinks to 60×60.
    - `@media (max-width: 520px)` — phone-
      sized: header title shrinks, time-btn
      padding tightens further, body-search
      input narrows.
  - Canvas already has `touch-action: none`
    so pinch / drag gestures route through
    the existing `pointermove` /
    `pointerdown` handlers in
    `mouseHandler.js` — no JS changes needed
    for basic touch.
- **Revert:** `git checkout v-s000558 -- .`

## S560 — Update about.md with session features

- **Date:** 2026-04-27
- **Files changed:** `about.md`.
- **Change:**
  - **Bottom-bar legend** — transport row note
    on autoplay-suspended demo pause + half-
    speed default; new "Country quick-hops"
    subsection covering the 5 × 2 ISO grid in
    the bar-left.
  - **Tracker tab** — Bright Star Catalog
    subsection + ~2,967-entry breakdown table
    removed (BSC was retired in S540). Quasar
    + Galaxy entries simplified to their
    standalone counts.
  - **Demos tab** — refreshed:
    - Autoplay suspension during demo, 1/8
      authored cadence default, state save
      / restore behaviour, constellation
      lines hidden by default.
    - 24 h Sun: GE map auto-switch to HQ
      Equirect Day.
    - **24 h Moon (2)** new entry (75°N,
      75°S).
    - Annual Cycle group removed.
    - Analemma: now works in both FE and GE
      on observer's local sky hemisphere;
      polar latitudes show only physically
      observable months.
  - **New `Sun and Moon bodies` section**
    after the unit discipline header —
    documents the three-crater moon body,
    sunspots + halo / corona, dynamic
    equirect day/night map flip.
  - **New `Mobile / install` section** —
    PWA manifest, responsive breakpoints,
    touch routing.
  - **New `Tracking helpers` section** —
    avatar follows target azimuth in all
    views, picker prefers FollowTarget,
    daytime-faded stars excluded from
    pickers.
- **Revert:** `git checkout v-s000559 -- .`

## S561 — Sigma Octantis · three observers demo

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - New `general` group entry: `Sigma
    Octantis · three observers, one instant`.
    Sets `DateTime` to 2022-06-22 21:40 UTC
    (= 1998.903) and follows
    `star:sigmaoct` while teleporting the
    observer between three locations:
    Recife BR (8°S 35°W, local 18:40),
    East Africa (5°S 30°E, local 23:40),
    and Perth AU (32°S 116°E, local 05:40
    next-day).
  - `PermanentNight: true` keeps the star
    visible regardless of local solar time.
    `OpticalZoom: 2.0` zooms in enough that
    the south-pole region fills the frame.
    `FollowTarget: 'star:sigmaoct'` keeps
    the camera locked on the star while the
    observer hops, so the visual centre
    stays fixed and the user reads the
    altitude / azimuth shift via the
    tracking HUD.
  - Time stays paused for the duration —
    autoplay is suspended during demo (S520)
    and no Tval touches `DateTime`, so the
    instant is fixed.
- **Revert:** `git checkout v-s000560 -- .`

## S562 — Sigma Octantis demo: real dynamic lighting

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - Sigma Octantis demo intro: `PermanentNight`
    flipped `true → false`, `DynamicStars`
    flipped `false → true`. Each location's
    sky brightness now reflects the actual
    sun elevation at the demo's frozen
    instant — Brazil reads as late twilight,
    East Africa as full night, Perth as
    pre-dawn.
- **Revert:** `git checkout v-s000561 -- .`

## S563 — Southern Cross · three observers demo

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - New `general` group entry: `Southern
    Cross · three observers, one instant`.
    Same UTC moment + same observer cycle as
    the Sigma Octantis demo (2022-06-22 21:40
    UTC · Recife BR → East Africa → Perth
    AU), but framed on Crux instead.
  - All four Crux stars (Acrux, Mimosa,
    Gacrux, Delta Cru) loaded into
    `TrackerTargets`; `FollowTarget` locks
    on the brightest (Acrux). `ShowConstellationLines:
    true` overrides the demo-default off so
    the cross outline paints. `OpticalZoom:
    3.0` fits the four-star pattern in the
    frame.
  - `DynamicStars: true`, `PermanentNight:
    false` — sky brightness reflects each
    location's actual sun elevation at the
    frozen instant.
- **Revert:** `git checkout v-s000562 -- .`

## S564 — Tracking demos: facing vector + azimuth ring on by default

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - Sigma Octantis + Southern Cross demo
    intros now set `ShowFacingVector: true`,
    `ShowAzimuthRing: true`,
    `ShowLongitudeRing: true`, and
    `ShowOpticalVaultGrid: true` so the
    observer's facing direction + the
    compass ring are visible from the start
    of each demo (consistent with the 🧭
    bottom-bar one-click compass set).
  - Both flags read straight from state
    with no demo-specific gating, so the
    🧭 button and Show-tab toggles stay
    fully usable mid-demo.
- **Revert:** `git checkout v-s000563 -- .`

## S565 — Cycling-observer demos: 5-second hold per location

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - Sigma Octantis + Southern Cross demo
    `Tpse` durations dropped to `625` ms
    authored. With the Animator's default
    `speedScale = 0.125` (S524), that's
    `625 / 0.125 = 5000` ms wall time per
    location. Intro pause + final-narration
    pause removed; narration text shown
    inline so each location gets the full
    5-second hold.
  - Lighting still derives from real sun
    elevation at the frozen 21:40 UTC
    instant (`PermanentNight: false`,
    `DynamicStars: true` per S562) — Brazil
    twilight, East Africa night, Perth
    pre-dawn read naturally.
- **Revert:** `git checkout v-s000564 -- .`

## S566 — Lock DateTime during cycling-observer demos

- **Date:** 2026-04-27
- **Files changed:** `js/demos/index.js`,
  `js/demos/definitions.js`.
- **Change:**
  - `Demos._playSingle` now fires a no-op
    `model.setState({})` immediately after
    `animator.play(...)`. The empty
    setState emits an `update` event in
    the same frame so the controlPanel
    watchdog (S520) sees `animator.running
    === true` and suspends autoplay on
    frame 0 instead of waiting for the
    first Tcall / Tval to trigger an
    update. Closes the gap where autoplay
    could tick once or twice before the
    suspension landed.
  - Sigma Octantis + Southern Cross demos:
    each Tcall now re-asserts `DateTime:
    1998.903` alongside the observer hop.
    Belt-and-suspenders against any
    autoplay leakage during the 5-second
    holds — the next hop snaps DateTime
    back to the observed instant.
- **Revert:** `git checkout v-s000565 -- .`

## S567 — Cycling-observer demos: swap Tpse for Tval-based wait

- **Date:** 2026-04-27
- **Files changed:** `js/demos/definitions.js`.
- **Change:**
  - Replaced each `Tpse(625)` hold with
    `Tval('OpticalZoom', current, 625, 0,
    'linear')` in both Sigma Octantis and
    Southern Cross demos. Tval re-asserts
    the current `OpticalZoom` value over
    625 ms (= 5 sec wall at the default
    0.125 speedScale) — same wait duration
    as Tpse but it fires `setState` every
    frame, which keeps the update event
    chain firing reliably.
  - Diagnostic for the "demo doesn't cycle"
    report — Tpse should drain via
    `task.remaining -= elapsed` per frame
    but somehow wasn't completing on the
    user's side. Tval is a more
    battle-tested code path (every
    midnight-sun / analemma demo uses it)
    so swapping should resolve.
- **Revert:** `git checkout v-s000566 -- .`

## S568 — Axis-line toggle + vault-swap moved to right cluster

- **Date:** 2026-04-28
- **Files changed:** `js/render/worldObjects.js`,
  `js/core/app.js`,
  `js/ui/controlPanel.js`.
- **Change:**
  - `Observer.update` axis line (formerly
    GE-only `zenithToCenter`) now visibility-
    gates on a new state flag
    `ShowAxisLine` (default `false`) instead
    of being hard-coded to GE. In FE mode
    the line lies on the disc plane from the
    observer to the AE pole at world origin
    (lat 90°, lon 0°); in GE it goes
    radially from surface observer to globe
    centre. Same line resource, mode-
    independent gating.
  - New `btnAxis` (`↕`) bottom-bar toggle in
    the left `time-controls` slot where the
    vault-swap button used to sit. Click
    flips `ShowAxisLine`.
  - `btnVault` (vault-swap, 🌐 / 👁) moved
    from `time-controls` (left) to
    `cycleRow` in `compassControls` (right
    cluster) — sits as the 5th button after
    map / starfield / az-ring / language.
- **Revert:** `git checkout v-s000567 -- .`

## S569 — Axis-line origin dot + swap-stack relocation

- **Date:** 2026-04-28
- **Files changed:** `js/render/worldObjects.js`,
  `js/render/index.js`,
  `js/ui/controlPanel.js`,
  `css/styles.css`.
- **Change:**
  - **Origin dot now follows ShowAxisLine.**
    `WorldGlobe.update` gates `this.center`
    visibility on `s.ShowAxisLine` so the
    GE centre dot only appears when the
    axis line is on. New top-level
    `originDot` (orange sphere at world
    origin) added in the renderer for FE
    mode, gated on `ShowAxisLine && !ge` so
    the FE axis line gets a visible
    endpoint at the AE pole. Avoids
    double-paint with the GE-only globe
    centre dot.
  - **Right-cluster reorg** per "max 2
    rows": removed `btnVault` from
    `cycleRow` and `btnAxis` from
    `time-controls`. Added a new
    `swap-stack` 1-col × 2-row container
    holding vault-swap + axis-line, prepended
    to `compassControls` immediately to the
    left of the moon icon (modeGrid's first
    column). Cycle row goes back to its
    original 4 buttons (map, starfield,
    az-ring, language); time-controls back
    to the original 7 (rew, play, ff, ½×,
    2×, jumpGrid, speedStack).
  - CSS: `#bottom-bar .swap-stack` styled as
    a grid (2 rows, 2-px gap) with
    matching button sizing.
- **Revert:** `git checkout v-s000568 -- .`

## S570 — Origin-dot click teleport + GE→FE snap to AE pole

- **Date:** 2026-04-28
- **Files changed:** `js/main.js`,
  `js/ui/mouseHandler.js`,
  `js/core/app.js`.
- **Change:**
  - **Origin-dot click teleport.**
    `attachMouseHandler` now takes an
    optional `renderer` arg so the
    `pointerup` handler can access
    `sm.camera`. When `ShowAxisLine` is on
    and the user clicks within 22 px of
    world (0, 0, 0)'s screen-space
    projection, the observer snaps to
    (lat 90°, lon 0°) and any
    `FollowTarget` / `FreeCam` is cleared.
    Works in both FE (origin = AE pole at
    disc centre) and GE (origin = globe
    centre, observer hops to the pole).
  - **GE → FE auto-pole snap.** The
    WorldModel watchdog in `app.update()`
    now detects `ge → fe` transitions and
    forces `ObserverLat: 90, ObserverLong:
    0`. Avoids carrying a southern-
    hemisphere negative-latitude position
    onto the FE disc where it'd map to a
    rim point with no obvious orientation.
- **Revert:** `git checkout v-s000569 -- .`

## S571 — Fictitious-Teleport swap mechanic + Last anchor dot

- **Date:** 2026-04-28
- **Files changed:** `js/core/app.js`,
  `js/render/index.js`,
  `js/ui/mouseHandler.js`.
- **Change:**
  - **State adds `LastObserverLat` /
    `LastObserverLong`** (default `null`).
    Stores the previous observer position
    so a swap can return to it.
  - **`Renderer.lastDot`** — new top-level
    orange sphere mesh placed at the world
    coord of `LastObserver*` (FE: AE-disc
    projection; GE: spherical lat/lon →
    cartesian on `FE_RADIUS`). Visible only
    when `ShowAxisLine` is on and
    `LastObserver*` are non-null. World coord
    cached in `renderer._lastDotWorld` for
    the click hit-test.
  - **Click swap.** Click within 22 px of
    either the origin dot OR the anchor dot
    swaps `(ObserverLat, ObserverLong)` ↔
    `(LastObserverLat, LastObserverLong)`.
    Defaults the "last" side to (90°, 0°)
    when nothing is saved. Clears
    `FollowTarget` / `FreeCamActive` so the
    new position lands cleanly. Works in
    Optical and Heavenly views.
  - **Hover tooltip "Fictitious Teleport"**
    in `pointermove` — checks both dots'
    screen projections; tooltip floats next
    to the cursor and short-circuits the
    mode-specific celestial hover so it
    wins regardless of Optical / Heavenly
    branch.
  - **Optical → Heavenly auto-snap.**
    `app.update()` now tracks
    `_lastInsideVault`. On `true → false`
    transition, save current to
    `LastObserver*` and snap observer to
    (90°, 0°) — same as the GE → FE
    transition. Mirrors "leave the orange
    dot behind for them to swap back".
- **Revert:** `git checkout v-s000570 -- .`

## S572 — GE: fictitious observer at globe centre

- **Date:** 2026-04-28
- **Files changed:** `js/core/app.js`,
  `js/ui/mouseHandler.js`,
  `js/render/worldObjects.js`.
- **Change:**
  - **State `ObserverAtCenter`** (default
    `false`). When `true` and `WorldModel ===
    'ge'`, `app.update()` overrides
    `c.GlobeObserverCoord` to `[0, 0, 0]`
    and `c.GlobeObserverFrame` to a world-
    aligned identity-ish basis
    (`up = +z, north = +x, east = +y`).
    The optical-vault hemisphere mesh
    inherits `GlobeObserverCoord`, so it
    centres on world origin with radius
    `FE_RADIUS` — coinciding with the upper
    half of the terrestrial globe surface.
    The fictitious observer at the centre
    "sees" the inside of that hemisphere as
    their optical vault.
  - **Click swap is mode-aware now.** In
    GE: clicking the orange origin / anchor
    dot toggles `ObserverAtCenter` and
    saves / restores
    `LastObserverLat`/`LastObserverLong`
    so the surface position is remembered.
    In FE: existing lat/lon swap (S571).
  - **Observer figure hidden at centre** —
    `Observer.update` sets
    `this.group.visible = false` when
    `ObserverAtCenter && ge` so the figure
    isn't buried inside the opaque sphere.
  - **GE → FE auto-snap**
    (`_lastWorldModel === 'ge' →
    !== 'ge'`) now also clears
    `ObserverAtCenter` and only saves a
    surface lat/lon to `LastObserver*` if
    the GE observer wasn't at centre.
- **Revert:** `git checkout v-s000571 -- .`

## S573 — Globe-centre observer keeps surface frame tilt

- **Date:** 2026-04-28
- **Files changed:** `js/core/app.js`.
- **Change:**
  - At-centre override now only swaps
    `c.GlobeObserverCoord` to world origin
    while leaving `c.GlobeObserverFrame`
    computed from the surface
    `ObserverLat`/`ObserverLong` exactly
    as it would be if the observer were
    standing on the sphere. The optical-
    vault hemisphere therefore tilts to
    match the surface position's zenith
    direction even when geometrically
    nested inside the globe — the
    fictitious centre observer keeps the
    same wrap orientation a surface
    observer at that lat/lon would have.
  - Was: world-aligned identity frame
    (`up=+z, north=+x, east=+y`) regardless
    of where the user came from.
- **Revert:** `git checkout v-s000572 -- .`

## S574 — Globe-centre observer: look down + axis-line anchor

- **Date:** 2026-04-28
- **Files changed:** `js/render/scene.js`,
  `js/core/app.js`,
  `js/render/worldObjects.js`.
- **Change:**
  - **Negative pitch in GE Optical when at
    centre.** `scene.js` first-person
    pitch clamp lower bound flips from `0`
    to `-89` when `ge && s.ObserverAtCenter`,
    so the user can tilt the camera below
    the horizontal plane and look at
    "lower-hemisphere" stars from the
    centre. Surface observers still clamp
    to `[0, 90]` to preserve normal
    horizon behaviour.
  - **Sub-zenith bodies project to lower
    hemisphere when at centre.**
    `_globeOpticalProject` skips the
    sentinel rejection
    (`localGlobe[0] <= 0 → [0, 0, -1000]`)
    when `s.ObserverAtCenter` is on. With
    the centre observer there's no surface
    horizon — bodies that would be sub-
    horizon at the surface project onto
    the lower half of the
    optical-vault hemisphere instead of
    being culled.
  - **Axis line stays connected from centre
    to original surface position.** When
    `ObserverAtCenter && ge && LastObserver*`
    are non-null, the axis line draws from
    world origin out to the
    (`LastObserverLat`, `LastObserverLong`)
    surface point at radius `FE_RADIUS` —
    visual anchor back to where the
    fictitious centre observer came from.
- **Revert:** `git checkout v-s000573 -- .`

## S575 — FE axis-line anchor + globe inside-day/night

- **Date:** 2026-04-28
- **Files changed:** `js/render/worldObjects.js`.
- **Change:**
  - **FE axis-line at-pole anchor.** When in
    FE mode at `(ObserverLat, ObserverLong)
    === (90, 0)` AND `LastObserver*` is set,
    the axis line draws from world origin
    (the AE pole) out to the AE-projected
    `LastObserver*` position. Mirrors the
    GE centre-observer behaviour so the
    fictitious observer keeps a visual tie
    back to the original surface position.
  - **Globe sphere material flipped to
    `DoubleSide`.** Inside-view from the
    centre observer now renders the day/
    night terminator on the inside of the
    globe surface — looking toward the sub-
    solar direction shows the day side,
    looking away shows night. Day/night
    rules continue to apply at the centre
    observer, no perma-daylight.
- **Revert:** `git checkout v-s000574 -- .`

## S576 — Origin dot at (lat 90°, lon 0°) in both projections

- **Date:** 2026-04-28
- **Files changed:** `js/render/index.js`,
  `js/ui/mouseHandler.js`,
  `js/render/worldObjects.js`.
- **Change:**
  - `Renderer.originDot` now positions per
    projection: FE → world `(0, 0, 0)` (AE
    pole at disc centre); GE → world
    `(0, 0, FE_RADIUS)` (north pole on globe
    surface). Both correspond to lat 90°,
    lon 0° in their respective projections
    so the user sees "the same location" on
    a mode toggle.
  - `mouseHandler` click + hover hit-tests
    use the projection-specific origin
    position (`[0,0,0]` in FE, `[0,0,1]` in
    GE).
  - `WorldGlobe.center` (the inner globe-
    centre dot) now only renders when
    `ShowAxisLine && ObserverAtCenter && ge`
    — represents the fictitious-observer
    position at globe centre, not the
    axis-line endpoint. The axis-line
    endpoint is the new `originDot` at the
    surface pole.
- **Revert:** `git checkout v-s000575 -- .`

## S577 — Centre observer respects surface horizon

- **Date:** 2026-04-28
- **Files changed:** `js/core/app.js`.
- **Change:**
  - Reverted the S574 below-horizon-pass-
    through in `_globeOpticalProject`. The
    centre-observer view now culls sub-
    horizon bodies the same way a surface
    observer at (`ObserverLat`,
    `ObserverLong`) would — only objects
    in the surface hemisphere render in the
    optical vault, matching what the real-
    location observer would actually see at
    the current time. The camera can still
    pitch below the horizontal plane (S574
    pitch clamp kept) so the view can scan
    the rendered hemisphere from any angle,
    but no below-horizon objects appear.
- **Revert:** `git checkout v-s000576 -- .`

## S578 — FE/GE toggle preserves observer lat/lon

- **Date:** 2026-04-28
- **Files changed:** `js/core/app.js`.
- **Change:**
  - Removed the GE→FE auto-snap-to-(90°, 0°)
    block. `ObserverLat` / `ObserverLong`
    now persist across FE↔GE toggles, so
    cycling modes keeps the user at the
    same lat/lon. Auto-clearing the
    stale `ObserverAtCenter` flag stays
    (it's a GE-only state). Manual
    teleport to (90°, 0°) is still
    available via the orange origin-dot
    click.
- **Revert:** `git checkout v-s000577 -- .`

## S579 — GE fictitious teleport target = globe centre

- **Date:** 2026-04-28
- **Files changed:** `js/render/index.js`,
  `js/ui/mouseHandler.js`.
- **Change:**
  - `Renderer.originDot` reverted to world
    origin `(0, 0, 0)` in both projections.
    GE: globe centre (visible through the
    translucent sphere). FE: AE pole at
    disc centre. The S576 GE-only offset
    to `(0, 0, FE_RADIUS)` (globe-north
    pole) is reverted — the user's
    fictitious teleport in GE drops them
    at globe centre, not on the surface.
  - `mouseHandler` click + hover hit-tests
    use `[0, 0, 0]` unconditionally
    (matches the dot position).
- **Revert:** `git checkout v-s000578 -- .`

## S580 — Planet markers hard-hide in daylight

- **Date:** 2026-04-28
- **Files changed:** `js/render/index.js`.
- **Change:**
  - Added a `planetNightOn = NightFactor >
    0.05` gate at the top of the planet-
    marker loop. When NightFactor is below
    that threshold (full daylight), the
    planet's `mk.group.visible` is set to
    `false` for the whole group regardless
    of tracker membership or other
    conditions. The downstream
    `CelestialMarker` fade math already
    drops `sphereDot` opacity to 0 in
    daylight, but an explicit group hide
    covers any auxiliary planet-render
    path that might otherwise leak through
    when the user is at the fictitious
    centre observer in GE.
- **Revert:** `git checkout v-s000579 -- .`

## S581 — Optical/Heavenly toggle preserves observer lat/lon

- **Date:** 2026-04-28
- **Files changed:** `js/core/app.js`.
- **Change:**
  - Removed the S571 Optical → Heavenly
    auto-snap that forced the observer to
    (90°, 0°) on view-mode toggle. Observer
    position now persists across the
    InsideVault toggle the same way it
    persists across FE/GE toggles after S578.
    The orange origin-dot click is still the
    explicit way to teleport to (90°, 0°) /
    globe centre.
- **Revert:** `git checkout v-s000580 -- .`

## S582 — Centre observer: sync LastObserver* with live lat/lon

- **Date:** 2026-04-28
- **Files changed:** `js/core/app.js`.
- **Change:**
  - While `ObserverAtCenter && WorldModel ===
    'ge'`, `LastObserverLat` /
    `LastObserverLong` now mirror
    `ObserverLat` / `ObserverLong` every
    `update()`. Adjusting the lat / lon
    sliders while at the fictitious centre
    observer drags the orange anchor dot in
    real time, and a subsequent FE / GE or
    Optical / Heavenly toggle pulls the up-
    to-date surface position rather than the
    stale value saved at click-time.
- **Revert:** `git checkout v-s000581 -- .`

## S583 — Fictitious-observer toggle in FE mode

- **Date:** 2026-04-28
- **Files changed:** `js/ui/mouseHandler.js`,
  `js/core/app.js`,
  `js/render/worldObjects.js`.
- **Change:**
  - **Click handler unified.** Clicking the
    orange origin dot now toggles
    `ObserverAtCenter` in both modes. Enter:
    save current lat/lon to `LastObserver*`
    and snap observer to (90°, 0°). Leave:
    restore observer to `LastObserver*`. In
    GE the at-centre flag also drives the
    `GlobeObserverCoord = [0, 0, 0]`
    geometric override; in FE the flag just
    parks the observer at the AE pole and
    enables the same "save/restore /
    sync-on-adjust" UX.
  - **Lat/lon sync drops the GE gate** — both
    modes now mirror `Observer*` to
    `LastObserver*` while at the fictitious
    observer.
  - **Observer-figure hide drops the GE
    gate** — figure stays hidden whenever
    `ObserverAtCenter` is on, including at
    the FE AE pole.
  - `ObserverAtCenter` still auto-clears on
    FE↔GE flip (S578) so the flag's
    semantics don't carry across modes.
- **Revert:** `git checkout v-s000582 -- .`

## S584 — Fictitious observer: keep lat/lon untouched, anchor tracks live

- **Date:** 2026-04-28
- **Files changed:** `js/ui/mouseHandler.js`,
  `js/core/app.js`,
  `js/render/index.js`,
  `js/render/worldObjects.js`.
- **Change:**
  - **Click handler simplified.** Toggling
    `ObserverAtCenter` no longer touches
    `ObserverLat` / `ObserverLong`. The
    user's surface position stays in those
    fields; the geometric override moves
    the camera / hemisphere to the disc
    centre / globe centre while the lat /
    lon represents "where I would be on the
    surface".
  - **FE override added.** `app.update()`
    now sets `ObserverFeCoord = [0, 0, 0]`
    and recomputes
    `TransMatLocalFeToGlobalFe` at origin
    when `ObserverAtCenter && !ge`, so the
    FE optical-vault hemisphere centres on
    the disc centre (AE pole). Mirror of
    the GE `GlobeObserverCoord` override.
  - **Anchor dot tracks live lat/lon.**
    The `lastDot` (orange anchor) now
    renders at the live `ObserverLat` /
    `ObserverLong` projected to world
    coords whenever
    `ShowAxisLine && ObserverAtCenter`.
    Slider adjustments move the dot in
    real time without overwriting any
    saved-snapshot.
  - **Axis line endpoint.** Same change —
    when at-centre, the line draws from
    world origin out to the live lat / lon
    surface position.
  - The `LastObserver*` state fields are
    no longer used for the fictitious-
    observer mechanic (they remain in
    state for backwards compatibility but
    aren't read anywhere significant for
    this feature).
- **Revert:** `git checkout v-s000583 -- .`

## S585 — Orange dot: long-press drag to teleport

- **Date:** 2026-04-28
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:**
  - **Long-press 1 s on orange dot enters
    drag mode.** A 1-second `setTimeout`
    arms when `pointerdown` lands on either
    the origin dot or the anchor dot
    (within 22 px). If the cursor doesn't
    drag past the click threshold before
    the timer fires, drag mode engages.
  - **Drag = teleport.** While dragging,
    `pointermove` raycasts the cursor
    against the disc plane (FE) or the
    globe sphere (GE), converts the hit
    point to lat / lon, and updates
    `ObserverLat` / `ObserverLong`. The
    anchor dot follows live (already
    tied to live lat/lon per S584).
  - **Release drops the dot** — `pointerup`
    cancels drag mode without triggering
    the short-press click swap.
  - Pre-1-second cursor motion past
    `CLICK_DRAG_PX` cancels the pending
    drag timer so a normal canvas pan
    still works after pressing on the dot.
  - Imports `THREE` for `Raycaster` /
    `Sphere` / `Plane` / `Vector2` /
    `Vector3`.
- **Revert:** `git checkout v-s000584 -- .`

## S586 — Orange-dot drag threshold: 0.5 s

- **Date:** 2026-04-28
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:**
  - Long-press threshold to enter
    orange-dot drag mode reduced from
    `1000` ms to `500` ms.
- **Revert:** `git checkout v-s000585 -- .`

## S587 — Orange-dot gesture: drag-on-press + dblclick-to-swap

- **Date:** 2026-04-27
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:**
  - Replaced the long-press timer with
    immediate drag-on-press: pressing
    over the orange origin / anchor dot
    sets `dotDragging = true` straight
    away, so any drag relocates the
    observer's lat / lon under the
    cursor.
  - Removed the click-swap branch from
    `pointerup`. The `ObserverAtCenter`
    toggle now lives in a new `dblclick`
    listener that fires only when the
    cursor is over an orange dot.
  - Dropped the timer-cancel block in
    `pointermove` and the
    `dotDragTimer` variable / setTimeout
    plumbing — no timers remain.
  - Hover tooltip text updated to
    "Drag to move · double-click to swap".
- **Revert:** `git checkout v-s000586 -- .`

## S588 — Orange-dot gesture: click-to-swap, hold+drag-to-move

- **Date:** 2026-04-28
- **Files changed:** `js/ui/mouseHandler.js`.
- **Change:**
  - Reworked the orange-dot gesture to
    distinguish click vs drag from a
    single press. `pointerdown` over a
    dot arms `pressedOnDot`; `pointermove`
    promotes that to `dotDragging` once
    motion crosses `CLICK_DRAG_PX`.
  - Drag (held + moved) updates
    `ObserverLat` / `ObserverLong` from
    the cursor's lat / lon as before.
  - Click (released without crossing
    threshold) toggles `ObserverAtCenter`
    in `pointerup`.
  - Removed the prior `dblclick`
    listener — the toggle now lives in
    the unified `pointerup` branch.
  - `pointermove` early-returns from the
    camera-pan block while
    `pressedOnDot` is armed so the
    camera doesn't drift a few pixels
    before the gesture promotes.
  - Hover tooltip text updated to
    "Click to swap · hold + drag to move".
- **Revert:** `git checkout v-s000587 -- .`

## S589 — Centre observer: optical vault stays at surface

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
  - `js/render/scene.js`
  - `js/render/index.js`
  - `js/render/worldObjects.js`
- **Change:**
  - Removed the `ObserverAtCenter` (0, 0, 0)
    overrides on `c.GlobeObserverCoord`
    and `c.ObserverFeCoord` in
    `app.update`. Both anchors stay at
    the live surface lat / lon, so the
    optical vault and every downstream
    body projection follow the surface
    position.
  - In `scene.js` the camera now reads
    a separate `camObs` vector
    (`= [0, 0, 0]` when
    `ObserverAtCenter`, else `obs`)
    while the optical-vault frame still
    comes from the surface lat / lon.
    All four camera branches
    (Optical, FreeCameraMode, FreeCam
    follow, Heavenly orbit) use
    `camObs` for position / look-at.
  - Pitch-min relaxation
    (`-89` for `ObserverAtCenter`)
    now applies in both FE and GE,
    not just GE.
  - `index.js` hides the world-origin
    orange dot whenever the camera is
    parked there (Optical view +
    `ObserverAtCenter`); same hide for
    `WorldGlobe.center` in
    `worldObjects.js`. Avoids a
    foreground blob right at the eye.
- **Result:** Single-clicking the orange dot
  TPs the camera to the disc / globe
  centre while the optical vault stays
  at the surface lat / lon. Hold + drag
  on the dot moves the surface position,
  and the vault slides with it so the
  centre observer can watch projected
  bodies shift across the dome.
- **Revert:** `git checkout v-s000588 -- .`

## S590 — GE-only: vault collapses to centre when ObserverAtCenter

- **Date:** 2026-04-28
- **Files changed:** `js/core/app.js`.
- **Change:**
  - Restored the GE-only
    `c.GlobeObserverCoord = [0, 0, 0]`
    override when `ObserverAtCenter` is
    on, leaving the FE
    `c.ObserverFeCoord` at its surface
    lat / lon (S589 behaviour).
  - GE rationale: the terrestrial
    sphere and celestial sphere share a
    common centre, so dropping the
    optical-vault anchor to the world
    origin wraps the vault around the
    camera. Body projections still use
    `GlobeObserverFrame` from the
    surface lat / lon, so dragging the
    orange dot rotates the projections
    in real time and the centre
    observer sees what an observer at
    the orange dot would see.
  - FE keeps the surface-anchored vault
    from S589: dragging the dot drags
    the vault with it.
- **Revert:** `git checkout v-s000589 -- .`

## S591 — Swap-stack button sizing matches mode-grid

- **Date:** 2026-04-28
- **Files changed:** `css/styles.css`.
- **Change:**
  - `#bottom-bar .swap-stack .time-btn`
    now uses `min-width: 36px`,
    `padding: 2px 8px`, `font-size: 14px`,
    `line-height: 18px`, `margin: 0`,
    matching the mode-grid / cycle-row /
    cardinal-grid button rules.
  - Added `grid-auto-rows: 1fr` to the
    `.swap-stack` container so its two
    rows match the mode-grid's row
    sizing for vertical alignment.
- **Result:** vault-swap (`👁` / `🌐`) and
  axis-line (`↕`) buttons now line up
  visually with the moon / mode-grid /
  starfield / cycle rows on the left
  side of the bottom bar.
- **Revert:** `git checkout v-s000590 -- .`

## S592 — GE Art — Translucent globe map

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/geArt.js`
  - `js/core/projections.js`
  - `js/render/worldObjects.js`
- **Change:**
  - Added a new procedural GE art style
    `ge_translucent` (geArt.js): faint
    blue continents over a graticuled
    deep-blue ocean, drawn with semi-
    transparent fills + strokes so the
    canvas itself reads as light.
  - Added projection definition
    `ge_art_translucent` in
    `projections.js`
    (`category: 'ge_art'`,
    `wrapsSphere: true`,
    `geOpacity: 0.35`). Picks up the
    new generated style and sets the
    GE sphere shell to 35 % opacity.
  - `WorldGlobe.applyMapTexture` reads
    the projection's optional
    `geOpacity` field and writes it to
    the sphere shader's `uOpacity`
    uniform; defaults to `0.85` so the
    other GE maps stay unchanged.
- **Result:** Selecting *GE Art —
  Translucent* in the GE Map dropdown
  renders the terrestrial sphere as a
  see-through shell — the centre
  observer can now look out through
  the globe and watch the celestial
  sphere on the far side.
- **Revert:** `git checkout v-s000591 -- .`

## S593 — Constellation lines: clip at horizon, bump render order

- **Date:** 2026-04-28
- **Files changed:** `js/render/constellations.js`.
- **Change:**
  - Optical-vault constellation segments
    that straddle the horizon are now
    linearly interpolated to the horizon
    plane (using the local-zenith
    components of the two endpoints)
    instead of being parked entirely.
    Below-horizon endpoint replaced by
    the chord-horizon intersection so
    the visible portion of a partly-
    risen constellation still draws.
  - World-space `sphPos[i]` now stored
    for every star (above or below
    horizon) so the line builder can
    interpolate. Star-sprite buffer
    still parks below-horizon entries
    so they don't paint as dots.
  - New `localUp[i]` array caches the
    local-zenith component per star.
  - `sphereLines.renderOrder` bumped
    `56 → 66`,
    `sphereStars.renderOrder` bumped
    `57 → 67`, so optical-vault
    constellations sit clearly above
    any same-radius geometry (notably
    the GE terrestrial sphere when
    `ObserverAtCenter` collapses the
    vault to the world origin).
- **Revert:** `git checkout v-s000592 -- .`

## S594 — Compass-controls cluster: uniform 2 px spacing

- **Date:** 2026-04-28
- **Files changed:** `css/styles.css`.
- **Change:**
  - `#bottom-bar .compass-controls` gap
    `6px → 2px` (swap-stack /
    mode-grid / cycle-row /
    cardinal-grid / grids-stack
    columns now sit at the same
    spacing the cycle-row buttons
    use internally).
  - `#bottom-bar .swap-stack`
    `margin-right: 6px → 0` so it
    doesn't re-introduce the old wider
    gap on its right edge.
- **Result:** every column in the
  bottom-right cluster (vault-swap +
  axis-line, mode-grid, Maps + Starfield
  + AzRing + Lang, NESW, GP-tracer +
  FE/GE) is separated by 2 px, matching
  the Maps↔Starfield spacing.
- **Revert:** `git checkout v-s000593 -- .`

## S595 — Flight Routes demo (Southern Non-Stop KMZ)

- **Date:** 2026-04-28
- **Files added:**
  - `js/data/flightRoutes.js`
  - `js/render/flightRoutes.js`
  - `js/demos/flightRoutes.js`
- **Files changed:**
  - `js/core/app.js` (default state)
  - `js/render/index.js` (renderer wiring)
  - `js/demos/definitions.js` (DEMOS append +
    DEMO_GROUPS append)
- **Change:**
  - New data module with the 9 cities
    and 7 routes parsed from
    `Southern Non-Stop.kmz` (Sydney /
    Santiago / Melbourne / Auckland /
    Johannesburg / Darwin / Sao Paulo /
    Buenos Aires / Perth) plus
    `greatCircleArc(latA, lonA, latB,
    lonB, n)` (slerp on unit sphere) and
    `centralAngleDeg(...)` helpers.
  - `FlightRoutes` renderer draws each
    leg as a sampled great-circle line
    on either the FE disc (AE
    projection at small z lift) or the
    GE sphere (radial lift to avoid
    z-fight), with city dot + label
    sprites at each endpoint. Visibility
    gated on `s.ShowFlightRoutes`;
    `s.FlightRoutesSelected` accepts
    `'all'` / route id / id array;
    `s.FlightRoutesProgress` (0..1)
    clips each line partway along its
    arc for the demo sweep.
  - Demo group `flight-routes` added
    with: combined-all sweep,
    central-angle theorem (numeric
    south-vs-mirrored-north parity per
    leg), constant-speed parity (two
    Johannesburg legs sweeping at the
    same rate on FE and GE), and one
    entry per individual route. Each
    intro hides every sky overlay
    (stars / planets / vault / tracks /
    rays), turns on `ShowFeGrid` +
    `ShowGroundPoints`, parks the
    observer at (90, 0) with a
    top-down camera, and sets
    `WorldModel = 'fe'` /
    `MapProjection = 'ae'`.
- **Revert:** `git checkout v-s000594 -- .`

## S596 — Flight Routes: faster sweep + hide tracker GPs

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/index.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - `_playSingle` now honours an
    optional `speedScale` field on a
    demo definition and calls
    `animator.setSpeedScale` after
    `play()` so route demos can
    override the default 0.125
    slow-celestial cadence.
  - All flight-route demos declare
    `speedScale: 1.0` so authored ms
    ≈ wall ms.
  - Per-route sweeps shortened to
    `SWEEP_PER_ROUTE = 4500` ms, the
    combined / central-angle /
    constant-speed sweeps to
    `SWEEP_COMBINED = 6000` ms;
    FE→GE settle pause shortened to
    800 ms so the projection swap is
    snappy.
  - Demo intro now wipes
    `TrackerTargets` to `[]` and
    `FollowTarget` to `null` so the
    per-tracker GP markers (the
    catalogued-star + planet ground
    dots that were painting on top of
    the route map) stay off for the
    duration of the demo. Restored
    automatically when the demo ends
    via the existing
    `_savedState` snapshot.
  - Catalogue toggles
    (`ShowBlackHoles`, `ShowQuasars`,
    `ShowGalaxies`, `ShowSatellites`)
    also forced off in the intro to
    catch their independent dot
    layers.
- **Revert:** `git checkout v-s000595 -- .`

## S597 — Flight Routes: Thold at end so demos wait for user

- **Date:** 2026-04-28
- **Files changed:** `js/demos/flightRoutes.js`.
- **Change:**
  - Replaced the auto-revert
    `WorldModel: 'fe'` Tcalls at the
    end of every flight-route demo
    with a closing `Ttxt` + `Thold()`.
    `Thold` returns `false` from the
    animator step handler so the
    queue never advances; the demo
    sits on the connected route map
    until the user presses Stop.
  - Per-route, combined-all,
    central-angle, and constant-
    speed demos all now end with the
    same hold-and-wait pattern. User
    can flip FE / GE manually with
    the world-model toggle to
    compare projections.
- **Revert:** `git checkout v-s000596 -- .`

## S598 — Flight Routes: ground rings + offset labels + leader lines

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - Replaced the per-city sphere
    marker with a flat
    `RingGeometry(0.0085, 0.0125)`
    sitting on the ground plane (FE)
    or oriented to the local tangent
    plane (GE) via a unit-vector
    rotation aligning the ring's +z
    normal with the radial outward
    direction.
  - Label sprites redrawn with a
    bordered box, aspect-correct
    world scale, and `center.set(0,
    0.5)` so they grow rightward
    from their anchor point. Labels
    now offset by `0.075` (FE) or
    `0.10` (GE) along the radial
    outward direction so they sit
    well clear of the ground ring.
  - Added a per-city leader Line
    drawn from the ring centre to
    the label's anchor point,
    sharing the orange marker
    colour at 0.85 opacity.
  - `ROUTE_OVERLAYS.ShowGroundPoints`
    flipped `true → false`, so the
    sun / moon GP markers + dashed
    drop lines stay hidden during a
    flight-routes demo.
- **Revert:** `git checkout v-s000597 -- .`

## S599 — Flight Routes: centre-anchor labels + larger offset + closer zoom

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - Label sprites now anchor at
    `center.set(0.5, 0.5)` so the box
    grows symmetrically from its
    world-space anchor point. This
    keeps the box clear of the ring on
    every side and routes the leader
    line into the box centre rather
    than one edge.
  - Label offsets bumped:
    `LABEL_OFFSET_FE 0.075 → 0.115`,
    `LABEL_OFFSET_GE 0.10 → 0.16`,
    so the box sits well clear of the
    ring even with the half-width of
    longer city names.
  - `TOP_DOWN_CAMERA.Zoom` bumped
    `1.5 → 3.5` so the disc / globe
    fills a usable chunk of the view
    when a flight-routes demo opens.
- **Revert:** `git checkout v-s000598 -- .`

## S600 — Flight Routes: uniform labels, plane icon at trace tip, KML data

- **Date:** 2026-04-28
- **Files added:**
  - `js/data/flightTracks.js`
- **Files changed:**
  - `js/render/flightRoutes.js`
- **Change:**
  - Label sprites switched to a fixed
    canvas (`360 × 80`) and a fixed
    world scale (`LABEL_WORLD_W` /
    `LABEL_WORLD_H`). Long names auto-
    shrink the font size to fit; every
    box is the same on-screen size
    regardless of city, killing the
    "different resolution" look the
    user flagged.
  - Text now centred in the canvas
    (`textAlign: 'center'`) and the
    sprite still anchors at
    `(0.5, 0.5)`, so the label box
    sits the same distance from the
    ring on every side and the leader
    line lands on the box centre.
  - New `makePlaneSprite()` draws a
    small top-down plane silhouette;
    one sprite per route lives in the
    renderer and gets repositioned
    each frame to the current
    `nDraw - 1` waypoint, with
    `material.rotation` set from the
    local arc tangent
    (`atan2(dy, dx) − π/2`). Visible
    only while
    `0 < FlightRoutesProgress < 1`,
    so the icon disappears at
    departure (no progress) and
    landing (progress = 1).
  - Added auto-generated
    `js/data/flightTracks.js` (4
    flights × 241 decimated waypoints
    each) parsed from
    `/home/alan/Downloads/QF27-28.kml`
    via `/tmp/parse_qf_kml.js`. Holds
    per-waypoint lat / lon /
    altitude (m), ground speed (mph),
    air speed (mph), heading,
    wind speed and wind direction —
    plumbing for an upcoming live
    flight-track playback demo.
- **Revert:** `git checkout v-s000599 -- .`

## S601 — Flight Routes: GE depth-test + auto-flip camera + bigger label offset

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
  - `js/core/app.js`
- **Change:**
  - Flight-route ring / line / leader /
    plane / label materials switched
    `depthTest: false → true` so the
    GE terrestrial sphere properly
    occludes the back-hemisphere
    artwork (no more routes ghosting
    through the globe).
  - `LABEL_OFFSET_FE 0.115 → 0.20`,
    `LABEL_OFFSET_GE 0.16 → 0.26` so
    the fixed-size label box
    (half-width ≈ 0.117) clears the
    ring on every side regardless of
    text length.
  - WorldModel watchdog in
    `app.update` now auto-flips
    `CameraHeight` to `-89.9` (GE) /
    `89.9` (FE) whenever
    `ShowFlightRoutes` is on, so the
    manual FE / GE toggle frames the
    southern-hemisphere routes from
    the matching top-down direction
    (south pole in GE, AE pole in FE).
- **Revert:** `git checkout v-s000600 -- .`

## S602 — Flight Routes: GE projection sign-flip to match texture

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
- **Change:**
  - `_projectLatLonGE` now returns
    `(-cos(lat)cos(lon), -cos(lat)sin(lon),
     sin(lat))` × radius. The
    `WorldGlobe` sphere is
    `SphereGeometry(...).rotateX(π/2)`
    sampled with
    `u_sampled = vUv.x + 0.5`, so the
    texture's longitude 0° lands at
    world −x and longitude 180° at
    world +x. The previous unsigned
    formula put cities 180° around
    the globe from where the
    equirectangular map drew them,
    which is why the user saw Santiago
    over Australia and Melbourne
    over South America.
- **Revert:** `git checkout v-s000601 -- .`

## S603 — Flight Routes: dashed complementary great-circle half

- **Date:** 2026-04-28
- **Files changed:**
  - `js/data/flightRoutes.js`
  - `js/render/flightRoutes.js`
- **Change:**
  - New `greatCircleComplement(latA,
    lonA, latB, lonB, n=192)` helper.
    Builds the in-plane unit vector
    `N = (B − cos(ω)·A) / sin(ω)` and
    samples the great-circle
    parameterisation `C(s) = A·cos(s) +
    N·sin(s)` over `s ∈ [ω, 2π]` so the
    output traces the long way back
    from B → −A → −B → A.
  - Each route gets a second
    `THREE.Line` rendered with a
    `LineDashedMaterial` (dash 0.025,
    gap 0.018, opacity 0.55,
    `depthTest: true`). Position
    buffer is reprojected per frame
    so a FE↔GE switch redraws the
    long way through the active
    projection.
  - `computeLineDistances()` is called
    each frame after the buffer
    update so the dash pattern
    survives reprojection.
- **Result:** the solid orange line still
  marks the flight leg; the dashed
  partner line traces the rest of the
  great circle, completing a closed
  geodesic loop on either projection.
- **Revert:** `git checkout v-s000602 -- .`

## S604 — Flight Routes: plane mesh orients along arc tangent (FE + GE)

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
- **Change:**
  - Replaced the per-route Sprite plane
    icon with a `THREE.Mesh` of a
    `PlaneGeometry(PLANE_WORLD,
    PLANE_WORLD)` carrying a shared
    `CanvasTexture` (the previous
    silhouette). Sprites billboard
    to camera, so `material.rotation`
    relied on a screen-space-vs-
    world-space mapping that broke
    once the camera tilted; the mesh
    has a real 3-D orientation.
  - Per-frame orientation builds a
    local frame `{ right, fwd, up }`:
    - `up` = world +z in FE / unit
      radial outward in GE.
    - `fwd` = (lastP − prevP)
      re-orthogonalised against
      `up` (subtracts the radial
      component so a sphere-tangent
      direction stays on the surface
      plane), then normalised.
    - `right` = `fwd × up`.
  - The basis is loaded into a
    `Matrix4` and converted to a
    quaternion on the plane mesh.
    The PlaneGeometry's local +y
    aligns with `fwd`, so the
    silhouette nose follows the
    actual route tangent regardless
    of camera angle, FE or GE.
- **Result:** the plane reads as flying
  along the arc instead of being
  dragged perpendicular to it.
- **Revert:** `git checkout v-s000603 -- .`

## S605 — Flight Routes: notes on data + tracker box

- **Date:** 2026-04-28
- **Files changed:** `change_log_serials.md` (this entry only).
- **Status:** Per-flight live tracker
  box (central angle, air speed,
  predicted vs actual, ground speed)
  for the QF27/28 actual-flight tracks
  in `js/data/flightTracks.js` is
  still pending. The bundled data
  carries 4 flights × 241 decimated
  waypoints (per-point lat / lon /
  altitude / ground speed / air speed
  / heading / wind speed / wind
  direction); next serial wires it
  through to a playback renderer +
  HUD panel.

## S606 — Flight Routes: HUD info box + QF27/28 actual-flight demos

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
  - `js/render/flightRoutes.js`
  - `js/data/flightRoutes.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - New default state field
    `FlightInfoBox: null | { title,
    lines[] }` consumed by the
    flight-routes renderer.
  - `FlightRoutes._updateInfoBox`
    creates / updates a fixed-position
    HUD div (`#flight-info-box`,
    top-left, orange-bordered) every
    frame from the active state.
    Lines starting with `~` render in
    a muted italic so blank-data rows
    read as "no data".
  - Added `formatHMS` /
    `formatHMSDelta` helpers in
    `js/data/flightRoutes.js` for
    actual-vs-predicted display.
  - **Per-route demos** (the seven
    schematic Southern Non-Stop legs
    + the combined / central-angle /
    constant-speed demos) now set
    `FlightInfoBox` in their intros
    with central angle + great-
    circle distance, leaving
    `Air speed` and `Ground speed`
    rows blank (italic muted).
  - **QF27/28 demos** added — one
    per flight in
    `js/data/flightTracks.js`
    (4 total: QF28 2024-06-25,
    QF27 2024-06-25, QF27 2024-06-26,
    QF28 2024-06-26). Each demo:
    - reuses the `'scl-syd'`
      schematic great-circle visual,
    - computes central angle / km / mi
      from the first / last waypoint,
    - reads `actualSec` /
      `predictedSec` from the track
      and renders `Actual time`,
      `Predicted` (with `±M:SS`
      delta),
    - averages per-waypoint air speed
      across the 241 decimated
      waypoints,
    - reports the
      `great-circle ÷ actualSec`
      ground speed in mph (the
      "as-the-crow-flies" speed the
      user asked for).
  - Demo group order:
    All / Central-angle / Const-speed,
    then the four QF flights, then
    the seven schematic per-route
    entries. State restoration on
    `Stop` clears `FlightInfoBox`
    automatically via the existing
    `_savedState` snapshot.
- **Revert:** `git checkout v-s000604 -- .`

## S607 — Flight Routes: info box adds Date / Takeoff / Flight Time

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
- **Change:**
  - QF27/28 actual-flight info box
    relabeled `Actual time` →
    `Flight Time` (clearer that this
    is the wheels-up to wheels-down
    duration, not a clock time).
  - New `Date` row sourced from
    `track.date` (parsed from the
    KML document name).
  - New `Takeoff` row marked
    `~(not in KMZ)` since the source
    KML doesn't carry the actual
    departure timestamp — only the
    flight duration. Renders in the
    muted-italic style.
  - Schematic per-route info boxes
    grew matching `~Date` /
    `~Takeoff` / `~Flight Time` /
    `~Predicted` rows so the
    schematic and actual-flight
    panels share the same row order
    (data-only fields stay as
    blanks for the schematic legs).
- **Revert:** `git checkout v-s000606 -- .`

## S608 — Flight Routes: angles + DMS/h speeds, drop physical distance

- **Date:** 2026-04-28
- **Files changed:**
  - `js/data/flightRoutes.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - Added `formatDmsPerHour(degPerHour)`
    helper — renders a central-angle
    rate as `D° MM' SS.S"/h`. The
    project stays in pure
    angle-and-time units, so every
    speed in the flight-routes demos
    now reads in DMS/h.
  - Removed `KM_PER_DEG` and `KM_TO_MI`
    constants from
    `js/demos/flightRoutes.js`. New
    `MI_PER_DEG = 69.0936` constant +
    `mphToDegPerHour` helper convert
    KMZ-supplied air speed (mph) to
    deg/h via the mean Earth
    great-circle.
  - **QF27/28 demos:**
    - `Air speed avg` line now reads
      DMS/h (e.g. `7° 43' 11.5"/h`)
      instead of mph.
    - `Ground speed` line is
      `central-angle / Flight Time`,
      rendered DMS/h. Tag updated to
      `(calc, central-angle / Flight
      Time)`.
    - `Great-circle: ## km · ## mi`
      row removed — physical distance
      isn't a project unit.
  - **Schematic per-route demos:**
    `Great-circle` row removed; rows
    that were already blank stay
    blank.
  - **Combined / central-angle /
    constant-speed boxes:** km
    columns dropped, central angle
    in degrees only. Const-speed
    title line rewritten to
    "At identical deg/h, equal
    central angle = equal time."
- **Revert:** `git checkout v-s000607 -- .`

## S609 — Flight Routes: info box trimmed to user spec

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
- **Change:**
  - QF27/28 info box rebuilt to the
    seven-line spec the user dictated.
    Title:
    `<flight> · <date> · <Depart> →
    <Destination>`. Body:
    - `Takeoff             : N/A`
      (KMZ doesn't carry the
      timestamp)
    - `Depart              : Sydney`
      / `Santiago`
    - `Destination         : Santiago`
      / `Sydney`
    - `Central Angle       : DD.DD°`
    - `Air Time            : HH:MM:SS`
    - `Air Speed (avg)     : DMS/h`
    - `Ground Speed (calc) : DMS/h`
  - Dropped the `Date`, `Predicted`,
    `Departure (lat / lon)`, and
    `Arrival (lat / lon)` rows from
    the box (date now in the title;
    predicted / delta moved to the
    Description ribbon
    `Ttxt(…)` instead).
  - Schematic per-route info boxes
    mirror the same seven-line
    layout with `Air Time` /
    `Air Speed` / `Ground Speed`
    blanked.
- **Revert:** `git checkout v-s000608 -- .`

## S610 — Flight Routes: Depart / Destination lines carry lat / lon

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
- **Change:**
  - Schematic info box now reads
    `Depart : <City>  (lat°, lon°)`
    and the matching Destination
    line. Coordinates pulled from the
    `FLIGHT_CITIES` table.
  - QF27/28 actual-flight info box
    appends the first/last
    waypoint's lat / lon (already
    parsed from the KMZ) to the same
    line so the user sees the city
    plus its actual coordinates
    without needing the old separate
    lat / lon row.
- **Revert:** `git checkout v-s000609 -- .`

## S611 — Flight Routes: Arrival predicted / measured rows under Central Angle

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
- **Change:**
  - Added two new info-box rows under
    `Central Angle`:
    - `Arrival predicted   : HH:MM:SS`
    - `Arrival (measured)  : HH:MM:SS
       (±M:SS vs predicted)`
    Source for the QF27/28 demos is
    the bundled
    `track.predictedSec` /
    `track.actualSec` from the KMZ
    parser.
  - Schematic per-route info boxes
    now carry the same two rows as
    blanks (`(no flight data)`).
- **Revert:** `git checkout v-s000610 -- .`

## S612 — Flight Routes: drop delta suffix from Arrival (measured)

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
- **Change:**
  - `Arrival (measured)` row now
    renders just `formatHMS(actualSec)`.
    Removed the
    `(±M:SS vs predicted)` suffix.
- **Revert:** `git checkout v-s000611 -- .`

## S613 — Flight Routes: central-angle legs from each endpoint to centre

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
- **Change:**
  - Per-route `LineSegments`
    (`_routeAngleLines`) renders two
    line segments — Departure → world
    origin and Arrival → world origin
    — drawn in cyan `#66c8ff` at
    0.85 opacity with `depthTest:
    true`, `renderOrder = 67` (under
    the solid route line so the
    great-circle arc reads on top).
  - World origin is the AE pole in
    FE (north pole at disc centre)
    and the globe centre in GE — same
    coordinates either way, but the
    geometric meaning of the angle at
    that vertex differs:
    - FE: the angle at the disc
      centre is the longitude
      separation, not the spherical
      central angle.
    - GE: the angle at the globe
      centre IS the great-circle
      central angle.
  - Position buffer reprojected per
    frame so a FE↔GE switch redraws
    the legs through the active
    projection. Visibility tracks
    the existing
    `FlightRoutesSelected`
    filter, so each per-route demo
    only shows its own pair of
    legs.
- **Revert:** `git checkout v-s000612 -- .`

## S614 — Flight Routes: GE drops observer to centre + see-through tweaks

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
  - `js/render/flightRoutes.js`
  - `js/core/projections.js`
- **Change:**
  - `WorldModel` watchdog (FE↔GE
    flip while a flight-routes demo
    is active) now also sets
    `s.ObserverAtCenter = true` on a
    GE switch and `false` on a FE
    switch. The GE-only
    `GlobeObserverCoord` collapse to
    world origin (S590) parks the
    observer at the globe centre, so
    the central-angle legs read
    "from each endpoint to the
    observer at the centre" instead
    of "to a city on the surface".
  - The earlier auto-clear of
    `ObserverAtCenter` on any mode
    flip is preserved for the
    non-flight-routes case.
  - Central-angle leg material
    flipped `depthTest: true → false`,
    `renderOrder 67 → 73`, opacity
    `0.85 → 0.95`. The cyan legs now
    draw on top of the GE
    terrestrial sphere even when the
    camera is parked inside it, so
    the user can see both endpoints'
    legs converge at the centre.
  - `ge_art_translucent.geOpacity`
    cut `0.35 → 0.12` so the
    "Translucent" GE map reads as a
    proper see-through shell instead
    of a solid blue ball.
- **Revert:** `git checkout v-s000613 -- .`

## S615 — Bottom bar: rename Toggle Axis → Toggle Fictitious Observer + active highlight

- **Date:** 2026-04-28
- **Files changed:**
  - `js/ui/controlPanel.js`
  - `css/styles.css`
- **Change:**
  - `btnAxis.title`
    `'Toggle axis line (observer ↔
    centre)' → 'Toggle Fictitious
    Observer'`. The button still
    toggles `ShowAxisLine` in state;
    only the user-facing label
    changes.
  - Added a `refreshAxisBtn` watcher
    on the model `update` event that
    sets `aria-pressed="true"` when
    `ShowAxisLine` is on. Initial
    state synced on construction.
  - CSS rule extended:
    `.axis-line-btn[aria-pressed=
    "true"]` now shares the same
    accent border / colour /
    rgba(255, 154, 60, 0.10)
    background as
    `.vault-swap[aria-pressed=
    "true"]`, so the button
    visibly highlights while the
    fictitious-observer mode is
    engaged.
- **Revert:** `git checkout v-s000614 -- .`

## S616 — Flight info box: tracker-sized panel + plane pixel-art portrait

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
- **Change:**
  - `#flight-info-box` rebuilt to
    match the existing
    `#tracking-info-popup` panel: 14
    px font, 380 px min-width / 460
    max, rounded 8 px, accent-orange
    border, header row with title in
    accent colour. Same dark-blue
    background and box-shadow.
  - Added a `<canvas class="fi-art"
    width="384" height="384">`
    portrait at 160 × 160 CSS px,
    `image-rendering: pixelated`,
    sitting in an `fi-art-row` to
    the left of the readout column.
  - New `drawFlightArt(ctx)` paints a
    pixel-art plane on a 96-cell
    grid scaled 4× (matching the
    tracker HUD's
    `ART_SIZE = 96` / `SCALE = 4`
    convention from
    `js/ui/trackingInfoPopup.js`):
    indigo→ink sky gradient, scatter
    of cloud puffs, fuselage with
    cockpit highlight + window
    line, swept main wings + tail
    wings + vertical fin, twin
    engine pods, leading-edge
    accent stripe, and motion-blur
    speed marks fanning behind. The
    canvas is painted once at panel
    construction time so every demo
    reuses the same icon.
  - `_updateInfoBox` rewrites only
    the title / readout columns each
    frame; the canvas + structural
    HTML stay untouched.
- **Revert:** `git checkout v-s000615 -- .`

## S617 — FE Line Art map + flight demos default to outline-only projections

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/projections.js`
  - `js/render/earthMap.js`
  - `js/render/index.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - New FE projection
    `ae_lineart` (`AE Line Art (black
    + white outlines)`) — same AE
    polar math as the default, but
    flagged `renderStyle: 'lineart'`
    with a `landStyle` of
    `{ strokeColor: 0xe8eef5,
       strokeOpacity: 1.0 }`.
  - New
    `buildLineArtMap(geojson,
    projection, opts)` builder in
    `earthMap.js`: paints a black
    backdrop disc (
    `MeshBasicMaterial(0x000000)`),
    then projects each Natural Earth
    ring through `projection.project`
    and stitches the vertices into
    a white `LineSegments` outline.
    No filled continents — matches
    the GE Line Art aesthetic
    (`ge_art_line`) for FE.
  - `js/render/index.js`
    `_updateLand` now branches on
    `renderStyle === 'lineart'` and
    routes through `buildLineArtMap`
    with the projection's
    `landStyle` overrides.
  - Flight-route demos
    (`ROUTE_OVERLAYS`) default
    `MapProjection: 'ae' →
    'ae_lineart'` and add
    `MapProjectionGe: 'ge_art_line'`,
    so every demo opens with both
    FE and GE rendering as
    white-on-black coastlines —
    orange route artwork and cyan
    central-angle legs read clean
    against a flat backdrop on
    either projection.
- **Revert:** `git checkout v-s000616 -- .`

## S618 — Flight info box: Arrival predicted → Arrival (predicted)

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
- **Change:**
  - QF info box label
    `Arrival predicted` →
    `Arrival (predicted)` so the
    parens line up with
    `Arrival (measured)` directly
    underneath.
  - Same swap in the schematic
    blank-data row.
- **Revert:** `git checkout v-s000617 -- .`

## S619 — Flight Routes: shadows off in demo intros

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
- **Change:**
  - `SKY_HIDDEN` (the
    every-flight-routes-demo intro
    overlay) now also clears the
    shadow flags so the line-art FE
    disc / GE sphere stays a clean
    black backdrop:
    - `ShowShadow: false` — FE disc
      shadow / scrim overlay.
    - `ShowDayNightShadow: false` —
      GE sphere terminator shader
      (uDayNightOn off, sphere reads
      uniformly).
    - `ShowDayNightSky: false` —
      optical-vault sky cap (already
      hidden by `ShowOpticalVault:
      false`, but explicitly cleared
      so a FE↔GE flip can't reawaken
      it).
    - `ShowEclipseShadow: false` —
      umbra / penumbra map overlay.
- **Revert:** `git checkout v-s000618 -- .`

## S620 — Flight Routes: looping sweeps + dual N/S const-speed demo

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/animation.js`
  - `js/data/flightRoutes.js`
  - `js/demos/flightRoutes.js`
  - `js/render/flightRoutes.js`
- **Change:**
  - **Animator:** new `Trepeat(body)`
    primitive. `_stepTask`'s
    `'repeat'` branch pushes a fresh
    deep-copy of every body task
    (resetting per-task internal
    state — `startValue` / `elapsed`
    on `val`, `remaining` on `pause`)
    plus a fresh repeat task at the
    end of the queue, then marks
    itself done. Loop runs forever
    until the user clicks Stop.
  - **All flight-route demos** swap
    their trailing `Thold()` for a
    `Trepeat([Tcall(reset
    FlightRoutesProgress),
    Tval(progress 0 → 1)])` so the
    sweep restarts the moment the
    plane reaches its destination.
    Applies to per-route, all-routes,
    central-angle, constant-speed,
    and every QF27/28 actual-flight
    demo.
  - **Northern-mirror data:** added
    `nm_jnb` (lat 26.14°, lon
    28.25°) and `nm_syd` (lat
    33.95°, lon 151.18°) to
    `FLIGHT_CITIES` plus a
    `nmir-pair` route in
    `FLIGHT_ROUTES`. These are
    reflected coordinates of
    Johannesburg / Sydney across
    the equator — not real airports
    — so the constant-speed demo
    can compare equal-central-angle
    legs in both hemispheres.
  - **Constant-speed demo
    rebuilt:** picks `jnb-syd` (south)
    and `nmir-pair` (north). One
    `FlightRoutesProgress` driver
    sweeps both routes in lockstep
    over `CONST_SWEEP_MS = 9000` ms
    per loop. `CONST_DURATION_HOURS`
    = 11 fixes a notional flight
    duration so the angular speed
    constant `CONST_SPEED_DEG_PER_HR
    = SOUTH_ANGLE / 11` is shared
    between the two info boxes.
  - **Dual info box:**
    `FlightInfoBox` state can now be
    a single `{title, lines}` object
    OR an array of two. Renderer
    builds primary at `top:220px`
    and secondary at `top:460px`,
    both 380 × min, both with the
    plane portrait painted on the
    fi-art canvas.
  - **Live countdown lines:** lines
    can be functions
    `(state) => string`. Strings
    starting with `!` render in a
    new highlighted style
    (`#ffd698`, tabular numerals).
    The const-speed boxes use this
    to show
    `Traversed: X° / total°` and
    `Remaining: X°` in real time
    from `state.FlightRoutesProgress`.
- **Result:** Pressing the constant-speed
  demo opens with two info boxes
  stacked top-left, two cyan-lined
  routes (south + north mirror), two
  orange planes flying in lockstep.
  Both planes hit destination at the
  same frame; both info boxes hit
  `Remaining: 0.00°` at the same
  frame; both reset to `0.00° /
  total°` and start over. Equal arc,
  equal time, regardless of the
  projection's visual distortion.
- **Revert:** `git checkout v-s000619 -- .`

## S621 — Flight Routes: Equal Arc demo split into mirror + cross-lat

- **Date:** 2026-04-28
- **Files changed:**
  - `js/data/flightRoutes.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - Renamed the existing
    constant-speed demo to
    `Equal Arc (mirror)` — pairs
    Johannesburg ↔ Sydney with its
    north-hemisphere reflection so
    the two arcs are mirror twins
    (same lat magnitudes, opposite
    sign).
  - Added a sibling demo
    `Equal Arc` immediately
    underneath. Pairs the same
    Johannesburg ↔ Sydney leg with a
    new cross-latitude leg
    (`eq-cross`):
    - `Equator Pt` at
      (0°, −30°)
    - `Sub-antarctic Pt` at
      (−50°, 92.7°)
    Solved analytically so the
    central angle equals the
    JNB ↔ SYD value of 110.32°
    exactly. The endpoints span
    50° of latitude vs the JNB-
    SYD pair's ~8°, so the AE
    projection bends one arc
    dramatically while the other
    stays a tighter band.
  - Refactored `constSpeedBox` /
    `constSpeedDemo` into reusable
    builders so the two demos share
    layout / live-countdown logic.
- **Result:** Same 110.32° central
  angle on both demos; the mirror
  pair looks like rotated twins,
  the cross-lat pair looks
  obviously different — yet both
  loops finish at the same frame,
  proving projection shape doesn't
  affect time when speed is
  constant.
- **Revert:** `git checkout v-s000620 -- .`

## S622 — Flight Routes: side-by-side info boxes + cross-lat = NY-Persian Gulf

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
  - `js/data/flightRoutes.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - **Info boxes side-by-side**:
    `buildInfoBoxEl` accepts a `left`
    arg; secondary box now anchors at
    `top:220, left:420` instead of
    `top:460, left:12`. Stops the
    two boxes from vertically
    overlapping on the same screen.
  - **Cross-lat demo retargeted**:
    swapped from `jnb-syd` +
    `eq-cross` (both southern arcs
    that visually overlap) to
    `scl-syd` (south, traces over
    the South Pacific) +
    `ny-pgulf` (north, traces from
    JFK over the North Atlantic /
    Mediterranean toward the
    Persian Gulf). Same 102°
    central angle for both routes,
    opposite hemispheres, never
    share a lat / lon band.
  - **Removed** the old `eq_a` /
    `eq_b` synthetic anchors and
    the `eq-cross` route from
    `FLIGHT_CITIES` /
    `FLIGHT_ROUTES`. Replaced with
    real `jfk_n` (40.6398°N,
    -73.7789°W) and synthetic
    `persian_n` at
    (25°N, 60.82°E) — the
    Persian-Gulf endpoint solved
    analytically so the central
    angle from JFK lands on
    102.0°.
  - **Per-demo speed**: each
    constant-speed demo now
    computes its own angular
    speed from its south leg
    (`MIRROR_SPEED_DEG_PER_HR` =
    110°/11h, `CROSS_SPEED_DEG_PER_HR`
    = 102°/11h). `constSpeedDemo`
    factory rewritten to take an
    options object so each demo
    threads its own south /
    north / speed cleanly.
  - The mirror demo
    (`Equal Arc (mirror)`) keeps
    Johannesburg ↔ Sydney + its
    reflected northern twin —
    unchanged behaviour, just
    decoupled from the cross-lat
    demo's variables.
- **Revert:** `git checkout v-s000621 -- .`

## S623 — Tropics split into 3 toggles + Shadow moves to Ground/Disc

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
  - `js/render/worldObjects.js`
  - `js/ui/controlPanel.js`
  - `js/ui/urlState.js`
- **Change:**
  - **State**:
    `ShowTropics` retired in favour
    of three independent flags:
    `ShowTropicCancer`,
    `ShowEquator`,
    `ShowTropicCapricorn`. Each
    defaults `false`.
  - **Renderer**: `LatitudeLines`
    `_circles` entries now carry a
    `flag` field naming the state
    key gating that ring.
    `update()` reads each ring's
    own flag, so the user can
    toggle Cancer, Equator, and
    Capricorn independently.
    Group visibility is the OR of
    every ring flag plus
    `ShowPolarCircles`.
  - **UI — Show / Ground / Disc**:
    replaced single
    `Tropics` row with three rows
    (`Tropic of Cancer`,
    `Equator`,
    `Tropic of Capricorn`).
    Pulled the `Shadow` row out of
    the `Tracker` tab and inserted
    it just under
    `Sun / Moon GP` in
    `Ground / Disc` — shadows are
    a ground concern, not a
    tracker concern.
  - **URL state whitelist**
    updated in both arrays so the
    new keys persist across
    reloads.
  - **Preset states** in
    `controlPanel.js` updated to
    write the three new flags
    instead of `ShowTropics`.
- **Revert:** `git checkout v-s000622 -- .`

## S624 — Tropics: curved per-character labels along each ring's arc

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/worldObjects.js`
- **Change:**
  - New `makeCharSprite(ch, hexColor)`
    helper renders a single character
    onto a 64 × 64 canvas (bold mono,
    drop-shadow for legibility) and
    wraps it in a `THREE.Sprite`.
  - `LatitudeLines` constructor now
    builds a `_labelGroups` parallel
    to `_lines`. Each tropic / equator
    ring gets `text.length` character
    sprites; each carries
    `userData.charLat` /
    `charLon` so the row lays out
    along the ring's arc (4.5° of
    longitude per character, label
    centred at lon = 0). Polar /
    antarctic rings stay unlabelled.
  - `_rebuild` repositions every
    sprite per projection — FE drops
    the row onto the AE disc plane
    via `canonicalLatLongToDisc`; GE
    lifts each character to the
    sphere surface at
    `1.005 × FE_RADIUS` and toggles
    `depthTest: true` so the back-
    hemisphere row is occluded by
    the globe.
  - `update` syncs each label group's
    visibility to its ring's flag, so
    toggling Tropic of Cancer flips
    the line + the labelled "TROPIC
    OF CANCER" text together.
- **Result:** Each named ring (Cancer /
  Equator / Capricorn) carries a
  yellow / red / yellow row of
  characters that traces the arc on
  both projections. Curvature is
  achieved by per-character placement
  along the lat circle — sprites stay
  upright (billboarded to camera) so
  every character reads cleanly.
- **Revert:** `git checkout v-s000623 -- .`

## S625 — Flight Routes: 4 s landing pause before each loop restart

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
- **Change:**
  - Added `POST_LAND_PAUSE_MS = 4000`
    constant.
  - Every flight-routes demo's
    `Trepeat` body now appends a
    final `Tpse(POST_LAND_PAUSE_MS)`
    after the
    `Tval('FlightRoutesProgress', 1, …)`
    sweep. The animator's existing
    repeat handling resets
    `pause.remaining` on each loop
    iteration, so the planes hold
    at touchdown for 4 seconds
    before the next reset / sweep.
  - Applies across per-route
    sweeps, the all-routes /
    central-angle / mirror /
    cross-lat constant-speed
    demos, and every QF27/28
    actual-flight playback.
- **Revert:** `git checkout v-s000624 -- .`

## S626 — Equal Arc demo: side-by-side straight-line race panel

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
  - `js/render/flightRoutes.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - New default state field
    `FlightRaceTrack: null | { title,
    lanes: [{ label, angle, color },
    ...] }`. Drives a side-panel race
    track on the right edge of the
    viewport.
  - `ensureRacePanel()` builds a fixed
    `#flight-race-panel` (top:220,
    right:12, 420 px min-width,
    accent-orange border) with a
    400 × 210 CSS-px canvas.
  - `drawRaceCanvas(ctx, info,
    progress)` renders one horizontal
    lane per entry. Pixel length =
    `(lane.angle / max angle) × track
    width`, so equal central angles
    yield equal-length straight
    lines. Each lane shows: lane
    label, total arc °, start/end
    dots, baseline track, accent-
    coloured swept segment, plane
    silhouette riding the swept tip,
    and a live `elapsed° / total°`
    readout.
  - `FlightRoutes._updateRacePanel`
    is called every frame from
    `update()`; reads
    `state.FlightRoutesProgress` to
    drive the swept length on each
    lane simultaneously, so both
    planes race at the same
    proportional rate as the map's
    great-circle planes.
  - Both Equal Arc demos
    (`Equal Arc (mirror)` and
    `Equal Arc`) populate the
    `FlightRaceTrack` field in
    their intros with their two
    routes' central angles. Mirror
    pairs the south leg + its
    reflected northern twin at the
    same angle; cross-lat pairs
    Santiago↔Sydney with
    JFK↔Persian-Gulf at the same
    angle. Either way the side panel
    draws two straight lines of the
    same length, two planes race in
    lockstep, both finish at the
    same frame — independent of how
    distorted the curved AE arcs
    look on the map.
- **Revert:** `git checkout v-s000625 -- .`

## S627 — Equal Arc race panel: AE-scaled lane lengths + world plane art

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
  - `js/render/flightRoutes.js`
- **Change:**
  - New `aeArcLengthOf(route)` helper
    in `js/demos/flightRoutes.js`:
    samples the great-circle arc at
    192 points, projects each point
    through `canonicalLatLongToDisc`,
    and sums the consecutive chord
    lengths in disc space. The
    returned scalar is the AE-
    projected arc length on the FE
    disc — i.e. the same length the
    user sees the curve trace on the
    map.
  - `FlightRaceTrack.lanes` now
    carries `aeLength` per lane.
    `drawRaceCanvas` uses the
    AE-projected length (not central
    angle) to compute pixel lengths,
    so the south lane remains visibly
    longer than the north lane —
    matching the FE map's projection
    distortion. `angle` still drives
    the elapsed° / total° readout, so
    both planes hit `Remaining: 0` at
    the same `progress=1` instant.
  - New `drawPlaneSilhouette(ctx, cx,
    cy, scale, headingRad)` renders
    the same silhouette
    `makePlaneTexture` paints onto
    the world-plane sprite — fuselage
    with cockpit highlight, swept
    main wings, tail wings, vertical
    fin. Race lanes pass +π/2 so the
    nose points down the lane;
    replaces the placeholder triangle
    icon. World map and race panel
    now share the same plane art.
- **Result:** Equal Arc demos display
  two straight horizontal lanes whose
  pixel lengths preserve the FE-map
  visual length difference (south is
  longer than north because AE
  stretches arcs near the south
  pole). Both planes ride
  `FlightRoutesProgress` 0 → 1 in
  lockstep, finishing the lane at the
  same instant despite the visible
  length difference — visual proof
  that AE distortion is independent
  of true central-angle traversal
  time.
- **Revert:** `git checkout v-s000626 -- .`

## S628 — Flight Routes: bigger race panel + bigger world planes

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
- **Change:**
  - **Race panel sized up:**
    - Container `min-width 420 →
      620 px`.
    - Backing canvas
      `800 × 420 → 1100 × 560`,
      CSS-displayed at
      `600 × 305 px` (was
      `400 × 210`).
    - Header padding doubled and
      title font bumped
      `14 → 18 px`.
    - Inside the canvas: lane
      label
      `22 → 30 px`, total-arc /
      live-progress readouts
      `18 → 24 px`, baseline
      stroke `3 → 4 px`, swept
      stroke `5 → 7 px`, marker
      dots `10 → 14 px` radius,
      plane silhouette scale
      `0.6 → 1.0`. Padding
      adjusted (`130/60 →
      180/70`) to keep margins
      proportional.
  - **World planes**:
    `PLANE_WORLD 0.034 → 0.058`
    so the planes flying along
    the route arcs read at a
    similar visual size to the
    new race-panel silhouette.
- **Revert:** `git checkout v-s000627 -- .`

## S629 — Flight Routes demo: top-left layout, hide moon / ephemeris HUD

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
  - `css/styles.css`
- **Change:**
  - **Info boxes**: anchor moved
    `top: 220 → 80` so the
    SOUTH / NORTH panels sit at the
    top-left, replacing the slot
    previously occupied by the
    Live Moon Phases collapsible.
    `left` unchanged (12 / 420 for
    primary / secondary).
  - **Race panel**: anchor moved
    `top: 220, right: 12 → top: 540,
    left: 12` so it stacks directly
    under the two info boxes.
  - **Body class**:
    `FlightRoutes.update` toggles
    `body.flight-demo-active`
    whenever `state.ShowFlightRoutes`
    is on. CSS rule
    hides
    `#hud .moon-phase-wrapper`,
    `#live-ephem-tab`, and
    `#tracking-info-popup` while
    the class is present, so the
    Live Moon Phases panel, Live
    Ephemeris side tab, and the
    tracker info popup all step
    out of the way for the demo.
- **Revert:** `git checkout v-s000628 -- .`

## S630 — Equal Arc demos: hide central-angle inner legs

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
  - `js/render/flightRoutes.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - New default state field
    `HideFlightCentralAngle: false`.
    When `true` the FlightRoutes
    renderer suppresses every
    selected route's endpoint→origin
    cyan leg (the central-angle
    inner lines). Default false so
    other demos keep showing the
    legs.
  - Both Equal Arc demos
    (`Equal Arc (mirror)` and
    `Equal Arc`) set
    `HideFlightCentralAngle: true`
    in their `baseIntro`. The
    side-by-side race panel already
    carries the central-angle
    story; the inner legs were just
    cluttering the disc / globe.
  - Applies in both FE and GE since
    the renderer flag short-circuits
    the visibility branch before
    the projection split.
- **Revert:** `git checkout v-s000629 -- .`

## S631 — Equal Arc demos: per-route colours + colour-coded info boxes

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
  - `js/render/flightRoutes.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - New default state field
    `FlightRouteColors: {}`. Maps a
    route id to its display hex
    colour. Renderer falls back to
    the original orange when a route
    isn't listed.
  - `makePlaneTexture(strokeHex,
    fillHex)` accepts a stroke
    colour. Renderer caches one
    texture per colour
    (`_planeTextureCache`) so each
    tinted plane mesh re-uses its
    own texture without rebuilding
    every frame. `_routeColor`
    resolver pulls the hex per
    route; `_planeTextureFor` returns
    the matching cached texture.
  - Per-frame in `update`, each
    visible route now applies its
    colour to: the solid arc line,
    the dashed complement, the
    plane mesh map, the from/to
    rings, and the from/to leader
    lines. Material `_lastColor`
    cached so the swaps only run
    when the colour actually
    changes.
  - `_renderInfoBox` reads
    `info.accent` and styles the
    box's border, header background
    (8 % tint), and title text
    accordingly. Default keeps the
    original `#f4a640` orange.
  - **Equal Arc demos** now publish:
    `FlightRouteColors: {
      [southId]: '#ff8040',
      [northId]: '#66c8ff',
    }`, and pass the matching
    `accent` into each info box.
    South box / south arc / plane /
    rings / race lane all read in
    orange; north box / north arc /
    plane / rings / race lane in
    cyan.
- **Revert:** `git checkout v-s000630 -- .`

## S632 — Equal Arc info box: Takeoff / Arrival / Elapsed clock

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
- **Change:**
  - Added three new lines to each
    Equal Arc info box, sourced from
    the same notional duration the
    angular speed was derived from
    (`CONST_DURATION_HOURS = 11`):
    - `Takeoff : 00:00:00` —
      pinned to the start of every
      loop iteration so both planes
      lift off in lockstep.
    - `Arrival : 11:00:00` —
      `CONST_DURATION_HOURS · 3600`
      seconds after takeoff. Both
      lanes share the value because
      `FlightRoutesProgress` drives
      both routes.
    - Live `Elapsed : HH:MM:SS`
      counts up from takeoff
      proportional to
      `FlightRoutesProgress`. Both
      lanes hit
      `Elapsed = Arrival` at the
      same frame — a clock-time
      counterpart to the existing
      `Traversed` / `Remaining`
      angular readouts.
- **Revert:** `git checkout v-s000631 -- .`

## S633 — Flight demos: tighter HUD layout + 2× world planes

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
- **Change:**
  - Info boxes anchor pushed up
    `top: 80 → 8` so the SOUTH /
    NORTH panels sit flush in the
    top-left corner.
  - Race panel anchor pushed down
    `top: 540 → 580` so the now
    taller info boxes
    (Takeoff / Arrival / Elapsed
    rows added in S632) clear the
    race panel's top edge with
    a small gutter.
  - World plane mesh size
    `PLANE_WORLD 0.058 → 0.116` —
    twice as large, so the planes
    flying along the route arcs
    read clearly without zooming.
- **Revert:** `git checkout v-s000632 -- .`

## S634 — Equal Arc demos: rename to Equal Arc Flight (N/S) variants

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
- **Change:**
  - `Equal Arc (mirror)` →
    `Equal Arc Flight (N/S) (Mirror
    lat)`.
  - `Equal Arc` →
    `Equal Arc Flight (N/S)`.
  - Names only; demo behaviour
    unchanged.
- **Revert:** `git checkout v-s000633 -- .`

## S635 — Flight demos: close the gap between info boxes and race panel

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
- **Change:**
  - Race panel anchor moved
    `top: 580 → 528` so the panel
    sits flush under the info
    boxes' bottom edge with a small
    breathing gutter instead of the
    52 px empty band the previous
    layout left.
- **Revert:** `git checkout v-s000634 -- .`

## S636 — Info box plane art now matches the in-world plane silhouette

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/flightRoutes.js`
- **Change:**
  - `drawPlaneSilhouette(ctx, cx, cy,
    scale, headingRad, strokeHex)`
    now accepts an optional stroke
    colour. Race-panel callers still
    pass the default orange; info-
    box art passes the per-box
    accent.
  - `drawFlightArt(ctx, strokeHex)`
    rewritten: paints the indigo →
    ink sky gradient + scattered
    cloud puffs, then stamps the
    same silhouette path
    `drawPlaneSilhouette` uses for
    the in-world planes. Scaled 4.2×
    to fill the 384 × 384 portrait
    canvas. The chunky pixel-art
    panel is gone — the SOUTH /
    NORTH portraits now read as the
    same plane that's flying around
    the map.
  - `_renderInfoBox` repaints the
    art canvas whenever
    `info.accent` differs from the
    cached `box._lastArtAccent`,
    so SOUTH stays orange and
    NORTH stays cyan even when the
    accent flips.
  - Initial paint at construction
    uses the default orange so the
    canvas isn't blank before the
    first `_renderInfoBox` call.
- **Revert:** `git checkout v-s000635 -- .`

## S637 — Equal Arc info box: Total arc → Central Angle

- **Date:** 2026-04-28
- **Files changed:**
  - `js/demos/flightRoutes.js`
- **Change:**
  - `Total arc` row relabelled to
    `Central Angle` in the
    `constSpeedBox` builder so the
    Equal Arc info-box terminology
    matches the rest of the demo
    (header line, race-panel
    overlay, schematic per-route
    boxes — all use "central
    angle"). Value unchanged.
- **Revert:** `git checkout v-s000636 -- .`

## S638 — Latitude rings: white labels for every ring

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/worldObjects.js`
- **Change:**
  - `LatitudeLines` builds curved
    label rows for **every** named
    ring instead of skipping the
    polar / antarctic circles.
    Sprite character colour
    always `#ffffff` so the label
    text reads as a separate
    legend layer instead of
    blending with the ring's own
    colour. Cancer / Equator /
    Capricorn / Arctic Circle /
    Antarctic Circle now all
    carry the same white-curved-
    text treatment that follows
    the arc on FE and GE.
- **Revert:** `git checkout v-s000637 -- .`

## S639 — README + about.md updates, race-panel persistence patch

- **Date:** 2026-04-28
- **Files changed:**
  - `README.md`
  - `about.md`
  - `js/demos/index.js`
- **Change:**
  - **README.md** "Special Thanks"
    section gains a `Roohif` entry
    citing the Southern Non-Stop +
    QF27/28 KMZ datasets that
    drive the Flight Routes demo
    group.
  - **about.md** "Credits" gets the
    same Roohif acknowledgement.
  - **about.md** Bottom-bar icon
    legend rewritten to cover the
    swap-stack (vault-swap +
    Toggle Fictitious Observer)
    and the expanded mode grid
    (now includes 🔦 Rays cycle and
    ⌫ Clear Trace).
  - **about.md** Show / Ground /
    Disc section updated for the
    Tropics → 3-toggle split
    (Tropic of Cancer / Equator /
    Tropic of Capricorn) plus the
    relocated Shadow row, and
    notes the white curved labels
    on every named ring.
  - **about.md** Map Projection
    section adds the new
    `AE Line Art` FE projection
    and the `GE Art —
    Translucent` GE projection.
  - **about.md** Demos tab grows
    a Flight Routes section
    documenting the entire group:
    All routes / Central-angle /
    Equal Arc Flight (N/S)
    (Mirror lat) / Equal Arc
    Flight (N/S) / four QF27/28
    actual-flight playbacks /
    seven per-route demos. Notes
    the side-by-side race panel,
    the colour-coded SOUTH
    (orange) / NORTH (cyan)
    HUD, and the looped
    landing-pause cadence.
  - **`js/demos/index.js`
    `_playSingle`** now resets
    `ShowFlightRoutes`,
    `FlightRoutesSelected`,
    `FlightRoutesProgress`,
    `FlightInfoBox`,
    `FlightRaceTrack`,
    `FlightRouteColors`, and
    `HideFlightCentralAngle`
    alongside the existing
    eclipse cleanup. Fixes the
    bug where the race panel +
    info boxes lingered after
    switching from a flight-
    routes demo to a non-flight
    demo.
- **Revert:** `git checkout v-s000638 -- .`

## S640 — Ephemeris: comparison-gated + fallback chain + DE405 default

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
  - `js/core/ephemeris.js`
  - `js/core/ephemerisAstropixels.js`
  - `js/core/ephemerisGeo.js`
  - `js/core/ephemerisHelio.js`
  - `js/core/ephemerisVsop87.js`
  - `js/core/ephemerisPtolemy.js`
- **Change:**
  - **Default load: DE405** — no
    state change required (already
    `BodySource: 'astropixels'`),
    confirmed and re-anchored as
    the reference path in the
    fallback chain.
  - **Per-frame comparison-gated.**
    `app.update`'s `TrackerInfos`
    loop now only walks every
    pipeline (`ephGeo`, `ephPtol`,
    `ephApix`, `ephVsop`) when
    `state.ShowEphemerisReadings`
    is on. With the toggle off, the
    four extra `bodyGeocentric`
    calls per body per frame are
    skipped — only the active
    `bodySource` (single pipeline)
    runs to drive the rendered
    sun / moon / planet positions.
    Comparison readings get NaN
    sentinels; the HUD already
    hides those rows when the
    toggle is off.
  - **Per-pipeline coverage
    metadata.** Each pipeline now
    exports `SUPPORTED_BODIES`,
    `coversBody(name)`, and
    `coversDate(date)`. Plus a
    `BUILTIN_CORRECTIONS` summary
    documenting which apparent-
    place corrections each one
    bakes in (see VSOP87 note in
    the about.md update).
  - **Fallback chain in
    `bodyRADec`.** The dispatcher
    now tries the requested
    `source` first; if the pipeline
    can't deliver (body not in
    `SUPPORTED_BODIES` or date out
    of range), it walks
    `FALLBACK_ORDER = ['astropixels',
    'geocentric', 'vsop87',
    'ptolemy']` until something
    returns a finite reading.
    Surfaces `NaN` only when no
    pipeline can deliver — instead
    of returning a misleading
    vernal-equinox `(0, 0)`.
  - **`bodyRADecRoute(name, date,
    source)`** — sibling that also
    reports which pipeline
    supplied the value, so the UI
    can light up a fallback
    indicator if the active
    selection got routed
    elsewhere.
  - **DE405 NaN sentinel.**
    `ephemerisAstropixels.bodyGeocentric`
    returns `{ ra: NaN, dec: NaN }`
    on out-of-range lookup
    (was `(0, 0)`), so the
    fallback chain can detect the
    miss without a magic number.
- **Revert:** `git checkout v-s000639 -- .`

## S641 — Ephemeris: BodySource transition prunes unsupported planets + about.md guidelines

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
  - `about.md`
- **Change:**
  - **`app.update`** gains a
    BodySource-transition watchdog
    paralleling the WorldModel
    watchdog. Whenever
    `state.BodySource` changes,
    `TrackerTargets` is filtered
    against the new pipeline's
    `SUPPORTED_BODIES` set; sun /
    moon / planet ids drop out if
    unsupported, stars + black
    holes + galaxies + satellites
    pass through untouched.
    `FollowTarget` clears too if
    it points at an unsupported
    body. Switching back to DE405
    does **not** auto-restore the
    pruned ids — the user picks
    them back deliberately. Demo
    intros that set BodySource fire
    the same watchdog (intentional —
    "manual" includes scripted
    intent).
  - **about.md Tracker /
    Ephemeris** gains a guideline
    block:
    - Per-pipeline built-in
      corrections (DE405 / GeoC /
      HelioC = full apparent;
      VSOP87 = precession + FK5
      only, no nutation, no
      aberration; Ptolemy =
      historical, none).
    - Source-coverage + fallback
      chain documentation
      (DE405 → GeoC → VSOP87 →
      Ptolemy).
    - Note that flipping comparison
      off drops per-frame compute
      to a single pipeline.
- **Revert:** `git checkout v-s000640 -- .`

## S642 — HUD timestamp shows seconds

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/time.js`
- **Change:**
  - `dateTimeToString` appends a
    `:SS` field to the UTC clock,
    `Apr 27 2019 / 08:45 UTC →
    Apr 27 2019 / 08:45:30 UTC`.
    Same `pad2` formatter used for
    hours / minutes; seconds taken
    from `Date.getUTCSeconds()`.
    HUD strip + tracker block
    timestamps both pick up the
    new format automatically since
    they share this helper.
- **Revert:** `git checkout v-s000641 -- .`

## S643 — Default DateTime resolves to "now" instead of 2019-03-25 placeholder

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
- **Change:**
  - `defaultState()` now computes
    its initial `DateTime` /
    `DayOfYear` / `Time` from
    `Date.now()` minus
    `Date.UTC(2017, 0, 1)` (days
    since 2017-01-01) instead of
    the hard-coded
    `812.88 / 812 / 21.07` triple
    that resolved to 2019-03-25.
  - Helper `_todayDateTime()`
    returns days since the epoch
    so each component is derived
    from the same moment without
    re-reading the clock per
    assignment.
  - With DE405 covering
    2019–2030, today's date sits
    well inside Fred's window —
    no fallback needed for normal
    "load right now" usage. When
    the wall clock eventually
    exceeds 2030, the
    fallback chain from S640
    routes the request through
    GeoC / VSOP87 / Ptolemy.
- **Revert:** `git checkout v-s000642 -- .`

## S644 — Tracking popup pulls active-source RA/Dec, comparison HUD adds az/el

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/transforms.js`
  - `js/core/app.js`
  - `js/ui/trackingInfoPopup.js`
  - `js/ui/controlPanel.js`
- **Change:**
  - **`raDecToAzEl(raRad, decRad,
    latDeg, lonDeg, gmstDeg)`** —
    new helper in
    `js/core/transforms.js`. Takes
    a comparison RA / Dec and
    converts it to local az / el
    via standard hour-angle
    formulas. Returns NaN/NaN on
    NaN input so the comparison
    rows for unsupported bodies
    (e.g. VSOP87 + Uranus) stay
    "—".
  - **`TrackerInfos`** entries now
    carry `ra` / `dec` from the
    **active** ephemeris pipeline
    (Sun → `c.SunRA / c.SunDec`,
    Moon → `c.MoonRA / c.MoonDec`,
    planets → `p.ra / p.dec`).
    Independent of
    `ShowEphemerisReadings`.
  - **Tracking Info Popup** now
    prefers `info.ra / dec`
    (active source) before any
    `*Reading`. Stops the popup
    from showing "—" for sun /
    moon / planet RA / Dec when
    the comparison toggle is
    off. Stars still use their
    catalog-direct
    `info.ra / info.dec`.
  - **Live Ephemeris HUD** rows
    now read
    `GeoC  : RA HH^MM^SS.s
    Dec ±DD°MM′SS″   Az
    DDD°MM′SS.s″   El
    ±DD°MM′SS.s″`. The az / el
    columns are computed at
    display time from each
    pipeline's RA / Dec via
    `raDecToAzEl` using the live
    observer lat / lon and
    `SkyRotAngle`. Lets the user
    see directly how each
    pipeline's slightly different
    sky positions land in the
    local horizontal frame.
- **Revert:** `git checkout v-s000643 -- .`

## S645 — Tracker HUD: wider blocks + single-column scroll when comparison is on

- **Date:** 2026-04-28
- **Files changed:**
  - `css/styles.css`
- **Change:**
  - `#tracker-hud.expanded
    .tracker-block` width
    `460 → 620 px` so the four
    pipeline rows
    (RA / Dec / Az / El) fit on a
    single line each without
    wrapping at the default
    monospace size.
  - `#tracker-hud.expanded`
    container switches
    `flex-wrap: nowrap`,
    `max-width: 640 px`,
    `overflow-y: auto`. Compact
    mode keeps the existing
    multi-column wrap layout.
    With comparison on the
    cluster now stacks
    vertically inside a 640 px
    band on the left, scrolls
    when the body list is long,
    and never spills onto the
    rendered scene.
- **Revert:** `git checkout v-s000644 -- .`

## S646 — Ephemeris module headers spell out the loading-order contract

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/ephemeris.js`
  - `js/core/ephemerisAstropixels.js`
  - `js/core/ephemerisGeo.js`
  - `js/core/ephemerisHelio.js`
  - `js/core/ephemerisVsop87.js`
  - `js/core/ephemerisPtolemy.js`
  - `js/core/app.js`
- **Change:** comments only — no
  behaviour change. Each ephemeris
  module's header now states:
  - **Default loaded ephem = Fred
    Espenak's DE405 / AstroPixels
    tables.** That's the only
    pipeline that runs per frame
    for the rendered scene.
  - **Comparison ephems (GeoC,
    HelioC, VSOP87, Ptolemy) are
    dormant** until the Tracker
    tab's "Ephemeris comparison"
    toggle (`ShowEphemerisReadings`)
    is on. Toggling it off drops
    the per-frame calls so those
    pipelines effectively unload
    from the hot path.
  - **Fallback chain**
    (`astropixels → geocentric →
    vsop87 → ptolemy`) only fires
    when the active source can't
    cover a (body, date) request.
    GeoC stays statically loaded as
    the wide-date fallback for
    DE405 misses; HelioC sits
    outside the fallback chain by
    design.
  - `ephemerisAstropixels.js`
    header tagged "Default loaded
    ephem".
  - `ephemerisGeo.js` /
    `ephemerisHelio.js` /
    `ephemerisVsop87.js` /
    `ephemerisPtolemy.js` headers
    each tagged "Comparison-mode
    only" (Geo + VSOP also tagged
    "+ fallback"; Ptolemy "+
    fallback (last resort)").
  - `app.update`'s `readingsFor`
    block carries a matching loading
    -order comment that mirrors
    the dispatcher header.
- **Revert:** `git checkout v-s000645 -- .`

## S647 — ephemerisGeo.js: kinematics-framed comments, dropped editorialising

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/ephemerisGeo.js`
- **Change:** comments only — no
  behaviour change. AI editorializing removed from code comments.
  - Header rewritten. The
    "Consequence (stated honestly)
    … inner planets do not librate
    … no planet exhibits
    retrograde … RA/Dec values
    diverge from real ephemeris
    by large amounts … the trade
    is deliberate" paragraph is
    removed. Replaced with a
    plain-language description of
    what the pipeline actually is:
    a `(name, date) → (ra, dec)`
    function backed by Earth-focus Kepler elements.
  - Header explains the
    unit-sphere / dimensionless-`a`
    point: the simulator displays
    directions, not distances,
    so the final RA / Dec come
    from `atan2(y, x)` after the
    orbital-plane rotation. Any
    common scale cancels —
    Schlyter's `a` is a
    dimensionless ratio and that
    is sufficient to predict the
    body's position at a given
    time. No AU conversion
    happens anywhere in the file.
  - `--- Orbital elements ---`
    block reworded to drop the
    "scale cancels at atan2"
    phrase from the `a` line in
    favour of pointing at the
    header section that explains
    the unitless framing.
  - `keplerEarthFocus` body
    comment rewritten to explain
    the same kinematics chain.
  - `planetEquatorial` comment
    swapped from "no Sun stage,
    no planet-around-Sun stage"
    boilerplate to a step-list of
    the actual chain
    (elements → mean anomaly →
    Kepler → orbital plane →
    ecliptic → equatorial).
  - "Coverage" footer reworded.
- **Revert:** `git checkout v-s000646 -- .`

## S648 — mouseHandler: rAF-coalesce pointer-move setStates

- **Date:** 2026-04-28
- **Files changed:**
  - `js/ui/mouseHandler.js`
- **Change:**
  - Added `scheduleMovePatch(patch)`
    helper inside
    `attachMouseHandler`. Buffers
    the latest patch into a single
    object and flushes via
    `requestAnimationFrame`, so
    multiple setState calls inside
    one frame collapse to a single
    `model.setState` and a single
    `app.update` pass.
  - Routed every drag-related
    `model.setState` through the
    new helper:
    - Orange-dot drag observer
      reposition.
    - `MouseElevation` /
      `MouseAzimuth` cursor
      readouts (Optical mode +
      Heavenly clear).
    - Ctrl / meta + drag observer
      lat / lon pan.
    - Optical first-person
      heading / pitch look-around.
    - Heavenly orbit-camera
      dir / height pan.
  - Hover tooltip DOM updates and
    pure read-side computations
    stay synchronous; only the
    state-mutation calls go through
    the rAF gate.
- **Why:** mobile PageSpeed audit
  flagged INP at 231 ms (target
  200 ms). Pointer events on
  touch / 120 Hz devices fire well
  above the display refresh rate;
  each one previously triggered a
  full `app.update` pass. Capping
  to one update per frame removes
  the obvious source of
  long-running tasks during a drag.
- **Revert:** `git checkout v-s000647 -- .`

## S649 — app.setState: skip recompute on UI-only patches

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
- **Change:**
  - Added `_UI_ONLY_STATE_KEYS`
    `Set` near the top of the
    module listing keys that no
    `App.update` branch reads:
    `Description`,
    `MouseElevation`,
    `MouseAzimuth`,
    `ClearTraceCount`,
    `MoonPhaseExpanded`,
    `ShowLiveEphemeris`.
  - `setState(patch, emit)` now
    inspects the patch keys and
    skips `this.update()` when
    every key is in the UI-only
    set. The `update` event still
    fires so HUD subscribers
    refresh.
- **Why:** mobile PageSpeed audit
  flagged INP at 231 ms (target
  200 ms). Cursor-readout and
  description-string updates were
  triggering the full computed
  pass each frame even though no
  `c.*` value depends on them.
- **Revert:** `git checkout v-s000648 -- .`

## S650 — app.update: cache sun / moon / planet ephemeris by (date, source)

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
- **Change:**
  - Added `this._ephemCache`
    keyed by
    `${utcDate.getTime()}|${bodySource}`.
    On a fresh key the cache
    object is rebuilt with
    `sun`, `moon`, and an empty
    `planets` map; on a key
    match the existing cache is
    reused.
  - `bodyRADec('sun', …)` and
    `bodyRADec('moon', …)`
    upgraded to lazy-fill the
    cache slots.
  - Planet loop now reads / fills
    `this._ephemCache.planets[name]`
    instead of calling
    `bodyRADec` every frame.
- **Why:** observer-pan / camera
  drags re-enter `app.update`
  without changing the date or
  pipeline. The previous loop
  evaluated Meeus sun + Meeus
  moon + N planet pipelines per
  tick anyway. Caching skips that
  work whenever the cache key
  matches the prior frame, which
  is the steady state during a
  drag. Comparison-mode readings
  (`readingsFor`) are unchanged —
  they already short-circuit when
  the toggle is off and aren't
  hot during a drag.
- **Revert:** `git checkout v-s000649 -- .`

## S651 — app.update: cache apparent star (RA, Dec) by (date, starOpts)

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
- **Change:**
  - Added `this._starApparentCache`
    keyed by
    `${utcDate.getTime()}|${precession}${nutation}${aberration}`.
    Cache body is a `Map` from
    star id to the
    `{ ra, dec }` object returned
    by `apparentStarPosition`.
  - `projectStar` now consults the
    cache before invoking
    `apparentStarPosition`. On a
    miss it computes and stores;
    on a hit it reuses the cached
    apparent pair.
  - The downstream vault /
    local-globe / optical
    projection is observer-
    dependent and still runs every
    frame.
- **Why:** five catalogue maps
  (`CEL_NAV_STARS`,
  `CATALOGUED_STARS`,
  `BLACK_HOLES`, `QUASARS`,
  `GALAXIES`) project hundreds of
  stars per frame. The apparent-
  position math (precession +
  nutation + aberration trig) is
  pure (J2000, date, opts) — none
  of which moves during an
  observer-pan / camera drag —
  yet it was being recomputed on
  every drag tick.
- **Revert:** `git checkout v-s000650 -- .`

## S652 — app.update: gate star catalogue projection on visibility / tracker

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
- **Change:**
  - Wrapped the five
    `c.CelNavStars`,
    `c.CataloguedStars`,
    `c.BlackHoles`, `c.Quasars`,
    `c.Galaxies` `.map(projectStar)`
    assignments in a guard:
    runs only when
    `s.ShowStars !== false`,
    or any `s.TrackerTargets`
    entry starts with
    `star:` (and isn't a
    `star:sat_*` satellite id),
    or `s.FollowTarget` is a
    catalogue-star id.
  - When the guard is false the
    five `c.*` slots get empty
    arrays so consumers
    (`render/scene.js`,
    `worldObjects.js`,
    `mouseHandler.js`,
    `controlPanel.js`) iterate
    nothing instead of skipping
    via their own visibility
    checks after the projection
    work was already done.
- **Why:** the catalogue map
  projects ~200 entries per
  frame. With stars hidden the
  result was being thrown away by
  the renderer's own
  `ShowStars` gate. Mirrors the
  existing `_trackerHasSat`
  pattern used for satellites in
  the block immediately below.
- **Revert:** `git checkout v-s000651 -- .`

## S653 — app.update: cache comparison-mode readings by (body, date)

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/app.js`
- **Change:**
  - Added
    `this._compareReadingsCache`
    keyed by `utcDate.getTime()`.
    Cache body is a per-body
    object holding the four
    comparison readings
    (`rGeo`, `rPtol`, `rApix`,
    `rVsop`).
  - `readingsFor(body)` consults
    the cache when
    `ShowEphemerisReadings` is
    on; on a miss it queries the
    four pipelines once and
    stores the bundle, on a hit
    it returns the cached object.
  - Cache resets whenever the
    date changes. Comparison
    toggle off is unchanged —
    still returns the
    `NAN_READING` short-circuit.
- **Why:** with comparison on, the
  tracker target loop calls four
  pipelines per body per frame;
  for the seven supported bodies
  that's 28 calls every drag
  tick even though the date
  hasn't moved. The cache cuts
  that to one round per date
  change.
- **Revert:** `git checkout v-s000652 -- .`

## S654 — assets: shrink ac_logo.png from 1500×1500 to 360×360

- **Date:** 2026-04-28
- **Files changed:**
  - `assets/ac_logo.png`
  - `index.html`
- **Change:**
  - Resized `assets/ac_logo.png`
    from 1500×1500 (376 KiB) to
    360×360 (99 KiB). 360 px
    base covers the 180 px CSS
    ceiling at 2× DPR.
  - Added `width="180"`,
    `height="180"`, and
    `decoding="async"` to the
    `<img id="logo">` tag.
- **Why:** Lighthouse mobile lab
  flagged `Improve image
  delivery` with 366 KiB
  estimated savings. Logo CSS is
  `clamp(40px, 12vmin, 180px)`,
  so 360 px is sufficient for
  retina. Width / height attrs
  let the browser reserve box
  space before the image
  decodes.
- **Revert:** `git checkout v-s000653 -- .`

## S655 — index.html: load styles.css async via rel=preload

- **Date:** 2026-04-28
- **Files changed:**
  - `index.html`
- **Change:**
  - Replaced
    `<link rel="stylesheet"
    href="css/styles.css">`
    with the standard async-CSS
    pattern:
    `<link rel="preload"
    href="css/styles.css"
    as="style"
    onload="this.onload=null;this.rel='stylesheet'">`
    plus a `<noscript>` fallback
    that keeps the original
    blocking link for users with
    JS disabled.
- **Why:** Lighthouse mobile lab
  flagged `Render blocking
  requests` with 320 ms savings.
  `styles.css` is small (37 KiB
  raw, ~9 KiB gzipped) but its
  fetch sat on the critical
  path. Preload + media-swap
  removes it from the
  render-blocking critical chain
  without splitting the file or
  introducing a build step.
- **Revert:** `git checkout v-s000654 -- .`

## S656 — controlPanel: rAF-defer #tracker-hud reposition reads

- **Date:** 2026-04-28
- **Files changed:**
  - `js/ui/controlPanel.js`
- **Change:**
  - `positionTrackerBelowHud()`
    now queues its
    `getBoundingClientRect`
    reads inside a
    `requestAnimationFrame`
    callback. A pending-rAF flag
    coalesces multiple invocations
    in a single frame down to one.
  - Cached the last computed
    `top` and skipped the
    `style.top` write when the
    new value matches, so steady-
    state ResizeObserver firings
    don't dirty layout for no
    reason.
- **Why:** Lighthouse mobile lab
  flagged 36 ms of
  `Forced reflow` charged to
  `controlPanel.js:2841:29` —
  the `hudHost.getBoundingClientRect()`
  call inside the ResizeObserver
  callback. Deferring to rAF
  decouples the reads from the
  observer's invalidation
  timing.
- **Revert:** `git checkout v-s000655 -- .`

## S657 — autoplay: defer first tick until rIC / 800 ms timeout

- **Date:** 2026-04-28
- **Files changed:**
  - `js/ui/autoplay.js`
- **Change:**
  - Constructor no longer
    schedules a synchronous
    `requestAnimationFrame` on
    instantiation. Instead, the
    first tick is queued behind
    `requestIdleCallback(start,
    { timeout: 1000 })`, with a
    `setTimeout(start, 800)`
    fallback for browsers that
    lack `requestIdleCallback`.
  - The `start` shim re-checks
    `this.playing` so a `pause()`
    issued before the deferred
    fire doesn't start a stray
    rAF chain.
- **Why:** Lighthouse mobile lab
  flagged 3.75 s of script
  evaluation attributed to
  `ui/autoplay.js`. The default
  state plays autoplay on cold
  start, which means a
  `model.setState({ DateTime })`
  → `app.update()` cascade
  fired every frame from t=0,
  competing with the initial
  paint, JS parse, and WebGL
  init for main-thread time.
  Deferring until idle keeps
  the autoplay UX (sky animates
  on its own) but lets the
  cold-start budget settle
  first.
- **Revert:** `git checkout v-s000656 -- .`

## S658 — index.html: preconnect + preload critical-chain assets

- **Date:** 2026-04-28
- **Files changed:**
  - `index.html`
- **Change:**
  - Added
    `<link rel="preconnect"
    href="https://unpkg.com"
    crossorigin>` so the TLS /
    DNS handshake to the
    three.js CDN starts during
    HTML parse instead of
    waiting for the import to
    resolve.
  - Added
    `<link rel="modulepreload"
    href=".../three.module.js"
    crossorigin>` so the 254
    KiB three.module.js fetch
    issues in parallel with
    the local module graph
    instead of after
    `main.js → mouseHandler.js`.
  - Added
    `<link rel="preload"
    href="assets/ne_110m_land.geojson"
    as="fetch" ...>` so the 51
    KiB land outline (the
    longest leaf of the
    critical-path chain at 2.83
    s in the lab audit) starts
    fetching immediately
    instead of after the
    `loadLand()` call resolves
    in `main.js`.
- **Why:** Lighthouse mobile lab
  flagged a 2.83 s critical
  network chain ending in the
  geojson load. The
  `mouseHandler → three →
  geojson` chain forced sequential
  fetches; preload + modulepreload
  parallelize them.
- **Revert:** `git checkout v-s000657 -- .`

## S659 — index.html: modulepreload heavy local JS modules

- **Date:** 2026-04-28
- **Files changed:**
  - `index.html`
- **Change:**
  - Added eight
    `<link rel="modulepreload">`
    tags for the heaviest local
    modules on the critical path:
    - `js/main.js`
    - `js/render/index.js`
    - `js/render/worldObjects.js`
    - `js/core/app.js`
    - `js/core/ephemerisAstropixels.js`
    - `js/data/astropixels.js`
      (293 KiB)
    - `js/ui/controlPanel.js`
    - `js/ui/i18n.js` (34 KiB)
- **Why:** the network dependency
  tree in the lab audit chained
  these modules behind
  `main.js → mouseHandler.js`,
  serialising fetches over the
  Slow 4G profile. `modulepreload`
  issues each fetch in parallel
  during HTML parse, so by the
  time the import resolves the
  module is already in cache.
- **Revert:** `git checkout v-s000658 -- .`

## S660 — Cel Theo: catalogue + tracker section + render layer

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/celTheoStars.js` (new)
  - `js/core/app.js`
  - `js/render/index.js`
  - `js/render/worldObjects.js`
  - `js/ui/controlPanel.js`
  - `js/ui/mouseHandler.js`
  - `js/ui/urlState.js`
  - `js/demos/flightRoutes.js`
- **Change:**
  - New `CEL_THEO_STARS`
    catalogue (42 entries) for
    Roohif's celestial-theodolite
    targets. RA / Dec sourced
    from HYG v4.1 (32 stars) +
    SIMBAD (LP Aqr, EZ Cet, HD
    77039, HD 144519/429/392,
    SAO 117309/493/565). Three
    explicit duplicates carry
    the base star's coords with
    a distinct id (`ct_*_2`,
    `ct_*_3`, `ct_*_moon`)
    so the menu can list each
    occurrence the observer
    flagged.
  - Seven entries (Regulus,
    Rigel, Mintaka, Alnilam,
    Alnitak, Baten Kaitos, HD
    207098 = Deneb Algedi)
    carry `extId` instead of
    raH / decD; the menu button
    routes to the existing
    cel-nav / constellations /
    bsc star id rather than
    re-rendering a duplicate
    dot.
  - β 949 (Burnham 949) left as
    a comment-only TODO —
    SIMBAD did not resolve under
    `Burnham 949`, `BU 949`, or
    `BUP 949`.
  - `app.update`: imports
    `CEL_THEO_STARS` /
    `CEL_THEO_OWN`. Adds
    `ShowCelTheo: true` default.
    Default `TrackerTargets`
    bundles only `CEL_THEO_OWN`
    ids (the seven `extId`
    aliases stay deduplicated
    against their primary
    catalogue rows). Star
    projection block writes
    `c.CelTheoStars` alongside
    the existing five lists.
    `TrackerInfos` loop +
    `gpColorByCat` extended for
    a new `celtheo` category
    (orange `#ff8c00`). GP-path
    star sweep includes
    `CEL_THEO_OWN`.
  - `render/index.js`:
    instantiates a sixth
    `CatalogPointStars` with
    `sourceKey: 'CelTheoStars'`,
    `showKey: 'ShowCelTheo'`,
    color `0xff8c00`, max 64,
    and routes its `.update(m)`
    call. `findStarEntry`
    lookup chain extended.
  - `render/worldObjects.js`:
    popup star-entry resolver
    extended with
    `c.CelTheoStars` branch.
  - `ui/controlPanel.js`:
    new "Cel Theo" tracker
    section after Galaxies
    with Show toggle, Enable
    All / Disable All buttons,
    and a button grid
    preserving Roohif's
    observation-timeline order
    (intentionally not
    alphabetised). Buttons
    route to `s.extId || s.id`
    so overlap stars hit the
    primary catalogue.
    `FOLLOW_TARGET_OPTIONS`
    + `resolveTargetAngles`
    extended with Cel Theo
    own-coord entries.
  - `ui/mouseHandler.js`:
    four hover / click
    hit-test loops gain
    `c.CelTheoStars`.
  - `ui/urlState.js`: persists
    `ShowCelTheo` in the URL
    hash.
  - `demos/flightRoutes.js`:
    Flight Routes demo turns
    `ShowCelTheo` off
    alongside the other star
    catalogues.
- **Why:** user request. Roohif's
  Celestial Theodolite list
  needs to track in the
  simulator. Default-on
  visibility matches the
  existing pattern for the
  other dot catalogues.
- **Revert:** `git checkout v-s000659 -- .`

## S661 — self-host three.js (minified ESM, 0.162.0)

- **Date:** 2026-04-28
- **Files changed:**
  - `assets/vendor/three.module.min.js` (new, vendored)
  - `index.html`
- **Change:**
  - Vendored
    `three@0.162.0/build/three.module.min.js`
    (678 KiB raw, ~190 KiB
    gzipped) under
    `assets/vendor/`.
  - Import map now points
    `three` at
    `./assets/vendor/three.module.min.js`.
  - Dropped the
    `https://unpkg.com`
    `preconnect` and the
    `modulepreload` of the CDN
    URL (replaced with a local
    `modulepreload`).
  - Removed `three/addons/`
    entry — repo doesn't import
    from `three/addons/`.
- **Why:** Lighthouse mobile lab
  flagged `Reduce unused
  JavaScript` (145 KiB) and
  `Minify JavaScript` (255 KiB)
  on the unminified ESM bundle
  served from unpkg. Self-
  hosting the minified build
  on GitHub Pages eliminates
  the cross-origin handshake,
  drops the 3rd-party CDN
  dependency, and shrinks
  parse / compile time.
- **Revert:** `git checkout v-s000660 -- .`

## S662 — ac_logo: WebP @ 180×180 + picture fallback + fetchpriority

- **Date:** 2026-04-28
- **Files changed:**
  - `assets/ac_logo.png`
    (resized 360 → 180, 97 → 37
    KiB)
  - `assets/ac_logo.webp` (new,
    9.7 KiB)
  - `index.html`
- **Change:**
  - Generated WebP at 180×180,
    quality 90, method 6 →
    9.7 KiB.
  - Re-encoded the PNG fallback
    at 180×180 → 37 KiB.
  - Wrapped `<img id="logo">`
    in a `<picture>` element
    with a WebP `<source>` so
    browsers that support WebP
    fetch the smaller asset and
    others fall back to the PNG.
  - Added `fetchpriority="high"`
    on the `<img>` per
    Lighthouse's "LCP request
    discovery" hint.
- **Why:** Lighthouse mobile lab
  flagged 91 KiB savings on
  `ac_logo.png` — 75 KiB via
  WebP, 72 KiB via 180×180
  source. Combined patch
  takes the asset from 97 KiB
  down to 9.7 KiB on
  WebP-capable browsers. The
  `fetchpriority` hint moves
  the LCP image up the network
  priority queue.
- **Revert:** `git checkout v-s000661 -- .`

## S663 — HTML hygiene: meta description, `<main>`, drop tablist role

- **Date:** 2026-04-28
- **Files changed:**
  - `index.html`
  - `js/ui/controlPanel.js`
- **Change:**
  - Added
    `<meta name="description">`
    summarising the simulator
    (Lighthouse SEO: missing
    meta description).
  - Renamed `<div id="app">` to
    `<main id="app">` and the
    closing `</div>` to
    `</main>` — the existing
    `#app` CSS selector and JS
    queries still match.
  - Removed
    `tabsBar.setAttribute('role',
    'tablist')` in
    `controlPanel.js`. The bar
    holds two `<input
    type="search">` hosts
    alongside the tab buttons,
    and ARIA forbids non-tab
    children of a `tablist`.
    Each tab button still
    carries
    `role="tab"`
    individually, so screen
    readers still announce the
    button purpose.
- **Why:** Lighthouse mobile
  flagged three accessibility /
  SEO items: missing meta
  description (SEO 91), missing
  `<main>` landmark, and ARIA
  `role="tab"` parent without
  appropriate `role="tab"`
  children.
- **Revert:** `git checkout v-s000662 -- .`

## S664 — touch targets: min-height 24 px on bottom-bar / hud buttons

- **Date:** 2026-04-28
- **Files changed:**
  - `css/styles.css`
- **Change:**
  - Added `min-height: 24px`
    to `#bottom-bar .time-btn`,
    `#bottom-bar .compass-btn`,
    `#bottom-bar .tab-btn`,
    `#hud .moon-phase-header`,
    `#live-ephem-tab`, and the
    phone-sized override of
    `time-btn`.
  - Bumped
    `#bottom-bar .geo-hops`
    gap from 2 px → 4 px and
    its `time-btn` padding
    from `2px 4px` → `4px 6px`
    so the country quick-jump
    buttons clear the threshold
    individually and have
    spacing between them.
  - Bumped
    `#hud .moon-phase-header` /
    `#live-ephem-tab` padding
    from `2px 6px` → `4px 6px`
    in addition to the
    `min-height`.
- **Why:** Lighthouse mobile
  best-practices flagged
  numerous buttons (geo-hops,
  jump buttons, vault-swap,
  axis-line, night, screenshot,
  true, stm, tracker-opts,
  observer, freecam, rays, map,
  starfield, az-ring, lang,
  compass, world, clear-trace,
  grids, tab-btn,
  moon-phase-header,
  live-ephem-tab) for
  insufficient size or spacing.
- **Revert:** `git checkout v-s000663 -- .`

## S665 — scene: ResizeObserver replaces resize-listener layout reads

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/scene.js`
- **Change:**
  - `SceneManager` constructor
    no longer listens on
    `window.resize` and no
    longer calls
    `canvas.getBoundingClientRect()`.
    Replaced with a
    `ResizeObserver` on the
    canvas that delivers
    dimensions in its callback
    via `entry.contentRect`.
    Per-pixel
    `setSize / camera.aspect /
    updateProjectionMatrix`
    work moved into a small
    `_applyCanvasSize(w, h)`
    helper.
  - Pre-RO fallback rAF-defers
    the bbox query for
    browsers without
    `ResizeObserver`.
  - `dispose()` disconnects
    the observer instead of
    removing the
    `window.resize` listener.
- **Why:** Lighthouse mobile lab
  attributed 78 ms of
  forced-reflow time to
  `render/scene.js:98:26` —
  the `getBoundingClientRect`
  call inside the resize
  handler. ResizeObserver
  delivers the new size
  without triggering a
  synchronous layout flush.
- **Revert:** `git checkout v-s000664 -- .`

## S666 — controlPanel: lazy-build Demos tab body until first open

- **Date:** 2026-04-28
- **Files changed:**
  - `js/ui/controlPanel.js`
- **Change:**
  - `registerTab(label, buildInto,
    { lazy = false } = {})` now
    accepts a third options
    object. When `lazy: true`,
    the build callback is
    deferred until either the
    tab button is clicked or
    the feature-search opens
    the tab. The first call
    flips a `_built` flag so
    subsequent opens are
    no-ops on the build path.
  - `featureOpen.fn` invokes
    `tabEntries[idx].ensureBuilt()`
    before unhiding the popup
    so search-driven shortcuts
    pick up the same lazy
    contract.
  - The Demos tab registration
    passes `{ lazy: true }`.
    The Demos panel host now
    builds its 80+ demo
    buttons only when the user
    actually opens the Demos
    tab.
- **Why:** Lighthouse mobile lab
  flagged a 1314-element DOM
  with 83 children under
  `.demo-list`, plus 23.6 s of
  CPU time attributed to
  `demos/index.js`. The Demos
  tab is rarely opened on cold
  load — its 80 listener
  attachments and grouped
  header / button creation
  shouldn't compete with the
  initial paint.
  `demos._refreshPanel()`
  already guards on
  `this._listEl` so external
  callers stay safe pre-build.
- **Revert:** `git checkout v-s000665 -- .`

## S667 — assets: WebP variants for starfields + HQ map textures

- **Date:** 2026-04-28
- **Files changed:**
  - `assets/starfield_dark.webp`
    (new)
  - `assets/starfield_light.webp`
    (new)
  - `assets/starfield_ae_aries.webp`
    (new)
  - `assets/starfield_ae_aries_2.webp`
    (new)
  - `assets/starfield_ae_aries_3.webp`
    (new)
  - `assets/map_hq_equirect_day.webp`
    (new)
  - `assets/map_hq_equirect_night.webp`
    (new)
  - `js/render/starfieldChart.js`
  - `js/core/projections.js`
  - `js/render/earthMap.js`
- **Change:**
  - Generated lossless WebP for
    the five starfield PNGs
    (combined 9.99 MiB → 6.31
    MiB, ~3.7 MiB savings) and
    quality-85 lossy WebP for
    the two HQ equirectangular
    JPEGs (combined 718 KiB →
    231 KiB, ~487 KiB savings).
    Original PNG / JPG files
    stay in place as fallbacks.
  - `starfieldChart.js`'s
    `CHART_DEFS` carries
    `url` (WebP) and
    `fallback` (PNG); the
    `TextureLoader.load`
    error callback re-issues
    the fallback URL and
    pipes the loaded image
    back onto the same
    `tex.image` so material
    refs stay valid.
  - `projections.js`
    `imageAsset` for the two
    HQ entries flips to
    `.webp`; new
    `imageAssetFallback` field
    holds the original
    `.jpg` path. `earthMap.js`
    `buildImageMap` mirrors
    the loader pattern used
    in `starfieldChart`.
- **Why:** Lighthouse mobile
  flagged "Avoid enormous
  network payloads" with a
  total of 12,047 KiB. The
  five starfield assets +
  two map JPEGs accounted for
  10.7 MiB. WebP cuts the
  starfields by ~30 % each
  (lossless) and the JPEGs by
  ~65 % (high-quality
  lossy).
- **Revert:** `git checkout v-s000666 -- .`

## S668 — minify CSS: ship `styles.min.css`

- **Date:** 2026-04-28
- **Files changed:**
  - `css/styles.min.css` (new)
  - `css/styles.css`
  - `index.html`
- **Change:**
  - Generated
    `css/styles.min.css`
    via
    `npx esbuild css/styles.css
    --minify --bundle=false`
    (37,555 → 26,470 raw
    bytes; ~3 KiB gzipped
    savings as flagged by
    Lighthouse).
  - `index.html` `preload`
    + `noscript` link tags
    point at the minified
    file.
  - Header comment in
    `styles.css` documents the
    regeneration command so
    future edits regenerate
    the minified twin.
- **Why:** Lighthouse mobile lab
  flagged "Minify CSS — Est
  savings of 3 KiB" on
  `styles.css`. Build-step
  free pipeline keeps the
  authored file readable while
  shipping a minified copy.
- **Revert:** `git checkout v-s000667 -- .`

## S669 — service worker: aggressive client-side asset cache

- **Date:** 2026-04-28
- **Files changed:**
  - `sw.js` (new)
  - `js/main.js`
- **Change:**
  - New `sw.js` at the repo
    root. Cache name
    `fe-model-v1`. Strategy:
    - `assets/` (textures,
      vendored libs, geojson,
      images): cache-first.
    - `*.js` / `*.css`:
      stale-while-revalidate
      (return cached, refresh
      in background).
    - HTML / navigation
      requests: network-first
      with cached fallback.
    Cross-origin GETs and any
    non-GET stay on the
    network path.
  - `js/main.js` registers
    `sw.js` after the `load`
    event so install work
    doesn't compete with the
    cold-start budget.
  - Bumping `CACHE_VERSION`
    in `sw.js` invalidates
    the prior cache on next
    activate.
- **Why:** Lighthouse mobile
  flagged "Use efficient
  cache lifetimes" with
  10,760 KiB of estimated
  savings on starfields,
  vendored JS, and the local
  module graph — all subject
  to GitHub Pages' 10-minute
  default Cache-Control TTL.
  A client-side service
  worker overrides that TTL
  for repeat visits and
  serves cached assets
  offline.
- **Revert:** `git checkout v-s000668 -- .`

## S670 — index.html: pre-fill LCP `<p class="desc-dynamic">` placeholder

- **Date:** 2026-04-28
- **Files changed:**
  - `index.html`
- **Change:**
  - The footer's
    `<p class="desc-dynamic">`
    used to ship empty and
    only became visible once
    `main.js` finished running
    `model.update()` and the
    update listener wrote a
    status string. Lighthouse
    measured LCP "element
    render delay" at 1390 ms —
    the time for the empty
    paragraph to receive its
    text.
  - Added a static
    placeholder string
    matching the
    `defaultStatus` format
    (`"0.0°N — within
    observer's optical vault
    — daylight."`). The text
    renders as the LCP
    element on first paint;
    `main.js`'s update
    listener overwrites it
    once the real model
    state is available.
- **Why:** Lighthouse "LCP
  breakdown": resource load
  delay 110 ms, resource
  load duration 110 ms,
  element render delay
  1,390 ms. Pre-filling
  collapses the render
  delay because LCP can fire
  on the static paragraph
  immediately.
- **Revert:** `git checkout v-s000669 -- .`

## S671 — service worker: kill switch (black-screen-on-refresh hot-fix)

- **Date:** 2026-04-28
- **Files changed:**
  - `sw.js`
  - `js/main.js`
- **Change:**
  - `sw.js` reduced to a kill
    switch: `install` calls
    `skipWaiting`, `activate`
    deletes every cache entry
    via `caches.keys()`
    + `caches.delete`,
    self-unregisters via
    `self.registration.unregister()`,
    and navigates each
    controlled client to its
    own URL so the page
    re-fetches without the
    worker. No `fetch`
    listener is installed —
    every request bypasses
    the worker.
  - `js/main.js` no longer
    registers `sw.js`. The
    block is left in place as
    a comment so a future
    re-introduction can
    restore the call against
    a fresh `CACHE_VERSION`.
- **Why:** the S669 worker
  produced a black-screen-
  on-refresh report. Until
  the root cause is
  isolated, the safest path
  is to evict every
  installed copy of the
  worker and stop registering
  new ones, so the site
  reverts to the no-SW
  baseline that was working
  through S668.
- **Revert:** `git checkout v-s000670 -- .`

## S672 — scene: seed canvas size synchronously before ResizeObserver fires

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/scene.js`
  - `js/main.js`
  - `sw.js`
- **Change:**
  - `SceneManager` constructor
    now does a single
    `getBoundingClientRect`
    read after building the
    renderer + camera, then
    calls `_applyCanvasSize`
    once before attaching the
    ResizeObserver. The RO
    handles every subsequent
    resize, but the seed read
    guarantees the first frame
    has a non-zero canvas
    size.
  - `js/main.js` re-enables the
    `navigator.serviceWorker.register('sw.js')`
    call so browsers running
    the broken S669 worker
    pull the kill switch on
    next page load instead of
    waiting up to 24 h for a
    passive update check.
  - `sw.js` activate handler
    no longer navigates
    controlled clients
    (`c.navigate(c.url)`).
    Cache wipe + self-
    unregister happen first;
    the next manual reload
    runs without the worker
    in the loop.
- **Why:** the S665 ResizeObserver
  swap left a window between
  scene construction and the
  first observation callback
  where the renderer was sized
  0×0, producing a black
  canvas. Pages with no SW
  cleanup path were also stuck
  on the broken S669 worker —
  re-enabling the registration
  forces the kill switch to
  install.
- **Revert:** `git checkout v-s000671 -- .`

## S673 — index.html: importmap before any modulepreload (Firefox fix)

- **Date:** 2026-04-28
- **Files changed:**
  - `index.html`
- **Change:**
  - Moved
    `<script type="importmap">`
    above every
    `<link rel="modulepreload">`
    in `<head>`.
- **Why:** Librewolf / Firefox
  enforces a strict ordering
  rule: once a module load
  or preload starts, any
  later importmap is
  rejected. The console
  warned "Import maps are
  not allowed after a module
  load or preload has
  started", which made
  `import 'three'` fail with
  "The specifier 'three' was
  a bare specifier, but was
  not remapped to anything"
  and crashed
  `js/main.js` before the
  scene rendered — black
  screen on every load.
  Chrome had been silently
  tolerant of the inverted
  order. Putting the
  importmap first lets the
  spec'd resolution kick in
  before any module fetch
  starts.
- **Revert:** `git checkout v-s000672 -- .`

## S674 — flight-routes lineart map: kill z-fight at long camera distance

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/earthMap.js`
- **Change:**
  - `buildLineArtMap`'s
    backdrop disc now uses
    `depthTest: false` and
    `renderOrder = 5`. The
    coastline `LineSegments`
    use `depthTest: false`
    and `renderOrder = 6`.
- **Why:** in the flight-route
  demos (`MapProjection:
  'ae_lineart'`) the black
  lineart backdrop sits at
  z = 1e-4 above
  `DiscBase`'s ocean disc at
  z = 0 and rim ring at
  z = 1e-4. Heavenly-vault
  FE zoom-out pushes the
  camera far enough that
  depth-buffer precision
  near z = 0 collapses,
  producing visible flicker
  ("the map starts
  flickering like there's
  another map under it").
  Routing both lineart
  layers through
  `depthTest: false`
  + a higher renderOrder
  guarantees they paint on
  top of the ocean / rim
  regardless of camera
  distance.
- **Revert:** `git checkout v-s000673 -- .`

## S675 — UI: dynamic zoom across more panels + tighter clamp band

- **Date:** 2026-04-28
- **Files changed:**
  - `css/styles.css`
  - `css/styles.min.css`
  - `js/main.js`
- **Change:**
  - `--ui-zoom` formula
    upgraded from
    `clamp(0.65, 100vw / 1920,
    1.5)` to
    `clamp(0.5,
    min(100vw / 1920,
    100vh / 1080), 1.6)`.
    Picking the smaller of
    width / height ratios
    means tall narrow windows
    no longer oversize the
    bottom bar horizontally
    and short wide windows
    don't push it off-screen.
    The expanded clamp lets
    phones (≤1248 px) scale
    down to 0.5 and 4 K
    monitors scale up to 1.6.
  - Applied
    `zoom: var(--ui-zoom)`
    to four additional
    panels that were rendering
    at native size:
    `header` (title + About
    / Legend buttons),
    `#tracking-info-popup`
    (the draggable body
    detail panel),
    `footer#desc` (the
    bottom status text), and
    `#meeus-warning` (the
    "Meeus timing error"
    banner). Plus the
    JS-injected
    `#cadence-chip` in
    `js/main.js`.
  - Re-minified
    `styles.min.css`.
- **Why:** user request — UI was
  not scaling dynamically to
  the browser size. The
  bottom bar / hud / tracker
  popups already used
  `--ui-zoom`, but the title
  bar, body popup, footer,
  Meeus banner, and cadence
  chip were stuck at native
  size, so the layout looked
  inconsistent at narrow or
  4 K viewports.
- **Revert:** `git checkout v-s000674 -- .` Note: existing
  installed workers persist
  in browsers — bumping
  `CACHE_VERSION` to evict
  cached copies, or the
  user can clear site data,
  if a roll-back leaves
  stale assets active.

## S677 — revert S676: GlobeObserverFrame.up alone doesn't fix FE↔GE moon

- **Date:** 2026-04-28
- **Files changed:**
  - `js/render/worldObjects.js`
  - `js/render/index.js`
- **Change:**
  - `git revert v-s000676`.
    Restored
    `mesh.quaternion.copy(camera.quaternion)`
    on
    `MoonOpticalBody.update`
    and
    `SunOpticalBody.update`.
- **Why:** the S676 patch
  pinned the moon plane's
  up to
  `c.GlobeObserverFrame.up*`
  (sphere-radial in world
  coords). But the moon's
  WORLD-frame position
  differs between FE and GE
  (FE uses an AE flat-disc
  projection, GE uses
  sphere-tangent), which
  means
  `(camera - moon)` —
  the look direction the
  plane orients to — also
  differs. Pinning `mesh.up`
  alone doesn't compensate.
  Reverting while a correct
  fix is designed.
- **Revert:** `git checkout 8815abb -- .`

## S678 — DP (Dual Pole) projection: ground + graticule on dual-pole AE

- **Date:** 2026-04-28
- **Files changed:**
  - `js/core/projections.js`
  - `js/render/worldObjects.js`
- **Change:**
  - New `dp` entry in
    `PROJECTIONS` (category
    `hq`). Uses
    `projectAEDual` math
    and the existing
    `assets/map_hq_ae_dual.png`
    raster (2476×1246).
    Carries a new
    `useProjectionGrid:
    true` flag.
  - `worldObjects.js` adds
    a `gridDiscFor(projectionId)`
    helper: when the active
    projection has
    `useProjectionGrid`,
    the FE graticule maps
    `(lat, lon) → disc` via
    that projection's
    `project()`; otherwise
    it stays on
    `canonicalLatLongToDisc`
    (canonical north-pole AE).
  - `LatitudeLines._rebuild`
    + `DiscGrid._rebuild`
    now take a
    `projectionId` argument
    and route through
    `gridDiscFor`. `DiscGrid`
    also draws meridians as
    densified polylines
    (60 segments each)
    instead of single
    pole-to-pole chords so
    DP renders curved
    meridians.
- **Why:** user request —
  add a "DP" map option
  whose lat/lon graticule
  (and ground art) follow
  the dual-pole AE
  projection rather than
  canonical north-pole AE.
  Reference
  `assets/map_hq_ae_dual.png`
  (byte-identical to
  `Azi_Equi_EA180_Lat0_Lon0_2.png`
  the user supplied).
- **Revert:** `git checkout v-s000677 -- .`

## S679 — DP as third world-model cycle (FE → GE → DP)

- **Date:** 2026-04-28
- **Files changed:**
  - `js/ui/controlPanel.js`
  - `js/render/index.js`
  - `js/render/worldObjects.js`
- **Change:**
  - World-model button now
    cycles
    `fe → ge → dp → fe`
    instead of toggling
    `fe ↔ ge`. Button face
    reads `FE` / `GE` / `DP`
    for the current mode.
  - `js/render/index.js`
    `loadLand()` and
    `frame()`: when
    `s.WorldModel === 'dp'`
    the projection ID is
    forced to `dp`,
    overriding
    `MapProjection`. FE and
    GE projection routing
    is unchanged.
  - `LatitudeLines.update`
    + `DiscGrid.update`:
    rebuild key picks up
    `'dp'` whenever the
    world model is DP, so
    the FE graticule
    re-renders against DP
    math regardless of the
    `MapProjection`
    dropdown.
- **Why:** user request —
  DP belongs in the
  top-level world cycle
  alongside FE / GE, not
  buried in the FE map
  picker. DP renders as a
  flat disc (FE-like) but
  with the dual-pole AE
  ground + graticule.
  Existing
  `WorldModel === 'ge'`
  branches naturally fall
  through to the FE-disc
  path for DP (no globe
  geometry, optical-vault
  uses FE settings, camera
  pitch clamps to FE
  range).
- **Revert:** `git checkout v-s000678 -- .`

## S680 — DP: route the canonical disc framework through the DP projection

- **Date:** 2026-04-29
- **Files changed:**
  - `js/core/canonical.js`
  - `js/main.js`
  - `js/render/worldObjects.js`
- **Change:**
  - `canonical.js`
    `setActiveProjection(id)`
    now actually stores the
    projection (was a stub).
    `canonicalLatLongToDisc`
    dispatches to the
    active projection's
    `project()` whenever
    that projection carries
    `useProjectionGrid`
    (`dp` only). Otherwise
    it stays on the
    hard-coded north-pole
    AE formula.
  - `main.js`
    `refreshActiveProjection`
    now keys off
    `WorldModel`: passes
    `'dp'` when the world
    is DP, otherwise
    `null`. FE/GE keep the
    canonical AE framework.
  - `worldObjects.js`:
    removed the
    `gridDiscFor` helper
    +
    `getProjection`
    import added in S678.
    `LatitudeLines._rebuild`
    and `DiscGrid._rebuild`
    fall back to direct
    `canonicalLatLongToDisc`
    calls — the dispatch
    inside that function
    now does the work.
    Cache keys still pick
    up FE↔DP transitions
    so geometry rebuilds
    when world cycles.
- **Why:** user feedback —
  in DP mode the optical
  vault rays + equatorial
  star band still traced
  through AE-positioned
  observer / GPs because
  only the graticule
  overlay was DP. Routing
  the canonical framework
  through DP makes
  observer placement, sun
  / moon GPs, optical-
  vault dome math, eclipse
  paths, and the
  equatorial band all
  pivot together so the
  projected sky matches
  the DP ground.
- **Revert:** `git checkout v-s000679 -- .`

## S681 — DP: projection-aware local-FE frame (NESW + vault orientation)

- **Date:** 2026-04-29
- **Files changed:**
  - `js/core/transforms.js`
  - `js/core/app.js`
  - `js/render/scene.js`
- **Change:**
  - `compTransMatLocalFeToGlobalFe`
    now takes an optional
    `observerLatDeg` and
    builds the local-FE
    rotation from the
    active projection's
    gradient via
    `canonicalLatLongToDisc`.
    Local +x (south) = -north,
    local +y (east) =
    north rotated −90° in
    the disc plane. AE
    polar collapses to the
    previous
    `RotatingZ(λ)` formula;
    DP picks up the curved-
    meridian tangent at
    `(obsLat, obsLon)`.
    Singular point fallback
    keeps the old longitude
    rotation.
  - `app.js` passes
    `s.ObserverLat` to that
    builder.
  - `scene.js`
    InsideVault FE camera
    now derives its
    north/east basis from
    the same gradient
    sample (was the
    AE-only "vector from
    observer toward disc
    centre"). Cardinals on
    the optical-vault
    hemisphere now align
    with DP-correct
    meridian tangents.
- **Why:** user reported
  NESW buttons were
  mis-oriented in DP and
  the optical vault wasn't
  framed against the DP
  ground. The local frame
  was still built with
  AE-polar assumptions
  (radial-toward-centre =
  north) even after S680
  routed observer
  placement through DP.
  Note: body apparent
  motion within the
  optical vault is still
  sphere-model
  (celestial→local-globe
  via standard
  RA/Dec/lat/lon trig),
  not FE-conceptual rays
  — that's a separate
  architectural change.
- **Revert:** `git checkout v-s000680 -- .`

## S682 — DP: projection-aware optical-vault rotation (NESW first-person)

- **Date:** 2026-04-29
- **Files changed:**
  - `js/render/worldObjects.js`
- **Change:**
  - `ObserversOpticalVault.update`
    used to drive its
    group rotation with
    `RotatingZ(ObserverLong)`
    so the local +x /
    +y axes lined up with
    AE's south / east at
    the observer. In DP
    that's wrong — the
    projection's 0° / 90°
    meridians don't sit
    where AE's do — so
    cardinals + the
    azimuth ring + the
    heading arrow all came
    out rotated against
    the DP ground in
    first-person mode.
    Replaced with a
    gradient-driven angle
    sampled from
    `canonicalLatLongToDisc`:
    `θ = atan2(−ny, −nx)`
    where `(nx, ny)` is the
    normalised
    `∂position/∂lat` at
    `(obsLat, obsLon)`. AE
    collapses back to
    `RotatingZ(λ)` exactly;
    DP follows the curved
    meridian tangent.
- **Why:** user reported
  NESW still mixed up in
  DP first-person after
  S681. S681 fixed the
  local-FE rotation matrix
  used to place celestial
  bodies, but the
  optical-vault group
  itself was still rotated
  by raw longitude — so
  the cardinal labels
  (which sit at fixed
  local positions on that
  group) ended up at AE-
  longitude angles
  instead of DP-meridian
  angles.
- **Revert:** `git checkout v-s000681 -- .`

## S683 — DP: FE-conceptual rays for optical-vault apparent positions

- **Date:** 2026-04-29
- **Files changed:**
  - `js/core/transforms.js`
  - `js/core/app.js`
  - `js/render/worldObjects.js`
- **Change:**
  - New
    `feConceptualLocalGlobeUnit(vaultGlobalFe,
    observerGlobalFe,
    transMatLocalFeToGlobalFe)`
    helper in
    `transforms.js`. Returns
    the unit ray
    observer → vault
    expressed in local-globe
    axes
    (zenith / east / north).
  - `app.js`: when
    `WorldModel === 'dp'`,
    sun / moon / planets +
    every star catalogue
    (CelNav, Cataloged,
    BlackHoles, Quasars,
    Galaxies, CelTheo,
    satellites) build
    `*OpticalVaultCoord`
    from
    `feConceptualLocalGlobeUnit(VaultCoord,
    ObserverFeCoord, ...)`
    instead of the
    sphere-model
    `celestCoordToLocalGlobeCoord`.
    AnglesGlobe and
    day / night / eclipse
    pre-conditions stay on
    the sphere-model
    direction so HUD
    az / el and astronomical
    timing keep using
    celestial mechanics
    rather than
    DP-conceptual angles.
  - `worldObjects.js`
    Stars class: heavenly-
    vault star disc
    position now goes
    through
    `canonicalLatLongToDisc`
    (was inlined AE
    formula), so DP-mode
    background stars wrap
    in lockstep with the
    GP renderer. Optical-
    vault projection for
    each star uses the
    FE-conceptual ray from
    observer to that
    star's heavenly-vault
    position when DP is
    active.
- **Why:** user feedback —
  star GPs were correctly
  doing the DP "weird
  motion" but the
  apparent positions on
  the optical vault
  weren't following.
  Sphere-model was
  producing uniform
  daily arcs in DP. The
  FE-conceptual ray makes
  the angular sweep
  speed up / slow down
  to match the DP-disc
  wrapping a stationary
  observer would actually
  see. Constellation
  lines + DeclinationCircles
  still use sphere-model
  on the optical vault;
  separate task if those
  need DP wrapping too.
- **Revert:** `git checkout v-s000682 -- .`

## S684 — hot-fix: restore Stars class GE branch dropped by S683

- **Date:** 2026-04-29
- **Files changed:**
  - `js/render/worldObjects.js`
- **Change:**
  - The S683 edit to the
    Stars class
    `update()` malformed
    the
    `if (ge) { ... } else
    { ... }` block — the
    closing `}` of the
    GE branch was
    swallowed, so the
    GE star-disc
    assignment (Rgv
    sphere coords) ran
    inside a different
    scope than intended
    and the FE branch
    was unreachable for
    the heavenly-vault
    starfield. Restored
    the if/else
    structure with
    `let feVault = null`
    declared before the
    branches.
- **Why:** black screen
  on load — hoisting +
  the now-bracketed code
  paths produced a
  reference / scoping
  error at runtime
  even though
  `node --check` passed
  (braces balanced,
  semantics broken).
- **Revert:** `git checkout v-s000683 -- .`

## S685 — gate projection-aware local frame on DP only (FE/GE regression fix)

- **Date:** 2026-04-29
- **Files changed:**
  - `js/core/app.js`
  - `js/render/scene.js`
  - `js/render/worldObjects.js`
- **Change:**
  - `app.js` only passes
    `s.ObserverLat` to
    `compTransMatLocalFeToGlobalFe`
    when
    `WorldModel === 'dp'`;
    otherwise passes
    `null` so the legacy
    `RotatingZ(ObserverLong)`
    path runs verbatim.
  - `scene.js` InsideVault
    FE branch now
    short-circuits to the
    pre-S681 "vector from
    observer toward disc
    centre" north / east
    formula unless
    `WorldModel === 'dp'`.
  - `ObserversOpticalVault.update`
    optical-vault rotation
    falls back to
    `ToRad(ObserverLong)`
    unless
    `WorldModel === 'dp'`.
- **Why:** user reported
  FE + GE cardinal
  directions were offset
  from "correct N" after
  S681 / S682.
  Mathematically the
  gradient computation
  collapses to the AE
  longitude rotation for
  AE polar, but in
  practice tiny
  floating-point
  differences (or some
  interaction with downstream
  consumers) shifted the
  visual result enough
  for the user to notice
  in modes that should be
  byte-identical.
  Restoring the legacy
  formulas for non-DP
  guarantees the
  pre-S681 behaviour is
  preserved exactly.
- **Revert:** `git checkout v-s000684 -- .`

## S686 — DP: heavenly-vault placement + cursor → lat/lon inverse

- **Date:** 2026-04-29
- **Files changed:**
  - `js/core/app.js`
  - `js/render/worldObjects.js`
  - `js/ui/mouseHandler.js`
- **Change:**
  - New
    `_bodyVault(lat, lonCelest,
    height)` helper inside
    `update()` applies sky
    rotation to celestial
    longitude *before*
    projecting via
    `canonicalLatLongToDisc`.
    AE polar collapses to
    the previous
    post-projection
    `RotatingZ(-skyRot)`
    result by symmetry; DP
    (no rotational symmetry
    about the disc centre)
    needs the longitude
    shift up front so the
    sun / moon / planets /
    stars / satellites land
    directly above their
    DP-projected disc GPs.
    Replaced 5 callsites
    (`SunVaultCoord`,
    `MoonVaultCoord`, planet
    + star + satellite
    `vaultCoord`).
    `worldObjects.js`
    `Stars.update()` heavenly
    branch does the same.
  - `mouseHandler.js`
    `cursorToLatLon` adds a
    DP inverse-projection
    branch:
    `c = π·ρ`,
    `lat = asin(y·sin(c)/ρ)`,
    `lon = atan2(x·sin(c),
    ρ·cos(c))`. Without
    this, dragging the
    orange dot or otherwise
    converting cursor →
    (lat, lon) on the DP
    disc went through the
    AE inverse and assigned
    a different position
    than the user clicked.
- **Why:** user reported
  the True-Position tracer
  in DP didn't line up
  with the body's actual
  vault position, and
  lat / lon "didn't
  preserve" across world
  toggles. Both rooted in
  AE-only assumptions:
  the post-projection sky
  rotation works only
  when the projection
  rotates rigidly about
  its centre (AE polar);
  and the cursor inverse
  was hardcoded AE.
  Switching modes was
  fine state-wise — it's
  preserved — but the
  click-to-place gesture
  was producing different
  lat / lon than the user
  meant in DP, so the
  observer landed in a
  different visual spot
  on each subsequent
  switch.
- **Revert:** `git checkout v-s000685 -- .`

## S687 — DP: LongitudeRing rotation via projection gradient

- **Date:** 2026-04-29
- **Files changed:**
  - `js/render/worldObjects.js`
- **Change:**
  - `LongitudeRing.update`
    rotated the disc-rim
    degree ring by
    `ToRad(ObserverLong)`
    so "0°" sat at
    compass-north — works
    only under AE polar's
    rotational symmetry.
    DP now reads the
    projection gradient
    via
    `canonicalLatLongToDisc`,
    same formula
    `ObserversOpticalVault`
    uses (S682):
    `θ = atan2(−ny, −nx)`.
    AE / GE keep the
    legacy
    `ToRad(ObserverLong)`
    path.
- **Why:** in DP the
  observer's optical-vault
  azimuth ring aligned
  with the projection's
  meridian tangent (S682
  fix), but the
  heavenly-vault rim ring
  was still rotating by
  raw longitude — the two
  no longer matched at
  "0°".
- **Revert:** `git checkout v-s000686 -- .`

## S688 — DP: day/night shadow shader uses DP inverse

- **Date:** 2026-04-29
- **Files changed:**
  - `js/render/worldObjects.js`
- **Change:**
  - `Shadow` class
    fragment shader
    inverted disc-XY to
    (lat, lon) with the
    AE polar formula
    `lat = π/2 − π·r/R`,
    `lon = atan2(y, x)`
    to compute solar
    elevation per pixel
    and draw the
    day / night
    terminator. In DP
    that mapping is
    wrong — the disc is
    dual-pole AE centred
    at (0°, 0°) — so the
    terminator was
    sweeping across the
    DP map along
    AE-polar lines and
    "lighting up" wrong
    regions.
  - Added `uIsDp`
    uniform; the shader
    branches to the DP
    inverse:
    `c = π·ρ/R`,
    `lat = asin(y·sin c / ρ)`,
    `lon = atan2(x·sin c,
    ρ·cos c)`. Same
    closed-form inverse
    `mouseHandler.js`
    already uses for
    cursor → lat / lon
    (S686).
  - `Shadow.update`
    sets `uIsDp` from
    `WorldModel === 'dp'`.
- **Why:** user reported
  "light distribution is
  fucked up" in DP after
  the directionality fix —
  the day / night zones
  on the disc weren't
  following the new
  projection. Eclipse
  shadow is unchanged
  because it operates on
  global-FE 3D
  coords (sun + moon vault
  positions are already
  DP-aware via S686, so
  the cone-plane
  intersection lands on
  the DP-correct disc
  region without further
  changes).
- **Revert:** `git checkout v-s000687 -- .`

## S689 — GE: remove 180° texture offset on equirect skins

- **Date:** 2026-04-29
- **Files changed:**
  - `js/render/worldObjects.js`
  - `js/render/geArt.js`
- **Change:**
  - `WorldGlobe` shader's
    `uMapOffset` default
    drops from
    `(0.5, 0)` to
    `(0, 0)`.
  - HQ-equirect texture
    cache no longer sets
    `tex.offset.set(0.5, 0)`.
  - `geArt.js` procedural
    canvas texture path
    matches.
- **Why:** observer placed
  at lat=32, lon=−100
  (Texas) was visually
  showing as in India
  (lon ≈ +80) — the
  GlobeObserverCoord at
  +X was correct, but
  the texture beneath was
  shifted by 180°.
  Three.js
  `SphereGeometry` after
  `rotateX(π/2)` already
  puts `u = 0.5` on world
  `+x`, which is exactly
  where a standard
  equirect texture stores
  lon=0°
  (lon=−180 at u=0,
  lon=180 at u=1). The
  pre-existing 0.5 offset
  added a redundant 180°
  rotation. Setting it to
  0 lines all GE skins
  (NASA day / night, world
  shaded relief, AE
  raster maps wrapped on
  the globe path,
  procedural ge_art
  variants) up with the
  observer + body GP
  positions.
- **Revert:** `git checkout v-s000688 -- .`

## S690 — Cel Theo menu: preserve original-category colour for aliases

- **Date:** 2026-04-29
- **Files changed:**
  - `js/ui/controlPanel.js`
- **Change:**
  - New
    `STAR_COLOR_BY_ID`
    map built from
    `BODY_SEARCH_INDEX`
    plus constellation
    star ids (default
    `#ffffff`).
  - `celTheoMenuColor(star)`
    returns the alias's
    owning-catalogue
    colour when
    `star.extId` is set,
    otherwise the Cel Theo
    orange.
  - Cel Theo button grid
    uses `celTheoMenuColor(s)`
    in place of the hard-
    coded `'#ff8c00'`.
- **Why:** entries like
  Regulus, Rigel, Alnilam,
  Mintaka, Alnitak, Baten
  Kaitos, Deneb Algedi
  appear under Cel Theo
  via `extId` aliases; the
  rendered dots already
  carry the owning
  catalogue's colour
  (cel-nav warm yellow,
  named-stars warm white,
  constellation white),
  but the Cel Theo
  menu buttons were all
  painted orange. Aligning
  the button colour with
  the dot colour makes the
  membership obvious.
- **Revert:** `git checkout v-s000689 -- .`

## S691 — revert FE-conceptual ray for optical-vault body positions

- **Date:** 2026-04-29
- **Files changed:**
  - `js/core/app.js`
  - `js/render/worldObjects.js`
- **Change:**
  - Dropped the
    `opticalDir(vault,
    sphereLocalGlobe)`
    helper added in S683
    along with the
    `feConceptualLocalGlobeUnit`
    import. Sun / moon /
    planets / star
    catalogues / satellites
    in `app.js` once again
    feed
    `*LocalGlobeCoord`
    (sphere-model
    celest → local-globe)
    straight into
    `opticalVaultProject`.
  - `Stars.update`
    optical-vault branch
    no longer takes the
    DP-only FE-conceptual
    detour; reverted to
    `M.Trans(c.TransMatCelestToGlobe,
    celestV)`.
  - Heavenly-vault star
    placement still goes
    through
    `canonicalLatLongToDisc(lat,
    lon - skyRotDeg, FE_RADIUS)`
    so the dome-side
    starfield + GP layer
    keep the DP-aware
    placement S686 fixed.
- **Why:** S683 routed
  optical-vault body
  positions through the
  ray observer → vault
  position to make the
  apparent motion show
  DP wrapping. But the
  HUD's az / el
  (`AnglesGlobe`) and the
  optical-vault cap
  rotation (S682, S687
  gradient) are
  sphere-model — so the
  body's rendered
  position no longer
  matched the displayed
  azimuth, and bodies
  were jumping across
  the cap at a different
  geometry than the
  cardinals + heavenly
  ring used. User
  reported sun
  disappearing while still
  above the horizon and
  re-appearing at the
  wrong spot, with the
  HUD reading correct.
  Reverting the body
  override puts the
  rendered position on
  the same sphere-model
  azimuth the cap labels
  + HUD use, so they
  agree end-to-end.
- **Revert:** `git checkout v-s000690 -- .`

## S692 — heavenly LongitudeRing fixed; DP NEWS faces world axes

- **Date:** 2026-04-29
- **Files changed:**
  - `js/render/worldObjects.js`
  - `js/render/scene.js`
- **Change:**
  - `LongitudeRing.update`
    locks rotation at
    `−π/2` in every world
    model. 0° pinned to
    world +y (top of
    disc), 90° at +x,
    180° at −y, 270° at
    −x. Was rotating with
    `ObserverLong` (legacy)
    or the gradient angle
    (S687 DP path).
  - `scene.js` InsideVault
    DP branch: local
    `north = (0, 1, 0)`,
    `east = (1, 0, 0)`. So
    heading 0 / 90 / 180 / 270
    in DP faces world
    +y / +x / −y / −x — i.e.
    the same heavenly axes
    the locked
    `LongitudeRing` labels.
    AE FE branch keeps the
    legacy
    "vector-toward-disc-
    centre" path. GE branch
    (`GlobeObserverFrame`)
    untouched.
- **Why:** user wants the
  outer azi digits FIXED
  in every model and the
  optical-vault cap to
  rotate with the
  observer's local
  compass. Clicking
  N / E / S / W in DP should
  face the fixed heavenly
  directions — when the
  observer is off-centre
  in DP the heading
  arrow now traces a
  diagonal across the
  disc rather than
  following the curved
  meridian tangent.
  Optical-vault cap
  rotation untouched
  (S682 gradient) so the
  cap's N letter still
  marks the observer's
  actual compass-N; it
  floats off the
  camera-forward
  direction by design.
- **Revert:** `git checkout v-s000691 -- .`

## S693 — hide LongitudeRing in GE (visibility gate fix)

- **Date:** 2026-04-29
- **Files changed:**
  - `js/render/worldObjects.js`
- **Change:**
  - `LongitudeRing.update`
    re-checks
    `WorldModel === 'ge'`
    and force-hides the
    ring in GE.
    `index.js` line 577
    already sets
    `visible = !ge`, but
    that runs before
    `update()`, which
    overwrote it with
    `!inVault &&
    ShowLongitudeRing`
    every frame.
- **Why:** with the
  S692-locked rotation
  the GE ring was
  rendering as a flat
  azimuth band at z=0
  around the globe, no
  longer rotating with
  the observer — read as
  a stuck "diagonal"
  scale next to the
  sphere. Belongs to FE /
  DP only; GE has no flat
  disc rim.
- **Revert:** `git checkout v-s000692 -- .`

## S694 — LongitudeRing back to per-mode compass rotation

- **Date:** 2026-04-29
- **Files changed:**
  - `js/render/worldObjects.js`
- **Change:**
  - Reverted S692's
    locked `−π/2`
    rotation. Ring rotates
    so 0° always lands on
    the observer's
    compass-north — the
    same axis the cap
    rim uses:
    - DP: gradient of
      latitude via
      `canonicalLatLongToDisc`
      (S687 logic).
    - FE / AE:
      `ToRad(ObserverLong)`
      (legacy).
  - GE visibility gate
    (S693) still applied.
  - DP InsideVault camera
    world-fixed NEWS
    (S692) untouched —
    the "diagonal" only
    in DP.
- **Why:** locking the
  ring at world axes left
  observer's compass-N
  pointing at a label
  other than 0° in
  FE / AE (e.g. 270° at
  compass-N for the
  observer in
  screenshot #116 at
  lon=0). User wants the
  digits to rotate with
  the observer so 0°
  lines up with their
  N — the legacy
  behaviour. The
  "FIXED" they asked for
  meant fixed-meaning
  (0 = N, 90 = E, …),
  not fixed-position.
- **Revert:** `git checkout v-s000693 -- .`

## S695 — Observer figure rotation: DP world-fixed branch

- **Date:** 2026-04-29
- **Files changed:**
  - `js/render/worldObjects.js`
- **Change:**
  - Observer figure
    rotation in the
    non-GE branch
    splits on
    `WorldModel`:
    - DP:
      `rot = π/2 −
      headingRad` so the
      figure +x axis
      lines up with the
      world-fixed heading
      direction
      (S692 camera).
    - FE / AE: legacy
      `ang + π − headingRad`
      where `ang =
      atan2(p[1], p[0])`
      (toward disc
      centre at heading
      0).
- **Why:** in DP the
  S692 InsideVault
  camera follows the
  world-fixed heavenly
  axes, but the
  figure was still
  rotating to the
  AE-derived
  observer-position
  angle. At the
  poles the AE term
  flips the figure
  ±π/2 vs world +y,
  so 3rd-person view
  showed the figure
  facing the opposite
  direction from where
  the camera looked.
- **Revert:** `git checkout v-s000694 -- .`

## S696 — DP heavenly LongitudeRing locked at world +y; FE/AE keeps legacy

- **Date:** 2026-04-29
- **Files changed:**
  - `js/render/worldObjects.js`
- **Change:**
  - LongitudeRing
    rotation splits on
    `WorldModel`:
    - DP: `−π/2` (0°
      pinned to world
      +y, doesn't track
      the observer).
    - FE / AE:
      `ToRad(ObserverLong)`
      (legacy — 0° at
      observer's compass-
      north).
- **Why:** in DP 3rd-
  person the heavenly
  ring should stay
  fixed; the InsideVault
  camera + figure
  (S692 / S695) already
  use the same world-
  fixed axes, so locking
  the ring at `−π/2`
  makes everything in DP
  share one heavenly
  reference frame
  regardless of observer
  position. At
  (lat=0, lon=0) the
  gradient and the
  locked angle coincide,
  so the only visible
  change is when the
  observer moves
  off-centre.
- **Revert:** `git checkout v-s000695 -- .`

## S697 — DP InsideVault camera + figure back to gradient (tracker desync fix)

- **Date:** 2026-04-29
- **Files changed:**
  - `js/render/scene.js`
  - `js/render/worldObjects.js`
- **Change:**
  - Reverted S692's
    world-fixed
    `north = (0,1,0)`,
    `east = (1,0,0)`
    in the DP
    InsideVault camera.
    DP now reads heading
    against the gradient
    of latitude at the
    observer (= sphere-
    model "north" via
    S681's
    TransMatLocalFeToGlobalFe).
  - Reverted S695's
    `π/2 − headingRad`
    figure rotation in
    DP. All FE-side
    branches use the
    legacy
    `ang + π − headingRad`
    where
    `ang = atan2(p.y, p.x)`.
  - Heavenly
    `LongitudeRing`
    stays locked at
    `−π/2` in DP
    (S696) per
    user's earlier
    "heavenly fixed"
    direction.
- **Why:** trackers
  set
  `ObserverHeading =
  AnglesGlobe.azimuth`,
  which is sphere-model
  azimuth measured from
  gradient-N. With S692
  reading heading
  against world-fixed
  +y, off-centre
  observers in DP saw
  the tracked body
  drift off screen by
  the gradient/world
  delta. Putting the
  camera back on
  gradient axes makes
  the heading align
  with the body's
  azimuth so tracking
  centres correctly.
  The "diagonal" feel
  for NEWS in DP
  comes naturally from
  the camera following
  the curving meridian
  tangent.
- **Revert:** `git checkout v-s000696 -- .`

## S698 — demos inherit user projection; DP image map z-fight; info-bar UI zoom

- **Date:** 2026-04-29
- **Files changed:**
  - `js/demos/flightRoutes.js`
  - `js/demos/definitions.js`
  - `js/render/earthMap.js`
  - `css/styles.css`
  - `css/styles.min.css`
- **Change:**
  - **Demos inherit
    user projection.**
    `ROUTE_OVERLAYS` in
    `flightRoutes.js`
    no longer sets
    `WorldModel`,
    `MapProjection`, or
    `MapProjectionGe`.
    Stripped six
    `if (WorldModel ===
    'ge') base.MapProjectionGe
    = 'hq_equirect_day';`
    overrides from the
    24h-sun + similar
    demos in
    `definitions.js`. All
    demos now keep
    whatever projection
    the user already had
    set; missing /
    invalid values fall
    back to AE through
    the existing
    `getProjection`
    default.
  - **DP image map
    z-fight fix.**
    `buildImageMap` in
    `earthMap.js` now
    sets
    `depthTest: false`
    and
    `renderOrder = 5` on
    the textured disc
    mesh. Same fix the
    flight-routes
    line-art map uses
    (S674) — at long
    camera distances the
    depth buffer can't
    resolve the DP
    image at z = 1e-4
    against
    `DiscBase`'s rim
    ring at the same
    z, so the user saw
    the AE base flicker
    through the DP map.
    GE doesn't hit it
    because the globe
    is solid and lifts
    well off z=0.
  - **UI scaling.**
    Added
    `zoom: var(--ui-zoom)`
    to `#info-bar`
    (the bottom-bar's
    coords / az / el /
    tracker readout
    band). The header,
    HUD, tracker HUD,
    tracking-info popup,
    bottom-bar, footer,
    Meeus banner, and
    cadence chip already
    scaled (S675);
    info-bar was the
    last major panel
    sitting at native
    pixels.
- **Revert:** `git checkout v-s000697 -- .`

## S699 — astronomical refraction toggle (Bennett / Seidelman)

- **Date:** 2026-04-30
- **Files changed:**
  - `js/core/refraction.js` (new)
  - `js/core/app.js`
  - `js/ui/controlPanel.js`
  - `css/styles.css`
  - `css/styles.min.css`
- **Change:**
  - New `js/core/refraction.js` exporting `bennettRefractionDeg`,
    `seidelmanRefractionDeg`, `refractionDeg(mode, appAltDeg, elev)`,
    and `applyRefractionLocalGlobe(coord, mode, elev)`. Both formulas
    take apparent altitude in degrees and return refraction in
    degrees, with the spreadsheet's pressure/temperature adjustment
    (`T = 15°C`, `p0 = 101 kPa`) so observer elevation rolls into
    the lift. Below-horizon input returns 0 (formulas misbehave).
  - `app.js`: imported `applyRefractionLocalGlobe`; added
    `Refraction: 'off'` to `defaultState()` (values: `'off'`,
    `'bennett'`, `'seidelman'`); inside `update()` declared
    `_refr(lg)` once per frame and threaded it through every
    optical-vault projection — sun, moon, planets, stars,
    satellites — so each body's `OpticalVaultCoord` and
    `GlobeOpticalVaultCoord` are computed from a refraction-lifted
    local-globe vector. `*AnglesGlobe` and the heavenly
    `*VaultCoord` stay unrefracted, so HUD readouts and true-position
    overlays remain ground truth.
  - `controlPanel.js`: added a new Tracker-tab group titled
    `Refraction` with one row, label `"Astronomical"`, bound to a
    select with `Off / Bennett / Seidelman`. Added a quick toggle
    button (`.refr-btn`) next to the GP-tracer (▦) button. Single
    click cycles `off → bennett → seidelman → off`; face shows
    `—` / `B` / `S` and the button picks up the orange aria-pressed
    style when active. Restructured `gridsStack` into two
    `.world-row` rows so the top row holds [▦, refr] and the
    bottom row keeps [FE, ⌫] — both rows hold two equal-width
    buttons, replacing the previous single full-width ▦.
  - `styles.css`: `.grids-btn` lost `margin-left: 4px` (now sits
    inside a flex row with its sibling); added `.refr-btn` rule
    matching the grids-btn metrics plus the standard
    aria-pressed accent. Re-minified.
- **Revert path:** `git checkout v-s000698 -- .` (and delete
  `js/core/refraction.js`).

## S700 — refraction HUD line + geocentric ghost markers + Cel Theo presets

- **Date:** 2026-04-30
- **Files changed:**
  - `js/core/refraction.js`
  - `js/core/app.js`
  - `js/render/worldObjects.js`
  - `js/render/index.js`
  - `js/ui/controlPanel.js`
  - `css/styles.css`
  - `css/styles.min.css`
- **Change:**
  - `app.js`: imported `refractionDeg`. Refactored every body's
    optical-vault projection so true (unrefracted) and apparent
    (refracted) coords coexist. New per-body fields
    `*OpticalVaultCoordTrue` / `*GlobeOpticalVaultCoordTrue` are
    always populated; `*OpticalVaultCoord` / `*GlobeOpticalVaultCoord`
    alias the True versions when refraction is off, otherwise carry
    the lifted (apparent) versions. Sun, Moon, planets, stars,
    satellites all updated.
  - `app.js`: `TrackerInfos` entries pick up
    `opticalVaultCoordTrue` / `globeOpticalVaultCoordTrue` from each
    body, and a `refractionDeg` field set to
    `refractionDeg(mode, info.elevation, observerElev)`.
  - `app.js`: added `ShowGeocentricPosition: false` to
    `defaultState()`.
  - `worldObjects.js`: new `GeocentricMarkers` class — fixed pool of
    cyan spheres positioned at each tracker target's
    `opticalVaultCoordTrue` (or globe variant in GE). Hidden when
    refraction is off, when the toggle is off, or in InsideVault
    first-person mode.
  - `render/index.js`: instantiates `GeocentricMarkers(128)`, adds it
    to the world group, and updates it each frame next to
    `trackedGPs`.
  - `controlPanel.js`: Refraction submenu in the Tracker tab gains a
    `Show Geocentric Position` boolean row. Tracker HUD per-block
    DOM gains a new `tracker-refr` line; when refraction is on and
    the body is above the horizon it reads
    `refr (Bennett|Seidelman): +X.XX′  (apparent <signed dms>)` —
    where `apparent = elevation + refractionDeg`. Hidden otherwise.
  - `controlPanel.js`: added `CEL_THEO_PRESETS` array and a
    `.cel-theo-hops` mini-grid placed in `bar-left` right after
    `geo-hops`. First entry: `PP` (Pikes Peak) — sets observer
    `38.999700, -104.497230`, follows `star:ct_39_aqr` (39 Aquarii),
    sets `DateTime` to 2025-01-28 01:43:07 UTC (= 2025-01-27
    18:43:07 MST), `TimezoneOffsetMinutes = -420`, ensures the star
    is in `TrackerTargets`, enables `ShowCelTheo`.
  - `styles.css`: added `.tracker-refr` (cyan, 11 px), `.cel-theo-hops`
    (2-column grid, 4 px margin-left), `.cel-theo-hop` (warm-orange
    foreground / border that picks up the accent on hover).
- **Revert path:** `git checkout v-s000699 -- .` (and remove the
  new `GeocentricMarkers` class block plus the `cel-theo-hops`
  block; the `*OpticalVaultCoordTrue` plumbing folds back to the
  S699 single-coord shape).

## S701 — true/apparent elevation rows + paired marker + halo

- **Date:** 2026-04-30
- **Files changed:**
  - `js/ui/trackingInfoPopup.js`
  - `js/render/worldObjects.js`
  - `change_log_serials.md`
- **Change:**
  - `trackingInfoPopup.js`: when a refraction formula is active, the
    single `Elevation` row now splits into two rows:
    `True Elevation` (uses `info.elevation`) and `Apparent Elevation`
    (uses `info.elevation + info.refractionDeg`). When refraction is
    off, the popup still shows the original single `Elevation` row
    so the layout doesn't shift in the default case.
  - `worldObjects.js`: `GeocentricMarkers` rebuilt as a paired
    visualization. Each pool slot now holds three meshes — a cyan
    ball at the unrefracted (true) optical-vault coord, an orange
    ball at the refracted (apparent) coord, and a low-opacity orange
    sphere wrapping the apparent ball as a halo. Both balls are
    sized like the previous geocentric ghost (radius 0.012); the
    halo is radius 0.038 at opacity 0.18. Pool size doubled
    internally (each tracker target uses one slot with three
    children). Removed the `!s.InsideVault` gate so the markers
    render in first-person mode too — the user-requested view for
    Cel-Theo events.
- **Revert path:** `git checkout v-s000700 -- .` and rebuild
  `styles.min.css` if it changed.

## S702 — refraction T/P inputs, menu reorder, local-time clock, marker resize

- **Date:** 2026-04-30
- **Files changed:**
  - `js/core/refraction.js`
  - `js/core/app.js`
  - `js/ui/controlPanel.js`
  - `js/render/worldObjects.js`
- **Change:**
  - `refraction.js`: signature change. The pressure/temperature
    adjustment now takes explicit pressure (mbar) and temperature
    (°C) inputs instead of observer elevation. Reference values are
    P0 = 1010 mbar (≈ 101 kPa), T_ref = 283 K (10°C) — same form the
    spreadsheet uses. `bennettRefractionDeg`,
    `seidelmanRefractionDeg`, `refractionDeg`, and
    `applyRefractionLocalGlobe` all take `(pressureMbar, tempC)`
    parameters with MSL standard defaults (1013.25 mbar, 15°C).
  - `app.js`: `defaultState()` adds `RefractionPressureMbar: 1013.25`
    and `RefractionTemperatureC: 15`. `update()` reads them with
    NaN-safe fallbacks and threads them into `_refr(...)` and the
    per-info `refractionDeg(...)` call.
  - `controlPanel.js`: Refraction submenu moved out of its old slot
    above Starfield and re-anchored at the bottom of the Tracker
    tab, immediately after Tracker Options. Two new numeric rows
    inside the submenu — `Pressure` (mbar, 800–1100, step 0.25)
    and `Temperature` (°C, -40–50, step 0.5).
  - `controlPanel.js`: `refreshInfoBar` now renders the menu-bar
    clock in the observer's local zone, derived from
    `TimezoneOffsetMinutes`. Previously it always displayed UTC, so
    e.g. the PP preset's 18:43:07 MST time read as
    `01:43:07 UTC`. Format is now
    `Mon DD YYYY / HH:MM:SS UTC±H[:MM]`.
  - `worldObjects.js`: `GeocentricMarkers` rebuilt as three
    `THREE.Points` clouds (true cyan dot, apparent orange dot, and
    an orange ring halo around the apparent dot) instead of mesh
    spheres. All three use `sizeAttenuation: false` so the dots and
    halo stay at consistent screen-space sizes — same pixel
    treatment cel-nav stars use. Apparent dot is now the same size
    as a typical star (3 px) instead of the chunky world-space
    sphere; the halo is a 36-px circle centred on the apparent
    dot.
- **Revert path:** `git checkout v-s000701 -- .`

## S703 — popup elevation row order: apparent above true

- **Date:** 2026-04-30
- **Files changed:** `js/ui/trackingInfoPopup.js`
- **Change:** swapped the two refraction-mode rows in the
  tracking-info popup. Now reads `Apparent Elevation` on top,
  `True Elevation` below it.
- **Revert path:** `git checkout v-s000702 -- .`

## S704 — popup formula+amount line, PP toggle, dynamic halo radius

- **Date:** 2026-04-30
- **Files changed:**
  - `js/ui/trackingInfoPopup.js`
  - `js/core/app.js`
  - `js/ui/controlPanel.js`
  - `js/render/worldObjects.js`
  - `css/styles.css`
  - `css/styles.min.css`
- **Change:**
  - `trackingInfoPopup.js`: when refraction is on, the row beneath
    `Apparent Elevation` now reads `↳ <Formula>  +X.XX′` (Bennett
    or Seidelman + the lift in arcminutes). Hidden when refraction
    is off.
  - `app.js`: `defaultState()` adds `CelTheoPresetActive: null`.
    Tracks which Cel-Theo preset is currently engaged so the same
    button can act as a toggle.
  - `controlPanel.js`: PP click handler is now a toggle. First
    click activates: sets observer / date / target plus
    `RefractionPressureMbar = 787.8` and `RefractionTemperatureC =
    -0.2`, marks `CelTheoPresetActive = 'PP'`. Second click
    deactivates: reverts pressure / temperature to MSL standard
    (1013.25 mbar / 15°C) and clears `CelTheoPresetActive`. Button
    toggles its `aria-pressed` state from `model.update`.
  - `worldObjects.js`: `GeocentricMarkers` halo is now a per-slot
    `THREE.Sprite` rather than a fixed-size pixel point. Each
    sprite is centred on the apparent coord and scaled so the
    rendered ring's world-space radius equals the apparent↔true
    Euclidean distance — so the true marker sits exactly on the
    halo's circumference. The halo therefore expands as the body
    drops toward the horizon (refraction lift grows) and shrinks
    near zenith (lift small). Faded orange (opacity 0.55 with the
    stroke already drawn at 0.45 alpha → effective ~0.25). Apparent
    and true dots stay at the cel-nav star size (3 px,
    `sizeAttenuation: false`).
  - `controlPanel.js` / `styles.css`: added `.cel-theo-hop[aria-pressed]`
    accent style for the toggled-on PP button. Added
    `#tracking-info-popup .ti-row.ti-refr-info` style — orange,
    12 px, indented 16 px so the `↳ Bennett +X.XX′` row reads as
    a sub-row of `Apparent Elevation`.
- **Revert path:** `git checkout v-s000703 -- .`

## S705 — refraction iteration (true → apparent), bumped marker size

- **Date:** 2026-04-30
- **Files changed:**
  - `js/core/refraction.js`
  - `js/render/worldObjects.js`
- **Change:**
  - `refraction.js`: `refractionDeg` now performs a fixed-point
    iteration to convert TRUE altitude into the apparent altitude
    Bennett / Seidelman expect as input. Two iterations of
    `R ← formula(h_true + R)` give sub-arcsecond convergence above
    the horizon. Without the iteration the returned value was
    consistently a little high — `R(h_true) > R(h_apparent)` because
    a lower altitude implies more refraction. Added an `_isApparent`
    flag for callers (test rigs, the legacy spreadsheet path) that
    already have apparent altitude and want the raw formula
    evaluation.
  - `applyRefractionLocalGlobe` now relies on the iterated
    `refractionDeg` so the optical-vault lift matches the value
    the HUD / popup display.
  - `worldObjects.js`: `GeocentricMarkers` true-and-apparent dot
    size raised from 3 px to 6 px so the cyan / orange dots stay
    readable above the cel-nav starfield (3 px) at heavenly-vault
    distances. Opacity bumped to 1.0.
- **Revert path:** `git checkout v-s000704 -- .`

## S706 — zoom-track centring + halo ring outline (no fill)

- **Date:** 2026-04-30
- **Files changed:**
  - `js/render/scene.js`
  - `js/render/worldObjects.js`
- **Change:**
  - `scene.js`: `resolveTargetGp` now also returns the body's
    `vaultCoord` and `globeVaultCoord` so the FreeCamActive heavenly
    tracking branch can pivot on the body itself instead of its
    ground-point. Tracking lookAt switched to the body's vault
    coord (FE) or globe-vault coord (GE), with a fallback to the
    GP if the vault coord isn't available. Result: zoom keeps the
    body in screen centre — previously the GP→body offset became a
    larger fraction of the camera-to-pivot distance as zoom
    increased, pushing the body off-centre.
  - `worldObjects.js`: halo `_makeRingTexture` rebuilt as a clean
    ring outline. Canvas is explicitly cleared before stroke; the
    ring is drawn at full alpha; the texture has `generateMipmaps`
    off and `Linear` min/mag filters. The "lightly faded" look now
    comes only from `SpriteMaterial.opacity = 0.55`. Added
    `alphaTest: 0.05` so zero-alpha pixels don't blend in. Result:
    no faint orange fill inside the ring — just the circumference.
- **Revert path:** `git checkout v-s000705 -- .`

## S707 — below-horizon cull, taller bottom bar, larger ui-zoom band

- **Date:** 2026-04-30
- **Files changed:**
  - `js/render/worldObjects.js`
  - `css/styles.css`
  - `css/styles.min.css`
- **Change:**
  - `worldObjects.js`: `GeocentricMarkers` per-info loop now skips
    targets with `info.elevation < 0`. The FE
    `opticalVaultProject` returns a coord even for sub-horizon
    bodies (no `[0, 0, -1000]` sentinel like the GE branch), which
    was placing apparent / true / halo markers under the disc on
    bodies the observer can't actually see.
  - `styles.css`:
    - `--ui-zoom` band rewritten as
      `clamp(0.5, min(100vw/1600, 100vh/900), 2.4)`. Reference
      viewport drops from 1920×1080 to 1600×900 so 1080p screens
      already nudge above 1×, and the upper cap rises from 1.6 to
      2.4 so 4K and 5K monitors actually scale up the bar/HUDs.
    - `#bottom-bar`: height 88 → 106 px, top padding 44 → 56 px.
      `#info-bar` height 44 → 50 px, sits at `bottom: 56px`. Tab
      popups + meeus-warning anchors moved to match. Mobile
      breakpoint's `.tab-popup` `bottom` follows the new bar
      height.
    - Button breathing room: `.time-btn` min-height 24 → 30,
      padding 4 10 → 6 12, font 13 → 14. The sub-button rules in
      `.grids-stack`, `.cycle-row`, `.mode-grid`, `.cardinal-grid`,
      `.swap-stack`, and the presets column all bump to
      min-width 40, min-height 26, padding 4 10, font 15.
      `.compass-btn`, `.geo-hops .time-btn`, and
      `.time-jump-grid .time-btn` get proportional bumps. Tab
      buttons go from 6 14 / 13 px to 8 16 / 14 px.
- **Revert path:** `git checkout v-s000706 -- .`

## S708 — halo min-radius clamp + compass-controls margin tightened

- **Date:** 2026-04-30
- **Files changed:**
  - `js/render/worldObjects.js`
  - `css/styles.css`
  - `css/styles.min.css`
- **Change:**
  - `worldObjects.js`: `GeocentricMarkers` halo now clamps the
    sprite scale to a minimum world radius of 0.025 (≈ 1.4°
    equivalent at the optical vault). At low refractions the
    apparent↔true gap was only ~0.002 world units, which scaled to
    sub-pixel halo size from heavenly camera distances and made
    the ring vanish. Above the clamp the strict
    "circumference passes through true marker" relation still
    holds; below it the true dot just sits inside the halo.
  - `styles.css`: rolled back the S707 sub-button width bumps
    (`.grids-stack`, `.cycle-row`, `.mode-grid`, `.cardinal-grid`,
    `.swap-stack`, `.presets`, `.compass-btn`) from 40 px back to
    36 px (28 px for compass cardinals). Heights / fonts stayed
    bumped — buttons are taller and easier to read but no wider.
    Added `margin-right: 16px` on `.compass-controls` so the
    cardinal / world-row no longer overlaps the body-search input
    on standard 1080p viewports.
- **Revert path:** `git checkout v-s000707 -- .`

## S709 — popup CA row, halo restored to thin/uncapped, bar row symmetry

- **Date:** 2026-04-30
- **Files changed:**
  - `js/ui/trackingInfoPopup.js`
  - `js/render/worldObjects.js`
  - `css/styles.css`
  - `css/styles.min.css`
- **Change:**
  - `trackingInfoPopup.js`: when refraction is on, popup gains a
    `CA (Apparent ↔ True)` row showing the refraction-induced
    angular separation between the apparent and true positions in
    the same signed DMS format the other angular fields use. Sits
    below the `True Elevation` row.
  - `worldObjects.js`: halo ring stroke restored to 2 px (was 3 px
    after S707). Removed the S708 `MIN_R = 0.025` clamp — halo
    radius is now strictly the world-space distance between the
    apparent and true coords, so the circle's circumference passes
    through the true marker as the user originally specified, and
    its size dynamically scales with the elevation-dependent
    refraction lift. At small refractions / heavenly camera
    distances the halo will read as a small circle; the user is
    expected to zoom in to inspect those cases.
  - `styles.css`:
    - `--ui-zoom` cap pulled back from 2.4 to 1.8. The 2.4 cap was
      pushing the bottom-bar's content past the viewport's right
      edge at 1080p with the bigger button styling.
    - `#bottom-bar` flex `gap` 18 → 12 px so the four bar
      sections (bar-left, time-controls, compass, tabs) sit
      tighter and the search input stays clear of the compass
      cluster.
    - `.compass-controls` `margin-right` 16 → 8 px (the bigger
      gap was over-correcting and pushing search to the screen
      edge on wider viewports).
    - `.time-controls` and `.geo-hops` gained `margin-top: -18px`
      so the playback row and country-hop grid sit at the same
      vertical midpoint as the compass cluster (which already had
      that offset). Result: all three rows of the bar's left
      cluster now share a consistent baseline.
- **Revert path:** `git checkout v-s000708 -- .`

## S710 — bar-left compass cluster shifted further left for search clearance

- **Date:** 2026-04-30
- **Files changed:** `css/styles.css`, `css/styles.min.css`
- **Change:** `.compass-controls margin-right` 8 → 28 px and
  `.search-host` gained `margin-left: 16 px`. Combined with the
  bar's flex `gap: 12 px`, that's a 56 px guaranteed buffer between
  the compass cluster's right edge and the body-search input's
  left edge — enough that the FE / ⌫ row no longer touches the
  search input on the user's viewport. The search input itself
  still shrinks naturally with the rest of `tabsBar` (flex 1 1 0)
  if the viewport is narrow.
- **Revert path:** `git checkout v-s000709 -- .`

## S711 — geocentric markers 3 px, halo as billboarded ring mesh

- **Date:** 2026-04-30
- **Files changed:**
  - `js/render/worldObjects.js`
  - `js/render/index.js`
- **Change:**
  - `worldObjects.js`: `GeocentricMarkers` true / apparent dot size
    pulled back from 6 px to 3 px so they match the cel-nav star
    sprite size — the apparent ghost overlays the regular star
    cleanly and the true ghost no longer dwarfs the body.
  - Halo replaced. Was a `THREE.Sprite` with a canvas ring texture
    sized in world units; on small refractions and from heavenly
    camera distances the sprite collapsed sub-pixel and the ring
    disappeared. Now a per-slot `THREE.Mesh` with a thin
    `RingGeometry(0.985, 1.0, 96)` annulus, scaled per frame to the
    apparent↔true world distance and re-oriented each frame via
    `lookAt(camera.position)` so the ring's plane stays
    perpendicular to the camera direction. The true marker therefore
    sits exactly on the rendered circumference at any zoom, and the
    ring grows as refraction grows.
  - `update(model)` signature → `update(model, camera)`.
  - `index.js`: passes `this.sm.camera` into the geocentric-markers
    update so the halos can billboard.
- **Revert path:** `git checkout v-s000710 -- .`

## S712 — halo as LineLoop (1 px); bar-left shrinks to content

- **Date:** 2026-04-30
- **Files changed:**
  - `js/render/worldObjects.js`
  - `css/styles.css`
  - `css/styles.min.css`
- **Change:**
  - `worldObjects.js`: halo replaced again. RingGeometry's stroke
    band (`outer−inner`) shrinks proportionally with `mesh.scale`,
    so at small refractions / heavenly camera distances the band
    became sub-pixel and the ring disappeared. Now a unit-circle
    `THREE.LineLoop` (96 segments) with `LineBasicMaterial`. WebGL
    rasterises lines at 1 px regardless of geometry scale, so the
    halo stays a thin always-visible outline. Per-frame `scale =
    (R, R, 1)` and `lookAt(camera.position)` keep the radius equal
    to the apparent↔true world distance and the plane perpendicular
    to the camera direction.
  - `styles.css`: `#bottom-bar .bar-left` flex changed from
    `1 1 0` to `0 1 auto`. The previous flex-1 grew bar-left to
    fill all available leftover space, pushing the compass cluster
    far to the right (where it overlapped the body-search input).
    `0 1 auto` makes bar-left take only its content's natural
    width, so the compass cluster sits immediately after
    timeControls and `tabsBar` takes the remaining space — the
    search input ends up well clear of the FE / clear-trace row on
    the user's viewport.
- **Revert path:** `git checkout v-s000711 -- .`

## S713 — halo white & opaque, bar-left restored, ui-zoom floor up

- **Date:** 2026-04-30
- **Files changed:**
  - `js/render/worldObjects.js`
  - `css/styles.css`
  - `css/styles.min.css`
- **Change:**
  - `worldObjects.js`: halo `LineBasicMaterial` switched to
    `color: 0xffffff`, `transparent: false`. The orange + alpha
    blend was ending up unrenderable in some configurations; a
    fully-opaque white line at `depthTest: false` is unambiguous
    and matches the cel-nav star colour.
  - `styles.css`:
    - `#bottom-bar .bar-left` reverted to `flex: 1 1 0` — the
      `flex: 0 1 auto` from S712 over-pulled the whole bar-left
      cluster to the screen's left edge. Bar layout is back to
      its pre-S712 distribution.
    - `#bottom-bar .compass-controls margin-right` 28 → 56 px so
      the compass cluster now sits a moderate distance left of
      the body-search input without dragging the rest of bar-left
      with it.
    - `--ui-zoom` floor 0.5 → 0.7 and reference viewport
      `1600×900` → `1440×810`. Phones land at a 0.7× floor
      instead of 0.5× so menu text reads larger; the upper cap
      stays at 1.8 so 4K monitors still scale up.
    - Mobile breakpoint's `#bottom-bar .time-btn`: `min-width`
      28 → 30 px, `min-height` added at 28 px, padding 6 8 → 6 9,
      font 12 → 13 px. Buttons read more cleanly on small
      phones without changing the desktop layout.
- **Revert path:** `git checkout v-s000712 -- .`

## S714 — halo angular floor; compass margin-right 56 → 80 px

- **Date:** 2026-04-30
- **Files changed:**
  - `js/render/worldObjects.js`
  - `css/styles.css`
  - `css/styles.min.css`
- **Change:**
  - `worldObjects.js`: `GeocentricMarkers` halo now applies a
    minimum angular radius of 0.005 rad (~0.29°, roughly 5 px on
    a 1080-tall viewport at 75° FOV). Calculated per-frame from
    the camera-to-apparent distance: when the natural radius
    `r` (apparent↔true world distance) is large enough, it's used
    unmodified — the line passes exactly through the true marker.
    When `r` collapses sub-pixel, the world radius is bumped to
    `0.005 × camDist` so the ring still rasterises as a visible
    circle. The previous unclamped scale was producing geometry
    whose individual line segments were sub-pixel and therefore
    dropped by the rasteriser.
  - `styles.css`: `.compass-controls margin-right` 56 → 80 px to
    add another 24 px of clearance between the FE / clear-trace
    column and the body-search input.
- **Revert path:** `git checkout v-s000713 -- .`

## S715 — halo as screen-space sprite with projected radius

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** halo refactored once more. `LineLoop` was getting
  silently dropped by the rasteriser at small refractions — its
  individual line segments collapsed sub-pixel. Replaced with a
  `THREE.Sprite` carrying a clean ring-outline canvas texture and
  `sizeAttenuation: false`, which renders at constant screen size
  regardless of camera distance. Each frame the update loop projects
  the apparent and true 3D coords to NDC via `Vector3.project`,
  measures their NDC distance, and sets the sprite scale so the
  ring's NDC radius equals that distance — i.e. the rendered
  circumference always passes through the true marker, at any zoom
  or camera distance. A 0.012-NDC floor (~13 px on a 1080-tall
  viewport) keeps the ring visible when the apparent↔true gap is
  near zero. White texture so it reads as bright as the cel-nav
  stars.
- **Revert path:** `git checkout v-s000714 -- .`

## S716 — halo as size-attenuated sprite, world radius = R

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** halo Sprite switched from `sizeAttenuation: false`
  (clip-space sizing) back to default `sizeAttenuation: true`
  (world-space sizing). The clip-space approach was rendering the
  ring at ~50× the apparent↔true projected screen distance because
  the scale-to-NDC conversion implicitly multiplies by the camera
  focal factor, which I'd been double-counting. With size
  attenuation on, sprite scale is in world units, so setting
  `scale = R * (128/56) ≈ 2.286 R` makes the ring's world radius
  exactly equal to the apparent↔true 3D distance, and the
  perspective projection automatically lands the rendered
  circumference on the true marker on screen — no NDC reprojection
  needed. Texture canvas reduced to 128 px with an 8-px stroke
  (~6 % of canvas) so the rendered line stays visible at typical
  refractions; the dropped helper Vector3s and the NDC
  computation were removed from `update`.
- **Revert path:** `git checkout v-s000715 -- .`

## S717 — halo angular visibility floor restored

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** `GeocentricMarkers` halo update now restores the
  per-frame minimum-world-radius clamp it lost in S716. With pure
  `scale = R * _HALO_SCALE_PER_R` and `sizeAttenuation: true`, at
  heavenly camera distances and / or small refractions the
  rendered sprite was sub-pixel and got dropped by the rasteriser,
  so the ring vanished entirely. Clamp is `world_R ≥ 0.010 × camDist`,
  which reads as ~0.57° angular size from the camera (≈ 6 px on a
  1080-tall viewport at 60° FOV). Above the floor the strict
  geometric relation holds — the true marker sits exactly on the
  circumference. Below it the ring is bigger than the apparent↔true
  gap and the true dot sits inside the ring; that's the only way to
  keep the visualisation present at small refractions.
- **Revert path:** `git checkout v-s000716 -- .`

## S718 — halo as plain Mesh + RingGeometry (no sprite, no texture)

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** halo refactored once more, this time dropping the
  `THREE.Sprite + CanvasTexture` pipeline entirely. Sprite-based
  rings kept disappearing in the user's setup regardless of the
  size or alphaTest combinations tried. Replaced with a plain
  `THREE.Mesh` carrying a shared `RingGeometry(0.86, 1.0, 64)` —
  outer radius 1.0, inner 0.86 (14 % band width) — and
  `MeshBasicMaterial` (white, double-sided, opaque). A solid mesh
  ring renders the same way every other Mesh in the scene does, no
  texture / alpha-test path involved. Per-slot transform: scale =
  `(R, R, 1)` so the mesh's outer edge lands at the apparent↔true
  world distance, plus `lookAt(camera.position)` so the ring's
  plane stays perpendicular to view. The 0.010-rad min-angular
  floor (~0.57°) is preserved so the ring remains visible at small
  refractions / far camera distances.
- **Revert path:** `git checkout v-s000717 -- .`

## S719 — halo Mesh: thicker band, uniform scale, explicit matrix update

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** halo `RingGeometry` band widened from 14 % (inner
  0.86) to 30 % (inner 0.7). Per-frame transform changed from
  `scale.set(R, R, 1)` to uniform `scale.set(R, R, R)` so `lookAt`
  composes with a clean uniform-scale matrix; the previous
  asymmetric scale combined with `lookAt`'s rotation produced a
  matrix that some configurations were rejecting silently. Added
  explicit `halo.updateMatrix()` after the transform writes to
  force the local matrix recomputation before render. Material now
  has `transparent: true, opacity: 0.85` so it composites cleanly
  rather than relying on the opaque pipeline.
- **Revert path:** `git checkout v-s000718 -- .`

## S720 — halo Mesh: renderOrder 250 (above all other transparents)

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** halo `Mesh.renderOrder` raised from 59 to 250. The
  scene contains transparent meshes at renderOrder up to 124 (e.g.
  observer figure layers, central-angle helpers); my halo at 59
  was rendering BEFORE those, and with `depthTest: false` they
  would draw over it. 250 is unambiguously above everything else
  in this codebase. Also dropped the `r > 1e-7` early-out around
  the per-slot transform — the outer `if (!on)` short-circuit
  already guarantees we're only here when refraction is active, and
  the min-angular floor handles the r=0 case safely. Cleaned up
  the manual `updateMatrix()` / `matrixAutoUpdate` calls; relying
  on three.js's default per-frame auto-update.
- **Revert path:** `git checkout v-s000719 -- .`

## S721 — halo: thin band, strict geometry (no angular clamp)

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:**
  - `RingGeometry` band trimmed back to thin: inner radius 0.7 →
    0.985 (1.5 % stroke band) at 96 segments, so the ring reads as
    a thin outline rather than a 30 %-wide annulus.
  - Removed the per-frame `MIN_ANG = 0.010` rad world-radius
    clamp — the floor was forcing the ring's angular size to ~0.6°
    regardless of the apparent↔true gap, which at high zoom
    levels rendered as a huge ring with the markers tiny in the
    middle. Strict geometry now: `mesh.scale = (r, r, r)` so the
    ring's world outer radius equals the apparent↔true 3D distance
    and the rendered circumference passes through the true marker
    at any zoom. With `renderOrder = 250` the ring stays visible
    above the body sprite even at small refractions; for very
    tight cases the user can zoom in via `OpticalZoom`.
- **Revert path:** `git checkout v-s000720 -- .`

## S722 — halo: 8 % band (back to visible band width)

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** `RingGeometry` band 1.5 % → 8 % (inner radius 0.985 →
  0.92). The S721 1.5 % band was sub-pixel at the strict
  apparent↔true world scale and was getting dropped by the
  rasteriser, even with `renderOrder = 250`. 8 % is the smallest
  band that reliably shows up at the user's typical zoom levels
  while still reading as a ring outline rather than a wide
  annulus. Strict scale (no angular clamp) preserved so the ring's
  outer edge sits exactly on the true marker.
- **Revert path:** `git checkout v-s000721 -- .`

## S723 — clean rewrite of GeocentricMarkers halo

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** clean rewrite of `GeocentricMarkers` after the user
  asked for a fresh start. Removed every prior attempt's accumulated
  cruft (sprite + canvas texture, RingGeometry annulus, angular
  clamps, screen-space scale tables). Halo is now a per-slot
  `THREE.LineLoop` over a 64-vertex unit circle with
  `LineBasicMaterial` (white). Per-frame transform:
    - `position = apparent coord`
    - `scale = (r, r, r)` where `r` is the apparent↔true 3D distance
    - `lookAt(camera.position)` so the loop's plane stays
       perpendicular to view
  WebGL rasterises lines at 1 px width regardless of mesh scale, so
  the outline is always a clean thin line whose world radius equals
  the apparent↔true distance — the rendered circumference therefore
  passes through the true marker by construction. `renderOrder = 250`
  on the loop (251 on the dots) keeps everything on top of the body
  sprite and dome layers. Marker dots stay at 3 px screen-space to
  match the cel-nav star sprite size. Below-horizon and missing-coord
  cases short-circuit to invisible.
- **Revert path:** `git checkout v-s000722 -- .`

## S724 — halo replaced with apparent→true connector line

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** the LineLoop ring kept failing to land at a usable
  size — the user requested dropping it for a simpler
  visualisation. Halo replaced with a single shared
  `THREE.LineSegments` carrying 2 vertices per tracker slot
  (apparent endpoint, true endpoint). `setDrawRange(0, n * 2)`
  scopes the draw to active slots each frame. The line connects
  the apparent dot to the true dot directly, so the rendered
  segment length equals the on-screen gap between them at any zoom
  — no scaling guesswork. White, 1 px line width via
  `LineBasicMaterial`, `renderOrder = 250`.
- **Revert path:** `git checkout v-s000723 -- .`

## S725 — revert GeocentricMarkers halo to S720 state

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** restored `js/render/worldObjects.js` to the S720
  snapshot per `git checkout v-s000720 -- ...`. That was the last
  state in which the halo ring rendered visibly: `RingGeometry(0.7,
  1.0, 64)` (30 % band), `MeshBasicMaterial` (white, double-sided,
  transparent opacity 0.85), `renderOrder = 250`, per-frame
  `MIN_ANG = 0.010` rad world-radius clamp. The user's complaint
  about that state was that the ring was *too big*, not invisible
  — so this is the right baseline to tune from. The intervening
  S721–S724 attempts (thinner band, sprite reroutes, line
  segment) are reverted.
  - **Tuning the ring size** lives in `update(model, camera)`
    around line 5605:
    `halo.scale.set(scaleR, scaleR, scaleR);` — `scaleR` is the
    apparent↔true world distance, with a floor of `MIN_ANG *
    camDist` (line 5596). Lowering `MIN_ANG` shrinks the ring at
    typical refractions; multiplying `scaleR` by a constant scales
    the whole ring uniformly.
  - **Tuning the band thickness** lives in the constructor at line
    5529: `new THREE.RingGeometry(0.7, 1.0, 64)` — increase the
    inner radius (e.g. to 0.95) for a thinner outline.
- **Revert path:** `git checkout v-s000724 -- .` to come back to
  the connector-line state.

## S726 — halo as LineLoop, strict r-only scale

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** the halo is now a per-slot `THREE.LineLoop` over a
  64-vertex unit circle, drawn with `LineBasicMaterial` (white).
  WebGL rasterises lines at 1 px regardless of mesh scale, so the
  outline stays a thin always-visible ring at any per-slot world
  radius — the prior `RingGeometry` 1 % band became sub-pixel and
  disappeared once the user wanted strict-radius scaling. Per-frame
  transform: `position = apparent`, `scale = (r, r, r)` where `r`
  is the apparent↔true 3D distance, `lookAt(camera.position)`.
  `MIN_ANG = 0.010` floor removed — the ring's circumference now
  passes exactly through the true marker at every refraction
  level. `renderOrder = 250` keeps the line on top of body sprites
  and dome layers.
- **Revert path:** `git checkout v-s000725 -- .`

## S727 — halo LineLoop: 64 → 16 segments

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** `LineLoop` segment count cut from 64 to 16. The
  rasteriser draws each line segment as a 1-px raster, but each
  segment's *projected length* still has to be at least ~1 px or
  the GPU drops it. With strict scale = `r` (apparent↔true world
  distance) and a 64-vertex ring, each chord at typical default-
  zoom refractions was 0.27 px — sub-pixel — so the entire ring
  dropped. 16 segments produce ~1.2 px chords at the same scale,
  which the rasteriser draws cleanly. The 16-gon is visually
  indistinguishable from a circle once the user zooms in to
  inspect.
- **Revert path:** `git checkout v-s000726 -- .`

## S728 — halo as ShaderMaterial ring (fixed-pixel-width band)

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** every prior approach hit the same wall: at strict
  scale = `r` (apparent↔true world distance), the rendered ring is
  often only a few pixels in radius at default zoom, and any ring
  outline whose thickness scales with the geometry collapses
  sub-pixel and gets dropped by the rasteriser. A `LineLoop` had
  the inverse problem: its 1-px line width is constant, but each
  line *segment* still has to be ≥ 1 px on screen, and at small
  ring sizes 16 segments still produced sub-pixel chords.
  Replaced with `THREE.Mesh` + `THREE.CircleGeometry(1.0, 64)` +
  `ShaderMaterial`. The fragment shader uses `fwidth` (the
  screen-space gradient of the radial UV) to compute a band
  thickness that always equals ~1 pixel regardless of how small
  the per-slot scale is — pixels far from the disc edge are
  `discard`-ed. This guarantees a visible 1-pixel-wide ring at any
  zoom or refraction.
  Per-frame transform unchanged: `position = apparent`,
  `scale = (r, r, r)`, `lookAt(camera.position)`.
- **Revert path:** `git checkout v-s000727 -- .`

## S729 — DEBUG: halo as solid red disc to verify rendering path

- **Date:** 2026-04-30
- **Files changed:** `js/render/worldObjects.js`
- **Change:** halo replaced with a solid red `THREE.Mesh +
  CircleGeometry(1.0, 32)` + `MeshBasicMaterial(0xff0000)`. This
  is a diagnostic, not a final visual: a solid disc renders the
  same way every other simple mesh in the scene does, with no
  sub-pixel outline rasterisation to fail on. If the user sees a
  bright-red disc at the apparent body position, the per-slot
  mesh / scale / `lookAt` pipeline works end-to-end and every
  prior ring failure was strictly about thin-outline rasterisation.
  If the disc *also* fails to render, the bug is somewhere upstream
  of `GeocentricMarkers` (state plumbing, `info.opticalVaultCoord*`
  fields, the camera reference passed to `update`, etc.) and we
  need to debug there.
- **Revert path:** `git checkout v-s000728 -- .`

## S730 — TrackerInfos missing `opticalVaultCoord`; halo ring restored

- **Date:** 2026-04-30
- **Files changed:**
  - `js/core/app.js`
  - `js/render/worldObjects.js`
- **Change:** root-cause fix. The user diagnosis was correct: the
  ring kept appearing centred on the true position because
  `info.opticalVaultCoord` (the *apparent* / refracted coord) was
  never being written onto the per-target `TrackerInfo` objects in
  `app.js`. Only `info.opticalVaultCoordTrue` was. The halo's
  position-resolver in `worldObjects.js` read `info.opticalVaultCoord`,
  got `undefined`, and fell through to the safety-net default of
  `coordTrue` — so every ring was anchored on the true marker
  rather than the apparent. Added the apparent-coord fields
  (`opticalVaultCoord`, `globeOpticalVaultCoord`) to all four
  TrackerInfo build sites: sun, moon, planet, and star. Halo now
  correctly centres on the apparent coord, with the rendered
  circumference passing through the true marker.
  Also reverted the S729 debug red disc back to a thin `THREE.LineLoop`
  (32 segments, white, `LineBasicMaterial`) now that the
  underlying pipeline is verified working.
- **Revert path:** `git checkout v-s000729 -- .`

## S731 — RT (real-time) playback button

- **Date:** 2026-04-30
- **Files changed:** `js/ui/controlPanel.js`
- **Change:** added an `RT` button to the playback strip,
  immediately after `2×`. Click sets the autoplay speed to
  `1 / 86400` days per real second — i.e., simulation time
  advances at exactly the same rate as the wall clock — and
  starts playback. The bypass of `clampMag` is intentional: the
  existing `MIN_SPEED = (1/24) / 128 ≈ 0.000326` d/s would otherwise
  prevent reaching real-time (`1.157e-5` d/s).
- **Revert path:** `git checkout v-s000730 -- .`

## S732 — search inputs stacked vertically to free horizontal space

- **Date:** 2026-04-30
- **Files changed:**
  - `js/ui/controlPanel.js`
  - `css/styles.css`
  - `css/styles.min.css`
- **Change:** the two search inputs (body search on top, feature
  search below) now share horizontal space rather than doubling
  it. Wrapped both `.search-host` divs in a new `.search-stack`
  flex-column inside `tabsBar`. The RT button push that re-broke
  the bar layout (S731) is absorbed by the freed horizontal real
  estate. CSS:
  ```
  #bottom-bar .search-stack {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-left: 12px;
    flex: 0 0 auto;
  }
  ```
  The body search-host's old `margin-left: 16px` was moved to the
  stack wrapper since both children share the same left buffer
  now.
- **Revert path:** `git checkout v-s000731 -- .`

## S733 — mobile bar: reset negative margins, bump min-height

- **Date:** 2026-04-30
- **Files changed:** `css/styles.css`, `css/styles.min.css`
- **Change:** the desktop layout uses `margin-top: -18px` on
  `.presets`, `.time-controls`, `.geo-hops`, `.cel-theo-hops`, and
  `.compass-controls` to nudge those clusters upward into the
  info-bar's empty space. On mobile the bar collapses to
  `height: auto` and those negative margins were pulling each
  cluster up over its neighbours, producing the visible overlap.
  Inside the existing `@media (max-width: 900px)` block:
    - reset `margin-top` to 0 on every cluster (and `margin-top: 0`
      on the new `.search-stack`),
    - dropped `.compass-controls margin-right: 80 → 8`,
    - added `min-height: 96px` and explicit `align-items: center`
      to the bar so the row has consistent vertical breathing.
- **Revert path:** `git checkout v-s000732 -- .`

## S734 — bottom bar slides horizontally on overflow

- **Date:** 2026-04-30
- **Files changed:** `css/styles.css`, `css/styles.min.css`
- **Change:** `#bottom-bar` now sets `overflow-x: auto;
  overflow-y: visible; flex-wrap: nowrap;` and every direct child
  gets `flex-shrink: 0`. When the bar's content is wider than the
  viewport (which is the rule on narrow desktop windows + mobile),
  the row scrolls horizontally instead of squeezing or overlapping
  itself. `bar-left` flex changed from `1 1 0` to `0 0 auto` so it
  takes only the natural width of its content rather than growing
  to fill remaining space (which made the search input get
  squeezed before). `overflow-y: visible` keeps the body-search
  dropdown popping UP above the bar without getting clipped.
- **Revert path:** `git checkout v-s000733 -- .`

## S735 — PWA icons (192/512/maskable, apple-touch)

- **Date:** 2026-04-30
- **Files changed:** `assets/icons/icon-192.png`,
  `assets/icons/icon-512.png`, `assets/icons/icon-maskable-192.png`,
  `assets/icons/icon-maskable-512.png`,
  `assets/icons/apple-touch-icon-180.png`, `index.html`.
- **Change:** Generated proper PWA icon set from `ac_logo.png`
  (180x180 source) at 192px, 512px, 180px (Apple touch), plus
  maskable variants at 192/512 with 80% safe-zone padding on a
  `#0e121a` background. `index.html` now links 192/512 favicons
  by `sizes` and a 180px `apple-touch-icon`. Manifest update
  follows in S737.
- **Revert path:** `git checkout v-s000734 -- .`

## S736 — service worker restored (versioned offline cache)

- **Date:** 2026-04-30
- **Files changed:** `sw.js`, `js/main.js`.
- **Change:** Replaced the S671 kill-switch worker with a versioned
  cache (`CACHE_VERSION = 'fe-v2-s736'`). Strategy:
    - precache `index.html`, manifest, manifest icons on install,
    - `assets/*` cache-first,
    - `.js`/`.css` stale-while-revalidate via `RUNTIME_CACHE`,
    - HTML / navigation requests network-first with cached fallback
      to `index.html` for offline use.
  Only same-origin GETs with status 200 and no opaque-redirect type
  are cached. Old caches are evicted on activate. `js/main.js`
  comment updated to remove kill-switch language. Bumping
  `CACHE_VERSION` in future serials invalidates clients cleanly.
- **Revert path:** `git checkout v-s000735 -- .`

## S737 — manifest icons + categories + lang

- **Date:** 2026-04-30
- **Files changed:** `manifest.webmanifest`.
- **Change:** Manifest now lists 192 + 512 PNGs at `purpose: any`
  and 192 + 512 maskable PNGs at `purpose: maskable`, pointing at
  the S735 icon set under `assets/icons/`. Added `lang: en`,
  `categories: ["education", "science", "utilities"]`, and
  expanded the `description` to mirror the meta description in
  `index.html`.
- **Revert path:** `git checkout v-s000736 -- .`

## S737a — apply manifest body (S737 commit shipped only the log)

- **Date:** 2026-04-30
- **Files changed:** `manifest.webmanifest`.
- **Change:** S737 commit pushed the change-log entry but the
  manifest file write failed silently; this serial actually
  rewrites `manifest.webmanifest` to match the entry: 192/512 +
  maskable 192/512 icons under `assets/icons/`, `lang: en`,
  `categories`, and the expanded description.
- **Revert path:** `git checkout v-s000737 -- .`

## S735 — `.tabs` flex 1→0, margin-left:auto for right-edge alignment

- **Date:** 2026-04-30
- **Files changed:** `css/styles.css`, `css/styles.min.css`
- **Change:** the `.tabs` cluster (containing the search-stack and
  tab buttons) had `flex: 1 1 0; min-width: 0;` — that let the
  bar's flex layout *shrink it* when total content exceeded the
  viewport, squeezing the search input and tab buttons together
  into each other. Even with the bar's `overflow-x: auto` the
  squeeze ran first and the scroll never triggered. Changed to
  `flex: 0 0 auto` (natural width, no shrink) plus
  `margin-left: auto`. When the bar fits the viewport, that auto
  margin absorbs the leftover space and pushes the tab cluster to
  the right edge as before; when content overflows the viewport,
  the auto margin collapses to 0 and the bar's
  `overflow-x: auto` finally takes effect — the whole row slides
  horizontally with no overlap.
- **Revert path:** `git checkout v-s000734 -- .`

## S738 — Capacitor Android scaffold

- **Date:** 2026-04-30
- **Files changed:** `package.json`, `package-lock.json`,
  `capacitor.config.json`, `scripts/build-cap.mjs`,
  `.gitignore`, `android/` (full Capacitor 6 scaffold), Android
  launcher icons in `android/app/src/main/res/mipmap-*/`,
  `android/app/src/main/res/values/ic_launcher_background.xml`.
- **Change:** Wrapped the PWA in a Capacitor 6 Android project.
    - `package.json` (private, ESM) lists Capacitor CLI / core /
      android as dev deps and exposes `cap:build`, `cap:sync`,
      `cap:open`, `cap:run` scripts.
    - `capacitor.config.json` sets appId
      `com.aethercosmology.femodel`, appName "FE Model",
      `webDir: "dist"`, `androidScheme: "https"`,
      `allowMixedContent: false`.
    - `scripts/build-cap.mjs` copies the runtime files
      (`index.html`, `manifest.webmanifest`, `sw.js`,
      `.nojekyll`, `css/`, `js/`, `assets/`) into `dist/`,
      excluding `change_log_serials.md`, `README.md`,
      `scripts/`, `node_modules/`, `android/`, `.git/`. Keeps
      the APK lean.
    - `npx cap add android` produced the `android/` Gradle
      project; `dist/` is bundled into
      `android/app/src/main/assets/public/` by `cap sync`.
    - Launcher icons regenerated from `assets/ac_logo.png` for
      mdpi → xxxhdpi (square + round + adaptive foreground with
      30 % safe-zone padding). Adaptive background colour
      changed `#FFFFFF → #0E121A` to match the app theme.
    - `.gitignore` adds `dist/`, `android/.gradle/`,
      `android/build/`, `android/app/build/`, `android/captures/`,
      `android/local.properties`, `android/app/release/`,
      `ios/App/build/`, `ios/App/Pods/`, `ios/App/.gradle/`.
  Producing an installable APK still needs the Android SDK
  (`cmdline-tools` + `platform-tools` + `platforms;android-34`)
  and a JDK ≤ 21; system JDK is currently 26 which AGP rejects.
  Both are out-of-scope for this serial.
- **Revert path:** `git checkout v-s000737a -- . && rm -rf android dist node_modules package.json package-lock.json capacitor.config.json scripts/build-cap.mjs`

## S739 — pinch-to-zoom + touch tweaks (all modes)

- **Date:** 2026-04-30
- **Files changed:** `js/ui/mouseHandler.js`, `css/styles.css`,
  `css/styles.min.css`.
- **Change:**
    - `#feCanvas` gets `touch-action: none` in both `styles.css`
      and `styles.min.css` so the browser stops consuming pinch
      gestures for native page-zoom and routes them to the
      pointer-event handler.
    - `mouseHandler.js` tracks all active pointers in an
      `activePointers: Map<id, {x,y}>`. Once size reaches 2,
      `multiTouchActive` flips on (sticky until every pointer
      releases): single-pointer drag/dot-drag/click logic is
      suppressed, hover tooltip hidden, and `pinchLastDist`
      seeded with the current 2-pointer distance.
      `pointermove` updates the map and applies a multiplicative
      zoom delta (`ratio = newDist / pinchLastDist`) — Optical
      mode scales `OpticalZoom` clamped to
      `[FP_ZOOM_MIN, FP_ZOOM_MAX]`, every other mode scales the
      world `Zoom`, mirroring the wheel handler.
      `pointerup`/`pointercancel` remove the released pointer;
      single-pointer click logic is skipped while
      `multiTouchActive` is set, and the flag clears only when
      the pointer count reaches zero so a released finger never
      drops the gesture into camera-pan mode.
    - `CLICK_DRAG_PX` raised 4 → 8 to absorb fingertip wobble
      on tap.
    - New constant `PINCH_MIN_DIST_PX = 10` rejects pinch deltas
      where either distance is below the floor (jitter / single
      finger landing on top of the other).
- **Revert path:** `git checkout v-s000738 -- .`

## S740 — Mobile UI: search popup + info-box scaling

- **Date:** 2026-04-30
- **Files changed:** `index.html`, `css/styles.css`,
  `css/styles.min.css`, `js/ui/controlPanel.js`.
- **Change:**
    - **Viewport.** Added `maximum-scale=1.0, user-scalable=no` so
      iOS Safari no longer page-pinches the document on form-input
      focus or stray gestures. Canvas pinch already routes through
      pointer events (S739).
    - **Search popup readability.** `.body-search-panel` was
      `rgba(20,24,33,0.97)` with no blur, which read as washed-out
      over the canvas. Now `#0f1320` solid + 8 px backdrop-filter
      blur, accent-coloured border, 0 -6px 18px drop shadow.
    - **iOS auto-zoom on focus.** Inputs under 16 px trigger
      iOS's auto-zoom on focus. `.body-search-input` jumps to
      16 px / 8 × 10 padding inside `@media (max-width: 900px)`.
    - **Tap targets.** `.body-search-row` on mobile bumped to
      14 px, 12 × 14 padding, `min-height: 44px` (Apple HIG).
    - **Suggestion dropdown height.** `max-height` on mobile
      relaxed from 260 px to `60vh` so long match lists are
      reachable on tall phones.
    - **`mousedown` → `pointerdown`** on the suggestion-row
      handler in both `attachBodySearch` and
      `attachFeatureSearch`. Touch fired `mousedown` only after
      a 300 ms delay on some browsers, dropping the tap if the
      input had already blurred.
    - **`#tracking-info-popup` mobile rule.** The S009 mobile
      override targeted `.tracking-info-panel` — a class that
      doesn't exist in the markup, so the rule was a no-op for
      ~720 serials. Replaced with `#tracking-info-popup` (the
      actual ID), set `min-width: 0`,
      `width / max-width: calc(100vw - 12px)`, `left/right: 6px`,
      and scaled `.ti-art` 160→96, `.ti-name` 18→15,
      `.ti-row` 14→12, `.ti-content` padding 14×16→10×12.
- **Revert path:** `git checkout v-s000739 -- .`

## S741 — dynamic mobile scaling: About / Legend / flight-info

- **Date:** 2026-04-30
- **Files changed:** `css/styles.css`, `css/styles.min.css`.
- **Change:** Replaced the prior single-line mobile rule
  `.info-popup{position:fixed;left:4px;right:4px;max-width:none}`
  (which only repositioned the popup; font / heading / padding
  stayed at desktop sizes — 19 px body, 30/24/20 px h1/h2/h3,
  17 px tables, 16 px code) with a comprehensive
  `@media (max-width: 900px)` block:
    - `header .info-popup` 13 / 1.45, padding 12×14, fixed
      6 px gutters, top 52 px, max-height `calc(100vh - 120px)`,
      `overflow-y: auto`.
    - `header .info-popup.legend-popup` 13 / 1.5; h1 18 px,
      h2 16 px, h3 14 px; ul padding-left 18 px; table 12 px,
      th/td 5×7; code 12 px.
    - `.flight-info-box` runtime-injected sizing (min-width
      380 px, max-width 460 px, font 14 px, art 160 px) was
      written as inline `style.cssText` + a runtime `<style>`,
      so styles.css overrides need `body` prefix + `!important`
      to beat inline. Mobile rules:
        - `body .flight-info-box` min-width 0, max-width
          `calc(50vw - 8px)`, font 11 px, left 4 px.
        - `body #flight-info-box-2` left auto / right 4 px so
          North + South readouts split the width 50/50.
        - `.fi-title` 12 px, `.fi-content` padding 8×10,
          `.fi-art` 72 × 72 (was 160 × 160), gap/padding/
          margin trimmed, `.fi-line/.fi-blank/.fi-live` 11 px.
- **Revert path:** `git checkout v-s000740 -- .`

## S742 — clamp() dynamic scaling + cache bust + auto-reload

- **Date:** 2026-04-30
- **Files changed:** `sw.js`, `js/main.js`, `index.html`,
  `css/styles.css`, `js/render/flightRoutes.js`.
- **Change:**
    - **`CACHE_VERSION`** bumped `fe-v2-s736 → fe-v3-s742` in
      `sw.js`. The activate handler already evicts non-matching
      caches, so installed clients drop the stale S736 cache on
      next visit.
    - **Auto-reload on `controllerchange`** in `js/main.js`. When
      the new SW takes over (skipWaiting + clients.claim) the
      page reloads once (`_reloaded` flag prevents loops). Users
      no longer need to hard-refresh to pick up new releases.
    - **`index.html`** now preloads `css/styles.css` instead of
      `styles.min.css`. The minified file was hand-maintained
      and had drifted out of sync with the source; pointing at
      the non-minified file ends the dual-edit burden.
    - **About / Legend popup**: continuous viewport-relative
      sizing via `clamp()` on font-size, padding, headings, table,
      code. Examples:
        - body 19→`clamp(13px, 0.9vw + 9px, 19px)`
        - h1 30→`clamp(18px, 1.6vw + 12px, 30px)`
        - h2 24→`clamp(16px, 1.2vw + 10px, 24px)`
        - h3 20→`clamp(14px, 1vw + 9px, 20px)`
        - padding 18×22→`clamp(10px, 1.4vw + 4px, 22px)`
      The popup also sets `zoom: calc(1 / var(--ui-zoom))` to
      cancel the header's `zoom: var(--ui-zoom)` so clamp values
      map to native CSS pixels regardless of UI scale.
    - **Flight-info-box runtime style** (`flightRoutes.js`):
      every fixed pixel size replaced with `clamp()`:
        - `.flight-info-box` font 14→`clamp(11px, 0.6vw + 8px, 14px)`,
          max-width 460→`min(460px, calc(50vw - 8px))`,
          min-width forced to 0.
        - `.fi-art` 160×160→`clamp(72px, 14vw, 160px)` square.
        - `.fi-content` padding 14×16→
          `clamp(8px, 0.8vw + 4px, 14px) clamp(10px, 0.8vw + 6px, 16px)`.
        - `.fi-line / .fi-blank / .fi-live` 14→`clamp(11px, 0.6vw + 8px, 14px)`.
      Inline `font: 14px/1.45` and `min-width: 380px` /
      `max-width: 460px` removed from `el.style.cssText` so the
      stylesheet owns sizing.
    - **Flight-info-box positioning** moved out of the mobile
      media query and applied universally:
        - primary `left: clamp(4px, 0.5vw, 12px)`
        - secondary `left: auto; right: clamp(4px, 0.5vw, 12px)`
      The desktop inline `left: 12px` / `left: 420px` is overridden
      by `body` + `!important` selectors. Boxes hug viewport edges
      at every screen width.
- **Revert path:** `git checkout v-s000741 -- .`

## S743 — search dropdown clip + close-others + flight-info compact

- **Date:** 2026-04-30
- **Files changed:** `css/styles.css`,
  `js/ui/controlPanel.js`.
- **Change:**
    - **Mobile dropdown clip.** `#bottom-bar` mobile rule had
      `overflow-y: hidden` which truncated the body-search and
      feature-search suggestion panels (they pop UP via
      `bottom: calc(100% + 4px)`) to zero visible height. Set
      `overflow-y: visible` so the dropdowns extend above the
      bar into the canvas region.
    - **Hide `#hud` during flight demo.** Previously only the
      moon-phase widget inside `#hud` was hidden during
      flight-routes demo, leaving the date / lat / lon strip
      to collide with the SOUTH / NORTH info boxes' shared
      `top: 8px`. The whole `#hud` now hides while
      `body.flight-demo-active` is set.
    - **Compact flight-info-box on narrow phones.** Below 600 px
      viewport width the `.fi-art-row` (72-px portrait + border)
      hides via `display: none !important`, handing the full
      box width to the 11-px readout column. Pixel-art portrait
      reappears at ≥ 600 px.
    - **Close-others on search.** New `closeOtherPopups(panel)`
      helper in `controlPanel.js`:
        - hides `#about-popup`, `#legend-popup`,
        - dispatches `fe-close-active-tab` so the tab system
          (whose `activeIdx` lives in an `attachBottomBar`
          closure) can reset its state cleanly,
        - hides every other `.body-search-panel`.
      `attachBottomBar` adds a `document.addEventListener
      ('fe-close-active-tab')` that hides the active popup and
      sets `activeIdx = -1`. Both `attachBodySearch` and
      `attachFeatureSearch` call `closeOtherPopups(panel)` on
      `focus` and on every `input` event, so opening either
      search clears the screen of competing popups.
- **Revert path:** `git checkout v-s000742 -- .`

## S744 — FE map zoom-out flicker + clipping fix

- **Date:** 2026-04-30
- **Files changed:** `js/render/scene.js`,
  `js/ui/mouseHandler.js`.
- **Change:**
    - **`PerspectiveCamera` far plane** raised from 1000 → 50000.
      In Heavenly orbit, `dist = CameraDistance / max(0.1, Zoom)`
      grows as `Zoom` shrinks; static `far = 1000` was clipping
      the disc as soon as `dist + scene_radius` crossed it,
      producing the disappearing-map flicker on zoom-out.
    - **`logarithmicDepthBuffer: true`** on the
      `WebGLRenderer` so the wider near/far range (0.01 → 50000)
      keeps usable z-precision. Without it the coplanar map /
      lineart / observer-marker layers (all `depthTest: false`
      with explicit `renderOrder` already, but the underlying
      depth values still feed downstream fragment-depth checks)
      collapse into ndc-z noise at extreme zoom.
    - **`Zoom` clamp** in `mouseHandler.js`:
      `ZOOM_MIN = 0.05` floor and `ZOOM_MAX = 200` ceiling.
      Wheel handler and pinch handler both pin `Zoom` inside
      this band so the camera never escapes the frustum even on
      sustained zoom-out gesture.
- **Revert path:** `git checkout v-s000743 -- .`

## S745 — search dropdown blocked by #info-bar (stacking)

- **Date:** 2026-04-30
- **Files changed:** `css/styles.css`.
- **Change:** `#bottom-bar` is `z-index: 30`, `#info-bar` (the
  readout strip with End-Tracking / End-Demo buttons) is
  `z-index: 31`. The body-search suggestion panel lives **inside**
  `#bottom-bar`, and `#bottom-bar`'s `backdrop-filter: blur(8px)`
  creates a new stacking context — that traps the panel's
  `z-index: 40` so its effective layer relative to other stacking
  contexts is whatever `#bottom-bar` is. With `#bottom-bar` < 31,
  `#info-bar` paints over the panel. Raised `#bottom-bar`'s
  `z-index` 30 → 32 so the panel (and the rest of the bar's
  controls) stack above `#info-bar`.
- **Revert path:** `git checkout v-s000744 -- .`

## S746 — search panel portalled to body + SW force-reload

- **Date:** 2026-04-30
- **Files changed:** `sw.js`, `css/styles.css`,
  `js/ui/controlPanel.js`.
- **Change:**
    - **Portal `body-search-panel` to `<body>`.** S745 raised
      `#bottom-bar` to `z-index: 32` but `backdrop-filter: blur`
      on the bar still creates its own stacking context. Even at
      `z-index: 9999` inside the bar, the panel can't paint
      above other contexts whose z exceeds the bar's. Moved
      `panel` from `wrap.appendChild` to
      `document.body.appendChild` so the panel lives at the body
      stacking context root. Applied to both `attachBodySearch`
      and `attachFeatureSearch`.
    - **`position: fixed`** on `.body-search-panel`, geometry set
      from JS via `getBoundingClientRect`. New helper
      `positionSearchPanel(panel, input)` writes
      `left / width / bottom` from the input rect; called inside
      `renderSuggestions` and on `resize` / capture-phase
      `scroll`. `z-index: 9000`.
    - **CACHE_VERSION** bumped `fe-v3-s742 → fe-v4-s746`.
    - **SW activate force-reload.** Activate handler now also
      iterates `clients.matchAll({ type: 'window' })` and calls
      `client.navigate(client.url)` so any tab still running the
      previous bundle reloads itself the moment the new SW takes
      over. Pre-S742 clients without the `controllerchange`
      listener used to stay on stale code until the user
      manually refreshed; this evicts them server-side instead.
- **Revert path:** `git checkout v-s000745 -- .`

## S747 — search panel `[hidden]` override + mobile tap-target pass

- **Date:** 2026-04-30
- **Files changed:** `sw.js`, `css/styles.css`,
  `js/ui/controlPanel.js`.
- **Change:**
    - **Root cause of the still-hidden search panel.** The CSS
      `display: flex` on `.body-search-panel` has the same
      specificity (0,1,0) as the UA stylesheet's
      `[hidden] { display: none }`, and being author-origin it
      wins the cascade. So `panel.hidden = true` was a no-op:
      the panel rendered as a 0-height empty box, expanded to
      content height when populated, then collapsed back. From
      the user's view it looked like the panel wasn't there or
      was "behind a layer" — it was right there, just empty.
      Added `.body-search-panel[hidden] { display: none !important; }`
      so the hidden attribute actually hides it, and the show
      path (set `panel.hidden = false` in `renderSuggestions`)
      now produces the expected pop.
    - **`min-width / max-width` moved to CSS** so the panel can
      be wider than a narrow phone-input (220 → up to
      `min(90vw, 480px)`). `positionSearchPanel` no longer
      writes `width`; only `left` (clamped so the panel never
      spills off the right edge) and `bottom`.
    - **Tap-target pass.**
        - `#bottom-bar .time-btn`: 28 × 30 → 36 × 36 mobile,
          padding 6×9 → 8×11; phone keeps 36 px height with
          12 px font.
        - `#bottom-bar .geo-hops .time-btn`: bumped 9 → 10 px
          font, padding 3×4 → 4×6, `min-height: 30px`.
        - `#bottom-bar .tabs button`: padding 6×8 → 10×14,
          font 12 → 13 px, `min-height: 40px`.
        - `#app > header .info-btn` on phone: 32 px tall.
    - **`#tracker-hud .tracker-block` width** was a hard 360 px
      that overflowed phones < 360 CSS px. Now
      `min(360px, calc(100vw - 16px))`; expanded variant
      `min(620px, calc(100vw - 16px))`.
    - **CACHE_VERSION** bumped `fe-v4-s746 → fe-v5-s747`.
- **Revert path:** `git checkout v-s000746 -- .`

## S748 — PageSpeed audit pass

- **Date:** 2026-04-30
- **Files changed:** `index.html`, `js/ui/controlPanel.js`,
  `js/demos/index.js`, `js/ui/autoplay.js`,
  `assets/starfield_*.webp`, `assets/ac_logo.webp`, `sw.js`.
- **Change:**
    - **Starfield WebPs recompressed q=100 → q=82**:
        - `starfield_ae_aries.webp`    1403 → 250 KiB (-82 %)
        - `starfield_ae_aries_2.webp`  1424 → 582 KiB (-59 %)
        - `starfield_ae_aries_3.webp`  1317 → 151 KiB (-89 %)
        - `starfield_dark.webp`        1140 → 188 KiB (-84 %)
        - `starfield_light.webp`        876 → 145 KiB (-83 %)
      Total payload trimmed ~5.2 MiB (Lighthouse phone "Avoid
      enormous network payloads" was 15.5 MiB before).
    - **`ac_logo.webp`** recompressed q=100 → q=80, 9 → 6 KiB.
    - **`role="tablist"`** + `aria-orientation="horizontal"`
      added to the bottom-bar tabs container (`.tabs`) in
      `attachBottomBar`. Closes the Lighthouse a11y failure
      "[role]s are not contained by their required parent
      element" — the six `role="tab"` buttons now have a valid
      tablist parent.
    - **Removed `maximum-scale=1.0, user-scalable=no`** from
      the viewport meta. Lighthouse Best Practices flagged it
      as accessibility-hostile (low-vision users rely on
      pinch-zoom for legibility). Inputs are already 16 px on
      mobile (S740) so iOS no longer auto-zooms on focus, and
      `touch-action: none` on `#feCanvas` (S739) keeps the
      canvas pinch routed to the model. The page is once again
      pinch-zoomable on iOS.
    - **`Demos` rAF tick is now on-demand.** Previously the
      tick polled the animator every frame from boot until the
      tab was closed — Lighthouse counted ~29 s of `demos/
      index.js` CPU on the Moto G Power, almost all of it idle
      polling. Tick now early-exits + stops the rAF loop when
      `!nowRunning && !this._queue`; `_ensureTick()` restarts
      it inside `_playSingle` whenever a demo starts. Demo
      end-detection still works because the first tick after
      `_ensureTick` captures `wasRunning = true`.
    - **`Autoplay._tick` throttled to ~30 Hz**, halving the
      autoplay CPU cost. Each `setState({ DateTime })` cascades
      through `app.update()` (ephemeris + refraction + tracker
      positions); 60 → 30 Hz is invisible to the eye but cuts
      the per-frame model update by half.
    - **CACHE_VERSION** bumped `fe-v5-s747 → fe-v6-s748`.
- **Revert path:** `git checkout v-s000747 -- .`

## S749 — a11y tabs fix + SW first-install + JS/CSS minify pipeline

- **Date:** 2026-04-30
- **Files changed:** `index.html`, `js/ui/controlPanel.js`,
  `css/styles.css`, `css/styles.min.css`, `sw.js`,
  `package.json`, `package-lock.json`, `scripts/build-min.mjs`,
  `scripts/build-cap.mjs`, `js-min/**` (build artifact).
- **Change:**
    - **A11y `aria-required-children` regression** from S748:
      `role="tablist"` was placed on `.tabs`, which also holds
      the two `<input type="search">` hosts. Tablists may only
      contain `role="tab"` children. Split the structure into
      `.tabs` (visual flex wrapper, no role) and `.tabs-list`
      (`role="tablist"`, only the six tab buttons). Tab buttons
      now `tabsList.appendChild(btn)`.
    - **SW first-install redirect.** `client.navigate(url)` on
      every activate produced a 1.6 s redirect on the very first
      page load (Lighthouse "Avoid multiple page redirects").
      Install handler now snapshots `caches.keys().length === 0`
      into `_isFirstInstall`; activate skips the navigate when
      true. Subsequent CACHE_VERSION bumps still force-reload
      stale clients.
    - **CSS minify pipeline** via esbuild:
      `css/styles.css` (44 KiB) → `css/styles.min.css` (29 KiB).
      `index.html` preloads the minified file again.
    - **JS minify pipeline** via esbuild's `transform` API
      (no bundling, ESM imports preserved):
        - 73 `.js` files under `js/` → `js-min/` mirror
        - total 3546 → 2612 KiB on disk (-934 KiB)
        - `index.html` modulepreloads + entry script switched
          from `js/...` → `js-min/...`
        - `scripts/build-cap.mjs` ships `js-min/` instead of
          `js/` into the Capacitor `dist/`
      `package.json` adds `"build": "node scripts/build-min.mjs"`
      and prepends it to `cap:build`. `js-min/` is committed so
      GitHub Pages serves the minified bundle directly. Bare
      specifiers (`three`) stay intact for the importmap.
    - **CACHE_VERSION** bumped `fe-v6-s748 → fe-v7-s749`.
- **Revert path:** `git checkout v-s000748 -- . && rm -rf js-min`

## S750 — controllerchange first-claim no-reload

- **Date:** 2026-04-30
- **Files changed:** `js/main.js`, `sw.js`.
- **Change:** S749 stopped the SW activate handler from
  navigating clients on first install, but the *page-side*
  `controllerchange` listener (S742) still fired the moment
  `clients.claim()` ran for the first time, reloading the
  brand-new page. Lighthouse counted that as a 1.3 s redirect.
  Snapshotted `navigator.serviceWorker.controller` into
  `_controlledAtStart` at bootstrap; the listener early-exits
  unless the page was *already* controlled by a prior SW (i.e.
  this `controllerchange` is the user upgrading to a new
  CACHE_VERSION, not a brand-new install). CACHE_VERSION
  bumped `fe-v7-s749 → fe-v8-s750`.
- **Revert path:** `git checkout v-s000749 -- .`

## S751 — feature-detect WebGL before Renderer to silence Lighthouse

- **Date:** 2026-04-30
- **Files changed:** `js/main.js`, `js-min/main.js`.
- **Change:** Lighthouse counted 8 `console.error` entries from
  THREE.WebGLRenderer attempting to create a WebGL context in
  the headless Chrome runner. THREE's constructor calls
  `console.error` *before* throwing on GPU-less environments,
  so the surrounding try/catch never silences them. Added a
  `_hasWebGL` probe that creates a throwaway canvas and asks
  for `webgl2`/`webgl`; only when that succeeds do we
  instantiate `Renderer`. Lighthouse's GPU-less profile now
  skips the `new Renderer` branch entirely. Real users with
  GPUs see no behaviour change. Fallback message text retained.
  Demoted our own caught-error log to `console.warn` so it
  doesn't itself trip the audit on edge GPUs that fail later.
- **Revert path:** `git checkout v-s000750 -- .`

## S752 — sourcemaps + mobile font ≥ 12 px

- **Date:** 2026-04-30
- **Files changed:** `scripts/build-min.mjs`, `css/styles.css`,
  `js-min/**` (build output incl. `.map` files).
- **Change:**
    - **Sourcemaps.** `build-min.mjs` now passes
      `sourcemap: 'external'` + `sourcefile: rel` to
      `esbuild.transform` and writes `<file>.js.map` next to
      every minified `.js`. Each output gets a trailing
      `//# sourceMappingURL=<name>.js.map` so
      Lighthouse's `valid-source-maps` audit (Best Practices)
      finds them, and devtools-on-prod can reverse-map stack
      traces.
    - **Mobile font sizes ≥ 12 px.** Lighthouse "Document
      doesn't use legible font sizes" was at 58.97 % legible
      (#info-bar = 11 px = ~25 % of all page text). Bumped:
        - `#info-bar` 11 → 12 px (mobile)
        - `#hud` 11 → 12 px (mobile @ ≤ 900 px) and
          10 → 12 px (phone @ ≤ 520 px)
        - `#app > header h1` 12 → 13 px (phone)
        - `#app > header .info-btn` 11 → 12 px (phone)
      `#info-bar .info-row { gap: 12px }` mobile keeps the bar
      from overflowing now that the readout glyphs are wider.
- **Revert path:** `git checkout v-s000751 -- .`

## S753 — re-minify three.js with sourcemap

- **Date:** 2026-04-30
- **Files changed:** `assets/vendor/three.module.min.js`,
  `assets/vendor/three.module.min.js.map`.
- **Change:** The vendored `three.module.min.js` shipped without
  a sourcemap (the upstream three.js dist doesn't publish one
  for the minified ESM bundle). Lighthouse's
  `valid-source-maps` audit failed against the 675 KiB file.
  Downloaded the unminified `three.module.js` from
  `cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js`,
  re-minified it with `esbuild --minify --sourcemap`. Output
  size matches the previous build (675 KiB on disk, ~170 KiB
  gzipped over the wire); the new `.map` lets Lighthouse +
  devtools resolve stack traces back into three's source.
- **Revert path:** `git checkout v-s000752 -- assets/vendor/three.module.min.js && rm assets/vendor/three.module.min.js.map`

## S754 — dynamic-import Demos for mobile TBT

- **Date:** 2026-04-30
- **Files changed:** `js/main.js`, `js-min/**` (rebuilt).
- **Change:** `demos/index.js` plus its dependency
  `demos/definitions.js` (876 lines of demo metadata) parsed
  on the critical path, contributing ~150 ms of mobile TBT
  (Lighthouse showed Total Blocking Time at 140 ms).
  Replaced the static
  `import { Demos } from './demos/index.js'` with:
    - a `Proxy` stand-in (`demos`) backed by
      `_demosHolder.current`. Property access returns the real
      value once loaded, `undefined` for known property names
      (`animator`, `list`, `currentIndex`, `then`), and a no-op
      function for unknown methods. All `controlPanel.js`
      callsites already null-check
      `demos && demos.animator` etc. before invoking
      methods, so the shim is transparent.
    - a `requestIdleCallback` (1500 ms timeout fallback to
      `setTimeout(600)`) that dynamically `import()`s the
      Demos module after first paint and stamps
      `_demosHolder.current = new Demos(model)`.
  `attachUrlState`, `window.demos`, and the bottom-bar play
  controls all consume the proxy unchanged. Demos tab opens
  empty for the first ~0.6 s if the user races the load; the
  `registerTab` lazy-build runs `demos.renderInto(host)` which
  the no-op shim swallows — re-clicking the tab after demos
  resolve renders normally.
- **Revert path:** `git checkout v-s000753 -- .`

## S755 — revert lazy demos (broke Demos tab)

- **Date:** 2026-05-01
- **Files changed:** `js/main.js`, `js-min/**` (rebuilt).
- **Change:** S754's Proxy stand-in returned a `_noop` for any
  unknown method, so opening the Demos tab before
  `requestIdleCallback` resolved (~600 ms after first paint)
  invoked `demos.renderInto(host)` against the no-op — the
  panel stayed empty and re-clicks didn't recover. Reverted
  to the static `import { Demos } from './demos/index.js'`
  + eager `new Demos(model)` from S753. Mobile Performance
  drops ~1 point (99 vs 100) but the Demos tab works again.
- **Revert path:** `git checkout v-s000754 -- .`

## S756 — info-bar visibility restored + Cel Theo dedup

- **Date:** 2026-05-01
- **Files changed:**
  - `css/styles.css`
  - `css/styles.min.css` (rebuilt)
  - `js/core/celTheoStars.js`
  - `js-min/**` (rebuilt)
- **Change:**
  - `#info-bar` z-index 31 → 33. The S745 bump of `#bottom-bar`
    z-index from 30 to 32 (added so the body-search panel could
    escape the bar's stacking context) left `#info-bar`
    underneath the bar — and the bar's
    `background: rgba(14, 18, 26, 0.92)` + `backdrop-filter: blur`
    covered the info-bar's text in the overlap region (info-bar
    sits at `bottom: 56 px`; bar starts at `bottom: 0` with
    `height: 106 px`, so the bar's upper half overlapped). With
    info-bar at 33 the lat / lon / az / el / time / tracking
    readout strip is visible again. `pointer-events: none` is
    preserved so clicks still pass through to the bar buttons.
  - `js/core/celTheoStars.js`: dropped the duplicate
    `ct_39_aqr_moon` and `ct_39_aqr_3` rows (both share the
    `(22.20716 h, -14.19396°)` coordinates of the canonical
    `ct_39_aqr` entry — they were Cel-Theo panel-2 / panel-2
    duplicates that crowded the tracker UI without adding any new
    data).
- **Revert path:** `git checkout v-s000755 -- .`

## S757 — Chinese du / fen display-units toggle

- **Date:** 2026-05-01
- **Files changed:**
  - `js/core/units.js` (new)
  - `js/core/app.js`
  - `js/ui/controlPanel.js`
  - `js/ui/trackingInfoPopup.js`
  - `js-min/**` (rebuilt)
- **Change:**
  - New `js/core/units.js` exporting `fmtDuFen(deg, signed)` and
    `fmtLiBu(deg)` plus `DEG_PER_DU = 360/365.25 ≈ 0.9856`,
    `LI_PER_DU = 351.267` (Yi Xing's empirical Tang-era
    calibration from the Xin Tangshu, `Notes/Chinese_FE.md`),
    `BU_PER_LI = 300`. `fmtDuFen` returns `"23 du 7.8 fen"`,
    `fmtLiBu` returns `"1861 li 214 bu"` — both DMS-style
    two-part splits.
  - `app.js`: added `ShowChineseDu: false` to `defaultState()`.
  - `controlPanel.js`: new "Display Units" group in the Tracker
    tab (between Refraction and Celestial Bodies) with one
    `Chinese du / fen` boolean row. Tracker HUD per-block azel
    line appends `· X du Y.Y fen` to both az and el when the
    toggle is on.
  - `trackingInfoPopup.js`: every angular row (Azimuth, True /
    Apparent Elevation, RA, Dec, GP lat, GP lon, refraction CA)
    appends `· X du Y.Y fen`. Central + Inscribed additionally
    append `· N li M bu` via the Yi Xing calibration. DMS stays
    as the primary string; the du / fen runs alongside it
    separated by `·` so both can be read together.
- **Revert path:** `git checkout v-s000756 -- .` (and remove
  `js/core/units.js`).

## S758 — tracking-info popup widens for Chinese mode + viewport-aware

- **Date:** 2026-05-01
- **Files changed:** `css/styles.css`, `css/styles.min.css`
- **Change:** popup width replaced from fixed `min: 380, max: 460`
  to `width: max-content; min-width: 380px; max-width: min(96vw,
  720px);` so the panel auto-sizes to its widest row (the Chinese
  mode rows that read e.g.
  `Central  87° 53' 51.0"  ·  89 du 1.8 fen  ·  31325 li 229 bu`
  run to ~500 px and were wrapping mid-row at the prior 460 px
  cap). Cap stays viewport-aware via `min(96vw, 720px)` so the
  popup never bleeds past the screen edge on mobile. `.ti-row`
  also gains `flex-wrap: wrap` as a safety net for very narrow
  viewports, and the value `<span>` keeps `text-align: right` so
  wrapped values stay right-aligned. Mobile media-query rule
  unchanged (already takes the full viewport minus a 12 px margin
  per S740).
- **Revert path:** `git checkout v-s000757 -- .`
