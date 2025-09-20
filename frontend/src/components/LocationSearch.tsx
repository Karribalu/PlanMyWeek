import { useEffect, useRef, useState } from "react";
import type { LocationSuggestion } from "../types";
import { SEARCH_LOCATIONS } from "../graphql/queries";

interface LocationSearchProps {
  onSelect(location: LocationSuggestion): void;
  selected?: LocationSuggestion | null;
}

export function LocationSearch({ onSelect, selected }: LocationSearchProps) {
  const [query, setQuery] = useState(selected?.name || "");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Expose query change when user types but only select on click
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
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
              query: SEARCH_LOCATIONS,
              variables: { q: query },
            }),
            signal: controller.signal,
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const json = await resp.json();
          if (json.errors)
            throw new Error(json.errors[0]?.message || "GraphQL error");
          setSuggestions(json.data.searchLocations);
        } catch (e: any) {
          if (e.name !== "AbortError") {
            setError(e.message);
          }
        } finally {
          setLoading(false);
        }
      })();
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="search-box" role="search">
      <label htmlFor="location-input" className="visually-hidden">
        Search location
      </label>
      <input
        id="location-input"
        type="text"
        placeholder="Enter a location..."
        autoFocus
        value={query}
        aria-autocomplete="list"
        aria-controls={suggestions.length ? "location-suggestions" : undefined}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
      />
      {loading && (
        <div className="status" role="status">
          Searching...
        </div>
      )}
      {error && (
        <div className="status error" role="alert">
          {error}
        </div>
      )}
      {suggestions.length > 0 && (
        <ul id="location-suggestions" className="suggestions" role="listbox">
          {suggestions.map((s) => (
            <li
              key={`${s.name}-${s.latitude}-${s.longitude}`}
              role="option"
              aria-selected={selected?.name === s.name}
              onClick={() => {
                setQuery(s.name);
                onSelect(s);
              }}
            >
              <strong>{s.name}</strong>{" "}
              {s.country && <span className="country">({s.country})</span>}
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <div className="status" style={{ marginTop: "1rem" }}>
          Selected: {selected.name} ({selected.latitude.toFixed(2)},{" "}
          {selected.longitude.toFixed(2)})
        </div>
      )}
    </div>
  );
}
