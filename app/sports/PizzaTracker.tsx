"use client";

import { useEffect, useRef, useState } from "react";
import {
  caloriesTimeline,
  pizzaMilestones,
  filterActivities,
  PIZZA_KCAL,
  type Aggregation,
  type TimelinePoint,
  type PizzaMilestone,
} from "@/app/data/activities";

// --- scene constants ---------------------------------------------------------
const BAR_W = 0.55;
const BAR_DEPTH = 0.55;
const SPACING = 0.95;
const MAX_HEIGHT = 6; // world height of the tallest (final) cumulative bar
const PER_DAY_MAX = 0.45; // seconds a single bar takes to rise
const REVEAL_CAP = 6; // total reveal never runs longer than this many seconds
const REVEAL_DELAY = 0.35; // beat before the animation kicks off

type ThreeNS = typeof import("three");

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// An emoji or short string baked into a transparent canvas texture for sprites.
function makeEmojiTexture(THREE: ThreeNS, emoji: string, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${Math.floor(size * 0.8)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// A short text label (e.g. a month shortcut) on a wide transparent texture.
function makeLabelTexture(
  THREE: ThreeNS,
  text: string,
  color = "#9ca3af",
  fontSize = 56,
) {
  const w = 256;
  const h = 128;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

type Props = {
  aggregation: Aggregation;
  year: number | "all";
  month: number | "all";
};

export default function PizzaTracker({ aggregation, year, month }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  // Lets the Replay button restart the reveal without rebuilding the scene.
  const replayRef = useRef<() => void>(() => {});
  // Lets the Collect button sweep the resting pizzas into a single stack.
  const collectRef = useRef<() => void>(() => {});
  // Lets the Splash button fling the collected pizzas back out at random.
  // The argument scales the throw strength (Ultra Splash throws 3× harder).
  const splashRef = useRef<(power?: number) => void>(() => {});
  const [collected, setCollected] = useState(false);
  // Rare (15%) rainbow "Ultra Splash" unlocked when collecting.
  const [ultra, setUltra] = useState(false);
  const [stats, setStats] = useState({ totalKcal: 0, pizzas: 0, empty: false });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Recompute the timeline for the current filters/aggregation.
    const list = filterActivities(year, month);
    const POINTS: TimelinePoint[] = caloriesTimeline(list, aggregation);
    const MILESTONES: PizzaMilestone[] = pizzaMilestones(POINTS);
    const totalKcal = POINTS.length ? POINTS[POINTS.length - 1].cumulative : 0;
    setStats({ totalKcal, pizzas: MILESTONES.length, empty: POINTS.length === 0 });
    setCollected(false); // a fresh scene starts uncollected
    setUltra(false);
    if (POINTS.length === 0) return;

    // Multiple calendar years in view → disambiguate month labels with a year.
    const multiYear =
      new Set(POINTS.map((p) => p.key.slice(0, 4))).size > 1;

    let animId = 0;
    let mounted = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderer: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let controls: any;
    let cleanupResize: (() => void) | undefined;

    Promise.all([
      import("three"),
      import("three/examples/jsm/controls/OrbitControls.js"),
    ]).then(([THREE, { OrbitControls }]) => {
      if (!mounted) return;

      const n = POINTS.length;
      const maxCumulative = POINTS[n - 1].cumulative || 1;
      const heightScale = MAX_HEIGHT / maxCumulative;
      const perDay = Math.min(PER_DAY_MAX, REVEAL_CAP / n);
      const spanX = n * SPACING;
      const xOf = (i: number) => (i - (n - 1) / 2) * SPACING;

      const w = container.clientWidth;
      const h = container.clientHeight || 420;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const FOV = 45;
      const camera = new THREE.PerspectiveCamera(FOV, w / h, 0.1, 1000);

      // Frame the whole plot — its full width and tallest bar — so it reads the
      // same whether there are 3 bars or 300. Bars are normalised so the tallest
      // is always MAX_HEIGHT; we just need to back the camera off enough to fit
      // the wider of (plot width, plot height) for the current aspect ratio.
      const fov = (FOV * Math.PI) / 180;
      const HEADROOM = 2.4; // space above bars for counters / flying pizzas
      const topY = MAX_HEIGHT + HEADROOM;
      const botY = -0.9; // month labels sit just below the floor
      const contentH = topY - botY;
      const contentW = spanX + 2.5; // margin for the end bars + their counters
      const footprintDepth = Math.max(BAR_DEPTH, 6); // pizzas land/stack in front
      const targetVec = new THREE.Vector3(0, (topY + botY) / 2, 0);
      const fitRadius = (aspect: number) => {
        const distH = contentH / 2 / Math.tan(fov / 2);
        const distW = contentW / 2 / (Math.tan(fov / 2) * aspect);
        return Math.max(distH, distW) * 1.18 + footprintDepth * 0.5;
      };
      const camDir = new THREE.Vector3(0.2, 0.5, 1).normalize();
      const initialRadius = fitRadius(w / h);
      camera.position.copy(targetVec).addScaledVector(camDir, initialRadius);

      scene.add(new THREE.AmbientLight(0xffffff, 1.1));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(6, 12, 8);
      scene.add(key);

      // Faint grid so the bars read as a "plot" rather than floating boxes.
      const GRID_SIZE = spanX + 4;
      // Pizzas are kept inside this half-extent so a splash stays on the plot.
      const GRID_HALF = GRID_SIZE / 2 - 0.45;
      const grid = new THREE.GridHelper(
        GRID_SIZE,
        Math.round(spanX) + 4,
        0xd8d8d8,
        0xececec,
      );
      const gridMat = grid.material as { transparent: boolean; opacity: number };
      gridMat.transparent = true;
      gridMat.opacity = 0.7;
      scene.add(grid);

      // One bar per bucket. A unit box is scaled on Y to animate growth.
      // MeshBasicMaterial keeps the bar's colour identical to the flat swatches
      // used in the Activities list (no lighting to dull it). Buckets with more
      // than one sport get the full colour list so the bar can cycle them.
      const barGeo = new THREE.BoxGeometry(BAR_W, 1, BAR_DEPTH);
      const bars = POINTS.map((d, i) => {
        const colors = d.accents.map((c) => new THREE.Color(c));
        const mat = new THREE.MeshBasicMaterial({ color: colors[0] });
        const mesh = new THREE.Mesh(barGeo, mat);
        mesh.position.x = xOf(i);
        scene.add(mesh);
        return { mesh, targetH: d.cumulative * heightScale, colors };
      });

      // Per-bar legend under each bar. Daily view labels every day as DD/MM
      // (numeric day/month); monthly view shows the month shortcut (plus a
      // year suffix when more than one year is in view).
      POINTS.forEach((d, i) => {
        const text =
          aggregation === "daily"
            ? `${d.key.slice(8, 10)}/${d.key.slice(5, 7)}` // DD/MM
            : multiYear
              ? `${d.monthShort} '${d.key.slice(2, 4)}`
              : d.monthShort;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: makeLabelTexture(THREE, text),
            transparent: true,
            depthTest: false,
          }),
        );
        sprite.position.set(xOf(i), -0.55, BAR_DEPTH);
        sprite.scale.set(1.4, 0.7, 1);
        scene.add(sprite);
      });

      // How many pizzas were completed in each bucket (day or month).
      const pizzasPerPoint = new Array(POINTS.length).fill(0);
      for (const m of MILESTONES) pizzasPerPoint[m.pointIndex]++;

      // A counter that pops above a bar once that bucket's pizzas have rained.
      const counters = POINTS.flatMap((d, i) => {
        const count = pizzasPerPoint[i];
        if (count <= 0) return [];
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: makeLabelTexture(THREE, `🍕×${count}`, "#b45309", 50),
            transparent: true,
            depthTest: false,
          }),
        );
        sprite.position.set(xOf(i), d.cumulative * heightScale + 0.75, BAR_DEPTH);
        sprite.scale.set(1.7, 0.85, 1);
        sprite.material.opacity = 0;
        scene.add(sprite);
        return [{ sprite, pointIndex: i }];
      });

      // Pizza rain: one pizza sprite per earned pizza, so the rain's density
      // tracks how many pizzas were earned. Each one bursts out of its bar,
      // falls under gravity and bounces — then rests on the floor for good
      // (no fade / recycle). (Modelled on Platane's emitter.)
      const pizzaTex = makeEmojiTexture(THREE, "🍕");
      const GRAVITY = -16; // world units / s²

      type Particle = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sprite: any;
        vx: number;
        vy: number;
        vz: number;
        size: number;
        active: boolean;
        resting: boolean;
        tx: number; // collect target
        ty: number;
        tz: number;
      };

      // One pool slot per milestone — the floor ends up holding exactly that
      // many pizzas.
      const particles: Particle[] = MILESTONES.map(() => {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: pizzaTex,
            transparent: true,
            depthWrite: false,
          }),
        );
        sprite.scale.setScalar(0.0001);
        sprite.visible = false;
        scene.add(sprite);
        return {
          sprite, vx: 0, vy: 0, vz: 0,
          size: 0, active: false, resting: false, tx: 0, ty: 0, tz: 0,
        };
      });

      const spawnPizza = (slot: number, x: number, y: number, z: number) => {
        const p = particles[slot];
        const size = 0.34 + Math.random() * 0.3;
        p.size = size;
        p.active = true;
        p.resting = false;
        // Fling upward + outward, gravity does the rest.
        p.vx = (Math.random() - 0.5) * 4;
        p.vy = 3 + Math.random() * 4;
        p.vz = (Math.random() - 0.5) * 4;
        p.sprite.position.set(x, y, z);
        p.sprite.scale.setScalar(size);
        p.sprite.material.opacity = 1;
        p.sprite.material.rotation = Math.random() * Math.PI * 2;
        p.sprite.visible = true;
      };

      // Track which milestones have already burst in the current reveal pass.
      const emitted = new Array(MILESTONES.length).fill(false);
      const resetParticles = () => {
        emitted.fill(false);
        collecting = false;
        for (const p of particles) {
          p.active = false;
          p.resting = false;
          p.sprite.visible = false;
        }
      };

      // Sweep every spawned pizza into one neat stack at the front-centre.
      let collecting = false;
      const STACK_X = 0;
      const STACK_Z = BAR_DEPTH / 2 + 2.6;
      collectRef.current = () => {
        collecting = true;
        let k = 0;
        for (const p of particles) {
          if (!p.active) continue;
          p.resting = false; // let it travel to the stack
          p.tx = STACK_X;
          p.tz = STACK_Z;
          p.ty = p.size * 0.45 + k * 0.16; // pile upward
          k++;
        }
      };

      // Blast the (usually stacked) pizzas back out with random velocities so
      // they scatter and bounce across the floor again.
      splashRef.current = (power = 1) => {
        collecting = false;
        for (const p of particles) {
          if (!p.active) continue;
          p.resting = false;
          p.vx = (Math.random() - 0.5) * 9 * power;
          p.vy = (4 + Math.random() * 6) * power;
          p.vz = (Math.random() - 0.5) * 9 * power;
        }
      };

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.minDistance = initialRadius * 0.45;
      controls.maxDistance = initialRadius * 2.5;
      controls.target.copy(targetVec);

      let startTime = performance.now();
      let lastTime = startTime;
      replayRef.current = () => {
        startTime = performance.now();
        lastTime = startTime;
        resetParticles();
      };

      const onResize = () => {
        const nw = container.clientWidth;
        const nh = container.clientHeight || 420;
        if (!nw || !nh) return;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
        // Re-fit distance for the new aspect, keeping the current orbit angle.
        const r = fitRadius(nw / nh);
        const offset = camera.position.clone().sub(targetVec).setLength(r);
        camera.position.copy(targetVec).add(offset);
        controls.minDistance = r * 0.45;
        controls.maxDistance = r * 2.5;
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(container);
      window.addEventListener("resize", onResize);
      cleanupResize = () => {
        ro.disconnect();
        window.removeEventListener("resize", onResize);
      };

      const animate = () => {
        if (!mounted) return;
        animId = requestAnimationFrame(animate);

        const now = performance.now();
        const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp tab-switch jumps
        lastTime = now;

        const elapsed = (now - startTime) / 1000;
        // Continuous "day cursor": bar i grows while the cursor sweeps past it.
        const cursor = Math.max(0, (elapsed - REVEAL_DELAY) / perDay);

        for (let i = 0; i < bars.length; i++) {
          const bar = bars[i];
          const hgt = bar.targetH * easeOutCubic(clamp01(cursor - i));
          bar.mesh.scale.y = Math.max(hgt, 0.0001);
          bar.mesh.position.y = hgt / 2;
          // Multi-sport day/month → smoothly cycle through its sports' colours.
          if (bar.colors.length > 1) {
            const phase =
              (elapsed * 0.5 + i * 0.15) % bar.colors.length; // ~0.5 colours/sec
            const c0 = Math.floor(phase);
            const c1 = (c0 + 1) % bar.colors.length;
            bar.mesh.material.color.lerpColors(
              bar.colors[c0],
              bar.colors[c1],
              phase - c0,
            );
          }
        }

        // Fling one pizza from a bar as its kcal threshold is reached.
        for (let i = 0; i < MILESTONES.length; i++) {
          if (emitted[i]) continue;
          const m = MILESTONES[i];
          if (cursor < m.pointIndex + 0.5) continue;
          emitted[i] = true;
          spawnPizza(
            i,
            xOf(m.pointIndex) + (Math.random() - 0.5) * 0.5,
            bars[m.pointIndex].targetH + 0.5,
            (Math.random() - 0.5) * BAR_DEPTH,
          );
        }

        // Reveal each bucket's pizza counter once its pizzas have rained down.
        for (const c of counters) {
          const t = clamp01((cursor - (c.pointIndex + 1.4)) / 0.5);
          c.sprite.material.opacity = t;
          c.sprite.scale.set(1.7 * t, 0.85 * t, 1);
        }

        const drag = Math.pow(0.986, dt * 60);
        if (collecting) {
          // Glide every pizza to its slot in the single stack.
          const ease = 1 - Math.pow(1 - 0.14, dt * 60);
          for (const p of particles) {
            if (!p.active) continue;
            const s = p.sprite.position;
            s.x += (p.tx - s.x) * ease;
            s.y += (p.ty - s.y) * ease;
            s.z += (p.tz - s.z) * ease;
            p.sprite.material.rotation += (0 - p.sprite.material.rotation) * ease;
          }
        } else {
          // Integrate particle physics: gravity, air drag, floor bounce. Pizzas
          // come to rest on the floor and stay there.
          for (const p of particles) {
            if (!p.active || p.resting) continue;
            p.vy += GRAVITY * dt;
            p.vx *= drag;
            p.vy *= drag;
            p.vz *= drag;
            const s = p.sprite.position;
            s.x += p.vx * dt;
            s.y += p.vy * dt;
            s.z += p.vz * dt;
            // Keep pizzas inside the plot — bounce off the grid edges.
            if (s.x > GRID_HALF) {
              s.x = GRID_HALF;
              p.vx = -p.vx * 0.5;
            } else if (s.x < -GRID_HALF) {
              s.x = -GRID_HALF;
              p.vx = -p.vx * 0.5;
            }
            if (s.z > GRID_HALF) {
              s.z = GRID_HALF;
              p.vz = -p.vz * 0.5;
            } else if (s.z < -GRID_HALF) {
              s.z = -GRID_HALF;
              p.vz = -p.vz * 0.5;
            }
            const floor = p.size * 0.45;
            if (s.y < floor) {
              s.y = floor;
              p.vy = -p.vy * 0.55; // bounce, losing energy
              p.vx *= 0.7;
              p.vz *= 0.7;
              if (Math.abs(p.vy) < 0.8) {
                p.vy = 0;
                p.resting = true;
              }
            }
          }
        }

        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    });

    return () => {
      mounted = false;
      cancelAnimationFrame(animId);
      cleanupResize?.();
      controls?.dispose();
      renderer?.dispose();
      renderer?.domElement?.remove();
    };
  }, [aggregation, year, month]);

  return (
    <div>
      <div
        ref={mountRef}
        className="relative w-full h-[420px] rounded-2xl overflow-hidden bg-gradient-to-b from-gray-50 to-white border border-gray-200"
      >
        {stats.empty && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            No activities in this range.
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap mt-3">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">
            {Math.round(stats.totalKcal).toLocaleString()} kcal
          </span>{" "}
          burned ·{" "}
          <span className="font-semibold text-gray-700">{stats.pizzas} 🍕</span>{" "}
          earned
          <span className="text-gray-400">
            {" "}
            (1 pizza = {PIZZA_KCAL.toLocaleString()} kcal)
          </span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (collected) {
                splashRef.current(ultra ? 3 : 1);
                setCollected(false);
                setUltra(false);
              } else {
                collectRef.current();
                setCollected(true);
                setUltra(Math.random() < 0.4); // rainbow unlock chance
              }
            }}
            disabled={stats.pizzas === 0}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
              collected && ultra
                ? "rainbow-btn"
                : "border-gray-200 text-gray-500 hover:text-black hover:border-gray-400 disabled:hover:text-gray-500 disabled:hover:border-gray-200"
            }`}
          >
            {collected ? (ultra ? "🌈 Ultra Splash" : "💥 Splash") : "🍕 Collect"}
          </button>
          <button
            onClick={() => {
              replayRef.current();
              setCollected(false);
              setUltra(false);
            }}
            className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:border-gray-400 transition-colors"
          >
            ↻ Replay
          </button>
        </div>
      </div>
    </div>
  );
}
