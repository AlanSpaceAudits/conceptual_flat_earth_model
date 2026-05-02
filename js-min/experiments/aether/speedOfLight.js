import{BaseExperiment as r}from"../baseExperiment.js";class a extends r{static get id(){return"speed-of-light"}static get name(){return"Speed of Light: Independence from Motion"}static get category(){return"aether"}static get description(){return"c derives from \u03B5\u2080\u03BC\u2080, not from relativistic postulates."}init(){this.epsilon0=8854e-15,this.mu0=1257e-9,this.c=299792458,this.cFromMaxwell=1/Math.sqrt(this.epsilon0*this.mu0),this.showEinsteinDerivation=!0,this.showMaxwellDerivation=!0,this.animationPhase=0}activate(){super.activate(),this.model.setState({ShowVault:!1,ShowFeGrid:!1,Description:"Speed of Light: Maxwell derived c from the medium in 1865."})}update(e){this.active&&(this.animationPhase+=e)}buildControls(e){const s=document.createElement("h3");s.textContent="Speed of Light: Independence from Motion",e.appendChild(s);const t=document.createElement("div");t.className="experiment-question",t.innerHTML=`
      <h4>The Question</h4>
      <p>Can the speed of light be derived independent of motion?</p>
    `,e.appendChild(t);const i=document.createElement("div");i.className="experiment-hypothesis",i.innerHTML=`
      <h4>Null Hypothesis</h4>
      <p><strong>H\u2081:</strong> Einstein successfully derived c independent of a medium
      and relative motion as asserted by his 2nd postulate.</p>
      <p><strong>H\u2080:</strong> Einstein failed to derive c independent of a medium
      and relative motion as asserted by his 2nd postulate.</p>
    `,e.appendChild(i);const n=document.createElement("div");n.className="experiment-maxwell",n.innerHTML=`
      <h4>Maxwell's Derivation (1865)</h4>
      <p class="formula">c = 1/\u221A(\u03B5\u2080\u03BC\u2080)</p>
      <table>
        <tr><td>\u03B5\u2080 (vacuum permittivity)</td><td>${this.epsilon0.toExponential(3)} F/m</td></tr>
        <tr><td>\u03BC\u2080 (vacuum permeability)</td><td>${this.mu0.toExponential(3)} H/m</td></tr>
        <tr><td>Calculated c</td><td><strong>${Math.round(this.cFromMaxwell).toLocaleString()} m/s</strong></td></tr>
      </table>
      <p><strong>No v. No frames. No relative motion.</strong></p>
      <p>The speed of propagation is a property of the medium.</p>
    `,e.appendChild(n),this.createToggle(e,"Show Einstein Derivation",this.showEinsteinDerivation,o=>{this.showEinsteinDerivation=o}),this.createToggle(e,"Show Maxwell Derivation",this.showMaxwellDerivation,o=>{this.showMaxwellDerivation=o}),this.createComparisonPanel(e,`<strong>Einstein (1905):</strong><br>
       Uses c\xB1v in Section 3 to derive Lorentz transformation.<br>
       "the ray moves relatively to the initial point of k... with the velocity c - v"<br><br>
       <strong>Problem:</strong> Assumes c is independent of motion, then uses c\xB1v.`,`<strong>Maxwell (1865):</strong><br>
       c = 1/\u221A(\u03B5\u2080\u03BC\u2080)<br>
       Measured from capacitance and inductance experiments.<br><br>
       <strong>No motion involved.</strong> c is a property of the medium.`)}getInfoPanel(){return`
      <h3>Speed of Light: Independence from Motion</h3>

      <h4>Einstein's Claim (1905)</h4>
      <blockquote style="border-left:2px solid #88a; padding-left:10px; color:#aaa;">
        <strong>Postulate 2:</strong> "Any ray of light moves in the 'stationary' system
        of co-ordinates with the determined velocity c, whether the ray be emitted by
        a stationary or by a moving body."
      </blockquote>
      <p>Einstein also states that a "luminiferous aether" is superfluous \u2014 no medium,
      no preferred frame. All frames are equivalent and c is the same in all of them.</p>

      <h4>The Contradiction</h4>
      <p>In Section 3, Einstein writes the travel times:</p>
      <p class="formula">t\u2081 = x'/(c - v)&nbsp;&nbsp;&nbsp;&nbsp;t\u2082 = x'/(c + v)</p>
      <p>He explicitly states on p.7:</p>
      <blockquote style="border-left:2px solid #c66; padding-left:10px; color:#aaa;">
        "the ray moves relatively to the initial point of k, when measured in the
        stationary system, with the velocity <strong>c - v</strong>"
      </blockquote>

      <h4>The Logical Structure</h4>
      <ol>
        <li><strong>Assume</strong> c is independent of motion (Postulate 2)</li>
        <li><strong>Write</strong> travel times using c\xB1v (light speed depends on motion)</li>
        <li><strong>Derive</strong> the Lorentz transformation from c\xB1v</li>
        <li><strong>Apply</strong> the transformation to the wave equation</li>
        <li><strong>Conclude</strong> c is invariant (matches the assumption)</li>
      </ol>
      <p><strong>Step 2 contradicts Step 1.</strong> The derivation of motion-independence
      requires motion-dependence. The conclusion is guaranteed by construction, not physics.</p>

      <h4>Maxwell's Alternative (1865)</h4>
      <p class="formula">c = 1/\u221A(\u03B5\u2080\u03BC\u2080) = 299,792,458 m/s</p>
      <ul>
        <li>\u03B5\u2080 measured from capacitance experiments (static charges, no motion)</li>
        <li>\u03BC\u2080 measured from inductance experiments (steady currents)</li>
        <li>No v, no frames, no relative motion</li>
      </ul>
      <p>The speed emerges from two laboratory-measured constants of the medium.
      It is genuinely independent of motion because <strong>motion never enters the derivation</strong>.</p>

      <h4>The Lorentz Factor is Classical Geometry</h4>
      <p>The factor \u03B3 = 1/\u221A(1 - v\xB2/c\xB2) is presented as relativistic spacetime. It is Pythagoras:</p>
      <p class="formula">c\u03C4 = \u221A((ct)\xB2 - (vt)\xB2)</p>
      <p>If ct is the hypotenuse and vt is one leg, c\u03C4 is the other leg. Voigt had this
      in 1887, Lorentz in 1895 \u2014 both before Einstein.</p>

      <h4>c is a Defined Conversion Factor</h4>
      <p>Since 1983, the meter is defined as the distance light travels in 1/299,792,458
      of a second. The value is exact by definition \u2014 a conversion factor between space
      and time units, not a measured speed.</p>

      <h4>Result</h4>
      <table>
        <tr><th>Derivation</th><th>Uses v?</th><th>Assumes c constant?</th><th>Derives c from?</th></tr>
        <tr><td>Einstein (1905)</td><td>Yes (c\xB1v)</td><td>Yes (Postulate 2)</td><td>Relative motion</td></tr>
        <tr><td>Maxwell (1865)</td><td>No</td><td>No</td><td>Medium properties</td></tr>
      </table>

      <h4>Conclusion</h4>
      <p><strong>H\u2080 stands.</strong> Einstein's derivation depends on c\xB1v. The Lorentz
      transformation returns c as invariant by algebraic construction, not physical demonstration.</p>
      <p>Maxwell derived c = 1/\u221A(\u03B5\u2080\u03BC\u2080) in 1865 from the medium Einstein claimed was superfluous.
      The medium was sufficient.</p>

      <h4>Citations</h4>
      <ul>
        <li>Einstein, A. (1905). "Zur Elektrodynamik bewegter K\xF6rper." <em>Annalen der Physik</em>, 17, 891-921</li>
        <li>Maxwell, J.C. (1865). "A Dynamical Theory of the Electromagnetic Field." <em>Phil. Trans.</em>, 155, 459-512</li>
        <li>Gerber, P. (1898). "Die r\xE4umliche und zeitliche Ausbreitung der Gravitation." <em>Z. Math. Phys.</em>, 43, 93-104</li>
        <li>Debono, F. (2025). "Lacunae in the Philosophical Foundations of Special Relativity." <em>Open Astronomy</em>, 34(1)</li>
      </ul>

      <p style="margin-top:12px; font-size:11px; color:#888;">
        <a href="https://publish.obsidian.md/spaceaudits/Null_Hypothesis/Speed_of_Light/Speed_of_Light_Null" target="_blank" style="color:#f4a640;">
          \u{1F4DA} Speed of Light Null Hypothesis \u2192
        </a>
      </p>
    `}}var h=a;export{a as SpeedOfLightExperiment,h as default};

//# sourceMappingURL=speedOfLight.js.map
