import { useEffect, useRef } from "react";
import { bus, type AppEvents } from "~/event/event-bus";

/**
 * Subscribe to a mitt event with automatic cleanup on unmount.
 * Handler ref is kept stable — only re-subscribes when `event` changes.
 */
export function useEvent<K extends keyof AppEvents>(
  event: K,
  handler: (data: AppEvents[K]) => void,
): void;

export function useEvent<K extends keyof AppEvents>(
  events: readonly K[],
  handler: (data: AppEvents[K], event: K) => void,
): void;

export function useEvent<K extends keyof AppEvents>(
  eventOrEvents: K | readonly K[],
  handler: (data: AppEvents[K], event?: K) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const events = Array.isArray(eventOrEvents)
      ? eventOrEvents
      : [eventOrEvents];

    const wrapped = (data: AppEvents[K]) => {
      handlerRef.current(data);
    };

    const wrappedWithKey = (key: K) => (data: AppEvents[K]) => {
      handlerRef.current(data, key);
    };

    events.forEach((key) => {
      if (Array.isArray(eventOrEvents)) bus.on(key, wrappedWithKey(key));
      else bus.on(key, wrapped);
    });

    return () => {
      events.forEach((key) => {
        if (Array.isArray(eventOrEvents)) bus.off(key, wrappedWithKey(key));
        else bus.off(key, wrapped);
      });
    };
  }, [Array.isArray(eventOrEvents) ? eventOrEvents.join("|") : eventOrEvents]);
}
