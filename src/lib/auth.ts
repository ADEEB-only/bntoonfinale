const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const AUTH_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/auth`;

interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

interface LoginResponse {
  user?: AuthUser;
  token?: string;
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
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || "Login failed" };
    }

    // Store token in localStorage
    if (result.token) {
      localStorage.setItem("admin_token", result.token);
    }

    return { user: result.user, token: result.token };
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function verifyToken(): Promise<VerifyResponse> {
  const token = localStorage.getItem("admin_token");
  if (!token) {
    return { valid: false };
  }

  try {
    const response = await fetch(`${AUTH_FUNCTION_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const result = await response.json();

    if (!response.ok) {
      localStorage.removeItem("admin_token");
      return { valid: false, error: result.error };
    }

    return { valid: result.valid, user: result.user };
  } catch (error) {
    console.error("Verify error:", error);
    return { valid: false };
  }
}

export function logout(): void {
  localStorage.removeItem("admin_token");
}

export function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("admin_token");
}
