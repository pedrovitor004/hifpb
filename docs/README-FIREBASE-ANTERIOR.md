# HIFPB — Horários e Informações Acadêmicas

Implementação funcional em **React/Vite/JavaScript + Tailwind CSS 4 + NestJS/JavaScript + Firebase Authentication + Cloud Firestore**. A documentação anterior foi preservada em [docs/CONTEXTO-ORIGINAL.md](docs/CONTEXTO-ORIGINAL.md).

## Executar localmente

Requisitos: Node.js 22.14+ (preferir uma versão 22 LTS atualizada), npm e Java 21+ no PATH para o Firestore Emulator.

```powershell
npm install
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

Em três terminais, na raiz do workspace:

```powershell
# Terminal 1: somente serviços locais, projeto demo-hifpb
npm run emulators
```

```powershell
# Terminal 2: depois que os emuladores estiverem prontos
npm run seed
```

```powershell
# Terminal 3: React e NestJS
npm run dev
```

Frontend: **http://127.0.0.1:5173/**. API: **http://127.0.0.1:3001/api**. Painel dos emuladores: **http://127.0.0.1:4000/**. A origem `http://localhost:5173` também é aceita pela configuração de desenvolvimento.

Para executar separadamente: `npm run dev -w frontend` e `npm run dev -w backend`. Build: `npm run build`; backend compilado: `npm start -w backend`; visualização do frontend compilado: `npm run preview -w frontend` (adicionar a origem 4173 ao CORS para acessar a API).

O script de emuladores importa/exporta `.emulator-data` e preserva os dados entre sessões encerradas normalmente com Ctrl+C. Na primeira inicialização, a ausência de exportação anterior é esperada. O seed é idempotente, cria somente IDs ausentes, não limpa coleções e começa sem avisos. Alterações feitas no painel permanecem após recarregar a página. Para demonstrar as grades do protótipo, a consulta começa na semana de 26/10/2026; setas permitem navegar pelas semanas dentro da vigência.

## Primeiro coordenador

Não existe cadastro público de coordenadores nem senha padrão versionada.

1. Em desenvolvimento, abra o painel do emulador → Authentication → Add user e crie um usuário com e-mail e senha. Copie seu UID.
2. Em um terminal local confiável, execute `npm run coordinator -- UID`. O comando concede coordenação global ao usuário já existente. Para limitar a ADS, use `npm run coordinator -- UID ads`.
3. Abra **Entrar** na aplicação e use o e-mail/senha criados. O backend verifica o token emitido pelo Authentication e a permissão em `users/{uid}`.

Coordenadores globais podem gerenciar catálogos compartilhados; coordenadores limitados por curso só modificam registros vinculados ao curso autorizado. Para revogar, desative `active` no documento de permissão por uma ferramenta administrativa confiável, ou desabilite o usuário em Authentication. Nenhum endpoint público altera `users`.

## Projeto real hifpb-2026

O Console informado é [Firebase hifpb-2026](https://console.firebase.google.com/project/hifpb-2026). A execução entregue usa os **emuladores**, sem criar recursos externos, publicar regras ou escrever nesse projeto.

Para conectar posteriormente:

1. No Console → Configurações do projeto → Seus aplicativos, registre/selecione o app Web e copie sua configuração pública. Preencha `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN` e `VITE_FIREBASE_PROJECT_ID=hifpb-2026` em `frontend/.env`; defina `VITE_USE_EMULATORS=false`.
2. Habilite Email/Password no Authentication e verifique os domínios autorizados para a origem de hospedagem.
3. Configure `FIREBASE_PROJECT_ID=hifpb-2026` no backend e remova **ambas** as variáveis `FIRESTORE_EMULATOR_HOST` e `FIREBASE_AUTH_EMULATOR_HOST`.
4. Disponibilize Application Default Credentials no servidor. Se usar conta de serviço, guarde o JSON fora do repositório e informe seu caminho em `GOOGLE_APPLICATION_CREDENTIALS`; nunca o copie para o frontend ou envie a terceiros.
5. Verifique a existência/configuração do Firestore e, mediante autorização de infraestrutura, publique `firestore.rules`/`firestore.indexes.json`. As regras negam acesso direto de clientes. O Admin SDK exige autorização e validação na API independentemente das regras.
6. Configure `CORS_ORIGINS` com as origens reais separadas por vírgula, sem wildcard. Em produção, sirva a API por HTTPS em um proxy confiável. O processo local escuta somente em 127.0.0.1.
7. Crie o primeiro usuário pelo Console Authentication e conceda a permissão com o script acima, executado com credencial administrativa confiável. Reinicie frontend e backend após mudar os ambientes.

O seed de demonstração recusa projeto real por padrão. Não envie a chave administrativa ao frontend. A integração com `hifpb-2026` depende da configuração pública e da credencial administrativa local e ainda não foi testada.

## Funcionalidades e API

Consulta pública de horários ADS dos períodos 1, 2 e 4; filtros de docente, período e semana; lista semanal alternativa; detalhes individuais; salas selecionáveis; professores; disciplinas; avisos e notificações acessíveis. Engenharia Civil e calendário apresentam alertas informativos. Filtros de horário são preservados na URL ao voltar dos detalhes. A tabela tem rolagem horizontal localizada em telas pequenas.

Coordenação: login/logout Firebase, CRUD de catálogos e avisos, inclusão/edição/exclusão de horários, rascunhos e publicação com aviso opcional atômico. Cancelar formulário não altera os dados salvos; rascunhos já salvos podem ser descartados na aba Rascunhos.

Todos os recursos `courses`, `classes`, `professors`, `subjects`, `rooms`, `lessons` e `notices` expõem GET `/api/recurso` e GET `/api/recurso/:id` públicos; POST, PUT `/:id` e DELETE `/:id` exigem `Authorization: Bearer <Firebase ID token>` e papel ativo de coordenação. GET `/api/auth/me` retorna o perfil autorizado. `/api/drafts` é totalmente protegido: GET, POST, PUT `/:id`, DELETE `/:id`, POST `/:id/publish` com `{ "notice": { "title": "...", "message": "...", "category": "alteracao", "courseId": "ads" } }` opcional.

O backend rejeita horários invertidos, vigências inválidas, referências inconsistentes, exclusões em uso e sobreposições de turma, docente ou sala. A verificação considera se a interseção das vigências contém uma ocorrência real do dia semanal. Transações serializam as gravações concorrentes. Detalhes em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Testes

A reforma visual e os componentes de interação estão documentados em [docs/FRONTEND.md](docs/FRONTEND.md). Use `npm run test:ui` para os testes de navegador e `npm run capture` para gerar as capturas de revisão. Os PDFs enviados posteriormente ainda não foram importados; a reforma da interface foi priorizada a pedido do usuário.

```powershell
npm test
npm run build
# Com API, emuladores e seed ativos:
npm run test:integration
npx playwright install chromium
npx playwright test
node tests/capture.cjs
```

Os testes integrados usam somente emuladores, criam registros com IDs próprios e removem apenas esses registros ao terminar. Não execute os testes em produção. As capturas visuais locais ficam em `docs/screenshots`. O teste de sino vazio espera ausência de avisos, como no seed inicial; avisos criados manualmente precisam ser removidos ou o teste adaptado.

## Referência visual e limites

Foram inspecionados no Figma: início aberto, grades ADS 1/2/4, BD2, salas, professores, avisos, login e gestão. A implementação usa a paleta, tipografia Inter, ativos locais exportados e organização visual dessas telas. A área administrativa inclui formulários adicionais necessários ao CRUD além das ações demonstradas pelo protótipo. Não há integração com mapa oficial, recuperação de dados institucionais ou calendário acadêmico oficial.

Os dados extraídos são de um **protótipo**, não horários oficiais. A vigência de julho a dezembro de 2026 é demonstrativa. Salas são ilustrativas. ALP mostra Paulo/Leilson no Figma; a modelagem inicial permite um professor responsável por aula e usa Paulo. Avisos começam vazios. Engenharia Civil permanece fora do escopo inicial.
