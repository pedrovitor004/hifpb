import React, { useState } from "react";
import { useData } from "./App";
import { Title, Card, Button, Icon, Empty, Select } from "./components";
import { currentBimester } from "./calendarPeriod";
import { currentCalendar, defaultCalendarLinks } from "./calendarConfig";
import { documentUrl } from "./firebase";
export default function Calendar() {
  const {
      calendars = [],
      calendarEvents = [],
      courses,
      selectedCourseId,
    } = useData(),
    [view, setView] = useState(true),
    scope =
      courses.find((c) => c.id === selectedCourseId)?.level === "integrado"
        ? "integrados"
        : "superiores",
    [selectedBimester, setSelectedBimester] = useState(null);
  const calendar = currentCalendar(calendars, scope);
  if (!calendar) return <Empty>Nenhum calendário disponível.</Empty>;
  const integrated = scope === "integrados";
  const url = documentUrl(calendar.documentId),
    page = calendar.startPage || 1;
  const events = calendarEvents
    .filter((e) => e.calendarId === calendar.id)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const bimester = selectedBimester ?? String(currentBimester(events));
  const visibleEvents = integrated
    ? events.filter((e) => e.bimester === Number(bimester))
    : events;
  return (
    <>
      <Title
        title="Calendário acadêmico"
        subtitle="Datas letivas, avaliações e documentos do Campus Monteiro."
      />
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-brand">
              {integrated
                ? "Cursos integrados"
                : `Última versão recebida • ${calendar.version}`}
            </span>
            <h2 className="mt-4 text-lg">{calendar.title}</h2>
            <p className="mt-2 text-xs text-muted">
              {integrated
                ? `Calendário acadêmico ${calendar.year} • Cursos integrados`
                : `Versão ${calendar.version} • Aprovada em ${calendar.approvalDate.split("-").reverse().join("/")}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button secondary onClick={() => setView(!view)}>
              <Icon name="detailBook" />
              {view ? "Ocultar PDF" : "Visualizar PDF"}
            </Button>
            <a
              href={url + `#page=${page}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-control bg-action px-4 py-3 text-xs font-semibold text-white"
            >
              Abrir em nova aba
            </a>
            <a
              href={url}
              download
              className="rounded-control border border-line px-4 py-3 text-xs font-semibold text-brand"
            >
              Baixar PDF
            </a>
          </div>
        </div>
        {view && (
          <div className="mt-5 overflow-hidden rounded-xl border border-line">
            <iframe
              key={calendar.documentId}
              title={`Calendário acadêmico ${calendar.year} em PDF — ${integrated ? "Cursos integrados" : "Cursos superiores"}`}
              src={url + `#page=${page}`}
              className="h-[65vh] min-h-[440px] w-full"
            />
            <p className="bg-canvas p-3 text-xs text-muted">
              Se o navegador não mostrar o documento, utilize “Abrir em nova
              aba” ou “Baixar PDF”.
            </p>
          </div>
        )}
      </Card>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="mb-4">
            {integrated ? "Datas por bimestre" : "Datas do calendário"}
          </h2>
          {!events.length && (
            <p className="mb-4 text-xs leading-6 text-muted">
              Consulte as datas no PDF acima.
            </p>
          )}
          {integrated && events.length > 0 && (
            <div className="mb-4 max-w-sm">
              <Select
                label="Bimestre"
                value={bimester}
                onChange={(e) => setSelectedBimester(e.target.value)}
              >
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={String(value)}>
                    {value}º bimestre
                  </option>
                ))}
              </Select>
            </div>
          )}
          <EventList items={visibleEvents} />
          <p className="mt-4 text-xs text-muted">
            As demais datas e observações estão no documento completo.
          </p>
        </Card>
        <Card>
          <h2 className="mb-4">Documentos de consulta</h2>
          {(calendar.links ?? defaultCalendarLinks).map(
            ({ url: linkUrl, label }, index) => (
              <a
                key={index}
                href={linkUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-3 flex items-center justify-between rounded-xl border border-line p-4 text-sm font-semibold text-brand transition hover:bg-canvas"
              >
                {label}
                <Icon name="open" />
              </a>
            ),
          )}
          {calendar.description && (
            <p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-muted">
              {calendar.description}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}

function EventList({ items }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((e) => (
        <li key={e.id} className="flex items-center gap-4 py-3">
          <span className="rounded-lg bg-canvas px-3 py-2 text-xs font-semibold tabular-nums text-brand">
            {e.startDate.slice(8)}/{e.startDate.slice(5, 7)}
          </span>
          <div>
            <strong className="text-xs">{e.title}</strong>
            {e.endDate !== e.startDate && (
              <p className="mt-1 text-xs text-muted">
                Até {e.endDate.split("-").reverse().join("/")}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
