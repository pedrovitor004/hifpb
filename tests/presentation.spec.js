const {test,expect}=require('@playwright/test');
test.beforeEach(async({page},info)=>{
 if(!info.title.startsWith('aviso público'))await page.addLocatorHandler(page.locator('.hifpb-public-notice'),async()=>{await page.locator('.hifpb-public-notice .swal2-confirm').click();});
});
test('apresentação local ADS, calendário, login e mobile',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/horarios');await expect(page.getByRole('table')).toBeVisible();
 await expect(page.getByLabel('Curso',{exact:true}).locator('option')).toHaveCount(2);
 for(const period of ['1','2','3','4','5','6']){await page.getByLabel('Período',{exact:true}).selectOption(period);await expect(page.getByRole('table')).toBeVisible();}
 await page.getByLabel('Período',{exact:true}).selectOption('4');
 await page.getByLabel('Professor',{exact:true}).selectOption('gildo');await expect(page.getByRole('table')).toContainText('B.D 2');await expect(page.getByRole('table')).not.toContainText('T.A.P');
 await page.getByRole('button',{name:'Lista',exact:true}).click();await expect(page.getByRole('columnheader',{name:'Disciplina',exact:true})).toBeVisible();
 await page.screenshot({path:'docs/screenshots/apresentacao-lista.png',fullPage:true});
 await page.getByRole('link',{name:/Detalhes de B.D 2/}).first().click();await expect(page.getByRole('heading',{name:'Banco de Dados II',exact:true})).toBeVisible();await expect(page.getByText('Sala não informada',{exact:true})).toBeVisible();
 await page.goto('/calendario');await expect(page.locator('iframe')).toBeVisible();expect((await page.request.get('/documents/calendario-academico-2026.pdf')).status()).toBe(200);
 await page.goto('/entrar');await page.getByLabel('Usuário',{exact:true}).fill('root');await page.getByLabel('Senha',{exact:true}).fill('0123456789');await page.getByRole('button',{name:/Entrar/}).click();await expect(page).toHaveURL(/admin/);await expect(page.getByRole('button',{name:'Novo registro'})).toBeVisible({timeout:15000});
 await page.reload();await expect(page.getByRole('button',{name:'Novo registro'})).toBeVisible();
 await page.goto('/horarios?period=4');await expect(page.getByRole('table')).toBeVisible();await page.screenshot({path:'docs/screenshots/apresentacao-grade.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/screenshots/apresentacao-mobile.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
test('menu, sino e limpeza completa dos filtros',async({page})=>{
 await page.goto('/horarios?period=4');await expect(page.getByRole('table')).toBeVisible();
 await page.getByRole('button',{name:'Recolher menu',exact:true}).click();await expect(page.getByLabel('Período',{exact:true})).toHaveValue('4');await page.getByRole('button',{name:'Expandir menu',exact:true}).click();
 await page.getByRole('button',{name:'Notificações',exact:true}).click();const published=await (await page.request.get('/api/notices')).json();if(published.length)await expect(page.getByTestId('notice-count')).toBeVisible();else await expect(page.getByText('Não há nenhum aviso no momento.')).toBeVisible();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();await expect(page.getByText('Limpar todos os filtros?')).toBeVisible();await page.locator('.swal2-confirm').click();
 for(const label of ['Curso','Período','Turma','Turno','Professor'])await expect(page.getByLabel(label,{exact:true})).toHaveValue('');await expect(page.getByRole('table')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Abrir menu',exact:true}).click();await page.getByRole('button',{name:'Comunicados',exact:true}).click();await page.getByRole('link',{name:'Calendário',exact:true}).click();await expect(page).toHaveURL(/calendario/);
});
test('disciplinas por período, professores e salas',async({page})=>{
 await page.goto('/disciplinas');await page.getByLabel('Período',{exact:true}).selectOption('4');await expect(page.getByRole('heading',{name:'Banco de Dados II',exact:true})).toBeVisible();await page.screenshot({path:'docs/screenshots/disciplinas-periodo.png',fullPage:true});await page.getByLabel('Período',{exact:true}).selectOption('1');await expect(page.getByRole('heading',{name:'Banco de Dados II',exact:true})).toHaveCount(0);
 await page.goto('/professores?period=4');await expect(page.getByText('Agenda do período consultado')).toBeVisible();await expect(page.getByRole('heading',{name:'Gildo',exact:true})).toBeVisible();await page.screenshot({path:'docs/screenshots/professores-restaurado.png',fullPage:true});
 await page.goto('/salas');await expect(page.getByRole('heading',{name:'Salas do campus',exact:true})).toBeVisible();const rooms=await(await page.request.get('/api/rooms')).json();if(!rooms.length)await expect(page.getByText(/As salas ainda não foram cadastradas/)).toBeVisible();else await expect(page.getByText(rooms[0].name,{exact:true}).first()).toBeVisible();
 await page.screenshot({path:'docs/screenshots/salas-vazio.png',fullPage:true});
});
for(const host of ['localhost','127.0.0.1'])test('login local por '+host,async({page})=>{
 await page.goto('http://'+host+':5173/entrar');await page.getByLabel('Usuário',{exact:true}).fill('root');await page.getByLabel('Senha',{exact:true}).fill('0123456789');await page.getByRole('button',{name:/Entrar/}).click();await expect(page).toHaveURL(/admin/);await expect(page.getByRole('button',{name:'Novo registro'})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:'Novo registro'})).toBeVisible();await page.getByRole('button',{name:'Sair da conta',exact:true}).click();await page.goto('http://'+host+':5173/admin');await expect(page).toHaveURL(/entrar/);
});
test('aviso público destacado, contagem, intervalo e menu compacto',async({page})=>{
 const origin='http://127.0.0.1:5173';
 await page.request.post(origin+'/api/auth/login',{data:{email:'root',password:'0123456789'}});
 const created=await page.request.post(origin+'/api/notices',{data:{title:'Aviso de verificação',message:'Comunicado público de verificação do sistema.',courseId:'ads',category:'informacao'}});expect(created.status()).toBe(201);const {id}=await created.json();
 try{
 await page.context().clearCookies();await page.goto('/');await expect(page.getByRole('heading',{name:'Avisos da coordenação'})).toBeVisible();await expect(page.locator('.hifpb-public-notice')).toContainText('Aviso de verificação');await expect(page.getByTestId('notice-count')).toBeVisible();await page.screenshot({path:'docs/screenshots/aviso-publico.png',fullPage:true});await page.locator('.swal2-confirm').click();
 await page.getByRole('button',{name:'Comunicados',exact:true}).click();await page.getByRole('link',{name:'Avisos',exact:true}).click();await expect(page.locator('.hifpb-public-notice')).toHaveCount(0);
 await page.reload();await expect(page.getByRole('heading',{name:'Avisos da coordenação'})).toBeVisible();await page.locator('.swal2-confirm').click();
 await page.goto('/horarios?period=4');await page.locator('.swal2-confirm').click();await expect(page.getByText('20:10–20:30 • Intervalo',{exact:true})).toBeVisible();
 await page.setViewportSize({width:1366,height:768});await page.getByRole('button',{name:'Acadêmico',exact:true}).click();expect(await page.locator('#main-navigation').evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);await page.screenshot({path:'docs/screenshots/menu-compacto.png',fullPage:true});
 }finally{await page.request.post(origin+'/api/auth/login',{data:{email:'root',password:'0123456789'}});await page.request.delete(origin+'/api/notices/'+id);}
});
