import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
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
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { Add, Edit, Delete, WorkOutline } from "@mui/icons-material";
import { positionService } from "../../services/api";

const PositionsPage = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [deletingPosition, setDeletingPosition] = useState(null);
  const [formData, setFormData] = useState({
    PositionName: "",
    Description: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await positionService.getAll();
        setPositions(res.data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu chức vụ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingPosition(null);
    setFormData({ PositionName: "", Description: "" });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (position) => {
    setEditingPosition(position);
    setFormData({
      PositionName: position.PositionName,
      Description: position.Description || "",
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPosition(null);
    setFormData({ PositionName: "", Description: "" });
    setFormErrors({});
  };

  const handleOpenDelete = (position) => {
    setDeletingPosition(position);
    setOpenDeleteDialog(true);
  };

  const handleCloseDelete = () => {
    setOpenDeleteDialog(false);
    setDeletingPosition(null);
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
    if (!formData.PositionName.trim()) {
      errors.PositionName = "Tên chức vụ là bắt buộc";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingPosition) {
        const res = await positionService.update(editingPosition.PositionID, formData);
        setPositions((prev) =>
          prev.map((pos) =>
            pos.PositionID === editingPosition.PositionID ? res.data : pos,
          ),
        );
      } else {
        const res = await positionService.create(formData);
        setPositions((prev) => [...prev, res.data]);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Lỗi khi lưu chức vụ:", error);
      alert(error.response?.data?.error || "Có lỗi xảy ra khi lưu chức vụ");
    }
  };

  const handleDelete = async () => {
    if (deletingPosition) {
      try {
        await positionService.delete(deletingPosition.PositionID);
        setPositions((prev) =>
          prev.filter((pos) => pos.PositionID !== deletingPosition.PositionID),
        );
      } catch (error) {
        console.error("Lỗi khi xóa chức vụ:", error);
        alert(error.response?.data?.error || "Có lỗi xảy ra khi xóa chức vụ");
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
          <WorkOutline sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography variant="h4" fontWeight={700}>
            Chức vụ
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAdd}
          sx={{ px: 3, py: 1 }}
        >
          Thêm chức vụ
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}>ID</TableCell>
              <TableCell>Tên chức vụ</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell align="right" sx={{ width: 120 }}>
                Thao tác
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.length > 0 ? (
              positions.map((position) => (
                <TableRow
                  key={position.PositionID}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {position.PositionID}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {position.PositionName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {position.Description}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Sửa">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenEdit(position)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDelete(position)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <WorkOutline
                    sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    Không tìm thấy chức vụ nào
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    sx={{ mb: 2 }}
                  >
                    Hãy bắt đầu bằng cách thêm chức vụ đầu tiên
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleOpenAdd}
                    size="small"
                  >
                    Thêm chức vụ
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingPosition ? "Sửa chức vụ" : "Thêm chức vụ"}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            <TextField
              label="Tên chức vụ"
              name="PositionName"
              value={formData.PositionName}
              onChange={handleChange}
              fullWidth
              required
              error={!!formErrors.PositionName}
              helperText={formErrors.PositionName}
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
            {editingPosition ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Xóa chức vụ</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            Bạn có chắc chắn muốn xóa chức vụ "
            <strong>{deletingPosition?.PositionName}</strong>"? Hành động này
            không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDelete} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PositionsPage;
