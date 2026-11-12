import { academicDescription } from "./content";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "./firebase";
import { auth, api, localMode } from "./firebase";
import { useData } from "./App";
import {
  Icon,
  Button,
  Card,
  Title,
  Empty,
  SubjectIcon,
  CourseIcon,
  confirmClearFilters,
  success,
} from "./components";
import Modal from "./Modal";
import Brand, { CoordinatorAccess } from "./Brand";
import CourseTour from "./CourseTour";
const tourSeenKey = "hifpb-tour-seen-v1";

export function StartPage() {
  const {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    user,
    selectionRequired,
  } = useData();
  const [showTour, setShowTour] = useState(() => {
    try {
      return localStorage.getItem(tourSeenKey) !== "true";
    } catch {
      return true;
    }
  });
  function closeTour() {
    try {
      localStorage.setItem(tourSeenKey, "true");
    } catch {
      // Permite fechar o guia mesmo quando o armazenamento está bloqueado.
    }
    setShowTour(false);
    requestAnimationFrame(() =>
      document.querySelector("#course-options button")?.focus(),
    );
  }
  const groups = [
    ["superior", "Graduação", "graduation"],
    ["integrado", "Técnico integrado", "subjects"],
    ["tecnico", "Técnico subsequente", "subjects"],
  ];
  return (
    <div className="course-entry">
      <div className="entry-main">
        <div className="entry-hero">
          <div className="entry-hero-grid" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="entry-topline">
            <Brand className="entry-home-brand" />
            <button
              className="entry-help"
              type="button"
              onClick={() => setShowTour(true)}
            >
              <Icon name="info" size={16} />
              Como funciona
            </button>
          </div>
          <div className="entry-intro">
            <p className="entry-eyebrow">HORÁRIOS ACADÊMICOS</p>
            <h1>Qual é o seu curso?</h1>
            <p>Seu ponto de partida para uma consulta feita para você.</p>
          </div>
        </div>
        {!selectedCourseId ? (
          <div
            className={`entry-selection-note ${selectionRequired ? "entry-selection-required" : ""}`}
            role={selectionRequired ? "alert" : "note"}
            aria-label="Seleção de curso necessária"
          >
            <span className="entry-note-icon">
              <Icon name="lock" size={19} />
            </span>
            <div>
              <strong>Selecione um curso para acessar os dados.</strong>
              <p>
                Horários, disciplinas e avisos só são carregados depois dessa
                escolha.
              </p>
            </div>
          </div>
        ) : (
          <div className="entry-current-selection">
            <Icon name="check" size={16} />
            <span>
              Sua escolha está salva. Clique no curso marcado para desmarcar.
            </span>
          </div>
        )}
        <div className="entry-groups" id="course-options">
          {groups
            .filter(([level]) =>
              courses.some((c) => (c.level || "superior") === level),
            )
            .map(([level, title, icon]) => (
              <section key={level} aria-label={title} className="entry-group">
                <div className="entry-group-heading">
                  <h2>
                    <Icon name={icon} size={17} />
                    {title}
                  </h2>
                  <span>
                    {
                      courses.filter((c) => (c.level || "superior") === level)
                        .length
                    }{" "}
                    cursos
                  </span>
                </div>
                <div className="entry-course-list">
                  {courses
                    .filter((c) => (c.level || "superior") === level)
                    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                    .map((course) => (
                      <button
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        aria-pressed={selectedCourseId === course.id}
                        className="entry-course"
                      >
                        <span className="entry-course-icon">
                          <CourseIcon course={course.id} size={21} />
                        </span>
                        <span className="entry-course-name">
                          <span>{course.name}</span>
                          {selectedCourseId === course.id && (
                            <small>Selecionado · clique para desmarcar</small>
                          )}
                        </span>
                        <span className="entry-course-arrow">
                          <Icon
                            name={
                              selectedCourseId === course.id ? "close" : "arrow"
                            }
                            size={18}
                          />
                        </span>
                      </button>
                    ))}
                </div>
              </section>
            ))}
        </div>
        <div className="entry-bottomline">
          <span>
            <Icon name="info" size={14} />
            Para trocar ou desmarcar seu curso, volte ao Início.
          </span>
          <CoordinatorAccess signedIn={Boolean(user)} compact />
        </div>
      </div>
      {showTour && <CourseTour onClose={closeTour} />}
    </div>
  );
}

export { default as NoticePage } from "./NoticePage";

export function SubjectPage() {
  const { subjects, courses, classes, lessons } = useData(),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(null);
  const [filtersCleared, setFiltersCleared] = useState(false);
  const [subjectCourse, setSubjectCourse] = useState("");
  const [subjectPeriod, setSubjectPeriod] = useState("");
  const filtered = (filtersCleared ? [] : subjects).filter(
    (s) =>
      (!subjectCourse || s.courseId === subjectCourse) &&
      (!subjectPeriod ||
        lessons.some(
          (l) =>
            (l.subjectIds || [l.subjectId]).includes(s.id) &&
            classes.some(
              (c) =>
                (l.classIds || [l.classId]).includes(c.id) &&
                c.period === Number(subjectPeriod),
            ),
        )) &&
      `${s.name} ${s.code}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Title
        title="Disciplinas"
        subtitle="Conheça as disciplinas cadastradas e suas informações acadêmicas."
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label className="w-full sm:w-48">
          Período
          <select
            aria-label="Período"
            value={subjectPeriod}
            onChange={(e) => {
              setSubjectPeriod(e.target.value);
              setFiltersCleared(false);
            }}
          >
            <option value="">Todos os períodos</option>
            {[...new Set(classes.map((c) => c.period))]
              .sort((a, b) => a - b)
              .map((p) => (
                <option key={p} value={p}>
                  {p}º período
                </option>
              ))}
          </select>
        </label>
        <label className="relative w-full max-w-md">
          <span className="sr-only">Buscar disciplina</span>
          <span className="absolute left-3 top-3">
            <Icon name="search" />
          </span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setFiltersCleared(false);
            }}
            placeholder="Buscar por nome ou sigla"
            className="pl-9"
          />
        </label>
        <button
          onClick={async () => {
            if (await confirmClearFilters()) {
              setQuery("");
              setSubjectCourse("");
              setSubjectPeriod("");
              setSelected(null);
              setFiltersCleared(true);
            }
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-brand hover:underline"
        >
          <Icon name="reset" />
          Limpar filtros
        </button>
        <span className="text-xs text-muted">
          {filtered.length} disciplinas encontradas
        </span>
      </div>
      {!filtered.length ? (
        <Empty>
          Nenhuma disciplina encontrada. Tente buscar por outra sigla ou nome.
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              style={{
                borderTopColor: s.color || "#c7ddd4",
                "--subject-color": s.color || "#c7ddd4",
              }}
              className="group flex flex-col rounded-card border border-t-[3px] border-line bg-panel p-5 text-left shadow-card transition hover:-translate-y-1 hover:border-muted/50 hover:shadow-md"
            >
              <div className="mb-5 flex w-full items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl border border-[var(--subject-color)] bg-[color-mix(in_srgb,var(--subject-color)_20%,var(--color-panel))] text-ink">
                  <SubjectIcon subject={s} />
                </span>
                <span className="rounded-full border border-line bg-canvas px-2 py-1 text-[10px] font-semibold text-muted">
                  ADS
                </span>
              </div>
              <h2 className="text-base group-hover:text-brand">{s.name}</h2>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                {academicDescription(s.description) ||
                  "Componente curricular de ADS."}
              </p>
              <span className="mt-auto flex w-full items-center justify-between border-t border-line pt-4 text-[11px] font-semibold text-brand">
                <span className="mt-4">{s.code}</span>
                <span className="mt-4 transition-transform group-hover:translate-x-1">
                  <Icon name="open" size={16} />
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <Modal
          title={selected.name}
          description={`Disciplina • ${selected.code} • ${courses.find((c) => c.id === selected.courseId)?.code || ""}`}
          icon="subjects"
          onClose={() => setSelected(null)}
          footer={
            <Button onClick={() => setSelected(null)}>Fechar detalhes</Button>
          }
        >
          <p className="text-sm leading-7 text-muted">
            {academicDescription(selected.description) ||
              "Consulte a grade para ver os horários, docentes e salas desta disciplina."}
          </p>
          <div className="mt-5 rounded-xl border border-line bg-canvas p-4">
            <Link
              to={`/horarios?courseId=${selected.courseId}&period=${classes.find((c) => c.id === lessons.find((l) => l.subjectId === selected.id)?.classId)?.period || 1}`}
              className="flex items-center justify-between text-xs font-semibold text-brand"
            >
              Consultar horários da turma
              <Icon name="arrow" />
            </Link>
          </div>
        </Modal>
      )}
    </>
  );
}

export function AccessPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState("");
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFailure("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await api("/auth/me");
      navigate("/admin", { replace: true });
      success("Login realizado com sucesso!");
    } catch (e) {
      await signOut(auth).catch(() => {});
      setFailure(
        e.code === "auth/too-many-requests"
          ? "Muitas tentativas. Aguarde um pouco e tente novamente."
          : e.code
            ? "Não foi possível entrar. Confira o e-mail e a senha e tente novamente."
            : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="access-page">
      <div className="access-shell">
        <aside className="access-story" aria-label="Área da coordenação">
          <Brand />
          <div className="access-story-copy">
            <span>COORDENAÇÃO ACADÊMICA</span>
            <h2>
              Organize o campus.
              <br />
              Simplifique o dia.
            </h2>
            <p>Um espaço para cuidar dos cursos e da programação acadêmica.</p>
          </div>
          <div className="access-story-features">
            {[
              ["schedule", "Horários e turmas"],
              ["calendar", "Calendários e documentos"],
              ["bell", "Comunicados do campus"],
            ].map(([icon, label]) => (
              <div key={label}>
                <Icon name={icon} size={18} />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="access-story-grid" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </aside>
        <section className="access-form-panel">
          <span className="access-form-icon">
            <Icon name="lock" size={21} />
          </span>
          <p className="access-eyebrow">BEM-VINDO DE VOLTA</p>
          <h1>Acesso do coordenador</h1>
          <p className="access-description">
            Entre para gerenciar a programação do campus.
          </p>
          <form onSubmit={submit} className="access-form">
            <label htmlFor="login-email">
              {localMode ? "Usuário" : "E-mail institucional"}
              <div className="access-input">
                <Icon name={localMode ? "user" : "mail"} size={18} />
                <input
                  id="login-email"
                  aria-label={localMode ? "Usuário" : "E-mail institucional"}
                  required
                  autoComplete="username"
                  type={localMode ? "text" : "email"}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFailure("");
                  }}
                  placeholder={
                    localMode ? "Seu usuário" : "seu.email@ifpb.edu.br"
                  }
                  disabled={busy}
                />
              </div>
            </label>
            <label htmlFor="login-password">
              Senha
              <div className="access-input">
                <Icon name="lock" size={18} />
                <input
                  id="login-password"
                  aria-label="Senha"
                  required
                  autoComplete="current-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFailure("");
                  }}
                  placeholder="Digite sua senha"
                  disabled={busy}
                />
                <button
                  type="button"
                  disabled={busy}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={show}
                  onClick={() => setShow((value) => !value)}
                >
                  <Icon name={show ? "eyeOff" : "eye"} size={18} />
                </button>
              </div>
            </label>
            {failure && (
              <div role="alert" className="access-error">
                <Icon name="info" size={17} />
                <span>{failure}</span>
              </div>
            )}
            <Button type="submit" disabled={busy} className="access-submit">
              {busy ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar
                  <Icon name="arrow" size={17} />
                </>
              )}
            </Button>
          </form>
          <div className="access-form-footer">
            <p>
              <Icon name="shield" size={14} />
              Acesso exclusivo da coordenação.
            </p>
            <Link to="/">
              <Icon name="back" size={15} />
              Voltar à consulta pública
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
