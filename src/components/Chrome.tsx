import { useEffect, useState } from "react";
import { sections } from "../content";
import { Mark } from "../lib/icons";
import { watchActiveSection } from "../lib/motion";
import { onLinkClick } from "../lib/router";

export function Nav({ onHome }: { onHome: boolean }) {
  return (
    <header className="nav">
      <a className="wordmark" href="/" onClick={onLinkClick("/")}>
        <Mark />
        manas
      </a>

      {onHome && (
        <nav className="nav-links" aria-label="Sections">
          <a className="nav-link" href="#work">
            Work
          </a>
          <a className="nav-link" href="#about">
            About
          </a>
          <a className="nav-link" href="#contact">
            Contact
          </a>
        </nav>
      )}
    </header>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Rail() {
  const [active, setActive] = useState(0);

  useEffect(
    () => watchActiveSection(sections.map((s) => s.id), setActive),
    [],
  );

  return (
    <div className="rail" aria-hidden>
      <p className="rail-label mono">{sections[active]?.label}</p>
      <div className="rail-track">
        <div className="rail-fill" />
      </div>
      <p className="rail-label mono">
        {pad(active + 1)} / {pad(sections.length)}
      </p>
    </div>
  );
}
