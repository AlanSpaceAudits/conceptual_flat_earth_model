// FE Dome Model — application state and per-frame Update pipeline.
//
// State fields are intentionally flat so the UI layer can bind directly to
// them. Every mutation goes through setState() which triggers a recompute
// and then emits an 'update' event for the renderer / panel to react.

import { Clamp, Limit01, Limit1, ToRad } from '../math/utils.js';
import { V } from '../math/vect3.js';
import { M } from '../math/mat3.js';
import { CELESTIAL, GEOMETRY, FE_RADIUS, initTimeOrigin } from './constants.js';
import { dateTimeToDate } from './time.js';
import {
  sunEquatorial, moonEquatorial, greenwichSiderealDeg, equatorialToCelestCoord,
  planetEquatorial, PLANET_NAMES, bodyRADec, BODY_NAMES,
  bodyGeocentric, helio as ephHelio, geo as ephGeo, ptol as ephPtol,
  apix as ephApix, vsop as ephVsop,
} from './ephemeris.js';
import { apparentStarPosition } from './ephemerisCommon.js';
import { CEL_NAV_STARS, celNavStarById } from './celnavStars.js';
import { CATALOGUED_STARS, cataloguedStarById } from './constellations.js';
import { BLACK_HOLES, blackHoleById } from './blackHoles.js';
import { QUASARS,      quasarById }    from './quasars.js';
import {
  compTransMatCelestToGlobe, compTransMatLocalFeToGlobalFe, compTransMatVaultToFe,
  celestCoordToLocalGlobeCoord, coordToLatLong, localGlobeCoordToAngles,
  localGlobeCoordToGlobalFeCoord, vaultCoordToGlobalFeCoord,
} from './transforms.js';
import {
  feLatLongToGlobalFeCoord, celestLatLongToVaultCoord, vaultCoordAt,
} from './feGeometry.js';

// Mirrors PLANET_STYLE colours in render/index.js and the Tracker
// button grid. Keep in sync.
const PLANET_GP_COLORS = {
  mercury: 0xd0b090,
  venus:   0xfff0c8,
  mars:    0xd05040,
  jupiter: 0xffa060,
  saturn:  0xe4c888,
  uranus:  0xa8d8e0,
  neptune: 0x7fa6e8,
};
const TRACKED_GP_COLORS_PLANET_DEFAULT = 0xff8c66;

function opticalVaultProject(localGlobe, R, H) {
  return [localGlobe[0] * H, localGlobe[1] * R, localGlobe[2] * R];
}

// z ≤ domeH · √(1 − (r/domeR)²) — ellipsoidal ceiling at a body's AE radius.
function heavenlyVaultCeiling(latDeg, domeSize, domeHeight, feRadius) {
  const r = feRadius * (90 - latDeg) / 180;
  const domeR = domeSize * feRadius;
  const rhoSq = (r * r) / (domeR * domeR);
  if (rhoSq >= 1) return 0;
  return domeHeight * Math.sqrt(1 - rhoSq);
}

// Default state. Distances in FE_RADIUS units.
function defaultState() {
  return {
    ObserverLat:  32.0,
    ObserverLong: -100.8387,
    // 0 = N, 90 = E, 180 = S, 270 = W.
    ObserverHeading: 357.3098,
    ObserverElevation: 0,
    CameraDirection: -106.6,
    CameraHeight:    15.2,
    CameraDistance:  GEOMETRY.CameraDistanceDefault,
    Zoom:             4.67,
    // Optical-only. fov = 75° / OpticalZoom.
    OpticalZoom:      1.0,

    // Days since 2017-01-01.
    DateTime:    812.88,
    DayOfYear:   812,
    Time:        21.07,

    VaultSize:   GEOMETRY.VaultSizeDefault,
    VaultHeight: 0.4,

    // H = R → hemispheric Optical projection. Reducing H only affects
    // the Heavenly cap depiction (see OpticalVaultHeightEffective).
    OpticalVaultSize:   GEOMETRY.OpticalVaultRadiusFar,
    OpticalVaultHeight: 0.5,

    RayParameter: 2.0,
    RayTarget:    0,
    RaySource:    0,

    ShowFeGrid:     false,
    ShowShadow:     true,
    ShowVault:      false,
    ShowVaultGrid:   false,
    ShowTruePositions: false,
    ShowSunTrack:   false,
    ShowMoonTrack:  false,
    ShowOpticalVault:     true,
    ShowStars:      true,
    ShowVaultRays:        false,
    ShowOpticalVaultRays: false,
    ShowManyRays:   false,
    ShowProjectionRays: false,
    ShowLatitudeLines: false,
    ShowGroundPoints:  false,
    ShowFacingVector:  false,
    ShowDecCircles:    false,
    ShowLogo:          true,
    ShowConstellations:      true,
    ShowConstellationLines:  true,
    ShowLongitudeRing:       false,
    ShowAzimuthRing:         true,
    ShowOpticalVaultGrid:    false,
    ShowCelestialPoles:      false,
    DarkBackground:          true,
    ShowLiveEphemeris:       true,

    InsideVault: false,

    ObserverFigure: 'bear',

    // Minutes east of UTC. -360 = CST.
    TimezoneOffsetMinutes: -360,
    StarfieldVaultHeight: 0.28,
    MoonVaultHeight:      0.346,
    SunVaultHeight:       0.346,
    MercuryVaultHeight:   0.346,
    VenusVaultHeight:     0.346,
    MarsVaultHeight:      0.346,
    JupiterVaultHeight:   0.346,
    SaturnVaultHeight:    0.346,
    UranusVaultHeight:    0.346,
    NeptuneVaultHeight:   0.346,

    ShowPlanets: true,

    // When true, starfield fades with sun elevation.
    DynamicStars: true,

    // 'none' | 'yggdrasil' | 'meru'
    Cosmology: 'none',

    // 'ae' | 'hellerick' | 'blank'. Affects only the map art; physics
    // always runs in the AE frame.
    MapProjection: 'ae',

    // 'random' | 'chart-dark' | 'chart-light' | 'celnav'
    StarfieldType: 'celnav',

    // 'heliocentric' | 'geocentric' | 'ptolemy' | 'astropixels' | 'vsop87'
    BodySource: 'astropixels',

    // StarTrepidation master forces all three on when true.
    StarApplyPrecession: false,
    StarApplyNutation:   false,
    StarApplyAberration: false,
    StarTrepidation:     true,

    // Eclipse demo state hooks. Registry sets these via intro().
    EclipseActive:     false,
    EclipseKind:       null,
    EclipseEventUTMS:  null,
    EclipsePipeline:   null,
    EclipseMinSepDeg:  null,
    EclipseMagnitude:  null,
    EclipseEventType:  null,
    EclipseSunRadiusFE:      null,
    EclipseMoonRadiusFE:     null,
    // Eclipse ground-shadow feature gate (disabled pending rework).
    ShowEclipseShadow:       false,
    // Deprecated circular-decal overrides, kept for URL back-compat.
    EclipseUmbraRadiusFE:    null,
    EclipsePenumbraRadiusFE: null,

    // Pins NightFactor = 1.0.
    PermanentNight: false,

    // Ids: 'sun' / 'moon' / planet name / 'star:<id>'. Empty = HUD collapsed.
    TrackerTargets: ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune'],

    ShowEphemerisReadings: false,

    // When true, only tracked bodies + their GPs render.
    SpecifiedTrackerMode: false,

    // When true, tracker GP dots/lines render for every tracked
    // target regardless of the master `ShowGroundPoints` toggle.
    TrackerGPOverride: false,

    Description: '',
    PointerFrom: [0, 0],
    PointerTo:   [0, 0],
    PointerText: '',

    // Degrees; set by mouseHandler, null in Heavenly / off-canvas.
    MouseElevation: null,
    MouseAzimuth:   null,
  };
}

export class FeModel extends EventTarget {
  constructor() {
    super();
    initTimeOrigin();

    this.state = defaultState();

    // Written by update(), read by renderer.
    this.computed = {
      TransMatSkyRot:            M.Unit(),
      TransMatCelestToGlobe:     M.Unit(),
      TransMatLocalFeToGlobalFe: M.Unit(),
      TransMatVaultToFe:         M.Unit(),

      SkyRotAngle:     0,
      SunCelestAngle:  0,
      MoonCelestAngle: 0,
      SunRA:  0, SunDec:  0,
      MoonRA: 0, MoonDec: 0,

      SunCelestCoord:        [0, 0, 0],
      SunCelestLatLong:      { lat: 0, lng: 0 },
      SunAnglesGlobe:        { azimuth: 0, elevation: 0 },
      SunVaultCoord:          [0, 0, 0],
      SunLocalGlobeCoord:    [0, 0, 0],
      SunOpticalVaultCoord:      [0, 0, 0],

      MoonCelestCoord:       [0, 0, 0],
      MoonNorthCelestCoord:  [0, 0, 0],
      MoonCelestLatLong:     { lat: 0, lng: 0 },
      MoonAnglesGlobe:       { azimuth: 0, elevation: 0 },
      MoonVaultCoord:         [0, 0, 0],
      MoonLocalGlobeCoord:   [0, 0, 0],
      MoonOpticalVaultCoord:     [0, 0, 0],

      MoonPhase:             0,   // 0=new, PI=full
      MoonPhaseFraction:     0,   // 0..1 illuminated fraction
      MoonRotation:          0,

      // 0 = day, 1 = full night
      NightFactor: 0,

      ObserverFeCoord: [0, 0, 0],

      OpticalVaultRadius: GEOMETRY.OpticalVaultRadiusFar,
      OpticalVaultHeight: GEOMETRY.OpticalVaultHeightFar,

      Planets: {},
    };

    this._dayOfYearLast = this.state.DayOfYear;
    this._timeLast = this.state.Time;
    this._dateTimeLast = this.state.DateTime;
  }

  setState(patch, emit = true) {
    Object.assign(this.state, patch);
    this.update();
    if (emit) this.dispatchEvent(new CustomEvent('update', { detail: this }));
  }

  resetDescription() {
    this.state.Description = '';
    this.state.PointerFrom = [0, 0];
    this.state.PointerTo   = [0, 0];
    this.state.PointerText = '';
  }

  update() {
    const s = this.state;
    const c = this.computed;

    // clamp
    s.ObserverLat  = Clamp(s.ObserverLat, -90, 90);
    s.ObserverElevation = Clamp(s.ObserverElevation, 0, 0.5);
    s.ObserverLong = ((s.ObserverLong + 180) % 360 + 360) % 360 - 180;
    s.CameraHeight = Clamp(s.CameraHeight, -30, 89.9);
    s.CameraDirection = ((s.CameraDirection + 180) % 360 + 360) % 360 - 180;
    s.ObserverHeading = ((s.ObserverHeading % 360) + 360) % 360;
    s.Zoom         = Clamp(s.Zoom, 0.1, 10);
    s.OpticalZoom  = Clamp(s.OpticalZoom, 0.2, 75);
    s.VaultSize     = Clamp(s.VaultSize, GEOMETRY.VaultSizeMin, GEOMETRY.VaultSizeMax);
    s.VaultHeight   = Clamp(s.VaultHeight, GEOMETRY.VaultHeightMin, GEOMETRY.VaultHeightMax);
    s.OpticalVaultSize   = Clamp(s.OpticalVaultSize,
                                 GEOMETRY.OpticalVaultSizeMin, GEOMETRY.OpticalVaultSizeMax);
    s.OpticalVaultHeight = Clamp(s.OpticalVaultHeight,
                                 GEOMETRY.OpticalVaultHeightMin, GEOMETRY.OpticalVaultHeightMax);
    s.RayParameter = Clamp(s.RayParameter, 0.5, 2.0);

    const camDistMin = GEOMETRY.CameraDistanceMinRel * s.VaultSize * FE_RADIUS;
    if (s.CameraDistance < camDistMin) s.CameraDistance = camDistMin;

    // date/time sync
    s.DayOfYear = Math.round(s.DayOfYear);
    if (s.DayOfYear !== this._dayOfYearLast || s.Time !== this._timeLast) {
      s.DateTime = s.DayOfYear + s.Time / 24;
    } else {
      s.DayOfYear = Math.floor(s.DateTime);
      s.Time = (s.DateTime - s.DayOfYear) * 24;
    }
    this._dateTimeLast = s.DateTime;
    this._dayOfYearLast = s.DayOfYear;
    this._timeLast = s.Time;

    const utcDate = dateTimeToDate(s.DateTime);
    const bodySource = s.BodySource || 'geocentric';
    const sunEq  = bodyRADec('sun',  utcDate, bodySource);
    const moonEq = bodyRADec('moon', utcDate, bodySource);
    const gmstDeg = greenwichSiderealDeg(utcDate);

    c.SkyRotAngle      = gmstDeg;
    c.TransMatSkyRot   = M.RotatingZ(ToRad(-c.SkyRotAngle));
    c.TransMatCelestToGlobe = compTransMatCelestToGlobe(
      s.ObserverLat, s.ObserverLong, c.SkyRotAngle,
    );
    c.TransMatVaultToFe = compTransMatVaultToFe(c.SkyRotAngle);
    c.ObserverFeCoord   = feLatLongToGlobalFeCoord(s.ObserverLat, s.ObserverLong, FE_RADIUS);
    c.TransMatLocalFeToGlobalFe = compTransMatLocalFeToGlobalFe(
      c.ObserverFeCoord, s.ObserverLong,
    );

    // --- sun ---
    c.SunRA = sunEq.ra; c.SunDec = sunEq.dec;
    c.SunCelestCoord   = equatorialToCelestCoord(sunEq);
    c.SunCelestLatLong = coordToLatLong(c.SunCelestCoord);
    c.SunCelestAngle   = c.SunCelestLatLong.lng;
    // Sun is master elevation reference. Moon scales by its dec-range
    // ratio; planets share SUN_RANGE.
    const HEADROOM = 0.06;
    const SUN_RANGE    = 0.20;
    const SUN_DEC_DEG  = 23.44;
    const MOON_DEC_DEG = 28.50;
    const sunDecNorm = 0.5 + 0.5 * Math.max(-1, Math.min(1,
      c.SunCelestLatLong.lat / SUN_DEC_DEG));
    const sunCeil = heavenlyVaultCeiling(
      c.SunCelestLatLong.lat, s.VaultSize, s.VaultHeight, FE_RADIUS,
    );
    s.SunVaultHeight = Math.min(
      sunCeil,
      s.StarfieldVaultHeight + HEADROOM + sunDecNorm * SUN_RANGE,
    );
    c.SunVaultCoord = vaultCoordToGlobalFeCoord(
      vaultCoordAt(c.SunCelestLatLong.lat, c.SunCelestLatLong.lng,
                   s.SunVaultHeight, FE_RADIUS),
      c.TransMatVaultToFe,
    );
    c.SunLocalGlobeCoord = celestCoordToLocalGlobeCoord(
      c.SunCelestCoord, c.TransMatCelestToGlobe,
    );
    c.SunAnglesGlobe     = localGlobeCoordToAngles(c.SunLocalGlobeCoord);
    c.SunOpticalVaultCoord   = localGlobeCoordToGlobalFeCoord(
      opticalVaultProject(c.SunLocalGlobeCoord, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
      c.TransMatLocalFeToGlobalFe,
    );

    // --- moon ---
    c.MoonRA = moonEq.ra; c.MoonDec = moonEq.dec;
    c.MoonCelestCoord    = equatorialToCelestCoord(moonEq);
    c.MoonCelestLatLong  = coordToLatLong(c.MoonCelestCoord);
    c.MoonCelestAngle    = c.MoonCelestLatLong.lng;
    c.MoonNorthCelestCoord = [0, 0, 1];
    const MOON_RANGE = SUN_RANGE * (MOON_DEC_DEG / SUN_DEC_DEG);
    const moonDecNorm = 0.5 + 0.5 * Math.max(-1, Math.min(1,
      c.MoonCelestLatLong.lat / MOON_DEC_DEG));
    const moonCeil = heavenlyVaultCeiling(
      c.MoonCelestLatLong.lat, s.VaultSize, s.VaultHeight, FE_RADIUS,
    );
    s.MoonVaultHeight = Math.min(
      moonCeil,
      s.StarfieldVaultHeight + HEADROOM + moonDecNorm * MOON_RANGE,
    );
    c.MoonVaultCoord = vaultCoordToGlobalFeCoord(
      vaultCoordAt(c.MoonCelestLatLong.lat, c.MoonCelestLatLong.lng,
                   s.MoonVaultHeight, FE_RADIUS),
      c.TransMatVaultToFe,
    );
    c.MoonLocalGlobeCoord = celestCoordToLocalGlobeCoord(
      c.MoonCelestCoord, c.TransMatCelestToGlobe,
    );
    c.MoonAnglesGlobe     = localGlobeCoordToAngles(c.MoonLocalGlobeCoord);
    c.MoonOpticalVaultCoord   = localGlobeCoordToGlobalFeCoord(
      opticalVaultProject(c.MoonLocalGlobeCoord, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
      c.TransMatLocalFeToGlobalFe,
    );

    // Moon phase (sun-at-infinity: moon→sun ≈ SunCelestCoord).
    const moonToGlobe = V.Norm(V.Scale(c.MoonCelestCoord, -1));
    const moonToSun   = V.Norm(V.Sub(c.SunCelestCoord, V.Scale(c.MoonCelestCoord, 0)));
    const shadowUp    = V.Norm(V.Mult(moonToSun, moonToGlobe));
    c.MoonPhase = Math.acos(Limit1(V.ScalarProd(moonToSun, moonToGlobe)));
    c.MoonPhaseFraction = 0.5 * (1 - Math.cos(c.MoonPhase));

    // Terminator rotation as seen from the observer.
    const globeToMoon = V.Scale(celestCoordToLocalGlobeCoord(
      V.Scale(moonToGlobe, -1), c.TransMatCelestToGlobe,
    ), 1);
    let camRight = V.Mult(globeToMoon, [1, 0, 0]);
    if (V.Length(camRight) === 0) {
      camRight = V.Mult(globeToMoon, [0, 1, 0]);
    }
    camRight = V.Norm(camRight);
    const camUp = V.Mult(camRight, globeToMoon);
    const moonShadowUpLocal = celestCoordToLocalGlobeCoord(shadowUp, c.TransMatCelestToGlobe);
    let rot = Math.acos(Limit1(V.ScalarProd(camUp, moonShadowUpLocal)));
    if (V.ScalarProd(moonShadowUpLocal, camRight) > 0) rot = -rot;
    c.MoonRotation = rot;

    // Optical vault dimensions. Cap height clamped under VaultHeight.
    // Inside Optical mode H := R (strict hemisphere, 1:1 elevation).
    // In Heavenly H := OpticalVaultHeight (flattened cap depiction).
    c.OpticalVaultRadius = s.OpticalVaultSize;
    c.OpticalVaultHeight = Math.min(s.OpticalVaultHeight, s.VaultHeight);
    c.OpticalVaultHeightEffective = s.InsideVault
      ? c.OpticalVaultRadius
      : c.OpticalVaultHeight;

    // Linear fade across civil twilight: 0 at sun elev ≥ 0°, 1 at ≤ -12°.
    if (s.PermanentNight) {
      c.NightFactor = 1;
    } else {
      const sunElev = c.SunAnglesGlobe.elevation;
      c.NightFactor = Limit01((-sunElev) / 12.0);
    }

    // Planets share sun's dec-range so they anchor at sun's z.
    const PLANET_BASELINE = {
      mercury: 0, venus: 0, mars: 0, jupiter: 0, saturn: 0,
      uranus:  0, neptune: 0,
    };
    const PLANET_RANGE_KEY = {
      mercury: 'MercuryVaultHeight', venus: 'VenusVaultHeight',
      mars: 'MarsVaultHeight', jupiter: 'JupiterVaultHeight',
      saturn: 'SaturnVaultHeight',
      uranus: 'UranusVaultHeight', neptune: 'NeptuneVaultHeight',
    };
    const PLANET_DEC_RANGE = SUN_RANGE;

    c.Planets = {};
    for (const name of PLANET_NAMES) {
      const eq = bodyRADec(name, utcDate, bodySource);
      // NaN = pipeline lacks this body; skip geometry + marker.
      if (!Number.isFinite(eq.ra) || !Number.isFinite(eq.dec)) continue;
      const celestCoord = equatorialToCelestCoord(eq);
      const ll = coordToLatLong(celestCoord);
      const decNorm = 0.5 + 0.5 * Math.max(-1, Math.min(1,
        eq.dec / Math.PI * 180 / SUN_DEC_DEG));
      const desired = s.StarfieldVaultHeight + HEADROOM
                    + PLANET_BASELINE[name]
                    + decNorm * PLANET_DEC_RANGE;
      const planetCeil = heavenlyVaultCeiling(ll.lat, s.VaultSize, s.VaultHeight, FE_RADIUS);
      const planetZ = Math.min(planetCeil, desired);
      s[PLANET_RANGE_KEY[name]] = planetZ;
      const vaultCoord = vaultCoordToGlobalFeCoord(
        vaultCoordAt(ll.lat, ll.lng, planetZ, FE_RADIUS),
        c.TransMatVaultToFe,
      );
      const localGlobe = celestCoordToLocalGlobeCoord(celestCoord, c.TransMatCelestToGlobe);
      const anglesGlobe = localGlobeCoordToAngles(localGlobe);
      const opticalVaultCoord = localGlobeCoordToGlobalFeCoord(
        opticalVaultProject(localGlobe, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
        c.TransMatLocalFeToGlobalFe,
      );
      c.Planets[name] = {
        ra: eq.ra, dec: eq.dec,
        celestCoord, celestLatLong: ll,
        vaultCoord, opticalVaultCoord,
        anglesGlobe,
      };
    }

    // Star projection. Trepidation master forces all three apparent-of-
    // date corrections; otherwise the three booleans apply independently.
    const starOpts = s.StarTrepidation
      ? { precession: true, nutation: true, aberration: true }
      : {
          precession: !!s.StarApplyPrecession,
          nutation:   !!s.StarApplyNutation,
          aberration: !!s.StarApplyAberration,
        };
    const STAR_VAULT_HEIGHT = s.StarfieldVaultHeight;
    const projectStar = (star) => {
      const raJ2000  = (star.raH / 24) * 2 * Math.PI;
      const decJ2000 = star.decD * Math.PI / 180;
      const apparent = apparentStarPosition(raJ2000, decJ2000, utcDate, starOpts);
      const ra  = apparent.ra;
      const dec = apparent.dec;
      const celestCoord   = equatorialToCelestCoord({ ra, dec });
      const celestLatLong = coordToLatLong(celestCoord);
      const vaultCoord    = vaultCoordToGlobalFeCoord(
        vaultCoordAt(celestLatLong.lat, celestLatLong.lng, STAR_VAULT_HEIGHT, FE_RADIUS),
        c.TransMatVaultToFe,
      );
      const localGlobe  = celestCoordToLocalGlobeCoord(celestCoord, c.TransMatCelestToGlobe);
      const anglesGlobe = localGlobeCoordToAngles(localGlobe);
      const opticalVaultCoord = localGlobeCoordToGlobalFeCoord(
        opticalVaultProject(localGlobe, c.OpticalVaultRadius, c.OpticalVaultHeightEffective),
        c.TransMatLocalFeToGlobalFe,
      );
      return {
        id:   star.id,
        name: star.name,
        mag:  star.mag,
        ra, dec,
        celestCoord, celestLatLong,
        vaultCoord, opticalVaultCoord,
        anglesGlobe,
      };
    };
    c.CelNavStars     = CEL_NAV_STARS.map(projectStar);
    c.CataloguedStars = CATALOGUED_STARS.map(projectStar);
    c.BlackHoles      = BLACK_HOLES.map(projectStar);
    c.Quasars         = QUASARS.map(projectStar);

    c.TrackerInfos = [];
    const targets = Array.isArray(s.TrackerTargets) ? s.TrackerTargets : [];
    const wrapLon = (x) => ((x + 180) % 360 + 360) % 360 - 180;

    for (const target of targets) {
      let info = null;

      if (target === 'sun') {
        const rGeo   = ephGeo.bodyGeocentric('sun', utcDate);
        const rHelio = ephHelio.bodyGeocentric('sun', utcDate);
        const rPtol  = ephPtol.bodyGeocentric('sun', utcDate);
        const rApix  = ephApix.bodyGeocentric('sun', utcDate);
        const rVsop  = ephVsop.bodyGeocentric('sun', utcDate);
        info = {
          target, name: 'Sun', category: 'luminary',
          azimuth: c.SunAnglesGlobe.azimuth,
          elevation: c.SunAnglesGlobe.elevation,
          helioReading:      { ra: rHelio.ra, dec: rHelio.dec },
          geoReading:        { ra: rGeo.ra,   dec: rGeo.dec   },
          ptolemyReading:    { ra: rPtol.ra,  dec: rPtol.dec  },
          astropixelsReading:{ ra: rApix.ra,  dec: rApix.dec  },
          vsop87Reading:     { ra: rVsop.ra,  dec: rVsop.dec  },
          gpLat: c.SunCelestLatLong.lat,
          gpLon: wrapLon(c.SunRA * 180 / Math.PI - c.SkyRotAngle),
          vaultCoord: c.SunVaultCoord,
        };
      } else if (target === 'moon') {
        const rGeo   = ephGeo.bodyGeocentric('moon', utcDate);
        const rHelio = ephHelio.bodyGeocentric('moon', utcDate);
        const rPtol  = ephPtol.bodyGeocentric('moon', utcDate);
        const rApix  = ephApix.bodyGeocentric('moon', utcDate);
        const rVsop  = ephVsop.bodyGeocentric('moon', utcDate);
        info = {
          target, name: 'Moon', category: 'luminary',
          azimuth: c.MoonAnglesGlobe.azimuth,
          elevation: c.MoonAnglesGlobe.elevation,
          helioReading:      { ra: rHelio.ra, dec: rHelio.dec },
          geoReading:        { ra: rGeo.ra,   dec: rGeo.dec   },
          ptolemyReading:    { ra: rPtol.ra,  dec: rPtol.dec  },
          astropixelsReading:{ ra: rApix.ra,  dec: rApix.dec  },
          vsop87Reading:     { ra: rVsop.ra,  dec: rVsop.dec  },
          gpLat: c.MoonCelestLatLong.lat,
          gpLon: wrapLon(c.MoonRA * 180 / Math.PI - c.SkyRotAngle),
          vaultCoord: c.MoonVaultCoord,
        };
      } else if (PLANET_NAMES.includes(target)) {
        const p = c.Planets[target];
        if (p) {
          const rGeo   = ephGeo.bodyGeocentric(target, utcDate);
          const rHelio = ephHelio.bodyGeocentric(target, utcDate);
          const rPtol  = ephPtol.bodyGeocentric(target, utcDate);
          const rApix  = ephApix.bodyGeocentric(target, utcDate);
          const rVsop  = ephVsop.bodyGeocentric(target, utcDate);
          const gpColor = PLANET_GP_COLORS[target] || TRACKED_GP_COLORS_PLANET_DEFAULT;
          info = {
            target,
            name: target[0].toUpperCase() + target.slice(1),
            category: 'planet',
            gpColor,
            azimuth: p.anglesGlobe.azimuth,
            elevation: p.anglesGlobe.elevation,
            helioReading:      { ra: rHelio.ra, dec: rHelio.dec },
            geoReading:        { ra: rGeo.ra,   dec: rGeo.dec   },
            ptolemyReading:    { ra: rPtol.ra,  dec: rPtol.dec  },
            astropixelsReading:{ ra: rApix.ra,  dec: rApix.dec  },
            vsop87Reading:     { ra: rVsop.ra,  dec: rVsop.dec  },
            gpLat: p.celestLatLong.lat,
            gpLon: wrapLon(p.ra * 180 / Math.PI - c.SkyRotAngle),
            vaultCoord: p.vaultCoord,
          };
        }
      } else if (target.startsWith('star:')) {
        const starId = target.slice(5);
        let entry = c.CelNavStars.find((x) => x.id === starId);
        let def   = celNavStarById(starId);
        let cat   = 'celnav';
        if (!entry) {
          entry = c.CataloguedStars.find((x) => x.id === starId);
          def   = cataloguedStarById(starId);
          if (entry) cat = 'catalogued';
        }
        if (!entry) {
          entry = c.BlackHoles.find((x) => x.id === starId);
          def   = blackHoleById(starId);
          if (entry) cat = 'blackhole';
        }
        if (!entry) {
          entry = c.Quasars.find((x) => x.id === starId);
          def   = quasarById(starId);
          if (entry) cat = 'quasar';
        }
        if (entry && def) {
          // Star RA/Dec is pipeline-independent; all five readings share it.
          const gpColorByCat = {
            celnav:     0xffe8a0,  // warm yellow
            catalogued: 0xffffff,  // white
            blackhole:  0x9966ff,  // purple
            quasar:     0x40e0d0,  // cyan
          };
          info = {
            target, name: def.name, category: 'star', mag: def.mag,
            gpColor: gpColorByCat[cat] || 0xffffff,
            azimuth: entry.anglesGlobe.azimuth,
            elevation: entry.anglesGlobe.elevation,
            helioReading:      { ra: entry.ra, dec: entry.dec },
            geoReading:        { ra: entry.ra, dec: entry.dec },
            ptolemyReading:    { ra: entry.ra, dec: entry.dec },
            astropixelsReading:{ ra: entry.ra, dec: entry.dec },
            vsop87Reading:     { ra: entry.ra, dec: entry.dec },
            gpLat: entry.celestLatLong.lat,
            gpLon: wrapLon(entry.ra * 180 / Math.PI - c.SkyRotAngle),
            vaultCoord: entry.vaultCoord,
          };
        }
      }

      if (info) {
        info.activeSource = bodySource;
        info.utcMs = utcDate.getTime();
        c.TrackerInfos.push(info);
      }
    }
  }
}
