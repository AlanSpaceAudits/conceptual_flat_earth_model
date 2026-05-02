import{BaseExperiment as n}from"../baseExperiment.js";class o extends n{static get id(){return"dayton-miller"}static get name(){return"Dayton Miller (1925-1933)"}static get category(){return"aether"}static get description(){return"200,000+ readings at Mt. Wilson showed consistent ~10 km/s signal."}init(){this.observedDrift=10,this.expectedOrbital=30,this.totalReadings=2e5,this.yearsOfData=8,this.altitude=1750,this.animationPhase=0,this.showSiderealVariation=!0}activate(){super.activate(),this.model.setState({ShowVault:!1,ShowFeGrid:!1,Description:"Dayton Miller: Consistent aether drift signal ignored by mainstream."})}update(e){this.active&&(this.animationPhase+=e*.5)}buildControls(e){const s=document.createElement("h3");s.textContent="Dayton Miller Experiments",e.appendChild(s);const t=document.createElement("div");t.className="experiment-credentials",t.innerHTML=`
      <p><strong>Dayton C. Miller</strong> (1866-1941)</p>
      <ul>
        <li>Professor of Physics, Case School of Applied Science</li>
        <li>President of the American Physical Society (1925)</li>
        <li>Member of the National Academy of Sciences</li>
        <li>Collaborated with Morley on early interferometer work</li>
      </ul>
    `,e.appendChild(t);const i=document.createElement("div");i.className="experiment-data",i.innerHTML=`
      <h4>Experimental Data</h4>
      <table>
        <tr><td>Total readings:</td><td><strong>${this.totalReadings.toLocaleString()}+</strong></td></tr>
        <tr><td>Duration:</td><td><strong>${this.yearsOfData} years (1925-1933)</strong></td></tr>
        <tr><td>Location:</td><td><strong>Mt. Wilson Observatory (${this.altitude}m)</strong></td></tr>
        <tr><td>Observed drift:</td><td><strong>~${this.observedDrift} km/s</strong></td></tr>
        <tr><td>Expected (orbital):</td><td><strong>${this.expectedOrbital} km/s</strong></td></tr>
      </table>
    `,e.appendChild(i);const r=document.createElement("div");r.className="experiment-findings",r.innerHTML=`
      <h4>Key Findings</h4>
      <ul>
        <li><strong>Consistent signal:</strong> ~10 km/s drift detected</li>
        <li><strong>Sidereal variation:</strong> Signal varied with sidereal time, not solar time</li>
        <li><strong>Seasonal variation:</strong> Amplitude changed with Earth's position</li>
        <li><strong>Direction:</strong> Apex near constellation Dorado (southern sky)</li>
      </ul>
    `,e.appendChild(r),this.createToggle(e,"Show Sidereal Variation",this.showSiderealVariation,a=>{this.showSiderealVariation=a}),this.createComparisonPanel(e,`<strong>Mainstream dismissal:</strong> Results attributed to
       "thermal effects" and "systematic errors."<br><br>
       <strong>Problem:</strong> Miller specifically designed experiments
       to eliminate thermal effects. His data showed sidereal (not solar)
       variation, ruling out thermal causes.`,`<strong>Geocentric interpretation:</strong> The ~10 km/s signal
       represents local aether drift past stationary Earth.<br><br>
       The sidereal variation indicates the drift is cosmic in origin,
       not related to Earth's alleged orbital motion.`)}getInfoPanel(){return`
      <h3>Dayton Miller Experiments (1925-1933)</h3>

      <p><strong>Background:</strong> After the Michelson-Morley null result,
      most physicists abandoned aether research. Dayton Miller disagreed and
      spent decades conducting more sensitive experiments.</p>

      <h4>The Experiments</h4>
      <p>Miller built the most sensitive interferometer of his era and conducted
      experiments at Mt. Wilson Observatory (1,750m altitude) to reduce
      atmospheric interference. Over 8 years, he collected more than
      <strong>200,000 individual readings</strong>.</p>

      <h4>Results</h4>
      <p>Miller consistently detected an aether drift of approximately
      <strong>10 km/s</strong>, with the following characteristics:</p>
      <ul>
        <li>Signal varied with <strong>sidereal time</strong> (star time),
            not solar time \u2014 ruling out thermal effects</li>
        <li>Amplitude showed <strong>seasonal variation</strong></li>
        <li>Direction pointed toward the constellation <strong>Dorado</strong>
            in the southern sky</li>
      </ul>

      <h4>Why Not 30 km/s?</h4>
      <p>Miller's 10 km/s result was much smaller than the 30 km/s expected
      from Earth's orbital velocity. He proposed that the aether was partially
      dragged by Earth's mass, reducing the apparent wind speed.</p>

      <h4>Mainstream Response</h4>
      <p>Miller's results were dismissed as "thermal effects" despite his
      careful experimental design. A 1955 paper by Shankland et al. claimed
      to debunk Miller's work, but their analysis has been criticized for
      statistical errors and selective data interpretation.</p>

      <h4>Geocentric Interpretation</h4>
      <p>The ~10 km/s signal represents genuine aether drift past a
      stationary Earth. The sidereal variation indicates the drift is
      related to Earth's rotation within the cosmic aether frame, not
      to any orbital motion.</p>

      <p>The fact that the signal was NOT 30 km/s is significant \u2014 it
      suggests Earth is not orbiting the Sun at that velocity.</p>

      <h4>Modern Relevance</h4>
      <p>Miller's data has been re-analyzed by several researchers who
      confirm his statistical methods were sound. His work represents
      the most extensive interferometer dataset ever collected, yet it
      remains largely ignored by mainstream physics.</p>
    `}}var h=o;export{o as DaytonMillerExperiment,h as default};

//# sourceMappingURL=daytonMiller.js.map
