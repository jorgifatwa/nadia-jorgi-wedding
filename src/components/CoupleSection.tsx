"use client";

import React from "react";
import { type Reveal, ClippedImage, MEDIA, u, type Box } from "./canvasLayout";

export interface CoupleSectionProps {
  brideName?: string;
  brideBio?: string[];
  groomName?: string;
  groomBio?: string[];
}

// Section 2 occupies 440 x 820.04 on the reference canvas (y = 903.8 to 1723.84); coordinates below are section-local
const CANVAS_H = 820.04;

const TEXT_COLOR = "#faf3ed";

// Capsule-shaped photo window inside the gold frame (reference SVG clipPath on a 256 x 305.38 box, rendered at 0.5994)
const PHOTO_CLIP = `inset(2.425% 11.126% 2.355% 11.045% round ${u(59.71)})`;

const textStyle = (
  box: [x: number, y: number, w: number],
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  letterSpacing: number,
  textAlign: React.CSSProperties["textAlign"],
): React.CSSProperties => ({
  position: "absolute",
  left: u(box[0]),
  top: u(box[1]),
  width: u(box[2]),
  margin: 0,
  fontFamily,
  fontSize: u(fontSize),
  lineHeight: u(lineHeight),
  letterSpacing: u(letterSpacing),
  fontWeight: 400,
  color: TEXT_COLOR,
  textAlign,
  whiteSpace: "nowrap",
  pointerEvents: "none",
});

const BODY_FONT = "'QuattrocentoLocal', 'Quattrocento', serif";
const NAME_FONT = "'SloopScript', 'Great Vibes', cursive";

// Parents' lines are stacked as separate text boxes in the reference, 13.53px apart. They enter from the side they sit
// on: left-aligned lines (right of the portrait) from the right, and vice versa.
const bioLines = (lines: string[], box: [x: number, y: number, w: number], align: "left" | "right") =>
  lines.map((line, idx) => (
    <p key={idx} data-reveal={align === "left" ? "right" : "left"} style={textStyle([box[0], box[1] + idx * 13.525, box[2]], BODY_FONT, 13.74, 13.525, -0.0275, align)}>
      {line}
    </p>
  ));

const PortraitFrame: React.FC<{ photo: string; alt: string; clip: Box; frame: Box; reveal: Reveal }> = ({ photo, alt, clip, frame, reveal }) => (
  <>
    <ClippedImage src={photo} alt={alt} img={clip} clipPath={PHOTO_CLIP} objectFit="cover" reveal={reveal} />
    <ClippedImage src={`${MEDIA}/869fde431be61aa57e2281cbbdd7e1ac.png`} alt="Gold Oval Frame" img={frame} reveal={reveal} />
  </>
);

export const CoupleSection: React.FC<CoupleSectionProps> = ({
  brideName = "Nadia Nur\nFitri Hermawan",
  brideBio = ["Putri Pertama dari", "Bapak Bambang Hermawan", "& Ibu Siti Fatimah"],
  groomName = "Jorgi Fatwa\nAmbia",
  groomBio = ["Putra Kedua dari", "Bapak Alm. Revin Suwargana", "& Ibu Enok Rosita"],
}) => {
  return (
    <section
      id="section-couple"
      className="reveal-scope"
      style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        aspectRatio: `440 / ${CANVAS_H}`,
        flexShrink: 0,
        overflow: "visible",
        containerType: "inline-size",
        backgroundColor: "#3a050f",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* 1. Burgundy velvet background */}
      <ClippedImage
        src={`${MEDIA}/f36c62f2bb57c539b5c23e2684f29e0e.png`}
        alt="Burgundy Velvet Background"
        img={[-137.4, -29.02, 714.78, 1270.73]}
        clip={[0, 0, 440, CANVAS_H]}
        skipReveal
      />

      {/* 2. Bismillahir Rahmanir Rahim */}
      <ClippedImage src="/images/sec2_bismillah.svg" alt="Bismillahir Rahmanir Rahim" img={[119.71, 66.36, 176, 38.72]} reveal="blur" />

      {/* 3. Invitation greeting */}
      {["Dengan memohon rahmat & ridho Allah SWT,", "kami mengundang bapak/ibu/saudara/i", "untuk hadir pada pernikahan:"].map(
        (line, idx) => (
          <p key={idx} style={textStyle([58.24, 145.24 + idx * 13.26, 310.65], BODY_FONT, 13.648, 13.268, -0.0273, "center")}>
            {line}
          </p>
        ),
      )}

      {/* 4. Bride: portrait (left) + name & parents (right); the full names wrap to two lines, so the reference
             name/parents block is re-centred on the portrait (name moved up and parents down by half a line) */}
      <PortraitFrame
        photo="/images/catin-wanita-oval.jpg"
        alt={brideName.replace("\n", " ")}
        clip={[31.82, 252.42, 153.45, 183.05]}
        frame={[31.78, 252.42, 153.53, 183.05]}
        reveal="left"
      />
      <p data-reveal="right" style={{ ...textStyle([207.71, 280.4, 232.29], NAME_FONT, 38.661, 38.661, -0.0773, "left"), whiteSpace: "pre-line" }}>
        {brideName}
      </p>
      {bioLines(brideBio, [205.95, 362.91, 218.72], "left")}

      {/* 5. Ampersand divider */}
      <p data-reveal="pop" style={textStyle([209.8, 461.82, 24.58], "'AmpersandLocal', 'Great Vibes', cursive", 34.203, 34.203, -0.068, "center")}>
        &amp;
      </p>

      {/* 6. Groom: name & parents (left) + portrait (right); the two-line block is raised so the parents' lines
             end above the bottom-left florals (which start at y = 637) */}
      <p data-reveal="left" style={{ ...textStyle([16.63, 520, 210.2], NAME_FONT, 38.627, 38.627, -0.0773, "right"), whiteSpace: "pre-line" }}>
        {groomName}
      </p>
      {bioLines(groomBio, [21.97, 600.87, 199.61], "right")}
      <PortraitFrame
        photo="/images/catin-pria-oval.jpg"
        alt={groomName.replace("\n", " ")}
        clip={[241.74, 522.91, 153.45, 183.05]}
        frame={[241.7, 522.91, 153.53, 183.05]}
        reveal="right"
      />

      {/* 7. Bottom-left floor florals */}
      <ClippedImage
        src={`${MEDIA}/e3bde292a4e6ad355db1ff202a901599.png`}
        alt="Floor Florals Left"
        img={[-149.38, 513.26, 277.59, 346.98]}
        clip={[0, 637.08, 128.22, 183.97]}
        reveal="rise"
      />

      {/* 8. Bottom-right bouquet: lower part in this section, continuation overlapping the top of Section 3 */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt="Florals Right"
        img={[330.27, 748.67, 163.25, 204.08]}
        clip={[330.27, 748.67, 109.73, CANVAS_H - 748.67]}
      />
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt="Florals Bridging to Section 3"
        img={[324.37, 755.28, 188.47, 235.58]}
        clip={[351.34, CANVAS_H, 88.66, 170.82]}
      />
    </section>
  );
};
