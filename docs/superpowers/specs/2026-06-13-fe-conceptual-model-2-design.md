# fe_conceptual_model_2: design spec

**Date:** 2026-06-13

A ground-up restructure of `fe_model` (a browser-based conceptual astronomy
sim, ~772 serials). The full feature set of `fe_model` is carried over
faithfully and re-based on a single new spine: the Tang canonical celestial
frame. Every body position now passes through one funnel before any rendering
or projection happens.

## 1. One sphere, two interpretations

There is exactly one celestial sphere. Its positions are computed once, in the
Tang canonical frame, and stored as canonical records. Two independent
interpreters read those same records:

- **FE** maps the shared angles onto the stationary disc and optical/heavenly
  vault, in Chinese distance units (li / bu).
- **GE** maps the same shared angles onto a globe, in km.

FE and GE never share geometry code and never diverge in their inputs. In `app.js`, FE coords
(`Sun*VaultCoord` / `Sun*OpticalVaultCoord`) and GE coords
(`Sun*GlobeVaultCoord` / `Sun*GlobeOpticalVaultCoord`) are computed on separate
code paths; `WorldModel` toggles which one renders.

## 2. The Tang canonical frame (baseline coordinate system)

The baseline coordinate system is the Chinese (Yi Xing / Dayan) equatorial
system, expressed in **du** (365.25 per great circle), with positions located
by lunar mansion.

- **du**: angular unit, 1/365.25 of the celestial circle.
  `DEG_PER_DU = 360 / 365.25`, `DU_PER_DEG = 365.25 / 360`. (`js/tang/units.js`)
- **xiu (宿)**: the 28 lunar mansions, indexed 0..27, each anchored by its
  determinative-star J2000 RA. `xiuOfRa(raDeg)` returns the mansion a body
  sits in. (`js/tang/xiu.js`)
- **RXD, 入宿度 (ru xiu du)**: mansion-entry degree, in du: the eastward
  distance from the determinative star at the western edge of the body's
  mansion.
- **QJD, 去極度 (qu ji du)**: polar distance, i.e. co-declination, in du:
  `QJD = (90 − dec) × DU_PER_DEG`, so `dec = 90 − (qjdDu in degrees)`.

A Tang record from `raDecToTang(raDeg, decDeg)` carries
`{ xiu, xiuName, xiuHanzi, rxdDu, qjdDu, raDeg, decDeg }`. Companion entry
points: `raDecRadToTang`, `tangToRaDec`, `tangToRaDecRad`, `fmtTang`.

The Tang-era calibration (Xin Tangshu, Yi Xing, 8th c. CE) ties 1 du to
351 li 80 bu of north-south meridian travel: `LI_PER_DU = 351.267`,
`BU_PER_LI = 300`. Great-circle circumference falls out as
`365.25 du × 351.267 li/du ≈ 128,300 li`. The km bridge is a post-hoc unit
conversion anchored to the WGS84 polar circumference; no SI is smuggled into
the internal system.

## 3. Data flow: ephemeris → encode → canonical → decode → render

Modern ephemerides report equatorial RA/Dec. The pipeline:

1. **ephemeris**: the active provider answers
   `bodyRADec(name, dateUTC) -> { ra, dec }` (radians, geocentric apparent).
2. **encode**: `raDecToTang` converts RA/Dec into a Tang record once.
3. **canonical**: the Tang record is stored as the single source of truth.
4. **decode**: `tangToRaDec` / `tangToRaDecRad` recover RA/Dec for the
   geometry stages. Encode and decode are exact inverses (lossless to
   floating-point), so the Tang baseline does not alter downstream geometry.
5. **render**: FE and GE interpreters map the recovered angles into their
   respective geometries and unit systems.

The single funnel is `bodyTang(name, dateUTC, source) -> { ra, dec, tang }`
in `js/tang/sphere.js`. Everything upstream of rendering passes through it.

## 4. Modular ephemeris registry (ptolz only, for now)

`js/ephem/registry.js` makes the simulator ephemeris-agnostic. Any provider
that can answer "geocentric RA/Dec for this body at this instant" can be
registered and selected as the active source.

Provider interface:

```
{
  id:    string,
  label: string,
  bodyRADec(name, dateUTC) -> { ra, dec }   // radians, geocentric apparent
  covers(name) -> bool,
  coversDate(dateUTC) -> bool,
}
```

Only the **Ptolemy** pipeline ("ptolz", Almagest deferent + epicycle) is wired
in and active, to get the model running on a single source.
`EPHEMERIS_SOURCES = ['ptolemy']`. Adding VSOP87, DE405, Schlyter, etc. later
is one `register()` call each; the rest of the app does not change because
every body position is funnelled through the Tang frame downstream of this
module. The Almagest pipeline lives in `js/ephem/ptolemy.js`; shared Meeus
helpers in `js/ephem/common.js`.

## 5. Compatibility dispatcher

`js/core/ephemeris.js` is a compatibility shim so the carried-over render / ui /
demo code is untouched. `bodyRADec`, `sunEquatorial`, `moonEquatorial`,
`planetEquatorial`, and `bodyGeocentric` all funnel through `bodyTang`
(Tang-canonical, ptolz source). It also exports
`bodyRADecTang(name, date) -> { ra, dec, tang }`. `js/core/app.js` sets the
default `BodySource` to `'ptolemy'`.

## 6. Module layout

- `js/tang/`: canonical frame: `units.js`, `xiu.js`, `frame.js`, `sphere.js`.
- `js/ephem/`: modular registry + providers: `registry.js`, `ptolemy.js`,
  `common.js`.
- `js/core/`: app state and the compatibility dispatcher: `app.js`,
  `ephemeris.js`.
- `js/render/`: three.js scene, world objects, FE/GE geometry.
- `js/ui/`: control panel, mouse handler, i18n.
- `js/demos/`: scripted camera/time animations.
- `js/data/`: catalogues, eclipse tables, flight routes/tracks.
- `js/math/`: shared math helpers.

## 7. Scope

A full, faithful port of `fe_model`'s feature set (render, ui, demos, data,
catalogues, eclipses, refraction, cosmologies, flight routes, i18n, PWA),
re-based on the Tang spine. The app builds clean (`npm run build`, 81 files);
the model compute runs (`scripts/smoke.mjs`); the spine self-test passes
(`scripts/test-tang-spine.mjs`).
