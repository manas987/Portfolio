import { useEffect, type RefObject } from "react";

const SVG_NS = "http://www.w3.org/2000/svg";

/* Only Chromium renders SVG filters inside backdrop-filter. Elsewhere the CSS frosted
   fallback in `.glass` stays in place. */
const supportsRefraction = () =>
  typeof navigator !== "undefined" &&
  Boolean(
    (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands.some(
      (b) => b.brand === "Chromium",
    ),
  );

/**
 * Displacement map for a rounded rectangle: inside a bezel band along the edge, each pixel
 * points inward along the edge normal, strongest at the rim. Fed to feDisplacementMap, that
 * pulls the backdrop in from the inside so the edges bend it like a lens. R and G carry the
 * x and y offsets around a neutral 128.
 */
function displacementMap(w: number, h: number, radius: number, bezel: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(w, h);
  const r = Math.min(radius, w / 2, h / 2);
  const sdf = (px: number, py: number) => {
    const qx = Math.abs(px - w / 2) - (w / 2 - r);
    const qy = Math.abs(py - h / 2) - (h / 2 - r);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const depth = -sdf(px, py); // distance in from the edge
      let dx = 0;
      let dy = 0;
      if (depth > 0 && depth < bezel) {
        const nx = sdf(px + 1, py) - sdf(px - 1, py);
        const ny = sdf(px, py + 1) - sdf(px, py - 1);
        const len = Math.hypot(nx, ny) || 1;
        const strength = (1 - depth / bezel) ** 2;
        dx = (-nx / len) * strength;
        dy = (-ny / len) * strength;
      }
      const i = (y * w + x) * 4;
      image.data[i] = 128 + dx * 127;
      image.data[i + 1] = 128 + dy * 127;
      image.data[i + 2] = 128;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

/**
 * Gives an element a refractive glass backdrop: its own SVG filter whose displacement map
 * matches the element's size and corner radius, rebuilt when it resizes.
 */
export function useLiquidGlass(
  ref: RefObject<HTMLElement | null>,
  { bezel = 11, scale = 20 }: { bezel?: number; scale?: number } = {},
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !supportsRefraction()) return;

    const id = `glass-${Math.random().toString(36).slice(2, 9)}`;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    svg.innerHTML = `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feImage x="0" y="0" result="map" preserveAspectRatio="none" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="${scale}" xChannelSelector="R" yChannelSelector="G" />
    </filter>`;
    document.body.appendChild(svg);
    const image = svg.querySelector("feImage")!;

    const update = () => {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (!w || !h) return;
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || h / 2;
      image.setAttribute("width", String(w));
      image.setAttribute("height", String(h));
      image.setAttribute("href", displacementMap(w, h, radius, bezel));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    el.style.backdropFilter = `url(#${id}) blur(1.2px) saturate(1.6)`;

    return () => {
      observer.disconnect();
      svg.remove();
      el.style.backdropFilter = "";
    };
  }, [ref, bezel, scale]);
}
