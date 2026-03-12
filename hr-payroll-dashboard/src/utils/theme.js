import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1565c0",
      light: "#1976d2",
      dark: "#0d47a1",
      contrastText: "#fff",
    },
    secondary: {
      main: "#7b1fa2",
      light: "#9c27b0",
      dark: "#4a148c",
    },
    success: {
      main: "#2e7d32",
      light: "#4caf50",
    },
    warning: {
      main: "#ed6c02",
      light: "#ff9800",
    },
    error: {
      main: "#d32f2f",
      light: "#ef5350",
    },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a2027",
      secondary: "#637381",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            fontWeight: 700,
            backgroundColor: "#f5f7fa",
          },
        },
      },
    },
  },
});

export default theme;
