import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#46a9c8" },
    background: {
      default: "#0e2127",
      paper: "rgba(16,40,48,0.85)",
    },
  },
  components: {
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
  },
});
