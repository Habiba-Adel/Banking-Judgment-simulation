"use client";

import { useEffect, useState } from "react";

/**
 * Eases a number from 0 up to `target` shortly after mount (or whenever
 * `target` changes), so a gauge/bar driven by the returned value animates in
 * instead of rendering at its final value instantly. Pair with a CSS
 * `transition` on whatever visual property (width, stroke-dasharray, ...) is
 * derived from the returned number.
 */
export function useAnimatedNumber(target: number): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setValue(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return value;
}
