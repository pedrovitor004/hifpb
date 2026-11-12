require('reflect-metadata');
const { NestFactory }=require('@nestjs/core');
const { Module, Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res, UseGuards, BadRequestException }=require('@nestjs/common');
const helmet=require('helmet');
const {Store,collections}=require('./store');
const {AuthModule,CoordinatorGuard}=require('./auth');
const store=new Store();
const {uploadDocument,documentContent}=require('./documents');
function endpoint(cls,name,verb,path,params,guard=false){
  verb(path)(cls.prototype,name,Object.getOwnPropertyDescriptor(cls.prototype,name));
  params.forEach((p,i)=>p(cls.prototype,name,i));
  if(guard)UseGuards(CoordinatorGuard)(cls.prototype,name,Object.getOwnPropertyDescriptor(cls.prototype,name));
}
const modules=collections.map(type=>{
  class ResourceController {
    list(q){return store.list(type,q);}
    get(id){return store.get(type,id);}
    create(body,req){return store.write(type,null,body,req.coordinator);}
    update(id,body,req){return store.write(type,id,body,req.coordinator);}
    remove(id,req){return store.remove(type,id,req.coordinator);}
  }
  Controller(type)(ResourceController);
  endpoint(ResourceController,'list',Get,'',[Query()]);endpoint(ResourceController,'get',Get,':id',[Param('id')]);
  endpoint(ResourceController,'create',Post,'',[Body(),Req()],true);endpoint(ResourceController,'update',Put,':id',[Param('id'),Body(),Req()],true);endpoint(ResourceController,'remove',Delete,':id',[Param('id'),Req()],true);
  class ResourceModule{};Module({imports:[AuthModule],controllers:[ResourceController]})(ResourceModule);return ResourceModule;
});
class DraftController {
  list(q,req){return store.list('drafts',q,req.coordinator);}
  create(body,req){return store.write('lessons',null,body,req.coordinator,{draft:true});}
  save(id,body,req){return store.write('lessons',id,body,req.coordinator,{draft:true});}
  publish(id,body,req){if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>k!=='notice'))throw new BadRequestException('Campos de publicação inválidos.');return store.publish(id,body,req.coordinator);}
  remove(id,req){return store.remove('drafts',id,req.coordinator);}
}
Controller('drafts')(DraftController);UseGuards(CoordinatorGuard)(DraftController);
endpoint(DraftController,'list',Get,'',[Query(),Req()]);endpoint(DraftController,'create',Post,'',[Body(),Req()]);endpoint(DraftController,'save',Put,':id',[Param('id'),Body(),Req()]);endpoint(DraftController,'publish',Post,':id/publish',[Param('id'),Body(),Req()]);endpoint(DraftController,'remove',Delete,':id',[Param('id'),Req()]);
class DraftModule{};Module({imports:[AuthModule],controllers:[DraftController]})(DraftModule);
class DocumentController {
  list(req){require('./domain').assertScope(req.coordinator,{});return store.list('documents');}
  upload(body,req){return uploadDocument(body,req.coordinator);}
  async content(id,res){const file=await documentContent(id);res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`inline; filename="${file.fileName}"`);res.setHeader('X-Content-Type-Options','nosniff');res.removeHeader('X-Frame-Options');res.setHeader('Content-Security-Policy',`frame-ancestors 'self' ${(process.env.CORS_ORIGINS||'http://localhost:5173,http://127.0.0.1:5173').split(',').join(' ')}`);res.setHeader('Cache-Control','public, max-age=31536000, immutable');res.send(file.bytes);}
}
Controller('documents')(DocumentController);
endpoint(DocumentController,'list',Get,'',[Req()],true);endpoint(DocumentController,'upload',Post,'',[Body(),Req()],true);endpoint(DocumentController,'content',Get,':id/content',[Param('id'),Res()]);
class DocumentModule{};Module({imports:[AuthModule],controllers:[DocumentController]})(DocumentModule);
class AppModule{};Module({imports:[AuthModule,...modules,DraftModule,DocumentModule,...(process.env.DATA_MODE==='local'?[require('./local-auth').LocalAuthModule]:[])]})(AppModule);
async function bootstrap(){
  const app=await NestFactory.create(AppModule,{logger:['error','warn','log']});
  app.useBodyParser('json',{limit:'12mb'});
  app.use(helmet());app.setGlobalPrefix('api');
  app.enableCors({credentials:true,origin:(process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s=>s.trim()),methods:['GET','POST','PUT','DELETE','OPTIONS'],allowedHeaders:['Content-Type','Authorization']});
  await app.listen(Number(process.env.PORT || 3001),'127.0.0.1');
}
bootstrap();
