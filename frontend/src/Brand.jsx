import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './components';

export default function Brand({className=""}) {
  return <Link to="/" className={`product-brand ${className}`} aria-label="HIFPB — Início">
    <span className="product-brand-symbol"><img src="/assets/69c80.png" alt=""/></span><span className="product-brand-type">IFPB<small>Campus Monteiro</small></span>
  </Link>;
}

export function CoordinatorAccess({signedIn=false, compact=false}) {
  return <Link to={signedIn?'/admin':'/entrar'} className={`coordinator-access ${compact?'coordinator-access-compact':''}`}>
    <span className="coordinator-access-icon"><Icon name="lock" size={18}/></span>
    <span className="coordinator-access-copy"><strong>{signedIn?'Painel da coordenação':'Acesso da coordenação'}</strong>{!compact&&<small>{signedIn?'Gerenciar horários':'Entrar na área restrita'}</small>}</span>
    <Icon name="arrow" size={16}/>
  </Link>;
}
