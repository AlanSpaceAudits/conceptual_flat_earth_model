# FE Conceptual Model — Legend & Feature Reference

An interactive sandbox showing what one observer actually sees on a plane with a limit of vision. No physical units, no assumed earth radius. Everything is built around a single fictitious observer who ties the celestial sphere to the terrestrial graticule by relating a star's geocentric angle to the time it transits overhead.

Live at [alanspaceaudits.github.io/conceptual_flat_earth_model](https://alanspaceaudits.github.io/conceptual_flat_earth_model/).

---

## Two layers, one observer

- **Optical vault** — the cap overhead onto which the sun, moon, planets, and starfield project. In first-person (Optical) view the cap is a strict hemisphere so rendered elevation matches reported elevation 1:1.
- **True positions** — the heavenly-vault reading that places each body at its geographic ground point. Toggle on to see the bookkeeping; toggle off to see only what reaches the observer's eye.

## Unit discipline

All distances are unitless. `FE_RADIUS = 1`. No earth radius, no AU, no kilometres, no great-circle trigonometry. The spherical-earth framing here is purely conceptual.

---

# Bottom bar — icon legend

The dark bar runs the full width of the viewport. From left to right:

## Transport (left cluster)

| Icon | Meaning |
| --- | --- |
| 🌐 / 👁 | Vault swap. 🌐 = currently in **Heavenly orbit**; 👁 = currently in **Optical first-person**. Click to flip. |
| ⏪ | Rewind. First click reverses direction; subsequent clicks double the negative magnitude. |
| ▶ / ⏸ | Play / Pause. Pressing ▶ resets autoplay to the Day preset. While a demo is playing, this pauses / resumes the demo without ending it. |
| ⏩ | Fast-forward. Mirror of ⏪. |
| ½× | Halve current speed magnitude. Direction preserved. |
| 2× | Double current speed magnitude. Direction preserved. |
| End Demo | Appears only while a demo is active. Click to stop and reset. |

## Compass cluster (centre-right)

Two-row sub-grids: a 3 × 2 mode grid, a 2 × 2 cycle row, and a 2 × 2 cardinal grid.

### Mode grid

| Icon | Meaning |
| --- | --- |
| 🌙 | Toggle **Permanent Night** (`NightFactor` pinned so stars stay visible). |
| ◉ | Toggle **True Positions** — heavenly-vault dots showing each body's geographic ground direction. |
| 🎯 | **Specified Tracker Mode** — narrow the scene to just the active `FollowTarget`. Off = full `TrackerTargets`. |
| ▦ | Combined grid toggle — flips **FE grid + Optical-vault grid + heavenly-vault azimuth ring + longitude ring** together. |
| 📍 | Jump to the **Observer** group in the View tab (lat / lon / heading / elevation). |
| 🎥 | **Free-camera** mode. Arrow keys rotate / tilt the orbit camera instead of moving the observer. |

### Cycle row

| Icon | Meaning |
| --- | --- |
| 🗺 | Open **Map Projection** settings (HQ map art + generated math projection). |
| ✨ | Cycle **Starfield**: random / chart-dark / chart-light / Cel Nav / AE Aries 1-3. |
| 🧭 | Toggle the full compass readout (azimuth ring + ground longitude ring + Optical-vault grid). |
| EN / CZ / ES / … | **Language cycler.** Click to step through the 18 supported languages. Current 2-letter id is the button face. |

### Cardinal grid

| Icon | Meaning |
| --- | --- |
| N | Snap `ObserverHeading` to North (0°). |
| E | Snap to East (90°). |
| W | Snap to West (270°). |
| S | Snap to South (180°). |

The cardinal whose heading currently matches (within 0.5°) takes an accent border.

## Search boxes (left of the View tab)

- **Body search** — type 3+ characters of any celestial body (sun, moon, any planet, any star / black hole / quasar / galaxy / satellite, plus Pluto). Suggestions colour-coded by category. Enter / click engages the tracking protocol.
- **Visibility search** — type 2+ characters of any Show- or Tracker-tab setting. Results list `Tab › Group`; click to open + expand.

## Tabs (rightmost)

**View / Time / Show / Tracker / Demos / Info**. Each opens a popup anchored above its button. Click again or press <kbd>Esc</kbd> to close. Only one popup is open at a time; sibling groups inside a popup are mutually exclusive.

---

# View tab

## Observer

- **Figure** — observer figure on the disc: Male, Female, Turtle, Bear (sprite), Llama, Goose, Black Cat, Great Pyrenees, Owl, Frog, Kangaroo, **Not Nikki Minaj** (default), None.
- **ObserverLat / ObserverLong** — observer's position on the FE graticule, step 0.0001°.
- **Elevation** — observer height above the disc.
- **Heading** — compass facing 0–360° CW from north.
- Nudge buttons: ±1°, ±1′, ±1″.
- Arrow keys pan lat/lon; <kbd>Space</kbd> toggles play/pause.

## Camera (Heavenly orbit)

- **CameraDir** — orbit azimuth, −180° … +180°.
- **CameraHeight** — orbit elevation, −30° … +89.9°.
- **CameraDist** — orbit distance, 2–100.
- **Zoom** — orbit zoom, 0.1–10×.

Optical first-person uses its own `OpticalZoom`; values don't leak between the two.

## Vault of the Heavens

- **VaultSize / VaultHeight** — horizontal radius and flattened-cap ratio for the Heavenly dome.

## Optical Vault

- **Size / Height** — horizontal radius and vertical extent of the Optical cap as seen from Heavenly view. First-person Optical view is invariant to `Height`.

## Body Vaults

Per-body heights for where each projected dot sits: Starfield, Moon, Sun, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune.

## Rays

- **RayParam** — curvature for the bezier ray lines.

---

# Time tab

## Calendar

- **Timezone** — UTC offset in minutes.
- **Date / time** — direct date-time entry; slider also available.

## Date / Time

- **DayOfYear / Time / DateTime** — three sliders for absolute instant.

## Autoplay

- **▶ Pause / Resume**, **status** chip, **Day / Week / Month / Year** speed presets.
- **Speed** — fine slider in d/s (days per real-second), log-scaled.

---

# Show tab

Visibility groups, mutually exclusive collapse:

- **Heavenly Vault** — vault, vault grid, sun / moon tracks.
- **Optical Vault** — vault, grid, azimuth ring, facing vector, celestial poles, declination circles.
- **Ground / Disc** — FE grid, tropics / polar circles, sun / moon GP, longitude ring, shadow.
- **Rays** — vault rays, optical vault rays, projection rays, many rays.
- **Cosmology** — Axis Mundi: none / Yggdrasil / Mt. Meru / vortex / vortex 2 / Discworld.
- **Map Projection** — two side-by-side selectors:
  - **HQ Map Art** — bundled raster maps: Blank, Equirect Day / Night, AE Equatorial dual-pole, AE Polar Day / Night, Gleason's, World Shaded Relief, Orthographic Globe.
  - **Generated** — math projections: Default AE, Hellerick, Proportional AE, AE Equatorial, Equirect, Mercator, Mollweide, Robinson, Winkel Tripel, Hammer, Aitoff, Sinusoidal, Equal Earth, Eckert IV, Orthographic, Blank.
- **Misc** — Planets, Dark Background, Logo.

---

# Tracker tab

The Tracker is the single source of truth for body visibility. Each sub-menu's **Show** checkbox gates the whole category; **TrackerTargets** decides which individual ids render. **Enable All** seeds with everything in that category; **Disable All** clears it.

## Ephemeris

- **Source** — picks which of five sun/moon/planet ephemeris pipelines drives the actual rendered positions. All five run every frame internally so the comparison panel stays valid; this dropdown only chooses which one *renders*.
  - **HelioC** — Schlyter simplified Kepler composed with the Sun's geocentric orbit. Lightweight; ~degree-level for inner planets, fast.
  - **GeoC** — Earth-focus single-ellipse Kepler per planet, no Sun stage. Conceptually clean, deliberately less accurate.
  - **Ptolemy** — Deferent + epicycle from the *Almagest*, ported via the Almagest Ephemeris Calculator. Lands ~5–10° off modern positions, exactly as in the original sources.
  - **DE405** — Fred Espenak's AstroPixels daily ephemeris tables, 2019–2030. Modern reference; the default.
  - **VSOP87** — Bretagnon & Francou 1988 analytical theory. Moon delegated to Meeus. High-accuracy for planets; Meeus moon has a ~2.5° known offset vs DE405.
- **Ephemeris comparison** — when on, each tracker card in the Live Ephemeris HUD shows up to five rows of RA / Dec, one per pipeline. Useful for seeing how far Ptolemy drifts vs DE405, or how close VSOP87 is, in real time.
- **Precession** — classical J2000-to-date precession applied to fixed-star RA / Dec. Off = stars stay at J2000 catalog values; On = they walk forward to the displayed date.
- **Nutation** — short-period wobble of the celestial pole (~18.6 yr term). Small (~10″) but visible on tight tracker readouts.
- **Aberration** — annual aberration: stars apparently shift up to ~20″ in the direction of Earth's motion through the year. Off = catalog-mean positions.
- **Trepidation** — historical pre-Newtonian model of an oscillating obliquity. Provided alongside precession so users can compare how that older framework predicted the same phenomenon. Off by default.

## Starfield

Selects the active starfield render and mode (random, three chart variants, Cel Nav, three AE Aries variants), Dynamic / Static fade, Permanent Night.

## Tracker Options

- **Specified Tracker Mode** — when on, the only body painted is `FollowTarget`; every other tracked id is hidden. Use this to lock attention on a single object during a demo or measurement. Default off.
- **GP Override** — paints a body's ground-point (sub-stellar / sub-solar) on the disc even when the master `Show Ground Points` toggle is off. Lets you study just the GPs without flipping global visibility.
- **True Positions** — heavenly-vault dots showing each body's true geographic source direction (where it is, not where it appears). Mirrored by the ◉ bottom-bar button.
- **GP Path (24 h)** — when on, every tracked body grows a 24-hour sub-point polyline on the disc. Sun / moon / planets sample the active ephemeris; stars use fixed RA/Dec + GMST; satellites use their two-body sub-point function. Useful for analemma-shaped traces and for seeing diurnal motion at a glance.

## Sub-menus

Every sub-menu has the same four chrome rows above its button grid:

- **Show** — gates the entire category. Off = nothing in this category renders, regardless of which individual ids are in `TrackerTargets`.
- **GP Override** — overrides the master `Show Ground Points` toggle for entries in this category, so their GPs paint on the disc regardless.
- **Enable All** — unions every id in this category into `TrackerTargets`. Existing selections from other categories stay.
- **Disable All** — strips every id in this category from `TrackerTargets`. Other categories untouched.

The button grid below lists every entry (alphabetised). Click an entry to toggle its membership in `TrackerTargets`; active entries take an accent border.

### Per-category contents

- **Celestial Bodies** — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune.
- **Cel Nav** — 58 Nautical-Almanac navigational stars (warm-yellow dots).
- **Constellations** — named catalogued stars (white dots) minus cel-nav crossovers. Carries an extra **Outlines** toggle that draws the Stellarium-style stick figures connecting each constellation's primary stars.
- **Black Holes** — 11 entries (Sgr A*, M87*, M31*, Cygnus X-1, V404 Cygni, NGC 4258, A0620-00, NGC 1275, NGC 5128, M81*, 3C 273 BH).
- **Quasars** — 19 originals (3C 273, OJ 287, BL Lacertae, etc.); the BSC adds 700 more.
- **Galaxies** — 20 originals (M31, M82, M104, NGC 5128, LMC, SMC, etc.) plus the **Milky Way (Galactic Centre)** entry; BSC adds 700 more.
- **Satellites** — 12 base orbital entries: ISS, Hubble, Tiangong, eight Starlink-shell representatives, James Webb (L2). Two-body Kepler elements; ~1°/day drift from the 2024-04-15 epoch — conceptual, not precision tracking.
- **Bright Star Catalog (BSC)** — a union catalog of ~2,967 entries assembled from every other category plus extras. Has **its own** `BscTargets` list (independent from `TrackerTargets`) and **its own** render gate `ShowBsc`. **Enable All** in BSC only writes to `BscTargets`, so highlights appear immediately but no dots render until `Show` is checked. The BSC's renderer paints all selected entries with per-source colors (cel nav warm yellow, catalogued white, black holes purple, etc.). An extra **Disable Satellites** button strips every `star:sat_*` id from `BscTargets` while leaving the rest alone — useful when the satellite cloud is overwhelming the view.

The BSC's content breakdown:

| Source | Count |
| --- | --- |
| Cel-nav stars | 58 |
| Catalogued stars (constellation primaries) | 47 |
| Black holes | 11 |
| Galaxies (originals + 200 OpenNGC + 500 OpenNGC) | 720 |
| Quasars (originals + 200 VizieR + 500 VizieR) | 719 |
| Named stars (393 IAU/HYG mag ≤ 8 + 500 next-brightest unnamed) | 892 |
| Satellites (12 + ~500 CelesTrak) | 509 |
| Solar-system bodies + Pluto | 10 |
| **Total (deduped)** | **2,967** |

Each catalogued body renders in its own colour: cel nav warm-yellow, catalogued white, black holes purple, quasars cyan, galaxies pink, satellites lime green, BSC per-entry color matched to source category.

---

# Demos tab

Scripted-animation browser. Controls along the top: **Stop**, **Pause / Resume**, **Prev / Next**. While a demo plays, transport bar ▶ / ⏸ pauses the demo in place; ½× / 2× scale its tempo; **End Demo** appears in the speed stack. Sections:

- **24 h Sun (4)** — polar-sun demonstrations (Alert NU, West Antarctica, midnight sun N/S).
- **General (6)** — equinox at equator, summer / winter solstice at 45°N, moon-phase month, observer travel, 78°N 24-hour daylight.
- **Sun Analemma / Moon Analemma / Sun + Moon Analemma** — 5 latitude variants each (90°N, 45°N, 0°, 45°S, 90°S). Observer fixed; Time fixed at 12:00 UTC; one daily step per 30/365 s. Hold-at-end so you can study the curve.
- **Solar Eclipses (44 entries, 2021–2040)** — one per real solar eclipse (Espenak). Demo refines syzygy time using the active pipeline's own sun + moon and plants the observer at that pipeline's subsolar point.
- **Lunar Eclipses (67 entries, 2021–2040)** — same structure, including 22 penumbrals.
- **FE Eclipse Predictions** — placeholder for a future Saros-harmonic predictor.

---

# Info tab

External-link groups for communities and creators around this work (Space Audits, Shane St. Pierre, Man of Stone, Globebusters, Aether Cosmology CZ-SK, Discord, Clubhouse, Twitter Community).

---

# HUD panels

- **Main HUD (top-left, collapsible)** — `Live Moon Phases` header. Body holds DateTime, sun + moon az/el, moon phase %, next solar + lunar eclipse countdowns, moon-phase canvas (illustration + illumination bar + phase name).
- **Live Ephemeris tracker HUD** — toggled by the button under the HUD. One card per tracked body with az/el and per-pipeline RA/Dec rows.
- **Bottom info strip** — Lat · Lon · El · Az · Mouse El · Mouse Az · ephem · time · current speed (`+0.042 d/s`) on top; `Tracking: <name>` on the bottom.
- **Meeus warning banner** — red strip when active BodySource depends on Meeus moon (HelioC / GeoC / VSOP87).
- **Cadence chip (Optical only)** — top-right chip with active cadence (15° / 5° / 1°), FOV, facing heading.
- **Dynamic description footer** — one-line status under the canvas (latitude + sun status + twilight stage). Demos override this with narrative text.

---

# Interactive tracking (any view)

- **Hover** — cursor tooltip (`Name / Azi / Alt`) over any visible body. Optical hits via az/el; Heavenly via projected screen pixels (40 px radius).
- **Click to lock** — engages `FollowTarget`. In Optical: snaps heading + pitch to the body. In Heavenly: enables free-cam with a bird's-eye preset.
- **Free-cam (Heavenly + tracking)** — orbit anchors around the body's ground point, not the disc origin. The GP paints regardless of the master Show Ground Points toggle.
- **Break the lock** — any real drag (≥ 4 px) clears `FollowTarget` and `FreeCamActive`.

---

# Keyboard

- **Arrow keys** — move the observer's lat / lon (or rotate the camera in free-cam mode).
- **<kbd>Space</kbd>** — toggle play / pause.
- **<kbd>Esc</kbd>** — close the open tab popup → pause active demo → clear tracking, in priority order.

---

# Languages

18 supported via the bottom-bar language cycler:

EN · CZ · ES · FR · DE · IT · PT · PL · NL · SK · RU · AR · HE · ZH · JA · KO · TH · HI

Tab labels, group titles, row labels, button labels, info-bar slots, autoplay chrome, transport tooltips, header text, status readouts, and Live-panel headers all retranslate live. Arabic and Hebrew flip the document direction to RTL.

---

# Orientation persistence

Every state field lives in the URL hash so a sim setup can be shared as a link. The URL is versioned — when a default changes between releases, the version bump tells the loader to drop stale keys and use the new default rather than pinning to old values.

---

# Credits

- **Fred Espenak** (NASA GSFC retired, AstroPixels) — DE405 daily ephemeris, eclipse catalogues.
- **R.H. van Gent** (Utrecht) — Almagest Ephemeris Calculator, source for the Ptolemy port.
- **Bretagnon & Francou** — VSOP87 planetary theory.
- **Sonia Keys / commenthol** — MIT-licensed JS coefficient port of VSOP87.
- **Jean Meeus** — *Astronomical Algorithms* (1998).
- **Shane St. Pierre** — conceptual framing and the push to actually build a working interactive demonstration.
- **Walter Bislin** — visualization inspiration.
- **HYG v41** (David Nash / astronexus) — bright-star data.
- **OpenNGC** (Mattia Verga) — galaxy catalog.
- **VizieR / CDS** (Véron-Cetty & Véron 2010) — quasar catalog.
- **CelesTrak** (Dr. T.S. Kelso) — TLE feeds for satellites.
