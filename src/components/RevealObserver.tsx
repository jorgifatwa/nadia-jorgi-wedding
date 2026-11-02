"use client";

import { useEffect } from "react";

// Entrance animation for every element of every section: direct children of `.reveal-scope` start hidden (see
// globals.css) and are revealed the first time they scroll into view, staggered top-to-bottom.
// Elements marked `data-reveal-skip` (backgrounds) are never hidden.
const TARGETS = ".reveal-scope > :not([data-reveal-skip]):not([data-revealed])";
const STAGGER_MS = 90;
const MAX_STAGGER_STEPS = 6;

export const RevealObserver: React.FC = () => {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("reveal-ready");

    const reveal: IntersectionObserverCallback = (entries, observer) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((entry, idx) => {
          const el = entry.target as HTMLElement;
          el.style.transitionDelay = `${Math.min(idx, MAX_STAGGER_STEPS) * STAGGER_MS}ms`;
          el.addEventListener("transitionend", () => (el.style.transitionDelay = ""), { once: true });
          el.dataset.revealed = "";
          observer.unobserve(el);
        });
    };
    const io = new IntersectionObserver(reveal, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    // Pop-up pieces wait until the venue is well up the screen, so the guest is looking when it unfolds, and then all
    // unfold together (each piece's --reveal-delay sets the order: base, building, wings, trees)
    const ioPopup = new IntersectionObserver(
      (entries) => {
        const started = entries.find((entry) => entry.isIntersecting);
        if (!started) return;
        started.target.parentElement?.querySelectorAll<HTMLElement>(':scope > [data-reveal^="popup"]').forEach((el) => {
          el.dataset.revealed = "";
          ioPopup.unobserve(el);
        });
      },
      { threshold: 0.5, rootMargin: "0px 0px -40% 0px" },
    );

    // Sections can mount later (the invitation renders after the envelope is opened), so rescan on DOM changes
    const observed = new WeakSet<Element>();
    let frame = 0;
    const scan = () => {
      frame = 0;
      document.querySelectorAll(TARGETS).forEach((el) => {
        if (observed.has(el)) return;
        observed.add(el);
        (el.matches('[data-reveal^="popup"]') ? ioPopup : io).observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      ioPopup.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
};
