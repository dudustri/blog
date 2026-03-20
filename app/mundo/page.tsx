'use client';

import { useState, useEffect } from 'react';
import { countries } from '@/app/data/mundo';
import WorldGlobe from '@/app/components/WorldGlobe';

type Continent = { name: string; lat: number; lng: number };

const CONTINENTS: Continent[] = [
  { name: 'Europe',   lat: 54,  lng: 15  },
  { name: 'Asia',     lat: 34,  lng: 100 },
  { name: 'Americas', lat: 10,  lng: -80 },
  { name: 'Africa',   lat: 5,   lng: 20  },
  { name: 'Oceania',  lat: -25, lng: 135 },
];

// nextLabel = button shown at this level to go one step faster; null = already at max
const SPIN_LEVELS = [
  { speed: 1.5,  nextLabel: 'Faster'                  },
  { speed: 5,    nextLabel: 'Even Faster'              },
  { speed: 12,   nextLabel: 'Are You Nuts?!'           },
  { speed: 25,   nextLabel: "I'm Calling the Police"   },
  { speed: 55,   nextLabel: 'Intergalactical Police'    },
  { speed: 140,  nextLabel: 'Gravity Distortion'       },
  { speed: 400,  nextLabel: null                       }, // maximum insanity
];

const BTN = 'text-left text-sm font-semibold tracking-wide transition-colors text-white/35 hover:text-white/70';

export default function MundoPage() {
  const [selection, setSelection]   = useState<{ name: string; source: 'click' | 'random' } | null>(null);
  const [focusTarget, setFocusTarget] = useState<Continent | null>(null);
  const [spinLevel, setSpinLevel]     = useState(0);
  const [pickNonce, setPickNonce]     = useState(0);

  const selectedColor = selection?.source === 'random'
    ? 'rgba(168, 85, 247, 0.75)'   // purple — Where Next?
    : 'rgba(59, 130, 246, 0.75)';  // blue   — manual click

  useEffect(() => {
    const prevBg = document.body.style.background;
    document.body.style.background = '#000005';
    return () => { document.body.style.background = prevBg; };
  }, []);

  function selectContinent(c: Continent) {
    setFocusTarget(prev => (prev?.name === c.name ? null : c));
    setSpinLevel(0);
  }

  function handlePickedRandom({ name, lat, lng }: { name: string; lat: number; lng: number }) {
    setSelection({ name, source: 'random' });
    setFocusTarget({ name, lat, lng });
    setSpinLevel(0);
  }

  const spinning = focusTarget === null;

  return (
    <div
      className="fixed inset-0 z-0"
      style={{ background: 'radial-gradient(ellipse at center, #0d0d2b 0%, #000005 100%)' }}
    >
      <WorldGlobe
        visitedCountries={countries}
        selectedCountry={selection?.name ?? null}
        selectedCountryColor={selectedColor}
        spinSpeed={SPIN_LEVELS[spinLevel].speed}
        pickRandomTrigger={pickNonce}
        onCountryClick={(name) => setSelection(name ? { name, source: 'click' } : null)}
        onPickedRandom={handlePickedRandom}
        focusTarget={focusTarget}
      />

      {/* Continent navigation — left side, vertically centred */}
      <nav className="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
        {CONTINENTS.map(c => (
          <button
            key={c.name}
            onClick={() => selectContinent(c)}
            className={`${BTN} ${focusTarget?.name === c.name ? '!text-white' : ''}`}
          >
            {c.name}
          </button>
        ))}

        <div className="border-t border-white/15 pt-2 mt-1 flex flex-col gap-3">
          {spinning ? (
            <>
              {/* Escalating speed button — hidden once at max */}
              {SPIN_LEVELS[spinLevel].nextLabel && (
                <button onClick={() => setSpinLevel(l => l + 1)} className={BTN}>
                  {SPIN_LEVELS[spinLevel].nextLabel}
                </button>
              )}
              {/* Calm Down only appears after "Are You Nuts?!" (level 3+) */}
              {spinLevel >= 3 && (
                <button onClick={() => setSpinLevel(0)} className={BTN}>
                  Calm Down Dude
                </button>
              )}
            </>
          ) : (
            <button onClick={() => setFocusTarget(null)} className={BTN}>
              Spin
            </button>
          )}
        </div>

        {/* Where Next — only unlocked at max spin speed */}
        {spinning && spinLevel === SPIN_LEVELS.length - 1 && (
          <div className="border-t border-white/15 pt-2 mt-1">
            <button onClick={() => setPickNonce(n => n + 1)} className={BTN}>
              Where Next?
            </button>
          </div>
        )}
      </nav>

      {/* Country label — always visible, "Mundo" until a country is selected */}
      <div className="absolute bottom-20 right-6 z-10 pointer-events-none">
        <span className="text-3xl font-bold tracking-tight text-white">
          {selection?.name ?? 'Mundo'}
        </span>
      </div>
    </div>
  );
}
