const {
  BadRequestException,
  ConflictException,
  NotFoundException,
} = require("@nestjs/common");
const { db, timestamp } = require("./firebase");
const {
  parse,
  schemas,
  assertNoConflicts,
  assertScope,
  assertId,
} = require("./domain");
const collections = [
  "courses",
  "classes",
  "professors",
  "subjects",
  "rooms",
  "lessons",
  "notices",
  "calendars",
  "calendarEvents",
];
const rows = (s) =>
  s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((d) => !d.archived);
const lock = db.doc("_system/academic-write-lock");
async function snapshot(tx) {
  await tx.get(lock);
  const result = {};
  for (const key of [...collections, "drafts"])
    result[key] = rows(await tx.get(db.collection(key)));
  result.documents = rows(
    await tx.get(
      db
        .collection("documents")
        .select("title", "fileName", "scope", "pageCount", "mimeType"),
    ),
  );
  return result;
}
const { references, assertCatalogIntegrity } = require("./rules");
const relationFields = {
  courses: "courseId",
  classes: "classId",
  professors: "professorId",
  subjects: "subjectId",
  rooms: "roomId",
  calendars: "calendarId",
};
class Store {
  async list(type, query = {}, user) {
    let data = rows(await db.collection(type).get());
    if (user?.role !== "coordinator" && user?.courseIds?.length)
      data = data.filter(
        (d) => d.courseId && user.courseIds.includes(d.courseId),
      );
    if (query.courseId) {
      assertId(query.courseId);
      const course = await this.get("courses", query.courseId);
      if (["professors", "rooms"].includes(type)) {
        const lessons = rows(await db.collection("lessons").get()).filter(
          (l) => l.courseId === course.id || l.courseIds?.includes(course.id),
        );
        data = data.filter((record) =>
          lessons.some((l) =>
            type === "rooms"
              ? l.roomId === record.id
              : l.professorId === record.id ||
                l.professorIds?.includes(record.id),
          ),
        );
      } else if (["calendars", "calendarEvents"].includes(type)) {
        const scope =
          course.level === "integrado"
            ? "integrados"
            : course.level === "tecnico"
              ? "tecnicos"
              : "superiores";
        const calendars = rows(await db.collection("calendars").get()).filter(
          (c) => c.scope === scope || c.scope === "todos",
        );
        data =
          type === "calendars"
            ? calendars
            : data.filter((e) => calendars.some((c) => c.id === e.calendarId));
      } else
        data = data.filter(
          (d) =>
            d.courseId === course.id ||
            d.courseIds?.includes(course.id) ||
            (type === "notices" && d.audience === "all"),
        );
    }
    for (const key of ["classId", "roomId", "calendarId"])
      if (query[key])
        data = data.filter(
          (d) =>
            d[key] === query[key] ||
            (key === "courseId" && d.courseIds?.includes(query[key])) ||
            (key === "classId" && d.classIds?.includes(query[key])),
        );
    if (query.professorId)
      data = data.filter(
        (d) =>
          d.professorId === query.professorId ||
          d.professorIds?.includes(query.professorId),
      );
    if (query.turn && type === "lessons")
      data = data.filter(
        (d) =>
          query.turn === "all" ||
          (query.turn === "night"
            ? d.startTime >= "18:00"
            : query.turn === "morning"
              ? d.startTime < "12:30"
              : d.startTime >= "12:30" && d.startTime < "18:30"),
      );
    if (query.period && type === "lessons") {
      const classes = rows(await db.collection("classes").get());
      data = data.filter((d) =>
        classes.some(
          (c) =>
            (c.id === d.classId || d.classIds?.includes(c.id)) &&
            (!query.courseId || c.courseId === query.courseId) &&
            c.period === Number(query.period),
        ),
      );
    }
    if (query.weekStart && type === "lessons") {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(query.weekStart) ||
        isNaN(Date.parse(query.weekStart))
      )
        throw new BadRequestException("Semana inválida.");
      const end = new Date(query.weekStart);
      end.setUTCDate(end.getUTCDate() + 6);
      data = data.filter(
        (d) =>
          d.validFrom <= end.toISOString().slice(0, 10) &&
          (!d.validTo || d.validTo >= query.weekStart),
      );
    }
    return data;
  }
  async get(type, id) {
    assertId(id);
    const s = await db.collection(type).doc(id).get();
    if (!s.exists || s.data().archived)
      throw new NotFoundException("Registro não encontrado.");
    return { id: s.id, ...s.data() };
  }
  async write(
    type,
    id,
    body,
    user,
    { draft = false, publish = false, notice } = {},
  ) {
    if (id) assertId(id);
    const data = parse(type, body);
    const collection = db.collection(draft ? "drafts" : type);
    const ref = id ? collection.doc(id) : collection.doc();
    return db.runTransaction(async (tx) => {
      const all = await snapshot(tx);
      const old = (draft ? all.drafts : all[type]).find((r) => r.id === ref.id);
      if (
        id &&
        !old &&
        !all.lessons.some((l) => draft && l.id === id) &&
        !publish
      )
        throw new NotFoundException("Registro não encontrado.");
      references(type, data, all);
      assertScope(user, data);
      if (old) assertScope(user, old);
      if (draft) {
        const published = all.lessons.find((l) => l.id === ref.id);
        if (published) assertScope(user, published);
      }
      if (type === "lessons") assertNoConflicts(data, all.lessons, ref.id);
      assertCatalogIntegrity(type, data, ref.id, old, all);
      if (type === "calendars" && data.isCurrent)
        for (const previous of all.calendars.filter(
          (c) => c.scope === data.scope && c.id !== ref.id && c.isCurrent,
        ))
          tx.set(
            db.doc("calendars/" + previous.id),
            { isCurrent: false, updatedAt: timestamp() },
            { merge: true },
          );
      const origin = old || all.lessons.find((l) => l.id === ref.id);
      const value = {
        ...data,
        ...(origin?.source ? { source: origin.source } : {}),
        managedBy: "coordinator",
        status: draft ? "draft" : "published",
        createdAt: old?.createdAt || timestamp(),
        updatedAt: timestamp(),
      };
      if (type === "lessons" && !draft)
        value.revision = (origin?.revision || 0) + 1;
      if (draft) {
        const published = all.lessons.find((l) => l.id === ref.id);
        value.baseUpdatedAt = old
          ? old.baseUpdatedAt
          : published?.updatedAt || null;
        value.baseRevision = old
          ? (old.baseRevision ?? null)
          : published?.revision || 0;
      }

      tx.set(ref, value);
      tx.set(lock, { updatedAt: timestamp() });
      if (publish) tx.delete(db.collection("drafts").doc(ref.id));
      if (notice)
        tx.create(db.collection("notices").doc(), {
          ...parse("notices", notice),
          status: "published",
          createdAt: timestamp(),
          updatedAt: timestamp(),
        });
      return { id: ref.id };
    });
  }
  async publish(id, body, user) {
    assertId(id);
    // The draft is read inside the same transaction as conflict validation and publication.
    return db.runTransaction(async (tx) => {
      const all = await snapshot(tx);
      const draft = all.drafts.find((d) => d.id === id);
      if (!draft) throw new NotFoundException("Rascunho não encontrado.");
      assertScope(user, draft);
      const old = all.lessons.find((l) => l.id === id);
      if (old) assertScope(user, old);
      if (
        (draft.baseRevision != null &&
          (old?.revision || 0) !== draft.baseRevision) ||
        (old?.updatedAt?.toMillis() || null) !==
          (draft.baseUpdatedAt?.toMillis() || null)
      )
        throw new ConflictException(
          "A publicação foi alterada desde o rascunho. Reabra a edição.",
        );
      const fields = Object.fromEntries(
        Object.keys(schemas.lessons.shape)
          .filter((k) => draft[k] !== undefined)
          .map((k) => [k, draft[k]]),
      );
      const data = parse("lessons", fields);
      references("lessons", data, all);
      assertNoConflicts(data, all.lessons, id);
      assertCatalogIntegrity("lessons", data, id, old, all);
      const notice = body.notice ? parse("notices", body.notice) : null;
      if (notice && notice.courseId !== data.courseId)
        throw new BadRequestException("Aviso deve pertencer ao mesmo curso.");
      if (notice) {
        const target = {
          ...all,
          lessons: [
            ...all.lessons.filter((lesson) => lesson.id !== id),
            { id, ...data },
          ],
        };
        references("notices", notice, target);
        assertCatalogIntegrity("notices", notice, null, null, target);
      }
      tx.set(db.doc(`lessons/${id}`), {
        ...data,
        ...(draft.source ? { source: draft.source } : {}),
        managedBy: "coordinator",
        status: "published",
        revision: (old?.revision || 0) + 1,
        createdAt: old?.createdAt || timestamp(),
        updatedAt: timestamp(),
      });
      if (notice)
        tx.create(db.collection("notices").doc(), {
          ...notice,
          status: "published",
          createdAt: timestamp(),
          updatedAt: timestamp(),
        });
      tx.delete(db.doc(`drafts/${id}`));
      tx.set(lock, { updatedAt: timestamp() });
      return { id };
    });
  }
  async remove(type, id, user) {
    assertId(id);
    return db.runTransaction(async (tx) => {
      const all = await snapshot(tx);
      const old = all[type].find((d) => d.id === id);
      if (!old) throw new NotFoundException("Registro não encontrado.");
      assertScope(user, old);
      if (
        type === "lessons" &&
        all.notices.some((notice) => notice.lessonId === id)
      )
        throw new ConflictException(
          "Aula com avisos vinculados. Remova ou desvincule os comunicados antes de excluir a aula.",
        );
      const field = relationFields[type];
      if (
        field &&
        Object.values(all)
          .flat()
          .some(
            (d) =>
              d[field] === id ||
              (type === "professors" && d.professorIds?.includes(id)) ||
              (type === "classes" && d.classIds?.includes(id)) ||
              (type === "subjects" && d.subjectIds?.includes(id)),
          )
      )
        throw new ConflictException(
          "Registro em uso. Remova ou altere as aulas e demais referências, incluindo rascunhos.",
        );
      if (type === "lessons" && all.drafts.some((d) => d.id === id))
        throw new ConflictException(
          "Descarte o rascunho antes de excluir a aula.",
        );
      tx.delete(db.doc(`${type}/${id}`));
      tx.set(lock, { updatedAt: timestamp() });
      return { deleted: true };
    });
  }
}
module.exports = { Store, collections };
