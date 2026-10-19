import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";

export type Bounds = [[number, number], [number, number]];

export type MapShape = {
  id: string;
  d: string;
  bounds: Bounds;
};

export type MapPlate = {
  countries: MapShape[];
  sphere: string;
  graticule: string;
};

const collection = feature(world, world.objects.countries);

export function buildPlate(width: number, height: number): MapPlate | null {
  if (width < 32 || height < 32) return null;
  const projection = geoNaturalEarth1();
  const path = geoPath(projection);
  const sphere = { type: "Sphere" };
  const padX = Math.max(12, Math.round(width * 0.03));
  const padY = Math.max(12, Math.round(height * 0.04));
  projection.fitExtent(
    [
      [padX, padY],
      [width - padX, height - padY],
    ],
    sphere,
  );
  const countries: MapShape[] = [];
  for (const item of collection.features) {
    const rawId = item.id;
    const id =
      rawId == null || rawId === ""
        ? `name:${item.properties?.name ?? "unknown"}`
        : String(parseInt(String(rawId), 10));
    const d = path(item);
    if (!d) continue;
    countries.push({ id, d, bounds: path.bounds(item) });
  }
  return {
    countries,
    sphere: path(sphere) ?? "",
    graticule: path(geoGraticule10()) ?? "",
  };
}
