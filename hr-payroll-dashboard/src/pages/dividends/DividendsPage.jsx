import { useState, useEffect, useMemo } from "react";
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
  Card,
  CardContent,
  Chip,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { Add, Edit, Delete, Savings } from "@mui/icons-material";
import { dividendService } from "../../services/api";

const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " \u20AB";

const DividendsPage = () => {
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editingDividend, setEditingDividend] = useState(null);
  const [deletingDividend, setDeletingDividend] = useState(null);
  const [formData, setFormData] = useState({
    EmployeeName: "",
    DividendAmount: "",
    DividendDate: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await dividendService.getAll();
        setDividends(res.data);
      } catch (error) {
        console.error("Loi khi tai du lieu co tuc:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDividends = useMemo(() => {
    if (!searchQuery) return dividends;
    return dividends.filter((d) =>
      d.EmployeeName?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [dividends, searchQuery]);

  const summaryStats = useMemo(() => {
    const total = filteredDividends.reduce(
      (sum, d) => sum + (d.DividendAmount || d.Amount || 0),
      0,
    );
    return {
      totalAmount: total,
      count: filteredDividends.length,
      average:
        filteredDividends.length > 0
          ? Math.round(total / filteredDividends.length)
          : 0,
    };
  }, [filteredDividends]);

  const handleOpenAdd = () => {
    setEditingDividend(null);
    setFormData({ EmployeeName: "", DividendAmount: "", DividendDate: "" });
    setOpenDialog(true);
  };

  const handleOpenEdit = (dividend) => {
    setEditingDividend(dividend);
    setFormData({
      EmployeeName: dividend.EmployeeName,
      DividendAmount: dividend.DividendAmount || dividend.Amount,
      DividendDate: dividend.DividendDate || dividend.Date,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDividend(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (editingDividend) {
      setDividends((prev) =>
        prev.map((d) =>
          d.DividendID === editingDividend.DividendID
            ? {
                ...d,
                EmployeeName: formData.EmployeeName,
                DividendAmount: Number(formData.DividendAmount),
                Amount: Number(formData.DividendAmount),
                DividendDate: formData.DividendDate,
                Date: formData.DividendDate,
              }
            : d,
        ),
      );
    } else {
      const newId =
        dividends.length > 0
          ? Math.max(...dividends.map((d) => d.DividendID)) + 1
          : 1;
      setDividends((prev) => [
        ...prev,
        {
          DividendID: newId,
          EmployeeID: newId,
          EmployeeName: formData.EmployeeName,
          DividendAmount: Number(formData.DividendAmount),
          Amount: Number(formData.DividendAmount),
          DividendDate: formData.DividendDate,
          Date: formData.DividendDate,
        },
      ]);
    }
    handleCloseDialog();
  };

  const handleOpenDelete = (dividend) => {
    setDeletingDividend(dividend);
    setDeleteDialog(true);
  };

  const handleDelete = () => {
    setDividends((prev) =>
      prev.filter((d) => d.DividendID !== deletingDividend.DividendID),
    );
    setDeleteDialog(false);
    setDeletingDividend(null);
  };

  const summaryCards = [
    {
      title: "Tong co tuc",
      value: formatVND(summaryStats.totalAmount),
      color: "#1565c0",
      bgColor: "#e3f2fd",
    },
    {
      title: "So nguoi nhan",
      value: summaryStats.count,
      color: "#2e7d32",
      bgColor: "#e8f5e9",
    },
    {
      title: "Co tuc trung binh",
      value: formatVND(summaryStats.average),
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Savings sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography variant="h4" fontWeight={700}>
            Co tuc
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAdd}
          sx={{ textTransform: "none" }}
        >
          Them co tuc
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <TextField
          label="Tim kiem nhan vien"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          size="small"
        />
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid size={{ xs: 12, sm: 4 }} key={card.title}>
            <Card elevation={2} sx={{ borderLeft: `4px solid ${card.color}` }}>
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
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TableContainer
        component={Paper}
        elevation={2}
        sx={{ border: "1px solid", borderColor: "divider" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 80 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ten nhan vien</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                So tien co tuc
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Ngay
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Thao tac
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDividends.length > 0 ? (
              filteredDividends.map((dividend) => (
                <TableRow key={dividend.DividendID} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {dividend.DividendID}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {dividend.EmployeeName}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={formatVND(dividend.DividendAmount || dividend.Amount || 0)}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={dividend.DividendDate || dividend.Date} size="small" />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Sua">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenEdit(dividend)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xoa">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDelete(dividend)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Savings
                    sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    Khong tim thay co tuc nao
                  </Typography>
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
          {editingDividend ? "Sua co tuc" : "Them co tuc"}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            <TextField
              label="Ten nhan vien"
              name="EmployeeName"
              value={formData.EmployeeName}
              onChange={handleChange}
              fullWidth
              autoFocus
            />
            <TextField
              label="So tien co tuc"
              name="DividendAmount"
              type="number"
              value={formData.DividendAmount}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Ngay co tuc"
              name="DividendDate"
              type="date"
              value={formData.DividendDate}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Huy
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !formData.EmployeeName ||
              !formData.DividendAmount ||
              !formData.DividendDate
            }
          >
            {editingDividend ? "Cap nhat" : "Tao moi"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Xoa co tuc</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            Ban co chac chan muon xoa co tuc cua{" "}
            <strong>{deletingDividend?.EmployeeName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteDialog(false)} color="inherit">
            Huy
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Xoa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DividendsPage;
