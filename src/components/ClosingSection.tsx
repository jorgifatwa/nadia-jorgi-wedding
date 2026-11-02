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
        src={`${MEDIA}/0683d2a13e7eb7e869898743f13f38be.png`}
        alt="Emerald Drapery Background"
        img={[-163.74, -58.8, 792.67, 1190.95]}
        clip={[0, 0, 440, CANVAS_H]}
        skipReveal
      />

      {/* 2. Open envelope: back, burgundy lining, front pocket, florals on the right */}
      <ClippedImage src={`${MEDIA}/1e7bcbf0e72a46a3fc5a00d154822f44.png`} alt="Envelope Back" img={[68.27, 433.91, 301.33, 320.56]} />
      <ClippedImage
        src={`${MEDIA}/fd53e8793519ee86df4fd95a8217d781.png`}
        alt="Burgundy Velvet Lining"
        img={[72.15, 313.29, 293.56, 522.52]}
        clip={[72.15, 453.29, 293.56, 242.52]}
        clipPath={LINING_CLIP}
      />
      <ClippedImage
        src={`${MEDIA}/4eb403d7039697c0864925cfaaa203ee.png`}
        alt="Envelope Front Pocket"
        img={[32.61, 398.41, 375.52, 469.41]}
        clip={[67.74, 563.82, 308.53, 190.64]}
      />
      <ClippedImage
        src={`${MEDIA}/e3bde292a4e6ad355db1ff202a901599.png`}
        alt="Envelope Florals"
        img={[144.94, 457.5, 295.05, 368.81]}
        clip={[250.18, 589.11, 189.81, 237.2]}
      />

      {/* 3. Hanging bouquet, top right (mirrored) */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt="Hanging Florals Right"
        img={[234.79, -54.94, 282.95, 353.69]}
        clip={[234.79, 0, 205.21, 298.75]}
        flipX
      />

      {/* 4. Ornate burgundy card with tassel */}
      <ClippedImage
        src={`${MEDIA}/01734adcdeb9a49604ebce7dec006c9a.png`}
        alt="Ornate Burgundy Card"
        img={[41.26, 41.5, 361.5, 642.66]}
        clip={[55.87, 96.89, 332.27, 587.27]}
      />
      <div
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
        src={`${MEDIA}/f002c1dc18ae3027cd46edbe0ad35f38.png`}
        alt="Emerald Silk Tassel"
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
        <p key={idx} style={messageLine(202.82 + idx * 16.887)}>
          {line}
        </p>
      ))}
      <p style={messageLine(304.16)}>{seeYouText}</p>

      {/* 6. Couple names */}
      <NameLine text={brideName} center={[213.5, 384.09]} />
      <NameLine text={ampersand} center={[219.95, 434.13]} />
      <NameLine text={groomName} center={[226.39, 484.17]} />

      {/* 7. Flapping white butterfly perched on the card */}
      <ClippedImage src="/images/butterfly_flapping.gif" alt="Flapping White Butterfly" img={[266.85, 146.1, 66.72, 69.66]} />

      {/* 8. Hanging bouquet, top left */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt="Hanging Florals Left"
        img={[-69.33, -54.94, 282.95, 353.69]}
        clip={[0, 0, 213.63, 298.75]}
      />
    </section>
  );
};
