# PIANO LEARNING 6.1.1

## 本版重點：Hi‑Fi Piano Audio Engine
6.1.1 正式加入「網站自有高音質三角鋼琴 multi-sample」架構。

### 已完成
- 音源不依賴外部 CDN
- 新增 `js/audio-engine.js`
- 新增 Auto / Hi‑Fi / Demo 三種音質模式
- Hi‑Fi 音源採 lazy loading
- 依實際音符只載入需要的 sample
- 依 MIDI velocity 自動選 4 個力度層
- 採樣根音之間使用 Web Audio playback-rate 插值
- Hi‑Fi 缺檔時自動回退 Demo，網站不會掛掉
- 保留 V6.0.1 正規大五線譜、拍點線、由右往左移動、鋼琴鍵同步高亮

### 為什麼壓縮檔沒有直接塞 1GB 原始音源
Salamander Grand Piano V3 的原始 48k/24-bit WAV 約 1GB 級。
GitHub Pages 初期不適合把整個母帶庫塞進網站。

6.1.1 採「約 20～25MB 四力度 Web Profile」架構；
安裝方式見 `tools/INSTALL_HIFI_PIANO.md`。

### 授權
Hi‑Fi profile 預留 Salamander Grand Piano V3：
Alexander Holm / Yamaha C5 / CC BY 3.0。
詳見 `licenses/SALAMANDER_CC-BY-3.0.md`。


## V6.1.1 穩定性與錯誤診斷
- 修正 V6.1.0 開始練習時等待音源 preload，手機看起來像「主頁當掉」的問題。
- 練習啟動不再等待整批音源下載；最多等待約 0.9 秒後畫面先動，音源背景載入。
- AudioContext 不再於頁面載入時強制啟動，避免手機瀏覽器自動播放限制造成卡住。
- 新增錯誤診斷抽屜。
- 自動捕捉 JavaScript、Promise、網路資源、音源、麥克風與儲存錯誤。
- 可一鍵複製完整錯誤報告，方便後續交給 AI 修正。
