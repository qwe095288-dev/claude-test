javascript:void(function(){
/* 防止重複載入 */
if(window.__MINES_BOT){window.__MINES_BOT.toggle();return}

/* ============ 策略參數 ============ */
var C={
  baseBet:3.1799,
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
  var btn=document.getElementById('__btn_savecfg');
  btn.textContent='已儲存 ✓';btn.style.background='#4ade80';btn.style.color='#0c0e14';
  setTimeout(function(){btn.textContent='儲存參數';btn.style.background='#2a2e3d';btn.style.color='#e2e4ea';},1500);
});

/* ============ 選擇器 UI ============ */
var selKeys=[
  {key:'betInput',label:'下注輸入框'},
  {key:'betButton',label:'下注按鈕'},
  {key:'cashoutButton',label:'Cashout 按鈕 (可自動找)'},
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

  /* 提示條：pointer-events:none 讓觸控穿透到底下的元素 */
  var banner=document.createElement('div');
  banner.id='__mines_pick_banner';
  banner.style.cssText='position:fixed;top:0;left:0;right:0;z-index:999998;background:#1a1d2a;color:#fbbf24;padding:14px 20px;font-size:14px;font-family:sans-serif;text-align:center;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.5)';
  banner.textContent='請點擊「'+label+'」元素';
  document.body.appendChild(banner);

  /* 取消按鈕：這個需要能被點擊 */
  var cancelBtn=document.createElement('div');
  cancelBtn.style.cssText='position:fixed;top:50px;right:12px;z-index:999998;background:#f87171;color:#fff;padding:8px 14px;border-radius:6px;font-size:13px;font-family:sans-serif;cursor:pointer';
  cancelBtn.textContent='取消選取';
  document.body.appendChild(cancelBtn);
  cancelBtn.addEventListener('click',function(e){
    e.stopPropagation();
    cleanup();
    panel.style.display='flex';
    addLog('已取消選取','r');
  });

  var handled=false;
  function cleanup(){
    handled=true;
    banner.remove();
    cancelBtn.remove();
    document.removeEventListener('click',handler,true);
  }

  function handler(e){
    if(handled)return;
    var el=e.target;
    /* 忽略我們自己的元素 */
    if(el===cancelBtn||el===banner)return;
    if(el.closest&&el.closest('#__mines_panel'))return;

    e.preventDefault();
    e.stopPropagation();

    var sel=genSel(el);
    S[key]=sel;
    addLog(label+' → '+sel,'a');
    cleanup();
    panel.style.display='flex';
    renderSelectors();
    checkReady();
  }

  setTimeout(function(){
    document.addEventListener('click',handler,true);
  },400);
}

/* ============ 自動偵測 ============ */
document.getElementById('__btn_auto').addEventListener('click',function(){
  addLog('開始自動偵測...','a');

  /* 找下注輸入框 — BC Game 的金額輸入框 */
  var inputs=document.querySelectorAll('input');
  for(var i=0;i<inputs.length;i++){
    var inp=inputs[i];
    if(inp.closest('#__mines_panel'))continue;
    var ph=(inp.placeholder||'').toLowerCase();
    var nm=(inp.name||'').toLowerCase();
    var ar=(inp.getAttribute('aria-label')||'').toLowerCase();
    /* 往上找父元素有沒有包含「金額」文字 */
    var parent=inp.parentElement;
    var parentText='';
    for(var up=0;up<5&&parent;up++){
      parentText+=parent.textContent||'';
      parent=parent.parentElement;
    }
    parentText=parentText.toLowerCase();
    if(
      ph.includes('bet')||ph.includes('amount')||ph.includes('金額')||
      nm.includes('bet')||nm.includes('amount')||
      ar.includes('bet')||ar.includes('amount')||ar.includes('金額')||
      (parentText.includes('金額')&&!parentText.includes('礦山'))
    ){
      S.betInput=genSel(inp);
      addLog('下注輸入框 → '+S.betInput,'a');
      break;
    }
  }
  /* 如果上面沒找到，退而求其次找第一個非面板的 input */
  if(!S.betInput){
    for(var i=0;i<inputs.length;i++){
      if(!inputs[i].closest('#__mines_panel')&&inputs[i].type!=='range'&&inputs[i].type!=='hidden'&&inputs[i].type!=='checkbox'&&inputs[i].type!=='radio'){
        S.betInput=genSel(inputs[i]);
        addLog('下注輸入框 (猜測) → '+S.betInput,'a');
        break;
      }
    }
  }

  /* 找按鈕 — 加入 BC Game 中文 UI：投注、提現 */
  var btns=document.querySelectorAll('button');
  var betBtnCandidates=[];
  var cashoutCandidates=[];
  btns.forEach(function(btn){
    if(btn.closest('#__mines_panel'))return;
    var txt=btn.textContent.trim();
    var txtL=txt.toLowerCase();
    /* 下注按鈕 */
    if(txtL==='bet'||txt==='投注'||txt==='下注'||txtL==='start'||txtL==='play'){
      betBtnCandidates.push(btn);
    }
    /* Cashout 按鈕 */
    if(txtL.includes('cashout')||txtL.includes('cash out')||
       txt.includes('提現')||txt.includes('取款')||txt.includes('兌現')||
       txtL.includes('withdraw')||txtL.includes('take')){
      cashoutCandidates.push(btn);
    }
  });

  if(betBtnCandidates.length>0){
    /* 優先選最大的按鈕（通常是主要 CTA） */
    betBtnCandidates.sort(function(a,b){
      return(b.offsetWidth*b.offsetHeight)-(a.offsetWidth*a.offsetHeight);
    });
    S.betButton=genSel(betBtnCandidates[0]);
    addLog('下注按鈕 → '+S.betButton+' ('+betBtnCandidates[0].textContent.trim()+')','a');
  }

  if(cashoutCandidates.length>0){
    S.cashoutButton=genSel(cashoutCandidates[0]);
    addLog('Cashout → '+S.cashoutButton+' ('+cashoutCandidates[0].textContent.trim()+')','a');
  }
  if(!S.cashoutButton){
    addLog('Cashout 按鈕在下注後才會出現，先跳過','r');
  }

  /* 找 25 個格子 — 嘗試多種數量 */
  var classMap={};
  document.querySelectorAll('*').forEach(function(el){
    if(el.closest('#__mines_panel'))return;
    if(el.className&&typeof el.className==='string'){
      el.className.trim().split(/\s+/).forEach(function(c){
        if(c){classMap[c]=(classMap[c]||0)+1}
      });
    }
  });
  var found25=false;
  for(var cls in classMap){
    if(classMap[cls]===25){
      var testEls=document.querySelectorAll('.'+CSS.escape(cls));
      var first=testEls[0];
      if(first&&first.offsetWidth>10&&first.offsetWidth<200&&first.offsetHeight>10){
        S.tiles='.'+cls;
        addLog('格子 → .'+cls+' (25個)','a');
        found25=true;
        break;
      }
    }
  }
  if(!found25){
    addLog('沒有找到 25 個格子，請手動選取其中一格','r');
  }

  /* 找餘額 — 通常在頂部有 $ 符號 */
  var allEls=document.querySelectorAll('*');
  for(var i=0;i<allEls.length;i++){
    var el=allEls[i];
    if(el.closest('#__mines_panel'))continue;
    if(el.children.length>2)continue;
    var txt=el.textContent.trim();
    if(/^\$[\d,.]+$/.test(txt)&&el.offsetWidth>0){
      S.balance=genSel(el);
      addLog('餘額 → '+S.balance+' ('+txt+')','a');
      break;
    }
  }

  renderSelectors();
  checkReady();
  addLog('偵測完成，缺少的請手動選取','r');
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
  /* 按鈕改用文字匹配，只需要 input 和 tiles 的選擇器 */
  var ready=S.betInput&&S.tiles;
  var hasBetBtn=!!findBtnByText(['投注','Bet','下注']);
  if(!hasBetBtn)ready=false;
  document.getElementById('__sel_warn').style.display=ready?'none':'block';
  if(!ready&&!hasBetBtn){
    document.getElementById('__sel_warn').textContent='找不到「投注」按鈕，請確認在踩地雷頁面';
  }else if(!ready){
    document.getElementById('__sel_warn').textContent='請先到「選擇器」頁籤設定頁面元素';
  }
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
  var val=amount.toFixed(4);

  /* 方法1：找 React fiber 的 onChange 直接呼叫 */
  var propsKey=Object.keys(inp).find(function(k){return k.startsWith('__reactProps$')});
  if(propsKey&&inp[propsKey]&&inp[propsKey].onChange){
    var nativeSetter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    nativeSetter.call(inp,val);
    inp[propsKey].onChange({target:inp,currentTarget:inp});
    addLog('  輸入框設為: '+val+' (React props)','a');
    return;
  }

  /* 方法2：找 React fiber 往上爬找 state setter */
  var fiberKey=Object.keys(inp).find(function(k){return k.startsWith('__reactFiber$')||k.startsWith('__reactInternalInstance$')});
  if(fiberKey){
    var fiber=inp[fiberKey];
    var node=fiber;
    for(var i=0;i<15&&node;i++){
      if(node.memoizedProps&&node.memoizedProps.onChange){
        var nativeSetter2=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
        nativeSetter2.call(inp,val);
        node.memoizedProps.onChange({target:inp,currentTarget:inp});
        addLog('  輸入框設為: '+val+' (React fiber)','a');
        return;
      }
      node=node.return;
    }
  }

  /* 方法3：fallback — nativeSetter + valueTracker + 事件 */
  inp.focus();
  var setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  var tracker=inp._valueTracker;
  if(tracker){tracker.setValue('')}
  setter.call(inp,val);
  inp.dispatchEvent(new Event('input',{bubbles:true}));
  inp.dispatchEvent(new Event('change',{bubbles:true}));
  addLog('  輸入框設為: '+val+' (fallback, 實際: '+inp.value+')','a');
}

/* 按文字內容找按鈕 — 比 CSS 選擇器可靠得多 */
function findBtnByText(keywords){
  var btns=document.querySelectorAll('button');
  for(var i=0;i<btns.length;i++){
    var b=btns[i];
    if(b.closest('#__mines_panel'))continue;
    var txt=b.textContent.trim();
    for(var k=0;k<keywords.length;k++){
      if(txt===keywords[k]||txt.toLowerCase()===keywords[k].toLowerCase()){
        return b;
      }
    }
  }
  /* 寬鬆搜尋 — includes */
  for(var i=0;i<btns.length;i++){
    var b=btns[i];
    if(b.closest('#__mines_panel'))continue;
    var txt=b.textContent.trim().toLowerCase();
    for(var k=0;k<keywords.length;k++){
      if(txt.includes(keywords[k].toLowerCase())){
        return b;
      }
    }
  }
  return null;
}

function clickBetButton(){
  /* 優先用精確文字匹配找「投注」按鈕 */
  var btn=findBtnByText(['投注','Bet','下注','Start','Play']);
  if(!btn)throw new Error('找不到投注按鈕（頁面上沒有「投注」按鈕，可能不在踩地雷頁面）');
  /* 安全檢查：按鈕要夠大（排除小的 icon 按鈕如「+」） */
  if(btn.offsetWidth<100){
    addLog('警告：找到的按鈕太小('+btn.offsetWidth+'px)，可能不對','r');
  }
  btn.click();
}

function findCashoutButton(){
  return findBtnByText(['提現','Cashout','Cash Out','取款','兌現','Pick up']);
}

function clickEl(sel,name){
  var el=document.querySelector(sel);
  if(!el)throw new Error('找不到'+name);
  el.click();
}

function getOpenTiles(){
  var all=document.querySelectorAll(S.tiles);
  addLog('  找到 '+all.length+' 個格子元素','a');

  /* 第一輪不過濾，先看看全部格子的狀態 */
  if(all.length===0)return[];

  /* 只排除已翻開（有寶石/骷髏圖）的格子 */
  var open=Array.from(all).filter(function(t){
    var cls=(t.className||'').toLowerCase();
    /* 只排除明確已翻開的：revealed, opened, disabled */
    if(t.disabled||t.getAttribute('aria-disabled')==='true')return false;
    if(/revealed|opened|bomb|mine|gem|diamond/i.test(cls))return false;
    /* 檢查是否有子元素包含圖片（已翻開的格子通常有 img/svg） */
    var hasImage=t.querySelector('img,svg');
    if(hasImage)return false;
    return true;
  });

  addLog('  可點格子: '+open.length+' 個','a');

  /* 如果過濾後是 0 但總數是 25，可能過濾邏輯不對，改用全部 */
  if(open.length===0&&all.length===25){
    addLog('  過濾後為 0，改用全部格子','r');
    return Array.from(all);
  }

  return open;
}

/* 模擬觸控事件 — 手機 Safari 上 .click() 可能無效 */
function tapElement(el){
  var rect=el.getBoundingClientRect();
  var x=rect.left+rect.width/2;
  var y=rect.top+rect.height/2;
  var touchObj=new Touch({
    identifier:Date.now(),
    target:el,
    clientX:x,clientY:y,
    pageX:x+window.scrollX,
    pageY:y+window.scrollY
  });
  el.dispatchEvent(new TouchEvent('touchstart',{
    bubbles:true,cancelable:true,touches:[touchObj],targetTouches:[touchObj],changedTouches:[touchObj]
  }));
  el.dispatchEvent(new TouchEvent('touchend',{
    bubbles:true,cancelable:true,touches:[],targetTouches:[],changedTouches:[touchObj]
  }));
  /* 也觸發 click 作為備用 */
  el.click();
  /* 再試 pointer events */
  el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:x,clientY:y}));
  el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:x,clientY:y}));
}

/* 檢查是否還在踩地雷頁面 */
function checkStillOnPage(){
  var url=window.location.href.toLowerCase();
  return url.includes('mine');
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
      /* 安全檢查：是否還在踩地雷頁面 */
      if(!checkStillOnPage()){
        addLog('已離開踩地雷頁面，自動停止','l');
        break;
      }

      addLog('['+ST.rounds+'] 下注 '+ST.bet.toFixed(6),'a');
      setBet(ST.bet);
      await wait(400);

      /* 用文字匹配找「投注」按鈕，不依賴 CSS 選擇器 */
      clickBetButton();
      addLog('  已點投注','a');
      await wait(C.delayAfterBet);

      /* 再次檢查是否被導航走了 */
      if(!checkStillOnPage()){
        addLog('點擊後被導航離開，自動停止','l');
        break;
      }

      var busted=false;
      for(var p=0;p<C.picks;p++){
        /* 用 BC Game 內建的「隨機選取一個方塊」按鈕，繞過格子 DOM 事件問題 */
        var randBtn=findBtnByText(['隨機選取一個方塊','隨機選取','Pick random','Random tile','Pick a random']);
        if(randBtn){
          randBtn.click();
          addLog('  開第'+(p+1)+'格 (隨機按鈕)','a');
        }else{
          /* 備用方案：直接點格子 */
          var avail=getOpenTiles();
          if(avail.length===0){addLog('  沒有可點的格子也沒有隨機按鈕','l');busted=true;break}
          var pick=avail[Math.floor(Math.random()*avail.length)];
          tapElement(pick);
          addLog('  開第'+(p+1)+'格 (直接點格子)','a');
        }
        await wait(C.delayClick);
      }

      await wait(500);

      if(!busted){
        /* 用文字匹配找 Cashout 按鈕 */
        var coBtn=findCashoutButton();
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