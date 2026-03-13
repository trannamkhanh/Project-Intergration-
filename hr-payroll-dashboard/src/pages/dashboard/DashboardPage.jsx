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
import { reportService } from "../../services/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " VND";

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
        console.error("Loi khi tai du lieu dashboard:", error);
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
        <Typography sx={{ ml: 2 }}>Dang tai du lieu...</Typography>
      </Box>
    );
  }

  const statsCards = [
    {
      title: "Tong nhan vien",
      value: stats.totalEmployees,
      icon: <People sx={{ fontSize: 40 }} />,
      color: "#1565c0",
    },
    {
      title: "Dang lam viec",
      value: stats.activeEmployees,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: "#2e7d32",
    },
    {
      title: "Phong ban",
      value: stats.totalDepartments,
      icon: <Business sx={{ fontSize: 40 }} />,
      color: "#7b1fa2",
    },
    {
      title: "Tong luong",
      value: formatCurrency(stats.totalPayroll),
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: "#ed6c02",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Tong quan
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
                Phan bo phong ban
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Phong ban</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        So nhan vien
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(stats.departmentDistribution || []).map((dept) => (
                      <TableRow key={dept.name} hover>
                        <TableCell>{dept.name}</TableCell>
                        <TableCell align="right">{dept.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Salary Trend */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Xu huong luong hang thang
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Thang</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Tong luong
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(stats.monthlySalaryTrend || []).map((item) => (
                      <TableRow key={item.month} hover>
                        <TableCell>{item.month}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
                Phan bo trang thai
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Trang thai</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        So luong
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(stats.statusDistribution || []).map((item) => (
                      <TableRow key={item.name} hover>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Phan bo gioi tinh
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Gioi tinh</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        So luong
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(stats.genderDistribution || []).map((item) => (
                      <TableRow key={item.name} hover>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Tong hop cham cong
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Loai</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        So ngay
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell>Ngay lam viec</TableCell>
                      <TableCell align="right">
                        {stats.attendanceSummary?.totalWorkDays || 0}
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Ngay nghi phep</TableCell>
                      <TableCell align="right">
                        {stats.attendanceSummary?.totalLeaveDays || 0}
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Ngay vang mat</TableCell>
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
