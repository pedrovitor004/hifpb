const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");

test(
  "API aplica autorização, PDFs, calendários, concorrência e integridade das aulas",
  { timeout: 90000 },
  async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "hifpb-api-"));
    const base = "http://127.0.0.1:3096/api";
    let child,
      cookie = "";
    const start = () => {
      child = spawn(
        process.execPath,
        [path.resolve(__dirname, "../src/main.js")],
        {
          env: {
            ...process.env,
            DATA_MODE: "local",
            PORT: "3096",
            HIFPB_DATA_FILE: path.join(directory, "database.json"),
            HIFPB_UPLOAD_DIR: path.join(directory, "uploads"),
          },
          stdio: "ignore",
        },
      );
    };
    const stop = async () => {
      if (!child || child.exitCode !== null) return;
      const running = child;
      child.kill();
      await new Promise((resolve) => running.once("exit", resolve));
    };
    const ready = async () => {
      for (let i = 0; i < 100; i++) {
        try {
          if ((await fetch(base + "/courses")).ok) return;
        } catch {}
        await delay(100);
      }
      throw new Error("API de teste não iniciou.");
    };
    const request = (route, method = "GET", body, auth = true) =>
      fetch(base + route, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(auth && cookie ? { Cookie: cookie } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    const create = async (type, body) => {
      const response = await request("/" + type, "POST", body);
      assert.equal(response.status, 201, await response.clone().text());
      return (await response.json()).id;
    };
    const login = async () => {
      const response = await request(
        "/auth/login",
        "POST",
        { email: "root", password: "0123456789" },
        false,
      );
      assert.equal(response.status, 201);
      cookie = response.headers.get("set-cookie").split(";")[0];
    };
    try {
      start();
      await ready();
      assert.equal(
        (await request("/documents", "POST", {}, false)).status,
        401,
      );
      assert.equal(
        (await request("/calendars", "POST", {}, false)).status,
        401,
      );
      await login();
      assert.deepEqual(
        (await (await request("/auth/me")).json()).courseIds,
        [],
      );
      assert.equal((await (await request("/courses")).json()).length, 6);
      const types = [
        "classes",
        "subjects",
        "lessons",
        "professors",
        "rooms",
        "calendars",
        "calendarEvents",
      ];
      const scopedValues = await Promise.all(
        types.map(async (type) =>
          (await request("/" + type + "?courseId=ads")).json(),
        ),
      );
      const scoped = Object.fromEntries(
        types.map((type, index) => [type, scopedValues[index]]),
      );
      assert.ok(scoped.classes.every((record) => record.courseId === "ads"));
      assert.ok(scoped.subjects.every((record) => record.courseId === "ads"));
      assert.ok(
        scoped.lessons.every(
          (record) =>
            record.courseId === "ads" || record.courseIds?.includes("ads"),
        ),
      );
      assert.ok(
        scoped.professors.every((professor) =>
          scoped.lessons.some(
            (lesson) =>
              lesson.professorId === professor.id ||
              lesson.professorIds?.includes(professor.id),
          ),
        ),
      );
      assert.ok(
        scoped.rooms.every((room) =>
          scoped.lessons.some((lesson) => lesson.roomId === room.id),
        ),
      );
      assert.ok(
        scoped.calendars.every(
          (record) => record.scope === "superiores" || record.scope === "todos",
        ),
      );
      assert.ok(
        scoped.calendarEvents.every((event) =>
          scoped.calendars.some((calendar) => calendar.id === event.calendarId),
        ),
      );
      assert.equal(
        (await request("/lessons?courseId=missing-course")).status,
        404,
      );
      const raw = fs.readFileSync(
        path.resolve(
          __dirname,
          "../../frontend/public/documents/calendario-academico-2026.pdf",
        ),
      );
      const pdfInput = {
        fileName: "novo.pdf",
        mimeType: "application/pdf",
        scope: "superiores",
        base64: raw.toString("base64"),
      };
      assert.equal(
        (
          await request("/documents", "POST", {
            ...pdfInput,
            base64: Buffer.from("not pdf").toString("base64"),
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request("/documents", "POST", {
            ...pdfInput,
            mimeType: "text/html",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request("/documents", "POST", {
            ...pdfInput,
            base64: Buffer.alloc(8 * 1024 * 1024 + 1, 65).toString("base64"),
          })
        ).status,
        400,
      );
      const pdfResponse = await request("/documents", "POST", pdfInput);
      assert.equal(pdfResponse.status, 201);
      const pdf = await pdfResponse.json();
      assert.ok(pdf.pageCount > 0);
      const content = await request(
        "/documents/" + pdf.id + "/content",
        "GET",
        undefined,
        false,
      );
      assert.equal(content.status, 200);
      assert.equal(content.headers.get("content-type"), "application/pdf");
      assert.equal((await content.arrayBuffer()).byteLength, raw.length);
      const calendar = {
        title: "Calendário novo",
        year: 2027,
        version: "1",
        scope: "superiores",
        documentId: pdf.id,
        startPage: 1,
        isCurrent: true,
        validFrom: "2027-01-01",
        validTo: "2027-12-31",
        approvalDate: "2026-11-12",
        links: [{ label: "Portal", url: "https://www.ifpb.edu.br/" }],
      };
      assert.equal(
        (
          await request("/calendars", "POST", {
            ...calendar,
            scope: "integrados",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request("/calendars", "POST", {
            ...calendar,
            startPage: pdf.pageCount + 1,
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request("/calendars", "POST", {
            ...calendar,
            links: [{ label: "x", url: "javascript:alert(1)" }],
          })
        ).status,
        400,
      );
      const previousId = await create("calendars", calendar),
        calendarId = await create("calendars", { ...calendar, version: "2" });
      const calendars = await (await request("/calendars")).json();
      assert.equal(
        calendars.filter((c) => c.scope === "superiores" && c.isCurrent).length,
        1,
      );
      assert.equal(calendars.find((c) => c.id === previousId).isCurrent, false);
      const event = {
        calendarId,
        title: "Início",
        startDate: "2027-02-01",
        endDate: "2027-02-01",
        category: "aulas",
      };
      assert.equal(
        (
          await request("/calendarEvents", "POST", {
            ...event,
            endDate: "2028-01-01",
          })
        ).status,
        400,
      );
      await create("calendarEvents", event);
      assert.equal(
        (
          await request("/calendars/" + calendarId, "PUT", {
            ...calendar,
            validTo: "2027-01-31",
          })
        ).status,
        409,
      );
      const ca = await create("courses", {
          name: "Curso QA A",
          code: "QA-A",
          level: "superior",
        }),
        cb = await create("courses", {
          name: "Curso QA B",
          code: "QA-B",
          level: "integrado",
        });
      const a = await create("classes", {
          name: "QA 1",
          courseId: ca,
          period: 1,
        }),
        a2 = await create("classes", { name: "QA 2", courseId: ca, period: 2 }),
        b = await create("classes", { name: "QA B", courseId: cb, period: 1 });
      const sa = await create("subjects", {
          name: "Disciplina A",
          code: "QA",
          courseId: ca,
        }),
        sb = await create("subjects", {
          name: "Disciplina B",
          code: "QA",
          courseId: cb,
        });
      const p = await create("professors", { name: "Docente QA" }),
        p2 = await create("professors", { name: "Docente QA 2" });
      const r = await create("rooms", { name: "QA 1", block: "QA" }),
        r2 = await create("rooms", { name: "QA 2", block: "QA" });
      assert.equal(
        (
          await request("/subjects", "POST", {
            name: "Duplicada",
            code: " qa ",
            courseId: ca,
          })
        ).status,
        409,
      );
      const lesson = {
        courseId: ca,
        classId: a,
        subjectId: sa,
        professorId: p,
        roomId: r,
        weekday: 1,
        startTime: "18:00",
        endTime: "19:00",
        validFrom: "2027-01-01",
        validTo: "2027-12-31",
        semester: "2027.1",
      };
      assert.equal(
        (await request("/lessons", "POST", { ...lesson, subjectId: sb }))
          .status,
        400,
      );
      assert.equal(
        (await request("/lessons", "POST", { ...lesson, endTime: "17:59" }))
          .status,
        400,
      );
      assert.equal(
        (await request("/lessons", "POST", { ...lesson, semester: "2027.3" }))
          .status,
        400,
      );
      const concurrent = await Promise.all([
        request("/lessons", "POST", lesson),
        request("/lessons", "POST", lesson),
      ]);
      assert.deepEqual(concurrent.map((r) => r.status).sort(), [201, 409]);
      const lessonId = (await concurrent.find((r) => r.status === 201).json())
        .id;
      for (const candidate of [
        { ...lesson, classId: a2, professorId: p2 },
        { ...lesson, classId: a2, roomId: r2 },
        { ...lesson, professorId: p2, roomId: r2 },
      ])
        assert.equal(
          (await request("/lessons", "POST", candidate)).status,
          409,
        );
      const adjacentId = await create("lessons", {
        ...lesson,
        startTime: "19:00",
        endTime: "20:00",
      });
      assert.ok(adjacentId);
      assert.equal(
        (await request("/drafts/" + lessonId, "PUT", lesson)).status,
        200,
      );
      assert.equal(
        (await request("/lessons/" + lessonId, "DELETE")).status,
        409,
      );
      assert.equal(
        (
          await request("/lessons/" + lessonId, "PUT", {
            ...lesson,
            description: "Nova revisão",
          })
        ).status,
        200,
      );
      assert.equal(
        (await request("/drafts/" + lessonId + "/publish", "POST", {})).status,
        409,
      );
      const shared = {
        ...lesson,
        classIds: [a, b],
        subjectIds: [sa, sb],
        weekday: 2,
      };
      assert.equal(
        (await request("/lessons", "POST", { ...shared, subjectIds: [sa] }))
          .status,
        400,
      );
      await create("lessons", shared);
      assert.equal((await request("/classes/" + b, "DELETE")).status, 409);
      assert.equal(
        (
          await request("/subjects/" + sb, "PUT", {
            name: "Disciplina B",
            code: "QA-B",
            courseId: ca,
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request("/classes/" + b, "PUT", {
            name: "QA B",
            period: 1,
            courseId: ca,
          })
        ).status,
        409,
      );
      const draftId = await create("drafts", { ...lesson, weekday: 3 });
      assert.equal(
        (await request("/drafts/" + draftId + "/publish", "POST", {})).status,
        201,
      );
      assert.equal(
        (await request("/drafts/" + draftId + "/publish", "POST", {})).status,
        404,
      );
      await stop();
      start();
      await ready();
      assert.equal(
        (
          await request(
            "/documents/" + pdf.id + "/content",
            "GET",
            undefined,
            false,
          )
        ).status,
        200,
      );
      const persisted = await (
        await request("/calendars/" + calendarId)
      ).json();
      assert.equal(persisted.documentId, pdf.id);
      assert.equal(persisted.links[0].url, "https://www.ifpb.edu.br/");
    } finally {
      await stop();
      for (const entry of fs.readdirSync(directory)) {
        const target = path.join(directory, entry);
        if (fs.statSync(target).isDirectory()) {
          for (const name of fs.readdirSync(target))
            fs.unlinkSync(path.join(target, name));
          fs.rmdirSync(target);
        } else fs.unlinkSync(target);
      }
      fs.rmdirSync(directory);
    }
  },
);
