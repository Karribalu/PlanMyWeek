import { fetchWeatherApi } from "openmeteo";

export const getWeatherForecast = async (params: any) => {
  const url = "https://climate-api.open-meteo.com/v1/climate";
  const responses = await fetchWeatherApi(url, params);

  // Process 1 location and 7 models
  for (const response of responses) {
    // Attributes for timezone and location
    const latitude = response.latitude();
    const longitude = response.longitude();
    const elevation = response.elevation();
    const timezone = response.timezone();
    const timezoneAbbreviation = response.timezoneAbbreviation();
    const utcOffsetSeconds = response.utcOffsetSeconds();

    console.log(
      `\nCoordinates: ${latitude}°N ${longitude}°E`,
      `\nElevation: ${elevation}m asl`,
      `\nTimezone: ${timezone} ${timezoneAbbreviation}`,
      `\nTimezone difference to GMT+0: ${utcOffsetSeconds}s`,
      `\nModel Nº: ${response.model()}`
    );

    const daily = response.daily()!;

    // Note: The order of weather variables in the URL query and the indices below need to match!
    const weatherData = {
      daily: {
        time: [
          ...Array(
            (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval()
          ),
        ].map(
          (_, i) =>
            new Date(
              (Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) *
                1000
            )
        ),
        temperature_2m_max: daily.variables(0)!.valuesArray(),
        temperature_2m_mean: daily.variables(1)!.valuesArray(),
        rain_sum: daily.variables(2)!.valuesArray(),
        snowfall_sum: daily.variables(3)!.valuesArray(),
        pressure_msl_mean: daily.variables(4)!.valuesArray(),
      },
    };

    // 'weatherData' now contains a simple structure with arrays with datetime and weather data
    console.log("\nDaily data", weatherData.daily);
  }
};
