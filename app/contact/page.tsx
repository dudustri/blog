"use client";

import { useEffect, useRef, useState } from "react";

type ContactInfo = { email: string; phone: string };

const FAKE_CODE = "banana";
const FAKE_CONTACT: ContactInfo = { email: "nottodaybot@gmail.com", phone: "+45 12 34 56 78" };

const TOAST_MSG = "Sorry pal, this is not ready yet and I'm thinking in a good and safe way to do it :)";

const inputClass =
  "w-full border-b border-gray-200 py-3 bg-transparent outline-none text-sm placeholder-gray-400 transition-colors duration-200 cursor-not-allowed select-none";

export default function ContactPage() {
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  const triggerToast = () => {
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 4000);
  };

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

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Get in touch</h1>
        <p className="text-gray-500 text-sm">
          Send me a message below, or use an access code to unlock contact details.
        </p>
      </div>

      {/* Toast */}
      {showToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white text-sm px-5 py-3 rounded-xl shadow-lg max-w-sm text-center"
          style={{ animation: "slideUp 0.3s ease" }}
        >
          {TOAST_MSG}
        </div>
      )}

      {/* Contact form */}
      <section className="mb-14">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-6">
          Send a message
        </h2>

        <div className="space-y-6" onClick={triggerToast}>
          <div>
            <input
              readOnly
              className={inputClass}
              placeholder="Your name"
              onFocus={triggerToast}
            />
          </div>
          <div>
            <input
              readOnly
              type="text"
              className={inputClass}
              placeholder="Your email"
              onFocus={triggerToast}
            />
          </div>
          <div>
            <textarea
              readOnly
              className={`${inputClass} resize-none`}
              placeholder="Your message"
              rows={5}
              onFocus={triggerToast}
            />
          </div>
          <button
            disabled
            className="w-full py-3 bg-black text-white text-sm font-medium rounded-lg opacity-40 cursor-not-allowed"
          >
            Send message →
          </button>
        </div>
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
          <div
            className="space-y-5"
            style={{ animation: "slideUp 0.4s ease" }}
          >
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
                href="/images/suspdog2.jpg"
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
  );
}
