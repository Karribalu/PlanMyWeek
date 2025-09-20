import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@apollo/client/react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Box,
  Chip,
  IconButton,
  Stack,
  Grid,
  Paper,
  Divider,
} from "@mui/material";
import type {
  DailyActivityScoreUI,
  GetRankedActivitiesData,
  GetRankedActivitiesVars,
  ActivityRankingUI,
} from "../types";
import { GET_RANKED_ACTIVITIES } from "../graphql/queries";

export function ActivityDetailsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get data from URL params
  const activity = searchParams.get("activity");
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
    skip: !lat || !lng || !activity, // Skip query if required params are missing
    errorPolicy: "all",
  });

  const activityData: ActivityRankingUI | undefined =
    data?.getRankedActivities?.activities.find((a) => a.activity === activity);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  const getActivityIcon = (activityName: string) => {
    switch (activityName?.toLowerCase()) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
    };
  };

  const goBack = () => {
    const params = new URLSearchParams({
      location: locationName || "",
      lat: lat || "",
      lng: lng || "",
      ...(country && { country }),
    });
    navigate(`/activities?${params.toString()}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
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

  if (error || !lat || !lng || !activity) {
    const errorMessage = error?.message || "Missing required parameters";
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={goBack} color="primary">
            ←
          </IconButton>
          <Typography variant="h4" component="h1">
            Activity Details
          </Typography>
        </Stack>
        <Alert severity="error">{errorMessage}</Alert>
      </Container>
    );
  }

  if (!activityData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={goBack} color="primary">
            ←
          </IconButton>
          <Typography variant="h4" component="h1">
            Activity Details
          </Typography>
        </Stack>
        <Alert severity="warning">Activity data not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={goBack} color="primary">
          ←
        </IconButton>
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="h3" component="span">
              {getActivityIcon(activity || "")}
            </Typography>
            <Typography variant="h4" component="h1">
              {activity?.charAt(0).toUpperCase()}
              {activity?.slice(1)} in {locationName}
            </Typography>
          </Stack>
          <Typography variant="subtitle1" color="text.secondary">
            {country && `${country} • `}
            Overall Score: {Math.round(activityData.overallScore)}%
          </Typography>
        </Box>
      </Stack>

      {/* Overall Score Card */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          background: `linear-gradient(135deg, ${
            activityData.overallScore >= 80
              ? "#4caf50, #81c784"
              : activityData.overallScore >= 60
              ? "#ff9800, #ffb74d"
              : "#f44336, #e57373"
          })`,
          color: "white",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography
              variant="h3"
              component="div"
              sx={{ fontWeight: "bold" }}
            >
              {Math.round(activityData.overallScore)}%
            </Typography>
            <Typography variant="h6">Overall Rating</Typography>
          </Box>
          <Chip
            label={
              activityData.overallScore >= 80
                ? "Excellent"
                : activityData.overallScore >= 60
                ? "Good"
                : "Poor"
            }
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "white",
              fontWeight: "bold",
            }}
          />
        </Stack>
      </Paper>

      {/* Daily Breakdown */}
      <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
        Daily Forecast
      </Typography>

      <Grid container spacing={3}>
        {activityData.daily.map((day: DailyActivityScoreUI) => {
          const dateInfo = formatDate(day.date);
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={day.date}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  transition: "all 0.2s ease-in-out",
                  border: `2px solid ${
                    day.score >= 80
                      ? "#4caf50"
                      : day.score >= 60
                      ? "#ff9800"
                      : "#f44336"
                  }`,
                  "&:hover": {
                    elevation: 6,
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  {/* Date Header */}
                  <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ fontSize: "0.9rem" }}
                    >
                      {dateInfo.dayName}
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: "bold", lineHeight: 1 }}
                    >
                      {dateInfo.dayNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dateInfo.month}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Score */}
                  <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Chip
                      label={`${Math.round(day.score)}%`}
                      color={getScoreColor(day.score)}
                      size="medium"
                      sx={{
                        fontWeight: "bold",
                        fontSize: "1rem",
                        height: 36,
                      }}
                    />
                  </Box>

                  {/* Reasons */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Conditions:
                    </Typography>
                    <Stack spacing={0.5}>
                      {day.reasons.slice(0, 3).map((reason, i) => (
                        <Typography
                          key={i}
                          variant="body2"
                          sx={{
                            fontSize: "0.75rem",
                            lineHeight: 1.3,
                            color: "text.secondary",
                          }}
                        >
                          • {reason}
                        </Typography>
                      ))}
                      {day.reasons.length > 3 && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "0.75rem",
                            fontStyle: "italic",
                            color: "text.secondary",
                          }}
                        >
                          +{day.reasons.length - 3} more...
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
