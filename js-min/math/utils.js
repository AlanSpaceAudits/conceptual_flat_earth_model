const n=t=>t*Math.PI/180,r=t=>t*180/Math.PI,p=t=>t*t,s=t=>t<-1?-1:t>1?1:t,c=t=>t<0?0:t>1?1:t,a=(t,e,o)=>t<e?e:t>o?o:t;function i(t,e){let o=Math.abs(t)%e;return t<0&&(o=e-o),o}export{a as Clamp,c as Limit01,s as Limit1,r as ToDeg,n as ToRad,i as ToRange,p as sqr};

//# sourceMappingURL=utils.js.map
