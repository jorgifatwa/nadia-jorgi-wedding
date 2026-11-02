"use client";

import React, { useRef } from "react";
import { useWeddingAudio } from "./WeddingAudio";
import { CANVAS_W, ClippedImage, MEDIA, u, type Box } from "./canvasLayout";
import { EnvelopeBack, EnvelopeFront, EnvelopeLining, LaceCard, Verse } from "./introEnvelope";

interface InvitationDetailsProps {
  // Set when the envelope-opening transition already drew the envelope and card in place
  introPlayed?: boolean;
}

// Section 1 occupies 440 x 903.8 on the reference canvas (Section 2 starts at y = 903.8)
const CANVAS_H = 903.8;

const CREAM = "#ebe2d3";

// Player glyphs; each viewBox is cropped to the glyph bounds so the rendered box equals the measured reference box
const PlayerIcon: React.FC<{ box: Box; viewBox: string; d: string; fill?: string }> = ({ box, viewBox, d, fill = CREAM }) => (
  <svg
    viewBox={viewBox}
    preserveAspectRatio="none"
    style={{
      position: "absolute",
      left: u(box[0]),
      top: u(box[1]),
      width: u(box[2]),
      height: u(box[3]),
      pointerEvents: "none",
    }}
  >
    <path d={d} fill={fill} />
  </svg>
);

export const InvitationDetails: React.FC<InvitationDetailsProps> = ({ introPlayed = false }) => {
  const { isPlaying, toggleAudio, currentTime, duration, seekAudio } = useWeddingAudio();
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Audio progress percentage (default 15% when idle, matching the reference player artwork)
  const progressPercent = duration > 0 && currentTime > 0 ? (currentTime / duration) * 100 : 15;
  const clampedPercent = Math.min(100, Math.max(0, progressPercent));

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
    seekAudio(newPercent * duration);
  };

  // Invisible tap targets, larger than the glyphs (30-40 canvas px) so they stay usable on narrow phones
  const hitButton = (box: Box, label: string, onClick?: () => void) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        position: "absolute",
        left: u(box[0]),
        top: u(box[1]),
        width: u(box[2]),
        height: u(box[3]),
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        zIndex: 1,
      }}
    />
  );

  return (
    <div
      className="reveal-scope"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
        flexShrink: 0,
        overflow: "hidden",
        containerType: "inline-size",
        backgroundColor: "#060e0a",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* 1. Emerald drapery + red damask carpet background */}
      <ClippedImage
        src={`${MEDIA}/0683d2a13e7eb7e869898743f13f38be.webp`}
        alt="Emerald Drapery Background"
        img={[-164.6, -100.4, 715.1, 1074.4]}
        clip={[0, 0, CANVAS_W, CANVAS_H]}
        skipReveal
      />

      {/* 2. Large top-left bouquet (behind the lace card) */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.webp`}
        alt="Top Left Flower Bouquet"
        img={[15.6, 88.1, 262, 327.5]}
        reveal="sway"
      />

      {/* 3-6. Opened envelope (back, burgundy lining, front pocket) and the oval lace card; already in place when the
             guest arrives through the envelope-opening transition */}
      <EnvelopeBack reveal="rise" skipReveal={introPlayed} />
      <EnvelopeLining reveal="rise" skipReveal={introPlayed} />
      <EnvelopeFront reveal="rise" skipReveal={introPlayed} />
      <LaceCard skipReveal={introPlayed} />

      {/* 7. Right cascading bouquet (bleeds off the right edge) */}
      <ClippedImage
        src={`${MEDIA}/e3bde292a4e6ad355db1ff202a901599.webp`}
        alt="Right Side Cascading Flowers"
        img={[158.3, 431.9, 281.7, 352.1]}
        clip={[258.8, 557.5, 181.2, 226.5]}
        reveal="rise"
      />

      {/* 8. QS Ar-Rum 21 verse */}
      <Verse skipReveal={introPlayed} />

      {/* 9. Music player */}
      <>
        {/* Scrubber: 2px track with knob, generous hit area */}
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          style={{
            position: "absolute",
            left: u(139),
            top: u(763.3),
            width: u(161.7),
            height: u(14),
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: u(6),
              height: u(2),
              backgroundColor: CREAM,
              borderRadius: "9999px",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${clampedPercent}%`,
              top: u(7),
              width: u(8.3),
              height: u(8.3),
              transform: "translate(-50%, -50%)",
              borderRadius: "9999px",
              backgroundColor: CREAM,
              transition: "left 200ms ease",
            }}
          />
        </div>

        {/* Shuffle */}
        <PlayerIcon
          box={[139, 794.2, 13.7, 10]}
          viewBox="4 4 16 16"
          d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
        />
        {hitButton([130.85, 784, 30, 30], "Shuffle")}

        {/* Previous */}
        <PlayerIcon box={[170.3, 792.5, 13.2, 13]} viewBox="6 6 11.5 12" d="M6 6h2v12H6zm3.5 6l8 6V6z" />
        {hitButton([161.9, 784, 30, 30], "Previous", () => seekAudio(0))}

        {/* Play / Pause */}
        <div
          style={{
            position: "absolute",
            left: u(202.8),
            top: u(782),
            width: u(33.9),
            height: u(33.9),
            borderRadius: "9999px",
            backgroundColor: CREAM,
            pointerEvents: "none",
          }}
        />
        {isPlaying ? (
          <PlayerIcon box={[213.8, 792.2, 11.9, 13.6]} viewBox="6 5 12 14" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="#3b1712" />
        ) : (
          <PlayerIcon box={[216.2, 792.2, 12.3, 13.6]} viewBox="8 5 11 14" d="M8 5v14l11-7z" fill="#3b1712" />
        )}
        {hitButton([199.75, 778.9, 40, 40], isPlaying ? "Pause music" : "Play music", toggleAudio)}

        {/* Next */}
        <PlayerIcon box={[256.5, 792.5, 12.5, 13]} viewBox="6 6 12 12" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        {hitButton([247.75, 784, 30, 30], "Next", () => seekAudio(0))}

        {/* Repeat */}
        <PlayerIcon
          box={[288.2, 793.3, 12.5, 10.9]}
          viewBox="3 1 18 22"
          d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"
        />
        {hitButton([279.45, 784, 30, 30], "Repeat")}
      </>

      {/* 10. Player caption */}
      <button
        type="button"
        onClick={toggleAudio}
        style={{
          position: "absolute",
          left: u(112),
          top: u(827.3),
          width: u(216),
          margin: 0,
          padding: 0,
          background: "none",
          border: "none",
          fontFamily: "'CormorantLocal', 'Cormorant Garamond', serif",
          fontSize: u(12.582),
          lineHeight: u(18.67),
          fontWeight: 400,
          color: "#faf3ed",
          textAlign: "center",
          whiteSpace: "nowrap",
          cursor: "pointer",
        }}
      >
        click on the player to listen to our song
      </button>

      {/* 11. Small bouquet copies layered over the card's top-left edge */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.webp`}
        alt="Top Left Flower Accent"
        img={[44, 191.2, 134.5, 168.2]}
        reveal="sway"
      />
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.webp`}
        alt="Top Flower Accent"
        img={[111.3, 117, 134.5, 168.2]}
        reveal="sway-right"
      />

      {/* 12. Flapping white butterfly */}
      <ClippedImage src="/images/butterfly_flapping.webp" alt="Flapping White Butterfly" img={[156.3, 108.9, 54.3, 56.7]} reveal="pop" />

      {/* 13. Burgundy silk tassel (rotated ~1.23deg about its top-left, as in the reference) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${MEDIA}/c908061d4359aa428f27db3c46c60274.webp`}
        alt="Burgundy Silk Tassel"
        data-reveal="drop"
        draggable={false}
        style={{
          position: "absolute",
          left: u(193.14),
          top: u(478.53),
          width: u(53.75),
          height: u(110.4),
          maxWidth: "none",
          transformOrigin: "0 0",
          transform: "rotate(1.234deg)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
