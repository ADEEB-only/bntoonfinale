import { neon } from "https://esm.sh/@neondatabase/serverless@0.10.4";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

interface VerifyRequest {
  token: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    if (action === "login") {
      return await handleLogin(req, corsHeaders);
    } else if (action === "verify") {
      return await handleVerify(req, corsHeaders);
    } else if (action === "logout") {
      return handleLogout(corsHeaders);
    } else {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Auth error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function handleLogout(corsHeaders: Record<string, string>): Response {
  const clearCookie = [
    "admin_token=",
    "HttpOnly",
    "Secure",
    "SameSite=None",
    "Path=/",
    "Max-Age=0",
  ].join("; ");

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Set-Cookie": clearCookie,
      },
    }
  );
}

async function handleLogin(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
  const { email, password } = (await req.json()) as LoginRequest;

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "Email and password are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const neonUrl = Deno.env.get("NEON_DATABASE_URL");
  if (!neonUrl) {
    console.error("NEON_DATABASE_URL not configured");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const sql = neon(neonUrl);

  // Fetch admin user
  console.log("Looking up user:", email.toLowerCase().trim());
  const users = await sql`
    SELECT id, email, password_hash FROM admin_users
    WHERE email = ${email.toLowerCase().trim()}
  `;

  console.log("Users found:", (users as any[]).length);

  if ((users as any[]).length === 0) {
    console.log("No user found with email:", email);
    return new Response(
      JSON.stringify({ error: "Invalid credentials" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const user = (users as any[])[0];
  console.log("User found, checking password. Hash format:", user.password_hash?.substring(0, 20) + "...");

  // Verify password using bcrypt-style comparison
  const isValid = await verifyPassword(password, user.password_hash);
  console.log("Password verification result:", isValid);
  
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: "Invalid credentials" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Generate JWT token
  const secret = Deno.env.get("ADMIN_JWT_SECRET")!;
  const token = await generateJWT(
    {
      sub: user.id,
      email: user.email,
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
    secret
  );

  // Set token as HttpOnly cookie instead of returning it to client
  const cookieOptions = [
    `admin_token=${token}`,
    "HttpOnly",
    "Secure",
    "SameSite=None",
    "Path=/",
    `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
  ].join("; ");

  return new Response(
    JSON.stringify({
      user: { id: user.id, email: user.email },
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Set-Cookie": cookieOptions,
      },
    }
  );
}

async function handleVerify(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
  // Read token from cookie instead of request body
  const cookieHeader = req.headers.get("Cookie") || "";
  const token = parseCookie(cookieHeader, "admin_token");

  if (!token) {
    return new Response(
      JSON.stringify({ valid: false }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const secret = Deno.env.get("ADMIN_JWT_SECRET")!;
  const payload = await verifyJWT(token, secret);

  if (!payload) {
    return new Response(
      JSON.stringify({ valid: false }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      valid: true,
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      },
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

// Simple password verification (constant-time comparison)
async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // The hash format: sha256:salt:hash
  const parts = hash.split(":");
  if (parts.length !== 3 || parts[0] !== "sha256") {
    return false;
  }

  const salt = parts[1];
  const storedHash = parts[2];

  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (storedHash.length !== computedHash.length) return false;
  let result = 0;
  for (let i = 0; i < storedHash.length; i++) {
    result |= storedHash.charCodeAt(i) ^ computedHash.charCodeAt(i);
  }
  return result === 0;
}

async function generateJWT(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureInput = `${headerB64}.${payloadB64}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signatureInput)
  );

  const signatureB64 = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

async function verifyJWT(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
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
    const signatureArrayBuffer = new ArrayBuffer(signature.length);
    new Uint8Array(signatureArrayBuffer).set(signature);

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureArrayBuffer,
      encoder.encode(signatureInput)
    );

    if (!valid) return null;

    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
    );

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
