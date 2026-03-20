"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/", label: "Home", exact: true },
  { href: "/resume", label: "Resume" },
  { href: "/mundo", label: "Mundo" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

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
        <nav className="flex items-center gap-5">
          {navLinks.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm transition-colors ${
                  active
                    ? isMundo
                      ? 'text-white font-medium underline underline-offset-4'
                      : 'text-black font-medium underline underline-offset-4'
                    : isMundo
                      ? 'text-white/50 hover:text-white'
                      : 'text-gray-400 hover:text-black'
                }`}
              >
                {label}
              </Link>
            );
          })}

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className={`ml-1 transition-colors ${isMundo ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-black'}`}
            style={{ fontSize: 16, lineHeight: 1, padding: "2px 0" }}
          >
            {dark ? "○" : "●"}
          </button>
        </nav>
      </div>
    </header>
  );
}
