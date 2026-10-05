import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 0 while the hero fills the viewport, 1 once it has fully left. Drives the music fade. */
const heroListeners = new Set<(value: number) => void>();
let heroValue = 0;

export function onHeroProgress(fn: (value: number) => void) {
  heroListeners.add(fn);
  fn(heroValue);
  return () => {
    heroListeners.delete(fn);
  };
}

function setHeroProgress(value: number) {
  heroValue = value;
  heroListeners.forEach((fn) => fn(value));
}

/**
 * One orchestration for the whole page. Returns a cleanup that kills every trigger it made.
 */
export function initPageMotion(scope: HTMLElement) {
  const reduced = prefersReducedMotion();

  const ctx = gsap.context(() => {
    // Section reveals. Already-visible default is the fallback: `.reveal` only hides once
    // JS has confirmed it can animate, so a failed bundle never leaves the page blank.
    const groups = gsap.utils.toArray<HTMLElement>("[data-reveal-group]");
    groups.forEach((group) => {
      const items = gsap.utils.toArray<HTMLElement>(".reveal", group);
      if (!items.length) return;
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: reduced ? 0.01 : 0.62,
        ease: "expo.out",
        stagger: reduced ? 0 : 0.055,
        scrollTrigger: { trigger: group, start: "top 82%", once: true },
      });
    });

    const rail = document.querySelector<HTMLElement>(".rail-fill");
    if (rail) {
      gsap.to(rail, {
        height: "100%",
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.35 },
      });
    }

    const media = scope.querySelector<HTMLElement>(".hero-media");
    const hero = scope.querySelector<HTMLElement>(".hero");
    if (!hero) return;

    // The signature moment: the head drifts up, loses weight and dissolves as the hero
    // leaves, and the same progress value fades the music out. One trigger, three effects.
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: reduced ? false : 0.4,
      onUpdate: (self) => setHeroProgress(self.progress),
      animation:
        reduced || !media
          ? undefined
          : gsap.to(media, {
              yPercent: -14,
              scale: 1.07,
              opacity: 0,
              filter: "blur(9px)",
              ease: "power1.in",
            }),
    });

    // Entrance, not scroll-triggered: the hero is the first thing on screen, so it plays
    // once on mount rather than waiting for an intersection that has already happened.
    const copyItems = gsap.utils.toArray<HTMLElement>(".hero-copy > *", hero);
    if (copyItems.length) {
      gsap.from(copyItems, {
        y: reduced ? 0 : 18,
        opacity: 0,
        duration: reduced ? 0.01 : 0.75,
        ease: "expo.out",
        stagger: reduced ? 0 : 0.09,
        delay: reduced ? 0 : 0.1,
      });
    }
    if (media && !reduced) {
      gsap.from(media, {
        opacity: 0,
        scale: 1.05,
        duration: 1.1,
        ease: "power2.out",
      });
    }
  }, scope);

  return () => {
    ctx.revert();
    setHeroProgress(0);
  };
}

/** Which section the reader is in, for the progress rail. */
export function watchActiveSection(
  ids: string[],
  set: (index: number) => void,
) {
  const triggers = ids.map((id, index) => {
    const el = document.getElementById(id);
    if (!el) return null;
    return ScrollTrigger.create({
      trigger: el,
      start: "top 45%",
      end: "bottom 45%",
      onToggle: (self) => self.isActive && set(index),
    });
  });
  return () => triggers.forEach((t) => t?.kill());
}
