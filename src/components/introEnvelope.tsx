import React from "react";
import { ClippedImage, MEDIA, u, type Box, type Reveal } from "./canvasLayout";

// The opened envelope holding the lace verse card, in Section 1 canvas coordinates. Section 1 and the envelope-opening
// transition (EnvelopeLanding) both draw it from these pieces, so the transition's last frame is exactly Section 1.

// Top edge of the envelope body, where the flap folds, and the envelope's bottom edge
export const ENVELOPE_HINGE_Y = 531;
export const ENVELOPE_BOTTOM_Y = 722;
export const ENVELOPE_BODY: Box = [68.3, ENVELOPE_HINGE_Y, 301.3, ENVELOPE_BOTTOM_Y - ENVELOPE_HINGE_Y];

// On short screens (e.g. in WhatsApp's in-app browser) Section 1 is drawn smaller, centred, so the whole opened
// envelope with some room below it fits on the first screen: the canvas width is capped so that y = FIT_BOTTOM lands
// at the smallest viewport height (svh: browser toolbars shown). Its drapery keeps filling the screen width.
const SECTION1_FIT_BOTTOM = 750;
const SECTION1_MIN_FIT = 0.8;
export const SECTION1_FIT_WIDTH = `clamp(${SECTION1_MIN_FIT * 100}%, ${((440 / SECTION1_FIT_BOTTOM) * 100).toFixed(4)}svh, 100%)`;

// Section 1's drapery image box; drawn unclipped sideways, so it still fills the screen beside a narrowed canvas
export const SECTION1_DRAPERY: Box = [-164.6, -100.4, 715.1, 1074.4];

// The same scale as a number, for a container `width` px wide (the envelope-opening transition ends at it)
export const section1Fit = (width: number) => {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const svh = probe.getBoundingClientRect().height;
  probe.remove();
  // Without svh support the CSS width falls back to full width too
  if (!svh || !width) return 1;
  return Math.min(1, Math.max(SECTION1_MIN_FIT, (svh * 440) / SECTION1_FIT_BOTTOM / width));
};

// Closed envelope (back view, flap down). Its flap is a triangle down to the lace tip at 68% of the image height, cut
// out of the same image so it can fold on its own; the paper sits inside 2% / 1.9% transparent margins.
export const CLOSED_ENVELOPE_SRC = `${MEDIA}/7b6f2605f13843668eef811673008950.webp`;
export const CLOSED_FLAP_CLIP = "polygon(0% 0%, 100% 0%, 100% 1.9%, 50% 68%, 0% 1.9%)";
export const CLOSED_REST_CLIP = "polygon(0% 1.9%, 50% 68%, 100% 1.9%, 100% 100%, 0% 100%)";
const CLOSED_MARGIN_X = 0.02;
const CLOSED_MARGIN_Y = 0.019;

// Paper box of a closed-envelope image placed at `box`
export const closedPaper = ([x, y, w, h]: Box): Box => [x + w * CLOSED_MARGIN_X, y + h * CLOSED_MARGIN_Y, w * (1 - 2 * CLOSED_MARGIN_X), h * (1 - 2 * CLOSED_MARGIN_Y)];

// Extra attributes (e.g. data-*) are passed on to the outer element
type DivAttributes = Omit<React.HTMLAttributes<HTMLDivElement>, "children">;

// Closed envelope part cut by `clipPath` (the flap or the rest), placed at `box`
export const ClosedEnvelopePart: React.FC<DivAttributes & { box: Box; clipPath: string }> = ({ box, clipPath, style, ...rest }) => (
  <div
    {...rest}
    style={{ position: "absolute", left: u(box[0]), top: u(box[1]), width: u(box[2]), height: u(box[3]), clipPath, pointerEvents: "none", ...style }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={CLOSED_ENVELOPE_SRC} alt="" draggable={false} style={{ width: "100%", height: "100%", display: "block" }} />
  </div>
);

// Horizontal band [top, top + height) of a canvas `canvasHeight` tall; children keep the canvas coordinates. Its own
// compositing layer, so the band is cut after its layers are combined: cut separately, the cream envelope back would
// bleed through the lining along the cut edge as a light line.
export const Slice: React.FC<DivAttributes & { top: number; height: number; canvasHeight: number; children: React.ReactNode }> = ({
  top,
  height,
  canvasHeight,
  style,
  children,
  ...rest
}) => (
  <div
    {...rest}
    style={{ position: "absolute", left: 0, top: u(top), width: "100%", height: u(height), overflow: "hidden", willChange: "transform", ...style }}
  >
    <div style={{ position: "absolute", left: 0, top: u(-top), width: "100%", height: u(canvasHeight) }}>{children}</div>
  </div>
);

const LINING_CLIP =
  "polygon(49.68% 0%, 51.01% 0.11%, 52.25% 0.84%, 73% 19.99%, 88.5% 35.08%, 100% 47.16%, 99.91% 47.27%, 99.95% 99.72%, 99.77% 100%, 0.23% 100%, 0.09% 99.89%, 0% 99.67%, 0.05% 47.22%, 6.21% 41.04%, 20.01% 27.84%, 31.74% 16.37%, 46.23% 2.78%, 47.88% 1%, 48.99% 0.22%)";

const VERSE =
  '"Dan di antara tanda-tanda\n(kebesaran)-Nya ialah Dia\nmenciptakan pasangan-pasangan\nuntukmu dari jenismu sendiri, agar\nkamu cenderung dan merasa\ntenteram kepadanya, dan Dia\nmenjadikan di antaramu rasa kasih\ndan sayang. Sungguh, pada yang\ndemikian itu benar-benar terdapat\ntanda-tanda (kebesaran Allah) bagi\nkaum yang berpikir."';

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

interface LayerProps {
  reveal?: Reveal;
  skipReveal?: boolean;
}

export const EnvelopeBack: React.FC<LayerProps> = (props) => (
  <ClippedImage src={`${MEDIA}/1e7bcbf0e72a46a3fc5a00d154822f44.webp`} alt="Envelope Back" img={[68.3, 402.3, 301.3, 320.6]} {...props} />
);

// Burgundy velvet inside the envelope and its open flap
export const EnvelopeLining: React.FC<LayerProps> = (props) => (
  <ClippedImage
    src={`${MEDIA}/fd53e8793519ee86df4fd95a8217d781.webp`}
    alt="Burgundy Velvet Lining"
    img={[72.2, 281.7, 293.6, 522.5]}
    clip={[72.2, 421.7, 293.5, 242.5]}
    clipPath={LINING_CLIP}
    {...props}
  />
);

export const EnvelopeFront: React.FC<LayerProps> = (props) => (
  <ClippedImage
    src={`${MEDIA}/4eb403d7039697c0864925cfaaa203ee.webp`}
    alt="Envelope Front Pocket"
    img={[32.6, 366.8, 375.5, 469.4]}
    clip={[67.7, 532.2, 308.6, 190.7]}
    {...props}
  />
);

// Oval lace doily card carrying the QS Ar-Rum 21 verse
export const LaceCard: React.FC<LayerProps> = (props) => (
  <ClippedImage
    src={`${MEDIA}/ca52e90c3dc4ba78c450200739a6e3c8.webp`}
    alt="Lace Doily Card"
    img={[63.3, 122.9, 304.3, 434.7]}
    clip={[67.7, 130.1, 299.9, 427.4]}
    {...props}
  />
);

export const Verse: React.FC<{ skipReveal?: boolean }> = ({ skipReveal }) => {
  const reveal = skipReveal ? { "data-reveal-skip": "" } : { "data-reveal": "blur" };
  return (
    <>
      <p {...reveal} style={{ ...verseTextStyle, top: u(255.3) }}>
        {VERSE}
      </p>
      <p {...reveal} style={{ ...verseTextStyle, top: u(429.3) }}>
        QS Ar-Rum 21
      </p>
    </>
  );
};
