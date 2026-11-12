const { test, expect } = require("@playwright/test");
const academic = new Set([
  "classes",
  "subjects",
  "professors",
  "rooms",
  "lessons",
  "notices",
  "calendars",
  "calendarEvents",
]);
function trackAcademic(page) {
  const requests = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (academic.has(url.pathname.replace("/api/", ""))) requests.push(url);
  });
  return requests;
}

for (const action of ["Pular apresentação", "Fechar janela", "concluir"]) {
  test(`tutorial aparece uma vez ao ${action} e permite reabertura manual`, async ({
    page,
    context,
  }) => {
    await page.goto("/");
    const tour = page.getByRole("dialog", {
      name: "Sua consulta começa pelo curso",
      exact: true,
    });
    await expect(tour).toBeVisible();
    if (action === "concluir") {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await tour
        .getByRole("button", { name: "Ir para etapa 3", exact: true })
        .click();
      await tour
        .getByRole("button", { name: "Escolher meu curso", exact: true })
        .click();
    } else {
      await tour.getByRole("button", { name: action, exact: true }).click();
    }
    await expect(tour).toHaveCount(0);
    expect(
      await page.evaluate(() => localStorage.getItem("hifpb-tour-seen-v1")),
    ).toBe("true");
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Qual é o seu curso?", exact: true }),
    ).toBeVisible();
    await expect(tour).toHaveCount(0);
    const nextPage = await context.newPage();
    await nextPage.goto("/");
    await expect(
      nextPage.getByRole("heading", {
        name: "Qual é o seu curso?",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      nextPage.getByRole("dialog", {
        name: "Sua consulta começa pelo curso",
        exact: true,
      }),
    ).toHaveCount(0);
    await nextPage.close();
    await page
      .getByRole("button", { name: "Como funciona", exact: true })
      .click();
    await expect(tour).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tour).toHaveCount(0);
  });
}

test("apresentação explica o fluxo sem carregar dados antes da seleção", async ({
  page,
}) => {
  test.setTimeout(90000);
  const requests = trackAcademic(page);
  await page.route("**/api/notices*", (route) => route.fulfill({ json: [] }));
  await page.goto("/");
  const tour = page.getByRole("dialog", {
    name: "Sua consulta começa pelo curso",
    exact: true,
  });
  await expect(tour).toBeVisible();
  await page
    .getByRole("button", { name: "Pausar animação", exact: true })
    .click();
  await expect(
    tour.getByRole("heading", {
      name: "Primeiro, escolha seu curso",
      exact: true,
    }),
  ).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.getByRole("button", { name: "Próximo", exact: true }).click();
  await expect(
    tour.getByRole("heading", {
      name: "As informações seguem a sua escolha",
      exact: true,
    }),
  ).toBeVisible();
  await tour.screenshot({
    path: "tmp/course-tour.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Próximo", exact: true }).click();
  await expect(
    tour.getByRole("heading", {
      name: "Pronto. Agora é só consultar",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Escolher meu curso", exact: true })
    .click();
  await expect(tour).toHaveCount(0);
  await expect(
    page.getByRole("note", { name: "Seleção de curso necessária" }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "tmp/entry-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Ativar modo escuro", exact: true })
    .click();
  await page.screenshot({
    path: "tmp/entry-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Ativar modo claro", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () =>
      page
        .locator("main#main")
        .evaluate((element) => element.getBoundingClientRect().left),
    )
    .toBe(0);
  await page.screenshot({
    path: "tmp/entry-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(requests).toHaveLength(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/professores");
  await expect(page).toHaveURL(/\/professores$/);
  await expect(
    page.getByRole("heading", {
      name: "Selecione seu curso para continuar",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "tmp/course-gate-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () =>
      page
        .locator("main#main")
        .evaluate((element) => element.getBoundingClientRect().left),
    )
    .toBe(0);
  await page.screenshot({
    path: "tmp/course-gate-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(requests).toHaveLength(0);
  await page
    .getByRole("link", { name: "Selecionar curso", exact: true })
    .click();
  await expect(tour).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("Selecione um curso");
  await page
    .getByRole("button")
    .filter({
      has: page.getByText("Análise e Desenvolvimento de Sistemas", {
        exact: true,
      }),
    })
    .click();
  await expect(page.getByLabel("Turma", { exact: true })).toBeVisible();
  expect(requests.length).toBeGreaterThan(0);
  expect(
    requests.every((url) => url.searchParams.get("courseId") === "ads"),
  ).toBe(true);
  await page.goto("/");
  await expect(tour).toHaveCount(0);
  await page
    .getByRole("button", { name: "Como funciona", exact: true })
    .click();
  await expect(tour).toBeVisible();
  await page
    .getByRole("button", { name: "Pular apresentação", exact: true })
    .click();
  expect(await page.evaluate(() => localStorage.getItem("hifpb-course"))).toBe(
    "ads",
  );
  requests.length = 0;
  const chosen = page.getByRole("button").filter({
    has: page.getByText("Análise e Desenvolvimento de Sistemas", {
      exact: true,
    }),
  });
  await expect(chosen).toHaveAttribute("aria-pressed", "true");
  await chosen.click();
  await expect(chosen).toHaveAttribute("aria-pressed", "false");
  await expect(tour).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("hifpb-course")),
  ).toBeNull();
  await page.getByRole("link", { name: "Horários", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Selecione seu curso para continuar",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  expect(requests).toHaveLength(0);
});

test("animação avança, pode ser pausada e pulada e respeita movimento reduzido", async ({
  page,
}) => {
  await page.clock.install();
  const requests = trackAcademic(page);
  await page.goto("/");
  const tour = page.getByRole("dialog", {
    name: "Sua consulta começa pelo curso",
    exact: true,
  });
  await expect(tour).toBeVisible();
  await page.clock.fastForward(6700);
  await expect(
    tour.getByRole("heading", {
      name: "As informações seguem a sua escolha",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pausar animação", exact: true })
    .click();
  await page.clock.fastForward(20000);
  await expect(
    tour.getByRole("heading", {
      name: "As informações seguem a sua escolha",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pular apresentação", exact: true })
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("hifpb-course")),
  ).toBeNull();
  expect(requests).toHaveLength(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "Como funciona", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retomar animação", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(20000);
  await expect(
    tour.getByRole("heading", {
      name: "Primeiro, escolha seu curso",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tour).toHaveCount(0);
});

test("acesso da coordenação tem formulário responsivo e autenticação preservada", async ({
  page,
}) => {
  const requests = trackAcademic(page);
  await page.goto("/entrar");
  await expect(
    page.getByRole("heading", { name: "Acesso do coordenador", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "tmp/access-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () =>
      page
        .locator("main#main")
        .evaluate((element) => element.getBoundingClientRect().left),
    )
    .toBe(0);
  await page.screenshot({
    path: "tmp/access-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(requests).toHaveLength(0);
  const gradient = await page
    .locator(".app-topbar")
    .evaluate(
      (element) => getComputedStyle(element, "::after").backgroundImage,
    );
  expect(gradient).toContain("linear-gradient");
  await page.getByLabel("Usuário", { exact: true }).fill("root");
  await page.getByLabel("Senha", { exact: true }).fill("incorreta");
  await page
    .getByRole("button", { name: "Mostrar senha", exact: true })
    .click();
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Ocultar senha", exact: true })
    .click();
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Usuário ou senha incorretos",
  );
  expect(requests).toHaveLength(0);
  await page.getByLabel("Senha", { exact: true }).fill("0123456789");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Painel da coordenação", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await expect(
    page.getByRole("navigation", {
      name: "Gestão da coordenação",
      exact: true,
    }),
  ).toBeVisible();
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => !url.searchParams.has("courseId"))).toBe(true);
});
