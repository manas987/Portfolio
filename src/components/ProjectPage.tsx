import { projects } from "../content";
import { ArrowLeft, ArrowUpRight } from "../lib/icons";
import { onLinkClick } from "../lib/router";

export function ProjectPage({ slug }: { slug: string }) {
  const index = projects.findIndex((p) => p.slug === slug);
  const project = projects[index];

  if (!project) {
    return (
      <main className="shell project-page">
        <a className="back-link mono" href="/" onClick={onLinkClick("/")}>
          <ArrowLeft /> Index
        </a>
        <h1 className="display project-title">Not here.</h1>
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
    <main className="shell project-page" data-reveal-group>
      <a className="back-link mono" href="/" onClick={onLinkClick("/")}>
        <ArrowLeft /> Index
      </a>

      <h1 className="display project-title">{project.title}</h1>
      <p className="project-problem">{project.problem}</p>

      <div className="project-meta">
        <span className="mono">{project.year}</span>
        <span className="mono">{project.stack.join(" · ")}</span>
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
          {project.body.map((para) => (
            <p key={para} className="body-copy reveal">
              {para}
            </p>
          ))}
          {project.notShipped && (
            <p className="caveat reveal">
              <strong style={{ fontWeight: 500, color: "var(--paper)" }}>
                Not shipped.
              </strong>{" "}
              {project.notShipped}
            </p>
          )}
        </div>

        <div>
          {project.flow && (
            <>
              <p className="mono reveal">Path through the system</p>
              <div className="flow">
                {project.flow.map((step) => (
                  <div className="flow-step reveal" key={step.stage}>
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
            </>
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

      <a
        className="project-next"
        href={`/work/${next.slug}`}
        onClick={onLinkClick(`/work/${next.slug}`)}
      >
        <div>
          <p className="mono" style={{ marginBottom: "0.6rem" }}>
            Next
          </p>
          <p className="project-next-title">{next.title}</p>
        </div>
        <ArrowUpRight size={18} />
      </a>
    </main>
  );
}
