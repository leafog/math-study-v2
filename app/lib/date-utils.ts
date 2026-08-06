import type { TFunction } from "i18next";

/** Time format shared by both variants */
const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/** Includes year — used for dates from a previous year */
const FULL_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  ...TIME_FORMAT,
};

/**
 * Format a date as a locale-aware chat message timestamp via i18next.
 * - Same year → "Aug 6, 14:30"
 * - Previous year → "Aug 6, 2025, 14:30"
 */
export function formatMessageTime(
  date: Date | string | number,
  t: TFunction,
): string {
  const d = date instanceof Date ? date : new Date(date);
  const isThisYear = d.getFullYear() === new Date().getFullYear();
  return t("chat.messageTime", {
    date: d,
    formatParams: {
      date: isThisYear ? TIME_FORMAT : FULL_FORMAT,
    },
  });
}
