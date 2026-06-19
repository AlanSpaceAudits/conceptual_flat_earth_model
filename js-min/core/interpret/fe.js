import{localSkyCoordToGlobalFeCoord as l}from"../transforms.js";import{vaultCoordAt as a}from"../feGeometry.js";function c(o,t,r){return[o[0]*r,o[1]*t,o[2]*t]}function C(o,t,r,n){const e=n*(90-o)/180,u=t*n,i=e*e/(u*u);return i>=1?0:r*Math.sqrt(1-i)}function d(o,t,r,n,e){return a(o,t-n,r,e)}function m(o,t,r,n){return l(c(o,t,r),n)}export{C as heavenlyVaultCeiling,d as heavenlyVaultCoord,m as opticalVaultCoord,c as opticalVaultProject};

//# sourceMappingURL=fe.js.map
