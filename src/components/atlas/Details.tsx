import { LocateFixed, X } from "lucide-react";
import {
  countries,
  domainOf,
  indicatorById,
  indicators,
  rankOf,
  share,
  valueOf,
  versusMedian,
  yearOf,
  yearSpan,
  type Indicator,
  type IndicatorId,
} from "@/data/atlas";
import { ramp } from "@/data/scale";

export function Snapshot({
  indicator,
  onSelect,
}: {
  indicator: Indicator;
  onSelect: (id: string) => void;
}) {
  const domain = domainOf(indicator.id);
  const top = domain.highToLow.slice(0, 3);
  const low = domain.highToLow.slice(-3).reverse();
  const span = yearSpan(indicator.id);
  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <p className="font-display text-lg italic text-copper">Сводка</p>
        <h2 className="mt-1 font-display text-3xl leading-tight">{indicator.label}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{indicator.hint}</p>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <Stat label="Медиана" value={indicator.formatCompact(domain.median)} />
        <Stat label="Мин." value={indicator.formatCompact(domain.min)} />
        <Stat label="Макс." value={indicator.formatCompact(domain.max)} />
      </dl>
      <Group title="Выше всех" ids={top} indicator={indicator} onSelect={onSelect} />
      <Group title="Ниже всех" ids={low} indicator={indicator} onSelect={onSelect} />
      <p className="text-xs leading-relaxed text-faint">
        {domain.highToLow.length} стран с данными
        {span ? ` · наблюдения ${span}` : ""}. Нажмите страну на карте или в списке.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-chip px-2.5 py-2">
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="tabular mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

function Group({
  title,
  ids,
  indicator,
  onSelect,
}: {
  title: string;
  ids: string[];
  indicator: Indicator;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-medium text-faint">{title}</h3>
      <ul>
        {ids.map((id) => {
          const value = valueOf(indicator.id, id);
          return (
            <li key={id}>
              <button
                type="button"
                className="press flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-1 text-left hover:bg-chip"
                onClick={() => onSelect(id)}
              >
                <span className="truncate text-sm">{countries[id]?.name ?? id}</span>
                <span className="tabular shrink-0 text-sm text-muted">
                  {value == null ? "—" : indicator.formatCompact(value)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CountryPanel({
  countryId,
  indicatorId,
  onClose,
  onFocus,
}: {
  countryId: string;
  indicatorId: IndicatorId;
  onClose: () => void;
  onFocus: () => void;
}) {
  const meta = countries[countryId];
  const indicator = indicatorById(indicatorId);
  const value = valueOf(indicator.id, countryId);
  const year = yearOf(indicator.id, countryId);
  const rank = rankOf(indicator.id, countryId);
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-copper">{meta?.region || "Территория"}</p>
          <h2 className="mt-1 font-display text-4xl leading-none">{meta?.name ?? countryId}</h2>
          {meta?.en ? <p className="mt-1 text-sm text-faint">{meta.en}</p> : null}
        </div>
        <button
          type="button"
          className="press grid size-11 shrink-0 place-items-center rounded-full border border-line"
          onClick={onClose}
          aria-label="Закрыть карточку"
        >
          <X className="size-4" />
        </button>
      </div>

      <div>
        <p className="text-sm text-muted">{indicator.label}</p>
        <p className="font-display text-5xl leading-none text-copper">
          {value == null ? "—" : indicator.format(value)}
        </p>
        <p className="mt-2 text-sm text-muted">
          {value == null
            ? "В этом показателе нет значения для выбранного контура."
            : `${versusMedian(indicator, value)}${year ? ` · ${year} г.` : ""}`}
        </p>
        {rank ? (
          <p className="mt-1 text-sm">
            {rank.place}-е место из {rank.total}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        className="press inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-copper px-4 text-sm font-medium text-on-copper"
        onClick={onFocus}
      >
        <LocateFixed className="size-4" />
        Приблизить на карте
      </button>

      <div>
        <h3 className="mb-2 text-xs font-medium text-faint">Все показатели</h3>
        <ul className="flex flex-col gap-3">
          {indicators.map((item) => {
            const itemValue = valueOf(item.id, countryId);
            const itemYear = yearOf(item.id, countryId);
            const amount = share(item, countryId);
            const active = item.id === indicatorId;
            return (
              <li key={item.id}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className={`text-sm ${active ? "font-medium" : ""}`}>{item.short}</span>
                  <span className="tabular text-sm text-muted">
                    {itemValue == null ? "нет данных" : item.format(itemValue)}
                    {itemYear ? <span className="text-faint"> · {itemYear}</span> : null}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-chip">
                  <div
                    className="bar-fill h-full rounded-full"
                    style={{
                      width: `${(amount ?? 0) * 100}%`,
                      background: amount == null ? "transparent" : ramp(amount),
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
