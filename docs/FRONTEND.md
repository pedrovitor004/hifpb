# Interface HIFPB

A interface mantém a identidade verde do protótipo e utiliza componentes compartilhados de botões, campos, cards, filtros, modais e mensagens. O modo escuro usa tokens semânticos, segue a preferência do sistema na primeira visita e permite alternância no cabeçalho. Apenas a preferência visual fica no localStorage; tokens de autenticação continuam gerenciados pelo SDK Firebase.

Os cards de orientação e de consulta do início abrem modais. O usuário seleciona um período antes de abrir horários, salas ou professores. A página de disciplinas tem busca e detalhes em modal. Avisos podem ser lidos integralmente em uma janela própria.

Ícones Lucide identificam ações e entidades: sala de aula, laboratório, ADS, Engenharia Civil, banco de dados, programação, idiomas, matemática e redes. Os rótulos são mantidos para não depender exclusivamente de símbolos.

No celular, o menu abre como painel lateral com fundo escurecido, contenção de foco, Escape e retorno de foco. As etapas do início usam rolagem horizontal e a grade semanal mantém rolagem localizada. Modais têm altura limitada e corpo rolável. A preferência de movimento reduzido é respeitada.

Os filtros de horários ficam na URL. **Limpar filtros** pede confirmação, esvazia os campos e oculta os resultados até uma nova seleção. Esse comportamento também se aplica a salas, professores, disciplinas e administração. A limpeza não exclui registros do banco.

Disciplinas usam na borda superior a mesma cor persistida da grade. Laboratórios de ADS usam ícone de computador. A grade semanal ocupa uma área maior; a visualização em lista apresenta uma tabela cronológica com opção de impressão e estilos específicos para papel.

A coordenação usa tabela de registros com busca, filtros, estados de publicação e ações identificadas. Cadastro e edição abrem formulários em modal; alterações não salvas exigem confirmação antes do descarte. Sucessos usam toasts; erros e confirmações usam SweetAlert2 com o mesmo tema.

Validação: `npm run test:ui`, `npm run capture` e `npm run build`. Capturas em `docs/screenshots`. A importação dos PDFs enviados está pendente por decisão do usuário de priorizar a reforma visual. O calendário continua apresentando um aviso informativo até essa etapa.
