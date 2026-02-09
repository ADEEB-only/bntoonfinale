import { useState, useEffect, useCallback } from "react";
import { login as authLogin, verifyToken, logout as authLogout } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    isAdmin: false,
  });

  const checkAuth = useCallback(async () => {
    const result = await verifyToken();
    
    if (result.valid && result.user) {
      setState({
        user: result.user,
        loading: false,
        isAuthenticated: true,
        isAdmin: result.user.role === "admin",
      });
    } else {
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
        isAdmin: false,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signIn = async (email: string, password: string) => {
    const result = await authLogin(email, password);
    
    if (result.error) {
      return { error: { message: result.error } };
    }

    if (result.user) {
      setState({
        user: result.user,
        loading: false,
        isAuthenticated: true,
        isAdmin: true,
      });
    }

    return { error: null };
  };

  const signOut = async () => {
    await authLogout();
    setState({
      user: null,
      loading: false,
      isAuthenticated: false,
      isAdmin: false,
    });
  };

  return {
    ...state,
    signIn,
    signOut,
    checkAuth,
  };
}
