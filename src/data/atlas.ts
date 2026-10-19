import raw from "./atlas.json";
import { normalize, ramp } from "./scale";

export type IndicatorId = "life" | "gdp" | "urban" | "electric" | "co2" | "internet";

export type CountryMeta = {
  name: string;
  en: string;
  region: string;
};

type AtlasFile = {
  countries: Record<string, CountryMeta>;
  values: Record<IndicatorId, Record<string, number>>;
  years: Record<IndicatorId, Record<string, number>>;
};

const data = raw as AtlasFile;

export const countries = data.countries;
export const values = data.values;
export const years = data.years;

const intFmt = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const decFmt = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const compactFmt = new Intl.NumberFormat("ru-RU", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const usdFmt = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function percent(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  const text = Number.isInteger(rounded) ? intFmt.format(rounded) : decFmt.format(rounded);
  return `${text}%`;
}

export type Indicator = {
  id: IndicatorId;
  label: string;
  short: string;
  hint: string;
  scale: "linear" | "log";
  format: (n: number) => string;
  formatCompact: (n: number) => string;
};

export const indicators: Indicator[] = [
  {
    id: "life",
    label: "Продолжительность жизни",
    short: "Жизнь",
    hint: "Сколько лет в среднем живёт человек, родившийся в этом году",
    scale: "linear",
    format: (n) => `${decFmt.format(n)} лет`,
    formatCompact: (n) => decFmt.format(n),
  },
  {
    id: "gdp",
    label: "ВВП на душу",
    short: "ВВП",
    hint: "По паритету покупательной способности, в текущих долларах",
    scale: "log",
    format: (n) => usdFmt.format(n),
    formatCompact: (n) => `${compactFmt.format(n)} $`,
  },
  {
    id: "urban",
    label: "Городское население",
    short: "Города",
    hint: "Доля жителей, которые живут в городах",
    scale: "linear",
    format: percent,
    formatCompact: percent,
  },
  {
    id: "electric",
    label: "Доступ к электричеству",
    short: "Свет",
    hint: "Доля населения, у которого есть электросеть",
    scale: "linear",
    format: percent,
    formatCompact: percent,
  },
  {
    id: "co2",
    label: "Выбросы CO₂",
    short: "CO₂",
    hint: "Тонны на человека, без учёта изменений землепользования",
    scale: "log",
    format: (n) => `${decFmt.format(n)} т`,
    formatCompact: (n) => decFmt.format(n),
  },
  {
    id: "internet",
    label: "Пользователи интернета",
    short: "Сеть",
    hint: "Доля населения, которое пользуется интернетом",
    scale: "linear",
    format: percent,
    formatCompact: percent,
  },
];

export function indicatorById(id: IndicatorId): Indicator {
  const found = indicators.find((item) => item.id === id);
  if (!found) return indicators[0];
  return found;
}

export type Domain = {
  min: number;
  max: number;
  median: number;
  highToLow: string[];
};

const domains = new Map<IndicatorId, Domain>();

function buildDomain(id: IndicatorId, scale: "linear" | "log"): Domain {
  const entries = Object.entries(values[id]).filter(([, value]) => {
    if (!Number.isFinite(value)) return false;
    if (scale === "log" && value <= 0) return false;
    return true;
  });
  entries.sort((a, b) => a[1] - b[1]);
  const nums = entries.map(([, value]) => value);
  const median = nums.length ? nums[Math.floor((nums.length - 1) / 2)] : 0;
  return {
    min: nums[0] ?? 0,
    max: nums[nums.length - 1] ?? 0,
    median,
    highToLow: entries.map(([countryId]) => countryId).reverse(),
  };
}

for (const indicator of indicators) {
  domains.set(indicator.id, buildDomain(indicator.id, indicator.scale));
}

export function domainOf(id: IndicatorId): Domain {
  return domains.get(id) ?? buildDomain(id, "linear");
}

export function valueOf(id: IndicatorId, countryId: string): number | null {
  const value = values[id][countryId];
  return value == null || !Number.isFinite(value) ? null : value;
}

export function yearOf(id: IndicatorId, countryId: string): number | null {
  const year = years[id][countryId];
  return year == null ? null : year;
}

export function yearSpan(id: IndicatorId): string {
  const list = Object.values(years[id]);
  if (!list.length) return "";
  const min = Math.min(...list);
  const max = Math.max(...list);
  return min === max ? String(min) : `${min}–${max}`;
}

export function rankOf(
  id: IndicatorId,
  countryId: string,
): { place: number; total: number } | null {
  const list = domainOf(id).highToLow;
  const index = list.indexOf(countryId);
  if (index < 0) return null;
  return { place: index + 1, total: list.length };
}

export function tone(indicator: Indicator, countryId: string): string {
  const value = valueOf(indicator.id, countryId);
  if (value == null) return "var(--color-land)";
  const domain = domainOf(indicator.id);
  return ramp(normalize(value, domain.min, domain.max, indicator.scale));
}

export function share(indicator: Indicator, countryId: string): number | null {
  const value = valueOf(indicator.id, countryId);
  if (value == null) return null;
  const domain = domainOf(indicator.id);
  return normalize(value, domain.min, domain.max, indicator.scale);
}

export function versusMedian(indicator: Indicator, value: number): string {
  const median = domainOf(indicator.id).median;
  if (!median) return "Медиана недоступна";
  const pct = Math.round(((value - median) / Math.abs(median)) * 100);
  if (Math.abs(pct) < 2) return "Около медианы";
  if (pct > 0) return `На ${intFmt.format(pct)}% выше медианы`;
  return `На ${intFmt.format(Math.abs(pct))}% ниже медианы`;
}

export function countryName(id: string): string {
  return countries[id]?.name ?? id;
}

export function matchesQuery(id: string, query: string): boolean {
  if (!query.trim()) return true;
  const meta = countries[id];
  if (!meta) return false;
  const hay = `${meta.name} ${meta.en}`.toLocaleLowerCase("ru").replaceAll("ё", "е");
  const needle = query.trim().toLocaleLowerCase("ru").replaceAll("ё", "е");
  return hay.includes(needle);
}

export function listRows(id: IndicatorId, query: string) {
  const ranked = domainOf(id).highToLow.map((countryId, index) => ({
    id: countryId,
    place: index + 1,
    value: valueOf(id, countryId),
  }));
  const seen = new Set(ranked.map((row) => row.id));
  const missing = Object.keys(countries)
    .filter((countryId) => !seen.has(countryId))
    .sort((a, b) => countryName(a).localeCompare(countryName(b), "ru"))
    .map((countryId) => ({ id: countryId, place: null as number | null, value: null as number | null }));
  return [...ranked, ...missing].filter((row) => matchesQuery(row.id, query));
}

export function rowDomId(id: string): string {
  return `row-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
