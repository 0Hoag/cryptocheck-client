export interface ChartLogicalRange {
  from: number;
  to: number;
}

const MINIMUM_VISIBLE_BARS = 5;

/**
 * Keeps the current viewport centred while changing its width. Lightweight
 * Charts uses logical bar indexes here, so this helper stays provider-agnostic.
 */
export function zoomLogicalRange(
  range: ChartLogicalRange | null,
  multiplier: number,
): ChartLogicalRange | null {
  if (
    !range ||
    !Number.isFinite(range.from) ||
    !Number.isFinite(range.to) ||
    !Number.isFinite(multiplier) ||
    multiplier <= 0 ||
    range.to <= range.from
  ) {
    return null;
  }

  const centre = (range.from + range.to) / 2;
  const nextWidth = Math.max((range.to - range.from) * multiplier, MINIMUM_VISIBLE_BARS);

  return {
    from: centre - nextWidth / 2,
    to: centre + nextWidth / 2,
  };
}
