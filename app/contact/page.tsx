"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type ContactInfo = { email: string; phone: string };

const FAKE_CODE = "banana";
const FAKE_CONTACT: ContactInfo = { email: "nottodaybot@gmail.com", phone: "+45 12 34 56 78" };

const WORKER_URL = "https://snowy-mountain-0ccb.eduardostrindade.workers.dev";
const TURNSTILE_SITE_KEY = "0x4AAAAAADVl8aWps34OCYpt";
const WEB3FORMS_KEY = "08e7b664-4d4b-4196-8d22-1dcf02702bd8";

const inputClass =
  "w-full border-b border-gray-200 py-3 bg-transparent outline-none text-sm placeholder-gray-400 transition-colors duration-200 focus:border-black";

type FormState = "idle" | "sending" | "success" | "error";

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export default function ContactPage() {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showTurnstile, setShowTurnstile] = useState(false);

  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const turnstileReady = useRef(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const handleUnlock = async () => {
    setChecking(true);
    setCodeError(false);
    await new Promise((r) => setTimeout(r, 400));
    if (code.trim() === FAKE_CODE) {
      setContactInfo(FAKE_CONTACT);
    } else {
      setCodeError(true);
    }
    setChecking(false);
  };

  const handleTurnstileLoad = () => {
    turnstileReady.current = true;
  };

  const renderTurnstile = () => {
    if (turnstileRef.current && window.turnstile && !widgetIdRef.current) {
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(null),
        "error-callback": () => setTurnstileToken(null),
        theme: "light",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTurnstile) {
      setShowTurnstile(true);
      setTimeout(renderTurnstile, 50);
      return;
    }
    if (!turnstileToken) return;
    setFormState("sending");

    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name,
          email,
          message,
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormState("success");
        setName("");
        setEmail("");
        setMessage("");
        setTurnstileToken(null);
      } else {
        setFormState("error");
        if (widgetIdRef.current) window.turnstile.reset(widgetIdRef.current);
      }
    } catch {
      setFormState("error");
      if (widgetIdRef.current) window.turnstile.reset(widgetIdRef.current);
    }
  };

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        onLoad={handleTurnstileLoad}
      />

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Get in touch</h1>
          <p className="text-gray-500 text-sm">
            Send me a message below, or use an access code to unlock contact details.
          </p>
        </div>

        {/* Contact form */}
        <section className="mb-14">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-6">
            Send a message
          </h2>

          {formState === "success" ? (
            <div className="py-10 text-center" style={{ animation: "fadeIn 0.4s ease" }}>
              <p className="text-2xl mb-2">✓</p>
              <p className="text-sm text-gray-500">Message sent — I&apos;ll get back to you soon.</p>
              <button
                onClick={() => setFormState("idle")}
                className="mt-6 text-xs underline text-gray-400 hover:text-black transition-colors"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  className={inputClass}
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <textarea
                  className={`${inputClass} resize-none`}
                  placeholder="Your message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {/* Turnstile widget — shown only after first submit click */}
              {showTurnstile && (
                <div ref={turnstileRef} className="flex justify-center" />
              )}

              {formState === "error" && (
                <p className="text-red-500 text-xs">Something went wrong — please try again.</p>
              )}

              <button
                type="submit"
                disabled={formState === "sending" || (showTurnstile && !turnstileToken)}
                className="w-full py-3 bg-black text-white text-sm font-medium rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {formState === "sending" ? "Sending…" : showTurnstile && !turnstileToken ? "Complete the check above ↑" : "Send message →"}
              </button>
            </form>
          )}
        </section>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-14" />

        {/* Access code gate */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-6">
            Access contact details
          </h2>

          {!contactInfo ? (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Enter your access code to see email, phone and official curriculum vitae.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-colors"
                  placeholder="Access code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                />
                <button
                  onClick={handleUnlock}
                  disabled={checking || !code}
                  className="px-5 py-2.5 border border-black text-sm font-medium rounded-lg hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {checking ? "…" : "Unlock"}
                </button>
              </div>
              {codeError && (
                <p className="text-red-500 text-xs mt-2">Invalid code.</p>
              )}
            </div>
          ) : (
            <div className="space-y-5" style={{ animation: "slideUp 0.4s ease" }}>
              <div className="flex gap-3 text-sm">
                <span className="text-gray-400 w-16 flex-shrink-0">Email</span>
                <a href={`mailto:${contactInfo.email}`} className="hover:underline">
                  {contactInfo.email}
                </a>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-gray-400 w-16 flex-shrink-0">Phone</span>
                <a href={`tel:${contactInfo.phone.replace(/\s/g, "")}`} className="hover:underline">
                  {contactInfo.phone}
                </a>
              </div>
              <div className="flex gap-3 text-sm items-center">
                <span className="text-gray-400 w-16 flex-shrink-0">Resume</span>
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/suspdog2.jpg`}
                  download="suspdog.jpg"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-black rounded-lg text-xs font-medium hover:bg-black hover:text-white transition-all duration-200"
                >
                  ↓
                </a>
              </div>
            </div>
          )}
        </section>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </>
  );
}
