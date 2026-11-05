import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useData } from "./App";
import { resolve } from "./Schedule";
import {
  Button,
  Card,
  Title,
  Empty,
  Select,
  Icon,
  days,
  Badge,
  RoomIcon,
  CourseIcon,
  confirmClearFilters,
} from "./components";
function Reset({ onClick }) {
  return (
    <button
      onClick={async () => {
        if (await confirmClearFilters()) onClick();
      }}
      className="flex h-[42px] items-center justify-center gap-2 rounded-control px-3 text-xs font-semibold text-brand transition hover:bg-panel"
    >
      <Icon name="reset" />
      Limpar filtros
    </button>
  );
}
function SearchField({ label, value, onChange, placeholder }) {
  return (
    <label>
      {label}
      <span className="relative">
        <span className="pointer-events-none absolute left-3 top-3">
          <Icon name="search" />
        </span>
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="pl-9"
        />
      </span>
    </label>
  );
}
export function RoomDirectory() {
  const data = useData(),
    [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(""),
    [block, setBlock] = useState(""),
    [type, setType] = useState("");
  const cleared = params.get("cleared") === "1";
  const period = params.get("period") || "";
  const related = data.lessons.filter(
    (l) => !period || resolve(data, l).group?.period === Number(period),
  );
  const rooms = data.rooms.filter(
    (r) =>
      !cleared && (!period || related.some((l) => l.roomId === r.id)) &&
      `${r.name} ${r.block}`.toLowerCase().includes(search.toLowerCase()) &&
      (!block || r.block === block) &&
      (!type || r.type === type),
  );
  const selected =
    rooms.find((r) => r.id === params.get("roomId")) ||
    rooms.find((r) => r.id === "b-204") ||
    rooms[0];
  const linked = related
    .filter((l) => l.roomId === selected?.id)
    .sort(
      (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
    );
  return (
    <>
      <Title
        title="Salas do campus"
        subtitle="Encontre salas, laboratórios e os ambientes de aula do período."
      />
      <div className="mb-5 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <SearchField
          label="Buscar sala"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Digite o código ou nome da sala"
        />
        <Select
          label="Bloco"
          value={block}
          onChange={(e) => setBlock(e.target.value)}
        >
          <option value="">
            {cleared ? "Selecione o bloco" : "Todos os blocos"}
          </option>
          {[...new Set(data.rooms.map((r) => r.block))].map((b) => (
            <option key={b}>{b}</option>
          ))}
        </Select>
        <Select
          label="Período"
          value={period}
          onChange={(e) => setParams({ period: e.target.value })}
        >
          <option value="">{cleared ? "Selecione o período" : "Todos os períodos"}</option>
          {[1, 2, 3, 4, 5, 6].map((p) => (
            <option value={p} key={p}>
              {p}º período
            </option>
          ))}
        </Select>
        <Select
          label="Tipo"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">
            {cleared ? "Selecione o tipo" : "Todos os tipos"}
          </option>
          <option>Sala de aula</option>
          <option>Laboratório</option>
        </Select>
        <Reset
          onClick={() => {
            setSearch("");
            setBlock("");
            setType("");
            setParams({ cleared: "1" });
          }}
        />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="!p-5">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-base">
              {period ? `Salas do ${period}º período` : "Salas"}
            </h2>
            <span className="rounded-full border border-line bg-canvas px-2 text-[10px] text-muted">
              {rooms.length} locais
            </span>
          </div>
          {!data.rooms.length && data.user && <Link to="/admin?tab=rooms" className="mb-5 inline-flex items-center gap-2 rounded-control bg-action px-4 py-3 text-xs font-semibold text-white"><Icon name="plus"/>Cadastrar salas</Link>}
          {!rooms.length ? (
            <Empty>
              {cleared
                ? "Selecione um período para consultar as salas."
                : !data.rooms.length ? "As salas ainda não foram cadastradas. Os documentos de horários recebidos não informam os ambientes das aulas." : "Nenhuma sala corresponde aos filtros. Experimente outra busca."}
            </Empty>
          ) : (
            <div className="space-y-2">
              {rooms.map((r) => {
                const active = selected?.id === r.id;
                const codes = [
                  ...new Set(
                    related
                      .filter((l) => l.roomId === r.id)
                      .map((l) => resolve(data, l).subject?.code),
                  ),
                ];
                return (
                  <button
                    aria-pressed={active}
                    key={r.id}
                    onClick={() => setParams({ period, roomId: r.id })}
                    className={`group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${active ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40" : "border-line hover:border-muted/60 hover:bg-surface"}`}
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${active ? "bg-action text-white" : "bg-canvas"}`}
                    >
                      <RoomIcon room={r} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="text-[14px]">{r.name}</strong>
                      <span className="ml-2 inline-block text-[11px] text-muted">
                        {r.block} • {r.type}
                      </span>
                      <span className="mt-1.5 block truncate text-xs text-muted">
                        {codes.join(" • ")}
                      </span>
                    </span>
                    <span className="hidden sm:block">
                      {active ? (
                        <Badge>Selecionada</Badge>
                      ) : (
                        <Icon name="right" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
        {selected && (
          <Card className="!p-5 lg:sticky lg:top-5">
            <h2 className="mb-3 flex items-center gap-2 text-base">
              <RoomIcon room={selected} />
              Localização da sala
            </h2>
            <div className="rounded-xl bg-action p-5 text-white shadow-sm">
              <small className="text-[11px] text-emerald-100/80">
                IFPB • Campus Monteiro
              </small>
              <h1 className="my-3 text-[40px]">{selected.name}</h1>
              <p className="text-xs text-emerald-100/80">
                {selected.block} • {selected.type}
              </p>
            </div>
            <p className="my-4 text-[12px] leading-5 text-muted">
              {selected.location}
            </p>
            <h3 className="mb-2 text-[13px]">Aulas neste ambiente</h3>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {linked.map((l) => (
                <Link
                  to={`/aulas/${l.id}?period=${period}`}
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface p-3 transition hover:border-muted"
                >
                  <span>
                    <strong className="block text-xs">
                      {resolve(data, l).subject?.code} • {days[l.weekday - 1]}
                    </strong>
                    <small className="mt-1 block text-muted">
                      {resolve(data, l).professor?.name}
                    </small>
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-brand">
                    {l.startTime}–{l.endTime}
                  </span>
                </Link>
              ))}
            </div>
            {linked[0] && (
              <Link
                to={`/aulas/${linked[0].id}?period=${period}`}
                className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-control bg-action px-4 py-3 text-xs font-semibold text-white transition hover:bg-emerald-900"
              >
                <Icon name="arrowWhite" />
                Ver aula completa
              </Link>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
export function ProfessorDirectory(){
 const data=useData(),[params,setParams]=useSearchParams();
 const cleared=params.get('cleared')==='1',period=params.get('period')||(cleared?'':'4'),selectedId=params.get('professorId')||'gildo';
 const [search,setSearch]=useState(''),[subject,setSubject]=useState('');
 const hasTeacher=(l,id)=>(l.professorIds||[l.professorId]).includes(id);
 const allLessons=cleared?[]:data.lessons.filter(l=>!period||data.classes.some(c=>(l.classIds||[l.classId]).includes(c.id)&&c.period===Number(period)));
 const lessons=allLessons.filter(l=>!subject||(l.subjectIds||[l.subjectId]).includes(subject));
 const professors=data.professors.filter(p=>lessons.some(l=>hasTeacher(l,p.id))&&[p.name,...lessons.filter(l=>hasTeacher(l,p.id)).map(l=>resolve(data,l).subject?.code)].join(' ').toLowerCase().includes(search.toLowerCase()));
 const selected=professors.find(p=>p.id===selectedId)||professors[0],selectedLessons=lessons.filter(l=>hasTeacher(l,selected?.id)).sort((a,b)=>a.weekday-b.weekday||a.startTime.localeCompare(b.startTime));
 return <>
 <Title title="Professores" subtitle="Consulte os docentes e as disciplinas do período selecionado."/>
 <div className="mb-5 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
 <SearchField label="Buscar professor ou disciplina" value={search} onChange={e=>{setSearch(e.target.value);if(cleared)setParams({period:'4'});}} placeholder="Nome ou disciplina"/>
 <Select label="Período" value={period} onChange={e=>{setParams({period:e.target.value});setSubject('');}}><option value="">{cleared?'Selecione o período':'Todos os períodos'}</option>{[1,2,3,4,5,6].map(p=><option key={p} value={p}>{p}º período</option>)}</Select>
 <Select label="Disciplina" value={subject} onChange={e=>setSubject(e.target.value)}><option value="">Todas as disciplinas</option>{data.subjects.filter(s=>allLessons.some(l=>(l.subjectIds||[l.subjectId]).includes(s.id))).map(s=><option key={s.id} value={s.id}>{s.code}</option>)}</Select>
 <Reset onClick={()=>{setParams({cleared:'1'});setSearch('');setSubject('');}}/>
 </div>
 <div className="grid items-start gap-5 lg:grid-cols-[1.7fr_1fr]">
 <Card className="!p-0 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5"><h2 className="flex items-center gap-2 text-base"><CourseIcon course="ads"/>Docentes da turma</h2><span className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[10px] text-muted">{period?`ADS ${period}N • Noturno`:'ADS • Todos os períodos'}</span></div><div className="mt-5 flex justify-between px-5 pb-3 text-[10px] font-medium uppercase tracking-wider text-muted"><span>Professor / disciplina</span><span>Aulas na semana</span></div>
 {professors.length?professors.map(p=><button key={p.id} aria-pressed={selected?.id===p.id} onClick={()=>setParams({period,professorId:p.id})} className={`flex w-full items-center gap-3 border-y border-transparent border-b-line px-5 py-4 text-left transition ${selected?.id===p.id?'border-l-[3px] border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/40':'hover:bg-canvas'}`}><span className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${selected?.id===p.id?'bg-action text-white':'bg-canvas text-brand'}`}>{p.name[0]}</span><span className="min-w-0 flex-1"><strong className="text-[13px]">{p.name}</strong><small className="mt-1 block truncate text-[11px] text-muted">{[...new Set(lessons.filter(l=>hasTeacher(l,p.id)).map(l=>resolve(data,l).subject?.code))].join(' • ')}</small></span><span className="text-right text-[11px] font-medium text-muted">{[...new Set(lessons.filter(l=>hasTeacher(l,p.id)).map(l=>days[l.weekday-1].slice(0,3)))].join(' • ')}</span><Icon name="right" size={16}/></button>):<Empty>Nenhum professor corresponde aos filtros selecionados.</Empty>}
 <p className="border-t border-line bg-surface px-5 py-3 text-[10px] text-muted">Análise e Desenvolvimento de Sistemas {period?`• ${period}º período`:''} • Noturno</p>
 </Card>
 {selected&&<Card className="!p-5 lg:sticky lg:top-5"><div className="mb-4 flex items-center gap-4 border-b border-line pb-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-action text-sm font-bold text-white">{selected.name[0]}</span><div><h2 className="text-base">{selected.name}</h2><p className="mt-1 text-[11px] text-muted">Docente • ADS {period?period+'N':''}</p></div></div><h3 className="text-[13px]">Agenda do período consultado</h3><p className="mb-4 mt-1 text-[11px] text-muted">Aulas recorrentes • Turno noturno</p><div className="space-y-3">{selectedLessons.map(l=>{const {subject,room,group}=resolve(data,l);return <Link key={l.id} to={`/aulas/${l.id}?courseId=ads&period=${group?.period}`} className="group block rounded-xl border border-line bg-canvas p-4 transition hover:border-muted hover:shadow-card"><p className="text-[11px] text-muted">{days[l.weekday-1]} • {subject?.code}</p><strong className="my-2 block text-xl tabular-nums text-brand">{l.startTime}–{l.endTime}</strong><span className="flex items-center gap-1.5 text-[11px] font-medium text-brand"><RoomIcon room={room} size={16}/>{room?.name||'Sala não informada'}<span className="ml-auto transition-transform group-hover:translate-x-0.5"><Icon name="open" size={14}/></span></span></Link>;})}</div></Card>}
 </div>
 </>;
}
