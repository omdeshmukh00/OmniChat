import { NextRequest, NextResponse } from "next/server";
import { formatErrorResponse, AppError } from "@/lib/security/errors";

export const runtime = "nodejs";

async function executeSearch(query: string) {
  if (!query || typeof query !== "string" || !query.trim()) {
    throw new AppError({
      code: "INVALID_REQUEST",
      message: "Search query is required.",
      statusCode: 400,
    });
  }

  const cleanQuery = query.trim();
  const lower = cleanQuery.toLowerCase();

  let results: Array<{ title: string; url: string; snippet: string; domain: string }> = [];

  try {
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(ddgUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(4500), // 4.5s timeout for rich live search
    });

    if (res.ok) {
      const html = await res.text();
      const titleMatches = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
      const snippetMatches = [...html.matchAll(/<(?:a|td|div)[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|td|div)>/g)];

      for (let i = 0; i < Math.min(titleMatches.length, 6); i++) {
        let rawUrl = titleMatches[i][1];
        if (rawUrl.includes("uddg=")) {
          const match = rawUrl.match(/uddg=([^&]+)/);
          if (match) rawUrl = decodeURIComponent(match[1]);
        }
        const titleText = titleMatches[i][2].replace(/<[^>]+>/g, "").trim();
        const snippetText = snippetMatches[i]
          ? snippetMatches[i][1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
          : "";
        let domain = "web";
        try {
          domain = new URL(rawUrl).hostname.replace(/^www\./, "");
        } catch {}

        if (rawUrl.startsWith("http") && titleText) {
          results.push({
            title: titleText,
            url: rawUrl,
            snippet: snippetText || `${titleText} — Live web search findings for ${cleanQuery}.`,
            domain,
          });
        }
      }
    }
  } catch (err) {
    console.warn("Fast web search retriever notice:", err);
  }

  // Instant structured fallback if live search times out or returns zero items
  if (results.length === 0) {
    const isFinance = /stock|share|price|market|adani|mrf|reliance|crypto|nifty|sensex|ticker|financial/i.test(lower);
    if (isFinance) {
      results = [
        {
          title: `${cleanQuery} — Live Stock & Financial Market Data`,
          url: `https://www.google.com/finance/quote/${encodeURIComponent(cleanQuery.replace(/\s+/g, "-"))}`,
          snippet: `Real-time share prices, financial metrics, historical performance, and key market statistics for ${cleanQuery}.`,
          domain: "google.com/finance",
        },
        {
          title: `${cleanQuery} — Moneycontrol Stock Market Search`,
          url: `https://www.moneycontrol.com/stocks/csearch.php?search_data=${encodeURIComponent(cleanQuery)}`,
          snippet: `Get live share price, financial results, quarterly performance, stock metrics, and market capitalisation for ${cleanQuery}.`,
          domain: "moneycontrol.com",
        },
      ];
    } else {
      results = [
        {
          title: `${cleanQuery} — Google Search Results & Web Citations`,
          url: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery)}`,
          snippet: `Comprehensive web search results, authoritative articles, and live updates regarding ${cleanQuery}.`,
          domain: "google.com",
        },
        {
          title: `${cleanQuery} — Knowledge Overview`,
          url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanQuery)}`,
          snippet: `Detailed background information, historical context, key entities, and structured summary of ${cleanQuery}.`,
          domain: "wikipedia.org",
        },
      ];
    }
  }

  return NextResponse.json({ query: cleanQuery, results });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("query") || "";
    return await executeSearch(query);
  } catch (err) {
    return formatErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body.query || body.q || "";
    return await executeSearch(query);
  } catch (err) {
    return formatErrorResponse(err);
  }
}
