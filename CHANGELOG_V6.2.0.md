# CHANGELOG — V6.2.0

## 架構重構
- Score / Transport / Playhead / Scroller / Metronome / Keyboard / Audio 分離。
- Transport 成為唯一主時間軸。
- 各模組不再自己計時，降低節拍與畫面不同步問題。

## 預備四拍
- 紅線預設在左側。
- 按開始後進行 4 拍 Count-in。
- 4 拍期間紅線由左向右移到正式拍點。
- 4 拍結束後紅線固定。
- 正式播放後只有樂譜由右往左移動。

## 樂譜
- 重新調整大譜表比例。
- 重新調整音符頭、符桿與拍號比例。
- 音符位置仍使用 Treble E4 / Bass G2 正規錨點。
- 升降記號獨立渲染。
- Beam slope 加入上限，不會再產生巨大斜線。
- ScoreModel 與 ScoreRenderer 分離。

## 練習同步
- 節拍器、樂譜移動、判定線、鍵盤高亮共用 Master Clock。
- BPM 改變由 Transport 統一處理。

## 錯誤診斷
- 保留即時錯誤視窗。
- app 初始化錯誤會直接送入診斷系統。

## 版本
- 網站、README、VERSION、CHANGELOG 全部同步 V6.2.0。
