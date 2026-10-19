import type { Indicator } from "@/data/atlas";
import { domainOf } from "@/data/atlas";
import { RAMP_GRADIENT, normalize } from "@/data/scale";

export function Legend({ indicator, compact = false }: { indicator: Indicator; compact?: boolean }) {
  const domain = domainOf(indicator.id);
  const medianAt = normalize(domain.median, domain.min, domain.max, indicator.scale);
  return (
    <div className={compact ? "w-44" : "w-full"}>
      <div className="mb-1.5 flex items-center justify-between text-xs text-faint">
        <span>меньше</span>
        <span>больше</span>
      </div>
      <div className="relative h-2.5">
        <div className="h-full rounded-full" style={{ background: RAMP_GRADIENT }} />
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sheet bg-ink"
          style={{ left: `${medianAt * 100}%` }}
          title="Медиана"
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted">
        <span className="tabular">{indicator.formatCompact(domain.min)}</span>
        <span className="tabular">{indicator.formatCompact(domain.max)}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        <span className="size-3 rounded-sm border border-line bg-land" />
        <span>Нет данных</span>
        {compact ? null : <span className="text-faint">· точка — медиана</span>}
      </div>
    </div>
  );
}
