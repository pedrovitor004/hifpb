const crypto = require('node:crypto');
const {Controller,Get,Post,Delete,Body,Req,Res,Module,UnauthorizedException}=require('@nestjs/common');
const sessions=new Map(), ttl=8*60*60*1000;
const profile={uid:'local-root',email:'root',role:'coordinator',active:true,courseIds:[]};
function token(req){return (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('hifpb_session='))?.slice(14);}
function session(req){const key=token(req),expires=sessions.get(key);if(!expires||expires<Date.now()){sessions.delete(key);return null;}return profile;}
function equal(a,b){const x=crypto.createHash('sha256').update(String(a||'')).digest(),y=crypto.createHash('sha256').update(b).digest();return crypto.timingSafeEqual(x,y);}
class LocalAuthController {
  login(body,res){if(!equal(body?.email,'root')||!equal(body?.password,'0123456789'))throw new UnauthorizedException('Usuário ou senha incorretos.');const key=crypto.randomBytes(32).toString('hex');sessions.set(key,Date.now()+ttl);res.cookie('hifpb_session',key,{httpOnly:true,sameSite:'strict',maxAge:ttl,path:'/api'});return profile;}
  current(req){return {user:session(req)};}
  logout(req,res){sessions.delete(token(req));res.clearCookie('hifpb_session',{path:'/api',sameSite:'strict'});return {ok:true};}
}
Controller('auth')(LocalAuthController);
for(const [name,verb,route] of [['login',Post,'login'],['current',Get,'session'],['logout',Delete,'session']])verb(route)(LocalAuthController.prototype,name,Object.getOwnPropertyDescriptor(LocalAuthController.prototype,name));
Body()(LocalAuthController.prototype,'login',0);Res({passthrough:true})(LocalAuthController.prototype,'login',1);
Req()(LocalAuthController.prototype,'current',0);Req()(LocalAuthController.prototype,'logout',0);Res({passthrough:true})(LocalAuthController.prototype,'logout',1);
class LocalAuthModule{};Module({controllers:[LocalAuthController]})(LocalAuthModule);
module.exports={session,LocalAuthModule};
