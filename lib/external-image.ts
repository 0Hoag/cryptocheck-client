function isPrivateIPv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [first, second] = parts;
  return first === 0 || first === 10 || first === 127 || first === 169 && second === 254 || first === 172 && second >= 16 && second <= 31 || first === 192 && second === 168;
}

// External images are rendered by the visitor's browser (not fetched by our
// server), so this guard keeps user/provider URLs HTTPS-only and rejects local
// network targets. A server-side media proxy needs separate abuse controls.
export function safeExternalImageURL(value?: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.includes(":") || isPrivateIPv4(hostname)) return "";
    return url.toString();
  } catch {
    return "";
  }
}
