'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isMundo = pathname.startsWith('/mundo');

  return (
    <footer className={`border-t ${
      isMundo
        ? 'fixed bottom-0 left-0 right-0 z-50 border-white/10 bg-transparent backdrop-blur-sm'
        : 'border-gray-100 mt-12'
    }`}>
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className={`text-xs ${isMundo ? 'text-white/50' : 'text-gray-400'}`}>
          © {new Date().getFullYear()} Eduardo Sfreddo Trindade
        </p>
        <div className={`flex gap-5 text-xs ${isMundo ? 'text-white/50' : 'text-gray-400'}`}>
          <a
            href="https://github.com/dudustri"
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-colors ${isMundo ? 'hover:text-white' : 'hover:text-black'}`}
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/eduardo-sfreddo-trindade"
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-colors ${isMundo ? 'hover:text-white' : 'hover:text-black'}`}
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
