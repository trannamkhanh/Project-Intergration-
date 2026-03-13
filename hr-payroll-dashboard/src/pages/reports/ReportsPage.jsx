import { useState, useEffect, useMemo } from "react";
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
  Button,
  CircularProgress,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
import {
  employeeService,
  departmentService,
  payrollService,
  attendanceService,
  dividendService,
} from "../../services/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " \u20AB";

// ===== Xuat CSV =====
function exportCSV(filename, headers, rows) {
  const BOM = "\uFEFF";
  const csvContent =
    BOM +
    headers.join(",") +
    "\n" +
    rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// ===== TAB 1 - Bao cao nhan su =====
const HRReport = ({ employees, departments }) => {
  const deptCounts = useMemo(() => {
    const map = {};
    employees.forEach((e) => {
      const name = e.DepartmentName || "Khac";
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [employees]);

  const statusCounts = useMemo(() => {
    const map = {};
    employees.forEach((e) => {
      const s = e.Status || "Khac";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [employees]);

  const genderCounts = useMemo(() => {
    const map = {};
    employees.forEach((e) => {
      const g =
        e.Gender === "Male" ? "Nam" : e.Gender === "Female" ? "Nu" : e.Gender;
      map[g] = (map[g] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [employees]);

  const handleExport = () => {
    const headers = [
      "Ho ten",
      "Email",
      "Phong ban",
      "Chuc vu",
      "Trang thai",
      "Ngay vao lam",
    ];
    const rows = employees.map((e) => [
      e.FullName,
      e.Email,
      e.DepartmentName,
      e.PositionName,
      e.Status,
      e.HireDate,
    ]);
    exportCSV("bao_cao_nhan_su.csv", headers, rows);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Xuat CSV
        </Button>
      </Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                So luong nhan vien theo phong ban
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Phong ban</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        So luong
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deptCounts.map((row) => (
                      <TableRow key={row.name} hover>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
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
                Trang thai
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Trang thai</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        SL
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statusCounts.map((row) => (
                      <TableRow key={row.name} hover>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
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
                Gioi tinh
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Gioi tinh</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">
                        SL
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {genderCounts.map((row) => (
                      <TableRow key={row.name} hover>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
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

// ===== TAB 2 - Bao cao luong =====
const PayrollReport = ({ salaries, employees }) => {
  const summary = useMemo(() => {
    const nets = salaries.map((s) => s.NetSalary || 0);
    if (nets.length === 0)
      return { totalPayroll: 0, avgSalary: 0, maxSalary: 0, minSalary: 0 };
    return {
      totalPayroll: nets.reduce((a, b) => a + b, 0),
      avgSalary: Math.round(nets.reduce((a, b) => a + b, 0) / nets.length),
      maxSalary: Math.max(...nets),
      minSalary: Math.min(...nets),
    };
  }, [salaries]);

  const monthlyTable = useMemo(() => {
    const monthMap = {};
    salaries.forEach((s) => {
      const m = s.SalaryMonth || "N/A";
      if (!monthMap[m]) monthMap[m] = { total: 0, count: 0 };
      monthMap[m].total += s.NetSalary || 0;
      monthMap[m].count += 1;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        totalPayroll: data.total,
        avgSalary: Math.round(data.total / data.count),
      }));
  }, [salaries]);

  const handleExport = () => {
    const headers = [
      "Ten nhan vien",
      "Luong co ban",
      "Thuong",
      "Khau tru",
      "Thuc nhan",
      "Thang",
    ];
    const rows = salaries.map((s) => [
      s.EmployeeName,
      s.BaseSalary,
      s.Bonus,
      s.Deductions,
      s.NetSalary,
      s.SalaryMonth,
    ]);
    exportCSV("bao_cao_luong.csv", headers, rows);
  };

  const summaryCards = [
    { label: "Tong quy luong", value: summary.totalPayroll, color: "#1565c0" },
    { label: "Luong trung binh", value: summary.avgSalary, color: "#7b1fa2" },
    { label: "Luong cao nhat", value: summary.maxSalary, color: "#2e7d32" },
    { label: "Luong thap nhat", value: summary.minSalary, color: "#ed6c02" },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Xuat CSV
        </Button>
      </Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2} sx={{ borderTop: `4px solid ${card.color}` }}>
              <CardContent>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontWeight: 500 }}
                >
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
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Tong hop luong theo thang
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Thang</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Tong luong
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Luong trung binh
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyTable.map((row) => (
                  <TableRow key={row.month} hover>
                    <TableCell>{row.month}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(row.totalPayroll)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(row.avgSalary)}
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

// ===== TAB 3 - Bao cao cham cong =====
const AttendanceReport = ({ attendance }) => {
  const totalWorkDays = attendance.reduce((s, a) => s + (a.WorkDays || 0), 0);
  const totalLeaveDays = attendance.reduce((s, a) => s + (a.LeaveDays || 0), 0);
  const totalAbsentDays = attendance.reduce(
    (s, a) => s + (a.AbsentDays || 0),
    0,
  );

  const employeeAttendance = useMemo(() => {
    const map = {};
    attendance.forEach((a) => {
      const id = a.EmployeeID || a.EmployeeName;
      if (!map[id])
        map[id] = {
          name: a.EmployeeName,
          WorkDays: 0,
          LeaveDays: 0,
          AbsentDays: 0,
        };
      map[id].WorkDays += a.WorkDays || 0;
      map[id].LeaveDays += a.LeaveDays || 0;
      map[id].AbsentDays += a.AbsentDays || 0;
    });
    return Object.values(map);
  }, [attendance]);

  const handleExport = () => {
    const headers = [
      "Ten nhan vien",
      "Ngay lam viec",
      "Ngay nghi phep",
      "Ngay vang mat",
      "Thang",
    ];
    const rows = attendance.map((a) => [
      a.EmployeeName,
      a.WorkDays,
      a.LeaveDays,
      a.AbsentDays,
      a.Month,
    ]);
    exportCSV("bao_cao_cham_cong.csv", headers, rows);
  };

  const summaryCards = [
    { label: "Tong ngay lam viec", value: totalWorkDays, color: "#2e7d32" },
    { label: "Tong ngay nghi phep", value: totalLeaveDays, color: "#ed6c02" },
    { label: "Tong ngay vang mat", value: totalAbsentDays, color: "#d32f2f" },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Xuat CSV
        </Button>
      </Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 4 }}>
            <Card elevation={2} sx={{ borderTop: `4px solid ${card.color}` }}>
              <CardContent>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontWeight: 500 }}
                >
                  {card.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Cham cong theo nhan vien
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Ten nhan vien</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Ngay lam
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Ngay nghi
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Ngay vang
                  </TableCell>
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
                      sx={{
                        color: row.AbsentDays > 0 ? "#d32f2f" : "inherit",
                        fontWeight: row.AbsentDays > 0 ? 600 : 400,
                      }}
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

// ===== TAB 4 - Bao cao co tuc =====
const DividendReport = ({ dividends }) => {
  const totalDividends = dividends.reduce(
    (s, d) => s + (d.DividendAmount || d.Amount || 0),
    0,
  );
  const avg =
    dividends.length > 0 ? Math.round(totalDividends / dividends.length) : 0;

  const handleExport = () => {
    const headers = ["Ten nhan vien", "So tien co tuc", "Ngay"];
    const rows = dividends.map((d) => [
      d.EmployeeName,
      d.DividendAmount || d.Amount,
      d.DividendDate || d.Date,
    ]);
    exportCSV("bao_cao_co_tuc.csv", headers, rows);
  };

  const summaryCards = [
    {
      label: "Tong co tuc",
      value: formatCurrency(totalDividends),
      color: "#1565c0",
    },
    { label: "So nguoi nhan", value: dividends.length, color: "#7b1fa2" },
    {
      label: "Co tuc trung binh",
      value: formatCurrency(avg),
      color: "#2e7d32",
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Xuat CSV
        </Button>
      </Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 4 }}>
            <Card elevation={2} sx={{ borderTop: `4px solid ${card.color}` }}>
              <CardContent>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontWeight: 500 }}
                >
                  {card.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Chi tiet co tuc
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Ten nhan vien</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    So tien
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Ngay
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dividends.map((row) => (
                  <TableRow key={row.DividendID} hover>
                    <TableCell>{row.EmployeeName}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(row.DividendAmount || row.Amount || 0)}
                    </TableCell>
                    <TableCell align="right">
                      {row.DividendDate || row.Date}
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

// ===== Main Reports Page =====
const ReportsPage = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [dividends, setDividends] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, deptRes, salRes, attRes, divRes] = await Promise.all([
          employeeService.getAll(),
          departmentService.getAll(),
          payrollService.getAll(),
          attendanceService.getAll(),
          dividendService.getAll(),
        ]);
        setEmployees(empRes.data);
        setDepartments(deptRes.data);
        setSalaries(salRes.data);
        setAttendance(attRes.data);
        setDividends(divRes.data);
      } catch (error) {
        console.error("Loi khi tai du lieu bao cao:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        <Typography sx={{ ml: 2 }}>Dang tai du lieu...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Bao cao & Phan tich
      </Typography>

      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_e, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ "& .MuiTab-root": { fontWeight: 600, textTransform: "none" } }}
        >
          <Tab label="Bao cao nhan su" />
          <Tab label="Bao cao luong" />
          <Tab label="Bao cao cham cong" />
          <Tab label="Bao cao co tuc" />
        </Tabs>
      </Paper>

      {tabIndex === 0 && (
        <HRReport employees={employees} departments={departments} />
      )}
      {tabIndex === 1 && (
        <PayrollReport salaries={salaries} employees={employees} />
      )}
      {tabIndex === 2 && <AttendanceReport attendance={attendance} />}
      {tabIndex === 3 && <DividendReport dividends={dividends} />}
    </Box>
  );
};

export default ReportsPage;
