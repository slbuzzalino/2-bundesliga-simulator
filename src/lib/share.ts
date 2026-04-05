// Encode simulation results into a URL-safe string (no DB needed)
export function encodeSimulation(
  results: Record<number, { home: number; away: number }>
): string {
  const json = JSON.stringify(results);
  // Use base64url encoding
  if (typeof window !== "undefined") {
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  const encoded = Buffer.from(json, "utf-8").toString("base64");
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSimulation(
  encoded: string
): Record<number, { home: number; away: number }> | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    let json: string;
    if (typeof window !== "undefined") {
      json = decodeURIComponent(escape(atob(base64)));
    } else {
      json = Buffer.from(base64, "base64").toString("utf-8");
    }
    return JSON.parse(json);
  } catch {
    return null;
  }
}
