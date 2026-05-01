const D=.9856262833675564,e=365.25/360,i=10,a=351.267,f=300;function _(t){return t*e}function l(t,s=!1){if(!Number.isFinite(t))return"\u2014";const o=t*e,n=o<0?"\u2212":s?"+":"",r=Math.abs(o),u=Math.floor(r),c=(r-u)*i;return`${n}${u} du ${c.toFixed(1)} fen`}function x(t){if(!Number.isFinite(t))return"\u2014";const o=Math.abs(t)*e*a,n=Math.floor(o),r=Math.round((o-n)*f);return`${n} li ${r} bu`}export{f as BU_PER_LI,D as DEG_PER_DU,e as DU_PER_DEG,i as FEN_PER_DU,a as LI_PER_DU,_ as degToDu,l as fmtDuFen,x as fmtLiBu};

//# sourceMappingURL=units.js.map
