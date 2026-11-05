import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { db, auth } = require("../backend/src/firebase");
const base = "http://127.0.0.1:3001/api";
if (!process.env.FIRESTORE_EMULATOR_HOST)
  throw new Error("Este teste só pode usar emuladores.");
let checks = 0;
async function request(
  path,
  { token, method = "GET", body, status = 200 } = {},
) {
  const r = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  assert.equal(r.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
  checks++;
  return data;
}
const suffix = Date.now().toString();
async function user(role) {
  const email = `test-${role}-${suffix}@hifpb.local`,
    password = "Emulator-test-123!";
  const u = await auth.createUser({ email, password });
  if (role === "coordinator")
    await db
      .doc(`users/${u.uid}`)
      .set({ role: "coordinator", active: true, courseIds: [] });
  if (role === "restricted")
    await db
      .doc(`users/${u.uid}`)
      .set({ role: "coordinator", active: true, courseIds: ["civil"] });
  const r = await fetch(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  return { uid: u.uid, token: (await r.json()).idToken };
}
const users = [];
const created = [];
try {
  const coordinator = await user("coordinator"),
    viewer = await user("viewer"),
    restricted = await user("restricted");
  users.push(coordinator, viewer, restricted);
  await request("/lessons");
  await request("/notices");
  await request("/rooms", {
    method: "POST",
    body: { name: "Test", block: "Test" },
    status: 401,
  });
  await request("/rooms", {
    method: "POST",
    body: { name: "Test", block: "Test" },
    token: "invalid",
    status: 401,
  });
  await request("/auth/me", { token: viewer.token, status: 403 });
  await request("/auth/me", { token: coordinator.token });
  await request("/drafts", { status: 401 });
  const teacher = await request("/professors", {
    method: "POST",
    token: coordinator.token,
    body: { name: "Professor de teste " + suffix },
    status: 201,
  });
  created.push(["professors", teacher.id]);
  const room = await request("/rooms", {
    method: "POST",
    token: coordinator.token,
    body: {
      name: "Sala de teste " + suffix,
      block: "Teste",
      location: "Demonstração",
    },
    status: 201,
  });
  created.push(["rooms", room.id]);
  await request("/rooms/" + room.id, {
    method: "PUT",
    token: coordinator.token,
    body: { name: "Sala editada", block: "Teste", location: "Demonstração" },
  });
  assert.equal((await request("/rooms/" + room.id)).name, "Sala editada");
  const lesson = {
    courseId: "ads",
    classId: "ads-4",
    subjectId: "ads-4-b-d-2",
    professorId: teacher.id,
    roomId: room.id,
    weekday: 1,
    startTime: "08:00",
    endTime: "09:00",
    validFrom: "2026-07-01",
    validTo: "2026-12-31",
    semester: "Teste",
  };
  await request("/lessons", {
    method: "POST",
    token: restricted.token,
    body: lesson,
    status: 403,
  });
  await request("/lessons", {
    method: "POST",
    token: coordinator.token,
    body: { ...lesson, endTime: "07:00" },
    status: 400,
  });
  await request("/lessons", {
    method: "POST",
    token: coordinator.token,
    body: { ...lesson, classId: "missing" },
    status: 400,
  });
  const draft = await request("/drafts", {
    method: "POST",
    token: coordinator.token,
    body: lesson,
    status: 201,
  });
  created.push(["drafts", draft.id]);
  assert.ok(!(await request("/lessons")).some((l) => l.id === draft.id));
  await request("/drafts/" + draft.id + "/publish", {
    method: "POST",
    token: coordinator.token,
    body: {
      notice: {
        title: "Aviso de teste " + suffix,
        message: "Teste atômico de publicação.",
        category: "alteracao",
        courseId: "ads",
      },
    },
    status: 201,
  });
  created.push(["lessons", draft.id]);
  assert.equal((await request("/lessons/" + draft.id)).roomId, room.id);
  const notice = (await request("/notices")).find(
    (n) => n.title === "Aviso de teste " + suffix,
  );
  assert.ok(notice);
  created.push(["notices", notice.id]);
  await request("/notices/" + notice.id, {
    method: "PUT",
    token: coordinator.token,
    body: {
      title: notice.title,
      message: "Aviso editado",
      category: "alteracao",
      courseId: "ads",
    },
  });
  assert.equal(
    (await request("/notices/" + notice.id)).message,
    "Aviso editado",
  );
  // A saved draft must not overwrite the published version before publication.
  await request("/drafts/" + draft.id, {
    method: "PUT",
    token: coordinator.token,
    body: { ...lesson, startTime: "09:00", endTime: "10:00" },
  });
  assert.equal((await request("/lessons/" + draft.id)).startTime, "08:00");
  await request("/drafts/" + draft.id, {
    method: "DELETE",
    token: coordinator.token,
  });
  // Both requests race against the same empty slot. Exactly one must commit.
  const races = await Promise.all(
    [1, 2].map(() =>
      fetch(base + "/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + coordinator.token,
        },
        body: JSON.stringify({
          ...lesson,
          startTime: "10:00",
          endTime: "11:00",
        }),
      }),
    ),
  );
  assert.deepEqual(races.map((r) => r.status).sort(), [201, 409]);
  checks++;
  for (const r of races) {
    const body = await r.json();
    if (r.status === 201) created.push(["lessons", body.id]);
  }
  await request("/rooms/" + room.id, {
    method: "DELETE",
    token: coordinator.token,
    status: 409,
  });
  const periods = await Promise.all(
    [1, 2, 4].map((period) =>
      request("/lessons?courseId=ads&period=" + period),
    ),
  );
  periods.forEach((l) => assert.ok(l.length));
  await request("/professors/" + teacher.id, {
    method: "PUT",
    token: coordinator.token,
    body: { name: "Professor editado" },
  });
  assert.equal(
    (await request("/professors/" + teacher.id)).name,
    "Professor editado",
  );
  console.log(
    `PASS: ${checks} verificações HTTP, persistência, publicação atômica e concorrência.`,
  );
} finally {
  // Remove only exact IDs created by this test, never clear emulator data.
  for (const [type, id] of created.reverse())
    await db.doc(`${type}/${id}`).delete();
  for (const u of users) {
    await db.doc(`users/${u.uid}`).delete();
    await auth.deleteUser(u.uid);
  }
}
