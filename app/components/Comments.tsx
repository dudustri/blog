"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { formatDate } from "@/app/data/blog";
import type { Comment } from "@/app/data/comments";

// must match the worker name in cloudflare, see workers/README.md
const WORKER_URL = "https://blog-comments.eduardostrindade.workers.dev";

// same key as the contact form: a turnstile site key is per domain, not per form
const TURNSTILE_SITE_KEY = "0x4AAAAAADVl8aWps34OCYpt";

const MAX_NAME = 60;
const MAX_MESSAGE = 2000;

type FormState = "idle" | "verifying" | "sending" | "success" | "error";

const inputClass =
  "w-full border-b border-gray-200 py-3 bg-transparent outline-none text-sm placeholder-gray-400 transition-colors duration-200 focus:border-black";

// rejects a message that is only punctuation, emoji or whitespace
function hasWords(text: string) {
  return (text.match(/[\p{L}\p{N}]/gu) ?? []).length >= 2;
}

export default function Comments({
  slug,
  comments,
}: {
  slug: string;
  comments: Comment[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [showTurnstile, setShowTurnstile] = useState(false);

  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const isSendingRef = useRef(false);

  // refs so send() always reads the latest values
  const nameRef = useRef(name);
  const messageRef = useRef(message);
  const websiteRef = useRef(website);
  useEffect(() => { nameRef.current = name; }, [name]);
  useEffect(() => { messageRef.current = message; }, [message]);
  useEffect(() => { websiteRef.current = website; }, [website]);

  const resetWidget = () => {
    setShowTurnstile(false);
    widgetIdRef.current = null;
    isSendingRef.current = false;
  };

  const send = async (token: string) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    setFormState("sending");
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: nameRef.current,
          message: messageRef.current,
          website: websiteRef.current,
          turnstileToken: token,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormState("success");
        setName("");
        setMessage("");
        resetWidget();
      } else {
        setError("Something went wrong, please try again.");
        setFormState("error");
        resetWidget();
      }
    } catch {
      setError("Something went wrong, please try again.");
      setFormState("error");
      resetWidget();
    }
  };

  const renderTurnstile = () => {
    const turnstile = (window as unknown as {
      turnstile?: {
        render: (el: HTMLElement, options: Record<string, unknown>) => string;
      };
    }).turnstile;
    if (turnstileRef.current && turnstile && !widgetIdRef.current) {
      widgetIdRef.current = turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => send(token),
        "expired-callback": () => setFormState("idle"),
        "error-callback": () => {
          setError("Bot check failed, please try again.");
          setFormState("error");
        },
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) return setError("A name, or something to call you.");
    if (trimmedName.length > MAX_NAME) return setError("That name is too long.");
    if (!hasWords(trimmedMessage)) return setError("Write a comment first.");
    if (trimmedMessage.length > MAX_MESSAGE) {
      return setError(`Keep it under ${MAX_MESSAGE} characters.`);
    }

    setError("");
    setShowTurnstile(true);
    setFormState("verifying");
    setTimeout(renderTurnstile, 50);
  };

  const busy = formState === "verifying" || formState === "sending";

  return (
    <section className="mt-16 pt-8 border-t border-gray-200">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" />

      <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-6">
        {comments.length > 0 ? `Comments (${comments.length})` : "Comments"}
      </h2>

      {comments.length > 0 && (
        <ol className="space-y-6 mb-10">
          {comments.map((comment) => (
            <li key={comment.id}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-medium text-black">{comment.name}</span>
                {comment.date && (
                  <span className="text-xs text-gray-400">{formatDate(comment.date)}</span>
                )}
              </div>
              {/* plain text on purpose, never the post markup renderer */}
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                {comment.message}
              </p>
            </li>
          ))}
        </ol>
      )}

      {formState === "success" ? (
        <div className="py-8 text-center" style={{ animation: "fadeIn 0.4s ease" }}>
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm text-gray-500">
            Thanks, your comment reached me. I read every one before it goes up,
            so give it a day or two.
          </p>
        </div>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
          Leave a comment →
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
          <input
            className={inputClass}
            placeholder="Your name"
            value={name}
            maxLength={MAX_NAME}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
          <textarea
            className={`${inputClass} resize-none`}
            placeholder="Your comment"
            rows={4}
            value={message}
            maxLength={MAX_MESSAGE}
            onChange={(e) => setMessage(e.target.value)}
            disabled={busy}
          />

          {/* honeypot: hidden from people, so anything in it is a bot */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
          />

          {showTurnstile && <div ref={turnstileRef} className="flex justify-start" />}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <p className="text-xs text-gray-400">
            Comments are reviewed before they appear.
          </p>

          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 border border-black text-sm font-medium rounded-lg hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {formState === "sending"
              ? "Sending…"
              : formState === "verifying"
                ? "Verifying…"
                : "Send comment →"}
          </button>
        </form>
      )}
    </section>
  );
}
