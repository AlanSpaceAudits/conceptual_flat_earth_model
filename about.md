# FE Conceptual Model — a sandbox for a single observer's sky

An interactive sandbox showing what one observer actually sees. No physical units, no assumed earth radius. Everything is built around a single fictitious observer who ties the celestial sphere to the terrestrial graticule by relating a star's geocentric angle to the time it transits overhead.

Live at <https://alanspaceaudits.github.io/conceptual_flat_earth_model/>.

## Two layers, one observer

- **Optical vault** — the cap overhead onto which the sun, moon, planets, and starfield project. In first-person (Optical) view the cap is a strict hemisphere so rendered elevation matches reported elevation 1:1: an object reported at e° above the horizon sits at e° on the elevation scale, and you have to look at that exact degree to see it. In external (Heavenly) view the cap can be flattened via the `Height` slider to show the conceptual FE depiction from outside; that stylization does not leak back into the Optical projection.
- **True positions** — the heavenly-vault reading that places each body at its geographic ground point, defined in time through its geocentric angle. Toggle it on to see the bookkeeping, off to see only what reaches the observer's eye.

## The point

On the globe, an observer is always referencing where a star *isn't* at any given instant. In the flat-earth reading, the apparent positions on the celestial sphere are primary. The model lets you compare both on the same graticule and decide for yourself which framing is doing real work and which is scaffolding.

## Unit discipline

All distances are unitless. `FE_RADIUS = 1`. Everything else is a ratio. The codebase carries no earth radius, no AU, no kilometres, no great-circle trigonometry. Variable names containing `Globe` refer to the observer's local tangent frame (zenith / east / north), not to any spherical-earth geometry — the spherical framework here is purely conceptual.

---

# Layout

The main canvas fills the viewport. A collapsible HUD in the top-left gives live readouts; a second HUD can be toggled on the left to show per-tracked-target blocks; a bottom bar runs the width of the viewport with live slots on top and the mode / transport / tab controls below.

- **Top-left HUD** — starts collapsed behind a `▶ Live Moon Phases` header. Expanding it reveals the date/time, sun az/el, moon az/el + phase percentage, next solar + lunar eclipse countdown, and the moon-phase canvas widget (phase illustration + illumination bar + phase name).
- **Live Ephemeris Data button** — sits directly below the moon-phase header inside the HUD. Clicking toggles a multi-column tracker-HUD that appears under the main HUD; each tracked body becomes a bordered card with its own az/el and per-pipeline RA/Dec rows. When the stack is too tall for the viewport, cards flow into a new column to the right.
- **Bottom info strip** — transparent band across the bottom of the canvas showing Lat · Lon · El · Az (observer pose), Mouse El / Mouse Az (Optical cursor readout), ephem (active source), and the current date/time. A second row below shows `Tracking: <name>` when a body is locked.
- **Cadence chip (Optical only)** — tiny orange chip in the top-right giving the current zoom cadence (15° / 5° / 1°), FOV, and facing heading.

## Bottom bar

The dark bar anchors everything else. From left to right:

- **Mode toggles** — vault swap (🌐 / 👁) flips between Heavenly and Optical views; 🌙 pins permanent night so stars stay visible through daylight.
- **Transport controls** — ⏪ rewind, ▶ play/pause, ⏩ fast-forward. Speed presets stack on each press; the speed readout chip lives next to them.
- **Compass quick-buttons** — 🎯 Specified-Tracker-Mode toggle, then **N / S / E / W** to snap `ObserverHeading` to a cardinal and drop any active follow. The active cardinal takes an accent border while the heading is within 0.5° of it.
- **Tabs** — View, Time, Show, Tracker, Demos, Info. Each opens a popup anchored above its tab button.

---

# UI in detail

Six tabs run along the right side of the bottom bar. Clicking one opens its popup above the bar; clicking it again or pressing <kbd>Esc</kbd> closes it. Only one popup is open at a time, and groups inside a popup are mutually exclusive — opening one collapses the others.

## View tab

### Observer
- **Figure** — which little visible stand-in to place at the observer's position on the disc (Male, Female, Turtle, Bear, Llama, Goose, Black Cat, Great Pyrenees, Owl, Frog, Kangaroo, None).
- **ObserverLat / ObserverLong** — observer's position on the FE disc graticule, in degrees, step 0.0001° so Stellarium lat/lon reproduces exactly.
- **Elevation** — observer height above the disc (0–0.5 FE units). Lifts the Optical camera; geometry stays disc-anchored.
- **Facing** — compass heading 0–360° CW from north. Drives the Optical camera and the active-meridian highlight.
- **Nudge buttons** — quick ±1°, ±1′, ±1″ heading steps.
- **Arrow keys** — pan the observer lat/long; <kbd>Space</kbd> toggles play/pause.

### Camera (Heavenly orbit)
- **CameraDir** — orbit azimuth around the scene, −180° … +180°.
- **CameraHeight** — orbit elevation, −30° … +89.9°.
- **CameraDist** — orbit distance from the scene, 2–100 FE units.
- **Zoom** — orbit-camera zoom, 0.1–10×. Optical uses its own `OpticalZoom`; the two don't leak into each other.

### Vault of the Heavens
- **VaultSize / VaultHeight** — horizontal radius and flattened-cap ratio for the Heavenly dome.

### Optical Vault
- **Size / Height** — horizontal radius and vertical extent of the Optical cap as seen from Heavenly view. First-person Optical view is invariant to `Height` — the cap is always a hemisphere there so elevation stays 1:1 with reported angles.

### Body Vaults
Per-body heights for where each projected dot sits: Starfield, Moon, Sun, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune.

### Rays
- **RayParam** — curvature for the bezier ray lines between the observer and the projected markers (0.5–2.0).

---

## Time tab

### Calendar
- **Timezone** — offset from UTC in minutes.
- **DateTime** — absolute instant; slider + direct date/time entry.

### Autoplay
Play / pause and speed presets (Day / Year / Precession). Active speed persists across the bottom-bar transport buttons.

---

## Show tab

The `Visibility` group is now split into collapsible subgroups:

- **Heavenly Vault** — vault, vault grid, true positions, sun / moon tracks.
- **Optical Vault** — vault, grid, azimuth ring, facing vector, celestial poles, declination circles.
- **Ground / Disc** — FE grid, tropics / polar circles, sun / moon GP, longitude ring, shadow.
- **Stars** — random starfield, constellations, outlines.
- **Rays** — vault rays, optical vault rays, projection rays, many rays.
- **Cosmology** — Axis Mundi (none / yggdrasil / meru / vortex / vortex2).
- **Map Projection** — azimuthal equidistant (default), Mercator, Hellerick LAEA, proportional AE, blank.
- **Starfield** — starfield type (random / chart-dark / chart-light / Cel Nav), starfield mode (dynamic / static), permanent night.
- **Misc** — planets, dark background, logo.

---

## Tracker tab

Seven top-level collapsible groups, mutually exclusive:

### Ephemeris
- **Source** — which of five ephemeris pipelines drives sun / moon / planet positions. All five run every frame; the Tracker HUD shows every pipeline side-by-side so discrepancies are visible.
  - **HelioC** — Schlyter simplified Kepler composed with the Sun's geocentric orbit.
  - **GeoC** — Earth-focus Kepler (single ellipse per planet, no Sun stage).
  - **Ptolemy** — deferent + epicycle from *Almagest*.
  - **DE405** — Fred Espenak's AstroPixels daily ephemeris 2019–2030. **Default.**
  - **VSOP87** — Bretagnon & Francou 1988 analytical theory. Delegates moon to Meeus.
- **Ephemeris comparison** — show the full per-pipeline RA / Dec rows for each tracker block.
- **Precession / Nutation / Aberration / Trepidation** — classical corrections brought to J2000 star positions.

### Tracker Options
- **Clear All Tracked** — empty the target list.
- **Specified Tracker Mode** — only tracked bodies render; all other celestial objects hide. Mirrored by the 🎯 quick-button on the bar.
- **GP Override** — tracker GPs paint regardless of the master `Show Ground Points` toggle.

### Celestial Bodies
Multi-select button grid for the classical bodies: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune.

### Cel Nav
All 58 Nautical-Almanac navigational stars, alphabetised, each a warm-yellow toggle.

### Constellations
Named catalogued stars minus cel-nav crossovers (which live in their own sub-menu).

### Black Holes
Sgr A*, M87*, M31*, Cygnus X-1, V404 Cygni, NGC 4258, A0620-00, NGC 1275, NGC 5128, M81*, 3C 273 BH.

### Quasars
3C 273, 3C 48, 3C 279, 3C 351, S5 0014+81, TON 618, OJ 287, APM 08279+5255, 3C 454.3, PKS 2000-330, 3C 345, 3C 147, PG 1634+706, Twin Quasar, Mrk 421, Mrk 501, 3C 66A, PKS 1510-089, BL Lacertae.

### Galaxies
M31, M32, M33, M51, M63, M64, M77, M81, M82, M87, M101, M104, M110, NGC 253, NGC 4565, NGC 4631, NGC 5128, LMC, SMC, Cartwheel.

Each catalogued body renders on the heavenly dome and the Optical vault in a distinct colour (cel nav warm-yellow, catalogued white, black holes purple, quasars cyan, galaxies pink). Tracking a body from any sub-menu produces a coloured GP on the disc when Heavenly mode is active.

---

## Demos tab

Scripted-animation browser. Controls along the top: **Stop**, **Pause / Resume**, **Prev / Next**. Sections:

### General (6 entries)
Everyday sky demos: equinox-at-equator, summer and winter solstice at 45°N, one-month moon phase cycle, an observer travelling equator→pole→equator, 78°N summer-solstice 24-hour-daylight.

### Solar Eclipses (AstroPixels / DE405, 2021-2040) — 44 entries
One per real solar eclipse in Fred Espenak's tabulation. Each entry includes date, type (Total / Annular / Partial / Hybrid), central duration, magnitude, and Saros. Playing a demo reads the active BodySource, refines the syzygy time using that pipeline's own sun + moon, plants the observer at that pipeline's subsolar point, and tweens DateTime through the eclipse window. Under DE405 the demo lands on the real eclipse; under Ptolemy it lands on Ptolemy's own ~5–10° off prediction. **Play all** queues the full list.

### Lunar Eclipses (AstroPixels / DE405, 2021-2040) — 67 entries
Same structure, including the 22 penumbrals that earlier data-capture rounds missed.

### FE Eclipse Predictions (placeholder)
Structural hook for a future FE eclipse predictor based on Shane St. Pierre / Dimbleby's Saros-harmonic method. Not yet implemented.

---

## Info tab

External-link groups for communities and creators around this work:

- **Space Audits** (Alan's links)
- **Shane St. Pierre** — blog, videos, books
- **Man of Stone**
- **Globebusters**
- **Aether Cosmology CZ-SK**
- **Discord** — multiple invites including Aether Cosmology and Earth Awakenings
- **Clubhouse** — `#FlatEarthGang` room tag
- **Twitter Community** — FE Community Friday X Spaces hosted by Ken and Brian

---

# Interactive tracking (Optical mode)

- **Hover** — the cursor shows a tooltip next to any celestial body in range (`Name · az X.XX° el ±Y.YY°`). The click-hit box scales with FOV so you don't have to land pixel-perfect.
- **Click to lock** — clicking a body (within the same threshold) snaps `ObserverHeading` and `CameraHeight` to it and sets `FollowTarget`. Subsequent time advances re-aim the camera every frame. Below-horizon targets pin pitch to 0 so the camera keeps swinging with the azimuth along the horizon.
- **Overlap resolution** — whichever body is currently showing the hover tooltip is the one that gets locked on click, even if another body is slightly nearer the click pixel.
- **Break the lock** — any real drag (≥ 4 pixels) clears `FollowTarget` and resumes manual control. The bottom-bar compass buttons clear it too.

# Free-cam mode (Heavenly with tracking)

Switching from Optical to Heavenly while `FollowTarget` is set activates a bird's-eye free-cam. The orbit camera reconfigures to `CameraHeight: 80.3°`, `CameraDistance: 10`, `Zoom: 4.67` and re-anchors around the tracked body's ground point: the same `CameraDirection` / `CameraHeight` / `CameraDistance` / `Zoom` offset now applies *around the GP* instead of the disc origin, with `lookAt` pinned on the GP so the body stays screen-centre as time advances. The tracked body's GP always paints on the disc while free-cam is active regardless of the master `Show Ground Points` toggle. Any real drag in Heavenly breaks free-cam and restores the normal observer-anchored orbit view.

---

# HUD panels

- **Main HUD (top-left, collapsible)** — behind the `Live Moon Phases` header: DateTime, sun and moon az/el, moon phase %, next solar + lunar eclipse countdowns, moon-phase canvas (illustration + illumination bar + phase name).
- **Live Ephemeris tracker HUD** — toggled by the button under the HUD. One card per tracked body (and per `FollowTarget`, unless tagged follow-only) with az/el and up to five per-pipeline RA/Dec rows. Cards flow into multiple columns when the stack exceeds viewport height.
- **Bottom info strip** — two rows: live observer pose + mouse readouts + active ephemeris + current time on top, `Tracking: <name>` on the bottom.
- **Meeus warning banner** — red text at the bottom of the view when the active BodySource relies on the Meeus moon (HelioC, GeoC, VSOP87).
- **Cadence chip (Optical only)** — tiny readout showing active cadence (15° / 5° / 1°), current FOV, and facing heading.
- **Dynamic description footer** — one-line status under the canvas (observer latitude + sun status + twilight stage). Demos override this with narrative text during playback.

---

# Keyboard

- **Arrow keys** — move the observer's lat / long.
- **<kbd>Space</kbd>** — toggle play / pause.
- **<kbd>Esc</kbd>** — close the currently open tab popup.

# Orientation persistence

Every slider's state lives in the URL hash so any sim state can be shared as a link. The URL is versioned (`v=275` at the time of writing) — when a default changes between releases, the version bump tells the loader to drop the stale keys and use the new default rather than pinning you to an old value.

---

# Credits

Without the theory, data, and public catalogues from the following sources, this wouldn't exist:

- **Fred Espenak** (AstroPixels, NASA GSFC retired) — the DE405 daily ephemeris tables and eclipse catalogues that drive the default sim state. All eclipse demos reference his data.
- **R.H. van Gent** (Utrecht University) — the Almagest Ephemeris Calculator, from which the Ptolemy pipeline was ported.
- **Bretagnon & Francou** — the VSOP87 planetary theory (*Astron. Astrophys.* 202, 1988).
- **Sonia Keys** / **commenthol** — MIT-licensed JS coefficient port of VSOP87.
- **Jean Meeus** — *Astronomical Algorithms* (2nd ed., 1998), the backbone for the Sun, Moon, GMST, precession, nutation, and aberration routines.
- **Shane St. Pierre** — the conceptual framing and the push to actually build a working, interactive demonstration of the model.
- **Walter Bislin** — the original numerical constants, projection choices, and the visual conventions this port preserves.
