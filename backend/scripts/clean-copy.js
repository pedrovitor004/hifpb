const {db,timestamp}=require('../src/firebase');
const unwanted=/prot[oó]tipo|ementa n[aã]o fornecida|dados extra[ií]dos|demonstra[cç][aã]o|n[aã]o confirmada pela institui[cç][aã]o/i;
async function main(){
 if(!process.env.FIRESTORE_EMULATOR_HOST)throw new Error('Esta limpeza é restrita ao ambiente local.');
 const count=await db.runTransaction(async tx=>{await tx.get(db.doc('_system/academic-write-lock'));const documents=[];for(const collection of ['subjects','professors','lessons'])documents.push(...(await tx.get(db.collection(collection))).docs);let total=0;for(const doc of documents){const data=doc.data();if(data.description&&unwanted.test(data.description)){tx.update(doc.ref,{description:'',updatedAt:timestamp()});total++;}}tx.set(db.doc('_system/academic-write-lock'),{updatedAt:timestamp()});return total;});console.log(`${count} descrições internas removidas; demais dados preservados.`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
