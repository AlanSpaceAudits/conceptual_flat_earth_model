// S200 — FE eclipse-prediction demo track (PLACEHOLDER).
//
// Intent:
//   A second, structurally separate demo track that predicts eclipses
//   via flat-earth / cycle-harmonic methods (Shane St. Pierre's resource
//   pack; Fred-style Saros/Metonic/synodic-anomalistic-nodal harmonics;
//   Dimbleby's historical eclipse catalogue as validation).
//
// Status at S200:
//   **PLACEHOLDER** — not yet implemented. The user explicitly asked
//   not to fake this with the astropixels table. This file provides the
//   structural entry point so future serials can drop in the real
//   prediction logic without disturbing the astropixels-based solar /
//   lunar demo tracks.
//
// What the real implementation will need (deferred; gather from Shane's
// resource pack when the user hands it over):
//   1. A catalogue of the three relevant lunar periodicities —
//      synodic (29.5306 d), draconic / nodical (27.2122 d),
//      anomalistic (27.5546 d) — and their harmonics (Saros =
//      223 synodic ≈ 242 draconic ≈ 239 anomalistic).
//   2. A seed eclipse (date + type + Saros number) from which to
//      project forward via Saros / Metonic / Inex cycles.
//   3. A cycle-evaluator that emits predicted eclipse dates over the
//      sim's usable range.
//   4. Observer-path logic honest to the FE model geometry (not the
//      mainstream globe shadow path).
//
// Reference materials currently collected under
//   /home/alan/Documents/eclipse/
//     - Dimbleby_All_Past_Time-compressed-1.pdf
//     - Eclipse data all.xlsm
//     - 'GLOBEBUSTERS LIVE ... Turtle Clock in the Sky.txt'
//     - 'What do YOU need to "predict" eclipses.txt'
//     - 'What information determines how eclipses are predicted.txt'
// These are not yet parsed/structured; bringing them in is the next
// step for this track.

import { Ttxt } from './animation.js';

// Single placeholder demo entry so the UI has something to render in
// the FE Eclipse Predictions group. Running it displays an advisory
// message and does not modify model state.
export const FE_ECLIPSE_PREDICTION_DEMOS = [
  {
    name: 'FE Prediction — (placeholder, awaiting resource pack)',
    group: 'fe-predictions',
    kind: 'fe-placeholder',
    intro: () => ({}),   // no state changes
    tasks: () => [
      Ttxt('FE eclipse-prediction track is a structural placeholder. '
         + 'Shane/Fred resource pack pending; real cycle-harmonic '
         + 'predictor will drop in via this same entry point without '
         + 'disturbing the astropixels-based solar/lunar demos.'),
    ],
  },
];

export const FE_TRACK_PENDING_RESOURCES = {
  resourcePack: '/home/alan/Documents/eclipse/',
  status: 'placeholder',
  note: 'Awaiting structured FE prediction logic derived from Shane St. Pierre / '
      + 'Fred-style Saros-harmonics material. Do not fake with mainstream tables.',
};
