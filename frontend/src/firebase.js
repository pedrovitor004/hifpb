import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, onAuthStateChanged as firebaseObserve, signInWithEmailAndPassword as firebaseLogin, signOut as firebaseLogout } from 'firebase/auth';
const env=import.meta.env;
export const localMode=env.VITE_AUTH_MODE!=='firebase'&&env.VITE_USE_EMULATORS!=='true';
export const documentUrl=id=>`${localMode?'/api':env.VITE_API_URL||'http://127.0.0.1:3001/api'}/documents/${encodeURIComponent(id)}/content`;
const listeners=new Set();
export const auth=localMode?{currentUser:null}:getAuth(initializeApp({apiKey:env.VITE_FIREBASE_API_KEY,authDomain:env.VITE_FIREBASE_AUTH_DOMAIN,projectId:env.VITE_FIREBASE_PROJECT_ID}));
if(!localMode&&env.VITE_USE_EMULATORS==='true')connectAuthEmulator(auth,env.VITE_AUTH_EMULATOR_URL||'http://127.0.0.1:9099',{disableWarnings:true});
export async function api(path,options={}){
 const token=!localMode&&auth.currentUser?await auth.currentUser.getIdToken():null;
 let response;
 try{response=await fetch(`${localMode?'/api':env.VITE_API_URL||'http://127.0.0.1:3001/api'}${path}`,{...options,credentials:'include',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})}});}catch{throw new Error('Não foi possível acessar a API. Verifique se o backend está em execução.');}
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.message||'Não foi possível concluir a operação.');return data;
}
function update(user){auth.currentUser=user;listeners.forEach(fn=>fn(user));}
export function onAuthStateChanged(instance,callback){if(!localMode)return firebaseObserve(instance,callback);listeners.add(callback);api('/auth/session').then(result=>update(result.user||null)).catch(()=>update(null));return()=>listeners.delete(callback);}
export async function signInWithEmailAndPassword(instance,email,password){if(!localMode)return firebaseLogin(instance,email,password);const user=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});update(user);return {user};}
export async function signOut(instance){if(!localMode)return firebaseLogout(instance);await api('/auth/session',{method:'DELETE'});update(null);}
