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
    [selectedNotice, setSelectedNotice] = useState(null);
  const courseId = data.selectedCourseId || params.get("courseId") || "";
  const groups = data.classes.filter((group) => group.courseId === courseId);
  const period = params.get("period");
  const initial =
    groups.find((group) => period == null || group.period === Number(period)) ||
    groups[0];
  const classId = params.get("classId") || initial?.id || "";
  const group = groups.find((group) => group.id === classId);
  const dates = currentWeekDates();
  const lessons = group
    ? data.lessons.filter(
        (lesson) =>
          (lesson.classIds || [lesson.classId]).includes(classId) &&
          lesson.validFrom <= dates[lesson.weekday - 1] &&
          (!lesson.validTo || lesson.validTo >= dates[lesson.weekday - 1]),
      )
    : [];
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
        title="Consulta de horários"
        subtitle="Consulte a programação da sua turma, de segunda a sexta."
      />
      <div className="no-print mb-5 max-w-sm">
        {groups.length > 0 && (
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
      {group && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">De segunda a sexta</p>
          <div className="no-print flex items-center gap-2">
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
            {list && (
              <Button secondary onClick={() => window.print()}>
                <Icon name="print" />
                Imprimir
              </Button>
            )}
          </div>
        </div>
      )}
      {!groups.length ? (
        <Empty>Os horários deste curso ainda não foram disponibilizados.</Empty>
      ) : !group ? (
        <Empty>Selecione sua turma para consultar os horários.</Empty>
      ) : !lessons.length ? (
        <Empty>Não há aulas vigentes para a turma selecionada.</Empty>
      ) : list ? (
        <ScheduleList
          lessons={lessons}
          data={data}
          params={params}
          dates={dates}
          onOpenNotice={setSelectedNotice}
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-panel shadow-card">
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
                                    className="group flex min-h-[190px] flex-col rounded-control border border-black/5 bg-[var(--lesson-color)] p-3.5 text-[#16382c] transition hover:shadow-md dark:bg-[color-mix(in_srgb,var(--lesson-color)_20%,var(--color-panel))] dark:text-ink"
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
                                      <span className="mt-auto flex items-center gap-2 pt-3 text-[10px] font-semibold">
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
