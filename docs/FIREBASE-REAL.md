# Firebase real — configuração de 05/11/2026

Projeto: `hifpb-2026`. Aplicativo Web: **HIFPB Web**.
Firestore padrão criado em `southamerica-east1` (São Paulo), edição Standard, com `freeTier: true` confirmado pela API. Não foi ativado faturamento nem realizada publicação da aplicação. O campo storageBucket da configuração Web não significa que Storage tenha sido provisionado ou esteja sendo usado.

A configuração pública está em `frontend/firebase.web.config.json`. Os arquivos locais `frontend/.env.firebase.local` e `backend/.env.firebase.local` estão preparados, mas não foram ativados: a execução atual continua nos emuladores até a credencial administrativa estar disponível.

## Concluir a conexão

1. No Console Firebase → Authentication → Método de login, habilite E-mail/senha.
2. Para o backend, forneça Application Default Credentials. A alternativa local é gerar uma chave de conta de serviço no Console → Configurações do projeto → Contas de serviço → Firebase Admin SDK. Guarde o JSON fora do workspace, não envie pelo chat e não versione. Trate a chave como uma senha e revogue quando não for mais necessária.
3. No terminal do backend, configure `GOOGLE_APPLICATION_CREDENTIALS` com o caminho absoluto desse JSON. A sessão de `firebase login` não substitui essa credencial.
4. Faça uma cópia de segurança dos `.env` atuais. Copie `frontend/.env.firebase.local` para `frontend/.env` e `backend/.env.firebase.local` para `backend/.env`. Reinicie os dois servidores no ambiente com a credencial definida. Não mantenha as variáveis de emuladores no backend real.
5. Crie o usuário do coordenador em Authentication e copie seu UID. Com o backend configurado para o projeto real, execute `npm run coordinator -- UID`. Esse comando grava a permissão protegida em `users/{uid}`. Não existe cadastro público de coordenadores.
6. Teste login, `/api/auth/me`, consulta e gravação antes de importar dados. Nenhum dado dos emuladores é transferido automaticamente. O seed de demonstração não deve ser executado no projeto real.

O banco recém-criado pode estar vazio; criar a infraestrutura não significa importar os PDFs ou validar a integração do Admin SDK. Os dados acadêmicos passam pela API NestJS, nunca pelo Firestore do navegador. Não foi ativado plano Blaze, Storage, Functions, PITR ou serviços pagos.
