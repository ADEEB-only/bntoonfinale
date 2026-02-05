 import { neon } from "https://esm.sh/@neondatabase/serverless@0.10.4";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, cookie",
   "Access-Control-Allow-Credentials": "true",
 };
 
 // Simple in-memory rate limiter
 const rateLimitMap = new Map<number, { count: number; resetAt: number }>();
 
 function checkRateLimit(telegramId: number): boolean {
   const now = Date.now();
   const entry = rateLimitMap.get(telegramId);
 
   if (!entry || now > entry.resetAt) {
     rateLimitMap.set(telegramId, { count: 1, resetAt: now + 60000 }); // 1 minute window
     return true;
   }
 
   if (entry.count >= 5) {
     return false; // Max 5 comments per minute
   }
 
   entry.count++;
   return true;
 }
 
 // Basic XSS sanitization
 function sanitizeContent(content: string): string {
   return content
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&#x27;")
     .replace(/\//g, "&#x2F;")
     .trim()
     .slice(0, 2000); // Max 2000 chars
 }
 
 function normalizeNeonConnectionString(raw: string | null | undefined): string | null {
   if (!raw) return null;
   const trimmed = raw.trim();
   if (!trimmed) return null;
   if (trimmed.toLowerCase().startsWith("psql")) {
     const quoted = trimmed.match(/psql\s+['\"]([^'\"]+)['\"]/i);
     if (quoted?.[1]) return quoted[1].trim();
     const parts = trimmed.split(/\s+/).filter(Boolean);
     const maybeUrl = parts[1];
     if (maybeUrl) return maybeUrl.replace(/^['\"]|['\"]$/g, "").trim();
   }
   return trimmed.replace(/^['\"]|['\"]$/g, "").trim();
 }
 
 Deno.serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }
 
   try {
     const neonConnectionString = normalizeNeonConnectionString(
       Deno.env.get("NEON_DATABASE_URL")
     );
     if (!neonConnectionString) {
       throw new Error("Database not configured");
     }
 
     const sql = neon(neonConnectionString);
     const jwtSecret = Deno.env.get("ADMIN_JWT_SECRET");
 
     // Ensure comments table exists
     await sql`
       CREATE TABLE IF NOT EXISTS comments (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         series_id UUID NOT NULL,
         chapter_id UUID,
         telegram_id BIGINT NOT NULL,
         telegram_username TEXT,
         telegram_name TEXT NOT NULL,
         content TEXT NOT NULL,
         created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )
     `;
     
     // Create indexes if they don't exist
     await sql`CREATE INDEX IF NOT EXISTS idx_comments_series_id ON comments(series_id)`;
     await sql`CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON comments(chapter_id)`;
     await sql`CREATE INDEX IF NOT EXISTS idx_comments_telegram_id ON comments(telegram_id)`;
 
     const url = new URL(req.url);
 
     if (req.method === "GET") {
       // Public endpoint - get comments
       const seriesId = url.searchParams.get("seriesId");
       const chapterId = url.searchParams.get("chapterId");
 
       if (!seriesId) {
         return new Response(
           JSON.stringify({ error: "seriesId is required" }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       let comments;
       if (chapterId) {
         comments = await sql`
           SELECT id, series_id, chapter_id, telegram_id, telegram_username, telegram_name, content, created_at
           FROM comments
           WHERE series_id = ${seriesId} AND chapter_id = ${chapterId}
           ORDER BY created_at DESC
           LIMIT 100
         `;
       } else {
         comments = await sql`
           SELECT id, series_id, chapter_id, telegram_id, telegram_username, telegram_name, content, created_at
           FROM comments
           WHERE series_id = ${seriesId} AND chapter_id IS NULL
           ORDER BY created_at DESC
           LIMIT 100
         `;
       }
 
       return new Response(JSON.stringify({ data: comments }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     if (req.method === "POST") {
       // Protected endpoint - requires auth
       const cookieHeader = req.headers.get("cookie") || "";
       const authToken = extractCookie(cookieHeader, "tg_auth");
 
       if (!authToken || !jwtSecret) {
         return new Response(
           JSON.stringify({ error: "Unauthorized" }),
           { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       const user = await verifyJWT(authToken, jwtSecret);
       if (!user) {
         return new Response(
           JSON.stringify({ error: "Invalid or expired token" }),
           { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       // Rate limiting
       if (!checkRateLimit(user.telegram_id)) {
         return new Response(
           JSON.stringify({ error: "Rate limit exceeded. Please wait before posting again." }),
           { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       const body = await req.json();
       const { seriesId, chapterId, content } = body;
 
       if (!seriesId || !content || typeof content !== "string") {
         return new Response(
           JSON.stringify({ error: "seriesId and content are required" }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       const sanitizedContent = sanitizeContent(content);
       if (sanitizedContent.length === 0) {
         return new Response(
           JSON.stringify({ error: "Comment cannot be empty" }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       const result = await sql`
         INSERT INTO comments (series_id, chapter_id, telegram_id, telegram_username, telegram_name, content)
         VALUES (
           ${seriesId},
           ${chapterId || null},
           ${user.telegram_id},
           ${user.telegram_username || null},
           ${user.telegram_name},
           ${sanitizedContent}
         )
         RETURNING *
       `;
 
       return new Response(JSON.stringify({ data: result[0] }), {
         status: 201,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     return new Response(
       JSON.stringify({ error: "Method not allowed" }),
       { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Comments error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });
 
 function extractCookie(cookieHeader: string, name: string): string | null {
   const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
   return match ? match[1] : null;
 }
 
 interface JWTPayload {
   telegram_id: number;
   telegram_username: string | null;
   telegram_name: string;
   exp: number;
 }
 
 async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
   try {
     const [headerB64, payloadB64, signatureB64] = token.split(".");
     if (!headerB64 || !payloadB64 || !signatureB64) return null;
 
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
    const signatureBuffer = new ArrayBuffer(signature.length);
    new Uint8Array(signatureBuffer).set(signature);
 
     const valid = await crypto.subtle.verify(
       "HMAC",
       key,
      signatureBuffer,
       encoder.encode(signatureInput)
     );
 
     if (!valid) return null;
 
     const payload = JSON.parse(
       atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
     ) as JWTPayload;
 
     if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
       return null;
     }
 
     return payload;
   } catch {
     return null;
   }
 }
 
 function base64UrlDecode(str: string): Uint8Array {
   const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
   const padding = "=".repeat((4 - (base64.length % 4)) % 4);
   const binary = atob(base64 + padding);
   const bytes = new Uint8Array(binary.length);
   for (let i = 0; i < binary.length; i++) {
     bytes[i] = binary.charCodeAt(i);
   }
   return bytes;
 }