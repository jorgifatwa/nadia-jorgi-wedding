"use client";

import { useEffect } from "react";

// Light deterrent against casual copying/inspecting on the invitation pages: no context menu, no image dragging and the
// usual DevTools / view-source shortcuts are swallowed. It can't stop a determined visitor, and edits made in DevTools
// only ever change that visitor's own screen; real protection is the server-side validation in the API routes.
const isFormField = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest("input, textarea, select"));

export const ContentGuard: React.FC = () => {
  useEffect(() => {
    // Form fields keep their menu so guests can still paste into the wish form
    const onContextMenu = (e: MouseEvent) => {
      if (!isFormField(e.target)) e.preventDefault();
    };
    const onDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      const devtools = key === "f12" || (mod && (e.shiftKey || e.altKey) && ["i", "j", "c"].includes(key));
      const viewSource = mod && (key === "u" || key === "s");
      if (devtools || viewSource) e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown);
    document.documentElement.classList.add("content-guard");
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.classList.remove("content-guard");
    };
  }, []);

  return null;
};
