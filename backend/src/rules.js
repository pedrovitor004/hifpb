const { BadRequestException, ConflictException } = require("@nestjs/common");
const ids = (record, key) =>
  [record[key], ...(record[key + "s"] || [])].filter(Boolean);
const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
function references(type, data, all) {
  const find = (collection, id) => {
    const record = all[collection].find((r) => r.id === id);
    if (!record)
      throw new BadRequestException(`Referência inválida: ${collection}/${id}`);
    return record;
  };
  if (data.courseId) find("courses", data.courseId);
  if (type === "lessons") {
    const groups = ids(data, "classId").map((id) => find("classes", id));
    const subjects = ids(data, "subjectId").map((id) => find("subjects", id));
    data.courseIds = [...new Set(groups.map((c) => c.courseId))];
    if (
      find("classes", data.classId).courseId !== data.courseId ||
      find("subjects", data.subjectId).courseId !== data.courseId
    )
      throw new BadRequestException(
        "Curso, turma e disciplina devem ser consistentes.",
      );
    if (
      subjects.some((s) => !data.courseIds.includes(s.courseId)) ||
      data.courseIds.some((id) => !subjects.some((s) => s.courseId === id))
    )
      throw new BadRequestException(
        "Cada curso das turmas deve ter uma disciplina correspondente na aula.",
      );
    for (const id of ids(data, "professorId")) find("professors", id);
    if (data.roomId) find("rooms", data.roomId);
  }
  if (type === "calendars") {
    const document = find("documents", data.documentId);
    if (document.scope && document.scope !== data.scope)
      throw new BadRequestException(
        "O PDF deve pertencer à mesma modalidade do calendário.",
      );
    if (document.pageCount && data.startPage > document.pageCount)
      throw new BadRequestException("A página inicial não existe no PDF.");
  }
  if (type === "calendarEvents") {
    const calendar = find("calendars", data.calendarId);
    if (data.startDate < calendar.validFrom || data.endDate > calendar.validTo)
      throw new BadRequestException(
        "O evento deve estar dentro da vigência do calendário.",
      );
    if (data.bimester && calendar.scope !== "integrados")
      throw new BadRequestException(
        "Bimestre é aplicável apenas ao calendário integrado.",
      );
  }
  if (type === "notices") {
    data.courseIds = data.audience === "all" ? [] : [data.courseId];
    if (data.lessonId) {
      const lesson = find("lessons", data.lessonId);
      const courseIds = [
        ...new Set([
          lesson.courseId,
          ...(lesson.courseIds || []),
          ...ids(lesson, "classId").map((id) => find("classes", id).courseId),
        ]),
      ];
      if (!courseIds.includes(data.courseId))
        throw new BadRequestException(
          "A aula não pertence ao curso selecionado.",
        );
      const day = new Date(data.occurrenceDate + "T12:00:00Z").getUTCDay();
      if (
        day !== lesson.weekday ||
        data.occurrenceDate < lesson.validFrom ||
        (lesson.validTo && data.occurrenceDate > lesson.validTo)
      )
        throw new BadRequestException(
          "A data deve corresponder ao dia e à vigência da aula.",
        );
      data.courseIds = courseIds;
    }
  }
}
function assertCatalogIntegrity(type, data, id, old, all) {
  if (
    type === "notices" &&
    data.lessonId &&
    (all.notices || []).some(
      (n) =>
        n.id !== id &&
        n.lessonId === data.lessonId &&
        n.occurrenceDate === data.occurrenceDate,
    )
  )
    throw new ConflictException(
      "Já existe um aviso para essa aula nesta data. Edite o comunicado existente.",
    );
  if (type === "lessons" && old) {
    const affected = (all.notices || []).filter((n) => n.lessonId === id);
    if (
      affected.some(
        (n) =>
          new Date(n.occurrenceDate + "T12:00:00Z").getUTCDay() !==
            data.weekday ||
          n.occurrenceDate < data.validFrom ||
          (data.validTo && n.occurrenceDate > data.validTo) ||
          ![data.courseId, ...(data.courseIds || [])].includes(n.courseId),
      )
    )
      throw new ConflictException(
        "A alteração invalidaria avisos vinculados à aula. Ajuste os comunicados antes de mudar o dia, curso ou vigência.",
      );
  }
  if (
    old &&
    ["classes", "subjects"].includes(type) &&
    old.courseId !== data.courseId
  ) {
    const field = type === "classes" ? "classId" : "subjectId";
    if ([...all.lessons, ...all.drafts].some((l) => ids(l, field).includes(id)))
      throw new ConflictException(
        "Registro referenciado por aulas ou rascunhos. Remova as relações antes de mudar o curso.",
      );
  }
  if (old && type === "calendars") {
    const events = all.calendarEvents.filter((e) => e.calendarId === id);
    if (
      events.some(
        (e) => e.startDate < data.validFrom || e.endDate > data.validTo,
      ) ||
      (old.scope !== data.scope && events.length)
    )
      throw new ConflictException(
        "A alteração invalidaria eventos do calendário. Ajuste os eventos antes de alterar a vigência ou modalidade.",
      );
    if (old.documentId !== data.documentId && events.length)
      throw new ConflictException(
        "Publique uma nova versão do calendário ao substituir um PDF com eventos cadastrados.",
      );
  }
  const duplicate = (all[type] || []).some(
    (r) =>
      r.id !== id &&
      (type === "courses"
        ? normalize(r.code) === normalize(data.code)
        : type === "subjects"
          ? r.courseId === data.courseId &&
            normalize(r.code) === normalize(data.code)
          : type === "classes"
            ? r.courseId === data.courseId &&
              normalize(r.name) === normalize(data.name)
            : type === "rooms"
              ? normalize(r.block) === normalize(data.block) &&
                normalize(r.name) === normalize(data.name)
              : false),
  );
  if (duplicate)
    throw new ConflictException(
      "Já existe um cadastro com essa identificação neste contexto.",
    );
}
module.exports = { references, assertCatalogIntegrity };
