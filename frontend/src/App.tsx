import { useState, useEffect, useRef } from "react";

import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ name: string; country?: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounce fetch when query changes
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
              query: `query Search($q:String!){ searchLocations(query:$q){ name country } }`,
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
    <div className="center-wrapper">
      <div className="search-box">
        <input
          type="text"
          autoFocus
          placeholder="Enter a location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <div className="status">Searching...</div>}
        {error && <div className="status error">{error}</div>}
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((s) => (
              <li key={s.name} onClick={() => setQuery(s.name)}>
                <strong>{s.name}</strong>{" "}
                {s.country && <span className="country">({s.country})</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
