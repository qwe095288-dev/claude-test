const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir = __dirname;
const raw = fs.readFileSync(path.join(dir, 'ibon-ticket-watcher.js'), 'utf8');
const ver = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 8);
const src = raw.replace('__BUILD__', ver);

const min = src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^(\s*)\/\/.*$/gm, '')
  .split('\n').map(l => l.trim()).filter(Boolean).join(' ')
  .replace(/ {2,}/g, ' ');

new Function(min.replace(/^javascript:/, ''));

const bookmarklet = min.replace(/%/g, '%25');
fs.writeFileSync(path.join(dir, 'ibon-ticket-watcher.min.js'), bookmarklet);

const embedded = JSON.stringify(bookmarklet).replace(/</g, '\\u003c');

const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ibon 釋票提醒 安裝</title>
<style>
:root{--bg:#0c0e14;--card:#12141c;--border:#2a2e3d;--text:#e2e4ea;--sub:#8b8fa3;--pink:#f472b6;--blue:#3b82f6;--yellow:#fbbf24}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;padding:24px 16px}
.container{max-width:560px;margin:0 auto}
h1{font-size:24px;color:var(--pink);margin-bottom:8px;text-align:center}
.subtitle{color:var(--sub);text-align:center;margin-bottom:24px;font-size:14px}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:16px}
.card h2{font-size:16px;color:var(--pink);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.num{width:28px;height:28px;background:var(--pink);color:var(--bg);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0}
.drag-area{text-align:center;padding:20px;border:2px dashed var(--border);border-radius:10px}
.bookmark-link{display:inline-block;padding:14px 28px;background:var(--blue);color:#fff;font-size:16px;font-weight:600;border-radius:10px;text-decoration:none;cursor:grab;white-space:nowrap}
.hint{color:var(--sub);font-size:12px;margin-top:12px}
.steps{list-style:none;counter-reset:step}
.steps li{position:relative;padding:8px 0 8px 32px;color:var(--sub);font-size:14px;line-height:1.5}
.steps li::before{counter-increment:step;content:counter(step);position:absolute;left:0;top:8px;width:22px;height:22px;background:var(--border);color:var(--text);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600}
.steps li strong{color:var(--text)}
.copy-btn{display:block;width:100%;padding:12px;background:var(--pink);color:var(--bg);border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
.sel-btn{display:block;width:100%;padding:10px;background:var(--border);color:var(--text);border:none;border-radius:8px;font-size:13px;cursor:pointer;margin-top:8px}
textarea#codeBox{width:100%;height:90px;margin-top:8px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;font-family:ui-monospace,monospace;font-size:16px;color:var(--sub);resize:vertical}
.meta{color:var(--sub);font-size:12px;margin-top:8px}
.note{background:#1a1d2a;border-left:3px solid var(--yellow);padding:12px 16px;border-radius:0 8px 8px 0;font-size:13px;color:var(--yellow);line-height:1.6}
</style>
</head>
<body>
<div class="container">
<h1>ibon 釋票提醒</h1>
<p class="subtitle">只監看頁面、有票時發聲提醒，不會自動購買</p>

<div id="iosCard" class="card">
<h2><span class="num">📱</span>iPhone／iPad（Safari）</h2>
<ol class="steps">
<li>按下方「<strong>複製程式碼</strong>」</li>
<li>在 <strong>Safari</strong> 開任何網頁，點<strong>分享鈕 → 加入書籤</strong>，名稱改成「釋票提醒」→ 儲存</li>
<li>點書籤圖示 → 右下「<strong>編輯</strong>」→ 點「釋票提醒」→ <strong>把網址欄清空，貼上程式碼</strong> → 完成</li>
<li>打開要搶的 <strong>ibon 票區頁面</strong>（選到「座位/數量」那一步）→ 點書籤圖示 → 點「釋票提醒」</li>
</ol>
</div>

<div id="desktopCards">
<div class="card">
<h2><span class="num">💻</span>電腦：拖曳安裝</h2>
<div class="drag-area">
<a class="bookmark-link" id="bmLink" href="#">釋票提醒</a>
<p class="hint">把按鈕拖到書籤列即可（更新時先刪舊書籤、重新整理頁面）</p>
</div>
<ol class="steps" style="margin-top:12px">
<li>拖不動的話：書籤列<strong>右鍵 → 新增書籤</strong>，網址貼上下方程式碼</li>
</ol>
</div>
</div>

<div class="card">
<h2><span class="num">📋</span>程式碼</h2>
<button class="copy-btn" id="copyBtn">複製程式碼</button>
<textarea id="codeBox" readonly></textarea>
<button class="sel-btn" id="selBtn">全選文字框（複製失敗時，全選後點「拷貝」）</button>
<p class="meta" id="codeMeta"></p>
</div>

<div class="card">
<h2><span class="num">▶</span>使用方式</h2>
<ol class="steps">
<li>先登入 ibon，進到你要搶的<strong>票區頁面</strong>（售完的那一步）</li>
<li>執行書籤 → 設定每幾秒檢查（建議 10 秒以上）→ 按「<strong>開始監看</strong>」</li>
<li>它會在背景重新讀取頁面。偵測到有票 → <strong>響鈴＋橫幅＋標題閃爍＋震動</strong>，然後停下來</li>
<li>聽到提醒後，<strong>自己手動</strong>選張數、填資料、過驗證碼、付款</li>
<li>分頁要保持開著且維持登入；逾時或跳轉時工具會提示你重新進入</li>
</ol>
</div>

<div class="note">
此工具只會像你按重新整理一樣監看頁面，<strong>不會自動選票、送出、過驗證碼或購買</strong>。<br>
依《文化創意產業發展法》，用電腦程式購買藝文票券屬違法；請僅將本工具用於「提醒」，實際購票一律自己手動完成。<br>
檢查間隔請勿設太短，以免造成伺服器負擔或觸發防護機制。
</div>
</div>

<script>
var code=__CODE__;
var isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!isIOS){
  var c=document.querySelector('.container');
  c.insertBefore(document.getElementById('desktopCards'),document.getElementById('iosCard'));
}
document.getElementById('bmLink').setAttribute('href',code);
var box=document.getElementById('codeBox');
box.value=code;
document.getElementById('codeMeta').textContent='版本 __VER__ ｜ 程式碼長度：'+code.length+' 字元';
function selectBox(){box.focus();box.setSelectionRange(0,box.value.length)}
document.getElementById('selBtn').addEventListener('click',selectBox);
document.getElementById('copyBtn').addEventListener('click',function(){
  var b=this;
  function ok(){b.textContent='已複製 ✓';setTimeout(function(){b.textContent='複製程式碼'},2000)}
  function manual(){b.textContent='自動複製失敗：請按下方「全選文字框」再拷貝';selectBox()}
  function legacy(){
    var ta=document.createElement('textarea');
    ta.value=code;ta.setAttribute('readonly','');
    ta.style.cssText='position:fixed;top:0;left:0;opacity:0;font-size:16px';
    document.body.appendChild(ta);ta.focus();ta.setSelectionRange(0,code.length);
    var done=false;try{done=document.execCommand('copy')}catch(e){}
    ta.remove();if(done)ok();else manual();
  }
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(code).then(ok,legacy);
  else legacy();
});
</script>
</body>
</html>
`.replace('__CODE__', () => embedded).replace('__VER__', ver);

fs.writeFileSync(path.join(dir, 'ibon-ticket-watcher-install.html'), html);
console.log('version:', ver);
console.log('min.js:', Buffer.byteLength(bookmarklet), 'bytes');
console.log('install.html:', Buffer.byteLength(html), 'bytes');
