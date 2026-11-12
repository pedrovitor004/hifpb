import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { Button, Icon } from "./components";

const steps = [
  {
    title: "Primeiro, escolha seu curso",
    text: "No início, selecione o curso em que você estuda. Essa escolha libera a consulta.",
  },
  {
    title: "As informações seguem a sua escolha",
    text: "Carregamos os horários, disciplinas e avisos correspondentes ao curso selecionado.",
  },
  {
    title: "Pronto. Agora é só consultar",
    text: "Use o menu para explorar. Para trocar ou desmarcar seu curso, volte ao Início.",
  },
];
export default function CourseTour({ onClose }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    if (paused || step === steps.length - 1) return;
    const timer = setTimeout(() => setStep((value) => value + 1), 6500);
    return () => clearTimeout(timer);
  }, [paused, step]);
  function next() {
    if (step === steps.length - 1) onClose();
    else setStep((value) => value + 1);
  }
  return (
    <Modal
      title="Sua consulta começa pelo curso"
      description="Um guia rápido para encontrar as informações certas."
      icon="schedule"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="tour-skip">
            Pular apresentação
          </button>
          <Button onClick={next}>
            {step === steps.length - 1 ? "Escolher meu curso" : "Próximo"}
            <Icon name="arrow" size={16} />
          </Button>
        </>
      }
    >
      <div className="course-tour">
        <div className="tour-scene" key={step} aria-hidden="true">
          <div className="tour-example-label">
            <span className="tour-window-dots">
              <i />
              <i />
              <i />
            </span>
            <span>Exemplo da consulta</span>
          </div>
          <div className={`tour-demo tour-demo-step-${step}`}>
            {step === 0 ? (
              <>
                <div className="tour-demo-heading">Qual é o seu curso?</div>
                <div className="tour-choice tour-choice-selected">
                  <Icon name="courseAds" size={20} />
                  <span>
                    Análise e Desenvolvimento
                    <br />
                    de Sistemas
                  </span>
                  <Icon name="check" size={17} />
                </div>
                <div className="tour-choice tour-choice-muted">
                  <Icon name="courseCivil" size={20} />
                  <span>Edificações</span>
                  <Icon name="arrow" size={17} />
                </div>
                <span className="tour-pointer">
                  <Icon name="navigation" size={22} />
                </span>
              </>
            ) : (
              <>
                <div className="tour-selected-course">
                  <Icon name="check" size={14} />
                  ADS selecionado
                </div>
                {step === 1 ? (
                  <div className="tour-unlock-grid">
                    {[
                      ["schedule", "Horários"],
                      ["subjects", "Disciplinas"],
                      ["bell", "Avisos"],
                    ].map(([icon, label], index) => (
                      <div
                        key={label}
                        style={{ "--tour-delay": `${index * 150}ms` }}
                      >
                        <span>
                          <Icon name={icon} size={22} />
                        </span>
                        <small>{label}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tour-result-list">
                    {[
                      ["schedule", "Horários da sua turma"],
                      ["subjects", "Disciplinas do curso"],
                      ["bell", "Avisos da coordenação"],
                    ].map(([icon, label], index) => (
                      <div
                        key={label}
                        style={{ "--tour-delay": `${index * 130}ms` }}
                      >
                        <Icon name={icon} size={18} />
                        <span>{label}</span>
                        <Icon name="check" size={15} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="tour-caption" aria-live="polite" aria-atomic="true">
          <span>
            PASSO {step + 1} DE {steps.length}
          </span>
          <h3>{steps[step].title}</h3>
          <p>{steps[step].text}</p>
        </div>
        <div className="tour-controls">
          <div className="tour-step-dots" aria-label="Etapas da apresentação">
            {steps.map((item, index) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Ir para etapa ${index + 1}`}
                aria-current={index === step ? "step" : undefined}
                onClick={() => {
                  setStep(index);
                  setPaused(true);
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="tour-pause"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={paused}
          >
            {paused ? "Retomar animação" : "Pausar animação"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
