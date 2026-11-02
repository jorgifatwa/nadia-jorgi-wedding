"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ClippedImage, MEDIA, canvasText, u } from "./canvasLayout";
import { LottieSparkle } from "./LottieSparkle";
import { useToast } from "./Toast";
import { ATTENDANCE_OPTIONS, MESSAGE_MAX, NAME_MAX, attendanceLabel, validateWish, type Attendance } from "@/lib/wishValidation";

interface Wish {
  id: string;
  name: string;
  message: string;
  attendance?: Attendance;
  createdAt: string;
}

// Guest wishes, styled after the gift section on the emerald suede of the event section (440 x 932 canvas)
const CANVAS_H = 932;
const CREAM = "#faf3ed";
const BODY_FONT = "'CormorantLocal', 'Cormorant Garamond', serif";
const LABEL_FONT = "'QuattrocentoLocal', 'Quattrocento', serif";
const REFRESH_MS = 30_000;
// Keep the loading state visible long enough to read as feedback even when the server answers instantly
const MIN_LOADING_MS = 700;

const relativeTime = (iso: string) => {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "baru saja";
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: `${u(10)} ${u(12)}`,
  backgroundColor: "rgba(10, 22, 15, 0.35)",
  border: "1px solid rgba(250, 243, 237, 0.45)",
  borderRadius: u(8),
  color: CREAM,
  fontFamily: BODY_FONT,
  // Never below 16px so iOS doesn't zoom into the field on focus
  fontSize: `max(16px, ${u(17)})`,
  lineHeight: 1.35,
};

const LockIcon: React.FC = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: u(15), height: u(15), flexShrink: 0, opacity: 0.7 }} fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const AttendanceBadge: React.FC<{ value: Attendance }> = ({ value }) => {
  const present = value === "hadir";
  return (
    <span
      style={{
        flexShrink: 0,
        padding: `${u(1)} ${u(8)}`,
        borderRadius: "9999px",
        border: `1px solid ${present ? "rgba(198, 230, 170, 0.65)" : "rgba(250, 243, 237, 0.35)"}`,
        backgroundColor: present ? "rgba(198, 230, 170, 0.16)" : "rgba(250, 243, 237, 0.06)",
        color: present ? "#dff3cf" : "rgba(250, 243, 237, 0.75)",
        fontFamily: LABEL_FONT,
        fontSize: u(11),
        letterSpacing: u(0.3),
        whiteSpace: "nowrap",
      }}
    >
      {attendanceLabel(value)}
    </span>
  );
};

const Spinner: React.FC = () => (
  <span
    aria-hidden="true"
    className="wish-spinner"
    style={{
      width: u(14),
      height: u(14),
      border: `${u(2)} solid rgba(250, 243, 237, 0.35)`,
      borderTopColor: CREAM,
      borderRadius: "50%",
      display: "inline-block",
    }}
  />
);

export const WishesSection: React.FC = () => {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  // Guest from a personal invitation link (?g=<id>); for guests with a WhatsApp number the name comes from the guest
  // list and can't be edited
  const [guestId, setGuestId] = useState<string | null>(null);
  const [nameLocked, setNameLocked] = useState(false);
  const [attendance, setAttendance] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newWishId, setNewWishId] = useState<string | null>(null);
  // Problems are shown under the form; a successful send is announced with a toast, like the copied account number
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const listRef = useRef<HTMLDivElement | null>(null);

  const loadWishes = useCallback(async () => {
    try {
      const res = await fetch("/api/wishes", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { wishes: Wish[] };
      setWishes(data.wishes);
    } catch {
      // Keep showing what we have; the next refresh will try again
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Initial load plus periodic refresh so other guests' wishes appear without reloading the page
    const initial = setTimeout(loadWishes, 0);
    const timer = setInterval(loadWishes, REFRESH_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [loadWishes]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("g")?.trim();
    const to = params.get("to")?.trim();
    let cancelled = false;
    const prefill = setTimeout(async () => {
      // A shared link without a valid guest code still prefills ?to=Name, but leaves it editable
      if (to) setName((current) => current || to.slice(0, NAME_MAX));
      if (!id) return;
      try {
        const res = await fetch(`/api/wishes/guest?g=${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { name: string; locked: boolean };
        setGuestId(id);
        if (data.locked) {
          setName(data.name);
          setNameLocked(true);
        } else {
          setName((current) => current || data.name.slice(0, NAME_MAX));
        }
      } catch {
        // Stay with the editable name
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(prefill);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const problem = validateWish({ name: nameLocked ? name.slice(0, NAME_MAX) : name, message, attendance });
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    setError(null);
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    const started = Date.now();
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, attendance, website, ...(guestId ? { guestId } : {}) }),
      });
      const data = (await res.json()) as { wish?: Wish; error?: string };
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, MIN_LOADING_MS - (Date.now() - started))));
      if (!res.ok || !data.wish) {
        setError(data.error ?? "Ucapan gagal dikirim, silakan coba lagi.");
        return;
      }
      const newWish = data.wish;
      setWishes((prev) => [newWish, ...prev.filter((w) => w.id !== newWish.id)]);
      setNewWishId(newWish.id);
      setMessage("");
      setAttendance("");
      showToast("Terima kasih, ucapan Anda sudah terkirim!");
    } catch {
      setError("Koneksi bermasalah, silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = wishes.filter((w) => w.attendance === "hadir").length;
  const absentCount = wishes.filter((w) => w.attendance === "tidak_hadir").length;

  return (
    <section
      id="section-wishes"
      className="reveal-scope"
      data-reveal-style="slide"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `440 / ${CANVAS_H}`,
        flexShrink: 0,
        overflow: "hidden",
        containerType: "inline-size",
        backgroundColor: "#2c3e28",
      }}
    >
      {/* 1. Emerald suede background (same texture and scale as the event section) */}
      <ClippedImage
        src={`${MEDIA}/376c00ed1b80a48dc9e3293696c06776.jpg`}
        alt=""
        img={[-260.31, 0, 960.61, 1707.17]}
        clip={[0, 0, 440, CANVAS_H]}
        skipReveal
      />

      {/* 2. Hanging bouquets in the top corners, as in the gift section */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt=""
        img={[-34.35, -23.84, 145.03, 181.3]}
        clip={[0, 0, 110.68, 157.46]}
        reveal="sway"
      />
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt=""
        img={[302.3, -23.84, 180.94, 226.17]}
        clip={[302.3, 0, 137.7, 202.34]}
        flipX
        reveal="sway-right"
      />

      {/* 3. Title, subtitle and sparkles */}
      <p data-reveal="blur" style={canvasText([20, 52.56, 400], "'SloopScript', 'Great Vibes', cursive", 51.574, 72.176)}>Ucapan &amp; Doa</p>
      <LottieSparkle style={{ position: "absolute", left: u(318), top: u(46), width: u(37.95), height: u(53.45) }} />
      <LottieSparkle style={{ position: "absolute", left: u(96), top: u(100), width: u(27.64), height: u(38.92) }} />
      <p style={canvasText([40, 138, 360], BODY_FONT, 16.341, 24.238, { renderScale: 0.73447 })}>Kirimkan ucapan dan doa terbaik</p>
      <p style={canvasText([40, 162.24, 360], BODY_FONT, 16.341, 24.238, { renderScale: 0.73447 })}>untuk kedua mempelai</p>

      {/* 4. Form, attendance summary and wish list stacked in one column, so the 16px minimum field font on narrow
             phones pushes the list down instead of overlapping it */}
      <div style={{ position: "absolute", left: u(40), top: u(208), width: u(360), display: "flex", flexDirection: "column" }}>
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: u(10) }}>
          {nameLocked ? (
            <div
              aria-label="Nama"
              style={{ ...fieldStyle, display: "flex", alignItems: "center", gap: u(8), backgroundColor: "rgba(10, 22, 15, 0.2)", borderStyle: "dashed" }}
            >
              <LockIcon />
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            </div>
          ) : (
            <input
              className="wish-field"
              type="text"
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Anda"
              aria-label="Nama"
              autoComplete="name"
              style={fieldStyle}
            />
          )}
          <select
            className="wish-field wish-select"
            value={attendance}
            onChange={(e) => setAttendance(e.target.value)}
            aria-label="Konfirmasi kehadiran"
            style={{ ...fieldStyle, color: attendance ? CREAM : "rgba(250, 243, 237, 0.6)", paddingRight: u(36) }}
          >
            <option value="" disabled>
              Konfirmasi kehadiran
            </option>
            {ATTENDANCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            className="wish-field"
            value={message}
            maxLength={MESSAGE_MAX}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis ucapan & doa untuk kedua mempelai..."
            aria-label="Ucapan"
            rows={4}
            style={{ ...fieldStyle, height: u(118), resize: "none" }}
          />
          {/* Honeypot: invisible to guests, bots often fill it */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />
          <div style={{ textAlign: "right", color: "rgba(250, 243, 237, 0.7)", fontFamily: BODY_FONT, fontSize: u(13), marginTop: u(-4) }}>
            {message.length}/{MESSAGE_MAX}
          </div>
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            style={{
              alignSelf: "center",
              width: u(160),
              height: u(40),
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: u(8),
              border: "none",
              borderRadius: u(6),
              backgroundColor: submitting ? "#7a2a2a" : "#600a0a",
              color: CREAM,
              fontFamily: LABEL_FONT,
              fontSize: u(15),
              letterSpacing: u(0.6),
              cursor: submitting ? "default" : "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
            }}
          >
            {submitting && <Spinner />}
            {submitting ? "Mengirim..." : "Kirim Ucapan"}
          </button>
          <div
            role="alert"
            aria-live="polite"
            style={{
              minHeight: u(20),
              textAlign: "center",
              fontFamily: BODY_FONT,
              fontSize: u(15),
              color: "#ffd2c8",
            }}
          >
            {error}
          </div>
        </form>

        <p
          style={{
            margin: `${u(10)} 0 ${u(8)}`,
            textAlign: "center",
            color: CREAM,
            fontFamily: LABEL_FONT,
            fontWeight: 700,
            fontSize: u(14.6),
            lineHeight: u(20),
            whiteSpace: "nowrap",
          }}
        >
          {wishes.length} Ucapan · {presentCount} Hadir · {absentCount} Tidak Hadir
        </p>
        <div
          ref={listRef}
          className="wish-list"
          aria-busy={submitting}
          style={{
            width: "100%",
            height: u(232),
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: `${u(4)} ${u(14)}`,
            boxSizing: "border-box",
            backgroundColor: "rgba(10, 22, 15, 0.3)",
            border: "1px solid rgba(250, 243, 237, 0.25)",
            borderRadius: u(10),
          }}
        >
          {submitting && (
            <div aria-hidden="true" style={{ padding: `${u(12)} 0`, display: "flex", flexDirection: "column", gap: u(8) }}>
              <div className="wish-skeleton" style={{ width: "45%", height: u(14), borderRadius: u(4) }} />
              <div className="wish-skeleton" style={{ width: "95%", height: u(12), borderRadius: u(4) }} />
              <div className="wish-skeleton" style={{ width: "70%", height: u(12), borderRadius: u(4) }} />
            </div>
          )}
          {loaded && !submitting && wishes.length === 0 && (
            <p style={{ margin: `${u(24)} 0`, textAlign: "center", color: "rgba(250, 243, 237, 0.8)", fontFamily: BODY_FONT, fontSize: u(16) }}>
              Belum ada ucapan. Jadilah yang pertama!
            </p>
          )}
          {wishes.map((wish, idx) => (
            <article
              key={wish.id}
              className={wish.id === newWishId ? "wish-new" : undefined}
              style={{
                padding: `${u(12)} 0`,
                borderTop: idx === 0 && !submitting ? "none" : "1px solid rgba(250, 243, 237, 0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: u(8) }}>
                <div style={{ display: "flex", alignItems: "center", gap: u(8), minWidth: 0 }}>
                  <span
                    style={{
                      color: CREAM,
                      fontFamily: LABEL_FONT,
                      fontWeight: 700,
                      fontSize: u(14.5),
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {wish.name}
                  </span>
                  {wish.attendance && <AttendanceBadge value={wish.attendance} />}
                </div>
                <span style={{ flexShrink: 0, color: "rgba(250, 243, 237, 0.65)", fontFamily: BODY_FONT, fontStyle: "italic", fontSize: u(13) }}>
                  {relativeTime(wish.createdAt)}
                </span>
              </div>
              <p
                style={{
                  margin: `${u(4)} 0 0`,
                  color: CREAM,
                  fontFamily: BODY_FONT,
                  fontSize: u(16),
                  lineHeight: 1.4,
                  whiteSpace: "pre-line",
                  overflowWrap: "anywhere",
                }}
              >
                {wish.message}
              </p>
            </article>
          ))}
        </div>
      </div>

      {/* 5. Floor florals in the bottom-right corner, anchored to the section bottom like the gift section */}
      <ClippedImage
        src={`${MEDIA}/e3bde292a4e6ad355db1ff202a901599.png`}
        alt=""
        img={[280.36, CANVAS_H - 215.04, 202.88, 253.59]}
        clip={[352.72, CANVAS_H - 124.54, 87.28, 124.54]}
        reveal="rise"
      />
    </section>
  );
};
