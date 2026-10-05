import { config } from "../config";
import { about, cp, experience, projects, skills } from "../content";
import { ArrowDownRight, ArrowUp, ArrowUpRight } from "../lib/icons";
import { onLinkClick } from "../lib/router";
import { MusicPlayer } from "./MusicPlayer";

export function Hero() {
  return (
    <section className="hero" id="index">
      <div className="hero-copy">
        <p className="mono hero-eyebrow">Backend · Distributed systems</p>
        <h1 className="display">
          I build systems that <em>remember</em> their own{" "}
          <span className="accent-coral">state.</span>
        </h1>
        <div className="hero-bottom">
          <p className="body-copy">
            Backend and distributed systems — matching engines, Kafka event
            flow, offline AI pipelines. Mostly the part after it compiles, where
            the state stops agreeing with itself.
          </p>
          <a className="circle-link" href="#work" aria-label="See the work">
            <ArrowDownRight size={22} />
          </a>
        </div>
        <MusicPlayer />
      </div>

      <figure className="hero-media">
        <video
          className="hero-video"
          poster="/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata">
          <source src="/hero.webm" type="video/webm" />
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      </figure>
    </section>
  );
}

export function Work() {
  return (
    <section className="section" id="work" data-reveal-group>
      <div className="section-head reveal">
        <h2
          className="display"
          style={{ fontSize: "clamp(1.75rem,3.2vw,2.5rem)" }}>
          Selected work
        </h2>
        <p className="mono">{projects.length} projects · 2025—2026</p>
      </div>

      <div className="work-list">
        {projects.map((project) => (
          <a
            key={project.slug}
            className="work-row reveal"
            href={`/work/${project.slug}`}
            onClick={onLinkClick(`/work/${project.slug}`)}>
            <div className="work-row-inner">
              {/* No row number: the rail already counts 01–05 for sections, and two
                  counters showing the same range on one page is ambiguous. */}
              <span className="work-marker" aria-hidden />
              <h3 className="work-title">{project.title}</h3>
              <p className="work-problem">{project.what}</p>
              <div className="work-meta">
                <span className="mono">{project.year}</span>
                <ArrowUpRight className="work-arrow" size={15} />
              </div>
              <div className="work-stack">
                {project.stack.map((tech) => (
                  <span key={tech} className="mono">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export function About() {
  return (
    <section className="section" id="about" data-reveal-group>
      <div className="about-grid">
        <h2 className="display reveal">
          A practice built on <em>reading</em> the machine.
        </h2>
        <div>
          {about.body.map((para) => (
            <p key={para} className="body-copy reveal">
              {para}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Skills() {
  return (
    <section className="section" id="skills" data-reveal-group>
      <div className="section-head reveal">
        <h2
          className="display"
          style={{ fontSize: "clamp(1.75rem,3.2vw,2.5rem)" }}>
          Skills
        </h2>
        <p className="mono">
          {skills.reduce((n, g) => n + g.items.length, 0)} tools
        </p>
      </div>

      <div className="skills-grid">
        {skills.map((group) => (
          <div className="skills-group reveal" key={group.group}>
            <p className="mono skills-group-label">{group.group}</p>
            <ul className="skills-items">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Experience() {
  return (
    <section className="section" id="experience" data-reveal-group>
      <div className="section-head reveal">
        <h2
          className="display"
          style={{ fontSize: "clamp(1.75rem,3.2vw,2.5rem)" }}>
          Experience
        </h2>
        <p className="mono">{experience.period}</p>
      </div>

      <div className="xp-head reveal">
        <p className="xp-company">{experience.company}</p>
        <p className="mono">
          {experience.role} · {experience.mode}
        </p>
      </div>

      <p className="body-copy reveal" style={{ marginTop: "1.75rem" }}>
        {experience.intro}
      </p>

      <div
        className="xp-wins reveal"
        style={{ marginTop: "clamp(2rem,5vw,3.5rem)" }}>
        {experience.wins.map((win) => (
          <div className="xp-win" key={win.label}>
            <span className="mono xp-win-label">{win.label}</span>
            {win.deltas.map((delta) => (
              <p className="xp-delta" key={delta.from}>
                <span className="xp-from">{delta.from}</span>
                <span className="xp-to">{delta.to}</span>
              </p>
            ))}
          </div>
        ))}
      </div>

      <div className="xp-notes">
        {experience.notes.map((note) => (
          <p key={note} className="body-copy reveal">
            {note}
          </p>
        ))}
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section className="section contact" id="contact" data-reveal-group>
      <div className="contact-grid">
        <h2 className="display reveal">
          Open to the
          <span className="color-purple"> hard</span> parts.
        </h2>

        <div className="reveal">
          {/* Also carried here, not only in the nav, so it survives on mobile where the
              nav collapses — and because this is where the reader decides to act. */}
          {config.availability && (
            <p
              className="availability mono"
              style={{ marginBottom: "1.25rem" }}>
              <span className="availability-dot" />
              {config.availability}
            </p>
          )}
          <p className="body-copy" style={{ color: "#0d1000c4" }}>
            Looking for backend, distributed-systems or AI-infrastructure work.
            If you are building something stateful and it is going wrong in
            interesting ways, I would like to hear about it.
          </p>

          {config.email && (
            <a
              className="contact-email"
              href={`mailto:${config.email}`}
              style={{ marginTop: "1.75rem" }}>
              {config.email}
              <ArrowUpRight size={16} />
            </a>
          )}

          {config.links.length > 0 && (
            <div className="contact-links">
              {config.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
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
