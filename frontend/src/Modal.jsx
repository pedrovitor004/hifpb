import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./components";
export default function Modal({
  title,
  description,
  icon = "subjects",
  onClose,
  children,
  footer,
  wide = false,
  className = "",
}) {
  const dialog = useRef(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const el = dialog.current,
      previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    el.querySelector("input,select,button,textarea,a")?.focus();
    const key = (e) => {
      if (document.querySelector(".swal2-container")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        const all = [
          ...el.querySelectorAll(
            "a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)",
          ),
        ].filter((v) => v.getClientRects().length);
        if (!all.length) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === all[0]) {
          e.preventDefault();
          all.at(-1).focus();
        }
        if (!e.shiftKey && document.activeElement === all.at(-1)) {
          e.preventDefault();
          all[0].focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) close.current();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[3px]"
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        className={`max-h-[90dvh] w-full overflow-hidden rounded-[20px] border border-line bg-panel text-ink shadow-float ${wide ? "max-w-[780px]" : "max-w-[540px]"} ${className}`}
      >
        <div className="modal-layout flex max-h-[90dvh] flex-col">
          <div className="modal-header flex shrink-0 items-start gap-3 border-b border-line px-5 py-5 sm:px-7">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-canvas">
              <Icon name={icon} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="modal-title" className="text-lg font-bold tracking-tight">
                {title}
              </h2>
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-xs leading-5 text-muted"
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-muted transition hover:border-line hover:bg-canvas"
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="modal-body min-h-0 overflow-y-auto px-5 py-6 sm:px-7">
            {children}
          </div>
          {footer && (
            <div className="modal-footer flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-line bg-surface px-5 py-4 sm:px-7">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
