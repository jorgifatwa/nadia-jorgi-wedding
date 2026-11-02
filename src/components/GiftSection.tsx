"use client";

import React, { useState } from "react";
import { useToast } from "@/components/Toast";
import { ClippedImage, MEDIA, canvasText, u } from "./canvasLayout";
import { LottieSparkle } from "./LottieSparkle";

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface GiftSectionProps {
  title?: string;
  introLines?: string[];
  bankAccounts?: BankAccount[];
}

// Section 4 occupies 440 x 969.5 on the reference canvas (y = 3430.02 to 4399.52); coordinates below are section-local.
// The physical-gift note and confirmation contacts were removed, so the section ends 94.8px below the second
// Copy button and the bottom-right florals stay anchored to the section bottom.
const REFERENCE_H = 969.5;
const CANVAS_H = 760;

const BODY_FONT = "'CormorantLocal', 'Cormorant Garamond', serif";
// Most of this section's text is laid out at 0.7345 scale in the reference
const BODY_SCALE = 0.73447;

const bodyLine = (x: number, y: number, w: number, options: { bold?: boolean } = {}) =>
  options.bold
    ? canvasText([x, y, w], BODY_FONT, 21.237, 31.582, { bold: true, renderScale: BODY_SCALE })
    : canvasText([x, y, w], BODY_FONT, 16.341, 24.238, { renderScale: BODY_SCALE });

// Per-account layout: number / bank / holder text boxes and the olive "Copy" button below them
const ACCOUNT_LAYOUT = [
  { x: 44, numberY: 398.56, bankY: 432.86, holderY: 457.09, copyY: 495.37 },
  { x: 39.18, numberY: 546.55, bankY: 577.92, holderY: 602.15, copyY: 640.43 },
];

export const GiftSection: React.FC<GiftSectionProps> = ({
  title = "Wedding Gift",
  introLines = [
    "Doa restu dan kehadiran Anda merupakan",
    "karunia yang sangat berarti bagi kami.",
    "",
    "Namun, jika memberi adalah ungkapan tanda kasih,",
    "Anda dapat memberi melalui dibawah ini.",
  ],
  bankAccounts = [
    {
      bankName: "BCA",
      accountNumber: "6090593445",
      accountHolder: "a.n Nadia Nur Fitri Hermawan",
    },
    {
      bankName: "BRI",
      accountNumber: "407201025328533",
      accountHolder: "a.n Jorgi Fatwa Ambia",
    },
  ],
}) => {
  const { showToast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (accountNumber: string, bankName: string, index: number) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(accountNumber);
    }
    setCopiedIndex(index);
    showToast(`Nomor rekening ${bankName} (${accountNumber}) berhasil disalin!`);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <section
      id="section-gift"
      className="reveal-scope"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `440 / ${CANVAS_H}`,
        flexShrink: 0,
        overflow: "hidden",
        containerType: "inline-size",
        backgroundColor: "#4a0d18",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* 1. Burgundy velvet background */}
      <ClippedImage
        src={`${MEDIA}/f36c62f2bb57c539b5c23e2684f29e0e.png`}
        alt="Burgundy Velvet Background"
        img={[-109.77, -26.78, 659.53, 1172.52]}
        clip={[0, 0, 440, CANVAS_H]}
        skipReveal
      />

      {/* 2. Hanging bouquets in the top corners (the right one is mirrored) */}
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt="Hanging Florals Left"
        img={[-34.35, -23.84, 145.03, 181.3]}
        clip={[0, 0, 110.68, 157.46]}
      />
      <ClippedImage
        src={`${MEDIA}/db0864fe40bc6ca7bbc792b018d97de3.png`}
        alt="Hanging Florals Right"
        img={[302.3, -23.84, 180.94, 226.17]}
        clip={[302.3, 0, 137.7, 202.34]}
        flipX
      />

      {/* 3. Title, gift box illustration and sparkles */}
      <p style={canvasText([52.09, 52.56, 300.63], "'SloopScript', 'Great Vibes', cursive", 51.574, 72.176)}>{title}</p>
      <ClippedImage src="/images/sec4_gift_box.svg" alt="Gift Box" img={[179.2, 154.84, 74.8, 74.8]} />
      <LottieSparkle style={{ position: "absolute", left: u(232.96), top: u(148.88), width: u(37.95), height: u(53.45) }} />
      <LottieSparkle style={{ position: "absolute", left: u(161.64), top: u(192.24), width: u(27.64), height: u(38.92) }} />

      {/* 4. Introduction */}
      {introLines.map((line, idx) =>
        line ? (
          <p key={idx} style={bodyLine(47.13, 255.88 + idx * 24.23, 345.2)}>
            {line}
          </p>
        ) : null,
      )}

      {/* 5. Bank accounts with copy buttons */}
      {bankAccounts.slice(0, ACCOUNT_LAYOUT.length).map((acc, idx) => {
        const layout = ACCOUNT_LAYOUT[idx];
        return (
          <React.Fragment key={idx}>
            <p style={bodyLine(layout.x, layout.numberY, 345.2, { bold: true })}>{acc.accountNumber}</p>
            <p style={bodyLine(layout.x, layout.bankY, 345.2)}>{acc.bankName}</p>
            <p style={bodyLine(layout.x, layout.holderY, 345.2)}>{acc.accountHolder}</p>
            <button
              type="button"
              onClick={() => handleCopy(acc.accountNumber, acc.bankName, idx)}
              aria-label={`Salin nomor rekening ${acc.bankName}`}
              style={{
                position: "absolute",
                left: u(185.25),
                top: u(layout.copyY),
                width: u(62.25),
                height: u(24.75),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: u(5),
                padding: 0,
                border: "none",
                borderRadius: u(3.75),
                backgroundColor: copiedIndex === idx ? "#5a6200" : "#6f7900",
                color: "#f6f4e6",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: u(7),
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: u(9.4), height: u(9.4) }}
              >
                <rect x="8" y="8" width="13" height="13" rx="3" />
                <path d="M16 8V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2" />
              </svg>
              <span>{copiedIndex === idx ? "Copied!" : "Copy"}</span>
            </button>
          </React.Fragment>
        );
      })}

      {/* 6. Floor florals: left beside the second account, right in the bottom corner */}
      <ClippedImage
        src={`${MEDIA}/e3bde292a4e6ad355db1ff202a901599.png`}
        alt="Floor Florals Left"
        img={[-124.47, 457.44, 235.16, 293.94]}
        clip={[0, 562.34, 110.69, 189.06]}
      />
      <ClippedImage
        src={`${MEDIA}/e3bde292a4e6ad355db1ff202a901599.png`}
        alt="Floor Florals Right"
        img={[280.36, CANVAS_H - (REFERENCE_H - 754.46), 202.88, 253.59]}
        clip={[352.72, CANVAS_H - (REFERENCE_H - 844.96), 87.28, REFERENCE_H - 844.96]}
      />
    </section>
  );
};
