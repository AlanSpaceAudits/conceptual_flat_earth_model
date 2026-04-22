# Conceptual Flat Earth Model

An interactive, browser-based conceptual model of the flat-earth cosmology built
with three.js. The scene draws the stationary disc, the observer's optical
vault (a flattened cap onto which stars, sun, moon, and planets project), and
the heavenly vault above it. All geometry is unit-less — every distance is a
ratio of the flat-earth disc radius.

## Live demo

Hosted on GitHub Pages — see the "Pages" link on this repo.

## Running locally

No build step. It's a static site, but browsers block ES-module imports over
`file://`, so you need any local HTTP server:

    python3 -m http.server 8000

Then open <http://localhost:8000>.

## Controls

* **View tab** — observer lat/long, camera, heavenly vault, optical vault,
  per-body vault heights, ray shape.
* **Time tab** — day of year, time, date-time.
* **Show tab** — visibility toggles for land, grid, shadow terminator,
  starfield, rays, declination circles, etc.
* **Demos tab** — scripted camera/time animations illustrating key points
  of the conceptual model.

The "ⓘ About" button in the header explains the model's stance on the
lat/long graticule and the fictitious center-of-earth observer.

## Special Thanks

This project is built on ideas and groundwork from two people whose work
pointed the way:

* **Shane St. Pierre** — for the conceptual framing and the push to actually
  build a working, interactive demonstration of the model.
* **Walter Bislin** — for the original numerical constants, projection
  choices, and the visual conventions that this port preserves.

Without their inspiration and their own models, this wouldn't exist.
