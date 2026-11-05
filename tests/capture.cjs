const { chromium } = require("@playwright/test");
const fs = require("node:fs");
(async () => {
  fs.mkdirSync("docs/screenshots", { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }, reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try { for (const [name, url] of [
    ["inicio", "/"],
    ["horarios-4", "/horarios?period=4"],
    ["bd2", "/aulas/ads-4-2?period=4"],
    ["salas", "/salas?roomId=b-204&period=4"],
    ["professores", "/professores"],
    ["avisos", "/avisos"],
    ["login", "/entrar"],
  ]) {
    await page.goto("http://127.0.0.1:5173" + url);
    await page.getByRole("heading").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `docs/screenshots/${name}.png`,
      fullPage: true,
    });
    const broken = await page
      .locator("img")
      .evaluateAll((imgs) =>
        imgs
          .filter((i) => !i.complete || i.naturalWidth === 0)
          .map((i) => i.src),
      );
    if (broken.length) throw new Error("Ativos ausentes: " + broken.join(","));
  }
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('button').filter({hasText:'Consulte horários por período e turno.'}).click();
  await page.screenshot({path:'docs/screenshots/modal-consulta.png',fullPage:true});
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Ativar modo escuro'}).click();
  await page.screenshot({path:'docs/screenshots/inicio-escuro.png',fullPage:true});
  await page.goto('http://127.0.0.1:5173/horarios?period=4');
  await page.getByRole('table').waitFor();
  await page.screenshot({path:'docs/screenshots/horarios-escuro.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('heading',{name:'Consulta de horários'}).waitFor();
  await page.screenshot({path:'docs/screenshots/mobile-escuro.png',fullPage:true});
  await page.getByRole('button',{name:'Ativar modo claro'}).click();
  await page.screenshot({path:'docs/screenshots/mobile-claro.png',fullPage:true});
  await page.getByRole('button',{name:'Abrir menu'}).click();
  await page.screenshot({path:'docs/screenshots/menu-mobile.png',fullPage:true});
  } finally { await browser.close(); }
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("Telas desktop, mobile, modais e modo escuro capturados; sem erros JavaScript ou imagens ausentes.");
})();
