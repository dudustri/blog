"use client";

import { useEffect, useRef, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// physics layer of small squares: real Matter.js rigid bodies with gentle
// gravity, cursor acts as a force field pushing nearby squares away, scaled
// by pointer speed. runs only while on screen. drop as an absolute layer
// inside a `position: relative` container. `count` overrides default, which
// scales down on small screens so low-end phones do not lock up.
// `cast` swaps the squares for ragnarok sprites, same physics

const SIZE = 32; // square edge, px
const PORING_SCALE = 2; // px per cell, keeps the Poring near the square footprint

// the Poring, same pixel grid and colours the ragnaduds site draws it from
const PORING_ROWS = [
  "....kkkkkk....", "..kkppppppkk..", ".kppppppplllk.", ".kpppppppllppk",
  "kppppppppppppk", "kppekppppekppk", "kppekppppekppk", "kpppppprrppppk",
  "kppppppppppppk", ".kpppppppppppk", "..kkkkkkkkkkk.",
];
const PORING_PALETTE: Record<string, string> = {
  k: "#2a1420", p: "#ff8fb1", l: "#ffd1df", e: "#1b1b1b", r: "#c23b5a",
};
const PORING_COLS = PORING_ROWS[0].length;

function poringDataUrl(scale: number) {
  const cv = document.createElement("canvas");
  cv.width = PORING_COLS * scale;
  cv.height = PORING_ROWS.length * scale;
  const ctx = cv.getContext("2d");
  PORING_ROWS.forEach((row, y) =>
    [...row].forEach((cell, x) => {
      const color = PORING_PALETTE[cell];
      if (!ctx || !color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }),
  );
  return cv.toDataURL();
}

type CastSpec = { pixel: true; scale: number } | { src: string; w: number; h: number };

// sprite sizes are close to the square footprint, otherwise they pile up
// instead of spreading out along the floor
const CAST: Record<string, CastSpec> = {
  poring: { pixel: true, scale: PORING_SCALE },
  duds: { src: `${BASE}/images/ragnaduds-peco-duds.png`, w: 40, h: 67 },
  orc: { src: `${BASE}/images/ragnaduds-orc.png`, w: 36, h: 53 },
};

export type CastMember = { name: keyof typeof CAST; count: number };
const RADIUS = 100; // cursor repel radius, px, clamped to the stage below
const ACCEL = 0.01; // cursor push strength
const COUNT = 60;

// visible slate greys + brand accent, picked to read on a bg-gray-50 card
const PALETTE_LIGHT = ["#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#3e6b89"];
const PALETTE_DARK = ["#3a3a3a", "#474747", "#565656", "#6b6b6b", "#4d7ea0"];

export default function MatterBackground({
  count,
  cast,
}: {
  count?: number;
  cast?: CastMember[];
}) {
  // serialized so a fresh array literal each render does not rebuild the sim
  const castKey = JSON.stringify(cast ?? null);
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

    // matter-js is loaded lazily so it only ships with the page using it.
    // CommonJS/UMD module: through bundler interop the whole API lands under
    // `.default`, so fall back to that before destructuring
    import("matter-js").then((mod) => {
      if (disposed || !stage) return;
      const Matter = (mod as unknown as { default?: typeof mod }).default ?? mod;
      const { Engine, Bodies, Composite, Events, Body } = Matter;

      const palette = document.documentElement.classList.contains("dark")
        ? PALETTE_DARK
        : PALETTE_LIGHT;

      // one entry per body, so sizes can differ inside the same stage
      const members: { src: string; w: number; h: number; pixel: boolean }[] = [];
      for (const c of (JSON.parse(castKey) as CastMember[] | null) ?? []) {
        const spec = CAST[c.name];
        if (!spec) continue;
        const pixel = "pixel" in spec;
        const src = "pixel" in spec ? poringDataUrl(spec.scale) : spec.src;
        const w = "pixel" in spec ? PORING_COLS * spec.scale : spec.w;
        const h = "pixel" in spec ? PORING_ROWS.length * spec.scale : spec.h;
        for (let i = 0; i < c.count; i++) members.push({ src, w, h, pixel });
      }

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

      // explicit count when given, otherwise scale down on small screens
      const n = members.length || count || (W < 500 ? 16 : W < 900 ? 40 : COUNT);
      const items: { el: HTMLElement; body: Matter.Body; w: number; h: number }[] = [];
      for (let i = 0; i < n; i++) {
        const m = members[i];
        const w = m ? m.w : SIZE;
        const h = m ? m.h : SIZE;
        let el: HTMLElement;
        if (m) {
          const img = document.createElement("img");
          img.src = m.src;
          img.alt = "";
          img.className = m.pixel ? "matter-sprite pixel" : "matter-sprite";
          img.style.width = `${w}px`;
          img.style.height = `${h}px`;
          el = img;
        } else {
          el = document.createElement("div");
          el.className = "matter-sq";
          el.style.background = palette[i % palette.length];
        }
        stage.appendChild(el);
        const x = w + Math.random() * Math.max(1, W - 2 * w);
        const y = h + Math.random() * Math.max(1, H - 3 * h);
        const body = Bodies.rectangle(x, y, w, h, {
          friction: 0.4,
          frictionStatic: 0.6,
          restitution: 0.05,
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
        Composite.add(engine.world, body);
        items.push({ el, body, w, h });
      }

      // cursor tracked on window and mapped into stage, so squares react
      // even when content sits on top of the layer
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
        const radius = Math.min(RADIUS, H * 0.6);
        if (cur.active) {
          for (const { body } of items) {
            const dx = body.position.x - cur.x;
            const dy = body.position.y - cur.y;
            const d = Math.hypot(dx, dy) || 0.001;
            if (d < radius) {
              const f = body.mass * ACCEL * (1 - d / radius) * sf;
              Body.applyForce(body, body.position, { x: (dx / d) * f, y: (dy / d) * f });
            }
          }
        }
        cur.vx *= 0.85;
        cur.vy *= 0.85;
      });

      const paint = () => {
        for (const { el, body, w, h } of items) {
          el.style.transform = `translate(${body.position.x - w / 2}px, ${
            body.position.y - h / 2
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

      // walls move when the stage is measured late, so anything left outside
      // gets pulled back in, otherwise it stays trapped under the new floor
      const clampInside = () => {
        for (const { body, w, h } of items) {
          const x = Math.min(W - w / 2, Math.max(w / 2, body.position.x));
          const y = Math.min(H - h / 2, Math.max(h / 2, body.position.y));
          if (x !== body.position.x || y !== body.position.y) {
            Body.setPosition(body, { x, y });
            Body.setVelocity(body, { x: 0, y: 0 });
          }
        }
      };

      const ro = new ResizeObserver(() => {
        const nw = stage.clientWidth;
        const nh = stage.clientHeight;
        if (nw && nh && (nw !== W || nh !== H)) {
          W = nw;
          H = nh;
          buildWalls();
          clampInside();
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
    // rebuild sim when theme flips so palette matches
  }, [dark, count, castKey]);

  return <div ref={stageRef} className="matter-stage absolute inset-0" aria-hidden="true" />;
}
