export function currentBimester(events, now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  // O primeiro evento letivo de cada bimestre marca o seu início.
  const starts = [1, 2, 3, 4]
    .map((bimester) => ({
      bimester,
      date: events
        .filter((e) => e.bimester === bimester && e.category === "aulas")
        .map((e) => e.startDate)
        .sort()[0],
    }))
    .filter((period) => period.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    starts.filter((period) => period.date <= today).at(-1)?.bimester ??
    starts[0]?.bimester ??
    1
  );
}
