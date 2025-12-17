import { useEffect, useRef, useState } from "react";
import { AutocompleteSuggestion, fetchAutocomplete } from "../services/autocompleteService";
import { AutocompleteDropdown } from "./AutocompleteDropdown";

interface Props {
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  onSelect: (s: AutocompleteSuggestion) => void;
}

const DEBOUNCE_MS = 250;

export function AutocompleteInput({ placeholder, value, onChange, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const [open, setOpen] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const tokens = value
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        controllerRef.current?.abort();
        controllerRef.current = new AbortController();
        const res = await fetchAutocomplete(value);
        setSuggestions(res);
        setOpen(true);
        setHighlighted(0);
      } catch {
        setSuggestions([]);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      controllerRef.current?.abort();
    };
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(suggestions[highlighted]);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="autocomplete-wrap">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.trim() && setOpen(true)}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
      />
      {open && (
        <AutocompleteDropdown
          suggestions={suggestions}
          highlighted={highlighted}
          tokens={tokens}
          onSelect={(s) => {
            onSelect(s);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
