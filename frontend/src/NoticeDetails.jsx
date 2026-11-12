import React from "react";
import Modal from "./Modal";
import { Button, Icon } from "./components";
import {
  CategoryBadge,
  categoryOf,
  NoticeAudienceBadge,
} from "./noticeCategories";
import { occurrenceLabel } from "./lessonNotices";

export function LessonNoticeIndicator({ notice, onOpen, subject }) {
  if (!notice) return null;
  const category = categoryOf(notice),
    cancelled = notice.category === "cancelamento";
  return (
    <button
      type="button"
      className={`lesson-notice-trigger ${category.tone}`}
      onClick={() => onOpen(notice)}
      aria-label={`Ver ${cancelled ? "cancelamento" : "alteração"}: ${subject}`}
    >
      <Icon name={category.icon} size={16} />
      <span>
        <strong>{cancelled ? "Aula cancelada" : "Aula com alteração"}</strong>
        <small className="lesson-notice-summary">{notice.message}</small>
      </span>
      <Icon name="open" size={14} />
    </button>
  );
}
export default function NoticeDetails({ notice, data, onClose }) {
  const lesson = data.lessons.find((lesson) => lesson.id === notice.lessonId);
  const subject =
    lesson && data.subjects.find((subject) => subject.id === lesson.subjectId);
  return (
    <Modal
      title={notice.title}
      description="Comunicado da coordenação."
      icon={categoryOf(notice).icon}
      onClose={onClose}
      footer={<Button onClick={onClose}>Fechar comunicado</Button>}
    >
      <div className="notice-detail-meta">
        <CategoryBadge notice={notice} />
        <NoticeAudienceBadge notice={notice} courses={data.courses} />
      </div>
      {notice.lessonId && (
        <div className="notice-lesson-context">
          <span>
            <Icon name="schedule" size={21} />
          </span>
          <div>
            <strong>{subject?.name || "Aula vinculada"}</strong>
            <p>
              {occurrenceLabel(notice.occurrenceDate)}
              {lesson ? ` · ${lesson.startTime}–${lesson.endTime}` : ""}
            </p>
          </div>
        </div>
      )}
      <p className="notice-detail-message">{notice.message}</p>
    </Modal>
  );
}
