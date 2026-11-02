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

Tanpa variabel Redis, data (ucapan, tamu, template WhatsApp) disimpan sebagai file JSON di folder `data/` (tidak ikut ke git).

## Deploy ke Vercel

1. **Import repository** di [vercel.com/new](https://vercel.com/new). Framework terdeteksi otomatis sebagai Next.js dan package manager pnpm; tidak ada pengaturan build yang perlu diubah.
2. **Hubungkan database**: di project Vercel buka **Storage → Create Database → Upstash (Redis)**, pilih paket gratis, lalu hubungkan ke project. Vercel otomatis menambahkan `KV_REST_API_URL` dan `KV_REST_API_TOKEN`.
   Tanpa langkah ini, ucapan dan data admin **tidak bisa disimpan** di Vercel.
3. **Environment variables** (Settings → Environment Variables):
   - `ADMIN_PASSWORD` — password halaman `/admin`
   - `ADMIN_SESSION_SECRET` — teks acak panjang, misalnya hasil `openssl rand -hex 32`
   - `NEXT_PUBLIC_SITE_URL` — opsional, hanya jika memakai domain sendiri (mis. `https://nadia-jorgi.com`)
4. **Deploy ulang** (Deployments → Redeploy) setelah menambah database/variabel supaya ikut terbaca.

Setelah online:

- Cek pratinjau link WhatsApp/Instagram di [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (tombol *Scrape Again* juga menyegarkan cache pratinjau).
- Di `/admin` → Kirim Undangan, isi **Alamat website undangan** dengan domain final agar link di pesan WhatsApp benar.

## Struktur singkat

| Lokasi | Isi |
| --- | --- |
| `src/components/` | Section undangan (layout mengikuti kanvas 440px, lihat `canvasLayout.tsx`) |
| `src/app/api/` | API ucapan (`/api/wishes`) dan admin (`/api/admin/*`) |
| `src/lib/` | Validasi ucapan, autentikasi admin, penyimpanan (Redis / file JSON) |
| `public/` | Aset gambar, font, audio, animasi |
