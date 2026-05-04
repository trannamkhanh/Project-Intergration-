import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Add, Edit, Delete, People, Business } from "@mui/icons-material";
import { departmentService } from "../../services/api";

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deletingDepartment, setDeletingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    DepartmentName: "",
    Description: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await departmentService.getAll();
        setDepartments(res.data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu phòng ban:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingDepartment(null);
    setFormData({ DepartmentName: "", Description: "" });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      DepartmentName: department.DepartmentName,
      Description: department.Description || "",
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDepartment(null);
    setFormData({ DepartmentName: "", Description: "" });
    setFormErrors({});
  };

  const handleOpenDelete = (department) => {
    setDeletingDepartment(department);
    setOpenDeleteDialog(true);
  };

  const handleCloseDelete = () => {
    setOpenDeleteDialog(false);
    setDeletingDepartment(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.DepartmentName.trim()) {
      errors.DepartmentName = "Tên phòng ban là bắt buộc";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingDepartment) {
        const res = await departmentService.update(editingDepartment.DepartmentID, formData);
        setDepartments((prev) =>
          prev.map((dept) =>
            dept.DepartmentID === editingDepartment.DepartmentID ? res.data : dept,
          ),
        );
      } else {
        const res = await departmentService.create(formData);
        setDepartments((prev) => [...prev, res.data]);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Lỗi khi lưu phòng ban:", error);
      alert(error.response?.data?.error || "Có lỗi xảy ra khi lưu phòng ban");
    }
  };

  const handleDelete = async () => {
    if (deletingDepartment && deletingDepartment.EmployeeCount === 0) {
      try {
        await departmentService.delete(deletingDepartment.DepartmentID);
        setDepartments((prev) =>
          prev.filter((dept) => dept.DepartmentID !== deletingDepartment.DepartmentID),
        );
      } catch (error) {
        console.error("Lỗi khi xóa phòng ban:", error);
        alert(error.response?.data?.error || "Có lỗi xảy ra khi xóa phòng ban");
      }
    }
    handleCloseDelete();
  };

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
        <Typography sx={{ ml: 2 }}>Đang tải dữ liệu...</Typography>
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Business sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography variant="h4" fontWeight={700}>
            Phòng ban
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAdd}
          sx={{ px: 3, py: 1 }}
        >
          Thêm phòng ban
        </Button>
      </Box>

      <Grid container spacing={3}>
        {departments.map((department) => (
          <Grid key={department.DepartmentID} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardContent sx={{ flex: 1, pb: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1.5,
                  }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    {department.DepartmentName}
                  </Typography>
                  <Chip
                    icon={<People sx={{ fontSize: 16 }} />}
                    label={`${department.EmployeeCount} nhân viên`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {department.Description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 1.5 }}>
                <Tooltip title="Sửa">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenEdit(department)}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleOpenDelete(department)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {departments.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Business sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Không tìm thấy phòng ban nào
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            Hãy bắt đầu bằng cách thêm phòng ban đầu tiên
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
          >
            Thêm phòng ban
          </Button>
        </Box>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingDepartment ? "Sửa phòng ban" : "Thêm phòng ban"}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            <TextField
              label="Tên phòng ban"
              name="DepartmentName"
              value={formData.DepartmentName}
              onChange={handleChange}
              fullWidth
              required
              error={!!formErrors.DepartmentName}
              helperText={formErrors.DepartmentName}
              autoFocus
            />
            <TextField
              label="Mô tả"
              name="Description"
              value={formData.Description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              error={!!formErrors.Description}
              helperText={formErrors.Description}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleSave} variant="contained">
            {editingDepartment ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Xóa phòng ban</DialogTitle>
        <DialogContent>
          {deletingDepartment && deletingDepartment.EmployeeCount > 0 ? (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Không thể xóa "{deletingDepartment.DepartmentName}" vì vẫn còn{" "}
              <strong>{deletingDepartment.EmployeeCount} nhân viên</strong>{" "}
              thuộc phòng ban này. Vui lòng chuyển hoặc xóa tất cả nhân viên
              khỏi phòng ban trước khi xóa.
            </Alert>
          ) : (
            <Typography sx={{ mt: 1 }}>
              Bạn có chắc chắn muốn xóa phòng ban "
              <strong>{deletingDepartment?.DepartmentName}</strong>"? Hành động
              này không thể hoàn tác.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDelete} color="inherit">
            Hủy
          </Button>
          {deletingDepartment && deletingDepartment.EmployeeCount === 0 && (
            <Button onClick={handleDelete} variant="contained" color="error">
              Xóa
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentsPage;
