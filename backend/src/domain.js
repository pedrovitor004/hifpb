const { z } = require("zod");
const {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} = require("@nestjs/common");
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const text = z.string().trim().min(1).max(200);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v,
  );
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const linkUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (/^\/documents\/[a-zA-Z0-9_-]+\.pdf$/.test(value)) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Use um endereço HTTPS válido ou um documento do sistema.");
const calendarLink = z.object({ label: text, url: linkUrl }).strict();
const schemas = {
  courses: z
    .object({
      name: text,
      code: text,
      level: z.enum(["superior", "integrado", "tecnico"]).optional(),
    })
    .strict(),
  classes: z
    .object({
      name: text,
      courseId: id,
      period: z.number().int().min(0).max(20),
    })
    .strict(),
  professors: z
    .object({
      name: text,
      roomId: id.nullable().optional(),
      description: z.string().max(1000).default(""),
    })
    .strict(),
  subjects: z
    .object({
      name: text,
      code: text,
      courseId: id,
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .default("#b9cdf8"),
      description: z.string().max(2000).default(""),
    })
    .strict(),
  rooms: z
    .object({
      name: text,
      block: text,
      location: z
        .string()
        .max(1000)
        .default("Localização ilustrativa para consulta."),
      type: text.default("Sala de aula"),
    })
    .strict(),
  lessons: z
    .object({
      courseId: id,
      classId: id,
      classIds: z.array(id).max(10).optional(),
      subjectId: id,
      subjectIds: z.array(id).max(10).optional(),
      professorId: id.nullable().default(null),
      professorIds: z.array(id).max(10).optional(),
      roomId: id.nullable().default(null),
      weekday: z.number().int().min(1).max(5),
      startTime: time,
      endTime: time,
      validFrom: date,
      validTo: date.nullable().default(null),
      semester: text,
      description: z.string().max(2000).default(""),
    })
    .strict(),
  notices: z
    .object({
      title: text,
      message: z.string().trim().min(1).max(5000),
      category: z
        .enum(["informacao", "alteracao", "cancelamento"])
        .default("informacao"),
      audience: z.enum(["all", "course"]).default("course"),
      courseId: id.nullable().default(null),
      lessonId: id.nullable().default(null),
      occurrenceDate: date.nullable().default(null),
    })
    .strict(),
  calendars: z
    .object({
      title: text,
      year: z.number().int().min(2000).max(2100),
      version: text,
      documentId: id,
      scope: z.enum(["superiores", "integrados", "tecnicos", "todos"]),
      validFrom: date,
      validTo: date,
      approvalDate: date,
      startPage: z.number().int().min(1).max(10000).default(1),
      links: z.array(calendarLink).max(8).optional(),
      isCurrent: z.boolean().default(false),
      description: z.string().trim().max(2000).default(""),
    })
    .strict(),
  calendarEvents: z
    .object({
      calendarId: id,
      title: text,
      startDate: date,
      endDate: date,
      category: z.enum([
        "aulas",
        "avaliacao",
        "feriado",
        "evento",
        "recesso",
        "prazo",
      ]),
      bimester: z.number().int().min(1).max(4).optional(),
    })
    .strict(),
};
function parse(type, input) {
  const r = schemas[type]?.safeParse(input);
  if (!r?.success)
    throw new BadRequestException(
      r?.error?.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ") || "Recurso inválido",
    );
  if (type === "lessons") {
    if (!/^\d{4}(?:\.[12])?$/.test(r.data.semester))
      throw new BadRequestException(
        "Informe o ano ou semestre no formato 2026 ou 2026.2.",
      );
    r.data.professorIds = [
      ...new Set(
        [r.data.professorId, ...(r.data.professorIds || [])].filter(Boolean),
      ),
    ];
    r.data.professorId = r.data.professorId || r.data.professorIds[0] || null;
    r.data.classIds = [
      ...new Set([r.data.classId, ...(r.data.classIds || [])]),
    ];
    r.data.subjectIds = [
      ...new Set([r.data.subjectId, ...(r.data.subjectIds || [])]),
    ];
    if (r.data.endTime <= r.data.startTime)
      throw new BadRequestException(
        "O horário final deve ser posterior ao inicial.",
      );
    if (r.data.validTo && r.data.validTo < r.data.validFrom)
      throw new BadRequestException("Vigência final anterior à inicial.");
    if (!hasOccurrence(r.data))
      throw new BadRequestException(
        "A vigência não contém o dia da semana selecionado.",
      );
  }
  if (type === "calendars" && r.data.validTo < r.data.validFrom)
    throw new BadRequestException("Vigência final anterior à inicial.");
  if (type === "calendarEvents" && r.data.endDate < r.data.startDate)
    throw new BadRequestException("Data final anterior à inicial.");
  if (type === "notices") {
    if (r.data.audience === "course" && !r.data.courseId)
      throw new BadRequestException("Selecione o curso que receberá o aviso.");
    if (r.data.audience === "all" && r.data.courseId)
      throw new BadRequestException(
        "Um aviso geral não deve ficar restrito a um curso.",
      );
    if (Boolean(r.data.lessonId) !== Boolean(r.data.occurrenceDate))
      throw new BadRequestException("Informe a aula e a data afetada juntas.");
    if (
      r.data.lessonId &&
      (r.data.audience !== "course" ||
        !["alteracao", "cancelamento"].includes(r.data.category))
    )
      throw new BadRequestException(
        "Uma alteração ou cancelamento de aula deve estar vinculado ao curso correspondente.",
      );
  }
  return r.data;
}
function hasOccurrence(l) {
  const from = new Date(l.validFrom + "T00:00:00Z");
  const delta = (l.weekday - from.getUTCDay() + 7) % 7;
  from.setUTCDate(from.getUTCDate() + delta);
  return from.toISOString().slice(0, 10) <= (l.validTo || "9999-12-31");
}
function overlaps(a, b) {
  if (
    a.weekday !== b.weekday ||
    a.startTime >= b.endTime ||
    b.startTime >= a.endTime
  )
    return false;
  const validFrom = a.validFrom > b.validFrom ? a.validFrom : b.validFrom;
  const validTo =
    (a.validTo || "9999-12-31") < (b.validTo || "9999-12-31")
      ? a.validTo || "9999-12-31"
      : b.validTo || "9999-12-31";
  return validFrom <= validTo && hasOccurrence({ ...a, validFrom, validTo });
}
function assertNoConflicts(lesson, others, ignoreId) {
  const teachers = (l) =>
    [l.professorId, ...(l.professorIds || [])].filter(Boolean);
  const groups = (l) => [l.classId, ...(l.classIds || [])];
  const conflict = others.find(
    (l) =>
      l.id !== ignoreId &&
      overlaps(lesson, l) &&
      (groups(lesson).some((id) => groups(l).includes(id)) ||
        teachers(lesson).some((id) => teachers(l).includes(id)) ||
        (l.roomId && lesson.roomId && l.roomId === lesson.roomId)),
  );
  if (conflict) {
    const resource = groups(lesson).some((id) => groups(conflict).includes(id))
      ? "Turma"
      : teachers(lesson).some((id) => teachers(conflict).includes(id))
        ? "Professor"
        : "Sala";
    throw new ConflictException(
      `${resource} já ocupado(a) em uma aula das ${conflict.startTime} às ${conflict.endTime}, no mesmo dia e vigência. Escolha outro horário ou altere a aula existente.`,
    );
  }
}
function assertScope(user, record) {
  if (user?.role === "coordinator") return;
  // Shared catalogs require global coordinators; course-scoped users edit only their courses.
  if (
    user.courseIds?.length &&
    (!record.courseId ||
      ![record.courseId, ...(record.courseIds || [])].every((id) =>
        user.courseIds.includes(id),
      ))
  )
    throw new ForbiddenException("Registro fora dos cursos autorizados.");
}
function assertId(value) {
  if (!id.safeParse(value).success)
    throw new BadRequestException("Identificador inválido.");
  return value;
}
module.exports = {
  schemas,
  parse,
  overlaps,
  assertNoConflicts,
  assertScope,
  assertId,
};
