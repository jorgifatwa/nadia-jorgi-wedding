"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CANVAS_W, ClippedImage, MEDIA, canvasText, u, type Box } from "./canvasLayout";
import { LottieSparkle } from "./LottieSparkle";

export interface GalleryPhoto {
  src: string;
  alt: string;
}

export interface GallerySectionProps {
  title?: string;
  photos?: GalleryPhoto[];
}

const GALLERY_FILES = [
  "0K0A0739-Edit.jpg",
  "0K0A0741-Edit.jpg",
  "0K0A0757-Edit.jpg",
  "0K0A0758-Edit.jpg",
  "0K0A0763-Edit.jpg",
  "0K0A0764-Edit.jpg",
  "0K0A0771-Edit.jpg",
  "0K0A0775-Edit.jpg",
  "0K0A0776-Edit.jpg",
  "0K0A0777-Edit.jpg",
  "0K0A0779-Edit.jpg",
  "0K0A0785-Edit.jpg",
  "0K0A0790-Edit.jpg",
  "0K0A0797-Edit.jpg",
];

const DEFAULT_PHOTOS: GalleryPhoto[] = GALLERY_FILES.map((file, idx) => ({
  src: `/images/gallery/web/${file}`,
  alt: `Galeri foto ${idx + 1}`,
}));

// Reference grid (section-local canvas coordinates): two 3-photo blocks with ~3.4px gutters.
// Block A: two small stacked on the left + one large on the right; block B: one large on the left + two stacked on the right.
const BLOCK_A: Box[] = [
  [22.86, 131.86, 130.8, 192.41],
  [156.72, 131.86, 261.59, 387.86],
  [22.86, 327.32, 130.8, 192.41],
];
const BLOCK_B: Box[] = [
  [21.67, 523.11, 261.59, 368.42],
  [286.33, 523.11, 130.8, 121.78],
  [286.33, 647.95, 130.8, 243.58],
];
const PATTERN_PERIOD = 763.06; // block A top to the next block A top
const GUTTER = 3.39;
const BOTTOM_MARGIN = 19.34; // space below the last photo before the closing section

// Lays photos out by repeating the reference blocks; leftover photos (1 or 2) fill a final full-width row
const layoutCells = (count: number): { cells: Box[]; height: number } => {
  const cells: Box[] = [];
  const pattern = [...BLOCK_A, ...BLOCK_B];
  const fullCount = count - (count % 3);
  for (let i = 0; i < fullCount; i++) {
    const [x, y, w, h] = pattern[i % 6];
    cells.push([x, y + Math.floor(i / 6) * PATTERN_PERIOD, w, h]);
  }
  let bottom = cells.reduce((max, [, y, , h]) => Math.max(max, y + h), BLOCK_A[0][1] - GUTTER);
  const leftover = count - fullCount;
  if (leftover > 0) {
    const left = 22.86;
    const right = 418.31;
    const w = (right - left - GUTTER * (leftover - 1)) / leftover;
    const h = Math.min(w * 1.5, 294.05);
    for (let i = 0; i < leftover; i++) {
      cells.push([left + i * (w + GUTTER), bottom + GUTTER, w, h]);
    }
    bottom += GUTTER + h;
  }
  return { cells, height: bottom + BOTTOM_MARGIN };
};

export const GallerySection: React.FC<GallerySectionProps> = ({ title = "Gallery", photos = DEFAULT_PHOTOS }) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const { cells, height } = layoutCells(photos.length);

  const handleOpenLightbox = (index: number) => {
    setActivePhotoIndex(index);
  };

  const handleCloseLightbox = () => {
    setActivePhotoIndex(null);
  };

  const handlePrev = useCallback(() => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
  }, [activePhotoIndex, photos.length]);

  const handleNext = useCallback(() => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
  }, [activePhotoIndex, photos.length]);

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePhotoIndex === null) return;
      if (e.key === "Escape") handleCloseLightbox();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    if (activePhotoIndex !== null) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePhotoIndex, handlePrev, handleNext]);

  const arrowButtonStyle: React.CSSProperties = {
    position: "absolute",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    color: "#ffffff",
    fontSize: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10001,
  };

  return (
    <section
      id="section-gallery"
      className="reveal-scope"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `440 / ${height}`,
        flexShrink: 0,
        overflow: "hidden",
        containerType: "inline-size",
        backgroundColor: "#4a0d18",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* 1. Burgundy velvet background (repeated every 1172.52px of section height) */}
      {Array.from({ length: Math.ceil((height + 26.78) / 1172.52) }, (_, idx) => (
        <ClippedImage
          key={idx}
          src={`${MEDIA}/f36c62f2bb57c539b5c23e2684f29e0e.png`}
          alt=""
          img={[-109.77, -26.78 + idx * 1172.52, 659.53, 1172.52]}
          clip={[0, 0, 440, height]}
          skipReveal
        />
      ))}

      {/* 2. Title with a flipped, tilted sparkle cluster */}
      <p data-reveal="blur" style={canvasText([69.69, 38.84, 300.63], "'SloopScript', 'Great Vibes', cursive", 51.574, 72.176)}>{title}</p>
      <LottieSparkle
        style={{
          position: "absolute",
          left: u(179.03 - 40.5 / 2),
          top: u(54.14 - 57.03 / 2),
          width: u(40.5),
          height: u(57.03),
          transform: "rotate(40.43deg) scaleY(-1)",
        }}
      />

      {/* 3. Photo grid */}
      {photos.map((photo, idx) => {
        const [x, y, w, h] = cells[idx];
        return (
          <button
            key={photo.src}
            data-reveal={x + w / 2 < CANVAS_W / 2 ? "tilt-left" : "tilt-right"}
            type="button"
            onClick={() => handleOpenLightbox(idx)}
            aria-label={`Buka ${photo.alt}`}
            style={{
              position: "absolute",
              left: u(x),
              top: u(y),
              width: u(w),
              height: u(h),
              padding: 0,
              border: "none",
              borderRadius: u(8),
              overflow: "hidden",
              cursor: "pointer",
              backgroundColor: "#3a050f",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", display: "block" }}
            />
          </button>
        );
      })}

      {/* 4. Interactive Full-Screen Lightbox Modal, portalled to <body> because the section's container
             query containment would otherwise trap `position: fixed` inside the section */}
      {activePhotoIndex !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Gallery Lightbox"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              backgroundColor: "rgba(0, 0, 0, 0.92)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={handleCloseLightbox}
          >
            <button
              onClick={handleCloseLightbox}
              aria-label="Tutup Galeri"
              style={{
                ...arrowButtonStyle,
                top: "20px",
                right: "20px",
                width: "40px",
                height: "40px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                fontSize: "20px",
              }}
            >
              ✕
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Foto Sebelumnya"
              style={{ ...arrowButtonStyle, left: "14px" }}
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Foto Selanjutnya"
              style={{ ...arrowButtonStyle, right: "14px" }}
            >
              ›
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[activePhotoIndex].src}
              alt={photos[activePhotoIndex].alt}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "92vw",
                maxHeight: "82vh",
                objectFit: "contain",
                borderRadius: "6px",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
              }}
            />

            <div
              style={{
                position: "absolute",
                bottom: "24px",
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "13px",
                fontFamily: "'CormorantLocal', serif",
                letterSpacing: "1px",
                zIndex: 10001,
              }}
            >
              {activePhotoIndex + 1} / {photos.length}
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
};

export default GallerySection;
