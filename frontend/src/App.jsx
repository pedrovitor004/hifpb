import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useCallback,
} from "react";
import {
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged, signOut } from "./firebase";
import { auth, api } from "./firebase";
import {
  Icon,
  Button,
  Card,
  Loading,
  ErrorState,
  alert,
  dateLabel,
  publicNotices,
} from "./components";
import { StartPage, NoticePage, AccessPage, SubjectPage } from "./PublicPages";
import { RoomDirectory, ProfessorDirectory } from "./Directories";
import Admin from "./Admin";
import RefinedSchedule from "./Schedule";
import RefinedLesson from "./Lesson";
import ThemeToggle from "./Theme";
import Search from "./Search";
import Brand, { CoordinatorAccess } from "./Brand";
import Calendar from "./Calendar";
import { courseData } from "./courseData";
const DataContext = createContext(null);
export const useData = () => useContext(DataContext);
const nav = [
  ["/", "Início", "home"],
  ["/horarios", "Horários", "schedule"],
  ["/salas", "Salas", "rooms"],
  ["/professores", "Professores", "professors"],
  ["/disciplinas", "Disciplinas", "subjects"],
  ["/calendario", "Calendário", "calendar"],
  ["/avisos", "Avisos", "notices"],
];
export default function App() {
  const [selectedCourseId, updateSelectedCourse] = useState(
    () => localStorage.getItem("hifpb-course") || "",
  );
  const clearAcademic = (previous) =>
    previous
      ? {
          ...previous,
          ...Object.fromEntries(
            [
              "classes",
              "professors",
              "subjects",
              "rooms",
              "lessons",
              "notices",
              "calendars",
              "calendarEvents",
            ].map((key) => [key, []]),
          ),
        }
      : previous;
  const setSelectedCourseId = (id) => {
    const next = id === selectedCourseId ? "" : id;
    if (next) localStorage.setItem("hifpb-course", next);
    else localStorage.removeItem("hifpb-course");
    announcementShown.current = false;
    setSelectionRequired(false);
    setData(next ? null : clearAcademic);
    updateSelectedCourse(next);
    navigate(next ? "/horarios" : "/");
  };
  const [selectionRequired, setSelectionRequired] = useState(false);
  const loadSequence = useRef(0);
  const [data, setData] = useState(null),
    [failure, setFailure] = useState(""),
    [collapsed, setCollapsed] = useState(false),
    [notifying, setNotifying] = useState(false),
    [user, setUser] = useState(undefined);
  const loc = useLocation(),
    navigate = useNavigate(),
    pop = useRef(null),
    bell = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navGroup, setNavGroup] = useState(() =>
    ["/salas", "/professores", "/disciplinas", "/calendario"].includes(
      loc.pathname,
    )
      ? "academic"
      : null,
  );
  const announcementShown = useRef(false);
  const coordinatorView = Boolean(user) && loc.pathname.startsWith("/admin");
  const adminTab = new URLSearchParams(loc.search).get("tab") || "lessons";
  const publicPage =
    !loc.pathname.startsWith("/admin") && loc.pathname !== "/entrar";
  useEffect(() => {
    if (
      publicPage &&
      loc.pathname !== "/" &&
      (!selectedCourseId ||
        (data && !data.courses.some((c) => c.id === selectedCourseId)))
    ) {
      setSelectionRequired(true);
    }
  }, [publicPage, loc.pathname, selectedCourseId, data, navigate]);
  const notices = (data?.notices || [])
    .filter(
      (n) =>
        n.status !== "draft" &&
        (selectedCourseId&&(n.audience==="all"||n.courseId===selectedCourseId||n.courseIds?.includes(selectedCourseId))),
    )
    .slice()
    .sort(
      (a, b) =>
        (b.updatedAt?._seconds || b.createdAt?._seconds || 0) -
        (a.updatedAt?._seconds || a.createdAt?._seconds || 0),
    );
  useEffect(() => {
    if (
      user === undefined ||
      !publicPage ||
      loc.pathname === "/" ||
      loc.pathname === "/avisos" ||
      !selectedCourseId ||
      !notices.length ||
      announcementShown.current
    )
      return;
    announcementShown.current = true;
    let active = true;
    publicNotices(notices.length).then((result) => {
      if (active && result.isConfirmed) navigate("/avisos");
    });
    return () => {
      active = false;
    };
  }, [
    user,
    publicPage,
    loc.pathname,
    selectedCourseId,
    notices.length,
    navigate,
  ]);
  useEffect(() => {
    if (!publicPage || !selectedCourseId) return;
    let active = true;
    const refresh = () =>
      api("/notices?courseId=" + encodeURIComponent(selectedCourseId))
        .then((notices) => {
          if (active) setData((prev) => (prev ? { ...prev, notices } : prev));
        })
        .catch(() => {});
    const timer = setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [publicPage, selectedCourseId]);
  const mobileButton = useRef(null),
    side = useRef(null);
  useEffect(() => {
    setMobileOpen(false);
  }, [loc.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    side.current?.querySelector("button")?.focus();
    const close = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        mobileButton.current?.focus();
      }
      if (e.key === "Tab") {
        const all = [...side.current.querySelectorAll("a,button")].filter(
          (e) => e.getClientRects().length,
        );
        if (e.shiftKey && document.activeElement === all[0]) {
          e.preventDefault();
          all.at(-1).focus();
        }
        if (!e.shiftKey && document.activeElement === all.at(-1)) {
          e.preventDefault();
          all[0].focus();
        }
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", close);
    };
  }, [mobileOpen]);
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setFailure("");
    try {
      const keys = [
        "classes",
        "professors",
        "subjects",
        "rooms",
        "lessons",
        "notices",
        "calendars",
        "calendarEvents",
      ];
      const courses = await api("/courses");
      const empty = Object.fromEntries(keys.map((key) => [key, []]));
      const validCourse = courses.some(
        (course) => course.id === selectedCourseId,
      );
      if (sequence !== loadSequence.current) return;
      if (selectedCourseId && !validCourse) {
        localStorage.removeItem("hifpb-course");
        updateSelectedCourse("");
        setSelectionRequired(true);
      }
      let academic = empty;
      if (coordinatorView || (publicPage && validCourse)) {
        const query = coordinatorView
          ? ""
          : "?courseId=" + encodeURIComponent(selectedCourseId);
        const values = await Promise.all(
          keys.map((key) => api("/" + key + query)),
        );
        academic = Object.fromEntries(
          keys.map((key, index) => [key, values[index]]),
        );
      }
      if (sequence === loadSequence.current) setData({ courses, ...academic });
    } catch (e) {
      if (sequence === loadSequence.current) setFailure(e.message);
    }
  }, [coordinatorView, publicPage, selectedCourseId]);
  useEffect(() => {
    setData((previous) =>
      publicPage && loc.pathname === "/" ? clearAcademic(previous) : null,
    );
    load();
    return () => {
      loadSequence.current++;
    };
  }, [load]);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    if (!notifying) return;
    const close = (e) => {
      if (e.type === "keydown" && e.key === "Escape") {
        setNotifying(false);
        bell.current?.focus();
      } else if (
        e.type === "pointerdown" &&
        !pop.current?.contains(e.target) &&
        !bell.current?.contains(e.target)
      )
        setNotifying(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    pop.current?.querySelector("button")?.focus();
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [notifying]);
  useEffect(() => {
    setNotifying(false);
  }, [loc.pathname]);
  const current = loc.pathname.startsWith("/aulas")
    ? "Detalhes da aula"
    : loc.pathname.startsWith("/admin")
      ? "Área restrita"
      : loc.pathname === "/entrar"
        ? "Acesso do coordenador"
        : nav.find((n) => n[0] === loc.pathname)?.[1] || "HIFPB";
  const unavailable = () =>
    alert(
      "Esta funcionalidade ainda não está disponível. Continue consultando horários, salas, professores ou avisos.",
      "Em desenvolvimento",
    );
  const visibleData = publicPage ? courseData(data, selectedCourseId) : data;
  return (
    <DataContext.Provider
      value={{
        ...visibleData,
        selectedCourseId,
        setSelectedCourseId,
        selectionRequired,
        load,
        user,
      }}
    >
      <a
        href="#main"
        className="fixed -top-20 left-4 z-[100] rounded-lg bg-action p-3 text-white focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <div className="flex min-h-dvh">
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
        <div
          className={`sticky top-0 z-40 h-dvh w-0 shrink-0 transition-[width] duration-200 motion-reduce:transition-none ${collapsed ? "md:w-0" : "md:w-sidebar"}`}
        >
          <div
            id="desktop-navigation"
            aria-hidden={collapsed && !mobileOpen}
            inert={collapsed && !mobileOpen}
            className={
              mobileOpen
                ? ""
                : collapsed
                  ? "hidden"
                  : "hidden h-full w-sidebar overflow-hidden md:block"
            }
          >
            <aside
              ref={side}
              id="main-navigation"
              className={`hifpb-sidebar ${mobileOpen ? "fixed inset-y-0 left-0 z-50 flex overflow-y-auto shadow-float" : "hidden md:flex"} h-dvh w-sidebar shrink-0 flex-col justify-between border-r border-line bg-panel px-4 py-4`}
              aria-label="Menu principal"
            >
              {mobileOpen && (
                <button
                  className="absolute right-3 top-3 size-8 rounded-lg bg-canvas text-brand"
                  aria-label="Fechar menu"
                  onClick={() => {
                    setMobileOpen(false);
                    mobileButton.current?.focus();
                  }}
                >
                  <Icon name="close" />
                </button>
              )}
              <div>
                <div className="sidebar-brand-row">
                  <Brand />
                </div>
                {coordinatorView ? (
                  <nav
                    className="mt-3 flex flex-col gap-1"
                    aria-label="Gestão da coordenação"
                  >
                    {[
                      ["lessons", "Horários", "schedule"],
                      ["drafts", "Rascunhos", "draft"],
                      ["calendars", "Calendários", "calendar"],
                      ["notices", "Avisos", "bell"],
                      ["courses", "Cursos", "graduation"],
                      ["classes", "Turmas", "detailUsers"],
                      ["professors", "Professores", "professors"],
                      ["subjects", "Disciplinas", "subjects"],
                      ["rooms", "Salas", "rooms"],
                    ].map(([key, label, icon]) => (
                      <Link
                        key={key}
                        to={`/admin?tab=${key}`}
                        aria-current={adminTab === key ? "page" : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition ${adminTab === key ? "bg-action text-white" : "text-muted hover:bg-canvas"}`}
                      >
                        <Icon name={icon} />
                        {label}
                      </Link>
                    ))}
                  </nav>
                ) : (
                  <>
                    <nav
                      className="mt-4 flex flex-col gap-1"
                      aria-label="Páginas da plataforma"
                    >
                      {nav
                        .filter(([path]) => ["/", "/horarios"].includes(path))
                        .map(([path, label, icon]) => (
                          <NavLink
                            key={path}
                            to={path}
                            end={path === "/"}
                            title={label}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                              `flex h-10 shrink-0 items-center gap-3 rounded-xl text-[13px] font-medium transition ${collapsed && !mobileOpen ? "justify-center" : "px-3"} ${isActive || (path === "/horarios" && loc.pathname.startsWith("/aulas")) ? "bg-action text-white" : "text-muted hover:bg-canvas"}`
                            }
                          >
                            <Icon name={icon} />
                            {(!collapsed || mobileOpen) && <span>{label}</span>}
                          </NavLink>
                        ))}
                      {[
                        [
                          "academic",
                          "Acadêmico",
                          "graduation",
                          [
                            "/disciplinas",
                            "/professores",
                            "/salas",
                            "/calendario",
                          ],
                        ],
                      ].map(([key, label, icon, paths]) => (
                        <div key={key} className="group/nav relative">
                          <button
                            title={collapsed && !mobileOpen ? label : undefined}
                            aria-label={
                              collapsed && !mobileOpen ? label : undefined
                            }
                            aria-expanded={navGroup === key}
                            aria-controls={"nav-" + key}
                            onClick={() => {
                              if (collapsed && !mobileOpen)
                                setNavGroup(navGroup === key ? null : key);
                              else setNavGroup(navGroup === key ? null : key);
                            }}
                            className={`flex h-10 w-full items-center gap-3 rounded-xl text-[13px] font-medium transition hover:bg-canvas ${collapsed && !mobileOpen ? "justify-center px-0" : "px-3"} ${paths.includes(loc.pathname) ? "text-brand" : "text-muted"}`}
                          >
                            <Icon name={icon} />
                            {(!collapsed || mobileOpen) && (
                              <>
                                <span>{label}</span>
                                <span
                                  className={`ml-auto transition-transform ${navGroup === key ? "rotate-180" : ""}`}
                                >
                                  <Icon name="down" size={15} />
                                </span>
                              </>
                            )}
                          </button>
                          {navGroup === key && (
                            <div
                              id={"nav-" + key}
                              className={
                                collapsed && !mobileOpen
                                  ? "absolute left-[calc(100%+12px)] top-0 z-[70] w-52 space-y-1 rounded-xl border border-line bg-panel p-2 shadow-float"
                                  : "ml-5 mt-1 space-y-1 border-l border-line pl-3"
                              }
                            >
                              {paths.map((path) => {
                                const [, itemLabel, itemIcon] = nav.find(
                                  (n) => n[0] === path,
                                );
                                return (
                                  <NavLink
                                    key={path}
                                    to={path}
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                      `flex h-9 items-center gap-2.5 rounded-lg px-3 text-xs font-medium transition ${isActive ? "bg-action text-white" : "text-muted hover:bg-canvas"}`
                                    }
                                  >
                                    <Icon name={itemIcon} size={16} />
                                    {itemLabel}
                                    {path === "/avisos" &&
                                      notices.length > 0 && (
                                        <span
                                          aria-hidden="true"
                                          className="ml-auto rounded-full bg-action px-1.5 text-[10px] text-white"
                                        >
                                          {notices.length}
                                        </span>
                                      )}
                                  </NavLink>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                      <NavLink
                        to="/avisos"
                        title="Avisos"
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex h-10 shrink-0 items-center gap-3 rounded-xl text-[13px] font-medium transition ${collapsed && !mobileOpen ? "justify-center" : "px-3"} ${isActive ? "bg-action text-white" : "text-muted hover:bg-canvas"}`
                        }
                      >
                        <Icon name="notices" />
                        {(!collapsed || mobileOpen) && (
                          <>
                            <span>Avisos</span>
                            {notices.length > 0 && (
                              <span
                                aria-hidden="true"
                                className="ml-auto rounded-full bg-canvas px-1.5 text-[10px] text-brand"
                              >
                                {notices.length}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </nav>
                  </>
                )}
              </div>
              <div className="sidebar-account">
                {coordinatorView ? (
                  <p className="mb-1 px-3 text-xs font-semibold text-brand">
                    Coordenação conectada
                  </p>
                ) : (
                  <CoordinatorAccess signedIn={Boolean(user)} />
                )}
                {user && (
                  <button
                    onClick={async () => {
                      await signOut(auth);
                      navigate("/");
                    }}
                    className="sidebar-signout"
                  >
                    <Icon name="logout" size={15} />
                    Sair da conta
                  </button>
                )}
              </div>
            </aside>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-expanded={!collapsed}
            aria-controls="desktop-navigation"
            className="sidebar-handle"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
              className={collapsed ? "rotate-180" : ""}
            >
              <path
                d="m14 7-5 5 5 5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="app-topbar relative z-20 flex min-h-[72px] items-center justify-between gap-3 border-b border-line bg-panel px-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 text-muted">
              <button
                ref={mobileButton}
                aria-label="Abrir menu"
                aria-expanded={mobileOpen}
                aria-controls="main-navigation"
                onClick={() => setMobileOpen(true)}
                className="mr-1 flex size-9 shrink-0 items-center justify-center rounded-control border border-line text-lg text-brand md:hidden"
              >
                <Icon name="menu" />
              </button>

              <strong className="text-brand">HIFPB</strong>
              <Icon name="right" />
              <span className="truncate text-xs sm:text-sm">{current}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              {!coordinatorView && selectedCourseId && (
                <Search data={visibleData} />
              )}
              <ThemeToggle />
              {!coordinatorView && selectedCourseId && (
                <button
                  ref={bell}
                  onClick={() => setNotifying((v) => !v)}
                  aria-label="Notificações"
                  aria-expanded={notifying}
                  aria-controls="notifications"
                  className="relative flex size-10 items-center justify-center rounded-control bg-canvas"
                >
                  <Icon name="bell" />
                  {notices.length > 0 && (
                    <span
                      data-testid="notice-count"
                      aria-label={`${notices.length} avisos publicados`}
                      className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full border-2 border-panel bg-action px-1 text-[10px] font-bold leading-4 text-white"
                    >
                      {notices.length > 99 ? "99+" : notices.length}
                    </span>
                  )}
                </button>
              )}
            </div>
            {notifying && (
              <div
                ref={pop}
                id="notifications"
                role="dialog"
                aria-label="Notificações"
                className="absolute right-4 top-16 z-30 max-h-[70vh] overflow-y-auto w-[min(360px,calc(100vw-32px))] space-y-4 rounded-card border border-line bg-panel p-5 shadow-float"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">Avisos do curso</h2>
                  <button
                    type="button"
                    aria-label="Fechar notificações"
                    className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-canvas"
                    onClick={() => {
                      setNotifying(false);
                      bell.current?.focus();
                    }}
                  >
                    <Icon name="close" size={17} />
                  </button>
                </div>
                <p className="text-sm leading-6 text-muted">
                  {failure
                    ? "Não foi possível carregar os avisos."
                    : !selectedCourseId
                      ? "Escolha seu curso no início para consultar os avisos."
                      : notices.length
                        ? `Há ${notices.length} ${notices.length === 1 ? "aviso" : "avisos"} para o seu curso. Confira os comunicados.`
                        : "Nenhum aviso no momento."}
                </p>
                {selectedCourseId && notices.length > 0 && (
                  <Link
                    to="/avisos"
                    onClick={() => setNotifying(false)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-brand"
                  >
                    Ver avisos
                    <Icon name="arrow" size={15} />
                  </Link>
                )}
              </div>
            )}
          </header>
          <main
            id="main"
            tabIndex={-1}
            className={`min-w-0 flex-1 p-4 outline-none sm:p-6 md:px-8 ${loc.pathname === "/" ? "lg:py-5" : "lg:py-7"}`}
          >
            {failure ? (
              <ErrorState message={failure} retry={load} />
            ) : !data ? (
              <Loading />
            ) : publicPage && loc.pathname !== "/" && !selectedCourseId ? (
              <Card className="course-required-gate">
                <div className="course-gate-visual" aria-hidden="true">
                  <div className="course-gate-emblem">
                    <Icon name="graduation" size={48} />
                    <span>
                      <Icon name="lock" size={18} />
                    </span>
                  </div>
                  <p>
                    Sua consulta
                    <br />
                    começa aqui.
                  </p>
                  <div className="course-gate-squares">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="course-gate-copy">
                  <span className="course-gate-eyebrow">
                    PRIMEIRO, SEU CURSO
                  </span>
                  <h1>Selecione seu curso para continuar</h1>
                  <p>
                    Escolha seu curso no Início para encontrar os horários,
                    disciplinas e avisos certos para você.
                  </p>
                  <Link to="/" className="course-gate-action">
                    Selecionar curso
                    <Icon name="arrow" size={17} />
                  </Link>
                  <ol
                    className="course-gate-steps"
                    aria-label="Etapas da consulta"
                  >
                    <li>
                      <span>1</span>Curso
                      <Icon name="right" size={12} />
                    </li>
                    <li>
                      <span>2</span>Turma
                      <Icon name="right" size={12} />
                    </li>
                    <li>
                      <span>3</span>Consulta
                    </li>
                  </ol>
                </div>
              </Card>
            ) : (
              <Routes>
                <Route path="/" element={<StartPage />} />
                <Route path="/horarios" element={<RefinedSchedule />} />
                <Route path="/aulas/:id" element={<RefinedLesson />} />
                <Route path="/salas" element={<RoomDirectory />} />
                <Route path="/professores" element={<ProfessorDirectory />} />
                <Route path="/disciplinas" element={<SubjectPage />} />
                <Route path="/calendario" element={<Calendar />} />
                <Route path="/avisos" element={<NoticePage />} />
                <Route path="/entrar" element={<AccessPage />} />
                <Route path="/admin" element={<Admin key={loc.search} />} />
                <Route
                  path="*"
                  element={
                    <Card>
                      <h1>Página não encontrada</h1>
                      <Link to="/">Voltar ao início</Link>
                    </Card>
                  }
                />
              </Routes>
            )}
          </main>
          <footer className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 text-[11px] text-muted lg:px-8">
            <span>HIFPB • Horários acadêmicos</span>
            <span>IFPB • Campus Monteiro</span>
          </footer>
        </div>
      </div>
    </DataContext.Provider>
  );
}
