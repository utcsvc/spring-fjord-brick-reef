export const RAMP_STOPS: ReadonlyArray<readonly [number, [number, number, number]]> = [
  [0, [239, 230, 214]],
  [0.22, [236, 201, 164]],
  [0.48, [214, 140, 86]],
  [0.72, [168, 78, 40]],
  [1, [92, 36, 22]],
];

export const RAMP_GRADIENT = `linear-gradient(90deg, ${RAMP_STOPS.map(
  ([t, [r, g, b]]) => `rgb(${r} ${g} ${b}) ${Math.round(t * 100)}%`,
).join(", ")})`;

export function ramp(t: number): string {
  const x = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < RAMP_STOPS.length - 2 && RAMP_STOPS[i + 1][0] < x) i += 1;
  const [t0, c0] = RAMP_STOPS[i];
  const [t1, c1] = RAMP_STOPS[i + 1];
  const u = t1 === t0 ? 0 : (x - t0) / (t1 - t0);
  const c = c0.map((v, k) => Math.round(v + (c1[k] - v) * u));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

export function normalize(
  value: number,
  min: number,
  max: number,
  scale: "linear" | "log",
): number {
  if (!Number.isFinite(value)) return 0;
  if (scale === "log") {
    const lo = Math.log(Math.max(min, 1e-6));
    const hi = Math.log(Math.max(max, min * 1.0001, 1e-6));
    if (hi === lo) return 0.5;
    const x = Math.log(Math.max(value, 1e-6));
    return Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
  }
  if (max === min) return 0.5;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}
