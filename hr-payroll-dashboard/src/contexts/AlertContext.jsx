import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { alertService } from "../services/api";

const AlertContext = createContext(null);

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlerts must be used within AlertProvider");
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await alertService.getAll();
      setAlerts(res.data || []);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu cảnh báo:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const markAsRead = useCallback(async (id) => {
    try {
      await alertService.markRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
      );
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unreadIds = alerts.filter((a) => !a.read).map((a) => a.id);
    try {
      await Promise.all(unreadIds.map((id) => alertService.markRead(id)));
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", error);
    }
  }, [alerts]);

  const deleteAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <AlertContext.Provider
      value={{
        alerts,
        loading,
        unreadCount,
        markAsRead,
        markAllRead,
        deleteAlert,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};
