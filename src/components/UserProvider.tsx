"use client";

import { createContext, useContext } from "react";

interface UserContextType {
  role: string | null;
  isAdmin: boolean;
  name: string | null;
  npp: string | null;
}

const UserContext = createContext<UserContextType>({
  role: null,
  isAdmin: false,
  name: null,
  npp: null,
});

export function UserProvider({
  children,
  role,
  name,
  npp,
}: {
  children: React.ReactNode;
  role?: string | null;
  name?: string | null;
  npp?: string | null;
}) {
  return (
    <UserContext.Provider
      value={{
        role: role ?? null,
        isAdmin: role === "ADMIN",
        name: name ?? null,
        npp: npp ?? null,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
