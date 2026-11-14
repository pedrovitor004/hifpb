const { test, expect } = require("@playwright/test");
const academic = require("../backend/data/academic-2026.json");
const course =
  academic.courses.find((item) => item.id === "ads") || academic.courses[0];
const lesson = academic.lessons.find((item) => item.courseId === course.id);
const fixtures = {
  ...academic,
  rooms: [
    {
      id: "mobile-room",
      name: "Laboratório de Informática e Desenvolvimento de Sistemas",
      block: "Bloco de Ensino e Tecnologia",
      type: "Laboratório",
      location: "Segundo andar, próximo à coordenação acadêmica",
    },
  ],
  lessons: academic.lessons.map((item) => ({ ...item, roomId: "mobile-room" })),
  notices: [
    {
      id: "mobile-notice",
      title: "Atualização dos horários e orientações para as turmas do curso",
      message:
        "Confira a programação atualizada e as informações das disciplinas. ".repeat(
          12,
        ),
      courseId: course.id,
      audience: "course",
      category: "informacao",
    },
  ],
  calendars: [
    {
      id: "mobile-calendar",
      title:
        "Calendário acadêmico dos cursos superiores e programação das atividades do campus",
      scope: "superiores",
      year: 2026,
      version: "2026.2",
      documentId: "calendar",
      validFrom: "2026-01-01",
      validTo: "2026-12-31",
      approvalDate: "2026-01-01",
      isCurrent: true,
    },
  ],
  calendarEvents: [],
  drafts: [],
};
async function prepare(page, coordinator) {
  await page.addInitScript((id) => {
    localStorage.setItem("hifpb-course", id);
    localStorage.setItem("hifpb-tour-seen-v1", "true");
  }, course.id);
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/", "");
    const user = {
      id: "mobile-coordinator",
      role: "coordinator",
      courseIds: [],
    };
    return route.fulfill({
      json:
        path === "auth/session"
          ? { user: coordinator ? user : null }
          : path === "auth/me"
            ? user
            : fixtures[path] || [],
    });
  });
}
async function fits(page, width, description) {
  await expect(page.locator("#main")).toBeVisible();
  await expect(page.getByRole("heading").first()).toBeVisible();
  const size = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  const overflow =
    size.width > width
      ? await page.locator("#main").evaluate((main) =>
          [...main.querySelectorAll("*")]
            .map((element) => ({
              tag: element.tagName,
              className: element.className,
              right: Math.round(element.getBoundingClientRect().right),
              width: Math.round(element.getBoundingClientRect().width),
              scroll: getComputedStyle(element).overflowX,
            }))
            .filter(
              (element) => element.right > innerWidth && element.width > 0,
            )
            .slice(0, 8),
        )
      : [];
  expect(
    size.width,
    `${description}: ${JSON.stringify(overflow)}`,
  ).toBeLessThanOrEqual(width);
}
for (const width of [320, 390, 768]) {
  test(`consulta pública se adapta a ${width}px com dados reais`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 844 });
    await prepare(page, false);
    const failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    for (const path of [
      "/",
      "/horarios",
      "/disciplinas",
      "/salas",
      "/professores",
      "/avisos",
      "/calendario",
      `/aulas/${lesson.id}`,
      "/entrar",
    ]) {
      await page.goto(path);
      await fits(page, width, path);
      if (path === "/professores" && width === 390)
        await page.screenshot({
          path: testInfo.outputPath("professores-mobile.png"),
          fullPage: false,
        });
    }
    expect(failures).toEqual([]);
  });
  test(`coordenação e formulários se adaptam a ${width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 844 });
    await prepare(page, true);
    const failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    for (const tab of [
      "lessons",
      "drafts",
      "courses",
      "classes",
      "subjects",
      "professors",
      "rooms",
      "notices",
      "calendars",
    ]) {
      await page.goto(`/admin?tab=${tab}`);
      await expect(
        page.getByRole("heading", { name: "Painel da coordenação" }),
      ).toBeVisible();
      await fits(page, width, tab);
      if (tab !== "calendars") {
        await page
          .getByRole("button", {
            name:
              tab === "lessons" || tab === "drafts"
                ? "Novo horário"
                : /^Cadastrar/,
          })
          .click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        const bounds = await dialog.boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
        expect(
          await dialog.evaluate(
            (element) => element.scrollWidth - element.clientWidth,
          ),
        ).toBeLessThanOrEqual(1);
        await expect(
          dialog.getByRole("button", { name: "Cancelar", exact: true }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
      }
      if (tab === "professors" && width === 390)
        await page.screenshot({
          path: testInfo.outputPath("coordenacao-mobile.png"),
          fullPage: true,
        });
    }
    if (width < 768) {
      await page
        .getByRole("button", { name: "Abrir menu", exact: true })
        .click();
      await expect(
        page.getByRole("navigation", { name: "Gestão da coordenação" }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Horários", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Abrir menu", exact: true }),
      ).toHaveAttribute("aria-expanded", "false");
    }
    expect(failures).toEqual([]);
  });
}

test("formulários e aviso opcional mantêm controles acessíveis com pouco espaço vertical", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, true);
  await page.goto("/admin?tab=subjects");
  await page
    .getByRole("button", { name: "Editar", exact: true })
    .first()
    .click();
  const form = page.getByRole("dialog");
  await expect(form.getByLabel("Nome", { exact: true })).toHaveCSS(
    "font-size",
    "16px",
  );
  await form
    .getByLabel("Nome", { exact: true })
    .fill("Disciplina com programação atualizada");
  await page.setViewportSize({ width: 390, height: 480 });
  await expect(
    form.getByRole("button", { name: "Salvar registro", exact: true }),
  ).toBeVisible();
  await form
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
    composer.getByRole("button", { name: "Continuar sem aviso", exact: true }),
  ).toBeVisible();
  expect(
    await composer.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await composer.getByRole("radio", { name: "Alteração", exact: true }).check();
  await composer
    .getByRole("button", { name: "Continuar sem aviso", exact: true })
    .click();
  await expect(composer).toHaveCount(0);
});

test("menu público e tema escuro funcionam na consulta pelo celular", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page, false);
  await page.goto("/horarios");
  await page
    .getByRole("dialog", { name: "Avisos da coordenação", exact: true })
    .getByRole("button", { name: "Agora não", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ativar modo escuro", exact: true })
    .click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    page.getByRole("region", { name: "Agenda por dia", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page.getByRole("button", { name: "Acadêmico", exact: true }).click();
  await page.getByRole("link", { name: "Professores", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Professores", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Abrir menu", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
