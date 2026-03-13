import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  WorkOutline as WorkIcon,
  AttachMoney as PayrollIcon,
  CalendarMonth as AttendanceIcon,
  Savings as DividendsIcon,
  Assessment as ReportsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  ChevronLeft as ChevronLeftIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useAlerts } from "../../contexts/AlertContext";

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

const menuItems = [
  { text: "Tổng quan", icon: <DashboardIcon />, path: "/" },
  { text: "Nhân viên", icon: <PeopleIcon />, path: "/employees" },
  { text: "Phòng ban", icon: <BusinessIcon />, path: "/departments" },
  { text: "Chức vụ", icon: <WorkIcon />, path: "/positions" },
  { text: "Bảng lương", icon: <PayrollIcon />, path: "/payroll" },
  { text: "Chấm công", icon: <AttendanceIcon />, path: "/attendance" },
  { text: "Cổ tức", icon: <DividendsIcon />, path: "/dividends" },
  { text: "Báo cáo", icon: <ReportsIcon />, path: "/reports" },
  { text: "Cảnh báo", icon: <NotificationsIcon />, path: "/alerts" },
];

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { unreadCount } = useAlerts();

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate("/login");
  };

  const currentWidth = drawerOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED;

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: drawerOpen ? "space-between" : "center",
          p: 2,
          minHeight: 64,
        }}
      >
        {drawerOpen && (
          <Typography
            variant="h6"
            noWrap
            sx={{ color: "primary.main", fontWeight: 800 }}
          >
            HR Quản lý
          </Typography>
        )}
        {!isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small">
            {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        )}
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1, pt: 1 }}>
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={!drawerOpen ? item.text : ""} placement="right">
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setDrawerOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    minHeight: 44,
                    justifyContent: drawerOpen ? "initial" : "center",
                    px: 2,
                    backgroundColor: isActive ? "primary.main" : "transparent",
                    color: isActive ? "#fff" : "text.primary",
                    "&:hover": {
                      backgroundColor: isActive
                        ? "primary.dark"
                        : "action.hover",
                    },
                    "& .MuiListItemIcon-root": {
                      color: isActive ? "#fff" : "text.secondary",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: drawerOpen ? 2 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    {item.text === "Cảnh báo" ? (
                      <Badge badgeContent={unreadCount} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  {drawerOpen && <ListItemText primary={item.text} />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      {drawerOpen && (
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: "primary.main",
              fontSize: 14,
            }}
          >
            {user?.fullName?.charAt(0) || "A"}
          </Avatar>
          <Box sx={{ overflow: "hidden" }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.fullName || "Admin User"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role || "Admin"}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: isMobile ? DRAWER_WIDTH : currentWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: isMobile ? DRAWER_WIDTH : currentWidth,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
            transition: "width 0.2s ease",
            overflowX: "hidden",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box
        sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "background.paper",
            color: "text.primary",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap sx={{ flex: 1, fontWeight: 600 }}>
              {menuItems.find(
                (item) =>
                  item.path === location.pathname ||
                  (item.path !== "/" &&
                    location.pathname.startsWith(item.path)),
              )?.text || "Tổng quan"}
            </Typography>

            <Tooltip title="Thông báo">
              <IconButton onClick={() => navigate("/alerts")} sx={{ mr: 1 }}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Tài khoản">
              <IconButton onClick={handleMenuOpen}>
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: "primary.main",
                    fontSize: 14,
                  }}
                >
                  {user?.fullName?.charAt(0) || "A"}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              <MenuItem disabled>
                <AccountIcon sx={{ mr: 1 }} /> {user?.fullName || "Admin User"}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} /> Đăng xuất
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
