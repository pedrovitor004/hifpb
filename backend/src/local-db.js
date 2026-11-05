// File-backed adapter for the presentation mode. Transactions are serialized.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const file = path.resolve(__dirname, '../data/local/database.json');
let state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
let queue = Promise.resolve();
function revive(value) {
  if (!value || typeof value !== 'object') return value;
  if (typeof value._seconds === 'number') return { ...value, toMillis() { return this._seconds * 1000 + (this._nanoseconds || 0) / 1e6; } };
  if (Array.isArray(value)) return value.map(revive);
  return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,revive(v)]));
}
function persist(next) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file + '.tmp', JSON.stringify(next));
  fs.renameSync(file + '.tmp', file);
  state = next;
}
function docSnapshot(ref, source) { const data = source[ref.path]; return {id:ref.id, exists:data!==undefined, data:()=>revive(structuredClone(data)), ref}; }
function querySnapshot(ref, source) {
  const prefix=ref.path+'/';
  let docs=Object.keys(source).filter(k=>k.startsWith(prefix)&&!k.slice(prefix.length).includes('/')).sort().map(k=>docSnapshot(doc(k),source));
  if(ref.limitCount)docs=docs.slice(0,ref.limitCount);
  return {docs, size:docs.length, empty:!docs.length};
}
function doc(key) { return {kind:'doc',path:key,id:key.split('/').at(-1),get:async()=>docSnapshot(doc(key),state),set:(v,o)=>db.runTransaction(async t=>t.set(doc(key),v,o)),delete:()=>db.runTransaction(async t=>t.delete(doc(key)))}; }
function collection(key) { return {kind:'collection',path:key,doc:(id=crypto.randomUUID())=>doc(key+'/'+id),get:async()=>querySnapshot(collection(key),state),select(){return this;},limit(n){return {...this,limitCount:n,get:async()=>querySnapshot({...this,limitCount:n},state)};}}; }
const db={doc,collection,async runTransaction(fn){
  const task=queue.then(async()=>{const next=structuredClone(state);const tx={
    get:async ref=>ref.kind==='doc'?docSnapshot(ref,next):querySnapshot(ref,next),
    set(ref,value,opts){next[ref.path]=opts?.merge?{...next[ref.path],...value}:value;return tx;},
    create(ref,value){if(next[ref.path])throw new Error('Registro já existe.');next[ref.path]=value;return tx;},
    delete(ref){delete next[ref.path];return tx;}
  };const result=await fn(tx);persist(JSON.parse(JSON.stringify(next)));return result;});
  queue=task.catch(()=>{});return task;
},terminate:async()=>{}};
module.exports={db,timestamp:()=>({_seconds:Math.floor(Date.now()/1000),_nanoseconds:(Date.now()%1000)*1e6})};
