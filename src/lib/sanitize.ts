import sanitizeHtml from "sanitize-html";

const ALLOWED_IFRAME_HOSTS = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"];

/** Sanitises admin-authored rich text before storing/rendering. */
export function cleanHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return sanitizeHtml(dirty, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li",
      "blockquote", "code", "pre", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
      "iframe", "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      "*": ["class"],
    },
    allowedClasses: { "*": ["text-center", "text-right", "lead", "note"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowedIframeHostnames: ALLOWED_IFRAME_HOSTS,
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href || "");
        return {
          tagName,
          attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" } : attribs,
        };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}

export function plainText(input: string | null | undefined, max = 5000): string {
  if (!input) return "";
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim().slice(0, max);
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Only allow http(s) links (and tg:// for Telegram). */
export function safeUrl(url: string | null | undefined, allowTg = false): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol === "https:" || u.protocol === "http:") return u.toString();
    if (allowTg && u.protocol === "tg:") return trimmed;
  } catch {}
  return null;
}
