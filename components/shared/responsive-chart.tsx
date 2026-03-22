"use client";

import * as React from "react";
import { ResponsiveContainer } from "recharts";

export function ResponsiveChart({
  children,
  minHeight = 220,
}: {
  children: React.ReactNode;
  minHeight?: number;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const update = () => {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    update();

    const observer = new ResizeObserver(() => {
      update();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const ready = size.width > 0 && size.height > 0;

  return (
    <div ref={containerRef} className="h-full w-full" style={{ minHeight }}>
      {ready ? (
        <ResponsiveContainer
          width={size.width}
          height={size.height}
          minWidth={0}
          minHeight={minHeight}
        >
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />
      )}
    </div>
  );
}
