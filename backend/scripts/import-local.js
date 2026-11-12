const fs=require('node:fs');
const path=require('node:path');
const {assertNoConflicts}=require('../src/domain');
const manifest=require('../data/academic-2026.json');
const integratedCalendar=require('../data/calendar-integrados-2026.json');
const subjectColors=require('../data/subject-colors.json');
// Presentation scope: ADS only, preserving the complete source manifest and PDFs.
manifest.version+='-ads-v1-'+integratedCalendar.version+'-colors-v1';
manifest.courses=manifest.courses.filter(c=>c.id==='ads');
manifest.classes=manifest.classes.filter(c=>c.courseId==='ads');
manifest.subjects=manifest.subjects.filter(s=>s.courseId==='ads');
manifest.subjects=manifest.subjects.map(s=>({...s,color:subjectColors[s.id]||s.color}));
const classIds=new Set(manifest.classes.map(c=>c.id)),subjectIds=new Set(manifest.subjects.map(s=>s.id));
manifest.lessons=manifest.lessons.filter(l=>(l.classIds||[l.classId]).some(id=>classIds.has(id))).map(l=>{
 const groups=(l.classIds||[l.classId]).filter(id=>classIds.has(id)),subjects=(l.subjectIds||[l.subjectId]).filter(id=>subjectIds.has(id));
 return {...l,courseId:'ads',classId:groups[0],classIds:groups,subjectId:subjects[0],subjectIds:subjects,semester:'2026.2',validTo:'2026-12-14',source:{...l.source,page:manifest.classes.find(c=>c.id===groups[0]).sourcePage}};
});
const teacherIds=new Set(manifest.lessons.flatMap(l=>l.professorIds||[l.professorId]));
manifest.professors=manifest.professors.filter(p=>teacherIds.has(p.id));
const file=path.resolve(__dirname,'../data/local/database.json');
function importLocal(){
 const state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
 if(state['_system/pdf-import']?.version===manifest.version)return;
 const stamp={_seconds:Math.floor(Date.now()/1000),_nanoseconds:0};
 const add=(type,row)=>{const {id,...value}=row;if(!state[type+'/'+id]||state[type+'/'+id].managedBy==='pdf-import')state[type+'/'+id]={...value,createdAt:state[type+'/'+id]?.createdAt||stamp,updatedAt:stamp,managedBy:'pdf-import',status:'published'};};
 const active={courses:new Set(manifest.courses.map(v=>v.id)),classes:classIds,subjects:subjectIds,professors:teacherIds,lessons:new Set(manifest.lessons.map(v=>v.id)),drafts:new Set()};
 for(const [key,value] of Object.entries(state)){const [type,id]=key.split('/');if(value.managedBy==='pdf-import'&&active[type]&&!active[type].has(id))value.archived=true;}
 for(const type of ['courses','classes','professors','subjects'])for(const row of manifest[type]){
  if(type==='courses'&&row.id==='tce')Object.assign(row,{name:'Tecnologia em Construção de Edifícios',level:'superior'});
  if(type==='courses'&&row.id==='ted')row.name='Edificações — integrado';
  if(type==='courses'&&row.id==='im')row.name='Instrumento Musical — integrado';
  add(type,row);
 }
 const accepted=[],issues=[];
 for(const raw of manifest.lessons){const row={...raw,classIds:raw.classIds||[raw.classId],subjectIds:raw.subjectIds||[raw.subjectId]};row.courseIds=[...new Set(row.classIds.map(id=>manifest.classes.find(c=>c.id===id).courseId))];if(row.courseId==='tce'){row.semester='2026.2';row.validTo='2026-12-14';}
  try{assertNoConflicts(row,accepted);accepted.push(row);add('lessons',row);}catch{const problem={...row,status:'draft',baseUpdatedAt:null,importIssue:'Conflito entre informações dos documentos; confira antes de publicar.'};add('drafts',problem);state['drafts/'+row.id].status='draft';issues.push({id:row.id,page:row.source.page,reason:problem.importIssue});}
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
 console.log('PDFs importados no banco local:',JSON.stringify(state['_system/pdf-import'].counts));
}
if(require.main===module)importLocal();module.exports={importLocal};
