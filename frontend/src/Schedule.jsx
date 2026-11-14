import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useData } from "./App";
import {
  Icon,
  Button,
  Title,
  Empty,
  Select,
  days,
  RoomIcon,
} from "./components";
import ScheduleList from "./ScheduleList";
import NoticeDetails, { LessonNoticeIndicator } from "./NoticeDetails";
import { currentWeekDates, lessonNotice } from "./lessonNotices";
const periodBorders = [
  "border-emerald-200 dark:border-emerald-800",
  "border-sky-200 dark:border-sky-800",
  "border-violet-200 dark:border-violet-800",
  "border-amber-200 dark:border-amber-800",
  "border-rose-200 dark:border-rose-800",
  "border-teal-200 dark:border-teal-800",
];
export function resolve(data, l, courseId) {
  const group =
    data.classes.find(
      (c) =>
        (l.classIds || [l.classId]).includes(c.id) &&
        (!courseId || c.courseId === courseId),
    ) || data.classes.find((c) => c.id === l.classId);
  const subject =
    data.subjects.find(
      (s) =>
        (l.subjectIds || [l.subjectId]).includes(s.id) &&
        s.courseId === group?.courseId,
    ) || data.subjects.find((s) => s.id === l.subjectId);
  const teachers = data.professors.filter((p) =>
    (l.professorIds || [l.professorId]).includes(p.id),
  );
  return {
    subject,
    professor: {
      name: teachers.map((p) => p.name).join(" / ") || "Professor a definir",
    },
    room: data.rooms.find((r) => r.id === l.roomId),
    group,
  };
}
export default function Schedule() {
  const data = useData(),
    [params, setParams] = useSearchParams();
  const [list, setList] = useState(false),
    [selectedNotice, setSelectedNotice] = useState(null),
    [customSelection, setCustomSelection] = useState(null);
  const [fullName, setFullName] = useState("");
  const courseId = data.selectedCourseId || params.get("courseId") || "";
  const groups = data.classes.filter((group) => group.courseId === courseId);
  const period = params.get("period");
  const initial =
    groups.find((group) => period == null || group.period === Number(period)) ||
    groups[0];
  const classId = params.get("classId") || initial?.id || "";
  const group = groups.find((group) => group.id === classId);
  const dates = currentWeekDates();
  const availableLessons = data.lessons.filter(
    (lesson) =>
      groups.some((g) =>
        (lesson.classIds || [lesson.classId]).includes(g.id),
      ) &&
      lesson.validFrom <= dates[lesson.weekday - 1] &&
      (!lesson.validTo || lesson.validTo >= dates[lesson.weekday - 1]),
  );
  const choices = groups.flatMap((g) => {
    const classLessons = availableLessons.filter((l) =>
      (l.classIds || [l.classId]).includes(g.id),
    );
    const subjects = [
      ...new Map(
        classLessons.map((l) => {
          const { subject } = resolve(data, l, courseId);
          return [subject?.id, subject];
        }),
      ).values(),
    ].filter(Boolean);
    return subjects
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map((subject) => ({
        key: `${g.id}:${subject.id}`,
        group: g,
        subject,
        lessons: classLessons.filter(
          (l) => resolve(data, l, courseId).subject?.id === subject.id,
        ),
      }));
  });
  const customized = customSelection?.courseId === courseId;
  const selectedKeys = customized ? customSelection.keys : [];
  const selectedChoices = choices.filter((choice) =>
    selectedKeys.includes(choice.key),
  );
  const selectedLessonIds = new Set(
    selectedChoices.flatMap((choice) => choice.lessons.map((l) => l.id)),
  );
  const lessons = customized
    ? availableLessons.filter((l) => selectedLessonIds.has(l.id))
    : group
      ? availableLessons.filter((l) =>
          (l.classIds || [l.classId]).includes(classId),
        )
      : [];
  const hasConflicts =
    customized &&
    lessons.some((a, i) =>
      lessons
        .slice(i + 1)
        .some(
          (b) =>
            a.weekday === b.weekday &&
            a.startTime < b.endTime &&
            b.startTime < a.endTime,
        ),
    );
  const times = [...new Set(lessons.map((lesson) => lesson.startTime))].sort();
  function selectClass(value) {
    const next = new URLSearchParams();
    const selected = groups.find((group) => group.id === value);
    next.set("classId", value);
    next.set("period", String(selected?.period ?? ""));
    setParams(next);
  }
  return (
    <div className="schedule-print-root">
      <Title
        badge={false}
        title={
          customized ? "Meu horário personalizado" : "Consulta de horários"
        }
        subtitle={
          customized
            ? "Combine as matérias que você cursa e salve seu horário em PDF."
            : "Consulte a programação da sua turma, de segunda a sexta."
        }
      />
      <div className="no-print mb-5 max-w-sm">
        {groups.length > 0 && !customized && (
          <Select
            label="Turma"
            value={classId}
            onChange={(event) => selectClass(event.target.value)}
          >
            <option value="">Selecione</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
        )}
      </div>
      {groups.length > 0 && (
        <div className="no-print mb-5 flex flex-wrap gap-2">
          <Button
            secondary
            aria-pressed={!customized}
            onClick={() => setCustomSelection(null)}
          >
            Horário da turma
          </Button>
          <Button
            secondary
            aria-pressed={customized}
            onClick={() => {
              if (!customized)
                setCustomSelection({
                  courseId,
                  keys: choices
                    .filter((c) => c.group.id === classId)
                    .map((c) => c.key),
                });
            }}
          >
            <Icon name="subjects" />
            Personalizar horário
          </Button>
        </div>
      )}
      {customized && (
        <section
          aria-label="Selecionar matérias"
          className="no-print mb-5 rounded-card border border-line bg-panel p-4 sm:p-5"
        >
          <label className="mb-5 max-w-lg">
            Seu nome completo (opcional)
            <input
              autoComplete="name"
              maxLength={200}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Nome que aparecerá no seu horário impresso"
            />
            <span className="text-[11px] font-normal leading-5 text-muted">
              Aparece na grade e na impressão ou PDF. Não altera o horário
              publicado.
            </span>
          </label>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base">
                Selecione as matérias que você cursa
              </h2>
              <p className="mt-1 text-xs text-muted">
                Você pode combinar matérias de diferentes turmas do seu curso.
              </p>
            </div>
            <Button
              secondary
              onClick={() => setCustomSelection({ courseId, keys: [] })}
            >
              Limpar seleção
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => {
              const items = choices.filter((c) => c.group.id === g.id);
              return (
                items.length > 0 && (
                  <fieldset
                    key={g.id}
                    className={`rounded-control border-2 p-3 ${periodBorders[Math.max(0, (g.period || 1) - 1) % periodBorders.length]}`}
                  >
                    <legend className="px-1 text-xs font-semibold text-brand">
                      {g.name}
                    </legend>
                    <div className="space-y-2">
                      {items.map((choice) => (
                        <label
                          key={choice.key}
                          className="!flex-row items-start gap-2 rounded-lg p-2 hover:bg-canvas"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 !w-4 shrink-0 accent-emerald-700"
                            checked={selectedKeys.includes(choice.key)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setCustomSelection((previous) => ({
                                courseId,
                                keys: checked
                                  ? [...new Set([...previous.keys, choice.key])]
                                  : previous.keys.filter(
                                      (key) => key !== choice.key,
                                    ),
                              }));
                            }}
                          />
                          <span>
                            <strong className="text-xs">
                              {choice.subject.code}
                            </strong>
                            <span className="mt-0.5 block text-xs text-muted">
                              {choice.subject.name}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted" role="status">
            {selectedChoices.length} matéria(s) selecionada(s). A grade abaixo
            acompanha sua seleção.
          </p>
        </section>
      )}
      {hasConflicts && (
        <p
          role="alert"
          className="mb-4 rounded-control border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          Há matérias com horários sobrepostos. Confira a grade antes de salvar
          seu horário.
        </p>
      )}
      {(group || customized) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {data.courses.find((c) => c.id === courseId)?.name} ·{" "}
            {customized ? "Horário personalizado" : group?.name} · De segunda a
            sexta
          </p>
          <div className="no-print flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-control bg-canvas p-1"
              aria-label="Visualização da grade"
            >
              {[
                [false, "Grade", "week"],
                [true, "Lista", "list"],
              ].map(([value, label, icon]) => (
                <button
                  type="button"
                  key={label}
                  aria-pressed={list === value}
                  onClick={() => setList(value)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition ${list === value ? "bg-panel font-semibold text-brand shadow-sm ring-1 ring-line" : "text-muted hover:text-brand"}`}
                >
                  <Icon name={icon} />
                  {label}
                </button>
              ))}
            </div>
            <Button
              secondary
              disabled={!lessons.length}
              onClick={() => window.print()}
            >
              <Icon name="print" />
              Imprimir
            </Button>
          </div>
        </div>
      )}
      {customized && fullName.trim() && (
        <p
          className="mb-4 break-words text-base font-semibold text-brand"
          data-testid="schedule-owner"
        >
          Horário de {fullName.trim()}
        </p>
      )}
      {!groups.length ? (
        <Empty>Os horários deste curso ainda não foram disponibilizados.</Empty>
      ) : !group && !customized ? (
        <Empty>Selecione sua turma para consultar os horários.</Empty>
      ) : !lessons.length ? (
        <Empty>
          {customized
            ? "Selecione ao menos uma matéria acima para montar seu horário."
            : "Não há aulas vigentes para a turma selecionada."}
        </Empty>
      ) : list ? (
        <ScheduleList
          lessons={lessons}
          data={data}
          params={params}
          dates={dates}
          onOpenNotice={setSelectedNotice}
        />
      ) : (
        <div className="schedule-grid overflow-hidden rounded-card border border-line bg-panel shadow-card">
          <div
            className="overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="Grade de segunda a sexta com rolagem horizontal"
          >
            <table className="w-full min-w-[880px] table-fixed border-collapse">
              <thead>
                <tr>
                  <th className="w-20 border-b border-r border-line bg-surface p-3 text-xs">
                    Horário
                  </th>
                  {days.map((day, index) => (
                    <th
                      key={day}
                      className="border-b border-r border-line px-2 py-4 text-xs"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {times.map((time) => (
                  <React.Fragment key={time}>
                    {time === "20:30" && (
                      <tr>
                        <td colSpan={6} className="bg-action py-1.5">
                          <span className="flex items-center justify-center gap-2 text-[10px] font-medium text-white">
                            <Icon name="interval" size={14} />
                            20:10–20:30 · Intervalo
                          </span>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th className="border-b border-r border-line bg-surface px-3 py-4 align-top text-xs tabular-nums">
                        {time}
                      </th>
                      {days.map((day, index) => (
                        <td
                          key={day}
                          className="border-b border-r border-line p-1.5 align-top"
                        >
                          <div className="space-y-2">
                            {lessons
                              .filter(
                                (lesson) =>
                                  lesson.weekday === index + 1 &&
                                  lesson.startTime === time,
                              )
                              .map((lesson) => {
                                const { subject, professor, room } = resolve(
                                  data,
                                  lesson,
                                  courseId,
                                );
                                const notice = lessonNotice(
                                  data.notices,
                                  lesson.id,
                                  dates[index],
                                );
                                const details = new URLSearchParams(params);
                                details.set("date", dates[index]);
                                return (
                                  <div
                                    key={lesson.id}
                                    style={{
                                      "--lesson-color":
                                        subject?.color || "#dcfce7",
                                    }}
                                    className="schedule-lesson group flex min-h-[190px] flex-col rounded-control border border-black/5 bg-[var(--lesson-color)] p-3.5 text-[#16382c] transition hover:shadow-md dark:bg-[color-mix(in_srgb,var(--lesson-color)_20%,var(--color-panel))] dark:text-ink"
                                  >
                                    <Link
                                      to={`/aulas/${lesson.id}?${details}`}
                                      className="flex flex-1 flex-col"
                                    >
                                      <strong className="text-sm">
                                        {subject?.code}
                                      </strong>
                                      <span className="mt-1 text-xs tabular-nums">
                                        {lesson.startTime}–{lesson.endTime}
                                      </span>
                                      <span className="mt-2 text-xs">
                                        {professor.name}
                                      </span>
                                      <span className="mt-2 flex items-center gap-1.5 text-xs">
                                        <RoomIcon room={room} size={15} />
                                        {room?.name || "Sala não informada"}
                                      </span>
                                      <span className="no-print mt-auto flex items-center gap-2 pt-3 text-[10px] font-semibold">
                                        Ver detalhes
                                        <Icon name="open" size={14} />
                                      </span>
                                    </Link>
                                    <LessonNoticeIndicator
                                      notice={notice}
                                      subject={
                                        subject?.code ||
                                        subject?.name ||
                                        "disciplina"
                                      }
                                      onOpen={setSelectedNotice}
                                    />
                                  </div>
                                );
                              })}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="no-print mt-4 text-xs leading-5 text-muted">
        Para baixar, clique em “Imprimir” e escolha “Salvar como PDF” no destino
        da impressão.
      </p>
      <p className="no-print mt-4 text-xs leading-5 text-muted">
        Horários recorrentes de segunda a sexta. Os avisos de aula sinalizam
        somente a ocorrência indicada.
      </p>
      {selectedNotice && (
        <NoticeDetails
          notice={selectedNotice}
          data={data}
          onClose={() => setSelectedNotice(null)}
        />
      )}
    </div>
  );
}
