"use client";

import React from "react";
import { WeddingAudioProvider } from "@/components/WeddingAudio";
import { ToastProvider } from "@/components/Toast";
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

export default function DetailsPage() {
  return (
    <WeddingAudioProvider>
      <ToastProvider>
        <RevealObserver />
        <ContentGuard />
        <ParallaxObserver />
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
            <div
              id="details-scroll-container"
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
              <InvitationDetails />
              <CoupleSection />
              <EventSection />
              <GiftSection />
              <WishesSection />
              <GallerySection />
              <ClosingSection />
            </div>
          </div>
        </main>
      </ToastProvider>
    </WeddingAudioProvider>
  );
}
