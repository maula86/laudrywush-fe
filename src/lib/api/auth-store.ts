import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { LoginResponse, SessionUser } from "@/lib/api/types";

type SessionTokens = {
  readonly accessToken: string;
  readonly refreshToken: string;
};

type StoredSession = {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly user: SessionUser | null;
};

type AuthState = StoredSession & {
  // The backend has no /api/auth/me endpoint, so non-admin identity must survive reloads.
  readonly user: SessionUser | null;
  readonly setSession: (payload: LoginResponse) => void;
  readonly setTokens: (tokens: SessionTokens) => void;
  readonly clear: () => void;
};

const emptySession = (): StoredSession => ({
  accessToken: null,
  refreshToken: null,
  user: null,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...emptySession(),
      setSession: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      clear: () => set(emptySession()),
    }),
    { name: "laundrywush-auth", version: 1 },
  ),
);

export const getAccessToken = (): string | null => useAuthStore.getState().accessToken;

export const getRefreshToken = (): string | null => useAuthStore.getState().refreshToken;

export const getSessionUser = (): SessionUser | null => useAuthStore.getState().user;

export const setSession = (payload: LoginResponse): void =>
  useAuthStore.getState().setSession(payload);

export const setTokens = (tokens: SessionTokens): void => useAuthStore.getState().setTokens(tokens);

export const clearSession = (): void => useAuthStore.getState().clear();

export const useSessionUser = (): SessionUser | null => useAuthStore((state) => state.user);

export const useIsAuthenticated = (): boolean =>
  useAuthStore((state) => state.accessToken !== null);
