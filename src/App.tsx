import { useEffect, useRef } from "react";
import "./index.css";
import { Chat } from "./components/Chat";
import { Nav } from "./components/Chrome";
import { ProjectPage } from "./components/ProjectPage";
import {
  About,
  Contact,
  Experience,
  Hero,
  Work,
} from "./components/Sections";
import { projects } from "./content";
import { initPageMotion } from "./lib/motion";
import { usePath, whenSettled } from "./lib/router";

export function App() {
  const path = usePath();
  const scopeRef = useRef<HTMLDivElement>(null);
  const projectSlug = path.startsWith("/work/") ? path.slice(6) : null;

  const firstLoad = useRef(true);

  // A title per page, so tabs, history and bookmarks say which project they are.
  useEffect(() => {
    const project = projects.find((p) => p.slug === projectSlug);
    document.title = project
      ? `${project.title} — Manas Kushwaha`
      : "Manas Kushwaha — Full-stack engineer";
  }, [projectSlug]);

  // Set up scroll motion only once a route transition has finished, so it never competes
  // with the card morph for frames. The hero entrance plays on first load only; coming back
  // to the index it would flash content the transition already showed.
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    void whenSettled().then(() => {
      if (cancelled) return;
      // Marked used only once it has actually run: StrictMode's first, cancelled pass in
      // development must not swallow the entrance.
      cleanup = initPageMotion(scope, { entrance: firstLoad.current });
      firstLoad.current = false;
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [path]);

  return (
    <div ref={scopeRef}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav onHome={!projectSlug} />

      {projectSlug ? (
        <ProjectPage slug={projectSlug} />
      ) : (
        <main className="shell" id="main">
          <Hero />
          <Work />
          <About />
          <Experience />
          <Contact />
        </main>
      )}

      <Chat />
    </div>
  );
}

export default App;
