const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {importLocal}=require('../scripts/import-local');
const {assertNoConflicts}=require('../src/domain');

test('importação completa preserva cursos dos PDFs e separa conflitos para revisão',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'hifpb-import-'));
 const file=path.join(directory,'database.json');
 try {
  fs.writeFileSync(file,JSON.stringify({'notices/manual':{title:'Aviso preservado',managedBy:'coordinator'}}));
  const result=importLocal({file,quiet:true});
  const state=JSON.parse(fs.readFileSync(file,'utf8'));
  const rows=type=>Object.entries(state).filter(([key,value])=>key.startsWith(type+'/')&&!value.archived).map(([key,value])=>({id:key.split('/')[1],...value}));
  assert.deepEqual(rows('courses').map(c=>c.id).sort(),['ads','civil','im','informatica','tce','ted']);
  assert.equal(rows('classes').length,30);
  assert.equal(rows('subjects').length,234);
  assert.equal(rows('lessons').length+rows('drafts').length,427);
  assert.equal(result.counts.drafts,1);
  assert.equal(rows('courses').find(c=>c.id==='tce').level,'superior');
  assert.equal(state['notices/manual'].title,'Aviso preservado');
  const lessons=rows('lessons');
  for(const lesson of lessons) {
   assertNoConflicts(lesson,lessons,lesson.id);
   assert.ok(rows('classes').some(c=>c.id===lesson.classId));
   assert.ok(rows('subjects').some(s=>s.id===lesson.subjectId));
  }
  const before=fs.readFileSync(file,'utf8');
  importLocal({file,quiet:true});
  assert.equal(fs.readFileSync(file,'utf8'),before);
 } finally {
  for(const name of fs.readdirSync(directory))fs.unlinkSync(path.join(directory,name));
  fs.rmdirSync(directory);
 }
});
