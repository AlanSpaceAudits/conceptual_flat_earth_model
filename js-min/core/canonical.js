import{getProjection as i}from"./projections.js";const s=Math.PI/180;let n=null;function l(o){if(!o){n=null;return}const t=i(o);n=t&&t.useProjectionGrid?t:null}function j(o,t,r=1){if(n)return n.project(o,t,r);const c=r*(90-o)/180,e=t*s;return[c*Math.cos(e),c*Math.sin(e),0]}export{j as canonicalLatLongToDisc,l as setActiveProjection};

//# sourceMappingURL=canonical.js.map
