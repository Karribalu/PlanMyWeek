import { useEffect, useRef, useState } from "react";
import type { LocationSuggestion, RankedActivitiesResultUI } from "../types";
import { GET_RANKED_ACTIVITIES } from "../graphql/queries";

interface ActivityRankingsProps {
  location: LocationSuggestion | null;
}

export function ActivityRankings({ location }: ActivityRankingsProps) {
  const [data, setData] = useState<RankedActivitiesResultUI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!location) {
      setData(null);
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
            variables: { lat: location.latitude, lng: location.longitude },
          }),
          signal: controller.signal,
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (json.errors)
          throw new Error(json.errors[0]?.message || "GraphQL error");
        setData(json.data.getRankedActivities);
        setExpanded(null);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError(e.message);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [location?.latitude, location?.longitude]);

  function formatActivityName(name: string) {
    return name
      .split("_")
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(" ");
  }

  if (!location) return null;
  return (
    <>
      {loading && (
        <div className="status" role="status">
          Calculating best activities...
        </div>
      )}
      {error && (
        <div className="status error" role="alert">
          {error}
        </div>
      )}
      {data && (
        <div className="ranking-results" aria-live="polite">
          <h2 id="ranking-heading">Best Activities This Week</h2>
          <p className="period" aria-describedby="ranking-heading">
            {new Date(data.period.start).toLocaleDateString()} –{" "}
            {new Date(data.period.end).toLocaleDateString()}
          </p>
          <div className="ranking-cards" role="list">
            {data.activities.map((act) => {
              const isOpen = expanded === act.activity;
              const panelId = `panel-${act.activity}`;
              return (
                <div
                  className={`ranking-card ${isOpen ? "open" : ""}`}
                  key={act.activity}
                  role="listitem"
                >
                  <button
                    className="card-header"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setExpanded(isOpen ? null : act.activity)}
                  >
                    <div className="title-group">
                      <h3>{formatActivityName(act.activity)}</h3>
                      <span
                        className="overall-score"
                        aria-label={`Overall score ${act.overallScore.toFixed(
                          1
                        )} out of 100`}
                      >
                        {act.overallScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="progress-bar" aria-hidden="true">
                      <span style={{ width: `${act.overallScore}%` }} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="daily-breakdown" id={panelId}>
                      {act.daily.map((day) => (
                        <div className="day-row" key={day.date}>
                          <div className="day-meta">
                            <span className="day-date">
                              {new Date(day.date).toLocaleDateString(
                                undefined,
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                            <span
                              className="day-score"
                              aria-label={`Score ${day.score.toFixed(
                                0
                              )} out of 100`}
                            >
                              {day.score.toFixed(0)}
                            </span>
                            <div className="mini-bar" aria-hidden="true">
                              <span style={{ width: `${day.score}%` }} />
                            </div>
                          </div>
                          {day.reasons.length > 0 && (
                            <ul className="reasons">
                              {day.reasons.slice(0, 4).map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
