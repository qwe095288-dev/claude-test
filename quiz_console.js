/*
 * 國防部全民國防教育有獎徵答 — 自動答題腳本（瀏覽器 Console 版）
 * 半自動模式：前 8 題自動答，第 9 題手動點，個資頁自動帶入身分證。
 *
 * 使用方式：
 *   1. 開 https://gpwd.mnd.gov.tw/reward/gameindex.aspx → 點「開始答題 Go」
 *   2. 按 F12 → Console（手機 Safari 用書籤版）
 *   3. 貼上這整段，按 Enter
 *   4. 自動答 8 題 → 第 9 題手動點 → 個資頁自動填身分證
 *
 * 資料存在 localStorage（只在你的瀏覽器裡，不會上傳）：
 *   答案庫：localStorage.removeItem('quizAnswers')
 *   身分證：localStorage.removeItem('quizUserID')
 */

(function () {
  'use strict';

  var DELAY = 600;

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
      body: fd.toString()
    });
    return await resp.text();
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

  function syncFormFields() {
    var form = document.getElementById('form1');
    if (!form) return;
    var fields = ['__VIEWSTATE', '__VIEWSTATEGENERATOR', '__EVENTVALIDATION', 'CSRFToken'];
    fields.forEach(function (id) {
      var el = document.getElementById(id);
      var formEl = form.querySelector('[name="' + id + '"]');
      if (el && formEl && formEl !== el) {
        formEl.value = el.value;
      }
    });
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
    alert('身分證已自動填入，請輸入驗證碼後按「確定送出」');
    return true;
  }

  async function run() {
    var db = loadDB();
    var knownCount = Object.keys(db).length;

    console.log('🚀 半自動答題啟動（前 8 題自動，第 9 題手動）');
    console.log('📚 答案庫：' + knownCount + ' 題\n');

    var qEl = document.querySelector('.question2');
    var question = qEl ? qEl.innerText.trim() : '';

    if (!question) {
      console.log('⚠ 找不到題目，請確認在答題頁面');
      return;
    }

    var done = 0;

    while (done < 8) {
      if (!question) {
        console.log('⚠ 題目為空，中斷');
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

        var html, result;
        try {
          html = await post('Ans' + choice);
          result = parse(html);
          await sleep(DELAY);
        } catch (err) {
          console.log('  ⚠ fetch 失敗: ' + err.message);
          return;
        }

        if (result.state === 'correct') {
          db[question] = { correct: choice, wrong: wrongList };
          saveDB(db);
          done++;
          answered = true;
          console.log('  ✅ 正確！（選項 ' + choice + '）');

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
            console.log('  ⚠ 取下一題失敗');
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
          console.log('  ❌ 選項 ' + choice + ' 錯誤（已記錄）');

          try {
            var html3 = await post('imgBack');
            var result3 = parse(html3);
            if (result3.state === 'question') {
              updatePage(result3.doc);
            }
            await sleep(DELAY);
          } catch (err3) {
            console.log('  ⚠ 重試失敗');
            return;
          }

        } else {
          console.log('  ⚠ 未知狀態: ' + result.state);
          question = result.question;
          answered = true;
        }
      }
    }

    // ═══ 第 9 題：交給使用者手動作答 ═══
    if (done === 8 && question) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🖐 第 9 題請手動作答！');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      syncFormFields();

      var entry9 = db[question] || { wrong: [] };
      if (entry9.correct) {
        var msg = '第 9 題請手動點選項 ' + entry9.correct + '（已知正確答案）';
        console.log('📖 ' + msg);
        alert(msg);
      } else {
        var tried = (entry9.wrong || []).join(', ');
        var suggestion = [1, 2, 3, 4].find(function (i) { return (entry9.wrong || []).indexOf(i) < 0; }) || 1;
        var msg2 = '第 9 題請手動作答。建議試選項 ' + suggestion;
        if (tried) msg2 += '（已知錯誤：' + tried + '）';
        console.log('🔍 ' + msg2);
        alert(msg2);
      }
    } else {
      console.log('\n🎉 答題結束！答案庫：' + Object.keys(db).length + ' 題');
    }
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
