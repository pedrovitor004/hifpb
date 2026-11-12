const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parse}=require('../src/domain');
const {references,assertCatalogIntegrity}=require('../src/rules');
const lesson={id:'lesson',courseId:'a',courseIds:['a','b'],classId:'ca',classIds:['ca','cb'],weekday:1,startTime:'18:00',endTime:'19:00',validFrom:'2027-01-01',validTo:'2027-12-31'};
const all={courses:[{id:'a'},{id:'b'},{id:'c'}],classes:[{id:'ca',courseId:'a'},{id:'cb',courseId:'b'}],lessons:[lesson],notices:[]};
const base={title:'Comunicado',message:'Confira o comunicado.'};
test('avisos gerais e específicos têm destinatários explícitos e consistentes',()=>{
 const global=parse('notices',{...base,audience:'all',courseId:null});
 references('notices',global,all);assert.deepEqual(global.courseIds,[]);
 const specific=parse('notices',{...base,courseId:'a'});
 references('notices',specific,all);assert.deepEqual(specific.courseIds,['a']);
 assert.throws(()=>parse('notices',base));
 assert.throws(()=>parse('notices',{...base,audience:'all',courseId:'a'}));
 assert.throws(()=>parse('notices',{...base,audience:'all',category:'cancelamento',lessonId:'lesson',occurrenceDate:'2027-01-04'}));
});
test('aviso de aula valida curso, data, dia da semana, vigência e aula existente',()=>{
 const input={...base,courseId:'a',category:'cancelamento',lessonId:'lesson',occurrenceDate:'2027-01-04'};
 const valid=parse('notices',input);references('notices',valid,all);
 assert.deepEqual(valid.courseIds,['a','b']);
 for(const changes of [{courseId:'c'},{lessonId:'missing'},{occurrenceDate:'2027-01-05'},{occurrenceDate:'2028-01-03'}])assert.throws(()=>references('notices',parse('notices',{...input,...changes}),all));
 assert.throws(()=>parse('notices',{...input,category:'informacao'}));
 assert.throws(()=>parse('notices',{...input,occurrenceDate:null}));
 assert.throws(()=>parse('notices',{...input,lessonId:null}));
});
test('uma ocorrência tem um comunicado operacional; alterações não invalidam vínculos',()=>{
 const notice={...base,id:'notice',courseId:'a',category:'cancelamento',lessonId:'lesson',occurrenceDate:'2027-01-04'};
 const state={...all,notices:[notice]};
 assert.throws(()=>assertCatalogIntegrity('notices',notice,'new',null,state),/Já existe/);
 assert.doesNotThrow(()=>assertCatalogIntegrity('notices',notice,'notice',notice,state));
 assert.throws(()=>assertCatalogIntegrity('lessons',{...lesson,weekday:2},'lesson',lesson,state),/avisos vinculados/);
 assert.throws(()=>assertCatalogIntegrity('lessons',{...lesson,validFrom:'2027-02-01'},'lesson',lesson,state),/avisos vinculados/);
 assert.doesNotThrow(()=>assertCatalogIntegrity('lessons',{...lesson,startTime:'19:00',endTime:'20:00'},'lesson',lesson,state));
});
test('consulta inclui os avisos gerais e o indicativo corresponde somente à ocorrência vinculada',async()=>{
 const {courseData}=await import('../../frontend/src/courseData.js');
 const {lessonNotice}=await import('../../frontend/src/lessonNotices.js');
 const notices=[{id:'all',audience:'all',category:'informacao'},{id:'one',courseId:'a',category:'informacao'},{id:'linked',courseId:'a',courseIds:['a','b'],category:'cancelamento',lessonId:'lesson',occurrenceDate:'2027-01-04'}];
 const data={...all,subjects:[],professors:[],rooms:[],notices};
 assert.deepEqual(courseData(data,'a').notices.map(n=>n.id),['all','one','linked']);
 assert.deepEqual(courseData(data,'b').notices.map(n=>n.id),['all','linked']);
 assert.deepEqual(courseData(data,'c').notices.map(n=>n.id),['all']);
 assert.equal(courseData(data,'').notices.length,0);
 assert.equal(lessonNotice(notices,'lesson','2027-01-04')?.id,'linked');
 assert.equal(lessonNotice(notices,'other','2027-01-04'),null);
 assert.equal(lessonNotice(notices,'lesson','2027-01-11'),null);
});
