"use client";

import React, { useState } from "react";
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
import { ClosingSection } from "@/components/ClosingSection";

export default function Home() {
  const [isOpened, setIsOpened] = useState(false);

  return (
    <WeddingAudioProvider>
      <ToastProvider>
        <RevealObserver />
        <ContentGuard />
        {/* On Desktop/PC: Centered clean mobile view on sleek dark luxury backdrop */}
        {/* On Mobile: 100% full screen view without any white bars */}
        <main
          className="min-h-screen w-full flex justify-center items-center overflow-x-hidden"
          style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#121212",
          }}
        >
          {/* Centered Mobile Container: fills the phone width (up to 440px, iPhone 16 Pro Max) and the full viewport height */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "440px",
              height: "100dvh",
              backgroundColor: "#060e0a",
              boxShadow: "0 0 50px rgba(0,0,0,0.9)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {!isOpened ? (
              <EnvelopeLanding onOpen={() => setIsOpened(true)} />
            ) : (
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
                <InvitationDetails onBack={() => setIsOpened(false)} />
                <CoupleSection />
                <EventSection />
                <GiftSection />
                <WishesSection />
                <GallerySection />
                <ClosingSection />
              </div>
            )}
          </div>
        </main>
      </ToastProvider>
    </WeddingAudioProvider>
  );
}
