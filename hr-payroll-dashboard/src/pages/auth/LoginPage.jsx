import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);

    try {
      const res = await authService.login({ username, password });
      const { token, user } = res.data;
      login(user, token);
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.error || "Tên đăng nhập hoặc mật khẩu không đúng.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f7fa",
        px: 2,
      }}
    >
      <Card
        elevation={8}
        sx={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 3,
          overflow: "visible",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            align="center"
            sx={{ fontWeight: 700, color: "#1565c0", mb: 0.5 }}
          >
            HR & Quản lý lương
          </Typography>

          <Typography
            variant="body1"
            align="center"
            sx={{ color: "text.secondary", mb: 4 }}
          >
            Đăng nhập vào hệ thống
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Tên đăng nhập"
              variant="outlined"
              fullWidth
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2.5 }}
              autoComplete="username"
              autoFocus
            />

            <TextField
              label="Mật khẩu"
              variant="outlined"
              fullWidth
              required
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{
                py: 1.5,
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1, fontWeight: 600 }}
            >
              Tài khoản thử nghiệm:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin: admin / admin123 (toàn quyền)
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
