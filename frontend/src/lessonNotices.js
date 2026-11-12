export function currentWeekDates(now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const monday = new Date(today + "T12:00:00Z");
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return Array.from({ length: 5 }, (_, index) =>
    new Date(monday.getTime() + index * 86400000).toISOString().slice(0, 10),
  );
}
export const occurrenceLabel = (value) =>
  value ? value.split("-").reverse().join("/") : "";
export function lessonNotice(notices, lessonId, date) {
  if (!date) return null;
  return (
    notices
      .filter(
        (notice) =>
          notice.status !== "draft" &&
          notice.lessonId === lessonId &&
          notice.occurrenceDate === date &&
          ["alteracao", "cancelamento"].includes(notice.category),
      )
      .sort(
        (a, b) =>
          (b.updatedAt?._seconds || b.createdAt?._seconds || 0) -
          (a.updatedAt?._seconds || a.createdAt?._seconds || 0),
      )[0] || null
  );
}
