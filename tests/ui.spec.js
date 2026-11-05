import { test, expect } from "@playwright/test";
test("consulta pública e navegação do protótipo", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Consulta de horários" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Notificações", exact: true }).click();
  await expect(
    page.getByText("Não há nenhum aviso no momento.").last(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("link", { name: "Horários", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Período", { exact: true })).toHaveValue("1");
  await page.getByLabel("Período", { exact: true }).selectOption("2");
  await expect(
    page.getByRole("link").filter({ hasText: "P.O.O" }).first(),
  ).toBeVisible();
  await page.getByLabel("Período", { exact: true }).selectOption("4");
  await page.getByRole("button", { name: "Recolher menu" }).click();
  await expect(page.getByLabel("Período", { exact: true })).toHaveValue("4");
  await page.getByRole("button", { name: "Expandir menu" }).click();
  await page.getByRole("link").filter({ hasText: "B.D 2" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Detalhes — B.D 2" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ver localização da sala" }).click();
  await expect(
    page.getByRole("heading", { name: "Salas do campus" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "B-204", exact: true }),
  ).toBeVisible();
  await page.goto("/horarios?period=4");
  await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Limpar filtros',exact:true}).click();
  await expect(page.getByLabel("Período", { exact: true })).toHaveValue("");
  await page.getByLabel("Curso",{exact:true}).selectOption("ads");await page.getByLabel("Período",{exact:true}).selectOption("1");await page.getByLabel("Turno",{exact:true}).selectOption("night");
  await page.getByLabel("Curso", { exact: true }).selectOption("civil");
  await expect(
    page.getByText(
      "A visualização dos horários de Engenharia Civil ainda não foi implementada.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Entendi" }).click();
  await expect(page.getByLabel("Curso", { exact: true })).toHaveValue("ads");
  await page.getByLabel("Professor", { exact: true }).selectOption("gildo");
  await expect(
    page.getByText(
      "Gildo não possui aulas no 1º período nesta semana.",
    ),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/horarios?period=4");
  await expect(page.getByRole("table")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
