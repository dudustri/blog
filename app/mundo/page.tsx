'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { countries, wantToGoCountries, COLOR_VISITED, COLOR_WANT_TO_GO, COLOR_DEFAULT, COLOR_SELECTED } from '@/app/data/mundo';
import MundoGlobe from '@/app/components/MundoGlobe';

type Continent = { name: string; lat: number; lng: number };
type GamePhase  = 'idle' | 'guessing' | 'correct' | 'wrong' | 'ended';

const CONTINENTS: Continent[] = [
  { name: 'Europe',   lat: 54,  lng: 15  },
  { name: 'Asia',     lat: 34,  lng: 100 },
  { name: 'Americas', lat: 10,  lng: -80 },
  { name: 'Africa',   lat: 5,   lng: 20  },
  { name: 'Oceania',  lat: -25, lng: 135 },
];

const SPIN_LEVELS = [
  { speed: 1.5,  nextLabel: 'Faster'                  },
  { speed: 5,    nextLabel: 'Even Faster'              },
  { speed: 12,   nextLabel: 'Are You Nuts?!'           },
  { speed: 25,   nextLabel: "I'm Calling the Police"   },
  { speed: 55,   nextLabel: 'Intergalactical Police'   },
  { speed: 140,  nextLabel: 'Gravity Distortion'       },
  { speed: 400,  nextLabel: null                       },
];

const BTN = 'text-left text-sm font-semibold tracking-wide transition-colors text-white/35 hover:text-white/70';

const VISITED_SORTED  = [...countries].sort();
const PLANNING_SORTED = [...wantToGoCountries].sort();

// Common aliases so guesses like "Czech Republic" or "USA" are accepted
const ALIASES: Record<string, string> = {
  'czech republic':          'czechia',
  'usa':                     'united states of america',
  'us':                      'united states of america',
  'united states':           'united states of america',
  'uk':                      'united kingdom',
  'britain':                 'united kingdom',
  'great britain':           'united kingdom',
  'russia':                  'russian federation',
  'south korea':             'republic of korea',
  'north korea':             "democratic people's republic of korea",
  'iran':                    'iran (islamic republic of)',
  'syria':                   'syrian arab republic',
  'taiwan':                  'taiwan, province of china',
  'bolivia':                 'plurinational state of bolivia',
  'tanzania':                'united republic of tanzania',
  'venezuela':               'bolivarian republic of venezuela',
  'moldova':                 'republic of moldova',
  'vietnam':                 'viet nam',
  'laos':                    "lao people's democratic republic",
  'palestine':               'state of palestine',
  'myanmar':                 'myanmar (burma)',
  'burma':                   'myanmar (burma)',
  'hong kong':               'hong kong s.a.r.',
  'macau':                   'macao s.a.r',
  'macao':                   'macao s.a.r',
  'dr congo':                'democratic republic of the congo',
  'drc':                     'democratic republic of the congo',
  'trinidad':                'trinidad and tobago',
  'st lucia':                'saint lucia',
  'st kitts':                'saint kitts and nevis',
  'st vincent':              'saint vincent and the grenadines',
  'uae':                     'united arab emirates',
  'czech':                   'czechia',
  'ivory coast':             "côte d'ivoire",
  "cote d'ivoire":           "côte d'ivoire",
};

function normalise(s: string): string {
  const lower = s.trim().toLowerCase();
  return ALIASES[lower] ?? lower;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i;
    for (let j = 1; j <= n; j++) {
      const val = a[i - 1] === b[j - 1] ? dp[j - 1] : 1 + Math.min(dp[j - 1], dp[j], prev);
      dp[j - 1] = prev;
      prev = val;
    }
    dp[n] = prev;
  }
  return dp[n];
}

// Returns true if the guess is close enough to the answer
function isCloseEnough(guess: string, answer: string): boolean {
  const g = normalise(guess);
  const a = normalise(answer);
  if (g === a) return true;
  // Substring match: "hong kong" inside "hong kong s.a.r." or "french guiana" ↔ "guiana"
  // Only match if the guess *contains* the answer (not the other way around),
  // e.g. typing "Republic of France" when answer is "France". We do NOT accept
  // a short guess that is merely a substring of a longer answer — that would
  // make "Guiana" pass for "French Guiana" while Guyana is a real country.
  if (g.includes(a)) return true;
  // Typo tolerance: 1 edit for short names (≥4 chars), 2 edits for longer ones (≥7 chars)
  const dist = levenshtein(g, a);
  const maxLen = Math.max(g.length, a.length);
  if (maxLen >= 7 && dist <= 2) return true;
  if (maxLen >= 4 && dist <= 1) return true;
  return false;
}

function fibScore(round: number): number {
  if (round <= 0) return 0;
  let a = 1, b = 1;
  for (let i = 2; i < round; i++) [a, b] = [b, a + b];
  return round === 1 ? 1 : b;
}

function isoToFlag(iso: string): string {
  // Only valid 2-letter alpha codes produce real flag emojis.
  // Natural Earth uses '-99' for disputed/unrecognised territories — skip those.
  if (!/^[A-Za-z]{2}$/.test(iso)) return '';
  return [...iso.toUpperCase()]
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('');
}

// NOTE: when adding a country to countries.json or wantToGo.json, add it here too (or to NAME_FLAG for regional flags)
const NAME_ISO: Record<string, string> = {
  Brazil: 'BR', Denmark: 'DK', Italy: 'IT', Poland: 'PL', Portugal: 'PT',
  Norway: 'NO', Vietnam: 'VN', Indonesia: 'ID', Thailand: 'TH', Cambodia: 'KH',
  France: 'FR', Germany: 'DE', Lithuania: 'LT', Estonia: 'EE', Latvia: 'LV',
  Bulgaria: 'BG', Hungary: 'HU', Czechia: 'CZ', Austria: 'AT', Switzerland: 'CH',
  Singapore: 'SG', Sweden: 'SE', Uruguay: 'UY', Mexico: 'MX', Guatemala: 'GT',
  Kazakhstan: 'KZ', Georgia: 'GE', Japan: 'JP', Peru: 'PE', Bolivia: 'BO',
  Chile: 'CL', Argentina: 'AR', Mongolia: 'MN', Kyrgyzstan: 'KG',
  'Faroe Islands': 'FO', Iceland: 'IS', Yemen: 'YE', Tanzania: 'TZ',
};

const NAME_FLAG: Record<string, string> = {
  // Regional flags (not in ISO 3166-1)
  England:  '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  // Disputed / unrecognised territories — Natural Earth gives these iso_a2 = '-99'
  // No universally accepted flag emoji exists for these
  Kosovo:            '🇽🇰',  // XK is widely supported despite not being ISO 3166-1
  Palestine:         '🇵🇸',
  'Western Sahara':  '🇪🇭',
  Taiwan:            '🇹🇼',
  Somaliland:        '🏴',
  'Northern Cyprus': '🏴',
  'Indian Ocean Territories': '🇮🇴',
};

function flagFor(name: string, iso?: string | null): string {
  if (NAME_FLAG[name]) return NAME_FLAG[name];
  const code = iso ?? NAME_ISO[name];
  return code ? isoToFlag(code) : '';
}

// ---------------------------------------------------------------------------
// Confetti
// ---------------------------------------------------------------------------
const CONFETTI_COLORS = ['#fb7185', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa', '#f97316', '#e879f9', '#2dd4bf'];

// shape: 0=square, 1=circle, 2=strip, 3=triangle
function confettiShape(shape: number, color: string, size: number) {
  if (shape === 1) return { borderRadius: '50%', background: color, width: size, height: size };
  if (shape === 2) return { borderRadius: '1px', background: color, width: size * 0.35, height: size * 1.8 };
  if (shape === 3) return {
    width: 0, height: 0, background: 'transparent',
    borderLeft: `${size * 0.5}px solid transparent`,
    borderRight: `${size * 0.5}px solid transparent`,
    borderBottom: `${size}px solid ${color}`,
  };
  return { borderRadius: '2px', background: color, width: size, height: size };
}

function Confetti() {
  const pieces = useRef(
    Array.from({ length: 120 }, (_, i) => {
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const size  = 5 + Math.random() * 9;
      const shape = Math.floor(Math.random() * 4);
      // Cluster in three bursts: left, center, right
      const cluster = [20, 50, 80][i % 3];
      return {
        id:       i,
        left:     cluster + (Math.random() - 0.5) * 30,
        duration: 1.4 + Math.random() * 1.4,
        delay:    Math.random() * 0.7,
        color,
        size,
        shape,
        shapeStyle: confettiShape(shape, color, size),
        rotate:   Math.random() * 360,
        drift:    (Math.random() - 0.5) * 80,  // horizontal drift px
      };
    })
  ).current;

  // Build per-piece keyframes so each piece has its own drift + rotation
  const styles = pieces.map(p =>
    `@keyframes cb${p.id}{0%{transform:translateY(-20px) translateX(0) rotate(0deg) scale(1);opacity:1}15%{opacity:1}100%{transform:translateY(110vh) translateX(${p.drift}px) rotate(${p.rotate + 540}deg) scale(0.6);opacity:0}}`
  ).join('\n');

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <style>{styles}</style>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position:  'absolute',
            top:       '-20px',
            left:      `${p.left}%`,
            ...p.shapeStyle,
            animation: `cb${p.id} ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MundoPage() {
  const [selection, setSelection]     = useState<{ name: string; iso: string | null; source: 'click' | 'random' } | null>(null);
  const [focusTarget, setFocusTarget] = useState<Continent | null>(null);
  const [spinLevel, setSpinLevel]     = useState(0);
  const [pickNonce, setPickNonce]     = useState(0);
  const [openList, setOpenList]       = useState<'visited' | 'planning' | null>(null);

  // Game state
  const [gamePhase,   setGamePhase]   = useState<GamePhase>('idle');
  const [gameRound,   setGameRound]   = useState(0);
  const [gameScore,   setGameScore]   = useState(0);
  const [guess,       setGuess]       = useState('');
  const [shakeKey,    setShakeKey]    = useState(0);
  const [wrongFlash,  setWrongFlash]  = useState(false);
  const [skipsLeft,    setSkipsLeft]    = useState(3);
  const [isTooSmall,   setIsTooSmall]   = useState(false);
  const [flagHintsLeft, setFlagHintsLeft] = useState(5);
  const [showFlagHint,  setShowFlagHint]  = useState(false);
  const [skippedCountry, setSkippedCountry] = useState<string | null>(null);
  const [highScore,      setHighScore]      = useState(0);
  const currentCountryRef             = useRef<string | null>(null);
  const inputRef                      = useRef<HTMLInputElement>(null);

  const TOO_SMALL_SPAN = 0.5; // degrees — only truly tiny countries (Monaco, Singapore, Vatican…)

  const inGame = gamePhase !== 'idle';

  useEffect(() => {
    const prevBg = document.body.style.background;
    document.body.style.background = '#000005';
    return () => { document.body.style.background = prevBg; };
  }, []);

  // Focus input whenever a new guessing round starts
  useEffect(() => {
    if (gamePhase === 'guessing') inputRef.current?.focus();
  }, [gamePhase, gameRound]);

  function selectContinent(c: Continent) {
    if (inGame) return;
    setFocusTarget(prev => (prev?.name === c.name ? null : c));
    setSpinLevel(0);
  }

  function handlePickedRandom({ name, iso: isoFromGlobe, lat, lng, span }: { name: string; iso: string | null; lat: number; lng: number; span: number }) {
    if (gamePhase === 'guessing' || gamePhase === 'correct') {
      currentCountryRef.current = name;
      setSelection({ name, iso: isoFromGlobe ?? NAME_ISO[name] ?? null, source: 'random' });
      setFocusTarget({ name, lat, lng });
      setIsTooSmall(span < TOO_SMALL_SPAN);
      setShowFlagHint(false);
      setGamePhase('guessing');
      setGuess('');
    } else {
      setSelection({ name, iso: isoFromGlobe ?? NAME_ISO[name] ?? null, source: 'random' }); // flagFor checks NAME_FLAG first so NAME_FLAG countries still display correctly
      setFocusTarget({ name, lat, lng });
      setSpinLevel(0);
    }
  }

  function startGame() {
    setGamePhase('guessing');
    setGameRound(1);
    setGameScore(0);
    setSkipsLeft(3);
    setFlagHintsLeft(5);
    setShowFlagHint(false);
    setIsTooSmall(false);
    setGuess('');
    currentCountryRef.current = null;
    setPickNonce(n => n + 1);
  }

  function quitGame() {
    setHighScore(h => Math.max(h, gameScore));
    setGamePhase('idle');
    setGameRound(0);
    setGameScore(0);
    setSkipsLeft(3);
    setFlagHintsLeft(5);
    setShowFlagHint(false);
    setIsTooSmall(false);
    setGuess('');
    setSkippedCountry(null);
    setSelection(null);
    setFocusTarget(null);
    currentCountryRef.current = null;
  }

  function showSkipped(name: string) {
    setSkippedCountry(name);
    setTimeout(() => setSkippedCountry(null), 1500);
  }

  // Regular skip — costs one skip, advances round (Fibonacci level goes up)
  function skipCountry() {
    if (gamePhase !== 'guessing' || skipsLeft <= 0) return;
    if (currentCountryRef.current) showSkipped(currentCountryRef.current);
    setSkipsLeft(s => s - 1);
    setGameRound(r => r + 1);
    setPickNonce(n => n + 1);
  }

  // Too-small skip — free, does NOT advance round (Fibonacci level stays the same)
  function skipTooSmall() {
    if (gamePhase !== 'guessing' || !isTooSmall) return;
    if (currentCountryRef.current) showSkipped(currentCountryRef.current);
    setPickNonce(n => n + 1);
  }

  const submitGuess = useCallback(() => {
    const answer = currentCountryRef.current;
    if (!answer || gamePhase !== 'guessing') return;

    const correct = isCloseEnough(guess, answer);

    if (correct) {
      const points = fibScore(gameRound);
      setGameScore(s => s + points);
      setGamePhase('correct');
      setTimeout(() => {
        setGameRound(r => r + 1);
        setPickNonce(n => n + 1);
      }, 1800);
    } else {
      setHighScore(h => Math.max(h, gameScore));
      setWrongFlash(true);
      setShakeKey(k => k + 1);
      setTimeout(() => setWrongFlash(false), 600);
      setGamePhase('wrong');
      setTimeout(() => setGamePhase('ended'), 900);
    }
  }, [guess, gamePhase, gameRound, gameScore]);

  const spinning = focusTarget === null;

  return (
    <div
      className="fixed inset-0 z-0"
      style={{ background: 'radial-gradient(ellipse at center, #0d0d2b 0%, #000005 100%)' }}
    >
      {wrongFlash && (
        <div className="wrong-flash fixed inset-0 z-40 pointer-events-none bg-red-500" />
      )}

      {gamePhase === 'correct' && <Confetti />}

      <MundoGlobe
        visitedCountries={countries}
        wantToGoCountries={wantToGoCountries}
        selectedCountry={selection?.name ?? null}
        selectedCountryColor={COLOR_SELECTED}
        isRainbow={!inGame && selection?.source === 'random'}
        spinSpeed={SPIN_LEVELS[spinLevel].speed}
        pickRandomTrigger={pickNonce}
        onCountryClick={(name, iso) => {
          if (inGame) return;
          setSelection(prev => name && prev?.name !== name ? { name, iso, source: 'click' } : null);
          if (name) setOpenList(null);
        }}
        onPickedRandom={handlePickedRandom}
        focusTarget={focusTarget}
      />

      {/* Continent list */}
      <nav className="absolute left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
        {CONTINENTS.map(c => (
          <button
            key={c.name}
            onClick={() => selectContinent(c)}
            className={`${BTN} ${focusTarget?.name === c.name ? '!text-white' : ''} ${inGame ? 'opacity-30 pointer-events-none' : ''}`}
          >
            {c.name}
          </button>
        ))}
      </nav>

      {/* Spin controls */}
      <div className="absolute left-6 z-10 flex flex-col gap-2" style={{ top: 'calc(50% + 5rem)' }}>
        <div className="border-t border-white/15 w-14" />
        <div className="flex flex-col gap-3">
          {inGame ? (
            <button onClick={quitGame} className={BTN}>
              Quit game
            </button>
          ) : spinning ? (
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
                <>
                  <div className="relative group flex items-center">
                    <button onClick={() => setPickNonce(n => n + 1)} className="text-left text-sm font-semibold tracking-wide rainbow-text">
                      Where Next?
                    </button>
                    <span className="absolute left-full ml-4 w-44 text-xs text-white/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none leading-snug">
                      wherever it lands, that&apos;s where you should go. this is called destiny, where the gambler and the traveller spirit essences had a baby and that baby is you right now. just do it!!
                    </span>
                  </div>
                  <button onClick={startGame} className="text-left text-sm font-semibold tracking-wide text-white/35 hover:text-white/70 transition-colors">
                    Guess the Country
                  </button>
                </>
              )}
            </>
          ) : (
            <button onClick={() => setFocusTarget(null)} className={BTN}>
              Spin
            </button>
          )}
        </div>
      </div>

      {/* Legend — hidden during game */}
      {!inGame && (
        <div className="absolute bottom-20 left-6 z-10 flex flex-col gap-1.5">
          {([
            { color: COLOR_VISITED,    label: 'Visited',  key: 'visited'  as const },
            { color: COLOR_WANT_TO_GO, label: 'Planning', key: 'planning' as const },
            { color: COLOR_DEFAULT,    label: 'Not yet',  key: null                },
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
      )}

      {/* Bottom right — country label / list / game UI */}
      <div className="absolute bottom-20 right-6 z-10 flex flex-col items-end gap-2">

        {inGame && (
          <div className="flex flex-col items-end gap-2">

            {/* Hints & skips — always at the top during guessing */}
            {gamePhase === 'guessing' && (
              <div className="flex flex-col items-end gap-1.5">

                {/* Too small — free, no Fibonacci advance */}
                {isTooSmall && (
                  <button
                    onClick={skipTooSmall}
                    className="text-xs text-yellow-400/60 hover:text-yellow-400 transition-colors tracking-wide"
                  >
                    too small — free skip
                  </button>
                )}

                {/* Flag hint — up to 5 uses */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { if (flagHintsLeft > 0) { setShowFlagHint(true); setFlagHintsLeft(h => h - 1); } }}
                    disabled={flagHintsLeft <= 0 || showFlagHint}
                    className="text-xs text-white/20 hover:text-white/50 disabled:opacity-30 disabled:pointer-events-none transition-colors tracking-wide"
                  >
                    flag hint
                  </button>
                  <span className="text-xs tracking-wide">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < flagHintsLeft ? 'text-white/35' : 'text-white/10'}>●</span>
                    ))}
                  </span>
                </div>

                {/* Regular skip — costs one, advances Fibonacci */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={skipCountry}
                    disabled={skipsLeft <= 0}
                    className="text-xs text-white/20 hover:text-white/50 disabled:opacity-30 disabled:pointer-events-none transition-colors tracking-wide"
                  >
                    skip
                  </button>
                  <span className="text-xs tracking-wide">
                    {Array.from({ length: 3 }, (_, i) => (
                      <span key={i} className={i < skipsLeft ? 'text-white/35' : 'text-white/10'}>●</span>
                    ))}
                  </span>
                </div>

              </div>
            )}

            {/* Skipped country name — briefly shown after a skip */}
            {skippedCountry && (
              <span className="text-xs text-white/40 tracking-wide italic">
                skipped: {skippedCountry}
              </span>
            )}

            {/* Best score */}
            {highScore > 0 && (
              <span className="text-xs text-white/20 tracking-wide tabular-nums">
                best: {highScore}
              </span>
            )}

            {/* Score */}
            <div className="flex items-baseline gap-3">
              <span className="text-xs text-white/30 tracking-wide">
                round {gameRound} · next +{fibScore(gameRound)} pts
              </span>
              <span className="text-2xl font-bold text-white tabular-nums">{gameScore}</span>
            </div>

            {gamePhase === 'ended' ? (
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm text-red-400 font-semibold tracking-wide">
                  wrong — it was {currentCountryRef.current}
                </span>
                <span className="text-xs text-white/40">
                  final: {gameScore}{highScore > gameScore ? ` · best: ${highScore}` : ' · new best!'}
                </span>
                <div className="flex gap-3 mt-1">
                  <button onClick={startGame} className="text-xs text-white/50 hover:text-white transition-colors tracking-wide">
                    play again
                  </button>
                  <button onClick={quitGame} className="text-xs text-white/30 hover:text-white/60 transition-colors tracking-wide">
                    quit
                  </button>
                </div>
              </div>
            ) : gamePhase === 'correct' ? (
              <span className="text-sm text-green-400 font-semibold tracking-wide animate-bounce">
                ✓ {currentCountryRef.current}
              </span>
            ) : (
              <div className="flex flex-col items-end gap-1.5">
                {showFlagHint && selection && (
                  <span className="text-5xl">{flagFor(selection.name, selection.iso)}</span>
                )}
                <div className="flex items-center gap-2">
                  <input
                    key={shakeKey}
                    ref={inputRef}
                    value={guess}
                    onChange={e => setGuess(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitGuess()}
                    placeholder="country name…"
                    className={`bg-transparent border-b border-white/30 focus:border-white/70 outline-none text-white text-sm tracking-wide placeholder:text-white/20 text-right w-40 pb-0.5 transition-colors ${gamePhase === 'wrong' ? 'shake border-red-400' : ''}`}
                  />
                  <button
                    onClick={submitGuess}
                    className="text-white/40 hover:text-white transition-colors text-xs tracking-wide"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!inGame && (
          <div className="flex flex-col items-end gap-1 pointer-events-none">
            {openList ? (
              <>
                <span className="text-xs text-white/30 tracking-wide mb-1">
                  {openList === 'visited' ? 'Visited' : 'Planning'}
                </span>
                {(openList === 'visited' ? VISITED_SORTED : PLANNING_SORTED)
                  .map(c => {
                    const flag = flagFor(c);
                    return (
                      <span key={c} className="text-sm font-semibold tracking-wide text-white/60">
                        {c}{flag && <span className="ml-1.5">{flag}</span>}
                      </span>
                    );
                  })}
              </>
            ) : (
              <span className="text-3xl font-bold tracking-tight text-white">
                {selection?.name
                  ? <>{flagFor(selection.name, selection.iso) && <span className="mr-2">{flagFor(selection.name, selection.iso)}</span>}{selection.name}</>
                  : 'Mundo'}
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
