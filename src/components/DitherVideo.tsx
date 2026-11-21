import { useEffect, useRef, useState } from "react";

const VERTEX = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

/* Ordered (Bayer 8×8) dither: every cell is either ink or paper. Paper is exactly the page
   colour, so the video has no visible frame at all. The luminance remap pushes the video's
   near-white ground to pure paper and its shadows to solid ink. */
const FRAGMENT = `
precision mediump float;
varying vec2 uv;
uniform sampler2D video;
uniform vec2 resolution;
uniform float cell;
uniform vec3 ink;
uniform vec3 paper;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 cellCoord = floor(gl_FragCoord.xy / cell);
  vec2 sampleUv = (cellCoord + 0.5) * cell / resolution;
  vec3 color = texture2D(video, vec2(sampleUv.x, 1.0 - sampleUv.y)).rgb;
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  lum = smoothstep(0.02, 0.9, pow(lum, 0.62));
  // Fade to paper at the bottom (the source crops the shoulders) and the side edges, inside
  // the dither so the fade is dots thinning out rather than a soft grey.
  vec2 frame = (cellCoord + 0.5) * cell / resolution;
  float edge = smoothstep(0.0, 0.34, frame.y) * smoothstep(0.0, 0.1, frame.x) * smoothstep(1.0, 0.9, frame.x);
  lum = mix(1.0, lum, edge);
  float on = step(bayer8(cellCoord) + 0.0078, lum);
  gl_FragColor = vec4(mix(ink, paper, on), 1.0);
}`;

const hex = (value: string) =>
  [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255) as [number, number, number];

/**
 * The hero video, drawn through a dither shader onto a canvas laid over it. The <video>
 * stays visible underneath (browsers may pause hidden autoplay video) and is fully covered by
 * the opaque canvas. If WebGL is unavailable the plain video is all that shows.
 */
export function DitherVideo({ cell = 2 }: { cell?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) {
      setFallback(true);
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
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

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    const styles = getComputedStyle(document.documentElement);
    gl.uniform3fv(gl.getUniformLocation(program, "ink"), hex(styles.getPropertyValue("--ink").trim() || "#111110"));
    gl.uniform3fv(gl.getUniformLocation(program, "paper"), hex(styles.getPropertyValue("--paper").trim() || "#f3f3f3"));
    const resolution = gl.getUniformLocation(program, "resolution");
    const cellSize = gl.getUniformLocation(program, "cell");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(cellSize, cell * dpr);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let frame = 0;
    let visible = true;
    const draw = () => {
      if (video.readyState >= 2) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      if (visible) frame = requestAnimationFrame(draw);
    };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(draw);
    });
    visibility.observe(canvas);

    return () => {
      visible = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
    };
  }, [cell]);

  return (
    <>
      <video
        ref={videoRef}
        className="hero-video"
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
