import{BaseExperiment as o}from"../baseExperiment.js";class l extends o{static get id(){return"fresnel-drag"}static get name(){return"Fresnel Drag (Fizeau 1851)"}static get category(){return"aether"}static get description(){return"Light speed in moving water shows partial aether drag."}init(){this.c=299792,this.waterRefractiveIndex=1.33,this.waterVelocity=7,this.fresnelCoefficient=1-1/this.waterRefractiveIndex**2,this.animationPhase=0,this.showWithFlow=!0,this.showAgainstFlow=!0}activate(){super.activate(),this.model.setState({ShowVault:!1,ShowFeGrid:!1,Description:"Fizeau 1851: Partial aether drag in moving water."})}update(e){this.active&&(this.animationPhase+=e)}calculateLightSpeed(e,a=!0){const r=this.waterRefractiveIndex,s=this.c*1e3,i=e,t=this.fresnelCoefficient,n=s/r;return a?n+i*t:n-i*t}buildControls(e){const a=document.createElement("h3");a.textContent="Fresnel Drag (Fizeau 1851)",e.appendChild(a);const r=document.createElement("div");r.className="experiment-setup",r.innerHTML=`
      <h4>Experimental Setup</h4>
      <p>Fizeau sent light beams through tubes of flowing water:</p>
      <ul>
        <li>One beam traveling <strong>with</strong> the water flow</li>
        <li>One beam traveling <strong>against</strong> the water flow</li>
      </ul>
      <p>He measured the interference pattern to detect speed differences.</p>
    `,e.appendChild(r),this.createSlider(e,"Water velocity (m/s)",1,15,this.waterVelocity,.5,t=>{this.waterVelocity=t,this.updateCalculations()});const s=document.createElement("div");s.className="experiment-calculations",s.id="fresnel-calc",e.appendChild(s),this.calcDiv=s,this.updateCalculations();const i=document.createElement("div");i.className="experiment-predictions",i.innerHTML=`
      <h4>Three Possible Predictions</h4>
      <table>
        <tr>
          <th>Model</th>
          <th>Prediction</th>
          <th>Result</th>
        </tr>
        <tr>
          <td>No aether drag</td>
          <td>No speed difference</td>
          <td>\u2717 Wrong</td>
        </tr>
        <tr>
          <td>Full aether drag</td>
          <td>\u0394v = water velocity</td>
          <td>\u2717 Wrong</td>
        </tr>
        <tr class="correct">
          <td>Partial drag (Fresnel)</td>
          <td>\u0394v = v(1 - 1/n\xB2)</td>
          <td>\u2713 Correct!</td>
        </tr>
      </table>
    `,e.appendChild(i),this.createToggle(e,"Show With-Flow Beam",this.showWithFlow,t=>{this.showWithFlow=t}),this.createToggle(e,"Show Against-Flow Beam",this.showAgainstFlow,t=>{this.showAgainstFlow=t}),this.createComparisonPanel(e,`<strong>Special Relativity explanation:</strong> Relativistic
       velocity addition formula happens to produce the same result
       as Fresnel's coefficient.<br><br>
       This is presented as SR "predicting" the result, but Fresnel
       derived it 54 years before Einstein.`,`<strong>Aether explanation:</strong> Moving water partially
       drags the local aether with it. The drag coefficient depends
       on the medium's refractive index.<br><br>
       This is exactly what a stationary Earth in local aether predicts.`)}updateCalculations(){if(!this.calcDiv)return;const e=this.waterRefractiveIndex,a=this.waterVelocity,r=this.fresnelCoefficient,s=this.c*1e3/e,i=this.calculateLightSpeed(a,!0),t=this.calculateLightSpeed(a,!1),n=i-t;this.calcDiv.innerHTML=`
      <h4>Calculations</h4>
      <div class="calc-row">
        <span>Fresnel coefficient (1 - 1/n\xB2):</span>
        <strong>${r.toFixed(4)}</strong>
      </div>
      <div class="calc-row">
        <span>Light speed in stationary water:</span>
        <strong>${(s/1e3).toFixed(0)} km/s</strong>
      </div>
      <div class="calc-row">
        <span>Effective drag velocity:</span>
        <strong>${(a*r).toFixed(2)} m/s</strong>
      </div>
      <div class="calc-row">
        <span>Speed with flow:</span>
        <strong>${(i/1e3).toFixed(6)} km/s</strong>
      </div>
      <div class="calc-row">
        <span>Speed against flow:</span>
        <strong>${(t/1e3).toFixed(6)} km/s</strong>
      </div>
      <div class="calc-row highlight">
        <span>Measured difference:</span>
        <strong>${n.toFixed(2)} m/s</strong>
      </div>
    `}getInfoPanel(){return`
      <h3>Fresnel Drag / Fizeau Experiment (1851)</h3>

      <p><strong>Historical Context:</strong> In 1818, Augustin Fresnel proposed
      that transparent media partially drag the aether with them when moving.
      He derived a "drag coefficient" based on the medium's refractive index.</p>

      <h4>Fresnel's Drag Coefficient</h4>
      <p>f = 1 - 1/n\xB2</p>
      <p>For water (n = 1.33): f \u2248 0.434</p>
      <p>This means moving water drags about 43% of the aether with it.</p>

      <h4>Fizeau's Experiment (1851)</h4>
      <p>Hippolyte Fizeau tested Fresnel's prediction by sending light through
      tubes of rapidly flowing water. He measured the interference between
      beams traveling with and against the water flow.</p>

      <p><strong>Result:</strong> The measured speed difference matched
      Fresnel's prediction exactly \u2014 partial drag, not full drag.</p>

      <h4>Why This Matters</h4>
      <p>Three possibilities existed:</p>
      <ol>
        <li><strong>No drag:</strong> Light speed unaffected by water motion
            \u2192 Would show no interference shift</li>
        <li><strong>Full drag:</strong> Aether completely carried by water
            \u2192 Would show shift equal to water velocity</li>
        <li><strong>Partial drag:</strong> Fresnel coefficient applies
            \u2192 Would show shift of v(1-1/n\xB2)</li>
      </ol>
      <p>Fizeau confirmed option 3 \u2014 partial drag.</p>

      <h4>Modern Interpretation</h4>
      <p>Special relativity claims to "explain" this result through
      relativistic velocity addition. However:</p>
      <ul>
        <li>Fresnel derived the coefficient in 1818</li>
        <li>Fizeau confirmed it in 1851</li>
        <li>Einstein published SR in 1905</li>
      </ul>
      <p>SR was fitted to match an already-known result, not a prediction.</p>

      <h4>Geocentric Interpretation</h4>
      <p>The partial drag coefficient is a natural property of how media
      interact with the local aether. A stationary Earth sits in a local
      aether frame; moving media partially drag this aether with them.</p>

      <p>This interpretation requires no relativistic framework \u2014 just
      classical aether physics as Fresnel originally conceived it.</p>
    `}}var d=l;export{l as FresnelDragExperiment,d as default};

//# sourceMappingURL=fresnelDrag.js.map
