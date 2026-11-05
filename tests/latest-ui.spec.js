import {test,expect} from '@playwright/test';
async function clear(page){await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Os resultados ficarão ocultos');await page.getByRole('dialog').getByRole('button',{name:'Limpar filtros',exact:true}).click();}
test('lista de horários, impressão e limpeza vazia',async({page})=>{
 await page.goto('/horarios?period=4');await page.getByRole('button',{name:'Lista',exact:true}).click();const list=page.getByRole('table');await expect(list.getByRole('columnheader',{name:'Professor',exact:true})).toBeVisible();await expect(list.locator('tbody tr')).toHaveCount(10);
 await page.evaluate(()=>{window.print=()=>{window.__printed=true;};});await page.getByRole('button',{name:'Imprimir lista'}).click();expect(await page.evaluate(()=>window.__printed)).toBeTruthy();
 await page.emulateMedia({media:'print'});await expect(page.locator('aside')).toBeHidden();await expect(list).toBeVisible();await page.emulateMedia({media:'screen'});
 await clear(page);for(const name of ['Curso','Período','Turno','Professor'])await expect(page.getByLabel(name,{exact:true})).toHaveValue('');await expect(page.getByRole('table')).toHaveCount(0);
 await page.getByLabel('Curso',{exact:true}).selectOption('ads');await page.getByLabel('Período',{exact:true}).selectOption('4');await page.getByLabel('Turno',{exact:true}).selectOption('night');await expect(page.getByRole('table')).toBeVisible();
});
test('limpeza nas salas, professores e disciplinas e cores persistidas',async({page})=>{
 await page.goto('/disciplinas');const rows=await (await page.request.get('http://127.0.0.1:3001/api/subjects')).json();const bd=rows.find(s=>s.name==='Banco de Dados II');const card=page.getByRole('button').filter({has:page.getByRole('heading',{name:'Banco de Dados II',exact:true})});await expect(card).toHaveCSS('border-top-color','rgb(109, 255, 193)');
 await clear(page);await expect(page.getByRole('button').filter({has:page.getByRole('heading',{name:'Banco de Dados II',exact:true})})).toHaveCount(0);
 for(const url of ['/salas','/professores']){await page.goto(url);await clear(page);await expect(page.getByLabel('Período',{exact:true})).toHaveValue('');await expect(page.getByRole('button',{pressed:true})).toHaveCount(0);}
 await page.goto('/salas?period=4');await expect(page.locator('svg.lucide-monitor').first()).toBeVisible();
});
