# HIFPB — Horários e Informações Acadêmicas

Projeto acadêmico da disciplina de **Interação Humano-Computador (IHC)** do **Instituto Federal da Paraíba — Campus Monteiro**.

O HIFPB propõe centralizar a consulta de horários de aulas, salas, professores e avisos acadêmicos em uma interface simples, organizada e acessível.

> **Status:** requisitos levantados e protótipo navegável elaborado. Este repositório contém apenas a documentação inicial; a implementação da aplicação ainda não foi iniciada.

## Problema e objetivo

Informações sobre aulas e mudanças de horários ou salas podem ficar dispersas entre diferentes canais de comunicação, dificultando a consulta e o acompanhamento de atualizações.

O projeto busca facilitar o acesso à programação acadêmica e apresentar alterações e cancelamentos com clareza, apoiando estudantes, professores e a coordenação do curso.

## Levantamento de requisitos

O levantamento inicial foi realizado por meio de um formulário eletrônico no Google Forms, com perguntas objetivas e discursivas. Participaram três integrantes do IFPB Campus Monteiro: dois coordenadores e um estudante.

As respostas apontaram a necessidade de centralizar horários, localização das salas, informações dos professores, calendário acadêmico e avisos sobre mudanças.

## Funcionalidades previstas

- Consultar horários das aulas por curso e período.
- Consultar salas e informações de localização.
- Consultar professores e disciplinas relacionadas.
- Pesquisar horários por professor e curso.
- Visualizar detalhes de aulas e disciplinas.
- Consultar avisos de alterações e cancelamentos.
- Consultar o calendário acadêmico.
- Acompanhar notificações sobre mudanças confirmadas.
- Permitir que coordenadores autorizados gerenciem horários e avisos.

### Perfis de acesso

| Perfil | Acesso previsto |
| --- | --- |
| Público | Consulta de informações acadêmicas sem login. |
| Coordenador | Acesso autenticado para gestão de horários e avisos. |

As permissões de alteração deverão ser verificadas no servidor em cada operação protegida.

## Protótipo

[Acessar o protótipo no Figma](https://www.figma.com/design/KcS6hCiWour0yac6fMvt4C)

O fluxo de demonstração começa na página inicial e permite consultar as grades de ADS do **1º, 2º e 4º períodos**. O detalhamento completo de aula está representado por **B.D 2, do 4º período**, com acesso à tela de salas.

Os filtros de curso, período e professor apresentam opções de navegação. Funcionalidades ainda não implementadas exibem avisos explicativos. O sino de notificações apresenta o estado sem avisos disponíveis.

As salas e suas localizações são ilustrativas. O protótipo não representa uma integração com sistemas oficiais da instituição.

## Diretrizes de experiência do usuário

- Navegação intuitiva e consulta rápida.
- Informações agrupadas por contexto.
- Legibilidade, contraste e hierarquia visual.
- Feedback claro para ações e funcionalidades indisponíveis.
- Acesso responsivo em diferentes dispositivos.
- Identificação de mudanças sem depender exclusivamente de cores.

## Tecnologias planejadas

| Parte | Escolha inicial |
| --- | --- |
| Interface e lógica de servidor | A definir |
| Estilização | A definir |
| Banco de dados | A definir |
| Autenticação | A definir |

Essas tecnologias são o planejamento inicial e ainda não estão configuradas neste repositório.

## Equipe

- Pedro Vitor Barbosa Florentino
- Lara Bezerra de Menezes
- Igor Costa Alcantara de Macedo

**Professor:** João Igor Barros Rocha  
**Disciplina:** Interação Humano-Computador  
**Instituição:** IFPB — Campus Monteiro

## Observação

Projeto acadêmico em desenvolvimento. Este repositório não é um serviço oficial do IFPB e, nesta etapa, não contém código executável nem instruções de instalação.
