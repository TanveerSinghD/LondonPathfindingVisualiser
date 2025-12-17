import { AutocompleteSuggestion } from "../services/autocompleteService";

interface Props {
  suggestions: AutocompleteSuggestion[];
  highlighted: number;
  onSelect: (s: AutocompleteSuggestion) => void;
  tokens: string[];
}

function highlight(text: string, tokens: string[]) {
  let remaining = text;
  const lowered = text.toLowerCase();
  const segments: { text: string; bold: boolean }[] = [];
  let index = 0;
  while (remaining.length) {
    let matchIndex = -1;
    let matchToken = "";
    for (const token of tokens) {
      const idx = lowered.indexOf(token, index);
      if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
        matchIndex = idx;
        matchToken = token;
      }
    }
    if (matchIndex === -1) {
      segments.push({ text: text.slice(index), bold: false });
      break;
    }
    if (matchIndex > index) {
      segments.push({ text: text.slice(index, matchIndex), bold: false });
    }
    segments.push({ text: text.slice(matchIndex, matchIndex + matchToken.length), bold: true });
    index = matchIndex + matchToken.length;
    remaining = text.slice(index);
  }
  return segments;
}

export function AutocompleteDropdown({ suggestions, highlighted, onSelect, tokens }: Props) {
  if (!suggestions.length) return null;
  return (
    <div className="autocomplete-dropdown">
      {suggestions.map((s, idx) => (
        <button
          key={`${s.lat}-${s.lng}-${idx}`}
          className={`autocomplete-item ${idx === highlighted ? "is-active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(s);
          }}
        >
          <div className="autocomplete-primary">
            {highlight(s.primary, tokens).map((seg, i) => (
              <span key={i} className={seg.bold ? "bold" : ""}>
                {seg.text}
              </span>
            ))}
          </div>
          {s.secondary && <div className="autocomplete-secondary">{s.secondary}</div>}
        </button>
      ))}
    </div>
  );
}
