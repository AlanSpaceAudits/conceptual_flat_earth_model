// The 28 lunar mansions (xiu 宿) and their determinative stars (ju xing 距星).
//
// In the Chinese (Yi Xing / Dayan) equatorial system a body's east-west
// position is `ru xiu du` (入宿度): the angular distance, in du, eastward
// from the determinative star that marks the western boundary of the
// mansion the body currently sits in. The 28 determinative stars form an
// uneven ruler around the celestial equator; each mansion's width is the
// gap to the next determinative star.
//
// This table is the fixed reference frame the canonical Tang store is
// built on. RA values are the J2000 right ascensions of each
// determinative star, in degrees, used as the western edge of that
// mansion. `xiuWidthDu` falls out as the forward gap to the next edge.
//
// Order is the traditional sequence starting at Jiao (角), running
// eastward through the four palaces (East / North / West / South).
//
// NOTE: the raJ2000Deg column is marked for source verification against a
// J2000 catalogue (HYG / SIMBAD) during the build; the frame round-trip
// is lossless for whatever boundary values this table holds, but the
// physical xiu assignment is only correct once these are confirmed.
//
// References: He & Zhao (2024), "Determining the observation epochs of
// star catalogs from ancient China"; `~/Documents/multi_2/Notes/Chinese_FE.md`.

// palace: 'east' (Azure Dragon) | 'north' (Black Tortoise)
//       | 'west' (White Tiger)  | 'south' (Vermilion Bird)
export const XIU = [
  // East — Azure Dragon
  { idx: 0,  name: 'Jiao',  hanzi: '角', palace: 'east',  star: 'alpha Vir (Spica)',   raJ2000Deg: 201.298 },
  { idx: 1,  name: 'Kang',  hanzi: '亢', palace: 'east',  star: 'kappa Vir',           raJ2000Deg: 213.224 },
  { idx: 2,  name: 'Di',    hanzi: '氐', palace: 'east',  star: 'alpha2 Lib',          raJ2000Deg: 222.720 },
  { idx: 3,  name: 'Fang',  hanzi: '房', palace: 'east',  star: 'pi Sco',              raJ2000Deg: 239.713 },
  { idx: 4,  name: 'Xin',   hanzi: '心', palace: 'east',  star: 'sigma Sco',           raJ2000Deg: 245.297 },
  { idx: 5,  name: 'Wei',   hanzi: '尾', palace: 'east',  star: 'mu1 Sco',             raJ2000Deg: 252.968 },
  { idx: 6,  name: 'Ji',    hanzi: '箕', palace: 'east',  star: 'gamma2 Sgr',          raJ2000Deg: 271.452 },
  // North — Black Tortoise
  { idx: 7,  name: 'Dou',   hanzi: '斗', palace: 'north', star: 'phi Sgr',             raJ2000Deg: 281.414 },
  { idx: 8,  name: 'Niu',   hanzi: '牛', palace: 'north', star: 'beta Cap (Dabih)',    raJ2000Deg: 305.253 },
  { idx: 9,  name: 'Nu',    hanzi: '女', palace: 'north', star: 'epsilon Aqr',         raJ2000Deg: 311.918 },
  { idx: 10, name: 'Xu',    hanzi: '虛', palace: 'north', star: 'beta Aqr',            raJ2000Deg: 322.890 },
  { idx: 11, name: 'Wei',   hanzi: '危', palace: 'north', star: 'alpha Aqr',           raJ2000Deg: 331.446 },
  { idx: 12, name: 'Shi',   hanzi: '室', palace: 'north', star: 'alpha Peg (Markab)',  raJ2000Deg: 346.190 },
  { idx: 13, name: 'Bi',    hanzi: '壁', palace: 'north', star: 'gamma Peg (Algenib)', raJ2000Deg: 3.309 },
  // West — White Tiger
  { idx: 14, name: 'Kui',   hanzi: '奎', palace: 'west',  star: 'eta And',             raJ2000Deg: 14.302 },
  { idx: 15, name: 'Lou',   hanzi: '婁', palace: 'west',  star: 'beta Ari (Sheratan)', raJ2000Deg: 28.660 },
  { idx: 16, name: 'Wei',   hanzi: '胃', palace: 'west',  star: '35 Ari',              raJ2000Deg: 40.863 },
  { idx: 17, name: 'Mao',   hanzi: '昴', palace: 'west',  star: '17 Tau (Electra)',    raJ2000Deg: 56.219 },
  { idx: 18, name: 'Bi',    hanzi: '畢', palace: 'west',  star: 'epsilon Tau (Ain)',   raJ2000Deg: 67.154 },
  { idx: 19, name: 'Zui',   hanzi: '觜', palace: 'west',  star: 'lambda Ori (Meissa)', raJ2000Deg: 83.784 },
  { idx: 20, name: 'Shen',  hanzi: '參', palace: 'west',  star: 'zeta Ori (Alnitak)',  raJ2000Deg: 85.190 },
  // South — Vermilion Bird
  { idx: 21, name: 'Jing',  hanzi: '井', palace: 'south', star: 'mu Gem',              raJ2000Deg: 95.740 },
  { idx: 22, name: 'Gui',   hanzi: '鬼', palace: 'south', star: 'theta Cnc',           raJ2000Deg: 127.899 },
  { idx: 23, name: 'Liu',   hanzi: '柳', palace: 'south', star: 'delta Hya',           raJ2000Deg: 129.414 },
  { idx: 24, name: 'Xing',  hanzi: '星', palace: 'south', star: 'alpha Hya (Alphard)', raJ2000Deg: 141.897 },
  { idx: 25, name: 'Zhang', hanzi: '張', palace: 'south', star: 'upsilon1 Hya',        raJ2000Deg: 147.869 },
  { idx: 26, name: 'Yi',    hanzi: '翼', palace: 'south', star: 'alpha Crt (Alkes)',   raJ2000Deg: 164.944 },
  { idx: 27, name: 'Zhen',  hanzi: '軫', palace: 'south', star: 'gamma Crv (Gienah)',  raJ2000Deg: 183.952 },
];

const norm360 = (x) => ((x % 360) + 360) % 360;

// Western-edge RA of every mansion, in J2000 degrees, in traditional order.
export const XIU_EDGE_DEG = XIU.map((m) => m.raJ2000Deg);

// Forward width of each mansion in degrees (gap to the next edge, cyclic).
export const XIU_WIDTH_DEG = XIU.map((m, i) => {
  const next = XIU[(i + 1) % XIU.length].raJ2000Deg;
  return norm360(next - m.raJ2000Deg);
});

// Which mansion contains a given RA (degrees)? Returns the XIU index whose
// [edge, edge+width) arc contains `raDeg`. The ruler is closed and covers
// the full circle, so every RA lands in exactly one mansion.
export function xiuOfRa(raDeg) {
  const ra = norm360(raDeg);
  for (let i = 0; i < XIU.length; i++) {
    const start = XIU[i].raJ2000Deg;
    const off = norm360(ra - start);
    if (off < XIU_WIDTH_DEG[i]) return i;
  }
  // Numerically unreachable (widths sum to 360); fall back to last mansion.
  return XIU.length - 1;
}
