import*as b from"three";import{BaseExperiment as _}from"../baseExperiment.js";const k=30,O=299792,y=Math.atan(k/O)*206264.806,x=1024,S=6,B=/^(sat|bh|q|gal)_/;class H extends _{static get id(){return"aberration"}static get name(){return"Stellar Aberration"}static get category(){return"equivalence"}static get description(){return"Bradley 1727: 20.6 arcsec wobble. Same kappa = arctan(v/c) in both frames; Airy's failure favours stationary Earth."}init(){this.equivalenceOverlay=null,this.followObserver=!1,this.experimentScale=1,this.wobbleOn=!0,this.vortexOn=!0,this.showBelowHorizon=!1,this.wobbleGroup=new b.Group,this.wobbleGroup.name="aberration-sightline-beams",this.visualGroup.add(this.wobbleGroup),this.beamSegments=null,this.beamBuf=null,this.activeBeamCount=0,this._toggleButtons=null}activate(){super.activate(),typeof document<"u"&&document.body?.classList?.add("aberration-experiment-active"),this.model.setState({WorldModel:"fe",ShowVault:!0,ShowStars:!0,ShowOpticalVault:!0,ShowFeGrid:!0,ShowShadow:!0,ShowDayNightShadow:!0,PermanentNight:!1,DynamicStars:!0,ShowCelestialBodies:!0,StarTrepidation:!0,StarApplyAberration:!0,Description:`Stellar Aberration: sightlines from observer to each native dome star wobble by \u03BA \u2248 ${y.toFixed(2)}" (boosted for visibility).`}),this._buildBeams(),this.model.setState({Cosmology:this.vortexOn?"vortex2":"none"}),this.openEquivalenceOverlay()}deactivate(){typeof document<"u"&&document.body?.classList?.remove("aberration-experiment-active"),this.model?.setState?.({Cosmology:"none"}),this._clearBeams(),this._removeOpticalHud(),this.closeEquivalenceOverlay(),super.deactivate()}_disposeGroup(e){if(e)for(;e.children.length;){const t=e.children[0];e.remove(t),t.geometry?.dispose?.();const i=Array.isArray(t.material)?t.material:t.material?[t.material]:[];for(const r of i)r.dispose?.()}}_clearBeams(){this._disposeGroup(this.wobbleGroup),this.beamSegments=null,this.beamBuf=null,this.activeBeamCount=0}_ensureOpticalHud(){if(this._opticalHud||typeof document>"u")return;const t=this.renderer?.canvas?.parentElement||document.body,i=document.createElementNS("http://www.w3.org/2000/svg","svg");i.setAttribute("class","aberration-optical-hud"),Object.assign(i.style,{position:"absolute",left:"0",top:"0",width:"100%",height:"100%",pointerEvents:"none",overflow:"visible",zIndex:"5"}),t.appendChild(i),this._opticalHud=i,this._opticalHudLines=[],this._opticalHudRings=[]}_removeOpticalHud(){this._opticalHud?.remove?.(),this._opticalHud=null,this._opticalHudLines=null,this._opticalHudRings=null}_setOpticalHudVisible(e){this._opticalHud&&(this._opticalHud.style.display=e?"":"none")}_visualGroupOffset(){const e=this._tmpVisualOff||(this._tmpVisualOff=new b.Vector3),t=this.visualGroup?.position;return t?e.set(t.x,t.y,t.z):e.set(0,0,0)}_heavenlyEyeLocal(){return this._heavenlyStart||(this._heavenlyStart=new b.Vector3(0,0,.02125))}_isEligibleStar(e){return!e||typeof e.id=="string"&&B.test(e.id)?!1:this.showBelowHorizon?!0:(e.anglesGlobe?.elevation??1)>0}_buildBeams(){if(!this.model)return;this._clearBeams(),this.beamBuf=new Float32Array(x*2*3);const e=new b.BufferGeometry,t=new b.BufferAttribute(this.beamBuf,3);t.usage=b.DynamicDrawUsage,e.setAttribute("position",t),e.setDrawRange(0,0);const i=new b.LineBasicMaterial({color:6750207,transparent:!0,opacity:.85,depthTest:!1,depthWrite:!1});this.beamSegments=new b.LineSegments(e,i),this.beamSegments.renderOrder=9999,this.beamSegments.frustumCulled=!1,this.beamSegments.visible=!!this.wobbleOn,this.wobbleGroup.add(this.beamSegments)}update(e){if(super.update(e),!this.active||!this.beamSegments||!this.beamBuf)return;const t=this.model.computed||{},i=this._tmpStarList||(this._tmpStarList=[]);if(i.length=0,Array.isArray(t.CelNavStars))for(const h of t.CelNavStars)i.push(h);if(Array.isArray(t.CataloguedStars))for(const h of t.CataloguedStars)i.push(h);const r=this._visualGroupOffset(),p=!!this.model?.state?.InsideVault,o=this.beamBuf;if(this._ensureOpticalHud(),this._setOpticalHudVisible(this.wobbleOn),this.wobbleOn&&this._updateOpticalHud(i,p),p){this.beamSegments.visible=!1;return}this.beamSegments.visible=!!this.wobbleOn;const u=this._heavenlyEyeLocal();let n=0;for(const h of i){if(n>=x)break;if(!this._isEligibleStar(h))continue;const a=h.opticalVaultCoord||h.vaultCoord;a&&(o[n*6+0]=u.x,o[n*6+1]=u.y,o[n*6+2]=u.z,o[n*6+3]=a[0]-r.x,o[n*6+4]=a[1]-r.y,o[n*6+5]=a[2]-r.z,n++)}this.activeBeamCount=n,this.beamSegments.geometry.setDrawRange(0,n*2),this.beamSegments.geometry.attributes.position.needsUpdate=!0}_updateOpticalHud(e,t){const i=this.renderer?.sm?.camera,r=this.renderer?.canvas,p=this._opticalHud;if(!i||!r||!p)return;const o=r.clientWidth||r.width||1,u=r.clientHeight||r.height||1,n=o/2,h=u/2,a=this._tmpNdc||(this._tmpNdc=new b.Vector3),m=this._opticalHudLines,v=this._opticalHudRings;let d=0;for(const s of e){if(!this._isEligibleStar(s))continue;const g=s.opticalVaultCoord||s.vaultCoord;if(!g||(a.set(g[0],g[1],g[2]).project(i),a.z<-1||a.z>1)||a.x<-1.05||a.x>1.05||a.y<-1.05||a.y>1.05)continue;const f=(a.x*.5+.5)*o,w=(1-(a.y*.5+.5))*u;if(t){let c=m[d];c||(c=document.createElementNS("http://www.w3.org/2000/svg","line"),c.setAttribute("stroke","#66ffff"),c.setAttribute("stroke-width","2"),c.setAttribute("stroke-opacity","0.85"),c.setAttribute("stroke-linecap","round"),p.appendChild(c),m[d]=c),c.setAttribute("x1",n),c.setAttribute("y1",h),c.setAttribute("x2",f),c.setAttribute("y2",w),c.style.display=""}else m[d]&&(m[d].style.display="none");let l=v[d];l||(l=document.createElementNS("http://www.w3.org/2000/svg","ellipse"),l.setAttribute("fill","none"),l.setAttribute("stroke","#66ffff"),l.setAttribute("stroke-width","1"),l.setAttribute("stroke-opacity","0.45"),p.appendChild(l),v[d]=l);const A=typeof s.dec=="number"?s.dec:0,E=S*Math.max(.15,Math.abs(Math.sin(A)));l.setAttribute("cx",f),l.setAttribute("cy",w),l.setAttribute("rx",S),l.setAttribute("ry",E),l.style.display="",d++}for(let s=d;s<m.length;s++)m[s]&&(m[s].style.display="none");for(let s=d;s<v.length;s++)v[s]&&(v[s].style.display="none")}setWobbleOn(e){this.wobbleOn=!!e,this.beamSegments&&(this.beamSegments.visible=this.wobbleOn),this._setOpticalHudVisible(this.wobbleOn),this._refreshToggleStyles?.()}setVortexOn(e){this.vortexOn=!!e,this.model?.setState?.({Cosmology:this.vortexOn?"vortex2":"none"}),this._refreshToggleStyles?.()}buildControls(e){const t=document.createElement("h3");t.textContent="Stellar Aberration",e.appendChild(t);const i=document.createElement("div");i.className="aberration-reveal-card",i.innerHTML=`
      <span class="aberration-kicker">Kinematic equivalence</span>
      <strong>Same annual aberration angle. Two coordinate stories.</strong>
      <p class="aberration-formula">kappa = arctan(v / c) = ${y.toFixed(2)} arcsec
        <span>(v = 30 km/s, c = 299,792 km/s)</span></p>
      <div class="kin-vs">
        <div class="kin-vs-helio">
          <div class="kin-vs-tag">Heliocentric</div>
          <p>Earth races through still aether at 30 km/s. The
          telescope must tilt forward by kappa to catch the light. As
          Earth's direction rotates over the year, every star traces
          the same 20.6 arcsec ellipse.</p>
          <p class="kin-vs-cost"><b>Cost:</b> requires a 30 km/s motion
          nobody can feel, plus an extra patch when Airy's water
          telescope (1871) refused to change the angle.</p>
        </div>
        <div class="kin-vs-fe">
          <div class="kin-vs-tag">Stationary topo plane</div>
          <p>Earth is still. The local aether sweeps past at 30 km/s.
          Light entering the telescope is deflected by exactly the
          same kappa. Same wobble, same 20.6 arcsec ellipse; no Earth motion
          invoked.</p>
          <p class="kin-vs-cost"><b>Bonus:</b> Airy 1871 is the natural
          prediction. Water inside the telescope doesn't change kappa
          because the wind, not Earth, is what's moving, and the
          aether co-moves with the water.</p>
        </div>
      </div>
      <span class="aberration-punch">Both frames yield the same kappa. The topo reading starts from the observer's measured sky and adds fewer hidden motions.</span>
    `,e.appendChild(i);const r=document.createElement("div");r.className="aberration-facts",r.innerHTML=`
      <div><b>Discoverer</b><span>James Bradley, 1727</span></div>
      <div><b>Observed</b><span>Every star traces the same ${y.toFixed(2)} arcsec annual ellipse.</span></div>
      <div><b>Shared signal</b><span>The measured annual tilt is kappa = arctan(v / c), the same in both coordinate stories.</span></div>
      <div><b>Airy's failure</b><span>1871: water-filled telescope, kappa unchanged within the reported residual. That is the stationary-aether test the moving-Earth story struggled with.</span></div>
    `,e.appendChild(r);const p=document.createElement("div");p.className="aberration-toggles";const o=(a,m,v,d)=>{const s=document.createElement("button");s.type="button",s.className="aberration-toggle-btn",s.dataset.key=m;const g=()=>{const f=v();s.classList.toggle("on",!!f),s.textContent=`${a}: ${f?"ON":"OFF"}`};return s.addEventListener("click",()=>{d(!v()),g()}),s._refresh=g,g(),s},u=o("Wobbling sightlines to dome stars","wobble",()=>this.wobbleOn,a=>this.setWobbleOn(a)),n=o("Aether vortex tunnel","vortex",()=>this.vortexOn,a=>this.setVortexOn(a)),h=o("Show below-horizon beams","below",()=>this.showBelowHorizon,a=>{this.showBelowHorizon=!!a});p.append(u,n,h),e.appendChild(p),this._toggleButtons=[u,n,h],this._refreshToggleStyles=()=>{for(const a of this._toggleButtons||[])a._refresh?.()}}openEquivalenceOverlay(){if(this.equivalenceOverlay||typeof document>"u")return;const e=document.createElement("div");e.className="aberration-equivalence-overlay",e.innerHTML=`
      <div class="aberration-equivalence-kicker">Kinematic equivalence (Bradley 1727)</div>
      <div class="aberration-equivalence-title">Same kappa = ${y.toFixed(2)} arcsec: the telescope tilt matches in both frames</div>
      <svg class="aberration-equivalence-svg" viewBox="0 0 540 240" role="img" aria-label="Stellar aberration: aether stationary moving telescope vs aether moving stationary telescope">
        <!-- HELIO: Aether stationary, moving telescope -->
        <g class="cell helio">
          <rect x="6" y="10" width="258" height="220" rx="6"/>
          <text x="135" y="26" class="cell-title helio-text">Aether stationary / moving telescope</text>
          <!-- Star -->
          <circle cx="170" cy="48" r="4" class="star"/>
          <text x="170" y="38" class="tiny">star</text>
          <!-- Vertical light rays through still aether -->
          <line x1="150" y1="54" x2="150" y2="194" class="ray-still"/>
          <line x1="170" y1="54" x2="170" y2="194" class="ray-still"/>
          <line x1="190" y1="54" x2="190" y2="194" class="ray-still"/>
          <text x="222" y="120" class="tiny">light falls<tspan x="222" dy="11">vertically</tspan></text>
          <!-- Tilted telescope (top to upper-left, base at Earth).
               Tube tilts in the SAME direction as Earth's motion. -->
          <line x1="170" y1="195" x2="135" y2="120" class="telescope"/>
          <text x="118" y="115" class="tiny tilt-label">kappa tilt</text>
          <!-- \u03BA arc between vertical and tube -->
          <path d="M 170 165 A 30 30 0 0 0 158 167" class="kappa-arc"/>
          <!-- Earth (moving leftward) -->
          <circle cx="170" cy="200" r="8" class="earth-moving"/>
          <!-- Velocity arrow LEFTWARD on Earth -->
          <line x1="170" y1="200" x2="128" y2="200" class="vel-arrow"/>
          <polygon points="128,196 120,200 128,204" class="vel-arrow-head"/>
          <text x="105" y="218" class="tiny" style="text-anchor:start;">Earth \u2190 30 km/s</text>
        </g>
        <!-- FE: Aether moving, stationary telescope -->
        <g class="cell fe">
          <rect x="270" y="10" width="264" height="220" rx="6"/>
          <text x="402" y="26" class="cell-title fe-text">Aether moving / stationary telescope</text>
          <!-- Star -->
          <circle cx="437" cy="48" r="4" class="star"/>
          <text x="437" y="38" class="tiny">star</text>
          <!-- Aether wind arrows pointing LEFT across the panel -->
          <g class="wind">
            <line x1="510" y1="78" x2="468" y2="78"/>
            <polygon points="468,74 460,78 468,82"/>
            <line x1="510" y1="118" x2="468" y2="118"/>
            <polygon points="468,114 460,118 468,122"/>
            <line x1="510" y1="158" x2="468" y2="158"/>
            <polygon points="468,154 460,158 468,162"/>
          </g>
          <text x="510" y="66" class="tiny" style="text-anchor:end;">aether wind \u2190 30 km/s</text>
          <!-- Light path: starts vertically above star, then is dragged
               leftward by the aether wind on its way down. The
               apparent source direction is therefore upper-LEFT. -->
          <path d="M 437 54 Q 433 120 405 195" class="ray-bent"/>
          <text x="350" y="100" class="tiny" style="text-anchor:end;">light dragged by<tspan x="350" dy="11">aether wind</tspan></text>
          <!-- Earth (stationary) -->
          <circle cx="405" cy="200" r="8" class="earth-still"/>
          <text x="405" y="219" class="tiny">Earth (still)</text>
          <!-- Telescope tilted upper-LEFT, SAME \u03BA as helio panel -->
          <line x1="405" y1="195" x2="370" y2="120" class="telescope"/>
          <text x="353" y="115" class="tiny tilt-label">kappa tilt</text>
          <path d="M 405 165 A 30 30 0 0 0 393 167" class="kappa-arc"/>
        </g>
      </svg>
      <div class="aberration-equivalence-note">
        <b>Airy 1871:</b> filling the telescope with water did NOT
        change kappa. Moving-Earth predicts kappa should scale by the refractive
        index n. Stationary Earth + co-moving aether (the right panel)
        predicts no meaningful change, which is what Airy actually measured.
        Bradley's 0.8 arcsec residual stays far below the competing
        30 arcsec disagreement.
      </div>
      <div class="aberration-equivalence-foot">
        Drawn kappa is exaggerated so the tilt is legible. Real
        catalog kappa = ${y.toFixed(2)} arcsec in both panels.
      </div>
    `,(document.getElementById("view")||document.body).appendChild(e),this.equivalenceOverlay=e}closeEquivalenceOverlay(){this.equivalenceOverlay?.remove?.(),this.equivalenceOverlay=null}getInfoPanel(){return`
      <h3>Stellar Aberration - kinematic equivalence</h3>
      <p class="aberration-info-lede">Bradley (1727): every star traces the
      same ${y.toFixed(2)} arcsec annual ellipse. The
      kinematic question is which relative motion carries that angle:
      Earth moving through the medium, or the local medium moving past
      a stationary observer.</p>
      <div class="aberration-info-vs">
        <div class="aberration-info-card aberration-info-helio">
          <div class="aberration-info-tag">Heliocentric explanation</div>
          <ul>
            <li>Earth orbits the Sun at v = 30 km/s through still aether or empty space.</li>
            <li>To catch starlight, the telescope is tilted forward by kappa = arctan(v/c) = ${y.toFixed(2)} arcsec.</li>
            <li>As Earth's velocity vector rotates over the year, the apparent star position traces the annual ellipse.</li>
            <li><b>Airy 1871 problem:</b> water inside the telescope should change kappa. The measured angle did not follow that prediction.</li>
          </ul>
        </div>
        <div class="aberration-info-card aberration-info-fe">
          <div class="aberration-info-tag">Stationary geocentric topo plane</div>
          <ul>
            <li>Earth is still. Local aether sweeps past at v = 30 km/s.</li>
            <li>Light traversing that wind is deflected by kappa = arctan(v/c) = ${y.toFixed(2)} arcsec, the identical formula.</li>
            <li>The annual ellipse comes from the wind direction rotating with the year (not Earth doing the moving).</li>
            <li><b>Airy 1871 prediction:</b> the aether co-moves with the water inside the telescope, so kappa stays the same apart from tiny residuals. That matches the measured result.</li>
          </ul>
        </div>
      </div>
      <p class="aberration-info-punch">Both frames yield kappa = ${y.toFixed(2)} arcsec.
      Only the stationary-Earth frame predicts Airy's null result without
      patching. Aberration is consistent with, and more cleanly explained by,
      a stationary Earth inside locally co-moving aether.</p>
    `}}var L=H;export{H as AberrationExperiment,L as default};

//# sourceMappingURL=aberration.js.map
