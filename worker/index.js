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
 * carries title/company/companyType/consent), so the mail body is generated
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
  consent: "Consent",
};

/** `label: value` lines, known fields first, in FIELD_LABELS order. */
function formatBody(data) {
  const known = Object.keys(FIELD_LABELS).filter((key) => key in data);
  const rest = Object.keys(data).filter((key) => !(key in FIELD_LABELS));

  return [...known, ...rest]
    .map((key) => `${FIELD_LABELS[key] ?? key}: ${String(data[key]).trim()}`)
    .join("\n");
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
  const subject = data.category
    ? `Contact — ${data.category} — ${name}`
    : `Demo request — ${name}`;

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: env.CONTACT_TO.split(",").map((address) => address.trim()),
      reply_to: email,
      subject,
      text: formatBody(data),
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
