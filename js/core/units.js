// Chinese astronomical units (du / fen / li / bu).
//
// The Tang-era empirical calibration from the Xin Tangshu (Yi Xing,
// 8th c. CE) ties an angular du (1/365.25 of the celestial circle)
// to a ground distance of 351 li 80 bu of north-south travel along
// a meridian. That's the cleaner working ratio — the older Zhoubi
// "1 cun shadow per 1000 li" rule produces a wildly varying angular
// yield depending on the solar term and was effectively replaced by
// Yi Xing's du-based formula.
//
// References: `~/Documents/multi_2/Notes/Chinese_FE.md`,
// "Doc 9: Baidu Baike — Yixing entry" (line 449+).

export const DEG_PER_DU = 360 / 365.25;          // ≈ 0.985626283…
export const DU_PER_DEG = 365.25 / 360;          // ≈ 1.014583
export const FEN_PER_DU = 10;
export const LI_PER_DU  = 351.267;               // 351 li 80 bu, Yi Xing
export const BU_PER_LI  = 300;

// Convert degrees → du.
export function degToDu(deg) {
  return deg * DU_PER_DEG;
}

// "23 du 7.8 fen" — DMS-style two-part split, sign-prefixed when
// the input is negative. Mirrors the look of `fmtSignedDms` so the
// two readouts can sit side by side without one looking out of
// place.
export function fmtDuFen(deg, signed = false) {
  if (!Number.isFinite(deg)) return '—';
  const totalDu = deg * DU_PER_DEG;
  const sign = totalDu < 0 ? '−' : (signed ? '+' : '');
  const abs  = Math.abs(totalDu);
  const du   = Math.floor(abs);
  const fen  = (abs - du) * FEN_PER_DU;
  return `${sign}${du} du ${fen.toFixed(1)} fen`;
}

// "1861 li 214 bu" — DMS-style two-part split for a *distance*
// derived from an angular separation along a meridian, using Yi
// Xing's 351.267 li/du calibration. Always unsigned (distance is
// magnitude only).
export function fmtLiBu(deg) {
  if (!Number.isFinite(deg)) return '—';
  const totalDu = Math.abs(deg) * DU_PER_DEG;
  const totalLi = totalDu * LI_PER_DU;
  const li = Math.floor(totalLi);
  const bu = Math.round((totalLi - li) * BU_PER_LI);
  return `${li} li ${bu} bu`;
}
