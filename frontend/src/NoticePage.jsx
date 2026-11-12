import React, { useState } from "react";
import { useData } from "./App";
import { Card, Title, Button, Icon, dateLabel } from "./components";
import NoticeDetails from "./NoticeDetails";
import { occurrenceLabel } from "./lessonNotices";

import {
  categories,
  categoryOf,
  CategoryBadge,
  NoticeAudienceBadge,
} from "./noticeCategories";

export default function NoticePage() {
  const data = useData();
  const { notices } = data;
  const [category, setCategory] = useState(""),
    [selected, setSelected] = useState(null);
  const filtered = notices
    .filter((n) => !category || n.category === category)
    .sort(
      (a, b) =>
        (b.updatedAt?._seconds || b.createdAt?._seconds || 0) -
        (a.updatedAt?._seconds || a.createdAt?._seconds || 0),
    );
  return (
    <div className="notices-page">
      <div className="notices-heading">
        <Title
          title="Avisos acadêmicos"
          subtitle="Comunicados do seu curso e avisos gerais do campus, em um só lugar."
        />
        <span className="notices-total">
          <Icon name="bell" size={16} />
          {notices.length} {notices.length === 1 ? "comunicado" : "comunicados"}
        </span>
      </div>
      <div className="notice-filters" aria-label="Categorias de avisos">
        {[
          ["", { plural: "Todos", icon: "bell", tone: "notice-all" }],
          ...Object.entries(categories),
        ].map(([value, item]) => {
          const count = notices.filter(
            (n) => !value || n.category === value,
          ).length;
          return (
            <button
              type="button"
              key={value}
              className={`notice-filter ${item.tone}`}
              aria-label={`${item.plural}: ${count} ${count === 1 ? "aviso" : "avisos"}`}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              <span className="notice-filter-icon">
                <Icon name={item.icon} size={17} />
              </span>
              <span>{item.plural}</span>
              <small>{count}</small>
            </button>
          );
        })}
      </div>
      {!filtered.length ? (
        <Card className="notice-empty">
          <span>
            <Icon
              name={category ? categories[category].icon : "bell"}
              size={27}
            />
          </span>
          <h2>
            {category
              ? "Nenhum aviso nesta categoria"
              : "Nenhum aviso publicado"}
          </h2>
          <p>
            {category
              ? "Os outros comunicados continuam disponíveis em “Todos”."
              : "Os comunicados da coordenação aparecerão aqui quando forem publicados."}
          </p>
          {category && (
            <Button secondary onClick={() => setCategory("")}>
              Ver todos os avisos
            </Button>
          )}
        </Card>
      ) : (
        <div className="notice-grid">
          {filtered.map((notice) => {
            const item = categoryOf(notice);
            return (
              <article key={notice.id} className={`notice-card ${item.tone}`}>
                <div className="notice-card-meta">
                  <CategoryBadge notice={notice} />
                  <time>
                    {notice.createdAt
                      ? dateLabel(notice.createdAt)
                      : "Coordenação"}
                  </time>
                </div>
                <h2>{notice.title}</h2>
                <div className="notice-card-audience">
                  <NoticeAudienceBadge notice={notice} courses={data.courses} />
                  {notice.lessonId && (
                    <span>
                      <Icon name="schedule" size={13} />
                      {occurrenceLabel(notice.occurrenceDate)}
                    </span>
                  )}
                </div>
                <p>{notice.message}</p>
                <div className="notice-card-footer">
                  <span>Coordenação do curso</span>
                  <button
                    type="button"
                    onClick={() => setSelected(notice)}
                    aria-label={`Ler comunicado: ${notice.title}`}
                  >
                    Ler comunicado
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {selected && (
        <NoticeDetails
          notice={selected}
          data={data}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
