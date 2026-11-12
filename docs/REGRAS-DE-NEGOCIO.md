# Regras de horários

O guia completo e reproduzível está em `output/pdf/hifpb-regras-de-negocio.pdf`, com 60 regras identificadas. A fonte estruturada é `docs/regras-de-negocio.json`; gere novamente com `python docs/build_rules_pdf.py` (ReportLab).

## Consulta e avisos

- Sem curso selecionado no Início, os dados acadêmicos não são carregados. A escolha fica salva no navegador; clicar no curso ativo desmarca a opção e esvazia as consultas. O tutorial abre a cada entrada no Início e pode ser pulado ou pausado.
- Avisos podem alcançar todos os cursos (`audience: all`, sem curso único) ou um curso específico. A consulta inclui os avisos gerais somente após a escolha do curso. Informação, alteração e cancelamento têm cores, ícones e rótulos consistentes no painel e na consulta.
- Alteração ou cancelamento pode vincular uma aula publicada e uma data, sempre juntos. O curso deve participar da aula; a data deve coincidir com o dia recorrente e respeitar a vigência. Aulas compartilhadas distribuem o comunicado aos cursos participantes.
- Cada aula/data admite um único comunicado vinculado. A grade, a lista e o detalhe mostram seu resumo e abrem o conteúdo completo ao clicar. O indicativo corresponde à ocorrência da semana corrente, embora o cabeçalho mostre somente segunda a sexta, sem datas.
- Aulas com avisos vinculados não podem ser excluídas; alterações não podem invalidar os vínculos. Publicar aviso não modifica automaticamente a recorrência, a sala ou o horário e não libera recursos. Alterações estruturais exigem a edição validada da aula.
- O SweetAlert de avisos informa apenas a quantidade e convida à consulta, sem enumerar o conteúdo.

- Uma turma, professor ou sala não pode ocupar duas aulas com horários sobrepostos no mesmo dia e em vigências que tenham uma ocorrência em comum. A regra vale também para aulas com várias turmas ou professores e entre cursos diferentes.
- Aulas consecutivas são permitidas: uma pode começar no instante em que outra termina.
- O horário final deve ser posterior ao inicial. As datas devem existir, o fim da vigência não pode anteceder o início e a vigência deve conter o dia da semana escolhido.
- Curso, turma e disciplina devem ser consistentes e referenciar cadastros existentes. Professor e sala podem ficar a definir; quando vinculados, passam pela verificação de conflitos.
- Rascunhos não aparecem na consulta pública. A publicação verifica novamente conflitos e alterações feitas desde a criação do rascunho, dentro de uma transação.
- Cadastros em uso por aulas ou rascunhos não podem ser excluídos nem ter o curso trocado, inclusive quando aparecem como referências adicionais de aulas compartilhadas.
- Coordenadores autenticados e ativos têm acesso à gestão de todos os cursos. A seleção pública de curso não limita esse acesso. Pessoas sem autenticação não alteram os cadastros, calendários ou documentos.
- A seleção de curso acontece no início e fica salva no navegador. As consultas públicas usam esse curso; a seleção não restringe a visão administrativa nem substitui a autorização do servidor.

A vigência e o semestre sugeridos no cadastro podem ser alterados em “Editar vigência e detalhes”. São sugestões por semestre civil, não datas inferidas do calendário acadêmico.

## Integridade dos cadastros

- Uma aula compartilhada deve associar uma turma e uma disciplina de cada curso envolvido. Todas as referências devem existir.
- O semestre aceita `2026` ou `2026.1`/`2026.2`. As cores de disciplinas aceitam somente `#` seguido de seis dígitos hexadecimais.
- Siglas de cursos, siglas de disciplinas dentro de um curso, nomes de turmas dentro de um curso e identificações de salas dentro de um bloco não podem ser duplicados, desconsiderando caixa, acentos e espaços excedentes.
- A gravação e publicação de aulas verificam conflitos dentro de transações serializadas. Rascunhos guardam a revisão da aula de origem; uma publicação posterior impede que um rascunho antigo a sobrescreva silenciosamente.
- Professor e sala ainda não definidos são permitidos para representar os documentos recebidos sem inventar informações. A verificação de ocupação passa a valer quando esses recursos são associados à aula.

## Calendários e documentos

- Integrado e superior possuem PDFs e links próprios. Publicar um calendário atual não altera a outra modalidade.
- A coordenação envia um PDF verdadeiro, sem senha, de até 8 MB e com 1 a 2000 páginas. A extensão e o tipo declarado não substituem a abertura e validação do documento no servidor.
- A modalidade do PDF deve corresponder à do calendário. A página inicial deve existir no arquivo enviado.
- Cada modalidade possui no máximo uma versão explicitamente atual. Ao publicar uma nova, a anterior e seu PDF são preservados. A troca é transacional.
- Ao substituir um documento com eventos cadastrados, é necessário criar uma versão independente. Datas antigas não são copiadas para o novo PDF. Alterar somente os links conserva a versão e suas datas.
- Eventos devem estar dentro da vigência do calendário; bimestres se aplicam apenas aos integrados. Não é permitido encurtar a vigência ou trocar a modalidade invalidando eventos existentes.
- Cada calendário admite até oito links, com nome e endereço. Links externos devem usar HTTPS, sem credenciais. São aceitos também os PDFs já existentes em `/documents/`. Endereços executáveis, como `javascript:` e `data:`, são recusados.
- Os arquivos têm identificadores gerados pelo servidor. O nome fornecido pelo usuário não define o caminho de armazenamento. PDFs publicados são documentos públicos; escrita exige autenticação da coordenação.

## Persistência e verificação

No modo local, o banco fica em `backend/data/local/database.json` e os PDFs enviados em `backend/data/uploads/`. No modo Firebase, configure `FIREBASE_STORAGE_BUCKET` para o bucket de Cloud Storage acessível à conta do servidor. Os PDFs ficam no bucket e os metadados no Firestore.

`npm test` verifica domínio e uma API local isolada, incluindo concorrência, revisões, arquivos, permissões e persistência após reinício. `npx playwright test calendar-management.spec.js` verifica o envio dos PDFs das duas modalidades, edição dos links, separação na consulta pública e edição de cores. Esses testes usam bancos e arquivos temporários, preservando os dados reais do projeto.
