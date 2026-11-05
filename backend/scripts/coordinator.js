const {auth,db,timestamp}=require('../src/firebase');
async function main(){
 const uid=process.argv[2];if(!uid || uid.startsWith('--'))throw new Error('Uso: npm run coordinator -- <uid-existente> [curso-id ...]');
 const user=await auth.getUser(uid);const courseIds=process.argv.slice(3);
 for(const id of courseIds)if(!(await db.doc(`courses/${id}`).get()).exists)throw new Error(`Curso inexistente: ${id}`);
 await db.doc(`users/${uid}`).set({role:'coordinator',active:true,courseIds,updatedAt:timestamp()},{merge:true});
 console.log(`Permissão de coordenação concedida a ${user.uid}. Cursos: ${courseIds.join(', ') || 'todos'}.`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
