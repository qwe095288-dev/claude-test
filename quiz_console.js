/*
 * 國防部全民國防教育有獎徵答 — 自動答題腳本（瀏覽器 Console 版）
 *
 * 使用方式：
 *   1. 用瀏覽器打開 https://gpwd.mnd.gov.tw/reward/gameindex.aspx
 *   2. 點「開始答題 Go」進入答題頁
 *   3. 按 F12 → Console
 *   4. 把這整段程式碼貼上去，按 Enter
 *   5. 腳本會自動答題，答錯會學習，下次貼上就能秒答
 *
 * 答案庫存在瀏覽器 localStorage，同一台電腦同一個瀏覽器會記住。
 * 清除答案庫：在 Console 輸入 localStorage.removeItem('quizAnswers')
 * 查看答案庫：在 Console 輸入 JSON.parse(localStorage.getItem('quizAnswers'))
 */

(function() {
  'use strict';

  // ━━ 設定 ━━━━━━━━━━━━━━━━━━━━━━
  const DELAY_MS    = 800;   // 每步間隔（毫秒）
  const AUTO_NEXT   = true;  // 答完 9 題後自動開新一輪
  const MAX_ROUNDS  = 10;    // 最多跑幾輪（0 = 無限）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 答案庫（localStorage）
  function loadDB() {
    try {
      return JSON.parse(localStorage.getItem('quizAnswers')) || {};
    } catch(e) {
      return {};
    }
  }

  function saveDB(db) {
    localStorage.setItem('quizAnswers', JSON.stringify(db));
  }

  // 偵測畫面狀態
  function getState() {
    const s1 = document.getElementById('Show1');
    const s2 = document.getElementById('Show2');
    const s3 = document.getElementById('Show3');
    if (!s1 && !s2 && !s3) return 'other';
    if (s2 && s2.style.display !== 'none') return 'correct';
    if (s3 && s3.style.display !== 'none') return 'wrong';
    if (s1 && s1.style.display !== 'none') return 'question';
    return 'other';
  }

  // 取得題目文字
  function getQuestion() {
    const el = document.querySelector('.question2');
    return el ? el.innerText.trim() : '';
  }

  // 取得目前第幾題（從進度圖片判斷）
  function getProgress() {
    const imgs = document.querySelectorAll('.card-footer img[alt*="題"], .q-numberBG img[alt*="題"]');
    let done = 0;
    imgs.forEach(img => {
      if (img.src && img.src.includes('OK')) done++;
    });
    return done;
  }

  // 延遲
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // 模擬點擊 ASP.NET postback 按鈕
  function clickButton(id) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }

  // 等待頁面狀態改變
  function waitForStateChange(fromState, timeout) {
    timeout = timeout || 8000;
    return new Promise((resolve) => {
      const start = Date.now();
      const check = setInterval(() => {
        const now = getState();
        if (now !== fromState || Date.now() - start > timeout) {
          clearInterval(check);
          resolve(now);
        }
      }, 200);
    });
  }

  // 主邏輯
  async function answerCurrentQuestion(db) {
    const state = getState();

    if (state === 'other') {
      console.log('📋 不在答題頁面（可能已完成 9 題）');
      return 'done';
    }

    if (state === 'correct') {
      console.log('✅ 答對畫面，跳下一題...');
      clickButton('imgBack2');
      await sleep(DELAY_MS);
      await waitForStateChange('correct');
      await sleep(300);
      return 'next';
    }

    if (state === 'wrong') {
      console.log('❌ 答錯畫面，重試...');
      clickButton('imgBack');
      await sleep(DELAY_MS);
      await waitForStateChange('wrong');
      await sleep(300);
      return 'retry';
    }

    // state === 'question'
    const question = getQuestion();
    if (!question) {
      console.log('⚠ 讀不到題目文字');
      return 'error';
    }

    const entry = db[question] || { wrong: [] };
    const correct = entry.correct;
    const wrongList = entry.wrong || [];

    let choice;
    if (correct) {
      choice = correct;
      console.log(`📖 已知答案 → 選項 ${choice}`);
    } else {
      // 挑第一個沒試過的
      choice = [1,2,3,4].find(i => !wrongList.includes(i)) || 1;
      console.log(`🔍 嘗試 → 選項 ${choice}`);
    }

    // 點選答案
    const btnId = 'Ans' + choice;
    if (!clickButton(btnId)) {
      console.log(`⚠ 找不到按鈕 #${btnId}`);
      return 'error';
    }

    await sleep(DELAY_MS);
    const result = await waitForStateChange('question');
    await sleep(300);

    if (result === 'correct') {
      db[question] = { correct: choice, wrong: wrongList };
      saveDB(db);
      console.log(`✅ 正確！（選項 ${choice}）`);
      // 自動跳下一題
      clickButton('imgBack2');
      await sleep(DELAY_MS);
      await waitForStateChange('correct');
      await sleep(300);
      return 'next';
    }

    if (result === 'wrong') {
      if (!db[question]) db[question] = { wrong: [] };
      if (!db[question].wrong) db[question].wrong = [];
      if (!db[question].wrong.includes(choice)) {
        db[question].wrong.push(choice);
      }
      saveDB(db);
      console.log(`❌ 選項 ${choice} 錯誤`);
      // 點繼續作答重試
      clickButton('imgBack');
      await sleep(DELAY_MS);
      await waitForStateChange('wrong');
      await sleep(300);
      return 'retry';
    }

    return 'next';
  }

  // 跑一輪 9 題
  async function runOneRound(db, roundNum) {
    console.log(`\n${'━'.repeat(40)}`);
    console.log(`🎯 第 ${roundNum} 輪開始`);
    console.log(`${'━'.repeat(40)}`);

    let questionsDone = 0;

    for (let attempt = 0; attempt < 50; attempt++) {
      const question = getQuestion();
      const short = question.length > 40 ? question.substring(0, 40) + '…' : question;
      const progress = getProgress();

      if (getState() === 'question') {
        console.log(`\n  [${progress + 1}/9] ${short}`);
      }

      const result = await answerCurrentQuestion(db);

      if (result === 'done') {
        console.log(`\n✅ 第 ${roundNum} 輪完成！`);
        return true;
      }

      if (result === 'next') {
        questionsDone++;
        if (questionsDone >= 9) {
          console.log(`\n✅ 第 ${roundNum} 輪完成！（9 題全部答對）`);
          return true;
        }
      }

      if (result === 'error') {
        console.log('⚠ 發生錯誤，停止');
        return false;
      }
    }

    console.log('⚠ 嘗試次數過多，停止');
    return false;
  }

  // 啟動
  async function start() {
    const db = loadDB();
    const knownCount = Object.keys(db).length;

    console.log('🚀 國防常識有獎徵答 — 自動答題腳本');
    console.log(`📚 答案庫：已收錄 ${knownCount} 題`);
    console.log(`⚙ 間隔 ${DELAY_MS}ms / 最多 ${MAX_ROUNDS || '∞'} 輪`);
    console.log('⏹ 要停止請重新整理頁面\n');

    let round = 0;

    while (true) {
      round++;
      if (MAX_ROUNDS > 0 && round > MAX_ROUNDS) break;

      // 確認在答題頁
      if (getState() === 'other') {
        if (!AUTO_NEXT) break;
        console.log('🔄 前往新一輪...');
        // 導航到首頁重新開始
        window.location.href = window.location.href.replace('gameplay.aspx', 'gameindex.aspx');
        // 頁面會重新載入，腳本會停止
        // 需要使用者重新貼腳本，或用 Bookmarklet
        console.log('⚠ 頁面將重新載入，請再次貼上腳本');
        return;
      }

      const success = await runOneRound(db, round);

      if (!success) break;

      const totalKnown = Object.keys(loadDB()).length;
      console.log(`📚 答案庫累計 ${totalKnown} 題\n`);

      if (getState() === 'other') {
        if (!AUTO_NEXT || (MAX_ROUNDS > 0 && round >= MAX_ROUNDS)) break;
        console.log('⏳ 2 秒後開始新一輪...');
        await sleep(2000);
        window.location.href = window.location.href.replace('gameplay.aspx', 'gameindex.aspx');
        console.log('⚠ 頁面重新載入中，請在新頁面再貼一次腳本');
        return;
      }
    }

    const finalCount = Object.keys(loadDB()).length;
    console.log(`\n${'━'.repeat(40)}`);
    console.log(`📊 結束！答案庫共 ${finalCount} 題`);
    console.log(`${'━'.repeat(40)}`);
  }

  start();
})();
