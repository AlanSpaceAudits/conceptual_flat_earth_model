# FE Conceptual Model — a sandbox for a single observer's sky

An interactive sandbox showing what one observer actually sees. No physical units, no assumed earth radius. Everything is built around a single fictitious observer who ties the celestial sphere to the terrestrial graticule by relating a star's geocentric angle to the time it transits overhead.

Live at <https://alanspaceaudits.github.io/conceptual_flat_earth_model/>.

## Two layers, one observer

- **Optical vault** — the flattened cap overhead onto which the sun, moon, planets, and starfield project. This is the sky as it is actually perceived.
- **True positions** — the heavenly-vault reading that places each body at its geographic ground point, defined in time through its geocentric angle. Toggle it on to see the bookkeeping, off to see only what reaches the observer's eye.

## The point

On the globe, an observer is always referencing where a star *isn't* at any given instant. In the flat-earth reading, the apparent positions on the celestial sphere are primary. The model lets you compare both on the same graticule and decide for yourself which framing is doing real work and which is scaffolding.

## Unit discipline

All distances are unitless. `FE_RADIUS = 1`. Everything else is a ratio. The codebase carries no earth radius, no AU, no kilometres, no great-circle trigonometry. Variable names containing `Globe` refer to the observer's local tangent frame (zenith / east / north), not to any spherical-earth geometry — the spherical framework here is purely conceptual.

---

# The UI in detail

The control panel has five tabs along the top: **View**, **Time**, **Show**, **Tracker**, **Demos**. The main canvas shows a 3D scene driven by those controls. A HUD in the top-left gives live readouts; a second HUD appears on the left when you track objects; a red warning banner pins to the bottom of the view when the active ephemeris depends on the low-accuracy Meeus moon.

## View tab

### Observer
- **Figure** — which little visible stand-in to place at the observer's position on the disc. Options: Male, Female, Turtle, Bear, Llama, Goose, Black Cat, Great Pyrenees, Owl, Frog, Kangaroo, None.
- **ObserverLat / ObserverLong** — the observer's position on the FE disc graticule, in degrees. Sub-arcsecond granularity (step 0.0001°) so you can reproduce a Stellarium lat/lon exactly.
- **Elevation** — observer height above the disc, 0–0.5 FE units. Lifts the camera in Optical mode (geometry stays disc-anchored).
- **Facing** — compass heading 0–360°, clockwise from north. Drives which way the Optical camera looks and which meridian highlights as "active".
- **Nudge buttons** — quick ±1°, ±1′, ±1″ heading steps.
- **Heavenly Vault / Optical Vault button** — the big mode toggle. Heavenly is the external orbit camera looking at the whole disc; Optical is first-person from the observer's eye.

### Camera (Heavenly orbit camera)
- **CameraDir** — orbit azimuth around the scene, −180° … +180°.
- **CameraHeight** — orbit elevation, −30° … +89.9°.
- **CameraDist** — orbit distance from the scene, 2–100 FE units.
- **Zoom** — orbit-camera zoom, 0.1–10×. Note: in Optical mode a separate `OpticalZoom` is used; the two don't leak into each other.

### Vault of the Heavens (external / Heavenly)
- **VaultSize** — horizontal radius of the dome shown in Heavenly mode.
- **VaultHeight** — vertical extent (flattened cap ratio).

### Optical Vault (first-person cap above observer)
- **Size** — horizontal radius of the perceived cap.
- **Height** — vertical extent of the cap.

### Body Vaults
Per-body vault heights for where each body's projected dot sits. Adjusting these changes how the body rides across the cap in first-person view.
- **Starfield**, **Moon**, **Sun**, **Mercury**, **Venus**, **Mars**, **Jupiter**, **Saturn**.

### Rays
- **RayParam** — curvature parameter for the bezier-curved ray lines that connect the observer to the projected markers (0.5–2.0).

---

## Time tab

### Date / Time
- **DayOfYear** — 0–365. Drives sun declination and season.
- **Time** — 0–24 h. Drives sidereal rotation of the sky over the disc.
- **DateTime** — absolute days since the sim's `TIME_ORIGIN` zero date. Sliding DateTime is the universal way to scrub time; autoplay drives this field.

The Time tab's right column includes a small **autoplay** module with play/pause and speed presets (Day / Year / Precession). When autoplay is running, DateTime advances at the selected rate and the whole sky moves accordingly.

---

## Show tab

### Visibility (boolean toggles)
- **FE Grid** — disc graticule (lat / lon lines on the flat map).
- **Tropics / Polar** — the five canonical latitude circles.
- **Sun / Moon GP** — ground-point dots at the sub-solar and sub-lunar longitudes.
- **Heavenly Vault** — the external dome shell.
- **Vault Grid** — wireframe on the Heavenly dome.
- **Shadow** — day-side / night-side terminator shading on the disc.
- **Sun Track / Moon Track** — arc curves showing the body's 360° sky path at the current declination.
- **Optical Vault** — the first-person cap markers (projected sun, moon, planets, stars).
- **True Positions** — the heavenly-vault source markers in addition to their optical-vault projections.
- **Facing Vector / N-S-E-W** — the heading arrow and cardinal labels in Optical mode.
- **Declination Circles** — celestial-sphere declination rings.
- **Stars** — the background starfield (whichever starfield type is selected under Starfield).
- **Constellations** — filled / marked constellation stars.
- **Constellation outlines** — stick-figure outlines of the constellations.
- **Longitude ring (ground)** — the compass ring on the disc around the observer.
- **Azimuth ring (vault)** — the degree labels on the Optical cap rim.
- **Starfield Mode** — *Dynamic* (stars fade with day/night) vs *Static* (always visible).
- **Vault Rays** — bezier rays from observer to true-position markers on the Heavenly vault.
- **Optical Vault Rays** — bezier rays from observer to the optical-vault markers.
- **Many Rays** — multi-ray variant for illustration.
- **Planets** — toggle the five classical planet markers on/off.
- **Logo** — the Aether Cosmology overlay in the corner.

### Cosmology
- **Axis Mundi** dropdown: none, yggdrasil, meru (Mt Meru), vortex (single toroidal vortex), vortex2 (dual horn-torus). Cosmological centrepieces at the disc centre.

### Map Projection
- **Projection** — which base map to render on the disc: azimuthal equidistant (default), Mercator, Hellerick LAEA, proportional AE, blank, etc. Purely visual; graticule math is unchanged.

### Starfield
- **Starfield** — choose the starfield renderer:
  - *Default (random)* — procedural star cloud.
  - *Chart (dark)* / *Chart (light)* — textured star chart wrapped on the dome.
  - *Cel Nav (named stars)* — the 58 Nautical Almanac navigational stars, labelled and drawn from a J2000 catalogue with optional precession / nutation / aberration corrections (see Tracker tab).
- **Permanent night** — pin `NightFactor` to 1 so the starfield is always visible regardless of where the sun sits.

---

## Tracker tab

### Object
- **Track** — a grid of toggle buttons for what to track. Each button is on/off; multiple can be active. The tracked list drives the second HUD panel (appears on the left of the canvas when anything is tracked) with live azimuth, elevation, RA, and Dec readouts per target, plus per-pipeline readings (see Ephemeris below). Options:
  - Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn.
  - All 58 Nautical-Almanac Cel Nav stars (Acamar → Zubenelgenubi).

### Ephemeris
- **Source** — which of five ephemeris pipelines drives the sun / moon / planet positions in the main scene. All five run every frame; the Source selector only chooses which drives the primary sky render. The Tracker HUD shows the reading from every pipeline side-by-side so discrepancies are visible.
  - **HelioC** — Schlyter simplified Kepler, composed with the Sun's geocentric orbit. ~5′ accuracy at modern dates; historical source pipeline.
  - **GeoC** — Earth-focus Kepler (single ellipse per planet, no Sun stage). Inaccurate by design; the "no heliocentric intermediate" pedagogical pipeline.
  - **Ptolemy** — deferent + epicycle from *Almagest* (ported from R.H. van Gent). ~1° accuracy at antiquity; drifts to ~5–10° at modern dates — that drift IS the point.
  - **DE405** — Fred Espenak's AstroPixels tabulated ephemeris. Daily rows 2019–2030. Matches Stellarium to sub-arcsecond inside the tabulated range. **Default.**
  - **VSOP87** — Bretagnon & Francou 1988 analytical theory, MIT-licensed port via commenthol. Works at any date; arcsecond-class for planets; delegates Moon to Meeus.

- **Star correction checkboxes** — toggle the three classical corrections that bring catalogue J2000 positions up to apparent-of-date:
  - **Precession** — Lieske 1977 / IAU 1976 (Meeus 21.4). The ~20′-per-26-year secular drift.
  - **Nutation** — Meeus 22.A two-term low-accuracy model. ±9″ wobble driven by the Moon's node.
  - **Aberration** — Meeus 23.2 first-order annual aberration. ±20.5″ ellipse from Earth's orbital motion.
  - **Trepidation** — master "apply all three as one combined wobble" label. When checked it forces all three on regardless of their individual states. Historical name nod to the medieval trepidation-of-the-equinoxes hypothesis.

If the active Source uses the Meeus moon (HelioC, GeoC, VSOP87), a red warning banner appears at the bottom of the canvas noting the ~2.5° Meeus-moon timing error. DE405 (Astropixels) and Ptolemy have their own moons and don't trigger the banner.

---

## Demos tab

A scripted-animation browser. The list is rendered by the Demos module; sections collapse by default for the long eclipse lists. Controls at the top:
- **Stop** — halt the current demo.
- **Pause / Resume** — freeze the tween queue without clearing state; the observer can move lat/long or switch Heavenly/Optical while paused, then resume from the same eclipse moment.
- **Prev / Next** — step through the current list or active queue.

Sections:

### General (6 entries)
Everyday sky demos: equinox-at-equator, summer and winter solstice at 45°N, one-month moon phase cycle, an observer travelling equator→pole→equator, and 78°N summer-solstice 24-hour-daylight.

### Solar Eclipses (AstroPixels / DE405, 2021-2040) — 44 entries
One per real solar eclipse in Fred Espenak's tabulation. Each entry's name is the date plus type (Total / Annular / Partial / Hybrid), central duration, magnitude, and Saros series. Playing a demo:
- Reads the currently-selected BodySource from the Tracker tab
- Refines the syzygy time using THAT pipeline's own sun + moon
- Plants the observer at that pipeline's subsolar point at that moment
- Tweens DateTime through the eclipse window
- Under DE405 the demo lands on the real eclipse; under Ptolemy it lands on Ptolemy's own ~5-10° off prediction in the Almagest frame. Each pipeline tells its own story.

A **Play all in Solar Eclipses** button queues the full list; autoplay advances to the next demo when one finishes.

### Lunar Eclipses (AstroPixels / DE405, 2021-2040) — 67 entries
Same structure as Solar Eclipses. Includes Total, Partial, and Penumbral events (the 22 penumbrals that ChatGPT's OCR of Espenak's table missed — reincluded here because they're real events in the canonical table).

### FE Eclipse Predictions (placeholder)
One advisory entry. Structural hook for a future FE eclipse predictor based on Shane St. Pierre / Dimbleby's *All Past Time* Saros-harmonic method (three lunar periodicities → Saros → 120° westward shift → Exeligmos → Dimbleby's team of 70 → 651-year grand cycle). Not yet implemented; the placeholder ensures the track exists in the UI without faking predictions from the mainstream table.

---

# HUD panels

- **Main HUD (top-left)** — running sun / moon azimuth-elevation readout, local time, a live moon-phase icon, and a countdown to the next solar and lunar eclipse.
- **Tracker HUD (left, conditional)** — appears while anything is in the Tracker's Object list. One block per tracked target showing:
  - Azimuth / elevation readout in Stellarium-style DMS format (`+280°53′58.9″`)
  - Per-pipeline RA / Dec rows so Helio / GeoC / Ptolemy / DE405 / VSOP87 can be visually compared side by side
- **Meeus warning banner (bottom, conditional)** — red text when the active BodySource relies on Meeus moon.
- **Cadence chip (top-right, Optical only)** — tiny label showing the active Optical reading cadence (15° coarse, 5° refined, 1° fine) plus the current FOV and facing.
- **Dynamic description footer** — a one-line running summary under the canvas: observer latitude, sun status (within/beyond optical vault, twilight stage, etc.). Demos override this with narrative text during playback.

---

# Orientation persistence

Every panel slider's state lives in the URL hash, so every sim state can be shared as a link. The URL is versioned (`v=201`) — when defaults change between releases, old URLs gracefully fall back to the new default rather than pinning you to the outdated value.

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
