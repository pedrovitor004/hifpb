import React,{useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {useData} from './App';
import {Icon,Button,Title,Empty,Select,days,confirmClearFilters,RoomIcon} from './components';
import ScheduleList from './ScheduleList';
export function resolve(data,l,courseId){
 const group=data.classes.find(c=>(l.classIds||[l.classId]).includes(c.id)&&(!courseId||c.courseId===courseId))||data.classes.find(c=>c.id===l.classId);
 const subject=data.subjects.find(s=>(l.subjectIds||[l.subjectId]).includes(s.id)&&s.courseId===group?.courseId)||data.subjects.find(s=>s.id===l.subjectId);
 const teachers=data.professors.filter(p=>(l.professorIds||[l.professorId]).includes(p.id));
 return {subject,professor:{name:teachers.map(p=>p.name).join(' / ')||'Professor a definir'},room:data.rooms.find(r=>r.id===l.roomId),group};
}
export default function Schedule(){
 const data=useData(),[searchParams,setParams]=useSearchParams(),[list,setList]=useState(false);
 const params=new URLSearchParams(searchParams);
 params.delete('week');
 const cleared=params.get('cleared')==='1',courseId=params.get('courseId')||(cleared?'':'ads');
 const groups=data.classes.filter(c=>c.courseId===courseId),periods=[...new Set(groups.map(c=>c.period))].sort((a,b)=>a-b);
 const period=params.get('period')??(cleared?'':String(periods.includes(1)?1:periods[0]??''));
 const available=groups.filter(c=>c.period===Number(period));
 const classId=params.get('classId')||(cleared?'':available[0]?.id||'');
 const group=available.find(c=>c.id===classId),professorId=params.get('professorId')||'',turn=params.get('turn')||(cleared?'':'all');
 const ready=Boolean(courseId&&period!==''&&group&&turn);
 // A grade acompanha automaticamente a semana atual do campus.
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const start=new Date(today+'T00:00:00Z');
 start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));
 const dates=Array.from({length:5},(_,i)=>new Date(start.getTime()+i*86400000)),iso=d=>d.toISOString().slice(0,10);
 const lessons=ready?data.lessons.filter(l=>(l.classIds||[l.classId]).includes(classId)&&(!professorId||(l.professorIds||[l.professorId]).includes(professorId))&&(turn==='all'||(turn==='night'?l.startTime>='18:00':turn==='morning'?l.startTime<'12:30':l.startTime>='12:30'&&l.startTime<'18:30'))&&l.validFrom<=iso(dates[l.weekday-1])&&(!l.validTo||l.validTo>=iso(dates[l.weekday-1]))):[];
 const times=[...new Set(lessons.map(l=>l.startTime))].sort();
 function set(key,value){const next=new URLSearchParams(params);next.set(key,value);if(key==='courseId'){const first=data.classes.find(c=>c.courseId===value);next.set('period',String(first?.period??''));next.set('classId',first?.id||'');next.set('turn','all');next.delete('professorId');next.delete('cleared');}if(key==='period'){next.set('classId',groups.find(c=>c.period===Number(value))?.id||'');}if(next.get('courseId')&&next.get('period')&&next.get('classId')&&next.get('turn'))next.delete('cleared');setParams(next);}
 return <div className="schedule-print-root">
 <Title badge={false} title="Consulta de horários" subtitle="Encontre sua turma e consulte a programação semanal."/>
 <div className="no-print mb-5 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-6">
 <Select label="Curso" value={courseId} onChange={e=>set('courseId',e.target.value)}><option value="">Selecione o curso</option>{data.courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select>
 <Select label="Período" value={period} onChange={e=>set('period',e.target.value)}><option value="">Selecione</option>{periods.map(p=><option key={p} value={p}>{p===0?'Optativas':`${p}º ${data.courses.find(c=>c.id===courseId)?.level==='integrado'?'ano':'período'}`}</option>)}</Select>
 <Select label="Turma" value={classId} onChange={e=>set('classId',e.target.value)}><option value="">Selecione</option>{available.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select>
 <Select label="Turno" value={turn} onChange={e=>set('turn',e.target.value)}><option value="">Selecione</option><option value="all">Todos os turnos</option><option value="morning">Manhã</option><option value="afternoon">Tarde</option><option value="night">Noite</option></Select>
 <Select label="Professor" value={professorId} onChange={e=>set('professorId',e.target.value)}><option value="">Todos os professores</option>{data.professors.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select>
 <Button secondary onClick={async()=>{if(await confirmClearFilters()){setParams({cleared:'1'});setList(false);}}}><Icon name="reset"/>Limpar filtros</Button>
 </div>
 {ready&&<div className="no-print mb-4 flex flex-wrap items-center justify-end gap-3"><div className="flex items-center gap-2"><div className="inline-flex rounded-control bg-canvas p-1" aria-label="Visualização da grade">{[[false,"Semana","week"],[true,"Lista","list"]].map(([value,label,icon])=><button key={label} aria-pressed={list===value} onClick={()=>setList(value)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition ${list===value?"bg-panel font-semibold text-brand shadow-sm ring-1 ring-line":"text-muted hover:text-brand"}`}><Icon name={icon}/>{label}</button>)}</div>{list&&<Button secondary onClick={()=>window.print()}><Icon name="print"/>Imprimir</Button>}</div></div>}
 {!ready?<Empty>Selecione curso, período, turma e turno para consultar os horários.</Empty>:!lessons.length?<Empty>Não há aulas vigentes para os filtros selecionados.</Empty>:list?<ScheduleList lessons={lessons} data={data} params={params}/>:<div className="overflow-hidden rounded-card border border-line bg-panel shadow-card"><div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Grade semanal com rolagem horizontal"><table className="w-full min-w-[880px] table-fixed border-collapse"><thead><tr><th className="w-20 border-b border-r border-line bg-surface p-3 text-xs">Horário</th>{days.map(day=><th key={day} className="border-b border-r border-line px-2 py-4 text-xs">{day}</th>)}</tr></thead><tbody>{times.map(t=><React.Fragment key={t}>{t==="20:30"&&<tr><td colSpan={6} className="bg-action py-1.5"><span className="flex items-center justify-center gap-2 text-[10px] font-medium text-white"><Icon name="interval" size={14}/>20:10–20:30 • Intervalo</span></td></tr>}<tr><th className="border-b border-r border-line bg-surface px-3 py-4 align-top text-xs tabular-nums">{t}</th>{days.map((day,j)=><td key={day} className="border-b border-r border-line p-1.5 align-top"><div className="space-y-2">{lessons.filter(l=>l.weekday===j+1&&l.startTime===t).map(l=>{const {subject,professor,room}=resolve(data,l,courseId);return <Link key={l.id} to={`/aulas/${l.id}?${params}`} style={{'--lesson-color':subject?.color||'#dcfce7'}} className="group flex min-h-[170px] xl:min-h-[190px] flex-col rounded-control border border-black/5 bg-[var(--lesson-color)] p-3.5 text-[#16382c] transition hover:-translate-y-0.5 hover:shadow-md dark:bg-[color-mix(in_srgb,var(--lesson-color)_20%,var(--color-panel))] dark:text-ink"><strong className="text-sm">{subject?.code}</strong><span className="mt-1 text-xs tabular-nums">{l.startTime}–{l.endTime}</span><span className="mt-2 text-xs">{professor.name}</span><span className="mt-2 flex items-center gap-1.5 text-xs"><RoomIcon room={room} size={15}/>{room?.name||'Sala não informada'}</span><span className="mt-auto flex items-center gap-2 pt-3 text-[10px] font-semibold">Ver detalhes<Icon name="open" size={14}/></span></Link>;})}</div></td>)}</tr></React.Fragment>)}</tbody></table></div></div>}
 <p className="no-print mt-4 text-xs leading-5 text-muted">Grade semanal recorrente • Horários locais. Consulte os documentos originais no calendário acadêmico.</p>
 </div>;
}
