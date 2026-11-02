"use client";

import React from "react";
import { ClippedImage, MEDIA, canvasText, u } from "./canvasLayout";

export interface ClosingSectionProps {
  messageLines?: string[];
  seeYouText?: string;
  brideName?: string;
  ampersand?: string;
  groomName?: string;
}

// Closing section occupies 440 x 836.5 on the reference canvas (y = 6444.45 to the end); coordinates are section-local
const CANVAS_H = 836.5;

const MESSAGE_FONT = "'QuattrocentoLocal', 'Quattrocento', serif";

// Same V-shaped velvet lining cut-out as the opening envelope
const LINING_CLIP =
  "polygon(49.68% 0%, 51.01% 0.11%, 52.25% 0.84%, 73% 19.99%, 88.5% 35.08%, 100% 47.16%, 99.91% 47.27%, 99.95% 99.72%, 99.77% 100%, 0.23% 100%, 0.09% 99.89%, 0% 99.67%, 0.05% 47.22%, 6.21% 41.04%, 20.01% 27.84%, 31.74% 16.37%, 46.23% 2.78%, 47.88% 1%, 48.99% 0.22%)";

const messageLine = (y: number) =>
  canvasText([98.97, y, 242.05], MESSAGE_FONT, 11.3, 16.887, { renderScale: 0.31272 });

// Couple names sit in a group rotated -7.33deg; each line is placed by its centre and unrotated size (159.33 x 50.46)
const NameLine: React.FC<{ text: string; center: [x: number, y: number] }> = ({ text, center }) => (
  <div
    data-reveal="blur"
    style={{
      position: "absolute",
      left: u(center[0] - 159.33 / 2),
      top: u(center[1] - 50.46 / 2),
      width: u(159.33),
      height: u(50.46),
      transform: "rotate(-7.33deg)",
      pointerEvents: "none",
    }}
  >
    <p
      style={canvasText([0, 0, 159.33], "'SloopScript', 'Great Vibes', cursive", 50.63, 50.44, {
        letterSpacing: -0.1017,
        renderScale: 0.25865,
      })}
    >
      {text}
    </p>
  </div>
);

// Petals drifting down from the two hanging bouquets: start point under a bouquet, size, fall time and start delay (s),
// sideways sway and colour. They fall to just below the section and start over.
const PETALS: { at: [x: number, y: number]; size: number; duration: number; delay: number; sway: number; color: string }[] = [
  { at: [60, 250], size: 14, duration: 11, delay: 0.5, sway: 18, color: "#f6ece4" },
  { at: [300, 260], size: 15, duration: 12, delay: 1.8, sway: 20, color: "#ead0c7" },
  { at: [150, 270], size: 12, duration: 13, delay: 3.5, sway: -22, color: "#ead0c7" },
  { at: [380, 240], size: 13, duration: 14, delay: 5.5, sway: -16, color: "#f6ece4" },
  { at: [110, 230], size: 11, duration: 15, delay: 7.5, sway: 24, color: "#f6ece4" },
  { at: [340, 280], size: 14, duration: 11.5, delay: 9, sway: -20, color: "#ead0c7" },
  { at: [30, 290], size: 12, duration: 13.5, delay: 11, sway: 20, color: "#ead0c7" },
  { at: [410, 270], size: 11, duration: 12.5, delay: 12.5, sway: -18, color: "#f6ece4" },
];

const FallingPetals: React.FC = () => (
  <div data-reveal="rise" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    {PETALS.map((petal, idx) => (
      <div
        key={idx}
        className="falling-petal"
        style={
          {
            left: u(petal.at[0]),
            top: u(petal.at[1]),
            width: u(petal.size),
            height: u(petal.size * 1.4),
            "--fall": u(CANVAS_H + 20 - petal.at[1]),
            "--sway": u(petal.sway),
            "--duration": `${petal.duration}s`,
            "--delay": `${petal.delay}s`,
          } as React.CSSProperties
        }
      >
        <svg viewBox="0 0 20 28" width="100%" height="100%" aria-hidden="true">
          <path d="M10 0C17 6 20 15 15 24C13 27 7 27 5 24C0 15 3 6 10 0Z" fill={petal.color} />
          <path d="M10 5C9.5 12 10 18 10 24" stroke="#c9a59a" strokeWidth="0.8" fill="none" opacity="0.6" />
        </svg>
      </div>
    ))}
  </div>
);

export const ClosingSection: React.FC<ClosingSectionProps> = ({
  messageLines = [
    "Menjadi sebuah kebahagiaan",
    "bagi kami apabila Bapak/Ibu/Saudara/i",
    "berkenan hadir dalam hari bahagia kami.",
    "Terimakasih atas segala ucapan, doa, dan",
    "perhatian yang diberikan.",
  ],
  seeYouText = "Sampai jumpa di hari pernikahan kami!",
  brideName = "Nadia",
  ampersand = "&",
  groomName = "Jorgi",
}) => {
  return (
    <section
      id="section-closing"
      className="reveal-scope"
      data-reveal-style="cinematic"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `440 / ${CANVAS_H}`,
        flexShrink: 0,
        overflow: "hidden",
        containerType: "inline-size",
        backgroundColor: "#060e0a",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* 1. Emerald drapery background */}
      <ClippedImage
        src={`${MEDIA}/0683d2a13e7eb7e869898743f13f38be.webp`}
        alt="Emerald Drapery Background"
        img={[-163.74, -58.8, 792.67, 1190.95]}
        clip={[0, 0, 440, CANVAS_H]}
        skipReveal
      />

      {/* 2. Open envelope: back, burgundy lining, front pocket, florals on the right */}
      <ClippedImage src={`${MEDIA}/1e7bcbf0e72a46a3fc5a00d154822f44.webp`} alt="Envelope Back" img={[68.27, 433.91, 301.33, 320.56]} reveal="rise" />
      <ClippedImage
        src={`${MEDIA}/fd53e8793519ee86df4fd95a8217d781.webp`}
        alt="Burgundy Velvet Lining"
        img={[72.15, 313.29, 293.56, 522.52]}
        clip={[72.15, 453.29, 293.56, 242.52]}
        clipPath={LINING_CLIP}
        reveal="rise"
      />
      <ClippedImage
        src={`${MEDIA}/4eb403d7039697c0864925cfaaa203ee.webp`}
        alt="Envelope Front Pocket"
        img={[32.61, 398.41, 375.52, 469.41]}
        clip={[67.74, 563.82, 308.53, 190.64]}
        reveal="rise"
      />
      <ClippedImage
        src={`${MEDIA}/e3bde292a4e6ad355db1ff202a901599.webp`}
        alt="Envelope Florals"
        img={[144.94, 457.5, 295.05, 368.81]}
        clip={[250.18, 589.11, 189.81, 237.2]}
        reveal="rise"
      />

      {/* 3. Hanging bouquet, top right (mirrored) */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.webp`}
        alt="Hanging Florals Right"
        img={[234.79, -54.94, 282.95, 353.69]}
        clip={[234.79, 0, 205.21, 298.75]}
        flipX
        reveal="sway-right"
        parallax="hanging"
      />

      {/* 4. Ornate burgundy card with tassel */}
      <ClippedImage
        src={`${MEDIA}/01734adcdeb9a49604ebce7dec006c9a.webp`}
        alt="Ornate Burgundy Card"
        img={[41.26, 41.5, 361.5, 642.66]}
        clip={[55.87, 96.89, 332.27, 587.27]}
      />
      <div
        data-reveal="drop"
        style={{
          position: "absolute",
          left: u(209.14),
          top: u(534.67),
          width: u(21.61),
          height: u(21.61),
          borderRadius: "50%",
          backgroundColor: "#381410",
          pointerEvents: "none",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${MEDIA}/f002c1dc18ae3027cd46edbe0ad35f38.webp`}
        alt="Emerald Silk Tassel"
        data-reveal="drop"
        draggable={false}
        style={{
          position: "absolute",
          left: u(219.945 - 58.66 / 2),
          top: u(599.47 - 120.68 / 2),
          width: u(58.66),
          height: u(120.68),
          maxWidth: "none",
          transform: "rotate(1.234deg)",
          pointerEvents: "none",
        }}
      />

      {/* 5. Closing message */}
      {messageLines.map((line, idx) => (
        <p key={idx} data-reveal="blur" style={messageLine(202.82 + idx * 16.887)}>
          {line}
        </p>
      ))}
      <p data-reveal="blur" style={messageLine(304.16)}>{seeYouText}</p>

      {/* 6. Couple names */}
      <NameLine text={brideName} center={[213.5, 384.09]} />
      <NameLine text={ampersand} center={[219.95, 434.13]} />
      <NameLine text={groomName} center={[226.39, 484.17]} />

      {/* 7. Flapping white butterfly perched on the card */}
      <ClippedImage src="/images/butterfly_flapping.webp" alt="Flapping White Butterfly" img={[266.85, 146.1, 66.72, 69.66]} reveal="pop" />

      {/* 8. Hanging bouquet, top left */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.webp`}
        alt="Hanging Florals Left"
        img={[-69.33, -54.94, 282.95, 353.69]}
        clip={[0, 0, 213.63, 298.75]}
        reveal="sway"
        parallax="hanging"
      />

      {/* 9. Petals falling from the bouquets */}
      <FallingPetals />
    </section>
  );
};
