import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ApolloProvider } from "@apollo/client/react";

import "./index.css";
import App from "./App.tsx";
import { ActivityRankingsPage } from "./pages/ActivityRankingsPage";
import { ActivityDetailsPage } from "./pages/ActivityDetailsPage";
import { theme } from "./theme";
import { apolloClient } from "./apollo/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/activities" element={<ActivityRankingsPage />} />
            <Route path="/activity-details" element={<ActivityDetailsPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ApolloProvider>
  </StrictMode>
);
