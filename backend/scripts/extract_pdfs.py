"""Extract merged timetable cells using PDF coordinates and font roles, not reading order."""
import fitz, re, json, pathlib, unicodedata, hashlib, colorsys
ROOT=pathlib.Path(__file__).resolve().parents[2]
FILES={
 'classes':pathlib.Path(r'C:\Users\pedro\Downloads\TUIRMAS GERAL - 27-10-26 (1).pdf'),
 'teachers':pathlib.Path(r'C:\Users\pedro\Downloads\PROFESSOR - 27-10-26.pdf'),
 'calendar':pathlib.Path(r'C:\Users\pedro\Downloads\Calendário Acadêmico - Subsequente_Superiores 2026 v.Final (1) (1).pdf')}
def norm(s):return re.sub(r'[^A-Z0-9]','',unicodedata.normalize('NFD',s).encode('ascii','ignore').decode().upper())
def slug(s):return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFD',s).encode('ascii','ignore').decode().lower()).strip('-')[:90]
def spans(page):return [s for b in page.get_text('dict')['blocks'] if 'lines' in b for l in b['lines'] for s in l['spans']]
def textparts(page,box,italic=None):
 x0,y0,x1,y1=box
 ss=[s for s in spans(page) if x0-1<=(s['bbox'][0]+s['bbox'][2])/2<=x1+1 and y0<=(s['bbox'][1]+s['bbox'][3])/2<=y1 and (italic is None or bool(s['flags']&2)==italic)]
 return ' '.join(s['text'].strip() for s in sorted(ss,key=lambda s:(round(s['bbox'][1],1),s['bbox'][0]))).strip()
courses=[{'id':'ads','name':'Análise e Desenvolvimento de Sistemas','code':'ADS','level':'superior'}, {'id':'civil','name':'Engenharia Civil','code':'Engenharia Civil','level':'superior'}, {'id':'ted','name':'TED — integrado','code':'TED','level':'integrado'}, {'id':'informatica','name':'Informática — integrado','code':'Informática','level':'integrado'}, {'id':'im','name':'IM — integrado','code':'IM','level':'integrado'}, {'id':'tce','name':'TCE','code':'TCE','level':'tecnico'}]
teachers=[]; aliases={};teacher_doc=fitz.open(FILES['teachers']);legends={}
for i,p in enumerate(teacher_doc):
 top=' '.join(p.get_text(sort=True).splitlines()[:6]);m=re.search(r'Horário:\s*(.*?)\s+HORÁRIO',top,re.I)
 if not m:raise ValueError(f'Teacher heading absent page {i+1}')
 raw=m.group(1).strip();name=raw.title();key=slug(raw)
 if norm(raw) not in ['SUBSINFO','ENGNOVO']:
  teachers.append({'id':key,'name':name,'description':'','sourcePage':i+1});aliases[norm(raw)]=key
 # The subject legend is at the right edge. Keep it as source text for review.
 legends[key]=p.get_textbox(fitz.Rect(605,110,805,530))
for a,b in {'LEO':'LEONARDO','ADRI':'ADRI LUCENA','MARCIA':'MÁRCIA LIMA','PEDRO':'PEDRO NOGUEIRA','LUCAS':'FRANCISCO LUCAS','JARDEL':'ANDERSON JARDEL','JUNIOR':'JUNIOR Sanfoneiro'}.items():
 if norm(b) in aliases:aliases[norm(a)]=aliases[norm(b)]
def resolve_teachers(raw):
 parts=re.split(r'\s*/\s*',raw)
 known=[];unknown=[]
 for item in parts:
  if norm(item) in aliases:known.append(aliases[norm(item)])
  elif item.strip():unknown.append(item.strip())
 return sorted(set(known)),unknown
doc=fitz.open(FILES['classes']);classes=[];subjects={};lessons=[];activities=[];cell_audit=[]
times=[('07:00','07:50'),('07:50','08:40'),('08:40','09:00'),('09:00','09:50'),('09:50','10:40'),('10:40','11:30'),('11:30','12:20'),('12:20','13:00'),('13:00','13:50'),('13:50','14:40'),('14:40','15:30'),('15:40','16:30'),('16:30','17:20'),('17:20','18:10'),('18:30','19:20'),('19:20','20:10'),('20:30','21:20'),('21:20','22:10')]
for pi,p in enumerate(doc):
 title=p.get_textbox(fitz.Rect(0,0,p.rect.width,48)).strip().replace('\n',' ')
 if pi>=30:
  activities.append({'page':pi+1,'title':title,'text':p.get_text(sort=True)});continue
 if pi<4:course='ted'
 elif pi<10:course='informatica'
 elif pi<15:course='im'
 elif pi<17:course='tce'
 elif pi<23:course='ads'
 else:course='civil'
 period=int(re.match(r'\d+',title).group()) if re.match(r'\d+',title) else 0
 class_id=f'{course}-{period}' if course in ['ads','tce'] or (course=='civil' and period) else f'{course}-{slug(title)}'
 if not period and course=='civil':class_id='civil-optativas-'+str(pi-28)
 classes.append({'id':class_id,'name':title,'courseId':course,'period':period,'sourcePage':pi+1})
 tables=p.find_tables().tables
 if not tables:raise ValueError(f'No table page {pi+1}')
 table=max(tables,key=lambda t:(t.bbox[2]-t.bbox[0])*(t.bbox[3]-t.bbox[1]))
 # Fixed 18 time columns are verified against the time header. Extra inferred columns are ignored.
 header=next(row for row in table.rows if any(c and '1D' in p.get_textbox(fitz.Rect(c)) for c in row.cells))
 gridleft=min(c[0] for c in header.cells if c and '1D' in p.get_textbox(fitz.Rect(c)))
 right=table.bbox[2];colw=(right-gridleft)/18
 dayrows=[]
 for row in table.rows:
  first=next((c for c in row.cells if c),None)
  if not first:continue
  label=p.get_textbox(fitz.Rect(first)).strip()
  if label in ['Seg','Ter','Qua','Qui','Sex']:dayrows.append((['Seg','Ter','Qua','Qui','Sex'].index(label)+1,row))
 if len(dayrows)!=5:raise ValueError(f'Expected 5 days, found {len(dayrows)} on page {pi+1}')
 for day,row in dayrows:
  seen=set()
  for box in row.cells:
   if not box or tuple(box) in seen or box[0]<gridleft-1:continue
   seen.add(tuple(box));subject=textparts(p,box,False);raw_teacher=textparts(p,box,True)
   if not subject:continue
   if not raw_teacher:raise ValueError(f'Missing teacher font role p{pi+1}: {subject}')
   ids,unknown=resolve_teachers(raw_teacher)
   subject_id=f'{course}-{slug(subject)}'
   subjects.setdefault(subject_id,{'id':subject_id,'courseId':course,'name':subject,'code':subject,'description':''})
   first_slot=round((box[0]-gridleft)/colw);last_slot=round((box[2]-gridleft)/colw)
   slots=[si for si in range(first_slot,last_slot) if si not in [2,7]]
   cell_audit.append({'page':pi+1,'classId':class_id,'day':day,'box':list(box),'subject':subject,'teacherLabel':raw_teacher,'slots':slots})
   for si in slots:
    start,end=times[si]
    lessons.append({'id':f'pdf-{class_id}-{day}-{si+1}','courseId':course,'classId':class_id,'subjectId':subject_id,'professorId':ids[0] if ids else None,'professorIds':ids,'roomId':None,'weekday':day,'startTime':start,'endTime':end,'validFrom':'2026-10-21','validTo':'2026-12-14' if course in ['ads','civil'] else None,'semester':'2026.2' if course in ['ads','civil'] else '2026','description':'','status':'published','source':{'document':'turmas-2026-10-27','page':pi+1,'teacherLabel':raw_teacher,'unresolvedTeachers':unknown,'cell':list(box)}})
# Merge contiguous periods only. Never merge through lunch or a break.
merged=[]
for lesson in lessons:
 previous=merged[-1] if merged else None
 if previous and previous['classId']==lesson['classId'] and previous['weekday']==lesson['weekday'] and previous['subjectId']==lesson['subjectId'] and previous['professorIds']==lesson['professorIds'] and previous['endTime']==lesson['startTime'] and previous['source']['cell']==lesson['source']['cell']:
  previous['endTime']=lesson['endTime']
 else:merged.append(lesson)
lessons=merged
# A single joint teaching session can appear on multiple class sheets. Store it once.
joint={}
for lesson in lessons:
 key=(lesson['weekday'],lesson['startTime'],lesson['endTime'],norm(subjects[lesson['subjectId']]['code']),tuple(lesson['professorIds']))
 if not lesson['professorIds']:key=key+(lesson['id'],)
 if key in joint:
  first=joint[key];first.setdefault('classIds',[first['classId']]).append(lesson['classId']);first.setdefault('subjectIds',[first['subjectId']]).append(lesson['subjectId']);first['source'].setdefault('jointPages',[first['source']['page']]).append(lesson['source']['page'])
 else:joint[key]=lesson
lessons=list(joint.values())
for lesson in lessons:
 if lesson.get('classIds'):
  lesson['classIds']=sorted(set(lesson['classIds']));lesson['subjectIds']=sorted(set(lesson['subjectIds']));lesson['id']='pdf-shared-'+hashlib.sha256('|'.join(lesson['classIds']+[str(lesson['weekday']),lesson['startTime'],lesson['subjectId']]).encode()).hexdigest()[:24]
# One stable color per course+discipline, distributed over the hue wheel.
for i,subject in enumerate(sorted(subjects.values(),key=lambda s:s['id'])):
 rgb=colorsys.hls_to_rgb((i*0.61803398875)%1,0.79+(i%3)*0.025,0.72)
 subject['color']='#'+''.join(f'{round(v*255):02x}' for v in rgb)
# Names expanded only where a source or the project explicitly identifies them.
for subject in subjects.values():
 if subject['code']=='B.D 2':subject['name']='Banco de Dados II'
manifest={'version':'pdf-2026-10-27','generatedFrom':[{'id':k,'filename':f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'pages':len(fitz.open(f))} for k,f in FILES.items()], 'courses':courses,'classes':classes,'professors':teachers,'subjects':list(subjects.values()),'lessons':lessons,'activities':activities,'audit':cell_audit,'notes':['O cabeçalho do PDF por professor indica 2026.1; os dois horários registram criação em 21/10/2026. A grade é usada a partir dessa data.','As grades não informam salas.','A vigência final de 14/12/2026 é aplicada somente aos cursos superiores conforme o calendário recebido. Para outras modalidades, a data final não foi informada.']}
out=ROOT/'backend/data/academic-2026.json';out.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
for name,file in FILES.items():
 target=ROOT/'frontend/public/documents'/({'classes':'turmas-2026-10-27.pdf','teachers':'professores-2026-10-27.pdf','calendar':'calendario-academico-2026.pdf'}[name]);target.write_bytes(file.read_bytes())
print(json.dumps({'courses':len(courses),'classes':len(classes),'professors':len(teachers),'subjects':len(subjects),'lessons':len(lessons),'cells':len(cell_audit),'unresolvedTeacherCells':len([c for c in cell_audit if resolve_teachers(c['teacherLabel'])[1]])},ensure_ascii=True))
