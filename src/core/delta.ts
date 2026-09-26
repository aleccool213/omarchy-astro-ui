/** Direction and colour of a signed change. Shared by OmStat and OmDelta so a
 *  tile and an inline change never disagree about what "good" looks like. */

export type DeltaDirection = "up" | "down" | "flat";

export interface DeltaModel {
  /** Follows the sign. Drives the arrow. */
  direction: DeltaDirection;
  /** Follows `goodDirection`. Drives the colour: a falling resting HR is "up". */
  tone: DeltaDirection;
  arrow: "▲" | "▼" | "–";
}

export function deltaModel(delta: number, goodDirection: "up" | "down" = "up"): DeltaModel {
  const direction: DeltaDirection = delta === 0 || !Number.isFinite(delta) ? "flat" : delta > 0 ? "up" : "down";
  const tone: DeltaDirection =
    direction === "flat" ? "flat" : (direction === "up") === (goodDirection === "up") ? "up" : "down";
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "–";
  return { direction, tone, arrow };
}
