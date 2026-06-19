# Serial change log

Every change is assigned a serial `SNNN`. Entries are executed actions only:
date, files touched, what changed, revert path. No narrative.

Format:
- **Serial: title**
  - **Date** (UTC if known)
  - **Files changed**
  - **Change**
  - **Revert path**

---

## S000: Baseline

- **Date:** 2026-06-13
- **Files changed:** n/a (faithful copy of fe_model carried over)
- **Change:** Reference snapshot. Full fe_model feature set carried over
  unmodified as the starting point for fe_conceptual_model_2.
- **Revert path:** n/a (snapshot).

## S001: Tang canonical frame

- **Date:** 2026-06-13
- **Files changed:** `js/tang/units.js`, `js/tang/xiu.js`, `js/tang/frame.js`,
  `js/tang/sphere.js`.
- **Change:**
  - Added Chinese units (`DEG_PER_DU`, `DU_PER_DEG`, `LI_PER_DU=351.267`,
    `BU_PER_LI`, km bridge).
  - Added 28 lunar mansions with determinative-star J2000 RA and `xiuOfRa()`.
  - Added Tang frame encode/decode: `raDecToTang`, `raDecRadToTang`,
    `tangToRaDec`, `tangToRaDecRad`, `fmtTang` (RXD 入宿度, QJD 去極度, du).
  - Added single funnel `bodyTang(name, dateUTC, source)`.
- **Revert path:** delete `js/tang/`.

## S002: Modular ephemeris registry (ptolz only)

- **Date:** 2026-06-13
- **Files changed:** `js/ephem/registry.js`, `js/ephem/ptolemy.js`,
  `js/ephem/common.js`.
- **Change:**
  - Added modular ephemeris registry (`register`, `setActiveSource`,
    `activeSource`, `availableSources`, `sourceLabel`).
  - Relocated Almagest pipeline (`ptolemy.js`) and shared Meeus helpers
    (`common.js`) under `js/ephem/`.
  - Registered ptolz as the only active source.
- **Revert path:** delete `js/ephem/`.

## S003: Dispatcher funnels through Tang; default ptolz

- **Date:** 2026-06-13
- **Files changed:** `js/core/ephemeris.js`, `js/core/app.js`.
- **Change:**
  - Reduced `js/core/ephemeris.js` to a compatibility dispatcher:
    `bodyRADec`, `sunEquatorial`, `moonEquatorial`, `planetEquatorial`,
    `bodyGeocentric` funnel through `bodyTang`; added `bodyRADecTang`;
    `EPHEMERIS_SOURCES = ['ptolemy']`.
  - Set `app.js` default `BodySource` to `'ptolemy'`.
- **Revert path:** restore prior `ephemeris.js` and `app.js` from S000 copy.

## S004: Spine self-test

- **Date:** 2026-06-13
- **Files changed:** `scripts/test-tang-spine.mjs`.
- **Change:** Added Tang frame spine self-test (encode/decode round-trip,
  xiu lookup, du conversions).
- **Revert path:** delete `scripts/test-tang-spine.mjs`.

## S005: FE/GE interpreters extracted

- **Date:** 2026-06-13
- **Files changed:** `js/core/interpret/fe.js` (new), `js/core/interpret/ge.js` (new), `js/core/app.js`.
- **Change:**
  - Extracted flat-earth disc/dome geometry into `interpret/fe.js`
    (`opticalVaultProject`, `heavenlyVaultCeiling`, `heavenlyVaultCoord`,
    `opticalVaultCoord`) and globe geometry into `interpret/ge.js`
    (`observerBasis`, `observerCoord`, `heavenlyVaultCoord`, `opticalProject`).
  - Neither module imports the other; both consume the shared Tang-canonical
    celestial sphere. `app.js` closures (`_bodyVault`, `_globeVaultAt`,
    `_globeOpticalProject`, the GE observer block) now delegate to them.
  - Behavior-preserving: `scripts/snapshot.mjs` output byte-identical before
    and after across 5 observer/date/world-model cases.
- **Revert path:** delete `js/core/interpret/`, restore S004 `app.js`.

## S006: Terrestrial Chinese ground frame

- **Date:** 2026-06-13
- **Files changed:** `js/tang/ground.js` (new), `js/core/app.js`, `scripts/test-tang-spine.mjs`.
- **Change:**
  - Added `js/tang/ground.js`: observer lat/long is canonically a Chinese du
    ground record (polar-altitude du + longitude du), decoded to modern
    degrees for the geometry pipeline. Mirrors the celestial Tang funnel.
  - `app.js` update() encodes the observer position to `c.ObserverGround` and
    decodes back to the degrees used downstream (lossless; zero drift over
    500 updates).
  - Extended spine test with ground round-trip + du conversion checks.
- **Revert path:** delete `js/tang/ground.js`, restore S005 `app.js`, drop the
  ground checks from the spine test.

## S007: Observer Chinese-du unit toggle

- **Date:** 2026-06-13
- **Files changed:** `js/ui/controlPanel.js`, `js/core/app.js`.
- **Change:**
  - Added a "Chinese du units" checkbox to the Observer submenu. Toggles the
    ObserverLat / ObserverLong / Elevation / Azi rows between modern degrees
    (default) and du. Display-only: stored values stay in degrees, slider and
    geometry untouched.
  - State key `ObserverUnitsChinese` (default false), registered UI-only.
- **Revert path:** remove the checkbox row + `chineseDu` flags, restore prior
  `numericRow`, drop `ObserverUnitsChinese`.

## S008: Rename Tang frame (was mislabelled "Feng")

- **Date:** 2026-06-13
- **Files changed:** `js/feng/` -> `js/tang/`, `scripts/test-feng-spine.mjs` ->
  `scripts/test-tang-spine.mjs`, plus all referencing source/docs.
- **Change:**
  - Renamed the canonical coordinate frame from "Feng" to "Tang" (the Tang
    sphere, after the dynasty under which Yi Xing's survey was commissioned).
    Identifiers (bodyTang, raDecToTang, tangToRaDec, fmtTang, groundDegToTang,
    etc.), import paths, comments, and docs updated.
  - Fengyun satellite names in `satellitesExtra.js` left untouched.
  - Behavior-preserving: snapshot byte-identical to baseline.
- **Revert path:** rename `js/tang/` back to `js/feng/` and reverse the token
  replacement.

## S009: Tang planetary baseline + epicycle-accuracy ladder

- **Date:** 2026-06-13
- **Files changed:** `js/ephem/tangPlanets.js` (new), `scripts/validate-planets.mjs`, `scripts/epicycle-accuracy.mjs` (new).
- **Change:** 2-body geocentric epicyclic planet model (Standish elements, exact
  equation of centre = full epicycle series), validated to sub-arcminute for
  Sun + inner + Mars. Epicycle-count vs accuracy ladder using truncated VSOP:
  ~100 epicycles/coordinate reaches arcsecond, full series sub-0.05 arcsec.
- **Revert path:** delete the two new files.

## S010: Master Tang geocentric ephemeris (arcsecond, all bodies)

- **Date:** 2026-06-13
- **Files changed:** `js/ephem/masterTang.js` (new), `js/ephem/moonFull.js` (new),
  `js/data/vsop87/uranus.js` + `neptune.js` (new), `scripts/validate-master.mjs` (new).
- **Change:** single geocentric, fully epicyclic, apparent-of-date ephemeris for
  Sun + Moon + 7 planets. VSOP87 heliocentric series + light-time + annual
  aberration + nutation + Delta-T; full Meeus Ch.47 Moon; Uranus/Neptune VSOP87D.
  Provenance header cites all source notes; epicycle commentary throughout.
  Validated vs DE405/Espenak: sub-arcsecond to ~5 arcsec for all bodies.
- **Revert path:** delete the new files; unregister in registry.js.

## S011: Master registered as active ephemeris source

- **Date:** 2026-06-13
- **Files changed:** `js/ephem/registry.js`, `scripts/test-tang-spine.mjs`.
- **Change:** registered the master provider and set it active; Ptolemy retained
  for comparison. Updated spine-test registry assertions.
- **Revert path:** restore S010 registry.js; revert the three test assertions.

## S012: Kinematic eclipse prediction validated vs Espenak

- **Date:** 2026-06-13
- **Files changed:** `scripts/validate-eclipses.mjs` (new).
- **Change:** solar/lunar eclipse prediction by syzygy of the master Sun+Moon;
  matches Espenak's 2021-2027 canon to 0.0 minutes (29 events).
- **Revert path:** delete the file.

## S013: Two named Tang ephemerides + stars in du/xiu + header reframe

- **Date:** 2026-06-13
- **Files changed:** `js/ephem/masterTang.js`, `js/ephem/registry.js`,
  `js/ephem/tangStars.js` (new), `js/core/ephemeris.js`, `js/core/app.js`,
  `scripts/test-tang-spine.mjs`.
- **Change:**
  - Renamed the two sources: `tangMaster` (full sky, modern, active) and
    `tangPtolz` (pure Almagest, no new bodies). Updated EPHEMERIS_SOURCES,
    app BodySource default, spine-test assertions.
  - Reworded the masterTang header: the modern series (VSOP, Meeus moon) are
    position DATA fed into the geocentric epicyclic model, not a fix or
    completion of Ptolemy; they supply angle-over-time for the planets and the
    bodies the Almagest never listed (Uranus, Neptune).
  - Added `tangStars.js`: the 58 cel-nav stars carried to date with the combined
    trepidation (precession + nutation + aberration) and expressed in du/xiu.
- **Revert path:** delete tangStars.js; restore prior ids/labels and header.

## S014: Five-millennium eclipse canon + full-range Delta-T + validation

- **Date:** 2026-06-13
- **Files changed:** `js/ephem/deltaT.js` (new), `js/data/eclipseCanon5M.js` (new),
  `js/ephem/masterTang.js`, `js/ephem/moonFull.js`, `scripts/validate-canon.mjs`
  (new), `scripts/canon-to-tang.mjs` (new).
- **Change:**
  - Added the full Espenak-Meeus piecewise Delta-T (-1999..+3000) in deltaT.js;
    master + moon now share it (was the 2005-2050 branch only). Verified against
    known historical Delta-T (7 h at 1000 BCE, 26 min at 1000 CE, 64 s at 2000).
  - Scraped Espenak & Meeus's Five Millennium Catalog: 11,898 solar + 12,064
    lunar eclipses, -1999..+3000, with per-eclipse Delta-T.
  - Validated the master across all 5 millennia: eclipse geometry is canon-grade
    (0.0 s where the Delta-T models agree); timing limited by Delta-T (~1-2 s
    1500-2500 CE, ~7 s at the Tang era, ~3 min by 2000 BCE vs the canon).
  - Tang-unit conversion of any canon eclipse (Sun in xiu + du, ground point in
    polar-altitude du / longitude du).
- **Revert path:** delete the new files; restore the 2005-2050 Delta-T in
  master/moon.

## S015: Full ELP-2000 Moon + per-call Delta-T override (deep-past eclipse timing)

- **Date:** 2026-06-13
- **Files changed:** `js/ephem/moonELP.js` (new), `js/ephem/masterTang.js`,
  `js/ephem/moonFull.js`, `scripts/validate-moon-elp.mjs` (new),
  `scripts/validate-canon.mjs`, `scripts/canon-to-tang.mjs`.
- **Change:**
  - Added a per-call Delta-T override to the master and moon so a historical
    eclipse can be placed at its exact dynamical time using the canon's own
    measured Delta-T instead of the polynomial fit.
  - Fixed a bug where the override reached the moon's obliquity but not its
    ecliptic position (`moonEclipticOfDate(date)` was called without the
    override argument); the moon position now honours the override.
  - Replaced the master's Moon with full ELP-2000-82B (`moonELP.js`, 3402
    lunar terms, ported from vsr83/ELP2000-82B, verified against ELP's
    published test values). Abridged Meeus Ch.47 (`moonFull.js`) kept for
    comparison.
  - Result vs the 5-millennium canon: eclipse timing 0.0 s (<=~10 s) from
    ~500 BCE to 3000 CE, degrading to ~60 s only at -2000 (a definitional /
    tidal-acceleration floor, not moon position error). Near-present unchanged
    (sub-arcsecond, 0.0-minute eclipses).
- **Revert path:** restore the `moonFull.js` import in masterTang.js; delete
  moonELP.js.
