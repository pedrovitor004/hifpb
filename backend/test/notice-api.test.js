const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");
const { schemas } = require("../src/domain");
test(
  "API distribui avisos gerais e valida vínculos de aula, concorrência e exclusão",
  { timeout: 90000 },
  async () => {
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), "hifpb-notice-api-"),
    );
    const base = "http://127.0.0.1:3094/api";
    const child = spawn(
      process.execPath,
      [path.resolve(__dirname, "../src/main.js")],
      {
        env: {
          ...process.env,
          DATA_MODE: "local",
          PORT: "3094",
          HIFPB_DATA_FILE: path.join(directory, "database.json"),
        },
        stdio: "ignore",
        windowsHide: true,
      },
    );
    let cookie = "";
    const request = (url, method = "GET", body) =>
      fetch(base + url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    try {
      let ready = false;
      for (let i = 0; i < 150; i++) {
        try {
          ready = (await request("/courses")).ok;
          if (ready) break;
        } catch {}
        await delay(100);
      }
      assert.ok(ready, "API iniciou");
      const login = await request("/auth/login", "POST", {
        email: "root",
        password: "0123456789",
      });
      cookie = login.headers.get("set-cookie").split(";")[0];
      const general = await request("/notices", "POST", {
        title: "Aviso do campus",
        message: "Todos os cursos recebem.",
        audience: "all",
        courseId: null,
      });
      assert.equal(general.status, 201);
      const globalId = (await general.json()).id;
      const specific = await request("/notices", "POST", {
        title: "Aviso do ADS",
        message: "Somente o ADS recebe.",
        courseId: "ads",
      });
      assert.equal(specific.status, 201);
      const specificId = (await specific.json()).id;
      const lesson = (await (await request("/lessons?courseId=ads")).json())[0];
      const date = new Date(lesson.validFrom + "T12:00:00Z");
      date.setUTCDate(
        date.getUTCDate() + ((lesson.weekday - date.getUTCDay() + 7) % 7),
      );
      const occurrenceDate = date.toISOString().slice(0, 10);
      const linked = {
        title: "Aula cancelada",
        message: "A aula não acontecerá nesta data.",
        category: "cancelamento",
        courseId: "ads",
        lessonId: lesson.id,
        occurrenceDate,
      };
      const responses = await Promise.all([
        request("/notices", "POST", linked),
        request("/notices", "POST", linked),
      ]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
      const linkedId = (await responses.find((r) => r.status === 201).json())
        .id;
      const ads = await (await request("/notices?courseId=ads")).json();
      const civil = await (await request("/notices?courseId=civil")).json();
      assert.ok(
        ads.some((n) => n.id === globalId) &&
          ads.some((n) => n.id === specificId) &&
          ads.some((n) => n.id === linkedId),
      );
      assert.ok(civil.some((n) => n.id === globalId));
      assert.ok(!civil.some((n) => n.id === specificId || n.id === linkedId));
      const wrongDay = new Date(date);
      wrongDay.setUTCDate(wrongDay.getUTCDate() + 1);
      for (const changes of [
        { courseId: "civil" },
        { occurrenceDate: wrongDay.toISOString().slice(0, 10) },
        { occurrenceDate: null },
        { lessonId: "missing" },
        { audience: "all", courseId: null },
      ])
        assert.equal(
          (await request("/notices", "POST", { ...linked, ...changes })).status,
          400,
        );
      assert.equal(
        (await request("/lessons/" + lesson.id, "DELETE")).status,
        409,
      );
      const fields = Object.fromEntries(
        Object.keys(schemas.lessons.shape)
          .filter((key) => lesson[key] !== undefined)
          .map((key) => [key, lesson[key]]),
      );
      const rejected = await request("/lessons/" + lesson.id, "PUT", {
        ...fields,
        validFrom: wrongDay.toISOString().slice(0, 10),
      });
      assert.equal(rejected.status, 409);
      assert.match((await rejected.json()).message, /avisos vinculados/);
      assert.equal(
        (await request("/notices/" + linkedId, "DELETE")).status,
        200,
      );
      assert.equal(
        (await request("/lessons/" + lesson.id, "DELETE")).status,
        200,
      );
    } finally {
      if (child.exitCode === null) {
        child.kill();
        await new Promise((resolve) => child.once("exit", resolve));
      }
      for (const name of fs.readdirSync(directory))
        fs.unlinkSync(path.join(directory, name));
      fs.rmdirSync(directory);
    }
  },
);
