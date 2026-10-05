import { useEffect, useRef } from "react";
import "./index.css";
import { Chat } from "./components/Chat";
import { Nav, Rail } from "./components/Chrome";
import { ProjectPage } from "./components/ProjectPage";
import {
  About,
  Contact,
  Experience,
  Hero,
  Skills,
  Work,
} from "./components/Sections";
import { initPageMotion } from "./lib/motion";
import { usePath } from "./lib/router";

export function App() {
  const path = usePath();
  const scopeRef = useRef<HTMLDivElement>(null);
  const projectSlug = path.startsWith("/work/") ? path.slice(6) : null;

  useEffect(() => {
    if (!scopeRef.current) return;
    return initPageMotion(scopeRef.current);
  }, [path]);

  return (
    <div ref={scopeRef}>
      <Nav onHome={!projectSlug} />
      {!projectSlug && <Rail />}

      {projectSlug ? (
        <ProjectPage slug={projectSlug} />
      ) : (
        <main className="shell">
          <Hero />
          <Work />
          <About />
          <Skills />
          <Experience />
          <Contact />
        </main>
      )}

      <Chat />
    </div>
  );
}

export default App;
