# Apresentação local — sem Firebase

Requisito: Node.js 22 LTS. Não precisa de Java, Firebase CLI, PostgreSQL ou emuladores para executar a aplicação.

No primeiro uso, com internet para baixar as dependências:

```powershell
npm install
npm run dev
```

No Windows, pode abrir `APRESENTAR.cmd`. Depois de instalar as dependências, a execução local não depende de serviços externos.

- Aplicação: http://127.0.0.1:5173
- API: http://127.0.0.1:3001/api
- Usuário: `root`
- Senha: `0123456789`

Abra pelo endereço 127.0.0.1 para manter frontend, API e cookie de sessão na mesma origem de site. O login local utiliza cookie HttpOnly e as alterações continuam protegidas no backend. A senha padrão atende somente à apresentação local; não publique esse modo na internet.

## Levar para outro notebook

Copie a pasta do projeto com `backend/data/academic-2026.json`, `frontend/public/documents` e, para levar também as alterações já feitas, `backend/data/local/database.json`. Pode excluir `node_modules`, `dist` e arquivos de log da cópia. Não copie chaves Firebase ou credenciais. A instalação inicial de dependências precisa de internet; depois, basta `npm run dev`.

O modo local é o padrão, inclusive sem `.env`. Os exemplos de ambiente também estão configurados para ele. Não é preciso executar seed: os dados dos PDFs entram automaticamente no primeiro início, uma única vez. Reiniciar não sobrescreve edições ou avisos.

## Dados e apresentação

A consulta está limitada a ADS, do 1º ao 6º período, conforme o escopo de apresentação. Foram importados 17 professores, 31 disciplinas e 54 blocos de aulas recorrentes. Os demais cursos não aparecem. O manifesto completo e os PDFs originais continuam preservados para uma expansão posterior.

As abreviações das disciplinas foram preservadas quando os documentos não permitiram expandi-las com segurança. Docentes não identificados com segurança mantêm o rótulo do documento na aula. Os PDFs não trazem salas; os ambientes devem ser cadastrados pela coordenação e vinculados às aulas. Não foram inventadas localizações.

O calendário recebido é a versão v.2 de 2026 para cursos superiores, aprovado em 01/06/2026. O documento completo está no visualizador; a lista de datas destaca o segundo semestre. O arquivo por professor apresenta cabeçalho 2026.1, apesar da data de criação em outubro: essa divergência deve ser conferida com a coordenação.

Roteiro: Horários → ADS → 4º período → Banco de Dados II; alternar Lista e imprimir; consultar Engenharia Civil e demais turmas; abrir Calendário; Entrar com root; cadastrar um aviso, atualizar a página e conferir Avisos/sino; editar aula, salvar rascunho e publicar. Salas começam vazias porque não foram informadas nos documentos.

Persistência: `backend/data/local/database.json`. Faça cópia desse arquivo com o servidor parado para backup. A escrita usa substituição atômica e transações serializadas no processo único do backend. Não execute vários backends sobre o mesmo arquivo. O Firebase permanece opcional no código, mas está desativado no ambiente de apresentação. Nenhum dado foi apagado do projeto Firebase real.

Avisos publicados abrem em destaque na consulta pública uma vez por carregamento. Recarregar a página volta a apresentá-los; navegar entre telas não repete a janela. A contagem no sino representa os avisos publicados, não uma marcação de leitura. A consulta atualiza os avisos ao recuperar foco e a cada 30 segundos. O menu agrupa Disciplinas, Professores e Salas em Acadêmico, e Calendário/Avisos em Comunicados. A faixa verde de intervalo identifica 20:10–20:30 na grade semanal.
