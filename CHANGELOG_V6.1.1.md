# CHANGELOG — V6.1.1

## 緊急修正
- 修正 V6.1.0 主頁／開始練習像當掉的問題。
- 不再等待所有鋼琴音源 preload 完成才開始動畫。
- 練習啟動加入 900ms 上限，畫面優先開始移動。
- AudioContext 改成需要時、由使用者操作後才啟動。

## 新增：錯誤診斷
- 全域 JavaScript error 捕捉
- unhandled Promise rejection 捕捉
- 圖片／JS／CSS／音源資源載入失敗捕捉
- NETWORK / AUDIO / MIC / STORAGE / JAVASCRIPT / SYNTAX 分類
- 顯示時間、版本、檔案、行號、錯誤訊息與建議方向
- 錯誤保存在瀏覽器 localStorage
- 一鍵「複製錯誤報告」
- 一鍵清除紀錄
- 主頁新增錯誤狀態按鈕，正常顯示 ✓，有錯誤顯示 ⚠ 數量

## 版本
- 所有可見版本號同步 V6.1.1
