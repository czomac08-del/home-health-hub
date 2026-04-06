import { createContext, useContext, useState, type ReactNode } from "react";

export type UserRole = "homeowner" | "realtor" | "inspector" | "contractor";

interface RoleContextType {
  role: UserRole;
  setRole: (r: UserRole) => void;
}

const RoleContext = createContext<RoleContextType>({ role: "homeowner", setRole: () => {} });

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>("homeowner");
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
};

export const useRole = () => useContext(RoleContext);
