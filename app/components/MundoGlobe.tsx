'use client';

import { useEffect, useRef } from 'react';

const BASE        = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const GEOJSON_URL = `${BASE}/world_map_units.geojson`;
const EARTH_IMG   = `${BASE}/earth-night.jpg`;

const ALT_BASE  = 0.005;
const ALT_HOVER = 0.027;

// Natural Earth map units splits Belgium into regions — normalise them back to one country
const REGION_TO_COUNTRY: Record<string, string> = {
  'Flemish Region':          'Belgium',
  'Walloon Region':          'Belgium',
  'Brussels Capital Region': 'Belgium',
};

// Country cap colours — kept in one place so they stay in sync across all color callbacks
const COLOR_VISITED    = 'rgba(251, 113, 133, 0.55)';   // coral/rose — warm, places lived
const COLOR_WANT_TO_GO = 'rgba(167, 139, 250, 0.50)';  // soft violet — dreamy, aspirational
const COLOR_DEFAULT    = 'rgba(80, 85, 115, 0.50)';    // blue-grey — matches the space backdrop

type GeoFeature = {
  properties: { name: string; iso_a2: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: { type: string; coordinates: any };
};

function spanOf(f: GeoFeature): number {
  const { type, coordinates } = f.geometry;
  let points: number[][];
  if (type === 'Polygon') {
    points = coordinates[0] as number[][];
  } else {
    points = (coordinates as number[][][][]).flatMap(p => p.flatMap(r => r));
  }
  const lngs = points.map((c: number[]) => c[0]);
  const lats  = points.map((c: number[]) => c[1]);
  return Math.max(
    Math.max(...lngs) - Math.min(...lngs),
    Math.max(...lats) - Math.min(...lats),
  );
}

function centroidOf(f: GeoFeature): { lat: number; lng: number } {
  const { type, coordinates } = f.geometry;
  let ring: number[][];
  if (type === 'Polygon') {
    ring = coordinates[0] as number[][];
  } else {
    ring = (coordinates as number[][][][])
      .flatMap(p => p)
      .reduce((a, b) => (a.length >= b.length ? a : b));
  }
  const n = ring.length;
  const [sumLng, sumLat] = ring.reduce(
    ([al, ab]: number[], c: number[]) => [al + c[0], ab + c[1]],
    [0, 0]
  );
  return { lng: sumLng / n, lat: sumLat / n };
}

interface Props {
  visitedCountries: string[];
  wantToGoCountries?: string[];
  selectedCountry?: string | null;
  selectedCountryColor?: string;
  isRainbow?: boolean;
  spinSpeed?: number;
  pickRandomTrigger?: number;
  onCountryClick?: (name: string | null, iso: string | null) => void;
  onPickedRandom?: (pick: { name: string; lat: number; lng: number }) => void;
  focusTarget?: { lat: number; lng: number } | null;
}

export default function MundoGlobe({
  visitedCountries,
  wantToGoCountries = [],
  selectedCountry,
  selectedCountryColor = 'rgba(59, 130, 246, 0.75)',
  isRainbow = false,
  spinSpeed = 1.5,
  pickRandomTrigger,
  onCountryClick,
  onPickedRandom,
  focusTarget,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  const onClickRef        = useRef(onCountryClick);
  const onPickedRandomRef = useRef(onPickedRandom);
  const selectedColorRef  = useRef(selectedCountryColor);
  const isRainbowRef      = useRef(isRainbow);
  const rainbowHueRef     = useRef(0);
  const selectedRef       = useRef(selectedCountry ?? null);
  const visitedRef        = useRef(visitedCountries);
  const wantToGoRef       = useRef(wantToGoCountries);
  const featuresRef           = useRef<GeoFeature[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hoveredRef            = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef              = useRef<any>(null);
  // Set by pickRandomTrigger to tell focusTarget effect not to overwrite pendingFocusRef
  const randomPickPendingRef  = useRef(false);

  useEffect(() => { onClickRef.current        = onCountryClick; });
  useEffect(() => { onPickedRandomRef.current = onPickedRandom; });
  useEffect(() => { selectedColorRef.current  = selectedCountryColor; });
  useEffect(() => { isRainbowRef.current      = isRainbow; });
  useEffect(() => { selectedRef.current       = selectedCountry ?? null; });
  useEffect(() => { visitedRef.current        = visitedCountries; });
  useEffect(() => { wantToGoRef.current       = wantToGoCountries; });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cameraRef       = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef     = useRef<any>(null);
  const globeRRef       = useRef<number>(100);
  const pendingFocusRef = useRef<{ x: number; y: number; z: number } | null>(null);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotateSpeed = spinSpeed;
  }, [spinSpeed]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const visitedSet   = new Set(visitedRef.current);
    const wantToGoSet  = new Set(wantToGoRef.current);
    if (isRainbowRef.current) {
      // Kill the transition so three-globe can't lerp from purple → rainbow (that's the flash)
      g.polygonsTransitionDuration(0);
      const h = rainbowHueRef.current;
      g.polygonCapColor((d: object) => {
        const rawName = (d as GeoFeature).properties.name;
        const name    = REGION_TO_COUNTRY[rawName] ?? rawName;
        if (name === selectedRef.current) return `hsl(${h}, 100%, 60%)`;
        if (visitedSet.has(name))   return COLOR_VISITED;
        if (wantToGoSet.has(name))  return COLOR_WANT_TO_GO;
        return COLOR_DEFAULT;
      });
    } else {
      g.polygonsTransitionDuration(300);
      g.polygonCapColor((d: object) => {
        const rawName = (d as GeoFeature).properties.name;
        const name    = REGION_TO_COUNTRY[rawName] ?? rawName;
        if (name === selectedRef.current) return selectedColorRef.current;
        if (visitedSet.has(name))   return COLOR_VISITED;
        if (wantToGoSet.has(name))  return COLOR_WANT_TO_GO;
        return COLOR_DEFAULT;
      });
    }
    g.polygonAltitude((d: object) =>
      d === hoveredRef.current ||
      (REGION_TO_COUNTRY[(d as GeoFeature).properties.name] ?? (d as GeoFeature).properties.name) === selectedRef.current
        ? ALT_HOVER : ALT_BASE
    );
  }, [selectedCountry]);

  useEffect(() => {
    if (!pickRandomTrigger) return;
    const features = featuresRef.current;
    if (!features.length) return;
    const f = features[Math.floor(Math.random() * features.length)];
    const { lat, lng } = centroidOf(f);
    const name = f.properties.name;

    // Stop spin immediately and flush residual rotational velocity.
    // OrbitControls stores accumulated delta in sphericalDelta; at 400 RPM it's large
    // and decays slowly with dampingFactor=0.1 (~40 frames). Disabling damping for one
    // update() call zeros it out instantly. The camera jerk is overridden by the lerp below.
    const c = controlsRef.current;
    if (c) {
      c.autoRotate = false;
      c.enableDamping = false;
      c.update();
      c.enableDamping = true;
    }

    // Smaller countries get a closer camera — span < 2° → 1.2×, span > 60° → 3.5×
    const span  = spanOf(f);
    const t     = Math.min(1, Math.max(0, span / 60));
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (90 - lng) * Math.PI / 180;
    const r     = globeRRef.current * (1.2 + t * 2.3);
    randomPickPendingRef.current = true; // tell focusTarget effect not to overwrite this
    pendingFocusRef.current = {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi),
      z: r * Math.sin(phi) * Math.sin(theta),
    };

    onPickedRandomRef.current?.({ name, lat, lng });
  }, [pickRandomTrigger]);

  useEffect(() => {
    if (focusTarget === undefined) return;
    if (!focusTarget) {
      randomPickPendingRef.current = false;
      pendingFocusRef.current = null;
      if (controlsRef.current) controlsRef.current.autoRotate = true;
      return;
    }
    // pickRandomTrigger already computed a size-aware pendingFocusRef — don't overwrite it
    if (randomPickPendingRef.current) {
      randomPickPendingRef.current = false;
      if (controlsRef.current) controlsRef.current.autoRotate = false;
      return;
    }
    const { lat, lng } = focusTarget;
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (90 - lng) * Math.PI / 180;
    const r     = globeRRef.current * 3.5;
    pendingFocusRef.current = {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi),
      z: r * Math.sin(phi) * Math.sin(theta),
    };
    if (controlsRef.current) controlsRef.current.autoRotate = false;
  }, [focusTarget]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderer: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let controls: any;
    let mounted = true;
    let resizeCleanup: (() => void) | undefined;
    let eventsCleanup: (() => void) | undefined;

    Promise.all([
      import('three'),
      import('three/examples/jsm/controls/OrbitControls.js'),
      import('three-globe'),
    ]).then(([THREE, { OrbitControls }, { default: ThreeGlobe }]) => {
      if (!mounted) return;

      const w = container.clientWidth;
      const h = container.clientHeight || window.innerHeight;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
      cameraRef.current = camera;

scene.add(new THREE.AmbientLight(0xffffff, Math.PI * 0.55));
      const dirLight = new THREE.DirectionalLight(0xffffff, Math.PI * 0.55);
      dirLight.position.set(5, 3, 5);
      scene.add(dirLight);

      const globe = new ThreeGlobe({ waitForGlobeReady: true })
        .globeImageUrl(EARTH_IMG)
        .polygonAltitude(ALT_BASE)
        .polygonSideColor(() => 'rgba(0, 80, 0, 0.15)')
        .polygonStrokeColor(() => '#111')
        .polygonsTransitionDuration(300);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mat = globe.globeMaterial() as any;
      if (mat.shininess !== undefined) mat.shininess = 0;
      if (mat.specular) mat.specular.set(0x000000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scene.add(globe as any);
      globeRef.current = globe;

      const globeR = globe.getGlobeRadius();
      globeRRef.current = globeR;
      camera.position.z = globeR * 4.5;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping   = true;
      controls.dampingFactor   = 0.1;
      controls.rotateSpeed     = 0.8;
      controls.zoomSpeed       = 0.5;
      controls.enablePan       = false;
      controls.autoRotate      = true;
      controls.autoRotateSpeed = 1.5;
      controls.minDistance     = globeR * 1.1;
      controls.maxDistance     = globeR * 12;
      controlsRef.current = controls;

      controls.addEventListener('start', () => { pendingFocusRef.current = null; });

      const visited  = new Set(visitedCountries);
      const wantToGo = new Set(wantToGoCountries);

      fetch(GEOJSON_URL)
        .then(r => r.json())
        .then(({ features }: { features: GeoFeature[] }) => {
          if (!mounted) return;

          const filtered = features.filter(f => f.properties.iso_a2 !== 'AQ');
          featuresRef.current = filtered;

          globe
            .polygonsData(filtered)
            .polygonCapColor((d: object) => {
              const rawName = (d as GeoFeature).properties.name;
        const name    = REGION_TO_COUNTRY[rawName] ?? rawName;
              if (name === selectedRef.current) return selectedColorRef.current;
              if (visited.has(name))   return COLOR_VISITED;
              if (wantToGo.has(name))  return COLOR_WANT_TO_GO;
              return COLOR_DEFAULT;
            });

          const raycaster = new THREE.Raycaster();
          const mouse     = new THREE.Vector2();

          const altFn = (d: object) =>
            d === hoveredRef.current ||
            (REGION_TO_COUNTRY[(d as GeoFeature).properties.name] ?? (d as GeoFeature).properties.name) === selectedRef.current
              ? ALT_HOVER : ALT_BASE;

          // Raycast against the globe, collecting ALL polygon hits then picking the
          // smallest one by geographic span. This ensures small countries (Luxembourg,
          // Vatican, Monaco…) win over large neighbours whose meshes may overlap them.
          function featureAt(e: MouseEvent): GeoFeature | null {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
            mouse.y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const { x: cx, y: cy, z: cz } = camera.position;

            const candidates: GeoFeature[] = [];

            for (const hit of raycaster.intersectObjects([globe as any], true)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let obj: any = hit.object;
              while (obj && obj.__globeObjType === undefined) obj = obj.parent;

              if (!obj) continue;
              if (obj.__globeObjType !== 'polygon') break;    // globe surface hit first — ocean

              const { x, y, z } = hit.point;
              if (x * cx + y * cy + z * cz < 0) break;       // far-side polygon — stop

              const f = obj.__data?.data as GeoFeature | undefined;
              if (f) candidates.push(f);
            }

            if (!candidates.length) return null;
            // Return the geographically smallest hit — wins over large overlapping neighbours
            return candidates.reduce((best, f) => spanOf(f) < spanOf(best) ? f : best);
          }

          const onMouseMove = (e: MouseEvent) => {
            const feature = featureAt(e);
            if (feature !== hoveredRef.current) {
              hoveredRef.current = feature;
              globe.polygonAltitude(altFn);
            }
          };

          const onClick = (e: MouseEvent) => {
            const feature = featureAt(e);
            const rawName = feature?.properties.name ?? null;
            const name    = rawName ? (REGION_TO_COUNTRY[rawName] ?? rawName) : null;
            onClickRef.current?.(name, feature?.properties.iso_a2 ?? null);
          };

          renderer.domElement.addEventListener('mousemove', onMouseMove);
          renderer.domElement.addEventListener('click', onClick);
          eventsCleanup = () => {
            renderer?.domElement?.removeEventListener('mousemove', onMouseMove);
            renderer?.domElement?.removeEventListener('click', onClick);
          };
        });

      const onResize = () => {
        const nw = container.clientWidth;
        const nh = container.clientHeight;
        if (!nw || !nh) return;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener('resize', onResize);
      resizeCleanup = () => window.removeEventListener('resize', onResize);

      const animate = () => {
        if (!mounted) return;
        animId = requestAnimationFrame(animate);

        // Animate rainbow colour every frame — including during camera flight
        if (isRainbowRef.current && globeRef.current) {
          rainbowHueRef.current = (rainbowHueRef.current + 1.2) % 360;
          const h = rainbowHueRef.current;
          const visitedSet  = new Set(visitedRef.current);
          const wantToGoSet = new Set(wantToGoRef.current);
          globeRef.current.polygonCapColor((d: object) => {
            const rawName = (d as GeoFeature).properties.name;
        const name    = REGION_TO_COUNTRY[rawName] ?? rawName;
            if (name === selectedRef.current) return `hsl(${h}, 100%, 60%)`;
            if (visitedSet.has(name))   return COLOR_VISITED;
            if (wantToGoSet.has(name))  return COLOR_WANT_TO_GO;
            return COLOR_DEFAULT;
          });
        }

        const target = pendingFocusRef.current;
        if (target) {
          const p = camera.position;
          p.x += (target.x - p.x) * 0.04;
          p.y += (target.y - p.y) * 0.04;
          p.z += (target.z - p.z) * 0.04;
          if ((p.x - target.x) ** 2 + (p.y - target.y) ** 2 + (p.z - target.z) ** 2 < 0.25) {
            p.set(target.x, target.y, target.z);
            pendingFocusRef.current = null;
          }
          camera.lookAt(0, 0, 0);
          renderer.render(scene, camera);
          return;
        }

        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    });

    return () => {
      mounted = false;
      cancelAnimationFrame(animId);
      resizeCleanup?.();
      eventsCleanup?.();
      controls?.dispose();
      renderer?.dispose();
      renderer?.domElement?.remove();
      cameraRef.current   = null;
      controlsRef.current = null;
      globeRef.current    = null;
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
