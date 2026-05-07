import{BaseExperiment as i}from"../baseExperiment.js";class o extends i{static get id(){return"wang-fiber"}static get name(){return"Wang Fiber Optic (2003-2004)"}static get category(){return"aether"}static get description(){return"Ruyong Wang: linear Sagnac in fiber optic cable."}init(){this.fiberLength=1e3,this.earthRotationRate=15,this.detectedRotation=!0,this.detectedOrbital=!1,this.animationPhase=0}activate(){super.activate(),this.model.setState({ShowVault:!1,ShowFeGrid:!1,Description:"Wang 2003-2004: Linear Sagnac detects rotation, not orbital motion."})}update(t){this.active&&(this.animationPhase+=t)}buildControls(t){const r=document.createElement("h3");r.textContent="Wang Fiber Optic Experiments",t.appendChild(r);const e=document.createElement("div");e.className="experiment-background",e.innerHTML=`
      <p><strong>Researcher:</strong> Ruyong Wang, St. Cloud State University</p>
      <p><strong>Published:</strong> Physics Letters A (2003, 2004)</p>
      <p><strong>Innovation:</strong> Extended Sagnac effect to linear (non-rotating) segments</p>
    `,t.appendChild(e);const a=document.createElement("div");a.className="experiment-finding",a.innerHTML=`
      <h4>Key Finding</h4>
      <p>A straight fiber optic cable oriented East-West shows a Sagnac-type
      phase shift due to Earth's rotation \u2014 even though the fiber itself
      is not rotating in a closed loop.</p>
      <p>This proves the Sagnac effect detects motion relative to an
      <strong>inertial reference frame</strong>, not just mechanical rotation.</p>
    `,t.appendChild(a);const n=document.createElement("div");n.className="experiment-results",n.innerHTML=`
      <h4>What Was Detected</h4>
      <table>
        <tr class="detected">
          <td>Earth's rotation (15\xB0/hr)</td>
          <td><strong>\u2713 DETECTED</strong></td>
        </tr>
        <tr class="not-detected">
          <td>Orbital motion (30 km/s)</td>
          <td><strong>\u2717 NOT DETECTED</strong></td>
        </tr>
        <tr class="not-detected">
          <td>Galactic motion (230 km/s)</td>
          <td><strong>\u2717 NOT DETECTED</strong></td>
        </tr>
      </table>
    `,t.appendChild(n),this.createComparisonPanel(t,`<strong>Problem:</strong> If Earth orbits the Sun at 30 km/s,
       Wang's apparatus should detect this motion \u2014 it's far larger
       than the rotational velocity detected.<br><br>
       Mainstream has no explanation for why only rotation is detected.`,`<strong>Explanation:</strong> Earth rotates within a local aether
       frame but does not translate through space.<br><br>
       Rotation is real and detectable. Orbital motion doesn't exist,
       so it's not detected.`)}getInfoPanel(){return`
      <h3>Wang Fiber Optic Experiments (2003-2004)</h3>

      <p><strong>Researcher:</strong> Ruyong Wang, Physics Department,
      St. Cloud State University, Minnesota</p>

      <h4>The Innovation</h4>
      <p>Traditional Sagnac experiments use rotating platforms with closed
      light paths. Wang demonstrated that the Sagnac effect also works in
      <strong>linear fiber segments</strong> that are stationary relative
      to Earth's surface.</p>

      <h4>Experimental Setup</h4>
      <p>A fiber optic cable oriented East-West on Earth's surface. Light
      traveling East (with Earth's rotation) and light traveling West
      (against rotation) show a measurable phase difference.</p>

      <h4>Results</h4>
      <ul>
        <li><strong>Earth's rotation:</strong> Clearly detected at the
            expected magnitude for 15\xB0/hour</li>
        <li><strong>Orbital motion:</strong> Not detected (would be
            ~65\xD7 larger than rotation signal)</li>
        <li><strong>Galactic motion:</strong> Not detected (would be
            ~500\xD7 larger than rotation signal)</li>
      </ul>

      <h4>Significance</h4>
      <p>Wang's work proves that the Sagnac effect is not limited to
      mechanical rotation of the apparatus. It detects motion relative
      to an inertial reference frame \u2014 what classical physics would
      call the "aether frame."</p>

      <h4>The Paradox</h4>
      <p>If the apparatus can detect Earth's rotation (a relatively small
      velocity), why can't it detect Earth's orbital motion (a much larger
      velocity)? The mainstream answer \u2014 that orbital motion is "inertial"
      and therefore undetectable \u2014 doesn't hold up, because:</p>
      <ul>
        <li>Orbital motion is curved (accelerating toward the Sun)</li>
        <li>The Sagnac effect should detect any motion relative to the
            light-carrying medium</li>
      </ul>

      <h4>Geocentric Interpretation</h4>
      <p>Earth rotates within a local aether frame, and this rotation is
      detectable. Earth does not orbit the Sun, so there is no orbital
      motion to detect. The results are exactly what the geocentric
      model predicts.</p>
    `}}var h=o;export{o as WangFiberExperiment,h as default};

//# sourceMappingURL=wangFiber.js.map
