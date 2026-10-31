"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

const navLinks = [
  { href: "/", label: "Home", exact: true },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/mundo", label: "Mundo" },
  { href: "/sports", label: "Sports" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

// theme lives on <html> as "dark" class. inline script in layout.tsx applies
// saved choice before paint, toggle reads class from there
const subscribeTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};
const isDarkTheme = () => document.documentElement.classList.contains("dark");

// shows the mode you would switch to, sun while dark and moon while light
function ThemeIcon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.7 5.7l1.5 1.5M16.8 16.8l1.5 1.5M18.3 5.7l-1.5 1.5M7.2 16.8l-1.5 1.5" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.6 14.3A8.6 8.6 0 0 1 9.7 3.4 8.6 8.6 0 1 0 20.6 14.3Z" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const dark = useSyncExternalStore(subscribeTheme, isDarkTheme, () => false);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleDark = () => {
    const next = !dark;
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const isMundo = pathname.startsWith('/mundo');

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors select-none ${
      isMundo ? 'border-white/10 bg-transparent backdrop-blur-sm' : 'border-gray-100 bg-white'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className={`font-semibold tracking-tight ${isMundo ? 'text-white' : 'text-black'}`}>
          Eduardo S. Trindade
        </Link>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          {navLinks.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm transition-colors ${
                  active
                    ? isMundo
                      ? 'text-white font-medium'
                      : 'text-black font-medium'
                    : isMundo
                      ? 'text-white/50 hover:text-white'
                      : 'text-gray-400 hover:text-black'
                }`}
              >
                {label}
              </Link>
            );
          })}

          {/* dark mode toggle, invisible placeholder on Mundo page to preserve layout */}
          <button
            onClick={toggleDark}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            className={`ml-1 flex items-center transition-colors ${
              isMundo ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-black'
            }`}
          >
            <ThemeIcon dark={dark} />
          </button>
        </nav>

        {/* mobile controls, dark toggle + hamburger */}
        <div className="flex md:hidden items-center gap-4">
          <button
            onClick={toggleDark}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className={`flex items-center transition-colors ${
              isMundo ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-black'
            }`}
          >
            <ThemeIcon dark={dark} />
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className={`flex flex-col justify-center gap-[5px] w-6 h-6 ${isMundo ? 'text-white' : 'text-black'}`}
          >
            <span
              className="block h-[2px] w-6 bg-current transition-transform duration-200"
              style={menuOpen ? { transform: "translateY(7px) rotate(45deg)" } : undefined}
            />
            <span
              className="block h-[2px] w-6 bg-current transition-opacity duration-200"
              style={menuOpen ? { opacity: 0 } : undefined}
            />
            <span
              className="block h-[2px] w-6 bg-current transition-transform duration-200"
              style={menuOpen ? { transform: "translateY(-7px) rotate(-45deg)" } : undefined}
            />
          </button>
        </div>
      </div>

      {/* mobile dropdown menu */}
      {menuOpen && (
        <nav
          className={`md:hidden border-t ${
            isMundo ? 'border-white/10 bg-black/80 backdrop-blur-md' : 'border-gray-100 bg-white'
          }`}
        >
          <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col">
            {navLinks.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`py-2.5 text-sm transition-colors ${
                    active
                      ? isMundo
                        ? 'text-white font-medium'
                        : 'text-black font-medium'
                      : isMundo
                        ? 'text-white/60 hover:text-white'
                        : 'text-gray-500 hover:text-black'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
