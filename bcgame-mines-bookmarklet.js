javascript:void(function(){
/* 防止重複載入 */
if(window.__MINES_BOT){window.__MINES_BOT.toggle();return}

/* ============ 策略參數 ============ */
var C={
  baseBet:0.00001,
  mines:4,
  picks:2,
  multiOnLoss:3,
  maxLossStreak:3,
  maxRounds:500,
  delayRound:2500,
  delayClick:800,
  delayAfterBet:1500
};

/* ============ 選擇器 ============ */
var S={betInput:'',betButton:'',cashoutButton:'',tiles:'',balance:''};

/* ============ 狀態 ============ */
var ST={
  running:false,stop:false,
  bet:C.baseBet,lossStreak:0,
  rounds:0,wins:0,losses:0,resets:0,
  initBal:null,picking:false
};

/* ============ UI 面板 ============ */
var panel=document.createElement('div');
panel.id='__mines_panel';
panel.innerHTML=`
<style>
#__mines_panel{
  position:fixed;bottom:60px;right:8px;z-index:999999;
  width:320px;max-width:calc(100vw - 16px);max-height:70vh;
  background:#12141c;color:#e2e4ea;border:1px solid #2a2e3d;
  border-radius:12px;font-family:-apple-system,sans-serif;
  font-size:13px;box-shadow:0 8px 32px rgba(0,0,0,.5);
  display:flex;flex-direction:column;overflow:hidden;
  touch-action:none;
}
#__mines_panel *{box-sizing:border-box;margin:0;padding:0}
#__mines_panel .mp-head{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 14px;background:#1a1d2a;cursor:move;
  border-bottom:1px solid #2a2e3d;flex-shrink:0;
}
#__mines_panel .mp-head b{font-size:14px;color:#4ade80}
#__mines_panel .mp-close{
  width:28px;height:28px;border-radius:6px;border:none;
  background:#2a2e3d;color:#e2e4ea;font-size:16px;cursor:pointer;
}
#__mines_panel .mp-tabs{
  display:flex;border-bottom:1px solid #2a2e3d;flex-shrink:0;
}
#__mines_panel .mp-tab{
  flex:1;padding:8px 4px;text-align:center;font-size:12px;
  background:none;border:none;color:#8b8fa3;cursor:pointer;
  border-bottom:2px solid transparent;
}
#__mines_panel .mp-tab.active{color:#4ade80;border-bottom-color:#4ade80}
#__mines_panel .mp-body{
  overflow-y:auto;padding:12px 14px;flex:1;min-height:0;
}
#__mines_panel .mp-row{
  display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;
}
#__mines_panel .mp-stat{
  flex:1;min-width:60px;background:#1a1d2a;border-radius:8px;padding:8px 10px;
}
#__mines_panel .mp-stat small{display:block;font-size:10px;color:#8b8fa3;text-transform:uppercase;letter-spacing:.03em}
#__mines_panel .mp-stat span{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}
#__mines_panel .mp-btn{
  width:100%;padding:10px;border:none;border-radius:8px;
  font-size:14px;font-weight:600;cursor:pointer;margin-bottom:6px;
}
#__mines_panel .mp-btn-go{background:#4ade80;color:#0c0e14}
#__mines_panel .mp-btn-stop{background:#f87171;color:#fff}
#__mines_panel .mp-btn-pick{background:#3b82f6;color:#fff}
#__mines_panel .mp-btn-sec{background:#2a2e3d;color:#e2e4ea}
#__mines_panel .mp-field{margin-bottom:8px}
#__mines_panel .mp-field label{display:block;font-size:11px;color:#8b8fa3;margin-bottom:3px;text-transform:uppercase}
#__mines_panel .mp-field input,#__mines_panel .mp-field select{
  width:100%;padding:8px;background:#1a1d2a;border:1px solid #2a2e3d;
  color:#e2e4ea;border-radius:6px;font-size:13px;
}
#__mines_panel .mp-log{
  font-family:ui-monospace,monospace;font-size:11px;line-height:1.6;
  max-height:200px;overflow-y:auto;background:#0c0e14;
  border-radius:6px;padding:8px;
}
#__mines_panel .mp-log .w{color:#4ade80}
#__mines_panel .mp-log .l{color:#f87171}
#__mines_panel .mp-log .r{color:#fbbf24}
#__mines_panel .mp-log .a{color:#60a5fa}
#__mines_panel .mp-sel-status{
  font-size:11px;padding:4px 8px;border-radius:4px;margin-bottom:4px;
  display:flex;justify-content:space-between;align-items:center;
}
#__mines_panel .mp-sel-ok{background:#16382a;color:#4ade80}
#__mines_panel .mp-sel-miss{background:#3b1a1a;color:#f87171}
</style>

<div class="mp-head" id="__mp_head">
  <b>踩地雷 Bot</b>
  <button class="mp-close" id="__mp_close">&times;</button>
</div>

<div class="mp-tabs">
  <button class="mp-tab active" data-tab="ctrl">控制</button>
  <button class="mp-tab" data-tab="cfg">參數</button>
  <button class="mp-tab" data-tab="sel">選擇器</button>
  <button class="mp-tab" data-tab="log">紀錄</button>
</div>

<div class="mp-body">
  <!-- 控制面板 -->
  <div id="__tab_ctrl">
    <div class="mp-row">
      <div class="mp-stat"><small>局數</small><span id="__s_rounds">0</span></div>
      <div class="mp-stat"><small>勝</small><span id="__s_wins" style="color:#4ade80">0</span></div>
      <div class="mp-stat"><small>負</small><span id="__s_losses" style="color:#f87171">0</span></div>
      <div class="mp-stat"><small>勝率</small><span id="__s_wr">—</span></div>
    </div>
    <div class="mp-row">
      <div class="mp-stat"><small>當前注</small><span id="__s_bet">0</span></div>
      <div class="mp-stat"><small>連輸</small><span id="__s_streak">0</span></div>
      <div class="mp-stat"><small>重置</small><span id="__s_resets" style="color:#fbbf24">0</span></div>
      <div class="mp-stat"><small>餘額</small><span id="__s_bal">—</span></div>
    </div>
    <button class="mp-btn mp-btn-go" id="__btn_start">開始策略</button>
    <button class="mp-btn mp-btn-stop" id="__btn_stop" style="display:none">停止</button>
    <div id="__sel_warn" style="display:none;background:#3b2a1a;color:#fbbf24;padding:8px;border-radius:6px;font-size:12px;margin-top:6px">
      請先到「選擇器」頁籤設定頁面元素
    </div>
  </div>

  <!-- 參數設定 -->
  <div id="__tab_cfg" style="display:none">
    <div class="mp-field"><label>底注金額</label><input type="number" id="__c_base" step="0.00001"></div>
    <div class="mp-field"><label>地雷數量</label><input type="number" id="__c_mines" min="1" max="24"></div>
    <div class="mp-field"><label>每輪開格數</label><input type="number" id="__c_picks" min="1" max="24"></div>
    <div class="mp-field"><label>輸了翻幾倍</label><input type="number" id="__c_multi" step="0.1"></div>
    <div class="mp-field"><label>最大連輸把數</label><input type="number" id="__c_maxl" min="1" max="10"></div>
    <div class="mp-field"><label>最多跑幾局</label><input type="number" id="__c_maxr" min="10"></div>
    <div class="mp-field"><label>每局間隔 (ms)</label><input type="number" id="__c_delay" step="100"></div>
    <button class="mp-btn mp-btn-sec" id="__btn_savecfg">儲存參數</button>
  </div>

  <!-- 選擇器設定 -->
  <div id="__tab_sel" style="display:none">
    <div style="font-size:12px;color:#8b8fa3;margin-bottom:10px">
      點「選取」按鈕後，點擊頁面上對應的元素
    </div>
    <div id="__sel_list"></div>
    <button class="mp-btn mp-btn-sec" id="__btn_auto" style="margin-top:8px">自動偵測</button>
  </div>

  <!-- 紀錄 -->
  <div id="__tab_log" style="display:none">
    <div class="mp-log" id="__logbox"></div>
  </div>
</div>
`;
document.body.appendChild(panel);

/* ============ Tab 切換 ============ */
var tabs=panel.querySelectorAll('.mp-tab');
var tabIds=['ctrl','cfg','sel','log'];
tabs.forEach(function(t,i){
  t.addEventListener('click',function(){
    tabs.forEach(function(x){x.classList.remove('active')});
    t.classList.add('active');
    tabIds.forEach(function(id){
      document.getElementById('__tab_'+id).style.display='none';
    });
    document.getElementById('__tab_'+t.dataset.tab).style.display='';
  });
});

/* ============ 拖曳面板 ============ */
(function(){
  var head=document.getElementById('__mp_head');
  var startX,startY,origX,origY,dragging=false;
  function onStart(e){
    dragging=true;
    var ev=e.touches?e.touches[0]:e;
    startX=ev.clientX;startY=ev.clientY;
    var r=panel.getBoundingClientRect();
    origX=r.left;origY=r.top;
    e.preventDefault();
  }
  function onMove(e){
    if(!dragging)return;
    var ev=e.touches?e.touches[0]:e;
    var dx=ev.clientX-startX,dy=ev.clientY-startY;
    panel.style.left=(origX+dx)+'px';
    panel.style.top=(origY+dy)+'px';
    panel.style.right='auto';panel.style.bottom='auto';
  }
  function onEnd(){dragging=false}
  head.addEventListener('mousedown',onStart);
  head.addEventListener('touchstart',onStart,{passive:false});
  document.addEventListener('mousemove',onMove);
  document.addEventListener('touchmove',onMove,{passive:false});
  document.addEventListener('mouseup',onEnd);
  document.addEventListener('touchend',onEnd);
})();

/* ============ 關閉/顯示 ============ */
document.getElementById('__mp_close').addEventListener('click',function(){
  panel.style.display='none';
});
window.__MINES_BOT={toggle:function(){
  panel.style.display=panel.style.display==='none'?'flex':'none';
}};

/* ============ 載入參數到 UI ============ */
function loadCfgUI(){
  document.getElementById('__c_base').value=C.baseBet;
  document.getElementById('__c_mines').value=C.mines;
  document.getElementById('__c_picks').value=C.picks;
  document.getElementById('__c_multi').value=C.multiOnLoss;
  document.getElementById('__c_maxl').value=C.maxLossStreak;
  document.getElementById('__c_maxr').value=C.maxRounds;
  document.getElementById('__c_delay').value=C.delayRound;
}
loadCfgUI();

document.getElementById('__btn_savecfg').addEventListener('click',function(){
  C.baseBet=parseFloat(document.getElementById('__c_base').value)||0.00001;
  C.mines=parseInt(document.getElementById('__c_mines').value)||4;
  C.picks=parseInt(document.getElementById('__c_picks').value)||2;
  C.multiOnLoss=parseFloat(document.getElementById('__c_multi').value)||3;
  C.maxLossStreak=parseInt(document.getElementById('__c_maxl').value)||3;
  C.maxRounds=parseInt(document.getElementById('__c_maxr').value)||500;
  C.delayRound=parseInt(document.getElementById('__c_delay').value)||2500;
  ST.bet=C.baseBet;
  addLog('參數已更新','a');
});

/* ============ 選擇器 UI ============ */
var selKeys=[
  {key:'betInput',label:'下注輸入框'},
  {key:'betButton',label:'下注按鈕'},
  {key:'cashoutButton',label:'Cashout 按鈕'},
  {key:'tiles',label:'格子 (25個)'},
  {key:'balance',label:'餘額顯示 (選填)'}
];

function renderSelectors(){
  var html='';
  selKeys.forEach(function(item){
    var ok=!!S[item.key];
    html+='<div class="mp-sel-status '+(ok?'mp-sel-ok':'mp-sel-miss')+'">'
      +'<span>'+item.label+(ok?' ✓':' ✗')+'</span>'
      +'<button class="mp-btn-pick" style="padding:4px 10px;font-size:11px;border:none;border-radius:4px;cursor:pointer;background:#3b82f6;color:#fff" data-pick="'+item.key+'">選取</button>'
      +'</div>';
  });
  document.getElementById('__sel_list').innerHTML=html;

  document.querySelectorAll('[data-pick]').forEach(function(btn){
    btn.addEventListener('click',function(){
      startPick(btn.dataset.pick);
    });
  });
}
renderSelectors();

/* ============ 互動選取元素 ============ */
function startPick(key){
  var label=selKeys.find(function(x){return x.key===key}).label;
  addLog('請點擊頁面上的「'+label+'」','a');
  panel.style.display='none';

  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:999998;background:rgba(0,0,0,.3);display:flex;align-items:flex-start;justify-content:center;padding-top:60px';
  overlay.innerHTML='<div style="background:#1a1d2a;color:#fbbf24;padding:12px 20px;border-radius:8px;font-size:14px;font-family:sans-serif">請點擊「'+label+'」元素</div>';
  document.body.appendChild(overlay);

  function handler(e){
    if(e.target===overlay||overlay.contains(e.target))return;
    e.preventDefault();
    e.stopPropagation();

    var el=e.target;
    var sel='';
    if(el.id){sel='#'+el.id}
    else if(el.getAttribute('data-testid')){sel='[data-testid="'+el.getAttribute('data-testid')+'"]'}
    else{
      var tag=el.tagName.toLowerCase();
      var cls=el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'';
      sel=tag+cls;
    }

    S[key]=sel;
    addLog(label+' → '+sel,'a');
    panel.style.display='flex';
    overlay.remove();
    document.removeEventListener('click',handler,true);
    document.removeEventListener('touchend',handler,true);
    renderSelectors();
    checkReady();
  }

  setTimeout(function(){
    document.addEventListener('click',handler,true);
    document.addEventListener('touchend',handler,true);
  },300);
}

/* ============ 自動偵測 ============ */
document.getElementById('__btn_auto').addEventListener('click',function(){
  addLog('開始自動偵測...','a');

  /* 找 input */
  var inputs=document.querySelectorAll('input[type="number"],input[type="text"],input:not([type])');
  for(var i=0;i<inputs.length;i++){
    var inp=inputs[i];
    if(inp.closest('#__mines_panel'))continue;
    var ph=(inp.placeholder||'').toLowerCase();
    var nm=(inp.name||'').toLowerCase();
    if(ph.includes('bet')||ph.includes('amount')||nm.includes('bet')||nm.includes('amount')||inp.type==='number'){
      S.betInput=genSel(inp);
      addLog('下注輸入框 → '+S.betInput,'a');
      break;
    }
  }

  /* 找按鈕 */
  var btns=document.querySelectorAll('button');
  btns.forEach(function(btn){
    if(btn.closest('#__mines_panel'))return;
    var txt=btn.textContent.trim().toLowerCase();
    if(!S.betButton&&(txt.includes('bet')||txt.includes('下注')||txt.includes('start'))){
      S.betButton=genSel(btn);
      addLog('下注按鈕 → '+S.betButton,'a');
    }
    if(!S.cashoutButton&&(txt.includes('cashout')||txt.includes('cash out')||txt.includes('提現')||txt.includes('取款'))){
      S.cashoutButton=genSel(btn);
      addLog('Cashout → '+S.cashoutButton,'a');
    }
  });

  /* 找 25 個格子 */
  var classMap={};
  document.querySelectorAll('*').forEach(function(el){
    if(el.closest('#__mines_panel'))return;
    if(el.className&&typeof el.className==='string'){
      var first=el.className.trim().split(/\s+/)[0];
      if(first){classMap[first]=(classMap[first]||0)+1}
    }
  });
  for(var cls in classMap){
    if(classMap[cls]===25){
      S.tiles='.'+cls;
      addLog('格子 → .'+cls+' (25個)','a');
      break;
    }
  }

  renderSelectors();
  checkReady();
  addLog('自動偵測完成，缺少的請手動選取','r');
});

function genSel(el){
  if(el.id)return'#'+el.id;
  if(el.getAttribute('data-testid'))return'[data-testid="'+el.getAttribute('data-testid')+'"]';
  var tag=el.tagName.toLowerCase();
  var cls=el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'';
  return tag+cls;
}

/* ============ 檢查就緒 ============ */
function checkReady(){
  var ready=S.betInput&&S.betButton&&S.cashoutButton&&S.tiles;
  document.getElementById('__sel_warn').style.display=ready?'none':'block';
  document.getElementById('__btn_start').disabled=!ready;
  document.getElementById('__btn_start').style.opacity=ready?'1':'0.4';
  return ready;
}
checkReady();

/* ============ 更新統計 UI ============ */
function updateUI(){
  var total=ST.wins+ST.losses;
  document.getElementById('__s_rounds').textContent=total;
  document.getElementById('__s_wins').textContent=ST.wins;
  document.getElementById('__s_losses').textContent=ST.losses;
  document.getElementById('__s_wr').textContent=total?(ST.wins/total*100).toFixed(1)+'%':'—';
  document.getElementById('__s_bet').textContent=ST.bet.toFixed(6);
  document.getElementById('__s_streak').textContent=ST.lossStreak;
  document.getElementById('__s_resets').textContent=ST.resets;
  var bal=getBalance();
  document.getElementById('__s_bal').textContent=bal?bal.toFixed(6):'—';
}

/* ============ Log ============ */
function addLog(msg,cls){
  var box=document.getElementById('__logbox');
  var d=document.createElement('div');
  d.className=cls||'';
  var now=new Date();
  var ts=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0');
  d.textContent=ts+' '+msg;
  box.appendChild(d);
  if(box.children.length>200)box.removeChild(box.firstChild);
  box.scrollTop=box.scrollHeight;
}

/* ============ DOM 工具 ============ */
function getBalance(){
  if(!S.balance)return null;
  var el=document.querySelector(S.balance);
  if(!el)return null;
  return parseFloat(el.textContent.replace(/[^0-9.]/g,''))||null;
}

function setBet(amount){
  var inp=document.querySelector(S.betInput);
  if(!inp)throw new Error('找不到下注輸入框');
  var setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  setter.call(inp,amount.toFixed(8));
  inp.dispatchEvent(new Event('input',{bubbles:true}));
  inp.dispatchEvent(new Event('change',{bubbles:true}));
}

function clickEl(sel,name){
  var el=document.querySelector(sel);
  if(!el)throw new Error('找不到'+name);
  el.click();
}

function getOpenTiles(){
  var all=document.querySelectorAll(S.tiles);
  return Array.from(all).filter(function(t){
    var cls=t.className||'';
    return!/open|reveal|active|click|select|disab/i.test(cls)&&!t.disabled;
  });
}

function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}

/* ============ 策略主迴圈 ============ */
async function run(){
  if(ST.running)return;
  if(!checkReady()){addLog('選擇器未設定完成','l');return}

  ST.running=true;ST.stop=false;
  ST.bet=C.baseBet;ST.lossStreak=0;
  ST.rounds=0;ST.wins=0;ST.losses=0;ST.resets=0;
  ST.initBal=getBalance();

  document.getElementById('__btn_start').style.display='none';
  document.getElementById('__btn_stop').style.display='';

  addLog('=== 策略啟動 ===','a');
  addLog('底注:'+C.baseBet+' 地雷:'+C.mines+' 開格:'+C.picks,'a');

  while(ST.running&&!ST.stop&&ST.rounds<C.maxRounds){
    ST.rounds++;
    try{
      addLog('['+ST.rounds+'] 下注 '+ST.bet.toFixed(6),'a');
      setBet(ST.bet);
      await wait(400);

      clickEl(S.betButton,'下注按鈕');
      await wait(C.delayAfterBet);

      var busted=false;
      for(var p=0;p<C.picks;p++){
        var avail=getOpenTiles();
        if(avail.length===0){addLog('沒有可點的格子','l');busted=true;break}
        var pick=avail[Math.floor(Math.random()*avail.length)];
        pick.click();
        addLog('  開第'+(p+1)+'格','a');
        await wait(C.delayClick);
      }

      await wait(500);

      if(!busted){
        var coBtn=document.querySelector(S.cashoutButton);
        if(coBtn&&!coBtn.disabled){
          coBtn.click();
          ST.wins++;
          addLog('['+ST.rounds+'] 贏了！Cashout','w');
          ST.bet=C.baseBet;
          ST.lossStreak=0;
        }else{
          busted=true;
        }
      }

      if(busted){
        ST.losses++;
        ST.lossStreak++;
        addLog('['+ST.rounds+'] 踩雷 連輸'+ST.lossStreak,'l');
        if(ST.lossStreak>=C.maxLossStreak){
          ST.resets++;
          ST.bet=C.baseBet;
          ST.lossStreak=0;
          addLog('  連輸'+C.maxLossStreak+'把 重置底注','r');
        }else{
          ST.bet*=C.multiOnLoss;
          addLog('  下局加注 '+ST.bet.toFixed(6),'r');
        }
      }

      updateUI();
      await wait(C.delayRound);

    }catch(err){
      addLog('錯誤: '+err.message,'l');
      await wait(5000);
    }
  }

  ST.running=false;
  document.getElementById('__btn_start').style.display='';
  document.getElementById('__btn_stop').style.display='none';

  var total=ST.wins+ST.losses;
  addLog('=== 結算 ===','a');
  addLog('共'+total+'局 勝'+ST.wins+' 負'+ST.losses+' 勝率'+(total?(ST.wins/total*100).toFixed(1):0)+'%','a');
  addLog('重置'+ST.resets+'次','a');
}

/* ============ 按鈕事件 ============ */
document.getElementById('__btn_start').addEventListener('click',function(){run()});
document.getElementById('__btn_stop').addEventListener('click',function(){
  ST.stop=true;ST.running=false;
  document.getElementById('__btn_start').style.display='';
  document.getElementById('__btn_stop').style.display='none';
  addLog('已手動停止','r');
  updateUI();
});

addLog('Bot 已載入，請先設定選擇器','a');
}());