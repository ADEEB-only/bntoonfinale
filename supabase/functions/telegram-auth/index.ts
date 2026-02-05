const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};
 
 interface TelegramAuthData {
   id: number;
   first_name: string;
   last_name?: string;
   username?: string;
   photo_url?: string;
   auth_date: number;
   hash: string;
 }
 
 Deno.serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }
 
   try {
     const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
     const jwtSecret = Deno.env.get("ADMIN_JWT_SECRET");
 
     if (!botToken || !jwtSecret) {
       console.error("Missing TELEGRAM_BOT_TOKEN or ADMIN_JWT_SECRET");
       return new Response(
         JSON.stringify({ error: "Server misconfigured" }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const authData: TelegramAuthData = await req.json();
 
     // Validate required fields
     if (!authData.id || !authData.auth_date || !authData.hash) {
       return new Response(
         JSON.stringify({ error: "Missing required fields" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Check auth_date is not too old (24 hours)
     const now = Math.floor(Date.now() / 1000);
     if (now - authData.auth_date > 86400) {
       return new Response(
         JSON.stringify({ error: "Auth data expired" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Verify Telegram hash using HMAC-SHA256
     const isValid = await verifyTelegramAuth(authData, botToken);
     if (!isValid) {
       return new Response(
         JSON.stringify({ error: "Invalid authentication" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Create JWT
     const payload = {
       telegram_id: authData.id,
       telegram_username: authData.username || null,
       telegram_name: [authData.first_name, authData.last_name].filter(Boolean).join(" "),
       photo_url: authData.photo_url || null,
       iat: now,
       exp: now + 7 * 24 * 60 * 60, // 7 days
     };
 
     const token = await createJWT(payload, jwtSecret);
 
     // Set HttpOnly cookie
     const cookieOptions = [
       `tg_auth=${token}`,
       "HttpOnly",
       "Secure",
       "SameSite=Lax",
       "Path=/",
       `Max-Age=${7 * 24 * 60 * 60}`,
     ].join("; ");
 
     return new Response(
       JSON.stringify({
         success: true,
         user: {
           telegram_id: authData.id,
           telegram_username: authData.username,
           telegram_name: payload.telegram_name,
           photo_url: authData.photo_url,
         },
       }),
       {
         headers: {
           ...corsHeaders,
           "Content-Type": "application/json",
           "Set-Cookie": cookieOptions,
         },
       }
     );
   } catch (error) {
     console.error("Telegram auth error:", error);
     return new Response(
       JSON.stringify({ error: "Authentication failed" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });
 
 async function verifyTelegramAuth(
   data: TelegramAuthData,
   botToken: string
 ): Promise<boolean> {
   try {
     // Build check string
     const checkData = Object.entries(data)
       .filter(([key]) => key !== "hash")
       .sort(([a], [b]) => a.localeCompare(b))
       .map(([key, value]) => `${key}=${value}`)
       .join("\n");
 
     // Create secret key from bot token
     const encoder = new TextEncoder();
     const secretKeyData = await crypto.subtle.digest(
       "SHA-256",
       encoder.encode(botToken)
     );
 
     const secretKey = await crypto.subtle.importKey(
       "raw",
       secretKeyData,
       { name: "HMAC", hash: "SHA-256" },
       false,
       ["sign"]
     );
 
     // Calculate HMAC
     const signature = await crypto.subtle.sign(
       "HMAC",
       secretKey,
       encoder.encode(checkData)
     );
 
     // Convert to hex
     const calculatedHash = Array.from(new Uint8Array(signature))
       .map((b) => b.toString(16).padStart(2, "0"))
       .join("");
 
     return calculatedHash === data.hash;
   } catch (error) {
     console.error("Hash verification error:", error);
     return false;
   }
 }
 
 async function createJWT(
   payload: Record<string, unknown>,
   secret: string
 ): Promise<string> {
   const encoder = new TextEncoder();
 
   const header = { alg: "HS256", typ: "JWT" };
   const headerB64 = base64UrlEncode(JSON.stringify(header));
   const payloadB64 = base64UrlEncode(JSON.stringify(payload));
 
   const signatureInput = `${headerB64}.${payloadB64}`;
 
   const key = await crypto.subtle.importKey(
     "raw",
     encoder.encode(secret),
     { name: "HMAC", hash: "SHA-256" },
     false,
     ["sign"]
   );
 
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
 
 function base64UrlEncode(str: string): string {
   return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
 }