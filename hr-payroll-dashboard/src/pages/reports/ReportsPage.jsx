import { useState, useMemo } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  mockEmployees,
  mockDepartments,
  mockSalaries,
  mockAttendance,
  mockDividends,
  mockDashboardStats,
} from "../../services/mockData";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " \u20AB";

// TAB 1 - HR Report
const HRReport = () => {
  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Department Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Employee Count by Department
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Employee Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockDepartments.map((dept) => (
                      <TableRow key={dept.DepartmentID} hover>
                        <TableCell>{dept.DepartmentName}</TableCell>
                        <TableCell align="right">{dept.EmployeeCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Status & Gender */}
        <Grid size={{ xs: 12, md: 3 }}>
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
                      <TableCell sx={{ fontWeight: 700 }} align="right">Count</TableCell>
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

        <Grid size={{ xs: 12, md: 3 }}>
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
                      <TableCell sx={{ fontWeight: 700 }} align="right">Count</TableCell>
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
      </Grid>
    </Box>
  );
};

// TAB 2 - Payroll Report
const PayrollReport = () => {
  const salaryByDept = useMemo(() => {
    const deptMap = {};
    mockSalaries.forEach((s) => {
      const emp = mockEmployees.find((e) => e.EmployeeID === s.EmployeeID);
      const deptName = emp ? emp.DepartmentName : "Unknown";
      if (!deptMap[deptName]) {
        deptMap[deptName] = { total: 0, count: 0 };
      }
      deptMap[deptName].total += s.NetSalary;
      deptMap[deptName].count += 1;
    });
    return Object.entries(deptMap).map(([name, data]) => ({
      name,
      avgSalary: Math.round(data.total / data.count),
    }));
  }, []);

  const summary = useMemo(() => {
    const nets = mockSalaries.map((s) => s.NetSalary);
    return {
      totalPayroll: nets.reduce((a, b) => a + b, 0),
      avgSalary: Math.round(nets.reduce((a, b) => a + b, 0) / nets.length),
      maxSalary: Math.max(...nets),
      minSalary: Math.min(...nets),
    };
  }, []);

  const monthlyTable = useMemo(() => {
    const monthMap = {};
    mockSalaries.forEach((s) => {
      if (!monthMap[s.SalaryMonth]) {
        monthMap[s.SalaryMonth] = { total: 0, count: 0 };
      }
      monthMap[s.SalaryMonth].total += s.NetSalary;
      monthMap[s.SalaryMonth].count += 1;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        totalPayroll: data.total,
        avgSalary: Math.round(data.total / data.count),
      }));
  }, []);

  const summaryCards = [
    { label: "Total Payroll", value: summary.totalPayroll, color: "#1565c0" },
    { label: "Average Salary", value: summary.avgSalary, color: "#7b1fa2" },
    { label: "Max Salary", value: summary.maxSalary, color: "#2e7d32" },
    { label: "Min Salary", value: summary.minSalary, color: "#ed6c02" },
  ];

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2} sx={{ borderTop: `4px solid ${card.color}` }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  {card.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(card.value)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Average Salary by Department
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Average Salary</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salaryByDept.map((row) => (
                      <TableRow key={row.name} hover>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{formatCurrency(row.avgSalary)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Monthly Payroll Summary
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Total Payroll</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Average Salary</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthlyTable.map((row) => (
                      <TableRow key={row.month} hover>
                        <TableCell>{row.month}</TableCell>
                        <TableCell align="right">{formatCurrency(row.totalPayroll)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.avgSalary)}</TableCell>
                      </TableRow>
                    ))}
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

// TAB 3 - Attendance Report
const AttendanceReport = () => {
  const totalWorkDays = mockAttendance.reduce((s, a) => s + a.WorkDays, 0);
  const totalLeaveDays = mockAttendance.reduce((s, a) => s + a.LeaveDays, 0);
  const totalAbsentDays = mockAttendance.reduce((s, a) => s + a.AbsentDays, 0);

  const employeeAttendance = useMemo(() => {
    const map = {};
    mockAttendance.forEach((a) => {
      if (!map[a.EmployeeID]) {
        map[a.EmployeeID] = { name: a.EmployeeName, WorkDays: 0, LeaveDays: 0, AbsentDays: 0 };
      }
      map[a.EmployeeID].WorkDays += a.WorkDays;
      map[a.EmployeeID].LeaveDays += a.LeaveDays;
      map[a.EmployeeID].AbsentDays += a.AbsentDays;
    });
    return Object.values(map);
  }, []);

  const summaryCards = [
    { label: "Total Work Days", value: totalWorkDays, color: "#2e7d32" },
    { label: "Total Leave Days", value: totalLeaveDays, color: "#ed6c02" },
    { label: "Total Absent Days", value: totalAbsentDays, color: "#d32f2f" },
  ];

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 4 }}>
            <Card elevation={2} sx={{ borderTop: `4px solid ${card.color}` }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  {card.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Attendance by Employee
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Work Days</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Leave Days</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Absent Days</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeAttendance.map((row) => (
                  <TableRow key={row.name} hover>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right">{row.WorkDays}</TableCell>
                    <TableCell align="right">{row.LeaveDays}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: row.AbsentDays > 0 ? "#d32f2f" : "inherit", fontWeight: row.AbsentDays > 0 ? 600 : 400 }}
                    >
                      {row.AbsentDays}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

// TAB 4 - Dividend Report
const DividendReport = () => {
  const totalDividends = mockDividends.reduce((s, d) => s + d.DividendAmount, 0);

  const summaryCards = [
    { label: "Total Dividends", value: formatCurrency(totalDividends), color: "#1565c0" },
    { label: "Number of Recipients", value: mockDividends.length, color: "#7b1fa2" },
    { label: "Average Dividend", value: formatCurrency(Math.round(totalDividends / mockDividends.length)), color: "#2e7d32" },
  ];

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 4 }}>
            <Card elevation={2} sx={{ borderTop: `4px solid ${card.color}` }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  {card.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Dividend Details
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Dividend Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Dividend Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockDividends.map((row) => (
                  <TableRow key={row.DividendID} hover>
                    <TableCell>{row.EmployeeName}</TableCell>
                    <TableCell align="right">{formatCurrency(row.DividendAmount)}</TableCell>
                    <TableCell align="right">{row.DividendDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

// Main Reports Page
const ReportsPage = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Reports &amp; Analytics
      </Typography>

      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_e, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ "& .MuiTab-root": { fontWeight: 600, textTransform: "none" } }}
        >
          <Tab label="HR Report" />
          <Tab label="Payroll Report" />
          <Tab label="Attendance Report" />
          <Tab label="Dividend Report" />
        </Tabs>
      </Paper>

      {tabIndex === 0 && <HRReport />}
      {tabIndex === 1 && <PayrollReport />}
      {tabIndex === 2 && <AttendanceReport />}
      {tabIndex === 3 && <DividendReport />}
    </Box>
  );
};

export default ReportsPage;
