const { test, expect } = require("@playwright/test");
const profile = { id: "coordinator", role: "coordinator", courseIds: [] };
const fixtures = {
  courses: [{ id: "ads", name: "ADS", code: "ADS", level: "superior" }],
  classes: [{ id: "ads-4", name: "ADS 4", courseId: "ads", period: 4 }],
  subjects: [
    { id: "bd2", name: "Banco de Dados II", code: "BD2", courseId: "ads" },
  ],
  professors: [
    {
      id: "ana",
      name: "Ana Souza",
      qualification: "Doutorado",
      lattesUrl: "https://lattes.cnpq.br/1234567890123456",
      roomId: "legacy-room",
    },
  ],
  lessons: [
    {
      id: "aula",
      courseId: "ads",
      classId: "ads-4",
      subjectId: "bd2",
      professorId: "ana",
      roomId: null,
      weekday: 2,
      startTime: "18:30",
      endTime: "20:10",
    },
  ],
};
for (const viewport of [
  { width: 1366, height: 768 },
  { width: 390, height: 844 },
]) {
  test(`guia cabe sem rolagem extra em ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/admin?tab=lessons");
    await page
      .getByRole("button", { name: "Como criar um horário", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Como criar e publicar um horário",
    });
    for (let step = 1; step <= 7; step++) {
      await dialog
        .getByRole("button", { name: new RegExp(`^Etapa ${step}:`) })
        .click();
      const geometry = await dialog
        .locator(".modal-body")
        .evaluate((element) => ({
          content: element.scrollHeight,
          available: element.clientHeight,
        }));
      expect(geometry.content, `Etapa ${step}`).toBeLessThanOrEqual(
        geometry.available + 1,
      );
      await expect(
        dialog.getByRole("button", {
          name: step === 7 ? "Concluir" : "Próximo",
          exact: true,
        }),
      ).toBeVisible();
    }
    await page.screenshot({ path: testInfo.outputPath("guia-sem-scroll.png") });
  });
}
test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/", "");
    const json =
      path === "auth/session"
        ? { user: profile }
        : path === "auth/me"
          ? profile
          : fixtures[path] || [];
    return route.fulfill({ json });
  });
});
test("perfil público mostra titulação e Lattes da professora", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("hifpb-course", "ads"));
  await page.goto("/professores");
  await expect(page.getByText("Doutorado", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Currículo Lattes/ }),
  ).toHaveAttribute("href", "https://lattes.cnpq.br/1234567890123456");
  await expect(
    page.getByText("Sala não informada", { exact: true }),
  ).toBeVisible();
});
test("guia se adapta ao desktop e ao celular", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/admin?tab=lessons");
  await page
    .getByRole("button", { name: "Como criar um horário", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Como criar e publicar um horário",
  });
  await dialog
    .getByRole("button", { name: "Etapa 6: Horários", exact: true })
    .click();
  await page.screenshot({ path: testInfo.outputPath("guia-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    dialog.getByRole("button", { name: "Próximo", exact: true }),
  ).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: testInfo.outputPath("guia-mobile.png") });
});
test("guia pode ser reaberto, navega por sete etapas e respeita movimento reduzido", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/admin?tab=lessons");
  const trigger = page.getByRole("button", {
    name: "Como criar um horário",
    exact: true,
  });
  await expect(trigger).toHaveClass(/coordinator-guide-unseen/);
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Como criar e publicar um horário",
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Comece pelo curso" }),
  ).toBeVisible();
  for (let index = 2; index <= 7; index++) {
    await dialog.getByRole("button", { name: "Próximo", exact: true }).click();
    await expect(
      dialog.getByText(`PASSO ${index} DE 7`, { exact: false }),
    ).toBeVisible();
  }
  await dialog.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(
    dialog.getByRole("heading", {
      name: "Agora vincule disciplina, professor e sala",
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).not.toHaveClass(/coordinator-guide-unseen/);
  await page.reload();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await expect(trigger).not.toHaveClass(/coordinator-guide-unseen/);
});
test("edição docente salva perfil sem sala de referência", async ({ page }) => {
  let saved;
  await page.route("**/api/professors/ana", async (route) => {
    saved = route.request().postDataJSON();
    await route.fulfill({ json: { id: "ana", ...saved } });
  });
  await page.goto("/admin?tab=professors");
  await page
    .getByRole("row")
    .filter({ hasText: "Ana Souza" })
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Sala de referência")).toHaveCount(0);
  await expect(dialog.getByLabel("Titulação", { exact: true })).toHaveValue(
    "Doutorado",
  );
  await dialog
    .getByLabel("Titulação", { exact: true })
    .selectOption("Mestrado");
  await dialog
    .getByLabel("Currículo Lattes", { exact: true })
    .fill("https://lattes.cnpq.br/9876543210987654");
  await dialog
    .getByRole("button", { name: "Salvar registro", exact: true })
    .click();
  const offer = page.getByRole("dialog", {
    name: "Deseja gerar um aviso?",
    exact: true,
  });
  await expect(offer).toBeVisible();
  await offer.getByRole("button", { name: "Agora não", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(saved.qualification).toBe("Mestrado");
  expect(saved.lattesUrl).toBe("https://lattes.cnpq.br/9876543210987654");
  expect(saved).not.toHaveProperty("roomId");
});

test("aviso após alteração é opcional, exige categoria e fica restrito ao curso afetado", async ({
  page,
}) => {
  const notices = [];
  await page.route("**/api/notices*", async (route) => {
    if (route.request().method() === "POST")
      notices.push(route.request().postDataJSON());
    await route.fulfill({
      json: route.request().method() === "POST" ? { id: "novo-aviso" } : [],
    });
  });
  await page.route("**/api/professors/ana", (route) =>
    route.fulfill({ json: { id: "ana" } }),
  );
  await page.route("**/api/courses", (route) =>
    route.fulfill({
      json: [
        ...fixtures.courses,
        { id: "civil", name: "Engenharia Civil", code: "CIVIL" },
      ],
    }),
  );
  await page.goto("/admin?tab=professors");
  await page
    .getByRole("row")
    .filter({ hasText: "Ana Souza" })
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nome", { exact: true })
    .fill("Ana Souza Atualizada");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar registro", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Deseja gerar um aviso?", exact: true })
    .getByRole("button", { name: "Sim, gerar aviso", exact: true })
    .click();
  const composer = page.getByRole("dialog", {
    name: "Avisar o curso sobre a alteração",
    exact: true,
  });
  await expect(
    composer.getByLabel("Curso que receberá o aviso", { exact: true }),
  ).toHaveValue("ads");
  await expect(
    composer
      .getByLabel("Curso que receberá o aviso", { exact: true })
      .locator("option"),
  ).toHaveCount(2);
  await composer
    .getByRole("button", { name: "Publicar aviso", exact: true })
    .click();
  await expect(composer).toBeVisible();
  expect(notices).toHaveLength(0);
  await composer.getByRole("radio", { name: "Alteração", exact: true }).check();
  await composer
    .getByRole("button", { name: "Publicar aviso", exact: true })
    .click();
  await expect(composer).toHaveCount(0);
  expect(notices).toHaveLength(1);
  expect(notices[0]).toMatchObject({
    courseId: "ads",
    audience: "course",
    category: "alteracao",
  });
});
