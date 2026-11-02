"use client";

import React from "react";
import { ClippedImage, MEDIA, canvasText, u, type Box } from "./canvasLayout";
import { LottieSparkle } from "./LottieSparkle";

export interface EventSectionProps {
  month?: string;
  day?: string;
  year?: string;
  akadTime?: string;
  resepsiTime?: string;
  akadDate?: string;
  akadHours?: string;
  resepsiDate?: string;
  resepsiHours?: string;
  venueName?: string;
  venueAddress?: string[];
  mapsUrl?: string;
}

// Section 3 starts at y = 1723.84 on the reference canvas; coordinates below are section-local.
// The reference continues with a Dress Code block (removed here), so the section ends 67.84px below the Maps button
// (the same bottom spacing the reference keeps below the dress code swatches).
const CANVAS_H = 1518.63;

// The reference address block has 3 lines (24.8px each); longer addresses push everything below each block down
const ADDRESS_LINE_H = 24.8;
const REFERENCE_ADDRESS_LINES = 3;

const TEXT_COLOR = "#faf3ed";
const BODY_FONT = "'QuattrocentoLocal', 'Quattrocento', serif";
const SCRIPT_FONT = "'SloopScript', 'Great Vibes', cursive";

const textStyle = canvasText;

// The fountain picture split in two: the pool (minus the spray dome above its rim) lies flat and spreads out, the spray
// dome on top bursts up out of it last and keeps breathing (percentages of the fountain image)
const POOL_CLIP = "polygon(0 0, 41.6% 0, 41.6% 38%, 59.8% 38%, 59.8% 0, 100% 0, 100% 100%, 0 100%)";
const SPRAY_CLIP =
  "polygon(46% 0, 53.5% 0, 55.6% 9%, 57.4% 20%, 58.6% 35%, 59.6% 55%, 59.6% 74%, 42% 74%, 42% 55%, 42.6% 35%, 43.6% 20%, 44.6% 9%)";

// Render scales of the date block texts in the reference
const DATE_BLOCK_SCALE = 1.14795;

// "Save the Date" words sit in a group rotated -8.85deg; each word is placed by its centre and unrotated size
const RotatedWord: React.FC<{ text: string; center: [x: number, y: number]; size: [w: number, h: number]; fontSize: number }> = ({
  text,
  center,
  size,
  fontSize,
}) => (
  <p
    data-reveal="swing"
    style={{
      position: "absolute",
      left: u(center[0] - size[0] / 2),
      top: u(center[1] - size[1] / 2),
      width: u(size[0]),
      height: u(size[1]),
      margin: 0,
      transform: "rotate(-8.85deg)",
      fontFamily: "'SaveTheDateLocal', 'Pinyon Script', cursive",
      fontSize: u(fontSize),
      lineHeight: u(size[1]),
      color: "#fdf9f6",
      textAlign: "center",
      whiteSpace: "nowrap",
      pointerEvents: "none",
    }}
  >
    {text}
  </p>
);

// 2px cream rule framing the Akad / Resepsi times
const Rule: React.FC<{ box: Box; rotate?: number }> = ({ box, rotate }) => (
  <div
    data-reveal="wipe"
    style={{
      position: "absolute",
      left: u(box[0]),
      top: u(box[1]),
      width: u(box[2]),
      height: u(box[3]),
      backgroundColor: TEXT_COLOR,
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
      pointerEvents: "none",
    }}
  />
);

const Sparkle: React.FC<{ at: [x: number, y: number] }> = ({ at }) => (
  <LottieSparkle style={{ position: "absolute", left: u(at[0]), top: u(at[1]), width: u(37.95), height: u(53.45) }} />
);

// Date, time, venue and address lines of an event block, 24.8px apart (venue name one blank line below the time)
const EventDetails: React.FC<{ top: number; date: string; hours: string; venueName: string; venueAddress: string[] }> = ({
  top,
  date,
  hours,
  venueName,
  venueAddress,
}) => {
  const line = (y: number, bold = false) => textStyle([58.76, y, 323.52], BODY_FONT, 14.602, 24.8, { letterSpacing: 1.037, bold });
  return (
    <>
      <p style={line(top, true)}>{date}</p>
      <p style={line(top + 24.8)}>{hours}</p>
      <p style={line(top + 74.4, true)}>{venueName}</p>
      {venueAddress.map((addressLine, idx) => (
        <p key={idx} style={line(top + 99.2 + idx * ADDRESS_LINE_H)}>
          {addressLine}
        </p>
      ))}
    </>
  );
};

export const EventSection: React.FC<EventSectionProps> = ({
  month = "DESEMBER",
  day = "05",
  year = "2026",
  akadTime = "Pukul 16.00 WIB",
  resepsiTime = "Pukul 19.00 WIB",
  akadDate = "Sabtu, 5 Desember 2026",
  akadHours = "16.00 - 17.00 WIB",
  resepsiDate = "Sabtu, 5 Desember 2026",
  resepsiHours = "19.00 - 21.00 WIB",
  venueName = "MENARA BP JAMSOSTEK",
  venueAddress = [
    "Lantai 9,",
    "Jl. Gatot Subroto No.38, RT.6/RW.1,",
    "Kuningan Bar., Kec. Mampang Prpt.,",
    "Kota Jakarta Selatan,",
    "Daerah Khusus Ibukota Jakarta 12710",
  ],
  mapsUrl = "https://maps.app.goo.gl/TqZF9EDk8qnzkE7JA",
}) => {
  const extra = Math.max(0, venueAddress.length - REFERENCE_ADDRESS_LINES) * ADDRESS_LINE_H;
  const height = CANVAS_H + 2 * extra;

  return (
    <section
      id="section-event"
      className="reveal-scope"
      data-reveal-style="unfold"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `440 / ${height}`,
        flexShrink: 0,
        overflow: "hidden",
        containerType: "inline-size",
        backgroundColor: "#2c3e28",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* 1. Emerald suede background */}
      <ClippedImage
        src={`${MEDIA}/376c00ed1b80a48dc9e3293696c06776.jpg`}
        alt="Emerald Suede Background"
        img={[-260.31, 0, 960.61, 1707.17]}
        clip={[0, 0, 440, height]}
        skipReveal
      />

      {/* 2. "Save the Date" calligraphy + perched butterfly */}
      <RotatedWord text="Save" center={[222.16, 136.11]} size={[315.13, 101.62]} fontSize={72.85} />
      <RotatedWord text="the" center={[244.66, 185.06]} size={[157.56, 50.81]} fontSize={36.42} />
      <RotatedWord text="Date" center={[228.02, 270.61]} size={[315.13, 101.62]} fontSize={72.85} />
      <ClippedImage src="/images/butterfly_flapping.gif" alt="Flapping Butterfly" img={[333.52, 208.11, 30.86, 32.22]} reveal="pop" />

      {/* 3. Date block: month, Akad | day | Resepsi between cream rules, year */}
      <p data-reveal="drop" style={textStyle([106.73, 348.72, 236.67], BODY_FONT, 18.367, 18.37, { letterSpacing: -0.037, bold: true, renderScale: DATE_BLOCK_SCALE })}>{month}</p>
      <Rule box={[50.22, 383.74, 126.52, 2]} />
      <Rule box={[278.74, 378.64, 125.92, 2]} />
      <Rule box={[50.22, 463.7, 126.52, 2]} rotate={-0.484} />
      <Rule box={[278.74, 460.21, 125.92, 2]} />
      <p data-reveal="left" style={textStyle([27.01, 396.36, 141.11], SCRIPT_FONT, 38.265, 37.88, { letterSpacing: -0.0765, align: "right", renderScale: DATE_BLOCK_SCALE })}>Akad</p>
      <p data-reveal="left" style={textStyle([36.29, 438.99, 140.43], BODY_FONT, 13.775, 13.78, { letterSpacing: -0.0275, align: "right", bold: true, renderScale: DATE_BLOCK_SCALE })}>
        {akadTime}
      </p>
      {/* Day number gently grows and shrinks; the pulse sits on a wrapper so it doesn't fight the text's render scale */}
      <div
        data-reveal="flip"
        className="animate-pulse-soft"
        style={{ position: "absolute", left: u(140.08), top: u(388.35), width: u(170.01), height: u(63.31), pointerEvents: "none" }}
      >
        <p style={textStyle([0, 0, 170.01], BODY_FONT, 45.39, 63.31, { bold: true, renderScale: 0.34783 })}>{day}</p>
      </div>
      <p data-reveal="right" style={textStyle([278.74, 392.32, 141.56], SCRIPT_FONT, 38.265, 37.88, { letterSpacing: -0.0765, align: "left", renderScale: DATE_BLOCK_SCALE })}>Resepsi</p>
      <p data-reveal="right" style={textStyle([278.74, 434.96, 140.43], BODY_FONT, 13.775, 13.78, { letterSpacing: -0.0275, align: "left", bold: true, renderScale: DATE_BLOCK_SCALE })}>
        {resepsiTime}
      </p>
      <p data-reveal="rise" style={textStyle([146.37, 463.74, 157.44], BODY_FONT, 21.43, 29.97, { bold: true, renderScale: 0.483403 })}>{year}</p>

      {/* 4. Venue illustration: wings, centre building, cypress trees, fountain */}
      <ClippedImage src={`${MEDIA}/c7b9a8e80ff07fc9427f8bce49e38276.png`} alt="" img={[49.09, 536.34, 118.17, 123.86]} reveal="popup-left" revealDelay={800} />
      <ClippedImage src={`${MEDIA}/6cbd981383bb0be28a2f55c68fb11767.png`} alt="" img={[272.74, 536.34, 118.17, 123.86]} reveal="popup-right" revealDelay={800} />
      <ClippedImage src={`${MEDIA}/6a46472959bb93e40e93e6f7e53db377.png`} alt="Venue Illustration" img={[158.94, 552.97, 126.05, 94.09]} reveal="popup-up" revealDelay={350} />
      <ClippedImage src={`${MEDIA}/061bb6589fe36bb9f07745260df53b3a.png`} alt="" img={[155, 573.1, 28, 77.03]} reveal="popup-up" revealDelay={1500} />
      <ClippedImage src={`${MEDIA}/edb61eab0272fcfcb100ac74f196fa4b.png`} alt="" img={[256.98, 573.1, 31.94, 77.03]} reveal="popup-up" revealDelay={1650} />
      <ClippedImage src={`${MEDIA}/9b31ae35c64b69e67e6e85f829c495b7.png`} alt="" img={[96.36, 643.13, 247.28, 33.69]} clipPath={POOL_CLIP} reveal="popup-pool" />
      <ClippedImage src={`${MEDIA}/9b31ae35c64b69e67e6e85f829c495b7.png`} alt="" img={[96.36, 643.13, 247.28, 33.69]} clipPath={SPRAY_CLIP} reveal="popup-spray" revealDelay={2500} />

      {/* 5. Akad details */}
      <p data-reveal="blur" style={textStyle([69.69, 741.57, 300.63], SCRIPT_FONT, 51.556, 72.15)}>Akad</p>
      <EventDetails top={841.98} date={akadDate} hours={akadHours} venueName={venueName} venueAddress={venueAddress} />

      {/* 6. Calla lily divider (rotated -98.54deg about its centre) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${MEDIA}/01121590f317abfa83066572fb626dee.png`}
        alt="Calla Lily Divider"
        data-reveal="pop"
        draggable={false}
        style={{
          position: "absolute",
          left: u(225.08 - 47.24 / 2),
          top: u(1073.48 + extra - 90.88 / 2),
          width: u(47.24),
          height: u(90.88),
          maxWidth: "none",
          transform: "rotate(-98.54deg)",
          pointerEvents: "none",
        }}
      />

      {/* 7. Resepsi details */}
      <p data-reveal="blur" style={textStyle([69.69, 1123.23 + extra, 300.63], SCRIPT_FONT, 51.556, 72.15)}>Resepsi</p>
      <EventDetails top={1223.63 + extra} date={resepsiDate} hours={resepsiHours} venueName={venueName} venueAddress={venueAddress} />

      {/* 8. Google Maps button */}
      <a
        data-reveal="pop"
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "absolute",
          left: u(133.93),
          top: u(1418.34 + 2 * extra),
          width: u(172.15),
          height: u(32.45),
          backgroundColor: "#600a0a",
          borderRadius: u(4),
          textDecoration: "none",
        }}
      >
        <span style={textStyle([0, 5.62, 172.15], BODY_FONT, 16.32, 20.29)}>Google Maps</span>
      </a>

      {/* 9. Twinkling sparkles */}
      <Sparkle at={[332.36, 495.02]} />
      <Sparkle at={[54.17, 623.37]} />
      <Sparkle at={[290.28, 699.86]} />
      <Sparkle at={[139.01, 756.72]} />
      <Sparkle at={[282.81, 1068.64 + extra]} />
      <Sparkle at={[132.9, 1136.77 + extra]} />
      <Sparkle at={[311.57, 1426.7 + 2 * extra]} />
    </section>
  );
};
