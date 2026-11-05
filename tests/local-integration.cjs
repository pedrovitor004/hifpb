const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const {setTimeout:delay}=require('node:timers/promises');
const base='http://127.0.0.1:3098/api';
let child,cookie='';
function start(){child=spawn(process.execPath,['src/main.js'],{cwd:path.resolve(__dirname,'../backend'),env:{...process.env,DATA_MODE:'local',PORT:'3098'},stdio:'ignore'});}
async function ready(){for(let i=0;i<60;i++){try{const r=await fetch(base+'/courses');if(r.ok)return;}catch{}await delay(250);}throw new Error('API local não iniciou.');}
async function req(route,method='GET',body,withAuth=true){return fetch(base+route,{method,headers:{'Content-Type':'application/json',...(withAuth&&cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});}
async function stop(){if(!child)return;child.kill();await Promise.race([new Promise(r=>child.once('exit',r)),delay(3000)]);}
const ids=[];
(async()=>{
 start();await ready();
 const courses=await (await req('/courses')).json();assert.deepEqual(courses.map(c=>c.id),['ads']);
 const classes=await (await req('/classes')).json();assert.deepEqual(classes.map(c=>c.period).sort(),[1,2,3,4,5,6]);
 const lessons=await (await req('/lessons')).json();assert(lessons.length>50);
 assert.equal((await req('/notices','POST',{title:'x',message:'x',courseId:'ads'},false)).status,401);
 assert.equal((await req('/auth/login','POST',{email:'root',password:'invalid'},false)).status,401);
 const login=await req('/auth/login','POST',{email:'root',password:'0123456789'},false);assert.equal(login.status,201);cookie=login.headers.get('set-cookie').split(';')[0];assert.equal((await req('/auth/me')).status,200);
 const notice=await req('/notices','POST',{title:'Verificação local',message:'Persistência e edição verificadas.',category:'informacao',courseId:'ads'});assert.equal(notice.status,201);const noticeId=(await notice.json()).id;ids.push(['notices',noticeId]);
 assert.equal((await req('/notices/'+noticeId,'PUT',{title:'Verificação editada',message:'Atualizado.',category:'informacao',courseId:'ads'})).status,200);
 const sample=lessons.find(l=>l.courseId==='ads');const value={courseId:'ads',classId:sample.classId,subjectId:sample.subjectId,professorId:sample.professorId,roomId:null,weekday:1,startTime:'23:00',endTime:'23:30',validFrom:'2026-11-02',validTo:'2026-12-14',semester:'2026.2',description:''};
 const responses=await Promise.all([req('/lessons','POST',value),req('/lessons','POST',value)]);assert.deepEqual(responses.map(r=>r.status).sort(),[201,409]);for(const r of responses)if(r.status===201)ids.push(['lessons',(await r.json()).id]);
 const draft=await req('/drafts','POST',{...value,startTime:'23:35',endTime:'23:55'});assert.equal(draft.status,201);const draftId=(await draft.json()).id;ids.push(['drafts',draftId]);assert(!(await (await req('/lessons')).json()).some(l=>l.id===draftId));
 await stop();start();await ready();assert.equal((await (await req('/notices/'+noticeId)).json()).title,'Verificação editada');
 const again=await req('/auth/login','POST',{email:'root',password:'0123456789'},false);cookie=again.headers.get('set-cookie').split(';')[0];
 for(const [type,id] of ids)assert.equal((await req('/'+type+'/'+id,'DELETE')).status,200);
 await req('/auth/session','DELETE');assert.equal((await req('/auth/me')).status,401);
 console.log('OK: ADS 1–6, login/logout, autorização, CRUD persistente após reiniciar, concorrência e rascunhos privados.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(stop);
