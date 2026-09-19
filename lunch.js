const NEWS='https://news.cueb.edu.cn/xydt/gjxydt/4792847229b44399a46a015251f00a41.htm';
const TRAINING='https://news.cueb.edu.cn/xyyc/5ef280179890472d86f0d0ca9d331fe3.htm';
export const meals=[
 {name:'麻辣香锅 + 米饭',place:'第三餐厅 · 二层',tip:'给午饭加点滋味，辣度按自己口味来。',source:TRAINING,note:'学校2023年军训介绍曾推荐二层麻辣香锅；档口可能调整。'},
 {name:'自选一荤两素 + 米饭',place:'第二餐厅 · 一层智慧食堂',tip:'想吃什么拿一点，今天由你掌勺搭配。',source:NEWS,note:'学校2024年介绍确认自选称重区；一荤两素为搭配建议。'},
 {name:'去试试云南风味',place:'第三餐厅 · 二层正厅',tip:'想吃一碗米线？去云南风味档口看看今天的菜单。',source:NEWS,note:'学校2024年介绍确认云南风味档口；米线为选餐灵感，非实时菜单。'},
 {name:'今天翻牌西北风味',place:'第三餐厅 · 二层正厅',tip:'想来碗热面，就看看西北风味今天有什么。',source:NEWS,note:'学校2024年介绍确认西北风味档口；面食为选餐灵感，非实时菜单。'},
 {name:'粤式风味探索日',place:'第三餐厅 · 二层正厅',tip:'平时总吃同一家？今天看看粤式窗口的招牌。',source:NEWS,note:'学校2024年介绍确认粤式风味档口，具体菜品以现场为准。'},
 {name:'自选小份，拼个午饭',place:'第三餐厅 · 二层正厅入口自选区',tip:'少量挑几样喜欢的菜，再配一份主食。',source:NEWS,note:'学校2024年介绍确认入口处自选餐区；组合为搭配建议。'}
];
export function lunchAt(ms,shift=0){const d=new Date(ms+8*3600000),date=d.toISOString().slice(0,10);return {date,visible:d.getUTCHours()>=6&&d.getUTCHours()<12,index:((Math.floor((ms+8*3600000)/86400000)+shift)%meals.length+meals.length)%meals.length};}
export function initLunch(now=Date.now){
 const $=id=>document.getElementById(id);let saved={};try{saved=JSON.parse(localStorage.getItem('cueb-lunch-v1'))||{};}catch{}
 let day='',shift=0;
 function check(){const today=lunchAt(now());if(day!==today.date){day=today.date;shift=saved.date===day&&Number.isInteger(saved.shift)&&saved.shift>=0&&saved.shift<meals.length?saved.shift:0;}
  $('lunch-panel').hidden=!today.visible;if(!today.visible)return;
  const meal=meals[lunchAt(now(),shift).index];$('lunch-name').textContent=meal.name;$('lunch-place').textContent=meal.place;$('lunch-tip').textContent=meal.tip;$('lunch-source').href=meal.source;$('lunch-note').textContent=meal.note;
 }
 $('lunch-shuffle').onclick=()=>{shift=(shift+1)%meals.length;saved={date:day,shift};try{localStorage.setItem('cueb-lunch-v1',JSON.stringify(saved));}catch{}check();};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});check();return {check};
}
