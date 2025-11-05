import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

type Role = "child" | "parent" | "indv";
type User = {
  id: string;
  email: string;
  username?: string;
  role: Role;
  name?: string;
  firstName?: string;
  lastName?: string;
  profileImageUri?: string;
  dateOfBirth?: string;
  familyCode?: string;
  token?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await SecureStore.getItemAsync("token");
        const u = await SecureStore.getItemAsync("user");

        if (t && u) {
          setToken(t);
          setUser(JSON.parse(u));
          console.log("✅ Loaded saved user and token");
        } else {
          console.log("⚠️ No stored credentials found, loading demo user for testing.");

          // ✅ Preload demo account and token
          const demoUser: User = {
            id: "1c2fcc1c-0497-462c-9779-803dc06251f8", // match backend ID
            email: "demo@example.com",
            role: "individual",
            firstName: "Demo",
            lastName: "User",
          };

          const demoToken =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZTYzZDhhYS1kNTZmLTQ5MTMtYTBhMi1lZjFmNTc4MjIyOTIiLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJpYXQiOjE3NjIyOTYyNTMsImV4cCI6MTc2MjkwMTA1M30.OnHEhpkF-IN1FEmP-U-xYgCvLpEmK_EvOumHxt0R1X0";

          setUser(demoUser);
          setToken(demoToken);
          await SecureStore.setItemAsync("user", JSON.stringify(demoUser));
          await SecureStore.setItemAsync("token", demoToken);

          console.log("✅ Demo user and token loaded into SecureStore");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (t: string, u: User) => {
    try {
      setToken(t);
      setUser(u);
      await SecureStore.setItemAsync("token", t);
      await SecureStore.setItemAsync("user", JSON.stringify(u));
      console.log("✅ Token and user saved to SecureStore");
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return; // nothing to update if not logged in
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, updateUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
