import{ToRad as r}from"../math/utils.js";import{M as n}from"../math/mat3.js";function u(o){return n.RotatingX(r(o))}function m(o,e,t){const s=n.RotatingX(r(e)),a=n.RotatingZ(r(t),s);return n.RotatingX(r(o),a)}function T(o,e){const t=r(o);return n.Trans(e,[Math.cos(t),Math.sin(t),0])}function p(o,e){const t=r(o);return n.Trans(e,[Math.cos(t),Math.sin(t),0])}function C(o){return n.Trans(o,[0,0,1])}export{m as compTransMatMoonToCelest,u as compTransMatSunToCelest,p as moonAngleToCelestCoord,C as moonNorthCelestCoord,T as sunAngleToCelestCoord};

//# sourceMappingURL=celestial.js.map
