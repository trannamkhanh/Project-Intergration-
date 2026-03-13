import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Badge,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Notifications,
  Cake,
  EventBusy,
  TrendingDown,
  MarkEmailRead,
  Delete,
  NotificationsActive,
  Warning,
  CheckCircle,
} from "@mui/icons-material";
import {
  employeeService,
  payrollService,
  attendanceService,
} from "../../services/api";

const severityColorMap = {
  info: "#1565c0",
  warning: "#ed6c02",
  error: "#d32f2f",
};

const severityBgMap = {
  info: "#e3f2fd",
  warning: "#fff3e0",
  error: "#fbe9e7",
};

const typeIconMap = {
  anniversary: <Cake />,
  leave: <EventBusy />,
  salary: <TrendingDown />,
};

const typeLabelMap = {
  anniversary: "Kỷ niệm",
  leave: "Nghỉ phép",
  salary: "Lương",
};

const filterOptions = ["Tất cả", "Kỷ niệm", "Nghỉ phép", "Lương"];
const filterMap = {
  "Tất cả": "all",
  "Kỷ niệm": "anniversary",
  "Nghỉ phép": "leave",
  Lương: "salary",
};

function formatDateVN(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function generateAlerts(employees, salaries, attendance) {
  const alerts = [];
  let id = 1;
  const today = new Date();

  // Cảnh báo kỷ niệm ngày vào làm
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

  // Cảnh báo nghỉ phép quá hạn
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

  // Cảnh báo chênh lệch lương
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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Tất cả");

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

  const filteredAlerts = useMemo(() => {
    const type = filterMap[activeFilter];
    if (type === "all") return alerts;
    return alerts.filter((alert) => alert.type === type);
  }, [alerts, activeFilter]);

  const totalCount = alerts.length;
  const unreadCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.severity === "error").length;

  const handleMarkAsRead = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
    );
  };

  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const handleDelete = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const summaryCards = [
    {
      title: "Tổng cảnh báo",
      value: totalCount,
      icon: <Notifications sx={{ fontSize: 36 }} />,
      color: "#1565c0",
    },
    {
      title: "Chưa đọc",
      value: unreadCount,
      icon: <NotificationsActive sx={{ fontSize: 36 }} />,
      color: "#ed6c02",
    },
    {
      title: "Nghiêm trọng",
      value: criticalCount,
      icon: <Warning sx={{ fontSize: 36 }} />,
      color: "#d32f2f",
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải dữ liệu...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Cảnh báo & Thông báo</Typography>
        <Button
          variant="contained"
          startIcon={<MarkEmailRead />}
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
        {filterOptions.map((filter) => (
          <Chip
            key={filter}
            label={filter}
            onClick={() => setActiveFilter(filter)}
            color={activeFilter === filter ? "primary" : "default"}
            variant={activeFilter === filter ? "filled" : "outlined"}
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 4 }}>
            <Card
              elevation={3}
              sx={{ borderRadius: 2, borderTop: `4px solid ${card.color}` }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      backgroundColor: `${card.color}14`,
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", fontWeight: 500 }}
                    >
                      {card.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {card.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredAlerts.length === 0 ? (
        <Card elevation={3} sx={{ borderRadius: 2 }}>
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 6,
            }}
          >
            <CheckCircle sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "text.secondary" }}>
              Không có cảnh báo nào
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {activeFilter !== "Tất cả"
                ? `Không có cảnh báo loại "${activeFilter}" vào lúc này.`
                : "Không có cảnh báo nào vào lúc này."}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredAlerts.map((alert) => {
            const severityColor = severityColorMap[alert.severity];
            const severityBg = severityBgMap[alert.severity];
            return (
              <Card
                key={alert.id}
                elevation={alert.read ? 1 : 3}
                sx={{
                  borderRadius: 2,
                  borderLeft: `4px solid ${severityColor}`,
                  opacity: alert.read ? 0.85 : 1,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  },
                }}
              >
                <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}
                  >
                    <Badge
                      variant="dot"
                      invisible={alert.read}
                      color="error"
                      sx={{ mt: 0.5 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          backgroundColor: severityBg,
                          color: severityColor,
                        }}
                      >
                        {typeIconMap[alert.type]}
                      </Box>
                    </Badge>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: alert.read ? 500 : 700 }}
                        >
                          {alert.title}
                        </Typography>
                        <Chip
                          label={typeLabelMap[alert.type]}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            backgroundColor: severityBg,
                            color: severityColor,
                          }}
                        />
                        {!alert.read && (
                          <Chip
                            label="MỚI"
                            size="small"
                            color="error"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          fontWeight: alert.read ? 400 : 500,
                          mb: 0.5,
                        }}
                      >
                        {alert.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {formatDateVN(alert.date)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      {!alert.read && (
                        <Tooltip title="Đánh dấu đã đọc">
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsRead(alert.id)}
                            sx={{ color: severityColor }}
                          >
                            <MarkEmailRead fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Xóa">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(alert.id)}
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "error.main" },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
