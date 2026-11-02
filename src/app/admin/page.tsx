"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { attendanceLabel, type Attendance } from "@/lib/wishValidation";
import { formatPhone, normalizePhone } from "@/lib/phone";

// Desktop admin: manage guest wishes and send personalised WhatsApp invitations

interface Wish {
  id: string;
  name: string;
  message: string;
  attendance?: Attendance;
  createdAt: string;
}

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
  sentAt: string | null;
  attendance?: Attendance | null;
  respondedAt?: string | null;
  // Added in this admin, took a QR from a group link, or added at the reception desk; missing = "admin"
  source?: "admin" | "self" | "desk";
  checkedInAt?: string | null;
  groupId?: string | null;
}

interface InviteSettings {
  template: string;
}

type Tab = "wishes" | "invites" | "checkin";

const api = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, { cache: "no-store", ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Terjadi kesalahan."), { status: res.status });
  return data as T;
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

// Personal link: ?to shows the name on the envelope, ?g ties wishes sent from it to this guest (name locked in the form)
// The invitation's public address; NEXT_PUBLIC_SITE_URL overrides it (e.g. a custom domain, with or without https://)
const SITE_URL = (() => {
  const custom = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!custom) return "https://nadia-jorgi-wedding.vercel.app";
  return /^https?:\/\//i.test(custom) ? custom : `https://${custom}`;
})();

const inviteLink = (guest: { name: string; id?: string }) =>
  `${SITE_URL}/?to=${encodeURIComponent(guest.name)}${guest.id ? `&g=${guest.id}` : ""}`;

const renderMessage = (template: string, guest: { name: string; id?: string }) =>
  template.replaceAll("{nama}", guest.name).replaceAll("{link}", inviteLink(guest));

const whatsappUrl = (phone: string | null, text: string) =>
  `https://wa.me/${phone ?? ""}?text=${encodeURIComponent(text)}`;

// Bulk import: one guest per line, "Nama, 0812..." (the number is optional; tab or semicolon also work)
const parseBulk = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.*?)[,;\t]\s*([+\d][\d\s-]*)$/);
      return match ? { name: match[1].trim(), phone: match[2].trim() } : { name: line, phone: "" };
    });

const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger" | "whatsapp";
    ref?: React.Ref<HTMLButtonElement>;
  }
> = ({ variant = "secondary", className = "", ...props }) => {
  const styles = {
    primary: "bg-[#24412f] text-white hover:bg-[#1b3324] disabled:bg-[#24412f]/50",
    secondary: "bg-white text-[#24412f] border border-[#d9d2c5] hover:bg-[#f3efe7] disabled:opacity-50",
    danger: "bg-white text-[#9b1c1c] border border-[#ecc8c8] hover:bg-[#fdf1f1] disabled:opacity-50",
    whatsapp: "bg-[#1f8f4e] text-white hover:bg-[#187a41] disabled:opacity-50",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
    />
  );
};

const Spinner: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const SkeletonBar: React.FC<{ className?: string }> = ({ className = "h-4 w-full" }) => (
  <div className={`animate-pulse rounded bg-[#ece6da] ${className}`} />
);

// Placeholder rows while a table loads for the first time
const SkeletonRows: React.FC<{ columns: string[]; rows?: number }> = ({ columns, rows = 4 }) => (
  <>
    {Array.from({ length: rows }, (_, row) => (
      <tr key={row} aria-hidden="true">
        {columns.map((width, col) => (
          <td key={col} className="px-4 py-4">
            <SkeletonBar className={`h-4 ${width}`} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// While data reloads, the existing rows stay visible but dimmed
const LoadingCaption: React.FC = () => (
  <caption className="caption-bottom py-3 text-sm text-[#8a8374]">
    <span className="inline-flex items-center gap-2">
      <Spinner /> Memuat data...
    </span>
  </caption>
);

const PAGE_SIZES = [10, 25, 50];

// Client-side paging of an already loaded list; the page is clamped so deleting the last row of a page stays valid
const usePagination = <T,>(items: T[]) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageItems = items.slice((current - 1) * pageSize, current * pageSize);
  return { page: current, pageCount, pageSize, pageItems, total: items.length, setPage, setPageSize };
};

// Page numbers with ellipses: 1 … 4 5 6 … 12
const pageList = (page: number, pageCount: number): (number | "gap")[] => {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((n, idx) => (idx > 0 && n - sorted[idx - 1] > 1 ? (["gap", n] as const) : [n]));
};

const Pagination: React.FC<ReturnType<typeof usePagination<unknown>>> = ({ page, pageCount, pageSize, total, setPage, setPageSize }) => {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const navButton = "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#efe9de] bg-[#faf8f4] px-4 py-2.5 text-sm text-[#5c6158]">
      <div className="flex items-center gap-3">
        <span>
          Menampilkan <span className="font-medium text-[#1f2a22]">{from}–{to}</span> dari {total}
        </span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          aria-label="Baris per halaman"
          className="rounded-lg border border-[#d9d2c5] bg-white px-2 py-1 text-sm outline-none focus:border-[#24412f]"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / halaman
            </option>
          ))}
        </select>
      </div>
      {pageCount > 1 && (
        <nav className="flex items-center gap-1" aria-label="Halaman">
          <button type="button" className={`${navButton} hover:bg-[#efe9de]`} disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Halaman sebelumnya">
            ‹
          </button>
          {pageList(page, pageCount).map((item, idx) =>
            item === "gap" ? (
              <span key={`gap-${idx}`} className="px-1 text-[#b3ab9c]">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                aria-current={item === page ? "page" : undefined}
                className={`${navButton} ${item === page ? "bg-[#24412f] font-medium text-white" : "hover:bg-[#efe9de]"}`}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className={`${navButton} hover:bg-[#efe9de]`}
            disabled={page === pageCount}
            onClick={() => setPage(page + 1)}
            aria-label="Halaman berikutnya"
          >
            ›
          </button>
        </nav>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; loading?: boolean; tone?: string }> = ({
  label,
  value,
  loading = false,
  tone = "text-[#24412f]",
}) => (
  <div className="rounded-xl border border-[#e5dfd3] bg-white px-5 py-4">
    <div className="text-xs font-medium uppercase tracking-wider text-[#8a8374]">{label}</div>
    {loading ? <SkeletonBar className="mt-2.5 h-7 w-14" /> : <div className={`mt-1 text-3xl font-semibold ${tone}`}>{value}</div>}
  </div>
);

// Confirmation modal for destructive actions (instead of the browser's confirm dialog). The modal stays open while
// the action runs, showing progress, and closes when it finishes.
interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  busyLabel: string;
  action: () => Promise<void>;
}

const ConfirmContext = createContext<(options: ConfirmOptions) => void>(() => {});
const useConfirm = () => useContext(ConfirmContext);

const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = useCallback((next: ConfirmOptions) => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setOptions(next);
  }, []);

  const close = useCallback(() => {
    setOptions(null);
    returnFocusRef.current?.focus();
  }, []);

  const confirm = async () => {
    if (!options) return;
    setBusy(true);
    try {
      await options.action();
    } finally {
      setBusy(false);
      close();
    }
  };

  useEffect(() => {
    if (!options) return;
    // Default focus on "Batal" so pressing Enter never deletes by accident
    cancelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [options, busy, close]);

  return (
    <ConfirmContext.Provider value={open}>
      {children}
      {options && (
        <div
          className="admin-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#1f2a22]/45 backdrop-blur-[2px]"
          onClick={() => !busy && close()}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            onClick={(e) => e.stopPropagation()}
            className="admin-modal-card w-[420px] rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(31,42,34,0.25)]"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fdecec] text-[#9b1c1c]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-base font-semibold text-[#1f2a22]">
                  {options.title}
                </h2>
                <div id="confirm-message" className="mt-1.5 text-sm leading-relaxed text-[#5c645d]">
                  {options.message}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button ref={cancelRef} onClick={close} disabled={busy}>
                Batal
              </Button>
              <button
                onClick={confirm}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#b42318] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#9b1c1c] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {busy && <span className="admin-spinner h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                {busy ? options.busyLabel : options.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

const LoginScreen: React.FC<{ configured: boolean; onLoggedIn: () => void }> = ({ configured, onLoggedIn }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
      onLoggedIn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-root flex min-h-screen items-center justify-center bg-[#f6f3ee] font-sans text-[#1f2a22]">
      <form onSubmit={submit} className="w-[380px] rounded-2xl border border-[#e5dfd3] bg-white p-8 shadow-sm">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-[#8a8374]">Admin Undangan</div>
        <h1 className="mt-1 text-2xl font-semibold text-[#1f2a22]">Nadia &amp; Jorgi</h1>
        {!configured ? (
          <p className="mt-6 rounded-lg bg-[#fff7e6] p-3 text-sm text-[#7a5a12]">
            Belum ada akun admin. Jalankan <code className="font-mono">pnpm db:seed</code>, atau atur{" "}
            <code className="font-mono">ADMIN_PASSWORD</code> di environment server lalu muat ulang halaman ini.
          </p>
        ) : (
          <>
            <label className="mt-6 block text-sm font-medium text-[#3d463f]" htmlFor="admin-username">
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              autoFocus
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#d9d2c5] px-3 py-2.5 text-[#1f2a22] outline-none focus:border-[#24412f]"
            />
            <label className="mt-4 block text-sm font-medium text-[#3d463f]" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#d9d2c5] px-3 py-2.5 text-[#1f2a22] outline-none focus:border-[#24412f]"
            />
            {error && <p className="mt-2 text-sm text-[#9b1c1c]">{error}</p>}
            <Button type="submit" variant="primary" disabled={busy || !username.trim() || !password} className="mt-5 w-full py-2.5">
              {busy ? "Memeriksa..." : "Masuk"}
            </Button>
          </>
        )}
      </form>
    </div>
  );
};

const WishesTab: React.FC<{ onAuthError: () => void }> = ({ onAuthError }) => {
  const confirm = useConfirm();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  // False until the first load finishes: skeletons instead of an empty table
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Attendance>("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setWishes((await api<{ wishes: Wish[] }>("/api/admin/wishes")).wishes);
      setError(null);
    } catch (err) {
      if ((err as { status?: number }).status === 401) onAuthError();
      else setError((err as Error).message);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [onAuthError]);

  useEffect(() => {
    const initial = setTimeout(load, 0);
    return () => clearTimeout(initial);
  }, [load]);

  const remove = (wish: Wish) =>
    confirm({
      title: "Hapus ucapan?",
      message: (
        <>
          Ucapan dari <span className="font-semibold text-[#1f2a22]">{wish.name}</span> akan dihapus permanen dan tidak tampil lagi
          di undangan.
        </>
      ),
      confirmLabel: "Hapus Ucapan",
      busyLabel: "Menghapus...",
      action: async () => {
        try {
          await api(`/api/admin/wishes?id=${encodeURIComponent(wish.id)}`, { method: "DELETE" });
          setWishes((prev) => prev.filter((w) => w.id !== wish.id));
        } catch (err) {
          if ((err as { status?: number }).status === 401) onAuthError();
          else setError((err as Error).message);
        }
      },
    });

  const exportCsv = () => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["Nama", "Kehadiran", "Ucapan", "Waktu"],
      ...wishes.map((w) => [w.name, w.attendance ? attendanceLabel(w.attendance) : "-", w.message, formatDate(w.createdAt)]),
    ];
    const blob = new Blob(["﻿" + rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ucapan-nadia-jorgi.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wishes.filter(
      (w) => (filter === "all" || w.attendance === filter) && (!q || w.name.toLowerCase().includes(q) || w.message.toLowerCase().includes(q)),
    );
  }, [wishes, query, filter]);
  const pagination = usePagination(visible);

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Ucapan" value={wishes.length} loading={!loaded} />
        <StatCard label="Hadir" value={wishes.filter((w) => w.attendance === "hadir").length} loading={!loaded} tone="text-[#1f8f4e]" />
        <StatCard
          label="Tidak Hadir"
          value={wishes.filter((w) => w.attendance === "tidak_hadir").length}
          loading={!loaded}
          tone="text-[#9b1c1c]"
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            pagination.setPage(1);
          }}
          placeholder="Cari nama atau isi ucapan..."
          className="w-80 rounded-lg border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#24412f]"
        />
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as typeof filter);
            pagination.setPage(1);
          }}
          className="rounded-lg border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#24412f]"
        >
          <option value="all">Semua kehadiran</option>
          <option value="hadir">Hadir</option>
          <option value="tidak_hadir">Tidak Hadir</option>
        </select>
        <div className="ml-auto flex gap-2">
          <Button onClick={load} disabled={loading}>
            {loading && <Spinner />}
            {loading ? "Memuat..." : "Muat Ulang"}
          </Button>
          <Button onClick={exportCsv} disabled={wishes.length === 0}>
            Ekspor CSV
          </Button>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-[#fdf1f1] p-3 text-sm text-[#9b1c1c]">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-xl border border-[#e5dfd3] bg-white">
        <table className={`w-full text-left text-sm transition-opacity ${loading && loaded ? "opacity-50" : ""}`} aria-busy={loading}>
          {loading && loaded && <LoadingCaption />}
          <thead className="bg-[#faf8f4] text-xs uppercase tracking-wider text-[#8a8374]">
            <tr>
              <th className="w-48 px-4 py-3 font-medium">Nama</th>
              <th className="w-32 px-4 py-3 font-medium">Kehadiran</th>
              <th className="px-4 py-3 font-medium">Ucapan</th>
              <th className="w-44 px-4 py-3 font-medium">Waktu</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#efe9de] text-[#1f2a22]">
            {!loaded && <SkeletonRows columns={["w-28", "w-16", "w-full", "w-28", "ml-auto w-14"]} />}
            {pagination.pageItems.map((wish) => (
              <tr key={wish.id} className="align-top hover:bg-[#fcfbf8]">
                <td className="px-4 py-3 font-medium">{wish.name}</td>
                <td className="px-4 py-3">
                  {wish.attendance ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        wish.attendance === "hadir" ? "bg-[#e6f4ea] text-[#1f6b3a]" : "bg-[#f6eded] text-[#8a2a2a]"
                      }`}
                    >
                      {attendanceLabel(wish.attendance)}
                    </span>
                  ) : (
                    <span className="text-[#b3ab9c]">-</span>
                  )}
                </td>
                <td className="whitespace-pre-line px-4 py-3 text-[#3d463f]">{wish.message}</td>
                <td className="px-4 py-3 text-[#8a8374]">{formatDate(wish.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="danger" onClick={() => remove(wish)} className="px-2.5 py-1.5 text-xs">
                    Hapus
                  </Button>
                </td>
              </tr>
            ))}
            {loaded && !loading && visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[#8a8374]">
                  {wishes.length === 0 ? "Belum ada ucapan yang masuk." : "Tidak ada ucapan yang cocok dengan pencarian."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loaded && <Pagination {...pagination} />}
      </div>
    </div>
  );
};

const InvitesTab: React.FC<{ onAuthError: () => void }> = ({ onAuthError }) => {
  const confirm = useConfirm();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [settings, setSettings] = useState<InviteSettings>({ template: "" });
  const [defaultTemplate, setDefaultTemplate] = useState("");
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  // False until the first load finishes: skeletons instead of an empty table and template
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bulk, setBulk] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "unsent">("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleError = useCallback(
    (err: unknown) => {
      if ((err as { status?: number }).status === 401) onAuthError();
      else setNotice({ kind: "error", text: (err as Error).message });
    },
    [onAuthError],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [guestData, settingsData] = await Promise.all([
        api<{ guests: Guest[] }>("/api/admin/guests"),
        api<{ settings: InviteSettings; defaultTemplate: string }>("/api/admin/settings"),
      ]);
      // Guests who took a QR from a group link or were added at the desk were never sent an invitation: Check-in tab
      setGuests(guestData.guests.filter((guest) => (guest.source ?? "admin") === "admin"));
      setSettings(settingsData.settings);
      setDefaultTemplate(settingsData.defaultTemplate);
      setSettingsDirty(false);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [handleError]);

  useEffect(() => {
    const initial = setTimeout(load, 0);
    return () => clearTimeout(initial);
  }, [load]);

  const addEntries = async (entries: { name: string; phone: string }[], onDone: () => void) => {
    const invalid = entries.find((entry) => entry.phone && !normalizePhone(entry.phone));
    if (invalid) {
      setNotice({ kind: "error", text: `Nomor WhatsApp untuk "${invalid.name}" tidak valid.` });
      return;
    }
    try {
      const data = await api<{ guests: Guest[] }>("/api/admin/guests", { method: "POST", body: JSON.stringify({ guests: entries }) });
      setGuests((prev) => [...prev, ...data.guests]);
      pagination.setPage(Number.MAX_SAFE_INTEGER); // clamped to the last page, where the new guests are
      setNotice({ kind: "success", text: `${data.guests.length} tamu ditambahkan.` });
      onDone();
    } catch (err) {
      handleError(err);
    }
  };

  const saveSettings = async () => {
    try {
      const data = await api<{ settings: InviteSettings }>("/api/admin/settings", { method: "PUT", body: JSON.stringify(settings) });
      setSettings(data.settings);
      setSettingsDirty(false);
      setNotice({ kind: "success", text: "Template pesan disimpan." });
    } catch (err) {
      handleError(err);
    }
  };

  const setSent = async (guest: Guest, sent: boolean) => {
    try {
      const data = await api<{ guest: Guest }>("/api/admin/guests", { method: "PATCH", body: JSON.stringify({ id: guest.id, sent }) });
      setGuests((prev) => prev.map((g) => (g.id === guest.id ? data.guest : g)));
    } catch (err) {
      handleError(err);
    }
  };

  const sendWhatsApp = (guest: Guest) => {
    window.open(whatsappUrl(guest.phone, renderMessage(settings.template, guest)), "_blank", "noopener");
    if (!guest.sentAt) setSent(guest, true);
  };

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setNotice({ kind: "success", text: `${label} disalin.` });
  };

  const remove = (guest: Guest) =>
    confirm({
      title: "Hapus tamu?",
      message: (
        <>
          <span className="font-semibold text-[#1f2a22]">{guest.name}</span> akan dihapus dari daftar tamu. Link undangan yang sudah
          terkirim tetap bisa dibuka.
        </>
      ),
      confirmLabel: "Hapus Tamu",
      busyLabel: "Menghapus...",
      action: async () => {
        try {
          await api(`/api/admin/guests?id=${encodeURIComponent(guest.id)}`, { method: "DELETE" });
          setGuests((prev) => prev.filter((g) => g.id !== guest.id));
        } catch (err) {
          handleError(err);
        }
      },
    });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const matchesQuery = (g: Guest) => !q || g.name.toLowerCase().includes(q) || (digits !== "" && (g.phone ?? "").includes(digits));
    return guests.filter((g) => (statusFilter === "all" || (statusFilter === "sent" ? g.sentAt : !g.sentAt)) && matchesQuery(g));
  }, [guests, query, statusFilter]);
  const pagination = usePagination(visible);

  const previewGuest = guests.find((g) => g.id === previewId) ?? guests[0];
  const previewName = previewGuest?.name ?? "Nama Tamu";
  const sentCount = guests.filter((g) => g.sentAt).length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Tamu" value={guests.length} loading={!loaded} />
        <StatCard label="Sudah Dikirim" value={sentCount} loading={!loaded} tone="text-[#1f8f4e]" />
        <StatCard label="Belum Dikirim" value={guests.length - sentCount} loading={!loaded} tone="text-[#a06a12]" />
      </div>

      {notice && (
        <div
          className={`mt-4 flex items-start justify-between whitespace-pre-line rounded-lg p-3 text-sm ${
            notice.kind === "error" ? "bg-[#fdf1f1] text-[#9b1c1c]" : "bg-[#e9f5ec] text-[#1f6b3a]"
          }`}
        >
          {notice.text}
          <button onClick={() => setNotice(null)} className="ml-4 opacity-60 hover:opacity-100" aria-label="Tutup">
            ✕
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-[1fr_420px] gap-6">
        {/* Guest list */}
        <div>
          <div className="rounded-xl border border-[#e5dfd3] bg-white p-5">
            <h2 className="text-base font-semibold text-[#1f2a22]">Tambah Tamu</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addEntries([{ name, phone }], () => {
                  setName("");
                  setPhone("");
                });
              }}
              className="mt-3 flex gap-3"
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama tamu (mis. Bapak Ahmad & Keluarga)"
                className="flex-1 rounded-lg border border-[#d9d2c5] px-3 py-2 text-sm outline-none focus:border-[#24412f]"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="No. WhatsApp (opsional)"
                className="w-56 rounded-lg border border-[#d9d2c5] px-3 py-2 text-sm outline-none focus:border-[#24412f]"
              />
              <Button type="submit" variant="primary" disabled={name.trim().length < 2}>
                Tambah
              </Button>
            </form>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-[#24412f]">Impor banyak tamu sekaligus</summary>
              <p className="mt-2 text-xs text-[#8a8374]">
                Satu tamu per baris, format <code className="font-mono">Nama, 08123456789</code>. Nomor boleh dikosongkan.
              </p>
              <textarea
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                rows={5}
                placeholder={"Bapak Ahmad & Keluarga, 081234567890\nSiti Aminah, 0857-1111-2222\nRekan Kantor"}
                className="mt-2 w-full rounded-lg border border-[#d9d2c5] px-3 py-2 font-mono text-sm outline-none focus:border-[#24412f]"
              />
              <Button
                className="mt-2"
                variant="primary"
                disabled={!bulk.trim()}
                onClick={() => addEntries(parseBulk(bulk), () => setBulk(""))}
              >
                Impor {parseBulk(bulk).length || ""} Tamu
              </Button>
            </details>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                pagination.setPage(1);
              }}
              placeholder="Cari nama atau nomor..."
              className="w-72 rounded-lg border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#24412f]"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                pagination.setPage(1);
              }}
              className="rounded-lg border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#24412f]"
            >
              <option value="all">Semua status</option>
              <option value="unsent">Belum dikirim</option>
              <option value="sent">Sudah dikirim</option>
            </select>
            <Button onClick={load} disabled={loading} className="ml-auto">
              {loading && <Spinner />}
            {loading ? "Memuat..." : "Muat Ulang"}
            </Button>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-[#e5dfd3] bg-white">
            <table className={`w-full text-left text-sm transition-opacity ${loading && loaded ? "opacity-50" : ""}`} aria-busy={loading}>
              {loading && loaded && <LoadingCaption />}
              <thead className="bg-[#faf8f4] text-xs uppercase tracking-wider text-[#8a8374]">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="w-44 px-4 py-3 font-medium">WhatsApp</th>
                  <th className="w-40 px-4 py-3 font-medium">Status</th>
                  <th className="w-[270px] px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efe9de] text-[#1f2a22]">
                {!loaded && <SkeletonRows columns={["w-36", "w-28", "w-24", "ml-auto w-48"]} />}
                {pagination.pageItems.map((guest) => (
                  <tr
                    key={guest.id}
                    onClick={() => setPreviewId(guest.id)}
                    className={`cursor-pointer ${previewGuest?.id === guest.id ? "bg-[#f5f1e8]" : "hover:bg-[#fcfbf8]"}`}
                  >
                    <td className="px-4 py-3 font-medium">{guest.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#3d463f]">{guest.phone ? formatPhone(guest.phone) : <span className="text-[#b3ab9c]">Pilih saat kirim</span>}</td>
                    <td className="px-4 py-3">
                      {guest.sentAt ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSent(guest, false);
                          }}
                          title="Klik untuk tandai belum dikirim"
                          className="rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-xs font-medium text-[#1f6b3a]"
                        >
                          Terkirim · {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(guest.sentAt))}
                        </button>
                      ) : (
                        <span className="rounded-full bg-[#fbf3e3] px-2.5 py-0.5 text-xs font-medium text-[#8a5a0e]">Belum dikirim</span>
                      )}
                      <div className="mt-1.5">
                        {guest.attendance ? (
                          <span
                            title={guest.respondedAt ? formatDate(guest.respondedAt) : undefined}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              guest.attendance === "hadir" ? "bg-[#e6f4ea] text-[#1f6b3a]" : "bg-[#f3efe7] text-[#6f6858]"
                            }`}
                          >
                            {attendanceLabel(guest.attendance)}
                          </span>
                        ) : (
                          <span className="text-xs text-[#b3ab9c]">Belum konfirmasi</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button variant="whatsapp" onClick={() => sendWhatsApp(guest)} className="px-2.5 py-1.5 text-xs">
                          Kirim WA
                        </Button>
                        <Button onClick={() => copy(inviteLink(guest), "Link undangan")} className="px-2.5 py-1.5 text-xs">
                          Salin Link
                        </Button>
                        <Button variant="danger" onClick={() => remove(guest)} className="px-2.5 py-1.5 text-xs">
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loaded && !loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-[#8a8374]">
                      {guests.length === 0 ? "Belum ada tamu. Tambahkan tamu di atas." : "Tidak ada tamu yang cocok."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {loaded && <Pagination {...pagination} />}
          </div>
        </div>

        {/* Message template and preview */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[#e5dfd3] bg-white p-5">
            <h2 className="text-base font-semibold text-[#1f2a22]">Template Pesan WhatsApp</h2>
            <p className="mt-1 text-xs text-[#8a8374]">
              Gunakan <code className="font-mono">{"{nama}"}</code> untuk nama tamu dan <code className="font-mono">{"{link}"}</code> untuk link
              undangan personal. Teks di antara *bintang* akan tebal di WhatsApp.
            </p>
            {loaded ? (
              <textarea
                value={settings.template}
                onChange={(e) => {
                  setSettings((s) => ({ ...s, template: e.target.value }));
                  setSettingsDirty(true);
                }}
                rows={14}
                className="mt-4 w-full rounded-lg border border-[#d9d2c5] px-3 py-2 text-sm leading-relaxed outline-none focus:border-[#24412f]"
              />
            ) : (
              <div className="mt-4 flex h-[322px] flex-col gap-3 rounded-lg border border-[#d9d2c5] p-3" aria-label="Memuat template">
                {["w-3/4", "w-1/3", "w-1/2", "w-full", "w-5/6", "w-2/3", "w-full", "w-1/2"].map((width, idx) => (
                  <SkeletonBar key={idx} className={`h-3.5 ${width}`} />
                ))}
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <Button variant="primary" onClick={saveSettings} disabled={!settingsDirty}>
                Simpan Template
              </Button>
              <Button
                disabled={!loaded}
                onClick={() => {
                  setSettings((s) => ({ ...s, template: defaultTemplate }));
                  setSettingsDirty(true);
                }}
              >
                Kembalikan Default
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[#e5dfd3] bg-[#e9e3d6] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1f2a22]">Pratinjau</h2>
              <span className="text-xs text-[#6f6858]">untuk: {previewName}</span>
            </div>
            <div className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-[#dcf8c6] p-3 text-sm text-[#1f2a22] shadow-sm">
              {loaded ? (
                renderMessage(settings.template, previewGuest ?? { name: previewName })
              ) : (
                <div className="flex flex-col gap-2.5 py-1">
                  {["w-2/3", "w-1/3", "w-full", "w-5/6", "w-1/2"].map((width, idx) => (
                    <SkeletonBar key={idx} className={`h-3.5 bg-[#c5e8ab] ${width}`} />
                  ))}
                </div>
              )}
            </div>
            {previewGuest && (
              <div className="mt-3 flex gap-2">
                <Button variant="whatsapp" onClick={() => sendWhatsApp(previewGuest)}>
                  Kirim ke {previewGuest.name.split(" ")[0]}
                </Button>
                <Button onClick={() => copy(renderMessage(settings.template, previewGuest), "Pesan")}>Salin Pesan</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// An admin entry without a WhatsApp number is a group invitation (shared in a WhatsApp group), not a person
const isGroupInvite = (guest: Guest) => (guest.source ?? "admin") === "admin" && !guest.phone;

const sourceLabel = (guest: Guest, groupNames: Map<string, string>) => {
  if (guest.source === "self") {
    const group = guest.groupId ? groupNames.get(guest.groupId) : undefined;
    return group ? `Grup: ${group}` : "Link umum";
  }
  return guest.source === "desk" ? "Ditambah di lokasi" : "Undangan pribadi";
};

// QR check-in at the venue: the desk PIN, the desk page link and who has arrived (every person, whatever their source;
// group invitations themselves are left out, their members are listed with the group's name)
const CheckinTab: React.FC<{ onAuthError: () => void }> = ({ onAuthError }) => {
  const confirm = useConfirm();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [groupNames, setGroupNames] = useState<Map<string, string>>(new Map());
  const [pinSet, setPinSet] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleError = useCallback(
    (err: unknown) => {
      if ((err as { status?: number }).status === 401) onAuthError();
      else setNotice({ kind: "error", text: (err as Error).message });
    },
    [onAuthError],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [guestData, pinData] = await Promise.all([
        api<{ guests: Guest[] }>("/api/admin/guests"),
        api<{ pinSet: boolean }>("/api/admin/checkin-pin"),
      ]);
      setGroupNames(new Map(guestData.guests.filter(isGroupInvite).map((g) => [g.id, g.name])));
      setGuests(guestData.guests.filter((g) => !isGroupInvite(g)));
      setPinSet(pinData.pinSet);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [handleError]);

  useEffect(() => {
    const initial = setTimeout(load, 0);
    return () => clearTimeout(initial);
  }, [load]);

  const savePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPin(true);
    try {
      await api("/api/admin/checkin-pin", { method: "PUT", body: JSON.stringify({ pin }) });
      setNotice({ kind: "success", text: pinSet ? "PIN panitia diganti. HP panitia perlu masuk lagi dengan PIN baru." : "PIN panitia disimpan." });
      setPinSet(true);
      setPin("");
    } catch (err) {
      handleError(err);
    } finally {
      setSavingPin(false);
    }
  };

  const setCheckedIn = async (guest: Guest, checkedIn: boolean) => {
    setBusyId(guest.id);
    try {
      const data = checkedIn
        ? await api<{ guest: Guest }>("/api/checkin", { method: "POST", body: JSON.stringify({ id: guest.id }) })
        : await api<{ guest: Guest }>(`/api/checkin?id=${encodeURIComponent(guest.id)}`, { method: "DELETE" });
      setGuests((prev) => prev.map((g) => (g.id === guest.id ? { ...g, checkedInAt: data.guest.checkedInAt } : g)));
    } catch (err) {
      handleError(err);
    } finally {
      setBusyId(null);
    }
  };

  const remove = (guest: Guest) =>
    confirm({
      title: "Hapus tamu?",
      message: (
        <>
          <span className="font-semibold text-[#1f2a22]">{guest.name}</span> akan dihapus dari daftar, dan QR-nya tidak bisa dipakai
          check-in lagi.
        </>
      ),
      confirmLabel: "Hapus Tamu",
      busyLabel: "Menghapus...",
      action: async () => {
        try {
          await api(`/api/admin/guests?id=${encodeURIComponent(guest.id)}`, { method: "DELETE" });
          setGuests((prev) => prev.filter((g) => g.id !== guest.id));
        } catch (err) {
          handleError(err);
        }
      },
    });

  const deskUrl = `${SITE_URL}/checkin`;
  const copyDeskUrl = async () => {
    await navigator.clipboard.writeText(deskUrl);
    setNotice({ kind: "success", text: "Link halaman penerima tamu disalin." });
  };

  // Arrived guests first, most recent on top; then the rest in list order
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests
      .filter((g) => (filter === "all" || (filter === "in" ? g.checkedInAt : !g.checkedInAt)) && (!q || g.name.toLowerCase().includes(q)))
      .sort((a, b) => (b.checkedInAt ?? "").localeCompare(a.checkedInAt ?? ""));
  }, [guests, query, filter]);
  const pagination = usePagination(visible);

  const exportCsv = () => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ["Nama", "Asal", "Check-in"],
      ...visible.map((g) => [g.name, sourceLabel(g, groupNames), g.checkedInAt ? formatDate(g.checkedInAt) : "-"]),
    ];
    const blob = new Blob(["\ufeff" + rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "check-in-nadia-jorgi.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const checkedIn = guests.filter((g) => g.checkedInAt).length;

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Tamu" value={guests.length} loading={!loaded} />
        <StatCard label="Sudah Check-in" value={checkedIn} loading={!loaded} tone="text-[#1f8f4e]" />
        <StatCard label="Dari Link Grup/Umum" value={guests.filter((g) => g.source === "self").length} loading={!loaded} tone="text-[#3d5a80]" />
        <StatCard label="Ditambah di Lokasi" value={guests.filter((g) => g.source === "desk").length} loading={!loaded} tone="text-[#a06a12]" />
      </div>

      {notice && (
        <div
          className={`mt-4 flex items-start justify-between rounded-lg p-3 text-sm ${
            notice.kind === "error" ? "bg-[#fdf1f1] text-[#9b1c1c]" : "bg-[#e9f5ec] text-[#1f6b3a]"
          }`}
        >
          {notice.text}
          <button onClick={() => setNotice(null)} className="ml-4 opacity-60 hover:opacity-100" aria-label="Tutup">
            ✕
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-[1fr_380px] gap-6">
        <div>
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                pagination.setPage(1);
              }}
              placeholder="Cari nama..."
              className="w-72 rounded-lg border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#24412f]"
            />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as typeof filter);
                pagination.setPage(1);
              }}
              className="rounded-lg border border-[#d9d2c5] bg-white px-3 py-2 text-sm outline-none focus:border-[#24412f]"
            >
              <option value="all">Semua tamu</option>
              <option value="in">Sudah check-in</option>
              <option value="out">Belum check-in</option>
            </select>
            <div className="ml-auto flex gap-2">
              <Button onClick={exportCsv} disabled={visible.length === 0}>
                Ekspor CSV
              </Button>
              <Button onClick={load} disabled={loading}>
                {loading && <Spinner />}
                {loading ? "Memuat..." : "Muat Ulang"}
              </Button>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-[#e5dfd3] bg-white">
            <table className={`w-full text-left text-sm transition-opacity ${loading && loaded ? "opacity-50" : ""}`} aria-busy={loading}>
              {loading && loaded && <LoadingCaption />}
              <thead className="bg-[#faf8f4] text-xs uppercase tracking-wider text-[#8a8374]">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="w-44 px-4 py-3 font-medium">Asal</th>
                  <th className="w-44 px-4 py-3 font-medium">Check-in</th>
                  <th className="w-[200px] px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efe9de] text-[#1f2a22]">
                {!loaded && <SkeletonRows columns={["w-36", "w-24", "w-24", "ml-auto w-32"]} />}
                {pagination.pageItems.map((guest) => (
                  <tr key={guest.id}>
                    <td className="px-4 py-3 font-medium">{guest.name}</td>
                    <td className="px-4 py-3 text-[#3d463f]">{sourceLabel(guest, groupNames)}</td>
                    <td className="px-4 py-3">
                      {guest.checkedInAt ? (
                        <span className="rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-xs font-medium text-[#1f6b3a]">{formatDate(guest.checkedInAt)}</span>
                      ) : (
                        <span className="text-xs text-[#b3ab9c]">Belum datang</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => setCheckedIn(guest, !guest.checkedInAt)}
                          disabled={busyId === guest.id}
                          variant={guest.checkedInAt ? "secondary" : "primary"}
                          className="px-2.5 py-1.5 text-xs"
                        >
                          {guest.checkedInAt ? "Batalkan" : "Check-in"}
                        </Button>
                        {(guest.source ?? "admin") !== "admin" && (
                          <Button variant="danger" onClick={() => remove(guest)} className="px-2.5 py-1.5 text-xs">
                            Hapus
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {loaded && !loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-[#8a8374]">
                      {guests.length === 0 ? "Belum ada tamu." : "Tidak ada tamu yang cocok."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {loaded && <Pagination {...pagination} />}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[#e5dfd3] bg-white p-5">
            <h2 className="text-base font-semibold text-[#1f2a22]">Halaman Penerima Tamu</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#8a8374]">
              Buka link ini di HP panitia pada hari acara, lalu masuk dengan PIN di bawah. Panitia bisa scan QR tamu, mencari nama tamu,
              dan menambah tamu yang belum ada di daftar.
            </p>
            <div className="mt-3 truncate rounded-lg bg-[#faf8f4] px-3 py-2 font-mono text-sm text-[#24412f]">{deskUrl}</div>
            <div className="mt-2 flex gap-2">
              <Button onClick={copyDeskUrl}>Salin Link</Button>
              <a
                href="/checkin"
                target="_blank"
                className="inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium text-[#24412f] underline-offset-4 hover:underline"
              >
                Buka ↗
              </a>
            </div>
          </div>

          <form onSubmit={savePin} className="rounded-xl border border-[#e5dfd3] bg-white p-5">
            <h2 className="text-base font-semibold text-[#1f2a22]">PIN Panitia</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#8a8374]">
              {pinSet === null
                ? "Memuat..."
                : pinSet
                  ? "PIN sudah diatur. Mengganti PIN akan mengeluarkan semua HP panitia yang sedang masuk."
                  : "Belum ada PIN. Atur 6 angka yang akan dibagikan ke semua panitia."}
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="6 angka"
                aria-label="PIN panitia"
                className="w-40 rounded-lg border border-[#d9d2c5] px-3 py-2 font-mono text-sm tracking-[0.3em] outline-none focus:border-[#24412f]"
              />
              <Button type="submit" variant="primary" disabled={pin.length !== 6 || savingPin}>
                {savingPin && <Spinner />}
                {pinSet ? "Ganti PIN" : "Simpan PIN"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface Session {
  authenticated: boolean;
  configured: boolean;
  storage: "postgres" | "file" | "missing";
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("wishes");

  const checkSession = useCallback(async () => {
    try {
      setSession(await api<Session>("/api/admin/session"));
      setSessionError(null);
    } catch (err) {
      setSessionError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(checkSession, 0);
    return () => clearTimeout(initial);
  }, [checkSession]);

  const handleAuthError = useCallback(() => setSession((s) => (s ? { ...s, authenticated: false } : s)), []);

  const logout = async () => {
    await api("/api/admin/logout", { method: "POST" });
    setSession((s) => (s ? { ...s, authenticated: false } : s));
  };

  if (sessionError && !session) {
    return (
      <div className="admin-root flex min-h-screen items-center justify-center bg-[#f6f3ee] font-sans text-[#1f2a22]">
        <div className="w-[420px] rounded-2xl border border-[#f0c9c9] bg-white p-8 text-sm shadow-sm">
          <p className="font-semibold text-[#9b1c1c]">Server admin tidak dapat dihubungi</p>
          <p className="mt-2 text-[#3d463f]">{sessionError}</p>
          <Button className="mt-5" onClick={checkSession}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="admin-root flex min-h-screen items-center justify-center bg-[#f6f3ee] font-sans text-[#5c6158]" role="status">
        <span className="inline-flex items-center gap-3 text-sm">
          <Spinner className="h-5 w-5 text-[#24412f]" /> Memuat admin...
        </span>
      </div>
    );
  }
  if (!session.authenticated) return <LoginScreen configured={session.configured} onLoggedIn={checkSession} />;

  return (
    <div className="admin-root min-h-screen min-w-[1100px] bg-[#f6f3ee] font-sans text-[#1f2a22]">
      <header className="border-b border-[#e5dfd3] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-8 py-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a8374]">Admin Undangan</div>
            <div className="text-lg font-semibold">Nadia &amp; Jorgi</div>
          </div>
          <nav className="flex gap-1">
            {(
              [
                ["wishes", "Ucapan"],
                ["invites", "Kirim Undangan"],
                ["checkin", "Check-in"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === value ? "bg-[#24412f] text-white" : "text-[#3d463f] hover:bg-[#f3efe7]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" target="_blank" className="text-sm text-[#24412f] underline-offset-4 hover:underline">
              Lihat undangan ↗
            </Link>
            <Button onClick={logout}>Keluar</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-8 py-8">
        {session.storage === "missing" && (
          <div className="mb-6 rounded-xl border border-[#f0c9c9] bg-[#fdf1f1] p-4 text-sm text-[#9b1c1c]">
            <strong>Database belum terhubung.</strong> Ucapan, daftar tamu, dan template tidak bisa disimpan. Di Vercel buka
            Storage → Create Database → Neon (Postgres), hubungkan ke project ini, lalu Redeploy.
          </div>
        )}
        <ConfirmProvider>
          {tab === "wishes" ? (
            <WishesTab onAuthError={handleAuthError} />
          ) : tab === "invites" ? (
            <InvitesTab onAuthError={handleAuthError} />
          ) : (
            <CheckinTab onAuthError={handleAuthError} />
          )}
        </ConfirmProvider>
      </main>
    </div>
  );
}
