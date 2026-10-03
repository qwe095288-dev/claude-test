// ============================================================
// BC Game 踩地雷自動策略腳本
// 使用方式：在 BC Game 踩地雷頁面的 Console 貼上執行
// ============================================================

// ============ 第一步：策略參數（按你的策略調整）============
const CONFIG = {
  baseBet: 0.00001,      // 底注金額（依你用的幣種單位）
  mines: 4,              // 地雷數量
  picks: 2,              // 每輪要開幾格
  multiOnLoss: 3,        // 輸了下注翻幾倍
  maxLossStreak: 3,      // 連輸幾把就認賠重置
  maxTotalRounds: 500,   // 最多跑幾局就停（安全機制）
  stopLossAmount: null,   // 止損金額，null = 不設止損
  delayBetweenRounds: 2500, // 每局之間等幾毫秒
  delayBetweenClicks: 800,  // 開格之間等幾毫秒
  delayAfterBet: 1500,      // 按下注後等幾毫秒
};

// ============ 第二步：DOM 選擇器 ============
// *** 這些選擇器必須對應你的 BC Game 頁面 ***
// *** 用下面的 discoverSelectors() 工具來找到正確的選擇器 ***
const SEL = {
  // 下注金額輸入框
  betInput: '',
  // 「下注」按鈕（開始遊戲）
  betButton: '',
  // 「提現 / Cashout」按鈕
  cashoutButton: '',
  // 地雷格子（25 個 tile 的共同選擇器）
  tiles: '',
  // 餘額顯示
  balance: '',
  // 地雷數量選擇（如果需要手動設定的話）
  minesInput: '',
};

// ============================================================
// 選擇器探測工具 — 先跑這個來找到正確的 DOM 選擇器
// ============================================================
function discoverSelectors() {
  console.log('%c=== BC Game DOM 選擇器探測工具 ===', 'color: #4ade80; font-size: 16px; font-weight: bold;');
  console.log('%c請按照以下步驟操作：', 'color: #fbbf24; font-size: 14px;');
  console.log('');

  console.log('%c方法一：手動探測（推薦）', 'color: #60a5fa; font-size: 13px; font-weight: bold;');
  console.log('1. 在頁面上對目標元素按右鍵 → 檢查 (Inspect)');
  console.log('2. 在 Elements 面板中找到該元素');
  console.log('3. 右鍵 → Copy → Copy selector');
  console.log('4. 貼到上面 SEL 對應的欄位');
  console.log('');

  console.log('%c方法二：用互動模式探測', 'color: #60a5fa; font-size: 13px; font-weight: bold;');
  console.log('執行 pickElement("betInput") 然後點擊頁面上的下注輸入框');
  console.log('執行 pickElement("betButton") 然後點擊下注按鈕');
  console.log('執行 pickElement("cashoutButton") 然後點擊提現按鈕');
  console.log('執行 pickElement("tiles") 然後點擊任一格子');
  console.log('');

  console.log('%c方法三：自動猜測常見選擇器', 'color: #60a5fa; font-size: 13px; font-weight: bold;');
  console.log('執行 autoGuess() 嘗試自動找到元素');
  console.log('');

  // 列出頁面上的 input 和 button
  const inputs = document.querySelectorAll('input');
  const buttons = document.querySelectorAll('button');
  console.log(`%c頁面上找到 ${inputs.length} 個 input, ${buttons.length} 個 button`, 'color: #a78bfa;');

  inputs.forEach((el, i) => {
    const info = {
      index: i,
      type: el.type,
      name: el.name,
      placeholder: el.placeholder,
      value: el.value,
      class: el.className.slice(0, 80),
      id: el.id,
    };
    console.log(`  input[${i}]:`, info);
  });

  buttons.forEach((el, i) => {
    const info = {
      index: i,
      text: el.textContent.trim().slice(0, 40),
      class: el.className.slice(0, 80),
      id: el.id,
      disabled: el.disabled,
    };
    console.log(`  button[${i}]:`, info);
  });
}

// 互動模式：點擊頁面元素來自動取得選擇器
function pickElement(selectorKey) {
  console.log(`%c請點擊頁面上的「${selectorKey}」元素...`, 'color: #fbbf24; font-size: 14px;');

  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.removeEventListener('click', handler, true);

    const el = e.target;
    let selector = '';

    if (el.id) {
      selector = `#${el.id}`;
    } else if (el.getAttribute('data-testid')) {
      selector = `[data-testid="${el.getAttribute('data-testid')}"]`;
    } else {
      // 產生一個相對唯一的選擇器
      const tag = el.tagName.toLowerCase();
      const cls = el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).join('.')
        : '';
      selector = tag + cls;
    }

    console.log(`%c找到: ${selector}`, 'color: #4ade80; font-size: 13px; font-weight: bold;');
    console.log('元素:', el);
    console.log(`%c請將 SEL.${selectorKey} 設為: '${selector}'`, 'color: #60a5fa;');

    // 直接設定
    SEL[selectorKey] = selector;
    console.log(`%c已自動設定 SEL.${selectorKey} = '${selector}'`, 'color: #4ade80;');
  };

  document.addEventListener('click', handler, true);
}

// 自動猜測常見的 BC Game 選擇器
function autoGuess() {
  console.log('%c嘗試自動猜測選擇器...', 'color: #fbbf24;');

  // 常見的下注輸入框模式
  const betInputGuesses = [
    'input[type="number"]',
    'input[name="bet"]',
    'input[name="amount"]',
    '[data-testid="bet-input"]',
    '.bet-input input',
    '.amount-input input',
  ];

  // 常見的按鈕模式
  const betBtnGuesses = [
    'button:not([disabled])',
  ];

  for (const sel of betInputGuesses) {
    const el = document.querySelector(sel);
    if (el) {
      console.log(`%c下注輸入框可能是: ${sel}`, 'color: #4ade80;');
      console.log('  元素:', el);
      SEL.betInput = sel;
      break;
    }
  }

  // 找按鈕 - 依文字內容
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    const text = btn.textContent.trim().toLowerCase();
    if (text.includes('bet') || text.includes('下注') || text.includes('start')) {
      const selector = generateSelector(btn);
      console.log(`%c下注按鈕可能是: ${selector} (文字: "${btn.textContent.trim()}")`, 'color: #4ade80;');
      SEL.betButton = selector;
    }
    if (text.includes('cashout') || text.includes('cash out') || text.includes('提現') || text.includes('取款')) {
      const selector = generateSelector(btn);
      console.log(`%c提現按鈕可能是: ${selector} (文字: "${btn.textContent.trim()}")`, 'color: #4ade80;');
      SEL.cashoutButton = selector;
    }
  }

  // 找格子 - 通常是一組相同 class 的 div/button，數量為 25
  const allElements = document.querySelectorAll('*');
  const classCount = {};
  for (const el of allElements) {
    if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim();
      if (cls) {
        classCount[cls] = (classCount[cls] || 0) + 1;
      }
    }
  }

  for (const [cls, count] of Object.entries(classCount)) {
    if (count === 25) {
      const firstClass = cls.split(/\s+/)[0];
      console.log(`%c25 個格子可能是: .${firstClass} (共 ${count} 個)`, 'color: #4ade80;');
      SEL.tiles = '.' + firstClass;
    }
  }

  console.log('%c目前的 SEL 設定:', 'color: #a78bfa;');
  console.table(SEL);
  console.log('%c如果有空的或不對的，請用 pickElement("key") 手動選取', 'color: #fbbf24;');
}

function generateSelector(el) {
  if (el.id) return `#${el.id}`;
  if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
  const tag = el.tagName.toLowerCase();
  const cls = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
    : '';
  return tag + cls;
}

// ============================================================
// 策略引擎
// ============================================================

const STATE = {
  running: false,
  currentBet: CONFIG.baseBet,
  lossStreak: 0,
  totalRounds: 0,
  wins: 0,
  losses: 0,
  resets: 0,
  initialBalance: null,
  history: [],
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function log(msg, type = 'info') {
  const colors = {
    info: '#e2e4ea',
    win: '#4ade80',
    lose: '#f87171',
    warn: '#fbbf24',
    action: '#60a5fa',
    reset: '#a78bfa',
  };
  const prefix = `[第${STATE.totalRounds + 1}局]`;
  console.log(`%c${prefix} ${msg}`, `color: ${colors[type] || colors.info};`);
}

function getBalance() {
  if (!SEL.balance) return null;
  const el = document.querySelector(SEL.balance);
  if (!el) return null;
  const text = el.textContent.replace(/[^0-9.]/g, '');
  return parseFloat(text) || null;
}

function setBetAmount(amount) {
  const input = document.querySelector(SEL.betInput);
  if (!input) throw new Error('找不到下注輸入框，請確認 SEL.betInput');

  // React 應用需要用 nativeInputValueSetter
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  ).set;
  nativeSetter.call(input, amount.toFixed(8));
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function clickElement(selector, description) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`找不到「${description}」，選擇器: ${selector}`);
  el.click();
  return el;
}

function getAvailableTiles() {
  if (!SEL.tiles) throw new Error('找不到格子選擇器，請確認 SEL.tiles');
  const all = document.querySelectorAll(SEL.tiles);
  // 過濾出還沒被點開的格子（通常是沒有 disabled/opened/revealed class 的）
  return Array.from(all).filter(tile => {
    const cls = tile.className || '';
    const hasOpened = /open|reveal|active|clicked|selected|disabled/i.test(cls);
    const isDisabled = tile.disabled || tile.getAttribute('aria-disabled') === 'true';
    return !hasOpened && !isDisabled;
  });
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function checkIfBusted() {
  // 檢查是否踩到地雷 - 通常頁面會有某種提示
  // 可能需要根據實際頁面調整
  const body = document.body.textContent || '';
  if (/bust|lose|lost|爆炸|失敗/i.test(body)) {
    return true;
  }

  // 或者檢查 cashout 按鈕是否消失
  const cashout = document.querySelector(SEL.cashoutButton);
  if (!cashout) return true;

  return false;
}

async function playOneRound() {
  STATE.totalRounds++;
  log(`下注 ${STATE.currentBet.toFixed(8)}`, 'action');

  // 1. 設定下注金額
  setBetAmount(STATE.currentBet);
  await sleep(500);

  // 2. 點擊下注按鈕
  clickElement(SEL.betButton, '下注按鈕');
  log('已按下注', 'action');
  await sleep(CONFIG.delayAfterBet);

  // 3. 開格子
  for (let i = 0; i < CONFIG.picks; i++) {
    const available = getAvailableTiles();
    if (available.length === 0) {
      log('沒有可點的格子', 'warn');
      return 'error';
    }

    // 隨機選一格
    const randomTile = available[Math.floor(Math.random() * available.length)];
    randomTile.click();
    log(`開第 ${i + 1} 格`, 'action');
    await sleep(CONFIG.delayBetweenClicks);

    // 檢查是否踩雷
    // 注意：這裡的判斷邏輯可能需要根據 BC Game 的實際 DOM 反應調整
    // 有些網站踩雷後整個遊戲面板會變化
  }

  // 4. 檢查結果
  await sleep(500);

  // 嘗試點 cashout
  const cashoutBtn = document.querySelector(SEL.cashoutButton);
  if (cashoutBtn && !cashoutBtn.disabled) {
    cashoutBtn.click();
    log(`贏了！Cashout 成功`, 'win');
    return 'win';
  } else {
    log(`踩雷了！`, 'lose');
    return 'lose';
  }
}

async function runStrategy() {
  if (STATE.running) {
    console.log('%c策略已在執行中', 'color: #fbbf24;');
    return;
  }

  // 檢查選擇器是否都有設定
  const missing = Object.entries(SEL)
    .filter(([k, v]) => !v && k !== 'balance' && k !== 'minesInput')
    .map(([k]) => k);

  if (missing.length > 0) {
    console.log(`%c缺少選擇器: ${missing.join(', ')}`, 'color: #f87171; font-size: 14px;');
    console.log('%c請先執行 discoverSelectors() 或 autoGuess() 來設定', 'color: #fbbf24;');
    return;
  }

  STATE.running = true;
  STATE.currentBet = CONFIG.baseBet;
  STATE.lossStreak = 0;
  STATE.initialBalance = getBalance();

  console.log('%c========================================', 'color: #4ade80;');
  console.log('%c 踩地雷策略啟動', 'color: #4ade80; font-size: 16px; font-weight: bold;');
  console.log(`%c 底注: ${CONFIG.baseBet} | 地雷: ${CONFIG.mines} | 開格: ${CONFIG.picks}`, 'color: #e2e4ea;');
  console.log(`%c 輸了翻 ${CONFIG.multiOnLoss}x | 最多連輸 ${CONFIG.maxLossStreak} 把`, 'color: #e2e4ea;');
  console.log(`%c 最多跑 ${CONFIG.maxTotalRounds} 局`, 'color: #e2e4ea;');
  if (STATE.initialBalance) {
    console.log(`%c 起始餘額: ${STATE.initialBalance}`, 'color: #e2e4ea;');
  }
  console.log('%c========================================', 'color: #4ade80;');
  console.log('%c 隨時輸入 stop() 可以停止', 'color: #fbbf24; font-size: 14px;');
  console.log('');

  while (STATE.running && STATE.totalRounds < CONFIG.maxTotalRounds) {
    try {
      // 止損檢查
      if (CONFIG.stopLossAmount && STATE.initialBalance) {
        const current = getBalance();
        if (current && (STATE.initialBalance - current) >= CONFIG.stopLossAmount) {
          log(`觸發止損（虧損 ${(STATE.initialBalance - current).toFixed(8)}）`, 'warn');
          break;
        }
      }

      const result = await playOneRound();

      if (result === 'win') {
        STATE.wins++;
        STATE.currentBet = CONFIG.baseBet;
        STATE.lossStreak = 0;
      } else if (result === 'lose') {
        STATE.losses++;
        STATE.lossStreak++;

        if (STATE.lossStreak >= CONFIG.maxLossStreak) {
          log(`連輸 ${CONFIG.maxLossStreak} 把，重置底注`, 'reset');
          STATE.currentBet = CONFIG.baseBet;
          STATE.lossStreak = 0;
          STATE.resets++;
        } else {
          STATE.currentBet *= CONFIG.multiOnLoss;
          log(`下一局加注到 ${STATE.currentBet.toFixed(8)}（連輸 ${STATE.lossStreak}）`, 'warn');
        }
      } else if (result === 'error') {
        log('發生錯誤，暫停 5 秒後重試', 'warn');
        await sleep(5000);
        continue;
      }

      // 印出當前狀態
      const bal = getBalance();
      const balStr = bal ? ` | 餘額: ${bal}` : '';
      console.log(
        `%c[統計] 勝${STATE.wins} 負${STATE.losses} 勝率${((STATE.wins / (STATE.wins + STATE.losses)) * 100).toFixed(1)}% 重置${STATE.resets}次${balStr}`,
        'color: #a78bfa;'
      );

      await sleep(CONFIG.delayBetweenRounds);

    } catch (err) {
      log(`錯誤: ${err.message}`, 'lose');
      console.error(err);
      log('暫停 5 秒後重試...', 'warn');
      await sleep(5000);
    }
  }

  STATE.running = false;
  printSummary();
}

function stop() {
  STATE.running = false;
  console.log('%c已停止策略', 'color: #f87171; font-size: 16px; font-weight: bold;');
  printSummary();
}

function printSummary() {
  const total = STATE.wins + STATE.losses;
  const bal = getBalance();

  console.log('%c========================================', 'color: #a78bfa;');
  console.log('%c 策略結算', 'color: #a78bfa; font-size: 16px; font-weight: bold;');
  console.log(`%c 總局數: ${total}`, 'color: #e2e4ea;');
  console.log(`%c 勝: ${STATE.wins} | 負: ${STATE.losses}`, 'color: #e2e4ea;');
  console.log(`%c 勝率: ${total ? ((STATE.wins / total) * 100).toFixed(1) : 0}%`, 'color: #e2e4ea;');
  console.log(`%c 連輸重置: ${STATE.resets} 次`, 'color: #e2e4ea;');
  if (STATE.initialBalance && bal) {
    const pnl = bal - STATE.initialBalance;
    console.log(`%c 盈虧: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(8)}`, `color: ${pnl >= 0 ? '#4ade80' : '#f87171'};`);
  }
  console.log('%c========================================', 'color: #a78bfa;');
}

function status() {
  const total = STATE.wins + STATE.losses;
  const bal = getBalance();
  console.log(`%c[狀態] 執行中: ${STATE.running} | 局數: ${total} | 勝${STATE.wins} 負${STATE.losses} | 當前注: ${STATE.currentBet.toFixed(8)} | 連輸: ${STATE.lossStreak}`, 'color: #60a5fa;');
  if (bal) console.log(`%c[餘額] ${bal}`, 'color: #60a5fa;');
}

// ============================================================
// 使用說明
// ============================================================
console.log('%c=============================================', 'color: #4ade80;');
console.log('%c  BC Game 踩地雷自動策略腳本已載入', 'color: #4ade80; font-size: 16px; font-weight: bold;');
console.log('%c=============================================', 'color: #4ade80;');
console.log('');
console.log('%c使用步驟：', 'color: #fbbf24; font-size: 14px; font-weight: bold;');
console.log('%c1. 先確認你在 BC Game 的踩地雷頁面', 'color: #e2e4ea;');
console.log('%c2. 執行 discoverSelectors() 查看頁面元素', 'color: #e2e4ea;');
console.log('%c3. 執行 autoGuess() 自動猜測選擇器', 'color: #e2e4ea;');
console.log('%c4. 或用 pickElement("betInput") 等手動選取', 'color: #e2e4ea;');
console.log('%c5. 確認 SEL 都設好後，執行 runStrategy()', 'color: #e2e4ea;');
console.log('%c6. 隨時執行 stop() 停止', 'color: #e2e4ea;');
console.log('');
console.log('%c其他指令：', 'color: #fbbf24;');
console.log('%c  status()  — 查看當前狀態', 'color: #e2e4ea;');
console.log('%c  stop()    — 停止策略', 'color: #e2e4ea;');
console.log('%c  SEL       — 查看/修改選擇器', 'color: #e2e4ea;');
console.log('%c  CONFIG    — 查看/修改策略參數', 'color: #e2e4ea;');
console.log('');
