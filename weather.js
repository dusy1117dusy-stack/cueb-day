// Open-Meteo forecast API; fixed Beijing city coordinates, no device location.
const ENDPOINT='https://api.open-meteo.com/v1/forecast?latitude=39.90&longitude=116.40&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FShanghai&forecast_days=2&wind_speed_unit=ms';
const CACHE='cueb-weather-v1', SENT='cueb-weather-reminders-v1', REFRESH=15*60*1000;
const valid=n=>typeof n==='number'&&Number.isFinite(n);
const num=(n,suffix='')=>valid(n)?Math.round(n)+suffix:'—';
const bjDate=ms=>new Date(ms+8*3600000).toISOString().slice(0,10);
const stamp=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)?Date.parse(s+'+08:00'):NaN;
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const save=(key,data)=>{try{localStorage.setItem(key,JSON.stringify(data));}catch{}};
export function weatherName(code){
 return ({0:'晴',1:'晴间多云',2:'多云',3:'阴',45:'雾',48:'冻雾',51:'小毛毛雨',53:'毛毛雨',55:'较强毛毛雨',56:'冻毛毛雨',57:'冻毛毛雨',61:'小雨',63:'中雨',65:'大雨',66:'冻雨',67:'冻雨',71:'小雪',73:'中雪',75:'大雪',77:'雪粒',80:'阵雨',81:'较强阵雨',82:'强阵雨',85:'阵雪',86:'较强阵雪',95:'雷雨',96:'雷雨伴冰雹',99:'雷雨伴冰雹'})[code]||'天气情况待更新';
}
export function weatherView(raw,now){
 const current=raw?.current,at=stamp(current?.time);
 if(!valid(at)||!valid(current?.temperature_2m)||current.temperature_2m < -80||current.temperature_2m > 65)throw new Error('Invalid weather');
 const date=bjDate(now),i=raw?.daily?.time?.indexOf(date)??-1;
 const age=now-at,fresh=age>=-30*60000&&age<=90*60000;
 const daily=i<0?null:{low:raw.daily.temperature_2m_min?.[i],high:raw.daily.temperature_2m_max?.[i],rain:raw.daily.precipitation_probability_max?.[i]};
 const hours=Array.isArray(raw.hourly?.time)?raw.hourly.time.map((time,j)=>({time,at:stamp(time),temp:raw.hourly.temperature_2m?.[j],rain:raw.hourly.precipitation_probability?.[j],code:raw.hourly.weather_code?.[j]})).filter(h=>h.at>=now&&h.at<=now+6*3600000).slice(0,6):[];
 const advice=[];
 if(fresh){
  const codes=[current.weather_code,...hours.map(h=>h.code)];
  if(codes.some(c=>[95,96,99].includes(c)))advice.push({id:'storm',text:'有雷雨可能，出门前核对天气，尽量减少户外停留。'});
  const rainNow=valid(current.precipitation)&&current.precipitation>0;
  const wetCodes=codes.some(c=>[51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86].includes(c));
  if(rainNow||wetCodes||hours.some(h=>valid(h.rain)&&h.rain>=50))advice.push({id:'rain',text:'当前或未来6小时可能有降水，带伞，通勤多留一些时间。'});
  if(current.temperature_2m>=32||(valid(current.apparent_temperature)&&current.apparent_temperature>=35)||(valid(daily?.high)&&daily.high>=32))advice.push({id:'hot',text:'气温偏高，注意补水、防晒；军训时留意身体感受。'});
  if(current.temperature_2m<=5||(valid(current.apparent_temperature)&&current.apparent_temperature<=5)||(valid(daily?.low)&&daily.low<=5))advice.push({id:'cold',text:'气温偏低，出门和晚上回家记得保暖。'});
  else if(valid(daily?.low)&&daily.low<=15)advice.push({id:'jacket',text:'早晚偏凉，带件外套，晚上回家时方便加衣。'});
  if(valid(daily?.high)&&valid(daily?.low)&&daily.high-daily.low>=10)advice.push({id:'range',text:'今天温差较大，建议分层穿衣，随气温增减。'});
  if(valid(current.wind_speed_10m)&&current.wind_speed_10m>=10.8)advice.push({id:'wind',text:'当前风较大，步行和等公交时留意周边环境。'});
 }
 return {current,at,date,fresh,daily,hours,advice};
}
export function initWeather({now=Date.now,enabled=()=>false,notify=()=>{}}={}){
 const $=id=>document.getElementById(id);let data=null,fetchedAt=0,busy=false,failed=false,lastTry=0;
 let sent=read(SENT,{});if(!sent||typeof sent!=='object'||Array.isArray(sent))sent={};
 const cached=read(CACHE,null);
 if(cached&&valid(cached.fetchedAt)&&now()-cached.fetchedAt>=0&&now()-cached.fetchedAt<6*3600000){try{weatherView(cached.data,now());data=cached.data;fetchedAt=cached.fetchedAt;}catch{}}
 function render(){
  $('weather-refresh').disabled=busy;$('weather-refresh').textContent=busy?'刷新中…':'刷新';
  $('weather-panel').setAttribute('aria-busy',String(busy));
  if(!data){$('weather-status').textContent=failed?'暂时无法获取天气，请稍后重试。':'正在获取北京天气…';$('weather-data').hidden=true;return;}
  const v=weatherView(data,now()),c=v.current;$('weather-data').hidden=false;
  $('weather-status').textContent=`${!v.fresh?'旧数据，非当前天气 · ':failed?'刷新失败，显示缓存 · ':busy?'正在更新 · ':now()-fetchedAt>REFRESH?'待刷新 · ':''}天气时刻 ${c.time.replace('T',' ')}（北京）`;
  $('weather-temp').textContent=num(c.temperature_2m,'°');$('weather-condition').textContent=weatherName(c.weather_code);
  $('weather-feels').textContent=`体感 ${num(c.apparent_temperature,'℃')} · 湿度 ${num(c.relative_humidity_2m,'%')} · 风速 ${valid(c.wind_speed_10m)?c.wind_speed_10m.toFixed(1)+' m/s':'—'}`;
  $('weather-range').textContent=v.daily?`今日 ${num(v.daily.low,'°')} / ${num(v.daily.high,'°')}`:'今日高低温暂无数据';
  $('weather-rain').textContent=`今日最高降水概率 ${num(v.daily?.rain,'%')}`;
  $('weather-tips').replaceChildren();
  const tips=v.fresh?(v.advice.length?v.advice.map(a=>a.text):['天气暂未触发带伞或温度提醒，出门前再看一眼。']):['天气数据已过时，暂不生成天气提醒。请刷新或查看中国天气网。'];
  for(const text of tips){const p=document.createElement('p');p.textContent=text;$('weather-tips').append(p);}
  $('weather-hours').replaceChildren();
  for(const h of v.hours){const cell=document.createElement('div');for(const [tag,text] of [['span',(h.time.slice(0,10)!==v.date?'明日 ':'')+h.time.slice(11)],['strong',num(h.temp,'°')],['small',weatherName(h.code)],['small','降水 '+num(h.rain,'%')]]){const el=document.createElement(tag);el.textContent=text;cell.append(el);}$('weather-hours').append(cell);}
  if(!v.hours.length)$('weather-hours').textContent='未来小时预报暂不可用。';
 }
 function reminders(){
  if(!data||!enabled()||document.hidden)return;
  const v=weatherView(data,now());if(!v.fresh||failed||!v.daily)return;
  const hour=new Date(now()+8*3600000).getUTCHours();if(hour<6||hour>=23)return;
  const dailyKey=v.date+'-daily',newTips=v.advice.filter(a=>!sent[v.date+'-'+a.id]);
  if(!sent[dailyKey]||newTips.length){
   const body=`北京 ${num(v.current.temperature_2m,'℃')}，${weatherName(v.current.weather_code)}；今日 ${num(v.daily.low,'℃')}～${num(v.daily.high,'℃')}。`+(sent[dailyKey]?newTips:v.advice).map(a=>a.text).join('');
   notify(sent[dailyKey]?'天气与温度提醒':'今日天气提醒',body);
   sent[dailyKey]=true;for(const a of v.advice)sent[v.date+'-'+a.id]=true;
   for(const key of Object.keys(sent))if(!key.startsWith(v.date))delete sent[key];save(SENT,sent);
  }
 }
 async function refresh(force=false){
  if(busy||(!force&&now()-lastTry<(failed?60000:REFRESH)))return;
  busy=true;lastTry=now();render();
  try{const response=await fetch(ENDPOINT,{signal:AbortSignal.timeout(20000),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw new Error('Weather unavailable');const result=await response.json();weatherView(result,now());data=result;fetchedAt=now();failed=false;save(CACHE,{data,fetchedAt});}
  catch{failed=true;}finally{busy=false;render();reminders();}
 }
 $('weather-refresh').onclick=()=>refresh(true);
 function check(){if(document.hidden)return;render();reminders();if(!busy&&now()-lastTry>=(failed?60000:REFRESH)&&(!fetchedAt||now()-fetchedAt>=REFRESH))refresh();}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
 window.addEventListener('online',()=>{if(!document.hidden)refresh(true);});
 render();if(!data||now()-fetchedAt>=REFRESH)refresh();
 return {check};
}
