# Conceptual Flat Earth Model

An interactive, browser-based conceptual model of the flat-earth cosmology built
with three.js. The scene draws the stationary disc, the observer's optical
vault (a flattened cap onto which stars, sun, moon, and planets project), and
the heavenly vault above it. All geometry is unit-less — every distance is a
ratio of the flat-earth disc radius.

## Live demo

Hosted on GitHub Pages — see the "Pages" link on this repo.

## Running locally

No build step. It's a static site, but browsers block ES-module imports over
`file://`, so you need any local HTTP server:

    python3 -m http.server 8000

Then open <http://localhost:8000>.

## Controls

* **View tab** — observer lat/long, camera, heavenly vault, optical vault,
  per-body vault heights, ray shape.
* **Time tab** — day of year, time, date-time.
* **Show tab** — visibility toggles for land, grid, shadow terminator,
  starfield, rays, declination circles, etc.
* **Demos tab** — scripted camera/time animations illustrating key points
  of the conceptual model.

The "ⓘ About" button in the header explains the model's stance on the
lat/long graticule and the fictitious center-of-earth observer.

## Special Thanks

This project is built on ideas and groundwork from people whose work
pointed the way:

* **Shane St. Pierre** — for the conceptual framing and the push to actually
  build a working, interactive demonstration of the model.
* **Walter Bislin** — visualization inspiration.
* **Fred Espenak** — for the public geocentric ephemeris tables on
  [AstroPixels](https://www.astropixels.com/ephemeris/ephemeris.html),
  computed from JPL DE405 and bundled here as the "DE405" ephemeris
  pipeline. All credit for the underlying data belongs to him; this sim
  only tabulates daily RA/Dec for sun, moon, and the five classical
  planets. See `js/core/ephemerisAstropixels.js` for the runtime
  attribution and `js/data/astropixels.js` for the extracted data.
* **Roohif** — for the flight-path KMZ data behind the
  Flight Routes demo group. The `Southern Non-Stop` city / leg list
  and the QF27/28 actual-flight-track waypoints (lat / lon /
  altitude / per-point air speed / ground speed / heading / wind)
  bundled in `js/data/flightRoutes.js` and
  `js/data/flightTracks.js` are parsed straight from his KMZ
  archive. The Equal Arc demos and the QF27/28 actual-flight
  playbacks lean entirely on that dataset.

Additional credits baked into the ephemeris pipelines:

* **R.H. van Gent** (Utrecht University) — Almagest Ephemeris Calculator,
  the source of the Ptolemaic deferent+epicycle pipeline.
* **Bretagnon & Francou** (1988) / **Sonia Keys** / **commenthol** —
  VSOP87 theory and the MIT-licensed JS coefficient port used for
  the analytical ephemeris pipeline.
* **Jean Meeus**, *Astronomical Algorithms* (2nd ed., 1998) — the
  backbone for the Sun, Moon, GMST, precession, nutation, and
  aberration routines used across all pipelines.

Without their inspiration, their published theory, and their public
data tables, this wouldn't exist.
