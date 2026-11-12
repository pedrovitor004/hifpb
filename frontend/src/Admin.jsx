import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { api } from "./firebase";
import { useData } from "./App";
import {
  Button,
  Card,
  Title,
  Select,
  Empty,
  Loading,
  ErrorState,
  confirm,
  success,
  error,
  days,
  Icon,
  confirmClearFilters,
  chooseSubjectColor,
  RoomIcon,
  CourseIcon,
  SubjectIcon,
} from "./components";
import Modal from "./Modal";
import CalendarAdmin from "./CalendarAdmin";
import {
  categories,
  categoryOf,
  CategoryBadge,
  NoticeAudienceBadge,
} from "./noticeCategories";
import {
  NoticeAudienceSelector,
  NoticeLessonFields,
} from "./NoticeTargetFields";
const catalogs = {
  calendars: ["Calendários", "calendar"],
  professors: ["Professores", "professors"],
  subjects: ["Disciplinas", "subjects"],
  rooms: ["Salas", "rooms"],
  notices: ["Avisos", "bell"],
  courses: ["Cursos", "graduation"],
  classes: ["Turmas", "detailUsers"],
};
const fields = {
  professors: [
    ["name", "Nome"],
    ["roomId", "Sala de referência", "rooms"],
    ["description", "Descrição", "textarea"],
  ],
  subjects: [
    ["name", "Nome"],
    ["code", "Sigla"],
    ["courseId", "Curso", "courses"],
    ["color", "Cor", "color"],
    ["description", "Descrição", "textarea"],
  ],
  rooms: [
    ["name", "Identificação"],
    ["block", "Bloco"],
    ["type", "Tipo"],
    ["location", "Localização", "textarea"],
  ],
  notices: [
    ["title", "Título"],
    ["message", "Mensagem", "textarea"],
    ["audience", "Destinatários", "audience"],
    ["courseId", "Curso", "courses"],
    ["category", "Categoria", "category"],
    ["lessonId", "Aula", "notice-meta"],
    ["occurrenceDate", "Data", "notice-meta"],
  ],
  courses: [
    ["name", "Nome"],
    ["code", "Sigla"],
    ["level", "Modalidade", "level"],
  ],
  classes: [
    ["name", "Nome"],
    ["courseId", "Curso", "courses"],
    ["period", "Período", "period"],
  ],
  lessons: [
    ["courseId", "Curso", "courses"],
    ["classId", "Turma", "classes"],
    ["subjectId", "Disciplina", "subjects"],
    ["professorId", "Docente", "professors"],
    ["roomId", "Sala", "rooms"],
    ["weekday", "Dia da semana", "weekday"],
    ["startTime", "Horário inicial", "time"],
    ["endTime", "Horário final", "time"],
    ["validFrom", "Vigência inicial", "date"],
    ["validTo", "Vigência final", "date"],
    ["semester", "Semestre"],
    ["description", "Informações complementares", "textarea"],
  ],
};
const defaults = {
  courses: { level: "superior" },
  lessons: {
    courseId: "ads",
    classId: "ads-4",
    weekday: 2,
    startTime: "18:30",
    endTime: "20:10",
    validFrom: "2026-07-01",
    validTo: "2026-12-31",
    semester: "2026.2",
  },
  notices: {
    courseId: "ads",
    category: "informacao",
    audience: "course",
    lessonId: null,
    occurrenceDate: null,
  },
  subjects: { courseId: "ads", color: "#b9cdf8" },
  classes: { courseId: "ads", period: 1 },
};
export default function Admin() {
  const data = useData();
  const [profile, setProfile] = useState(null),
    [failure, setFailure] = useState(""),
    [tab, setTab] = useState(() =>
      ["lessons", "drafts", ...Object.keys(catalogs)].includes(
        new URLSearchParams(window.location.search).get("tab"),
      )
        ? new URLSearchParams(window.location.search).get("tab")
        : "lessons",
    );
  const [form, setForm] = useState(null),
    [original, setOriginal] = useState(""),
    [editing, setEditing] = useState(null),
    [busy, setBusy] = useState(false),
    [drafts, setDrafts] = useState([]),
    [publishNotice, setPublishNotice] = useState(false);
  const [search, setSearch] = useState(""),
    [period, setPeriod] = useState("");
  const [filtersCleared, setFiltersCleared] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  async function refreshDrafts() {
    setDrafts(await api("/drafts"));
  }
  useEffect(() => {
    if (data.user)
      api("/auth/me")
        .then((p) => {
          setProfile(p);
          return refreshDrafts();
        })
        .catch((e) => setFailure(e.message));
  }, [data.user]);
  if (data.user === undefined) return <Loading />;
  if (!data.user) return <Navigate to="/entrar" replace />;
  if (failure) return <ErrorState message={failure} />;
  if (!profile) return <Loading />;
  const type = tab === "drafts" ? "lessons" : tab,
    records = tab === "drafts" ? drafts : data[tab];
  function label(record) {
    if (type === "lessons")
      return `${data.subjects.find((s) => s.id === record.subjectId)?.code || record.subjectId} • ${days[record.weekday - 1]}`;
    return record.name || record.title;
  }
  const visible = records.filter(
    (r) =>
      (!profile.courseIds?.length ||
        (r.courseId && profile.courseIds.includes(r.courseId))) &&
      (!period ||
        data.classes.find((c) => c.id === r.classId)?.period ===
          Number(period)) &&
      `${label(r)} ${r.code || ""} ${r.block || ""} ${data.professors.find((p) => p.id === r.professorId)?.name || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const dirty = form && JSON.stringify(form) !== original;
  async function close() {
    if (busy) return;
    if (
      dirty &&
      !(await confirm(
        "As alterações ainda não foram salvas. Deseja descartar a edição?",
      ))
    )
      return;
    setForm(null);
  }
  function edit(record) {
    setEditing(record?.id || null);
    const clean = Object.fromEntries(
      fields[type].map(([key]) => [
        key,
        record?.[key] ?? defaults[type]?.[key] ?? "",
      ]),
    );
    if (!record) {
      const course = data.courses.find(
        (c) => !profile.courseIds?.length || profile.courseIds.includes(c.id),
      );
      if (clean.courseId !== undefined) clean.courseId = course?.id || "";
      if (type === "lessons") {
        const today = new Date().toLocaleDateString("en-CA");
        const year = Number(today.slice(0, 4)),
          half = Number(today.slice(5, 7)) <= 6 ? 1 : 2;
        Object.assign(clean, {
          classId:
            data.classes.find((c) => c.courseId === clean.courseId)?.id || "",
          validFrom: today,
          validTo: `${year}-${half === 1 ? "06-30" : "12-31"}`,
          semester: `${year}.${half}`,
        });
      }
    }
    if (type === "notices" && clean.audience === "all") clean.courseId = null;
    setShowDetails(false);
    setForm(clean);
    setOriginal(JSON.stringify(clean));
    setPublishNotice(false);
  }
  async function run(action) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      await Promise.all([data.load(), refreshDrafts()]);
    } catch (e) {
      await error(e);
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    await run(async () => {
      const body = { ...form };
      for (const key of ["weekday", "period"])
        if (body[key] !== undefined) body[key] = Number(body[key]);
      if (type === "notices") {
        body.courseId = body.audience === "all" ? null : body.courseId;
        body.lessonId ||= null;
        body.occurrenceDate ||= null;
      }
      if (type === "professors" && !body.roomId) delete body.roomId;
      if (type === "lessons") {
        body.roomId ||= null;
        body.professorId ||= null;
        body.validTo ||= null;
        const origin = (tab === "drafts" ? drafts : data.lessons).find(
          (r) => r.id === editing,
        );
        if (origin && origin.professorId === body.professorId)
          body.professorIds = origin.professorIds;
        if (
          origin &&
          origin.classId === body.classId &&
          origin.courseId === body.courseId
        )
          body.classIds = origin.classIds;
        if (
          origin &&
          origin.subjectId === body.subjectId &&
          origin.courseId === body.courseId
        )
          body.subjectIds = origin.subjectIds;
      }
      const path = type === "lessons" ? "/drafts" : "/" + type;
      await api(path + (editing ? "/" + editing : ""), {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      setForm(null);
      success(
        type === "lessons"
          ? "Rascunho salvo. Revise e publique na aba Rascunhos."
          : "Registro salvo com sucesso.",
      );
    });
  }
  async function publish(record) {
    const subject = data.subjects.find((s) => s.id === record.subjectId)?.code,
      room = data.rooms.find((r) => r.id === record.roomId)?.name;
    if (
      !(await confirm(
        `Publicar ${subject} em ${days[record.weekday - 1]}, ${record.startTime}–${record.endTime}, ${room ? "sala " + room : "sala não informada"}? A alteração ficará visível para todos.`,
      ))
    )
      return;
    await run(async () => {
      const notice = publishNotice
        ? {
            title: "Alteração de horário",
            message: `A grade da turma ${data.classes.find((c) => c.id === record.classId)?.name || record.classId} foi atualizada. Consulte os horários publicados.`,
            category: "alteracao",
            courseId: record.courseId,
          }
        : undefined;
      await api(`/drafts/${record.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ notice }),
      });
      setForm(null);
      success("Horário publicado com sucesso.");
    });
  }
  async function remove(record) {
    if (
      !(await confirm(
        tab === "drafts"
          ? `Descartar o rascunho de ${label(record)}? O registro publicado será preservado.`
          : `Excluir ${label(record)}? A operação será recusada se houver referências em uso.`,
      ))
    )
      return;
    await run(async () => {
      await api(`/${tab}/${record.id}`, { method: "DELETE" });
      success(tab === "drafts" ? "Rascunho descartado." : "Registro excluído.");
    });
  }
  const title =
    tab === "lessons"
      ? "Programação da turma"
      : tab === "drafts"
        ? "Rascunhos para revisão"
        : catalogs[tab][0];
  const currentDraft = drafts.find((d) => d.id === editing);
  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <Title
          badge={false}
          title="Painel da coordenação"
          subtitle="Gerencie os cursos e a programação acadêmica."
        />
        <Link
          to="/horarios"
          className="flex items-center gap-2 rounded-control border border-line bg-panel px-4 py-2.5 text-xs font-semibold text-brand shadow-card transition hover:bg-canvas"
        >
          <Icon name="schedule" />
          Ver consulta pública
        </Link>
      </div>
      {tab === "calendars" ? (
        <CalendarAdmin profile={profile} />
      ) : (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
              <div>
                <h2 className="text-base">{title}</h2>
                <p className="mt-1 text-xs text-muted">
                  {visible.length}{" "}
                  {visible.length === 1
                    ? "registro encontrado"
                    : "registros encontrados"}
                </p>
              </div>
              <Button onClick={() => edit(null)}>
                <Icon name="plus" />
                Novo registro
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-3 border-b border-line bg-surface px-5 py-4">
              <label className="min-w-0 flex-1 sm:max-w-sm">
                Buscar registro
                <span className="relative">
                  <span className="absolute left-3 top-3">
                    <Icon name="search" />
                  </span>
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setFiltersCleared(false);
                    }}
                    placeholder="Buscar por nome, sigla ou docente"
                    className="pl-9"
                  />
                </span>
              </label>
              {type === "lessons" && (
                <Select
                  label="Período"
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value);
                    setFiltersCleared(false);
                  }}
                >
                  <option value="">Todos os períodos</option>
                  {[1, 2, 3, 4, 5, 6].map((p) => (
                    <option key={p} value={p}>
                      {p}º período
                    </option>
                  ))}
                </Select>
              )}
              <button
                onClick={async () => {
                  if (await confirmClearFilters()) {
                    setSearch("");
                    setPeriod("");
                    setFiltersCleared(false);
                  }
                }}
                className="flex h-10 items-center gap-1.5 px-2 text-xs font-semibold text-brand hover:underline"
              >
                <Icon name="reset" />
                Limpar filtros
              </button>
            </div>
            {!visible.length ? (
              <div className="p-5">
                <Empty>
                  {records.length
                    ? "Nenhum registro corresponde aos filtros."
                    : "Nenhum registro cadastrado nesta seção."}
                </Empty>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr className="border-b border-line bg-surface text-[10px] font-semibold uppercase tracking-wider text-muted">
                      <th scope="col" className="px-5 py-3">
                        {type === "lessons" ? "Disciplina / turma" : "Registro"}
                      </th>
                      <th scope="col" className="px-5 py-3">
                        Informações
                      </th>
                      <th scope="col" className="px-5 py-3">
                        {type === "notices" ? "Categoria" : "Situação"}
                      </th>
                      <th scope="col" className="px-5 py-3 text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-line transition last:border-0 hover:bg-surface"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas ${type === "notices" ? "notice-admin-icon " + categoryOf(r).tone : ""}`}
                            >
                              {type === "notices" ? (
                                <Icon name={categoryOf(r).icon} />
                              ) : type === "rooms" ? (
                                <RoomIcon room={r} />
                              ) : type === "courses" ? (
                                <CourseIcon course={r} />
                              ) : type === "subjects" ? (
                                <SubjectIcon subject={r} />
                              ) : (
                                <Icon
                                  name={
                                    type === "lessons"
                                      ? "subjects"
                                      : catalogs[type][1]
                                  }
                                />
                              )}
                            </span>
                            <div>
                              <strong className="text-[13px] font-semibold">
                                {label(r)}
                              </strong>
                              {type === "notices" && (
                                <div className="mt-2">
                                  <NoticeAudienceBadge
                                    notice={r}
                                    courses={data.courses}
                                  />
                                </div>
                              )}
                              {type === "lessons" && (
                                <p className="mt-1 text-[11px] text-muted">
                                  {
                                    data.classes.find((c) => c.id === r.classId)
                                      ?.name
                                  }{" "}
                                  •{" "}
                                  {
                                    data.professors.find(
                                      (p) => p.id === r.professorId,
                                    )?.name
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="max-w-xs px-5 py-4 text-xs leading-5 text-muted">
                          {type === "lessons" ? (
                            <>
                              <strong className="font-medium tabular-nums text-ink">
                                {r.startTime}–{r.endTime}
                              </strong>
                              <br />
                              {data.rooms.find((v) => v.id === r.roomId)?.name}
                            </>
                          ) : (
                            r.code ||
                            r.block ||
                            r.message?.slice(0, 60) ||
                            r.description?.slice(0, 60) ||
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {type === "notices" ? (
                            <CategoryBadge notice={r} />
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${tab === "drafts" ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200" : "border-line bg-canvas text-brand"}`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${tab === "drafts" ? "bg-amber-500" : "bg-emerald-500"}`}
                              />
                              {tab === "drafts"
                                ? "Rascunho"
                                : type === "lessons" || type === "notices"
                                  ? "Publicado"
                                  : "Cadastrado"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              title="Editar registro"
                              disabled={busy}
                              onClick={() => edit(r)}
                              className="flex size-9 items-center justify-center rounded-lg border border-line text-brand transition hover:border-muted hover:bg-canvas"
                            >
                              <Icon name="edit" />
                              <span className="sr-only">Editar</span>
                            </button>
                            <button
                              title={
                                tab === "drafts"
                                  ? "Descartar rascunho"
                                  : "Excluir registro"
                              }
                              disabled={busy}
                              onClick={() => remove(r)}
                              className="flex size-9 items-center justify-center rounded-lg border border-line text-red-600 transition hover:border-red-300 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
                            >
                              <Icon name="trash" />
                              <span className="sr-only">
                                {tab === "drafts" ? "Descartar" : "Excluir"}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center gap-2 border-t border-line bg-surface px-5 py-3 text-[11px] leading-5 text-muted">
              <Icon name="info" />
              {type === "lessons"
                ? "Aulas recorrentes. Alterações ficam em rascunho até a publicação."
                : "Alterações salvas ficam disponíveis na consulta pública."}
            </div>
          </Card>
          {form && (
            <Modal
              wide
              title={`${editing ? "Editar" : "Cadastrar"} ${type === "lessons" ? "aula" : catalogs[type][0].toLowerCase()}`}
              description={
                type === "lessons"
                  ? "Preencha a aula recorrente e salve como rascunho para revisar antes de publicar."
                  : "As informações serão salvas e disponibilizadas na plataforma."
              }
              icon={type === "lessons" ? "schedule" : catalogs[type][1]}
              onClose={close}
              footer={
                <>
                  <Button secondary disabled={busy} onClick={close}>
                    Cancelar
                  </Button>
                  {currentDraft && type === "lessons" && !dirty ? (
                    <Button
                      disabled={busy}
                      onClick={() => publish(currentDraft)}
                    >
                      <Icon name="publish" />
                      Revisar e publicar
                    </Button>
                  ) : null}
                  <Button type="submit" form="record-form" disabled={busy}>
                    <Icon name="save" />
                    {busy
                      ? "Salvando…"
                      : type === "lessons"
                        ? "Salvar rascunho"
                        : "Salvar registro"}
                  </Button>
                </>
              }
            >
              <form
                id="record-form"
                onSubmit={save}
                className="grid gap-4 sm:grid-cols-2"
              >
                {type === "lessons" && (
                  <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span>
                      Vigência: {form.validFrom} a{" "}
                      {form.validTo || "sem data final"} - {form.semester}
                    </span>
                    <button
                      type="button"
                      className="font-semibold text-brand"
                      aria-expanded={showDetails}
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails
                        ? "Ocultar detalhes"
                        : "Editar vigência e detalhes"}
                    </button>
                  </div>
                )}
                {fields[type]
                  .filter(
                    ([key]) =>
                      type !== "lessons" ||
                      showDetails ||
                      ![
                        "validFrom",
                        "validTo",
                        "semester",
                        "description",
                      ].includes(key),
                  )
                  .map(([key, label, kind]) => {
                    const value = form[key] ?? "";
                    if (
                      type === "notices" &&
                      (kind === "notice-meta" ||
                        (key === "courseId" && form.audience === "all"))
                    )
                      return null;
                    if (kind === "audience")
                      return (
                        <NoticeAudienceSelector
                          key={key}
                          form={form}
                          onChange={(patch) =>
                            setForm((previous) => ({ ...previous, ...patch }))
                          }
                        />
                      );
                    function change(e) {
                      const next = { ...form, [key]: e.target.value };
                      if (key === "courseId") {
                        if (type === "notices") {
                          next.lessonId = null;
                          next.occurrenceDate = null;
                        } else {
                          next.classId = "";
                          next.subjectId = "";
                        }
                      }
                      setForm(next);
                    }
                    if (kind === "color")
                      return (
                        <div key={key} className="sm:col-span-2">
                          <span className="mb-2 block text-xs font-medium">
                            {label}
                          </span>
                          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas p-3">
                            <span
                              aria-label={`Cor atual ${value}`}
                              className="size-10 rounded-lg border border-black/10 shadow-sm"
                              style={{ backgroundColor: value }}
                            />
                            <span className="font-mono text-sm font-semibold uppercase text-ink">
                              {value}
                            </span>
                            <Button
                              secondary
                              className="ml-auto"
                              type="button"
                              onClick={async () => {
                                const color = await chooseSubjectColor(value);
                                if (color)
                                  setForm((previous) => ({
                                    ...previous,
                                    color,
                                  }));
                              }}
                            >
                              <Icon name="edit" size={16} />
                              {editing ? "Alterar cor" : "Escolher cor"}
                            </Button>
                          </div>
                          <p className="mt-2 text-[11px] text-muted">
                            A cor identifica esta disciplina nos cartões e na
                            grade semanal.
                          </p>
                        </div>
                      );
                    if (kind === "category")
                      return (
                        <fieldset key={key} className="sm:col-span-2 min-w-0">
                          <legend className="mb-3 text-xs font-medium">
                            Categoria do aviso
                          </legend>
                          <div className="notice-category-options">
                            {Object.entries(categories).map(([id, item]) => (
                              <label
                                key={id}
                                className={`notice-category-option ${item.tone} ${value === id ? "notice-category-option-selected" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name="notice-category"
                                  value={id}
                                  checked={value === id}
                                  required
                                  onChange={() =>
                                    setForm((previous) => ({
                                      ...previous,
                                      category: id,
                                      ...(id === "informacao"
                                        ? {
                                            lessonId: null,
                                            occurrenceDate: null,
                                          }
                                        : {}),
                                    }))
                                  }
                                  aria-label={item.label}
                                />
                                <Icon name={item.icon} size={20} />
                                <span>{item.label}</span>
                                <i aria-hidden="true" />
                              </label>
                            ))}
                          </div>
                          <div className="notice-form-preview">
                            <span>Categoria exibida para os alunos</span>
                            <CategoryBadge notice={form} />
                          </div>
                          {value !== "informacao" &&
                            form.audience !== "all" && (
                              <NoticeLessonFields
                                key={form.courseId}
                                form={form}
                                editing={Boolean(editing)}
                                onChange={(patch) =>
                                  setForm((previous) => ({
                                    ...previous,
                                    ...patch,
                                  }))
                                }
                              />
                            )}
                        </fieldset>
                      );
                    let options = data[kind];
                    if (kind === "level")
                      options = [
                        { id: "superior", name: "Superior" },
                        { id: "integrado", name: "Integrado" },
                        { id: "tecnico", name: "Técnico subsequente" },
                      ];
                    if (kind === "category")
                      options = [
                        { id: "informacao", name: "Informação" },
                        { id: "alteracao", name: "Alteração" },
                        { id: "cancelamento", name: "Cancelamento" },
                      ];
                    if (kind === "period")
                      options = Array.from({ length: 11 }, (_, i) => i).map(
                        (v) => ({
                          id: v,
                          name: `${v}º período`,
                        }),
                      );
                    if (kind === "weekday")
                      options = days.map((name, i) => ({ id: i + 1, name }));
                    if (options) {
                      if (["classes", "subjects"].includes(kind))
                        options = options.filter(
                          (o) => o.courseId === form.courseId,
                        );
                      if (kind === "courses" && profile.courseIds?.length)
                        options = options.filter((o) =>
                          profile.courseIds.includes(o.id),
                        );
                      return (
                        <Select
                          key={key}
                          label={label}
                          value={value}
                          onChange={change}
                          required={!["roomId", "professorId"].includes(key)}
                        >
                          <option value="">Selecione</option>
                          {options.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name || o.code}
                            </option>
                          ))}
                        </Select>
                      );
                    }
                    return (
                      <label
                        key={key}
                        htmlFor={`field-${key}`}
                        className={
                          kind === "textarea" ||
                          (type === "notices" && key === "title")
                            ? "sm:col-span-2"
                            : ""
                        }
                      >
                        {label}
                        {kind === "textarea" ? (
                          <textarea
                            id={`field-${key}`}
                            aria-label={label}
                            rows={4}
                            required={key === "message"}
                            maxLength={key === "message" ? 5000 : 2000}
                            value={value}
                            onChange={change}
                            placeholder={
                              key === "message"
                                ? "Escreva o comunicado de forma clara e objetiva."
                                : "Informações complementares (opcional)"
                            }
                          />
                        ) : kind === "color" ? null : (
                          <input
                            id={`field-${key}`}
                            type={kind || "text"}
                            required={key !== "validTo"}
                            value={value}
                            onChange={change}
                            maxLength={kind ? undefined : 200}
                            min={key === "endTime" ? form.startTime : undefined}
                            className={kind === "color" ? "h-11 p-1" : ""}
                          />
                        )}
                      </label>
                    );
                  })}
                {type === "lessons" && (
                  <div className="flex gap-3 rounded-xl border border-line bg-canvas p-4 sm:col-span-2">
                    <Icon name="lock" />
                    <div>
                      <strong className="text-xs text-brand">
                        Rascunho não altera a consulta pública
                      </strong>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Depois de salvar, abra a aba Rascunhos para revisar e
                        publicar. Conflitos são verificados automaticamente.
                      </p>
                    </div>
                  </div>
                )}
              </form>
              {currentDraft && type === "lessons" && (
                <label className="mt-5 flex-row items-start rounded-xl border border-line p-4">
                  <input
                    className="mt-0.5 w-auto accent-emerald-700"
                    type="checkbox"
                    checked={publishNotice}
                    onChange={(e) => setPublishNotice(e.target.checked)}
                  />
                  <span>
                    <strong className="text-xs">
                      Publicar também um aviso de alteração
                    </strong>
                    <span className="mt-1 block text-[11px] leading-5 text-muted">
                      O horário e o aviso serão publicados juntos.{" "}
                      {dirty
                        ? "Salve as alterações para habilitar a publicação."
                        : ""}
                    </span>
                  </span>
                </label>
              )}
            </Modal>
          )}
        </>
      )}
    </>
  );
}
