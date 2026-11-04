"use client";

import React, { useRef, useState } from "react";
import { WeddingAudioProvider } from "@/components/WeddingAudio";
import { ToastProvider } from "@/components/Toast";
import { EnvelopeLanding } from "@/components/EnvelopeLanding";
import { InvitationDetails } from "@/components/InvitationDetails";
import { CoupleSection } from "@/components/CoupleSection";
import { EventSection } from "@/components/EventSection";
import { GiftSection } from "@/components/GiftSection";
import { GallerySection } from "@/components/GallerySection";
import { WishesSection } from "@/components/WishesSection";
import { RevealObserver } from "@/components/RevealObserver";
import { ContentGuard } from "@/components/ContentGuard";
import { ParallaxObserver } from "@/components/ParallaxObserver";
import { ClosingSection } from "@/components/ClosingSection";
import { SakuraLayer, type SakuraHandle } from "@/components/Sakura";

export default function Home() {
  // The invitation mounts while the envelope-opening transition is still on top, then the landing is removed
  const [isOpened, setIsOpened] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  // Sakura petals spill out of the opened envelope, then keep falling over the whole invitation
  const sakura = useRef<SakuraHandle | null>(null);
  const [petalsOut, setPetalsOut] = useState(false);

  return (
    <WeddingAudioProvider>
      <ToastProvider>
        <RevealObserver />
        <ContentGuard />
        <ParallaxObserver />
        {/* On Desktop/PC: Centered clean mobile view on sleek dark luxury backdrop */}
        {/* On Mobile: 100% full screen view without any white bars */}
        <main
          // Pinned to the screen edges rather than sized with vh/dvh: iOS Safari's floating toolbars make dvh shorter
          // than the visible area, which left a dark band under the invitation
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: "#121212",
          }}
        >
          {/* Centered Mobile Container: fills the phone width (up to 440px, iPhone 16 Pro Max) and the full screen height */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "440px",
              height: "100%",
              backgroundColor: "#060e0a",
              boxShadow: "0 0 50px rgba(0,0,0,0.9)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {isOpened && (
              <div
                id="invitation-scroll-container"
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  flex: 1,
                  overflowY: "auto",
                  overflowX: "hidden",
                  scrollBehavior: "smooth",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <InvitationDetails introPlayed />
                <CoupleSection />
                <EventSection />
                <GiftSection />
                <WishesSection />
                <GallerySection />
                <ClosingSection />
              </div>
            )}
            {showLanding && (
              <EnvelopeLanding
                onOpen={() => setIsOpened(true)}
                onFinished={() => {
                  setShowLanding(false);
                  setPetalsOut(true); // a skipped opening has no burst, but still gets the rain
                }}
                onPetalBurst={(x, y) => {
                  sakura.current?.burst(x, y);
                  setPetalsOut(true);
                }}
              />
            )}
            <SakuraLayer ref={sakura} raining={petalsOut} enterFromTop />
          </div>
        </main>
      </ToastProvider>
    </WeddingAudioProvider>
  );
}
