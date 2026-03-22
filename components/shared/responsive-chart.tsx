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
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const update = () => {
      setReady(element.clientWidth > 0 && element.clientHeight > 0);
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

  return (
    <div ref={containerRef} className="h-full w-full" style={{ minHeight }}>
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={minHeight}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full animate-pulse rounded-2xl bg-white/5" />
      )}
    </div>
  );
}
