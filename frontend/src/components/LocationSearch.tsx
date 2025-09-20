import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import type { LocationSuggestion } from "../types";
import { SEARCH_LOCATIONS } from "../graphql/queries";

interface Props {
  onSelect?(loc: LocationSuggestion): void;
  selected?: LocationSuggestion | null;
  autoNavigate?: boolean;
}

export function LocationSearch({
  onSelect,
  selected,
  autoNavigate = true,
}: Props) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState(selected?.name || "");
  const [options, setOptions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const handleLocationSelect = (location: LocationSuggestion) => {
    onSelect?.(location);
    setInputValue(location.name);

    if (autoNavigate) {
      const params = new URLSearchParams({
        location: location.name,
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
        ...(location.country && { country: location.country }),
      });
      navigate(`/activities?${params.toString()}`);
    }
  };

  useEffect(() => {
    if (!inputValue.trim()) {
      setOptions([]);
      setError(null);
      abortRef.current?.abort();
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
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
            variables: { q: inputValue },
          }),
          signal: controller.signal,
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (json.errors)
          throw new Error(json.errors[0]?.message || "GraphQL error");
        setOptions(json.data.searchLocations);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  useEffect(() => {
    if (selected?.name) setInputValue(selected.name);
  }, [selected?.name]);

  return (
    <Autocomplete
      autoComplete
      includeInputInList
      filterOptions={(x) => x}
      options={options}
      getOptionLabel={(o) => o.name}
      value={selected || null}
      inputValue={inputValue}
      onInputChange={(_, val, reason) => {
        if (reason === "input") setInputValue(val);
        if (reason === "clear") setInputValue("");
      }}
      onChange={(_, val) => {
        if (val) {
          handleLocationSelect(val);
        }
      }}
      loading={loading}
      noOptionsText={
        error ? `Error: ${error}` : inputValue ? "No matches" : "Type to search"
      }
      renderOption={(props, option) => (
        <Box
          component="li"
          {...props}
          key={`${option.name}-${option.latitude}-${option.longitude}`}
        >
          <Box sx={{ fontWeight: 600 }}>{option.name}</Box>
          {option.country && (
            <Box component="span" sx={{ ml: 1, fontSize: 12, opacity: 0.6 }}>
              ({option.country})
            </Box>
          )}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Location"
          placeholder="Search a location..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={18} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          error={!!error}
          helperText={error ? error : " "}
          sx={{
            "& .MuiOutlinedInput-root": {
              background: "#102830",
              borderRadius: "14px",
            },
          }}
        />
      )}
    />
  );
}
