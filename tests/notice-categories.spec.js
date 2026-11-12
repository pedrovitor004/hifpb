const {test,expect}=require('@playwright/test');
test('avisos têm categorias, ícones, cores distintas e filtros por curso',async({page})=>{
 const notices=[
  {id:'information',courseId:'ads',category:'informacao',title:'Informações da semana',message:'Acompanhe as orientações da coordenação para a sua turma.',createdAt:{_seconds:1794484800}},
  {id:'change',courseId:'ads',category:'alteracao',title:'Mudança de sala',message:'Confira a nova sala antes da próxima aula.',createdAt:{_seconds:1794484700}},
  {id:'cancel',courseId:'ads',category:'cancelamento',title:'Aula cancelada',message:'A coordenação informará a data de reposição.',createdAt:{_seconds:1794484600}},
  {id:'foreign',courseId:'civil',category:'informacao',title:'Comunicado de outro curso',message:'Não pertence ao ADS.'},
 ];
 await page.route('**/api/notices*',route=>route.fulfill({json:notices}));
 await page.addLocatorHandler(page.getByRole('dialog',{name:'Sua consulta começa pelo curso',exact:true}),async()=>page.getByRole('button',{name:'Pular apresentação',exact:true}).click());
 await page.addLocatorHandler(page.locator('.hifpb-notice-summary'),async()=>page.locator('.hifpb-notice-summary .swal2-cancel').click());
 await page.goto('/');
 await page.getByRole('button').filter({has:page.getByText('Análise e Desenvolvimento de Sistemas',{exact:true})}).click();
 await page.goto('/avisos');
 await expect(page.getByRole('article')).toHaveCount(3);
 await expect(page.getByRole('heading',{name:'Comunicado de outro curso',exact:true})).toHaveCount(0);
 await expect(page.locator('.notice-category svg')).toHaveCount(3);
 const colors=await page.locator('.notice-category').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).color));
 expect(new Set(colors).size).toBe(3);
 await page.screenshot({path:'tmp/notices-categories-desktop.png',fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Alterações: 1 aviso',exact:true}).click();
 await expect(page.getByRole('article')).toHaveCount(1);
 await expect(page.getByRole('heading',{name:'Mudança de sala',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Cancelamentos: 1 aviso',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Aula cancelada',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Ler comunicado: Aula cancelada',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Aula cancelada',exact:true});
 await expect(dialog.getByText('Cancelamento',{exact:true})).toBeVisible();
 await expect(dialog.getByText('A coordenação informará a data de reposição.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Fechar comunicado',exact:true}).click();
 await page.getByRole('button',{name:'Todos: 3 avisos',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 await expect.poll(async()=>page.locator('main#main').evaluate(element=>element.getBoundingClientRect().left)).toBe(0);
 await page.screenshot({path:'tmp/notices-categories-mobile.png',fullPage:true,animations:'disabled'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Ativar modo escuro',exact:true}).click();
 await page.screenshot({path:'tmp/notices-categories-dark.png',fullPage:true,animations:'disabled'});
});
