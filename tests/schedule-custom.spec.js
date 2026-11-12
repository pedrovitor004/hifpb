const { test, expect } = require("@playwright/test");

const catalog = {
  courses: [{ id: "ads", name: "ADS", code: "ADS", level: "superior" }],
  classes: [
    { id: "first", courseId: "ads", name: "1º período", period: 1 },
    { id: "second", courseId: "ads", name: "2º período", period: 2 },
  ],
  subjects: [
    {
      id: "math",
      courseId: "ads",
      code: "MAT",
      name: "Matemática",
      color: "#93c5fd",
    },
    {
      id: "port",
      courseId: "ads",
      code: "PORT",
      name: "Português",
      color: "#fcd34d",
    },
    {
      id: "code",
      courseId: "ads",
      code: "PROG",
      name: "Programação",
      color: "#c4b5fd",
    },
  ],
  professors: [{ id: "teacher", name: "Professor exemplo" }],
  rooms: [],
  notices: [],
  calendars: [],
  calendarEvents: [],
  lessons: [
    {
      id: "math-mon",
      classId: "first",
      subjectId: "math",
      weekday: 1,
      startTime: "09:00",
      endTime: "10:00",
    },
    {
      id: "math-wed",
      classId: "first",
      subjectId: "math",
      weekday: 3,
      startTime: "09:00",
      endTime: "10:00",
    },
    {
      id: "port-tue",
      classId: "first",
      subjectId: "port",
      weekday: 2,
      startTime: "09:00",
      endTime: "10:00",
    },
    {
      id: "code-mon",
      classId: "second",
      subjectId: "code",
      weekday: 1,
      startTime: "09:30",
      endTime: "10:30",
    },
  ].map((l) => ({
    ...l,
    courseId: "ads",
    professorId: "teacher",
    roomId: null,
    validFrom: "2020-01-01",
    validTo: "2099-12-31",
    semester: "2026.2",
  })),
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("hifpb-course", "ads");
    window.print = () => {
      window.printCalls = (window.printCalls || 0) + 1;
    };
  });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/", "");
    return route.fulfill({
      json: path === "auth/session" ? { user: null } : catalog[path] || [],
    });
  });
  await page.goto("/horarios");
  await expect(
    page.getByRole("heading", { name: "Consulta de horários", exact: true }),
  ).toBeVisible();
});

test("grade e lista permitem salvar em PDF e imprimem sem sidebar", async ({
  page,
}) => {
  const pdf = page.getByRole("button", {
    name: "Imprimir",
    exact: true,
  });
  await expect(page.locator(".schedule-lesson")).toHaveCount(3);
  await pdf.click();
  expect(await page.evaluate(() => window.printCalls)).toBe(1);
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("navigation", { name: "Páginas da plataforma" }),
  ).toBeHidden();
  const geometry = await page
    .locator(".schedule-grid table")
    .evaluate((el) => ({
      width: el.getBoundingClientRect().width,
      main: document.querySelector("#main").getBoundingClientRect().width,
    }));
  expect(geometry.width).toBeLessThanOrEqual(geometry.main);
  await page.pdf({
    path: "tmp/schedule-grade.pdf",
    preferCSSPageSize: true,
    printBackground: true,
  });
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Lista", exact: true }).click();
  await expect(page.locator(".schedule-list tbody tr")).toHaveCount(3);
  await pdf.click();
  expect(await page.evaluate(() => window.printCalls)).toBe(2);
});

test("personalizado combina turmas, sinaliza conflitos e imprime somente a seleção", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Personalizar horário", exact: true })
    .click();
  const selection = page.getByRole("region", { name: "Selecionar matérias" });
  await expect(selection.getByRole("checkbox", { checked: true })).toHaveCount(
    2,
  );
  await page
    .getByRole("button", { name: "Limpar seleção", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Imprimir", exact: true }),
  ).toBeDisabled();
  await selection
    .getByRole("checkbox", { name: "MAT Matemática", exact: true })
    .check();
  await selection
    .getByRole("checkbox", { name: "PROG Programação", exact: true })
    .check();
  await expect(page.locator(".schedule-lesson")).toHaveCount(3);
  await expect(page.getByRole("alert")).toContainText("sobrepostos");
  await expect(page.locator(".schedule-grid")).not.toContainText("PORT");
  await page.emulateMedia({ media: "print" });
  await expect(selection).toBeHidden();
  await expect(
    page.getByRole("heading", {
      name: "Meu horário personalizado",
      exact: true,
    }),
  ).toBeVisible();
  await page.pdf({
    path: "tmp/schedule-custom.pdf",
    preferCSSPageSize: true,
    printBackground: true,
  });
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Lista", exact: true }).click();
  await expect(page.locator(".schedule-list tbody tr")).toHaveCount(3);
  await expect(page.locator(".schedule-list")).not.toContainText("Português");
  await selection
    .getByRole("checkbox", { name: "PROG Programação", exact: true })
    .uncheck();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".schedule-list tbody tr")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Horário da turma", exact: true })
    .click();
  await expect(selection).toHaveCount(0);
  await expect(page.locator(".schedule-list tbody tr")).toHaveCount(3);
});

test("seleção personalizada funciona no celular", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Personalizar horário", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Limpar seleção", exact: true })
    .click();
  await page
    .getByRole("checkbox", { name: "PROG Programação", exact: true })
    .check();
  await expect(page.locator(".schedule-lesson")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Imprimir", exact: true }).click();
  expect(await page.evaluate(() => window.printCalls)).toBe(1);
});
