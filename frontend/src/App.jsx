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
import Calendar from "./Calendar";
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
  const [navGroup,setNavGroup]=useState(()=>['/salas','/professores','/disciplinas'].includes(loc.pathname)?'academic':['/calendario','/avisos'].includes(loc.pathname)?'communication':null);
  const announcementShown=useRef(false);
  const publicPage=!loc.pathname.startsWith('/admin')&&loc.pathname!=='/entrar';
  const notices=(data?.notices||[]).filter(n=>n.status!=='draft').slice().sort((a,b)=>(b.updatedAt?._seconds||b.createdAt?._seconds||0)-(a.updatedAt?._seconds||a.createdAt?._seconds||0));
  useEffect(()=>{
    if(user===undefined||!publicPage||!notices.length||announcementShown.current)return;
    announcementShown.current=true;
    publicNotices(notices);
  },[data?.notices,user,publicPage]);
  useEffect(()=>{
    let active=true;
    const refresh=()=>api('/notices').then(notices=>{if(active)setData(prev=>prev?{...prev,notices}:prev);}).catch(()=>{});
    const timer=setInterval(refresh,30000);window.addEventListener('focus',refresh);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);};
  },[]);
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
    setFailure("");
    try {
      const keys = [
        "courses",
        "classes",
        "professors",
        "subjects",
        "rooms",
        "lessons",
        "notices",
        "calendars",
        "calendarEvents",
      ];
      const values = await Promise.all(keys.map((k) => api("/" + k)));
      setData(Object.fromEntries(keys.map((k, i) => [k, values[i]])));
    } catch (e) {
      setFailure(e.message);
    }
  }, []);
  useEffect(() => {
    load();
    return onAuthStateChanged(auth, setUser);
  }, [load]);
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
  return (
    <DataContext.Provider value={{ ...data, load, user }}>
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
        <aside
          ref={side}
          id="main-navigation"
          className={`hifpb-sidebar ${mobileOpen ? "fixed inset-y-0 left-0 z-50 flex w-sidebar overflow-y-auto shadow-float" : "sticky top-0 hidden overflow-visible md:flex"} h-dvh shrink-0 flex-col justify-between border-r border-line bg-panel px-4 py-4 transition-[width] duration-200 ${collapsed && !mobileOpen ? "md:w-sidebar-small" : "md:w-sidebar"}`}
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
            <Link to="/" className="flex flex-col items-center gap-1.5">
              <img
                src="/assets/69c80.png"
                alt="HIFPB — Consulta de horários e salas"
                className={
                  collapsed && !mobileOpen
                    ? "h-12 w-12 object-contain"
                    : "h-20 w-32 rounded-xl bg-white object-contain"
                }
              />
              <strong
                className={`${collapsed && !mobileOpen ? "text-xs" : "text-lg"} text-brand`}
              >
                HIFPB
              </strong>
              {(!collapsed || mobileOpen) && (
                <span className="text-center text-[11px] text-muted">
                  Campus Monteiro
                </span>
              )}
            </Link>
            <nav className="mt-4 flex flex-col gap-1" aria-label="Páginas da plataforma">
              {nav.filter(([path])=>['/','/horarios'].includes(path)).map(([path,label,icon])=><NavLink key={path} to={path} end={path==='/'} title={label} onClick={()=>setMobileOpen(false)} className={({isActive})=>`flex h-10 shrink-0 items-center gap-3 rounded-xl text-[13px] font-medium transition ${collapsed&&!mobileOpen?'justify-center':'px-3'} ${isActive||(path==='/horarios'&&loc.pathname.startsWith('/aulas'))?'bg-action text-white':'text-muted hover:bg-canvas'}`}><Icon name={icon}/>{(!collapsed||mobileOpen)&&<span>{label}</span>}</NavLink>)}
              {[
                ['academic','Acadêmico','graduation',['/disciplinas','/professores','/salas']],
                ['communication','Comunicados','bell',['/calendario','/avisos']],
              ].map(([key,label,icon,paths])=><div key={key} className="group/nav relative">
                <button title={collapsed&&!mobileOpen?label:undefined} aria-label={collapsed&&!mobileOpen?label:undefined} aria-expanded={navGroup===key} aria-controls={'nav-'+key} onClick={()=>{if(collapsed&&!mobileOpen)setNavGroup(navGroup===key?null:key);else setNavGroup(navGroup===key?null:key);}} className={`flex h-10 w-full items-center gap-3 rounded-xl text-[13px] font-medium transition hover:bg-canvas ${collapsed&&!mobileOpen?'justify-center px-0':'px-3'} ${paths.includes(loc.pathname)?'text-brand':'text-muted'}`}><Icon name={icon}/>{(!collapsed||mobileOpen)&&<><span>{label}</span><span className={`ml-auto transition-transform ${navGroup===key?'rotate-180':''}`}><Icon name="down" size={15}/></span></>}</button>
                {navGroup===key&&<div id={'nav-'+key} className={collapsed&&!mobileOpen?'absolute left-[calc(100%+12px)] top-0 z-[70] w-52 space-y-1 rounded-xl border border-line bg-panel p-2 shadow-float':'ml-5 mt-1 space-y-1 border-l border-line pl-3'}>{paths.map(path=>{const [,itemLabel,itemIcon]=nav.find(n=>n[0]===path);return <NavLink key={path} to={path} onClick={()=>setMobileOpen(false)} className={({isActive})=>`flex h-9 items-center gap-2.5 rounded-lg px-3 text-xs font-medium transition ${isActive?'bg-action text-white':'text-muted hover:bg-canvas'}`}><Icon name={itemIcon} size={16}/>{itemLabel}{path==='/avisos'&&notices.length>0&&<span aria-hidden="true" className="ml-auto rounded-full bg-action px-1.5 text-[10px] text-white">{notices.length}</span>}</NavLink>;})}</div>}
              </div>)}
            </nav>
          </div>
          <button onClick={()=>setCollapsed(v=>!v)} title={collapsed?'Expandir menu':'Recolher menu'} aria-label={collapsed?'Expandir menu':'Recolher menu'} aria-controls="main-navigation" aria-expanded={!collapsed} className="my-auto hidden size-8 shrink-0 self-center items-center justify-center rounded-lg border border-line bg-canvas text-muted transition hover:border-brand/30 hover:bg-brand/5 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:flex"><Icon name={collapsed?'right':'left'} size={17}/></button>
          <div className="mt-3 space-y-3">
            {(!collapsed || mobileOpen) ? (
              <div className="border-t border-line pt-3">
                <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
                  <div className="flex items-center gap-3 bg-canvas/70 px-3 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-action text-white shadow-sm"><Icon name="lock" size={19}/></span>
                    <div><p className="text-xs font-semibold text-ink">{user ? "Coordenação" : "Área do coordenador"}</p><p className="mt-1 text-[10px] text-muted">Gestão acadêmica</p></div>
                  </div>
                  <div className="space-y-2 p-3">
                    <Link to={user ? "/admin" : "/entrar"} className="group flex min-h-11 items-center justify-between gap-2 rounded-xl bg-action px-3.5 py-3 text-xs font-semibold text-white transition hover:bg-emerald-900 hover:shadow-md"><span>{user ? "Abrir painel" : "Entrar"}</span><span className="transition-transform group-hover:translate-x-0.5"><Icon name="open" size={16}/></span></Link>
                    {user && <button onClick={async()=>{await signOut(auth);navigate("/");}} className="flex min-h-9 w-full items-center justify-center gap-2 rounded-lg text-[11px] font-medium text-muted transition hover:bg-canvas hover:text-brand"><Icon name="logout" size={15}/>Sair da conta</button>}
                  </div>
                </div>
              </div>
            ) : <Link to={user ? "/admin" : "/entrar"} title={user ? "Abrir painel da coordenação" : "Entrar como coordenador"} aria-label={user ? "Abrir painel da coordenação" : "Entrar como coordenador"} className="mx-auto flex size-11 items-center justify-center rounded-xl border border-line bg-canvas text-brand transition hover:bg-action hover:text-white"><Icon name="lock"/></Link>}
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative z-20 flex min-h-[72px] items-center justify-between gap-3 border-b-[11px] border-muted bg-panel px-4 lg:px-8">
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
              <Search data={data} />
              <ThemeToggle />
              <button
                ref={bell}
                onClick={() => setNotifying((v) => !v)}
                aria-label="Notificações"
                aria-expanded={notifying}
                aria-controls="notifications"
                className="relative flex size-10 items-center justify-center rounded-control bg-canvas"
              >
                <Icon name="bell" />
                {notices.length>0&&<span data-testid="notice-count" aria-label={`${notices.length} avisos publicados`} className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full border-2 border-panel bg-action px-1 text-[10px] font-bold leading-4 text-white">{notices.length>99?'99+':notices.length}</span>}
              </button>
            </div>
            {notifying && (
              <div
                ref={pop}
                id="notifications"
                role="dialog"
                aria-label="Notificações"
                className="absolute right-4 top-16 z-30 max-h-[70vh] overflow-y-auto w-[min(360px,calc(100vw-32px))] space-y-4 rounded-card border border-line bg-panel p-5 shadow-float"
              >
                <h2>Notificações {notices.length>0&&<span className="ml-2 rounded-full bg-canvas px-2 py-1 text-xs text-brand">{notices.length}</span>}</h2>
                {failure ? (
                  <p>Não foi possível carregar os avisos.</p>
                ) : !data ? (
                  <Loading />
                ) : data.notices.length ? (
                  data.notices
                    .slice()
                    .sort(
                      (a, b) =>
                        (b.createdAt?._seconds || 0) -
                        (a.createdAt?._seconds || 0),
                    )
                    .slice(0, 3)
                    .map((n) => (
                      <div key={n.id}>
                        <strong>{n.title}</strong>
                        <p className="line-clamp-3 whitespace-pre-wrap break-words text-muted">{n.message}</p>
                        <small>{dateLabel(n.createdAt)}</small>
                      </div>
                    ))
                ) : (
                  <p className="text-muted">Não há nenhum aviso no momento.</p>
                )}
                <Button
                  secondary
                  className="w-full"
                  onClick={() => {
                    setNotifying(false);
                    bell.current?.focus();
                  }}
                >
                  Fechar notificações
                </Button>
              </div>
            )}
          </header>
          <main
            id="main"
            tabIndex={-1}
            className={`min-w-0 flex-1 p-4 outline-none sm:p-6 ${loc.pathname === "/horarios" ? "lg:px-4" : "lg:px-8"} ${loc.pathname === "/" ? "lg:py-5" : "lg:py-7"}`}
          >
            {failure ? (
              <ErrorState message={failure} retry={load} />
            ) : !data ? (
              <Loading />
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
                <Route path="/admin" element={<Admin />} />
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
