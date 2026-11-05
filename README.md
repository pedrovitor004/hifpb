# HIFPB — apresentação local

Plataforma acadêmica em React, Tailwind CSS e NestJS com persistência local. Não depende de Firebase ou PostgreSQL para apresentar.

## Iniciar

Requisito: Node.js 22 LTS.

```powershell
npm install
npm run dev
```

Abra **http://127.0.0.1:5173**. No Windows, também é possível executar **APRESENTAR.cmd**.

**Coordenador:** `root` • **Senha:** `0123456789`.

A API roda em http://127.0.0.1:3001/api. Os dados dos PDFs são importados automaticamente, sem seed manual. Alterações ficam em `backend/data/local/database.json` e permanecem após reiniciar. A senha padrão é exclusiva da apresentação local.

## Documentação

- [Como levar para outro notebook, dados importados e roteiro de apresentação](docs/APRESENTACAO.md)
- [Arquitetura anterior e Firebase opcional](docs/README-FIREBASE-ANTERIOR.md)

Não copie credenciais Firebase para outro notebook. Elas não são necessárias neste modo. Inclua os PDFs em `frontend/public/documents` e o manifesto em `backend/data/academic-2026.json` ao copiar o projeto.

## Verificar

```powershell
npm test
npm run test:local
npm run build
```

Frontend em JavaScript com React/Vite e Tailwind CSS 4; backend NestJS em JavaScript. Modo local com cookie HttpOnly, autorização nas operações administrativas, validação de referências e conflitos, rascunhos e publicação. O armazenamento em arquivo é adequado à apresentação em processo único; a integração Firebase está preservada, mas desativada.
