# CHANGELOG — V6.1.2

## 練習頁面
- 五線譜放大約 2 倍。
- 五線之間距離由約 22px 提升到 40px。
- 音符、符桿、連桿、譜號、拍號同步放大。
- 高音譜表／低音譜表重新配置，避免畫面過度留白。
- 音符位置改為正規 line/space 計算：
  - Treble bottom line = E4
  - Bass bottom line = G2
  - 每一個 diatonic step = 半個 staff space
- 修正音符不在五線譜線／間中央的問題。

## 主頁無法點擊
- drawer mask 預設 pointer-events:none。
- ready overlay 預設 pointer-events:none。
- score / playhead 不接收滑鼠事件。
- 啟動時清除殘留遮罩狀態。
- 控制列、琴鍵、頂部按鈕保持在可點擊層。

## 錯誤診斷
- 發生錯誤立即跳出可見錯誤視窗。
- 顯示錯誤分類、訊息、版本、檔案與行號。
- 提供「查看錯誤」與「複製錯誤報告」。
- 原有錯誤診斷抽屜與 localStorage 記錄保留。

## 版本
- 網站、README、VERSION、CHANGELOG 全部同步 V6.1.2。
