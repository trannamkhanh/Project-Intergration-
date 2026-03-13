import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SnackbarProvider } from "notistack";
import theme from "./utils/theme";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import MainLayout from "./components/layout/MainLayout";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import EmployeesPage from "./pages/employees/EmployeesPage";
import DepartmentsPage from "./pages/departments/DepartmentsPage";
import PositionsPage from "./pages/positions/PositionsPage";
import PayrollPage from "./pages/payroll/PayrollPage";
import AttendancePage from "./pages/attendance/AttendancePage";
import ReportsPage from "./pages/reports/ReportsPage";
import DividendsPage from "./pages/dividends/DividendsPage";
import AlertsPage from "./pages/alerts/AlertsPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ children, role }) {
  const { isAuthenticated, hasRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasRole(role)) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/departments" element={<DepartmentsPage />} />
                <Route path="/positions" element={<PositionsPage />} />
                <Route path="/payroll" element={<RoleRoute role="Admin"><PayrollPage /></RoleRoute>} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/dividends" element={<RoleRoute role="Admin"><DividendsPage /></RoleRoute>} />
                <Route path="/reports" element={<RoleRoute role="Admin"><ReportsPage /></RoleRoute>} />
                <Route path="/alerts" element={<AlertsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
