"use client";

import { useEffect, useRef } from "react";

/**
 * The opening: the SHAKSHI logo glowing on black. After `hold` seconds it breaks into smoke that
 * curls upward and thins away, revealing the house. Drawn with one small WebGL shader.
 */
const VERT = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D logo; uniform float t; uniform float k; uniform vec2 res; uniform vec2 logoSize;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int j = 0; j < 6; j++){ v += a*n(p); p = p*2.03 + 17.0; a *= 0.5; } return v; }
vec2 logoUV(vec2 q){ // centred logo, preserving its aspect
  vec2 c = (q - 0.5) * res / min(res.x, res.y);
  return c / logoSize + 0.5;
}
float logoA(vec2 q){ vec2 l = logoUV(q); return (l.x<0.0||l.x>1.0||l.y<0.0||l.y>1.0) ? 0.0 : texture(logo, vec2(l.x, 1.0-l.y)).a; }
void main(){
  vec2 q = uv;
  // Before the smoke: the logo breathes softly
  float breathe = 0.92 + 0.08 * sin(t * 1.6);
  // Smoke field, drifting and curling upward
  vec2 sp = q * vec2(res.x/res.y, 1.0) * 3.2;
  float f = fbm(sp + vec2(0.0, -t * 0.35) + fbm(sp * 0.7 + t * 0.12) * 1.6);
  // Dissolve front sweeps up the screen, frayed by the smoke
  float front = k * 1.5 - 0.25 + (1.0 - q.y) * 0.35;
  float solid = smoothstep(front - 0.08, front + 0.08, f + (1.0 - q.y) * 0.25);
  // The logo, torn into wisps that lift and drift as it dissolves
  vec2 lift = vec2((f - 0.5) * 0.12, -k * 0.22) * k;
  float a = logoA(q + lift * (1.0 - solid));
  float ember = smoothstep(0.0, 0.12, abs(f - front + 0.02)) ;
  vec3 pearl = vec3(0.96, 0.94, 0.91);
  vec3 gold = vec3(0.86, 0.69, 0.43);
  vec3 logoCol = mix(gold * 1.4, pearl, ember) * breathe;
  float logoVis = a * mix(0.0, 1.0, solid);
  // Smoke glows faintly where the logo was, and fills the dark as it thins
  float smoke = smoothstep(0.35, 0.9, f) * (1.0 - smoothstep(0.55, 1.0, k)) * (0.25 + 0.75 * k);
  float wisp = logoA(q + vec2((f - 0.5) * 0.3, -0.35 * k)) * k * (1.0 - k) * 1.6;
  // Black curtain, eaten away by the smoke from the bottom up
  float curtain = smoothstep(front - 0.25, front + 0.05, f * 0.9 + q.y * 0.45);
  curtain = k <= 0.0 ? 1.0 : curtain;
  vec3 col = mix(vec3(0.04, 0.045, 0.06), pearl, clamp(smoke * 0.35 + wisp * 0.6, 0.0, 1.0));
  float alpha = clamp(max(curtain, smoke * 0.5 + wisp), 0.0, 1.0);
  col = mix(col, logoCol, logoVis);
  alpha = max(alpha, logoVis);
  o = vec4(col * alpha, alpha);
}`;

export function IntroSmoke({ hold = 3, dissolve = 2.4, ready, onDone }: { hold?: number; dissolve?: number; ready: boolean; onDone: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const c = canvas.current!;
    const gl = c.getContext("webgl2", { premultipliedAlpha: true, alpha: true });
    if (!gl) {
      // No WebGL: a simple fade instead
      const t = setTimeout(() => done.current(), hold * 1000);
      return () => clearTimeout(t);
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // The logo, drawn from the brand's lockup artwork into a texture
    const tex = gl.createTexture();
    let logoAspect = 2000 / 849;
    const img = new Image();
    img.onload = () => {
      const w = 1600;
      const h = Math.round(w / (img.width / img.height || logoAspect));
      logoAspect = w / h;
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const g = cv.getContext("2d")!;
      g.drawImage(img, 0, 0, w, h);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    img.src = "/brand/shakshi-lockup.svg";

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const start = performance.now();
    let dissolveStart = -1;
    let raf = 0;
    const frame = (now: number) => {
      const dpr = Math.min(devicePixelRatio, 1.5);
      const w = Math.round(c.clientWidth * dpr);
      const h = Math.round(c.clientHeight * dpr);
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
        gl.viewport(0, 0, w, h);
      }
      const t = (now - start) / 1000;
      // Hold the logo for `hold` seconds, and until the house is ready behind it
      if (dissolveStart < 0 && t >= hold && readyRef.current) dissolveStart = t;
      const k = dissolveStart < 0 ? 0 : Math.min(1, (t - dissolveStart) / dissolve);
      const size = Math.min(w, h) < 700 ? 0.78 : 0.62; // logo width as a share of the shorter side
      gl.uniform1f(u("t"), t);
      gl.uniform1f(u("k"), k);
      gl.uniform2f(u("res"), w, h);
      gl.uniform2f(u("logoSize"), size * (w > h ? 1 : 1), (size / logoAspect));
      gl.uniform1i(u("logo"), 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (k >= 1) {
        done.current();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [hold, dissolve]);

  return <canvas ref={canvas} className="fixed inset-0 z-[60] h-full w-full" aria-hidden />;
}
