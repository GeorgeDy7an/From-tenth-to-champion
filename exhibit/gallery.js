'use strict';
const $ = id => document.getElementById(id);
const copy = {
  project:['个人篮球策略游戏','A personal basketball strategy game'],
  title:['从第十到冠军','From Tenth to Champion'],
  lead:['组建五人阵容，在每节选择战术，把一轮征程打成自己的夺冠路线。','Build your five, call the tactics, and take your team from the play-in to the title.'],
  enter:['体验互动系统','Try the exhibits'],lab:['互动系统','Interactive exhibits'],
  gallery:['实机图集','Game gallery'],process:['开发复盘','Development notes'],
  labNote:['三个独立小样，使用虚构数据与简化规则。','Three standalone exhibits with fictional data and simplified rules.'],
  tactic:['单节战术','Quarter tactics'],growth:['无尽成长','Endless progression'],save:['存档冲突','Save conflicts'],
  notes:['完整设计笔记','Full design notes'],demo:['独立单节小样','Standalone quarter demo'],code:['精选代码：保存队列','Selected code: save queue']
};
const images = [
  ['match','game','比赛球场','Match court','双方五人、单节比分与临场操作。','Five players per side, quarter score, and match controls.'],
  ['tactics','game','单节战术选择','Quarter tactics','在开节前选择战术，比较命中机会与适配。','Compare tactical options before the quarter begins.'],
  ['matchup','game','赛前对阵','Match preview','进入比赛前检查对手与首发。','Inspect the opponent and starters before tip-off.'],
  ['result','game','赛后结算','Game result','比分、单节走势与本队最佳。','Final score, quarter breakdown, and team MVP.'],
  ['home','journey','双语首页','Bilingual home','同一个游戏入口下切换语言。','Switch languages from the same game home.'],
  ['modes','journey','征程模式','Journey modes','经典闯关与无尽远征。','Classic journey and endless expedition.'],
  ['draft','journey','抽取球队','Team draw','从三支候选队伍中选择征程起点。','Choose a starting team from three offers.'],
  ['lineup','journey','阵容整备','Lineup preparation','整备首发、替补和随队教练。','Prepare starters, bench players, and a coach.'],
  ['daily','journey','每日挑战','Daily challenge','预设阵容与当日对阵。','A daily fixture with preset lineups.'],
  ['career','career','球员生涯','Player career','从球员入口进入独立的生涯路线。','Choose a player to enter a dedicated career path.'],
  ['chapter','career','生涯章节','Career chapter','章节目标与可挑战场次。','Chapter goals and playable fixtures.'],
  ['recruit','career','球员招募','Player recruitment','抽取球员并查看保底进度。','Recruit players and check guaranteed draw progress.']
];
const cases = [
  [['把阵容选择变成战术选择','Make lineup choices matter during play'],
   ['先给球员分配战术风格，再把相关贡献显示在战术卡上。这样换人不只改变平均评分，还会改变哪张战术值得选。','Assign tactical styles to players and surface relevant contributions on the tactic cards. A substitution changes which play is worth calling, not just the average rating.']],
  [['保留成长，限制数值膨胀','Keep growth, contain runaway ratings'],
   ['一次候选规则对照跑了 31,459 场模拟。样本最高实战评分由 126 降到 105，但中段仍偏简单；这个结果只支持上限有效，不能代表线上胜率。','One candidate comparison covered 31,459 simulated games. The observed maximum effective rating fell from 126 to 105, but the midgame stayed easy. This supports the cap, not a claim about live win rates.']],
  [['先保护进度，再处理冲突','Protect progress before resolving conflicts'],
   ['同档串行写入。恢复时先读远端；若两边都发生了变化，保留本地副本，让玩家决定采用哪个版本。','Serialize writes per slot. Read the remote revision before retrying. If both copies changed, preserve a local copy and let the player choose which version to keep.']],
  [['拆出离线版，验证双语读档','Separate offline play and verify bilingual saves'],
   ['剥离平台服务后，在阻断外网请求的浏览器里完成比赛，切换语言，再读回同一场比赛的结果。','After removing platform services, finish a match with outside requests blocked, switch languages, and read back the same result.']]
];
const categories = {all:['全部','All'],game:['比赛','Match'],journey:['征程','Journey'],career:['生涯与招募','Career & recruitment']};
const tactics = {drive:['突破分球','Drive and kick'],pick:['高位挡拆','High pick and roll'],perimeter:['外线强攻','Perimeter attack']};
let locale='zh', lab='tactic', filter='all', selected='pick', seed=3581, played=null, result=null, rating=113, saveStep=0, resolution=null, viewed=0;
try { if(localStorage.getItem('exhibit-language')==='en')locale='en'; } catch {}
const tr = (zh,en) => locale==='zh'?zh:en;
const pair = list => tr(...list);
const src = item => 'screenshots/'+locale+'/'+item[0]+'.png';
const imageTitle = item => tr(item[2],item[3]);
const visible = () => images.filter(item=>filter==='all'||item[1]===filter);
function buttons(container, items, key, attribute, select) {
  container.replaceChildren(...items.map(([id,label])=>{
    const button=document.createElement('button');
    button.type='button';button.dataset[attribute]=id;button.textContent=label;
    button.setAttribute('aria-pressed',String(key===id));
    button.onclick=()=>select(id);return button;
  }));
}
function renderLab() {
  document.querySelectorAll('[data-lab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lab===lab)));
  const node=$('station');
  if(lab==='tactic'){
    const preview=QuarterDemo.simulate(selected,seed);
    node.innerHTML='<h3>'+tr('云港 对 岩湾','Cloud Harbor vs. Stone Bay')+'</h3><p>'+tr('固定随机种子，对比三种战术。','Compare three tactics with the same random samples.')+'</p><div id="tactic-choices" class="controls"></div><div class="values"><div>'+tr('阵容适配','Lineup fit')+'<strong>'+preview.fit+' / 5</strong></div><div>'+tr('命中率','Shot chance')+'<strong>'+Math.round(preview.chance*1000)/10+'%</strong></div><div>'+tr('比分','Score')+'<strong id="quarter-score">'+(result?result.home+' : '+result.away:'—')+'</strong></div></div><div class="controls"><button id="run" class="primary">'+tr('模拟本节','Simulate quarter')+'</button><button id="sample">'+tr('换一组样本','New sample')+'</button></div><p id="tactic-status" role="status">'+(result?(played===selected?tr('本节已结算','Quarter complete'):tr('战术已更换，比分仍是上一局','Tactic changed; score is from the last run')):tr('尚未模拟','Not simulated yet'))+' · '+tr('种子','Seed')+' '+seed+'</p>';
    const route={drive:'40,92 90,62 130,22',pick:'88,90 111,64 135,65 130,22',perimeter:'40,92 90,62 220,91'};
    const court=document.createElement('aside');
    court.className='tactic-board';
    court.innerHTML='<svg viewBox="0 0 260 122" role="img" aria-label="'+pair(tactics[selected])+'"><g fill="none" stroke="#8f9caa" stroke-width="1.2"><path d="M10 8H250V114H10Z M100 8V50H160V8 M32 8V24C32 116 228 116 228 24V8"/><circle cx="130" cy="22" r="5"/><circle cx="130" cy="50" r="16"/></g><polyline points="'+route[selected]+'" stroke="#f0ca87" stroke-width="3" fill="none" stroke-dasharray="5 4"/><g fill="#83b9ff"><circle cx="40" cy="92" r="6"/><circle cx="88" cy="90" r="6"/><circle cx="220" cy="91" r="6"/><circle cx="161" cy="52" r="6"/><circle cx="112" cy="45" r="6"/></g></svg><div class="possessions" aria-hidden="true">'+Array.from({length:20},(_,i)=>'<span'+(result?.plays[i].home?' class="scored"':'')+'></span>').join('')+'</div>';
    node.prepend(court);
    buttons($('tactic-choices'),Object.entries(tactics).map(([id,label])=>[id,pair(label)]),selected,'choice',id=>{selected=id;renderLab();$('tactic-choices').querySelector('[data-choice="'+id+'"]').focus();});
    $('run').onclick=()=>{result=preview;played=selected;renderLab();$('run').focus();};
    $('sample').onclick=()=>{seed+=7919;result=null;renderLab();$('sample').focus();};
  }else if(lab==='growth'){
    node.innerHTML='<h3>'+tr('培养叠加与实战上限','Stacked growth and the effective ceiling')+'</h3><p>'+tr('超过阈值后，仅保留一部分额外增益。曲线用于解释机制。','Above the threshold, only part of each additional point counts. This curve illustrates the mechanic.')+'</p><label for="rating">'+tr('叠加后的评分','Stacked rating')+'</label><br><input id="rating" type="range" min="80" max="135" value="'+rating+'"><div class="values"><div>'+tr('未约束','Uncapped')+'<strong id="uncapped"></strong></div><div>'+tr('实战评分','Effective')+'<strong id="effective"></strong></div></div><svg viewBox="0 0 540 180" class="chart" role="img" aria-label="'+tr('原始评分与实战评分曲线','Uncapped and effective rating curves')+'"><path d="M24 155L516 18" stroke="#8d9aa8" fill="none" stroke-dasharray="5 5"/><polyline id="curve" fill="none" stroke="#83b9ff" stroke-width="3"/><path id="indicator" stroke="#f0ca87"/><circle id="dot" r="6" fill="#f0ca87"/></svg>';
    const cap=n=>n<=100?n:Math.min(105,100+(n-100)*.25),x=n=>24+(n-80)*492/55,y=n=>155-(n-80)*137/55;
    $('curve').setAttribute('points',[80,100,120,135].map(n=>x(n)+','+y(cap(n))).join(' '));
    const update=()=>{
      rating=Number($('rating').value);
      $('uncapped').textContent=rating;
      $('effective').textContent=cap(rating);
      $('indicator').setAttribute('d','M'+x(rating)+' 155V'+y(cap(rating)));
      $('dot').setAttribute('cx',x(rating));
      $('dot').setAttribute('cy',y(cap(rating)));
    };
    $('rating').oninput=update;update();
  }else{
    const steps=[
      tr('本地与云端从修订 7 开始。','Both copies begin at revision 7.'),
      tr('离线完成一场比赛，本地写入修订 8A。','An offline match creates local revision 8A.'),
      tr('另一设备写入修订 8B，云端已经前进。','Another device writes 8B to the remote slot.'),
      tr('重连先读取云端，检测到分支，暂停上传。','Reconnect reads the remote first, detects divergence, and pauses upload.')
    ];
    node.innerHTML='<h3>'+tr('同一存档，两条进度','One slot, two histories')+'</h3><ol class="events">'+steps.slice(0,saveStep+1).map(s=>'<li>'+s+'</li>').join('')+'</ol><div class="controls">'+(saveStep<3?'<button id="step" class="primary">'+tr('下一步','Next event')+'</button>':!resolution?'<button id="keep">'+tr('保留本地','Keep local')+'</button><button id="cloud">'+tr('备份本地，采用云端','Back up local, use remote')+'</button>':'')+'<button id="reset">'+tr('重置','Reset')+'</button></div><p role="status">'+(resolution==='local'?tr('当前：8A。云端 8B 未被覆盖。','Active: 8A. Remote 8B was not overwritten.'):resolution==='cloud'?tr('当前：8B。本地 8A 已另存。','Active: 8B. Local 8A was backed up.'):saveStep===3?tr('冲突待处理。两个版本均保留。','Conflict pending. Both copies are intact.'):'')+'</p>';
    for(const [id,action] of [['step',()=>saveStep++],['keep',()=>resolution='local'],['cloud',()=>resolution='cloud'],['reset',()=>{saveStep=0;resolution=null;}]])if($(id))$(id).onclick=()=>{action();renderLab();($(id)||$('reset')).focus();};
  }
}
function renderViewer(){
  const item=images[viewed];
  $('shot-title').textContent=imageTitle(item);
  $('shot-image').src=src(item);$('shot-image').alt=tr(item[4],item[5]);
  $('shot-number').textContent=(viewed+1)+' / '+images.length;
}
function openShot(id){
  viewed=images.findIndex(i=>i[0]===id);renderViewer();$('viewer').showModal();
}
function renderGallery(){
  buttons($('filters'),Object.entries(categories).map(([id,label])=>[id,pair(label)]),filter,'filter',id=>{filter=id;renderGallery();$('filters').querySelector('[data-filter="'+id+'"]').focus();});
  const items=visible();
  $('gallery-count').textContent=tr(items.length+' 张实机截图 · V58 离线版 · 中文',items.length+' game captures · V58 offline build · English');
  $('shots').replaceChildren(...items.map(item=>{
    const button=document.createElement('button'),image=document.createElement('img'),label=document.createElement('span');
    button.type='button';button.dataset.shot=item[0];image.src=src(item);image.loading='lazy';image.alt='';
    label.textContent=imageTitle(item);button.append(image,label);button.onclick=()=>openShot(item[0]);return button;
  }));
}
function render(){
  document.documentElement.lang=tr('zh-CN','en');
  document.title=pair(copy.title)+' · '+tr('作品展厅','Portfolio');
  document.querySelectorAll('[data-copy]').forEach(n=>n.textContent=pair(copy[n.dataset.copy]));
  for(const id of ['zh','en'])$(id).setAttribute('aria-pressed',String(id===locale));
  $('hero-image').src=src(images[0]);$('hero-image').parentElement.setAttribute('aria-label',imageTitle(images[0]));
  $('cases').innerHTML=cases.map(([title,body],i)=>'<article class="case"><h3>0'+(i+1)+' · '+pair(title)+'</h3><p>'+pair(body)+'</p></article>').join('');
  renderLab();renderGallery();if($('viewer').open)renderViewer();
}
for(const id of ['zh','en'])$(id).onclick=()=>{locale=id;try{localStorage.setItem('exhibit-language',id);}catch{}render();};
document.querySelectorAll('[data-lab]').forEach(button=>button.onclick=()=>{lab=button.dataset.lab;renderLab();});
document.querySelector('.feature-image').onclick=()=>openShot('match');
$('close').onclick=()=>$('viewer').close();
function move(delta){viewed=(viewed+delta+images.length)%images.length;renderViewer();}
$('previous').onclick=()=>move(-1);$('next').onclick=()=>move(1);
$('viewer').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);}});
render();
