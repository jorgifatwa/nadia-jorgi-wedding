---
description: Rule forbidding automatic execution of pnpm run dev / dev server
globs: ["**/*"]
---

# Development Server Rules

- **DO NOT automatically start or run the development server** (`pnpm run dev`, `npm run dev`, `next dev`, `npm run start`) in the background unless the user explicitly requests it.
- Compile or build verification should be performed using `pnpm run build` or `npm run build` (or `next build`).
- The user starts and manages their dev server manually from their own terminal.
