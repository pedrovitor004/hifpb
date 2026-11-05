# HIFPB — Horários e Informações Acadêmicas

Projeto acadêmico da disciplina de **Interação Humano-Computador (IHC)** do **Instituto Federal da Paraíba — Campus Monteiro**.

O HIFPB centraliza a consulta de horários de aulas, salas, professores, calendário acadêmico e avisos, além de oferecer uma área de gerenciamento para a coordenação.

## Problema e objetivo

Informações sobre aulas e mudanças de horários ou salas podem ficar dispersas entre diferentes canais de comunicação, dificultando a consulta e o acompanhamento de atualizações.

O projeto busca facilitar o acesso à programação acadêmica e apresentar alterações e cancelamentos com clareza, apoiando estudantes, professores e a coordenação do curso.

## Levantamento de requisitos

O levantamento inicial foi realizado por meio de um formulário eletrônico no Google Forms, com perguntas objetivas e discursivas. Participaram três integrantes do IFPB Campus Monteiro: dois coordenadores e um estudante.

As respostas apontaram a necessidade de centralizar horários, localização das salas, informações dos professores, calendário acadêmico e avisos sobre mudanças.

## Funcionalidades

- Consultar horários por curso, período e professor, em grade semanal ou lista para impressão.
- Consultar salas, professores, disciplinas e calendário acadêmico.
- Ver detalhes das aulas e os avisos publicados pela coordenação.
- Receber destaque de avisos e notificações na interface pública.
- Acessar uma área administrativa para gerenciar os dados acadêmicos e publicar avisos.
- Importar dados acadêmicos dos PDFs disponibilizados para o projeto.

### Perfis de acesso

| Perfil | Acesso |
| --- | --- |
| Público | Consulta das informações acadêmicas. |
| Coordenador | Acesso autenticado para gestão de horários, cadastros e avisos. |

As permissões administrativas são verificadas no backend.

## Protótipo

[Acessar o protótipo no Figma](https://www.figma.com/design/KcS6hCiWour0yac6fMvt4C)

O fluxo de demonstração do protótipo começa na página inicial e apresenta a consulta às grades de ADS, o detalhamento de aula de Banco de Dados II (BD2), do 4º período, e o acesso à tela de salas.

As salas e localizações exibidas no projeto são informativas e não representam integração com sistemas oficiais da instituição.

## Diretrizes de experiência do usuário

- Navegação intuitiva e consulta rápida.
- Informações agrupadas por contexto.
- Legibilidade, contraste e hierarquia visual.
- Feedback claro para ações e erros.
- Acesso responsivo em diferentes dispositivos.
- Identificação de mudanças sem depender exclusivamente de cores.

## Tecnologias

| Parte | Tecnologia |
| --- | --- |
| Interface | React, Vite e JavaScript |
| Estilização | Tailwind CSS |
| API | NestJS em JavaScript |
| Persistência para apresentação local | Arquivo JSON no backend |
| Integração opcional | Firebase Authentication e Cloud Firestore |

## Execução local

Requisito: Node.js 22 LTS.

Na raiz do projeto, instale as dependências e inicie a aplicação:

```powershell
npm install
npm run dev
```

Abra <http://127.0.0.1:5173>. O frontend usa a API em `http://127.0.0.1:3001/api`. No Windows, também é possível iniciar a apresentação executando `APRESENTAR.cmd`.

O modo local não exige Firebase nem PostgreSQL. Os dados importados são mantidos em `backend/data/local/database.json` e persistem após reiniciar a aplicação. Os PDFs e o manifesto importado ficam no projeto.

### Acesso do coordenador para apresentação local

- **Usuário:** `root`
- **Senha:** `0123456789`

Essa conta é criada para a demonstração local e não deve ser usada como credencial de produção.

## Verificação

```powershell
npm test
npm run test:local
npm run build
```

Para instruções de apresentação em outro notebook e detalhes sobre os dados importados, consulte [docs/APRESENTACAO.md](docs/APRESENTACAO.md). A integração Firebase opcional está descrita em [docs/FIREBASE-REAL.md](docs/FIREBASE-REAL.md).

## Equipe

- Pedro Vitor Barbosa Florentino
- Lara Bezerra de Menezes
- Igor Costa Alcantara de Macedo

**Professor:** João Igor Barros Rocha<br>
**Disciplina:** Interação Humano-Computador<br>
**Instituição:** IFPB — Campus Monteiro

## Observação

Projeto acadêmico em desenvolvimento. O HIFPB não é um serviço oficial do IFPB.
