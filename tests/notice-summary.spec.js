const {test,expect}=require('@playwright/test');

test('avisos mostram apenas contagem e convite para consultar, em um modal compacto',async({page})=>{
 await page.route('**/api/notices*',route=>route.fulfill({json:[
  {id:'one',courseId:'ads',title:'Título reservado ao detalhe',message:'Conteúdo completo do comunicado',category:'informacao'},
  {id:'two',courseId:'ads',title:'Segundo comunicado',message:'Outro conteúdo',category:'alteracao'},
  {id:'foreign',courseId:'civil',title:'Aviso de outro curso',message:'Outro curso',category:'informacao'}
 ]}));
 await page.addLocatorHandler(page.getByRole('dialog',{name:'Sua consulta começa pelo curso',exact:true}),async()=>page.getByRole('button',{name:'Pular apresentação',exact:true}).click());
 await page.goto('/');
 await page.getByRole('button').filter({has:page.getByText('Análise e Desenvolvimento de Sistemas',{exact:true})}).click();
 const popup=page.locator('.hifpb-notice-summary');
 await expect(popup).toContainText('2 avisos disponíveis');
 await expect(popup).not.toContainText('Título reservado ao detalhe');
 await expect(page.locator('.notice-summary')).toHaveCount(0);
 const bounds=await popup.boundingBox();
 expect(bounds.width).toBeLessThanOrEqual(460);
 await page.waitForTimeout(250);
 await page.screenshot({path:'tmp/notice-summary-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Agora não',exact:true}).click();
 await expect(popup).toHaveCount(0);
 await expect(page.getByRole('table')).toBeVisible();
 await page.reload();
 await expect(popup).toContainText('2 avisos');
 await page.setViewportSize({width:390,height:844});
 expect((await popup.boundingBox()).width).toBeLessThan(390);
 await page.getByRole('button',{name:'Ver avisos',exact:true}).click();
 await expect(page).toHaveURL(/\/avisos$/);
 await expect(page.getByRole('heading',{name:'Título reservado ao detalhe',exact:true})).toBeVisible();
 await expect(page.getByText('Aviso de outro curso',{exact:true})).toHaveCount(0);
});
