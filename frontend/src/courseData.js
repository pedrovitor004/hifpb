// Public views share one course projection; administrative views keep the full catalog.
export function courseData(data, courseId) {
  if (!data) return data;
  const classes = data.classes.filter((c) => c.courseId === courseId);
  const subjects = data.subjects.filter((s) => s.courseId === courseId);
  const classIds = new Set(classes.map((c) => c.id)),
    subjectIds = new Set(subjects.map((s) => s.id));
  const lessons = data.lessons
    .filter((l) => (l.classIds || [l.classId]).some((id) => classIds.has(id)))
    .map((l) => {
      const groups = [...new Set([l.classId, ...(l.classIds || [])])].filter(
        (id) => classIds.has(id),
      );
      const disciplines = [
        ...new Set([l.subjectId, ...(l.subjectIds || [])]),
      ].filter((id) => subjectIds.has(id));
      return {
        ...l,
        courseId,
        classId: groups[0],
        classIds: groups,
        subjectId: disciplines[0],
        subjectIds: disciplines,
        courseIds: [courseId],
      };
    });
  const teachers = new Set(
    lessons.flatMap((l) =>
      [l.professorId, ...(l.professorIds || [])].filter(Boolean),
    ),
  );
  const rooms = new Set(lessons.map((l) => l.roomId).filter(Boolean));
  const level = data.courses.find((c) => c.id === courseId)?.level;
  const scope =
    level === "integrado"
      ? "integrados"
      : level === "tecnico"
        ? "tecnicos"
        : "superiores";
  const calendars = (data.calendars || []).filter(
    (c) => courseId && (c.scope === scope || c.scope === "todos"),
  );
  const calendarIds = new Set(calendars.map((c) => c.id));
  return {
    ...data,
    classes,
    subjects,
    lessons,
    professors: data.professors.filter((p) => teachers.has(p.id)),
    rooms: data.rooms.filter((r) => rooms.has(r.id)),
    notices: data.notices.filter(
      (n) =>
        courseId &&
        n.status !== "draft" &&
        (n.audience === "all" ||
          n.courseId === courseId ||
          n.courseIds?.includes(courseId)),
    ),
    calendars,
    calendarEvents: (data.calendarEvents || []).filter((e) =>
      calendarIds.has(e.calendarId),
    ),
  };
}
