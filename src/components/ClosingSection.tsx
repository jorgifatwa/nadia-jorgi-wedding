"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ClippedImage, MEDIA, canvasText, u, type Box } from "./canvasLayout";
import {
  CLOSED_FLAP_CLIP,
  CLOSED_REST_CLIP,
  ClosedEnvelopePart,
  ENVELOPE_BODY,
  ENVELOPE_HINGE_Y,
  EnvelopeBack,
  EnvelopeFront,
  EnvelopeLining,
  Slice,
  closedEnvelopeFor,
} from "./introEnvelope";

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

// The open envelope is Section 1's envelope moved down by 31.6px (introEnvelope.tsx pieces, Section 1 coordinates)
const ENVELOPE_DY = 31.6;
const SECTION1_H = 903.8;
const HINGE_Y = ENVELOPE_HINGE_Y + ENVELOPE_DY;
const BODY: Box = [ENVELOPE_BODY[0], ENVELOPE_BODY[1] + ENVELOPE_DY, ENVELOPE_BODY[2], ENVELOPE_BODY[3]];
const BOTTOM_Y = BODY[1] + BODY[3];
// Closed envelope covering the same paper, and its wax seal (placed on the flap as on the landing envelope)
const CLOSED: Box = closedEnvelopeFor(BODY);
const SEAL: Box = (() => {
  const w = CLOSED[2] * 0.172;
  const h = w * (458 / 435);
  return [CLOSED[0] + CLOSED[2] / 2 - w / 2, CLOSED[1] + CLOSED[3] * 0.5358 - h / 2, w, h];
})();

// The card is wider than the envelope; below the hinge it is cut to the envelope's width, so its sides don't show
// next to the envelope while it sinks in (the resting card is narrower than the envelope there)
const CARD_CLIP = `polygon(0 0, 100% 0, 100% ${u(HINGE_Y)}, ${u(BODY[0] + BODY[2])} ${u(HINGE_Y)}, ${u(BODY[0] + BODY[2])} 100%, ${u(BODY[0])} 100%, ${u(BODY[0])} ${u(HINGE_Y)}, 0 ${u(HINGE_Y)})`;

// The guest has to stay at the very bottom this long before the envelope closes by itself
const DWELL_MS = 2500;
// Sealing timeline (ms): the butterfly flies off, the card sinks into the envelope, the open flap folds down, the
// closed flap folds over, the seal is stamped and the "open" prompt appears. Reopening plays it backwards.
const TOTAL_MS = 3200;
type Step = [selector: string, keyframes: Keyframe[], delay: number, duration: number, easing: string];
const flap = (deg: number) => `perspective(70cqw) rotateX(${deg}deg)`;
const SEAL_STEPS: Step[] = [
  ["butterfly", [{ translate: "0 0", rotate: "0deg", opacity: 1 }, { translate: `${u(70)} ${u(-110)}`, rotate: "25deg", opacity: 0 }], 0, 700, "ease-in"],
  ["cover", [{ opacity: 0 }, { opacity: 1 }], 0, 350, "ease"],
  ["card", [{ translate: "0 0" }, { translate: `0 ${u(HINGE_Y - 96.89 + 10)}` }], 150, 1250, "cubic-bezier(0.55, 0, 0.35, 1)"],
  ["open-flap", [{ transform: flap(0) }, { transform: flap(90) }], 1350, 450, "cubic-bezier(0.55, 0, 1, 0.45)"],
  ["closed-rest", [{ opacity: 0 }, { opacity: 1 }], 1750, 300, "ease"],
  ["closed-flap", [{ transform: flap(-90), opacity: 1 }, { transform: flap(0), opacity: 1 }], 1800, 450, "cubic-bezier(0, 0.55, 0.45, 1)"],
  [
    "seal",
    [
      { opacity: 0, scale: 2.2, rotate: "-40deg" },
      { opacity: 1, scale: 0.92, rotate: "0deg", offset: 0.7 },
      { opacity: 1, scale: 1, rotate: "0deg" },
    ],
    2250,
    450,
    "ease-out",
  ],
  ["hint", [{ opacity: 0 }, { opacity: 1 }], 2750, 450, "ease"],
];

type SealState = "open" | "sealing" | "sealed" | "reopening";

const messageLine = (y: number) =>
  canvasText([98.97, y, 242.05], MESSAGE_FONT, 11.3, 16.887, { renderScale: 0.31272 });

const EnvelopeFlorals: React.FC = () => (
  <ClippedImage
    src={`${MEDIA}/e3bde292a4e6ad355db1ff202a901599.png`}
    alt="Envelope Florals"
    img={[144.94, 457.5, 295.05, 368.81]}
    clip={[250.18, 589.11, 189.81, 237.2]}
    reveal="rise"
  />
);

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
  const sectionRef = useRef<HTMLElement | null>(null);
  const animations = useRef<Animation[]>([]);
  const [seal, setSeal] = useState<SealState>("open");

  const sealEnvelope = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;
    setSeal("sealing");
    // Every step ends at TOTAL_MS (endDelay), so reversing them all replays the timeline exactly backwards
    animations.current = SEAL_STEPS.flatMap(([name, keyframes, delay, duration, easing]) =>
      [...section.querySelectorAll<HTMLElement>(`[data-seal="${name}"]`)].map((el) =>
        el.animate(keyframes, { delay, duration, easing, endDelay: TOTAL_MS - delay - duration, fill: "both" }),
      ),
    );
    Promise.all(animations.current.map((a) => a.finished)).then(() => setSeal("sealed"), () => {});
  }, []);

  const reopen = () => {
    if (seal !== "sealed") return;
    setSeal("reopening");
    animations.current.forEach((a) => a.reverse());
    Promise.all(animations.current.map((a) => a.finished)).then(() => {
      animations.current.forEach((a) => a.cancel());
      animations.current = [];
      setSeal("open");
    }, () => {});
  };

  // Seal the envelope once the guest has stayed at the end of the invitation for a moment
  useEffect(() => {
    const section = sectionRef.current;
    const scroller = section?.closest<HTMLElement>('[id$="scroll-container"]');
    if (!section || !scroller || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let done = false;
    const check = () => {
      const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 8;
      if (atEnd && !timer && !done) {
        timer = setTimeout(() => {
          done = true;
          sealEnvelope();
        }, DWELL_MS);
      } else if (!atEnd && timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    scroller.addEventListener("scroll", check, { passive: true });
    check();
    return () => {
      scroller.removeEventListener("scroll", check);
      if (timer) clearTimeout(timer);
    };
  }, [sealEnvelope]);

  return (
    <section
      ref={sectionRef}
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
        src={`${MEDIA}/0683d2a13e7eb7e869898743f13f38be.png`}
        alt="Emerald Drapery Background"
        img={[-163.74, -58.8, 792.67, 1190.95]}
        clip={[0, 0, 440, CANVAS_H]}
        skipReveal
      />

      {/* 2. Open envelope (Section 1's, moved down): back and lining in two bands so the flap can fold at the hinge,
             front pocket, florals on the right */}
      <div data-reveal="rise" style={{ position: "absolute", left: 0, top: u(ENVELOPE_DY), width: "100%", height: u(SECTION1_H), pointerEvents: "none" }}>
        <Slice top={0} height={ENVELOPE_HINGE_Y} canvasHeight={SECTION1_H} style={{ transformOrigin: "50% 100%" }} data-seal="open-flap">
          <EnvelopeBack />
          <EnvelopeLining />
        </Slice>
        <Slice top={ENVELOPE_HINGE_Y - 1} height={SECTION1_H - ENVELOPE_HINGE_Y + 1} canvasHeight={SECTION1_H}>
          <EnvelopeBack />
          <EnvelopeLining />
        </Slice>
      </div>
      <div data-reveal="rise" style={{ position: "absolute", left: 0, top: u(ENVELOPE_DY), width: "100%", height: u(SECTION1_H), pointerEvents: "none" }}>
        <EnvelopeFront />
      </div>
      <EnvelopeFlorals />

      {/* 3. Hanging bouquet, top right (mirrored) */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt="Hanging Florals Right"
        img={[234.79, -54.94, 282.95, 353.69]}
        clip={[234.79, 0, 205.21, 298.75]}
        flipX
        reveal="sway-right"
      />

      {/* 4-6. Card with tassel, message and names. One group, so it can sink into the envelope when it is sealed
             (clipped at the envelope's bottom edge); its parts keep their own entrance animations. */}
      <div
        data-reveal-skip=""
        style={{ position: "absolute", left: 0, top: 0, width: "100%", height: u(BOTTOM_Y), clipPath: CARD_CLIP, pointerEvents: "none" }}
      >
        <div className="reveal-scope" data-reveal-style="cinematic" data-seal="card" style={{ position: "absolute", inset: 0 }}>
          {/* 4. Ornate burgundy card with tassel */}
          <ClippedImage
            src={`${MEDIA}/01734adcdeb9a49604ebce7dec006c9a.png`}
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
            src={`${MEDIA}/f002c1dc18ae3027cd46edbe0ad35f38.png`}
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
        </div>
      </div>

      {/* 7. Flapping white butterfly perched on the card */}
      <div data-seal="butterfly" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <ClippedImage src="/images/butterfly_flapping.gif" alt="Flapping White Butterfly" img={[266.85, 146.1, 66.72, 69.66]} reveal="pop" />
      </div>

      {/* 8. Sealed envelope, drawn over the card while it sinks in: front pocket and florals again (so the card passes
             behind them), the closed envelope with its folding flap, the wax seal and the prompt to open it again */}
      <div data-reveal-skip="" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div data-seal="cover" style={{ position: "absolute", inset: 0, opacity: 0 }}>
          <div style={{ position: "absolute", left: 0, top: u(ENVELOPE_DY), width: "100%", height: u(SECTION1_H) }}>
            <EnvelopeFront />
          </div>
        </div>
        <ClosedEnvelopePart box={CLOSED} clipPath={CLOSED_REST_CLIP} style={{ opacity: 0 }} data-seal="closed-rest" />
        <ClosedEnvelopePart box={CLOSED} clipPath={CLOSED_FLAP_CLIP} style={{ opacity: 0, transformOrigin: "50% 1.9%" }} data-seal="closed-flap" />
        <div
          data-seal="seal"
          style={{ position: "absolute", left: u(SEAL[0]), top: u(SEAL[1]), width: u(SEAL[2]), height: u(SEAL[3]), opacity: 0 }}
        >
          <div style={{ width: "100%", height: "100%", transform: "rotate(-176deg)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${MEDIA}/85044a4ee6708cc8da02bc4bad5f12f9.png`}
              alt=""
              draggable={false}
              className="animate-spin-seal"
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          </div>
        </div>
        <div data-seal="cover" style={{ position: "absolute", inset: 0, opacity: 0 }}>
          <EnvelopeFlorals />
        </div>
        <p
          data-seal="hint"
          style={{
            ...canvasText([133.37, CLOSED[1] - 26, 174.39], "'ClickPromptLocal', 'Cormorant Garamond', serif", 10.004, 11.409, {
              letterSpacing: 1.13,
              renderScale: 0.40745,
            }),
            opacity: 0,
          }}
        >
          CLICK&nbsp; ENVELOPE TO OPEN
        </p>
      </div>
      {seal === "sealed" && (
        <button
          type="button"
          onClick={reopen}
          aria-label="Buka kembali undangan"
          style={{
            position: "absolute",
            left: u(CLOSED[0]),
            top: u(CLOSED[1] - 34),
            width: u(CLOSED[2]),
            height: u(CLOSED[3] + 34),
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        />
      )}

      {/* 9. Hanging bouquet, top left */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt="Hanging Florals Left"
        img={[-69.33, -54.94, 282.95, 353.69]}
        clip={[0, 0, 213.63, 298.75]}
        reveal="sway"
      />
    </section>
  );
};
