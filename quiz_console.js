/*
 * 國防部全民國防教育有獎徵答 — 自動答題腳本（瀏覽器 Console 版）
 * 使用 fetch 在背景送表單，頁面不重新載入，腳本全程不中斷。
 * 第 9 題答對後用真實表單提交跳轉到個資表單頁。
 *
 * 使用方式：
 *   1. 開 https://gpwd.mnd.gov.tw/reward/gameindex.aspx → 點「開始答題 Go」
 *   2. 按 F12 → Console
 *   3. 貼上這整段，按 Enter
 *   4. 自動答題 + 學習答案
 *
 * 答案庫存在 localStorage，關瀏覽器/重開機都不會消失。
 * 清除答案庫：localStorage.removeItem('quizAnswers')
 * 查看答案庫：JSON.parse(localStorage.getItem('quizAnswers'))
 */

(function () {
  'use strict';

  // ━━ 設定 ━━━━━━━━━━━━━━━━━━━━━━
  var DELAY = 600;  // 每步間隔毫秒
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

  // 用 fetch 送 ASP.NET postback（不重新載入頁面）
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
      body: fd.toString()
    });
    return await resp.text();
  }

  // 解析 server 回傳的 HTML
  function parse(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');

    // 更新頁面中的隱藏欄位（下次 post 會用到）
    ['__VIEWSTATE', '__VIEWSTATEGENERATOR', '__EVENTVALIDATION', 'CSRFToken']
      .forEach(function (id) {
        var src = doc.getElementById(id);
        var dst = document.getElementById(id);
        if (src && dst) dst.value = src.value;
      });

    // 從 inline script 判斷狀態
    var state = 'other';
    if (/\bShow2\(\);/.test(html)) state = 'correct';
    else if (/\bShow3\(\);/.test(html)) state = 'wrong';
    else if (/\bShow1\(\);/.test(html)) state = 'question';

    // 取得題目文字
    var qEl = doc.querySelector('.question2');
    var question = qEl ? qEl.innerText.trim() : '';

    return { state: state, question: question, doc: doc };
  }

  // 更新畫面上顯示的題目
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

  // 用真實表單提交（會重新載入頁面）
  function realSubmit(eventTarget) {
    document.getElementById('__EVENTTARGET').value = eventTarget;
    document.getElementById('__EVENTARGUMENT').value = '';
    document.getElementById('form1').submit();
  }

  async function run() {
    var db = loadDB();
    var knownCount = Object.keys(db).length;

    console.log('🚀 自動答題啟動');
    console.log('📚 答案庫：' + knownCount + ' 題');
    console.log('⏹ 停止請重新整理頁面\n');

    var qEl = document.querySelector('.question2');
    var question = qEl ? qEl.innerText.trim() : '';

    if (!question) {
      console.log('⚠ 找不到題目，請確認在答題頁面');
      return;
    }

    var done = 0;

    while (done < 9) {
      if (!question) {
        console.log('✅ 已完成！');
        break;
      }

      var short = question.length > 40 ? question.substring(0, 40) + '…' : question;
      console.log('[' + (done + 1) + '/9] ' + short);

      var entry = db[question] || { wrong: [] };
      var wrongList = entry.wrong || [];
      var answered = false;

      while (!answered) {
        var choice;

        if (entry.correct) {
          choice = entry.correct;
          console.log('  📖 已知答案 → 選項 ' + choice);
        } else {
          choice = [1, 2, 3, 4].find(function (i) { return wrongList.indexOf(i) < 0; }) || 1;
          console.log('  🔍 嘗試 → 選項 ' + choice);
        }

        try {
          // 送出答案
          var html = await post('Ans' + choice);
          var result = parse(html);
          await sleep(DELAY);
        } catch (err) {
          console.log('  ⚠ fetch 失敗: ' + err.message + '，改用真實點擊');
          document.getElementById('Ans' + choice).click();
          return;
        }

        if (result.state === 'correct') {
          // ✅ 答對
          db[question] = { correct: choice, wrong: wrongList };
          saveDB(db);
          done++;
          answered = true;
          console.log('  ✅ 正確！（選項 ' + choice + '）');

          // === 第 9 題答對：用真實表單提交跳到個資頁 ===
          if (done >= 9) {
            console.log('\n🎉 9 題全部完成！答案庫：' + Object.keys(db).length + ' 題');
            console.log('📋 跳轉到個資表單...');
            // parse 已更新隱藏欄位，直接用真實 submit 跳轉
            realSubmit('imgBack2');
            return;
          }

          // === 非最後一題：fetch 繼續 ===
          try {
            var html2 = await post('imgBack2');
            var result2 = parse(html2);
            await sleep(DELAY);

            if (result2.state === 'question' && result2.question) {
              updatePage(result2.doc);
              question = result2.question;
            } else {
              question = '';
            }
          } catch (err2) {
            console.log('  ⚠ 取下一題失敗: ' + err2.message);
            realSubmit('imgBack2');
            return;
          }

        } else if (result.state === 'wrong') {
          // ❌ 答錯
          if (!db[question]) db[question] = { wrong: [] };
          if (!db[question].wrong) db[question].wrong = [];
          if (db[question].wrong.indexOf(choice) < 0) {
            db[question].wrong.push(choice);
          }
          wrongList = db[question].wrong;
          saveDB(db);
          console.log('  ❌ 選項 ' + choice + ' 錯誤（已記錄）');

          try {
            var html3 = await post('imgBack');
            var result3 = parse(html3);
            if (result3.state === 'question') {
              updatePage(result3.doc);
            }
            await sleep(DELAY);
          } catch (err3) {
            console.log('  ⚠ 重試失敗: ' + err3.message);
            realSubmit('imgBack');
            return;
          }

        } else {
          console.log('  ⚠ 未知狀態: ' + result.state);
          console.log('  ⚠ 回應片段: ' + html.substring(html.length - 200));
          question = result.question;
          answered = true;
        }
      }
    }

    console.log('\n🎉 全部完成！答案庫：' + Object.keys(db).length + ' 題');
  }

  // 檢查是否在答題頁
  if (window.location.href.indexOf('gameplay') > -1) {
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
