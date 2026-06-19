# FE Conceptual Model

A browser-based conceptual astronomy simulation. Every body position is computed
on a single spine: the Tang canonical celestial frame.

There is one celestial sphere, computed once. Two independent interpreters read
the same positions: a flat-earth (FE) interpretation on the stationary disc in
Chinese distance units, and a globe-earth (GE) interpretation in km. They share
the same celestial angles and differ only in geometry and unit mapping.

## Coordinate system: the Tang baseline

The baseline coordinate system is the Chinese (Yi Xing / Dayan) equatorial
system, expressed in **du** (365.25 per great circle), with positions located
by lunar mansion (`js/tang/`).

- **du**: angular unit, 1/365.25 of the celestial circle
  (`DEG_PER_DU = 360 / 365.25`).
- **xiu (宿)**: the 28 lunar mansions, each anchored by its determinative-star
  J2000 RA. `xiuOfRa(raDeg)` returns the mansion for a given RA.
- **RXD, 入宿度 (ru xiu du)**: eastward du from the determinative star at the
  western edge of the body's mansion.
- **QJD, 去極度 (qu ji du)**: polar distance (co-declination) in du:
  `QJD = (90 − dec) × DU_PER_DEG`.

Modern ephemerides report equatorial RA/Dec. The pipeline encodes RA/Dec into a
Tang record once (`raDecToTang`), stores it as canonical, then decodes back to
RA/Dec (`tangToRaDec`) for the geometry stages. Encode and decode are exact
inverses, so the Tang baseline does not alter downstream geometry. The single
funnel is `bodyTang(name, dateUTC, source)` in `js/tang/sphere.js`.

The Tang-era calibration ties 1 du to 351 li 80 bu of meridian travel
(`LI_PER_DU = 351.267`), giving a great circle of about 128,300 li. A post-hoc
km bridge anchored to the WGS84 polar circumference handles SI conversion.

## Ephemeris: ptolz + modular registry

`js/ephem/registry.js` makes the simulator ephemeris-agnostic. Any provider
that answers `bodyRADec(name, dateUTC) -> { ra, dec }` (radians, geocentric
apparent) can be registered and selected as the active source.

Only the **Ptolemy** pipeline ("ptolz", Almagest deferent + epicycle) is wired
in and active. `EPHEMERIS_SOURCES = ['ptolemy']`; `app.js` defaults
`BodySource` to `'ptolemy'`. Adding further sources (VSOP87, DE405, Schlyter,
etc.) is one `register()` call each; the rest of the app does not change,
because every position is funnelled through the Tang frame.

`js/core/ephemeris.js` is a compatibility dispatcher: `bodyRADec`,
`sunEquatorial`, `moonEquatorial`, `planetEquatorial`, and `bodyGeocentric`
all funnel through `bodyTang`. It also exports `bodyRADecTang(name, date)`.

## Running locally

No build step is required to run the app. It is a static site, but browsers
block ES-module imports over `file://`, so use any local HTTP server:

    python3 -m http.server 8000

Then open <http://localhost:8000>.

For the minified/PWA build:

    npm run build        # writes js-min/ (esbuild, 81 files)

Then serve the project root and open `index.html`.

## Scripts

- `npm run build`: minified build via `scripts/build-min.mjs`.
- `npm run cap:build` / `cap:sync` / `cap:open` / `cap:run`: Capacitor
  Android wrapper (`scripts/build-cap.mjs`).

## Verification

    npm run build                       # builds clean (81 files)
    node scripts/test-tang-spine.mjs    # Tang frame spine self-test
    node scripts/smoke.mjs              # model compute smoke test

## Module layout

- `js/tang/`: canonical frame: `units.js`, `xiu.js`, `frame.js`, `sphere.js`.
- `js/ephem/`: registry + providers: `registry.js`, `ptolemy.js`, `common.js`.
- `js/core/`: app state and dispatcher: `app.js`, `ephemeris.js`.
- `js/render/`: three.js scene, world objects, FE/GE geometry.
- `js/ui/`: control panel, mouse handler, i18n.
- `js/demos/`: scripted camera/time animations.
- `js/data/`: catalogues, eclipse tables, flight routes/tracks.
- `js/math/`: shared math helpers.

## Special Thanks

This project builds on ideas and groundwork from people whose work pointed the
way:

* **Shane St. Pierre**: conceptual framing and the push to build a working,
  interactive demonstration of the model.
* **Walter Bislin**: visualization inspiration.
* **Fred Espenak**: public geocentric ephemeris tables on
  [AstroPixels](https://www.astropixels.com/ephemeris/ephemeris.html).
* **Roohif**: flight-path KMZ data behind the Flight Routes demos.
* **R.H. van Gent** (Utrecht University): Almagest Ephemeris Calculator,
  source of the Ptolemaic deferent + epicycle pipeline.
* **Jean Meeus**, *Astronomical Algorithms* (2nd ed., 1998): backbone for the
  Sun, Moon, GMST, precession, nutation, and aberration routines.
