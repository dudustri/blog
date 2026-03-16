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

  return (
    <header className="border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-black">
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
                    ? "text-black font-medium underline underline-offset-4"
                    : "text-gray-400 hover:text-black"
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
            className="ml-1 text-gray-400 hover:text-black transition-colors"
            style={{ fontSize: 16, lineHeight: 1, padding: "2px 0" }}
          >
            {dark ? "○" : "●"}
          </button>
        </nav>
      </div>
    </header>
  );
}
