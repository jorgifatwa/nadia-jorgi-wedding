"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// The guest's QR for the reception desk. A personal link (?g=<guest id>) shows that guest's QR straight away; a guest
// from a group link types their name once to get a QR of their own, which this phone then remembers. The QR holds the
// guest's invitation link, so scanning it with an ordinary camera just opens the invitation.

const STORAGE_KEY = "checkin-pass";
const NAME_MAX = 80;

const BODY_FONT = "'QuattrocentoLocal', 'Quattrocento', serif";
const SCRIPT_FONT = "'SloopScript', 'Great Vibes', cursive";

interface Pass {
  id: string;
  name: string;
  // Taken from a group link (may be redone under another name)
  self: boolean;
}

const readStoredPass = (): Pass | null => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as { id?: unknown; name?: unknown } | null;
    return typeof stored?.id === "string" && typeof stored.name === "string" ? { id: stored.id, name: stored.name, self: true } : null;
  } catch {
    return null;
  }
};

const passLink = (pass: Pass) => `${window.location.origin}/?to=${encodeURIComponent(pass.name)}&g=${pass.id}`;

export const CheckinPassDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [pass, setPass] = useState<Pass | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  // "loading" while the personal link's guest is looked up, then the QR or the name form
  const [view, setView] = useState<"loading" | "form" | "pass">("loading");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = setTimeout(async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("g")?.trim();
      if (id) {
        try {
          const res = await fetch(`/api/wishes/guest?g=${encodeURIComponent(id)}`, { cache: "no-store" });
          if (res.ok) {
            const data = (await res.json()) as { name: string };
            if (!cancelled) {
              setPass({ id, name: data.name, self: false });
              setView("pass");
            }
            return;
          }
        } catch {
          // Fall back to a stored or new QR
        }
      }
      if (cancelled) return;
      const stored = readStoredPass();
      if (stored) {
        setPass(stored);
        setView("pass");
      } else {
        setName(params.get("to")?.trim().slice(0, NAME_MAX) ?? "");
        setView("form");
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, []);

  useEffect(() => {
    if (!pass) return;
    let cancelled = false;
    import("qrcode").then(async (QRCode) => {
      const url = await QRCode.toDataURL(passLink(pass), {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 640,
        color: { dark: "#14261b", light: "#fbf6ef" },
      });
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [pass]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const createPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pass", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const data = (await res.json().catch(() => ({}))) as { id?: string; name?: string; error?: string };
      if (!res.ok || !data.id || !data.name) throw new Error(data.error ?? "QR gagal dibuat, coba lagi.");
      const created = { id: data.id, name: data.name, self: true };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: created.id, name: created.name }));
      } catch {
        // Private mode: the QR still works now, it just isn't remembered
      }
      setQr(null);
      setPass(created);
      setView("pass");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const redo = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setName("");
    setPass(null);
    setQr(null);
    setView("form");
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="QR Check-in" className="checkin-pass-backdrop" onClick={onClose}>
      <div className="checkin-pass-card" onClick={(e) => e.stopPropagation()} style={{ fontFamily: BODY_FONT }}>
        <button type="button" onClick={onClose} aria-label="Tutup" className="checkin-pass-close">
          ✕
        </button>
        <p style={{ fontFamily: SCRIPT_FONT, fontSize: 40, lineHeight: "52px", margin: 0 }}>QR Check-in</p>

        {view === "loading" && <p className="checkin-pass-note">Memuat...</p>}

        {view === "form" && (
          <form onSubmit={createPass} style={{ marginTop: 8 }}>
            <p className="checkin-pass-note">
              Tuliskan nama Anda untuk membuat QR check-in. Tunjukkan QR ini kepada penerima tamu saat tiba di lokasi acara.
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX}
              placeholder="Nama Anda"
              aria-label="Nama Anda"
              autoComplete="name"
              className="wish-field checkin-pass-input"
            />
            {error && (
              <p role="alert" className="checkin-pass-error">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy || name.trim().length < 2} className="checkin-pass-button">
              {busy ? "Membuat QR..." : "Buat QR"}
            </button>
          </form>
        )}

        {view === "pass" && pass && (
          <>
            <p className="checkin-pass-name">{pass.name}</p>
            <div className="checkin-pass-qr">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt={`QR check-in untuk ${pass.name}`} width={240} height={240} />
              ) : (
                <span className="checkin-pass-note">Membuat QR...</span>
              )}
            </div>
            <p className="checkin-pass-note">Tunjukkan QR ini kepada penerima tamu saat tiba di lokasi acara.</p>
            <a
              href={qr ?? undefined}
              download={`QR Check-in - ${pass.name}.png`}
              aria-disabled={!qr}
              className="checkin-pass-button"
              style={{ display: "block", textDecoration: "none" }}
            >
              Simpan QR
            </a>
            {pass.self && (
              <button type="button" onClick={redo} className="checkin-pass-link">
                Bukan nama Anda? Buat ulang
              </button>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
