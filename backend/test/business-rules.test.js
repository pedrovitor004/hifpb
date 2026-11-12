const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parse, assertScope } = require("../src/domain");
const { references, assertCatalogIntegrity } = require("../src/rules");
const base = {
  courses: [{ id: "a" }, { id: "b" }],
  classes: [
    { id: "ca", courseId: "a" },
    { id: "cb", courseId: "b" },
  ],
  subjects: [
    { id: "sa", courseId: "a", code: "MAT" },
    { id: "sb", courseId: "b", code: "MAT" },
  ],
  professors: [{ id: "p" }],
  rooms: [{ id: "r", name: "101", block: "A" }],
  lessons: [],
  drafts: [],
  calendars: [],
  calendarEvents: [],
  documents: [{ id: "pdf", scope: "superiores", pageCount: 2 }],
};
const calendar = {
  title: "Calendário",
  year: 2027,
  version: "1",
  documentId: "pdf",
  scope: "superiores",
  validFrom: "2027-01-01",
  validTo: "2027-12-31",
  approvalDate: "2026-11-12",
};
test("links rejeitam protocolos executáveis, HTTP e credenciais", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "http://example.com",
    "https://user:password@example.com",
    "//example.com",
  ])
    assert.throws(() =>
      parse("calendars", { ...calendar, links: [{ label: "Link", url }] }),
    );
  for (const url of [
    "https://www.ifpb.edu.br/calendario",
    "/documents/turmas-2026-10-27.pdf",
  ])
    assert.doesNotThrow(() =>
      parse("calendars", { ...calendar, links: [{ label: "Link", url }] }),
    );
  assert.throws(() =>
    parse("calendars", {
      ...calendar,
      links: Array.from({ length: 9 }, () => ({
        label: "x",
        url: "https://example.com",
      })),
    }),
  );
});
test("PDF deve corresponder à modalidade e página existente", () => {
  const value = parse("calendars", calendar);
  assert.doesNotThrow(() => references("calendars", value, base));
  assert.throws(
    () => references("calendars", { ...value, scope: "integrados" }, base),
    /modalidade/,
  );
  assert.throws(
    () => references("calendars", { ...value, startPage: 3 }, base),
    /página/,
  );
});
test("eventos respeitam a vigência e bimestre se restringe aos integrados", () => {
  const all = { ...base, calendars: [{ id: "c", ...calendar }] };
  const event = {
    calendarId: "c",
    title: "Aula",
    startDate: "2027-05-01",
    endDate: "2027-05-01",
    category: "aulas",
  };
  assert.doesNotThrow(() => references("calendarEvents", event, all));
  assert.throws(
    () =>
      references("calendarEvents", { ...event, endDate: "2028-01-01" }, all),
    /vigência/,
  );
  assert.throws(
    () => references("calendarEvents", { ...event, bimester: 1 }, all),
    /Bimestre/,
  );
  assert.throws(
    () =>
      assertCatalogIntegrity(
        "calendars",
        { ...calendar, validTo: "2027-04-30" },
        "c",
        calendar,
        { ...all, calendarEvents: [event] },
      ),
    /eventos/,
  );
});
test("aula compartilhada exige disciplina de cada curso e protege referências adicionais", () => {
  const lesson = {
    courseId: "a",
    classId: "ca",
    classIds: ["ca", "cb"],
    subjectId: "sa",
    subjectIds: ["sa"],
    professorId: "p",
    roomId: "r",
  };
  assert.throws(
    () => references("lessons", lesson, base),
    /disciplina correspondente/,
  );
  const valid = { ...lesson, subjectIds: ["sa", "sb"] };
  assert.doesNotThrow(() => references("lessons", valid, base));
  for (const type of ["classes", "subjects"]) {
    const id = type === "classes" ? "cb" : "sb",
      old = base[type].find((r) => r.id === id);
    assert.throws(
      () =>
        assertCatalogIntegrity(type, { ...old, courseId: "a" }, id, old, {
          ...base,
          lessons: [valid],
        }),
      /referenciado/,
    );
  }
});
test("identificações duplicadas são recusadas dentro do contexto", () => {
  assert.throws(
    () =>
      assertCatalogIntegrity(
        "subjects",
        { code: " mat ", courseId: "a" },
        "new",
        null,
        base,
      ),
    /Já existe/,
  );
  assert.doesNotThrow(() =>
    assertCatalogIntegrity(
      "subjects",
      { code: "mat", courseId: "other" },
      "new",
      null,
      base,
    ),
  );
  assert.throws(
    () =>
      assertCatalogIntegrity(
        "rooms",
        { name: "101", block: "a" },
        "new",
        null,
        base,
      ),
    /Já existe/,
  );
});
test("todo coordenador autorizado possui acesso global; curso público não limita gestão", () => {
  assert.doesNotThrow(() =>
    assertScope({ role: "coordinator", courseIds: ["a"] }, { courseId: "b" }),
  );
  assert.doesNotThrow(() =>
    assertScope(
      { role: "coordinator", courseIds: ["a"] },
      { scope: "integrados" },
    ),
  );
  assert.throws(() => parse("notices", { title: "x", message: "x" }));
});
