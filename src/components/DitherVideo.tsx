import { useEffect, useRef, useState } from "react";

/* ══ Dither video ═════════════════════════════════════════
   The hero video, ordered-dithered into dots of ink on paper,
   and the dots flee the pointer and spring home behind it.

   ── ONE POINT PER DITHER CELL ────────────────────────────
   Every cell of the dither grid is a GL point. The vertex
   shader samples the video at the point's home, runs the
   Bayer threshold there, and either drops the point (paper) or
   draws it as an ink dot. So the picture is still decided per
   cell, exactly as a flat dither would be, but each dot can be
   somewhere other than home.

   ── WHERE THE DOTS ARE: A SPRING PER CELL ────────────────
   Each cell carries an offset and a velocity (RGBA32F texture:
   ox, oy, vx, vy). The pointer pushes cells within reach with
   (1 − d/R)² × force; every displaced cell is pulled home at
   0.05 and damped by 0.84 per frame. The damping is RAISED to
   the frame time rather than multiplied by it, so a dropped
   frame bleeds the same energy as the two it replaced. This is
   the flow from Bencho's Particles (bencho.dev, MIT).

   Only the region that is actually moving is simulated and
   uploaded: a box round the pointer's reach, kept alive until
   every cell in it has settled, then dropped.

   ── STRETCHED BY SPEED ──────────────────────────────────
   A dot at rest fills its cell, so the still image reads as a
   plain dither. A moving dot is drawn long along its path and
   thin across it, which makes a sweep read as flow rather than
   a scatter of points. */

const VERTEX = `#version 300 es
precision highp float;
uniform sampler2D video;
uniform highp sampler2D offsets;
uniform vec2 resolution;
uniform float cell;
uniform float dpr;
uniform int cols;
uniform float develop; // 0..1 first-load reveal: each dot appears once this passes its seed
out vec2 vVel;
out float vStretch;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  int ix = gl_VertexID % cols;
  int iy = gl_VertexID / cols;
  vec2 cellCoord = vec2(ix, iy);
  vec2 home = (cellCoord + 0.5) * cell;
  vec2 frame = home / resolution;
  vec3 color = textureLod(video, vec2(frame.x, 1.0 - frame.y), 0.0).rgb;
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  // Push the video's near-white ground to pure paper and its shadows to solid ink.
  lum = smoothstep(0.02, 0.9, pow(lum, 0.62));
  // Fade to paper at the bottom (the source crops the shoulders) and the side edges, inside
  // the dither so the fade is dots thinning out rather than a soft grey.
  float edge = smoothstep(0.0, 0.34, frame.y) * smoothstep(0.0, 0.1, frame.x) * smoothstep(1.0, 0.9, frame.x);
  lum = mix(1.0, lum, edge);
  float paper = step(bayer8(cellCoord) + 0.0078, lum);
  // Develop: until its random seed is passed, a dot stays paper, so the head fills in from
  // scattered dots like a print developing.
  paper = max(paper, step(develop, hash(cellCoord)));
  if (paper > 0.5) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }
  vec4 o = texelFetch(offsets, ivec2(ix, iy), 0);
  float speed = length(o.zw) / dpr;
  float stretch = speed < 0.3 ? 1.0 : min(2.6, 1.0 + speed * 0.12);
  vVel = o.zw;
  vStretch = stretch;
  gl_PointSize = cell * stretch;
  gl_Position = vec4((home + o.xy) / resolution * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vVel;
in float vStretch;
uniform vec3 ink;
out vec4 outColor;
void main() {
  if (vStretch > 1.001) {
    // Long along its path, a little thin across it.
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    p.y = -p.y;
    float rot = atan(vVel.y, vVel.x);
    vec2 q = vec2(cos(rot) * p.x + sin(rot) * p.y, -sin(rot) * p.x + cos(rot) * p.y);
    float across = vStretch * sqrt(vStretch);
    if (q.x * q.x + (q.y * across) * (q.y * across) > 1.0) discard;
  }
  outColor = vec4(ink, 1.0);
}`;

/* The develop reveal plays once per visit, not every time the index remounts. */
let developed = false;
const DEVELOP_MS = 1300;

/* Pointer push, CSS pixels and Bencho's 0..100 force scale. */
const REACH = 80;
const FORCE = 60;
const SPRING = 0.05;
const DAMPING = 0.84;

const hex = (value: string) =>
  [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255) as [number, number, number];

/**
 * The hero video drawn as dithered dots on a canvas laid over it. The <video> stays visible
 * underneath (browsers may pause hidden autoplay video) and is fully covered by the opaque
 * canvas. Without WebGL 2 the plain video is all that shows.
 */
export function DitherVideo({ cell = 2 }: { cell?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false });
    if (!gl) {
      setFallback(true);
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFallback(true);
      return;
    }
    gl.useProgram(program);
    gl.bindVertexArray(gl.createVertexArray()); // points come from gl_VertexID; no buffers

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "video"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "offsets"), 1);

    const styles = getComputedStyle(document.documentElement);
    const paper = hex(styles.getPropertyValue("--paper").trim() || "#f3f3f3");
    gl.uniform3fv(gl.getUniformLocation(program, "ink"), hex(styles.getPropertyValue("--ink").trim() || "#111110"));
    gl.clearColor(paper[0], paper[1], paper[2], 1);
    const resolutionU = gl.getUniformLocation(program, "resolution");
    const cellU = gl.getUniformLocation(program, "cell");
    const dprU = gl.getUniformLocation(program, "dpr");
    const colsU = gl.getUniformLocation(program, "cols");
    const developU = gl.getUniformLocation(program, "develop");

    // Grid state, rebuilt on resize. Offsets are device pixels, GL orientation (y up).
    let dpr = 1;
    let cellPx = cell;
    let cols = 0;
    let rows = 0;
    let state = new Float32Array(0); // per cell: ox, oy, vx, vy
    let box: [number, number, number, number] | null = null; // live region: c0, r0, c1, r1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      cellPx = cell * dpr;
      cols = Math.ceil(canvas.width / cellPx);
      rows = Math.ceil(canvas.height / cellPx);
      state = new Float32Array(cols * rows * 4);
      box = null;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolutionU, canvas.width, canvas.height);
      gl.uniform1f(cellU, cellPx);
      gl.uniform1f(dprU, dpr);
      gl.uniform1i(colsU, cols);
      gl.activeTexture(gl.TEXTURE1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, cols, rows, 0, gl.RGBA, gl.FLOAT, state);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // Pointer, in device pixels with y up; null when it is nowhere near the canvas.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hand: { x: number; y: number } | null = null;
    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const inside = x > -REACH && y > -REACH && x < r.width + REACH && y < r.height + REACH;
      hand = inside ? { x: x * dpr, y: canvas.height - y * dpr } : null;
    };
    const onLeave = () => {
      hand = null;
    };
    if (!reduced) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }

    /* One step of the springs over the live region. Returns the rows that changed. */
    const step = (dt: number): [number, number] | null => {
      const R = REACH * dpr;
      const S = (FORCE / 100) * 11 * dpr;
      if (hand) {
        const c0 = Math.max(0, Math.floor((hand.x - R) / cellPx) - 1);
        const r0 = Math.max(0, Math.floor((hand.y - R) / cellPx) - 1);
        const c1 = Math.min(cols - 1, Math.ceil((hand.x + R) / cellPx) + 1);
        const r1 = Math.min(rows - 1, Math.ceil((hand.y + R) / cellPx) + 1);
        if (c0 <= c1 && r0 <= r1) {
          box = box
            ? [Math.min(box[0], c0), Math.min(box[1], r0), Math.max(box[2], c1), Math.max(box[3], r1)]
            : [c0, r0, c1, r1];
        }
      }
      if (!box) return null;
      const [c0, r0, c1, r1] = box;
      const damp = Math.pow(DAMPING, dt);
      let next: [number, number, number, number] | null = null;
      for (let row = r0; row <= r1; row++) {
        for (let col = c0; col <= c1; col++) {
          const k = (row * cols + col) * 4;
          let ox = state[k]!;
          let oy = state[k + 1]!;
          let vx = state[k + 2]!;
          let vy = state[k + 3]!;
          if (hand) {
            const dx = (col + 0.5) * cellPx + ox - hand.x;
            const dy = (row + 0.5) * cellPx + oy - hand.y;
            const dd = Math.hypot(dx, dy);
            if (dd < R && dd > 0.01) {
              const f = (1 - dd / R) ** 2 * S;
              vx += (dx / dd) * f * dt;
              vy += (dy / dd) * f * dt;
            }
          }
          vx = (vx - ox * SPRING * dt) * damp;
          vy = (vy - oy * SPRING * dt) * damp;
          ox += vx * dt;
          oy += vy * dt;
          if (Math.abs(ox) < 0.05 && Math.abs(oy) < 0.05 && Math.abs(vx) < 0.02 && Math.abs(vy) < 0.02) {
            ox = oy = vx = vy = 0;
          } else {
            next = next
              ? [Math.min(next[0], col), Math.min(next[1], row), Math.max(next[2], col), Math.max(next[3], row)]
              : [col, row, col, row];
          }
          state[k] = ox;
          state[k + 1] = oy;
          state[k + 2] = vx;
          state[k + 3] = vy;
        }
      }
      box = next;
      return [r0, r1];
    };

    let frame = 0;
    let visible = true;
    let prev = 0;
    let developStart = 0;
    const draw = (now: number) => {
      const dt = prev ? Math.min(2.5, Math.max(0, (now - prev) / 16.67)) : 1;
      prev = now;
      if (video.readyState >= 2) {
        let develop = 1;
        if (!developed && !reduced) {
          developStart ||= now; // starts on the first real frame, not on mount
          const t = Math.min(1, (now - developStart) / DEVELOP_MS);
          develop = 1 - (1 - t) ** 3;
          if (t === 1) developed = true;
        }
        gl.uniform1f(developU, develop);

        const changed = reduced ? null : step(dt);
        if (changed) {
          const [r0, r1] = changed;
          gl.activeTexture(gl.TEXTURE1);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, r0, cols, r1 - r0 + 1, gl.RGBA, gl.FLOAT,
            state.subarray(r0 * cols * 4, (r1 + 1) * cols * 4));
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, cols * rows);
      }
      if (visible) frame = requestAnimationFrame(draw);
    };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      cancelAnimationFrame(frame);
      prev = 0;
      if (visible) frame = requestAnimationFrame(draw);
    });
    visibility.observe(canvas);

    return () => {
      visible = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [cell]);

  return (
    <>
      <video
        ref={videoRef}
        className="hero-video"
        aria-hidden
        poster="/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto">
        <source src="/hero.webm" type="video/webm" />
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      {!fallback && <canvas ref={canvasRef} className="hero-video hero-dither" aria-hidden />}
    </>
  );
}
