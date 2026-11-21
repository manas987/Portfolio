import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Diagram, DiagramEdge, PathKind, StepGroup } from "../content";
import { Segmented } from "./Demos";
import { useLiquidGlow } from "./Sections";

/* Grid geometry, in diagram units. Nodes sit on cell centres; `at` and `via` are in cell
   units, so a diagram is authored as a sketch on graph paper. */
const CW = 196;
const CH = 124;
const NW = 152;
const NH = 58;
const MARGIN = 30;

type Pt = { x: number; y: number };
const px = ([c, r]: [number, number]): Pt => ({ x: c * CW, y: r * CH });

/** Where a line leaving node `n` toward `p` meets its border: a side if `p` is level with it,
 *  the top or bottom otherwise. */
function anchor(n: Pt, p: Pt): Pt {
  if (Math.abs(p.y - n.y) < NH / 2) return { x: n.x + Math.sign(p.x - n.x) * (NW / 2), y: p.y };
  return { x: p.x, y: n.y + Math.sign(p.y - n.y) * (NH / 2) };
}

function route(a: Pt, b: Pt, edge: DiagramEdge): Pt[] {
  const lane = edge.lane ?? 0;
  if (!edge.via && a.y === b.y) {
    const s = Math.sign(b.x - a.x);
    return [
      { x: a.x + s * (NW / 2), y: a.y + lane },
      { x: b.x - s * (NW / 2), y: a.y + lane },
    ];
  }
  if (!edge.via && a.x === b.x) {
    const s = Math.sign(b.y - a.y);
    return [
      { x: a.x + lane, y: a.y + s * (NH / 2) },
      { x: a.x + lane, y: b.y - s * (NH / 2) },
    ];
  }
  const via = edge.via ? edge.via.map(px) : [{ x: b.x, y: a.y }];
  return [anchor(a, via[0]!), ...via, anchor(b, via[via.length - 1]!)];
}

/** Midpoint of the longest segment: where the step badge and label go. */
function labelSpot(points: Pt[]) {
  let best = { mid: points[0]!, len: -1, vertical: false };
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1]!;
    const q = points[i]!;
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    if (len > best.len) best = { mid: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, len, vertical: p.x === q.x };
  }
  return best;
}

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** `code` and **bold** spans, the only markup the content uses. */
export function inline(text: string): ReactNode {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("`") ? (
      <code key={i}>{part.slice(1, -1)}</code>
    ) : part.startsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/* The paths are drawn as dither: a dotted line of cells, with data travelling along it as a
   band of brighter cells whose edges break up through a Bayer threshold, the same look as the
   hero. The cursor pushes cells aside on a spring, like the hero's dots. */
const GAP = 6;
const BAND = 70;
const STEP_S = 0.95;
const REACH = 42;
const PUSH = 7;
const SPRING = 0.07;
const DAMPING = 0.82;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((b) => (b + 0.5) / 16);

type Cell = { x: number; y: number; edge: number; s: number; t: number; ox: number; oy: number; vx: number; vy: number };

/** Lays cells along a polyline every GAP units; returns the path's length. */
function sample(points: Pt[], edge: number, cells: Cell[]) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y);
  for (let at = 2; at < total - 7; at += GAP) {
    let rest = at;
    for (let i = 1; i < points.length; i++) {
      const p = points[i - 1]!;
      const q = points[i]!;
      const len = Math.hypot(q.x - p.x, q.y - p.y);
      if (rest <= len) {
        cells.push({ x: p.x + ((q.x - p.x) * rest) / len, y: p.y + ((q.y - p.y) * rest) / len, edge, s: at, t: BAYER[cells.length % 16]!, ox: 0, oy: 0, vx: 0, vy: 0 });
        break;
      }
      rest -= len;
    }
  }
  return total;
}

export function Architecture({
  diagram,
  steps,
  api,
  title,
  tint,
}: {
  diagram: Diagram;
  steps?: StepGroup[];
  api?: string[];
  title: string;
  tint: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const activeRef = useRef<string | null>(null);
  activeRef.current = active;
  // The steps of the selected phase; the diagram leans toward them.
  const group = steps?.[phase];
  const phaseSteps = new Set(group?.items.map((i) => i.n));
  const phaseRef = useRef(phaseSteps);
  phaseRef.current = phaseSteps;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glow = useLiquidGlow([0.64, 0.4]);

  const nodes = new Map(diagram.nodes.map((n) => [n.id, n]));
  const edges = diagram.edges.map((edge) => {
    const points = route(px(nodes.get(edge.from)!.at), px(nodes.get(edge.to)!.at), edge);
    return { edge, points, spot: labelSpot(points) };
  });

  // The frame fits everything drawn, so a diagram needs no hand-tuned bounds.
  const xs: number[] = [];
  const ys: number[] = [];
  diagram.nodes.forEach((n) => {
    const p = px(n.at);
    xs.push(p.x - NW / 2, p.x + NW / 2);
    ys.push(p.y - NH / 2, p.y + NH / 2);
  });
  edges.forEach(({ points, edge, spot }) => {
    points.forEach((p) => (xs.push(p.x), ys.push(p.y)));
    if (edge.label) {
      const w = edge.label.length * 6.4;
      if (spot.vertical) xs.push(spot.mid.x + 18 + w);
      else (ys.push(spot.mid.y - 24), xs.push(spot.mid.x - w / 2, spot.mid.x + w / 2));
    }
  });
  const minX = Math.min(...xs) - MARGIN;
  const minY = Math.min(...ys) - MARGIN;
  const W = Math.max(...xs) + MARGIN - minX;
  const H = Math.max(...ys) + MARGIN - minY;
  // Percent position inside the stage, for the HTML layer over the canvas.
  const at = (x: number, y: number): CSSProperties => ({ left: `${((x - minX) / W) * 100}%`, top: `${((y - minY) / H) * 100}%` });

  const touched = new Set<string>();
  const inPhase = new Set<string>();
  edges.forEach(({ edge }) => {
    if (active && edge.step === active) touched.add(edge.from).add(edge.to);
    if (!group || (edge.step && phaseSteps.has(edge.step))) inPhase.add(edge.from).add(edge.to);
  });

  const geometryKey = JSON.stringify(diagram);
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !stage || !ctx) return;
    const reduced = prefersReduced();

    const cells: Cell[] = [];
    const lengths = edges.map(({ points }, i) => sample(points, i, cells));
    const order = edges
      .map((e, i) => ({ i, n: Number(e.edge.step) }))
      .filter((e) => e.n)
      .sort((a, b) => a.n - b.n)
      .map((e) => e.i);
    const slot = new Map(order.map((edge, k) => [edge, k]));
    const css = getComputedStyle(stage);
    const colour = (k: PathKind) => css.getPropertyValue(`--path-${k}`).trim() || "#888";
    const colours = edges.map(({ edge }) => colour(edge.kind));
    const revealAt = (i: number) => (slot.get(i) ?? order.length) * 0.11;

    let scale = 1;
    let dpr = 1;
    let pointer: Pt | null = null;
    let born = 0;
    let last = 0;
    let running = false;
    let visible = false;
    let frame = 0;

    const draw = (now: number) => {
      const t = born ? (now - born) / 1000 : 0;
      const dt = Math.min(3, (now - last) / 16.67 || 1);
      last = now;
      const on = activeRef.current;
      const hasOn = on !== null && edges.some((e) => e.edge.step === on);
      // Data travels only through the selected phase's numbered paths, in order.
      const phaseSet = phaseRef.current;
      const live = phaseSet.size ? order.filter((i) => phaseSet.has(edges[i]!.edge.step!)) : order;
      const liveSlot = new Map(live.map((edge, k) => [edge, k]));
      const cycle = Math.max(1, live.length) * STEP_S + 1.4;
      const isIn = (i: number) => !phaseSet.size || phaseSet.has(edges[i]!.edge.step ?? "");

      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, -minX * dpr * scale, -minY * dpr * scale);
      ctx.clearRect(minX, minY, W, H);

      let moving = false;
      const damp = Math.pow(DAMPING, dt);
      for (const c of cells) {
        // Spring each cell home, pushed away from the cursor.
        if (pointer && !reduced) {
          const dx = c.x + c.ox - pointer.x;
          const dy = c.y + c.oy - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < REACH && d > 0.01) {
            const f = (1 - d / REACH) * PUSH * 0.12 * dt;
            c.vx += (dx / d) * f;
            c.vy += (dy / d) * f;
          }
        }
        if (c.ox || c.oy || c.vx || c.vy) {
          c.vx = (c.vx - c.ox * SPRING * dt) * damp;
          c.vy = (c.vy - c.oy * SPRING * dt) * damp;
          c.ox += c.vx * dt;
          c.oy += c.vy * dt;
          if (Math.abs(c.ox) + Math.abs(c.oy) + Math.abs(c.vx) + Math.abs(c.vy) < 0.02) c.ox = c.oy = c.vx = c.vy = 0;
          else moving = true;
        }

        const e = edges[c.edge]!;
        const len = lengths[c.edge]!;
        // Draw-in: each path fills from its start, in step order.
        if (!reduced && c.s / len > (t - revealAt(c.edge)) / 0.7) continue;

        let band = 0;
        if (!reduced && t > 0.9) {
          const k = liveSlot.get(c.edge);
          if (k !== undefined) {
            const local = (((t - 0.9) % cycle) - k * STEP_S) / STEP_S;
            if (local >= 0 && local <= 1) {
              const head = local * (len + BAND);
              band = Math.max(0, 1 - Math.abs(c.s - (head - BAND / 2)) / (BAND / 2));
            }
          } else if (e.edge.kind === "async" && isIn(c.edge)) {
            const w = (((c.s - t * 26) % 52) + 52) % 52;
            band = Math.max(0, 1 - Math.abs(w - 26) / 26) * 0.75;
          }
        }

        const lit = hasOn ? e.edge.step === on : isIn(c.edge);
        const bright = lit && band > c.t;
        ctx.globalAlpha = bright ? 1 : hasOn ? (lit ? 0.85 : 0.08) : lit ? 0.5 : 0.14;
        ctx.fillStyle = colours[c.edge]!;
        const size = bright ? 3 : 2.1;
        ctx.fillRect(c.x + c.ox - size / 2, c.y + c.oy - size / 2, size, size);
      }

      // Arrowheads: small solid triangles once a path has drawn in.
      edges.forEach(({ points, edge }, i) => {
        if (!reduced && (t - revealAt(i)) / 0.7 < 1) return;
        const q = points[points.length - 1]!;
        const p = points[points.length - 2]!;
        const a = Math.atan2(q.y - p.y, q.x - p.x);
        ctx.globalAlpha = hasOn ? (edge.step === on ? 1 : 0.1) : isIn(i) ? 0.8 : 0.18;
        ctx.fillStyle = colours[i]!;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x - 7 * Math.cos(a - 0.45), q.y - 7 * Math.sin(a - 0.45));
        ctx.lineTo(q.x - 7 * Math.cos(a + 0.45), q.y - 7 * Math.sin(a + 0.45));
        ctx.closePath();
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      return moving;
    };

    const loop = (now: number) => {
      const moving = draw(now);
      // Animate while on screen; under reduced motion only while something is settling.
      if (visible && (!reduced || moving || pointer)) frame = requestAnimationFrame(loop);
      else running = false;
    };
    const start = () => {
      if (running || !visible) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      scale = stage.clientWidth / W;
      canvas.width = Math.round(stage.clientWidth * dpr);
      canvas.height = Math.round(stage.clientHeight * dpr);
      if (!running) draw(performance.now());
    };
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      pointer = { x: (e.clientX - r.left) / scale + minX, y: (e.clientY - r.top) / scale + minY };
      start();
    };
    const onLeave = () => {
      pointer = null;
    };
    // Hover changes come through React; repaint once if idle so the highlight shows.
    const redraw = () => {
      if (!running) draw(performance.now());
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry?.isIntersecting;
        if (visible && !born) born = performance.now();
        if (visible) start();
      },
      { threshold: 0.25 },
    );
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    io.observe(stage);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("arch:redraw", redraw);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("arch:redraw", redraw);
    };
    // Geometry is derived from `diagram`, so its serialised form is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometryKey]);

  useEffect(() => {
    canvasRef.current?.parentElement?.dispatchEvent(new Event("arch:redraw"));
  }, [active, phase]);

  const hover = (step: string | null) => () => setActive(step);

  return (
    <div className="flow-field reveal" ref={glow.fieldRef} style={{ "--glow": tint } as CSSProperties}>
      <span className="glass-glow flow-glow" ref={glow.glowRef} aria-hidden />

      {steps && (
        <div className="flow-head">
          <Segmented
            label="Phase"
            value={String(phase)}
            onChange={(v) => setPhase(Number(v))}
            options={steps.map((g, i) => [
              String(i),
              <span key={g.title} className={`flow-tab k-${g.kind}`}>
                {g.title}
              </span>,
            ])}
          />
        </div>
      )}

      <div className="flow-scroll">
        <div
          className="flow-stage"
          data-active={touched.size ? true : undefined}
          style={{ aspectRatio: `${W} / ${H}`, maxWidth: W * 1.12, "--vb": W } as CSSProperties}
          role="img"
          aria-label={`${title} architecture. The numbered steps below describe each path.`}>
          <canvas ref={canvasRef} aria-hidden />

          {edges.map(({ edge, spot }, i) => (
            <Fragment key={i}>
              {edge.label && (
                <span
                  className={`flow-label mono k-${edge.kind}`}
                  data-vertical={spot.vertical || undefined}
                  data-badge={edge.step ? true : undefined}
                  style={at(spot.mid.x, spot.mid.y)}>
                  {edge.label}
                </span>
              )}
              {edge.step && (
                <span
                  className={`flow-badge mono k-${edge.kind}`}
                  data-on={active === edge.step || undefined}
                  data-dim={(group && !phaseSteps.has(edge.step)) || undefined}
                  style={at(spot.mid.x, spot.mid.y)}
                  onPointerEnter={hover(edge.step)}
                  onPointerLeave={hover(null)}>
                  {edge.step}
                </span>
              )}
            </Fragment>
          ))}

          {diagram.nodes.map((n) => {
            const p = px(n.at);
            return (
              <div
                key={n.id}
                className={`flow-node k-${n.tone ?? "plain"}`}
                data-dashed={n.dashed || undefined}
                data-on={touched.has(n.id) || undefined}
                data-dim={!inPhase.has(n.id) || undefined}
                style={{ ...at(p.x - NW / 2, p.y - NH / 2), width: `${(NW / W) * 100}%`, height: `${(NH / H) * 100}%` }}>
                <span className="flow-node-label">{n.label}</span>
                {n.sub && <span className="flow-node-sub">{n.sub}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {group && (
        <ol className="flow-steps" key={phase}>
          {group.items.map((item) => (
            <li
              key={item.n}
              tabIndex={0}
              data-on={active === item.n || undefined}
              onPointerEnter={hover(item.n)}
              onPointerLeave={hover(null)}
              onFocus={hover(item.n)}
              onBlur={hover(null)}>
              <span className={`flow-step-n mono k-${group.kind}`}>{item.n}</span>
              <span>{inline(item.text)}</span>
            </li>
          ))}
        </ol>
      )}

      {api && (
        <div className="flow-api">
          <span className="mono">Interface</span>
          <ul className="chips">
            {api.map((a) => {
              const [verb, ...path] = a.split(" ");
              return (
                <li key={a} className="mono">
                  <b>{verb}</b> {path.join(" ")}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
