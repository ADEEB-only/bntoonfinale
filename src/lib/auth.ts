const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const AUTH_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/auth`;

interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

interface LoginResponse {
  user?: AuthUser;
  error?: string;
}

interface VerifyResponse {
  valid?: boolean;
  user?: AuthUser;
  error?: string;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    const response = await fetch(`${AUTH_FUNCTION_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Login failed" };
    }

    return { user: result.user };
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function verifyToken(): Promise<VerifyResponse> {
  try {
    const response = await fetch(`${AUTH_FUNCTION_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      return { valid: false, error: result.error };
    }

    return { valid: result.valid, user: result.user };
  } catch (error) {
    console.error("Verify error:", error);
    return { valid: false };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${AUTH_FUNCTION_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  }
}

export function isAuthenticated(): boolean {
  // Can't check HttpOnly cookies from JS; rely on server verification
  return false;
}
