# Experiment Tab README

This branch adds a new interactive Experiment tab to the FE Conceptual Model. The goal is to make selected observational and historical physics arguments explorable inside the existing sky model instead of presenting them as static text.

The tab is built around two ideas:

- Kinematic equivalence: different coordinate systems can map the same observed angular data.
- Dynamic comparison: experiments ask which physical frame makes the measurements and laws meet directly.

## What Is New

- New Experiment tab in the native bottom UI.
- New experiment manager, registry, shared base class, controls, overlays, and scene lifecycle.
- New experiment stylesheet at `css/experiments.css`.
- Lazy-loaded experiment modules under `js/experiments/`.
- Top header search bar replacing the old bottom-bar search placement.
- Unified body and experiment search with weighted, punctuation-insensitive intent matching.
- Separate settings search for Show and Tracker controls.
- Responsive popup behavior for desktop and mobile.

## Completed Polished Demos

### Kinematic Equivalence

These are the main completed coordinate-equivalence demos.

- Stellar Parallax: fixed S-N-F reference, native star tracking, synchronized day/night progression, A and B marks, and catalog 2p reveal.
- Stellar Aberration: Bradley aberration angle, annual ellipse behavior, kinematic equivalence of the same kappa angle, and Airy connection.
- Planetary Retrograde: observer-first apparent backtrack against fixed stars, with heliocentric, globe-geocentric, and native topographical coordinate mapping.

### Aether Experiments

These are the main completed experiment demos.

- Airy's Failure: water-filled telescope null result shown as a tiny residual, with eyepiece view and moving-telescope prediction contrast.
- Michelson-Morley: 1887 Cleveland setup, sixteen reading marks, baseline/observed/predicted fringe comparison, and floating labels for observed null versus 30 km/s prediction.
- Newton's Bucket: ECI frame versus bucket-rider frame, concave water observation, and preferred inertial frame interpretation.

## Additional Registered Experiments

The registry also includes expansion entries for Fresnel Drag, Dayton Miller, Sagnac, Speed of Light, Wang Fiber Optic, Ron Hatch GPS Analysis, and GPS Sagnac Corrections.

Those entries are available in the Experiment tab for continued development, but the unified top search intentionally surfaces only the polished demos so users are not routed into unfinished work by accident.

## Search Behavior

The body search now searches both sky targets and polished experiments. It is designed for fast intent matching rather than exact string matching.

Search features:

- Normalizes punctuation and spacing.
- Supports compact matching such as `n.e.w`.
- Scores exact, prefix, substring, acronym, and alias matches.
- Gives polished experiments a priority boost.
- Shows result badges such as `EXP` and `TRACK`.
- Keeps tracking targets searchable, including entries like `XMM-NEWTON`.
- Filters experiment results to the polished experiment set.

Example:

```text
n.e.w
```

Expected top results:

- Newton's Bucket
- XMM-NEWTON

## UI And Responsiveness

The top search bar was moved out of the dense bottom toolbar to reduce bottom-bar crowding. The bottom toolbar is still dense because it contains the native model controls, but it now has compact desktop spacing and mobile horizontal-scroll fallback.

Recent responsive polish:

- Header subtitle hides on medium desktop widths before it collides with top search.
- Mobile experiment popups clear the top search strip.
- Mobile HUD clears the search strip.
- Experiment panels use constrained widths and scroll internally.
- MMX floating labels are positioned to avoid the interferometer on normal desktop layouts.

## Development Structure

Key files:

- `js/experiments/index.js`: experiment manager, activation, panel rendering, lifecycle loop.
- `js/experiments/baseExperiment.js`: shared experiment base behavior.
- `js/experiments/registry.js`: categories, metadata, lazy imports, cache keys, search descriptions.
- `css/experiments.css`: all experiment-specific UI and overlay styling.
- `js/ui/controlPanel.js`: Experiment tab registration, top search, settings search, responsive popup placement.

To add a new experiment:

1. Create a module under `js/experiments/<category>/<id>.js`.
2. Extend `BaseExperiment`.
3. Implement `init`, `activate`, `deactivate`, `update`, `buildControls`, and optionally `getInfoPanel`.
4. Add an entry to `js/experiments/registry.js`.
5. Bump the module cache key in the registry when changing browser-loaded code.
6. Add aliases to the polished search allowlist only when the demo is review-ready.

## Verification Checklist

Verified in this branch:

- Syntax checks pass for experiment modules and touched integration files.
- Experiment tab at 1440x900.
- Experiment tab around 1280x720.
- Experiment tab at 390x844 mobile emulation.
- MMX floating labels and fringe overlay.
- Search query `n.e.w`.
- No console errors during smoke checks.

## PR Hygiene

Keep the PR limited to source and docs needed for the Experiment tab. Local tooling state and generated development output should remain outside the PR.

Expected PR code paths:

- `css/experiments.css`
- `js/experiments/`
- targeted integration edits in existing UI, render, and app files.
