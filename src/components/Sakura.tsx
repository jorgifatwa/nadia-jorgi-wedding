"use client";

import React, { useEffect, useImperativeHandle, useRef, useState } from "react";

// Sakura petals: the falling layer over the whole invitation, the burst out of the envelope when it opens, and the
// petal shape shared with the seal (EnvelopeLanding) and the closing bouquets (ClosingSection).

export const SAKURA_COLORS = ["#f9d0db", "#f6bfcd", "#fbe4ea", "#f6ece4"];

// A sakura petal (notched tip at the top), drawn in a 20 x 24 box
export const SakuraPetal: React.FC<{ color: string; style?: React.CSSProperties; className?: string }> = ({ color, style, className }) => (
  <svg viewBox="0 0 20 24" width="100%" height="100%" aria-hidden="true" style={{ display: "block", ...style }} className={className}>
    <path d="M10 24C4.6 20.4 0.4 14 1.6 7.2C2.3 3.4 4.8 0.6 7.6 1.6L10 4.4L12.4 1.6C15.2 0.6 17.7 3.4 18.4 7.2C19.6 14 15.4 20.4 10 24Z" fill={color} />
    <path d="M10 8.5C9.6 13 9.8 17.5 10 21" stroke="#e7a3b3" strokeWidth="0.7" fill="none" opacity="0.55" />
  </svg>
);

// Falling petals on screen at once; how many show depends on the section in view (busy text sections get fewer)
const RAIN = [
  { left: 6, size: 12, duration: 11, sway: 18, depth: 0.7 },
  { left: 82, size: 14, duration: 13, sway: -22, depth: 1.2 },
  { left: 38, size: 10, duration: 12, sway: 16, depth: 0.6 },
  { left: 64, size: 13, duration: 14.5, sway: -18, depth: 1 },
  { left: 18, size: 15, duration: 12.5, sway: 24, depth: 1.4 },
  { left: 92, size: 11, duration: 10.5, sway: -14, depth: 0.8 },
  { left: 50, size: 12, duration: 15, sway: 20, depth: 1.1 },
  { left: 28, size: 11, duration: 13.5, sway: -20, depth: 0.9 },
  { left: 72, size: 14, duration: 11.5, sway: 22, depth: 1.3 },
  { left: 12, size: 10, duration: 14, sway: -16, depth: 0.7 },
  { left: 56, size: 13, duration: 12, sway: 18, depth: 1.2 },
  { left: 88, size: 12, duration: 13, sway: -24, depth: 1 },
];

// Petals shown per section (by id; Section 1 has none). The rest of the sections get NORMAL.
const DENSITY: Record<string, number> = { "section-event": 6, "section-gift": 6, "section-wishes": 5, "section-closing": 12 };
const DENSITY_NORMAL = 9;
const DENSITY_OPENING = 12;

// Petals thrown out of the envelope mouth
const BURST_COUNT = 22;

// Scrolling blows the petals along: scroll speed (px per frame) -> wind offset, eased back to calm
const WIND_PER_PX = 5;
const WIND_MAX = 140;
const WIND_EASE = 0.1;

export interface SakuraHandle {
  // Throws petals out of a point on screen (viewport px), e.g. the envelope opening
  burst: (x: number, y: number) => void;
}

interface Burst {
  id: number;
  x: number;
  y: number;
}

// Deterministic spread so server and client render the same petals
const seeded = (i: number, salt: number) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

export const SakuraLayer: React.FC<{
  // Whether the rain falls (on the landing page only once the envelope has opened)
  raining: boolean;
  // Petals drift in from the top (after the envelope burst) instead of already being mid-fall
  enterFromTop?: boolean;
  ref?: React.Ref<SakuraHandle>;
}> = ({ raining, enterFromTop = false, ref }) => {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useImperativeHandle(ref, () => ({
    burst: (x, y) => {
      const layer = layerRef.current;
      if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const box = layer.getBoundingClientRect();
      const id = Date.now();
      setBursts((prev) => [...prev, { id, x: x - box.left, y: y - box.top }]);
      setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 4500);
    },
  }));

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    const initial = setTimeout(update, 0);
    query.addEventListener("change", update);
    return () => {
      clearTimeout(initial);
      query.removeEventListener("change", update);
    };
  }, []);

  // Wind from scrolling, and the petal count of the section in view
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !raining || reducedMotion) return;
    let lastTop: number | null = null;
    let target = 0;
    let wind = 0;
    let frame = 0;

    const tick = () => {
      wind += (target - wind) * WIND_EASE;
      target *= 0.85;
      layer.style.setProperty("--wind", wind.toFixed(2));
      frame = Math.abs(wind) > 0.2 || Math.abs(target) > 0.2 ? requestAnimationFrame(tick) : 0;
      if (!frame) layer.style.setProperty("--wind", "0");
    };

    const density = () => {
      const box = layer.getBoundingClientRect();
      // Petals ignore the pointer, so this finds the section under the middle of the screen
      const section = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest("section");
      const count = section?.id ? (DENSITY[section.id] ?? DENSITY_NORMAL) : DENSITY_OPENING;
      layer.dataset.density = String(count);
    };

    const onScroll = (e: Event) => {
      const el = e.target as HTMLElement;
      if (!(el instanceof HTMLElement) || !el.id.endsWith("scroll-container")) return;
      if (lastTop !== null) {
        const delta = el.scrollTop - lastTop;
        target = Math.max(-WIND_MAX, Math.min(WIND_MAX, target + delta * WIND_PER_PX * 0.2));
        if (!frame) frame = requestAnimationFrame(tick);
      }
      lastTop = el.scrollTop;
      density();
    };

    density();
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      cancelAnimationFrame(frame);
    };
  }, [raining, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div ref={layerRef} className="sakura-layer" data-density={DENSITY_OPENING} aria-hidden="true">
      <div className="sakura-rain-group">
      {raining &&
        RAIN.map((petal, i) => (
          <div
            key={i}
            className="sakura-rain"
            style={
              {
                left: `${petal.left}%`,
                width: petal.size,
                height: petal.size * 1.2,
                "--depth": petal.depth,
                "--sway": `${petal.sway}px`,
                "--duration": `${petal.duration}s`,
                // Mid-fall from the start, or dropping in one after another after the envelope burst
                "--delay": enterFromTop ? `${(i * 0.7 + seeded(i, 1) * 0.5).toFixed(2)}s` : `${(-seeded(i, 2) * petal.duration).toFixed(2)}s`,
              } as React.CSSProperties
            }
          >
            <div className="sakura-fall">
              <SakuraPetal color={SAKURA_COLORS[i % SAKURA_COLORS.length]} className="sakura-tumble" />
            </div>
          </div>
        ))}
      </div>

      {bursts.map((b) =>
        Array.from({ length: BURST_COUNT }, (_, i) => {
          // Fanned out upwards from the opening, then falling past the bottom of the screen with a sway
          const angle = -90 + (seeded(i, 3) - 0.5) * 150;
          const speed = 90 + seeded(i, 4) * 150;
          const size = 9 + seeded(i, 5) * 7;
          return (
            <div
              key={`${b.id}-${i}`}
              className="sakura-burst"
              style={
                {
                  left: b.x - size / 2,
                  top: b.y - size / 2,
                  width: size,
                  height: size * 1.2,
                  "--bx": `${(Math.cos((angle * Math.PI) / 180) * speed).toFixed(1)}px`,
                  "--by": `${(Math.sin((angle * Math.PI) / 180) * speed).toFixed(1)}px`,
                  "--drop": `${(260 + seeded(i, 6) * 260).toFixed(0)}px`,
                  "--spin": `${((seeded(i, 7) - 0.5) * 720).toFixed(0)}deg`,
                  "--duration": `${(2.4 + seeded(i, 8) * 1.4).toFixed(2)}s`,
                  "--delay": `${(seeded(i, 9) * 0.25).toFixed(2)}s`,
                } as React.CSSProperties
              }
            >
              <SakuraPetal color={SAKURA_COLORS[i % SAKURA_COLORS.length]} className="sakura-tumble" />
            </div>
          );
        }),
      )}
    </div>
  );
};
