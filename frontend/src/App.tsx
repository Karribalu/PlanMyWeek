import { useState } from "react";

import "./App.css";
import type { LocationSuggestion } from "./types";
import { LocationSearch } from "./components/LocationSearch";
import { ActivityRankings } from "./components/ActivityRankings";

function App() {
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);
  return (
    <div className="center-wrapper">
      <div style={{ width: "min(600px,100%)" }}>
        <LocationSearch
          onSelect={setSelectedLocation}
          selected={selectedLocation}
        />
        <ActivityRankings location={selectedLocation} />
      </div>
    </div>
  );
}

export default App;
