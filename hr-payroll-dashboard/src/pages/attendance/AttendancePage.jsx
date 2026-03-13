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
  Chip,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  CalendarMonth,
  EventBusy,
  EventAvailable,
  Search,
  Add,
  Edit,
  Delete,
} from "@mui/icons-material";
import { attendanceService } from "../../services/api";

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    EmployeeName: "",
    WorkDays: "",
    LeaveDays: "",
    AbsentDays: "",
    Month: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await attendanceService.getAll();
        setAttendance(res.data);
      } catch (error) {
        console.error("Loi khi tai du lieu cham cong:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const matchesMonth = monthFilter ? record.Month === monthFilter : true;
      const matchesSearch = searchQuery
        ? record.EmployeeName?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesMonth && matchesSearch;
    });
  }, [attendance, monthFilter, searchQuery]);

  const summaryStats = useMemo(() => {
    return filteredAttendance.reduce(
      (acc, record) => ({
        totalWorkDays: acc.totalWorkDays + (record.WorkDays || 0),
        totalLeaveDays: acc.totalLeaveDays + (record.LeaveDays || 0),
        totalAbsentDays: acc.totalAbsentDays + (record.AbsentDays || 0),
      }),
      { totalWorkDays: 0, totalLeaveDays: 0, totalAbsentDays: 0 },
    );
  }, [filteredAttendance]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      EmployeeName: "",
      WorkDays: "",
      LeaveDays: "",
      AbsentDays: "",
      Month: "",
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      EmployeeName: record.EmployeeName,
      WorkDays: record.WorkDays,
      LeaveDays: record.LeaveDays,
      AbsentDays: record.AbsentDays,
      Month: record.Month,
    });
    setFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async () => {
    try {
      const payload = {
        EmployeeID: formData.EmployeeID,
        WorkDays: Number(formData.WorkDays),
        LeaveDays: Number(formData.LeaveDays),
        AbsentDays: Number(formData.AbsentDays),
        Month: formData.Month,
      };
      if (editingRecord) {
        const res = await attendanceService.update(editingRecord.AttendanceID, payload);
        setAttendance((prev) =>
          prev.map((r) =>
            r.AttendanceID === editingRecord.AttendanceID ? res.data : r,
          ),
        );
      } else {
        const res = await attendanceService.create(payload);
        setAttendance((prev) => [...prev, res.data]);
      }
      setFormOpen(false);
    } catch (error) {
      console.error("Loi khi luu cham cong:", error);
      alert(error.response?.data?.error || "Co loi xay ra khi luu cham cong");
    }
  };

  const handleOpenDelete = (record) => {
    setDeleteTarget(record);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await attendanceService.delete(deleteTarget.AttendanceID);
      setAttendance((prev) =>
        prev.filter((r) => r.AttendanceID !== deleteTarget.AttendanceID),
      );
    } catch (error) {
      console.error("Loi khi xoa cham cong:", error);
      alert(error.response?.data?.error || "Co loi xay ra khi xoa cham cong");
    }
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const getStatusChip = (absentDays) => {
    if (absentDays === 0) {
      return (
        <Chip
          label="Tot"
          size="small"
          sx={{ backgroundColor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }}
        />
      );
    }
    if (absentDays > 0 && absentDays <= 2) {
      return (
        <Chip
          label="Canh bao"
          size="small"
          sx={{ backgroundColor: "#fff8e1", color: "#f57f17", fontWeight: 600 }}
        />
      );
    }
    return (
      <Chip
        label="Nghiem trong"
        size="small"
        sx={{ backgroundColor: "#ffebee", color: "#c62828", fontWeight: 600 }}
      />
    );
  };

  const shouldHighlightRow = (record) => {
    return record.LeaveDays > 3 || record.AbsentDays > 1;
  };

  const summaryCards = [
    {
      title: "Tong ngay lam viec",
      value: summaryStats.totalWorkDays,
      icon: <CalendarMonth sx={{ fontSize: 40, color: "#1565c0" }} />,
      bgColor: "#e3f2fd",
    },
    {
      title: "Tong ngay nghi phep",
      value: summaryStats.totalLeaveDays,
      icon: <EventAvailable sx={{ fontSize: 40, color: "#2e7d32" }} />,
      bgColor: "#e8f5e9",
    },
    {
      title: "Tong ngay vang mat",
      value: summaryStats.totalAbsentDays,
      icon: <EventBusy sx={{ fontSize: 40, color: "#c62828" }} />,
      bgColor: "#ffebee",
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
          Quan ly cham cong
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAdd}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Them ban ghi
        </Button>
      </Box>

      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Loc theo thang"
              type="month"
              fullWidth
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Tim kiem nhan vien"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid size={{ xs: 12, sm: 4 }} key={card.title}>
            <Card elevation={2} sx={{ backgroundColor: card.bgColor }}>
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", fontWeight: 500, mb: 0.5 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {card.value}
                  </Typography>
                </Box>
                {card.icon}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper} elevation={2} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Ten nhan vien</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Ngay lam</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Ngay nghi phep</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Ngay vang</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Thang</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Trang thai</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Thao tac</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAttendance.length > 0 ? (
              filteredAttendance.map((record) => (
                <TableRow
                  key={record.AttendanceID}
                  sx={{
                    backgroundColor: shouldHighlightRow(record)
                      ? "#fff3e0"
                      : "inherit",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <TableCell>{record.EmployeeName}</TableCell>
                  <TableCell align="center">{record.WorkDays}</TableCell>
                  <TableCell align="center">{record.LeaveDays}</TableCell>
                  <TableCell align="center">{record.AbsentDays}</TableCell>
                  <TableCell align="center">{record.Month}</TableCell>
                  <TableCell align="center">
                    {getStatusChip(record.AbsentDays)}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Sua">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(record);
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xoa">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDelete(record);
                        }}
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
                    Khong tim thay ban ghi cham cong nao.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingRecord ? "Sua ban ghi cham cong" : "Them ban ghi cham cong"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label="Ten nhan vien"
            name="EmployeeName"
            value={formData.EmployeeName}
            onChange={handleFormChange}
            fullWidth
          />
          <TextField
            label="Ngay lam viec"
            name="WorkDays"
            type="number"
            value={formData.WorkDays}
            onChange={handleFormChange}
            fullWidth
          />
          <TextField
            label="Ngay nghi phep"
            name="LeaveDays"
            type="number"
            value={formData.LeaveDays}
            onChange={handleFormChange}
            fullWidth
          />
          <TextField
            label="Ngay vang mat"
            name="AbsentDays"
            type="number"
            value={formData.AbsentDays}
            onChange={handleFormChange}
            fullWidth
          />
          <TextField
            label="Thang"
            name="Month"
            type="month"
            value={formData.Month}
            onChange={handleFormChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} sx={{ textTransform: "none" }}>
            Huy
          </Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            sx={{ textTransform: "none" }}
            disabled={
              !formData.EmployeeName ||
              formData.WorkDays === "" ||
              formData.LeaveDays === "" ||
              formData.AbsentDays === "" ||
              !formData.Month
            }
          >
            {editingRecord ? "Cap nhat" : "Them"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Xac nhan xoa</DialogTitle>
        <DialogContent>
          <Typography>
            Ban co chac chan muon xoa ban ghi cham cong cua{" "}
            <strong>{deleteTarget?.EmployeeName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ textTransform: "none" }}>
            Huy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            sx={{ textTransform: "none" }}
          >
            Xoa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendancePage;
