import { neon } from "https://esm.sh/@neondatabase/serverless@0.10.4";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

interface RequestBody {
  action: string;
  params?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const neonConnectionString = normalizeNeonConnectionString(
      Deno.env.get("NEON_DATABASE_URL"),
    );
    if (!neonConnectionString) {
      throw new Error(
        "Missing NEON_DATABASE_URL. Paste only the raw postgresql:// connection string (not a 'psql ...' command).",
      );
    }

    const sql = neon(neonConnectionString);
    const { action, params = {} } = (await req.json()) as RequestBody;

    // Verify admin token from cookie
    const cookieHeader = req.headers.get("Cookie") || "";
    const isAdmin = await verifyAdminToken(cookieHeader);

    let result: unknown;

    switch (action) {
      // ============ READ OPERATIONS ============
      case "get_all_series":
        result = await sql`
          SELECT * FROM series 
          ORDER BY updated_at DESC
        `;
        break;

      case "get_series":
        result = await sql`
          SELECT * FROM series WHERE id = ${params.id}
        `;
        result = (result as unknown[])[0] || null;
        break;

      case "get_series_with_chapter_count":
        result = await sql`
          SELECT s.*, COALESCE(c.count, 0)::int as chapters_count
          FROM series s
          LEFT JOIN (
            SELECT series_id, COUNT(*)::int as count 
            FROM chapters GROUP BY series_id
          ) c ON s.id = c.series_id
          ORDER BY s.updated_at DESC
        `;
        break;

      case "get_chapters":
        result = await sql`
          SELECT * FROM chapters 
          WHERE series_id = ${params.series_id}
          ORDER BY chapter_number DESC
        `;
        break;

      case "get_chapter":
        const chapters = await sql`
          SELECT * FROM chapters WHERE id = ${params.id}
        `;
        const pages = await sql`
          SELECT * FROM chapter_pages 
          WHERE chapter_id = ${params.id}
          ORDER BY page_number ASC
        `;
        result = { chapter: (chapters as unknown[])[0], pages };
        break;

      case "get_genres":
        result = await sql`
          SELECT * FROM genres ORDER BY name ASC
        `;
        break;

      case "get_series_genres":
        result = await sql`
          SELECT g.* FROM genres g
          JOIN series_genres sg ON g.id = sg.genre_id
          WHERE sg.series_id = ${params.series_id}
        `;
        break;

      case "get_popular_series": {
        const period = params.time_period || "all";
        const limit = params.result_limit || 10;
        let startDate = new Date(0).toISOString();
        
        if (period === "weekly") {
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (period === "monthly") {
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        if (period === "all") {
          result = await sql`
            SELECT id, title, cover_url, status, type, total_views, total_views as period_views
            FROM series
            ORDER BY total_views DESC
            LIMIT ${limit}
          `;
        } else {
          result = await sql`
            SELECT s.id, s.title, s.cover_url, s.status, s.type, s.total_views,
              COALESCE(COUNT(cv.id), 0)::bigint as period_views
            FROM series s
            LEFT JOIN chapter_views cv ON cv.series_id = s.id 
              AND cv.viewed_at >= ${startDate}::timestamptz
            GROUP BY s.id
            HAVING COALESCE(COUNT(cv.id), 0) > 0
            ORDER BY COUNT(cv.id) DESC
            LIMIT ${limit}
          `;
        }
        break;
      }

      case "get_popular_series_with_genres": {
        const period = params.time_period || "all";
        const limit = params.result_limit || 10;
        let startDate = new Date(0).toISOString();
        
        if (period === "weekly") {
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (period === "monthly") {
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        let seriesData: unknown[];
        if (period === "all") {
          seriesData = await sql`
            SELECT id, title, cover_url, status, type, total_views, total_views as period_views
            FROM series
            ORDER BY total_views DESC
            LIMIT ${limit}
          ` as unknown[];
        } else {
          seriesData = await sql`
            SELECT s.id, s.title, s.cover_url, s.status, s.type, s.total_views,
              COALESCE(COUNT(cv.id), 0)::bigint as period_views
            FROM series s
            LEFT JOIN chapter_views cv ON cv.series_id = s.id 
              AND cv.viewed_at >= ${startDate}::timestamptz
            GROUP BY s.id
            HAVING COALESCE(COUNT(cv.id), 0) > 0
            ORDER BY COUNT(cv.id) DESC
            LIMIT ${limit}
          ` as unknown[];
        }

        // Fetch genres for all series
        const seriesIds = seriesData.map((s: any) => s.id);
        if (seriesIds.length > 0) {
          const genresData = await sql`
            SELECT sg.series_id, g.id, g.name, g.slug
            FROM series_genres sg
            JOIN genres g ON g.id = sg.genre_id
            WHERE sg.series_id = ANY(${seriesIds})
          `;

          const genresBySeries: Record<string, any[]> = {};
          for (const sg of genresData as any[]) {
            if (!genresBySeries[sg.series_id]) {
              genresBySeries[sg.series_id] = [];
            }
            genresBySeries[sg.series_id].push({
              id: sg.id,
              name: sg.name,
              slug: sg.slug,
            });
          }

          result = seriesData.map((s: any) => ({
            ...s,
            genres: genresBySeries[s.id] || [],
          }));
        } else {
          result = [];
        }
        break;
      }

      case "get_series_views":
        const viewsResult = await sql`
          SELECT total_views FROM series WHERE id = ${params.series_id}
        `;
        result = (viewsResult as any[])[0]?.total_views || 0;
        break;

      case "get_series_with_latest_chapters": {
        const limit = params.limit || 12;
        const seriesWithChapters = await sql`
          SELECT s.*, 
            (SELECT MAX(created_at) FROM chapters WHERE series_id = s.id) as latest_chapter_at
          FROM series s
          ORDER BY (SELECT MAX(created_at) FROM chapters WHERE series_id = s.id) DESC NULLS LAST
          LIMIT ${limit}
        `;

        // Get latest 3 chapters for each series
        const seriesIds = (seriesWithChapters as any[]).map((s) => s.id);
        if (seriesIds.length > 0) {
          const chaptersData = await sql`
            SELECT DISTINCT ON (series_id, chapter_number) *
            FROM chapters
            WHERE series_id = ANY(${seriesIds})
            ORDER BY series_id, chapter_number DESC, created_at DESC
          `;

          const chaptersBySeries: Record<string, any[]> = {};
          for (const ch of chaptersData as any[]) {
            if (!chaptersBySeries[ch.series_id]) {
              chaptersBySeries[ch.series_id] = [];
            }
            if (chaptersBySeries[ch.series_id].length < 3) {
              chaptersBySeries[ch.series_id].push(ch);
            }
          }

          result = (seriesWithChapters as any[]).map((s) => ({
            ...s,
            chapters: chaptersBySeries[s.id] || [],
          }));
        } else {
          result = [];
        }
        break;
      }

      case "get_featured_series": {
        const featuredSeries = await sql`
          SELECT s.*, 
            COALESCE((SELECT COUNT(*) FROM chapters WHERE series_id = s.id), 0)::int as chapters_count
          FROM series s
          WHERE s.is_featured = true
          ORDER BY s.updated_at DESC
        `;

        // Get genres for each series
        const seriesIds = (featuredSeries as any[]).map((s) => s.id);
        if (seriesIds.length > 0) {
          const genresData = await sql`
            SELECT sg.series_id, g.id, g.name, g.slug
            FROM series_genres sg
            JOIN genres g ON g.id = sg.genre_id
            WHERE sg.series_id = ANY(${seriesIds})
          `;

          const genresBySeries: Record<string, any[]> = {};
          for (const sg of genresData as any[]) {
            if (!genresBySeries[sg.series_id]) {
              genresBySeries[sg.series_id] = [];
            }
            genresBySeries[sg.series_id].push({
              id: sg.id,
              name: sg.name,
              slug: sg.slug,
            });
          }

          result = (featuredSeries as any[]).map((s) => ({
            ...s,
            chaptersCount: s.chapters_count,
            genres: genresBySeries[s.id] || [],
          }));
        } else {
          result = [];
        }
        break;
      }

      case "get_browse_series": {
        const page = Number(params.page) || 0;
        const pageSize = 18;
        const offset = page * pageSize;

        const seriesData = await sql`
          SELECT s.id, s.title, s.cover_url, s.status, s.type, s.updated_at,
            COALESCE((SELECT COUNT(*) FROM chapters WHERE series_id = s.id), 0)::int as chapters_count
          FROM series s
          ORDER BY s.updated_at DESC
          LIMIT ${pageSize}
          OFFSET ${offset}
        `;

        result = {
          series: (seriesData as any[]).map((s) => ({
            ...s,
            chaptersCount: s.chapters_count,
          })),
          nextPage: (seriesData as any[]).length === pageSize ? page + 1 : undefined,
        };
        break;
      }

      case "search_series": {
        const query = params.search_query || "";
        const status = params.filter_status;
        const type = params.filter_type;
        const genres = params.filter_genres as string[] | null;
        const sortBy = params.sort_by || "relevance";
        const limit = params.result_limit || 20;
        const offset = params.result_offset || 0;

        let results: any[];

        if (!query && !status && !type && (!genres || genres.length === 0)) {
          // No filters, return empty
          result = [];
          break;
        }

        // Build dynamic query based on filters
        if (query) {
          results = await sql`
            SELECT s.id, s.title, s.alternative_titles, s.description, 
              s.cover_url, s.status, s.type, s.rating, s.is_featured, s.updated_at,
              COALESCE((SELECT COUNT(*) FROM chapters WHERE series_id = s.id), 0)::int as chapters_count,
              CASE 
                WHEN LOWER(s.title) = LOWER(${query}) THEN 1.0
                WHEN LOWER(s.title) LIKE LOWER(${query}) || '%' THEN 0.9
                WHEN LOWER(s.title) LIKE '%' || LOWER(${query}) || '%' THEN 0.7
                ELSE 0.3
              END as relevance_score
            FROM series s
            WHERE 
              (LOWER(s.title) LIKE '%' || LOWER(${query}) || '%'
                OR s.alternative_titles::text ILIKE '%' || ${query} || '%'
                OR s.description ILIKE '%' || ${query} || '%')
              AND (${status}::text IS NULL OR s.status = ${status})
              AND (${type}::text IS NULL OR s.type = ${type})
            ORDER BY relevance_score DESC, s.updated_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          ` as any[];
        } else {
          results = await sql`
            SELECT s.id, s.title, s.alternative_titles, s.description, 
              s.cover_url, s.status, s.type, s.rating, s.is_featured, s.updated_at,
              COALESCE((SELECT COUNT(*) FROM chapters WHERE series_id = s.id), 0)::int as chapters_count,
              1.0 as relevance_score
            FROM series s
            WHERE (${status}::text IS NULL OR s.status = ${status})
              AND (${type}::text IS NULL OR s.type = ${type})
            ORDER BY s.updated_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          ` as any[];
        }

        // Filter by genres if provided
        if (genres && genres.length > 0) {
          const seriesIds = results.map((s) => s.id);
          if (seriesIds.length > 0) {
            const genreMatches = await sql`
              SELECT DISTINCT series_id
              FROM series_genres
              WHERE series_id = ANY(${seriesIds})
                AND genre_id = ANY(${genres})
            `;
            const matchingIds = new Set((genreMatches as any[]).map((g) => g.series_id));
            results = results.filter((s) => matchingIds.has(s.id));
          }
        }

        result = results;
        break;
      }

      // ============ WRITE OPERATIONS (require admin) ============
      case "create_series":
        if (!isAdmin) throw new Error("Unauthorized");
        result = await sql`
          INSERT INTO series (title, alternative_titles, description, cover_url, banner_url, status, type, rating, is_featured)
          VALUES (${params.title}, ${params.alternative_titles || []}, ${params.description || null}, 
            ${params.cover_url || null}, ${params.banner_url || null}, ${params.status || "ongoing"}, 
            ${params.type || "manhwa"}, ${params.rating || null}, ${params.is_featured || false})
          RETURNING *
        `;
        result = (result as unknown[])[0];
        break;

      case "update_series":
        if (!isAdmin) throw new Error("Unauthorized");
        result = await sql`
          UPDATE series SET
            title = COALESCE(${params.title}, title),
            alternative_titles = COALESCE(${params.alternative_titles}, alternative_titles),
            description = COALESCE(${params.description}, description),
            cover_url = COALESCE(${params.cover_url}, cover_url),
            banner_url = COALESCE(${params.banner_url}, banner_url),
            status = COALESCE(${params.status}, status),
            type = COALESCE(${params.type}, type),
            rating = ${params.rating},
            is_featured = COALESCE(${params.is_featured}, is_featured),
            updated_at = NOW()
          WHERE id = ${params.id}
          RETURNING *
        `;
        result = (result as unknown[])[0];
        break;

      case "delete_series":
        if (!isAdmin) throw new Error("Unauthorized");
        await sql`DELETE FROM series WHERE id = ${params.id}`;
        result = { success: true };
        break;

      case "create_chapter":
        if (!isAdmin) throw new Error("Unauthorized");
        const newChapter = await sql`
          INSERT INTO chapters (series_id, chapter_number, title, chapter_type, pdf_url)
          VALUES (${params.series_id}, ${params.chapter_number}, ${params.title || null}, 
            ${params.chapter_type || "images"}, ${params.pdf_url || null})
          RETURNING *
        `;
        const chapterId = (newChapter as any[])[0].id;

        // Insert pages if provided
        if (params.pages && Array.isArray(params.pages)) {
          for (const page of params.pages) {
            await sql`
              INSERT INTO chapter_pages (chapter_id, page_number, image_url)
              VALUES (${chapterId}, ${page.page_number}, ${page.image_url})
            `;
          }
        }

        // Update series updated_at
        await sql`UPDATE series SET updated_at = NOW() WHERE id = ${params.series_id}`;

        result = (newChapter as unknown[])[0];
        break;

      case "update_chapter":
        if (!isAdmin) throw new Error("Unauthorized");
        result = await sql`
          UPDATE chapters SET
            chapter_number = COALESCE(${params.chapter_number}, chapter_number),
            title = ${params.title}
          WHERE id = ${params.id}
          RETURNING *
        `;
        result = (result as unknown[])[0];
        break;

      case "delete_chapter":
        if (!isAdmin) throw new Error("Unauthorized");
        await sql`DELETE FROM chapters WHERE id = ${params.id}`;
        result = { success: true };
        break;

      case "create_genre":
        if (!isAdmin) throw new Error("Unauthorized");
        result = await sql`
          INSERT INTO genres (name, slug)
          VALUES (${params.name}, ${params.slug})
          RETURNING *
        `;
        result = (result as unknown[])[0];
        break;

      case "update_genre":
        if (!isAdmin) throw new Error("Unauthorized");
        result = await sql`
          UPDATE genres SET name = ${params.name}, slug = ${params.slug}
          WHERE id = ${params.id}
          RETURNING *
        `;
        result = (result as unknown[])[0];
        break;

      case "delete_genre":
        if (!isAdmin) throw new Error("Unauthorized");
        await sql`DELETE FROM genres WHERE id = ${params.id}`;
        result = { success: true };
        break;

      case "update_series_genres":
        if (!isAdmin) throw new Error("Unauthorized");
        await sql`DELETE FROM series_genres WHERE series_id = ${params.series_id}`;
        if (params.genre_ids && Array.isArray(params.genre_ids) && params.genre_ids.length > 0) {
          for (const genreId of params.genre_ids) {
            await sql`
              INSERT INTO series_genres (series_id, genre_id)
              VALUES (${params.series_id}, ${genreId})
            `;
          }
        }
        result = { success: true };
        break;

      case "record_chapter_view": {
        const viewerHash = params.viewer_hash;
        const chapterId = params.chapter_id;
        const seriesId = params.series_id;

        if (viewerHash) {
          // Rate limiting
          const recentViews = await sql`
            SELECT COUNT(*) as count FROM chapter_views
            WHERE viewer_hash = ${viewerHash}
              AND viewed_at > NOW() - INTERVAL '1 minute'
          `;
          if ((recentViews as any[])[0].count >= 10) {
            throw new Error("Rate limit exceeded");
          }

          // Deduplication
          const existingView = await sql`
            SELECT 1 FROM chapter_views
            WHERE chapter_id = ${chapterId}
              AND viewer_hash = ${viewerHash}
              AND viewed_at > NOW() - INTERVAL '1 hour'
            LIMIT 1
          `;
          if ((existingView as any[]).length > 0) {
            result = { success: true, recorded: false };
            break;
          }
        }

        await sql`
          INSERT INTO chapter_views (chapter_id, series_id, viewer_hash)
          VALUES (${chapterId}, ${seriesId}, ${viewerHash || null})
        `;
        await sql`
          UPDATE series SET total_views = total_views + 1 WHERE id = ${seriesId}
        `;
        result = { success: true, recorded: true };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Database error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: message.includes("Unauthorized") ? 401 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function verifyAdminToken(cookieHeader: string): Promise<boolean> {
  const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]*)/);
  if (!match) return false;
  
  const token = match[1];
  const secret = Deno.env.get("ADMIN_JWT_SECRET");
  if (!secret) return false;

  try {
    // Decode JWT manually (simple HS256 verification)
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) return false;

    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureInput = `${headerB64}.${payloadB64}`;
    const signature = base64UrlDecode(signatureB64);
    const signatureArrayBuffer = new ArrayBuffer(signature.length);
    new Uint8Array(signatureArrayBuffer).set(signature);
    
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureArrayBuffer,
      encoder.encode(signatureInput)
    );

    if (!valid) return false;

    // Check expiration
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return payload.role === "admin";
  } catch {
    return false;
  }
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function normalizeNeonConnectionString(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Common mistake: pasting the whole CLI command like:
  //   psql 'postgresql://user:pass@host/db?sslmode=require'
  // We want to extract just the URL part.
  if (trimmed.toLowerCase().startsWith("psql")) {
    const quoted = trimmed.match(/psql\s+['\"]([^'\"]+)['\"]/i);
    if (quoted?.[1]) return quoted[1].trim();

    const parts = trimmed.split(/\s+/).filter(Boolean);
    const maybeUrl = parts[1];
    if (maybeUrl) return maybeUrl.replace(/^['\"]|['\"]$/g, "").trim();
  }

  return trimmed.replace(/^['\"]|['\"]$/g, "").trim();
}
