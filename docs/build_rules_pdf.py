"""Gera o guia de regras a partir de regras-de-negocio.json.

Execute na raiz: python docs/build_rules_pdf.py
Dependência: reportlab (pip install reportlab).
"""
import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'docs/regras-de-negocio.json').read_text(encoding='utf-8'))
OUT = ROOT / 'output/pdf/hifpb-regras-de-negocio.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
font, bold = 'Helvetica', 'Helvetica-Bold'
font_dir = Path('C:/Windows/Fonts')
if (font_dir / 'arial.ttf').exists():
    pdfmetrics.registerFont(TTFont('Arial', str(font_dir / 'arial.ttf')))
    pdfmetrics.registerFont(TTFont('ArialBold', str(font_dir / 'arialbd.ttf')))
    font, bold = 'Arial', 'ArialBold'
GREEN = colors.HexColor('#087044')
INK = colors.HexColor('#17372b')
MUTED = colors.HexColor('#52675d')
styles = {
    'title': ParagraphStyle('Title', fontName=bold, fontSize=32, leading=37, textColor=INK, spaceAfter=22),
    'h1': ParagraphStyle('H1', fontName=bold, fontSize=23, leading=29, textColor=INK, spaceAfter=16),
    'h2': ParagraphStyle('H2', fontName=bold, fontSize=11, leading=15, textColor=GREEN, spaceAfter=5),
    'body': ParagraphStyle('Body', fontName=font, fontSize=10.3, leading=15.2, textColor=INK, spaceAfter=11),
    'small': ParagraphStyle('Small', fontName=font, fontSize=8.4, leading=12, textColor=MUTED, spaceAfter=8),
    'label': ParagraphStyle('Label', fontName=bold, fontSize=9, leading=13, textColor=GREEN, spaceAfter=14),
}
def p(text, style='body'):
    for dash in ('\u2011','\u2013','\u2014'):
        text = text.replace(dash, '-')
    return Paragraph(escape(text), styles[style])

def frame(canvas, doc):
    width, height = doc.pagesize
    canvas.setFillColor(GREEN)
    canvas.rect(0, height-8, width, 8, fill=1, stroke=0)
    canvas.setFont(bold, 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(48, height-34, 'IFPB CAMPUS MONTEIRO / SISTEMA DE HORÁRIOS')
    canvas.setStrokeColor(colors.HexColor('#dce8df'))
    canvas.line(48, 42, width-48, 42)
    canvas.setFont(font, 8)
    canvas.drawString(48, 27, 'Regras implementadas | 12/11/2026')
    canvas.drawRightString(width-48, 27, f'{doc.page}')

story = [Spacer(1,76), p('DOCUMENTAÇÃO FUNCIONAL', 'label'), p(data['title'], 'title'), p(data['subtitle']), p(data['version'], 'small'), Spacer(1,26)]
intro = 'Guia das 60 regras implementadas no projeto, com identificação, comportamento esperado e rastreabilidade ao código. Abrange consulta por curso, coordenação, horários, publicação, avisos, calendários e documentos.'
story += [p(intro), Spacer(1,20)]
box = Table([[p('Como ler este guia', 'h2')], [p('Cada regra descreve o comportamento atual do sistema. A seleção pública de curso organiza a consulta; a autenticação protege a gestão. Comunicados e eventos do calendário não substituem a edição validada das aulas.')]], colWidths=[475])
box.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#edf7ef')),('BOX',(0,0),(-1,-1),0.5,colors.HexColor('#cce3d2')),('LEFTPADDING',(0,0),(-1,-1),16),('RIGHTPADDING',(0,0),(-1,-1),16),('TOPPADDING',(0,0),(-1,0),14),('BOTTOMPADDING',(0,-1),(-1,-1),8)]))
story += [box, PageBreak(), p('Mapa do documento','h1')]
for i, section in enumerate(data['sections'],1):
    story += [p(f'{i:02d}   {section["title"]}', 'h2'), p(f'{section["rules"][0][0]} a {section["rules"][-1][0]}', 'small')]
story += [Spacer(1,10), p('Escopo da documentação', 'h2'), p('As regras foram conferidas nas validações do servidor, no fluxo da interface e nos testes do repositório. Os caminhos de código são relativos à raiz. Esta documentação descreve o software e não substitui regulamentos institucionais ou a conferência dos PDFs oficiais.')]
for i, section in enumerate(data['sections'],1):
    story += [PageBreak(), p(f'{i:02d} / REGRAS IMPLEMENTADAS','label'), p(section['title'],'h1')]
    for rule_id, title, text in section['rules']:
        story.append(KeepTogether([p(f'{rule_id} | {title}','h2'), p(text)]))
    story += [Spacer(1,8),p('Rastreabilidade','h2'),p(section['sources'],'small')]
story += [PageBreak(),p('Exemplos e verificação','h1')]
examples = [
('Ocupação de sala','Duas aulas na sala A-01, segunda-feira, 08:00-09:00 e 08:30-09:30, com ocorrência comum nas vigências, são incompatíveis mesmo quando pertencem a cursos diferentes. Uma segunda aula às 09:00 é permitida.'),
('Comunicado no card','A coordenação vincula uma alteração a uma aula e à data de sua ocorrência, com a mensagem "A aula acontecerá na sala B-203, no mesmo horário." O card mostra Alteração na aula e o resumo; o clique abre o comunicado completo. Para mudar a reserva de sala, também é necessário editar e publicar a aula.'),
('Aviso para o campus','Um aviso para Todos os cursos não possui curso único associado. Ele aparece para ADS e Engenharia Civil após a seleção inicial de cada curso. Um aviso específico de ADS não aparece em Engenharia Civil, salvo quando vinculado a uma aula compartilhada que inclua ambos.'),
('Versão de calendário','Enviar outro PDF de integrados cria uma nova versão, preservando a anterior. Os eventos da versão antiga não são copiados automaticamente. Atualizar somente um link de apoio conserva o documento e os eventos atuais.')]
for title,text in examples:
    story += [KeepTogether([p(title,'h2'),p(text)])]
story += [Spacer(1,10),p('Validação automatizada','h2'),p('npm test: testes de domínio e APIs isoladas, incluindo ocupação, concorrência, revisões, permissões, PDFs, importação e avisos vinculados. npm run build: compilação do backend e frontend. A suíte Playwright de consulta, entrada, avisos e calendário verifica a integração visual em navegador.'),p('Comando de integração visual: npx playwright test calendar-management.spec.js entry-flow.spec.js course-flow.spec.js notice-categories.spec.js notice-summary.spec.js','small')]
story += [PageBreak(),p('Referências técnicas','h1')]
refs = [
('Validação de entradas','backend/src/domain.js: schemas, parse, overlaps, assertNoConflicts e assertScope.'),
('Integridade e transações','backend/src/rules.js: referências, duplicidade e proteção de registros. backend/src/store.js: leitura por curso, escrita, publicação e exclusão.'),
('Autenticação e arquivos','backend/src/auth.js e main.js: sessão, guardas e rotas. backend/src/documents.js: validação, metadados e armazenamento dos PDFs.'),
('Consulta e administração','frontend/src/App.jsx e courseData.js: carregamento e projeção. Admin.jsx e CalendarAdmin.jsx: gestão. Schedule.jsx, ScheduleList.jsx e Lesson.jsx: grade e contexto de aula.'),
('Avisos','frontend/src/NoticeTargetFields.jsx, NoticePage.jsx, NoticeDetails.jsx, noticeCategories.jsx e lessonNotices.js: destinatários, aparência, ocorrência e resumo.'),
('Testes do servidor','backend/test/domain.test.js, business-rules.test.js, api-rules.test.js, course-data.test.js, import.test.js, notice-targets.test.js e notice-api.test.js.'),
('Testes da interface','tests/entry-flow.spec.js, course-flow.spec.js, calendar-management.spec.js, notice-categories.spec.js e notice-summary.spec.js.'),
('Fonte reproduzível','docs/regras-de-negocio.json contém as 60 regras; docs/build_rules_pdf.py gera este PDF com ReportLab. Execute python docs/build_rules_pdf.py na raiz. O resultado fica em output/pdf/hifpb-regras-de-negocio.pdf.')]
for title,text in refs:
    story += [KeepTogether([p(title,'h2'),p(text)])]
doc = SimpleDocTemplate(str(OUT),pagesize=(595.28,841.89),rightMargin=48,leftMargin=48,topMargin=64,bottomMargin=60,title='Regras de negócio - HIFPB',author='Projeto HIFPB',subject='Regras implementadas no sistema de horários do IFPB Campus Monteiro')
doc.build(story,onFirstPage=frame,onLaterPages=frame)
print(OUT)
