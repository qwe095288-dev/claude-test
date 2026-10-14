"""
國防部全民國防教育有獎徵答 — 自動答題腳本

安裝：
  pip install playwright
  playwright install chromium

執行：
  python quiz_bot.py

原理：
  1. 首次遇到未知題目 → 從選項 1 開始試，答錯記錄後換下一個
  2. 正確答案存入 quiz_answers.json，下次直接秒答
  3. 跑愈多輪，答案庫愈完整，之後每輪都能全對
"""

import asyncio
import json
import os
from playwright.async_api import async_playwright

# ━━ 設定 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANSWERS_FILE = "quiz_answers.json"            # 答案庫存檔
BASE_URL = "https://gpwd.mnd.gov.tw/reward"
REPEAT = 5                                    # 重複幾輪（改 0 = 無限）
DELAY = 0.8                                   # 每步間隔秒數
HEADLESS = False                              # True = 背景執行不開視窗
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def load_answers() -> dict:
    """從 JSON 檔載入已知答案"""
    if os.path.exists(ANSWERS_FILE):
        with open(ANSWERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_answers(data: dict):
    """儲存答案庫到 JSON 檔"""
    with open(ANSWERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


async def wait_ready(page, sec=DELAY):
    """等頁面載入完成 + 額外延遲"""
    await page.wait_for_load_state("domcontentloaded")
    await asyncio.sleep(sec)


async def get_state(page) -> str:
    """偵測畫面狀態: question / correct / wrong / other"""
    return await page.evaluate("""() => {
        const s1 = document.getElementById('Show1');
        const s2 = document.getElementById('Show2');
        const s3 = document.getElementById('Show3');
        if (!s1 && !s2 && !s3) return 'other';
        if (s2 && s2.style.display !== 'none') return 'correct';
        if (s3 && s3.style.display !== 'none') return 'wrong';
        if (s1 && s1.style.display !== 'none') return 'question';
        return 'other';
    }""")


async def get_question(page) -> str:
    """取得目前題目文字"""
    el = page.locator(".question2")
    if await el.count() > 0:
        return (await el.inner_text()).strip()
    return ""


async def start_quiz(page):
    """從首頁進入答題"""
    await page.goto(f"{BASE_URL}/gameindex.aspx", wait_until="domcontentloaded")
    await asyncio.sleep(1)

    # 嘗試多種方式找「開始答題 Go」按鈕
    for selector in [
        "a[href*='gameplay']",
        "img[alt*='開始']",
        "text=開始答題",
        "text=開始",
    ]:
        try:
            loc = page.locator(selector).first
            if await loc.count() > 0:
                await loc.click()
                await wait_ready(page, 1.5)
                return
        except Exception:
            continue

    # 全都找不到 → 直接導航
    await page.goto(f"{BASE_URL}/gameplay.aspx", wait_until="domcontentloaded")
    await asyncio.sleep(1)


async def answer_one(page, db: dict) -> bool:
    """
    處理一道題目，含答錯自動重試。
    回傳 True = 此題完成（答對並跳下一題）
    回傳 False = 離開答題流程（9 題都答完或異常）
    """
    for _ in range(8):  # 4 個選項最多試 4 次，給點餘裕
        await wait_ready(page)
        state = await get_state(page)

        # ── 已離開答題頁 ──
        if state == "other":
            return False

        # ── 答對畫面：快速跳下一題 ──
        if state == "correct":
            await page.click("#imgBack2")
            await wait_ready(page)
            return True

        # ── 答錯畫面：點繼續重試 ──
        if state == "wrong":
            await page.click("#imgBack")
            await wait_ready(page)
            continue

        # ── 題目畫面 ──
        question = await get_question(page)
        if not question:
            return False

        entry = db.get(question, {"wrong": []})
        correct = entry.get("correct")
        wrong_list = entry.get("wrong", [])

        # 決定要點哪個選項
        if correct:
            choice = correct
            print(f"      📖 已知答案 → 選項 {choice}")
        else:
            # 挑第一個還沒試過的
            choice = next((i for i in range(1, 5) if i not in wrong_list), 1)
            print(f"      🔍 嘗試 → 選項 {choice}")

        # 點選答案
        btn = page.locator(f"#Ans{choice}")
        if await btn.count() == 0:
            print(f"      ⚠ 找不到 #Ans{choice}")
            return False

        await btn.click()
        await wait_ready(page)

        result = await get_state(page)

        if result == "correct":
            # 記錄正確答案
            db[question] = {"correct": choice, "wrong": wrong_list}
            save_answers(db)
            print(f"      ✅ 正確！（選項 {choice}）")
            await page.click("#imgBack2")
            await wait_ready(page)
            return True

        if result == "wrong":
            # 記錄錯誤選項
            if question not in db:
                db[question] = {"wrong": []}
            if choice not in db[question].get("wrong", []):
                db[question].setdefault("wrong", []).append(choice)
            save_answers(db)
            print(f"      ❌ 選項 {choice} 錯誤")
            await page.click("#imgBack")
            await wait_ready(page)
            continue

        # 其他狀態（可能跳頁了）
        return result == "question"

    print("      ⚠ 重試次數過多，跳過")
    return False


async def run_one_round(page, db: dict, round_num: int):
    """執行一輪 9 題"""
    print(f"\n{'━'*50}")
    print(f"  🎯 第 {round_num} 輪")
    print(f"{'━'*50}")

    await start_quiz(page)

    completed = 0
    for q in range(1, 10):
        # 讀取題目文字
        await wait_ready(page, 0.3)
        question = await get_question(page)
        short = (question[:45] + "…") if len(question) > 45 else question
        print(f"\n    [{q}/9] {short}")

        ok = await answer_one(page, db)
        if ok:
            completed += 1
        else:
            state = await get_state(page)
            if state == "other":
                print("    → 已離開答題頁（可能 9 題全部完成）")
                completed = q  # 算完成
                break

    print(f"\n  ✅ 第 {round_num} 輪結束（完成 {completed} 題）")
    print(f"  📚 答案庫累計 {len(db)} 題")


async def main():
    db = load_answers()
    known = len(db)
    print(f"🚀 國防常識有獎徵答 — 自動答題腳本")
    print(f"📚 答案庫：已收錄 {known} 題")
    if REPEAT > 0:
        print(f"🔄 預計執行 {REPEAT} 輪")
    else:
        print(f"🔄 無限執行（Ctrl+C 停止）")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)
        ctx = await browser.new_context()
        page = await ctx.new_page()

        round_num = 0
        try:
            while True:
                round_num += 1
                if REPEAT > 0 and round_num > REPEAT:
                    break
                await run_one_round(page, db, round_num)
                await asyncio.sleep(2)
        except KeyboardInterrupt:
            print("\n\n⏹ 使用者中斷")

        new_learned = len(db) - known
        print(f"\n{'━'*50}")
        print(f"📊 本次新學到 {new_learned} 題，答案庫共 {len(db)} 題")
        print(f"{'━'*50}")

        input("\n按 Enter 關閉瀏覽器...")
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
