import { neon } from "https://esm.sh/@neondatabase/serverless@0.10.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Verify admin JWT token for authentication
async function verifyAdminToken(authHeader: string | null): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  
  const token = authHeader.slice(7);
  const secret = Deno.env.get("ADMIN_JWT_SECRET");
  if (!secret) return false;
  
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureInput = `${headerB64}.${payloadB64}`;
    const base64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(base64 + padding);
    const signatureBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      signatureBytes[i] = binary.charCodeAt(i);
    }

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes.buffer,
      encoder.encode(signatureInput)
    );

    if (!valid) return false;

    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
    );

    // Check expiration and role
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }

    return payload.role === "admin";
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const sql = neon(Deno.env.get("NEON_DATABASE_URL")!);
    
    // Check if any admin exists
    let adminExists = false;
    try {
      const existing = await sql`SELECT COUNT(*) as count FROM admin_users`;
      adminExists = (existing as any[])[0]?.count > 0;
    } catch {
      // Table doesn't exist yet, allow init_tables without auth
      adminExists = false;
    }

    const { action, email, password, setup_secret } = await req.json();

    // Password reset uses ADMIN_JWT_SECRET as a recovery mechanism
    const isPasswordReset = action === "reset_password" && setup_secret === Deno.env.get("ADMIN_JWT_SECRET");

    // If admins exist and this isn't a password reset, require authentication
    if (adminExists && !isPasswordReset) {
      const authHeader = req.headers.get("Authorization");
      const isAdmin = await verifyAdminToken(authHeader);
      
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - admin authentication required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "init_tables") {
      // Create all required tables
      console.log("Creating tables...");

      await sql`
        CREATE TABLE IF NOT EXISTS series (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          alternative_titles TEXT[] DEFAULT '{}',
          description TEXT,
          cover_url TEXT,
          banner_url TEXT,
          status TEXT NOT NULL DEFAULT 'ongoing',
          type TEXT NOT NULL DEFAULT 'manhwa',
          rating NUMERIC,
          is_featured BOOLEAN NOT NULL DEFAULT false,
          total_views BIGINT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      console.log("Created series table");

      await sql`
        CREATE TABLE IF NOT EXISTS chapters (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
          chapter_number NUMERIC NOT NULL,
          title TEXT,
          chapter_type TEXT NOT NULL DEFAULT 'images',
          pdf_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      console.log("Created chapters table");

      await sql`
        CREATE TABLE IF NOT EXISTS chapter_pages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
          page_number INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      console.log("Created chapter_pages table");

      await sql`
        CREATE TABLE IF NOT EXISTS genres (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      console.log("Created genres table");

      await sql`
        CREATE TABLE IF NOT EXISTS series_genres (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
          genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(series_id, genre_id)
        )
      `;
      console.log("Created series_genres table");

      await sql`
        CREATE TABLE IF NOT EXISTS chapter_views (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chapter_id UUID NOT NULL,
          series_id UUID NOT NULL,
          viewer_hash TEXT,
          viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      console.log("Created chapter_views table");

      await sql`
        CREATE TABLE IF NOT EXISTS admin_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      console.log("Created admin_users table");

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_chapters_series_id ON chapters(series_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chapter_pages_chapter_id ON chapter_pages(chapter_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_series_genres_series_id ON series_genres(series_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_series_genres_genre_id ON series_genres(genre_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chapter_views_series_id ON chapter_views(series_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chapter_views_viewed_at ON chapter_views(viewed_at)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_series_updated_at ON series(updated_at DESC)`;
      console.log("Created indexes");

      return new Response(
        JSON.stringify({ success: true, message: "All tables created successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create_admin") {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate password hash
      const salt = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
      const encoder = new TextEncoder();
      const data = encoder.encode(salt + password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      const passwordHash = `sha256:${salt}:${hash}`;

      // Check if admin exists
      const existing = await sql`SELECT id FROM admin_users WHERE email = ${email.toLowerCase().trim()}`;
      
      if ((existing as any[]).length > 0) {
        // Update existing admin
        await sql`
          UPDATE admin_users 
          SET password_hash = ${passwordHash}
          WHERE email = ${email.toLowerCase().trim()}
        `;
        return new Response(
          JSON.stringify({ success: true, message: "Admin user updated" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create new admin
      await sql`
        INSERT INTO admin_users (email, password_hash)
        VALUES (${email.toLowerCase().trim()}, ${passwordHash})
      `;

      return new Response(
        JSON.stringify({ success: true, message: "Admin user created" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset_password") {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate new password hash
      const salt = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
      const encoder = new TextEncoder();
      const data = encoder.encode(salt + password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      const passwordHash = `sha256:${salt}:${hash}`;

      // Update password
      const result = await sql`
        UPDATE admin_users 
        SET password_hash = ${passwordHash}
        WHERE email = ${email.toLowerCase().trim()}
        RETURNING id
      `;

      if ((result as any[]).length === 0) {
        return new Response(
          JSON.stringify({ error: "Admin user not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Password reset for:", email);
      return new Response(
        JSON.stringify({ success: true, message: "Password reset successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Setup error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
