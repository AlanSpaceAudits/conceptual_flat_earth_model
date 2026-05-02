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
import { computeSolarEclipseShadowPath } from '../core/besselianEclipse.js';

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
      const shadowPath = (kind === 'solar')
        ? computeSolarEclipseShadowPath(refined.date, moonFn, 1.0, 33)
        : null;
      const halfWindowDays = (kind === 'solar') ? (1 / 24) : null;
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
        EclipseShadowAnchorDt:       (kind === 'solar') ? modelDT : null,
        EclipseShadowHalfWindowDays: halfWindowDays,
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
