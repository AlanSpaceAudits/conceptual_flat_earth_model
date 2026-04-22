// DateTime <-> sky-angle conversion.
// DateTime is expressed in days since 2017-01-01 00:00 UTC.
//
// Frame: earth is stationary. The celestial dome rotates once per sidereal
// period around the polar axis. SkyRotAngle is the dome's angular position
// in that rotation.

import { ToRange } from '../math/utils.js';
import { CELESTIAL, TIME_ORIGIN } from './constants.js';

// Angular position of the rotating sky (celestial dome) at the given date.
export function dateToSkyRotAngle(dateTime) {
  const angleDeg = 360 * (dateTime - CELESTIAL.SunAngleOffset) * 24 / CELESTIAL.SidericDay;
  return ToRange(angleDeg, 360);
}

export function dateToSunAngleCelest(dateTime) {
  return 360 * (dateTime - CELESTIAL.SunAngleOffset) / CELESTIAL.SunPeriod;
}

export function dateToMoonAngleCelest(dateTime) {
  return 360 * (dateTime - CELESTIAL.MoonAngleOffset) / CELESTIAL.MoonPeriod;
}

export function dateToMoonPrecessAngle(dateTime) {
  return 360 * (dateTime - CELESTIAL.MoonPrecessOffset) / CELESTIAL.MoonPrecessPeriod;
}

// Convert a scalar DateTime to a Date object in UTC.
export function dateTimeToDate(dateTime) {
  return new Date((TIME_ORIGIN.ZeroDate + dateTime) * TIME_ORIGIN.msPerDay);
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pad2 = (n) => String(Math.floor(n)).padStart(2, '0');

export function dateTimeToString(dateTime) {
  const d = dateTimeToDate(dateTime);
  return `${MONTHS[d.getUTCMonth()]} ${pad2(d.getUTCDate())} ${d.getUTCFullYear()} / ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC`;
}

// Parse "HH:MM" or "HH:MM:SS" into decimal hours. Returns null on failure.
export function parseTimeField(s) {
  const m = String(s).trim().match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!m) return null;
  const h = +m[1], mi = +m[2], se = +(m[3] ?? 0);
  if (h < 0 || h > 24 || mi < 0 || mi > 59 || se < 0 || se > 59) return null;
  return h + mi / 60 + se / 3600;
}

// Parse "YYYY-MM-DD" or "DD.MM.YYYY" into a DateTime (days since zero).
export function parseDateField(s) {
  const str = String(s).trim();
  let yyyy, mm, dd;
  let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) { [, yyyy, mm, dd] = m; }
  else if ((m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/))) { [, dd, mm, yyyy] = m; }
  else return null;
  const d = new Date(Date.UTC(+yyyy, +mm - 1, +dd));
  return d.getTime() / TIME_ORIGIN.msPerDay - TIME_ORIGIN.ZeroDate;
}
