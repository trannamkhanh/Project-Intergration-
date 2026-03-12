import { useState, useMemo } from "react";
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
  Divider,
  Alert as MuiAlert,
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
import { mockAlerts } from "../../services/mockData";

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
  anniversary: "Anniversary",
  leave: "Leave",
  salary: "Salary",
};

const filterOptions = ["All", "Anniversary", "Leave", "Salary"];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [activeFilter, setActiveFilter] = useState("All");

  // --- Derived data ---
  const filteredAlerts = useMemo(() => {
    if (activeFilter === "All") return alerts;
    return alerts.filter((alert) => alert.type === activeFilter.toLowerCase());
  }, [alerts, activeFilter]);

  const totalCount = alerts.length;
  const unreadCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.severity === "error").length;

  // --- Handlers ---
  const handleMarkAsRead = (id) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, read: true } : alert)),
    );
  };

  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
  };

  const handleDelete = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  // --- Summary cards config ---
  const summaryCards = [
    {
      title: "Total Alerts",
      value: totalCount,
      icon: <Notifications sx={{ fontSize: 36 }} />,
      color: "#1565c0",
    },
    {
      title: "Unread",
      value: unreadCount,
      icon: <NotificationsActive sx={{ fontSize: 36 }} />,
      color: "#ed6c02",
    },
    {
      title: "Critical",
      value: criticalCount,
      icon: <Warning sx={{ fontSize: 36 }} />,
      color: "#d32f2f",
    },
  ];

  return (
    <Box>
      {/* ---- Header ---- */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Alerts & Notifications</Typography>
        <Button
          variant="contained"
          startIcon={<MarkEmailRead />}
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          Mark All Read
        </Button>
      </Box>

      {/* ---- Filter Chips ---- */}
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

      {/* ---- Summary Cards ---- */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 4 }}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 2,
                borderTop: `4px solid ${card.color}`,
              }}
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

      {/* ---- Alerts List ---- */}
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
              No alerts to display
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {activeFilter !== "All"
                ? `There are no ${activeFilter.toLowerCase()} alerts at this time.`
                : "All caught up! There are no alerts at this time."}
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
                    elevation: 4,
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  },
                }}
              >
                <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                    }}
                  >
                    {/* Alert Icon */}
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

                    {/* Alert Content */}
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
                          sx={{
                            fontWeight: alert.read ? 500 : 700,
                          }}
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
                            label="NEW"
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
                        {formatDate(alert.date)}
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      {!alert.read && (
                        <Tooltip title="Mark as Read">
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsRead(alert.id)}
                            sx={{ color: severityColor }}
                          >
                            <MarkEmailRead fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
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
