import {isHoliday,contextFor} from './calendar.js';
export const TERM_START='2026-08-31', TERM_WEEKS=19;
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const regular=range(4,18), skip6=regular.filter(w=>w!==6);
const item=(id,day,title,start,end,room,weeks,period)=>({id,day,title,start,end,room,weeks,period});
export const courses=[
item('management',1,'管理学','13:30','15:05','慎思楼-201',regular,'06–07节'),
item('pe',1,'体育Ⅰ','15:25','17:00','上课场地待老师通知',regular,'08–09节'),
item('xi',2,'习近平新时代中国特色社会主义思想概论','09:55','11:30','博学楼-阶10',skip6,'03–04节'),
item('english-tue',2,'大学英语Ⅰ','13:30','15:05','慎思楼-505',skip6,'06–07节'),
item('math-tue',2,'微积分Ⅰ','15:25','17:00','慎思楼-501',skip6,'08–09节'),
item('mao',3,'毛泽东思想和中国特色社会主义理论体系概论','09:55','11:30','博学楼-522',skip6,'03–04节'),
item('security-a',4,'国家安全教育','13:30','15:05','教室未标注',range(4,7),'06–07节'),
item('security-b',4,'国家安全教育','13:30','15:05','慎思楼-316',range(8,11),'06–07节'),
item('economics',4,'经济学原理','15:25','17:00','博学楼-616',regular,'08–09节'),
item('math-fri',5,'微积分Ⅰ','08:00','09:35','慎思楼-501',regular,'01–02节'),
item('english-fri',5,'大学英语Ⅰ','09:55','11:30','慎思楼-505',regular,'03–04节'),
item('ai',5,'人工智能导论','13:30','15:05','博学楼-阶8',[...range(4,7),...range(10,13),17],'06–07节'),
item('mao-extra',6,'毛泽东思想和中国特色社会主义理论体系概论','09:55','11:30','博学楼-522',[6],'03–04节'),
item('xi-extra',7,'习近平新时代中国特色社会主义思想概论','09:55','11:30','博学楼-阶10',[3],'03–04节'),
item('english-extra',7,'大学英语Ⅰ','13:30','15:05','慎思楼-505',[3],'06–07节'),
item('math-extra',7,'微积分Ⅰ','15:25','17:00','慎思楼-501',[3],'08–09节')];
export const notes=[['军事技能','4–18周'],['军事理论','4–18周'],['毛泽东思想和中国特色社会主义理论体系概论社会实践','4–18周'],['习近平新时代中国特色社会主义思想概论社会实践','4–18周'],['形势与政策（一）','1–8周']];
export const minutes=s=>Number(s.slice(0,2))*60+Number(s.slice(3,5));
export const timeText=m=>`${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
export function dateInfo(ms=Date.now(),start=TERM_START){const bj=new Date(ms+28800000),date=bj.toISOString().slice(0,10),day=bj.getUTCDay()||7;const week=Math.floor((Date.parse(date+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/604800000)+1;return {date,day,week,minute:bj.getUTCHours()*60+bj.getUTCMinutes(),second:bj.getUTCSeconds()};}
export function dateFor(week,day,start=TERM_START){return new Date(Date.parse(start+'T00:00:00Z')+((week-1)*7+day-1)*86400000).toISOString().slice(0,10);}
export function dayCourses(week,day){if(isHoliday(dateFor(week,day)))return [];return courses.filter(c=>c.day===day&&c.weeks.includes(week)).sort((a,b)=>minutes(a.start)-minutes(b.start));}
export function stateAt(info,lead=20){const list=dayCourses(info.week,info.day),current=list.find(c=>minutes(c.start)<=info.minute&&info.minute<minutes(c.end)),next=list.find(c=>minutes(c.start)>info.minute),last=list.at(-1),context=contextFor(info.date);const type=current?'class':next?(info.minute>=minutes(next.start)-lead?'leave':'break'):last?'home':context?.kind==='holiday'?'holiday':context?.kind==='orientation'?'orientation':context?.kind==='exams'?'exams':info.week<1?'before-term':info.week>TERM_WEEKS?'after-term':info.day>5?'weekend':'free';return {type,list,current,next,last,context};}
