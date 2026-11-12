export const defaultCalendarLinks = [
  { label: "Horários por turma", url: "/documents/turmas-2026-10-27.pdf" },
  {
    label: "Horários por professor",
    url: "/documents/professores-2026-10-27.pdf",
  },
];
export function currentCalendar(calendars, scope) {
  return calendars
    .filter((c) => c.scope === scope)
    .slice()
    .sort(
      (a, b) =>
        Number(Boolean(b.isCurrent)) - Number(Boolean(a.isCurrent)) ||
        b.approvalDate.localeCompare(a.approvalDate) ||
        (b.updatedAt?._seconds || 0) - (a.updatedAt?._seconds || 0) ||
        b.year - a.year,
    )[0];
}
