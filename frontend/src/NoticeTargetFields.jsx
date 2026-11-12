import React, { useState } from "react";
import { useData } from "./App";
import { Icon, days, Select } from "./components";
import { NoticeAudienceBadge } from "./noticeCategories";

export function NoticeAudienceSelector({ form, onChange }) {
  const { courses } = useData();
  return (
    <fieldset className="sm:col-span-2 min-w-0">
      <legend className="mb-3 text-xs font-medium">
        Quem recebe este aviso?
      </legend>
      <div className="notice-audience-options">
        {[
          [
            "course",
            "Curso específico",
            "Somente o curso escolhido",
            "graduation",
          ],
          [
            "all",
            "Todos os cursos",
            "Comunicado geral do campus",
            "detailUsers",
          ],
        ].map(([value, label, description, icon]) => (
          <label
            key={value}
            className={`notice-audience-option ${form.audience === value ? "notice-audience-option-selected" : ""}`}
          >
            <input
              type="radio"
              name="notice-audience"
              value={value}
              checked={form.audience === value}
              aria-label={label}
              onChange={() =>
                onChange({
                  audience: value,
                  courseId:
                    value === "all"
                      ? null
                      : form.courseId || courses[0]?.id || "",
                  lessonId: null,
                  occurrenceDate: null,
                })
              }
            />
            <Icon name={icon} size={21} />
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
            <i />
          </label>
        ))}
      </div>
      <div className="notice-form-preview">
        <span>Destinatários do comunicado</span>
        <NoticeAudienceBadge notice={form} courses={courses} />
      </div>
    </fieldset>
  );
}

export function NoticeLessonFields({ form, onChange, editing }) {
  const data = useData();
  const [enabled, setEnabled] = useState(
    () => Boolean(form.lessonId) || !editing,
  );
  const choices = data.lessons.filter(
    (lesson) =>
      lesson.courseId === form.courseId ||
      lesson.courseIds?.includes(form.courseId),
  );
  const selected = choices.find((lesson) => lesson.id === form.lessonId);
  function label(lesson) {
    const subject = data.subjects.find(
      (subject) =>
        (lesson.subjectIds || [lesson.subjectId]).includes(subject.id) &&
        subject.courseId === form.courseId,
    );
    const groups = data.classes
      .filter(
        (group) =>
          (lesson.classIds || [lesson.classId]).includes(group.id) &&
          group.courseId === form.courseId,
      )
      .map((group) => group.name)
      .join(" / ");
    return `${subject?.code || subject?.name || "Disciplina"} · ${groups} · ${days[lesson.weekday - 1]} ${lesson.startTime}–${lesson.endTime}`;
  }
  return (
    <div className="notice-lesson-fields">
      <label className="notice-lesson-toggle">
        <input
          type="checkbox"
          className="notice-affects-check"
          checked={enabled}
          onChange={(event) => {
            setEnabled(event.target.checked);
            if (!event.target.checked)
              onChange({ lessonId: null, occurrenceDate: null });
          }}
        />
        <span>Vincular este aviso a uma aula</span>
      </label>
      {enabled ? (
        <div className="notice-lesson-selection">
          <Select
            label="Aula afetada"
            required
            value={form.lessonId || ""}
            onChange={(event) =>
              onChange({ lessonId: event.target.value, occurrenceDate: null })
            }
          >
            <option value="">Selecione a aula</option>
            {choices.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {label(lesson)}
              </option>
            ))}
          </Select>
          <label>
            Data da aula
            <input
              type="date"
              required
              value={form.occurrenceDate || ""}
              min={selected?.validFrom}
              max={selected?.validTo || undefined}
              disabled={!selected}
              onChange={(event) => {
                const value = event.target.value;
                event.currentTarget.setCustomValidity(
                  value &&
                    selected &&
                    new Date(value + "T12:00:00Z").getUTCDay() !==
                      selected.weekday
                    ? `Escolha uma data que corresponda a ${days[selected.weekday - 1].toLowerCase()}.`
                    : "",
                );
                onChange({ occurrenceDate: value });
              }}
            />
          </label>
          <p>
            {selected
              ? `Esta aula acontece em ${days[selected.weekday - 1].toLowerCase()}, ${selected.startTime}–${selected.endTime}. `
              : ""}
            O indicativo aparece somente na data escolhida.
            {selected?.courseIds?.length > 1
              ? " Por ser uma aula compartilhada, o aviso alcança os cursos das turmas vinculadas."
              : ""}
          </p>
        </div>
      ) : (
        <p className="notice-general-hint">
          Comunicado geral do curso, sem indicar uma ocorrência na grade.
        </p>
      )}
    </div>
  );
}
