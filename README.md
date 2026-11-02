# Undangan Pernikahan Nadia & Jorgi

Undangan digital (Next.js 16) dengan halaman admin untuk mengelola ucapan tamu dan mengirim undangan lewat WhatsApp.

- `/` — halaman amplop, lalu undangan lengkap setelah amplop dibuka (link personal: `/?to=Nama Tamu`)
- `/details` — undangan lengkap tanpa amplop
- `/admin` — kelola ucapan & kirim undangan WhatsApp (desktop, butuh password)

## Menjalankan di lokal

```bash
pnpm install
cp .env.example .env.local   # lalu isi ADMIN_PASSWORD dan ADMIN_SESSION_SECRET
pnpm dev
```

Tanpa `DATABASE_URL`, data (ucapan, tamu, template WhatsApp) disimpan sebagai file JSON di folder `data/` (tidak ikut ke git) dan login admin memakai `ADMIN_USERNAME` / `ADMIN_PASSWORD` dari `.env.local`.

Untuk memakai Postgres di lokal, isi `DATABASE_URL` di `.env.local` (misalnya URL database Neon yang sama dengan production).

## Database & akun admin

Tabel dibuat otomatis saat request pertama. Akun admin pertama juga dibuat otomatis dari `ADMIN_USERNAME` (default `admin`) dan `ADMIN_PASSWORD` jika tabel admin masih kosong, jadi setelah deploy langsung bisa login.

Seed manual (membuat tabel + akun admin, atau mengganti password akun yang sudah ada):

```bash
pnpm db:seed                               # pakai DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD dari .env.local
pnpm db:seed -- nadia passwordbaru123      # buat/ubah akun lain
DATABASE_URL="postgres://..." pnpm db:seed # ke database tertentu, mis. production
```

## Deploy ke Vercel

1. **Import repository** di [vercel.com/new](https://vercel.com/new). Framework terdeteksi otomatis sebagai Next.js dan package manager pnpm; tidak ada pengaturan build yang perlu diubah.
2. **Buat database Postgres**: di project Vercel buka **Storage → Create Database → Neon** (Serverless Postgres), pilih paket gratis dan region terdekat (Singapore), lalu **Connect** ke project (centang Production, Preview, Development). Vercel otomatis menambahkan `DATABASE_URL` / `POSTGRES_URL`.
   Tanpa langkah ini, ucapan dan data admin **tidak bisa disimpan** di Vercel.
3. **Environment variables** (Settings → Environment Variables):
   - `ADMIN_USERNAME` — opsional, default `admin`
   - `ADMIN_PASSWORD` — password akun admin pertama (minimal 8 karakter)
   - `ADMIN_SESSION_SECRET` — teks acak panjang, misalnya hasil `openssl rand -hex 32`
   - `NEXT_PUBLIC_SITE_URL` — opsional, hanya jika memakai domain sendiri (mis. `https://nadia-jorgi.com`)
4. **Deploy ulang** (Deployments → ⋯ → Redeploy) setelah menambah database/variabel supaya ikut terbaca.
5. Buka `/admin` dan login dengan username + password di atas.

Mengganti `ADMIN_PASSWORD` di Vercel setelah akun dibuat **tidak** mengubah password akun; pakai `pnpm db:seed` dengan `DATABASE_URL` production untuk menggantinya.

Setelah online:

- Cek pratinjau link WhatsApp/Instagram di [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (tombol *Scrape Again* juga menyegarkan cache pratinjau).
- Di `/admin` → Kirim Undangan, isi **Alamat website undangan** dengan domain final agar link di pesan WhatsApp benar.

## Struktur singkat

| Lokasi | Isi |
| --- | --- |
| `src/components/` | Section undangan (layout mengikuti kanvas 440px, lihat `canvasLayout.tsx`) |
| `src/app/api/` | API ucapan (`/api/wishes`) dan admin (`/api/admin/*`) |
| `src/lib/` | Validasi ucapan, autentikasi admin, penyimpanan (Postgres / file JSON) |
| `scripts/seed.mjs` | Seed tabel + akun admin (`pnpm db:seed`) |
| `public/` | Aset gambar, font, audio, animasi |
