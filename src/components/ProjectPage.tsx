import type { CSSProperties } from "react";
import { projects } from "../content";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "../lib/icons";
import { onLinkClick } from "../lib/router";
import { Architecture, inline } from "./Architecture";
import { BookingRaceDemo, OrderBookDemo } from "./Demos";
import { CardArt, ProjectCard, useRailControls } from "./Sections";

export function ProjectPage({ slug }: { slug: string }) {
  const index = projects.findIndex((p) => p.slug === slug);
  const project = projects[index];

  if (!project) {
    return (
      <main className="shell project-page" id="main">
        <a className="back-link mono" href="/" onClick={onLinkClick("/")}>
          <ArrowLeft /> Index
        </a>
        <h1 className="headline">Not here.</h1>
        <p className="body-copy">
          That project does not exist. The work is on the{" "}
          <a href="/" onClick={onLinkClick("/")}>
            index
          </a>
          .
        </p>
        <div style={{ height: "40vh" }} />
      </main>
    );
  }

  const next = projects[(index + 1) % projects.length]!;

  return (
    <main className="shell project-page" id="main">
      <a className="back-link mono" href="/" onClick={onLinkClick("/")}>
        <ArrowLeft /> Index
      </a>

      {/* Shares its view-transition-name with the card on the index, so the card floats up
          and settles into this. */}
      <header
        className="card detail-hero"
        style={{ viewTransitionName: `card-${project.slug}` } as CSSProperties}>
        <div className="detail-hero-text">
          <span className="mono card-tag">
            {project.kind} · {project.year}
          </span>
          <h1 className="headline">{project.title}</h1>
          <p className="detail-tagline">{project.tagline}</p>
          {project.live && (
            <a className="live-pill glass" href={project.live} target="_blank" rel="noreferrer">
              Open live app <ArrowUpRight size={14} />
            </a>
          )}
        </div>
        <span className="card-art">
          <CardArt project={project} />
        </span>
      </header>

      <div className="project-meta">
        <ul className="stack-list">
          {project.stack.map((tech) => (
            <li key={tech} className="mono">
              {tech}
            </li>
          ))}
        </ul>
        {project.repo && (
          <a className="out-link" href={project.repo} target="_blank" rel="noreferrer">
            Repository <ArrowUpRight size={13} />
          </a>
        )}
        {project.live && (
          <a className="out-link" href={project.live} target="_blank" rel="noreferrer">
            Live <ArrowUpRight size={13} />
          </a>
        )}
      </div>

      {/* Overview first: what it is and the hard part on the left, the checkable facts and
          the honest status on the right, so the essentials land before any detail. */}
      <section className="overview" aria-label="Overview" data-reveal-group>
        <div>
          <p className="headline headline-sm project-problem reveal">{project.problem}</p>
          {project.body.map((para) => (
            <p key={para} className="body-copy reveal">
              {para}
            </p>
          ))}
        </div>
        <aside className="overview-side reveal">
          {project.facts && (
            <div className="facts">
              {project.facts.map((fact) => (
                <div className="fact" key={fact.label}>
                  <span className="mono">{fact.label}</span>
                  <span className="fact-value">{fact.value}</span>
                </div>
              ))}
            </div>
          )}
          {project.notShipped && (
            <p className="caveat">
              <strong>Status.</strong> {project.notShipped}
            </p>
          )}
        </aside>
      </section>

      {project.diagram && (
        <section className="project-section" aria-labelledby="arch-title" data-reveal-group>
          <h2 id="arch-title" className="headline headline-sm section-title reveal">
            How it runs. <span className="quiet">Pick a phase, hover a step to trace it.</span>
          </h2>
          <Architecture
            diagram={project.diagram}
            steps={project.steps}
            api={project.api}
            title={project.title}
            tint={project.tint[0]}
          />
        </section>
      )}

      {/* The demo and the decisions share a row: the demo is the thing to use, the decisions
          are a strip to glance through, so the strip gets the narrower column. */}
      {(project.demo || project.decisions) && (
        <div className="try-row project-section" data-reveal-group data-single={!project.demo || !project.decisions || undefined}>
          {project.demo && (
            <section aria-labelledby="demo-title">
              <h2 id="demo-title" className="headline section-title-sm reveal">
                {project.demo === "orderbook" ? "Try the matching loop." : "Try to double-book the last room."}{" "}
                <span className="quiet">
                  {project.demo === "orderbook" ? "The engine's own rules, in your browser." : "A step-by-step run of the booking path."}
                </span>
              </h2>
              <div className="card demo-card reveal">
                {project.demo === "orderbook" ? <OrderBookDemo /> : <BookingRaceDemo />}
              </div>
            </section>
          )}
          {project.decisions && <Decisions decisions={project.decisions} />}
        </div>
      )}

      <div className="project-next">
        <p className="mono">Next</p>
        <ProjectCard key={next.slug} project={next} />
      </div>
    </main>
  );
}

/** Design decisions as a rail of tall cards, driven like the work rail on the index. */
function Decisions({ decisions }: { decisions: { title: string; body: string }[] }) {
  const { railRef, step } = useRailControls();
  return (
    <section aria-labelledby="decisions-title">
      <div className="try-head reveal">
        <h2 id="decisions-title" className="headline section-title-sm">
          Decisions. <span className="quiet">What holds it together.</span>
        </h2>
        <div className="rail-arrows">
          <button type="button" className="rail-arrow glass" onClick={() => step(-1)} aria-label="Previous decision">
            <ArrowLeft size={14} />
          </button>
          <button type="button" className="rail-arrow glass" onClick={() => step(1)} aria-label="Next decision">
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <div className="decision-rail reveal" ref={railRef} role="region" aria-label="Design decisions">
        {decisions.map((d, i) => (
          <article className="card decision-card" key={d.title}>
            <span className="mono">
              {String(i + 1).padStart(2, "0")} / {String(decisions.length).padStart(2, "0")}
            </span>
            <h3 className="decision-title">{d.title}</h3>
            <p>{inline(d.body)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
