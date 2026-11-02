"use client";

import React, { useEffect, useState } from "react";
import { canvasText, u } from "./canvasLayout";
import { WEDDING_END, WEDDING_START, googleCalendarUrl } from "@/lib/weddingEvent";

// Countdown to the akad plus a "Simpan ke Kalender" button, placed under the Maps button of the event section.
// `top` is the section-local y of the heading; the block is COUNTDOWN_BLOCK_H tall (button bottom).
export const COUNTDOWN_BLOCK_H = 194.45;

const BODY_FONT = "'QuattrocentoLocal', 'Quattrocento', serif";
const SCRIPT_FONT = "'SloopScript', 'Great Vibes', cursive";

const BOX_W = 74;
const BOX_H = 70;
const BOX_GAP = 12;
const BOXES_LEFT = (440 - 4 * BOX_W - 3 * BOX_GAP) / 2;
const BOXES_TOP = 62;
const BUTTON_TOP = 162;
const BUTTON_W = 200;
const BUTTON_H = 32.45;

const UNITS = ["Hari", "Jam", "Menit", "Detik"] as const;

const remaining = (now: number) => {
  const total = Math.max(0, Math.floor((WEDDING_START.getTime() - now) / 1000));
  return [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60];
};

export const WeddingCountdown: React.FC<{ top: number }> = ({ top }) => {
  // Unknown until mounted, so the server render and the first client render match
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(Date.now());
      timer = setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  // iPhone / iPad / Mac open the .ics in their Calendar app (in the same tab); everyone else gets Google Calendar. The
  // link is retargeted before the browser follows it.
  const openAppleCalendar = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) return;
    event.currentTarget.href = "/kalender.ics";
    event.currentTarget.removeAttribute("target");
  };

  const values = now === null ? null : remaining(now);
  const message =
    now === null || now < WEDDING_START.getTime()
      ? null
      : now < WEDDING_END.getTime()
        ? "Hari bahagia kami telah tiba"
        : "Terima kasih atas doa dan restunya";

  return (
    <>
      <p data-reveal="blur" style={canvasText([20, top, 400], SCRIPT_FONT, 34, 48)}>
        Menuju Hari Bahagia
      </p>

      {message ? (
        <p data-reveal="rise" style={canvasText([20, top + BOXES_TOP + 24, 400], BODY_FONT, 15, 22, { letterSpacing: 1, bold: true })}>
          {message}
        </p>
      ) : (
        UNITS.map((unit, idx) => (
          <div
            key={unit}
            data-reveal="pop"
            role="timer"
            aria-label={values ? `${values[idx]} ${unit}` : unit}
            style={{
              position: "absolute",
              left: u(BOXES_LEFT + idx * (BOX_W + BOX_GAP)),
              top: u(top + BOXES_TOP),
              width: u(BOX_W),
              height: u(BOX_H),
              border: `${u(1)} solid rgba(250, 243, 237, 0.55)`,
              borderRadius: u(6),
              backgroundColor: "rgba(250, 243, 237, 0.07)",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          >
            <p style={canvasText([0, 9, BOX_W - 2], BODY_FONT, 28, 34, { bold: true })}>
              {/* Re-keyed on every change so the new number slides in */}
              <span key={values ? values[idx] : "-"} className="countdown-tick">
                {values ? String(values[idx]).padStart(2, "0") : "--"}
              </span>
            </p>
            <p style={canvasText([0, 45, BOX_W - 2], BODY_FONT, 10.5, 14, { letterSpacing: 1.6 })}>{unit.toUpperCase()}</p>
          </div>
        ))
      )}

      <a
        data-reveal="pop"
        href={googleCalendarUrl()}
        target="_blank"
        rel="noopener noreferrer"
        onClick={openAppleCalendar}
        style={{
          position: "absolute",
          left: u((440 - BUTTON_W) / 2),
          top: u(top + BUTTON_TOP),
          width: u(BUTTON_W),
          height: u(BUTTON_H),
          backgroundColor: "#600a0a",
          borderRadius: u(4),
          textDecoration: "none",
        }}
      >
        <span style={canvasText([0, 5.62, BUTTON_W], BODY_FONT, 16.32, 20.29)}>Simpan ke Kalender</span>
      </a>
    </>
  );
};
