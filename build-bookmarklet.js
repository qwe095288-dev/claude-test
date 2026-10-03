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
<title>踩地雷 Bot 書籤安裝</title>
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
.note{background:#1a1d2a;border-left:3px solid var(--yellow);padding:12px 16px;border-radius:0 8px 8px 0;font-size:13px;color:var(--yellow)}
</style>
</head>
<body>
<div class="container">
<h1>踩地雷 Bot</h1>
<p class="subtitle">BC Game Mines 自動策略工具</p>

<div class="card">
<h2><span class="num">1</span>拖曳安裝（推薦）</h2>
<div class="drag-area">
<a class="bookmark-link" id="bmLink" href="#">踩地雷 Bot</a>
<p class="hint">把上面的按鈕拖到書籤列即可（舊書籤請先刪除，並重新整理 BC Game 頁面）</p>
</div>
</div>

<div class="card">
<h2><span class="num">2</span>手動安裝</h2>
<ol class="steps">
<li>在書籤列上<strong>右鍵 → 新增書籤</strong></li>
<li>名稱填 <strong>踩地雷 Bot</strong></li>
<li>網址欄貼上「複製程式碼」的內容</li>
<li>儲存書籤</li>
</ol>
<button class="copy-btn" id="copyBtn">複製程式碼</button>
<div class="code-preview" id="codePreview"></div>
<p class="meta" id="codeMeta"></p>
</div>

<div class="card">
<h2><span class="num">3</span>使用方式</h2>
<ol class="steps">
<li>打開 <strong>BC Game 踩地雷</strong>頁面</li>
<li>點擊書籤列上的 <strong>「踩地雷 Bot」</strong></li>
<li>點「<strong>自動偵測</strong>」或手動選取頁面元素</li>
<li>設定參數後按「<strong>開始策略</strong>」</li>
<li>點「<strong>—</strong>」可縮小成浮動圓形按鈕</li>
</ol>
</div>

<div class="note">此工具僅供學習研究用途，使用風險自負。</div>
</div>

<script>
var code=__CODE__;
document.getElementById('bmLink').setAttribute('href',code);
document.getElementById('codePreview').textContent=code.substring(0,300)+'...';
document.getElementById('codeMeta').textContent='程式碼長度：'+code.length+' 字元';
function copied(){
  var b=document.getElementById('copyBtn');
  b.textContent='已複製 ✓';
  setTimeout(function(){b.textContent='複製程式碼'},2000);
}
document.getElementById('copyBtn').addEventListener('click',function(){
  if(navigator.clipboard){
    navigator.clipboard.writeText(code).then(copied,fallback);
  }else{
    fallback();
  }
  function fallback(){
    var ta=document.createElement('textarea');
    ta.value=code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    copied();
  }
});
</script>
</body>
</html>
`.replace('__CODE__', () => embedded);

fs.writeFileSync(path.join(dir, 'bcgame-mines-install.html'), html);
console.log('version:', ver);
console.log('min.js:', Buffer.byteLength(bookmarklet), 'bytes');
console.log('install.html:', Buffer.byteLength(html), 'bytes');
