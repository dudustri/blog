/**
 * contact form: verify turnstile, send message by email via resend
 *
 * vars:    TO_EMAIL (inbox, kept out of this file)
 * secrets: TURNSTILE_SECRET, RESEND_API_KEY
 * binding: RATE_LIMITER (optional)
 */

// one plain address, no spaces or line breaks, so it cannot break the email headers
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// cap length, drop control characters, keep line breaks only where asked (same idea as the comments worker)
function clean(input, max, allowNewlines = false) {
  if (typeof input !== "string") return "";
  let out = input.normalize("NFC").replace(/\r\n?/g, "\n");
  out = [...out].map((ch) => (ch === "\n" ? (allowNewlines ? ch : " ") : ch.codePointAt(0) >= 32 && ch !== "\x7f" ? ch : "")).join("");
  out = allowNewlines ? out.replace(/\n{3,}/g, "\n\n") : out.replace(/\s+/g, " ");
  return out.trim().slice(0, max);
}

export default {
  async fetch(request, env) {
    const ALLOWED_ORIGIN = "https://eduardo.dk";
    const FROM_EMAIL = "onboarding@resend.dev"; // resend test sender, works without domain verification

    const corsHeaders = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (request.method === "GET") {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Contact Worker</title>
          <style>
            html, body { height: 100%; margin: 0; }
            body {
              font-family: monospace;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 24px;
            }
            h2 { margin: 0 0 12px; }
            p  { margin: 0; color: #555; }
          </style>
        </head>
        <body>
          <h2>Contact Worker</h2>
          <p>Nothing to do here (:</p>
        </body>
        </html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    if (env.RATE_LIMITER) {
      const { success } = await env.RATE_LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") ?? "unknown" });
      if (!success) {
        return new Response(JSON.stringify({ success: false, error: "rate_limited" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    try {
      const body = await request.json();
      const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
      const name = clean(body.name, 80);
      const email = clean(body.email, 200);
      const message = clean(body.message, 5000, true);
      if (!name || !message || !EMAIL_RE.test(email)) {
        return new Response(JSON.stringify({ success: false, error: "invalid_fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const secret = env.TURNSTILE_SECRET;
      const resendKey = env.RESEND_API_KEY;
      const toEmail = env.TO_EMAIL;

      if (!turnstileToken) {
        return new Response(JSON.stringify({ success: false, error: "Missing turnstile token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!secret) {
        return new Response(JSON.stringify({ success: false, error: "TURNSTILE_SECRET env binding missing" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!resendKey) {
        return new Response(JSON.stringify({ success: false, error: "RESEND_API_KEY env binding missing" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!toEmail) {
        return new Response(JSON.stringify({ success: false, error: "TO_EMAIL env binding missing" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // --- step 1: verify turnstile ---
      const verifyBody = new URLSearchParams();
      verifyBody.append("secret", secret);
      verifyBody.append("response", turnstileToken);
      const clientIp = request.headers.get("CF-Connecting-IP");
      if (clientIp) verifyBody.append("remoteip", clientIp);

      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        { method: "POST", body: verifyBody }
      );
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return new Response(JSON.stringify({ success: false, stage: "siteverify", error: "Bot check failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // --- step 2: send via resend ---
      const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
      ));

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: toEmail,
          reply_to: email,
          subject: `[eduardo.dk] New message from ${name} <${email}>`,
          html: `
            <h2>New contact form message</h2>
            <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
              <tr><td style="padding:4px 12px 4px 0;color:#666"><strong>From:</strong></td><td>${escapeHtml(name)}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666"><strong>Email:</strong></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
            </table>
            <h3 style="margin-top:24px">Message</h3>
            <pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;background:#f6f6f6;padding:12px;border-radius:6px">${escapeHtml(message)}</pre>
            <p style="color:#999;font-size:12px;margin-top:24px">Reply directly to this email to respond to ${escapeHtml(name)}.</p>
          `,
        }),
      });

      const resendText = await resendRes.text();
      let resendData;
      try { resendData = JSON.parse(resendText); } catch { resendData = { raw: resendText }; }

      if (!resendRes.ok) {
        console.error("resend failed", resendRes.status, resendText);
        return new Response(JSON.stringify({ success: false, stage: "resend" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: true, id: resendData.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("contact failed", err instanceof Error ? err.message : err);
      return new Response(JSON.stringify({ success: false, stage: "outer" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  },
};
