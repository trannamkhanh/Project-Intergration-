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
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import {
  employeeService,
  departmentService,
  positionService,
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
  Status: "Đang làm việc",
};

const STATUS_CONFIG = {
  "Đang làm việc": { label: "Dang lam viec", color: "success" },
  "Active": { label: "Dang lam viec", color: "success" },
  "Nghỉ phép": { label: "Nghi phep", color: "warning" },
  "Thử việc": { label: "Thu viec", color: "info" },
  "Thực tập": { label: "Thuc tap", color: "secondary" },
  "Inactive": { label: "Da nghi viec", color: "error" },
  "Nghỉ việc": { label: "Da nghi viec", color: "error" },
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
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

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, deptRes, posRes] = await Promise.all([
          employeeService.getAll(),
          departmentService.getAll(),
          positionService.getAll(),
        ]);
        setEmployees(empRes.data);
        setDepartments(deptRes.data);
        setPositions(posRes.data);
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

  const handleSave = () => {
    const department = departments.find(
      (d) => d.DepartmentID === formData.DepartmentID,
    );
    const position = positions.find(
      (p) => p.PositionID === formData.PositionID,
    );

    if (dialogMode === "add") {
      const maxId = employees.reduce(
        (max, emp) => Math.max(max, emp.EmployeeID),
        0,
      );
      const newEmployee = {
        EmployeeID: maxId + 1,
        FullName: formData.FullName,
        Email: formData.Email,
        PhoneNumber: formData.PhoneNumber,
        DateOfBirth: formData.DateOfBirth,
        Gender: formData.Gender,
        DepartmentID: formData.DepartmentID,
        PositionID: formData.PositionID,
        HireDate: formData.HireDate,
        Status: formData.Status,
        DepartmentName: department?.DepartmentName || "",
        PositionName: position?.PositionName || "",
      };
      setEmployees((prev) => [...prev, newEmployee]);
    } else {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.EmployeeID === selectedEmployee.EmployeeID
            ? {
                ...emp,
                FullName: formData.FullName,
                Email: formData.Email,
                PhoneNumber: formData.PhoneNumber,
                DateOfBirth: formData.DateOfBirth,
                Gender: formData.Gender,
                DepartmentID: formData.DepartmentID,
                PositionID: formData.PositionID,
                HireDate: formData.HireDate,
                Status: formData.Status,
                DepartmentName: department?.DepartmentName || "",
                PositionName: position?.PositionName || "",
              }
            : emp,
        ),
      );
    }
    handleCloseDialog();
  };

  const handleOpenDelete = (employee) => {
    setEmployeeToDelete(employee);
    setOpenDeleteDialog(true);
  };

  const handleCloseDelete = () => {
    setOpenDeleteDialog(false);
    setEmployeeToDelete(null);
  };

  const handleConfirmDelete = () => {
    setEmployees((prev) =>
      prev.filter((emp) => emp.EmployeeID !== employeeToDelete.EmployeeID),
    );
    handleCloseDelete();
  };

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Nhan vien</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          Them nhan vien
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tim kiem theo ten..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <FilterListIcon fontSize="small" />
                  Phong ban
                </Box>
              </InputLabel>
              <Select
                value={filterDepartment}
                onChange={handleFilterDepartmentChange}
                label="xx Phong ban xx"
              >
                <MenuItem value="">
                  <em>Tat ca phong ban</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.DepartmentID} value={dept.DepartmentID}>
                    {dept.DepartmentName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <FilterListIcon fontSize="small" />
                  Trang thai
                </Box>
              </InputLabel>
              <Select
                value={filterStatus}
                onChange={handleFilterStatusChange}
                label="xx Trang thai x"
              >
                <MenuItem value="">
                  <em>Tat ca trang thai</em>
                </MenuItem>
                <MenuItem value="Đang làm việc">Dang lam viec</MenuItem>
                <MenuItem value="Nghỉ phép">Nghi phep</MenuItem>
                <MenuItem value="Thử việc">Thu viec</MenuItem>
                <MenuItem value="Thực tập">Thuc tap</MenuItem>
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
                    <Chip
                      label={getStatusConfig(emp.Status).label}
                      size="small"
                      color={getStatusConfig(emp.Status).color}
                    />
                  </TableCell>
                  <TableCell>{formatDate(emp.HireDate)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Sua">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenEdit(emp)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xoa">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDelete(emp)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Khong tim thay nhan vien nao.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredEmployees.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="So dong moi trang:"
        />
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "add"
            ? "Them nhan vien moi"
            : "Sua thong tin nhan vien"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Ho ten"
                fullWidth
                size="small"
                required
                value={formData.FullName}
                onChange={handleFormChange("FullName")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Email"
                fullWidth
                size="small"
                required
                type="email"
                value={formData.Email}
                onChange={handleFormChange("Email")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="So dien thoai"
                fullWidth
                size="small"
                value={formData.PhoneNumber}
                onChange={handleFormChange("PhoneNumber")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Ngay sinh"
                fullWidth
                size="small"
                type="date"
                value={formData.DateOfBirth}
                onChange={handleFormChange("DateOfBirth")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Gioi tinh</InputLabel>
                <Select
                  value={formData.Gender}
                  onChange={handleFormChange("Gender")}
                  label="Gioi tinh"
                >
                  <MenuItem value="Male">Nam</MenuItem>
                  <MenuItem value="Female">Nu</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Phong ban</InputLabel>
                <Select
                  value={formData.DepartmentID}
                  onChange={handleFormChange("DepartmentID")}
                  label="Phong ban"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.DepartmentID} value={dept.DepartmentID}>
                      {dept.DepartmentName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Chuc vu</InputLabel>
                <Select
                  value={formData.PositionID}
                  onChange={handleFormChange("PositionID")}
                  label="Chuc vu"
                >
                  {positions.map((pos) => (
                    <MenuItem key={pos.PositionID} value={pos.PositionID}>
                      {pos.PositionName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Ngay vao lam"
                fullWidth
                size="small"
                required
                type="date"
                value={formData.HireDate}
                onChange={handleFormChange("HireDate")}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Trang thai</InputLabel>
                <Select
                  value={formData.Status}
                  onChange={handleFormChange("Status")}
                  label="Trang thai"
                >
                  <MenuItem value="Đang làm việc">Dang lam viec</MenuItem>
                  <MenuItem value="Nghỉ phép">Nghi phep</MenuItem>
                  <MenuItem value="Thử việc">Thu viec</MenuItem>
                  <MenuItem value="Thực tập">Thuc tap</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Huy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!isFormValid}
          >
            {dialogMode === "add" ? "Them" : "Luu thay doi"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Xac nhan xoa</DialogTitle>
        <DialogContent>
          <Typography>
            Ban co chac chan muon xoa nhan vien{" "}
            <strong>{employeeToDelete?.FullName}</strong>? Hanh dong nay khong
            the hoan tac.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDelete} color="inherit">
            Huy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            Xoa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
