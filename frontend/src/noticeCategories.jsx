import React from "react";
import { Icon } from "./components";

export const categories = {
  informacao: {
    label: "Informação",
    plural: "Informações",
    icon: "info",
    tone: "notice-info",
  },
  alteracao: {
    label: "Alteração",
    plural: "Alterações",
    icon: "reset",
    tone: "notice-change",
  },
  cancelamento: {
    label: "Cancelamento",
    plural: "Cancelamentos",
    icon: "close",
    tone: "notice-cancel",
  },
};
export function categoryOf(notice) {
  return categories[notice.category] || categories.informacao;
}
export function CategoryBadge({ notice }) {
  const category = categoryOf(notice);
  return (
    <span className={`notice-category ${category.tone}`}>
      <Icon name={category.icon} size={14} />
      {category.label}
    </span>
  );
}
export function noticeAudienceLabel(notice, courses = []) {
  if (notice.audience === "all") return "Todos os cursos";
  if (notice.courseIds?.length > 1) return "Turmas da aula";
  return (
    courses.find((course) => course.id === notice.courseId)?.code ||
    "Curso específico"
  );
}
export function NoticeAudienceBadge({ notice, courses }) {
  return (
    <span
      className={`notice-audience-badge ${notice.audience === "all" ? "notice-audience-all" : ""}`}
    >
      <Icon
        name={notice.audience === "all" ? "detailUsers" : "graduation"}
        size={13}
      />
      {noticeAudienceLabel(notice, courses)}
    </span>
  );
}
