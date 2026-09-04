import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { clearToken, getToken } from "@/api/client";

/** Client-side auth state backed by the JWT in localStorage. */
export function useAuth() {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    setTokenState(getToken());
    setHydrated(true);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    void navigate({ to: "/auth" });
  }, [navigate]);

  return { token, isAuthenticated: Boolean(token), hydrated, logout };
}

/** Redirects to /auth once hydration proves there is no token. */
export function useRequireAuth() {
  const { hydrated, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      void navigate({ to: "/auth" });
    }
  }, [hydrated, isAuthenticated, navigate]);

  return { ready: hydrated && isAuthenticated };
}
