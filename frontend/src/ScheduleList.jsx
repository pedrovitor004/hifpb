import React from "react";
import { Link } from "react-router-dom";
import { Icon, RoomIcon, SubjectIcon, days } from "./components";
import { resolve } from "./Schedule";
export default function ScheduleList({ lessons, data, params }) {
  return (
    <div className="schedule-list overflow-hidden rounded-card border border-line bg-panel shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <caption className="sr-only">Lista de aulas da semana</caption>
          <thead className="bg-surface text-[10px] uppercase tracking-wider text-muted">
            <tr>
              {[
                "Dia",
                "Horário",
                "Disciplina",
                "Professor",
                "Ambiente",
                "",
              ].map((title, i) => (
                <th
                  scope="col"
                  key={i}
                  className="border-b border-line px-4 py-4 font-semibold"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lessons
              .slice()
              .sort(
                (a, b) =>
                  a.weekday - b.weekday ||
                  a.startTime.localeCompare(b.startTime),
              )
              .map((l) => {
                const { subject, professor, room } = resolve(data, l, params.get("courseId"));
                return (
                  <tr
                    key={l.id}
                    className="border-b border-line transition last:border-0 hover:bg-surface"
                  >
                    <th scope="row" className="px-4 py-4 text-xs font-medium">
                      {days[l.weekday - 1]}
                    </th>
                    <td className="whitespace-nowrap px-4 py-4 text-xs tabular-nums">
                      {l.startTime}–{l.endTime}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: subject?.color }}
                        />
                        <span className="text-xs font-semibold">
                          {subject?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted">
                      {professor?.name}
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-2 text-xs">
                        <RoomIcon room={room} size={16} />
                        {room?.type?.includes("Lab")
                          ? "Lab. de informática • "
                          : ""}
                        {room?.name || "Sala não informada"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/aulas/${l.id}?${params}`}
                        aria-label={`Detalhes de ${subject?.code}, ${days[l.weekday - 1]}, ${l.startTime}`}
                        className="flex size-8 items-center justify-center rounded-lg border border-line text-brand hover:bg-canvas"
                      >
                        <Icon name="open" size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
