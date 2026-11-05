import {test,expect} from '@playwright/test';
test('cards abrem modais e limpar restaura todos os filtros',async({page})=>{
 await page.goto('/');
 await page.getByRole('button').filter({hasText:'Consulte horários por período e turno.'}).click();
 const modal=page.getByRole('dialog',{name:'Consultar horários'});await expect(modal).toBeVisible();
 await modal.getByRole('button',{name:'4º período'}).click();await modal.getByRole('button',{name:'Consultar',exact:true}).click();
 await expect(page.getByLabel('Período',{exact:true})).toHaveValue('4');
 await page.getByLabel('Professor',{exact:true}).selectOption('gildo');await page.getByRole('button',{name:'Próxima semana'}).click();await page.getByRole('button',{name:'Lista',exact:true}).click();
 await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Limpar filtros',exact:true}).click();
 await expect(page.getByLabel('Curso',{exact:true})).toHaveValue('');await expect(page.getByLabel('Período',{exact:true})).toHaveValue('');await expect(page.getByLabel('Professor',{exact:true})).toHaveValue('');await expect(page.getByLabel('Turno',{exact:true})).toHaveValue('');await expect(page.getByRole('table')).toHaveCount(0);expect(page.url()).not.toContain('week=');
 await page.goto('/');await page.getByRole('button',{name:/Escolha o período/}).click();await expect(page.getByRole('dialog',{name:'Encontre sua turma'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});
