"use client";

import { useEffect, useRef, useState } from "react";

// image or looping clip for project write-ups: starts loading when it nears the screen, spinner until it's ready
export default function LazyMedia({ src, alt }: { src: string; alt: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const video = /\.(mp4|webm)$/.test(src);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const media = "w-full min-w-[640px] h-auto transition-opacity duration-300";
  return (
    <div ref={box} className="relative min-h-48">
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center" role="status" aria-label="Loading">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--accent)]" />
        </div>
      ) : null}
      {near ? (
        video ? (
          <video
            src={src}
            aria-label={alt}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setReady(true)}
            className={`${media} ${ready ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            onLoad={() => setReady(true)}
            className={`${media} ${ready ? "opacity-100" : "opacity-0"}`}
          />
        )
      ) : null}
    </div>
  );
}
