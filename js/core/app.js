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
  planetEquatorial, PLANET_NAMES,
} from './ephemeris.js';
import {
  compTransMatCelestToGlobe, compTransMatLocalFeToGlobalFe, compTransMatVaultToFe,
  celestCoordToLocalGlobeCoord, coordToLatLong, localGlobeCoordToAngles,
  localGlobeCoordToGlobalFeCoord, vaultCoordToGlobalFeCoord,
} from './transforms.js';
import {
  feLatLongToGlobalFeCoord, celestLatLongToVaultCoord, vaultCoordAt,
} from './feGeometry.js';

// Project a local-globe direction (x=zenith, y=east, z=north) onto the
// observer's optical vault, an oblate cap with horizontal radius R and
// vertical height H (H < R). Used for sun, moon, planets, and stars so
// they all sit on the same flattened-dome surface.
function opticalVaultProject(localGlobe, R, H) {
  return [localGlobe[0] * H, localGlobe[1] * R, localGlobe[2] * R];
}

// Maximum z under the heavenly vault shell at a body's AE projection.
// The shell is a scaled hemisphere with horizontal radius (domeSize·feR)
// and vertical VaultHeight, so:
//   (x/domeR)² + (y/domeR)² + (z/domeH)² ≤ 1
// Since AE radius for a body at declination dec is r = (90-dec)/180·feR,
// this becomes z ≤ domeH · √(1 − (r/domeR)²). Used to prevent bodies from
// piercing the dome *surface* (not just its apex) when the starfield gets
// scaled up and their altitude rises with it.
function heavenlyVaultCeiling(latDeg, domeSize, domeHeight, feRadius) {
  const r = feRadius * (90 - latDeg) / 180;
  const domeR = domeSize * feRadius;
  const rhoSq = (r * r) / (domeR * domeR);
  if (rhoSq >= 1) return 0;
  return domeHeight * Math.sqrt(1 - rhoSq);
}

// Default state. Distances all in FE_RADIUS units.
function defaultState() {
  return {
    // observer / camera
    ObserverLat:   0.0,
    ObserverLong: 15.0,
    // Compass heading of the observer's facing in their optical vault.
    // 0 = North, 90 = East, 180 = South, 270 = West. Drives the cardinal
    // arrow and the convergence/divergence read of the projected starfield.
    ObserverHeading: 0,
    CameraDirection: 30.0,
    CameraHeight:    25.0,
    CameraDistance:  GEOMETRY.CameraDistanceDefault,
    Zoom:             1.4,

    // time — defaults to 2017-08-21 22:41 UTC (total solar eclipse reference).
    DateTime:    232.9454, // days since 2017-01-01
    DayOfYear:   232,
    Time:        22.69,    // decimal hours

    // geometry
    VaultSize:   GEOMETRY.VaultSizeDefault,
    VaultHeight: GEOMETRY.VaultHeightDefault,

    // Observer's optical vault — the flattened cap onto which sun/moon/
    // stars/planets project. Defaults to the NP→EQ radius (0.5) and a
    // shallow cap height (0.35). Now adjustable so users can inflate or
    // squash the dome to see how projected arcs change.
    OpticalVaultSize:   GEOMETRY.OpticalVaultRadiusFar,
    OpticalVaultHeight: GEOMETRY.OpticalVaultHeightFar,

    // ray curve shape
    RayParameter: 1.0,
    RayTarget:    0,  // 0 observer, 1 flat earth
    RaySource:    0,  // 0 sun, 1 moon, 2 star

    // visibility toggles
    ShowFeGrid:     true,
    ShowShadow:     true,
    ShowVault:      true,
    ShowVaultGrid:   false,
    // True-source positions on the heavenly vault (sun/moon/planet dots
    // and halos). When off, only the projected optical-vault markers
    // remain — the observer sees their hemisphere of vision without the
    // underlying "real" sources above it.
    ShowTruePositions: true,
    ShowSunTrack:   false,
    ShowMoonTrack:  false,
    ShowOpticalVault:     true,
    ShowStars:      true,
    ShowVaultRays:   true,
    ShowOpticalVaultRays: true,
    ShowManyRays:   false,
    ShowLatitudeLines: true,
    ShowGroundPoints:  true,
    ShowFacingVector:  false,
    ShowDecCircles:    true,
    ShowLogo:          true,
    ShowConstellations:      true,
    ShowConstellationLines:  true,

    // First-person camera mode: place the camera at the observer's position
    // looking along their heading, and hide everything a real observer in
    // the FE model would *not* see — the true-source vault of heavens, the
    // dome starfield, the domeDot on sun/moon/planets, ground points. Only
    // what's projected onto the optical vault remains visible.
    InsideVault: false,

    // observer figure: 'male' | 'female' | 'astronaut' | 'child' | 'none'
    ObserverFigure: 'male',

    // Timezone offset applied to the calendar inputs, in minutes east of UTC
    // (e.g. -300 = UTC-5 / EST). DateTime itself remains in UTC; this is
    // purely a display / input affordance.
    TimezoneOffsetMinutes: 0,

    // Per-body vault heights (dimensionless, ratio of FE_RADIUS). Each
    // celestial body's vault is a spherical cap whose BASE sits on the
    // starfield floor and whose APEX is the value below. Heights spread
    // out so the layers read clearly from below: moon lowest above the
    // floor, sun next, then planets climbing into the upper dome.
    // Starfield raised well above the observer's optical vault so it sits
    // clearly overhead. Body apexes bumped to keep room above the floor
    // for the seasonal elevation swing on the sun/moon vaults.
    StarfieldVaultHeight: 0.28,
    MoonVaultHeight:      0.40,
    SunVaultHeight:       0.50,
    MercuryVaultHeight:   0.55,
    VenusVaultHeight:     0.58,
    MarsVaultHeight:      0.61,
    JupiterVaultHeight:   0.64,
    SaturnVaultHeight:    0.67,

    ShowPlanets: true,

    // If true, the starfield fades with the sun's elevation (day/night
    // cycle). If false, stars are visible at full brightness all the time
    // regardless of the sun — useful for inspecting the disk structure.
    DynamicStars: true,

    // Mythic axis-mundi feature at the disc centre (which is the geographic
    // north pole in this model). 'none' | 'yggdrasil' | 'meru'.
    Cosmology: 'none',

    // Visual map projection used for land + graticule + latitude circles
    // only. 'ae' preserves the model's native azimuthal-equidistant layout;
    // 'hellerick' swaps in a Lambert equal-area polar aspect for the
    // Hellerick boreal look. All physics / ray / vault math still runs in
    // the AE frame.
    MapProjection: 'ae',

    // description / pointer
    Description: '',
    PointerFrom: [0, 0],
    PointerTo:   [0, 0],
    PointerText: '',
  };
}

export class FeModel extends EventTarget {
  constructor() {
    super();
    initTimeOrigin();

    // Mutable primary state.
    this.state = defaultState();

    // Computed state (written by update(), read by renderer).
    this.computed = {
      // transforms
      TransMatSkyRot:            M.Unit(),
      TransMatCelestToGlobe:     M.Unit(),
      TransMatLocalFeToGlobalFe: M.Unit(),
      TransMatVaultToFe:         M.Unit(),

      // angles
      SkyRotAngle:     0,
      SunCelestAngle:  0,
      MoonCelestAngle: 0,
      // Real-sky equatorial coordinates (radians), straight from ephemeris.
      SunRA:  0, SunDec:  0,
      MoonRA: 0, MoonDec: 0,

      // sun/moon
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

      // moon phase shading
      MoonPhase:             0,   // 0=new, PI=full
      MoonPhaseFraction:     0,   // 0..1, illuminated fraction
      MoonRotation:          0,   // terminator orientation as seen from observer

      // 0 = full day, 1 = full night (civil twilight). Used to fade stars
      // and to smoothly attenuate the optical-vault orbs near the horizon.
      NightFactor: 0,

      // observer disc coord
      ObserverFeCoord: [0, 0, 0],

      // Horizontal radius and vertical height of the observer's optical
      // vault. The vault is a flattened cap (oblate), so projections need
      // separate horizontal/vertical scaling — see opticalVaultProject().
      OpticalVaultRadius: GEOMETRY.OpticalVaultRadiusFar,
      OpticalVaultHeight: GEOMETRY.OpticalVaultHeightFar,

      // Per-planet computed data, keyed by planet name. Each value has the
      // shape { ra, dec, celestCoord, vaultCoord, opticalVaultCoord,
      // anglesGlobe: { azimuth, elevation } }. Populated each frame.
      Planets: {},
    };

    // Track previous day/time so UI can edit them independently of DateTime.
    this._dayOfYearLast = this.state.DayOfYear;
    this._timeLast = this.state.Time;
    this._dateTimeLast = this.state.DateTime;
  }

  // Shallow merge + clamp + recompute. `emit=false` lets a caller batch.
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

  // Clamp inputs, then recompute every derived quantity.
  update() {
    const s = this.state;
    const c = this.computed;

    // --- clamp --------------------------------------------------------
    s.ObserverLat  = Clamp(s.ObserverLat, -90, 90);
    s.ObserverLong = ((s.ObserverLong + 180) % 360 + 360) % 360 - 180;
    s.CameraHeight = Clamp(s.CameraHeight, -30, 89.9);
    s.CameraDirection = ((s.CameraDirection + 180) % 360 + 360) % 360 - 180;
    s.ObserverHeading = ((s.ObserverHeading % 360) + 360) % 360;
    s.Zoom         = Clamp(s.Zoom, 0.1, 100);
    s.VaultSize     = Clamp(s.VaultSize, GEOMETRY.VaultSizeMin, GEOMETRY.VaultSizeMax);
    s.VaultHeight   = Clamp(s.VaultHeight, GEOMETRY.VaultHeightMin, GEOMETRY.VaultHeightMax);
    s.OpticalVaultSize   = Clamp(s.OpticalVaultSize,
                                 GEOMETRY.OpticalVaultSizeMin, GEOMETRY.OpticalVaultSizeMax);
    s.OpticalVaultHeight = Clamp(s.OpticalVaultHeight,
                                 GEOMETRY.OpticalVaultHeightMin, GEOMETRY.OpticalVaultHeightMax);
    s.RayParameter = Clamp(s.RayParameter, 0.5, 2.0);

    const camDistMin = GEOMETRY.CameraDistanceMinRel * s.VaultSize * FE_RADIUS;
    if (s.CameraDistance < camDistMin) s.CameraDistance = camDistMin;

    // --- date/time sync ----------------------------------------------
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

    // --- transforms and celestial positions --------------------------
    //
    // Real-sky ephemeris: sun, moon and sidereal time are computed from the
    // actual UTC date corresponding to `DateTime`. Sun is Meeus Ch. 25 low-
    // precision (~0.01° / century), moon is simplified Meeus Ch. 47 (~0.5°
    // longitude), GMST is the IAU 1982 formula. Their cycles are therefore
    // driven by independent real periods (1 solar year, 1 sidereal month,
    // 1 sidereal day, plus precession + lunar node regression baked in).
    const utcDate = dateTimeToDate(s.DateTime);
    const sunEq  = sunEquatorial(utcDate);
    const moonEq = moonEquatorial(utcDate);
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

    // --- sun ---------------------------------------------------------
    c.SunRA = sunEq.ra; c.SunDec = sunEq.dec;
    c.SunCelestCoord   = equatorialToCelestCoord(sunEq);
    c.SunCelestLatLong = coordToLatLong(c.SunCelestCoord);
    c.SunCelestAngle   = c.SunCelestLatLong.lng;
    // Sun vault altitude is dynamic and re-derived each frame from the
    // current declination + the user-set starfield height. The sun never
    // sits below the starfield (HEADROOM gap) and rises with declination
    // toward Cancer (north solstice → max altitude). Writing back into
    // `s.SunVaultHeight` makes the slider in the panel a live readout of
    // the body's current height.
    const HEADROOM = 0.06;
    const SUN_RANGE  = 0.20;
    const sunDecNorm = 0.5 + 0.5 * Math.max(-1, Math.min(1,
      c.SunCelestLatLong.lat / 23.44));
    // Cap at the dome's ellipsoidal surface at the sun's AE projection
    // radius — not just the apex — so scaling the starfield up can't push
    // the sun through the heavenly vault at any point on its circle.
    const sunCeil = heavenlyVaultCeiling(
      c.SunCelestLatLong.lat, s.VaultSize, s.VaultHeight, FE_RADIUS,
    );
    s.SunVaultHeight = Math.min(
      sunCeil,
      s.StarfieldVaultHeight + HEADROOM + sunDecNorm * SUN_RANGE,
    );
    // Dome coord rotated by -SkyRotAngle (TransMatVaultToFe) so the sun
    // sweeps across the dome once per day rather than freezing at one
    // celestial longitude. Position uses vaultCoordAt so altitude is the
    // dynamic dec-driven value, independent of where the sun is on its
    // daily circle.
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
      opticalVaultProject(c.SunLocalGlobeCoord, c.OpticalVaultRadius, c.OpticalVaultHeight),
      c.TransMatLocalFeToGlobalFe,
    );

    // --- moon --------------------------------------------------------
    c.MoonRA = moonEq.ra; c.MoonDec = moonEq.dec;
    c.MoonCelestCoord    = equatorialToCelestCoord(moonEq);
    c.MoonCelestLatLong  = coordToLatLong(c.MoonCelestCoord);
    c.MoonCelestAngle    = c.MoonCelestLatLong.lng;
    // Moon's own north pole direction: approximate as celestial +z (lunar
    // axis is tilted only 1.54° to the ecliptic pole). Good enough for the
    // phase-terminator rotation visual.
    c.MoonNorthCelestCoord = [0, 0, 1];
    // Moon vault altitude is dynamic too. Band is 28.50° to cover the moon's
    // ±5° excursion outside the tropics on top of the 23.44° solar band.
    const MOON_RANGE = 0.18;
    const moonDecNorm = 0.5 + 0.5 * Math.max(-1, Math.min(1,
      c.MoonCelestLatLong.lat / 28.50));
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
      opticalVaultProject(c.MoonLocalGlobeCoord, c.OpticalVaultRadius, c.OpticalVaultHeight),
      c.TransMatLocalFeToGlobalFe,
    );

    // --- moon phase (sun-at-infinity approximation) ------------------
    // In the original, sun and moon positions were scaled by DistSun / DistMoon
    // before subtraction. DistSun/DistMoon ~= 390, so the moon->sun vector is
    // (SunCelestCoord - MoonCelestCoord*DistMoon/DistSun) ~= SunCelestCoord.
    // We drop the distance scale entirely: moon->sun = SunCelestCoord.
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

    // --- optical vault dimensions ------------------------------------
    // Horizontal radius and vertical height come straight from state so
    // the user can inflate or squash the cap. Height is clamped under the
    // heavenly VaultHeight so the optical cap can't pierce the dome.
    c.OpticalVaultRadius = s.OpticalVaultSize;
    c.OpticalVaultHeight = Math.min(s.OpticalVaultHeight, s.VaultHeight);

    // --- night factor ------------------------------------------------
    // Linear ramp across the full civil twilight band:
    //   sun elev ≥  0°  -> 0  (daylight, stars washed out)
    //   sun elev = -6°  -> 0.5 (civil twilight, stars emerging)
    //   sun elev ≤ -12° -> 1  (nautical twilight and beyond, full dark)
    // Used by the star fade and by the optical-vault orb dimming.
    const sunElev = c.SunAnglesGlobe.elevation;
    c.NightFactor = Limit01((-sunElev) / 12.0);

    // --- planets -----------------------------------------------------
    // Planet altitudes are dynamic each frame, mirroring how the sun and
    // moon vault heights are derived. Each planet is stacked above the
    // highest of the sun/moon by a per-body baseline offset (preserves
    // the Mercury < Venus < Mars < Jupiter < Saturn order), then climbs a
    // small range with its own declination, and finally caps at
    // VaultHeight so it can never pierce the heavenly dome.
    const PLANET_BASELINE = {
      mercury: 0.04, venus: 0.06, mars: 0.09, jupiter: 0.12, saturn: 0.15,
    };
    const PLANET_RANGE_KEY = {
      mercury: 'MercuryVaultHeight', venus: 'VenusVaultHeight',
      mars: 'MarsVaultHeight', jupiter: 'JupiterVaultHeight',
      saturn: 'SaturnVaultHeight',
    };
    const PLANET_DEC_RANGE = 0.08;
    const planetFloor = Math.max(s.SunVaultHeight, s.MoonVaultHeight);

    c.Planets = {};
    for (const name of PLANET_NAMES) {
      const eq = planetEquatorial(name, utcDate);
      const celestCoord = equatorialToCelestCoord(eq);
      const ll = coordToLatLong(celestCoord);
      const decNorm = 0.5 + 0.5 * Math.max(-1, Math.min(1,
        eq.dec / Math.PI * 180 / 30));
      const desired = planetFloor + PLANET_BASELINE[name] + decNorm * PLANET_DEC_RANGE;
      // Cap at the dome's ellipsoidal ceiling at the planet's AE radius so
      // it never pierces the heavenly vault surface either.
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
        opticalVaultProject(localGlobe, c.OpticalVaultRadius, c.OpticalVaultHeight),
        c.TransMatLocalFeToGlobalFe,
      );
      c.Planets[name] = {
        ra: eq.ra, dec: eq.dec,
        celestCoord, celestLatLong: ll,
        vaultCoord, opticalVaultCoord,
        anglesGlobe,
      };
    }
  }
}
