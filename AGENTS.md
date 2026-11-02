<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Development Server Rules
- **DO NOT automatically start or run the dev server** (`pnpm run dev`, `npm run dev`, `next dev`, `npm run start`) in the background unless the user explicitly asks to start it.
- Compile, build, and test verification should be done via `pnpm run build` or `npm run build` when needed.
- The user runs and manages their own development server (`pnpm run dev`) manually in their own terminal.
- **Mandatory Self-Testing Rule**: Selalu test sendiri terlebih dahulu untuk memastikan tampilan, posisi, styling, dan fungsionalitas sudah 100% benar dan sesuai sebelum memberikan laporan hasil ke pengguna. Jangan pernah berasumsi atau memberikan hasil tanpa verifikasi menyeluruh terlebih dahulu.

## Git Push Rule
- **Setiap task selesai, langsung commit dan push ke GitHub** (`origin main`, https://github.com/jorgifatwa/nadia-jorgi-wedding) tanpa menunggu diminta. Push dilakukan setelah self-testing dan `pnpm run build` lolos; Vercel otomatis deploy dari push ini.
- Jangan pernah ikut meng-commit `.env.local`, `data/`, atau `_unused-assets/`.

## Strict Scope Rule: Section 4 (EventSection Text Sizing & Visual Alignment)
- **FOCUS ON SECTION 4 (`src/components/EventSection.tsx`)**: Match text sizes, font styles, typography, spacing, and layout in Section 4 precisely with the reference image and Canva specifications.
- All modifications, styling, alignment, and testing MUST be strictly limited to Section 4 (`src/components/EventSection.tsx`).
- Mandatory Self-Testing Rule applies strictly: Always test yourself first (visual and build verification) before reporting results to the user.
