import React, { useState } from "react";
import Modal from "./Modal";
import { Button, Icon, Select, error, success } from "./components";
import { categories, CategoryBadge } from "./noticeCategories";
import { api } from "./firebase";
import { useData } from "./App";

export default function ChangeNotice({ change, onClose }) {
  const data = useData();
  const [compose, setCompose] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    courseId: change.courses.length === 1 ? change.courses[0].id : "",
    category: "",
    title: "Atualização acadêmica",
    message: change.message,
  });
  function update(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }
  async function publish(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api("/notices", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          audience: "course",
          lessonId: null,
          occurrenceDate: null,
        }),
      });
    } catch (e) {
      await error(e);
      setBusy(false);
      return;
    }
    // The notice is already saved: a refresh failure must not enable duplicate publication.
    try {
      await data.load();
    } catch (e) {
      await error(e);
    }
    success("Aviso publicado para o curso selecionado.");
    onClose();
  }
  return (
    <Modal
      wide={compose}
      title={
        compose ? "Avisar o curso sobre a alteração" : "Deseja gerar um aviso?"
      }
      description="A alteração já foi salva. Publicar um aviso é opcional."
      icon="bell"
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button secondary disabled={busy} onClick={onClose}>
            {compose ? "Continuar sem aviso" : "Agora não"}
          </Button>
          {compose ? (
            <Button type="submit" form="change-notice-form" disabled={busy}>
              <Icon name="publish" />
              {busy ? "Publicando…" : "Publicar aviso"}
            </Button>
          ) : (
            <Button
              disabled={!change.courses.length}
              onClick={() => setCompose(true)}
            >
              <Icon name="bell" />
              Sim, gerar aviso
            </Button>
          )}
        </>
      }
    >
      {!compose ? (
        <div className="rounded-xl border border-line bg-canvas p-4">
          <p className="text-sm leading-6">{change.message}</p>
          <p className="mt-3 text-xs leading-5 text-muted">
            Se quiser comunicar os alunos, escolha a categoria e revise o texto
            antes de publicar.
            {!change.courses.length
              ? " Não há curso disponível para receber este aviso."
              : change.courses.length === 1
                ? ` O aviso será destinado a ${change.courses[0].name}.`
                : " Selecione o curso que deve receber o aviso."}
          </p>
        </div>
      ) : (
        <form
          id="change-notice-form"
          onSubmit={publish}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Select
            label="Curso que receberá o aviso"
            value={form.courseId}
            onChange={(event) => update("courseId", event.target.value)}
            required
          >
            <option value="">Selecione o curso</option>
            {change.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <fieldset>
              <legend className="mb-3 text-xs font-medium">
                Categoria do aviso (obrigatória ao publicar)
              </legend>
              <div className="notice-category-options">
                {Object.entries(categories).map(([id, category]) => (
                  <label
                    key={id}
                    className={`notice-category-option ${category.tone} ${form.category === id ? "notice-category-option-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="change-notice-category"
                      value={id}
                      required
                      checked={form.category === id}
                      onChange={() => update("category", id)}
                    />
                    <Icon name={category.icon} size={20} />
                    <span>{category.label}</span>
                    <i aria-hidden="true" />
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <label className="sm:col-span-2">
            Título
            <input
              required
              maxLength={200}
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </label>
          <label className="sm:col-span-2">
            Mensagem
            <textarea
              required
              maxLength={5000}
              rows={4}
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
            />
          </label>
          {form.category && (
            <div className="sm:col-span-2 flex items-center gap-3 text-xs text-muted">
              Categoria escolhida
              <CategoryBadge notice={form} />
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
