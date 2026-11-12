# Arquitetura e dados

Frontend React 19 + Vite 6 + JavaScript, React Router e Tailwind CSS 4 com plugin Vite e tokens em `frontend/src/styles.css`. Inter é empacotada localmente. O SDK Firebase do navegador é usado exclusivamente para Authentication. Os dados acadêmicos passam pela API NestJS.

NestJS em JavaScript CommonJS, com decorators aplicados como funções para dispensar sintaxe experimental. Babel produz `backend/dist`. Autorização central em `auth.js`, validação Zod e regras recorrentes em `domain.js`, persistência transacional em `store.js`. Os módulos REST reutilizam uma fábrica simples de controlador por responsabilidade; nenhuma emissão própria de JWT.

| Coleção | Campos principais |
| --- | --- |
| users/{uid} | role=`coordinator`, active, courseIds (vazio = global) |
| courses | name, code, level |
| classes | name, courseId, period (0 a 20) |
| professors | name, roomId opcional, description |
| subjects | name, code, courseId, color, description |
| rooms | name, block, type, location |
| lessons | courseId, courseIds, classId/classIds, subjectId/subjectIds, professorId/professorIds, roomId, weekday (1–5), startTime, endTime, validFrom, validTo, semester, revision, status=published |
| drafts | campos da aula, status=draft, baseUpdatedAt, baseRevision |
| notices | title, message, category, audience, courseId/courseIds, lessonId, occurrenceDate, status=published |
| calendars | title, year, version, scope, documentId, startPage, validFrom, validTo, approvalDate, isCurrent, links |
| calendarEvents | calendarId, title, startDate, endDate, category, bimester |
| documents | title, fileName, scope, mimeType, pageCount, size, sha256, metadados de armazenamento |
| _system/academic-write-lock | updatedAt |

Datas `createdAt` e `updatedAt` são timestamps do servidor. Vigências são datas civis ISO e horários são locais do campus, sem conversão UTC. Uma aula ocorre semanalmente no dia definido durante a vigência, nunca como evento de data única.

Cada transação de alteração lê o documento de controle antes de consultar relações e conflitos; todas atualizam esse documento. Assim, publicações, CRUD, exclusões e seed que competem precisam ser serializados/repetidos pelo Firestore. O teste integrado dispara duas requisições simultâneas e exige uma resposta 201 e outra 409. Essa abordagem é intencionalmente simples para a escala acadêmica: faz leituras das pequenas coleções completas e é inadequada para alto volume. Não há consultas compostas no servidor; `firestore.indexes.json` fica vazio.

Rascunhos são outra coleção e só são lidos por coordenadores. Salvar não altera a aula publicada. Publicar verifica a versão base, valida novamente as referências e os conflitos e grava a aula e o aviso opcional na mesma transação. Cancelar o formulário descarta apenas mudanças locais; para eliminar um rascunho já salvo, use **Rascunhos → Descartar**. A API também oferece POST/PUT direto em lessons para publicação administrativa explícita; a interface usa revisão por rascunhos.

Os catálogos de salas/professores são compartilhados. Todo coordenador autenticado e ativo administra todos os cursos; a seleção feita na entrada filtra somente as consultas públicas. O painel tem uma navegação própria de gestão. Toda alteração é protegida no servidor. A coleção users não possui endpoint de edição. As regras negam todo acesso direto pelo SDK cliente ao Firestore.

Calendários têm PDF, modalidade, vigência, página inicial e links editáveis. O servidor valida o PDF com pdf-lib, grava o arquivo com identificador próprio e mantém metadados em documents. No modo local os arquivos persistem em backend/data/uploads; no modo Firebase é utilizado o bucket indicado por FIREBASE_STORAGE_BUCKET. Publicar uma nova versão troca a indicação isCurrent de forma transacional e conserva as versões anteriores. Datas de um calendário anterior não são copiadas para outro PDF. As regras e os testes estão descritos em REGRAS-DE-NEGOCIO.md.

A importação local completa usa os PDFs dos seis cursos: ADS, Engenharia Civil, Construção de Edifícios, Edificações, Informática e Instrumento Musical. Inclui aulas compartilhadas e múltiplos docentes; não inventa salas ou professores ausentes. Registros com conflito ficam em rascunho. O importador preserva edições manuais e gera backup. O seed básico do protótipo continua sendo apenas uma base demonstrativa; a confirmação institucional das vigências e dos documentos de origem permanece necessária.

O carregamento público depende de uma escolha válida no Início. Desmarcar o curso remove a preferência e esvazia as consultas; a API também aceita `courseId` para retornar as relações desse curso. Avisos gerais são combinados com avisos específicos depois da escolha. Alterações e cancelamentos podem referenciar uma aula e uma ocorrência válida, com unicidade por aula/data. Grade, lista e detalhe mostram o resumo e abrem o comunicado. Esses avisos não alteram a recorrência nem liberam reservas automaticamente. O guia completo de 60 regras está em `output/pdf/hifpb-regras-de-negocio.pdf`, com fonte reproduzível em `docs/regras-de-negocio.json`.

Referências consultadas: [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite), [NestJS e JavaScript](https://docs.nestjs.com/first-steps), [isolamento das transações Firestore](https://firebase.google.com/docs/firestore/transaction-data-contention).
