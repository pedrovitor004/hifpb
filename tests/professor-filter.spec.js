import {test,expect} from '@playwright/test';
test('professores filtram aulas reais nos três períodos',async({page})=>{
 for(const [period,id,name,count] of [[1,'kamilla','Kamilla',2],[2,'alberto','Alberto',3],[4,'gildo','Gildo',2]]){
  await page.goto('/horarios?period='+period);
  await page.getByLabel('Professor',{exact:true}).selectOption(id);
  const cards=page.getByRole('table').locator('tbody a');
  await expect(cards).toHaveCount(count);
  for(const card of await cards.all())await expect(card).toContainText('Docente: '+name);
 }
 await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Limpar filtros',exact:true}).click();
 await expect(page.getByLabel('Professor',{exact:true})).toHaveValue('');
 await expect(page.getByRole('table').locator('tbody a')).toHaveCount(0);
 await page.goto('/disciplinas');await expect(page.getByText(/Nome abreviado conforme protótipo|Ementa não fornecida/)).toHaveCount(0);
});
