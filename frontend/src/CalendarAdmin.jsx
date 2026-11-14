import React, { useEffect, useState } from "react";
import { useData } from "./App";
import { api, documentUrl } from "./firebase";
import { Button, Card, Icon, error, success, confirm } from "./components";
import { currentCalendar, defaultCalendarLinks } from "./calendarConfig";

const today = () => new Date().toLocaleDateString("en-CA");
function initial(calendar, scope) {
  const year = calendar?.year || new Date().getFullYear();
  return {
    title:
      calendar?.title ||
      `Calendário acadêmico ${year} — ${scope === "integrados" ? "Cursos integrados" : "Cursos superiores"}`,
    year,
    version: calendar?.version || "1",
    approvalDate: calendar?.approvalDate || today(),
    validFrom: calendar?.validFrom || `${year}-01-01`,
    validTo: calendar?.validTo || `${year}-12-31`,
    startPage: calendar?.startPage || 1,
    description: calendar?.description || "",
    links: (calendar?.links ?? defaultCalendarLinks).map((l) => ({ ...l })),
  };
}
const fileBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
export default function CalendarAdmin({ profile, onChanged }) {
  const data = useData();
  const [scope, setScope] = useState("superiores");
  const calendar = currentCalendar(data.calendars, scope);
  const [form, setForm] = useState(() => initial(calendar, scope)),
    [file, setFile] = useState(null),
    [uploaded, setUploaded] = useState(null),
    [busy, setBusy] = useState(false),
    [fileKey, setFileKey] = useState(0),
    [failure, setFailure] = useState("");
  useEffect(() => {
    setForm(initial(calendar, scope));
    setFile(null);
    setUploaded(null);
    setFailure("");
    setFileKey((v) => v + 1);
  }, [
    scope,
    calendar?.id,
    calendar?.updatedAt?._seconds,
    calendar?.updatedAt?._nanoseconds,
  ]);
  function change(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFailure("");
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    if (!file && !calendar?.documentId) {
      setFailure("Selecione o PDF do calendário.");
      return;
    }
    setBusy(true);
    setFailure("");
    try {
      let document = uploaded;
      if (file && !document) {
        document = await api("/documents", {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            mimeType: "application/pdf",
            scope,
            base64: await fileBase64(file),
          }),
        });
        setUploaded(document);
      }
      const documentId = document?.id || calendar.documentId;
      const body = {
        ...form,
        year: Number(form.year),
        startPage: Number(form.startPage),
        scope,
        documentId,
        isCurrent: true,
      };
      const replaceDocument = calendar && documentId !== calendar.documentId;
      await api(
        "/calendars" + (calendar && !replaceDocument ? "/" + calendar.id : ""),
        {
          method: calendar && !replaceDocument ? "PUT" : "POST",
          body: JSON.stringify(body),
        },
      );
      await data.load();
      onChanged?.(body);
      success(
        "Calendário publicado. O PDF e os links já estão disponíveis para os alunos.",
      );
    } catch (e) {
      setFailure(e.message);
      await error(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="min-w-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2>Calendários acadêmicos</h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            Atualize o PDF e os documentos de consulta de cada modalidade.
          </p>
        </div>
        <div
          className="inline-flex rounded-xl border border-line bg-canvas p-1"
          aria-label="Modalidade do calendário"
        >
          {[
            ["superiores", "Superior"],
            ["integrados", "Integrado"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              disabled={busy}
              aria-pressed={scope === value}
              onClick={async () => {
                if (
                  JSON.stringify(form) !==
                    JSON.stringify(initial(calendar, scope)) ||
                  file
                ) {
                  if (
                    !(await confirm(
                      "Descartar as alterações não publicadas desta modalidade?",
                    ))
                  )
                    return;
                }
                setScope(value);
              }}
              className={`rounded-lg px-4 py-2 text-xs ${scope === value ? "bg-panel font-semibold text-brand shadow-sm" : "text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={save} className="min-w-0 max-w-4xl space-y-7">
        <fieldset disabled={busy} className="min-w-0 space-y-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <label>
              Título do calendário
              <input
                required
                maxLength={200}
                value={form.title}
                onChange={(e) => change("title", e.target.value)}
              />
            </label>
            <label>
              Ano
              <input
                type="number"
                required
                min="2000"
                max="2100"
                value={form.year}
                onChange={(e) => {
                  const year = e.target.value;
                  setForm((previous) => ({
                    ...previous,
                    year,
                    validFrom: `${year}-01-01`,
                    validTo: `${year}-12-31`,
                  }));
                }}
              />
            </label>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <label>
              PDF do calendário
              <input
                key={fileKey}
                type="file"
                accept="application/pdf,.pdf"
                required={!calendar?.documentId}
                onChange={(e) => {
                  const next = e.target.files?.[0];
                  if (
                    next &&
                    (!/\.pdf$/i.test(next.name) || next.size > 8 * 1024 * 1024)
                  ) {
                    setFailure("Selecione um PDF de até 8 MB.");
                    e.target.value = "";
                    setFile(null);
                    return;
                  }
                  setFile(next || null);
                  setUploaded(null);
                  setFailure("");
                }}
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-muted">
              PDF de até 8 MB, sem senha. A versão anterior é preservada ao
              substituir o documento.
            </p>
            {calendar?.documentId && (
              <a
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-brand"
                href={documentUrl(calendar.documentId)}
                target="_blank"
                rel="noreferrer"
              >
                Abrir PDF atual
                <Icon name="open" size={14} />
              </a>
            )}
          </div>
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm">Documentos de consulta</h3>
              <button
                type="button"
                disabled={form.links.length >= 8}
                onClick={() =>
                  change("links", [...form.links, { label: "", url: "" }])
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand disabled:opacity-40"
              >
                <Icon name="plus" size={15} />
                Adicionar link
              </button>
            </div>
            <div className="space-y-3">
              {form.links.map((link, index) => (
                <div
                  key={index}
                  className="grid items-end gap-3 rounded-xl border border-line p-4 sm:grid-cols-[1fr_1.5fr_auto]"
                >
                  <label>
                    Nome do link {index + 1}
                    <input
                      required
                      maxLength={200}
                      value={link.label}
                      onChange={(e) =>
                        change(
                          "links",
                          form.links.map((l, i) =>
                            i === index ? { ...l, label: e.target.value } : l,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Endereço do link {index + 1}
                    <input
                      required
                      maxLength={2000}
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) =>
                        change(
                          "links",
                          form.links.map((l, i) =>
                            i === index ? { ...l, url: e.target.value } : l,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    aria-label={`Remover link ${index + 1}`}
                    onClick={() =>
                      change(
                        "links",
                        form.links.filter((_, i) => i !== index),
                      )
                    }
                    className="flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs text-muted hover:bg-canvas hover:text-red-600"
                  >
                    <Icon name="trash" size={16} />
                    <span className="sm:sr-only">Remover</span>
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Use endereços HTTPS. Até oito links por calendário.
            </p>
          </section>
          <details className="rounded-xl border border-line p-4">
            <summary className="cursor-pointer text-xs font-semibold text-muted">
              Versão, vigência e apresentação
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                Versão
                <input
                  required
                  maxLength={200}
                  value={form.version}
                  onChange={(e) => change("version", e.target.value)}
                />
              </label>
              <label>
                Data de aprovação
                <input
                  type="date"
                  required
                  value={form.approvalDate}
                  onChange={(e) => change("approvalDate", e.target.value)}
                />
              </label>
              <label>
                Início da vigência
                <input
                  type="date"
                  required
                  value={form.validFrom}
                  onChange={(e) => change("validFrom", e.target.value)}
                />
              </label>
              <label>
                Fim da vigência
                <input
                  type="date"
                  required
                  min={form.validFrom}
                  value={form.validTo}
                  onChange={(e) => change("validTo", e.target.value)}
                />
              </label>
              <label>
                Página inicial do PDF
                <input
                  type="number"
                  min="1"
                  max={uploaded?.pageCount || 10000}
                  required
                  value={form.startPage}
                  onChange={(e) => change("startPage", e.target.value)}
                />
              </label>
              <label className="sm:col-span-2">
                Observações para os alunos
                <textarea
                  maxLength={2000}
                  rows={3}
                  value={form.description}
                  onChange={(e) => change("description", e.target.value)}
                />
              </label>
            </div>
          </details>
        </fieldset>
        {failure && (
          <p role="alert" className="text-sm text-red-600">
            {failure}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <p className="max-w-lg text-xs leading-5 text-muted">
            {file
              ? "A publicação de um novo PDF cria uma versão independente. As datas do documento anterior não são copiadas."
              : "As alterações afetam apenas a modalidade selecionada."}
          </p>
          <Button type="submit" disabled={busy}>
            <Icon name="publish" size={16} />
            {busy ? "Publicando…" : "Publicar calendário"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
