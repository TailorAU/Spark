/*
 * Spark — GPU visual layer (SPARK_FX)
 * Procedural WebGL scene backdrops + canvas particle systems for the
 * worksheets. Self-contained, no assets, no libraries; degrades gracefully:
 * if WebGL is unavailable the SVG scenes render exactly as before, and
 * prefers-reduced-motion gets a single static frame instead of a loop.
 *
 *   SPARK_FX.available          — WebGL usable on this device
 *   SPARK_FX.scene(el, theme)   — mount an animated backdrop into el -> {destroy}
 *   SPARK_FX.burst(x, y, cols)  — particle pop at viewport point (correct taps)
 *   SPARK_FX.confetti(cols)     — full-screen physics confetti -> {destroy}
 */
(function () {
  "use strict";

  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- WebGL scene renderer -------------------------------------------------
  const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

  // Shared GLSL helpers: hash, value noise, fbm.
  const PRELUDE = `
precision highp float;
uniform vec2 R;uniform float T;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n2(p);p*=2.03;a*=.5;}return s;}
`;

  const SCENE_SHADERS = {
    // Tropical day: layered sky, drifting clouds, sun bloom, living ocean with
    // wave shading, moving specular sparkle and a sun-glint column.
    fiji: `
void main(){
  vec2 uv=gl_FragCoord.xy/R; float asp=R.x/R.y;
  float horizon=.56; vec3 col;
  if(uv.y>horizon){
    col=mix(vec3(.84,.95,.99),vec3(.42,.75,.94),(uv.y-horizon)/(1.-horizon));
    float c=fbm(vec2(uv.x*3.2+T*.025,uv.y*7.));
    col=mix(col,vec3(1.),smoothstep(.52,.78,c)*.75);
    vec2 sp=vec2(.85,.8); float d=distance(vec2(uv.x*asp,uv.y),vec2(sp.x*asp,sp.y));
    col+=vec3(1.,.86,.45)*exp(-d*16.)*1.15+vec3(1.,.72,.3)*exp(-d*4.)*.22;
  }else{
    float depth=(horizon-uv.y)/horizon;
    col=mix(vec3(.3,.74,.87),vec3(.04,.33,.58),depth);
    float w=fbm(vec2(uv.x*8.+T*.4,uv.y*36.-T*.7));
    col+=vec3(.05,.07,.08)*sin(uv.y*80.+w*9.+T*2.2)*(.3+depth);
    float spk=pow(n2(vec2(uv.x*90.+T*3.,uv.y*150.-T*4.5)),9.);
    col+=vec3(1.,.97,.88)*spk*(.35+depth);
    col+=vec3(.95,.78,.42)*exp(-pow((uv.x-.85)*5.5,2.))*.14*(1.-depth*.6);
    col+=vec3(1.)*smoothstep(.985,1.,sin(uv.y*60.-T*1.6+fbm(uv*7.)*4.))*.25;
  }
  gl_FragColor=vec4(col,1.);
}`,
    // Night camp: deep-blue gradient, twinkling star grid, soft moon halo,
    // faint aurora bands, dark ground, flickering firelight + rising embers.
    camping: `
void main(){
  vec2 uv=gl_FragCoord.xy/R; float asp=R.x/R.y;
  vec3 col=mix(vec3(.12,.18,.38),vec3(.03,.05,.16),uv.y);
  vec2 g=uv*vec2(44.,26.); vec2 id=floor(g); float st=h21(id);
  if(st>.92&&uv.y>.32){
    vec2 f=fract(g)-.5; float d=length(f);
    float tw=.45+.55*sin(T*(1.+st*4.)+st*40.);
    col+=vec3(1.,.96,.86)*exp(-d*13.)*tw;
  }
  float au=fbm(vec2(uv.x*3.-T*.05,uv.y*2.))*smoothstep(.45,.9,uv.y)*smoothstep(1.,.7,uv.y);
  col+=vec3(.1,.5,.35)*pow(au,2.2)*.55;
  vec2 mp=vec2(.83,.8); float md=distance(vec2(uv.x*asp,uv.y),vec2(mp.x*asp,mp.y));
  col+=vec3(.85,.9,1.)*exp(-md*9.)*.5;
  col=mix(col,vec3(.05,.1,.08),smoothstep(.24,.18,uv.y));
  float fl=.75+.3*n2(vec2(T*5.,3.7));
  float fd=distance(vec2(uv.x*asp,uv.y),vec2(.75*asp,.26));
  col+=vec3(1.,.5,.16)*exp(-fd*6.5)*.65*fl;
  for(int i=0;i<9;i++){
    float fi=float(i);
    float lt=fract(T*.22+fi*.111);
    vec2 ep=vec2(.75+.05*sin(T*1.7+fi*7.3)*lt+(h21(vec2(fi,1.))-.5)*.06, .27+lt*.5);
    float ed=distance(vec2(uv.x*asp,uv.y),vec2(ep.x*asp,ep.y));
    col+=vec3(1.,.55,.18)*exp(-ed*110.)*(1.-lt);
  }
  gl_FragColor=vec4(col,1.);
}`,
    // Race day: bright sky, rotating sun rays, drifting clouds, layered
    // grass with texture, a moving dashed track and drifting pollen motes.
    crosscountry: `
void main(){
  vec2 uv=gl_FragCoord.xy/R; float asp=R.x/R.y;
  vec3 col=mix(vec3(.86,.96,1.),vec3(.55,.83,.96),uv.y);
  vec2 sp=vec2(.14,.8); vec2 dv=vec2((uv.x-sp.x)*asp,uv.y-sp.y);
  float d=length(dv); float ang=atan(dv.y,dv.x);
  col+=vec3(1.,.9,.5)*exp(-d*12.)*.85;
  col+=vec3(1.,.85,.45)*pow(abs(sin(ang*7.+T*.25)),30.)*exp(-d*2.6)*.25;
  float c=fbm(vec2(uv.x*3.5+T*.03,uv.y*8.));
  col=mix(col,vec3(1.),smoothstep(.55,.8,c)*.6*step(.55,uv.y));
  if(uv.y<.5){
    float band=(0.5-uv.y)*2.;
    col=mix(vec3(.48,.78,.42),vec3(.25,.6,.3),band);
    col*=.94+.12*fbm(uv*vec2(22.,30.));
    float tr=smoothstep(.2,.16,uv.y)*smoothstep(.06,.1,uv.y);
    col=mix(col,vec3(.9,.87,.78),tr*.85);
    float dash=step(.5,fract(uv.x*10.-T*.5));
    col=mix(col,vec3(.98),tr*dash*.5);
  }
  float mote=pow(n2(vec2(uv.x*50.+T*.8,uv.y*50.+T*.4)),12.);
  col+=vec3(1.,1.,.8)*mote*.5;
  gl_FragColor=vec4(col,1.);
}`,
    // Home morning: peach-to-blue sky, soft sun, floating bokeh, green lawn.
    everyday: `
void main(){
  vec2 uv=gl_FragCoord.xy/R; float asp=R.x/R.y;
  vec3 col=mix(vec3(1.,.9,.78),vec3(.62,.85,.96),pow(uv.y,.8));
  vec2 sp=vec2(.15,.8); float d=distance(vec2(uv.x*asp,uv.y),vec2(sp.x*asp,sp.y));
  col+=vec3(1.,.88,.5)*exp(-d*11.)*.9;
  for(int i=0;i<7;i++){
    float fi=float(i);
    vec2 bp=vec2(h21(vec2(fi,2.)), fract(h21(vec2(fi,5.))+T*.03*(1.+fi*.2)));
    float bd=distance(vec2(uv.x*asp,uv.y),vec2(bp.x*asp,bp.y));
    col+=vec3(1.,.95,.8)*exp(-bd*40.)*.12;
  }
  col=mix(col,vec3(.45,.75,.45)*(0.9+.15*fbm(uv*vec2(18.,26.))),smoothstep(.22,.18,uv.y));
  gl_FragColor=vec4(col,1.);
}`,
  };

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || "shader compile failed");
    }
    return s;
  }

  let glProbe = null;
  function webglAvailable() {
    if (glProbe !== null) return glProbe;
    try {
      const c = document.createElement("canvas");
      glProbe = !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
    } catch (_) {
      glProbe = false;
    }
    return glProbe;
  }

  function scene(container, themeId) {
    const frag = SCENE_SHADERS[themeId] || SCENE_SHADERS.everyday;
    if (!webglAvailable()) return null;
    const canvas = document.createElement("canvas");
    canvas.className = "fx-scene";
    let gl;
    try {
      gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
      if (!gl) return null;
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, PRELUDE + frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const uR = gl.getUniformLocation(prog, "R");
      const uT = gl.getUniformLocation(prog, "T");

      container.prepend(canvas);
      container.classList.add("gl");

      let raf = 0, dead = false;
      const t0 = performance.now() + Math.random() * 4000;
      function size() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const w = Math.max(1, Math.round(container.clientWidth * dpr));
        const h = Math.max(1, Math.round(container.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      }
      function frame(now) {
        if (dead) return;
        size();
        gl.uniform2f(uR, canvas.width, canvas.height);
        gl.uniform1f(uT, (now - t0) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!REDUCED) raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      return {
        destroy() {
          dead = true;
          cancelAnimationFrame(raf);
          try { gl.getExtension("WEBGL_lose_context")?.loseContext(); } catch (_) {}
          canvas.remove();
        },
      };
    } catch (_) {
      canvas.remove();
      return null;
    }
  }

  // --- 2D particle overlay (tap bursts) ---------------------------------------
  let overlay = null, octx = null, parts = [], oraf = 0;
  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement("canvas");
    overlay.className = "fx-overlay";
    document.body.appendChild(overlay);
    octx = overlay.getContext("2d");
  }
  function overlaySize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    if (overlay.width !== w || overlay.height !== h) {
      overlay.width = w;
      overlay.height = h;
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  function overlayLoop() {
    overlaySize();
    octx.clearRect(0, 0, innerWidth, innerHeight);
    const now = performance.now();
    parts = parts.filter((p) => now < p.die);
    for (const p of parts) {
      const t = 1 - (p.die - now) / p.life;
      const x = p.x + p.vx * t * p.life * 0.06;
      const y = p.y + p.vy * t * p.life * 0.06 + 130 * t * t;
      octx.globalAlpha = 1 - t;
      octx.fillStyle = p.color;
      if (p.star) {
        octx.font = `${p.r * 2.4}px sans-serif`;
        octx.textAlign = "center";
        octx.fillText("✦", x, y);
      } else {
        octx.beginPath();
        octx.arc(x, y, p.r * (1 - t * 0.5), 0, 7);
        octx.fill();
      }
    }
    octx.globalAlpha = 1;
    if (parts.length) oraf = requestAnimationFrame(overlayLoop);
    else { oraf = 0; octx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function burst(x, y, colors) {
    if (REDUCED) return;
    ensureOverlay();
    const cols = colors && colors.length ? colors : ["#f2b01e", "#2f9e57", "#e8833a"];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.random() * 0.5;
      const sp = 2.2 + Math.random() * 3.4;
      parts.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.6,
        r: 3 + Math.random() * 4,
        color: cols[i % cols.length],
        life: 520 + Math.random() * 260,
        die: performance.now() + 520 + Math.random() * 260,
        star: i % 5 === 0,
      });
    }
    if (!oraf) oraf = requestAnimationFrame(overlayLoop);
  }

  // --- physics confetti (worksheet finish) -------------------------------------
  function confetti(colors) {
    if (REDUCED) return null;
    ensureOverlay();
    const cols = colors && colors.length ? colors : ["#f2b01e", "#2f9e57", "#e8833a", "#4a90d9", "#c25fc4"];
    const pieces = [];
    for (let i = 0; i < 130; i++) {
      pieces.push({
        x: Math.random() * innerWidth,
        y: -20 - Math.random() * innerHeight * 0.5,
        vx: (Math.random() - 0.5) * 1.6,
        vy: 1.6 + Math.random() * 2.6,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.24,
        color: cols[i % cols.length],
        sway: Math.random() * Math.PI * 2,
      });
    }
    let raf = 0, dead = false;
    const t0 = performance.now();
    function loop(now) {
      if (dead) return;
      overlaySize();
      octx.clearRect(0, 0, innerWidth, innerHeight);
      const elapsed = (now - t0) / 1000;
      let alive = false;
      for (const p of pieces) {
        p.x += p.vx + Math.sin(elapsed * 3 + p.sway) * 0.7;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y < innerHeight + 30) alive = true;
        octx.save();
        octx.translate(p.x, p.y);
        octx.rotate(p.rot);
        octx.fillStyle = p.color;
        octx.globalAlpha = elapsed > 3.4 ? Math.max(0, 1 - (elapsed - 3.4) / 0.6) : 1;
        octx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (0.4 + 0.6 * Math.abs(Math.sin(p.rot * 2))));
        octx.restore();
      }
      octx.globalAlpha = 1;
      if (alive && elapsed < 4) raf = requestAnimationFrame(loop);
      else octx.clearRect(0, 0, innerWidth, innerHeight);
    }
    raf = requestAnimationFrame(loop);
    return {
      destroy() {
        dead = true;
        cancelAnimationFrame(raf);
        if (octx) octx.clearRect(0, 0, innerWidth, innerHeight);
      },
    };
  }

  window.SPARK_FX = {
    get available() { return webglAvailable(); },
    reduced: REDUCED,
    scene,
    burst,
    confetti,
  };
})();
