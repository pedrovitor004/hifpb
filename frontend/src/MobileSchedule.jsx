import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icon, days, RoomIcon } from "./components";
import { resolve } from "./Schedule";
import { lessonNotice } from "./lessonNotices";
import { LessonNoticeIndicator } from "./NoticeDetails";

export default function MobileSchedule({
  lessons,
  data,
  courseId,
  params,
  dates,
  week = false,
  onOpenNotice,
}) {
  const [day, setDay] = useState(() => {
    const today = new Date().getDay();
    return lessons.some((lesson) => lesson.weekday === today)
      ? today
      : Math.min(...lessons.map((lesson) => lesson.weekday));
  });
  const shownDays = week
    ? [1, 2, 3, 4, 5].filter((weekday) =>
        lessons.some((lesson) => lesson.weekday === weekday),
      )
    : [day];
  return (
    <section
      className="mobile-schedule no-print"
      aria-label={week ? "Agenda da semana" : "Agenda por dia"}
    >
      {!week && (
        <div
          className="mobile-weekdays"
          role="group"
          aria-label="Escolha o dia da semana"
        >
          {days.map((name, index) => {
            const count = lessons.filter(
              (lesson) => lesson.weekday === index + 1,
            ).length;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={day === index + 1}
                aria-label={`${name}: ${count} ${count === 1 ? "aula" : "aulas"}`}
                onClick={() => setDay(index + 1)}
              >
                <strong>{name.slice(0, 3)}</strong>
                <span>
                  {count} {count === 1 ? "aula" : "aulas"}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {shownDays.map((weekday) => {
        const daily = lessons
          .filter((lesson) => lesson.weekday === weekday)
          .sort(
            (a, b) =>
              a.startTime.localeCompare(b.startTime) ||
              a.endTime.localeCompare(b.endTime),
          );
        return (
          <div
            key={weekday}
            className="mobile-agenda-day"
            role="region"
            aria-label={`Aulas de ${days[weekday - 1]}`}
          >
            <div className="mobile-agenda-heading">
              <h2>
                {days[weekday - 1]}
                <small>
                  {dates[weekday - 1]?.slice(5).split("-").reverse().join("/")}
                </small>
              </h2>
              <span>
                {daily.length} {daily.length === 1 ? "aula" : "aulas"}
              </span>
            </div>
            {!daily.length && (
              <div className="mobile-agenda-empty">
                <Icon name="calendar" size={24} />
                <p>Sem aulas neste dia.</p>
                <small>Escolha outro dia para consultar.</small>
              </div>
            )}
            <div className="mobile-agenda-lessons">
              {daily.map((lesson) => {
                const { subject, professor, room } = resolve(
                  data,
                  lesson,
                  courseId,
                );
                const notice = lessonNotice(
                  data.notices,
                  lesson.id,
                  dates[weekday - 1],
                );
                const query = new URLSearchParams(params);
                query.set("courseId", courseId);
                query.set("date", dates[weekday - 1]);
                return (
                  <article
                    key={lesson.id}
                    className="mobile-lesson-card"
                    style={{ "--lesson-accent": subject?.color || "#b9cdf8" }}
                  >
                    <Link
                      className="mobile-lesson-main"
                      to={`/aulas/${lesson.id}?${query}`}
                    >
                      <div className="mobile-lesson-time">
                        <strong>{lesson.startTime}</strong>
                        <span>{lesson.endTime}</span>
                      </div>
                      <div className="mobile-lesson-subject">
                        <small>{subject?.code}</small>
                        <h3>{subject?.name || "Disciplina a definir"}</h3>
                      </div>
                      <Icon name="right" size={16} />
                    </Link>
                    <details className="mobile-lesson-more">
                      <summary>
                        Professor e sala
                        <Icon name="down" size={14} />
                      </summary>
                      <p>
                        <Icon name="user" size={14} />
                        {professor.name}
                      </p>
                      <p>
                        <RoomIcon room={room} size={14} />
                        {room?.name || "Sala a definir"}
                      </p>
                    </details>
                    <LessonNoticeIndicator
                      notice={notice}
                      subject={subject?.code || subject?.name}
                      onOpen={onOpenNotice}
                    />
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
