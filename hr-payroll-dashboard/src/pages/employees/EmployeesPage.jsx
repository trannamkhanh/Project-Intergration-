import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  TablePagination,
  CircularProgress,
  Divider,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import {
  employeeService,
  departmentService,
  positionService,
  payrollService,
  attendanceService,
} from "../../services/api";

const initialFormState = {
  FullName: "",
  Email: "",
  PhoneNumber: "",
  DateOfBirth: "",
  Gender: "",
  DepartmentID: "",
  PositionID: "",
  HireDate: "",
  Status: "\u0110ang l\u00e0m vi\u1ec7c",
};

const STATUS_CONFIG = {
  "\u0110ang l\u00e0m vi\u1ec7c": { label: "Dang lam viec", color: "success" },
  Active: { label: "Dang lam viec", color: "success" },
  "Ngh\u1ec9 ph\u00e9p": { label: "Nghi phep", color: "warning" },
  "Th\u1eed vi\u1ec7c": { label: "Thu viec", color: "info" },
  "Th\u1ef1c t\u1eadp": { label: "Thuc tap", color: "secondary" },
  Inactive: { label: "Da nghi viec", color: "error" },
  "Ngh\u1ec9 vi\u1ec7c": { label: "Da nghi viec", color: "error" },
};

function getStatusConfig(status) {
  return STATUS_CONFIG[status] || { label: status, color: "default" };
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " \u20AB";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteConstraints, setDeleteConstraints] = useState([]);

  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, deptRes, posRes, salRes, attRes] = await Promise.all([
          employeeService.getAll(),
          departmentService.getAll(),
          positionService.getAll(),
          payrollService.getAll(),
          attendanceService.getAll(),
        ]);
        setEmployees(empRes.data);
        setDepartments(deptRes.data);
        setPositions(posRes.data);
        setSalaries(salRes.data);
        setAttendance(attRes.data);
      } catch (error) {
        console.error("Loi khi tai du lieu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = emp.FullName?.toLowerCase().includes(
        searchQuery.toLowerCase(),
      );
      const matchesDepartment =
        filterDepartment === "" || emp.DepartmentID === filterDepartment;
      const matchesStatus = filterStatus === "" || emp.Status === filterStatus;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchQuery, filterDepartment, filterStatus]);

  const paginatedEmployees = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredEmployees.slice(start, start + rowsPerPage);
  }, [filteredEmployees, page, rowsPerPage]);

  // Xem chi tiet nhan vien
  const handleOpenDetail = (employee) => {
    setDetailEmployee(employee);
    setOpenDetailDialog(true);
  };

  const empSalaryHistory = useMemo(() => {
    if (!detailEmployee) return [];
    return salaries.filter((s) => s.EmployeeID === detailEmployee.EmployeeID);
  }, [detailEmployee, salaries]);

  const empAttendanceHistory = useMemo(() => {
    if (!detailEmployee) return [];
    return attendance.filter(
      (a) => a.EmployeeID === detailEmployee.EmployeeID,
    );
  }, [detailEmployee, attendance]);

  // Kiem tra rang buoc xoa
  const checkDeleteConstraints = (employee) => {
    const constraints = [];
    const hasSalary = salaries.some(
      (s) => s.EmployeeID === employee.EmployeeID,
    );
    const hasAttendance = attendance.some(
      (a) => a.EmployeeID === employee.EmployeeID,
    );
    if (hasSalary) constraints.push("Co ban ghi luong lien quan");
    if (hasAttendance) constraints.push("Co ban ghi cham cong lien quan");
    return constraints;
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };
  const handleFilterDepartmentChange = (e) => {
    setFilterDepartment(e.target.value);
    setPage(0);
  };
  const handleFilterStatusChange = (e) => {
    setFilterStatus(e.target.value);
    setPage(0);
  };

  const handleOpenAdd = () => {
    setDialogMode("add");
    setSelectedEmployee(null);
    setFormData(initialFormState);
    setOpenDialog(true);
  };

  const handleOpenEdit = (employee) => {
    setDialogMode("edit");
    setSelectedEmployee(employee);
    setFormData({
      FullName: employee.FullName,
      Email: employee.Email,
      PhoneNumber: employee.PhoneNumber,
      DateOfBirth: employee.DateOfBirth,
      Gender: employee.Gender,
      DepartmentID: employee.DepartmentID,
      PositionID: employee.PositionID,
      HireDate: employee.HireDate,
      Status: employee.Status,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmployee(null);
    setFormData(initialFormState);
  };

  const handleFormChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      if (dialogMode === "add") {
        const res = await employeeService.create(formData);
        setEmployees((prev) => [...prev, res.data]);
      } else {
        const res = await employeeService.update(selectedEmployee.EmployeeID, formData);
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.EmployeeID === selectedEmployee.EmployeeID ? res.data : emp,
          ),
        );
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Loi khi luu nhan vien:", error);
      alert(error.response?.data?.error || "Co loi xay ra khi luu nhan vien");
    }
  };

  const handleOpenDelete = (employee) => {
    const constraints = checkDeleteConstraints(employee);
    setDeleteConstraints(constraints);
    setEmployeeToDelete(employee);
    setOpenDeleteDialog(true);
  };

  const handleCloseDelete = () => {
    setOpenDeleteDialog(false);
    setEmployeeToDelete(null);
    setDeleteConstraints([]);
  };

  const handleConfirmDelete = async () => {
    try {
      await employeeService.delete(employeeToDelete.EmployeeID);
      setEmployees((prev) =>
        prev.filter((emp) => emp.EmployeeID !== employeeToDelete.EmployeeID),
      );
      handleCloseDelete();
    } catch (error) {
      console.error("Loi khi xoa nhan vien:", error);
      alert(error.response?.data?.error || "Co loi xay ra khi xoa nhan vien");
    }
  };

  const isFormValid =
    formData.FullName.trim() !== "" &&
    formData.Email.trim() !== "" &&
    formData.DepartmentID !== "" &&
    formData.PositionID !== "" &&
    formData.Gender !== "" &&
    formData.HireDate !== "" &&
    formData.Status !== "";

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
        <Typography variant="h4">Nhan vien</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Them nhan vien
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth size="small" placeholder="Tim kiem theo ten..." value={searchQuery} onChange={handleSearchChange}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel><Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><FilterListIcon fontSize="small" />Phong ban</Box></InputLabel>
              <Select value={filterDepartment} onChange={handleFilterDepartmentChange} label="xx Phong ban xx">
                <MenuItem value=""><em>Tat ca phong ban</em></MenuItem>
                {departments.map((dept) => (<MenuItem key={dept.DepartmentID} value={dept.DepartmentID}>{dept.DepartmentName}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel><Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><FilterListIcon fontSize="small" />Trang thai</Box></InputLabel>
              <Select value={filterStatus} onChange={handleFilterStatusChange} label="xx Trang thai x">
                <MenuItem value=""><em>Tat ca trang thai</em></MenuItem>
                <MenuItem value={"\u0110ang l\u00e0m vi\u1ec7c"}>Dang lam viec</MenuItem>
                <MenuItem value={"Ngh\u1ec9 ph\u00e9p"}>Nghi phep</MenuItem>
                <MenuItem value={"Th\u1eed vi\u1ec7c"}>Thu viec</MenuItem>
                <MenuItem value={"Th\u1ef1c t\u1eadp"}>Thuc tap</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ho ten</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>So dien thoai</TableCell>
              <TableCell>Phong ban</TableCell>
              <TableCell>Chuc vu</TableCell>
              <TableCell>Trang thai</TableCell>
              <TableCell>Ngay vao lam</TableCell>
              <TableCell align="center">Thao tac</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEmployees.length > 0 ? (
              paginatedEmployees.map((emp) => (
                <TableRow key={emp.EmployeeID} hover>
                  <TableCell>{emp.EmployeeID}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{emp.FullName}</TableCell>
                  <TableCell>{emp.Email}</TableCell>
                  <TableCell>{emp.PhoneNumber}</TableCell>
                  <TableCell>{emp.DepartmentName}</TableCell>
                  <TableCell>{emp.PositionName}</TableCell>
                  <TableCell>
                    <Chip label={getStatusConfig(emp.Status).label} size="small" color={getStatusConfig(emp.Status).color} />
                  </TableCell>
                  <TableCell>{formatDate(emp.HireDate)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Xem chi tiet">
                      <IconButton size="small" color="info" onClick={() => handleOpenDetail(emp)}><ViewIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Sua">
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(emp)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Xoa">
                      <IconButton size="small" color="error" onClick={() => handleOpenDelete(emp)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Khong tim thay nhan vien nao.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={filteredEmployees.length} page={page}
          onPageChange={(_e, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]} labelRowsPerPage="So dong moi trang:" />
      </TableContainer>

      {/* Dialog xem chi tiet nhan vien */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
        {detailEmployee && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>Chi tiet nhan vien - {detailEmployee.FullName}</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Ho ten</Typography>
                  <Typography fontWeight={600}>{detailEmployee.FullName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography>{detailEmployee.Email}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">So dien thoai</Typography>
                  <Typography>{detailEmployee.PhoneNumber || "Chua cap nhat"}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Ngay sinh</Typography>
                  <Typography>{formatDate(detailEmployee.DateOfBirth)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Gioi tinh</Typography>
                  <Typography>{detailEmployee.Gender === "Male" ? "Nam" : detailEmployee.Gender === "Female" ? "Nu" : detailEmployee.Gender}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Trang thai</Typography>
                  <Chip label={getStatusConfig(detailEmployee.Status).label} size="small" color={getStatusConfig(detailEmployee.Status).color} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Phong ban</Typography>
                  <Typography>{detailEmployee.DepartmentName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Chuc vu</Typography>
                  <Typography>{detailEmployee.PositionName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Ngay vao lam</Typography>
                  <Typography>{formatDate(detailEmployee.HireDate)}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Lich su luong</Typography>
              {empSalaryHistory.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
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
                      {empSalaryHistory.map((s) => (
                        <TableRow key={s.SalaryID}>
                          <TableCell>{s.SalaryMonth}</TableCell>
                          <TableCell align="right">{formatVND(s.BaseSalary)}</TableCell>
                          <TableCell align="right">{formatVND(s.Bonus)}</TableCell>
                          <TableCell align="right">{formatVND(s.Deductions)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{formatVND(s.NetSalary)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (<Typography color="text.secondary" sx={{ mb: 3 }}>Chua co du lieu luong</Typography>)}

              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Lich su cham cong</Typography>
              {empAttendanceHistory.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Thang</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Ngay lam</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Ngay nghi phep</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="center">Ngay vang</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {empAttendanceHistory.map((a) => (
                        <TableRow key={a.AttendanceID}>
                          <TableCell>{a.Month}</TableCell>
                          <TableCell align="center">{a.WorkDays}</TableCell>
                          <TableCell align="center">{a.LeaveDays}</TableCell>
                          <TableCell align="center" sx={{ color: a.AbsentDays > 0 ? "#d32f2f" : "inherit", fontWeight: a.AbsentDays > 0 ? 600 : 400 }}>
                            {a.AbsentDays}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (<Typography color="text.secondary">Chua co du lieu cham cong</Typography>)}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button variant="contained" onClick={() => setOpenDetailDialog(false)}>Dong</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog them/sua nhan vien */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === "add" ? "Them nhan vien moi" : "Sua thong tin nhan vien"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Ho ten" fullWidth size="small" required value={formData.FullName} onChange={handleFormChange("FullName")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Email" fullWidth size="small" required type="email" value={formData.Email} onChange={handleFormChange("Email")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="So dien thoai" fullWidth size="small" value={formData.PhoneNumber} onChange={handleFormChange("PhoneNumber")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Ngay sinh" fullWidth size="small" type="date" value={formData.DateOfBirth} onChange={handleFormChange("DateOfBirth")} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Gioi tinh</InputLabel>
                <Select value={formData.Gender} onChange={handleFormChange("Gender")} label="Gioi tinh">
                  <MenuItem value="Male">Nam</MenuItem>
                  <MenuItem value="Female">Nu</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Phong ban</InputLabel>
                <Select value={formData.DepartmentID} onChange={handleFormChange("DepartmentID")} label="Phong ban">
                  {departments.map((dept) => (<MenuItem key={dept.DepartmentID} value={dept.DepartmentID}>{dept.DepartmentName}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Chuc vu</InputLabel>
                <Select value={formData.PositionID} onChange={handleFormChange("PositionID")} label="Chuc vu">
                  {positions.map((pos) => (<MenuItem key={pos.PositionID} value={pos.PositionID}>{pos.PositionName}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Ngay vao lam" fullWidth size="small" required type="date" value={formData.HireDate} onChange={handleFormChange("HireDate")} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Trang thai</InputLabel>
                <Select value={formData.Status} onChange={handleFormChange("Status")} label="Trang thai">
                  <MenuItem value={"\u0110ang l\u00e0m vi\u1ec7c"}>Dang lam viec</MenuItem>
                  <MenuItem value={"Ngh\u1ec9 ph\u00e9p"}>Nghi phep</MenuItem>
                  <MenuItem value={"Th\u1eed vi\u1ec7c"}>Thu viec</MenuItem>
                  <MenuItem value={"Th\u1ef1c t\u1eadp"}>Thuc tap</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">Huy</Button>
          <Button variant="contained" onClick={handleSave} disabled={!isFormValid}>
            {dialogMode === "add" ? "Them" : "Luu thay doi"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xoa (kiem tra rang buoc) */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Xac nhan xoa</DialogTitle>
        <DialogContent>
          {deleteConstraints.length > 0 ? (
            <Alert severity="warning" sx={{ mb: 1 }}>
              <Typography fontWeight={600} sx={{ mb: 1 }}>
                Khong the xoa nhan vien {employeeToDelete?.FullName} vi:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {deleteConstraints.map((c, i) => (<li key={i}>{c}</li>))}
              </ul>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Vui long xoa cac ban ghi lien quan truoc khi xoa nhan vien nay.
              </Typography>
            </Alert>
          ) : (
            <Typography>
              Ban co chac chan muon xoa nhan vien <strong>{employeeToDelete?.FullName}</strong>? Hanh dong nay khong the hoan tac.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDelete} color="inherit">Huy</Button>
          {deleteConstraints.length === 0 && (
            <Button variant="contained" color="error" onClick={handleConfirmDelete}>Xoa</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
