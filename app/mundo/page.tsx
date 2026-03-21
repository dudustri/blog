'use client';

import { useState, useEffect } from 'react';
import { countries, wantToGoCountries } from '@/app/data/mundo';
import MundoGlobe from '@/app/components/MundoGlobe';

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

// Derive flag emoji from ISO 3166-1 alpha-2 code
function isoToFlag(iso: string): string {
  return [...iso.toUpperCase()]
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('');
}

// ISO codes for listed countries (needed for list display; clicked countries get iso from GeoJSON)
const NAME_ISO: Record<string, string> = {
  Brazil: 'BR', Denmark: 'DK', Italy: 'IT', Poland: 'PL', Portugal: 'PT',
  Norway: 'NO', Vietnam: 'VN', Indonesia: 'ID', Thailand: 'TH', Cambodia: 'KH',
  France: 'FR', Germany: 'DE', Lithuania: 'LT', Estonia: 'EE', Latvia: 'LV',
  Bulgaria: 'BG', Hungary: 'HU', Czechia: 'CZ', Austria: 'AT', Switzerland: 'CH',
  England: 'GB', Singapore: 'SG',
  Mexico: 'MX', Guatemala: 'GT', Kazakhstan: 'KZ', Georgia: 'GE', Japan: 'JP',
  Peru: 'PE', Bolivia: 'BO', Chile: 'CL', Argentina: 'AR', Mongolia: 'MN',
  Kyrgyzstan: 'KG', 'Faroe Islands': 'FO', Iceland: 'IS', Yemen: 'YE',
};

function flagFor(name: string, iso?: string | null): string {
  const code = iso ?? NAME_ISO[name];
  return code ? isoToFlag(code) : '';
}

export default function MundoPage() {
  const [selection, setSelection]     = useState<{ name: string; iso: string | null; source: 'click' | 'random' } | null>(null);
  const [focusTarget, setFocusTarget] = useState<Continent | null>(null);
  const [spinLevel, setSpinLevel]     = useState(0);
  const [pickNonce, setPickNonce]     = useState(0);
  const [openList, setOpenList]       = useState<'visited' | 'planning' | null>(null);

  const selectedColor = 'rgba(59, 130, 246, 0.75)';  // blue — manual click (rainbow handles random)

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
    setSelection({ name, iso: NAME_ISO[name] ?? null, source: 'random' });
    setFocusTarget({ name, lat, lng });
    setSpinLevel(0);
  }

  const spinning = focusTarget === null;

  return (
    <div
      className="fixed inset-0 z-0"
      style={{ background: 'radial-gradient(ellipse at center, #0d0d2b 0%, #000005 100%)' }}
    >
      <MundoGlobe
        visitedCountries={countries}
        wantToGoCountries={wantToGoCountries}
        selectedCountry={selection?.name ?? null}
        selectedCountryColor={selectedColor}
        isRainbow={selection?.source === 'random'}
        spinSpeed={SPIN_LEVELS[spinLevel].speed}
        pickRandomTrigger={pickNonce}
        onCountryClick={(name, iso) => {
          setSelection(prev => name && prev?.name !== name ? { name, iso, source: 'click' } : null);
          if (name) setOpenList(null);
        }}
        onPickedRandom={handlePickedRandom}
        focusTarget={focusTarget}
      />

      {/* Continent list — this element alone is vertically centred; it never changes size */}
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
      </nav>

      {/* Spin controls — anchored just below the continent list midpoint; grows downward only.
          top: 50% + half the continent-list height (5 × 1.25rem lines + 4 × 0.75rem gaps ≈ 9.25rem → half ≈ 4.7rem) */}
      <div className="absolute left-6 z-10 flex flex-col gap-2" style={{ top: 'calc(50% + 5rem)' }}>
        <div className="border-t border-white/15 w-14" />
        <div className="flex flex-col gap-3">
          {spinning ? (
            <>
              {SPIN_LEVELS[spinLevel].nextLabel && (
                <button onClick={() => setSpinLevel(l => l + 1)} className={BTN}>
                  {SPIN_LEVELS[spinLevel].nextLabel}
                </button>
              )}
              {spinLevel >= 3 && (
                <button onClick={() => setSpinLevel(0)} className={BTN}>
                  Calm Down Dude
                </button>
              )}
              {spinLevel === SPIN_LEVELS.length - 1 && (
                <div className="relative group flex items-center">
                  <button onClick={() => setPickNonce(n => n + 1)} className="text-left text-sm font-semibold tracking-wide rainbow-text">
                    Where Next?
                  </button>
                  <span className="absolute left-full ml-4 w-44 text-xs text-white/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none leading-snug">
                    wherever it lands, that&apos;s where you should go. this is called destiny, where the gambler and the traveller spirit essences made a baby and that baby is you right now. just do it!!
                  </span>
                </div>
              )}
            </>
          ) : (
            <button onClick={() => setFocusTarget(null)} className={BTN}>
              Spin
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-20 left-6 z-10 flex flex-col gap-1.5">
        {([
          { color: 'rgba(34, 197, 94, 0.42)',   label: 'Visited',  key: 'visited'  as const },
          { color: 'rgba(250, 204, 21, 0.42)',  label: 'Planning', key: 'planning' as const },
          { color: 'rgba(120, 120, 120, 0.38)', label: 'Not yet',  key: null                },
        ]).map(({ color, label, key }) => (
          <button
            key={label}
            disabled={!key}
            onClick={() => { setOpenList(prev => prev === key ? null : key); setSelection(null); }}
            className="flex items-center gap-2 group disabled:pointer-events-none"
          >
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color, border: '1px solid rgba(255,255,255,0.15)' }} />
            <span className={`text-xs tracking-wide transition-colors ${key ? (openList === key ? 'text-white/70' : 'text-white/40 group-hover:text-white/70') : 'text-white/25'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Country label / list panel — bottom right */}
      <div className="absolute bottom-20 right-6 z-10 flex flex-col items-end gap-1 pointer-events-none">
        {openList ? (
          <>
            <span className="text-xs text-white/30 tracking-wide mb-1">
              {openList === 'visited' ? 'Visited' : 'Planning'}
            </span>
            {(openList === 'visited' ? [...countries] : [...wantToGoCountries])
              .sort()
              .map(c => (
                <span key={c} className="text-sm font-semibold tracking-wide text-white/60">
                  {flagFor(c) && <span className="mr-1.5">{flagFor(c)}</span>}{c}
                </span>
              ))}
          </>
        ) : (
          <span className="text-3xl font-bold tracking-tight text-white">
            {selection?.name
              ? <>{flagFor(selection.name, selection.iso) && <span className="mr-2">{flagFor(selection.name, selection.iso)}</span>}{selection.name}</>
              : 'Mundo'}
          </span>
        )}
      </div>
    </div>
  );
}
