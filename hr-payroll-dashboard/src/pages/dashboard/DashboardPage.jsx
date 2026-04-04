import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  People,
  CheckCircle,
  Business,
  AttachMoney,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { reportService } from "../../services/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " VND";

const PIE_COLORS = ["#1565c0", "#2e7d32", "#7b1fa2", "#ed6c02", "#00838f"];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await reportService.getDashboardStats();
        setStats(res.data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !stats) {
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

  const statsCards = [
    {
      title: "Tổng nhân viên",
      value: stats.totalEmployees,
      icon: <People sx={{ fontSize: 40 }} />,
      color: "#1565c0",
    },
    {
      title: "Đang làm việc",
      value: stats.activeEmployees,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: "#2e7d32",
    },
    {
      title: "Phòng ban",
      value: stats.totalDepartments,
      icon: <Business sx={{ fontSize: 40 }} />,
      color: "#7b1fa2",
    },
    {
      title: "Tổng lương",
      value: formatCurrency(stats.totalPayroll),
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: "#ed6c02",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Tổng quan
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsCards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={2}
              sx={{
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

      {/* Info Tables */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Department Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Phân bổ phòng ban
              </Typography>
              <Box sx={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={stats.departmentDistribution || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label
                    >
                      {(stats.departmentDistribution || []).map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => [`${value} nhân viên`, "Số lượng"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Salary Trend */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Xu hướng lương hàng tháng
              </Typography>
              <Box sx={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={stats.monthlySalaryTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value) => [
                        formatCurrency(value),
                        "Tổng lương",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Tổng lương"
                      stroke="#ed6c02"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status & Attendance Summary */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Phân bổ trạng thái
              </Typography>
              <Box sx={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={stats.statusDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip
                      formatter={(value) => [`${value} nhân viên`, "Số lượng"]}
                    />
                    <Bar
                      dataKey="value"
                      name="Số lượng"
                      fill="#2e7d32"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Phân bổ giới tính
              </Typography>
              <Box sx={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={stats.genderDistribution || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {(stats.genderDistribution || []).map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) => [`${value} nhân viên`, "Số lượng"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Tổng hợp chấm công
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Số ngày
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell>Ngày làm việc</TableCell>
                      <TableCell align="right">
                        {stats.attendanceSummary?.totalWorkDays || 0}
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Ngày nghỉ phép</TableCell>
                      <TableCell align="right">
                        {stats.attendanceSummary?.totalLeaveDays || 0}
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Ngày vắng mặt</TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: "#d32f2f", fontWeight: 600 }}
                      >
                        {stats.attendanceSummary?.totalAbsentDays || 0}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
