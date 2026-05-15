export function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s.includes("://") ? s : `https://${s}`);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function buildSchemeUrl(targetUrl: string): string {
  return `smartmemo://capture?url=${encodeURIComponent(targetUrl)}`;
}
