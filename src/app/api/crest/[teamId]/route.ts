import { type NextRequest } from "next/server";

// Cache crests in memory to avoid repeated fetches
const crestCache = new Map<string, { data: ArrayBuffer; contentType: string }>();

// Map of team IDs to their crest URLs — fetched once from OpenLigaDB
let crestUrlMap: Map<number, string> | null = null;

async function loadCrestMap(): Promise<Map<number, string>> {
  if (crestUrlMap) return crestUrlMap;

  const res = await fetch("https://api.openligadb.de/getbltable/bl2/2025");
  const data = await res.json();
  crestUrlMap = new Map();
  for (const t of data) {
    crestUrlMap.set(t.teamInfoId, t.teamIconUrl || "");
  }
  return crestUrlMap;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const id = parseInt(teamId);

  // Check memory cache
  const cacheKey = `team-${id}`;
  const cached = crestCache.get(cacheKey);
  if (cached) {
    return new Response(cached.data, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  try {
    const map = await loadCrestMap();
    const url = map.get(id);
    if (!url) {
      return new Response("Not found", { status: 404 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "image/*,*/*",
      },
    });

    if (!res.ok) {
      // Try without thumb (raw SVG) for wikimedia
      if (url.includes("/thumb/")) {
        const rawUrl = url
          .replace("/thumb/", "/")
          .replace(/\/\d+px-[^/]+$/, "");
        const rawRes = await fetch(rawUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            Accept: "image/*,*/*",
          },
        });
        if (rawRes.ok) {
          const data = await rawRes.arrayBuffer();
          const contentType =
            rawRes.headers.get("content-type") || "image/svg+xml";
          crestCache.set(cacheKey, { data, contentType });
          return new Response(data, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=86400, immutable",
            },
          });
        }
      }
      return new Response("Failed to fetch crest", { status: 502 });
    }

    const data = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    crestCache.set(cacheKey, { data, contentType });

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    console.error("Crest fetch error:", err);
    return new Response("Error", { status: 500 });
  }
}
