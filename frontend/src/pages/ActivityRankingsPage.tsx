import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Stack,
} from "@mui/material";
import type { RankedActivitiesResultUI, ActivityRankingUI } from "../types";
import { GET_RANKED_ACTIVITIES } from "../graphql/queries";

export function ActivityRankingsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState<RankedActivitiesResultUI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Get location from URL params
  const locationName = searchParams.get("location");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const country = searchParams.get("country");

  useEffect(() => {
    if (!lat || !lng) {
      setError("Missing location coordinates");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const resp = await fetch("http://localhost:8080/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: GET_RANKED_ACTIVITIES,
            variables: { lat: parseFloat(lat), lng: parseFloat(lng) },
          }),
          signal: controller.signal,
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (json.errors)
          throw new Error(json.errors[0]?.message || "GraphQL error");
        setData(json.data.getRankedActivities);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError(e.message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [lat, lng]);

  const handleActivityClick = (activity: ActivityRankingUI) => {
    setNavigating(true);
    const params = new URLSearchParams({
      activity: activity.activity,
      location: locationName || "",
      lat: lat || "",
      lng: lng || "",
      ...(country && { country }),
    });
    navigate(`/activity-details?${params.toString()}`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  const getActivityIcon = (activity: string) => {
    switch (activity.toLowerCase()) {
      case "skiing":
        return "🎿";
      case "surfing":
        return "🏄";
      case "sightseeing":
        return "🌟";
      default:
        return "🏃";
    }
  };

  if (loading || navigating) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress size={48} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate("/")} color="primary">
            ←
          </IconButton>
          <Typography variant="h4" component="h1">
            Activity Rankings
          </Typography>
        </Stack>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/")} color="primary">
          ←
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            Activity Rankings
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {locationName}
            {country && `, ${country}`}
          </Typography>
        </Box>
      </Stack>

      {data && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Forecast period: {new Date(data.period.start).toLocaleDateString()}{" "}
            - {new Date(data.period.end).toLocaleDateString()}
          </Typography>

          <Stack spacing={2}>
            {data.activities
              .sort((a, b) => b.overallScore - a.overallScore)
              .map((activity) => (
                <Card
                  key={activity.activity}
                  elevation={2}
                  sx={{
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      elevation: 4,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleActivityClick(activity)}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="h3" component="span">
                          {getActivityIcon(activity.activity)}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h5"
                            component="h2"
                            sx={{ mb: 1 }}
                          >
                            {activity.activity.charAt(0).toUpperCase() +
                              activity.activity.slice(1)}
                          </Typography>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                          >
                            <Chip
                              label={`${Math.round(
                                activity.overallScore
                              )}% Overall`}
                              color={getScoreColor(activity.overallScore)}
                              variant="filled"
                            />
                            <Typography variant="body2" color="text.secondary">
                              Click to see daily breakdown
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>

                      <Box sx={{ mt: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={activity.overallScore}
                          color={getScoreColor(activity.overallScore)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "rgba(0,0,0,0.1)",
                          }}
                        />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
          </Stack>
        </>
      )}
    </Container>
  );
}
