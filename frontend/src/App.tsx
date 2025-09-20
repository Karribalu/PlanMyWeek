import { useState } from "react";
import { Container, Typography, Box, Paper } from "@mui/material";

import "./App.css";
import type { LocationSuggestion } from "./types";
import { LocationSearch } from "./components/LocationSearch";

function App() {
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Box textAlign="center" sx={{ mb: 6 }}>
        <Typography
          variant="h2"
          component="h1"
          sx={{ mb: 2, fontWeight: "bold" }}
        >
          🌤️ PlanMyWeek
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          Discover the best outdoor activities based on weather forecasts
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, textAlign: "center" }}>
          Search for a location to get started
        </Typography>
        <LocationSearch
          onSelect={setSelectedLocation}
          selected={selectedLocation}
          autoNavigate={true}
        />
      </Paper>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Get personalized activity rankings for skiing ⛷️, surfing 🏄, and
          sightseeing 🌟
        </Typography>
      </Box>
    </Container>
  );
}

export default App;
