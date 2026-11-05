# Arquitetura e dados

Frontend React 19 + Vite 6 + JavaScript, React Router e Tailwind CSS 4 com plugin Vite e tokens em `frontend/src/styles.css`. Inter é empacotada localmente. O SDK Firebase do navegador é usado exclusivamente para Authentication. Os dados acadêmicos passam pela API NestJS.

NestJS em JavaScript CommonJS, com decorators aplicados como funções para dispensar sintaxe experimental. Babel produz `backend/dist`. Autorização central em `auth.js`, validação Zod e regras recorrentes em `domain.js`, persistência transacional em `store.js`. Os módulos REST reutilizam uma fábrica simples de controlador por responsabilidade; nenhuma emissão própria de JWT.

| Coleção | Campos principais |
| --- | --- |
| users/{uid} | role=`coordinator`, active, courseIds (vazio = global) |
| courses | name, code |
| classes | name, courseId, period (1, 2 ou 4) |
| professors | name, roomId opcional, description |
| subjects | name, code, courseId, color, description |
| rooms | name, block, type, location |
| lessons | courseId, classId, subjectId, professorId, roomId, weekday (1–5), startTime, endTime, validFrom, validTo, semester, status=published |
| drafts | campos da aula, status=draft, baseUpdatedAt |
| notices | title, message, category, courseId, status=published |
| _system/academic-write-lock | updatedAt |

Datas `createdAt` e `updatedAt` são timestamps do servidor. Vigências são datas civis ISO e horários são locais do campus, sem conversão UTC. Uma aula ocorre semanalmente no dia definido durante a vigência, nunca como evento de data única.

Cada transação de alteração lê o documento de controle antes de consultar relações e conflitos; todas atualizam esse documento. Assim, publicações, CRUD, exclusões e seed que competem precisam ser serializados/repetidos pelo Firestore. O teste integrado dispara duas requisições simultâneas e exige uma resposta 201 e outra 409. Essa abordagem é intencionalmente simples para a escala acadêmica: faz leituras das pequenas coleções completas e é inadequada para alto volume. Não há consultas compostas no servidor; `firestore.indexes.json` fica vazio.

Rascunhos são outra coleção e só são lidos por coordenadores. Salvar não altera a aula publicada. Publicar verifica a versão base, valida novamente as referências e os conflitos e grava a aula e o aviso opcional na mesma transação. Cancelar o formulário descarta apenas mudanças locais; para eliminar um rascunho já salvo, use **Rascunhos → Descartar**. A API também oferece POST/PUT direto em lessons para publicação administrativa explícita; a interface usa revisão por rascunhos.

Os catálogos de salas/professores são compartilhados. Para evitar alterações entre cursos, coordenadores limitados por `courseIds` só modificam registros com courseId autorizado; catálogos compartilhados exigem coordenador global. Toda alteração é protegida no servidor. A coleção users não possui endpoint de edição. As regras negam todo acesso direto pelo SDK cliente ao Firestore.

Dados do seed vêm das grades 1, 2 e 4 do protótipo. Vigência julho–dezembro/2026 é demonstrativa. Abreviações não foram expandidas sem fonte; BD2 foi identificado pelo requisito do projeto. As salas são ilustrativas, sem mapa oficial. No protótipo, ALP menciona Paulo/Leilson: a modelagem inicial tem um professor responsável por aula e usa Paulo. A confirmação acadêmica desses dados permanece necessária.

Referências consultadas: [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite), [NestJS e JavaScript](https://docs.nestjs.com/first-steps), [isolamento das transações Firestore](https://firebase.google.com/docs/firestore/transaction-data-contention).
