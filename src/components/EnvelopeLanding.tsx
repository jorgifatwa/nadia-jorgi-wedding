"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWeddingAudio } from "./WeddingAudio";
import { ClippedImage, MEDIA, canvasText, u } from "./canvasLayout";
import { LottieSparkle } from "./LottieSparkle";
import { SAKURA_COLORS, SakuraPetal } from "./Sakura";
import {
  CLOSED_FLAP_CLIP,
  CLOSED_REST_CLIP,
  ClosedEnvelopePart,
  ENVELOPE_BODY,
  ENVELOPE_BOTTOM_Y,
  ENVELOPE_HINGE_Y,
  EnvelopeBack,
  EnvelopeFront,
  EnvelopeLining,
  LaceCard,
  Slice,
  Verse,
  closedPaper,
} from "./introEnvelope";

interface EnvelopeLandingProps {
  // Called when Section 1 should be mounted underneath (the transition's last frame matches it)
  onOpen?: () => void;
  // Called once the transition has faded out and the landing can be removed
  onFinished?: () => void;
  // Called when the petals spill out of the opened envelope, with the opening's position on screen (viewport px)
  onPetalBurst?: (x: number, y: number) => void;
  coupleNames?: string;
}

// The reference landing is a 440 x 782.22 canvas letterboxed in white on taller screens. Here the canvas always spans
// the screen width and is centred vertically; the drapery continues above and below it instead of white bars
// (on screens shorter than the canvas only the drapery edges are cropped).
const CANVAS_H = 782.22;
const BG: [x: number, y: number, w: number, h: number] = [-112.86, -17.74, 597.03, 897];
const TEXT_COLOR = "#fdf9f6";
const SAVE_THE_DATE_FONT = "'SaveTheDateLocal', 'Pinyon Script', cursive";

// Closed envelope on the landing canvas
const CLOSED_ENVELOPE: [x: number, y: number, w: number, h: number] = [81.93, 328.6, 276.13, 185.34];
const [paperX, paperY, paperW, paperH] = closedPaper(CLOSED_ENVELOPE);
const CLOSED_PAPER = { x: paperX, y: paperY, w: paperW, h: paperH };

// The opened envelope starts drawn over the closed one (in Section 1 coordinates, scaled and moved onto the landing
// envelope) and travels to its Section 1 place. The landing canvas is centred, so its top is 50cqh - half its height.
const BODY_CENTER = { x: ENVELOPE_BODY[0] + ENVELOPE_BODY[2] / 2, y: ENVELOPE_BODY[1] + ENVELOPE_BODY[3] / 2 };
const PAPER_CENTER = { x: CLOSED_PAPER.x + CLOSED_PAPER.w / 2, y: CLOSED_PAPER.y + CLOSED_PAPER.h / 2 };
const travelFrom = {
  "--travel-x": u(PAPER_CENTER.x - BODY_CENTER.x),
  "--travel-y": `calc(50cqh - ${u(CANVAS_H / 2 - PAPER_CENTER.y + BODY_CENTER.y)})`,
  "--travel-sx": (CLOSED_PAPER.w / ENVELOPE_BODY[2]).toFixed(4),
  "--travel-sy": (CLOSED_PAPER.h / ENVELOPE_BODY[3]).toFixed(4),
  // The card starts tucked inside, its top at the envelope opening
  "--card-drop": u(ENVELOPE_HINGE_Y - 130.1 + 10),
} as React.CSSProperties;

const SECTION1_H = 903.8;

// The wax seal and the five petals it breaks into: thrown out around it (canvas units), each turning as it goes
const SEAL_CENTER: [x: number, y: number] = [220, 427.9];
const SEAL_PETALS = Array.from({ length: 5 }, (_, i) => {
  const angle = ((-90 + i * 72 + 12) * Math.PI) / 180;
  const distance = 46 + (i % 2) * 14;
  return {
    dx: +(Math.cos(angle) * distance).toFixed(1),
    dy: +(Math.sin(angle) * distance).toFixed(1),
    r0: -90 + i * 72 + 12 + 90,
    spin: i % 2 ? 160 : -140,
  };
});

// Transition timeline in ms; the per-piece choreography lives in globals.css (.env-opening rules) on the same clock
const PETAL_BURST_AT = 1700;
const SECTION_READY_AT = 2300;
const FADE_OUT_AT = 2400;
const FINISHED_AT = 2750;
const SKIP_AFTER = 500;

// Drapery copy mirrored vertically so it meets the original seamlessly at the shared edge
const MirroredDrapery: React.FC<{ y: number }> = ({ y }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={`${MEDIA}/0683d2a13e7eb7e869898743f13f38be.webp`}
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

// Landing canvas: full width, centred vertically
const canvasStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "100cqw",
  aspectRatio: `440 / ${CANVAS_H}`,
  transform: "translate(-50%, -50%)",
  containerType: "inline-size",
};

export const EnvelopeLanding: React.FC<EnvelopeLandingProps> = ({ onOpen, onFinished, onPetalBurst, coupleNames = "Nadia & Jorgi" }) => {
  const { playAudio } = useWeddingAudio();
  const [stage, setStage] = useState<"closed" | "opening" | "done">("closed");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const opened = useRef(false);
  const openedAt = useRef(0);
  // Personalised WhatsApp invitation links carry the guest's name as ?to=Name
  const [guestName, setGuestName] = useState<string | null>(null);

  useEffect(() => {
    const guest = new URLSearchParams(window.location.search).get("to")?.trim();
    if (!guest) return;
    // Admin names are at most 80 characters; a longer hand-edited link is cut at a word, not mid-word
    const shown = guest.length <= 80 ? guest : `${guest.slice(0, 80).replace(/\s+\S*$/, "")}…`;
    const show = setTimeout(() => setGuestName(shown), 0);
    return () => clearTimeout(show);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  const revealSection = () => {
    if (opened.current) return;
    opened.current = true;
    onOpen?.();
  };

  // Mounts Section 1 underneath, then fades this overlay out and removes it
  const finish = (fadeAt: number) => {
    at(Math.max(0, fadeAt - (FADE_OUT_AT - SECTION_READY_AT)), revealSection);
    at(fadeAt, () => setStage("done"));
    at(fadeAt + (FINISHED_AT - FADE_OUT_AT), () => onFinished?.());
  };

  // Petals spill out of the envelope while the card rises: from wherever its opening is on screen at that moment
  const mouthRef = useRef<HTMLDivElement | null>(null);
  const burstPetals = () => {
    const mouth = mouthRef.current?.getBoundingClientRect();
    if (mouth) onPetalBurst?.(mouth.left + mouth.width / 2, mouth.top);
  };

  const handleClick = () => {
    if (stage === "opening") {
      // A second tap skips the rest of the transition (not an accidental double tap)
      if (Date.now() - openedAt.current < SKIP_AFTER) return;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      finish(FADE_OUT_AT - SECTION_READY_AT);
      return;
    }
    if (stage !== "closed") return;

    setStage("opening");
    openedAt.current = Date.now();
    playAudio();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish(FADE_OUT_AT - SECTION_READY_AT);
      return;
    }
    at(PETAL_BURST_AT, burstPetals);
    finish(FADE_OUT_AT);
  };

  const stageClass = stage === "closed" ? "" : stage === "opening" ? "env-opening" : "env-opening env-done";

  return (
    <div
      onClick={handleClick}
      role="button"
      aria-label="Buka undangan"
      className={stageClass}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        overflow: "hidden",
        containerType: "size",
        backgroundColor: "#0a160f",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Layer 1: drapery, floor florals and the heading */}
      <div style={canvasStyle} className="reveal-scope">
        {/* Emerald drapery with damask carpet, extended above and below the canvas */}
        <MirroredDrapery y={BG[1] - BG[3]} />
        <MirroredDrapery y={BG[1] + BG[3]} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${MEDIA}/0683d2a13e7eb7e869898743f13f38be.webp`}
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

        <ClippedImage
          src={`${MEDIA}/bc67bf3451ac6a976bc528960337844d.webp`}
          alt="Floor Florals Right"
          img={[298.06, 522.92, 237.47, 296.84]}
          clip={[298.06, 522.92, 141.94, 296.84]}
          className="env-bouquet"
        />

        {/* Heading: We're / Getting Married / couple names */}
        <p
          className="env-fade"
          style={canvasText([77.07, 157.7, 39.78], SAVE_THE_DATE_FONT, 20.835, 28.524, { letterSpacing: 1.458, renderScale: 0.75064, color: TEXT_COLOR })}
        >
          G
        </p>
        <p
          className="env-fade"
          style={canvasText([116.14, 152.37, 247.51], "'CormorantLocal', 'Cormorant Garamond', serif", 25.338, 35.252, {
            letterSpacing: 1.774,
            align: "left",
            renderScale: 0.75004,
            color: TEXT_COLOR,
          })}
        >
          ETTING MARRIED
        </p>
        <p className="env-fade" style={canvasText([155.57, 107.36, 128.87], SAVE_THE_DATE_FONT, 29.79, 41.597, { renderScale: 0.40781, color: TEXT_COLOR })}>
          We&rsquo;re
        </p>
        <p
          className="env-fade"
          style={canvasText([57.59, 189.4, 328.46], "'SloopScript', 'Great Vibes', cursive", 45.496, 63.318, {
            letterSpacing: 3.64,
            renderScale: 0.79147,
            color: TEXT_COLOR,
          })}
        >
          {coupleNames}
        </p>
        <p
          className="env-fade"
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
            className="env-fade"
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

        <ClippedImage
          src={`${MEDIA}/bc67bf3451ac6a976bc528960337844d.webp`}
          alt="Floor Florals Left"
          img={[-73.9, 607.77, 194.16, 242.7]}
          clip={[0, 607.77, 120.26, 242.7]}
          className="env-bouquet"
        />
      </div>

      {/* Layer 2: Section 1's drapery, faded in while the envelope settles (only during the transition) */}
      {stage !== "closed" && (
        <div className="env-section-bg" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: u(SECTION1_H), overflow: "hidden" }}>
          <ClippedImage src={`${MEDIA}/0683d2a13e7eb7e869898743f13f38be.webp`} alt="" img={[-164.6, -100.4, 715.1, 1074.4]} clip={[0, 0, 440, SECTION1_H]} />
        </div>
      )}

      {/* Layer 3: the opened envelope in Section 1 coordinates. The open flap stands up from the hinge, the card rises
             out of the envelope (clipped at its bottom edge) and the whole envelope travels to its Section 1 place. */}
      {stage !== "closed" && (
        <div
          className="env-open-scene"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: u(SECTION1_H),
            transformOrigin: `${u(BODY_CENTER.x)} ${u(BODY_CENTER.y)}`,
            pointerEvents: "none",
            ...travelFrom,
          }}
        >
          <Slice top={0} height={ENVELOPE_HINGE_Y} canvasHeight={SECTION1_H} className="env-open-flap">
            <EnvelopeBack />
            <EnvelopeLining />
          </Slice>
          {/* The body slice starts 1px above the hinge so no seam shows between the slices while the envelope is scaled */}
          <Slice top={ENVELOPE_HINGE_Y - 1} height={SECTION1_H - ENVELOPE_HINGE_Y + 1} canvasHeight={SECTION1_H}>
            <EnvelopeBack />
            <EnvelopeLining />
          </Slice>
          <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: u(ENVELOPE_BOTTOM_Y), overflow: "hidden" }}>
            <div className="env-card" style={{ position: "absolute", inset: 0 }}>
              <LaceCard />
              <Verse />
            </div>
          </div>
          <EnvelopeFront />
          {/* The envelope opening (centre of the hinge line), where the petal burst comes from */}
          <div ref={mouthRef} style={{ position: "absolute", left: u(220), top: u(ENVELOPE_HINGE_Y), width: 1, height: 1 }} />
        </div>
      )}

      {/* Layer 4: the closed envelope (body and foldable flap), its sparkles, wax seal and florals */}
      <div style={canvasStyle} className="reveal-scope">
        <ClosedEnvelopePart box={CLOSED_ENVELOPE} clipPath={CLOSED_REST_CLIP} className="env-closed-rest" />
        <ClosedEnvelopePart box={CLOSED_ENVELOPE} clipPath={CLOSED_FLAP_CLIP} className="env-flap" />
        <div className="env-fade" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TiltedSparkle center={[340.945, 347.035]} />
          <TiltedSparkle center={[96.825, 513.955]} />
        </div>
        <div
          className="env-seal"
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
            src={`${MEDIA}/85044a4ee6708cc8da02bc4bad5f12f9.webp`}
            alt="Wax Seal"
            draggable={false}
            className="animate-spin-seal"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>
        {/* The seal breaks into sakura petals (styled by .env-seal-petal) */}
        {SEAL_PETALS.map((petal, i) => (
          <div
            key={i}
            className="env-seal-petal"
            style={
              {
                left: u(SEAL_CENTER[0] - 7),
                top: u(SEAL_CENTER[1] - 8.4),
                width: u(14),
                height: u(16.8),
                "--dx": u(petal.dx),
                "--dy": u(petal.dy),
                "--r0": `${petal.r0}deg`,
                "--spin": `${petal.spin}deg`,
              } as React.CSSProperties
            }
          >
            <SakuraPetal color={SAKURA_COLORS[i % SAKURA_COLORS.length]} />
          </div>
        ))}
        <ClippedImage src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.webp`} alt="Envelope Florals" img={[13.65, 267.44, 197.2, 246.5]} className="env-bouquet" />
        <ClippedImage
          src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.webp`}
          alt="Envelope Florals Small"
          img={[298.06, 452.92, 98.08, 122.61]}
          className="env-bouquet"
        />
      </div>
    </div>
  );
};
