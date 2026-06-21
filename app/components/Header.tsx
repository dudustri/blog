"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/", label: "Home", exact: true },
  { href: "/resume", label: "Resume" },
  { href: "/mundo", label: "Mundo" },
  { href: "/sports", label: "Sports" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync dark class on <html> and persist preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
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
    <header className={`sticky top-0 z-50 border-b transition-colors ${
      isMundo ? 'border-white/10 bg-transparent backdrop-blur-sm' : 'border-gray-100 bg-white'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className={`font-semibold tracking-tight ${isMundo ? 'text-white' : 'text-black'}`}>
          Eduardo S. Trindade
        </Link>

        {/* Desktop nav */}
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

          {/* Dark mode toggle — invisible placeholder on Mundo page to preserve layout */}
          <button
            onClick={isMundo ? undefined : toggleDark}
            aria-label="Toggle dark mode"
            aria-hidden={isMundo}
            className={`ml-1 transition-colors ${isMundo ? 'invisible' : 'text-gray-400 hover:text-black'}`}
            style={{ fontSize: 16, lineHeight: 1, padding: "2px 0" }}
          >
            {dark ? "○" : "●"}
          </button>
        </nav>

        {/* Mobile controls — dark toggle + hamburger */}
        <div className="flex md:hidden items-center gap-4">
          {!isMundo && (
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="text-gray-400 hover:text-black transition-colors"
              style={{ fontSize: 16, lineHeight: 1, padding: "2px 0" }}
            >
              {dark ? "○" : "●"}
            </button>
          )}
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

      {/* Mobile dropdown menu */}
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
