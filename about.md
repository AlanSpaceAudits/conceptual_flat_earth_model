# FE Conceptual Model — Legend & Feature Reference

An interactive sandbox showing what one observer actually sees on a plane with a limit of vision. No physical units, no assumed earth radius. Everything is built around a single fictitious observer who ties the celestial sphere to the terrestrial graticule by relating a star's geocentric angle to the time it transits overhead.

Live at [alanspaceaudits.github.io/conceptual_flat_earth_model](https://alanspaceaudits.github.io/conceptual_flat_earth_model/).

---

## Two layers, one observer

- **Optical vault** — the cap overhead onto which the sun, moon, planets, and starfield project. In first-person (Optical) view the cap is a strict hemisphere so rendered elevation matches reported elevation 1:1.
- **True positions** — the heavenly-vault reading that places each body at its geographic ground point. Toggle on to see the bookkeeping; toggle off to see only what reaches the observer's eye.

## Unit discipline

All distances are unitless. `FE_RADIUS = 1`. No earth radius, no AU, no kilometres, no great-circle trigonometry. The spherical-earth framing here is purely conceptual.

## Sun and Moon bodies

When zoomed in inside the optical vault (FE Optical or GE Optical view, body actively tracked):

- **Moon** — disc with a three-crater triangle pattern in the upper-left (small over a medium-and-large pair), real-ephemeris phase shading driven by `c.MoonPhase` + `c.MoonRotation`, faint rim outline so the moon stays distinct from the sun even at new moon. Camera-aligned so its perceived orientation reads the same in FE and GE.
- **Sun** — yellow disc with seven procedural sunspots, additive-blend halo plane scaled 2.5× the face. Sized to match the moon so a solar eclipse overlays cleanly: the moon body covers the sun face while the halo's outer ring shows through as a corona. Sunspots tilt with the same observer-frame angle the moon's terminator uses.
- **Equirect day/night map (GE)** — when the active map is `hq_equirect_*`, the renderer flips between the day and night raster per frame based on the observer's `NightFactor` (so the globe re-textures at sunrise/sunset). Dropdown selection is preserved.

---

# Bottom bar — icon legend

The dark bar runs the full width of the viewport. From left to right:

## Transport (left cluster)

| Icon | Meaning |
| --- | --- |
| 🌐 / 👁 | Vault swap. 🌐 = currently in **Heavenly orbit**; 👁 = currently in **Optical first-person**. Click to flip. |
| ⏪ | Rewind. First click reverses direction; subsequent clicks double the negative magnitude. |
| ▶ / ⏸ | Play / Pause. Pressing ▶ resets autoplay to the Day preset. While a demo is playing, this pauses / resumes the demo without ending it (autoplay is suspended for the demo's duration so pause truly freezes time). |
| ⏩ | Fast-forward. Mirror of ⏪. |
| ½× | Halve current speed magnitude. Direction preserved. |
| 2× | Double current speed magnitude. Direction preserved. |
| End Demo / End Tracking | Appears in the info bar while a demo is active or a target is being followed. Click to stop. |

### Country quick-hops

A compact 5 × 2 grid of ISO 3-letter codes lives between the presets and the transport buttons:

`USA · BRA · GBR · EGY · ZAF · RUS · IND · JPN · AUS · ARG`

One click sets `ObserverLat` / `ObserverLong` to that country's representative city (Denver, Brasília, London, Cairo, Cape Town, Moscow, Delhi, Tokyo, Sydney, Ushuaia). Hover for full name + decimal coords.

## Compass cluster (centre-right)

Three vertical sub-stacks: a swap-stack (1 × 2), a mode grid (4 × 2), a cycle row (2 × 2), and a cardinal grid (2 × 2). Spacing between every column is uniform 2 px so the cluster reads as a single unit.

### Swap stack

| Icon | Meaning |
| --- | --- |
| 👁 / 🌐 | **Vault swap.** 👁 = Optical first-person; 🌐 = Heavenly orbit. Lights up an accent border while in Optical view. |
| ↕ | **Toggle Fictitious Observer.** Shows the orange axis line + origin / anchor dots on the disc / globe. While the marker is active, double-clicking the orange dot teleports the observer between the surface lat / lon and the AE pole / globe centre; click + drag relocates the surface lat / lon under the cursor. The button takes an accent border while engaged. |

### Mode grid

| Icon | Meaning |
| --- | --- |
| 🌙 | Toggle **Permanent Night** (`NightFactor` pinned so stars stay visible). |
| ◉ | Toggle **True Positions** — heavenly-vault dots showing each body's geographic ground direction. |
| 🎯 | **Specified Tracker Mode** — narrow the scene to just the active `FollowTarget`. Off = full `TrackerTargets`. |
| ▦ | Combined grid toggle — flips **FE grid + Optical-vault grid + heavenly-vault azimuth ring + longitude ring** together. |
| 📍 | Jump to the **Observer** group in the View tab (lat / lon / heading / elevation). |
| 🎥 | **Free-camera** mode. Arrow keys rotate / tilt the orbit camera instead of moving the observer. |
| 🔦 | Cycle the **Rays** layer (Vault / Optical Vault / Projection / Many). |
| ⌫ | **Clear Trace** — wipes any active GP-tracer / optical-vault trace polylines. |

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
- **Ground / Disc** — FE grid, **Tropic of Cancer**, **Equator**, **Tropic of Capricorn** (each toggleable independently — split out of the old single "Tropics" row), Polar Circles, Sun / Moon GP, **Shadow** (moved here from the Tracker tab), Heavenly Vault Azi (longitude ring). Each tropic / equator / polar / antarctic ring carries a curved white label that traces the arc on both FE and GE.
- **Rays** — vault rays, optical vault rays, projection rays, many rays.
- **Cosmology** — Axis Mundi: none / Yggdrasil / Mt. Meru / vortex / vortex 2 / Discworld.
- **Map Projection** — two side-by-side selectors:
  - **FE Map** — generated math projections (Default AE, **AE Line Art** [black disc with white coastlines], Hellerick, Proportional AE, AE Equatorial, Equirect, Mercator, Mollweide, Robinson, Winkel Tripel, Hammer, Aitoff, Sinusoidal, Equal Earth, Eckert IV, Orthographic, Blank) plus HQ raster maps (Blank, Equirect Day / Night, AE Equatorial dual-pole, AE Polar Day / Night, Gleason's, World Shaded Relief, Orthographic Globe).
  - **GE Map** — sphere-friendly equirectangular maps: HQ Equirect Day / Night, World Shaded Relief, plus the GE Art procedural set (Line Art, Blueprint, Topo, Sepia, Neon, **Translucent** — see-through shell so the centre observer can look out through the globe at the celestial sphere).
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
- **Quasars** — 19 entries (3C 273, OJ 287, BL Lacertae, etc.).
- **Galaxies** — 20 entries (M31, M82, M104, NGC 5128, LMC, SMC, etc.) plus the **Milky Way (Galactic Centre)** entry.
- **Satellites** — 12 base orbital entries: ISS, Hubble, Tiangong, eight Starlink-shell representatives, James Webb (L2). Two-body Kepler elements; ~1°/day drift from the 2024-04-15 epoch — conceptual, not precision tracking.

Each catalogued body renders in its own colour: cel nav warm-yellow, catalogued white, black holes purple, quasars cyan, galaxies pink, satellites lime green.

---

# Demos tab

Scripted-animation browser. Controls along the top: **Stop**, **Pause / Resume**, **Prev / Next**. While a demo plays:

- Transport bar ▶ / ⏸ pauses the demo in place; ½× / 2× scale its tempo.
- **End Demo / End Tracking** appear in the info bar.
- Autoplay is suspended for the duration of the demo so pause truly freezes time.
- Default playback runs at 1/8 the authored cadence (use 2× a few times to speed up).
- Pre-demo state (observer lat/lon, time, tracker, view options) snapshots on play and restores on stop / End Demo / queue completion.
- Constellation outlines are hidden during every demo by default (an intro can opt back in).

Sections:

- **24 h Sun (4)** — polar-sun demonstrations (Alert NU, West Antarctica, midnight sun N/S). Auto-switches the GE map to HQ Equirectangular Daytime so the globe shows daylit imagery during polar day.
- **24 h Moon (2)** — 75°N (~2025-01-12, near max +declination) and 75°S (~2025-01-26, near max -declination). Watches one full sidereal day at lunar standstill; same cadence as the 24 h Sun demos.
- **General (6)** — equinox at equator, summer / winter solstice at 45°N, moon-phase month, observer travel, 78°N 24-hour daylight.
- **Sun Analemma / Moon Analemma / Sun + Moon Analemma** — 5 latitude variants each (90°N, 45°N, 0°, 45°S, 90°S). The trace and noon-position notches now render in **both FE and GE**, on the observer's local sky hemisphere. The body must be above the observer's horizon at noon to be captured, so polar latitudes naturally produce a partial figure (only the months when the sun / moon is physically observable). Mid-latitudes get the full figure-8.
- **Solar Eclipses (44 entries, 2021–2040)** — one per real solar eclipse (Espenak). Demo refines syzygy time using the active pipeline's own sun + moon and plants the observer at that pipeline's subsolar point.
- **Lunar Eclipses (67 entries, 2021–2040)** — same structure, including 22 penumbrals.
- **FE Eclipse Predictions** — placeholder for a future Saros-harmonic predictor.
- **Flight Routes — Southern Non-Stop** — flight-path demos drawn from Roohif's KMZ. Every demo opens with an outline-only line-art map (FE: black disc with white coastlines, GE: line-art globe), the Tropics / Polar / Sun-Moon-GP / Tracker-GP overlays cleared, shadows off, and the observer parked at the south-pole-facing camera angle. Per-route great-circle arcs sweep at constant angular speed; an orange plane silhouette flies the trace tip and rotates along the local arc tangent. The dashed complement line traces the rest of each great circle for context. Top-left HUD info boxes carry **Depart / Destination / Takeoff / Arrival / Central Angle / Air Time / Air Speed / Ground Speed / Traversed / Remaining / Elapsed** rows, with live-countdown rows updating per frame. Demos:
  - **All routes — combined map** — every leg sweeping in lockstep.
  - **Central-angle theorem — north vs south arc length** — numeric south-vs-mirrored-north parity per leg, drawn alongside the sweep.
  - **Equal Arc Flight (N/S) (Mirror lat)** — Johannesburg ↔ Sydney paired with its lat-mirrored northern reflection. Both legs at the same central angle; right-side race panel shows two straight horizontal tracks whose pixel length is proportional to each route's AE-projected arc length, with twin plane silhouettes racing along them at the same `FlightRoutesProgress`. Equal arc → equal time, regardless of projection distortion.
  - **Equal Arc Flight (N/S)** — Santiago ↔ Sydney (south, traces over the South Pacific) paired with JFK ↔ Persian Gulf (north, traces over the North Atlantic / Mediterranean) at the same 102° central angle. Opposite hemispheres, non-intersecting arcs. South leg in orange, north leg in cyan — info boxes, route lines, planes, rings, leaders, and race lanes are all colour-matched.
  - **Actual flight — QF27/28** (4 entries: 2024-06-25 SCL→SYD, 2024-06-25 SYD→SCL, 2024-06-26 SYD→SCL, 2024-06-26 SCL→SYD). Pulled from the bundled KMZ track (241 decimated waypoints each, with per-point air speed / ground speed / heading / wind). Info box shows actual vs predicted flight time + average air speed + calculated ground speed (= central-angle ÷ flight time, in DMS/h).
  - **Per-route demos** — one demo per Southern Non-Stop leg (Melbourne ↔ Santiago, Santiago ↔ Sydney, Auckland ↔ Santiago, Johannesburg ↔ São Paulo / Perth / Sydney, Buenos Aires ↔ Darwin).

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

# Mobile / install

The sim ships a PWA `manifest.webmanifest`, `theme-color`, and the `mobile-web-app-capable` / `apple-mobile-web-app-*` meta tags, so modern mobile browsers offer **Install / Add to Home Screen** and the app then runs full-screen with the dark UI theme. Two responsive breakpoints kick in below 900 px (tablet) and 520 px (phone): the bottom bar switches to horizontal scroll instead of wrapping, the header subtitle is hidden, tab popups become near-fullscreen overlays so dense control panels actually fit, and the HUD shrinks. Touch input routes through the existing pointer-event handlers.

---

# Tracking helpers

- **Avatar follows the tracked body** — when a target is being followed, the observer figure rotates so its facing direction tracks the target's azimuth in all three views (FE Heavenly, FE Optical, GE). The first click also snaps the heading immediately so the avatar doesn't have to wait for the next update tick.
- **Picker prefers `FollowTarget` on ties** — when the cursor is near two coincident-position bodies (e.g. sun + moon at new moon), hover/click resolves to the one being followed instead of whichever was first in the candidate list.
- **Stars hidden by daytime aren't hover targets** — when DynamicStars / GE forces the day-night fade and the sky is bright, faded-out catalog stars no longer collect tooltips or absorb clicks; the cursor falls through to whatever's behind.

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
- **Roohif** — flight-path KMZ data (Southern Non-Stop city/leg list and the QF27/28 actual-flight tracks with per-waypoint air speed, ground speed, heading, wind, and altitude). Powers the Flight Routes demo group and every QF27/28 actual-flight playback.
