import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#46a9c8",
      light: "#7bc7dd",
      dark: "#2e7b92",
    },
    secondary: {
      main: "#ffa726",
    },
    background: {
      default: "transparent",
      paper: "rgba(16,40,48,0.85)",
    },
    success: {
      main: "#4caf50",
    },
    warning: {
      main: "#ff9800",
    },
    error: {
      main: "#f44336",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
          backgroundAttachment: "fixed",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
        },
        html: {
          height: "100%",
          margin: 0,
          padding: 0,
        },
        "#root": {
          minHeight: "100vh",
          background: "transparent",
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          minHeight: "100vh",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backdropFilter: "blur(6px)",
          border: "1px solid #1e4a57",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          background: "#102830",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(70, 169, 200, 0.1)",
          },
        },
      },
    },
  },
});
