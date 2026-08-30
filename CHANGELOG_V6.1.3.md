# CHANGELOG — V6.1.3

## 主頁完全沒反應：重新修正
- 重新處理透明遮罩：drawer mask 未開啟時使用 visibility:hidden + pointer-events:none。
- ready overlay 未顯示時不接收任何滑鼠／觸控事件。
- 樂譜 SVG、樂譜移動層、判定線全部不接收指標事件。
- 頂部按鈕、控制列、琴鍵與抽屜強制保持可點擊層。
- 啟動時自動清除殘留遮罩狀態。

## 即時錯誤跳窗
- 在 index.html 加入獨立的 Boot Error Modal。
- 即使 app.js 本身語法錯誤或初始化失敗，仍可跳出錯誤視窗。
- 捕捉：
  - JavaScript error
  - unhandled Promise rejection
  - JS/CSS/音源/圖片資源載入失敗
- 1.8 秒內主程式未完成初始化時，自動跳窗提示。
- 提供查看錯誤診斷、複製錯誤、關閉。
- 錯誤紀錄改為 V6.1.3 獨立儲存，不再把舊版本錯誤數量混進來。

## 五線譜
- 在 V6.1.2 基礎上再放大約 2 倍。
- 五線間距提升到 80 SVG units。
- 音符頭、符桿、連桿、譜號、拍號同步放大。
- 高音譜表底線仍以 E4 為基準。
- 低音譜表底線仍以 G2 為基準。
- 每個音符固定落在正式的線／間位置。

## 版本
- 頁面、VERSION、README、CHANGELOG 同步 V6.1.3。
