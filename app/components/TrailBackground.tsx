"use client";

import { useEffect, useRef, useState } from "react";

// A cursor-trail background layer: as the pointer moves across the parent, small
// squares appear exactly where the cursor is and linger for a few seconds before
// fading out. No physics — spawned DOM nodes with CSS transitions. Desktop-only
// (a trail needs a hovering pointer); skipped on mobile. Drop it as an absolute
// layer inside a `position: relative` container, with the real content above it.

const SIZE = 30; // square edge, px
const STEP = 22; // min pointer travel between spawns, px
const LIFE = 2200; // how long a square stays fully visible, ms
const FADE = 1200; // fade-out duration, ms
const MAX = 90; // safety cap on concurrent squares

const PALETTE_LIGHT = ["#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#3e6b89"];
const PALETTE_DARK = ["#3a3a3a", "#474747", "#565656", "#6b6b6b", "#4d7ea0"];

export default function TrailBackground() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stage = stageRef.current;
    if (!stage) return;

    const palette = document.documentElement.classList.contains("dark")
      ? PALETTE_DARK
      : PALETTE_LIGHT;

    const live = new Set<HTMLDivElement>();
    let lastX = 0;
    let lastY = 0;
    let seeded = false;
    let colorIdx = 0;

    const spawn = (x: number, y: number) => {
      const el = document.createElement("div");
      el.className = "trail-sq";
      el.style.background = palette[colorIdx++ % palette.length];
      el.style.left = `${x - SIZE / 2}px`;
      el.style.top = `${y - SIZE / 2}px`;
      const rot = (Math.random() - 0.5) * 0.9; // radians
      el.style.transform = `rotate(${rot}rad) scale(0.5)`;
      el.style.opacity = "0";
      stage.appendChild(el);
      live.add(el);

      // Cap concurrent squares — drop the oldest.
      if (live.size > MAX) {
        const oldest = live.values().next().value as HTMLDivElement | undefined;
        if (oldest) {
          oldest.remove();
          live.delete(oldest);
        }
      }

      // Fade in on the next frame.
      requestAnimationFrame(() => {
        el.style.transition = "opacity 180ms ease, transform 260ms ease";
        el.style.opacity = "1";
        el.style.transform = `rotate(${rot}rad) scale(1)`;
      });

      // After LIFE, fade out slowly; then remove.
      window.setTimeout(() => {
        el.style.transition = `opacity ${FADE}ms ease, transform ${FADE}ms ease`;
        el.style.opacity = "0";
        el.style.transform = `rotate(${rot}rad) scale(0.85)`;
        window.setTimeout(() => {
          el.remove();
          live.delete(el);
        }, FADE);
      }, LIFE);
    };

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      // Only trail while the pointer is over the layer.
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      if (!seeded) {
        lastX = x;
        lastY = y;
        seeded = true;
        spawn(x, y);
        return;
      }
      if (Math.hypot(x - lastX, y - lastY) >= STEP) {
        lastX = x;
        lastY = y;
        spawn(x, y);
      }
    };

    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      for (const el of live) el.remove();
      live.clear();
    };
    // Rebuild when the theme flips so the palette matches.
  }, [dark]);

  return <div ref={stageRef} className="trail-stage absolute inset-0" aria-hidden="true" />;
}
