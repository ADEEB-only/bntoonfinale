import { neon } from "https://esm.sh/@neondatabase/serverless@0.10.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, email, password } = await req.json();
    const sql = neon(Deno.env.get("NEON_DATABASE_URL")!);

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

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'init_tables' or 'create_admin'" }),
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
