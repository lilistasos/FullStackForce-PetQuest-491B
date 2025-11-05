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
          console.log("⚠️ No stored credentials found. User needs to log in.");
          // Removed demo user auto-login - users must log in
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
