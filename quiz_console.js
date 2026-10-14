/*
 * 國防部全民國防教育有獎徵答 — 自動答題腳本（瀏覽器 Console 版）
 * 全自動 9 題 + 個資頁自動帶入身分證。
 *
 * 使用方式：
 *   1. 開 https://gpwd.mnd.gov.tw/reward/gameindex.aspx → 點「開始答題 Go」
 *   2. 按 F12 → Console（手機 Safari 用書籤版）
 *   3. 貼上這整段，按 Enter
 *   4. 全自動答 9 題 → 跳到個資頁 → 再點一次書籤自動填身分證
 *
 * 資料存在 localStorage（只在你的瀏覽器裡，不會上傳）：
 *   清除答案庫：localStorage.removeItem('quizAnswers')
 *   清除身分證：localStorage.removeItem('quizUserID')
 */

(function () {
  'use strict';

  var DELAY = 600;

  // ═══ 浮動狀態面板 ═══
  function createPanel() {
    var old = document.getElementById('quizPanel');
    if (old) old.remove();

    var panel = document.createElement('div');
    panel.id = 'quizPanel';
    panel.style.cssText = 'position:fixed;top:16px;right:16px;z-index:99999;'
      + 'background:linear-gradient(135deg,#1a3a1a,#2c5f2d);color:#fff;'
      + 'padding:16px 20px;border-radius:14px;font-family:"Microsoft JhengHei",sans-serif;'
      + 'font-size:15px;min-width:220px;box-shadow:0 6px 24px rgba(0,0,0,0.35);'
      + 'line-height:1.6;transition:opacity 0.3s;';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;';
    var title = document.createElement('div');
    title.id = 'quizTitle';
    title.style.cssText = 'font-size:18px;font-weight:bold;';
    title.textContent = '🎖 自動答題中...';
    header.appendChild(title);
    var closeBtn = document.createElement('div');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'cursor:pointer;font-size:18px;opacity:0.7;padding:0 0 0 12px;';
    closeBtn.onmouseover = function() { closeBtn.style.opacity = '1'; };
    closeBtn.onmouseout = function() { closeBtn.style.opacity = '0.7'; };
    closeBtn.onclick = function() { panel.remove(); };
    header.appendChild(closeBtn);
    panel.appendChild(header);

    var progress = document.createElement('div');
    progress.id = 'quizProgress';
    progress.style.cssText = 'margin-bottom:8px;';
    progress.textContent = '準備開始...';
    panel.appendChild(progress);

    var bar = document.createElement('div');
    bar.style.cssText = 'background:rgba(255,255,255,0.2);border-radius:8px;height:10px;overflow:hidden;';
    var fill = document.createElement('div');
    fill.id = 'quizBar';
    fill.style.cssText = 'background:linear-gradient(90deg,#4ade80,#22c55e);height:100%;width:0%;'
      + 'border-radius:8px;transition:width 0.4s ease;';
    bar.appendChild(fill);
    panel.appendChild(bar);

    var log = document.createElement('div');
    log.id = 'quizLog';
    log.style.cssText = 'margin-top:10px;font-size:13px;opacity:0.85;max-height:120px;overflow-y:auto;';
    panel.appendChild(log);

    document.body.appendChild(panel);
    return panel;
  }

  function updatePanel(done, total, msg, isError) {
    var progress = document.getElementById('quizProgress');
    var bar = document.getElementById('quizBar');
    var log = document.getElementById('quizLog');
    if (progress) progress.textContent = done + ' / ' + total + ' 題';
    if (bar) bar.style.width = Math.round((done / total) * 100) + '%';
    if (log && msg) {
      var line = document.createElement('div');
      line.textContent = msg;
      if (isError) line.style.color = '#fca5a5';
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    }
  }

  function panelDone(msg) {
    var title = document.getElementById('quizTitle');
    if (title) title.textContent = msg || '🎉 完成！';
    var bar = document.getElementById('quizBar');
    if (bar) bar.style.width = '100%';
  }

  async function goToFormPage(url) {
    var formUrl = url || './complete.aspx';
    var sid = localStorage.getItem('quizUserID') || '';
    if (!sid) {
      sid = prompt('請輸入身分證字號（會記住，下次自動帶入）：');
      if (sid && sid.trim()) {
        sid = sid.trim().toUpperCase();
        localStorage.setItem('quizUserID', sid);
      } else {
        window.location.href = formUrl;
        return;
      }
    }
    try {
      var resp = await fetch(formUrl);
      var html = await resp.text();
      document.open();
      document.write(html);
      document.close();
      window.history.replaceState(null, '', formUrl);

      setTimeout(function () {
        var inp = document.querySelector('input[placeholder*="身分證"]')
          || document.querySelector('input[name*="id" i]')
          || document.querySelector('input[name*="ID"]');
        if (inp) {
          inp.value = sid;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
        createPanel();
        panelDone('✅ 身分證已填入');
        updatePanel(9, 9, '身分證：' + sid.charAt(0) + '***' + sid.slice(-2));
        updatePanel(9, 9, '請輸入驗證碼後按「確定送出」');
      }, 800);
    } catch (e) {
      window.location.href = formUrl;
    }
  }

  function addPanelButtons(url) {
    var panel = document.getElementById('quizPanel');
    if (!panel) return;
    var wrap = document.createElement('div');
    wrap.style.cssText = 'margin-top:12px;display:flex;gap:8px;';

    var idBtn = document.createElement('button');
    idBtn.textContent = '📋 前往填寫個資';
    idBtn.style.cssText = 'flex:1;padding:10px;border:none;border-radius:8px;'
      + 'background:#4ade80;color:#1a3a1a;font-size:15px;font-weight:bold;cursor:pointer;';
    idBtn.onmouseover = function() { idBtn.style.background = '#22c55e'; };
    idBtn.onmouseout = function() { idBtn.style.background = '#4ade80'; };
    idBtn.onclick = function() {
      idBtn.disabled = true;
      idBtn.textContent = '載入中...';
      goToFormPage(url);
    };
    wrap.appendChild(idBtn);

    var closeBtn2 = document.createElement('button');
    closeBtn2.textContent = '關閉';
    closeBtn2.style.cssText = 'padding:10px 16px;border:1px solid rgba(255,255,255,0.3);border-radius:8px;'
      + 'background:transparent;color:#fff;font-size:14px;cursor:pointer;';
    closeBtn2.onclick = function() {
      panel.remove();
    };
    wrap.appendChild(closeBtn2);

    panel.appendChild(wrap);
  }

  function loadDB() {
    try { return JSON.parse(localStorage.getItem('quizAnswers')) || {}; }
    catch (e) { return {}; }
  }

  function saveDB(d) {
    localStorage.setItem('quizAnswers', JSON.stringify(d));
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  async function post(eventTarget) {
    var fd = new URLSearchParams();
    fd.set('__EVENTTARGET', eventTarget);
    fd.set('__EVENTARGUMENT', '');
    fd.set('__VIEWSTATE', document.getElementById('__VIEWSTATE').value);
    fd.set('__VIEWSTATEGENERATOR', document.getElementById('__VIEWSTATEGENERATOR').value);
    fd.set('__EVENTVALIDATION', document.getElementById('__EVENTVALIDATION').value);
    fd.set('__SCROLLPOSITIONX', '0');
    fd.set('__SCROLLPOSITIONY', '0');
    var csrf = document.getElementById('CSRFToken');
    if (csrf) fd.set('CSRFToken', csrf.value);

    var resp = await fetch('./gameplay.aspx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: fd.toString(),
      redirect: 'follow'
    });
    return { text: await resp.text(), url: resp.url };
  }

  function parse(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');

    ['__VIEWSTATE', '__VIEWSTATEGENERATOR', '__EVENTVALIDATION', 'CSRFToken']
      .forEach(function (id) {
        var src = doc.getElementById(id);
        var dst = document.getElementById(id);
        if (src && dst) dst.value = src.value;
      });

    var state = 'other';
    if (/\bShow2\(\);/.test(html)) state = 'correct';
    else if (/\bShow3\(\);/.test(html)) state = 'wrong';
    else if (/\bShow1\(\);/.test(html)) state = 'question';

    var qEl = doc.querySelector('.question2');
    var question = qEl ? qEl.innerText.trim() : '';

    return { state: state, question: question, doc: doc };
  }

  function updatePage(doc) {
    var srcShow1 = doc.getElementById('Show1');
    var dstShow1 = document.getElementById('Show1');
    if (srcShow1 && dstShow1) {
      dstShow1.innerHTML = srcShow1.innerHTML;
    }
    document.getElementById('Show1').style.display = '';
    document.getElementById('Show2').style.display = 'none';
    document.getElementById('Show3').style.display = 'none';
  }

  // ═══ 個資表單頁：自動帶入身分證 ═══
  function fillIDForm() {
    var idInput = document.querySelector('input[placeholder*="身分證"]')
      || document.querySelector('input[name*="id" i]')
      || document.querySelector('input[name*="ID"]');

    if (!idInput) return false;

    var savedID = localStorage.getItem('quizUserID') || '';

    if (!savedID) {
      savedID = prompt('請輸入身分證字號（會記住，下次自動帶入）：');
      if (savedID && savedID.trim()) {
        savedID = savedID.trim().toUpperCase();
        localStorage.setItem('quizUserID', savedID);
      } else {
        return true;
      }
    }

    idInput.value = savedID;
    idInput.dispatchEvent(new Event('input', { bubbles: true }));
    idInput.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('✅ 身分證已自動填入：' + savedID.charAt(0) + '***' + savedID.slice(-2));

    createPanel();
    panelDone('✅ 身分證已填入');
    updatePanel(9, 9, '身分證：' + savedID.charAt(0) + '***' + savedID.slice(-2));
    updatePanel(9, 9, '請輸入驗證碼後按「確定送出」');
    return true;
  }

  async function run() {
    var db = loadDB();
    var knownCount = Object.keys(db).length;

    createPanel();
    updatePanel(0, 9, '答案庫：' + knownCount + ' 題');

    console.log('🚀 全自動答題啟動');
    console.log('📚 答案庫：' + knownCount + ' 題');

    var qEl = document.querySelector('.question2');
    var question = qEl ? qEl.innerText.trim() : '';

    if (!question) {
      updatePanel(0, 9, '找不到題目', true);
      return;
    }

    var done = 0;

    while (done < 9) {
      if (!question) {
        updatePanel(done, 9, '題目為空，中斷', true);
        break;
      }

      var short = question.length > 30 ? question.substring(0, 30) + '…' : question;

      var entry = db[question] || { wrong: [] };
      var wrongList = entry.wrong || [];
      var answered = false;

      while (!answered) {
        var choice;

        if (entry.correct) {
          choice = entry.correct;
          updatePanel(done, 9, 'Q' + (done + 1) + ' 已知→' + choice);
        } else {
          choice = [1, 2, 3, 4].find(function (i) { return wrongList.indexOf(i) < 0; }) || 1;
          updatePanel(done, 9, 'Q' + (done + 1) + ' 嘗試→' + choice);
        }

        var resp, result;
        try {
          resp = await post('Ans' + choice);
          result = parse(resp.text);
          await sleep(DELAY);
        } catch (err) {
          updatePanel(done, 9, '網路錯誤: ' + err.message, true);
          return;
        }

        if (result.state === 'correct') {
          db[question] = { correct: choice, wrong: wrongList };
          saveDB(db);
          done++;
          answered = true;
          updatePanel(done, 9, 'Q' + done + ' ✔ 選項' + choice);

          if (done >= 9) {
            panelDone('🎉 9 題完成！');
            var completeUrl = './complete.aspx';
            try {
              var nextResp = await post('imgBack2');
              if (nextResp.url && nextResp.url.indexOf('complete') > -1) {
                completeUrl = nextResp.url;
              }
            } catch (e) {}
            addPanelButtons(completeUrl);
            return;
          }

          try {
            var resp2 = await post('imgBack2');
            var result2 = parse(resp2.text);
            await sleep(DELAY);

            if (result2.state === 'question' && result2.question) {
              updatePage(result2.doc);
              question = result2.question;
            } else if (resp2.url && resp2.url.indexOf('complete') > -1) {
              panelDone('🎉 完成！');
              addPanelButtons(resp2.url);
              return;
            } else {
              question = '';
            }
          } catch (err2) {
            updatePanel(done, 9, '取下一題失敗', true);
            return;
          }

        } else if (result.state === 'wrong') {
          if (!db[question]) db[question] = { wrong: [] };
          if (!db[question].wrong) db[question].wrong = [];
          if (db[question].wrong.indexOf(choice) < 0) {
            db[question].wrong.push(choice);
          }
          wrongList = db[question].wrong;
          saveDB(db);
          updatePanel(done, 9, 'Q' + (done + 1) + ' ✘ 選項' + choice + ' 重試');

          try {
            var resp3 = await post('imgBack');
            var result3 = parse(resp3.text);
            if (result3.state === 'question') {
              updatePage(result3.doc);
            }
            await sleep(DELAY);
          } catch (err3) {
            updatePanel(done, 9, '重試失敗', true);
            return;
          }

        } else {
          if (resp.url && resp.url.indexOf('complete') > -1) {
            panelDone('🎉 完成！');
            addPanelButtons(resp.url);
            return;
          }
          question = result.question;
          answered = true;
        }
      }
    }

    panelDone('🎉 完成！');
    addPanelButtons('./complete.aspx');
  }

  // ═══ 判斷目前在哪個頁面 ═══
  var pageText = document.body ? document.body.innerText : '';
  var isFormPage = pageText.indexOf('身分證字號') > -1 && pageText.indexOf('驗證碼') > -1;
  var isQuizPage = window.location.href.indexOf('gameplay') > -1 && document.querySelector('.question2');
  if (isFormPage) {
    fillIDForm();
  } else if (isQuizPage) {
    run().catch(function(e) { console.error('腳本錯誤:', e); });
  } else {
    var link = document.querySelector('a[href*="gameplay"]');
    if (link) {
      link.click();
    } else {
      window.location.href = window.location.href.replace(/[^\/]*$/, 'gameplay.aspx');
    }
  }
})();
