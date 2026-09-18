import {initWeather} from './weather.js';
import {TERM_START,TERM_WEEKS,courses,notes,minutes,timeText,dateInfo,dateFor,dayCourses,stateAt} from './schedule.js';
import {cet,contextFor,academicDates,registrationState,dueExamReminders,CET_SOURCE,REGISTRATION_URL} from './calendar.js';
const $=id=>document.getElementById(id), days=['','周一','周二','周三','周四','周五','周六','周日'];
const defaults={origin:'home',commute:90,walk:20,pack:10,alerts:false};
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const saved=safeRead('cueb-preferences',{});
let prefs={...defaults,...saved};
for(const [key,min,max] of [['commute',30,180],['walk',5,60],['pack',0,120]])if(!Number.isFinite(prefs[key])||prefs[key]<min||prefs[key]>max)prefs[key]=defaults[key];
if(!['home','dorm'].includes(prefs.origin))prefs.origin='home';
let offset=0,info=dateInfo(),selectedWeek=Math.max(1,Math.min(TERM_WEEKS,info.week)),selectedDay=info.day,followToday=true,routeMode='home',routeCourse=null,lastMinute='',notified=safeRead('cueb-notified',{}),syncAt=0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=()=>Date.now()+offset;
function persist(){try{localStorage.setItem('cueb-preferences',JSON.stringify(prefs));return true;}catch{return false;}}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;}
function mapLink(origin,destination,mode='walking'){return 'https://api.map.baidu.com/direction?'+new URLSearchParams({origin,destination,mode,region:'北京',output:'html',src:'cueb_day'});}
const anchor=(url,text)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${text} ↗</a>`;
const building=c=>c?.room.startsWith('慎思楼')?'慎思楼':c?.room.startsWith('博学楼')?'博学楼':null;
const campusName=b=>'首都经济贸易大学校本部'+b;
function nextCourse(){for(let n=0;n<140;n++){const d=dateInfo(now()+n*86400000);if(d.week>TERM_WEEKS)break;const c=dayCourses(d.week,d.day).find(c=>n>0||minutes(c.start)>info.minute);if(c)return {...c,date:d.date,week:d.week};}return null;}
function leadFor(c,list){return c===list[0]&&prefs.origin==='home'?prefs.commute:prefs.walk;}
function viewDay(w,d,follow=false){if(!Number.isInteger(w)||w<1||w>TERM_WEEKS||!Number.isInteger(d)||d<1||d>7)throw new Error('教学周须为1–19，星期须为1–7');selectedWeek=w;selectedDay=d;followToday=follow;routeCourse=null;renderSchedule();renderRoute();return {week:w,day:d,date:dateFor(w,d),courses:dayCourses(w,d)};}
function renderLive(){
 info=dateInfo(now());const list=dayCourses(info.week,info.day),up=list.find(c=>minutes(c.start)>info.minute),lead=up?leadFor(up,list):prefs.walk,s=stateAt(info,lead),future=nextCourse();
 $('today-date').textContent=info.date.replaceAll('-','.')+' · '+days[info.day];$('week-label').textContent=info.week>=1&&info.week<=TERM_WEEKS?`第 ${info.week} 教学周 · ${info.week%2?'单':'双'}周`:'当前不在本学期课表范围';
 let label,title,detail,countdown;
 if(s.type==='class'){label='正在上课';title=s.current.title;detail=`${s.current.room} · ${s.current.start}–${s.current.end}`;countdown=`距下课 ${minutes(s.current.end)-info.minute} 分钟`;}
 else if(s.next){const first=s.next===s.list[0],from=first?(prefs.origin==='home'?'鸿运花园':'华侨学院宿舍'):'上一节课所在教学区域',depart=minutes(s.next.start)-lead;label=s.type==='leave'?'该出发了':first?'下一节课':'课间时间';title=s.type==='leave'?`前往${building(s.next)||'上课地点'}`:s.next.title;detail=`${s.next.start} 上课 · ${s.next.room}；从${from}出发。`;countdown=info.minute<depart?`建议 ${timeText(depart)} 出门 · 还有 ${depart-info.minute} 分钟`:`距上课 ${minutes(s.next.start)-info.minute} 分钟`;
 }else if(s.type==='home'){label='今日课程结束';title='收好东西，回家吧。';detail=`最后一节 ${s.last.end} 结束 · 返家终点：东城区鸿运花园`;const dep=minutes(s.last.end)+prefs.pack;countdown=info.minute<dep?`建议 ${timeText(dep)} 出发 · 还有 ${dep-info.minute} 分钟`:`返家路线已准备好 · 出发参考 ${timeText(dep)}`;}
 else{label=s.type==='weekend'?'周末休息':s.type==='after-term'?'学期课表已结束':s.type==='before-term'?'学期尚未开始':'今日无已排理论课';title=s.type==='weekend'?'今天，把时间留给自己。':s.type==='free'?'按自己的节奏来。':s.type==='after-term'?'这学期，辛苦了。':'准备迎接新学期。';detail=s.type==='free'?'课表没有安排理论课；军训、实践等另行通知的任务仍需核对。':s.type==='weekend'?'今天没有课表补课安排，可以休息。':'本页课程覆盖第 1–19 周，后续安排请核对学校通知。';countdown=future?`下一次上课：${future.date.slice(5).replace('-','/')} ${future.start}`:'暂无后续已排课程';}
 if(['orientation','holiday','exams'].includes(s.type)){label=s.type==='orientation'?'入学教育／军训':s.type==='holiday'?'假期安排':'考试周';title=s.context.title;detail=s.context.detail;countdown=s.type==='orientation'?'8月31日—9月20日 · 不按普通无课日安排':s.type==='holiday'?`${s.context.start}—${s.context.end} · 日常课程提醒暂停`:'请核对个人考试安排，未生成具体科目提醒';}
 if(s.type==='after-term'&&s.context){label='校历安排';title=s.context.title;detail=s.context.detail;countdown=`${s.context.start}—${s.context.end}`;}
 if(!s.current&&info.date===cet.written){label='四级笔试日';title='今天，英语四级笔试。';detail='北京时间 09:00–11:20。报名成功者参加，考场与入场要求以准考证为准。';countdown=info.minute<540?`距开考 ${540-info.minute} 分钟`:info.minute<680?'笔试时段 · 09:00–11:20':'今日笔试时段已结束';}
 if(!s.current&&info.date===cet.oral){label='四级口试日 · 选报';title='已报口试的话，记得赴考。';detail='具体场次与地点以口试准考证为准。';countdown='先核对自己的场次，不按全天待考安排';}
 $('now-label').textContent=label;$('now-title').textContent=title;$('now-detail').textContent=detail;$('countdown').textContent=countdown;
 $('now-action').textContent=s.current||s.next?'查看上课路线 ↗':'查看返家路线 ↗';
 $('home-title').textContent=s.last?`${s.last.end}，今天的课结束。`:'每晚，都回鸿运花园。';
 $('home-detail').textContent=s.last?`预留 ${prefs.pack} 分钟收拾，建议 ${timeText(minutes(s.last.end)+prefs.pack)} 启程。沿常用地铁与公交路线回家，出门前可查看实时导航。`:'无课日不安排强制返家提醒。去过学校的话，随时可沿下方路线回家。';
 if(s.type==='orientation')$('home-detail').textContent='军训每日结束时间尚未提供；待教官通知当天解散后，再按返家路线出发。';
 document.title=s.current?`${s.current.title} · 课间`:'课间 · 首经贸日程';
 renderNotifyLabel();
}
function renderSchedule(){
 const list=dayCourses(selectedWeek,selectedDay),selectedDate=dateFor(selectedWeek,selectedDay),isToday=selectedDate===info.date;
 $('week-select').value=selectedWeek;$('week-prev').disabled=selectedWeek===1;$('week-next').disabled=selectedWeek===TERM_WEEKS;
 $('day-tabs').innerHTML=days.slice(1).map((d,i)=>{const day=i+1,dt=dateFor(selectedWeek,day),has=dayCourses(selectedWeek,day).length;return `<button id="day-${day}" role="tab" aria-controls="course-list" aria-selected="${selectedDay===day}" tabindex="${selectedDay===day?0:-1}" data-day="${day}" class="${dt===info.date?'today':''}" aria-label="${d} ${dt}${has?' 有课':' 无已排课'}"><span>${d}</span><strong>${Number(dt.slice(-2))}</strong><i style="visibility:${has?'visible':'hidden'}" aria-hidden="true"></i></button>`;}).join('');
 $('course-list').setAttribute('aria-labelledby',`day-${selectedDay}`);
 $('day-caption').textContent=`${isToday?'今天 · ':''}${selectedDate.replaceAll('-','.')} · ${list.length} 门课${selectedDay>5&&list.length?' · 周末补课':''}`;
 $('course-list').innerHTML=list.length?list.map(c=>{const current=isToday&&info.minute>=minutes(c.start)&&info.minute<minutes(c.end),done=isToday&&info.minute>=minutes(c.end);return `<article class="course ${current?'current':done?'done':''}"><div class="course-time">${c.start}<small>${c.end}</small></div><div class="course-body"><h3>${c.title}</h3><p>${c.room}</p><div class="course-meta"><span><small>${c.period}</small> ${current?'<span class="course-tag">进行中</span>':done?'<span class="course-tag">已结束</span>':selectedDay>5?'<span class="course-tag extra">补课</span>':''}</span><button class="text-button" data-course="${c.id}">怎么去 ↗</button></div></div></article>`;}).join(''):`<div class="empty"><div class="empty-mark" aria-hidden="true">${selectedDay>5?'☀':'—'}</div><h3>${selectedDay>5?'周末，好好休息。':'这一天，没有已排理论课。'}</h3><p>${selectedDay>5?'本日无补课安排。':'可以自主安排；留意军训、实践等另行通知的任务。'}</p></div>`;
 if(list.length){const first=list[0],last=list.at(-1),lead=prefs.origin==='home'?prefs.commute:prefs.walk;$('day-summary').innerHTML=`<strong>${timeText(minutes(first.start)-lead)} 建议出门</strong> · 从${prefs.origin==='home'?'鸿运花园':'华侨学院宿舍'}出发<br><strong>${timeText(minutes(last.end)+prefs.pack)} 建议回家</strong> · ${last.end} 结束最后一节课${selectedDay>5?'<br>这是课表上的补课日，其余周末按休息安排。':''}`;}
 else $('day-summary').textContent=selectedWeek===6&&[2,3].includes(selectedDay)?'第 6 周周二、周三相关课程停排；本周六有一节毛概补课。':'无课程计时提醒。未排定时间的课程，请看下方说明。';
 const context=contextFor(selectedDate);
 if(!list.length&&context){$('course-list').innerHTML=`<div class="empty"><div class="empty-mark" aria-hidden="true">${context.kind==='holiday'?'☀':'◎'}</div><h3>${esc(context.title)}</h3><p>${esc(context.detail)}</p></div>`;$('day-summary').textContent=context.kind==='orientation'?'军训集合、训练地点与解散时间尚待通知，暂不生成定时提醒。':context.kind==='holiday'?'已按学校放假通知停课，不触发日常上课与返家提醒。':context.detail;}
 if(list.length&&context?.kind==='makeup')$('day-summary').innerHTML+=`<br>${esc(context.detail)}`;
 if(selectedDate===cet.written)$('day-summary').innerHTML='<strong>四级笔试：09:00–11:20</strong><br>报名成功者按准考证参加；今日不作为普通周末休息日。';
 if(selectedDate===cet.oral)$('day-summary').innerHTML='<strong>四级口试（选报）</strong><br>已报名者按准考证上的场次与地点参加。';
 if(!list.length&&[cet.written,cet.oral].includes(selectedDate))$('course-list').innerHTML=`<div class="empty"><div class="empty-mark" aria-hidden="true">◎</div><h3>${selectedDate===cet.written?'英语四级笔试日':'四级口试日（选报）'}</h3><p>${selectedDate===cet.written?'09:00–11:20，已报名者按准考证参加。':'已报名口试者请核对个人场次与考场。'}</p></div>`;
}
const step=(n,title,detail,cls='',extra='')=>`<div class="route-step ${cls}"><span class="step-dot">${n}</span><div><strong>${title}</strong><p>${detail}</p>${extra}</div></div>`;
function renderRoute(){
 $('route-home').setAttribute('aria-pressed',String(routeMode==='home'));$('route-campus').setAttribute('aria-pressed',String(routeMode==='campus'));
 const daily=dayCourses(info.week,info.day),live=daily.find(c=>minutes(c.end)>info.minute),c=courses.find(c=>c.id===routeCourse)||(followToday?live:null)||dayCourses(selectedWeek,selectedDay)[0],b=building(c);
 if(routeMode==='home'){
 $('route-content').innerHTML=`<p class="route-intro">校本部 → 东城区鸿运花园<br>地铁换乘 1 次，公交段按你的常用路线。</p>`+
 step('1','从教学区域走到首经贸站','从当前教学楼或华侨学院宿舍出发，导航到地铁首经贸站，进站找 10 号线。')+
 step('10','首经贸 → 宋家庄','乘往纪家庙方向的 10 号线，7 站到宋家庄。','blue','<details><summary>查看沿途站点</summary>首经贸 → 纪家庙 → 草桥 → 角门西 → 角门东 → 大红门 → 石榴庄 → 宋家庄</details>')+
 step('5','宋家庄 → 蒲黄榆','站内换乘 5 号线，往天通苑北方向，经刘家窑，2 站后在蒲黄榆下车。','purple')+
 step('4','蒲黄榆 → 东侧路','按你提供的习惯，乘 599 / 43 / 39 / 128 路中可到东侧路的车辆，坐 1 站；上车前核对方向与停站表。')+
 step('5','东侧路 → 鸿运花园','下车后步行到东城区鸿运花园（天坛东路48号）。')+
 `<div class="route-links">${anchor(mapLink('首都经济贸易大学校本部','首经贸地铁站'),'步行到首经贸站')}${anchor(mapLink('蒲黄榆地铁站','东侧路公交站','transit'),'查看公交方向与上车点')}${anchor(mapLink('东侧路公交站','北京市东城区鸿运花园'),'查看最后一段步行')}</div><p class="route-note">公交候选线路和“一站”来自你的说明；出口、站台与实时停站请以导航及现场为准。未连接实时公交或位置追踪。</p>`;
 }else if(!c){$('route-content').innerHTML='<div class="empty"><h3>这一天没有已排课</h3><p>选择有课的日期，即可查看对应教室与上课路线。</p></div>';}
 else{
 const list=dayCourses(selectedWeek,selectedDay),idx=list.findIndex(x=>x.id===c.id),prev=idx>0?list[idx-1]:null,from=prev?(building(prev)?campusName(building(prev)):'首都经济贸易大学校本部'):prefs.origin==='dorm'?'首都经济贸易大学华侨学院':'北京市东城区鸿运花园';
 let content=`<p class="route-intro">${c.title}<br>${c.start} 开始 · ${c.room}</p>`;
 if(!prev&&prefs.origin==='home')content+=step('1','鸿运花园 → 蒲黄榆站','步行至东侧路站，核对返程站台与公交方向，前往蒲黄榆地铁站。')+step('5','蒲黄榆 → 宋家庄','乘 5 号线宋家庄方向，经刘家窑，2 站后换乘。','purple')+step('10','宋家庄 → 首经贸','换乘 10 号线往石榴庄方向，7 站到首经贸；出站后步行到校本部。','blue');
 else content+=step('1',prev?'从上一节课地点出发':'从华侨学院宿舍出发',prev?`${prev.room} → ${b||'下一节上课地点'}。校内步行预留 ${prefs.walk} 分钟。`:`前往${b||'老师指定的上课地点'}，校内步行预留 ${prefs.walk} 分钟。`);
 content+=step('终',b?`${b} · ${c.room.split('-')[1]}`:'先确认上课地点',b?'地图导航至楼宇；进入后按楼内导览找到对应教室。“阶”指阶梯教室编号，不代表楼层。':'截图未提供具体场地，先向任课老师或班级通知确认，避免走错。');
 content+=`<div class="route-links">${b?anchor(mapLink(from,campusName(b),from.includes('鸿运')?'transit':'walking'),prev?'查看楼间步行路线':'打开上课导航'):anchor(mapLink(from,'首都经济贸易大学校本部',from.includes('鸿运')?'transit':'walking'),'查看到校路线')}</div><p class="route-note">地图用于找到楼宇；校内道路、可用校门和教室位置以现场导览为准。</p>`;$('route-content').innerHTML=content;
 }
}
function renderNotifyLabel(){const unsupported=!('Notification'in window);$('notify').textContent=prefs.alerts?(unsupported||Notification.permission!=='granted'?'页内提醒已开':'提醒已开启'):'开启提醒';$('notify').setAttribute('aria-pressed',String(prefs.alerts));}
function updateExamClock(){
 const ms=now(),state=registrationState(ms),target=Date.parse(state==='upcoming'?cet.open:cet.close),delta=Math.max(0,Math.ceil((target-ms)/60000)),d=Math.floor(delta/1440),h=Math.floor(delta%1440/60),m=delta%60;
 $('registration-status').textContent=state==='upcoming'?'报名尚未开始':state==='open'?'正在报名 · 别错过截止':'本次报名已截止';
 $('registration-status').classList.toggle('urgent',state==='open');
 $('registration-countdown').textContent=state==='closed'?'请核对自己的报名、缴费结果':`${state==='upcoming'?'距报名开始':'距截止'} ${d?d+'天 ':''}${h}小时 ${m}分钟`;
 for(const [id,date] of [['written-countdown',cet.written],['oral-countdown',cet.oral]]){const n=Math.round((Date.parse(date+'T00:00:00Z')-Date.parse(info.date+'T00:00:00Z'))/86400000);$(id).textContent=n>0?`还有 ${n} 天`:n===0?'就是今天':`本次考试日期已过`;}
}
$('academic-list').innerHTML=academicDates.map(e=>`<div class="academic-row"><span>${e.start.replaceAll('-','.')} ${e.start!==e.end?'— '+e.end.replaceAll('-','.'):''}</span><strong>${e.title}</strong><p>${e.detail}</p></div>`).join('');
const busPanel=document.createElement('section');busPanel.className='bus-panel';busPanel.setAttribute('aria-label','公交到站查询');busPanel.innerHTML='<div class="section-head"><h3>公交到站查询</h3><span class="external-badge">外部实时查询</span></div><p>蒲黄榆上车 · 东侧路下车</p><div class="bus-lines" aria-label="你的常用公交"><span>599路</span><span>43路</span><span>39路</span><span>128路</span></div><p class="route-note">站内实时到站数据暂未接入。进入公交或地图应用，选择“蒲黄榆”站和前往东侧路的方向，查看车辆剩余站数及预计到站。</p><div class="route-links"><a href="https://www.bjbus.com/map/" target="_blank" rel="noopener noreferrer">打开北京公交官网查询 ↗</a><a href="https://apps.apple.com/cn/app/id1622575757" target="_blank" rel="noopener noreferrer">iPhone：公交集团官方「一路同行」↗</a><button id="copy-bus">复制常用站点和线路</button><a id="android-live-bus" hidden href="bdapp://map/page/realtimebus?mode=NORMAL_MAP_MODE&amp;src=webapp.cueb.day">打开百度地图实时公交（安卓）↗</a></div><p class="route-note">iPhone 可在公交集团「一路同行」或百度地图 App 中查询。若没有到站预报，请以应用提示为准，本站不估算车辆位置。</p>';
$('route').append(busPanel);
if(/Android/i.test(navigator.userAgent))$('android-live-bus').hidden=false;
$('copy-bus').onclick=async()=>{const message='北京｜蒲黄榆 → 东侧路｜常用线路：599、43、39、128路。请核对行驶方向及停站。';try{await navigator.clipboard.writeText(message);toast('常用公交信息已复制，可粘贴到公交或地图应用中查询。');}catch{toast(message);}};
function checkReminders(){if(!prefs.alerts)return;const list=dayCourses(info.week,info.day);const events=list.flatMap((c,i)=>[{id:c.id+'-leave',at:minutes(c.start)-leadFor(c,list),title:'该出发上课了',body:`${c.title} · ${c.start} · ${c.room}`},{id:c.id+'-start',at:minutes(c.start),title:'现在开始上课',body:`${c.title} · ${c.room}`}]);if(list.length)events.push({id:'home',at:minutes(list.at(-1).end)+prefs.pack,title:'今天的课结束了，准备回家',body:'首经贸 → 宋家庄换5号线 → 蒲黄榆 → 东侧路 → 鸿运花园'});events.push(...dueExamReminders(now()).map(r=>({...r,at:info.minute})));for(const ev of events){const key=info.date+'-'+ev.id;if(info.minute<ev.at||info.minute>=ev.at+5||notified[key])continue;notified[key]=true;toast(ev.title+'：'+ev.body);try{if('Notification'in window&&Notification.permission==='granted')new Notification(ev.title,{body:ev.body,tag:key});}catch{} }for(const key of Object.keys(notified))if(!key.startsWith(info.date))delete notified[key];try{localStorage.setItem('cueb-notified',JSON.stringify(notified));}catch{}}
function tick(force=false){info=dateInfo(now());$('clock').innerHTML=`${timeText(info.minute)}<span>:${String(info.second).padStart(2,'0')}</span>`;const key=info.date+':'+info.minute;if(force||key!==lastMinute){lastMinute=key;renderLive();if(followToday){selectedWeek=Math.max(1,Math.min(TERM_WEEKS,info.week));selectedDay=info.day;}renderSchedule();renderRoute();updateExamClock();checkReminders();weather.check();}}
async function syncClock(){const started=Date.now();try{const response=await fetch('./index.html?clock='+started,{method:'HEAD',cache:'no-store',signal:AbortSignal.timeout(6000)}),stamp=Date.parse(response.headers.get('date')||''),rtt=Date.now()-started;if(!response.ok||!Number.isFinite(stamp)||rtt>6000)throw new Error('clock unavailable');offset=stamp+rtt/2-Date.now();syncAt=Date.now();$('sync-status').textContent='已联网校时';tick(true);}catch{$('sync-status').textContent=syncAt?'使用上次校时':'设备时间 · 未校时';}}
$('week-select').innerHTML=Array.from({length:TERM_WEEKS},(_,i)=>`<option value="${i+1}">第 ${i+1} 周</option>`).join('');
$('unscheduled').innerHTML='<ul>'+notes.map(([title,w])=>`<li>${title} · ${w} · 时间地点另行通知</li>`).join('')+'</ul><p>第1周周一为8月31日，与学校校历一致。8月31日—9月20日为入学教育／体检／军训；9月20日、10月10日保留补课。已停排9月25—27日与10月1—7日的课程。</p>';
$('week-select').addEventListener('change',e=>viewDay(Number(e.target.value),selectedDay));$('week-prev').onclick=()=>viewDay(selectedWeek-1,selectedDay);$('week-next').onclick=()=>viewDay(selectedWeek+1,selectedDay);$('back-today').onclick=()=>viewDay(Math.max(1,Math.min(TERM_WEEKS,info.week)),info.day,true);
$('day-tabs').onclick=e=>{const b=e.target.closest('[data-day]');if(b)viewDay(selectedWeek,Number(b.dataset.day));};
$('day-tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const d=e.key==='Home'?1:e.key==='End'?7:((selectedDay-1+(e.key==='ArrowRight'?1:6))%7)+1;viewDay(selectedWeek,d);$('day-'+d).focus();};
$('course-list').onclick=e=>{const b=e.target.closest('[data-course]');if(!b)return;routeCourse=b.dataset.course;routeMode='campus';renderRoute();$('route').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};
$('route-home').onclick=()=>{routeMode='home';renderRoute();};$('route-campus').onclick=()=>{routeMode='campus';renderRoute();};
$('now-action').onclick=()=>{const list=dayCourses(info.week,info.day),c=list.find(c=>minutes(c.end)>info.minute);viewDay(Math.max(1,Math.min(TERM_WEEKS,info.week)),info.day,true);routeCourse=c?.id;routeMode=c?'campus':'home';renderRoute();};
$('settings-open').onclick=()=>{for(const k of ['origin','commute','walk','pack'])$(k).value=prefs[k];$('settings').showModal();};$('settings-close').onclick=()=>$('settings').close();
$('settings-form').onsubmit=e=>{e.preventDefault();if(!e.target.reportValidity())return;for(const k of ['commute','walk','pack'])prefs[k]=Number($(k).value);prefs.origin=$('origin').value;const ok=persist();$('settings').close();tick(true);toast(ok?'设置已保存，出门和返家提醒已更新。':'本次设置已更新；浏览器未允许保存，关闭页面后会恢复默认值。');};
$('notify').onclick=async()=>{if(prefs.alerts){prefs.alerts=false;persist();renderNotifyLabel();toast('已关闭通知提醒，实时课表仍会更新。');return;}prefs.alerts=true;persist();renderNotifyLabel();if('Notification'in window){try{const p=await Notification.requestPermission();toast(p==='granted'?'提醒已开启：包含课程、返家及四级重要日期。请保持网页打开；休眠或关闭页面后不保证送达。':'已开启页内提醒。系统通知未获授权，请保持网页打开查看提醒。');}catch{toast('已开启页内提醒；此浏览器暂不支持系统通知。');}}else toast('已开启页内提醒；此浏览器不支持系统通知。');renderNotifyLabel();checkReminders();weather.check();};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick(true);if(Date.now()-syncAt>300000)syncClock();}});window.addEventListener('pageshow',()=>tick(true));
const weather=initWeather({now,enabled:()=>prefs.alerts,notify:(title,body)=>{toast(title+'：'+body);try{if('Notification' in window && Notification.permission==='granted')new Notification(title,{body,tag:'cueb-weather'});}catch{}}});
tick(true);setInterval(()=>{if(!document.hidden)tick();else{info=dateInfo(now());checkReminders();}},1000);syncClock();setInterval(syncClock,300000);
const context=document.modelContext;
if(context?.registerTool){const lifecycle=new AbortController();try{Promise.resolve(context.registerTool({name:'view_course_day',title:'查看某日课表',description:'按教学周和星期切换可见课表并返回该日课程；不会改变真实时间或通知设置。',inputSchema:{type:'object',properties:{week:{type:'integer',minimum:1,maximum:19},day:{type:'integer',minimum:1,maximum:7}},required:['week','day'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['week','day'].includes(k)))throw new Error('无效参数');return viewDay(input.week,input.day);}}, {signal:lifecycle.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
