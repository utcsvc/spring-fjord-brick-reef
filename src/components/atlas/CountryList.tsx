import { useEffect } from "react";
import {
  countryName,
  indicatorById,
  rowDomId,
  type IndicatorId,
} from "@/data/atlas";

export type CountryRow = {
  id: string;
  place: number | null;
  value: number | null;
};

type Props = {
  rows: CountryRow[];
  indicatorId: IndicatorId;
  selectedId: string | null;
  hoverId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  scope: string;
};

export function CountryList({
  rows,
  indicatorId,
  selectedId,
  hoverId,
  onSelect,
  onHover,
  scope,
}: Props) {
  const indicator = indicatorById(indicatorId);

  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`${scope}-${rowDomId(selectedId)}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId, indicatorId, scope]);

  if (!rows.length) {
    return <p className="px-3 py-6 text-sm text-muted">Ничего не нашлось. Попробуйте другое написание.</p>;
  }

  return (
    <ul className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-2 pb-3">
      {rows.map((row) => {
        const active = row.id === selectedId;
        const hot = row.id === hoverId;
        return (
          <li key={row.id}>
            <button
              id={`${scope}-${rowDomId(row.id)}`}
              type="button"
              className={`press grid min-h-11 w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2 text-left ${
                active ? "bg-ink text-paper" : hot ? "bg-chip text-ink" : "text-ink"
              }`}
              onClick={() => onSelect(row.id)}
              onMouseEnter={() => onHover(row.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(row.id)}
              onBlur={() => onHover(null)}
            >
              <span className={`tabular text-xs ${active ? "text-paper" : "text-faint"}`}>
                {row.place ?? "–"}
              </span>
              <span className="truncate text-sm">{countryName(row.id)}</span>
              <span className={`tabular text-sm ${active ? "text-paper" : "text-muted"}`}>
                {row.value == null ? "—" : indicator.formatCompact(row.value)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
