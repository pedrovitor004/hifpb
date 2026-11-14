import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { Button, Icon } from "./components";
import "./coordinatorTour.css";
import "./coordinatorTourLayout.css";
import AnimatedGuideCharacter from "./GuideCharacter";

const steps = [
  {
    menu: "Cursos",
    action: "Cadastrar cursos",
    title: "Comece pelo curso",
    text: "No menu lateral, clique em Cursos e depois em Cadastrar cursos. Preencha nome, sigla e modalidade. Se o curso já existe, siga para a turma.",
    fields: [
      ["Nome", "Análise e Desenvolvimento de Sistemas"],
      ["Sigla", "ADS"],
      ["Modalidade", "Superior"],
    ],
    result: "Curso cadastrado",
    icon: "graduation",
  },
  {
    menu: "Turmas",
    action: "Cadastrar turmas",
    title: "Crie a turma dentro do curso",
    text: "Clique em Turmas → Cadastrar turmas. Selecione o curso, dê um nome à turma e informe o período. É essa turma que receberá as aulas.",
    fields: [
      ["Nome", "ADS · 4º período"],
      ["Curso", "Análise e Desenvolvimento de Sistemas"],
      ["Período", "4º período"],
    ],
    result: "Turma vinculada ao curso",
    icon: "detailUsers",
  },
  {
    menu: "Disciplinas",
    action: "Cadastrar disciplinas",
    title: "Cadastre as disciplinas do curso",
    text: "Clique em Disciplinas → Cadastrar disciplinas. Informe nome, sigla, curso e cor. O professor e a sala serão escolhidos ao criar o horário dessa disciplina.",
    fields: [
      ["Nome", "Banco de Dados II"],
      ["Sigla", "BD2"],
      ["Curso / cor", "ADS · Azul"],
    ],
    result: "Disciplina pronta para receber aulas",
    icon: "subjects",
  },
  {
    menu: "Professores",
    action: "Cadastrar professores",
    title: "Prepare o perfil do professor",
    text: "Clique em Professores → Cadastrar professores. Informe nome e, se disponíveis, titulação e link do currículo Lattes. A sala pertence à aula, por isso não é definida neste cadastro.",
    fields: [
      ["Nome", "Ana Souza · exemplo"],
      ["Titulação (opcional)", "Doutorado"],
      ["Currículo Lattes (opcional)", "Link do currículo"],
    ],
    result: "Professor disponível para vincular à aula",
    icon: "professors",
  },
  {
    menu: "Salas",
    action: "Cadastrar salas",
    title: "Confira os ambientes disponíveis",
    text: "Em Salas, confira se o ambiente já existe. Se precisar, clique em Cadastrar salas e informe identificação, bloco, tipo e localização. A escolha da sala para a disciplina acontece no horário.",
    fields: [
      ["Identificação", "B-204"],
      ["Bloco / tipo", "Bloco B · Sala de aula"],
      ["Localização", "2º andar"],
    ],
    result: "Sala disponível para as aulas",
    icon: "rooms",
  },
  {
    menu: "Horários",
    action: "Novo horário",
    title: "Agora vincule disciplina, professor e sala",
    text: "Em Horários → Novo horário, escolha curso, turma e disciplina. Vincule professor e sala; defina dia, início, fim e vigência. Clique em Salvar rascunho. Professor e sala podem ser completados depois.",
    fields: [
      ["Curso / turma / disciplina", "ADS · 4º período · BD2"],
      ["Docente / sala", "Ana Souza · B-204"],
      ["Dia / horário / vigência", "Terça · 18:30–20:10 · semestre atual"],
    ],
    result: "Rascunho salvo · ainda não está público",
    icon: "schedule",
  },
  {
    menu: "Rascunhos",
    action: "Editar",
    title: "Revise e publique para os alunos",
    text: "Em Rascunhos, clique no lápis da aula, confira e selecione Revisar e publicar. Se editar, salve e reabra a revisão. Confirme para liberar a consulta pública. O aviso ao curso é opcional: escolha a categoria e revise a mensagem antes de enviá-lo.",
    fields: [
      ["Disciplina / turma", "BD2 · ADS 4º período"],
      ["Professor / sala", "Ana Souza · B-204"],
      ["Aula recorrente", "Terça-feira · 18:30–20:10"],
    ],
    result: "Horário publicado na consulta pública",
    icon: "publish",
  },
];

export default function CoordinatorTour({ onClose }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const item = steps[step];
  useEffect(() => {
    if (paused || step === steps.length - 1) return;
    const timer = setTimeout(() => setStep((value) => value + 1), 12000);
    return () => clearTimeout(timer);
  }, [step, paused]);
  function goTo(index) {
    setStep(index);
    setPaused(true);
  }
  return (
    <Modal
      wide
      className="coordinator-guide-modal"
      title="Como criar e publicar um horário"
      description="Acompanhe os cliques no painel. Os dados da demonstração são exemplos."
      icon="schedule"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="tour-skip" onClick={onClose}>
            Fechar guia
          </button>
          <Button
            secondary
            disabled={step === 0}
            onClick={() => goTo(step - 1)}
          >
            Voltar
          </Button>
          <Button
            onClick={() =>
              step === steps.length - 1 ? onClose() : goTo(step + 1)
            }
          >
            {step === steps.length - 1 ? "Concluir" : "Próximo"}
            <Icon name="arrow" size={16} />
          </Button>
        </>
      }
    >
      <div className={`coordinator-tour ${paused ? "guide-paused" : ""}`}>
        <nav
          className="guide-steps"
          aria-label="Etapas do fluxo da coordenação"
        >
          {steps.map((entry, index) => (
            <button
              key={entry.menu}
              type="button"
              aria-current={step === index ? "step" : undefined}
              aria-label={`Etapa ${index + 1}: ${entry.menu}`}
              onClick={() => goTo(index)}
            >
              <span className="guide-step-symbol">
                <Icon name={entry.icon} size={20} />
                <small>
                  {index < step ? <Icon name="check" size={10} /> : index + 1}
                </small>
              </span>
              <strong>{entry.menu}</strong>
              <em>
                {index === step
                  ? "Você está aqui"
                  : index < step
                    ? "Etapa anterior"
                    : index < 5
                      ? "Cadastro"
                      : index === 5
                        ? "Montagem"
                        : "Publicação"}
              </em>
            </button>
          ))}
        </nav>
        <div className="guide-stage" key={step} aria-hidden="true">
          <div className="tour-example-label">
            <span className="tour-window-dots">
              <i />
              <i />
              <i />
            </span>
            <span>DEMONSTRAÇÃO · nenhuma alteração será salva</span>
          </div>
          <div className="guide-workspace">
            <div className="guide-sidebar">
              <strong>
                HIFPB <small>Coordenação</small>
              </strong>
              {steps.map((entry) => (
                <div
                  key={entry.menu}
                  className={
                    entry.menu === item.menu ? "guide-menu-active" : ""
                  }
                >
                  <Icon name={entry.icon} size={14} />
                  <span>{entry.menu}</span>
                  {entry.menu === item.menu && (
                    <span className="guide-menu-click" />
                  )}
                </div>
              ))}
            </div>
            <div className="guide-content">
              <div className="guide-toolbar">
                <strong>{item.menu}</strong>
                <span className="guide-create">
                  {item.action}
                  <span className="guide-cursor">
                    <Icon name="navigation" size={23} />
                  </span>
                </span>
              </div>
              <div className="guide-placeholder">
                <span />
                <span />
                <span />
              </div>
              <div className="guide-form">
                <div className="guide-form-title">
                  <Icon name={item.icon} size={16} />
                  <strong>
                    {step === 6 ? "Revisar horário" : item.action}
                  </strong>
                  <Icon name="close" size={12} />
                </div>
                {item.fields.map(([label, value], index) => (
                  <div
                    className="guide-field"
                    key={label}
                    style={{ "--field-delay": `${2.4 + index * 0.65}s` }}
                  >
                    <small>{label}</small>
                    <div>
                      <span>{value}</span>
                      <i />
                    </div>
                  </div>
                ))}
                <div className="guide-save">
                  {step === 6
                    ? "Revisar e publicar"
                    : step === 5
                      ? "Salvar rascunho"
                      : "Salvar registro"}
                  <span className="guide-save-cursor">
                    <Icon name="navigation" size={23} />
                  </span>
                </div>
              </div>
              <div className="guide-success">
                <Icon name="check" size={16} />
                {item.result}
              </div>
            </div>
          </div>
        </div>
        <div className="guide-explanation">
          <div className="guide-character">
            <AnimatedGuideCharacter step={step} />
          </div>
          <div className="tour-caption" aria-live="polite" aria-atomic="true">
            <span>
              PASSO {step + 1} DE {steps.length} ·{" "}
              {step < 5 ? "PREPARAR" : step === 5 ? "MONTAR" : "PUBLICAR"}
            </span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </div>
        <div className="tour-controls">
          <span className="guide-progress-label">
            {paused ? "Avance no seu ritmo" : "Próxima etapa automaticamente"}
          </span>
          <button
            type="button"
            className="tour-pause"
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Retomar apresentação" : "Pausar apresentação"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
