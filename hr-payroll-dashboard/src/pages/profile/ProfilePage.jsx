import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  Chip,
  TextField,
  Button,
  Divider,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/api";

const roleColorMap = {
  Admin: "error",
  HR: "primary",
  Payroll: "secondary",
  employee: "default",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("success");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Vui long nhap day du thong tin doi mat khau.");
      setMessageType("warning");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Mat khau moi phai co it nhat 6 ky tu.");
      setMessageType("warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Xac nhan mat khau khong khop.");
      setMessageType("warning");
      return;
    }

    try {
      setSubmitting(true);
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
      });
      setMessage(res.data?.message || "Doi mat khau thanh cong.");
      setMessageType("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error.response?.data?.error || "Doi mat khau that bai.");
      setMessageType("warning");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        User/Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main" }}>
                {(user?.fullName || "U").charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {user?.fullName || "Unknown User"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email || "Chua co email"}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Vai tro
            </Typography>
            <Chip
              label={user?.role || "employee"}
              color={roleColorMap[user?.role] || "default"}
              sx={{ fontWeight: 600, mb: 2 }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              ID nguoi dung
            </Typography>
            <Typography sx={{ mb: 2 }}>{user?.id || "N/A"}</Typography>

            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Doi mat khau
            </Typography>

            {message && (
              <Alert severity={messageType} sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}

            <Box component="form" onSubmit={handleChangePassword}>
              <TextField
                fullWidth
                label="Mat khau hien tai"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Mat khau moi"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Xac nhan mat khau moi"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Dang xu ly..." : "Doi mat khau"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
