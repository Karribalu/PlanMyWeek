import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@apollo/client/react";
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
import type {
  ActivityRankingUI,
  GetRankedActivitiesData,
  GetRankedActivitiesVars,
} from "../types";
import { GET_RANKED_ACTIVITIES } from "../graphql/queries";

export function ActivityRankingsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [navigating, setNavigating] = useState(false);

  // Get location from URL params
  const locationName = searchParams.get("location");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const country = searchParams.get("country");

  // Use Apollo Client useQuery hook
  const { data, loading, error } = useQuery<
    GetRankedActivitiesData,
    GetRankedActivitiesVars
  >(GET_RANKED_ACTIVITIES, {
    variables: {
      lat: lat ? parseFloat(lat) : 0,
      lng: lng ? parseFloat(lng) : 0,
    },
    skip: !lat || !lng, // Skip query if required params are missing
    errorPolicy: "all",
  });

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

  if (error || !lat || !lng) {
    const errorMessage = error?.message || "Missing location coordinates";
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
        <Alert severity="error">{errorMessage}</Alert>
      </Container>
    );
  }

  const rankedActivitiesData = data?.getRankedActivities;

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

      {rankedActivitiesData && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Forecast period:{" "}
            {new Date(rankedActivitiesData.period.start).toLocaleDateString()} -{" "}
            {new Date(rankedActivitiesData.period.end).toLocaleDateString()}
          </Typography>

          <Stack spacing={2}>
            {[...rankedActivitiesData.activities]
              // Copy then sort to avoid mutating Apollo cached / readonly result objects
              .sort(
                (a: ActivityRankingUI, b: ActivityRankingUI) =>
                  b.overallScore - a.overallScore
              )
              .map((activity: ActivityRankingUI) => (
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
