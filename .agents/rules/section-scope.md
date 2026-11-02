---
description: Strict scope rule enforcing focus exclusively on Section 1 until explicit user approval
globs: ["**/*"]
---

# Strict Scope Rule: Section 1 Only

- **FOCUS EXCLUSIVELY ON SECTION 1 (Landing / Envelope Cover)**.
- **DO NOT touch, create, advance, or introduce other sections** (Section 2, Couple, Event, Story, Gallery, Gift, RSVP, Closing, FullInvitation, etc.) under ANY circumstances until the user explicitly commands to proceed (e.g. "lanjut ke section berikutnya" or "section 1 sudah selesai").
- All modifications, styling, alignment, and testing MUST be strictly limited to Section 1 (`src/components/EnvelopeLanding.tsx` and `src/app/page.tsx`).
- The user does NOT need to repeat this requirement in future prompts; this rule is permanently active until the user explicitly lifts it.
