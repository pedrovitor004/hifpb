import React, { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useData } from "./App";
import { resolve } from "./Schedule";
import NoticeDetails, { LessonNoticeIndicator } from "./NoticeDetails";
import { currentWeekDates, lessonNotice } from "./lessonNotices";
import { Card, Title, Empty, Icon, days, RoomIcon } from "./components";
export default function Lesson() {
  const data = useData(),
    { id } = useParams(),
    [params] = useSearchParams(),
    lesson = data.lessons.find((l) => l.id === id);
  const [selectedNotice, setSelectedNotice] = useState(null);
  if (!lesson)
    return <Empty>A aula não foi encontrada ou ainda não foi publicada.</Empty>;
  const { subject, professor, room, group } = resolve(
    data,
    lesson,
    params.get("courseId"),
  );
  const course = data.courses.find((c) => c.id === group?.courseId);
  const date = params.get("date") || currentWeekDates()[lesson.weekday - 1];
  const notice = lessonNotice(data.notices, lesson.id, date);
  return (
    <>
      <Link
        to={`/horarios?${params}`}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
      >
        <Icon name="back" />
        Voltar aos horários
      </Link>
      <Title
        title={subject?.name || "Detalhes da aula"}
        subtitle="Informações da aula semanal recorrente."
      />
      <div className="mb-5">
        <LessonNoticeIndicator
          notice={notice}
          subject={subject?.code || subject?.name}
          onOpen={setSelectedNotice}
        />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div
            className="mb-6 rounded-xl border-l-4 bg-canvas p-5"
            style={{ borderColor: subject?.color }}
          >
            <span className="text-xs text-muted">
              {days[lesson.weekday - 1]} • {lesson.semester}
            </span>
            <h2 className="mt-2 text-3xl tabular-nums">
              {lesson.startTime}–{lesson.endTime}
            </h2>
            <p className="mt-2 text-sm text-muted">{subject?.code}</p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Professor", professor.name, "user"],
              ["Curso", course?.name, "graduation"],
              ["Turma", group?.name, "detailUsers"],
              ["Sala", room?.name || "Sala não informada", "classroom"],
            ].map(([label, value, icon]) => (
              <div
                key={label}
                className="flex gap-3 rounded-xl border border-line p-4"
              >
                <span className="text-brand">
                  <Icon name={icon} />
                </span>
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-muted">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs leading-6 text-muted">
            Vigência: {lesson.validFrom.split("-").reverse().join("/")}{" "}
            {lesson.validTo
              ? "até " + lesson.validTo.split("-").reverse().join("/")
              : "• término não informado no documento"}
            .
          </p>
          {lesson.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-muted">
              {lesson.description}
            </p>
          )}
          {lesson.source && (
            <a
              className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand hover:underline"
              href={`/documents/turmas-2026-10-27.pdf#page=${lesson.source.page}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="open" />
              Conferir na grade original • página {lesson.source.page}
            </a>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 flex items-center gap-2">
            <RoomIcon room={room} />
            Local da aula
          </h2>
          {room ? (
            <>
              <h3>{room.name}</h3>
              <p className="my-3 text-sm text-muted">
                {room.block} • {room.location}
              </p>
              <Link
                to={`/salas?roomId=${room.id}`}
                className="inline-flex rounded-control bg-action px-4 py-3 text-xs font-semibold text-white"
              >
                Ver localização da sala
              </Link>
            </>
          ) : (
            <p className="text-sm leading-7 text-muted">
              A sala não foi informada nos horários recebidos. A coordenação
              pode cadastrar o ambiente e vinculá-lo à aula.
            </p>
          )}
        </Card>
      </div>
      {selectedNotice && (
        <NoticeDetails
          notice={selectedNotice}
          data={data}
          onClose={() => setSelectedNotice(null)}
        />
      )}
    </>
  );
}
