import { useEffect, useRef, useState, type CSSProperties } from "react";
import { config } from "../config";
import { about, callouts, cp, experience, projects, skills, type Project } from "../content";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Mark } from "../lib/icons";
import { prefersReducedMotion } from "../lib/motion";
import { onLinkClick, whenSettled } from "../lib/router";
import { DitherVideo } from "./DitherVideo";

/* Callout anchors in video pixels (1280×720). They sit at the corners of a frame around the
   head, like the koi diagram reference; the labels sit beside each dot. */
const anchors = [
  { x: 470, y: 70, side: "left" },
  { x: 1120, y: 190, side: "right" },
  { x: 1080, y: 620, side: "right" },
  { x: 450, y: 560, side: "left" },
] as const;

export function Hero() {
  const frame = anchors.map((a) => `${a.x},${a.y}`).join(" ");
  return (
    <section className="hero" id="index">
      <figure className="hero-media">
        <DitherVideo />

        <svg className="callout-frame" viewBox="0 0 1280 720" aria-hidden>
          <polygon className="callout-line" points={frame} pathLength={1} />
          {anchors.map((a) => (
            <circle key={a.x} className="callout-dot" cx={a.x} cy={a.y} r={6} />
          ))}
        </svg>

        {callouts.map((c, i) => {
          const a = anchors[i]!;
          return (
            <a
              key={c.code}
              className={`callout callout-${a.side}`}
              style={{ left: `${(a.x / 1280) * 100}%`, top: `${(a.y / 720) * 100}%` }}
              href={`/work/${c.slug}`}
              onClick={onLinkClick(`/work/${c.slug}`)}>
              <span className="mono callout-code">
                {c.code} / {c.label}
              </span>
              <span className="callout-note">{c.note}</span>
            </a>
          );
        })}
      </figure>

      <div className="hero-copy">
        <h1 className="headline">
          Full-stack products,{" "}
          <span className="quiet">built end to end.</span>
        </h1>
        <p className="body-copy hero-sub">
          Full-stack engineer across web, mobile and applied AI. Trading systems, booking
          engines, rental apps and on-device voice AI.
        </p>
        <a className="text-link" href="#work">
          See the work <ArrowUpRight size={14} />
        </a>
      </div>
    </section>
  );
}

/** The blurred blob, or generated art when the project has it. */
export function CardArt({ project }: { project: Project }) {
  if (project.image) {
    return <img className="card-image" src={project.image} alt="" loading="lazy" />;
  }
  const style = { "--c1": project.tint[0], "--c2": project.tint[1] } as CSSProperties;
  return <span className="card-blob" style={style} aria-hidden />;
}

export function ProjectCard({ project }: { project: Project }) {
  const href = `/work/${project.slug}`;
  return (
    <a
      id={`card-${project.slug}`}
      className="card project-card"
      href={href}
      onClick={(e) => {
        // Named only at click time: one captured card to morph, not every card on the page.
        const card = e.currentTarget;
        // On a project page, only this card should morph; the current hero just fades.
        document.querySelectorAll<HTMLElement>(".detail-hero").forEach((hero) => {
          hero.style.viewTransitionName = "none";
        });
        card.style.viewTransitionName = `card-${project.slug}`;
        onLinkClick(href)(e);
        void whenSettled().then(() => {
          card.style.viewTransitionName = "";
        });
      }}>
      <span className="mono card-tag">
        {project.kind} · {project.year}
      </span>
      <p className="card-tagline">{project.tagline}</p>
      <span className="card-art">
        <CardArt project={project} />
      </span>
      <h3 className="card-title">{project.title}</h3>
      <p className="mono card-stack">{project.stack.slice(0, 3).join(" · ")}</p>
    </a>
  );
}

/**
 * Makes the horizontal rail usable with a mouse, not just a trackpad: the vertical wheel
 * scrolls it (handing back to the page at either end so scrolling never gets stuck), the
 * mouse can drag it, and a drag never doubles as a click. Touch keeps native scrolling.
 */
function useRailControls() {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // already horizontal (trackpad)
      const max = rail.scrollWidth - rail.clientWidth;
      const atStart = rail.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = rail.scrollLeft >= max - 1 && e.deltaY > 0;
      if (atStart || atEnd) return; // let the page scroll on
      e.preventDefault();
      rail.scrollLeft += e.deltaY;
    };

    let startX = 0;
    let startScroll = 0;
    let dragging = false;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = rail.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        rail.classList.add("is-dragging");
        rail.setPointerCapture(e.pointerId);
      }
      if (moved) rail.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      dragging = false;
      rail.classList.remove("is-dragging");
    };
    // A drag ends with a click on whatever card is under the pointer; swallow it.
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    rail.addEventListener("wheel", onWheel, { passive: false });
    rail.addEventListener("pointerdown", onDown);
    rail.addEventListener("pointermove", onMove);
    rail.addEventListener("pointerup", onUp);
    rail.addEventListener("pointercancel", onUp);
    rail.addEventListener("click", onClick, true);
    return () => {
      rail.removeEventListener("wheel", onWheel);
      rail.removeEventListener("pointerdown", onDown);
      rail.removeEventListener("pointermove", onMove);
      rail.removeEventListener("pointerup", onUp);
      rail.removeEventListener("pointercancel", onUp);
      rail.removeEventListener("click", onClick, true);
    };
  }, []);

  const step = (direction: 1 | -1) => {
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>(".project-card");
    if (!rail || !card) return;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    rail.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  return { railRef, step };
}

export function Work() {
  const fill = useRef<HTMLSpanElement>(null);
  const { railRef, step } = useRailControls();
  return (
    <section className="section" id="work" data-reveal-group>
      <div className="section-head reveal">
        <h2 className="headline headline-sm">
          Selected work. <span className="quiet">Infrastructure, products, and the problems behind them.</span>
        </h2>
        <p className="mono">{projects.length} projects · 2025—2026</p>
      </div>

      <div
        className="card-rail"
        ref={railRef}
        role="region"
        aria-label="Projects"
        onScroll={(e) => {
          const el = e.currentTarget;
          const max = el.scrollWidth - el.clientWidth;
          fill.current?.style.setProperty("--p", String(max > 0 ? el.scrollLeft / max : 1));
        }}>
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
      <div className="rail-foot">
        <div className="rail-progress" aria-hidden>
          <span ref={fill} />
        </div>
        <div className="rail-arrows">
          <button type="button" className="rail-arrow glass" onClick={() => step(-1)} aria-label="Previous projects">
            <ArrowLeft size={15} />
          </button>
          <button type="button" className="rail-arrow glass" onClick={() => step(1)} aria-label="Next projects">
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

// Stat positions inside the gradient, Monotime-style: scattered, not a table.
const statSpots = [
  { left: "12%", top: "52%" },
  { left: "46%", top: "22%" },
  { left: "74%", top: "58%" },
];

/**
 * A soft colour orb that trails the pointer, easing towards it each frame. Without `rest` it fades in and
 * out with hover; with `rest` (fractions of the field) it stays lit and eases back there when
 * the pointer leaves. Moved by transform only, so it never repaints. Off under reduced motion.
 */
function useLiquidGlow(rest?: [number, number]) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const glow = glowRef.current;
    if (!field || !glow) return;
    if (prefersReducedMotion()) {
      // Still lit, just not following the pointer.
      if (rest) {
        glow.style.transform = `translate(${field.clientWidth * rest[0]}px, ${field.clientHeight * rest[1]}px) translate(-50%, -50%)`;
        glow.dataset.on = "true";
      }
      return;
    }

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let frame = 0;
    let running = false;
    let hovering = false;

    const toRest = () => {
      if (!rest) return;
      tx = field.clientWidth * rest[0];
      ty = field.clientHeight * rest[1];
    };

    const tick = () => {
      const dx = tx - x;
      const dy = ty - y;
      x += dx * 0.14;
      y += dy * 0.14;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      if (Math.hypot(dx, dy) > 0.3) frame = requestAnimationFrame(tick);
      else running = false;
    };
    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = field.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      start();
    };
    const onEnter = (e: PointerEvent) => {
      const r = field.getBoundingClientRect();
      hovering = true;
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      // A fading glow appears where the pointer enters; a resting one travels there.
      if (!rest) {
        x = tx;
        y = ty;
      }
      glow.dataset.on = "true";
      start();
    };
    const onLeave = () => {
      hovering = false;
      if (rest) {
        toRest();
        start();
      } else {
        glow.dataset.on = "false";
      }
    };

    // The field's size settles after mount (fonts, reveal), so re-aim at rest when it changes.
    const resize = new ResizeObserver(() => {
      if (rest && !hovering) {
        toRest();
        start();
      }
    });
    if (rest) {
      toRest();
      x = tx;
      y = ty;
      glow.dataset.on = "true";
      running = true;
      tick();
      resize.observe(field);
    }
    field.addEventListener("pointerenter", onEnter);
    field.addEventListener("pointermove", onMove);
    field.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      field.removeEventListener("pointerenter", onEnter);
      field.removeEventListener("pointermove", onMove);
      field.removeEventListener("pointerleave", onLeave);
    };
    // `rest` is a literal at each call site, so it never needs to re-run the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { fieldRef, glowRef };
}

export function Experience() {
  const { fieldRef, glowRef } = useLiquidGlow();
  const stats = experience.wins.flatMap((win) =>
    win.deltas.map((d) => ({ ...d, label: win.label })),
  );
  return (
    <section className="section" id="experience" data-reveal-group>
      <div className="section-head reveal">
        <h2 className="headline headline-sm">
          Experience. <span className="quiet">Query performance and integrations for an analytics platform.</span>
        </h2>
      </div>

      <div className="card xp-card reveal">
        <div className="xp-field" ref={fieldRef}>
          <span className="xp-glow" ref={glowRef} aria-hidden />
          {stats.map((s, i) => (
            <div className="xp-stat" key={s.from} style={statSpots[i]}>
              <p className="xp-delta">
                <span className="xp-from">{s.from}</span> → {s.to}
              </p>
              <p className="xp-label">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="xp-body">
          <div>
            <p className="xp-company">{experience.company}</p>
            <p className="mono">
              {experience.role} · {experience.mode}
            </p>
          </div>
          <div>
            <p className="body-copy">{experience.intro}</p>
            {experience.notes.map((note) => (
              <p key={note} className="body-copy quiet-copy">
                {note}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const sphereWords = [
  ...skills.flatMap((g) => g.items),
  "FIFO",
  "snapshot",
  "replay",
  "wake word",
  "event",
  "state",
];

/* Seeded so the cloud is the same on every visit. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/**
 * The skills as a loose, uneven cloud of words orbiting in 3D. Positions are scattered and
 * bunched towards the middle (summed uniforms), with mixed sizes and brightness, then the
 * whole cloud turns around a vertical axis each frame; depth adds a little scale and fade.
 * The cursor steers the spin. Runs only while on screen; one still frame under reduced motion.
 */
function SkillSphere() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    const n = items.length;
    const rand = seeded(7);
    const bell = () => rand() + rand() - 1; // -1..1, centre-heavy
    const points = items.map((item) => {
      item.style.fontSize = `${10 + Math.round(rand() * 5)}px`;
      return { x: bell(), y: bell() * 0.95, z: bell(), alpha: 0.35 + rand() * 0.65 };
    });

    let rx = 0;
    let ry = 0;
    const measure = () => {
      rx = el.clientWidth * 0.46;
      ry = el.clientHeight * 0.44;
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(el);

    let rotY = 0;
    let tilt = 0;
    let speed = 0.0022;
    let targetSpeed = 0.0022;
    let targetTilt = 0;

    const draw = () => {
      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      for (let i = 0; i < n; i++) {
        const { x, y, z, alpha } = points[i]!;
        const x1 = x * cy + z * sy;
        const z1 = z * cy - x * sy;
        const y1 = y * ct - z1 * st;
        const depth = Math.min(1, Math.max(0, (y * st + z1 * ct + 1.2) / 2.4)); // 0 far, 1 near
        const item = items[i]!;
        item.style.transform = `translate3d(${x1 * rx}px, ${y1 * ry}px, 0) translate(-50%, -50%) scale(${0.8 + depth * 0.35})`;
        item.style.opacity = String(alpha * (0.25 + depth * 0.75));
        item.style.zIndex = String(Math.round(depth * 100));
      }
    };

    if (prefersReducedMotion()) {
      draw();
      return () => resize.disconnect();
    }

    let frame = 0;
    const tick = () => {
      speed += (targetSpeed - speed) * 0.04;
      tilt += (targetTilt - tilt) * 0.04;
      rotY += speed;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const visibility = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry?.isIntersecting) frame = requestAnimationFrame(tick);
    });
    visibility.observe(el);
    draw();

    const card = el.parentElement!;
    const onMove = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      targetSpeed = 0.0022 + ((e.clientX - r.left) / r.width - 0.5) * 0.012;
      targetTilt = ((e.clientY - r.top) / r.height - 0.5) * 0.5;
    };
    const onLeave = () => {
      targetSpeed = 0.0022;
      targetTilt = 0;
    };
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resize.disconnect();
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="sphere" ref={ref}>
      {sphereWords.map((word) => (
        <span key={word} className="mono sphere-word">
          {word}
        </span>
      ))}
    </div>
  );
}

export function About() {
  return (
    <section className="section" id="about" data-reveal-group>
      <div className="card signal reveal">
        <SkillSphere />
        <p className="signal-title">Working stack</p>
      </div>

      <div className="about-copy">
        <h2 className="headline headline-sm reveal">
          About.{" "}
          <span className="quiet">
            Full-stack engineer. I take products from the data model to the interface.
          </span>
        </h2>
        <p className="body-copy quiet-copy about-line reveal">{about.summary}</p>
      </div>
    </section>
  );
}

const linkCode: Record<string, string> = { GitHub: "G", LinkedIn: "L", X: "X", Codeforces: "C" };

export function Contact() {
  const [copied, setCopied] = useState(false);
  // Many visitors have no mail app set up, so mailto links do nothing for them; copying works.
  const copyEmail = () => {
    void navigator.clipboard?.writeText(config.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };
  const glass = useLiquidGlow([0.72, 0.38]);
  return (
    <section className="section contact" id="contact" data-reveal-group>
      <div
        className="glass-field reveal"
        ref={glass.fieldRef}>
        <span className="glass-glow" ref={glass.glowRef} aria-hidden />
        <div className="glass-tiles" aria-hidden>
          {Array.from({ length: 240 }, (_, i) => (
            <span key={i} />
          ))}
        </div>

        <div className="contact-stack">
          <div className="biz-card">
            <p className="biz-top">Contact</p>
            <p className="biz-top biz-top-name">
              Manas Kushwaha
              <span>Full-stack engineer</span>
            </p>

            <div className="biz-rows">
              {config.email && (
                <p>
                  <span className="mono">E:</span>
                  <span className="biz-email">
                    <a href={`mailto:${config.email}`}>{config.email}</a>
                    <button type="button" className="copy-email" onClick={copyEmail}>
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <span className="sr-only" aria-live="polite">
                      {copied ? "Email address copied" : ""}
                    </span>
                  </span>
                </p>
              )}
              {config.links.map((link) => (
                <p key={link.label}>
                  <span className="mono">{linkCode[link.label] ?? link.label[0]}:</span>
                  <a href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                </p>
              ))}
              {config.availability && (
                <p>
                  <span className="mono">A:</span>
                  <span>
                    <span className="availability-dot" />
                    {config.availability}
                  </span>
                </p>
              )}
            </div>

            <Mark className="biz-mark" size={18} />
            <p className="biz-word">manas</p>
          </div>

          {config.email && (
            <a className="pill" href={`mailto:${config.email}`}>
              Get in touch
            </a>
          )}
        </div>
      </div>

      <div className="colophon mono">
        <span>© Manas Kushwaha, 2026</span>
        {config.showCp && (
          <a href={cp.href} target="_blank" rel="noreferrer">
            {cp.label} — {cp.value}
          </a>
        )}
        <a href="#index">
          Back to top <ArrowUp size={11} />
        </a>
      </div>
    </section>
  );
}
