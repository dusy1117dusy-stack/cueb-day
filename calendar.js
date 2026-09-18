export const CET_SOURCE='https://cet.neea.cn/xhtml1/report/2609/1-1.htm';
export const REGISTRATION_URL='https://cet-bm.neea.edu.cn/';
export const cet={open:'2026-09-23T12:30:00+08:00',close:'2026-09-24T16:30:00+08:00',oral:'2026-11-21',written:'2026-12-12',writtenStart:'2026-12-12T09:00:00+08:00',writtenEnd:'2026-12-12T11:20:00+08:00'};
export const academicDates=[
 {start:'2026-08-31',end:'2026-09-20',title:'入学教育／体检／军训',kind:'orientation',detail:'集合时间、训练地点和每日结束时间以学院、教官通知为准。9月20日仍有补课，需同时核对。'},
 {start:'2026-09-20',end:'2026-09-20',title:'国庆调休补课',kind:'makeup',detail:'执行10月6日（第6周周二）教学计划，三门课已保留。'},
 {start:'2026-09-21',end:'2027-01-01',title:'2026级秋季教学',kind:'term',detail:'校历上课15周，遇已公布假期停课。'},
 {start:'2026-09-25',end:'2026-09-27',title:'中秋节放假',kind:'holiday',detail:'共3天，取消这些日期的日常课程与上课通知。'},
 {start:'2026-10-01',end:'2026-10-07',title:'国庆节放假',kind:'holiday',detail:'共7天；9月20日、10月10日按通知补课。'},
 {start:'2026-10-10',end:'2026-10-10',title:'国庆调休补课',kind:'makeup',detail:'执行10月7日（第6周周三）教学计划，毛概补课已保留。'},
 {start:'2027-01-04',end:'2027-01-08',title:'2026级期末考试',kind:'exams',detail:'具体科目、时间、考场尚未提供，按学校考试安排参加。'},
 {start:'2027-01-11',end:'2027-02-26',title:'寒假',kind:'holiday',detail:'学生寒假，2月28日返校报到。'},
 {start:'2027-02-28',end:'2027-02-28',title:'春季报到／注册／领教材',kind:'report',detail:'报到地点及时间以学院通知为准。'},
 {start:'2027-03-01',end:'2027-06-18',title:'春季学期上课',kind:'spring',detail:'上课16周；尚未导入春季个人课表，不套用秋季课程。'},
 {start:'2027-04-23',end:'2027-04-23',title:'春季运动会 · 停课一天',kind:'holiday',detail:'校历明确停课一天，活动安排以学校通知为准。'},
 {start:'2027-06-21',end:'2027-07-02',title:'春季期末考试',kind:'exams',detail:'具体科目、时间与考场以学校安排为准。'},
 {start:'2027-07-05',end:'2027-08-27',title:'暑假',kind:'holiday',detail:'7月5日起开始社会实践、暑期大讲堂和暑期学校，按需参加。'}
];
export function contextFor(date){const matches=academicDates.filter(x=>date>=x.start&&date<=x.end);return matches.find(x=>x.kind==='holiday')||matches.find(x=>x.kind==='makeup')||matches.find(x=>x.kind!=='term')||null;}
export const isHoliday=date=>academicDates.some(x=>x.kind==='holiday'&&date>=x.start&&date<=x.end);
export function registrationState(ms){return ms<Date.parse(cet.open)?'upcoming':ms<Date.parse(cet.close)?'open':'closed';}
const event=(id,title,start,end,description,reminders,allDay=false)=>({id,title,start,end,description,reminders,allDay});
export const writtenEvents=[
 event('register-open','首经贸英语四级报名开始','2026-09-23T12:30:00+08:00','2026-09-23T13:00:00+08:00','学校报名窗口：9月23日12:30—9月24日16:30。先核对报名资格，完成报名与缴费。https://cet-bm.neea.edu.cn/',['2026-09-22T12:30:00+08:00','2026-09-23T12:00:00+08:00','2026-09-23T12:30:00+08:00']),
 event('register-close','首经贸英语四级报名截止','2026-09-24T16:30:00+08:00','2026-09-24T16:40:00+08:00','检查报名、缴费是否完成。时间来自你提供的首经贸教务通知。',['2026-09-24T09:00:00+08:00','2026-09-24T15:30:00+08:00']),
 event('written-ticket','四级笔试准考证开始打印','2026-12-01T09:00:00+08:00','2026-12-01T09:15:00+08:00','已完成笔试报名及缴费的考生，登录报名网站下载打印准考证。',['2026-12-01T09:00:00+08:00']),
 event('written','英语四级笔试 CET4','2026-12-12T09:00:00+08:00','2026-12-12T11:20:00+08:00','北京时间09:00—11:20。仅报名成功者参加；考场、入场要求以准考证为准。提前检查证件与文具。',['2026-12-05T09:00:00+08:00','2026-12-11T09:00:00+08:00','2026-12-12T07:00:00+08:00'])
];
export const oralEvents=[
 event('oral-ticket','四级口试准考证开始打印（选报）','2026-11-17T09:00:00+08:00','2026-11-17T09:15:00+08:00','仅限已完成口试报名缴费者。',['2026-11-17T09:00:00+08:00']),
 event('oral','英语四级口试 CET-SET4（选报）','2026-11-21','2026-11-22','具体场次与考场详见准考证。本日历只标记考试日期；请自行补充场次时间。',['2026-11-20T09:00:00+08:00'],true)
];
export function dueExamReminders(ms){return [...writtenEvents,...oralEvents].flatMap(e=>e.reminders.map((time,i)=>({id:e.id+'-'+i,at:Date.parse(time),title:e.title,body:e.description}))).filter(r=>ms>=r.at&&ms<r.at+300000);}
const utc=s=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const escapeICS=s=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
function fold(line){let current='',bytes=0,result=[];for(const ch of line){const n=new TextEncoder().encode(ch).length;if(bytes+n>73){result.push(current);current=' ';bytes=1;}current+=ch;bytes+=n;}result.push(current);return result.join('\r\n');}
export function calendarICS(events){const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CUEB Day//CET4 Reminders//ZH-CN','CALSCALE:GREGORIAN','X-WR-CALNAME:首经贸英语四级提醒','X-WR-TIMEZONE:Asia/Shanghai'];for(const e of events){lines.push('BEGIN:VEVENT',`UID:${e.id}-2026@cueb-day`,`DTSTAMP:20260918T000000Z`,e.allDay?`DTSTART;VALUE=DATE:${e.start.replaceAll('-','')}`:`DTSTART:${utc(e.start)}`,e.allDay?`DTEND;VALUE=DATE:${e.end.replaceAll('-','')}`:`DTEND:${utc(e.end)}`,`SUMMARY:${escapeICS(e.title)}`,`DESCRIPTION:${escapeICS(e.description)}`,'STATUS:CONFIRMED');for(const r of e.reminders)lines.push('BEGIN:VALARM','ACTION:DISPLAY',`TRIGGER;VALUE=DATE-TIME:${utc(r)}`,`DESCRIPTION:${escapeICS(e.title)}`,'END:VALARM');lines.push('END:VEVENT');}lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';}
