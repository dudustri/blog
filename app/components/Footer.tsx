export default function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-12">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Eduardo Sfreddo Trindade
        </p>
        <div className="flex gap-5 text-xs text-gray-400">
          <a
            href="https://github.com/dudustri"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/eduardo-sfreddo-trindade"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
