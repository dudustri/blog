"use client";

import { useEffect, useRef, useState } from "react";

// A faithful React port of corti.ai's "matter-bg" banner: ~60 small squares are
// real Matter.js rigid bodies with gentle gravity, and the cursor acts as a
// force field that pushes nearby squares away, scaled by pointer speed. Runs
// only on desktop (skipped on mobile) and only while the banner is on screen.

const SIZE = 32; // square edge, px
const RADIUS = 170; // cursor repel radius, px
const ACCEL = 0.01; // cursor push strength
const COUNT = 60;

// Visible slate greys + the brand accent (#3e6b89). The lighter Tailwind greys
// vanished against the bg-gray-50 card, so these are picked to read on it.
const PALETTE_LIGHT = ["#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#3e6b89"];
const PALETTE_DARK = ["#3a3a3a", "#474747", "#565656", "#6b6b6b", "#4d7ea0"];

export default function MatterBanner({
  title,
  subtitle,
  ctaHref,
  ctaLabel,
}: {
  title: React.ReactNode;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
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

    let disposed = false;
    let cleanup = () => {};

    // matter-js is loaded lazily so it only ships with the page that uses it.
    // It is a CommonJS/UMD module: through the bundler's interop the whole API
    // lands under `.default`, so fall back to that before destructuring.
    import("matter-js").then((mod) => {
      if (disposed || !stage) return;
      const Matter = (mod as unknown as { default?: typeof mod }).default ?? mod;
      const { Engine, Bodies, Composite, Events, Body } = Matter;

      const palette = document.documentElement.classList.contains("dark")
        ? PALETTE_DARK
        : PALETTE_LIGHT;

      let W = stage.clientWidth || 900;
      let H = stage.clientHeight || 320;

      const engine = Engine.create();
      engine.gravity.y = 0.5; // gentle, so the cursor can lift squares

      const T = 200; // wall thickness
      const wallOpts = { isStatic: true };
      let walls: Matter.Body[] = [];
      const buildWalls = () => {
        Composite.remove(engine.world, walls);
        walls = [
          Bodies.rectangle(W / 2, H + T / 2, W + 400, T, wallOpts),
          Bodies.rectangle(W / 2, -T / 2, W + 400, T, wallOpts),
          Bodies.rectangle(-T / 2, H / 2, T, H + 400, wallOpts),
          Bodies.rectangle(W + T / 2, H / 2, T, H + 400, wallOpts),
        ];
        Composite.add(engine.world, walls);
      };
      buildWalls();

      // Far fewer squares on phones so low-end devices don't lock up.
      const count = W < 500 ? 16 : W < 900 ? 40 : COUNT;
      const items: { el: HTMLDivElement; body: Matter.Body }[] = [];
      for (let i = 0; i < count; i++) {
        const el = document.createElement("div");
        el.className = "matter-sq";
        el.style.background = palette[i % palette.length];
        stage.appendChild(el);
        const x = SIZE + Math.random() * Math.max(1, W - 2 * SIZE);
        const y = SIZE + Math.random() * Math.max(1, H - 3 * SIZE);
        const body = Bodies.rectangle(x, y, SIZE, SIZE, {
          friction: 0.4,
          frictionStatic: 0.6,
          restitution: 0.05,
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
        Composite.add(engine.world, body);
        items.push({ el, body });
      }

      // Cursor tracked on the window and mapped into the stage, so squares react
      // even when the title/button sit on top of the layer.
      const cur = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };
      let lastPt: { x: number; y: number; t: number } | null = null;
      const onMove = (e: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const now = performance.now();
        if (lastPt) {
          const dt = Math.max(1, now - lastPt.t);
          cur.vx = (x - lastPt.x) / dt;
          cur.vy = (y - lastPt.y) / dt;
        }
        cur.x = x;
        cur.y = y;
        cur.active = true;
        lastPt = { x, y, t: now };
      };
      window.addEventListener("pointermove", onMove);

      Events.on(engine, "beforeUpdate", () => {
        const speed = Math.hypot(cur.vx, cur.vy);
        const sf = 0.5 + Math.min(speed * 1.2, 4);
        if (cur.active) {
          for (const { body } of items) {
            const dx = body.position.x - cur.x;
            const dy = body.position.y - cur.y;
            const d = Math.hypot(dx, dy) || 0.001;
            if (d < RADIUS) {
              const f = body.mass * ACCEL * (1 - d / RADIUS) * sf;
              Body.applyForce(body, body.position, { x: (dx / d) * f, y: (dy / d) * f });
            }
          }
        }
        cur.vx *= 0.85;
        cur.vy *= 0.85;
      });

      const paint = () => {
        for (const { el, body } of items) {
          el.style.transform = `translate(${body.position.x - SIZE / 2}px, ${
            body.position.y - SIZE / 2
          }px) rotate(${body.angle}rad)`;
        }
      };
      paint();

      let running = false;
      let prev = 0;
      let raf = 0;
      const frame = (now: number) => {
        Engine.update(engine, Math.min(now - prev, 32));
        prev = now;
        paint();
        raf = requestAnimationFrame(frame);
      };
      const startLoop = () => {
        if (!running) {
          running = true;
          prev = performance.now();
          raf = requestAnimationFrame(frame);
        }
      };
      const stopLoop = () => {
        running = false;
        cancelAnimationFrame(raf);
      };

      const io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? startLoop() : stopLoop()),
        { threshold: 0 },
      );
      io.observe(stage);

      const ro = new ResizeObserver(() => {
        const nw = stage.clientWidth;
        const nh = stage.clientHeight;
        if (nw && nh && (nw !== W || nh !== H)) {
          W = nw;
          H = nh;
          buildWalls();
        }
      });
      ro.observe(stage);

      cleanup = () => {
        stopLoop();
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
        for (const { el } of items) el.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
    // Rebuild the sim when the theme flips so the palette matches.
  }, [dark]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
      {/* Physics layer */}
      <div ref={stageRef} className="matter-stage absolute inset-0" aria-hidden="true" />

      {/* Foreground content sits above the squares */}
      <div className="relative z-10 px-6 py-16 md:py-20 text-center pointer-events-none">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-4 text-gray-500 text-[15px] max-w-md mx-auto">{subtitle}</p>
        )}
        {ctaHref && ctaLabel && (
          <div className="mt-8">
            <a
              href={ctaHref}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-85"
              style={{ backgroundColor: "#3e6b89" }}
            >
              {ctaLabel}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
