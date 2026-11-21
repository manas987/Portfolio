import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

let settled: Promise<unknown> = Promise.resolve();

/** Resolves once the current route transition has finished animating. */
export const whenSettled = () => settled;

/**
 * Runs a route change inside a View Transition so a card named `card-<slug>` morphs into the
 * detail page's hero card. flushSync makes React commit inside the callback, which is what
 * the browser snapshots; `after` runs once that commit is in the DOM (setState inside
 * flushSync only renders when flushSync returns). Reduced motion and unsupported browsers
 * just change route.
 */
function transition(update: () => void, after?: () => void) {
  const run = () => {
    flushSync(update);
    after?.();
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) return run();
  settled = document.startViewTransition(run).finished.catch(() => undefined);
}

/**
 * Returning to the index: name the card we came from and put it on screen, so the detail
 * hero morphs back into it instead of exiting alone. The name is cleared once settled.
 */
function landOnCard(slug: string | undefined) {
  const card = slug ? document.getElementById(`card-${slug}`) : null;
  if (!card) return false;
  card.style.viewTransitionName = `card-${slug}`;
  card.scrollIntoView({ block: "center", inline: "center" });
  void settled.then(() => {
    card.style.viewTransitionName = "";
  });
  return true;
}

export function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onNavigate = () => setPath(window.location.pathname);
    const onPop = () =>
      transition(onNavigate, () => {
        // Only the index has cards to land on; project pages reuse the id on "Next".
        if (window.location.pathname === "/") {
          landOnCard((history.state as { from?: string } | null)?.from);
        }
      });
    window.addEventListener("popstate", onPop);
    window.addEventListener("navigate", onNavigate);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("navigate", onNavigate);
    };
  }, []);

  return path;
}

export function navigate(to: string) {
  if (to === window.location.pathname) return;
  // Remember which card was opened so Back can morph into it again.
  const from = to.startsWith("/work/") ? to.slice(6) : undefined;
  if (from) window.history.replaceState({ ...history.state, from }, "");
  // Leaving a project for the index lands on that project's card, like Back does.
  const leaving = window.location.pathname.startsWith("/work/")
    ? window.location.pathname.slice(6)
    : undefined;
  transition(
    () => {
      window.history.pushState({}, "", to);
      window.dispatchEvent(new Event("navigate"));
    },
    () => {
      if (!(to === "/" && landOnCard(leaving))) window.scrollTo(0, 0);
    },
  );
}

/** Intercepts plain left-clicks on internal links so they route client-side. */
export function onLinkClick(to: string) {
  return (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(to);
  };
}
