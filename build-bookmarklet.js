const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dir = __dirname;
const raw = fs.readFileSync(path.join(dir, 'bcgame-mines-bookmarklet.js'), 'utf8');
const ver = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 8);
const src = raw.replace('__BUILD__', ver);

const min = src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^(\s*)\/\/.*$/gm, '')
  .split('\n').map(l => l.trim()).filter(Boolean).join(' ')
  .replace(/ {2,}/g, ' ');

new Function(min.replace(/^javascript:/, ''));

// javascript: URLs are percent-decoded before running
const bookmarklet = min.replace(/%/g, '%25');
fs.writeFileSync(path.join(dir, 'bcgame-mines-bookmarklet.min.js'), bookmarklet);

// JSON with "<" escaped can never close the <script> element early
const embedded = JSON.stringify(bookmarklet).replace(/</g, '\\u003c');

const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>踩地雷 Bot 安裝</title>
<style>
:root{--bg:#0c0e14;--card:#12141c;--border:#2a2e3d;--text:#e2e4ea;--sub:#8b8fa3;--green:#4ade80;--blue:#3b82f6;--yellow:#fbbf24}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;padding:24px 16px}
.container{max-width:560px;margin:0 auto}
h1{font-size:24px;color:var(--green);margin-bottom:8px;text-align:center}
.subtitle{color:var(--sub);text-align:center;margin-bottom:32px;font-size:14px}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:16px}
.card h2{font-size:16px;color:var(--green);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.num{width:28px;height:28px;background:var(--green);color:var(--bg);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0}
.drag-area{text-align:center;padding:20px;border:2px dashed var(--border);border-radius:10px}
.bookmark-link{display:inline-block;padding:14px 28px;background:var(--blue);color:#fff;font-size:16px;font-weight:600;border-radius:10px;text-decoration:none;cursor:grab;white-space:nowrap}
.hint{color:var(--sub);font-size:12px;margin-top:12px}
.steps{list-style:none;counter-reset:step}
.steps li{position:relative;padding:8px 0 8px 32px;color:var(--sub);font-size:14px;line-height:1.5}
.steps li::before{counter-increment:step;content:counter(step);position:absolute;left:0;top:8px;width:22px;height:22px;background:var(--border);color:var(--text);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600}
.steps li strong{color:var(--text)}
.copy-btn{display:block;width:100%;padding:12px;background:var(--green);color:var(--bg);border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-top:12px}
.code-preview{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;font-family:ui-monospace,monospace;font-size:11px;color:var(--sub);max-height:80px;overflow:hidden;word-break:break-all;margin-top:8px}
.meta{color:var(--sub);font-size:12px;margin-top:8px}
.sel-btn{display:block;width:100%;padding:10px;background:var(--border);color:var(--text);border:none;border-radius:8px;font-size:13px;cursor:pointer;margin-top:8px}
textarea#codeBox{width:100%;height:90px;margin-top:8px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;font-family:ui-monospace,monospace;font-size:16px;color:var(--sub);resize:vertical}
.note{background:#1a1d2a;border-left:3px solid var(--yellow);padding:12px 16px;border-radius:0 8px 8px 0;font-size:13px;color:var(--yellow)}
</style>
</head>
<body>
<div class="container">
<h1>踩地雷 Bot</h1>
<p class="subtitle">BC Game Mines 輔助工具（電腦 Chrome／iPhone Safari）</p>

<div id="desktopCards">
<div class="card">
<h2><span class="num">💻</span>電腦：拖曳安裝</h2>
<div class="drag-area">
<a class="bookmark-link" id="bmLink" href="#">踩地雷 Bot</a>
<p class="hint">把上面的按鈕拖到書籤列即可（舊書籤請先刪除，並重新整理 BC Game 頁面）</p>
</div>
<ol class="steps" style="margin-top:12px">
<li>拖不動的話：書籤列<strong>右鍵 → 新增書籤</strong>，名稱填「踩地雷 Bot」</li>
<li>網址欄貼上下方「複製程式碼」的內容，儲存</li>
</ol>
</div>
</div>

<div class="card" id="iosCard">
<h2><span class="num">📱</span>iPhone／iPad（Safari）</h2>
<ol class="steps">
<li>按下方「<strong>複製程式碼</strong>」</li>
<li>在 <strong>Safari</strong> 開任何網頁（例如 google.com），點<strong>分享鈕 → 加入書籤</strong>，名稱改成「踩地雷 Bot」→ 儲存</li>
<li>點 Safari 的<strong>書籤圖示</strong>（打開的書）→ 右下「<strong>編輯</strong>」→ 點「踩地雷 Bot」→ <strong>把網址欄清空，貼上程式碼</strong> → 完成</li>
<li>打開 <strong>BC Game 踩地雷</strong>頁面 → 點書籤圖示 → 點「踩地雷 Bot」執行（也可以在網址列輸入「踩地雷」，從建議清單點書籤）</li>
<li>更新版本時：先重新整理 BC Game 頁面，再執行新書籤</li>
</ol>
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
<li>在 BC Game 踩地雷頁面執行書籤</li>
<li>到「選擇器」頁按「<strong>自動偵測</strong>」</li>
<li>到「參數」頁設定底注後按「儲存參數」（下次會記住）</li>
<li>按「<strong>半自動輔助</strong>」：你自己按投注、開格、兌現，Bot 會依輸贏自動填好下一注</li>
<li>點「<strong>—</strong>」縮小成圓形按鈕，按鈕上會顯示下一注金額</li>
</ol>
</div>

<div class="note">此工具僅供學習研究用途，使用風險自負。</div>
</div>

<script>
var code=__CODE__;
var isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(isIOS){
  var c=document.querySelector('.container');
  c.insertBefore(document.getElementById('iosCard'),document.getElementById('desktopCards'));
}
document.getElementById('bmLink').setAttribute('href',code);
var box=document.getElementById('codeBox');
box.value=code;
document.getElementById('codeMeta').textContent='版本 __VER__ ｜ 程式碼長度：'+code.length+' 字元';
function selectBox(){
  box.focus();
  box.setSelectionRange(0,box.value.length);
}
document.getElementById('selBtn').addEventListener('click',selectBox);
document.getElementById('copyBtn').addEventListener('click',function(){
  var b=this;
  function ok(){b.textContent='已複製 ✓';setTimeout(function(){b.textContent='複製程式碼'},2000)}
  function manual(){b.textContent='自動複製失敗：請按下方「全選文字框」再點「拷貝」';selectBox()}
  function legacy(){
    var ta=document.createElement('textarea');
    ta.value=code;
    ta.setAttribute('readonly','');
    ta.style.cssText='position:fixed;top:0;left:0;opacity:0;font-size:16px';
    document.body.appendChild(ta);
    ta.focus();
    ta.setSelectionRange(0,code.length);
    var done=false;
    try{done=document.execCommand('copy')}catch(e){}
    ta.remove();
    if(done)ok();else manual();
  }
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(code).then(ok,legacy);
  else legacy();
});
</script>
</body>
</html>
`.replace('__CODE__', () => embedded).replace('__VER__', ver);

fs.writeFileSync(path.join(dir, 'bcgame-mines-install.html'), html);
console.log('version:', ver);
console.log('min.js:', Buffer.byteLength(bookmarklet), 'bytes');
console.log('install.html:', Buffer.byteLength(html), 'bytes');
