import { useRef, useEffect } from 'react';

/**
 * Development-only hook to log when a component re-renders and why.
 * Uses useRef to track previous props and compare.
 */
export function useWhyDidYouRender(componentName: string, props: Record<string, unknown>) {
  const previousProps = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (import.meta.env.DEV) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: unknown; to: unknown }> = {};

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.debug(`[WhyRender] ${componentName}:`, changedProps);
      }
    }

    previousProps.current = props;
  });
}

/**
 * Utility to measure component render time in development.
 */
export function useRenderTime(componentName: string) {
  const startTime = useRef(performance.now());

  useEffect(() => {
    if (import.meta.env.DEV) {
      const renderTime = performance.now() - startTime.current;
      if (renderTime > 16) { // More than one frame
        console.warn(`[SlowRender] ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    }
  });

  startTime.current = performance.now();
}
