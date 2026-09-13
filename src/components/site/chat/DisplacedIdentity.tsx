"use client";

import { Suspense, lazy, useSyncExternalStore, type ReactNode } from "react";

/**
 * The effect needs html-in-canvas, which today only exists in Chrome behind a
 * flag or an origin trial. Everyone else could never see it, so the shader,
 * simulation and WebGL plumbing are split out and fetched only once the browser
 * has proved it can run them.
 *
 * The capability probe is duplicated here rather than imported, because
 * importing it from the component would pull the whole module back into the
 * initial chunk and undo the split.
 */
function canDisplace(): boolean {
      if (typeof document === "undefined") return false;
      const probe = document.createElement("canvas") as HTMLCanvasElement &
            Record<string, unknown>;
      const ctx = probe.getContext("2d") as Record<string, unknown> | null;
      return (
            typeof ctx?.drawElementImage === "function" &&
            typeof probe.requestPaint === "function"
      );
}

const Displacement = lazy(() =>
      import("../../canvasui/Displacement").then((mod) => ({
            default: mod.Displacement,
      })),
);

const emptySubscribe = () => () => {};

export function DisplacedIdentity({
      className,
      children,
}: {
      className?: string;
      children: ReactNode;
}) {
      const supported = useSyncExternalStore(
            emptySubscribe,
            canDisplace,
            () => false,
      );
      const plain = <div className={className}>{children}</div>;

      if (!supported) return plain;

      return (
            <Suspense fallback={plain}>
                  <Displacement
                        className={className}
                        grid={50}
                        cellAspect={1}
                        radius={0.12}
                        strength={0.14}
                        threshold={700}
                        relaxation={0.9}
                        shift={1}
                        aberration={1.5}
                        grain={0.1}
                        grainSize={1}
                        grainSpeed={1}
                        scramble={1.2}
                  >
                        {children}
                  </Displacement>
            </Suspense>
      );
}
