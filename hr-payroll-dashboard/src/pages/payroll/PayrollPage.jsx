import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  InputAdornment,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { AttachMoney, TrendingUp, Search, Add, Edit, Delete } from "@mui/icons-material";
import { payrollService } from "../../services/api";

const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " \u20AB";

const emptyForm = {
  EmployeeName: "",
  BaseSalary: "",
  Bonus: "",
  Deductions: "",
  NetSalary: 0,
  SalaryMonth: "",
};

const PayrollPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState({ ...emptyForm });
  const [editingSalaryId, setEditingSalaryId] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSalary, setDeletingSalary] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await payrollService.getAll();
        setSalaries(res.data);
      } catch (error) {
        console.error("Loi khi tai du lieu luong:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSalaries = useMemo(() => {
    return salaries.filter((salary) => {
      const matchesMonth = monthFilter
        ? salary.SalaryMonth === monthFilter
        : true;
      const matchesSearch = searchQuery
        ? salary.EmployeeName?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesMonth && matchesSearch;
    });
  }, [salaries, monthFilter, searchQuery]);

  const summaryStats = useMemo(() => {
    const totalPayroll = filteredSalaries.reduce(
      (sum, s) => sum + (s.NetSalary || 0),
      0,
    );
    const averageSalary =
      filteredSalaries.length > 0 ? totalPayroll / filteredSalaries.length : 0;
    const totalBonuses = filteredSalaries.reduce((sum, s) => sum + (s.Bonus || 0), 0);
    return { totalPayroll, averageSalary, totalBonuses };
  }, [filteredSalaries]);

  const paginatedSalaries = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredSalaries.slice(start, start + rowsPerPage);
  }, [filteredSalaries, page, rowsPerPage]);

  const handleRowClick = (salary) => {
    setSelectedEmployee(salary);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleOpenAddDialog = () => {
    setFormMode("add");
    setFormData({ ...emptyForm });
    setEditingSalaryId(null);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (salary, e) => {
    e.stopPropagation();
    setFormMode("edit");
    setFormData({
      EmployeeName: salary.EmployeeName,
      BaseSalary: salary.BaseSalary,
      Bonus: salary.Bonus,
      Deductions: salary.Deductions,
      NetSalary: salary.NetSalary,
      SalaryMonth: salary.SalaryMonth,
    });
    setEditingSalaryId(salary.SalaryID);
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setFormData({ ...emptyForm });
    setEditingSalaryId(null);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      const base = Number(updated.BaseSalary) || 0;
      const bonus = Number(updated.Bonus) || 0;
      const deductions = Number(updated.Deductions) || 0;
      updated.NetSalary = base + bonus - deductions;
      return updated;
    });
  };

  const handleFormSubmit = async () => {
    try {
      const payload = {
        EmployeeID: formData.EmployeeID,
        BaseSalary: Number(formData.BaseSalary) || 0,
        Bonus: Number(formData.Bonus) || 0,
        Deductions: Number(formData.Deductions) || 0,
        NetSalary: formData.NetSalary,
        SalaryMonth: formData.SalaryMonth,
      };
      if (formMode === "add") {
        const res = await payrollService.create(payload);
        setSalaries((prev) => [...prev, res.data]);
      } else {
        const res = await payrollService.update(editingSalaryId, payload);
        setSalaries((prev) =>
          prev.map((s) => (s.SalaryID === editingSalaryId ? res.data : s)),
        );
      }
      handleCloseFormDialog();
    } catch (error) {
      console.error("Loi khi luu luong:", error);
      alert(error.response?.data?.error || "Co loi xay ra khi luu luong");
    }
  };

  const handleOpenDeleteDialog = (salary, e) => {
    e.stopPropagation();
    setDeletingSalary(salary);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingSalary(null);
  };

  const handleConfirmDelete = async () => {
    try {
      await payrollService.delete(deletingSalary.SalaryID);
      setSalaries((prev) =>
        prev.filter((s) => s.SalaryID !== deletingSalary.SalaryID),
      );
    } catch (error) {
      console.error("Loi khi xoa luong:", error);
      alert(error.response?.data?.error || "Co loi xay ra khi xoa luong");
    }
    handleCloseDeleteDialog();
  };

  const employeeSalaryHistory = useMemo(() => {
    if (!selectedEmployee) return [];
    return salaries
      .filter((s) => s.EmployeeID === selectedEmployee.EmployeeID)
      .sort((a, b) => (a.SalaryMonth || "").localeCompare(b.SalaryMonth || ""));
  }, [selectedEmployee, salaries]);

  const summaryCards = [
    {
      title: "Tong quy luong",
      value: formatVND(summaryStats.totalPayroll),
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: "#1565c0",
      bgColor: "#e3f2fd",
    },
    {
      title: "Luong trung binh",
      value: formatVND(Math.round(summaryStats.averageSalary)),
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: "#2e7d32",
      bgColor: "#e8f5e9",
    },
    {
      title: "Tong thuong",
      value: formatVND(summaryStats.totalBonuses),
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: "#e65100",
      bgColor: "#fff3e0",
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Dang tai du lieu...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 700 }}
        >
          Quan ly luong
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAddDialog}
          sx={{ textTransform: "none" }}
        >
          Them luong
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Loc theo thang"
              type="month"
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setPage(0);
              }}
              fullWidth
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Tim kiem nhan vien"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 4 }}>
            <Chip
              label={`${filteredSalaries.length} ban ghi`}
              color="primary"
              variant="outlined"
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.title}>
            <Card
              elevation={2}
              sx={{
                borderLeft: `4px solid ${card.color}`,
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mb: 0.5 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: card.color }}
                  >
                    {card.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    backgroundColor: card.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={2} sx={{ overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Ten nhan vien</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Luong co ban</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Thuong</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Khau tru</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Luong thuc nhan</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Thang</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Thao tac</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSalaries.length > 0 ? (
                paginatedSalaries.map((salary) => (
                  <TableRow
                    key={salary.SalaryID}
                    hover
                    onClick={() => handleRowClick(salary)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{salary.EmployeeName}</TableCell>
                    <TableCell align="right">{formatVND(salary.BaseSalary)}</TableCell>
                    <TableCell align="right">
                      <Chip label={formatVND(salary.Bonus)} size="small" color="success" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={formatVND(salary.Deductions)} size="small" color="error" variant="outlined" />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatVND(salary.NetSalary)}</TableCell>
                    <TableCell align="center">
                      <Chip label={salary.SalaryMonth} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Sua">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => handleOpenEditDialog(salary, e)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xoa">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleOpenDeleteDialog(salary, e)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Khong tim thay ban ghi luong nao.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredSalaries.length}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="So dong moi trang:"
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedEmployee && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              Lich su luong - {selectedEmployee.EmployeeName}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">Luong co ban</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {formatVND(selectedEmployee.BaseSalary)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">Thuong</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#2e7d32" }}>
                    {formatVND(selectedEmployee.Bonus)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">Khau tru</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#d32f2f" }}>
                    {formatVND(selectedEmployee.Deductions)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">Luong thuc nhan</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#1565c0" }}>
                    {formatVND(selectedEmployee.NetSalary)}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Bang luong hang thang
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Thang</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Luong co ban</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Thuong</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Khau tru</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Thuc nhan</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employeeSalaryHistory.map((record) => (
                      <TableRow key={record.SalaryID}>
                        <TableCell>{record.SalaryMonth}</TableCell>
                        <TableCell align="right">{formatVND(record.BaseSalary)}</TableCell>
                        <TableCell align="right">{formatVND(record.Bonus)}</TableCell>
                        <TableCell align="right">{formatVND(record.Deductions)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatVND(record.NetSalary)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleCloseDialog} variant="contained">Dong</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={formDialogOpen} onClose={handleCloseFormDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {formMode === "add" ? "Them luong" : "Sua luong"}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Ten nhan vien"
              value={formData.EmployeeName}
              onChange={(e) => handleFormChange("EmployeeName", e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Luong co ban"
              type="number"
              value={formData.BaseSalary}
              onChange={(e) => handleFormChange("BaseSalary", e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Thuong"
              type="number"
              value={formData.Bonus}
              onChange={(e) => handleFormChange("Bonus", e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Khau tru"
              type="number"
              value={formData.Deductions}
              onChange={(e) => handleFormChange("Deductions", e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Luong thuc nhan (tu dong tinh)"
              value={formatVND(formData.NetSalary)}
              fullWidth
              size="small"
              InputProps={{ readOnly: true }}
              sx={{ "& .MuiInputBase-input": { fontWeight: 600 } }}
            />
            <TextField
              label="Thang luong"
              type="month"
              value={formData.SalaryMonth}
              onChange={(e) => handleFormChange("SalaryMonth", e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseFormDialog}>Huy</Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={!formData.EmployeeName || !formData.SalaryMonth}
          >
            {formMode === "add" ? "Them" : "Luu"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Xac nhan xoa</DialogTitle>
        <DialogContent>
          {deletingSalary && (
            <Typography>
              Ban co chac chan muon xoa ban ghi luong cua{" "}
              <strong>{deletingSalary.EmployeeName}</strong> ({deletingSalary.SalaryMonth})?
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDeleteDialog}>Huy</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Xoa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollPage;
