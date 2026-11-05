import React from "react";
import Swal from "sweetalert2";
import {
  X,
  SlidersHorizontal,
  Info,
  Mail,
  LockKeyhole,
  Pencil,
  Trash2,
  Save,
  Upload,
  Sun,
  Moon,
  Menu,
  LogOut,
  Plus,
  Check,
  ArrowRight,
  ChevronDown,
  CalendarDays,
  DoorOpen,
  Users,
  BookOpen,
  Bell,
  Search,
  Clock,
  MapPin,
  GraduationCap,
  Navigation,
  ArrowLeft,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Rows3,
  ChevronLeft,
  ChevronRight,
  Printer,
  MoveUpRight,
} from "lucide-react";
import {
  FlaskConical,
  CodeXml,
  HardHat,
  Database,
  Languages,
  Calculator,
  Network,
  Monitor,
  Presentation,
  UserRound,
  House,
  ShieldCheck,
  FileClock,
  Send,
  CheckCircle2,
} from "lucide-react";
const modal = Swal.mixin({
  confirmButtonColor: "#064e3b",
  iconColor: "#064e3b",
  cancelButtonColor: "#64786c",
  customClass: {
    popup: "hifpb-modal",
    confirmButton: "hifpb-confirm",
    cancelButton: "hifpb-cancel",
  },
  returnFocus: true,
});
export function publicNotices(notices) {
  const content=document.createElement('div');
  content.className='space-y-4 text-left';
  for(const notice of notices){
    const article=document.createElement('article');
    const tone=notice.category==='cancelamento'?{border:'border-l-rose-600',badge:'bg-rose-100 text-rose-800',label:'Cancelamento'}:notice.category==='alteracao'?{border:'border-l-amber-500',badge:'bg-amber-100 text-amber-900',label:'Alteração'}:{border:'border-l-emerald-700',badge:'bg-emerald-100 text-emerald-900',label:'Informação'};
    article.className=`rounded-xl border border-line border-l-4 ${tone.border} bg-canvas p-5`;
    const date=document.createElement('p');date.className='mb-2 text-[11px] font-semibold text-muted';date.textContent='Coordenação • '+dateLabel(notice.createdAt);
    const category=document.createElement('span');category.className=`mb-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${tone.badge}`;category.textContent=tone.label;
    const title=document.createElement('h3');title.className='mb-3 text-lg font-semibold text-ink';title.textContent=notice.title;
    const message=document.createElement('p');message.className='whitespace-pre-wrap break-words text-sm leading-7 text-ink';message.textContent=notice.message;
    article.append(date,category,title,message);content.append(article);
  }
  return modal.fire({title:'Avisos da coordenação',html:content,width:800,icon:'info',confirmButtonText:'Entendi',showCloseButton:true,customClass:{popup:'hifpb-modal hifpb-public-notice',htmlContainer:'hifpb-notice-content',confirmButton:'hifpb-confirm'},allowOutsideClick:false});
}
export const alert = (message, title = "Informação") =>
  modal.fire({
    title,
    text: message,
    icon: "info",
    confirmButtonText: "Entendi",
  });
export const confirm = async (text) =>
  (
    await modal.fire({
      title: "Confirmar ação?",
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      focusCancel: true,
    })
  ).isConfirmed;
export const confirmClearFilters = async () =>
  (
    await modal.fire({
      title: "Limpar todos os filtros?",
      text: "Todos os filtros serão limpos. Os resultados ficarão ocultos até você fazer uma nova seleção.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Limpar filtros",
      cancelButtonText: "Cancelar",
      focusCancel: true,
    })
  ).isConfirmed;
export const success = (text) =>
  modal.fire({
    toast: true,
    position: "top-end",
    title: text,
    icon: "success",
    showConfirmButton: false,
    timer: 4500,
    timerProgressBar: true,
    showCloseButton: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
export const error = (e) =>
  modal.fire({
    title: "Não foi possível concluir",
    text: e.message || String(e),
    icon: "error",
    confirmButtonText: "Entendi",
  });
export async function chooseSubjectColor(currentColor) {
  const result = await modal.fire({
    title: "Cor da disciplina",
    text: "Escolha a nova cor. Ela será usada na lista e nos horários da disciplina.",
    input: "color",
    inputValue: /^#[0-9a-f]{6}$/i.test(currentColor) ? currentColor : "#064e3b",
    inputLabel: "Nova cor",
    inputAttributes: { "aria-label": "Selecionar cor da disciplina" },
    showCancelButton: true,
    confirmButtonText: "Usar esta cor",
    cancelButtonText: "Cancelar",
    focusCancel: true,
  });
  return result.isConfirmed ? result.value : null;
}
const icons = {
  close: "fe8cd.svg",
  filter: "6e7e6.svg",
  info: "484c6.svg",
  mail: "0e581.svg",
  arrowWhite: "55de6.svg",
  edit: "35c91.svg",
  trash: "967bd.svg",
  save: "484c6.svg",
  publish: "3cbe5.svg",
  home: "642cb.svg",
  schedule: "3ddcb.svg",
  rooms: "956e0.svg",
  professors: "dd1ef.svg",
  subjects: "0e581.svg",
  calendar: "b3398.svg",
  notices: "8219c.svg",
  bell: "00acc.svg",
  left: "fe8cd.svg",
  right: "63af9.svg",
  search: "9e27d.svg",
  arrow: "9fcfb.svg",
  reset: "830bd.svg",
  weekLeft: "9e3ea.svg",
  weekRight: "dade8.svg",
  week: "6ab7e.svg",
  list: "fa2d7.svg",
  pinSmall: "b85e8.svg",
  interval: "45c11.svg",
  check: "484c6.svg",
  back: "7f325.svg",
  clock: "7b4d8.svg",
  pinWhite: "b222e.svg",
  detailBook: "35c91.svg",
  user: "ca07d.svg",
  graduation: "ac6ec.svg",
  detailUsers: "c996a.svg",
  navigation: "5d946.svg",
  pinButton: "7a0d5.svg",
  lock: "ca07d.svg",
};
export function Icon({ name, active = false, size = 18 }) {
  const actions = {
    close: X,
    filter: SlidersHorizontal,
    info: Info,
    mail: Mail,
    lock: LockKeyhole,
    edit: Pencil,
    trash: Trash2,
    save: Save,
    publish: Upload,
    sun: Sun,
    moon: Moon,
    menu: Menu,
    logout: LogOut,
    plus: Plus,
    check: CheckCircle2,
    down: ChevronDown,
    arrowWhite: ArrowRight,
    lab: Monitor,
    classroom: Presentation,
    courseAds: CodeXml,
    courseCivil: HardHat,
    database: Database,
    language: Languages,
    math: Calculator,
    network: Network,
    computer: Monitor,
    home: House,
    schedule: CalendarDays,
    rooms: DoorOpen,
    professors: Users,
    subjects: BookOpen,
    calendar: CalendarDays,
    notices: Bell,
    bell: Bell,
    left: ChevronLeft,
    right: ChevronRight,
    search: Search,
    arrow: ArrowRight,
    reset: RotateCcw,
    weekLeft: ChevronLeft,
    weekRight: ChevronRight,
    week: CalendarDays,
    list: Rows3,
    pinSmall: MapPin,
    interval: Clock,
    back: ArrowLeft,
    clock: Clock,
    pinWhite: MapPin,
    detailBook: BookOpen,
    user: UserRound,
    graduation: GraduationCap,
    detailUsers: Users,
    navigation: Navigation,
    pinButton: MapPin,
    shield: ShieldCheck,
    draft: FileClock,
    send: Send,
    collapse: PanelLeftClose,
    expand: PanelLeftOpen,
    print: Printer,
    open: MoveUpRight,
  };
  const Action = actions[name] || BookOpen;
  return (
    <Action
      aria-hidden="true"
      size={size}
      strokeWidth={1.65}
      className="shrink-0"
    />
  );
}
export function RoomIcon({ room, ...props }) {
  return (
    <Icon
      name={
        room?.type?.toLocaleLowerCase("pt-BR").includes("lab")
          ? "lab"
          : "classroom"
      }
      {...props}
    />
  );
}
export function CourseIcon({ course, ...props }) {
  return (
    <Icon
      name={
        /civil/i.test(course?.code || course?.name || course || "")
          ? "courseCivil"
          : "courseAds"
      }
      {...props}
    />
  );
}
export function SubjectIcon({ subject, ...props }) {
  const value = `${subject?.name || ""} ${subject?.code || ""}`.toUpperCase();
  const name = /BANCO DE DADOS|B\.D|BD2/.test(value)
    ? "database"
    : /ING\.|PORT\./.test(value)
      ? "language"
      : /MAT|L\.A\.L\.G|M\.A\.C/.test(value)
        ? "math"
        : /I\.R\.C|REDE/.test(value)
          ? "network"
          : /PDS|P\.O\.O|ALP|A\.P\.S|T\.A\.P|PROGRAMA/.test(value)
            ? "courseAds"
            : "subjects";
  return <Icon name={name} {...props} />;
}
export function Button({
  children,
  secondary = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-control border px-4 py-2 text-[13px] font-semibold transition duration-150 active:scale-[.98] disabled:transform-none disabled:shadow-none ${secondary ? "border-line bg-panel text-brand hover:border-muted hover:bg-canvas" : "border-transparent bg-action text-white shadow-sm hover:bg-emerald-900 hover:shadow-md"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Card({ children, className = "", ...props }) {
  return (
    <section
      className={`rounded-card border border-line bg-panel p-5 shadow-card lg:p-6 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
export function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-action px-2.5 py-1 text-[10px] font-semibold leading-4 text-white">
      {children}
    </span>
  );
}
export function Title({ title, subtitle, badge = true }) {
  return (
    <div className="mb-5 space-y-2">
      {badge && <Badge>IFPB • Campus Monteiro</Badge>}
      <h1>{title}</h1>
      {subtitle && (
        <p className="max-w-4xl text-[13px] leading-relaxed text-muted">
          {subtitle}
        </p>
      )}
    </div>
  );
}
export function Empty({ children = "Nenhum registro encontrado." }) {
  return (
    <div
      role="status"
      className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-8 text-center"
    >
      <span className="mb-3 flex size-11 items-center justify-center rounded-full border border-line bg-panel">
        <Icon name="search" />
      </span>
      <p className="max-w-md text-[13px] leading-6 text-muted">{children}</p>
    </div>
  );
}
export function Loading() {
  return (
    <div
      role="status"
      aria-label="Carregando informações"
      className="space-y-5 motion-safe:animate-pulse"
    >
      <div className="h-7 w-48 rounded-lg bg-line/50" />
      <div className="h-4 w-2/3 rounded bg-line/35" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 rounded-card border border-line bg-panel"
          />
        ))}
      </div>
      <span className="sr-only">Carregando informações…</span>
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div
      role="alert"
      className="mx-auto mt-8 max-w-xl rounded-card border border-red-300/60 bg-panel p-6 shadow-card"
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-red-50 text-xl text-red-700">
        !
      </div>
      <h2 className="mb-2">Não foi possível carregar os dados</h2>
      <p className="mb-5 text-[13px] leading-6 text-muted">{message}</p>
      {retry && <Button onClick={retry}>Tentar novamente</Button>}
    </div>
  );
}
export function Select({ label, children, icon, ...props }) {
  const leading =
    icon ||
    {
      Curso: "courseAds",
      Período: "graduation",
      Professor: "user",
      Docente: "user",
      Disciplina: "subjects",
      "Sala ilustrativa": "classroom",
      Tipo: "classroom",
      Bloco: "rooms",
      Turno: "clock",
      "Dia da semana": "calendar",
      Turma: "detailUsers",
    }[label];
  return (
    <label>
      {label}
      <span className="relative">
        {leading && (
          <span className="pointer-events-none absolute left-3 top-3 text-muted">
            <Icon name={leading} size={16} />
          </span>
        )}
        <select
          aria-label={label}
          className={`appearance-none pr-9 ${leading ? "pl-9" : ""}`}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-3 text-muted">
          <Icon name="down" size={16} />
        </span>
      </span>
    </label>
  );
}
export const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
export const dateLabel = (v) =>
  v?.toDate
    ? v.toDate().toLocaleDateString("pt-BR")
    : v
      ? new Date(v._seconds * 1000 || v).toLocaleDateString("pt-BR")
      : "";
