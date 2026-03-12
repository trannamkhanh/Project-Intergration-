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
} from "@mui/material";
import {
  People,
  CheckCircle,
  Business,
  AttachMoney,
} from "@mui/icons-material";
import { mockDashboardStats, mockDepartments } from "../../services/mockData";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " VND";

const statsCards = [
  {
    title: "Total Employees",
    value: mockDashboardStats.totalEmployees,
    icon: <People sx={{ fontSize: 40 }} />,
    color: "#1565c0",
  },
  {
    title: "Active Employees",
    value: mockDashboardStats.activeEmployees,
    icon: <CheckCircle sx={{ fontSize: 40 }} />,
    color: "#2e7d32",
  },
  {
    title: "Total Departments",
    value: mockDashboardStats.totalDepartments,
    icon: <Business sx={{ fontSize: 40 }} />,
    color: "#7b1fa2",
  },
  {
    title: "Total Payroll",
    value: formatCurrency(mockDashboardStats.totalPayroll),
    icon: <AttachMoney sx={{ fontSize: 40 }} />,
    color: "#ed6c02",
  },
];

const DashboardPage = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Dashboard Overview
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
                Department Distribution
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Employees
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockDepartments.map((dept) => (
                      <TableRow key={dept.DepartmentID} hover>
                        <TableCell>{dept.DepartmentName}</TableCell>
                        <TableCell align="right">
                          {dept.EmployeeCount}
                        </TableCell>
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
                Monthly Salary Trend
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Total Salary
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockDashboardStats.monthlySalaryTrend.map((item) => (
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
                Status Distribution
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Count
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockDashboardStats.statusDistribution.map((item) => (
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
                Gender Distribution
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Gender</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Count
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockDashboardStats.genderDistribution.map((item) => (
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
                Attendance Summary
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        Days
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell>Work Days</TableCell>
                      <TableCell align="right">
                        {mockDashboardStats.attendanceSummary.totalWorkDays}
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Leave Days</TableCell>
                      <TableCell align="right">
                        {mockDashboardStats.attendanceSummary.totalLeaveDays}
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>Absent Days</TableCell>
                      <TableCell align="right" sx={{ color: "#d32f2f", fontWeight: 600 }}>
                        {mockDashboardStats.attendanceSummary.totalAbsentDays}
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
