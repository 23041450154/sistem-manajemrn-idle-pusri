"use client";

import { createContext, useContext, useCallback } from "react";
import { ActionType, hasPermission as checkPermission } from "@/config/rbac";

interface UserContextType {
  role: string | null;
  isAdmin: boolean;
  name: string | null;
  npp: string | null;
  hasPermission: (action: ActionType) => boolean;
}

const UserContext = createContext<UserContextType>({
  role: null,
  isAdmin: false,
  name: null,
  npp: null,
  hasPermission: () => false,
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
  const currentRole = role ?? null;

  const hasPermission = useCallback(
    (action: ActionType) => {
      return checkPermission(currentRole, action);
    },
    [currentRole]
  );

  return (
    <UserContext.Provider
      value={{
        role: currentRole,
        isAdmin: currentRole === "ADMIN",
        name: name ?? null,
        npp: npp ?? null,
        hasPermission,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
