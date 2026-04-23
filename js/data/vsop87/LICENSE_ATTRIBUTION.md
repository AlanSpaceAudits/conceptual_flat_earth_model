# VSOP87 coefficient data — attribution

The six `.js` data files in this directory (`mercury.js`, `venus.js`,
`earth.js`, `mars.js`, `jupiter.js`, `saturn.js`) are the VSOP87D
(heliocentric spherical, equinox of date) coefficient tables.

## Original theory

**Bretagnon, P., and Francou, G.** (1988)
*Planetary theories in rectangular and spherical variables — VSOP87
solutions.*
*Astronomy and Astrophysics,* **202**, 309–315.

Original data published by the Bureau des Longitudes (Paris) and
archived at the VizieR catalogue service (catalogue VI/81).

## JavaScript port

The specific ES-module form of these files was ported to JavaScript by:

**Sonia Keys** — original Go port (github.com/soniakeys/meeus)
**commenthol** — JavaScript port (github.com/commenthol/astronomia)

Both ports are released under the MIT License:

```
Copyright (c) 2013 Sonia Keys
Copyright (c) 2016 Commenthol

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

## Accuracy

VSOP87D gives ~1" accuracy for inner planets and ~few-arcsecond for
outer planets across roughly ±4000 years of J2000, when all terms are
included. The files here contain the full unabridged series as
published by Bretagnon & Francou — no truncation.

## Used by

`js/core/ephemerisVsop87.js` — the sim's computational ephemeris
pipeline.
