import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  const hasRole = useCallback(
    (role) => {
      if (!user) return false;
      // Check if user has role in roles array (new RBAC) or role property (legacy)
      if (user.roles && Array.isArray(user.roles)) {
        return user.roles.some(r => r.role_name === role) || user.roles.some(r => r.role_name === "Admin");
      }
      // Fallback to legacy role property
      return user.role === role || user.role === "Admin";
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};
