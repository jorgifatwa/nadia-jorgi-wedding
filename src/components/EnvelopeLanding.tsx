"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useWeddingAudio } from "./WeddingAudio";
import { ClippedImage, MEDIA, canvasText, u } from "./canvasLayout";
import { LottieSparkle } from "./LottieSparkle";

interface EnvelopeLandingProps {
  onOpen?: () => void;
  coupleNames?: string;
}

// The reference landing is a 440 x 782.22 canvas letterboxed in white on taller screens. Here the canvas always spans
// the screen width and is centred vertically; the drapery continues above and below it instead of white bars
// (on screens shorter than the canvas only the drapery edges are cropped).
const CANVAS_H = 782.22;
const BG: [x: number, y: number, w: number, h: number] = [-112.86, -17.74, 597.03, 897];
const TEXT_COLOR = "#fdf9f6";
const SAVE_THE_DATE_FONT = "'SaveTheDateLocal', 'Pinyon Script', cursive";

// Drapery copy mirrored vertically so it meets the original seamlessly at the shared edge
const MirroredDrapery: React.FC<{ y: number }> = ({ y }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={`${MEDIA}/0683d2a13e7eb7e869898743f13f38be.png`}
    alt=""
    draggable={false}
    data-reveal-skip=""
    style={{
      position: "absolute",
      left: u(BG[0]),
      top: u(y),
      width: u(BG[2]),
      height: u(BG[3]),
      maxWidth: "none",
      transform: "scaleY(-1)",
      pointerEvents: "none",
    }}
  />
);

// Sparkle clusters in the reference are flipped vertically and tilted 40.43deg
const TiltedSparkle: React.FC<{ center: [x: number, y: number] }> = ({ center }) => (
  <LottieSparkle
    style={{
      position: "absolute",
      left: u(center[0] - 51.23 / 2),
      top: u(center[1] - 72.13 / 2),
      width: u(51.23),
      height: u(72.13),
      transform: "rotate(40.43deg) scaleY(-1)",
    }}
  />
);

export const EnvelopeLanding: React.FC<EnvelopeLandingProps> = ({ onOpen, coupleNames = "Nadia & Jorgi" }) => {
  const { playAudio } = useWeddingAudio();
  const [isOpening, setIsOpening] = useState(false);
  // Personalised WhatsApp invitation links carry the guest's name as ?to=Name
  const [guestName, setGuestName] = useState<string | null>(null);

  useEffect(() => {
    const guest = new URLSearchParams(window.location.search).get("to")?.trim();
    if (!guest) return;
    const show = setTimeout(() => setGuestName(guest.slice(0, 80)), 0);
    return () => clearTimeout(show);
  }, []);

  const handleOpenEnvelope = () => {
    if (isOpening) return;
    setIsOpening(true);

    playAudio();

    try {
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.55 },
        colors: ["#d4af37", "#fdfaf5", "#800020", "#e8b4b8", "#234330"],
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0.05, y: 0.6 },
          colors: ["#d4af37", "#fdfaf5", "#800020"],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 0.95, y: 0.6 },
          colors: ["#d4af37", "#fdfaf5", "#800020"],
        });
      }, 300);
    } catch {
      // Ignore if canvas is unavailable
    }

    if (onOpen) {
      setTimeout(() => {
        onOpen();
      }, 1000);
    }
  };

  return (
    <div
      onClick={handleOpenEnvelope}
      role="button"
      aria-label="Buka undangan"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        flex: 1,
        overflow: "hidden",
        containerType: "size",
        backgroundColor: "#0a160f",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "100cqw",
          aspectRatio: `440 / ${CANVAS_H}`,
          transform: "translate(-50%, -50%)",
          containerType: "inline-size",
        }}
        className="reveal-scope"
      >
        {/* 1. Emerald drapery with damask carpet, extended above and below the canvas */}
        <MirroredDrapery y={BG[1] - BG[3]} />
        <MirroredDrapery y={BG[1] + BG[3]} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${MEDIA}/0683d2a13e7eb7e869898743f13f38be.png`}
          alt="Emerald Drapery Background"
          draggable={false}
          data-reveal-skip=""
          style={{
            position: "absolute",
            left: u(BG[0]),
            top: u(BG[1]),
            width: u(BG[2]),
            height: u(BG[3]),
            maxWidth: "none",
            pointerEvents: "none",
          }}
        />

        {/* 2. Closed envelope, sparkles and the slowly turning wax seal */}
        <ClippedImage src={`${MEDIA}/7b6f2605f13843668eef811673008950.png`} alt="Closed Envelope" img={[81.93, 328.6, 276.13, 185.34]} />
        <TiltedSparkle center={[340.945, 347.035]} />
        <TiltedSparkle center={[96.825, 513.955]} />
        <div
          style={{
            position: "absolute",
            left: u(220 - 47.49 / 2),
            top: u(427.9 - 49.99 / 2),
            width: u(47.49),
            height: u(49.99),
            transform: "rotate(-176deg)",
            pointerEvents: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${MEDIA}/85044a4ee6708cc8da02bc4bad5f12f9.png`}
            alt="Wax Seal"
            draggable={false}
            className="animate-spin-seal"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>

        {/* 3. Florals around the envelope and in the bottom corners (bottom ones may run past the canvas edge) */}
        <ClippedImage src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`} alt="Envelope Florals" img={[13.65, 267.44, 197.2, 246.5]} />
        <ClippedImage
          src={`${MEDIA}/bc67bf3451ac6a976bc528960337844d.png`}
          alt="Floor Florals Right"
          img={[298.06, 522.92, 237.47, 296.84]}
          clip={[298.06, 522.92, 141.94, 296.84]}
        />

        {/* 4. Heading: We're / Getting Married / couple names */}
        <p style={canvasText([77.07, 157.7, 39.78], SAVE_THE_DATE_FONT, 20.835, 28.524, { letterSpacing: 1.458, renderScale: 0.75064, color: TEXT_COLOR })}>
          G
        </p>
        <p
          style={canvasText([116.14, 152.37, 247.51], "'CormorantLocal', 'Cormorant Garamond', serif", 25.338, 35.252, {
            letterSpacing: 1.774,
            align: "left",
            renderScale: 0.75004,
            color: TEXT_COLOR,
          })}
        >
          ETTING MARRIED
        </p>
        <p style={canvasText([155.57, 107.36, 128.87], SAVE_THE_DATE_FONT, 29.79, 41.597, { renderScale: 0.40781, color: TEXT_COLOR })}>
          We&rsquo;re
        </p>
        <p
          style={canvasText([57.59, 189.4, 328.46], "'SloopScript', 'Great Vibes', cursive", 45.496, 63.318, {
            letterSpacing: 3.64,
            renderScale: 0.79147,
            color: TEXT_COLOR,
          })}
        >
          {coupleNames}
        </p>
        <p
          style={canvasText([133.37, 523.17, 174.39], "'ClickPromptLocal', 'Cormorant Garamond', serif", 10.004, 11.409, {
            letterSpacing: 1.13,
            renderScale: 0.40745,
            color: TEXT_COLOR,
          })}
        >
          CLICK&nbsp; ENVELOPE TO OPEN
        </p>

        {/* Guest greeting, only on personalised invitation links */}
        {guestName && (
          <div
            style={{
              position: "absolute",
              left: u(110),
              top: u(546),
              width: u(220),
              textAlign: "center",
              color: TEXT_COLOR,
              pointerEvents: "none",
            }}
          >
            <div style={{ fontFamily: "'ClickPromptLocal', 'Cormorant Garamond', serif", fontSize: u(9.5), letterSpacing: u(1.1) }}>
              KEPADA YTH. BAPAK/IBU/SAUDARA/I
            </div>
            <div
              style={{
                marginTop: u(6),
                fontFamily: "'CormorantLocal', 'Cormorant Garamond', serif",
                fontWeight: 700,
                fontSize: u(17),
                lineHeight: 1.2,
                overflowWrap: "anywhere",
              }}
            >
              {guestName}
            </div>
          </div>
        )}

        <ClippedImage src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`} alt="Envelope Florals Small" img={[298.06, 452.92, 98.08, 122.61]} />
        <ClippedImage
          src={`${MEDIA}/bc67bf3451ac6a976bc528960337844d.png`}
          alt="Floor Florals Left"
          img={[-73.9, 607.77, 194.16, 242.7]}
          clip={[0, 607.77, 120.26, 242.7]}
        />
      </div>
    </div>
  );
};
