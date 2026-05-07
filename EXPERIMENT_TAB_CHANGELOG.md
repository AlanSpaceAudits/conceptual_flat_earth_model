# Experiment Tab Changelog

## 2026-05-01 - Experiment Tab PR Update

This update introduces the Experiment tab and the first polished set of interactive demos. Everything under `js/experiments/` is new in this branch.

## Added

- Added a new bottom-bar `Experiments` tab.
- Added `ExperimentManager` for lazy loading, activation, deactivation, panel rendering, and per-frame experiment updates.
- Added `BaseExperiment` for shared scene/lifecycle behavior.
- Added experiment registry metadata with categories, descriptions, key points, and cache-busted dynamic imports.
- Added `css/experiments.css` for all experiment panel, overlay, label, and responsive styles.
- Added local visual verification helpers.
- Added `.gitignore` coverage for local-only development output.

## Search And Navigation

- Moved search out of the bottom toolbar and into the header area.
- Added unified search across sky bodies, trackable objects, and polished experiments.
- Added weighted fuzzy intent matching:
  - punctuation-insensitive normalization,
  - compact text matching,
  - acronym matching,
  - prefix and substring scoring,
  - alias scoring,
  - experiment priority boost.
- Added result badges for `EXP` and `TRACK`.
- Added a separate settings search for Show and Tracker controls.
- Filtered experiment search to polished demos only, so unfinished expansion entries do not become accidental search destinations.
- Verified `n.e.w` surfaces Newton's Bucket and XMM-NEWTON.

## Completed Kinematic Equivalence Demos

### Stellar Parallax

- Simplified the scene around a fixed S-N-F measurement overlay.
- Suppressed native clutter during the demo while preserving relevant native model behavior.
- Switched to native star dot tracking.
- Fixed premature A marker visibility.
- Fixed active beam start so tracking begins from N before A trace.
- Synchronized tracking with native day/night progression.
- Added A and B measurement states.
- Added final A-to-B equals catalog 2p reveal.
- Clarified labels to S, N, F, A, B, and A-to-B.
- Bumped browser cache keys through the parallax polish sequence.

### Stellar Aberration

- Added Bradley aberration framing around the 20.64 arcsec annual effect.
- Cleaned copy for kinematic equivalence rather than parallax framing.
- Removed checkmark/X icon language where color coding already communicated the contrast.
- Preserved native day/night relevance.
- Clarified the shared kappa angle across coordinate descriptions.

### Planetary Retrograde

- Added apparent fixed-star backtrack visualization.
- Added heliocentric, globe-geocentric, and native topographical equivalence framing.
- Added planet-selectable retrograde paths for eligible objects.
- Set default rotation speed to 0.5.
- Reworked confusing surface markers into cleaner station/path references.
- Added fixed-star reference context and station ticks.
- Added heavenly/optical vault path tracing tied to the actual planet dot.
- Improved copy and infographic language around observer-first measurement.

## Completed Aether Experiment Demos

### Airy's Failure

- Built the water-filled telescope experiment view.
- Started with eyepiece view available by default.
- Represented the observed null as a tiny residual rather than mathematical zero.
- Added subtle observed shift that remains practically centered.
- Added moving-telescope prediction contrast.
- Removed unnecessary separator slider.
- Removed stray arrow clutter.
- Clarified that, in this framing, Airy's failure of the moving-telescope prediction is a success for the stationary-Earth/aether interpretation.

### Michelson-Morley

- Built the 1887 Cleveland interferometer scene.
- Added sixteen reading marks and pivot progression.
- Added baseline, observed null band, and moving-Earth prediction fringe viewer.
- Clarified that the null was below threshold, not exact zero.
- Added floating labels:
  - `Observed null: no orbital headwind`
  - `Moving Earth incorrectly predicts fringe shift corresponding to alleged 30 km/s`
- Repositioned labels so they do not cover the interferometer on desktop.
- Added/polished copy for expected 0.4-fringe signal and observed sub-threshold result.

### Newton's Bucket

- Changed frame language from ECEF to ECI.
- Set default view to the ECI frame.
- Reworked labels and conclusion:
  - ECI correctly predicts the observed concave water.
  - Bucket-rider frame predicts flat water and does not match observation.
  - Laws of physics directly apply in the preferred inertial frame.
- Increased label readability.
- Removed distracting bucketeer experiment variations after review.
- Started slightly more zoomed out and made the scene cleaner.

## Experiment Tab Overview Copy

- Added overview copy explaining kinematics versus dynamics.
- Clarified that heliocentric, globe-geocentric, and topographical coordinate systems can map the same observed angles.
- Added concise observer-first framing: dynamics asks which frame makes observation and law meet with fewer added assumptions.

## UI Polish

- Compact desktop bottom-bar spacing.
- Scroll-safe mobile bottom bar.
- Top search no longer overlaps header subtitle on medium desktop widths.
- Mobile Experiment popup no longer overlaps the top search strip.
- Mobile HUD no longer overlaps the top search strip.
- Experiment panels use constrained widths and internal scrolling.
- MMX labels and fringe overlay were checked at desktop widths.

## Verification

Passed syntax checks:

- `js/experiments/**/*.js`
- `js/main.js`
- `js/core/app.js`
- `js/ui/controlPanel.js`
- `js/ui/i18n.js`
- `js/ui/mouseHandler.js`
- `js/render/scene.js`
- `js/render/worldObjects.js`
- `js/render/constellations.js`

Visual and browser checks:

- No console errors.
- Desktop Experiment tab at 1440x900.
- Smaller desktop Experiment tab around 1280x720.
- Mobile Experiment tab at 390x844.
- MMX label placement at 1440x900 and 1366x768.
- Search query `n.e.w` returns Newton's Bucket and XMM-NEWTON.

## Known PR Notes

- The registry includes expansion experiments beyond the polished six, but search intentionally limits experiment matches to the polished demos.
