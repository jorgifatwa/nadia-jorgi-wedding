import React from "react";

// Reference (Canva) sections are authored on a 440px-wide canvas and scale linearly with width.
// Sections using these helpers set `containerType: "inline-size"` on their root so `cqw` resolves to the section width.
export const CANVAS_W = 440;
export const u = (px: number) => `${((px / CANVAS_W) * 100).toFixed(4)}cqw`;

export const MEDIA = "/drapery_assets/media";

export type Box = [x: number, y: number, w: number, h: number];

// Image placed at `img` box, visible only inside `clip` box (both in canvas coordinates), optionally shaped by `clipPath`
export const ClippedImage: React.FC<{
  src: string;
  alt: string;
  img: Box;
  clip?: Box;
  clipPath?: string;
  objectFit?: React.CSSProperties["objectFit"];
  flipX?: boolean;
  // Backgrounds opt out of the scroll-reveal animation; other images reveal with a soft zoom
  skipReveal?: boolean;
}> = ({ src, alt, img, clip = img, clipPath, objectFit, flipX, skipReveal }) => (
  <div
    data-reveal={skipReveal ? undefined : "zoom"}
    data-reveal-skip={skipReveal ? "" : undefined}
    style={{
      position: "absolute",
      left: u(clip[0]),
      top: u(clip[1]),
      width: u(clip[2]),
      height: u(clip[3]),
      overflow: "hidden",
      clipPath,
      pointerEvents: "none",
    }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{
        position: "absolute",
        left: u(img[0] - clip[0]),
        top: u(img[1] - clip[1]),
        width: u(img[2]),
        height: u(img[3]),
        maxWidth: "none",
        objectFit,
        transform: flipX ? "scaleX(-1)" : undefined,
      }}
    />
  </div>
);

// Canva lays text out at its own base size and scales the box down/up with a transform (0.322 for most text here);
// rendering the same way reproduces the reference's stroke weight, which plain small font sizes render heavier.
export const DEFAULT_RENDER_SCALE = 0.322108;

export const canvasText = (
  box: [x: number, y: number, w: number],
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  options: {
    letterSpacing?: number;
    align?: React.CSSProperties["textAlign"];
    bold?: boolean;
    renderScale?: number;
    color?: string;
  } = {},
): React.CSSProperties => {
  const k = options.renderScale ?? DEFAULT_RENDER_SCALE;
  return {
    position: "absolute",
    left: u(box[0]),
    top: u(box[1]),
    width: u(box[2] / k),
    margin: 0,
    transform: `scale(${k})`,
    transformOrigin: "0 0",
    fontFamily,
    fontSize: u(fontSize / k),
    lineHeight: u(lineHeight / k),
    letterSpacing: u((options.letterSpacing ?? 0) / k),
    fontWeight: options.bold ? 700 : 400,
    color: options.color ?? "#faf3ed",
    textAlign: options.align ?? "center",
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };
};
