import { useEffect, useState } from "react";

export function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    window.addEventListener("navigate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("navigate", onPop);
    };
  }, []);

  return path;
}

export function navigate(to: string) {
  if (to === window.location.pathname) return;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new Event("navigate"));
  window.scrollTo(0, 0);
}

/** Intercepts plain left-clicks on internal links so they route client-side. */
export function onLinkClick(to: string) {
  return (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(to);
  };
}
