import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  employeeService,
  payrollService,
  attendanceService,
} from "../services/api";

const AlertContext = createContext(null);

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlerts must be used within AlertProvider");
  return context;
};

function generateAlerts(employees, salaries, attendance) {
  const alerts = [];
  let id = 1;
  const today = new Date();

  employees.forEach((emp) => {
    if (!emp.HireDate) return;
    const hireDate = new Date(emp.HireDate);
    const years = today.getFullYear() - hireDate.getFullYear();
    if (years > 0 && years % 5 === 0) {
      const anniversaryThisYear = new Date(
        today.getFullYear(),
        hireDate.getMonth(),
        hireDate.getDate(),
      );
      const diffDays = Math.ceil(
        (anniversaryThisYear - today) / (1000 * 60 * 60 * 24),
      );
      if (diffDays >= -30 && diffDays <= 60) {
        alerts.push({
          id: id++,
          type: "anniversary",
          title: "Kỷ niệm ngày làm việc",
          message: `${emp.FullName} sẽ kỷ niệm ${years} năm làm việc`,
          severity: "info",
          read: diffDays < 0,
          date: anniversaryThisYear.toISOString().split("T")[0],
        });
      }
    }
  });

  attendance.forEach((record) => {
    if (record.LeaveDays > 3 || record.AbsentDays > 1) {
      alerts.push({
        id: id++,
        type: "leave",
        title: record.AbsentDays > 1 ? "Vắng mặt nhiều" : "Nghỉ phép nhiều",
        message: `${record.EmployeeName} có ${record.LeaveDays} ngày nghỉ phép và ${record.AbsentDays} ngày vắng mặt trong tháng ${record.Month}`,
        severity: record.AbsentDays > 2 ? "error" : "warning",
        read: false,
        date: today.toISOString().split("T")[0],
      });
    }
  });

  const salaryByEmployee = {};
  salaries.forEach((s) => {
    if (!salaryByEmployee[s.EmployeeID]) salaryByEmployee[s.EmployeeID] = [];
    salaryByEmployee[s.EmployeeID].push(s);
  });

  Object.values(salaryByEmployee).forEach((records) => {
    if (records.length < 2) return;
    records.sort((a, b) =>
      (a.SalaryMonth || "").localeCompare(b.SalaryMonth || ""),
    );
    const prev = records[records.length - 2];
    const curr = records[records.length - 1];
    if (prev.NetSalary && curr.NetSalary) {
      const diff = ((curr.NetSalary - prev.NetSalary) / prev.NetSalary) * 100;
      if (Math.abs(diff) > 10) {
        alerts.push({
          id: id++,
          type: "salary",
          title: "Chênh lệch lương",
          message: `${curr.EmployeeName}: lương thay đổi ${diff > 0 ? "+" : ""}${diff.toFixed(1)}% từ ${prev.SalaryMonth} sang ${curr.SalaryMonth}`,
          severity: "error",
          read: false,
          date: today.toISOString().split("T")[0],
        });
      }
    }
  });

  return alerts;
}

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, salRes, attRes] = await Promise.all([
          employeeService.getAll(),
          payrollService.getAll(),
          attendanceService.getAll(),
        ]);
        const generated = generateAlerts(empRes.data, salRes.data, attRes.data);
        setAlerts(generated);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu cảnh báo:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const markAsRead = useCallback((id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

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
