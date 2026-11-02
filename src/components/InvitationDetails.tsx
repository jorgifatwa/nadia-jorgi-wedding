"use client";

import React, { useRef } from "react";
import { useWeddingAudio } from "./WeddingAudio";
import { CANVAS_W, ClippedImage, MEDIA, u, type Box } from "./canvasLayout";

interface InvitationDetailsProps {
  onBack?: () => void;
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

const verseTextStyle: React.CSSProperties = {
  position: "absolute",
  left: u(123.9),
  width: u(192.2),
  margin: 0,
  fontFamily: "'VerseSerifLocal', 'Noto Serif', 'Droid Serif', serif",
  fontSize: u(10.526),
  lineHeight: u(14.488),
  fontWeight: 400,
  color: "#2d110e",
  textAlign: "center",
  whiteSpace: "pre-line",
  pointerEvents: "none",
};

export const InvitationDetails: React.FC<InvitationDetailsProps> = () => {
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
        src={`${MEDIA}/0683d2a13e7eb7e869898743f13f38be.png`}
        alt="Emerald Drapery Background"
        img={[-164.6, -100.4, 715.1, 1074.4]}
        clip={[0, 0, CANVAS_W, CANVAS_H]}
        skipReveal
      />

      {/* 2. Large top-left bouquet (behind the lace card) */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt="Top Left Flower Bouquet"
        img={[15.6, 88.1, 262, 327.5]}
      />

      {/* 3. Envelope back */}
      <ClippedImage
        src={`${MEDIA}/1e7bcbf0e72a46a3fc5a00d154822f44.png`}
        alt="Envelope Back"
        img={[68.3, 402.3, 301.3, 320.6]}
      />

      {/* 4. Burgundy velvet lining */}
      <ClippedImage
        src={`${MEDIA}/fd53e8793519ee86df4fd95a8217d781.png`}
        alt="Burgundy Velvet Lining"
        img={[72.2, 281.7, 293.6, 522.5]}
        clip={[72.2, 421.7, 293.5, 242.5]}
        clipPath="polygon(49.68% 0%, 51.01% 0.11%, 52.25% 0.84%, 73% 19.99%, 88.5% 35.08%, 100% 47.16%, 99.91% 47.27%, 99.95% 99.72%, 99.77% 100%, 0.23% 100%, 0.09% 99.89%, 0% 99.67%, 0.05% 47.22%, 6.21% 41.04%, 20.01% 27.84%, 31.74% 16.37%, 46.23% 2.78%, 47.88% 1%, 48.99% 0.22%)"
      />

      {/* 5. Envelope front pocket */}
      <ClippedImage
        src={`${MEDIA}/4eb403d7039697c0864925cfaaa203ee.png`}
        alt="Envelope Front Pocket"
        img={[32.6, 366.8, 375.5, 469.4]}
        clip={[67.7, 532.2, 308.6, 190.7]}
      />

      {/* 6. Oval lace doily card */}
      <ClippedImage
        src={`${MEDIA}/ca52e90c3dc4ba78c450200739a6e3c8.png`}
        alt="Lace Doily Card"
        img={[63.3, 122.9, 304.3, 434.7]}
        clip={[67.7, 130.1, 299.9, 427.4]}
      />

      {/* 7. Right cascading bouquet (bleeds off the right edge) */}
      <ClippedImage
        src={`${MEDIA}/e3bde292a4e6ad355db1ff202a901599.png`}
        alt="Right Side Cascading Flowers"
        img={[158.3, 431.9, 281.7, 352.1]}
        clip={[258.8, 557.5, 181.2, 226.5]}
      />

      {/* 8. QS Ar-Rum 21 verse */}
      <p style={{ ...verseTextStyle, top: u(255.3) }}>
        {`"Dan di antara tanda-tanda\n(kebesaran)-Nya ialah Dia\nmenciptakan pasangan-pasangan\nuntukmu dari jenismu sendiri, agar\nkamu cenderung dan merasa\ntenteram kepadanya, dan Dia\nmenjadikan di antaramu rasa kasih\ndan sayang. Sungguh, pada yang\ndemikian itu benar-benar terdapat\ntanda-tanda (kebesaran Allah) bagi\nkaum yang berpikir."`}
      </p>
      <p style={{ ...verseTextStyle, top: u(429.3) }}>QS Ar-Rum 21</p>

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
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt="Top Left Flower Accent"
        img={[44, 191.2, 134.5, 168.2]}
      />
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt="Top Flower Accent"
        img={[111.3, 117, 134.5, 168.2]}
      />

      {/* 12. Flapping white butterfly */}
      <ClippedImage src="/images/butterfly_flapping.gif" alt="Flapping White Butterfly" img={[156.3, 108.9, 54.3, 56.7]} />

      {/* 13. Burgundy silk tassel (rotated ~1.23deg about its top-left, as in the reference) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${MEDIA}/c908061d4359aa428f27db3c46c60274.png`}
        alt="Burgundy Silk Tassel"
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
