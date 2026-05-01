# Units

This document defines every unit the model carries, the relationships
between them, and the bridge to SI. It exists so anyone reading the
spreadsheet, the source code, or the tracker readouts can resolve a
number to its provenance without guessing.

## Angular

| Unit | Definition | Modern equivalent |
|---|---|---|
| **du**  | 1/365.25 of a great circle | 360 / 365.25 ≈ 0.985626283° = 59.1376′ |
| **fen** (angular) | 1/10 du | ≈ 0.0985626° = 5.91376′ |

The angular `fen` is distinct from the length `fen` below — same
character, different unit.

## Distance — Tang short li (Yi Xing 8th-c. calibration)

| Unit | Definition |
|---|---|
| **li**  | 300 bu (Tang short li) |
| **bu**  | 1/300 li |

Calibration constant (load-bearing for every li↔angle conversion):

> **351.267 li per du of polar-altitude difference**
> = 105,380 bu/du
> from Xin Tangshu, Yi Xing's meridian survey

This is a *surveyed* number, not an algebraic derivation.

## Length / shadow — Zhoubi gnomon work

| Unit | Definition | Modern equivalent (Zhou–Han biao standard) |
|---|---|---|
| **zhang** | 10 chi   | ≈ 2.45 m |
| **chi**   | 10 cun   | ≈ 0.245 m |
| **cun**   | 10 fen (length) | ≈ 0.0245 m = 24.5 mm |
| **fen** (length) | 1/10 cun | ≈ 2.45 mm |

The length-`fen` is the gnomon-work subdivision (shadow length, ruler
ticks). It is **not** the angular `fen` above.

## Sphere primitive (internal Tang system)

Everything in the spherical model derives from the calibration constant
plus the angular convention.

| Quantity | Derivation | Value |
|---|---|---|
| Great circle | 351.267 li/du × 365.25 du | **128,300 li** |
| Sphere radius | 128,300 / (2π) | **20,419.45 li** |
| Sphere diameter | 2 × 20,419.45 | **40,838.9 li** |

## Geometric equivalence (FE ↔ Globe)

The flat-disc + dome model and the spherical model produce identical
observed elevations when the following parameter map holds:

| Flat / Planar | = | Globe / Spherical |
|---|---|---|
| Plane diameter | = | Sphere circumference = 128,300 li |
| Plane radius | = | π × R = 64,150 li |
| Dome height | = | Sphere radius = 20,419.45 li |

Proof chain (see `distances` sheet, rows 16–52):
- Dome profile: h(z) = R · z · cot(z)
- Globe arc: arc = R · z
- atan(H/D) = atan(cot(z)) = π/2 − z = ε_globe ∴ identical elevation

## SI bridge (post-hoc)

Same logic as inch ↔ cm: the ratio of the two systems' reported
circumferences IS the conversion. Both systems measured the same
physical Earth; their reported circumferences differ because their
length units differ.

| Bridge | Formula | km / li |
|---|---|---|
| **Geodetic (primary)** | WGS84 polar 40,007.863 km / Tang 128,300 li | **0.31183** |
| Equatorial-anchored | 40,075 km / 128,300 li | 0.31236 |
| Chi-ruler (archaeological) | 1800 chi × ≈ 0.30 m | ≈ 0.54 |
| Legacy (uncertain origin) | — | 0.347 |

Any single bridge picks an Earth-radius anchor (polar, equatorial, mean,
ruler-derived). The **disagreement between bridges is a real
falsification signal** — at least one source measurement is off.
Spreadsheet exposes all four side-by-side rather than picking a winner.

Verification round-trip with the geodetic bridge:

| Tang (li) | × 0.31183 | km | matches |
|---|---|---|---|
| 128,300 | | 40,007.9 | WGS84 polar circumference |
| 20,419.45 | | 6,367 | mean Earth radius (within 0.06 % of 6,371 km) |
| 40,838.9 | | 12,734 | 2 × R_mean (within 0.06 %) |

The 0.06 % residual is the polar-vs-mean-radius mismatch, not a unit
error.

## Computing in Tang li (haversine, dot product, Euclidean)

Every formula on the `distances` tab works unchanged with the Tang
sphere primitive. Substitute `R_li = 20,419.45` for `e_radius` and
every output is in li.

### Haversine

```
a = sin²((φ₂ − φ₁) / 2)
  + cos(φ₁) · cos(φ₂) · sin²((λ₂ − λ₁) / 2)

distance_li = 2 · R_li · asin(√a)
            = 40,838.9 · asin(√a)
```

### Radial vector dot product (great-circle, alternate form)

```
distance_li = R_li · acos(
  sin(φ₁)·sin(φ₂) + cos(φ₁)·cos(φ₂)·cos(λ₂ − λ₁)
)
```

Both give the same result (modulo floating-point), in li.

### Euclidean unit-sphere coordinates

Unit-sphere components (dimensionless, identical in any unit system):

```
x = cos(lat) · cos(lon)
y = cos(lat) · sin(lon)
z = sin(lat)
```

Scale to position vectors in li by multiplying by R_li:

```
P_li = R_li · (x, y, z)
```

Chord length between two surface points:

```
|AB|_li = R_li · √((x₂−x₁)² + (y₂−y₁)² + (z₂−z₁)²)
```

### Triangle interior angles (sum, excess)

Spherical and Euclidean interior-angle sums are scale-invariant —
they're functions of unit-sphere positions only. Same numerical result
whether you work in km or li:

- Sum of Euclidean triangle angles = 180° always (proves
  `Euclidean Excess = 0`).
- Spherical excess = (A + B + C) − 180° equals the area enclosed on
  the unit sphere, again scale-free.

**Conclusion**: switching the model's working unit from km to li
changes only the *labels* on distance outputs. Every angular
relationship — including the model's geometric-equivalence proof,
the Euclidean dot-product triangle, and the spherical excess check —
is identically valid in both unit systems.

## Conversion summary (cheat sheet)

| Convert | Multiply by |
|---|---|
| degrees → du | 365.25 / 360 ≈ 1.014583 |
| du → degrees | 360 / 365.25 ≈ 0.985626 |
| du → fen | 10 |
| li → bu | 300 |
| li → km (geodetic bridge) | 0.31183 |
| km → li (geodetic bridge) | 1 / 0.31183 ≈ 3.20687 |
| du of polar altitude → li (along meridian) | 351.267 |
| chi → m | 0.245 |
