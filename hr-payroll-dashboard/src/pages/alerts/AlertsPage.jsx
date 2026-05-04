import { useMemo, useState } from "react";
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
import { useAlerts } from "../../contexts/AlertContext";

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

export default function AlertsPage() {
  const { alerts, loading, unreadCount, markAsRead, markAllRead, deleteAlert } = useAlerts();
  const [activeFilter, setActiveFilter] = useState("Tất cả");

  const filteredAlerts = useMemo(() => {
    const type = filterMap[activeFilter];
    if (type === "all") return alerts;
    return alerts.filter((alert) => alert.type === type);
  }, [alerts, activeFilter]);

  const totalCount = alerts.length;
  const criticalCount = alerts.filter((a) => a.severity === "error").length;

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
          onClick={markAllRead}
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
                            onClick={() => markAsRead(alert.id)}
                            sx={{ color: severityColor }}
                          >
                            <MarkEmailRead fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Xóa">
                        <IconButton
                          size="small"
                          onClick={() => deleteAlert(alert.id)}
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
