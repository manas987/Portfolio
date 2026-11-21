import { useRef } from "react";
import { useLiquidGlass } from "../lib/glass";
import { Mark } from "../lib/icons";
import { onLinkClick } from "../lib/router";
import { MusicPlayer } from "./MusicPlayer";

export function Nav({ onHome }: { onHome: boolean }) {
  const pill = useRef<HTMLElement>(null);
  useLiquidGlass(pill);
  return (
    <header className="nav">
      <a className="wordmark" href="/" onClick={onLinkClick("/")}>
        <Mark size={20} />
        manas
      </a>

      {onHome && (
        <nav className="nav-links glass" aria-label="Sections" ref={pill}>
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

      {onHome && <MusicPlayer />}
    </header>
  );
}
