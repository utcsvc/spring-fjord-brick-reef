import { select } from "d3-selection";
import "d3-transition";
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { memo, useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Bounds, MapShape } from "@/data/geometry";

export type MapZoom = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: (immediate?: boolean) => void;
  focus: (bounds: Bounds) => void;
};

type Props = {
  shapes: MapShape[];
  sphere: string;
  graticule: string;
  colors: Record<string, string>;
  selectedId: string | null;
  hoverId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onPoint: (id: string | null, point: { x: number; y: number } | null) => void;
  zoomRef: RefObject<MapZoom | null>;
};

function motionMs(ms: number): number {
  if (typeof window === "undefined") return ms;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
}

function WorldMapInner({
  shapes,
  sphere,
  graticule,
  colors,
  selectedId,
  hoverId,
  onSelect,
  onHover,
  onPoint,
  zoomRef,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const behaviorRef = useRef<ZoomBehavior | null>(null);
  const pointRef = useRef(onPoint);
  pointRef.current = onPoint;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const behavior = zoom()
      .scaleExtent([1, 14])
      .on("start", (event) => {
        const kind = event.sourceEvent?.type;
        if (kind === "mousedown" || kind === "touchstart") svg.classList.add("is-panning");
        if (kind === "mousedown" || kind === "touchstart") pointRef.current(null, null);
      })
      .on("zoom", (event) => {
        const group = groupRef.current;
        if (!group) return;
        const next = event.transform;
        group.setAttribute("transform", `translate(${next.x} ${next.y}) scale(${next.k})`);
      })
      .on("end", () => {
        svg.classList.remove("is-panning");
      });
    select(svg).call(behavior);
    behaviorRef.current = behavior;

    const apply = (next: ZoomTransform, duration: number) => {
      const current = select(svg);
      if (duration <= 0) current.call(behavior.transform, next);
      else current.transition().duration(duration).call(behavior.transform, next);
    };

    zoomRef.current = {
      zoomIn: () => {
        select(svg).transition().duration(motionMs(240)).call(behavior.scaleBy, 1.5);
      },
      zoomOut: () => {
        select(svg).transition().duration(motionMs(240)).call(behavior.scaleBy, 1 / 1.5);
      },
      reset: (immediate) => apply(zoomIdentity, immediate ? 0 : motionMs(520)),
      focus: (bounds) => {
        const [[x0, y0], [x1, y1]] = bounds;
        const dx = x1 - x0;
        const dy = y1 - y0;
        if (!Number.isFinite(dx) || !Number.isFinite(dy) || dx <= 0 || dy <= 0) return;
        const width = svg.clientWidth;
        const height = svg.clientHeight;
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const fit = 0.62 / Math.max(dx / width, dy / height);
        const k = Math.min(12, Math.max(1, fit));
        apply(
          zoomIdentity.translate(width / 2 - cx * k, height / 2 - cy * k).scale(k),
          motionMs(640),
        );
      },
    };

    return () => {
      select(svg).on(".zoom", null);
      behaviorRef.current = null;
      zoomRef.current = null;
    };
  }, [zoomRef]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const group = groupRef.current;
    if (!svg || !group) return;
    const current = zoomTransform(svg);
    group.setAttribute("transform", `translate(${current.x} ${current.y}) scale(${current.k})`);
  });

  const ordered = shapes.filter((shape) => shape.id !== selectedId && shape.id !== hoverId);
  if (hoverId) {
    const hot = shapes.find((shape) => shape.id === hoverId);
    if (hot) ordered.push(hot);
  }
  if (selectedId && selectedId !== hoverId) {
    const picked = shapes.find((shape) => shape.id === selectedId);
    if (picked) ordered.push(picked);
  }

  return (
    <svg
      ref={svgRef}
      className="map-svg absolute inset-0 h-full w-full"
      role="img"
      aria-label="Хороплетная карта мира"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const id = (event.target as Element).closest?.("[data-id]")?.getAttribute("data-id") ?? null;
        onPoint(id, { x: event.clientX - rect.left, y: event.clientY - rect.top });
        onHover(id);
      }}
      onMouseLeave={() => {
        onPoint(null, null);
        onHover(null);
      }}
      onClick={(event) => {
        const id = (event.target as Element).closest?.("[data-id]")?.getAttribute("data-id");
        if (!id) onSelect(null);
      }}
    >
      <g ref={groupRef}>
        <path className="ocean" d={sphere} />
        <path className="graticule" d={graticule} />
        {ordered.map((shape) => {
          const selected = shape.id === selectedId;
          const hot = shape.id === hoverId;
          return (
            <path
              key={shape.id}
              data-id={shape.id}
              d={shape.d}
              className={`country${selected ? " is-selected" : ""}${hot ? " is-hot" : ""}`}
              style={{ fill: colors[shape.id] ?? "var(--color-land)" }}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(shape.id);
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}

export const WorldMap = memo(WorldMapInner);
