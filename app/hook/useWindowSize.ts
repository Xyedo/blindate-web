import { useEffect, useLayoutEffect, useState } from "react";
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
export function useWindowSize() {
  const [size, setSize] = useState<{ width: number; height: number }>();

  useIsomorphicLayoutEffect(() => {
    const handleResize = (_ev?: UIEvent) => {
      setSize({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return size;
}
