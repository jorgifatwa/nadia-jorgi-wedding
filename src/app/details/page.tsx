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
import { ClosingSection } from "@/components/ClosingSection";

export default function DetailsPage() {
  return (
    <WeddingAudioProvider>
      <ToastProvider>
        <RevealObserver />
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
