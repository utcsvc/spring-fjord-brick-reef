import { Minus, Plus, RotateCcw, Search, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  countries,
  countryName,
  indicators,
  listRows,
  rankOf,
  tone,
  valueOf,
  type Indicator,
  type IndicatorId,
} from "@/data/atlas";
import { buildPlate } from "@/data/geometry";
import { CountryList } from "@/components/atlas/CountryList";
import { CountryPanel, Snapshot } from "@/components/atlas/Details";
import { Legend } from "@/components/atlas/Legend";
import { WorldMap, type MapZoom } from "@/components/atlas/WorldMap";

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 text-copper" aria-hidden="true">
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="16" cy="16" rx="5.5" ry="11.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 16h23M16 4.5v23" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function AtlasApp() {
  const [indicatorId, setIndicatorId] = useState<IndicatorId>("life");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<MapZoom | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const tipName = useRef<HTMLParagraphElement>(null);
  const tipValue = useRef<HTMLParagraphElement>(null);
  const tipMeta = useRef<HTMLParagraphElement>(null);
  const indicator = indicators.find((item) => item.id === indicatorId) ?? indicators[0];
  const indicatorRef = useRef(indicator);
  indicatorRef.current = indicator;

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const plate = useMemo(() => buildPlate(size.w, size.h), [size.w, size.h]);

  useLayoutEffect(() => {
    zoomRef.current?.reset(true);
  }, [plate]);

  const colors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!plate) return next;
    for (const shape of plate.countries) next[shape.id] = tone(indicator, shape.id);
    return next;
  }, [plate, indicator]);

  const rows = useMemo(() => listRows(indicator.id, query), [indicator.id, query]);

  const onSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) setListOpen(false);
  }, []);

  const onHover = useCallback((id: string | null) => {
    setHoverId((prev) => (prev === id ? prev : id));
  }, []);

  const onPoint = useCallback((id: string | null, point: { x: number; y: number } | null) => {
    const tip = tipRef.current;
    const nameEl = tipName.current;
    const valueEl = tipValue.current;
    const metaEl = tipMeta.current;
    const box = frameRef.current;
    if (!tip || !nameEl || !valueEl || !metaEl || !box) return;
    if (!id || !point) {
      tip.style.opacity = "0";
      return;
    }
    const current = indicatorRef.current;
    const value = valueOf(current.id, id);
    const rank = rankOf(current.id, id);
    nameEl.textContent = countryName(id);
    valueEl.textContent = value == null ? "Нет данных" : current.format(value);
    metaEl.textContent = rank
      ? `${rank.place}-е из ${rank.total} · ${current.short}`
      : countries[id]?.region || "Нет показателя";
    const width = 216;
    const height = 88;
    let x = point.x + 16;
    let y = point.y + 16;
    if (x + width > box.clientWidth) x = point.x - width - 12;
    if (y + height > box.clientHeight) y = point.y - height - 12;
    tip.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`;
    tip.style.opacity = "1";
  }, []);

  useEffect(() => {
    if (tipRef.current) tipRef.current.style.opacity = "0";
  }, [indicatorId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (query) {
        setQuery("");
        return;
      }
      if (listOpen) {
        setListOpen(false);
        return;
      }
      setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query, listOpen]);

  const focusSelected = useCallback(() => {
    if (!selectedId || !plate) return;
    const shape = plate.countries.find((item) => item.id === selectedId);
    if (shape) zoomRef.current?.focus(shape.bounds);
  }, [plate, selectedId]);

  const detail = selectedId ? (
    <CountryPanel
      countryId={selectedId}
      indicatorId={indicator.id}
      onClose={() => setSelectedId(null)}
      onFocus={focusSelected}
    />
  ) : (
    <Snapshot indicator={indicator} onSelect={(id) => onSelect(id)} />
  );

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-paper text-ink">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-sheet px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <Mark />
          <div>
            <h1 className="font-display text-2xl leading-none">Полюс</h1>
            <p className="text-xs text-muted">{indicator.label}</p>
          </div>
        </div>
        <button
          type="button"
          className="press h-11 rounded-xl bg-ink px-4 text-sm font-medium text-paper"
          onClick={() => setListOpen(true)}
        >
          Страны
        </button>
      </header>
      <div className="flex flex-wrap gap-2 border-b border-line bg-sheet px-3 py-2 md:hidden">
        {indicators.map((item) => (
          <IndicatorChip
            key={item.id}
            indicator={item}
            active={item.id === indicator.id}
            onSelect={setIndicatorId}
          />
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden h-full w-80 shrink-0 flex-col border-r border-line bg-sheet md:flex">
          <div className="flex items-center gap-3 px-5 pt-5 pb-4">
            <Mark />
            <div>
              <h1 className="font-display text-3xl leading-none">Полюс</h1>
              <p className="mt-1 text-xs text-muted">Атлас стран</p>
            </div>
          </div>
          <fieldset className="px-3">
            <legend className="sr-only">Показатель</legend>
            <p className="px-2 pb-2 text-sm leading-snug text-muted">{indicator.hint}</p>
            <div className="grid grid-cols-2 gap-1">
              {indicators.map((item) => {
                const active = item.id === indicator.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    className={`press flex min-h-11 items-center rounded-xl px-3 text-left text-sm font-medium ${
                      active ? "bg-ink text-paper" : "hover:bg-chip"
                    }`}
                    onClick={() => setIndicatorId(item.id)}
                  >
                    {item.short}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="relative mx-4 mt-3 mb-2 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти страну"
              className="h-11 w-full rounded-xl border border-line bg-paper pr-10 pl-10 text-base outline-none focus:border-ink md:text-sm"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-lg"
                onClick={() => setQuery("")}
                aria-label="Очистить поиск"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <p className="px-5 pb-1 text-xs text-faint">
            {rows.length} в списке · по убыванию
          </p>
          <CountryList
            rows={rows}
            indicatorId={indicator.id}
            selectedId={selectedId}
            hoverId={hoverId}
            onSelect={(id) => onSelect(id)}
            onHover={onHover}
            scope="desk"
          />
          <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-faint">
            Всемирный банк, последнее доступное наблюдение. Контуры Natural Earth, 1:110 млн.
          </p>
        </aside>

        <div ref={frameRef} className="relative min-w-0 flex-1 overflow-hidden">
          {plate ? (
            <WorldMap
              shapes={plate.countries}
              sphere={plate.sphere}
              graticule={plate.graticule}
              colors={colors}
              selectedId={selectedId}
              hoverId={hoverId}
              onSelect={onSelect}
              onHover={onHover}
              onPoint={onPoint}
              zoomRef={zoomRef}
            />
          ) : null}
          <div ref={tipRef} className="tip rounded-2xl border border-line bg-sheet px-3 py-2.5 shadow-float">
            <p ref={tipName} className="truncate text-sm font-medium" />
            <p ref={tipValue} className="font-display text-2xl leading-none text-copper" />
            <p ref={tipMeta} className="mt-1 text-xs text-muted" />
          </div>
          <div
            className={`absolute right-3 bottom-3 z-10 max-md:left-3 max-md:right-auto ${
              selectedId ? "max-lg:hidden" : ""
            }`}
          >
            <div className="rounded-2xl border border-line bg-sheet px-3 py-2.5 shadow-float">
              <Legend indicator={indicator} compact />
            </div>
          </div>
          <div className="absolute top-3 right-3 z-10 flex flex-col overflow-hidden rounded-2xl border border-line bg-sheet shadow-float md:top-auto md:right-auto md:bottom-4 md:left-4">
            <ZoomButton label="Приблизить" onClick={() => zoomRef.current?.zoomIn()}>
              <Plus className="size-4" />
            </ZoomButton>
            <ZoomButton label="Отдалить" onClick={() => zoomRef.current?.zoomOut()}>
              <Minus className="size-4" />
            </ZoomButton>
            <ZoomButton label="Весь мир" onClick={() => zoomRef.current?.reset()}>
              <RotateCcw className="size-4" />
            </ZoomButton>
          </div>

          <div
            className={`sheet absolute inset-x-0 bottom-0 z-20 max-h-96 overflow-y-auto rounded-t-3xl border border-line bg-sheet shadow-float md:hidden ${
              selectedId ? "translate-y-0" : "pointer-events-none translate-y-full"
            }`}
          >
            {selectedId ? (
              <CountryPanel
                countryId={selectedId}
                indicatorId={indicator.id}
                onClose={() => setSelectedId(null)}
                onFocus={focusSelected}
              />
            ) : null}
          </div>

          {selectedId ? (
            <div className="absolute top-4 right-4 bottom-4 z-20 hidden w-80 overflow-y-auto rounded-3xl border border-line bg-sheet shadow-float md:block lg:hidden">
              {detail}
            </div>
          ) : null}
        </div>

        <aside className="hidden h-full w-96 shrink-0 overflow-y-auto border-l border-line bg-sheet lg:block">
          {detail}
        </aside>
      </div>

      <div
        className={`fixed inset-0 z-30 flex flex-col bg-paper md:hidden ${listOpen ? "" : "hidden"}`}
      >
        <div className="flex items-center gap-2 border-b border-line px-3 py-3">
          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти страну"
              className="h-11 w-full rounded-xl border border-line bg-sheet pr-3 pl-10 text-base outline-none focus:border-ink"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="press h-11 rounded-xl px-3 text-sm"
            onClick={() => setListOpen(false)}
          >
            Готово
          </button>
        </div>
        <CountryList
          rows={rows}
          indicatorId={indicator.id}
          selectedId={selectedId}
          hoverId={hoverId}
          onSelect={(id) => onSelect(id)}
          onHover={onHover}
          scope="touch"
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {selectedId
          ? `${countryName(selectedId)}. ${indicator.label}: ${
              valueOf(indicator.id, selectedId) == null
                ? "нет данных"
                : indicator.format(valueOf(indicator.id, selectedId) as number)
            }`
          : ""}
      </p>
    </main>
  );
}

function IndicatorChip({
  indicator,
  active,
  onSelect,
}: {
  indicator: Indicator;
  active: boolean;
  onSelect: (id: IndicatorId) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`press h-11 shrink-0 rounded-full px-4 text-sm font-medium ${
        active ? "bg-ink text-paper" : "bg-chip text-ink"
      }`}
      onClick={() => onSelect(indicator.id)}
    >
      {indicator.short}
    </button>
  );
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="press grid size-11 place-items-center border-b border-line last:border-b-0"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
