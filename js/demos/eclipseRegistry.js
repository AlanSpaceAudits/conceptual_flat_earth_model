// eclipse demo registry.
//
// Builds a demo definition for every real eclipse in
// `js/data/astropixelsEclipses.js` (111 events 2021-2040, credit
// Fred Espenak / AstroPixels / JPL DE405). Each demo refines its
// landing time using whichever ephemeris pipeline the has
// selected — so the same eclipse plays out differently under HelioC
// vs DE405 vs Ptolemy vs VSOP87, which is the pedagogy.
//
// The registry exports two arrays (solar + lunar) of demo objects
// matching the shape `js/demos/index.js` expects. `definitions.js`
// concatenates them alongside the existing non-eclipse demos and an
// FE-prediction placeholder track.

import { ASTROPIXELS_ECLIPSES } from '../data/astropixelsEclipses.js';
import { Ttxt, Tval } from './animation.js';
import { TIME_ORIGIN } from '../core/constants.js';
import {
  sunEquatorial as commonSunEq,
  moonEquatorial as commonMoonEq,
  greenwichSiderealDeg,
  refineEclipseByMinSeparation,
} from '../core/ephemerisCommon.js';
import { helio, geo, ptol, apix, vsop } from '../core/ephemeris.js';
import {
  computeSolarEclipseShadowPath,
  besselianShadowPathFromElements,
} from '../core/besselianEclipse.js';
import { ECLIPSE_BESSELIAN } from '../data/eclipseBesselian.js';

// Pick (sunFn, moonFn) pair for a given BodySource value. Both the
// finder (`refineEclipseByMinSeparation`) and the sky render use the
// same pair — keeping the demo internally consistent with whatever
// pipeline is active.
function ephemerisPair(bodySource) {
  switch (bodySource) {
    case 'heliocentric': return { sunFn: (d) => helio.bodyGeocentric('sun', d),
                                  moonFn: (d) => helio.bodyGeocentric('moon', d), label: 'HelioC' };
    case 'ptolemy':      return { sunFn: (d) => ptol.bodyGeocentric('sun', d),
                                  moonFn: (d) => ptol.bodyGeocentric('moon', d), label: 'Ptolemy' };
    case 'astropixels':  return { sunFn: (d) => apix.bodyGeocentric('sun', d),
                                  moonFn: (d) => apix.bodyGeocentric('moon', d), label: 'DE405' };
    case 'vsop87':       return { sunFn: (d) => vsop.bodyGeocentric('sun', d),
                                  moonFn: (d) => vsop.bodyGeocentric('moon', d), label: 'VSOP87' };
    case 'geocentric':
    default:             return { sunFn: (d) => geo.bodyGeocentric('sun', d),
                                  moonFn: (d) => geo.bodyGeocentric('moon', d), label: 'GeoC' };
  }
}

// Convert a model DateTime-day value from a Date. The sim's DateTime
// state is "days since TIME_ORIGIN.ZeroDate" (floating-point,
// fractional = fractional UTC day).
function dateToModelDT(d) {
  return d.getTime() / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate;
}

// Build a demo definition for a single eclipse event.
//   event: { date, utISO, type, saros, magnitude?, duration? }
//   kind:  'solar' | 'lunar'
function buildEclipseDemo(event, kind) {
  const anchor = new Date(event.utISO);
  const typeTag = kind === 'solar' ? `${event.type} solar` : `${event.type} lunar`;
  const durTag = event.duration ? ` · ${event.duration} central` : '';
  const magTag = event.magnitude != null ? ` · mag ${event.magnitude.toFixed(2)}` : '';
  const saros  = event.saros != null ? ` · Saros ${event.saros}` : '';
  const name = `${event.date}  ${typeTag}${durTag}${magTag}${saros}`;

  return {
    name,
    group: kind === 'solar' ? 'solar-eclipses' : 'lunar-eclipses',
    event,            // preserve raw event for any consumer that wants it
    kind,
    intro: (model) => {
      const src = model?.state?.BodySource || 'geocentric';
      const { sunFn, moonFn, label } = ephemerisPair(src);
      // Refine around the tabulated TD/UT to find what THIS pipeline
      // considers the closest syzygy (or anti-syzygy for lunar).
      const refined = refineEclipseByMinSeparation(anchor, sunFn, moonFn, { kind });
      const modelDT = dateToModelDT(refined.date);
      // Subsolar point at refined time (for solar) or observer at the
      // moon's sub-lunar point (for lunar — the moon is overhead to
      // watch it enter Earth's shadow).
      const bodyEq   = kind === 'solar' ? sunFn(refined.date)    : moonFn(refined.date);
      const gmstDeg  = greenwichSiderealDeg(refined.date);
      const raDeg    = bodyEq.ra  * 180 / Math.PI;
      const decDeg   = bodyEq.dec * 180 / Math.PI;
      const subLong  = ((raDeg - gmstDeg + 540) % 360) - 180;
      // Solar eclipses get a swept-shadow path overlay computed
      // from the active pipeline's moon ephemeris — sublunar
      // samples through ±1 h around greatest eclipse drive the
      // central line, magnitude bands at fixed half-widths
      // (totality / 75 / 50 / 25 / 0 %) sweep along with the
      // demo's existing DateTime tween (state-driven progress
      // path in `BesselianEclipsePath.update`).
      // Per-eclipse Espenak Besselian elements (NASA SE search
      // engine, scraped via `scripts/scrape_besselian.mjs`). When
      // present, evaluate the polynomial path directly — that
      // gives the real umbra ground track plus per-event P1 / P4
      // contact times and per-event l1 / l2 for magnitude bands.
      // Sublunar approximation kept as a fallback for any eclipse
      // not in the Besselian table.
      const els = (kind === 'solar') ? ECLIPSE_BESSELIAN[event.date] : null;
      let shadowPath = null;
      let halfWindowDays = null;
      let modelDtForPath = modelDT;
      let l1Eclipse = null, l2Eclipse = null;
      if (els) {
        const result = besselianShadowPathFromElements(els, 49);
        const greatestModelDT = dateToModelDT(new Date(result.greatest));
        shadowPath = result.samples
          .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon))
          .map((s) => ({
            // `s.t` is hours from t0Tdt; shift so anchor = greatest.
            t: s.t - (result.greatest - new Date(els.jdT0 * 86400000 - 2440587.5 * 86400000).getTime() - els.deltaT * 1000) / 3600000,
            lat: s.lat, lon: s.lon,
          }));
        const halfWindowMs = Math.max(
          result.greatest - result.p1,
          result.p4 - result.greatest,
        );
        halfWindowDays = halfWindowMs / 86400000;
        modelDtForPath = greatestModelDT;
        l1Eclipse = result.l1Greatest;
        l2Eclipse = result.l2Greatest;
      } else if (kind === 'solar') {
        shadowPath = computeSolarEclipseShadowPath(refined.date, moonFn, 1.0, 33);
        halfWindowDays = 1 / 24;
      }
      return {
        DateTime:          modelDT - 1 / 24,
        ObserverLat:       Math.max(-85, Math.min(85, decDeg)),
        ObserverLong:      subLong,
        ObserverHeading:   0,
        CameraHeight:      89.9,
        CameraDirection:   0,
        Zoom:              3.0,
        InsideVault:       true,
        ShowOpticalVault:  true,
        ShowTruePositions: false,
        ShowFacingVector:  false,
        // latched by EclipseDirector so the shadow projection +
        // observer darkening can key off the currently-playing event.
        // also carry the event's magnitude + type through to
        // the renderer so umbra visibility + sizing follows the real
        // Espenak parameters.
        EclipseActive:     true,
        EclipseKind:       kind,
        EclipseEventUTMS:  refined.date.getTime(),
        EclipsePipeline:   label,
        EclipseMinSepDeg:  refined.minSeparationRad * 180 / Math.PI,
        EclipseMagnitude:  event.magnitude ?? 1,
        EclipseEventType:  event.type,
        // Shadow-path overlay (solar eclipses only). Null on
        // lunar so the renderer skips this code path.
        EclipseShadowPath:           shadowPath,
        EclipseShadowAnchorDt:       (kind === 'solar') ? modelDtForPath : null,
        EclipseShadowHalfWindowDays: halfWindowDays,
        EclipseShadowL1:             l1Eclipse,
        EclipseShadowL2:             l2Eclipse,
        ShowEclipseShadowPath:       (kind === 'solar'),
        // Apr-08-2024 standalone demo's progress key cleared so
        // the state-driven (DateTime-derived) path doesn't fight
        // a stale explicit progress.
        BesselianEclipseProgress:    null,
      };
    },
    tasks: (model) => {
      const src = model?.state?.BodySource || 'geocentric';
      const { sunFn, moonFn, label } = ephemerisPair(src);
      const refined = refineEclipseByMinSeparation(anchor, sunFn, moonFn, { kind });
      const modelDT = dateToModelDT(refined.date);
      const minSepDeg = refined.minSeparationRad * 180 / Math.PI;
      const verb = kind === 'solar' ? 'solar eclipse' : 'lunar eclipse';
      const closeness = minSepDeg < 0.5 ? 'tight syzygy — visible eclipse in this model'
                      : minSepDeg < 1.5 ? 'near syzygy — partial occultation at best in this model'
                      : `${minSepDeg.toFixed(2)}° off — no visible eclipse in this pipeline`;
      return [
        Ttxt(`${event.date} · ${event.type} ${verb} · ${label} pipeline — ${closeness}.`),
        Tval('DateTime', modelDT,         5000, 0, 'linear'),
        Ttxt(`Maximum ${verb} — ${label} predicts ${minSepDeg.toFixed(3)}° sun–${kind === 'solar' ? 'moon' : 'antimoon'} separation.`),
        Tval('DateTime', modelDT + 1 / 24, 5000, 0, 'linear'),
        Ttxt(`${event.date} complete.`),
      ];
    },
  };
}

export const SOLAR_ECLIPSE_DEMOS = ASTROPIXELS_ECLIPSES.solar.map(ev => buildEclipseDemo(ev, 'solar'));
export const LUNAR_ECLIPSE_DEMOS = ASTROPIXELS_ECLIPSES.lunar.map(ev => buildEclipseDemo(ev, 'lunar'));

// Attribution re-exported so the UI or about-box can cite it.
export const ECLIPSE_DATA_ATTRIBUTION = ASTROPIXELS_ECLIPSES.meta;
