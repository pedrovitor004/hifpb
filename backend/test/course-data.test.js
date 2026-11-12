const {test}=require('node:test');
const assert=require('node:assert/strict');

test('cada curso recebe somente suas disciplinas, turmas, docentes, busca e calendário',async()=>{
 const {courseData}=await import('../../frontend/src/courseData.js');
 const manifest=require('../data/academic-2026.json');
 const all={...manifest,rooms:[{id:'a'},{id:'b'}],notices:manifest.courses.map(c=>({id:c.id,courseId:c.id})),calendars:[{id:'sup',scope:'superiores'},{id:'int',scope:'integrados'}],calendarEvents:[{id:'s',calendarId:'sup'},{id:'i',calendarId:'int'}]};
 const before=JSON.stringify(all);
 for(const course of all.courses){
  const scoped=courseData(all,course.id);
  assert.ok(scoped.classes.length);
  assert.ok(scoped.subjects.length);
  assert.ok(scoped.lessons.length);
  assert.ok(scoped.classes.every(c=>c.courseId===course.id));
  assert.ok(scoped.subjects.every(s=>s.courseId===course.id));
  assert.ok(scoped.lessons.every(l=>l.courseId===course.id&&scoped.classes.some(c=>c.id===l.classId)&&scoped.subjects.some(s=>s.id===l.subjectId)));
  assert.ok(scoped.professors.every(p=>scoped.lessons.some(l=>l.professorId===p.id||l.professorIds?.includes(p.id))));
  assert.ok(scoped.rooms.every(r=>scoped.lessons.some(l=>l.roomId===r.id)));
  assert.deepEqual(scoped.notices.map(n=>n.courseId),[course.id]);
  assert.ok(scoped.calendarEvents.every(e=>scoped.calendars.some(c=>c.id===e.calendarId)));
 }
 assert.equal(JSON.stringify(all),before);
 assert.equal(courseData(all,'').subjects.length,0);
});

test('aula compartilhada apresenta turma e disciplina do curso escolhido',async()=>{
 const {courseData}=await import('../../frontend/src/courseData.js');
 const data={courses:[{id:'a'},{id:'b'}],classes:[{id:'ca',courseId:'a'},{id:'cb',courseId:'b'}],subjects:[{id:'sa',courseId:'a'},{id:'sb',courseId:'b'}],lessons:[{id:'joint',courseId:'a',classId:'ca',classIds:['ca','cb'],subjectId:'sa',subjectIds:['sa','sb'],professorId:'p',roomId:'r'}],professors:[{id:'p'}],rooms:[{id:'r'}],notices:[]};
 const scoped=courseData(data,'b');
 assert.equal(scoped.lessons[0].classId,'cb');
 assert.equal(scoped.lessons[0].subjectId,'sb');
 assert.deepEqual(scoped.lessons[0].classIds,['cb']);
 assert.deepEqual(scoped.lessons[0].subjectIds,['sb']);
 assert.equal(data.lessons[0].subjectId,'sa');
});
