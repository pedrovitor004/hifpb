import React, { useEffect, useState } from "react";
import { Icon } from "./components";
export default function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    localStorage.getItem("hifpb-theme")
      ? localStorage.getItem("hifpb-theme") === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("hifpb-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button
      type="button"
      onClick={() => setDark((v) => !v)}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro"}
      aria-pressed={dark}
      className="flex size-10 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-lg text-brand transition hover:bg-canvas"
    >
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}
