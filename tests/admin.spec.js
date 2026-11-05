import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
const backendRequire = createRequire(process.cwd() + "/package.json");
const { auth, db } = backendRequire("./backend/src/firebase");
const suffix = Date.now(),
  email = `ui-${suffix}@hifpb.local`,
  password = `Local-test-${suffix}!`;
let uid;
const roomName = `Sala UI ${suffix}`,
  noticeTitle = `Aviso UI ${suffix}`;
test.beforeAll(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error("Apenas emulador.");
  const user = await auth.createUser({ email, password });
  uid = user.uid;
  await db
    .doc(`users/${uid}`)
    .set({ role: "coordinator", active: true, courseIds: [] });
});
test.afterAll(async () => {
  for (const [collection, field, value] of [
    ["rooms", "name", roomName],
    ["notices", "title", noticeTitle],
  ]) {
    const matches = await db
      .collection(collection)
      .where(field, "==", value)
      .get();
    for (const doc of matches.docs) await doc.ref.delete();
  }
  if (uid) {
    await db.doc(`users/${uid}`).delete();
    await auth.deleteUser(uid);
  }
});
test("login, CRUD persistente, aviso, sino e logout", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail institucional").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Gestão de horários" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Salas", exact: true }).click();
  await page.getByRole("button", { name: "Novo registro" }).click();
  await page.getByLabel("Identificação", { exact: true }).fill(roomName);
  await page.getByLabel("Bloco", { exact: true }).fill("Bloco de teste");
  await page.getByLabel("Tipo", { exact: true }).fill("Sala de aula");
  await page
    .getByLabel("Localização ilustrativa")
    .fill("Ambiente de validação do frontend.");
  await page.getByRole("button", { name: "Salvar registro" }).click();
  await expect(page.getByText(roomName, { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Salas", exact: true }).click();
  await expect(page.getByText(roomName, { exact: true })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: roomName });
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Bloco", { exact: true }).fill("Bloco editado");
  await page.getByRole("button", { name: "Salvar registro" }).click();
  await expect(row).toContainText("Bloco editado");
  await page.getByRole("tab", { name: "Avisos", exact: true }).click();
  await page.getByRole("button", { name: "Novo registro" }).click();
  await page.getByLabel("Título", { exact: true }).fill(noticeTitle);
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("Aviso criado em teste pelo navegador.");
  await page.getByRole("button", { name: "Salvar registro" }).click();
  await expect(page.getByText(noticeTitle, { exact: true })).toBeVisible();
  await page.goto("/avisos");
  await expect(page.getByRole("heading", { name: noticeTitle })).toBeVisible();
  await page.getByRole("button", { name: "Notificações", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(noticeTitle);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Acesso do coordenador" }),
  ).toBeVisible();
});
