const {db,timestamp}=require('../src/firebase');
// Source: Figma HIFPB, frames 40:2621, 40:2852 and 11:6012.
// These records reproduce a prototype, not an official academic schedule.
const professors=['Leilson','Kamilla','Paulo','Julio','Rafael','Leo','Alberto','Maria','Clayton','Danielly','Yure','Gildo','Márcia','Docente a confirmar'];
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
const periods={
  1:[['L.A.L.G','Leilson','A-101','#b9c9f5'],['I.C','Kamilla','A-102','#bdfaa5'],['ALP','Paulo','Lab. A-103','#b9cdf8'],['MAT. BÁSICA','Julio','A-104','#efff93'],['PORT. INST. I','Rafael','A-105','#ffc4bd'],['I.C','Kamilla','A-102','#bdfaa5'],['L.A.L.G','Leilson','A-101','#b9c9f5'],['ALP','Paulo','Lab. A-103','#b9cdf8'],['MAT. BÁSICA','Julio','A-104','#efff93'],['ING. INST. I','Leo','A-106','#ecc6ff']],
  2:[['P.O.O','Alberto','Lab. A-201','#d4d4d4'],['P.O.O','Alberto','Lab. A-201','#d4d4d4'],['PORT. INST. II','Maria','A-203','#ffdbad'],['R.H.T','Clayton','A-205','#d0f99a'],['I.R.C','Yure','Lab. A-207','#d7ff00'],['M.A.C','Leilson','A-202','#f7cafa'],['P.O.O','Alberto','Lab. A-201','#d4d4d4'],['ING. INST. II','Leo','A-204','#a9ecf8'],['MDPC','Danielly','A-206','#00f88b'],['I.R.C','Yure','Lab. A-207','#d7ff00']],
  4:[['PDS','Docente a confirmar','Lab. C-102','#ff8c32'],['B.D 2','Gildo','B-204','#6dffc1'],['T.A.P','Márcia','C-103','#9dccff'],['T.A.P','Márcia','C-103','#9dccff'],['A.P.S','Docente a confirmar','B-201','#ffe52f'],['PDS','Docente a confirmar','Lab. C-102','#ff8c32'],['B.D 2','Gildo','B-204','#6dffc1'],['A.P.S','Docente a confirmar','B-201','#ffe52f'],['PDS','Docente a confirmar','Lab. C-102','#ff8c32'],['A.P.S','Docente a confirmar','B-201','#ffe52f']]
};
const records=new Map();
function add(collection,id,data){records.set(`${collection}/${id}`,{...data,source:'Figma — demonstração, sem validade oficial',createdAt:timestamp(),updatedAt:timestamp()});}
add('courses','ads',{name:'Análise e Desenvolvimento de Sistemas',code:'ADS'});
add('courses','civil',{name:'Engenharia Civil',code:'Engenharia Civil'});
professors.forEach(name=>add('professors',slug(name),{name,description:''}));
for(const [period,lessons] of Object.entries(periods)){
 add('classes',`ads-${period}`,{name:`ADS ${period}N`,period:Number(period),courseId:'ads'});
 lessons.forEach(([code,professor,room,color],i)=>{
  const subjectId=`ads-${period}-${slug(code)}`,roomId=slug(room.replace('Lab. ',''));
  add('rooms',roomId,{name:room.replace('Lab. ',''),block:`Bloco ${room.replace('Lab. ','')[0]}`,type:room.startsWith('Lab.')?'Laboratório':'Sala de aula',location:'Localização ilustrativa para consulta. Não há planta ou mapa oficial disponível.'});
  add('subjects',subjectId,{name:code==='B.D 2'?'Banco de Dados II':code,code,color,courseId:'ads',description:''});
  add('lessons',`ads-${period}-${i+1}`,{courseId:'ads',classId:`ads-${period}`,subjectId,professorId:slug(professor),roomId,weekday:i%5+1,startTime:i<5?'18:30':'20:30',endTime:i<5?'20:10':'22:10',validFrom:'2026-07-01',validTo:'2026-12-31',semester:'2026.2 (demonstração)',description:'',status:'published'});
 });
}
async function main(){
 if(!process.env.FIRESTORE_EMULATOR_HOST && !process.argv.includes('--allow-production'))throw new Error('Seed restrito ao emulador. Para dados reais, revise o seed e use --allow-production explicitamente.');
 let count=0;
 // All writes use the same serialization lock as the API. Only missing documents are created.
 await db.runTransaction(async tx=>{
  await tx.get(db.doc('_system/academic-write-lock'));
  const entries=[...records];const snapshots=[];
  for(const [path] of entries)snapshots.push(await tx.get(db.doc(path)));
  count=0;entries.forEach(([path,data],i)=>{if(!snapshots[i].exists){tx.create(db.doc(path),data);count++;}});
  tx.set(db.doc('_system/academic-write-lock'),{updatedAt:timestamp()});
 });
 console.log(`Seed concluído: ${count} documentos criados; existentes preservados. Avisos não foram criados nem removidos.`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
