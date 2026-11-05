import { test, expect } from "@playwright/test";
test("modo escuro persistente, pesquisa e navegação móvel", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ativar modo escuro" }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(
    page.getByRole("button", { name: "Ativar modo claro" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Buscar no HIFPB" }).fill("B-204");
  await page.getByRole("link").filter({ hasText: "B-204" }).first().click();
  await expect(
    page.getByRole("heading", { name: "B-204", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByRole("link", { name: "Professores", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Professores", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Abrir menu" }),
  ).toHaveAttribute("aria-expanded", "false");
  for (const url of [
    "/",
    "/horarios?period=4",
    "/salas",
    "/professores",
    "/avisos",
    "/entrar",
  ]) {
    await page.goto(url);
    await page.getByRole("heading").first().waitFor();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      url,
    ).toBeTruthy();
  }
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
});
