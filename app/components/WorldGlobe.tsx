'use client';

import { useEffect, useRef } from 'react';

const BASE       = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const GEOJSON_URL = `${BASE}/world_map_units.geojson`;
const EARTH_IMG   = `${BASE}/earth-night.jpg`;
const SKY_IMG     = `${BASE}/night-sky.png`;

const ALT_BASE  = 0.005;
const ALT_HOVER = 0.027;

type GeoFeature = {
  properties: { name: string; iso_a2: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: { type: string; coordinates: any };
};

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
  selectedCountry?: string | null;
  selectedCountryColor?: string;
  spinSpeed?: number;
  pickRandomTrigger?: number;
  onCountryClick?: (name: string | null) => void;
  onPickedRandom?: (pick: { name: string; lat: number; lng: number }) => void;
  focusTarget?: { lat: number; lng: number } | null;
}

export default function WorldGlobe({
  visitedCountries,
  selectedCountry,
  selectedCountryColor = 'rgba(59, 130, 246, 0.75)',
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
  const selectedRef       = useRef(selectedCountry ?? null);
  const visitedRef        = useRef(visitedCountries);
  const featuresRef       = useRef<GeoFeature[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hoveredRef        = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef          = useRef<any>(null);

  useEffect(() => { onClickRef.current        = onCountryClick; });
  useEffect(() => { onPickedRandomRef.current = onPickedRandom; });
  useEffect(() => { selectedColorRef.current  = selectedCountryColor; });
  useEffect(() => { selectedRef.current       = selectedCountry ?? null; });
  useEffect(() => { visitedRef.current        = visitedCountries; });

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
    const visitedSet = new Set(visitedRef.current);
    g.polygonCapColor((d: object) => {
      const name = (d as GeoFeature).properties.name;
      if (name === selectedRef.current) return selectedColorRef.current;
      return visitedSet.has(name) ? 'rgba(34, 197, 94, 0.55)' : 'rgba(120, 120, 120, 0.55)';
    });
    g.polygonAltitude((d: object) =>
      d === hoveredRef.current ||
      (d as GeoFeature).properties.name === selectedRef.current
        ? ALT_HOVER : ALT_BASE
    );
  }, [selectedCountry]);

  useEffect(() => {
    if (!pickRandomTrigger) return;
    const features = featuresRef.current;
    if (!features.length) return;
    const f = features[Math.floor(Math.random() * features.length)];
    const { lat, lng } = centroidOf(f);
    onPickedRandomRef.current?.({ name: f.properties.name, lat, lng });
  }, [pickRandomTrigger]);

  useEffect(() => {
    if (focusTarget === undefined) return;
    if (!focusTarget) {
      pendingFocusRef.current = null;
      if (controlsRef.current) controlsRef.current.autoRotate = true;
      return;
    }
    const { lat, lng } = focusTarget;
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (90 - lng) * Math.PI / 180;
    const r     = globeRRef.current * 2.5;
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

      // Night-sky background sphere — full texture, dimmed to blend with CSS gradient
      const bgMat = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(SKY_IMG),
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.45,
      });
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(500, 64, 64), bgMat));

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
      // Start zoomed out so the full globe is visible with some breathing room
      camera.position.z = globeR * 7;

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

      const visited = new Set(visitedCountries);

      fetch(GEOJSON_URL)
        .then(r => r.json())
        .then(({ features }: { features: GeoFeature[] }) => {
          if (!mounted) return;

          const filtered = features.filter(f => f.properties.iso_a2 !== 'AQ');
          featuresRef.current = filtered;

          globe
            .polygonsData(filtered)
            .polygonCapColor((d: object) => {
              const name = (d as GeoFeature).properties.name;
              if (name === selectedRef.current) return selectedColorRef.current;
              return visited.has(name) ? 'rgba(34, 197, 94, 0.55)' : 'rgba(120, 120, 120, 0.55)';
            });

          const raycaster = new THREE.Raycaster();
          const mouse     = new THREE.Vector2();

          const altFn = (d: object) =>
            d === hoveredRef.current ||
            (d as GeoFeature).properties.name === selectedRef.current
              ? ALT_HOVER : ALT_BASE;

          // Raycast only against the globe object (excludes background sphere etc.).
          // Walk up the parent chain of each hit to find its __globeObjType:
          //   - 'polygon' → valid hit; check it's on the near side then return feature
          //   - anything else ('globe', 'atmosphere' …) → globe surface was hit first,
          //     meaning the click landed on ocean/sea — stop and return null.
          function featureAt(e: MouseEvent): GeoFeature | null {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
            mouse.y = ((e.clientY - rect.top)  / rect.height) * -2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const { x: cx, y: cy, z: cz } = camera.position;

            for (const hit of raycaster.intersectObjects([globe as any], true)) {
              // Walk up to the nearest ancestor that has __globeObjType
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let obj: any = hit.object;
              while (obj && obj.__globeObjType === undefined) obj = obj.parent;

              if (!obj) continue;                              // unknown — skip
              if (obj.__globeObjType !== 'polygon') break;    // globe sphere hit first — ocean

              const { x, y, z } = hit.point;
              if (x * cx + y * cy + z * cz < 0) break;       // far-side polygon — stop

              const f = obj.__data?.data as GeoFeature | undefined;
              if (f) return f;
            }
            return null;
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
            onClickRef.current?.(feature?.properties.name ?? null);
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
