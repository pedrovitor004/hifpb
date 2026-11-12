const fs=require('node:fs');
const path=require('node:path');
const {assertNoConflicts}=require('../src/domain');
const manifest=structuredClone(require('../data/academic-2026.json'));
const integratedCalendar=require('../data/calendar-integrados-2026.json');
// All courses and timetable pages supplied by the campus, without the presentation filter.
manifest.version+='-all-courses-v3-'+integratedCalendar.version;
const names={ted:'Edificações',im:'Instrumento Musical',tce:'Construção de Edifícios',informatica:'Informática'};
manifest.courses=manifest.courses.map(c=>({...c,name:names[c.id]||c.name,level:c.id==='tce'?'superior':c.level}));
const classIds=new Set(manifest.classes.map(c=>c.id)),subjectIds=new Set(manifest.subjects.map(s=>s.id));
manifest.lessons=manifest.lessons.map(l=>({...l,...(manifest.courses.find(c=>c.id===l.courseId)?.level==='superior'?{semester:'2026.2',validTo:'2026-12-14'}:{})}));
const teacherIds=new Set(manifest.lessons.flatMap(l=>l.professorIds||[l.professorId]));
manifest.professors=manifest.professors.filter(p=>teacherIds.has(p.id));
const file=path.resolve(process.env.HIFPB_DATA_FILE || path.join(__dirname,'../data/local/database.json'));
function importLocal({file:targetFile=file,quiet=false}={}){
 const file=targetFile;
 const state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
 if(state['_system/pdf-import']?.version===manifest.version)return state['_system/pdf-import'];
 if(fs.existsSync(file) && !fs.existsSync(file+'.before-full-import.json'))fs.copyFileSync(file,file+'.before-full-import.json');
 const stamp={_seconds:Math.floor(Date.now()/1000),_nanoseconds:0};
 const add=(type,row)=>{const {id,...value}=row;if(!state[type+'/'+id]||state[type+'/'+id].managedBy==='pdf-import')state[type+'/'+id]={...value,createdAt:state[type+'/'+id]?.createdAt||stamp,updatedAt:stamp,managedBy:'pdf-import',status:'published'};};
 const active={courses:new Set(manifest.courses.map(v=>v.id)),classes:classIds,subjects:subjectIds,professors:teacherIds,lessons:new Set(manifest.lessons.map(v=>v.id)),drafts:new Set()};
 for(const [key,value] of Object.entries(state)){const [type,id]=key.split('/');if(value.managedBy==='pdf-import'&&active[type]&&!active[type].has(id))value.archived=true;}
 for(const type of ['courses','classes','professors','subjects'])for(const row of manifest[type]){
  add(type,row);
 }
 const accepted=Object.entries(state).filter(([key,value])=>key.startsWith('lessons/')&&!value.archived&&value.managedBy!=='pdf-import').map(([key,value])=>({id:key.split('/')[1],...value})),issues=[];
 for(const raw of manifest.lessons){const row={...raw,classIds:raw.classIds||[raw.classId],subjectIds:raw.subjectIds||[raw.subjectId]};row.courseIds=[...new Set(row.classIds.map(id=>manifest.classes.find(c=>c.id===id).courseId))];if(row.courseId==='tce'){row.semester='2026.2';row.validTo='2026-12-14';}
  if(state['lessons/'+row.id]?.managedBy && state['lessons/'+row.id].managedBy!=='pdf-import')continue;
  try{assertNoConflicts(row,accepted,row.id);accepted.push(row);add('lessons',row);}catch(e){if(state['lessons/'+row.id]?.managedBy==='pdf-import')state['lessons/'+row.id].archived=true;const problem={...row,status:'draft',baseUpdatedAt:null,importIssue:e.message};add('drafts',problem);if(state['drafts/'+row.id].managedBy==='pdf-import')state['drafts/'+row.id].status='draft';issues.push({id:row.id,page:row.source.page,reason:problem.importIssue});}
 }
 add('calendars',{id:'calendar-2026-v2',title:'Calendário Acadêmico 2026 — Cursos Superiores',year:2026,version:'v.2',documentId:'calendario-academico-2026',scope:'superiores',validFrom:'2026-02-01',validTo:'2027-01-31',approvalDate:'2026-06-01'});
 const events=[['2026-03-02','Início do semestre 2026.1','aulas'],['2026-07-21','Término das aulas de 2026.1','aulas'],['2026-07-22','Provas finais de 2026.1','avaliacao','2026-07-24'],['2026-08-03','Início do semestre 2026.2','aulas'],['2026-10-28','Dia do Servidor Público','feriado'],['2026-11-02','Finados','feriado'],['2026-11-07','Sábado letivo','aulas'],['2026-11-15','Proclamação da República','feriado'],['2026-11-20','Dia Nacional de Zumbi e da Consciência Negra','feriado'],['2026-11-28','Sábado letivo','aulas'],['2026-12-05','Sábado letivo','aulas'],['2026-12-14','Término das aulas de 2026.2','aulas'],['2026-12-15','Provas finais de 2026.2','avaliacao','2026-12-18'],['2026-12-18','Prazo final para registros de notas e resultados finais','prazo'],['2026-12-21','Férias docentes','recesso','2026-12-31'],['2026-12-25','Natal','feriado'],['2027-01-01','Confraternização Universal','feriado'],['2027-01-02','Férias docentes','recesso','2027-01-29']];
 events.forEach(([startDate,title,category,endDate],i)=>add('calendarEvents',{id:'calendar-event-'+i,calendarId:'calendar-2026-v2',title,startDate,endDate:endDate||startDate,category}));
 add('calendars',integratedCalendar.calendar);
 integratedCalendar.events.forEach(([startDate,title,category,endDate,bimester],i)=>add('calendarEvents',{
  id:'integrados-2026-event-'+i,calendarId:integratedCalendar.calendar.id,title,startDate,endDate:endDate||startDate,category,...(bimester?{bimester}:{})
 }));
 for(const id of ['calendario-academico-2026','calendario-academico-integrados-2026','turmas-2026-10-27','professores-2026-10-27'])add('documents',{id,title:id,fileName:id+'.pdf'});
 state['_system/pdf-import']={version:manifest.version,importedAt:stamp,counts:{courses:manifest.courses.length,classes:manifest.classes.length,professors:manifest.professors.length,subjects:manifest.subjects.length,lessons:accepted.length,drafts:issues.length},issues};
 fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(state));fs.renameSync(file+'.tmp',file);
 if(!quiet)console.log('PDFs importados no banco local:',JSON.stringify(state['_system/pdf-import'].counts));
 return state['_system/pdf-import'];
}
if(require.main===module)importLocal();module.exports={importLocal};
