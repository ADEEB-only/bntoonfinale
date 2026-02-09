function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Credentials": "true",
  };
}

const REGION_CANDIDATES = ["", "ny", "la", "sg", "de", "uk", "syd", "br"] as const;

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const v = item.trim();
    if (!v) continue;
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function regionToHost(region: string): string {
  return region ? `${region}.storage.bunnycdn.com` : "storage.bunnycdn.com";
}

function buildHostCandidates(configuredRegion: string): string[] {
  // Try configured region first (if any), then the default host, then common regions.
  return uniqueStrings([
    regionToHost(configuredRegion || ""),
    ...REGION_CANDIDATES.map((r) => regionToHost(r)),
  ]);
}

async function tryBunnyPut(params: {
  hosts: string[];
  storageZone: string;
  path: string;
  apiKey: string;
  contentType: string;
  body: ArrayBuffer;
}): Promise<{ publicStorageHost: string; detectedRegion?: string } | { error: string }> {
  let last401 = false;
  let lastError: { status: number; body: string; host: string } | null = null;

  for (const host of params.hosts) {
    const uploadUrl = `https://${host}/${params.storageZone}/${params.path}`;
    console.log("Uploading to:", uploadUrl);

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: params.apiKey,
        "Content-Type": params.contentType,
      },
      body: params.body,
    });

    if (res.ok) {
      const detectedRegion = host === "storage.bunnycdn.com" ? "" : host.split(".")[0];
      return {
        publicStorageHost: host,
        detectedRegion,
      };
    }

    const text = await res.text();
    console.error("Bunny upload error:", text);
    console.error("Status:", res.status);
    lastError = { status: res.status, body: text, host };

    if (res.status === 401) {
      last401 = true;
      // Keep trying other regions/hosts.
      continue;
    }

    // Non-auth error: stop immediately.
    return { error: `Bunny upload failed on ${host} [${res.status}]: ${text}` };
  }

  if (last401) {
    const attempted = params.hosts.join(", ");
    const hint =
      "Bunny responded 401 for all tested endpoints. This usually means either BUNNY_STORAGE_API_KEY is not the Storage Zone Password, or BUNNY_STORAGE_ZONE is not the exact storage zone name.";
    const last = lastError
      ? ` Last response on ${lastError.host}: ${lastError.body}`
      : "";
    return {
      error:
        `${hint} Attempted hosts: ${attempted}.` +
        ` If your storage zone is region-specific, set BUNNY_STORAGE_REGION to one of: ${REGION_CANDIDATES.filter(Boolean).join(", ")}.` +
        last,
    };
  }

  return { error: "Failed to upload file to storage" };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify admin token from cookie
    const cookieHeader = req.headers.get("Cookie") || "";
    const isAdmin = await verifyAdminToken(cookieHeader);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storageZone = Deno.env.get("BUNNY_STORAGE_ZONE");
    const apiKey = Deno.env.get("BUNNY_STORAGE_API_KEY");
    const cdnHostname = Deno.env.get("BUNNY_CDN_HOSTNAME");
    // Optional: specify region (ny, la, sg, de, uk, syd, br) or leave empty for default
    const storageRegion = Deno.env.get("BUNNY_STORAGE_REGION") || "";

    if (!storageZone || !apiKey || !cdnHostname) {
      console.error("Missing Bunny.net configuration:", {
        hasStorageZone: !!storageZone,
        hasApiKey: !!apiKey,
        hasCdnHostname: !!cdnHostname,
      });
      return new Response(
        JSON.stringify({ error: "Storage not configured properly" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;
    const action = (formData.get("action") as string) || "upload";

    const hostCandidates = buildHostCandidates(storageRegion);

    if (action === "delete") {
      // Delete file from Bunny.net
      // Try delete against host candidates (some zones require region-specific host)
      let deleted = false;
      let lastErr: { status: number; body: string; host: string } | null = null;

      for (const host of hostCandidates) {
        const deleteUrl = `https://${host}/${storageZone}/${path}`;
        console.log("Deleting from:", deleteUrl);

        const deleteResponse = await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            AccessKey: apiKey,
          },
        });

        if (deleteResponse.ok || deleteResponse.status === 404) {
          deleted = true;
          break;
        }

        const errorText = await deleteResponse.text();
        console.error("Bunny delete error:", errorText);
        lastErr = { status: deleteResponse.status, body: errorText, host };

        if (deleteResponse.status === 401) {
          continue;
        }

        throw new Error(`Failed to delete file on ${host} [${deleteResponse.status}]: ${errorText}`);
      }

      if (!deleted) {
        throw new Error(
          `Failed to delete file from storage (auth failed). Last: ${lastErr?.host} [${lastErr?.status}] ${lastErr?.body}`
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload file
    if (!file || !path) {
      return new Response(
        JSON.stringify({ error: "File and path are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log("File size:", uint8Array.length, "bytes");
    console.log("Content-Type:", file.type);

    const putResult = await tryBunnyPut({
      hosts: hostCandidates,
      storageZone,
      path,
      apiKey,
      contentType: file.type || "application/octet-stream",
      body: arrayBuffer,
    });

    if ("error" in putResult) {
      return new Response(JSON.stringify({ error: putResult.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (putResult.detectedRegion && putResult.detectedRegion !== storageRegion) {
      console.log(
        `Detected Bunny storage region '${putResult.detectedRegion}'. Consider setting BUNNY_STORAGE_REGION to avoid retries.`
      );
    }

    const publicUrl = `https://${cdnHostname}/${path}`;
    console.log("Upload successful, public URL:", publicUrl);

    return new Response(
      JSON.stringify({
        url: publicUrl,
        // Extra debug info (safe to expose):
        storage_host_used: putResult.publicStorageHost,
        detected_region: putResult.detectedRegion,
      }),
      {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
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
