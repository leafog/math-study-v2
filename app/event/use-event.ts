import { useEffect, useRef } from "react";
import { bus, type AppEvents } from "~/event/event-bus";

/**
 * Subscribe to a mitt event with automatic cleanup on unmount.
 * Handler ref is kept stable — only re-subscribes when `event` changes.
 */
export function useEvent<K extends keyof AppEvents>(
  event: K,
  handler: (data: AppEvents[K]) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const wrapped = (data: AppEvents[K]) => {
      handlerRef.current(data);
    };
    bus.on(event, wrapped);
    return () => {
      bus.off(event, wrapped);
    };
  }, [event]);
}
