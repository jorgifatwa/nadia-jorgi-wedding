"use client";

import React, { useEffect, useRef } from "react";

// Twinkling star cluster from the reference (Lottie, 767 x 1080), played in a loop
const SPARKLE_PATH = "/drapery_assets/video/e6d79719ef82472eff99c3e182dd4321.json";

export const LottieSparkle: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animation: { destroy: () => void } | undefined;
    let cancelled = false;

    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (cancelled || !containerRef.current) return;
      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: SPARKLE_PATH,
      });
    });

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, []);

  return <div ref={containerRef} aria-hidden="true" style={{ pointerEvents: "none", ...style }} />;
};
