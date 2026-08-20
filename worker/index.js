/**
 * Cloudflare Worker in front of the static build.
 *
 * Static assets are served by the runtime itself (the `assets` binding), so
 * this script only runs for what `dist/` does not contain — in practice the
 * single `/api/contact` route below. Everything else is handed straight back
 * to ASSETS, which is why the site keeps its plain-static behaviour.
 *
 * The contact + demo forms POST the JSON shape built in
 * `src/scripts/contact-form.js`; the fields differ per page (the demo form
 * carries title/company/companyType), so the mail body is generated
 * from whatever keys arrive rather than a fixed template.
 */

/**
 * Verified domain in Resend is the apex (vistiq.ai) — Resend uses the `send.`
 * subdomain for its own SPF/MX records, which is not a valid from address.
 * The visitor's own address goes to reply_to instead.
 */
const FROM = "VistIQ site <contact@vistiq.ai>";

/** Cap the payload: nothing legitimate comes close, and it bounds the mail. */
const MAX_BODY_BYTES = 20_000;

const FIELD_LABELS = {
  name: "Name",
  email: "Email",
  category: "Category",
  message: "Message",
  title: "Job title",
  company: "Company",
  companyType: "Company type",
};

/** Known fields first in FIELD_LABELS order, then anything else that arrived. */
function orderedEntries(data) {
  const known = Object.keys(FIELD_LABELS).filter((key) => key in data);
  const rest = Object.keys(data).filter((key) => !(key in FIELD_LABELS));

  return [...known, ...rest].map((key) => {
    const value = String(data[key]).trim();
    // A checkbox posts the literal "on"; spell it out in the mail instead.
    return [FIELD_LABELS[key] ?? key, value === "on" ? "Yes" : value];
  });
}

/** `label: value` lines — the plain-text part, and the fallback for clients
    that refuse HTML. */
function formatText(data) {
  return orderedEntries(data)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

/** Values come straight from a public form: escape before interpolating. */
function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (char) => ESCAPES[char]);
}

/**
 * Mail clients strip <style> blocks and ignore most modern CSS, so this is
 * table-based with inline styles only — the one layout every client renders
 * the same way. Colours are the site's own tokens (main.css @theme).
 */
function formatHtml(data, subject) {
  const rows = orderedEntries(data)
    .map(([label, value]) => {
      // The message deserves its own block; short fields read better inline.
      const isLong = value.length > 60;
      const safe = escapeHtml(value).replace(/\n/g, "<br>");

      return isLong
        ? `<tr><td colspan="2" style="padding:16px 0 0;border-top:1px solid #f4f2f0">
             <div style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#1d1e2199;padding-bottom:6px">${escapeHtml(label)}</div>
             <div style="font-size:15px;line-height:1.6;color:#1d1e21">${safe}</div>
           </td></tr>`
        : `<tr>
             <td width="110" style="padding:10px 12px 10px 0;font-size:13px;color:#1d1e2199;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>
             <td style="padding:10px 0;font-size:15px;color:#1d1e21;font-weight:500;width:100%">${safe}</td>
           </tr>`;
    })
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f2f0;font-family:Inter,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto">
    <tr><td style="background:#fbf9f7;border-radius:12px;padding:28px 32px">
      <div style="font-size:19px;font-weight:600;color:#1d1e21;padding-bottom:20px">${escapeHtml(subject)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      <div style="padding-top:24px;margin-top:20px;border-top:1px solid #f4f2f0;font-size:12px;color:#1d1e2199">
        Reply to this email to answer ${escapeHtml(String(data.email || "").trim())} directly.
      </div>
    </td></tr>
  </table>
</body></html>`;
}

async function handleContact(request, env) {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return new Response(null, { status: 400 });
  }

  // The honeypot is stripped client-side, but a direct POST can still carry it.
  if (String(data.companyWebsite || "").trim()) {
    return new Response(null, { status: 204 });
  }

  const email = String(data.email || "").trim();
  const name = String(data.name || "").trim();
  if (!email || !name) return new Response(null, { status: 400 });

  // `category` only exists on the contact form; the demo form has none.
  const subject = data.category ? `Contact` : `Demo request`;

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      // Comma-separated list; drop empties so a trailing comma is harmless.
      to: env.CONTACT_TO.split(",")
        .map((address) => address.trim())
        .filter(Boolean),
      reply_to: email,
      subject,
      text: formatText(data),
      html: formatHtml(data, subject),
    }),
  });

  if (!sent.ok) {
    // Surfaced in the Worker logs (observability is on); the form falls back
    // to the Typeform on any non-2xx, so the visitor is never stuck.
    console.error("resend failed", sent.status, await sent.text());
    return new Response(null, { status: 502 });
  }

  return new Response(null, { status: 204 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") return handleContact(request, env);

    return env.ASSETS.fetch(request);
  },
};
