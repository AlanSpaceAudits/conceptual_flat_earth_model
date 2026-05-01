import*as s from"three";import{FE_RADIUS as M}from"../core/constants.js";import{ToRad as x}from"../math/utils.js";function w(){const o=document.createElement("canvas");o.width=1080,o.height=1080;const t=o.getContext("2d");t.fillStyle="#0a0e16",t.fillRect(0,0,1080,1080),t.strokeStyle="rgba(255, 255, 255, 0.10)",t.lineWidth=1;for(const a of[-60,0,60]){const l=(90-a)/360;t.beginPath(),t.arc(1080*.5,1080*.5,l*1080,0,2*Math.PI),t.stroke()}t.fillStyle="#fff",t.textAlign="center",t.textBaseline="middle";const c=(a,l,r)=>{t.font=`bold ${r}px sans-serif`;const i=(90-l)/360,e=a.length;for(let h=0;h<e;h++){const u=h/e*2*Math.PI,f=.5+i*Math.cos(u),b=.5+i*Math.sin(u),m=f*1080,g=(1-b)*1080,d=a[h];if(t.fillText(d,m,g),d==="6"||d==="9"){const v=t.measureText(d);t.beginPath(),t.moveTo(m-v.width*.5,g+r*.5),t.lineTo(m+v.width*.5,g+r*.5),t.strokeStyle="#fff",t.lineWidth=3,t.stroke()}}};return c("ABCDEFGHIJKLM".split(""),-60,56),c("NOPQRSTUVWXYZ".split(""),0,56),c("1234567890".split(""),60,56),o}const T=`
  varying vec3 vLocalGlobe;

  void main() {
    // Vertex is a point on a unit hemisphere in local-FE frame:
    //   x = radial outward (away from disc centre)
    //   y = east
    //   z = up
    // Convert to local-globe (x = zenith, y = east, z = north).
    //   zenith = up       = z
    //   east   = east     = y
    //   north  = -radial  = -x   (north is TOWARD the pole on an FE disc)
    vLocalGlobe = normalize(vec3(position.z, position.y, -position.x));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,_=`
  precision highp float;

  uniform sampler2D uChart;
  uniform mat3      uGlobeToCelest;   // inverse of TransMatCelestToGlobe
  uniform vec2      uTexRepeat;       // chart crop, horizontal
  uniform vec2      uTexOffset;
  uniform float     uOpacity;

  varying vec3 vLocalGlobe;

  const float RAD2DEG = 57.2957795;

  void main() {
    vec3 celest = normalize(uGlobeToCelest * vLocalGlobe);
    float dec = asin(clamp(celest.z, -1.0, 1.0));   // radians, +\u03C0/2 = NCP
    float ra  = atan(celest.y, celest.x);            // radians

    // Polar AE: chart centre (UV 0.5,0.5) = NCP, UV radius 0.5 = SCP.
    float rUV = (90.0 - dec * RAD2DEG) / 360.0;      // 0..0.5
    vec2 uvRaw = vec2(0.5 + rUV * cos(ra), 0.5 + rUV * sin(ra));

    vec2 uv = uvRaw * uTexRepeat + uTexOffset;
    vec4 samp = texture2D(uChart, uv);
    gl_FragColor = vec4(samp.rgb, samp.a * uOpacity);
  }
`;function y(p=32,n=96){const o=[],t=[];for(let a=0;a<=p;a++){const l=a/p*Math.PI/2,r=Math.sin(l),i=Math.cos(l);for(let e=0;e<=n;e++){const h=e/n*2*Math.PI;o.push(r*Math.cos(h),r*Math.sin(h),i)}}for(let a=0;a<p;a++)for(let l=0;l<n;l++){const r=a*(n+1)+l,i=r+n+1;t.push(r,i,r+1,i,i+1,r+1)}const c=new s.BufferGeometry;return c.setAttribute("position",new s.Float32BufferAttribute(o,3)),c.setIndex(t),c}class S{constructor(n=[]){this.group=new s.Group,this.group.name="starfield-chart",this.group.visible=!1;const o=new s.TextureLoader,t={"chart-dark":{url:"assets/starfield_dark.webp",fallback:"assets/starfield_dark.png",width:1920,height:1080},"chart-light":{url:"assets/starfield_light.webp",fallback:"assets/starfield_light.png",width:1920,height:1080},ae_aries:{url:"assets/starfield_ae_aries.webp",fallback:"assets/starfield_ae_aries.png",width:1920,height:1080},ae_aries_2:{url:"assets/starfield_ae_aries_2.webp",fallback:"assets/starfield_ae_aries_2.png",width:2476,height:1246},ae_aries_3:{url:"assets/starfield_ae_aries_3.webp",fallback:"assets/starfield_ae_aries_3.png",width:1920,height:1080},alphabeta:{generator:w,width:1080,height:1080}};this.charts={};for(const[r,i]of Object.entries(t)){let e;i.generator?e=new s.CanvasTexture(i.generator()):e=o.load(i.url,void 0,void 0,i.fallback?()=>{o.load(i.fallback,f=>{e.image=f.image,e.needsUpdate=!0})}:void 0),e.colorSpace=s.SRGBColorSpace,e.minFilter=s.LinearMipMapLinearFilter,e.magFilter=s.LinearFilter,e.anisotropy=4,e.wrapS=s.ClampToEdgeWrapping,e.wrapT=s.ClampToEdgeWrapping;const h=i.height/i.width,u=(1-h)/2;e.repeat.set(h,1),e.offset.set(u,0),this.charts[r]={tex:e,cropX:h,offX:u}}this.texDark=this.charts["chart-dark"].tex,this.texLight=this.charts["chart-light"].tex;const c=new s.CircleGeometry(M,128);this.domeMat=new s.MeshBasicMaterial({map:this.texDark,transparent:!0,opacity:1,side:s.DoubleSide,depthTest:!1,depthWrite:!1,clippingPlanes:n}),this.mesh=new s.Mesh(c,this.domeMat),this.mesh.renderOrder=52,this.group.add(this.mesh);const a=y(32,96),l=this.charts["chart-dark"];this.localMat=new s.ShaderMaterial({uniforms:{uChart:{value:this.texDark},uGlobeToCelest:{value:new s.Matrix3},uTexRepeat:{value:new s.Vector2(l.cropX,1)},uTexOffset:{value:new s.Vector2(l.offX,0)},uOpacity:{value:1}},vertexShader:T,fragmentShader:_,transparent:!0,depthTest:!1,depthWrite:!1,side:s.DoubleSide}),this.localGroup=new s.Group,this.localMesh=new s.Mesh(a,this.localMat),this.localMesh.renderOrder=53,this.localGroup.add(this.localMesh),this.group.add(this.localGroup)}update(n){const o=n.state,t=n.computed,c=o.StarfieldType||"random",a=this.charts[c];if(this.group.visible=!!a&&o.ShowStars!==!1,!this.group.visible)return;this.domeMat.map!==a.tex&&(this.domeMat.map=a.tex,this.domeMat.needsUpdate=!0),this.localMat.uniforms.uChart.value=a.tex,this.localMat.uniforms.uTexRepeat.value.set(a.cropX,1),this.localMat.uniforms.uTexOffset.value.set(a.offX,0);const r=o.DynamicStars||o.WorldModel==="ge"?t.NightFactor||0:1;this.domeMat.opacity=r,this.localMat.uniforms.uOpacity.value=r,this.mesh.position.set(0,0,o.StarfieldVaultHeight),this.mesh.rotation.z=-t.SkyRotAngle*Math.PI/180;const i=t.ObserverFeCoord;this.localGroup.position.set(i[0],i[1],i[2]),this.localGroup.rotation.set(0,0,x(o.ObserverLong||0)),this.localMesh.scale.set(t.OpticalVaultRadius,t.OpticalVaultRadius,t.OpticalVaultHeight),this.localGroup.visible=o.ShowOpticalVault!==!1;const e=t.TransMatCelestToGlobe.r;this.localMat.uniforms.uGlobeToCelest.value.set(e[0][0],e[1][0],e[2][0],e[0][1],e[1][1],e[2][1],e[0][2],e[1][2],e[2][2])}}export{S as StarfieldChart};
