# FE Conceptual Model — a sandbox for a single observer's sky

An interactive sandbox showing what one observer actually sees. No physical units, no assumed earth radius, no spherical trigonometry sneaking in through the back door. Everything is built around a single fictitious observer who ties the celestial sphere to the terrestrial graticule by relating a star's geocentric angle to the time it transits overhead.

## Two layers, one observer

- **Optical vault** — the flattened cap overhead onto which the sun, moon, planets, and starfield project. This is the sky as it is actually perceived.
- **True positions** — the heavenly-vault reading that places each body at its geographic ground point, defined in time through its geocentric angle. Toggle it on to see the bookkeeping, off to see only what reaches the observer's eye.

## The point

On the globe, an observer is always referencing where a star *isn't* at any given instant. In the flat-earth reading, the apparent positions on the celestial sphere are primary. The model lets you compare both on the same graticule and decide for yourself which framing is doing real work and which is scaffolding.

## Features you can drive

- Any date and time, in any timezone, with autoplay (Day / Year / Precession presets) and a 2017-08-21 eclipse preset loaded at startup.
- Observer latitude, longitude, and compass facing, with cardinal shortcut buttons.
- Adjustable optical vault (size, height) and heavenly vault (size, height).
- Per-body vault heights for sun, moon, and all five classical planets.
- Cosmology overlays: Yggdrasil, Mount Meru, toroidal vortex (single and dual horn-torus variants).
- Observer figures: turtle, bear, llama, goose, black cat, Great Pyrenees, owl, frog, boxing kangaroo (plus male / female / none).
- Live HUD with sun/moon azimuth-elevation, moon phase widget, and next solar/lunar eclipse countdown.
- Optical ray visualization (vault rays, optical-vault rays, many-rays mode).
- URL hash persistence, so every slider state shares as a link.
- About popup explaining why any graticule-based model is "no better or worse than any other projection, internally consistent and self-referential to a fictitious observer."

## Unit discipline

All distances are unitless. `FE_RADIUS = 1`. Everything else is a ratio. The codebase carries no earth radius, no AU, no kilometres, no great-circle trigonometry. Variable names containing `Globe` refer to the observer's local tangent frame (zenith / east / north), not to any spherical-earth geometry.

Live at <https://alanspaceaudits.github.io/conceptual_flat_earth_model/>.
