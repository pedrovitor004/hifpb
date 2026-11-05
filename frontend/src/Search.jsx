import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon, RoomIcon, SubjectIcon } from "./components";
export default function Search({ data }) {
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    root = useRef(null),
    loc = useLocation();
  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [loc.pathname]);
  useEffect(() => {
    const close = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const all = data
    ? [
        ...data.rooms.map((r) => ({
          id: r.id,
          name: r.name,
          detail: r.block,
          icon: r.type?.includes("Lab") ? "lab" : "classroom",
          to: `/salas?roomId=${r.id}&period=${data.classes.find((c) => data.lessons.some((l) => l.roomId === r.id && l.classId === c.id))?.period || 4}`,
        })),
        ...data.subjects.map((s) => ({
          id: s.id,
          name: s.name,
          detail: s.code,
          icon: "subjects",
          to: "/disciplinas",
        })),
        ...data.professors.map((p) => ({
          id: p.id,
          name: p.name,
          detail: "Professor",
          icon: "professors",
          to: `/professores?professorId=${p.id}`,
        })),
      ]
    : [];
  const results = all
    .filter((r) =>
      `${r.name} ${r.detail}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 5);
  return (
    <div ref={root} className="relative hidden md:block">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-3">
          <Icon name="search" />
        </span>
        <input
          aria-label="Buscar no HIFPB"
          aria-expanded={open}
          aria-controls="search-results"
          placeholder="Buscar no HIFPB"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="h-10 w-48 bg-canvas pl-9 lg:w-[280px]"
        />
      </div>
      {open && query.trim() && (
        <div
          id="search-results"
          className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-card border border-line bg-panel p-2 shadow-float"
        >
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Resultados da pesquisa
          </p>
          {results.length ? (
            results.map((r) => (
              <Link
                onClick={() => setOpen(false)}
                key={r.icon + r.id}
                to={r.to}
                className="flex items-center gap-3 rounded-control p-3 transition hover:bg-canvas"
              >
                <Icon name={r.icon} />
                <span>
                  <strong className="block text-[13px]">{r.name}</strong>
                  <small className="text-muted">{r.detail}</small>
                </span>
              </Link>
            ))
          ) : (
            <p className="p-3 text-xs text-muted">
              Nenhum resultado para “{query}”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
