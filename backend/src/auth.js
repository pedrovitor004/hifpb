const { Injectable, UnauthorizedException, ForbiddenException, Controller, Get, Req, UseGuards, Module } = require('@nestjs/common');
const { auth, db } = require('./firebase');
class CoordinatorGuard {
  async canActivate(context) {
    const req = context.switchToHttp().getRequest();
    if(process.env.DATA_MODE==='local'){
      const profile=require('./local-auth').session(req);
      if(!profile)throw new UnauthorizedException('Entre para administrar o sistema.');
      req.coordinator=profile;return true;
    }
    const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
    if(!match) throw new UnauthorizedException('Autenticação necessária.');
    let decoded;
    try { decoded = await auth.verifyIdToken(match[1], true); } catch { throw new UnauthorizedException('Sessão inválida ou expirada.'); }
    const snap = await db.collection('users').doc(decoded.uid).get();
    const profile = snap.data();
    if(!profile?.active || profile.role !== 'coordinator') throw new ForbiddenException('Acesso exclusivo de coordenadores autorizados.');
    req.coordinator = { uid: decoded.uid, email: decoded.email, ...profile, courseIds: [] };
    return true;
  }
}
Injectable()(CoordinatorGuard);
class AuthController { me(req) { return { uid: req.coordinator.uid, email: req.coordinator.email, role: req.coordinator.role, courseIds: [] }; } }
Controller('auth')(AuthController);
Get('me')(AuthController.prototype,'me',Object.getOwnPropertyDescriptor(AuthController.prototype,'me'));
Req()(AuthController.prototype,'me',0);
UseGuards(CoordinatorGuard)(AuthController);
class AuthModule {}
Module({controllers:[AuthController],providers:[CoordinatorGuard],exports:[CoordinatorGuard]})(AuthModule);
module.exports = { CoordinatorGuard, AuthModule };
