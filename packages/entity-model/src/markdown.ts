export function isSafeMarkdownUrl(url: string): boolean {
  if (
    url.includes("\\") ||
    [...url].some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)
  )
    return false;
  if (/^#\/(?:entities|topics)\/[a-z][a-z0-9-]*$/.test(url) || url === "#/") return true;
  if (/^#[a-zA-Z][a-zA-Z0-9-]*$/.test(url)) return true;
  try {
    const parsed = new URL(url);
    return (
      ["https:", "http:", "mailto:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password
    );
  } catch (error) {
    if (error instanceof TypeError) return false;
    throw error;
  }
}
