const { test, expect } = require('@playwright/test');

test.beforeEach(async({page})=>{await page.addLocatorHandler(page.getByRole('dialog',{name:'Sua consulta começa pelo curso',exact:true}),async()=>{await page.getByRole('button',{name:'Pular apresentação',exact:true}).click();});});

test('curso escolhido apenas no início orienta as consultas e persiste', async ({ page }) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addLocatorHandler(page.locator('.hifpb-notice-summary'), async () => {
    await page.locator('.hifpb-notice-summary .swal2-cancel').click();
  });
  await page.goto('/');
  const courses = await (await page.request.get('/api/courses')).json();
  for (const course of courses) {
    await page.goto('/');
    await expect(page.getByRole('heading', {name:'Qual é o seu curso?'})).toBeVisible();
    await expect(page.getByText('Aulas de hoje', {exact:true})).toHaveCount(0);
    await page.getByRole('button').filter({has:page.getByText(course.name, {exact:true})}).click();
    await expect(page).toHaveURL(/\/horarios$/);
    await expect(page.getByLabel('Turma', {exact:true})).toBeVisible();
    await expect(page.getByText('Mais filtros', {exact:true})).toHaveCount(0);
    await expect(page.getByRole('button', {name:'Limpar filtros'})).toHaveCount(0);
    await expect(page.getByLabel('Curso', {exact:true})).toHaveCount(0);
    const classes = await (await page.request.get('/api/classes')).json();
    const options = await page.getByLabel('Turma', {exact:true}).locator('option').evaluateAll(nodes=>nodes.map(n=>n.value).filter(Boolean));
    expect(options.sort()).toEqual(classes.filter(c=>c.courseId===course.id).map(c=>c.id).sort());
    await page.reload();
    await expect(page.getByLabel('Turma', {exact:true})).toBeVisible();
    expect(await page.evaluate(()=>localStorage.getItem('hifpb-course'))).toBe(course.id);
    await page.goto('/avisos');
    const notices = await (await page.request.get('/api/notices')).json();
    for (const notice of notices.filter(n=>n.courseId!==course.id)) {
      await expect(page.getByRole('heading', {name:notice.title,exact:true})).toHaveCount(0);
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.getByRole('heading', {name:'Qual é o seu curso?'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('menu no início e controle lateral ficam fora da grade',async({page})=>{
  await page.addLocatorHandler(page.locator('.hifpb-notice-summary'),async()=>page.locator('.hifpb-notice-summary .swal2-cancel').click());
  await page.goto('/');
  await expect(page.getByRole('navigation',{name:'Páginas da plataforma'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Acesso da coordenação Entrar na área restrita'})).toBeVisible();
  await page.getByRole('button').filter({has:page.getByText('Análise e Desenvolvimento de Sistemas',{exact:true})}).click();
  await expect(page.getByRole('table')).toBeVisible();
  for(const label of ['Recolher menu','Expandir menu']){
    const button=page.getByRole('button',{name:label,exact:true});
    const bounds=await button.boundingBox();
    const table=await page.getByRole('table').boundingBox();
    expect(bounds.x+bounds.width).toBeLessThanOrEqual(table.x);
    await button.click();
    await page.waitForTimeout(250);
  }
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Qual é o seu curso?'})).toBeVisible();
  await page.screenshot({path:'tmp/home-menu-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
  await expect(page.getByRole('link',{name:'Acesso da coordenação Entrar na área restrita'})).toBeVisible();
  await page.screenshot({path:'tmp/home-menu-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
