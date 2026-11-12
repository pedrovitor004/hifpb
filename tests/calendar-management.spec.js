const { test, expect } = require("@playwright/test");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
let child, directory;
const origin = "http://127.0.0.1:3095";
test.beforeEach(async ({ page }) => {
  await page.addLocatorHandler(
    page.getByRole("dialog", {
      name: "Sua consulta começa pelo curso",
      exact: true,
    }),
    async () =>
      page
        .getByRole("button", { name: "Pular apresentação", exact: true })
        .click(),
  );
});
test.beforeAll(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "hifpb-calendar-ui-"));
  child = spawn(process.execPath, [path.resolve("backend/src/main.js")], {
    env: {
      ...process.env,
      DATA_MODE: "local",
      PORT: "3095",
      HIFPB_DATA_FILE: path.join(directory, "database.json"),
      HIFPB_UPLOAD_DIR: path.join(directory, "uploads"),
    },
    stdio: "ignore",
  });
  await expect
    .poll(
      async () => {
        try {
          return (await fetch(origin + "/api/courses")).status;
        } catch {
          return 0;
        }
      },
      { timeout: 20000 },
    )
    .toBe(200);
});
test.beforeEach(async ({ page }) => {
  await page.addLocatorHandler(
    page.locator(".hifpb-notice-summary"),
    async () => page.locator(".hifpb-notice-summary .swal2-cancel").click(),
  );
});
test.afterAll(async () => {
  if (child && child.exitCode === null) {
    const running = child;
    child.kill();
    await new Promise((resolve) => running.once("exit", resolve));
  }
  if (directory) {
    for (const entry of fs.readdirSync(directory)) {
      const file = path.join(directory, entry);
      if (fs.statSync(file).isDirectory()) {
        for (const name of fs.readdirSync(file))
          fs.unlinkSync(path.join(file, name));
        fs.rmdirSync(file);
      } else fs.unlinkSync(file);
    }
    fs.rmdirSync(directory);
  }
});
test("coordenação publica PDFs e links por modalidade; aluno recebe somente seu calendário", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const response = await route.fetch({
      url: origin + url.pathname + url.search,
    });
    await route.fulfill({ response });
  });
  await page.goto("/entrar");
  await page.getByLabel("Usuário", { exact: true }).fill("root");
  await page.getByLabel("Senha", { exact: true }).fill("0123456789");
  await page.getByRole("button", { name: /Entrar/ }).click();
  await expect(page).toHaveURL(/admin/);
  await page.getByRole("link", { name: "Calendários", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Calendários acadêmicos" }),
  ).toBeVisible();
  for (const [modality, title, file] of [
    [
      "Superior",
      "Calendário Superior Atualizado",
      "calendario-academico-2026.pdf",
    ],
    [
      "Integrado",
      "Calendário Integrado Atualizado",
      "calendario-academico-integrados-2026.pdf",
    ],
  ]) {
    await page.getByRole("button", { name: modality, exact: true }).click();
    await page.getByLabel("Título do calendário", { exact: true }).fill(title);
    await page
      .getByLabel("PDF do calendário", { exact: true })
      .setInputFiles(path.resolve("frontend/public/documents/" + file));
    await page
      .getByLabel("Nome do link 1", { exact: true })
      .fill("Guia " + modality);
    await page
      .getByLabel("Endereço do link 1", { exact: true })
      .fill("https://www.ifpb.edu.br/");
    const saved = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/api/calendars" &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Publicar calendário", exact: true })
      .click();
    expect((await saved).status()).toBe(201);
    await expect(
      page.getByRole("button", { name: "Publicar calendário", exact: true }),
    ).toBeEnabled();
  }
  const calendars = await (await fetch(origin + "/api/calendars")).json();
  expect(calendars.filter((c) => c.isCurrent)).toHaveLength(2);
  expect(
    new Set(calendars.filter((c) => c.isCurrent).map((c) => c.documentId)).size,
  ).toBe(2);
  // Link-only edits preserve the current PDF and calendar version.
  await page
    .getByLabel("Nome do link 1", { exact: true })
    .fill("Guia Integrado revisado");
  const edited = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname.startsWith("/api/calendars/") &&
      r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: "Publicar calendário", exact: true })
    .click();
  expect((await edited).status()).toBe(200);
  await expect(
    page.getByRole("button", { name: "Publicar calendário", exact: true }),
  ).toBeEnabled();
  await page.locator(".swal2-toast").waitFor({ state: "hidden" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "tmp/calendar-admin-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "tmp/calendar-admin-mobile.png",
    fullPage: true,
  });
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
    elements: [...document.querySelectorAll("main *")]
      .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
      .slice(0, 12)
      .map((e) => ({
        tag: e.tagName,
        cls: e.className,
        right: e.getBoundingClientRect().right,
      })),
  }));
  expect(overflow.width, JSON.stringify(overflow)).toBeLessThanOrEqual(
    overflow.viewport,
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [course, title, label] of [
    [
      "Análise e Desenvolvimento de Sistemas",
      "Calendário Superior Atualizado",
      "Guia Superior",
    ],
    [
      "Edificações",
      "Calendário Integrado Atualizado",
      "Guia Integrado revisado",
    ],
  ]) {
    await page.goto("/");
    await page
      .getByRole("button")
      .filter({ has: page.getByText(course, { exact: true }) })
      .click();
    await page.goto("/calendario");
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("href", "https://www.ifpb.edu.br/");
    await expect(page.locator("iframe")).toHaveAttribute(
      "src",
      /\/api\/documents\/.*\/content#page=1/,
    );
    await expect(
      page.getByText("Consulte as datas no PDF acima.", { exact: true }),
    ).toBeVisible();
  }
  // Selecting an integrated course does not restrict the coordinator's catalog.
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "Novo registro", exact: true })
    .click();
  await expect(
    page.getByLabel("Curso", { exact: true }).locator("option"),
  ).toHaveCount(7);
  expect(errors).toEqual([]);
});

test("cor da disciplina aceita hexadecimal, escolha visual e cancelamento sem perder a edição", async ({
  page,
}) => {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({
      response: await route.fetch({ url: origin + url.pathname + url.search }),
    });
  });
  await page.goto("/entrar");
  await page.getByLabel("Usuário", { exact: true }).fill("root");
  await page.getByLabel("Senha", { exact: true }).fill("0123456789");
  await page.getByRole("button", { name: /Entrar/ }).click();
  await expect(page).toHaveURL(/admin/);
  await page.getByRole("link", { name: "Disciplinas", exact: true }).click();
  await page
    .getByRole("button", { name: "Editar", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Alterar cor", exact: true }).click();
  await page.getByLabel("Código hexadecimal", { exact: true }).fill("#123ABC");
  await page
    .getByRole("button", { name: "Usar esta cor", exact: true })
    .click();
  await expect(
    page.getByLabel("Cor atual #123ABC", { exact: true }),
  ).toBeVisible();
  const saved = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname.startsWith("/api/subjects/") &&
      r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: "Salvar registro", exact: true })
    .click();
  const response = await saved;
  expect(response.status()).toBe(200);
  const id = new URL(response.url()).pathname.split("/").at(-1);
  expect(
    (await (await fetch(origin + "/api/subjects/" + id)).json()).color,
  ).toBe("#123ABC");
  await page
    .getByRole("button", { name: "Editar", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Alterar cor", exact: true }).click();
  await expect(
    page.getByLabel("Código hexadecimal", { exact: true }),
  ).toHaveValue("#123ABC");
  await page.getByLabel("Código hexadecimal", { exact: true }).fill("#ZZZZZZ");
  await page
    .getByRole("button", { name: "Usar esta cor", exact: true })
    .click();
  await expect(page.locator(".swal2-validation-message")).toBeVisible();
  await page
    .getByLabel("Escolher cor visualmente", { exact: true })
    .fill("#abcdef");
  await expect(
    page.getByLabel("Código hexadecimal", { exact: true }),
  ).toHaveValue("#ABCDEF");
  await page
    .locator(".swal2-popup")
    .screenshot({ path: "tmp/subject-color-picker.png" });
  await page
    .getByRole("button", { name: "Cancelar", exact: true })
    .last()
    .click();
  await expect(
    page.getByLabel("Cor atual #123ABC", { exact: true }),
  ).toBeVisible();
});

test("coordenação publica categorias com ícones e mantém a classificação do aluno", async ({
  page,
}) => {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({
      response: await route.fetch({ url: origin + url.pathname + url.search }),
    });
  });
  await page.goto("/entrar");
  await page.getByLabel("Usuário", { exact: true }).fill("root");
  await page.getByLabel("Senha", { exact: true }).fill("0123456789");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Painel da coordenação", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Avisos", exact: true }).click();
  await page
    .getByRole("button", { name: "Novo registro", exact: true })
    .click();
  await page
    .getByLabel("Título", { exact: true })
    .fill("Aviso categorizado da coordenação");
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("Confira a atualização publicada para a sua turma.");
  await page.getByRole("radio", { name: "Alteração", exact: true }).check();
  await page
    .getByRole("checkbox", {
      name: "Vincular este aviso a uma aula",
      exact: true,
    })
    .uncheck();
  await expect(
    page.locator(".notice-form-preview .notice-category"),
  ).toHaveText("Alteração");
  await expect(
    page.locator(".notice-form-preview .notice-category svg"),
  ).toBeVisible();
  await page.screenshot({
    path: "tmp/admin-notice-category-form.png",
    fullPage: true,
    animations: "disabled",
  });
  const saved = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/notices" &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Salvar registro", exact: true })
    .click();
  expect((await saved).status()).toBe(201);
  const row = page
    .getByRole("row")
    .filter({ hasText: "Aviso categorizado da coordenação" });
  await expect(row.locator(".notice-category")).toHaveText("Alteração");
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByRole("radio", { name: "Cancelamento", exact: true }).check();
  await expect(
    page.locator(".notice-form-preview .notice-category"),
  ).toHaveText("Cancelamento");
  await page
    .getByRole("button", { name: "Salvar registro", exact: true })
    .click();
  await expect(row.locator(".notice-category")).toHaveText("Cancelamento");
  const color = await row
    .locator(".notice-category")
    .evaluate((element) => getComputedStyle(element).color);
  await page.locator(".swal2-toast").waitFor({ state: "hidden" });
  await page.screenshot({
    path: "tmp/admin-notice-categories.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/");
  await page
    .getByRole("button")
    .filter({
      has: page.getByText("Análise e Desenvolvimento de Sistemas", {
        exact: true,
      }),
    })
    .click();
  await page.goto("/avisos");
  const article = page
    .getByRole("article")
    .filter({ hasText: "Aviso categorizado da coordenação" });
  await expect(article.locator(".notice-category")).toHaveText("Cancelamento");
  expect(
    await article
      .locator(".notice-category")
      .evaluate((element) => getComputedStyle(element).color),
  ).toBe(color);
});

test("avisos gerais alcançam todos e alterações ou cancelamentos aparecem na disciplina correta", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({
      response: await route.fetch({ url: origin + url.pathname + url.search }),
    });
  });
  await page.goto("/entrar");
  await page.getByLabel("Usuário", { exact: true }).fill("root");
  await page.getByLabel("Senha", { exact: true }).fill("0123456789");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Painel da coordenação", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Avisos", exact: true }).click();
  async function publish(
    title,
    message,
    { audience = "course", category = "Informação", lesson, date } = {},
  ) {
    await page
      .getByRole("button", { name: "Novo registro", exact: true })
      .click();
    await page.getByLabel("Título", { exact: true }).fill(title);
    await page.getByLabel("Mensagem", { exact: true }).fill(message);
    if (audience === "all")
      await page
        .getByRole("radio", { name: "Todos os cursos", exact: true })
        .check();
    else await page.getByLabel("Curso", { exact: true }).selectOption("ads");
    await page.getByRole("radio", { name: category, exact: true }).check();
    if (lesson) {
      await page
        .getByLabel("Aula afetada", { exact: true })
        .selectOption(lesson);
      await page.getByLabel("Data da aula", { exact: true }).fill(date);
    }
    const response = page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/api/notices" &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Salvar registro", exact: true })
      .click();
    expect((await response).status()).toBe(201);
    await expect(
      page.getByRole("row").filter({ hasText: title }),
    ).toBeVisible();
  }
  await publish(
    "Comunicado geral para o campus",
    "Este comunicado se aplica a todos os cursos.",
    { audience: "all" },
  );
  await publish(
    "Comunicado exclusivo do ADS",
    "Este comunicado pertence apenas ao ADS.",
  );
  const { currentWeekDates } = await import("../frontend/src/lessonNotices.js");
  const dates = currentWeekDates();
  const lessons = await (
    await fetch(origin + "/api/lessons?courseId=ads")
  ).json();
  const target = lessons.find(
    (l) =>
      l.validFrom <= dates[l.weekday - 1] &&
      (!l.validTo || l.validTo >= dates[l.weekday - 1]),
  );
  expect(target).toBeTruthy();
  await publish(
    "Cancelamento de uma aula",
    "A aula foi cancelada para manutenção do laboratório.",
    {
      category: "Cancelamento",
      lesson: target.id,
      date: dates[target.weekday - 1],
    },
  );
  await page.goto("/");
  await page
    .getByRole("button")
    .filter({
      has: page.getByText("Análise e Desenvolvimento de Sistemas", {
        exact: true,
      }),
    })
    .click();
  await page.getByLabel("Turma", { exact: true }).selectOption(target.classId);
  const cancelled = page.getByRole("button", { name: /^Ver cancelamento:/ });
  await expect(cancelled).toBeVisible();
  await expect(cancelled).toContainText("manutenção do laboratório");
  const headers = await page.getByRole("columnheader").allTextContents();
  expect(headers.map((text) => text.trim())).toEqual([
    "Horário",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
  ]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "tmp/schedule-cancelled.png",
    fullPage: true,
    animations: "disabled",
  });
  await cancelled.click();
  await expect(
    page.getByRole("dialog", { name: "Cancelamento de uma aula", exact: true }),
  ).toContainText("A aula foi cancelada");
  await page
    .getByRole("button", { name: "Fechar comunicado", exact: true })
    .click();
  await page.goto("/admin?tab=notices");
  await page
    .getByRole("row")
    .filter({ hasText: "Cancelamento de uma aula" })
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  await page
    .getByLabel("Título", { exact: true })
    .fill("Alteração de sala da aula");
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("A aula acontecerá na sala B-203, no mesmo horário.");
  await page.getByRole("radio", { name: "Alteração", exact: true }).check();
  await page
    .getByRole("button", { name: "Salvar registro", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "Alteração de sala da aula" }),
  ).toBeVisible();
  await page.goto("/horarios?classId=" + target.classId);
  const changed = page.getByRole("button", { name: /^Ver alteração:/ });
  await expect(changed).toBeVisible();
  await expect(changed).toContainText("B-203");
  await expect(
    page.getByRole("button", { name: /^Ver cancelamento:/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Lista", exact: true }).click();
  await changed.click();
  await expect(
    page.getByRole("dialog", {
      name: "Alteração de sala da aula",
      exact: true,
    }),
  ).toContainText("sala B-203");
  await page
    .getByRole("button", { name: "Fechar comunicado", exact: true })
    .click();
  await page.goto("/avisos");
  await expect(
    page.getByRole("heading", {
      name: "Comunicado geral para o campus",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Comunicado exclusivo do ADS",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/");
  await page
    .getByRole("button")
    .filter({ has: page.getByText("Engenharia Civil", { exact: true }) })
    .click();
  await page.goto("/avisos");
  await expect(
    page.getByRole("heading", {
      name: "Comunicado geral para o campus",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Comunicado exclusivo do ADS",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Alteração de sala da aula",
      exact: true,
    }),
  ).toHaveCount(0);
});
