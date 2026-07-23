"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AuthUser, SavedScore } from "@/lib/data";

interface UserContextValue {
  user: AuthUser | null;
  login: (u: AuthUser) => void;
  signOut: () => void;
  saveScore: (e: SavedScore) => void;
  scores: SavedScore[];
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [scores, setScores] = useState<SavedScore[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("av_user");
      if (raw) setUser(JSON.parse(raw));
      const rawScores = localStorage.getItem("av_scores");
      if (rawScores) setScores(JSON.parse(rawScores));
    } catch {
      // ignore malformed data
    }
  }, []);

  const login = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem("av_user", JSON.stringify(u));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("av_user");
  };

  const saveScore = (e: SavedScore) => {
    setScores((prev) => {
      const next = [...prev, e];
      localStorage.setItem("av_scores", JSON.stringify(next));
      return next;
    });
  };

  return (
    <UserContext.Provider value={{ user, login, signOut, saveScore, scores }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (ctx === undefined) {
    throw new Error("useUser must be used inside <UserProvider>");
  }
  return ctx;
}
