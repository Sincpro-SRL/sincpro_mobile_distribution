import React, { createContext, useContext, useMemo } from "react";

type IHomeContext = Record<string, never>;

const HomeContext = createContext<IHomeContext | null>(null);

export function HomeProvider({ children }: { readonly children: React.ReactNode }) {
  const value = useMemo<IHomeContext>(() => ({}), []);

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}

export function useHome() {
  const ctx = useContext(HomeContext);
  if (!ctx) throw new Error("useHome must be used within HomeProvider");
  return ctx;
}
