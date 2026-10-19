declare module "d3-geo" {
  export interface GeoProjection {
    fitExtent(
      extent: [[number, number], [number, number]],
      object: unknown,
    ): GeoProjection;
  }
  export interface GeoPath {
    (object: unknown): string | null;
    bounds(object: unknown): [[number, number], [number, number]];
  }
  export function geoNaturalEarth1(): GeoProjection;
  export function geoPath(projection?: GeoProjection): GeoPath;
  export function geoGraticule10(): unknown;
}

declare module "d3-zoom" {
  export interface ZoomTransform {
    k: number;
    x: number;
    y: number;
    translate(x: number, y: number): ZoomTransform;
    scale(k: number): ZoomTransform;
  }
  export interface ZoomEvent {
    transform: ZoomTransform;
    sourceEvent: Event | null;
  }
  export interface ZoomBehavior {
    (selection: unknown): void;
    scaleExtent(extent: [number, number]): ZoomBehavior;
    on(typenames: string, handler: (event: ZoomEvent) => void): ZoomBehavior;
    transform(selection: unknown, transform: ZoomTransform): void;
    scaleBy(selection: unknown, k: number): void;
  }
  export function zoom(): ZoomBehavior;
  export function zoomTransform(node: Element): ZoomTransform;
  export const zoomIdentity: ZoomTransform;
}

declare module "d3-selection" {
  export interface Transition {
    duration(ms: number): Transition;
    call(fn: Function, ...args: unknown[]): Transition;
  }
  export interface Selection {
    call(fn: Function, ...args: unknown[]): Selection;
    transition(): Transition;
    on(type: string, listener: null): Selection;
  }
  export function select(element: Element): Selection;
}

declare module "d3-transition";

declare module "topojson-client" {
  export function feature(
    topology: unknown,
    object: unknown,
  ): {
    features: Array<{
      id?: string | number;
      properties: { name?: string };
    }>;
  };
}

declare module "world-atlas/countries-110m.json" {
  const value: { objects: { countries: unknown } };
  export default value;
}
