import type { CSSProperties } from "react";
import { projects } from "../content";
import { ArrowLeft, ArrowUpRight } from "../lib/icons";
import { onLinkClick } from "../lib/router";
import { CardArt, ProjectCard } from "./Sections";

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
    <main className="shell project-page" id="main" data-reveal-group>
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

      <div className="project-body">
        <div>
          <p className="headline headline-sm project-problem reveal">{project.problem}</p>
          {project.body.map((para) => (
            <p key={para} className="body-copy reveal">
              {para}
            </p>
          ))}
          {project.notShipped && (
            <p className="caveat reveal">
              <strong>Status.</strong> {project.notShipped}
            </p>
          )}
        </div>

        <div>
          {project.flow && (
            <div className="card flow-card reveal">
              <p className="mono">Architecture</p>
              <div className="flow">
                {project.flow.map((step) => (
                  <div className="flow-step" key={step.stage}>
                    <div className="flow-marker">
                      <span className="flow-dot" />
                      <span className="flow-line" />
                    </div>
                    <div className="flow-text">
                      <p className="flow-stage">{step.stage}</p>
                      <p className="flow-detail">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.facts && (
            <div className="facts reveal">
              {project.facts.map((fact) => (
                <div className="fact" key={fact.label}>
                  <span className="mono">{fact.label}</span>
                  <span className="fact-value">{fact.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="project-next">
        <p className="mono">Next</p>
        <ProjectCard key={next.slug} project={next} />
      </div>
    </main>
  );
}
