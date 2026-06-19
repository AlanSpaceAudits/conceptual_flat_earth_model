import{bodyRADec as d,activeSource as m}from"../ephem/registry.js";import{raDecRadToTang as R,tangToRaDecRad as g}from"./frame.js";function s(c,e,r=m()){const o=d(c,e,r),a=R(o.ra,o.dec),{ra:t,dec:n}=g(a);return{ra:t,dec:n,tang:a}}export{s as bodyTang};

//# sourceMappingURL=sphere.js.map
