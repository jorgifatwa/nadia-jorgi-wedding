"use client";

import { useEffect } from "react";

// Foreground flowers (`data-parallax`) drift slightly faster than the page while scrolling, which gives the sections
// depth. The offset grows as a flower moves away from the middle of the screen: hanging flowers only rise (in the top
// half), floor flowers only sink (in the bottom half), so their cut edges never come into view.
const DEPTH = 0.08;

export const ParallaxObserver: React.FC = () => {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const offsets = new WeakMap<HTMLElement, number>();

    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      const elements = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
      // Read every position first, then write, so the browser lays out once
      const next = elements.map((el) => {
        const rect = el.getBoundingClientRect();
        const centre = rect.top + rect.height / 2 - (offsets.get(el) ?? 0);
        const distance = centre - middle;
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return null;
        return el.dataset.parallax === "hanging" ? Math.min(0, distance) * DEPTH : Math.max(0, distance) * DEPTH;
      });
      elements.forEach((el, idx) => {
        const offset = next[idx];
        if (offset === null || offset === offsets.get(el)) return;
        offsets.set(el, offset);
        el.style.setProperty("--parallax", `${offset.toFixed(1)}px`);
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // The invitation scrolls inside its own container, so listen in the capture phase for any scroll
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      document.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
};
