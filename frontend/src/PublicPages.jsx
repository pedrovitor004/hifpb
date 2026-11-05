import { academicDescription } from "./content";
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "./firebase";
import { auth, api, localMode } from "./firebase";
import { useData } from "./App";
import {
  Icon,
  Button,
  Card,
  Badge,
  Title,
  Empty,
  alert,
  error,
  dateLabel,
  SubjectIcon,
  CourseIcon,
  confirmClearFilters,
} from "./components";
import Modal from "./Modal";

export function StartPage() {
  const { notices, courses, classes } = useData();
  const [action, setAction] = useState(null),
    [period, setPeriod] = useState("1"),
    [course, setCourse] = useState("ads");
  const navigate = useNavigate();
  function open(title) {
    setAction(title);
    setPeriod("1");
    setCourse("ads");
  }
  const actions = [
    [
      "Horários",
      "Consulte horários por período e turno.",
      "/horarios",
      "schedule",
    ],
    ["Salas", "Encontre os ambientes e salas do campus.", "/salas", "rooms"],
    [
      "Professores",
      "Conheça os docentes e suas disciplinas.",
      "/professores",
      "professors",
    ],
    ["Calendário", "Consulte a programação acadêmica.", null, "calendar"],
  ];
  return (
    <>
      <Title
        title="Consulta de horários"
        subtitle="Acesse horários, salas, professores e calendário acadêmico. Escolha o período e comece sua consulta."
      />
      <div className="mb-5 flex snap-x gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible">
        {[
          [
            "Escolha o período",
            "Selecione o período de interesse para consultar horários, salas e docentes disponíveis.",
            "filter",
          ],
          [
            "Acesse a grade",
            "Veja a programação da semana, disciplinas, horários e ambientes do campus.",
            "schedule",
          ],
          [
            "Confira informações",
            "Encontre a sala da aula, consulte seus professores e acompanhe os avisos.",
            "subjects",
          ],
        ].map(([title, text, icon], i) => (
          <div
            key={title}
            role="button"
            tabIndex={0}
            onClick={() =>
              open(
                i === 0
                  ? "Escolher período"
                  : i === 1
                    ? "Horários"
                    : "Conhecer o HIFPB",
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(
                  i === 0
                    ? "Escolher período"
                    : i === 1
                      ? "Horários"
                      : "Conhecer o HIFPB",
                );
              }
            }}
            className={`group min-w-[260px] max-w-[300px] shrink-0 cursor-pointer snap-start rounded-card md:min-w-0 md:max-w-none border border-line border-l-[4px] bg-panel p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-md ${i === 0 ? "border-l-ink" : i === 1 ? "border-l-brand" : "border-l-muted"}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-canvas font-bold text-brand">
                {i + 1}
              </span>
              <span className="opacity-55 transition group-hover:opacity-100">
                <Icon name={icon} />
              </span>
            </div>
            <h3 className="text-[15px]">{title}</h3>
            <p className="mt-3 text-xs leading-5 text-muted">{text}</p>
          </div>
        ))}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="!p-5 lg:!p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base">Principais consultas</h2>
            <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-[10px] font-medium text-muted">
              Atalhos de consulta
            </span>
          </div>
          <div className="space-y-3">
            {actions.map(([title, description, to, icon]) => {
              const inner = (
                <>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-panel transition group-hover:border-brand/40">
                    <Icon name={icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[14px] font-semibold group-hover:text-brand">
                      {title}
                    </strong>
                    <span className="mt-1 block text-xs leading-5 text-muted">
                      {description}
                    </span>
                  </span>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-canvas transition group-hover:translate-x-1">
                    <Icon name="arrow" />
                  </span>
                </>
              );
              const cls =
                "group flex min-h-[82px] w-full items-center gap-4 rounded-xl border border-line bg-surface p-4 text-left transition duration-150 hover:border-muted/60 hover:bg-canvas hover:shadow-card";
              return (
                <button key={title} className={cls} onClick={() => open(title)}>
                  {inner}
                </button>
              );
            })}
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="!p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base">Avisos recentes</h2>
              <span className="flex size-8 items-center justify-center rounded-lg bg-canvas">
                <Icon name="bell" />
              </span>
            </div>
            {notices.length ? (
              <div className="space-y-3">
                {notices
                  .slice()
                  .sort(
                    (a, b) =>
                      (b.createdAt?._seconds || 0) -
                      (a.createdAt?._seconds || 0),
                  )
                  .slice(0, 3)
                  .map((n) => (
                    <Link
                      key={n.id}
                      className="block rounded-xl border border-line p-3 transition hover:bg-canvas"
                      to="/avisos"
                    >
                      <span className="text-[10px] text-muted">
                        {dateLabel(n.createdAt)}
                      </span>
                      <strong className="mt-1 block text-[13px]">
                        {n.title}
                      </strong>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                        {n.message}
                      </p>
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-6 text-center">
                <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-panel">
                  <Icon name="bell" />
                </span>
                <strong className="text-[13px] font-medium">
                  Tudo em dia por aqui
                </strong>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Não há nenhum aviso no momento.
                </p>
              </div>
            )}
            <Link
              to="/avisos"
              className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs font-semibold text-brand"
            >
              Todos os avisos
              <Icon name="arrow" />
            </Link>
          </Card>
          <div className="flex gap-3 rounded-card border border-line bg-panel/60 p-4">
            <Icon name="info" />
            <p className="text-[11px] leading-5 text-muted">
              Selecione um período para ver a programação da sua turma.
            </p>
          </div>
        </div>
      </div>
      {action && (
        <Modal
          title={
            action === "Escolher período"
              ? "Encontre sua turma"
              : action === "Conhecer o HIFPB"
                ? "Informações da turma"
                : action === "Calendário"
                  ? "Calendário acadêmico"
                  : `Consultar ${action.toLowerCase()}`
          }
          description={
            action === "Calendário"
              ? "Datas e atividades do campus em um único lugar."
              : "Selecione o curso e o período."
          }
          icon={
            action === "Salas"
              ? "rooms"
              : action === "Professores"
                ? "professors"
                : action === "Calendário"
                  ? "calendar"
                  : "schedule"
          }
          onClose={() => setAction(null)}
          footer={
            <>
              <Button secondary onClick={() => setAction(null)}>
                Cancelar
              </Button>
              {!["Calendário", "Conhecer o HIFPB"].includes(action) && (
                <Button
                  onClick={() => {
                    navigate(
                      `${action === "Salas" ? "/salas" : action === "Professores" ? "/professores" : "/horarios"}?courseId=${course}&period=${period}`,
                    );
                    setAction(null);
                  }}
                >
                  Consultar
                  <Icon name="arrowWhite" />
                </Button>
              )}
            </>
          }
        >
          {action === "Calendário" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-canvas p-4 text-[13px] leading-6 text-muted">
                O calendário acadêmico recebido está disponível para consulta completa em PDF.
              </div>
              <Link
                to="/calendario"
                className="inline-flex items-center gap-2 text-xs font-semibold text-brand"
              >
                Visualizar calendário em PDF
                <Icon name="arrow" />
              </Link>
            </div>
          ) : action === "Conhecer o HIFPB" ? (
            <div className="space-y-3">
              {[
                [
                  "Salas",
                  "Consulte os ambientes e as aulas de cada sala.",
                  "rooms",
                ],
                [
                  "Professores",
                  "Encontre docentes e suas disciplinas.",
                  "professors",
                ],
                [
                  "Horários",
                  "Consulte sua turma e veja os detalhes das aulas.",
                  "schedule",
                ],
              ].map(([title, text, icon]) => (
                <button
                  key={title}
                  onClick={() => open(title)}
                  className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-4 text-left transition hover:bg-canvas"
                >
                  <Icon name={icon} />
                  <span>
                    <strong className="text-[13px]">{title}</strong>
                    <small className="mt-1 block text-muted">{text}</small>
                  </span>
                  <span className="ml-auto">
                    <Icon name="arrow" />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <label>
                <span className="flex items-center gap-2">
                  <CourseIcon course={course} />
                  Curso
                </span>
                <select
                  aria-label="Curso da consulta"
                  value={course}
                  onChange={(e) => { setCourse(e.target.value); setPeriod(String(classes.find(c=>c.courseId===e.target.value)?.period || 1)); }}
                >
                  {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <fieldset>
                <legend className="mb-2 text-xs font-medium">Período</legend>
                <div className="grid grid-cols-3 gap-3">
                  {[...new Set(classes.filter(c=>c.courseId===course).map(c=>c.period))].sort((a,b)=>a-b).map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={period === String(p)}
                      onClick={() => setPeriod(String(p))}
                      className={`rounded-xl border px-3 py-5 text-center transition ${period === String(p) ? "border-brand bg-canvas ring-1 ring-brand" : "border-line bg-panel hover:border-muted"}`}
                    >
                      <strong className="block text-xl text-brand">{p}º</strong>
                      <span className="mt-1 block text-[11px] text-muted">
                        período
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-[11px] leading-5 text-muted">
                <Icon name="info" />
                Turno noturno • ADS
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

export function NoticePage() {
  const { notices } = useData(),
    [category, setCategory] = useState(""),
    [selected, setSelected] = useState(null);
  const filtered = notices
    .filter((n) => !category || n.category === category)
    .sort(
      (a, b) => (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0),
    );
  return (
    <>
      <Title
        title="Avisos acadêmicos"
        subtitle="Acompanhe comunicados, alterações e informações da coordenação."
      />
      <div className="mb-5 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-panel p-1.5 sm:w-fit">
        {[
          ["", "Todos", "bell"],
          ["alteracao", "Alterações", "reset"],
          ["cancelamento", "Cancelamentos", "close"],
        ].map(([value, label, icon]) => (
          <button
            aria-pressed={category === value}
            key={value}
            onClick={() => setCategory(value)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs transition sm:px-4 ${category === value ? "bg-action font-semibold text-white shadow-sm" : "text-muted hover:bg-canvas"}`}
          >
            <Icon name={icon} />
            {label}
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] ${category === value ? "bg-white/15" : "bg-canvas"}`}
            >
              {notices.filter((n) => !value || n.category === value).length}
            </span>
          </button>
        ))}
      </div>
      {!filtered.length ? (
        <Card className="flex min-h-80 flex-col items-center justify-center text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-line bg-canvas">
            <Icon name="bell" />
          </span>
          <h2 className="text-lg">
            {category
              ? "Nenhum aviso nesta categoria"
              : "Nenhum aviso publicado"}
          </h2>
          <p className="mb-6 mt-2 max-w-sm text-[13px] leading-6 text-muted">
            {category
              ? "Selecione outra categoria para consultar os comunicados disponíveis."
              : "Não há nenhum aviso no momento."}
          </p>
          {category ? (
            <Button secondary onClick={() => setCategory("")}>
              Ver todos os avisos
            </Button>
          ) : (
            <Link
              to="/horarios"
              className="flex items-center gap-2 rounded-control bg-action px-5 py-3 text-xs font-semibold text-white transition hover:bg-emerald-900"
            >
              <Icon name="schedule" />
              Consultar horários
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((n) => (
            <Card
              key={n.id}
              className={`group !p-5 border-l-4 transition hover:shadow-md ${n.category === "cancelamento" ? "border-l-rose-600 hover:border-rose-400" : n.category === "alteracao" ? "border-l-amber-500 hover:border-amber-400" : "border-l-emerald-700 hover:border-emerald-500"}`}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${n.category === "cancelamento" ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200" : n.category === "alteracao" ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"}`}>
                  {n.category === "cancelamento"
                    ? "Cancelamento"
                    : n.category === "alteracao"
                      ? "Alteração"
                      : "Informação"}
                </span>
                <span className="text-[11px] text-muted">
                  {dateLabel(n.createdAt)}
                </span>
              </div>
              <h2 className="text-base">{n.title}</h2>
              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-[13px] leading-6 text-muted">
                {n.message}
              </p>
              <button
                onClick={() => setSelected(n)}
                className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand transition hover:gap-3"
              >
                Ler comunicado
                <Icon name="arrow" />
              </button>
            </Card>
          ))}
        </div>
      )}
      {selected && (
        <Modal
          title={selected.title}
          description={`Publicado pela coordenação • ${dateLabel(selected.createdAt)}`}
          icon="bell"
          onClose={() => setSelected(null)}
          footer={<Button onClick={() => setSelected(null)}>Entendi</Button>}
        >
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted">
            {selected.message}
          </p>
        </Modal>
      )}
    </>
  );
}

export function SubjectPage() {
  const { subjects, courses, classes, lessons } = useData(),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(null);
  const [filtersCleared, setFiltersCleared] = useState(false);
  const [subjectCourse,setSubjectCourse]=useState("");
  const [subjectPeriod,setSubjectPeriod]=useState("");
  const filtered = (filtersCleared ? [] : subjects).filter((s) =>
    (!subjectCourse||s.courseId===subjectCourse)&&(!subjectPeriod||lessons.some(l=>(l.subjectIds||[l.subjectId]).includes(s.id)&&classes.some(c=>(l.classIds||[l.classId]).includes(c.id)&&c.period===Number(subjectPeriod))))&&`${s.name} ${s.code}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Title
        title="Disciplinas"
        subtitle="Conheça as disciplinas cadastradas e suas informações acadêmicas."
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label className="w-full sm:w-48">Período<select aria-label="Período" value={subjectPeriod} onChange={e=>{setSubjectPeriod(e.target.value);setFiltersCleared(false);}}><option value="">Todos os períodos</option>{[1,2,3,4,5,6].map(p=><option key={p} value={p}>{p}º período</option>)}</select></label>
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
              style={{ borderTopColor: s.color || "#c7ddd4", "--subject-color": s.color || "#c7ddd4" }}
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
          description={`Disciplina • ${selected.code} • ADS`}
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
              to={`/horarios?courseId=${selected.courseId}&period=${classes.find(c=>c.id===lessons.find(l=>l.subjectId===selected.id)?.classId)?.period||1}`}
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
      navigate("/admin");
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
    <div className="mx-auto max-w-[480px] py-5 sm:py-10">
      <Card className="!p-6 sm:!p-8">
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-line bg-canvas">
          <Icon name="lock" />
        </div>
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-muted">
          Área restrita • HIFPB
        </span>
        <h1>Acesso do coordenador</h1>
        <p className="mb-7 mt-3 text-[13px] leading-6 text-muted">
          Informe seu usuário e sua senha para continuar.
        </p>
        <form onSubmit={submit} className="space-y-5">
          <label htmlFor="login-email">
            {localMode ? "Usuário" : "E-mail institucional"}
            <div className="relative">
              <span className="absolute left-3 top-3">
                <Icon name="mail" />
              </span>
              <input
                id="login-email"
                aria-label={localMode ? "Usuário" : "E-mail institucional"}
                required
                autoComplete="username"
                type={localMode ? "text" : "email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={localMode ? "root" : "seu.email@ifpb.edu.br"}
                className="pl-10"
                disabled={busy}
              />
            </div>
          </label>
          <label htmlFor="login-password">
            Senha
            <div className="relative">
              <span className="absolute left-3 top-3">
                <Icon name="lock" />
              </span>
              <input
                id="login-password"
                aria-label="Senha"
                required
                autoComplete="current-password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="pl-10 pr-20"
                disabled={busy}
              />
              <button
                type="button"
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-3 text-[11px] font-medium text-brand hover:underline"
              >
                {show ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>
          {failure && (
            <div
              role="alert"
              className="flex gap-2 rounded-xl border border-red-300/70 bg-red-50 p-3 text-xs leading-5 text-red-800"
            >
              <Icon name="info" />
              {failure}
            </div>
          )}
          <Button type="submit" disabled={busy} className="w-full min-h-11">
            {busy ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Entrando…
              </>
            ) : (
              <>
                Entrar
                <Icon name="arrowWhite" />
              </>
            )}
          </Button>
        </form>
        <div className="mt-6 border-t border-line pt-5">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 text-xs font-semibold text-brand transition hover:gap-3"
          >
            <Icon name="back" />
            Voltar à consulta pública
          </Link>
        </div>
      </Card>
      <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted">
        <Icon name="lock" />
        Acesso restrito à coordenação.
      </p>
    </div>
  );
}
